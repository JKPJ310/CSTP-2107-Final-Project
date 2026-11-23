import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../lib/supabase'

const pageClass = 'bg-canvas text-heading font-body min-h-[calc(100svh-4rem)] flex items-center justify-center px-6 py-12';

export const AuthLoading = ({ children = 'Getting things ready…' }) => (
    <div className={pageClass}>
        <p role="status" className="text-[15px] text-body">{children}</p>
    </div>
)

// App pages: signed-out people go to Log in (and come back here afterwards);
// signed-in people who haven't finished onboarding go to onboarding first.
const RequireAuth = ({ allowUnfinishedOnboarding = false, children }) => {

    const { session, loading, profileStatus } = useAuth();
    const location = useLocation();

    if (!supabaseConfigured) {
        return (
            <div className={pageClass}>
                <p role="alert" className="max-w-md text-center text-[15px] text-body">
                    The app isn’t connected yet. Add the Supabase keys to <code>.env.local</code> and restart the dev server.
                </p>
            </div>
        )
    }

    if (loading || profileStatus === 'loading') return <AuthLoading />;
    if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

    if (profileStatus === 'error') {
        return (
            <div className={pageClass}>
                <div role="alert" className="max-w-md text-center flex flex-col items-center gap-3">
                    <p className="text-[15px] text-heading">We couldn’t load your account. Check your connection.</p>
                    <button type="button" onClick={() => window.location.reload()} className="h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90">
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    if (profileStatus === 'missing' && !allowUnfinishedOnboarding) return <Navigate to="/onboarding" replace />;
    return children;
}

export default RequireAuth
