// "2026-11-02" → "Nov 2" (read as a local date, so it never shifts a day)
export const formatMonthDay = (isoDate) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Today as "Sunday, Nov 8"
export const formatTodayLong = (date = new Date()) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export const greetingFor = (date = new Date()) => {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysBetween = (earlier, later) => Math.round((startOfDay(later) - startOfDay(earlier)) / 86400000);

// "9:45 AM"
export const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// "Sun, Dec 8 at 9:00 AM"
export const formatDateTime = (iso) =>
    `${new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${formatTime(iso)}`;

// "Sunday, November 8"
export const formatEntryDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// "Sunday, November 8 at 9:00 AM"
export const formatDateTimeLong = (iso) => `${formatEntryDate(iso)} at ${formatTime(iso)}`;

// "Today", "Yesterday", or "Fri, Nov 6", for grouping the diary list
export const dayLabel = (iso, now = new Date()) => {
    const diff = daysBetween(new Date(iso), now);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Day 1 is the day of the first diary entry
export const dayNumber = (firstIso, now = new Date()) => daysBetween(new Date(firstIso), now) + 1;

// "in 3 days" / "in 2 hours" / "in 5 minutes", for sealed letters
export const timeUntil = (iso, now = new Date()) => {
    const ms = new Date(iso) - now;
    if (ms <= 0) return 'now';
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.round(hours / 24);
    return `in ${days} day${days === 1 ? '' : 's'}`;
}
