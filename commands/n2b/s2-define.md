---
name: n2b:s2-define
description: Transform BRIEF.md into a complete 7-document product definition set using the autonomous n2b pipeline
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
  - WebSearch
  - WebFetch
---
<objective>
Run the autonomous define pipeline from BRIEF.md validation through final document production. No human interaction required during the run.

**Produces:** 7 documents in `.n2b/features/` — the complete product definition set for the downstream n2b stages:
- `product-features.md` — final feature set, fully tiered (Core / Important / Nice-to-Have) and phased (MVP / v1 / Later), with the per-feature Functional Depth block and the feature interaction summary
- `user-persona.md` — synthesized persona set (primary persona, evidence-justified secondary personas, Access Matrix)
- `user-journeys.md` — key user journeys with owning personas and touchpoints
- `scope-boundaries.md` — in-scope vs. out-of-scope definition with scale expectations and phased deferrals
- `success-metrics.md` — measurable success criteria
- `assumptions-constraints.md` — product assumptions, constraints, non-functional expectations, and dependencies
- `market-research.md` — competitive landscape, pricing & packaging, and market context

**Before running:** Ensure `.n2b/BRIEF.md` exists and is populated (created by `/n2b:s1-init`). The pipeline will validate BRIEF.md before spawning any agents and halt with a clear message if it is missing or malformed.

**Tracking:** Updates `.n2b/tracking/` files (PIPELINE.md, STATE.md, MANIFEST.md, stages/s2-define/STAGE.md) at every transition. Run `/n2b:status` after completion to verify.
</objective>

<execution_context>
@./.claude/n2b/workflows/stage-2/define.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/references/tracking-protocol.md
</execution_context>

<process>
Execute the define workflow from @./.claude/n2b/workflows/stage-2/define.md end-to-end. This is a fully autonomous pipeline — no human questioning calls, no pauses.
</process>
