<purpose>

This workflow coordinates the architect pipeline — the **terminal stage** of the blueprint pipeline — using a 5-agent linear sequence with three gates:

- **Re-run Guard (Step 0):** Checks s4-architect/STAGE.md tracking state before doing anything. Delegates to the gatekeeper Check 1-3 flow. A Stage 4 request under `pipeline_status: blueprint-complete` routes into the re-run path (user confirmation + stale-export marking) — never a hard halt. Session resume (in-progress/failed) passes straight through; Stage 4 does not support partial resume, so interrupted runs restart fresh.
- **Pre-flight (Step 1):** Validates Stage 3 completeness via the s3-specify/STAGE.md tracking state and structural file presence.
- **stage-start (Step 1.5):** Updates PIPELINE.md, STATE.md, and writes the s4-architect/STAGE.md body skeleton after pre-flight passes.
- **Pass A (Profile Analyst):** Extracts the quantitative technical profile from Stage 3 specs via grep-driven analysis — 17 capability signals plus verbatim demand-side inputs. Produces technical-profile.md.
- **Gate A (Metric Verification):** Re-runs key metric grep commands and compares against the profile values. Catches count mismatches before any expensive pass is spawned.
- **Pass B (Technical Researcher):** Derives the active decision-area set from the profile signals and researches 3–5 real-world candidate options per active area (web-first, with a marked knowledge-based fallback). Produces technology-landscape.md.
- **Gate B (Landscape Structural Check):** Deterministic bash validation of the landscape dossier — Research Scope row minimum, per-area heading and option-row minimums, no empty Sources cells. Structure only; the gate never validates web claims.
- **Pass C (Feasibility Planner):** Reads the Stage 3 specs directly and answers "is this technically possible, and how?" per feature, citing landscape options by name. Produces technical-feasibility.md.
- **Pass D (Technical Architect):** Consumes all three upstream documents — plus the user-supplied design-system passthrough at `.n2b/specifications/design-system/` when it exists — and produces the 14-section blueprint — every decision as a recommendation plus documented alternatives with trade-off tables. Produces technical-architecture.md.
- **Pass E (Schema Designer):** Reads Stage 3 specs directly and consumes the Architect's Database/ORM (Section 3) and authentication (Section 11) decisions to produce the real-product database schema. Produces database-schema.md.
- **Gate 4 (Architecture Validation):** Structural validation across 8 categories. HARD failures halt with the gate-fail transition. SOFT failures produce success with warnings.
- **stage-complete (Step 6):** 4-step sequence that seals s4-architect/STAGE.md as a permanent receipt, updates PIPELINE.md to `pipeline_status: blueprint-complete`, writes the five architecture rows into MANIFEST.md, refreshes STATE.md, and displays the PACKAGE READY block. There is no next required stage — export via `/n2b:s5-export` is an offer, never a requirement.

Pass order rationale: the Researcher activates decision areas from profile signals alone (Pass B); the Feasibility Planner cites researched landscape options in its `**Candidate Approaches:**` fields (Pass C consumes Pass B); the Architect consumes all three upstream docs plus the design-system passthrough when present; the Schema Designer consumes the Architect's Database/ORM and auth decisions and reads Stage 3 directly.

Uses tracking-protocol.md for all state transitions. Re-run detection via the s4-architect/STAGE.md status field. Terminal stage — `pipeline_status: blueprint-complete` at stage-complete. No resume detection beyond the re-run guard — simple stages (1, 2, 4) re-run fresh.

</purpose>

<required_reading>

Before starting, read:
- `.claude/n2b/references/ui-brand.md` — banner format (40 `━` characters, `n2b > {BANNER NAME}` prefix), the registered banner names, and status symbols (`✓` = complete, `○` = pending/in-progress)
- `.claude/n2b/references/tracking-protocol.md` — all transition types; follow them as a checklist at each state change
- `.claude/n2b/references/pipeline-gatekeeper.md` — entry gate (Check 1-3 flow, error formats, stage registry)
- `.claude/n2b/references/model-profiles.md` — Per-Agent Model Mapping table and resolution logic for the Agent tool's `model` parameter

Gate naming: this workflow has three gates — **Gate A — Metric Verification** (tracking identifiers `stage-4-gate-a-*`), **Gate B — Landscape Structural Check** (`stage-4-gate-b-*`), and **Gate 4 — Architecture Validation** (`stage-4-gate-4-*`; the final gate keeps its pinned name Gate 4). Registered pass banners per ui-brand.md: `GATE A PASSED`, `GATE B PASSED`/`GATE B FAILED`, `GATE 4 PASSED`/`GATE 4 FAILED`.

Agent contracts are self-loading — the workflow only needs their installed file paths. Do not pre-read the agent contracts; pass their paths in the spawning prompts and the agents will load them.

</required_reading>

<process>

## Step 0 — Entry Gate

Read `n2b/references/pipeline-gatekeeper.md` and execute Check 1, Check 2, and Check 3 for **Stage 4** as defined in that reference.

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
- `PIPELINE_STATUS == "blueprint-complete"` -> the blueprint is done; a Stage 4 request is a re-run of a completed stage -> proceed to Check 3 (the gatekeeper re-run guard — user confirmation required, and completed exports are marked stale on confirmation; this is never a hard halt. E10 never blocks a stage-specific request — it fires only on informational entry with no stage requested)
- `PIPELINE_STATUS == "failed"` -> if requested (4) == LAST_COMPLETED + 1, re-run of the failed stage, PASS; else HALT with E4
- `ACTIVE > 0` and requested (4) == ACTIVE -> resume, proceed to Check 3
- `ACTIVE > 0` and requested (4) != ACTIVE -> HALT with E5
- `ACTIVE == 0` and requested (4) == LAST_COMPLETED + 1 -> fresh run, PASS
- `ACTIVE == 0` and requested (4) <= LAST_COMPLETED -> re-run, proceed to Check 3
- `ACTIVE == 0` and requested (4) > LAST_COMPLETED + 1 -> HALT with E3

**Check 3 — Re-run Guard** (only runs on re-run/resume from Check 2):

Read Stage 4 tracker status:

```bash
TARGET_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s4-architect/STAGE.md 2>/dev/null || echo "not-started")
echo "TARGET_STATUS=$TARGET_STATUS"
```

- `not-started`: PASS.
- `in-progress`: PASS (Stage 4 does not support partial resume; the workflow restarts fresh).
- `complete`: two checks run in order:

**(a) Downstream hard-block check:** Per the gatekeeper's Per-Stage Downstream Check List, Stage 4 has **no downstream hard-block** — E8 applies between Stages 1–4 only, and the registry defines Stage 5 as `s5-export`, a post-completion *consumer* of the blueprint. Exports never trigger a block. Nothing to check here.

**(b) Export staleness check — never a block:**

```bash
EXPORT_COUNT=$(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md)
echo "EXPORT_COUNT=$EXPORT_COUNT"
```

Completed exports are downstream *consumers* of the blueprint, not downstream *work on* the blueprint. They are never deleted by an upstream re-run — they are marked stale instead.

  Prompt the user (soft block — include the third bullet only when `EXPORT_COUNT > 0`):

```
Stage 4 is already complete (finished {completed timestamp from STAGE.md}).

Re-running will:
- Delete all Stage 4 output from .n2b/architecture/
- Reset Stage 4 tracking to not-started
- Mark {EXPORT_COUNT} completed export(s) STALE — exports are never deleted;
  refresh them with /n2b:s5-export once the blueprint is complete again

Are you sure? (yes/no)
```

  On confirm: when `EXPORT_COUNT > 0`, first flip every `## Export History` row's Status to `stale` (rows are never deleted — the table is the append-only audit trail) and mirror the stale marking on the affected target rows in the s5-export dashboard; delete nothing under `.n2b/exports/` and leave per-target receipts untouched. Then, before deleting anything, preserve the prior ADR register so Pass D can apply id-prefixes.md's ID Stability rules (the `s4-architect/` tracking directory survives cleanup — the cleanup table only resets its STAGE.md):

```bash
if [ -f ".n2b/architecture/technical-architecture.md" ]; then
  mkdir -p .n2b/tracking/stages/s4-architect
  {
    echo "# Prior ADR Register (preserved before Stage 4 re-run)"
    echo ""
    awk '/^## 14\. Decision Log/{f=1; next} f && /^## /{exit} f' .n2b/architecture/technical-architecture.md
  } > .n2b/tracking/stages/s4-architect/prior-adr-register.md
fi
```

  Then execute cleanup per the gatekeeper's Per-Stage Re-run Cleanup table for Stage 4:
  - Delete `.n2b/architecture/*`
  - Reset `s4-architect/STAGE.md` -> `status: not-started`
  - Update PIPELINE.md: `last_completed_stage` -> `3`
  - PASS.

  On decline: HALT.

All error banners use the gatekeeper's branded format from `pipeline-gatekeeper.md`.

On PASS: proceed to Step 1.

---

## Step 1 — Pre-flight Validation

Before any filesystem changes or agent spawning, validate that Stage 3 is complete.

```bash
PREFLIGHT_PASS=true

# Primary check: s3-specify/STAGE.md tracking state
if [ -f ".n2b/tracking/stages/s3-specify/STAGE.md" ]; then
  S3_STATE=$(grep "^status:" .n2b/tracking/stages/s3-specify/STAGE.md | awk '{print $2}')
  if [ "$S3_STATE" != "complete" ]; then
    echo "FAILED: Stage 3 tracking not complete (status: $S3_STATE)"
    PREFLIGHT_PASS=false
  fi
else
  echo "FAILED: s3-specify/STAGE.md missing — Stage 3 has not run"
  PREFLIGHT_PASS=false
fi

# Backup structural checks (design-system/ is an optional user-supplied passthrough — never required)
for f in feature-dependency-map.md reconciliation-log.md; do
  if [ ! -f ".n2b/specifications/$f" ] || [ ! -s ".n2b/specifications/$f" ]; then
    echo "FAILED: $f missing or empty"
    PREFLIGHT_PASS=false
  fi
done
DS_DIR_COUNT=$(find .n2b/specifications/design-system -type f 2>/dev/null | wc -l | tr -d ' ')
echo "design-system passthrough: $DS_DIR_COUNT file(s) (0 = design-agnostic package)"

FEAT_DIRS=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$FEAT_DIRS" = "0" ]; then
  echo "FAILED: No FEAT-* folders in .n2b/specifications/"
  PREFLIGHT_PASS=false
fi

echo "PREFLIGHT_PASS=$PREFLIGHT_PASS"
```

**If ANY check fails:** Display this failure banner with the specific missing/invalid item and halt:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  {specific failure: e.g. "s3-specify/STAGE.md missing" / "Stage 3 tracking not complete (status: in-progress)"}

  Recovery:
    Run /n2b:s3-specify to produce Stage 3 documents
```

**If ALL checks pass:** Continue silently to Step 1.5.

---

## Step 1.5 — stage-start Transition

Execute the `stage-start` transition from tracking-protocol.md IN ORDER:

### PIPELINE.md

Update frontmatter:
- `active_stage: 4`
- `pipeline_status: running`
- `last_completed_stage`: if it is `>= 4` (re-run detected), reset to `3`; otherwise leave unchanged
- `last_updated: {current ISO timestamp}`

Update body:
- On the `- [ ] Stage 4: Technical Architecture` checklist line: add `← ACTIVE` marker at end (replace `← NEXT` if present)

### STATE.md

Update frontmatter:
- `current_step: pass-a`
- `stage_status: in-progress`
- `stage_started: {current ISO timestamp}`
- `last_updated: {current ISO timestamp}`

Update body:
- `## Current Position` section: "Stage 4 — Technical Architecture / Step: Pass A — Profile Analyst"
- `## Session Continuity`: Last action: "Stage 4 started", Next action: "Pass A — Profile Analyst", Blockers: "None"

### s4-architect/STAGE.md

Create the tracking directory if missing (`mkdir -p .n2b/tracking/stages/s4-architect`), then update `.n2b/tracking/stages/s4-architect/STAGE.md` frontmatter:
- `status: in-progress`
- `started: {current ISO timestamp}`

Write the full STAGE.md body (stage-specific body shape — all checkboxes unchecked, all gates pending):

```
This file is a live tracker while status is in-progress. Once status changes to complete, it becomes a permanent receipt — do not modify.

## Steps
- [ ] Pre-flight: Stage 3 complete + structural check
- [ ] Profile Analyst: extract metrics via Bash/grep
- [ ] Gate A verification: cross-check profile counts
- [ ] Technical Researcher: technology landscape per decision area
- [ ] Gate B landscape check: structural validation of the dossier
- [ ] Feasibility Planner: per-feature feasibility verdicts
- [ ] Technical Architect: 14-section blueprint with alternatives
- [ ] Schema Designer: database schema from Stage 3 specs
- [ ] Gate 4: 8-category validation

## Gates

### Gate A — Metric Verification
- Status: pending

### Gate B — Landscape Structural Check
- Status: pending

### Gate 4 — Architecture Validation
- Status: pending
- [ ] 1. Structural completeness (sections 1–14 + frontmatter) [HARD]
- [ ] 2. Entity extraction (profile §5, fallback dependency map) + §6 references database-schema.md [HARD]
- [ ] 3. Feature coverage (every FEAT-NN folder in §5) [HARD]
- [ ] 4. Route coverage (every Screen spec_id in §7) [HARD]
- [ ] 5. Design system coverage in §9 [SOFT]
- [ ] 6. Feasibility & landscape coverage (docs exist + counts agree) [HARD]
- [ ] 7. Decision log (ADRs, categories, alternatives ≥ Research Scope rows) [HARD]
- [ ] 8. Schema coverage (database-schema.md, 9 sections, entities) [HARD]

## Performance
- Duration: —
- Agents spawned: 0 (starting)
- Retries: 0
- Gate A attempts: 0
- Gate B attempts: 0
- Gate 4 attempts: 0

## Deviations

(None so far)

## Output

(Populated on completion)
```

### step-complete after pre-flight

Immediately tick the Pre-flight step in s4-architect/STAGE.md:
- Change `- [ ] Pre-flight: Stage 3 complete + structural check` to `- [x] Pre-flight: Stage 3 complete + structural check`

Update STATE.md:
- `current_step: pass-a` (already set at stage-start, confirm it is set)

---

## Step 2 — Setup + Pass A: Profile Analyst

Create the output directory:

```bash
mkdir -p .n2b/architecture
```

**Model resolution (once for this workflow):** read the model profile from config —

```bash
MODEL_PROFILE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('model_profile','balanced'))" 2>/dev/null || echo "balanced")
case "$MODEL_PROFILE" in quality|balanced|budget) ;; *) MODEL_PROFILE="balanced" ;; esac
echo "MODEL_PROFILE=$MODEL_PROFILE"
```

Then resolve each Stage 4 agent role's model from the Per-Agent Model Mapping table in `model-profiles.md` (rows: **Profile Analyst**, **Technical Researcher**, **Feasibility Planner**, **Technical Architect**, **Schema Designer**) and pass the resolved model as the Agent tool's `model` parameter on every spawn below — the mapping table is the single source; never hardcode a model name in this workflow.

Display the Pass A banner and the pipeline flow diagram:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Pass A   Profile Analyst        --- extract technical profile from Stage 3 specs
              ↓
  Gate A   Metric verification    --- validate profile metrics against filesystem
              ↓
  Pass B   Technical Researcher   --- research the technology landscape per active decision area
              ↓
  Gate B   Landscape check        --- structural validation of the landscape dossier
              ↓
  Pass C   Feasibility Planner    --- per-feature feasibility verdicts from Stage 3 specs
              ↓
  Pass D   Technical Architect    --- recommended architecture + documented alternatives
              ↓
  Pass E   Schema Designer        --- database schema from Stage 3 specs + architecture decisions
              ↓
  Gate 4   Structural validation  --- 8 categories
```

Display status:

```
  ○  Pass A: Profile Analyst started
```

Spawn the Profile Analyst:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-4/profile-analyst.md` and execute your complete task as described. Write your output to `.n2b/architecture/technical-profile.md`. Do not ask for clarification — work autonomously."
- Tools: Read, Bash
- Model: resolved from the **Profile Analyst** (Stage 4) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 90

After the Profile Analyst completes, verify the output exists and is non-empty:

```bash
[ -f ".n2b/architecture/technical-profile.md" ] && [ -s ".n2b/architecture/technical-profile.md" ] && echo "OUTPUT_OK" || echo "OUTPUT_MISSING"
```

**If `OUTPUT_MISSING`:** Execute gate-fail transition (treat as pipeline failure):

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-pass-a-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = "Profile Analyst did not produce technical-profile.md"

Display:

```
---

## ✗ Stage 4: Pass A Failed

Profile Analyst did not produce technical-profile.md

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Profile Analyst:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Profile Analyst: extract metrics via Bash/grep`

Update STATE.md:
- `current_step: gate-a`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Pass A — Profile Analyst complete", Next action: "Gate A — Metric Verification"

Display completion:

```
  ✓  Pass A complete — technical profile produced
```

---

## Step 3 — Gate A: Metric Verification

### gate-check Transition (before Gate A)

Update STATE.md frontmatter:
- `stage_status: gate-check`
- `last_updated: {timestamp}`

Update STATE.md body — Session Continuity:
- Last action: "Pass A complete", Next action: "Gate A metric verification running"

Display status:

```
  ○  Gate A: Metric verification started
```

Re-run key metric grep commands and compare against the profile values to catch count mismatches before the Architect is spawned:

```bash
# Extract profile values
PROFILE_FEATURES=$(grep "^| Total features" .n2b/architecture/technical-profile.md | grep -oE "[0-9]+" | tail -1)
PROFILE_SPECS=$(grep "^| Total specs" .n2b/architecture/technical-profile.md | grep -oE "[0-9]+" | tail -1)
PROFILE_ENTITIES=$(grep "^| Entity count" .n2b/architecture/technical-profile.md | grep -oE "[0-9]+" | tail -1)

# Re-count from filesystem (count directories and files, not grep rows)
FS_FEATURES=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
FS_SPECS=$(find .n2b/specifications/FEAT-*/ -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')

echo "Profile: features=$PROFILE_FEATURES, specs=$PROFILE_SPECS, entities=$PROFILE_ENTITIES"
echo "Filesystem: features=$FS_FEATURES, specs=$FS_SPECS"

VERIFY_PASS=true
VERIFY_ERRORS=""

[ "$PROFILE_FEATURES" = "$FS_FEATURES" ] || {
  VERIFY_ERRORS="$VERIFY_ERRORS\n  ✗  Feature count mismatch: profile says $PROFILE_FEATURES, filesystem has $FS_FEATURES"
  VERIFY_PASS=false
}
[ "$PROFILE_SPECS" = "$FS_SPECS" ] || {
  VERIFY_ERRORS="$VERIFY_ERRORS\n  ✗  Spec count mismatch: profile says $PROFILE_SPECS, filesystem has $FS_SPECS"
  VERIFY_PASS=false
}

# Entity count is a WARNING only (section isolation is fragile -- mismatch doesn't halt)
if [ -n "$PROFILE_ENTITIES" ] && [ "$PROFILE_ENTITIES" != "" ]; then
  FS_ENTITY_APPROX=$(grep -c "^| " .n2b/specifications/feature-dependency-map.md 2>/dev/null); FS_ENTITY_APPROX=${FS_ENTITY_APPROX:-0}
  echo "Entity warning check: profile=$PROFILE_ENTITIES (filesystem grep is approximate: $FS_ENTITY_APPROX rows)"
fi

echo "VERIFY_PASS=$VERIFY_PASS"
```

**If `VERIFY_PASS=false`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-gate-a-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = Gate A failure reason (metric mismatch details)
Update s4-architect/STAGE.md body — Gates section: set Gate A `Result: **failed**`; Deviations section: record Gate A failure details

Display:

```
---

## ✗ Stage 4: Gate Failed

Gate A — Metric Verification — {N} of 2 checks failed

Failed checks:
{VERIFY_ERRORS}

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Gate A passes:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Gate A verification: cross-check profile counts`
- Gates section — Gate A: set `Result: **passed**` with evidence (features={FS_FEATURES}, specs={FS_SPECS} — profile matches filesystem)

Update STATE.md:
- `current_step: pass-b`
- `stage_status: in-progress`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Gate A — Metric Verification passed", Next action: "Pass B — Technical Researcher"

Display completion:

```
  ✓  Gate A passed — profile metrics verified
```

---

## Step 4 — Pass B: Technical Researcher

Display the Pass B banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass B: Technical Researcher started — technology landscape per active decision area
```

Spawn the Technical Researcher:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-4/technical-researcher.md` and execute your complete task as described. Read the verified technical profile at `.n2b/architecture/technical-profile.md` and derive the active decision-area set from the registry's activation mapping in the decision guide your contract references. Research with WebSearch/WebFetch first; if web tooling is unavailable or a query fails, fall back to model knowledge and mark each affected Sources cell `knowledge-based — {reason}` and log the fallback in your `## 4. Research Log` — never fabricate URLs. Write your output to `.n2b/architecture/technology-landscape.md`. Do not ask for clarification — work autonomously."
- Tools: Read, Bash, WebSearch, WebFetch, Write
- Model: resolved from the **Technical Researcher** (Stage 4) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 130

After the Technical Researcher completes, verify the output exists and is non-empty:

```bash
[ -f ".n2b/architecture/technology-landscape.md" ] && [ -s ".n2b/architecture/technology-landscape.md" ] && echo "OUTPUT_OK" || echo "OUTPUT_MISSING"
```

**If `OUTPUT_MISSING`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-pass-b-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = "Technical Researcher did not produce technology-landscape.md"

Display:

```
---

## ✗ Stage 4: Pass B Failed

Technical Researcher did not produce technology-landscape.md

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Technical Researcher:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Technical Researcher: technology landscape per decision area`

Update STATE.md:
- `current_step: gate-b`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Pass B — Technical Researcher complete", Next action: "Gate B — Landscape Structural Check"

Display completion:

```
  ✓  Pass B complete — technology landscape produced
```

---

## Step 4.3 — Gate B: Landscape Structural Check

### gate-check Transition (before Gate B)

Update STATE.md frontmatter:
- `stage_status: gate-check`
- `last_updated: {timestamp}`

Update STATE.md body — Session Continuity:
- Last action: "Pass B complete", Next action: "Gate B landscape structural check running"

Display status:

```
  ○  Gate B: Landscape structural check started
```

Run the structural check in a single Bash block. This gate validates **structure only** — it never validates web claims. `knowledge-based — {reason}` is a legal Sources value; an empty Sources cell is a HARD failure.

```bash
LAND=".n2b/architecture/technology-landscape.md"
GATEB_HARD=0
fail_b() { echo "$1"; GATEB_HARD=$((GATEB_HARD+1)); }

# File exists + frontmatter
{ [ -f "$LAND" ] && [ -s "$LAND" ]; } || fail_b "HARD FAIL: technology-landscape.md missing or empty"
grep -q "^document_type: technology-landscape" "$LAND" 2>/dev/null || fail_b "HARD FAIL: missing document_type: technology-landscape"
grep -q "^status: final" "$LAND" 2>/dev/null || fail_b "HARD FAIL: missing status: final in technology-landscape.md"

# Research Scope table has >= 11 data rows (the always-active decision areas)
SCOPE_ROWS=$(awk '/^## 1\./{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Decision Area/ && $0 !~ /^\| *-/{n++} END{print n+0}' "$LAND")
echo "Research Scope rows: $SCOPE_ROWS"
[ "$SCOPE_ROWS" -ge 11 ] 2>/dev/null || fail_b "HARD FAIL: Research Scope has $SCOPE_ROWS rows (minimum 11)"

# Every Research Scope area name has a matching ### heading in Section 2
SCOPE_AREAS=$(awk '/^## 1\./{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Decision Area/ && $0 !~ /^\| *-/{print}' "$LAND" | awk -F'|' '{print $2}' | sed 's/^ *//; s/ *$//' | grep -v '^$')
SECTION2=$(awk '/^## 2\./{f=1; next} /^## 3\./{f=0} f{print}' "$LAND")
while IFS= read -r area; do
  [ -z "$area" ] && continue
  echo "$SECTION2" | grep -qF "### $area" || fail_b "HARD FAIL: Research Scope area '$area' has no '### $area' heading in Section 2"
done <<< "$SCOPE_AREAS"

# Per-area option tables: >= 3 option rows, no empty Sources cell
while IFS= read -r area; do
  [ -z "$area" ] && continue
  BLOCK=$(echo "$SECTION2" | awk -v a="### $area" 'index($0, a) == 1 {f=1; next} f && /^### /{exit} f{print}')
  OPT_ROWS=$(echo "$BLOCK" | awk '/^\|/ && $0 !~ /^\| *Option/ && $0 !~ /^\| *-/{n++} END{print n+0}')
  [ "$OPT_ROWS" -ge 3 ] 2>/dev/null || fail_b "HARD FAIL: '$area' option table has $OPT_ROWS rows (minimum 3)"
  EMPTY_SOURCES=$(echo "$BLOCK" | awk -F'|' '/^\|/ && $0 !~ /^\| *Option/ && $0 !~ /^\| *-/{ s=$(NF-1); gsub(/^ +| +$/, "", s); if (s == "") n++ } END{print n+0}')
  [ "$EMPTY_SOURCES" = "0" ] || fail_b "HARD FAIL: '$area' has $EMPTY_SOURCES empty Sources cell(s) — URLs or the literal fallback 'knowledge-based — {reason}' required"
done <<< "$SCOPE_AREAS"

OPTION_TOTAL=$(echo "$SECTION2" | awk '/^\|/ && $0 !~ /^\| *Option/ && $0 !~ /^\| *-/{n++} END{print n+0}')
echo "Gate B: $GATEB_HARD hard failures ($SCOPE_ROWS decision areas, $OPTION_TOTAL option rows)"
```

**If `GATEB_HARD > 0`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-gate-b-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = Gate B failure reasons (list the HARD FAIL lines)
Update s4-architect/STAGE.md body — Gates section: set Gate B `Result: **failed**` with the per-check evidence lines; Deviations section: record Gate B failure details

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE B FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  {each HARD FAIL line from the Gate B output}

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Gate B passes:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Gate B landscape check: structural validation of the dossier`
- Gates section — Gate B: set `Result: **passed**` with evidence ({SCOPE_ROWS} Research Scope rows, {OPTION_TOTAL} option rows, all Sources cells populated)

Update STATE.md:
- `current_step: pass-c`
- `stage_status: in-progress`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Gate B — Landscape Structural Check passed", Next action: "Pass C — Feasibility Planner"

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE B PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  {SCOPE_ROWS} decision areas, {OPTION_TOTAL} options — structure verified, all Sources populated
```

---

## Step 4.5 — Pass C: Feasibility Planner

Display the Pass C banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS C
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass C: Feasibility Planner started — per-feature feasibility verdicts
```

Spawn the Feasibility Planner:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-4/feasibility-planner.md` and execute your complete task as described. Read the technical profile at `.n2b/architecture/technical-profile.md` and the technology landscape at `.n2b/architecture/technology-landscape.md` — cite landscape options by name in your `**Candidate Approaches:**` fields. Read the Stage 3 specifications directly from `.n2b/specifications/` and produce one `### FEAT-NN — {Feature Name}` assessment per FEAT-* folder. Write your output to `.n2b/architecture/technical-feasibility.md`. Do not ask for clarification — work autonomously."
- Tools: Read, Bash, Write
- Model: resolved from the **Feasibility Planner** (Stage 4) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 100

After the Feasibility Planner completes, verify the output exists and is non-empty:

```bash
[ -f ".n2b/architecture/technical-feasibility.md" ] && [ -s ".n2b/architecture/technical-feasibility.md" ] && echo "OUTPUT_OK" || echo "OUTPUT_MISSING"
```

**If `OUTPUT_MISSING`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-pass-c-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = "Feasibility Planner did not produce technical-feasibility.md"

Display:

```
---

## ✗ Stage 4: Pass C Failed

Feasibility Planner did not produce technical-feasibility.md

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Feasibility Planner:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Feasibility Planner: per-feature feasibility verdicts`

Update STATE.md:
- `current_step: pass-d`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Pass C — Feasibility Planner complete", Next action: "Pass D — Technical Architect"

Display completion:

```
  ✓  Pass C complete — feasibility assessment produced
```

---

## Step 4.6 — Pass D: Technical Architect

Display the Pass D banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS D
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass D: Technical Architect started — 14-section blueprint with documented alternatives
```

Spawn the Technical Architect:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-4/technical-architect.md` and execute your complete task as described. Read the three upstream inputs: the technical profile at `.n2b/architecture/technical-profile.md`, the technology landscape at `.n2b/architecture/technology-landscape.md`, and the technical feasibility assessment at `.n2b/architecture/technical-feasibility.md`. Design system: {when the passthrough exists: 'the user-supplied design system is at `.n2b/specifications/design-system/` — read every file in it; supplied values are mapped to code as-is, never redesigned' / otherwise: 'this package has no design system (`design_system_source: none`) — Section 9 opens by stating the package is design-agnostic and drives styling/component decisions from product needs alone'}. The landscape's `## 1. Research Scope` table is the authoritative active-area set — consume it, never re-decide activation. For Section 11's role mapping, additionally read only the `## Access Matrix` section of `.n2b/features/user-persona.md` as your contract describes. If `.n2b/tracking/stages/s4-architect/prior-adr-register.md` exists, read it before assigning any ADR numbers and apply the ID Stability rules from your contract. Write your output to `.n2b/architecture/technical-architecture.md`. Do not ask for clarification — work autonomously."
- Tools: Read, Write
- Model: resolved from the **Technical Architect** (Stage 4) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 150

After the Technical Architect completes, verify the output exists and is non-empty:

```bash
[ -f ".n2b/architecture/technical-architecture.md" ] && [ -s ".n2b/architecture/technical-architecture.md" ] && echo "OUTPUT_OK" || echo "OUTPUT_MISSING"
```

**If `OUTPUT_MISSING`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-pass-d-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = "Technical Architect did not produce technical-architecture.md"

Display:

```
---

## ✗ Stage 4: Pass D Failed

Technical Architect did not produce technical-architecture.md

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Technical Architect:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Technical Architect: 14-section blueprint with alternatives`

Update STATE.md:
- `current_step: pass-e`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Pass D — Technical Architect complete", Next action: "Pass E — Schema Designer"

Display completion:

```
  ✓  Pass D complete — technical architecture produced
```

---

## Step 4.7 — Pass E: Schema Designer

Display the Pass E banner and status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS E
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Pass E: Schema Designer started — database schema from Stage 3 specs
```

Spawn the Schema Designer:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-4/schema-designer.md` and execute your complete task as described. Read the Stage 3 specifications directly from `.n2b/specifications/`, and read the technical architecture at `.n2b/architecture/technical-architecture.md` for the database and ORM selections (Section 3) and the authentication and access decisions (Section 11). Write your output to `.n2b/architecture/database-schema.md`. Do not ask for clarification — work autonomously."
- Tools: Read, Write
- Model: resolved from the **Schema Designer** (Stage 4) row of model-profiles.md under MODEL_PROFILE (Step 2)
- maxTurns: 100

After the Schema Designer completes, verify the output exists and is non-empty:

```bash
[ -f ".n2b/architecture/database-schema.md" ] && [ -s ".n2b/architecture/database-schema.md" ] && echo "OUTPUT_OK" || echo "OUTPUT_MISSING"
```

**If `OUTPUT_MISSING`:** Execute gate-fail transition:

Update PIPELINE.md frontmatter: `active_stage: 0`, `pipeline_status: failed`, `last_gate_result: stage-4-pass-e-failed`, `last_updated: {timestamp}`
Update STATE.md frontmatter: `stage_status: gate-failed`, `last_updated: {timestamp}`
Update STATE.md body — Session Continuity: Blockers = "Schema Designer did not produce database-schema.md"

Display:

```
---

## ✗ Stage 4: Pass E Failed

Schema Designer did not produce database-schema.md

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

**step-complete after Schema Designer:**

Update s4-architect/STAGE.md body:
- Tick: `- [x] Schema Designer: database schema from Stage 3 specs`

Update STATE.md:
- `current_step: gate-4`
- `last_updated: {timestamp}`
- Session Continuity: Last action: "Pass E — Schema Designer complete", Next action: "Gate 4 — Architecture Validation"

Display completion:

```
  ✓  Pass E complete — database schema produced
```

---

## Step 5 — Gate 4 Validation

### gate-check Transition (before Gate 4)

Update STATE.md frontmatter:
- `stage_status: gate-check`
- `last_updated: {timestamp}`

Update STATE.md body — Session Continuity:
- Last action: "Pass E complete", Next action: "Gate 4 validation running"

Display status:

```
  ○  Gate 4: Architecture Validation started
```

Run ALL 8 categories in a single Bash block. Track `HARD FAIL` and `SOFT FAIL` lines in output.

```bash
ARCH=".n2b/architecture/technical-architecture.md"
PROFILE=".n2b/architecture/technical-profile.md"
FEAS=".n2b/architecture/technical-feasibility.md"
LAND=".n2b/architecture/technology-landscape.md"
GATE_OUTPUT=""

# ── Category 1: Structural Completeness (GATE-01) ──────────────────────────

echo "=== Category 1: Structural Completeness ==="

{ [ -f "$ARCH" ] && [ -s "$ARCH" ]; } || echo "HARD FAIL: technical-architecture.md missing or empty"

# All 14 sections present (format: ## N. Section Name)
for section_num in 1 2 3 4 5 6 7 8 9 10 11 12 13 14; do
  grep -q "^## ${section_num}\." "$ARCH" 2>/dev/null || echo "HARD FAIL: Section ${section_num} missing in technical-architecture.md"
done

# Frontmatter fields
grep -q "^document_type: technical-architecture" "$ARCH" 2>/dev/null || echo "HARD FAIL: missing document_type: technical-architecture"
grep -q "^produced_by: technical-architect" "$ARCH" 2>/dev/null || echo "HARD FAIL: missing produced_by: technical-architect"
grep -q "^status: final" "$ARCH" 2>/dev/null || echo "HARD FAIL: missing status: final"

echo "Category 1 complete"

# ── Category 2: Entity Extraction + Data Layer Pointer (GATE-02) ───────────
# NOTE: Entity-level coverage is checked by Category 8 against database-schema.md.
# Category 2 extracts entity names (reused by Category 8) and does a structural-only
# check that Section 6 references database-schema.md.

echo "=== Category 2: Entity Extraction ==="

# Extract entity names from Profile Section 5 (Entity Inventory table rows)
# Primary: sed-based extraction (more portable than awk compound patterns on macOS)
ENTITY_NAMES=$(sed -n '/^## 5\./,/^## 6\./p' "$PROFILE" 2>/dev/null | grep '^|' | grep -viE '^[| ]*Entity Name|^[| ]*---' | awk -F'|' '{print $2}' | sed 's/^ *//; s/ *$//' | grep -v '^$')

# Fallback: extract from the dependency map's Shared Data Entities section if
# profile extraction returned empty. Entities there are "### {Entity Name}"
# headings under "## Shared Data Entities" — the same shape Stage 3 Gate A
# Category 4 validates.
if [ -z "$ENTITY_NAMES" ]; then
  ENTITY_NAMES=$(awk '/^## Shared Data Entities/{f=1; next} f && /^## /{exit} f && /^### /{sub(/^### +/, ""); print}' .n2b/specifications/feature-dependency-map.md 2>/dev/null | sed 's/[[:space:]]*$//' | grep -v '^$')
fi

if [ -z "$ENTITY_NAMES" ]; then
  echo "HARD FAIL: Could not extract entity names from technical-profile.md Section 5 or feature-dependency-map.md"
else
  ENTITY_COUNT=$(echo "$ENTITY_NAMES" | wc -l | tr -d ' ')
  # Structural check: Section 6 must reference database-schema.md
  SECTION6=$(awk '/^## 6\./{found=1; next} /^## 7\./{found=0} found{print}' "$ARCH" 2>/dev/null)
  echo "$SECTION6" | grep -qi "database-schema.md" || echo "HARD FAIL: Section 6 does not reference database-schema.md"
  echo "Entity extraction: $ENTITY_COUNT entities extracted (per-entity check delegated to Category 8)"
fi

echo "Category 2 complete"

# ── Category 3: Feature Coverage (GATE-03) ─────────────────────────────────

echo "=== Category 3: Feature Coverage ==="

# List FEAT-NN patterns from the specifications filesystem (never from grep against product-features.md)
FEAT_IDS=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | xargs -I{} basename {} | grep -oE "FEAT-[0-9]+" | sort -u)

if [ -z "$FEAT_IDS" ]; then
  echo "HARD FAIL: No FEAT-* folders found in .n2b/specifications/"
else
  FEAT_TOTAL=$(echo "$FEAT_IDS" | wc -l | tr -d ' ')
  FEAT_FOUND=0
  SECTION5=$(awk '/^## 5\./{found=1; next} /^## 6\./{found=0} found{print}' "$ARCH" 2>/dev/null)
  while IFS= read -r feat_id; do
    [ -z "$feat_id" ] && continue
    if echo "$SECTION5" | grep -qi "$feat_id"; then
      FEAT_FOUND=$((FEAT_FOUND + 1))
    else
      echo "HARD FAIL: $feat_id not found in Section 5 (Project Structure)"
    fi
  done <<< "$FEAT_IDS"
  echo "Feature coverage: $FEAT_FOUND/$FEAT_TOTAL FEAT-IDs found in Section 5"
fi

echo "Category 3 complete"

# ── Category 4: Route Coverage (GATE-04) ───────────────────────────────────

echo "=== Category 4: Route Coverage ==="

# Find Screen spec IDs from specs in .n2b/specifications/
SCREEN_SPECS=$(grep -rl "^spec_type:.*[Ss]creen" .n2b/specifications/FEAT-*/*.md 2>/dev/null)

if [ -z "$SCREEN_SPECS" ]; then
  echo "HARD FAIL: No Screen specs found in .n2b/specifications/"
else
  SCREEN_TOTAL=$(echo "$SCREEN_SPECS" | wc -l | tr -d ' ')
  SCREEN_FOUND=0
  SECTION7=$(awk '/^## 7\./{found=1; next} /^## 8\./{found=0} found{print}' "$ARCH" 2>/dev/null)
  for spec_file in $SCREEN_SPECS; do
    SPEC_ID=$(grep "^spec_id:" "$spec_file" 2>/dev/null | head -1 | sed 's/^spec_id: *//')
    [ -z "$SPEC_ID" ] && continue
    if echo "$SECTION7" | grep -qi "$SPEC_ID"; then
      SCREEN_FOUND=$((SCREEN_FOUND + 1))
    else
      echo "HARD FAIL: Screen spec $SPEC_ID not found in Section 7 (Route Map)"
    fi
  done
  echo "Route coverage: $SCREEN_FOUND/$SCREEN_TOTAL Screen specs found in Section 7"
fi

echo "Category 4 complete"

# ── Category 5: Design System Coverage (GATE-05) ───────────────────────────

echo "=== Category 5: Design System Coverage ==="

# All design system coverage failures are SOFT
SECTION9=$(awk '/^## 9\./{found=1; next} /^## 10\./{found=0} found{print}' "$ARCH" 2>/dev/null)

# Section 9 always opens by stating the design-system posture (user-supplied passthrough vs design-agnostic)
echo "$SECTION9" | grep -qi "design.system\|design-agnostic" || echo "SOFT FAIL: Section 9 does not state the design-system posture"

DS_DIR_COUNT=$(find .n2b/specifications/design-system -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$DS_DIR_COUNT" -gt 0 ]; then
  # User-supplied design system present — Section 9 must map it to code (broadened patterns)
  echo "$SECTION9" | grep -qiE "color|colour|palette|token" || echo "SOFT FAIL: user-supplied design system not mapped in Section 9 (no color/token mapping)"
  echo "$SECTION9" | grep -qiE "typograph|type.scale|font" || echo "SOFT FAIL: user-supplied design system 'Typography' not mapped in Section 9"
  echo "$SECTION9" | grep -qiE "component" || echo "SOFT FAIL: 'Components' not mapped in Section 9"
  echo "$SECTION9" | grep -qiE "as.is|never.redesign|verbatim|supplied" || echo "SOFT FAIL: Section 9 does not state that supplied design values are mapped as-is"
else
  # Design-agnostic package — Section 9 still owns the styling/component-layer decisions
  echo "$SECTION9" | grep -qiE "component" || echo "SOFT FAIL: Section 9 missing component-layer decision (design-agnostic package)"
fi

echo "Category 5 complete"

# ── Category 6: Feasibility & Landscape Coverage (GATE-06) ─────────────────

echo "=== Category 6: Feasibility & Landscape Coverage ==="

{ [ -f "$FEAS" ] && [ -s "$FEAS" ]; } || echo "HARD FAIL: technical-feasibility.md missing or empty"
grep -q "^document_type: technical-feasibility" "$FEAS" 2>/dev/null || echo "HARD FAIL: missing document_type: technical-feasibility"
grep -q "^status: final" "$FEAS" 2>/dev/null || echo "HARD FAIL: missing status: final in technical-feasibility.md"
{ [ -f "$LAND" ] && [ -s "$LAND" ]; } || echo "HARD FAIL: technology-landscape.md missing or empty"
grep -q "^document_type: technology-landscape" "$LAND" 2>/dev/null || echo "HARD FAIL: missing document_type: technology-landscape"
grep -q "^status: final" "$LAND" 2>/dev/null || echo "HARD FAIL: missing status: final in technology-landscape.md"

# Feature list comes from the filesystem (FEAT folders) — the feasibility doc's own
# ^### FEAT- headings are its contract, countable directly
FEAT_FOLDER_COUNT=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
FEAS_FEAT_COUNT=$(grep -c "^### FEAT-" "$FEAS" 2>/dev/null); FEAS_FEAT_COUNT=${FEAS_FEAT_COUNT:-0}
[ "$FEAS_FEAT_COUNT" = "$FEAT_FOLDER_COUNT" ] || echo "HARD FAIL: feasibility has $FEAS_FEAT_COUNT '### FEAT-' assessments but .n2b/specifications/ has $FEAT_FOLDER_COUNT FEAT-* folders"

# Research Scope minimum (re-derived here so Category 7 can consume SCOPE_ROWS)
SCOPE_ROWS=$(awk '/^## 1\./{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Decision Area/ && $0 !~ /^\| *-/{n++} END{print n+0}' "$LAND")
[ "$SCOPE_ROWS" -ge 11 ] 2>/dev/null || echo "HARD FAIL: landscape Research Scope has $SCOPE_ROWS rows (minimum 11)"

# Architecture Section 2 must be substantive (>= 5 non-blank content lines)
ARCH_S2_LINES=$(awk '/^## 2\./{f=1; next} /^## 3\./{f=0} f && NF>0{n++} END{print n+0}' "$ARCH")
[ "$ARCH_S2_LINES" -ge 5 ] 2>/dev/null || echo "HARD FAIL: architecture Section 2 has $ARCH_S2_LINES non-blank lines (minimum 5)"

echo "Feasibility & landscape coverage: $FEAS_FEAT_COUNT/$FEAT_FOLDER_COUNT features assessed, $SCOPE_ROWS Research Scope rows, Section 2 lines: $ARCH_S2_LINES"

echo "Category 6 complete"

# ── Category 7: Decision Log Completeness (GATE-07) ────────────────────────

echo "=== Category 7: Decision Log Completeness ==="

# Extract the Decision Log table from Section 14
SECTION14=$(awk '/^## 14\./{found=1; next} /^## [0-9]+\./{found=0} found{print}' "$ARCH" 2>/dev/null)

ADR_COUNT=$(echo "$SECTION14" | grep -c "^| ADR-")
UNIQUE_CATEGORIES=$(echo "$SECTION14" | grep "^| ADR-" | awk -F'|' '{print $3}' | sed 's/^ *//; s/ *$//' | sort -u | grep -v '^$' | wc -l | tr -d ' ')
CHOOSE_COUNT=$(grep -c "Choose instead when" "$ARCH" 2>/dev/null); CHOOSE_COUNT=${CHOOSE_COUNT:-0}

echo "Decision Log: $ADR_COUNT ADR entries, $UNIQUE_CATEGORIES unique categories; 'Choose instead when' occurrences: $CHOOSE_COUNT (Research Scope rows: $SCOPE_ROWS)"

[ "$ADR_COUNT" -ge "$SCOPE_ROWS" ] 2>/dev/null || echo "HARD FAIL: Decision Log has $ADR_COUNT ADR entries (need >= $SCOPE_ROWS — one per Research Scope decision area)"
[ "$UNIQUE_CATEGORIES" -ge "$SCOPE_ROWS" ] 2>/dev/null || echo "HARD FAIL: Decision Log has $UNIQUE_CATEGORIES unique categories (need >= $SCOPE_ROWS — Category values are Research Scope area names, registry or extension)"
[ "$CHOOSE_COUNT" -ge "$SCOPE_ROWS" ] 2>/dev/null || echo "HARD FAIL: 'Choose instead when' appears $CHOOSE_COUNT times in technical-architecture.md (need >= $SCOPE_ROWS — every active area carries an Alternatives table)"

# Unfilled X-for-digit placeholders (cost model or anywhere) — a literal "$X0"-style value is template residue, not content
XPAT_COUNT=$(grep -cE '\$X+[0-9]*' "$ARCH" 2>/dev/null); XPAT_COUNT=${XPAT_COUNT:-0}
[ "$XPAT_COUNT" -eq 0 ] 2>/dev/null || echo "HARD FAIL: $XPAT_COUNT literal '\$X'-style placeholder(s) in technical-architecture.md (unfilled template — every cost cell carries a real digit from landscape pricing evidence)"

echo "Category 7 complete"

# ── Category 8: Schema Coverage (GATE-08) ────────────────────────────────

echo "=== Category 8: Schema Coverage ==="

SCHEMA=".n2b/architecture/database-schema.md"

# Verify database-schema.md exists and is non-empty
{ [ -f "$SCHEMA" ] && [ -s "$SCHEMA" ]; } || echo "HARD FAIL: database-schema.md missing or empty"

# Verify frontmatter fields
grep -q "^document_type: database-schema" "$SCHEMA" 2>/dev/null || echo "HARD FAIL: missing document_type: database-schema"
grep -q "^status: final" "$SCHEMA" 2>/dev/null || echo "HARD FAIL: missing status: final in database-schema.md"

# Verify all 9 sections present
for section_num in 1 2 3 4 5 6 7 8 9; do
  grep -q "^## ${section_num}\." "$SCHEMA" 2>/dev/null || echo "HARD FAIL: Section ${section_num} missing in database-schema.md"
done

# Verify entities from profile appear in database-schema.md Section 2 (Table Definitions)
# $ENTITY_NAMES and $ENTITY_COUNT were extracted in Category 2
if [ -n "$ENTITY_NAMES" ]; then
  SCHEMA_SECTION2=$(awk '/^## 2\./{found=1; next} /^## 3\./{found=0} found{print}' "$SCHEMA" 2>/dev/null)
  SCHEMA_ENTITY_FOUND=0
  while IFS= read -r entity; do
    [ -z "$entity" ] && continue
    if echo "$SCHEMA_SECTION2" | grep -qi "$entity"; then
      SCHEMA_ENTITY_FOUND=$((SCHEMA_ENTITY_FOUND + 1))
    else
      echo "HARD FAIL: Entity '$entity' not found in database-schema.md Section 2 (Table Definitions)"
    fi
  done <<< "$ENTITY_NAMES"
  echo "Schema entity coverage: $SCHEMA_ENTITY_FOUND/$ENTITY_COUNT entities found in database-schema.md"
fi

echo "Category 8 complete"

```

Capture all output from the gate checks above as `$GATE_OUTPUT`.

Aggregate results:

```bash
HARD_COUNT=$(echo "$GATE_OUTPUT" | grep -c "HARD FAIL")
SOFT_COUNT=$(echo "$GATE_OUTPUT" | grep -c "SOFT FAIL")
echo "Gate 4: $HARD_COUNT hard failures, $SOFT_COUNT soft failures"
```

**Record per-category evidence in s4-architect/STAGE.md Gates section:**

After running all 8 categories, update the STAGE.md Gates section with per-category evidence. Use results from the bash output above:

```
- [ ] 1. Structural completeness: {N}/14 sections present; frontmatter valid
- [ ] 2. Entity extraction: Section 6 references database-schema.md; {N} entities extracted
- [ ] 3. Feature coverage: {N}/{N} FEAT-IDs found in Section 5
- [ ] 4. Route coverage: {N}/{N} Screen specs found in Section 7
- [ ] 5. Design system: Colors/Typography/Spacing/Components/provenance {found/missing} in Section 9 [SOFT]
- [ ] 6. Feasibility & landscape coverage: {N}/{N} features assessed; {N} Research Scope rows; Section 2 lines: {N}
- [ ] 7. Decision log: {N} ADR entries, {N} unique categories, {N} 'Choose instead when' occurrences (need >= {SCOPE_ROWS})
- [ ] 8. Schema coverage: {N}/{N} entities in database-schema.md; {N}/9 sections; frontmatter valid
```

---

## Step 6 — Completion Report

### Failure path (HARD_COUNT > 0)

Execute the `gate-fail` transition from tracking-protocol.md:

**PIPELINE.md:**
- `active_stage: 0`
- `pipeline_status: failed`
- `last_gate_result: stage-4-gate-4-failed`
- `last_updated: {timestamp}`

**STATE.md frontmatter:**
- `stage_status: gate-failed`
- `last_updated: {timestamp}`

**STATE.md body — Session Continuity:**
- Last action: "Gate 4 failed — {HARD_COUNT} categories failed"
- Next action: `/n2b:s4-architect` to re-run
- Blockers: gate failure categories (list failed category names)

**s4-architect/STAGE.md Gates section:** Mark passed categories with `- [x]`, keep failed with `- [ ]`, set `Result: **failed**` with per-category evidence

Display the gate failure banner and message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE 4 FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✗ Stage 4: Gate Failed

Gate 4 — Architecture Validation — {HARD_COUNT} of 8 categories failed

Failed checks:
- {Category name}: {what failed and why — specific counts, file paths}

---

## ▶ Next Action

Re-run to retry: `/n2b:s4-architect`

*(`/clear` first → fresh context window)*

---
```

Halt.

### Success path (HARD_COUNT = 0)

Display the gate pass banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE 4 PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  8 categories validated — the blueprint package is structurally complete
```

Execute the 4-step `stage-complete` transition from tracking-protocol.md. Perform all 4 steps in order.

**Step 6.1 — Finalize s4-architect/STAGE.md (do this first):**

Extract counts for the receipt:

```bash
ARCH=".n2b/architecture/technical-architecture.md"
FEAS=".n2b/architecture/technical-feasibility.md"
LAND=".n2b/architecture/technology-landscape.md"
SCHEMA=".n2b/architecture/database-schema.md"

SECTION_COUNT=$(grep -c "^## [0-9]\+\." "$ARCH" 2>/dev/null); SECTION_COUNT=${SECTION_COUNT:-14}
ADR_COUNT=$(grep -c "^| ADR-" "$ARCH" 2>/dev/null); ADR_COUNT=${ADR_COUNT:-?}
STAGE_STARTED=$(grep "^started:" .n2b/tracking/stages/s4-architect/STAGE.md | awk '{print $2}')
SCHEMA_TABLES=$(grep "^table_count:" "$SCHEMA" 2>/dev/null | awk '{print $2}')
SCHEMA_RELS=$(grep "^relationship_count:" "$SCHEMA" 2>/dev/null | awk '{print $2}')
SCOPE_ROWS=$(awk '/^## 1\./{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Decision Area/ && $0 !~ /^\| *-/{n++} END{print n+0}' "$LAND")
OPTION_TOTAL=$(grep "^option_count:" "$LAND" 2>/dev/null | awk '{print $2}')
FEAT_FOLDER_COUNT=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')

# Feasibility verdict mix from the Section 1 summary table (Verdict is column 3)
VERDICT_COL=$(awk '/^## 1\./{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Feature/ && $0 !~ /^\| *-/{print}' "$FEAS" | awk -F'|' '{print $3}' | sed 's/^ *//; s/ *$//')
V_STRAIGHT=$(echo "$VERDICT_COL" | grep -c "^Straightforward")
V_STDINT=$(echo "$VERDICT_COL" | grep -c "^Standard-with-integration")
V_HARD=$(echo "$VERDICT_COL" | grep -c "^Hard")
V_SPIKE=$(echo "$VERDICT_COL" | grep -c "^Research-spike")
echo "Verdict mix: $V_STRAIGHT Straightforward, $V_STDINT Standard-with-integration, $V_HARD Hard, $V_SPIKE Research-spike recommended"
```

Update s4-architect/STAGE.md frontmatter:
- `status: complete`
- `completed: {current ISO timestamp}`

Update s4-architect/STAGE.md body:
- Tick all remaining `- [ ]` to `- [x]` (including "Gate 4: 8-category validation")
- Gates section: set Gate 4 `Result: **passed**`, mark all 8 categories `- [x]` with evidence inline (from the gate check results); Gate A and Gate B already carry their `Result: **passed**` evidence
- Performance section: fill in final values:
  ```
  - Duration: {minutes from STAGE_STARTED to now} min
  - Agents spawned: 5 (Profile Analyst, Technical Researcher, Feasibility Planner, Technical Architect, Schema Designer)
  - Retries: {actual retry count}
  - Gate A attempts: {actual count}
  - Gate B attempts: {actual count}
  - Gate 4 attempts: {actual count}
  ```
- Output section:
  ```
  - .n2b/architecture/technical-profile.md
  - .n2b/architecture/technology-landscape.md ({SCOPE_ROWS} decision areas, {OPTION_TOTAL} options)
  - .n2b/architecture/technical-feasibility.md ({FEAT_FOLDER_COUNT} feature assessments)
  - .n2b/architecture/technical-architecture.md ({SECTION_COUNT} sections, {ADR_COUNT} ADR entries)
  - .n2b/architecture/database-schema.md ({SCHEMA_TABLES} tables, {SCHEMA_RELS} relationships)
  ```

After this step, s4-architect/STAGE.md is a **permanent receipt**. Do not modify it again.

**Step 6.2 — Update PIPELINE.md, then MANIFEST.md:**

Extract artifact lineage data:

```bash
# Extract FEAT-IDs covered in technical-architecture.md
ARCH_FEAT_IDS=$(grep -o "FEAT-[0-9]\+" .n2b/architecture/technical-architecture.md 2>/dev/null | sort -u)

# Get project_name from PIPELINE.md or BRIEF.md
PROJECT_NAME=$(grep "^project_name:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^project_name: *//' | tr -d '"')
```

Update PIPELINE.md frontmatter:
- `active_stage: 0`
- `last_completed_stage: 4`
- `last_gate_result: stage-4-gate-4-passed`
- `pipeline_status: blueprint-complete` — Stage 4 is the final stage of the pipeline; this value is terminal (exports never change it)
- `last_updated: {timestamp}`

Update PIPELINE.md body:
- Stage 4 checklist line: change `- [ ]` to `- [x]`, remove `← ACTIVE` marker, append: `— Completed {date} | blueprint package complete`
- Add `← NEXT` to the Stage 5 checklist line (it reads as the next *available* action per tracking-protocol.md — the export itself remains optional)
- Stage History: add Stage 4 entry:
  ```markdown
  ### Stage 4: Technical Architecture
  - Completed: {ISO timestamp}
  - Gate A (metrics): passed (features={PROFILE_FEATURES}, specs={PROFILE_SPECS} — matches filesystem)
  - Gate B (landscape): passed ({SCOPE_ROWS} decision areas, {OPTION_TOTAL} options, all Sources populated)
  - Gate 4 (architecture): passed ({SECTION_COUNT}/14 sections, {ENTITY_COUNT} entities, {FEAT_FOLDER_COUNT} features, {SCREEN_FOUND} routes, {ADR_COUNT} ADRs)
  - Output: .n2b/architecture/ (5 documents)
  - Detail: → .n2b/tracking/stages/s4-architect/STAGE.md
  - Performance: 5 agents, {duration} min, {retries} retries
  ```
- Artifact Lineage — Stage 4 Mapping column: For each FEAT-ID row already in the lineage table, update Stage 4 Mapping:
  - If FEAT-ID found in `$ARCH_FEAT_IDS`: set to `✅ Mapped`
  - If FEAT-ID not found: set to `⚠ Missing`

**Then update `.n2b/tracking/MANIFEST.md`** — the canonical-package manifest (see tracking-protocol.md, stage-complete Step 2). Add (or, on a re-run, refresh) exactly five `## Package Inventory` rows — one per document under `.n2b/architecture/`.

Compute the fingerprints (first 12 hex chars of `shasum -a 256`) and ID-coverage ranges:

```bash
# Fingerprint every canonical Stage 4 file
for f in technical-profile.md technology-landscape.md technical-feasibility.md technical-architecture.md database-schema.md; do
  echo "architecture/$f $(shasum -a 256 ".n2b/architecture/$f" | cut -c1-12)"
done

# Feasibility FEAT coverage range (first and last FEAT-ID assessed)
grep -o "^### FEAT-[0-9]*" .n2b/architecture/technical-feasibility.md | grep -o "FEAT-[0-9]*" | sort -uV | sed -n '1p;$p'

# Architecture ADR coverage range (first and last ADR-ID in the Decision Log)
grep -o "ADR-[0-9][0-9]*" .n2b/architecture/technical-architecture.md | sort -uV | sed -n '1p;$p'
```

Row shapes (paths relative to `.n2b/`):

```
| architecture/technical-profile.md | 4 | — | {fingerprint} | {ISO timestamp} |
| architecture/technology-landscape.md | 4 | — | {fingerprint} | {ISO timestamp} |
| architecture/technical-feasibility.md | 4 | FEAT-01..{NN} | {fingerprint} | {ISO timestamp} |
| architecture/technical-architecture.md | 4 | ADR-001..{NNN} | {fingerprint} | {ISO timestamp} |
| architecture/database-schema.md | 4 | — | {fingerprint} | {ISO timestamp} |
```

- Leave the Stage 1, Stage 2, and Stage 3 rows untouched.
- Increment `package_version` by 1 (one increment for this update — rows were added/changed) and refresh `last_updated` in the MANIFEST.md frontmatter.
- MANIFEST.md is written only by workflows during this transition — never by agents.

**Step 6.3 — Refresh STATE.md (final state):**

Update STATE.md frontmatter:
- `stage_status: between-stages`
- `current_step: none`
- `last_updated: {timestamp}`

Update STATE.md body — write final state (trim to 50-80 lines):

```
## Current Position
Blueprint complete. Stage 4 was the final pipeline stage — the handoff package exists.

## Accumulated Context
- Project: {PROJECT_NAME}
- Brief: .n2b/BRIEF.md
- Features: {FEAT_FOLDER_COUNT} features in .n2b/features/
- Specifications: {FS_SPECS} specs in .n2b/specifications/
- Architecture: .n2b/architecture/technical-architecture.md ({ADR_COUNT} ADRs with documented alternatives)
- Schema: .n2b/architecture/database-schema.md ({SCHEMA_TABLES} tables)
- Package: version {package_version} — inventory in .n2b/tracking/MANIFEST.md

## Session Continuity
Last action: Stage 4 Gate 4 passed — pipeline_status: blueprint-complete
Next action: /n2b:s5-export (optional — the blueprint package is complete)
Blockers: None
```

**Step 6.4 — Display the PACKAGE READY block:**

This replaces the non-terminal continuation message — there is no next required stage. Render the block below. The package inventory is **derived from `.n2b/tracking/MANIFEST.md` `## Package Inventory`** — read the manifest and render one table row per inventory row (artifact path, producing stage, ID coverage). Never hardcode the list.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PACKAGE READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✓ Stage 4: Technical Architecture Complete

{SCOPE_ROWS} decision areas resolved with {ADR_COUNT} ADRs and documented alternatives, a {SCHEMA_TABLES}-table database schema, and feasibility verdicts for {FEAT_FOLDER_COUNT} features ({V_STRAIGHT} Straightforward, {V_STDINT} Standard-with-integration, {V_HARD} Hard, {V_SPIKE} Research-spike recommended)

The blueprint pipeline is complete (`pipeline_status: blueprint-complete`). No further stage is required — the package below is the terminal deliverable, ready to hand to a development team or any AI coding tool.

## Blueprint Package (version {package_version})

| Artifact | Stage | ID coverage |
|---|---|---|
{one row per MANIFEST.md ## Package Inventory row — artifact path, producing stage, ID coverage}

## Optional: Export the Package

The blueprint is complete whether or not you export it. When you want it rendered for a consumer:

- `/n2b:s5-export` — interactive target picker
- `/n2b:s5-export {target}` — render one target (e.g. `/n2b:s5-export dev-brief`)

One export format per run — invoke again anytime for another.

**Also available:**
- `/n2b:status` — check pipeline state and package integrity
```

If `SOFT_COUNT > 0`, append a Warnings section AFTER the PACKAGE READY block:

```
Warnings:
  {each SOFT FAIL line from GATE_OUTPUT}
```

</process>

<success_criteria>

- Step 0 entry gate transcribes the n2b gatekeeper's Check 1-3 for Stage 4: `blueprint-complete` routes a Stage 4 request into the re-run path (user confirm + stale-export marking — E10 never blocks a stage-specific request); Stage 4 has no downstream hard-block (E8 applies between Stages 1–4 only; s5-export is a post-completion consumer whose exports go stale, never block); in-progress/failed passes through; complete triggers the soft-block confirm with cleanup (delete `.n2b/architecture/*`, tracker → not-started, `last_completed_stage` → 3, Export History rows → stale when any exist)
- Stage 3 completeness validated via `.n2b/tracking/stages/s3-specify/STAGE.md` `status: complete` (directory-form tracking path)
- Backup structural checks: feature-dependency-map.md, reconciliation-log.md, FEAT-* folders in `.n2b/specifications/` (the design-system/ passthrough is optional — its file count is reported, never required)
- stage-start transition placed at Step 1.5 (after pre-flight passes): PIPELINE.md `active_stage: 4` / `pipeline_status: running` / ← ACTIVE; STATE.md `current_step: pass-a` / `stage_status: in-progress`; `.n2b/tracking/stages/s4-architect/STAGE.md` `status: in-progress` + full body skeleton written
- STAGE.md body shape: 9 Steps (pre-flight, Profile Analyst, Gate A verification, Technical Researcher, Gate B landscape check, Feasibility Planner, Technical Architect, Schema Designer, Gate 4), Gates section with Gate A + Gate B + Gate 4's 8 recomposed categories, Performance rows including `Gate B attempts`, Deviations, Output
- step-complete recorded after: pre-flight, Profile Analyst (advances to gate-a), Gate A (advances to pass-b), Technical Researcher (advances to gate-b), Gate B (advances to pass-c), Feasibility Planner (advances to pass-d), Technical Architect (advances to pass-e), Schema Designer (advances to gate-4)
- gate-check recorded before: Gate A, Gate B, and Gate 4 (`stage_status: gate-check` each time)
- Gate A bash re-count block preserved with only path renames — feature/spec counts filesystem-derived (`ls -d .n2b/specifications/FEAT-*/`, `find … -name "FEAT-*.SPEC-*.md"`)
- Gate B (landscape structural check) is deterministic bash between Pass B and Pass C: file + frontmatter, Research Scope ≥ 11 rows, a `### {Area}` heading per Research Scope row, ≥ 3 option rows per area, no empty Sources cell (`knowledge-based — {reason}` passes) — structure only, never validating web claims; failure fires gate-fail with `stage-4-gate-b-failed`
- Gate 4 runs all 8 categories in a single bash block with HARD/SOFT accounting and per-category evidence in STAGE.md; awk section ranges follow the 14-section numbering (Cat 2 `## 6.`→`## 7.`, Cat 3 `## 5.`→`## 6.`, Cat 4 `## 7.`→`## 8.`, Cat 5 `## 9.`→`## 10.`, Cat 7 `## 14.`); Cat 1 loops sections 1–14; Cat 8 loops schema sections 1–9; no blocklist regex exists anywhere in this workflow
- Gate 4 Cat 6 counts `^### FEAT-` headings in technical-feasibility.md against `ls -d .n2b/specifications/FEAT-*/` folder counts — never against product-features.md headings; Cat 7 enforces ADR count, unique Category count, and `Choose instead when` count each ≥ the Research Scope row count
- Spawn table: Profile Analyst (Read, Bash, maxTurns 90), Technical Researcher (Read, Bash, WebSearch, WebFetch, Write, maxTurns 130), Feasibility Planner (Read, Bash, Write, maxTurns 100), Technical Architect (Read, Write, maxTurns 150), Schema Designer (Read, Write, maxTurns 100) — contracts at `.claude/n2b/agents/stage-4/{name}.md`; every spawn passes a `model` resolved at Step 2 from MODEL_PROFILE (`.n2b/config.json` `model_profile`, default `balanced`) via model-profiles.md's Per-Agent Model Mapping — no hardcoded model names
- Pass D's spawn prompt names the three upstream inputs (profile, landscape, feasibility) plus the design-system posture (passthrough directory when present, design-agnostic statement otherwise); Pass E's prompt points the Schema Designer at architecture Section 3 (Database/ORM) and Section 11 (authentication and access)
- Missing pass output fires gate-fail with `stage-4-pass-{a|b|c|d|e}-failed` and the branded failure display
- stage-complete 4-step sequence on Gate 4 pass: (1) s4-architect/STAGE.md sealed with all evidence + Performance (`Agents spawned: 5`) + Output (5 documents); (2) PIPELINE.md `pipeline_status: blueprint-complete` + Stage 4 ticked + `← NEXT` on the Stage 5 line + Stage History entry with Gate A/Gate B/Gate 4 evidence lines and `Output: .n2b/architecture/ (5 documents)` + Artifact Lineage Stage 4 Mapping column, then MANIFEST.md gains the five architecture rows (fingerprints `shasum -a 256 | cut -c1-12`, ID coverage `FEAT-01..NN` for feasibility and `ADR-001..NNN` for the architecture, `—` elsewhere, `package_version` +1); (3) STATE.md final body with Next action `/n2b:s5-export (optional — the blueprint package is complete)`; (4) PACKAGE READY block
- The PACKAGE READY block satisfies all six pinned invariants: the `n2b > PACKAGE READY` banner (40 `━`); `## ✓ Stage 4: Technical Architecture Complete` + a summary line built from counted values (decision areas, ADRs, tables, feasibility verdict mix); an explicit statement that the blueprint pipeline is complete (`pipeline_status: blueprint-complete`) and no further stage is required; a package inventory derived from MANIFEST.md rows with `package_version`; export routing as an offer (`/n2b:s5-export` for the interactive picker, `/n2b:s5-export {target}` for one target — e.g. `dev-brief`; one export per invocation, the only two forms) plus `/n2b:status`; no next-stage framing and no build language
- SOFT warnings appended after the PACKAGE READY block
- gate-fail on Gate 4 HARD failures: `stage-4-gate-4-failed`, `GATE 4 FAILED` banner + per-category failure evidence + re-run routing
- All gate checks (Gate A, Gate B, Gate 4) use Bash only (grep, find, awk, wc, ls) — not the Read tool
- All banners use registered ui-brand.md names (`PASS A`–`PASS E`, `GATE B PASSED`/`GATE B FAILED`, `GATE 4 PASSED`/`GATE 4 FAILED`, `PRE-FLIGHT FAILED`, `PACKAGE READY`) with the `n2b >` prefix and exactly 40 `━` characters
- No human interaction required at any point after the entry gate — fully autonomous, zero pauses

</success_criteria>
