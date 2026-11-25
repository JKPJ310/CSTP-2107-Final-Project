import { useCallback, useEffect, useState } from 'react'
import { addPhoto, listComfortItems, removeComfortItem, saveSong } from '../lib/comfortStore'

// The signed-in user's comfort kit, shared by the Comfort kit page and the homepage tile.
// Actions throw on failure so the caller can show a message.
export const useComfortKit = (userId) => {

    const [state, setState] = useState({ userId: null, status: 'loading', items: [] });
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        listComfortItems()
            .then((items) => {
                if (!cancelled) setState({ userId, status: 'ready', items });
            })
            .catch((error) => {
                console.error('Loading the comfort kit failed:', error.message);
                if (!cancelled) setState({ userId, status: 'error', items: [] });
            });
        return () => { cancelled = true; };
    }, [userId, reloadCount]);

    const song = state.items.find((item) => item.kind === 'song') ?? null;
    const photos = state.items.filter((item) => item.kind === 'photo');

    const handleSaveSong = async (values) => {
        const saved = await saveSong(song?.id, values);
        setState((prev) => ({ ...prev, items: [...prev.items.filter((item) => item.kind !== 'song'), saved] }));
    }

    const handleAddPhoto = async (file, caption) => {
        const photo = await addPhoto(userId, file, caption);
        setState((prev) => ({ ...prev, items: [...prev.items, photo] }));
    }

    const handleRemove = async (item) => {
        await removeComfortItem(item);
        setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== item.id) }));
    }

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, status: 'loading' }));
        setReloadCount((n) => n + 1);
    }, []);

    return {
        status: state.userId === userId ? state.status : 'loading',
        song, photos,
        saveSong: handleSaveSong,
        addPhoto: handleAddPhoto,
        remove: handleRemove,
        reload
    };
}
