---
name: n2b:s5-export
description: Render the completed blueprint package for a chosen consumer — optional, repeatable, one export format per invocation
argument-hint: "[target-key]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
  - AskUserQuestion
---
<objective>
Run the export pipeline: render the completed blueprint package (Stages 1–4 output) into ONE consumer-shaped export format, verified by a fidelity gate before it is receipted. Export is **optional and repeatable** — the blueprint is complete whether or not you export it, and the package is never consumed: run this command again anytime for another format or to refresh an existing one.

**One export format per invocation.** Invocation forms:
- `/n2b:s5-export` — interactive picker: choose who will consume the export, then the format
- `/n2b:s5-export {target-key}` — render one named target directly (e.g. `/n2b:s5-export dev-brief`)

**Produces:** `.n2b/exports/{target}/` — the rendered export for the chosen target (file set defined by the target's template), plus `FIDELITY-REPORT.md` (the fidelity checker's verdict with evidence) and `EXPORT-RECEIPT.md` (what was rendered, from which package version). Available targets live in the export-target registry; the completion banner lists the remaining formats and their direct commands.

**Fidelity is gated, not hoped for:** every export passes a bash ID/count reconciliation against the canonical package plus an independent fidelity-checker review before it is receipted. The export layer renders — it never invents features, drops IDs, or alters acceptance criteria.

**Before running:** The blueprint pipeline must be complete (`pipeline_status: blueprint-complete` — Stage 4 finished via `/n2b:s4-architect`). The workflow validates the full package inventory from MANIFEST.md before spawning any agents and halts with a clear message if anything is missing.

**Tracking:** Updates `.n2b/tracking/` (s5-export dashboard + per-target trackers, PIPELINE.md `## Export History`, STATE.md continuity) via the `export-complete` transition. `pipeline_status` is never changed — exports are post-completion operations. A failed export never affects the blueprint. Run `/n2b:status` to see export state and staleness at any time.
</objective>

<execution_context>
@./.claude/n2b/workflows/stage-5/export.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/references/tracking-protocol.md
</execution_context>

<process>
Execute the export workflow from @./.claude/n2b/workflows/stage-5/export.md end-to-end. The only human interaction is target selection (when no target-key argument is given) and any per-target overwrite/refresh confirmation — the render and fidelity gate then run autonomously, no pauses.
</process>
