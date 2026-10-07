# Solid Dance School: Supabase → Google Sheets backup

The existing workbook is the destination for this backup:

<https://docs.google.com/spreadsheets/d/1nH5vZ2LCX_NXj556VkO-tSeXPpg8FsPEtvklMzSHN3s/edit>

## One-time Supabase step

Open the Supabase project, go to **SQL Editor**, and run [`schema.sql`](./schema.sql). It keeps Supabase as the source of truth, removes anonymous raw reads of student/payment data, and creates the sanitized `export_site_backup()` RPC. Do not put the service-role key into Apps Script.

## One-time Google Sheets step

Open the workbook, choose **Extensions → Apps Script**, replace `Code.gs` with [`google-apps-script.js`](./google-apps-script.js), and replace only `PASTE_THE_PUBLIC_ANON_KEY_HERE` with the browser-safe anon/public key from `js/supabase-config.js`. Save the project, run **installTrigger**, review Google's authorization prompts, and choose **Allow**. The script creates any missing tabs and syncs immediately, then repeats every 15 minutes.

The workbook contains or creates `Data JSON`, `Registrations`, `Students`, `Leads`, `Payments`, and `Sync Log`. `Data JSON` contains the complete sanitized operational backup; admin password hashes are excluded. Google Sheets is one-way backup/reporting and never writes changes back to the website.
