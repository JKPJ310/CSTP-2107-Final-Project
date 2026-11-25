import React, { useState } from 'react'
import { MOOD_TAGS, TOPIC_TAGS } from '../../data/diaryTags'
import { mentionsCrisis } from '../../lib/safety'
import SupportCard from './SupportCard'

const MAX_LENGTH = 20000;

const chipClass = 'px-3.5 py-1.5 rounded-full border border-hairline bg-card text-[14px] text-heading cursor-pointer select-none transition-colors hover:border-leaf has-checked:bg-forest has-checked:border-forest has-checked:text-on-primary has-focus-visible:ring-3 has-focus-visible:ring-leaf/30';

const TagPicker = ({ legend, options, selected, onToggle }) => (
    <fieldset>
        <legend className="text-[14px] font-medium text-heading mb-2">{legend}</legend>
        <div className="flex flex-wrap gap-2">
            {options.map((tag) => (
                <label key={tag} className={chipClass}>
                    <input type="checkbox" checked={selected.includes(tag)} onChange={() => onToggle(tag)} className="sr-only" />
                    {tag}
                </label>
            ))}
        </div>
    </fieldset>
)

// Write or edit an entry. onSubmit receives { body, tags, isPrivate }.
const DiaryEditor = ({ initial, submitLabel, saving, error, onSubmit, onCancel }) => {

    const [body, setBody] = useState(initial?.body ?? '');
    const [tags, setTags] = useState(initial?.tags ?? []);
    const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false);
    const [emptyError, setEmptyError] = useState(false);

    const handleToggleTag = (tag) => {
        setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!body.trim()) {
            setEmptyError(true);
            document.getElementById('entry-body')?.focus();
            return;
        }
        onSubmit({ body, tags, isPrivate });
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <div className="bg-card border border-hairline rounded-[20px] p-5 md:p-6 flex flex-col gap-6">
                <TagPicker legend="How does it feel?" options={MOOD_TAGS} selected={tags} onToggle={handleToggleTag} />
                <TagPicker legend="What’s it about?" options={TOPIC_TAGS} selected={tags} onToggle={handleToggleTag} />

                <div>
                    <label htmlFor="entry-body" className="block text-[14px] font-medium text-heading mb-2">Write it down</label>
                    <textarea
                        id="entry-body"
                        value={body}
                        onChange={(e) => {
                            setBody(e.target.value);
                            setEmptyError(false);
                        }}
                        maxLength={MAX_LENGTH}
                        rows={10}
                        placeholder="It doesn’t have to be good. Just honest."
                        aria-invalid={emptyError}
                        aria-describedby={emptyError ? 'entry-body-error' : undefined}
                        className="w-full p-4 rounded-xl bg-canvas border border-hairline font-serif text-[17px] leading-relaxed text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15 resize-y"
                    />
                    {emptyError && <p id="entry-body-error" className="mt-1.5 text-[13px] font-medium text-heading">Write a few words first.</p>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="peer sr-only" />
                    <span className="mt-0.5 w-10 h-6 shrink-0 rounded-full bg-hairline relative transition-colors peer-checked:bg-leaf peer-focus-visible:ring-3 peer-focus-visible:ring-leaf/30 after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" aria-hidden="true" />
                    <span className="flex flex-col">
                        <span className="text-[15px] font-medium text-heading">Keep this entry private</span>
                        <span className="text-[13px] text-body">Private entries are never shared with the AI.</span>
                    </span>
                </label>
            </div>

            {mentionsCrisis(body) && <SupportCard />}

            {error && (
                <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-sun/15 text-[14px] text-heading">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={saving} className="h-12 px-6 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-60 disabled:cursor-wait">
                    {saving ? 'Saving…' : submitLabel}
                </button>
                <button type="button" onClick={onCancel} disabled={saving} className="h-12 px-4 text-[15px] font-medium text-body hover:text-heading">
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default DiaryEditor
