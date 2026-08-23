<!-- Agent: backlog-builder
     When: @-include when the export workflow spawns the Backlog Builder (registry row has `Needs backlog.json: yes`).
     Purpose: The pinned C-26 schema for backlog.json — full JSON shape, field-by-field definitions, mechanical extraction rules, GWT parse rules, dependency-edge derivation, losslessness invariant, and validation rules the builder's script must enforce.
     Output: Governs the single backlog.json file the Backlog Builder emits. -->

# backlog.json Schema (C-26)

`backlog.json` is the **canonical structured export artifact** (decision 86.1, contract C-26): a
single schema-validated JSON file that carries the blueprint package's features as epics and its
specifications as stories — full markdown bodies as strings, acceptance criteria as structured
objects, typed dependency edges in both directions, explicit parent refs, and priority tiers.
It is **lossless**: every canonical ID appears exactly once, every body is read from disk
byte-for-byte, and the fidelity gate diffs its counts and ID rosters against the canonical
rosters mechanically.

Consumers: every E2 tracker render (`jira`, `github-issues`, `linear`), any MCP-push agent, the
`backlog` generic target key, and Phase 0's structural checker. It is built by the
`backlog-builder` agent (`n2b/agents/stage-5/backlog-builder.md`) via a Node-builtins script —
never by retyping content through a model context.

---

## 1. Top-Level Shape

```json
{
  "schema_version": 1,
  "metadata": { ... },
  "epics": [ ... ],
  "stories": [ ... ],
  "dependency_edges": [ ... ]
}
```

Exactly these five top-level keys, in this order. No additional top-level keys.

| Field | Type | Definition |
|---|---|---|
| `schema_version` | integer | Schema revision this file conforms to. Currently `1`. See §8 Versioning. |
| `metadata` | object | Provenance and roster counts. See §2. |
| `epics` | array of objects | One epic per canonical FEAT-XX, plus exactly one foundation epic. See §3. |
| `stories` | array of objects | One story per canonical SPEC file. See §4. |
| `dependency_edges` | array of objects | Typed dependency edges, materialized in both directions. See §5. |

## 2. `metadata`

```json
{
  "project_name": "Homely",
  "package_version": 4,
  "generated_at": "2026-07-26T10:15:00Z",
  "counts": {
    "epics": 28,
    "feature_epics": 27,
    "stories": 187,
    "acceptance_criteria": 2442,
    "dependency_edges": 214
  }
}
```

| Field | Type | Source (mechanical) |
|---|---|---|
| `project_name` | string | `.n2b/tracking/MANIFEST.md` frontmatter `project_name` (falls back to `.n2b/BRIEF.md` frontmatter `project_name` if absent) |
| `package_version` | integer | `.n2b/tracking/MANIFEST.md` frontmatter `package_version` — the staleness key; the value of the package this file was built from |
| `generated_at` | string | Build timestamp, ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`) |
| `counts.epics` | integer | `epics.length` — must equal `feature_epics + 1` (the foundation epic) |
| `counts.feature_epics` | integer | Count of epics with `"type": "feature"` — must equal the canonical FEAT roster count |
| `counts.stories` | integer | `stories.length` — must equal the canonical SPEC-file count |
| `counts.acceptance_criteria` | integer | Total AC objects across all stories — must equal the canonical AC-ID roster count |
| `counts.dependency_edges` | integer | `dependency_edges.length` |

Every `counts` value is computed from the emitted arrays, then validated against the canonical
rosters (§7) — never hardcoded and never taken on faith from any single frontmatter field.

## 3. `epics[]`

Ordered: feature epics in ascending FEAT number, then the foundation epic last.

### 3.1 Feature epic (one per FEAT-XX)

```json
{
  "id": "FEAT-01",
  "type": "feature",
  "name": "Account Registration & Login",
  "slug": "account-registration-login",
  "priority_tier": "Core",
  "description_md": "### Account Registration & Login\n\n**ID:** FEAT-01\n\n**Description:** ...",
  "key_capabilities": [
    "Create an account as a homeowner or provider -- user chooses role and provides basic identity info",
    "Log in to return to the product -- returning users authenticate to resume where they left off"
  ],
  "connected_entities": [
    "Homeowner Account (create, update)",
    "Provider Account (create, update)"
  ]
}
```

| Field | Type | Source (mechanical) |
|---|---|---|
| `id` | string | Canonical FEAT ID, verbatim (`FEAT-XX` per `n2b/references/id-prefixes.md`). Roster source: the `## Features` table of `.n2b/specifications/feature-dependency-map.md` (Number column). |
| `type` | string | Literal `"feature"` |
| `name` | string | Features-table Name column, verbatim |
| `slug` | string | Features-table Slug column, verbatim (matches the `FEAT-NN-{slug}` specifications directory name) |
| `priority_tier` | string | Features-table Priority column — one of `Core` / `Important` / `Nice-to-Have`, verbatim |
| `description_md` | string | The feature's **full record body from `.n2b/features/product-features.md`, verbatim**: from its `### {name}` heading line through the line before the next `---` record separator (or the next `###`/`##` heading where no separator follows). Records are located by their `**ID:** FEAT-XX` line, never by heading-text matching. Read from disk into the string — never retyped. |
| `key_capabilities` | array of strings | The bullet lines under the record's `**Key Capabilities:**` label, one array element per bullet, leading `- ` stripped, text verbatim |
| `connected_entities` | array of strings | The record's `**Connected Entities:**` line split on commas **at top parenthesis depth only** (entity annotations contain commas, e.g. `Homeowner Account (create, update)`), each element trimmed, text verbatim. Records with `**Connected Entities:** None` (or no such label) → `[]`. |

### 3.2 Foundation epic (exactly one; defined here so Phase 4 does not invent it)

The Foundation & Cross-Cutting epic is the entry point for work that belongs to no single
feature: cross-feature business rules (XBR), architecture decisions and stack-layer setup (ADR),
the database schema, the design layer, and the assumption roster (ASMP). E2 renders (Phase 4)
compose foundation *stories* from these rosters at render time; backlog.json v1 carries the
epic itself with its roster fields, keeping `stories[]` strictly one-per-SPEC.

```json
{
  "id": "FOUNDATION",
  "type": "foundation",
  "name": "Foundation & Cross-Cutting",
  "slug": "foundation-cross-cutting",
  "priority_tier": "Core",
  "description_md": "### Foundation & Cross-Cutting\n\nCross-feature work no single feature owns. ...",
  "key_capabilities": [],
  "connected_entities": [],
  "carries": {
    "xbr_ids": ["XBR-01", "XBR-02"],
    "adr_ids": ["ADR-001", "ADR-002"],
    "asmp_ids": ["ASMP-01", "ASMP-02"],
    "sc_ids": ["SC-01", "SC-02"],
    "schema_path": "architecture/database-schema.md",
    "design_path": null
  }
}
```

| Field | Definition |
|---|---|
| `id` | Literal `"FOUNDATION"`. This is a **schema-defined container key, not a canonical package ID** — the export stage introduces no new ID prefixes (`id-prefixes.md`), and this key is never written back into any canonical document. It exists only inside backlog.json and its renders. |
| `type` | Literal `"foundation"` |
| `name` / `slug` | Literals `"Foundation & Cross-Cutting"` / `"foundation-cross-cutting"` |
| `priority_tier` | Literal `"Core"` — foundation work precedes every feature |
| `description_md` | A **deterministic template string** the builder script assembles (no model-authored prose): the fixed heading and lead sentence above, followed by one line per `carries` roster entry — xbr, adr, asmp, **and sc** — stating the roster count and its canonical source path (e.g. `15 cross-feature business rules (XBR-01..15) — specifications/feature-dependency-map.md, Cross-Feature Business Rules`; the `sc_ids` roster adds `19 scope boundaries (SC-01..19) — features/scope-boundaries.md`), plus the schema/design path lines. |
| `key_capabilities` / `connected_entities` | Always `[]` in schema v1 |
| `carries.xbr_ids` | Every XBR ID in the `## Cross-Feature Business Rules` table of `feature-dependency-map.md`, ascending, verbatim |
| `carries.adr_ids` | Every ADR ID in `.n2b/architecture/technical-architecture.md`'s decision register, ascending, verbatim |
| `carries.asmp_ids` | Every ASMP ID in `.n2b/features/assumptions-constraints.md`, ascending, verbatim |
| `carries.sc_ids` | Every SC ID in `.n2b/features/scope-boundaries.md`, ascending, verbatim — the scope-boundary DO-NOT-BUILD roster, a cross-cutting invariant of every export kind; E2 renders compose the DO-NOT-BUILD story from this field |
| `carries.schema_path` | Literal `"architecture/database-schema.md"` (path relative to the canonical root) |
| `carries.design_path` | Design-layer detection, mirroring the dev-brief posture rule (decisions 84/90f): directory `.n2b/specifications/design-system/` exists → `"specifications/design-system/"`; else a legacy single file `.n2b/specifications/design-system.md` exists (pre-decision-84 packages, e.g. the Homely dry run) → `"specifications/design-system.md"`; else `null` (package ships design-agnostic). |

The `carries` object appears **only** on the foundation epic; feature epics never carry it.

## 4. `stories[]`

One story per specification file — every file matching
`.n2b/specifications/FEAT-*/FEAT-NN.SPEC-NNN-*.md` (`feature-overview.md` files are feature
metadata, not specs, and are excluded). Ordered by feature, then by SPEC number.

```json
{
  "id": "FEAT-01.SPEC-001",
  "epic_id": "FEAT-01",
  "title": "Role Selection",
  "spec_type": "screen",
  "priority_tier": "Core",
  "body_md": "---\ndocument_type: spec\n...full file...",
  "source_path": "specifications/FEAT-01-account-registration-login/FEAT-01.SPEC-001-role-selection.md",
  "acceptance_criteria": [
    {
      "id": "FEAT-01.SPEC-001-AC-01",
      "given": "an unauthenticated visitor is on the Role Selection screen",
      "when": "she taps \"I need a service\"",
      "then": "she is navigated to Account Registration Details (FEAT-01.SPEC-002) with Homeowner carried as the selected role."
    }
  ]
}
```

| Field | Type | Source (mechanical) |
|---|---|---|
| `id` | string | Spec frontmatter `spec_id`, verbatim (`FEAT-NN.SPEC-NNN` dot notation per `id-prefixes.md`). Must equal the ID embedded in the filename. |
| `epic_id` | string | Parent ref — the `FEAT-NN` half of `id` (must equal frontmatter `parent_feature` and match an existing feature epic) |
| `title` | string | Spec frontmatter `spec_name`, verbatim |
| `spec_type` | string | Spec frontmatter `spec_type` — one of `screen` / `automation` / `logic-rule` / `integration` / `notification` |
| `priority_tier` | string | Spec frontmatter `priority_tier` (inherited from the parent feature at Stage 3; carried verbatim, and validated equal to the parent epic's tier) |
| `body_md` | string | **The complete spec file, byte-for-byte, including frontmatter** — read from disk with `fs.readFileSync`, placed into the JSON string unmodified. This is the losslessness backbone: whatever any render needs beyond the structured fields is recoverable from `body_md`. |
| `source_path` | string | The spec file's path relative to the canonical root (`.n2b/`), forward slashes |
| `acceptance_criteria` | array of objects | Parsed from the spec's `## Acceptance Criteria` section per §6 — `{id, given, when, then}`, all strings. Array length must equal the file's frontmatter `acceptance_criteria_count`. |

## 5. `dependency_edges[]`

Every edge object:

```json
{ "from": "FEAT-02", "to": "FEAT-10", "type": "is-blocked-by", "source": "dependency-map" }
```

| Field | Type | Definition |
|---|---|---|
| `from` / `to` | string | Node IDs — epic IDs (`FEAT-XX`) for feature-level edges, story IDs (`FEAT-NN.SPEC-NNN`) for spec-level edges. Every endpoint must exist in `epics[]` or `stories[]`. `FOUNDATION` never appears in an edge (its precedence is a rendering rule, not a package fact). |
| `type` | string | `"blocks"` or `"is-blocked-by"` — nothing else |
| `source` | string | `"dependency-map"` (feature-level, from `feature-dependency-map.md`) or `"connected-specs"` (spec-level, from each spec's `## Connected Specs` table) |

**Both directions are materialized.** Every derived directed dependency A-needs-B is emitted as
a mirror pair: `{from: A, to: B, type: "is-blocked-by", source}` **and**
`{from: B, to: A, type: "blocks", source}`. Consumers may therefore query either direction
without inverting. After derivation, edges are **deduplicated** on the full tuple
`(from, to, type, source)` (reciprocal Connected Specs tables list the same link twice).
Cycles are legal and preserved — the canonical map itself records mutual feature dependencies
(e.g. Homely FEAT-04 ↔ FEAT-14).

### 5.1 Derivation — `dependency-map` (feature level, authoritative build-order)

From the `## Features` table of `.n2b/specifications/feature-dependency-map.md`: for each row
whose `Depends On` cell lists features, each listed `FEAT-GG` yields
`{from: FEAT-row, to: FEAT-GG, type: "is-blocked-by"}` plus its mirror. Cells containing only
a dash placeholder (`--` / `—`) yield nothing. The table's `Depended On By` column is
documented as the exact inverse of `Depends On`; the builder derives edges from `Depends On`
only and **validates** the derived mirror set against `Depended On By` (mismatch → validation
failure, §7).

### 5.2 Derivation — `connected-specs` (spec level)

From each spec's `## Connected Specs` table (`Connected Spec | Connection Type | Description`
columns). The Connected Spec cell's leading ID token resolves the row's endpoint class —
trailing parenthesized names are always ignored:

- **Spec-level endpoint** — a leading `FEAT-NN.SPEC-NNN` token: the row is edge-eligible and
  is normalized by the mapping below.
- **Cross-feature pointer** — a leading bare `FEAT-NN` token with no `.SPEC-` segment (e.g.
  `FEAT-02 (Provider Discovery & Search)`): an expected, legal row class that emits **no
  spec-level edge** — feature-level dependencies come exclusively from the authoritative §5.1
  map — and is counted as `feat_level_pointers` in the builder's run log (Homely: 178 of the
  836 Connected Specs rows).
- **Unresolvable** — no ID token of either kind: counted as `unparseable_rows`, which **must
  be 0** (§7 rule 10). Such a row is a validation failure to diagnose, never a silent skip
  and never a guess.

Each edge-eligible row is normalized into one or more directed prerequisite links
`X is-blocked-by Y` ("X needs Y in place") by this pinned mapping, where
S = the spec whose file the table lives in and C = the connected spec:

| Base connection type | Direction marker | Prerequisite link |
|---|---|---|
| References, Navigation, Consumes, Embeds, Reads | `(outbound)` — S acts toward C | S is-blocked-by C (S's flow needs C to exist) |
| References, Navigation, Consumes, Embeds, Reads | `(inbound)` — C acts toward S | C is-blocked-by S |
| Triggers | `(outbound)` — S triggers C | C is-blocked-by S (C's flow starts from S) |
| Triggered by | `(inbound)` — C triggers S | S is-blocked-by C |
| Affects, Data source | `(outbound)` — S affects / supplies data to C | C is-blocked-by S |
| Affected by | `(inbound)` | S is-blocked-by C |

`Embeds` and `Reads` behave as the References family — the embedding/reading spec's flow
needs its counterpart to exist. `Data source` behaves as Affects — S supplies data C needs
(verified against the Homely row whose Description states the listing content "is read by
FEAT-03").

Normalization rules (verified against the live Homely tables, 2026-07-28 — under these rules
all 836 Connected Specs rows across the 187 spec files resolve with zero unparseable
endpoints and zero unmapped types):

- **Compound cells** — a Connection Type cell may join several components with `/`, `;` or
  `,` (e.g. `Triggered by (inbound) / Affects (outbound)` or
  `Navigation (inbound), Affects (outbound)`). Split the cell on `/`, `;` and `,` **at top
  parenthesis depth only** — the same technique §3.1 pins for `connected_entities` — and
  emit one link per component. Splitting on delimiters inside parentheses is a defect: it
  tears the bidirectional marker `(inbound/outbound)` into the fragments
  `Navigation (inbound` + `outbound)` (19 Homely rows carry that marker).
- **Direction is detected by word presence inside the parenthetical, never by exact-token
  equality** — real Homely markers include `(outbound via back arrow)` and `(inbound and
  outbound)`. A component is **bidirectional** if its parenthetical contains the word
  `bidirectional`, or contains both `inbound` and `outbound`; otherwise **inbound** if it
  contains `inbound`; otherwise **outbound** if it contains `outbound`; otherwise the
  bare-type default below. Bidirectional components emit both directions of the base type's
  rule. Modifier tokens (`cross-feature`, `redirect`, `recurring`, `manual`, `indirect`,
  `informational`, `via back arrow`, …) carry no direction words of their own and are
  thereby ignored without needing an explicit stop-list.
- **Bare types with no marker** (e.g. `References`) default to `(outbound)`.
- **Unknown base types** — a component whose base type is not in the table above emits no
  edge and is **itemized in the builder's run log by file, row and literal cell text** as a
  package-shape finding — never dropped silently. (Homely: zero with the table above.)

Each prerequisite link then materializes as its mirror pair per the rule above, with
`source: "connected-specs"`.

## 6. Acceptance-Criteria Parse Rules (GWT extraction)

Pinned against the live Homely package (2026-07-26): **2,442 of 2,442 AC lines across all 187
spec files match the line pattern below exactly** — the count equals the sum of every spec's
`acceptance_criteria_count` frontmatter field.

### 6.1 Line pattern

Within a spec's `## Acceptance Criteria` section (from that heading to the next `##` heading),
every acceptance criterion is a single line:

```
^\*\*(FEAT-\d{2}\.SPEC-\d{3}-AC-\d{2,3}):\*\* Given (.*)$
```

- Group 1 → `id` (Homely's observed ordinals are all two-digit, max AC-30 per spec; three
  digits are accepted for headroom).
- Group 2 → `rest`, the clause text after `Given `.
- Straight double quotes only (no curly quotes observed); lines are never wrapped.

### 6.2 Clause partition

Split `rest` with two delimiter regexes, **first occurrence, left to right**:

- **then-delimiter** `T = /,("?) then /` — every AC line contains at least one. The optional
  captured `"` is a closing quote hugging the comma American-style (e.g.
  `...status is "approved," when...` — 38 Homely lines for `then`, ~51 for `when`); it is
  re-attached to the end of the preceding clause, and the delimiter comma is dropped.
- **when-delimiter** `W = /,("?) when /` — used **only if it matches at an earlier index than
  the first T match** (guards against `when` appearing inside a `then` clause; 2 Homely lines
  have a second `, when ` after the split point).

Partition:

1. **W found before T** → `given` = text before W (plus W's captured quote); `when` = text
   between W and the first T after it (plus T's captured quote); `then` = everything after T
   to end of line.
2. **No W before T** → `given` = text before T (plus T's captured quote); `when` = `""`;
   `then` = everything after T to end of line. This is a real, legal shape — **120 Homely ACs
   fold the action into the Given** (e.g. `Given Meera enters an incorrect 6-digit code and
   taps Verify, then the field shows ...`).

Rules: keywords (`Given` / `when` / `then`) and the delimiter commas are not stored in the
clause strings; everything else — including trailing periods, internal `, then` compounds
(14 Homely lines continue with a second `then` inside the then-clause), semicolon-joined
secondary scenarios, and cross-references to other AC/SPEC IDs — stays verbatim inside the
clause it falls in. `given` and `then` must be non-empty for every AC; `when` may be `""`.

The structured triple is a **deterministic partition, not a paraphrase**: the verbatim AC line
always survives inside the story's `body_md`, and the parse is reproducible from it.

## 7. Losslessness Invariant & Validation Rules

backlog.json is valid only if every rule below holds. The builder's script enforces them all
before writing the final file; the export fidelity gate re-derives the canonical rosters by
grep (per `n2b/references/stage-5/fidelity-rules.md`) and diffs them against this file
mechanically. Canonical rosters are always derived from the canonical files at build/gate time
(ID formats per `id-prefixes.md`) — never from any cached list.

1. **Epic coverage:** feature-epic IDs = the FEAT roster of the dependency map's Features
   table, exactly — no missing, no extra, no duplicates. Exactly one `FOUNDATION` epic,
   carrying the complete XBR / ADR / ASMP / SC rosters per §3.2 (each ascending, verbatim,
   non-empty where the canonical source has entries).
2. **Story coverage:** story IDs = the canonical SPEC-file roster (one per
   `FEAT-*/FEAT-NN.SPEC-NNN-*.md` file), exactly — count equals the spec-file count.
3. **AC coverage:** total AC objects = the canonical AC-ID roster count; per story, the array
   length equals that spec's `acceptance_criteria_count` frontmatter value; AC IDs are unique
   and every AC's `id` is prefixed by its story's `id`.
4. **No empty bodies:** every `description_md` and `body_md` is non-empty; every `body_md` is
   byte-identical to its source file (validated by re-read and compare, or by length + content
   hash).
5. **Non-empty clauses:** every AC has non-empty `given` and `then` (`when` may be `""`).
6. **Referential integrity:** every `epic_id` names an existing feature epic; every edge
   endpoint exists; every edge `type`/`source` is in its enum; the edge set is symmetric
   (every `is-blocked-by` edge has its `blocks` mirror and vice versa) and duplicate-free.
7. **Inverse-column check:** the feature-level edge set derived from `Depends On` reproduces
   the map's `Depended On By` column exactly.
8. **Tier integrity:** every `priority_tier` is one of `Core` / `Important` / `Nice-to-Have`;
   every story's tier equals its parent epic's tier.
9. **Counts honest:** every `metadata.counts` value equals the length/total it describes.
10. **Connected-Specs rows fully accounted:** every data row of every `## Connected Specs`
    table resolves to exactly one endpoint class per §5.2 — spec-level (edge-eligible),
    cross-feature pointer (counted as `feat_level_pointers`), or unresolvable
    (`unparseable_rows`) — with edge-eligible + `feat_level_pointers` + `unparseable_rows`
    summing to the total row count, and **`unparseable_rows` = 0** (a non-zero count is a
    validation failure, never a skip). Components with unknown base types emit no edge and
    are itemized as package-shape findings (§5.2). The run log reports all of these counts;
    `feat_level_pointers` and itemized unknown-type findings are expected classes, not
    failures.

Verbatim discipline: IDs, names, tiers, bodies, capabilities, and entities are carried
character-for-character from the canonical files. Nothing in this file is summarized,
normalized, re-worded, or re-ordered beyond the sort orders §3–§5 pin.

## 8. Versioning

- `schema_version` is currently **1**. It describes the shape of this file, independent of
  `metadata.package_version` (which tracks the source package via MANIFEST.md).
- Additive, backward-compatible changes (new optional fields) keep the version and are
  recorded in this reference. Any breaking change — removed/renamed fields, changed types,
  changed parse or edge-derivation semantics — increments `schema_version`, amends contract
  C-26, and updates every consumer listed at the top of this document in the same work
  package.
- Consumers must reject a backlog.json whose `schema_version` is greater than the version
  they were built against.
- **Amendment record — 2026-07-28 (WP5 Phase 4, decision 99; C-26 amendment):**
  first-live-activation corrections from the orchestrator probes of the Homely package, all
  additive or corrective — `schema_version` stays **1**. §3.2 gained `carries.sc_ids` (the
  scope-boundary DO-NOT-BUILD roster). §5.2's normalization was corrected: depth-aware
  compound split on `/`, `;` and `,`; word-presence direction detection;
  `Embeds` / `Reads` / `Data source` added to the base-type table; unknown base types
  itemized instead of dropped; and bare-`FEAT-NN` endpoints reclassified as the expected
  `feat_level_pointers` class, distinct from `unparseable_rows` (which must be 0). §6.2's
  folded-Given count corrected to 120; §7 gained rule 10. Re-verified live: all 836 Homely
  Connected Specs rows resolve — 178 cross-feature pointers, 0 unparseable, 0 unmapped
  types.
