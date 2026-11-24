-- Equilibria: small recovery goals, up to 3 per user.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs 001_profiles.sql first (it creates the set_updated_at() function).

create table public.goals (
    id uuid primary key default gen_random_uuid(),
    -- Filled in automatically from the login, so the app never sends a user id
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    text text not null check (char_length(trim(text)) between 1 and 120),
    -- When it was last ticked. The tick counts as "done" for 24 hours, then clears. No history, no streaks.
    done_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id, created_at);

create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

-- At most 3 goals per user, checked on the server too
create function public.enforce_goal_limit() returns trigger
language plpgsql as $$
begin
    if (select count(*) from public.goals where user_id = new.user_id) >= 3 then
        raise exception 'goal_limit' using errcode = 'P0001';
    end if;
    return new;
end;
$$;

create trigger goals_enforce_limit
before insert on public.goals
for each row execute function public.enforce_goal_limit();

-- Row Level Security: each user can only see and change their own goals.
alter table public.goals enable row level security;

create policy "Users read own goals" on public.goals
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own goals" on public.goals
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users edit own goals" on public.goals
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own goals" on public.goals
    for delete to authenticated using ((select auth.uid()) = user_id);
