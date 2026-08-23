<purpose>

Console-only status report. Reads tracking files (PIPELINE.md, STATE.md, MANIFEST.md, active STAGE.md), runs an integrity scan comparing tracking state against disk artifacts — covering Stages 1–4 and Stage 5 exports — auto-repairs detectable drift with user confirmation, and renders a console report with copy-pasteable next-action routing.

No status report file is ever written. The Write tool is only used during confirmed drift repair (Step 6). All output is rendered directly in the conversation.

</purpose>

<required_reading>

Before starting, read these files:

- `.n2b/tracking/PIPELINE.md` — primary source for pipeline state (frontmatter: pipeline_status, active_stage, last_completed_stage, project_name; body: stage checklist lines and the `## Export History` table)
- `.n2b/tracking/STATE.md` — current step and stage status (frontmatter: current_step, stage_status; body: Current Position section)
- `.n2b/tracking/MANIFEST.md` — canonical package manifest (frontmatter: package_version; body: `## Package Inventory` table). May not exist before the first stage completes — handle absence per Step 3.
- Active STAGE.md — path depends on active_stage value from PIPELINE.md (see stage path mapping in Step 2)
- `n2b/references/ui-brand.md` — banner format (exactly 40 `━` characters, `n2b > {BANNER NAME}` prefix)
- `n2b/references/pipeline-gatekeeper.md` — Pipeline Sequence Definition and Next-Stage Lookup table (sequence data for routing only — do NOT execute Check 1, Check 2, or Check 3)

</required_reading>

<!-- Anti-patterns:
     - Do NOT write a STATUS file — this workflow is console-only; no output file is ever written
     - Do NOT use AskUserQuestion — display prompts inline in console output and read response via conversation
     - Do NOT derive pipeline position from artifacts alone — PIPELINE.md is the primary source of truth
     - Do NOT hardcode an artifact inventory anywhere — the package inventory always renders from MANIFEST.md
     - Do NOT write MANIFEST.md or Export History rows — MANIFEST.md is written only by the stage-complete transition, and Export History rows are written only by the export-complete transition and the gatekeeper re-run confirm; this workflow is a reader of both
     - Do NOT treat a stale export as an integrity failure — staleness is a normal lifecycle state, reported in the Exports section with a re-export route
     - Do NOT invent export target names — targets come from Export History rows and `.n2b/exports/` directories; the target registry lives in the Stage 5 export workflow -->

<process>

## Step 1 — Existence Check

Check if `.n2b/tracking/PIPELINE.md` exists:

```bash
[ -f .n2b/tracking/PIPELINE.md ] && echo "HAS_PIPELINE" || echo "NO_PIPELINE"
```

**If NO_PIPELINE:** Display the status banner and exit. Do not write any file.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No project initialized. Run `/n2b:s1-init` to begin.
```

The workflow ends here. Do not proceed to Step 2.

**If HAS_PIPELINE:** Continue silently to Step 2.

---

## Step 2 — Read Tracking State

Read PIPELINE.md frontmatter fields using bash:

```bash
grep "^pipeline_status:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^pipeline_status: *//'
grep "^active_stage:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^active_stage: *//'
grep "^last_completed_stage:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^last_completed_stage: *//'
grep "^last_gate_result:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^last_gate_result: *//'
grep "^project_name:" .n2b/tracking/PIPELINE.md | head -1 | sed 's/^project_name: *//'
```

Record: `pipeline_status`, `active_stage`, `last_completed_stage`, `last_gate_result`, `project_name`.

`pipeline_status` is one of `running | paused | blueprint-complete | failed` (the canonical enum — see the pipeline.md template comment). Every value is handled by the routing table in Step 7.

Read PIPELINE.md body — extract the stage checklist lines (all lines starting with `- [ ]` or `- [x]`). These include any `← ACTIVE` or `← NEXT` markers already embedded. Copy them verbatim for display in Step 8.

Count complete stages: count the number of `- [x]` occurrences **among the Stage 1–4 checklist lines only**. This is the `stages_complete` value for the progress bar (0–4). The Stage 5: Export checklist row is NOT counted toward the progress bar — record its checked state separately as `stage5_row_checked` (it is ticked by the first-ever completed export and feeds the Exports section, not the bar).

Read the `## Export History` table from the PIPELINE.md body. Record every data row as `export_rows`: `#`, `Target`, `Package version`, `Artifacts`, `Completed at`, `Status` (`current | stale`). Zero rows is normal (no exports yet).

Read STATE.md frontmatter:

```bash
grep "^current_step:" .n2b/tracking/STATE.md | head -1 | sed 's/^current_step: *//'
grep "^stage_status:" .n2b/tracking/STATE.md | head -1 | sed 's/^stage_status: *//'
```

Read STATE.md body: extract the `## Current Position` section content. This is used verbatim in the display.

Read MANIFEST.md frontmatter and inventory:

```bash
PKG_VERSION=$(awk '/^---/{n++; next} n==1 && /^package_version:/{print $2; exit} n==2{exit}' .n2b/tracking/MANIFEST.md 2>/dev/null)
[ -z "$PKG_VERSION" ] && PKG_VERSION="none"
echo "PKG_VERSION=$PKG_VERSION"
```

If MANIFEST.md exists, read its `## Package Inventory` table body: record every data row as `manifest_rows` (`Artifact`, `Stage`, `ID coverage`, `Fingerprint`, `Updated`). If MANIFEST.md does not exist, record `manifest_rows` as empty and `PKG_VERSION` as `none` — Step 3 decides whether that is a finding.

**If `active_stage > 0`:** Read the active STAGE.md using this path mapping (the Stage Registry in `n2b/references/pipeline-gatekeeper.md` is the canonical source):

- active_stage = 1 → `.n2b/tracking/stages/s1-init/STAGE.md`
- active_stage = 2 → `.n2b/tracking/stages/s2-define/STAGE.md`
- active_stage = 3 → `.n2b/tracking/stages/s3-specify/STAGE.md`
- active_stage = 4 → `.n2b/tracking/stages/s4-architect/STAGE.md`
- active_stage = 5 → `.n2b/tracking/stages/s5-export/STAGE.md`

From the active STAGE.md, extract `status` from frontmatter and any progress detail from the body (step checkboxes, counters) for display in Current Position.

---

## Step 3 — Disk Artifact Scan

Derive expected state from artifacts on disk. For each stage, determine if artifacts indicate completion:

**Stage 1:**

```bash
[ -f .n2b/BRIEF.md ] && \
  grep -q "^project_name:" .n2b/BRIEF.md && \
  grep -q "^domain:" .n2b/BRIEF.md && \
  grep -q "^created:" .n2b/BRIEF.md && \
  grep -q "^status:" .n2b/BRIEF.md && \
  grep -q "^n2b_version:" .n2b/BRIEF.md && \
  echo "STAGE_1_DERIVED=complete" || echo "STAGE_1_DERIVED=incomplete"
```

Stage 1 derived: `complete` if `.n2b/BRIEF.md` exists AND has all 5 frontmatter fields (project_name, domain, created, status, n2b_version). Otherwise: `incomplete`.

**Stage 2:**

```bash
FEAT_COUNT=$(ls .n2b/features/*.md 2>/dev/null | wc -l | tr -d ' ')
FEAT_FINAL=$(grep -l "^status: final" .n2b/features/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$FEAT_COUNT" -gt 0 ] && [ "$FEAT_COUNT" -eq "$FEAT_FINAL" ] && echo "STAGE_2_DERIVED=complete" || echo "STAGE_2_DERIVED=incomplete"
echo "FEAT_COUNT=$FEAT_COUNT FEAT_FINAL=$FEAT_FINAL"
```

Stage 2 derived: `complete` if `.n2b/features/*.md` files all exist AND each has `status: final` in frontmatter (both counts match and are > 0). Otherwise: `incomplete`.

**Stage 3:**

```bash
FEAT_DIRS=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
[ -d .n2b/specifications ] && [ "$FEAT_DIRS" -gt 0 ] && [ -f .n2b/specifications/reconciliation-log.md ] && echo "STAGE_3_DERIVED=complete" || echo "STAGE_3_DERIVED=incomplete"
echo "FEAT_DIRS=$FEAT_DIRS"
```

Stage 3 derived: `complete` if `.n2b/specifications/` exists AND has at least one `FEAT-*/` subdirectory AND `reconciliation-log.md` exists. Otherwise: `incomplete`.

**Stage 4:**

```bash
S4_ARCH=false; S4_SCHEMA=false; S4_PROFILE=false
[ -f .n2b/architecture/technical-architecture.md ] && grep -q "^status: final" .n2b/architecture/technical-architecture.md && S4_ARCH=true
[ -f .n2b/architecture/database-schema.md ] && grep -q "^status: final" .n2b/architecture/database-schema.md && S4_SCHEMA=true
[ -f .n2b/architecture/technical-profile.md ] && grep -q "^status: final" .n2b/architecture/technical-profile.md && S4_PROFILE=true
[ "$S4_ARCH" = true ] && [ "$S4_SCHEMA" = true ] && [ "$S4_PROFILE" = true ] && echo "STAGE_4_DERIVED=complete" || echo "STAGE_4_DERIVED=incomplete"
```

Stage 4 derived: `complete` if all three architecture files exist with `status: final` (technical-architecture.md, database-schema.md, technical-profile.md). Otherwise: `incomplete`.

Record derived state for each stage: `stage_1_derived`, `stage_2_derived`, `stage_3_derived`, `stage_4_derived`.

**Manifest presence check:**

For each Stage N (1–4) whose PIPELINE.md checklist line shows `- [x]`: MANIFEST.md must exist AND its `## Package Inventory` must carry at least one row with `Stage` = N (the stage-complete transition writes those rows). For every completed stage where this fails, record a `manifest_finding`:

- MANIFEST.md missing entirely → `manifest_finding: MANIFEST.md missing while Stage {N} claims completion`
- MANIFEST.md present but no rows for Stage N → `manifest_finding: MANIFEST.md has no inventory rows for completed Stage {N}`

A manifest finding is a **drift-class finding** (tracking behind reality), but it is NOT auto-repairable by this workflow — MANIFEST.md is written only by the stage-complete transition (see Step 6).

**Stage 5 export scan:**

Compare `.n2b/exports/` contents against the Export History rows read in Step 2:

```bash
ls -d .n2b/exports/*/ 2>/dev/null | sed 's|.n2b/exports/||; s|/$||'
```

Record the directory names as `export_dirs` (each is a target name). Then evaluate every target that appears in `export_dirs`, `export_rows`, or both:

| On disk | In Export History | Finding |
|---------|-------------------|---------|
| dir exists | row exists | Compare versions (staleness check below) |
| dir exists | no row | `export_finding: export directory .n2b/exports/{target}/ exists but no Export History row records it` (drift-class — the export-complete transition did not record the run) |
| no dir | row exists | `export_finding: Export History row #{n} ({target}) recorded but .n2b/exports/{target}/ is missing from disk` (corruption-class — recorded export missing) |

**Staleness check** (for each target with both a directory and a row): compare the row's `Package version` against `PKG_VERSION` from MANIFEST.md:

- Row `Package version` **<** `PKG_VERSION` → export is **stale**: record `export_stale: {target}` for display as `⚠ STALE (upstream changed since export)` with route `/n2b:s5-export {target}`
- Row `Package version` **==** `PKG_VERSION` → export is **fresh**: record `export_fresh: {target}`
- Row `Package version` **>** `PKG_VERSION`, or `PKG_VERSION` is `none` while rows exist → record an `export_finding` (inconsistency — an export cannot postdate the manifest; manual investigation)

Staleness is NOT an integrity failure — it is a normal lifecycle state (upstream stages were legitimately re-run after the export). It is reported in the Exports section, not as drift or corruption.

If a row's `Status` column contradicts the version comparison (column says `current` but versions differ), add an integrity note: the gatekeeper's stale-marking may not have run. The display always follows the version comparison. Do NOT rewrite the row — this workflow never writes Export History.

Record: `export_dirs`, `export_fresh` (list), `export_stale` (list), `export_findings` (list), `manifest_findings` (list).

---

## Step 4 — Integrity Comparison

For each stage (1–4), compare derived state vs claimed state from PIPELINE.md checklist:

Read PIPELINE.md body to determine claimed state per stage:
- `- [x]` on a stage line → claimed: `complete`
- `- [ ]` on a stage line → claimed: `incomplete`

Compare:

| Derived | Claimed | Result |
|---------|---------|--------|
| `complete` | `incomplete` (`- [ ]`) | DRIFT — artifacts exist but tracking not updated |
| `incomplete` | `complete` (`- [x]`) | CORRUPTION — tracking claims completion but artifacts missing |
| Match | Match | CONSISTENT |

Set overall integrity status:
- `consistent` — all 4 stages match AND no manifest findings AND no export findings
- `drift` — at least one stage has derived > claimed (record which stage numbers), OR any manifest finding exists, OR any drift-class export finding exists
- `corruption` — at least one stage has claimed > derived (record which stage numbers), OR any corruption-class export finding exists
- If both drift and corruption exist on different items: report both

Stale exports (`export_stale`) do NOT affect integrity status — they are reported in the Exports section only.

Record: `integrity_status`, `drift_stages` (list), `corruption_stages` (list), plus the `manifest_findings` and `export_findings` carried from Step 3.

---

## Step 5 — STAGE.md Cross-Check

Validate STAGE.md files against PIPELINE.md state.

**Active stage check:** If `active_stage = N` (N > 0):

```bash
# Read status field from active STAGE.md (already read in Step 2)
grep "^status:" .n2b/tracking/stages/s{N}-{slug}/STAGE.md | head -1
```

If the active STAGE.md `status` is not `in-progress`: flag mismatch. Record: `stage_N_status_mismatch=true`.

**Completed stages check:** For each Stage 1–4 where PIPELINE.md shows `- [x]` (complete):

```bash
grep "^status:\|^completed:" .n2b/tracking/stages/s{N}-{slug}/STAGE.md | head -2
```

If STAGE.md does not have both `status: complete` AND a `completed:` timestamp: flag mismatch. Record which stage.

**Not-started stages check:** For Stages 1–4 where PIPELINE.md shows `- [ ]` and `active_stage` is not N:

Check if STAGE.md has `status: not-started`. Flag mismatch if not (but note: newly created stages may not have been modified yet — this is a soft warning only, not a hard flag).

**Stage 5 exception:** the s5-export STAGE.md is a live dashboard, explicitly exempt from the receipt lifecycle (Stage 5 is repeatable; per-target files are the receipts — see `n2b/references/tracking-protocol.md`). Never flag it for lacking `status: complete`, and never apply the completed-stage receipt check to it. The only Stage 5 cross-check: if exports exist (any Export History row or `.n2b/exports/` directory) but `.n2b/tracking/stages/s5-export/STAGE.md` is missing, add a soft cross-check note.

Append any cross-check mismatches to the integrity status as additional notes. Cross-check mismatches do not override the primary integrity status (drift/corruption/consistent) — they supplement it.

---

## Step 6 — Repair or Flag

**If integrity status is `drift`** (Stage 1–4 checklist drift — `drift_stages` non-empty):

Display inline in console:

```
## Integrity
⚠ Drift detected:
  Stage {N} artifacts exist but PIPELINE.md shows incomplete.
  Likely crash during tracking update.

  → Repair? (y/n)
```

Wait for user response in the conversation.

**On "y" (confirmed repair):** Use the Write tool to update both files:

Update PIPELINE.md:
- Frontmatter: set `last_completed_stage: N` (highest drifted stage), set `last_updated: {current ISO timestamp}`
- Frontmatter: if `active_stage` pointed at a repaired stage, set `active_stage: 0`
- Frontmatter: set `pipeline_status` to what the stage-complete transition would have set (see `n2b/references/tracking-protocol.md`): `blueprint-complete` if the highest repaired stage is 4 and Stages 1–4 are now all complete; otherwise `paused`. Only change `pipeline_status` when no other stage remains genuinely in progress.
- Body: change `- [ ] Stage N:` to `- [x] Stage N:` for each drifted stage, remove any `← ACTIVE` marker from those lines
- `## Stage History` section: add entry for the repaired stage:
  ```markdown
  ### Stage N: {Stage Name}
  - Completed: {current ISO timestamp} (approximate — repaired by status scan)
  - Gate: repaired — artifacts present, tracking updated by /n2b:status
  ```

Update the STAGE.md for each drifted stage (use path mapping from Step 2):
- Frontmatter: set `status: complete`, set `completed: {current ISO timestamp}`
- Body: add entry in `## Deviations` section (create section if missing):
  ```
  - **Tracking repair:** Status repaired by /n2b:status scan on {date} — artifacts were present but PIPELINE.md showed incomplete.
  ```

Repair scope: this repair writes PIPELINE.md and STAGE.md files only. It does NOT create or update MANIFEST.md — if a manifest finding exists for the repaired stage, it remains flagged after repair (see below).

After writing repairs, continue to Step 7.

**On "n" (repair declined):** Continue to Step 7 without writing any file. Note the inconsistency in the integrity section of the display.

**If integrity status is `corruption`:**

Display (no prompt, no Write calls):

```
## Integrity
⚠ Inconsistency:
  PIPELINE.md shows Stage {N} complete but artifacts missing.
  Possible corruption — manual investigation needed.
```

Continue to Step 7.

**If any `manifest_finding` exists** (flag only — never auto-repaired):

Display as additional Integrity lines:

```
⚠ Manifest: {manifest_finding text}.
  MANIFEST.md is written only by the stage-complete transition —
  re-run the most recently completed stage (/n2b:s{N}-{slug}) to
  regenerate it, or investigate manually.
```

This workflow never writes MANIFEST.md.

**If any `export_finding` exists** (flag only — never auto-repaired):

Display as additional Integrity lines, with a route where one exists:

```
⚠ Export: {export_finding text}.
  → /n2b:s5-export {target} re-renders the target and re-records it.
```

This workflow never writes Export History rows or `.n2b/exports/` contents.

**If integrity status is `consistent`:**

(Display is rendered as part of Step 8.)

---

## Step 7 — Route

Determine the next action from this 5-condition routing table (evaluate in order — use the first matching condition). Together with Step 1, it covers every `pipeline_status` value (`running`, `paused`, `blueprint-complete`, `failed`) plus not-initialized:

| Priority | Condition | Check | Next Action Display |
|----------|-----------|-------|---------------------|
| 1 | No PIPELINE.md | File does not exist | (handled in Step 1) |
| 2 | Pipeline failed | `pipeline_status: failed` | Show `last_gate_result` failure reason + "`/n2b:s{N}-{slug}` to re-run" where N = `active_stage` (or last_completed_stage + 1 if active_stage = 0) |
| 3 | Stage running | `pipeline_status: running`, or `active_stage > 0` AND `stage_status: in-progress` | "Stage {N} is in progress — {stage_description}." + "If resuming: `/n2b:s{N}-{slug}`" — **except Stage 3** (batched): when `active_stage = 3`, route "Continue: `/n2b:s3-specify --continue`" instead (covers both a batch checkpoint — STATE.md `current_step: checkpoint` — and an interrupted run; the Current Position line already shows checkpoint progress when one fired) |
| 4 | Blueprint complete | `pipeline_status: blueprint-complete` (fallback: `active_stage = 0` AND all four Stage 1–4 checklist lines show `- [x]`) | Blueprint-complete block (Step 8): "**{project_name}** blueprint is complete — handoff package ready." + manifest-driven package inventory + Exports section. For each stale export: `/n2b:s5-export {target}`. For a new target: `/n2b:s5-export <target>` |
| 5 | Between stages | `pipeline_status: paused` AND `last_completed_stage < 4` | "**Stage {N+1}: {Name}** — {description}" + "`/n2b:s{N+1}-{slug}`" where N = `last_completed_stage` |

For stage names, descriptions, commands, and slugs: consult the Stage Registry and Next-Stage Lookup table in `n2b/references/pipeline-gatekeeper.md` — that is the canonical source. Do not hardcode stage data here.

For between-stages routing (condition 5), use `last_completed_stage + 1` to identify the next stage. If `last_completed_stage` is null or 0, next stage is 1. The gatekeeper's Next-Stage Lookup table maps each `LAST_COMPLETED` value to the correct next command.

Condition 4 notes:
- `blueprint-complete` is terminal — never route to a Stage 1–4 command from it, and never present export as required. The blueprint is the finished deliverable; `/n2b:s5-export` is an offer (render the package for an external consumer — a dev team brief, an AI build tool, a project tracker).
- Export target names in routing come only from Export History rows and `.n2b/exports/` directories. For targets not yet exported, show the generic form `/n2b:s5-export <target>` — the available-target registry lives in the Stage 5 export workflow, not here.
- Stage 5 is repeatable: re-export routes are always legal, whether the prior export is fresh or stale.

Record the routing result as `next_action_display` for use in Step 8.

---

## Step 8 — Display

Render the full console report. Do NOT write any file.

**Progress bar fixed mapping** — the bar spans **Stages 1–4 only** (the blueprint pipeline). Exports are never a progress segment; they get their own report section. Use `█` for complete, `░` for incomplete, 8 characters total (2 per stage):

```
0 of 4: ░░░░░░░░   0%
1 of 4: ██░░░░░░  25%
2 of 4: ████░░░░  50%
3 of 4: ██████░░  75%
4 of 4: ████████ 100%
```

**Standard report format** (for stage-running, between-stages, and pipeline-failed cases):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {project_name}

Progress: {progress_bar} {percent}%  ({stages_complete} of 4 stages)

{stage checklist copied verbatim from PIPELINE.md body — all lines with - [ ] / - [x] and any ← ACTIVE / ← NEXT markers. The Stage 5: Export line displays as part of the verbatim checklist but never counts toward the progress bar.}

## Current Position
{For running stage: content from STATE.md Current Position section + active STAGE.md step detail}
{For between stages: "Between stages — awaiting next command."}
{For pipeline failed: "Pipeline failed — see Next Action below."}

## Integrity
{From Step 6:
  If consistent: ✓ Tracking consistent
  If drift and user said "n": ⚠ Drift noted — Stage {N} artifacts present but PIPELINE.md not updated. Run /n2b:status again to repair.
  If drift and repaired: ✓ Drift repaired — tracking updated for Stage {N}
  If corruption: ⚠ Inconsistency: PIPELINE.md shows Stage {N} complete but artifacts missing. Possible corruption — manual investigation needed.
  Include any manifest findings and export findings (Step 6 blocks)
  Include any STAGE.md cross-check mismatches as additional lines}

{## Exports — render this section in the standard report ONLY if at least one Export History row or .n2b/exports/ directory exists (e.g., an upstream stage was re-run after exports were made). Same line format as the blueprint-complete Exports section below.}

---

## ▶ Next Action

{from Step 7 routing result}

*(`/clear` first → fresh context window)*

---
```

**Blueprint-complete format** (routing condition 4):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {project_name}

Progress: ████████ 100%  (4 of 4 stages)

{stage checklist verbatim from PIPELINE.md body}

## Integrity
{from Step 6}

---

## Blueprint Complete

**{project_name}** blueprint is complete — handoff package ready.

Package inventory (from MANIFEST.md — package v{PKG_VERSION}):

{One line per MANIFEST.md Package Inventory row, in stage order:}
- `.n2b/{Artifact}` — Stage {Stage}{ · IDs: {ID coverage}   ← omit the IDs part when the row's ID coverage is —}

{If MANIFEST.md is missing or has no rows: render exactly one line —
⚠ MANIFEST.md missing — package inventory unavailable (see Integrity).
Never substitute a hardcoded artifact list.}

## Exports

{If no Export History rows and no export directories:
No exports yet. The package can be handed off as-is, or rendered for a specific consumer:}

{Per Export History row, in row order:
  fresh → ✓ {target} — fresh (package v{Package version}, completed {Completed at})
  stale → ⚠ {target} — STALE (upstream changed since export) → /n2b:s5-export {target}}

○ Export to a target: /n2b:s5-export <target>
  (available targets are listed by the export workflow)

---
```

The package inventory ALWAYS renders from MANIFEST.md rows — there is no fallback list. The Exports section always closes with the generic `/n2b:s5-export <target>` offer; export is optional and repeatable, never a required next step.

</process>

<success_criteria>

- No status report file is ever written — all output is rendered in the conversation
- PIPELINE.md is read as the primary source for pipeline state (not artifact scanning alone); MANIFEST.md is the sole source for the package inventory — no hardcoded artifact lists anywhere
- STATE.md and active STAGE.md are read for current position detail
- Integrity scan runs: derive from artifacts → compare to PIPELINE.md → flag drift/corruption → cross-check STAGE.md — and covers Stages 1–4 AND Stage 5 exports (`.n2b/exports/` vs Export History rows), including the manifest presence check (MANIFEST.md absent while stages claim completion = drift finding)
- Drift offers confirmed auto-repair with user prompt before writing anything; corruption flags without repair; manifest and export findings are flagged with routes but never auto-repaired (this workflow never writes MANIFEST.md or Export History rows)
- Export staleness: any Export History row whose Package version < MANIFEST package_version reports `⚠ STALE (upstream changed since export)` and routes to `/n2b:s5-export {target}`; matching version reports fresh; staleness never counts as an integrity failure
- Console report displays: progress bar (8-char `█`/`░` spanning Stages 1–4 only), checkbox stage list (verbatim from PIPELINE.md), current position, integrity status, Exports section (own section — never a progress segment), and next action
- All 5 routing conditions are handled, covering every `pipeline_status` enum value plus not-initialized: no PIPELINE.md → s1-init, `failed` → re-run command, `running` → resume command, `blueprint-complete` → handoff-package block with manifest inventory + export offers, `paused` → next stage command
- Progress bar uses fixed mapping (0→0%, 1→25%, 2→50%, 3→75%, 4→100%)
- Banner uses exactly 40 `━` characters with `n2b > STATUS` (per ui-brand.md §Banner Format)

</success_criteria>
