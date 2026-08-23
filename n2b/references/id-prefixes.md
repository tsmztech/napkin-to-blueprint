# ID Prefix Registry

Reference for all ID prefixes used in n2b's feature definition documents. This is the single source of truth for ID format — agents must not invent new prefixes.

## Prefixes

| Prefix | Entity | Format | Example |
|--------|--------|--------|---------|
| FEAT | Product feature | FEAT-XX | FEAT-01 |
| US | User story | US-XX | US-01 |
| UX | UX flow | UX-XX | UX-01 |
| SC | Scope boundary | SC-XX | SC-01 |
| ASMP | Assumption/constraint | ASMP-XX | ASMP-01 |
| SPEC | Feature specification | SPEC-NNN | SPEC-001 |
| XBR | Cross-feature business rule | XBR-XX | XBR-01 |
| ADR | Architecture decision record | ADR-NNN | ADR-001 |

## Numbering Rules

- Most prefixes use a sequential, zero-padded two-digit counter: 01, 02, 03, ...
- SPEC uses a three-digit zero-padded counter (NNN): 001, 002, 003, ... — allowing up to 999 specs per feature.
- XBR uses a two-digit zero-padded counter (XX): 01, 02, ... — allowing up to 99 cross-feature rules.
- ADR uses a three-digit zero-padded counter (NNN): 001, 002, 003, ... -- allowing up to 999 decisions per architecture document.
- No gaps within a first generation run. On re-runs, gaps left by retired IDs are preserved (see ID Stability Across Re-runs).
- IDs persist across re-runs — see ID Stability Across Re-runs below.

## Dot-Notation Hierarchy

Child items link to parents using dot notation: `PARENT-XX.CHILD-XX`.

| Notation | Meaning |
|----------|---------|
| `FEAT-01.US-01` | User story 1 derived from Feature 1 |
| `FEAT-03.UX-02` | UX flow 2 derived from Feature 3 |
| `FEAT-02.SC-01` | Scope boundary 1 derived from Feature 2 |
| `FEAT-01.SPEC-001` | Specification 1 of Feature 1 |

One level of nesting only (PARENT.CHILD). Deeper nesting is not supported.

## Assignment Responsibilities

**Visionary** assigns all IDs at creation time during feature generation. Every entity receives its ID when the Visionary first produces it.

**Synthesizer** preserves Visionary-assigned IDs — never renumbers or reassigns. New features added by the Synthesizer (research-suggested or audit-added) receive the next sequential ID after the highest Visionary-assigned ID.

**Feature Analyst** assigns SPEC numbers (SPEC-001, SPEC-002, ...) during feature decomposition. Spec numbers are sequential within each feature, starting at 001.

**Requirements Architect** assigns XBR numbers (XBR-01, XBR-02, ...) during dependency map creation. XBR numbers are sequential across the entire project.

**Technical Architect** assigns ADR numbers (ADR-001, ADR-002, ...) during architecture generation. ADR numbers are sequential within the decision register, starting at 001.

Every assignment above is subject to the stability rules below: on a re-run, "assigning" begins by reading the existing document set and reusing the IDs of surviving entities.

## ID Stability Across Re-runs

IDs are the export-continuity contract. The blueprint package exists to be handed off, and downstream consumers reference its IDs directly — tracker issues carry FEAT and SPEC IDs in their summaries, dev-team briefs cite ADR numbers, external links embed spec IDs. An ID that silently changes between runs turns every one of those references into a dangling pointer. These rules keep external references valid across regeneration:

1. **Reuse surviving IDs.** On any re-run, agents MUST read the existing documents before assigning IDs, and reuse the ID of every entity that survives — whether unchanged or renamed. A renamed feature keeps its FEAT number; a rewritten spec keeps its SPEC number.
2. **New entities take the next free number** — the next number above the highest ever assigned for that prefix (within its scope), never a number filling a visible gap.
3. **Retired IDs are never reused.** When an entity is removed, its number is permanently retired and the gap remains. A gap is information: it tells an export consumer that something they may have imported no longer exists.
4. **Splits and merges are mapped.** Where an entity is split or merged, the workflow records an old→new mapping note in the regenerated document's frontmatter (e.g. `id_map: "FEAT-04 → FEAT-04 + FEAT-09"` for a split, `id_map: "SPEC-003 + SPEC-004 → SPEC-003"` for a merge) so exports can mark precisely which external references went stale — not just that "something changed".

## Scope Boundaries

- IDs persist across re-runs (per ID Stability Across Re-runs); retired IDs are never reused.
- Maximum 99 items per prefix for two-digit counters (XX).
- Maximum 999 items for SPEC prefix (three-digit counter, NNN).
- Maximum 99 items for XBR prefix (two-digit counter, XX).
- Maximum 999 items for ADR prefix (three-digit counter, NNN).
- Counter maximums are lifetime ceilings — retired numbers count against them.
- The export stage introduces no new prefixes: receipts, manifests, dashboards, and fidelity reports are tracking artifacts, not ID-bearing documents. They read existing IDs (e.g., the manifest's ID-coverage column, roster reconciliation) and never mint new ones.
- This document is the single source of truth for ID format — agents must not invent new prefixes.
