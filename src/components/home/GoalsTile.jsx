import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGoals } from '../../hooks/useGoals'
import { isDone, isGoalLimitError, MAX_GOALS } from '../../lib/goalsStore'
import GoalCheck from '../goals/GoalCheck'
import { Tile, TileHeader } from './Tile'

// What the tile shows. goals: [{ id, text, done }]
const GoalsTileView = ({ status, goals, suggestions, message, onToggle, onAddSuggestion, onNotNow, className, style }) => (
    <Tile labelledBy="goals-heading" className={className} style={style}>
        <TileHeader
            id="goals-heading"
            icon="adjust"
            title="My goals"
            aside={<Link to="/goals" className="text-[13px] font-medium text-forest hover:underline">Edit</Link>}
        />

        {status === 'loading' && <p role="status" className="mt-5 text-[15px] text-body">Opening your goals…</p>}
        {status === 'error' && <p role="alert" className="mt-5 text-[15px] text-heading">We couldn’t load your goals. Check your connection and refresh.</p>}

        {status === 'ready' && (goals.length === 0 ? (
            <p className="mt-5 text-[15px] text-body">
                No goals yet. <Link to="/goals" className="font-medium text-forest hover:underline">Add one small thing.</Link>
            </p>
        ) : (
            <ul className="mt-5 flex flex-col gap-2">
                {goals.map((goal) => (
                    <li key={goal.id} className="flex p-3.5 rounded-xl bg-canvas">
                        <GoalCheck text={goal.text} done={goal.done} onToggle={() => onToggle(goal.id)} />
                    </li>
                ))}
            </ul>
        ))}

        {status === 'ready' && suggestions.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
                <h3 className="text-[12px] font-semibold text-body">Suggested for you</h3>
                {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border border-hairline">
                        <span className="flex items-center gap-2 text-[14px] text-heading">
                            <span className="material-symbols-outlined text-[18px] text-leaf" aria-hidden="true">{suggestion.icon}</span>
                            {suggestion.text}
                        </span>
                        <span className="flex items-center gap-3">
                            <button type="button" onClick={() => onAddSuggestion(suggestion)} className="text-[13px] font-semibold text-forest hover:underline">Add</button>
                            <button type="button" onClick={() => onNotNow(suggestion)} className="text-[13px] text-body hover:text-heading">Not now</button>
                        </span>
                    </div>
                ))}
            </div>
        )}

        <p role="status" className="mt-3 min-h-5 text-[13px] text-forest">{message}</p>
        <p className="mt-auto pt-3 text-center text-[13px] text-body">Zero streaks. Rest whenever you need.</p>
    </Tile>
)

// Suggestions are only ever added when the person taps "Add"; "Not now" hides one for this visit
const useSuggestions = (initial) => {
    const [suggestions, setSuggestions] = useState(initial);
    const hide = (id) => setSuggestions((prev) => prev.filter((s) => s.id !== id));
    return [suggestions, hide];
}

// The signed-in person's goals, saved in Supabase
const LiveGoalsTile = ({ userId, initialSuggestions, ...layout }) => {

    const { status, goals, toggle, add } = useGoals(userId);
    const [suggestions, hideSuggestion] = useSuggestions(initialSuggestions);
    const [message, setMessage] = useState('');

    const handleToggle = async (id) => {
        setMessage('');
        try {
            await toggle(goals.find((g) => g.id === id));
        } catch (error) {
            console.error('Ticking a goal failed:', error.message);
            setMessage('That didn’t save. Check your connection and try again.');
        }
    }

    const handleAddSuggestion = async (suggestion) => {
        if (goals.length >= MAX_GOALS) {
            setMessage(`You already have ${MAX_GOALS} goals. Finish or remove one first.`);
            return;
        }
        try {
            await add(suggestion.text);
            hideSuggestion(suggestion.id);
            setMessage(`Added “${suggestion.text}” to your goals.`);
        } catch (error) {
            console.error('Adding a suggested goal failed:', error.message);
            setMessage(isGoalLimitError(error) ? `You already have ${MAX_GOALS} goals.` : 'That didn’t save. Check your connection and try again.');
        }
    }

    const handleNotNow = (suggestion) => {
        hideSuggestion(suggestion.id);
        setMessage('Okay. It won’t be added.');
    }

    return (
        <GoalsTileView
            {...layout}
            status={status}
            goals={goals.map((g) => ({ id: g.id, text: g.text, done: isDone(g.doneAt) }))}
            suggestions={suggestions}
            message={message}
            onToggle={handleToggle}
            onAddSuggestion={handleAddSuggestion}
            onNotNow={handleNotNow}
        />
    )
}

const GoalsTile = ({ initialSuggestions, className, style }) => {
    const { session } = useAuth();
    return <LiveGoalsTile userId={session.user.id} initialSuggestions={initialSuggestions} className={className} style={style} />;
}

export default GoalsTile
