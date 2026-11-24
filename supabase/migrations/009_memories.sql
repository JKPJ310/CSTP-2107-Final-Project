-- Equilibria: the shared memory. Short notes the memory agent writes about diary entries and
-- chats, which the AI chat reads as background. Notes are summaries, never the person's own words.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs 002_diary_entries.sql, 005_chat.sql and 006_short_onboarding.sql first.

create table public.memories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    source text not null check (source in ('diary', 'chat')),
    -- Diary notes: the entry they describe. Deleting the entry deletes its note.
    diary_entry_id uuid unique references public.diary_entries (id) on delete cascade,
    -- Chat notes: the time of the last message they cover, so the next note starts after it
    chat_until timestamptz,
    mood text check (char_length(mood) <= 30),
    energy smallint check (energy between 1 and 5),
    stressors text[] not null default '{}' check (cardinality(stressors) <= 3),
    positives text[] not null default '{}' check (cardinality(positives) <= 3),
    summary text not null check (char_length(summary) between 1 and 300),
    -- When the diary entry was written or the chat happened
    happened_at timestamptz not null,
    created_at timestamptz not null default now(),
    check (
        (source = 'diary' and diary_entry_id is not null and chat_until is null)
        or (source = 'chat' and chat_until is not null and diary_entry_id is null)
    )
);

create index memories_user_happened_idx on public.memories (user_id, happened_at desc);

-- Two chat notes never cover the same messages
create unique index memories_one_chat_note on public.memories (user_id, chat_until) where source = 'chat';

-- Row Level Security: people can read and delete their own notes.
-- There is deliberately no insert or update policy: only the memory agent (server side) writes notes.
alter table public.memories enable row level security;

create policy "Users read own memories" on public.memories
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users delete own memories" on public.memories
    for delete to authenticated using ((select auth.uid()) = user_id);

-- An edited entry's note is out of date, so it's dropped (the app asks the agent for a new one).
-- An entry marked private loses its note, and the agent won't write another.
create function public.forget_changed_diary_entry() returns trigger
language plpgsql as $$
begin
    delete from public.memories where diary_entry_id = new.id;
    return new;
end;
$$;

create trigger diary_entries_forget_memory
after update of body, is_private on public.diary_entries
for each row
when (old.body is distinct from new.body or old.is_private is distinct from new.is_private)
execute function public.forget_changed_diary_entry();

-- Saying no to "Can Equilibria use your diary…" removes every diary note
create function public.forget_diary_without_consent() returns trigger
language plpgsql as $$
begin
    delete from public.memories where user_id = new.id and source = 'diary';
    return new;
end;
$$;

create trigger profiles_forget_diary_memories
after update of diary_ai_consent on public.profiles
for each row
when (old.diary_ai_consent and not new.diary_ai_consent)
execute function public.forget_diary_without_consent();
