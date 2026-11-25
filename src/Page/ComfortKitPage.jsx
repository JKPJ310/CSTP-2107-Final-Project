import React, { useEffect, useState } from 'react'
import PhotoViewer from '../components/comfort/PhotoViewer'
import RequireAuth from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { useComfortKit } from '../hooks/useComfortKit'
import { isPhotoLimitError, MAX_PHOTO_MB, MAX_PHOTOS, PHOTO_TYPES } from '../lib/comfortStore'
import { normalizeYouTubeUrl } from '../lib/youtube'
import BackHome from '../components/BackHome'

const inputClass = 'w-full h-11 px-3 rounded-xl bg-canvas border border-hairline text-[15px] text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15';
const labelClass = 'block text-[14px] font-medium text-heading mb-1.5';
// Outlined, not filled: this page has several forms, and the brief allows one filled button per screen
const actionButtonClass = 'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-forest text-forest text-[14px] font-medium hover:bg-mint transition-colors disabled:opacity-60';
const quietButtonClass = 'h-10 px-3 rounded-xl text-[14px] font-medium text-body hover:text-heading hover:bg-canvas disabled:opacity-60';

const sectionClass = 'bg-card border border-hairline rounded-[20px] p-5 md:p-6 flex flex-col gap-4 animate-fade-in';

const SongSection = ({ song, onSave, onRemove }) => {

    const [mode, setMode] = useState(song ? 'view' : 'edit');
    const [link, setLink] = useState(song?.url ?? '');
    const [title, setTitle] = useState(song?.title ?? '');
    const [linkError, setLinkError] = useState(null);
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = normalizeYouTubeUrl(link);
        if (!url) {
            setLinkError('That doesn’t look like a YouTube link. On YouTube, tap Share, then Copy link.');
            document.getElementById('song-link')?.focus();
            return;
        }
        setBusy(true);
        const ok = await onSave({ title, url });
        setBusy(false);
        if (ok) setMode('view');
    }

    const handleRemove = async () => {
        setBusy(true);
        const ok = await onRemove(song);
        setBusy(false);
        if (ok) {
            setLink('');
            setTitle('');
            setMode('edit');
        } else {
            setMode('view');
        }
    }

    return (
        <section aria-labelledby="song-heading" className={sectionClass}>
            <div>
                <h2 id="song-heading" className="font-headline text-[18px] font-semibold">Your song</h2>
                <p className="text-[14px] text-body">A song that helps. It opens on YouTube when you tap it.</p>
            </div>

            {mode === 'edit' && (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="song-link" className={labelClass}>YouTube link</label>
                        <input
                            id="song-link"
                            type="url"
                            inputMode="url"
                            value={link}
                            onChange={(e) => {
                                setLink(e.target.value);
                                setLinkError(null);
                            }}
                            placeholder="https://youtu.be/…"
                            aria-invalid={Boolean(linkError)}
                            aria-describedby={linkError ? 'song-link-error' : undefined}
                            className={inputClass}
                        />
                        {linkError && <p id="song-link-error" className="mt-1.5 text-[13px] font-medium text-heading">{linkError}</p>}
                    </div>
                    <div>
                        <label htmlFor="song-title" className={labelClass}>Name <span className="font-normal text-body">(optional)</span></label>
                        <input id="song-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Weightless" className={inputClass} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={busy || !link.trim()} className={actionButtonClass}>{busy ? 'Saving…' : 'Save song'}</button>
                        {song && <button type="button" onClick={() => setMode('view')} disabled={busy} className={quietButtonClass}>Cancel</button>}
                    </div>
                </form>
            )}

            {mode !== 'edit' && song && (
                <div className="flex flex-col gap-3">
                    <a href={song.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 rounded-xl bg-canvas hover:bg-mint transition-colors">
                        <span className="w-10 h-10 shrink-0 rounded-full bg-card border border-hairline text-forest flex items-center justify-center" aria-hidden="true">
                            <span className="material-symbols-outlined text-[20px]">headphones</span>
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-[15px] font-medium text-heading truncate">{song.title ?? 'Your song'}</span>
                            <span className="text-[13px] text-body">Play on YouTube <span className="sr-only">(opens in a new tab)</span></span>
                        </span>
                        <span className="material-symbols-outlined ml-auto text-[18px] text-body" aria-hidden="true">open_in_new</span>
                    </a>
                    {mode === 'confirm-remove' ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] text-heading mr-2">Remove this song?</p>
                            <button type="button" onClick={handleRemove} disabled={busy} className={actionButtonClass}>{busy ? 'Removing…' : 'Remove'}</button>
                            <button type="button" onClick={() => setMode('view')} disabled={busy} className={quietButtonClass}>Keep it</button>
                        </div>
                    ) : (
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setMode('edit')} className={quietButtonClass}>Change</button>
                            <button type="button" onClick={() => setMode('confirm-remove')} className={quietButtonClass}>Remove</button>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}

const PhotoCard = ({ photo, onOpen, onRemove }) => {

    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleRemove = async () => {
        setBusy(true);
        const ok = await onRemove(photo);
        if (!ok) {
            setBusy(false);
            setConfirming(false);
        }
    }

    return (
        <li className="flex flex-col gap-2">
            <button type="button" onClick={() => onOpen(photo)} className="block aspect-square rounded-xl overflow-hidden bg-canvas focus-visible:ring-3 focus-visible:ring-leaf/40" aria-label={`Open photo${photo.title ? `: ${photo.title}` : ''}`}>
                {photo.photoUrl
                    ? <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[13px] text-body">Couldn’t load this photo</span>}
            </button>
            {photo.title && <p className="font-serif italic text-[15px] text-heading">{photo.title}</p>}
            {confirming ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleRemove} disabled={busy} className={actionButtonClass}>{busy ? 'Removing…' : 'Remove'}</button>
                    <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={quietButtonClass}>Keep it</button>
                </div>
            ) : (
                <button type="button" onClick={() => setConfirming(true)} className={`${quietButtonClass} self-start`}>Remove</button>
            )}
        </li>
    )
}

const AddPhotoForm = ({ onAdd }) => {

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState('');
    const [fileError, setFileError] = useState(null);
    const [busy, setBusy] = useState(false);

    // Release the preview's memory when it changes or the form closes
    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setCaption('');
    }

    const handlePick = (e) => {
        const picked = e.target.files[0];
        e.target.value = '';
        if (!picked) return;
        if (!PHOTO_TYPES[picked.type]) {
            setFileError('Please choose a JPG, PNG or WebP image.');
            return;
        }
        if (picked.size > MAX_PHOTO_MB * 1024 * 1024) {
            setFileError(`Please choose an image under ${MAX_PHOTO_MB} MB.`);
            return;
        }
        setFileError(null);
        setFile(picked);
        setPreviewUrl(URL.createObjectURL(picked));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await onAdd(file, caption);
        setBusy(false);
        if (ok) reset();
    }

    if (!file) {
        return (
            <div className="flex flex-col gap-2">
                <label className={`${actionButtonClass} self-start cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-leaf/30`}>
                    <input type="file" accept={Object.keys(PHOTO_TYPES).join(',')} onChange={handlePick} className="sr-only" />
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_photo_alternate</span>
                    Choose a photo
                </label>
                {fileError && <p role="alert" className="text-[13px] font-medium text-heading">{fileError}</p>}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <img src={previewUrl} alt="Preview of the photo you chose" className="w-32 h-32 rounded-xl object-cover bg-canvas" />
            <div className="flex-1 flex flex-col gap-3">
                <div>
                    <label htmlFor="photo-caption" className={labelClass}>Caption <span className="font-normal text-body">(optional)</span></label>
                    <input id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={80} placeholder="e.g. Lake trip, summer 2025" className={inputClass} />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={busy} className={actionButtonClass}>{busy ? 'Adding…' : 'Add photo'}</button>
                    <button type="button" onClick={reset} disabled={busy} className={quietButtonClass}>Cancel</button>
                </div>
            </div>
        </form>
    )
}

const ComfortKitManager = () => {

    const { session } = useAuth();
    const { status, song, photos, saveSong, addPhoto, remove, reload } = useComfortKit(session.user.id);
    const [message, setMessage] = useState('');
    const [openPhoto, setOpenPhoto] = useState(null);

    // Each action returns true when it worked, so a form can reset or close
    const run = async (action, label, success) => {
        setMessage('');
        try {
            await action();
            setMessage(success);
            return true;
        } catch (error) {
            console.error(`${label} failed:`, error.message);
            setMessage(isPhotoLimitError(error)
                ? `You already have ${MAX_PHOTOS} photos. Remove one to add another.`
                : 'That didn’t save. Check your connection and try again.');
            return false;
        }
    }

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="animate-fade-in">
                    <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">Comfort kit</h1>
                    <p className="text-[15px] text-body">Things that help on hard days, one tap away from home. Only you can see them.</p>
                </header>

                {status === 'loading' && <p role="status" className="text-[15px] text-body">Opening your comfort kit…</p>}

                {status === 'error' && (
                    <div role="alert" className="p-5 rounded-[20px] bg-card border border-hairline flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-heading">We couldn’t load your comfort kit. Check your connection.</p>
                        <button type="button" onClick={reload} className="text-[14px] font-semibold text-forest hover:underline">Try again</button>
                    </div>
                )}

                {status === 'ready' && (
                    <>
                        <SongSection
                            song={song}
                            onSave={(values) => run(() => saveSong(values), 'Saving the song', 'Song saved.')}
                            onRemove={(item) => run(() => remove(item), 'Removing the song', 'Song removed.')}
                        />

                        <section aria-labelledby="photos-heading" className={sectionClass}>
                            <div>
                                <h2 id="photos-heading" className="font-headline text-[18px] font-semibold">Photos</h2>
                                <p className="text-[14px] text-body">Up to {MAX_PHOTOS} photos that make you feel safe or happy.</p>
                            </div>
                            {photos.length > 0 && (
                                <ul className="grid grid-cols-2 gap-4">
                                    {photos.map((photo) => (
                                        <PhotoCard
                                            key={photo.id}
                                            photo={photo}
                                            onOpen={setOpenPhoto}
                                            onRemove={(item) => run(() => remove(item), 'Removing a photo', 'Photo removed.')}
                                        />
                                    ))}
                                </ul>
                            )}
                            {photos.length < MAX_PHOTOS
                                ? <AddPhotoForm onAdd={(file, caption) => run(() => addPhoto(file, caption), 'Adding a photo', 'Photo added.')} />
                                : <p className="text-[14px] text-body">That’s {MAX_PHOTOS} photos. Remove one to add another.</p>}
                        </section>

                        <p role="status" className="min-h-5 text-[13px] text-forest">{message}</p>
                    </>
                )}
                <BackHome />
            </main>
            <PhotoViewer photo={openPhoto} onClose={() => setOpenPhoto(null)} />
        </div>
    )
}

const ComfortKitPage = () => (
    <RequireAuth>
        <ComfortKitManager />
    </RequireAuth>
)

export default ComfortKitPage
