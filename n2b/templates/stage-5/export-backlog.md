<!-- Export Template: Generic Backlog (`backlog`)

     This template is the output blueprint for the `backlog` export target. It defines a
     small DIRECTORY of files (the C-34 layout) built around the canonical backlog.json
     (contract C-26, built by the Backlog Builder BEFORE the formatter is spawned) and one
     tool-neutral flat CSV render of it. It is consumed by export-backlog-formatter.md,
     spawned by n2b/workflows/stage-5/export.md, and gated by the rules in
     n2b/references/stage-5/fidelity-rules.md (backlog row, target rules BL-1..BL-5).

     Governing rules:
     - backlog.json IS THE INPUT, NEVER THE OUTPUT. The export workflow's Step 2.5 spawns
       the Backlog Builder (registry row: `Needs backlog.json: yes`), which writes
       backlog.json into the output directory before the formatter runs. The formatter
       READS it and never writes, rebuilds, patches, or "fixes" it — a defective
       backlog.json is a Backlog Builder finding the workflow re-routes to that agent
       (export.md Step 4), never a formatter repair.
     - SCRIPT-EMITTED CSV. backlog.csv is produced by ONE Node-builtins script (pinned
       below) that `JSON.parse`s backlog.json and emits every cell from its fields —
       content is never retyped through a model context, and the formatter never
       re-derives structure from the canonical markdown that backlog.json already carries
       (Phase 4 D2: a formatter that re-parses canonical markdown for structure is a
       defect). The script verifies its own output with an RFC-4180 parse-back — row
       coverage, parent resolution, AC-ID coverage, and the exact dependency-edge
       round-trip — before writing the file.
     - BYTE-IDENTICAL COPY. The blueprint moves under `docs/blueprint/` by SHELL `cp`,
       manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every copied
       file with `cmp` (BL-5, the AWS-2 idiom). The copy is what satisfies U1–U4
       structurally; the CSV and JSON payloads are outside those rules' `*.md` scope, so
       BL-3/BL-4 carry the real fidelity burden for the render.
     - THE README IS THE HONESTY LAYER. Research verified 2026-07-28 (work order §1.12–
       §1.15): no mainstream tracker imports a custom JSON file, six of nine import CSV,
       hierarchy survives native CSV import in only some, and dependency edges survive in
       essentially none. README.md states these facts per tracker — what survives, what
       is lost, how to recover it — and never promises universal loading. Getting this
       README right is as much the deliverable as the CSV.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (normally `.n2b/exports/backlog/`).
-->

# Export Template: Generic Backlog (`backlog`)

## Output Layout

The export directory holds the canonical structured artifact, its flat render, the honest
README, and the full-depth blueprint copy (contract C-34):

```
.n2b/exports/backlog/
  README.md                # authored: what each file is + per-tracker "what survives import" honesty
  backlog.json             # BUILT BY THE BACKLOG BUILDER (C-26) before the formatter runs — read-only input
  backlog.csv              # script-emitted: tool-neutral flat render, one row per epic and story
  docs/
    blueprint/{rel}        # shell-copied: byte-identical copy of every MANIFEST ## Package Inventory row
  FIDELITY-REPORT.md       # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md        # NOT produced by the formatter — workflow owns it
```

**Deliberately NOT emitted (Phase 4 D14):** no `jira-import.json` and no Jira-shaped CSV
(the dedicated `jira` target owns that path); no push script and no MCP instructions file;
no per-tool directories (`.taskmaster/`-style config, tracker templates); no GitHub or
Linear renders (GitHub has no file importer at all, Linear's generic CSV drops both parent
and relations — both are API/agent paths served by backlog.json); and no sprint, board, or
version metadata — the blueprint package has no schedule to express, and inventing one
would be exactly the dishonesty this target exists to avoid.

## Global Assembly Rules

### backlog.json — the input this template never builds

Before the formatter is spawned, the workflow's Step 2.5 has already run the Backlog
Builder and verified `OUTPUT_DIR/backlog.json` exists non-empty. The formatter's Step 0
re-verifies that and **fails loudly if it is missing** — it never builds a substitute, and
it never opens the file to edit it. Everything structured the render needs — epic and
story rosters, titles, tiers, parent refs, structured ACs, verbatim spec bodies, typed
dependency edges — comes from this one file via `JSON.parse` in the pinned script.

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

### The CSV script (one script, Node builtins only)

`backlog.csv` is produced by the pinned script in the section below. The formatter writes
it to `OUTPUT_DIR/.build-backlog-csv.js`, runs it with `node`, keeps its one-line summary,
and **deletes it before finishing** — the script is a build tool, not part of the render.
No id, title, tier, AC line, or edge passes through model context: the script reads them
from backlog.json and, for the verbatim AC lines, extracts them from each story's
`body_md` string by the same line pattern the C-26 schema pins.

### Authored-Content Whitelist

The formatter authors ONLY `README.md`. Everything else is copied bytes (`docs/blueprint/`),
a builder-owned input (`backlog.json`), or script output (`backlog.csv`).

Counted totals used anywhere in README prose (feature/spec/AC/file counts) are derived by
`ls`/`grep`/`wc` over the canonical package at assembly time — never estimated or
recalled — and must agree with the script's summary line and backlog.json's
`metadata.counts`. The per-tracker capability statements are pinned in the README skeleton
below — they are verified research facts, not per-package content, and the formatter
carries them as written rather than re-researching or "improving" them.

README.md carries **zero open-item placeholder tokens** (the two capitalized markers
fidelity rule U5 lints for — `$U5_EXCLUDES` is empty for this target, so its entire
headroom is consumed by the verbatim blueprint copy and the one authored file must add
zero) and zero occurrences of the U6 lint phrase. The CSV and JSON payloads sit outside
U5's `*.md` scope entirely.

---

## backlog.csv — the column contract (Phase 4 D10)

One header row, then **one row per epic and one row per story — nothing else**. Row count
equals `epics + stories` in backlog.json exactly (BL-3). Epic rows come first, in
backlog.json's epic order (feature epics ascending, the foundation epic last), then story
rows in backlog.json's story order (by feature, then SPEC number). Foundation stories are
NOT composed for this target — that is the `jira` render's D7 behavior; here the
foundation epic row plus backlog.json's `carries` rosters hold the cross-cutting layer.

Header, exactly: `id,type,parent_id,title,priority,spec_type,description,ac_ids,depends_on,source_path`

| Column | Epic rows | Story rows |
|---|---|---|
| `id` | epic `id` verbatim (`FEAT-NN`, or `FOUNDATION`) | story `id` verbatim (`FEAT-NN.SPEC-NNN`) |
| `type` | literal `epic` | literal `story` |
| `parent_id` | empty | story `epic_id` verbatim — must resolve to an epic row's `id` |
| `title` | epic `name` verbatim | story `title` verbatim |
| `priority` | `priority_tier` verbatim — `Core` / `Important` / `Nice-to-Have`, **never remapped** (tier→scheme mapping is the importer's decision, stated in README) | same |
| `spec_type` | empty | story `spec_type` verbatim (`screen` / `automation` / `logic-rule` / `integration` / `notification`) |
| `description` | epic `description_md` verbatim (the feature record; the foundation epic's deterministic roster digest) | deterministic Markdown composition — see below |
| `ac_ids` | empty | every AC `id` from `acceptance_criteria`, in canonical order |
| `depends_on` | the distinct `to` targets of this row's outgoing `type == "is-blocked-by"` edges, sorted ascending — the mirrored `blocks` edges are never emitted (they would double every dependency) | same |
| `source_path` | `features/product-features.md` (feature epics); empty (foundation) | story `source_path` verbatim |

**Multi-value encoding (pinned — BL-3/BL-4 parse these back):** `ac_ids` and `depends_on`
are **single-space-separated ID lists** (one ASCII space, 0x20, between IDs; empty cell =
none). The canonical ID alphabet is `A–Z 0-9 . -` and contains no whitespace, so splitting
the cell on whitespace round-trips the exact ID list with no possible collision. No
commas, no semicolons, no brackets.

**Story description (deterministic, mechanical — never authored):** in order,

1. `## Overview` followed by the spec's `## Overview` section, **extracted verbatim from
   `body_md`** (the lines after the `## Overview` line, up to the next `## ` line) — every
   n2b spec type carries this section; when a legacy package lacks it, the block is simply
   omitted;
2. `## Acceptance Criteria` followed by **every AC line pulled verbatim from `body_md`'s
   `## Acceptance Criteria` section** by the C-26 §6.1 line pattern — the original
   canonical lines, Markdown `**…**` emphasis and all, never reassembled from the
   structured clauses and never re-worded, re-ordered, or truncated (the structured
   `{id, given, when, then}` objects remain available in backlog.json). The script fails
   loudly if the extracted line IDs do not equal the story's `acceptance_criteria` IDs in
   order;
3. a final `Source: docs/blueprint/{source_path}` pointer line.

Descriptions are **Markdown, not wiki markup** — this render is tool-neutral; Jira's
markup lives in the `jira` target only.

**RFC-4180 quoting (pinned):** any field containing a comma, a double quote, or a newline
is wrapped in double quotes, with each inner `"` doubled to `""` — descriptions carry all
three routinely. Records end with LF. The pinned script applies this encoding and then
re-parses its own output with a real RFC-4180 reader before writing, so a quoting defect
can never reach disk.

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — it is the full-depth layer every rendered pointer targets, and it is
     what satisfies the U1–U4 roster rules structurally (they scan `*.md` only — the CSV
     and JSON payloads are invisible to them, which is exactly why BL-3/BL-4 exist). The
     copied-file count must equal INV_COUNT (BL-5 checks both parity and per-file `cmp`).
     Never normalize, re-wrap, or "fix" a copied file; a legacy package's quirks ride
     along verbatim and are noted in the completion report, never edited. -->

---

## The pinned CSV script

Write verbatim to `OUTPUT_DIR/.build-backlog-csv.js`, run with
`node "$OUTPUT_DIR/.build-backlog-csv.js" "$OUTPUT_DIR/backlog.json" "$OUTPUT_DIR/backlog.csv"`,
capture the summary line, delete the file:

```js
#!/usr/bin/env node
// Transient build tool for the backlog export -- Node builtins only.
// Usage: node .build-backlog-csv.js <backlog_json_path> <out_csv_path>
// Reads backlog.json (contract C-26), emits backlog.csv (contract C-34, D10 columns),
// verifies its own output with an RFC-4180 parse-back before writing, and prints a
// summary line. Every cell value comes from backlog.json -- nothing is retyped.
// Deleted after use -- it is a build tool, not part of the render.
"use strict";
const fs = require("fs");

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error("usage: node .build-backlog-csv.js <backlog_json> <out_csv>"); process.exit(1); }
const bl = JSON.parse(fs.readFileSync(inPath, "utf8"));
if (bl.schema_version !== 1) { console.error(`FAIL: backlog.json schema_version is ${bl.schema_version}; this script was built against 1`); process.exit(1); }
const epics = bl.epics || [], stories = bl.stories || [], edges = bl.dependency_edges || [];
const counts = (bl.metadata || {}).counts || {};
if (epics.length !== counts.epics) { console.error(`FAIL: epics array ${epics.length} != metadata.counts.epics ${counts.epics}`); process.exit(1); }
if (stories.length !== counts.stories) { console.error(`FAIL: stories array ${stories.length} != metadata.counts.stories ${counts.stories}`); process.exit(1); }

// depends_on: the distinct targets of this node's outgoing is-blocked-by edges, sorted.
// The mirrored "blocks" edges are never emitted (they would double every dependency).
const dep = new Map();
const ibbSet = new Set(); // "from>to" tuples -- the round-trip reference set (BL-4)
for (const e of edges) {
  if (e.type !== "is-blocked-by") continue;
  ibbSet.add(e.from + ">" + e.to);
  if (!dep.has(e.from)) dep.set(e.from, new Set());
  dep.get(e.from).add(e.to);
}
const deps = id => [...(dep.get(id) || [])].sort().join(" ");

// RFC-4180 field encoding: quote when the value contains a comma, a double quote, or a
// newline; a double quote inside a quoted field is doubled. Records end with LF.
const q = v => {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const HEADER = "id,type,parent_id,title,priority,spec_type,description,ac_ids,depends_on,source_path";
const rows = [HEADER];

// Mechanical section extraction from a story's verbatim body_md: the lines after the
// "## {heading}" line, up to (excluding) the next "## " line, trimmed.
const section = (body, heading) => {
  const lines = body.split("\n");
  const i = lines.findIndex(l => l.trim() === "## " + heading);
  if (i < 0) return "";
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^## /.test(lines[j])) break;
    out.push(lines[j]);
  }
  return out.join("\n").trim();
};
const AC_LINE = /^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2,3}):\*\* Given /;

// Epic rows -- backlog.json order (feature epics ascending, foundation last)
for (const ep of epics) {
  rows.push([
    ep.id, "epic", "", ep.name, ep.priority_tier, "",
    ep.description_md,
    "", deps(ep.id),
    ep.type === "feature" ? "features/product-features.md" : ""
  ].map(q).join(","));
}

// Story rows -- backlog.json order (by feature, then SPEC number)
const acIdSet = new Set();
for (const st of stories) {
  // AC lines are pulled VERBATIM from body_md's ## Acceptance Criteria section (never
  // reassembled from the structured clauses -- byte fidelity to the canonical line).
  const acSection = section(st.body_md, "Acceptance Criteria");
  const acLines = acSection.split("\n").filter(l => AC_LINE.test(l));
  const acIds = (st.acceptance_criteria || []).map(a => a.id);
  const lineIds = acLines.map(l => l.match(AC_LINE)[1]);
  if (JSON.stringify(lineIds) !== JSON.stringify(acIds)) {
    console.error(`FAIL: ${st.id}: AC lines in body_md [${lineIds.length}] do not match structured acceptance_criteria [${acIds.length}] -- backlog.json is inconsistent`);
    process.exit(1);
  }
  acIds.forEach(a => acIdSet.add(a));
  const overview = section(st.body_md, "Overview");
  const desc =
    (overview ? "## Overview\n\n" + overview + "\n\n" : "") +
    "## Acceptance Criteria\n\n" + acLines.join("\n") + "\n\n" +
    "Source: docs/blueprint/" + st.source_path;
  rows.push([
    st.id, "story", st.epic_id, st.title, st.priority_tier, st.spec_type,
    desc, acIds.join(" "), deps(st.id), st.source_path
  ].map(q).join(","));
}
if (acIdSet.size !== counts.acceptance_criteria) {
  console.error(`FAIL: ${acIdSet.size} distinct AC IDs emitted vs metadata.counts.acceptance_criteria ${counts.acceptance_criteria}`);
  process.exit(1);
}
const csv = rows.join("\n") + "\n";

// ---- Parse-back verification (BL-3/BL-4 disciplines, applied before writing) ----
// A real RFC-4180 reader: char scan, quoted fields may contain commas, quotes, newlines.
const parsed = [];
{
  let f = "", cur = [], inQ = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQ) {
      if (c === '"') { if (csv[i + 1] === '"') { f += '"'; i++; } else inQ = false; }
      else f += c;
    }
    else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(f); f = ""; }
    else if (c === "\n") { cur.push(f); parsed.push(cur); f = ""; cur = []; }
    else if (c !== "\r") f += c;
  }
  if (f !== "" || cur.length) { cur.push(f); parsed.push(cur); }
}
const fail = msg => { console.error("FAIL (parse-back): " + msg); process.exit(1); };
if (parsed[0].join(",") !== HEADER) fail("header row mismatch");
const data = parsed.slice(1);
if (data.length !== epics.length + stories.length) fail(`${data.length} data rows vs ${epics.length + stories.length} epics+stories`);
const badWidth = data.filter(r => r.length !== 10);
if (badWidth.length) fail(`${badWidth.length} row(s) do not have 10 fields (first: id=${badWidth[0][0]})`);
const nodeIds = new Set([...epics.map(e => e.id), ...stories.map(s => s.id)]);
const csvIds = new Set(data.map(r => r[0]));
if (csvIds.size !== data.length) fail("duplicate id values");
for (const id of nodeIds) if (!csvIds.has(id)) fail(`missing row for ${id}`);
for (const id of csvIds) if (!nodeIds.has(id)) fail(`extra row id ${id}`);
const epicIds = new Set(epics.map(e => e.id));
for (const r of data) if (r[2] && !epicIds.has(r[2])) fail(`parent_id ${r[2]} (row ${r[0]}) resolves to no epic`);
const csvAcIds = new Set(data.flatMap(r => r[7] ? r[7].split(/\s+/) : []));
if (csvAcIds.size !== counts.acceptance_criteria) fail(`${csvAcIds.size} distinct ac_ids vs ${counts.acceptance_criteria}`);
const csvEdges = new Set(data.flatMap(r => r[8] ? r[8].split(/\s+/).map(t => r[0] + ">" + t) : []));
for (const t of csvEdges) if (!ibbSet.has(t)) fail(`depends_on edge ${t} not in backlog.json is-blocked-by set`);
for (const t of ibbSet) if (!csvEdges.has(t)) fail(`is-blocked-by edge ${t} missing from depends_on`);
for (const r of data) for (const t of (r[8] ? r[8].split(/\s+/) : [])) if (!nodeIds.has(t)) fail(`depends_on target ${t} (row ${r[0]}) resolves to no id`);

fs.writeFileSync(outPath, csv);
const over = data.reduce((n, r) => n + r.filter(f2 => f2.length > 32767).length, 0);
console.log(`OK rows=${data.length} epics=${epics.length} stories=${stories.length} distinct_ac_ids=${csvAcIds.size} depends_on_edges=${csvEdges.size} cells_over_excel_cap=${over}`);
```

<!-- Verified against a complete live package rendered to the amended C-26 schema:
     215 data rows (28 epics + 187 stories), 2,442 distinct ac_ids, 602 directed
     depends_on edges round-tripping the is-blocked-by set exactly (independently
     re-parsed with a second RFC-4180 implementation), all rows 10 fields wide, zero
     cells over Excel's 32,767-character cap. The script fails loudly -- without writing
     the CSV -- on a schema-version mismatch, a count mismatch, an AC line/object
     disagreement, or any parse-back failure; it never renders around a hole. -->

---

## README.md — what each file is, and what survives import

<!-- The honesty layer. Written LAST among the formatter's outputs so every count is
     real. The per-tracker statements below are verified research facts (2026-07-28) and
     ship as written — the formatter fills only the {…} placeholders. Skeleton in a
     four-backtick fence. -->

Skeleton:

````markdown
# {Project Name} — Generic Backlog Export

{One authored paragraph: this directory holds the {Project Name} blueprint package
(version {PKG_VERSION}, rendered {YYYY-MM-DD}) as an import-ready backlog — {F} features
and one foundation epic, {S} stories, {A} acceptance criteria, and the full dependency
graph — in two forms: a canonical backlog.json and a flat backlog.csv, with the complete
blueprint verbatim under docs/blueprint/ for full depth.}

## What each file is

- **backlog.json** — the canonical, lossless artifact (schema v1): every feature as an
  epic and every specification as a story, carrying verbatim IDs, full Markdown bodies,
  acceptance criteria as structured Given/When/Then objects, priority tiers, parent
  refs, and typed dependency edges in both directions. Built for AI agents and API
  scripts — no mainstream tracker imports a custom JSON file, and this one does not
  pretend otherwise.
- **backlog.csv** — the flat render: one row per epic and story, columns
  `id, type, parent_id, title, priority, spec_type, description, ac_ids, depends_on,
  source_path`. Descriptions are Markdown (spec overview + acceptance criteria verbatim
  + source pointer). Built for tracker CSV importers and spreadsheet triage.
- **docs/blueprint/** — the complete blueprint package, byte-identical to the canonical
  source. Read-only reference; regenerate upstream if it needs to change.

## What survives import — read this before uploading

Of the nine mainstream trackers surveyed (July 2026: Jira, Linear, GitHub, Azure DevOps,
Asana, Monday, Notion, Trello, ClickUp), six import CSV natively — and none import this
backlog losslessly. **Hierarchy survives native CSV import in some trackers. Dependency
edges survive in essentially none.** The edges are not lost: they live in backlog.json
and in the CSV's `depends_on` column — but no import screen will apply them for you.

| Tracker | Native file import | Hierarchy (`parent_id`) | Dependency edges |
|---|---|---|---|
| Jira | CSV (admin-gated, "old experience" importer) | Survives (Issue ID + Parent mapping) | Dropped on the standard path — link columns map only in the admin old-experience importer, default link types only |
| Azure DevOps | CSV | Survives (work-item hierarchy) | Dropped — the importer accepts no link types beyond parent/child |
| Asana | CSV | Survives | Dropped |
| ClickUp | CSV | Survives | Dropped |
| Linear | CSV (lossy) | Lost — the generic CSV importer ignores parent links | Lost — relations are ignored (linear/linear#1042); prefer the API/agent path |
| Monday | CSV | Lost | Dropped |
| Notion | CSV (rows into a database) | Lost | Dropped |
| GitHub | None — no file import feature exists | — | — bulk creation is `gh`/REST scripting plus the sub-issues API, from backlog.json |

**Using Jira?** Use the dedicated export instead: `/n2b:s5-export jira` renders a
purpose-built jira-import.csv (epics before stories, Jira wiki-markup descriptions,
parent and blocking links wired for the importer) plus a step-by-step import guide.

## Recovering what importers drop

The dependency graph is the one part of this backlog no import screen preserves. Two
working paths:

1. **An AI agent with tracker access.** Hand backlog.json to an agent that can reach
   your tracker (API or MCP) and have it create the items, then the links: every
   `dependency_edges` entry with `"type": "is-blocked-by"` is one directed dependency —
   `from` depends on `to`. The mirrored `"blocks"` entries are the same links
   pre-inverted; apply one direction only.
2. **A post-import API script.** Import backlog.csv first, keep the tracker's mapping of
   the `id` column to its issue keys, then walk each row's `depends_on` cell
   (space-separated ids) and create one link per entry via the tracker's API.

Acceptance criteria need no recovery: trackers have no standard AC field (only Azure
DevOps carries a native one), so every story's Given/When/Then criteria ride verbatim
inside its description — the universal convention — and stay structured in backlog.json.

## Handling notes

- `priority` carries the blueprint's tiers verbatim (`Core` / `Important` /
  `Nice-to-Have`) — map them to your tracker's priority scheme in the import screen.
- Multi-value cells (`ac_ids`, `depends_on`) are single-space-separated ID lists; an
  empty cell means none.
- Descriptions are Markdown and contain commas, quotes, and newlines — the file is
  RFC-4180 quoted, so import it with a real CSV parser (every tracker importer is one).
- Do not round-trip backlog.csv through Excel before importing: Excel caps cells at
  32,767 characters and can silently truncate or re-encode quoted fields. Upload the
  file as generated.

## What this export deliberately does not include

No sprint, board, or version metadata — the blueprint defines scope and order, not a
schedule. No push script and no per-tracker import configs. For anything the flat render
cannot answer, the complete package — every spec in full, the architecture with its
documented alternatives, the database schema — is under `docs/blueprint/`.
````

---

## Files This Template Never Produces

- `backlog.json` — built by the Backlog Builder (n2b/agents/stage-5/backlog-builder.md,
  contract C-26) in the workflow's Step 2.5, before the formatter is spawned. The
  formatter reads it; on a defect the workflow re-spawns the builder, never the formatter.
- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- `jira-import.csv`, `jira-import.json`, push scripts, per-tracker configs, GitHub or
  Linear renders — deliberately not emitted, per the Output Layout note above.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
