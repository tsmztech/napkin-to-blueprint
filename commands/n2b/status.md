---
name: n2b:status
description: Read tracking files and display console-only status report with integrity scan, export staleness check, and next-action routing
allowed-tools:
  - Read
  - Bash
  - Write
---
<objective>
Read tracking files (PIPELINE.md, STATE.md, MANIFEST.md, active STAGE.md), run an integrity scan comparing tracking state to disk artifacts — covering Stages 1–4 and Stage 5 exports — and render a console-only status report with next-action routing.

No output file is written — the report is displayed directly in the conversation. The Write tool is only used if drift repair is confirmed by the user.
</objective>

<execution_context>
@./.claude/n2b/workflows/status.md
@./.claude/n2b/references/ui-brand.md
@./.claude/n2b/references/tracking-protocol.md
@./.claude/n2b/references/pipeline-gatekeeper.md
</execution_context>

<process>
Execute the status workflow from @./.claude/n2b/workflows/status.md end-to-end. This workflow reads tracking files and renders a console-only report. It may prompt for confirmation if drift repair is needed. No output file is written.
</process>
