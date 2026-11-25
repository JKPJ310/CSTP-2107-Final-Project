// Equilibria AI chat. Runs on Supabase, never in the browser, so the Groq key stays secret.
// Deploy with: npm run ai:deploy
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { CRISIS_REPLY, MEMORY_RULES, PROMPT_VERSION, SYSTEM_PROMPT } from '../_shared/generated.ts';
import { MAX_NOTE_INPUT, mentionsCrisis, writeNote } from '../_shared/memory.ts';

// Supabase's runtime keeps a function alive for work promised here, after the reply has been sent
declare const EdgeRuntime: { waitUntil(work: Promise<unknown>): void };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const DAILY_LIMIT = 50;             // messages a person can send in any 24 hours
const HISTORY_SIZE = 20;            // recent messages sent along so the AI can follow the conversation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_REPLY_LENGTH = 4000;
const AI_TIMEOUT_MS = 25_000;
const CHAT_NOTE_EVERY = 10;         // the memory agent notes the chat after this many new messages
const NOTES_IN_BACKGROUND = 8;      // newest memory notes the AI gets as background
const NOTES_FROM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Server-side client: the user id always comes from the login token, never from the request
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Role = 'user' | 'assistant';

// Supabase's gateway (verify_jwt, on for this function) has already checked the login token's
// signature and expiry before the request gets here, so the user id can be read straight from it.
// That saves a trip to the login server on every message.
const userIdFrom = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.role === 'authenticated' && typeof payload.sub === 'string' ? payload.sub as string : null;
    } catch {
        return null;
    }
};

type NoteRow = {
    source: 'diary' | 'chat';
    mood: string | null;
    energy: number | null;
    stressors: string[];
    positives: string[];
    summary: string;
    happened_at: string;
};

const PRONOUNS: Record<string, string> = { she_her: 'she/her', he_him: 'he/him', they_them: 'they/them' };

const daysAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
    if (days <= 0) return 'today';
    return days === 1 ? 'yesterday' : `${days} days ago`;
};

const describeNote = (note: NoteRow) => [
    `- ${daysAgo(note.happened_at)} (${note.source}):`,
    note.mood && `feeling ${note.mood}.`,
    note.energy && `Energy ${note.energy} of 5.`,
    note.stressors.length > 0 && `Weighing on them: ${note.stressors.join(', ')}.`,
    note.positives.length > 0 && `Helped: ${note.positives.join(', ')}.`,
    note.summary
].filter(Boolean).join(' ');

// What the AI knows about the person before they say anything: name, recent memory notes,
// goals and comfort kit. Diary notes only with diary consent. Null if there is nothing to tell.
const loadBackground = async (userId: string): Promise<string | null> => {
    const since = new Date(Date.now() - NOTES_FROM_DAYS * DAY_MS).toISOString();
    const [profile, notes, goals, comfort] = await Promise.all([
        admin.from('profiles').select('display_name, pronouns, pronouns_custom, diary_ai_consent').eq('id', userId).maybeSingle(),
        admin.from('memories')
            .select('source, mood, energy, stressors, positives, summary, happened_at')
            .eq('user_id', userId)
            .gte('happened_at', since)
            .order('happened_at', { ascending: false })
            .limit(NOTES_IN_BACKGROUND),
        admin.from('goals').select('text, done_at').eq('user_id', userId).order('created_at'),
        admin.from('comfort_items').select('kind').eq('user_id', userId)
    ]);
    const failed = [profile, notes, goals, comfort].find((result) => result.error);
    if (failed) throw failed.error;

    const consent = Boolean(profile.data?.diary_ai_consent);
    const usableNotes = (notes.data as NoteRow[]).filter((note) => note.source === 'chat' || consent);
    const songs = comfort.data!.filter((item) => item.kind === 'song').length;
    const photos = comfort.data!.filter((item) => item.kind === 'photo').length;

    const lines = [
        profile.data?.display_name && `Their name in the app: ${profile.data.display_name}`,
        profile.data?.pronouns === 'self_described' && profile.data.pronouns_custom
            ? `Their pronouns: ${profile.data.pronouns_custom}`
            : PRONOUNS[profile.data?.pronouns ?? ''] && `Their pronouns: ${PRONOUNS[profile.data!.pronouns]}`,
        usableNotes.length > 0 && `Notes, newest first:\n${usableNotes.map(describeNote).join('\n')}`,
        goals.data!.length > 0 && `Their small goals: ${goals.data!.map((goal) =>
            `"${goal.text}"${goal.done_at && Date.now() - new Date(goal.done_at).getTime() < DAY_MS ? ' (done today)' : ''}`).join(', ')}`,
        `Comfort kit: ${songs + photos === 0 ? 'empty' : [songs && 'a song', photos && `${photos} photo${photos > 1 ? 's' : ''}`].filter(Boolean).join(' and ')}`,
        !consent && 'They chose not to share their diary, so you know nothing about it.'
    ].filter(Boolean);
    return lines.length > 0 ? `${MEMORY_RULES}\n\nBackground:\n${lines.join('\n')}` : null;
};

// The memory agent's chat job: once enough new messages have built up since the last chat note,
// turn them into one note. Runs after the reply is sent, so the person never waits for it.
const rememberChat = async (userId: string, groqKey: string) => {
    try {
        const { data: last, error: lastError } = await admin
            .from('memories')
            .select('chat_until')
            .eq('user_id', userId)
            .eq('source', 'chat')
            .order('chat_until', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (lastError) throw lastError;

        let query = admin
            .from('chat_messages')
            .select('role, content, created_at')
            .eq('user_id', userId)
            .eq('is_safety', false)
            .order('created_at', { ascending: true })
            .limit(HISTORY_SIZE * 2);
        if (last) query = query.gt('created_at', last.chat_until);
        const { data: messages, error: messagesError } = await query;
        if (messagesError) throw messagesError;
        if (messages.length < CHAT_NOTE_EVERY) return;

        const text = messages
            .map((message) => `${message.role === 'user' ? 'Person' : 'Equilibria'}: ${message.content}`)
            .join('\n')
            .slice(-MAX_NOTE_INPUT);
        const note = await writeNote(groqKey, text);
        if (!note) return;

        const lastMessage = messages[messages.length - 1];
        const { error: saveError } = await admin.from('memories').insert({
            user_id: userId,
            source: 'chat',
            chat_until: lastMessage.created_at,
            happened_at: lastMessage.created_at,
            ...note
        });
        // 23505: these messages were already noted
        if (saveError && saveError.code !== '23505') throw saveError;
    } catch (error) {
        console.error('Noting the chat failed:', error instanceof Error ? error.message : (error as { message?: string }).message);
    }
};

Deno.serve(async (req) => {
    const cors = corsHeaders(req.headers.get('Origin'));
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    // Logs never include message text
    const serverError = (step: string, error: { message: string }) => {
        console.error(`${step} failed:`, error.message);
        return json({ error: 'server_error' }, 500);
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    // 1. Who is asking?
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const userId = token ? userIdFrom(token) : null;
    if (!userId) return json({ error: 'not_signed_in' }, 401);

    // 2. Is the message usable?
    let body: { message?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'bad_request' }, 400);
    }
    if (typeof body.message !== 'string' || !body.message.trim()) return json({ error: 'empty_message' }, 400);
    const text = body.message.trim();
    if (text.length > MAX_MESSAGE_LENGTH) return json({ error: 'too_long' }, 400);

    const saveMessage = (role: Role, content: string, isSafety = false, id?: string) =>
        admin.from('chat_messages').insert({ id, user_id: userId, role, content, is_safety: isSafety }).select('id').single();

    // 3. Daily limit, counted over the last 24 hours. Recent history (without safety messages)
    //    and the background are loaded at the same moment, to save time.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count, error: countError }, { data: recent, error: historyError }, background] = await Promise.all([
        admin
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('role', 'user')
            .gte('created_at', since),
        admin
            .from('chat_messages')
            .select('role, content')
            .eq('user_id', userId)
            .eq('is_safety', false)
            .order('created_at', { ascending: false })
            .limit(HISTORY_SIZE - 1),
        // Without the background the chat still works, it just knows less
        loadBackground(userId).catch((error) => {
            console.error('Loading the background failed:', error.message);
            return null;
        })
    ]);
    if (countError) return serverError('Counting messages', countError);
    if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'daily_limit' }, 429);

    // 4. Safety first: a crisis message gets the fixed reply and never reaches the AI
    if (mentionsCrisis(text)) {
        const saved = await saveMessage('user', text, true);
        let messageId: string | null = null;
        if (saved.error) console.error('Saving a safety message failed:', saved.error.message);
        else {
            const reply = await saveMessage('assistant', CRISIS_REPLY, true);
            if (reply.error) console.error('Saving the safety reply failed:', reply.error.message);
            else messageId = reply.data.id;
        }
        return json({ reply: CRISIS_REPLY, safety: true, messageId });
    }

    if (historyError) return serverError('Loading history', historyError);
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
        console.error('GROQ_API_KEY is not set');
        return json({ error: 'ai_unavailable' }, 503);
    }
    const systemMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (background) systemMessages.push({ role: 'system', content: background });

    // 5. Save the message while the AI thinks
    const savingMessage = saveMessage('user', text);

    let reply: string;
    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [...systemMessages, ...recent.reverse(), { role: 'user', content: text }],
                temperature: 0.7,
                max_completion_tokens: 1024,
                reasoning_effort: 'low'
            }),
            signal: AbortSignal.timeout(AI_TIMEOUT_MS)
        });
        if (!response.ok) throw new Error(`Groq answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
        const data = await response.json();
        reply = String(data.choices?.[0]?.message?.content ?? '').trim().slice(0, MAX_REPLY_LENGTH);
        if (!reply) throw new Error('Groq returned an empty reply');
    } catch (error) {
        console.error('AI call failed:', error instanceof Error ? error.message : String(error));
        // Take the message back out so trying again doesn't repeat it or use up the daily limit
        const saved = await savingMessage;
        if (saved.data) await admin.from('chat_messages').delete().eq('id', saved.data.id);
        return json({ error: 'ai_unavailable' }, 503);
    }

    // 6. Send the reply straight away (shown as plain text, never as HTML). It's saved just after,
    //    once the person's message is, so the two stay in order; then the memory agent may note the chat.
    const messageId = crypto.randomUUID(); // lets ai-voice read this reply aloud
    EdgeRuntime.waitUntil((async () => {
        const saved = await savingMessage;
        if (saved.error) console.error('Saving the message failed:', saved.error.message);
        const savedReply = await saveMessage('assistant', reply, false, messageId);
        if (savedReply.error) return console.error('Saving the reply failed:', savedReply.error.message);
        await rememberChat(userId, groqKey);
    })());
    return json({ reply, messageId, promptVersion: PROMPT_VERSION });
});
