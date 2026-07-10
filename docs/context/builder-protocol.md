# Builder Protocol

The standing contract every subagent building in this repo follows. Referenced by
CLAUDE.md so it never has to be re-explained in a prompt. Cross-project frame:
`~/wilson-vault/Projects/Builder Workflow Improvement Plan.md`.

## Roles & the loop (universal)

Context → build → review → QA → human taste → merge. Each handoff carries its
named proof. No handoff without proof.

## Quilt — same-checkout coordination (universal)

One shared checkout; subagents coordinate via Quilt, never worktrees.

- **Whole-file claims BEFORE the first edit.** Symbol claims on non-top-level
  symbols are granted but don't bind attribution (bug) — claim whole files.
- **Never `commit_mine` with `includeUnclaimed`** — mid-flight hunks read as
  unclaimed (attribution lag); sweeping them is data loss.
- **On denial:** read `holderIntent`; drop / adapt / retry 60–90s (~5×) then
  layer on top / escalate if opposed. Never force.
- **Claim TTL ~10 min** — re-claim before a late pass; claims lapse silently
  while blocked. `commit_mine` auto-releases; a following `release` returning 0
  is expected.
- **KNOWN #1 BUG — stale-ledger blocker:** a dead actor can "own" long-committed
  lines and hard-block `commit_mine`. After 2 retries: escalate with the file
  list, keep claims, stop. Orchestrator lands it via verified manual commit +
  `resolve`-with-note.
- **HEAD/branch is a shared global Quilt doesn't arbitrate.** Only the
  orchestrator moves branches, never out from under a live human preview.

## Proof gates (universal shape, adapted to this stack)

- This repo has **no lint/typecheck scripts**; the static wall is
  `npm run build` (Vite) on the whole tree — it catches JSX/syntax/import
  errors. Convex functions typecheck via `npx convex dev --once` if touched
  (they are TS under `src/convex/`).
- Per actor before commit: `npm run build` clean, or at minimum confirm your
  files parse (Vite dev overlay clean on the surfaces you touched).
- Mid-wave, concurrent edits can break the repo-wide build — verify your own
  files; the orchestrator runs the full build at wave-end.
- **Fresh-tree evidence only.** A bug counts only if it reproduces on a fresh
  load of the committed tree — not HMR/half-compiled/another agent's mid-edit.
- **Commit generated files with the change that caused them** — codegen path:
  `src/convex/_generated/`.

## QA discipline

- This app has no accounts. The only user-writable surface is the Feedback
  form (Convex `feedback:submitFeedback`) and analytics events.
- **QA never submits the Feedback form.** Type into it, verify styling/state,
  then clear — do not hit SEND against the dev deployment. If a submit is
  unavoidable to prove the success state, prefix the title/description with
  `[QA-TEST]` and tear down afterward with the permanent helper:
  `npx convex run qaCleanup:purgeQaFeedback` (src/convex/qaCleanup.ts).
  Leave nothing behind.
- Player data is static `public/players.json` — no seeding needed.
- One dev server per checkout (`npm run dev`, port 5173) — never kill a dev
  server you didn't start. Each QA agent uses its own browser context.

## Artifacts (universal)

Screenshots → `docs/artifacts/<packet>-<surface>-<variant>.png`. For this repo
"variant" is the time-of-day skin (at minimum `night` and `midday` — the two
panel skins) for any taste-gated surface. They double as visual-regression
baselines. New baselines are committed only after Wilson approves the look.

## Quality gates — MANDATORY before the human taste pass (universal)

The point: tier-1 verification never reaches the human.

1. **Taste linter** — reviewer lens: "here is the taste law
   (`docs/context/design-direction.md` + amendments); list every violation in
   this diff with file:line and the rule it breaks." Fix before the human sees
   it. Agent definition: `.claude/agents/taste-linter.md`.
2. **Adversarial review** — prompt reviewers to BREAK the work, not bless it.
   Agent definition: `.claude/agents/adversarial-reviewer.md`.
3. **Visual review** — drive the running app, capture each touched surface in
   both panel skins, compare against `docs/artifacts/` baselines; flag
   layout/hierarchy deltas. Agent definition: `.claude/agents/visual-reviewer.md`.

## Return format (universal)

Not "done." Hand up: files changed (one line each); proof; commit sha + surgical
check (or escalation ids); **and the uncertainty section — the 2-3 calls you're
least sure about, ranked, with screenshots if visual.** Make the human review the
uncertainty, don't make them hunt.
