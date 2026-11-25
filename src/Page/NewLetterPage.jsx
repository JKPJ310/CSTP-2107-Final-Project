import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth'
import { formatDateTime, timeUntil } from '../lib/dates'
import { createLetter } from '../lib/lettersStore'
import BackHome from '../components/BackHome'

const MAX_LENGTH = 20000;

const chipClass = (active) =>
    `px-4 py-2 rounded-full border text-[14px] font-medium transition-colors ${active
        ? 'bg-forest border-forest text-on-primary'
        : 'bg-card border-hairline text-heading hover:border-leaf'}`;

// <input type="datetime-local"> speaks local time without a timezone: "2026-12-08T21:00"
const toLocalInput = (date) => {
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

const PRESETS = [
    { id: 'week', label: 'In 1 week', days: 7 },
    { id: 'month', label: 'In 1 month', days: 30 },
    { id: 'quarter', label: 'In 3 months', days: 90 }
];

const NewLetter = () => {

    const navigate = useNavigate();
    const [body, setBody] = useState('');
    const [preset, setPreset] = useState('week');
    const [unlock, setUnlock] = useState(() => toLocalInput(addDays(new Date(), 7)));
    const [emptyError, setEmptyError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const unlockDate = unlock ? new Date(unlock) : null;
    const validUnlock = unlockDate && !Number.isNaN(unlockDate.getTime());

    const choosePreset = (choice) => {
        setPreset(choice.id);
        setUnlock(toLocalInput(addDays(new Date(), choice.days)));
        setError(null);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!body.trim()) {
            setEmptyError(true);
            return;
        }
        if (!validUnlock || unlockDate.getTime() <= Date.now()) {
            setError('Choose a date and time in the future.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const letter = await createLetter({ body, opensAt: unlockDate });
            navigate(`/letters/${letter.id}`, { replace: true, state: { justSealed: true } });
        } catch (err) {
            console.error('Sealing the letter failed:', err.message);
            if (err.code === 'PGRST202' || err.code === '42883') {
                setError('Letters aren’t set up yet. Run supabase/migrations/008_letters.sql in Supabase, then try again.');
            } else {
                setError('We couldn’t seal your letter. Your words are still here. Check your connection and try again.');
            }
            setSaving(false);
        }
    }

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <Link to="/letters" className="inline-flex items-center gap-1 text-[14px] font-medium text-forest hover:underline">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
                    All letters
                </Link>

                <header className="animate-fade-in">
                    <p className="text-[13px] font-medium text-body">A note for later</p>
                    <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">Write to future you</h1>
                    <p className="mt-1 text-[15px] text-body">Say what you want them to remember. You can’t read or edit it until the day it opens.</p>
                </header>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    <div className="bg-card border border-hairline rounded-[20px] p-5 md:p-6 flex flex-col gap-6">
                        <div>
                            <label htmlFor="letter-body" className="block text-[14px] font-medium text-heading mb-2">Your letter</label>
                            <textarea
                                id="letter-body"
                                value={body}
                                onChange={(event) => {
                                    setBody(event.target.value);
                                    setEmptyError(false);
                                }}
                                maxLength={MAX_LENGTH}
                                rows={10}
                                placeholder="Dear future me,…"
                                aria-invalid={emptyError}
                                aria-describedby={emptyError ? 'letter-body-error' : undefined}
                                className="w-full p-4 md:p-5 rounded-xl bg-canvas border border-hairline font-serif text-[17px] leading-relaxed text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15 resize-y"
                            />
                            <div className="mt-1.5 flex items-center justify-between gap-3">
                                {emptyError
                                    ? <p id="letter-body-error" className="text-[13px] font-medium text-heading">Write a few words first.</p>
                                    : <span />}
                                <span className="text-[12px] text-body">{body.length}/{MAX_LENGTH}</span>
                            </div>
                        </div>

                        <fieldset>
                            <legend className="text-[14px] font-medium text-heading mb-3">When should it open?</legend>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((choice) => (
                                    <button
                                        key={choice.id}
                                        type="button"
                                        onClick={() => choosePreset(choice)}
                                        aria-pressed={preset === choice.id}
                                        className={chipClass(preset === choice.id)}
                                    >
                                        {choice.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4">
                                <label htmlFor="letter-unlock" className="block text-[13px] text-body mb-1.5">Or pick an exact date and time</label>
                                <input
                                    id="letter-unlock"
                                    type="datetime-local"
                                    value={unlock}
                                    min={toLocalInput(new Date(Date.now() + 60000))}
                                    onChange={(event) => {
                                        setUnlock(event.target.value);
                                        setPreset('custom');
                                        setError(null);
                                    }}
                                    className="w-full sm:w-auto h-11 px-3 rounded-xl bg-canvas border border-hairline text-[15px] text-heading [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15"
                                />
                            </div>
                            {validUnlock && (
                                <p className="mt-3 text-[13px] text-body">
                                    Opens <span className="font-medium text-heading">{formatDateTime(unlockDate.toISOString())}</span> ({timeUntil(unlockDate.toISOString())}).
                                </p>
                            )}
                        </fieldset>
                    </div>

                    <p className="flex items-start gap-2 p-3 rounded-xl bg-mint text-[13px] text-heading">
                        <span className="material-symbols-outlined text-[18px] text-forest" aria-hidden="true">lock</span>
                        <span>Once sealed, the words stay locked until the date you chose — the app can’t read them early either.</span>
                    </p>

                    {error && (
                        <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-sun/15 text-[14px] text-heading">
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
                            {error}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-12 px-6 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {saving ? 'Sealing…' : 'Seal letter'}
                        </button>
                        <Link to="/letters" className="h-12 px-4 flex items-center text-[15px] font-medium text-body hover:text-heading">Cancel</Link>
                    </div>
                </form>
                <BackHome />
            </main>
        </div>
    )
}

const NewLetterPage = () => (
    <RequireAuth>
        <NewLetter />
    </RequireAuth>
)

export default NewLetterPage
