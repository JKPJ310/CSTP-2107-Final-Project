import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { inputClass, labelClass, primaryButtonClass, textLinkClass } from '../components/auth/authStyles'
import FormNotice from '../components/auth/FormNotice'
import { supabase } from '../lib/supabase'

const ForgotPasswordPage = () => {

    // Pre-filled when coming from "Forgot password?" on the log in page
    const [email, setEmail] = useState(useLocation().state?.email ?? '');
    const [sent, setSent] = useState(false);
    const [problem, setProblem] = useState(null);
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setProblem('Enter the email you signed up with.');
        setBusy(true);
        setProblem(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`
        });
        setBusy(false);
        if (error?.status === 429) return setProblem('Too many tries. Please wait a minute and try again.');
        if (error) console.error('Password reset email failed:', error.message);
        // Same message whether or not the email has an account, so nobody can probe for accounts
        setSent(true);
    }

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your email and we’ll send you a link to choose a new one."
            footer={<Link to="/login" className={textLinkClass}>Back to log in</Link>}
        >
            {sent ? (
                <FormNotice tone="info">
                    If there’s an account for <span className="font-medium">{email.trim()}</span>, a reset link is on its way. Open it in this browser. It may take a minute, and check your spam folder too.
                </FormNotice>
            ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    <div>
                        <label htmlFor="forgot-email" className={labelClass}>Email</label>
                        <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    {problem && <FormNotice>{problem}</FormNotice>}
                    <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Sending…' : 'Send reset link'}</button>
                </form>
            )}
        </AuthLayout>
    )
}

export default ForgotPasswordPage
