// Equilibria: delete my account. Only the server may delete a login, so Settings calls this.
// The person types their username to confirm. Deleting the login deletes everything that hangs
// off it (profile, diary, chat, goals, comfort kit, letters, memory notes: every table uses
// "on delete cascade"); stored photos are removed first, because files don't cascade.
// Deploy with: npm run account:deploy
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const BUCKETS = ['avatars', 'comfort-photos']; // files live at <bucket>/<user id>/<file>

// Server-side client: the user id always comes from the login token, never from the request
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
    const cors = corsHeaders(req.headers.get('Origin'));
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
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

    // 2. Did they type their own username?
    let body: { username?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'bad_request' }, 400);
    }
    const { data: profile, error: profileError } = await admin.from('profiles').select('username').eq('id', userId).maybeSingle();
    if (profileError) return serverError('Loading the profile', profileError);
    const typed = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    if (!profile?.username || typed !== profile.username.toLowerCase()) return json({ error: 'wrong_username' }, 400);

    // 3. Their stored photos
    for (const bucket of BUCKETS) {
        const { data: files, error: listError } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
        if (listError) return serverError(`Listing ${bucket}`, listError);
        if (files.length === 0) continue;
        const { error: removeError } = await admin.storage.from(bucket).remove(files.map((file) => `${userId}/${file.name}`));
        if (removeError) return serverError(`Removing ${bucket}`, removeError);
    }

    // 4. The login itself, and with it every row that belongs to them
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return serverError('Deleting the account', deleteError);
    return json({ deleted: true });
});
