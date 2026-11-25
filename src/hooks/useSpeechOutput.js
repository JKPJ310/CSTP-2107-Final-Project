import { useCallback, useEffect, useRef, useState } from 'react'
import { openReplyAudio, wakeVoice } from '../lib/aiChat'

// Reads Equilibria's replies aloud. Saved replies use Gemini's warm voice (the ai-voice edge
// function), played with the browser's normal audio player; if that fails, or for text that
// isn't a saved reply, the browser's built-in voice reads it.

const synth = typeof window === 'undefined' ? null : (window.speechSynthesis ?? null);

export const speechOutputSupported = Boolean(synth || typeof Audio !== 'undefined');

// Raw 16-bit mono audio → a WAV file the audio player can play
const toWav = (pieces, sampleRate) => {
    const length = pieces.reduce((sum, piece) => sum + piece.length, 0);
    const header = new DataView(new ArrayBuffer(44));
    const text = (offset, value) => [...value].forEach((char, i) => header.setUint8(offset + i, char.charCodeAt(0)));
    text(0, 'RIFF');
    header.setUint32(4, 36 + length, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    header.setUint32(16, 16, true);
    header.setUint16(20, 1, true);              // PCM
    header.setUint16(22, 1, true);              // mono
    header.setUint32(24, sampleRate, true);
    header.setUint32(28, sampleRate * 2, true); // bytes per second
    header.setUint16(32, 2, true);
    header.setUint16(34, 16, true);
    text(36, 'data');
    header.setUint32(40, length, true);
    return new Blob([header, ...pieces], { type: 'audio/wav' });
}

// A moment of silence, played when the person taps the mic so the browser lets this page play sound
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

// Replies are plain text, but drop stray markdown symbols so they aren't read out
const forSpeaking = (text) => text.replace(/[*_#`>~]+/g, '').replace(/\s+/g, ' ').trim();

// Chrome stops long utterances after about 15 seconds, so speak a sentence or two at a time
const chunks = (text) => (text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]).reduce((parts, sentence) => {
    const last = parts[parts.length - 1];
    if (last && (last + sentence).length < 200) parts[parts.length - 1] = last + sentence;
    else parts.push(sentence);
    return parts;
}, []);

// A clear voice in the person's language; the "natural" and Google voices sound least robotic
const pickVoice = () => {
    const language = (navigator.language || 'en-US').slice(0, 2);
    const voices = synth.getVoices().filter((voice) => voice.lang.startsWith(language));
    return voices.find((voice) => /natural/i.test(voice.name))
        ?? voices.find((voice) => /google/i.test(voice.name))
        ?? voices.find((voice) => voice.default)
        ?? voices[0]
        ?? null;
}

const WATCH_MS = 250;
const START_GRACE_MS = 3000;    // browser voice: if speech hasn't started by then, it never will
const FIRST_SOUND_MS = 8000;    // Gemini voice: no audio starting by then, so use the browser voice instead
const STALL_MS = 6000;          // Gemini voice: arriving, but stopped for this long, so give up
const END_GRACE_MS = 2000;      // Gemini voice: if "finished" never fires, end this long after it should have
const BUSY_PAUSE_MS = 10 * 60 * 1000; // after Google says the free allowance is used up, don't ask again for a while

// Until when the Gemini voice is resting (shared by every chat on the page)
let geminiBusyUntil = 0;

// Waits for promise, but gives up after ms
const within = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`no answer within ${ms / 1000} seconds`)), ms))
]);

// speak(id, text, { messageId, onStart, onDone }) reads a message aloud, stopping anything already
// playing; speakingId says which. With messageId (the saved reply's id) it uses the Gemini voice.
// onStart runs when the sound actually begins; onDone only if it reaches the end, not when stopped.
//
// Chrome sometimes never fires the "finished" event (and can drop utterances it has
// garbage-collected), which left voice mode stuck on "Speaking…". So each reading keeps
// hold of its utterances, and a watchdog checks whether the browser is still talking.
export const useSpeechOutput = () => {

    const [speakingId, setSpeakingId] = useState(null);
    // The reading in progress: { id, onStart, onDone, started, finished, utterances, abort,
    // startedAt, heard, watchdog, endTimer }
    const currentRef = useRef(null);
    // Gemini audio already heard, by message id, so "Play again" doesn't ask again: id → WAV link
    const savedRef = useRef(new Map());
    // One audio player for the page, switched on by unlock()
    const playerRef = useRef(null);
    const player = () => (playerRef.current ??= new Audio());

    // Ends a reading once, however we find out it's over
    const endReading = useCallback((reading, reachedEnd) => {
        if (reading.finished) return;
        reading.finished = true;
        clearInterval(reading.watchdog);
        clearTimeout(reading.endTimer);
        reading.abort?.abort();
        if (reading.player) {
            reading.player.onended = reading.player.onerror = reading.player.onplaying = reading.player.onloadedmetadata = null;
            reading.player.pause();
        }
        if (currentRef.current === reading) currentRef.current = null;
        setSpeakingId((current) => (current === reading.id ? null : current));
        if (reachedEnd) reading.onDone?.();
    }, []);

    const markStarted = (reading) => {
        if (reading.started) return;
        reading.started = true;
        reading.onStart?.();
    }

    const stop = useCallback(() => {
        if (currentRef.current) endReading(currentRef.current, false);
        synth?.cancel();
        setSpeakingId(null);
    }, [endReading]);

    // The browser's own voice, for a reading that has already begun
    const speakInBrowser = useCallback((reading, text) => {
        const parts = synth ? chunks(forSpeaking(text)) : [];
        // Nothing to say (or no voice at all): still report it done, after the caller has seen the reply
        if (parts.length === 0) {
            markStarted(reading);
            return setTimeout(() => endReading(reading, true), 0);
        }

        reading.startedAt = Date.now();
        const voice = pickVoice();
        parts.forEach((part, i) => {
            const utterance = new SpeechSynthesisUtterance(part);
            if (voice) utterance.voice = voice;
            utterance.lang = voice?.lang ?? navigator.language;
            utterance.rate = 0.95; // a little slower than default: calmer
            utterance.onstart = () => {
                reading.heard = true;
                markStarted(reading);
            };
            if (i === parts.length - 1) {
                utterance.onend = () => endReading(reading, true);
                // Stopped on purpose: not the end. Any other failure: carry on as if it finished.
                utterance.onerror = (event) => endReading(reading, event.error !== 'interrupted' && event.error !== 'canceled');
            }
            reading.utterances.push(utterance); // keeps Chrome from throwing them away mid-speech
            synth.speak(utterance);
        });

        reading.watchdog = setInterval(() => {
            if (synth.speaking || synth.pending) {
                reading.heard = true;
                markStarted(reading);
                return;
            }
            // Quiet now: it finished without telling us, or it never started
            if (reading.heard || Date.now() - reading.startedAt > START_GRACE_MS) {
                markStarted(reading);
                endReading(reading, true);
            }
        }, WATCH_MS);
    }, [endReading]);

    // Gemini's voice: fetched (it arrives within about a second), then played. Any problem before
    // the sound starts hands over to the browser's voice.
    const playReplyAudio = useCallback(async (reading, text, messageId) => {
        const fallBack = (error) => {
            if (reading.finished) return;
            if (reading.started) return endReading(reading, true);
            if (/voice_busy/.test(error?.message)) geminiBusyUntil = Date.now() + BUSY_PAUSE_MS;
            console.warn('Using the browser voice instead:', error?.message ?? error);
            reading.abort?.abort();
            speakInBrowser(reading, text);
        }

        try {
            let url = savedRef.current.get(messageId);
            if (!url) {
                reading.abort = new AbortController();
                // The wait is limited until the audio starts arriving; after that a long reply
                // gets the time it needs, as long as it keeps coming
                const { sampleRate, reader } = await within(openReplyAudio(messageId, reading.abort.signal), FIRST_SOUND_MS);
                const pieces = [];
                for (;;) {
                    const { done, value } = await within(reader.read(), STALL_MS);
                    if (reading.finished) return;
                    if (done) break;
                    pieces.push(value);
                }
                if (pieces.length === 0) throw new Error('no audio came back');
                url = URL.createObjectURL(toWav(pieces, sampleRate));
                savedRef.current.set(messageId, url);
            }
            if (reading.finished) return;

            const audio = player();
            reading.player = audio;
            audio.onplaying = () => {
                console.info('Equilibria voice: playing Gemini’s warm voice');
                markStarted(reading);
            }
            audio.onended = () => endReading(reading, true);
            audio.onerror = () => fallBack(new Error('the audio wouldn’t play'));
            // In case "finished" never fires, end a little after the audio's length
            audio.onloadedmetadata = () => {
                if (Number.isFinite(audio.duration)) reading.endTimer = setTimeout(() => endReading(reading, true), audio.duration * 1000 + END_GRACE_MS);
            }
            audio.src = url;
            await audio.play();
        } catch (error) {
            if (error.name === 'AbortError' && reading.finished) return;
            fallBack(error);
        }
    }, [endReading, speakInBrowser]);

    const speak = useCallback((id, text, { messageId, onStart, onDone } = {}) => {
        if (currentRef.current) endReading(currentRef.current, false);
        synth?.cancel();
        const reading = {
            id, onStart, onDone, started: false, finished: false, utterances: [], player: null,
            abort: null, startedAt: Date.now(), heard: false, watchdog: null, endTimer: null
        };
        currentRef.current = reading;
        setSpeakingId(id);
        // The Gemini voice for a saved reply: heard before (it plays from memory), or Google isn't resting
        if (messageId && (savedRef.current.has(messageId) || Date.now() > geminiBusyUntil)) playReplyAudio(reading, text, messageId);
        else speakInBrowser(reading, text);
    }, [endReading, playReplyAudio, speakInBrowser]);

    // Browsers only let a page start sound right after a tap or click. Voice mode is spoken, not
    // tapped, so the sound is switched on when the person taps the mic, and stays on after that.
    // Also wakes the voice server, which sleeps when it hasn't been used for a while
    const unlock = useCallback(() => {
        const audio = player();
        audio.src = SILENCE;
        audio.play().catch(() => {});
        wakeVoice();
    }, []);

    // Leaving the page stops the voice and closes the audio output
    useEffect(() => () => {
        if (currentRef.current) endReading(currentRef.current, false);
        synth?.cancel();
        playerRef.current?.pause();
        savedRef.current.forEach((url) => URL.revokeObjectURL(url));
        savedRef.current.clear();
    }, [endReading]);

    return { speakingId, speak, stop, unlock };
}
