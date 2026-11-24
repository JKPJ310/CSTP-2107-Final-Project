-- Equilibria: comfort kit. One song (a YouTube link) and up to 2 photos per user.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Needs 001_profiles.sql first (it creates the set_updated_at() function).

create table public.comfort_items (
    id uuid primary key default gen_random_uuid(),
    -- Filled in automatically from the login, so the app never sends a user id
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    kind text not null check (kind in ('song', 'photo')),
    -- Song name or photo caption, both optional
    title text check (char_length(title) <= 80),
    -- Songs: a YouTube link
    url text check (url ~* '^https://(www\.|m\.|music\.)?(youtube\.com|youtu\.be)/'),
    -- Photos: the file's path in the private "comfort-photos" bucket
    photo_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (kind = 'song' and url is not null and photo_path is null)
        or (kind = 'photo' and photo_path is not null and url is null)
    )
);

create index comfort_items_user_idx on public.comfort_items (user_id, created_at);

-- One song per user
create unique index comfort_items_one_song on public.comfort_items (user_id) where kind = 'song';

create trigger comfort_items_set_updated_at
before update on public.comfort_items
for each row execute function public.set_updated_at();

-- At most 2 photos per user, checked on the server too
create function public.enforce_photo_limit() returns trigger
language plpgsql as $$
begin
    if new.kind = 'photo'
        and (select count(*) from public.comfort_items where user_id = new.user_id and kind = 'photo') >= 2 then
        raise exception 'photo_limit' using errcode = 'P0001';
    end if;
    return new;
end;
$$;

create trigger comfort_items_enforce_photo_limit
before insert on public.comfort_items
for each row execute function public.enforce_photo_limit();

-- Row Level Security: each user can only see and change their own comfort kit.
alter table public.comfort_items enable row level security;

create policy "Users read own comfort kit" on public.comfort_items
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add to own comfort kit" on public.comfort_items
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users edit own comfort kit" on public.comfort_items
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users remove from own comfort kit" on public.comfort_items
    for delete to authenticated using ((select auth.uid()) = user_id);

-- Private bucket for comfort photos. Files live at comfort-photos/<user id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comfort-photos', 'comfort-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users read own comfort photos" on storage.objects
    for select to authenticated
    using (bucket_id = 'comfort-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload own comfort photos" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'comfort-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own comfort photos" on storage.objects
    for delete to authenticated
    using (bucket_id = 'comfort-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
