// Equilibria's memory agent, shared by ai-memory (diary notes) and ai-chat (chat notes).
// It turns a diary entry or a stretch of chat into one short note, never keeping the words themselves.
import { CRISIS_PHRASES, NOTE_PROMPT } from './generated.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const NOTE_TIMEOUT_MS = 20_000;
export const MAX_NOTE_INPUT = 8000;  // characters of diary or chat the agent reads at once

export type Note = {
    mood: string | null;
    energy: number | null;
    stressors: string[];
    positives: string[];
    summary: string;
};

export const mentionsCrisis = (text: string) => {
    const lower = text.toLowerCase();
    return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
};

const cleanText = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const cleanList = (value: unknown) =>
    Array.isArray(value)
        ? value.map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 3)
        : [];

// The AI's answer is only trusted after it has been checked and trimmed to fit the memories table
const toNote = (raw: Record<string, unknown>): Note | null => {
    const summary = cleanText(raw.summary, 300);
    if (!summary) return null;
    const energy = Number(raw.energy);
    return {
        mood: cleanText(raw.mood, 30).toLowerCase() || null,
        energy: Number.isInteger(energy) && energy >= 1 && energy <= 5 ? energy : null,
        stressors: cleanList(raw.stressors),
        positives: cleanList(raw.positives),
        summary
    };
};

// Returns the note, or null if the AI couldn't write one. Logs never include the text.
export const writeNote = async (groqKey: string, text: string): Promise<Note | null> => {
    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: NOTE_PROMPT },
                    { role: 'user', content: text.slice(-MAX_NOTE_INPUT) }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_completion_tokens: 1024,
                reasoning_effort: 'low'
            }),
            signal: AbortSignal.timeout(NOTE_TIMEOUT_MS)
        });
        if (!response.ok) throw new Error(`Groq answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
        const data = await response.json();
        return toNote(JSON.parse(data.choices?.[0]?.message?.content ?? '{}'));
    } catch (error) {
        console.error('Writing a memory note failed:', error instanceof Error ? error.message : String(error));
        return null;
    }
};
