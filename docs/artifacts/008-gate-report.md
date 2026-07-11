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
| Adversarial review | PASS | Link stops card click propagation, opens with `noopener noreferrer`, encodes slug/type/team, and falls back to a safe name slug. Touch taps directly; keyboard focus reveals the same preview. |
| Visual/interaction review | PASS | Preview is absolute and adds no card height. Six cards × two faces retain 238px client/scroll parity at 1280×720. About remains `clientHeight=scrollHeight=720`. |

## Data/link proof

- 1,741/1,741 records with slug; 1,741 unique slugs.
- Versioned Hakeem URL returned HTTP 200 and resolved to the expected dossier.
- Runtime sample link encoded current John Collins + Detroit Pistons exactly.
- Focus/click state: tooltip visible (`opacity=1`, `visibility=visible`), parent
  draft card remained `aria-pressed=false`.
- About exposes `https://nba2kapi.com/` and `https://www.2kratings.com/`.

## Ranked uncertainty

1. The preview summarizes already-loaded card data rather than embedding a live
   screenshot of nba2kapi. This keeps hover instant and avoids cross-site iframe
   fragility; the click is the full-fidelity handoff.
2. Name fallback URLs are best-effort only; current production coverage is
   100%, so fallback is defensive rather than exercised.
