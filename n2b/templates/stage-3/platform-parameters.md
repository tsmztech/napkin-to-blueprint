---
document_type: platform-parameters
produced_by: cross-reference-reconciler
status: {draft | final}
created: {YYYY-MM-DD}
parameter_count: {N}
marker_site_count: {N}
---

# Platform Parameters — Decide Before Build

<!-- Rules for this document:
  - Written by the Cross-Reference Reconciler during Pass D (contract C-36); one file per
    package at .n2b/specifications/platform-parameters.md — it enters the package
    manifest like every other specifications/ file and rides every export's
    docs/blueprint/ copy verbatim
  - One table row per DISTINCT marker slug found across specifications/FEAT-*/ spec
    files (the marker shape is the literal phrase platform parameter: followed by a
    backticked kebab-case slug). Slugs are names, not IDs — there is no PARAM- prefix
    in the ID lattice, and rows carry no ID of their own
  - Referenced by = every spec ID whose file carries the marker, shell-derived (grep),
    never recalled; the count of marker sites must reconcile with Gate A's sweep
  - Proposed default + Rationale are the reconciler's SUGGESTION, grounded in Stage 2
    market research (features/market-research.md) and BRIEF.md constraints — explicitly
    NON-BINDING. The pipeline proposes policy numbers; it never decides them
  - Status is decide-before-build for every row as shipped; a downstream consumer flips
    rows to decided: {value} in their own copy
  - Empty state: when zero markers exist across the package, this file is NOT written —
    skip it entirely (Gate A requires it whenever markers exist and flags an existing
    registry with zero markers as stale)
-->

## What this is

The specifications reference {parameter_count} platform-wide policy values by name
instead of fixing numbers — deliberately: these are business decisions the blueprint
surfaces for an explicit decision rather than deciding silently. Each row below names
one parameter, every spec that depends on it, and a **proposed default with rationale**
— a suggestion, not a commitment. **Decide every row before build.**

## Registry

| Parameter | Referenced by | What it governs | Proposed default | Rationale | Status |
|-----------|---------------|-----------------|------------------|-----------|--------|
| `{kebab-slug}` | {FEAT-NN.SPEC-NNN, …} | {one line: what behavior this value controls} | {proposed value} | {grounded in market-research.md / BRIEF constraint — one line} | decide-before-build |

{…one row per distinct marker slug, slugs in alphabetical order…}

## Contract

These values are deliberately not decided by the blueprint. Every spec that references
a row's slug behaves per its own acceptance criteria *given* the value; the value
itself is the product owner's pre-build decision. When a value is decided, record it in
the Status column of your working copy (`decided: {value}`) — the specs need no edits.
