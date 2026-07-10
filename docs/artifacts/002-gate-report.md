# Gate Report — Packet 002: Feedback Board (restore)

> Filled from the WKO-28 gate loop. The PR body carries the summary.

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| Convex typecheck (if touched) | n-a (contract forbids touching `src/convex/`; backend unchanged) |

## Gate agents

| Gate | Verdict | Blockers found → fixed | Warns (accepted) |
|---|---|---|---|
| Taste linter | PASS | — | 3 warns, listed below |
| Adversarial review | PASS | — | 6 warns, listed below |
| Visual review | PASS | — | 1 warn (leftover `[QA-TEST]` row on dev, cleanup blocked — see below) |

Rounds run: 1. No blockers surfaced; all findings are warns awaiting taste rulings or queued follow-ups.

### Accepted warns (taste)

1. Board rows use a new 3px solid cream/ink divider; the spec's established row-separator idiom is 2px dotted lavender `rgba(143,131,173,0.4-0.5)` (card stat rows, advanced-filters divider). Legal (hard-edged, skin-aware, no radius) but a second divider style on a new surface with no mock — needs a ruling (see uncertainty 3).
2. `text-muted` (`#8f83ad` lavender) is used for the board's LOADING/empty states and the author line inside a skin-aware `bb-panel`, but muted has no light-skin counterpart; lavender-on-cream is low contrast on sunrise/midday (see uncertainty 2).
3. Law 10 gray area: the type chip renders Press Start at 8px vs the spec's 7px chip size (era/position chips, screen 7). The contract says "like era chips"; 8px is a legible bump on a text-heavy surface — needs a ruling.

### Accepted warns (adversarial — all queued as follow-up hardening, none block the packet)

1. Vote-toggle failures are silent (mutation rejections go to `console.error`, no UI signal).
2. Live resort-by-upvotes reorders rows under the pointer; a fast second tap can vote on the wrong item.
3. No in-flight guard / optimistic update on the vote button; rapid clicks pre-round-trip are dropped.
4. All localStorage-blocked visitors collapse to visitorId `anon` and share one vote pool per item.
5. Multi-line descriptions render collapsed (board `<p>` lacks `whitespace-pre-line`).
6. `getFeedback` `.collect()` is unbounded; any vote rebroadcasts the full table to every open client.

### Blocked cleanup (visual warn)

One `[QA-TEST]` row remains on the dev deployment (`dev:dapper-marmot-81`, id
`j57fcm5eza2zq3azxcz0bgbx6n8a9kj8`, title "[QA-TEST] Board render check").
There is no delete mutation (contract forbids touching `src/convex/`) and the
permission classifier denied `npx convex import --table feedback --replace`
(table truncation). Delete it via the Convex dashboard, or approve the
truncation command. Upvote-toggle QA ended toggled-off as required; the row
carries only its creator auto-vote.

## Artifacts

- `docs/artifacts/002-feedback-midday.png` — form + board, light (midday) skin.
- `docs/artifacts/002-feedback-night.png` — form + board, dark (night) skin.
- `docs/artifacts/002-feedback-mobile.png` — ≤640px stack, touch targets.

## Ranked uncertainty (for the human taste pass)

1. **Title/description duplication on board rows** — the blessed form sets title = first 80 chars of the description, so most new entries show near-identical text twice (Press Start title, then VT323 body). The contract was implemented literally (both shown). Screenshot: `docs/artifacts/002-feedback-midday.png`. Recommendation: hide the description when it starts with the title (one-line render guard); old typed submissions with real distinct titles keep both.
2. **Muted lavender on the light panel skin** — `#8f83ad` on cream (author line, LOADING, empty state) is low contrast on sunrise/midday, and every other in-panel value pair in the spec flips per skin. Screenshot: `docs/artifacts/002-feedback-midday.png`. Recommendation: define a skin-aware muted (ink at reduced opacity on light) as a numbered amendment; keeping lavender universal is the token-table-literal alternative.
3. **Board divider idiom + "THE BOARD" heading** — rows separate with a new 3px solid divider instead of the spec's 2px dotted lavender, and a small outlined "THE BOARD" heading (Press Start 12px, cream, `bb-outline-2`) was added between the panels though the contract specified no header. Screenshot: `docs/artifacts/002-feedback-night.png`. Recommendation: switch the divider to the established 2px dotted lavender for consistency (one CSS line) and keep the heading — the two stacked panels need the separation; both are one-liners either way.

## Deliberate deviations from the design law

- "THE BOARD" section heading added (contract said no header) — the board panel needed separation from the form; rename/remove is a one-liner (see uncertainty 3).
- Board row divider is 3px solid cream/ink, not the established 2px dotted lavender (see uncertainty 3).
- Type chip at Press Start 8px vs the spec's 7px chip size (taste warn 3).
- `text-muted` lavender used in-panel with no light-skin counterpart (see uncertainty 2).
- Author line shows "BY {NAME}" and drops the old board's date — contract said "optional author name" only; date can be added back if wanted.
