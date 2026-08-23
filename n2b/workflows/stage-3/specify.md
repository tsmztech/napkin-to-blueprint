<purpose>

This workflow coordinates the specify pipeline using a 4-pass architecture designed to keep each agent's context manageable:

- **Pass A (Analysis):** Requirements Architect validates Stage 2 inputs, builds the dependency map once (including External Touchpoints and per-shared-entity Contention / Data Sensitivity notes), fans out Feature Analysts for the current batch of features, and validates their Briefs. Runs across as many invocations as the feature count requires.
- **Pass B (Specification):** One Feature Spec Producer per batch feature, running in parallel. Each writes all specs for its feature across the five spec types (screen, automation, logic-rule, integration, notification) and self-verifies with its Phase 2.5 self-review — isolated in its own context. The Phase 2.5 self-review runs in every `spec_review` mode.
- **Pass C (Quality Review):** Independent per-feature review, keyed on config `spec_review`. When `spec_review` is `independent` (the default — also the value applied when the key is missing), one Spec Quality Reviewer is spawned per batch feature, in parallel. Must-fix findings route one producer revision re-spawn (maximum 1 revision cycle per feature), followed by one re-review. When `spec_review` is `self-only`, this pass is skipped entirely and the producer's Phase 2.5 self-review is the only quality gate.
- **Pass D (Reconciliation):** Cross-Reference Reconciler reads all specs from disk and fixes cross-feature inconsistencies across all five spec types, including External Touchpoints ↔ Integration spec consistency. One agent — never batched.

After all passes complete, Gate A runs structural validation across all Stage 3 outputs.

**Design system:** Stage 3 does not generate a design system. When the user supplied one (`design_system_source: user`, files in `.n2b/inputs/design-system/`), the files are carried **verbatim** into the package at `.n2b/specifications/design-system/` (zero-agent passthrough, Step 2). When `design_system_source` is `none`, the package ships design-agnostic and stated design preferences ride the brief's Constraints.

Pipeline state is tracked using the tracking protocol in `.n2b/tracking/stages/s3-specify/`. The STAGE.md dashboard and per-feature FEAT-NN-{slug}.md files in that directory provide per-feature resume granularity. If the stage is in-progress when this workflow starts, it resumes from per-feature disk truth rather than starting fresh — and, in `independent` review mode, a feature counts as complete only when its specs are written AND reviewed. All tracking transitions (stage-rerun-guard, stage-start, stage-resume, step-complete, gate-check, batch-checkpoint, stage-complete, gate-fail) follow `n2b/references/tracking-protocol.md` exactly.

**Pass-scoped batched execution.** Because Passes A, B, and C all scale linearly with feature count, **every invocation runs exactly one pass, for at most `BATCH_SIZE` features (default 4)** — so a single invocation stays inside a real provider quota window (AI providers meter usage per 5-hour/daily/weekly windows). Two absolute rules:

1. **One pass per invocation.** An invocation never spans a pass boundary. Completing a pass's final batch still ends the invocation — even when batch capacity remains.
2. **Every batch ends at a checkpoint.** After the batch's pass work completes, the `batch-checkpoint` transition fires and the invocation STOPS cleanly. The only invocation that never checkpoints is the **terminal** one: when classification finds every feature `done`, that invocation runs Pass D + Gate A + stage-complete and nothing else.

The current pass is always **derived from per-feature disk truth** at Step 4 (never persisted): features not yet analyzed → Pass A; analyzed features without complete specs → Pass B; features awaiting independent review → Pass C; everything `done` → the terminal Pass D invocation. Passes are strictly sequential — Pass B never starts while any feature lacks analysis, Pass C never starts while any feature lacks specs.

The user re-invokes with `/n2b:s3-specify --continue` (in a fresh context window) for each batch, deciding between batches whether their remaining quota supports another run. A full run is therefore `ceil(N/BATCH_SIZE)` invocations per feature-scaled pass plus one terminal invocation — there is **no single-invocation path**: even a project smaller than `BATCH_SIZE` takes one invocation per pass. Invocation forms: bare `/n2b:s3-specify` starts the stage (and HALTS with guidance if the stage is mid-flight — it never silently wipes partial work); `--continue` resumes from a checkpoint or interruption; `--batch N` overrides the batch size for that invocation; `--batch all` processes **every remaining feature of the current pass** in this invocation — the pass boundary still checkpoints.

</purpose>

<required_reading>

Before starting, read:
- `.claude/n2b/references/ui-brand.md` — banner format (40 `━` characters, `n2b > {BANNER NAME}` prefix), the registered banner names, and status symbols (`✓` = complete, `○` = pending/in-progress)
- `.claude/n2b/references/tracking-protocol.md` — all transition types; follow them as a checklist at each state change
- `.claude/n2b/references/pipeline-gatekeeper.md` — entry gate (Check 1-3 flow, error formats, stage registry)
- `.claude/n2b/references/model-profiles.md` — Per-Agent Model Mapping table and resolution logic for the Agent tool's `model` parameter

Gate naming: this workflow's single gate is **Gate A — Structural Validation** (tracking identifiers `stage-3-gate-a-*`). Per ui-brand.md's registered banner set, its pass banner is `GATE A PASSED`; gate failures render the markdown gate-failure block, not a banner.

Agent contracts are self-loading — the workflow only needs their installed file paths. Do not pre-read the agent contracts; pass their paths in the spawning prompts and the agents will load them.

</required_reading>

<process>

## Step 0 — Entry Gate

**Parse the invocation arguments first** (the text passed after the command name, if any):

- `--continue` present → `CONTINUE_MODE=true`; otherwise `CONTINUE_MODE=false`.
- `--batch {value}` present → if `{value}` is a positive integer, `BATCH_OVERRIDE={value}`; if it is `all`, `BATCH_OVERRIDE=all` (process every remaining feature of the **current pass** in this invocation — the pass boundary still checkpoints); anything else → ignore the override and note it for the STAGE.md `## Deviations` section once the dashboard is writable (`- **Invocation:** invalid --batch value "{value}" ignored → batch size {effective} used`).
- No other arguments are recognized; ignore unrecognized text.

`BATCH_OVERRIDE` (when set) takes precedence for this invocation over the recorded `batch_size` in STAGE.md frontmatter and over the default of **4** (resolution in Step 1).

Read `n2b/references/pipeline-gatekeeper.md` and execute Check 1, Check 2, and Check 3 for **Stage 3** as defined in that reference.

**Check 1 — Pipeline Exists:**

```bash
[ -f .n2b/tracking/PIPELINE.md ] && echo "EXISTS" || echo "MISSING"
```

- If MISSING: HALT with E9 ("Not initialized. Run /n2b:s1-init").
- If EXISTS: continue to Check 2.

**Check 2 — Sequence & Status:**

Read the three tracking fields from PIPELINE.md:

```bash
ACTIVE=$(awk '/^---/{n++; next} n==1 && /^active_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
PIPELINE_STATUS=$(awk '/^---/{n++; next} n==1 && /^pipeline_status:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
LAST_COMPLETED=$(awk '/^---/{n++; next} n==1 && /^last_completed_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
[ "$LAST_COMPLETED" = "null" ] && LAST_COMPLETED=0
echo "ACTIVE=$ACTIVE PIPELINE_STATUS=$PIPELINE_STATUS LAST_COMPLETED=$LAST_COMPLETED"
```

Follow the gatekeeper's Check 2 decision tree:
- `PIPELINE_STATUS == "blueprint-complete"` -> the blueprint is done; a Stage 3 request is a re-run of a completed stage -> proceed to Check 3 (the gatekeeper re-run guard — user confirmation required, and completed exports are marked stale on confirmation; this is never a hard halt)
- `PIPELINE_STATUS == "failed"` -> if requested (3) == LAST_COMPLETED + 1, re-run of the failed stage, PASS; else HALT with E4
- `ACTIVE > 0` and requested (3) == ACTIVE -> resume, proceed to Check 3
- `ACTIVE > 0` and requested (3) != ACTIVE -> HALT with E5
- `ACTIVE == 0` and requested (3) == LAST_COMPLETED + 1 -> fresh run, PASS
- `ACTIVE == 0` and requested (3) <= LAST_COMPLETED -> re-run, proceed to Check 3
- `ACTIVE == 0` and requested (3) > LAST_COMPLETED + 1 -> HALT with E3

**Check 3 — Re-run Guard** (only runs on re-run/resume from Check 2):

Read Stage 3 tracker status:

```bash
TARGET_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s3-specify/STAGE.md 2>/dev/null || echo "not-started")
echo "TARGET_STATUS=$TARGET_STATUS"
```

- `not-started`: PASS. Proceed to Step 1.
- `in-progress`: PASS. Stage 3 handles resume internally — proceed to Step 0.5 (re-run mode selection).
- `complete`: two checks run in order:

**(a) Downstream hard-block check** — blueprint stages only. Per the gatekeeper's stage registry and Per-Stage Downstream Check List, Stage 3 checks only s4-architect (the registry defines Stage 5 as `s5-export` — a post-completion consumer of the blueprint; exports never trigger a block):

```bash
DOWNSTREAM=.n2b/tracking/stages/s4-architect/STAGE.md
DS_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$DOWNSTREAM" 2>/dev/null || echo "not-started")
echo "$DOWNSTREAM: $DS_STATUS"
if [ "$DS_STATUS" != "not-started" ]; then
    echo "HARD_BLOCK=true"
fi
```

**(b) Export staleness check — never a block:**

```bash
EXPORT_COUNT=$(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md)
echo "EXPORT_COUNT=$EXPORT_COUNT"
```

Completed exports are downstream *consumers* of the blueprint, not downstream *work on* the blueprint. They never trigger E8 and are never deleted by an upstream re-run — they are marked stale instead.

  - **Hard block** (s4-architect not `not-started`): display E8 error banner from the gatekeeper and HALT.
  - **Soft block** (s4-architect `not-started`): Stage 3 uses its own two-mode re-run modal (not the generic soft block). Proceed to Step 0.5.

All error banners use the gatekeeper's branded format from `pipeline-gatekeeper.md`.

On PASS (fresh run from Check 2 or fresh run from Check 3 `not-started`): if `CONTINUE_MODE` is true, HALT — there is nothing to continue:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  --continue given, but Stage 3 has not started — nothing to continue

  Recovery:
    Start the stage: /n2b:s3-specify
```

Otherwise skip Step 0.5, proceed directly to Step 1.
On PASS (re-run/resume): proceed to Step 0.5.

---

## Step 0.5 — Stage 3 Re-run Mode (only on re-run/resume PASS from Check 3)

This step only runs when Check 3 passed as a re-run or resume scenario. Skip it on fresh runs.

If `TARGET_STATUS` was `in-progress` (mid-flight stage — a batch checkpoint, an interrupted run, or a prior gate/review failure):

- **`CONTINUE_MODE == true`:** Proceed directly to Step 1. Step 1.5 Path B (stage-resume) handles per-feature classification. This is the normal continue path — it never asks anything.
- **`CONTINUE_MODE == false`:** The bare command must never silently touch a mid-flight stage — partial specs on disk represent real spent quota. Read progress for the prompt (`features_done`/`features_total` from STAGE.md frontmatter, done-count from per-feature trackers) and present the mid-flight modal:

```
Stage 3 is mid-flight: {DONE_COUNT} of {features_total} features complete.

  [1] Continue — process the next batch (recommended; same as --continue)
  [2] Clean restart — delete ALL Stage 3 output and start fresh

Which mode? (1/2)
```

  Wait for user response.
  - **Mode 1 (Continue):** Proceed to Step 1, then Step 1.5 Path B — identical to the `--continue` path.
  - **Mode 2 (Clean restart):** Execute the clean-restart cleanup listed below (same as the `complete`-state Mode 2), then proceed to Step 1 as a fresh run.

If `TARGET_STATUS` was `complete`:

- **`CONTINUE_MODE == true`:** HALT — the stage has no mid-flight state to continue:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  --continue given, but Stage 3 is already complete

  Recovery:
    Check the pipeline: /n2b:status
    Re-run the stage (resume/restart modal): /n2b:s3-specify
```

- **`CONTINUE_MODE == false`** and the soft block passed (no downstream blueprint work):

Present the resume/clean-restart modal:

```
Stage 3 is already complete (finished {completed timestamp from STAGE.md}).

Stage 3 supports two re-run modes:
  [1] Resume — skip completed features, re-run only incomplete ones (recommended)
  [2] Clean restart — delete ALL Stage 3 output and start fresh
```

When `EXPORT_COUNT > 0`, append to the prompt: `Either mode marks {EXPORT_COUNT} completed export(s) STALE — exports are never deleted; refresh them with /n2b:s5-export once the blueprint is complete again.`

```
Which mode? (1/2)
```

Wait for user response. When `EXPORT_COUNT > 0`, either mode first flips every `## Export History` row's Status to `stale` (rows are never deleted — the table is the append-only audit trail) and mirrors the stale marking on the affected target rows in the s5-export dashboard. Delete nothing under `.n2b/exports/` and leave per-target receipts untouched.

- **Mode 1 (Resume):** Proceed to Step 1, then Step 1.5 Path B (stage-resume) handles per-feature classification.
- **Mode 2 (Clean restart):** Execute cleanup per the gatekeeper's Per-Stage Re-run Cleanup table for Stage 3 (clean restart):
  - Delete `.n2b/specifications/*` (all content)
  - Delete all `FEAT-NN-{slug}.md` files in `.n2b/tracking/stages/s3-specify/`
  - Reset `s3-specify/STAGE.md` frontmatter: `status: not-started`, `started: null`, `completed: null`, `resumed: 0`, `features_total: 0`, `features_done: 0`, `current_pass: none`
  - Update PIPELINE.md: `last_completed_stage` -> `2`
  - Then proceed to Step 1 as a fresh run.

---

## Step 1 — Pre-flight Validation

Validate that all 7 expected Stage 2 documents exist with `status: final` in `.n2b/features/` before any filesystem changes or agent spawning. Stage 2 always produces all 7 documents — there is no reduced-document mode.

Run a single bash check:

```bash
PREFLIGHT_PASS=true
FILES="product-features.md user-persona.md user-journeys.md scope-boundaries.md success-metrics.md assumptions-constraints.md market-research.md"

for f in $FILES; do
  if [ -f ".n2b/features/$f" ] && [ -s ".n2b/features/$f" ] && \
     grep -q "^status: final" ".n2b/features/$f"; then
    echo "$f: ok"
  else
    echo "FAILED: $f"
    PREFLIGHT_PASS=false
  fi
done
echo "PREFLIGHT_PASS=$PREFLIGHT_PASS"
```

These are the only assertions this pre-flight makes about Stage 2 content — existence, non-empty, and the `status: final` frontmatter field the Stage 2 templates pin. Deeper shape validation (headings, depth fields, Access Matrix) was already enforced by Stage 2's Gate 2 and is re-read by the Pass A architect; the pre-flight never re-asserts headings.

**Read the Stage 3 config keys** (per `n2b/references/config-schema.md` — a missing file or invalid value falls back to the default, never a fatal error):

```bash
SPEC_REVIEW=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('spec_review','independent'))" 2>/dev/null || echo "independent")
case "$SPEC_REVIEW" in independent|self-only) ;; *) SPEC_REVIEW="independent" ;; esac
echo "SPEC_REVIEW=$SPEC_REVIEW"

DS_SOURCE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('design_system_source','none'))" 2>/dev/null || echo "none")
case "$DS_SOURCE" in none|user) ;; *) DS_SOURCE="none" ;; esac
echo "DS_SOURCE=$DS_SOURCE"

MODEL_PROFILE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('model_profile','balanced'))" 2>/dev/null || echo "balanced")
case "$MODEL_PROFILE" in quality|balanced|budget) ;; *) MODEL_PROFILE="balanced" ;; esac
echo "MODEL_PROFILE=$MODEL_PROFILE"
```

**Batch-size resolution (once for this workflow):** the effective `BATCH_SIZE` for this invocation is, in precedence order:

1. `BATCH_OVERRIDE` from Step 0 (`--batch N` or `--batch all`), when supplied;
2. the `batch_size` value in s3-specify/STAGE.md frontmatter, when present and not `null` (a prior run recorded it);
3. the default: **4**.

```bash
RECORDED_BATCH=$(awk '/^---/{n++; next} n==1 && /^batch_size:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s3-specify/STAGE.md 2>/dev/null)
echo "RECORDED_BATCH=${RECORDED_BATCH:-none}"
# BATCH_SIZE = BATCH_OVERRIDE if set; else RECORDED_BATCH if a positive integer or "all"; else 4
```

`BATCH_SIZE=all` means every remaining feature of the **current pass** is processed in this invocation — the pass boundary still checkpoints. The resolved value is recorded into STAGE.md frontmatter at Step 1.5 (Path A writes it; Path B updates it only when `BATCH_OVERRIDE` was supplied, adding a `## Deviations` note: `- **Invocation:** batch size overridden to {BATCH_SIZE} for resume {RESUME_N} (--batch)`).

**Model resolution (once for this workflow):** using MODEL_PROFILE, resolve each Stage 3 agent role's model from the Per-Agent Model Mapping table in `model-profiles.md` (rows: **Requirements Architect**, **Feature Analyst**, **Feature Spec Producer**, **Spec Quality Reviewer**, **Cross-Reference Reconciler**) and pass the resolved model as the Agent tool's `model` parameter on every spawn below — the mapping table is the single source; never hardcode a model name in this workflow. The Feature Analyst model is passed through the Requirements Architect's spawn prompt (the Architect spawns the analysts).

**Design-system passthrough pre-flight.** Inspect the design-system intake directory (`.n2b/inputs/design-system/`, per config-schema.md's Design-System Intake section):

```bash
DS_FILE_COUNT=$(find .n2b/inputs/design-system -type f 2>/dev/null | wc -l | tr -d ' ')
echo "DS_FILE_COUNT=$DS_FILE_COUNT"
```

- **Detection path** — `DS_SOURCE == "none"` and `DS_FILE_COUNT > 0`: the user supplied design-system files after intake. Set `design_system_source: user` in `.n2b/config.json` and adopt them:

```bash
python3 - <<'PYEOF'
import json
cfg = json.load(open('.n2b/config.json'))
cfg['design_system_source'] = 'user'
json.dump(cfg, open('.n2b/config.json', 'w'), indent=2)
PYEOF
```

  Set `DS_SOURCE="user"` for the rest of this run. (If `.n2b/config.json` does not exist, apply the switch in-memory for this run only — do not create the file.) Record this detection in the STAGE.md `## Deviations` section as soon as the dashboard body exists (Step 1.5 Path A writes it; on resume, STAGE.md already exists — record immediately): `- **Config:** .n2b/inputs/design-system/ contains {DS_FILE_COUNT} file(s) while config said design_system_source: none → set design_system_source: user in .n2b/config.json (detection path).`

- **Failure path** — `DS_SOURCE == "user"` and `DS_FILE_COUNT == 0`: the config promises user-supplied design inputs that do not exist. This is a pre-flight failure (see banner below), with recovery guidance:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  design_system_source is "user" but .n2b/inputs/design-system/ is missing or empty

  Recovery:
    Add your design system files (Markdown, design-token JSON, PDF) to .n2b/inputs/design-system/
    — or set "design_system_source": "none" in .n2b/config.json
```

**If ANY Stage 2 document check fails:** Display this failure banner with the specific missing/invalid file and halt — do not proceed to any subsequent step:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  {specific failure: e.g. "product-features.md missing" / "user-persona.md not status: final"}

  Recovery:
    Run /n2b:s2-define to produce Stage 2 documents
```

**If ALL checks pass:** Continue silently to Step 1.5.

---

## Step 1.5 — stage-start OR stage-resume

Determine the tracking path based on STAGE.md status (read in Step 0):

### Path A — Fresh Run (STAGE.md `status: not-started` or after clean restart in Step 0.5)

Execute the `stage-start` transition from tracking-protocol.md:

**PIPELINE.md** (`.n2b/tracking/PIPELINE.md`):
- `active_stage: 3`
- `pipeline_status: running`
- `last_completed_stage`: if it is `>= 3` (re-run detected), reset to `2`; otherwise leave unchanged
- `last_updated: {current ISO timestamp}`
- On Stage 3 checklist line: add `← ACTIVE` marker (replace `← NEXT` if present)

**STATE.md** (`.n2b/tracking/STATE.md`):
- `current_step: pass-a`
- `stage_status: in-progress`
- `stage_started: {current ISO timestamp}`
- `last_updated: {current ISO timestamp}`
- `## Current Position`: "Stage 3 — Create Specifications / Step: Pass A — Analysis"
- `## Session Continuity`: Last action: "Stage 3 started", Next action: "Pass A — spawning Requirements Architect", Blockers: "None"

**s3-specify/STAGE.md** (`.n2b/tracking/stages/s3-specify/STAGE.md`):
- `status: in-progress`
- `started: {current ISO timestamp}`
- `current_pass: pass-a`
- `batch_size: {BATCH_SIZE}` (the Step 1 resolved value)
- `checkpoints: 0`

Write the full STAGE.md body skeleton (overwrite body section below the frontmatter — shape per the `stage-s3-dashboard.md` template):

```
This file is a live tracker while status is in-progress. Once status changes to complete, it becomes a permanent receipt — do not modify.

## Steps

- [ ] Pass A — Analysis
- [ ] Pass B — Specification (includes self-review)
- [ ] Pass C — Quality Review (spec_review: independent)
- [ ] Pass D — Reconciliation

## Feature Progress

| Feature | Status | Specs Expected | Specs Written | Quality |
|---------|--------|----------------|---------------|---------|

(Table populated after Pass A discovers features.)

## Gates

(Gate A results recorded here. Per-feature and per-category evidence.)

## Performance

| Metric | Value |
|--------|-------|
| Duration | — |
| Agents spawned | — |
| Retries | 0 |
| Features processed | 0 |
| Resumes | 0 |
| Checkpoints | 0 |

## Deviations

(Captured live during execution. Any deviation from the expected flow is recorded here immediately, not deferred to completion.)

## Output

(Populated on stage completion. Lists all files produced by this stage.)
```

If the Step 1 detection path fired (design_system_source auto-switched to `user`), record it in `## Deviations` now.

Display the pipeline start banner and flow diagram (registered banner name per ui-brand.md — Pass A is the first pass):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Pass A   Requirements Architect  --- dependency map + feature briefs (batched)
  Pass B   Feature Spec Producers  --- specs per feature + self-review (batched, parallel)
  Pass C   Spec Quality Reviewers  --- independent review per feature (batched, parallel)
  Pass D   Cross-Ref Reconciler    --- cross-feature consistency (terminal invocation)
              ↓
  Gate A   Structural validation   --- 6 categories
```

When `SPEC_REVIEW == "self-only"`, append ` (skipped — spec_review: self-only)` to the Pass C line of the diagram.

After the diagram, display the batch plan line:

```
  ○  Pass-scoped batched run: one pass per invocation, up to {BATCH_SIZE} features per batch — checkpoint + /n2b:s3-specify --continue after every batch
```

(When `BATCH_SIZE` is `all`, phrase it as `one pass per invocation, all remaining features of that pass per batch`.)

### Path B — Resume (STAGE.md `status: in-progress`)

Execute the `stage-resume` transition from tracking-protocol.md:

**PIPELINE.md:** No-op (Stage 3 is already active).
**STATE.md frontmatter:** No-op (already in-progress).

Classify every feature against per-feature disk truth. The full feature list comes from `product-features.md` (the `**ID:** FEAT-` entries) — features that Pass A has not yet analyzed have no folder and no tracker, and must be counted, not ignored. Classification is deliverable-based and recognizes Pass C state: in `independent` review mode, a feature is complete only when its specs are written AND reviewed (`status: done` + `quality_passed: true`); a feature whose specs are all on disk but whose review never passed re-runs the review only — its specs are not wiped.

```bash
UNANALYZED_COUNT=0
ANALYZED_COUNT=0
DONE_COUNT=0
REVIEW_PENDING_COUNT=0
INCOMPLETE_COUNT=0

# Full feature list from Stage 2 — the universe classification runs over
FEATURE_COUNT=$(grep -c '^\*\*ID:\*\* FEAT-' .n2b/features/product-features.md)

for FEAT_NUM in $(grep -oE '^\*\*ID:\*\* FEAT-[0-9]+' .n2b/features/product-features.md | grep -oE '[0-9]+'); do
  FEAT_ID="FEAT-${FEAT_NUM}"
  feat_dir=$(ls -d .n2b/specifications/${FEAT_ID}-*/ 2>/dev/null | head -1)

  # No folder, or folder without a valid Brief -> Pass A never completed for this feature
  if [ -z "$feat_dir" ] || [ ! -s "$feat_dir/feature-overview.md" ]; then
    [ -n "$feat_dir" ] && rm -rf "$feat_dir"   # wipe a folder with no valid Brief
    UNANALYZED_COUNT=$((UNANALYZED_COUNT + 1))
    echo "unanalyzed: $FEAT_ID"
    continue
  fi

  SLUG=$(basename "$feat_dir" | sed 's/FEAT-[0-9]*-//')
  TRACKER=".n2b/tracking/stages/s3-specify/${FEAT_ID}-${SLUG}.md"

  if [ ! -f "$TRACKER" ]; then
    # Valid Brief but tracker missing (interrupted Pass A result processing) —
    # recreate the tracker from the Brief (Step 3's tracker-creation shape), classify analyzed
    ANALYZED_COUNT=$((ANALYZED_COUNT + 1))
    echo "analyzed-recreate-tracker: $FEAT_ID-$SLUG"
  else
    FEAT_STATE=$(grep "^status:" "$TRACKER" | awk '{print $2}')
    case "$FEAT_STATE" in
      done)
        DONE_COUNT=$((DONE_COUNT + 1))
        echo "done: $FEAT_ID-$SLUG"
        ;;
      in-progress)
        SPECS_EXPECTED=$(grep "^specs_expected:" "$TRACKER" | awk '{print $2}')
        ACTUAL=$(find "$feat_dir" -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$SPEC_REVIEW" = "independent" ] && [ "$ACTUAL" -gt 0 ] && [ "$ACTUAL" = "$SPECS_EXPECTED" ]; then
          # Specs complete on disk, review never passed — Pass C state. Do NOT wipe.
          REVIEW_PENDING_COUNT=$((REVIEW_PENDING_COUNT + 1))
          echo "review-pending: $FEAT_ID-$SLUG"
        else
          INCOMPLETE_COUNT=$((INCOMPLETE_COUNT + 1))
          # Wipe partial specs — preserve feature-overview.md; feature re-runs Pass B
          rm -f "$feat_dir"FEAT-*.SPEC-*.md
          echo "wiped: $FEAT_ID-$SLUG"
        fi
        ;;
      not-started|*)
        ANALYZED_COUNT=$((ANALYZED_COUNT + 1))
        echo "analyzed: $FEAT_ID-$SLUG"
        ;;
    esac
  fi
done

echo "unanalyzed=$UNANALYZED_COUNT analyzed=$ANALYZED_COUNT incomplete=$INCOMPLETE_COUNT review_pending=$REVIEW_PENDING_COUNT done=$DONE_COUNT"
RESUME_N=$(grep "^resumed:" .n2b/tracking/stages/s3-specify/STAGE.md | awk '{print $2}')
RESUME_N=$((RESUME_N + 1))
echo "Resume number: $RESUME_N"
RESUME_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

For every feature echoed `analyzed-recreate-tracker`, recreate its tracker file now using Step 3's tracker-creation shape (read `specs_expected` and the spec checklist from its Brief).

**The current pass follows from the buckets — strictly sequential, derived fresh every invocation, never persisted:**

| Condition | Current pass |
|---|---|
| `UNANALYZED_COUNT > 0` | **Pass A** — analyze the next batch |
| else `ANALYZED_COUNT + INCOMPLETE_COUNT > 0` | **Pass B** — spec the next batch |
| else `REVIEW_PENDING_COUNT > 0` | **Pass C** — review the next batch |
| else (all `done`) | **Terminal invocation** — Pass D + Gate A + stage-complete |

After classifying all features and before spawning agents:

**Update s3-specify/STAGE.md frontmatter:** `resumed: {RESUME_N}` (increment by 1). If `BATCH_OVERRIDE` was supplied this invocation, also set `batch_size: {BATCH_SIZE}` and record the override in `## Deviations` (per Step 1's batch-size resolution).

**Update s3-specify/STAGE.md body:**
- Refresh Feature Progress table with classification results (done / review-pending / analyzed / unanalyzed for each feature; wiped features show as analyzed — their specs re-run)
- Add a resume entry in the Steps section: `- [x] Resume {RESUME_N}: classified {UNANALYZED_COUNT} unanalyzed, {ANALYZED_COUNT + INCOMPLETE_COUNT} awaiting specs, {REVIEW_PENDING_COUNT} review-pending, {DONE_COUNT} done ({RESUME_TIMESTAMP})`
- If the Step 1 detection path fired, record it in `## Deviations` now.

**Update STATE.md body only:**
- `## Session Continuity`: Last action: "Stage 3 resumed — classified per-feature state", Next action: "Pass {A|B|C|D} — next batch", Blockers: "None"

Display the resume summary as status lines (no banner — resume is not a registered banner name; the pass about to run displays its own registered pass banner):

```
  ✓  Resume {RESUME_N}: {DONE_COUNT}/{FEATURE_COUNT} done, {REVIEW_PENDING_COUNT} review-pending, {ANALYZED_COUNT + INCOMPLETE_COUNT} awaiting specs, {UNANALYZED_COUNT} awaiting analysis
  ○  Wiped {INCOMPLETE_COUNT} partial features for re-spec — current pass: Pass {A|B|C|D}
```

---

## Step 2 — Setup

Create the output directory:

```bash
mkdir -p .n2b/specifications
```

**Design-system passthrough (zero-agent, idempotent).** When `DS_SOURCE == "user"`, carry the user-supplied files verbatim into the package so the blueprint is self-contained:

```bash
if [ "$DS_SOURCE" = "user" ]; then
  mkdir -p .n2b/specifications/design-system
  cp -R .n2b/inputs/design-system/. .n2b/specifications/design-system/
  echo "design-system passthrough: $(find .n2b/specifications/design-system -type f | wc -l | tr -d ' ') file(s)"
fi
```

Files are copied as-is — never normalized, reworded, or restyled; the supplied material is the design layer's source of truth. When `DS_SOURCE == "none"`, no design-system output exists and the package ships design-agnostic. Runs on every invocation (a no-op re-copy on resume keeps the passthrough current and self-heals a missing directory).

(The start banner and flow diagram are displayed at Step 1.5 Path A; the resume summary at Path B. No additional banner needed here.)

---

## Step 3 — Pass A: Analysis (Requirements Architect, batched)

**Routing (from Step 1.5's current-pass derivation):** this step runs only when the current pass is **Pass A** — a fresh run (nothing analyzed yet), or a resume with `UNANALYZED_COUNT > 0`. When every feature is already analyzed, skip to Step 4 (Pass B), Step 4.5 (Pass C), or Step 5 (terminal invocation) per the current-pass table:

```
  ✓  Pass A: skipped (already complete — per-feature tracking files exist)
```

**Otherwise — run one Pass A batch:**

**Pass A batch selection.** Order the unanalyzed features by Stage 2 priority — `**Priority:**` `Core` before `Important` before `Nice-to-Have` (read from each feature's entry in `product-features.md`), numeric FEAT order within a tier — and take the first `BATCH_SIZE` (all of them when `BATCH_SIZE` is `all`). This is `BATCH_A`. Set `FINAL_A_BATCH=true` when `BATCH_A` covers every remaining unanalyzed feature.

```bash
# Tier-ordered unanalyzed features (unanalyzed list from Step 1.5 classification; fresh run = all features)
awk '/^\*\*ID:\*\* FEAT-/{id=$2} /^\*\*Priority:\*\*/{print id, $2}' .n2b/features/product-features.md
# Map Core->1 Important->2 *->3, keep only unanalyzed FEAT-IDs, sort -n by tier then FEAT number
# BATCH_A = first BATCH_SIZE entries (all when BATCH_SIZE=all); FINAL_A_BATCH = (BATCH_A size == unanalyzed count)
```

On the **first Pass A invocation** (STAGE.md frontmatter `features_total: 0`), set `features_total: {FEATURE_COUNT}` now — the total is known from `product-features.md` before any analysis runs.

If resuming (the Step 1.5 Path A banner was not shown), display the Pass A banner first:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Display status:

```
  ○  Pass A batch: analyzing {BATCH_A size} of {UNANALYZED_COUNT} remaining features — {FEAT-IDs in BATCH_A}
```

Spawn the Requirements Architect (batch-scoped):

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-3/requirements-architect.md` and execute your complete task as described. Input directory: `.n2b/features/` — all 7 Stage 2 documents are present with `status: final`. Output directory: `.n2b/specifications/`. **Feature scope for this batch: {FEAT-IDs in BATCH_A} — create folders, assemble context packages, and spawn Feature Analysts for ONLY these features.** Per your contract's batch-mode rules: build `feature-dependency-map.md` (covering ALL features) only if it does not already exist — when it exists, read it and leave it untouched except for Integration-spec-ID completion for this batch's features. {When FINAL_A_BATCH: 'This is the FINAL analysis batch — after validating this batch's Briefs, run the full External Touchpoints coverage check across ALL Briefs per your contract.' Otherwise: 'This is not the final analysis batch — defer the full External Touchpoints coverage check; complete only this batch's Integration-spec-ID rows.'} Write all deliverables per your contract's deliverables section. Do not ask for clarification — work autonomously.

Context-package requirements (slice the Stage 2 documents — elaborate them downstream, never re-derive):
- Per-feature record from product-features.md: the full entry including `**Phase:**` and all eight Functional Depth fields (`**Primary Flows & Alternates:**`, `**States:**`, `**Validation & Limits:**`, `**Access:**`, `**Communications:**`, `**Data Notes:**`, `**Interactions:**`, `**Signals:**`).
- The persona set and Access Matrix slice from user-persona.md — the roles and access levels this feature touches; this is the source of every access/authorization decision in the specs.
- The Non-Functional Expectations and Dependencies slices from assumptions-constraints.md relevant to this feature (category-level external-capability dependencies included).
- Journey coverage from user-journeys.md: the journeys touching this feature, with their `**Coverage:**` values.
- Success metrics from success-metrics.md — only metrics this feature contributes to or is measured by.

Dependency-map requirements: produce feature-dependency-map.md per your contract, including the `## External Touchpoints` section (category-level external dependencies traced to assumptions-constraints.md `## Dependencies`, mapped to features and Integration specs) and the per-shared-entity `**Contention:**` and `**Data Sensitivity:**` lines.

Brief validation: run your programmatic checks on every Feature Breakdown Brief per your contract — including Roles Touched present on every Spec Inventory row and all six frontmatter counts (spec_count, screen_count, automation_count, logic_rule_count, integration_count, notification_count — zero is a legal value, an absent field is not).

Sub-agent model: spawn every Feature Analyst with the Agent tool's `model` parameter set to `{resolved Feature Analyst model}` (this workflow resolved it from model-profiles.md; use it for re-spawn cycles too)."
- Tools: Read, Write, Bash, Agent
- Model: resolved from the **Requirements Architect** (Stage 3) row of model-profiles.md under MODEL_PROFILE (Step 1)
- maxTurns: 150

Wait for the Architect to complete. Verify the batch's feature folders and the dependency map exist:

```bash
# Verify each BATCH_A feature has a folder with a non-empty feature-overview.md
for FEAT_ID in $BATCH_A_IDS; do
  dir=$(ls -d .n2b/specifications/${FEAT_ID}-*/ 2>/dev/null | head -1)
  { [ -n "$dir" ] && [ -s "$dir/feature-overview.md" ]; } && echo "$FEAT_ID: ok" || echo "$FEAT_ID: MISSING"
done

[ -f ".n2b/specifications/feature-dependency-map.md" ] && echo "Dependency map: ok" || echo "Dependency map: MISSING"
```

If any batch feature's folder or overview is missing, display failure and halt — the Pass A batch must complete successfully before checkpointing.

**Per-feature tracking file creation:** After the batch completes successfully, iterate over the batch's feature folders and create one tracking file per feature (shape per the `feature-tracker.md` template). Process per-analyst (sequentially), writing each file before moving to the next:

```bash
TRACKING_DIR=".n2b/tracking/stages/s3-specify"
mkdir -p "$TRACKING_DIR"

for feat_dir in $BATCH_A_DIRS; do
  FEAT_FOLDER=$(basename "$feat_dir")
  FEAT_ID=$(echo "$FEAT_FOLDER" | grep -oE "FEAT-[0-9]+")
  SLUG=$(echo "$FEAT_FOLDER" | sed 's/FEAT-[0-9]*-//')
  TRACKER="$TRACKING_DIR/${FEAT_ID}-${SLUG}.md"

  # Skip if tracker already exists (resume — Pass A batch was partially processed)
  if [ -f "$TRACKER" ]; then
    echo "  tracker exists, skipping: $FEAT_ID-$SLUG"
    continue
  fi

  # Read feature-overview.md to extract spec count and spec IDs
  OVERVIEW="$feat_dir/feature-overview.md"
  FEATURE_NAME=$(grep "^feature_name:\|^# " "$OVERVIEW" | head -1 | sed 's/^feature_name: //;s/^# //')
  # Count Spec Inventory rows only — Cross-Feature Touchpoints and Analyst-Discovered
  # rows also start "| FEAT-NN.SPEC-", and specs_expected must equal files on disk
  # exactly for review-pending resume detection to hold
  SPECS_EXPECTED=$(awk '/^## Spec Inventory/{f=1; next} f && /^## /{exit} f' "$OVERVIEW" 2>/dev/null | grep -c "^| FEAT-.*\.SPEC-"); SPECS_EXPECTED=${SPECS_EXPECTED:-0}

  echo "  Creating tracker: $TRACKER (feature=$FEAT_ID, specs_expected=$SPECS_EXPECTED)"

  # Build spec checklist from feature-overview.md Spec Inventory (same section scoping)
  SPEC_LINES=$(awk '/^## Spec Inventory/{f=1; next} f && /^## /{exit} f' "$OVERVIEW" 2>/dev/null | grep "^| FEAT-.*\.SPEC-" | awk -F'|' '{print $2}' | tr -d ' ')

  # Write the per-feature tracking file
done
```

For each feature, write `.n2b/tracking/stages/s3-specify/FEAT-{NN}-{slug}.md` using the feature-tracker.md template shape:

```
---
feature: "{FEAT_ID}"
feature_name: "{FEATURE_NAME}"
status: not-started
specs_expected: {SPECS_EXPECTED}
specs_written: 0
quality_passed: false
---

## Specs

{one unchecked checkbox per expected spec ID from feature-overview.md Spec Inventory}
- [ ] {SPEC_ID_1}
- [ ] {SPEC_ID_2}
...
```

Immediately write each file as you process that analyst's results. Do NOT defer to batch creation after all features are processed.

**step-complete transition after the Pass A batch (batch-aware):**

Update s3-specify/STAGE.md:
- Tick `- [x] Pass A — Analysis` **only when every feature now has a tracker** (`FINAL_A_BATCH` and the batch verified clean). While unanalyzed features remain, leave the checkbox unticked — the Feature Progress table carries per-feature truth.
- Add/refresh Feature Progress rows for the batch's features at `⬜ analyzed`, including `specs_expected` counts read from per-feature tracker files (unanalyzed features stay absent or `⬜ unanalyzed`)
- Set frontmatter: `current_pass: pass-a` (or `pass-b` when `FINAL_A_BATCH`)

Update STATE.md:
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Pass A batch complete — {BATCH_A size} features analyzed ({analyzed total}/{features_total})", Next action: "Batch checkpoint"

Display completion:

```
  ✓  Pass A batch complete — {BATCH_A size} features analyzed ({analyzed total}/{features_total}){, dependency map produced — first batch only}
```

**Then proceed directly to Step 4.75 (checkpoint gate).** A Pass A invocation never continues into Pass B — even when the batch completed Pass A and capacity remains.

---

## Step 4 — Pass B: Specification (Parallel Per-Feature, batched)

**Routing (from Step 1.5's current-pass derivation):** this step runs only when the current pass is **Pass B** — every feature is analyzed and at least one feature still needs specs (`ANALYZED_COUNT + INCOMPLETE_COUNT > 0`; on the invocation after the final Pass A batch, all features are in this state). When no feature needs specs, skip to Step 4.5 (Pass C) or Step 5 (terminal invocation) per the current-pass table.

**Pass B batch selection.** The eligible set is every feature awaiting specs — tracker `status: not-started`, plus wiped `in-progress` features (their partial specs were removed at classification). Order by priority tier — `Core` before `Important` before `Nice-to-Have` (read `priority_tier:` from each feature's `feature-overview.md` frontmatter), numeric FEAT order within a tier — and take the first `BATCH_SIZE` (all of them when `BATCH_SIZE` is `all`). Early batches carry the highest-value specs.

```bash
# Eligible: trackers with status not-started, or in-progress after the classification wipe
NEEDS_PASSB_LIST=()
for feat_dir in .n2b/specifications/FEAT-*/; do
  FEAT_ID=$(basename "$feat_dir" | grep -oE "FEAT-[0-9]+")
  SLUG=$(basename "$feat_dir" | sed 's/FEAT-[0-9]*-//')
  TRACKER=".n2b/tracking/stages/s3-specify/${FEAT_ID}-${SLUG}.md"
  FEAT_STATE=$(grep "^status:" "$TRACKER" 2>/dev/null | awk '{print $2}')
  SPECS_EXPECTED=$(grep "^specs_expected:" "$TRACKER" 2>/dev/null | awk '{print $2}')
  ACTUAL=$(find "$feat_dir" -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
  case "$FEAT_STATE" in
    done) continue ;;
    in-progress)
      # Complete specs awaiting review -> Pass C, not Pass B
      [ "$SPEC_REVIEW" = "independent" ] && [ "$ACTUAL" -gt 0 ] && [ "$ACTUAL" = "$SPECS_EXPECTED" ] && continue
      NEEDS_PASSB_LIST+=("$feat_dir") ;;
    *) NEEDS_PASSB_LIST+=("$feat_dir") ;;
  esac
done
echo "Awaiting specs: ${#NEEDS_PASSB_LIST[@]}"

# Tier-order and slice (frontmatter priority_tier; missing -> Nice-to-Have last)
for feat_dir in "${NEEDS_PASSB_LIST[@]}"; do
  TIER=$(awk '/^---/{n++; next} n==1 && /^priority_tier:/{$1=""; print; exit} n==2{exit}' "$feat_dir/feature-overview.md" 2>/dev/null | tr -d ' ')
  case "$TIER" in Core) R=1 ;; Important) R=2 ;; *) R=3 ;; esac
  echo "$R $(basename "$feat_dir" | grep -oE '[0-9]+' | head -1) $feat_dir"
done | sort -n -k1,1 -k2,2 | awk '{print $3}'
# BATCH_PASSB     = first BATCH_SIZE entries (all entries when BATCH_SIZE=all)
# DEFERRED_COUNT  = eligible total - BATCH_PASSB size
```

Features outside `BATCH_PASSB` are **untouched this invocation** — their trackers, folders, and state stay exactly as classified; they are the next invocations' work. Review-pending features are never touched in a Pass B invocation — they wait for the Pass C invocations that start once every feature has specs.

Display the batch line:

```
  ○  Pass B batch: speccing {BATCH_PASSB size} of {eligible total} remaining features — {FEAT-IDs in BATCH_PASSB}
```

(Suppress the "of {eligible total}" phrasing when `DEFERRED_COUNT = 0` — the batch covers everything remaining in this pass.)

Display the Pass B banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass B: Spawning {BATCH_PASSB count} Feature Spec Producers (parallel)
```

If resuming, append: `(resuming — {DONE_COUNT} features already complete, {DEFERRED_COUNT} deferred to later batches)`

Spawn ALL of the batch's producers in the SAME step (critical — they must run concurrently):

**For each feature folder in `BATCH_PASSB`** (the batch's features — never the full list), spawn one Feature Spec Producer:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-3/feature-spec-producer.md` and execute your complete task as described. Feature folder: `{feature_folder_path}`. Read the feature-overview.md in that folder for your spec inventory. Read the dependency map at `.n2b/specifications/feature-dependency-map.md` for cross-feature context (including External Touchpoints, Contention, and Data Sensitivity). Read relevant Stage 2 documents from `.n2b/features/`. Spec types are exactly five — for each type in your inventory, read only that type's methodology + template pair:
- screen -> `.claude/n2b/references/stage-3/screen-spec-methodology.md` + `.claude/n2b/templates/stage-3/spec-screen.md`
- automation -> `.claude/n2b/references/stage-3/automation-spec-methodology.md` + `.claude/n2b/templates/stage-3/spec-automation.md`
- logic-rule -> `.claude/n2b/references/stage-3/logic-rule-spec-methodology.md` + `.claude/n2b/templates/stage-3/spec-logic-rule.md`
- integration -> `.claude/n2b/references/stage-3/integration-spec-methodology.md` + `.claude/n2b/templates/stage-3/spec-integration.md`
- notification -> `.claude/n2b/references/stage-3/notification-spec-methodology.md` + `.claude/n2b/templates/stage-3/spec-notification.md`
Run your Phase 2.5 self-review (all categories, including Analytics Coverage) before finishing — the self-review runs in every spec_review mode. Write all spec files per your contract's deliverables section. Do not ask for clarification — work autonomously."
- Tools: Read, Write
- Model: resolved from the **Feature Spec Producer** (Stage 3) row of model-profiles.md under MODEL_PROFILE (Step 1)
- maxTurns: 120

**Per-producer completion handling.** As EACH spec producer returns, immediately update that feature's tracking. Reviewers are NEVER spawned in a Pass B invocation — independent review happens in the Pass C invocations, after every feature has specs.

For each completed producer:

```bash
FEAT_ID="{completed feature FEAT_ID}"
SLUG="{completed feature slug}"
TRACKER=".n2b/tracking/stages/s3-specify/${FEAT_ID}-${SLUG}.md"
FEAT_DIR=".n2b/specifications/${FEAT_ID}-${SLUG}/"

# Count actual spec files produced
SPECS_WRITTEN=$(find "$FEAT_DIR" -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
```

- **`SPEC_REVIEW == "self-only"`:** Update tracker: `status: done`, `specs_written: {actual count}`, `quality_passed: true`. Tick all `- [x]` checkboxes in the Specs section (append `— written, self-review passed` to each). Update STAGE.md Feature Progress: that feature row changes to `✅ DONE` with spec count, Quality column `self-only`. Increment `features_done` by 1.
- **`SPEC_REVIEW == "independent"`:** Update tracker: `specs_written: {actual count}` — `status` stays `in-progress` and `quality_passed` stays `false` until the feature's review passes in a Pass C invocation. Tick all `- [x]` checkboxes in the Specs section (append `— written, self-review passed` to each). Update STAGE.md Feature Progress: that feature row changes to `○ review pending`, Quality column `○ review pending`.

Wait for ALL `BATCH_PASSB` producers to complete before firing the Pass B step-complete transition.

**step-complete transition after the Pass B batch (batch-aware):**

Update s3-specify/STAGE.md:
- Tick `- [x] Pass B — Specification (includes self-review)` **only when no feature in the whole stage still needs production** (`DEFERRED_COUNT = 0` — every feature is now done or review-pending). While features awaiting specs remain, leave the checkbox unticked — the Feature Progress table carries per-feature truth, and the checkpoint entry records the batch boundary.
- Refresh Feature Progress table with current per-feature states
- Set frontmatter: `current_pass: pass-b` (or `pass-c` when `DEFERRED_COUNT = 0` — `pass-d` in `self-only` mode)

Update STATE.md:
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Pass B batch complete — {N} features specified with self-review", Next action: "Batch checkpoint"

Display completion:

```
  ✓  Pass B batch complete — specs produced and self-reviewed for {N} features ({specced total}/{features_total})
```

**Then proceed directly to Step 4.75 (checkpoint gate).** A Pass B invocation never continues into Pass C — even when the batch completed Pass B and capacity remains.

---

## Step 4.5 — Pass C: Quality Review (Independent, Per-Feature, batched)

This pass is keyed on the config key `spec_review` (read in Step 1; `independent` is the default and also the value applied when the key is missing or invalid).

**In `self-only` mode this pass never runs as an invocation** — producers mark features `done` directly in Pass B, so classification jumps from Pass B straight to the terminal invocation (Step 5 annotates the Pass C checkbox as skipped).

**Routing (from Step 1.5's current-pass derivation):** this step runs only when the current pass is **Pass C** — every feature has complete specs and at least one is review-pending (`REVIEW_PENDING_COUNT > 0`). When nothing is review-pending, skip to Step 5 (terminal invocation).

**Pass C batch selection.** Order the review-pending features in numeric FEAT order and take the first `BATCH_SIZE` (all of them when `BATCH_SIZE` is `all`). This is `BATCH_REVIEW`; `DEFERRED_COUNT` = review-pending total − batch size. Note the cost asymmetry: a Pass C batch can spend up to roughly double its reviewer count when revision cycles fire (reviewer + revision producer + re-review per affected feature) — `--batch N` tunes this per invocation.

Display the Pass C banner and batch line:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS C
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass C batch: reviewing {BATCH_REVIEW size} of {review-pending total} remaining features — {FEAT-IDs in BATCH_REVIEW}
```

**Reviewer spawning:** One Spec Quality Reviewer per batch feature, all spawned in the same step (parallel — the batch is homogeneous, nothing to wait for). Deferred features are never reviewed this invocation.

For each feature to review:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-3/spec-quality-reviewer.md` and execute your complete task as described. Feature folder: `{feature_folder_path}` — review the feature-overview.md and every spec file in it (any of the five spec types: screen, automation, logic-rule, integration, notification). Read the dependency map at `.n2b/specifications/feature-dependency-map.md` and the relevant Stage 2 documents from `.n2b/features/` as cross-checking context. You review — you do not fix: report findings per your contract's output contract, classified by your contract's severity model (must-fix / should-fix / notes). Do not ask for clarification — work autonomously."
- Tools: Read, Write
- Model: resolved from the **Spec Quality Reviewer** (Stage 3) row of model-profiles.md under MODEL_PROFILE (Step 1)
- maxTurns: 70

**Routing reviewer results (per feature):**

- **No must-fix findings:** The feature passes review. Update tracker: `status: done`, `quality_passed: true`. Update STAGE.md Feature Progress: `✅ DONE`, Quality column `reviewed: pass`. Increment `features_done` by 1.
- **Must-fix findings — one revision cycle (maximum 1 per feature):** Re-spawn that feature's Feature Spec Producer with the revision context:
  - Prompt: "Read the agent contract at `.claude/n2b/agents/stage-3/feature-spec-producer.md`. Revision cycle (1 of maximum 1): an independent quality review found must-fix findings in this feature's specs. Feature folder: `{feature_folder_path}`. Must-fix findings (spec IDs + evidence): {reviewer's must-fix findings}. Revise ONLY the affected specs to resolve every must-fix finding, keeping all spec IDs, frontmatter, and section contracts intact. Re-run your Phase 2.5 self-review on the revised specs. Do not ask for clarification — work autonomously."
  - Tools: Read, Write
  - Model: same as the original Feature Spec Producer spawn (the **Feature Spec Producer** row under MODEL_PROFILE)
  - maxTurns: 120

  Then re-review once — re-spawn the same feature's Spec Quality Reviewer with the identical review prompt plus: "Re-review after a revision cycle: verify each previously-reported must-fix finding is resolved; report any that remain."
  - Tools: Read, Write
  - Model: same as the original Spec Quality Reviewer spawn (the **Spec Quality Reviewer** row under MODEL_PROFILE)
  - maxTurns: 70

  - If the re-review reports no remaining must-fix findings: update tracker `status: done`, `quality_passed: true`; STAGE.md Feature Progress `✅ DONE`, Quality column `reviewed: pass-after-revision`; increment `features_done`; record the revision cycle in `## Deviations` (`- **Pass C revision:** {FEAT-ID} — {count} must-fix findings, revised and re-reviewed clean`).
  - If must-fix findings remain after the re-review: the revision cycle is exhausted. Record the outstanding findings in STAGE.md `## Deviations`, set that feature's Quality cell to `✗ must-fix outstanding`, and leave its tracker at `status: in-progress` / `quality_passed: false` (resume will re-run the review for this feature). Continue reviewing the remaining features, then take the failure path below.
- Should-fix findings and notes never trigger a revision cycle — they are recorded with the feature's review result (append them to the feature's row context or `## Deviations` when noteworthy).

**After all the batch's features' reviews conclude:**

- **If any batch feature has outstanding must-fix findings:** Execute the `gate-fail` transition from tracking-protocol.md with failure identifier `stage-3-pass-c-failed` (PIPELINE.md: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-3-pass-c-failed`; STATE.md: `stage_status: gate-failed`, Session Continuity blockers list the affected features). Display the structured failure block (same markdown shape as the Step 7 gate-failure message, titled "Pass C — Quality Review" with the per-feature must-fix evidence) and HALT. Partial output is preserved; `/n2b:s3-specify --continue` resumes, re-reviews the affected features, and carries on with the remaining batches.
- **Otherwise — step-complete transition after the Pass C batch (batch-aware):**

Update s3-specify/STAGE.md:
- Tick `- [x] Pass C — Quality Review (spec_review: independent)` **only when every feature in the whole stage is `done`** (`DEFERRED_COUNT = 0`). While review-pending features remain, leave the checkbox unticked.
- Refresh Feature Progress table with current per-feature states
- Set frontmatter: `current_pass: pass-c` (or `pass-d` when `DEFERRED_COUNT = 0`)

Update STATE.md:
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Pass C batch complete — {N} features reviewed", Next action: "Batch checkpoint"

Display completion:

```
  ✓  Pass C batch complete — {N} features reviewed ({X} pass, {Y} pass-after-revision) ({done total}/{features_total} done)
```

**Then proceed directly to Step 4.75 (checkpoint gate).** A Pass C invocation never continues into Pass D — even when this batch reviewed the last feature. The terminal invocation (Pass D + Gate A) always runs in its own fresh context.

---

## Step 4.75 — Checkpoint Gate

**Runs unconditionally after every pass batch** — Pass A (Step 3), Pass B (Step 4), or Pass C (Step 4.5). Every batch ends at a checkpoint; the only invocation that never reaches this step is the terminal one (classification found everything `done` and routed straight to Step 5).

Compute the forward workload for the checkpoint display (each count over the per-feature classification, refreshed by this batch's updates):

```bash
# Remaining work per pass, post-batch
UNANALYZED_LEFT={features with no tracker}
SPECS_LEFT={trackers awaiting specs (status not-started, or in-progress with incomplete specs)}
REVIEW_LEFT={trackers review-pending}   # always 0 in self-only mode
DONE_TOTAL={trackers status done}
# Remaining invocations ≈ ceil of each per-pass count / BATCH_SIZE, + 1 terminal (Pass D + Gate A)
```

Execute the `batch-checkpoint` transition from tracking-protocol.md and STOP this invocation cleanly — do not start another pass, do not run Gate A, do not fire any other transition. In order:

1. **s3-specify/STAGE.md** — frontmatter: `checkpoints: {N}` (increment by 1). `current_pass` keeps the value the pass's step-complete set (the pass the next invocation runs). Body: append to the Steps section: `- [x] Checkpoint {N} (Pass {A|B|C} batch): {batch FEAT-IDs} — {pass-scoped progress, e.g. "12/27 analyzed" | "8/27 specced" | "4/27 reviewed"} ({timestamp})`. The Feature Progress table is already current from per-feature updates. `status` stays `in-progress` — the receipt write-lock does not begin at a checkpoint.
2. **PIPELINE.md** — `last_updated: {timestamp}` only. `active_stage` stays `3`, `pipeline_status` stays `running` — a checkpoint is deliberately the same pipeline state an interrupted run leaves, so every resume path (gatekeeper, status routing) already handles it.
3. **STATE.md** — frontmatter: `current_step: checkpoint`, `last_updated: {timestamp}`. Body: `## Current Position`: "Stage 3 — Create Specifications / Checkpoint {N} after a Pass {A|B|C} batch — {DONE_TOTAL}/{features_total} features done. Remaining: {UNANALYZED_LEFT} to analyze, {SPECS_LEFT} to spec, {REVIEW_LEFT} to review (~{remaining invocations incl. terminal} more run(s) at batch size {BATCH_SIZE})". `## Session Continuity`: Last action: "Checkpoint {N} — Pass {A|B|C} batch {batch FEAT-IDs}", Next action: "/n2b:s3-specify --continue", Blockers: "None".
4. **Display the checkpoint block** (CHECKPOINT is a registered ui-brand banner):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  Pass {A|B|C} batch complete — {batch FEAT-IDs}
  ✓  Stage progress: {analyzed total}/{features_total} analyzed · {specced total}/{features_total} specced · {DONE_TOTAL}/{features_total} done

---

## ▶ Next Up

**Pass {next pass letter} — {count for that pass} feature(s) awaiting {analysis|specs|review}** (~{remaining invocations incl. terminal} more run(s) at batch size {BATCH_SIZE}, including the final Pass D + Gate A run)

`/n2b:s3-specify --continue`

*(`/clear` first → fresh context window. Check your remaining provider budget — e.g. `/usage` — and continue now or in your next quota window. `--batch N` adjusts the next batch's size; `--batch all` runs the whole next pass in one go.)*

---

**Also available:**
- `/n2b:status` — check pipeline progress

---
```

(When the next invocation is the terminal one — everything `done` — phrase Next Up as: `**Pass D + Gate A — final run** — reconciliation, structural validation, and stage completion`.)

Then END the invocation. The next `/n2b:s3-specify --continue` re-enters through the gatekeeper (in-progress → resume), Step 1.5 Path B reclassifies from disk truth, and the current-pass table routes to the next batch.

---

## Step 5 — Pass D: Reconciliation (Cross-Reference Reconciler) — Terminal Invocation

**Routing (from Step 1.5's current-pass derivation):** this step runs only in the **terminal invocation** — classification found every feature `done`. This invocation runs Pass D + Gate A + stage-complete and fires no checkpoint.

**Self-only mode bookkeeping:** if `SPEC_REVIEW == "self-only"` and the Pass C checkbox is still unticked, annotate it now: `- [x] Pass C — Quality Review (spec_review: independent) — skipped (spec_review: self-only)`.

**On resume:** Check STAGE.md Steps section — if `- [x] Pass D — Reconciliation` is already ticked, skip Pass D and proceed directly to Step 6 (Gate A).

```
  ✓  Pass D: skipped (already complete)
```

**Otherwise:**

Display the Pass D banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS D
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass D: Cross-Reference Reconciler started — checking cross-feature consistency
```

Spawn the Reconciler:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-3/cross-reference-reconciler.md` and execute your complete task as described. Specifications directory: `.n2b/specifications/`. Read all feature folders, specs, Briefs, and the Feature Dependency Map. The spec-type enum is five — screen, automation, logic-rule, integration, notification — and your dangling-reference and bidirectionality checks cover Integration and Notification specs too. Verify the dependency map's `## External Touchpoints` section is consistent with the Integration specs (every touchpoint row's spec exists and vice versa), Notification triggers are consistent with their automation/integration sources, and every Degradation Behavior screen reference exists. Run your Check 14 platform-parameter sweep: collect every `platform parameter:` marker into `.n2b/specifications/platform-parameters.md` from the template at `.claude/n2b/templates/stage-3/platform-parameters.md` (skip the file only when zero markers exist), proposing non-binding defaults grounded in `features/market-research.md` and BRIEF.md. Write your deliverables per your contract's deliverables section. Do not ask for clarification — work autonomously."
- Tools: Read, Write, Bash
- Model: resolved from the **Cross-Reference Reconciler** (Stage 3) row of model-profiles.md under MODEL_PROFILE (Step 1)
- maxTurns: 90

Wait for the Reconciler to complete.

**Gap routing:** After the Reconciler finishes, check its output for gap classifications:

- **`[STRUCTURAL-GAP]` findings:** Re-spawn the affected Feature Spec Producer for that feature with the gap context (same model as the original producer spawn). The re-spawn prompt must include: which spec needs fixing, what is missing, and the reconciler's evidence. Maximum 1 re-spawn cycle per feature.
- **`[MISSING-SPEC]` findings:** Re-spawn the affected feature's Feature Analyst (via a new Agent call, model resolved from the **Feature Analyst** row under MODEL_PROFILE) to update the Brief, then spawn a Feature Spec Producer for the new spec (its usual resolved model). Maximum 1 cycle.
- **`[ALIGNMENT]` findings:** Already resolved by the Reconciler directly. No action needed.

If any re-spawns occurred, run a final reconciliation pass (alignment-only) to verify consistency.

**step-complete transition after Pass D:**

Update s3-specify/STAGE.md:
- Tick `- [x] Pass D — Reconciliation`
- Set frontmatter: `current_pass: gate-a`

Update STATE.md:
- `current_step: gate-a`
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Pass D complete — reconciliation done", Next action: "Gate A — structural validation"

Display completion:

```
  ✓  Pass D complete — cross-feature reconciliation done
```

---

## Step 6 — Gate A Validation

**gate-check transition BEFORE running checks:**

Update STATE.md frontmatter:
- `stage_status: gate-check`
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Gate A validation running", Next action: "Awaiting gate result"

Begin recording in STAGE.md Gates section:

```
## Gates

### Gate A — Structural Validation
```

This is the primary value-add of the workflow. Run ALL 6 categories using Bash (grep, find, awk — NOT the Read tool for individual specs). Track hard failures and soft failures separately.

Initialize a gate log file so results persist across separate bash invocations:

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
echo "=== Gate A run $(date -u +"%Y-%m-%dT%H:%M:%SZ") ===" >> "$GATE_LOG"
```

Each category block below MUST append its "HARD FAIL" and "SOFT FAIL" lines to `$GATE_LOG` (via `>> "$GATE_LOG"`) instead of only printing to stdout. Echo lines for progress are fine, but every failure verdict must also go to the log file so the aggregation step can count them reliably.

**IMPORTANT: Gate log is append-only.** Never truncate or clear `gate-a.log` (no `: > "$GATE_LOG"`). The initialization block above appends a fresh `=== Gate A run {timestamp} ===` header at the start of EVERY run (first run and re-runs alike) — never skip it. This preserves the full audit trail across runs, while the aggregation step counts only the lines after the most recent run header, so failures from earlier runs never bleed into the current run's verdict.

### Category 1 — Feature Folder Validation

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

# Count features from product-features.md
FEATURE_COUNT=$(grep -c '^\*\*ID:\*\* FEAT-' .n2b/features/product-features.md)
echo "Expected features: $FEATURE_COUNT"

# Check each FEAT-* folder exists with feature-overview.md
FOLDER_COUNT=0
for dir in .n2b/specifications/FEAT-*/; do
  [ -d "$dir" ] || continue
  FOLDER_COUNT=$((FOLDER_COUNT + 1))
  if [ ! -f "$dir/feature-overview.md" ]; then
    fail "HARD FAIL: missing feature-overview.md in $dir"
  else
    # Validate frontmatter
    grep -q "^document_type:" "$dir/feature-overview.md" || fail "HARD FAIL: missing document_type in $dir/feature-overview.md"
    grep -q "^feature_number:" "$dir/feature-overview.md" || fail "HARD FAIL: missing feature_number in $dir/feature-overview.md"
  fi

  # Check frontmatter spec_count vs actual spec files
  BRIEF_SPEC_COUNT=$(grep "^spec_count:" "$dir/feature-overview.md" 2>/dev/null | sed 's/^spec_count: *//' | tr -d ' ')
  ACTUAL_SPEC_COUNT=$(find "$dir" -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
  [ "$BRIEF_SPEC_COUNT" = "$ACTUAL_SPEC_COUNT" ] || fail "HARD FAIL: spec count mismatch in $dir (frontmatter: $BRIEF_SPEC_COUNT, actual: $ACTUAL_SPEC_COUNT)"
done

# Check folder count matches feature count
[ "$FOLDER_COUNT" = "$FEATURE_COUNT" ] || fail "HARD FAIL: folder count ($FOLDER_COUNT) != feature count ($FEATURE_COUNT)"
echo "Category 1 complete: $FOLDER_COUNT folders checked"
```

Record in STAGE.md Gates section (per-category evidence):
```
- [ ] Category 1 — Feature Folder Validation: {FOLDER_COUNT} folders, {FEATURE_COUNT} expected — {evidence}
```

### Category 2 — Per-Spec Structural Validation

Required-section greps per spec type (three-way match: this gate == the spec templates == contract C-20):

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

# Validate every spec file across all feature folders
for spec in .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md; do
  [ -f "$spec" ] || continue
  BASENAME=$(basename "$spec")

  # File naming pattern check
  echo "$BASENAME" | grep -qE "^FEAT-[0-9]+\.SPEC-[0-9]+-.*\.md$" || fail "HARD FAIL: invalid naming $BASENAME"

  # Required frontmatter fields
  grep -q "^document_type: spec" "$spec" || fail "HARD FAIL: missing document_type: spec in $BASENAME"
  grep -q "^spec_type:" "$spec" || fail "HARD FAIL: missing spec_type in $BASENAME"
  grep -q "^spec_id:" "$spec" || fail "HARD FAIL: missing spec_id in $BASENAME"
  grep -q "^parent_feature:" "$spec" || fail "HARD FAIL: missing parent_feature in $BASENAME"
  grep -q "^produced_by: spec-writer" "$spec" || fail "HARD FAIL: missing produced_by: spec-writer in $BASENAME"
  grep -q "^status: final" "$spec" || fail "HARD FAIL: missing status: final in $BASENAME"

  # Determine spec type and check required sections (five case arms — case-tolerant matching)
  SPEC_TYPE=$(grep "^spec_type:" "$spec" | head -1 | sed 's/^spec_type: *//')
  case "$SPEC_TYPE" in
    screen|Screen)
      for section in "## Access and Visibility" "## Layout" "## Interactions" "## States"; do
        grep -q "$section" "$spec" || fail "HARD FAIL: missing '$section' in $BASENAME"
      done
      ;;
    automation|Automation)
      for section in "## Trigger Definition" "## Processing Logic"; do
        grep -q "$section" "$spec" || fail "HARD FAIL: missing '$section' in $BASENAME"
      done
      ;;
    logic|rule|Logic|Rule|logic-rule|Logic-Rule)
      for section in "## Governed Entity" "## Field Validation Rules" "## Authorization Rules"; do
        grep -q "$section" "$spec" || fail "HARD FAIL: missing '$section' in $BASENAME"
      done
      ;;
    integration|Integration)
      for section in "## Capability Category" "## Degradation Behavior"; do
        grep -q "$section" "$spec" || fail "HARD FAIL: missing '$section' in $BASENAME"
      done
      ;;
    notification|Notification)
      for section in "## Content Definition" "## Delivery Rules"; do
        grep -q "$section" "$spec" || fail "HARD FAIL: missing '$section' in $BASENAME"
      done
      ;;
  esac

  # Analytics section (soft) — screen, automation, integration, and notification specs
  # carry ## Analytics and Success Signals (logic-rule specs do not: rules enforce, they don't emit)
  case "$SPEC_TYPE" in
    screen|Screen|automation|Automation|integration|Integration|notification|Notification)
      grep -q "## Analytics and Success Signals" "$spec" || fail "SOFT FAIL: missing '## Analytics and Success Signals' in $BASENAME"
      ;;
  esac

  # Acceptance criteria present and non-empty
  if grep -q "## Acceptance Criteria" "$spec"; then
    CRITERIA_LINES=$(awk '/^## Acceptance Criteria/{found=1; next} /^## /{found=0} found && NF>0{count++} END{print count+0}' "$spec")
    [ "$CRITERIA_LINES" -gt 0 ] || fail "HARD FAIL: empty Acceptance Criteria in $BASENAME"
  else
    fail "HARD FAIL: missing Acceptance Criteria in $BASENAME"
  fi

  # Leaked template-artifact lines (soft) — a whole prose line still wrapped in single braces
  # (e.g. "{The core derivation the rule below applies...}") is an unfilled template
  # instruction, not content. Pattern targets brace-wrapped prose starting with a letter,
  # which JSON/code examples inside fenced blocks don't match.
  ARTIFACT_LINE=$(grep -nE '^\{[A-Za-z][^{}]*\}\s*$' "$spec" | head -1)
  [ -z "$ARTIFACT_LINE" ] || fail "SOFT FAIL: leaked template-artifact line in $BASENAME at $ARTIFACT_LINE (check manually)"
done
echo "Category 2 complete"
```

### Category 3 — Cross-Spec Validation

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

# All six count fields present in every Brief (zero is legal, an absent field is not)
for dir in .n2b/specifications/FEAT-*/; do
  [ -d "$dir" ] || continue
  for fieldname in spec_count screen_count automation_count logic_rule_count integration_count notification_count; do
    grep -q "^${fieldname}:" "$dir/feature-overview.md" 2>/dev/null || fail "HARD FAIL: missing ${fieldname} in ${dir}feature-overview.md"
  done
done

# Total spec count across all feature-overview frontmatter spec_count fields
TOTAL_BRIEF_SPECS=0
for dir in .n2b/specifications/FEAT-*/; do
  [ -d "$dir" ] || continue
  COUNT=$(grep "^spec_count:" "$dir/feature-overview.md" 2>/dev/null | sed 's/^spec_count: *//' | tr -d ' ')
  [ -n "$COUNT" ] && TOTAL_BRIEF_SPECS=$((TOTAL_BRIEF_SPECS + COUNT))
done

# Total actual spec files
TOTAL_ACTUAL_SPECS=$(find .n2b/specifications -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
[ "$TOTAL_BRIEF_SPECS" = "$TOTAL_ACTUAL_SPECS" ] || fail "HARD FAIL: total spec count mismatch (frontmatter totals: $TOTAL_BRIEF_SPECS, actual: $TOTAL_ACTUAL_SPECS)"

# New-type count queries: Brief frontmatter totals vs actual typed files
TOTAL_BRIEF_INTEG=0
TOTAL_BRIEF_NOTIF=0
for dir in .n2b/specifications/FEAT-*/; do
  [ -d "$dir" ] || continue
  IC=$(grep "^integration_count:" "$dir/feature-overview.md" 2>/dev/null | sed 's/^integration_count: *//' | tr -d ' ')
  NC=$(grep "^notification_count:" "$dir/feature-overview.md" 2>/dev/null | sed 's/^notification_count: *//' | tr -d ' ')
  [ -n "$IC" ] && TOTAL_BRIEF_INTEG=$((TOTAL_BRIEF_INTEG + IC))
  [ -n "$NC" ] && TOTAL_BRIEF_NOTIF=$((TOTAL_BRIEF_NOTIF + NC))
done
INTEG_COUNT=$(grep -rl "^spec_type:.*[Ii]ntegration" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
NOTIF_COUNT=$(grep -rl "^spec_type:.*[Nn]otification" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$TOTAL_BRIEF_INTEG" = "$INTEG_COUNT" ] || fail "HARD FAIL: integration_count totals ($TOTAL_BRIEF_INTEG) != actual integration specs ($INTEG_COUNT)"
[ "$TOTAL_BRIEF_NOTIF" = "$NOTIF_COUNT" ] || fail "HARD FAIL: notification_count totals ($TOTAL_BRIEF_NOTIF) != actual notification specs ($NOTIF_COUNT)"

# Check for duplicate spec IDs
SPEC_IDS=$(grep -rh "^spec_id:" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | sort)
UNIQUE_IDS=$(echo "$SPEC_IDS" | sort -u)
[ "$(echo "$SPEC_IDS" | wc -l)" = "$(echo "$UNIQUE_IDS" | wc -l)" ] || fail "HARD FAIL: duplicate spec IDs found"

# Check for orphaned specs (spec file without Brief entry)
for spec in .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md; do
  [ -f "$spec" ] || continue
  SPEC_ID=$(grep "^spec_id:" "$spec" | head -1 | sed 's/^spec_id: *//')
  PARENT_DIR=$(dirname "$spec")
  grep -q "$SPEC_ID" "$PARENT_DIR/feature-overview.md" 2>/dev/null || fail "HARD FAIL: orphaned spec $SPEC_ID not in Brief inventory"
done

# Reconciliation log exists
[ -f ".n2b/specifications/reconciliation-log.md" ] || fail "HARD FAIL: missing reconciliation-log.md"

# Check for unresolved entries (soft failure) — only match actual unresolved status markers, not the word in headings
if [ -f ".n2b/specifications/reconciliation-log.md" ]; then
  UNRESOLVED=$(grep -ciE "status:.*unresolved|resolution:.*pending|⚠.*unresolved" .n2b/specifications/reconciliation-log.md 2>/dev/null); UNRESOLVED=${UNRESOLVED:-0}
  [ "$UNRESOLVED" = "0" ] || fail "SOFT FAIL: $UNRESOLVED unresolved entries in reconciliation log"
fi

echo "Category 3 complete"
```

### Category 4 — Dependency Map Validation

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

# File exists
[ -f ".n2b/specifications/feature-dependency-map.md" ] || fail "HARD FAIL: missing feature-dependency-map.md"

if [ -f ".n2b/specifications/feature-dependency-map.md" ]; then
  # Feature count matches product-features.md (count unique FEAT-NN references)
  MAP_FEATURE_COUNT=$(grep -oE "FEAT-[0-9]+" .n2b/specifications/feature-dependency-map.md | sort -u | wc -l | tr -d ' ')
  PRODUCT_FEATURE_COUNT=$(grep -c '^\*\*ID:\*\* FEAT-' .n2b/features/product-features.md)
  [ "$MAP_FEATURE_COUNT" = "$PRODUCT_FEATURE_COUNT" ] || fail "HARD FAIL: dependency map feature count ($MAP_FEATURE_COUNT) != product-features ($PRODUCT_FEATURE_COUNT)"

  # Has Shared Entities section (flexible heading match)
  grep -qiE "shared.*(entities|data|models)|common.*entities|cross.*feature.*entities" .n2b/specifications/feature-dependency-map.md || fail "SOFT FAIL: dependency map may be missing Shared Entities section (check manually)"

  # External Touchpoints section present
  grep -q "^## External Touchpoints" .n2b/specifications/feature-dependency-map.md || fail "HARD FAIL: dependency map missing ## External Touchpoints section"

  # Every Integration spec ID referenced in External Touchpoints exists as a file
  for SID in $(awk '/^## External Touchpoints/{f=1; next} f && /^## /{exit} f' .n2b/specifications/feature-dependency-map.md | grep -oE "FEAT-[0-9]+\.SPEC-[0-9]+" | sort -u); do
    find .n2b/specifications -name "${SID}-*.md" 2>/dev/null | head -1 | grep -q "." || fail "HARD FAIL: External Touchpoints references $SID but no such spec file exists"
  done

  # Contention line per shared entity (soft)
  SHARED_ENTITY_COUNT=$(awk '/^## Shared Data Entities/{f=1; next} f && /^## /{exit} f && /^### /{n++} END{print n+0}' .n2b/specifications/feature-dependency-map.md)
  CONTENTION_COUNT=$(awk '/^## Shared Data Entities/{f=1; next} f && /^## /{exit} f && /^[-* ]*\*\*Contention:\*\*/{n++} END{print n+0}' .n2b/specifications/feature-dependency-map.md)
  [ "$CONTENTION_COUNT" -ge "$SHARED_ENTITY_COUNT" ] || fail "SOFT FAIL: only $CONTENTION_COUNT **Contention:** lines for $SHARED_ENTITY_COUNT shared entities (check manually)"

  # Every feature number has a corresponding folder
  for feat_num in $(grep -oE "FEAT-[0-9]+" .n2b/specifications/feature-dependency-map.md | sort -u); do
    ls -d .n2b/specifications/${feat_num}-*/ 2>/dev/null | head -1 | grep -q "." || fail "HARD FAIL: $feat_num in dependency map has no folder"
  done
fi

echo "Category 4 complete"
```

### Category 5 — Design System Passthrough Validation

Conditional on `DS_SOURCE` (read in Step 1) — the design system is a verbatim user-supplied passthrough, never generated:

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

CFG_DS_SOURCE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('design_system_source','none'))" 2>/dev/null || echo "none")
case "$CFG_DS_SOURCE" in none|user) ;; *) CFG_DS_SOURCE="none" ;; esac

if [ "$CFG_DS_SOURCE" = "user" ]; then
  # Passthrough directory exists, is non-empty, and mirrors the intake file count
  PACK_COUNT=$(find .n2b/specifications/design-system -type f 2>/dev/null | wc -l | tr -d ' ')
  INPUT_COUNT=$(find .n2b/inputs/design-system -type f 2>/dev/null | wc -l | tr -d ' ')
  [ "$PACK_COUNT" -gt 0 ] || fail "HARD FAIL: design_system_source=user but .n2b/specifications/design-system/ is missing or empty"
  [ "$PACK_COUNT" = "$INPUT_COUNT" ] || fail "HARD FAIL: design-system passthrough incomplete ($PACK_COUNT of $INPUT_COUNT intake files copied)"
  echo "Category 5 complete: passthrough validated ($PACK_COUNT files)"
else
  # No design system in this package — a stale passthrough dir would misrepresent the config
  [ -d ".n2b/specifications/design-system" ] && fail "SOFT FAIL: design_system_source=none but .n2b/specifications/design-system/ exists (stale passthrough — check config)"
  echo "Category 5 complete: skipped (design_system_source: none — package ships design-agnostic)"
fi
```

### Category 6 — Platform-Parameters Registry Validation

Reconciles the platform-parameter markers in the specs against the Pass D registry
(contract C-36, decision 105) — the roster-grep discipline, both directions:

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
fail() { echo "$1"; echo "$1" >> "$GATE_LOG"; }

PP_REG=".n2b/specifications/platform-parameters.md"
# Every distinct marker slug across the spec files (the marker is the literal phrase
# followed by a backticked kebab-case slug)
PP_MARKED=$(grep -rhoE 'platform parameter: `[a-z0-9][a-z0-9-]*`' .n2b/specifications/FEAT-*/ 2>/dev/null \
  | sed -E 's/.*`([a-z0-9-]+)`.*/\1/' | sort -u)
PP_MARK_COUNT=$(printf '%s' "$PP_MARKED" | grep -c . || true); PP_MARK_COUNT=${PP_MARK_COUNT:-0}

if [ "$PP_MARK_COUNT" -eq 0 ]; then
  # No markers: the registry is optional; a stale one would misrepresent the specs
  [ -f "$PP_REG" ] && fail "SOFT FAIL: platform-parameters.md exists but no spec carries a platform-parameter marker (stale registry)"
  echo "Category 6 complete: skipped (no platform-parameter markers in the specs)"
else
  [ -f "$PP_REG" ] || fail "HARD FAIL: $PP_MARK_COUNT platform-parameter slug(s) marked in specs but platform-parameters.md is missing"
  if [ -f "$PP_REG" ]; then
    # Registry rows: first cell of each table data row is the backticked slug
    PP_ROWS=$(grep -oE '^\| *`[a-z0-9][a-z0-9-]*`' "$PP_REG" 2>/dev/null \
      | sed -E 's/.*`([a-z0-9-]+)`.*/\1/' | sort -u)
    # Symmetric difference: marked-but-unregistered OR registered-but-unmarked
    PP_DIFF=$(printf '%s\n%s\n' "$PP_MARKED" "$PP_ROWS" | grep -E '^[a-z0-9]' | sort | uniq -u | tr '\n' ' ')
    [ -z "$PP_DIFF" ] || fail "HARD FAIL: platform-parameter slugs and registry rows do not reconcile — marked-but-unregistered or registered-but-unmarked: $PP_DIFF"
    # Every row still awaiting decision as shipped — row-scoped on both sides (one
    # slug charset everywhere: [a-z0-9][a-z0-9-]*), so prose or comments carrying the
    # phrase can never mask a flipped row
    NONDECIDE=$(grep -cE '^\| *`[a-z0-9][a-z0-9-]*`' "$PP_REG" 2>/dev/null); NONDECIDE=${NONDECIDE:-0}
    DECIDE_ROWS=$(grep -E '^\| *`[a-z0-9][a-z0-9-]*`' "$PP_REG" 2>/dev/null | grep -c 'decide-before-build'); DECIDE_ROWS=${DECIDE_ROWS:-0}
    [ "$DECIDE_ROWS" -ge "$NONDECIDE" ] || fail "SOFT FAIL: $((NONDECIDE - DECIDE_ROWS)) registry row(s) lack decide-before-build status — the shipped package never pre-decides policy values"
  fi
  echo "Category 6 complete: $PP_MARK_COUNT parameter slug(s) reconciled against the registry"
fi
# Lints run in BOTH branches — a package whose only sites are malformed must not skip them.
# Bare legacy phrasing: platform-set values always carry the marker
PP_BARE=$(grep -rliE 'fixed platform-wide' .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
[ "$PP_BARE" = "0" ] || fail "SOFT FAIL: $PP_BARE spec file(s) say 'fixed platform-wide' without the platform-parameter marker — mark the site and re-run Pass D"
# Near-miss markers (capitalized phrase, uppercase/underscore slug, wrapped line) are
# invisible to the sweep — exactly the silent hole this registry exists to close
PP_NEAR=$(grep -rhiE 'platform parameter' .n2b/specifications/FEAT-*/ 2>/dev/null \
  | grep -cvE 'platform parameter: `[a-z0-9][a-z0-9-]*`'); PP_NEAR=${PP_NEAR:-0}
[ "$PP_NEAR" = "0" ] || fail "SOFT FAIL: $PP_NEAR line(s) mention a platform parameter without the exact marker shape (lowercase 'platform parameter:' + backticked kebab slug) — near-miss markers never reach the registry; fix the sites and re-run Pass D"
```

### Gate A Result Aggregation

After running all 6 categories, collect the results:

```bash
GATE_LOG=".n2b/tracking/stages/s3-specify/gate-a.log"
# Count failures from the CURRENT run only: the counter resets at every run header,
# so END holds the totals for the section after the LAST header. A legacy log with
# no header never resets and degrades gracefully to a whole-file count.
HARD_COUNT=$(awk '/^=== Gate A run /{n=0} /HARD FAIL/{n++} END{print n+0}' "$GATE_LOG" 2>/dev/null); HARD_COUNT=${HARD_COUNT:-0}
SOFT_COUNT=$(awk '/^=== Gate A run /{n=0} /SOFT FAIL/{n++} END{print n+0}' "$GATE_LOG" 2>/dev/null); SOFT_COUNT=${SOFT_COUNT:-0}
echo "Gate A: $HARD_COUNT hard failures, $SOFT_COUNT soft failures"
# Display only the current run's section (whole file when no header exists — legacy logs)
awk '/^=== Gate A run /{s=NR} {l[NR]=$0} END{for(i=(s?s:1); i<=NR; i++) print l[i]}' "$GATE_LOG" 2>/dev/null
```

Record per-category evidence in STAGE.md Gates section:

```
- [ ] Category 1 — Feature Folder Validation: {evidence}
- [ ] Category 2 — Per-Spec Structural: {evidence}
- [ ] Category 3 — Cross-Spec: {evidence}
- [ ] Category 4 — Dependency Map: {evidence}
- [ ] Category 5 — Design System: {evidence}
- [ ] Category 6 — Platform Parameters: {evidence}
```

If HARD_COUNT > 0: proceed to Step 7 failure path.
If HARD_COUNT = 0 and SOFT_COUNT > 0: proceed to Step 7 success path with warnings.
If HARD_COUNT = 0 and SOFT_COUNT = 0: proceed to Step 7 success path (clean pass). Display the pass banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE A PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  6 categories validated — {TOTAL_ACTUAL_SPECS} specs across {FOLDER_COUNT} features
```

(Display the same banner on the success-with-warnings path, appending `  ⚠  {SOFT_COUNT} soft warnings` as a status line.)

**Category 5 retry logic:** If Gate A fails ONLY on Category 5 (design-system passthrough) and Categories 1-4 all pass, re-run the Step 2 passthrough copy once (`cp -R .n2b/inputs/design-system/. .n2b/specifications/design-system/`), then re-run Category 5 only. If the retry also fails, report failure. Do NOT retry the Requirements Architect or Feature Spec Producers at the gate — report failure with Gate A details instead. Pass C reviewer re-runs are feature-scoped and occur only inside Step 4.5 (maximum 1 revision cycle per feature) — Gate A never re-spawns reviewers.

---

## Step 7 — Tracking Transitions

### Success path (no hard failures) — stage-complete

Extract counts for the completion report (reuse counts computed during Gate A Category 1 and Category 3):

```bash
TOTAL_FEATURES=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SPECS=$(find .n2b/specifications -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
SCREEN_COUNT=$(grep -rl "^spec_type:.*[Ss]creen" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
AUTO_COUNT=$(grep -rl "^spec_type:.*[Aa]utomation" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
LOGIC_COUNT=$(grep -rl "^spec_type:.*[Ll]ogic\|^spec_type:.*[Rr]ule" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
INTEG_COUNT=$(grep -rl "^spec_type:.*[Ii]ntegration" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
NOTIF_COUNT=$(grep -rl "^spec_type:.*[Nn]otification" .n2b/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
COMPLETION_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STARTED_TIMESTAMP=$(grep "^started:" .n2b/tracking/stages/s3-specify/STAGE.md | awk '{print $2}')
```

Execute the 4-step stage-complete sequence from tracking-protocol.md. Perform all 4 steps in order — do not skip or reorder.

**Step 7.1 — Finalize STAGE.md** (do this first):

Update s3-specify/STAGE.md frontmatter:
- `status: complete`
- `completed: {COMPLETION_TIMESTAMP}`
- `features_done: {TOTAL_FEATURES}` (all done at gate pass)

Update s3-specify/STAGE.md body:
- Tick all remaining unchecked checkboxes
- `## Gates` section: replace all `- [ ]` with `- [x]` for passed categories, add `Result: **passed**` with 6-category evidence table
- `## Performance` section: fill Duration (cumulative across all invocations, from started to now), Agents spawned (Requirements Architect spawns across all Pass A batches + all Feature Analysts + all Feature Spec Producers + Spec Quality Reviewers when spawned + Cross-Reference Reconciler), Retries, Features processed, Resumes count, Checkpoints count (from frontmatter `checkpoints`)
- `## Output` section: list every file produced: feature folders with spec counts, feature-dependency-map.md, reconciliation-log.md, platform-parameters.md (when Pass D produced it, with its parameter count), and — when `design_system_source: user` — the design-system/ passthrough with its file count

After this step, s3-specify/STAGE.md is a **permanent receipt**. Do not modify it again.

**Step 7.2 — Update PIPELINE.md, then MANIFEST.md:**

Update `.n2b/tracking/PIPELINE.md` frontmatter:
- `active_stage: 0`
- `last_completed_stage: 3`
- `last_gate_result: stage-3-gate-a-passed`
- `pipeline_status: paused`
- `last_updated: {COMPLETION_TIMESTAMP}`

Update `.n2b/tracking/PIPELINE.md` body:
- Stage 3 checklist line: change `- [ ]` to `- [x]`, remove `← ACTIVE` marker, append: `Completed {date} | {TOTAL_SPECS} specs across {TOTAL_FEATURES} features`
- Add `← NEXT` to Stage 4 checklist line
- `## Stage History` section: add Stage 3 entry:
  ```
  ### Stage 3: Create Specifications
  - Completed: {COMPLETION_TIMESTAMP}
  - Gate: passed — Gate A (6-category structural validation)
  - Output: .n2b/specifications/ ({TOTAL_SPECS} specs, {TOTAL_FEATURES} features{, design-system/ passthrough when design_system_source: user})
  - Performance: {agent_count} agents, {duration} min, {retry_count} retries
  - Detail: → .n2b/tracking/stages/s3-specify/STAGE.md
  ```
- `## Artifact Lineage` table: for each FEAT-ID, update the "Stage 3 Specs" column with spec count and five-type breakdown:

```bash
# Per-FEAT-ID spec counts for Artifact Lineage (reuse Category 1 data)
for dir in .n2b/specifications/FEAT-*/; do
  FEAT_FOLDER=$(basename "$dir")
  FEAT_ID=$(echo "$FEAT_FOLDER" | grep -oE "FEAT-[0-9]+")
  FEAT_SPECS=$(find "$dir" -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
  FEAT_SCREEN=$(grep -rl "^spec_type:.*[Ss]creen" "$dir"FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
  FEAT_AUTO=$(grep -rl "^spec_type:.*[Aa]utomation" "$dir"FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
  FEAT_LOGIC=$(grep -rl "^spec_type:.*[Ll]ogic\|^spec_type:.*[Rr]ule" "$dir"FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
  FEAT_INTEG=$(grep -rl "^spec_type:.*[Ii]ntegration" "$dir"FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
  FEAT_NOTIF=$(grep -rl "^spec_type:.*[Nn]otification" "$dir"FEAT-*.SPEC-*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "$FEAT_ID: $FEAT_SPECS specs ($FEAT_SCREEN Screen, $FEAT_AUTO Auto, $FEAT_LOGIC Logic, $FEAT_INTEG Integ, $FEAT_NOTIF Notif)"
  # Update Artifact Lineage table row for $FEAT_ID with this count
done
```

**Then update `.n2b/tracking/MANIFEST.md`** — the canonical-package manifest (see tracking-protocol.md, stage-complete Step 2). Add (or, on a re-run, refresh) one `## Package Inventory` row per file under `.n2b/specifications/` — every feature-overview.md, every spec file, the shared documents (feature-dependency-map.md, reconciliation-log.md, and platform-parameters.md when Pass D produced it), and (when present) every file in the design-system/ passthrough.

Compute the fingerprints (first 12 hex chars of `shasum -a 256`) and ID-coverage ranges:

```bash
# Fingerprint every canonical Stage 3 file (all file types — the design-system
# passthrough may carry JSON tokens or PDFs alongside markdown)
for f in $(find .n2b/specifications -type f | sort); do
  echo "$f $(shasum -a 256 "$f" | cut -c1-12)"
done

# Per-Brief spec-ID coverage range (first and last spec ID in each feature's inventory)
for dir in .n2b/specifications/FEAT-*/; do
  echo "$dir $(grep -o "FEAT-[0-9]*\.SPEC-[0-9]*" "$dir/feature-overview.md" | sort -uV | sed -n '1p;$p' | tr '\n' ' ')"
done

# XBR coverage range for the dependency map
grep -o "XBR-[0-9][0-9]*" .n2b/specifications/feature-dependency-map.md | sort -uV | sed -n '1p;$p'
```

Row shapes (paths relative to `.n2b/`):

```
| specifications/FEAT-{NN}-{slug}/feature-overview.md | 3 | FEAT-{NN}.SPEC-001..{last} | {fingerprint} | {ISO timestamp} |
| specifications/FEAT-{NN}-{slug}/FEAT-{NN}.SPEC-{NNN}-{slug}.md | 3 | FEAT-{NN}.SPEC-{NNN} | {fingerprint} | {ISO timestamp} |
| specifications/feature-dependency-map.md | 3 | XBR-01..{highest XBR} | {fingerprint} | {ISO timestamp} |
| specifications/reconciliation-log.md | 3 | — | {fingerprint} | {ISO timestamp} |
| specifications/design-system/{filename} | 3 | — | {fingerprint} | {ISO timestamp} |
```

(The design-system/ rows exist only when `design_system_source: user` — one row per passthrough file, any file type.)

- One row per feature-overview.md (ID coverage = that feature's spec-ID range, e.g. `FEAT-03.SPEC-001..006`), one row per spec file (ID coverage = its own `FEAT-NN.SPEC-NNN`).
- Leave the Stage 1 and Stage 2 rows untouched.
- Increment `package_version` by 1 (one increment for this update — rows were added/changed) and refresh `last_updated` in the MANIFEST.md frontmatter.
- MANIFEST.md is written only by workflows during this transition — never by agents.

**Step 7.3 — Refresh STATE.md:**

Update `.n2b/tracking/STATE.md` frontmatter:
- `stage_status: between-stages`
- `current_step: none`
- `last_updated: {COMPLETION_TIMESTAMP}`

Update `.n2b/tracking/STATE.md` body:
- `## Current Position`: "Between stages. Awaiting next stage command."
- `## Accumulated Context`: preserve only cross-stage useful bits — feature count, spec counts by type ({TOTAL_SPECS} specs: {SCREEN_COUNT} Screen, {AUTO_COUNT} Automation, {LOGIC_COUNT} Logic/Rule, {INTEG_COUNT} Integration, {NOTIF_COUNT} Notification), design-system line ("user-supplied passthrough at specifications/design-system/ ({N} files)" or "none — package is design-agnostic"). Remove step-level progress counts (now in STAGE.md permanently).
- `## Session Continuity`: Last action: "Stage 3 Gate A passed", Next action: "/n2b:s4-architect", Blockers: "None"

Apply 50-80 line trim rules: count STATE.md lines. If over 80, remove step-level details already in STAGE.md, trim Accumulated Context to 5 most important facts. Session Continuity always fits in 3 lines.

**Step 7.4 — Display continuation message** (after Steps 7.1-7.3 complete):

If there were soft failures (SOFT_COUNT > 0), include warnings after the main summary line.

```
---

## ✓ Stage 3: Create Specifications Complete

{TOTAL_SPECS} specs across {TOTAL_FEATURES} features ({SCREEN_COUNT} Screen, {AUTO_COUNT} Automation, {LOGIC_COUNT} Logic/Rule, {INTEG_COUNT} Integration, {NOTIF_COUNT} Notification) + feature dependency map{ + user-supplied design system (passthrough) when design_system_source: user}

---

## ▶ Next Up

**Stage 4: Technical Architecture** — produce the recommended architecture plus documented alternatives for the specified product

`/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---

**Also available:**
- `/n2b:status` — check pipeline progress

---
```

### Failure path (any hard failure) — gate-fail

Execute the `gate-fail` transition from tracking-protocol.md.

**PIPELINE.md:**
- `active_stage: 0`
- `pipeline_status: failed`
- `last_gate_result: stage-3-gate-a-failed`
- `last_updated: {timestamp}`

**STATE.md:**
- `stage_status: gate-failed`
- `last_updated: {timestamp}`
- `## Session Continuity`: Last action: "Gate A failed — {HARD_COUNT} hard failures", Next action: "/n2b:s3-specify --continue to retry", Blockers: the gate failure reason(s)

**s3-specify/STAGE.md Gates section:**
- Mark passed categories: `- [x]`, failed categories: `- [ ]`
- Add `Result: **failed**` with per-category evidence:
  ```
  - [ ] {Category}: {what was checked} — FAILED: {specific reason with counts or file paths}
  ```
- Frontmatter: do NOT set `status: complete` — leave `status: in-progress`. Stage must re-run.

Display gate failure message:

```
---

## ✗ Stage 3: Gate Failed

Gate A — {N} of 6 categories failed

Failed checks:
- {Category}: {what failed and why}
- {Category}: {what failed and why}

---

## ▶ Next Action

Continue to retry: `/n2b:s3-specify --continue`

*(`/clear` first → fresh context window)*

---
```

Partial output is preserved. Do NOT delete any files that were successfully produced.

</process>

<success_criteria>

- All 7 Stage 2 documents validated (exist, non-empty, `status: final`) before any agent spawning or tracking updates — the pre-flight asserts nothing beyond what the Stage 2 templates emit
- Config keys read at pre-flight: `spec_review` (default `independent`, including when missing/invalid) and `design_system_source` (default `none`), per config-schema.md fallback discipline
- Design-system passthrough pre-flight: non-empty `.n2b/inputs/design-system/` with config `none` flips config to `user` and records the deviation (detection path); config `user` with a missing/empty directory halts with PRE-FLIGHT FAILED and recovery guidance (failure path)
- Design-system passthrough (Step 2): when `design_system_source: user`, files copied verbatim from `.n2b/inputs/design-system/` to `.n2b/specifications/design-system/` — zero agents, never normalized or restyled; idempotent on every invocation; when `none`, no design-system output exists and the package ships design-agnostic
- stage-rerun-guard checks s3-specify/STAGE.md status and the downstream `.n2b/tracking/stages/s4-architect/STAGE.md` (directory form, per the gatekeeper's stage registry — Stage 5 is `s5-export`, a post-completion consumer whose exports go stale, never block)
- A Stage 3 request under `pipeline_status: blueprint-complete` routes to the gatekeeper re-run guard (user confirm + stale-export marking) — never a hard halt
- stage-start (Step 1.5 Path A) placed AFTER pre-flight — prevents showing in-progress on Stage 2 validation failure
- stage-start updates PIPELINE.md (active_stage: 3, pipeline_status: running), STATE.md (current_step: pass-a, stage_status: in-progress), STAGE.md (status: in-progress)
- Full STAGE.md body skeleton written at stage-start with the four-pass Steps list (Pass A — Analysis / Pass B — Specification (includes self-review) / Pass C — Quality Review (spec_review: independent) / Pass D — Reconciliation), Feature Progress empty, Gates pending, Performance with dashes
- **Pass-scoped invocations:** every invocation runs exactly one pass for at most BATCH_SIZE features; an invocation never spans a pass boundary — completing a pass's final batch still checkpoints and ends the invocation; the only checkpoint-free invocation is the terminal one (all features `done` → Pass D + Gate A + stage-complete); there is NO single-invocation path for any project size
- **Current-pass derivation** (Step 1.5): classified fresh from disk truth every invocation over the FULL feature list from product-features.md — unanalyzed (no folder/tracker; invalid-Brief folders wiped) → Pass A; analyzed/wiped-incomplete → Pass B; review-pending → Pass C; all done → terminal; passes strictly sequential; trackers missing against a valid Brief are recreated from the Brief; nothing persisted about pass position beyond `current_pass` (informational)
- stage-resume classifies per-feature FEAT-NN-{slug}.md files: done features skipped; in `independent` mode, in-progress features with all expected specs on disk are review-pending (specs preserved, review re-run only); other in-progress features wiped for re-spec; increments `resumed` counter in STAGE.md frontmatter
- **Pass A batching** (Step 3): batch selected from unanalyzed features by product-features.md `**Priority:**` tier (Core → Important → Nice-to-Have, numeric within tier); `features_total` set from product-features.md count on the first Pass A invocation; Architect spawned batch-scoped (feature-scope list in prompt; dependency map built only when absent, covering ALL features; External Touchpoints full coverage check only on the FINAL_A_BATCH prompt); per-feature trackers created per-analyst for the batch; Pass A checkbox ticks only when every feature has a tracker
- Per-feature FEAT-NN-{slug}.md files created per-analyst during Pass A batch result processing — written to `.n2b/tracking/stages/s3-specify/` using the feature-tracker.md template shape; each contains feature ID, feature_name, `status: not-started`, `specs_expected: {N}`, `specs_written: 0`, `quality_passed: false`, and Specs checkbox list
- Pass A architect prompt carries the context-package requirements (C-14 Functional Depth fields + Phase, C-15 Access Matrix slice, C-16 NFR/Dependencies slices, C-17 journey coverage, success-metrics slice), the dependency-map requirements (External Touchpoints + Contention/Data Sensitivity), and the extended Brief validation (Roles Touched, six frontmatter counts); maxTurns 150
- **Pass B batching** (Step 4): runs only when all features analyzed and some await specs; batch by feature-overview.md `priority_tier` (Core → Important → Nice-to-Have, numeric within tier); producers spawned in parallel for batch features only; producer prompts list the five-type methodology/template lookup; maxTurns 120; NO reviewer spawns in a Pass B invocation
- Producer Phase 2.5 self-review runs in BOTH spec_review modes
- In `self-only` mode: producer completion sets tracker `status: done`, `quality_passed: true`, dashboard Quality `self-only`; Pass C never runs as an invocation; the terminal invocation annotates the Pass C checkbox as skipped
- **Pass C batching** (Step 4.5): runs only when all features have specs and some are review-pending; batch in numeric FEAT order; reviewers spawned in parallel (maxTurns 70); must-fix findings route ONE producer revision re-spawn (max 1 revision cycle per feature, maxTurns 120) then one re-review; Quality column lands `reviewed: pass` or `reviewed: pass-after-revision`; features with must-fix findings still outstanding after the cycle fail the stage (gate-fail with `stage-3-pass-c-failed`, `--continue` re-reviews them)
- **Checkpoint gate** (Step 4.75): fires after EVERY pass batch — `batch-checkpoint` transition (STAGE.md checkpoints+1 + pass-labeled Steps entry, PIPELINE.md last_updated only — stays `running`/`active_stage: 3`, STATE.md `current_step: checkpoint` + pass-scoped Current Position + `--continue` Next action) + CHECKPOINT banner block with per-pass remaining workload and estimated runs, then END the invocation
- **Pass checkbox discipline under batching:** Pass A / B / C checkboxes tick only in the invocation where the last feature clears that pass; per-feature truth lives in the trackers and Feature Progress table
- Terminal invocation (Step 5): Pass D skipped on resume if already ticked; reconciler prompt covers all five spec types, External Touchpoints ↔ Integration consistency, Notification trigger sources, Degradation Behavior screen references, and the Check 14 platform-parameter sweep (markers → platform-parameters.md with non-binding proposed defaults; file skipped only when zero markers exist — contract C-36); maxTurns 90; step-complete after Pass D ticks `- [x] Pass D — Reconciliation`, advances STATE.md current_step to gate-a
- gate-check transition: STATE.md stage_status: gate-check, STAGE.md Gates section begins recording per-category evidence
- Gate A validates all 6 categories: feature folders; per-spec structural with five spec-type case arms (screen/automation/logic-rule/integration/notification per the C-20 grep table) plus the soft Analytics-section check and the Acceptance-Criteria non-empty check; cross-spec with six-count-field presence and INTEG_COUNT/NOTIF_COUNT reconciliation; dependency map with External Touchpoints presence + Integration-spec existence (hard) and per-entity Contention lines (soft); design-system passthrough conditional on config — `user`: package dir non-empty + file count mirrors intake (hard); `none`: stale passthrough dir is a soft warning, otherwise skipped; platform-parameters registry (C-36) — marker slugs ↔ registry rows symmetric-difference empty (hard when markers exist), missing registry with markers present (hard), stale registry with zero markers / bare "fixed platform-wide" phrasing / near-miss marker shapes / missing row-scoped decide-before-build status (soft; the phrasing and near-miss lints run in both branches, so a package whose only sites are malformed still warns)
- Hard failures trigger gate-fail transition; partial output preserved; per-feature done files preserved for resume
- Soft failures produce continuation message with appended warnings
- Category 5 failure (Categories 1-4 passing) retries the Step 2 passthrough copy once then re-runs Category 5 only — no agent respawns; Pass C reviewer re-runs are feature-scoped inside Step 4.5 only — Gate A never re-spawns reviewers
- stage-complete 4-step sequence: STAGE.md finalized FIRST, then PIPELINE.md + MANIFEST.md, then STATE.md, then display continuation message
- MANIFEST.md gains one row per file under `.n2b/specifications/` (per-Brief rows with spec-ID-range coverage, per-spec rows with their own IDs, dependency map with XBR range, reconciliation log with `—`, platform-parameters.md with `—` when present, and one row per design-system/ passthrough file when present — any file type), fingerprints `shasum -a 256 | cut -c1-12`, `package_version` incremented by 1
- PIPELINE.md Artifact Lineage table populated with per-FEAT-ID spec counts across all five types (e.g., `6 specs (3 Screen, 1 Auto, 1 Logic, 1 Integ, 0 Notif)`)
- Continuation message: five-type spec-count breakdown, feature count, Stage 4 framed as "recommended architecture plus documented alternatives", /n2b:s4-architect, /clear guidance, Also available
- All banners use registered ui-brand.md names with the `n2b >` prefix and exactly 40 `━` characters
- No human interaction required at any point after the entry gate — fully autonomous within an invocation; a batch checkpoint ends the invocation cleanly rather than pausing mid-run
- **Batching arguments:** parsed at Step 0 (`--continue` → CONTINUE_MODE, `--batch N|all` → BATCH_OVERRIDE); batch size resolved at Step 1 (override → recorded frontmatter `batch_size` → default 4) and recorded into STAGE.md frontmatter; `--batch all` = every remaining feature of the CURRENT pass, the pass boundary still checkpoints
- **Halt-don't-wipe:** bare invocation on an in-progress stage presents the mid-flight modal ([1] Continue [2] Clean restart) and never silently wipes; `--continue` on not-started or complete HALTS with recovery guidance; `--continue` on in-progress/failed resumes without questions
- **Retry copy:** every mid-flight retry surface (Pass C failure, Gate A failure, checkpoint block) emits `/n2b:s3-specify --continue` — the bare form appears only for fresh starts and the complete-stage re-run modal
- Performance table carries the Checkpoints count; Duration is cumulative across invocations
- No UX Designer anywhere: no agent spawn, no model-profile lookup, no generated design-system.md — the design layer is exclusively the verbatim passthrough

</success_criteria>
