<!-- Agent: spec-writer (spec_type: automation)
     When: @-include when writing Automation specs.
     Purpose: 5-phase methodology for producing spec-automation.md documents.
     Prerequisite: Feature Breakdown Brief (feature-overview.md) must be loaded as context. -->

# Automation Spec Writing Methodology

Prescriptive 5-phase methodology for producing detailed Automation spec documents. Each phase builds on the previous. Follow phases in order -- do not skip or reorder.

---

## Phase 1 -- Absorb and Anchor

Read the Feature Breakdown Brief. Build understanding of this automation's role before writing anything.

**Step 1: Understand the user impact.**
Read the persona summary. Even though automations run without direct user interaction, they produce outcomes the user sees. What does the persona expect to happen? What would confuse or frustrate them?

**Step 2: Understand this automation's role.**
What does the Feature Breakdown Brief say about this automation? What Key Capabilities does it serve? What is its primary purpose -- data processing, validation, notification, synchronization, calculation?

**Step 3: Understand triggers.**
What specs trigger this automation? Identify every trigger source by FEAT-NN.SPEC-NNN ID. What user actions, system events, or external events (arriving through an Integration spec) cause this automation to fire?

**Step 4: Understand effects.**
What specs are affected by this automation's outcomes? Which screens show the results? Which entities are modified? What notifications fire?

**Output:** No written artifact. This phase builds the context carried through all subsequent phases.

**Guidance:** Do not start writing the spec yet. Automations with incomplete trigger or outcome understanding produce specs that miss failure paths.

---

## Phase 2 -- Trigger Categorization

Map every trigger path for this automation. Categorize each trigger and define its complete context.

### Trigger Categories

**User-initiated triggers:**
A specific user action on a specific screen causes this automation to fire.
- Source: The screen spec (by ID) and the specific interaction
- Example: "User taps Save on FEAT-01.SPEC-001 (Contact Create)"
- Data available: All fields the user entered plus any auto-populated values

**Event-driven triggers:**
A data state change causes this automation to fire, regardless of which screen or process caused the change.
- Source: The entity and operation that triggers it
- Example: "A contact record is created or updated (from any source)"
- Data available: The entity's current field values, plus previous values if update

**Schedule-based triggers:**
A time-based schedule causes this automation to fire.
- Source: The schedule definition
- Example: "Daily at midnight," "Every 15 minutes," "First of each month"
- Data available: Current date/time, plus whatever the automation queries

**Threshold-based triggers:**
A metric or count crossing a defined threshold causes this automation to fire.
- Source: The metric and its threshold
- Example: "When unread notifications exceed 50," "When storage usage exceeds 80%"
- Data available: Current metric value, threshold value, related entities

**External-event triggers:**
Something outside the product reports that something happened, and the report causes this automation to fire. Discovery questions: does anything outside the product tell it something happened -- payment events, inbound email, sync completion, token expiry?
- Source: The Integration spec (by FEAT-NN.SPEC-NNN ID) whose Inbound Events section defines the event
- Example: "The payment-processing capability reports a failed charge (FEAT-05.SPEC-004, Payment Collection Integration)"
- Data available: The event data declared in the Integration spec's Inbound Events section -- never more than that spec's Data Exchanged section admits into the product

### Trigger Definition Table

For each trigger, define:

| Trigger | Category | Source Spec | Conditions | Available Data |
|---------|----------|------------|------------|----------------|
| {what fires it} | {user/event/schedule/threshold/external} | {FEAT-NN.SPEC-NNN or "system"} | {when it fires} | {what data is available} |

**Output:** Trigger Definition section of the spec.

---

## Phase 3 -- Logic Extraction

Define the step-by-step processing logic for each trigger path. All descriptions must be functional -- describe what happens, not how it is implemented.

**Step 1: Define the processing steps.**
What does the automation do, in order? Each step should be a discrete, describable action:
- "Read all existing contacts from the data store"
- "Compare the new contact's first name, last name, and email against each existing contact"
- "Calculate a similarity score for each comparison"

Do NOT use technical implementation language: no SQL queries, no API calls, no framework references. Describe functionally.

**Step 2: Define decision points.**
Where does the processing logic branch? What conditions determine which path is taken?
- "If similarity score exceeds 80%, classify as potential duplicate"
- "If zero matches found, proceed to success path"

**Step 3: Define data transformations.**
What data does the automation create, modify, or derive?
- What new records are created?
- What existing records are updated (which fields)?
- What calculated values are produced?

**Step 4: Define side effects.**
What happens beyond the primary data changes?
- Are notifications sent? To whom? With what content?
- Are related entities updated? Which ones, how?
- Are counters, aggregates, or derived values recalculated?

**Output:** Processing Logic section of the spec.

---

## Phase 4 -- Outcome Definition and Cross-Reference

Define every possible outcome and verify connections to other specs.

### Outcome Paths

For every possible result of the processing logic, define:

**Success path:** The automation completes normally.
- What data changes persist?
- What does the user see (if anything)? On which screen (by spec ID)?
- What notifications fire?

**Partial/ambiguous path:** The automation produces an uncertain result (not all automations have this).
- What does the user see? What decisions are presented?
- What data is in a pending state?
- What happens if the user ignores the ambiguous result?

**No-action path:** The automation determines no action is needed.
- What does the user see (if anything)?
- Is the "no action" result logged or silent?

**Failure path:** The automation itself fails.
- What does the user see? Is it blocking (prevents the triggering action) or non-blocking (warning only)?
- Is the failure retried automatically? How many times?
- What data state is left behind? Is it consistent?
- Does the triggering screen need to revert any optimistic updates?

### Outcome Definition Table

| Outcome | Condition | Data Changes | User Feedback | Affected Specs |
|---------|-----------|-------------|---------------|----------------|
| {outcome name} | {when this occurs} | {what changes} | {what user sees} | {spec IDs affected} |

### Cross-Reference Verification

**Step 1: Verify trigger sources.**
For every trigger source spec, verify that the source spec mentions this automation in its Interactions section. For an external-event trigger, verify that the Integration spec's Inbound Events section names this automation among its Affected Specs. Flag any missing reference.

**Step 2: Verify outcome targets.**
For every spec affected by an outcome, verify that the affected spec accounts for this automation's results (e.g., the screen spec shows the automation's success/failure feedback). Flag any missing reference.

**Step 3: Verify entity consistency.**
Cross-reference all entity operations against the dependency map. Field names, field types, and entity names must match exactly.

**Output:** Outcome Definitions section, Connected Specs section, Data Model section of the spec.

---

## Phase 5 -- Assembly and Self-Verification

Fill the spec-automation.md template and verify completeness.

**Step 1: Write frontmatter.**
Complete all frontmatter fields with accurate values.

**Step 2: Write Acceptance Criteria.**
Cover every trigger path x outcome path combination with at least one Given/When/Then criterion. This discipline applies to every trigger category, including external-event triggers: every inbound event this automation handles must appear in at least one criterion per outcome it can produce.

Ground all criteria in the persona: "Given Sarah has just saved a new contact..."

For automations, acceptance criteria often follow the pattern:
- "Given [trigger condition], When [trigger fires], Then [processing occurs] and [outcome is visible]"

**Step 3: Build Coverage Summary Table.**
Tally: Trigger paths covered, Outcome paths covered, Business Rules covered, Edge Cases covered.

**Output:** Complete spec file ready for quality review.

### Self-Verification Checklist

Before finalizing the spec file, verify against all four categories.

**Structural Completeness:**
- [ ] All required sections present and non-empty (per Automation spec template)
- [ ] Frontmatter complete with accurate counts
- [ ] Trigger Definition table has all trigger paths
- [ ] Outcome Definitions table has all outcome paths

**Coverage:**
- [ ] Every trigger path has at least one acceptance criterion
- [ ] Every outcome path has at least one acceptance criterion
- [ ] Every trigger x outcome combination is addressed (either with a criterion or explicit N/A) -- external-event triggers included
- [ ] Failure path is defined with user-visible behavior
- [ ] Edge Cases include the two concurrency entries (concurrent trigger firing; trigger fires while a previous run is in flight) or state why overlap is impossible

**Consistency:**
- [ ] Processing logic is fully functional (no implementation details, no framework references)
- [ ] Connected spec references use exact FEAT-NN.SPEC-NNN identifiers
- [ ] Entity references match the dependency map exactly
- [ ] Trigger sources match the Feature Breakdown Brief's declared connections
- [ ] External-event triggers name the owning Integration spec by exact ID
- [ ] Every analytics event cites its Stage 2 metric by exact name (or carries an explicit N/A with reason)

**Clarity:**
- [ ] Processing steps are ordered and deterministic
- [ ] Decision points have explicit conditions (no "as appropriate" or "as needed")
- [ ] Every outcome has concrete user-visible feedback specified
- [ ] No vague adjectives in acceptance criteria

---

## Decision Rules

### When an automation should be standalone vs. inline in a screen spec

**Standalone Automation spec when:**
- The automation has multiple triggers (fired from more than one screen or event)
- The processing logic involves multiple steps, comparisons, or calculations
- The automation has multiple possible outcomes (success, partial, failure)
- The automation affects entities or specs beyond the triggering screen
- The automation is shared across features

**Inline in a Screen spec when:**
- The automation is a simple, single-step consequence of one screen action
- It has no failure modes beyond the screen's general error handling
- It only affects data visible on the triggering screen
- It cannot be triggered from any other source

### When to split an automation spec into two

Split when an automation has fundamentally different trigger types that require different processing logic. Example: "Daily batch recalculation" and "On-demand recalculation triggered by user" may share the calculation logic but differ in trigger handling, error recovery, and user feedback. If they share >80% of processing logic, keep as one spec with multiple trigger paths. If they share <50%, split into two specs.
