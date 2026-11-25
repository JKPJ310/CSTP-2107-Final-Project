import { useEffect } from 'react'

// Makes an element swell with the person's voice: while active, reads how loud the microphone
// is (only the volume; nothing is recorded or sent) and sets --level (0 to 1) on the element.
// Skipped for people who turn off motion. If the microphone can't be opened, nothing moves.
export const useMicLevel = (active, elementRef) => {
    useEffect(() => {
        if (!active || !navigator.mediaDevices?.getUserMedia) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const element = elementRef.current;
        let stopped = false;
        let stream = null;
        let context = null;
        let frame = 0;

        navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
            if (stopped) {
                micStream.getTracks().forEach((track) => track.stop());
                return;
            }
            stream = micStream;
            context = new AudioContext();
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            context.createMediaStreamSource(stream).connect(analyser);
            const samples = new Uint8Array(analyser.fftSize);
            let smooth = 0;

            const tick = () => {
                analyser.getByteTimeDomainData(samples);
                // Loudness (RMS) of this moment, eased so the orb glides instead of jittering
                let sum = 0;
                for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
                const loudness = Math.min(1, Math.sqrt(sum / samples.length) * 6);
                smooth += (loudness - smooth) * 0.2;
                element?.style.setProperty('--level', smooth.toFixed(3));
                frame = requestAnimationFrame(tick);
            };
            tick();
        }).catch(() => {
            // Microphone blocked: the speech recognizer reports that to the person
        });

        return () => {
            stopped = true;
            cancelAnimationFrame(frame);
            stream?.getTracks().forEach((track) => track.stop());
            context?.close();
            element?.style.setProperty('--level', '0');
        };
    }, [active, elementRef]);
}
