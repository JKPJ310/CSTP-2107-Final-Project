import React, { useRef, useState } from 'react'

export const AVATAR_EMOJIS = ['🌿', '🌸', '🌻', '🌙', '☀️', '🌊', '🍃', '🌈', '🦋', '🐢', '🐱', '🐶', '🦊', '🐼', '🍵', '⭐'];

const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AvatarPicker = ({ answers, onChange }) => {

    const [photoError, setPhotoError] = useState(null);
    const fileInputRef = useRef(null);
    const { avatarEmoji, avatarPhoto } = answers;

    const handlePhotoPick = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (!PHOTO_TYPES.includes(file.type)) {
            setPhotoError('Please choose a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
            setPhotoError(`Please choose an image under ${MAX_PHOTO_MB} MB.`);
            return;
        }
        setPhotoError(null);
        onChange('avatarPhoto', { file, url: URL.createObjectURL(file) });
    }

    return (
        <div className="flex flex-col items-center">
            {/* Preview */}
            <div className="w-28 h-28 rounded-full bg-secondary-container border border-outline-variant flex items-center justify-center overflow-hidden" aria-hidden="true">
                {avatarPhoto ? (
                    <img src={avatarPhoto.url} alt="" className="w-full h-full object-cover" />
                ) : avatarEmoji ? (
                    <span className="text-[56px] leading-none">{avatarEmoji}</span>
                ) : (
                    <span className="material-symbols-outlined text-[44px] text-on-surface-variant/50">person</span>
                )}
            </div>

            <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="mt-5 h-10 px-4 rounded-full bg-surface-container-lowest border border-outline-variant text-[14px] font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                {avatarPhoto ? 'Change photo' : 'Upload a photo'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept={PHOTO_TYPES.join(',')}
                onChange={handlePhotoPick}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
            />
            {photoError && <p role="alert" className="mt-2 text-[12px] font-medium text-red-600">{photoError}</p>}

            <fieldset className="w-full mt-6">
                <legend className="block w-full text-center text-[13px] text-on-surface-variant mb-3">or pick an emoji</legend>
                <div className="grid grid-cols-8 gap-2">
                    {AVATAR_EMOJIS.map((emoji) => (
                        <label
                            key={emoji}
                            className="aspect-square rounded-xl flex items-center justify-center text-[22px] cursor-pointer border border-transparent hover:bg-surface-container-low has-checked:bg-secondary-container has-checked:border-primary has-focus-visible:ring-3 has-focus-visible:ring-primary/30 transition-colors"
                        >
                            <input
                                type="radio"
                                name="avatarEmoji"
                                value={emoji}
                                checked={!avatarPhoto && avatarEmoji === emoji}
                                onChange={() => onChange('avatarEmoji', emoji)}
                                className="sr-only"
                            />
                            {emoji}
                        </label>
                    ))}
                </div>
            </fieldset>
        </div>
    )
}

export default AvatarPicker
