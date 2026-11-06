// Sign-up questionnaire. Each step renders as one screen in SignupPage.
// Question types: text, date, select, single (one choice), multi (many choices),
// height, weight, checkbox, avatar.
// A single question with `describeOption` shows a text box (stored as `<id>Custom`)
// when that option is chosen. Sensitive questions (body, health) are optional.

export const MIN_AGE = 18;

// Bump when the Terms of Use / Privacy Policy change; stored with each user's consent.
export const TERMS_VERSION = '2026-11-06';

export const signupSteps = [
    {
        id: 'avatar',
        title: 'Your picture',
        intro: 'Add a photo or pick an emoji. You can change it anytime.',
        questions: [
            { id: 'avatar', type: 'avatar', label: 'Profile picture' }
        ]
    },
    {
        id: 'about',
        title: 'About you',
        intro: 'A few basics so Equilibria feels like yours.',
        questions: [
            { id: 'name', type: 'text', label: 'What should we call you?', required: true, maxLength: 50, autoComplete: 'given-name' },
            { id: 'dob', type: 'date', label: 'Date of birth', required: true, help: `You need to be ${MIN_AGE} or older to use Equilibria.` },
            {
                id: 'gender', type: 'single', label: 'Gender', describeOption: 'self_described',
                options: [
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'self_described', label: 'Self-described' },
                    { value: 'prefer_not', label: 'Prefer not to say' }
                ]
            },
            {
                id: 'pronouns', type: 'single', label: 'Pronouns', describeOption: 'self_described',
                help: 'So Equilibria talks to you the way you’d like.',
                options: [
                    { value: 'she_her', label: 'she/her' },
                    { value: 'he_him', label: 'he/him' },
                    { value: 'they_them', label: 'they/them' },
                    { value: 'self_described', label: 'Self-described' },
                    { value: 'prefer_not', label: 'Prefer not to say' }
                ]
            },
            {
                id: 'country', type: 'select', label: 'Where do you live?', required: true,
                help: 'Only used to show support resources for your region.',
                options: [
                    { value: 'CA', label: 'Canada' },
                    { value: 'US', label: 'United States' },
                    { value: 'GB', label: 'United Kingdom' },
                    { value: 'IN', label: 'India' },
                    { value: 'AU', label: 'Australia' },
                    { value: 'other', label: 'Somewhere else' }
                ]
            }
        ]
    },
    {
        id: 'body',
        title: 'Body basics',
        intro: 'Optional. Skip anything you’d rather not share.',
        questions: [
            {
                id: 'units', type: 'single', label: 'Units',
                options: [
                    { value: 'metric', label: 'cm / kg' },
                    { value: 'imperial', label: 'ft / lb' }
                ]
            },
            { id: 'height', type: 'height', label: 'Height' },
            { id: 'weight', type: 'weight', label: 'Weight' }
        ]
    },
    {
        id: 'sleep',
        title: 'Sleep',
        intro: 'Rest is the first thing stress takes from us.',
        questions: [
            {
                id: 'sleepHours', type: 'single', label: 'On a typical night, how many hours do you sleep?', required: true,
                options: [
                    { value: 'lt5', label: 'Under 5' },
                    { value: '5-6', label: '5–6' },
                    { value: '6-7', label: '6–7' },
                    { value: '7-8', label: '7–8' },
                    { value: '8-9', label: '8–9' },
                    { value: 'gt9', label: 'Over 9' }
                ]
            },
            {
                id: 'sleepQuality', type: 'single', label: 'How rested do you feel when you wake up?', required: true,
                options: [
                    { value: 'rarely', label: 'Rarely rested' },
                    { value: 'sometimes', label: 'Sometimes' },
                    { value: 'usually', label: 'Usually' },
                    { value: 'almost_always', label: 'Almost always' }
                ]
            },
            {
                id: 'sleepSchedule', type: 'single', label: 'How regular is your bedtime?',
                options: [
                    { value: 'regular', label: 'Very regular' },
                    { value: 'mostly', label: 'Mostly regular' },
                    { value: 'varies', label: 'It varies a lot' }
                ]
            }
        ]
    },
    {
        id: 'nutrition',
        title: 'Water & food',
        intro: 'Hydration and regular meals steady your energy through the day.',
        questions: [
            {
                id: 'water', type: 'single', label: 'How much water do you drink on a typical day?', required: true,
                options: [
                    { value: 'lt1', label: 'Under 1 L (about 4 glasses)' },
                    { value: '1-2', label: '1–2 L (4–8 glasses)' },
                    { value: '2-3', label: '2–3 L (8–12 glasses)' },
                    { value: 'gt3', label: 'Over 3 L' }
                ]
            },
            {
                id: 'diet', type: 'single', label: 'Which best describes how you eat?',
                options: [
                    { value: 'none', label: 'No specific diet' },
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'pescatarian', label: 'Pescatarian' },
                    { value: 'low_carb', label: 'Low-carb / keto' },
                    { value: 'halal', label: 'Halal' },
                    { value: 'kosher', label: 'Kosher' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                id: 'skippedMeals', type: 'single', label: 'How often do you skip meals because you’re busy or stressed?', required: true,
                options: [
                    { value: 'rarely', label: 'Rarely' },
                    { value: 'weekly', label: 'A few times a week' },
                    { value: 'daily', label: 'Most days' }
                ]
            },
            {
                id: 'caffeine', type: 'single', label: 'Coffee, tea or energy drinks per day',
                options: [
                    { value: '0', label: 'None' },
                    { value: '1-2', label: '1–2' },
                    { value: '3-4', label: '3–4' },
                    { value: 'gt5', label: '5 or more' }
                ]
            }
        ]
    },
    {
        id: 'lifestyle',
        title: 'Work & movement',
        intro: 'How your week is shaped.',
        questions: [
            {
                id: 'workHours', type: 'single', label: 'How many hours do you work or study in a typical week?', required: true,
                options: [
                    { value: 'lt20', label: 'Under 20' },
                    { value: '20-40', label: '20–40' },
                    { value: '40-50', label: '40–50' },
                    { value: 'gt50', label: 'Over 50' }
                ]
            },
            {
                id: 'exercise', type: 'single', label: 'On how many days a week are you active for 30+ minutes?',
                options: [
                    { value: '0', label: 'None' },
                    { value: '1-2', label: '1–2 days' },
                    { value: '3-4', label: '3–4 days' },
                    { value: 'gt5', label: '5+ days' }
                ]
            }
        ]
    },
    {
        id: 'health',
        title: 'Health & stress',
        intro: 'Optional, and private. Equilibria doesn’t diagnose. This only helps us tailor gentle suggestions.',
        questions: [
            {
                id: 'conditions', type: 'multi', label: 'Do any of these affect your daily life?',
                exclusive: ['none', 'prefer_not'],
                options: [
                    { value: 'chronic_pain', label: 'Chronic pain' },
                    { value: 'migraines', label: 'Migraines' },
                    { value: 'diabetes', label: 'Diabetes' },
                    { value: 'blood_pressure', label: 'High blood pressure' },
                    { value: 'thyroid', label: 'Thyroid condition' },
                    { value: 'asthma', label: 'Asthma' },
                    { value: 'anxiety', label: 'Anxiety' },
                    { value: 'depression', label: 'Depression' },
                    { value: 'adhd', label: 'ADHD' },
                    { value: 'other', label: 'Something else' },
                    { value: 'none', label: 'None' },
                    { value: 'prefer_not', label: 'Prefer not to say' }
                ]
            },
            {
                id: 'stress', type: 'single', label: 'Over the past two weeks, how often have you felt stressed?', required: true,
                options: [
                    { value: 'rarely', label: 'Rarely' },
                    { value: 'sometimes', label: 'Sometimes' },
                    { value: 'often', label: 'Often' },
                    { value: 'almost_always', label: 'Almost always' }
                ]
            },
            {
                id: 'energy', type: 'single', label: 'How is your energy on most days?', required: true,
                options: [
                    { value: 'steady', label: 'Steady' },
                    { value: 'dips', label: 'Dips in the afternoon' },
                    { value: 'low', label: 'Low most of the day' },
                    { value: 'running_on_empty', label: 'Running on empty' }
                ]
            }
        ]
    },
    {
        id: 'privacy',
        title: 'Your privacy',
        intro: 'Your answers stay yours. You can change or delete them anytime.',
        questions: [
            { id: 'terms', type: 'checkbox', label: 'I agree to the Terms of Use and Privacy Policy, and I understand Equilibria is not a medical or emergency service.', required: true },
            { id: 'improveConsent', type: 'checkbox', label: 'Let my anonymized answers help improve Equilibria (optional).' }
        ]
    }
];
