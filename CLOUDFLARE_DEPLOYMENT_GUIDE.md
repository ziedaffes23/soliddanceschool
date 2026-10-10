# Deploying to Cloudflare Pages

Static site + API run on Cloudflare Pages (the API is `functions/api/[[path]].js`, which wraps the shared `api/_core.js`).

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `ziedaffes23/soliddanceschool`.
2. Production branch: `redesign/unified-design-system-and-admin-cms` (or `main` after merging).
3. Build command: `node scripts/build-cloudflare.js` — Build output directory: `dist`.
4. Settings → Variables and Secrets (Production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret), optional `SESSION_SECRET` (secret), `ADMIN_INITIAL_PASSWORD`.
5. Compatibility flag `nodejs_compat` is set in `wrangler.toml`.
6. Deploy, then open `/admin/login` — default accounts must set a new password on first login.

CLI alternative: `node scripts/build-cloudflare.js && npx wrangler pages deploy dist --project-name soliddanceschool`.
