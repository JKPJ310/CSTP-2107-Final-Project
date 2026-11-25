// Which websites may call Equilibria's edge functions from a browser.
// Supabase secret ALLOWED_ORIGINS, comma separated. A * matches any letters, numbers or dashes,
// so "https://ai-burnout*.vercel.app" covers every address Vercel gives the project.
const patterns = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const matchers = patterns.map((pattern) => new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[a-z0-9-]*')}$`,
    'i'
));

const allowed = (origin: string | null) => Boolean(origin) && matchers.some((matcher) => matcher.test(origin!));

export const corsHeaders = (origin: string | null) => ({
    'Access-Control-Allow-Origin': allowed(origin) ? origin! : patterns[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'X-Sample-Rate',
    'Vary': 'Origin'
});
