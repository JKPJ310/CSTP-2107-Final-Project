import React, { useEffect, useRef, useState } from 'react'
import SafetyReply from './SafetyReply'
import { useMicLevel } from '../../hooks/useMicLevel'
import { useSpeechInput } from '../../hooks/useSpeechInput'
import { speechOutputSupported } from '../../hooks/useSpeechOutput'

// After this much quiet, what the person said is sent
const SILENCE_MS = 3000;

const VOICE_ERRORS = {
    blocked: 'Equilibria can’t hear you because the microphone is blocked. Allow it in your browser’s site settings, then try again.',
    network: 'Speaking needs an internet connection. You can type instead.',
    failed: 'The microphone didn’t start. Try again, or type instead.'
};

const primaryClass = 'h-12 px-6 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-50';
const quietClass = 'h-12 px-4 text-[15px] font-medium text-body hover:text-heading';

// The soft green orb. Listening: it swells with the person's voice (--level, set by useMicLevel).
// Thinking: it breathes. Speaking: it sways and sends rings outward.
// The padding around it is room for the glow and rings to grow into, so they never cover the words.
const Orb = ({ phase, levelRef }) => (
    <div className="p-16 md:p-20 shrink-0" aria-hidden="true">
    <div ref={levelRef} className="relative w-40 h-40 md:w-52 md:h-52" style={{ '--level': 0 }}>
        <span
            className="absolute -inset-8 rounded-full bg-mint transition-transform duration-100"
            style={{ transform: 'scale(calc(1 + var(--level) * 0.3))' }}
        />
        {phase === 'speaking' && (
            <>
                <span className="absolute inset-0 rounded-full bg-leaf/30 motion-safe:animate-orb-ripple" />
                <span className="absolute inset-0 rounded-full bg-leaf/30 motion-safe:animate-orb-ripple [animation-delay:1.2s]" />
            </>
        )}
        <span
            className="absolute inset-0 rounded-full transition-transform duration-100"
            style={{ transform: 'scale(calc(1 + var(--level) * 0.15))' }}
        >
            <span className={`block w-full h-full rounded-full bg-linear-to-br from-leaf to-forest ${phase === 'thinking' ? 'motion-safe:animate-orb-think' : ''} ${phase === 'speaking' ? 'motion-safe:animate-orb-speak' : ''}`} />
        </span>
    </div>
    </div>
)

// Full-screen voice conversation over the chat: listen → (3 seconds of quiet) → send → think →
// speak the reply → listen again, until the person taps End. Every message also lands in the chat.
// onSend(text, { onSpeaking, onSpoken }) resolves to { reply, safety } or { error }; onSpeaking runs
// when the voice starts, onSpoken when the reply has been read aloud. The screen stays on
// "Thinking…" until the voice starts, so the words and the voice arrive together.
// A crisis reply stops the loop and shows the 988 buttons.
const VoiceMode = ({ onSend, onClose, stopSpeaking, errorText }) => {

    // 'listening' | 'thinking' | 'speaking' | 'crisis' | 'problem'
    const [phase, setPhase] = useState('listening');
    const [heard, setHeard] = useState('');
    const [reply, setReply] = useState('');
    const [problem, setProblem] = useState(null);
    const levelRef = useRef(null);
    const endRef = useRef(null);
    const closedRef = useRef(false);
    const keepGoingRef = useRef(true);

    const listener = useSpeechInput({
        silenceMs: SILENCE_MS,
        onFinish: async (text) => {
            setHeard(text);
            setPhase('thinking');
            keepGoingRef.current = true;
            const result = await onSend(text, {
                onSpeaking: () => {
                    if (!closedRef.current) setPhase((current) => (current === 'thinking' ? 'speaking' : current));
                },
                onSpoken: () => {
                    if (!closedRef.current && keepGoingRef.current) listenAgain();
                }
            });
            if (closedRef.current) return;
            if (result.error) {
                setProblem(errorText(result.error));
                return setPhase('problem');
            }
            setReply(result.reply);
            if (result.safety) {
                keepGoingRef.current = false;
                setPhase('crisis');
            } else if (!speechOutputSupported) {
                listenAgain();
            }
        },
        onError: (code) => {
            setProblem(VOICE_ERRORS[code] ?? VOICE_ERRORS.failed);
            setPhase('problem');
        }
    });

    useMicLevel(phase === 'listening' && listener.listening, levelRef);

    function listenAgain() {
        setProblem(null);
        setHeard('');
        setPhase('listening');
        listener.start();
    }

    const close = () => {
        closedRef.current = true;
        listener.cancel();
        stopSpeaking();
        onClose();
    }

    // Skip the rest of a spoken reply and go back to listening
    const skip = () => {
        keepGoingRef.current = false;
        stopSpeaking();
        listenAgain();
    }

    // Start listening as soon as the screen opens
    useEffect(() => {
        listener.start();
        endRef.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Escape ends the conversation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    });

    const words = {
        listening: {
            title: 'Listening…',
            text: listener.transcript || 'Take your time. Say whatever’s on your mind.'
        },
        thinking: { title: 'Thinking…', text: heard },
        speaking: { title: 'Speaking…', text: reply },
        crisis: { title: 'You don’t have to go through this alone', text: '' },
        problem: { title: 'Something got in the way', text: problem }
    }[phase];

    return (
        <div role="dialog" aria-modal="true" aria-label="Voice conversation with Equilibria" className="fixed inset-0 z-50 bg-canvas text-heading font-body flex flex-col animate-fade-in">
            <div className="flex justify-end p-4">
                <button ref={endRef} type="button" onClick={close} aria-label="End voice conversation" className="w-11 h-11 rounded-full flex items-center justify-center text-body hover:text-heading hover:bg-card">
                    <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
                </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 pb-6 text-center overflow-hidden">
                {phase !== 'crisis' && phase !== 'problem' && <Orb phase={phase} levelRef={levelRef} />}

                <div aria-live="polite" className="relative z-10 max-w-md flex flex-col items-center gap-3">
                    <h2 className="font-headline text-[24px] md:text-[28px] font-semibold tracking-[-0.02em]">{words.title}</h2>
                    {words.text && (
                        <p className={`max-h-[30svh] overflow-y-auto whitespace-pre-wrap ${phase === 'problem'
                            ? 'text-[15px] text-heading'
                            : 'font-serif text-[17px] leading-relaxed text-body'}`}>
                            {words.text}
                        </p>
                    )}
                    {phase === 'crisis' && <div className="text-left flex justify-center"><SafetyReply content={reply} /></div>}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
                {phase === 'listening' && (
                    <button type="button" onClick={listener.stop} disabled={!listener.transcript} className={primaryClass}>Send now</button>
                )}
                {phase === 'speaking' && (
                    <button type="button" onClick={skip} className={quietClass}>Skip to my turn</button>
                )}
                {phase === 'problem' && (
                    <button type="button" onClick={listenAgain} className={primaryClass}>Try again</button>
                )}
                {phase === 'crisis'
                    ? <button type="button" onClick={close} className={primaryClass}>Back to chat</button>
                    : <button type="button" onClick={close} className={quietClass}>End</button>}
            </div>
            <p className="pb-4 px-6 text-center text-[12px] text-body">
                Equilibria is an AI, not a therapist. Your browser turns your voice into text (Chrome uses Google to do this), and Google’s Gemini reads Equilibria’s replies aloud.
            </p>
        </div>
    )
}

export default VoiceMode
