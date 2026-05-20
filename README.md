# Mindy — Federal Pipeline Tracker

Internal BD tool for Mindy AI. Tracks federal contracting leads through a kanban
pipeline, drives sequenced cold outreach via Gmail, and logs every touch.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS — light + dark mode, slate/purple Mindy palette
- @dnd-kit for kanban drag-and-drop
- googleapis + iron-session for Gmail OAuth + send
- localStorage for client-side persistence

## What's inside

- **Tracking** (`/`) — 219-contact pipeline with Kanban / Table / Grouped views
- **Outreach** (`/outreach`) — sequence engine, template editor, sent log, Gmail
  send via OAuth + the existing "Open in Gmail" fallback
- **Changelog** (`/changelog`) — auto-generated from `git log` at build time

## Local development

```bash
npm install
cp .env.local.example .env.local   # if present; else create it with the keys below
npm run dev
```

Opens at <http://localhost:3000>.

### Required env vars

For Gmail OAuth + send to work locally, `.env.local` must contain:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
IRON_SESSION_PASSWORD=<32+ random bytes, base64>
```

Generate the session password with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

For production, point `GOOGLE_REDIRECT_URI` at the deployed URL's callback
path and register that URI in Google Cloud Console under Clients →
Authorized redirect URIs.

## Email setup

See [`docs/EMAIL-SETUP.md`](docs/EMAIL-SETUP.md) for the full Namecheap DNS +
Google Workspace + warmup walkthrough for the cold-outreach domain.

## Data persistence

Contacts, templates, sequences, and sent messages all live in your browser's
localStorage. Use the `⋯` menu in the top bar to:

- **Export JSON** — back up your data to a file
- **Import JSON** — restore from a backup
- **Reset to seed data** — restore the original researched contacts

## Project structure

```
app/
  api/auth/google/         OAuth start + callback
  api/auth/status/         { connected, email }
  api/auth/disconnect/     destroys the session
  api/email/send/          Gmail send endpoint
  outreach/                Outreach dashboard
  changelog/               Auto-generated changelog
  page.tsx                 Tracking (kanban / table / grouped views)
components/
  outreach/                Compose modal, queue, sent, inbox, template + sequence editors
  TopBar.tsx               Shared nav + theme toggle + Gmail connect chip
  ThemeToggle.tsx          Light / dark mode switch
  KanbanBoard.tsx          Drag-and-drop pipeline
  TableView.tsx            Sortable spreadsheet
  GroupedView.tsx          Grouped-by-category cards
  ContactDetail.tsx        Side-panel detail editor
lib/
  server/                  Server-only — Gmail OAuth + session
  email/                   Template merge, sequence engine, API client
  types.ts                 Domain types + STATUS_COLORS + TIER_COLORS
  seed.ts                  219 researched contacts
  storage.ts               localStorage wrapper + import/export
  changelog.ts             Wraps lib/changelog.generated.json
scripts/
  generate-changelog.mjs   Pre-build hook — writes changelog.generated.json
docs/
  EMAIL-SETUP.md           Namecheap + Workspace setup checklist
```

## Deploy

This project deploys cleanly to Vercel. After connecting the repo:

1. Set the four env vars listed above in **Project Settings → Environment Variables**
2. Update `GOOGLE_REDIRECT_URI` to point at the production URL
3. Add the production callback URL to the Google OAuth client's
   **Authorized redirect URIs** list
