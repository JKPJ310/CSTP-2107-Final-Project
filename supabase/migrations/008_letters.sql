-- Equilibria: letters to future you, with a real time lock.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- The words live in letter_bodies and are only readable once the letter has unlocked.
-- The app can always see the dates and count, but never the words before that moment.

create table public.letters (
    id uuid primary key default gen_random_uuid(),
    -- Filled in automatically from the login, so the app never sends a user id
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    -- The moment this letter is allowed to open
    opens_at timestamptz not null,
    created_at timestamptz not null default now(),
    -- Set when the person first opens it after the unlock time
    opened_at timestamptz,
    -- A letter can't be sealed for a time that has already passed
    constraint letters_opens_in_future check (opens_at > created_at)
);

create index letters_user_opens_idx on public.letters (user_id, opens_at);

create table public.letter_bodies (
    letter_id uuid primary key references public.letters (id) on delete cascade,
    -- Duplicated so the read rule below can check ownership without extra lookups
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    body text not null check (char_length(trim(body)) between 1 and 20000)
);

-- Row Level Security: each person only ever touches their own letters.
alter table public.letters enable row level security;
alter table public.letter_bodies enable row level security;

-- Dates and counts: always readable by the owner, so the home tile can say
-- "1 sealed · opens Dec 8" without revealing the words.
create policy "Users read own letters" on public.letters
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users write own letters" on public.letters
    for insert to authenticated with check ((select auth.uid()) = user_id);
-- Lets the app record opened_at. The trigger below stops the unlock date being changed.
create policy "Users update own letters" on public.letters
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own letters" on public.letters
    for delete to authenticated using ((select auth.uid()) = user_id);

-- The words: readable only after the unlock time, even if someone calls the API directly.
create policy "Users read unlocked letter bodies" on public.letter_bodies
    for select to authenticated using (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.letters
            where letters.id = letter_bodies.letter_id
              and letters.user_id = (select auth.uid())
              and letters.opens_at <= now()
        )
    );
create policy "Users write own letter bodies" on public.letter_bodies
    for insert to authenticated with check (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.letters
            where letters.id = letter_bodies.letter_id
              and letters.user_id = (select auth.uid())
        )
    );

-- Once sealed, the unlock date can't be moved. (Deleting the letter is still allowed.)
create function public.letters_keep_seal() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if new.opens_at <> old.opens_at then
        raise exception 'The unlock date of a sealed letter cannot be changed.';
    end if;
    return new;
end;
$$;

create trigger letters_keep_seal
before update on public.letters
for each row execute function public.letters_keep_seal();

-- Saves the letter and its words in one step, so a failure can never leave
-- an empty sealed letter behind. Runs as the signed-in person (RLS still applies).
create function public.create_letter(p_body text, p_opens_at timestamptz)
returns public.letters
language plpgsql
security invoker
set search_path = ''
as $$
declare
    new_letter public.letters;
begin
    if char_length(trim(p_body)) < 1 then
        raise exception 'Write a few words first.';
    end if;
    if char_length(trim(p_body)) > 20000 then
        raise exception 'This letter is too long.';
    end if;
    if p_opens_at is null or p_opens_at <= now() then
        raise exception 'Choose a time in the future.';
    end if;

    insert into public.letters (opens_at)
    values (p_opens_at)
    returning * into new_letter;

    insert into public.letter_bodies (letter_id, body)
    values (new_letter.id, trim(p_body));

    return new_letter;
end;
$$;

revoke execute on function public.create_letter(text, timestamptz) from public, anon;
grant execute on function public.create_letter(text, timestamptz) to authenticated;

-- Ask the API to pick up the new table and function right away
notify pgrst, 'reload schema';
