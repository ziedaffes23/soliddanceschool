# Email notifications — setup

What it does
- **Owner alerts:** an email for every new public registration and every payment recorded as paid.
- **Parent reminders:** every day at 08:00 (Tunisia) each parent whose payment is due **tomorrow** gets an email (sent once per due date). The owner gets a daily summary, including students who have no email address.

One-time setup (5 minutes, free)
1. Create a free account at https://www.brevo.com (300 emails/day free).
2. Brevo → **Senders, Domains & Dedicated IPs → Senders → Add a sender**: use the school's Gmail address, click the confirmation link Brevo emails you.
3. Brevo → **SMTP & API → API Keys → Generate a new API key**. Copy it.
4. Cloudflare → Workers & Pages → solid-dance-school → **Settings → Variables and Secrets**, add:
   - `BREVO_API_KEY` (Secret) = the key
   - `MAIL_FROM` (Text) = the verified sender address
   - `OWNER_EMAIL` (Text, optional) = where alerts go (otherwise set in Admin → Settings → Email notifications)
5. Admin → Settings → Email notifications → save the owner email → **Send a test email**.

Notes
- Parent reminders use the parent email from the registration (father's email), then the student email.
- The daily job is a Cloudflare Cron Trigger defined in `wrangler.toml` (`0 7 * * *` UTC).
- Admin → Payments shows who must pay (today and tomorrow first, then overdue, then upcoming) and has **Send reminders now** and a per-student **Remind** button.
