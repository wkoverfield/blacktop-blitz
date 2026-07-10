# Design Direction — Blacktop Blitz (retro 16-bit)

The taste law. Every UI diff is checked against this doc by the taste-linter
gate. Full spec + per-screen detail: `docs/context/design-handoff-retro.md`.
Amendments are numbered and appended at the bottom; they ENFORCE, not document.

## Laws

1. **One hue, one job.** Colors come from the locked token table in the handoff
   doc. Action orange (`#f08a4b` / hover `#ff9d5c` / highlight `#ffb066`) is for
   actions and selection ONLY — nothing decorative is ever orange. Team blue
   `#7db8ff` = Player/Team One only; coral `#ff7a9e` = Player/Team Two only.
   Gem-tier gradients appear on rarity surfaces (card frames, badges, tier
   values) only — never on UI controls.
2. **No border-radius anywhere.** Corners are notched via the box-shadow
   plus-ring recipe, or square. `rounded-*` classes and `border-radius` are
   violations.
3. **No soft shadows.** Shadows are hard-edged (0 blur) offsets in ink, except
   the two specified glows (Galaxy Opal, selected card).
4. **Type is three faces only:** Press Start 2P (display/buttons/chips),
   Pixelify Sans (form labels/body), VT323 (data values/helper). Montserrat and
   arya-double must not appear on redesigned surfaces.
5. **Text on artwork always gets the outlined-type recipe** (stacked hard
   text-shadows in ink, width scaled to font size). No unoutlined text sits
   directly on a court background.
6. **Panel skin follows time of day** (sunrise/midday light cream + ink text;
   dusk/night dark + cream text). Card styling, action orange, and team colors
   never change with time.
7. **Pixel rendering:** court backgrounds use `image-rendering: pixelated` and
   cross-fade via stacked opacity layers (1.6s ease). Scrims exactly as spec'd
   (draft `rgba(23,13,42,0.7)`, versus `rgba(10,6,26,0.35)`, none elsewhere).
8. **The card is one component, three densities** (draft 344px / reveal 404px /
   roster row). Never fork a second card design.
9. **Interaction contract:** card body = select (draft only), bottom tab =
   flip. The tab is the primary flip affordance (≥40px tall on touch); desktop
   hover peek is additive, never required.
10. **Copy is in caps where the spec caps it,** Press Start sizes match the
    spec's px values (it's a bitmap face — arbitrary sizes look wrong).

## Amendments

(none yet — first taste pass pending)
