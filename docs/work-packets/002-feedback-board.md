# Packet 002 — Feedback Board (restore lost functionality, retro style)

**Branch:** `feat/002-feedback-board`.
**Taste law:** `docs/context/design-direction.md` (10 laws + amendments 1-3).
**Spec context:** `docs/context/design-handoff-retro.md` (screen 6 = the form;
the board below is NEW surface designed to the law, no mock exists).
**Protocol:** `docs/context/builder-protocol.md`.

## Goal

Packet 001's redesign replaced the old Feedback page (typed submissions +
public board with upvoting) with the spec's single-textarea form, silently
dropping the community board. Restore the board **below the blessed form**,
styled to the retro law. The Convex backend is untouched and already serves
everything needed.

## Context

- Convex (`src/convex/feedback.ts`, do NOT modify): `getFeedback` query
  (sorted by upvotes desc, then createdAt desc), `upvoteFeedback` /
  `removeUpvote` mutations (toggle, one vote per visitorId), rows have
  `{type, title, description, status, upvotes, upvoterIds[], createdAt,
  authorName?}`.
- `src/utils/visitorId.js` provides the visitor id (already used by the form).
- The OLD board (pre-redesign reference): `git show cda5708:src/pages/Feedback.jsx`
  — FeedbackList with per-item type badge, title, description, author,
  upvote button with count, hasVoted state.
- The current retro Feedback page (`src/pages/Feedback.jsx`): keep the form
  exactly as blessed (textarea → submitFeedback type "other", title = first
  80 chars). The board renders under it.
- Retro primitives available: `bb-panel`, `bb-btn`, `bb-notch`, `bb-outline-*`,
  fonts `font-press` / `font-pixel` / `font-vt` (see `src/index.css`).

## Contract (acceptance)

1. Board below the form: each entry shows title (Press Start, small),
   description (VT323), type as a small filled chip (lavender, like era
   chips), optional author name, and an upvote control with count.
2. Upvote = toggle via `upvoteFeedback`/`removeUpvote` with the visitor id;
   voted state visibly distinct (action orange — it is a selected state);
   count updates live (Convex reactivity).
3. Sorted as the query returns (upvotes desc). Show all entries; no
   pagination this packet unless trivial.
4. Empty state: a muted VT323 line ("NO FEEDBACK YET — BE THE FIRST").
5. Submitting the form still works unchanged; a new submission appears in
   the board reactively.
6. Styling obeys every design law + amendments (no border-radius, notch
   rings, no new colors, orange only for action/selected, panel skin follows
   time of day).
7. Mobile ≤640px: board stacks cleanly, touch targets ≥40px.
8. `npm run build` green.

## Non-goals

- No Convex schema/function changes; no moderation/status UI; no delete.
- Do not resurrect the old typed-submission form (type picker, title,
  author fields) — the blessed simple form stands. (Flag in hand-up if this
  feels wrong in practice.)
- No changes to any other screen.

## QA discipline (reminder)

Per protocol: do NOT submit real feedback against the dev deployment. To
verify reactivity, use a `[QA-TEST]`-prefixed row and delete it after via the
Convex dashboard/CLI; upvote-toggle QA on existing rows must end in the
toggled-off state.

## Status log

- 2026-07-10 — packet authored (restores functionality lost in packet 001).
- 2026-07-10 — gates green after 1 round (0 blockers, 10 warns accepted/queued); gate report at `docs/artifacts/002-gate-report.md`; PR opened from `feat/002-feedback-board`. One `[QA-TEST]` row remains on dev pending dashboard delete.
- 2026-07-10 — taste pass: everything blessed as-built (amendment 4); QA row
  purged via the new qaCleanup:purgeQaFeedback helper. Merging.
