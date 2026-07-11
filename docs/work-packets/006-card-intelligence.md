# Packet 006 — Card intelligence

**Branch:** `chore/feedback-status-moderation` (extends PR #24)
**Taste law:** `docs/context/design-direction.md` + amendments 1–5.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Use the card's empty space for information that improves a Blacktop pick. The
front becomes a fast scouting summary; the back explains the ratings and adds
real badge/origin context.

## Contract

1. Derive badge counts from the upstream populated badge lists when the stale
   top-level counters are zero. Store counts plus the highest-tier badge names,
   not descriptions/images/full lists.
2. Re-enable Hall of Fame and total-badge advanced filter axes.
3. Draft fronts add a compact physical profile (weight + wingspan) and the
   existing three Top Skills chips. Reveal fronts remain unchanged apart from
   the same physical profile row.
4. Card backs retain the six category bars and add `BADGES`, `BEST`, and `FROM`
   rows using real badge counts, top badge name, and Prior-to-NBA value.
5. Missing values render as `—`; no invented data, new dependencies, card
   dimensions, or interaction changes.

## Proof

- Full live-data badge derivation audit.
- `npm run build`; `git diff --check`.
- Draft + reveal front/back visual and overflow review.

## Status log

- 2026-07-11 — Built and browser-gated. Live data derives 13,558 badge
  assignments across 1,462 players. First visual pass found both 344px draft
  faces overflowing by 8–11px; fixed with a draft-only one-row TOP treatment
  and 1px tighter category rhythm. Re-gate: all six draft cards and both reveal
  cards report exact client/scroll-height parity on both faces. Gate report:
  `docs/artifacts/006-gate-report.md`.
