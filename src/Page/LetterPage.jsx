import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth'
import SealedEnvelope from '../components/letters/SealedEnvelope'
import { formatDateTime, formatDateTimeLong, timeUntil } from '../lib/dates'
import { deleteLetter, getLetter, getLetterBody, isReady, markLetterOpened } from '../lib/lettersStore'
import BackHome from '../components/BackHome'

const outlineButtonClass = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-heading hover:border-leaf transition-colors disabled:opacity-60';

const LetterView = () => {

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    // Result of loading this letter: status is 'ready', 'missing' or 'error'
    const [loaded, setLoaded] = useState({ id: null, status: 'loading', letter: null });
    // The words once the database releases them: idle, loading, ready or error
    const [bodyState, setBodyState] = useState({ status: 'idle', text: null });
    const [now, setNow] = useState(() => Date.now());
    const [reload, setReload] = useState(0);
    const [mode, setMode] = useState('view');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoaded({ id, status: 'loading', letter: null });
        setBodyState({ status: 'idle', text: null });
        getLetter(id)
            .then(async (letter) => {
                if (cancelled) return;
                setNow(Date.now());
                setLoaded({ id, status: letter ? 'ready' : 'missing', letter });
                if (!letter?.openedAt) return;
                // Already opened on an earlier visit: load the words again
                setBodyState({ status: 'loading', text: null });
                try {
                    const text = await getLetterBody(id);
                    if (cancelled) return;
                    setBodyState(text === null ? { status: 'error', text: null } : { status: 'ready', text });
                } catch (err) {
                    console.error('Loading the opened letter failed:', err.message);
                    if (!cancelled) setBodyState({ status: 'error', text: null });
                }
            })
            .catch((err) => {
                console.error('Loading the letter failed:', err.message);
                if (!cancelled) setLoaded({ id, status: 'error', letter: null });
            });
        return () => { cancelled = true; };
    }, [id, reload]);

    // While sealed, check the clock every half minute so it turns ready without a refresh
    useEffect(() => {
        if (!loaded.letter || loaded.letter.openedAt) return;
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, [loaded.letter]);

    const letter = loaded.letter;
    const readyToOpen = Boolean(letter) && !letter.openedAt && isReady(letter, now);
    const sealed = Boolean(letter) && !letter.openedAt && !readyToOpen;
    const reading = Boolean(letter) && (Boolean(letter.openedAt) || bodyState.status === 'ready');

    const handleOpen = async () => {
        setError(null);
        setBodyState({ status: 'loading', text: null });
        try {
            const text = await getLetterBody(id);
            if (text === null) {
                setBodyState({ status: 'idle', text: null });
                setError('The server says this letter isn’t ready yet. Check the date and try again in a minute.');
                return;
            }
            setBodyState({ status: 'ready', text });
            try {
                const updated = await markLetterOpened(id);
                setLoaded({ id, status: 'ready', letter: updated });
            } catch (err) {
                // The words are already on screen, so this is not worth interrupting for
                console.error('Recording the open failed:', err.message);
            }
        } catch (err) {
            console.error('Opening the letter failed:', err.message);
            setBodyState({ status: 'idle', text: null });
            setError('We couldn’t open this letter. Check your connection and try again.');
        }
    }

    const handleDelete = async () => {
        setBusy(true);
        setError(null);
        try {
            await deleteLetter(id);
            navigate('/letters', { replace: true, state: { deleted: true } });
        } catch (err) {
            console.error('Deleting the letter failed:', err.message);
            setError('We couldn’t delete this letter. Check your connection and try again.');
            setMode('view');
            setBusy(false);
        }
    }

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <Link to="/letters" className="inline-flex items-center gap-1 text-[14px] font-medium text-forest hover:underline">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
                    All letters
                </Link>

                <header className="animate-fade-in">
                    <p className="text-[13px] font-medium text-body">
                        {reading ? `Written ${formatDateTimeLong(letter.createdAt)}` : 'A note for later'}
                    </p>
                    <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">
                        {reading ? 'A letter from past you' : 'Letter to future you'}
                    </h1>
                </header>

                {location.state?.justSealed && !reading && (
                    <p role="status" className="text-[14px] text-forest">Sealed. It will wait for you.</p>
                )}

                {error && (
                    <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-sun/15 text-[14px] text-heading">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
                        {error}
                    </p>
                )}

                {(loaded.id !== id || loaded.status === 'loading') && (
                    <p role="status" className="text-[15px] text-body">Opening your letter…</p>
                )}

                {loaded.status === 'missing' && (
                    <div className="p-8 rounded-[20px] bg-card border border-hairline text-center flex flex-col items-center gap-2 animate-fade-in">
                        <span className="w-14 h-14 rounded-2xl bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                            <span className="material-symbols-outlined text-[28px]">draft</span>
                        </span>
                        <h2 className="font-headline text-[20px] font-semibold">This letter isn’t here</h2>
                        <p className="text-[15px] text-body">It may have been deleted.</p>
                        <Link to="/letters" className="mt-1 text-[14px] font-semibold text-forest hover:underline">Back to your letters</Link>
                    </div>
                )}

                {loaded.status === 'error' && (
                    <div role="alert" className="p-5 rounded-[20px] bg-card border border-hairline flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-heading">We couldn’t load this letter. Check your connection.</p>
                        <button type="button" onClick={() => setReload((count) => count + 1)} className="text-[14px] font-semibold text-forest hover:underline">Try again</button>
                    </div>
                )}

                {sealed && (
                    <article className="bg-card border border-hairline rounded-[20px] p-6 md:p-8 flex flex-col items-center gap-4 text-center animate-fade-in">
                        <SealedEnvelope className="w-48 h-32" />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-forest text-[12px] font-semibold">
                            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">lock</span>
                            Sealed
                        </span>
                        <h2 className="font-headline text-[22px] md:text-[24px] font-semibold">Opens {formatDateTimeLong(letter.opensAt)}</h2>
                        <p className="text-[15px] text-body max-w-md">
                            {timeUntil(letter.opensAt, now)}. The words are locked until then. You can close this page and come back any time.
                        </p>
                    </article>
                )}

                {readyToOpen && !reading && (
                    <article className="bg-mint border border-leaf/30 rounded-[20px] p-6 md:p-8 flex flex-col items-center gap-4 text-center animate-fade-in">
                        <span className="w-14 h-14 rounded-2xl bg-card text-forest flex items-center justify-center" aria-hidden="true">
                            <span className="material-symbols-outlined text-[30px]">mark_email_unread</span>
                        </span>
                        <h2 className="font-headline text-[24px] font-semibold">Ready to open</h2>
                        <p className="text-[15px] text-body max-w-md">Take a breath first if you want. The letter isn’t going anywhere.</p>
                        <button
                            type="button"
                            onClick={handleOpen}
                            disabled={bodyState.status === 'loading'}
                            className="h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {bodyState.status === 'loading' ? 'Opening…' : 'Open the letter'}
                        </button>
                    </article>
                )}

                {reading && (
                    <article className="bg-card border border-hairline rounded-[20px] p-6 md:p-8 flex flex-col gap-5 animate-fade-in">
                        {letter.openedAt && (
                            <p className="text-[13px] text-body">Opened {formatDateTime(letter.openedAt)}</p>
                        )}
                        {bodyState.text !== null ? (
                            <p className="font-serif text-[18px] leading-relaxed text-heading whitespace-pre-wrap">{bodyState.text}</p>
                        ) : bodyState.status === 'error' ? (
                            <div className="flex flex-col items-start gap-2">
                                <p className="text-[15px] text-heading">We couldn’t load the words. Check your connection and try again.</p>
                                <button type="button" onClick={handleOpen} className={outlineButtonClass}>Try again</button>
                            </div>
                        ) : (
                            <p role="status" className="text-[15px] text-body">Opening…</p>
                        )}
                    </article>
                )}

                {letter && mode === 'confirm-delete' && (
                    <div className="p-5 rounded-[20px] bg-card border border-hairline flex flex-col gap-3 animate-fade-in">
                        <p className="text-[15px] text-heading">Delete this letter for good? This can’t be undone.</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={busy}
                                className="h-10 px-4 rounded-xl bg-forest text-on-primary text-[14px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                                {busy ? 'Deleting…' : 'Delete it'}
                            </button>
                            <button type="button" onClick={() => setMode('view')} disabled={busy} className="h-10 px-3 rounded-lg text-[14px] font-medium text-body hover:text-heading disabled:opacity-60">
                                Keep it
                            </button>
                        </div>
                    </div>
                )}

                {letter && mode === 'view' && (
                    <div className="flex flex-wrap items-center gap-3">
                        {reading && (
                            <Link to="/letters/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors">
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                                Write back to future you
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setMode('confirm-delete');
                            }}
                            className={outlineButtonClass}
                        >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                            Delete letter
                        </button>
                    </div>
                )}
                <BackHome />
            </main>
        </div>
    )
}

const LetterPage = () => (
    <RequireAuth>
        <LetterView />
    </RequireAuth>
)

export default LetterPage
