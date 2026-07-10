# Handoff: Blacktop Blitz — Retro 16-bit Redesign

> Source: claude.ai/design project `5a78c28b-08cb-4c0a-8146-5abf682fb574`,
> `design_handoff_retro_redesign/README.md`. The interactive mocks
> (`Blacktop Blitz Final.dc.html`, `BB Card.dc.html`) live in that project.
> This file is the committed copy of the spec — the packet's source of truth.

## Overview
A full visual + UX redesign of **Blacktop Blitz** (https://blacktopblitz.com), the NBA 2K Blacktop team randomizer. The redesign replaces the current dark/graffiti look with a 16-bit retro game aesthetic (Pokémon / Stardew Valley influence) built around four pixel-art courtside backgrounds that follow the player's local time of day. The flow is unchanged from the existing app: **Home → Query (filters) → Draft (rounds of 3 options per player) → Versus (team reveal)** plus About and Feedback pages.

## About the Design Files
The design files are **design references created in HTML** — interactive prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs inside the existing Blacktop Blitz codebase** (React 18 + Vite + Tailwind + react-router + Convex) using its established patterns. The prototypes' inline styles translate directly to Tailwind utilities or CSS modules; the prototype's logic class shows the intended state machine.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final and should be recreated pixel-perfectly. Two explicitly-marked exceptions:
1. **Attribute values on card backs / TOP SKILLS chips are placeholders** — real values come from extending the `players.json` sync with nba2kapi attribute data (see Data Requirements).
2. The prototype roster is an 11-player sample; production uses the full `public/players.json` (~1,760 players).

## Design Tokens

### Colors (locked system — one hue, one job)
| Token | Hex | Role |
|---|---|---|
| Ink | `#241436` | Every outline, text-shadow outline, hard shadow, dark text on chips/buttons |
| Deep ink | `#17102a` | Input wells, card tab bars, badge outline ring |
| Cream | `#fdf3dd` | Primary type, panel/card rings on dark |
| Lavender | `#b8a8dd` | Era chips (filled), secondary text |
| Muted | `#8f83ad` | Tertiary text, stat labels |
| Action orange | `#f08a4b` | Buttons, ▶ cursor, selected states — **nothing else is ever orange** |
| Action hover | `#ff9d5c` | Button hover |
| Selection highlight | `#ffb066` | Selected-card ring/name, hover accents, card tab text |
| Team One blue | `#7db8ff` | Player 1 / Team One identity only |
| Team Two coral | `#ff7a9e` | Player 2 / Team Two identity only |
| Panel dark | `rgba(28,15,48,0.9)` | Form panel bg (dusk/night) |
| Panel light | `rgba(253,243,221,0.94)` | Form panel bg (sunrise/midday); ink text on it |
| Card art bg | `#3d2a63` | Art-window fallback, empty OVR-bar blocks |

### Gem tier gradients (rarity only — from current codebase `src/index.css`; never on UI controls)
- Galaxy Opal (97+): `linear-gradient(rgba(75,168,255,0.1), rgba(0,0,0,0.7)), linear-gradient(to bottom left, #188fff, #e1a6e7, #f9a205)` + glow `0 0 14px rgba(249,162,5,0.45)`; accent `#f9a205`
- Diamond (92–94): `linear-gradient(#00aace, #005668)`; accent `#00aace`
- Ruby (87–89): `linear-gradient(#e70000, #810000)`; accent `#ff4d4d` (readable variant)
- Emerald (80–83): `linear-gradient(#05c715, #03630b)`
- Gold (75–79): `linear-gradient(#d6bb5c, #a38829)`
- Full ladder also includes Dark Matter (99), Pink Diamond (95–96, accent `#ff96df`), Amethyst (90–91, `#a51fff`), Sapphire (84–86, accent `#5b7bff`), Silver (70–74, `#a2a2a2`), Bronze (`#cc9900`) — reuse the existing CSS classes.

### Typography (Google Fonts)
- **Press Start 2P** — wordmark, headings, buttons, card names, chips. Sizes: wordmark 64/44px desktop (34/24 mobile, via `clamp()`), screen titles 40px, buttons 16–18px, card names 8–9px, chips 7px, footer 10px.
- **Pixelify Sans** (400–700) — form labels & body: 22–24px.
- **VT323** — data values, stat rows, helper text: 14–28px.
- Original site fonts (Montserrat, arya-double) are fully replaced.

### Outlined-type recipe (the signature look)
Text on artwork gets a hard pixel outline + drop shadow via stacked text-shadows, e.g. wordmark:
`5px 0 0 #241436, -5px 0 0 #241436, 0 5px 0 #241436, 0 -5px 0 #241436, 5px 5px 0 #241436, -5px -5px 0 #241436, 5px -5px 0 #241436, -5px 5px 0 #241436, 10px 12px 0 rgba(20,10,40,0.55)` (outline width scales down with font size: 3–4px at button sizes, 2px at 10–12px).

### Pixel-notch border recipe (no border-radius anywhere)
Panels/buttons/cards use box-shadow "plus-shape" rings instead of borders — corners stay notched:
`0 -5px 0 0 <ring>, 0 5px 0 0 <ring>, -5px 0 0 0 <ring>, 5px 0 0 0 <ring>, 8px 10px 0 rgba(10,5,25,0.5)` (ring = cream on dark, ink on light, `#ffb066` when selected; 3–4px offsets at smaller scales). Inner elements (input wells, chips) use `box-shadow: 0 0 0 2–3px <color>`.

### Backgrounds
`image-rendering: pixelated` on all four court images, `object-fit: cover`. Cross-fade on change: `opacity` transition 1.6s ease between stacked layers. Scrims: draft `rgba(23,13,42,0.7)`, versus `rgba(10,6,26,0.35)`, none on home/query.

## Time-of-Day System
- Four backgrounds: `img/court-sunrise.png`, `court-day.png` (midday), `court-dusk.png`, `court-night.png`.
- **Auto mode (default):** local device clock (`new Date().getHours()`, no permissions): 5–9 → sunrise, 9–17 → midday, 17–21 → dusk, else night.
- **Clock chip** (fixed top-right, all screens except Draft): shows e.g. `DUSK · AUTO`. Click cycles sunrise → midday → dusk → night → back to AUTO. Persist the override (localStorage).
- **Panel skin follows time:** sunrise/midday use the light cream panel + ink text; dusk/night use the dark panel + cream text. Action orange, team colors, and card styling never change.
- Mobile (≤640px): chip drops the `· AUTO` suffix, font 8px, padding 8×10px.

## Screens

### 1. Home
- Full-bleed court bg. No nav bar (title-screen style).
- Centered column, top ~9vh: `BLACKTOP` (cream) / `BLITZ` (orange) wordmark, then `NBA 2K BLACKTOP TEAM RANDOMIZER` (Pixelify 22px cream, 2px outline).
- Bottom third, centered, boxless menu: `▶ QUICK PLAY` (orange `#ffb066`, 22px, static ▶ cursor left + invisible ▶ right for centering), `ABOUT`, `FEEDBACK` (cream 18px, hover → `#ffb066`). Gap 28px.
- Footer: `© 2026 BLACKTOP BLITZ` (10px, centered).
- **GitHub CTA**: bottom-right corner chip — star icon (FaStar, react-icons) + `STAR ON GITHUB` (8px), bg `rgba(23,13,42,0.75)`, 3px cream-50% ring, hover ring `#ffb066`, links to the repo. Mobile: icon-only 11px-padding square.

### 2. Query
- Nav: two-line wordmark top-left (12px, links home). No other nav links.
- Title `QUERY` (40px outlined), then the skin-aware panel (600px max, 5px ring, 30px padding, 24px gap):
  - `Min Overall:` / `Max Overall:` labels (Pixelify 24px) + right-aligned input wells (96px, VT323 28px, value color `#ffb066` dark / `#c05a28` light).
  - `Current` / `Classic` / `All-Time` rows with 22px pixel checkboxes (well bg, 3px ring; checked = 14px `#f08a4b` inner square). Maps to `teamType` curr/class/allt.
  - Game size segments `1V1…5V5` (Press Start 11px, selected = orange bg + ring; unselected = transparent + 40%-ring).
  - **`+ ADVANCED FILTERS` toggle** (Press Start 10px, accent color) — expands section under a dotted divider (`2px dotted rgba(143,131,173,0.5)`):
    - `Position:` — PG/SG/SF/PF/C multi-select chips (same segment styling, 9px).
    - `Min height:` — `ANY / 6'6"+ / 6'10"+ / 7'0"+` single-select chips (parse height strings to inches).
    - `Team:` — text input, case-insensitive substring match on team name.
    - `Attribute rules:` — repeatable rows `[attribute select] ≥ [number input] [X]` + `+ ADD RULE` chip. Rules AND together. Prototype covers the 6 category ratings; production select should include **every nba2kapi attribute** once data lands.
    - `RESET FILTERS` (VT323 20px, dotted underline, hover orange).
  - Live count line: `N PLAYERS MATCH` (VT323 20px muted); `CHECK AT LEAST ONE ERA` when no era selected.
- `SUBMIT` button (orange, 18px, 20×56px padding) — 45% opacity + no-op unless: ≥1 era AND filtered count ≥ 2×gameSize.

### 3. Draft (replaces the MUI modal)
- Court bg + `rgba(23,13,42,0.7)` scrim. Clock chip hidden here.
- Header (max 1100px): 43px spacer left · center `ROUND n` (28px outlined; append ` (FINAL)` on last round) over `Each person drafts one player` (VT323 22px `#d9c9f0`) · `X` button right (outlined chip, exits to Query).
- Two rows: `PLAYER 1 PICKS` (blue, Press Start 12px, 110px column) / `PLAYER 2 PICKS` (coral), each followed by 3 **draft-density cards** (24px gap, wraps).
- Bottom action row (centered, 20px gap): `REROLL` (secondary — transparent, 4px cream-55% ring, 12px text) + `NEXT`/`DONE` (primary orange, 16px; 45% opacity until both players selected).
- Round loop: N rounds for NvN; options re-randomize each round excluding already-picked players; selections/flips reset between rounds.

### 4. Versus
- Court bg + light scrim. Wordmark nav (home).
- `TEAM ONE` (blue 17px outlined) above its card row · full-width VS divider (4px cream-50% lines flanking `VS` 36px outlined cream) · `TEAM TWO` (coral) + row · `PLAY AGAIN?` (orange) → Query.
- Teams render **reveal-density cards**. Rows wrap; at 5v5 on phone collapse to **roster rows** (see card spec).

### 5. About
- Title + skin panel (640px): the existing site's About copy verbatim; two orange buttons with 16px icons: `★ STAR ON GITHUB` → repo, `♥ BUY ME A COFFEE` → buymeacoffee.com/wkoverfield (both `target="_blank"`).

### 6. Feedback
- Title + skin panel (600px): `Your feedback:` label, textarea (150px, well styling, VT323 22px, placeholder "Bugs, ideas, players we're missing..."), `SEND` (orange). On send → clear + `THANKS! FEEDBACK SENT.` (Press Start 10px, `#05c715`). Wire to the existing Convex `feedback` mutation.

## The Player Card (`BB Card.dc.html`) — one design, three densities
196px wide; tier-gradient frame (6px padding) inside the notch ring (ink; selected → `#ffb066` ring + `0 0 26px rgba(255,176,102,0.55)` glow); inner face `#241436`.

**Front, top-to-bottom:** header (2-line name, Press Start 8px, cream — selected → `#ffb066` with `▶ ` prefix; overall badge: tier gradient, 3px `#17102a` ring, Press Start 11px white) · art window (100px, player photo `filter: saturate(1.3) contrast(1.12)` + overlay `linear-gradient(180deg, rgba(240,138,75,0.12), rgba(61,42,99,0.38))`, team logo 26px bottom-right with `drop-shadow(2px 2px 0 rgba(20,10,40,0.6))`) · chip row (era = filled lavender chip; position = outlined chip, both Press Start 7px) · dotted stat rows `HEIGHT`, `TEAM` (labels VT323 15px muted, values 17px cream, `2px dotted rgba(143,131,173,0.4)` separators).

- **Draft density** (344px tall): stops there + STATS tab.
- **Reveal density** (404px tall): adds `TIER` row (value in tier accent), `OVR` 10-block pixel bar (filled = round(overall/10), color = tier accent, empty = `#3d2a63`), and **TOP SKILLS** row — player's 3 best attributes as chips (`#17102a` well, 2px ring, abbrev Press Start 7px muted + value VT323 17px colored by the value's own tier bracket). Abbrevs: INS, 3PT (outside), PLY, ATH, DEF, REB.
- **Roster row** (phone 5v5 versus only): 3px tier frame strip · 40px photo thumb · name (8px, ellipsis) + `POS | HEIGHT · ABBR` line · overall badge · optional 34px `+` info button. Tap expands to full card.

**Back (flip):** same frame/header · `ATTRIBUTES` divider (Press Start 8px between 2px lines) · six category rows with 10-block bars (block color = that value's tier bracket) · footnote `* placeholder values pending attribute data` (remove once real data lands) · tab.

**Interaction contract:** card body click = **select** (draft only; toggle, one per player per round). `▲ STATS` / `▼ ART` tab (full-width bottom bar, `#17102a`, `#ffb066` 8–9px text, ≥40px tall on touch) = **flip**: 3D rotateY 0.55s `cubic-bezier(0.34,1.56,0.64,1)`, `perspective: 1200px`, `backface-visibility: hidden`. Desktop hover = non-pinned flip peek (enter/leave); the tab is the primary affordance since touch has no hover.

## State Management (mirror of the prototype's logic class)
- `screen`: home | query | draft | versus | about | feedback (react-router routes: `/`, `/qplay`, about, feedback — draft/versus are `/qplay` states as today)
- Time: `todOverride` (null = auto), minute tick to refresh auto mode
- Query: `minOv`, `maxOv`, era booleans, `size`, `advOpen`, `pos{}`, `minHt`, `teamQ`, `advRules[{attr,min}]` → derived `filteredPlayers`, `canSubmit`
- Draft: `round`, `options1/2`, `sel1/2`, `picked1/2`, `flipped{}` (keyed per card instance)
- `isMobile` (≤640px, resize listener — same breakpoint the current Navigation.jsx uses)
- Data: `public/players.json` (existing daily sync); keep existing Convex analytics events (draft_started, player_selected, draft_completed, etc.)

## Data Requirements (new, NOT this packet)
Extend the nba2kapi sync to include, per player: six category ratings (INS/OUT/PLY/ATH/DEF/REB), the full attribute list, badges, weight, wingspan, archetype. This powers: real card-back bars, TOP SKILLS chips, and the full advanced-filter attribute select. Until then the UI works on placeholder category ratings (deterministic hash from player name, like the prototype's `attrsFor`).

## Assets
- `public/img/court-sunrise|day|dusk|night.png` — pixel-art backgrounds (committed with this packet)
- Player photos + team logos: hot-linked from 2kratings.com — **must** load with `referrerPolicy="no-referrer"` (existing pattern in the repo)
- Icons: star/heart from react-icons (FaStar, FaHeart — already dependencies)
