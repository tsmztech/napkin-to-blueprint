<!-- Agent: spec-writer (spec_type: integration)
     When: @-include when writing Integration specs.
     Purpose: 5-phase methodology for producing spec-integration.md documents.
     Prerequisite: Feature Breakdown Brief (feature-overview.md) must be loaded as context. -->

# Integration Spec Writing Methodology

Prescriptive 5-phase methodology for producing detailed Integration spec documents. An Integration spec defines the product's contract with an external capability -- what the product sends, receives, and how it behaves toward the user -- in purely functional terms. Each phase builds on the previous. Follow phases in order -- do not skip or reorder.

---

## Phase 1 -- Capability Identification and Anchoring

Read the Feature Breakdown Brief. Anchor this integration in the Stage 2 record of the dependency before writing anything.

**Step 1: Trace the capability to its Stage 2 dependency.**
Find the Dependencies entry (ASMP-XX) in assumptions-constraints.md that establishes this external capability, and the matching row in the Feature Dependency Map's External Touchpoints table. The capability category must use the capability-category vocabulary from pipeline-rules.md (payments, identity, email, calendar, AI, maps, storage, ...). If no ASMP entry or External Touchpoints row exists, stop and flag it -- an integration without a Stage 2 source is an invented dependency.

**Step 2: Check for a vendor mandate.**
Read BRIEF.md. If the user mandated a specific vendor there, record it in the Capability Category section with its BRIEF.md citation. Otherwise the spec stays vendor-neutral throughout: "the payment-processing capability", never a product name. Vendor selection is a Stage 4 decision made on merit with documented alternatives.

**Step 3: Understand the user impact.**
Read the persona summary. Where does this capability show up in the persona's day? What do they expect when it works, and what would erode their trust when it does not? Which roles interact with behavior this capability enables (from the Access Matrix slice in the context package)?

**Step 4: Understand connected specs.**
Which screens trigger requests to this capability or display its results? Which automations consume its inbound events? Which notifications result from them? Identify every connection by FEAT-NN.SPEC-NNN ID.

**Output:** No written artifact (Capability Category section content is now known). This phase builds the context carried through all subsequent phases.

**Guidance:** Do not start writing the spec yet. Integrations anchored only in "products like this usually have one" produce dependencies Stage 4 cannot justify.

---

## Phase 2 -- Product Behaviors and Data Exchange

Define why the product needs this capability and exactly what crosses the boundary.

**Step 1: Map enabled behaviors.**
For every product behavior that exists because of this capability, record: the behavior in user terms, the Brief capability it serves (from the Capability Coverage Map), and the spec that delivers it to the user (by ID). A capability enabling no behavior is not a dependency -- flag it.

**Step 2: Define data leaving the product.**
For each outbound data element: the exact entity and fields (dependency-map vocabulary), when it is sent, and why the capability needs it. Apply a minimization discipline: every outbound field must have a stated purpose; a field without a purpose is not sent. Close with an explicit statement of what never leaves the product.

**Step 3: Define data entering the product.**
For each inbound data element: what it is, which event delivers it, and exactly which entity and fields it lands in. Inbound data with no landing place means either a missing field in the dependency map (flag it) or data the product should not accept.

**Step 4: Note consent implications.**
For every outbound data element, note whether the user knows it is shared. These notes feed Phase 4's disclosure walk -- nothing may leave the product that no disclosure covers.

**Output:** Product Behaviors Enabled section, Data Exchanged section.

---

## Phase 3 -- Inbound Events

Define everything the outside world can tell the product through this capability, reusing automation outcome thinking: every event is condition + data changes + user feedback + affected specs.

**Step 1: Enumerate the events.**
What can the capability report? Work from the behaviors in Phase 2: each behavior implies at least a success report and a failure report. Probe beyond the obvious pair: delayed confirmations, reversals (refunds, cancellations), expiry of something the capability granted, partial results.

**Step 2: Define each event's consequence.**
For each event: the condition under which it arrives, the data changes (exact entities and fields), the user feedback (exact wording, on which screen by spec ID), and the affected specs. Silent events are a decision, not an omission -- state "no user feedback" explicitly where that is the design.

**Step 3: Route complex processing to automations.**
If an event's handling involves multi-step logic, branching decisions, or multiple outcomes, the processing belongs in an Automation spec with an external-event trigger naming this Integration spec as its source. The Inbound Events row then lists that automation in Affected Specs. Keep in this spec only the direct consequence (status field updates, simple feedback).

**Step 4: Probe delivery imperfections.**
For each event, ask: what if it arrives twice? Out of order relative to related events? For an entity that has since been deleted or changed? These answers become Edge Cases entries.

**Output:** Inbound Events section, plus the event-related Edge Cases entries.

---

## Phase 4 -- Degradation and Consent Walk

Walk every affected screen through capability trouble, then walk the user through every disclosure moment.

**Step 1: Enumerate affected screens.**
List every screen (by spec ID) that sends requests to this capability or displays its results. This list comes from Phases 2 and 3 -- no screen may appear in those sections and be missing here.

**Step 2: Walk each screen through the three degradation conditions.**
For each screen x condition (capability slow / capability down / capability rejects), define the concrete user experience: what the user sees (exact message), what still works, what is blocked, and what is queued for later. "N/A -- {reason}" is legal only where a condition genuinely cannot affect that screen (e.g., a screen that never sends requests cannot be rejected). Degraded states must leave data consistent -- no half-created records.

**Step 3: Walk the disclosure moments.**
Using Phase 2's consent notes: when is the user told what data is shared, in exactly what words, and what can they do about it (proceed, cancel, revisit later)? Include disclosures aimed at non-user parties who interact with capability-backed behavior (e.g., an external recipient of a payment request), and state what the product never shares. Every outbound data element from Data Exchanged must be covered by a disclosure entry.

**Output:** Degradation Behavior section, Consent and Disclosure section, plus degradation-related Edge Cases entries.

---

## Phase 5 -- Assembly and Self-Verification

Fill the spec-integration.md template and verify completeness.

**Step 1: Write frontmatter.**
Complete all frontmatter fields with accurate values (spec_type: integration).

**Step 2: Write Acceptance Criteria.**
Cover every product behavior, every inbound event x consequence, every degradation path per affected screen, and every disclosure moment with at least one Given/When/Then criterion. Ground all criteria in the persona: "Given Sarah is viewing an open invoice..."

**Step 3: Build Coverage Summary Table.**
Tally: Product Behaviors, Inbound Events, Degradation Paths, Consent and Disclosure, Edge Cases.

**Step 4: Verify bidirectional connections.**
Every spec named in Connected Specs, Inbound Events, Product Behaviors Enabled, and Degradation Behavior must reference this spec back (screens in their Interactions/Business Rules, automations in their Trigger Definition, notifications in their Trigger). Flag any missing reference.

**Output:** Complete spec file ready for quality review.

### Self-Verification Checklist

Before finalizing the spec file, verify against all four categories.

**Structural Completeness:**
- [ ] All required sections present and non-empty (per Integration spec template)
- [ ] Frontmatter complete with accurate counts
- [ ] Capability Category carries all four labeled fields (Category, Dependency Source, External Touchpoint, Vendor Mandate)
- [ ] Data Exchanged covers both directions and states what never leaves the product

**Coverage:**
- [ ] Every product behavior has at least one acceptance criterion
- [ ] Every inbound event has at least one acceptance criterion
- [ ] Every degradation path (screen x condition, excluding justified N/A cells) has at least one acceptance criterion
- [ ] Every outbound data element is covered by a Consent and Disclosure entry
- [ ] Edge Cases cover duplicate delivery, out-of-order arrival, and events for missing entities

**Consistency:**
- [ ] The capability category traces to an ASMP-XX Dependencies entry and an External Touchpoints row
- [ ] Vendor names appear only under a recorded BRIEF.md mandate -- otherwise category vocabulary throughout
- [ ] Entity and field references match the dependency map exactly
- [ ] Connected spec references use exact FEAT-NN.SPEC-NNN identifiers and are bidirectional
- [ ] Events routed to automations name automations whose Trigger Definition names this spec as source
- [ ] Every analytics event cites its Stage 2 metric by exact name (or carries an explicit N/A with reason)

**Clarity (ambiguity scan):**
- [ ] Every degradation cell and disclosure has exact user-facing wording -- no "an appropriate message" or "a suitable notice"
- [ ] No vague adjectives ("appropriate," "user-friendly," "graceful") anywhere in the spec
- [ ] No technical interface vocabulary -- the contract reads as product behavior a non-technical stakeholder can follow
- [ ] Every pronoun has an unambiguous referent; every actor in every sentence is named

---

## Decision Rules

### When a dependency warrants an Integration spec

Every capability-category dependency the feature relies on (per the External Touchpoints table) gets exactly one Integration spec in the feature that owns the relationship. Do not create Integration specs for behavior that is internal to the product -- an automation that only moves the product's own data needs no Integration spec, no matter how complex.

### When two features share one capability

The feature that owns the primary relationship (per the External Touchpoints table's Features Involved column, first listed) carries the Integration spec; other features reference it by ID in their Connected Specs and Briefs. Split into per-feature Integration specs only when the features exchange genuinely different data with the capability for different behaviors -- and cross-reference the sibling spec in Scope and Non-Goals to keep the boundary explicit.

### When inbound-event handling belongs in an Automation spec

Keep event handling inline in this spec when the consequence is direct: a status field updates and a screen reflects it. Route to a standalone Automation spec (with an external-event trigger citing this spec) when handling involves multi-step processing, branching outcomes, effects across multiple entities, or user decisions -- the same standalone test the automation methodology applies to screen-triggered logic.
