import React, { useState } from 'react'
import FormNotice from '../auth/FormNotice'
import { useAuth } from '../../context/AuthContext'
import { clearChatHistory } from '../../lib/aiChat'
import { catchUpMemories, deleteAllMemories, deleteMemory, listMemories } from '../../lib/memories'
import { updateProfile } from '../../lib/profiles'
import { Divider, outlineClass, quietClass, SettingRow, SettingsCard, Toggle } from './settingsParts'

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Asks once before doing something that can't be undone
const ConfirmRow = ({ question, action, busyLabel, onConfirm, onCancel, busy }) => (
    <div className="p-4 rounded-xl bg-canvas flex flex-col gap-3">
        <p className="text-[15px] text-heading">{question}</p>
        <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onConfirm} disabled={busy} className={outlineClass}>{busy ? busyLabel : action}</button>
            <button type="button" onClick={onCancel} disabled={busy} className={quietClass}>Not now</button>
        </div>
    </div>
)

// The memory agent's notes, newest first, each one deletable
const MemoryList = ({ userId }) => {

    // { status: 'idle' (not shown yet) | 'loading' | 'ready' | 'error', notes }
    const [state, setState] = useState({ status: 'idle', notes: [] });
    const [confirmAll, setConfirmAll] = useState(false);
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState(null);

    const load = async () => {
        setState({ status: 'loading', notes: [] });
        try {
            setState({ status: 'ready', notes: await listMemories() });
        } catch (error) {
            console.error('Loading memories failed:', error.message);
            setState({ status: 'error', notes: [] });
        }
    }

    const forget = async (id) => {
        setProblem(null);
        try {
            await deleteMemory(id);
            setState((prev) => ({ ...prev, notes: prev.notes.filter((note) => note.id !== id) }));
        } catch (error) {
            console.error('Deleting a memory failed:', error.message);
            setProblem('That note didn’t delete. Try again.');
        }
    }

    const forgetAll = async () => {
        setBusy(true);
        setProblem(null);
        try {
            await deleteAllMemories(userId);
            setState({ status: 'ready', notes: [] });
            setConfirmAll(false);
        } catch (error) {
            console.error('Deleting all memories failed:', error.message);
            setProblem('The notes didn’t delete. Try again.');
        } finally {
            setBusy(false);
        }
    }

    if (state.status === 'idle') {
        return <div><button type="button" onClick={load} className={outlineClass}>Show what Equilibria remembers</button></div>;
    }
    if (state.status === 'loading') return <p role="status" className="text-[14px] text-body">Loading notes…</p>;
    if (state.status === 'error') return <FormNotice>We couldn’t load the notes. Check your connection and try again.</FormNotice>;

    return (
        <div className="flex flex-col gap-3">
            {state.notes.length === 0
                ? <p className="text-[14px] text-body">Nothing yet. Notes appear after you write in your diary or chat for a while.</p>
                : (
                    <ul className="flex flex-col gap-2" aria-label="What Equilibria remembers">
                        {state.notes.map((note) => (
                            <li key={note.id} className="p-3 rounded-xl bg-canvas flex items-start gap-3">
                                <span className="material-symbols-outlined text-[20px] text-leaf mt-0.5" aria-hidden="true">{note.source === 'diary' ? 'book' : 'chat_bubble'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-body">
                                        {note.source === 'diary' ? 'From your diary' : 'From a chat'} · {formatDate(note.happenedAt)}{note.mood ? ` · feeling ${note.mood}` : ''}
                                    </p>
                                    <p className="text-[14px] text-heading">{note.summary}</p>
                                </div>
                                <button type="button" onClick={() => forget(note.id)} aria-label={`Forget this note: ${note.summary}`} className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-body hover:text-heading hover:bg-card">
                                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            {problem && <FormNotice>{problem}</FormNotice>}
            {state.notes.length > 0 && (confirmAll
                ? <ConfirmRow question="Forget every note? Equilibria will start learning about you again from scratch." action="Forget everything" busyLabel="Forgetting…" busy={busy} onConfirm={forgetAll} onCancel={() => setConfirmAll(false)} />
                : <div><button type="button" onClick={() => setConfirmAll(true)} className={quietClass}>Forget everything</button></div>)}
        </div>
    )
}

// Diary permission, the memory notes, and clearing the chat
const PrivacySection = () => {

    const { session, profile, profileChanged } = useAuth();
    const userId = session.user.id;
    const [savingConsent, setSavingConsent] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [notice, setNotice] = useState(null);
    const [problem, setProblem] = useState(null);
    // Remounts the memory list after something deletes notes behind its back
    const [listKey, setListKey] = useState(0);

    const setConsent = async (allowed) => {
        setSavingConsent(true);
        setProblem(null);
        setNotice(null);
        try {
            // Switching off deletes the diary notes in the database itself (009_memories.sql)
            profileChanged(await updateProfile(userId, { diaryAiConsent: allowed }));
            if (allowed) catchUpMemories();
            setNotice(allowed
                ? 'Equilibria can now use your diary (never entries you mark private).'
                : 'Done. Equilibria won’t read your diary, and its notes about your diary are deleted.');
            setListKey((n) => n + 1);
        } catch (error) {
            console.error('Saving diary permission failed:', error.message);
            setProblem('That didn’t save. Check your connection and try again.');
        } finally {
            setSavingConsent(false);
        }
    }

    const clearChat = async () => {
        setClearing(true);
        setProblem(null);
        setNotice(null);
        try {
            await clearChatHistory(userId);
            setConfirmClear(false);
            setNotice('Your chat history is cleared.');
            setListKey((n) => n + 1);
        } catch (error) {
            console.error('Clearing the chat failed:', error.message);
            setProblem('The chat didn’t clear. Check your connection and try again.');
        } finally {
            setClearing(false);
        }
    }

    return (
        <SettingsCard id="settings-privacy" title="Privacy & AI" description="You decide what Equilibria’s AI can learn about you.">
            <SettingRow
                label="Let Equilibria read my diary"
                labelId="settings-diary-consent"
                detail="Lets the chat remember how you’ve been. Entries you mark private are never read."
            >
                <Toggle checked={profile.diaryAiConsent} onChange={setConsent} disabled={savingConsent} labelledBy="settings-diary-consent" />
            </SettingRow>

            <Divider />

            <div className="flex flex-col gap-3">
                <div>
                    <p className="text-[15px] font-medium text-heading">What Equilibria remembers</p>
                    <p className="text-[14px] text-body">Short notes the AI writes about your diary and chats. Never your own words.</p>
                </div>
                <MemoryList key={listKey} userId={userId} />
            </div>

            <Divider />

            {confirmClear
                ? <ConfirmRow question="Clear your whole chat history? This also deletes the notes about your chats, and can’t be undone." action="Clear chat history" busyLabel="Clearing…" busy={clearing} onConfirm={clearChat} onCancel={() => setConfirmClear(false)} />
                : (
                    <SettingRow label="Chat history" detail="Every message between you and Equilibria.">
                        <button type="button" onClick={() => { setNotice(null); setConfirmClear(true); }} className={outlineClass}>Clear</button>
                    </SettingRow>
                )}

            {problem && <FormNotice>{problem}</FormNotice>}
            {notice && <FormNotice tone="info" icon="check_circle">{notice}</FormNotice>}
        </SettingsCard>
    )
}

export default PrivacySection
