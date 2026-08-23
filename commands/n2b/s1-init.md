---
name: n2b:s1-init
description: Initialize Stage 1 — open conversation to capture project vision and produce BRIEF.md
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<objective>
Initialize a new n2b project by exploring the user's vision through open, confidence-based conversation.

**Creates:**
- `.n2b/BRIEF.md` — structured project brief with YAML frontmatter and sections: Vision, Problem Statement, Target Users & Roles, The Experience, Business Context, Scale & Non-Functional Expectations, Ecosystem & Integrations, Success Criteria, Constraints, Open Questions, plus conditional Feature Direction and Design System sections
- `.n2b/config.json` — pipeline preferences (model_profile, spec_review, design_system_source)
- `.n2b/tracking/` — complete tracking directory with PIPELINE.md, STATE.md, and stage tracking files

**After this command:** Pipeline tracking is live. Run `/n2b:s2-define` to continue, or `/n2b:status` to check progress.
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
