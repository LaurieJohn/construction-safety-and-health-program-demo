# CSHP Demo

A front-end-only demonstration of an online **Construction Safety and Health
Program (CSHP)** system — the register of Safety Officers and First Aiders, the
establishments registered under Rule 1020, and the programmes that move from
review to approval.

Built by **LaurieJohn** with Nuxt 3, Vue 3 and Pinia.

> Every name, company, office, place and figure in it is invented, and no
> organisation's name, logo or branding appears anywhere in it. It is a
> portfolio piece, not any agency's system, and it holds no real data.

It is a Nuxt 3 single-page application. There is no server, no database and no
API: every page is rendered in the browser from the static data under `data/`,
which is what makes it deployable to Vercel as a plain static bundle.

## Running it

```bash
npm install
npm run dev
```

The app is served at <http://localhost:3000>.

```bash
npm run build      # production bundle
npm run generate   # fully static output, for a static host
npm run preview    # serve the production bundle locally
npx nuxt typecheck # type-check every page, component and store
```

## What is in it

| Area | Route | What it does |
| --- | --- | --- |
| Dashboard | `/dashboard` | The queues, the registers and what was filed most recently |
| Safety Officer & First Aider | `/safety-officers`, `/safety-officers/register` | The register of accredited personnel, their training dates and the validity of their cards |
| Establishments | `/establishments`, `/establishments/register` | Rule 1020 registrations, each with the programmes filed against it |
| CSHP | `/cshp/simple/create`, `/cshp/comprehensive/create` | File a programme — a single project, or one under a registered establishment |
| CSHP queues | `/cshp/for-review`, `/cshp/denied`, `/cshp/for-approval`, `/cshp/archives` | The four stages a programme passes through |
| Settings | `/settings/accounts` | Account management — who may use the system, and what each of them can reach |

## The route a programme takes

```
For Review ──endorse──▶ For Approval ──approve──▶ Approved
    ▲   │                     │
    │   └──return──┐          └──return──┐
    └──────────────┴─────────────────────┘
```

A return does not move a programme back a stage — it records a reason against it
while it stays at For Review. That is why the **Denied** listing and the **For
Review** listing read the same status and differ only on that column, and why
amending a returned programme is all it takes to put it back in the queue.

A programme is editable only while it is at For Review. Once endorsed, its
details, personnel and attachments are locked.

## How it is put together

```
data/          The seed data: the lookup tables, and the demo's accounts,
               personnel, establishments and programmes
stores/        Pinia stores — the workflow lives here (who may file, review or
               approve; what locks when; which office sees what)
pages/         One page per route, mirroring the original URLs
components/    The layout chrome, the forms, the listing table and the modals
composables/   Formatting helpers, the shared modal controller and the toast
assets/css/    The whole design system, in one file
```

The stores load the seed data once and then mutate their own copies, so the demo
behaves like the real thing for the length of a session and starts clean on
reload.

### The signed-in account

Nearly every page reads the viewer's role to decide what it offers, so the
account menu in the top right doubles as a role switcher:

| Role | What it can do |
| --- | --- |
| System Administrator | Everything, including account management |
| Approving Officer | Approves or returns endorsed programmes |
| OSH Division Reviewer | Reviews every field office's filings and endorses them |
| Field Office Focal Person | Files establishments, programmes and OSH personnel for its own office |

A field office sees only its own filings; a regional account sees every office's.
That is the `fo_id` filter the original applied to nearly every query.

## Look and feel

The system this is modelled on was Bootstrap 3: a top navbar, a centred content
pane, a footer. **That arrangement is kept exactly** — the same four menus, in
the same order, grouped the same way — because it is what the people who use it
know. What is replaced is the surface: the typography, spacing, colour and depth
are a design system written for this build, in `assets/css/app.css`.

There is no CSS framework, no icon font and no CDN. The icons are inline SVG
(`components/AppIcon.vue`), the type is the system stack, and the whole thing is
served from the bundle.

Conventions for working on the code are in [DEVELOPMENT.md](DEVELOPMENT.md).
