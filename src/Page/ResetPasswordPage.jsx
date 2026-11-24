import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { primaryButtonClass, textLinkClass } from '../components/auth/authStyles'
import { PasswordInput } from '../components/auth/fields'
import FormNotice from '../components/auth/FormNotice'
import { AuthLoading } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

// Opened from the reset email. The link signs the person in, then they choose a new password here.
const ResetPasswordPage = () => {

    const { session, loading } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [problem, setProblem] = useState(null);
    const [busy, setBusy] = useState(false);

    if (loading) return <AuthLoading />;

    if (!session) {
        return (
            <AuthLayout title="This link has expired" subtitle="Reset links work once, for a short time, in the browser that asked for them.">
                <Link to="/forgot-password" className={`${primaryButtonClass} flex items-center justify-center`}>Send a new link</Link>
            </AuthLayout>
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < MIN_PASSWORD) return setProblem(`Use at least ${MIN_PASSWORD} characters.`);
        if (password.length > MAX_PASSWORD) return setProblem(`Use ${MAX_PASSWORD} characters or fewer.`);
        if (password !== confirm) return setProblem('The two passwords don’t match.');
        setBusy(true);
        setProblem(null);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setBusy(false);
            if (error.code === 'same_password') return setProblem('That’s your current password. Choose a different one.');
            if (error.code === 'weak_password') return setProblem('That password is too easy to guess. Try a longer one.');
            console.error('Updating the password failed:', error.message);
            return setProblem('We couldn’t update your password. Check your connection and try again.');
        }
        navigate('/home', { replace: true });
    }

    return (
        <AuthLayout
            title="Choose a new password"
            subtitle={<>For <span className="font-medium text-heading">{session.user.email}</span></>}
            footer={<Link to="/home" className={textLinkClass}>Not now</Link>}
        >
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div>
                    <PasswordInput id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" describedBy="new-password-help" />
                    <p id="new-password-help" className="mt-1.5 text-[12px] text-body">At least {MIN_PASSWORD} characters.</p>
                </div>
                <PasswordInput id="confirm-password" label="Type it again" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                {problem && <FormNotice>{problem}</FormNotice>}
                <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Saving…' : 'Save new password'}</button>
            </form>
        </AuthLayout>
    )
}

export default ResetPasswordPage
