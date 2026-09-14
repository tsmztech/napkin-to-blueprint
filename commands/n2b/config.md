---
name: n2b:config
description: Show or change pipeline settings after Stage 1 — model profile, provider, per-tier model IDs, spec review mode, design-system source — without re-running intake
argument-hint: "[--show | --profile <quality|balanced|budget|inherit> | --provider <name> | --set <tier>=<model-id> | --spec-review <independent|self-only> | --design-system <none|user>]"
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<objective>
Read and rewrite `.n2b/config.json` — the pipeline settings Stage 1 collected at Step 6.5 — at any point after Stage 1, without touching tracking files or re-running intake.

**Flags** (combine freely; no flags = interactive, the same questions as Stage 1 Step 6.5):
- `--show` — print the current settings and the model every agent role would get right now
- `--profile <p>` — `quality` | `balanced` | `budget` | `inherit`
- `--provider <name>` — a provider preset from the model catalog (`claude-aliases`, `anthropic`, `openai`, `generic`) or `inherit`
- `--set <tier>=<model-id>` — set one tier's model ID (`frontier`, `heavy`, `standard`, `light`); implies `--provider generic`
- `--spec-review <v>` — `independent` | `self-only`
- `--design-system <v>` — `none` | `user`

**Writes:** `.n2b/config.json` only, always through the catalog materializer — never hand-edited. Takes effect on the next stage command; stages already completed are not re-run.
</objective>

<execution_context>
@./.claude/n2b/workflows/config.md
@./.claude/n2b/references/config-schema.md
@./.claude/n2b/references/model-profiles.md
@./.claude/n2b/references/ui-brand.md
</execution_context>

<process>
Execute the config workflow from @./.claude/n2b/workflows/config.md end-to-end. Programmatic where a flag was given (parse → validate → materialize → show); interactive only for a bare invocation. Never writes tracking files.
</process>
