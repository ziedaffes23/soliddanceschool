-- Solid Dance School persistence.
-- Public pages may read published site data. Admin writes require Supabase Auth.
-- Do not store student PII in a browser-only document for production; migrate
-- registrations to a dedicated table with least-privilege policies before launch.

create table if not exists public.site_data (
  id text primary key check (id = 'default'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_data enable row level security;
drop policy if exists "Solid site data read" on public.site_data;
drop policy if exists "Solid site data insert" on public.site_data;
drop policy if exists "Solid site data update" on public.site_data;

create policy "Solid site data read" on public.site_data for select
  to anon, authenticated using (id = 'default');
create policy "Solid site data insert" on public.site_data for insert
  to authenticated with check (id = 'default');
create policy "Solid site data update" on public.site_data for update
  to authenticated using (id = 'default') with check (id = 'default');

grant select on public.site_data to anon, authenticated;
grant insert, update on public.site_data to authenticated;
