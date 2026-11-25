import React from 'react'

// Shown whenever diary text suggests someone may be in crisis. Calm, direct, never hidden.
const SupportCard = () => (
    <aside aria-labelledby="support-heading" className="rounded-[20px] bg-mint border border-leaf/30 p-5 flex gap-4 animate-fade-in">
        <span className="w-10 h-10 shrink-0 rounded-full bg-card text-forest flex items-center justify-center" aria-hidden="true">
            <span className="material-symbols-outlined text-[22px]">favorite</span>
        </span>
        <div className="flex flex-col gap-2 text-[15px] text-heading">
            <h2 id="support-heading" className="font-headline text-[17px] font-semibold">You don’t have to carry this alone.</h2>
            <p>If you’re thinking about hurting yourself, please reach out now. In Canada, you can call or text <strong>988</strong> any time. It’s free.</p>
            <p>If you’re in immediate danger, call <strong>911</strong>.</p>
            <div className="flex flex-wrap gap-3 pt-1">
                <a href="tel:988" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-forest hover:border-leaf">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">call</span>
                    Call 988
                </a>
                <a href="sms:988" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-card border border-hairline text-[14px] font-medium text-forest hover:border-leaf">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">sms</span>
                    Text 988
                </a>
            </div>
            <p className="text-[13px] text-body">Equilibria isn’t therapy or emergency care, but the people at 988 are there for exactly this.</p>
        </div>
    </aside>
)

export default SupportCard
