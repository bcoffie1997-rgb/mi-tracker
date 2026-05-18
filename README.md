# MI Enterprise Tracker

Federal contracting intelligence pipeline tracker for the MI SaaS Enterprise Program.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- @dnd-kit for kanban drag-and-drop
- localStorage for persistence

## Local development

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Data persistence

All data lives in your browser's localStorage. Use the menu (⋯) to:
- **Export JSON** — back up your data to a file
- **Import JSON** — restore from a backup
- **Reset to seed** — restore the original 28 researched contacts

## Deploying to Vercel

```bash
vercel deploy
```

## Project structure

```
app/                  Next.js routes + global styles
components/           React components (Kanban, ContactDetail, etc.)
lib/
  types.ts            All TypeScript types + constants
  seed.ts             28 seeded contacts
  storage.ts          localStorage wrapper + import/export
```
