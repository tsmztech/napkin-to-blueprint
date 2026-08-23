<!-- Agent: spec-quality-reviewer
     When: @-include during quality review of each spec.
     Purpose: 7-category quality checklist with severity levels for spec validation.
     Output: Quality review findings per spec. -->

# Spec Quality Checklist

Structured quality review checklist for validating specs produced by Spec Writers. Apply all 7 categories to every spec, across all five spec types (screen, automation, logic-rule, integration, notification). Severity levels determine whether findings trigger a revision cycle.

---

## Severity Levels

| Severity | Definition | Action |
|----------|-----------|--------|
| **Critical** | Spec is unusable -- missing capability coverage makes it incomplete for implementation | Must be fixed. Triggers Spec Writer re-spawn. |
| **High** | Significant gap -- missing sections, interactions, states, or outcomes that would cause implementation ambiguity | Must be fixed. Triggers Spec Writer re-spawn. |
| **Medium** | Quality issue -- vague criteria or insufficient edge cases that reduce spec reliability | Should be fixed. Fixed during revision if triggered by Critical/High findings. |
| **Low** | Minor improvement -- style-level ambiguity that doesn't block implementation | Fixed if revision occurs for other reasons, otherwise accepted. |

**Routing groups:** severities map to routing groups the workflow acts on without interpretation -- Critical + High = **must-fix**, Medium = **should-fix**, Low = **notes**.

**Iteration model:** Only Critical and High findings trigger a Spec Writer re-spawn. Maximum 1 revision cycle per feature. The re-spawned Spec Writer addresses only the flagged issues -- it cannot restructure specs that were not flagged.

---

## Category 1: Capability Coverage

**What to check:** The spec accounts for all Key Capabilities assigned to it in the Feature Breakdown Brief's Capability Coverage Map.

**General checks:**
- Every Key Capability listed in the Feature Breakdown Brief for this spec has corresponding content in the spec
- No Key Capability is mentioned only in the overview but missing from the detailed sections
- The spec does not claim coverage of capabilities not assigned to it

**Type-specific sub-checks:**

- **Screen specs:** Each assigned Key Capability maps to at least one interaction or layout element
- **Automation specs:** Each assigned Key Capability maps to at least one trigger path or processing step
- **Logic/Rule specs:** Each assigned Key Capability maps to at least one rule or validation
- **Integration specs:** Each assigned Key Capability maps to at least one Product Behavior Enabled or Inbound Event
- **Notification specs:** Each assigned Key Capability maps to at least one trigger, channel, or content element

**Severity:** Missing capability coverage is **Critical**.

---

## Category 2: Brief Alignment

**What to check:** The spec's scope, connections, and shared patterns are consistent with the Feature Breakdown Brief.

**General checks:**
- Spec scope matches what the Feature Breakdown Brief declares for this spec
- Connected specs listed in the Brief are referenced correctly (by exact FEAT-NN.SPEC-NNN identifiers)
- Shared UI patterns declared in the Brief are applied consistently
- Shared entity references use exact names and fields from the dependency map
- Non-goals do not contradict the Brief's scope for this spec
- The roles the spec addresses match the Brief's Roles Touched entry for this spec, and every role named traces to the Access Matrix in user-persona.md (grounded-roles)

**Type-specific sub-checks:**

- **Screen specs:** Navigation connections match the Brief's internal dependency map; shared form patterns are consistent across sibling specs
- **Automation specs:** Trigger sources match the Brief's declared connections; outcome effects align with the Brief's side-effect inventory
- **Logic/Rule specs:** Governed entity fields match the dependency map; enforcing specs match the Brief's declared relationships
- **Integration specs:** The Capability Category matches the dependency map's External Touchpoints row that names this spec; Data Exchanged uses exact entity and field names from the dependency map
- **Notification specs:** Trigger sources match the Brief's declared connections and side-effect inventory; audience roles come from the Access Matrix; content placeholders reference fields that exist on the dependency map's entities

**Severity:** Misalignment with the Brief is **High**.

---

## Category 3: Content Completeness

**What to check:** All required sections for the spec type are present and substantive (not placeholder text or empty headers).

**General checks:**
- Every required section for the spec type exists
- No section contains only placeholder text (e.g., "TBD", "TODO", "[fill in]")
- Frontmatter is complete with accurate counts
- Scope section includes at least 2 non-goals
- In the four spec types that carry `## Analytics and Success Signals` (screen, automation, integration, notification), the section is present and every listed event cites the Stage 2 metric it feeds in the exact form `supports success-metrics.md: "{exact metric name}"` -- the cited name must match a metric in success-metrics.md character-for-character -- or the event slot carries `N/A — {reason}`. Logic/Rule specs carry no Analytics section.

**Type-specific sub-checks:**

- **Screen specs:** Must have: Overview, Scope and Non-Goals, Entry Points, Access and Visibility, Layout and Content (including the Responsive Behavior subsection), Interactions (including the Accessibility Notes subsection), States, Validation Rules (or reference to Logic/Rule spec), Navigation Out, Data Model, Business Rules, Edge Cases, Connected Specs, Analytics and Success Signals, Acceptance Criteria with Coverage Summary Table
- **Automation specs:** Must have: Overview, Scope and Non-Goals, Trigger Definition (table format), Processing Logic, Outcome Definitions (table format), Data Model, Business Rules, Edge Cases, Connected Specs, Analytics and Success Signals, Acceptance Criteria
- **Logic/Rule specs:** Must have: Overview, Scope and Non-Goals, Governed Entity, Enforced By (table format), Field Validation Rules (table format), Cross-Field Rules, Authorization Rules (table format), Defaults and Derivations, Business Rules, Edge Cases, Acceptance Criteria
- **Integration specs:** Must have: Overview, Scope and Non-Goals, Capability Category, Product Behaviors Enabled, Data Exchanged, Inbound Events, Degradation Behavior, Consent and Disclosure, Edge Cases, Connected Specs, Analytics and Success Signals, Acceptance Criteria
- **Notification specs:** Must have: Overview, Scope and Non-Goals, Channels, Trigger, Audience and Preferences, Content Definition, Delivery Rules, Edge Cases, Connected Specs, Analytics and Success Signals, Acceptance Criteria

**Severity:** Missing required sections are **High**. Missing or inexact analytics metric citations are **Medium**.

---

## Category 4: Interaction/Trigger Completeness

**What to check:** Every actionable element has defined behavior.

**General checks:**
- No interactive element is mentioned without its corresponding behavior definition
- No trigger is listed without processing logic

**Type-specific sub-checks:**

- **Screen specs:**
  - Every interactive element in the Layout and Content section has at least one trigger-response pair in the Interactions section
  - Display-only elements are explicitly noted as non-interactive
  - Every button, link, input field, toggle, and selectable item has defined behavior
  - The Access and Visibility table covers every role from the Access Matrix plus the unauthenticated/expired states where the screen is reachable, and every row defines Can View, Can Act, AND the Unauthorized Experience -- what a denied user actually sees, never a bare "hidden" or "no access" without the experience stated (for single-role products, the one-row form with `single-role product — no restricted elements` satisfies this)
  - Missing interactions for layout elements are flagged

- **Automation specs:**
  - Every trigger path listed in the Trigger Definition table has corresponding processing logic
  - Every trigger has defined conditions for when it fires
  - Available data at trigger time is specified for each trigger
  - External-event triggers cite an existing Integration spec ID as their source
  - Missing trigger-to-logic mappings are flagged

- **Logic/Rule specs:**
  - Every field in the governed entity (from the dependency map) is addressed
  - Fields with no validation are explicitly noted as "no validation beyond data type"
  - Every rule has a defined enforcement point (when checked) and error message
  - The Authorization Rules table covers every action on the governed entity for every role, and every denied combination states the exact denied behavior -- the precise message or experience, not "access is denied appropriately"
  - Missing field coverage is flagged

- **Integration specs:**
  - Every inbound event in the Inbound Events table has a defined product response (data changes, user feedback, affected specs)
  - Every Product Behavior Enabled maps to capabilities or specs by exact ID
  - Missing event-to-response mappings are flagged

- **Notification specs:**
  - Content Definition is exact: literal subject/title text, full body template with named `{placeholder}` variables (each placeholder traceable to a defined data field), and CTA with its deep-link destination by spec ID -- "an appropriate reminder message" is a finding
  - Every channel declared in Channels has complete content defined
  - Missing content-per-channel coverage is flagged

**Severity:** Missing interactions, triggers, field coverage, event responses, or content definitions is **High**.

---

## Category 5: State/Outcome Coverage

**What to check:** All states and outcomes are documented, not just the happy path.

**General checks:**
- The spec addresses what happens when things go wrong, not just when they succeed
- Edge cases are concrete scenarios with defined behavior, not vague "handle errors" statements

**Type-specific sub-checks:**

- **Screen specs:**
  - Empty state is considered (even if "not applicable" with rationale)
  - Error state is considered for any screen that loads or submits data
  - Loading state is considered for any screen that fetches data
  - Offline/degraded state is considered (even if `N/A — {reason}`)
  - A concurrent-edit conflict edge case exists for every screen that updates shared entities (per the dependency map's Contention notes)
  - For input screens: success feedback, server-side failure, and form abandonment are all addressed
  - Missing state coverage is flagged

- **Automation specs:**
  - Success outcome path is defined with data changes and user feedback
  - Failure outcome path is defined with error handling and user notification
  - Partial/ambiguous outcome path is defined (where applicable)
  - Concurrent-trigger-firing and trigger-fires-while-previous-run-in-flight edge cases are addressed
  - Missing outcome definitions are flagged

- **Logic/Rule specs:**
  - Every conditional rule has behavior defined for both branches
  - Boundary conditions for numeric rules are specified (what happens at exact thresholds)
  - Rule interaction effects are documented when rules depend on each other

- **Integration specs:**
  - Degradation Behavior covers all three provider conditions -- slow, down, and rejects -- for every affected screen it names by spec ID
  - A screen that depends on the integration but has no Degradation Behavior entry is flagged
  - Consent and Disclosure defines what the user is told or asked, and when

- **Notification specs:**
  - Delivery failure behavior is defined (retry-on-failure, expiry)
  - Batching and deduplication rules are stated
  - Opt-out/preference and quiet-hours states have defined behavior -- what is not sent, and whether it is dropped or deferred

**Severity:** Missing states or outcomes is **High**.

---

## Category 6: Acceptance Criteria Testability

**What to check:** Each Given/When/Then criterion is concrete enough to pass or fail unambiguously.

**General checks:**
- Every acceptance criterion has a specific, observable outcome (not "appropriate feedback" or "correct behavior")
- Given conditions are specific enough to reproduce (not "given normal conditions")
- When actions are concrete user actions or system events (not "when the user interacts with the feature")
- Then outcomes describe verifiable state changes, visible elements, or measurable results
- Persona name is used in criteria (e.g., "Given Sarah is on..."); where behavior differs by role, the criterion names the role

**Type-specific sub-checks:**

- **Screen specs:** At least one criterion per interaction, per non-default state, and per business rule
- **Automation specs:** At least one criterion per trigger path x outcome path combination
- **Logic/Rule specs:** At least one criterion per rule; conditional rules have one criterion per branch
- **Integration specs:** At least one criterion per inbound event x outcome combination and per degradation path
- **Notification specs:** At least one criterion per channel x trigger x preference-state combination

**Severity:** Vague or untestable criteria are **Medium**.

---

## Category 7: Ambiguity Scan

**What to check:** Descriptions are unambiguous and actionable -- a development team or build agent can implement without making judgment calls.

**General checks:**
- No vague adjectives: "user-friendly," "appropriate," "efficient," "intuitive," "reasonable," "adequate," "nice," "clean"
- No passive voice hiding actors: "the data is processed" (by whom/what?), "an error is shown" (where, with what message?)
- No compound requirements joining multiple behaviors with "and" that should be separate items
- No undefined pronouns: "it updates the record" (which record? which fields?)
- No assumed knowledge: "follows standard patterns" (which patterns, specifically?)

**Type-specific sub-checks:**

- **Screen specs:** Layout descriptions use spatial language ("above," "below," "left of") not subjective language ("prominently displayed," "easily accessible")
- **Automation specs:** Processing steps are ordered and deterministic, not described as "the system handles" or "processes as needed"
- **Logic/Rule specs:** Rule conditions use exact operators and values, not "around 5" or "a reasonable limit"

**Severity:** Ambiguities are **Low**.

---

## Review Output Format

For each spec reviewed, produce findings organized by category:

```
## Review: {FEAT-NN.SPEC-NNN} - {spec name}

### Summary
- Critical findings: {count}
- High findings: {count}
- Medium findings: {count}
- Low findings: {count}
- **Verdict:** {PASS | REVISE}

### Findings

**[Critical] Category 1: Capability Coverage**
- {specific finding with location in spec}

**[High] Category 4: Interaction Completeness**
- {specific finding with location in spec}

... (only categories with findings)
```

**Verdict rules:**
- Any Critical or High findings --> REVISE
- Only Medium and/or Low findings --> PASS (findings noted for optional improvement)
- No findings --> PASS

**Routing note:** in the per-feature report, group findings for the workflow as **must-fix** (Critical + High), **should-fix** (Medium), and **notes** (Low). Only must-fix findings route into the producer revision re-spawn.
