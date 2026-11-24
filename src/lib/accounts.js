import { supabase } from './supabase'

// Usernames, passwords and logging in. Passwords go straight to Supabase Auth,
// which stores them as bcrypt hashes; our own tables never hold a password.

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;

// A problem with a username or password as a sentence, or null if it's fine
export const usernameProblem = (username) => {
    if (username.length < 3 || username.length > 20) return 'Use 3 to 20 characters for your username.';
    if (!USERNAME_PATTERN.test(username)) return 'Use only letters, numbers and underscores (_) in your username.';
    return null;
}

export const passwordProblem = (password, confirm) => {
    if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters for your password.`;
    if (password.length > MAX_PASSWORD) return `Use ${MAX_PASSWORD} characters or fewer for your password.`;
    if (password !== confirm) return 'The two passwords don’t match.';
    return null;
}

// Throws the Supabase error on failure
export const isUsernameAvailable = async (username) => {
    const { data, error } = await supabase.rpc('username_available', { name: username });
    if (error) throw error;
    return data;
}

// Logs in through the login edge function, which looks up the email on the server.
// On failure throws an Error with .code: 'invalid_credentials', 'email_not_confirmed',
// 'too_many_tries', 'server_error' or 'network'
export const logInWithUsername = async (username, password) => {
    const { data, error } = await supabase.functions.invoke('login', { body: { username, password } });
    if (!error) {
        const { error: sessionError } = await supabase.auth.setSession(data);
        if (sessionError) throw Object.assign(new Error(sessionError.message), { code: 'server_error' });
        return;
    }

    let code = 'network';
    if (error.context instanceof Response) {
        try {
            code = (await error.context.json()).error ?? 'server_error';
        } catch {
            code = 'server_error';
        }
    }
    throw Object.assign(new Error(`Log in failed: ${code}`), { code });
}

// Checks the current password before a change, so nobody can change it on a laptop left open.
// Throws an Error with .code 'wrong_password' or 'server_error'.
const checkPassword = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return;
    throw Object.assign(new Error(error.message), { code: error.code === 'invalid_credentials' ? 'wrong_password' : 'server_error' });
}

export const changePassword = async (email, currentPassword, newPassword) => {
    await checkPassword(email, currentPassword);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw Object.assign(new Error(error.message), { code: error.code === 'same_password' ? 'same_password' : 'server_error' });
}

// Supabase emails a confirmation link; the email only changes once it's clicked
// (with "Secure email change" on, a link goes to both the old and the new address).
export const changeEmail = async (newEmail) => {
    const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/settings` }
    );
    if (error) throw Object.assign(new Error(error.message), { code: error.code === 'email_exists' ? 'email_taken' : error.status === 429 ? 'too_many_tries' : 'server_error' });
}

// Deletes the account and everything in it, through the delete-account edge function.
// Throws an Error with .code 'wrong_username', 'server_error' or 'network'.
export const deleteAccount = async (username) => {
    const { error } = await supabase.functions.invoke('delete-account', { body: { username } });
    if (!error) {
        await supabase.auth.signOut({ scope: 'local' });
        return;
    }
    let code = 'network';
    if (error.context instanceof Response) {
        code = await error.context.json().then((body) => body.error ?? 'server_error', () => 'server_error');
    }
    throw Object.assign(new Error(`Deleting the account failed: ${code}`), { code });
}
