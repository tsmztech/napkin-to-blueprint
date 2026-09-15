---
name: n2b:s1-init
description: Initialize Stage 1 — open conversation to capture project vision and produce BRIEF.md
argument-hint: "[--smoke [N]]"
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<objective>
Initialize a new n2b project by exploring the user's vision through open, confidence-based conversation.

**Flag:** `--smoke [N]` — a capped (smoke) run for testing the pipeline: Stage 2 will define at most N features (default 3), so every later stage runs quickly and cheaply end-to-end. Written to `config.json` as `max_features`; omit the flag for a full run (change later with `/n2b:config --max-features <N|none>`, before Stage 2 runs).

**Creates:**
- `.n2b/BRIEF.md` — structured project brief with YAML frontmatter and sections: Vision, Problem Statement, Target Users & Roles, The Experience, Business Context, Scale & Non-Functional Expectations, Ecosystem & Integrations, Success Criteria, Constraints, Open Questions, plus conditional Feature Direction, Design System, and Source Materials sections
- `.n2b/config.json` — pipeline preferences (model_profile, model_provider, model_tiers, spec_review, design_system_source, max_features) — changeable later with `/n2b:config`
- `.n2b/tracking/` — complete tracking directory with PIPELINE.md, STATE.md, and stage tracking files

**After this command:** Pipeline tracking is live. Run `/n2b:s2-define` to continue, `/n2b:status` to check progress, or `/n2b:config` to change pipeline settings.
</objective>

<execution_context>
@./.claude/n2b/workflows/stage-1/init.md
@./.claude/n2b/references/stage-1/questioning.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/templates/stage-1/brief.md
@./.claude/n2b/templates/tracking/pipeline.md
@./.claude/n2b/templates/tracking/state.md
@./.claude/n2b/templates/tracking/stage-simple.md
@./.claude/n2b/templates/tracking/stage-s3-dashboard.md
@./.claude/n2b/references/tracking-protocol.md
</execution_context>

<process>
Execute the init workflow from @./.claude/n2b/workflows/stage-1/init.md end-to-end.
This is a direct conversation with the user — no subagents, no auto-advance.
</process>
