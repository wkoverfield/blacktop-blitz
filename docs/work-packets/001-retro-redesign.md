# Packet 001 — Retro 16-bit Redesign

**Branch:** `feat/retro-redesign` (this packet's groundwork commit scaffolded
the protocol docs; build on this branch, do not re-branch).
**Spec (source of truth):** `docs/context/design-handoff-retro.md` — the
committed handoff from the claude.ai/design project
(`5a78c28b-08cb-4c0a-8146-5abf682fb574`, `Blacktop Blitz Final.dc.html`).
**Taste law:** `docs/context/design-direction.md`.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Replace the current dark/graffiti UI with the retro 16-bit design across all
six screens — Home, Query, Draft, Versus, About, Feedback — pixel-faithful to
the handoff spec, on the existing React 18 + Vite + Tailwind + react-router +
Convex stack. Flow is unchanged; this is a reskin plus the new time-of-day
system, new player card, and new advanced filters.

## Context (what exists today)

- Routes in `src/App.jsx`: `/` (MainMenu), `/qplay` (TeamSelection → draft
  modal → TeamVersus), `/about`, `/feedback`. Keep these routes; draft/versus
  stay `/qplay` internal states. Global `Navigation` goes away as a global —
  Home is nav-less; other screens get the two-line wordmark top-left.
- Player data: `public/players.json` — objects
  `{name, team, teamType: "curr"|"class"|"allt", overall, teamImg,
  playerImage, positions[], height}`. ~1,760 players, daily sync. No attribute
  categories yet.
- Tier CSS ladder exists in `src/index.css` (dark-matter → bronze classes) —
  reuse per the spec's gem-tier table.
- Convex: `feedback:submitFeedback({type, title, description, visitorId})` —
  the new single-textarea form maps: type `"other"`, title = first 80 chars of
  the text, description = full text (≤500 chars), visitorId from
  `src/utils/visitorId.js`. Analytics events in `src/convex/analytics.ts`
  (draft_started, player_selected, draft_completed, pageviews) must keep
  firing from the redesigned flow.
- Images from 2kratings.com require `referrerPolicy="no-referrer"` (see
  existing `PlayerCard.jsx`).
- MUI is used by the current draft modal and some controls. Redesigned
  surfaces must not use MUI. Removing the dependency entirely is in-scope only
  if nothing else imports it afterward (check before ripping out).

## The bet

A faithful implementation of the final mock's state machine (its logic class
is quoted in the handoff spec) directly onto the existing components, keeping
routes, data flow, analytics, and Convex wiring intact.

## Contract (acceptance)

1. All six screens match the spec's anatomy in both panel skins (midday +
   night at minimum), desktop and ≤640px mobile.
2. Time-of-day: auto by local clock (5–9/9–17/17–21/else), chip cycles with
   AUTO terminal state, override persists in localStorage, cross-fade 1.6s,
   chip hidden on Draft.
3. Card: one component, draft + reveal densities, flip via bottom tab (3D
   rotateY), select via body click in draft, selected ring + glow, tier frame
   from overall. Card backs show placeholder category bars derived from a
   deterministic per-player hash (prototype `attrsFor`), with the footnote.
4. Query: overall min/max, era checkboxes, size segments, advanced filters
   (position multi, min-height single, team substring, attribute rules with
   add/remove/AND), live match count, submit gating (≥1 era AND count ≥
   2×size).
5. Draft loop: N rounds for NvN, 3 options per player per round (fewer only
   when the pool runs thin, per prototype `roll`), reroll, exclusion of picked
   players, NEXT/DONE gating, X exits to Query.
6. Versus: team rows in reveal density, VS divider, PLAY AGAIN → Query. Phone
   5v5 renders roster rows.
7. Feedback wired to Convex; About copy verbatim with the two CTA buttons.
8. Analytics events still fire (draft_started, player_selected,
   draft_completed, pageview).
9. `npm run build` green; no MUI imports on redesigned surfaces; no
   border-radius; fonts loaded via Google Fonts (Press Start 2P, Pixelify
   Sans, VT323).

## Surface direction

Prefer: a `useTimeOfDay` hook + `CourtBackdrop` + `ClockChip` shared
components; retro primitives (notch ring, outlined type) as CSS utility
classes in `src/index.css` (or a `retro.css`) so Tailwind arbitrary-value soup
stays out of JSX; `PlayerCard` rewritten in place (keep filename/props shape
compatible where callers survive). Old graffiti assets (`src/img/
home-background.svg` etc.) become unreferenced — delete dead imports, leave
files for a later cleanup packet if uncertain.

## Suggested decomposition (planner may override; ownership must stay disjoint)

- If split: **foundation+static** (index.css, fonts in index.html, App.jsx,
  time-of-day components, MainMenu, About, Feedback, Navigation removal) vs
  **game flow** (TeamQuery/TeamSelection/TeamGenerator/PlayerOptions/
  PlayerCard/TeamVersus). The game-flow slice depends on foundation's CSS
  utilities — if that coupling feels racy, use ONE slice.

## Non-goals

- No nba2kapi data extension (category ratings, badges, wingspan) — card
  backs and TOP SKILLS ship on placeholder hash values with the footnote.
- No changes to the players.json sync, Convex schema, or analytics schema.
- No SEO/meta/manifest work beyond what the reskin forces (theme color).
- The attribute select ships with the 6 category ratings only.

## Status log

- 2026-07-09 — packet authored; groundwork (protocol docs, gate agents, court
  assets) committed on `feat/retro-redesign`.
- 2026-07-09 — gates clean after 3 rounds (static PASS, taste PASS with 9
  accepted warns, adversarial PASS, visual PASS both skins). Gate report at
  `docs/artifacts/001-gate-report.md`; PR opened to master; WKO-27 → In
  Review. Awaiting Wilson's taste pass + merge word.
