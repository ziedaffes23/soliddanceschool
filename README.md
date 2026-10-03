# Solid Dance School

A monochrome, editorial dance school website for Sfax, Tunisia. Built with vanilla HTML, CSS and JavaScript so it can deploy directly to Netlify or Vercel without a build step.

## Install / local development

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

The public pages use structured content in `js/main.js`. The admin area (`/admin/`) is a functional local-storage control center for staging/local review: hero settings, content libraries, registration records, filters, theme, language, lightbox and client-side interactions work without a backend. For production, replace the localStorage adapter with a database/API, enable Supabase Auth (the included RLS schema requires authenticated writes), and connect the login form to a server session provider. The included login form now reads a deploy-time `js/admin-config.js` hash and refuses empty configuration; it is still only a staging boundary. Use Supabase Auth or another server-side provider for production. The frontend never contains admin credentials.

## Deployment

### Netlify
1. Import this repository.
2. Set the publish directory to `.` and leave the build command empty.
3. Deploy. `netlify.toml` is included.

### Vercel
1. Import the repository.
2. Select Other / no framework.
3. Deploy with the included `vercel.json`.

## Admin setup

Open `/admin/login.html`. The included login gate is a static integration boundary for local review; it is not production authentication. Connect it to Supabase Auth or another server-side provider before production. Do not store passwords in frontend JavaScript. Use an HTTP-only, `SameSite=None; Secure` session cookie for embedded HTTPS previews.

Admin pages: dashboard, hero, registrations, classes, schedules, teachers, events, news, videos, gallery, pages and settings. Admin CRUD data persists in the browser's `solidData` key and is rendered by the public pages.

## Hero setup

Open `/admin/hero.html` and choose Image or Video. Add an image/video URL, poster, headline beats, label, CTA and overlay. The homepage automatically switches modes. If media is missing, it preserves a monochrome motion placeholder.

## Google Sheets registrations

1. Create a Google Sheet and a tab named `Registrations` (the script can create it).
2. Open Extensions → Apps Script.
3. Paste the complete script from `api/google-apps-script.gs`.
4. Deploy as Web App, execute as you, allow access for the intended audience.
5. Copy the Web App URL.
6. Add it to the registration submit handler as `GOOGLE_SHEETS_URL` and POST the form payload as JSON.
7. Test with a real form submission.

The script validates required fields, adds a timestamp and returns JSON error/success responses. WhatsApp remains the secondary fallback.

## Content and placeholders

Only supplied information is represented. Replace these explicit placeholders when the school provides the data: `[ADDRESS]`, `[NUMBER]`, `[EMAIL]`, `[INSTAGRAM_LINK]`, `[FACEBOOK_LINK]`, `[TIKTOK_LINK]`, `[HOURS]`, `[CLASSES_LIST]`, `[PRICES_LIST]`, `[TEACHERS_LIST]`, `[EVENTS_LIST]`, `[SCHOOL_STORY]`.

Classes, teachers, schedules, events, videos and gallery records are structured in `DEFAULT_DATA` and can be managed from admin. Translations are centralized under `translations` for French (default), English and Arabic; Arabic applies RTL direction.

## Quality notes

- Mobile-first layout tested by design for 360 / 768 / 1440px.
- Keyboard-friendly controls, visible focus styles, semantic headings, form validation and reduced-motion support.
- Theme toggle uses genuine black/white inversion and persists in localStorage.
- Gallery has a keyboard-close lightbox; class filters update instantly; registration produces records; schedule/pricing surfaces are ready for supplied data.
- `sitemap.xml`, `robots.txt`, JSON-LD-ready structure, Open Graph metadata, `manifest.json`, Netlify and Vercel declarations are included.

### Admin auth configuration

`js/admin-config.js` intentionally ships with empty values. Set a SHA-256 password hash only in a private staging deployment; do not commit real credentials. For production, replace `setupLogin()` with Supabase Auth and server-side authorization.

### Admin roles

The staging login supports two roles: `admin` has full dashboard access; `manager` is limited to Dashboard, Registrations, Leads, Students/class assignment, and Payments. This restriction is enforced on navigation and direct route access.
