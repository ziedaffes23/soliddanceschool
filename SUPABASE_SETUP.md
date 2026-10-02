# Supabase setup

The website is configured for the Supabase project supplied for Solid Dance School.

## One-time setup

1. Open the Supabase dashboard for the project.
2. Open **SQL Editor**.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Confirm the `public.site_data` table exists.

The static client uses the browser-safe `anon` key in `js/supabase-config.js`; never replace it with a `service_role` key.

## How synchronization works

- The existing browser `localStorage` behavior remains as an offline fallback.
- On page load, the app restores the shared `solidData` document from Supabase when available.
- Admin saves write locally immediately and then upsert the same document to Supabase.
- The database row is `site_data.id = 'default'`.

## Deploying on another server

The repository contains the client configuration, schema, and `.env.example`, so no source edit is required for the same Supabase project. If a host injects environment variables during a build, use `SUPABASE_URL` and `SUPABASE_ANON_KEY` and generate the equivalent `window.SOLID_SUPABASE_CONFIG` object.

## Security note

This is a static site with a browser-only admin login. The included SQL policies permit the anon browser client to read and write the single JSON document so the current admin experience can synchronize. That is not suitable for protecting personal registration data against a determined visitor. Before using this for sensitive production data, add Supabase Auth and replace the anon write/read policies with authenticated, role-based policies or move writes behind an Edge Function.
