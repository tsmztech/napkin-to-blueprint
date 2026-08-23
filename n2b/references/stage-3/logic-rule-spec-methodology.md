<!-- Agent: spec-writer (spec_type: logic-rule)
     When: @-include when writing Logic/Rule specs.
     Purpose: 5-phase methodology for producing spec-logic-rule.md documents.
     Prerequisite: Feature Breakdown Brief (feature-overview.md) must be loaded as context. -->

# Logic/Rule Spec Writing Methodology

Prescriptive 5-phase methodology for producing detailed Logic/Rule spec documents. Each phase builds on the previous. Follow phases in order -- do not skip or reorder.

---

## Phase 1 -- Absorb and Anchor

Read the Feature Breakdown Brief. Build understanding of this spec's role before writing anything.

**Step 1: Understand the governed entity.**
What data entity do these rules apply to? Read the entity definition from the dependency map -- every field name, field type, and relationship. This is the complete field inventory that Phase 2 must address.

**Step 2: Understand enforcing specs.**
Which screens and automations apply these rules? Identify every enforcing spec by FEAT-NN.SPEC-NNN ID. Understand the contexts in which rules are evaluated (form submission, field blur, data import, automation processing).

**Step 3: Understand the personas' expectations.**
Read the persona summary. What level of validation feedback do these personas expect? Are they data-entry heavy (need fast inline validation) or casual users (need clear error messages that explain what went wrong)? Also inventory every role in the context package's Access Matrix slice -- Phase 2's Authorization Rules must cover every action on the governed entity for each of these roles.

**Step 4: Understand cross-feature rules.**
Does the dependency map define cross-feature business rules that involve this entity? Reference those rules by Rule ID -- they may override or extend the rules in this spec.

**Output:** No written artifact. This phase builds the context carried through all subsequent phases.

**Guidance:** Do not start writing rules yet. An incomplete understanding of the governed entity's fields leads to gaps in rule coverage.

---

## Phase 2 -- Rule Enumeration

Systematically enumerate every rule that governs this entity's data. Work through four rule categories for every field.

### Field Validation Rules

For each field in the governed entity (from the dependency map), define:

| Field | Rule | Condition (if conditional) | When Checked | Error Message | Blocking? |
|-------|------|--------------------------|-------------|---------------|-----------|
| {field} | {what must be true} | {under what conditions} | {on blur/submit/change} | {exact error text} | {Yes/No} |

**For each field, ask:**
- Is it required? Always, or only under certain conditions?
- What format is valid? (email format, phone format, date format, URL format)
- What length constraints exist? (min length, max length)
- What value range is valid? (min value, max value, allowed values)
- Are there character restrictions? (no special characters, alphanumeric only, specific character sets)

**Fields with no validation rules** must be explicitly noted: "No validation beyond data type" -- this confirms the field was considered, not accidentally skipped.

### Cross-Field Rules

Rules that involve multiple fields:

| Rule | Fields Involved | Logic | Error Message |
|------|----------------|-------|---------------|
| {rule name} | {field1, field2, ...} | {the condition} | {exact error text} |

**Common cross-field patterns:**
- "At least one of A or B is required" (contact method: email or phone)
- "B must be after A" (end date after start date)
- "B is required when A has value X" (conditional required fields)
- "A and B must be consistent" (country and phone number format)

### Authorization Rules

Rules that restrict actions based on role, ownership, or entity state. This category drives the spec's required `## Authorization Rules` section -- build the role-action matrix, do not stop at prose.

**Step 1: Enumerate the actions.** List every action the product defines on the governed entity: create, view, edit, archive, delete, state transitions, and any special actions the feature defines (assign, transfer, export, approve).

**Step 2: Work every role through every action.** For each action, answer for every role in the context package's Access Matrix slice:

- May this role perform the action -- always, conditionally, or never?
- What condition gates a conditional allowance? Ownership ("only records the requesting role owns"), entity state ("only when the record is not archived"), or relationship ("only records assigned to them"). Use exact conditions, not "when appropriate."
- What exactly happens when this role is denied? The exact denied message text, or the exact experience: control hidden, control disabled with an explanation, or a blocking dialog. "Show an error" is not a specification.

**Step 3: Sweep the residual authorization questions:**
- Are there visibility rules (archived items hidden by default)?
- Are there rate limits or usage caps?
- Do any actions require the entity to be in a specific state?

For a single-role product the matrix still exists: one row per action with the sole role in Allowed For, plus any ownership conditions ("Alex can edit only their own entries"). Roles come from the Access Matrix -- never invent a role the product definition does not establish, and never omit a role it does.

### Conditional Behavior Rules

Rules where behavior changes based on entity state or field values:

- Does any field's validation change based on another field's value?
- Does any capability behave differently based on entity state?
- Do any rules interact with each other? (Rule A changes the applicability of Rule B)

**Completeness check:** For any rule with multiple conditions, enumerate the condition combinations. If 3 binary conditions exist, there are 8 combinations. Verify that every combination has defined behavior. Flag any undefined combination.

**Output:** Field Validation Rules section, Cross-Field Rules section, Authorization Rules section of the spec.

---

## Phase 3 -- Enforcement Mapping

Map where and when each rule is enforced. Different enforcing specs may evaluate the same rule at different points.

### Enforcement Table

| Spec ID | Context | Rules Applied | When Applied |
|---------|---------|--------------|-------------|
| {FEAT-NN.SPEC-NNN} | {e.g., "Contact create form"} | {which rules from this spec} | {on field blur, form submit, etc.} |

**Step 1: Map screen enforcement points.**
For each screen spec that enforces these rules:
- Which rules are checked on field blur (immediate feedback)?
- Which rules are checked on form submit (batch validation)?
- Which rules are checked on value change (dependent field updates)?
- Where are authorization rules applied -- on screen entry (hiding or disabling controls), on action attempt, or both? The screen's Access and Visibility section must be consistent with this spec's Authorization Rules.

**Step 2: Map automation enforcement points.**
For each automation spec that enforces these rules:
- Which rules are checked during processing?
- What happens when a rule is violated during automation (different from screen violation -- no inline error messages)?

**Step 3: Identify enforcement gaps.**
Every rule must be enforced by at least one spec. A rule with no enforcing spec is dead -- it exists in documentation but is never applied. Flag any unenforced rules.

**Output:** Enforced By section of the spec.

---

## Phase 4 -- Defaults, Derivations, and Cross-Reference

Define auto-populated values and calculated fields, then verify consistency.

### Default Values and Derivations

| Field | Default/Derivation | When Applied | User Can Override? |
|-------|-------------------|-------------|-------------------|
| {field} | {the default value or derivation formula} | {on create / on update / always} | {Yes/No} |

**For each field, ask:**
- Does it have a default value? Is the default static ("Active") or dynamic (current date/time, time-of-day bracket)?
- Is it calculated from other fields? What is the exact formula or logic?
- Is it auto-populated from an external source? Which source?
- Can the user override the default or derived value? If so, does the override persist or recalculate on next save? Is the override itself role-gated (cross-check the Authorization Rules)?

### Cross-Reference Verification

**Step 1: Verify entity field coverage.**
Every field in the governed entity (from the dependency map) must appear in either:
- The Field Validation Rules table (with rules), OR
- The "no validation beyond data type" note

Count fields addressed vs. total fields. 100% coverage required.

**Step 2: Verify enforcing spec consistency.**
For each enforcing spec, verify that the spec's Validation Rules section references this Logic/Rule spec by ID. Flag any missing references.

**Step 3: Verify cross-feature rule consistency.**
If the dependency map defines cross-feature business rules involving this entity, verify that this spec's rules do not contradict them. Reference cross-feature rules by Rule ID.

**Output:** Default Values & Derivations section, Business Rules section of the spec.

---

## Phase 5 -- Assembly and Self-Verification

Fill the spec-logic-rule.md template and verify completeness.

**Step 1: Write frontmatter.**
Complete all frontmatter fields. Include accurate rule_count and acceptance_criteria_count.

**Step 2: Write Acceptance Criteria.**
One criterion per rule minimum. For conditional rules, one criterion per condition branch.

Ground all criteria in the persona: "Given Sarah enters a contact with..." -- and name the role where behavior differs by role.

For rules, acceptance criteria often follow the pattern:
- Valid input: "Given Sarah enters [valid value] in [field], When she [triggers validation], Then [success behavior]"
- Invalid input: "Given Sarah enters [invalid value] in [field], When she [triggers validation], Then [error message] is shown"
- Conditional: "Given Sarah has [condition], When she [action], Then [conditional behavior]"
- Authorization: "Given [role] [meets/fails the condition], When they attempt [action], Then [allowed outcome / exact denied behavior]" -- every Authorization Rules row gets criteria for both the allowed and denied branches (a "Never" row needs only the denied branch; an unconditional "Always" row needs only the allowed branch).

**Step 3: Build Edge Cases section.**
For each rule, identify boundary conditions:
- What happens at exact boundary values (max length exactly, min value exactly)?
- What happens with empty string vs. null vs. whitespace-only?
- What happens when conditional rules interact (Rule A applies, which changes whether Rule B applies)?
- What happens at authorization boundaries (ownership changes while an edit is in progress, the entity enters a state that revokes an action mid-flow)?

**Output:** Complete spec file ready for quality review.

### Self-Verification Checklist

Before finalizing the spec file, verify against all four categories.

**Structural Completeness:**
- [ ] All required sections present and non-empty (per Logic/Rule spec template)
- [ ] Frontmatter complete with accurate rule_count and acceptance_criteria_count
- [ ] Field Validation Rules table covers every field in the governed entity
- [ ] Authorization Rules table present (single-role products: per-action rows with the sole role plus ownership conditions)
- [ ] Enforced By table lists all enforcing specs

**Coverage:**
- [ ] Every field in the governed entity is addressed (with rules or explicit "no validation beyond data type")
- [ ] Every action on the governed entity has a defined authorization outcome (always / conditional / never) for every role in the Access Matrix slice
- [ ] Every rule has at least one acceptance criterion
- [ ] Every conditional rule has criteria for both branches
- [ ] Every authorization rule with both an allowed and a denied branch has criteria for both
- [ ] Every cross-field rule has criteria covering the interaction

**Consistency:**
- [ ] Rules are consistent with the Feature Breakdown Brief's shared validation section
- [ ] Entity field names match the dependency map exactly
- [ ] Enforcing spec references use exact FEAT-NN.SPEC-NNN identifiers
- [ ] Cross-feature business rules (by Rule ID) are referenced, not duplicated
- [ ] Every role named in Authorization Rules appears in the context package's Access Matrix slice -- no invented roles, no omitted roles

**Clarity:**
- [ ] Every rule has a specific error message (exact text, not "show appropriate error")
- [ ] Every denied action states the exact denied message or experience (control hidden, control disabled with explanation, or exact dialog text -- never "access is denied")
- [ ] Every conditional rule has explicit conditions (not "when appropriate" or "as needed")
- [ ] Derivation formulas are concrete and calculable
- [ ] Rule conditions use exact operators and values

---

## Decision Rules

### When to create a separate Logic/Rule spec vs. embed rules in a Screen spec

**Separate Logic/Rule spec when:**
- 5+ validation rules apply to a single entity
- Rules include conditional logic (rules that depend on other field values or entity state)
- Rules are shared across multiple screens or automations within the feature
- Derivation rules have non-trivial logic (lookup tables, formulas, conditional defaults)
- Rules involve cross-field dependencies
- Actions on the entity are authorized differently by role (the role-action matrix warrants a single authoritative home)

**Embed rules in Screen spec when:**
- Simple validations only: required field, max length, format check
- Rules apply to only one screen and are not shared
- Total rule count is 4 or fewer with no conditional logic
- No derivation rules or defaults beyond static values

### When to split a Logic/Rule spec into two

Split when:
- The spec governs two distinct entities with no rule interactions between them
- The spec exceeds 30 rules and can be naturally divided by rule category (validation vs. derivation vs. authorization)
- Different enforcing specs need fundamentally different subsets of the rules

Do NOT split just because the spec is long. A single entity with many fields and rules is better documented in one spec than scattered across multiple.
