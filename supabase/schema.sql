-- Solid Dance School production persistence hardening.
-- Run once in the Supabase SQL Editor after confirming the existing site_data row.
-- This removes anonymous raw reads of the operational JSON document. The server
-- uses the service-role key at runtime; Google Sheets uses the sanitized RPC.

create table if not exists public.site_data (
  id text primary key check (id = 'default'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_data enable row level security;
drop policy if exists "Solid site data read" on public.site_data;
drop policy if exists "Solid site data insert" on public.site_data;
drop policy if exists "Solid site data update" on public.site_data;
revoke all on table public.site_data from anon, authenticated;

create or replace function public.export_site_backup()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce((select data from public.site_data where id = 'default'), '{}'::jsonb) - '_adminUsers';
$$;
revoke all on function public.export_site_backup() from public;
grant execute on function public.export_site_backup() to anon, authenticated;
