<!-- Export Template: Spec Kit Bundle (`speckit`)

     This template is the output blueprint for the `speckit` export target. Like the
     agent-workspace template, it defines a repo-shaped DIRECTORY of files (the C-31
     layout) plus the assembly recipe for each one: a ready-made GitHub Spec Kit workspace
     whose per-feature specs are pre-authored from the blueprint, so the consumer skips
     `/speckit.specify` and starts at `/speckit.plan`. It is consumed by
     export-speckit-formatter.md, spawned by n2b/workflows/stage-5/export.md, and gated by
     the rules in n2b/references/stage-5/fidelity-rules.md (speckit row = spec-render +
     verbatim-copy contract, target rules SK-1..SK-7).

     Governing rules:
     - RENDERING, NOT AUTHORING. The formatter authors only the content listed in the
       Authored-Content Whitelist below. It never invents, summarizes, paraphrases,
       rewords, renumbers, or drops product or technical content, never resolves open
       questions, and never drops an ID.
     - SCRIPT-EXTRACTED SPEC RENDER. The mechanical sections of every spec.md — the header
       block, one User Story per canonical SPEC with that spec's acceptance-criterion lines
       VERBATIM, one FR entry per SPEC, the Key Entities list — come from ONE Node-builtins
       script (pinned below) that parses the canonical files directly. IDs, AC text, and
       Purpose lines are extracted programmatically, never retyped through the model. The
       formatter authors only the condensation layers around them (Edge Cases digests,
       Measurable Outcomes, Assumptions) — always with pointers into the blueprint copy.
     - BYTE-IDENTICAL COPY. The full blueprint moves under `docs/blueprint/` by SHELL
       `cp`, manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every
       copied file with `cmp` (SK-5, the AWS-2 idiom). The rendered specs stay lean; the
       copy satisfies the universal roster rules structurally and gives `/speckit.plan`
       full source material one pointer away.
     - CURRENT-FORM SPEC KIT ONLY. No git branches (core no longer creates them), state
       via `.specify/feature.json`, `specs/` contractually untouched by `specify init`
       and upgrades, an existing constitution preserved by init. The bundle ships only
       what is agent-independent; the user installs their agent's command files with
       `specify init --here --integration <agent>`.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (normally `.n2b/exports/speckit/`).
-->

# Export Template: Spec Kit Bundle (`speckit`)

## Output Layout

The export directory IS a Spec Kit workspace root (contract C-31):

```
.n2b/exports/speckit/
  README.md                              # authored: quickstart, build-order table, skip-specify instructions
  .specify/
    memory/
      constitution.md                    # authored frame + the SC-XX scope list shell-extracted VERBATIM; version-stamp footer
    feature.json                         # {"feature_directory": "specs/001-{slug}"} — the pre-selected active feature
  specs/
    NNN-{slug}/                          # one per canonical FEAT; NNN = 001-padded build-order position
      spec.md                            # script fragments (header, User Stories with verbatim ACs, FRs, entities)
                                         #   + authored condensation tails (Edge Cases, Measurable Outcomes, Assumptions)
      research.md                        # authored: resolved architecture decisions for the feature, ADR IDs verbatim
  docs/
    blueprint/{rel}                      # shell-copied: byte-identical copy of every MANIFEST ## Package Inventory row
  FIDELITY-REPORT.md                     # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md                      # NOT produced by the formatter — workflow owns it
```

`{slug}` = the canonical specifications directory name minus its `FEAT-NN-` prefix
(`FEAT-01-account-registration-login` → `account-registration-login`). `NNN` = the
feature's 001-padded position in the Phase 2 D6 build order (Kahn's algorithm over the
dependency map's `Depends On` column, deterministic cycle-break restricted to features
inside a dependency cycle — lowest tier rank Core < Important < Nice-to-Have, then
lowest FEAT number (amended decision 104); broken edges disclosed in the README's order
table section).

**Deliberately NOT emitted:** no plan.md and no tasks.md (they are `/speckit.plan` and
`/speckit.tasks` outputs — pre-seeding a foreign plan fights the planning agent, and the
sanctioned channels for feeding architecture in are the pre-seeded per-feature research.md
plus free-text args to `/speckit.plan`); no `.specify/templates/` and no
`.specify/scripts/` (installed by `specify init`, versioned with the consumer's Spec Kit
release — shipping a snapshot would go stale against a near-daily-churning toolchain); no
per-agent command or skill directories (39 integrations exist; `specify init --here
--integration <agent>` installs exactly the right one); no git branches or git operations
of any kind (current Spec Kit keys nothing off branches — branch-per-feature is an opt-in
extension the consumer may add).

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

**Scope-exclusions extraction** — the complete `## Explicit Exclusions` section of
`scope-boundaries.md` (heading included, its subsections included, up to the next `## `
heading) — every SC entry with its rationale, verbatim (Phase 2 D7 discipline; feeds
constitution Principle 3):

```bash
extract_exclusions() {
  awk '/^## Explicit Exclusions/{f=1} f && /^## / && !/^## Explicit Exclusions/{exit} f' "$1"
}
# usage:  extract_exclusions "$PACKAGE_ROOT/features/scope-boundaries.md" >> "$OUTPUT_DIR/.specify/memory/constitution.md"
```

**Per-spec Edge Cases extraction** — grounds the authored digests (every canonical spec
type carries a `## Edge Cases` section):

```bash
extract_edge_cases() {
  awk '/^## Edge Cases/{f=1; next} f && /^## /{exit} f' "$1"
}
```

**Feature Signals extraction** — the `**Signals:**` line of the feature's record in
`product-features.md` (grounds the authored Measurable Outcomes):

```bash
feature_signals() {
  awk -v id="$1" '$0 == "**ID:** " id {f=1; next} f && /^\*\*ID:\*\*/{exit} f && /^\*\*Signals:\*\*/{print; exit}' \
    "$PACKAGE_ROOT/features/product-features.md"
}
```

**ADR register extraction** — the consolidated `## 14. Decision Log` section of the
architecture document (grounds every research.md; ADR IDs are cited from this extract,
never recalled):

```bash
extract_adr_log() {
  awk '/^## 14\./{f=1; next} f && /^## /{exit} f' "$PACKAGE_ROOT/architecture/technical-architecture.md"
}
```

**Authored prose** — written with quoted heredocs (`cat >> file <<'EOF' … EOF`),
interleaved with the fragment `cat`s and extraction appends above. Authored text never
restates canonical content deeply enough to substitute for reading it.

### The build script (one script, Node builtins only)

Every spec.md's mechanical sections are produced by the pinned script in the
`specs/NNN-{slug}/ mechanical fragments` section below. The formatter writes it to
`OUTPUT_DIR/.build-speckit.js`, runs it with `node` (fragments land in
`OUTPUT_DIR/.spec-fragments/`), keeps its stdout (the ORDER and BROKEN rows that feed the
README order table and `.specify/feature.json`), and **deletes both the script and the
fragments directory before finishing** — they are build tools, not part of the render. The
script parses the canonical dependency map, feature catalog, and spec files directly; no
FEAT/SPEC/AC ID, AC line, or Purpose line passes through model context.

### Authored-Content Whitelist

The formatter authors ONLY: `README.md`; the constitution's principle frames around the
verbatim SC extraction (plus its Governance section and footer); each spec.md's
`### Edge Cases` digests and its `## Success Criteria (mandatory)` /
`### Measurable Outcomes` / `## Assumptions` tail; each `research.md`; and the
`.specify/feature.json` value line (mechanical — ORDER row 001's slug). Everything else is
copied bytes, script fragments, or shell extraction.

Counted totals used anywhere in authored prose (feature/spec/AC/file counts) are derived
by `ls`/`grep`/`wc` over the canonical package at assembly time — never estimated or
recalled — and must agree with the script's stdout summary.

Authored content carries **zero open-item placeholder tokens** (the two capitalized
markers fidelity rule U5 lints for) and zero occurrences of the U6 lint phrase. This
target's `$U5_EXCLUDES` is `--exclude=constitution.md` — its verbatim SC extract
legitimately duplicates canonical scope text already counted in the `docs/blueprint/`
copy (the OPERATING-RULES.md duplication class); every other rendered file must add zero
occurrences beyond what its verbatim-extracted lines (AC lines, Purpose lines) already
carry from the canonical package.

### The two SC ID spaces (disclose, never merge)

`SC-XX` (two digits) is the n2b scope-boundary ID space — package-level DO-NOT-BUILD
entries, carried verbatim into the constitution's Principle 3. `SC-001…` (three digits)
is Spec Kit's own per-feature success-criteria numbering, used by every spec.md's
`### Measurable Outcomes` and restarting at SC-001 in each feature. They are different ID
spaces that both appear in this bundle; README and constitution each state the
distinction explicitly, and the formatter never renumbers either space to "fix" the
collision.

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — it is the foundation every rendered file points into. The copied-file
     count must equal INV_COUNT (SK-5 checks both parity and per-file `cmp`). Never
     normalize, re-wrap, or "fix" a copied file; a legacy package's quirks ride along
     verbatim and are noted in the completion report, never edited. -->

---

## specs/NNN-{slug}/ mechanical fragments — the pinned build script

The script emits, per feature in build order, a fragments directory
`OUTPUT_DIR/.spec-fragments/NNN-{slug}/` holding the two mechanical spec.md pieces:

- `01-header-stories.md` — the H1 `# Feature Specification: {Feature Name}`, the header
  block (`**Blueprint feature:** FEAT-NN` — the gate anchor, exactly one per spec.md —
  plus priority tier, build-order position, dependencies, blueprint-source pointer), the
  `## User Scenarios & Testing (mandatory)` heading, and **one User Story per canonical
  SPEC**: `### User Story N - {spec name} (Priority: P1|P2|P3)` (Core→P1, Important→P2,
  Nice-to-Have→P3 from the spec's `priority_tier`), body = the spec's `**Purpose:**` line
  extracted verbatim, then `**Acceptance Scenarios:**` followed by **that spec's
  AC-definition lines verbatim with their full IDs** — never paraphrased, never
  renumbered.
- `02-requirements.md` — `## Requirements (mandatory)`, `### Functional Requirements`
  with **one FR per SPEC** (`FR-NNN`, 001-numbered within the feature, a MUST statement
  built from the extracted Purpose, naming the SPEC ID verbatim and its
  `docs/blueprint/` path), and `### Key Entities` from the feature's
  `**Connected Entities:**` line.

stdout: `ORDER` rows (order NNN, FEAT ID, slug, name, priority, depends-on, spec count,
AC count — tab-separated) and `BROKEN` rows (cycle-break edges: FEAT A, FEAT B,
MUTUAL|FORWARD — MUTUAL iff B's Depends On also lists A). Write verbatim to
`OUTPUT_DIR/.build-speckit.js`, run, delete:

```js
#!/usr/bin/env node
// Transient build tool for the speckit export -- Node builtins only.
// Usage: node .build-speckit.js <package_root> <fragments_dir>
// Writes per-feature spec.md fragments (mechanical sections -- header, user stories
// with verbatim AC lines, FR entries, Key Entities) into <fragments_dir>/NNN-{slug}/,
// and prints ORDER rows (order, feat, slug, name, priority, depends-on, spec count,
// AC count) plus BROKEN rows (cycle-break edges: A, B, MUTUAL|FORWARD). Deleted after
// use -- not part of the render.
"use strict";
const fs = require("fs"), path = require("path");

const [root, fragDir] = process.argv.slice(2);
if (!root || !fragDir) {
  console.error("usage: node .build-speckit.js <package_root> <fragments_dir>");
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
  features.push({ id: cells[1], name: cells[3], priority: cells[4],
                  deps: (cells[7] || "").match(/FEAT-\d{2}/g) || [] });
}
if (features.length === 0) { console.error("FAIL: no FEAT rows parsed from the Features table"); process.exit(1); }
const known = new Set(features.map(f => f.id));
for (const f of features) f.deps = f.deps.filter(d => known.has(d) && d !== f.id);

// 1b. Slug = the canonical specifications directory name minus its "FEAT-NN-" prefix
//     (contract C-31) -- derived from disk, exactly one directory per feature.
const specDirs = fs.readdirSync(path.join(root, "specifications"), { withFileTypes: true })
  .filter(e => e.isDirectory() && /^FEAT-\d{2}-/.test(e.name)).map(e => e.name);
for (const f of features) {
  const mine = specDirs.filter(n => n.startsWith(f.id + "-"));
  if (mine.length !== 1) {
    console.error(`FAIL: expected exactly one specifications dir for ${f.id}, found ${mine.length}`);
    process.exit(1);
  }
  f.dirName = mine[0];
  f.slug = mine[0].slice(f.id.length + 1);
}

// 2. Deterministic Kahn's algorithm with the pinned cycle-break (Phase 2 D6 / C-31,
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
const TOTAL = ordered.length;

// 3. Per-feature record from product-features.md: the Connected Entities line of the
//    block whose "**ID:**" line names the feature (verbatim cell content).
const pfText = fs.readFileSync(path.join(root, "features", "product-features.md"), "utf8");
const entitiesByFeat = {};
{
  let cur = null;
  for (const line of pfText.split("\n")) {
    const idm = line.match(/^\*\*ID:\*\* (FEAT-\d{2})\s*$/);
    if (idm) { cur = idm[1]; continue; }
    const em = line.match(/^\*\*Connected Entities:\*\*\s*(.*)$/);
    if (em && cur) entitiesByFeat[cur] = em[1].trim();
  }
}

// 4. Per-spec extraction + fragment emission. Specs in SPEC-NNN order (zero-padded
//    filenames sort). Frontmatter, the Purpose line, and AC-definition lines are
//    extracted verbatim -- never retyped.
const P_OF_TIER = { "Core": "P1", "Important": "P2", "Nice-to-Have": "P3" };
const acAll = new Set();
for (let i = 0; i < TOTAL; i++) {
  const f = ordered[i];
  const nnn = String(i + 1).padStart(3, "0");
  f.order = nnn;
  const dirPath = path.join(root, "specifications", f.dirName);
  const specFiles = fs.readdirSync(dirPath)
    .filter(n => new RegExp(`^${f.id}\\.SPEC-\\d{3}.*\\.md$`).test(n)).sort();
  if (specFiles.length === 0) { console.error(`FAIL: no spec files in ${f.dirName}`); process.exit(1); }
  f.specCount = specFiles.length; f.acCount = 0;

  let stories = "";
  let frs = "";
  let storyN = 0;
  for (const file of specFiles) {
    storyN++;
    const text = fs.readFileSync(path.join(dirPath, file), "utf8");
    const fm = {};
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (m) for (const l of m[1].split("\n")) {
      const kv = l.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, "");
    }
    if (!fm.spec_id || !fm.spec_name || !fm.priority_tier) {
      console.error(`FAIL: missing spec_id/spec_name/priority_tier frontmatter in ${f.dirName}/${file}`);
      process.exit(1);
    }
    const prio = P_OF_TIER[fm.priority_tier];
    if (!prio) { console.error(`FAIL: unknown priority_tier "${fm.priority_tier}" in ${f.dirName}/${file}`); process.exit(1); }
    const pm = text.match(/^\*\*Purpose:\*\*\s*(.*)$/m);
    if (!pm || !pm[1].trim()) { console.error(`FAIL: no **Purpose:** line in ${f.dirName}/${file}`); process.exit(1); }
    const purpose = pm[1].trim();
    const seen = new Set(), acLines = [];
    for (const l of text.split("\n")) {
      const am = l.match(/^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2}):\*\*/);
      if (am && !seen.has(am[1])) { seen.add(am[1]); acAll.add(am[1]); acLines.push(l); }
    }
    if (acLines.length === 0) { console.error(`FAIL: no AC-definition lines in ${f.dirName}/${file}`); process.exit(1); }
    f.acCount += acLines.length;

    stories += `### User Story ${storyN} - ${fm.spec_name} (Priority: ${prio})\n\n`
      + `${purpose}\n\n**Acceptance Scenarios:**\n\n`
      + acLines.join("\n\n") + "\n\n";
    frs += `- **FR-${String(storyN).padStart(3, "0")}**: The system MUST implement `
      + `**${fm.spec_id}** (${fm.spec_name}) as specified: ${purpose} `
      + `Full spec: \`docs/blueprint/specifications/${f.dirName}/${file}\`\n`;
  }

  const header = `# Feature Specification: ${f.name}\n\n`
    + `**Blueprint feature:** ${f.id}\n`
    + `**Priority tier:** ${f.priority}\n`
    + `**Build order:** ${nnn} of ${TOTAL}\n`
    + `**Depends on:** ${f.deps.join(", ") || "—"}\n`
    + `**Blueprint source:** \`docs/blueprint/specifications/${f.dirName}/\`\n\n`
    + `## User Scenarios & Testing (mandatory)\n\n`;

  const entLine = (entitiesByFeat[f.id] || "").trim();
  const entities = entLine && !/^(none|—|--)$/i.test(entLine)
    ? entLine.split(/\)\s*,\s*/).map((e, idx, arr) => "- " + e.trim() + (idx < arr.length - 1 ? ")" : ""))
        .join("\n") + "\n"
    : `- No connected domain entities are recorded for ${f.id} in the blueprint's feature catalog.\n`;

  // Leading newline: this fragment is cat'ed directly after the authored Edge Cases
  // digest, so it supplies the blank line conventional Markdown puts before a heading.
  const req = `\n## Requirements (mandatory)\n\n### Functional Requirements\n\n`
    + frs + `\n### Key Entities\n\n` + entities;

  const outDir = path.join(fragDir, `${nnn}-${f.slug}`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "01-header-stories.md"), header + stories);
  fs.writeFileSync(path.join(outDir, "02-requirements.md"), req);
}

// 5. Print the order rows and broken edges.
ordered.forEach(f => console.log(
  ["ORDER", f.order, f.id, f.slug, f.name, f.priority, f.deps.join(", ") || "—",
   f.specCount, f.acCount].join("\t")));
for (const [a, b, k] of broken) console.log(["BROKEN", a, b, k].join("\t"));
console.error(`OK: ${TOTAL} features, ${ordered.reduce((s, f) => s + f.specCount, 0)} specs, ${acAll.size} distinct AC IDs`);
```

<!-- Verified against a complete live package: 27 features ordered 001..027, 187 specs,
     2,442 distinct AC IDs, deterministic order, two disclosed cycle-break edges (both
     MUTUAL; the SCC-restricted break of decision 104 never defers a merely
     transitively-blocked feature), zero SPEC-ID mapping misses. The script fails loudly on a missing table, missing
     frontmatter, a missing Purpose line, or a spec with no AC lines -- it never renders
     around a hole. -->

---

## specs/NNN-{slug}/spec.md — one per canonical FEAT

The current 12-heading Spec Kit spec shape, assembled per feature in this order:

| # | Content | Method |
|---|---------|--------|
| 1 | H1 + header block (`**Blueprint feature:** FEAT-NN` gate anchor) + `## User Scenarios & Testing (mandatory)` + one User Story per SPEC with its ACs verbatim | `cat` fragment `01-header-stories.md` — script output, untouched |
| 2 | `### Edge Cases` — one condensed digest bullet per SPEC, each with a `Source:` pointer | authored, grounded in `extract_edge_cases` over that feature's canonical spec files |
| 3 | `## Requirements (mandatory)` + `### Functional Requirements` (one FR per SPEC, naming the SPEC ID) + `### Key Entities` | `cat` fragment `02-requirements.md` — script output, untouched |
| 4 | `## Success Criteria (mandatory)` + `### Measurable Outcomes` (SC-001… per feature) + `## Assumptions` | authored (skeletons below) |

Authored middle piece (#2) — one bullet per SPEC, in SPEC order; the digest condenses
that spec's `## Edge Cases` section (extracted by shell into working context first),
never invents conditions, and never drops the pointer:

```markdown
### Edge Cases

- **FEAT-NN.SPEC-NNN ({spec name}):** {1–2 sentence condensation of that spec's edge
  conditions and error behaviors}. Source: `docs/blueprint/specifications/FEAT-NN-{slug}/{spec filename}` (section: Edge Cases)
```

Authored tail piece (#4) — Measurable Outcomes use **Spec Kit's per-feature SC-001…
numbering** (restarts each feature; not the n2b SC-XX scope IDs — see the two-ID-spaces
rule). Each outcome is grounded in the feature's `**Signals:**` line (shell-extracted)
and the matching metric entries of `features/success-metrics.md`; metric names and
target values are the canonical ones, never invented.

**Attribution rule (live-run defect class).** A metric belongs to a feature only when
`success-metrics.md` connects it there — its `**Connected Feature:**` field names this
FEAT ID, or the feature's own `**Signals:**` line names it. Never cite a neighbouring
feature's metric because the two are related, share a journey, or depend on each other:
a payments-adjacent feature does not inherit the payments feature's metric. Before
writing each outcome, confirm the metric's `**Connected Feature:**` resolves to the
feature being rendered; if no canonical metric connects, ground the outcome in this
feature's Signals alone rather than borrowing one:

```markdown
## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: {measurable outcome derived from the feature's Signals and its
  success-metrics entry — carrying the canonical target value when the metric defines
  one}. Source: `docs/blueprint/features/success-metrics.md`
- **SC-002**: {next outcome, same grounding}

## Assumptions

- **ASMP-XX**: {one-line digest of a register entry that bears on this feature}. Full
  register: `docs/blueprint/features/assumptions-constraints.md`
- {…every clearly relevant ASMP entry, by ID; when none clearly applies, a single line:
  "No register entry bears specifically on this feature — the package-wide register
  lives at `docs/blueprint/features/assumptions-constraints.md`."}
```

<!-- Heading roster per rendered spec.md, in order: # Feature Specification: /
     ## User Scenarios & Testing (mandatory) / ### User Story N - … (Priority: Pn) (one
     per SPEC) / ### Edge Cases / ## Requirements (mandatory) /
     ### Functional Requirements / ### Key Entities / ## Success Criteria (mandatory) /
     ### Measurable Outcomes / ## Assumptions. No review-checklist or clarifications
     sections — the current Spec Kit template dropped them. SK-2 checks the
     Blueprint-feature set, SK-3 the AC roster, SK-4 the per-spec mapping. -->

---

## specs/NNN-{slug}/research.md — one per canonical FEAT

Pre-seeded so `/speckit.plan` Phase 0 finds **no unknowns**: every architecture decision
relevant to the feature is stated as RESOLVED — decided upstream in the blueprint and
binding here. ADR IDs are cited verbatim from the shell-extracted `## 14. Decision Log`
register; entity names from the canonical schema. Skeleton:

```markdown
# Research: {Feature Name} ({FEAT-NN})

All technical decisions for this feature were made upstream in the blueprint and are
RESOLVED — there are no unknowns to research. Plan directly against the decisions below;
alternatives are documented in the blueprint for the humans who own this project, and are
not the planning agent's to choose.

## Decided stack (project-wide)

{3–6 lines: the recommended stack — frontend, backend, database, and the other decision
areas this feature rides on — each naming its ADR ID verbatim, e.g. "Frontend: {value}
(ADR-001)". Values come from the extracted Decision Log, never from memory.}

## Decisions specific to this feature

- **ADR-XXX — {Category}:** {decision value}. {One line on why it bears on this feature.}
- {…every register entry whose decision this feature touches; when only the project-wide
  stack applies, a single line: "No decision-register entry is specific to this feature
  beyond the project-wide stack above."}

## Data model

This feature touches these canonical entities: {entity/table names from the schema}.
Full table definitions, relationships, and lifecycle rules:
`docs/blueprint/architecture/database-schema.md`.

## Full-depth sources

- `docs/blueprint/architecture/technical-architecture.md` — the recommended architecture,
  every decision area, and the consolidated ADR register (Section 14)
- `docs/blueprint/architecture/technical-feasibility.md` — feasibility analysis and
  approach classifications
- `docs/blueprint/specifications/FEAT-NN-{slug}/` — this feature's full specifications
  (the verbatim source of every acceptance criterion in spec.md)
```

---

## .specify/memory/constitution.md

Authored principle frames around one verbatim shell extraction. `specify init` preserves
an existing constitution, and every `/speckit.plan` run reads it as a governance gate —
this file is how the blueprint's non-negotiables reach the consumer's planning agent.
Five Core Principles + Governance + the version-stamp footer:

```markdown
# {Project Name} Constitution

## Core Principles

### I. Blueprint fidelity

The specifications under `specs/` are rendered from the {Project Name} blueprint package
(`docs/blueprint/` — the canonical source of truth). Specs are the contract: build what
they say. FEAT, SPEC, and acceptance-criterion IDs are never edited, renumbered, or
dropped; when a spec and an implementation convenience conflict, the spec wins. The
blueprint copy is read-only — a defect there is reported to a human, never patched here.

### II. The recommended architecture is binding

`docs/blueprint/architecture/technical-architecture.md` records a RECOMMENDED choice for
every decision area, plus documented alternatives with `Choose instead when` conditions.
Build the recommendation. The alternatives are informational — they are the humans' to
weigh, not the agent's to choose. Each feature's `research.md` restates the applicable
decisions as resolved facts.

### III. Scope boundaries (DO-NOT-BUILD)

The exclusions below are carried verbatim from the blueprint
(`docs/blueprint/features/scope-boundaries.md`). Never implement any of them — even when
a spec seems adjacent or the capability seems easy to add. (ID-space note: these SC-XX
IDs are n2b scope-boundary IDs; the SC-001-style entries inside each spec.md's
Measurable Outcomes are Spec Kit's own per-feature numbering — two different ID spaces.)

{verbatim `## Explicit Exclusions` section — every SC-XX entry, appended by
extract_exclusions}

### IV. Design posture

{ONE of three statements, per the detected posture:}
{Posture 1 — `docs/blueprint/specifications/design-system/` directory exists:}
The supplied design system under `docs/blueprint/specifications/design-system/` is
BINDING: map its tokens and values to code as-is — never redesign, restyle, or "improve"
them.
{Posture 2 — legacy single file `docs/blueprint/specifications/design-system.md` exists:}
`docs/blueprint/specifications/design-system.md` is the design reference for this build.
(Provenance note: it was produced by an earlier version of the pipeline engine; current
packages instead carry a user-supplied design-system directory, or ship design-agnostic.)
{Posture 3 — neither exists:}
This package ships design-agnostic: no design system is part of the blueprint, and the
builder owns visual design. Honor any stated design preferences recorded in the brief's
Constraints section (`docs/blueprint/BRIEF.md`).

### V. Definition of done

A feature is done when its spec.md acceptance scenarios all pass end-to-end — every
acceptance criterion, by ID, exercised the way a user would. Not merely compiling, not
unit tests alone.

## Governance

This constitution supersedes ad-hoc practices for all work in this workspace. Amendments
require the humans who own the project; the blueprint itself is regenerated upstream,
never amended here. Every `/speckit.plan` and `/speckit.implement` run is expected to
comply with Principles I–V; complexity that violates them must be justified to a human
before it lands.

Version: 1.0.0 | Ratified: {YYYY-MM-DD} | Last Amended: {YYYY-MM-DD}
```

<!-- The footer line is gate-checked (SK-6): exactly `Version: 1.0.0 | Ratified:
     {export date} | Last Amended: {export date}` as the file's last non-empty line, both
     dates = today. SK-6 also requires every canonical SC ID present — the verbatim
     extraction guarantees it; never trim an SC entry to shorten the file. -->

---

## .specify/feature.json

The pre-selected active feature — the state `/speckit.specify` would normally write, shipped
so the consumer can start at `/speckit.plan` on build-order feature 001. Exactly this
object (one key; `{slug}` = ORDER row 001's slug from the script's stdout):

```json
{"feature_directory": "specs/001-{slug}"}
```

Written by `printf` from the ORDER row value; must parse under `node` (SK-6), and the
directory it names must exist in the render. README documents how to switch features.

---

## README.md

The human entry point — written LAST among the authored files, so every count and pointer
is real. Skeleton (four-backtick fence — the skeleton itself contains fenced blocks):

````markdown
# {Project Name} — Spec Kit Bundle

{One authored paragraph: this directory is a ready-made GitHub Spec Kit workspace
rendered from the {Project Name} blueprint package (version {PKG_VERSION}, rendered
{YYYY-MM-DD}): one pre-authored feature spec per blueprint feature ({F} features,
{S} specifications, {A} acceptance criteria — every criterion carried verbatim), a
project constitution carrying the blueprint's scope and architecture rules, pre-seeded
per-feature research, and the complete blueprint under docs/blueprint/. You skip
/speckit.specify entirely and go straight to /speckit.plan.}

## Build order

Features are ordered topologically — Kahn's algorithm over the blueprint dependency
map, deterministic cycle-break restricted to features inside a dependency cycle
(lowest tier rank Core < Important < Nice-to-Have, then lowest FEAT number), breaks
disclosed below. Directory prefixes match this table; work top to bottom.

| # | Feature | Name | Priority | Depends on | Specs | ACs |
|---|---------|------|----------|------------|-------|-----|
| 001 | FEAT-NN | {Name} | {tier} | {deps or —} | {n} | {n} |
{…one row per feature, ORDER-row values verbatim…}

### Dependency cycle breaks

{One line per BROKEN row, shape keyed by the row's MUTUAL|FORWARD field — or, when the
graph is acyclic: "None — the dependency graph is acyclic." The ↔ glyph asserts
mutuality and may appear ONLY on MUTUAL lines. Shapes:}
- FEAT-NN ↔ FEAT-MM are mutually dependent (each lists the other in the dependency
  map) — the order places FEAT-NN first; build iteratively, stubbing the not-yet-built
  counterpart's interface and completing it when its turn comes.
- FEAT-NN depends on FEAT-MM, which the order places later (FEAT-NN was sequenced as
  part of breaking a dependency cycle) — build FEAT-NN against a stub of the
  FEAT-MM-facing interface and complete the wiring when FEAT-MM is built.

## Quickstart

1. **Copy this directory into your project repository** (or work in it directly).
2. **Install Spec Kit and initialize in place:**

   ```
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
   specify init --here --integration <your-agent>
   ```

   `init` will warn before merging into a non-empty directory — proceed: `specs/` and
   the shipped constitution are preserved (Spec Kit never modifies `specs/` on init or
   upgrade, and an existing constitution is kept). Pick your agent from the supported
   integrations (Claude Code, Cursor, Copilot, Codex, Windsurf, …).
3. **Skip `/speckit.specify` — the specs are pre-authored.** Feature 001 is pre-selected
   in `.specify/feature.json`.
4. **Run `/speckit.plan`** with a stack hint, e.g.: "Follow the resolved decisions in
   research.md; the recommended architecture is
   docs/blueprint/architecture/technical-architecture.md." (Markdown-command agents use
   the dot form `/speckit.plan`; skills-mode agents — current Claude Code, Cursor, Codex
   layouts — use the hyphen form `/speckit-plan`.)
5. **Then `/speckit.tasks` → `/speckit.implement`.** `/speckit.analyze` is an optional
   consistency check. When a feature is done (constitution Principle V), switch to the
   next one and repeat from step 4.

## Switching features

Edit `.specify/feature.json` to name the next directory (e.g.
`{"feature_directory": "specs/002-{slug}"}`), or set the `SPECIFY_FEATURE_DIRECTORY`
environment variable (it takes precedence). This file is the state `/speckit.specify`
would normally write — shipped pre-filled so you never need that command here.

## Two kinds of SC IDs

`SC-XX` (two digits) = blueprint scope-boundary IDs — the DO-NOT-BUILD list in
`.specify/memory/constitution.md`. `SC-001…` (three digits) = Spec Kit's per-feature
success-criteria numbering inside each spec.md's Measurable Outcomes. Different ID
spaces; never merge or renumber them.

## Git is optional

Spec Kit no longer creates git branches, and nothing in this bundle keys off branch
names — initialize a repository if you want history (recommended), and add
branch-per-feature only if your team opts into that extension.

## Full depth

Every spec.md is a faithful condensation-plus-verbatim-ACs render; the complete
blueprint — full specifications, architecture with alternatives, database schema,
product research — lives byte-identical under `docs/blueprint/`. `research.md` in each
feature directory resolves the architecture decisions so `/speckit.plan` finds no
unknowns.
````

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- The Spec Kit-owned files named in the Output Layout's **Deliberately NOT emitted**
  block — they belong to the consumer's `specify init` and downstream commands, always.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
- The transient build script and `.spec-fragments/` directory — deleted before the
  formatter reports completion.
