# Solid Dance School → Cloudflare deployment guide

## Important first warning

The current repository is a Node server deployment. It contains `server.js`, which uses Node's `http` and `fs` modules. Do **not** upload the current repository directly to Cloudflare Pages and do **not** run `wrangler deploy` against the current repository yet.

Cloudflare Pages alone will serve the HTML/CSS/JavaScript but will not run the admin API. Admin login, registrations, payments, and Supabase writes would fail.

The correct target is **Cloudflare Workers with Static Assets**. Before the final deployment, the Node API must be converted to a Worker entry point named `worker.js`, and the project must include a `wrangler.jsonc` configuration file.

## Links

- GitHub repository: <https://github.com/ziedaffes23/soliddanceschool>
- Cloudflare dashboard: <https://dash.cloudflare.com/>
- Cloudflare Workers & Pages: <https://dash.cloudflare.com/?to=/:account/workers-and-pages>
- Cloudflare Workers documentation: <https://developers.cloudflare.com/workers/>
- Wrangler configuration: <https://developers.cloudflare.com/workers/wrangler/configuration/>
- Cloudflare Worker limits: <https://developers.cloudflare.com/workers/platform/limits/>
- Supabase dashboard: <https://supabase.com/dashboard/project/pnoqggozzybcxfvwjmsr>
- Supabase SQL Editor: <https://supabase.com/dashboard/project/pnoqggozzybcxfvwjmsr/sql/new>
- Google backup workbook: <https://docs.google.com/spreadsheets/d/1nH5vZ2LCX_NXj556VkO-tSeXPpg8FsPEtvklMzSHN3s/edit>

## 1. Prepare the code

Clone the repository or use the existing project folder:

```bash
git clone https://github.com/ziedaffes23/soliddanceschool.git
cd soliddanceschool
git checkout main
npm install
npm install --save-dev wrangler
```

The Cloudflare-ready version must contain these files:

```text
worker.js
wrangler.jsonc
public/                 # or another configured static-assets directory
```

The Worker must expose these same-origin routes:

```text
GET  /api/health
POST /api/login
POST /api/logout
GET  /api/session
GET  /api/data
PUT  /api/data
POST /api/public-registration
GET  /api/admin-users
POST /api/admin-users
DELETE /api/admin-users/:id
```

The frontend already calls relative `/api/...` URLs, so the Worker and static website must use the same hostname.

## 2. Create or select the Cloudflare account

Open <https://dash.cloudflare.com/> and sign in.

If you do not have an account, choose **Sign up**. A free Cloudflare account is enough for the Worker `workers.dev` deployment. A custom domain is not free unless you already own the domain; the domain registrar may charge separately.

Open **Workers & Pages** and note the account you want to use.

## 3. Authenticate Wrangler

From the project directory:

```bash
npx wrangler login
```

A browser tab opens. Select the correct Cloudflare account and authorize Wrangler.

Verify the login:

```bash
npx wrangler whoami
```

If `npx wrangler whoami` does not show your Cloudflare account, stop here and authenticate again.

## 4. Configure the Worker

The final `wrangler.jsonc` should look similar to this:

```jsonc
{
  "name": "solid-dance-school",
  "main": "worker.js",
  "compatibility_date": "2026-10-07",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".",
    "binding": "ASSETS"
  },
  "vars": {
    "SUPABASE_URL": "https://pnoqggozzybcxfvwjmsr.supabase.co"
  }
}
```

Do not put secrets in this file. Add an `.assetsignore` file so internal files are not published as public assets:

```text
.git
.env
.env.*
server.js
Dockerfile
plan.md
CLOUDFLARE_DEPLOYMENT_GUIDE.md
supabase/
node_modules/
```

## 5. Add encrypted Cloudflare secrets

From the project directory, run each command separately:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

When prompted, paste the Supabase service-role secret key. It will be encrypted by Cloudflare and will not be written to the repository.

Generate a separate session-signing secret locally:

```bash
openssl rand -hex 32
```

Copy the generated random value, then run:

```bash
npx wrangler secret put SESSION_SECRET
```

Paste the generated value when Wrangler prompts you.

Never put either secret in:

- `js/`
- HTML files
- GitHub
- `wrangler.jsonc`
- Google Sheets
- Browser JavaScript
- Chat messages

## 6. Harden Supabase before production

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/pnoqggozzybcxfvwjmsr/sql/new).

Open [`supabase/schema.sql`](supabase/schema.sql) from this repository, copy the whole file, paste it into SQL Editor, and click **Run**.

This does three important things:

1. Keeps the operational JSON document inaccessible through anonymous raw table reads.
2. Allows the protected Worker to access Supabase with the service-role key.
3. Creates `export_site_backup()` for the sanitized Google Sheets backup.

## 7. Configure Google Sheets backup

Open the [Solid Dance School backup workbook](https://docs.google.com/spreadsheets/d/1nH5vZ2LCX_NXj556VkO-tSeXPpg8FsPEtvklMzSHN3s/edit).

Choose **Extensions → Apps Script**.

Open [`supabase/google-apps-script.js`](supabase/google-apps-script.js) from the repository and paste it into `Code.gs`.

In `js/supabase-config.js`, copy only the public `anonKey` value and place it in:

```javascript
const SUPABASE_ANON_KEY = 'PASTE_THE_PUBLIC_ANON_KEY_HERE';
```

Save the Apps Script project. Run `installTrigger` once and approve Google's authorization prompt.

The script creates or refreshes:

```text
Data JSON
Registrations
Students
Leads
Payments
Sync Log
```

The service-role key must not be added to Apps Script.

## 8. Test locally before deployment

Once `worker.js` and `wrangler.jsonc` exist:

```bash
npx wrangler dev
```

Open the local URL shown by Wrangler. Test:

```bash
curl http://127.0.0.1:8787/api/health
```

Expected result:

```json
{"ok":true,"service":"solid-dance-school"}
```

Also test in the browser:

```text
/admin/login
/admin
/contact
```

Verify admin login, manager login, public registration, data persistence, and logout before deploying.

## 9. Deploy to Cloudflare

After local tests pass:

```bash
npx wrangler deploy
```

Wrangler returns a URL similar to:

```text
https://solid-dance-school.<your-subdomain>.workers.dev
```

Save that URL. It is the public Cloudflare deployment URL.

## 10. Verify the deployed Worker

Replace the hostname below with the URL returned by Wrangler:

```bash
curl https://solid-dance-school.<your-subdomain>.workers.dev/api/health
```

Then test these pages:

```text
https://solid-dance-school.<your-subdomain>.workers.dev/
https://solid-dance-school.<your-subdomain>.workers.dev/cours
https://solid-dance-school.<your-subdomain>.workers.dev/professeurs
https://solid-dance-school.<your-subdomain>.workers.dev/contact
https://solid-dance-school.<your-subdomain>.workers.dev/admin/login
```

Test all of these before changing your public domain:

- `admin` login
- `manager` login
- Add/edit/delete an admin user
- Add a class
- Add a student
- Record a payment
- Submit a public registration
- Refresh and confirm data remains
- Log out and confirm protected pages require login

## 11. Add a custom domain

In Cloudflare:

1. Open **Workers & Pages**.
2. Select `solid-dance-school`.
3. Open **Settings**.
4. Open **Domains & Routes**.
5. Choose **Add Custom Domain**.
6. Enter your domain, such as `www.soliddanceschool.com`.
7. Confirm the DNS and SSL prompts.

Cloudflare will provide HTTPS automatically. Keep the `workers.dev` URL as a fallback during the first days of testing.

## 12. What not to change

Do not replace the browser-safe Supabase config with the service-role key.

Keep this public value in browser-safe files only:

```text
SUPABASE_URL
SUPABASE_ANON_KEY for the Google backup script
```

Keep this value server-only:

```text
SUPABASE_SERVICE_ROLE_KEY
```

The current Manus deployment remains a safe fallback until the Cloudflare Worker passes all tests:

<https://solid-us4ju9rm.manus.space>
