# Gate Report — Packet 006: card intelligence

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `git diff --check` | PASS |

## Review lenses

| Gate | Verdict | Findings |
|---|---|---|
| Taste linter | PASS | Existing StatRow, Top Skills, tier-value, card frame, and flip idioms reused. No decorative fill, new color job, radius, shadow, or interaction. Amendment 5 records the intentional density-contract extension. |
| Adversarial review | PASS | Counts derive from lists only when lists exist; counter fallback remains for no-list records. Missing badges/origin render `—`; zero-badge players render honest `0 · 0 HOF`. Full badge descriptions/images are discarded. |
| Visual/interaction review | PASS after 1 fix | Initial draft front/back overflowed 8–11px. Compact TOP row + tighter back category spacing resolved it. Six draft cards: 344px client/scroll parity, both faces. Two reveal cards: 404px parity, both faces. |

## Data proof

- 1,741 players; 1,462 with badges.
- 13,558 assignments: 46 Legendary, 638 Hall of Fame, 6,218 Gold,
  3,548 Silver, 3,108 Bronze.
- Maximum badges on one player version: 33.
- Roster JSON: 2,095,903 bytes raw, versus 1,920,613 before top badge names.

## Ranked uncertainty

1. `BEST` chooses the alphabetically first badge within the player's highest
   tier because 2K provides tiers but no ordering within a tier. This is honest
   but not a semantic ranking among equal-tier badges.
2. Zero-badge players show `0 · 0 HOF` rather than `NO BADGES`; consistent row
   geometry won over friendlier copy for this pass.
