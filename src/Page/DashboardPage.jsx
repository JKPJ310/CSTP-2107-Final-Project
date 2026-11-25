import React, { useEffect, useState } from 'react'
import ComfortKitTile from '../components/home/ComfortKitTile'
import DiaryTile from '../components/home/DiaryTile'
import GoalsTile from '../components/home/GoalsTile'
import LetterTile from '../components/home/LetterTile'
import TodayCard from '../components/home/TodayCard'
import { useAuth } from '../context/AuthContext'
import { homePlaceholder } from '../data/homePlaceholder'
import { dayNumber, formatTime, formatTodayLong, greetingFor } from '../lib/dates'
import { getDiarySummary } from '../lib/diaryStore'
import { getLetterSummary } from '../lib/lettersStore'
import { getDisplayName } from '../lib/profiles'

// The diary tile's content from the signed-in person's latest entry
const diaryTileProps = (userId, diary) => {
    if (diary.userId !== userId) return { status: 'loading' };
    if (diary.status === 'error') return { status: 'error' };
    if (!diary.latest) return { status: 'empty' };
    const { latest, firstDate } = diary;
    return {
        status: 'ready',
        entry: { id: latest.id, day: dayNumber(firstDate), text: latest.body, tags: latest.tags, time: formatTime(latest.createdAt), isPrivate: latest.isPrivate }
    };
}

// Tiles fade in one after another
const delay = (step) => ({ animationDelay: `${step * 60}ms` });

const DashboardPage = () => {

    const { session } = useAuth();
    const data = homePlaceholder;
    const userId = session.user.id;
    // The name the person entered at sign-up: { userId, name }
    const [profileName, setProfileName] = useState({ userId: null, name: null });
    // Latest diary entry for the signed-in user: { userId, status, latest, firstDate }
    const [diary, setDiary] = useState({ userId: null });
    // Letters summary for the tile: counts and the next unlock time (never the words)
    const [letters, setLetters] = useState({ userId: null, status: 'loading' });
    // The name typed during onboarding, never the Google account name
    const greetingName = profileName.userId === userId ? profileName.name?.trim() : null;

    useEffect(() => {
        let cancelled = false;
        getDisplayName(userId)
            .then((name) => {
                if (!cancelled) setProfileName({ userId, name });
            })
            .catch((error) => console.error('Loading the profile name failed:', error.message));
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        getDiarySummary()
            .then((summary) => {
                if (!cancelled) setDiary({ userId, status: 'ready', ...summary });
            })
            .catch((error) => {
                console.error('Loading the latest diary entry failed:', error.message);
                if (!cancelled) setDiary({ userId, status: 'error' });
            });
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        const loadLetters = () => {
            getLetterSummary()
                .then((summary) => {
                    if (!cancelled) setLetters({ userId, status: 'ready', ...summary });
                })
                .catch((error) => {
                    console.error('Loading the letter summary failed:', error.message);
                    // A failed refresh shouldn't wipe out a summary that already loaded
                    if (!cancelled) setLetters((current) => current.userId === userId && current.status === 'ready' ? current : { userId, status: 'error' });
                });
        };
        loadLetters();
        // The tile turns "Ready to open" on its own when a letter unlocks
        const timer = setInterval(loadLetters, 30000);
        return () => { cancelled = true; clearInterval(timer); };
    }, [userId]);

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="flex flex-col gap-1 animate-fade-in">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-body">
                        <span className="w-2 h-2 rounded-full bg-leaf" aria-hidden="true" />
                        {formatTodayLong()}
                    </p>
                    <h1 className="font-headline text-[30px] md:text-[36px] leading-tight font-semibold tracking-[-0.025em] text-heading">
                        {greetingFor()}{greetingName ? `, ${greetingName}` : ''}.
                    </h1>
                    <p className="text-[16px] text-body">Take a moment. You don’t have to carry yesterday into right now.</p>
                </header>

                <TodayCard message={data.today.message} pastYou={data.today.pastYou} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <DiaryTile {...diaryTileProps(userId, diary)} className="lg:col-span-7" style={delay(1)} />
                    <GoalsTile initialSuggestions={data.suggestedGoals} className="lg:col-span-5" style={delay(2)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ComfortKitTile note={data.comfortNote} style={delay(3)} />
                    <LetterTile summary={letters.userId === userId ? letters : { status: 'loading' }} style={delay(4)} />
                </div>

                <footer className="mt-4 pt-6 border-t border-hairline flex flex-col items-center gap-1.5 text-center text-[13px] text-body">
                    <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">shield</span>
                        Private by design. Equilibria is not therapy or medical care.
                    </p>
                    <p>Having a really hard time? In Canada, call or text <span className="font-semibold text-heading">988</span>, any time.</p>
                </footer>
            </main>
        </div>
    )
}

export default DashboardPage
