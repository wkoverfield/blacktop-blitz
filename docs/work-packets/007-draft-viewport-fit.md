# Packet 007 — Draft viewport fit

**Branch:** `fix/draft-viewport-fit`
**Taste law:** `docs/context/design-direction.md` + amendments 1–6.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Keep the complete draft decision loop—round context, both option sets, and
REROLL/NEXT—inside common desktop/laptop viewports without shrinking phone UI
below readable touch size.

## Contract

1. At wide desktop widths (>=1100px), place Player 1 and Player 2 option sets
   side-by-side, with team labels above their respective three-card rows.
2. Scale the wide matchup board only enough to fit available width; keep the
   header and primary actions full-size.
3. On medium tablet/small-laptop widths, retain stacked rows with conservative
   height-aware scaling.
4. Below 768px, preserve the existing readable wrapping/vertical scroll.
5. Do not change card dimensions, interactions, draft state, keyboard rows,
   analytics, or data.
6. On >=768px viewports, the draft shell owns `100dvh` and does not create a
   vertical scrollbar when the fit rules apply.

## Proof

- `npm run build`; `git diff --check`.
- Browser geometry checks for full control visibility and page overflow.
- Pointer/keyboard selection and flip behavior unchanged.

## Status log

- 2026-07-11 — Built and browser-gated. At 1280×720 the first pass removed
  vertical overflow but clipped the 1300px matchup board by 10px per side
  because Chromium ignored calculated `zoom`; replaced with deterministic
  width breakpoints. Re-gate: board 1117.94px wide at x=81.03–1198.97,
  document scrollHeight=clientHeight=720, REROLL/DONE visible. Selection + flip
  interaction check clean. Gate report: `docs/artifacts/007-gate-report.md`.
