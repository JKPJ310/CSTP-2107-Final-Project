import React from 'react'
import { Link } from 'react-router-dom'
import { Tile, TileHeader } from './Tile'

// status: 'loading' | 'error' | 'empty' | 'ready'
// entry (when ready): { id?, day, text, tags, time, isPrivate? }; no id means it's sample content
const DiaryTile = ({ status, entry, className, style }) => (
    <Tile labelledBy="diary-heading" className={className} style={style}>
        <TileHeader
            id="diary-heading"
            icon="book"
            title="My diary"
            aside={status === 'ready' && <span className="px-2.5 py-0.5 rounded-full bg-canvas border border-hairline text-[12px] text-body">Day {entry.day}</span>}
        />

        {status === 'loading' && <p role="status" className="mt-5 mb-5 text-[15px] text-body">Opening your diary…</p>}

        {status === 'error' && <p role="alert" className="mt-5 mb-5 text-[15px] text-heading">We couldn’t load your latest entry. Check your connection and refresh.</p>}

        {status === 'empty' && (
            <div className="mt-5 mb-5 flex flex-col gap-1">
                <p className="font-serif italic text-[17px] text-heading/80">Your diary is waiting for its first page.</p>
                <p className="text-[14px] text-body">Write a few lines about today. It doesn’t have to be good.</p>
            </div>
        )}

        {status === 'ready' && (
            <>
                <blockquote className="mt-5 pl-4 border-l-2 border-mint font-serif italic text-[17px] leading-relaxed text-heading/80 line-clamp-4">
                    {entry.id ? <Link to={`/diary/${entry.id}`} className="hover:text-heading">“{entry.text}”</Link> : <>“{entry.text}”</>}
                </blockquote>
                <ul aria-label="Tags" className="mt-4 mb-5 flex flex-wrap items-center gap-2">
                    {entry.isPrivate && (
                        <li className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas text-body text-[12px]">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
                            Private
                        </li>
                    )}
                    {entry.tags.map((tag) => (
                        <li key={tag} className="px-3 py-1 rounded-full bg-mint text-forest text-[12px] font-medium">{tag}</li>
                    ))}
                    <li className="px-2.5 py-1 rounded-full bg-canvas text-body text-[12px]">{entry.time}</li>
                </ul>
            </>
        )}

        <div className="mt-auto pt-5 border-t border-hairline flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
                <Link to="/diary/new" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-forest hover:underline">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                    New entry
                </Link>
                {status === 'ready' && entry.id && (
                    <Link to="/diary" className="text-[14px] text-body hover:text-heading">All entries</Link>
                )}
            </div>
            <Link to="/diary/new" aria-label="New voice entry" title="Voice entry" className="w-9 h-9 rounded-full flex items-center justify-center text-body hover:text-forest hover:bg-mint transition-colors">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">mic</span>
            </Link>
        </div>
    </Tile>
)

export default DiaryTile
