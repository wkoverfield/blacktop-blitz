# Gate Report — Packet 004: Real attribute data (nba2kapi sync)

Branch `feat/004-real-attributes` (rebased onto master after PR #22 merged).
Reviewed lean per Wilson's token-conservation call: the build was already
complete when the prior session died; this pass verified + committed it,
resolved the data blocker with a live re-sync, and ran one focused
data-correctness reviewer instead of the full 3-gate spread.

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| Convex typecheck | n-a (no Convex changes) |

## Verification (orchestrator, live)

- Category derivation hand-verified end-to-end against `public/players.json`
  for multiple players (Jokić, Harrison Barnes) — all six group means match
  the shipped `cats` exactly, correct rounding, no NaN.
- Query advanced-filter select renders all 44 options in 8 optgroups
  (6 categories + 35 raw attrs grouped + 2 badge counts + wingspan); a
  `threePointShot ≥ 85` rule moved the match count 210 → 49 sanely.
- Card back shows real bars, NO placeholder footnote on real-data players.
- 1.88 MB minified players.json loads clean; Query shows live match counts.

## Data-correctness reviewer (adversarial lens)

| Verdict | Finding | Resolution |
|---|---|---|
| BLOCKER | Seed dump was 8 months stale (Nov 2025); stale ETag would prevent CI self-healing | FIXED — deleted stale ETag, dispatched the sync workflow on the branch; CI refetched live rosters through the new projection and committed fresh data (`d19358a`) + a fresh ETag. Rosters now current (Giannis/Wemby/Luka), 100% attribute + category coverage. |
| WARN | Category rules fell back to hash noise for any future no-data player | FIXED — `ruleValue` category keys now return null (exclude) when `!hasRealAttrs`; hash stays display-only. Latent today (100% coverage). |
| WARN | `deriveCats` is all-or-nothing (a fully-empty group nulls all six) | ACCEPTED — no player in the data has an empty group (only 6 miss a single `agility` key); per-group partial derivation deferred as a non-goal. |

Reviewer's "verified clean" set: key groups match the contract (9/5/5/7/7/2),
partial-attribute players never NaN, `ruleValue` resolves every offered
option, badge-less players compare against 0 cleanly, wingspan parses for all
present values (null excludes), empty-min rules ignored, filtering is
O(rules×players) not quadratic, sync guards (90% coverage floor, `--from-dump`
path arg, minified write) tested black-box, CI workflow needs no changes,
`nba2kapi.js` preload correct for the larger file.

## Deliberate deviations from the design law

None — no UI/visual change; card-back layout and bar rendering unchanged,
now fed real numbers.

## Ranked uncertainty (for Wilson)

1. **Roster values are whatever nba2kapi's live DB currently holds** (e.g.
   Giannis → Miami Heat). That is the freshest source of truth available and
   is internally consistent (overalls + attributes from one fetch); if any
   specific player looks wrong, that's an nba2kapi data question, separate
   from this packet.
2. **Nothing else** — code was reviewed clean, data blocker resolved, build
   green.
