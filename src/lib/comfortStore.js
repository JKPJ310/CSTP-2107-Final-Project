import { supabase } from './supabase'

// Every comfort kit read and write goes through this file.
// Row Level Security (table and storage) limits all of these to the signed-in user's own items.

const BUCKET = 'comfort-photos';
const COLUMNS = 'id, kind, title, url, photo_path, created_at';
// Photos are private, so the page gets temporary links to show them
const SIGNED_URL_SECONDS = 60 * 60;

export const MAX_PHOTOS = 2;
export const MAX_PHOTO_MB = 5;
export const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const fromRow = (row) => ({ id: row.id, kind: row.kind, title: row.title, url: row.url, photoPath: row.photo_path, createdAt: row.created_at });

const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
}

// The server refuses a 3rd photo with this message (see 004_comfort_kit.sql)
export const isPhotoLimitError = (error) => error?.message === 'photo_limit';

export const listComfortItems = async () => {
    const items = unwrap(await supabase.from('comfort_items').select(COLUMNS).order('created_at', { ascending: true })).map(fromRow);
    const paths = items.filter((item) => item.kind === 'photo').map((item) => item.photoPath);
    if (paths.length === 0) return items;
    const signed = unwrap(await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS));
    const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));
    return items.map((item) => (item.kind === 'photo' ? { ...item, photoUrl: urlFor.get(item.photoPath) ?? null } : item));
}

// Adds the song, or replaces it when existingId is given. url must already be checked with normalizeYouTubeUrl.
export const saveSong = async (existingId, { title, url }) => {
    const values = { title: title.trim() || null, url };
    const query = existingId
        ? supabase.from('comfort_items').update(values).eq('id', existingId)
        : supabase.from('comfort_items').insert({ kind: 'song', ...values });
    return fromRow(unwrap(await query.select(COLUMNS).single()));
}

export const addPhoto = async (userId, file, caption) => {
    const path = `${userId}/${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`;
    unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
    let row;
    try {
        row = unwrap(await supabase.from('comfort_items').insert({ kind: 'photo', title: caption.trim() || null, photo_path: path }).select(COLUMNS).single());
    } catch (error) {
        // Don't leave an orphaned file behind if the row couldn't be saved
        await supabase.storage.from(BUCKET).remove([path]);
        throw error;
    }
    const { signedUrl } = unwrap(await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS));
    return { ...fromRow(row), photoUrl: signedUrl };
}

export const removeComfortItem = async (item) => {
    unwrap(await supabase.from('comfort_items').delete().eq('id', item.id));
    if (item.kind === 'photo') {
        const { error } = await supabase.storage.from(BUCKET).remove([item.photoPath]);
        if (error) console.error('The photo file could not be removed:', error.message);
    }
}
