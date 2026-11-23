import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLoading } from './RequireAuth'

// Landing, Log in and Sign up: signed-in people skip straight into the app,
// back to the page they were trying to open if there was one.
const PublicOnly = ({ children }) => {

    const { session, loading, profileStatus } = useAuth();
    const location = useLocation();

    if (loading || profileStatus === 'loading') return <AuthLoading />;
    if (session) {
        const destination = profileStatus === 'missing' ? '/onboarding' : (location.state?.from ?? '/home');
        return <Navigate to={destination} replace />;
    }
    return children;
}

export default PublicOnly
