import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DiaryEditor from '../components/diary/DiaryEditor'
import RequireAuth from '../components/RequireAuth'
import { formatEntryDate } from '../lib/dates'
import { createEntry } from '../lib/diaryStore'
import BackHome from '../components/BackHome'

const NewEntry = () => {

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        setSaving(true);
        setError(null);
        try {
            const entry = await createEntry(values);
            navigate(`/diary/${entry.id}`, { replace: true, state: { justSaved: true } });
        } catch (err) {
            console.error('Saving the entry failed:', err.message);
            setError('We couldn’t save your entry. Your words are still here. Check your connection and try again.');
            setSaving(false);
        }
    }

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <header className="animate-fade-in">
                    <p className="text-[13px] font-medium text-body">{formatEntryDate(new Date().toISOString())}</p>
                    <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">New entry</h1>
                </header>
                <DiaryEditor submitLabel="Save entry" saving={saving} error={error} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
                <BackHome />
            </main>
        </div>
    )
}

const NewEntryPage = () => (
    <RequireAuth>
        <NewEntry />
    </RequireAuth>
)

export default NewEntryPage
