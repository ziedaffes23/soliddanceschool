# Deploying to Cloudflare (Workers + static assets)

`wrangler.toml` deploys one Worker (`solid-dance-school`): `/api/*` runs the shared API core (`api/_core.js`, backed by Supabase), everything else is served from `dist/` (built by `scripts/build-cloudflare.js`).

## One-time secrets
```
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SESSION_SECRET        # any long random string (recommended)
```
Optional plain vars: `SUPABASE_URL`, `ADMIN_INITIAL_PASSWORD`.

## Deploy
```
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
```
or connect the repo under Workers & Pages → solid-dance-school → Settings → Builds (build: `node scripts/build-cloudflare.js`, deploy: `npx wrangler deploy`).

Default `admin` / `manager` accounts must set a new password on first login.
The legacy `SolidDataStore` Durable Object class is kept as a stub so old data is never deleted.
