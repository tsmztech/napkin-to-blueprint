<!-- Export Template: Dev-Team Brief (`dev-brief`)

     This template is the output blueprint for the `dev-brief` export target. Unlike the
     single-document stage templates, it defines a DIRECTORY of rendered files (the C-28
     layout) plus the assembly recipe for each one. It is consumed by
     export-dev-brief-formatter.md, spawned by n2b/workflows/stage-5/export.md, and gated
     by the rules in n2b/references/stage-5/fidelity-rules.md (dev-brief row =
     full-transclusion contract).

     Governing rules:
     - RENDERING, NOT AUTHORING. The formatter may author navigation and glue prose only
       (the Authored-Content Whitelist below). It may never invent, summarize, paraphrase,
       reword, renumber, or drop product or technical content, never resolve open
       questions, and never drop an ID.
     - SHELL ASSEMBLY. Every verbatim part is assembled with Bash (`cat`/`awk` appends),
       never retyped through the model. Byte-identical transclusion is both the fidelity
       guarantee and the cost control.
     - Rendered part files carry NO YAML frontmatter. Frontmatter blocks of transcluded
       canonical files are stripped at assembly time (idiom below) — a YAML block
       mid-document breaks markdown and frontmatter parsers.
     - "PACKAGE_ROOT" below is the canonical package root the workflow provides
       (normally `.n2b/`). "OUTPUT_DIR" is the export directory the workflow provides
       (normally `.n2b/exports/dev-brief/`).
-->

# Export Template: Dev-Team Brief (`dev-brief`)

## Output Layout

Every rendered file lives directly in OUTPUT_DIR (`.n2b/exports/dev-brief/`):

```
.n2b/exports/dev-brief/
  00-README.md                            # authored: exec summary, package map, reading order, what-to-do-first
  A-product-vision.md                     # BRIEF.md + user-persona.md, verbatim
  B-usage-and-success.md                  # user-journeys.md + success-metrics.md, verbatim
  C-scope-and-assumptions.md              # scope-boundaries.md + assumptions-constraints.md + BRIEF Open Questions
  D-feature-catalog.md                    # product-features.md + dependency-map cross-feature sections, verbatim
  E-feature-specifications/
    FEAT-NN-{slug}.md                     # one chapter per feature: overview + every spec, verbatim
  F-data-model.md                         # Domain Entity Inventory + Shared Data Entities, verbatim extracts
  G1-design-layer.md                      # design posture (three-way, see Part G1)
  G2-architecture.md                      # profile + landscape + feasibility + architecture, verbatim
  G3-database-schema.md                   # database-schema.md, verbatim
  H-appendices.md                         # market-research.md verbatim + generated AC index
  COMBINED.md                             # shell concatenation of 00 + A..H (E chapters in FEAT order)
  FIDELITY-REPORT.md                      # NOT produced by the formatter — fidelity checker owns it
  EXPORT-RECEIPT.md                       # NOT produced by the formatter — workflow owns it
```

`COMBINED.md` never includes `FIDELITY-REPORT.md` or `EXPORT-RECEIPT.md`.

## Global Assembly Rules

### Shell idioms (pin these exactly)

**Frontmatter strip** — every transclusion of a canonical file uses this filter (it removes
a leading YAML block only, and passes files without one through untouched):

```bash
strip_fm() { awk 'NR==1 && $0=="---"{fm=1; next} fm && $0=="---"{fm=0; next} !fm' "$1"; }
# usage:  strip_fm "$PACKAGE_ROOT/BRIEF.md" >> "$OUT/A-product-vision.md"
```

**Section extract** — when a part carries one `## `-section of a canonical file (verbatim
lines, heading included, up to the next `## ` heading):

```bash
extract_section() { awk -v h="$2" '$0=="## "h{f=1} f && /^## / && $0!="## "h{exit} f' "$1"; }
# usage:  extract_section "$PACKAGE_ROOT/features/product-features.md" "Domain Entity Inventory" >> "$OUT/F-data-model.md"
```

**Authored glue** — the formatter writes its own prose with quoted heredocs
(`cat >> file <<'EOF' … EOF`), interleaved with the appends above. Glue is inserted only
*between* transcluded documents/sections, never inside one.

**Concatenation** — parts and chapters are built by appending in the pinned order; a
single blank-line separator (`printf '\n\n'`) between concatenated units keeps adjacent
headings from colliding. No other separator is inserted.

### Heading-level discipline

- Each part file opens with one authored H1: `# Part {letter} — {title}` (E chapters:
  `# FEAT-NN — {Feature Name}`).
- Transcluded documents keep their internal heading levels **unchanged** — including their
  own `# ` titles. A part file therefore legitimately contains multiple H1s.
- Never demote, renumber, or rewrite headings inside verbatim content. Navigation lives in
  `00-README.md` and the authored part intros — not in rewritten headings.

### Authored-Content Whitelist

The formatter authors ONLY: the executive summary (written once, reused verbatim in
`00-README.md` and Part A), the package map, the role-based reading order, the
what-to-do-first list, one intro paragraph per part, one-line bridges between transcluded
documents within a part, the E chapter openers (with their spec-inventory tables sourced
from spec frontmatter), the Part G1 design-posture statement, the Part C "Open items for
the team" framing note, and the Part H AC-index (generated by a bash/awk pass, preferred
over hand-writing). Everything else is transcluded bytes.

Counted totals used anywhere in authored prose (feature/spec/AC counts) are derived by
`ls`/`grep -c` over the canonical package at assembly time — never estimated or recalled.

---

## 00-README.md

<!-- Fully authored. No transcluded content. Written LAST, after all other parts exist,
     so every count and pointer is real. Sources: BRIEF.md (read for the exec summary),
     the derived counts, PKG_VERSION from the workflow, and the finished part files
     (for the package map). -->

```markdown
# {Project Name} — Development Brief

> Rendered from the {Project Name} blueprint package, version {PKG_VERSION}, on {YYYY-MM-DD}.
> This brief reorganizes the package for human readers; it adds navigation, never content.
> For print or PDF, use `COMBINED.md` — the same parts in one file.

## Executive Summary

{3–6 authored sentences derived from BRIEF.md Vision/Problem/Experience plus the counted
totals: what the product is, who it serves, and what this package contains — e.g. "{N}
features specified in {N} specifications carrying {N} acceptance criteria, a recommended
architecture with documented alternatives, and a complete database schema." Every number
counted, not estimated.}

## Package Map

| Part | File | What it contains | Built from |
|------|------|------------------|-----------|
| 00 | 00-README.md | This guide | authored |
| A | A-product-vision.md | Vision, problem, brief, persona set + access matrix | BRIEF.md · user-persona.md |
| B | B-usage-and-success.md | User journeys, success metrics | user-journeys.md · success-metrics.md |
| C | C-scope-and-assumptions.md | Exclusions (SC), assumptions (ASMP), NFRs, open items | scope-boundaries.md · assumptions-constraints.md · BRIEF Open Questions |
| D | D-feature-catalog.md | Full feature catalog (FEAT), dependencies, cross-feature rules (XBR) | product-features.md · feature-dependency-map.md |
| E | E-feature-specifications/ | One chapter per feature: breakdown brief + every spec, verbatim | specifications/FEAT-NN-{slug}/ |
| F | F-data-model.md | Domain entities, shared data entities | product-features.md · feature-dependency-map.md |
| G1 | G1-design-layer.md | Design posture {and supplied design material, when present} | {per posture} |
| G2 | G2-architecture.md | Technical profile, technology landscape, feasibility, recommended architecture + alternatives | architecture/ (4 documents) |
| G3 | G3-database-schema.md | Complete database schema | database-schema.md |
| H | H-appendices.md | Market research, consolidated acceptance-criteria index | market-research.md · generated index |

## Reading Order by Role

{One short list per role. Name concrete parts, in order, with a one-line why. Adapt the
wording to this product, keep the part assignments:}

- **Product manager / project lead:** 00 → A → C → D → B — the product, its boundaries,
  and its open items before anything technical.
- **Designer:** A (persona set + access matrix) → G1 (design posture) → B (journeys) →
  E chapters for the screen specs of the features being designed.
- **Backend engineer:** A → D → F → G3 → G2 — then the E chapters in dependency order
  (Part D's Features table carries Depends On).
- **Frontend engineer:** A → B → G1 → G2 (architecture §5 structure + §7 routes) → E
  chapters, screen specs first.
- **QA:** C (what is out of scope) → E chapters' Acceptance Criteria sections → H
  (consolidated AC index — every criterion in one table, with source pointers).

## What To Do First

1. **Resolve the open items.** Part C ends with the brief's open questions — the decisions
   the team owns before or during early build.
2. **Confirm the architecture recommendation.** Part G2 records a recommended option plus
   documented alternatives for every decision area, with `Choose instead when` conditions.
   The recommendation is the default; the alternatives exist so this team can adapt
   choices to its own constraints — confirm or substitute deliberately, per area.
3. **Pick your tooling exports.** This brief is one rendering of the package. The same
   package exports to other consumers (tracker backlogs, AI coding agents) —
   `/n2b:s5-export` lists what is available.
```

---

## A-product-vision.md

Assembly (in order):

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part A — Product Vision` + intro paragraph + `## Executive Summary` (same text as 00-README's) | authored |
| 2 | `## The Brief` bridge line | authored |
| 3 | `PACKAGE_ROOT/BRIEF.md` — full body | `strip_fm` append, verbatim |
| 4 | `## Who This Is For` bridge line | authored |
| 5 | `PACKAGE_ROOT/features/user-persona.md` — full body (persona SET: primary + secondary personas + Access Matrix) | `strip_fm` append, verbatim |

<!-- The persona document is a persona SET (Persona Set Summary / Primary Persona /
     Secondary Personas / Access Matrix — C-15). Transclude the whole document; never
     reduce it to a single persona, never drop the Access Matrix (Part G2's architecture
     §11 role mapping is built from it, and readers will cross-reference). The brief's
     Open Questions section rides along verbatim inside BRIEF.md here AND is re-surfaced
     in Part C — the duplication is deliberate. -->

---

## B-usage-and-success.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part B — Usage & Success` + intro paragraph | authored |
| 2 | `## How It's Used` bridge line | authored |
| 3 | `PACKAGE_ROOT/features/user-journeys.md` — full body | `strip_fm` append, verbatim |
| 4 | `## What Success Looks Like` bridge line | authored |
| 5 | `PACKAGE_ROOT/features/success-metrics.md` — full body | `strip_fm` append, verbatim |

<!-- Journeys are the team's integration-test narratives; metrics carry testable targets.
     Both flow whole — every journey step and every metric target intact. -->

---

## C-scope-and-assumptions.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part C — Scope & Assumptions` + intro paragraph | authored |
| 2 | `## What Is Out of Scope` bridge line | authored |
| 3 | `PACKAGE_ROOT/features/scope-boundaries.md` — full body (every SC-XX with rationale + Deferral Notes) | `strip_fm` append, verbatim |
| 4 | `## Assumptions, Constraints & Expectations` bridge line | authored |
| 5 | `PACKAGE_ROOT/features/assumptions-constraints.md` — full body (ASMP-XX, Product Constraints, Non-Functional Expectations, Dependencies) | `strip_fm` append, verbatim |
| 6 | `## Open Items for the Team` heading + one authored framing sentence ("These are the brief's open questions — unresolved by design; the team owns them.") | authored |
| 7 | BRIEF.md `## Open Questions` section body | `extract_section "$PACKAGE_ROOT/BRIEF.md" "Open Questions"` — verbatim lines. Drop the extracted `## Open Questions` heading line itself (step 6's heading replaces it): pipe through `tail -n +2` |

<!-- The open questions are surfaced, never answered — resolving one is authoring, which
     the formatter must not do. The SC and ASMP rosters must survive complete: the
     fidelity gate reconciles every SC-XX and ASMP-XX ID against this part. -->

---

## D-feature-catalog.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part D — Feature Catalog` + intro paragraph, ending with the pointer: "The Domain Entity Inventory below also anchors Part F, the data-model view." | authored |
| 2 | `PACKAGE_ROOT/features/product-features.md` — full body (Summary, Domain Entity Inventory, all three priority tiers, Feature Interaction Summary) | `strip_fm` append, verbatim |
| 3 | `## How the Features Depend on Each Other` bridge line | authored |
| 4 | dependency-map `## Features` table | `extract_section "$PACKAGE_ROOT/specifications/feature-dependency-map.md" "Features"` |
| 5 | dependency-map `## Navigation Connections` | `extract_section … "Navigation Connections"` |
| 6 | dependency-map `## Cross-Feature Business Rules` — every XBR-NN in full | `extract_section … "Cross-Feature Business Rules"` |
| 7 | dependency-map `## External Touchpoints` | `extract_section … "External Touchpoints"` |

<!-- The dependency map's remaining section (Shared Data Entities) goes to Part F — the
     two parts together carry the whole document. XBR rules are rendered in full here,
     IDs intact: they are cross-feature law, and the fidelity gate reconciles the XBR
     roster against this part. Sections 4–7 keep the map's own internal order. -->

---

## E-feature-specifications/FEAT-NN-{slug}.md — one chapter per feature

<!-- One chapter file per canonical feature directory, named exactly after it:
     PACKAGE_ROOT/specifications/FEAT-04-book-service-slot-upi-deposit/ →
     E-feature-specifications/FEAT-04-book-service-slot-upi-deposit.md.
     Every feature directory produces a chapter — the formatter loops
     `ls -d "$PACKAGE_ROOT"/specifications/FEAT-*/` and the self-check compares counts.
     Spec files within a chapter concatenate in SPEC-NNN order (zero-padded filenames
     sort correctly under `ls`). -->

Chapter assembly (in order):

| # | Content | Method |
|---|---------|--------|
| 1 | Chapter opener (skeleton below) | authored; table values read from spec frontmatter (`spec_id`, `spec_name`, `spec_type`, `acceptance_criteria_count`) via grep/awk — never counted by the model |
| 2 | `{dir}/feature-overview.md` — full body | `strip_fm` append, verbatim |
| 3 | each `{dir}/FEAT-NN.SPEC-NNN-*.md` in SPEC order — full body, all five spec types (screen, automation, logic-rule, integration, notification) | `strip_fm` append per file, verbatim, blank-line separated |

Chapter opener skeleton:

```markdown
# FEAT-NN — {Feature Name}

{One authored paragraph: what this feature is (from the overview's Summary), its priority
tier, and what this chapter contains — "{K} specifications carrying {M} acceptance
criteria" (M = sum of the specs' `acceptance_criteria_count` frontmatter values).}

| Spec | Name | Type | Acceptance criteria |
|------|------|------|---------------------|
| FEAT-NN.SPEC-001 | {spec_name} | {spec_type} | {acceptance_criteria_count} |
{…one row per spec file, SPEC order…}

The feature breakdown brief follows, then every specification in full.
```

<!-- The spec bodies are the deepest layer of the package — interaction tables, states,
     validation rules with exact error messages, edge cases, Given/When/Then acceptance
     criteria with IDs. They flow byte-for-byte. Integration and Notification specs are
     specs like any other — never skipped, never summarized. -->

---

## F-data-model.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part F — Data Model` + intro paragraph ("the product's data vocabulary — the entities behind every feature; the physical schema is Part G3") | authored |
| 2 | product-features `## Domain Entity Inventory` section | `extract_section "$PACKAGE_ROOT/features/product-features.md" "Domain Entity Inventory"` |
| 3 | `## Entities Shared Across Features` bridge line | authored |
| 4 | dependency-map `## Shared Data Entities` section (with per-entity Contention + Data Sensitivity lines) | `extract_section "$PACKAGE_ROOT/specifications/feature-dependency-map.md" "Shared Data Entities"` |

<!-- The Domain Entity Inventory appears verbatim both inside Part D (as part of
     product-features.md) and here — deliberate: Part D is the catalog reading, Part F is
     the data reading. Extraction, not paraphrase, in both places. -->

---

## G1-design-layer.md

<!-- Three-way posture, decided by what exists in the canonical package — checked in this
     order. The posture statement is authored; supplied material is transcluded verbatim. -->

**Posture 1 — passthrough directory `PACKAGE_ROOT/specifications/design-system/` exists:**

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part G1 — Design Layer` + authored posture statement: the design system is user-supplied; its files are carried verbatim from the package's passthrough directory; the architecture (Part G2 §9) maps its values to code as-is, never redesigning them | authored |
| 2 | File inventory table: `| File | Rendered below / pointer |` | authored, from `ls` |
| 3 | Each text file in the directory, in filename order: `.md` files via `strip_fm` append; other text formats (design-token JSON, SOURCES.md) inside fenced code blocks (` ```json ` etc.), bytes unchanged | shell append |
| 4 | Each non-text file (e.g. PDF): one inventory line pointing at its canonical path — `Supplied as {file} — see .n2b/specifications/design-system/{file}` (binary content cannot be inlined in a markdown brief; the canonical file is the deliverable) | authored pointer |

**Posture 2 — no directory, but legacy single file `PACKAGE_ROOT/specifications/design-system.md` exists:**

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part G1 — Design Layer` + authored provenance note: this design system was generated by an earlier version of the pipeline and is carried as-is; current packages instead carry a user-supplied design-system directory, or ship design-agnostic | authored |
| 2 | `PACKAGE_ROOT/specifications/design-system.md` — full body | `strip_fm` append, verbatim |

**Posture 3 — neither exists (design-agnostic package):**

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part G1 — Design Layer` + authored statement: this package ships **design-agnostic** — no design system is part of the blueprint; the implementing team owns visual design, honoring any design preferences recorded in the brief's Constraints (Part A); Part G2 §9 still records the styling-system and component-layer architecture decisions | authored |
| 2 | `## Stated Preferences (from the Brief's Constraints)` bridge line + BRIEF.md `## Constraints` section body | authored line + `extract_section "$PACKAGE_ROOT/BRIEF.md" "Constraints"` |

---

## G2-architecture.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part G2 — Architecture: Recommendation & Alternatives` + intro paragraph (skeleton note below) | authored |
| 2 | `## The Evidence — Technical Profile` bridge line | authored |
| 3 | `PACKAGE_ROOT/architecture/technical-profile.md` — full body | `strip_fm` append, verbatim |
| 4 | `## The Option Space — Technology Landscape` bridge line | authored |
| 5 | `PACKAGE_ROOT/architecture/technology-landscape.md` — full body | `strip_fm` append, verbatim |
| 6 | `## Feasibility Assessment` bridge line | authored |
| 7 | `PACKAGE_ROOT/architecture/technical-feasibility.md` — full body | `strip_fm` append, verbatim |
| 8 | `## The Decisions — Technical Architecture` bridge line, noting: "Section 1 below repeats the technical profile — by design; it is the architecture document's own embedded evidence base." | authored |
| 9 | `PACKAGE_ROOT/architecture/technical-architecture.md` — full body | `strip_fm` append, verbatim |

<!-- Ordering is the reading argument: evidence → options → feasibility → decisions — the
     reader meets every recommendation with its evidence already in hand. ALL FOUR
     documents flow verbatim and whole. Alternatives render at exactly the depth the
     canonical document gives them (the six-axis Alternatives tables) — equal-depth
     rendering means transcluding the tables untouched, never trimming them to the
     recommended row. The intro paragraph states the authority rule: the recommendation
     is the default build; alternatives are documented, with `Choose instead when`
     conditions, for this team to weigh. The profile appearing twice (step 3, and inside
     the architecture's Section 1) is accepted duplication — deduplicating would mean
     editing inside a verbatim document, which is forbidden.
     Legacy-package note: architecture documents generated before the nested-frontmatter
     template fix may embed the profile's YAML frontmatter block inside Section 1. That is
     canonical body content — it flows verbatim, is never edited out, and is noted in the
     formatter's completion report. -->

---

## G3-database-schema.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part G3 — Database Schema` + intro paragraph (one line; table/relationship counts from the schema's frontmatter) | authored |
| 2 | `PACKAGE_ROOT/architecture/database-schema.md` — full body | `strip_fm` append, verbatim |

---

## H-appendices.md

| # | Content | Method |
|---|---------|--------|
| 1 | `# Part H — Appendices` + intro paragraph | authored |
| 2 | `## Appendix 1 — Market Research` bridge line | authored |
| 3 | `PACKAGE_ROOT/features/market-research.md` — full body | `strip_fm` append, verbatim |
| 4 | `## Appendix 2 — Consolidated Acceptance-Criteria Index` heading + one authored framing sentence ("Every acceptance criterion in the package, grouped by specification — digests only; the full Given/When/Then text lives in the Part E chapters and the source files.") | authored |
| 5 | The index itself | **generated by bash/awk** (recipe below) — never hand-written |

AC-index generation recipe (pin this shape; ~2,400 rows is a shell job, not a writing job):

```bash
for dir in "$PACKAGE_ROOT"/specifications/FEAT-*/; do
  for spec in "$dir"FEAT-*.md; do
    sid=$(awk -F': ' '/^spec_id:/{print $2; exit}' "$spec")
    sname=$(awk -F': ' '/^spec_name:/{print $2; exit}' "$spec")
    rel=".n2b/specifications/$(basename "$dir")/$(basename "$spec")"
    printf '\n### %s — %s\n\nSource: `%s`\n\n| AC | Digest |\n|----|--------|\n' "$sid" "$sname" "$rel"
    grep -E '^\*\*FEAT-[0-9]+\.SPEC-[0-9]+-AC-[0-9]+:\*\*' "$spec" | awk '{
      id=$1; sub(/^\*\*/,"",id); sub(/:\*\*$/,"",id);
      rest=$0; sub(/^[^ ]+ /,"",rest); gsub(/\|/,"\\|",rest);
      if (length(rest)>100) rest=substr(rest,1,100)"…";
      print "| " id " | " rest " |" }'
  done
done >> "$OUT/H-appendices.md"
```

<!-- Groups every AC ID by FEAT/SPEC in package order, one-line Given-digest per row
     (first ~100 characters of the criterion — a digest is navigation, not a substitute:
     the ID and source pointer carry the reader to the verbatim text), source-file pointer
     per spec. Digest truncation is legal ONLY here — it is an index, and every row points
     at the untruncated original. -->

---

## COMBINED.md

Shell concatenation — no authored content of its own:

```bash
{
  for f in 00-README.md A-product-vision.md B-usage-and-success.md \
           C-scope-and-assumptions.md D-feature-catalog.md; do
    cat "$OUT/$f"; printf '\n\n'
  done
  for ch in "$OUT"/E-feature-specifications/FEAT-*.md; do   # FEAT order (zero-padded names sort)
    cat "$ch"; printf '\n\n'
  done
  for f in F-data-model.md G1-design-layer.md G2-architecture.md \
           G3-database-schema.md H-appendices.md; do
    cat "$OUT/$f"; printf '\n\n'
  done
} > "$OUT/COMBINED.md"
```

<!-- Order: 00, A, B, C, D, E chapters in FEAT order, F, G1, G2, G3, H.
     FIDELITY-REPORT.md and EXPORT-RECEIPT.md are NEVER concatenated.
     Sanity floor: COMBINED.md's byte size must be >= the summed byte sizes of the
     concatenated inputs (it is a superset: inputs plus separators). Build COMBINED.md
     last, from the final part files — after any repair round, rebuild it. -->

---

## Files This Template Never Produces

- `FIDELITY-REPORT.md` — written by the export fidelity checker
  (n2b/agents/stage-5/export-fidelity-checker.md), per n2b/templates/stage-5/fidelity-report.md.
- `EXPORT-RECEIPT.md` — written by the export workflow (n2b/workflows/stage-5/export.md)
  at the export-complete transition, per n2b/templates/stage-5/export-receipt.md.
- Tracking files (dashboard, per-target tracker, MANIFEST rows) — workflow-owned, always.
