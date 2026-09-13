# Development notes

Conventions for working on this codebase — how it is put together, and the rules
that are easy to break without noticing.

This repository is a **front-end-only demonstration** of an online Construction
Safety and Health Program system, built by LaurieJohn. It was migrated out of a
CodeIgniter/MySQL application: the PHP, the database and every other module the
original carried (job vacancies, applicant matching, employment services,
reports, certificate printing) were removed, and four features — **Safety Officer & First Aider**,
**Establishments**, **CSHP** and **Account Management** — were rebuilt in Nuxt.

**Keep it de-identified.** The data under `data/` is invented: the people, the
companies, the offices, the places and the figures are all made up, and the
original agency's name, logo and branding are deliberately absent. Do not
reintroduce real names, logos, seals or branding, and do not name a real
government body anywhere in the UI, the data or the copy.

## Stack

- **Nuxt 3** with `ssr: false`. There is no server, no database and no API.
  Every page renders in the browser, which is what keeps the build a plain
  static bundle Vercel can serve without a Node function.
- **Pinia** for state. The stores are the application: they hold the data and
  the workflow rules.
- **No CSS framework.** `assets/css/app.css` is the whole design system.

Do not introduce a backend, a database, or an HTTP client. If a page needs data
it does not have, add it to `data/` or derive it in a store.

## Where things live

```
data/reference.ts    Lookup tables — roles, offices, statuses, programme types.
                     The ids are the ids the old schema used, because the
                     workflow rules key off them.
data/demo.ts         The working data: accounts, safety officers and first
                     aiders, establishments, programmes.
stores/              accounts.ts, auth.ts, safety-officers.ts,
                     establishments.ts, cshp.ts. The workflow lives here, not
                     in the pages.
pages/               One page per route. The URLs mirror the original menus.
components/          Layout chrome, the shared forms, the listing table, modals.
composables/         useFormat (peso/date/name), useCshpModal, useCshpActions,
                     useToast.
assets/css/app.css   Tokens, base, layout, then each component in the order a
                     page assembles itself.
```

## Front-end conventions

- **The navbar arrangement is the original's and stays that way.** Four
  dropdowns — Safety Officer & First Aider, Establishments, CSHP, Settings —
  in that order, with the counts the old menu carried in its badges still on
  the CSHP queues. Redesign the surface freely; do not reorganise the menus.
- **No CDN, no icon font, no framework.** Icons are inline SVG paths in
  `components/AppIcon.vue` — add a path there rather than reaching for Font
  Awesome. Type is the system stack. Everything ships in the bundle.
- **The yellows are fixed.** `--page: #f5cd4c` and `--btn: #ebce71` are taken
  from the system this demo is modelled on; do not nudge them. The page is a
  gradient from `--page` down to `--page-fade` over `--page-fade-height`, with
  `--page-fade` continuing below it — both ends are yellow on purpose, so
  colour still holds the foot of a long screen. The navbar and the cards are
  the white in the design; the ground stays yellow.
- **Nothing in the chrome is burnt amber.** The brand mark and the avatar take
  `--page` → `--btn` like everything else, not a dark brown gradient. Brown
  blocks in a white navbar read as a different palette from the page.
- **Two muted-text tokens, and they are not interchangeable.**
  `--text-muted` is for text inside a white card; `--text-on-yellow` is for
  text sitting on the page itself — breadcrumbs, the page lead. Cool grey
  falls to about 3:1 against the yellow. Likewise the button gold is light, so
  it carries `--btn-text` (dark brown, 6.7:1) — never white.
- **Style with the design system's classes**, not inline styles or a new
  stylesheet: `card` / `card__header` / `card__body` / `card__footer`, `btn
  btn--primary`, `badge badge--green`, `form-grid` with `col-4` / `col-6`,
  `field` / `label` / `input`. A one-off `style` attribute for a width is
  fine; a one-off colour is not — use a token.
- **Wrap every on-screen `<table>` in `<div class="table-wrap">`**, including
  two-column key/value tables. Without it a wide table scrolls the whole page
  sideways on a phone instead of scrolling inside its own box.
- **Listings go through `DataTable`.** It carries the search, the sorting, the
  row numbers and the pager, and its cells are slots named for their column
  key. Mark the columns a phone has no room for as `secondary`.
- **Confirmations go through `useCshpModal()`** — `confirm()` for anything
  destructive or workflow-changing, `notice()` for something that only needs
  acknowledging. A confirm can carry a `prompt`, which is how a reviewer's
  remarks are collected. Never use `window.confirm`, and never reach for a
  dialog library.
- **The four decisions on a programme go through `useCshpActions()`** —
  `endorse`, `approve`, `returnForCompliance`, `closeAsCompleted`, plus
  `remove` and the `permissions()` guard. The listings and the detail page
  both call it, so the wording and the guards cannot drift apart.
- **Money, dates and names go through `composables/useFormat.ts`** — `peso()`,
  `compactPeso()`, `count()`, `longDate()`, `shortDate()`, `inputDate()`,
  `today()`, `isPast()`, `fullName()`, `initials()`, `plural()`. They are
  auto-imported.
- **Motion is short and it is skippable.** Page transitions are the `page-*`
  classes in `assets/css/app.css`, wired up by `app.pageTransition` in the Nuxt
  config. Everything is disabled under `prefers-reduced-motion: reduce`; keep
  it that way.

## Workflow rules worth knowing

These came out of the PHP models and are reproduced in the stores. Change them
there, not in a page.

- A **programme** is at `status` 1 For Review, 2 For Approval or 3 Approved,
  with `denied_status` running alongside: 0 not returned, 1 returned for
  compliance, 2 closed as completed or withdrawn.
- **A return does not move a programme back a stage.** It sets `denied_status`
  while the status stays at For Review, which is why `forReview` and `denied`
  on the store read the same status and differ only on that column.
- **Amending a returned programme clears the return** and puts it back in the
  review queue — answering the remarks *is* the resubmission. There is no
  separate resubmit action.
- A programme is **editable only at For Review** (`isEditable`). Once endorsed,
  its details, personnel and attachments are locked.
- **Who may do what** is on the auth store: `canFile` (field office and
  administrator), `canRegisterPersonnel` (everyone but the approving officer),
  `canReview`, `canApprove`, `canManageAccounts` (administrator alone). A page
  that offers an action must check the same getter the store does — hiding a
  button is not a guard on its own.
- **Who sees which filing** is `visible` on each store: a field office sees its
  own `fo_id`, a regional account sees all. Every listing, the dashboard and
  every detail page resolve through it, so a record the listing hides is also
  not reachable by typing its address.
- A **comprehensive** programme is filed against a *registered* establishment; a
  **simple** one is filed on its own with `establishment_id = 0`.
- A project deploying more than `OH_PERSONNEL_THRESHOLD` workers must name an
  occupational health nurse; the comprehensive form reveals that section on the
  same number.
- **Account Management cannot lock itself out.** The last active administrator
  cannot be deleted, deactivated or demoted (`isLastAdministrator`), and
  removing the account you are signed in as moves you to another one
  (`auth.ensureValid()`).

## Verifying a change

There are no unit tests. Type-check and build, then look at the affected page:

```bash
npx nuxt typecheck
npm run build
npm run dev
```

## Deploying

Vercel needs no configuration: it detects Nuxt, runs `npm run build`, and serves
the output. Because `ssr: false` makes the build a static bundle, nothing runs
server-side. `npm run generate` produces the same thing for any other static
host.
