-- Equilibria: the AI chat. One ongoing conversation per user.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null check (char_length(content) between 1 and 8000),
    -- True for a message that triggered the crisis check and for the fixed reply to it.
    -- These are never sent to the AI, not even as history.
    is_safety boolean not null default false,
    created_at timestamptz not null default now()
);

create index chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);

-- Row Level Security: people can read and delete their own messages.
-- There is deliberately no insert policy: only the ai-chat edge function (server side)
-- writes messages, so nobody can forge AI replies or skip the daily limit.
alter table public.chat_messages enable row level security;

create policy "Users read own chat" on public.chat_messages
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users delete own chat" on public.chat_messages
    for delete to authenticated using ((select auth.uid()) = user_id);
