import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const mindStates = [
    { max: 30, text: 'Grounded & Clear', hint: 'Breathe in ease' },
    { max: 70, text: 'Slight Tension', hint: 'Soft shoulder release' },
    { max: 100, text: 'Cognitive Fatigue', hint: 'Unclench jaw, take space' }
]

const HomePage = () => {
    const navigate = useNavigate();

    const [mindLevel, setMindLevel] = useState(20);
    const [hint, setHint] = useState('Exhale softly');
    const [inhaling, setInhaling] = useState(false);

    const mindState = mindStates.find((state) => mindLevel <= state.max);

    const handleSliderChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setMindLevel(value);
        setHint(mindStates.find((state) => value <= state.max).hint);
    }

    const handleOrbClick = () => {
        setInhaling(!inhaling);
        setHint(!inhaling ? 'Inhale slowly...' : 'Exhale completely...');
    }

    return (
        <div className="bg-surface text-on-surface font-body antialiased flex flex-col min-h-[calc(100svh-4rem)] selection:bg-primary-fixed selection:text-primary">
            <main className="flex-1 flex flex-col pt-8 pb-20 px-6 max-w-md mx-auto w-full justify-between">
                {/* Hero */}
                <div className="pt-6 pb-4 flex flex-col items-center text-center">
                    {/* Breathing orb */}
                    <button
                        type="button"
                        onClick={handleOrbClick}
                        title="Tap to sync breath"
                        className="relative w-28 h-28 my-6 flex items-center justify-center cursor-pointer group select-none"
                    >
                        <div className="absolute inset-0 rounded-full bg-primary-fixed-dim/25 blur-xl animate-gentle-pulse"></div>
                        {/* Rising sun from the logo: peeks over the hill, rises and smiles on hover/focus */}
                        <svg viewBox="80 80 352 352" className="relative w-24 h-24 transition-transform duration-700 group-active:scale-95" aria-hidden="true">
                            <defs>
                                <clipPath id="sun-clip">
                                    <rect x="80" y="80" width="352" height="320" />
                                </clipPath>
                            </defs>
                            <g clipPath="url(#sun-clip)">
                                <g className="transition-transform duration-700 ease-out translate-y-[130px] group-hover:translate-y-0 group-focus-visible:translate-y-0">
                                    <g stroke="#ff8a3d" strokeWidth="22" strokeLinecap="round" className="opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:delay-300 group-focus-visible:opacity-100 group-focus-visible:delay-300">
                                        <line x1="256" y1="99" x2="256" y2="121" />
                                        <line x1="147" y1="141" x2="167" y2="161" />
                                        <line x1="365" y1="141" x2="345" y2="161" />
                                        <line x1="99" y1="242" x2="125" y2="242" />
                                        <line x1="387" y1="242" x2="413" y2="242" />
                                    </g>
                                    <circle cx="255" cy="253" r="95" fill="#ffc83d" />
                                    <path d="M214 244 Q256 284 297 244" fill="none" stroke="#0f5334" strokeWidth="20" strokeLinecap="round" className="[transform-box:fill-box] origin-top scale-y-15 transition-transform duration-500 group-hover:scale-y-100 group-hover:delay-500 group-focus-visible:scale-y-100 group-focus-visible:delay-500" />
                                </g>
                            </g>
                            <path d="M88 340 C120 318 150 305 175 307 C220 310 260 352 312 352 C350 352 390 333 424 316 V387 Q424 423 388 423 H124 Q88 423 88 387 Z" fill="#2fa36b" />
                        </svg>
                        <span className="absolute -bottom-5 whitespace-nowrap text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/70">{hint}</span>
                    </button>
                    <h1 className="font-headline text-[30px] leading-[1.2] font-semibold tracking-[-0.02em] text-on-surface mt-2 max-w-[320px]">
                        A quiet harbor for your cognitive energy.
                    </h1>
                    <p className="text-[15px] leading-relaxed text-on-surface-variant font-normal mt-3 max-w-[300px]">
                        Pacing your workday gently before exhaustion takes over. No noise, just calm guidance.
                    </p>
                </div>

                {/* Mind-weight slider */}
                <div className="w-full my-6 px-4 py-4 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between text-[13px] text-on-surface-variant mb-3">
                        <label htmlFor="mind-slider" className="font-medium text-on-surface">How heavy is your mind right now?</label>
                        <span className="text-[12px] text-primary font-medium">{mindState.text}</span>
                    </div>
                    <input
                        id="mind-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={mindLevel}
                        onChange={handleSliderChange}
                        className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                    <div className="flex justify-between text-[11px] text-on-surface-variant/60 mt-2 font-normal">
                        <span>Light &amp; Clear</span>
                        <span>Carrying Weight</span>
                        <span>Overwhelmed</span>
                    </div>
                </div>

                {/* Entry actions */}
                <div className="w-full flex flex-col items-center gap-3 pt-2">
                    <Link
                        to="/assessment"
                        className="w-full h-12 rounded-xl bg-primary text-on-primary font-medium text-[15px] tracking-tight hover:bg-primary-container active:scale-[0.99] transition-all shadow-[0_1px_4px_rgba(9,100,68,0.2)] flex items-center justify-center gap-2"
                    >
                        <span>Get Started</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                    <button
                        type="button"
                        className="w-full h-12 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface font-medium text-[14px] tracking-tight hover:bg-surface-container-low active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                    <div className="pt-2 text-center">
                        <p className="text-[13px] text-on-surface-variant font-normal">
                            Already have an account?{' '}
                            <button 
                                type="button" 
                                onClick={() => navigate('/login')} 
                                className="font-medium text-primary hover:underline ml-0.5 cursor-pointer"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant/70">
                        <span className="material-symbols-outlined text-[13px]">verified_user</span>
                        <span>100% private &amp; client-side • Bring your own API key</span>
                    </div>
                </div>
            </main>

            <footer className="w-full pt-2 pb-4 text-center">
                <div className="h-10 flex items-center justify-center gap-4 text-[12px] text-on-surface-variant/60 font-light">
                    <span>Quiet Mode</span>
                    <span>•</span>
                    <span>Evidence Based</span>
                    <span>•</span>
                    <span>Local First</span>
                </div>
            </footer>
        </div>
    )
}

export default HomePage
