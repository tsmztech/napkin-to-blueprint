---
document_type: spec
spec_type: logic-rule
spec_id: FEAT-{NN}.SPEC-{NNN}
spec_name: {name}
spec_slug: {kebab-case-slug}
parent_feature: FEAT-{NN}
parent_feature_name: {feature name}
priority_tier: {Core | Important | Nice-to-Have}
produced_by: spec-writer
status: {draft | final}
created: {YYYY-MM-DD}
rule_count: {N}
acceptance_criteria_count: {N}
---

# Logic/Rule Spec: {Spec Name}

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
  - Every field in the governed entity must be addressed -- with rules or explicitly noted as "no validation beyond data type"
  - Every rule must have a specific error message
  - The Authorization Rules table must cover every action on the governed entity for every role from the Access Matrix (user-persona.md); single-role products use per-action rows with the sole role in Allowed For plus any ownership conditions
  - Every denied action must state the exact denied message or experience -- "access denied" without specifics is not a specification
  - Every conditional rule must have acceptance criteria for both branches
  - Rules must be consistent with the Feature Breakdown Brief's Shared Validation section
  - Minimum 2 non-goals in Scope and Non-Goals section; every non-goal rationale must trace to a product decision (e.g., "excluded per scope-boundaries.md: {reason}"), never to version thrift
  - Platform-set policy values (deposit amounts, fee/refund percentages, time windows, prices, payout cycles -- anything fixed platform-wide and decided at build) are NEVER stated as concrete numbers: write the inline marker platform parameter: `{kebab-slug}` instead -- one slug per distinct parameter, reused verbatim at every site referencing the same value (a rule's threshold cites the marker; its error message may say "the required deposit" without the number). Pass D collects every marker into specifications/platform-parameters.md with a proposed default; Gate A reconciles markers against that registry. Values that genuinely belong to one feature's own definition stay inline as before
  - Before writing, update all frontmatter fields: spec_id, spec_name, spec_slug, parent_feature, parent_feature_name, priority_tier, produced_by (spec-writer), status, created (today's date), rule_count, acceptance_criteria_count
-->

## Overview

**Name:** {Spec Name}
**ID:** {FEAT-NN.SPEC-NNN}
**Type:** Logic/Rule
**Purpose:** {One sentence describing what rules this spec governs.}
**Parent Feature:** {FEAT-NN} -- {Feature Name}
**Governed Entity:** {Entity name -- the data entity these rules apply to}

<!-- EXAMPLE (contact field validation):
**Name:** Contact Field Validation
**ID:** FEAT-01.SPEC-005
**Type:** Logic/Rule
**Purpose:** Defines all validation rules, conditional requirements, authorization rules, and default values for contact data fields.
**Parent Feature:** FEAT-01 -- Contact Management
**Governed Entity:** Contact record
END EXAMPLE -->

## Scope and Non-Goals

**In Scope:**
- {What rules are covered by this spec.}

**Non-Goals:**
- {What rules or behaviors are excluded. Reference sibling specs by ID where applicable. Every exclusion carries a product-decision rationale.}
- {Second non-goal minimum.}

<!-- EXAMPLE (contact field validation):
**In Scope:**
- Per-field validation rules for all contact record fields
- Cross-field conditional requirements (e.g., email or phone required)
- Authorization rules for every action on the contact record, per role
- Default values and derived fields
- Error messages for every validation failure

**Non-Goals:**
- Duplicate detection logic -- handled by FEAT-01.SPEC-004 (Duplicate Detection)
- UI behavior for displaying validation errors -- defined in FEAT-01.SPEC-001 and FEAT-01.SPEC-002 (they reference this spec for the rules, but own the display behavior)
- Validation of data imported from external sources -- excluded per scope-boundaries.md: the product definition scopes contact capture to manual entry; no import capability exists in the product definition
END EXAMPLE -->

## Governed Entity

{The data entity these rules apply to, with its complete field list from the Feature Dependency Map.}

**Entity:** {Entity Name}
**Source:** Feature Dependency Map

| Field | Data Type | Description |
|-------|-----------|-------------|
| {field_name} | {text \| number \| date \| boolean \| enum \| derived} | {What this field represents} |

<!-- EXAMPLE (contact field validation):
**Entity:** Contact
**Source:** Feature Dependency Map

| Field | Data Type | Description |
|-------|-----------|-------------|
| first_name | text | Contact's given name |
| last_name | text | Contact's family name |
| email | text | Contact's email address |
| phone | text | Contact's phone number |
| company | text | Organization the contact belongs to |
| title | text | Contact's job title or role |
| notes | text | Free-form notes about the contact |
| owner | text | The Sales Rep who owns this contact record |
| full_name | derived | Concatenation of first_name and last_name |
| created_date | date | Date the contact record was created |
END EXAMPLE -->

## Enforced By

{Which specs apply these rules and when.}

| Spec ID | Spec Name | Enforcement Point |
|---------|-----------|-------------------|
| {FEAT-NN.SPEC-NNN} | {Spec Name} | {When rules are applied: on field blur, on form submit, on data change, etc.} |

<!-- EXAMPLE (contact field validation):
| Spec ID | Spec Name | Enforcement Point |
|---------|-----------|-------------------|
| FEAT-01.SPEC-001 | Contact Create | On field blur and form submit; authorization on screen entry and on save |
| FEAT-01.SPEC-002 | Contact Edit | On field blur and form submit; authorization on screen entry and on save |
END EXAMPLE -->

## Field Validation Rules

{Per-field rules. Every field in the governed entity must be addressed -- either with specific rules or noted as "no validation beyond data type."}

| Field | Rule | Condition (if conditional) | When Checked | Error Message | Blocking? |
|-------|------|--------------------------|-------------|---------------|-----------|
| {field_name} | {Required, format, length, etc.} | {Condition or "Always"} | {On blur \| On submit \| On change} | {Exact error message text} | {Yes \| No} |

<!-- EXAMPLE (contact field validation):
| Field | Rule | Condition (if conditional) | When Checked | Error Message | Blocking? |
|-------|------|--------------------------|-------------|---------------|-----------|
| first_name | Required, non-empty, max 100 characters | Always | On blur | "First name is required" / "First name must be 100 characters or fewer" | Yes |
| last_name | Required, non-empty, max 100 characters | Always | On blur | "Last name is required" / "Last name must be 100 characters or fewer" | Yes |
| email | Valid email format | When provided (not empty) | On blur | "Please enter a valid email address" | Yes |
| phone | Required if email is empty | Email field is empty | On submit | "Either email or phone is required" | Yes |
| phone | Valid phone format (digits, spaces, dashes, parens, plus) | When provided | On blur | "Please enter a valid phone number" | Yes |
| company | No validation beyond data type | Always | -- | -- | -- |
| title | No validation beyond data type | Always | -- | -- | -- |
| owner | Must be an active user of the product | Always | On submit | "The selected owner is no longer active. Choose another owner." | Yes |
| notes | Max 1000 characters | Always | On blur | "Notes must be 1000 characters or fewer" | Yes |
END EXAMPLE -->

## Cross-Field Rules

{Rules involving multiple fields. Each rule defines the fields involved, the logic, and the error message.}

| Rule | Fields Involved | Logic | Error Message |
|------|----------------|-------|---------------|
| {Rule name or description} | {Field 1, Field 2, ...} | {Condition that must be true} | {Exact error message text} |

<!-- EXAMPLE (contact field validation):
| Rule | Fields Involved | Logic | Error Message |
|------|----------------|-------|---------------|
| Contact method required | email, phone | At least one must be provided (non-empty) | "Please provide either an email or phone number" |
| Name uniqueness hint | first_name, last_name, email | If first_name + last_name matches an existing contact, show advisory warning (non-blocking) | "A contact with this name already exists. Consider checking for duplicates." |
END EXAMPLE -->

## Authorization Rules

{Who may perform each action on the governed entity, under what conditions, and exactly what a denied attempt looks like. Enumerate every action the product defines on this entity (create, view, edit, archive, delete, state transitions, special actions), with rows covering every role from the Access Matrix (user-persona.md). For a single-role product the matrix still exists: one row per action with the sole role in Allowed For, plus any ownership conditions.}

| Action | Allowed For | Condition | Denied Behavior (exact message/experience) |
|--------|------------|-----------|--------------------------------------------|
| {Action on the governed entity} | {Role(s) from the Access Matrix} | {Always \| ownership, state, or relationship condition} | {Exact message text, or exact experience: control hidden \| control disabled with explanation \| blocking dialog -- "--" when nothing is denied for the listed roles} |

<!-- EXAMPLE (contact field validation -- two-role product; roles from the Access Matrix in user-persona.md):
| Action | Allowed For | Condition | Denied Behavior (exact message/experience) |
|--------|------------|-----------|--------------------------------------------|
| Create contact | Sales Rep, Sales Manager | Always | -- |
| View contact | Sales Rep, Sales Manager | Always (all contacts visible to both roles) | -- |
| Edit contact | Sales Rep | Only contacts the requesting rep owns | Edit controls hidden on contacts owned by other reps; a direct edit attempt shows "You can only edit contacts you own." |
| Edit contact | Sales Manager | Always (any contact) | -- |
| Archive contact | Sales Manager | Only when the contact has no active deals (XBR-02) | Blocking dialog: "This contact has active deals and cannot be archived." |
| Archive contact | Sales Rep | Never | Archive action is not shown to Sales Reps |
END EXAMPLE -->

<!-- EXAMPLE (single-role product form -- per-action rows with the sole role plus ownership conditions):
| Action | Allowed For | Condition | Denied Behavior (exact message/experience) |
|--------|------------|-----------|--------------------------------------------|
| Create meal entry | Alex (sole user type) | Always | -- |
| Edit meal entry | Alex (sole user type) | Only entries Alex created (all entries are their own) | -- |
| Delete meal entry | Alex (sole user type) | Only entries Alex created | -- |
END EXAMPLE -->

## Defaults and Derivations

{Auto-populated and calculated fields. Each entry specifies the derivation logic, when it runs, and whether the user can override it.}

| Field | Default/Derivation | When Applied | User Can Override? |
|-------|-------------------|-------------|-------------------|
| {field_name} | {Default value or derivation logic} | {On create \| On save \| Always} | {Yes \| No} |

<!-- EXAMPLE (contact field validation):
| Field | Default/Derivation | When Applied | User Can Override? |
|-------|-------------------|-------------|-------------------|
| full_name | Concatenate first_name + " " + last_name | On save (create and edit) | No (always derived) |
| owner | The creating user | On create only | Yes (Sales Managers only -- see Authorization Rules) |
| created_date | Current date and time | On create only | No |
END EXAMPLE -->

## Business Rules

{Behavioral rules beyond field validation. Rules that govern entity behavior, state transitions, or cross-entity constraints.}

- {Rule description. Reference by XBR-NN ID for cross-feature rules.}

<!-- EXAMPLE (contact field validation):
- Contacts cannot be soft-deleted if they have active deals linked to them (cross-feature rule -- see FEAT-03 for deal lifecycle).
- Field validation runs before duplicate detection (FEAT-01.SPEC-004) -- invalid data is never checked for duplicates.
- All validation rules apply identically on create and edit -- the product definition establishes no edit-only or create-only rules.
END EXAMPLE -->

## Edge Cases

{Boundary conditions for rules. Max lengths tested, format edge cases, conditional rule interactions, authorization boundary scenarios.}

- **{Scenario}** -- {Expected behavior.}

<!-- EXAMPLE (contact field validation):
- **Email field cleared after phone was left empty** -- Cross-field rule re-evaluates: phone becomes required. Error shown on submit if both are empty.
- **First name at exactly 100 characters** -- Passes validation. 101 characters shows error.
- **Phone number with international format (+1-555-123-4567)** -- Passes validation. The format allows digits, spaces, dashes, parentheses, and leading plus.
- **Notes field with exactly 1000 characters** -- Passes validation. 1001 characters shows error.
- **Email with uncommon but valid format (user+tag@sub.domain.co)** -- Passes validation.
- **Contact ownership transferred while a rep has the edit form open** -- The rep's save is rejected with "You can only edit contacts you own." and the form switches to read-only.
END EXAMPLE -->

## Acceptance Criteria

{One criterion per rule minimum. Conditional rules get one criterion per branch. Authorization rules get criteria for both the allowed and denied branches. Persona-grounded -- name the role where behavior differs by role.}

**{FEAT-NN.SPEC-NNN}-AC-01:** Given {persona name} {context}, when {action}, then {observable outcome}.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Field Validation Rules | {N} | {N} |
| Cross-Field Rules | {N} | {N} |
| Authorization Rules | {N} | {N} |
| Defaults/Derivations | {N} | {N} |
| Business Rules | {N} | {N} |
| Edge Cases | {N} | {N} |

<!-- EXAMPLE (contact field validation):
**FEAT-01.SPEC-005-AC-01:** Given Sarah is creating a new contact, when she leaves the first name field empty and moves to the next field, then the first name field shows an error: "First name is required."

**FEAT-01.SPEC-005-AC-02:** Given Sarah is creating a new contact with no email entered, when she leaves the phone field empty and taps Save, then she sees the error: "Either email or phone is required."

**FEAT-01.SPEC-005-AC-03:** Given Sarah is creating a new contact with a valid email entered, when she leaves the phone field empty, then no error is shown for the phone field (email satisfies the contact method requirement).

**FEAT-01.SPEC-005-AC-04:** Given Sarah saves a new contact with first name "Jane" and last name "Doe", then the full_name field is automatically set to "Jane Doe."

**FEAT-01.SPEC-005-AC-05:** Given Sarah (Sales Rep) views a contact owned by another rep, when she looks for edit controls, then none are shown, and a direct edit attempt shows "You can only edit contacts you own."

**FEAT-01.SPEC-005-AC-06:** Given Marcus (Sales Manager) opens a contact owned by any rep, when he edits a field and saves, then the change is saved regardless of contact ownership.

**FEAT-01.SPEC-005-AC-07:** Given Marcus (Sales Manager) opens a contact with active deals, when he attempts to archive it, then a blocking dialog appears: "This contact has active deals and cannot be archived."

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Field Validation Rules | 9 | 9 |
| Cross-Field Rules | 2 | 2 |
| Authorization Rules | 6 | 6 |
| Defaults/Derivations | 3 | 3 |
| Business Rules | 3 | 3 |
| Edge Cases | 6 | 6 |
END EXAMPLE -->
