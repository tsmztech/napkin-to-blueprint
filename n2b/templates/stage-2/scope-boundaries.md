---
document_type: scope-boundaries
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# Scope Boundaries

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": user scope exclusions must trace to the persona set in user-persona.md — exclude roles the product genuinely does not serve, each with a cited rationale, never by default rule
  - See pipeline-rules.md constraint "functional-language-only": exclusions describe functional scope, not technical choices (do not exclude "PostgreSQL" or "REST API" — exclude "historical data export" or "real-time sync")
  - See pipeline-rules.md constraint "output-completeness": every exclusion has a rationale, no empty bullet points
  - Every exclusion must have a one-line rationale — "out of scope" alone is not sufficient
  - Exclusions informed by market research must reference the research findings (e.g., "market research shows this adds complexity users do not want")
  - Scale Expectations state the data volumes, growth, and history depth the product is expected to honor, and how scale phases in across MVP / v1 / Later — reserve exclusions for boundaries that are genuinely out of vision at any scale, each with rationale
  - Deferral Notes distinguish deferred (lands in a later phase) from rejected (will not happen)
  - Every deferred item names its target roadmap phase (v1 | Later), matching the Phase field in product-features.md — deferrals land somewhere, never "maybe someday"
  - [Final only] Mark research-informed changes inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
  - Each exclusion must have an ID field using SC-XX format (see id-prefixes.md)
  - ID is assigned sequentially across all exclusion sections (SC-01, SC-02, ... continuous numbering)
  - For exclusions derived from a specific feature, use dot-notation: FEAT-XX.SC-XX (optional -- most exclusions are global)
-->

## In-Scope Summary

{A brief restatement of what this product does, serving as the anchor for the exclusions below. 2-4 sentences. Reference the feature tiers from product-features.md to make the boundary concrete.}

<!-- EXAMPLE (meal tracker):
This product enables a single user to log meals, track nutritional patterns over time, and review weekly trends. Core features cover daily logging and food search; Important features add progress summaries and goal-setting; Nice-to-Have features add habit reinforcement. The product is personal and private — it serves one person tracking their own eating habits.
END EXAMPLE -->

## Explicit Exclusions

### User Scope Exclusions

{Roles, user types, or user-scope capabilities the product deliberately does not serve, per the persona set in user-persona.md. Every entry has a one-line rationale citing the brief or the persona set.}

- **ID:** SC-XX
- **{Excluded thing}** — {One-line rationale citing the brief or the persona set in user-persona.md.}

<!-- EXAMPLE (meal tracker):
- **ID:** SC-01
- **Admin panels or management views** — The persona set confirms one user type (BRIEF.md, Target Users & Roles); this product has no oversight or management roles.
- **ID:** SC-02
- **Team or household food tracking** — The brief describes one person's personal eating habits, not shared household management.
- **ID:** SC-03
- **Shared meal plans or collaborative logging** — Logging is a solo, private activity per the brief's personal-tracking vision.
- **ID:** SC-04
- **Accounts with different permission levels** — The Access Matrix in user-persona.md has exactly one row; there is one entitlement set and no role-based branching.
END EXAMPLE -->

### Feature Scope Exclusions

{Features that might be assumed for this product type but are intentionally excluded. Reference brief goals, research findings, or scope decisions as rationale.}

- **ID:** SC-XX
- **{Excluded feature}** — {One-line rationale citing brief, research, or scope decision.}

<!-- EXAMPLE (meal tracker):
- **ID:** SC-05
- **Barcode scanning** — Market research shows high failure rates on homemade and restaurant meals, creating more friction than it eliminates; the brief emphasizes low-friction logging.
- **ID:** SC-06
- **Social sharing or community boards** — The brief describes personal, private tracking; social features would change the product's fundamental nature.
- **ID:** SC-07
- **Fitness or exercise tracking** — Out of the brief's stated domain (eating habits); combining both would require a different product scope.
- **ID:** SC-08
- **Prescription dietary recommendations** — The product presents information for user interpretation; it does not prescribe behavior, per the brief's "without obsessive tracking" goal.
- **ID:** SC-09
- **Integration with third-party health apps** — Adds complexity and external dependencies without serving the core brief goal of pattern visibility.
END EXAMPLE -->

### Scale Expectations

{The data volumes, usage growth, and history depth the product is expected to honor, and how scale phases in across MVP / v1 / Later. State what the product IS designed to handle, in user-observable terms — aligned with the Non-Functional Expectations section of assumptions-constraints.md. Boundaries that are genuinely out of vision at any scale may be recorded here as exclusions, each with rationale.}

- **ID:** SC-XX
- **{Scale expectation or genuine out-of-vision boundary}** — {Expected volume/growth and its phase-in, or the rationale for a genuine out-of-vision boundary.}

<!-- EXAMPLE (meal tracker):
- **ID:** SC-10
- **Multi-year personal history** — Expected: roughly 2,000 meal entries per user per year, with the product staying equally responsive across several years of accumulated history; full history is retained from MVP onward.
- **ID:** SC-11
- **Long-term trend analysis phase-in** — MVP covers the rolling 7-day summary; month-over-month and seasonal trend views phase in at v1 as users accumulate history worth analyzing.
- **ID:** SC-12
- **Export or reporting for medical or clinical use** — Genuinely out of vision at any scale: the product serves personal habit awareness, not medical documentation; clinical use would require different accuracy standards.
END EXAMPLE -->

## Deferral Notes

{Items that are not in the MVP but are acknowledged as planned or potential future additions. Mark these as deferred, not rejected, and name the target roadmap phase (v1 | Later) for each — matching the Phase field vocabulary in product-features.md. Every entry states what would need to be true for deferral to become inclusion. Deferred items do not receive SC-XX IDs -- they are not exclusions.}

- **{Deferred item}** — Target phase: {v1 | Later}. {Why it is deferred rather than rejected. What would change to make this worth including in its target phase?}

<!-- EXAMPLE (meal tracker):
- **Barcode scanning** — Target phase: Later. Deferred rather than rejected. If food database coverage improves significantly for restaurant and homemade meals, the friction argument weakens. Worth revisiting once real usage data shows how often users fail to find foods by search.
- **Weekly goal-setting** — Target phase: v1. Deferred until the product has established the habit loop. Users need to log consistently before goal-setting becomes meaningful; adding goals too early could create pressure that discourages use.
- **Meal photo logging** — Target phase: Later. User-friendly as an alternative to text entry, but it introduces different capture and review behaviors that deserve their own design pass. Strong candidate once the text-entry loop is proven.
END EXAMPLE -->
