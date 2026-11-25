import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DiaryEditor from '../components/diary/DiaryEditor'
import SupportCard from '../components/diary/SupportCard'
import RequireAuth from '../components/RequireAuth'
import { formatEntryDate, formatTime } from '../lib/dates'
import { deleteEntry, getEntry, updateEntry } from '../lib/diaryStore'
import { mentionsCrisis } from '../lib/safety'
import BackHome from '../components/BackHome'

const outlineButtonClass = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-heading hover:border-leaf transition-colors disabled:opacity-60';

const EntryView = () => {

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    // Result of loading this entry: status is 'ready', 'missing' or 'error'
    const [loaded, setLoaded] = useState({ id: null, status: null, entry: null });
    const [mode, setMode] = useState('view');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(location.state?.justSaved ? 'Saved to your diary.' : null);

    useEffect(() => {
        let cancelled = false;
        getEntry(id)
            .then((entry) => {
                if (!cancelled) setLoaded({ id, status: entry ? 'ready' : 'missing', entry });
            })
            .catch((err) => {
                console.error('Loading the entry failed:', err.message);
                if (!cancelled) setLoaded({ id, status: 'error', entry: null });
            });
        return () => { cancelled = true; };
    }, [id]);

    const handleSave = async (values) => {
        setBusy(true);
        setError(null);
        try {
            const entry = await updateEntry(id, values);
            setLoaded({ id, status: 'ready', entry });
            setMode('view');
            setNotice('Changes saved.');
        } catch (err) {
            console.error('Saving the changes failed:', err.message);
            setError('We couldn’t save your changes. Check your connection and try again.');
        } finally {
            setBusy(false);
        }
    }

    const handleDelete = async () => {
        setBusy(true);
        setError(null);
        try {
            await deleteEntry(id);
            navigate('/diary', { replace: true, state: { deleted: true } });
        } catch (err) {
            console.error('Deleting the entry failed:', err.message);
            setError('We couldn’t delete this entry. Check your connection and try again.');
            setBusy(false);
            setMode('view');
        }
    }

    const backLink = (
        <Link to="/diary" className="inline-flex items-center gap-1 text-[14px] font-medium text-forest hover:underline">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            All entries
        </Link>
    );

    const isLoading = loaded.id !== id;
    const { entry } = loaded;

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                {backLink}

                {isLoading && <p role="status" className="text-[15px] text-body">Opening this entry…</p>}
                {!isLoading && loaded.status === 'missing' && <p className="text-[15px] text-body">This entry isn’t here. It may have been deleted.</p>}
                {!isLoading && loaded.status === 'error' && <p role="alert" className="text-[15px] text-heading">We couldn’t open this entry. Check your connection and refresh the page.</p>}

                {!isLoading && entry && (
                    <>
                        <header className="flex flex-col gap-2 animate-fade-in">
                            <p className="text-[13px] font-medium text-body">{formatTime(entry.createdAt)}</p>
                            <h1 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-[-0.025em]">{formatEntryDate(entry.createdAt)}</h1>
                            {notice && <p role="status" className="text-[14px] text-forest">{notice}</p>}
                        </header>

                        {mode === 'edit' ? (
                            <DiaryEditor initial={entry} submitLabel="Save changes" saving={busy} error={error} onSubmit={handleSave} onCancel={() => setMode('view')} />
                        ) : (
                            <>
                                {mentionsCrisis(entry.body) && <SupportCard />}

                                <article className="bg-card border border-hairline rounded-[20px] p-6 md:p-8 flex flex-col gap-4 animate-fade-in">
                                    {(entry.tags.length > 0 || entry.isPrivate) && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {entry.isPrivate && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-canvas text-[12px] text-body">
                                                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">lock</span>
                                                    Private
                                                </span>
                                            )}
                                            {entry.tags.map((tag) => (
                                                <span key={tag} className="px-3 py-1 rounded-full bg-mint text-forest text-[12px] font-medium">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="font-serif text-[18px] leading-relaxed text-heading whitespace-pre-wrap">{entry.body}</p>
                                </article>

                                {error && <p role="alert" className="p-3 rounded-xl bg-sun/15 text-[14px] text-heading">{error}</p>}

                                {mode === 'confirm-delete' ? (
                                    <div className="p-5 rounded-[20px] bg-card border border-hairline flex flex-col gap-3">
                                        <p className="text-[15px] text-heading">Delete this entry for good? This can’t be undone.</p>
                                        <div className="flex flex-wrap gap-3">
                                            <button type="button" onClick={handleDelete} disabled={busy} className="h-10 px-5 rounded-xl bg-forest text-on-primary text-[14px] font-medium hover:bg-forest/90 disabled:opacity-60">
                                                {busy ? 'Deleting…' : 'Delete entry'}
                                            </button>
                                            <button type="button" onClick={() => setMode('view')} disabled={busy} className={outlineButtonClass}>Keep it</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        <button type="button" onClick={() => { setNotice(null); setMode('edit'); }} className={outlineButtonClass}>
                                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                                            Edit
                                        </button>
                                        <button type="button" onClick={() => setMode('confirm-delete')} className={outlineButtonClass}>
                                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
                <BackHome />
            </main>
        </div>
    )
}

const DiaryEntryPage = () => (
    <RequireAuth>
        <EntryView />
    </RequireAuth>
)

export default DiaryEntryPage
