<!-- Traceability IDs (PIPE-XX, DOC-XX) reference the Stage 2 spec requirements.
     They are inline annotations confirming which spec constraint each step satisfies.
     PIPE-02: input validation, PIPE-03: parallel spawning, PIPE-04: sequential gating,
     PIPE-05: retry logic, PIPE-06: full autonomy. DOC-01: 7-document output set. -->

<purpose>

This workflow coordinates the define pipeline — spawning three sub-agents across two passes, validating output at each gate, and reporting results. It is a coordination entity that produces no documents itself. It reads agent contracts and dispatches them as sub-agents using the Agent tool.

Pass A runs two agents in parallel: the Product Visionary derives the full product definition from BRIEF.md and produces 6 draft documents; the Market Researcher searches the competitive landscape and produces 1 research document. After Pass A output is validated (Gate 1 — 7 drafts, always), Pass B runs the Product Synthesizer, which reconciles the drafts with market research and produces 6 final documents. Gate 2 validates all 7 final documents (6 synthesized + persisting market research) structurally AND for depth — per-feature Functional Depth fields, entity coverage, journey coverage, metric coverage, and the SYN-04 diff. The orchestrator enforces strict gate-and-advance logic: each pass's output is fully validated before the next pass begins, and failed agents receive exactly one retry before the pipeline halts with a structured failure report.

There is exactly one path through this workflow. Both Pass A agents always spawn, all 7 documents are always produced, and every discovered feature is documented and phased — the blueprint never trims a tier to keep its own output small.

</purpose>

<required_reading>

Before starting, read:
- `.claude/n2b/references/ui-brand.md` — banner format (40 `━` characters, `n2b > {BANNER NAME}` prefix), the registered banner names, and status symbols (`✓` = complete, `○` = pending/in-progress)
- `.claude/n2b/references/tracking-protocol.md` — tracking transitions: stage-rerun-guard, stage-start, step-complete, gate-check, stage-complete, gate-fail
- `.claude/n2b/references/pipeline-gatekeeper.md` -- entry gate (Check 1-3 flow, error formats, stage registry)
- `.claude/n2b/references/model-profiles.md` — Per-Agent Model Mapping table and resolution logic for the Agent tool's `model` parameter

Gate naming: this workflow's two gates are **Gate 1 — Draft Validation** and **Gate 2 — Final Validation** (tracking identifiers `stage-2-gate-1-*` / `stage-2-gate-2-*`). Per ui-brand.md's registered banner set, their pass banners are `GATE A PASSED` (Gate 1) and `GATE B PASSED` (Gate 2); gate failures render the markdown gate-failure block, not a banner.

Agent contracts are self-loading — the orchestrator only needs their installed file paths. Do not pre-read the agent contracts; pass their paths in the spawning prompts and the agents will load them.

</required_reading>

<process>

## Step 0 — Entry Gate

Read `n2b/references/pipeline-gatekeeper.md` and execute Check 1, Check 2, and Check 3 for **Stage 2** as defined in that reference.

**Check 1 — Pipeline Exists:**

```bash
[ -f .n2b/tracking/PIPELINE.md ] && echo "EXISTS" || echo "MISSING"
```

- If MISSING: Stage 2 requires a pipeline. HALT with E9 error banner ("Not initialized. Run /n2b:s1-init").
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
- `PIPELINE_STATUS == "blueprint-complete"` -> the blueprint is done; a Stage 2 request is a re-run of a completed stage -> proceed to Check 3 (the gatekeeper re-run guard — completed exports are marked stale on confirmation; this is never a hard halt)
- `PIPELINE_STATUS == "failed"` -> if requested (2) == LAST_COMPLETED + 1, re-run of the failed stage, PASS; else HALT with E4
- `ACTIVE > 0` and requested (2) == ACTIVE -> resume, proceed to Check 3
- `ACTIVE > 0` and requested (2) != ACTIVE -> HALT with E5
- `ACTIVE == 0` and requested (2) == LAST_COMPLETED + 1 -> fresh run, PASS
- `ACTIVE == 0` and requested (2) <= LAST_COMPLETED -> re-run, proceed to Check 3
- `ACTIVE == 0` and requested (2) > LAST_COMPLETED + 1 -> HALT with E3

**Check 3 — Re-run Guard** (only runs on re-run/resume from Check 2):

Read Stage 2 tracker status:

```bash
TARGET_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s2-define/STAGE.md 2>/dev/null || echo "not-started")
echo "TARGET_STATUS=$TARGET_STATUS"
```

- `not-started`: PASS.
- `in-progress`: PASS (Stage 2 does not support partial resume; workflow restarts).
- `complete`: two checks run in order:

**(a) Downstream hard-block check** — blueprint stages only. Per the gatekeeper's stage registry and Per-Stage Downstream Check List, Stage 2 checks s3-specify and s4-architect (Stage 5 is `s5-export` — a post-completion consumer of the blueprint; exports never trigger a block):

```bash
for DOWNSTREAM in .n2b/tracking/stages/s3-specify/STAGE.md .n2b/tracking/stages/s4-architect/STAGE.md; do
    DS_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$DOWNSTREAM" 2>/dev/null || echo "not-started")
    echo "$DOWNSTREAM: $DS_STATUS"
    if [ "$DS_STATUS" != "not-started" ]; then
        echo "HARD_BLOCK=true"
    fi
done
```

**(b) Export staleness check — never a block:**

```bash
EXPORT_COUNT=$(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md)
echo "EXPORT_COUNT=$EXPORT_COUNT"
```

Completed exports are downstream *consumers* of the blueprint, not downstream *work on* the blueprint. They never trigger E8 and are never deleted by an upstream re-run — they are marked stale instead.

  - **Hard block** (any downstream blueprint stage not `not-started`): display E8 error banner from the gatekeeper and HALT.
  - **Soft block** (all downstream blueprint stages `not-started`): prompt the user per the gatekeeper's soft block template for Stage 2:

```
Stage 2 is already complete (finished {completed timestamp from s2-define/STAGE.md}).

Re-running will:
- Delete all Stage 2 output from .n2b/features/ and .n2b/features/drafts/
- Reset Stage 2 tracking to not-started
- Mark {EXPORT_COUNT} completed export(s) STALE — exports are never deleted;
  refresh them with /n2b:s5-export once the blueprint is complete again

Are you sure? (yes/no)
```

  (Include the third bullet only when `EXPORT_COUNT > 0`.)

  On confirms: execute cleanup per the gatekeeper's Per-Stage Re-run Cleanup table for Stage 2:
  - Delete `.n2b/features/*` and `.n2b/features/drafts/*` (keep directories)
  - Reset `s2-define/STAGE.md` frontmatter: `status: not-started`, `started: null`, `completed: null`
  - Update PIPELINE.md: `last_completed_stage` -> `1`
  - When `EXPORT_COUNT > 0`: flip every `## Export History` row's Status to `stale` (rows are never deleted — the table is the append-only audit trail) and mirror the stale marking on the affected target rows in the s5-export dashboard. Delete nothing under `.n2b/exports/` and leave per-target receipts untouched.
  - PASS.

  On declines: HALT.

All error banners use the gatekeeper's branded format (E3, E4, E5, E8, E9, E10 from `pipeline-gatekeeper.md`).

On PASS: proceed to Step 1.

---

## Step 1 — Pre-flight Validation

Validate `.n2b/BRIEF.md` before any filesystem changes or agent spawning.

Run each check in sequence and halt immediately on the first failure:

```bash
# 1. Existence check
[ -f .n2b/BRIEF.md ] && echo "exists" || echo "NOT FOUND"

# 2. Non-empty check
[ -s .n2b/BRIEF.md ] && echo "non-empty" || echo "EMPTY"

# 3. Required frontmatter fields (search only within YAML block between --- delimiters)
FRONTMATTER=$(awk '/^---/{n++; next} n==1{print} n==2{exit}' .n2b/BRIEF.md)
echo "$FRONTMATTER" | grep -q "^project_name:" && echo "project_name: ok" || echo "project_name: MISSING"
echo "$FRONTMATTER" | grep -q "^domain:" && echo "domain: ok" || echo "domain: MISSING"

# 4. Non-empty body (content after closing ---)
# Extract everything after the second --- delimiter and check for at least one non-empty line
awk '/^---/{n++; if(n==2){found=1; next}} found && NF>0{print; exit}' .n2b/BRIEF.md | grep -q "." && echo "body: ok" || echo "body: EMPTY"
```

**If ANY check fails:** Display this failure banner with the specific missing item and halt — do not proceed to any subsequent step:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  {specific failure: e.g. "BRIEF.md not found" / "missing field: project_name" / "BRIEF.md body is empty"}

  Recovery:
    Run /n2b:s1-init to create a valid BRIEF.md
```

**If ALL checks pass:** Continue silently to Step 1.5.

PIPE-02 is satisfied by this step.

---

## Step 1.5 — stage-start Transition

Execute the `stage-start` transition from tracking-protocol.md. Update all three tracking files:

**PIPELINE.md** — update frontmatter and body:
```
active_stage: 2
pipeline_status: running
last_updated: {current ISO timestamp}
```
On the Stage 2 checklist line: add `← ACTIVE` marker at end of line. If Stage 2 had a `← NEXT` marker: replace it with `← ACTIVE`.

**STATE.md** — update frontmatter and body:
```
current_step: pass-a
stage_status: in-progress
stage_started: {current ISO timestamp}
last_updated: {current ISO timestamp}
```
Current Position section: "Stage 2 — Define Features / Step: Pass A — Parallel agents"
Session Continuity: Last action "Stage 2 started", Next action "Pass A — spawning Visionary and Researcher", Blockers "None"

**s2-define/STAGE.md** — update frontmatter AND write full body skeleton:
```
status: in-progress
started: {current ISO timestamp}
```

Write the complete body to `s2-define/STAGE.md` (after the frontmatter):

```markdown
This file is a live tracker while status is in-progress. Once status changes to complete, it becomes a permanent receipt — do not modify.

## Steps

### Pass 1A — Product Visionary (parallel)
- [ ] 6-lens decomposition
- [ ] 6 draft documents written
- [ ] 10-point coherence check

### Pass 1B — Market Researcher (parallel)
- [ ] Web search: competitors found
- [ ] market-research.md written
- [ ] Confidence levels assigned

### Gate 1 — Draft Validation
- Status: pending
- [ ] 7/7 files exist
- [ ] Frontmatter valid on all files
- [ ] Feature count (within range)
- [ ] Competitor count (meets minimum 3)

### Pass 2 — Product Synthesizer
- [ ] Research read first (anti-anchoring)
- [ ] Reconciliation complete
- [ ] Audit 1: Persona journey walkthrough
- [ ] Audit 2: Competitive cross-reference
- [ ] Audit 3: Entity coverage
- [ ] Audit 4: Cross-cutting concerns
- [ ] 6 final documents written

### Gate 2 — Final Validation
- Status: pending
- [ ] 7/7 final files exist
- [ ] Frontmatter: document_type + produced_by + status:final on all
- [ ] Modification markers present
- [ ] Functional Depth: Phase + all eight depth fields on every feature entry
- [ ] Entity coverage: every inventory entity in ≥1 feature's Connected Entities
- [ ] Journey coverage: count meets minimum; first-use + regular + edge present
- [ ] Metric coverage: ≥1 metric per Core feature
- [ ] SYN-04 diff: every BRIEF.md feature maps to a FEAT entry
- [ ] Depth anchors: Access Matrix + Non-Functional Expectations present

## Performance
| Metric | Value |
|--------|-------|
| Duration | — |
| Agents spawned | — |
| Retries | 0 |
| Gate attempts: Gate 1 | — |
| Gate attempts: Gate 2 | — |

## Deviations

(None so far)

## Output

(Populated on completion)
```

---

## Step 2 — Setup

Create output directories:

```bash
mkdir -p .n2b/features/drafts
```

This creates both `.n2b/features/` and `.n2b/features/drafts/` in a single command. The agents will write to these directories; they must exist before agents are spawned.

**Model resolution (once for this workflow):** read the model profile from config —

```bash
MODEL_PROFILE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('model_profile','balanced'))" 2>/dev/null || echo "balanced")
case "$MODEL_PROFILE" in quality|balanced|budget) ;; *) MODEL_PROFILE="balanced" ;; esac
echo "MODEL_PROFILE=$MODEL_PROFILE"
```

If the value is not one of `quality` / `balanced` / `budget`, fall back to `balanced` (config-schema.md: missing/invalid handling). Then resolve each Stage 2 agent role's model from the Per-Agent Model Mapping table in `model-profiles.md` (rows: **Visionary**, **Researcher**, **Synthesizer**) and pass the resolved model as the Agent tool's `model` parameter on every spawn below — the mapping table is the single source; never hardcode a model name in this workflow.

Display the Pass A banner (registered name per ui-brand.md):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Display the flow diagram:

```
  Pass A   Visionary ∥ Researcher  ─── 7 draft documents
              ↓
  Gate 1   Validate 7 drafts
              ↓
  Pass B   Synthesizer            ─── 6 final documents
              ↓
  Gate 2   Validate 7 finals (structure + depth)
```

---

## Step 3 — Pass A: Agent Spawning

**Display agent start status lines:**

```
  ○  Visionary started — deriving product definition from BRIEF.md
  ○  Researcher started — searching competitive landscape
```

**Agent 1: Product Visionary** (always spawned)
- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-2/n2b-visionary.md` and execute your complete task as described. Inputs: `.n2b/BRIEF.md` (founding document — read first per pipeline-rules.md brief-first constraint). Templates at `.claude/n2b/templates/stage-2/`. Output directory: `.n2b/features/drafts/` (already exists). Write all 6 deliverables per your contract's deliverables section. Do not ask for clarification — work autonomously with what is in BRIEF.md.

Depth requirements (the product-features template is the contract):
- Full tiering: document every feature you discover, across all three tiers — Core, Important, and Nice-to-Have. Include as many features as the product honestly needs, fully tiered and phased. Never fold a discovered feature into scope exclusions to keep the set small — the blueprint documents everything and phases it.
- Phase assignment: every feature entry carries a `**Phase:**` field (MVP | v1 | Later) — release phasing, orthogonal to Priority.
- Functional Depth: every feature entry carries the eight-field Functional Depth block per the product-features template — `**Primary Flows & Alternates:**`, `**States:**`, `**Validation & Limits:**`, `**Access:**`, `**Communications:**`, `**Data Notes:**`, `**Interactions:**`, `**Signals:**`. Where a field genuinely does not apply, write `N/A — {one-sentence reason}` — never leave it blank."
- Tools: Read, Write, Bash
- Model: resolved from the **Visionary** (Stage 2) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 55 (6 documents with template reading, per-feature Functional Depth, and phase assignment — generous)

**Agent 2: Market Researcher** (always spawned)
- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-2/n2b-researcher.md` and execute your complete task as described. Inputs: `.n2b/BRIEF.md` (founding document — read first per pipeline-rules.md brief-first constraint). Template at `.claude/n2b/templates/stage-2/market-research.md`. Output: `.n2b/features/market-research.md` (directory already exists). Write your single deliverable per your contract's deliverables section. Do not ask for clarification — work autonomously with what is in BRIEF.md."
- Tools: Read, Write, Bash, WebSearch, WebFetch
- Model: resolved from the **Researcher** (Stage 2) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 60 (web research needs more turns)

**Spawning logic:** Issue both Agent tool calls together so they run concurrently (PIPE-03).

Wait for both spawned agents to complete before proceeding.

PIPE-03 is satisfied by spawning both agents in the same step.

### Step 3.5 — step-complete: Pass A agents returned

After both agents complete, execute `step-complete` transition for Pass A:

**STATE.md** — update frontmatter and body:
```
current_step: gate-1
last_updated: {current ISO timestamp}
```
Current Position section: "Stage 2 — Define Features / Step: Gate 1 — Draft Validation"
Session Continuity: Last action "Pass A — Visionary and Researcher complete", Next action "Gate 1 validation"

**s2-define/STAGE.md** — tick Pass 1A checkboxes in Steps section:
```
### Pass 1A — Product Visionary (parallel)
- [x] 6-lens decomposition
- [x] 6 draft documents written
- [x] 10-point coherence check
```

**s2-define/STAGE.md** — tick Pass 1B checkboxes:
```
### Pass 1B — Market Researcher (parallel)
- [x] Web search: competitors found
- [x] market-research.md written
- [x] Confidence levels assigned
```

---

## Step 4 — Gate 1 Validation

### Step 4.1 — gate-check: Gate 1 about to run

Execute `gate-check` transition before running file-existence checks:

**STATE.md** — update frontmatter:
```
stage_status: gate-check
last_updated: {current ISO timestamp}
```
Session Continuity: Last action "Gate 1 validation running", Next action "Awaiting gate result"

**s2-define/STAGE.md** — update Gate 1 in the Steps section — begin recording per-category evidence as checks run:
```
### Gate 1 — Draft Validation
- Status: checking
```

### Gate 1 Checks

Define the Pass A file manifest. Check each file individually:

**Visionary output — 6 files in `.n2b/features/drafts/`:**
```bash
VISIONARY_FILES=(
  ".n2b/features/drafts/draft-user-persona.md"
  ".n2b/features/drafts/draft-user-journeys.md"
  ".n2b/features/drafts/draft-product-features.md"
  ".n2b/features/drafts/draft-scope-boundaries.md"
  ".n2b/features/drafts/draft-success-metrics.md"
  ".n2b/features/drafts/draft-assumptions-constraints.md"
)
```

**Researcher output — 1 file in `.n2b/features/`:**
```bash
RESEARCHER_FILES=(
  ".n2b/features/market-research.md"
)
```

For each file in both manifests, run:

```bash
# File existence and non-empty
[ -f "$path" ] && [ -s "$path" ] && echo "exists" || echo "MISSING: $path"

# Required frontmatter fields (search only within YAML block between --- delimiters)
FM=$(awk '/^---/{n++; next} n==1{print} n==2{exit}' "$path")
echo "$FM" | grep -q "^document_type:" && \
  echo "$FM" | grep -q "^produced_by:" && \
  echo "$FM" | grep -q "^status:" && \
  echo "frontmatter: ok" || echo "INVALID FRONTMATTER: $path"
```

Track per-file results (pass/fail with reason). After checking all 7 files, determine which agent(s) had failures.

**Display completion status lines** (after checking — even if validation fails, show what succeeded):

For Visionary: count features by grepping `draft-product-features.md` for `**ID:** FEAT-` lines (the template places the FEAT-ID on a bold field line, not in the heading):

```bash
FEATURE_COUNT=$(grep -c '^\*\*ID:\*\* FEAT-' .n2b/features/drafts/draft-product-features.md 2>/dev/null); FEATURE_COUNT=${FEATURE_COUNT:-0}
CORE=$(grep -c '^\*\*Priority:\*\* Core' .n2b/features/drafts/draft-product-features.md 2>/dev/null); CORE=${CORE:-0}
IMPORTANT=$(grep -c '^\*\*Priority:\*\* Important' .n2b/features/drafts/draft-product-features.md 2>/dev/null); IMPORTANT=${IMPORTANT:-0}
NICE=$(grep -c '^\*\*Priority:\*\* Nice-to-Have' .n2b/features/drafts/draft-product-features.md 2>/dev/null); NICE=${NICE:-0}
```

For Researcher: count competitor profiles by looking for H3 headings within the Competitive Product Profiles section (heading per the market-research template):

```bash
COMPETITOR_COUNT=$(awk '/^## Competitive Product Profiles/,/^## Pricing/{if(/^### /) count++} END{print count+0}' .n2b/features/market-research.md 2>/dev/null || echo "0")
```

**Visionary status line:**
```
  ✓  Visionary complete — {N} features ({Core} Core, {Important} Important, {Nice-to-Have} Nice-to-Have)
```

**Researcher status line:**
```
  ✓  Researcher complete — {N} competitors profiled
```

(If an agent failed validation, show the status line for the agent that succeeded, and proceed to retry logic for the one that failed.)

**If ANY file fails validation:**

1. Identify which agent produced the failing file(s).
2. Display retry warning: `  ⚠  {Agent} attempt 1 failed — retrying (1/1)...`
3. Retry ONLY the failed agent with the IDENTICAL prompt and configuration (same prompt text, same tools, same model, same maxTurns — do NOT modify the retry prompt in any way).
4. After retry, re-validate ONLY the previously-failed files using the same bash checks.
5. If retry also fails: execute gate-fail transition (see below) for Gate 1, then HALT.

**If ALL 7 expected files pass validation:**

Record per-category evidence in s2-define/STAGE.md Steps section (update the existing Gate 1 block):

```
### Gate 1 — Draft Validation
- Status: passed
- [x] File existence: {N}/7 files exist — {all present or list missing}
- [x] Frontmatter validity: {N}/7 files have valid frontmatter
- [x] Feature count: {FEATURE_COUNT} features (FEAT- prefixed entries in draft-product-features.md)
- [x] Competitor count: {COMPETITOR_COUNT} competitors (H3 headings in Competitive Product Profiles section)
- Result: **passed**
```

Display the Gate 1 passed banner (registered name `GATE A PASSED` per ui-brand.md):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE A PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  7 files verified
```

### Step 4.2 — step-complete: Gate 1 passed

Execute `step-complete` transition after Gate 1 passes:

**STATE.md** — update frontmatter and body:
```
current_step: pass-b
stage_status: in-progress
last_updated: {current ISO timestamp}
```
Current Position: "Stage 2 — Define Features / Step: Pass B — Synthesizer"
Session Continuity: Last action "Gate 1 — Draft Validation passed", Next action "Pass B — spawning Synthesizer"

**s2-define/STAGE.md** — tick Gate 1 checkboxes in Steps section and record any retries in Deviations:

```
### Gate 1 — Draft Validation
- Status: passed
- [x] 7/7 files exist
- [x] Frontmatter valid on all files
- [x] Feature count (within range)
- [x] Competitor count (meets minimum 3)
```

If any retry occurred during Gate 1, record it immediately in the Deviations section:
```
## Deviations
- **Retry:** {Agent name} attempt 1 failed — {reason}. Re-spawned with identical prompt. Second run {passed/failed}.
```

**Note: If Gate 1 retry failed**, execute gate-fail transition instead:

**gate-fail — Gate 1:**

Update PIPELINE.md:
```
active_stage: 0
pipeline_status: failed
last_gate_result: stage-2-gate-1-failed
last_updated: {current ISO timestamp}
```

Update STATE.md:
```
stage_status: gate-failed
last_updated: {current ISO timestamp}
```
Session Continuity: Last action "Gate 1 failed — {N} categories failed", Next action "/n2b:s2-define to re-run", Blockers "Gate 1 failed: {specific reason}"

Update s2-define/STAGE.md Steps section (update the existing Gate 1 block) with failure evidence:

```
### Gate 1 — Draft Validation
- Result: **failed**
- [x] File existence: {N}/7 files exist (passed or failed with details)
- [ ] Frontmatter validity: FAILED — {specific files missing required fields}
- [ ] Feature count: FAILED — {count, expected range}
- [ ] Competitor count: FAILED — {count, expected minimum 3}
```

(Mark `[x]` for passed categories, `[ ]` for failed categories)

Display gate failure message:

```
---

## ✗ Stage 2: Gate Failed

Gate 1 — Draft Validation — {count} of {total} categories failed

Failed checks:
- {Category}: {what failed and why — specific counts, file paths}
- {Category}: {what failed and why}

---

## ▶ Next Action

Re-run to retry: `/n2b:s2-define`

*(`/clear` first → fresh context window)*

---
```

HALT after displaying the gate failure message.

PIPE-05 is satisfied by this gate validation with retry logic.

---

## Step 5 — Pass B: Synthesizer

Display the Pass B banner and start status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Synthesizer started — reconciling drafts with research
```

Spawn single agent:

**Agent 3: Product Synthesizer**
- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-2/n2b-synthesizer.md` and execute your complete task as described. Inputs: `.n2b/BRIEF.md` (founding document — read first per pipeline-rules.md brief-first constraint), `.n2b/features/market-research.md` (read before drafts — see contract for rationale), all 6 draft files in `.n2b/features/drafts/`. Templates at `.claude/n2b/templates/stage-2/`. Output directory: `.n2b/features/` (already exists). Write all 6 final deliverables per your contract's deliverables section. Do not ask for clarification — work autonomously.

Synthesis requirements:
- Evidence-justified additions: there are no numeric caps on research-suggested or audit-added features. Every feature you add requires (a) its provenance marker, (b) cited evidence or a named audit, (c) a tier justified in its Rationale, and (d) alignment with the brief's product vision. Core-tier additions are allowed when the evidence is HIGH-confidence and the capability is genuinely load-bearing — the marker must explain why it is Core. SYN-04 remains absolute: features tied to BRIEF.md goals can never be removed.
- Functional Depth enrichment: verify and enrich every feature entry's `**Phase:**` field and eight-field Functional Depth block (per the product-features template) during your audits — no feature entry leaves your pass with a missing or blank depth field.
- Persona set: synthesize user-persona.md as a persona set per its template — the primary persona always; secondary personas/roles only when the brief or research warrants them, each carrying the same provenance discipline as a new feature (marker + rationale + citation, per pipeline-rules.md grounded-roles); include the Access Matrix — it is the source of every feature entry's `**Access:**` field."
- Tools: Read, Write, Bash
- Model: resolved from the **Synthesizer** (Stage 2) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 65 (8 inputs to read + 6 outputs with depth enrichment and persona-set synthesis + synthesis check)

Wait for the agent to complete before proceeding to Step 6.

PIPE-04 is satisfied by spawning Synthesizer only after Gate 1 passes.

### Step 5.5 — step-complete: Pass B Synthesizer returned

After Synthesizer completes, execute `step-complete` transition:

**STATE.md** — update frontmatter and body:
```
current_step: gate-2
last_updated: {current ISO timestamp}
```
Current Position: "Stage 2 — Define Features / Step: Gate 2 — Final Validation"
Session Continuity: Last action "Pass B — Synthesizer complete", Next action "Gate 2 validation"

**s2-define/STAGE.md** — tick Pass 2 checkboxes in Steps section:
```
### Pass 2 — Product Synthesizer
- [x] Research read first (anti-anchoring)
- [x] Reconciliation complete
- [x] Audit 1: Persona journey walkthrough
- [x] Audit 2: Competitive cross-reference
- [x] Audit 3: Entity coverage
- [x] Audit 4: Cross-cutting concerns
- [x] 6 final documents written
```

---

## Step 6 — Gate 2 Validation

### Step 6.1 — gate-check: Gate 2 about to run

Execute `gate-check` transition before running file-existence checks:

**STATE.md** — update frontmatter:
```
stage_status: gate-check
last_updated: {current ISO timestamp}
```
Session Continuity: Last action "Gate 2 validation running", Next action "Awaiting gate result"

**s2-define/STAGE.md** — update Gate 2 in the Steps section — begin recording per-category evidence as checks run:
```
### Gate 2 — Final Validation
- Status: checking
```

### Gate 2 Checks — Structure

Define the Pass B file manifest. Check all final documents that must exist after both passes:

**Synthesizer output — 6 files in `.n2b/features/`:**
```bash
SYNTHESIZER_FILES=(
  ".n2b/features/product-features.md"
  ".n2b/features/user-persona.md"
  ".n2b/features/user-journeys.md"
  ".n2b/features/scope-boundaries.md"
  ".n2b/features/success-metrics.md"
  ".n2b/features/assumptions-constraints.md"
)
```

**Also verify Pass A output persists:**
```bash
[ -f ".n2b/features/market-research.md" ] && [ -s ".n2b/features/market-research.md" ] && echo "market-research: ok" || echo "market-research: MISSING"
```

Run identical per-file checks as Step 4 for all 6 Synthesizer output files (existence, non-empty, frontmatter fields: `document_type`, `produced_by`, `status`).

Display Synthesizer completion status line. Count ALL modification markers:

```bash
MOD_COUNT=$(grep -roc '\[MODIFIED\|\[CHALLENGED\|\[RESEARCH-INFORMED\|\[RESEARCH-SUGGESTED\|\[AUDIT-ADDED\|\[AUDIT-EXCLUDED\|\[INFERRED' .n2b/features/product-features.md .n2b/features/user-persona.md .n2b/features/user-journeys.md .n2b/features/scope-boundaries.md .n2b/features/success-metrics.md .n2b/features/assumptions-constraints.md 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
```

The marker-count check requires `MOD_COUNT > 0`.

Synthesizer status line:

```
  ✓  Synthesizer complete — {N} modifications from research reconciliation
```

Also count final features (reusing the same grep pattern from Step 4 but on the final file):
```bash
FEATURE_COUNT=$(grep -c '^\*\*ID:\*\* FEAT-' .n2b/features/product-features.md 2>/dev/null); FEATURE_COUNT=${FEATURE_COUNT:-0}
CORE=$(grep -c '^\*\*Priority:\*\* Core' .n2b/features/product-features.md 2>/dev/null); CORE=${CORE:-0}
IMPORTANT=$(grep -c '^\*\*Priority:\*\* Important' .n2b/features/product-features.md 2>/dev/null); IMPORTANT=${IMPORTANT:-0}
NICE=$(grep -c '^\*\*Priority:\*\* Nice-to-Have' .n2b/features/product-features.md 2>/dev/null); NICE=${NICE:-0}
```

### Gate 2 Checks — Depth

These six checks are deterministic bash, same style as the structural checks above. They grep the exact headings and bold-label fields the Stage 2 templates pin — the gate patterns, the template headings, and the field labels must match byte-for-byte.

**Depth check 1 — Functional Depth fields per feature entry.** Every `### ` feature entry under `## Core Features`, `## Important Features`, and `## Nice-to-Have Features` must contain `**Phase:**` AND all eight Functional Depth field labels:

```bash
DEPTH_FIELDS=$(awk '
  function flush() {
    if (cur == "") return
    miss = ""
    for (i = 1; i <= 9; i++) if (!(labels[i] in seen)) miss = miss " {" labels[i] "}"
    if (miss != "") { printf "FAIL %s —%s\n", cur, miss; bad = 1 }
  }
  BEGIN {
    split("**Phase:**;**Primary Flows & Alternates:**;**States:**;**Validation & Limits:**;**Access:**;**Communications:**;**Data Notes:**;**Interactions:**;**Signals:**", L, ";")
    for (i = 1; i <= 9; i++) labels[i] = L[i]
  }
  /^## (Core Features|Important Features|Nice-to-Have Features)$/ { flush(); cur = ""; insec = 1; next }
  /^## / { flush(); cur = ""; insec = 0; next }
  insec && /^### / { flush(); cur = substr($0, 5); split("", seen); next }
  insec && cur != "" { for (i = 1; i <= 9; i++) if (index($0, labels[i]) == 1) seen[labels[i]] = 1 }
  END { flush(); if (!bad) print "DEPTH-FIELDS: PASS" }
' .n2b/features/product-features.md)
echo "$DEPTH_FIELDS"
```

Passes only when the output is exactly `DEPTH-FIELDS: PASS`. Any `FAIL {feature} — {missing labels}` line fails the category.

**Depth check 2 — Entity coverage.** Every entity in `## Domain Entity Inventory` must appear in at least one feature's `**Connected Entities:**` line:

```bash
ENTITY_COUNT=0; ENTITY_FAILS=""
while IFS= read -r ENTITY; do
  [ -z "$ENTITY" ] && continue
  ENTITY_COUNT=$((ENTITY_COUNT + 1))
  grep '^\*\*Connected Entities:\*\*' .n2b/features/product-features.md | grep -qiF "$ENTITY" || ENTITY_FAILS="$ENTITY_FAILS {$ENTITY}"
done < <(awk '/^## Domain Entity Inventory/{f=1; next} /^## /{f=0} f && /^### Entity: /{print substr($0, 13)}' .n2b/features/product-features.md)
[ -z "$ENTITY_FAILS" ] && echo "ENTITY-COVERAGE: PASS ($ENTITY_COUNT entities)" || echo "ENTITY-COVERAGE: FAIL —$ENTITY_FAILS"
```

**Depth check 3 — Journey coverage.** Journey count must be at least `max(3, ceil(FEATURE_COUNT / 4))`, and the first-use, regular, and edge coverage lines must be present (every journey carries a `**Coverage:**` field; the three values `First-use`, `Regular`, and `Edge/Recovery` must each appear on at least one of them):

```bash
JOURNEY_COUNT=$(grep -c '^### ' .n2b/features/user-journeys.md 2>/dev/null); JOURNEY_COUNT=${JOURNEY_COUNT:-0}
JOURNEY_MIN=$(( (FEATURE_COUNT + 3) / 4 ))
[ "$JOURNEY_MIN" -lt 3 ] && JOURNEY_MIN=3
[ "$JOURNEY_COUNT" -ge "$JOURNEY_MIN" ] && echo "JOURNEY-COUNT: PASS ($JOURNEY_COUNT >= $JOURNEY_MIN)" || echo "JOURNEY-COUNT: FAIL ($JOURNEY_COUNT < $JOURNEY_MIN)"
COVERAGE_FAILS=""
for CTYPE in "First-use" "Regular" "Edge"; do
  grep '^\*\*Coverage:\*\*' .n2b/features/user-journeys.md | grep -qi "$CTYPE" || COVERAGE_FAILS="$COVERAGE_FAILS {$CTYPE}"
done
[ -z "$COVERAGE_FAILS" ] && echo "JOURNEY-COVERAGE: PASS (first-use + regular + edge present)" || echo "JOURNEY-COVERAGE: FAIL — missing$COVERAGE_FAILS"
```

**Depth check 4 — Metric coverage.** Every Core feature must have at least one metric line (a `**Connected Feature**` line in success-metrics.md naming it):

```bash
METRIC_FAILS=""
while IFS='|' read -r FID FNAME; do
  [ -z "$FID" ] && continue
  grep '^\*\*Connected Feature' .n2b/features/success-metrics.md | grep -qiF "$FNAME" || METRIC_FAILS="$METRIC_FAILS {$FID $FNAME}"
done < <(awk '/^## Core Features$/{f=1; next} /^## /{f=0} f && /^### /{name=substr($0, 5)} f && /^\*\*ID:\*\* FEAT-/{print $2 "|" name}' .n2b/features/product-features.md)
[ -z "$METRIC_FAILS" ] && echo "METRIC-COVERAGE: PASS (every Core FEAT-ID has ≥1 metric)" || echo "METRIC-COVERAGE: FAIL —$METRIC_FAILS"
```

**Depth check 5 — Scripted SYN-04 diff.** Extract the feature bullets from BRIEF.md and assert each maps to a FEAT entry in product-features.md. The source list is the `## Feature Direction` section when present; otherwise, feature-shaped lines in the brief body above `## Open Questions` (bullet lines of the shape `- **{Name}**: {description}`; the scan stops at `## Open Questions` so the conditional `## Feature Direction` and `## Design System` sections appended after it are never misread as feature bullets):

```bash
BRIEF_FEATURES=$(awk '/^## Feature Direction/{f=1; next} /^## /{f=0} f' .n2b/BRIEF.md | sed -n 's/^[-*]\{0,1\} *\*\*\([^*][^*]*\)\*\*.*/\1/p')
if [ -z "$BRIEF_FEATURES" ]; then
  BRIEF_FEATURES=$(awk '/^## Open Questions/{exit} {print}' .n2b/BRIEF.md | sed -n 's/^[-*] *\*\*\([^*][^*]*\)\*\*: .*/\1/p')
fi
SYN04_TOTAL=0; SYN04_UNMATCHED=""
while IFS= read -r BF; do
  [ -z "$BF" ] && continue
  BF_NAME=$(echo "$BF" | sed 's/:[ ]*$//; s/^ *//; s/ *$//')
  SYN04_TOTAL=$((SYN04_TOTAL + 1))
  grep -qiF "$BF_NAME" .n2b/features/product-features.md || SYN04_UNMATCHED="$SYN04_UNMATCHED {$BF_NAME}"
done <<EOF
$BRIEF_FEATURES
EOF
[ -z "$SYN04_UNMATCHED" ] && echo "SYN-04: PASS ($SYN04_TOTAL BRIEF.md feature bullets all map to FEAT entries)" || echo "SYN-04: UNMATCHED —$SYN04_UNMATCHED"
```

- If the extraction yields zero bullets (`SYN04_TOTAL = 0`): the brief carries no explicit feature bullets — record `SYN-04: PASS (no explicit feature bullets in BRIEF.md; user intent expressed as narrative, protected by the Synthesizer's SYN-04 rule and audited via markers)` and treat the category as passed.
- If any name is `UNMATCHED`: before failing, resolve renames — a BRIEF.md feature the Synthesizer or Visionary renamed must carry a `[MODIFIED]` marker on its FEAT entry documenting the original intent. For each unmatched name, search product-features.md for a marker-documented FEAT entry covering it and record the mapping (`"{brief name}" → FEAT-XX {new name}`) as evidence. Any brief feature with neither a literal match nor a marker-documented mapping fails the category — a user-stated feature was dropped.

**Depth check 6 — Depth anchors.** The persona set's Access Matrix and the assumptions document's Non-Functional Expectations section must exist:

```bash
grep -q '^## Access Matrix' .n2b/features/user-persona.md && echo "ACCESS-MATRIX: PASS" || echo "ACCESS-MATRIX: FAIL — ## Access Matrix missing from user-persona.md"
grep -q '^## Non-Functional Expectations' .n2b/features/assumptions-constraints.md && echo "NFR-SECTION: PASS" || echo "NFR-SECTION: FAIL — ## Non-Functional Expectations missing from assumptions-constraints.md"
```

### Gate 2 Result Handling

**If ANY Gate 2 category fails (structural or depth):**

1. Display retry warning: `  ⚠  Synthesizer attempt 1 failed — retrying (1/1)...`
2. Retry Synthesizer with the IDENTICAL prompt and configuration (same prompt text, same tools, same model, same maxTurns — do NOT modify the retry prompt in any way).
3. After retry, re-run ALL Gate 2 checks (structure + depth).
4. If any check still fails: execute gate-fail transition for Gate 2 (see below), then HALT.

**If ALL Gate 2 categories pass:** All 7 final documents are confirmed. Record per-category evidence in s2-define/STAGE.md Steps section (update the existing Gate 2 block):

```
### Gate 2 — Final Validation
- Status: passed
- [x] File existence: {N}/7 final files exist — {all present or list missing}
- [x] Frontmatter: {N}/7 have document_type + produced_by + status:final
- [x] Modification markers: {MOD_COUNT} markers ([MODIFIED], [CHALLENGED], [RESEARCH-SUGGESTED], [AUDIT-ADDED])
- [x] Functional Depth: {FEATURE_COUNT}/{FEATURE_COUNT} feature entries carry **Phase:** + all eight depth fields
- [x] Entity coverage: {ENTITY_COUNT}/{ENTITY_COUNT} inventory entities appear in ≥1 Connected Entities line
- [x] Journey coverage: {JOURNEY_COUNT} journeys (minimum {JOURNEY_MIN}); first-use + regular + edge present
- [x] Metric coverage: all {CORE} Core features have ≥1 metric line
- [x] SYN-04 diff: {SYN04_TOTAL} BRIEF.md feature bullets each map to a FEAT entry — {evidence, incl. any marker-documented rename mappings}
- [x] Depth anchors: ## Access Matrix present in user-persona.md; ## Non-Functional Expectations present in assumptions-constraints.md
- Result: **passed**
```

Display the Gate 2 passed banner (registered name `GATE B PASSED` per ui-brand.md):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE B PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  7 files verified
```

DOC-01 is satisfied by verifying all 7 expected final documents exist (6 from Synthesizer + market-research.md) and meet the depth checks.

**gate-fail — Gate 2** (if Gate 2 retry also fails):

Update PIPELINE.md:
```
active_stage: 0
pipeline_status: failed
last_gate_result: stage-2-gate-2-failed
last_updated: {current ISO timestamp}
```

Update STATE.md:
```
stage_status: gate-failed
last_updated: {current ISO timestamp}
```
Session Continuity: Last action "Gate 2 failed — {N} categories failed", Next action "/n2b:s2-define to re-run", Blockers "Gate 2 failed: {specific reason}"

Update s2-define/STAGE.md Steps section (update the existing Gate 2 block) with failure evidence:

```
### Gate 2 — Final Validation
- Result: **failed**
- [x] File existence: {N}/7 final files exist (passed or failed with details)
- [ ] Frontmatter: FAILED — {specific files missing document_type/produced_by/status:final}
- [ ] Modification markers: FAILED — {count found, expected > 0}
- [ ] Functional Depth: FAILED — {feature entries and the depth field labels they are missing}
- [ ] Entity coverage: FAILED — {entities absent from every Connected Entities line}
- [ ] Journey coverage: FAILED — {count vs minimum, or missing coverage type}
- [ ] Metric coverage: FAILED — {Core FEAT-IDs without a metric line}
- [ ] SYN-04 diff: FAILED — {which BRIEF.md features have no FEAT entry or marker-documented mapping}
- [ ] Depth anchors: FAILED — {Access Matrix and/or Non-Functional Expectations missing}
```

(Mark `[x]` for passed categories, `[ ]` for failed categories)

Display gate failure message:

```
---

## ✗ Stage 2: Gate Failed

Gate 2 — Final Validation — {count} of {total} categories failed

Failed checks:
- {Category}: {what failed and why — specific counts, file paths}
- {Category}: {what failed and why}

---

## ▶ Next Action

Re-run to retry: `/n2b:s2-define`

*(`/clear` first → fresh context window)*

---
```

HALT after displaying the gate failure message.

---

## Step 7 — stage-complete Transition

Gate 2 passed. Execute the 4-step `stage-complete` transition from tracking-protocol.md IN ORDER. Do not skip or reorder.

### Step 7.1 — Finalize s2-define/STAGE.md (do this first)

Extract one-line summaries for each final document:

```bash
for f in product-features.md user-persona.md user-journeys.md scope-boundaries.md success-metrics.md assumptions-constraints.md market-research.md; do
  grep "^document_type:" ".n2b/features/$f" 2>/dev/null | head -1 | sed 's/^document_type: //'
done
```

Update s2-define/STAGE.md frontmatter:
```
status: complete
completed: {current ISO timestamp}
```

Tick all remaining `- [ ]` checkboxes to `- [x]` throughout the body. Update the Gate 2 section with final evidence (already done in Step 6 gate-check). Update the Performance section:

```
## Performance
| Metric | Value |
|--------|-------|
| Duration | {started to now, in minutes} |
| Agents spawned | 3 (Visionary, Researcher, Synthesizer) |
| Retries | {actual count — 0 if no retries} |
| Gate attempts: Gate 1 | {1 + retry count} |
| Gate attempts: Gate 2 | {1 + retry count} |
```

Update the Output section:

```
## Output
- .n2b/features/product-features.md — {document_type value} ({FEATURE_COUNT} features: {CORE} Core, {IMPORTANT} Important, {NICE} Nice-to-Have)
- .n2b/features/user-persona.md — {document_type value}
- .n2b/features/user-journeys.md — {document_type value}
- .n2b/features/scope-boundaries.md — {document_type value}
- .n2b/features/success-metrics.md — {document_type value}
- .n2b/features/assumptions-constraints.md — {document_type value}
- .n2b/features/market-research.md — {document_type value}
- .n2b/features/drafts/ — 6 intermediate files (preserved)
```

After this step, s2-define/STAGE.md is a permanent receipt. Do not modify it again.

### Step 7.2 — Update PIPELINE.md, then MANIFEST.md

Update PIPELINE.md frontmatter:
```
active_stage: 0
last_completed_stage: 2
last_gate_result: stage-2-gate-2-passed
pipeline_status: paused
last_updated: {current ISO timestamp}
```

Update PIPELINE.md body:
- Stage 2 checklist line: change `- [ ]` to `- [x]`, remove `← ACTIVE`, append: `— Completed {date} | {FEATURE_COUNT} features, 2 gates passed`
- Add `← NEXT` to the Stage 3 checklist line
- Add Stage History entry for Stage 2:

```markdown
### Stage 2: Define Features
- Completed: {current ISO timestamp}
- Gate 1 (drafts): passed ({N}/7 files, frontmatter valid)
- Gate 2 (finals): passed ({N}/7 files, {MOD_COUNT} modification markers, depth checks passed)
- Output: .n2b/features/ (7 documents)
- Detail: → .n2b/tracking/stages/s2-define/STAGE.md
- Performance: 3 agents, {duration} min, {retries} retries
```

**Populate Artifact Lineage table** — extract FEAT-IDs paired with feature names from product-features.md. The template places the ID on a `**ID:** FEAT-XX` line and the name on the preceding `### Feature Name` heading:
```bash
awk '/^### /{name=$0; sub(/^### /,"",name)} /^\*\*ID:\*\* FEAT-/{id=$2; print id " " name}' .n2b/features/product-features.md
# Output: FEAT-01 Feature Name, FEAT-02 Feature Name, ...
```

For each FEAT-ID found, add a row to the Artifact Lineage table:
```
| {FEAT-ID} {Feature Name} | ✅ Defined | — | — |
```

**Then update `.n2b/tracking/MANIFEST.md`** — the canonical-package manifest (see tracking-protocol.md, stage-complete Step 2). Stage 1 created it with the BRIEF.md row; this step adds one row per Stage 2 canonical document.

Compute the fingerprints (first 12 hex chars of `shasum -a 256`):

```bash
for f in product-features.md user-persona.md user-journeys.md scope-boundaries.md success-metrics.md assumptions-constraints.md market-research.md; do
  echo "$f $(shasum -a 256 ".n2b/features/$f" | cut -c1-12)"
done
```

Compute the ID coverage ranges (first and last ID per prefix):

```bash
grep -o 'FEAT-[0-9][0-9]*' .n2b/features/product-features.md | sort -uV | sed -n '1p;$p'
grep -o 'SC-[0-9][0-9]*' .n2b/features/scope-boundaries.md | sort -uV | sed -n '1p;$p'
grep -o 'ASMP-[0-9][0-9]*' .n2b/features/assumptions-constraints.md | sort -uV | sed -n '1p;$p'
```

Update MANIFEST.md:
- Add (or, on a re-run, refresh) one `## Package Inventory` row per Stage 2 document — paths relative to `.n2b/`:

```
| features/product-features.md | 2 | FEAT-01..{highest FEAT-ID} | {fingerprint} | {ISO timestamp} |
| features/user-persona.md | 2 | — | {fingerprint} | {ISO timestamp} |
| features/user-journeys.md | 2 | — | {fingerprint} | {ISO timestamp} |
| features/scope-boundaries.md | 2 | SC-01..{highest SC-ID} | {fingerprint} | {ISO timestamp} |
| features/success-metrics.md | 2 | — | {fingerprint} | {ISO timestamp} |
| features/assumptions-constraints.md | 2 | ASMP-01..{highest ASMP-ID} | {fingerprint} | {ISO timestamp} |
| features/market-research.md | 2 | — | {fingerprint} | {ISO timestamp} |
```

- Leave the BRIEF.md row untouched.
- Increment `package_version` by 1 (one increment for this update — rows were added/changed) and refresh `last_updated` in the MANIFEST.md frontmatter.
- MANIFEST.md is written only by workflows during this transition — never by agents.

### Step 7.3 — Refresh STATE.md

Update STATE.md frontmatter:
```
stage_status: between-stages
current_step: none
last_updated: {current ISO timestamp}
```

Update STATE.md body:
- Current Position: "Between stages. Awaiting next stage command."
- Accumulated Context: carry forward the full-tier feature count — {FEATURE_COUNT} features: {CORE} Core, {IMPORTANT} Important, {NICE} Nice-to-Have. Also carry forward core domain entities from product-features.md. Remove step-level progress counts — those are in s2-define/STAGE.md permanently.
- Session Continuity: Last action "Stage 2 Gate 2 passed", Next action "/n2b:s3-specify", Blockers "None"

Apply 50–80 line trim rules per tracking-protocol.md: remove step-level progress counts, keep only cross-stage context that future stages will need.

### Step 7.4 — Display continuation message

After completing Steps 7.1–7.3, display this message to the user. Use the FEATURE_COUNT, CORE, IMPORTANT, NICE variables computed during Gate 2 validation — do NOT re-read product-features.md.

```
---

## ✓ Stage 2: Define Features Complete

{FEATURE_COUNT} features defined ({CORE} Core, {IMPORTANT} Important, {NICE} Nice-to-Have) across 7 documents

---

## ▶ Next Up

**Stage 3: Create Specifications** — transform features into implementation-ready specs

`/n2b:s3-specify`

*(`/clear` first → fresh context window)*

---

**Also available:**
- `/n2b:status` — check pipeline progress

---
```

PIPE-06 is satisfied by the entire workflow design: no human questioning calls anywhere, no pauses, no human checkpoints. All decisions are encoded in the workflow steps.

</process>

<success_criteria>

- `.n2b/BRIEF.md` validated (exists, non-empty, has `project_name` and `domain` fields, has non-empty body) before any agent spawning
- Output directories `.n2b/features/` and `.n2b/features/drafts/` created before agents are spawned
- Visionary and Researcher always spawned in parallel — there is exactly one path through the workflow, no mode branches
- Visionary prompt carries the depth requirements: full tiering across all three tiers, `**Phase:**` per feature, and the eight-field Functional Depth block per feature
- Synthesizer prompt carries the synthesis requirements: evidence-justified additions with no numeric caps, Functional Depth enrichment, and persona-set synthesis with the Access Matrix
- Gate 1 validates all 7 draft-pass files (6 drafts + market-research.md) before Synthesizer is spawned
- Gate 2 validates all 7 final files structurally AND runs the six depth checks (Functional Depth fields, entity coverage, journey coverage, metric coverage, scripted SYN-04 diff, Access Matrix + Non-Functional Expectations anchors)
- Each failed agent retried exactly once with identical prompt and configuration
- If retry fails: gate-fail transition executes (updates PIPELINE.md, STATE.md, s2-define/STAGE.md), then gate failure message displayed; partial output preserved
- If all validations pass: stage-complete 4-step sequence executes in order: finalize s2-define/STAGE.md, update PIPELINE.md (with Artifact Lineage) then MANIFEST.md (7 Stage 2 rows with ID coverage + fingerprints, package_version incremented), refresh STATE.md, display continuation message
- s2-define/STAGE.md sealed as permanent receipt with status: complete, all checkboxes ticked, Gate 1 + Gate 2 evidence (including depth-check evidence), and output manifest
- PIPELINE.md shows Stage 2 as checked with Stage History entry and Artifact Lineage rows for every FEAT-ID
- All banners use registered ui-brand.md names with the `n2b >` prefix and exactly 40 `━` characters
- Continuation message shows the full-tier feature breakdown (Core, Important, Nice-to-Have), /n2b:s3-specify, /clear guidance, and Also available
- No human interaction required at any point — fully autonomous, zero pauses

</success_criteria>
