# Solid Dance School: Supabase → Google Sheets backup

## Spreadsheet

[Solid Dance School — Supabase Backup](https://docs.google.com/spreadsheets/d/1nH5vZ2LCX_NXj556VkO-tSeXPpg8FsPEtvklMzSHN3s/edit)

The workbook contains these tabs:

- Registrations
- Students
- Leads
- Payments
- Sync Log

## One-time activation

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Open [`google-apps-script.js`](./google-apps-script.js) from this repository and copy its contents into `Code.gs`.
4. Replace `PASTE_THE_PUBLIC_ANON_KEY_HERE` with the Supabase **anon/public** key from `js/supabase-config.js`.
5. Click **Save**.
6. Run the function **`installTrigger`** once.
7. Accept Google's authorization prompts.
8. Return to the spreadsheet and refresh it.

The script will then:

- Read the `default` record from Supabase's `site_data` table.
- Refresh the Registrations, Students, Leads, and Payments tabs.
- Write a timestamp and result to Sync Log.
- Repeat automatically every 15 minutes.

Supabase remains the source of truth. Google Sheets is a one-way backup/reporting copy and does not write changes back to the website.

## Security

The sheet contains personal information from registration forms. Share the spreadsheet only with authorized school staff. Do not use a Supabase `service_role` key in Apps Script; use only the public anon key.
