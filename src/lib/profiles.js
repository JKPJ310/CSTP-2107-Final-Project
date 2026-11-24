import { TERMS_VERSION } from '../data/onboarding'
import { supabase } from './supabase'

// True once the person has finished onboarding. Throws the Supabase error on failure.
export const hasProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (error) throw error;
    return Boolean(data);
}

// The person's username (used as their name in the app), or null if they haven't finished onboarding
export const getDisplayName = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data?.display_name ?? null;
}

// Saves the onboarding answers that belong on the profile. Safe to run again if a later step failed.
// Throws the Supabase error on failure; error.code '23505' means the username was just taken.
export const saveOnboarding = async (userId, { username, diaryAiConsent }) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username,
        display_name: username,
        diary_ai_consent: diaryAiConsent,
        terms_version: TERMS_VERSION,
        terms_accepted_at: now,
        onboarded_at: now
    });
    if (error) throw error;
}

// Pronoun choices, matching the check in 001_profiles.sql
export const PRONOUN_OPTIONS = [
    { value: '', label: 'Not set' },
    { value: 'she_her', label: 'she/her' },
    { value: 'he_him', label: 'he/him' },
    { value: 'they_them', label: 'they/them' },
    { value: 'self_described', label: 'Let me type them' },
    { value: 'prefer_not', label: 'Prefer not to say' }
];

export const MAX_NAME = 50;
export const MAX_PRONOUNS = 40;

const PROFILE_COLUMNS = 'display_name, username, avatar_emoji, avatar_path, pronouns, pronouns_custom, diary_ai_consent';

// Profile photos live in the private "avatars" bucket at <user id>/<file>; the page gets a temporary link
const AVATAR_BUCKET = 'avatars';
const AVATAR_LINK_SECONDS = 24 * 60 * 60;

const photoLink = async (path) => {
    if (!path) return null;
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, AVATAR_LINK_SECONDS);
    if (error) {
        console.error('Loading the profile photo failed:', error.message);
        return null; // the emoji or the plain icon shows instead
    }
    return data.signedUrl;
}

const profileFromRow = async (row) => ({
    name: row.display_name,
    username: row.username,
    emoji: row.avatar_emoji,
    photoPath: row.avatar_path,
    photoUrl: await photoLink(row.avatar_path),
    pronouns: row.pronouns ?? '',
    pronounsCustom: row.pronouns_custom ?? '',
    diaryAiConsent: row.diary_ai_consent
});

// The signed-in person's profile for Settings and the navbar, or null before onboarding
export const getProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
    if (error) throw error;
    return data ? await profileFromRow(data) : null;
}

// Saves any of { name, username, emoji, photoPath, pronouns, pronounsCustom, diaryAiConsent } and
// returns the whole profile. Throws the Supabase error; error.code '23505' means the username is taken.
export const updateProfile = async (userId, changes) => {
    const row = {};
    if ('name' in changes) row.display_name = changes.name.trim();
    if ('username' in changes) row.username = changes.username.trim();
    if ('emoji' in changes) row.avatar_emoji = changes.emoji || null;
    if ('photoPath' in changes) row.avatar_path = changes.photoPath || null;
    if ('pronouns' in changes) {
        row.pronouns = changes.pronouns || null;
        row.pronouns_custom = changes.pronouns === 'self_described' ? changes.pronounsCustom.trim() || null : null;
    }
    if ('diaryAiConsent' in changes) row.diary_ai_consent = changes.diaryAiConsent;
    const { data, error } = await supabase.from('profiles').update(row).eq('id', userId).select(PROFILE_COLUMNS).single();
    if (error) throw error;
    return profileFromRow(data);
}

// Uploads a prepared picture (see squarePicture in images.js) and returns its storage path.
// Each upload gets a new name, so no browser shows an old cached photo.
export const uploadProfilePhoto = async (userId, blob) => {
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return path;
}

// Deletes a photo file that is no longer used. A failure only leaves a stray file behind.
export const removeProfilePhoto = async (path) => {
    if (!path) return;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) console.error('Removing the old profile photo failed:', error.message);
}
