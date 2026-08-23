<ui_brand>

# n2b Visual Patterns

## Pipeline Vocabulary

Three terms describe every sub-process in Stages 2–5:

| Term | Definition |
|------|-----------|
| **Pre-flight** | Entry validation — checks previous stage's output before starting. One per stage. |
| **Pass** | A unit of agent work — one agent or many in parallel. Named with letters (A, B, C …) within each stage. |
| **Gate** | Validation checkpoint — inspects pass output, can halt or retry. Named with letters matching the preceding pass(es) it validates. |

Stage 1 is conversational (human in the loop) and uses its own banner set instead.

Every automated stage follows this pattern:
```
PRE-FLIGHT → PASS A → GATE A → PASS B → GATE B → … → COMPLETE
```

Not every pass requires its own gate. A gate may follow a group of passes (see Stage 3). Stage 5 keeps the Pre-flight / Pass / Gate discipline but names its steps for the export flow (see its pipeline map below).

## Stage Pipeline Maps

**Stage 2 — Define**
```
PRE-FLIGHT → PASS A → GATE A → PASS B → GATE B → COMPLETE
```
| Step | Type | Agents |
|------|------|--------|
| Pass A | Parallel | Visionary ∥ Researcher |
| Gate A | Validation | 7 drafts exist + frontmatter |
| Pass B | Sequential | Synthesizer |
| Gate B | Validation | 6 finals + research persists |

**Stage 3 — Specify** (pass-scoped batching: every invocation runs ONE pass for up to `batch_size` features and ends at a CHECKPOINT — pass boundaries always stop; only the terminal invocation, Pass D + Gate A, runs checkpoint-free; resumed via `--continue`)
```
PRE-FLIGHT → [PASS A →CHECKPOINT]* → [PASS B →CHECKPOINT]* → [PASS C →CHECKPOINT]* → PASS D → GATE A → COMPLETE
```
| Step | Type | Agents |
|------|------|--------|
| Pass A | Batched | Requirements Architect (per batch; dependency map built once) |
| Pass B | Batched, parallel | Feature Spec Producers (with self-review) |
| Pass C | Batched, parallel | Spec Quality Reviewers (per feature; never runs when `spec_review: self-only`) |
| Pass D | Sequential | Reconciler (with gap routing) — terminal invocation |
| Gate A | Validation | 6-category structural check (Cat 5 = design-system passthrough, conditional; Cat 6 = platform-parameters registry, C-36) |

**Stage 4 — Architect**
```
PRE-FLIGHT → PASS A → GATE A → PASS B → GATE B → PASS C → PASS D → PASS E → GATE 4 → COMPLETE
```
| Step | Type | Agents |
|------|------|--------|
| Pass A | Sequential | Profile Analyst |
| Gate A | Validation | Metric cross-check |
| Pass B | Sequential | Technical Researcher |
| Gate B | Validation | Landscape structural check |
| Pass C | Sequential | Feasibility Planner |
| Pass D | Sequential | Technical Architect |
| Pass E | Sequential | Schema Designer |
| Gate 4 | Validation | 8-category architecture check |

**Stage 5 — Export (optional, repeatable)**
```
PRE-FLIGHT → TARGET SELECTION → RENDER PASS(ES) → EXPORT GATE → COMPLETE
```
| Step | Type | Agents |
|------|------|--------|
| Pre-flight | Validation | Blueprint package present + manifest readable |
| Target selection | Routing | Export target resolved (command argument or user choice) |
| Package indexing | Workflow step | No agent — the workflow re-hashes the MANIFEST.md inventory itself (C-04: MANIFEST is workflow-written) |
| Render pass(es) | Sequential | Backlog Builder (conditional — only when the target's registry row sets `Needs backlog.json: yes`) → Export Formatter |
| Export gate | Validation | Export Fidelity Checker — rendered output matches the package |

Stage 5 banners come from the Handoff & Export set below plus the universal set.

## Banner Format

All banners use this exact format — 40 `━` characters, `n2b >` prefix:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > {BANNER NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Banner Names

### Stage 1 — Init (conversational, own vocabulary)

| Banner | When |
|--------|------|
| `QUESTIONING` | Before Round 1 opens |
| `HERE'S WHAT I GOT` | Before narrative show-back |
| `PIPELINE SETTINGS` | Before preference collection |
| `BRIEF CREATED` | After BRIEF.md is written |

### Universal — Stages 2, 3, 4, 5

| Banner | When |
|--------|------|
| `PRE-FLIGHT` | Entry validation starts |
| `PRE-FLIGHT FAILED` | Entry validation failed — halt |
| `PASS {letter}` | Pass starts (e.g., `PASS A`, `PASS B`) |
| `GATE {letter} PASSED` | Gate validation succeeded (e.g., `GATE A PASSED`) |
| `GATE {letter} FAILED` | Gate validation failed — retry or halt |
| `COMPLETE` | Stage finished successfully |
| `PIPELINE FAILED` | Retry exhausted — halted |

### Stage 3 — Batching

| Banner | When |
|--------|------|
| `CHECKPOINT` | A Stage 3 pass batch completes (every Pass A/B/C batch ends here — only the terminal Pass D + Gate A invocation is checkpoint-free); the block shows pass-scoped progress, per-pass remaining workload, and the `/n2b:s3-specify --continue` instruction |

### Handoff & Export — Stage 4 completion, Stage 5

| Banner | When |
|--------|------|
| `PACKAGE READY` | Stage 4 completes — the blueprint package is assembled and export is offered |
| `EXPORT` | An export run starts for a chosen target |
| `EXPORT COMPLETE` | Export gate passed — the rendered package for the target is delivered |
| `EXPORT GATE FAILED` | The fidelity gate exhausted its retry budget for a target — export tracking records the failure; the blueprint and `pipeline_status` are untouched |

### Stage 4 — Terminal Gate

| Banner | When |
|--------|------|
| `GATE 4 PASSED` | Stage 4's terminal 8-category architecture gate succeeded |
| `GATE 4 FAILED` | Stage 4's terminal gate failed — retry or halt |

Gate 4 is the one gate named by number rather than letter — it is the pipeline's terminal gate, and "Gate 4" is its name throughout Stage 4 (see the Stage 4 pipeline map above). It is the sole exception to the no-stage-number rule in Anti-Patterns.

### Status & Gatekeeper — any command

| Banner | When |
|--------|------|
| `STATUS` | `/n2b:status` renders the pipeline status report |
| `BLOCKED` | Gatekeeper hard-blocks a stage re-run — downstream stages have started |
| `{ERROR TYPE}` | A gatekeeper error check fails — the specific error type names the banner (see pipeline-gatekeeper.md, Error Message Format) |

### Banner Examples

**Pass starting:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PASS A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Gate passed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE A PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  7 files verified
```

**Gate failed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > GATE A FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗  Missing: user-persona.md
  ✗  Invalid frontmatter: scope-boundaries.md
  ⚠  Retrying Visionary agent
```

**Stage complete:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  7 documents produced
```

**Brief created (Stage 1):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > BRIEF CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  .n2b/BRIEF.md
  ✓  .n2b/config.json

Your brief is ready. n2b's autonomous pipeline
takes it from here.
```

## Status Symbols

| Symbol | Meaning |
|--------|---------|
| `✓` | Complete / passed |
| `○` | Pending / in progress |
| `✗` | Failed / missing |
| `⚠` | Warning / retry |

## Status Lines

Use within pass and gate banners to show agent or check status:

```
  ○  {Agent} started               ← agent running
  ✓  {Agent} complete              ← agent done
  ✗  {Agent} failed                ← agent failed
  ⚠  {Agent} retrying              ← retry triggered
  ✓  {description}                 ← gate check passed
  ✗  {description}                 ← gate check failed
  ⚠  {count} soft warnings         ← non-blocking issues
```

## Anti-Patterns

- No emoji outside the defined symbols above
- No varying banner widths — always 40 `━` characters
- Always use `n2b >` prefix in banners, never just the stage name
- No decorative borders, boxes, or ASCII art beyond the banner format
- Never invent banner names — only use names defined in this file
- Never prefix pass/gate letters with stage numbers in banners (use `GATE A`, not `GATE 2A`) — the sole exception is Stage 4's terminal gate, which is named `GATE 4` (see Banner Names)

</ui_brand>
