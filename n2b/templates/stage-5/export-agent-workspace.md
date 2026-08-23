<!-- Export Template: Agent Workspace (`agent-workspace`)

     This template is the output blueprint for the `agent-workspace` export target. Unlike the
     single-document stage templates, it defines a repo-shaped DIRECTORY of files (the C-30
     layout) plus the assembly recipe for each one. It is consumed by
     export-agent-workspace-formatter.md, spawned by n2b/workflows/stage-5/export.md, and
     gated by the rules in n2b/references/stage-5/fidelity-rules.md (agent-workspace row =
     verbatim-copy contract, target rules AWS-1..AWS-6).

     Governing rules:
     - RENDERING, NOT AUTHORING. The formatter authors only the harness files listed in the
       Authored-Content Whitelist below. It never invents, summarizes, paraphrases, rewords,
       renumbers, or drops product or technical content, never resolves open questions, and
       never drops an ID.
     - BYTE-IDENTICAL COPY. The blueprint moves under `docs/blueprint/` by SHELL `cp`,
       manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every copied file
       with `cmp` (AWS-2). This is the opposite of the dev-brief's frontmatter-strip: the
       workspace copy is the canonical package, relocated, not reformatted.
     - SCRIPT-BUILT WORK LIST. `feature_list.json` and the build-order computation come from
       ONE Node-builtins script (pinned below) that parses the canonical files directly —
       IDs, names, and AC IDs extracted programmatically, never retyped through the model.
     - ONE CANONICAL AGENT FILE. `AGENTS.md` is the single cross-tool instruction file
       (Cursor, Codex, GitHub Copilot, Windsurf/Devin Desktop, and cloud Devin read it
       natively); `CLAUDE.md` bridges it into Claude Code via a real import file. No
       per-tool rule directories are emitted — duplicated instruction files are the top
       cited drift/conflict cause.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (normally `.n2b/exports/agent-workspace/`).
-->

# Export Template: Agent Workspace (`agent-workspace`)

## Output Layout

The export directory IS the workspace root, ready for `git init` (contract C-30):

```
.n2b/exports/agent-workspace/
  README.md                              # authored: human entry — what this is, git init, per-tool startup
  AGENTS.md                              # authored: canonical agent instructions — ≤ 12,000 chars, zero bare @-path tokens
  CLAUDE.md                              # authored: bridge — first non-empty line is the AGENTS.md import, then short Claude Code notes
  OPERATING-RULES.md                     # authored frame + the SC DO-NOT-BUILD list shell-extracted VERBATIM
  BUILD-ORDER.md                         # authored prose around the script-computed topological order
  PROGRESS.md                            # authored: session-log seed (append-only protocol)
  feature_list.json                      # script-generated: machine-checkable work list (schema below)
  .devin/
    wiki.json                            # authored: {"repo_notes": [...]} — wiki-generation steering only
  playbooks/
    build-next-feature.devin.md          # authored: Devin playbook, official section format
  docs/
    blueprint/{rel}                      # shell-copied: byte-identical copy of every MANIFEST ## Package Inventory row
  FIDELITY-REPORT.md                     # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md                      # NOT produced by the formatter — workflow owns it
```

**Deliberately NOT emitted:** no per-tool rule files — no `.cursor/` rules directory, no
`.github/copilot-instructions.md`, no `.windsurf/` rules directory (the root `AGENTS.md`
makes every one of them redundant, and duplicated instruction files drift) — and no
`init.sh` (the workspace ships no code; the first build session scaffolds the project per
the architecture document and creates `init.sh` then — the session protocol says so).

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

**DO-NOT-BUILD extraction** — the complete `## Explicit Exclusions` section of
`scope-boundaries.md` (heading included, its `###` subsections included, up to the next
`## ` heading) — every SC entry with its rationale, verbatim:

```bash
extract_exclusions() {
  awk '/^## Explicit Exclusions/{f=1} f && /^## / && !/^## Explicit Exclusions/{exit} f' "$1"
}
# usage:  extract_exclusions "$PACKAGE_ROOT/features/scope-boundaries.md" >> "$OUTPUT_DIR/OPERATING-RULES.md"
```

**Authored harness prose** — written with quoted heredocs (`cat >> file <<'EOF' … EOF`),
interleaved with the appends above. Authored text never restates canonical content deeply
enough to substitute for reading it.

### The build script (one script, Node builtins only)

`feature_list.json` and the build order are produced by the pinned script in the
`feature_list.json` section below. The formatter writes it to
`OUTPUT_DIR/.build-feature-list.js`, runs it with `node`, keeps its stdout (the ORDER and
BROKEN rows that feed `BUILD-ORDER.md`), and **deletes it before finishing** — the script
is a build tool, not part of the render. It parses the canonical dependency map and spec
files directly; no ID, name, or AC ID passes through model context.

### Authored-Content Whitelist

The formatter authors ONLY: `README.md`, `AGENTS.md`, `CLAUDE.md`, the `OPERATING-RULES.md`
frame around the verbatim SC extraction, the `BUILD-ORDER.md` prose around the
script-computed table rows, `PROGRESS.md`, `.devin/wiki.json`, and
`playbooks/build-next-feature.devin.md`. Everything else is copied bytes or script output.

Counted totals used anywhere in authored prose (feature/spec/AC/file counts) are derived by
`ls`/`grep -c`/`wc` over the canonical package at assembly time — never estimated or
recalled — and must agree with the script-generated `feature_list.json` metadata.

Authored harness files carry **zero open-item placeholder tokens** (the two capitalized
markers fidelity rule U5 lints for — U5 runs with no excludes on this target, so its entire
headroom is consumed by the verbatim blueprint copy) and zero occurrences of the U6 lint
phrase.

### The bare-`@` rule (AGENTS.md and CLAUDE.md)

Claude Code imports `AGENTS.md` through `CLAUDE.md` and recursively expands bare `@`-path
tokens up to 4 hops — a bare `@docs/blueprint/...` token would force-load the blueprint
into context at every session start. `AGENTS.md` therefore carries **zero bare `@`-path
tokens**: every path is written plainly or in backticks (Claude Code skips backticked
`@`-paths, and plain paths carry no `@` at all). The gate enforces this mechanically
(AWS-5). The ONLY intentional `@`-token in the whole render is `CLAUDE.md`'s first line.

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — it is the foundation every harness file points into. The copied-file
     count must equal INV_COUNT (AWS-2 checks both parity and per-file `cmp`). Never
     normalize, re-wrap, or "fix" a copied file; a legacy package's quirks (e.g. a
     pre-decision-84 design-system.md, an embedded frontmatter block mid-document) ride
     along verbatim and are noted in the completion report, never edited. -->

---

## feature_list.json — the machine-checkable work list

Top-level schema (contract C-30):

```json
{
  "schema_version": 1,
  "metadata": {
    "package_version": 4,
    "generated_from": "MANIFEST.md",
    "feature_count": 27,
    "spec_count": 187,
    "ac_count": 2442
  },
  "items": [ ]
}
```

One item per canonical SPEC — features in BUILD-ORDER (topological) order, specs within a
feature in SPEC-NNN order. Filled example item:

```json
{
  "id": "FEAT-01.SPEC-001",
  "feature": "FEAT-01",
  "feature_name": "Account Registration & Login",
  "name": "Role Selection",
  "spec_file": "docs/blueprint/specifications/FEAT-01-account-registration-login/FEAT-01.SPEC-001-role-selection.md",
  "type": "screen",
  "priority": "Core",
  "ac_ids": ["FEAT-01.SPEC-001-AC-01", "FEAT-01.SPEC-001-AC-02", "FEAT-01.SPEC-001-AC-03"],
  "passes": false
}
```

Field sources — every value extracted programmatically, verbatim: `id` = the spec's
frontmatter `spec_id`; `feature` / `feature_name` / `priority` = the dependency map's
Features-table Number / Name / Priority cells; `name` = frontmatter `spec_name`;
`spec_file` = the copied path under `docs/blueprint/`; `type` = frontmatter `spec_type`
verbatim — the five spec types C-30 enumerates as Screen / Automation / Logic-Rule /
Integration / Notification, in their frontmatter spelling; `ac_ids` = every AC ID the spec
defines (its `**FEAT-NN.SPEC-NNN-AC-NN:**` definition lines), verbatim and distinct;
`passes` = `false` on every item, always. Consumers flip `passes` only after end-to-end
verification; item `id`s, `ac_ids`, and names are never edited downstream — `AGENTS.md`
and the playbook state this.

The pinned build script (write verbatim to `OUTPUT_DIR/.build-feature-list.js`, run, delete):

```js
#!/usr/bin/env node
// Transient build tool for the agent-workspace export -- Node builtins only.
// Usage: node .build-feature-list.js <package_root> <out_json> <pkg_version>
// Writes feature_list.json; prints ORDER rows (order, feat, name, priority,
// depends-on, spec count, AC count) and BROKEN rows (cycle-break edges: A, B,
// MUTUAL|FORWARD) for BUILD-ORDER.md.
// Deleted after use -- it is not part of the render.
"use strict";
const fs = require("fs"), path = require("path");

const [root, outJson, pkgVersion] = process.argv.slice(2);
if (!root || !outJson || !pkgVersion) {
  console.error("usage: node .build-feature-list.js <package_root> <out_json> <pkg_version>");
  process.exit(1);
}

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

// 2. Deterministic Kahn's algorithm with the pinned cycle-break (contract C-30 / D6,
//    amended decision 104): ready = every feature whose deps are all placed; emit the
//    ready feature with the lowest FEAT number. When nothing is ready, break a cycle:
//    candidates are restricted to features inside a dependency cycle (SCC of size > 1
//    of the remaining subgraph, Tarjan, deterministic); pick the candidate with the
//    lowest tier rank (Core < Important < Nice-to-Have), then the lowest FEAT number,
//    and record each still-unmet dependency as a broken edge classified MUTUAL (the
//    dependency also lists the picked feature in its Depends On) or FORWARD.
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

// 3. One item per spec: features in build order, specs in SPEC-NNN order (zero-padded
//    filenames sort). Frontmatter fields and AC-definition lines extracted verbatim.
const items = [];
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
    if (!fm.spec_id || !fm.spec_name || !fm.spec_type) {
      console.error(`FAIL: missing spec_id/spec_name/spec_type frontmatter in ${dirName}/${file}`);
      process.exit(1);
    }
    const acIds = [];
    for (const l of text.split("\n")) {
      const am = l.match(/^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2}):\*\*/);
      if (am) acIds.push(am[1]);
    }
    const distinct = [...new Set(acIds)];
    f.acCount += distinct.length;
    items.push({ id: fm.spec_id, feature: f.id, feature_name: f.name, name: fm.spec_name,
                 spec_file: `docs/blueprint/specifications/${dirName}/${file}`,
                 type: fm.spec_type, priority: f.priority, ac_ids: distinct, passes: false });
  }
}

// 4. Write feature_list.json; print the order rows and broken edges.
const acSet = new Set(items.flatMap(i => i.ac_ids));
const out = { schema_version: 1,
  metadata: { package_version: Number.isNaN(+pkgVersion) ? pkgVersion : +pkgVersion,
              generated_from: "MANIFEST.md", feature_count: ordered.length,
              spec_count: items.length, ac_count: acSet.size },
  items };
fs.writeFileSync(outJson, JSON.stringify(out, null, 2) + "\n");
ordered.forEach((f, i) => console.log(
  ["ORDER", i + 1, f.id, f.name, f.priority, f.deps.join(", ") || "—", f.specCount, f.acCount].join("\t")));
for (const [a, b, k] of broken) console.log(["BROKEN", a, b, k].join("\t"));
```

<!-- Verified against a complete live package: 27 features, 187 items, 2,442 distinct AC
     IDs, deterministic order, two disclosed cycle-break edges (both MUTUAL; the
     SCC-restricted break never defers a merely transitively-blocked feature — decision
     104). The script fails loudly on a
     missing table or missing frontmatter -- it never renders around a hole. -->

---

## BUILD-ORDER.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Build Order` + authored intro (skeleton below) | authored |
| 2 | The order table — one row per FEAT, from the script's ORDER rows, values verbatim | script output, table formatting only |
| 3 | `## Dependency cycle breaks` + one disclosure line per BROKEN row, shape keyed by its MUTUAL\|FORWARD field (or the none-line) | authored around script output |

Skeleton:

```markdown
# Build Order

{Authored intro, 2–4 sentences: the features below are ordered topologically — Kahn's
algorithm over the dependency map's Features-table `Depends On` column, with a
deterministic cycle-break restricted to features inside a dependency cycle (lowest
priority-tier rank Core < Important < Nice-to-Have, then lowest FEAT number) whose
broken edges are disclosed at the end.
`feature_list.json` follows this exact order — features as listed here, specs within a
feature in SPEC number order. Follow the list; do not re-derive the order.}

| # | Feature | Name | Priority | Depends on | Specs | ACs |
|---|---------|------|----------|------------|-------|-----|
| 1 | FEAT-01 | {Name} | {tier} | {deps or —} | {n} | {n} |
{…one row per feature, in script order…}

## Dependency cycle breaks

{One line per BROKEN row, shape keyed by the row's MUTUAL|FORWARD field — or, when the
graph is acyclic: "None — the dependency graph is acyclic." The ↔ glyph asserts
mutuality and may appear ONLY on MUTUAL lines. Shapes:}
- FEAT-04 ↔ FEAT-14 are mutually dependent (each lists the other in the dependency
  map) — the order places FEAT-04 first and interleaves them; build iteratively,
  stubbing the not-yet-built counterpart's interface and completing it when its turn
  comes.
- FEAT-NN depends on FEAT-MM, which the order places later (FEAT-NN was sequenced as
  part of breaking a dependency cycle) — build FEAT-NN against a stub of the
  FEAT-MM-facing interface and complete the wiring when FEAT-MM is built.
```

<!-- The table must carry exactly one row per canonical FEAT (AWS-4 checks row count ==
     FEAT count). Row values are the script's ORDER fields verbatim -- the formatter adds
     table pipes, never recomputes or "corrects" an order it disagrees with. -->

---

## OPERATING-RULES.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Operating Rules` + one authored framing line ("binding for any agent or human building from this workspace") | authored |
| 2 | `## 1. The recommended architecture is binding` section | authored (skeleton below) |
| 3 | `## 2. DO-NOT-BUILD — explicit scope exclusions` heading + one authored framing sentence | authored |
| 4 | The `## Explicit Exclusions` section of `scope-boundaries.md` — every SC entry with rationale | `extract_exclusions` append, VERBATIM — never retyped |
| 5 | `## 3. Assumptions & constraints awareness` section | authored |
| 6 | `## 4. The blueprint is read-only` section | authored |
| 7 | `## 5. Design posture` — ONE of three authored statements, per the detected posture | authored |

Section skeletons (adapt wording to the product; keep every rule's substance):

```markdown
## 1. The recommended architecture is binding

`docs/blueprint/architecture/technical-architecture.md` records a RECOMMENDED choice for
every decision area, plus documented alternatives with `Choose instead when` conditions.
Build the recommendation. The alternatives are informational — documented for the humans
who own this project to weigh; they are not the agent's to choose. If a human explicitly
directs a substitution, record it in `PROGRESS.md` and apply it consistently.

## 2. DO-NOT-BUILD — explicit scope exclusions

The exclusions below are carried verbatim from the blueprint
(`docs/blueprint/features/scope-boundaries.md`). Never implement any of them — even when a
spec seems adjacent or the capability seems easy to add. Deferral notes live in the source
document.

{verbatim `## Explicit Exclusions` section — every SC-XX entry}

## 3. Assumptions & constraints awareness

`docs/blueprint/features/assumptions-constraints.md` carries the ASMP register — the
assumptions this blueprint is built on — plus product constraints, non-functional
expectations, and dependencies. Read it before architectural or data-model work; when an
implementation choice would contradict an ASMP entry, stop and surface it to a human
instead of silently deciding.

## 4. The blueprint is read-only

Everything under `docs/blueprint/` is input, never workspace: never edit, reformat,
regenerate, or delete a blueprint file. A blueprint defect is reported to a human (the
package is regenerated upstream) — it is not patched here. Specs are the contract: build
what they say, and when a spec and this file's rules seem to conflict, these rules win and
the conflict is reported.

## 5. Design posture

{Posture 1 — `docs/blueprint/specifications/design-system/` directory exists:}
The supplied design system under `docs/blueprint/specifications/design-system/` is BINDING:
map its tokens and values to code as-is — never redesign, restyle, or "improve" them.

{Posture 2 — legacy single file `docs/blueprint/specifications/design-system.md` exists:}
`docs/blueprint/specifications/design-system.md` is the design reference for this build.
(Provenance note: it was produced by an earlier version of the pipeline engine; current
packages instead carry a user-supplied design-system directory, or ship design-agnostic.)

{Posture 3 — neither exists:}
This package ships design-agnostic: no design system is part of the blueprint, and the
builder owns visual design. Honor any stated design preferences recorded in the brief's
Constraints section (`docs/blueprint/BRIEF.md`).
```

---

## AGENTS.md

<!-- The canonical cross-tool instruction file. Hard cap 12,000 characters (gate-checked,
     AWS-5), target under 200 lines, ZERO bare @-path tokens (see the bare-@ rule above).
     When trimming to fit the budget: tighten wording, never drop a section. All counts
     ({F}/{S}/{A}/{N}) are shell-derived. -->

Skeleton:

```markdown
# {Project Name} — Agent Instructions

## What this repository is

{2–3 authored sentences: build the product described under docs/blueprint/ — a complete,
implementation-ready blueprint ({F} features, {S} specifications, {A} acceptance criteria)
rendered from the {Project Name} package. This workspace ships the blueprint and a build
harness; it ships no code yet.}

## Blueprint map & reading order

| Path | What it is |
|------|-----------|
| `docs/blueprint/BRIEF.md` | The product brief — read this first |
| `docs/blueprint/features/` | Product definition: features, personas, journeys, scope, metrics, research |
| `docs/blueprint/specifications/` | Per-feature specifications — the build contract, with acceptance criteria |
| `docs/blueprint/architecture/` | Recommended architecture, feasibility, database schema |

Read the brief once, then per item: the item's spec in full, plus the architecture and
schema sections it touches. Do not bulk-load the blueprint ({N} files) — read what the
current item needs.

## Ground rules

`OPERATING-RULES.md` is binding: the recommended architecture (alternatives are not yours
to choose), the DO-NOT-BUILD list, assumptions awareness, the design posture, and the
read-only blueprint rule. Specs are the contract; blueprint files are read-only inputs.

## Session protocol

Every working session runs the same loop:

1. Read `PROGRESS.md` and the recent `git log` to see where the build stands.
2. Pick the FIRST item in `feature_list.json` whose `"passes"` is `false` — the list is
   already in build order.
3. Read that item's `spec_file` in full.
4. Implement the item.
5. Verify every ID in its `ac_ids` end-to-end, the way a user would exercise it.
6. Commit with a descriptive message.
7. Append a `PROGRESS.md` entry (date, item id, what was done, verification evidence).
8. Flip that item's `"passes"` to `true` — ONLY after step 5's verification.

Work one item per session (or a small coherent group). Never edit item `id`s, `ac_ids`, or
descriptions; never mark `passes` without verification.

**First session ever:** there is no code yet. Scaffold the project per
`docs/blueprint/architecture/technical-architecture.md` (the RECOMMENDED choices), create
`init.sh` for environment startup, and commit the baseline — then start the loop.

## Build order

`BUILD-ORDER.md` explains the dependency order `feature_list.json` follows and discloses
its cycle breaks. Follow the list; do not re-derive the order.

## Definition of done

A spec is done when its acceptance criteria — by ID, per the item's `ac_ids` — pass
end-to-end. Not merely compiling, not unit tests alone: exercised as a user would.
```

---

## CLAUDE.md

<!-- The Claude Code bridge (a real file, never a symlink): Claude Code does not read
     AGENTS.md natively — it imports it through CLAUDE.md. The FIRST NON-EMPTY LINE must
     be exactly the @AGENTS.md import token (AWS-5 checks it), followed by a short
     "## Claude Code notes" section — a few lines, nothing more. -->

Skeleton:

```markdown
@AGENTS.md

## Claude Code notes

- AGENTS.md above is the complete instruction set; this file only imports it.
- Blueprint paths in AGENTS.md are written plainly or backticked on purpose — nothing
  force-loads into context. Read blueprint files with the Read tool as each item needs.
- `PROGRESS.md` is the cross-session memory: read it at session start, append at session
  end, one `feature_list.json` item per session.
```

---

## README.md

<!-- The human entry point (agents get AGENTS.md). Written LAST among the harness files,
     so every count and pointer is real. -->

Skeleton (four-backtick fence — the skeleton itself contains a fenced block):

````markdown
# {Project Name} — Agent Build Workspace

{One authored paragraph: this directory is a build-ready workspace rendered from the
{Project Name} blueprint package (version {PKG_VERSION}, rendered {YYYY-MM-DD}): the
complete blueprint — {F} features, {S} specifications, {A} acceptance criteria — verbatim
under docs/blueprint/, plus the harness files a coding agent needs to build it across many
sessions. It contains no code yet; the first build session scaffolds the project.}

## Make it a repository

```
git init && git add -A && git commit -m "{Project Name} blueprint workspace"
```

## Start your coding agent

**Claude Code** — open the repository and start a session: Claude Code reads `CLAUDE.md`,
which imports `AGENTS.md`. Ask it to build the next feature.

**Cursor / GitHub Copilot / Windsurf (Devin Desktop)** — open the repository: each reads
the root `AGENTS.md` natively. Ask it to follow the session protocol.

**Devin (cloud)** — connect the repository: `AGENTS.md` is auto-ingested into Devin's
Knowledge, and the wiki indexes `docs/blueprint/` (steered by `.devin/wiki.json`). Attach
`playbooks/build-next-feature.devin.md` at session start, or save it under Settings &
Library → Playbooks. Run small sessions — one `feature_list.json` item each, sized ≤ ~3
engineer-hours.

## What's in the root

| File | What it is |
|------|-----------|
| `AGENTS.md` | Canonical agent instructions — every major coding agent reads it |
| `CLAUDE.md` | Claude Code bridge — imports AGENTS.md |
| `OPERATING-RULES.md` | Binding rules: architecture authority, DO-NOT-BUILD list, design posture |
| `BUILD-ORDER.md` | Dependency-ordered feature sequence, cycle breaks disclosed |
| `feature_list.json` | Machine-checkable work list — every item starts `"passes": false` |
| `PROGRESS.md` | Append-only session log — the build's cross-session memory |
| `playbooks/build-next-feature.devin.md` | Devin playbook for one build session |
| `docs/blueprint/` | The complete blueprint package, byte-identical |
````

---

## PROGRESS.md

<!-- Seeded session log: the harness convention adapted from long-running-agent practice.
     Append-only; the seed states that nothing is built yet. -->

Skeleton:

```markdown
# Build Progress Log

Nothing has been built yet. This workspace ships the {Project Name} blueprint
(`docs/blueprint/`, {F} features / {S} specifications / {A} acceptance criteria) and its
build harness — no code. The first session scaffolds the project per the architecture
document and creates `init.sh`.

This log is **append-only** cross-session memory. Never rewrite or delete an entry. Every
session appends one entry in this shape:

## {YYYY-MM-DD} — {feature_list.json item id, or "baseline scaffold"}

- **Done:** {what was implemented, and the commit(s)}
- **Verified:** {evidence — which AC IDs passed end-to-end, and how they were exercised}
```

---

## .devin/wiki.json

<!-- Wiki-generation steering only: `repo_notes` is the documented remedy for large doc
     trees. Valid JSON, this one key, nothing else. Adapt the note wording to the product;
     keep the three points: blueprint location, core content dirs, harness files. -->

Skeleton:

```json
{
  "repo_notes": [
    "The product blueprint lives under docs/blueprint/ — treat it as the authoritative product and technical documentation for this repository.",
    "docs/blueprint/specifications/ (per-feature specs with acceptance criteria) and docs/blueprint/architecture/ (recommended architecture and database schema) are the core content — index them deeply.",
    "The root files (README.md, AGENTS.md, OPERATING-RULES.md, BUILD-ORDER.md, PROGRESS.md, feature_list.json) are the build harness, not product documentation."
  ]
}
```

---

## playbooks/build-next-feature.devin.md

<!-- Official Devin playbook section format: Overview / Procedure / Specifications /
     Advice / Forbidden Actions / Required from User. The Procedure mirrors the AGENTS.md
     session protocol -- one source of truth, restated imperatively. -->

Skeleton:

```markdown
# Playbook: Build the Next Feature

## Overview

Build the next unbuilt feature-spec item of {Project Name} from this blueprint workspace:
pick it from `feature_list.json`, implement it per its specification under
`docs/blueprint/`, verify its acceptance criteria, and deliver.

## Procedure

1. Read `PROGRESS.md` and the recent git history to see where the build stands.
2. Open `feature_list.json` and select the FIRST item whose `"passes"` is `false` (the
   list is already in build order — see `BUILD-ORDER.md`). If the user named a specific
   item, use that one instead.
3. Read the item's `spec_file` in full, plus the architecture sections it touches.
4. Implement the item per its specification and `OPERATING-RULES.md`.
5. Verify every ID in the item's `ac_ids` end-to-end, as a user would exercise it.
6. Append a `PROGRESS.md` entry (date, item id, what was done, verification evidence).
7. Flip the item's `"passes"` to `true` — only after step 5 passed.
8. Commit and deliver a PR with a descriptive summary naming the item id and its AC IDs.

If no code exists yet, first scaffold the project per
`docs/blueprint/architecture/technical-architecture.md` (the RECOMMENDED choices), create
`init.sh`, and commit the baseline.

## Specifications

- Every ID in the item's `ac_ids` verified end-to-end
- `PROGRESS.md` appended with verification evidence
- The item's `"passes"` flipped to `true` in `feature_list.json`
- A PR delivered containing the implementation and the two file updates above

## Advice

- The spec is the contract — read it fully before writing code; its edge cases and error
  messages are requirements, not suggestions.
- Keep the session small: one `feature_list.json` item (≤ ~3 engineer-hours). A larger
  scope means stopping and asking the user to split the work.

## Forbidden Actions

- Never choose a documented architecture alternative over the recommendation
- Never implement anything on the `OPERATING-RULES.md` DO-NOT-BUILD list
- Never edit anything under `docs/blueprint/`
- Never edit `feature_list.json` item `id`s, `ac_ids`, or descriptions, and never flip
  `"passes"` without end-to-end verification

## Required from User

- Access to this repository
- Which item to build, if not the next `"passes": false` one
```

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- Per-tool rule files (Cursor, Copilot, Windsurf rule dirs) and `init.sh` — deliberately
  not emitted, per the Output Layout note above.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
