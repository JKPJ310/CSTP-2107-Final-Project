import React from 'react'

// Shared pieces for the Settings page sections

export const fieldClass = 'w-full h-11 px-3 rounded-xl bg-canvas border border-hairline text-[15px] text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15 aria-invalid:border-sun';
export const labelClass = 'block text-[14px] font-medium text-heading mb-1.5';
export const helpClass = 'mt-1.5 text-[12px] text-body';
// The page's one filled button is "Save changes" in Profile; everything else is quieter
export const primaryClass = 'h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-60';
export const outlineClass = 'h-11 px-4 rounded-xl border border-hairline text-[14px] font-medium text-heading hover:border-leaf transition-colors disabled:opacity-60';
export const quietClass = 'h-11 px-3 rounded-xl text-[14px] font-medium text-body hover:text-heading hover:bg-canvas transition-colors disabled:opacity-60';

// One rounded card with a heading
export const SettingsCard = ({ id, title, description, children }) => (
    <section aria-labelledby={id} className="bg-card border border-hairline rounded-[20px] p-5 md:p-6 flex flex-col gap-5 animate-fade-in">
        <div>
            <h2 id={id} className="font-headline text-[19px] font-semibold tracking-[-0.01em] text-heading">{title}</h2>
            {description && <p className="mt-1 text-[14px] text-body">{description}</p>}
        </div>
        {children}
    </section>
)

// A row: what it is on the left, the control on the right (stacks on phones)
export const SettingRow = ({ label, labelId, detail, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
            <p id={labelId} className="text-[15px] font-medium text-heading">{label}</p>
            {detail && <div className="text-[14px] text-body break-words">{detail}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>
    </div>
)

export const Divider = () => <hr className="border-hairline" />

// An on/off switch
export const Toggle = ({ checked, onChange, disabled, labelledBy }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelledBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-leaf' : 'bg-hairline'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-card transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
)
