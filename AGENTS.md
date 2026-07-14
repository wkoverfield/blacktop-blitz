# Blacktop Blitz

Notes for anyone working in this repo.

## Stack

- React 18 + Vite. Application code in `src/` is JSX, not TypeScript.
- Tailwind for styling, react-router for routing.
- Convex backend under `src/convex/` (TypeScript; generated code in `src/convex/_generated/`).

## Commands

- Dev server: `npm run dev` (port 5173).
- Build / static wall: `npm run build`. It must pass before a change lands.

## Landmines

- `public/players.json` is synced daily by CI. Never hand-edit it; edits get overwritten.
- Images from 2kratings.com must load with `referrerPolicy="no-referrer"`. Without it they return 403.

## Git

- Never commit directly to `master`. Work on a feature branch and open a PR.
