// A simple phrase check, used in the browser (diary) and on the server (ai-chat, via npm run ai:sync).
// It only decides whether to show support resources. It never blocks saving or hides anything.
export const CRISIS_PHRASES = [
    'kill myself', 'killing myself', 'suicide', 'suicidal', 'end my life', 'ending my life',
    'want to die', 'wanna die', 'wish i was dead', 'wish i were dead', 'better off dead',
    'no reason to live', 'end it all', 'self harm', 'self-harm', 'hurt myself', 'hurting myself',
    'cut myself', 'cutting myself', 'overdose'
];

export const mentionsCrisis = (text) => {
    const lower = text.toLowerCase();
    return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}
