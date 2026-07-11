# Gate Report — Packet 008: nba2kapi profile links

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `git diff --check` | PASS |

## Review lenses

| Gate | Verdict | Findings |
|---|---|---|
| Taste linter | PASS | Player-name dotted underline is the signifier; hover/focus overlay uses existing deep ink, lavender ring, hard offset, and action highlight. No second-card visual or new color job. About credit uses the existing divider/link idiom. |
| Adversarial review | PASS after 1 fix | Human preview caught the pointerless popover CTA. Popover now accepts pointer events, starts flush beneath the name (no hover gap), contains a real dossier link, and stops card propagation. Both links use `noopener noreferrer`, encode slug/type/team, and retain name fallback. |
| Visual/interaction review | PASS | Preview is absolute and adds no card height. Six cards × two faces retain 238px client/scroll parity at 1280×720. About remains `clientHeight=scrollHeight=720`. |

## Data/link proof

- 1,741/1,741 records with slug; 1,741 unique slugs.
- Versioned Hakeem URL returned HTTP 200 and resolved to the expected dossier.
- Runtime sample link encoded current John Collins + Detroit Pistons exactly.
- Focus/click state: tooltip visible (`opacity=1`, `visibility=visible`), parent
  draft card remained `aria-pressed=false`.
- Interactive CTA re-gate: 12 real CTA anchors found; first remained visible
  before/after focus travel, activated normally, and parent card stayed
  `aria-pressed=false`.
- About exposes `https://nba2kapi.com/` and `https://www.2kratings.com/`.

## Ranked uncertainty

1. The preview summarizes already-loaded card data rather than embedding a live
   screenshot of nba2kapi. This keeps hover instant and avoids cross-site iframe
   fragility; the click is the full-fidelity handoff.
2. Name fallback URLs are best-effort only; current production coverage is
   100%, so fallback is defensive rather than exercised.
