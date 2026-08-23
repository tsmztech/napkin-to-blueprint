<!-- Agent: spec-writer (spec_type: screen)
     When: @-include when writing Screen specs.
     Purpose: 5-phase methodology for producing spec-screen.md documents.
     Prerequisite: Feature Breakdown Brief (feature-overview.md) must be loaded as context. -->

# Screen Spec Writing Methodology

Prescriptive 5-phase methodology for producing detailed Screen spec documents. Each phase builds on the previous. Follow phases in order -- do not skip or reorder.

---

## Phase 1 -- Absorb and Anchor

Read the Feature Breakdown Brief. Build understanding across four dimensions before writing anything:

**Step 1: Understand the users and roles.**
Read the persona summary and the Access Matrix slice in the context package. What are the users' goals, frustrations, and technical comfort level? Which roles can reach this screen, and with what access levels? Every screen decision must serve these personas -- and the Access and Visibility section must cover every role from the Access Matrix, plus unauthenticated and expired-session states.

**Step 2: Understand this screen's role.**
Where does this screen fit in the feature's internal flow? What is its primary purpose? What Key Capabilities does it serve (from the Feature Breakdown Brief's Capability Coverage Map)?

**Step 3: Understand dependencies.**
What specs depend on this one (navigating here, consuming data from here)? What specs does this one depend on (data sources, triggered automations, referenced rules)? Use exact FEAT-NN.SPEC-NNN identifiers.

**Step 4: Understand shared context.**
What shared entities (from the dependency map) does this screen create, read, or update? Note the dependency map's Contention entries for those entities -- they determine whether this screen needs concurrent-edit conflict behavior. What shared UI patterns does the Feature Breakdown Brief declare (e.g., "create and edit share a form")? What validation rules apply (reference Logic/Rule spec by ID if one exists)?

**Output:** No written artifact. This phase builds the context carried through all subsequent phases.

**Guidance:** Do not start writing the spec yet. Incomplete context absorption leads to specs that contradict their sibling specs or miss connections.

---

## Phase 2 -- Derive the Layout

Starting from the spec's purpose and Key Capabilities, determine what elements appear on this screen.

**Step 1: Identify primary content areas.**
What is the main content of this screen? A form? A list? A detail view? A dashboard? A multi-step wizard?

**Step 2: Identify supporting elements.**
What secondary elements support the primary content? Navigation, headers, action buttons, filters, search, status indicators, contextual information.

**Step 3: Apply shared patterns.**
If the Feature Breakdown Brief declares shared UI patterns (e.g., "create and edit share a form layout"), this screen's layout must be consistent with its sibling. Note any deviations and justify them.

**Step 4: Describe spatial relationships.**
Use structural language: "above," "below," "left of," "grouped with," "at the top of," "in the footer area." Do not use subjective language ("prominently displayed," "easily accessible"). Focus on what and where, not how it looks (visual treatment comes from the design system).

**Output:** Layout Description section of the spec.

---

## Phase 3 -- Interrogate the Screen

Work through seven systematic question categories. Every question must be answered -- either with a concrete specification or with an explicit "not applicable" with rationale.

### Data Questions

- What data is displayed on this screen? Where does each data element come from (which entity, which field)?
- What data does the user input? What format is each input (text, number, date, selection, toggle)?
- What happens when data is null, empty, or malformed? (Feeds into States section)
- If data comes from another spec or feature, what happens when that data is unavailable?

### State Questions

- What does this screen look like with zero data (empty state)?
- What does this screen look like while data is loading?
- What does this screen look like when a data load fails (error state)?
- What does the user see, and what can they still do, without connectivity (offline/degraded state)? Is anything queued for submission when connectivity returns? ("Not applicable with rationale" remains a valid answer -- but the States row must exist.)
- If the user exits mid-action, what is preserved? (Draft persistence, unsaved changes warning)
- If this is a multi-step flow, what are the valid transitions? Can the user go back? Skip steps?

### Integration Questions

- Does this screen navigate to another spec? Which one (by FEAT-NN.SPEC-NNN ID)?
- Does another spec navigate here? What context does it carry (parameters, pre-filled data)?
- Does this screen consume data from a shared entity? Which fields specifically?
- Does this screen trigger an automation (by FEAT-NN.SPEC-NNN ID)? What does the user see while the automation runs?

### Validation Questions

- What input rules apply? Reference the Logic/Rule spec by ID if one exists for this feature, or define inline if simple.
- When are rules checked? On field blur, on form submit, on value change?
- What error messages appear for each validation failure? Are they field-level, form-level, or both?
- What feedback does the user see on successful submission? (Success message, redirect, updated data)

### Concurrency Questions

- What happens if the underlying record changed between load and save? (Stale write behavior: last-write-wins, reject-with-refresh, or merge -- state which, consistent with the dependency map's Contention note for the entity.)
- Can another user's change appear while this screen is open? Is the screen live-updating or a snapshot?
- What does the user see when their action conflicts with another user's change? (Exact message or experience -- feeds the concurrent-edit conflict entry in Edge Cases.)

### Accessibility and Responsive Questions

- What is this screen's focus order, what is announced to assistive technology on dynamic changes (validation errors, loading, success), and do any pointer-only gestures need keyboard alternatives?
- How does each layout region adapt across the design system's named breakpoints? ("Uniform scaling, no structural change" is an acceptable answer.)

### Edge Case Questions

- What if there is more content than fits on screen? (Scrolling, pagination, truncation)
- What if the user does things out of the expected order? (Skipping steps, navigating directly)
- What if the user performs the same action twice rapidly? (Double-submit prevention)
- What if the user navigates away and comes back? (State preservation, re-fetch)

**Output:** Interactions section (including the Accessibility Notes subsection), States section, Validation Rules section, Edge Cases section, and the Responsive Behavior subsection of the spec.

---

## Phase 4 -- Cross-Reference

Verify consistency with sibling specs and the broader feature context.

**Step 1: Verify entity consistency.**
Cross-reference against the dependency map's shared data entity definitions. If this screen creates or updates a shared entity, the spec's data model must match the dependency map exactly (same field names, same field types). If this screen only reads a shared entity, reference the exact fields consumed.

**Step 2: Verify spec connections.**
For every Connected Spec listed in the Feature Breakdown Brief for this spec, verify bidirectional references:
- If this spec navigates to Spec X, does Spec X list this spec as an entry point?
- If this spec triggers Automation Y, does Automation Y list this spec as a trigger source?
- If this spec references Logic/Rule Z, does Logic/Rule Z list this spec in its "Enforced By" table?

Flag any missing bidirectional reference as a finding for the Quality Reviewer.

**Step 3: Verify cross-feature references.**
For any cross-feature references (navigation to or data from other features), use exact FEAT-NN.SPEC-NNN identifiers. Reference cross-feature business rules by Rule ID from the dependency map.

**Output:** Connected Specs section, Data Model section, Business Rules section of the spec. Annotations on any bidirectional reference gaps.

---

## Phase 5 -- Assembly

Fill the spec-screen.md template with all content produced in Phases 2-4.

**Step 1: Write frontmatter.**
Complete all frontmatter fields with accurate values. Count acceptance criteria after writing them.

**Step 2: Write Acceptance Criteria.**
For each interaction, write at least one Given/When/Then criterion. For every non-default state (empty, error, loading), write at least one criterion. For every business rule, write at least one criterion.

Ground all criteria in the persona: use the persona's name (e.g., "Given Sarah is on the contact create screen..."), and name the role where behavior differs by role.

**Step 3: Build Coverage Summary Table.**
Tally items covered vs. total for: Interactions, States, Business Rules, Edge Cases. Every row should show full coverage.

**Output:** Complete spec file ready for quality review.

---

## Phase 5.5 -- Self-Verification Checklist

Before finalizing the spec file, verify against all four categories. Do not submit a spec that fails any Structural Completeness or Coverage check.

### Structural Completeness

- [ ] All required sections present and non-empty (per Screen spec template)
- [ ] Frontmatter complete with accurate counts
- [ ] Every interactive element in the Layout Description has at least one interaction
- [ ] Display-only elements are explicitly noted as non-interactive
- [ ] Access and Visibility table covers every role from the context package's Access Matrix plus unauthenticated and expired-session states (single-role products: one row plus "single-role product — no restricted elements")
- [ ] Responsive Behavior subsection present under Layout and Content, stating how each region adapts across the design system's named breakpoints
- [ ] Accessibility Notes subsection present under Interactions, covering focus order, announced messages for dynamic changes, and keyboard alternatives for pointer-only gestures
- [ ] Analytics and Success Signals section present (events, or "N/A — {reason}")

### Coverage

- [ ] Key Capabilities assigned to this spec (from Feature Breakdown Brief) are all accounted for in interactions or layout
- [ ] Journey steps involving this screen have corresponding interactions
- [ ] Every non-default state (empty, loading, error) has at least one acceptance criterion
- [ ] States table includes an Offline/Degraded row (or "N/A — {reason}" in its Appearance cell)
- [ ] If this screen updates shared entities (per the dependency map's Contention notes), Edge Cases include a concurrent-edit conflict entry stating the resolution behavior
- [ ] Every interaction has at least one acceptance criterion
- [ ] Every business rule has at least one acceptance criterion

### Consistency

- [ ] Shared entity references use exact names and fields from the dependency map
- [ ] Connected spec references use exact FEAT-NN.SPEC-NNN identifiers
- [ ] Shared UI patterns match the Feature Breakdown Brief's declarations
- [ ] If a Logic/Rule spec exists for this feature, validation references point to it by ID
- [ ] Navigation connections match the Feature Breakdown Brief's internal dependency map
- [ ] Every role named in the spec appears in the context package's Access Matrix slice -- no invented roles

### Clarity

- [ ] No vague adjectives ("appropriate," "user-friendly," "efficient") in interactions or acceptance criteria
- [ ] Every acceptance criterion has a concrete, observable outcome
- [ ] Every validation rule has a specific error message
- [ ] Layout uses spatial language, not subjective language
- [ ] Every analytics event cites the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}"

---

## Decision Rules

### When to split a screen spec into two

Split when a screen has two distinct primary purposes that serve different Key Capabilities. Indicators:
- The screen has two independent data-entry forms
- The screen has a list view AND a detail view that each require substantial specification
- The screen serves capabilities from different user journey steps
- The Layout Description exceeds 3 paragraphs of structured prose

Do NOT split just because a screen is complex. A screen with many interactions but one primary purpose (e.g., a form with many fields) stays as one spec.

### When an interaction warrants its own spec

An interaction becomes a separate Automation spec when:
- It involves processing logic beyond a direct data write (comparisons, calculations, evaluations)
- It involves cross-entity or cross-feature effects
- It has multiple possible outcomes (success, partial match, failure)
- It could be triggered from multiple screens

An interaction stays inline in the Screen spec when:
- It is a simple, single-step consequence (e.g., "show success toast," "navigate to list")
- It has no failure modes beyond the screen's general error handling
- It only affects data visible on this screen
