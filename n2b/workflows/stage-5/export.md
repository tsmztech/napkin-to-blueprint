<purpose>

This workflow coordinates the export pipeline — Stage 5, the **optional, repeatable** post-completion stage. It renders the completed blueprint package for exactly ONE consumer-shaped export target per invocation, gates the render for fidelity, and receipts it. The blueprint pipeline is already done when this workflow runs (`pipeline_status: blueprint-complete` is its home state, and it never changes).

- **Entry gate + target resolution (Step 0):** Gatekeeper Checks 1–3 for a Stage 5 request (`blueprint-complete` → PASS unconditionally — E10 never fires for `/n2b:s5-export`). Then the target is resolved: a command argument is validated against the export-target registry; a bare invocation opens the registry-driven picker. Per-target routing decides fresh run / overwrite / refresh / resume.
- **Pre-flight (Step 1):** Manifest-driven — Stage 4 tracking `complete` plus existence + non-emptiness of every artifact listed in `.n2b/tracking/MANIFEST.md` `## Package Inventory`. No hardcoded artifact list.
- **Package indexing (Step 2):** Workflow-owned, **no agent**. Every manifest inventory path is re-hashed; drifted rows are refreshed by the workflow, `package_version` is bumped, and a staleness notice is printed. MANIFEST.md is written only by workflows — there is no second manifest file, and no roster file is ever written.
- **Conditional backlog build (Step 2.5):** Spawned only when the resolved target's registry row says `Needs backlog.json: yes`. Inert for `dev-brief` and every other Phase 0 target.
- **Formatter render (Step 3):** The target's formatter agent (from its registry row) is spawned with **paths only** — package root, target template, output directory — plus the scalar package version. It writes every rendered file except `FIDELITY-REPORT.md` and `EXPORT-RECEIPT.md`.
- **Fidelity gate (Step 4):** 4a — bash reconciliation executing the rules in `n2b/references/stage-5/fidelity-rules.md` inline (the same reference-defines / workflow-executes relationship as the gatekeeper), rosters derived fresh by grep at gate time. 4b — the export-fidelity-checker agent samples the render semantically and writes `FIDELITY-REPORT.md`. Failures accumulate `GATE_ERRORS` and re-prompt the formatter, max 3 re-renders, then HALT. A per-target gate failure **never** sets `pipeline_status` — the tracking-protocol `gate-fail` transition is Stages 1–4 only; export failures are recorded in the s5-export dashboard and per-target tracker alone.
- **Receipt + tracking (Step 5):** `EXPORT-RECEIPT.md` written into the target directory from its template, then the `export-complete` transition executed exactly as tracking-protocol.md defines: per-target tracker → dashboard → PIPELINE.md `## Export History` row (+ first-export-only actions) → STATE.md.
- **EXPORT COMPLETE banner (Step 6):** files rendered, fidelity result with reconciled counts, a consumer-native next step, the remaining implemented target keys as one-line commands, and the re-run teaching — one export per run, the package is never consumed.

Targets are plugins: the workflow iterates `n2b/references/stage-5/export-target-registry.md` (columns pinned by C-27); adding a target is one formatter agent + one template + one registry row — nothing in this core changes. Stage 5 never fires `stage-start`, never sets `active_stage`, never touches `pipeline_status`, and mints no new ID prefixes. Workflows own ALL tracking writes; agents write deliverables only; agents receive paths, never content (Layer 2).

</purpose>

<required_reading>

Before starting, read:
- `.claude/n2b/references/ui-brand.md` — banner format (40 `━` characters, `n2b > {BANNER NAME}` prefix), the registered banner names (Stage 5 uses `PRE-FLIGHT`/`PRE-FLIGHT FAILED`, `EXPORT`, `EXPORT COMPLETE` plus the gatekeeper error formats), and status symbols
- `.claude/n2b/references/tracking-protocol.md` — the `export-complete` and `stage-resume-s5` transitions; follow them as checklists. Stage 5's dashboard is a live document for the life of the project (explicitly exempt from the STAGE.md receipt write-lock); the per-target files are the receipts
- `.claude/n2b/references/pipeline-gatekeeper.md` — entry gate (Check 1–3 flow, error formats, stage registry, Per-Stage Re-run Cleanup row 5)
- `.claude/n2b/references/model-profiles.md` — Per-Agent Model Mapping table (rows: **Backlog Builder**, **Export Formatter**, **Export Fidelity Checker**) and resolution logic for the Agent tool's `model` parameter
- `.claude/n2b/references/stage-5/export-target-registry.md` — the plugin table this workflow iterates (Target key · Consumer category · Formatter agent · Template · Output dir · Needs backlog.json · Status) and the two-level picker copy
- `.claude/n2b/references/stage-5/fidelity-rules.md` — the Gate 4a rule set and roster-derivation greps; this workflow executes them inline at Step 4a

Agent contracts are self-loading — the workflow only needs their installed file paths (taken from the registry row). Do not pre-read the agent contracts; pass their paths in the spawning prompts and the agents will load them.

Path convention: registry rows record source-relative paths (`n2b/agents/…`, `n2b/templates/…`); prefix `.claude/` for the installed location before use, unless the cell already carries it. Output directories are runtime paths under `.n2b/exports/` and are used as-is.

</required_reading>

<process>

## Step 0 — Entry Gate & Target Resolution

### Step 0.1 — Argument parse

- `TARGET_ARG` = the first token of the command argument, or empty for a bare invocation. Nothing else is accepted — there is no `all` form and no multi-target form; **each invocation produces exactly one export**.

### Step 0.2 — Gatekeeper Checks (Stage 5)

Read `.claude/n2b/references/pipeline-gatekeeper.md` and execute Check 1, Check 2, and Check 3 for **Stage 5** as defined there.

**Check 1 — Pipeline Exists:**

```bash
[ -f .n2b/tracking/PIPELINE.md ] && echo "EXISTS" || echo "MISSING"
```

- If MISSING: HALT with E9 in the gatekeeper's branded format ("Not initialized. Run /n2b:s1-init").
- If EXISTS: continue to Check 2.

**Check 2 — Sequence & Status:**

```bash
ACTIVE=$(awk '/^---/{n++; next} n==1 && /^active_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
PIPELINE_STATUS=$(awk '/^---/{n++; next} n==1 && /^pipeline_status:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
LAST_COMPLETED=$(awk '/^---/{n++; next} n==1 && /^last_completed_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
[ "$LAST_COMPLETED" = "null" ] && LAST_COMPLETED=0
echo "ACTIVE=$ACTIVE PIPELINE_STATUS=$PIPELINE_STATUS LAST_COMPLETED=$LAST_COMPLETED"
```

Follow the gatekeeper's Check 2 decision tree for a Stage 5 request:

- `PIPELINE_STATUS == "blueprint-complete"` → **PASS — always.** Export is repeatable and `blueprint-complete` is its home state. A Stage 5 request is NEVER halted here — E10 does not apply to `/n2b:s5-export`. Per-target refresh/overwrite prompts are owned by this workflow (Step 0.6), not the gatekeeper.
- `PIPELINE_STATUS == "failed"` → HALT with E4: "Stage {LAST_COMPLETED + 1} gate failed. Re-run: /n2b:s{LAST_COMPLETED + 1}-{slug}" (slug from the gatekeeper's Stage Registry). A Stage 5 request is never the re-run of a failed Stage 1–4.
- `PIPELINE_STATUS == "running"` (`ACTIVE` is 1–4 — the export stage never sets `active_stage`) → HALT with E5: "Stage {ACTIVE} is in progress. Resume it or run /n2b:status".
- `PIPELINE_STATUS == "paused"` → `LAST_COMPLETED` is necessarily < 4 (Stage 4 completion sets `blueprint-complete`, handled above), so a Stage 5 request lands in E3 → HALT:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > SEQUENCE ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stage 5 cannot run — Stage {LAST_COMPLETED + 1} has not completed.
The export renders the completed blueprint, so Stage 4 must finish first.

Next: /n2b:s{LAST_COMPLETED + 1}-{slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Any `pipeline_status` value outside the four-value table → tracking is corrupted: HALT and route to `/n2b:status`.

**Check 3 — Re-run Guard:** Stage 5 never reaches Check 3 in normal operation — Check 2 passes a Stage 5 request in `blueprint-complete` directly, and per-target refresh/overwrite prompts are handled below (Step 0.6). Nothing to execute here.

### Step 0.3 — Registry read + implemented-target set

Read the export-target registry table (columns pinned by C-27: `Target key · Consumer category · Formatter agent · Template · Output dir · Needs backlog.json · Status`):

```bash
REGISTRY=".claude/n2b/references/stage-5/export-target-registry.md"
if [ ! -f "$REGISTRY" ]; then echo "REGISTRY_MISSING"; else
V1_KEYS=$(awk -F'|' '
  /^\|/ && NF >= 9 {
    key=$2; status=$8
    gsub(/[` ]/, "", key); gsub(/[` ]/, "", status)
    if (key != "" && key !~ /^-+$/ && tolower(key) != "targetkey" && tolower(status) == "v1") print key
  }' "$REGISTRY")
V1_COUNT=$(echo "$V1_KEYS" | grep -c .)
echo "V1_KEYS: $V1_KEYS"
echo "V1_COUNT=$V1_COUNT"
fi
```

If `REGISTRY_MISSING` or `V1_COUNT` is 0: HALT with the gatekeeper's branded error format, banner text `EXPORT UNAVAILABLE`, message "No export targets are installed — the export-target registry is missing or lists no implemented (Status: v1) target", recovery "Reinstall n2b (bin/install.js), then run /n2b:s5-export again."

### Step 0.4 — Target resolution

**If `TARGET_ARG` is present:**

- If `TARGET_ARG` appears in `V1_KEYS`: `TARGET=$TARGET_ARG`. Continue to Step 0.5.
- Otherwise HALT with the gatekeeper's branded error format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > UNKNOWN TARGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'{TARGET_ARG}' is not an implemented export target.

Implemented targets:
{one line per key in V1_KEYS: "  /n2b:s5-export {key} — {that row's Consumer category}"}

Or run /n2b:s5-export with no argument for the interactive picker.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If `TARGET_ARG` is empty (bare invocation) — the picker.** First display the entry statement (plain line, not a banner):

```
Each run produces ONE export format. Run /n2b:s5-export again anytime for another — the package is never consumed.
```

The picker is **registry-driven**: all category and variant copy is read from the registry's picker sections (the "You get: […]. Best if […]" copy) — never hardcoded here.

- **While exactly one target is implemented package-wide (`V1_COUNT == 1`)** — collapse to a single confirm (decision 90i). Use AskUserQuestion with header `Export`, question text built from the lone target's registry entry: "Only one export format is implemented right now — **{key}** ({Consumer category}). {its 'You get: … Best if …' copy from the registry}", and exactly two options:
  1. **Proceed with {key}** — render this export now
  2. **Cancel** — no export; the blueprint package is untouched
  On *Proceed*: `TARGET={key}`. On *Cancel*: HALT with a short note ("No export run. The blueprint package is complete and untouched — run /n2b:s5-export anytime.") — zero tracking writes.
- **Otherwise (`V1_COUNT > 1`)** — two-level picker per the registry's picker-copy contract (C-27):
  - **Level 1** — AskUserQuestion, header `Export for`, question "Who will use this export?". Options: only the consumer categories that have ≥1 `Status: v1` variant in the registry, each option carrying that category's registry copy. Never show a category with no implemented variant, and never show "coming soon" entries.
  - **Level 2** — if the chosen category has exactly one implemented variant, select it directly (no second question). If it has more than one, AskUserQuestion again listing the implemented variants only, each with its registry copy. The chosen variant's key becomes `TARGET`.
  - A cancel/none answer at either level: HALT with the same zero-write note as above.

### Step 0.5 — Resolve the target's registry row + tracking init

Extract the resolved target's row fields:

```bash
ROW=$(awk -F'|' -v k="$TARGET" '
  /^\|/ && NF >= 9 {
    key=$2; gsub(/[` ]/, "", key)
    if (key == k) { print; exit }
  }' "$REGISTRY")
FMT_AGENT=$(echo "$ROW" | awk -F'|' '{v=$4; gsub(/[` ]/, "", v); print v}')
TPL_PATH=$(echo "$ROW" | awk -F'|' '{v=$5; gsub(/[` ]/, "", v); print v}')
OUT_DIR=$(echo "$ROW" | awk -F'|' '{v=$6; gsub(/[` ]/, "", v); print v}')
NEEDS_BACKLOG=$(echo "$ROW" | awk -F'|' '{v=$7; gsub(/[` ]/, "", v); print tolower(v)}')
# Installed-location prefix for source-relative agent/template paths
case "$FMT_AGENT" in .claude/*) ;; *) FMT_AGENT=".claude/$FMT_AGENT" ;; esac
case "$TPL_PATH" in .claude/*) ;; *) TPL_PATH=".claude/$TPL_PATH" ;; esac
# Normalize OUT_DIR to end with a single /
OUT_DIR="${OUT_DIR%/}/"
echo "TARGET=$TARGET"
echo "FMT_AGENT=$FMT_AGENT"
echo "TPL_PATH=$TPL_PATH"
echo "OUT_DIR=$OUT_DIR"
echo "NEEDS_BACKLOG=$NEEDS_BACKLOG"
```

If any of `FMT_AGENT`, `TPL_PATH`, `OUT_DIR` came back empty, the registry row is malformed: HALT with the branded `UNKNOWN TARGET` error above (same recovery lines).

**Tracking directory init (first ever export run only):**

```bash
[ -f .n2b/tracking/stages/s5-export/STAGE.md ] && echo "DASHBOARD_EXISTS" || echo "DASHBOARD_MISSING"
```

If `DASHBOARD_MISSING`: `mkdir -p .n2b/tracking/stages/s5-export`, then read the dashboard template at `.claude/n2b/templates/tracking/stage-s5-dashboard.md` and write `.n2b/tracking/stages/s5-export/STAGE.md` using the template as-is (defaults intact — `status: not-started`, zero counters, empty per-target table). This dashboard is a live document for the life of the project — the STAGE.md receipt write-lock never applies to it (tracking-protocol.md, Stage 5 exception).

The per-target tracker `.n2b/tracking/stages/s5-export/{TARGET}.md` is instantiated later (Step 2, run marking) if it does not already exist — no tracking writes happen before routing is decided.

### Step 0.6 — Per-target routing

Read the per-target state (the `2>/dev/null || echo` fallback treats missing files as `not-started`):

```bash
DASH=".n2b/tracking/stages/s5-export/STAGE.md"
DASH_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$DASH" 2>/dev/null || echo "not-started")
TT=".n2b/tracking/stages/s5-export/${TARGET}.md"
T_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$TT" 2>/dev/null || echo "not-started")
RECEIPT="${OUT_DIR}EXPORT-RECEIPT.md"
RECEIPT_PV=$(awk '/^---/{n++; next} n==1 && /^package_version:/{print $2; exit} n==2{exit}' "$RECEIPT" 2>/dev/null || echo "")
CURRENT_PV=$(awk '/^---/{n++; next} n==1 && /^package_version:/{print $2; exit} n==2{exit}' .n2b/tracking/MANIFEST.md 2>/dev/null || echo "")
echo "DASH_STATUS=$DASH_STATUS T_STATUS=$T_STATUS RECEIPT_PV=$RECEIPT_PV CURRENT_PV=$CURRENT_PV"
```

Route in this order — set `RUN_MODE` and continue to Step 1 (every route below runs pre-flight and indexing before any agent is spawned):

**(a) Interrupted run — `DASH_STATUS == "in-progress"` or `T_STATUS == "in-progress"`.** Execute the `stage-resume-s5` transition from tracking-protocol.md for the resolved target: resume is **deliverable-based** — classify from the tracker plus what exists on disk, with **no tracking writes until classification is done**:

| Per-target evidence | Classification | `RUN_MODE` |
|---|---|---|
| Tracker `status: done` (receipt) | Completed — not interrupted | fall through to route (b)/(c) below |
| `EXPORT-RECEIPT.md` missing from `{OUT_DIR}` | Formatting incomplete | `run` — re-run the formatter, then the fidelity gate |
| Receipt present but `{OUT_DIR}FIDELITY-REPORT.md` missing | Gate incomplete | `gate-only` — skip Step 3, run Step 4 onward |
| Receipt AND fidelity report present, tracker still `in-progress` | Interrupted inside Step 5 | `gate-only` — Step 4 re-verifies cheaply, then Step 5 re-executes the receipt + `export-complete` |
| Tracker `status: not-started`, missing, or the field is empty/unreadable | Not started | `run` — fresh |

Per tracking-protocol.md (`stage-resume-s5`): PIPELINE.md and STATE.md frontmatter are no-ops; update only STATE.md body `## Session Continuity` — Last action: "Export resumed — detecting per-target position from deliverables", Next action: "{TARGET}: {classification}", Blockers: "None". The dashboard records the resume in its per-target row when the run is marked open (Step 2).

**(b) Already exported and current — `T_STATUS == "done"` AND `RECEIPT_PV == CURRENT_PV` (both non-empty).** Soft overwrite prompt (inline, yes/no):

```
{TARGET} is already exported and up to date (package version {CURRENT_PV}, exported {exported_at from the tracker}).

Overwrite it? Re-rendering will:
- Delete .n2b/exports/{TARGET}/ ONLY — never other targets' directories
- Reset only the {TARGET} tracker to not-started
- Leave PIPELINE.md, pipeline_status, and all Export History rows untouched

Overwrite? (yes/no)
```

- **no** → HALT: "Kept as-is. The existing export at {OUT_DIR} is current. Run /n2b:status to see all exports." Zero writes.
- **yes** → execute the per-target refresh cleanup below, then `RUN_MODE=run`.

**(c) Already exported but version behind — `T_STATUS == "done"` AND `RECEIPT_PV != CURRENT_PV`.** Refresh offer (inline, default yes):

```
{TARGET} was exported from package version {RECEIPT_PV}; the package is now version {CURRENT_PV} — this export is STALE.

Refresh it? (yes/no — default yes)
- yes: delete .n2b/exports/{TARGET}/ only, re-render from the current package
- no:  keep the stale export as-is
```

- **no** → HALT: "Stale export kept at {OUT_DIR} (rendered from package version {RECEIPT_PV}). Refresh anytime with /n2b:s5-export {TARGET}." Zero writes.
- **yes** (or empty/default) → per-target refresh cleanup below, then `RUN_MODE=run`.

**(d) Fresh — `T_STATUS` is `not-started`, the tracker is missing, or `T_STATUS` is empty (file exists but the `status:` field is absent/unreadable — the `|| echo` fallback only covers a missing file).** `RUN_MODE=run`.

**Per-target refresh cleanup** (gatekeeper Per-Stage Re-run Cleanup, row 5 — used by routes (b)-yes and (c)-yes only):

```bash
rm -rf "$OUT_DIR"    # this target's export directory ONLY — never other targets', never their receipts
```

- Reset `.n2b/tracking/stages/s5-export/{TARGET}.md` frontmatter to `status: not-started` (null out `exported_at`, `package_version`, `files_rendered`, `fidelity_result` per the tracker template's defaults).
- PIPELINE.md: **no change** — `pipeline_status` stays `blueprint-complete`, `last_completed_stage` stays `5`, and `## Export History` rows are never modified or deleted here (append-only audit trail; a fresh row is appended when the re-render completes).

---

## Step 1 — Pre-flight Validation (manifest-driven)

Display the pre-flight banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○  Verifying the blueprint package against MANIFEST.md
```

The pre-flight is **manifest-driven** — the check list is every row of `.n2b/tracking/MANIFEST.md` `## Package Inventory`, never a hardcoded artifact list:

```bash
PREFLIGHT_PASS=true
PREFLIGHT_ERRORS=""
stage_cmd() { case "$1" in 1) echo "/n2b:s1-init" ;; 2) echo "/n2b:s2-define" ;; 3) echo "/n2b:s3-specify" ;; 4) echo "/n2b:s4-architect" ;; *) echo "/n2b:status" ;; esac; }

# 1. Stage 4 receipt is complete
S4_STATE=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s4-architect/STAGE.md 2>/dev/null || echo "not-started")
if [ "$S4_STATE" != "complete" ]; then
  PREFLIGHT_ERRORS="${PREFLIGHT_ERRORS}\n  ✗  Stage 4 tracking not complete (status: $S4_STATE) — run /n2b:s4-architect"
  PREFLIGHT_PASS=false
fi

# 2. Manifest exists and is non-empty
if [ ! -f .n2b/tracking/MANIFEST.md ] || [ ! -s .n2b/tracking/MANIFEST.md ]; then
  PREFLIGHT_ERRORS="${PREFLIGHT_ERRORS}\n  ✗  .n2b/tracking/MANIFEST.md missing or empty — run /n2b:s4-architect (its stage-complete transition writes the manifest)"
  PREFLIGHT_PASS=false
else
  # 3. Every inventory path exists and is non-empty
  INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' .n2b/tracking/MANIFEST.md)
  ROW_COUNT=$(echo "$INV_ROWS" | grep -c .)
  [ "$ROW_COUNT" = "0" ] && { PREFLIGHT_ERRORS="${PREFLIGHT_ERRORS}\n  ✗  MANIFEST.md has no Package Inventory rows — run /n2b:s4-architect"; PREFLIGHT_PASS=false; }
  while IFS= read -r row; do
    [ -z "$row" ] && continue
    rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
    stg=$(echo "$row" | awk -F'|' '{v=$3; gsub(/ /, "", v); print v}')
    [ -z "$rel" ] && continue
    if [ ! -f ".n2b/$rel" ] || [ ! -s ".n2b/$rel" ]; then
      PREFLIGHT_ERRORS="${PREFLIGHT_ERRORS}\n  ✗  .n2b/$rel missing or empty — regenerate with $(stage_cmd "$stg") (produced by Stage $stg)"
      PREFLIGHT_PASS=false
    fi
  done <<EOF
$INV_ROWS
EOF
  echo "Inventory rows checked: $ROW_COUNT"
fi
echo "PREFLIGHT_PASS=$PREFLIGHT_PASS"
```

**If `PREFLIGHT_PASS=false`:** Display this failure banner and halt — no tracking writes have occurred:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PRE-FLIGHT FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{each PREFLIGHT_ERRORS line — the file that is missing/empty and the stage command that produces it}

The export renders the canonical package — every manifest artifact
must exist before a target can be rendered.
```

**If ALL checks pass:** display `  ✓  {ROW_COUNT} package artifacts verified` and continue to Step 2.

---

## Step 2 — Package Indexing (workflow-owned — no agent)

Re-hash every manifest inventory path and reconcile against the recorded fingerprints. This step is owned by the workflow: MANIFEST.md is written only by workflows, and no roster or second manifest file is ever produced (D1).

```bash
PKG_CHANGED=0
CHANGED_LIST=""
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  old=$(echo "$row" | awk -F'|' '{v=$5; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  new=$(shasum -a 256 ".n2b/$rel" | cut -c1-12)
  if [ "$new" != "$old" ]; then
    PKG_CHANGED=$((PKG_CHANGED+1))
    CHANGED_LIST="${CHANGED_LIST}\n  ⚠  $rel — recorded $old, current $new"
    echo "CHANGED|$rel|$new"
  fi
done <<EOF
$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' .n2b/tracking/MANIFEST.md)
EOF
echo "PKG_CHANGED=$PKG_CHANGED"
```

**If `PKG_CHANGED > 0`:** the canonical package drifted since the manifest was last written. The workflow refreshes the manifest now (Edit tool on `.n2b/tracking/MANIFEST.md`):

1. For each `CHANGED|{rel}|{new}` line: update that inventory row's `Fingerprint` cell to `{new}` and its `Updated` cell to the current ISO timestamp. Touch no other cells and no other rows.
2. Frontmatter: increment `package_version` by 1 (one increment for this whole refresh) and set `last_updated` to the current ISO timestamp.
3. Display the staleness notice:

```
  ⚠  {PKG_CHANGED} package file(s) changed since the manifest was written:{CHANGED_LIST}
  ⚠  package_version bumped to {new value} — prior exports are now STALE
     (refresh any of them anytime with /n2b:s5-export {target})
```

`## Export History` rows are NOT edited here — flipping rows to `stale` is owned by the gatekeeper's confirmed upstream re-run; the status workflow's per-row version comparison surfaces the staleness regardless.

**If `RUN_MODE == "gate-only"` and `PKG_CHANGED > 0`:** the interrupted render predates the current package — downgrade to `RUN_MODE=run` (a re-render is required; gate-only would receipt a stale render).

Record the version this export renders from:

```bash
PKG_VERSION=$(awk '/^---/{n++; next} n==1 && /^package_version:/{print $2; exit} n==2{exit}' .n2b/tracking/MANIFEST.md)
echo "PKG_VERSION=$PKG_VERSION"
```

**Run marking (after indexing, before ANY agent spawn).** Open the run in tracking — the only writes before Step 5:

- Per-target tracker: if `.n2b/tracking/stages/s5-export/{TARGET}.md` does not exist, read the tracker template at `.claude/n2b/templates/tracking/export-target-tracker.md` and write the file per the template shape (fill any target-identity field the template defines with `{TARGET}`). Then set its frontmatter `status: in-progress`.
- Dashboard (`.n2b/tracking/stages/s5-export/STAGE.md`): set frontmatter `status: in-progress` and bump the `targets_in_progress` counter; add or update the `{TARGET}` row in the per-target table — status `in-progress`, package version `{PKG_VERSION}`, and `—` in the not-yet-known cells (Files, Fidelity, Exported at); Step 5 fills them and settles the counters. Append a dashboard activity-log line (per the template's log section, current ISO timestamp) at each run event as it happens: run opened here, formatter complete (Step 3), gate 4a and 4b results (Step 4), receipt written (Step 5).
- STATE.md: **frontmatter untouched** (export runs never alter STATE.md frontmatter). Body `## Session Continuity`: Last action: "Export {TARGET} started (package version {PKG_VERSION})", Next action: "Render → fidelity gate", Blockers: "None".
- PIPELINE.md: **untouched** — it is only written when a target passes (`export-complete`, Step 5).

---

## Step 2.5 — Conditional Backlog Build

This step runs only when the resolved target's registry row says `Needs backlog.json: yes`. **No Phase 0 target does** — for `dev-brief` (`Needs backlog.json: no`) this step is a documented no-op: display nothing and continue to Step 3.

**If `NEEDS_BACKLOG == "yes"`:**

```bash
mkdir -p "$OUT_DIR"
```

Display status: `  ○  Backlog Builder started — building backlog.json for {TARGET}`

Spawn the Backlog Builder:

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-5/backlog-builder.md` and execute your complete task as described. Blueprint package root: `.n2b/` — read every canonical input fresh from disk. Manifest: `.n2b/tracking/MANIFEST.md`. Write your output to `{OUT_DIR}backlog.json`. Package version: {PKG_VERSION}. Do not write any tracking file. Do not ask for clarification — work autonomously."
- Tools: Read, Write, Bash
- Model: resolved from the **Backlog Builder** (Stage 5 — export) row of model-profiles.md under MODEL_PROFILE (resolved at Step 3 — resolve it before this spawn when this step is active)
- maxTurns: 120

After it completes, verify `{OUT_DIR}backlog.json` exists and is non-empty (`[ -s "{OUT_DIR}backlog.json" ]`); if missing, treat as a render failure: enter the Step 4 re-prompt loop with `GATE_ERRORS="Backlog Builder produced no backlog.json"` (the re-prompt re-spawns the Backlog Builder, not the formatter, for this error). Display `  ✓  backlog.json built` on success.

---

## Step 3 — Formatter Render

**Model resolution (once for this workflow):**

```bash
MODEL_PROFILE=$(python3 -c "import json; print(json.load(open('.n2b/config.json')).get('model_profile','balanced'))" 2>/dev/null || echo "balanced")
case "$MODEL_PROFILE" in quality|balanced|budget) ;; *) MODEL_PROFILE="balanced" ;; esac
echo "MODEL_PROFILE=$MODEL_PROFILE"
```

Then resolve each Stage 5 agent role's model from the Per-Agent Model Mapping table in `model-profiles.md` (rows: **Backlog Builder**, **Export Formatter**, **Export Fidelity Checker**) and pass the resolved model as the Agent tool's `model` parameter on every spawn — the mapping table is the single source; never hardcode a model name in this workflow.

Display the EXPORT banner and the run map:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Target: {TARGET} — {Consumer category from the registry row}
  Package version: {PKG_VERSION}

  Render        {"Backlog Builder → " only when Needs backlog.json: yes}Export Formatter — paths in, deliverables out
       ↓
  Export gate   4a bash reconciliation → 4b fidelity checker
       ↓
  Receipt       EXPORT-RECEIPT.md + export-complete transition
```

*(If `RUN_MODE == "gate-only"`: skip the spawn below — display `  ○  Resuming at the fidelity gate — render already on disk` and continue to Step 4.)*

```bash
mkdir -p "$OUT_DIR"
```

Display status: `  ○  Export Formatter started — rendering {TARGET}`

Spawn the target's formatter agent (from its registry row — **paths only, never content**; the package version is the one scalar it receives):

- Prompt: "Read the agent contract at `{FMT_AGENT}` and execute your complete task as described. Blueprint package root: `.n2b/` — read every canonical input fresh from disk; content is never passed to you through this prompt. Manifest: `.n2b/tracking/MANIFEST.md`. Target template: `{TPL_PATH}`. Output directory: `{OUT_DIR}`. Package version: {PKG_VERSION}. Write every rendered file for this target into the output directory. Do NOT write FIDELITY-REPORT.md or EXPORT-RECEIPT.md — the workflow's gate and receipt steps own those. Do not write to any path outside `{OUT_DIR}`, and never write tracking files. Do not ask for clarification — work autonomously."
- Tools: Read, Write, Bash
- Model: resolved from the **Export Formatter** (Stage 5 — all targets) row of model-profiles.md under MODEL_PROFILE
- maxTurns: 150

After the formatter completes, verify it produced output:

```bash
RENDERED_COUNT=$(find "$OUT_DIR" -type f ! -name "FIDELITY-REPORT.md" ! -name "EXPORT-RECEIPT.md" 2>/dev/null | wc -l | tr -d ' ')
echo "RENDERED_COUNT=$RENDERED_COUNT"
```

If `RENDERED_COUNT` is 0: enter the Step 4 re-prompt loop with `GATE_ERRORS="Export Formatter produced no files in {OUT_DIR}"`.

Display: `  ✓  Export Formatter complete — {RENDERED_COUNT} files rendered`

---

## Step 4 — Fidelity Gate

The gate has two sub-gates and one shared retry budget: `RETRIES` starts at 0; each failed sub-gate re-prompts the formatter (max **3** re-renders total), then re-runs 4a and 4b from the top. A per-target gate failure NEVER sets `pipeline_status` — the tracking-protocol `gate-fail` transition is Stages 1–4 only.

### Step 4a — Bash reconciliation

Display status: `  ○  Fidelity gate 4a — bash reconciliation started`

Read `.claude/n2b/references/stage-5/fidelity-rules.md` and execute its rules inline — the same reference-defines / workflow-executes relationship as the gatekeeper:

1. **Derive the canonical ID rosters fresh at gate time** using the roster-derivation greps defined in fidelity-rules.md (rosters come from the canonical files under `.n2b/`, using the ID formats in `id-prefixes.md`). No roster file is written — the rosters live in shell variables for this gate run only (D1).
2. **Run every shared rule** in fidelity-rules.md against `{OUT_DIR}` (roster coverage, count reconciliation, regression lints), **plus the per-target rule row for `{TARGET}`** from its per-target rule table.
3. Every failed rule appends one line to `GATE_ERRORS` with concrete evidence (the rule, the missing/mismatched IDs or counts, and the file checked) — never a bare "failed".

Also compute the canonical counts the receipt will record (independent recompute, kept even when fidelity-rules.md derives the same values):

```bash
FEATURE_COUNT=$(ls -d .n2b/specifications/FEAT-*/ 2>/dev/null | wc -l | tr -d ' ')
SPEC_COUNT=$(find .n2b/specifications/FEAT-*/ -name "FEAT-*.SPEC-*.md" 2>/dev/null | wc -l | tr -d ' ')
AC_COUNT=$(grep -rEoh "FEAT-[0-9]+\.SPEC-[0-9]+-AC-[0-9]+" .n2b/specifications/FEAT-*/ 2>/dev/null | sort -u | wc -l | tr -d ' ')
echo "FEATURE_COUNT=$FEATURE_COUNT SPEC_COUNT=$SPEC_COUNT AC_COUNT=$AC_COUNT"
```

**If `GATE_ERRORS` is non-empty:** go to the **re-prompt loop** below. Otherwise display `  ✓  4a passed — rosters and counts reconciled` and continue to 4b.

### Step 4b — Fidelity checker agent

Display status: `  ○  Fidelity gate 4b — Export Fidelity Checker started`

Spawn the Export Fidelity Checker (parameterized by target — paths only):

- Prompt: "Read the agent contract at `.claude/n2b/agents/stage-5/export-fidelity-checker.md` and execute your complete task as described. Export target: `{TARGET}`. Rendered export directory: `{OUT_DIR}`. Target template: `{TPL_PATH}` — read it to learn this target's file layout and transclusion contract. Blueprint package root: `.n2b/` — compare the render against the canonical documents by reading both fresh from disk. Manifest: `.n2b/tracking/MANIFEST.md`. Fidelity report template: `.claude/n2b/templates/stage-5/fidelity-report.md`. Write your report to `{OUT_DIR}FIDELITY-REPORT.md`. Write nothing else — no tracking files, no edits to the rendered export. Do not ask for clarification — work autonomously."
- Tools: Read, Bash, Write
- Model: resolved from the **Export Fidelity Checker** (Stage 5 — export) row of model-profiles.md under MODEL_PROFILE
- maxTurns: 100

After it completes, verify the report exists (`[ -s "{OUT_DIR}FIDELITY-REPORT.md" ]` — if missing, re-spawn the checker once; if still missing, treat as a fail finding "fidelity checker produced no report") and read its verdict — the pass/fail field pinned by the fidelity-report template (probe the frontmatter/result line, e.g.):

```bash
FID_VERDICT=$(grep -im1 -E "^(result|fidelity_result|verdict): *" "${OUT_DIR}FIDELITY-REPORT.md" | grep -oiE "pass|fail" | head -1 | tr '[:upper:]' '[:lower:]')
echo "FID_VERDICT=$FID_VERDICT"
```

- **`pass`** → display `  ✓  4b passed — fidelity report written` and continue to Step 4c.
- **`fail`** (or unreadable) → append the report's findings to `GATE_ERRORS` and go to the re-prompt loop.

### Step 4c — Fill the reconciliation summary (report §1 — workflow-owned)

The fidelity-report template's §1 (Reconciliation Summary) is appended by the **workflow**, never the checker. With both sub-gates settled, replace §1's placeholder row in `{OUT_DIR}FIDELITY-REPORT.md` with one row per executed 4a rule (R0, U1–U6, plus the per-target rules — DEV-1..DEV-3 for dev-brief), each carrying the rule ID, expected value, found value, and pass/fail, and note the attempts used (e.g. "attempt {RETRIES+1} of 3 passed"). Then continue to Step 5.

### Re-prompt loop (shared by 4a and 4b)

**U6 carve-out (fidelity-rules.md §U6):** a U6 regression-lint hit is an upstream-document defect, not a formatter defect — re-rendering cannot fix it. When **all** `GATE_ERRORS` lines are U6 hits, skip the re-prompt loop entirely: go straight to the `RETRIES >= 3` halt path below (without burning re-renders), with the halt evidence naming the canonical file(s) carrying the flagged phrase and the Next Action routing to the owning stage's re-run command instead of `/n2b:s5-export {TARGET}`. When U6 hits are mixed with other errors, re-prompt for the other errors only and carry the U6 lines through to the report/halt as upstream fixes.

**If `RETRIES < 3`:** increment `RETRIES`, display `  ⚠  Fidelity gate failed (attempt {RETRIES} of 3) — re-prompting the formatter`, then re-spawn the **same formatter agent** (same paths, tools, model, maxTurns as Step 3) with the error list appended to its prompt:

- Additional prompt suffix: "A previous render of this export FAILED the fidelity gate. Fix ONLY these errors by regenerating the affected files in `{OUT_DIR}` — do not touch files that passed, and do not weaken content to satisfy a count: GATE ERRORS: {each GATE_ERRORS line}."

(When the failing artifact is `backlog.json` from Step 2.5, re-spawn the Backlog Builder with the same suffix instead.) Then clear `GATE_ERRORS` and re-run Step 4 from 4a.

**If `RETRIES >= 3`:** HALT with the export gate failure. Record the failure in **export tracking only**:

- Per-target tracker: `status` stays `in-progress`; set `fidelity_result: fail`.
- Dashboard: update the `{TARGET}` row — fidelity failed after 3 re-renders (dashboard `status` stays `in-progress`; the next invocation resumes via `stage-resume-s5`).
- STATE.md (frontmatter untouched) body `## Session Continuity`: Last action: "Export {TARGET} failed the fidelity gate ({N} unresolved errors after 3 re-renders)", Next action: "/n2b:s5-export {TARGET} — re-run the export", Blockers: the top unresolved errors.
- PIPELINE.md: **untouched** — no Export History row, no frontmatter change. `pipeline_status` stays `blueprint-complete`; a failed export leaves the blueprint intact.
- FIDELITY-REPORT.md: fill §1 per Step 4c with the final attempt's expected/found values and the attempts note ("3 of 3 attempts exhausted"). When 4a exhausted the budget before 4b ever ran (no report exists yet), write `{OUT_DIR}FIDELITY-REPORT.md` from its template with §1 filled and `verdict: fail` — the halt always leaves a complete report.

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > EXPORT GATE FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Target: {TARGET} — 3 re-renders exhausted

{each unresolved GATE_ERRORS line, prefixed "  ✗  "}

The blueprint package is untouched — an export failure never
affects the pipeline (pipeline_status stays blueprint-complete).
Rendered output kept for inspection: {OUT_DIR}

## ▶ Next Action

Re-run this export: /n2b:s5-export {TARGET}

*(`/clear` first → fresh context window)*
```

Halt.

---

## Step 5 — Receipt + Tracking (`export-complete`)

### Step 5.0 — Write EXPORT-RECEIPT.md

Collect the rendered-file list (the files the render pass produced — `FIDELITY-REPORT.md` and `EXPORT-RECEIPT.md` are gate/receipt artifacts, not rendered files, and are excluded from the list and the count):

```bash
FILES_LIST=$(cd "$OUT_DIR" && find . -type f ! -name "FIDELITY-REPORT.md" ! -name "EXPORT-RECEIPT.md" | sed 's|^\./||' | sort)
RENDERED_COUNT=$(echo "$FILES_LIST" | grep -c .)
EXPORTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "RENDERED_COUNT=$RENDERED_COUNT EXPORTED_AT=$EXPORTED_AT"
```

Read the receipt template at `.claude/n2b/templates/stage-5/export-receipt.md` and write `{OUT_DIR}EXPORT-RECEIPT.md` per the template, with the C-29 frontmatter filled:

- `target: {TARGET}`
- `exported_at: {EXPORTED_AT}`
- `package_version: {PKG_VERSION}`
- `files:` — the `FILES_LIST` entries as a YAML list
- `feature_count: {FEATURE_COUNT}`
- `spec_count: {SPEC_COUNT}`
- `ac_count: {AC_COUNT}`
- `fidelity_result: pass`

Body per the template shape. The workflow writes this file — the formatter never does. Receipts record `package_version`, not per-file fingerprint sets.

### Step 5.1–5.4 — Execute the `export-complete` transition

Execute the `export-complete` transition **exactly as tracking-protocol.md defines**, its four sections in order (per-target receipt and dashboard finalized BEFORE PIPELINE.md records the export):

**1. Per-target tracking file** (`.n2b/tracking/stages/s5-export/{TARGET}.md`) frontmatter:
- `status: done`
- `exported_at: {EXPORTED_AT}`
- `package_version: {PKG_VERSION}` (the MANIFEST value this export was rendered against)
- `files_rendered: {RENDERED_COUNT}`
- `fidelity_result: pass`

Once `status: done` is set, this file is a **receipt** — write-locked until a user-confirmed per-target refresh resets it.

**2. Dashboard** (`.n2b/tracking/stages/s5-export/STAGE.md`) — explicitly exempt from the STAGE.md receipt write-lock:
- Update the `{TARGET}` per-target row: status `done`, files `{RENDERED_COUNT}`, fidelity `pass`, package version `{PKG_VERSION}`, exported `{EXPORTED_AT}` (per the dashboard template's table shape).
- Update the dashboard counters (targets completed, total files rendered, etc. per the template).
- Set the dashboard frontmatter `status: complete` — no export run is in flight. (The dashboard stays a live document; a later run sets it back to `in-progress`.)

**3. PIPELINE.md:**

```bash
LAST_COMPLETED=$(awk '/^---/{n++; next} n==1 && /^last_completed_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
NEXT_ROW=$(( $(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md) + 1 ))
echo "LAST_COMPLETED=$LAST_COMPLETED NEXT_ROW=$NEXT_ROW"
```

- Append one row to the `## Export History` table (append-only — never modify or delete existing rows):
  `| {NEXT_ROW} | {TARGET} | {PKG_VERSION} | {RENDERED_COUNT} | {EXPORTED_AT} | current |`
- **First-ever completed export only** (`LAST_COMPLETED` still `4`):
  - Frontmatter: `last_completed_stage: 5`
  - Body: tick the checklist row — `- [x] Stage 5: Export` — remove any `← NEXT` marker, append a summary (e.g., "First export {date} | {TARGET}")
  - `## Stage History`: fill the Stage 5 entry (Completed: `{EXPORTED_AT}`, target `{TARGET}`, `Detail: → .n2b/tracking/stages/s5-export/STAGE.md`)
- Always: `last_updated: {current ISO timestamp}`.
- **NEVER change `pipeline_status`** — it stays `blueprint-complete`. **Never change `active_stage`** — it stays `0`.

**4. STATE.md** — frontmatter: no changes. Body only:
- `## Session Continuity`: Last action: "Export {TARGET} complete", Next action: "None — export optional, add another format any time via /n2b:s5-export", Blockers: "None".

---

## Step 6 — EXPORT COMPLETE Banner

Compute the remaining implemented target keys (registry-driven; may be empty):

```bash
REMAINING=""
for k in $V1_KEYS; do
  [ "$k" = "$TARGET" ] && continue
  KS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' ".n2b/tracking/stages/s5-export/${k}.md" 2>/dev/null || echo "not-started")
  KV=$(awk '/^---/{n++; next} n==1 && /^package_version:/{print $2; exit} n==2{exit}' ".n2b/tracking/stages/s5-export/${k}.md" 2>/dev/null || echo "")
  # Registry rendering rule 5: remaining = v1 targets not already exported CURRENT —
  # a done-but-stale target (version behind the manifest) still counts as remaining.
  if [ "$KS" = "done" ] && [ "$KV" = "$PKG_VERSION" ]; then continue; fi
  REMAINING="$REMAINING $k"
done
echo "REMAINING=$REMAINING"
```

Render the completion banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > EXPORT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  {TARGET}: {RENDERED_COUNT} files rendered → {OUT_DIR}
  ✓  Fidelity: pass — {FEATURE_COUNT} features, {SPEC_COUNT} specs,
     {AC_COUNT} acceptance criteria reconciled against the canonical
     package (version {PKG_VERSION})

**Next step:** {the consumer-native next step for this target — take it from the target's registry entry when one is defined; for dev-brief: "Open {OUT_DIR}00-README.md — it gives every role its reading order. COMBINED.md is the single-file render for PDF, print, or email."; generic fallback for targets without registry copy: "Open {OUT_DIR} and start with its entry/README file."}

{Only when REMAINING is non-empty:}
**Other export formats** (one per run):
{one line per key in REMAINING: "- `/n2b:s5-export {key}` — {that row's Consumer category}"}

Each run produces ONE export format. Run /n2b:s5-export again
anytime — the package is never consumed.

This export is a rendering of the blueprint package — the canonical
documents in .n2b/ remain the source of truth. Hand {OUT_DIR} to its
consumer; the blueprint pipeline's work is done.
```

End the invocation.

</process>

<success_criteria>

- Step 0 entry gate transcribes the gatekeeper's Check 1–3 for Stage 5: `blueprint-complete` → PASS unconditionally (E10 never fires for `/n2b:s5-export`); `failed` → E4; `running` → E5; `paused` → E3 whenever `LAST_COMPLETED < 4` ("the export renders the completed blueprint, so Stage 4 must finish first"); Check 3 never executes for Stage 5 — per-target refresh/overwrite prompts are owned by this workflow's Step 0.6
- Target resolution is registry-driven: an argument is validated against the `Status: v1` keys of `export-target-registry.md` (columns per C-27) with a branded `UNKNOWN TARGET` error listing implemented keys; a bare invocation renders the entry statement ("one export format per run; the package is never consumed") then the picker — only categories with ≥1 v1 variant appear, level-2 menus show implemented variants only, and while exactly one target is implemented package-wide the picker collapses to a single AskUserQuestion confirm (Proceed with {key} / Cancel — decision 90i); cancel halts with zero tracking writes; all picker copy comes from the registry, never hardcoded
- Per-target routing: tracker `not-started`/missing → run; `done` + receipt `package_version` == current MANIFEST `package_version` → soft overwrite prompt (decline = zero-write halt); `done` + version behind → refresh offer (default yes; deletes ONLY `.n2b/exports/{target}/`, resets only that target's tracker per gatekeeper cleanup row 5, never touches PIPELINE.md or other targets); dashboard/tracker `in-progress` → `stage-resume-s5` deliverable-based classification (receipt missing → re-run formatter; receipt present + fidelity report missing → gate-only; both present + tracker in-progress → gate-only then re-execute Step 5; gate-only downgrades to a full re-render when Step 2 detects package drift)
- First-ever run initializes `.n2b/tracking/stages/s5-export/` — dashboard from `stage-s5-dashboard.md` template, per-target tracker from `export-target-tracker.md` template (C-29 frontmatter fields only); no tracking writes occur before routing is decided, and the run is marked open (dashboard + tracker `in-progress`, STATE.md Session Continuity) only after indexing, before any agent spawn
- Step 1 pre-flight is manifest-driven (D6): Stage 4 STAGE.md `status: complete` + a bash loop over every `.n2b/tracking/MANIFEST.md` `## Package Inventory` path (exists + non-empty) — no hardcoded artifact list; failure renders the `PRE-FLIGHT FAILED` banner naming each missing file and the producing stage command (stage-number → command mapping), with zero tracking writes
- Step 2 indexing is workflow-owned with NO agent (D1): every inventory path re-hashed (`shasum -a 256 | cut -c1-12`); on mismatch the workflow refreshes only the changed rows' Fingerprint + Updated cells, bumps `package_version` by 1, refreshes `last_updated`, and prints the prior-exports-now-stale notice; Export History rows are never edited here; `PKG_VERSION` recorded for the receipt
- Step 2.5 spawns the Backlog Builder only when the registry row says `Needs backlog.json: yes` (no Phase 0 target does — self-documenting and inert for dev-brief); when active it passes paths only and the Backlog Builder model row
- Step 3 renders the `EXPORT` banner (ui-brand set), resolves MODEL_PROFILE once from `.n2b/config.json` (`model_profile`, default `balanced`) and every spawn's model from model-profiles.md rows (Backlog Builder / Export Formatter / Export Fidelity Checker) — no hardcoded model names; the formatter spawn passes PATHS ONLY (package root `.n2b/`, manifest, target template, output dir) plus the scalar `PKG_VERSION`, and forbids the formatter from writing FIDELITY-REPORT.md, EXPORT-RECEIPT.md, tracking files, or anything outside the output dir
- Step 4a executes the rules in `fidelity-rules.md` inline (reference-defines / workflow-executes, same relationship as the gatekeeper), deriving ID rosters fresh by grep at gate time — no roster file written; failures accumulate `GATE_ERRORS` with per-rule evidence; Step 4b spawns the Export Fidelity Checker parameterized by target (target key, export dir, **target template `TPL_PATH`**, canonical root), which writes `FIDELITY-REPORT.md` from its template; 4a and 4b share one retry budget — max 3 formatter re-prompts (error list appended to the same paths-only prompt), then HALT; a `GATE_ERRORS` set that is entirely U6 lint hits skips the re-prompt loop (upstream-document defect — re-rendering cannot fix it) and halts with routing to the owning stage
- Step 4c: the fidelity report's §1 Reconciliation Summary is **workflow-appended** (one row per executed 4a rule with expected/found values + attempts note) on both the pass path and the exhausted-budget halt path — the checker owns §2 only, and the shipped report never carries placeholder rows
- A gate failure NEVER sets `pipeline_status` and never touches PIPELINE.md (tracking-protocol `gate-fail` is Stages 1–4 only): the failure is recorded in the per-target tracker (`fidelity_result: fail`, status stays `in-progress`) and dashboard only, STATE.md body Session Continuity routes to `/n2b:s5-export {target}`, and the branded `EXPORT GATE FAILED` banner shows the unresolved errors and states the blueprint is untouched
- Step 5 writes `EXPORT-RECEIPT.md` from `export-receipt.md` with the C-29 frontmatter (`target`, `exported_at`, `package_version`, `files`, `feature_count`, `spec_count`, `ac_count`, `fidelity_result: pass` — `files` excludes the gate/receipt artifacts), then executes `export-complete` exactly per tracking-protocol.md in order: per-target tracker → dashboard → PIPELINE.md Export History append (+ first-export-only `last_completed_stage: 5`, checklist tick, Stage History entry) → STATE.md body; `pipeline_status` and `active_stage` are never changed
- Step 6 renders the `EXPORT COMPLETE` banner: rendered-file count, fidelity result with reconciled canonical counts, a consumer-native next step, the remaining implemented target keys as one-line commands (registry-driven; section omitted when empty), the re-run teaching ("Each run produces ONE export format… the package is never consumed"), and the handoff framing
- Workflows own ALL tracking writes; agents write deliverables only; agents receive paths, never content (Layer 2); the export stage never fires `stage-start`, mints no new ID prefixes, and there is no `all` or multi-target form — one export per invocation
- All banners use exactly 40 `━` characters with the `n2b >` prefix; all gate checks use Bash (grep, find, awk, wc, ls, shasum) with the `2>/dev/null || echo` missing-file idiom

</success_criteria>
