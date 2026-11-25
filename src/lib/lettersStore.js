import { supabase } from './supabase'

// Every letter read and write goes through this file.
// Row Level Security in Supabase limits these to the signed-in person's own letters,
// and the words (letter_bodies) are only returned after the unlock time.

const COLUMNS = 'id, opens_at, created_at, opened_at';

const fromRow = (row) => ({
    id: row.id,
    opensAt: row.opens_at,
    createdAt: row.created_at,
    openedAt: row.opened_at
});

// Supabase returns { data, error }; turn an error into a thrown one so pages can catch it
const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
}

// A letter is ready when its unlock time has passed and it hasn't been opened yet
export const isReady = (letter, now = Date.now()) => new Date(letter.opensAt).getTime() <= now;

// Dates and counts only: safe to load anywhere. Soonest unlock first.
export const listLetters = async () =>
    unwrap(await supabase.from('letters').select(COLUMNS).order('opens_at', { ascending: true })).map(fromRow);

// null when the letter doesn't exist, isn't yours, or the id isn't a valid id
export const getLetter = async (id) => {
    const result = await supabase.from('letters').select(COLUMNS).eq('id', id).maybeSingle();
    if (result.error?.code === '22P02') return null;
    const row = unwrap(result);
    return row ? fromRow(row) : null;
}

// The words. Returns null until the unlock time: the database refuses to send them early.
export const getLetterBody = async (id) => {
    const result = await supabase.from('letter_bodies').select('body').eq('letter_id', id).maybeSingle();
    if (result.error?.code === '22P02') return null;
    const row = unwrap(result);
    return row ? row.body : null;
}

export const createLetter = async ({ body, opensAt }) => {
    const data = unwrap(await supabase.rpc('create_letter', {
        p_body: body.trim(),
        p_opens_at: new Date(opensAt).toISOString()
    }));
    // A function returning one row comes back as an object; be safe if it ever comes back as a list
    return fromRow(Array.isArray(data) ? data[0] : data);
}

export const markLetterOpened = async (id) =>
    fromRow(unwrap(await supabase
        .from('letters')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', id)
        .select(COLUMNS)
        .single()));

export const deleteLetter = async (id) => {
    unwrap(await supabase.from('letters').delete().eq('id', id));
}

// For the homepage tile: how many are waiting, sealed, or already read
export const getLetterSummary = async () => {
    const letters = await listLetters();
    const now = Date.now();
    const ready = letters.filter((letter) => !letter.openedAt && isReady(letter, now));
    const sealed = letters.filter((letter) => !letter.openedAt && new Date(letter.opensAt).getTime() > now);
    const openedCount = letters.filter((letter) => letter.openedAt).length;
    return {
        total: letters.length,
        readyCount: ready.length,
        sealedCount: sealed.length,
        openedCount,
        nextOpensAt: sealed[0]?.opensAt ?? null
    };
}
