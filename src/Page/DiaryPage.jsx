import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth'
import { dayLabel, formatTime } from '../lib/dates'
import { listEntries } from '../lib/diaryStore'
import BackHome from '../components/BackHome'

// [{ label: 'Today', entries: [...] }, ...] keeping newest first
const groupByDay = (entries) => entries.reduce((groups, entry) => {
    const label = dayLabel(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
    return groups;
}, []);

const EntryCard = ({ entry }) => (
    <Link to={`/diary/${entry.id}`} className="block bg-card border border-hairline rounded-[20px] p-5 hover:border-leaf transition-colors">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-body">
            <span>{formatTime(entry.createdAt)}</span>
            {entry.isPrivate && (
                <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">lock</span>
                    Private
                </span>
            )}
            {entry.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-mint text-forest text-[12px] font-medium">{tag}</span>
            ))}
        </div>
        <p className="mt-2 font-serif text-[16px] leading-relaxed text-heading line-clamp-2">{entry.body}</p>
    </Link>
)

const DiaryList = () => {

    const [state, setState] = useState({ status: 'loading', entries: [] });
    const location = useLocation();

    const load = useCallback(() => listEntries()
        .then((entries) => setState({ status: 'ready', entries }))
        .catch((error) => {
            console.error('Loading the diary failed:', error.message);
            setState({ status: 'error', entries: [] });
        }), []);

    useEffect(() => {
        load();
    }, [load]);

    const handleRetry = () => {
        setState({ status: 'loading', entries: [] });
        load();
    }

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">My diary</h1>
                        <p className="text-[15px] text-body">Only you can see these.</p>
                    </div>
                    <Link to="/diary/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                        New entry
                    </Link>
                </header>

                {location.state?.deleted && <p role="status" className="text-[14px] text-forest">Entry deleted.</p>}

                {state.status === 'loading' && <p role="status" className="text-[15px] text-body">Opening your diary…</p>}

                {state.status === 'error' && (
                    <div role="alert" className="p-5 rounded-[20px] bg-card border border-hairline flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-heading">We couldn’t load your diary. Check your connection.</p>
                        <button type="button" onClick={handleRetry} className="text-[14px] font-semibold text-forest hover:underline">Try again</button>
                    </div>
                )}

                {state.status === 'ready' && state.entries.length === 0 && (
                    <div className="p-8 rounded-[20px] bg-card border border-hairline text-center flex flex-col items-center gap-2 animate-fade-in">
                        <span className="w-14 h-14 rounded-2xl bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                            <span className="material-symbols-outlined text-[28px]">book</span>
                        </span>
                        <h2 className="font-headline text-[20px] font-semibold">Your diary is empty</h2>
                        <p className="text-[15px] text-body max-w-sm">Write a few lines about today. It doesn’t have to be good.</p>
                    </div>
                )}

                {state.status === 'ready' && groupByDay(state.entries).map((group) => (
                    <section key={group.label} aria-labelledby={`day-${group.label}`} className="flex flex-col gap-3 animate-fade-in">
                        <h2 id={`day-${group.label}`} className="text-[14px] font-semibold text-body">{group.label}</h2>
                        <ul className="flex flex-col gap-3">
                            {group.entries.map((entry) => (
                                <li key={entry.id}><EntryCard entry={entry} /></li>
                            ))}
                        </ul>
                    </section>
                ))}
                <BackHome />
            </main>
        </div>
    )
}

const DiaryPage = () => (
    <RequireAuth>
        <DiaryList />
    </RequireAuth>
)

export default DiaryPage
