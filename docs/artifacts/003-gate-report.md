# Gate Report — Packet 003: Game Feel (keyboard nav, chiptune, star count)

> Branch `feat/003-game-feel`, Linear WKO-29. Gates clean after 1 round.

## Static wall

| Check | Result |
|---|---|
| `npm run build` | PASS |
| Convex typecheck (if touched) | n-a (no Convex changes) |

## Gate agents

| Gate | Verdict | Blockers found → fixed | Warns (accepted) |
|---|---|---|---|
| Taste linter | PASS | 0 → 0 | 2 |
| Adversarial review | PASS | 0 → 0 | 5 |
| Visual review | PASS | 0 → 0 | 5 |

Rounds run: 1. All blockers fixed at root (no papering) — round 1 produced
zero blockers.

### Accepted warns (full list)

Taste:

1. Global `:focus-visible` outline is `#ffb066` on BOTH panel skins
   (`src/index.css:225-227`) — law-legal (laws 1/2/3/6), but light orange on
   cream may read faint on the sunrise/midday skin. Needs one human eyeball;
   a darker selection variant would require a numbered amendment (law 6
   forbids skinning the selection color today).
2. Home menu supersedes the handoff spec's screen-1 detail
   (`src/components/MainMenu.jsx:186-214`): the static ▶ becomes a moving
   cursor, so non-active QUICK PLAY is now cream instead of always-orange.
   Intended by packet acceptance 1; if blessed, append a numbered amendment.

Adversarial:

1. Cross-tab music desync (`src/components/MusicChip.jsx:24-31`): the
   storage listener syncs the chip label but not playback, so a chip can
   read MUSIC OFF while audio keeps playing in another tab.
2. Star-count cache treats an entry with missing/non-numeric `ts` as fresh
   forever (`src/hooks/useGithubStars.js:21-23`, NaN > TTL is false) — a
   corrupt/legacy entry pins a stale count permanently.
3. Arrowing through Query's attribute-rule rows lands on the `<select>`;
   the next ArrowDown natively changes the rule's attribute instead of
   navigating (`src/components/TeamQuery.jsx:313-336` +
   `src/hooks/useKeyboardNav.js:114`) — silent filter mutation mid-walk.
4. Roving-tabindex invariant breaks transiently after reroll/round-advance
   card remounts: fresh tab buttons mount with tabIndex 0 until the next
   arrow keypress rescans (~8 Tab stops where contract 6 promises one).
5. MusicChip mobile hit area is ~28x26px, under the protocol's >=40px
   touch-target floor for a new interactive control.

Visual:

1. Query attribute-rule rows are only partially keyboard-reachable: the
   rule's value input and remove button can never receive focus (roving
   tabindex -1 removes them from Tab order; vertical re-entry always lands
   at col 0). A keyboard user can add a rule but cannot set its value or
   remove it; RESET FILTERS is the working recovery. Contract 2 arguably
   violated on this one row type.
2. Freshly mounted navigable elements enter the DOM with tabindex 0 until
   the next arrow keypress (transient extra Tab stops; observed on Versus
   after a card flip). Self-heals on the next arrow key; arrows-only usage
   unaffected.
3. After NEXT advances a draft round, focus drops to body and the next
   arrow press re-enters at the top (X exit button) instead of near the
   action row — a keyboard-first player loses their place each round.
4. Feedback board upvote-button keyboard nav unverified at runtime: the dev
   board is empty after the packet-002 QA purge. The data-kbnav wiring on
   vote rows is present in code but untested. Not counted against the gate.
5. Method note for the record: `preview_eval` was unavailable in the visual
   review environment, so the flow was driven with trusted keyboard input
   instead of scripted evaluation.

## Artifacts

- `docs/artifacts/003-home-midday.png` — Home, light (midday) skin, cursor + music chip + star count.
- `docs/artifacts/003-home-night.png` — Home, dark (night) skin.
- `docs/artifacts/003-home-focus.png` — Home ▶ cursor on a non-default item (emphasis split visible).
- `docs/artifacts/003-home-mobile.png` — Home at 375px; ★ + count chip, icon-only ♪ music chip.
- `docs/artifacts/003-query-midday.png` / `003-query-night.png` / `003-query-mobile.png` — Query both skins + mobile.
- `docs/artifacts/003-query-submit-focus-wide.png` — focus outline on SUBMIT (wrap target from arrow-nav).
- `docs/artifacts/003-draft-midday.png` / `003-draft-night.png` / `003-draft-mobile.png` — Draft both skins + mobile.
- `docs/artifacts/003-versus-midday.png` / `003-versus-night.png` / `003-versus-mobile.png` — Versus both skins + mobile.
- `docs/artifacts/003-about-midday.png` / `003-about-night.png` — About, star count in the GitHub button.
- `docs/artifacts/003-feedback-midday.png` / `003-feedback-night.png` — Feedback, textarea focus treatment visible.

## Ranked uncertainty (for the human taste pass)

1. **The chiptune loop's vibe** — no gate can hear it; the 20s 8-bar
   Am–F–C–G loop (square lead, triangle bass, noise drums, master 0.12) is
   entirely Wilson's-ear territory, as is the chip copy (♪ MUSIC ON/OFF).
   No screenshot applies — toggle it on the dev server. Recommendation:
   listen for 2-3 loops on Home and one game screen; composition params
   live in `src/lib/chiptune.js` and are cheap to retune.
2. **Home cursor idiom + emphasis split** — the ▶ cursor moves (superseding
   the handoff spec's static ▶), and QUICK PLAY keeps its larger 22px face
   even when the cursor sits on ABOUT/FEEDBACK, so primary emphasis and
   cursor can point at different items. Screenshot:
   `docs/artifacts/003-home-focus.png`. Recommendation: bless as-is and
   append a numbered amendment (moving ▶ is the Home focus idiom; active
   item takes #ffb066); the alternative is the cursor item grows.
3. **`#ffb066` focus outline on the light skin** — the global 3px
   focus-visible outline is one color on both skins and may read faint on
   cream/sunrise panels; it also newly appears when mouse-clicking the
   feedback textarea (browsers treat text fields as always focus-visible).
   Screenshots: `docs/artifacts/003-query-submit-focus-wide.png`,
   `003-feedback-midday.png`. Recommendation: eyeball the light skin; if
   weak, a darker selection variant needs a numbered amendment (law 6
   currently forbids skinning the selection color).

## Deliberate deviations from the design law

- Home menu screen-1 detail superseded: moving ▶ cursor replaces the
  handoff spec's static always-orange QUICK PLAY (packet acceptance 1;
  needs an amendment if blessed).
- Arrow-wrap enabled on every screen, not just Home as the contract
  required — consistent title-screen feel; Query wraps SUBMIT back to Min
  Overall.
- Mobile Home star chip is ★ + count (small rectangle) rather than the
  strictly square icon-only chip — contract allowed either.
- Global `#ffb066` focus outline introduces a visible mouse-click state on
  text fields (new state, sanctioned color).
