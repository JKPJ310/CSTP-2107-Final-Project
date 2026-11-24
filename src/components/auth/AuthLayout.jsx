import React from 'react'

// The calm card shared by Sign up, Log in and the password pages
const AuthLayout = ({ title, subtitle, children, footer }) => (
    <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-in">
            <div className="text-center">
                <img src="/logo.png" alt="" className="w-14 h-14 mx-auto mb-4" />
                <h1 className="font-headline text-[28px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
                {subtitle && <p className="mt-2 text-[15px] text-body">{subtitle}</p>}
            </div>
            <div className="mt-8 p-5 md:p-6 rounded-[20px] bg-card border border-hairline flex flex-col gap-5">
                {children}
            </div>
            {footer && <div className="mt-6 text-center text-[14px] text-body">{footer}</div>}
        </div>
    </div>
)

export default AuthLayout
