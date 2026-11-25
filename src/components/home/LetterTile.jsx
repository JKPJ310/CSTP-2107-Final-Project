import React from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, timeUntil } from '../../lib/dates'
import SealedEnvelope from '../letters/SealedEnvelope'
import { Tile, TileHeader } from './Tile'

const primaryLinkClass = 'inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-forest text-on-primary text-[14px] font-medium hover:bg-forest/90 transition-colors';
const quietLinkClass = 'text-[14px] font-semibold text-forest hover:underline';

// What the tile says for each state: empty, sealed, ready to open, or all read
const tileContent = (summary) => {
    const { total = 0, readyCount = 0, sealedCount = 0, openedCount = 0, nextOpensAt = null } = summary;

    if (readyCount > 0) return {
        headline: readyCount === 1 ? 'A letter is ready to open.' : `${readyCount} letters are ready to open.`,
        detail: 'Open whenever you’re ready.',
        primary: { to: '/letters', label: 'Open now' },
        secondary: { to: '/letters/new', label: 'Write another' },
        footer: 'No rush.'
    };

    if (total === 0) return {
        headline: 'Write your first letter',
        detail: 'A note for the person you’ll be in a week, a month, or a year.',
        primary: { to: '/letters/new', label: 'Write a letter' },
        secondary: null,
        footer: 'It stays sealed until then.'
    };

    if (sealedCount > 0) return {
        headline: sealedCount === 1 ? '1 letter sealed' : `${sealedCount} letters sealed`,
        detail: nextOpensAt ? `Opens ${formatDateTime(nextOpensAt)} · ${timeUntil(nextOpensAt)}` : null,
        primary: { to: '/letters/new', label: 'Write another' },
        secondary: { to: '/letters', label: 'All letters' },
        footer: 'Sealed until then.'
    };

    return {
        headline: openedCount === 1 ? 'You’ve read your letter.' : 'You’ve read your letters.',
        detail: 'Write back to future you whenever you like.',
        primary: { to: '/letters/new', label: 'Write another' },
        secondary: { to: '/letters', label: 'Read again' },
        footer: 'Only you can see them.'
    };
}

const LetterTile = ({ summary = { status: 'loading' }, className, style }) => {

    const view = summary.status === 'ready' ? tileContent(summary) : null;

    return (
        <Tile labelledBy="letter-heading" className={className} style={style}>
            <TileHeader id="letter-heading" icon="mark_email_read" title="Letter to future you" />

            {summary.status === 'loading' && <p role="status" className="mt-5 text-[15px] text-body">Opening your letters…</p>}

            {summary.status === 'error' && (
                <p role="alert" className="mt-5 text-[15px] text-heading">
                    We couldn’t load your letters.{' '}
                    <Link to="/letters" className="font-medium text-forest hover:underline">Try again</Link>
                </p>
            )}

            {view && (
                <>
                    <div className="mt-5 flex flex-col items-center gap-3 text-center">
                        <SealedEnvelope />
                        <div>
                            <p className="text-[15px] font-medium text-heading">{view.headline}</p>
                            {view.detail && <p className="mt-1 text-[13px] text-body">{view.detail}</p>}
                        </div>
                        <Link to={view.primary.to} className={primaryLinkClass}>{view.primary.label}</Link>
                    </div>

                    <div className="mt-auto pt-4 border-t border-hairline flex items-center justify-between gap-3">
                        <span className="text-[13px] text-body">{view.footer}</span>
                        {view.secondary && <Link to={view.secondary.to} className={quietLinkClass}>{view.secondary.label}</Link>}
                    </div>
                </>
            )}
        </Tile>
    )
}

export default LetterTile
