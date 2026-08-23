<!-- Export Template: Jira Backlog (`jira`)

     This template is the output blueprint for the `jira` export target. It defines the C-33
     directory layout plus the assembly recipe for each file: a Jira-importable CSV backlog
     (epics + stories, wiki-markup descriptions, outward blocks links), the canonical
     backlog.json alongside it, a dependency-graph render, a step-by-step import guide, and
     the byte-identical blueprint copy. It is consumed by export-jira-formatter.md, spawned
     by n2b/workflows/stage-5/export.md, and gated by the rules in
     n2b/references/stage-5/fidelity-rules.md (jira row = condensation + verbatim-copy
     contract, target rules JIRA-1..JIRA-9).

     Governing rules:
     - RENDERING, NOT AUTHORING. The formatter authors only the files in the
       Authored-Content Whitelist below. It never invents, summarizes, paraphrases,
       rewords, renumbers, or drops product or technical content, and never drops an ID.
     - BACKLOG.JSON IS THE STRUCTURED INPUT (D2). The Backlog Builder has already written
       `backlog.json` into OUTPUT_DIR before this formatter is spawned (workflow Step 2.5,
       registry row `Needs backlog.json: yes`). The pinned script `JSON.parse`s it for ALL
       structure — epics, stories, ACs, edges, parent refs, tiers. Re-deriving structure
       from canonical markdown is a defect. The script opens canonical files for exactly
       one purpose: fetching the verbatim texts behind the foundation epic's `carries` ID
       rosters (D7), validated against those rosters.
     - SCRIPT-BUILT CSV. `jira-import.csv` — every row, every description, every AC line —
       comes from ONE Node-builtins script (pinned below, verified against a complete live
       package). No CSV content ever passes through model context.
     - WIKI MARKUP, NOT MARKDOWN. Jira's importer converts wiki markup to ADF and does NOT
       interpret Markdown (JRACLOUD-79205). A `**bold**` or line-initial `#` surviving into
       a Description is a gate failure (JIRA-7). The translation table below is the
       contract.
     - BYTE-IDENTICAL COPY. The blueprint moves under `docs/blueprint/` by SHELL `cp`,
       manifest-driven, frontmatter KEPT — the fidelity gate byte-compares every copied
       file with `cmp` (JIRA-9, the AWS-2 idiom).
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides (normally
       `.n2b/`). "MANIFEST" is the package manifest path (normally
       `.n2b/tracking/MANIFEST.md`). "OUTPUT_DIR" is the export directory the workflow
       provides (normally `.n2b/exports/jira/`).
-->

# Export Template: Jira Backlog (`jira`)

## Output Layout

The export directory holds a two-tier handoff (contract C-33): `backlog.json` lossless for
agents and scripts, `jira-import.csv` for the documented Jira import path.

```
.n2b/exports/jira/
  README.md                # authored: what each file is, in one screen
  import-guide.md          # authored: the Jira import walkthrough + REST alternative (D9)
  relationships.md         # authored frame around script-derived graph rows (D8)
  backlog.json             # BUILDER-OWNED: written by the Backlog Builder BEFORE this
                           #   render (contract C-26) — the formatter reads it, never
                           #   writes, rebuilds, or edits it
  jira-import.csv          # script-generated: one row per epic and story, epics first,
                           #   RFC-4180 quoted, wiki-markup descriptions (D5/D6/D7)
  docs/
    blueprint/{rel}        # shell-copied: byte-identical copy of every MANIFEST
                           #   ## Package Inventory row
  FIDELITY-REPORT.md       # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md        # NOT produced by the formatter — workflow owns it
```

**Deliberately NOT emitted (D14):**

- **No `jira-import.json`.** Research 2026-07-28 refuted its rationale (C-33 supersedes
  decision 86.2's three-artifact layering): Jira's JSON importer survives only in the
  pre-Aug-2024 "old experience", expresses link direction exactly as CSV does
  (source→destination — it does not fix CSV's outward-only shape), and its epic→story
  parentage relies on the legacy `gh-epic-link` custom field whose value must be the
  epic's **real issue key** — unknowable to an exporter and undocumented for Cloud after
  the April 2024 Epic Link → Parent unification. CSV is the actively documented path.
- **No push script and no MCP instructions file.** The REST path is documented in
  `import-guide.md` instead of shipped as code — untested executable code against a live
  Jira is a liability this export does not take on. MCP push is documented as not viable
  today, so users do not burn a day discovering it.
- **No `.taskmaster/`-style tool directories**, no GitHub or Linear renders (separate
  future targets), and no sprint/board/version metadata — the package has no schedule to
  express.

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
interleaved with script-output rows where a skeleton says so. Authored text never restates
canonical content deeply enough to substitute for reading it.

### The build script (one script, Node builtins only)

`jira-import.csv` is produced by the pinned script in the `jira-import.csv` section below.
The formatter writes it to `OUTPUT_DIR/.build-jira-csv.js`, runs it with `node`, keeps its
stdout (the STAT / FEATREL / MUTUAL / EDGE rows that feed `relationships.md` and the
self-checks), and **deletes it before finishing** — the script is a build tool, not part
of the render. It `JSON.parse`s `backlog.json` directly; no ID, AC line, or description
passes through model context.

### Authored-Content Whitelist

The formatter authors ONLY: `README.md`, `import-guide.md`, and the `relationships.md`
prose frame around the script-derived graph rows. Everything else is copied bytes
(`docs/blueprint/`), builder output (`backlog.json` — present before the formatter runs,
never touched), or script output (`jira-import.csv`).

Counted totals used anywhere in authored prose (feature/spec/AC/edge/row counts) come from
the script's STAT rows or from shell derivation over the canonical package at assembly
time — never estimated or recalled.

Authored files carry **zero open-item placeholder tokens** (the two capitalized markers
fidelity rule U5 lints for — `$U5_EXCLUDES` is empty for this target, D12, so its entire
headroom is consumed by the verbatim blueprint copy) and zero occurrences of the U6 lint
phrase. The CSV and JSON payloads sit outside U5's `*.md` scope entirely; the pinned
script's own lint (below) is what keeps the CSV clean.

---

## docs/blueprint/{rel} — the verbatim blueprint copy

| # | Content | Method |
|---|---------|--------|
| 1 | Every MANIFEST `## Package Inventory` row `{rel}`, copied to `docs/blueprint/{rel}` | shell `cp` per the pinned idiom — byte-identical, frontmatter kept, directory structure preserved |

<!-- Copy FIRST — every Source: pointer in the CSV lands inside it. The copied-file count
     must equal INV_COUNT (JIRA-9 checks both parity and per-file `cmp`). Never normalize,
     re-wrap, or "fix" a copied file; a legacy package's quirks ride along verbatim and
     are noted in the completion report, never edited. Universal rules U1–U4 are satisfied
     structurally by this copy — JIRA-4/5/8 measure the CSV itself, which is where the
     real fidelity burden of this target lives. -->

---

## jira-import.csv — the Jira-importable backlog

### Column contract (D5)

Columns, in this order (repeated columns are Jira's multi-value CSV convention — the
header cell name repeats identically):

| Column | Cardinality | Value |
|---|---|---|
| `Issue ID` | 1 | Sequential integers from 1, in row order. Arbitrary per-file identifiers — they exist so `Parent` and `blocks` can reference rows within this file; they are not Jira keys. |
| `Issue Type` | 1 | `Epic` or `Story` |
| `Parent` | 1 | The parent epic's `Issue ID`; empty for epics |
| `Summary` | 1 | Epics: `{FEAT-NN} {Name}` (foundation epic: its name). SPEC stories: `{spec id} {title}`. Foundation stories: per the D7 table below. Hard-capped at 255 characters (Jira's Summary limit). |
| `Description` | 1 | Condensed **Jira wiki markup** per the condensation contract below |
| `Priority` | 1 | `Core`→`High`, `Important`→`Medium`, `Nice-to-Have`→`Low` |
| `Labels` | repeated (max labels across rows) | Epics: `feature-epic`/`foundation-epic` + tier. SPEC stories: `{spec_type}` + tier. Foundation stories: `foundation` + kind label + tier. |
| `blocks` | repeated (max outward links across rows, min 1) | **Outward only**: emitted from `backlog.json` edges with `type == "blocks"` exclusively, each cell the target's in-file `Issue ID`. The mirrored `is-blocked-by` edges are NEVER emitted — they would double every link. No `is blocked by` column exists (JIRA-6). |

Row rules:

- **Epics before stories** (§1.4 ordering rule — the importer processes rows
  sequentially, so every epic row must precede every row naming it as `Parent`). Row
  order: feature epics in `backlog.json` order (ascending FEAT), the foundation epic,
  every SPEC story in `backlog.json` order (by feature, then SPEC number), then the
  foundation stories in D7 order.
- One row per epic (feature epics + the foundation epic) and one row per story (every
  canonical SPEC + every D7 foundation story). Nothing else.
- Every data row has the same field count as the header (short rows are padded with empty
  fields — JIRA-3 parses with a real RFC-4180 reader and checks this).

**RFC-4180 quoting (D5):** every field containing `,`, `"`, or a newline is wrapped in
double quotes with inner `"` doubled to `""`. Descriptions are multi-line wiki markup, so
virtually every Description field is quoted. Rows are LF-terminated. Example — the field

```
He taps "Log in", then leaves
```

is emitted as

```
"He taps ""Log in"", then leaves"
```

The pinned script's `csvField` implements exactly this; nothing else may write CSV cells.

### Description condensation contract (D6) — Jira wiki markup

Per SPEC story, in this order, assembled mechanically from `body_md`:

| Block | Source (mechanical) |
|---|---|
| `h2. Purpose` | The spec's `**Purpose:**` line (present in all five spec types), text verbatim |
| `h2. Scope` | The `**In Scope:**` bullets of `## Scope and Non-Goals`, verbatim, as wiki `*` bullets |
| `h2. Behavior` (digest) | The `## Business Rules` bullets verbatim where the section exists; otherwise the fixed line `Full behavioral detail lives in the source document below.` |
| `h2. Edge Cases` (digest) | One wiki bullet per `## Edge Cases` bullet, carrying the bullet's **bold lead phrase** (the condition name); a bullet without a bold lead is carried in full. The resolutions live one pointer away. |
| `h2. Acceptance Criteria` | **Every AC line of the spec, verbatim** — see the AC rule below |
| `Source:` line | `Source: docs/blueprint/{source_path}` — the spec's path under the blueprint copy |

**The AC rule (the single most important fidelity property of this export).** Each
canonical AC line `**{AC-ID}:** Given {rest}` is copied from `body_md`'s
`## Acceptance Criteria` section with exactly one transformation: the leading `**{id}:**`
emphasis delimiters become wiki `*{id}:*`. Everything after `:* ` — the entire
`Given …, when …, then …` clause text — is **character-identical** to the canonical line
(JIRA-5 samples it against the spec file). The clause text is never re-worded, re-ordered,
truncated, or passed through the Markdown translator. The script validates per story that
the extracted AC IDs equal the story's `acceptance_criteria` objects, in order, and fails
loudly on any mismatch.

**Budget:** soft budget ≤ 15,000 characters; hard cap 30,000 (safely under Jira Cloud's
unraisable 32,767 — JRACLOUD-72176 — which is also Excel's per-cell limit). When a
description exceeds the soft budget, ONLY the Edge Cases digest (from the end), then the
Behavior digest, are trimmed — each leaving a fixed trimmed-notice bullet — and **the
Acceptance Criteria block and the `Source:` line are never truncated**. A description
still over 30,000 after full digest removal is a loud script failure, never a silent
truncation. (Live-package reality: max description 9,959 chars, zero trims.)

**Markdown → wiki translation table** (applied by the script's `mdToWiki` to every
extracted non-AC surface; a `#`-heading, `**bold**`, or triple-backtick fence surviving
into any Description is a JIRA-7 gate failure):

| Markdown | Jira wiki markup |
|---|---|
| `# H` … `###### H` (line-initial) | `h1. H` … `h6. H` |
| `**bold**` | `*bold*` |
| `[text](url)` | `[text\|url]` |
| `` `code` `` | `{{code}}` |
| ```` ``` ```` fenced block | `{code} … {code}` |
| `- item` / `* item` (line-initial bullet) | `* item` |
| `1. item` (line-initial ordered item) | `* item` — **deliberately NOT wiki's `# item`**: a line-initial `#` is indistinguishable from a leaked Markdown heading to the gate's lint, so ordered lists render as plain bullets (the verbatim original is one `Source:` pointer away; the house spec format uses `- ` bullets throughout, so this branch is defensive) |
| `\| a \| b \|` table header + `\|---\|` separator | `\|\|a\|\|b\|\|` header row, separator dropped; data rows keep single pipes |
| single `*italic*` | left untouched — the house corpus emphasizes with `**` only, and touching single asterisks risks corrupting bullet markers |

### Epic descriptions

- **Feature epic:** `h2. Purpose` — the record's `**Description:**` text extracted from
  `description_md` (backlog.json field, verbatim); `h2. Key Capabilities` — the epic's
  `key_capabilities` array as wiki bullets; `Source: docs/blueprint/features/product-features.md`.
- **Foundation epic:** its `description_md` (the builder's deterministic template string)
  with the leading `###` heading line dropped, wiki-translated; `Source: docs/blueprint/`.

### Foundation & Cross-Cutting stories (D7)

Composed at render time by the script, from the foundation epic's `carries` rosters. The
roster IDs come from `backlog.json`; the verbatim texts behind them are fetched from four
canonical files and **validated against the rosters** (set mismatch = loud failure). All
foundation stories: `Issue Type` Story, `Parent` = the foundation epic's Issue ID,
`Priority` High, labels `foundation` + kind + `Core`. Order and content:

| # | Story (one per…) | Summary | Kind label | Description content (all verbatim-sourced) |
|---|---|---|---|---|
| 1 | …XBR ID in `carries.xbr_ids` (ascending) | `{XBR-NN} — {rule text}` (255-capped) | `cross-feature-rule` | `h2. Rule` — the rule's Description cell; `h2. Affected Features` — its Affected Features cell; `h2. Authority` — its Authority cell; all from the dependency map's `## Cross-Feature Business Rules` table. Source: the dependency map. |
| 2 | …**distinct ADR Category** in the `## 14` register (register order) | `Stack setup — {Category}` | `stack-setup` | `h2. Decisions` — every ADR row of the category: `*{ADR-ID}:* {Decision}` + `Rationale:` + `Profile driver:` cells verbatim; `h2. Documented Alternatives` — the category's `**Alternatives:**` table rendered as `* {Alternative} — choose instead when: {condition}` bullets, or the fixed pointer line when the area has no alternatives table. **Every ADR ID lands in exactly one setup story** (JIRA-8). Source: the architecture document. |
| 3 | …the schema (always one) | `Database schema — implement the blueprint schema` | `database-schema` | Fixed purpose frame + `h2. Entities` (the schema's Table Definitions `###` headings, when present). Source: `carries.schema_path`. |
| 4 | …the design layer (only when `carries.design_path` is non-null) | `Design reference — apply the supplied design layer` | `design-reference` | The posture statement matching the path shape: directory → binding user-supplied design system, applied as-is; single file → legacy reference with the provenance note (pre-decision-84 packages). Source: `carries.design_path`. |
| 5 | …the ASMP register (always one) | `Assumptions & constraints register (ASMP)` | `assumptions-register` | `h2. Assumptions` — one `*{ASMP-NN}:* {entry}` line per register entry, verbatim. Source: `features/assumptions-constraints.md`. |
| 6 | …the scope boundaries (always one) | `DO-NOT-BUILD — explicit scope exclusions (SC)` | `scope-boundary` | The fixed never-implement frame + one `*{SC-NN}:* {entry}` line per `## Explicit Exclusions` entry, **verbatim** — this is where `carries.sc_ids` (D3f) lands, satisfying the cross-cutting SC invariant. Source: `features/scope-boundaries.md`. |

Every foundation story closes with an `h2. Acceptance Criteria` block carrying ONE fixed,
kind-specific completion statement (pinned in the script — deterministic harness text in
the AGENTS.md-glue class, not canonical content) followed by its `Source:` line, so every
Story row in the file uniformly satisfies JIRA-7's per-story shape.

Live-package shape check (Homely): 15 XBR + 25 setup + 1 schema + 1 design (legacy file)
+ 1 assumptions + 1 scope = **44 foundation stories**; 28 epics + 187 SPEC stories + 44 =
**259 rows**, comfortably under the ≤1,500 rows-per-file guidance.

### Worked example (D6) — a real story Description, rendered

For the live package's `FEAT-01.SPEC-001` (Role Selection, 7 ACs) the script emits exactly
this Description (shown unquoted; in the CSV the whole field is one RFC-4180-quoted cell):

```
h2. Purpose
A visitor without an account chooses whether they need a service (Homeowner) or provide a service (Provider), setting the role that Account Registration Details (SPEC-002) collects details for.

h2. Scope
* Presenting the two self-service entry choices -- "I need a service" (Homeowner) and "I provide a service" (Provider)
* Carrying the chosen role forward into Account Registration Details (FEAT-01.SPEC-002)
* Offering a persistent "Log in" path for returning users

h2. Behavior
* Exactly two self-service roles are offered -- Homeowner and Provider; Ops/Admin has no self-service path here, per product-features.md's Access field for FEAT-01 and scope-boundaries.md (SC-02).
* The chosen role is carried as context into FEAT-01.SPEC-002 and cannot be changed without returning to this screen -- navigating back resets the choice rather than preserving a prior selection.

h2. Edge Cases
* User taps both role cards in quick succession
* User previously started but did not finish Registration Details, then returns to this screen
* User navigates back to this screen after selecting a role and reaching Registration Details
* No concurrent-edit conflict applies

h2. Acceptance Criteria
*FEAT-01.SPEC-001-AC-01:* Given an unauthenticated visitor is on the Role Selection screen, when she taps "I need a service", then she is navigated to Account Registration Details (FEAT-01.SPEC-002) with Homeowner carried as the selected role.
*FEAT-01.SPEC-001-AC-02:* Given an unauthenticated visitor is on the Role Selection screen, when he taps "I provide a service", then he is navigated to Account Registration Details (FEAT-01.SPEC-002) with Provider carried as the selected role.
*FEAT-01.SPEC-001-AC-03:* Given an unauthenticated visitor is on the Role Selection screen, when he taps "Log in", then he is navigated to the Login screen (FEAT-01.SPEC-004).
*FEAT-01.SPEC-001-AC-04:* Given Meera is already authenticated as a Homeowner, when she navigates to the Role Selection screen, then she is redirected automatically to her search home experience (FEAT-02) without ever seeing the role choice.
*FEAT-01.SPEC-001-AC-05:* Given Suresh is already authenticated as a Provider, when he navigates to the Role Selection screen, then he is redirected automatically to his provider home experience (FEAT-08) without ever seeing the role choice.
*FEAT-01.SPEC-001-AC-06:* Given a visitor on the Role Selection screen loses connectivity, when she taps either role card, then the banner "You're offline -- reconnect to continue." appears and no navigation occurs.
*FEAT-01.SPEC-001-AC-07:* Given a visitor with an expired session navigates to the Role Selection screen, when the screen loads, then she sees the same full unauthenticated view described above, with no residual context carried from the expired session.

Source: docs/blueprint/specifications/FEAT-01-account-registration-login/FEAT-01.SPEC-001-role-selection.md
```

Note what the example demonstrates: the `h2.` heading spine; wiki `*` bullets; the double
quotes inside clauses that force RFC-4180 quoting; every AC clause character-identical to
the spec after `:* `; the Edge Cases digest carrying condition names only; and the
`Source:` pointer resolving inside the blueprint copy.

### The pinned build script

Write verbatim to `OUTPUT_DIR/.build-jira-csv.js`, run
(`node .build-jira-csv.js "$PACKAGE_ROOT" "$OUTPUT_DIR/backlog.json" "$OUTPUT_DIR/jira-import.csv"`),
capture stdout, delete:

````js
#!/usr/bin/env node
// Transient build tool for the jira export -- Node builtins only.
// NOTE: fenced with FOUR backticks -- this script contains literal ``` sequences
// (the Markdown-to-wiki code-fence conversion and the leaked-fence lint). A three-
// backtick fence would terminate early and hand the formatter a truncated script.
// Usage: node .build-jira-csv.js <package_root> <backlog_json> <out_csv>
// JSON.parses backlog.json (contract C-26) and emits jira-import.csv (contract C-33,
// D5/D6/D7): one row per epic and story, epics first, RFC-4180 quoted, Jira wiki-markup
// descriptions with every acceptance criterion verbatim. Reads four canonical files ONLY
// to fetch the verbatim texts behind the foundation epic's `carries` ID rosters (D7) --
// it never re-derives structure from markdown (D2). Prints STAT / FEATREL / MUTUAL /
// EDGE rows for relationships.md and the formatter's self-checks. Deleted after use.
"use strict";
const fs = require("fs"), path = require("path");

const [root, backlogPath, outCsv] = process.argv.slice(2);
if (!root || !backlogPath || !outCsv) {
  console.error("usage: node .build-jira-csv.js <package_root> <backlog_json> <out_csv>");
  process.exit(1);
}
const fail = msg => { console.error("FAIL: " + msg); process.exit(1); };
const readCanon = rel => fs.readFileSync(path.join(root, rel), "utf8");

// ---------- 1. Load and validate backlog.json (the single structured input) ----------
const bl = JSON.parse(fs.readFileSync(backlogPath, "utf8"));
if (bl.schema_version !== 1) fail(`backlog.json schema_version is ${bl.schema_version}; this script was built against 1`);
const epics = bl.epics || [], stories = bl.stories || [], edges = bl.dependency_edges || [];
const counts = (bl.metadata || {}).counts || {};
if (epics.length !== counts.epics) fail(`epics.length ${epics.length} != metadata.counts.epics ${counts.epics}`);
if (stories.length !== counts.stories) fail(`stories.length ${stories.length} != metadata.counts.stories ${counts.stories}`);
const acTotal = stories.reduce((n, s) => n + (s.acceptance_criteria || []).length, 0);
if (acTotal !== counts.acceptance_criteria) fail(`AC objects ${acTotal} != metadata.counts.acceptance_criteria ${counts.acceptance_criteria}`);
const foundations = epics.filter(e => e.type === "foundation");
if (foundations.length !== 1) fail(`expected exactly one foundation epic, found ${foundations.length}`);
const foundation = foundations[0];
const carries = foundation.carries || {};
for (const k of ["xbr_ids", "adr_ids", "asmp_ids", "sc_ids"]) {
  if (!Array.isArray(carries[k])) fail(`foundation epic carries.${k} missing or not an array (C-26 as amended, D3f)`);
}

// ---------- 2. Markdown -> Jira wiki markup (extracted non-AC content only) ----------
// The house corpus emphasizes with ** only; single-asterisk italics are not translated
// (they do not occur, and touching them risks corrupting bullet markers).
function mdToWiki(text) {
  let t = text;
  t = t.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, body) => "{code}\n" + body + "{code}");
  t = t.replace(/\*\*([^*\n][^*]*?)\*\*/g, "*$1*");
  t = t.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, "[$1|$2]");
  t = t.replace(/`([^`\n]+)`/g, "{{$1}}");
  t = t.split("\n").map(l => {
    let m;
    if ((m = l.match(/^(\s*)[-*] (.*)$/))) return m[1] + "* " + m[2];
    if ((m = l.match(/^(#{1,6}) (.*)$/))) return "h" + m[1].length + ". " + m[2];
    // Defensive: ordered-list lines become plain bullets, never wiki "# " (which the
    // gate's leaked-Markdown lint cannot tell apart from a Markdown heading).
    if ((m = l.match(/^(\s*)\d+\. (.*)$/))) return m[1] + "* " + m[2];
    return l;
  }).join("\n");
  // tables: drop "|---|" separators and double the pipes on the header row above
  const lines = t.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\|[\s:|-]+\|\s*$/.test(lines[i]) && i > 0 && /^\s*\|.*\|\s*$/.test(lines[i - 1])) {
      lines[i - 1] = lines[i - 1].replace(/\|/g, "||");
      lines[i] = null;
    }
  }
  return lines.filter(l => l !== null).join("\n");
}

// ---------- 3. Spec-body section extraction (mechanical; bodies come from body_md) ----------
const sectionOf = (body, heading) => {
  const re = new RegExp("^## " + heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "m");
  const m = re.exec(body);
  if (!m) return null;
  const rest = body.slice(m.index + m[0].length);
  const nxt = rest.search(/^## /m);
  return nxt >= 0 ? rest.slice(0, nxt) : rest;
};
const bulletsOf = sec => (sec || "").split("\n").filter(l => /^- /.test(l)).map(l => l.slice(2));

function specDescription(story) {
  const body = story.body_md;
  const pm = body.match(/^\*\*Purpose:\*\* (.*)$/m);
  if (!pm) fail(`${story.id}: no **Purpose:** line in body_md`);
  const purpose = mdToWiki(pm[1]);

  const scopeSec = sectionOf(body, "Scope and Non-Goals") || "";
  const inScope = [];
  let inFlag = false;
  for (const l of scopeSec.split("\n")) {
    if (/^\*\*In Scope:\*\*/.test(l)) { inFlag = true; continue; }
    if (inFlag && /^(\*\*|## |### )/.test(l)) break;
    if (inFlag && /^- /.test(l)) inScope.push("* " + mdToWiki(l.slice(2)));
  }
  if (inScope.length === 0) fail(`${story.id}: no **In Scope:** bullets found`);

  const brSec = sectionOf(body, "Business Rules");
  const behavior = brSec ? bulletsOf(brSec).map(b => "* " + mdToWiki(b)) : [];

  const edgeSec = sectionOf(body, "Edge Cases") || "";
  const edgeDigest = bulletsOf(edgeSec).map(b => {
    const lm = b.match(/^\*\*([^*]+)\*\*/);
    return "* " + (lm ? mdToWiki(lm[1]) : mdToWiki(b));
  });

  const acSec = sectionOf(body, "Acceptance Criteria") || "";
  const acLines = [], acIds = [];
  for (const l of acSec.split("\n")) {
    const am = l.match(/^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2,3}):\*\* (.*)$/);
    if (am) { acIds.push(am[1]); acLines.push("*" + am[1] + ":* " + am[2]); }
  }
  const structIds = (story.acceptance_criteria || []).map(a => a.id);
  if (acIds.length !== structIds.length || acIds.some((id, i) => id !== structIds[i]))
    fail(`${story.id}: AC lines in body_md (${acIds.length}) do not match acceptance_criteria objects (${structIds.length})`);

  return assemble({
    head: ["h2. Purpose", purpose, "", "h2. Scope", ...inScope],
    behavior, edgeDigest,
    tail: ["h2. Acceptance Criteria", ...acLines, "",
           "Source: docs/blueprint/" + story.source_path],
    label: story.id
  });
}

// Budget/trim per D6: soft budget 15,000, hard cap 30,000. Only the Behavior and Edge
// Cases digests are trimmed (Edge Cases first, from the end); the AC block and the
// Source line are never touched. A description still over 30,000 after full digest
// removal is a hard failure (canonical intervention needed).
let trimmedCount = 0, maxDesc = 0;
function assemble({ head, behavior, edgeDigest, tail, label }) {
  const behaviorNote = "* (Digest trimmed to fit Jira's description budget -- the full section is in the source document below.)";
  let beh = behavior.slice(), edg = edgeDigest.slice(), trimmed = false;
  const build = () => {
    const parts = [...head, ""];
    parts.push("h2. Behavior");
    if (beh.length) parts.push(...beh);
    else if (behavior.length) parts.push(behaviorNote);
    else parts.push("Full behavioral detail lives in the source document below.");
    parts.push("", "h2. Edge Cases");
    if (edg.length) parts.push(...edg);
    else if (edgeDigest.length) parts.push(behaviorNote);
    else parts.push("Edge conditions are enumerated in the source document below.");
    if (trimmed && (edg.length || beh.length)) parts.push("* (Digest partially trimmed to fit Jira's description budget -- the full list is in the source document below.)");
    parts.push("", ...tail);
    return parts.join("\n");
  };
  let desc = build();
  while (desc.length > 15000 && edg.length > 0) { edg.pop(); trimmed = true; desc = build(); }
  while (desc.length > 15000 && beh.length > 0) { beh.pop(); trimmed = true; desc = build(); }
  if (desc.length > 30000) fail(`${label}: description is ${desc.length} chars after full digest trim -- over the 30,000 hard cap`);
  if (trimmed) trimmedCount++;
  if (desc.length > maxDesc) maxDesc = desc.length;
  return desc;
}

// ---------- 4. Epic descriptions (from backlog.json fields only) ----------
function epicDescription(epic) {
  if (epic.type === "foundation") {
    const body = epic.description_md.replace(/^### .*\n+/, "");
    return mdToWiki(body) + "\n\nSource: docs/blueprint/";
  }
  const dm = epic.description_md;
  let descText = "";
  const m = dm.match(/\*\*Description:\*\* ([\s\S]*?)(?=\n\*\*|\n### |\n## |$)/);
  if (m) descText = m[1].trim();
  const parts = ["h2. Purpose", mdToWiki(descText || epic.name)];
  if ((epic.key_capabilities || []).length) {
    parts.push("", "h2. Key Capabilities", ...epic.key_capabilities.map(c => "* " + mdToWiki(c)));
  }
  parts.push("", "Source: docs/blueprint/features/product-features.md");
  return parts.join("\n");
}

// ---------- 5. Foundation stories (D7): verbatim texts fetched for the carried IDs ----------
const setEq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const diffMsg = (a, b) => {
  const sa = new Set(a), sb = new Set(b);
  const d = [...a.filter(x => !sb.has(x)), ...b.filter(x => !sa.has(x))];
  return d.slice(0, 8).join(" ");
};

// 5a. XBR rows from the dependency map's Cross-Feature Business Rules table
const mapText = readCanon("specifications/feature-dependency-map.md");
const xbrRows = [];
{
  const sec = sectionOf(mapText, "Cross-Feature Business Rules") || "";
  for (const l of sec.split("\n")) {
    if (!l.startsWith("|")) continue;
    const c = l.split("|").map(s => s.trim());
    if (!/^XBR-\d{2}$/.test(c[1])) continue;
    xbrRows.push({ id: c[1], desc: c[2], affected: c[3], authority: c[4] });
  }
  const got = xbrRows.map(r => r.id).sort();
  if (!setEq(got, [...carries.xbr_ids].sort()))
    fail(`XBR extraction does not match carries.xbr_ids -- diff: ${diffMsg(got, carries.xbr_ids)}`);
}

// 5b. ADR register rows (the ## 14 consolidated register) + per-category alternatives
const archText = readCanon("architecture/technical-architecture.md");
const adrRows = [];
{
  const m14 = archText.match(/^## 14\..*$/m);
  if (!m14) fail("architecture/technical-architecture.md has no ## 14. register heading");
  const rest = archText.slice(m14.index + m14[0].length);
  const nxt = rest.search(/^## /m);
  const sec = nxt >= 0 ? rest.slice(0, nxt) : rest;
  for (const l of sec.split("\n")) {
    if (!l.startsWith("|")) continue;
    const c = l.split("|").map(s => s.trim());
    if (!/^ADR-\d{3}$/.test(c[1])) continue;
    adrRows.push({ id: c[1], category: c[2], decision: c[3], rationale: c[4], driver: c[5] || "" });
  }
  const got = adrRows.map(r => r.id).sort();
  if (!setEq(got, [...carries.adr_ids].sort()))
    fail(`ADR extraction does not match carries.adr_ids -- diff: ${diffMsg(got, carries.adr_ids)}`);
}
function alternativesFor(category) {
  const esc = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hm = archText.match(new RegExp("^(##|###) (?:\\d+\\. )?" + esc + "\\s*$", "m"));
  if (!hm) return null;
  const level = hm[1];
  const rest = archText.slice(hm.index + hm[0].length);
  const stop = level === "###" ? /^##+ /m : /^## /m;
  const nxt = rest.search(stop);
  const sec = nxt >= 0 ? rest.slice(0, nxt) : rest;
  const am = sec.match(/^\*\*Alternatives:\*\*\s*$/m);
  if (!am) return null;
  const after = sec.slice(am.index + am[0].length);
  const out = [];
  for (const l of after.split("\n")) {
    const t = l.trim();
    if (!t) continue;
    if (!t.startsWith("|")) break;
    const c = t.split("|").map(s => s.trim()).filter((s, i, arr) => !(i === 0 || i === arr.length - 1));
    if (c.length < 2 || /^Alternative$/i.test(c[0]) || /^[-: ]+$/.test(c[0])) continue;
    out.push({ name: c[0], when: c[c.length - 1] });
  }
  return out.length ? out : null;
}

// 5c. ASMP entries: "- **ID:** ASMP-NN" followed by the entry line
function idEntryPairs(text, idRe) {
  const lines = text.split("\n"), out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(idRe);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !/^- /.test(lines[j])) j++;
    out.push({ id: m[1], text: j < lines.length ? lines[j].replace(/^- /, "") : "" });
  }
  return out;
}
const asmpEntries = idEntryPairs(readCanon("features/assumptions-constraints.md"), /^- \*\*ID:\*\* (ASMP-\d{2})\s*$/);
{
  const got = asmpEntries.map(e => e.id).sort();
  if (!setEq(got, [...carries.asmp_ids].sort()))
    fail(`ASMP extraction does not match carries.asmp_ids -- diff: ${diffMsg(got, carries.asmp_ids)}`);
}

// 5d. SC entries from the ## Explicit Exclusions section only
const scopeText = readCanon("features/scope-boundaries.md");
const exSec = (() => {
  const m = scopeText.match(/^## Explicit Exclusions\s*$/m);
  if (!m) fail("features/scope-boundaries.md has no ## Explicit Exclusions section");
  const rest = scopeText.slice(m.index + m[0].length);
  const nxt = rest.search(/^## /m);
  return nxt >= 0 ? rest.slice(0, nxt) : rest;
})();
const scEntries = idEntryPairs(exSec, /^- \*\*ID:\*\* (SC-\d{2})\s*$/);
{
  const got = scEntries.map(e => e.id).sort();
  if (!setEq(got, [...carries.sc_ids].sort()))
    fail(`SC extraction does not match carries.sc_ids -- diff: ${diffMsg(got, carries.sc_ids)}`);
}

// 5e. Schema entity names: ### headings inside the Table Definitions section (optional)
let schemaEntities = [];
{
  const schemaText = readCanon(carries.schema_path || "architecture/database-schema.md");
  const m = schemaText.match(/^## \d+\. Table Definitions\s*$/m) || schemaText.match(/^## Table Definitions\s*$/m);
  if (m) {
    const rest = schemaText.slice(m.index + m[0].length);
    const nxt = rest.search(/^## /m);
    const sec = nxt >= 0 ? rest.slice(0, nxt) : rest;
    schemaEntities = sec.split("\n").filter(l => /^### /.test(l)).map(l => l.replace(/^### /, "").trim());
  }
}

// Foundation-story assembly (order pinned by D7: XBR, stack-layer setup per distinct
// ADR Category in register order, schema, design, assumptions, scope boundaries).
const foundationStories = [];
const fPush = (summary, kind, descParts) => foundationStories.push({
  summary, kind, description: descParts.join("\n")
});
const acClose = stmt => ["", "h2. Acceptance Criteria", "* " + stmt];

for (const r of xbrRows) {
  fPush(`${r.id} — ${r.desc}`, "cross-feature-rule", [
    "h2. Rule", mdToWiki(r.desc), "",
    "h2. Affected Features", r.affected, "",
    "h2. Authority", mdToWiki(r.authority),
    ...acClose("Done when this rule holds end-to-end across its affected features; the rule text above (verbatim from the dependency map) is the authority."),
    "", "Source: docs/blueprint/specifications/feature-dependency-map.md"
  ]);
}
const categories = [];
for (const r of adrRows) if (!categories.includes(r.category)) categories.push(r.category);
for (const cat of categories) {
  const rows = adrRows.filter(r => r.category === cat);
  const parts = ["h2. Decisions"];
  for (const r of rows) {
    parts.push(`*${r.id}:* ${mdToWiki(r.decision)}`,
               `Rationale: ${mdToWiki(r.rationale)}`,
               `Profile driver: ${mdToWiki(r.driver)}`, "");
  }
  parts.push("h2. Documented Alternatives");
  const alts = alternativesFor(cat);
  if (alts) for (const a of alts) parts.push(`* ${mdToWiki(a.name)} — choose instead when: ${mdToWiki(a.when)}`);
  else parts.push("Documented alternatives for this area, where present, live in the architecture document at the Source below.");
  parts.push(...acClose("Done when every decision above is implemented as its Recommended choice, or a documented alternative has been explicitly substituted by a human owner."),
             "", "Source: docs/blueprint/architecture/technical-architecture.md");
  fPush(`Stack setup — ${cat}`, "stack-setup", parts);
}
fPush("Database schema — implement the blueprint schema", "database-schema", [
  "h2. Purpose",
  "Implement the database schema designed in the blueprint before building the features that depend on it. The source document defines every table, relationship, lifecycle rule, index, and seed row.",
  ...(schemaEntities.length ? ["", "h2. Entities", ...schemaEntities.map(e => "* " + e)] : []),
  ...acClose("Done when the database schema in the source document below is implemented as designed, before feature work that depends on it."),
  "", `Source: docs/blueprint/${carries.schema_path}`
]);
if (carries.design_path) {
  const legacy = !String(carries.design_path).endsWith("/");
  fPush("Design reference — apply the supplied design layer", "design-reference", [
    "h2. Purpose",
    legacy
      ? "This package carries a single design-system document. It is the design reference for this build. (Provenance note: it was produced by an earlier version of the pipeline engine; current packages instead carry a user-supplied design-system directory, or ship design-agnostic.)"
      : "This package carries a user-supplied design system. It is BINDING: map its tokens and values to code as-is — never redesign, restyle, or improve them.",
    ...acClose("Done when the design layer at the source below is applied to the built product's UI as described above."),
    "", `Source: docs/blueprint/${carries.design_path}`
  ]);
}
fPush("Assumptions & constraints register (ASMP)", "assumptions-register", [
  "h2. Assumptions",
  ...asmpEntries.map(e => `*${e.id}:* ${mdToWiki(e.text)}`),
  ...acClose("Done when the register above has been read by the delivery team and any implementation choice that would contradict an entry has been surfaced to a human instead of silently decided."),
  "", "Source: docs/blueprint/features/assumptions-constraints.md"
]);
fPush("DO-NOT-BUILD — explicit scope exclusions (SC)", "scope-boundary", [
  "h2. Exclusions",
  "The capabilities below are explicitly out of scope, verbatim from the blueprint. Never implement any of them — even when a spec seems adjacent or the capability seems easy to add.",
  ...scEntries.map(e => `*${e.id}:* ${mdToWiki(e.text)}`),
  ...acClose("Done means NOT built: none of the excluded capabilities above are implemented."),
  "", "Source: docs/blueprint/features/scope-boundaries.md"
]);

// ---------- 6. Rows, Issue IDs, blocks ----------
const PRIORITY = { "Core": "High", "Important": "Medium", "Nice-to-Have": "Low" };
const prio = t => PRIORITY[t] || fail(`unknown priority tier "${t}"`);
const rows = [];
const idMap = new Map();      // canonical node id -> Issue ID
let nextId = 1;

for (const e of epics) {
  idMap.set(e.id, nextId);
  rows.push({
    issueId: nextId++, issueType: "Epic", parent: "",
    summary: e.type === "foundation" ? e.name : `${e.id} ${e.name}`,
    description: epicDescription(e), priority: prio(e.priority_tier),
    labels: [e.type === "foundation" ? "foundation-epic" : "feature-epic", e.priority_tier],
    nodeId: e.id
  });
}
const foundationIssueId = idMap.get(foundation.id);
for (const s of stories) {
  const parentIssue = idMap.get(s.epic_id);
  if (!parentIssue) fail(`${s.id}: epic_id ${s.epic_id} not found among epics`);
  idMap.set(s.id, nextId);
  rows.push({
    issueId: nextId++, issueType: "Story", parent: parentIssue,
    summary: `${s.id} ${s.title}`,
    description: specDescription(s), priority: prio(s.priority_tier),
    labels: [s.spec_type, s.priority_tier],
    nodeId: s.id
  });
}
for (const f of foundationStories) {
  rows.push({
    issueId: nextId++, issueType: "Story", parent: foundationIssueId,
    summary: f.summary, description: f.description, priority: "High",
    labels: ["foundation", f.kind, "Core"],
    nodeId: null
  });
}

// blocks cells: outward only, from type == "blocks" edges exclusively (D5)
const blocksMap = new Map();
let blocksCells = 0;
for (const e of edges) {
  if (e.type !== "blocks") continue;
  if (!idMap.has(e.from) || !idMap.has(e.to)) fail(`blocks edge endpoint not in the package: ${e.from} -> ${e.to}`);
  const from = e.from;
  if (!blocksMap.has(from)) blocksMap.set(from, new Set());
  blocksMap.get(from).add(idMap.get(e.to));
}
for (const r of rows) {
  r.blocks = r.nodeId && blocksMap.has(r.nodeId)
    ? [...blocksMap.get(r.nodeId)].sort((a, b) => a - b) : [];
  blocksCells += r.blocks.length;
}

// ---------- 7. Write RFC-4180 CSV ----------
const labelsCols = Math.max(...rows.map(r => r.labels.length));
const blocksCols = Math.max(...rows.map(r => r.blocks.length), 1);
const header = ["Issue ID", "Issue Type", "Parent", "Summary", "Description", "Priority",
  ...Array(labelsCols).fill("Labels"), ...Array(blocksCols).fill("blocks")];
const csvField = v => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const lint = [];
for (const r of rows) {
  const d = r.description;
  if (d.length > 30000) lint.push(`${r.summary}: description over 30,000 chars`);
  if (/\*\*/.test(d)) lint.push(`${r.summary}: leaked Markdown bold (**)`);
  if (/^#/m.test(d)) lint.push(`${r.summary}: leaked line-initial #`);
  if (/```/.test(d)) lint.push(`${r.summary}: leaked code fence`);
  if (r.summary.length > 255) r.summary = r.summary.slice(0, 254) + "…";
}
if (lint.length) fail("description lint:\n" + lint.join("\n"));
const csvLines = [header.map(csvField).join(",")];
for (const r of rows) {
  const cells = [r.issueId, r.issueType, r.parent, r.summary, r.description, r.priority,
    ...r.labels, ...Array(labelsCols - r.labels.length).fill(""),
    ...r.blocks, ...Array(blocksCols - r.blocks.length).fill("")];
  csvLines.push(cells.map(csvField).join(","));
}
fs.writeFileSync(outCsv, csvLines.join("\n") + "\n");

// ---------- 8. STAT / FEATREL / MUTUAL / EDGE rows for the formatter ----------
const featureEpics = epics.filter(e => e.type === "feature");
const ibbMap = new Set(edges.filter(e => e.type === "is-blocked-by" && e.source === "dependency-map")
  .map(e => e.from + ">" + e.to));
for (const e of featureEpics) {
  const dep = [...new Set(edges.filter(x => x.source === "dependency-map" && x.type === "is-blocked-by" && x.from === e.id).map(x => x.to))].sort();
  const depBy = [...new Set(edges.filter(x => x.source === "dependency-map" && x.type === "is-blocked-by" && x.to === e.id).map(x => x.from))].sort();
  console.log(["FEATREL", e.id, e.name, dep.join(", ") || "—", depBy.join(", ") || "—"].join("\t"));
}
let mutuals = 0;
for (const a of featureEpics.map(e => e.id)) for (const b of featureEpics.map(e => e.id)) {
  if (a < b && ibbMap.has(a + ">" + b) && ibbMap.has(b + ">" + a)) {
    console.log(["MUTUAL", a, b].join("\t")); mutuals++;
  }
}
if (mutuals === 0) console.log("MUTUAL\tNONE");
const specEdges = [...new Set(edges.filter(e => e.type === "is-blocked-by" && e.source === "connected-specs")
  .map(e => e.from + "\t" + e.to))].sort();
for (const e of specEdges) console.log("EDGE\t" + e.split("\t")[0].slice(0, 7) + "\t" + e);
const distinctAc = new Set(stories.flatMap(s => (s.acceptance_criteria || []).map(a => a.id)));
const stats = {
  rows_total: rows.length, epic_rows: epics.length, feature_epics: featureEpics.length,
  spec_story_rows: stories.length, foundation_story_rows: foundationStories.length,
  ac_ids: distinctAc.size, mutual_pairs: mutuals, spec_edge_rows: specEdges.length,
  blocks_cells: blocksCells, labels_cols: labelsCols, blocks_cols: blocksCols,
  max_description_chars: maxDesc, trimmed_descriptions: trimmedCount
};
for (const [k, v] of Object.entries(stats)) console.log(["STAT", k, v].join("\t"));
console.error(`jira-import.csv: ${rows.length} rows (${epics.length} epics + ${stories.length} spec stories + ${foundationStories.length} foundation stories), ${distinctAc.size} distinct AC IDs, ${blocksCells} blocks cells, max description ${maxDesc} chars, ${trimmedCount} trimmed`);
````

<!-- Verified against a complete live package: 259 rows (28 epics + 187 spec stories + 44
     foundation stories), 2,442 distinct AC IDs with every clause character-identical to
     its canonical spec line, 15/27/24/19 cross-cutting IDs present, every ADR in exactly
     one setup story, exactly 2 mutual pairs, RFC-4180 parse-back clean, zero Markdown
     leaks, max description 9,959 chars with zero trims. The script fails loudly on any
     roster mismatch, AC misalignment, unknown tier, unresolved edge endpoint, or
     description-lint hit -- it never renders around a hole. -->

---

## relationships.md — the dependency graph, human-readable

The graph lives losslessly in `backlog.json` (`dependency_edges`, both directions); the
CSV carries outward `blocks` columns only. This file is the human-readable render — and
every graph fact in it comes **verbatim from the script's FEATREL / MUTUAL / EDGE rows**
(the formatter adds table pipes and headings, never computes, infers, adds, or removes a
row or a pair).

| # | Content | Method |
|---|---------|--------|
| 1 | `# Dependency Relationships` + authored intro (skeleton below) | authored, counts from STAT rows |
| 2 | `## Feature-level dependencies` table — one row per FEATREL row, values verbatim | script output, table formatting only |
| 3 | `## Mutual dependencies` — one disclosure line per MUTUAL row, or the none-line | script output, line formatting only (D8) |
| 4 | `## Spec-level dependencies` table — one row per EDGE row, values verbatim | script output, table formatting only |

Skeleton:

```markdown
# Dependency Relationships

{Authored intro, 2–4 sentences: this file renders the dependency graph of the
{Project Name} backlog — {F} features and {E} spec-level prerequisite links. The complete
edge set, typed in both directions, lives in backlog.json (dependency_edges);
jira-import.csv carries the same links as outward `blocks` columns only. Rendered from
backlog.json — not re-derived from the blueprint documents.}

## Feature-level dependencies

From the dependency map's Features table, as carried in backlog.json ("depends on" =
is-blocked-by; the columns are exact inverses of each other).

| Feature | Name | Depends on | Depended on by |
|---------|------|-----------|----------------|
| FEAT-01 | {Name} | {deps or —} | {dependents or —} |
{…one row per FEATREL row, in script order…}

## Mutual dependencies

{One line per MUTUAL row — or, when the script printed MUTUAL NONE: "None — no feature
pair lists the other in the dependency map." Line shape:}
- FEAT-04 ↔ FEAT-14 — mutually dependent: each lists the other in the dependency map's
  Depends On column. Build iteratively, stubbing the not-yet-built counterpart's
  interface and completing it when its turn comes.

## Spec-level dependencies

Prerequisite links derived from each spec's Connected Specs table ("is blocked by" =
the named spec should exist first), grouped by feature.

| Feature | Spec | Is blocked by |
|---------|------|---------------|
| FEAT-01 | FEAT-01.SPEC-001 | FEAT-01.SPEC-002 |
{…one row per EDGE row, in script order…}
```

<!-- THE MUTUAL-PAIR RULE (D8, gated by JIRA-6): a pair appears under ## Mutual
     dependencies ONLY if the script printed a MUTUAL row for it — i.e. only if BOTH
     directions exist in the dependency map's feature-level edge set — and EVERY printed
     MUTUAL row appears. The script computes pairs mechanically (is-blocked-by present
     A→B and B→A, dependency-map source); the formatter may not add a pair it "notices"
     in the tables, may not drop one, and may not restate one-directional dependencies as
     mutual. A shipped export in a prior phase disclosed a third, non-existent pair by
     eyeballing the tables — that failure mode is why the rows are script-computed. The
     verified live package has exactly two: FEAT-04 ↔ FEAT-14 and FEAT-06 ↔ FEAT-14. -->

---

## import-guide.md — the Jira import walkthrough

Authored, per this skeleton. Every stated fact below is research-verified (work order
§1.4–§1.11) and MUST appear; adapt wording, never drop a fact. Counts come from STAT rows.

```markdown
# Jira Import Guide

## Which file to use when

- **jira-import.csv** — the file you import into Jira. {N} rows: every feature as an
  epic, every specification and foundation item as a story, hierarchy and blocking links
  included.
- **backlog.json** — the canonical lossless backlog (every epic, story, acceptance
  criterion, and dependency edge, typed in both directions). Use it for scripts, API
  loaders, or AI agents; the CSV is derived from it.
- **relationships.md** — the dependency graph, human-readable, for planning review.
- **docs/blueprint/** — the complete blueprint package; every story's Source line points
  into it.

## Importing the CSV

1. The importer is **admin-gated**: you need Jira site administrator access.
2. Go to **Settings > System > Import and Export > External System Import**, choose CSV.
   If you don't see it, **"switch to the old experience"** — Atlassian's new import
   experience (Aug 2024) creates new projects only and cannot map link columns; the old
   experience is the full-control path.
3. Upload `jira-import.csv` **as generated**. Do NOT open and re-save it in Excel first:
   Excel's per-cell limit (32,767 characters) silently truncates long descriptions.
4. Map the columns: `Issue ID` → Issue ID, `Issue Type` → Issue Type, `Parent` → Parent,
   `Summary` → Summary, `Description` → Description, `Priority` → Priority, every
   `Labels` column → Labels, and every `blocks` column → the **Blocks** issue link.
5. Do **not** tick "Map field value" on the Description column — descriptions are Jira
   wiki markup and must pass through untouched; value mapping mangles them.
6. Rows are ordered epics-first because the importer processes sequentially; do not
   re-sort the file.

Notes:
- Link columns map **only** in the admin old-experience importer, and only the default
  link types (**Blocks**, **Relates**) are safe to map. This export uses Blocks only,
  outward direction only.
- Jira recommends **≤ 1,500 rows per import file**. This backlog is {N} rows — one file.
  If you ever split a larger export, Issue IDs do **not** resolve across separate files;
  keep every epic's stories in the same file as the epic.
- Descriptions stay under Jira Cloud's hard 32,767-character description limit by design
  (budgeted at 15,000, capped at 30,000).

## Why there is no jira-import.json

Deliberate. Jira's JSON import survives only in the pre-Aug-2024 "old experience"; its
links express direction exactly as CSV does (source → destination), and its epic→story
parentage relies on a legacy custom field whose value must be the epic's real issue key —
which an exporter cannot know. CSV is the actively documented path; backlog.json is the
structured artifact for everything else.

## Programmatic alternative (REST)

To apply hierarchy and links via the API instead of the importer:

- `POST /rest/api/3/issue/bulk` — creates up to **50 issues per request**. Create epics
  first, record the returned keys, then create stories with their parent set.
- `POST /rest/api/3/issueLink` — creates **one link per call**; iterate backlog.json's
  `dependency_edges` entries with `"type": "blocks"` (the mirrored is-blocked-by entries
  are the same links, inverted — apply one direction only).

This path is deterministic and resumable. It is documented here rather than shipped as a
script: run it with your own credentials and error handling.

**MCP push is not viable today.** Atlassian's official (Rovo) MCP server creates one
issue per call, has **no issue-link write tool at all**, and community reports show
undocumented throttling after a few dozen calls — a full backlog push through it is not
possible. Use the CSV import or the REST calls above.
```

---

## README.md

<!-- The one-screen entry point. Written LAST, so every count is real (STAT rows). -->

Skeleton:

```markdown
# {Project Name} — Jira Backlog Export

{One authored paragraph: this directory is a Jira-ready backlog rendered from the
{Project Name} blueprint package (version {PKG_VERSION}, rendered {YYYY-MM-DD}):
{F} features as epics plus a Foundation & Cross-Cutting epic, {S} specification stories
and {FS} foundation stories — {A} acceptance criteria carried verbatim — with hierarchy
and blocking links wired for import.}

## What's here

| File | What it is |
|------|-----------|
| `import-guide.md` | Step-by-step Jira CSV import walkthrough + the REST alternative — read this first |
| `jira-import.csv` | The importable backlog: {N} rows, epics before stories, wiki-markup descriptions |
| `backlog.json` | Canonical lossless backlog — every epic, story, AC, and dependency edge (for scripts and agents) |
| `relationships.md` | The dependency graph, human-readable — mutual pairs disclosed |
| `docs/blueprint/` | The complete blueprint package, byte-identical — every story's Source line points here |

## What to do first

Open `import-guide.md`. In Jira: Settings > System > External System Import > CSV
(choose "switch to the old experience" if you don't see it), upload `jira-import.csv`,
and map Issue ID / Parent / blocks as the guide describes.
```

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- `backlog.json` — written by the Backlog Builder (n2b/agents/stage-5/backlog-builder.md,
  contract C-26) in workflow Step 2.5, before the formatter is spawned. The formatter and
  this template consume it; they never create, rebuild, or modify it.
- `jira-import.json`, push scripts, MCP instruction files, tool directories, tracker
  renders for other products, sprint/board/version metadata — the Deliberately-NOT-emitted
  set (D14) above.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
