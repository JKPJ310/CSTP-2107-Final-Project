import { useCallback, useEffect, useRef, useState } from 'react'

// Speech to text with the browser's built-in recognizer (Chrome, Edge and Safari; not Firefox).
// Chrome sends the audio to Google to turn it into text. No API key or library needed.

const Recognition = typeof window === 'undefined' ? null : (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null);

export const speechInputSupported = Boolean(Recognition);

const TICK_MS = 200;

const joinWords = (kept, current) => `${kept} ${current}`.replace(/\s+/g, ' ').trim();

// Browser error names → our codes: 'blocked', 'network' or 'failed'
const errorCode = (name) => {
    if (name === 'not-allowed' || name === 'service-not-allowed') return 'blocked';
    if (name === 'network') return 'network';
    return 'failed';
}

// start() listens; transcript fills in live. Once the person has said something and then
// stays quiet for silenceMs, onFinish(text) is called. stop() sends straight away;
// cancel() throws the words away. onError(code) when the microphone can't be used.
export const useSpeechInput = ({ onFinish, onError, silenceMs = 3000 }) => {

    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const activeRef = useRef(false);
    // Browsers end a recognizer after a pause, so one turn can span several:
    // keptRef holds the words from earlier ones, sessionRef the current one's
    const keptRef = useRef('');
    const sessionRef = useRef('');
    const lastHeardRef = useRef(0);
    const timerRef = useRef(null);
    // The latest callbacks, so a recognizer started earlier still calls the current ones
    const callbacksRef = useRef({ onFinish, onError });

    useEffect(() => {
        callbacksRef.current = { onFinish, onError };
    });

    const shutDown = useCallback(() => {
        activeRef.current = false;
        clearInterval(timerRef.current);
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        recognition?.abort();
        setListening(false);
        setTranscript('');
    }, []);

    const finish = useCallback(() => {
        const text = joinWords(keptRef.current, sessionRef.current);
        shutDown();
        if (text) callbacksRef.current.onFinish(text);
    }, [shutDown]);

    const startRecognizer = useCallback(() => {
        const recognition = new Recognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        sessionRef.current = '';

        recognition.onresult = (event) => {
            const heard = Array.from(event.results, (result) => result[0].transcript).join('');
            // The browser re-sends the same words about a second after a pause, when it "finalises"
            // them; that isn't new speech, so it mustn't restart the quiet countdown
            if (heard.replace(/\W/g, '').toLowerCase() !== sessionRef.current.replace(/\W/g, '').toLowerCase()) {
                lastHeardRef.current = Date.now();
            }
            sessionRef.current = heard;
            setTranscript(joinWords(keptRef.current, sessionRef.current));
        };
        recognition.onerror = (event) => {
            // Quiet moments and our own stopping aren't problems: the recognizer is restarted below
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            shutDown();
            callbacksRef.current.onError?.(errorCode(event.error));
        };
        recognition.onend = () => {
            if (!activeRef.current || recognitionRef.current !== recognition) return;
            // The browser stopped on its own after a pause: keep the words and listen again
            keptRef.current = joinWords(keptRef.current, sessionRef.current);
            sessionRef.current = '';
            try {
                recognition.start();
            } catch {
                shutDown();
                callbacksRef.current.onError?.('failed');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [shutDown]);

    const start = useCallback(() => {
        if (!Recognition || activeRef.current) return;
        activeRef.current = true;
        keptRef.current = '';
        lastHeardRef.current = Date.now();
        setTranscript('');
        setListening(true);
        try {
            startRecognizer();
        } catch {
            shutDown();
            callbacksRef.current.onError?.('failed');
            return;
        }

        // Counts the quiet since the last word; only once something has been said
        timerRef.current = setInterval(() => {
            if (!joinWords(keptRef.current, sessionRef.current)) return;
            if (Date.now() - lastHeardRef.current >= silenceMs) finish();
        }, TICK_MS);
    }, [startRecognizer, shutDown, finish, silenceMs]);

    // Leaving the page stops the microphone
    useEffect(() => shutDown, [shutDown]);

    return { listening, transcript, start, stop: finish, cancel: shutDown };
}
