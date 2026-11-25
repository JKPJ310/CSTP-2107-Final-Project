import React, { useEffect, useRef, useState } from 'react'
import Avatar from '../Avatar'
import FormNotice from '../auth/FormNotice'
import { useAuth } from '../../context/AuthContext'
import { isUsernameAvailable, usernameProblem } from '../../lib/accounts'
import { MAX_PICTURE_MB, PICTURE_TYPES, squarePicture } from '../../lib/images'
import { MAX_NAME, MAX_PRONOUNS, PRONOUN_OPTIONS, removeProfilePhoto, updateProfile, uploadProfilePhoto } from '../../lib/profiles'
import { fieldClass, helpClass, labelClass, outlineClass, primaryClass, quietClass, SettingsCard } from './settingsParts'

// Calm, nature-ish emojis for people who'd rather not use a photo
const EMOJIS = ['🌿', '🌱', '🌻', '🌸', '🍃', '🌊', '🌙', '☀️', '⭐', '🦋', '🐢', '🍵'];

// The picture is one choice: { type: 'photo', url, blob? } (blob: newly chosen, not uploaded yet),
// { type: 'emoji', emoji } or { type: 'none' }
const pictureFrom = (profile) => {
    if (profile.photoPath) return { type: 'photo', url: profile.photoUrl };
    if (profile.emoji) return { type: 'emoji', emoji: profile.emoji };
    return { type: 'none' };
}

const samePicture = (a, b) => a.type === b.type && !a.blob && !b.blob && a.emoji === b.emoji;

const formFrom = (profile) => ({
    picture: pictureFrom(profile),
    name: profile.name ?? '',
    username: profile.username ?? '',
    pronouns: profile.pronouns,
    pronounsCustom: profile.pronounsCustom
});

const sameValues = (a, b) => samePicture(a.picture, b.picture) && a.name === b.name && a.username === b.username
    && a.pronouns === b.pronouns && a.pronounsCustom === b.pronounsCustom;

// Picture, name, username and pronouns
const ProfileSection = () => {

    const { session, profile, profileChanged } = useAuth();
    const [form, setForm] = useState(() => formFrom(profile));
    const [saving, setSaving] = useState(false);
    const [problem, setProblem] = useState(null);
    const [saved, setSaved] = useState(false);
    const fileRef = useRef(null);
    const previewRef = useRef(null);

    // A chosen photo is shown from a temporary in-browser link until it's saved; free it afterwards
    const setPreview = (url) => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = url;
    }
    useEffect(() => () => setPreview(null), []);

    const changed = !sameValues(form, formFrom(profile));

    const setField = (field) => (value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
        setProblem(null);
    }

    const choosePicture = (picture) => {
        if (!picture.blob) setPreview(null);
        setField('picture')(picture);
    }

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // so choosing the same file again still works
        if (!file) return;
        if (!PICTURE_TYPES.includes(file.type)) return setProblem('Choose a JPG, PNG or WebP picture.');
        if (file.size > MAX_PICTURE_MB * 1024 * 1024) return setProblem(`Choose a picture under ${MAX_PICTURE_MB} MB.`);
        try {
            const blob = await squarePicture(file);
            const url = URL.createObjectURL(blob);
            setPreview(url);
            setField('picture')({ type: 'photo', url, blob });
        } catch (error) {
            console.error('Preparing the picture failed:', error.message);
            setProblem('That picture couldn’t be opened. Try another one.');
        }
    }

    // Puts the form back to what's saved
    const discard = () => {
        setPreview(null);
        setForm(formFrom(profile));
        setProblem(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = form.name.trim();
        const username = form.username.trim();
        if (!name) return setProblem('Add the name you’d like Equilibria to call you.');
        if (form.pronouns === 'self_described' && !form.pronounsCustom.trim()) return setProblem('Type your pronouns, or pick another option.');
        if (username !== profile.username) {
            const fieldProblem = usernameProblem(username);
            if (fieldProblem) return setProblem(fieldProblem);
        }
        // Only a different username needs checking (just changing its capitals keeps it yours)
        const usernameChanged = username.toLowerCase() !== (profile.username ?? '').toLowerCase();

        setSaving(true);
        setProblem(null);
        try {
            if (usernameChanged && !(await isUsernameAvailable(username))) {
                setSaving(false);
                return setProblem('That username is taken. Try another one.');
            }
            // A new photo is uploaded first, then the profile points at it
            const { picture } = form;
            const newPhotoPath = picture.blob ? await uploadProfilePhoto(session.user.id, picture.blob) : null;
            let updated;
            try {
                updated = await updateProfile(session.user.id, {
                    name,
                    username,
                    pronouns: form.pronouns,
                    pronounsCustom: form.pronounsCustom,
                    emoji: picture.type === 'emoji' ? picture.emoji : '',
                    photoPath: picture.type === 'photo' ? newPhotoPath ?? profile.photoPath : null
                });
            } catch (error) {
                await removeProfilePhoto(newPhotoPath); // don't leave an unused file behind
                throw error;
            }
            // The old photo file isn't needed any more
            if (profile.photoPath && profile.photoPath !== updated.photoPath) removeProfilePhoto(profile.photoPath);
            setPreview(null);
            profileChanged(updated);
            setForm(formFrom(updated));
            setSaved(true);
        } catch (error) {
            console.error('Saving the profile failed:', error.message);
            setProblem(error.code === '23505' ? 'That username was just taken. Try another one.' : 'That didn’t save. Check your connection and try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <SettingsCard id="settings-profile" title="Profile" description="How Equilibria shows you and talks to you.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                <fieldset className="flex flex-col gap-4">
                    <legend className={labelClass}>Picture</legend>
                    <div className="flex flex-wrap items-center gap-4">
                        <Avatar
                            photoUrl={form.picture.type === 'photo' ? form.picture.url : null}
                            emoji={form.picture.type === 'emoji' ? form.picture.emoji : null}
                            sizeClass="w-20 h-20"
                            textClass="text-[36px]"
                            alt="Your picture"
                        />
                        <div className="flex flex-wrap gap-2">
                            <input ref={fileRef} id="settings-photo" type="file" accept={PICTURE_TYPES.join(',')} onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
                            <button type="button" onClick={() => fileRef.current?.click()} className={outlineClass}>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_a_photo</span>
                                    {form.picture.type === 'photo' ? 'Choose another photo' : 'Upload a photo'}
                                </span>
                            </button>
                            {form.picture.type !== 'none' && (
                                <button type="button" onClick={() => choosePicture({ type: 'none' })} className={quietClass}>Remove picture</button>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[13px] text-body mb-2">Or pick an emoji</p>
                        <div className="flex flex-wrap gap-2">
                            {EMOJIS.map((emoji) => {
                                const chosen = form.picture.type === 'emoji' && form.picture.emoji === emoji;
                                return (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => choosePicture({ type: 'emoji', emoji })}
                                        aria-pressed={chosen}
                                        aria-label={`Use ${emoji} as your picture`}
                                        className={`w-11 h-11 rounded-full flex items-center justify-center text-[20px] border transition-colors ${chosen ? 'border-leaf bg-mint' : 'border-hairline hover:border-leaf'}`}
                                    >
                                        {emoji}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <p className={helpClass}>Photos are private: only you can see them. They’re shrunk to a small square before uploading.</p>
                </fieldset>

                <div>
                    <label htmlFor="settings-name" className={labelClass}>Name</label>
                    <input id="settings-name" autoComplete="nickname" maxLength={MAX_NAME} value={form.name} onChange={(e) => setField('name')(e.target.value)} aria-describedby="settings-name-help" className={fieldClass} />
                    <p id="settings-name-help" className={helpClass}>What Equilibria calls you. It can be anything.</p>
                </div>

                <div>
                    <label htmlFor="settings-username" className={labelClass}>Username</label>
                    <input id="settings-username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} value={form.username} onChange={(e) => setField('username')(e.target.value)} aria-describedby="settings-username-help" className={fieldClass} />
                    <p id="settings-username-help" className={helpClass}>For logging in. 3 to 20 letters, numbers or underscores.</p>
                </div>

                <div>
                    <label htmlFor="settings-pronouns" className={labelClass}>Pronouns <span className="font-normal text-body">(optional)</span></label>
                    <select id="settings-pronouns" value={form.pronouns} onChange={(e) => setField('pronouns')(e.target.value)} aria-describedby="settings-pronouns-help" className={fieldClass}>
                        {PRONOUN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    {form.pronouns === 'self_described' && (
                        <>
                            <label htmlFor="settings-pronouns-custom" className="sr-only">Your pronouns</label>
                            <input id="settings-pronouns-custom" maxLength={MAX_PRONOUNS} placeholder="e.g. xe/xem" value={form.pronounsCustom} onChange={(e) => setField('pronounsCustom')(e.target.value)} className={`${fieldClass} mt-2`} />
                        </>
                    )}
                    <p id="settings-pronouns-help" className={helpClass}>Helps the AI talk about you the right way.</p>
                </div>

                {saved && <FormNotice tone="info" icon="check_circle">Saved.</FormNotice>}

                {/* Pinned to the bottom of the screen while there are unsaved changes, above the phone tabs */}
                {(changed || saving) && (
                    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 z-20 bg-card border-t border-hairline animate-fade-in">
                        <div className="max-w-2xl mx-auto px-4 md:px-8 py-3 flex flex-col gap-2">
                            {problem && <FormNotice>{problem}</FormNotice>}
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[14px] text-body">You have unsaved changes</p>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={discard} disabled={saving} className={quietClass}>Discard</button>
                                    <button type="submit" disabled={saving} className={primaryClass}>{saving ? 'Saving…' : 'Save changes'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {problem && !changed && <FormNotice>{problem}</FormNotice>}
            </form>
        </SettingsCard>
    )
}

export default ProfileSection
