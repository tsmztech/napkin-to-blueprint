# n2b Tracking Protocol

<!-- Workflows that @-include this file:
     - n2b/workflows/stage-2/define.md
     - n2b/workflows/stage-3/specify.md
     - n2b/workflows/stage-4/architect.md
     - n2b/workflows/stage-5/export.md
     Stage 1 does NOT @-include this file — it creates tracking files directly. -->

## Tracking Responsibility Chain

**Command (stub) → Workflow (tracking + orchestration) → Agents (deliverables only)**

- **Command** (`commands/n2b/sN-*.md`): Thin stub that invokes the workflow. Does not write any files.
- **Workflow** (`n2b/workflows/stage-N/*.md`): The orchestrator. Spawns agents, runs gates, retries on failure. Writes ALL tracking files — PIPELINE.md, STATE.md, MANIFEST.md, and STAGE.md updates are exclusively workflow-owned.
- **Agents** (`n2b/agents/stage-N/*.md`): Write deliverables only (features, specs, architecture docs). **Agents NEVER @-include this file and NEVER write tracking files. Only workflows write to `.n2b/tracking/`.**

**Ownership boundary:** This protocol owns frontmatter fields and common update operations. Stage-specific body shapes (step names, table structures, checkbox formats) are owned by each stage's workflow.

---

## STAGE.md Dual Lifecycle

STAGE.md serves two distinct roles depending on its `status` field:

1. **Live tracker** (`status: in-progress` or `status: failed`): Updated continuously as the stage runs. Checkboxes tick, tables update, deviations recorded live.
2. **Permanent receipt** (`status: complete`): Finalized at gate pass. Once `status: complete` is set, **no workflow should modify the file.** The `status: complete` field is the signal — treat it as a write lock.

This dual lifecycle replaces the need for separate status + summary files. The same file evolves from tracker to receipt. It governs the STAGE.md files of **Stages 1–4**.

**Exception — Stage 3:** Stage 3 uses a directory (`s3-specify/`) with a dashboard STAGE.md plus per-feature tracking files. The dual lifecycle applies to all of them: per-feature files are write-locked when `status: done`.

**Exception — Stage 5 (export):** Stage 5 uses a directory (`s5-export/`) with a dashboard STAGE.md plus one tracking file per export target. The dashboard is a **live document for the life of the project** — exports accumulate over time, so the receipt write lock never applies to it. The receipt role belongs to the per-target files: each is write-locked once its `status: done` is set (until a user-confirmed per-target refresh resets it). This is the same dashboard-live / per-item-receipt pattern Stage 3 uses per feature.

---

## Transition Blocks

The 10 transition types below define exactly which files to update and how at each state change. Follow them as a checklist — perform every listed operation in order. (`batch-checkpoint` is Stage 3-only; all others are shared.)

---

<transition name="stage-start">

## stage-start

**When:** A Stage 1–4 workflow is invoked and STAGE.md `status` is `not-started` (fresh run), OR after the re-run guard passes (see `stage-rerun-guard`).

**Scope: Stages 1–4 only.** The export stage never fires `stage-start`. Export runs begin from `pipeline_status: blueprint-complete` and leave PIPELINE.md frontmatter untouched — `pipeline_status` stays `blueprint-complete` and `active_stage` stays `0`. The export workflow initializes and updates its own dashboard and per-target trackers instead; see `export-complete` and `stage-resume-s5`.

### PIPELINE.md

Update frontmatter:
- `active_stage`: set to N (the stage number starting)
- `pipeline_status`: set to `running`
- `last_completed_stage`: if `last_completed_stage >= N` (re-run detected), reset to `N - 1` (for Stage 1, reset to `null`); otherwise leave unchanged
- `last_updated`: set to current ISO timestamp

Update body:
- On the Stage N checklist line: add `← ACTIVE` marker at end of line
- If Stage N had a `← NEXT` marker from a previous between-stages state: replace it with `← ACTIVE`

### STATE.md

Update frontmatter:
- `current_step`: set to the first step identifier for this stage (stage-specific — use the first step name from the stage's workflow)
- `stage_status`: set to `in-progress`
- `stage_started`: set to current ISO timestamp
- `last_updated`: set to current ISO timestamp

Update body:
- `## Current Position` section: write "Stage N — {Stage Name}" and "Step: {first step}"
- `## Session Continuity`: set Last action to "Stage N started", Next action to first agent/step name, Blockers to "None"

### STAGE.md

Update frontmatter:
- `status`: set to `in-progress`
- `started`: set to current ISO timestamp

Body: no changes at stage-start — the stage's workflow populates stage-specific body content as steps execute.

</transition>

---

<transition name="step-complete">

## step-complete

**When:** A step within the active stage has finished (agent completed, pass finished, sub-task done).

### PIPELINE.md

**No-op.** Steps within a stage do not change pipeline-level state. PIPELINE.md only updates at stage boundaries (start, complete, fail).

### STATE.md

Update frontmatter:
- `current_step`: advance to the next step identifier for this stage
- `last_updated`: set to current ISO timestamp

Update body:
- `## Current Position` section: update "Step:" line to reflect the new current step and any progress counts (e.g., "Features analyzed: N of M")
- `## Session Continuity`: update Last action to what just completed (e.g., "Pass 1A — Product Visionary complete"), Next action to next step/agent

### STAGE.md

Update body:
- Tick the checkbox for the completed step: change `- [ ]` to `- [x]`
- Update any progress tables or counters relevant to this step (e.g., feature count in dashboard, spec count)
- If any deviation occurred during this step (retry, unexpected behavior, auto-fix): **record it immediately in the `## Deviations` section** — do not defer to stage completion. Format: `- **{Type}:** {what happened and why} → {how resolved}`

Frontmatter: no changes at step-complete — `status` remains `in-progress`.

</transition>

---

<transition name="gate-check">

## gate-check

**When:** All steps within a stage are complete and the gate validation is about to run.

### PIPELINE.md

**No-op.** Gate results are recorded in PIPELINE.md only after the gate resolves (either `stage-complete` or `gate-fail`). Recording partial gate state mid-check would create ambiguous pipeline state.

### STATE.md

Update frontmatter:
- `stage_status`: set to `gate-check`
- `last_updated`: set to current ISO timestamp

Update body:
- `## Session Continuity`: update Last action to "Gate N validation running", Next action to "Awaiting gate result"

### STAGE.md

Update body — `## Gates` section:
- Record each gate category being checked with its evidence inline. Use this format per category:
  ```
  - [ ] {Category name}: {what is being checked} — {evidence found}
  ```
- Do not pre-fill pass/fail — only record what you observe. The gate check runs live; fill results as you check each category.
- Per-category evidence means specific counts, file paths, or values — not just "checked" or "validated".

Frontmatter: no changes at gate-check — `status` remains `in-progress`.

</transition>

---

<transition name="batch-checkpoint">

## batch-checkpoint

**When:** Stage 3 only. **After every pass batch** — Stage 3 runs pass-scoped batches (one pass per invocation, up to `batch_size` features), and every Pass A, Pass B, or Pass C batch ends here, including the batch that completes its pass. The only Stage 3 invocation that never fires this transition is the terminal one (all features `done` → Pass D + Gate A + stage-complete). The invocation ends cleanly here; the user continues with `/n2b:s3-specify --continue` in a fresh context window. No other stage fires this transition.

A checkpoint deliberately leaves the **same pipeline state as an interrupted run** — `pipeline_status: running`, `active_stage: 3`, STAGE.md `status: in-progress` — so every existing resume path (gatekeeper Check 2/3, `stage-resume` classification, status routing) handles it with no special cases.

### STAGE.md

Update frontmatter:
- `checkpoints`: increment by 1
- `current_pass` keeps the value the pass's step-complete set — the pass the next invocation will run
- `status` remains `in-progress` — the receipt write-lock does not begin at a checkpoint

Update body:
- Append to the `## Steps` section: `- [x] Checkpoint {N} (Pass {A|B|C} batch): {batch FEAT-IDs} — {pass-scoped progress, e.g. "12/27 analyzed"} ({ISO timestamp})`
- The Feature Progress table must already reflect per-feature truth (per-feature updates happen as each feature completes — a checkpoint adds no table edits of its own)

### PIPELINE.md

Update frontmatter:
- `last_updated`: set to current ISO timestamp

No other PIPELINE.md changes — `active_stage` and `pipeline_status` are untouched.

### STATE.md

Update frontmatter:
- `current_step: checkpoint`
- `last_updated`: set to current ISO timestamp

Update body:
- `## Current Position`: "Stage 3 — Create Specifications / Checkpoint {N} after a Pass {A|B|C} batch — {done}/{features_total} features done. Remaining: {to analyze} to analyze, {to spec} to spec, {to review} to review (~{estimated runs incl. the terminal Pass D + Gate A run} more run(s) at batch size {batch_size})"
- `## Session Continuity`: Last action: "Checkpoint {N} — Pass {A|B|C} batch {batch FEAT-IDs}", Next action: "/n2b:s3-specify --continue", Blockers: "None"

### Display

Render the `CHECKPOINT` banner block (registered in ui-brand.md) with pass-scoped batch progress, the per-pass remaining workload, and the continue instruction, then END the invocation — no further passes, gates, or transitions run.

</transition>

---

<transition name="stage-complete">

## stage-complete

**When:** Gate validation passes for the active stage (Stages 1–4). The export stage never fires this transition — each passing export target fires `export-complete` instead.

This is the most complex transition. Execute all 4 steps in order. Do not skip or reorder.

### Step 1 — Finalize STAGE.md (do this first)

Update frontmatter:
- `status`: set to `complete`
- `completed`: set to current ISO timestamp

Update body:
- `## Gates` section: replace all `- [ ]` with `- [x]` for passed categories, set `Result: **passed**`
- `## Performance` section: fill in final values — duration (from `started` to now), agents spawned (total count), retries (total count), gate attempts per gate
- `## Output` section: list every file produced by this stage with paths and summary counts

After this step, STAGE.md is a **permanent receipt**. Do not modify it again.

### Step 2 — Update PIPELINE.md, then MANIFEST.md

Update PIPELINE.md frontmatter:
- `active_stage`: set to `0` (between-stages)
- `last_completed_stage`: set to N
- `pipeline_status`: set to `paused` (Stages 1–3) or **`blueprint-complete` (Stage 4)**. Stage 4 is the final stage of the pipeline: `blueprint-complete` means the deliverable exists and the pipeline is done. It is terminal — no export ever changes it; only a user-confirmed upstream re-run (gatekeeper Check 3 → `stage-start`) re-opens the pipeline.
- `last_gate_result`: set to the gate result identifier (e.g., `stage-2-gate-2-passed`)
- `last_updated`: set to current ISO timestamp

Update PIPELINE.md body:
- Stage N checklist line: change `- [ ]` to `- [x]`, remove `← ACTIVE` marker, append completion summary (e.g., "Completed {date} | {output summary}")
- If Stage N+1 exists: add `← NEXT` marker to Stage N+1 checklist line. (When Stage 4 completes, the Stage 5 line takes the marker too — it reads as the next *available* action; the export itself remains optional.)
- `## Stage History` section: add or update the Stage N entry:
  ```markdown
  ### Stage N: {Stage Name}
  - Completed: {ISO timestamp}
  - Gate: passed — {gate name}
  - Output: {primary artifact path} ({summary count})
  - Performance: {agents} agents, {duration} min, {retries} retries
  - Detail: → .n2b/tracking/stages/sN-{slug}/STAGE.md
  ```
- `## Artifact Lineage` table: if this stage produced FEAT-IDs or other tracked artifacts, update the relevant row(s) with a checkmark and artifact path

Then update **`.n2b/tracking/MANIFEST.md`** — the canonical-package manifest. Create it on the first stage completion using this exact format:

```
---
package_version: 1            # integer; +1 whenever any inventory row is added/changed
project_name: "{PROJECT_NAME}"
last_updated: {ISO-8601}
---

# Blueprint Package Manifest

## Package Inventory

| Artifact | Stage | ID coverage | Fingerprint | Updated |
|---|---|---|---|---|
```

Update rules:
- One row per canonical artifact file the completing stage produced, path relative to `.n2b/`. Insert rows for new artifacts; refresh existing rows for regenerated ones.
- `ID coverage`: the ID ranges the artifact carries (e.g. `FEAT-01..08`, `FEAT-03.SPEC-001..006`, `ADR-001..012`), `—` where none.
- `Fingerprint`: first 12 hex chars of `shasum -a 256` over the file.
- `Updated`: ISO timestamp of this refresh.
- Increment `package_version` by 1 when any inventory row was added or changed in this update; refresh `last_updated`.
- **MANIFEST.md is written only by workflows, during this transition — never by agents.** The export stage's indexer step verifies and refreshes fingerprints against this file; there is no second manifest file.

### Step 3 — Refresh STATE.md

Update frontmatter:
- `stage_status`: set to `between-stages`
- `current_step`: set to `none`
- `last_updated`: set to current ISO timestamp

Update body:
- `## Current Position` section: write "Between stages. Awaiting next stage command."
- `## Accumulated Context` section: preserve only cross-stage useful bits (domain entities, feature counts, key decisions that future stages will need). Remove step-level progress counts — those are now in STAGE.md permanently. Remove completed-stage details already captured in PIPELINE.md Stage History.
- `## Session Continuity`: set Last action to "Stage N gate passed", Next action to the exact next command (e.g., `/n2b:s3-specify`), Blockers to "None"

**STATE.md size constraint — trim rules (target: 50–80 lines):**

After writing the refreshed STATE.md, count its lines. Apply these rules if needed:

1. Remove all step-level progress counts (already in STAGE.md permanently)
2. Keep only cross-stage context that future stages will need: domain entities, feature counts, key architectural decisions
3. Remove completed-stage details already captured in PIPELINE.md Stage History
4. If STATE.md still exceeds 80 lines after the above: trim Accumulated Context to the 5 most important facts
5. Session Continuity must always fit in 3 lines: Last action, Next action, Blockers

The goal is a whiteboard — current status only, not a history archive. History is in STAGE.md and PIPELINE.md.

### Step 4 — Display end-of-stage continuation message

After completing Steps 1–3, display this message to the user:

```
---

## ✓ Stage {N}: {Stage Name} Complete

{One-line summary: what was produced, with counts}

---

## ▶ Next Up

**Stage {N+1}: {Next Stage Name}** — {one-line description of what it does}

`/n2b:s{N+1}-{slug}`

*(`/clear` first → fresh context window)*

---

**Also available:**
- `/n2b:status` — check pipeline progress

---
```

**For the terminal stage (Stage 4), replace the "▶ Next Up" block with a "PACKAGE READY" block.** Its exact copy is owned by the Stage 4 workflow, under this contract:

- The artifact inventory is **derived from `.n2b/tracking/MANIFEST.md` `## Package Inventory`** — never a hardcoded list. Every manifest row is represented (artifact path, producing stage, ID coverage).
- Export is an **offer, never a requirement**: the block routes to `/n2b:s5-export` including its target-argument forms (`/n2b:s5-export` for the interactive picker, `/n2b:s5-export {target}` for one target — one export per invocation; these two forms are the only ones), framed as optional — the blueprint is complete whether or not the user exports.
- The block states that the pipeline is complete (`pipeline_status: blueprint-complete`) and no further stage is required.

Message content is derived from what was just written to tracking files: the summary line comes from STAGE.md Output, the next stage info comes from PIPELINE.md, and the Stage 4 inventory comes from MANIFEST.md.

</transition>

---

<transition name="export-complete">

## export-complete

**When:** An export target passes its fidelity gate and its deliverables are complete. Fires once per passing target — each invocation produces exactly one export, so it fires once per successful run. This is the export stage's counterpart to `stage-complete`.

Execute the four sections in order — the per-target receipt and dashboard are finalized before PIPELINE.md records the export, mirroring `stage-complete`'s load-bearing ordering.

### Per-target tracking file (`s5-export/{target}.md`)

Update frontmatter:
- `status`: set to `done`
- `exported_at`: set to current ISO timestamp
- Source-version fields (the MANIFEST.md `package_version` rendered from, plus any fingerprint fields the export workflow defines): set to the values this export was rendered against

Once `status: done` is set, the per-target file is a **receipt** — write-locked until a user-confirmed per-target refresh resets it.

### s5-export STAGE.md (dashboard)

Update the dashboard's per-target row and counters (body shape owned by the export workflow — e.g., targets completed, files rendered, fidelity result).

This transition is **explicitly exempt from the STAGE.md receipt write-lock**: the s5-export STAGE.md is a live dashboard for the life of the project, never a sealed receipt. The per-target files above are the receipts (the same dashboard-live / per-item-receipt pattern Stage 3 uses).

### PIPELINE.md

Update body:
- Append one row to the `## Export History` table (append-only — never modify or delete existing rows):
  ```
  | {next #} | {target} | {package_version from MANIFEST.md} | {count of files rendered into .n2b/exports/{target}/} | {ISO timestamp} | current |
  ```
  Columns: `| # | Target | Package version | Artifacts | Completed at | Status |`, with `Status` ∈ `current | stale`. New rows are always `current`. Only the gatekeeper's confirmed upstream re-run ever flips rows to `stale`.

**First-ever completed export only** (detected by `last_completed_stage` still being `4`):
- Frontmatter: set `last_completed_stage: 5`
- Body: tick the checklist row — `- [x] Stage 5: Export` — remove any `← NEXT` marker, append a summary (e.g., "First export {date} | {target}")
- `## Stage History`: fill the Stage 5 entry (Completed timestamp of the first export, target, `Detail: → .n2b/tracking/stages/s5-export/STAGE.md`)

Always:
- `last_updated`: set to current ISO timestamp
- **NEVER change `pipeline_status`** — it stays `blueprint-complete`. Exports are post-completion operations; there is no pipeline state beyond `blueprint-complete`.
- Never change `active_stage` — it stays `0`.

### STATE.md

Frontmatter: no changes. Update body only:
- `## Session Continuity`: set Last action to "Export {target} complete", Next action to "None — export optional, add another format any time via /n2b:s5-export", Blockers to "None"

</transition>

---

<transition name="gate-fail">

## gate-fail

**When:** Gate validation runs and one or more categories fail (Stages 1–4).

**Scope: Stages 1–4 only.** Export fidelity-gate failures are per-target: they are recorded in the s5-export dashboard and per-target tracking files by the export workflow, and they NEVER set `pipeline_status: failed` — `blueprint-complete` is terminal and a failed export leaves the blueprint intact.

### PIPELINE.md

Update frontmatter:
- `active_stage`: set to `0`
- `pipeline_status`: set to `failed`
- `last_gate_result`: set to the failure identifier (e.g., `stage-2-gate-1-failed`)
- `last_updated`: set to current ISO timestamp

Update body: no changes to the stage checklist line (stage remains unchecked — it did not complete).

### STATE.md

Update frontmatter:
- `stage_status`: set to `gate-failed`
- `last_updated`: set to current ISO timestamp

Update body:
- `## Session Continuity`: set Last action to "Gate N failed — {N} categories failed", Next action to `/n2b:sN-{slug}` to re-run, Blockers to the gate failure reason

### STAGE.md

Update body — `## Gates` section:
- Mark failed categories: `- [x]` for passed, keep `- [ ]` for failed, add `Result: **failed**`
- Record failure evidence per category:
  ```
  - [ ] {Category}: {what was checked} — FAILED: {specific reason with counts or file paths}
  ```

Frontmatter: do NOT set `status: complete` — leave `status: in-progress`. The stage must be re-run to pass the gate.

After updating all files, display the gate failure message:

```
---

## ✗ Stage {N}: Gate Failed

{Gate name} — {count} of {total} categories failed

Failed checks:
- {Category}: {what failed and why}
- {Category}: {what failed and why}

---

## ▶ Next Action

Re-run to retry: `/n2b:s{N}-{slug}`

*(`/clear` first → fresh context window)*

---
```

Show specific failures with evidence — not generic "something went wrong." The user must see exactly which checks failed and why before deciding to re-run.

</transition>

---

<transition name="stage-resume">

## stage-resume

**When:** Stage 3 workflow is invoked and STAGE.md `status` is `in-progress` or `failed`. Stage 3 and Stage 5 support resume — simple stages (1, 2, 4) do not resume; they run fresh after deletion. Stage 5 resume is deliverable-based per export target (see `stage-resume-s5`), not per-feature classification like Stage 3.

### PIPELINE.md

**No-op.** Stage 3 is already the active stage (`active_stage: 3` is already set). No pipeline-level state change occurs on resume.

### STATE.md

**No-op.** Stage 3 was already in-progress. The `stage_status: in-progress` is already set. Do not reset or change STATE.md frontmatter on resume.

Update STATE.md body only:
- `## Session Continuity`: update Last action to "Stage 3 resumed — reading feature tracking files", Next action to "Re-run agents for incomplete features"

### STAGE.md

Read per-feature tracking files in `s3-specify/` and classify each feature:

| File status | Classification | Action |
|-------------|----------------|--------|
| `status: done` | Completed | Skip entirely — do not re-run |
| `status: in-progress` | Incomplete | Wipe partial specs in `.n2b/specifications/FEAT-XX/`, re-run spec writer + quality review |
| `status: not-started` | Not started | No wipe needed, run spec writer + quality review fresh |
| No file exists | Not started | No wipe needed, run spec writer + quality review fresh |

After classifying all features and before spawning any agents:

Update STAGE.md frontmatter:
- `resumed`: increment by 1

Update STAGE.md body — `## Steps` section:
- Refresh the per-feature progress table with current classification results (done count, in-progress count, not-started count)
- Add a resume entry: `- [x] Resume {N}: classified {done} done, {incomplete} to re-run ({timestamp})`

After all features reach `status: done`, run Pass 3 (cross-reference reconciliation) and Gate 3 fresh — these always run fresh on every completion, including after resume.

</transition>

---

<transition name="stage-resume-s5">

## stage-resume-s5

**When:** The export workflow is invoked and the s5-export dashboard STAGE.md exists with `status: in-progress` — a prior export run was interrupted.

### PIPELINE.md

**No-op.** `pipeline_status` remains `blueprint-complete` and `active_stage` remains `0` — export runs never alter PIPELINE.md frontmatter. PIPELINE.md is only touched again when a target passes (`export-complete` appends its Export History row).

### STATE.md

No-op frontmatter. Update body only:
- `## Session Continuity`: set Last action to "Export resumed — detecting per-target position from deliverables", Next action to the first incomplete target's next step, Blockers to "None"

### STAGE.md (dashboard + per-target files)

Resume is **deliverable-based, per target**. For each requested target, read its tracking file in `s5-export/` and its deliverables on disk, then classify:

| Per-target evidence | Classification | Action |
|---------------------|----------------|--------|
| Tracking file `status: done` (receipt) | Completed | Skip — re-rendering requires an explicit per-target refresh, owned by the export workflow |
| Export receipt missing from the target's output directory | Formatting incomplete | Re-run that target's formatter, then its fidelity gate |
| Export receipt present but fidelity report missing | Gate incomplete | Re-run the fidelity gate only |
| Tracking file `status: not-started` or missing | Not started | Run the target fresh |

No tracking writes occur until classification is done and the workflow decides what to re-run. The dashboard then records the resume (body shape owned by the export workflow), and each target that completes fires `export-complete` normally.

</transition>

---

<transition name="stage-rerun-guard">

## stage-rerun-guard

**When:** A Stage 1–4 workflow is invoked and the corresponding STAGE.md `status` is `complete`. This guard runs before any `stage-start` processing.

Stage 5 never takes this guard: re-export is always legal, and per-target refresh/overwrite prompts are owned by the export workflow.

This guard protects against two scenarios: re-running a stage when downstream blueprint work exists (hard block), and re-running a completed stage when no downstream blueprint work exists (soft block requiring confirmation). Completed exports are neither — they never block; they go stale (see below).

### Three-Source Check

Read all three sources before deciding:

1. **PIPELINE.md frontmatter + checklist** — read `active_stage` and the stage checklist to understand pipeline position
2. **Downstream STAGE.md files (Stages 2–4 only)** — check the later blueprint stages' `status` fields
3. **PIPELINE.md `## Export History`** — count data rows to learn whether completed exports exist

### Hard Block

**Condition:** A later stage **among Stages 2–4** has `status: in-progress` or `status: complete`.

**Action:**
- Do NOT proceed. Do NOT modify any files.
- Display this message:

```
Stage N cannot be re-run — Stage N+1 has already {started/completed}.

Current pipeline progress:
- [x] Stage 1: {summary}
- [x] Stage 2: {summary}
- [ ] Stage 3: {summary or "active"}
- [ ] Stage 4: {not started}

To re-run Stage N, you must first resolve Stage N+1 (and any later stages) manually.
```

Substitute actual pipeline state from PIPELINE.md. No override path — the user must handle downstream blueprint stages before re-running an upstream one.

The hard block applies **between Stages 1–4 only**. The existence of exports — completed or interrupted — never triggers it.

### Exports Go Stale, Never Block

**Condition:** The only downstream work is Stage 5 exports (any `## Export History` rows exist; all downstream Stages 2–4 are `not-started`).

**Action:** Proceed to the soft block below, extending its prompt with the stale warning line. If the user confirms:
- Flip every `## Export History` row's Status to `stale` (rows are never deleted — the table is the append-only audit trail of what was handed to whom)
- Mirror the stale marking on the affected target rows in the s5-export dashboard
- Delete nothing under `.n2b/exports/` and leave per-target receipts untouched — they accurately record what was exported and from which package version
- Then continue with the normal cleanup + `stage-start` flow

After the re-run brings the pipeline back to `blueprint-complete`, `/n2b:s5-export {target}` refreshes any stale export.

### Soft Block

**Condition:** Stage N is `status: complete` AND no downstream Stage 2–4 has started (`status: not-started` on all of them).

**Action:**
- Do NOT proceed yet.
- Display this confirmation prompt:

```
Stage N is already complete (finished {completed timestamp from STAGE.md}).

Re-running will:
- Delete all Stage N output files from .n2b/{stage-output-dir}/
- Reset Stage N tracking (STAGE.md) to not-started
- Mark {count} completed export(s) STALE (exports are never deleted)
```

(Include the third bullet only when Export History rows exist.)

```
Are you sure? (yes/no)
```

- Wait for explicit user confirmation before proceeding.
- If user confirms: proceed to the `stage-start` transition for Stage N (mark exports stale when any exist, delete output artifacts, reset STAGE.md to `status: not-started`, then execute `stage-start`).
- If user declines: take no action.

**Exception for Stage 3:** If Stage 3 is `status: complete` and the user re-invokes `s3-specify`, the default behavior after soft block confirmation is resume (not clean restart). Offer clean restart as an explicit opt-in:

```
Stage 3 supports two re-run modes:
  [1] Resume — skip completed features, re-run only incomplete ones (recommended)
  [2] Clean restart — delete ALL Stage 3 output and start fresh

Which mode? (1/2)
```

On selection:
- Mode 1: follow the `stage-resume` transition
- Mode 2: delete `.n2b/specifications/*` + all per-feature tracking files + reset STAGE.md, then follow `stage-start`

Either mode marks existing exports stale — any confirmed re-run of Stages 1–4 does, because the exported package no longer matches the regenerated blueprint.

### PIPELINE.md, STATE.md, STAGE.md

No changes are made during the guard check itself. Changes only occur if the guard passes (no downstream blueprint work) and the user confirms the soft block. Those changes follow the normal `stage-start` transition, preceded by the export stale-marking when exports exist.

</transition>

---

## What This Protocol Does NOT Define

- **STAGE.md body shapes** — step names, checkbox structures, progress tables, gate category lists. These are owned by each stage's workflow and vary per stage.
- **Stage-specific step names or progress metrics** — the workflow knows its own steps; the protocol only knows which frontmatter fields to update.
- **Agent contracts or agent output format** — agents write deliverables; this protocol does not govern their output structure.
- **Gate validation logic** — how to evaluate whether a gate passes or fails is owned by each stage's gate implementation.
- **Export target registry, per-target deliverable shapes, and fidelity gate logic** — owned by the export workflow and its references; this protocol only defines when `export-complete` fires and what it writes.
- **Self-healing scan logic** — the `/n2b:status` workflow owns the integrity check and repair flow.
- **Status report display** — the `/n2b:status` workflow owns what the user sees.

## Separation of Concerns

| Responsibility | Owner |
|----------------|-------|
| PIPELINE.md format + update rules | This protocol |
| STATE.md format + update rules | This protocol |
| MANIFEST.md format + update rules | This protocol (written during `stage-complete` Step 2; workflow-written only) |
| STAGE.md frontmatter contract + lifecycle | This protocol |
| STAGE.md body shape (steps, tables, matrices) | Each stage's workflow |
| Gate validation logic | Each stage's gate implementation |
| Export fidelity gates, receipts' body shapes, target registry | Export workflow + its references |
| Self-healing scan logic | `/n2b:status` workflow |
| Status report display + routing logic | `/n2b:status` workflow |
| End-of-stage continuation format | Each stage's workflow |
