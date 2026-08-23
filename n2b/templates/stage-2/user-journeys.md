---
document_type: user-journeys
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# User Journeys

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": every journey is experienced by a named persona from user-persona.md; multi-role products include journeys for each role whose path genuinely differs; never invent roles the persona set does not establish
  - See pipeline-rules.md constraint "functional-language-only": steps describe what the user does and experiences, not how the product implements it
  - See pipeline-rules.md constraint "output-completeness": every journey fully filled, no TBD steps
  - Include at least max(3, ceil(total feature count / 4)) journeys — add journeys as needed until coverage is met
  - Each journey has 4-6 high-level steps (not screen-by-screen flows — describe stages and transitions)
  - Every Core and Important feature from product-features.md must appear in at least one journey
  - Every journey names its Owning Persona — the persona from user-persona.md who experiences it
  - Every journey includes one explicit Failure/Recovery Variant: what goes wrong (error, interruption, mistake, or gap), what the user experiences, and how they recover — the recovery path is part of the product, not an afterthought
  - Steps describe the action the user takes AND the outcome they experience
  - Entry point and Success Outcome must be concrete, not vague
  - Connected Features must reference exact feature names from product-features.md
  - [Final only] Mark research-informed changes inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
  - Coverage rule: at least one journey must cover the user's first-time experience (onboarding or first use)
  - Coverage rule: at least one journey must cover the user's most frequent regular activity
  - Coverage rule: at least one journey must cover an edge case or recovery scenario as its primary subject
  - Every journey declares its coverage type with a **Coverage:** field — value {First-use | Regular | Edge/Recovery} — placed immediately after **Owning Persona:**; across the document, all three values must each appear on at least one journey
  - ID convention: user stories (US-XX) and UX flows (UX-XX) derived from journeys in later stages use dot-notation linking to their parent feature (e.g., FEAT-01.US-01) -- see id-prefixes.md for format details
-->

## Journey

{Brief overview of journeys included in this document — 1-2 sentences stating how many journeys, which personas own them, what lifecycle stages they cover, and which features they connect to.}

<!-- EXAMPLE (meal tracker):
This document contains 3 journeys covering the complete user lifecycle: first-time setup, weekly review, and recovering from missed days. All journeys are owned by Alex, the sole persona. Every Core and Important feature appears across the journeys.
END EXAMPLE -->

---

### {Journey Name}

**Owning Persona:** {Persona name from user-persona.md}

**Coverage:** {First-use | Regular | Edge/Recovery}

**Journey Goal:** {What the user is trying to accomplish in this journey. One sentence.}

**Entry Point:** {How the user enters this journey — what triggers it? App launch, notification, a specific moment or need?}

**Steps:**

1. {Stage name} — {What the user does. What they experience or see as a result.}
2. {Stage name} — {What the user does. What they experience or see as a result.}
3. {Stage name} — {What the user does. What they experience or see as a result.}
4. {Stage name} — {What the user does. What they experience or see as a result.}

**Failure/Recovery Variant:** {At which step something goes wrong, what the user experiences, and how they recover without losing work or trust. One short paragraph.}

**Success Outcome:** {What "done" looks like for this journey from the user's perspective. What have they accomplished?}

**Connected Features:** {List the feature names from product-features.md that are involved in this journey.}

<!-- EXAMPLE (meal tracker):

### First-Time Setup

**Owning Persona:** Alex

**Coverage:** First-use

**Journey Goal:** Get from first app open to a stated goal and a first logged meal, so daily tracking can begin.

**Entry Point:** User opens the app for the very first time after installing it, motivated to start tracking their eating habits.

**Steps:**

1. First open — User opens the app and sees a short, plain-language introduction to what it does. No account walls or long forms stand between them and starting.
2. Set the goal — User states what they want from tracking (e.g., more consistent meals, better awareness). The app records the goal and explains how it will be used, without demanding precision.
3. Log the first meal — User is guided into logging their most recent meal using the standard flow. Common foods surface immediately in search; a custom entry in plain language works too.
4. Ready state — The first meal is recorded and the app shows the day view with the entry in place. User sees exactly what daily use will look like — setup is over and the routine has begun.

**Failure/Recovery Variant:** The user abandons setup midway (closes the app at step 2, unsure what goal to pick). On next open, the app resumes exactly where they left off with earlier answers preserved — no restart, no re-entry — and skipping the goal entirely is allowed; it can be set later without penalty.

**Success Outcome:** Within a few minutes of first open, the user has a stated goal and their first logged meal, and understands what daily use looks like. Nothing is left half-configured.

**Connected Features:** Meal Logging, Food Search

END EXAMPLE -->

---

### {Journey Name}

**Owning Persona:** {Persona name from user-persona.md}

**Coverage:** {First-use | Regular | Edge/Recovery}

**Journey Goal:** {What the user is trying to accomplish.}

**Entry Point:** {What triggers this journey?}

**Steps:**

1. {Stage name} — {What the user does and experiences.}
2. {Stage name} — {What the user does and experiences.}
3. {Stage name} — {What the user does and experiences.}
4. {Stage name} — {What the user does and experiences.}
5. {Stage name} — {What the user does and experiences.}

**Failure/Recovery Variant:** {What goes wrong, what the user experiences, and how they recover.}

**Success Outcome:** {What "done" looks like for the user.}

**Connected Features:** {Feature names from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Weekly Pattern Review

**Owning Persona:** Alex

**Coverage:** Regular

**Journey Goal:** Review the past week's eating patterns to understand trends and adjust habits.

**Entry Point:** User opens the app on a Sunday or any day they want a broader view — not triggered by a notification, self-initiated.

**Steps:**

1. Navigate to summary — User opens the weekly view. The app shows the past 7 days of logged meals and the overall pattern at a glance.
2. Scan the overview — User sees which days had complete logs, which were partial, and a general nutritional trend. Visual, not a data table.
3. Identify patterns — User notices which meal types or foods are consistent and which are outliers. The view highlights this without requiring manual calculation.
4. Reflect and decide — User decides if they want to adjust anything for the coming week. The app does not prescribe changes — it presents information.
5. Done — User closes the view. No required action or save step.

**Failure/Recovery Variant:** The week has several unlogged days. The summary shows the gaps as blank days without judgment and still surfaces patterns from the days that were logged — Alex is never blocked from the review because the data is incomplete, and no message frames the gaps as failure.

**Success Outcome:** User has a clear picture of the past week's eating patterns in under 2 minutes and can make an informed decision about next week without doing any manual analysis.

**Connected Features:** Weekly Progress Summary, Meal Logging

END EXAMPLE -->

---

### {Journey Name}

**Owning Persona:** {Persona name from user-persona.md}

**Coverage:** {First-use | Regular | Edge/Recovery}

**Journey Goal:** {What the user is trying to accomplish — typically an edge case or recovery scenario.}

**Entry Point:** {What triggers this journey?}

**Steps:**

1. {Stage name} — {What the user does and experiences.}
2. {Stage name} — {What the user does and experiences.}
3. {Stage name} — {What the user does and experiences.}
4. {Stage name} — {What the user does and experiences.}

**Failure/Recovery Variant:** {What goes wrong, what the user experiences, and how they recover.}

**Success Outcome:** {What "done" looks like.}

**Connected Features:** {Feature names from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Recovering from Missed Days

**Owning Persona:** Alex

**Coverage:** Edge/Recovery

**Journey Goal:** Resume regular logging after skipping several days without feeling penalized or needing to backfill.

**Entry Point:** User returns to the app after a gap — they open it and notice their last log was several days ago.

**Steps:**

1. Return to app — User opens the app. The current day's log is shown — not a list of missed days or a warning about the gap.
2. Log today normally — User logs a current meal using the standard Meal Logging flow. The app treats today as today, not as a make-up session.
3. Gap is visible but not punished — In the weekly view, the missed days show as blank but the app does not display a "streak broken" message or require explanation.
4. Continue normally — User is back in the routine. No catch-up required.

**Failure/Recovery Variant:** Alex decides to backfill one missed day but accidentally saves yesterday's dinner with today's date. The edit flow lets them correct the date after saving; the day log and weekly view update immediately, and no duplicate or orphaned entry is left behind.

**Success Outcome:** User resumes logging without guilt or friction. The product treats gaps as normal, not as failures.

**Connected Features:** Meal Logging, Weekly Progress Summary

END EXAMPLE -->
