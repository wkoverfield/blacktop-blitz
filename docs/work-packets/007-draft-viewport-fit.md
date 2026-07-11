# Packet 007 — Draft viewport fit

**Branch:** `fix/draft-viewport-fit`
**Taste law:** `docs/context/design-direction.md` + amendments 1–6.
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Keep the complete draft decision loop—round context, both option sets, and
REROLL/NEXT—inside common desktop/laptop viewports without shrinking phone UI
below readable touch size.

## Contract

1. At wide desktop widths, stage Player 1 upper-left and Player 2 lower-right,
   with labels above their respective three-card rows.
2. On short desktop/tablet heights, use a true compact card density: smaller
   art and progressive secondary-detail removal, never uniform zoom.
3. On medium tablet/small-laptop widths, retain stacked rows with the same
   height-aware compact density.
4. Below 768px, preserve the existing readable wrapping/vertical scroll.
5. Do not change card interactions, draft state, keyboard rows, analytics, or
   data. Compact dimensions are responsive presentation only.
6. On >=768px viewports, the draft shell owns `100dvh` and does not create a
   vertical scrollbar when the fit rules apply.

## Proof

- `npm run build`; `git diff --check`.
- Browser geometry checks for full control visibility and page overflow.
- Pointer/keyboard selection and flip behavior unchanged.

## Status log

- 2026-07-11 — Initial horizontal six-card strip passed geometry but failed
  Wilson's taste pass: flattened player ownership and left a dead lower court.
  Redirected to a diagonal versus composition with responsive compact card
  density. At 1280×720, P1 occupies x=20–640/y=111–391 and P2 occupies
  x=640–1260/y=301–581; actions end at y=649; no document or card-face
  overflow. Final gate evidence: `docs/artifacts/007-gate-report.md`.
