<!-- Export Template: Vibe-Coding Pack (`lovable-pack` · `v0-pack` · `bolt-pack` · `replit-pack`)

     This template is the output blueprint for ALL FOUR vibe-coding-pack export targets.
     One shared formatter + this one shared template serve the four keys (decision 102's
     D1 — a deliberate P4-letter deviation with the purpose preserved: four registry rows
     point at the same two cells, and adding a fifth browser tool later is one wrapper
     block here plus one registry row). It defines a small DIRECTORY of files (the C-35
     layout): a shared core every key renders identically in shape — `KNOWLEDGE.md`
     (the one sanctioned ≤10,000-character distillation), `PROMPTS.md` (the staged prompt
     sequence), and the byte-identical `docs/blueprint/` copy — plus the divergent 30%:
     per-tool wrapper files and a per-tool README. It is consumed by
     export-vibe-pack-formatter.md, spawned by n2b/workflows/stage-5/export.md, and gated
     by the rules in n2b/references/stage-5/fidelity-rules.md (the four `*-pack` rows =
     distilled-render + verbatim-copy contract, target rules VP-1..VP-8).

     Governing rules:
     - RENDERING UNDER A CONDENSATION CONTRACT. KNOWLEDGE.md and PROMPTS.md are DISTILLED
       renders: the formatter condenses canonical content into the lean surfaces these
       browser tools actually ingest well (every one of the four officially warns against
       bulk context), but every FEAT / SPEC / AC / XBR / ADR / SC / ASMP ID that appears
       is verbatim, every ID and count comes from shell or the pinned script (extracted,
       never retyped), and acceptance criteria are NOT bulk-transcluded into PROMPTS.md —
       the prd condensation contract governs: each prompt's definition-of-done cites its
       feature's AC IDs and counts, a prompt MAY carry a few exemplar ACs, and any AC text
       that does appear must be verbatim. Full depth lives in the docs/blueprint/ copy.
     - BYTE-IDENTICAL COPY. The blueprint moves under `docs/blueprint/` by SHELL `cp`,
       manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every copied
       file with `cmp` (VP-6, the AWS-2 idiom). The copy is what satisfies U1–U4
       structurally; the rendered surfaces stay lean on purpose. Lovable cannot import the
       copy (no repo/ZIP import) — it still ships: the copy is the user's reference layer
       and the import path for the three import-capable tools, and the gate measures the
       files on disk, not what a given tool ultimately ingests.
     - SCRIPT-DERIVED ORDER AND ROSTERS, PARSE-BACK-PROVEN PROMPTS. The build order
       (Kahn + the deterministic cycle-break pinned since Phase 2 — every n2b export
       orders features identically), the per-feature SPEC/AC ID rosters and counts, the
       verbatim Purpose lines, and the SC roster come from ONE Node-builtins script
       (pinned below, `extract` mode). The same script's `check` mode parse-back-validates
       the authored PROMPTS.md — one prompt per FEAT in the computed order, strict
       per-feature SPEC/AC attribution, definition-of-done counts reconciled — before the
       file counts as done (the Phase 4 parse-back idiom). No ID, AC ID, name, or count
       passes through model context into a rendered ID position.
     - ONE KNOWLEDGE BUDGET FOR ALL FOUR. `KNOWLEDGE.md` is ≤ 10,000 characters HARD
       (gate-checked, VP-2) because Lovable's Project Knowledge field caps there — and
       leaner is strictly better for every tool's token economy. The verbatim SC-XX text
       therefore lives in the UNCAPPED per-tool wrapper file (the OPERATING-RULES /
       constitution precedent); KNOWLEDGE.md carries the SC list as IDs + condensed
       one-line labels only.
     - THE RESOLVED TARGET KEY IS THE OUTPUT DIRECTORY'S BASE NAME. The registry pins
       Output dir = `.n2b/exports/{target-key}/` for every row, so the formatter derives
       the key from OUTPUT_DIR and renders that key's wrapper set + README — the workflow
       core stays target-agnostic and unchanged.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (`.n2b/exports/lovable-pack/`, `.n2b/exports/v0-pack/`,
       `.n2b/exports/bolt-pack/`, or `.n2b/exports/replit-pack/`).
-->

# Export Template: Vibe-Coding Pack (`lovable-pack` · `v0-pack` · `bolt-pack` · `replit-pack`)

## Output Layout

The export directory holds the shared core plus the requested key's wrapper files
(contract C-35):

```
.n2b/exports/{target-key}/
  README.md                # authored, per-tool: import path, Plan→Build flow, tool-specific gotchas
  KNOWLEDGE.md             # authored: ≤ 10,000 chars hard; distilled constitution; every content
                           #   bullet carries a canonical ID or [S: {rel-path}] tag; SC-XX as IDs +
                           #   condensed labels (verbatim SC text lives in the wrapper file)
  PROMPTS.md               # authored around script rows: Prompt 0 = Plan-mode seed, then exactly
                           #   one prompt per FEAT in build order, parse-back-validated
  docs/
    blueprint/{rel}        # shell-copied: byte-identical copy of every MANIFEST ## Package Inventory row
  <per-tool wrapper files> # see the table below — only the requested key's set is rendered
  FIDELITY-REPORT.md       # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md        # NOT produced by the formatter — workflow owns it
```

Per-tool wrapper files (the divergent 30% — D3). Each key's **primary constitution file**
(bold) carries the full verbatim SC-XX DO-NOT-BUILD list, shell-extracted (VP-5 checks it
there):

| Target key | Wrapper files rendered | Why these |
|---|---|---|
| `lovable-pack` | **`AGENTS.md`** (root) | Lovable reads a root `AGENTS.md` "always, regardless of session length" — but only once a Lovable-created repo is connected; the user commits it after Lovable makes its repo |
| `v0-pack` | **`INSTRUCTIONS.md`** | v0 Instructions are account-level reusable directives (applied via the + button per message, staying checked until unchecked); KNOWLEDGE.md is separately added as a project **Source** |
| `bolt-pack` | **`agents.md`** (root) + `.bolt/prompt` + `.bolt/ignore` | `agents.md` is Bolt's auto-found entry point for agent instructions; `.bolt/prompt` is the legacy always-re-sent mirror (byte-identical to `agents.md`, produced by `cp`); `.bolt/ignore` (`.gitignore` syntax) keeps the bulk blueprint copy out of the AI context window |
| `replit-pack` | **`replit.md`** (root) + `.agents/skills/build-conventions/SKILL.md` + `.agents/skills/design-posture/SKILL.md` | `replit.md` is Replit's native auto-read agent-memory file (re-read every request; `AGENTS.md` is NOT read by Replit); the two Agent Skills load their metadata every chat and their body on demand |

**Deliberately NOT emitted:** no settings-field content as files — Lovable's Knowledge,
Bolt's Project Knowledge, and Replit's Custom Instructions are settings-panel fields, not
repo files; each README says exactly what to paste where (the paste content is
KNOWLEDGE.md). No `.lovable/plan.md` (a community-reported path only — never hardcode it).
No `.bolt/config.json` (no evidence the convention exists). No code, no scaffold, no
per-tool config beyond the wrapper table above.

## Global Assembly Rules

### Target-key resolution (pin this exactly)

```bash
TARGET_KEY=$(basename "${OUTPUT_DIR%/}")
case "$TARGET_KEY" in
  lovable-pack|v0-pack|bolt-pack|replit-pack) ;;
  *) echo "FAIL: OUTPUT_DIR '$OUTPUT_DIR' does not resolve to a vibe-pack target key"; exit 1 ;;
esac
```

The registry's Output-dir column is `.n2b/exports/{target-key}/` for every row, so the
base name IS the resolved key. The shared core (`KNOWLEDGE.md`, `PROMPTS.md`,
`docs/blueprint/`) follows the same skeleton and content mapping for every key but is
**independently rendered per run** — each export is a separate invocation, so byte-identity
across keys is neither promised nor checked (C-35); it is guaranteed only where `cmp`
enforces it, the `docs/blueprint/` copy.

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
# usage:  extract_exclusions "$PACKAGE_ROOT/features/scope-boundaries.md" >> "$OUTPUT_DIR/{primary constitution file}"
```

**Authored prose** — written with quoted heredocs (`cat >> file <<'EOF' … EOF`),
interleaved with the extraction appends and script-row renders. Authored text never
restates canonical content deeply enough to substitute for reading it — the pack orients a
browser tool; the blueprint copy carries the depth.

### The build script (one script, two modes, Node builtins only)

The build order, per-feature SPEC/AC rosters and counts, verbatim Purpose lines, and the
SC roster are produced by the pinned script in the section below, run in `extract` mode.
After PROMPTS.md is authored, the SAME script runs in `check` mode and
parse-back-validates it — one Prompt 0 seed, exactly one feature prompt per FEAT whose
header sequence equals the computed build order (dependencies therefore precede, cycle
breaks included), strict per-prompt SPEC/AC attribution, per-spec definition-of-done
counts reconciled to canonical, cited totals summing to the package AC total, every broken
edge disclosed. The formatter writes the script to `OUTPUT_DIR/.build-vibe-pack.js`, runs
`extract`, authors PROMPTS.md from the rows, runs `check`, and **deletes the script before
finishing** — it is a build tool, not part of the render. No ID, AC ID, name, or count
passes through model context into a rendered ID position.

### Authored-Content Whitelist

The formatter authors ONLY: `README.md`, `KNOWLEDGE.md` (bullets condensed from canonical
sources, every one carrying its back-reference), the PROMPTS.md prose around the
script-derived rows (the intro, the Plan seed, each prompt's feature summary and
architecture-rules line — spec digests are verbatim Purpose lines, definition-of-done
lines are script values), the wrapper files' constitution frame around the verbatim SC
extraction, and the two Replit SKILL.md bodies. Everything else is copied bytes, shell
extraction, or script output rendered verbatim (the formatter adds list markers and line
frames; it never recomputes, reorders, or "corrects" a script value).

Counted totals used anywhere in authored prose (feature/spec/AC/file counts) are derived
by `ls`/`grep -c`/`wc` over the canonical package at assembly time — never estimated or
recalled — and must agree with the script's TOTALS row.

`KNOWLEDGE.md` and `README.md` carry **zero open-item placeholder tokens** (the two
capitalized markers fidelity rule U5 lints for) and zero occurrences of the U6 lint
phrase. Per the fidelity-rules §3 rows for these targets, `$U5_EXCLUDES` covers the key's
constitution/wrapper files (they transclude verbatim canonical text the blueprint copy
already carries — the OPERATING-RULES.md / constitution.md duplication class) **plus
`PROMPTS.md`** (verbatim exemplar-AC and Purpose transclusion): lovable → `AGENTS.md`;
v0 → `INSTRUCTIONS.md`; bolt → `agents.md` + `.bolt/prompt`; replit → `replit.md` +
`.agents/skills/**`. `KNOWLEDGE.md` is NEVER excluded — condensed labels only, it must
add zero. (`.bolt/prompt` and `.bolt/ignore` carry no `.md` extension and sit outside
U5's `*.md` scope regardless; the exact grep syntax is owned by fidelity-rules.md §3.)

### The KNOWLEDGE.md budget

`wc -c < KNOWLEDGE.md` must be ≤ **10,000** characters — gate-checked (VP-2; Lovable's
Project Knowledge field caps there, and every tool in this family re-sends its persistent
context, so lean wins everywhere). Target **8,500–9,500** so the file always pastes into
the 10k field with headroom. The file is structured entirely as `- ` bullets under `## `
headings — every content bullet carries a canonical ID (FEAT / SPEC / AC / XBR / ADR /
SC / ASMP pattern) or a compact `[S: {package-relative path}]` source tag, which is what
makes VP-2's pointer-coverage check mechanical. No indented sub-bullets; no bullet without
a back-reference. When trimming to fit: condense labels and merge bullets, never drop an
SC ID (VP-5 needs every one here) and never let a bullet lose its back-reference.

### The pinned prompt shapes (mechanical anchors — pin these exactly)

The fidelity gate and the script's `check` mode identify PROMPTS.md structure by these
shapes, so they are RESERVED and must appear nowhere else in the file:

- **Prompt headers** — `## Prompt 0 — Plan-mode seed` (no FEAT ID in the header), then
  `## Prompt {n} — {Feature Name} (FEAT-NN)` for n = 1..N. Matched by
  `^## Prompt [0-9]+ — ` with the feature-prompt form ending `(FEAT-NN)`. No other `## `
  heading in PROMPTS.md may start with `Prompt `.
- **Definition-of-done spec lines** — `- FEAT-NN.SPEC-NNN — {n} acceptance criteria
  ({first AC ID}…{last AC ID}) — {copied spec path}`, one per SPEC of the prompt's
  feature. Matched by `^- FEAT-[0-9]{2}\.SPEC-[0-9]{3} — [0-9]+ acceptance criteria`.
  The spec-digest bullets are bolded (`- **FEAT-…`) precisely so they never match this
  shape.
- **Per-prompt total line** — `All {n} acceptance criteria above must pass end-to-end…`,
  matched by `^All [0-9]+ acceptance criteria above`. Exactly one per feature prompt; the
  cited totals sum to the package AC count across the file (VP-4).
- **Prompt 0 carries no SPEC or AC IDs** — the Plan seed names features only, so
  prompt-scoped attribution has no unowned IDs (the script's check mode enforces it).

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — it is the full-depth layer every rendered pointer targets, and it is
     what satisfies the U1–U4 roster rules structurally. The copied-file count must equal
     INV_COUNT (VP-6 checks both parity and per-file `cmp`). Never normalize, re-wrap, or
     "fix" a copied file; a legacy package's quirks ride along verbatim and are noted in
     the completion report, never edited. It ships for ALL FOUR keys — including
     lovable-pack, where it is the user's reference layer rather than an import input. -->

---

## The pinned build script

Write verbatim to `OUTPUT_DIR/.build-vibe-pack.js`. Run
`node "$OUTPUT_DIR/.build-vibe-pack.js" extract "$PACKAGE_ROOT"` and capture stdout; after
authoring PROMPTS.md run
`node "$OUTPUT_DIR/.build-vibe-pack.js" check "$PACKAGE_ROOT" "$OUTPUT_DIR/PROMPTS.md"`;
delete the file after `check` passes:

```js
#!/usr/bin/env node
// Transient build tool for the vibe-coding pack exports -- Node builtins only.
// Usage:
//   node .build-vibe-pack.js extract <package_root>
//   node .build-vibe-pack.js check   <package_root> <prompts_md>
//
// extract prints, tab-separated, for the formatter to render verbatim:
//   ORDER rows  (order#, feat id, name, priority, depends-on, spec count, AC count)
//   BROKEN rows (cycle-break edges: A, B, MUTUAL|FORWARD -- disclosed as order notes
//                in the PROMPTS.md intro; MUTUAL iff B's Depends On also lists A)
//   SPEC rows   (feat id, spec id, name, type, AC count, first AC id, last AC id,
//                copied spec path, Purpose line verbatim)
//   SC rows     (scope-exclusion IDs from ## Explicit Exclusions, document order)
//   TOTALS row  (feature total, spec total, distinct AC total)
//
// check re-derives the same order and parse-back-validates the authored PROMPTS.md:
//   one Prompt 0 seed carrying no SPEC/AC IDs; exactly one feature prompt per canonical
//   FEAT, numbered 1..N, whose header sequence equals the computed build order
//   (dependencies therefore precede, cycle breaks included); every SPEC/AC ID inside a
//   prompt body belonging to that prompt's FEAT; per-spec definition-of-done lines
//   covering the feature's full spec set with canonical AC counts; per-prompt totals and
//   the cross-file sum reconciling to the package AC total; every BROKEN edge disclosed
//   in the intro, with the mutuality token ↔ forbidden on FORWARD edges. Exits non-zero
//   with a FAIL (parse-back) diagnostic on any defect.
//
// Deleted after use -- it is a build tool, not part of the render.
"use strict";
const fs = require("fs"), path = require("path");

const [mode, root, promptsPath] = process.argv.slice(2);
if (!["extract", "check"].includes(mode || "") || !root || (mode === "check" && !promptsPath)) {
  console.error("usage: node .build-vibe-pack.js extract <package_root> | check <package_root> <prompts_md>");
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

// 2. Deterministic Kahn's algorithm with the pinned cycle-break (Phase 2 D6 -- identical
//    across every n2b export; amended decision 104): ready = every feature whose deps
//    are all placed; emit the ready feature with the lowest FEAT number. When nothing is
//    ready, break a cycle: candidates are restricted to features inside a dependency
//    cycle (SCC of size > 1 of the remaining subgraph, Tarjan, deterministic); pick the
//    candidate with the lowest tier rank (Core < Important < Nice-to-Have), then the
//    lowest FEAT number, and record each still-unmet dependency as a broken edge
//    classified MUTUAL (the dependency also lists the picked feature in its Depends On)
//    or FORWARD.
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

// 3. Per-feature spec extraction: frontmatter fields, the **Purpose:** line, and the
//    AC-definition IDs -- extracted verbatim, never retyped. Specs in SPEC-NNN order
//    (zero-padded filenames sort).
const allAcIds = new Set();
for (const f of ordered) {
  const dirName = `${f.id}-${f.slug}`;
  const dirPath = path.join(root, "specifications", dirName);
  const specFiles = fs.readdirSync(dirPath)
    .filter(n => new RegExp(`^${f.id}\\.SPEC-\\d{3}.*\\.md$`).test(n)).sort();
  f.specs = []; f.acCount = 0;
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
    const pm = text.match(/^\*\*Purpose:\*\*\s*(.*)$/m);
    if (!pm || !pm[1].trim()) { console.error(`FAIL: no **Purpose:** line in ${dirName}/${file}`); process.exit(1); }
    const acIds = new Set();
    for (const l of text.split("\n")) {
      const am = l.match(/^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2}):\*\*/);
      if (am) acIds.add(am[1]);
    }
    if (acIds.size === 0) { console.error(`FAIL: no AC definition lines in ${dirName}/${file}`); process.exit(1); }
    const sorted = [...acIds].sort();
    sorted.forEach(a => allAcIds.add(a));
    f.acCount += sorted.length;
    f.specs.push({ id: fm.spec_id, name: fm.spec_name, type: fm.spec_type,
                   acCount: sorted.length, acFirst: sorted[0], acLast: sorted[sorted.length - 1],
                   relPath: `docs/blueprint/specifications/${dirName}/${file}`,
                   purpose: pm[1].trim() });
  }
}

// 4. SC roster from scope-boundaries.md ## Explicit Exclusions (document order,
//    distinct). An empty roster is legal for small packages; a missing section is not.
const scText = fs.readFileSync(path.join(root, "features", "scope-boundaries.md"), "utf8");
if (!/^## Explicit Exclusions/m.test(scText)) { console.error("FAIL: scope-boundaries.md has no ## Explicit Exclusions section"); process.exit(1); }
let inEx = false;
const scIds = [];
for (const line of scText.split("\n")) {
  if (/^## Explicit Exclusions/.test(line)) { inEx = true; continue; }
  if (inEx && /^## /.test(line)) break;
  if (!inEx) continue;
  for (const m of line.matchAll(/SC-\d{2}/g)) if (!scIds.includes(m[0])) scIds.push(m[0]);
}

if (mode === "extract") {
  ordered.forEach((f, i) => console.log(
    ["ORDER", i + 1, f.id, f.name, f.priority, f.deps.join(", ") || "—", f.specs.length, f.acCount].join("\t")));
  for (const [a, b, k] of broken) console.log(["BROKEN", a, b, k].join("\t"));
  for (const f of ordered) for (const s of f.specs) console.log(
    ["SPEC", f.id, s.id, s.name, s.type, s.acCount, s.acFirst, s.acLast, s.relPath, s.purpose].join("\t"));
  for (const id of scIds) console.log(["SC", id].join("\t"));
  console.log(["TOTALS", ordered.length,
    ordered.reduce((n, f) => n + f.specs.length, 0), allAcIds.size].join("\t"));
  process.exit(0);
}

// 5. check mode -- parse-back PROMPTS.md against the canonical structure above.
const fail = msg => { console.error("FAIL (parse-back): " + msg); process.exit(1); };
const pText = fs.readFileSync(promptsPath, "utf8");
const headerRe = /^## Prompt (\d+) — (.*)$/;
const prompts = [];
const intro = [];
for (const line of pText.split("\n")) {
  const h = line.match(headerRe);
  if (h) prompts.push({ num: parseInt(h[1], 10), title: h[2], body: [] });
  else if (prompts.length === 0) intro.push(line);
  else prompts[prompts.length - 1].body.push(line);
}
if (prompts.length !== ordered.length + 1) fail(`${prompts.length} prompt headers vs ${ordered.length + 1} expected (Prompt 0 + one per feature)`);
if (prompts[0].num !== 0) fail("the first prompt header is not Prompt 0");
if (/\(FEAT-\d{2}\)/.test(prompts[0].title)) fail("Prompt 0's header must not carry a FEAT ID");
if (/FEAT-\d{2}\.SPEC-\d{3}/.test(prompts[0].body.join("\n"))) fail("Prompt 0 carries SPEC/AC IDs -- the Plan seed names features only");
const introText = intro.join("\n");
for (const [a, b, k] of broken) {
  const line = introText.split("\n").find(l => l.includes(a) && l.includes(b));
  if (!line) fail(`broken edge ${a} -> ${b} is not disclosed in the intro order notes`);
  if (k === "FORWARD" && line.includes("↔"))
    fail(`broken edge ${a} -> ${b} is FORWARD (not mutual) but its order note carries the mutuality token ↔`);
}
let citedSum = 0;
for (let i = 1; i < prompts.length; i++) {
  const p = prompts[i], f = ordered[i - 1];
  if (p.num !== i) fail(`prompt at position ${i} is numbered ${p.num} -- feature prompts are numbered 1..N in order`);
  const hm = p.title.match(/\((FEAT-\d{2})\)$/);
  if (!hm) fail(`prompt ${i}'s header carries no (FEAT-NN) suffix: "${p.title}"`);
  if (hm[1] !== f.id) fail(`prompt ${i} is ${hm[1]} but build-order position ${i} is ${f.id} -- the sequence must equal the computed order`);
  const body = p.body.join("\n");
  for (const m of body.matchAll(/(FEAT-\d{2})\.SPEC-\d{3}/g)) {
    if (m[1] !== f.id) fail(`prompt ${i} (${f.id}) references ${m[0]} -- every SPEC/AC ID in a prompt must belong to that prompt's feature`);
  }
  const dod = new Map();
  for (const l of p.body) {
    const dm = l.match(/^- (FEAT-\d{2}\.SPEC-\d{3}) — (\d+) acceptance criteria/);
    if (dm) dod.set(dm[1], parseInt(dm[2], 10));
  }
  const canonSpecs = new Map(f.specs.map(s => [s.id, s.acCount]));
  if (dod.size !== canonSpecs.size) fail(`prompt ${i} (${f.id}) has ${dod.size} definition-of-done spec lines vs ${canonSpecs.size} canonical specs`);
  for (const [sid, n] of canonSpecs) {
    if (!dod.has(sid)) fail(`prompt ${i} (${f.id}) definition-of-done is missing ${sid}`);
    if (dod.get(sid) !== n) fail(`prompt ${i} (${f.id}) cites ${dod.get(sid)} acceptance criteria for ${sid} vs ${n} canonical`);
  }
  const tm = body.match(/^All (\d+) acceptance criteria above/m);
  if (!tm) fail(`prompt ${i} (${f.id}) has no "All {n} acceptance criteria above" total line`);
  if (parseInt(tm[1], 10) !== f.acCount) fail(`prompt ${i} (${f.id}) total line cites ${tm[1]} vs ${f.acCount} canonical`);
  citedSum += f.acCount;
}
if (citedSum !== allAcIds.size) fail(`per-prompt AC totals sum to ${citedSum} vs ${allAcIds.size} distinct canonical AC IDs`);
console.log(["PARSEBACK OK", ordered.length, citedSum].join("\t"));
```

<!-- The order computation is character-identical to the agent-workspace and prd scripts
     (steps 1–2) — the four vibe packs, the workspace, the Spec Kit bundle, and the PRD
     all order features identically. The script fails loudly on a missing table, missing
     frontmatter, a missing Purpose line, a spec with no AC lines, or any parse-back
     defect — it never renders around a hole. Verified shapes at reference scale: 27 ORDER
     rows, 187 SPEC rows, 2,442 distinct AC IDs, disclosed cycle edges. -->

---

## KNOWLEDGE.md — the one sanctioned distillation

The paste-everywhere constitution: Lovable's Knowledge field, a v0 Source, Bolt's Project
Knowledge field, and a Replit reference all take this exact file. ≤ 10,000 characters
hard; target 8,500–9,500 (the budget rules above).

| # | Section | Content | Method |
|---|---------|---------|--------|
| 1 | `# {Project Name} — Project Knowledge` + one frame line | what this file is: the distilled constitution for building {Project Name}; full depth in `docs/blueprint/` | authored |
| 2 | `## What this is` | 2–4 bullets: product purpose, target users/roles, core value — each tagged `[S: BRIEF.md]` | authored digest |
| 3 | `## Domain glossary` | one bullet per term a builder must not misread — `**{Term}** — {one line} [S: {rel-path}]` | authored digest |
| 4 | `## Data model — core entities` | one bullet per core entity: `**{Entity}** — {one-line role} [S: architecture/database-schema.md]` | authored digest |
| 5 | `## Architecture (binding)` | first bullet: the recommended architecture is binding, documented alternatives are informational only `[S: architecture/technical-architecture.md]`; then one bullet per core stack area: `{Area}: {choice} (ADR-NNN)` — ADR IDs verbatim | authored, ADR IDs shell-derived |
| 6 | `## Features — build order` | one bullet per FEAT in ORDER-row order: `FEAT-NN {Name} — {tier}: {condensed one-line}` — IDs, names, tiers script-verbatim | authored around script rows |
| 7 | `## DO-NOT-BUILD (scope exclusions)` | one bullet per SC row: `SC-NN — {condensed one-line label}` — every canonical SC ID (VP-5), labels condensed by the formatter; a closing bullet pointing at the verbatim text in the wrapper file and `docs/blueprint/features/scope-boundaries.md` | authored around script SC rows |
| 8 | `## Design posture` | ONE bullet — the posture statement matching the detected posture (skeletons in the wrapper section below), tagged with its source path | authored |
| 9 | `## Depth` | one bullet: full specs with all {A} acceptance criteria, architecture alternatives, and the schema live under `docs/blueprint/` `[S: specifications/, architecture/]` | authored |

Skeleton:

```markdown
# {Project Name} — Project Knowledge

Distilled build constitution for {Project Name}. Full depth: docs/blueprint/.

## What this is

- {Product purpose, one line} [S: BRIEF.md]
- {Target users and roles, one line} [S: BRIEF.md]
- {Core value / problem solved, one line} [S: BRIEF.md]

## Domain glossary

- **{Term}** — {one-line definition} [S: features/product-features.md]
{…}

## Data model — core entities

- **{Entity}** — {one-line role} [S: architecture/database-schema.md]
{…}

## Architecture (binding)

- The recommended architecture is BINDING; documented alternatives are informational only [S: architecture/technical-architecture.md]
- {Area}: {choice} (ADR-NNN)
{…one bullet per core stack area…}

## Features — build order

- FEAT-NN {Name} — {tier}: {condensed one-line}
{…one bullet per feature, in build order…}

## DO-NOT-BUILD (scope exclusions)

- SC-NN — {condensed one-line label}
{…one bullet per SC ID, in document order…}
- Full verbatim exclusions with rationale: {the key's primary constitution file} and docs/blueprint/features/scope-boundaries.md [S: features/scope-boundaries.md]

## Design posture

- {ONE posture statement} [S: {posture source path}]

## Depth

- Full specs with all {A} acceptance criteria, architecture alternatives, and the database schema: docs/blueprint/ [S: specifications/, architecture/]
```

<!-- Every `- ` line is a content bullet and VP-2 checks each one for a canonical ID or a
     `[S: ` tag — write no bullet without one. SC labels are CONDENSED here on purpose
     (the 10k budget); the verbatim SC text lives in the wrapper file (VP-5 checks both
     surfaces). Counts in prose are shell-derived. -->

---

## PROMPTS.md — the staged prompt sequence

One self-contained prompt per FEAT in build order, preceded by the Plan-mode seed. The
prd condensation contract governs AC handling: full ACs are NOT transcluded (the reference
package averages ~90 ACs per feature — bulk transclusion contradicts every tool's own
lean-prompt guidance); each definition-of-done cites the feature's AC IDs and counts
pointing into the blueprint copy; a prompt MAY carry a few exemplar ACs, and any AC text
that appears must be verbatim. Every SPEC/AC ID inside prompt N belongs to prompt N's
FEAT — no cross-feature bleed (the attribution rule, gate-checked by VP-4 and the script's
parse-back).

| # | Content | Method |
|---|---------|--------|
| 1 | `# {Project Name} — Build Prompt Sequence` + how-to-use intro (one prompt per message, in order; Prompt 0 in Plan/Discussion mode; never paste multiple prompts at once) | authored |
| 2 | Order notes — one line per BROKEN row (both FEAT IDs on the line), shape keyed by the row's MUTUAL\|FORWARD field (the ↔ glyph asserts mutuality — MUTUAL lines only), or the none-line: "The dependency graph is acyclic — the order below has no forced breaks." | authored around script output |
| 3 | `## Prompt 0 — Plan-mode seed` — distilled product + architecture summary, the FEAT list in build order (IDs + names, NO SPEC/AC IDs), the DO-NOT-BUILD pointer, "generate the plan — do not write code yet" | authored around script rows |
| 4 | One `## Prompt {n} — {Feature Name} (FEAT-NN)` per ORDER row: feature summary (from `features/product-features.md` Description substance), dependencies line, one spec-digest bullet per SPEC row (Purpose verbatim), architecture-rules line, definition-of-done block (per-spec lines + total line, script values) | authored around script rows |

Skeleton:

```markdown
# {Project Name} — Build Prompt Sequence

{How to use, 3–5 lines: paste one prompt per message, in order. Prompt 0 goes into the
tool's Plan/Discussion mode; review the plan before building. Prompts 1–{N} are Build
prompts, one feature each. Never paste several prompts at once — these tools degrade on
bulk input. KNOWLEDGE.md (already loaded as project knowledge) carries the standing rules.}

{Order notes: one line per BROKEN row, shape keyed by its MUTUAL|FORWARD field — or the
none-line. MUTUAL, e.g.: "FEAT-04 ↔ FEAT-14 are mutually dependent (each lists the
other in the dependency map); the sequence places FEAT-04 first — when building it,
stub the FEAT-14-facing interface and complete it in FEAT-14's prompt." FORWARD, e.g.:
"FEAT-NN depends on FEAT-MM, which the sequence places later (sequenced as part of
breaking a dependency cycle) — when building FEAT-NN, stub the FEAT-MM-facing interface
and complete it in FEAT-MM's prompt." The ↔ glyph appears ONLY on MUTUAL lines.}

---

## Prompt 0 — Plan-mode seed

I am building {Project Name}: {2–3 distilled sentences — what it is, who it serves}.
The standing rules and scope exclusions are in the project knowledge; the complete
blueprint lives under docs/blueprint/.

The build runs as {N} features in this fixed dependency order:

1. FEAT-NN — {Name}
{…one numbered line per ORDER row: ID + name only…}

Architecture (binding): {one condensed stack line}. Nothing on the DO-NOT-BUILD list in
the project knowledge may be built.

Generate the plan for this build: confirm the feature order above, propose the project
scaffold, and tell me what you need before feature 1. Do not write code yet.

---

## Prompt {n} — {Feature Name} (FEAT-NN)

Build feature FEAT-NN — {Feature Name} ({tier}). {1–2 authored sentences of feature
substance from the canonical feature description.}

**Already built (dependencies):** {dep FEAT IDs + names for deps that precede this prompt
in build order, or "none — this is the starting feature". A dep on a BROKEN row of the
script's output comes LATER in the order — list it separately as "{FEAT-NN} follows later
(see the order notes in Prompt 0); build against a stub for now", never under the
already-built label.}

**Build these specifications** (full text under docs/blueprint/specifications/{feature-dir}/):

- **FEAT-NN.SPEC-NNN — {Spec Name}** ({type}): {Purpose line, script-extracted verbatim}
{…one bullet per SPEC row, in SPEC order…}

**Architecture rules:** follow the binding recommended architecture in the project
knowledge{; ADR IDs cited where clearly relevant} — never substitute a documented
alternative, and touch nothing on the DO-NOT-BUILD list.

**Definition of done:**

- FEAT-NN.SPEC-NNN — {n} acceptance criteria ({first AC ID}…{last AC ID}) — {copied spec path}
{…one line per SPEC row…}

All {feature AC total} acceptance criteria above must pass end-to-end — verify them as a
user would before calling this feature done.
```

<!-- The header, definition-of-done, and total-line shapes are the pinned mechanical
     anchors — honor the reserved-shapes rule in the Global Assembly Rules. Every ID,
     count, AC range, Purpose line, and path in this file is a script value rendered
     verbatim; the authored layer is the frame prose only. The file is not done until the
     script's check mode prints its PARSEBACK OK line. -->

---

## Per-tool wrapper files

Only the requested key's set is rendered. Every primary constitution file carries the same
lean constitution — binding stack, conventions, the FULL verbatim SC-XX DO-NOT-BUILD list
(shell-extracted via `extract_exclusions`, never retyped), the design posture, and
pointers to `KNOWLEDGE.md` + `docs/blueprint/` — differing only in the per-tool framing
paragraph. These files are uncapped (the 10k budget binds KNOWLEDGE.md alone).

### The shared constitution skeleton (all four keys)

| # | Content | Method |
|---|---------|--------|
| 1 | `# {Project Name} — Build Constitution` + the per-key framing paragraph (below) | authored |
| 2 | `## 1. The recommended architecture is binding` — recommendation binding, alternatives informational (with the `docs/blueprint/architecture/` pointer) | authored |
| 3 | `## 2. Conventions` — one feature per prompt in PROMPTS.md order, never re-derive the order; specs are the contract and acceptance criteria (by ID) are the definition of done; the blueprint copy is read-only reference | authored |
| 4 | `## 3. DO-NOT-BUILD — explicit scope exclusions` heading + one framing sentence, then the verbatim `## Explicit Exclusions` section — every SC entry with rationale | authored frame + `extract_exclusions` append, VERBATIM — never retyped |
| 5 | `## 4. Design posture` — ONE of three statements, per the detected posture | authored |
| 6 | `## 5. Where everything lives` — KNOWLEDGE.md, PROMPTS.md, docs/blueprint/ pointer map | authored |

Section skeletons (adapt wording to the product; keep every rule's substance):

```markdown
## 1. The recommended architecture is binding

`docs/blueprint/architecture/technical-architecture.md` records a RECOMMENDED choice for
every decision area, plus documented alternatives with their conditions. Build the
recommendation. The alternatives are informational — for the humans who own this project
to weigh; they are not the builder's to choose.

## 2. Conventions

- Build one feature per prompt, in PROMPTS.md order — the sequence is dependency-computed;
  never re-derive or reorder it.
- The specifications under docs/blueprint/specifications/ are the contract: a feature is
  done when its acceptance criteria — by ID, per its prompt's definition-of-done — pass
  end-to-end, exercised as a user would.
- Everything under docs/blueprint/ is read-only reference: never edit, regenerate, or
  restyle a blueprint file.

## 3. DO-NOT-BUILD — explicit scope exclusions

The exclusions below are carried verbatim from the blueprint
(docs/blueprint/features/scope-boundaries.md). Never implement any of them — even when a
spec seems adjacent or the capability seems easy to add.

{verbatim `## Explicit Exclusions` section — every SC-XX entry}

## 4. Design posture

{Posture 1 — `docs/blueprint/specifications/design-system/` directory exists:}
The supplied design system under docs/blueprint/specifications/design-system/ is BINDING:
map its tokens and values to code as-is — never redesign, restyle, or "improve" them.

{Posture 2 — legacy single file `docs/blueprint/specifications/design-system.md` exists:}
docs/blueprint/specifications/design-system.md is the design reference for this build.
(Provenance note: it was produced by an earlier version of the pipeline engine; current
packages instead carry a user-supplied design-system directory, or ship design-agnostic.)

{Posture 3 — neither exists:}
This package ships design-agnostic: no design system is part of the blueprint, and the
builder owns visual design. Honor any stated design preferences recorded in the brief's
Constraints section (docs/blueprint/BRIEF.md).

## 5. Where everything lives

- KNOWLEDGE.md — the distilled product + architecture constitution (also pasted into the
  tool's knowledge surface; this file and that field must agree)
- PROMPTS.md — the Plan-mode seed plus one build prompt per feature, in dependency order
- docs/blueprint/ — the complete blueprint package, byte-identical (read-only reference)
```

### `lovable-pack` → `AGENTS.md` (root)

The constitution skeleton with this framing paragraph first:

```markdown
{Lovable reads this root AGENTS.md on every request once its GitHub repo is connected —
commit this pack into that repo after Lovable creates and connects it. Until then, the
same rules travel via the Knowledge field (KNOWLEDGE.md) and the prompts.}
```

### `v0-pack` → `INSTRUCTIONS.md`

The constitution skeleton with this framing paragraph first:

```markdown
{Add this file's content as a v0 Instruction (Instructions are account-level: apply via
the + button on a message; they stay checked until unchecked). KNOWLEDGE.md goes in
separately, as a project Source. Prompts assume v0's native Next.js + React + Tailwind +
shadcn/ui stack unless the binding architecture below says otherwise.}
```

### `bolt-pack` → `agents.md` + `.bolt/prompt` + `.bolt/ignore`

`agents.md` (root, lowercase — Bolt's auto-found entry point): the constitution skeleton
with this framing paragraph first:

```markdown
{Bolt finds this root agents.md automatically — it is the entry point for agent
instructions in this repository. Keep it authoritative: .bolt/prompt mirrors it for
legacy compatibility only.}
```

`.bolt/prompt` — the legacy always-re-sent mirror, produced by shell (never re-authored):

```bash
mkdir -p "$OUTPUT_DIR/.bolt"
cp "$OUTPUT_DIR/agents.md" "$OUTPUT_DIR/.bolt/prompt"
```

`.bolt/ignore` — pinned contents, exactly (D3: the blueprint copy and build dirs stay out
of the always-on AI context window; `.gitignore` syntax):

```
# Keep bulk reference content and build output out of Bolt's AI context window.
# docs/ holds the verbatim blueprint copy — consult it outside Bolt, or paste the
# relevant spec section into chat when a prompt needs more depth.
docs/
node_modules/
dist/
build/
.next/
out/
coverage/
```

### `replit-pack` → `replit.md` + `.agents/skills/`

`replit.md` (root — Replit's native auto-read agent-memory file, re-read every request):
the constitution skeleton with this framing paragraph first:

```markdown
{Replit reads this replit.md automatically on every request. It is deliberately lean —
extremely large files may not be fully processed — so the one long section here is the
DO-NOT-BUILD list, which must always be in context. Replit does NOT read AGENTS.md; this
file is the instruction surface.}
```

Two Agent Skills under `.agents/skills/` (SKILL.md folders per the open Agent Skills
spec — metadata loads every chat, body on demand):

`.agents/skills/build-conventions/SKILL.md` skeleton:

```markdown
---
name: build-conventions
description: How to build a {Project Name} feature from this blueprint pack — use when starting, building, or verifying any feature.
---

# Build Conventions

1. Build one feature per session, in PROMPTS.md order — never re-derive the order.
2. Before building, read the feature's specs under docs/blueprint/specifications/ (the
   prompt's definition-of-done names each file).
3. Follow the binding recommended architecture (replit.md section 1); never substitute a
   documented alternative.
4. Verify every acceptance criterion in the prompt's definition-of-done end-to-end, as a
   user would, before calling the feature done.
5. Checkpoint after each feature. Nothing on the DO-NOT-BUILD list (replit.md section 3)
   may be built.
```

`.agents/skills/design-posture/SKILL.md` skeleton:

```markdown
---
name: design-posture
description: The binding design posture for {Project Name} — use when making any visual, layout, or styling decision.
---

# Design Posture

{The SAME ONE posture statement rendered in replit.md section 4, restated with 2–4 lines
of operational guidance: posture 1 — where the supplied tokens live and that they map to
code as-is; posture 2 — the legacy reference file and its provenance note; posture 3 —
design-agnostic, builder owns visual design, honor brief Constraints preferences.}
```

---

## README.md — per-tool import path, Plan→Build flow, gotchas

The human entry point, written LAST among the authored files so every count and pointer is
real. Only the requested key's skeleton is rendered. **Every tool-behavior claim in these
skeletons is a research-pinned fact (work order §1, decision 102) — render them as
written; never add a tool claim the register does not carry, and never assert anything it
lists as unverified.** Each skeleton opens with the same orientation paragraph:

```markdown
# {Project Name} — {Tool} Pack

{One authored paragraph: this directory is a prompt-ready build pack rendered from the
{Project Name} blueprint package (version {PKG_VERSION}, rendered {YYYY-MM-DD}) — {F}
features, {S} specifications, {A} acceptance criteria — for building in {Tool}:
KNOWLEDGE.md (the distilled project knowledge), PROMPTS.md (a Plan-mode seed plus one
build prompt per feature, in dependency order), {the key's wrapper files}, and the
complete blueprint verbatim under docs/blueprint/ for reference.}
```

### `lovable-pack` README skeleton (after the orientation paragraph)

````markdown
## Set up Lovable

Lovable has no repo or ZIP import (it exports TO GitHub, not from it), so the pack loads
by paste:

1. Open your Lovable project → Settings → Knowledge, and paste the full contents of
   KNOWLEDGE.md into Project Knowledge. The field caps at 10,000 characters; KNOWLEDGE.md
   is sized to fit with headroom. (Workspace Knowledge is a separate 10k field for
   owners/admins; if both are set, Project Knowledge wins on conflict.)
2. Keep this pack's folder open beside Lovable — PROMPTS.md is your build script and
   docs/blueprint/ is your reference when a prompt needs more depth.

## Plan, then build

1. Switch to Plan mode (flat 1 credit per message, writes no code) and paste Prompt 0
   from PROMPTS.md. Review the plan it produces.
2. Switch to default mode and feed the feature prompts ONE AT A TIME, in order. Never
   paste several at once — bulk input degrades output and burns credits.

## Connect GitHub, then commit AGENTS.md

When Lovable has created and connected its GitHub repo, commit this pack's AGENTS.md at
the repo root — Lovable always reads a root AGENTS.md once the repo is connected, making
the constitution persistent without spending Knowledge budget. Commit docs/blueprint/
alongside it as the in-repo reference.

## Gotchas

- KNOWLEDGE.md and AGENTS.md carry the same rules on purpose — Knowledge covers you
  before the repo exists; AGENTS.md takes over after.
- Everything under docs/blueprint/ is read-only reference — regenerate upstream if it
  needs to change.
````

### `v0-pack` README skeleton (after the orientation paragraph)

````markdown
## Set up v0

1. Create a v0 Project and add KNOWLEDGE.md as a **Source** (Projects → Sources take
   PDF/TXT/MD/code as persistent project knowledge — Markdown is the format v0 prefers).
2. Add INSTRUCTIONS.md as an **Instruction** (Instructions are account-level: apply one
   via the + button on a message; it stays checked until you uncheck it).
3. Optional: import the whole pack — v0 supports both ZIP and GitHub import (attach caps:
   free 5 MB chat / 10 MB ZIP; paid 20 MB / 50 MB).

## Plan, then build

1. Start with Prompt 0 from PROMPTS.md as a planning message and review the plan.
2. Feed the feature prompts one at a time, in order. v0 queues up to 10 prompts — queue a
   few consecutive feature prompts if you want, but keep the order.
3. Prompts assume v0's native stack — Next.js + React + Tailwind + shadcn/ui — except
   where the binding architecture in the project knowledge says otherwise.

## Gotchas

- **Scrub secrets.** v0 stores prompts client-side — never paste API keys, credentials,
  or tokens into a prompt. This pack ships none; keep it that way.
- v0 publishes no per-Source size or per-prompt length caps — the pack is designed
  defensively (staged prompts, Source-based knowledge), so stay with the sequence.
- Everything under docs/blueprint/ is read-only reference — regenerate upstream if it
  needs to change.
````

### `bolt-pack` README skeleton (after the orientation paragraph)

````markdown
## Set up Bolt

1. Push this pack to a GitHub repository — GitHub import is the reliable way to hand Bolt
   a file bundle (Bolt documents no native ZIP or local-folder import into a chat).
2. Import it in Bolt: the homepage GitHub button, or Import-from-URL.
3. Bolt auto-finds the root agents.md — it is the entry point for agent instructions.
   .bolt/ignore keeps docs/ (the bulk blueprint copy) and build directories out of the AI
   context window, so the always-on context stays lean.
4. Paste KNOWLEDGE.md into Project Knowledge (a settings-panel field — available at
   account, project, or team level; it cannot ship as a repo file).

## Plan, then build

1. Enter Plan Mode (code-free, roughly a 90% token cut) and paste Prompt 0 from
   PROMPTS.md. Review the plan.
2. Switch to Build and feed the feature prompts one at a time, in order — Bolt's own
   guidance says to focus on specific work, not the entire codebase.

## Gotchas

- **Do not branch per feature.** Bolt does not support merging branches in-app — merge on
  GitHub if you branch at all; the simple path is one branch, one feature prompt at a
  time.
- .bolt/prompt is a legacy mirror of agents.md: it is re-sent on every page load and chat
  (bloat there is a recurring tax) and needs a StackBlitz round-trip to edit. Treat
  agents.md as the file you maintain.
- When a prompt needs more spec depth than its digest, open the spec file under
  docs/blueprint/ outside Bolt and paste the relevant section into chat — docs/ is
  excluded from Bolt's context by .bolt/ignore on purpose.
- Everything under docs/blueprint/ is read-only reference — regenerate upstream if it
  needs to change.
````

### `replit-pack` README skeleton (after the orientation paragraph)

````markdown
## Set up Replit

1. Import the pack: `replit.com/github.com/{user}/{repo}` for a GitHub repo, or
   `replit.com/import` (ZIP works too).
2. replit.md is read automatically on every request — it carries the binding rules and
   the DO-NOT-BUILD list. **Replit does not read AGENTS.md**; replit.md is the file that
   matters here.
3. The two Agent Skills under .agents/skills/ (build-conventions, design-posture) load
   their metadata every chat and their body on demand.

## Plan, then build

1. Enter Plan Mode (the mode dropdown at the bottom-left of the chat input; the agent
   must be paused to switch) and paste Prompt 0 from PROMPTS.md. Review the ordered task
   list, then "Start building" flips you to Build.
2. Feed the feature prompts one at a time, in order — one feature per session, with a
   checkpoint after each.

## Cost warning — effort-based billing

Replit bills by effort, and Plan Mode messages are billable too. Long autonomous passes
get expensive fast: plan first, build ONE feature per session, checkpoint, and review
before the next prompt. Never paste the whole sequence and walk away.

## Gotchas

- Custom Instructions (Workspace Settings → Customization) exist only on Pro/Enterprise
  plans — this pack does not rely on them; replit.md carries everything.
- replit.md has no strict character limit, but extremely large files may not be fully
  processed — the pack keeps it lean on purpose; do not paste bulk content into it.
- Replit's agent has a documented greenfield bias (it degrades on large imported
  codebases). This pack ships documentation and harness only — no code — so the import
  stays light; keep sessions small as the codebase grows.
- Everything under docs/blueprint/ is read-only reference — regenerate upstream if it
  needs to change.
````

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- Settings-field content as files, `.lovable/plan.md`, `.bolt/config.json` — deliberately
  not emitted, per the Output Layout note above.
- Another key's wrapper files — one key per invocation; the shared core is re-rendered
  fresh each run, never copied across export directories.
- `backlog.json` — all four `*-pack` registry rows say `Needs backlog.json: no`.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
