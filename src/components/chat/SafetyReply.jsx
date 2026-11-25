import React from 'react'

// The fixed crisis reply, with one-tap ways to reach 988
const SafetyReply = ({ content, children }) => (
    <div className="max-w-[85%] rounded-[20px] rounded-bl-md bg-mint border border-leaf/30 p-4 flex flex-col gap-3">
        <p className="text-[15px] leading-relaxed text-heading whitespace-pre-wrap">{content}</p>
        <div className="flex flex-wrap gap-2">
            <a href="tel:988" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-forest hover:border-leaf">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">call</span>
                Call 988
            </a>
            <a href="sms:988" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-forest hover:border-leaf">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">sms</span>
                Text 988
            </a>
        </div>
        {children}
    </div>
)

export default SafetyReply
