// Light or dark mode, remembered in this browser. The first visit follows the computer.
// The same storage key is read by the small script in index.html, so the page paints in
// the right theme straight away and never flashes white.

export const THEME_KEY = 'equilibria.theme';

// 'dark', 'light', or null when the person hasn't chosen yet
export const readSavedTheme = () => {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === 'dark' || saved === 'light' ? saved : null;
    } catch {
        return null; // Storage blocked (private window): fall back to the computer's setting
    }
}

export const systemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export const currentTheme = () => readSavedTheme() ?? systemTheme();

// Adds or removes .dark on <html>. All the colours in App.css flip from that one class.
// The theme-color meta tag tints the browser's address bar to match.
export const applyTheme = (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0C1210' : '#F8FAFB');
}

// Tells every theme control on the page (navbar button, Settings) that the choice changed
export const THEME_EVENT = 'equilibria:theme';
const announce = () => window.dispatchEvent(new Event(THEME_EVENT));

// Applies the theme now and remembers it for next time. If storage is blocked the
// theme still changes, it just won't be remembered.
export const saveTheme = (theme) => {
    applyTheme(theme);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Nothing to do: the next visit follows the computer again
    }
    announce();
}

// "Match my device": forget the choice and follow the computer again
export const followSystemTheme = () => {
    try {
        localStorage.removeItem(THEME_KEY);
    } catch {
        // Storage blocked: nothing was saved anyway
    }
    applyTheme(systemTheme());
    announce();
}
