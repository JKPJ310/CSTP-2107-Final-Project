// Equilibria: log in with a username and password.
// Supabase Auth only knows emails, so this looks up the email for a username on the server.
// Doing it in the browser would let anyone find out any user's email.
// Deploy with: npm run login:deploy
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const MAX_PASSWORD = 72;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(supabaseUrl, serviceKey);

Deno.serve(async (req) => {
    const cors = corsHeaders(req.headers.get('Origin'));
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    // Same answer for an unknown username and a wrong password, so nobody can probe which usernames exist
    const wrongDetails = () => json({ error: 'invalid_credentials' }, 401);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body: { username?: unknown; password?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'bad_request' }, 400);
    }
    const { username, password } = body;
    if (typeof username !== 'string' || typeof password !== 'string' || !password || password.length > MAX_PASSWORD) return wrongDetails();
    if (!USERNAME_PATTERN.test(username)) return wrongDetails();

    // 1. Username → account. "_" is a wildcard in ilike, so escape it to match it literally.
    const { data: profile, error: lookupError } = await admin
        .from('profiles')
        .select('id')
        .ilike('username', username.replaceAll('_', '\\_'))
        .maybeSingle();
    if (lookupError) {
        console.error('Username lookup failed:', lookupError.message);
        return json({ error: 'server_error' }, 500);
    }
    if (!profile) return wrongDetails();

    // 2. Account → email
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(profile.id);
    if (accountError || !account.user.email) {
        console.error('Account lookup failed:', accountError?.message ?? 'no email');
        return json({ error: 'server_error' }, 500);
    }

    // 3. Check the password with Supabase Auth. A fresh client per request, so one person's
    //    session never ends up on the shared admin client.
    const auth = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signIn, error: signInError } = await auth.auth.signInWithPassword({ email: account.user.email, password });
    if (signInError) {
        if (signInError.code === 'invalid_credentials') return wrongDetails();
        if (signInError.code === 'email_not_confirmed') return json({ error: 'email_not_confirmed' }, 403);
        if (signInError.status === 429) return json({ error: 'too_many_tries' }, 429);
        console.error('Sign in failed:', signInError.message);
        return json({ error: 'server_error' }, 500);
    }

    // The browser turns these into a normal signed-in session
    return json({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token });
});
