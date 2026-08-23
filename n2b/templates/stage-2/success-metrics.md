---
document_type: success-metrics
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# Success Metrics

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": a metric may target a specific persona from user-persona.md; never reference roles the persona set does not establish
  - See pipeline-rules.md constraint "functional-language-only": metrics use user-observable phrasing — "results appear within ~1 second" is a product expectation and is legal; internal system measures (server metrics, uptime SLAs, database query counts) are not
  - See pipeline-rules.md constraint "output-completeness": every Core feature has at least one metric, no TBD entries
  - Metrics require user-observable phrasing: "the user can", "the user sees", "the user completes", "the user returns" — user-facing performance expectations are welcome; internal system measures are not
  - The metric set spans three categories: product-experience metrics (speed, completion, comprehension), adoption/engagement/business KPIs (activation, retention, habit formation, conversion where the product monetizes), and user-facing performance expectations
  - Every Core feature from product-features.md must have at least one associated metric
  - Each metric names its target persona from user-persona.md in the Persona field — "All" when it applies product-wide
  - Targets must be specific enough to be testable but not so rigid that they prescribe implementation details
  - Connected Feature field must reference exact feature names from product-features.md
  - [Final only] Mark research-informed changes inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
-->

## Summary

{Overview of what this document covers: how many metrics, which features they connect to, how they split across product-experience metrics, adoption/engagement/business KPIs, and user-facing performance expectations, and what the metrics collectively indicate about product success. 2-3 sentences.}

<!-- EXAMPLE (meal tracker):
This document contains 8 success metrics covering all 3 Core features and 2 Important features: 4 product-experience metrics, 2 adoption/engagement KPIs, and 2 user-facing performance expectations. All are observable outcomes the user can experience without needing to know anything about how the product works internally.
END EXAMPLE -->

---

### {Metric Name}

**Description:** {What is being measured, described in functional terms. What does this metric tell us about whether the product is working for the user?}

**Target:** {A specific, functional goal expressed in user-observable terms. "The user can [accomplish X] in [time/steps/conditions]." Testable but not implementation-prescriptive.}

**Rationale:** {Why this metric matters for the product's success. What brief goal or user need does it validate?}

**Persona:** {Persona name from user-persona.md this metric targets, or "All" when it applies product-wide.}

**Connected Feature:** {Exact feature name from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Meal Logging Speed

**Description:** Measures how quickly the user can log a single meal from app open to confirmation. Speed is the primary friction indicator for daily logging habit formation.

**Target:** The user can log a typical meal in under 30 seconds from the moment they open the app. This includes finding the food, confirming details, and seeing the log updated.

**Rationale:** The brief explicitly calls out "without obsessive tracking" as a core requirement. If logging feels burdensome, users abandon the habit. 30 seconds is the threshold between "fast enough to do every time" and "too much effort for daily use."

**Persona:** Alex

**Connected Feature:** Meal Logging

END EXAMPLE -->

---

### {Metric Name}

**Description:** {What is being measured.}

**Target:** {Specific, functional, user-observable goal.}

**Rationale:** {Why this metric matters.}

**Persona:** {Persona name from user-persona.md, or "All".}

**Connected Feature:** {Exact feature name from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Onboarding Completion

**Description:** Measures whether a new user can complete the initial setup experience and reach their first logged meal in a single session without confusion or abandonment.

**Target:** The user completes onboarding — sets any optional preferences and logs their first meal — within the first session. No second session required to "finish setting up."

**Rationale:** First-session completion indicates the onboarding experience is clear enough that users do not need to return and figure things out later. An incomplete first session is a leading indicator of abandonment.

**Persona:** Alex

**Connected Feature:** First-Time Onboarding

END EXAMPLE -->

---

### {Metric Name}

**Description:** {What is being measured.}

**Target:** {Specific, functional, user-observable goal.}

**Rationale:** {Why this metric matters.}

**Persona:** {Persona name from user-persona.md, or "All".}

**Connected Feature:** {Exact feature name from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Pattern Comprehension

**Description:** Measures whether the weekly summary is clear enough that the user can identify one meaningful insight about their eating patterns without any guidance or explanation from the app.

**Target:** After viewing the weekly summary, the user can name at least one specific observation about their eating patterns (e.g., "I skip breakfast on weekdays," "I eat well Monday through Thursday but not on weekends"). The observation does not need to be correct — it needs to be possible to form one.

**Rationale:** Pattern visibility is the product's primary output. If users cannot form any observation from the weekly summary, the summary is not doing its job regardless of how accurate the data is.

**Persona:** Alex

**Connected Feature:** Weekly Progress Summary

END EXAMPLE -->

---

### {Metric Name — adoption/engagement/business KPI}

**Description:** {What adoption, engagement, or business outcome is being measured, in user-observable terms.}

**Target:** {Specific, testable goal — e.g., a share of users still performing the core action after N weeks, or completing a conversion step.}

**Rationale:** {Why this KPI matters for the product's success as a business or habit, not just as an experience.}

**Persona:** {Persona name from user-persona.md, or "All".}

**Connected Feature:** {Exact feature name from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Week-4 Logging Retention

**Description:** Measures whether users who logged meals in their first week are still logging in week 4. Retention of the core action is the clearest signal that the product has created a sustainable habit rather than a burst of initial enthusiasm.

**Target:** At least half of the users who log 3+ meals in their first week are still logging 3+ meals per week in week 4.

**Rationale:** The brief's goal is "gradual, sustainable improvement" — a habit product succeeds only if the habit survives past novelty. Week 4 is past the point where earlier food diaries were abandoned (a pain point cited in market research).

**Persona:** Alex

**Connected Feature:** Meal Logging

END EXAMPLE -->

---

### {Metric Name — user-facing performance expectation}

**Description:** {What responsiveness or performance quality the user should experience, phrased from the user's perspective.}

**Target:** {A user-observable performance expectation — e.g., "results appear within ~1 second." Never an internal system measure.}

**Rationale:** {Why this performance level is a product requirement rather than an implementation detail.}

**Persona:** {Persona name from user-persona.md, or "All".}

**Connected Feature:** {Exact feature name from product-features.md.}

<!-- EXAMPLE (meal tracker):

### Food Search Responsiveness

**Description:** Measures whether food search feels instant during meal logging. Search is inside the product's most frequent loop, so its perceived speed defines the perceived speed of the whole product.

**Target:** Search results appear within ~1 second of the user typing, and recent/frequent entries appear instantly when the search field is opened.

**Rationale:** The under-30-second logging promise depends on search never becoming a wait. This is a user-facing performance expectation — the user experiences "instant" or "sluggish" directly, regardless of how it is achieved. Aligned with the Non-Functional Expectations section of assumptions-constraints.md.

**Persona:** Alex

**Connected Feature:** Food Search

END EXAMPLE -->
