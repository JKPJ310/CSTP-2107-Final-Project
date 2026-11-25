import React from 'react'

// The mint envelope with a sun-yellow seal, shared by the home tile and the letter page.
const SealedEnvelope = ({ className = 'w-36 h-24' }) => (
    <svg className={className} viewBox="0 0 144 96" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="142" height="94" rx="8" fill="var(--color-mint)" stroke="var(--color-hairline)" />
        <path d="M2 4 L72 50 L142 4" stroke="var(--color-forest)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 94 L52 48" stroke="var(--color-forest)" strokeOpacity="0.3" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M142 94 L92 48" stroke="var(--color-forest)" strokeOpacity="0.3" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="72" cy="50" r="11" fill="var(--color-sun)" />
        <path d="M67 52c3-6 8-7 10-7-1 4-3 8-10 7Z" fill="var(--color-forest)" />
    </svg>
)

export default SealedEnvelope
