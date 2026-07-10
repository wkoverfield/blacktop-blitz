# Packet 003 — Game Feel: keyboard nav, chiptune music, star count

**Branch:** `feat/003-game-feel`.
**Taste law:** `docs/context/design-direction.md` (10 laws + amendments 1-4).
**Protocol:** `docs/context/builder-protocol.md`.
**Direction (Wilson, verbatim intent):** make it "truly feel like a game" —
navigate the whole app with up/down arrows + Enter ("that would be hella
peak"), add background game music, and show the star count next to STAR ON
GITHUB "because we want people to add to that number."

## Goal

Three additions, no visual redesign:
1. **Keyboard navigation** across every screen: arrow keys move a visible
   cursor/focus, Enter activates. The Home menu is the flagship (▶ cursor
   walks QUICK PLAY / ABOUT / FEEDBACK like a title screen).
2. **Background music**: a generated retro chiptune loop with a persistent
   on/off chip.
3. **GitHub star count** rendered live in the STAR ON GITHUB chip (Home) and
   button (About).

Out of scope: animated backgrounds (Wilson is producing those himself).

## Contract (acceptance)

### Keyboard navigation
1. **Home:** up/down moves the ▶ cursor through QUICK PLAY / ABOUT /
   FEEDBACK (wraps); Enter activates. The ▶ cursor is the focus indicator —
   the mock's static ▶ becomes the moving cursor. Mouse hover moves the
   cursor too (no dual-highlight states).
2. **Query:** up/down walks the interactive rows (min overall, max overall,
   era rows, size row, + ADVANCED FILTERS, advanced rows when open, SUBMIT);
   Enter toggles checkboxes / activates buttons; left/right moves within a
   segment row (game size, position chips, height chips) and
   increments/decrements the focused number input. Focused row gets a
   visible retro indicator (▶ prefix or `#ffb066` treatment — selection
   highlight is the sanctioned color for this).
3. **Draft:** arrows move focus across the six cards grid-aware (up/down
   switches player row, left/right within a row), continuing to REROLL and
   NEXT/DONE; Enter on a card selects it, Enter on a focused card's tab...
   keep it simple: Enter = select, a dedicated key is NOT required for flip
   (tab stays click/tap per amendment 3 — but the tab must be reachable:
   down from a card focuses its tab, Enter flips). Esc exits to Query (same
   as X).
4. **Versus:** arrows walk cards + PLAY AGAIN; Enter on a card's tab flips;
   Enter on PLAY AGAIN restarts.
5. **About/Feedback:** up/down walks links/controls; the feedback textarea
   is NEVER hijacked — arrows/Enter inside a focused text input/textarea/
   select behave natively (Enter in textarea = newline; Esc blurs back to
   nav mode).
6. Implementation must use real DOM focus (roving tabindex), so Tab also
   works and screen readers aren't broken. No focus traps. `:focus-visible`
   styling obeys the law (no border-radius, sanctioned colors only).
7. Keyboard nav must not fight existing shortcuts/scrolling: when no
   navigable element applies (e.g. page scroll on overflow), don't
   preventDefault.

### Music
8. A small Web Audio chiptune engine (`src/lib/chiptune.js`): sequenced
   square-wave lead + triangle bass (+ optional noise percussion), ~8-16 bar
   loop in a minor/pentatonic key, ~90-100 BPM, mixed QUIET (master gain
   ≤ 0.15). No external audio files, no network fetches. Loop must be
   seamless.
9. A `♪ MUSIC` chip next to the clock chip (same notch idiom, Press Start
   8-9px): toggles playback, state persists in localStorage
   (`blacktop-blitz-music`). Default ON, but audio only starts after the
   first user gesture (browser autoplay policy) — until then the chip shows
   the pending state without erroring. No audio on the Draft screen? NO —
   music plays everywhere; the chip hides on Draft like the clock chip but
   playback continues.
10. AudioContext is created once, suspended/resumed on toggle; no console
    errors from autoplay policy; page stays silent when toggled off across
    reloads.

### Star count
11. Fetch `https://api.github.com/repos/wkoverfield/blacktop-blitz` client-
    side, read `stargazers_count`; cache result + timestamp in localStorage
    for 1 hour (avoid the 60/hr unauthenticated rate limit). On any failure
    or while loading, render the chips exactly as today (no count, no error
    UI, no layout shift beyond the count appearing).
12. Count renders inside the existing chip/button (e.g. `★ STAR ON GITHUB ·
    128`), VT323 or Press Start per what reads best at size — obeys the law.
    Mobile icon-only chip on Home shows `★ 128` (icon + count) if it fits
    the square, else stays icon-only.

### General
13. `npm run build` green; no new deps; no Convex changes; analytics
    untouched.
14. Both panel skins + 375px mobile verified; keyboard nav is desktop-first
    (mobile keyboards N/A) but must not break touch.

## Non-goals

- No animated/video backgrounds (Wilson's own follow-up).
- No sourced/licensed audio files; no SFX beyond the music loop this packet
  (menu blip SFX is a natural later packet).
- No gamepad support.

## QA discipline

Per protocol. Music QA: verify with the toggle, leave localStorage clean
(default state) after. Feedback textarea typing check must not submit.

## Status log

- 2026-07-10 — packet authored.
- 2026-07-10 — built: `useKeyboardNav` roving-tabindex hook (data-kbnav row
  maps on Query/Draft/Versus/About/Feedback), bespoke ▶ cursor menu on Home,
  `src/lib/chiptune.js` (8-bar Am–F–C–G loop, square lead + triangle bass +
  noise drums, master 0.12) with ♪ MUSIC chip beside the clock chip, and
  cached GitHub star count in the Home chip + About button. `npm run build`
  green; full keyboard drive of Home → Query → Draft → Versus verified on
  the dev server (both skins + 375px); zero console errors.
- 2026-07-10 — gates clean after 1 round (0 blockers; 2 taste / 5
  adversarial / 5 visual warns accepted — see
  `docs/artifacts/003-gate-report.md`). QA screenshots captured for all six
  surfaces, both skins + mobile. PR opened into master; WKO-29 → In Review.
  Top hand-up items: the chiptune loop's vibe (no gate can hear it), the
  Home ▶ cursor idiom vs. QUICK PLAY emphasis, and the #ffb066 focus
  outline on the light skin.
