import { createClient } from '@supabase/supabase-js'

// Both values are public by design (access is enforced by Row Level Security).
// Never put a Supabase secret / service_role key in the frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

if (!supabaseConfigured) {
    console.error('Supabase is not configured: copy .env.example to .env.local and fill in both values, then restart the dev server.');
}

export const supabase = supabaseConfigured
    ? createClient(url, publishableKey, { auth: { flowType: 'pkce' } })
    : null;

// What to say when Google sign-in can't start. A fresh clone has no .env.local, which is the usual cause.
export const googleSignInProblem = () => (supabaseConfigured
    ? 'We couldn’t reach Google. Please try again.'
    : 'The app isn’t connected to Supabase yet. Copy .env.example to .env.local, then restart the dev server.');

// Google sign-in returns to /auth/callback, which sends people to onboarding or home.
export const signInWithGoogle = () => (!supabase
    ? Promise.resolve({ error: new Error('Supabase is not configured.') })
    : supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Always show Google's account chooser, even if only one account is signed in
        queryParams: { prompt: 'select_account' }
    }
}));
