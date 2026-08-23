<purpose>

Gather the user's project vision through open, confidence-based conversation and produce `.n2b/BRIEF.md` — the source of truth for n2b's fully autonomous pipeline.

This is a direct conversation with the user. No subagents. No auto-advance. You are a thinking partner helping them articulate the product they want brought to life.

</purpose>

<required_reading>

The invoking command's `execution_context` has loaded these files into your context:
- `questioning.md` — how to question effectively, the 9-dimension clarity check, coverage states, safety valve, and anti-patterns
- `ui-brand.md` — visual patterns (banners, symbols)
- `brief.md` — template and section guidelines
- `pipeline.md` — PIPELINE.md template (tracking)
- `state.md` — STATE.md template (tracking)
- `stage-simple.md` — stage tracker template (tracking)
- `stage-s3-dashboard.md` — Stage 3 tracker template (tracking)
- `tracking-protocol.md` — stage-complete and other transition reference

Additionally, Step 0 reads `n2b/references/pipeline-gatekeeper.md` directly — the entry gate (Check 1–3 flow, error formats, stage registry).

These are your operating references throughout this workflow.

</required_reading>

<process>

## Step 0 — Entry Gate

Read `n2b/references/pipeline-gatekeeper.md` and execute Check 1, Check 2, and Check 3 for **Stage 1** as defined in that reference.

**Check 1 — Pipeline Exists:**

```bash
[ -f .n2b/tracking/PIPELINE.md ] && echo "EXISTS" || echo "MISSING"
```

- If MISSING: Stage 1 is special -- a missing PIPELINE.md means fresh run. Proceed (S1 creates the pipeline).
- If EXISTS: continue to Check 2.

**Check 2 — Sequence & Status:**

Read the three tracking fields from PIPELINE.md:

```bash
ACTIVE=$(awk '/^---/{n++; next} n==1 && /^active_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
PIPELINE_STATUS=$(awk '/^---/{n++; next} n==1 && /^pipeline_status:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
LAST_COMPLETED=$(awk '/^---/{n++; next} n==1 && /^last_completed_stage:/{print $2; exit} n==2{exit}' .n2b/tracking/PIPELINE.md)
[ "$LAST_COMPLETED" = "null" ] && LAST_COMPLETED=0
echo "ACTIVE=$ACTIVE PIPELINE_STATUS=$PIPELINE_STATUS LAST_COMPLETED=$LAST_COMPLETED"
```

Follow the gatekeeper's Check 2 decision tree:
- `PIPELINE_STATUS == "blueprint-complete"` -> the blueprint is done; a Stage 1 request is a re-run of a completed stage -> proceed to Check 3 (completed exports are marked stale on confirmation — never a block)
- `PIPELINE_STATUS == "failed"` -> if requested stage (1) == LAST_COMPLETED + 1, re-run of failed stage, PASS; else HALT with E4
- `ACTIVE > 0` and requested (1) == ACTIVE -> resume scenario, proceed to Check 3
- `ACTIVE > 0` and requested (1) != ACTIVE -> HALT with E5
- `ACTIVE == 0` and requested (1) == LAST_COMPLETED + 1 -> fresh run, PASS
- `ACTIVE == 0` and requested (1) <= LAST_COMPLETED -> re-run scenario, proceed to Check 3
- `ACTIVE == 0` and requested (1) > LAST_COMPLETED + 1 -> HALT with E3

**Check 3 — Re-run Guard** (only runs on re-run/resume from Check 2):

Read Stage 1 tracker status:

```bash
TARGET_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' .n2b/tracking/stages/s1-init/STAGE.md 2>/dev/null || echo "not-started")
echo "TARGET_STATUS=$TARGET_STATUS"
```

- `not-started`: fresh run (was reset). PASS.
- `in-progress`: resume scenario. Stage 1 does not support partial resume — treat as fresh run (per the gatekeeper, Stages 1, 2, 4 restart). PASS.
- `complete`: re-run of completed stage. Two checks run in order:

**(a) Downstream hard-block check** — blueprint stages only (per the gatekeeper's Per-Stage Downstream Check List, Stage 1 checks s2, s3, s4 — exports never trigger a block):

```bash
for DOWNSTREAM in .n2b/tracking/stages/s2-define/STAGE.md .n2b/tracking/stages/s3-specify/STAGE.md .n2b/tracking/stages/s4-architect/STAGE.md; do
    DS_STATUS=$(awk '/^---/{n++; next} n==1 && /^status:/{print $2; exit} n==2{exit}' "$DOWNSTREAM" 2>/dev/null || echo "not-started")
    echo "$DOWNSTREAM: $DS_STATUS"
    if [ "$DS_STATUS" != "not-started" ]; then
        echo "HARD_BLOCK=true"
    fi
done
```

**(b) Export staleness check — never a block:**

```bash
EXPORT_COUNT=$(awk '/^## Export History/{f=1; next} f && /^## /{exit} f && /^\|/ && $0 !~ /^\| #/ && $0 !~ /^\|-/{n++} END{print n+0}' .n2b/tracking/PIPELINE.md)
echo "EXPORT_COUNT=$EXPORT_COUNT"
```

Completed exports are downstream *consumers* of the blueprint, not downstream *work on* the blueprint. They never trigger E8 and are never deleted by an upstream re-run — they are marked stale instead.

  - **Hard block** (any downstream blueprint stage not `not-started`): display E8 error banner from the gatekeeper and HALT.
  - **Soft block** (all downstream blueprint stages `not-started`): prompt the user per the gatekeeper's soft block template for Stage 1:

```
Stage 1 is already complete (finished {completed timestamp from s1-init/STAGE.md}).

Re-running will:
- Delete all Stage 1 output from .n2b/ (BRIEF.md, config.json)
- Reset Stage 1 tracking to not-started
- Mark {EXPORT_COUNT} completed export(s) STALE — exports are never deleted;
  refresh them with /n2b:s5-export once the blueprint is complete again

Are you sure? (yes/no)
```

  (Include the third bullet only when `EXPORT_COUNT > 0`.)

  On user confirms: execute cleanup per the gatekeeper's Per-Stage Re-run Cleanup table for Stage 1:
  - Delete `.n2b/BRIEF.md` and `.n2b/config.json`
  - Reset `s1-init/STAGE.md` frontmatter: `status: not-started`, `started: null`, `completed: null`, clear all checkboxes
  - Update PIPELINE.md: `last_completed_stage` -> `null`
  - When `EXPORT_COUNT > 0`: flip every `## Export History` row's Status to `stale` (rows are never deleted — the table is the append-only audit trail) and mirror the stale marking on the affected target rows in the s5-export dashboard. Delete nothing under `.n2b/exports/` and leave per-target receipts untouched.
  - Then PASS -- proceed to Step 1.

  On user declines: HALT.

All gatekeeper error banners (E3, E4, E5, E8, E9, E10) use the branded format from `pipeline-gatekeeper.md`:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > {ERROR TYPE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{Specific message}

{Recovery}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

On PASS: proceed to Step 1.

---

## Step 1 — Setup

Check if a BRIEF.md already exists:

```bash
test -f .n2b/BRIEF.md && echo "EXISTS" || echo "MISSING"
```

**If EXISTS**, use AskUserQuestion:
- header: "Existing"
- question: "A BRIEF.md already exists. What would you like to do?"
- options:
  - "Start fresh" — Archive the existing one and begin new questioning
  - "View it" — Show the current brief, then decide
  - "Cancel" — Exit without changes

Handle each:
- **Start fresh** → `mv .n2b/BRIEF.md .n2b/BRIEF.md.bak` then continue
- **View it** → Read and display `.n2b/BRIEF.md`, then re-ask with "Start fresh" / "Cancel"
- **Cancel** → Exit with a short message, no banner

**If it doesn't exist**, continue silently.

Ensure the output directory exists:

```bash
mkdir -p .n2b
```

---

## Step 1.5 — Tracking Setup

**Only runs on fresh runs. Skipped on resume (re-run guard redirected to Step 2).**

Create the full `.n2b/tracking/` directory structure and initialize all tracking files.

**Timestamp rule:** Every `{current ISO timestamp}` or `{ISO timestamp}` placeholder in this workflow must use the actual wall-clock time. Capture it via Bash:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Run this command each time you need a fresh timestamp. Do NOT hardcode midnight (`T00:00:00Z`) or any other static value.

**1. Create directories:**

```bash
mkdir -p .n2b/tracking/stages/s1-init .n2b/tracking/stages/s2-define .n2b/tracking/stages/s3-specify .n2b/tracking/stages/s4-architect
```

**2. Create `.n2b/tracking/PIPELINE.md`**

Read the `pipeline.md` template (loaded in your context) and write `.n2b/tracking/PIPELINE.md` with these values:

```yaml
---
pipeline_status: running
active_stage: 1
last_completed_stage: null
last_gate_result: null
project_name: null
started_at: {current ISO timestamp}
last_updated: {current ISO timestamp}
---

# n2b Pipeline

- [ ] Stage 1: Intake ← ACTIVE
- [ ] Stage 2: Define Features
- [ ] Stage 3: Create Specifications
- [ ] Stage 4: Technical Architecture
- [ ] Stage 5: Export

## Stage History

### Stage 1: not started

### Stage 2: not started

### Stage 3: not started

### Stage 4: not started

### Stage 5: not started

## Artifact Lineage

| Feature | Stage 2 | Stage 3 Specs | Stage 4 Mapping |
|---------|---------|---------------|-----------------|

## Export History

<!-- Append-only. Rows are appended by the export-complete transition; the gatekeeper's re-run confirm marks rows stale; the status workflow reads them for staleness. Never edit or remove rows. Status values: current | stale. -->

| # | Target | Package version | Artifacts | Completed at | Status |
|---|--------|-----------------|-----------|--------------|--------|
```

**CRITICAL:** `active_stage: 1` (not 0). Tracking is live from the first command. The checklist carries all five rows including `- [ ] Stage 5: Export`, and the empty `## Export History` table — both come from the template.

**3. Create `.n2b/tracking/STATE.md`**

Read the `state.md` template (loaded in your context) and write `.n2b/tracking/STATE.md` with these values:

```yaml
---
current_step: q-and-a
stage_status: in-progress
stage_started: {current ISO timestamp}
last_updated: {current ISO timestamp}
---
```

Body:
```
<!-- This file is a whiteboard, not an archive. Keep within 50-80 lines. See tracking-protocol.md stage-complete transition for trim rules. -->

## Current Position

Stage 1 — Intake / Step: Q&A session

## Accumulated Context

(empty at stage start — populated as BRIEF.md is written)

## Session Continuity

Last action: Stage 1 started
Next action: Q&A questioning
Blockers: None
```

**4. Create `.n2b/tracking/stages/s1-init/STAGE.md`**

Read the `stage-simple.md` template (loaded in your context) and write `.n2b/tracking/stages/s1-init/STAGE.md` with these values:

```yaml
---
stage: 1
stage_name: "Intake"
status: in-progress
started: {current ISO timestamp}
completed: null
---
```

**CRITICAL:** `status: in-progress` (not not-started). Stage 1 has no discrete start/agents — it begins the moment the command runs.

Body:
```
This file is a live tracker while status is in-progress. Once status changes to complete, it becomes a permanent receipt — do not modify.

## Steps

- [ ] User Q&A session
- [ ] Show-back presented, user confirmed
- [ ] BRIEF.md written
- [ ] Gate 0 passed

## Gates

### Gate 0 — Brief Validation
- Status: pending
- [ ] BRIEF.md exists with valid frontmatter (5 required fields)
- [ ] All 10 required sections non-empty
- [ ] project_name and domain present
- [ ] Self-audit: roles confirmed or single-role stated
- [ ] Self-audit: constraints question asked once
- [ ] Self-audit: Business Context / Scale & NFR / Ecosystem / Success Criteria each substantive or explicitly unknown + listed in Open Questions
- [ ] Self-audit: no banned vocabulary in the brief

## Performance

| Metric | Value |
|--------|-------|
| Duration | — |
| Agents spawned | 0 (direct conversation) |
| Retries | 0 |

## Deviations

(Captured live during execution. Any deviation from the expected flow is recorded here immediately, not deferred to completion.)

## Output

(Populated on stage completion. Lists all files produced by this stage.)
```

**5, 6, 7. Create pre-trackers for Stages 2, 3, 4 (write in parallel)**

These three files are independent — write them in parallel using concurrent Write tool calls.

**`.n2b/tracking/stages/s2-define/STAGE.md`** — Read the `stage-simple.md` template and write with:

```yaml
---
stage: 2
stage_name: "Define Features"
status: not-started
started: null
completed: null
---
```

Body: use the stage-simple.md template body as-is (placeholder content).

**`.n2b/tracking/stages/s4-architect/STAGE.md`** — Read the `stage-simple.md` template and write with:

```yaml
---
stage: 4
stage_name: "Technical Architecture"
status: not-started
started: null
completed: null
---
```

Body: use the stage-simple.md template body as-is (placeholder content).

**`.n2b/tracking/stages/s3-specify/STAGE.md`** — Read the `stage-s3-dashboard.md` template (loaded in your context) and write using the template as-is — leave all defaults (stage: 3, status: not-started, hardcoded Stage 3 structure).

**No s5-export tracker is created at bootstrap.** The gatekeeper treats a missing STAGE.md as `not-started`, and the export workflow creates its own dashboard (plus per-target trackers) on its first run.

---

## Step 2 — Open Capture

Display the questioning banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > QUESTIONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask inline (freeform text, NOT AskUserQuestion):

> **What do you want to build?**
>
> Tell me everything — the idea, the problem, who it's for, how you imagine it working. Stream of consciousness is fine. If you already have a written brief, notes, or scenarios, paste them (or point me at a file) — I'll work from what you have and only ask about what's missing.

Wait for the user's response. Let them dump their mental model.

**Supplied-document rule:** if the user pastes a document or points at a file path, read it **fully** before asking a single question (use the Read tool for files). A supplied brief is first-class input — treat its contents exactly as if the user had said them in conversation.

Then follow the thread naturally — ask 1-2 freeform follow-ups that dig into what they said:
- Follow their energy — whatever they emphasized, explore that
- Challenge vagueness — "you said X, what does that actually look like?"
- Make abstract concrete — "walk me through using this"
- Clarify ambiguity — "when you say Z, do you mean A or B?"
- Reference specific things they said, not generic questions
- Use AskUserQuestion when presenting concrete options helps the user think
- Use freeform when open exploration is better
- **No round counting. No fixed probing order.**

---

## Step 2.5 — Silent Intake Triage

**One pass, never shown to the user.** Immediately after the first substantive input (and after fully reading any supplied document), silently score all 9 clarity dimensions from `questioning.md` (`<clarity_check>`) — the core four (Product, Problem, Users & Roles, Experience) and the primary five (Business Context, Scale & Environment, Constraints & Compliance, Ecosystem & Integrations, Success Criteria) — with a three-state **coverage tag**, distinct from confidence:

- **given** — the user explicitly answered this. *Rule: never ask about it again; it may only be reflected back in the show-back for confirmation.*
- **implied** — inferable but not stated. *Rule: at most one confirming question, phrased as an interpretation check ("You mentioned pharmacists approving orders — so there are at least two roles, pharmacist and customer?"), ideally via AskUserQuestion with concrete options.*
- **missing** — no signal. *Rule: eligible for real questioning, deepest-first.*

This coverage map is what makes the intake adaptive at both ends of the input spectrum:
- A scenario-rich brief arrives mostly **given** → the conversation collapses to a handful of confirming questions and an early show-back.
- A few real sentences arrive mostly **missing** → the conversation goes long and deep — still thread-following, never checklist-walking.

Maintain the coverage map silently for the rest of the conversation: as answers arrive, dimensions move from `missing`/`implied` to `given`. The triage itself runs once; the map lives on.

**Never re-ask the given.** Asking for information the user already provided is the fastest way to lose their trust — the coverage map exists so you never do this.

---

## Step 3 — Internal Clarity Check

After each meaningful exchange, run the clarity check described in `questioning.md` (`<clarity_check>` section) across all 9 dimensions. This is a silent internal assessment — never shown to the user.

**Transition rules:**
- **Core four (Product, Problem, Users & Roles, Experience) all high AND no primary dimension low AND the constraints question has been asked** → move to Step 4 (Show-back). Primary dimensions still at medium are acceptable — record each as an Open Questions entry and surface it in the show-back's "Still open" tail.
- **Core four high but any primary dimension still low** → keep conversing; weave a question for that dimension into the thread naturally.
- **3+ core high, remaining medium** → keep conversing but consider suggesting show-back soon.
- **Any core dimension low** → keep conversing, weave questions about low-clarity areas into the thread naturally.

Questioning is always governed by the coverage map from Step 2.5: `given` is never re-asked, `implied` gets at most one interpretation check, `missing` gets real questioning — deepest (most consequential) first.

### The Constraints Question — asked once, never interrogated

When the core four approach high and the constraints question has not yet been asked, ask it once, openly:

> "Before I play this back — any hard boundaries I should know about? Timeline, budget, regulations, existing systems it must work with, technology commitments, brand rules — anything non-negotiable?"

- Follow-ups only to clarify what the user raises — never to fish for more.
- "None" is accepted immediately and recorded in the brief as "None identified (asked)".
- Recording stays volunteer-only: capture what the user says, typed with rationale. Never add constraints you inferred — if the user didn't say it, don't assume it.

### Safety Valve

Follow the safety valve rules from `questioning.md` (`<safety_valve>` section). The valve keys on **progress on `missing` dimensions, not raw exchange count**: if successive exchanges are no longer converting `missing` dimensions into `given` or `implied`, suggest presenting what you have. Never force-end — the 4-way fork (Step 5) IS the safety net.

### Production-Embracing Capture

Follow the capture rules from `questioning.md` (`<anti_patterns>` section) for preferences the user volunteers:

- **Deployment / infrastructure / hosting preferences** are first-class constraints. Capture them in Constraints (and the surrounding context in Ecosystem & Integrations). One clarifying follow-up is allowed: "Is {X} a hard requirement or a preference?" Respond in the direction of: "Noted — the architecture stage will design for that and document alternatives." Never state or imply that the product will run only on a local machine.
- **Design / brand mentions trigger the design-system intake.** If the user mentions brand, colors, typography, or an existing design system, ask once whether they have artifacts (files, a URL, design tokens):
  - Files supplied → create the intake directory and place them there:
    ```bash
    mkdir -p .n2b/inputs/design-system
    ```
    Copy the supplied files into `.n2b/inputs/design-system/` (accepted formats: Markdown, design-token JSON, PDF).
  - URL or other pointer supplied → write a `SOURCES.md` note in `.n2b/inputs/design-system/` recording the pointer and what it covers.
  - Remember this for Step 6 (conditional `## Design System` brief section) and Step 6.5 (`design_system_source: "user"`).
  - No artifacts → n2b does not generate a design system: the blueprint ships design-agnostic, and the downstream builder makes the visual design choices. Capture the stated preference in Constraints so the blueprint carries it (the builder respects it from there), and follow up on it like any other constraint if clarification helps.

---

## Step 4 — Show-back

Generate a project name from the conversation — short, memorable, a working title (not a brand name). Examples: "Asset Shepherd", "Pantry Planner", "Route Scout".

Display the show-back banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > HERE'S WHAT I GOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Present the show-back as a **narrative write-up** inline (NOT AskUserQuestion). NOT structured with section headers matching the BRIEF.md template.

Use this format:

```
**[Project Name]**

[2-3 paragraphs that demonstrate genuine understanding.
Covers: what the product is and why it matters, the problem and who experiences it,
who would use it first (concrete person), what the experience would feel like.
Weaves in constraints if mentioned. Notes open questions honestly.]

**Still open:** [Short honest block naming what you don't yet know — the primary
dimensions still at medium, anything asked-and-unknown. Maps 1:1 onto the brief's
Open Questions section. Invite the user to close the gaps now or leave them for
the research stage.]
```

**Good show-back (narrative):**

> You want to build a tool that helps indie game developers manage their asset pipelines. Right now, most solo devs dump textures, models, and audio into folder hierarchies that become unmanageable past ~500 assets. They lose track of what's used where, duplicate files pile up, and switching between projects means starting organization from scratch.
>
> Your first users would be solo devs or tiny teams (2-3 people) working on mid-scope games — think game jam graduates trying to ship their first real title. They'd reach for this tool when their project hits the point where manual organization breaks down.
>
> The experience would be: you point it at your project folder, it scans and categorizes everything automatically, then gives you a clean dashboard to browse, search, and reorganize. The key moment is seeing your messy folder structure suddenly make sense — like a librarian organized your bookshelf while you were sleeping.

**Bad show-back (template-feeling):**

> **Vision:** A tool for game asset management.
> **Problem:** Developers have trouble organizing files.
> **Users:** Game developers.
> **Experience:** You open the app and see your assets organized.

**Example "Still open" tail:**

> **Still open:** I don't yet know how you'd measure success, or whether there are compliance requirements around the health data. I've noted these as open questions for the research stage — or tell me now.

This is a compressed preview — the full BRIEF.md will have more detail. The show-back exists for human validation — it should demonstrate genuine understanding, not just show that words were slotted into the right categories. The "Still open" tail surfaces the gap list *before* the fork, so the user can close gaps in Path B instead of discovering them later as downstream guesses.

---

## Step 5 — Four-Way Fork

Immediately after the show-back, use AskUserQuestion:
- header: "Next"
- question: "How would you like to proceed?"
- options:
  - "Looks good — take it from here"
  - "Close, but I want to add more"
  - "Not quite — let me correct"
  - "Let's outline key features too"

---

### Path A — Corrections ("Not quite — let me correct")

The LLM got something wrong. The user needs to fix the understanding.

1. Ask freeform: "What did I get wrong?"
2. User explains what's incorrect
3. LLM adjusts through conversation — may ask clarifying questions to get it right
4. Re-present show-back (updated narrative) [go to Step 4]
5. Back to 4-way fork [go to Step 5]
6. **No max correction rounds** — user drives the loop. If the LLM keeps getting it wrong, the problem is the conversation, not a counter.

---

### Path B — Add More ("Close, but I want to add more")

The LLM is on the right track but the user has more context to share.

1. Ask freeform: "What else should I know?"
2. User adds context (new information, nuances, edge cases)
3. LLM integrates — may ask follow-up questions to fully absorb
4. Re-present show-back (enriched narrative) [go to Step 4]
5. Back to 4-way fork [go to Step 5]
6. **No max rounds** — user drives.

---

### Path C — Hand Off ("Looks good — take it from here")

The LLM captured the vision. User is satisfied.

1. **Step tracking (step-complete transition):**
   - Tick `- [x] User Q&A session` in `.n2b/tracking/stages/s1-init/STAGE.md`
   - Tick `- [x] Show-back presented, user confirmed` in `.n2b/tracking/stages/s1-init/STAGE.md`
   - Update `.n2b/tracking/STATE.md` frontmatter: `current_step: write-brief`, `last_updated: {ISO timestamp}`
   - Update `.n2b/tracking/STATE.md` body Session Continuity: Last action "Show-back confirmed by user", Next action "Write BRIEF.md"

2. Proceed to Step 6 (Write BRIEF.md).

---

### Path D — Feature Discussion ("Let's outline key features too")

The user wants to go one level deeper and define high-level features before handing off.

1. LLM proposes an initial feature set (3-8 features) derived from the conversation. Each feature: **name** — 1-2 sentence description at capability level, not spec level.

   **Feature granularity guidance:**
   - Right level: "Asset scanning — Automatically detect and categorize files by type when pointed at a project folder"
   - Too deep (spec level): "Asset scanning with recursive folder traversal, MIME type detection, 15 supported formats, progress bar..."
   - Too shallow (vague): "File management"

2. Present as a numbered list.

3. Ask freeform: "Here's what I think the key features are. What would you add, remove, or change?"

4. Iterate until user is satisfied (usually 1-2 rounds).

5. Present updated show-back with features appended:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > HERE'S WHAT I GOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]**

[Updated narrative paragraphs]

**Key Features:**
- **[Feature 1]** — [1-2 sentence description]
- **[Feature 2]** — [1-2 sentence description]
...

**Still open:** [coverage tail — same rules as Step 4]
```

6. **3-way fork** (NOT 4-way — no "dig deeper" again — already went one level deep):
   - header: "Next"
   - question: "How would you like to proceed?"
   - options:
     - "Looks good — take it from here"
     - "Close, but I want to add more"
     - "Not quite — let me correct"

   Each path follows the same pattern as the outer fork:
   - "Not quite" → conversation → updated show-back (with features) → 3-way fork
   - "Close, but I want to add more" → conversation → enriched show-back (with features) → 3-way fork
   - "Looks good" → step tracking (same as Path C step 1 above), then Step 6 (with Feature Direction section in BRIEF.md)

7. **Anti-patterns for feature discussion:**
   - Don't drill into specs — that's Stage 3
   - Don't ask about priority — that's Stage 2
   - Don't ask about tech implementation
   - Don't propose features the user didn't hint at
   - Don't force exactly N features — if 3 captures it, 3 is fine

---

## Step 6 — Write BRIEF.md

1. Ensure the output directory exists:

```bash
mkdir -p .n2b
```

2. Populate the brief.md template (loaded in your context) with the conversation content.

3. Write YAML frontmatter with exactly 5 fields:

```yaml
---
project_name: [generated name]
domain: [problem space, not solution]
created: [YYYY-MM-DD]
status: draft
n2b_version: 0.1.0
---
```

The frontmatter has exactly these 5 fields — no others. Hosting and deployment intent, when the user has any, is body content: it lands in Ecosystem & Integrations and/or Constraints, not in frontmatter.

4. Derive the domain from the problem space (not the solution). For example: "meal planning" not "recipe app", "game asset management" not "file scanner".

5. Fill all 10 required sections, in this order, with conversation-derived content:

   1. Vision
   2. Problem Statement
   3. Target Users & Roles
   4. The Experience
   5. Business Context
   6. Scale & Non-Functional Expectations
   7. Ecosystem & Integrations
   8. Success Criteria
   9. Constraints
   10. Open Questions

   - **Asked-and-unknown is valid content**: in Business Context, Scale & Non-Functional Expectations, Ecosystem & Integrations, and Success Criteria, a one-line entry "Unknown — flagged as open question" is legal — but only when the topic was actually raised and the user didn't know. Every such entry gets a matching Open Questions item. The brief's job is to distinguish *asked-and-unknown* (downstream research can attack it) from *never-asked* (silently becomes wrong guesses).
   - **Constraints** records volunteered items only (typed, with rationale), plus "None identified (asked)" when the asked-once question drew a blank.

6. Follow the section guidelines from the template file.

7. **Conditional Feature Direction section:**
   - **If Path D was taken:** Add a Feature Direction section after Open Questions with the agreed-upon features. Each feature: `**[Feature Name]**: [1-2 sentence description]`. End with the italicized note: *Starting points for Stage 2 (Feature Discovery) — not final. Stage 2 will validate, expand, reprioritize, and may add features the user didn't think of.*
   - **If Path D was NOT taken:** Do NOT include a Feature Direction section. Omit it entirely — do not add an empty section.

8. **Conditional Design System section:**
   - **If the user supplied design-system artifacts** (ingested into `.n2b/inputs/design-system/` during Step 3): Add a Design System section after Open Questions (after Feature Direction if both are present) with a pointer to `.n2b/inputs/design-system/` and a short summary of what was provided (files, tokens, URL note). Stage 3 adopts it as the source of truth for the design layer.
   - **If not:** Omit the section entirely — do not add an empty section.

9. Write the file using the Write tool to `.n2b/BRIEF.md`.

10. **Step tracking after writing BRIEF.md:**
   - Tick `- [x] BRIEF.md written` in `.n2b/tracking/stages/s1-init/STAGE.md`
   - Update `.n2b/tracking/STATE.md` frontmatter: `current_step: gate-0`, `last_updated: {ISO timestamp}`
   - Update `.n2b/tracking/STATE.md` body Session Continuity: Last action "BRIEF.md written", Next action "Gate 0 validation"
   - **Update PIPELINE.md `project_name`**: read `project_name` from `.n2b/BRIEF.md` frontmatter and write it to `.n2b/tracking/PIPELINE.md` `project_name` field, and set `last_updated: {ISO timestamp}`

---

## Step 6.5 — Pipeline Settings

Display the PIPELINE SETTINGS banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > PIPELINE SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your brief is ready. Before n2b takes over,
one quick preference for the pipeline.
```

**Question — Model profile.** Use AskUserQuestion:
- header: "Models"
- question: "Which AI models should n2b's agents use?"
- options:
  - "Balanced — smart planning, fast execution (Recommended)"
  - "Quality — best models everywhere, higher cost"
  - "Budget — fastest and cheapest"
- Maps to model_profile: "balanced", "quality", or "budget"

This is the only question. Two further fields are written without asking:
- `spec_review`: always `"independent"` — Stage 3 runs the independent spec quality review by default.
- `design_system_source`: `"user"` if design-system artifacts were ingested into `.n2b/inputs/design-system/` during the conversation, else `"none"` (Stage 3 carries supplied artifacts into the package verbatim; it never generates a design system).

The pipeline runs manual-only: every stage ends paused and the user triggers the next stage command themselves. There is no auto-pilot mode and no `pipeline_mode` field.

**Default:** model_profile="balanced" — applied if user skips the question.

Write `.n2b/config.json` using the Write tool:

```json
{
  "model_profile": "[resolved value]",
  "spec_review": "independent",
  "design_system_source": "[user or none — resolved as above]",
  "created": "[today's date YYYY-MM-DD]",
  "n2b_version": "0.1.0"
}
```

The runtime config contains exactly these five registered fields — no more, no fewer (see `config-schema.md`).

**CRITICAL: config.json is ALWAYS written.** Never skip the write even if user cancels. Never fail Stage 1 over config. If anything goes wrong during preference collection, write defaults and move on.

---

## Step 6.7 — Gate 0 — Brief Validation

Run Gate 0 validation before marking Stage 1 complete.

**1. Set STATE.md to gate-check (gate-check transition):**
- Update `.n2b/tracking/STATE.md` frontmatter: `stage_status: gate-check`, `last_updated: {ISO timestamp}`
- Update `.n2b/tracking/STATE.md` body Session Continuity: Last action "Gate 0 validation running", Next action "Awaiting gate result"

**2. Run Gate 0 checks programmatically:**

Use Bash commands to verify each criterion — do NOT rely on memory or LLM assertion alone.

**Check 1 — File exists:**
```bash
test -f .n2b/BRIEF.md && echo "GATE0-FILE: PASS" || echo "GATE0-FILE: FAIL"
```

**Check 2 — Frontmatter has exactly 5 required fields:**
```bash
# Extract frontmatter and check for all 5 fields
sed -n '/^---$/,/^---$/p' .n2b/BRIEF.md | grep -c '^\(project_name\|domain\|created\|status\|n2b_version\):' | xargs -I{} sh -c 'if [ {} -eq 5 ]; then echo "GATE0-FRONTMATTER: PASS (5/5 fields)"; else echo "GATE0-FRONTMATTER: FAIL ({}/5 fields)"; fi'
```

**Check 3 — All 10 required sections are non-empty:**
```bash
# For each required section, check that content exists between it and the next ## heading
for section in "Vision" "Problem Statement" "Target Users & Roles" "The Experience" "Business Context" "Scale & Non-Functional Expectations" "Ecosystem & Integrations" "Success Criteria" "Constraints" "Open Questions"; do
  content=$(sed -n "/^## ${section}/,/^## /p" .n2b/BRIEF.md | grep -v "^## " | grep -v "^$" | head -1)
  if [ -n "$content" ]; then echo "GATE0-SECTION [${section}]: PASS"; else echo "GATE0-SECTION [${section}]: FAIL (empty)"; fi
done
```

**Check 4 — project_name and domain are non-empty:**
```bash
pn=$(sed -n '/^---$/,/^---$/p' .n2b/BRIEF.md | grep '^project_name:' | sed 's/^project_name: *//' | sed 's/^ *//;s/ *$//')
dm=$(sed -n '/^---$/,/^---$/p' .n2b/BRIEF.md | grep '^domain:' | sed 's/^domain: *//' | sed 's/^ *//;s/ *$//')
if [ -n "$pn" ] && [ "$pn" != "null" ]; then echo "GATE0-PROJECT_NAME: PASS ($pn)"; else echo "GATE0-PROJECT_NAME: FAIL"; fi
if [ -n "$dm" ] && [ "$dm" != "null" ]; then echo "GATE0-DOMAIN: PASS ($dm)"; else echo "GATE0-DOMAIN: FAIL"; fi
```

**Check 5 — Substance self-audit (LLM checklist, recorded as evidence):**

Answer each item against the brief you just wrote. Every item must hold; record each with one line of specific evidence in the tracker's Gates section:

- **Roles:** every actor type in Target Users & Roles came from the conversation; if the product is single-role, the brief states that this was confirmed with the user — not assumed.
- **Constraints question asked:** the asked-once constraints question was asked; Constraints holds volunteered items only, or "None identified (asked)".
- **Substantive or flagged:** each of Business Context, Scale & Non-Functional Expectations, Ecosystem & Integrations, and Success Criteria is either substantive OR explicitly marked unknown and listed in Open Questions.
- **Vocabulary:** the brief describes the real product headed for real users — it nowhere frames the deliverable as a throwaway demo, a scoped-down trial, or a laptop-bound exercise.

All checks must print/record PASS. If any fails, gate fails.

**3. Record gate results in `.n2b/tracking/stages/s1-init/STAGE.md` Gates section:**

Update the Gates section to reflect what you found:
- For each criterion that passed: change `- [ ]` to `- [x]` and append its evidence inline (counts, field values, or the self-audit evidence line)
- For each criterion that failed: leave as `- [ ]` with the failure reason
- Set the Status line to `Result: **passed**` or `Result: **failed**`

**4. On gate pass — execute stage-complete transition (4 steps from tracking-protocol.md):**

**Step 0.5 — Promote BRIEF.md status:**
- Update `.n2b/BRIEF.md` frontmatter: change `status: draft` to `status: active`
- The brief was a draft during writing; it becomes active once validated by Gate 0.

**Step 1 — Finalize s1-init/STAGE.md (permanent receipt):**
- Frontmatter: `status: complete`, `completed: {ISO timestamp}`
- Tick `- [x] Gate 0 passed` checkbox
- Fill Performance section:
  - Duration: calculated from `started` to now (in minutes)
  - Agents spawned: 0 (direct conversation)
  - Retries: 0
- Fill Output section:
  ```
  - .n2b/BRIEF.md (10 sections{, + Feature Direction / Design System when present})
  - .n2b/config.json (model_profile, spec_review, design_system_source)
  {- .n2b/inputs/design-system/ (user-supplied design artifacts) — only when provided}
  ```

After writing, s1-init/STAGE.md is a **permanent receipt** — it carries the Gate 0 self-audit evidence. Do not modify it again.

**Step 2 — Update PIPELINE.md, then MANIFEST.md:**
- PIPELINE.md frontmatter updates:
  - `active_stage: 0` (between stages)
  - `last_completed_stage: 1`
  - `last_gate_result: stage-1-gate-0-passed`
  - `pipeline_status: paused`
  - `last_updated: {ISO timestamp}`
- PIPELINE.md body updates:
  - Stage 1 checklist line: change `- [ ] Stage 1: Intake ← ACTIVE` to `- [x] Stage 1: Intake — Completed {YYYY-MM-DD} | BRIEF.md produced`
  - Stage 2 checklist line: add `← NEXT` marker: `- [ ] Stage 2: Define Features ← NEXT`
  - Stage History — replace `### Stage 1: not started` with:
    ```
    ### Stage 1: Intake
    - Completed: {ISO timestamp}
    - Gate: passed — Gate 0 Brief Validation
    - Output: .n2b/BRIEF.md
    - Performance: 0 agents, {duration} min, 0 retries
    - Detail: → .n2b/tracking/stages/s1-init/STAGE.md
    ```
- Then write **`.n2b/tracking/MANIFEST.md`** — the canonical-package manifest (see tracking-protocol.md, stage-complete Step 2). Compute the fingerprint first:

  ```bash
  shasum -a 256 .n2b/BRIEF.md | cut -c1-12
  ```

  - **If MANIFEST.md does not exist** (normal case — Stage 1 is the first completion), create it with this exact format:

    ```
    ---
    package_version: 1            # integer; +1 whenever any inventory row is added/changed
    project_name: "{PROJECT_NAME}"
    last_updated: {ISO-8601}
    ---

    # Blueprint Package Manifest

    ## Package Inventory

    | Artifact | Stage | ID coverage | Fingerprint | Updated |
    |---|---|---|---|---|
    | BRIEF.md | 1 | — | {first 12 hex of shasum -a 256} | {ISO timestamp} |
    ```

  - **If MANIFEST.md already exists** (Stage 1 re-run after a confirmed reset): refresh the BRIEF.md row's Fingerprint and Updated values, increment `package_version` by 1, and refresh `last_updated`.
  - Paths are relative to `.n2b/`. `ID coverage` is `—` — the brief carries no ID ranges. MANIFEST.md is written only by workflows during this transition — never by agents.

**Step 3 — Refresh STATE.md:**
- Frontmatter updates:
  - `stage_status: between-stages`
  - `current_step: none`
  - `last_updated: {ISO timestamp}`
- Body:
  ```
  <!-- This file is a whiteboard, not an archive. Keep within 50-80 lines. See tracking-protocol.md stage-complete transition for trim rules. -->

  ## Current Position

  Between stages. Awaiting next stage command.

  ## Accumulated Context

  - Project: {project_name from BRIEF.md}
  - Brief: .n2b/BRIEF.md (10 sections)
  {- Design system: user-supplied, in .n2b/inputs/design-system/ — only when provided}

  ## Session Continuity

  Last action: Stage 1 Gate 0 passed
  Next action: /n2b:s2-define
  Blockers: None
  ```

**Step 4 — Display standardized stage-complete continuation message** (see Step 7 below).

**5. On gate fail:**

Stage 1 is a direct conversation — gate failure means the workflow re-prompts the user. Display which checks failed:

```
---

Gate 0 — Brief Validation failed.

Failed checks:
- {Category}: {what failed and why}

---

Please provide the missing information and I'll update the brief.
```

Ask the user to provide the missing information. Then loop back:
- Update `.n2b/BRIEF.md` with the corrections
- Re-run Step 6.7 Gate 0 checks
- This is NOT a hard pipeline failure — the conversation continues until gate passes.

---

## Step 7 — Completion

Display the standardized stage-complete continuation message:

```
---

## ✓ Stage 1: Intake Complete

BRIEF.md produced — 10 sections

---

## ▶ Next Up

**Stage 2: Define Features** — decompose vision into prioritized feature set

`/n2b:s2-define`

*(`/clear` first → fresh context window)*

---

**Also available:**
- `/n2b:status` — check pipeline progress

---
```

Do NOT create a git commit.

</process>

<success_criteria>

- `.n2b/BRIEF.md` exists with valid YAML frontmatter (exactly 5 fields: project_name, domain, created, status, n2b_version) and all 10 required sections
- `.n2b/config.json` exists with exactly the five registered fields: model_profile, spec_review, design_system_source, created, n2b_version
- Vision section is specific enough that two people would picture roughly the same product
- Experience section reads like a story, not a spec
- Constraints contains only items the user volunteered, or "None identified (asked)" — and the constraints question was asked exactly once, openly, never as an interrogation
- Open Questions captures every gap from the conversation — including each primary dimension left at medium and every asked-and-unknown entry
- A user who pasted a rich brief was asked only confirming questions — nothing they had already answered was re-asked (coverage map honored)
- A thin opening input produced a deep, thread-following conversation — missing dimensions questioned deepest-first, never checklist-walked
- Show-back was narrative format, not template sections, and ended with a "Still open" coverage tail mapping 1:1 onto Open Questions
- Feature Direction section present only when Path D was taken — omitted otherwise
- Design System section present only when the user supplied artifacts (with a pointer to `.n2b/inputs/design-system/`) — omitted otherwise
- Questioning felt like a conversation, not an interview
- No round cap — conversation ran until clarity or user chose to proceed
- User had 4 choices at the fork: hand off, add more, correct, features
- If an existing BRIEF.md was present, it was handled (archived or cancelled)
- config.json was written regardless of user preference choices
- `.n2b/tracking/PIPELINE.md` exists with `active_stage: 0` and Stage 1 marked complete
- `.n2b/tracking/STATE.md` exists with `stage_status: between-stages` and project name in accumulated context
- `.n2b/tracking/stages/s1-init/STAGE.md` exists with `status: complete` and Gate 0 evidence including the substance self-audit
- `.n2b/tracking/stages/s2-define/STAGE.md`, `s3-specify/STAGE.md`, `s4-architect/STAGE.md` exist with `status: not-started` — and no s5-export tracker was created at bootstrap (the export workflow creates its own dashboard on first run)
- `.n2b/tracking/MANIFEST.md` exists with `package_version` set and a BRIEF.md inventory row whose fingerprint is the first 12 hex chars of `shasum -a 256`
- Gate 0 validated BRIEF.md programmatically before stage completion
- Standardized continuation message displayed (not the old "BRIEF CREATED" banner)

</success_criteria>
