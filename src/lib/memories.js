import { supabase } from './supabase'

// The memory agent's notes, for "What Equilibria remembers" in Settings.
// Row Level Security lets people read and delete only their own; only the server writes them.

const fromRow = (row) => ({
    id: row.id,
    source: row.source,
    mood: row.mood,
    summary: row.summary,
    happenedAt: row.happened_at
});

const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
}

export const listMemories = async () =>
    unwrap(await supabase.from('memories').select('id, source, mood, summary, happened_at').order('happened_at', { ascending: false })).map(fromRow);

export const deleteMemory = async (id) => {
    unwrap(await supabase.from('memories').delete().eq('id', id));
}

// source: 'diary', 'chat', or nothing for every note
export const deleteAllMemories = async (userId, source) => {
    let query = supabase.from('memories').delete().eq('user_id', userId);
    if (source) query = query.eq('source', source);
    unwrap(await query);
}

// Asks the memory agent to note recent diary entries that have no note yet (for example ones
// written before the agent existed). Runs in the background; nothing waits for it.
export const catchUpMemories = () => {
    supabase.functions.invoke('ai-memory', { body: { catchUp: true } }).then(({ error }) => {
        if (error) console.warn('The memory agent couldn’t catch up:', error.message);
    });
}
