---
document_type: spec
spec_type: screen
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

# Screen Spec: {Spec Name}

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": the Feature Breakdown Brief is mandatory context -- read it before writing
  - See pipeline-rules.md constraint "grounded-roles": cover every role the product definition establishes -- every role named here must trace to BRIEF.md or the Access Matrix in user-persona.md; never invent roles
  - See pipeline-rules.md constraint "functional-language-only": no tech details (frameworks, databases, APIs); category-level capability needs (e.g., "payment processing") are allowed
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - The Feature Breakdown Brief (feature-overview.md) is mandatory context for this spec
  - Every capability assigned to this spec in the Brief's Capability Coverage Map must be accounted for
  - Use FEAT-NN.SPEC-NNN dot-notation IDs when referencing connected specs
  - Use exact entity names and fields from the Feature Dependency Map
  - Reference cross-feature business rules by XBR-NN Rule ID
  - Reference Logic/Rule specs by ID for validation behavior -- do not duplicate rules
  - Shared UI patterns must be described consistently with the Brief's Shared Context section
  - Every interactive element in the layout must have at least one interaction
  - The Access and Visibility table must cover every role from the Access Matrix (user-persona.md) plus unauthenticated and expired-session states; for a genuinely single-role product it is one row plus the line "single-role product — no restricted elements"
  - The States table must include an Offline/Degraded row -- or "N/A — {reason}" in its Appearance cell
  - Every screen that updates shared entities (per the dependency map's Contention notes) must include a concurrent-edit conflict entry in Edge Cases
  - Every analytics event must cite the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}"
  - Minimum 2 non-goals in Scope and Non-Goals section; every non-goal rationale must trace to a product decision (e.g., "excluded per scope-boundaries.md: {reason}"), never to version thrift
  - Every non-default state (empty, error, loading) must have at least one acceptance criterion
  - Platform-set policy values (deposit amounts, fee/refund percentages, time windows, prices, payout cycles -- anything fixed platform-wide and decided at build) are NEVER stated as concrete numbers: write the inline marker platform parameter: `{kebab-slug}` instead -- one slug per distinct parameter, reused verbatim at every site referencing the same value. Pass D collects every marker into specifications/platform-parameters.md with a proposed default; Gate A reconciles markers against that registry. Values that genuinely belong to one feature's own definition stay inline as before
  - Before writing, update all frontmatter fields: spec_id, spec_name, spec_slug, parent_feature, parent_feature_name, priority_tier, produced_by (spec-writer), status, created (today's date), acceptance_criteria_count
-->

## Overview

**Name:** {Spec Name}
**ID:** {FEAT-NN.SPEC-NNN}
**Type:** Screen
**Purpose:** {One sentence describing what this screen does.}
**Parent Feature:** {FEAT-NN} -- {Feature Name}

<!-- EXAMPLE (contact create):
**Name:** Contact Create
**ID:** FEAT-01.SPEC-001
**Type:** Screen
**Purpose:** User creates a new contact record by filling out a form and saving it.
**Parent Feature:** FEAT-01 -- Contact Management
END EXAMPLE -->

## Scope and Non-Goals

**In Scope:**
- {What this spec covers.}

**Non-Goals:**
- {What this spec explicitly excludes. Reference sibling specs by ID where applicable. Every exclusion carries a product-decision rationale.}
- {Second non-goal minimum.}

<!-- EXAMPLE (contact create):
**In Scope:**
- Creating a new contact record with all supported fields
- Inline field validation during entry
- Duplicate detection triggered on save

**Non-Goals:**
- Editing existing contacts -- handled by FEAT-01.SPEC-002 (Contact Edit)
- Bulk contact creation -- excluded per scope-boundaries.md: the product centers individual relationship capture, not list migration; bulk entry is a deliberate product exclusion
- Contact photo upload -- excluded per scope-boundaries.md: the product definition prioritizes fast text-first capture, and photos work against the capture-speed goal
END EXAMPLE -->

## Entry Points

{How the user arrives at this screen. Every path: navigation from another spec, deep link, default entry, redirect after action.}

| Source | Trigger | Context Carried |
|--------|---------|-----------------|
| {FEAT-NN.SPEC-NNN (Name) or external} | {User action that navigates here} | {What data or state is passed to this screen} |

<!-- EXAMPLE (contact create):
| Source | Trigger | Context Carried |
|--------|---------|-----------------|
| FEAT-01.SPEC-003 (Contact List) | User taps "New Contact" button | None -- form starts empty |
| FEAT-03.SPEC-002 (Deal Detail) | User taps "Add Contact" from deal | Deal reference pre-filled in notes |
END EXAMPLE -->

## Access and Visibility

{Who can see and act on this screen, and what anyone without access experiences. One row per role from the Access Matrix (user-persona.md), plus rows for unauthenticated and expired-session states. For a genuinely single-role product this section is exactly one row followed by the line: single-role product — no restricted elements.}

| Role/State | Can View | Can Act | Unauthorized Experience |
|------------|----------|---------|-------------------------|
| {Role from the Access Matrix} | {What this role can see: full screen, or the specific regions visible to it} | {What this role can do: all actions, specific actions, or read-only} | {Exact message or experience when this role is denied something on this screen -- or "--" when nothing is restricted for this role} |
| Unauthenticated | {Yes/No/partial} | {Yes/No} | {Exact experience: where the user is sent, what message appears, what happens to in-progress context} |
| Expired session | {Yes/No/partial} | {Yes/No} | {Exact experience, including what happens to unsaved work} |

<!-- EXAMPLE (contact create -- two-role product; roles from the Access Matrix in user-persona.md):
| Role/State | Can View | Can Act | Unauthorized Experience |
|------------|----------|---------|-------------------------|
| Sales Rep (Sarah) | Full screen | Create contacts (new contact is owned by the creating rep) | -- |
| Sales Manager (Marcus) | Full screen | Create contacts and assign ownership to any rep (owner selector visible to this role only) | -- |
| Unauthenticated | No | No | Redirected to the sign-in screen; after signing in, the user lands on the Contact List (FEAT-01.SPEC-003), not this form |
| Expired session | No | No | Dialog "Your session has expired. Sign in to continue." -- entered form data is preserved and restored after re-authentication succeeds |
END EXAMPLE -->

<!-- EXAMPLE (single-role product form):
| Role/State | Can View | Can Act | Unauthorized Experience |
|------------|----------|---------|-------------------------|
| Alex (sole user type) | Full screen | All actions | -- |

single-role product — no restricted elements
END EXAMPLE -->

## Layout and Content

{Structured prose describing what elements appear on this screen and their spatial relationship. Focus on what and where, not how it looks -- visual treatment belongs to the design layer (the user-supplied design system when the package carries one, otherwise the downstream builder's own design language). Cite a design system only when the package actually carries one at `.n2b/specifications/design-system/`; a spec must never reference design tokens, named widths, or patterns that exist in no package artifact. Every element that the user can interact with must be listed here -- it will need a corresponding interaction. Elements visible only to specific roles must say so, consistent with the Access and Visibility table.}

{Describe the layout regions (header, body, footer) and the elements within each. For forms, list all fields. For lists, describe the list item structure. For dashboards, describe the card/widget layout.}

<!-- EXAMPLE (contact create):
**Header:** Screen title "New Contact" with a back arrow (returns to contact list) and a "Save" action button (right-aligned).

**Body:** A single-column form with the following fields in order:
- First Name (text input, required)
- Last Name (text input, required)
- Email (text input, optional)
- Phone (text input, optional)
- Company (text input, optional)
- Title (text input, optional)
- Notes (multi-line text input, optional)
- Owner (selection input, visible to Sales Managers only -- defaults to the creating user)

All fields use one consistent input treatment platform-wide. Required fields are marked with a visual indicator.

**Footer:** None -- Save is in the header.
END EXAMPLE -->

### Responsive Behavior

{How each layout region adapts across screen sizes. Use the user-supplied design system's named breakpoints when the package carries one; otherwise describe behavior in design-agnostic size classes (compact / medium / expanded) and leave exact pixel values to the design layer. State the adaptation per region: what stacks, collapses, repositions, or caps in width. "Uniform scaling, no structural change" is a legal entry when the layout genuinely does not restructure.}

<!-- EXAMPLE (contact create):
- **Compact breakpoint:** Single-column form as described above, full width; Save remains in the header.
- **Medium size class and above:** Form remains single-column, capped at a consistent platform-wide form width (exact value is the design layer's decision) and horizontally centered; no structural change beyond width capping.
- **Notes field:** Grows from 3 visible lines (compact) to 5 visible lines (medium and above).
END EXAMPLE -->

## Interactions

{Every action the user can take, as trigger-to-system-response pairs. Every interactive element in the layout must have at least one interaction. Display-only elements are noted as such. Interactions available only to specific roles must say so, consistent with the Access and Visibility table.}

| Element | Trigger | Action | State Change | Feedback |
|---------|---------|--------|-------------|----------|
| {UI element name} | {User action (tap, type, swipe, etc.)} | {What the system does} | {How the screen state changes} | {What the user sees/hears} |

<!-- EXAMPLE (contact create):
| Element | Trigger | Action | State Change | Feedback |
|---------|---------|--------|-------------|----------|
| Back arrow | Tap | Navigate to FEAT-01.SPEC-003 (Contact List) | Screen closes | Animated transition back to list |
| First Name input | Type | Captures text input | Field shows entered text | Standard input focus state |
| First Name input | Blur (empty) | Triggers field validation via FEAT-01.SPEC-005 | Error state on field | "First name is required" below field |
| Owner selector (Sales Manager only) | Select | Sets the contact's owner to the chosen rep | Selector shows chosen owner | Selected owner name displayed |
| Save button | Tap | 1. Validate all fields via FEAT-01.SPEC-005. 2. If valid, trigger FEAT-01.SPEC-004 (Duplicate Detection). 3. If no duplicates, save contact. | Button shows loading state during save | Success: toast "Contact created" and navigate to FEAT-01.SPEC-003. Failure: inline error messages. |
| Save button (while loading) | Tap | No action -- debounced | None | Button remains in loading state |
END EXAMPLE -->

### Accessibility Notes

{Screen-specific accessibility expectations: focus order through the screen, what is announced to assistive technology on dynamic changes (validation errors, loading, success, content updates), and keyboard alternatives for any pointer-only gestures. The product-level accessibility baseline (assumptions-constraints.md NFRs, or the user-supplied design system when present) owns the global rules; this subsection covers only what is specific to this screen.}

<!-- EXAMPLE (contact create):
- **Focus order:** Back arrow -> First Name -> Last Name -> Email -> Phone -> Company -> Title -> Notes -> Owner selector (when visible) -> Save.
- **Validation announcements:** When a field enters an error state, its error message is announced to assistive technology and programmatically associated with the field.
- **Save feedback:** The "Contact created" toast is announced on success; on validation failure, focus moves to the first field in error.
- **Keyboard alternatives:** Every action on this screen is reachable by keyboard; there are no pointer-only gestures.
END EXAMPLE -->

## States

{Every state this screen can be in and what the user sees. Include only states relevant to this screen -- except Offline/Degraded, which must always appear as a row: what the user sees and can still do without connectivity, and whether anything is queued for later. When the product definition establishes the screen has no offline exposure, the row's Appearance cell states "N/A — {reason}".}

| State Name | Appearance | Entry Condition | Exit Condition |
|------------|-----------|-----------------|----------------|
| {State name} | {What the user sees in this state} | {What causes the screen to enter this state} | {What causes the screen to leave this state} |

<!-- EXAMPLE (contact create):
| State Name | Appearance | Entry Condition | Exit Condition |
|------------|-----------|-----------------|----------------|
| Empty (default) | All form fields empty, Save button enabled | Screen first opens | User begins typing in any field |
| Filling | Form fields contain user input, Save button enabled | User types in any field | User taps Save or navigates away |
| Validating | Save button shows loading spinner | User taps Save | Validation completes (pass or fail) |
| Validation Error | Failed fields highlighted with error messages below them | Validation fails | User corrects field and re-triggers validation |
| Saving | Save button shows loading spinner, form fields disabled | Validation passes, duplicate check passes | Save completes or fails |
| Error | Error banner at top of form with retry option | Save operation fails | User taps Retry or navigates away |
| Offline/Degraded | Banner "You're offline -- this contact will be saved when you reconnect." at top; form remains editable; Save queues the contact locally | Connectivity lost while screen is open | Connectivity restored -- queued save submits automatically and the standard success feedback appears |
END EXAMPLE -->

## Validation Rules

{For screens with user input. Either reference a Logic/Rule spec or define inline for simple validations.}

**Option A -- Reference Logic/Rule spec:**
Validation governed by {FEAT-NN.SPEC-NNN}. See that spec for all field-level rules.

**Option B -- Inline (for simple validations not warranting a standalone spec):**

| Field | Condition | When Checked | Error Message |
|-------|-----------|-------------|---------------|
| {Field name} | {Rule: required, format, length, etc.} | {On blur \| On submit \| On change} | {Exact error message text} |

<!-- EXAMPLE (contact create, using Option A):
Validation governed by FEAT-01.SPEC-005 (Contact Field Validation). See that spec for all field-level and cross-field rules. This screen applies validation on field blur and on form submit.
END EXAMPLE -->

## Navigation Out

{Where the user can go from this screen.}

| Trigger | Destination Spec | Destination Feature (if different) |
|---------|-----------------|-----------------------------------|
| {User action} | {FEAT-NN.SPEC-NNN (Name)} | {FEAT-NN (Feature Name) or --} |

<!-- EXAMPLE (contact create):
| Trigger | Destination Spec | Destination Feature (if different) |
|---------|-----------------|-----------------------------------|
| Back arrow tap | FEAT-01.SPEC-003 (Contact List) | -- |
| Successful save | FEAT-01.SPEC-003 (Contact List) | -- |
| Cancel (if unsaved changes) | FEAT-01.SPEC-003 (Contact List) after confirmation | -- |
END EXAMPLE -->

## Data Model

{What data entities this screen creates, reads, updates, or deletes. Functional description, not technical. References shared entity definitions from the Feature Dependency Map.}

**Creates:** {Entity name -- which fields are set and how}
**Reads:** {Entity name -- which fields are displayed and where they come from}
**Updates:** {Entity name -- which fields can be modified}
**Deletes:** {Entity name -- under what conditions}

<!-- EXAMPLE (contact create):
**Creates:** Contact record -- all fields (first name, last name, email, phone, company, title, notes, owner) set from form input. Created date set automatically. Owner defaults to the creating user; Sales Managers may assign any rep.
**Reads:** None (this is a creation screen -- no existing data loaded).
**Updates:** None.
**Deletes:** None.
END EXAMPLE -->

## Business Rules

{Rules governing behavior beyond individual interactions. References cross-feature business rules by XBR-NN Rule ID. References Logic/Rule specs by ID for complex validation.}

- {Rule description. Reference by ID where applicable.}

<!-- EXAMPLE (contact create):
- Duplicate detection (FEAT-01.SPEC-004) runs automatically on save -- the user cannot skip it.
- If duplicate detection finds possible matches, the user must choose "Keep Both" or "Review" before the save completes.
- Contact field validation (FEAT-01.SPEC-005) rules are enforced -- the user cannot save with invalid data.
- Ownership assignment is governed by FEAT-01.SPEC-005 (Authorization Rules) -- only Sales Managers may set an owner other than themselves.
- XBR-01: If the contact is created from a deal context (FEAT-03), the deal reference is stored in notes automatically.
END EXAMPLE -->

## Edge Cases

{Scenarios the happy path does not cover. Each as scenario-to-expected-behavior. Every screen that updates shared entities (per the dependency map's Contention notes) must include a concurrent-edit conflict entry: what the user sees when the underlying record changed between load and save, and how the conflict resolves (last-write-wins, reject-with-refresh, or merge).}

- **{Scenario}** -- {Expected behavior.}

<!-- EXAMPLE (contact create):
- **User navigates away with unsaved changes** -- Confirmation dialog: "You have unsaved changes. Discard?" with "Discard" and "Keep Editing" options.
- **User taps Save twice rapidly** -- Second tap is ignored while first save is in progress (button in loading state).
- **Network failure during save** -- Error banner: "Could not save contact. Check your connection and try again." with a Retry button. Form data preserved.
- **All optional fields left empty** -- Save proceeds with only required fields. Optional fields stored as empty.
- **Another user creates the same contact while this form is open** -- No live conflict on this creation screen (no existing record is loaded); duplicate detection (FEAT-01.SPEC-004) catches the collision on save and routes the user to "Keep Both" or "Review".
END EXAMPLE -->

<!-- EXAMPLE (concurrent-edit conflict entry -- from a screen that updates a shared entity, contact edit):
- **Contact changed by another user between load and save** -- Save is rejected with dialog "This contact was updated by Marcus while you were editing. Review the latest version before saving." with "View Latest" (reloads the record; local edits discarded after confirmation) and "Keep Editing" options. Resolution: reject-with-refresh, per the dependency map's Contention note for the Contact entity.
END EXAMPLE -->

## Connected Specs

{Explicit cross-references to other specs this one interacts with (both intra-feature and cross-feature).}

| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| {FEAT-NN.SPEC-NNN (Name)} | {Triggers \| References \| Navigation} ({inbound \| outbound}) | {What the connection does} |

<!-- EXAMPLE (contact create):
| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| FEAT-01.SPEC-004 (Duplicate Detection) | Triggers (outbound) | Save action triggers duplicate detection |
| FEAT-01.SPEC-005 (Contact Field Validation) | References (inbound) | Validation and authorization rules applied to form fields |
| FEAT-01.SPEC-003 (Contact List) | Navigation (inbound) | User arrives from contact list |
| FEAT-03.SPEC-002 (Deal Detail) | Navigation (inbound) | User arrives from deal with pre-filled context |
END EXAMPLE -->

## Analytics and Success Signals

{Events this screen emits, in functional terms -- event name and properties, no implementation detail. Every event cites the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}". When the screen genuinely emits nothing worth measuring, write "N/A — {reason}" -- the section is never absent.}

| Event | Properties | Emitted When | Supports Metric |
|-------|-----------|--------------|-----------------|
| {event_name} | {properties, in functional terms} | {what user action or outcome emits it} | supports success-metrics.md: "{exact metric name}" |

<!-- EXAMPLE (contact create):
| Event | Properties | Emitted When | Supports Metric |
|-------|-----------|--------------|-----------------|
| contact_created | entry source (list / deal context), count of optional fields filled, duplicate check outcome | Successful save completes | supports success-metrics.md: "Contact Capture Speed" |
| contact_create_abandoned | last field focused, count of fields filled | User discards unsaved changes | supports success-metrics.md: "Contact Capture Speed" |
| duplicate_review_shown | match count | Duplicate detection returns possible matches on save | supports success-metrics.md: "Duplicate Prevention Effectiveness" |
END EXAMPLE -->

## Acceptance Criteria

{Given/When/Then statements tagged with this spec's ID. Persona-grounded -- use the persona's name, and the role where behavior differs by role.}

**{FEAT-NN.SPEC-NNN}-AC-01:** Given {persona name} is on {screen}, when {action}, then {observable outcome}.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Interactions | {N} | {N} |
| States | {N} ({list: empty, loading, error, etc.}) | {N} |
| Business Rules | {N} | {N} |
| Edge Cases | {N} | {N} |

<!-- EXAMPLE (contact create):
**FEAT-01.SPEC-001-AC-01:** Given Sarah is on the Contact Create screen, when she fills in "Jane" as first name and "Doe" as last name and taps Save, then the system runs duplicate detection and saves the contact, showing a "Contact created" toast and returning to the Contact List.

**FEAT-01.SPEC-001-AC-02:** Given Sarah is on the Contact Create screen, when she taps Save with the first name field empty, then the first name field shows an error state with the message "First name is required" and the save does not proceed.

**FEAT-01.SPEC-001-AC-03:** Given Sarah is on the Contact Create screen with unsaved changes, when she taps the back arrow, then a confirmation dialog appears asking "You have unsaved changes. Discard?" with "Discard" and "Keep Editing" options.

**FEAT-01.SPEC-001-AC-04:** Given Sarah (Sales Rep) is on the Contact Create screen, when she looks for the owner selector, then it is not shown and the saved contact is owned by Sarah automatically.

**FEAT-01.SPEC-001-AC-05:** Given Marcus (Sales Manager) is on the Contact Create screen, when he selects another rep in the owner selector and saves, then the contact is created with that rep as its owner.

**FEAT-01.SPEC-001-AC-06:** Given Sarah loses connectivity while filling the form, when she taps Save, then the banner "You're offline -- this contact will be saved when you reconnect." appears and the contact is submitted automatically when connectivity returns.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Interactions | 6 | 6 |
| States | 4 (empty, validation error, saving error, offline) | 4 |
| Business Rules | 3 | 3 |
| Edge Cases | 5 | 5 |
END EXAMPLE -->
