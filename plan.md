# Solid Dance School — CY-Grotesk-inspired editorial rebuild

## Current direction

This pass is a full public-site art direction rather than another incremental CSS patch. The supplied CY GROTESK STD reference is being treated as a visual language: oversized grotesk forms, strict black/white space, modular blocks, tiny technical labels, high-contrast hierarchy, and restrained accent color. The existing Solid Scarlet / Ink / Paper palette remains the brand layer.

## Implementation approach

- Preserve the current public routes, Supabase persistence, server-backed admin authentication, payment workflows, registration behavior, and FR/EN/AR support.
- Add `css/editorial-v2.css` as a clear public-only design system layered after the legacy stylesheet. It governs the new header, type-specimen page heroes, poster cards, schedule board, gallery, video, contact, footer, and responsive behavior.
- Rebuild the homepage composition with a split editorial hero, manifesto cards, a live data-driven programme index, and a red call-to-action field. The dynamic class programme is rendered from the same editable website data used by the admin.
- Keep `js/main.js` responsible for translations, Supabase-backed content, filters, registration, and the homepage programme rendering. Do not alter `js/ops.js`, `js/admin.js`, payment calculations, or protected API contracts.
- Cache-bust the new public stylesheet on every public route and publish through the existing Manus server/checkpoint workflow.

## Design system

- **Design movement:** contemporary Swiss type specimen crossed with the expressive, sharp-spurred grotesk character of the supplied CY GROTESK STD reference.
- **Core principles:** oversized type as architecture, hard-edged color blocking, disciplined asymmetry, and motion-led hierarchy.
- **Color philosophy:** near-black Ink creates the stage, warm Paper creates the editorial field, and Solid Scarlet marks action, movement, and the current path.
- **Layout paradigm:** a poster-like sequence of full-width fields, split rails, index numbers, ruled metadata, and program rows instead of generic centered marketing cards.
- **Signature elements:** red registration bars, outlined oversized numerals, diagonal/crossed micro-marks, and type-specimen labels.
- **Interaction philosophy:** links and cards move like a printed proof being pulled forward; buttons invert sharply; the mobile menu becomes a deliberate black/red panel.
- **Animation:** restrained reveal, translate, hover-lift, and line-extension transitions. All motion is disabled or simplified under `prefers-reduced-motion`.
- **Typography system:** `Barlow Condensed` / `Bebas Neue` / `Arial Narrow` for display, `Inter` for readable copy, and `Space Mono` for technical labels and metadata. Headlines are uppercase, tightly tracked, and allowed to collide with the grid.
- **Brand essence:** a Sfax dance school for people who want disciplined practice with a fearless visual identity; kinetic, direct, exact.
- **Brand voice:** concise, physical, and confident. Example lines: “Find your line. Build your presence.” and “Your next practice is already waiting.”
- **Wordmark & logo:** keep the supplied Solid Dance School mark, treating it like a registration stamp inside the fixed header rather than a generic navbar logo.
- **Signature brand color:** Solid Scarlet `#e52d48`.

## Project structure

- Public HTML routes: semantic page shells and the rebuilt homepage.
- `css/main.css`: base tokens and legacy components.
- `css/refined.css`: existing responsive/editorial layer retained for compatibility.
- `css/editorial-v2.css`: the new public design system.
- `js/main.js`: translations, public data rendering, filters, registration, and homepage programme rows.
- `js/ops.js`, `js/admin.js`, `admin/`: protected operations interface, unchanged.
- `server.js`: same-origin static serving and protected Supabase API.
- `manus-routes.json`: complete public and admin route manifest.

## Constraints

The redesign must not expose the Supabase service-role key, change payment allocation logic, break admin access, remove public registration, or introduce horizontal overflow on phones. It must remain deployable through the current server runtime and keep the canonical live URL stable.
