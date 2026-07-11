# Gate Report — Packet 007: draft viewport fit

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `git diff --check` | PASS |

## Review lenses

| Gate | Verdict | Findings |
|---|---|---|
| Taste linter | PASS | Rejected six-card strip replaced by intentional diagonal versus composition. Player ownership is spatially distinct; court space is occupied without decorative filler. Existing card/tier/team laws unchanged. |
| Adversarial review | PASS | Mobile <768px retains scrolling/full-size controls. Compact mode progressively removes PHYS, back extras, then TOP only on very short non-phone screens. Keyboard/interaction DOM order unchanged. |
| Visual/interaction review | PASS after 1 fix | Initial diagonal pass exposed 2px back-face overflow at 250px density; category padding tightened 1px per side. Re-gate clean on all twelve faces. |

## Ranked uncertainty

1. At <=800px high, compact fronts prioritize HEIGHT/TEAM over PHYS/TOP and
   compact backs prioritize the six category bars over badge/origin extras.
   This is intentional progressive disclosure, but it is the strongest density
   tradeoff in the packet.
2. Explicit viewport emulation remains unavailable; the live browser's
   authoritative surface was 1280×720.

## Final geometry — 1280×720

- Document: `clientHeight=scrollHeight=720`; no vertical overflow.
- Player 1: x `20–640`, y `111–391`.
- Player 2: x `640–1260`, y `301–581`.
- Actions: REROLL bottom `646`, DONE bottom `649`; both visible.
- Six draft cards × two faces: each inner face `238px` client/scroll height;
  zero overflow.
