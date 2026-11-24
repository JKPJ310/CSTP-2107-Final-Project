-- Equilibria: usernames, so people can log in with a username and password.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Passwords are never stored here: Supabase Auth keeps them as bcrypt hashes in auth.users.

alter table public.profiles
    add column username text check (username ~ '^[A-Za-z0-9_]{3,20}$');

-- One account per username, ignoring capital letters ("Sam" and "sam" are the same name)
create unique index profiles_username_key on public.profiles (lower(username));

-- Lets the sign-up form say "that username is taken" before the account is made.
-- Answers only yes or no, so it never reveals whose account a username belongs to.
create function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
    select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
