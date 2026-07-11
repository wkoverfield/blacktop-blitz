# Packet 005 — Search filters + visible feedback status

**Branch:** `chore/feedback-status-moderation`
**Taste law:** `docs/context/design-direction.md` + amendments 1–4.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Make the two real feedback outcomes legible and make roster-origin filtering
fast enough to use without knowing exact source strings.

## Contract

1. Team filter becomes a searchable combobox populated from the active roster.
2. Add a matching `Prior to NBA` combobox for college, high school, or club.
3. Typing filters suggestions and the player pool immediately; selecting a
   suggestion normalizes the exact value. Both controls support keyboard use.
4. Sync carries upstream `college` through to `players.json`; normalize it in
   the client. Missing values exclude only when the filter is active.
5. Completed feedback renders a visible `FIXED` chip and sorts below active
   feedback. Status moderation remains internal-only.
6. Existing filters, draft flow, analytics, mobile layout, and design tokens
   remain intact. No new dependency.

## Proof

- `npm run build`
- Sync projection verified against the upstream production dataset.
- Query checked with team and prior-to-NBA partial searches and exact picks.
- Feedback status ordering/chip checked against production-shaped records.

## Status log

- 2026-07-11 — Built on PR #24. Static wall + Convex typecheck green. Live
  data projection: 1,705/1,741 players carry Prior-to-NBA values; 126 unique
  NBA teams and 304 unique schools/clubs. Browser pass verified live counts,
  pointer suggestions, and arrow/Enter exact selection. The first pass exposed
  all-era Lakers suggestions under Current; fixed by scoping both option sets
  to selected eras. Gate report: `docs/artifacts/005-gate-report.md`.
