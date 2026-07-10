# Gate Report — Packet NNN: <name>

> Copy to `docs/artifacts/NNN-gate-report.md` and fill. Committed with the PR;
> the PR body carries the summary. No PR leaves draft without a green report.

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS / FAIL |
| Convex typecheck (if touched) | PASS / FAIL / n-a |

## Gate agents

| Gate | Verdict | Blockers found → fixed | Warns (accepted) |
|---|---|---|---|
| Taste linter | | | |
| Adversarial review | | | |
| Visual review | | | |

Rounds run: N. All blockers fixed at root (no papering).

## Artifacts

- `docs/artifacts/<packet>-<surface>-<variant>.png` — one line per capture.

## Ranked uncertainty (for the human taste pass)

1. **<call>** — why unsure; screenshot; recommendation.
2. …

## Deliberate deviations from the design law

- (none) / list, each with the reason — these need an explicit ruling.
