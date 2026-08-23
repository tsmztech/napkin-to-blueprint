<!-- Export Template: Consolidated PRD (`prd`)

     This template is the output blueprint for the `prd` export target. It defines a small
     DIRECTORY of files (the C-32 layout) built around one consolidated PRD.md in Task
     Master's parse-prd skeleton with BMAD-friendly numbered requirement lists, plus the
     architecture.md pair file BMAD v6 ingests alongside it. It is consumed by
     export-prd-formatter.md, spawned by n2b/workflows/stage-5/export.md, and gated by the
     rules in n2b/references/stage-5/fidelity-rules.md (prd row = condensation +
     verbatim-copy contract, target rules PR-1..PR-7).

     Governing rules:
     - RENDERING UNDER A CONDENSATION CONTRACT. PRD.md and architecture.md are CONDENSED
       renders: the formatter digests canonical content into a consumer-shaped document,
       but every FEAT / SPEC / ADR / ASMP / XBR / SC ID that appears is verbatim, every
       table row that carries an ID comes from the pinned script (extracted, never
       retyped), and acceptance criteria are NEVER transcluded into PRD.md — full depth
       lives in the docs/blueprint/ copy. Any AC text that does appear must be verbatim.
     - BYTE-IDENTICAL COPY. The blueprint moves under `docs/blueprint/` by SHELL `cp`,
       manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every copied
       file with `cmp` (PR-5, the AWS-2 idiom). The copy is what satisfies U1–U4
       structurally; the rendered documents stay lean on purpose.
     - SCRIPT-BUILT TABLES. The Logical Dependency Chain rows, the Appendix spec-inventory
       rows, the per-feature order, and the ADR registry rows come from ONE Node-builtins
       script (pinned below) that parses the canonical files directly — IDs, names, types,
       and counts extracted programmatically, never retyped through the model.
     - ONE PRD SERVES TWO CONSUMERS. Task Master's `parse-prd` reads PRD.md alone; BMAD v6
       `bmad-create-epics-and-stories` takes exactly the PRD.md + architecture.md pair from
       `_bmad-output/planning-artifacts/`. The divergence is shape, not substance — the
       skeleton is Task Master's, the numbered FR/NFR lists are BMAD's convention. Never
       build to BMAD v4's `docs/prd.md` + sharding layout; v6 replaced it.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (normally `.n2b/exports/prd/`).
-->

# Export Template: Consolidated PRD (`prd`)

## Output Layout

The export directory holds one PRD, its architecture pair file, and the full-depth blueprint
copy (contract C-32):

```
.n2b/exports/prd/
  README.md                # authored: per-tool import paths — Task Master / BMAD v6 / chat-attach
  PRD.md                   # authored around script rows: <context> + <PRD> skeleton, eight H1 sections, ≤ 100,000 chars
  architecture.md          # authored around script rows: recommended architecture + stack + data model + full ADR registry
  docs/
    blueprint/{rel}        # shell-copied: byte-identical copy of every MANIFEST ## Package Inventory row
  FIDELITY-REPORT.md       # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md        # NOT produced by the formatter — workflow owns it
```

**Deliberately NOT emitted:** no `.taskmaster/` directory and no `_bmad-output/` directory —
those live inside the CONSUMER'S project repo, not inside this export; README.md tells the
user exactly where to copy PRD.md and architecture.md for each tool. No `tasks.json`, no
epics or stories (the consumer tools generate those from the pair), no per-tool config or
rule files, and no `backlog.json` (this target's registry row says it needs none).

## Global Assembly Rules

### Shell idioms (pin these exactly)

**Manifest inventory paths** — the ONLY source of the blueprint file list (no hardcoded
list; the copy tracks the manifest). Rows come from the `## Package Inventory` table of
MANIFEST; the first cell is the rel path under PACKAGE_ROOT:

```bash
manifest_paths() {
  awk '/^## Package Inventory/{f=1; next} f && /^## /{exit} f && /^\|/' "$1" \
  | awk -F'|' '{p=$2; gsub(/^[ \t]+|[ \t]+$/, "", p);
                if (p != "" && p != "Artifact" && p !~ /^[-:]/) print p}'
}
INV_COUNT=$(manifest_paths "$MANIFEST" | wc -l | tr -d ' ')
```

**Verbatim blueprint copy** — byte-identical, frontmatter KEPT (the gate runs `cmp`):

```bash
manifest_paths "$MANIFEST" | while IFS= read -r rel; do
  mkdir -p "$OUTPUT_DIR/docs/blueprint/$(dirname "$rel")"
  cp "$PACKAGE_ROOT/$rel" "$OUTPUT_DIR/docs/blueprint/$rel"
done
```

**Authored prose** — written with quoted heredocs (`cat >> file <<'EOF' … EOF`),
interleaved with the script-row table renders. Authored text never restates canonical
content deeply enough to substitute for reading it — the PRD orients a planning tool; the
blueprint copy carries the depth.

### The build script (one script, Node builtins only)

The Logical Dependency Chain rows, the Appendix inventory rows, the build-order feature
rows, and the ADR registry rows are produced by the pinned script in the section below. The
formatter writes it to `OUTPUT_DIR/.build-prd-tables.js`, runs it with `node`, keeps its
stdout (the CHAIN / BROKEN / FEATROW / INV / ADR / TOTALS rows that feed PRD.md and
architecture.md), and **deletes it before finishing** — the script is a build tool, not
part of the render. It parses the canonical dependency map, spec frontmatter, and the
architecture Decision Log directly; no ID, name, type, or count passes through model
context. The build order is the same Kahn + deterministic cycle-break pinned for the
agent-workspace target (Phase 2 D6) — the two targets must order features identically.

### Authored-Content Whitelist

The formatter authors ONLY: `README.md`, the PRD.md prose around the script-built tables
(section digests, feature blocks, FR/NFR entries, roadmap, risk entries, cycle
disclosures, the totals line), and the architecture.md prose around the script-built ADR
registry. Everything else is copied bytes or script output rendered verbatim (the
formatter adds table pipes; it never recomputes, reorders, or "corrects" a row).

Counted totals used anywhere in authored prose (feature/spec/AC/file counts) are derived by
`ls`/`grep -c`/`wc` over the canonical package at assembly time — never estimated or
recalled — and must agree with the script's TOTALS row.

Authored files carry **zero open-item placeholder tokens** (the two capitalized markers
fidelity rule U5 lints for — U5 runs with NO excludes on this target, so its entire
headroom is consumed by the verbatim blueprint copy and every rendered file must add zero)
and zero occurrences of the U6 lint phrase.

### The reserved row shapes (PRD.md — pin these exactly)

The fidelity gate identifies the two script-built tables by row shape, so each shape is
RESERVED for its table and must appear nowhere else in PRD.md:

- **Dependency-chain rows** — `| {n} | FEAT-NN | {feature name} | {depends-on} |`, matched
  by `^\| *[0-9]+ *\| *FEAT-[0-9]{2} *\|`. Exactly one row per canonical FEAT, order
  numbers 1..N, only inside the `# Logical Dependency Chain` table. No other table in
  PRD.md may have a data row whose first cell is a bare number and second cell a FEAT ID.
- **Inventory rows** — `| FEAT-NN.SPEC-NNN | {name} | {type} | {ac count} |`, matched by
  `^\| FEAT-[0-9]{2}\.SPEC-[0-9]{3} \|`. Exactly one row per canonical SPEC, only inside
  the `# Appendix` inventory table. The gate sums the ACs column over these rows, so the
  totals line sits BELOW the table as prose — never as an extra table row — and no other
  PRD.md table row may open with a SPEC ID cell.

Cycle disclosures follow the same discipline: prose lines below the dependency-chain
table, never extra table rows.

### The size budget

`wc -c < PRD.md` must be ≤ **100,000** characters — gate-checked (PR-4; Task Master
documents no hard limit but its guidance favors focused PRDs, so the cap bakes in
headroom). Design for ≤ ~80,000 on a large package (a 27-feature / 187-spec package lands
near 60,000 under this template's mapping): per-feature blocks stay condensed, acceptance
criteria are never transcluded, and section digests point into `docs/blueprint/` instead of
restating it. When trimming to fit: tighten authored prose, never drop an ID, a table row,
an FR/NFR entry, or a section.

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — it is the full-depth layer every rendered pointer targets, and it is what
     satisfies the U1–U4 roster rules structurally. The copied-file count must equal
     INV_COUNT (PR-5 checks both parity and per-file `cmp`). Never normalize, re-wrap, or
     "fix" a copied file; a legacy package's quirks ride along verbatim and are noted in
     the completion report, never edited. -->

---

## The pinned build script

Write verbatim to `OUTPUT_DIR/.build-prd-tables.js`, run with
`node "$OUTPUT_DIR/.build-prd-tables.js" "$PACKAGE_ROOT"`, capture stdout, delete the file:

```js
#!/usr/bin/env node
// Transient build tool for the prd export -- Node builtins only.
// Usage: node .build-prd-tables.js <package_root>
// Prints, tab-separated, for the formatter to render verbatim:
//   CHAIN rows   (order#, FEAT id, name, depends-on)       -> # Logical Dependency Chain table
//   BROKEN rows  (cycle-break edges: A, B, MUTUAL|FORWARD, disclosed below that table)
//   FEATROW rows (order#, FEAT id, name, priority tier, spec count, AC count)
//                                                          -> # Core Features order + # Development Roadmap tiers
//   INV rows     (spec_id, spec_name, spec_type, ac_count) -> # Appendix inventory table
//   ADR rows     (adr id, category, decision)              -> architecture.md ADR registry
//   TOTALS row   (spec total, AC total)                    -> the Appendix totals line
// Deleted after use -- it is not part of the render.
"use strict";
const fs = require("fs"), path = require("path");

const [root] = process.argv.slice(2);
if (!root) { console.error("usage: node .build-prd-tables.js <package_root>"); process.exit(1); }

// 1. Parse the dependency map's Features table.
//    Cells: 1 Number, 2 Slug, 3 Name, 4 Priority, 5 Phase, 6 Type, 7 Depends On, 8 Depended On By.
const mapText = fs.readFileSync(path.join(root, "specifications", "feature-dependency-map.md"), "utf8");
let inFeatures = false;
const features = [];
for (const line of mapText.split("\n")) {
  if (/^## Features\s*$/.test(line)) { inFeatures = true; continue; }
  if (inFeatures && /^## /.test(line)) break;
  if (!inFeatures || !line.startsWith("|")) continue;
  const cells = line.split("|").map(c => c.trim());
  if (!/^FEAT-\d{2}$/.test(cells[1])) continue; // skips the header and separator rows
  features.push({ id: cells[1], slug: cells[2], name: cells[3], priority: cells[4],
                  deps: (cells[7] || "").match(/FEAT-\d{2}/g) || [] });
}
if (features.length === 0) { console.error("FAIL: no FEAT rows parsed from the Features table"); process.exit(1); }
const known = new Set(features.map(f => f.id));
for (const f of features) f.deps = f.deps.filter(d => known.has(d) && d !== f.id);

// 2. Deterministic Kahn's algorithm with the pinned cycle-break (Phase 2 D6, reused here
//    per Phase 3 D2/D8; amended decision 104): ready = every feature whose deps are all
//    placed; emit the ready feature with the lowest FEAT number. When nothing is ready,
//    break a cycle: candidates are restricted to features inside a dependency cycle (SCC
//    of size > 1 of the remaining subgraph, Tarjan, deterministic); pick the candidate
//    with the lowest tier rank (Core < Important < Nice-to-Have), then the lowest FEAT
//    number, and record each still-unmet dependency as a broken edge classified MUTUAL
//    (the dependency also lists the picked feature in its Depends On) or FORWARD.
const TIER = { "Core": 0, "Important": 1, "Nice-to-Have": 2 };
const featNum = id => parseInt(id.slice(5), 10);
const ordered = [], placed = new Set(), broken = [];
const remaining = new Map(features.map(f => [f.id, f]));
while (remaining.size > 0) {
  const ready = [...remaining.values()].filter(f => f.deps.every(d => placed.has(d)));
  let pick;
  if (ready.length > 0) {
    pick = ready.sort((a, b) => featNum(a.id) - featNum(b.id))[0];
  } else {
    const idx = new Map(), low = new Map(), onStk = new Map();
    const stack = []; let counter = 0; const inCycle = new Set();
    const strong = (v) => {
      idx.set(v, counter); low.set(v, counter); counter++;
      stack.push(v); onStk.set(v, true);
      for (const w of remaining.get(v).deps.filter(d => remaining.has(d))) {
        if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
        else if (onStk.get(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
      }
      if (low.get(v) === idx.get(v)) {
        const comp = [];
        let w; do { w = stack.pop(); onStk.set(w, false); comp.push(w); } while (w !== v);
        if (comp.length > 1) for (const m of comp) inCycle.add(m);
      }
    };
    for (const v of remaining.keys()) if (!idx.has(v)) strong(v);
    const candidates = [...remaining.values()].filter(f => inCycle.has(f.id));
    const pool = candidates.length > 0 ? candidates : [...remaining.values()];
    pick = pool.sort((a, b) =>
      (TIER[a.priority] ?? 9) - (TIER[b.priority] ?? 9) || featNum(a.id) - featNum(b.id))[0];
    for (const d of pick.deps) if (!placed.has(d)) broken.push([pick.id, d,
      features.find(x => x.id === d).deps.includes(pick.id) ? "MUTUAL" : "FORWARD"]);
  }
  ordered.push(pick); placed.add(pick.id); remaining.delete(pick.id);
}

// 3. Inventory rows: features in build order, specs in SPEC-NNN order (zero-padded
//    filenames sort). Frontmatter fields extracted verbatim; the ac_count integer is the
//    frontmatter acceptance_criteria_count, cross-checked against the spec's distinct
//    AC-definition lines -- a mismatch is canonical inconsistency and fails loudly.
const inv = [], allAcIds = new Set();
let acSum = 0;
for (const f of ordered) {
  const dirName = `${f.id}-${f.slug}`;
  const dirPath = path.join(root, "specifications", dirName);
  const specFiles = fs.readdirSync(dirPath)
    .filter(n => new RegExp(`^${f.id}\\.SPEC-\\d{3}.*\\.md$`).test(n)).sort();
  f.specCount = specFiles.length; f.acCount = 0;
  for (const file of specFiles) {
    const text = fs.readFileSync(path.join(dirPath, file), "utf8");
    const fm = {};
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (m) for (const l of m[1].split("\n")) {
      const kv = l.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, "");
    }
    if (!fm.spec_id || !fm.spec_name || !fm.spec_type || !fm.acceptance_criteria_count) {
      console.error(`FAIL: missing spec_id/spec_name/spec_type/acceptance_criteria_count frontmatter in ${dirName}/${file}`);
      process.exit(1);
    }
    const acCount = parseInt(fm.acceptance_criteria_count, 10);
    if (Number.isNaN(acCount)) {
      console.error(`FAIL: acceptance_criteria_count is not an integer in ${dirName}/${file}`);
      process.exit(1);
    }
    const defined = new Set();
    for (const l of text.split("\n")) {
      const am = l.match(/^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2}):\*\*/);
      if (am) defined.add(am[1]);
    }
    if (defined.size !== acCount) {
      console.error(`FAIL: canonical inconsistency in ${dirName}/${file} -- frontmatter acceptance_criteria_count ${acCount} vs ${defined.size} AC definition lines; resolve upstream before exporting`);
      process.exit(1);
    }
    defined.forEach(a => allAcIds.add(a));
    acSum += acCount; f.acCount += acCount;
    inv.push([fm.spec_id, fm.spec_name, fm.spec_type, acCount]);
  }
}
if (acSum !== allAcIds.size) {
  console.error(`FAIL: canonical inconsistency -- per-spec AC counts sum to ${acSum} but the package defines ${allAcIds.size} distinct AC IDs; resolve upstream before exporting`);
  process.exit(1);
}

// 4. ADR registry rows from the architecture's "## 14." Decision Log table
//    (cells: 1 ID, 2 Category, 3 Decision). Extraction, never retyping. An empty row set
//    is legal for small packages; a missing section is not.
const archText = fs.readFileSync(path.join(root, "architecture", "technical-architecture.md"), "utf8");
if (!/^## 14\./m.test(archText)) { console.error("FAIL: technical-architecture.md has no '## 14.' Decision Log section"); process.exit(1); }
let inLog = false;
const adrs = [];
for (const line of archText.split("\n")) {
  if (/^## 14\./.test(line)) { inLog = true; continue; }
  if (inLog && /^## /.test(line)) break;
  if (!inLog || !line.startsWith("|")) continue;
  const cells = line.split("|").map(c => c.trim());
  if (!/^ADR-\d{3}$/.test(cells[1])) continue;
  adrs.push([cells[1], cells[2], cells[3]]);
}

// 5. Print everything for the formatter to render verbatim.
ordered.forEach((f, i) => console.log(["CHAIN", i + 1, f.id, f.name, f.deps.join(", ") || "—"].join("\t")));
for (const [a, b, k] of broken) console.log(["BROKEN", a, b, k].join("\t"));
ordered.forEach((f, i) => console.log(["FEATROW", i + 1, f.id, f.name, f.priority, f.specCount, f.acCount].join("\t")));
for (const r of inv) console.log(["INV", ...r].join("\t"));
for (const r of adrs) console.log(["ADR", ...r].join("\t"));
console.log(["TOTALS", inv.length, acSum].join("\t"));
```

<!-- Verified against a complete live package: 27 CHAIN rows in valid topological order
     (order numbers 1..27), 2 BROKEN edges disclosed (both MUTUAL; the SCC-restricted
     break of decision 104 never defers a merely transitively-blocked feature), 187 INV
     rows whose ACs column sums
     to 2,442 (equal to the distinct AC-ID roster), 27 ADR rows. The script fails loudly
     on a missing table, missing frontmatter, or a frontmatter count that disagrees with
     the spec's AC definition lines -- it never renders around a hole. -->

---

## PRD.md — the consolidated PRD

Task Master's parse-prd skeleton (`<context>` + `<PRD>` wrappers) carrying BMAD-style
numbered FR/NFR lists. Exactly eight H1 (`# `) headings, in this order, and no other H1
anywhere in the file — feature blocks and subsections use `##`/`###`:

| # | Section | Content | Method |
|---|---------|---------|--------|
| 0 | (top of file) | One HTML comment line: project name, package version, render date — provenance without a ninth heading | authored |
| 1 | `<context>` `# Overview` | Problem (BRIEF `## Problem Statement` + `## Vision` digest), target users (BRIEF `## Target Users & Roles` digest), value, and a **measurable success-criteria digest** (BRIEF `## Success Criteria` + `features/success-metrics.md`) | authored digest |
| 2 | `# Core Features` | One `###` block per canonical FEAT, **in build order** (the script's FEATROW order): heading `### {order#}. {Feature Name} (FEAT-NN)`, a `**Priority:** {tier}` line, the feature's `**Description:**` substance from `features/product-features.md`, then its `**Key Capabilities:**` bullets restated as **globally-numbered `**FR-NNN:**` requirement entries** — exactly one FR per capability bullet, in bullet order, numbering continuous 001..N across the whole section, capability substance preserved (never merged, dropped, or reordered) | authored around script order |
| 3 | `# User Experience` | Persona digest (`features/user-persona.md`: primary, secondary, access-matrix summary) + key-journey digest (`features/user-journeys.md`: one short entry per journey) + experience notes (BRIEF `## The Experience`) | authored digest |
| 4 | `</context>` `<PRD>` `# Technical Architecture` | Condensed recommended stack, system components, data-model summary, and integrations from `architecture/technical-architecture.md` — **ADR IDs cited verbatim** inline; then subsection `## Non-Functional Requirements` with **`**NFR-NNN:**` entries** (numbered 001..N) drawn from BRIEF `## Scale & Non-Functional Expectations` + `## Constraints`, `features/assumptions-constraints.md` `## Non-Functional Expectations`, and the architecture's NFR section, citing ASMP IDs where the sources do; closing pointer line to `architecture.md` and `docs/blueprint/architecture/` for full depth | authored digest |
| 5 | `# Development Roadmap` | Scope-not-schedule statement, then three `##` phases by priority tier: MVP = every Core feature, next = Important, later = Nice-to-Have — bullet lists (never tables) naming each feature with its FEAT ID, per-tier feature/spec counts from FEATROW | authored around script rows |
| 6 | `# Logical Dependency Chain` | One authored intro line (order = Kahn over the dependency map, deterministic cycle-break, same order as every n2b export), then the table — header `| # | Feature | Name | Depends on |`, one data row per CHAIN row, values verbatim — then cycle disclosures as PROSE lines below the table, one per BROKEN row (or the none-line: "None — the dependency graph is acyclic.") | script output, table formatting only |
| 7 | `# Risks and Mitigations` | Risk digests with mitigations: assumption risks (`features/assumptions-constraints.md`, **ASMP IDs verbatim**), technical risks (`architecture/technical-feasibility.md` key-risks section), cross-feature coupling (`specifications/feature-dependency-map.md`, **XBR IDs verbatim** where cited), scope discipline (pointer to the scope boundaries in the blueprint copy) | authored digest |
| 8 | `# Appendix` | Intro line, the spec inventory table — header `| Spec ID | Name | Type | ACs |`, one data row per INV row, values verbatim (the ACs cell is the frontmatter `acceptance_criteria_count` integer) — then the totals line BELOW the table as prose: `**Totals:** {spec total} specifications, {AC total} acceptance criteria.` (values from the TOTALS row), then the full-depth pointer: acceptance criteria are deliberately not transcluded here; every spec lives in full under `docs/blueprint/specifications/` | script output, table formatting only |

Skeleton (structure only — `{…}` blocks are filled per the mapping above):

```markdown
<!-- {Project Name} PRD — rendered from blueprint package version {PKG_VERSION} on {YYYY-MM-DD} by n2b /n2b:s5-export prd -->
<context>
# Overview

{problem · target users · value · measurable success-criteria digest}

# Core Features

### 1. {Feature Name} (FEAT-NN)

**Priority:** {tier}

{description substance}

- **FR-001:** The product MUST {capability restated as a requirement}.
- **FR-002:** …
{…one ### block per feature, in build order; FR numbering continues across blocks…}

# User Experience

{personas · key journeys · experience notes}
</context>
<PRD>
# Technical Architecture

{recommended stack · components · data model · integrations — ADR IDs cited}

## Non-Functional Requirements

- **NFR-001:** {expectation}.
{…}

Full architectural depth: `architecture.md` (this export) and `docs/blueprint/architecture/`.

# Development Roadmap

{scope-not-schedule statement}

## MVP — Core features

- **FEAT-NN {Feature Name}** — {one-line scope}
{…}

## Next — Important features
{…}

## Later — Nice-to-Have features
{…}

# Logical Dependency Chain

{intro line}

| # | Feature | Name | Depends on |
|---|---------|------|------------|
| 1 | FEAT-NN | {feature name} | {depends-on or —} |
{…one row per CHAIN row, verbatim…}

{cycle-disclosure prose lines, one per BROKEN row, below the table and never rows in
it — shape keyed by the row's MUTUAL|FORWARD field. MUTUAL: "**FEAT-AA ↔ FEAT-BB:**
mutually dependent (each lists the other in the dependency map) — the order places
FEAT-AA first; build iteratively, stubbing the counterpart's interface." FORWARD:
"**FEAT-AA → FEAT-BB:** FEAT-AA depends on FEAT-BB, which the order places later
(sequenced as part of breaking a dependency cycle) — build FEAT-AA against a stub of
the FEAT-BB-facing interface." The ↔ glyph asserts mutuality and may appear ONLY on
MUTUAL lines; none-line: "None — the dependency graph is acyclic."}

# Risks and Mitigations

{risk digests with ASMP / XBR IDs verbatim}

# Appendix

{intro line}

| Spec ID | Name | Type | ACs |
|---------|------|------|-----|
| FEAT-NN.SPEC-NNN | {name} | {type} | {n} |
{…one row per INV row, verbatim…}

**Totals:** {spec total} specifications, {AC total} acceptance criteria.

{full-depth pointer line}
</PRD>
```

<!-- The eight H1 headings and the two tags are gate anchors (PR-1); the chain rows and
     inventory rows are shape-matched (PR-2/PR-3) — honor the reserved-row-shapes rule
     above. ACs are never transcluded into this file; the condensation contract lives in
     the Global Assembly Rules. -->

---

## architecture.md — the BMAD pair file

The separate architecture document `bmad-create-epics-and-stories` ingests alongside PRD.md
(Task Master ignores it — that is fine). A condensed render with IDs verbatim; every
section ends with a pointer into `docs/blueprint/architecture/` for full depth.

| # | Section | Content | Method |
|---|---------|---------|--------|
| 1 | `# Architecture — {Project Name}` + authority statement | The RECOMMENDED architecture is binding for planning; documented alternatives (with their `Choose instead when` conditions) live in the blueprint copy and are the humans' to weigh, not the planning tool's | authored |
| 2 | `## Recommended Stack` | Condensed stack table (Area · Choice · ADR) covering the core areas — frontend, backend/API, database, data access, hosting, and the package's other activated areas — each row citing its ADR ID(s) verbatim | authored, IDs from script ADR rows |
| 3 | `## System Components & Structure` | Project-structure digest from the architecture's structure section | authored digest |
| 4 | `## Data Model Summary` | Entity inventory digest (names + one-line roles) from `architecture/database-schema.md`; full schema pointer | authored digest |
| 5 | `## ADR Registry` | The COMPLETE decision register: header `| ADR | Area | Decision | Status | Alternatives |`, one row per script ADR row — ADR ID, Category, and Decision cells verbatim from the script; `Status` = `Accepted` for every row (the canonical register records chosen recommendations); `Alternatives` = a short pointer note to the owning sections of `docs/blueprint/architecture/technical-architecture.md` | script output + two authored cells |
| 6 | `## Integration & Vendor Decisions` | Digest of the external services and vendors the architecture commits to (payments, messaging, storage, and the package's other integration areas), ADR IDs cited | authored digest |

PR-6 loops the canonical ADR roster against **this file alone** — the ADR Registry must
carry every canonical ADR ID, which the script-row render guarantees. When the script
prints zero ADR rows (a legal small package), the ADR Registry section states that the
canonical decision register is empty and points at the blueprint copy.

---

## README.md — per-tool import paths

<!-- The human entry point. Written LAST among the authored files, so every count and
     pointer is real. Skeleton in a four-backtick fence — it contains fenced command
     blocks. -->

Skeleton:

````markdown
# {Project Name} — Consolidated PRD Export

{One authored paragraph: this directory holds a consolidated PRD rendered from the
{Project Name} blueprint package (version {PKG_VERSION}, rendered {YYYY-MM-DD}) — {F}
features, {S} specifications, {A} acceptance criteria — as PRD.md plus its architecture
pair file, with the complete blueprint verbatim under docs/blueprint/ for full depth.}

## Task Master

Copy PRD.md into your project and parse it:

```
mkdir -p .taskmaster/docs
cp PRD.md {your-project}/.taskmaster/docs/prd.md
task-master parse-prd .taskmaster/docs/prd.md --num-tasks=0
```

`--num-tasks=0` lets Task Master size the task list by complexity. Useful variants:
`--append` adds to an existing task list instead of replacing it; `--tag {name}` parses
into a separate tagged list. Task Master reads PRD.md alone — architecture.md is not part
of its input (the PRD's Technical Architecture section carries the condensed stack).

## BMAD (v6)

Copy BOTH files into your project's planning-artifacts directory, keeping "PRD" and
"architecture" in the filenames:

```
cp PRD.md {your-project}/_bmad-output/planning-artifacts/{project}-PRD.md
cp architecture.md {your-project}/_bmad-output/planning-artifacts/{project}-architecture.md
```

Then start at `bmad-create-epics-and-stories` — it takes exactly this PRD + architecture
pair as its inputs, entering the BMAD flow at Phase 3 (planning is already done: this
export IS the planning artifact set). Do **not** use BMAD v4's `docs/prd.md` + document-
sharding layout — v6 replaced it, and v4-style placement will not be picked up.

## Any chat-based planning session

Attach PRD.md (and architecture.md when the conversation is technical) to a chat with your
LLM of choice and plan from it directly — the document is self-contained. For questions the
condensed render cannot answer, pull the relevant file from docs/blueprint/.

## Full depth

PRD.md is a condensed render: acceptance criteria are deliberately NOT included in it.
The complete blueprint — every spec with all {A} acceptance criteria, the full
architecture with documented alternatives, and the database schema — is under
`docs/blueprint/`, byte-identical to the canonical package. Treat it as read-only
reference; regenerate upstream if it needs to change.
````

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- `.taskmaster/` and `_bmad-output/` directories, `tasks.json`, epics/stories, per-tool
  config — deliberately not emitted, per the Output Layout note above (README.md tells the
  user where the consumer tools expect the pair).
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
