import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { primaryButtonClass } from '../components/auth/authStyles'
import { AuthLoading } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'

// Google sends people back here. New accounts go to onboarding, everyone else home.
const AuthCallbackPage = () => {

    const { session, loading, profileStatus } = useAuth();

    if (loading || profileStatus === 'loading') return <AuthLoading>Signing you in…</AuthLoading>;
    if (session) return <Navigate to={profileStatus === 'missing' ? '/onboarding' : '/home'} replace />;

    return (
        <AuthLayout title="That sign-in didn’t finish" subtitle="It may have been cancelled, or the link expired.">
            <Link to="/login" className={`${primaryButtonClass} flex items-center justify-center`}>Try again</Link>
        </AuthLayout>
    )
}

export default AuthCallbackPage
