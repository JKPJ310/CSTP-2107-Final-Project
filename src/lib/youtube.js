const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];

// Returns the link as https if it's a YouTube link, otherwise null
export const normalizeYouTubeUrl = (input) => {
    const trimmed = input.trim();
    let url;
    try {
        // Links copied without "https://" (e.g. youtu.be/abc) still count
        url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    } catch {
        return null;
    }
    if (!['http:', 'https:'].includes(url.protocol) || !YOUTUBE_HOSTS.includes(url.hostname)) return null;
    url.protocol = 'https:';
    return url.toString();
}
