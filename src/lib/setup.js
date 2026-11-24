import { buildDayOneEntry } from '../data/onboarding'
import { createEntry } from './diaryStore'
import { saveOnboarding } from './profiles'

// Finishing a new account. Get Started signs people up with an email link, which opens in a
// new tab, so their answers wait in this browser until the link brings them back.
// The password is never kept here: it goes straight to Supabase Auth when the account is made.

const PENDING_KEY = 'equilibria.pendingSetup';
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000; // as long as Supabase's email link lasts

// setup: { email, username, diaryAiConsent, answers }
export const savePendingSetup = (setup) => {
    try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({ ...setup, savedAt: Date.now() }));
    } catch {
        // Storage blocked (private window): the person answers again after the link, at /onboarding
    }
}

// The waiting setup for this email, or null
export const readPendingSetup = (email) => {
    try {
        const pending = JSON.parse(localStorage.getItem(PENDING_KEY));
        if (!pending) return null;
        if (Date.now() - pending.savedAt > PENDING_MAX_AGE_MS) {
            localStorage.removeItem(PENDING_KEY);
            return null;
        }
        return pending.email?.toLowerCase() === email?.toLowerCase() ? pending : null;
    } catch {
        return null;
    }
}

export const clearPendingSetup = () => {
    try {
        localStorage.removeItem(PENDING_KEY);
    } catch {
        // Nothing to clear
    }
}

// Saves the profile and turns the answers into the Day 1 diary page, which it returns.
// Throws an Error with .code 'username_taken' if someone else got the username first.
export const finishSetup = async (userId, { username, diaryAiConsent, answers }) => {
    try {
        await saveOnboarding(userId, { username, diaryAiConsent });
    } catch (error) {
        if (error.code === '23505') throw Object.assign(new Error('Username taken'), { code: 'username_taken' });
        throw error;
    }
    return createEntry(buildDayOneEntry(answers));
}
