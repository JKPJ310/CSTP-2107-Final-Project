import { createContext, useContext } from 'react'

// session: the Supabase session or null. loading: true until the first check is done.
// profileStatus: 'none' (signed out) | 'loading' | 'complete' | 'missing' (onboarding not done) | 'error'
// profile: { name, username, emoji, pronouns, pronounsCustom, diaryAiConsent } or null
// profileChanged(profile): Settings saved a change
export const AuthContext = createContext({ session: null, loading: true, profileStatus: 'none', profile: null, markProfileComplete: () => {}, profileChanged: () => {} });

export const useAuth = () => useContext(AuthContext);
