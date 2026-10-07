# Solid Dance School — Complete CY Grotesk art-direction rebuild

## Purpose

This is a visual architecture replacement, not a theme pass. The current public and admin interfaces are being re-authored as a brutalist editorial dance-school system grounded in the supplied CY GROTESK references.

## Design direction

The website belongs to a world of **dance, street culture, fashion, music, movement, and cultural poster design**. Black `#050505`, fluorescent lime `#B6FF00`, and white `#FFFFFF` alternate as full fields; no beige, brown, pastel, blue, purple, orange, pink, or generic gradients are introduced. Lime is intentionally visible throughout the experience as a major structural color for poster sections, navigation states, borders, buttons, numbers, image treatments, and hover interactions.

The display system uses the closest available legitimate local/web font stack to CY GROTESK (`Bebas Neue`, `Barlow Condensed`, `Space Grotesk`) with different width/weight roles: massive display faces for names and titles, mono metadata for technical labels, and readable body copy. If exact CY GROTESK files are later supplied, they can be dropped into `fonts/` and assigned without changing the layout system.

The layout paradigm is an asymmetrical editorial index rather than a repeated centered card grid. Large type breaks containers, route heroes behave like posters, classes/events/news use flowing index rows, teachers become an artist directory with portraits and oversized names, schedule becomes a brutalist timetable, gallery becomes an irregular archive, and contact becomes a typographic registration spread. Hand-drawn-feeling marks are created with imperfect borders, rotated rules, loops, cross-outs, arrows, and technical annotations.

Interaction is typographic and physical: hard rectangular buttons, lime active states, sharp hover inversions, full-screen lime/black mobile navigation, image grayscale treatment, and small motion cues. Existing intro, route transitions, filters, lightbox, calendar/My Week actions, registration, hero CMS, Supabase persistence, authentication, payment operations, translations, RTL, and accessibility hooks remain intact.

## Implementation

- `css/art-direction.css` is loaded after the existing public/admin styles on every route. It owns the full visual architecture while the prior styles remain as compatibility foundations.
- Existing HTML data hooks are preserved so dynamic `main.js`, `ops.js`, `admin.js`, Supabase, payment, registration, scheduling, gallery, video, and CMS behavior do not need to be duplicated or weakened.
- Public pages are transformed by route-scoped selectors: homepage live-poster hero; courses editorial index; teachers cast directory; schedule timetable; pricing poster; events/news cultural posters; videos archive; gallery photography archive; contact registration spread; and shared lime/black CTA fields.
- The same art direction is applied to the admin shell with black/lime navigation, brutalist tables, oversized section titles, hard controls, and mobile-safe operations panels. Usability remains the priority for registrations, leads, students, payments, classes, schedules, teachers, events, news, videos, gallery, hero controls, settings, and admin accounts.
- The route manifest, server runtime, Supabase credentials, Google Sheets backup bridge, and deployment contract are preserved.

## Project structure

- `index.html`, public route HTML: semantic shells and stable data hooks.
- `css/main.css`, `css/refined.css`, `css/editorial-v2.css`: legacy compatibility and prior public foundations.
- `css/art-direction.css`: complete new black/lime/white art-direction layer for public and admin routes.
- `js/main.js`: public CMS rendering, translations, registration, classes, schedule, gallery, videos, hero media, pricing, and route behavior.
- `js/ops.js`, `js/admin.js`, `admin/`: protected operations and CRUD UI.
- `server.js`, `supabase/`: protected persistence, authentication, backup RPC and server runtime.

## Brand essence

Solid is a Sfax dance school for people who want disciplined practice with a fearless point of view. It is **raw, exact, kinetic**. Voice examples: “Find your line. Build your presence.” and “Your next practice is already waiting.” The wordmark remains a registration-stamp-like mark in the fixed header; the ownable signature color is fluorescent lime.

## Non-negotiables

Do not break registration, Interested/Not Interested leads, students, payment tracking, installments, classes, teachers, schedules, events, news, videos, gallery, hero CMS video/image selection, Google Sheets backup, WhatsApp, pricing calculator, calendar export, French/English/Arabic RTL, authentication, SEO, accessibility, or admin account permissions. The admin must still control hero video/image, poster/mobile image, title, subtitle, CTA, active state, and publication state.
