import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QuestionField from '../components/QuestionField'
import { MIN_AGE, signupSteps } from '../data/signupQuestions'
import { heightInCm } from '../lib/units'

const emptyValue = (question) => {
    if (question.type === 'multi') return [];
    if (question.type === 'checkbox') return false;
    if (question.id === 'units') return 'metric';
    return '';
}

const initialAnswers = () => {
    const answers = { avatarEmoji: '', avatarPhoto: null, heightCm: '', heightFt: '', heightIn: '' };
    signupSteps.forEach((step) => step.questions.forEach((q) => {
        if (q.type !== 'height' && q.type !== 'avatar') answers[q.id] = emptyValue(q);
        if (q.describeOption) answers[`${q.id}Custom`] = '';
    }));
    return answers;
}

const ageFrom = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthday = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    return hadBirthday ? age : age - 1;
}

const outOfRange = (value, min, max) => value !== '' && (Number(value) < min || Number(value) > max);

const validateQuestion = (question, answers) => {
    const value = answers[question.id];
    const imperial = answers.units === 'imperial';

    if (question.type === 'height') {
        if (imperial && outOfRange(answers.heightIn, 0, 11)) return 'Inches should be between 0 and 11.';
        const cm = heightInCm(answers);
        if (cm !== null && (cm < 50 || cm > 250)) {
            return imperial ? 'Enter a height between 1 ft 8 in and 8 ft 2 in.' : 'Enter a height between 50 and 250 cm.';
        }
        return null;
    }
    if (question.type === 'weight') {
        if (imperial ? outOfRange(value, 45, 660) : outOfRange(value, 20, 300)) {
            return imperial ? 'Enter a weight between 45 and 660 lb.' : 'Enter a weight between 20 and 300 kg.';
        }
        return null;
    }

    const empty = question.type === 'checkbox' ? !value : String(value).trim() === '';
    if (question.required && empty) {
        return question.type === 'checkbox' ? 'Please agree to continue.' : 'Please answer this one.';
    }
    if (question.describeOption && value === question.describeOption && answers[`${question.id}Custom`].trim() === '') {
        return 'Please describe it in your own words, or choose another option.';
    }
    if (question.type === 'date' && value) {
        if (new Date(value) > new Date()) return 'That date is in the future.';
        if (ageFrom(value) < MIN_AGE) return `Equilibria is for people ${MIN_AGE} and older.`;
    }
    return null;
}

// Id of the element to focus when a question has an error
const focusTarget = (question, answers) => {
    if (question.describeOption && answers[question.id] === question.describeOption) return `${question.id}Custom`;
    if (question.type === 'single' || question.type === 'multi') return `${question.id}-${question.options[0].value}`;
    if (question.type === 'height') return answers.units === 'imperial' ? 'heightFt' : 'heightCm';
    return question.id;
}

const SignupPage = () => {

    const [answers, setAnswers] = useState(initialAnswers);
    const [stepIndex, setStepIndex] = useState(0);
    const [errors, setErrors] = useState({});
    const [finished, setFinished] = useState(false);
    const headingRef = useRef(null);
    const firstRender = useRef(true);
    const photoUrlRef = useRef(null);

    const step = signupSteps[stepIndex];
    const isLastStep = stepIndex === signupSteps.length - 1;

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        headingRef.current?.focus();
    }, [stepIndex, finished]);

    // Release the photo preview's memory when it's replaced or the page closes
    useEffect(() => {
        const previous = photoUrlRef.current;
        photoUrlRef.current = answers.avatarPhoto?.url ?? null;
        if (previous && previous !== photoUrlRef.current) URL.revokeObjectURL(previous);
    }, [answers.avatarPhoto]);

    useEffect(() => () => {
        if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    }, []);

    const handleChange = (id, value) => {
        setAnswers((prev) => {
            const next = { ...prev, [id]: value };
            // Switching units clears measurements so values aren't read in the wrong unit
            if (id === 'units' && value !== prev.units) {
                Object.assign(next, { heightCm: '', heightFt: '', heightIn: '', weight: '' });
            }
            // A photo and an emoji are alternatives: picking one clears the other
            if (id === 'avatarPhoto') next.avatarEmoji = '';
            if (id === 'avatarEmoji') next.avatarPhoto = null;
            return next;
        });
        const errorKey = id.startsWith('height') ? 'height' : id.replace(/Custom$/, '');
        setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }

    const handleNext = (e) => {
        e.preventDefault();
        const stepErrors = {};
        step.questions.forEach((q) => {
            const error = validateQuestion(q, answers);
            if (error) stepErrors[q.id] = error;
        });
        setErrors(stepErrors);

        const firstInvalid = step.questions.find((q) => stepErrors[q.id]);
        if (firstInvalid) {
            document.getElementById(focusTarget(firstInvalid, answers))?.focus();
            return;
        }
        // Frontend only for now: answers aren't saved anywhere yet
        if (isLastStep) setFinished(true);
        else setStepIndex(stepIndex + 1);
    }

    const handleBack = () => {
        setErrors({});
        setStepIndex(stepIndex - 1);
    }

    if (finished) {
        return (
            <div className="bg-surface text-on-surface font-body min-h-[calc(100svh-4rem)] flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden" aria-hidden="true">
                        {answers.avatarPhoto ? (
                            <img src={answers.avatarPhoto.url} alt="" className="w-full h-full object-cover" />
                        ) : answers.avatarEmoji ? (
                            <span className="text-[48px] leading-none">{answers.avatarEmoji}</span>
                        ) : (
                            <img src="/logo.png" alt="" className="w-full h-full" />
                        )}
                    </div>
                    <h1 ref={headingRef} tabIndex={-1} className="font-headline text-[28px] leading-tight font-semibold tracking-[-0.02em] focus:outline-none">
                        Welcome, {answers.name.trim()}.
                    </h1>
                    <p className="mt-3 text-[15px] leading-relaxed text-on-surface-variant">
                        Thanks for sharing. Next, a short check-in to see where your energy is today.
                    </p>
                    <Link
                        to="/assessment"
                        className="mt-8 w-full h-12 rounded-xl bg-primary text-on-primary font-medium text-[15px] hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Start check-in</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-surface text-on-surface font-body min-h-[calc(100svh-4rem)]">
            <main className="max-w-md mx-auto px-6 pt-8 pb-16">
                {/* Progress */}
                <div className="flex items-center justify-between text-[12px] text-on-surface-variant mb-2">
                    <span>Step {stepIndex + 1} of {signupSteps.length}</span>
                    <span>{step.title}</span>
                </div>
                <div
                    role="progressbar"
                    aria-label="Sign-up progress"
                    aria-valuemin={1}
                    aria-valuemax={signupSteps.length}
                    aria-valuenow={stepIndex + 1}
                    className="h-1.5 rounded-full bg-surface-container-high overflow-hidden"
                >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / signupSteps.length) * 100}%` }} />
                </div>

                <form onSubmit={handleNext} noValidate className="mt-8">
                    <h1 ref={headingRef} tabIndex={-1} className="font-headline text-[26px] leading-tight font-semibold tracking-[-0.02em] focus:outline-none">
                        {step.title}
                    </h1>
                    <p className="mt-2 text-[14px] leading-relaxed text-on-surface-variant">{step.intro}</p>

                    <div className="mt-6 flex flex-col gap-6 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant">
                        {step.questions.map((question) => (
                            <QuestionField
                                key={question.id}
                                question={question}
                                answers={answers}
                                onChange={handleChange}
                                error={errors[question.id]}
                            />
                        ))}
                    </div>

                    <div className="mt-8 flex gap-3">
                        {stepIndex > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="h-12 px-5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface font-medium text-[15px] hover:bg-surface-container-low transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-medium text-[15px] hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            <span>{isLastStep ? 'Create my space' : 'Continue'}</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}

export default SignupPage
