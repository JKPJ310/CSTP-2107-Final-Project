import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth'
import { formatDateTime, timeUntil } from '../lib/dates'
import { isReady, listLetters } from '../lib/lettersStore'
import BackHome from '../components/BackHome'

const cardClass = 'block bg-card border border-hairline rounded-[20px] p-5 hover:border-leaf transition-colors';

const ReadyCard = ({ letter }) => (
    <Link to={`/letters/${letter.id}`} className="block bg-mint border border-leaf/30 rounded-[20px] p-5 hover:border-leaf transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-forest">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">mark_email_unread</span>
                Ready to open
            </span>
            <span className="text-[13px] text-body">Written {formatDateTime(letter.createdAt)}</span>
        </div>
        <p className="mt-1 text-[14px] text-body">Open it whenever you’re ready.</p>
    </Link>
)

const SealedCard = ({ letter, now }) => (
    <Link to={`/letters/${letter.id}`} className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[15px] font-medium text-heading">
                <span className="material-symbols-outlined text-[20px] text-forest" aria-hidden="true">mark_email_read</span>
                Letter to future you
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-mint text-forest text-[12px] font-medium">
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
                Sealed
            </span>
        </div>
        <p className="mt-2 text-[14px] text-body">
            Opens {formatDateTime(letter.opensAt)} · {timeUntil(letter.opensAt, now)}
        </p>
    </Link>
)

const OpenedCard = ({ letter }) => (
    <Link to={`/letters/${letter.id}`} className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[15px] font-medium text-heading">
                <span className="material-symbols-outlined text-[20px] text-forest" aria-hidden="true">mail</span>
                Letter to future you
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-canvas text-body text-[12px] font-medium">Read</span>
        </div>
        <p className="mt-2 text-[14px] text-body">Opened {formatDateTime(letter.openedAt)} · Read again</p>
    </Link>
)

const LettersList = () => {

    const location = useLocation();
    const [state, setState] = useState({ status: 'loading', letters: [] });
    const [now, setNow] = useState(() => Date.now());

    const load = useCallback(() => {
        setState((current) => ({ ...current, status: 'loading' }));
        listLetters()
            .then((letters) => setState({ status: 'ready', letters }))
            .catch((error) => {
                console.error('Loading the letters failed:', error.message);
                setState({ status: 'error', letters: [] });
            });
    }, []);

    useEffect(() => { load(); }, [load]);

    // Re-check the clock every half minute, so a letter that unlocks while this page is open moves up
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const ready = [];
    const sealed = [];
    const opened = [];
    state.letters.forEach((letter) => {
        if (letter.openedAt) opened.push(letter);
        else if (isReady(letter, now)) ready.push(letter);
        else sealed.push(letter);
    });
    opened.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">Letters to future you</h1>
                        <p className="text-[15px] text-body">Sealed until the day you choose. Only you can open them.</p>
                    </div>
                    <Link to="/letters/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                        Write a letter
                    </Link>
                </header>

                {location.state?.deleted && <p role="status" className="text-[14px] text-forest">Letter deleted.</p>}

                {state.status === 'loading' && <p role="status" className="text-[15px] text-body">Opening your letters…</p>}

                {state.status === 'error' && (
                    <div role="alert" className="p-5 rounded-[20px] bg-card border border-hairline flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-heading">We couldn’t load your letters. Check your connection.</p>
                        <button type="button" onClick={load} className="text-[14px] font-semibold text-forest hover:underline">Try again</button>
                    </div>
                )}

                {state.status === 'ready' && state.letters.length === 0 && (
                    <div className="p-8 rounded-[20px] bg-card border border-hairline text-center flex flex-col items-center gap-2 animate-fade-in">
                        <span className="w-14 h-14 rounded-2xl bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                            <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
                        </span>
                        <h2 className="font-headline text-[20px] font-semibold">No letters yet</h2>
                        <p className="text-[15px] text-body max-w-sm">Write to the person you’ll be in a week, a month, or a year. It stays sealed until then.</p>
                    </div>
                )}

                {ready.length > 0 && (
                    <section aria-labelledby="letters-ready" className="flex flex-col gap-3 animate-fade-in">
                        <h2 id="letters-ready" className="text-[14px] font-semibold text-body">Ready to open</h2>
                        <ul className="flex flex-col gap-3">
                            {ready.map((letter) => <li key={letter.id}><ReadyCard letter={letter} /></li>)}
                        </ul>
                    </section>
                )}

                {sealed.length > 0 && (
                    <section aria-labelledby="letters-sealed" className="flex flex-col gap-3 animate-fade-in">
                        <h2 id="letters-sealed" className="text-[14px] font-semibold text-body">Sealed</h2>
                        <ul className="flex flex-col gap-3">
                            {sealed.map((letter) => <li key={letter.id}><SealedCard letter={letter} now={now} /></li>)}
                        </ul>
                    </section>
                )}

                {opened.length > 0 && (
                    <section aria-labelledby="letters-opened" className="flex flex-col gap-3 animate-fade-in">
                        <h2 id="letters-opened" className="text-[14px] font-semibold text-body">Opened</h2>
                        <ul className="flex flex-col gap-3">
                            {opened.map((letter) => <li key={letter.id}><OpenedCard letter={letter} /></li>)}
                        </ul>
                    </section>
                )}

                <p className="flex items-start gap-2 text-[13px] text-body">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">shield</span>
                    Your letters are private. They are never sent to the AI, and the words stay locked until the date you chose.
                </p>
                <BackHome />
            </main>
        </div>
    )
}

const LettersPage = () => (
    <RequireAuth>
        <LettersList />
    </RequireAuth>
)

export default LettersPage
