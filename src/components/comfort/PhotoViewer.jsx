import React, { useEffect, useRef } from 'react'

// Shows one photo large, in a dialog. Esc, the close button or clicking outside closes it.
const PhotoViewer = ({ photo, onClose }) => {

    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (photo && !dialog.open) dialog.showModal();
        if (!photo && dialog.open) dialog.close();
    }, [photo]);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === dialogRef.current) dialogRef.current.close();
            }}
            aria-label={photo?.title ?? 'Comfort photo'}
            className="m-auto p-0 max-w-[min(92vw,900px)] rounded-[20px] bg-card backdrop:bg-scrim/60"
        >
            {photo && (
                <figure className="relative">
                    <img src={photo.photoUrl} alt={photo.title ?? 'A photo from your comfort kit'} className="block max-h-[80vh] w-auto max-w-full object-contain" />
                    {photo.title && <figcaption className="px-5 py-3 font-serif italic text-[16px] text-heading">{photo.title}</figcaption>}
                    <button
                        type="button"
                        onClick={() => dialogRef.current.close()}
                        aria-label="Close photo"
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/90 text-heading flex items-center justify-center hover:bg-card"
                    >
                        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
                    </button>
                </figure>
            )}
        </dialog>
    )
}

export default PhotoViewer
