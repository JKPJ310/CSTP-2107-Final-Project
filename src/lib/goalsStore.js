import { supabase } from './supabase'

// Every goals read and write goes through this file.
// Row Level Security in Supabase limits all of these to the signed-in user's own goals.

export const MAX_GOALS = 3;
const DONE_FOR_MS = 24 * 60 * 60 * 1000;
const COLUMNS = 'id, text, done_at, created_at';

const fromRow = (row) => ({ id: row.id, text: row.text, doneAt: row.done_at, createdAt: row.created_at });

const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
}

// A tick counts for 24 hours after it was made
export const isDone = (doneAt, now = Date.now()) => Boolean(doneAt) && now - new Date(doneAt).getTime() < DONE_FOR_MS;

// The server refuses a 4th goal with this message (see 003_goals.sql)
export const isGoalLimitError = (error) => error?.message === 'goal_limit';

export const listGoals = async () =>
    unwrap(await supabase.from('goals').select(COLUMNS).order('created_at', { ascending: true })).map(fromRow);

export const createGoal = async (text) =>
    fromRow(unwrap(await supabase.from('goals').insert({ text: text.trim() }).select(COLUMNS).single()));

export const renameGoal = async (id, text) =>
    fromRow(unwrap(await supabase.from('goals').update({ text: text.trim() }).eq('id', id).select(COLUMNS).single()));

export const setGoalDone = async (id, done) =>
    fromRow(unwrap(await supabase.from('goals').update({ done_at: done ? new Date().toISOString() : null }).eq('id', id).select(COLUMNS).single()));

export const deleteGoal = async (id) => {
    unwrap(await supabase.from('goals').delete().eq('id', id));
}
