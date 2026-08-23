# Export Fidelity Rules (Gate 4a)

<!-- Consumers of this reference:
     - n2b/workflows/stage-5/export.md  (Step 4a: executes every rule inline in bash;
       owns the GATE_ERRORS re-prompt loop, max 3 formatter retries)
     - n2b/agents/stage-5/export-fidelity-checker.md  (Step 4b reads §3's transclusion
       contract to know what "faithful" means for its target — it never executes these
       bash rules)
     - n2b/templates/stage-5/fidelity-report.md  (§1 Reconciliation Summary rows come from
       these rules' expected/found values, appended by the workflow)

     This is a shared read-only reference in the pipeline-gatekeeper.md mold: it defines
     validation rules; it contains no autonomous behavior. The export workflow @-includes it
     and executes the rules inline. Rules operationalize the lossiness-hotspot analysis in
     docs/stage-reviews/stage-5-design.md §4.7. -->

The fidelity gate's mechanical half. After a formatter agent renders an export, the workflow
runs these bash rules to reconcile the export against the canonical package before the
semantic review (4b, `n2b/agents/stage-5/export-fidelity-checker.md`) runs. Counts and ID
rosters catch wholesale loss — dropped features, missing specs, erased cross-cutting rules —
cheaply and deterministically; 4b catches what counts cannot see.

---

## 0. Execution Model

The workflow resolves two parameters from the target's registry row
(`n2b/references/stage-5/export-target-registry.md`) before executing any rule:

```bash
N2B=".n2b"                              # canonical package root
TARGET="{Target key}"                   # e.g. dev-brief
EXPORT_DIR="{Output dir}"               # e.g. .n2b/exports/dev-brief
EXPORT_DIR="${EXPORT_DIR%/}"            # strip any trailing slash — the workflow's OUT_DIR
                                        # ends with "/" and the rules join paths as "$EXPORT_DIR/…"
GATE_ERRORS=""                          # accumulator — empty means the gate passes
```

Every rule appends failures to `GATE_ERRORS` using this idiom (never halts mid-gate — the
formatter gets the complete error list in one re-prompt):

```bash
{check} || GATE_ERRORS="$GATE_ERRORS\n  ✗  {rule}: {specific evidence with counts or IDs}"
```

After all rules run: `GATE_ERRORS` empty → 4a passes, proceed to 4b. Non-empty → the workflow
re-prompts the formatter with the full error list (max 3 attempts, then the run halts with
the export left in place for inspection and the target's tracker still `in-progress`). The
loop, banners, and tracking writes are owned by the workflow — this file owns only the rules.
Expected/found values from each rule feed the FIDELITY-REPORT.md §1 Reconciliation Summary
(appended by the workflow once the gate settles).

**Export scan scope.** Unless a rule says otherwise, export-side greps cover every `.md` file
in `$EXPORT_DIR` except `FIDELITY-REPORT.md` and `EXPORT-RECEIPT.md` (gate artifacts, not
rendered content). The §3 table names any additional per-target exclusions.

---

## 1. Roster Derivation

Rosters are derived by grep from the canonical files **at gate time** — no roster file is
ever written (decision 90a: indexing is workflow-owned; MANIFEST.md stays the only manifest).
Derive all rosters once, before running the rules. Patterns follow the pinned ID formats in
`n2b/references/id-prefixes.md`; each has been verified against a complete live package.

```bash
# FEAT roster — authoritative source: the "**ID:**" line of every feature record
FEAT_ROSTER=$(grep -E '^\*\*ID:\*\* FEAT-[0-9]{2}$' "$N2B/features/product-features.md" \
  | grep -oE 'FEAT-[0-9]{2}' | sort -u)
FEAT_COUNT=$(printf '%s\n' "$FEAT_ROSTER" | grep -c .)

# SPEC roster — from the spec files on disk (filename carries the spec ID)
SPEC_ROSTER=$(ls "$N2B"/specifications/FEAT-*/FEAT-*.SPEC-*.md 2>/dev/null \
  | sed -E 's|.*/(FEAT-[0-9]{2}\.SPEC-[0-9]{3})[^/]*$|\1|' | sort -u)
SPEC_COUNT=$(printf '%s\n' "$SPEC_ROSTER" | grep -c .)

# Cross-check: technical-profile.md §6 (Raw Spec Index) must agree with the filesystem.
# A mismatch is canonical inconsistency — surface it before blaming the formatter.
PROFILE_SPEC_COUNT=$(awk '/^## 6\./{f=1; next} f && /^## /{exit} f' \
  "$N2B/architecture/technical-profile.md" \
  | grep -oE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}' | sort -u | wc -l | tr -d ' ')
[ "$SPEC_COUNT" -eq "$PROFILE_SPEC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  R0: canonical inconsistency — $SPEC_COUNT spec files on disk vs $PROFILE_SPEC_COUNT in technical-profile.md §6; resolve upstream before exporting"

# AC roster/count — distinct acceptance-criterion IDs across all spec files
AC_COUNT=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2}' \
  "$N2B"/specifications/FEAT-*/ | sort -u | wc -l | tr -d ' ')

# Cross-cutting rosters
XBR_ROSTER=$(grep -oE 'XBR-[0-9]{2}' "$N2B/specifications/feature-dependency-map.md" | sort -u)
ADR_ROSTER=$(awk '/^## 14\./{f=1; next} f && /^## /{exit} f' \
  "$N2B/architecture/technical-architecture.md" | grep -oE 'ADR-[0-9]{3}' | sort -u)
SC_ROSTER=$(grep -oE 'SC-[0-9]{2}' "$N2B/features/scope-boundaries.md" | sort -u)
ASMP_ROSTER=$(grep -oE 'ASMP-[0-9]{2}' "$N2B/features/assumptions-constraints.md" | sort -u)
```

Derivation notes:

- The ADR roster reads only `## 14. Decision Log` (the consolidated register, contract C-23);
  ADR IDs cited elsewhere in the document are references, not the roster.
- `sort -u` everywhere: rosters are sets of distinct IDs. Occurrence counting is only used
  where a rule says so (U5).
- An empty XBR/ADR/SC/ASMP roster is legal for small packages — the U4 loop over an empty
  roster simply checks nothing.

---

## 2. Universal Rules (every target)

Run all six for every target, over the export scan scope, in order.

**U1 — FEAT coverage.** Every FEAT ID appears in the export in its mapped role (the §3
transclusion contract defines the role; U1 checks presence — 4b checks the role's depth):

```bash
for ID in $FEAT_ROSTER; do
  grep -rq "$ID" "$EXPORT_DIR" --include='*.md' \
    --exclude='FIDELITY-REPORT.md' --exclude='EXPORT-RECEIPT.md' \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  U1: $ID missing from the export"
done
```

**U2 — SPEC coverage.** Every SPEC ID appears:

```bash
for ID in $SPEC_ROSTER; do
  grep -rq "$ID" "$EXPORT_DIR" --include='*.md' \
    --exclude='FIDELITY-REPORT.md' --exclude='EXPORT-RECEIPT.md' \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  U2: $ID missing from the export"
done
```

**U3 — AC count.** Distinct AC IDs in the export ≥ the canonical count (distinct-ID counting
makes concatenation artifacts harmless; a shortfall means ACs were dropped or paraphrased
away from their IDs):

```bash
EXPORT_AC_COUNT=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2}' "$EXPORT_DIR" \
  --include='*.md' --exclude='FIDELITY-REPORT.md' --exclude='EXPORT-RECEIPT.md' \
  | sort -u | wc -l | tr -d ' ')
[ "$EXPORT_AC_COUNT" -ge "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  U3: export carries $EXPORT_AC_COUNT distinct AC IDs; canonical package has $AC_COUNT"
```

**U4 — Cross-cutting rosters.** Every XBR / ADR / SC / ASMP ID present somewhere in the
export (the classic lossiness hotspot: items with no single-feature home silently fall out):

```bash
for ID in $XBR_ROSTER $ADR_ROSTER $SC_ROSTER $ASMP_ROSTER; do
  grep -rq "$ID" "$EXPORT_DIR" --include='*.md' \
    --exclude='FIDELITY-REPORT.md' --exclude='EXPORT-RECEIPT.md' \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  U4: $ID missing from the export"
done
```

**U5 — No introduced placeholders.** TBD/TODO occurrence count in the export ≤ the canonical
count — formatting never introduces open items. Concatenation artifacts (§3 table) are
excluded from the export side, since they legitimately duplicate any canonical occurrences:

```bash
CANON_TBD=$(cat "$N2B/BRIEF.md" \
  $(find "$N2B/features" "$N2B/specifications" "$N2B/architecture" -name '*.md') \
  | grep -oE 'TBD|TODO' | wc -l | tr -d ' ')
EXPORT_TBD=$(grep -rhoE 'TBD|TODO' "$EXPORT_DIR" --include='*.md' \
  --exclude='FIDELITY-REPORT.md' --exclude='EXPORT-RECEIPT.md' $U5_EXCLUDES \
  | wc -l | tr -d ' ')
[ "$EXPORT_TBD" -le "$CANON_TBD" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  U5: export has $EXPORT_TBD TBD/TODO occurrences vs $CANON_TBD in the canonical package — formatting introduced open items"
```

`$U5_EXCLUDES` comes from the §3 table (for `dev-brief`: `--exclude=COMBINED.md`). The
value is expanded from an unquoted shell variable, so it must carry **no inner quotes** —
quotes set into the variable become literal characters, the exclude silently stops matching,
and U5 false-fails on the concatenation artifact.

**U6 — Regression lint.** Zero case-insensitive occurrences of the hyphenated legacy phrase
matched by `[p]rototype-grade` anywhere in the export. This is the last-exit-door tripwire
for upstream de-scoping language that must never ship to a consumer:

```bash
PG_HITS=$(grep -rioE '[p]rototype-grade' "$EXPORT_DIR" --include='*.md' \
  | wc -l | tr -d ' ')
[ "$PG_HITS" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  U6: $PG_HITS occurrence(s) of the banned legacy phrase in the export — the source document must be fixed upstream, then the export refreshed"
```

> Pattern note: the first letter is written as a one-character class (`[p]`). A single-letter
> class matches identically to the bare letter (with `-i`, both cases), but keeps this
> reference file itself clean under the repo-wide vocabulary scan — the banned word never
> appears here as a contiguous literal. Preserve this spelling when copying the rule.

A U6 hit is not a formatter defect: the formatter renders verbatim, so the phrase came from a
canonical document. The workflow reports it as an upstream fix (re-run the owning stage),
not a formatter re-prompt.

---

## 3. Per-Target Parameters

One row per registry Target key. This table is where future targets add their rule
parameters — the universal rules stay untouched (P4).

| Target key | Roster scope (files reconciled) | Transclusion contract | Excluded from U5 (`$U5_EXCLUDES`) | Target-specific rules |
|---|---|---|---|---|
| `dev-brief` | The full C-28 file set: `00-README.md`, `A-product-vision.md`, `B-usage-and-success.md`, `C-scope-and-assumptions.md`, `D-feature-catalog.md`, `E-feature-specifications/`, `F-data-model.md`, `G1-design-layer.md`, `G2-architecture.md`, `G3-database-schema.md`, `H-appendices.md`, `COMBINED.md` | **Full transclusion** — spec bodies, tables, edge cases, error messages, and ACs verbatim; formatter authors glue prose only (P1) | `--exclude=COMBINED.md` (no inner quotes — expanded from a variable) | DEV-1..DEV-3 below |
| `agent-workspace` | The full C-30 file set: `README.md`, `AGENTS.md`, `CLAUDE.md`, `OPERATING-RULES.md`, `BUILD-ORDER.md`, `PROGRESS.md`, `feature_list.json`, `.devin/wiki.json`, `playbooks/build-next-feature.devin.md`, `docs/blueprint/**` (verbatim manifest copy) | **Verbatim-copy contract** — `docs/blueprint/` is a byte-identical copy of every MANIFEST `## Package Inventory` path; harness/instruction files author glue only | `--exclude=OPERATING-RULES.md` (no inner quotes — expanded from a variable) — its verbatim SC extract duplicates canonical exclusions text already counted in the `docs/blueprint/` copy, the same duplication class as dev-brief's COMBINED.md; every other glue file must add zero (Phase 2 D11) | AWS-1..AWS-6 below |
| `speckit` | The full C-31 set: `README.md`, `.specify/memory/constitution.md`, `.specify/feature.json`, `specs/NNN-{slug}/spec.md` + `specs/NNN-{slug}/research.md` (one pair per canonical FEAT; NNN = build-order position), `docs/blueprint/**` (verbatim manifest copy) | **Spec-render + verbatim-copy** — each spec's ACs verbatim with full IDs inside its owning feature's spec.md (one User Story per SPEC, never paraphrased or renumbered); `docs/blueprint/` is a byte-identical copy of every MANIFEST `## Package Inventory` path | `--exclude=constitution.md` (no inner quotes — expanded from a variable) — its verbatim SC extract duplicates canonical scope text already counted in the `docs/blueprint/` copy, the same duplication class as agent-workspace's OPERATING-RULES.md; every other rendered file must add zero (D12) | SK-1..SK-7 below |
| `prd` | The full C-32 set: `README.md`, `PRD.md`, `architecture.md`, `docs/blueprint/**` (verbatim manifest copy) | **Condensation + verbatim-copy** — PRD.md and architecture.md are condensed renders carrying IDs verbatim with **no AC transclusion** (any AC text that does appear must be verbatim; full depth lives in the blueprint copy); `docs/blueprint/` is a byte-identical copy of every MANIFEST `## Package Inventory` path | *(none)* | PR-1..PR-7 below |
| `jira` | The full C-33 set: `README.md`, `import-guide.md`, `relationships.md`, `backlog.json`, `jira-import.csv`, `docs/blueprint/**` (verbatim manifest copy) | **Condensation + verbatim-copy** — one CSV row per epic and story; descriptions are condensed Jira wiki markup carrying ACs verbatim with full IDs and a `Source:` pointer — explicitly NOT full-table transclusion; full depth lives in `backlog.json` and the `docs/blueprint/` copy | *(none)* — every authored `.md` adds zero (D12); the CSV and JSON payloads sit outside U5's `*.md` scope entirely | JIRA-1..JIRA-9 below |
| `backlog` | The full C-34 set: `README.md`, `backlog.json`, `backlog.csv`, `docs/blueprint/**` (verbatim manifest copy) | **Structured-render + verbatim-copy** — `backlog.csv` is the tool-neutral flat render of `backlog.json` (one row per epic and story, Markdown descriptions, explicit `parent_id` / `ac_ids` / `depends_on` columns, every ID verbatim); full depth lives in `backlog.json` and the `docs/blueprint/` copy | *(none)* — every authored `.md` adds zero (D12); the CSV and JSON payloads sit outside U5's `*.md` scope entirely | BL-1..BL-5 below |
| `lovable-pack` | The full C-35 set: `README.md`, `KNOWLEDGE.md`, `PROMPTS.md`, `AGENTS.md`, `docs/blueprint/**` (verbatim manifest copy) | **Distilled-render + verbatim-copy** — `KNOWLEDGE.md` is the ≤10,000-char distilled constitution (every content bullet back-referenced; SC-XX as condensed labels only); `PROMPTS.md` is a Plan-mode seed plus exactly one prompt per FEAT in build order under the prd condensation contract (no bulk AC transclusion; any transcluded AC text verbatim; strict per-feature attribution); `AGENTS.md` carries the SC-XX DO-NOT-BUILD list verbatim, shell-extracted; `docs/blueprint/` is a byte-identical copy of every MANIFEST `## Package Inventory` path | `--exclude=AGENTS.md --exclude=PROMPTS.md` (no inner quotes — expanded from a variable) — the wrapper's verbatim SC extract and PROMPTS.md's verbatim exemplar ACs duplicate canonical text already counted in the `docs/blueprint/` copy (the OPERATING-RULES.md class); `KNOWLEDGE.md` is never excluded — condensed labels only, it must add zero (D5) | VP-1..VP-8 below (shared across the four `*-pack` keys; VP-1/VP-5 assert this key's wrapper file `AGENTS.md`) |
| `v0-pack` | The full C-35 set: `README.md`, `KNOWLEDGE.md`, `PROMPTS.md`, `INSTRUCTIONS.md`, `docs/blueprint/**` (verbatim manifest copy) | **Distilled-render + verbatim-copy** — as `lovable-pack` (the shared C-35 contract); the verbatim SC home is `INSTRUCTIONS.md` | `--exclude=INSTRUCTIONS.md --exclude=PROMPTS.md` (no inner quotes — expanded from a variable) — same duplication class as `lovable-pack`; `KNOWLEDGE.md` is never excluded (D5) | VP-1..VP-8 below (VP-1/VP-5 assert `INSTRUCTIONS.md`) |
| `bolt-pack` | The full C-35 set: `README.md`, `KNOWLEDGE.md`, `PROMPTS.md`, `agents.md`, `.bolt/prompt`, `.bolt/ignore`, `docs/blueprint/**` (verbatim manifest copy) | **Distilled-render + verbatim-copy** — as `lovable-pack` (the shared C-35 contract); the verbatim SC home is `agents.md`, mirrored in `.bolt/prompt` | `--exclude=agents.md --exclude=prompt --exclude=PROMPTS.md` (no inner quotes — expanded from a variable) — same duplication class as `lovable-pack`; `--exclude=prompt` names `.bolt/prompt` by basename, though as a non-`.md` file it already sits outside U5's `*.md` scope (the jira CSV precedent); `KNOWLEDGE.md` is never excluded (D5) | VP-1..VP-8 below (VP-1 asserts `agents.md` + `.bolt/prompt` + `.bolt/ignore`; VP-5 asserts `agents.md`) |
| `replit-pack` | The full C-35 set: `README.md`, `KNOWLEDGE.md`, `PROMPTS.md`, `replit.md` (+ optional `/.agents/skills/` SKILL.md files), `docs/blueprint/**` (verbatim manifest copy) | **Distilled-render + verbatim-copy** — as `lovable-pack` (the shared C-35 contract); the verbatim SC home is `replit.md` | `--exclude=replit.md --exclude-dir=.agents --exclude=PROMPTS.md` (no inner quotes — expanded from a variable) — same duplication class as `lovable-pack`, with the optional `/.agents/skills/` SKILL.md files excluded as a directory (they restate conventions and posture); `KNOWLEDGE.md` is never excluded (D5) | VP-1..VP-8 below (VP-1/VP-5 assert `replit.md`; `/.agents/skills/` presence is 4b's judgment) |
| `github-issues` / `linear` *(future)* | defined when their phases land (research 2026-07-28: GitHub has no importer — scripting + the sub-issues API; Linear's generic CSV drops parents and relations — API/SDK-driven) | defined by their phases | defined by their phases | defined by their phases |
| other `future` rows | defined by their phases | defined by their phases | defined by their phases | defined by their phases |

---

## 4. Target Rules — `dev-brief`

Run after U1–U6 for a `dev-brief` render.

**DEV-1 — Part-file completeness.** Every C-28 file exists and is non-empty:

```bash
PARTS="00-README.md A-product-vision.md B-usage-and-success.md C-scope-and-assumptions.md D-feature-catalog.md F-data-model.md G1-design-layer.md G2-architecture.md G3-database-schema.md H-appendices.md COMBINED.md"
for P in $PARTS; do
  [ -s "$EXPORT_DIR/$P" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  DEV-1: $P missing or empty"
done
```

**DEV-2 — E chapter per feature.** One chapter file per canonical FEAT under
`E-feature-specifications/`:

```bash
for ID in $FEAT_ROSTER; do
  ls "$EXPORT_DIR"/E-feature-specifications/"$ID"-*.md >/dev/null 2>&1 \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  DEV-2: no E-feature-specifications chapter for $ID"
done
```

**DEV-3 — COMBINED.md completeness.** `COMBINED.md` is the concatenation of `00-README.md` +
parts A..H including every E chapter (C-28; assembled by shell per decision 90e). Check the
concatenation by per-part first-heading presence — every part's first markdown heading must
appear in `COMBINED.md`:

```bash
for PART in $(for P in $PARTS; do [ "$P" = "COMBINED.md" ] || echo "$EXPORT_DIR/$P"; done) \
            "$EXPORT_DIR"/E-feature-specifications/*.md; do
  [ -f "$PART" ] || continue
  FIRST_HEADING=$(grep -m1 -E '^#{1,3} ' "$PART")
  if [ -z "$FIRST_HEADING" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  DEV-3: $(basename "$PART") has no markdown heading"
  else
    grep -qF "$FIRST_HEADING" "$EXPORT_DIR/COMBINED.md" \
      || GATE_ERRORS="$GATE_ERRORS\n  ✗  DEV-3: COMBINED.md is missing part $(basename "$PART") (first heading not found)"
  fi
done
```

Byte-level consistency between `COMBINED.md` and the part files beyond heading presence is a
4b concern (`n2b/agents/stage-5/export-fidelity-checker.md` spot-checks sampled sections).

---

## 5. Target Rules — `agent-workspace`

Run after U1–U6 for an `agent-workspace` render. The §1 roster variables (`$FEAT_ROSTER`,
`$FEAT_COUNT`, `$SPEC_ROSTER`, `$SPEC_COUNT`, `$AC_COUNT`) are in scope — reuse them, never
re-derive. Under the verbatim-copy contract, U1–U4 are satisfied structurally by the
`docs/blueprint/` copy — **AWS-2 is this target's real mechanical guarantee**. U5 excludes
only `OPERATING-RULES.md` (its shell-extracted SC section legitimately duplicates canonical
text the blueprint copy already carries; all other glue files add zero TBD/TODO occurrences
— D11), and a U6 hit remains an upstream-document defect per the §2 carve-out — the copy
renders verbatim.

**AWS-1 — Harness-file completeness.** Every C-30 non-blueprint file exists and is non-empty
(mind the two subdirectory paths):

```bash
HARNESS_FILES="README.md AGENTS.md CLAUDE.md OPERATING-RULES.md BUILD-ORDER.md PROGRESS.md feature_list.json .devin/wiki.json playbooks/build-next-feature.devin.md"
for F in $HARNESS_FILES; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-1: $F missing or empty"
done
```

**AWS-2 — Verbatim-copy byte fidelity.** Every MANIFEST `## Package Inventory` row is
byte-identical under `docs/blueprint/`, and the copy carries exactly one file per inventory
row. Row extraction uses the same awk idiom as the export workflow's Steps 1–2; the heredoc
loop (not a pipe) keeps `GATE_ERRORS` accumulation in the current shell:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-2: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-2: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-2: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

(Extra files beyond the inventory are surfaced by the count mismatch; judging them is 4b's
concern.)

**AWS-3 — `feature_list.json` integrity.** Parses under `node` (Node builtins only — the
repo convention); item count, distinct-AC count, `passes` values, and the item-`id` set all
reconcile against the §1 rosters. The JSON-side counting happens in one `node -e`
invocation that prints values for bash to compare:

```bash
FL="$EXPORT_DIR/feature_list.json"
if ! FL_OUT=$(node -e '
  const fs = require("fs");
  const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const items = d.items || [];
  const acs = new Set();
  let notFalse = 0;
  for (const it of items) {
    (it.ac_ids || []).forEach(a => acs.add(a));
    if (it.passes !== false) notFalse++;
  }
  console.log("ITEMS=" + items.length);
  console.log("DISTINCT_AC=" + acs.size);
  console.log("NOT_FALSE=" + notFalse);
  console.log("IDS_START");
  items.map(it => String(it.id)).sort().forEach(id => console.log(id));
' "$FL" 2>&1); then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-3: feature_list.json does not parse under node — $(printf '%s' "$FL_OUT" | head -1)"
else
  FL_ITEMS=$(printf '%s\n' "$FL_OUT" | grep '^ITEMS=' | cut -d= -f2)
  FL_AC=$(printf '%s\n' "$FL_OUT" | grep '^DISTINCT_AC=' | cut -d= -f2)
  FL_NOT_FALSE=$(printf '%s\n' "$FL_OUT" | grep '^NOT_FALSE=' | cut -d= -f2)
  FL_IDS=$(printf '%s\n' "$FL_OUT" | sed -n '/^IDS_START$/,$p' | sed '1d' | sort -u)
  [ "${FL_ITEMS:-0}" -eq "$SPEC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-3: feature_list.json has ${FL_ITEMS:-0} items vs $SPEC_COUNT canonical specs"
  [ "${FL_AC:-0}" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-3: feature_list.json carries ${FL_AC:-0} distinct ac_ids vs $AC_COUNT canonical AC IDs"
  [ "${FL_NOT_FALSE:-1}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-3: ${FL_NOT_FALSE:-1} item(s) do not ship passes: false"
  CANON_IDS=$(printf '%s\n' "$SPEC_ROSTER" | sort -u)
  if [ "$FL_IDS" != "$CANON_IDS" ]; then
    ID_DIFF=$(printf '%s\n%s\n' "$FL_IDS" "$CANON_IDS" | sort | uniq -u | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-3: item id set differs from the canonical SPEC roster — symmetric difference: $ID_DIFF"
  fi
fi
```

**AWS-4 — BUILD-ORDER coverage.** Every canonical FEAT ID has its **own order-table row**,
and the order table has exactly one row per feature. Only rows of the order table itself
count — a FEAT ID appearing in another row's *Depends on* cell or in a cycle-disclosure
line must NOT satisfy this rule (that is how a dropped row would hide):

```bash
BO="$EXPORT_DIR/BUILD-ORDER.md"
# Order-table rows are "| {order#} | FEAT-NN | ..." — extract the Feature-column ID only.
BO_FEATS=$(grep -E '^\| *[0-9]+ *\| *FEAT-[0-9]{2} *\|' "$BO" 2>/dev/null \
  | awk -F'|' '{gsub(/ /, "", $3); print $3}' | sort -u)
for ID in $FEAT_ROSTER; do
  printf '%s\n' "$BO_FEATS" | grep -qx "$ID" \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-4: $ID has no order-table row in BUILD-ORDER.md"
done
BO_ROWS=$(grep -cE '^\| *[0-9]+ *\| *FEAT-[0-9]{2} *\|' "$BO" 2>/dev/null)
[ "${BO_ROWS:-0}" -eq "$FEAT_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-4: BUILD-ORDER.md order table has ${BO_ROWS:-0} FEAT rows vs $FEAT_COUNT canonical features (exactly one row per feature required)"
```

**AWS-5 — AGENTS.md guardrails.** The 12,000-character hard cap (the Windsurf/Devin Desktop
rule-file limit), the bare-`@`-token ban, and the `CLAUDE.md` bridge line:

```bash
AG="$EXPORT_DIR/AGENTS.md"
AG_CHARS=$(wc -c < "$AG" 2>/dev/null | tr -d ' ')
[ "${AG_CHARS:-0}" -le 12000 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-5: AGENTS.md is $AG_CHARS characters — the hard cap is 12,000"
AT_HITS=$(grep -cE '(^| )@[A-Za-z0-9_./-]' "$AG" 2>/dev/null)
[ "${AT_HITS:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-5: AGENTS.md carries $AT_HITS line(s) with bare @-path tokens — blueprint pointers must be plain or backticked paths"
CL_FIRST=$(awk 'NF {print; exit}' "$EXPORT_DIR/CLAUDE.md" 2>/dev/null)
[ "$CL_FIRST" = "@AGENTS.md" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-5: CLAUDE.md first non-empty line is \"$CL_FIRST\" — must be exactly \"@AGENTS.md\" (the bridge import)"
```

> Why the bare-`@` ban: the `CLAUDE.md` bridge imports `AGENTS.md`, and Claude Code
> recursively expands bare `@`-path tokens (up to 4 hops) — a bare `@docs/blueprint/...`
> token would force-load the entire blueprint into context at session start. Backticked
> `@`-paths are skipped, and the compliant file writes blueprint pointers without `@` at
> all, so a clean `AGENTS.md` has zero matches.

**AWS-6 — Mutual-disclosure symmetry.** The `↔` glyph is the house mutuality token
(JIRA-6's reading): every `FEAT-AA ↔ FEAT-BB` token in `BUILD-ORDER.md` must be a
genuinely bidirectional pair of the canonical dependency map, and every genuinely
bidirectional pair must be disclosed — a 2-cycle can never be linearized without a
break, so every mutual pair always surfaces as a `BROKEN … MUTUAL` row (decision 104).
FORWARD breaks use the directional line shape and never carry `↔`. The canonical mutual
set is derived from the Features table's `Depends On` column, header-indexed — never
from the export under test:

```bash
AWS6_DEP_EDGES=$(awk -F'|' '
  !dcol && /^\|/ && $0 ~ /Depends On/ { for(i=1;i<=NF;i++){h=$i; gsub(/^ +| +$/,"",h); if(h=="Depends On") dcol=i; if(h=="Number") ncol=i} next }
  dcol && /^\|/ { id=$ncol; gsub(/ /,"",id); if(id !~ /^FEAT-[0-9][0-9]$/) next;
    n=split($dcol, a, ","); for(j=1;j<=n;j++){gsub(/ /,"",a[j]); if(a[j] ~ /^FEAT-[0-9][0-9]$/) print id" "a[j]} }' \
  "$N2B/specifications/feature-dependency-map.md")
AWS6_CANON_MUTUAL=$(printf '%s\n' "$AWS6_DEP_EDGES" | sort -u \
  | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort | uniq -d)
AWS6_DISCLOSED=$(grep -oE 'FEAT-[0-9]{2} *↔ *FEAT-[0-9]{2}' "$EXPORT_DIR/BUILD-ORDER.md" 2>/dev/null \
  | sed -E 's/ *↔ */ /' | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort -u)
AWS6_DIFF=$(printf '%s\n%s\n' "$AWS6_DISCLOSED" "$AWS6_CANON_MUTUAL" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ';')
[ -z "$AWS6_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  AWS-6: BUILD-ORDER.md mutual-pair disclosure is not symmetric with the dependency map — each of these pairs is disclosed-but-not-mutual or mutual-but-undisclosed: $AWS6_DIFF"
```

---

## 6. Target Rules — `speckit`

Run after U1–U6 for a `speckit` render. The §1 roster variables (`$FEAT_ROSTER`,
`$FEAT_COUNT`, `$SPEC_ROSTER`, `$SPEC_COUNT`, `$AC_COUNT`, `$SC_ROSTER`) are in scope —
reuse them, never re-derive. Under the spec-render + verbatim-copy contract, U1–U4 are
satisfied structurally by the `docs/blueprint/` copy — SK-2..SK-4 therefore measure the
*render*: they scope themselves to `specs/*/spec.md` and deliberately exclude the blueprint
copy, so a dropped or hollowed spec.md cannot hide behind it. U5 excludes only
`constitution.md` (its shell-extracted SC scope list legitimately duplicates canonical text
the blueprint copy already carries — the OPERATING-RULES.md class; every other rendered file
adds zero — D12), and a U6 hit remains an upstream-document defect per the §2 carve-out —
the copy renders verbatim. **Known U5 edge:** spec.md files transclude canonical AC and
Purpose lines verbatim, and the same lines exist in the blueprint copy — so an open-item
token inside a canonical AC/Purpose line would double-count and fail U5 even on a fully
compliant render. That is a halt-with-upstream-fix path (clean the canonical spec), not a
gate defect: spec.md cannot be excluded because its authored digest layers must stay
linted.

**SK-1 — Workspace-file completeness.** The C-31 entry files exist and are non-empty (mind
the `.specify/` subdirectory paths):

```bash
for F in README.md .specify/memory/constitution.md .specify/feature.json; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-1: $F missing or empty"
done
```

**SK-2 — Feature-dir coverage.** Exactly one `specs/NNN-{slug}/` dir per canonical FEAT,
each with a non-empty `spec.md` and `research.md`; the NNN prefix set is exactly
001..FEAT_COUNT (no gaps, no duplicates); and the `**Blueprint feature:** FEAT-NN` header
multiset across spec.md files carries each canonical FEAT exactly once. The header check is
column-scoped extraction, not a doc-wide ID grep — a FEAT ID mentioned in another spec's
dependencies line must NOT satisfy it (the AWS-4 lesson). The heredoc loop (not a pipe)
keeps `GATE_ERRORS` accumulation in the current shell:

```bash
SK_DIRS=$(find "$EXPORT_DIR/specs" -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' 2>/dev/null | sort)
SK_DIR_COUNT=$(printf '%s\n' "$SK_DIRS" | grep -c .)
[ "${SK_DIR_COUNT:-0}" -eq "$FEAT_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: ${SK_DIR_COUNT:-0} feature dirs match specs/NNN-*/ vs $FEAT_COUNT canonical features"
while IFS= read -r d; do
  [ -z "$d" ] && continue
  [ -s "$d/spec.md" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: specs/$(basename "$d")/spec.md missing or empty"
  [ -s "$d/research.md" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: specs/$(basename "$d")/research.md missing or empty"
done <<EOF
$SK_DIRS
EOF
# NNN prefix set must be exactly 001..FEAT_COUNT — no gaps, no duplicates
SK_PREFIXES=$(printf '%s\n' "$SK_DIRS" | sed -E 's|.*/([0-9]{3})-.*|\1|' | grep -E '^[0-9]{3}$')
SK_EXPECTED=$(awk -v n="$FEAT_COUNT" 'BEGIN{for(i=1;i<=n;i++) printf "%03d\n", i}')
SK_DUP_PFX=$(printf '%s\n' "$SK_PREFIXES" | sort | uniq -d | tr '\n' ' ')
[ -z "$SK_DUP_PFX" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: duplicated NNN prefix(es): $SK_DUP_PFX"
SK_PFX_DIFF=$(printf '%s\n%s\n' "$(printf '%s\n' "$SK_PREFIXES" | sort -u)" "$SK_EXPECTED" | grep -E '^[0-9]{3}$' | sort | uniq -u | tr '\n' ' ')
[ -z "$SK_PFX_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: NNN prefix set is not exactly 001..$(printf '%03d' "$FEAT_COUNT") — difference: $SK_PFX_DIFF"
# Blueprint-feature headers: extract the FEAT ID from the header line only (never doc-wide)
SK_FEATS=$(grep -hE '^\*\*Blueprint feature:\*\* FEAT-[0-9]{2}' "$EXPORT_DIR"/specs/[0-9][0-9][0-9]-*/spec.md 2>/dev/null | grep -oE 'FEAT-[0-9]{2}')
SK_DUP_FEATS=$(printf '%s\n' "$SK_FEATS" | sort | uniq -d | tr '\n' ' ')
[ -z "$SK_DUP_FEATS" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: FEAT ID(s) claimed by more than one Blueprint-feature header: $SK_DUP_FEATS"
SK_FEAT_SET=$(printf '%s\n' "$SK_FEATS" | grep -E '^FEAT' | sort -u)
CANON_FEAT_SET=$(printf '%s\n' "$FEAT_ROSTER" | sort -u)
if [ "$SK_FEAT_SET" != "$CANON_FEAT_SET" ]; then
  SK_FEAT_DIFF=$(printf '%s\n%s\n' "$SK_FEAT_SET" "$CANON_FEAT_SET" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ' ')
  GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-2: Blueprint-feature header set differs from the canonical FEAT roster — symmetric difference: $SK_FEAT_DIFF"
fi
```

**SK-3 — AC verbatim coverage.** Distinct AC IDs across `specs/*/spec.md` only — the
blueprint copy is excluded; this measures the render. Count equality *and* set equality
against the canonical roster (§1 derives only `$AC_COUNT`; the ID set is derived here once,
by the same grep):

```bash
SK_AC_IDS=$(grep -hoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2}' "$EXPORT_DIR"/specs/[0-9][0-9][0-9]-*/spec.md 2>/dev/null | sort -u)
SK_AC_COUNT=$(printf '%s\n' "$SK_AC_IDS" | grep -c .)
[ "${SK_AC_COUNT:-0}" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-3: specs/*/spec.md carry ${SK_AC_COUNT:-0} distinct AC IDs vs $AC_COUNT canonical (render-side scan — blueprint copy excluded)"
CANON_AC_IDS=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2}' "$N2B"/specifications/FEAT-*/ | sort -u)
if [ "$SK_AC_IDS" != "$CANON_AC_IDS" ]; then
  SK_AC_DIFF=$(printf '%s\n%s\n' "$SK_AC_IDS" "$CANON_AC_IDS" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
  GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-3: render-side AC ID set differs from the canonical roster — sample symmetric difference: $SK_AC_DIFF"
fi
```

**SK-4 — Per-spec mapping.** Every canonical SPEC ID appears in its *owning* feature's
spec.md — the owner is resolved from the SK-2 mapping (the file whose Blueprint-feature
header claims the FEAT), then exactly that one file is grepped. A SPEC ID quoted in some
other feature's file must NOT satisfy this rule:

```bash
for FID in $FEAT_ROSTER; do
  OWNER=$(grep -lE "^\*\*Blueprint feature:\*\* $FID" "$EXPORT_DIR"/specs/[0-9][0-9][0-9]-*/spec.md 2>/dev/null | head -1)
  if [ -z "$OWNER" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-4: no spec.md claims $FID — its specs cannot be located (see SK-2)"
    continue
  fi
  for SID in $(printf '%s\n' "$SPEC_ROSTER" | grep "^$FID\."); do
    grep -q "$SID" "$OWNER" \
      || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-4: $SID missing from ${OWNER#$EXPORT_DIR/} (the owning feature's spec.md)"
  done
done
```

**SK-5 — Blueprint-copy byte fidelity.** The AWS-2 idiom verbatim — same awk row
extraction, same heredoc loop, same trailing count check; only the rule name differs:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-5: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-5: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-5: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

(Extra files beyond the inventory are surfaced by the count mismatch; judging them is 4b's
concern.)

**SK-6 — Constitution + feature.json integrity.** Every canonical SC ID appears in
`constitution.md` (the verbatim DO-NOT-BUILD scope list); the version-stamp footer is
present; and `feature.json` parses under `node` (Node builtins only — the repo convention)
with a `feature_directory` naming an existing exported dir for build-order feature 001:

```bash
CONST="$EXPORT_DIR/.specify/memory/constitution.md"
for ID in $SC_ROSTER; do
  grep -q "$ID" "$CONST" 2>/dev/null \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-6: $ID missing from constitution.md — the verbatim scope list must carry every n2b SC ID"
done
grep -qE 'Version: .+ \| Ratified: .+ \| Last Amended: .+' "$CONST" 2>/dev/null \
  || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-6: constitution.md lacks the version-stamp footer (Version: … | Ratified: … | Last Amended: …)"
FJ="$EXPORT_DIR/.specify/feature.json"
if ! FJ_DIR=$(node -e '
  const fs = require("fs");
  const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (typeof d.feature_directory !== "string" || !d.feature_directory) process.exit(1);
  console.log(d.feature_directory);
' "$FJ" 2>&1); then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-6: .specify/feature.json does not parse under node or lacks feature_directory — $(printf '%s' "$FJ_DIR" | head -1)"
else
  if [ ! -d "$EXPORT_DIR/$FJ_DIR" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-6: feature.json feature_directory \"$FJ_DIR\" is not a directory under the export"
  else
    case "$(basename "$FJ_DIR")" in
      001-*) : ;;
      *) GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-6: feature.json feature_directory \"$FJ_DIR\" does not name build-order feature 001 (basename must start 001-)" ;;
    esac
  fi
fi
```

**SK-7 — Mutual-disclosure symmetry.** The AWS-6 idiom on `README.md` — every
`FEAT-AA ↔ FEAT-BB` token must be a genuinely bidirectional pair of the canonical
dependency map, and every genuinely bidirectional pair must be disclosed (every mutual
pair always surfaces as a `BROKEN … MUTUAL` row — decision 104); FORWARD breaks use the
directional shape and never carry `↔`:

```bash
SK7_DEP_EDGES=$(awk -F'|' '
  !dcol && /^\|/ && $0 ~ /Depends On/ { for(i=1;i<=NF;i++){h=$i; gsub(/^ +| +$/,"",h); if(h=="Depends On") dcol=i; if(h=="Number") ncol=i} next }
  dcol && /^\|/ { id=$ncol; gsub(/ /,"",id); if(id !~ /^FEAT-[0-9][0-9]$/) next;
    n=split($dcol, a, ","); for(j=1;j<=n;j++){gsub(/ /,"",a[j]); if(a[j] ~ /^FEAT-[0-9][0-9]$/) print id" "a[j]} }' \
  "$N2B/specifications/feature-dependency-map.md")
SK7_CANON_MUTUAL=$(printf '%s\n' "$SK7_DEP_EDGES" | sort -u \
  | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort | uniq -d)
SK7_DISCLOSED=$(grep -oE 'FEAT-[0-9]{2} *↔ *FEAT-[0-9]{2}' "$EXPORT_DIR/README.md" 2>/dev/null \
  | sed -E 's/ *↔ */ /' | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort -u)
SK7_DIFF=$(printf '%s\n%s\n' "$SK7_DISCLOSED" "$SK7_CANON_MUTUAL" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ';')
[ -z "$SK7_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  SK-7: README.md mutual-pair disclosure is not symmetric with the dependency map — each of these pairs is disclosed-but-not-mutual or mutual-but-undisclosed: $SK7_DIFF"
```

---

## 7. Target Rules — `prd`

Run after U1–U6 for a `prd` render. The §1 roster variables (`$FEAT_ROSTER`,
`$FEAT_COUNT`, `$SPEC_ROSTER`, `$SPEC_COUNT`, `$AC_COUNT`, `$ADR_ROSTER`) are in scope —
reuse them, never re-derive. Under the condensation + verbatim-copy contract, U1–U4 are
satisfied structurally by the `docs/blueprint/` copy — PR-2, PR-3, and PR-6 therefore scope
themselves to the rendered files (`PRD.md`, `architecture.md`), so a dropped feature,
inventory row, or decision cannot hide behind the copy. `$U5_EXCLUDES` is empty (every
rendered file adds zero — D12), and a U6 hit remains an upstream-document defect per the
§2 carve-out.

**PR-1 — File completeness + skeleton.** The three rendered files exist and are non-empty;
`PRD.md` carries the literal `<context>` and `<PRD>` tags and all eight pinned H1 headings:

```bash
for F in README.md PRD.md architecture.md; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-1: $F missing or empty"
done
PRD="$EXPORT_DIR/PRD.md"
for TAG in '<context>' '<PRD>'; do
  grep -qF "$TAG" "$PRD" 2>/dev/null || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-1: PRD.md lacks the literal $TAG tag"
done
while IFS= read -r H; do
  grep -qE "^# ${H}[[:space:]]*$" "$PRD" 2>/dev/null \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-1: PRD.md lacks the pinned H1 heading \"# $H\""
done <<EOF
Overview
Core Features
User Experience
Technical Architecture
Development Roadmap
Logical Dependency Chain
Risks and Mitigations
Appendix
EOF
```

**PR-2 — Feature coverage.** Every FEAT ID appears *within* the `# Core Features` section
(section-bounded by awk, never a doc-wide grep), and the `# Logical Dependency Chain`
section's order table carries exactly one row per canonical FEAT. Chain rows are
`| {order#} | FEAT-NN | ... |` and only the Feature column counts — a FEAT ID appearing in
another row's *Depends on* cell or in the prose cycle disclosures below the table must NOT
satisfy this rule (the repaired AWS-4 extraction, column-scoped):

```bash
CF_SECTION=$(awk '/^# Core Features[[:space:]]*$/{f=1; next} f && /^# /{exit} f' "$PRD" 2>/dev/null)
for ID in $FEAT_ROSTER; do
  printf '%s\n' "$CF_SECTION" | grep -q "$ID" \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-2: $ID missing from the # Core Features section"
done
LDC_SECTION=$(awk '/^# Logical Dependency Chain[[:space:]]*$/{f=1; next} f && /^# /{exit} f' "$PRD" 2>/dev/null)
LDC_FEATS=$(printf '%s\n' "$LDC_SECTION" | grep -E '^\| *[0-9]+ *\| *FEAT-[0-9]{2} *\|' \
  | awk -F'|' '{gsub(/ /, "", $3); print $3}' | sort -u)
for ID in $FEAT_ROSTER; do
  printf '%s\n' "$LDC_FEATS" | grep -qx "$ID" \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-2: $ID has no chain-table row in # Logical Dependency Chain"
done
LDC_ROWS=$(printf '%s\n' "$LDC_SECTION" | grep -cE '^\| *[0-9]+ *\| *FEAT-[0-9]{2} *\|')
[ "${LDC_ROWS:-0}" -eq "$FEAT_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-2: # Logical Dependency Chain has ${LDC_ROWS:-0} FEAT rows vs $FEAT_COUNT canonical features (exactly one row per feature required)"
```

**PR-3 — Appendix inventory.** The `# Appendix` spec-inventory table (columns
`| Spec ID | Name | Type | ACs |`) carries one row per canonical SPEC: row count and the
distinct row-leading SPEC ID set both reconcile against the roster, and the ACs column sums
to `$AC_COUNT`. Extraction is row-shape-bounded within the Appendix section — totals appear
as prose below the table, never as a row, and would not match the row shape anyway:

```bash
APX_SECTION=$(awk '/^# Appendix[[:space:]]*$/{f=1; next} f && /^# /{exit} f' "$PRD" 2>/dev/null)
APX_ROWS=$(printf '%s\n' "$APX_SECTION" | grep -E '^\| FEAT-[0-9]{2}\.SPEC-[0-9]{3} \|')
APX_ROW_COUNT=$(printf '%s\n' "$APX_ROWS" | grep -c .)
[ "${APX_ROW_COUNT:-0}" -eq "$SPEC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-3: Appendix inventory has ${APX_ROW_COUNT:-0} rows vs $SPEC_COUNT canonical specs"
APX_IDS=$(printf '%s\n' "$APX_ROWS" | awk -F'|' '{gsub(/ /, "", $2); print $2}' | grep -E '^FEAT' | sort -u)
CANON_SPEC_SET=$(printf '%s\n' "$SPEC_ROSTER" | sort -u)
if [ "$APX_IDS" != "$CANON_SPEC_SET" ]; then
  APX_DIFF=$(printf '%s\n%s\n' "$APX_IDS" "$CANON_SPEC_SET" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
  GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-3: Appendix Spec ID set differs from the canonical roster — sample symmetric difference: $APX_DIFF"
fi
APX_AC_SUM=$(printf '%s\n' "$APX_ROWS" | awk -F'|' '{gsub(/ /, "", $5); s+=$5} END{print s+0}')
[ "${APX_AC_SUM:-0}" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-3: Appendix ACs column sums to ${APX_AC_SUM:-0} vs $AC_COUNT canonical AC IDs"
```

**PR-4 — Size cap.** `PRD.md` stays under the parse-prd headroom ceiling:

```bash
PRD_CHARS=$(wc -c < "$PRD" 2>/dev/null | tr -d ' ')
[ "${PRD_CHARS:-0}" -le 100000 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-4: PRD.md is $PRD_CHARS characters — the cap is 100,000"
```

**PR-5 — Blueprint-copy byte fidelity.** The AWS-2 idiom verbatim, as SK-5 — only the rule
name differs:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-5: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-5: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-5: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

**PR-6 — ADR coverage in the render.** Every canonical ADR ID appears in `architecture.md`
*itself* — the condensed render must not drop decisions, and the blueprint copy does not
satisfy this rule (the grep is scoped to that one file):

```bash
ARCH="$EXPORT_DIR/architecture.md"
for ID in $ADR_ROSTER; do
  grep -q "$ID" "$ARCH" 2>/dev/null \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-6: $ID missing from architecture.md — the condensed render must carry every ADR (the blueprint copy does not satisfy this rule)"
done
```

**PR-7 — Mutual-disclosure symmetry.** The AWS-6 idiom on `PRD.md` — every
`FEAT-AA ↔ FEAT-BB` token must be a genuinely bidirectional pair of the canonical
dependency map, and every genuinely bidirectional pair must be disclosed (every mutual
pair always surfaces as a `BROKEN … MUTUAL` row — decision 104); FORWARD breaks use the
directional shape and never carry `↔`:

```bash
PR7_DEP_EDGES=$(awk -F'|' '
  !dcol && /^\|/ && $0 ~ /Depends On/ { for(i=1;i<=NF;i++){h=$i; gsub(/^ +| +$/,"",h); if(h=="Depends On") dcol=i; if(h=="Number") ncol=i} next }
  dcol && /^\|/ { id=$ncol; gsub(/ /,"",id); if(id !~ /^FEAT-[0-9][0-9]$/) next;
    n=split($dcol, a, ","); for(j=1;j<=n;j++){gsub(/ /,"",a[j]); if(a[j] ~ /^FEAT-[0-9][0-9]$/) print id" "a[j]} }' \
  "$N2B/specifications/feature-dependency-map.md")
PR7_CANON_MUTUAL=$(printf '%s\n' "$PR7_DEP_EDGES" | sort -u \
  | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort | uniq -d)
PR7_DISCLOSED=$(grep -oE 'FEAT-[0-9]{2} *↔ *FEAT-[0-9]{2}' "$PRD" 2>/dev/null \
  | sed -E 's/ *↔ */ /' | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort -u)
PR7_DIFF=$(printf '%s\n%s\n' "$PR7_DISCLOSED" "$PR7_CANON_MUTUAL" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ';')
[ -z "$PR7_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  PR-7: PRD.md mutual-pair disclosure is not symmetric with the dependency map — each of these pairs is disclosed-but-not-mutual or mutual-but-undisclosed: $PR7_DIFF"
```

---

## 8. Target Rules — `jira`

Run after U1–U6 for a `jira` render. The §1 roster variables (`$FEAT_ROSTER`, `$FEAT_COUNT`,
`$SPEC_ROSTER`, `$SPEC_COUNT`, `$AC_COUNT`, `$XBR_ROSTER`, `$ADR_ROSTER`, `$SC_ROSTER`,
`$ASMP_ROSTER`) are in scope — reuse them, never re-derive. This is the first target whose
payload is **not markdown**: `backlog.json` and `jira-import.csv` are invisible to the
universal rules' `--include='*.md'` scope, and U1–U4 are satisfied structurally by the
`docs/blueprint/` copy — so **JIRA-2..JIRA-8 are the only checks standing between a dropped
story and a passing gate**. They carry the real fidelity burden for this target and are
written for an adversarial formatter. `$U5_EXCLUDES` is empty (D12), and a U6 hit remains an
upstream-document defect per the §2 carve-out — the copy renders verbatim.

Two idioms are binding for every rule below:

- **The CSV is parsed only by the pinned RFC-4180 reader** (the extraction pass below) —
  never `cut`, `awk -F','`, or any naive comma split. Description fields carry commas,
  doubled quotes, and embedded newlines; a naive parser returns confident, wrong numbers.
- **Row- and column-bounded coverage** (the AWS-4 lesson, applied twice): SPEC coverage reads
  the Summary column only, and an AC ID counts only inside the Description of the story whose
  Summary carries that AC's own SPEC prefix. Canonical AC clauses cross-reference other
  AC/SPEC IDs (backlog-schema.md §6.2), so a doc-wide grep would let a truncated AC block or
  a dropped story hide behind a cross-reference in another row.

One parameter joins the §0 set for both Phase 4 targets — the MANIFEST package version the
run rendered from:

```bash
PKG_VERSION=$(awk '/^package_version:/{print $2; exit}' "$N2B/tracking/MANIFEST.md")
```

**JIRA-1 — File completeness.** Every C-33 rendered file exists and is non-empty, and
`jira-import.json` does **not** exist (D14 is gated, not merely documented):

```bash
for F in README.md import-guide.md relationships.md backlog.json jira-import.csv; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-1: $F missing or empty"
done
[ ! -e "$EXPORT_DIR/jira-import.json" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-1: jira-import.json exists — deliberately not emitted (D14/C-33); remove it"
```

**JIRA-2 — backlog.json integrity.** Parses under `node` (Node builtins only — the repo
convention); `schema_version` is 1; `metadata.package_version` equals the run's
`PKG_VERSION`; the emitted arrays reconcile against the canonical rosters **and** the
`metadata.counts` claims match the arrays (counts are never taken on faith); exactly one
foundation epic, whose `carries.sc_ids` set equals the canonical SC roster; the story-id set
equals the canonical SPEC roster (set equality, not just count):

```bash
BJ="$EXPORT_DIR/backlog.json"
if ! J2_OUT=$(node -e '
  const fs = require("fs");
  const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const epics = d.epics || [], stories = d.stories || [];
  const featEpics = epics.filter(e => e.type === "feature");
  const foundation = epics.filter(e => e.type === "foundation");
  let acTotal = 0; const acIds = new Set();
  for (const s of stories) for (const a of (s.acceptance_criteria || [])) { acTotal++; acIds.add(String(a.id)); }
  const c = (d.metadata || {}).counts || {};
  console.log("SCHEMA=" + d.schema_version);
  console.log("PKG=" + (d.metadata || {}).package_version);
  console.log("FEAT_EPICS=" + featEpics.length);
  console.log("STORIES=" + stories.length);
  console.log("AC_TOTAL=" + acTotal);
  console.log("AC_DISTINCT=" + acIds.size);
  console.log("FOUNDATION_EPICS=" + foundation.length);
  console.log("C_FEAT=" + c.feature_epics);
  console.log("C_STORIES=" + c.stories);
  console.log("C_AC=" + c.acceptance_criteria);
  console.log("EDGES_BLOCKS=" + (d.dependency_edges || []).filter(e => e.type === "blocks").length);
  console.log("SC_START");
  (((foundation[0] || {}).carries || {}).sc_ids || []).forEach(x => console.log(x));
  console.log("SC_END");
  console.log("STORY_IDS_START");
  stories.map(s => String(s.id)).sort().forEach(x => console.log(x));
  console.log("STORY_IDS_END");
' "$BJ" 2>&1); then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: backlog.json does not parse under node — $(printf '%s' "$J2_OUT" | head -1)"
else
  J2_SCHEMA=$(printf '%s\n' "$J2_OUT" | grep '^SCHEMA=' | cut -d= -f2)
  J2_PKG=$(printf '%s\n' "$J2_OUT" | grep '^PKG=' | cut -d= -f2)
  J2_FEAT=$(printf '%s\n' "$J2_OUT" | grep '^FEAT_EPICS=' | cut -d= -f2)
  J2_STORIES=$(printf '%s\n' "$J2_OUT" | grep '^STORIES=' | cut -d= -f2)
  J2_ACT=$(printf '%s\n' "$J2_OUT" | grep '^AC_TOTAL=' | cut -d= -f2)
  J2_ACD=$(printf '%s\n' "$J2_OUT" | grep '^AC_DISTINCT=' | cut -d= -f2)
  J2_FOUND=$(printf '%s\n' "$J2_OUT" | grep '^FOUNDATION_EPICS=' | cut -d= -f2)
  J2_CF=$(printf '%s\n' "$J2_OUT" | grep '^C_FEAT=' | cut -d= -f2)
  J2_CS=$(printf '%s\n' "$J2_OUT" | grep '^C_STORIES=' | cut -d= -f2)
  J2_CA=$(printf '%s\n' "$J2_OUT" | grep '^C_AC=' | cut -d= -f2)
  J2_EBLOCKS=$(printf '%s\n' "$J2_OUT" | grep '^EDGES_BLOCKS=' | cut -d= -f2)
  [ "$J2_SCHEMA" = "1" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: schema_version is ${J2_SCHEMA:-unset} — consumers are built against schema 1"
  [ "$J2_PKG" = "$PKG_VERSION" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: metadata.package_version ${J2_PKG:-unset} vs MANIFEST package_version $PKG_VERSION — the backlog was built from a different package state"
  [ "$J2_FEAT" = "$FEAT_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: ${J2_FEAT:-0} feature epics vs $FEAT_COUNT canonical features"
  [ "$J2_STORIES" = "$SPEC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: ${J2_STORIES:-0} stories vs $SPEC_COUNT canonical specs"
  [ "$J2_ACT" = "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: ${J2_ACT:-0} AC objects vs $AC_COUNT canonical AC IDs"
  [ "$J2_ACD" = "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: ${J2_ACD:-0} distinct AC ids vs $AC_COUNT canonical (total and distinct differing means duplicated AC ids)"
  [ "$J2_FOUND" = "1" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: ${J2_FOUND:-0} foundation epic(s) — exactly one required"
  { [ "$J2_CF" = "$J2_FEAT" ] && [ "$J2_CS" = "$J2_STORIES" ] && [ "$J2_CA" = "$J2_ACT" ]; } || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: metadata.counts disagree with the emitted arrays (claimed ${J2_CF:-?}/${J2_CS:-?}/${J2_CA:-?} vs actual ${J2_FEAT:-?}/${J2_STORIES:-?}/${J2_ACT:-?})"
  J2_SC=$(printf '%s\n' "$J2_OUT" | sed -n '/^SC_START$/,/^SC_END$/p' | sed '1d;$d' | sort -u)
  J2_SC_DIFF=$(printf '%s\n%s\n' "$J2_SC" "$(printf '%s\n' "$SC_ROSTER" | sort -u)" | grep -E '^SC' | sort | uniq -u | tr '\n' ' ')
  [ -z "$J2_SC_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: foundation carries.sc_ids differs from the canonical SC roster — symmetric difference: $J2_SC_DIFF"
  J2_SIDS=$(printf '%s\n' "$J2_OUT" | sed -n '/^STORY_IDS_START$/,/^STORY_IDS_END$/p' | sed '1d;$d' | sort -u)
  if [ "$J2_SIDS" != "$(printf '%s\n' "$SPEC_ROSTER" | sort -u)" ]; then
    J2_SID_DIFF=$(printf '%s\n%s\n' "$J2_SIDS" "$(printf '%s\n' "$SPEC_ROSTER" | sort -u)" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-2: story id set differs from the canonical SPEC roster — sample symmetric difference: $J2_SID_DIFF"
  fi
fi
```

### Shared CSV extraction pass (JIRA-3..JIRA-8)

The CSV is read **once**, by one `node -e` invocation holding the pinned RFC-4180 reader
(the §1 analogue: derive once, then let every rule consume). Two bash preambles feed it:

- **JIRA-5's verbatim sample** is chosen first, from the canonical files, deterministically:
  up to 24 AC IDs at an even stride across the sorted roster, restricted to lines where every
  compliant render is byte-determined — D6 permits two render paths (copy-and-translate, or
  reassembly from the structured clauses), and on the ~81 lines with a quote-hugging
  delimiter (`," when ` / `," then `) or with emphasis inside the clause the two paths differ
  by a character, so those lines are excluded from the character-level sample.
- The sample expansion `$JIRA_AC_SAMPLE` is deliberately **unquoted** (IDs contain no
  whitespace; each becomes one argv entry).

```bash
CSV="$EXPORT_DIR/jira-import.csv"
JIRA_AC_SAMPLE=$(grep -rhE '^\*\*FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2,3}:\*\* Given ' \
  "$N2B"/specifications/FEAT-*/ \
  | grep -vE ',(") (when|then) ' | grep -vE '(\*\*.*){3}' \
  | sed -E 's/^\*\*(FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2,3}):\*\*.*/\1/' | sort -u \
  | awk 'BEGIN{n=0}{a[++n]=$0}END{s=int(n/24); if(s<1)s=1; for(i=1;i<=n;i+=s) print a[i]}' \
  | head -24)
JIRA_CSV_OK=0
if ! JIRA_CSV_OUT=$(node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
const samples = process.argv.slice(2);
// RFC-4180 reader: quoted fields, doubled-quote escapes, embedded commas/newlines, CRLF rows
const rows = []; let row = [], f = "", q = false, unterminated = false;
for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (q) {
    if (c === "\"") { if (text[i + 1] === "\"") { f += "\""; i++; } else q = false; }
    else f += c;
  }
  else if (c === "\"") q = true;
  else if (c === ",") { row.push(f); f = ""; }
  else if (c === "\n" || c === "\r") {
    if (c === "\r" && text[i + 1] === "\n") i++;
    row.push(f); rows.push(row); row = []; f = "";
  }
  else f += c;
}
if (q) unterminated = true;
if (f !== "" || row.length) { row.push(f); rows.push(row); }
console.log("UNTERMINATED=" + (unterminated ? 1 : 0));
if (unterminated) process.exit(0);
const hdr = rows[0] || [];
console.log("NCOLS=" + hdr.length);
hdr.forEach(h => console.log("HDRF=" + h));
const data = rows.slice(1).filter(r => !(r.length === 1 && r[0] === ""));
console.log("NROWS=" + data.length);
const ragged = data.map((r, i) => ({ i: i + 2, n: r.length })).filter(x => x.n !== hdr.length);
console.log("RAGGED=" + ragged.length);
console.log("RAGGED_SAMPLE=" + ragged.slice(0, 5).map(x => "line " + x.i + " (" + x.n + " fields)").join("; "));
const iID = hdr.indexOf("Issue ID"), iType = hdr.indexOf("Issue Type"),
      iParent = hdr.indexOf("Parent"), iSum = hdr.indexOf("Summary"), iDesc = hdr.indexOf("Description");
const blocksIdx = hdr.map((h, i) => h === "blocks" ? i : -1).filter(i => i >= 0);
console.log("CORE_COLS=" + ((iID < 0 || iType < 0 || iParent < 0 || iSum < 0 || iDesc < 0) ? 0 : 1));
if (iID < 0 || iType < 0 || iParent < 0 || iSum < 0 || iDesc < 0) process.exit(0);
const get = (r, i) => (i >= 0 && i < r.length ? r[i] : "");
const ids = data.map(r => get(r, iID));
const idSet = new Set(ids.filter(x => x !== ""));
console.log("DUP_IDS=" + (ids.filter(x => x !== "").length - idSet.size));
const idPos = new Map(); ids.forEach((x, i) => { if (!idPos.has(x)) idPos.set(x, i); });
let unresolved = [], forward = [];
data.forEach((r, i) => {
  const p = get(r, iParent);
  if (p !== "") {
    if (!idSet.has(p)) unresolved.push("row " + (i + 2) + " Parent=" + p);
    else if (idPos.get(p) > i) forward.push("row " + (i + 2) + " Parent=" + p);
  }
});
console.log("PARENT_UNRESOLVED=" + unresolved.length);
console.log("PARENT_UNRESOLVED_SAMPLE=" + unresolved.slice(0, 5).join("; "));
console.log("PARENT_FORWARD=" + forward.length);
console.log("PARENT_FORWARD_SAMPLE=" + forward.slice(0, 5).join("; "));
const epicIdx = [], storyIdx = [];
data.forEach((r, i) => (get(r, iParent) === "" ? epicIdx : storyIdx).push(i));
console.log("EPIC_ROWS=" + epicIdx.length);
console.log("STORY_ROWS=" + storyIdx.length);
console.log("EPIC_AFTER_STORY=" + ((epicIdx.length && storyIdx.length && Math.max(...epicIdx) > Math.min(...storyIdx)) ? 1 : 0));
let badBlocks = [], blockCells = 0;
data.forEach((r, i) => {
  for (const bi of blocksIdx) {
    const v = get(r, bi).trim();
    if (v !== "") { blockCells++; if (!idSet.has(v)) badBlocks.push("row " + (i + 2) + " blocks=" + v); }
  }
});
console.log("BLOCK_CELLS=" + blockCells);
console.log("BLOCKS_UNRESOLVED=" + badBlocks.length);
console.log("BLOCKS_UNRESOLVED_SAMPLE=" + badBlocks.slice(0, 5).join("; "));
const specOnce = /FEAT-\d{2}\.SPEC-\d{3}/;
const specAll = /FEAT-\d{2}\.SPEC-\d{3}/g;
const acAll = /FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2,3}/g;
const fence = "`".repeat(3); // built, never written literally: a literal triple backtick here
                             // would close the enclosing ```bash fence and truncate this rule
const specCount = new Map(); let multi = [];
data.forEach((r, i) => {
  const m = [...new Set(get(r, iSum).match(specAll) || [])];
  if (m.length > 1) multi.push("row " + (i + 2) + ": " + m.join(","));
  m.forEach(x => specCount.set(x, (specCount.get(x) || 0) + 1));
});
console.log("SPEC_MULTI=" + multi.length);
console.log("SPEC_MULTI_SAMPLE=" + multi.slice(0, 3).join("; "));
const dupSpec = [...specCount].filter(([k, v]) => v > 1).map(([k, v]) => k + "(x" + v + ")");
console.log("SPEC_DUP=" + dupSpec.length);
console.log("SPEC_DUP_SAMPLE=" + dupSpec.slice(0, 5).join(" "));
const acSet = new Set(); let over = [], noSrc = [], noAcb = [], leak = [], pg = 0;
data.forEach((r, i) => {
  const d = get(r, iDesc), sum = get(r, iSum);
  // Row-scoped AC coverage: an AC ID counts only inside the Description of the story
  // whose Summary carries that AC ID own SPEC prefix — a cross-referenced AC ID in some
  // other row must NOT satisfy coverage (the AWS-4 lesson applied to ACs).
  const own = (sum.match(specAll) || [])[0];
  if (own) (d.match(acAll) || []).filter(a => a.indexOf(own + "-AC-") === 0).forEach(x => acSet.add(x));
  if (d.length > 30000) over.push("row " + (i + 2) + " (" + d.length + " chars)");
  if (specOnce.test(sum)) {
    if (!/(^|\n)Source: /.test(d)) noSrc.push("row " + (i + 2));
    if (d.indexOf("h2. Acceptance Criteria") < 0) noAcb.push("row " + (i + 2));
  }
  if (/\*\*[^*\n]+\*\*/.test(d)) leak.push("row " + (i + 2) + " **bold**");
  else if (/(^|\n)#{1,6} /.test(d)) leak.push("row " + (i + 2) + " #-heading");
  else if (d.indexOf(fence) >= 0) leak.push("row " + (i + 2) + " code fence");
  if (/[p]rototype-grade/i.test(d)) pg++;
});
console.log("DESC_OVER=" + over.length);
console.log("DESC_OVER_SAMPLE=" + over.slice(0, 5).join("; "));
console.log("NO_SOURCE=" + noSrc.length);
console.log("NO_SOURCE_SAMPLE=" + noSrc.slice(0, 5).join(" "));
console.log("NO_ACBLOCK=" + noAcb.length);
console.log("NO_ACBLOCK_SAMPLE=" + noAcb.slice(0, 5).join(" "));
console.log("MD_LEAK=" + leak.length);
console.log("MD_LEAK_SAMPLE=" + leak.slice(0, 5).join("; "));
console.log("PG_CSV=" + pg);
const fEpic = epicIdx.map(i => data[i]).find(r => get(r, iSum).indexOf("Foundation & Cross-Cutting") >= 0);
console.log("FOUND_EPIC=" + (fEpic ? get(fEpic, iID) : ""));
const fRows = fEpic ? data.filter(r => get(r, iParent) === get(fEpic, iID)) : [];
console.log("FOUND_STORY_ROWS=" + fRows.length);
const xAll = /\b(XBR-\d{2}|ADR-\d{3}|ASMP-\d{2}|SC-\d{2})\b/g;
const fIds = new Set(); const adrSum = new Map();
fRows.forEach(r => {
  ((get(r, iSum) + "\n" + get(r, iDesc)).match(xAll) || []).forEach(x => fIds.add(x));
  // Count OWNERSHIP DECLARATIONS, not mentions. The template pins the declaration form as
  // `*ADR-NNN:* {Decision}` under `h2. Decisions` in the owning stack-layer setup story, so
  // that wiki-bold form is the ownership marker. A bare `ADR-NNN` inside `Rationale:` or
  // `Profile driver:` prose is a legitimate cross-reference (the canonical register writes
  // them that way) and must NOT count as a second owner. Deduped per row so a repeated
  // declaration cannot inflate the count.
  [...new Set(((get(r, iSum) + "\n" + get(r, iDesc)).match(/\*(ADR-\d{3}):\*/g) || [])
    .map(m => m.replace(/[*:]/g, "")))]
    .forEach(x => adrSum.set(x, (adrSum.get(x) || 0) + 1));
});
console.log("VB_START");
for (const sid of samples) {
  let line = null;
  const tag = "*" + sid + ":* Given ";
  for (const r of data) {
    const d = get(r, iDesc); const idx = d.indexOf(tag);
    if (idx >= 0) {
      const end = d.indexOf("\n", idx);
      line = d.slice(idx + tag.length, end < 0 ? d.length : end).replace(/\r$/, "");
      break;
    }
  }
  console.log(sid + "\t" + (line === null ? "<NOT FOUND>" : line));
}
console.log("VB_END");
console.log("ADR_SUM_START");
[...adrSum].sort().forEach(([k, v]) => console.log(k + " " + v));
console.log("ADR_SUM_END");
console.log("FOUND_IDS_START");
[...fIds].sort().forEach(x => console.log(x));
console.log("FOUND_IDS_END");
console.log("SPEC_IDS_START");
[...specCount.keys()].sort().forEach(x => console.log(x));
console.log("SPEC_IDS_END");
console.log("AC_IDS_START");
[...acSet].sort().forEach(x => console.log(x));
console.log("AC_IDS_END");
' "$CSV" $JIRA_AC_SAMPLE 2>&1); then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: jira-import.csv could not be read — $(printf '%s' "$JIRA_CSV_OUT" | head -1)"
elif [ "$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^UNTERMINATED=' | cut -d= -f2)" != "0" ]; then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: jira-import.csv has an unterminated quoted field — the file is not valid RFC-4180"
elif [ "$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^CORE_COLS=' | cut -d= -f2)" != "1" ]; then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: the header lacks one of the six pinned leading columns (Issue ID / Issue Type / Parent / Summary / Description / Priority)"
else
  JIRA_CSV_OK=1
fi
```

When the pass fails, the single JIRA-3 error above is the complete finding — the remaining
CSV rules are skipped via the `JIRA_CSV_OK` guard (an unparseable CSV already fails the
gate; per-rule noise on an unreadable file would only bury the signal).

**JIRA-3 — CSV structural integrity.** Header pinned to the D5 column order (six fixed
columns, then repeated `Labels` columns, then repeated `blocks` columns); every data row has
the header's field count; Issue IDs are unique; every non-empty `Parent` resolves to an
in-file Issue ID **and** appears on an earlier row (the importer processes sequentially);
epic rows precede story rows (D5, highest-level-first); the epic-row count is exactly
`FEAT_COUNT + 1` (feature epics + the foundation epic) and the story-row count is at least
`SPEC_COUNT` (spec stories + the D7 foundation stories):

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_HDR=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^HDRF=' | cut -d= -f2-)
  J_FIRST6=$(printf '%s\n' "$J_HDR" | head -6)
  J_EXPECT6=$(printf 'Issue ID\nIssue Type\nParent\nSummary\nDescription\nPriority')
  [ "$J_FIRST6" = "$J_EXPECT6" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: the first six header columns are not exactly Issue ID / Issue Type / Parent / Summary / Description / Priority (D5 order) — found: $(printf '%s' "$J_FIRST6" | tr '\n' ',')"
  J_REST=$(printf '%s\n' "$J_HDR" | sed '1,6d')
  J_BADCOL=$(printf '%s\n' "$J_REST" | grep -vxE 'Labels|blocks' | grep -c .)
  [ "${J_BADCOL:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: $J_BADCOL header column(s) after Priority are neither Labels nor blocks — found: $(printf '%s\n' "$J_REST" | grep -vxE 'Labels|blocks' | head -3 | tr '\n' ',')"
  printf '%s\n' "$J_REST" | grep -qx 'Labels' || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: no Labels column in the header"
  printf '%s\n' "$J_REST" | grep -qx 'blocks' || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: no blocks column in the header"
  J_MIXED=$(printf '%s\n' "$J_REST" | awk '/^blocks$/{b=1} /^Labels$/ && b {print "yes"; exit}')
  [ -z "$J_MIXED" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: a Labels column appears after the first blocks column — repeated columns stay grouped, Labels then blocks (D5)"
  J_RAGGED=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^RAGGED=' | cut -d= -f2)
  [ "${J_RAGGED:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_RAGGED:-0} data row(s) do not match the header field count — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^RAGGED_SAMPLE=' | cut -d= -f2-)"
  J_DUP=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^DUP_IDS=' | cut -d= -f2)
  [ "${J_DUP:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_DUP:-0} duplicated Issue ID value(s) — Parent and blocks references become ambiguous"
  J_PU=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^PARENT_UNRESOLVED=' | cut -d= -f2)
  [ "${J_PU:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_PU:-0} Parent value(s) resolve to no Issue ID in the file — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^PARENT_UNRESOLVED_SAMPLE=' | cut -d= -f2-)"
  J_PF=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^PARENT_FORWARD=' | cut -d= -f2)
  [ "${J_PF:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_PF:-0} row(s) name a Parent that appears on a LATER row — the importer processes sequentially, parents must come first — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^PARENT_FORWARD_SAMPLE=' | cut -d= -f2-)"
  J_EAS=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^EPIC_AFTER_STORY=' | cut -d= -f2)
  [ "${J_EAS:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: an epic row appears after the first story row — epics before stories (D5, highest-level-first)"
  J_EPICS=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^EPIC_ROWS=' | cut -d= -f2)
  [ "${J_EPICS:-0}" -eq $((FEAT_COUNT + 1)) ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_EPICS:-0} epic rows (empty Parent) vs $((FEAT_COUNT + 1)) expected ($FEAT_COUNT feature epics + 1 foundation epic)"
  J_STORY=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^STORY_ROWS=' | cut -d= -f2)
  [ "${J_STORY:-0}" -ge "$SPEC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-3: ${J_STORY:-0} story rows vs at least $SPEC_COUNT expected (one per canonical spec, plus the D7 foundation stories)"
fi
```

**JIRA-4 — Story-per-spec coverage.** The SPEC ID set extracted from the **Summary column
only** equals the canonical SPEC roster exactly, each ID in exactly one row and each Summary
carrying at most one SPEC ID — a SPEC ID appearing in a Description, a blocks cell, or any
other row must NOT satisfy this rule (that is how a dropped story would hide):

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_SPEC_SET=$(printf '%s\n' "$JIRA_CSV_OUT" | sed -n '/^SPEC_IDS_START$/,/^SPEC_IDS_END$/p' | sed '1d;$d' | sort -u)
  CANON_SPEC_SET=$(printf '%s\n' "$SPEC_ROSTER" | sort -u)
  if [ "$J_SPEC_SET" != "$CANON_SPEC_SET" ]; then
    J_SPEC_DIFF=$(printf '%s\n%s\n' "$J_SPEC_SET" "$CANON_SPEC_SET" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-4: Summary-column SPEC ID set differs from the canonical roster — sample symmetric difference: $J_SPEC_DIFF"
  fi
  J_SPEC_DUP=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^SPEC_DUP=' | cut -d= -f2)
  [ "${J_SPEC_DUP:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-4: SPEC ID(s) claimed by more than one Summary: $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^SPEC_DUP_SAMPLE=' | cut -d= -f2-)"
  J_SPEC_MULTI=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^SPEC_MULTI=' | cut -d= -f2)
  [ "${J_SPEC_MULTI:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-4: row(s) whose Summary carries more than one SPEC ID — one story per spec: $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^SPEC_MULTI_SAMPLE=' | cut -d= -f2-)"
fi
```

**JIRA-5 — AC verbatim coverage.** Count **and set** equality of AC IDs against the
canonical roster, where an AC ID counts only inside its owning story's Description (the
row-scoped extraction above — cross-references in other stories never satisfy coverage);
then the bounded verbatim sample: for each sampled AC ID, the clause text after
`*{AC-ID}:* Given ` in the story Description must equal the canonical spec line's text
after `Given ` character-for-character:

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_AC_IDS=$(printf '%s\n' "$JIRA_CSV_OUT" | sed -n '/^AC_IDS_START$/,/^AC_IDS_END$/p' | sed '1d;$d' | sort -u)
  J_AC_N=$(printf '%s\n' "$J_AC_IDS" | grep -c .)
  [ "${J_AC_N:-0}" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-5: owning-story Descriptions carry ${J_AC_N:-0} distinct AC IDs vs $AC_COUNT canonical (row-scoped scan — an AC ID cross-referenced in another story does not count)"
  J_CANON_AC=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2,3}' "$N2B"/specifications/FEAT-*/ | sort -u)
  if [ "$J_AC_IDS" != "$J_CANON_AC" ]; then
    J_AC_DIFF=$(printf '%s\n%s\n' "$J_AC_IDS" "$J_CANON_AC" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-5: AC ID set differs from the canonical roster — sample symmetric difference: $J_AC_DIFF"
  fi
  J_VB=$(printf '%s\n' "$JIRA_CSV_OUT" | sed -n '/^VB_START$/,/^VB_END$/p' | sed '1d;$d')
  while IFS= read -r VBLINE; do
    [ -z "$VBLINE" ] && continue
    SID=$(printf '%s' "$VBLINE" | cut -f1)
    GOT=$(printf '%s' "$VBLINE" | cut -f2-)
    if [ "$GOT" = "<NOT FOUND>" ]; then
      GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-5: sampled $SID has no \"*$SID:* Given\" line in its story Description"
      continue
    fi
    WANT=$(grep -rh "^\*\*${SID}:\*\* Given " "$N2B"/specifications/FEAT-*/ | head -1 \
      | sed -E 's/^\*\*FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2,3}:\*\* Given //')
    [ "$GOT" = "$WANT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-5: $SID clause text differs from the canonical spec line (character-level check failed)"
  done <<EOF
$J_VB
EOF
fi
```

**JIRA-6 — Relationship fidelity.** Every `blocks` cell resolves to an in-file Issue ID; the
non-empty `blocks` cell count equals backlog.json's `type == "blocks"` edge count (an export
with silently emptied link columns must not pass); no `is blocked by`-style column exists
(outward-only, D5); and the `relationships.md` mutual-pair disclosure is **symmetric** with
the canonical dependency map — every disclosed pair is genuinely bidirectional AND every
genuinely bidirectional pair is disclosed. (A shipped export in a prior phase disclosed
FEAT-03 ↔ FEAT-07 as mutual when FEAT-07 does not depend on FEAT-03, and the gate missed
it; the symmetric-difference check below catches both failure directions.) The canonical
mutual set is derived from the Features table's `Depends On` column, header-indexed —
never from the export under test; a disclosure is any `FEAT-AA ↔ FEAT-BB` token in
`relationships.md` (the ↔ glyph is the house disclosure token and inherently asserts
mutuality wherever it appears):

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_BB=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^BLOCKS_UNRESOLVED=' | cut -d= -f2)
  [ "${J_BB:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-6: ${J_BB:-0} blocks cell(s) resolve to no Issue ID in the file — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^BLOCKS_UNRESOLVED_SAMPLE=' | cut -d= -f2-)"
  if [ -n "${J2_EBLOCKS:-}" ]; then
    J_BC=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^BLOCK_CELLS=' | cut -d= -f2)
    [ "${J_BC:-0}" -eq "$J2_EBLOCKS" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-6: ${J_BC:-0} non-empty blocks cells vs $J2_EBLOCKS blocks-type edges in backlog.json — links were dropped or invented"
  fi
  J_BLOCKED_HDR=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^HDRF=' | cut -d= -f2- | grep -ci 'blocked')
  [ "${J_BLOCKED_HDR:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-6: an is-blocked-by-style column exists in the header — links are outward-only (D5); mirrors would double every link on import"
fi
J_DEP_EDGES=$(awk -F'|' '
  !dcol && /^\|/ && $0 ~ /Depends On/ { for(i=1;i<=NF;i++){h=$i; gsub(/^ +| +$/,"",h); if(h=="Depends On") dcol=i; if(h=="Number") ncol=i} next }
  dcol && /^\|/ { id=$ncol; gsub(/ /,"",id); if(id !~ /^FEAT-[0-9][0-9]$/) next;
    n=split($dcol, a, ","); for(j=1;j<=n;j++){gsub(/ /,"",a[j]); if(a[j] ~ /^FEAT-[0-9][0-9]$/) print id" "a[j]} }' \
  "$N2B/specifications/feature-dependency-map.md")
J_CANON_MUTUAL=$(printf '%s\n' "$J_DEP_EDGES" | sort -u \
  | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort | uniq -d)
J_DISCLOSED=$(grep -oE 'FEAT-[0-9]{2} *↔ *FEAT-[0-9]{2}' "$EXPORT_DIR/relationships.md" 2>/dev/null \
  | sed -E 's/ *↔ */ /' | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort -u)
J_MUT_DIFF=$(printf '%s\n%s\n' "$J_DISCLOSED" "$J_CANON_MUTUAL" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ';')
[ -z "$J_MUT_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-6: relationships.md mutual-pair disclosure is not symmetric with the dependency map — each of these pairs is disclosed-but-not-mutual or mutual-but-undisclosed: $J_MUT_DIFF"
```

**JIRA-7 — Description budget + markup.** No Description exceeds the 30,000-character hard
cap (Jira Cloud rejects >32,767 and Excel truncates at the same limit); every spec-story row
(Summary carries a SPEC ID) has a `Source:` pointer line and an `h2. Acceptance Criteria`
block; no Description leaks Markdown (`**bold**`, a line-initial `#` heading, or a triple
backtick fence — the importer renders wiki markup only, JRACLOUD-79205); and zero
occurrences of the banned legacy phrase (the U6 tripwire extended to the CSV payload, which
U6's `*.md` scope cannot see — a hit is an upstream-document defect, same carve-out):

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_OVER=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^DESC_OVER=' | cut -d= -f2)
  [ "${J_OVER:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-7: ${J_OVER:-0} Description(s) exceed 30,000 characters — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^DESC_OVER_SAMPLE=' | cut -d= -f2-)"
  J_NOSRC=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^NO_SOURCE=' | cut -d= -f2)
  [ "${J_NOSRC:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-7: ${J_NOSRC:-0} spec-story Description(s) lack a Source: pointer — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^NO_SOURCE_SAMPLE=' | cut -d= -f2-)"
  J_NOACB=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^NO_ACBLOCK=' | cut -d= -f2)
  [ "${J_NOACB:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-7: ${J_NOACB:-0} spec-story Description(s) lack an h2. Acceptance Criteria block — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^NO_ACBLOCK_SAMPLE=' | cut -d= -f2-)"
  J_LEAK=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^MD_LEAK=' | cut -d= -f2)
  [ "${J_LEAK:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-7: ${J_LEAK:-0} Description(s) leak Markdown into wiki markup — $(printf '%s\n' "$JIRA_CSV_OUT" | grep '^MD_LEAK_SAMPLE=' | cut -d= -f2-)"
  J_PG=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^PG_CSV=' | cut -d= -f2)
  [ "${J_PG:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-7: ${J_PG:-0} Description(s) carry the banned legacy phrase — the source document must be fixed upstream, then the export refreshed"
fi
```

**JIRA-8 — Foundation coverage.** The foundation epic row exists (an epic row whose Summary
carries `Foundation & Cross-Cutting`, the C-26 §3.2 literal); every XBR / ADR / ASMP / SC ID
appears in at least one foundation-story row (rows parented to the foundation epic — bounded
to those rows, not a whole-CSV grep); and every ADR ID is **owned by exactly one** stack-layer
setup story, ownership declared in the story's Summary. The ownership count reads Summaries
only because the canonical ADR register cross-references other ADRs inside decision text
(e.g. Homely ADR-018 cites ADR-001/ADR-002) — a Description-wide exactly-once count would
false-fail a compliant render:

```bash
if [ "$JIRA_CSV_OK" -eq 1 ]; then
  J_FEPIC=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^FOUND_EPIC=' | cut -d= -f2)
  J_FROWS=$(printf '%s\n' "$JIRA_CSV_OUT" | grep '^FOUND_STORY_ROWS=' | cut -d= -f2)
  if [ -z "$J_FEPIC" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-8: no epic row with Summary containing Foundation & Cross-Cutting — the foundation epic is missing"
  elif [ "${J_FROWS:-0}" -eq 0 ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-8: the foundation epic (Issue ID $J_FEPIC) has zero child story rows — the D7 foundation stories are missing"
  else
    J_FIDS=$(printf '%s\n' "$JIRA_CSV_OUT" | sed -n '/^FOUND_IDS_START$/,/^FOUND_IDS_END$/p' | sed '1d;$d')
    for ID in $XBR_ROSTER $ADR_ROSTER $ASMP_ROSTER $SC_ROSTER; do
      printf '%s\n' "$J_FIDS" | grep -qx "$ID" \
        || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-8: $ID missing from the foundation stories"
    done
    J_ADR_SUM=$(printf '%s\n' "$JIRA_CSV_OUT" | sed -n '/^ADR_SUM_START$/,/^ADR_SUM_END$/p' | sed '1d;$d')
    for ID in $ADR_ROSTER; do
      N_OWN=$(printf '%s\n' "$J_ADR_SUM" | awk -v id="$ID" '$1==id{print $2}')
      [ "${N_OWN:-0}" -eq 1 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-8: $ID is claimed by ${N_OWN:-0} foundation story rows — each ADR must be owned by exactly one stack-layer setup story (D7). 0 means no setup story carries it; >1 means the ADR register was duplicated across stories instead of split by stack layer"
    done
  fi
fi
```

**JIRA-9 — Blueprint-copy byte fidelity.** The AWS-2 idiom verbatim — same awk row
extraction, same heredoc loop, same trailing count check; only the rule name differs:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-9: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-9: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  JIRA-9: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

(Extra files beyond the inventory are surfaced by the count mismatch; judging them is 4b's
concern.)

---

## 9. Target Rules — `backlog`

Run after U1–U6 for a `backlog` render. The §1 roster variables and the §8 `PKG_VERSION`
derivation apply here identically (re-derive `PKG_VERSION` if this run did not execute §8 —
the line is the same). As with `jira`, the payload is CSV + JSON outside the universal
rules' `*.md` scope and U1–U4 are satisfied structurally by the `docs/blueprint/` copy —
**BL-2..BL-4 are the only checks standing between a dropped story and a passing gate.** The
whole claim of this target is that dependency edges survive in the artifacts even though
tracker importers drop them — BL-4 gates exactly that. `$U5_EXCLUDES` is empty (D12); a U6
hit remains an upstream-document defect per the §2 carve-out. The CSV is parsed only by the
pinned RFC-4180 reader — never `cut` or `awk -F','`.

**BL-1 — File completeness.** Every C-34 rendered file exists and is non-empty:

```bash
for F in README.md backlog.json backlog.csv; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-1: $F missing or empty"
done
```

**BL-2 — backlog.json integrity.** Identical to JIRA-2 — run the JIRA-2 block verbatim
against `$EXPORT_DIR/backlog.json` with every rule name and variable prefix changed
`JIRA-2`/`J2_` → `BL-2`/`BL2_` (so a combined run's variables never collide). All checks,
comparisons, and evidence messages are the same.

### Shared backlog.csv extraction pass (BL-3/BL-4)

One `node -e` invocation parses `backlog.csv` with the pinned RFC-4180 reader and reads
`backlog.json` alongside it (BL-2 has already gated the JSON's integrity against the
canonical rosters, so it is a valid comparison baseline here). AC and dependency extraction
is **row-scoped by regex within the named column's cells** — separator-agnostic and immune
to commas inside descriptions:

```bash
BCSV="$EXPORT_DIR/backlog.csv"
BL_CSV_OK=0
if ! BL_CSV_OUT=$(node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
const bj = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// RFC-4180 reader — same as the section 8 pass
const rows = []; let row = [], f = "", q = false, unterminated = false;
for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (q) {
    if (c === "\"") { if (text[i + 1] === "\"") { f += "\""; i++; } else q = false; }
    else f += c;
  }
  else if (c === "\"") q = true;
  else if (c === ",") { row.push(f); f = ""; }
  else if (c === "\n" || c === "\r") {
    if (c === "\r" && text[i + 1] === "\n") i++;
    row.push(f); rows.push(row); row = []; f = "";
  }
  else f += c;
}
if (q) unterminated = true;
if (f !== "" || row.length) { row.push(f); rows.push(row); }
console.log("UNTERMINATED=" + (unterminated ? 1 : 0));
if (unterminated) process.exit(0);
const hdr = rows[0] || [];
hdr.forEach(h => console.log("HDRF=" + h));
const data = rows.slice(1).filter(r => !(r.length === 1 && r[0] === ""));
console.log("NROWS=" + data.length);
const ragged = data.map((r, i) => ({ i: i + 2, n: r.length })).filter(x => x.n !== hdr.length);
console.log("RAGGED=" + ragged.length);
console.log("RAGGED_SAMPLE=" + ragged.slice(0, 5).map(x => "line " + x.i + " (" + x.n + " fields)").join("; "));
const iId = hdr.indexOf("id"), iParent = hdr.indexOf("parent_id"),
      iAc = hdr.indexOf("ac_ids"), iDep = hdr.indexOf("depends_on"), iDesc = hdr.indexOf("description");
console.log("CORE_COLS=" + ((iId < 0 || iParent < 0 || iAc < 0 || iDep < 0 || iDesc < 0) ? 0 : 1));
if (iId < 0 || iParent < 0 || iAc < 0 || iDep < 0 || iDesc < 0) process.exit(0);
const get = (r, i) => (i >= 0 && i < r.length ? r[i] : "");
const ids = data.map(r => get(r, iId));
const idSet = new Set(ids.filter(x => x !== ""));
console.log("DUP_IDS=" + (ids.filter(x => x !== "").length - idSet.size));
console.log("EXPECTED_ROWS=" + ((bj.epics || []).length + (bj.stories || []).length));
const jsonIds = new Set([...(bj.epics || []), ...(bj.stories || [])].map(x => String(x.id)));
const idDiff = [...new Set([...idSet, ...jsonIds])].filter(x => !(idSet.has(x) && jsonIds.has(x))).sort();
console.log("ID_DIFF=" + idDiff.length);
console.log("ID_DIFF_SAMPLE=" + idDiff.slice(0, 10).join(" "));
// parent_id must resolve to an in-file id whose own row has an empty parent_id (an epic row)
const parentOf = new Map(); data.forEach(r => { if (get(r, iId) !== "") parentOf.set(get(r, iId), get(r, iParent)); });
let badParent = [];
data.forEach((r, i) => {
  const p = get(r, iParent);
  if (p !== "" && (!idSet.has(p) || parentOf.get(p) !== "")) badParent.push("row " + (i + 2) + " parent_id=" + p);
});
console.log("PARENT_BAD=" + badParent.length);
console.log("PARENT_BAD_SAMPLE=" + badParent.slice(0, 5).join("; "));
// Row-scoped AC coverage from the ac_ids column: an AC ID counts only on the row whose id is its own SPEC prefix
const acAll = /FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2,3}/g;
const acSet = new Set(); let pg = 0;
data.forEach(r => {
  const own = get(r, iId);
  (get(r, iAc).match(acAll) || []).filter(a => a.indexOf(own + "-AC-") === 0).forEach(x => acSet.add(x));
  if (/[p]rototype-grade/i.test(get(r, iDesc))) pg++;
});
console.log("PG_CSV=" + pg);
// depends_on edges vs the backlog.json is-blocked-by edge set
const idTok = /FEAT-\d{2}(\.SPEC-\d{3})?|\bFOUNDATION\b/g;
const csvEdges = new Set(); let badDep = [], foundationDep = 0;
data.forEach((r, i) => {
  const from = get(r, iId);
  for (const m of (get(r, iDep).match(idTok) || [])) {
    if (m === "FOUNDATION") { foundationDep++; continue; }
    if (!idSet.has(m)) { badDep.push("row " + (i + 2) + " depends_on=" + m); continue; }
    csvEdges.add(from + " -> " + m);
  }
});
console.log("DEP_UNRESOLVED=" + badDep.length);
console.log("DEP_UNRESOLVED_SAMPLE=" + badDep.slice(0, 5).join("; "));
console.log("DEP_FOUNDATION=" + foundationDep);
const jsonEdges = new Set((bj.dependency_edges || [])
  .filter(e => e.type === "is-blocked-by").map(e => e.from + " -> " + e.to));
const onlyCsv = [...csvEdges].filter(e => !jsonEdges.has(e)).sort();
const onlyJson = [...jsonEdges].filter(e => !csvEdges.has(e)).sort();
console.log("CSV_EDGES=" + csvEdges.size);
console.log("JSON_EDGES=" + jsonEdges.size);
console.log("EDGE_ONLY_CSV=" + onlyCsv.length);
console.log("EDGE_ONLY_CSV_SAMPLE=" + onlyCsv.slice(0, 5).join("; "));
console.log("EDGE_ONLY_JSON=" + onlyJson.length);
console.log("EDGE_ONLY_JSON_SAMPLE=" + onlyJson.slice(0, 5).join("; "));
console.log("AC_IDS_START");
[...acSet].sort().forEach(x => console.log(x));
console.log("AC_IDS_END");
' "$BCSV" "$EXPORT_DIR/backlog.json" 2>&1); then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: backlog.csv could not be read (or backlog.json failed to parse) — $(printf '%s' "$BL_CSV_OUT" | head -1)"
elif [ "$(printf '%s\n' "$BL_CSV_OUT" | grep '^UNTERMINATED=' | cut -d= -f2)" != "0" ]; then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: backlog.csv has an unterminated quoted field — the file is not valid RFC-4180"
elif [ "$(printf '%s\n' "$BL_CSV_OUT" | grep '^CORE_COLS=' | cut -d= -f2)" != "1" ]; then
  GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: the header lacks one of the pinned columns (id / parent_id / description / ac_ids / depends_on)"
else
  BL_CSV_OK=1
fi
```

**BL-3 — CSV coverage + integrity.** The header is exactly the ten pinned C-34 columns in
order; every data row matches the header's field count; ids are unique; the row count equals
epics + stories in `backlog.json`; the `id` column set equals the union of epic and story
ids (symmetric-difference evidence); every non-empty `parent_id` resolves to an epic row in
the file; the `ac_ids` column reconciles against the canonical AC roster (row-scoped: an AC
ID counts only on its own story's row); and the banned-legacy-phrase tripwire covers the
descriptions the `*.md`-scoped U6 cannot see:

```bash
if [ "$BL_CSV_OK" -eq 1 ]; then
  BL_HDR=$(printf '%s\n' "$BL_CSV_OUT" | grep '^HDRF=' | cut -d= -f2-)
  BL_EXPECT_HDR=$(printf 'id\ntype\nparent_id\ntitle\npriority\nspec_type\ndescription\nac_ids\ndepends_on\nsource_path')
  [ "$BL_HDR" = "$BL_EXPECT_HDR" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: header is not exactly the ten pinned C-34 columns in order — found: $(printf '%s' "$BL_HDR" | tr '\n' ',')"
  BL_RAGGED=$(printf '%s\n' "$BL_CSV_OUT" | grep '^RAGGED=' | cut -d= -f2)
  [ "${BL_RAGGED:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: ${BL_RAGGED:-0} data row(s) do not match the header field count — $(printf '%s\n' "$BL_CSV_OUT" | grep '^RAGGED_SAMPLE=' | cut -d= -f2-)"
  BL_DUP=$(printf '%s\n' "$BL_CSV_OUT" | grep '^DUP_IDS=' | cut -d= -f2)
  [ "${BL_DUP:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: ${BL_DUP:-0} duplicated id value(s) in the id column"
  BL_NROWS=$(printf '%s\n' "$BL_CSV_OUT" | grep '^NROWS=' | cut -d= -f2)
  BL_EXPECT=$(printf '%s\n' "$BL_CSV_OUT" | grep '^EXPECTED_ROWS=' | cut -d= -f2)
  [ "${BL_NROWS:-0}" -eq "${BL_EXPECT:-0}" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: backlog.csv has ${BL_NROWS:-0} data rows vs ${BL_EXPECT:-0} epics + stories in backlog.json"
  BL_IDD=$(printf '%s\n' "$BL_CSV_OUT" | grep '^ID_DIFF=' | cut -d= -f2)
  [ "${BL_IDD:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: id column set differs from backlog.json epics + stories — symmetric difference (${BL_IDD:-0}): $(printf '%s\n' "$BL_CSV_OUT" | grep '^ID_DIFF_SAMPLE=' | cut -d= -f2-)"
  BL_PB=$(printf '%s\n' "$BL_CSV_OUT" | grep '^PARENT_BAD=' | cut -d= -f2)
  [ "${BL_PB:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: ${BL_PB:-0} parent_id value(s) do not resolve to an epic row in the file — $(printf '%s\n' "$BL_CSV_OUT" | grep '^PARENT_BAD_SAMPLE=' | cut -d= -f2-)"
  BL_AC_IDS=$(printf '%s\n' "$BL_CSV_OUT" | sed -n '/^AC_IDS_START$/,/^AC_IDS_END$/p' | sed '1d;$d' | sort -u)
  BL_AC_N=$(printf '%s\n' "$BL_AC_IDS" | grep -c .)
  [ "${BL_AC_N:-0}" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: the ac_ids column carries ${BL_AC_N:-0} distinct AC IDs vs $AC_COUNT canonical (row-scoped scan — an AC ID on another story row does not count)"
  BL_CANON_AC=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2,3}' "$N2B"/specifications/FEAT-*/ | sort -u)
  if [ "$BL_AC_IDS" != "$BL_CANON_AC" ]; then
    BL_AC_DIFF=$(printf '%s\n%s\n' "$BL_AC_IDS" "$BL_CANON_AC" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: ac_ids ID set differs from the canonical roster — sample symmetric difference: $BL_AC_DIFF"
  fi
  BL_PG=$(printf '%s\n' "$BL_CSV_OUT" | grep '^PG_CSV=' | cut -d= -f2)
  [ "${BL_PG:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-3: ${BL_PG:-0} description(s) carry the banned legacy phrase — the source document must be fixed upstream, then the export refreshed"
fi
```

**BL-4 — Edge preservation.** Every `depends_on` entry resolves to an `id` present in the
file; `FOUNDATION` never appears as a dependency (backlog-schema.md §5 — it is never an edge
endpoint); and the distinct `(row id → dependency)` edge set equals backlog.json's
`is-blocked-by` edge set **exactly, in both directions** — an edge in the CSV that the JSON
does not carry is invented, an edge in the JSON that the CSV does not carry is dropped. This
is the target's headline promise (edges survive here even though tracker importers drop
them), so both symmetric-difference directions are evidence-bearing:

```bash
if [ "$BL_CSV_OK" -eq 1 ]; then
  BL_DU=$(printf '%s\n' "$BL_CSV_OUT" | grep '^DEP_UNRESOLVED=' | cut -d= -f2)
  [ "${BL_DU:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-4: ${BL_DU:-0} depends_on entrie(s) resolve to no id in the file — $(printf '%s\n' "$BL_CSV_OUT" | grep '^DEP_UNRESOLVED_SAMPLE=' | cut -d= -f2-)"
  BL_DF=$(printf '%s\n' "$BL_CSV_OUT" | grep '^DEP_FOUNDATION=' | cut -d= -f2)
  [ "${BL_DF:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-4: ${BL_DF:-0} depends_on entrie(s) name FOUNDATION — it is never an edge endpoint (backlog-schema.md §5)"
  BL_EC=$(printf '%s\n' "$BL_CSV_OUT" | grep '^EDGE_ONLY_CSV=' | cut -d= -f2)
  BL_EJ=$(printf '%s\n' "$BL_CSV_OUT" | grep '^EDGE_ONLY_JSON=' | cut -d= -f2)
  BL_NC=$(printf '%s\n' "$BL_CSV_OUT" | grep '^CSV_EDGES=' | cut -d= -f2)
  BL_NJ=$(printf '%s\n' "$BL_CSV_OUT" | grep '^JSON_EDGES=' | cut -d= -f2)
  [ "${BL_EC:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-4: ${BL_EC:-0} depends_on edge(s) exist in the CSV but not in backlog.json (${BL_NC:-0} CSV vs ${BL_NJ:-0} JSON is-blocked-by edges) — invented: $(printf '%s\n' "$BL_CSV_OUT" | grep '^EDGE_ONLY_CSV_SAMPLE=' | cut -d= -f2-)"
  [ "${BL_EJ:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-4: ${BL_EJ:-0} is-blocked-by edge(s) in backlog.json are missing from the CSV depends_on column (${BL_NC:-0} CSV vs ${BL_NJ:-0} JSON) — dropped: $(printf '%s\n' "$BL_CSV_OUT" | grep '^EDGE_ONLY_JSON_SAMPLE=' | cut -d= -f2-)"
fi
```

**BL-5 — Blueprint-copy byte fidelity.** The AWS-2 idiom verbatim, as JIRA-9 — only the
rule name differs:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-5: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-5: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  BL-5: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

(Extra files beyond the inventory are surfaced by the count mismatch; judging them is 4b's
concern.)

---

## 10. Target Rules — vibe packs

Run after U1–U6 for any `*-pack` render (`lovable-pack` / `v0-pack` / `bolt-pack` /
`replit-pack` — one shared rule set for the shared C-35 layout). The §1 roster variables
(`$FEAT_ROSTER`, `$FEAT_COUNT`, `$SPEC_ROSTER`, `$SPEC_COUNT`, `$AC_COUNT`, `$SC_ROSTER`)
are in scope — reuse them, never re-derive. Under the distilled-render + verbatim-copy
contract, U1–U4 are satisfied structurally by the `docs/blueprint/` copy — **VP-2..VP-5
carry the real render-fidelity burden**: they scope themselves to the rendered files, so a
hollowed KNOWLEDGE.md or a dropped feature prompt cannot hide behind the copy. U5 runs with
the requested key's §3 excludes (the wrapper's verbatim SC extract and PROMPTS.md's verbatim
exemplar ACs duplicate canonical text the blueprint copy already carries; KNOWLEDGE.md is
never excluded — condensed labels only, it must add zero — D5), and a U6 hit remains an
upstream-document defect per the §2 carve-out — the copy renders verbatim.

The requested key resolves its wrapper-file set and primary constitution file once, before
any rule (Replit's optional `/.agents/skills/` files are judged by 4b — their presence is
not mechanically required):

```bash
case "$TARGET" in
  lovable-pack) VP_WRAPPERS="AGENTS.md";                           VP_CONST="AGENTS.md" ;;
  v0-pack)      VP_WRAPPERS="INSTRUCTIONS.md";                     VP_CONST="INSTRUCTIONS.md" ;;
  bolt-pack)    VP_WRAPPERS="agents.md .bolt/prompt .bolt/ignore"; VP_CONST="agents.md" ;;
  replit-pack)  VP_WRAPPERS="replit.md";                           VP_CONST="replit.md" ;;
esac
```

These shapes are pinned for every rule below (the template reserves them as its mechanical
anchors — the SK-2 Blueprint-feature-header class — and forbids them anywhere else in the
file):

- **Prompt headers** are `## Prompt 0 — {seed title}` for the Plan-mode seed and
  `## Prompt {n} — {Feature Name} (FEAT-NN)` for the per-feature prompts, with `{n}`
  unpadded (1, 2, … — never 01), the separator an em dash, and the FEAT ID in the header's
  trailing parenthesis. Header-scoped extraction is the only way a prompt is counted or
  attributed — a FEAT ID mentioned in a body never counts (the AWS-4 lesson).
- **Definition-of-done shapes**, inside each per-feature prompt body: one spec line per
  SPEC of the feature — `- FEAT-NN.SPEC-NNN — {n} acceptance criteria ({first AC ID}…{last
  AC ID}) — {copied spec path}`, matched by
  `^- FEAT-[0-9]{2}\.SPEC-[0-9]{3} — [0-9]+ acceptance criteria` (the spec-digest bullets
  are bolded `- **FEAT-…` precisely so they never match this shape) — and exactly one
  per-prompt total line `All {n} acceptance criteria above …`, matched by
  `^All [0-9]+ acceptance criteria above`. The total line is what VP-4 count-extracts per
  prompt (so nothing is summed twice); the per-spec lines reconcile against the feature's
  canonical spec set and against that total.

**VP-1 — File completeness.** `README.md`, `KNOWLEDGE.md`, `PROMPTS.md` non-empty, plus the
requested key's wrapper files present and non-empty:

```bash
for F in README.md KNOWLEDGE.md PROMPTS.md $VP_WRAPPERS; do
  [ -s "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-1: $F missing or empty"
done
```

**VP-2 — Knowledge budget + pointer coverage.** `KNOWLEDGE.md` is at most 10,000 characters
(Lovable's Knowledge-field hard cap — the binding budget for all four keys), and every
content bullet carries a back-reference. A **content bullet** is exactly a line matching
`^[[:space:]]*- ` (a `- ` list item at any nesting depth); headings, blank lines, and prose
are not content bullets, and the template structures every content line as a bullet
precisely so this check stays mechanical — a KNOWLEDGE.md with zero bullets fails the floor
check rather than passing vacuously. A bullet is **referenced** iff it contains a canonical
ID (the `FEAT-` alternation also matches SPEC and AC IDs, whose canonical forms embed the
FEAT prefix) or a `[S: {rel-path}]` source tag. The budget is **byte-measured** (`wc -c`) —
a multi-byte-heavy file (em dashes, arrows) reads higher in bytes than in the characters
Lovable's field actually counts, so byte-counting is the conservative side of the cap; the
template's 8,500–9,500 target band absorbs the difference:

```bash
KN="$EXPORT_DIR/KNOWLEDGE.md"
KN_CHARS=$(wc -c < "$KN" 2>/dev/null | tr -d ' ')
[ "${KN_CHARS:-0}" -le 10000 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-2: KNOWLEDGE.md is $KN_CHARS characters — the hard cap is 10,000 (it must paste into Lovable's Knowledge field)"
KN_BULLETS=$(grep -cE '^[[:space:]]*- ' "$KN" 2>/dev/null)
[ "${KN_BULLETS:-0}" -ge 1 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-2: KNOWLEDGE.md carries zero content bullets — the template structures every content line as a '- ' bullet so pointer coverage stays mechanically checkable"
KN_UNREF=$(grep -E '^[[:space:]]*- ' "$KN" 2>/dev/null \
  | grep -vcE 'FEAT-[0-9]{2}|XBR-[0-9]{2}|ADR-[0-9]{3}|SC-[0-9]{2}|ASMP-[0-9]{2}|\[S: [^]]+\]')
[ "${KN_UNREF:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-2: ${KN_UNREF:-0} content bullet(s) in KNOWLEDGE.md carry no back-reference (no canonical ID, no [S: …] tag) — sample: $(grep -E '^[[:space:]]*- ' "$KN" 2>/dev/null | grep -vE 'FEAT-[0-9]{2}|XBR-[0-9]{2}|ADR-[0-9]{3}|SC-[0-9]{2}|ASMP-[0-9]{2}|\[S: [^]]+\]' | head -3 | cut -c1-60 | tr '\n' ';')"
```

**VP-3 — Prompt-sequence coverage.** `PROMPTS.md` opens with a Plan-mode seed (prompt 0)
and carries exactly one per-feature prompt header per canonical FEAT: header-scoped count ==
`$FEAT_COUNT`, the header FEAT-ID set == the roster (symmetric-difference evidence), and no
FEAT owns two headers. *Ordering correctness* (deps precede, cycle breaks disclosed) is
proven by the generating script's parse-back self-check (D2) and re-verified by 4b — it is
deliberately not re-derived in gate bash:

```bash
PM="$EXPORT_DIR/PROMPTS.md"
grep -qE '^## Prompt 0 — ' "$PM" 2>/dev/null \
  || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-3: PROMPTS.md has no '## Prompt 0 — …' header — the Plan-mode seed prompt is missing"
VP_HDR_FEATS=$(grep -hE '^## Prompt [1-9][0-9]* — .*\(FEAT-[0-9]{2}\)$' "$PM" 2>/dev/null \
  | sed -E 's/^.*\((FEAT-[0-9]{2})\)$/\1/')
VP_HDR_N=$(printf '%s\n' "$VP_HDR_FEATS" | grep -c .)
[ "${VP_HDR_N:-0}" -eq "$FEAT_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-3: ${VP_HDR_N:-0} per-feature prompt headers vs $FEAT_COUNT canonical features (header-scoped count — a FEAT ID mentioned in a prompt body never counts)"
VP_HDR_DUP=$(printf '%s\n' "$VP_HDR_FEATS" | sort | uniq -d | tr '\n' ' ')
[ -z "$VP_HDR_DUP" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-3: FEAT ID(s) owning more than one prompt header: $VP_HDR_DUP"
VP_HDR_SET=$(printf '%s\n' "$VP_HDR_FEATS" | grep -E '^FEAT' | sort -u)
CANON_FEAT_SET=$(printf '%s\n' "$FEAT_ROSTER" | sort -u)
if [ "$VP_HDR_SET" != "$CANON_FEAT_SET" ]; then
  VP_HDR_DIFF=$(printf '%s\n%s\n' "$VP_HDR_SET" "$CANON_FEAT_SET" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ' ')
  GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-3: prompt-header FEAT set differs from the canonical roster — symmetric difference: $VP_HDR_DIFF"
fi
```

**VP-4 — AC attribution + definition-of-done counts.** Every SPEC and AC ID inside prompt
N's body belongs to prompt N's FEAT (prompt-scoped extraction — the Phase 3
Measurable-Outcome misattribution lesson, now a 4a rule); each per-feature prompt's SPEC-ID
set equals the feature's canonical roster (symmetric-difference evidence; only **plain**
SPEC citations count — an AC ID embeds its SPEC string, but a prompt whose digest is gone
and whose done-line AC range is the sole SPEC trace is a hollowed prompt, and must not
pass); each prompt's definition-of-done covers the feature's full spec set (one pinned
spec line per SPEC, whose counts sum to the prompt's pinned total line); each prompt's
total line cites its feature's canonical AC count; and the cited totals sum to `$AC_COUNT`.
Prompt 0 (the Plan seed) is a whole-product summary and is exempt from attribution.
Per-feature canonical AC counts use the §1 AC pattern restricted to the feature's
specifications directory and filtered to the feature's own prefix (cross-referenced foreign
AC IDs inside a spec file never count), so the per-feature counts partition `$AC_COUNT` by
construction. ACs are optional inside prompts per the D2 condensation contract — 4a checks
attribution and counts; clause-level verbatim checking of any transcluded AC text is 4b's
job:

```bash
# Three awk passes, all keyed on the pinned header shape: one attributes every SPEC/AC
# token to the prompt header it appears under; one emits each prompt's total-line count;
# one emits each prompt's definition-of-done spec lines (spec ID + cited count).
VP_IDS=$(awk '
  /^## Prompt 0 — /{cur=""; next}
  /^## Prompt [1-9][0-9]* — .*\(FEAT-[0-9][0-9]\)$/{match($0, /\(FEAT-[0-9][0-9]\)$/); cur=substr($0, RSTART+1, 7); next}
  cur != "" {
    line=$0
    while (match(line, /FEAT-[0-9][0-9]\.SPEC-[0-9][0-9][0-9](-AC-[0-9][0-9][0-9]?)?/)) {
      print cur " " substr(line, RSTART, RLENGTH)
      line = substr(line, RSTART+RLENGTH)
    }
  }' "$PM" | sort -u)
VP_DONE_PAIRS=$(awk '
  /^## Prompt 0 — /{cur=""; next}
  /^## Prompt [1-9][0-9]* — .*\(FEAT-[0-9][0-9]\)$/{match($0, /\(FEAT-[0-9][0-9]\)$/); cur=substr($0, RSTART+1, 7); next}
  cur != "" && /^All [0-9]+ acceptance criteria above/{
    n=$0; sub(/^All /,"",n); sub(/ acceptance criteria above.*/,"",n)
    print cur " " n
  }' "$PM")
VP_DOD_LINES=$(awk '
  /^## Prompt 0 — /{cur=""; next}
  /^## Prompt [1-9][0-9]* — .*\(FEAT-[0-9][0-9]\)$/{match($0, /\(FEAT-[0-9][0-9]\)$/); cur=substr($0, RSTART+1, 7); next}
  cur != "" && /^- FEAT-[0-9][0-9]\.SPEC-[0-9][0-9][0-9] — [0-9]+ acceptance criteria/{
    line=$0
    match(line, /FEAT-[0-9][0-9]\.SPEC-[0-9][0-9][0-9]/); sid=substr(line, RSTART, RLENGTH)
    sub(/^- FEAT-[0-9][0-9]\.SPEC-[0-9][0-9][0-9] — /,"",line); sub(/ acceptance criteria.*/,"",line)
    print cur " " sid " " line
  }' "$PM")
VP_BLEED=$(printf '%s\n' "$VP_IDS" | awk 'substr($2,1,7) != $1 {print $1 " cites " $2}')
VP_BLEED_N=$(printf '%s\n' "$VP_BLEED" | grep -c .)
[ "${VP_BLEED_N:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: ${VP_BLEED_N:-0} SPEC/AC ID(s) appear inside another feature's prompt — sample: $(printf '%s\n' "$VP_BLEED" | head -5 | tr '\n' ';')"
VP_DONE_SUM=0
for FID in $FEAT_ROSTER; do
  P_SPECS=$(printf '%s\n' "$VP_IDS" | awk -v id="$FID" '$1==id && $2 !~ /-AC-/{print $2}' | sort -u)
  C_SPECS=$(printf '%s\n' "$SPEC_ROSTER" | grep "^$FID\." | sort -u)
  if [ "$P_SPECS" != "$C_SPECS" ]; then
    VP_SPEC_DIFF=$(printf '%s\n%s\n' "$P_SPECS" "$C_SPECS" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: $FID prompt SPEC set differs from the feature's canonical roster — symmetric difference: $VP_SPEC_DIFF"
  fi
  DOD_SPECS=$(printf '%s\n' "$VP_DOD_LINES" | awk -v id="$FID" '$1==id{print $2}' | sort -u)
  if [ "$DOD_SPECS" != "$C_SPECS" ]; then
    VP_DOD_DIFF=$(printf '%s\n%s\n' "$DOD_SPECS" "$C_SPECS" | grep -E '^FEAT' | sort | uniq -u | head -10 | tr '\n' ' ')
    GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: $FID definition-of-done spec lines differ from the feature's canonical spec set — symmetric difference: $VP_DOD_DIFF (pinned line shape: - FEAT-NN.SPEC-NNN — {n} acceptance criteria …)"
  fi
  FEAT_AC_N=$(grep -rhoE 'FEAT-[0-9]{2}\.SPEC-[0-9]{3}-AC-[0-9]{2}' "$N2B"/specifications/"$FID"-*/ 2>/dev/null | sort -u | grep -c "^$FID\.")
  CITED=$(printf '%s\n' "$VP_DONE_PAIRS" | awk -v id="$FID" '$1==id{print $2; exit}')
  [ "${CITED:-0}" -eq "${FEAT_AC_N:-0}" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: $FID total line cites ${CITED:-0} acceptance criteria vs ${FEAT_AC_N:-0} canonical for the feature (pinned total-line shape: All {n} acceptance criteria above …)"
  DOD_LINE_SUM=$(printf '%s\n' "$VP_DOD_LINES" | awk -v id="$FID" '$1==id{s+=$3} END{print s+0}')
  [ "${DOD_LINE_SUM:-0}" -eq "${FEAT_AC_N:-0}" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: $FID definition-of-done spec-line counts sum to ${DOD_LINE_SUM:-0} vs ${FEAT_AC_N:-0} canonical for the feature"
  VP_DONE_SUM=$((VP_DONE_SUM + ${CITED:-0}))
done
[ "$VP_DONE_SUM" -eq "$AC_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-4: definition-of-done citations sum to $VP_DONE_SUM vs $AC_COUNT canonical AC IDs"
```

**VP-5 — Scope + posture surfaces.** Every canonical SC-XX ID appears in `KNOWLEDGE.md`
(the condensed-label DO-NOT-BUILD list) AND in the key's primary constitution file (where
the verbatim shell-extracted text lives — verbatim fidelity of the extract is 4b's
spot-check); the constitution file also carries the recommended-architecture-binding line
and the three-way design-posture line (decisions 84/90f):

```bash
CONST="$EXPORT_DIR/$VP_CONST"
for ID in $SC_ROSTER; do
  grep -q "$ID" "$EXPORT_DIR/KNOWLEDGE.md" 2>/dev/null \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-5: $ID missing from KNOWLEDGE.md (the condensed DO-NOT-BUILD label list)"
  grep -q "$ID" "$CONST" 2>/dev/null \
    || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-5: $ID missing from $VP_CONST — the verbatim shell-extracted DO-NOT-BUILD list must carry every n2b SC ID"
done
grep -qiE 'recommended architecture[^.]{0,80}binding|binding[^.]{0,80}recommended architecture' "$CONST" 2>/dev/null \
  || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-5: $VP_CONST lacks the recommended-architecture-binding line (one line stating the recommended architecture is binding; alternatives stay informational)"
grep -qiE 'design[- ](system|posture|agnostic)' "$CONST" 2>/dev/null \
  || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-5: $VP_CONST lacks the design-posture line (supplied dir → binding / legacy design-system.md → compatibility note / neither → design-agnostic)"
```

**VP-6 — Blueprint-copy byte fidelity.** The AWS-2 idiom verbatim, as BL-5 — only the rule
name differs:

```bash
INV_ROWS=$(awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| *Artifact/ && $0 !~ /^\| *-/{print}' "$N2B/tracking/MANIFEST.md")
INV_COUNT=$(printf '%s\n' "$INV_ROWS" | grep -c .)
while IFS= read -r row; do
  [ -z "$row" ] && continue
  rel=$(echo "$row" | awk -F'|' '{v=$2; gsub(/[` ]/, "", v); print v}')
  [ -z "$rel" ] && continue
  if [ ! -f "$EXPORT_DIR/docs/blueprint/$rel" ]; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-6: docs/blueprint/$rel missing from the copy"
  elif ! cmp -s "$N2B/$rel" "$EXPORT_DIR/docs/blueprint/$rel"; then
    GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-6: docs/blueprint/$rel differs from canonical $N2B/$rel — the copy must be byte-identical"
  fi
done <<EOF
$INV_ROWS
EOF
COPIED_COUNT=$(find "$EXPORT_DIR/docs/blueprint" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$COPIED_COUNT" -eq "$INV_COUNT" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-6: docs/blueprint/ holds $COPIED_COUNT files vs $INV_COUNT inventory rows"
```

(Extra files beyond the inventory are surfaced by the count mismatch; judging them is 4b's
concern.)

**VP-7 — No secrets, no leaked settings-as-files.** No credential-shaped token anywhere in
the rendered files (D6 — prompts are pasted into browser tools that store them client-side;
the blueprint copy is excluded because a hit there is an upstream defect the §2 carve-out
class already owns), and the deliberately-absent files are absent — `.lovable/plan.md` is a
community-reported convention the §1 research could not verify and `.bolt/config.json` has
no evidence of existing, so emitting either would assert an unverified mechanism. The
credential regex set is pinned: provider key prefixes (Stripe/OpenAI-style `sk-`/`sk_live_`,
AWS `AKIA`, GitHub `ghp_`/`github_pat_`, Slack `xox`, Google `AIza`), JWT pairs,
private-key headers, and real-looking `KEY=value` assignments (placeholder values with
`<…>` or `{…}` do not match the value class):

```bash
VP_CRED=$(grep -rhoE 'sk-[A-Za-z0-9_-]{20,}|sk_(live|test)_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|(ghp|gho|ghu|ghs)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{22,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|(API_KEY|SECRET_KEY|ACCESS_TOKEN|PASSWORD)=[A-Za-z0-9_/+-]{12,}' \
  "$EXPORT_DIR" --exclude-dir=blueprint --exclude=FIDELITY-REPORT.md --exclude=EXPORT-RECEIPT.md 2>/dev/null \
  | wc -l | tr -d ' ')
[ "${VP_CRED:-0}" -eq 0 ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-7: ${VP_CRED:-0} credential-shaped token(s) in the rendered files — nothing secret-shaped may ship in a pack that gets pasted into a browser tool"
for F in .lovable/plan.md .bolt/config.json; do
  [ ! -e "$EXPORT_DIR/$F" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-7: $F exists — deliberately not emitted (C-35: unverified convention); remove it"
done
```

**VP-8 — Mutual-disclosure symmetry.** The AWS-6 idiom on `PROMPTS.md` — every
`FEAT-AA ↔ FEAT-BB` token must be a genuinely bidirectional pair of the canonical
dependency map, and every genuinely bidirectional pair must be disclosed in the intro's
order notes (every mutual pair always surfaces as a `BROKEN … MUTUAL` row — decision
104); FORWARD breaks use the directional shape and never carry `↔` (the pinned script's
check mode enforces the same rule at authoring time — this is the gate-side re-check):

```bash
VP8_DEP_EDGES=$(awk -F'|' '
  !dcol && /^\|/ && $0 ~ /Depends On/ { for(i=1;i<=NF;i++){h=$i; gsub(/^ +| +$/,"",h); if(h=="Depends On") dcol=i; if(h=="Number") ncol=i} next }
  dcol && /^\|/ { id=$ncol; gsub(/ /,"",id); if(id !~ /^FEAT-[0-9][0-9]$/) next;
    n=split($dcol, a, ","); for(j=1;j<=n;j++){gsub(/ /,"",a[j]); if(a[j] ~ /^FEAT-[0-9][0-9]$/) print id" "a[j]} }' \
  "$N2B/specifications/feature-dependency-map.md")
VP8_CANON_MUTUAL=$(printf '%s\n' "$VP8_DEP_EDGES" | sort -u \
  | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort | uniq -d)
VP8_DISCLOSED=$(grep -oE 'FEAT-[0-9]{2} *↔ *FEAT-[0-9]{2}' "$EXPORT_DIR/PROMPTS.md" 2>/dev/null \
  | sed -E 's/ *↔ */ /' | awk '{print ($1<$2)? $1" ↔ "$2 : $2" ↔ "$1}' | sort -u)
VP8_DIFF=$(printf '%s\n%s\n' "$VP8_DISCLOSED" "$VP8_CANON_MUTUAL" | grep -E '^FEAT' | sort | uniq -u | tr '\n' ';')
[ -z "$VP8_DIFF" ] || GATE_ERRORS="$GATE_ERRORS\n  ✗  VP-8: PROMPTS.md mutual-pair disclosure is not symmetric with the dependency map — each of these pairs is disclosed-but-not-mutual or mutual-but-undisclosed: $VP8_DIFF"
```

---

## What This Reference Does NOT Own

| Concern | Owner |
|---------|-------|
| Executing the rules, the `GATE_ERRORS` re-prompt loop (max 3), banners, halts | `n2b/workflows/stage-5/export.md` (Step 4a) |
| Semantic review — verbatim ACs, untruncated tables, equal-depth alternatives, design posture, glue-prose discipline | `n2b/agents/stage-5/export-fidelity-checker.md` (Step 4b) |
| FIDELITY-REPORT.md §1 rows (expected/found per rule) | Workflow appends after the gate settles (template: `n2b/templates/stage-5/fidelity-report.md`) |
| MANIFEST.md refresh, `package_version` bump | Workflow Step 2 (package indexing — contract C-04) |
| Receipts and tracking writes | Workflow Step 5 (`export-complete` transition, `n2b/references/tracking-protocol.md`) |
