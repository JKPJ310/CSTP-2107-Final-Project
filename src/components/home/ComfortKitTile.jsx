import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useComfortKit } from '../../hooks/useComfortKit'
import { MAX_PHOTOS } from '../../lib/comfortStore'
import PhotoViewer from '../comfort/PhotoViewer'
import { Tile, TileHeader } from './Tile'

const slotClass = 'flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-canvas hover:bg-mint transition-colors text-center min-w-0';

const IconBubble = ({ icon, dashed }) => (
    <span className={`w-10 h-10 rounded-full bg-card border ${dashed ? 'border-dashed text-body' : 'text-forest'} border-hairline flex items-center justify-center`} aria-hidden="true">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </span>
)

const SlotLabel = ({ children, muted }) => (
    <span className={`text-[13px] font-medium truncate max-w-full ${muted ? 'text-body' : 'text-heading'}`}>{children}</span>
)

const TileFrame = ({ note, children, className, style }) => (
    <Tile labelledBy="comfort-heading" className={className} style={style}>
        <TileHeader
            id="comfort-heading"
            icon="favorite"
            title="Comfort kit"
            aside={<Link to="/comfort" className="text-[13px] font-medium text-forest hover:underline">Edit</Link>}
        />
        {children}
        <div className="mb-4" />
        <p className="mt-auto pt-4 border-t border-hairline text-center font-serif italic text-[15px] text-body">“{note}”</p>
    </Tile>
)

// The signed-in person's song and photos
const LiveComfortTile = ({ userId, note, className, style }) => {

    const { status, song, photos } = useComfortKit(userId);
    const [openPhoto, setOpenPhoto] = useState(null);
    const canAdd = !song || photos.length < MAX_PHOTOS;

    return (
        <TileFrame note={note} className={className} style={style}>
            {status === 'loading' && <p role="status" className="mt-5 text-[15px] text-body">Opening your comfort kit…</p>}
            {status === 'error' && <p role="alert" className="mt-5 text-[15px] text-heading">We couldn’t load your comfort kit. Check your connection and refresh.</p>}

            {status === 'ready' && (
                <>
                    {!song && photos.length === 0 && (
                        <p className="mt-5 text-[15px] text-body">Add a song or a couple of photos that help on hard days.</p>
                    )}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {song && (
                            <a href={song.url} target="_blank" rel="noopener noreferrer" className={slotClass}>
                                <IconBubble icon="headphones" />
                                <SlotLabel>{song.title ?? 'Your song'}</SlotLabel>
                                <span className="sr-only">(plays on YouTube, opens in a new tab)</span>
                            </a>
                        )}
                        {photos.map((photo) => (
                            <button key={photo.id} type="button" onClick={() => setOpenPhoto(photo)} className={slotClass} aria-label={`Open photo${photo.title ? `: ${photo.title}` : ''}`}>
                                {photo.photoUrl
                                    ? <img src={photo.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-hairline" />
                                    : <IconBubble icon="photo_library" />}
                                <SlotLabel>{photo.title ?? 'Photo'}</SlotLabel>
                            </button>
                        ))}
                        {canAdd && (
                            <Link to="/comfort" className={slotClass}>
                                <IconBubble icon="add" dashed />
                                <SlotLabel muted>Add</SlotLabel>
                            </Link>
                        )}
                    </div>
                </>
            )}
            <PhotoViewer photo={openPhoto} onClose={() => setOpenPhoto(null)} />
        </TileFrame>
    )
}

const ComfortKitTile = ({ note, className, style }) => {
    const { session } = useAuth();
    return <LiveComfortTile userId={session.user.id} note={note} className={className} style={style} />;
}

export default ComfortKitTile
