import React, { useState } from 'react'
import FormNotice from '../auth/FormNotice'
import { PasswordInput } from '../auth/fields'
import { useAuth } from '../../context/AuthContext'
import { changeEmail, changePassword, EMAIL_PATTERN, passwordProblem } from '../../lib/accounts'
import { Divider, fieldClass, labelClass, outlineClass, quietClass, SettingRow, SettingsCard } from './settingsParts'

const EMAIL_ERRORS = {
    email_taken: 'Another account already uses that email.',
    too_many_tries: 'Too many emails sent for now. Wait a few minutes and try again.'
};
const PASSWORD_ERRORS = {
    wrong_password: 'Your current password isn’t right.',
    same_password: 'That’s the password you already have. Choose a new one.'
};
const FALLBACK = 'That didn’t work. Check your connection and try again.';

// New email: Supabase sends a link, and nothing changes until it's clicked
const EmailForm = ({ current, onDone }) => {

    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const next = email.trim();
        if (!EMAIL_PATTERN.test(next)) return setProblem('That doesn’t look like an email address.');
        if (next.toLowerCase() === current.toLowerCase()) return setProblem('That’s the email you already use.');
        setBusy(true);
        setProblem(null);
        try {
            await changeEmail(next);
            onDone(next);
        } catch (error) {
            console.error('Changing the email failed:', error.message);
            setProblem(EMAIL_ERRORS[error.code] ?? FALLBACK);
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div>
                <label htmlFor="settings-new-email" className={labelClass}>New email</label>
                <input id="settings-new-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} autoFocus />
            </div>
            {problem && <FormNotice>{problem}</FormNotice>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy || !email.trim()} className={outlineClass}>{busy ? 'Sending…' : 'Send confirmation link'}</button>
                <button type="button" onClick={() => onDone(null)} disabled={busy} className={quietClass}>Cancel</button>
            </div>
        </form>
    )
}

// New password, after the current one is checked
const PasswordForm = ({ email, onDone }) => {

    const [values, setValues] = useState({ current: '', next: '', confirm: '' });
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState(null);
    const setField = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!values.current) return setProblem('Type your current password first.');
        const fieldProblem = passwordProblem(values.next, values.confirm);
        if (fieldProblem) return setProblem(fieldProblem);
        setBusy(true);
        setProblem(null);
        try {
            await changePassword(email, values.current, values.next);
            onDone(true);
        } catch (error) {
            console.error('Changing the password failed:', error.message);
            setProblem(PASSWORD_ERRORS[error.code] ?? FALLBACK);
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <PasswordInput id="settings-current-password" label="Current password" value={values.current} onChange={setField('current')} autoComplete="current-password" />
            <PasswordInput id="settings-new-password" label="New password" value={values.next} onChange={setField('next')} autoComplete="new-password" />
            <PasswordInput id="settings-confirm-password" label="New password again" value={values.confirm} onChange={setField('confirm')} autoComplete="new-password" />
            <p className="text-[12px] text-body">At least 8 characters.</p>
            {problem && <FormNotice>{problem}</FormNotice>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className={outlineClass}>{busy ? 'Saving…' : 'Change password'}</button>
                <button type="button" onClick={() => onDone(false)} disabled={busy} className={quietClass}>Cancel</button>
            </div>
        </form>
    )
}

// Email and password
const AccountSection = () => {

    const { session } = useAuth();
    const email = session.user.email;
    const usesGoogle = session.user.identities?.some((identity) => identity.provider === 'google');
    // null | 'email' | 'password': which form is open
    const [editing, setEditing] = useState(null);
    const [notice, setNotice] = useState(null);

    const open = (form) => {
        setNotice(null);
        setEditing(form);
    }

    return (
        <SettingsCard id="settings-account" title="Account">
            {editing === 'email'
                ? <EmailForm current={email} onDone={(sentTo) => {
                    setEditing(null);
                    if (sentTo) setNotice(<>We sent a confirmation link to <span className="font-medium">{sentTo}</span>. Your email changes once you click it. If a link also arrives at your current address, click that one too.</>);
                }} />
                : (
                    <SettingRow label="Email" detail={<>{email}{usesGoogle && <span className="block text-[12px]">You also log in with Google.</span>}</>}>
                        <button type="button" onClick={() => open('email')} className={outlineClass}>Change</button>
                    </SettingRow>
                )}

            <Divider />

            {editing === 'password'
                ? <PasswordForm email={email} onDone={(changed) => {
                    setEditing(null);
                    if (changed) setNotice('Your password is changed. Use the new one next time you log in.');
                }} />
                : (
                    <SettingRow label="Password" detail="••••••••">
                        <button type="button" onClick={() => open('password')} className={outlineClass}>Change</button>
                    </SettingRow>
                )}

            {notice && <FormNotice tone="info" icon="check_circle">{notice}</FormNotice>}
        </SettingsCard>
    )
}

export default AccountSection
