# Gate Report — Packet 007: draft viewport fit

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `git diff --check` | PASS |

## Review lenses

| Gate | Verdict | Findings |
|---|---|---|
| Taste linter | PASS | Uses spatial composition and uniform scaling only; card design, type, colors, team ownership, and interaction law unchanged. Amendment 7 records wide labels-above composition. |
| Adversarial review | PASS | Mobile <768px retains scrolling/full-size controls. Header/actions never scale. Keyboard row attributes and DOM order remain Player 1 → Player 2 → actions. |
| Visual/interaction review | PASS after 1 fix | First pass: no vertical overflow, but 10px horizontal clip per side from unsupported calculated zoom. Fixed with explicit width breakpoints. Final 1280×720 geometry clean; both actions visible; selection and flip exercised. |

## Geometry proof — 1280×720

- Document: `scrollHeight=720`, `clientHeight=720`, no vertical overflow.
- Matchup board: x `81.03–1198.97`, width `1117.94`, fully inside viewport.
- REROLL bottom `533.15`; DONE bottom `536.15`; both visible.
- Six selectable cards found; opposing picks selected; DONE enabled; STATS
  control exercised.

## Ranked uncertainty

1. The 768–1099px rules are mathematically bounded and code-reviewed but the
   in-app browser exposed only its 1280×720 surface during this gate. Capture
   a tablet/small-laptop baseline when explicit viewport emulation is healthy.
2. Wide layouts trade the original labels-left composition for labels-above;
   this is the intentional price of eliminating the vertical scroll loop.
