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

1. **2026-07-10 — Dark Matter accent is `#b297ff`.** The tier-accent ladder
   extends to 99-overall Dark Matter with this violet. It colors the TIER
   value, OVR-bar fill, and value brackets on 99 cards, same as every other
   tier accent. (Ruled: packet 001 taste pass.)
2. **2026-07-10 — Query warm-starts with Current era pre-checked.** The form
   loads submittable instead of dead-empty. (Ruled: packet 001 taste pass.)
3. **2026-07-10 — Card flip is tap/click on the tab ONLY.** No
   hover-triggered flipping on any device — hover peek is removed from law 9.
   The full-width `▲ STATS` / `▼ ART` tab is the single flip affordance and
   must read as tappable (contrasting bar, accent text, cursor pointer,
   ≥40px touch height). On the phone 5v5 roster row, tap toggles
   expand/collapse of the full card. (Ruled: packet 001 taste pass.)
4. **2026-07-10 — Feedback board idioms blessed as-built.** The board's 3px
   solid row divider and the outlined `THE BOARD` heading are legal idioms
   for stacked-panel surfaces; muted lavender `#8f83ad` is the universal
   secondary color on BOTH panel skins (no light-skin variant); the
   title-echo rendering on simple submissions is accepted. (Ruled: packet
   002 taste pass — "it all looks good.")
5. **2026-07-11 — Draft cards are scouting summaries.** Draft-density fronts
   may show the compact physical profile and TOP SKILLS used by reveal cards;
   card backs may continue below category bars with real badge/origin rows.
   Added information must aid a pick, use existing row/chip idioms, and never
   change the one-card/three-density or tab-only-flip laws. (Packet 006.)
6. **2026-07-11 — Completion green is `#05c715`.** A filled green chip with
   deep-ink text/ring is reserved for completed system state (`✓ FIXED`), not
   actions, selection, decoration, or rarity values. It must remain visually
   distinct from lavender feedback-type chips. (Ruled after packet 006.)
7. **2026-07-11 — Draft uses the viewport before the scrollbar.** At wide
   desktop widths, Player 1 stages upper-left and Player 2 lower-right like a
   versus lineup; labels sit above each three-card set. Short viewports use a
   true compact draft density (smaller art, progressive secondary-detail
   removal), never a uniformly shrunken six-card strip. Phones keep readable
   cards and may scroll. Interaction contracts remain unchanged. (Packet 007.)
8. **2026-07-11 — Player names are dossier doors.** Full-card player names
   may act as external links to the exact nba2kapi version. Hover/focus shows a
   compact hard-edged preview; tap/click opens the dossier without selecting or
   flipping the card. The popover reuses existing ink/lavender/action tokens
   and never becomes a second card. (Packet 008.)
