// Equilibria memory agent: turns diary entries into short notes the AI chat uses as background.
// The app calls it with { entryId } after a diary entry is saved, and with { catchUp: true } when
// the chat opens, to note recent entries that have none yet. Chat notes are written by ai-chat itself.
// Deploy with: npm run ai:deploy
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { mentionsCrisis, writeNote } from '../_shared/memory.ts';

const DAILY_LIMIT = 30;     // diary notes a person can get in any 24 hours
const CATCH_UP_DAYS = 30;   // catch-up looks this far back
const CATCH_UP_MAX = 5;     // and notes at most this many entries per call
const DAY_MS = 24 * 60 * 60 * 1000;

type Entry = { id: string; body: string; is_private: boolean; created_at: string };
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-side client: the user id always comes from the login token, never from the request
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
    const cors = corsHeaders(req.headers.get('Origin'));
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    // Logs never include diary text
    const serverError = (step: string, error: { message: string }) => {
        console.error(`${step} failed:`, error.message);
        return json({ error: 'server_error' }, 500);
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    // 1. Who is asking?
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'not_signed_in' }, 401);
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return json({ error: 'not_signed_in' }, 401);
    const userId = auth.user.id;

    let body: { entryId?: unknown; catchUp?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'bad_request' }, 400);
    }

    const { data: profile, error: profileError } = await admin.from('profiles').select('diary_ai_consent').eq('id', userId).maybeSingle();
    if (profileError) return serverError('Loading the profile', profileError);
    const consent = Boolean(profile?.diary_ai_consent);

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
        console.error('GROQ_API_KEY is not set');
        return json({ error: 'ai_unavailable' }, 503);
    }

    // Writes (or removes) the note for one entry. Returns 'noted', 'kept', 'skipped' or 'limit'.
    const noteEntry = async (entry: Entry) => {
        // Privacy: no note without diary consent, for private entries, or for entries that
        // mention a crisis. Any old note for the entry goes too.
        if (!consent || entry.is_private || mentionsCrisis(entry.body)) {
            const { error } = await admin.from('memories').delete().eq('diary_entry_id', entry.id);
            if (error) throw error;
            return 'skipped';
        }

        // Already noted? (Editing the words drops the old note, so this means nothing changed.)
        const { data: existing, error: existingError } = await admin
            .from('memories').select('id').eq('diary_entry_id', entry.id).maybeSingle();
        if (existingError) throw existingError;
        if (existing) return 'kept';

        // Daily limit, counted over the last 24 hours
        const since = new Date(Date.now() - DAY_MS).toISOString();
        const { count, error: countError } = await admin
            .from('memories')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('source', 'diary')
            .gte('created_at', since);
        if (countError) throw countError;
        if ((count ?? 0) >= DAILY_LIMIT) return 'limit';

        const note = await writeNote(groqKey, entry.body);
        if (!note) throw new Error('the AI could not write a note');
        const { error: saveError } = await admin.from('memories').insert({
            user_id: userId,
            source: 'diary',
            diary_entry_id: entry.id,
            happened_at: entry.created_at,
            ...note
        });
        // 23505: another request noted this entry at the same moment, which is fine
        if (saveError && saveError.code !== '23505') throw saveError;
        return 'noted';
    };

    try {
        // Catch up: recent entries that have no note yet (written before the agent existed,
        // before diary consent was switched on, or when a note failed). A few at a time.
        if (body.catchUp === true) {
            if (!consent) return json({ noted: 0 });
            const since = new Date(Date.now() - CATCH_UP_DAYS * DAY_MS).toISOString();
            const [entries, notes] = await Promise.all([
                admin.from('diary_entries').select('id, body, is_private, created_at')
                    .eq('user_id', userId).eq('is_private', false).gte('created_at', since)
                    .order('created_at', { ascending: false }).limit(50),
                admin.from('memories').select('diary_entry_id').eq('user_id', userId).eq('source', 'diary')
            ]);
            if (entries.error) throw entries.error;
            if (notes.error) throw notes.error;
            const noted = new Set(notes.data.map((note) => note.diary_entry_id));
            const missing = (entries.data as Entry[]).filter((entry) => !noted.has(entry.id)).slice(0, CATCH_UP_MAX);
            let written = 0;
            for (const entry of missing) {
                const result = await noteEntry(entry);
                if (result === 'limit') break;
                if (result === 'noted') written += 1;
            }
            return json({ noted: written });
        }

        // One entry, just saved. Only ever one of their own.
        if (typeof body.entryId !== 'string' || !ID_PATTERN.test(body.entryId)) return json({ error: 'not_found' }, 404);
        const { data: entry, error: entryError } = await admin
            .from('diary_entries').select('id, body, is_private, created_at')
            .eq('id', body.entryId).eq('user_id', userId).maybeSingle();
        if (entryError) throw entryError;
        if (!entry) return json({ error: 'not_found' }, 404);

        const result = await noteEntry(entry as Entry);
        if (result === 'limit') return json({ error: 'daily_limit' }, 429);
        return json({ remembered: result !== 'skipped' });
    } catch (error) {
        console.error('Noting the diary failed:', error instanceof Error ? error.message : (error as { message?: string }).message);
        return json({ error: 'server_error' }, 500);
    }
});
