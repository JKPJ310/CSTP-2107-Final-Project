import React, { useState } from 'react'
import { inputClass, labelClass } from './authStyles'

// Password box with a show/hide eye
export const PasswordInput = ({ id, label, value, onChange, autoComplete, describedBy, invalid }) => {

    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className={labelClass}>{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={`${inputClass} pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-body hover:text-heading"
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{visible ? 'visibility_off' : 'visibility'}</span>
                </button>
            </div>
        </div>
    )
}

export const GoogleButton = ({ onClick, children = 'Continue with Google', icon }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full h-12 rounded-xl bg-card border border-hairline text-heading font-medium text-[15px] hover:border-leaf active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
    >
        {icon}
        <span>{children}</span>
    </button>
)

export const OrDivider = ({ children = 'or use your email' }) => (
    <div className="flex items-center gap-3 text-[12px] text-body" aria-hidden="true">
        <span className="h-px flex-1 bg-hairline" />
        {children}
        <span className="h-px flex-1 bg-hairline" />
    </div>
)
