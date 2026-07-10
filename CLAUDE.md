# Blacktop Blitz — standing rules for agents

- **Builder protocol:** every subagent building here follows
  `docs/context/builder-protocol.md` (Quilt coordination, proof gates, QA
  discipline, return format). Orchestrators reference it instead of
  re-explaining.
- **Design law:** UI work is bound by `docs/context/design-direction.md` and
  its amendments; the full spec is `docs/context/design-handoff-retro.md`.
  Check the law before generating any UI.
- **Packets:** non-trivial work runs as a packet
  (`docs/work-packets/NNN-*.md`) through the /packet loop: build → taste
  linter + adversarial review + visual review → gate report → PR. Gate agent
  definitions live in `.claude/agents/`.
- **Stack facts:** React 18 + Vite (JSX, no TS in src/), Tailwind, react-router,
  Convex under `src/convex/` (TS, codegen in `src/convex/_generated/`). Static
  wall = `npm run build`. Dev server: `npm run dev` (port 5173).
- **Data:** `public/players.json` is synced daily by CI — never hand-edit it.
  2kratings.com images always load with `referrerPolicy="no-referrer"`.
- **Git:** never commit to `master`; feature branch → PR; push every commit.
