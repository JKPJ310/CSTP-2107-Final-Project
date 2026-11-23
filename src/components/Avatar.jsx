import React from 'react'

// A person's picture: their photo, else their emoji, else a plain person icon.
// sizeClass sets the circle's size; emoji and icon scale with textClass.
const Avatar = ({ photoUrl, emoji, sizeClass = 'w-9 h-9', textClass = 'text-[19px]', alt = '' }) => {
    if (photoUrl) return <img src={photoUrl} alt={alt} className={`${sizeClass} rounded-full object-cover`} />;
    return (
        <span className={`${sizeClass} rounded-full bg-forest text-on-primary flex items-center justify-center`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
            {emoji
                ? <span className={`${textClass} leading-none`}>{emoji}</span>
                : <span className={`material-symbols-outlined ${textClass}`}>person</span>}
        </span>
    )
}

export default Avatar
