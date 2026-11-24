-- Equilibria: user profiles from the sign-up questionnaire.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,

    -- About you
    display_name text not null check (char_length(trim(display_name)) between 1 and 50),
    date_of_birth date not null check (date_of_birth <= current_date - interval '18 years'),
    gender text check (gender in ('female', 'male', 'self_described', 'prefer_not')),
    gender_custom text check (char_length(gender_custom) <= 40),
    pronouns text check (pronouns in ('she_her', 'he_him', 'they_them', 'self_described', 'prefer_not')),
    pronouns_custom text check (char_length(pronouns_custom) <= 40),
    country text not null check (country in ('CA', 'US', 'GB', 'IN', 'AU', 'other')),

    -- Picture: an emoji, or a path inside the private "avatars" storage bucket
    avatar_emoji text check (char_length(avatar_emoji) <= 16),
    avatar_path text,

    -- Body basics (always stored metric)
    height_cm numeric(4, 1) check (height_cm between 50 and 250),
    weight_kg numeric(4, 1) check (weight_kg between 20 and 300),

    -- Sleep
    sleep_hours text not null check (sleep_hours in ('lt5', '5-6', '6-7', '7-8', '8-9', 'gt9')),
    sleep_quality text not null check (sleep_quality in ('rarely', 'sometimes', 'usually', 'almost_always')),
    sleep_schedule text check (sleep_schedule in ('regular', 'mostly', 'varies')),

    -- Water & food
    water_intake text not null check (water_intake in ('lt1', '1-2', '2-3', 'gt3')),
    diet text check (diet in ('none', 'vegetarian', 'vegan', 'pescatarian', 'low_carb', 'halal', 'kosher', 'other')),
    skipped_meals text not null check (skipped_meals in ('rarely', 'weekly', 'daily')),
    caffeine text check (caffeine in ('0', '1-2', '3-4', 'gt5')),

    -- Work & movement
    work_hours text not null check (work_hours in ('lt20', '20-40', '40-50', 'gt50')),
    exercise_days text check (exercise_days in ('0', '1-2', '3-4', 'gt5')),

    -- Health & stress
    health_conditions text[] not null default '{}' check (health_conditions <@ array[
        'chronic_pain', 'migraines', 'diabetes', 'blood_pressure', 'thyroid', 'asthma',
        'anxiety', 'depression', 'adhd', 'other', 'none', 'prefer_not'
    ]),
    stress_level text not null check (stress_level in ('rarely', 'sometimes', 'often', 'almost_always')),
    energy_level text not null check (energy_level in ('steady', 'dips', 'low', 'running_on_empty')),

    -- Consent
    terms_version text not null,
    terms_accepted_at timestamptz not null,
    improve_consent boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Row Level Security: each signed-in user can only see and change their own row.
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
    for select to authenticated using ((select auth.uid()) = id);
create policy "Users create own profile" on public.profiles
    for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles
    for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users delete own profile" on public.profiles
    for delete to authenticated using ((select auth.uid()) = id);

-- Private bucket for profile photos. Files live at avatars/<user id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users read own avatar" on storage.objects
    for select to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload own avatar" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users replace own avatar" on storage.objects
    for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own avatar" on storage.objects
    for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
