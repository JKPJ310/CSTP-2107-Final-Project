import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { inputClass, labelClass, textLinkClass } from '../auth/authStyles'
import { PasswordInput } from '../auth/fields'
import FormNotice from '../auth/FormNotice'
import SupportCard from '../diary/SupportCard'
import { useAuth } from '../../context/AuthContext'
import { ENERGY_OPTIONS, HELPS_OPTIONS, MOOD_OPTIONS, WEIGHING_OPTIONS } from '../../data/onboarding'
import { EMAIL_PATTERN, isUsernameAvailable, MIN_PASSWORD, passwordProblem, usernameProblem } from '../../lib/accounts'
import { mentionsCrisis } from '../../lib/safety'
import { clearPendingSetup, finishSetup, savePendingSetup } from '../../lib/setup'
import { supabase } from '../../lib/supabase'

const chipClass = 'px-4 py-2.5 rounded-full border border-hairline bg-card text-[15px] text-heading cursor-pointer select-none transition-colors hover:border-leaf has-checked:bg-forest has-checked:border-forest has-checked:text-on-primary has-focus-visible:ring-3 has-focus-visible:ring-leaf/30';
const primaryClass = 'h-12 px-6 rounded-xl bg-forest text-on-primary text-[15px] font-medium hover:bg-forest/90 transition-colors disabled:opacity-50';
const quietClass = 'h-12 px-4 text-[15px] font-medium text-body hover:text-heading';

// Tap-to-pick answers. multiple: checkboxes; otherwise radio buttons.
const Choices = ({ name, legend, options, value, onChange, multiple }) => (
    <fieldset>
        <legend className="sr-only">{legend}</legend>
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const optionValue = option.value ?? option;
                const label = option.label ?? option;
                const checked = multiple ? value.includes(optionValue) : value === optionValue;
                return (
                    <label key={optionValue} className={chipClass}>
                        <input
                            type={multiple ? 'checkbox' : 'radio'}
                            name={name}
                            checked={checked}
                            onChange={() => onChange(multiple
                                ? (checked ? value.filter((v) => v !== optionValue) : [...value, optionValue])
                                : optionValue)}
                            className="sr-only"
                        />
                        {label}
                    </label>
                )
            })}
        </div>
    </fieldset>
)

const QUESTIONS = ['mood', 'weighing', 'energy', 'helps', 'more'];

// The sign-up email has a link (Supabase's free plan can't change it to a code).
// The link signs the person in at /auth/callback, and /onboarding finishes their setup.
const emailRedirectTo = () => `${window.location.origin}/auth/callback`;

// "Your Day 1 page is ready", with the three suggested next steps
export const DayOneReady = ({ name, entryId, headingRef }) => {

    const nextSteps = [
        { to: '/chat', icon: 'chat_bubble', title: 'Talk it out', text: 'Tell Equilibria how today is going.' },
        { to: '/goals', icon: 'adjust', title: 'Set a small goal', text: 'One tiny, doable thing.' },
        { to: '/home', icon: 'home', title: 'Just look around', text: 'No pressure. Explore your space.' }
    ];

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg flex flex-col gap-6 animate-fade-in">
                <div className="text-center">
                    <img src="/logo.png" alt="" className="w-16 h-16 mx-auto mb-4" />
                    <h1 ref={headingRef} tabIndex={-1} className="font-headline text-[28px] font-semibold tracking-[-0.02em] focus:outline-none">
                        Your Day 1 page is ready, {name}.
                    </h1>
                    <p className="mt-2 text-[15px] text-body">
                        We turned your answers into your first diary entry. <Link to={`/diary/${entryId}`} className="font-medium text-forest hover:underline">Read it</Link>
                    </p>
                </div>
                <p className="text-center text-[14px] font-medium text-body">What would help right now?</p>
                <ul className="flex flex-col gap-3">
                    {nextSteps.map((next) => (
                        <li key={next.to}>
                            <Link to={next.to} className="flex items-center gap-4 p-4 rounded-[20px] bg-card border border-hairline hover:border-leaf transition-colors">
                                <span className="w-11 h-11 shrink-0 rounded-xl bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                                    <span className="material-symbols-outlined text-[22px]">{next.icon}</span>
                                </span>
                                <span className="flex flex-col">
                                    <span className="text-[16px] font-semibold text-heading">{next.title}</span>
                                    <span className="text-[14px] text-body">{next.text}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

// The first-time flow: 5 questions, then the account details.
// mode 'email' (Get Started): signed out; asks for an email, then a username and password, then sends the email link.
// mode 'signedIn' (Google, or an email link opened without saved answers): the email step is skipped,
// and the password is added to the account.
// initial: answers from an earlier try ({ answers, username, diaryAiConsent }); opens on the account step.
const SetupFlow = ({ mode, initial, initialProblem = null }) => {

    const { session, markProfileComplete } = useAuth();
    const steps = mode === 'email' ? [...QUESTIONS, 'email', 'account'] : [...QUESTIONS, 'account'];
    const [stepIndex, setStepIndex] = useState(initial ? steps.indexOf('account') : 0);
    const [sentTo, setSentTo] = useState(null);
    const [answers, setAnswers] = useState(initial?.answers ?? { mood: null, weighing: [], energy: null, helps: [], more: '' });
    const [account, setAccount] = useState({
        email: '',
        username: initial?.username ?? '',
        password: '',
        confirm: '',
        diaryAiConsent: initial?.diaryAiConsent ?? null,
        agreed: Boolean(initial)
    });
    const [saving, setSaving] = useState(false);
    const [problem, setProblem] = useState(initialProblem);
    const [info, setInfo] = useState(null);
    const [dayOne, setDayOne] = useState(null);
    const headingRef = useRef(null);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        headingRef.current?.focus();
    }, [stepIndex, sentTo, dayOne]);

    const set = (key) => (value) => setAnswers((prev) => ({ ...prev, [key]: value }));
    const setField = (key) => (value) => setAccount((prev) => ({ ...prev, [key]: value }));
    const step = steps[stepIndex];
    const username = account.username.trim();
    const email = account.email.trim();
    const setup = { email, username, diaryAiConsent: account.diaryAiConsent, answers };

    const saveEverything = async (userId) => {
        try {
            const entry = await finishSetup(userId, setup);
            clearPendingSetup();
            markProfileComplete();
            setDayOne(entry);
        } catch (error) {
            if (error.code !== 'username_taken') throw error;
            setProblem('That username was just taken. Try another one.');
        }
    }

    const createAccount = async () => {
        const fieldProblem = usernameProblem(username) ?? passwordProblem(account.password, account.confirm);
        if (fieldProblem) return setProblem(fieldProblem);

        setSaving(true);
        setProblem(null);
        try {
            if (!(await isUsernameAvailable(username))) return setProblem('That username is taken. Try another one.');

            // Already signed in (Google, or the email link): add the password to the account
            if (session) {
                const { error } = await supabase.auth.updateUser({ password: account.password });
                if (error?.code === 'weak_password') return setProblem('That password is too easy to guess. Try a longer one.');
                if (error && error.code !== 'same_password') throw error;
                return await saveEverything(session.user.id);
            }

            // Kept in this browser until the email link brings the person back
            savePendingSetup(setup);
            const { data, error } = await supabase.auth.signUp({ email, password: account.password, options: { emailRedirectTo: emailRedirectTo() } });
            if (error) clearPendingSetup();
            // Supabase returns a user with no identities when the email is already registered
            if (error?.code === 'user_already_exists' || (data?.user && data.user.identities?.length === 0)) {
                clearPendingSetup();
                return setProblem(<>An account with this email already exists. <Link to="/login" className={textLinkClass}>Log in instead</Link>.</>);
            }
            if (error?.code === 'weak_password') return setProblem('That password is too easy to guess. Try a longer one.');
            if (error?.status === 429) return setProblem('Too many sign-ups right now. Please wait a few minutes and try again.');
            if (error) throw error;
            // No session yet means email confirmation is on: wait for the link
            if (data.session) await saveEverything(data.session.user.id);
            else setSentTo(email);
        } catch (error) {
            console.error('Creating the account failed:', error.message);
            setProblem('We couldn’t create your account. Check your connection and try again.');
        } finally {
            setSaving(false);
        }
    }

    const handleContinue = (e) => {
        e.preventDefault();
        if (!content.ready || saving) return;
        setProblem(null);
        if (step === 'email' && !EMAIL_PATTERN.test(email)) return setProblem('Please enter a valid email address.');
        if (step === 'account') createAccount();
        else setStepIndex(stepIndex + 1);
    }

    const handleResend = async () => {
        setProblem(null);
        setInfo(null);
        const { error } = await supabase.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: emailRedirectTo() } });
        if (error) setProblem('We couldn’t send another email yet. Please wait a minute and try again.');
        else setInfo('Another email is on its way.');
    }

    if (dayOne) return <DayOneReady name={username} entryId={dayOne.id} headingRef={headingRef} />;

    if (sentTo) {
        return (
            <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
                <main className="max-w-lg mx-auto px-4 md:px-6 pt-10 pb-16 flex flex-col gap-6 animate-fade-in">
                    <span className="w-14 h-14 rounded-2xl bg-mint text-forest flex items-center justify-center" aria-hidden="true">
                        <span className="material-symbols-outlined text-[28px]">mark_email_unread</span>
                    </span>
                    <div>
                        <h1 ref={headingRef} tabIndex={-1} className="font-headline text-[26px] md:text-[30px] leading-tight font-semibold tracking-[-0.02em] focus:outline-none">Check your email</h1>
                        <p className="mt-2 text-[15px] text-body">
                            We sent a link to <span className="font-medium text-heading">{sentTo}</span>. Open it in this browser and your account will be ready, with your answers saved.
                        </p>
                        <p className="mt-3 text-[14px] text-body">It can take a minute to arrive. Check your spam folder too. You can close this tab.</p>
                    </div>
                    {problem && <FormNotice>{problem}</FormNotice>}
                    {info && <FormNotice tone="info">{info}</FormNotice>}
                    <div className="flex flex-wrap gap-4 text-[14px]">
                        <button type="button" onClick={handleResend} className={textLinkClass}>Send the email again</button>
                        <button type="button" onClick={() => { clearPendingSetup(); setSentTo(null); setStepIndex(steps.indexOf('email')); setProblem(null); setInfo(null); }} className={textLinkClass}>Use a different email</button>
                    </div>
                </main>
            </div>
        )
    }

    const content = {
        mood: {
            title: 'How are you feeling right now?',
            intro: 'Pick the closest one. There’s no wrong answer.',
            ready: answers.mood !== null,
            body: <Choices name="mood" legend="How you’re feeling" options={MOOD_OPTIONS} value={answers.mood} onChange={set('mood')} />
        },
        weighing: {
            title: 'What’s weighing on you?',
            intro: 'Pick any that fit, or none.',
            ready: true,
            body: <Choices name="weighing" legend="What’s weighing on you" options={WEIGHING_OPTIONS} value={answers.weighing} onChange={set('weighing')} multiple />
        },
        energy: {
            title: 'How’s your energy?',
            intro: 'Just today. It changes, and that’s okay.',
            ready: answers.energy !== null,
            body: <Choices name="energy" legend="Your energy today" options={ENERGY_OPTIONS} value={answers.energy} onChange={set('energy')} />
        },
        helps: {
            title: 'What usually helps you?',
            intro: 'Pick any that fit. This helps Equilibria suggest things you actually like.',
            ready: true,
            body: <Choices name="helps" legend="What usually helps" options={HELPS_OPTIONS} value={answers.helps} onChange={set('helps')} multiple />
        },
        more: {
            title: 'Anything else on your mind?',
            intro: 'Optional. This becomes the start of your first diary page.',
            ready: true,
            body: (
                <div className="flex flex-col gap-4">
                    <label htmlFor="setup-more" className="sr-only">Anything else on your mind</label>
                    <textarea
                        id="setup-more"
                        value={answers.more}
                        onChange={(e) => set('more')(e.target.value)}
                        maxLength={4000}
                        rows={6}
                        placeholder="It doesn’t have to be good. Just honest."
                        className="w-full p-4 rounded-xl bg-card border border-hairline font-serif text-[17px] leading-relaxed text-heading placeholder:text-body/70 focus:outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/15 resize-y"
                    />
                    {mentionsCrisis(answers.more) && <SupportCard />}
                </div>
            )
        },
        email: {
            title: 'What’s your email?',
            intro: 'We’ll send a link to confirm it’s you. After that, it’s only used if you forget your password.',
            ready: email.length > 0,
            body: (
                <div>
                    <label htmlFor="setup-email" className={labelClass}>Email</label>
                    <input id="setup-email" type="email" autoComplete="email" value={account.email} onChange={(e) => setField('email')(e.target.value)} className={inputClass} />
                </div>
            )
        },
        account: {
            title: 'Choose a username and password',
            intro: session?.user.app_metadata?.provider === 'google'
                ? <>You’re signed in with Google as <span className="font-medium text-heading">{session.user.email}</span>. Add a username and password so you can also log in without Google.</>
                : 'You’ll use these to log in.',
            ready: username.length > 0 && account.password.length > 0 && account.confirm.length > 0 && account.diaryAiConsent !== null && account.agreed,
            body: (
                <div className="flex flex-col gap-5">
                    <div>
                        <label htmlFor="setup-username" className={labelClass}>Username</label>
                        <input id="setup-username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} value={account.username} onChange={(e) => setField('username')(e.target.value)} aria-describedby="setup-username-help" className={inputClass} />
                        <p id="setup-username-help" className="mt-1.5 text-[12px] text-body">3 to 20 letters, numbers or underscores. This is also the name Equilibria calls you.</p>
                    </div>
                    <div>
                        <PasswordInput id="setup-password" label="Password" value={account.password} onChange={setField('password')} autoComplete="new-password" describedBy="setup-password-help" />
                        <p id="setup-password-help" className="mt-1.5 text-[12px] text-body">At least {MIN_PASSWORD} characters. A short phrase works well.</p>
                    </div>
                    <PasswordInput id="setup-confirm" label="Type it again" value={account.confirm} onChange={setField('confirm')} autoComplete="new-password" />
                    <div className="flex flex-col gap-3">
                        <p className="text-[14px] font-medium text-heading">Can Equilibria use your diary to personalize chat and goals?</p>
                        <Choices
                            name="diary-ai"
                            legend="Use my diary to personalize chat and goals"
                            options={[{ value: true, label: 'Yes, use my diary' }, { value: false, label: 'Not now' }]}
                            value={account.diaryAiConsent}
                            onChange={setField('diaryAiConsent')}
                        />
                        <p className="text-[12px] text-body">You can change this anytime. Private entries are never shared either way.</p>
                    </div>
                    <label className="flex items-start gap-3 text-[14px] leading-snug text-heading cursor-pointer">
                        <input type="checkbox" checked={account.agreed} onChange={(e) => setField('agreed')(e.target.checked)} className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-forest" />
                        <span>I’m 18 or older, and I understand Equilibria is not therapy or medical care. I agree to the Terms of Use and Privacy Policy.</span>
                    </label>
                </div>
            )
        }
    }[step];

    const isQuestion = stepIndex < QUESTIONS.length;
    let buttonLabel = 'Continue';
    if (step === 'account') buttonLabel = saving ? 'Creating your account…' : 'Create my account';

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-lg mx-auto px-4 md:px-6 pt-10 pb-16">
                {isQuestion && (
                    <div className="mb-8">
                        <p className="text-[13px] text-body mb-2">Question {stepIndex + 1} of {QUESTIONS.length}</p>
                        <div role="progressbar" aria-label="Question progress" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={stepIndex + 1} className="h-1.5 rounded-full bg-hairline overflow-hidden">
                            <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / QUESTIONS.length) * 100}%` }} />
                        </div>
                    </div>
                )}

                <form key={step} onSubmit={handleContinue} noValidate className="flex flex-col gap-6 animate-fade-in">
                    <div>
                        {stepIndex === 0 && <img src="/logo.png" alt="" className="w-16 h-16 mb-5" />}
                        <h1 ref={headingRef} tabIndex={-1} className="font-headline text-[26px] md:text-[30px] leading-tight font-semibold tracking-[-0.02em] focus:outline-none">{content.title}</h1>
                        <p className="mt-2 text-[15px] text-body">{content.intro}</p>
                    </div>

                    {content.body}

                    {problem && <FormNotice>{problem}</FormNotice>}

                    <div className="flex flex-wrap items-center gap-2">
                        <button type="submit" disabled={!content.ready || saving} className={primaryClass}>{buttonLabel}</button>
                        {stepIndex > 0 && (
                            <button type="button" onClick={() => { setStepIndex(stepIndex - 1); setProblem(null); }} disabled={saving} className={quietClass}>Back</button>
                        )}
                    </div>
                </form>

                {mode === 'email' && stepIndex === 0 && (
                    <p className="mt-10 text-[14px] text-body">Already have an account? <Link to="/login" className={textLinkClass}>Log in</Link></p>
                )}
            </main>
        </div>
    )
}

export default SetupFlow
