# Solid Dance School — secure persistence and backup

## Implementation approach

- Keep Supabase as the source of truth for the existing `site_data` JSON document.
- Add a small Node server that serves the current static pages and exposes same-origin API routes.
- Keep the Supabase service-role key server-only through the protected project secret; never expose it to browser JavaScript or Google Sheets.
- Replace the browser-only SHA-256 admin gate with server-side username/password verification. Existing staging SHA-256 hashes are accepted once and upgraded to salted PBKDF2 hashes after a successful login.
- Store admin accounts inside the protected `site_data` document under a server-only `_adminUsers` key, and never return that key through public APIs or the spreadsheet backup.
- Public pages receive only public content. Public registrations use a dedicated API route; admin reads/writes require the signed, HttpOnly `solid_session` cookie.
- Google Sheets is a one-way backup/reporting copy. Apps Script calls a restricted Supabase RPC that returns the complete operational dataset without `_adminUsers`, refreshes normalized tabs, and records sync status.

## Project structure

- `server.js`: static serving, session cookies, Supabase REST access, public registration, admin data and admin-user APIs.
- `Dockerfile` / `package.json`: production container runtime.
- `js/supabase.js`: browser adapter for `/api/data`, `/api/public-registration`, and session-aware saves.
- `js/admin.js`: server-backed admin login and admin-user CRUD UI.
- `supabase/schema.sql`: RLS hardening and sanitized backup RPC.
- `supabase/google-apps-script.js`: scheduled one-way Sheets backup.
- `supabase/google-sheets-setup.md`: one-time Sheets activation instructions.

## Design and interaction decisions

- **Design movement:** editorial operations desk: calm, high-contrast, and direct.
- **Core principles:** data safety first, least-privilege exposure, reversible admin actions, and visible status.
- **Color philosophy:** retain the Scarlet/Ink/Paper identity so security controls feel native to Solid rather than bolted on.
- **Layout paradigm:** use the existing task-oriented admin shell; no new dashboard complexity.
- **Signature elements:** sharp dividers, compact status labels, and the existing scarlet action buttons.
- **Interaction philosophy:** public browsing remains frictionless; only privileged operations require a server session.
- **Animation:** preserve existing restrained transitions; no motion is added to sensitive controls.
- **Typography:** preserve the existing condensed editorial display face for headings and readable sans-serif body copy for forms/tables.
- **Brand essence:** a focused dance-school operations system for staff who need fast, reliable control of students, classes, and payments; precise, energetic, trustworthy.
- **Brand voice:** concise and operational. Examples: “Your records stay in Supabase.” and “Google Sheets is a backup copy—not the live system.”
- **Wordmark & logo:** preserve the existing Solid mark and compact operations-desk lockup.
- **Signature brand color:** Scarlet, used for authenticated actions and attention states.

## Material constraints

- The production server requires `SUPABASE_SERVICE_ROLE_KEY` as a protected runtime secret.
- The SQL in `supabase/schema.sql` must be run once in the Supabase SQL Editor to remove anonymous raw reads and create the sanitized backup RPC.
- The existing workbook remains the destination; Apps Script authorization is a one-time Google-side action.
