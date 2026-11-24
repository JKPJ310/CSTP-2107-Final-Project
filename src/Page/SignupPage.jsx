import React, { useState } from 'react'
import SetupFlow from '../components/onboarding/SetupFlow'
import PublicOnly from '../components/PublicOnly'
import { AuthLoading } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'

// Decided once, when the page opens: signed-in people are sent on by PublicOnly,
// but someone who signs in partway through (after the email code) stays to finish.
const SignupGate = () => {

    const { session } = useAuth();
    const [signedInOnArrival] = useState(Boolean(session));

    if (signedInOnArrival) return <PublicOnly />;
    return <SetupFlow mode="email" />;
}

// Get Started: the 5 questions, then email, then username and password. Google sign-up goes through /onboarding.
const SignupPage = () => {

    const { loading } = useAuth();

    if (loading) return <AuthLoading />;
    return <SignupGate />;
}

export default SignupPage
