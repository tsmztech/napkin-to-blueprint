---
document_type: spec
spec_type: automation
spec_id: FEAT-{NN}.SPEC-{NNN}
spec_name: {name}
spec_slug: {kebab-case-slug}
parent_feature: FEAT-{NN}
parent_feature_name: {feature name}
priority_tier: {Core | Important | Nice-to-Have}
produced_by: spec-writer
status: {draft | final}
created: {YYYY-MM-DD}
acceptance_criteria_count: {N}
---

# Automation Spec: {Spec Name}

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": the Feature Breakdown Brief is mandatory context -- read it before writing
  - See pipeline-rules.md constraint "grounded-roles": every role or user type referenced must trace to BRIEF.md or the Stage 2 persona documents -- never invent roles
  - See pipeline-rules.md constraint "functional-language-only": no tech details (frameworks, databases, APIs); naming category-level external capabilities is allowed where a trigger or outcome depends on one
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - The Feature Breakdown Brief (feature-overview.md) is mandatory context for this spec
  - Every capability assigned to this spec in the Brief's Capability Coverage Map must be accounted for
  - Use FEAT-NN.SPEC-NNN dot-notation IDs when referencing connected specs
  - Use exact entity names and fields from the Feature Dependency Map
  - Reference cross-feature business rules by XBR-NN Rule ID
  - External-event triggers name the Integration spec (FEAT-NN.SPEC-NNN) whose Inbound Events section defines the event as their source
  - Every trigger path must have at least one acceptance criterion
  - Every outcome path must have at least one acceptance criterion
  - Processing logic must be purely functional -- no implementation details
  - Every analytics event must cite the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}"
  - Non-goal rationales must trace to a product decision (scope-boundaries.md, product-features.md, or BRIEF.md) -- never to effort, timeline, or keeping the product small
  - Minimum 2 non-goals in Scope and Non-Goals section
  - Platform-set policy values (deposit amounts, fee/refund percentages, time windows, prices, payout cycles -- anything fixed platform-wide and decided at build) are NEVER stated as concrete numbers: write the inline marker platform parameter: `{kebab-slug}` instead -- one slug per distinct parameter, reused verbatim at every site referencing the same value. Pass D collects every marker into specifications/platform-parameters.md with a proposed default; Gate A reconciles markers against that registry. Values that genuinely belong to one feature's own definition stay inline as before
  - Before writing, update all frontmatter fields: spec_id, spec_name, spec_slug, parent_feature, parent_feature_name, priority_tier, produced_by (spec-writer), status, created (today's date), acceptance_criteria_count
-->

## Overview

**Name:** {Spec Name}
**ID:** {FEAT-NN.SPEC-NNN}
**Type:** Automation
**Purpose:** {One sentence describing what this automation does.}
**Parent Feature:** {FEAT-NN} -- {Feature Name}

<!-- EXAMPLE (duplicate detection):
**Name:** Duplicate Detection
**ID:** FEAT-01.SPEC-004
**Type:** Automation
**Purpose:** System checks for potential duplicate contacts when a contact is created or edited.
**Parent Feature:** FEAT-01 -- Contact Management
END EXAMPLE -->

## Scope and Non-Goals

**In Scope:**
- {What this automation covers.}

**Non-Goals:**
- {What this automation explicitly excludes. Reference sibling specs by ID where applicable. Each exclusion cites the product decision behind it.}
- {Second non-goal minimum.}

<!-- EXAMPLE (duplicate detection):
**In Scope:**
- Checking for duplicate contacts on create and edit save actions
- Presenting potential matches to the user for resolution
- Allowing the user to proceed without resolving (Keep Both)

**Non-Goals:**
- Merging duplicate contacts into a single record -- excluded per scope-boundaries.md: the product definition scopes this feature to detection with user-controlled resolution; automated merging is a distinct capability the product definition does not include.
- Batch deduplication across all existing contacts -- excluded per scope-boundaries.md: the product definition addresses duplicates at the moment of entry so the user resolves each case in context, rather than through bulk cleanup passes.
- Duplicate detection on data import -- product-features.md defines no import capability, so no import path exists to check.
END EXAMPLE -->

## Trigger Definition

{Every event that initiates this automation. Each trigger specifies the source, conditions, and available data. Trigger categories: user-initiated, event-driven, schedule-based, threshold-based, and external event. For an external-event trigger -- something outside the product reports that something happened -- the Source Spec is the Integration spec (FEAT-NN.SPEC-NNN) whose Inbound Events section defines the event.}

| Trigger | Source Spec | Conditions | Available Data |
|---------|-----------|------------|----------------|
| {Event that starts the automation} | {FEAT-NN.SPEC-NNN (Name)} | {When does this trigger fire} | {What data is available at trigger time} |

<!-- EXAMPLE (duplicate detection):
| Trigger | Source Spec | Conditions | Available Data |
|---------|-----------|------------|----------------|
| Contact saved (create) | FEAT-01.SPEC-001 (Contact Create) | Always on successful validation | All contact fields (first name, last name, email, phone, company) |
| Contact saved (edit) | FEAT-01.SPEC-002 (Contact Edit) | Always on successful validation | All contact fields, previous values for changed fields |

An external-event trigger row (for an automation fired by an Integration spec's inbound event) looks like:
| Payment failed event received | FEAT-05.SPEC-004 (Payment Collection Integration) | Fires when the payment-processing capability reports a failed charge for an open invoice | Invoice reference, failure reason, attempted amount |
END EXAMPLE -->

## Processing Logic

{Step-by-step functional description of what the automation does. Purely functional -- no implementation details. Describe what data is read, what comparisons or evaluations are performed, what decisions are made, and in what order.}

1. {Step 1}
2. {Step 2}
3. {Step N}

<!-- EXAMPLE (duplicate detection):
1. Receive the contact data from the triggering screen (all fields submitted by the user).
2. Compare the new contact's first name, last name, and email against all existing contacts.
3. For each existing contact, calculate a match score based on:
   - Exact match on email: high confidence
   - Exact match on first name + last name: high confidence
   - Partial match on last name + similar first name: medium confidence
   - Same company + similar name: low confidence
4. Filter results to contacts with medium or high confidence scores.
5. If one or more matches found, return the list of potential duplicates to the triggering screen.
6. If no matches found, signal the triggering screen to proceed with save.
END EXAMPLE -->

## Outcome Definitions

{Every possible outcome of the processing logic. Each outcome specifies what happens to data, what the user sees, and which specs are affected.}

| Outcome | Condition | Data Changes | User Feedback | Affected Specs |
|---------|-----------|-------------|---------------|----------------|
| {Outcome name} | {When this outcome occurs} | {What data is created/updated/deleted} | {What the user sees, if anything} | {Which specs show the feedback} |

<!-- EXAMPLE (duplicate detection):
| Outcome | Condition | Data Changes | User Feedback | Affected Specs |
|---------|-----------|-------------|---------------|----------------|
| No duplicates found | Zero matches above threshold | None | Save completes normally | FEAT-01.SPEC-001 or FEAT-01.SPEC-002 (triggering screen) |
| Possible duplicates | 1+ matches above threshold | None (pending user decision) | Modal showing potential matches with "Keep Both" / "Review" options | FEAT-01.SPEC-001 or FEAT-01.SPEC-002 |
| User chooses "Keep Both" | User taps Keep Both on duplicate modal | Original save proceeds | Contact saved, toast "Contact created" | FEAT-01.SPEC-001 or FEAT-01.SPEC-002 |
| User chooses "Review" | User taps Review on duplicate modal | Save cancelled | Navigate to existing contact for comparison | FEAT-01.SPEC-002 |
| Automation failure | Processing error | None | Save completes with warning: "Duplicate check unavailable" | FEAT-01.SPEC-001 or FEAT-01.SPEC-002 |
END EXAMPLE -->

## Data Model

{What data this automation reads, creates, or modifies. References shared entity definitions from the Feature Dependency Map.}

**Reads:** {Entity name -- which fields and why}
**Creates:** {Entity name -- what new data, if any}
**Updates:** {Entity name -- what changes, if any}
**Deletes:** {Entity name -- what removals, if any}

<!-- EXAMPLE (duplicate detection):
**Reads:** Contact records -- all fields (first name, last name, email, phone, company) for comparison against existing contacts.
**Creates:** None -- duplicate detection does not persist match results.
**Updates:** None.
**Deletes:** None.
END EXAMPLE -->

## Business Rules

{Rules governing the automation's behavior. Thresholds, matching criteria, priority rules, timing constraints.}

- {Rule description. Reference by XBR-NN ID where applicable.}

<!-- EXAMPLE (duplicate detection):
- Duplicate detection is non-blocking: if the automation fails, the save proceeds with a warning rather than failing.
- Match thresholds are fixed: high confidence requires exact match on email OR exact match on first name + last name. Medium confidence requires partial match on last name + similar first name.
- The automation runs synchronously -- the triggering screen waits for the result before completing the save.
- Maximum 10 potential matches shown to the user, ordered by confidence score (highest first).
END EXAMPLE -->

## Edge Cases

{What happens when inputs are unexpected, processing fails, or the automation is unavailable. Each as scenario-to-expected-behavior. Every automation whose runs can overlap must include two concurrency entries: (1) concurrent trigger firing -- two triggers fire against the same data at effectively the same time -- and (2) a trigger fires while a previous run is still in flight. Where overlap is genuinely impossible, state why as the expected behavior rather than omitting the entry.}

- **{Scenario}** -- {Expected behavior.}

<!-- EXAMPLE (duplicate detection):
- **Contact has no email** -- Comparison uses name fields only. Match confidence may be lower.
- **All fields are common values** -- Large number of low-confidence matches. Capped at 10 results with a note: "Showing top 10 of {N} potential matches."
- **Existing contact data is incomplete** -- Comparison skips empty fields on existing records. A contact with no email cannot match on email.
- **Automation times out** -- Save proceeds with warning: "Duplicate check took too long. Your contact was saved -- check for duplicates manually."
- **Concurrent trigger firing (two saves of similar contacts at effectively the same time)** -- Each save runs its own duplicate check independently. The check that starts second includes the record committed by the first, so the later save surfaces the earlier one as a potential duplicate. Neither save is blocked by the other.
- **Trigger fires while a previous run is in flight** -- A second run for the same record cannot start while the first is in flight: the triggering screen's Save is disabled during save (FEAT-01.SPEC-001, FEAT-01.SPEC-002). Runs for different records proceed independently and do not queue behind each other.
END EXAMPLE -->

## Connected Specs

{What triggers this automation and what it affects.}

| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| {FEAT-NN.SPEC-NNN (Name)} | {Triggered by \| Affects \| References} ({inbound \| outbound}) | {What the connection does} |

<!-- EXAMPLE (duplicate detection):
| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| FEAT-01.SPEC-001 (Contact Create) | Triggered by (inbound) | Fires on successful validation during create save |
| FEAT-01.SPEC-002 (Contact Edit) | Triggered by (inbound) | Fires on successful validation during edit save |
| FEAT-01.SPEC-001 (Contact Create) | Affects (outbound) | Returns duplicate results to create screen |
| FEAT-01.SPEC-002 (Contact Edit) | Affects (outbound) | Returns duplicate results to edit screen |
END EXAMPLE -->

## Analytics and Success Signals

{The events this automation should emit, in functional terms: event name plus the properties it carries. Automations typically emit outcome counters -- one event per meaningful outcome path. Each event cites the Stage 2 metric it feeds by exact name (Stage 2 metrics carry no ID prefix; the metric's Connected Feature field ties it to this feature). "N/A -- {reason}" is legal for an event slot with no corresponding metric; the section is never absent.}

- **{event_name}** ({properties}) -- supports success-metrics.md: "{exact metric name}"

<!-- EXAMPLE (duplicate detection):
- **duplicate_check_completed** (result: no_matches / matches_found; match_count) -- supports success-metrics.md: "Duplicate Prevention Effectiveness"
- **duplicate_resolution_chosen** (choice: keep_both / review) -- supports success-metrics.md: "Duplicate Prevention Effectiveness"
- **duplicate_check_failed** (reason: timeout / processing_error) -- supports success-metrics.md: "Contact Capture Speed" (a failed check must never slow or block entry -- this event measures how often the non-blocking guarantee is exercised)
END EXAMPLE -->

## Acceptance Criteria

{Given/When/Then statements covering every trigger path x outcome path combination. Persona-grounded.}

**{FEAT-NN.SPEC-NNN}-AC-01:** Given {persona name} {context}, when {trigger}, then {observable outcome}.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Trigger Paths | {N} | {N} |
| Outcome Paths | {N} | {N} |
| Business Rules | {N} | {N} |
| Edge Cases | {N} | {N} |

<!-- EXAMPLE (duplicate detection):
**FEAT-01.SPEC-004-AC-01:** Given Sarah has filled in a new contact with first name "Jane" and last name "Doe", when she taps Save and an existing contact named "Jane Doe" exists, then a modal appears showing the existing contact as a potential duplicate with "Keep Both" and "Review" options.

**FEAT-01.SPEC-004-AC-02:** Given Sarah sees the duplicate detection modal showing one potential match, when she taps "Keep Both", then the new contact is saved and she sees a "Contact created" toast.

**FEAT-01.SPEC-004-AC-03:** Given Sarah has filled in a new contact with a unique name and email, when she taps Save, then duplicate detection runs and finds no matches, and the contact is saved normally.

**FEAT-01.SPEC-004-AC-04:** Given Sarah taps Save on a new contact and the duplicate detection service is unavailable, when the automation times out, then the contact is saved with a warning: "Duplicate check unavailable."

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Trigger Paths | 2 (create, edit) | 2 |
| Outcome Paths | 4 (no match, match found, keep both, automation failure) | 4 |
| Business Rules | 3 | 3 |
| Edge Cases | 6 | 6 |
END EXAMPLE -->
