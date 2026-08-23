---
name: n2b:s4-architect
description: Produce the terminal technical blueprint — recommended architecture plus documented alternatives — from the Stage 3 specifications
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
  - WebSearch
  - WebFetch
---
<objective>
Run the autonomous architect pipeline — the terminal stage of the blueprint pipeline — from Stage 3 validation through Gate 4 architecture validation. No human interaction required during the run. When Gate 4 passes, the pipeline is complete (`pipeline_status: blueprint-complete`) and the handoff package exists; no further stage is required.

**Produces:** The five-document technical track in `.n2b/architecture/`:
- `technical-profile.md` — quantified technical profile extracted from Stage 3 specs: 17 capability signals plus verbatim demand-side inputs (scale, NFR, ecosystem)
- `technology-landscape.md` — researched option landscape per active decision area (3–5 real-world candidates each, with sources; web-first with a marked knowledge-based fallback)
- `technical-feasibility.md` — per-feature feasibility verdicts with required capabilities, candidate approaches, risks, and spike recommendations
- `technical-architecture.md` — the 14-section blueprint: a recommended architecture plus documented alternatives with trade-off tables for every decision area, sealed by an ADR decision log
- `database-schema.md` — real-product database schema with data-lifecycle, security/access, and indexing decisions

**Before running:** Ensure Stage 3 specifications are complete (produced by `/n2b:s3-specify`). The pipeline will validate Stage 3 completeness before spawning any agents and halt with a clear message if anything is missing or incomplete.

**Tracking:** Updates `.n2b/tracking/` files (PIPELINE.md, STATE.md, MANIFEST.md, stages/s4-architect/STAGE.md) at every transition. On completion, the PACKAGE READY block lists the full handoff package derived from MANIFEST.md and offers optional export via `/n2b:s5-export`. Run `/n2b:status` after completion to verify.
</objective>

<execution_context>
@./.claude/n2b/workflows/stage-4/architect.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/references/tracking-protocol.md
</execution_context>

<process>
Execute the architect workflow from @./.claude/n2b/workflows/stage-4/architect.md end-to-end. This is a fully autonomous pipeline — no human questioning calls, no pauses.
</process>
