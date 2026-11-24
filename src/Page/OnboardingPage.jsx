import React, { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import FormNotice from '../components/auth/FormNotice'
import { primaryButtonClass } from '../components/auth/authStyles'
import SetupFlow, { DayOneReady } from '../components/onboarding/SetupFlow'
import RequireAuth, { AuthLoading } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { clearPendingSetup, finishSetup, readPendingSetup } from '../lib/setup'

// Someone who clicked the Get Started email link: their answers are waiting in this browser
const FinishPendingSetup = ({ pending }) => {

    const { session, markProfileComplete } = useAuth();
    const [result, setResult] = useState(null);
    const started = useRef(false);

    const save = async () => {
        try {
            const entry = await finishSetup(session.user.id, pending);
            clearPendingSetup();
            markProfileComplete();
            setResult({ entry });
        } catch (error) {
            if (error.code === 'username_taken') {
                clearPendingSetup();
                setResult({ taken: true });
            } else {
                console.error('Finishing setup failed:', error.message);
                setResult({ failed: true });
            }
        }
    }

    // Runs once, even when React's development mode mounts the page twice
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        save();
    });

    if (!result) return <AuthLoading>Setting up your space…</AuthLoading>;
    if (result.entry) return <DayOneReady name={pending.username} entryId={result.entry.id} />;
    if (result.taken) {
        return <SetupFlow mode="signedIn" initial={pending} initialProblem="Someone took that username while you were checking your email. Pick another one, and set your password again." />;
    }
    return (
        <div className="bg-canvas font-body min-h-[calc(100svh-4rem)] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md flex flex-col items-center gap-4">
                <FormNotice>Your email is confirmed, but we couldn’t save your answers. Check your connection and try again.</FormNotice>
                <button type="button" onClick={() => { setResult(null); save(); }} className={primaryButtonClass}>Try again</button>
            </div>
        </div>
    )
}

// For people who are signed in but have no profile yet: Get Started people back from the
// email link, and new Google accounts (the 5 questions, then a username and password).
const Onboarding = () => {

    const { session, profileStatus } = useAuth();
    // Someone who already finished onboarding is sent home, but not the moment they finish it here
    const [alreadyDone] = useState(profileStatus === 'complete');
    const [pending] = useState(() => readPendingSetup(session.user.email));

    if (alreadyDone) return <Navigate to="/home" replace />;
    if (pending) return <FinishPendingSetup pending={pending} />;
    return <SetupFlow mode="signedIn" />;
}

const OnboardingPage = () => (
    <RequireAuth allowUnfinishedOnboarding>
        <Onboarding />
    </RequireAuth>
)

export default OnboardingPage
