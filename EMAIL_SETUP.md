# Email notifications — setup

What it does
- **Owner alerts:** an email for every new public registration and every payment recorded as paid.
- **Parent reminders:** every day at 08:00 (Tunisia) each parent whose payment is due **tomorrow** gets an email (sent once per due date). The owner gets a daily summary, including students with no email address.

## Option A — send from your own Gmail (Google Apps Script) — free, no extra account
Emails leave from whichever Google account deploys the script (use the school's/owner's Gmail so parents see that address). Limit: ~100 emails/day on free Gmail.

1. Go to https://script.google.com → **New project**. Delete the sample code and paste the contents of `google-apps-script/Mail.gs`.
2. Replace `CHANGE_THIS_TO_A_LONG_RANDOM_PHRASE` with a long random phrase (this is the secret).
3. Select the function `authorize` → **Run** → accept the Google permissions (Advanced → Go to project).
4. **Deploy → New deployment → ⚙ Web app** → Execute as: **Me** · Who has access: **Anyone** → Deploy. Copy the **Web app URL** (ends with `/exec`).
5. Cloudflare → Workers & Pages → solid-dance-school → **Settings → Variables and Secrets**:
   - `APPS_SCRIPT_URL` = the Web app URL
   - `APPS_SCRIPT_SECRET` (Secret) = the same random phrase
   - `OWNER_EMAIL` (optional) = where alerts go
6. Admin → Settings → Email notifications → save the owner email → **Send a test email**.

(If you change the script later, use Deploy → Manage deployments → Edit → New version, so the URL stays the same.)

## Option B — Brevo (300 emails/day free)
Create a Brevo account, verify a sender address, create an API key, then set `BREVO_API_KEY` and `MAIL_FROM` in Cloudflare.

Notes
- Parent reminders use the parent email from the registration (father's email), then the student email.
- The daily job is a Cloudflare Cron Trigger in `wrangler.toml` (`0 7 * * *` UTC).
- Admin → Payments lists who must pay (today and tomorrow first), with **Send reminders now** and a per-student **Remind** button.
