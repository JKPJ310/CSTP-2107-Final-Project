import { useEffect, useState } from 'react'
import { applyTheme, currentTheme, followSystemTheme, readSavedTheme, saveTheme, systemTheme, THEME_EVENT } from '../lib/theme'

// Light or dark mode, used by the navbar's sun/moon button and by Settings.
// Before anyone chooses, it follows the computer (and keeps following it if the computer
// switches to dark in the evening). Once someone chooses, their choice wins from then on.
// choice: 'light' | 'dark' | 'system' (following the computer)
export const useTheme = () => {

    const [theme, setTheme] = useState(currentTheme);
    const [choice, setChoice] = useState(() => readSavedTheme() ?? 'system');

    // In case the small script in index.html didn't run (or ran before storage was ready)
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        const sync = () => {
            setTheme(currentTheme());
            setChoice(readSavedTheme() ?? 'system');
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (readSavedTheme()) return; // They've picked a theme: leave it alone
            setTheme(systemTheme());
        }
        media.addEventListener('change', handleSystemChange);
        // Another control on the page changed it
        window.addEventListener(THEME_EVENT, sync);
        return () => {
            media.removeEventListener('change', handleSystemChange);
            window.removeEventListener(THEME_EVENT, sync);
        };
    }, []);

    const choose = (next) => {
        if (next === 'system') followSystemTheme();
        else saveTheme(next);
    }

    const toggle = () => choose(theme === 'dark' ? 'light' : 'dark');

    return { theme, choice, choose, toggle };
}
