---
name: n2b:s3-specify
description: Transform product definition into implementation-ready feature specifications
argument-hint: "[--continue] [--batch N|all]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
  - WebFetch
---
<objective>
Run the autonomous specify pipeline from Stage 2 document validation through Gate A specification validation. No human interaction required during a run.

**Pass-scoped batched execution:** because every feature-scaled pass (A analysis, B specification, C review) costs tokens linearly, **each invocation runs exactly one pass for up to `batch_size` features (default 4)**, then stops at a clean CHECKPOINT so a run fits inside a real provider quota window. Pass boundaries always stop — completing a pass never rolls into the next one. Invocation forms:
- `/n2b:s3-specify` — start the stage (on a mid-flight stage this HALTS with a continue/restart prompt — it never silently discards partial work)
- `/n2b:s3-specify --continue` — process the next batch after a checkpoint or interruption (`/clear` first)
- `--batch N` (either form) — override the batch size for that invocation; `--batch all` processes every remaining feature of the current pass (the pass boundary still checkpoints)

The terminal invocation (every feature analyzed, specced, and reviewed) runs cross-feature reconciliation and Gate A, completing the stage. There is no single-invocation path — even small projects take one invocation per pass.

**Produces:** Implementation-ready specifications in `.n2b/specifications/`:
- Per-feature folders (`FEAT-{NN}-{slug}/`) with `feature-overview.md` and typed spec files across five spec types — Screen, Automation, Logic/Rule, **Integration** (the product's contract with an external capability: behaviors enabled, data exchanged, inbound events, degradation, consent), and **Notification** (every communication the product sends: channels, audience, exact content, delivery rules)
- `feature-dependency-map.md` — cross-feature dependency and shared entity map, including External Touchpoints
- `reconciliation-log.md` — cross-spec consistency validation log
- `design-system/` — only when `design_system_source: user`: the user-supplied files from `.n2b/inputs/design-system/` carried into the package **verbatim** (zero-agent passthrough — n2b never generates a design system; with `none`, the package ships design-agnostic)

**Quality review:** When config `spec_review` is `independent` (the default), every feature's specs receive an independent quality review (Pass C) with a bounded revision cycle; `self-only` relies on the producer's self-review alone.

**Before running:** Ensure `.n2b/features/` contains all 7 Stage 2 documents with `status: final` (produced by `/n2b:s2-define`). The pipeline will validate these prerequisites before spawning any agents and halt with a clear message if anything is missing or incomplete.

**Tracking:** Updates `.n2b/tracking/` files (PIPELINE.md, STATE.md, MANIFEST.md, stages/s3-specify/) at every transition. Creates per-feature tracking files during Pass A. Run `/n2b:status` after completion to verify.
</objective>

<execution_context>
@./.claude/n2b/workflows/stage-3/specify.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/references/tracking-protocol.md
</execution_context>

<process>
Execute the specify workflow from @./.claude/n2b/workflows/stage-3/specify.md end-to-end. This is a fully autonomous pipeline — no human questioning calls, no pauses.
</process>
