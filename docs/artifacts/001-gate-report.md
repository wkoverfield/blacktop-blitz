# Gate Report — Packet 001: Retro 16-bit Redesign

> Filled from the WKO-27 gate loop. The PR body carries the summary.

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| Convex typecheck (if touched) | n-a (no Convex schema/function changes; analytics wiring verified live against dev Convex) |

## Gate agents

| Gate | Verdict | Blockers found → fixed | Warns (accepted) |
|---|---|---|---|
| Taste linter | PASS | Pink Diamond glow (Law 3) removed; SUBMIT gated on distinct names | 9 warns, listed below |
| Adversarial review | PASS | Draft sampler could repeat names per row → distinct-name sampling + per-roll card remount; draft_started StrictMode double-fire fixed | — |
| Visual review | PASS | — | Both skins captured (midday + night), all six screens |

Rounds run: 3. All blockers fixed at root (no papering).

### Accepted warns (taste)

1. Native form controls lack `appearance: none` / `border-radius: 0` reset on `.bb-well` (Query select/inputs, Feedback textarea) — iOS/macOS Safari will show OS chrome. Fix is one CSS rule; queued as follow-up.
2. TEAM ONE / TEAM TWO headings (Press Start 17px) use `bb-outline-2`; law 5 puts 16–18px in the 3px band — under-outlined on Versus.
3. ErrorBoundary still ships the old rounded-2xl white button and a removed `font-serif` mapping over the new court backdrop — crash surface is off-law (follow-up packet).
4. Dark Matter tier accent `#b297ff` is invented, not in the locked token table (needs ruling — see ranked uncertainty).
5. Versus roster card body-click collapses the expanded row — extends the "card body = select, draft only" contract (needs ruling — see ranked uncertainty).
6. Press Start px drift: About/Feedback titles `clamp(28px,6vw,40px)` vs fixed 40px; About CTA buttons 12px vs the 16–18px range; card-back footnote VT323 13px vs 14–28px helper range (needs ruling — see ranked uncertainty).
7. `+ ADD RULE` styled as a bb-seg segment instead of the spec'd chip (outlined chip's cream ring is invisible on the light panel skin) — deliberate deviation, needs ruling.
8. Em dashes in two user-facing UI strings ("COULDN'T LOAD PLAYERS — CLICK TO RETRY", "NO PLAYERS LEFT TO DRAFT — REROLL OR EXIT (X)") — writing-rule cleanup, one-line fix.
9. bb-seg-on ring is self-colored `#f08a4b` (spec's "orange bg + ring" is ambiguous; could be ink).

## Artifacts

- `docs/artifacts/001-home-{midday,night}.png` — Home, both panel skins.
- `docs/artifacts/001-query-{midday,night}.png` — Query with advanced filters, both skins.
- `docs/artifacts/001-draft-{midday,night}.png` — Draft round with pick rows, both skins.
- `docs/artifacts/001-versus-{midday,night}.png` — Versus reveal, both skins.
- `docs/artifacts/001-about-{midday,night}.png` — About with CTA buttons, both skins.
- `docs/artifacts/001-feedback-{midday,night}.png` — Feedback form, both skins.

## Ranked uncertainty (for the human taste pass)

1. **Dark Matter accent `#b297ff`** — the spec's tier-accent map stops at galaxy-opal..bronze and omits the 99-overall Dark Matter tier; this violet is invented (`src/lib/attrs.js`), used for TIER value, OVR bar, and bracket coloring on 99 cards (e.g. All-Time Hakeem). Screenshot: `docs/artifacts/001-versus-midday.png`. Recommendation: bless `#b297ff` as a numbered amendment; it reads as the natural top of the existing ladder, and nothing in the DM gradient (#000/#400000/#562683) is legible as an accent.
2. **Query now wakes up with Current era pre-checked** — the old form started all-unchecked; the new default makes the screen submittable immediately but changes first-visit behavior and shifts `query_executed` metadata baselines. Screenshot: `docs/artifacts/001-query-midday.png`. Recommendation: keep the warm start (dead-end empty states are worse than a checked box); it is a one-flag revert in `TeamQuery.jsx` if it feels presumptuous.
3. **Versus roster body-tap collapses the expanded card** — the interaction law says card body = select, draft only; giving the body a collapse action on the phone 5v5 roster extends the contract without a ruling. Screenshot: `docs/artifacts/001-versus-night.png`. Recommendation: bless body-tap-to-collapse as an amendment (it matches the tap-to-expand gesture users just performed); the alternative is an explicit X affordance, which adds chrome to an already dense row.

## Deliberate deviations from the design law

- Dark Matter accent `#b297ff` invented (law 1) — see uncertainty 1.
- `+ ADD RULE` as bb-seg segment instead of the spec'd chip — the chip's cream ring is invisible on the light panel skin; needs a ruling (bless, or define a skin-aware chip variant).
- Responsive `clamp()` on About/Feedback titles and 12px About CTA text — spec only sanctions clamps for the wordmark; either normalize to spec px or amend.
- bb-btn ring is constant ink on the orange button (spec's skin-shifting ring rule read as panel-scoped; buttons don't skin-shift).
- bb-well light skin invented (6% ink tint, 3px ink ring, `#c05a28` value) — spec only defines the dark-skin well.
- ClockChip desktop sizing extrapolated (10px Press Start, 14x10 padding, dark bg + cream-50 ring, hover `#ffb066`) — only mobile values are spec'd.
- Body-tap-to-collapse on Versus roster (law 9 gray area) — see uncertainty 3.
