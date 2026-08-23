<template>

Use this exact structure when writing `.n2b/BRIEF.md`. Replace bracketed content with conversation-derived content. Preserve YAML frontmatter exactly.

**Asked-and-unknown is valid content** — this rule applies template-wide. In Business Context, Scale & Non-Functional Expectations, Ecosystem & Integrations, and Success Criteria, a one-line `Unknown — flagged as open question` entry is legal content: it records that the question was asked and the answer doesn't exist yet. The brief's job is to distinguish *asked-and-unknown* from *never-asked* — downstream research can attack the former; the latter silently becomes wrong guesses.

```markdown
---
project_name: [Generated name — short, memorable working title]
domain: [Problem space, not solution — e.g., "meal planning" not "recipe app"]
created: [YYYY-MM-DD]
status: draft
n2b_version: 0.1.0
---

# [Project Name]

## Vision
[2-4 sentences. What this product is and why it matters. North star for all
downstream decisions. Must be specific enough that two people would build
roughly the same thing.]

## Problem Statement
[2-4 sentences. The pain or desire this addresses. Who experiences it, what they
do today, why existing solutions fall short.]

## Target Users & Roles
[One description per role the product genuinely needs. For each role: who they
are, what they can see and do, and when they'd reach for this product. Concrete
enough to imagine a real person. If the product is single-role, state that it
was confirmed in conversation.]

## The Experience
[3-5 sentences. What using this feels like. First encounter, core loop, key
moments. Present tense, second person ("You open the app and see...")]

## Business Context
[2-4 sentences. Why this should exist as a venture: the goal (revenue,
retention, cost savings, mission), how it might make money if commercial, and
why now. Include market or competitive signals the user offered.]

## Scale & Non-Functional Expectations
[Order-of-magnitude usage and data, the devices/platforms it must meet users
on, geographic spread, plus volunteered expectations on performance, privacy,
and availability. Unknowns are allowed but must be written down.]

## Ecosystem & Integrations
[Bullet list of systems, tools, and services the product must live alongside
or talk to — each named with its relationship in functional terms. Or
"Standalone (confirmed)" if the user confirmed there is nothing to connect to.]

## Success Criteria
[2-5 outcome statements in the user's own words. What, one year in, would
prove this worked.]

## Constraints
[Bullet list with type and rationale. Or "None identified (asked)" if the
constraints question drew a blank.]

## Open Questions
[Bullet list of unresolved items that downstream agents should investigate.
Or "None" if the conversation fully covered everything.]

## Feature Direction
[Only include this section if Path D (feature discussion) was taken during questioning.
If the user did not request feature discussion, omit this section entirely.]

- **[Feature Name]**: [1-2 sentence description of the capability]
- **[Feature Name]**: [1-2 sentence description]
...

*Starting points for Stage 2 (Feature Discovery) — not final. Stage 2 will
validate, expand, reprioritize, and may add features the user didn't think of.*

## Design System
[Only include this section if the user supplied design artifacts (files, a URL,
or design tokens). If they only stated preferences, those belong in Constraints —
omit this section entirely.]

- **Source**: `.n2b/inputs/design-system/` — [the files placed there, or the SOURCES.md note recording URLs/pointers]
- **Provided**: [1-2 sentence summary of what the artifacts cover — colors, typography, spacing, components, brand rules]

*Stage 3 carries these artifacts verbatim into the blueprint package as the
design layer's source of truth.*
```

</template>

<guidelines>

### What Makes Each Section Good

#### Vision
- Specific enough that two people would build roughly the same thing
- Answers "what is this?" and "why does it matter?"
- NOT a feature list — that's feature discovery's job
- NOT an elevator pitch — skip the marketing language

#### Problem Statement
- Names a real pain or desire, not a solution looking for a problem
- Describes what people do TODAY (the status quo)
- Explains why the status quo falls short
- If the user couldn't articulate a clear problem, say so — that's an Open Question

#### Target Users & Roles
- Concrete enough to imagine a real person using this
- "Busy parents who meal prep on Sundays" not "health-conscious consumers"
- If the user said "everyone" — that's a flag. Narrow to who would use it FIRST
- Include context: when would they reach for this? What triggers usage?
- One entry per role: who they are, what they can see and do, when they reach for the product
- If single-role, state that it was confirmed — a confirmed single role and an unexamined one read the same downstream unless you say so
- Every role named here grounds downstream role modeling: a role that appears nowhere in this section (or in Stage 2's persona documents) cannot appear in any later document

#### The Experience
- Written in present tense, second person ("You open the app...")
- Describes the FEELING, not the feature list
- Covers: first encounter, core loop, key moment of delight
- Should read like a story, not a spec
- NOT a requirements doc — avoid "the system shall..."

#### Business Context
- Answers why this should exist as a venture: the goal — revenue, retention, cost savings, mission
- If commercial: how it might make money, in the user's own framing
- Why now — what changed, or what window the user sees
- Record market or competitive signals the user offered; don't invent market analysis — that's Stage 2 research's job
- 2-4 sentences is enough: this section frames the research, it doesn't do it

#### Scale & Non-Functional Expectations
- Order of magnitude, not precision — "a few hundred clinics" beats a fabricated number
- Covers: expected users and data volume, devices and platforms, geographic spread
- Volunteered expectations on performance, privacy, availability — recorded as stated, never invented
- An honest "Unknown" here steers Stage 4's profile analysis; a silent gap becomes a wrong sizing guess

#### Ecosystem & Integrations
- Systems, tools, and services the product must live alongside or talk to
- Name the system and the relationship in functional terms ("pulls appointment data from the clinic's scheduling system")
- "Standalone (confirmed)" when the user confirmed there is nothing to connect to
- Never pick the provider or the integration technology — record what exists in the user's world; Stage 4 decides how to meet it

#### Success Criteria
- 2-5 outcome statements in the user's own words
- What, one year in, would prove this worked
- The user's terms, not KPI jargon — "clinics stop calling us to fix schedules" beats "reduce support tickets by 30%"
- Each criterion concrete enough for Stage 2 to derive measurable signals from

#### Constraints
- Only include constraints the user VOLUNTEERED
- Each constraint has a type (technical, timeline, budget, regulatory, etc.) and rationale
- "None identified (asked)" — record that the question was asked
- Never add constraints you inferred — if the user didn't say it, don't assume it

#### Open Questions
- Items that came up but weren't resolved during questioning
- Items the user was uncertain about
- Gaps the conversation didn't fully resolve
- Every "Unknown — flagged as open question" entry elsewhere in the brief has a matching item here
- Each question should be actionable — something a downstream agent can investigate
- "None" only if the conversation truly covered everything

#### Feature Direction
- Only present when the user chose Path D ("Let's outline key features too") during the 4-way fork
- If Path D was NOT taken, omit this section entirely from BRIEF.md — do NOT add an empty section
- Features should be at capability level: name + 1-2 sentence description
- NOT specs (too deep) and NOT vague categories (too shallow)
- These are starting points for Stage 2, not a contract — Stage 2 will validate, expand, and reprioritize
- 3-8 features is typical; don't force a specific count

#### Design System
- Only present when the user supplied actual design artifacts — files, a URL, or design tokens
- If the user only stated preferences (no artifacts), those are Constraints — omit this section entirely
- Points to `.n2b/inputs/design-system/` and summarizes what was provided
- Stage 3 carries the supplied artifacts into the blueprint package verbatim (n2b never generates a design system)

### How Downstream Agents Consume This

| Section | Primary Consumer | How They Use It |
|---------|-----------------|-----------------|
| Vision | All agents | North star — every decision checked against this |
| Problem Statement | Research agent | Validates the problem space, finds prior art |
| Target Users & Roles | Feature discovery | Prioritizes features by user impact; grounds every role downstream documents may model |
| The Experience | Architecture, UI | Shapes technical and design choices |
| Business Context | Stage 2 market research | Frames the research: the goal, the model, the why-now |
| Scale & Non-Functional Expectations | Stage 4 profile analysis | Sizes the architecture: magnitude, platforms, geography, volunteered expectations |
| Ecosystem & Integrations | Stage 4 architecture | The systems the recommended architecture must coexist and integrate with |
| Success Criteria | Stage 2 metrics | Anchors success metrics in the user's own outcome statements |
| Constraints | All agents | Hard boundaries that can't be violated |
| Open Questions | Research agent | First items to investigate |
| Feature Direction | Stage 2 Feature Discovery | Starting point for feature identification — validates and expands these |
| Design System | Stage 3 workflow (passthrough) | Carries the supplied artifacts into the blueprint package verbatim as the design layer's source of truth |

</guidelines>
