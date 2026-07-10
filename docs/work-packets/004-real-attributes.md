# Packet 004 — Real attribute data: nba2kapi sync extension

**Branch:** `feat/004-real-attributes` (STACKED on `feat/003-game-feel` —
merge PR #22 first; this packet's PR diffs clean against master after).
**Taste law:** `docs/context/design-direction.md` (10 laws + amendments 1-4).
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Kill the placeholder data. The nba2kapi bulk endpoint already returns the
full player docs — 35 flat attributes, badge tier counts + list, weight,
wingspan; blacktop's sync script trims them away. Extend the projection,
derive the six card categories at sync time, and point the three consumers
(card backs, TOP SKILLS, advanced filters) at real values.

## Facts (verified against the nba2kapi repo + full dump)

- `GET /api/players/bulk` returns `getAllFiltered` docs verbatim: per player
  `attributes` (flat record, 35 keys like `threePointShot`, `drivingDunk`,
  `ballHandle`), `badges` (`{legendary, hallOfFame, gold, silver, bronze,
  total, list[{name,tier,category}]}`), `weight` ("164 lbs"), `wingspan`
  ("6'3\""), sometimes `build`/`archetype`.
- Coverage in the current dataset: attributes 1757/1757, badges 1745/1757.
- There are NO pre-computed category ratings — derive them (below).
- A full local dump exists for seeding:
  `~/Documents/GitHub/personal/nba2kapi/nba2k-all-players.json` (1757
  players, same shape as the live API). CI has the real `NBA2KAPI_KEY`
  secret and re-syncs daily.

## Category derivation (bake into the sync, key `cats`)

Rounded mean of each group, only from keys present:

- `ins` (INSIDE SCORING): closeShot, layup, drivingDunk, standingDunk,
  postControl, postHook, postFade, drawFoul, hands
- `out` (OUTSIDE SCORING): midRangeShot, threePointShot, freeThrow, shotIQ,
  offensiveConsistency
- `ply` (PLAYMAKING): passAccuracy, ballHandle, speedWithBall, passIQ,
  passVision
- `def` (DEFENDING): interiorDefense, perimeterDefense, steal, block,
  helpDefenseIQ, passPerception, defensiveConsistency
- `ath` (ATHLETICISM): speed, agility, strength, vertical, stamina, hustle,
  overallDurability
- `reb` (REBOUNDING): offensiveRebound, defensiveRebound

## Contract (acceptance)

### Sync script (`scripts/sync-players.mjs`)
1. Projection adds: `attributes` (all 35, verbatim), `cats` (derived above),
   `badges` as TIER COUNTS ONLY (`{legendary, hallOfFame, gold, silver,
   bronze, total}` — drop `list`, nothing renders badge names), `weight`,
   `wingspan`. Existing fields unchanged.
2. Output goes MINIFIED (`JSON.stringify(trimmed)`, no indent) to hold the
   file size down; log the byte size. Keep the stable sort.
3. New sanity guard beside the 500-player floor: if <90% of fetched players
   carry `attributes`, refuse to overwrite (schema regression upstream).
4. Add a `--from-dump <path>` mode that reads the local nba2kapi dump
   instead of the network (used to seed now and for offline dev). CI
   workflow unchanged (still hits the live API with its secret).
5. Regenerate `public/players.json` from the local dump in this packet so
   the app ships real data immediately. Report the new file size (raw; it
   will be several MB — the CDN gzips it, this is acceptable).

### App consumption
6. `src/lib/attrs.js`: `attrsFor(player)` returns the real `cats` (mapped to
   the six display labels) when present; keeps the deterministic hash ONLY
   as fallback for players without data. Tier-bracket coloring unchanged.
7. Card back: real category bars; the `* placeholder values pending
   attribute data` footnote renders ONLY for hash-fallback players (spec
   says remove once real data lands).
8. TOP SKILLS chips (reveal density) rank the real categories.
9. Query advanced filters — attribute rules select gets optgroups:
   `CATEGORIES` (the six), then the 35 raw attributes grouped (FINISHING /
   SHOOTING / PLAYMAKING / DEFENSE / ATHLETICISM), plus `BADGES` (Hall of
   Fame count, total badges) and `PHYSICALS` (wingspan — parse like height,
   compare in inches). Rules AND together, same row UI, no layout change.
10. The helper line under the rules ("With nba2kapi connected, rules cover
    every attribute...") is now TRUE — replace with a shorter neutral hint
    or drop it.
11. Filtering stays instant client-side on ~1,760 players (it is in-memory;
    just don't do anything quadratic).

### General
12. `npm run build` green; no MUI; no new deps; analytics untouched; no
    Convex changes in THIS repo (nba2kapi repo is NOT touched at all).
13. Draft/versus/roster behavior unchanged; card layout unchanged (same
    bars, real numbers).

## Non-goals

- No nba2kapi (upstream repo/API) changes whatsoever.
- No badge-name UI, no archetype/build display this packet.
- No pagination/virtualization of players.json (CDN + gzip handles it).
- No changes to the six-category card-back layout.

## QA discipline

Per protocol. Verify a known star's card back against 2kratings values
(e.g. Jokić: closeShot 99, threePointShot 86, block 56 feed the right
categories). Feedback form untouched.

## Status log

- 2026-07-10 — packet authored (facts verified against nba2kapi repo +
  dump; bulk endpoint confirmed to carry attributes/badges/wingspan).
