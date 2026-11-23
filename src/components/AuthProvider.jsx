import React, { useCallback, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { getProfile } from '../lib/profiles'
import { supabase } from '../lib/supabase'

const AuthProvider = ({ children }) => {

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(Boolean(supabase));
    // Whether the signed-in person has finished onboarding, and their profile: { userId, status, data }
    const [profile, setProfile] = useState({ userId: null, status: null, data: null });
    // Bumped to load the profile again (after onboarding finishes)
    const [reloads, setReloads] = useState(0);
    const userId = session?.user.id;

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) console.error('Could not restore the sign-in session:', error.message);
            setSession(data.session);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        getProfile(userId)
            .then((data) => {
                if (!cancelled) setProfile({ userId, status: data ? 'complete' : 'missing', data });
            })
            .catch((error) => {
                console.error('Checking onboarding failed:', error.message);
                if (!cancelled) setProfile((prev) => (prev.userId === userId && prev.status === 'complete' ? prev : { userId, status: 'error', data: null }));
            });
        return () => { cancelled = true; };
    }, [userId, reloads]);

    const markProfileComplete = useCallback(() => {
        setProfile((prev) => ({ ...prev, userId, status: 'complete' }));
        setReloads((n) => n + 1);
    }, [userId]);

    // Settings saved a change: show it everywhere straight away
    const profileChanged = useCallback((data) => setProfile({ userId, status: 'complete', data }), [userId]);

    let profileStatus = 'none';
    if (userId) profileStatus = profile.userId === userId ? profile.status : 'loading';
    const profileData = profile.userId === userId ? profile.data : null;

    return (
        <AuthContext.Provider value={{ session, loading, profileStatus, profile: profileData, markProfileComplete, profileChanged }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
