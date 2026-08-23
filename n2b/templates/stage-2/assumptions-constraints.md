---
document_type: assumptions-constraints
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# Assumptions and Constraints

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": any role or user-type reference in assumptions or constraints must trace to BRIEF.md or user-persona.md
  - See pipeline-rules.md constraint "functional-language-only": no technical assumptions (do not write "assumes PostgreSQL" or "assumes REST API" — write "assumes users have internet access when logging"); category-level capability dependencies are the allowed vocabulary in the Dependencies section
  - See pipeline-rules.md constraint "output-completeness": every section has substantive content, no TBD entries
  - Each assumption is stated as a clear, falsifiable assertion: "We assume X. Invalidated if Y." — vague assumptions (e.g., "users will find the app useful") are not acceptable
  - Constraints are distinguished from assumptions: constraints are deliberate product choices, assumptions are believed-to-be-true conditions about the world
  - No technical assumptions — describe what users can do or what context they operate in, not what technology the product uses
  - Non-Functional Expectations use user-observable phrasing ("search results appear within ~1 second") — never internal system measures; cover responsiveness, expected data volumes and growth, privacy posture, and any compliance regime the domain triggers
  - Non-Functional Expectations are populated from BRIEF.md's "## Scale & Non-Functional Expectations" section plus the cross-cutting decomposition checklist — Stage 4 consumes them directly for feasibility and architecture sizing
  - Dependencies section lists functional dependencies on external factors — including category-level external capabilities the product requires ("requires a payment-processing capability", "requires transactional-email delivery", "requires AI text generation"); always vendor-neutral, category only, never a named provider
  - [Final only] Mark research-informed changes inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
  - Each entry in every section must have an ID field using ASMP-XX format (see id-prefixes.md)
  - ID is assigned sequentially across all four sections (ASMP-01, ASMP-02, ... continuous numbering across assumptions, constraints, non-functional expectations, and dependencies)
  - For assumptions tied to a specific feature, use dot-notation: FEAT-XX.ASMP-XX (optional -- most assumptions are global)
-->

## Product Assumptions

### User Environment

{Assumptions about the context in which users access the product. Stated as falsifiable assertions. 2-4 entries.}

- **ID:** ASMP-XX
- **{Assumption statement}** — Invalidated if: {specific condition that would prove the assumption wrong}.

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-01
- **We assume users have internet access when logging meals.** Invalidated if: user research reveals significant offline-only usage scenarios (e.g., users in areas with poor connectivity log meals in the car or at remote locations without signal).
- **ID:** ASMP-02
- **We assume users access the product on a mobile device.** Invalidated if: usage data shows more than 30% of sessions occur on desktop or tablet in a non-mobile context.
- **ID:** ASMP-03
- **We assume users log meals at or near the time of eating.** Invalidated if: user research reveals most logging happens as batch entry at end of day rather than real-time capture.
END EXAMPLE -->

### User Behavior

{Assumptions about how users will engage with the product. Stated as falsifiable assertions. 2-4 entries.}

- **ID:** ASMP-XX
- **{Assumption statement}** — Invalidated if: {specific condition that would prove the assumption wrong}.

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-04
- **We assume users are motivated to track meals at least 3-4 times per week.** Invalidated if: initial usage data shows median log frequency is less than once per week, indicating the motivation assumption is wrong for this user base.
- **ID:** ASMP-05
- **We assume users prefer speed over completeness when logging.** Invalidated if: user research reveals users want to log detailed nutritional information and are willing to spend more time to do so accurately.
- **ID:** ASMP-06
- **We assume users will form a logging habit within 2 weeks of first use if the experience is frictionless.** Invalidated if: retention data shows users who log consistently in week 1 still drop off in week 2-3 at the same rate as infrequent early users.
END EXAMPLE -->

### Product Context

{Assumptions about the product's role and position. Stated as falsifiable assertions. 1-3 entries.}

- **ID:** ASMP-XX
- **{Assumption statement}** — Invalidated if: {specific condition that would prove the assumption wrong}.

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-07
- **We assume this is a standalone product, not part of a larger wellness suite.** Invalidated if: the brief's business context or user interviews reveal users primarily want this as an add-on to an existing fitness or health platform.
- **ID:** ASMP-08
- **We assume users do not need clinical-grade accuracy in nutritional data.** Invalidated if: the target user segment turns out to include people managing medical conditions where approximate values are insufficient.
END EXAMPLE -->

## Product Constraints

{Hard boundaries that shape the product. Constraints are deliberate product choices, not external conditions.}

- **ID:** ASMP-XX
- **{Constraint statement}** — {Brief rationale for why this is a constraint rather than a feature decision.}

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-09
- **Mobile-first platform** — The brief specifies mobile-first use. All design and feature decisions prioritize the mobile experience. Desktop access, if it exists, is secondary and must not require features unsupported on mobile.
- **ID:** ASMP-10
- **Functional, not prescriptive scope** — The product presents information and enables logging; it does not prescribe dietary goals, make recommendations, or judge the user's choices. This is a deliberate product positioning constraint.
- **ID:** ASMP-11
- **Personal and private by default** — All logged data belongs to the user who created it. There are no social features and no sharing. Privacy is a non-negotiable product value, not a feature toggle.
END EXAMPLE -->

## Non-Functional Expectations

{User-observable expectations for responsiveness, data volume and growth, privacy posture, and compliance. Phrased from the user's perspective ("results appear within ~1 second"), never as internal system measures. Populated from BRIEF.md's "## Scale & Non-Functional Expectations" section and the cross-cutting decomposition checklist. Cover at minimum: responsiveness, expected data volumes/growth, privacy posture, and any compliance regime the domain triggers — state explicitly when none is identified. 3-6 entries. Stage 4 consumes this section directly for feasibility and architecture sizing.}

- **ID:** ASMP-XX
- **{Expectation statement, user-observable phrasing}** — Basis: {BRIEF.md citation, checklist entry, or domain reasoning.}

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-12
- **Responsiveness: food search results appear within ~1 second of typing, and logging a meal completes end-to-end in under 30 seconds.** — Basis: the brief's "without obsessive tracking" goal makes low-friction speed the product's defining quality bar (BRIEF.md, Scale & Non-Functional Expectations).
- **ID:** ASMP-13
- **Data volume and growth: a user generates roughly 3-6 meal entries per day (~2,000 per year), and the product stays equally responsive with several years of accumulated history.** — Basis: brief-stated daily-use pattern projected over a multi-year retention horizon.
- **ID:** ASMP-14
- **Privacy posture: logged data is private to the user by default, is never shared or sold, and the user can permanently delete all of their data on request.** — Basis: the brief's personal-and-private positioning (BRIEF.md, Constraints).
- **ID:** ASMP-15
- **Compliance: eating-habit logs for personal awareness are treated as personal data (GDPR-class protection for account and log data); no medical-data regime applies unless the product later targets users managing medical conditions, which would trigger health-data regulations.** — Basis: domain reasoning from the cross-cutting decomposition checklist; the brief names no clinical use.
END EXAMPLE -->

## Dependencies

{Functional dependencies on external factors — what the product requires to function. Stated functionally, never as named technology. Category-level external capabilities belong here whenever the product genuinely requires them ("requires a payment-processing capability", "requires transactional-email delivery", "requires AI text generation") — vendor-neutral, category only, never a named provider. Stage 4 decides how each category need is met.}

- **ID:** ASMP-XX
- **{Dependency}** — {What this dependency enables and what the product cannot do without it.}

<!-- EXAMPLE (meal tracker):
- **ID:** ASMP-16
- **Food-composition data capability** — The product requires access to a searchable body of food items for the meal search and logging feature. Without this, users cannot log meals by name — only by custom free-text entries. The quality and breadth of this data directly affects the logging experience.
- **ID:** ASMP-17
- **User account or session persistence** — The product requires a way to preserve the user's log between sessions. If this is unavailable, the user's data does not persist across app opens, making pattern analysis impossible.
- **ID:** ASMP-18
- **Device-notification delivery capability** — The optional daily logging reminder requires the ability to deliver notifications to the user's device. Without it, the reminder capability of Meal Logging (FEAT-01) cannot function; the rest of the product is unaffected.
END EXAMPLE -->
