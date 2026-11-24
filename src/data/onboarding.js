// First-time onboarding: the 5 quick questions, and how the answers become the Day 1 diary page.
// Edit the wording here; the onboarding page reads everything from this file.

// Bump when the Terms of Use / Privacy Policy change; stored with each person's consent.
export const TERMS_VERSION = '2026-11-09';

// Labels match the diary's tags (src/data/diaryTags.js) so they carry over to the Day 1 page
export const MOOD_OPTIONS = ['Calm', 'Okay', 'Tired', 'Anxious', 'Overwhelmed', 'Sad'];
export const WEIGHING_OPTIONS = ['School', 'Work', 'Sleep', 'Money', 'Family', 'Friends', 'Health', 'Not sure'];
export const ENERGY_OPTIONS = [
    { value: 1, label: 'Running on empty' },
    { value: 2, label: 'Low' },
    { value: 3, label: 'Okay' },
    { value: 4, label: 'Good' },
    { value: 5, label: 'Full' }
];
export const HELPS_OPTIONS = ['Music', 'A walk', 'Talking to someone', 'Rest', 'Writing', 'Being outside', 'Not sure yet'];

const listOf = (items) => items.map((item) => item.toLowerCase()).join(', ');

// { mood, weighing[], energy, helps[], more } → { body, tags } for the Day 1 diary entry
export const buildDayOneEntry = ({ mood, weighing, energy, helps, more }) => {
    const energyLabel = ENERGY_OPTIONS.find((option) => option.value === energy).label;
    const knownWeighing = weighing.filter((item) => item !== 'Not sure');
    const knownHelps = helps.filter((item) => item !== 'Not sure yet');
    const lines = [
        `How I’m feeling: ${mood.toLowerCase()}.`,
        `Energy: ${energyLabel.toLowerCase()} (${energy} of 5).`,
        knownWeighing.length > 0 && `What’s weighing on me: ${listOf(knownWeighing)}.`,
        knownHelps.length > 0 && `What usually helps: ${listOf(knownHelps)}.`
    ].filter(Boolean);
    const body = more.trim() ? `${lines.join('\n')}\n\n${more.trim()}` : lines.join('\n');
    return { body, tags: [mood, ...knownWeighing], isPrivate: false };
}
