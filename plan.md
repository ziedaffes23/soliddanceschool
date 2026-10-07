# Solid Dance School — CY-Grotesk-inspired editorial redesign

## Implementation approach

- Preserve the current public routes, Supabase persistence, server-backed admin authentication, payment workflows, registration behavior, and multilingual support.
- Add a public-only visual layer in `css/refined.css`; do not alter admin operations logic or data contracts.
- Use the existing page templates and data-driven rendering in `js/main.js`, `js/teachers.js`, and related scripts so classes, teachers, schedules, gallery, videos, events, and contact content remain dynamic.
- Keep the site deployable through the existing Manus server and checkpoint/publish workflow.

## Project structure

- `index.html` and public route HTML files: semantic shells for the public experience.
- `css/main.css`: base tokens and shared components.
- `css/refined.css`: current responsive editorial system plus the new CY-Grotesk-inspired public layer.
- `js/main.js`, `js/teachers.js`: public translations, Supabase-backed content rendering, filters, and interactions.
- `js/ops.js`, `js/admin.js`, `admin/`: protected operations interface; unchanged by this redesign.
- `server.js`: same-origin static serving and protected Supabase API.
- `manus-routes.json`: complete public and admin route manifest.

## Design decisions

- **Design movement:** contemporary Swiss editorial typography crossed with the expressive, sharp-spurred grotesk character of the supplied CY GROTESK STD reference.
- **Core principles:** oversized type as architecture, hard-edged color blocking, disciplined asymmetry, and motion-led hierarchy.
- **Color philosophy:** preserve Solid’s Scarlet/Ink/Paper identity, but sharpen the contrast to near-black ink, warm paper, and a single high-energy scarlet signal. Red marks action, movement, and the current page rather than decorating every surface.
- **Layout paradigm:** a poster-like vertical sequence with oversized page numbers, offset blocks, diagonal cuts, ruled metadata, and edge-to-edge hero bands instead of centered generic cards.
- **Signature elements:** slashed scarlet bars, outlined oversized numerals, and micro-labels that read like a type specimen or studio program.
- **Interaction philosophy:** hover states behave like a print proof being pulled forward: cards shift a few pixels, scarlet bars extend, and buttons invert sharply. Touch layouts remain single-column and scroll-safe.
- **Animation:** use restrained reveal, translate, and line-extension transitions; respect `prefers-reduced-motion`; avoid distracting motion in forms and admin operations.
- **Typography system:** use a heavy condensed display stack with `Bebas Neue`, `Impact`, `Arial Narrow`, and a geometric sans body stack. Display headings are uppercase, tightly tracked, and allowed to collide with the grid; metadata uses a monospace face with wide tracking.
- **Brand essence:** a Sfax dance school for people who want disciplined practice with a fearless visual identity; kinetic, direct, exact.
- **Brand voice:** concise, energetic, and physical. Examples: “Find your line. Break your pattern.” and “Practice with intent.”
- **Wordmark & logo:** keep the supplied Solid Dance School mark, placing it inside a narrow scarlet registration strip or clean ink header so the logo stays recognizable while the page system carries the expressive typography.
- **Signature brand color:** Solid Scarlet `#e52d48`, used as the single unmistakable signal color.

## Material constraints

- The redesign must not expose the Supabase service-role key or alter the protected API.
- Existing content, translations, public registration, and admin operations must continue working.
- The public stylesheet must remain responsive at the existing 1100px, 900px, 700px, and mobile breakpoints.
- The current route manifest and durable published URL remain valid.
