# n2b Pipeline Gatekeeper

<!-- Workflows that @-include this file:
     - n2b/workflows/stage-1/init.md       (Step 0 entry gate)
     - n2b/workflows/stage-2/define.md     (Step 0 entry gate)
     - n2b/workflows/stage-3/specify.md    (Step 0 entry gate)
     - n2b/workflows/stage-4/architect.md  (Step 0 entry gate)
     - n2b/workflows/stage-5/export.md     (Step 0 entry gate)
     - n2b/workflows/status.md             (sequence definitions for routing only — does NOT execute Check 1–3) -->

This is a shared read-only reference. It defines pipeline entry validation rules, stage sequence definitions, error formats, and the re-run guard. It is not an agent or a workflow — it contains no executable code. Consumers (all 5 stage workflows and the status workflow) @-include it and execute its instructions inline.

The gatekeeper is a **state machine, not a file inspector.** It reads tracking fields (PIPELINE.md, STAGE.md) to determine pipeline position and enforce sequence rules. It does not check artifact files on disk. That responsibility belongs to exit gates (post-condition validation within each stage workflow) and Layer 2 (agent fresh reads).

---

## Responsibility Split

| Concern | Owner |
|---------|-------|
| Define sequence rules, tracking-field checks, error formats | **Gatekeeper reference** |
| Execute the checks (bash), prompt user on soft blocks, write/delete files on re-run | **Workflow** |
| Routing display ("run X next") in status reports | **Status workflow** (reads gatekeeper's sequence definition) |
| Exit gate (post-condition validation — file existence + content checks) | **Per-stage workflow** (unchanged) |
| Artifact file-existence checks for integrity reporting | **Status workflow** (owns its own file lists for drift detection) |

The gatekeeper defines validation rules that workflows execute — the same relationship as `tracking-protocol.md` defining transition rules that workflows execute.

---

## Pipeline Sequence Definition

This is the canonical sequence. All consumers (stage workflows, status workflow) reference this single definition.

### Canonical Sequence

```
Stage 1 (init) -> Stage 2 (define) -> Stage 3 (specify) -> Stage 4 (architect) -> Stage 5 (export — optional, repeatable)
```

Stages 1–4 are the blueprint pipeline: they run in strict sequence and end at Stage 4. Completing Stage 4 completes the pipeline — `pipeline_status` becomes `blueprint-complete` and the deliverable exists. Stage 5 (export) is a post-completion operation: optional, repeatable, and never required to finish the pipeline. It renders the completed package for a consumer; it does not extend the sequence and it never changes `pipeline_status`.

### Stage Registry

| Stage | Slug | Command | Output Directory | STAGE.md Path |
|-------|------|---------|-----------------|---------------|
| 1 | `s1-init` | `/n2b:s1-init` | `.n2b/` (BRIEF.md) | `.n2b/tracking/stages/s1-init/STAGE.md` |
| 2 | `s2-define` | `/n2b:s2-define` | `.n2b/features/` | `.n2b/tracking/stages/s2-define/STAGE.md` |
| 3 | `s3-specify` | `/n2b:s3-specify` | `.n2b/specifications/` | `.n2b/tracking/stages/s3-specify/STAGE.md` |
| 4 | `s4-architect` | `/n2b:s4-architect` | `.n2b/architecture/` | `.n2b/tracking/stages/s4-architect/STAGE.md` |
| 5 | `s5-export` | `/n2b:s5-export` | `.n2b/exports/` | `.n2b/tracking/stages/s5-export/STAGE.md` |

Stage 5's STAGE.md is a live dashboard, not a permanent receipt: the `s5-export/` directory also holds one tracking file per export target, and those per-target files are the receipts. See `tracking-protocol.md` (`export-complete`, `stage-resume-s5`).

### Next-Stage Lookup

Used by both the gatekeeper (to route on error) and the status workflow (to show next action).

| `LAST_COMPLETED` | Next Valid Stage | Next Command |
|------------------|-----------------|--------------|
| `0` (none) | 1 | `/n2b:s1-init` |
| `1` | 2 | `/n2b:s2-define` |
| `2` | 3 | `/n2b:s3-specify` |
| `3` | 4 | `/n2b:s4-architect` |
| `4` | 5 (optional) | `/n2b:s5-export` — blueprint complete; export is an offer, not a requirement |
| `5` | 5 (repeatable) | `/n2b:s5-export` — add another target or refresh an existing one, any time |

There is no "pipeline finished — halt" row. Once `LAST_COMPLETED` reaches 4 the blueprint is done and the lookup always resolves to the export offer. Re-export is always legal.

---

## Check 1 — Pipeline Exists

```bash
[ -f .n2b/tracking/PIPELINE.md ]
```

**If NO:**
- Requested stage is 1 → proceed (S1 creates the pipeline)
- Requested stage is 2–5 → **HALT (E9)**

**If YES:**
- Continue to Check 2

---

## Check 2 — Sequence & Status

Read tracking fields from PIPELINE.md:

```bash
ACTIVE=$(awk '/^---/{n++; next} n==1 && /^active_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
PIPELINE_STATUS=$(awk '/^---/{n++; next} n==1 && /^pipeline_status:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
LAST_COMPLETED=$(awk '/^---/{n++; next} n==1 && /^last_completed_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
[ "$LAST_COMPLETED" = "null" ] && LAST_COMPLETED=0
```

Three fields from PIPELINE.md only. No STAGE.md reads needed — the `stage-complete` transition's load-bearing ordering (STAGE.md finalized BEFORE PIPELINE.md updated) guarantees that if `last_completed_stage: N` is set, the upstream STAGE.md is already `complete`. The `export-complete` transition preserves the same guarantee for `last_completed_stage: 5` (per-target receipt and dashboard finalized before PIPELINE.md records the export).

`pipeline_status` takes exactly four values:

| Value | Meaning |
|-------|---------|
| `running` | A stage workflow is executing |
| `paused` | Between stages — more of Stages 1–4 remains |
| `blueprint-complete` | Stage 4's `stage-complete` fired; the deliverable exists. Terminal — exports never change it |
| `failed` | Gate failure halt |

**Decision tree:**

```
PIPELINE_STATUS == "blueprint-complete"?
├─ YES → The blueprint is done. No export ever changes this state; only a
│        user-confirmed upstream re-run (Check 3) re-opens the pipeline.
│   ├─ Requested stage == 5 → PASS — always.
│   │     Export is repeatable and blueprint-complete is its home state.
│   │     A Stage 5 request is NEVER halted here — E10 does not apply to
│   │     /n2b:s5-export. Per-target refresh/overwrite prompts are owned by
│   │     the export workflow, not the gatekeeper.
│   │
│   ├─ Requested stage 1–4 → Re-run of a completed stage → proceed to Check 3
│   │     (completed exports are marked stale on confirmation — never a block)
│   │
│   └─ No specific stage requested (informational/routing entry) → HALT (E10)
│         "Blueprint complete — handoff package ready."
│         "Optional: /n2b:s5-export — render the package for a consumer."
│
└─ NO → continue

PIPELINE_STATUS == "failed"?
├─ YES
│   ├─ Requested == LAST_COMPLETED + 1 → re-run of the failed stage → PASS
│   │   (stage-start clears the failure by setting pipeline_status: running)
│   └─ Requested != LAST_COMPLETED + 1 → HALT (E4)
│       "Stage {LAST_COMPLETED + 1} gate failed. Re-run: /n2b:s{LAST_COMPLETED + 1}-{slug}"
│
└─ NO → continue

PIPELINE_STATUS == "running" (ACTIVE > 0)?
├─ YES: A stage is currently active. ACTIVE is always 1–4 — the export stage
│        never sets active_stage.
│   ├─ Requested stage == ACTIVE → Resume scenario → proceed to Check 3
│   └─ Requested stage != ACTIVE → HALT (E5)
│       "Stage {ACTIVE} is in progress. Resume it or run /n2b:status"
│
└─ NO → PIPELINE_STATUS == "paused" (ACTIVE == 0): between stages — more of
         Stages 1–4 remains (Stage 4 completion sets blueprint-complete,
         which is handled above)
    ├─ Requested == LAST_COMPLETED + 1 → Fresh run → PASS
    ├─ Requested <= LAST_COMPLETED → Re-run → proceed to Check 3
    └─ Requested > LAST_COMPLETED + 1 → HALT (E3)
        "Stage {requested} cannot run — Stage {LAST_COMPLETED + 1} has not completed."
        "Next: /n2b:s{LAST_COMPLETED + 1}-{slug}"
        (A Stage 5 request lands here whenever LAST_COMPLETED < 4: the export
         renders the completed blueprint, so Stage 4 must finish first.)
```

Every branch above terminates in PASS, Check 3, or a named error. If `pipeline_status` holds any value outside the four-value table, tracking is corrupted: HALT and route to `/n2b:status` — the integrity scan owns detection and repair.

---

## Check 3 — Re-run Guard

Only runs when requested stage <= `LAST_COMPLETED` (re-run scenario — in `blueprint-complete`, every Stage 1–4 request is a re-run, since `last_completed_stage` is at least 4) or when a resume scenario is detected in Check 2.

Stage 5 never reaches Check 3 in normal operation: Check 2 passes a Stage 5 request in `blueprint-complete` directly, and per-target refresh/overwrite prompts are handled inside the export workflow.

Read the target stage's tracker status:

```bash
TARGET_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' {target STAGE.md path})
```

Note: If the target STAGE.md does not exist, use the `2>/dev/null || echo "not-started"` fallback — a missing STAGE.md is treated as `not-started`, which passes as a fresh run. This also handles the export dashboard transparently when no export has ever run.

**If `TARGET_STATUS` is `not-started`:** Fresh run (was reset). Skip re-run guard → **PASS**.

**If `TARGET_STATUS` is `in-progress`:**
- Requested stage == ACTIVE → resume scenario → **PASS**
- Stages 1, 2, 4 → treat as fresh run (these stages do not support partial resume; workflow will restart) → **PASS**
- Stage 3 → **PASS** (S3 workflow handles resume internally via per-feature classification)
- Stage 5 → **PASS** (the export workflow resumes per target from its deliverables — see `stage-resume-s5` in `tracking-protocol.md`; a Stage 5 request normally arrives via Check 2's blueprint-complete branch, not here)

Note: STAGE.md never has `status: failed` — the `gate-fail` transition in tracking-protocol.md leaves it at `in-progress`. The pipeline-level failure is recorded in PIPELINE.md `pipeline_status: failed`, which is caught by Check 2.

**If `TARGET_STATUS` is `complete`:** Re-run of a completed stage. Two checks run in order:

**(a) Downstream hard-block check — covers later stages among Stages 2–4 only:**

```bash
for DOWNSTREAM in {downstream STAGE.md paths from the Per-Stage Downstream Check List}; do
    DS_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$DOWNSTREAM" 2>/dev/null || echo "not-started")
    if [ "$DS_STATUS" != "not-started" ]; then
        # HARD BLOCK (E8) — downstream blueprint work exists
    fi
done
```

The `2>/dev/null || echo "not-started"` fallback means a missing downstream STAGE.md file is treated as `not-started` — no downstream work exists yet.

**(b) Export staleness check — never a block:**

```bash
EXPORT_COUNT=$(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md)
```

Completed exports are downstream *consumers* of the blueprint, not downstream *work on* the blueprint. They never trigger E8 and are never deleted by an upstream re-run. Instead, when `EXPORT_COUNT > 0`, the soft-block prompt warns that all export rows will be marked **stale** on confirmation. An interrupted (in-progress) export run does not block an upstream re-run either — its next invocation re-resolves against the refreshed package.

**Hard block** — any downstream stage among Stages 2–4 is not `not-started`:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > BLOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stage {N} cannot be re-run — downstream stages have started.

{pipeline checklist from PIPELINE.md}

Resolve downstream stages first.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

E8 is a Stages 1–4 rule: it fires only for blueprint work (Stages 2–4) sitting downstream of the requested stage. Completed exports never produce E8.

**Soft block** — all downstream stages among Stages 2–4 are `not-started`:

For Stages 1, 2, 4:
```
Stage {N} is already complete (finished {completed timestamp}).

Re-running will:
- Delete all Stage {N} output from {output directory}
- Reset Stage {N} tracking to not-started
- Mark {EXPORT_COUNT} completed export(s) STALE — exports are never deleted;
  refresh them with /n2b:s5-export once the blueprint is complete again

Are you sure? (yes/no)
```

(Include the third bullet only when `EXPORT_COUNT > 0`.)

- User confirms → workflow deletes outputs (per cleanup table), resets tracker, and — when exports exist — marks every `## Export History` row's Status `stale` and mirrors the stale marking on the affected target rows in the s5-export dashboard → **PASS**
- User declines → HALT

For Stage 3:
```
Stage 3 is already complete (finished {completed timestamp}).

Re-run modes:
  [1] Resume — skip completed features, re-run incomplete (recommended)
  [2] Clean restart — delete ALL Stage 3 output and start fresh
```

When `EXPORT_COUNT > 0`, append to the prompt: `Either mode marks {EXPORT_COUNT} completed export(s) STALE — exports are never deleted.`

```
Which mode? (1/2)
```
- Mode 1 → workflow follows `stage-resume` transition (marks exports stale first, when any exist) → **PASS**
- Mode 2 → workflow deletes all specs + per-feature trackers, resets STAGE.md (marks exports stale first, when any exist) → **PASS**

---

## Per-Stage Downstream Check List

Which STAGE.md files to check for the re-run guard (hard block decision), and how exports are handled (always stale-warning, never a block).

| Stage being re-run | Hard-block check (blueprint stages) | Export handling |
|--------------------|-------------------------------------|-----------------|
| 1 | s2, s3, s4 | s5-export exports → stale warning (not a block) |
| 2 | s3, s4 | s5-export exports → stale warning (not a block) |
| 3 | s4 | s5-export exports → stale warning (not a block) |
| 4 | none | s5-export exports → stale warning (not a block) |
| 5 | None (repeatable stage — per-target soft block handled inside the export workflow) | — |

---

## Per-Stage Re-run Cleanup

What the workflow deletes (after user confirms soft block) before re-running a stage.

| Stage | Delete | Reset Tracker | Reset PIPELINE.md |
|-------|--------|---------------|-------------------|
| 1 | `.n2b/BRIEF.md`, `.n2b/config.json` | `s1-init/STAGE.md` → `status: not-started` | `last_completed_stage` → `null` |
| 2 | `.n2b/features/*`, `.n2b/features/drafts/*` (keep directories) | `s2-define/STAGE.md` → `status: not-started` | `last_completed_stage` → `1` |
| 3 (clean restart) | `.n2b/specifications/*`, all `FEAT-NN-{slug}.md` in `s3-specify/` | `s3-specify/STAGE.md` → `status: not-started`, reset all counters | `last_completed_stage` → `2` |
| 3 (resume) | Wipe only incomplete feature folders (per `stage-resume` transition) | `s3-specify/STAGE.md` → increment `resumed` | No change (stage not restarting) |
| 4 | `.n2b/architecture/*` | `s4-architect/STAGE.md` → `status: not-started` | `last_completed_stage` → `3` |
| 5 (per-target refresh) | `.n2b/exports/{target}/` for the target being refreshed ONLY — never other targets' directories, never their receipts, never Export History rows | That target's tracking file in `s5-export/` → `status: not-started` | No change (`pipeline_status` stays `blueprint-complete`; `last_completed_stage` stays `5`) |

On re-run of Stages 1–4, `last_completed_stage` must be reset to `N - 1` (or `null` for Stage 1) during cleanup, before `stage-start` fires. Without this, PIPELINE.md would claim the stage is both the last completed and currently active — a contradictory state visible to `/n2b:status`.

Re-running Stages 1–4 never deletes anything under `.n2b/exports/`. Completed exports are marked stale instead (Check 3). The `## Export History` table is an append-only audit trail of what was handed to whom: rows are flipped to `stale`, never removed.

---

## Error Message Format

All gatekeeper errors use the branded banner format (consistent with `ui-brand.md`):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > {ERROR TYPE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{Specific message — what's wrong}

{Recovery — what to do next}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Banner lines use exactly 40 `━` characters. The `n2b >` prefix is mandatory. See `ui-brand.md` §Banner Format for the canonical definition.

| Error | Banner Text | Recovery |
|-------|------------|----------|
| E3 — Wrong sequence | `SEQUENCE ERROR` | `/n2b:s{next-valid}-{slug}` |
| E4 — Stage failed | `STAGE FAILED` | `/n2b:s{failed-stage}-{slug}` to re-run |
| E5 — Stage interrupted | `STAGE IN PROGRESS` | Resume `/n2b:s{active}-{slug}` or `/n2b:status` |
| E8 — Downstream contamination (Stages 1–4 only) | `BLOCKED` | Resolve downstream blueprint stages first — completed exports never trigger E8 |
| E9 — No pipeline | `NOT INITIALIZED` | `/n2b:s1-init` |
| E10 — Blueprint complete (informational) | `PACKAGE READY` | Optional: `/n2b:s5-export` — or re-run a stage to revise the blueprint |

E10 is informational routing, not a failure: it announces that the blueprint pipeline has finished and the handoff package exists. It fires only on informational/routing entry when no specific stage is requested. It can never fire for `/n2b:s5-export` — Check 2 passes a Stage 5 request in `blueprint-complete` unconditionally, so E10 never blocks an export or a re-export. E8 keeps its hard-block meaning between Stages 1–4 only.

Note: E1 (files missing) and E6 (tracking drift) are not gatekeeper errors. E1 is validated by exit gates and Layer 2 agent fresh reads. E6 (drift detection) is owned by `/n2b:status` integrity scan.

---

## 3-Layer Defense Model

The gatekeeper is the primary entry gate, but it is not the only defense. n2b uses three reinforcing layers.

### Layer 1 — Gatekeeper (entry gate)

The 3-check flow defined in this document. Runs at command entry, before any stage work. Catches sequence violations, pipeline failures, re-run risks. All checks are `awk` reads of YAML frontmatter in tracking files — no artifact scanning, no content parsing.

### Layer 2 — Agent Fresh Reads

Agents always read prerequisite files via file path using the Read tool. Content is **never** passed to agents through spawn prompts. This is a hard architectural rule — not a convenience, but a defense.

If a file is missing or was deleted after the gatekeeper passed, the agent's Read call fails immediately with a clear error. This catches the edge case where the filesystem changes between the gatekeeper check and agent execution — including the rare case of manual file deletion after a stage marked complete.

This rule is already how n2b agents work today. It is stated here as an explicit architectural invariant so it is never changed to "optimize" token usage.

### Layer 3 — Status Integrity Scan

The `/n2b:status` workflow owns artifact-level file checks. It compares files on disk against tracking claims and detects drift (files missing but tracking says complete) or corruption (tracking ahead of actual artifacts). This is a reporting and repair tool, not a gate — the user runs it manually or is routed to it by gatekeeper error messages.

---

## Status Workflow Integration

The status workflow @-includes the gatekeeper reference but uses only the Pipeline Sequence Definition (stage registry and next-stage lookup table). It does NOT execute Check 1, Check 2, or Check 3.

| Status workflow step | Data source |
|---------------------|-------------|
| Routing (next action) | Gatekeeper's next-stage lookup table |
| Artifact scan | Status workflow's own file lists (not in gatekeeper) |
| Integrity comparison | Compares artifact scan against PIPELINE.md tracking fields |

The gatekeeper defines sequence rules. The status workflow defines file lists. No duplication — each owns what it needs.

---

## What the Gatekeeper Does NOT Own

| Concern | Owner | Why |
|---------|-------|-----|
| Exit gate validation (post-condition) | Per-stage workflow | Tightly coupled to stage output — each stage knows what it produces |
| Artifact file-existence checks | Status workflow (for reporting) / Layer 2 (for consumption) | Gatekeeper trusts tracking fields; file checks happen at appropriate layer |
| Tracking file writes (PIPELINE.md, STAGE.md) | Per-stage workflow via `tracking-protocol.md` | Existing system, no change needed |
| Re-run file deletion and tracker reset | Per-stage workflow | Requires Write tool — gatekeeper is read-only instructions |
| Stage 3 resume logic (per-feature classification) | S3 workflow | Stage-specific complexity that does not belong in a shared reference |
| Per-target export refresh/overwrite prompts and fidelity gating | Export workflow | Stage 5 is repeatable — target-level state lives in its own dashboard and per-target trackers, not in PIPELINE.md frontmatter |
| User prompts for soft blocks | Per-stage workflow | Requires AskUserQuestion — gatekeeper defines when to ask, workflow does the asking |
| Status report display | Status workflow | Different purpose (reporting vs gating) |
