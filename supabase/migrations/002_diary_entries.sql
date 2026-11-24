-- Equilibria: diary entries, one row per entry, owned by the signed-in user.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs 001_profiles.sql first (it creates the set_updated_at() function).

create table public.diary_entries (
    id uuid primary key default gen_random_uuid(),
    -- Filled in automatically from the login, so the app never sends a user id
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    body text not null check (char_length(trim(body)) between 1 and 20000),
    tags text[] not null default '{}' check (cardinality(tags) <= 16),
    -- Private entries are never sent to the AI
    is_private boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index diary_entries_user_created_idx on public.diary_entries (user_id, created_at desc);

create trigger diary_entries_set_updated_at
before update on public.diary_entries
for each row execute function public.set_updated_at();

-- Row Level Security: each user can only see and change their own entries.
alter table public.diary_entries enable row level security;

create policy "Users read own diary" on public.diary_entries
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users write own diary" on public.diary_entries
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users edit own diary" on public.diary_entries
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own diary" on public.diary_entries
    for delete to authenticated using ((select auth.uid()) = user_id);
