# Packet 008 — nba2kapi profile links

**Branch:** `feat/nba2kapi-player-links`
**Taste law:** `docs/context/design-direction.md` + amendments 1–7.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Create a useful discovery loop from Blacktop cards into nba2kapi's complete
player dossiers, while making the app's data provenance explicit on About.

## Contract

1. Carry each upstream player `slug` through the daily sync and normalizer.
2. Every full-card player name links to the exact nba2kapi player/version URL
   (`slug`, era, and team); open in a new tab.
3. Hover or keyboard focus on the name reveals a compact preview with overall,
   position, team, and a clear `VIEW FULL PROFILE` action. Touch tap opens the
   link directly.
4. Link activation must not select the draft card or flip either face.
5. About adds a distinct data-source credit: Blacktop uses nba2kapi, which
   sources ratings/rosters from 2K Ratings; link both sources.
6. Missing slugs fall back to a deterministic name slug; no player card breaks.
7. Preserve card dimensions, responsive density, and existing interactions.

## Proof

- Exact generated dossier URL returns successfully.
- Hover/focus/click propagation browser QA.
- Draft/reveal front/back overflow gates.
- `npm run build`; `git diff --check`.

## Status log

- 2026-07-11 — Built and browser-gated. All 1,741 roster records carry unique
  upstream slugs. Exact Hakeem version URL returned HTTP 200. Six draft cards
  render 12 exact-fit faces; clicking/focusing the name exposes the preview and
  leaves `aria-pressed=false`. About attribution and both external links are
  present with document client/scroll height parity at 720px. Gate report:
  `docs/artifacts/008-gate-report.md`.
