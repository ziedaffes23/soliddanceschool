# Solid Dance School — Website and Admin Redesign Plan

## Goal

Redesign the complete Solid Dance School website and admin dashboard into a calmer, clearer product while preserving the existing public pages, registrations, student/class assignment, payments, facilité fiches, notifications, user roles, multilingual support, video management, and CSV/print workflows.

## Design direction

### Design movement

**Contemporary editorial studio / Swiss wayfinding**: expressive movement-led typography and imagery on the public site, paired with a quiet, structured operations interface for staff.

### Core principles

1. **One visual system** — remove the accumulated competing CSS layers and establish one coherent token set.
2. **Clear hierarchy** — every page gets one primary task, one prominent heading, and a small number of secondary actions.
3. **Progressive disclosure** — show the most important information first; move advanced actions into contextual menus, drawers, or modals.
4. **Fast recognition** — use consistent status colors, labels, spacing, and action placement so staff do not need to relearn each page.

### Color philosophy

The public site uses a deep ink background, warm paper surfaces, and one ownable coral-red accent to express energy, performance, and physical movement. The admin uses a pale blue-gray workspace, navy navigation, and restrained semantic colors: blue for primary actions, coral for urgent actions, mint for paid/complete, yellow for attention, and red only for destructive actions.

### Layout paradigm

The public site uses a **vertical editorial runway**: full-width movement-led hero, offset content bands, large section markers, and deliberate asymmetry. The admin uses a **two-level operations cockpit**: compact sidebar or mobile rail, then a page workspace with a single page header, summary strip, filters, and one main content surface.

### Signature elements

- Numbered section markers and thin accent rules on public pages.
- Compact status pills with one meaning per color across admin and public content.
- A persistent “next action” area: public CTA on visitor pages and contextual primary action on admin pages.

### Interaction and animation

Public interactions use short 160–240ms fades, slide-up reveals, and restrained hover movement. Page transitions should never delay navigation. Admin interactions use minimal motion: selected navigation states, drawer/modal entry, toast confirmation, and table row feedback. Respect `prefers-reduced-motion` everywhere.

### Typography system

Keep the current display face for large movement-led headlines, but limit it to page titles, hero headlines, and major numeric KPIs. Use a clean system sans for body copy and controls, and a compact monospace face only for metadata, labels, dates, IDs, and status text.

### Brand essence

**Solid Dance School turns disciplined movement into confidence, connection, and performance for students and families in Sfax.**

Personality: **direct, energetic, welcoming**.

### Brand voice

Headlines are short and physical. CTAs describe the next action rather than generic conversion language.

- “Find your rhythm.”
- “Keep the movement going.”

### Wordmark and logo

Retain the existing Solid wordmark asset, but standardize its treatment: coral/white lockup for dark public surfaces, dark wordmark on white for light admin surfaces, consistent aspect ratio, and no repeated competing logo treatments.

### Signature brand color

**Solid Coral `#EF7867`** — the recognizable accent for calls to action, active states, and movement moments.

## Public website changes

- Consolidate the current public CSS layers into a single coherent public token layer while preserving responsive behavior.
- Redesign the header so primary navigation is easier to scan, with Videos included consistently in FR/EN/AR.
- Make the homepage structure explicit: hero, classes, school story, next event, gallery/video highlights, and one final CTA.
- Use reusable section headers and consistent content widths across all public routes.
- Improve empty states for videos, news, events, and gallery so they feel intentional rather than like missing content.
- Keep all three languages and RTL support, but move text labels into a clearer translation map.
- Keep existing admin-managed content bindings and existing routes.

## Admin dashboard changes

### Simplified navigation

Replace the long repeated navigation with four task groups:

1. **Today** — Dashboard, Registrations, Leads.
2. **People** — Students & Classes, Teachers.
3. **Money** — Payments, Facilité plans, Packs.
4. **Content** — Homepage, Pages, Events, News, Videos, Gallery.
5. **Settings** — Staff accounts, language, site settings.

The manager role sees only Today, People, and Money actions allowed by the existing permission rules. Admin retains full access.

### Dashboard

- A compact “Needs attention” strip for unpaid/partially paid plans, new registrations, and unassigned students.
- Four summary cards only: New registrations, Active students, Outstanding amount, Upcoming payments.
- One recent activity table and one notification panel.
- Remove duplicated quick-action/navigation blocks.

### Operations pages

- Standardize every page to: title + one sentence, primary action, filter row, main table/card surface.
- Move secondary actions such as export, print, edit, and delete into consistent action groups.
- Use drawers/modals for detailed student profiles, payment plans, and fiche editing.
- Keep class filtering, per-class tables, CSV export, payment notifications, monthly paid/not-paid status, and fiche printing.
- Add clear empty, loading, and saved states.

### Settings and accounts

- Group staff accounts, language, image preference, and site settings into separate cards.
- Keep username/password editing and role restrictions, but add clearer warnings and confirmation copy.

## Project structure

- `index.html`, route HTML files: page structure and content slots only.
- `css/main.css`: base/public tokens and shared public layout.
- `css/refined.css`: will be reduced and reorganized into public/admin sections rather than layered overrides.
- `js/main.js`: public rendering, translation, motion, and shared content helpers.
- `js/ops.js`: admin operations rendering, filters, payments, fiche, notifications, and permissions.
- `js/admin.js`: authentication, admin shell, settings, staff accounts, and role-aware navigation.
- `js/admin-config.js`: configured seed accounts only; no plaintext passwords.
- `assets/`: existing logo and supplied visual assets.
- `manus-routes.json`: kept synchronized with all public and admin routes.

## Required behavior to preserve

- Public registration and Supabase/local persistence.
- Admin and manager login, role restrictions, username/password management.
- Student-to-class assignment, class filtering, class CSV exports.
- Payments, payment notifications, facility plans, monthly Paid/Not paid tracking, and printable fiches.
- Public/admin videos, gallery, events, news, homepage, and page content management.
- FR/EN/AR language switching, including Arabic RTL.
- Responsive desktop/tablet/mobile layouts.

## Implementation sequence

1. Reorganize tokens and shared layout primitives.
2. Redesign public header, hero, section surfaces, cards, footer, and route templates.
3. Redesign admin shell and navigation hierarchy.
4. Simplify dashboard information architecture.
5. Standardize operations tables, filters, cards, modals, and status styles.
6. Reconnect and verify existing feature workflows.
7. Verify all route copies, language switching, role visibility, JavaScript syntax, and live Preview.
