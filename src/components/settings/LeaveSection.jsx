import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormNotice from '../auth/FormNotice'
import { useAuth } from '../../context/AuthContext'
import { deleteAccount } from '../../lib/accounts'
import { supabase } from '../../lib/supabase'
import { fieldClass, labelClass, outlineClass, quietClass, SettingRow, SettingsCard } from './settingsParts'

const DELETE_ERRORS = {
    wrong_username: 'That isn’t your username. Type it exactly as shown.',
    not_signed_in: 'Your login has expired. Log in again, then try once more.'
};

// Log out, or delete the account and everything in it (after typing the username)
const LeaveSection = () => {

    const { profile } = useAuth();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const [typed, setTyped] = useState('');
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState(null);
    const matches = typed.trim().toLowerCase() === (profile.username ?? '').toLowerCase();

    const logOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Log out failed:', error.message);
        navigate('/');
    }

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!matches) return setProblem(DELETE_ERRORS.wrong_username);
        setBusy(true);
        setProblem(null);
        try {
            await deleteAccount(typed.trim());
            navigate('/', { replace: true });
        } catch (error) {
            console.error(error.message);
            setProblem(DELETE_ERRORS[error.code] ?? 'Your account wasn’t deleted. Check your connection and try again.');
            setBusy(false);
        }
    }

    return (
        <SettingsCard id="settings-leave" title="Your account">
            <SettingRow label="Log out" detail="You can log back in any time.">
                <button type="button" onClick={logOut} className={outlineClass}>Log out</button>
            </SettingRow>

            {!deleting ? (
                <div>
                    <button type="button" onClick={() => setDeleting(true)} className="text-[14px] font-medium text-body underline underline-offset-4 hover:text-heading">
                        Delete my account
                    </button>
                </div>
            ) : (
                <form onSubmit={handleDelete} className="p-4 rounded-xl bg-canvas flex flex-col gap-4" noValidate>
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[16px] font-semibold text-heading">Delete your account?</h3>
                        <p className="text-[14px] text-body">
                            This deletes your account and everything in it, for good: your diary, chats, goals,
                            comfort kit, letters, and everything Equilibria remembers. It can’t be undone.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="settings-delete-confirm" className={labelClass}>
                            Type your username, <span className="font-semibold">{profile.username}</span>, to confirm
                        </label>
                        <input id="settings-delete-confirm" autoComplete="off" autoCapitalize="none" spellCheck={false} value={typed} onChange={(e) => { setTyped(e.target.value); setProblem(null); }} className={fieldClass} />
                    </div>
                    {problem && <FormNotice>{problem}</FormNotice>}
                    <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={busy || !matches} className={outlineClass}>{busy ? 'Deleting…' : 'Delete my account forever'}</button>
                        <button type="button" onClick={() => { setDeleting(false); setTyped(''); setProblem(null); }} disabled={busy} className={quietClass}>Keep my account</button>
                    </div>
                </form>
            )}
        </SettingsCard>
    )
}

export default LeaveSection
