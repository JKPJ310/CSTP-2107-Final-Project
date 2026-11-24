-- Equilibria: shorter onboarding (name, privacy consent, 5 tap questions that become the Day 1 diary page).
-- The long questionnaire's fields become optional; existing profiles keep their answers.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

alter table public.profiles
    alter column date_of_birth drop not null,
    alter column country drop not null,
    alter column sleep_hours drop not null,
    alter column sleep_quality drop not null,
    alter column water_intake drop not null,
    alter column skipped_meals drop not null,
    alter column work_hours drop not null,
    alter column stress_level drop not null,
    alter column energy_level drop not null,
    -- "Can Equilibria use your diary to personalize chat and goals?" Off unless the person says yes.
    add column diary_ai_consent boolean not null default false,
    add column onboarded_at timestamptz;
