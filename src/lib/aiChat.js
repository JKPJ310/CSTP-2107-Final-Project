import { supabase } from './supabase'

// The chat page talks to the AI only through this file.
// The AI itself runs in the ai-chat edge function, which holds the Groq key.

export const CHAT_DAILY_LIMIT = 50;
const MESSAGES_ON_SCREEN = 100;

export const listChatMessages = async () => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, is_safety, created_at')
        .order('created_at', { ascending: false })
        .limit(MESSAGES_ON_SCREEN);
    if (error) throw error;
    return data.reverse().map((row) => ({ id: row.id, role: row.role, content: row.content, isSafety: row.is_safety, createdAt: row.created_at }));
}

// Returns { reply, safety, messageId }. On failure throws an Error with .code:
// 'daily_limit', 'ai_unavailable', 'too_long', 'not_signed_in', 'server_error' or 'network'
export const sendChatMessage = async (message) => {
    const { data, error } = await supabase.functions.invoke('ai-chat', { body: { message } });
    if (!error) return { reply: data.reply, safety: Boolean(data.safety), messageId: data.messageId ?? null };

    let code = 'network';
    if (error.context instanceof Response) {
        try {
            code = (await error.context.json()).error ?? 'server_error';
        } catch {
            code = 'server_error';
        }
    }
    throw Object.assign(new Error(`Chat request failed: ${code}`), { code });
}

// Opens the stream of audio for the reply with this id, read aloud by the ai-voice edge function
// (Gemini's warm voice). Resolves to { sampleRate, reader } as soon as the first bytes are on their
// way; the reader yields raw 16-bit mono PCM. Throws if the voice isn't available.
export const openReplyAudio = async (messageId, signal) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Voice request failed: not signed in');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-voice`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageId }),
        signal
    });
    if (!response.ok || !response.body) {
        const code = await response.json().then((body) => body.error, () => response.status);
        throw new Error(`Voice request failed: ${code}`);
    }
    return { sampleRate: Number(response.headers.get('X-Sample-Rate')) || 24000, reader: response.body.getReader() };
}

// Wakes the ai-voice edge function (it sleeps when idle, and waking takes a few seconds), so it's
// ready by the time the first spoken reply needs it. It answers "not found" without using Gemini.
export const wakeVoice = () => {
    supabase.functions.invoke('ai-voice', { body: { messageId: 'wake-up' } }).catch(() => {});
}

// Deletes the whole conversation, and the memory agent's notes about it
export const clearChatHistory = async (userId) => {
    const { error } = await supabase.from('chat_messages').delete().eq('user_id', userId);
    if (error) throw error;
    const { error: notesError } = await supabase.from('memories').delete().eq('user_id', userId).eq('source', 'chat');
    if (notesError) throw notesError;
}
