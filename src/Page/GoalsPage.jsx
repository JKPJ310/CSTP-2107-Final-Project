import React, { useState } from 'react'
import GoalCheck from '../components/goals/GoalCheck'
import RequireAuth from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { isDone, isGoalLimitError, MAX_GOALS } from '../lib/goalsStore'
import BackHome from '../components/BackHome'

const MAX_LENGTH = 120;

const inputClass = 'flex-1 min-w-0 h-11 px-3 rounded-xl bg-canvas border border-hairline text-[15px] text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15';
const quietButtonClass = 'h-9 px-3 rounded-lg text-[14px] font-medium text-body hover:text-heading hover:bg-canvas disabled:opacity-60';

const friendlyError = (error, action) => {
    console.error(`${action} failed:`, error.message);
    if (isGoalLimitError(error)) return `You already have ${MAX_GOALS} goals. Finish or remove one first.`;
    return 'That didn’t save. Check your connection and try again.';
}

// One row: tick, text, and Edit / Delete (each asks before changing anything)
const GoalRow = ({ goal, onToggle, onRename, onRemove }) => {

    const [mode, setMode] = useState('view');
    const [draft, setDraft] = useState(goal.text);
    const [busy, setBusy] = useState(false);

    const handleRename = async (e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        setBusy(true);
        const ok = await onRename(goal.id, draft);
        setBusy(false);
        if (ok) setMode('view');
    }

    const handleRemove = async () => {
        setBusy(true);
        const ok = await onRemove(goal.id);
        if (!ok) {
            setBusy(false);
            setMode('view');
        }
    }

    if (mode === 'edit') {
        return (
            <form onSubmit={handleRename} className="flex flex-wrap items-center gap-2">
                <label htmlFor={`goal-edit-${goal.id}`} className="sr-only">Goal</label>
                <input id={`goal-edit-${goal.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={MAX_LENGTH} className={inputClass} autoFocus />
                <button type="submit" disabled={busy || !draft.trim()} className="h-11 px-4 rounded-xl bg-forest text-on-primary text-[14px] font-medium hover:bg-forest/90 disabled:opacity-60">
                    {busy ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => { setDraft(goal.text); setMode('view'); }} disabled={busy} className={quietButtonClass}>Cancel</button>
            </form>
        )
    }

    if (mode === 'confirm-delete') {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] text-heading">Remove “{goal.text}”?</p>
                <div className="flex gap-2">
                    <button type="button" onClick={handleRemove} disabled={busy} className="h-9 px-4 rounded-lg bg-forest text-on-primary text-[14px] font-medium hover:bg-forest/90 disabled:opacity-60">
                        {busy ? 'Removing…' : 'Remove'}
                    </button>
                    <button type="button" onClick={() => setMode('view')} disabled={busy} className={quietButtonClass}>Keep it</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <GoalCheck text={goal.text} done={isDone(goal.doneAt)} onToggle={() => onToggle(goal)} />
            <div className="flex">
                <button type="button" onClick={() => setMode('edit')} className={quietButtonClass} aria-label={`Edit “${goal.text}”`}>Edit</button>
                <button type="button" onClick={() => setMode('confirm-delete')} className={quietButtonClass} aria-label={`Remove “${goal.text}”`}>Remove</button>
            </div>
        </div>
    )
}

const GoalsManager = () => {

    const { session } = useAuth();
    const { status, goals, toggle, add, rename, remove, reload } = useGoals(session.user.id);
    const [newText, setNewText] = useState('');
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');

    // Each action returns true when it worked, so a row can close its edit/confirm state
    const run = async (action, label, success) => {
        setMessage('');
        try {
            await action();
            if (success) setMessage(success);
            return true;
        } catch (error) {
            setMessage(friendlyError(error, label));
            return false;
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newText.trim()) return;
        setAdding(true);
        const ok = await run(() => add(newText), 'Adding a goal', 'Goal added.');
        setAdding(false);
        if (ok) setNewText('');
    }

    const atLimit = goals.length >= MAX_GOALS;

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="animate-fade-in">
                    <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">My goals</h1>
                    <p className="text-[15px] text-body">Up to {MAX_GOALS} small things. Tick one when it’s done; the tick clears after 24 hours.</p>
                </header>

                {status === 'loading' && <p role="status" className="text-[15px] text-body">Opening your goals…</p>}

                {status === 'error' && (
                    <div role="alert" className="p-5 rounded-[20px] bg-card border border-hairline flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-heading">We couldn’t load your goals. Check your connection.</p>
                        <button type="button" onClick={reload} className="text-[14px] font-semibold text-forest hover:underline">Try again</button>
                    </div>
                )}

                {status === 'ready' && (
                    <section aria-labelledby="goals-list-heading" className="bg-card border border-hairline rounded-[20px] p-5 md:p-6 flex flex-col gap-5 animate-fade-in">
                        <h2 id="goals-list-heading" className="sr-only">Your goals</h2>

                        {goals.length === 0 ? (
                            <p className="text-[15px] text-body">No goals yet. What’s one small thing that would help this week?</p>
                        ) : (
                            <ul className="flex flex-col divide-y divide-hairline">
                                {goals.map((goal) => (
                                    <li key={goal.id} className="py-3 first:pt-0 last:pb-0">
                                        <GoalRow
                                            goal={goal}
                                            onToggle={(g) => run(() => toggle(g), 'Ticking a goal')}
                                            onRename={(id, text) => run(() => rename(id, text), 'Editing a goal', 'Goal updated.')}
                                            onRemove={(id) => run(() => remove(id), 'Removing a goal', 'Goal removed.')}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="pt-5 border-t border-hairline">
                            {atLimit ? (
                                <p className="text-[14px] text-body">Small goals work best. You have {MAX_GOALS} already. Finish or remove one to add another.</p>
                            ) : (
                                <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="new-goal" className="sr-only">New goal</label>
                                    <input
                                        id="new-goal"
                                        value={newText}
                                        onChange={(e) => setNewText(e.target.value)}
                                        maxLength={MAX_LENGTH}
                                        placeholder="e.g. Phone off by 11pm"
                                        className={inputClass}
                                    />
                                    <button type="submit" disabled={adding || !newText.trim()} className="h-11 px-5 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 disabled:opacity-60">
                                        {adding ? 'Adding…' : 'Add goal'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <p role="status" className="min-h-5 text-[13px] text-forest">{message}</p>
                    </section>
                )}

                <p className="text-center text-[13px] text-body">Zero streaks. Rest whenever you need.</p>
                <BackHome />
            </main>
        </div>
    )
}

const GoalsPage = () => (
    <RequireAuth>
        <GoalsManager />
    </RequireAuth>
)

export default GoalsPage
