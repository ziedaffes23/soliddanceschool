# Solid Dance School production setup

The website now uses a protected Node server with Supabase as its source of truth. The browser never receives the Supabase `service_role` key.

## One-time Supabase SQL

Open the Supabase project, go to **SQL Editor**, and run [`supabase/schema.sql`](supabase/schema.sql). This keeps `site_data` private from anonymous table reads and creates the sanitized `export_site_backup()` RPC used by Google Sheets.

## Runtime secret

The project secret `SUPABASE_SERVICE_ROLE_KEY` is stored through Manus protected configuration. Never commit it, place it in `js/`, or paste it into Google Apps Script.

## Accounts

The server migrates the existing `admin` and `manager` staging hashes on the first successful login and upgrades them to salted PBKDF2 hashes. The admin can add, edit, and remove accounts from **Settings → Admin users**. The manager remains limited to operational sections. Passwords are never returned to the browser or sheet backup.

## Google Sheets backup

Follow [`supabase/google-sheets-setup.md`](supabase/google-sheets-setup.md). Apps Script calls the sanitized RPC every 15 minutes and refreshes the complete operational backup tabs. Supabase remains the only writeable source of truth.
