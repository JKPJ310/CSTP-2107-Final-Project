import { useCallback, useEffect, useState } from 'react'
import { createGoal, deleteGoal, isDone, listGoals, renameGoal, setGoalDone } from '../lib/goalsStore'

// The signed-in user's goals, shared by the Goals page and the homepage tile.
// Actions throw on failure so the caller can show a message.
export const useGoals = (userId) => {

    const [state, setState] = useState({ userId: null, status: 'loading', goals: [] });
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        listGoals()
            .then((goals) => {
                if (!cancelled) setState({ userId, status: 'ready', goals });
            })
            .catch((error) => {
                console.error('Loading goals failed:', error.message);
                if (!cancelled) setState({ userId, status: 'error', goals: [] });
            });
        return () => { cancelled = true; };
    }, [userId, reloadCount]);

    const replaceGoal = (goal) => setState((prev) => ({ ...prev, goals: prev.goals.map((g) => (g.id === goal.id ? goal : g)) }));

    // Ticking is shown straight away and undone if saving fails
    const toggle = async (goal) => {
        const done = !isDone(goal.doneAt);
        replaceGoal({ ...goal, doneAt: done ? new Date().toISOString() : null });
        try {
            replaceGoal(await setGoalDone(goal.id, done));
        } catch (error) {
            replaceGoal(goal);
            throw error;
        }
    }

    const add = async (text) => {
        const goal = await createGoal(text);
        setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
    }

    const rename = async (id, text) => replaceGoal(await renameGoal(id, text));

    const remove = async (id) => {
        await deleteGoal(id);
        setState((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
    }

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, status: 'loading' }));
        setReloadCount((n) => n + 1);
    }, []);

    return {
        status: state.userId === userId ? state.status : 'loading',
        goals: state.goals,
        toggle, add, rename, remove, reload
    };
}
