-- Solid Dance School static-site persistence
-- Run this once in Supabase Dashboard -> SQL Editor.
-- The current site uses a browser-only admin gate, so these policies allow the
-- anon client to read/write the single site document. For production PII,
-- replace them with Supabase Auth + authenticated policies before launch.

create table if not exists public.site_data (
  id text primary key check (id = 'default'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_data enable row level security;

drop policy if exists "Solid site data read" on public.site_data;
drop policy if exists "Solid site data insert" on public.site_data;
drop policy if exists "Solid site data update" on public.site_data;

create policy "Solid site data read"
on public.site_data for select
to anon, authenticated
using (id = 'default');

create policy "Solid site data insert"
on public.site_data for insert
to anon, authenticated
with check (id = 'default');

create policy "Solid site data update"
on public.site_data for update
to anon, authenticated
using (id = 'default')
with check (id = 'default');

grant select, insert, update on public.site_data to anon, authenticated;
