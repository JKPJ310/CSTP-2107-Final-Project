import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { inputClass, labelClass, primaryButtonClass, textLinkClass } from '../components/auth/authStyles'
import { GoogleButton, OrDivider, PasswordInput } from '../components/auth/fields'
import FormNotice from '../components/auth/FormNotice'
import GoogleIcon from '../components/GoogleIcon'
import { logInWithUsername } from '../lib/accounts'
import { googleSignInProblem, signInWithGoogle, supabase } from '../lib/supabase'

const loginProblem = (error) => {
    // One message for wrong details, so nobody can probe which usernames or emails have accounts
    if (error.code === 'invalid_credentials') return 'Those details don’t match. Check your username or email and password, and try again.';
    if (error.code === 'email_not_confirmed') return 'This email isn’t confirmed yet. Finish signing up with the code we emailed you.';
    if (error.code === 'too_many_tries' || error.status === 429) return 'Too many tries. Please wait a few minutes and try again.';
    console.error('Log in failed:', error.message);
    return 'We couldn’t log you in. Check your connection and try again.';
}

// Once logged in, PublicOnly (in App.jsx) sends the person home, or back to the page they wanted
const LoginPage = () => {

    // A username or an email: anything with an @ is treated as an email
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [problem, setProblem] = useState(null);
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = login.trim();
        if (!name || !password) return setProblem('Enter your username or email, and your password.');
        setBusy(true);
        setProblem(null);
        let error = null;
        if (name.includes('@')) {
            error = (await supabase.auth.signInWithPassword({ email: name, password })).error;
        } else {
            try {
                await logInWithUsername(name, password);
            } catch (caught) {
                error = caught;
            }
        }
        if (error) {
            setProblem(loginProblem(error));
            setBusy(false);
        }
    }

    const handleGoogle = async () => {
        setProblem(null);
        const { error } = await signInWithGoogle();
        if (error) setProblem(googleSignInProblem());
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to pick up where you left off."
            footer={<>New to Equilibria? <Link to="/signup" className={textLinkClass}>Create an account</Link></>}
        >
            <GoogleButton onClick={handleGoogle} icon={<GoogleIcon />} />
            <OrDivider>or use your username</OrDivider>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div>
                    <label htmlFor="login-name" className={labelClass}>Username or email</label>
                    <input id="login-name" autoComplete="username" autoCapitalize="none" spellCheck={false} value={login} onChange={(e) => setLogin(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <PasswordInput id="login-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
                    <div className="mt-2 text-right">
                        <Link to="/forgot-password" state={{ email: login.includes('@') ? login.trim() : '' }} className={`${textLinkClass} text-[13px]`}>Forgot password?</Link>
                    </div>
                </div>
                {problem && <FormNotice>{problem}</FormNotice>}
                <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Logging in…' : 'Log in'}</button>
            </form>
        </AuthLayout>
    )
}

export default LoginPage
