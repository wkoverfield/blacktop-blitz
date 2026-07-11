# Blacktop Blitz

An NBA 2K Blacktop team randomizer for quickly drafting balanced—or deliberately chaotic—matchups with friends.

**[Play Blacktop Blitz](https://blacktopblitz.com/)**

![Blacktop Blitz home screen](https://github.com/user-attachments/assets/3c532960-4832-4b0f-b6d2-4a2d514f58fa)

## Features

- Draft teams from current, classic, and all-time NBA 2K rosters
- Set matchup sizes from 1v1 through 5v5
- Filter the player pool by overall rating, position, height, team, and pre-NBA experience
- Add minimum thresholds for individual attributes, category ratings, badges, and wingspan
- Open a player's complete ratings profile directly from the draft
- Navigate the full experience with a keyboard or pointer on desktop and mobile
- Automatically switch between day and night visual themes

## Running locally

Blacktop Blitz requires a current version of [Node.js](https://nodejs.org/) and npm.

```bash
git clone https://github.com/wkoverfield/blacktop-blitz.git
cd blacktop-blitz
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## Tech stack

- React 18 and React Router
- Vite
- Tailwind CSS
- Convex
- Framer Motion
- Vercel Analytics and Speed Insights

## Player data

Player data lives in `public/players.json`. A scheduled GitHub Actions workflow refreshes it daily from the [nba2kapi](https://github.com/wkoverfield/nba2kapi) bulk players endpoint. The frontend serves the roster as a same-origin static asset, so end-user browsers do not call the API directly.

To trigger a refresh manually:

```bash
gh workflow run sync-players.yml
```

To run the sync script locally while working on the data pipeline:

```bash
NBA2KAPI_KEY="2k_..." node scripts/sync-players.mjs
```

Do not edit `public/players.json` by hand; the next scheduled sync will replace it.

## Analytics

Blacktop Blitz launched in July 2024. Estimated cumulative growth:

| Snapshot | Visitors | Drafts started |
| --- | ---: | ---: |
| July 2025 | ~2,978 | — |
| February 2026 | ~5,200 | ~5,500 |
| July 2026 | 7,017 | ~8,700 |

Year two brought 4,348 visitors, up 46% from year one.

## Screenshots

![Blacktop Blitz team draft](https://github.com/user-attachments/assets/2ba5a489-f881-4629-9ec5-9eb2af110dde)

## Credits

Blacktop Blitz was inspired by NBA 2K's Blacktop mode and the now-retired 2K Blacktop Randomizer. Player ratings and roster data are sourced through [nba2kapi](https://nba2kapi.com), which tracks data published by [2K Ratings](https://www.2kratings.com/).
