import { supabase } from './supabase'

// Every diary read and write goes through this file.
// Row Level Security in Supabase limits all of these to the signed-in user's own entries.

const COLUMNS = 'id, body, tags, is_private, created_at, updated_at';

const fromRow = (row) => ({
    id: row.id,
    body: row.body,
    tags: row.tags,
    isPrivate: row.is_private,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const toRow = ({ body, tags, isPrivate }) => ({ body: body.trim(), tags, is_private: isPrivate });

// Supabase returns { data, error }; turn an error into a thrown one so pages can catch it
const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
}

export const listEntries = async () =>
    unwrap(await supabase.from('diary_entries').select(COLUMNS).order('created_at', { ascending: false })).map(fromRow);

// null when the entry doesn't exist, isn't yours, or the id isn't a valid id
export const getEntry = async (id) => {
    const result = await supabase.from('diary_entries').select(COLUMNS).eq('id', id).maybeSingle();
    if (result.error?.code === '22P02') return null;
    const row = unwrap(result);
    return row ? fromRow(row) : null;
}

// Asks the memory agent (ai-memory edge function) to write a short note about the entry for the
// AI chat. It decides on the server whether it may (diary consent, not private). The diary never
// waits for it, and if it fails the chat just knows a little less.
const rememberEntry = (id) => {
    supabase.functions.invoke('ai-memory', { body: { entryId: id } }).then(({ error }) => {
        if (error) console.warn('The memory agent skipped a diary entry:', error.message);
    });
}

export const createEntry = async (entry) => {
    const saved = fromRow(unwrap(await supabase.from('diary_entries').insert(toRow(entry)).select(COLUMNS).single()));
    rememberEntry(saved.id);
    return saved;
}

export const updateEntry = async (id, entry) => {
    const saved = fromRow(unwrap(await supabase.from('diary_entries').update(toRow(entry)).eq('id', id).select(COLUMNS).single()));
    rememberEntry(saved.id);
    return saved;
}

export const deleteEntry = async (id) => {
    unwrap(await supabase.from('diary_entries').delete().eq('id', id));
}

// For the homepage tile: the newest entry, and when the diary started (for "Day N")
export const getDiarySummary = async () => {
    const [latest, first] = await Promise.all([
        supabase.from('diary_entries').select(COLUMNS).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('diary_entries').select('created_at').order('created_at', { ascending: true }).limit(1).maybeSingle()
    ]);
    const latestRow = unwrap(latest);
    const firstRow = unwrap(first);
    return { latest: latestRow ? fromRow(latestRow) : null, firstDate: firstRow?.created_at ?? null };
}
