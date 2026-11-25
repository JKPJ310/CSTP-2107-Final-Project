import React from 'react'

// White card shared by the homepage tiles: thin border, no shadow, 20px corners
export const Tile = ({ labelledBy, className = '', style, children }) => (
    <section
        aria-labelledby={labelledBy}
        style={style}
        className={`bg-card border border-hairline rounded-[20px] p-6 flex flex-col animate-fade-in ${className}`}
    >
        {children}
    </section>
)

export const TileHeader = ({ id, icon, title, aside }) => (
    <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </span>
            <h2 id={id} className="font-headline text-[18px] font-semibold text-heading">{title}</h2>
        </div>
        {aside}
    </div>
)

// Small note shown when someone taps something that arrives in a later build step
export const LaterNote = ({ children }) => (
    <p role="status" className="text-[13px] text-forest">{children}</p>
)
