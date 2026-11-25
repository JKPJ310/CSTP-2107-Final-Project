import React from 'react'
import { Link } from 'react-router-dom'
import { formatMonthDay } from '../../lib/dates'

const TodayCard = ({ message, pastYou }) => (
    <section aria-labelledby="today-heading" className="relative overflow-hidden bg-mint rounded-[20px] p-6 md:p-8 min-h-[240px] flex flex-col justify-between gap-6 animate-fade-in">
        {/* Sun rising over the hills, as in the logo */}
        <svg className="hidden sm:block absolute right-0 bottom-0 w-80 md:w-96 h-48 pointer-events-none" viewBox="0 0 380 200" fill="none" aria-hidden="true">
            <circle cx="280" cy="85" r="32" fill="var(--color-sun)" fillOpacity="0.3" />
            <circle cx="280" cy="85" r="22" fill="var(--color-sun)" />
            <path d="M120 200C160 160 210 140 280 155C330 165 370 145 400 135V200H120Z" fill="var(--color-leaf)" fillOpacity="0.25" />
            <path d="M40 200C90 145 170 130 250 160C310 182 360 170 410 175V200H40Z" fill="var(--color-leaf)" fillOpacity="0.35" />
            <path d="M180 200C230 170 290 165 340 180C370 190 395 188 410 186V200H180Z" fill="var(--color-forest)" fillOpacity="0.25" />
        </svg>

        <div className="relative flex flex-col gap-4 max-w-2xl">
            <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card text-forest text-[12px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-leaf" aria-hidden="true" />
                Today
            </span>
            <h2 id="today-heading" className="font-headline text-[24px] md:text-[28px] leading-snug font-semibold tracking-[-0.02em] text-heading text-balance">
                {message}
            </h2>
            {pastYou && (
                <p className="flex items-start gap-2 font-serif italic text-[16px] text-body">
                    <span className="material-symbols-outlined text-[18px] mt-0.5 not-italic" aria-hidden="true">auto_stories</span>
                    <span>Past you, {formatMonthDay(pastYou.date)}: “{pastYou.quote}”</span>
                </p>
            )}
        </div>

        <div className="relative flex flex-wrap items-center gap-3">
            <Link to="/chat" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat_bubble</span>
                Talk it out
            </Link>
            <Link to="/chat" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-card border border-hairline text-heading text-[15px] font-medium hover:border-leaf transition-colors">
                <span className="material-symbols-outlined text-[18px] text-body" aria-hidden="true">edit_note</span>
                Just write
            </Link>
        </div>
    </section>
)

export default TodayCard
