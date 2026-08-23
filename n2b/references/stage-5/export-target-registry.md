# Export Target Registry

<!-- Consumers of this reference:
     - n2b/workflows/stage-5/export.md   (Step 0: target resolution — direct-arg validation,
       picker rendering, per-target routing; Step 2.5: Needs backlog.json column decides the
       conditional backlog-builder spawn; Step 3: Formatter agent + Template columns drive the
       formatter spawn; Step 6: Consumer-Native Next Steps entry + remaining-implemented-targets
       list in the EXPORT COMPLETE banner)
     - n2b/references/stage-5/fidelity-rules.md  (per-target parameter table keyed by Target key)
     - Each later WP5 phase adds its target's row and flips it to v1 as it ships.

     This is a shared read-only reference in the pipeline-gatekeeper.md mold: it contains no
     executable code. The export workflow @-includes it and executes its resolution and
     rendering rules inline. The table columns and the picker copy below are pinned as
     contract C-27 (docs/stage-reviews/contracts.md). -->

The registry is the plugin table for Stage 5 (Export). Every export target the pipeline can
render is one row here. The export workflow iterates this table — it never hardcodes a target
list, an output directory, or an agent path. The fidelity gate, receipts, tracking, and
staleness logic are all target-agnostic; they read this table.

---

## Registry Table

| Target key | Consumer category | Formatter agent | Template | Output dir | Needs backlog.json | Status |
|---|---|---|---|---|---|---|
| `dev-brief` | A dev team (humans) | `n2b/agents/stage-5/export-dev-brief-formatter.md` | `n2b/templates/stage-5/export-dev-brief.md` | `.n2b/exports/dev-brief/` | no | v1 |
| `jira` | A project tracker | `n2b/agents/stage-5/export-jira-formatter.md` | `n2b/templates/stage-5/export-jira.md` | `.n2b/exports/jira/` | yes | v1 |
| `github-issues` | A project tracker | — | — | `.n2b/exports/github-issues/` | yes | future |
| `linear` | A project tracker | — | — | `.n2b/exports/linear/` | yes | future |
| `backlog` | A project tracker | `n2b/agents/stage-5/export-backlog-formatter.md` | `n2b/templates/stage-5/export-backlog.md` | `.n2b/exports/backlog/` | yes | v1 |
| `agent-workspace` | An AI coding agent | `n2b/agents/stage-5/export-agent-workspace-formatter.md` | `n2b/templates/stage-5/export-agent-workspace.md` | `.n2b/exports/agent-workspace/` | no | v1 |
| `speckit` | An AI coding agent | `n2b/agents/stage-5/export-speckit-formatter.md` | `n2b/templates/stage-5/export-speckit.md` | `.n2b/exports/speckit/` | no | v1 |
| `kiro` | An AI coding agent | — | — | `.n2b/exports/kiro/` | no | future |
| `prd` | An AI coding agent | `n2b/agents/stage-5/export-prd-formatter.md` | `n2b/templates/stage-5/export-prd.md` | `.n2b/exports/prd/` | no | v1 |
| `lovable-pack` | A browser app builder | `n2b/agents/stage-5/export-vibe-pack-formatter.md` | `n2b/templates/stage-5/export-vibe-pack.md` | `.n2b/exports/lovable-pack/` | no | v1 |
| `v0-pack` | A browser app builder | `n2b/agents/stage-5/export-vibe-pack-formatter.md` | `n2b/templates/stage-5/export-vibe-pack.md` | `.n2b/exports/v0-pack/` | no | v1 |
| `bolt-pack` | A browser app builder | `n2b/agents/stage-5/export-vibe-pack-formatter.md` | `n2b/templates/stage-5/export-vibe-pack.md` | `.n2b/exports/bolt-pack/` | no | v1 |
| `replit-pack` | A browser app builder | `n2b/agents/stage-5/export-vibe-pack-formatter.md` | `n2b/templates/stage-5/export-vibe-pack.md` | `.n2b/exports/replit-pack/` | no | v1 |

### Column definitions

- **Target key** — the direct-argument form: `/n2b:s5-export {target-key}`. Keys are stable
  identifiers; renaming one breaks users' muscle memory and completion-banner teaching.
- **Consumer category** — one of the four level-1 picker categories (below, byte-exact).
- **Formatter agent / Template** — repo-relative source paths, filled only when the target's
  phase ships. `future` rows keep `—`; the implementing phase fills both cells following the
  established naming pattern (`export-{target-key}-formatter` agent + `export-{target-key}`
  template under the stage-5 directories). Rows may share cells when one formatter serves
  several keys: the four `*-pack` rows all point at the shared `export-vibe-pack-formatter` /
  `export-vibe-pack` pair (decision 102 D1 — the packs are ~70% identical and diverge only in
  per-tool wrapper files, so one generator keyed on the resolved target beats four
  near-duplicates).
- **Output dir** — always `.n2b/exports/{target-key}/`. Per-target refresh deletes exactly
  this directory and nothing else (pipeline-gatekeeper.md, Per-Stage Re-run Cleanup row 5).
- **Needs backlog.json** — `yes` means the workflow spawns `n2b/agents/stage-5/backlog-builder.md`
  (schema: `n2b/references/stage-5/backlog-schema.md`, contract C-26) before the formatter and
  the formatter consumes the built `backlog.json`. `no` means the backlog build is skipped
  entirely for that run. `jira` and `backlog` (WP5 Phase 4) are the first v1 targets that
  need it — their runs are the Backlog Builder's live spawns; every earlier v1 target
  renders without it.
- **Status** — `v1` = implemented and offered; `future` = documented here for planning, never
  shown in the picker, and rejected as a direct argument with a "not yet available" message
  that lists the implemented keys.

---

## Picker UX Contract (C-27)

Bare `/n2b:s5-export` opens a two-level picker. The copy below is the UX contract — the
workflow renders it verbatim (subject only to the rendering rules that follow).

**Entry banner statement** (shown before level 1):

> Each run produces ONE export format. Run /n2b:s5-export again anytime for another — the
> package is never consumed.

### Level 1 — header `Export for`, question "Who will use this export?"

1. **A dev team (humans)** — "You get: a readable build brief — executive summary, role-based
   reading order ('PM start here, backend read part F'), all specs and architecture organized
   into chapters, plus one combined file for PDF/print. Best if you're handing this to an
   agency or in-house engineers." → runs `dev-brief`, no level 2.

2. **A project tracker** — "You get: your features as epics and every spec as a story with
   its Given/When/Then acceptance criteria intact, the dependency graph, and a per-tracker
   import guide — as a canonical backlog.json plus a CSV most trackers import directly. Best
   if a delivery team will run this as a sprint backlog." → level 2: Jira (`jira`) /
   GitHub Issues (`github-issues`) / Linear (`linear`) / Generic backlog file (`backlog`).

   Level-2 variant copy (rendered per rendering rule 2 — implemented variants only; with
   `jira` and `backlog` both v1, this category has two implemented variants, so level 2
   renders the entries below; `github-issues` and `linear` stay `future` and unlisted until
   their phases ship):

   - **Jira** (`jira`) — "You get: a Jira-ready CSV — every feature an epic, every spec a
     story with its Given/When/Then acceptance criteria intact, parent links and blocking
     links wired, descriptions in Jira's own markup — plus a canonical backlog.json and a
     step-by-step import guide. Best if your delivery team runs the build in Jira."

   - **Generic backlog file** (`backlog`) — "You get: a canonical backlog.json carrying every
     epic, story, acceptance criterion and dependency edge, plus a flat CSV most trackers
     import directly and a README covering what each tracker keeps and drops. Best if you use
     a tracker other than Jira, or want an AI agent to load the backlog for you."

3. **An AI coding agent** — "You get: spec files a coding agent builds from autonomously —
   Claude Code, Cursor, GitHub Spec Kit, Kiro, or Devin — with build order, a machine-checkable
   feature list, and 'done means these criteria pass' rules. Best if AI will write the code."
   → level 2: Agent workspace (`agent-workspace`) / Spec Kit bundle (`speckit`) /
   Kiro specs (`kiro`) / Single PRD (`prd`).

   Level-2 variant copy (rendered per rendering rule 2 — implemented variants only; with
   `agent-workspace`, `speckit`, and `prd` all v1, this category has three implemented
   variants, so level 2 renders the entries below; `kiro` joins the menu when its phase
   ships):

   - **Agent workspace** (`agent-workspace`) — "You get: a repo-shaped workspace — the
     complete blueprint verbatim under `docs/blueprint/`, an AGENTS.md every major coding
     agent reads natively (with a CLAUDE.md bridge for Claude Code), a machine-checkable
     feature_list.json where every item starts `passes: false`, a dependency-ordered
     BUILD-ORDER.md, operating rules, a progress log, and a Devin playbook. Best if a
     repo-based agent — Claude Code, Cursor, Copilot, Windsurf, or Devin — will build the
     product across many sessions."

   - **Spec Kit bundle** (`speckit`) — "You get: a ready-made GitHub Spec Kit workspace —
     one pre-authored spec per feature in build order with every acceptance criterion
     intact, a project constitution carrying your scope and architecture rules, and the
     full blueprint under `docs/blueprint/` — you skip /speckit.specify and go straight to
     /speckit.plan. Best if you build with Spec Kit's spec-driven workflow."

   - **Single PRD** (`prd`) — "You get: a consolidated PRD.md (Task Master's parse-prd
     format with numbered requirements) plus architecture.md (the pair BMAD v6 ingests
     directly), with the full blueprint alongside for reference. Best if your tool wants
     one PRD document — Task Master, BMAD, or a chat-attach planning session."

4. **A browser app builder** — "You get: a compact project-knowledge brief (fits Lovable's
   10k-char limit) plus a ready-made prompt sequence — one prompt per feature, in build order —
   for Lovable, v0, Bolt, or Replit. Best if you'll build by prompting in a browser tool."
   → level 2: per-tool packs — Lovable (`lovable-pack`) / v0 (`v0-pack`) / Bolt (`bolt-pack`) /
   Replit (`replit-pack`).

   Level-2 variant copy (rendered per rendering rule 2 — implemented variants only; with all
   four `*-pack` targets v1 together, this category has four implemented variants, so level 2
   renders the entries below):

   - **Lovable** (`lovable-pack`) — "You get: a paste-first Lovable pack — a distilled
     KNOWLEDGE.md sized to fit the 10,000-character Knowledge field, a Plan-mode seed plus
     one build prompt per feature in build order, an AGENTS.md to commit once Lovable
     creates your repo (Lovable has no repo or ZIP import), and the full blueprint alongside
     for reference. Best if you build by prompting in Lovable and want its Knowledge field
     carrying the product context."

   - **v0** (`v0-pack`) — "You get: a v0-ready pack — KNOWLEDGE.md to attach as a project
     Source, a short INSTRUCTIONS.md to apply as a v0 Instruction, a Plan-mode seed plus one
     build prompt per feature (v0 queues up to 10 prompts), and the full blueprint — the
     bundle imports via ZIP or GitHub. Best if you're building on v0's native Next.js /
     React / Tailwind / shadcn stack."

   - **Bolt** (`bolt-pack`) — "You get: a GitHub-importable Bolt pack — agents.md as the
     auto-found entry point with a legacy .bolt/prompt mirror, a .bolt/ignore keeping the
     bulky blueprint out of the AI context window, a Plan-mode seed plus one build prompt
     per feature, and the full blueprint. Best if you build in Bolt and want Plan Mode's
     ~90% token saving while you sequence the work."

   - **Replit** (`replit-pack`) — "You get: a Replit-ready pack — a concise replit.md the
     Agent re-reads on every request, Agent Skills for build conventions and design
     posture, a Plan-mode seed plus one build prompt per feature, and the full blueprint —
     imports via GitHub or ZIP. Best if you build with Replit Agent and want Plan-first,
     checkpointed sessions that keep effort-based billing predictable."

Every option's copy follows one template: *"You get: [concrete artifacts]. Best if
[situation]."* — outcome language, never internal jargon.

### Rendering rules

1. **Only categories with ≥1 `Status: v1` variant appear at level 1.** A category whose
   variants are all `future` is not shown at all — no "coming soon" entries.
2. **Level-2 menus show implemented (`v1`) variants only.** A category with exactly one v1
   variant skips level 2 and runs that variant directly.
3. **Single-target collapse (decision 90i).** While exactly one target is implemented
   package-wide (as Phase 0 ships: only `dev-brief`), the two-level picker collapses to a
   single confirm question — proceed with that target (showing its "You get… Best if…" copy)
   or cancel. The two-level picker appears automatically once a second target reaches v1.
4. **Direct-arg bypass.** `/n2b:s5-export {target-key}` skips both questions. The argument is
   validated against this table: an unknown key or a `future` key gets a rejection listing
   the implemented keys; a `v1` key proceeds straight to the workflow's per-target routing.
5. **Completion banner.** The EXPORT COMPLETE banner (Step 6, `n2b/workflows/stage-5/export.md`)
   lists the remaining implemented target keys — the `v1` rows minus targets already exported
   `current` — as one-line direct commands, teaching the bypass keys. File count, fidelity
   result, and a consumer-native next step accompany them (banner copy owned by the workflow;
   banner names registered in `n2b/references/ui-brand.md`).

---

## Consumer-Native Next Steps

The EXPORT COMPLETE banner's **Next step** line (workflow Step 6,
`n2b/workflows/stage-5/export.md`) reads this list — one entry per `v1` target, rendered
with the run's `{OUT_DIR}` substituted. A `v1` target without an entry falls back to the
workflow's generic copy.

- `dev-brief` — "Open {OUT_DIR}00-README.md — it gives every role its reading order. COMBINED.md is the single-file render for PDF, print, or email."
- `jira` — "Open {OUT_DIR}import-guide.md first. In Jira: Settings > System > External System Import > CSV (choose 'switch to the old experience' if you don't see it), upload jira-import.csv, and map Issue ID / Parent / blocks as the guide describes."
- `backlog` — "Open {OUT_DIR}README.md for what your tracker keeps and drops. Import backlog.csv directly where supported, or hand backlog.json to an agent with tracker access — it carries the dependency edges the CSV importers drop."
- `agent-workspace` — "Copy {OUT_DIR} into a fresh repository (`git init && git add -A && git commit`), open README.md for per-tool startup, and point your coding agent at the repo — it reads AGENTS.md and starts on the first `passes: false` item in feature_list.json."
- `speckit` — "Copy {OUT_DIR} into your project repo, run `specify init --here --integration <your-agent>` to install the /speckit commands, then run /speckit.plan — specs are pre-authored and feature 001 is pre-selected, so you skip /speckit.specify entirely."
- `prd` — "For Task Master: copy {OUT_DIR}PRD.md to .taskmaster/docs/prd.md and run `task-master parse-prd .taskmaster/docs/prd.md --num-tasks=0`. For BMAD v6: copy PRD.md and architecture.md into _bmad-output/planning-artifacts/ and start at bmad-create-epics-and-stories."
- `lovable-pack` — "Open {OUT_DIR}README.md first. In Lovable: paste KNOWLEDGE.md into your project's Knowledge field (it fits the 10,000-character cap), seed the plan in Plan mode with PROMPTS.md prompt 0, then build one feature prompt at a time. There is no repo or ZIP import — commit AGENTS.md once Lovable creates its GitHub repo."
- `v0-pack` — "Open {OUT_DIR}README.md first. In v0: attach KNOWLEDGE.md as a project Source and INSTRUCTIONS.md as an Instruction, seed the plan with PROMPTS.md prompt 0, then queue the feature prompts in build order — v0 runs up to 10 queued prompts. Import the bundle via ZIP or GitHub to keep the blueprint in the project."
- `bolt-pack` — "Open {OUT_DIR}README.md first. Push the pack to GitHub and import it into Bolt — agents.md is picked up automatically and .bolt/ignore keeps docs/ out of the AI context window — then seed the plan in Plan Mode with PROMPTS.md prompt 0 and build one feature prompt at a time."
- `replit-pack` — "Open {OUT_DIR}README.md first. Import the pack into Replit via GitHub or ZIP (replit.md is re-read on every request), seed the plan in Plan Mode with PROMPTS.md prompt 0, then build one feature prompt at a time with checkpoints — Agent billing is effort-based, so short passes cost less than long autonomous runs."

---

## Plugin Rule (P4)

Adding a new export target = **one formatter agent + one template + one registry row.**
Nothing in the workflow core changes: target resolution, the picker, pre-flight, indexing,
the fidelity gate (via its per-target parameter row in
`n2b/references/stage-5/fidelity-rules.md`), receipts, dashboards, staleness, and cleanup all
key off this table.

Per-phase obligations when a row flips to `v1`:

1. Fill the Formatter agent and Template cells with the shipped paths.
2. Add the target's parameter row to `n2b/references/stage-5/fidelity-rules.md` §3.
3. **Re-verify the picker copy against the live tool.** These consumers churn — each phase's
   research step re-checks its variant's intake format *and* its "You get… Best if…"
   description against the tool as it currently exists, and amends the copy above before the
   phase ships. Picker copy is a design surface, not boilerplate.
4. Confirm the `Needs backlog.json` cell against the target's actual render inputs.

One export kind per invocation, always: a run resolves exactly one Target key, renders it,
gates it, receipts it, and stops. Re-running `/n2b:s5-export` for another format is the
designed re-entry path — the canonical package is never consumed.
