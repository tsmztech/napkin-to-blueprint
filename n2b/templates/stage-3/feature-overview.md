---
document_type: feature-overview
feature_number: FEAT-{NN}
feature_name: {name from product-features.md}
feature_slug: {kebab-case-slug}
priority_tier: {Core | Important | Nice-to-Have}
feature_type: {User-Facing | Platform | Lifecycle}
produced_by: feature-analyst
status: {draft | final}
created: {YYYY-MM-DD}
spec_count: {N}
screen_count: {N}
automation_count: {N}
logic_rule_count: {N}
integration_count: {N}
notification_count: {N}
---

# Feature Breakdown Brief: {Feature Name}

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": every role named in a Roles Touched cell must trace to the Access Matrix in user-persona.md — never invent roles; "All" is the legal value for single-role products
  - See pipeline-rules.md constraint "functional-language-only": no tech details (frameworks, databases, APIs); category-level capability needs (e.g., "payment processing") are the allowed vocabulary for external dependencies
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - Every Key Capability from product-features.md must map to at least one spec in the Capability Coverage Map
  - Spec numbering is sequential within the feature (SPEC-001, SPEC-002, ...) with no gaps
  - Each spec must be classified as exactly one of five types: Screen, Automation, Logic/Rule, Integration, or Notification (spec frontmatter values: screen | automation | logic-rule | integration | notification)
  - Elaborate the feature's eight Functional Depth fields from product-features.md (Primary Flows & Alternates, States, Validation & Limits, Access, Communications, Data Notes, Interactions, Signals) — never re-derive them; every depth-field line must be traceable into at least one spec in this Brief
  - The Roles Touched column lists the roles from the Access Matrix in user-persona.md that each spec serves or affects; a cell is never empty — "All" for single-role products
  - Entity-Lifecycle Coverage Matrix must address every CRUD operation for managed entities; every Delete/Archive "How" cell must state soft-vs-hard delete, restore path, cascade behavior, and retention/purge expectation — or record the omission as an explicit non-goal
  - Side-Effect Inventory must account for every user action that triggers a system response; side-effects that communicate with a person (in-app message, email, push, SMS) become Notification specs, not bare side-effect rows
  - Internal Dependency Map must show all intra-feature spec connections
  - Cross-Feature Touchpoints must reference specs by full FEAT-NN.SPEC-NNN dot notation; within intra-feature sections (Shared Context, Internal Dependency Map, Side-Effect Inventory), bare SPEC-NNN is acceptable shorthand for this feature's own specs
  - Non-Functional Notes carries feature-scoped entries from the "## Non-Functional Expectations" section of assumptions-constraints.md and the feature's Data Notes and Signals fields; "N/A — {reason}" entries are legal per line, but the section is never absent
  - Non-Goals must include at least one exclusion from scope-boundaries.md and one from adjacency analysis; an exclusion is valid only with a product-definition rationale — "keep the product small" is not a rationale
  - Before writing, update all frontmatter fields: feature_number, feature_name, feature_slug, priority_tier, feature_type, produced_by (feature-analyst), status, created (today's date), and all six counts (spec_count, screen_count, automation_count, logic_rule_count, integration_count, notification_count — zero is a legal value and must still be present)
-->

## Summary

{Carried forward from product-features.md. Feature name, description, priority tier, phase, feature type, rationale, and Key Capabilities list. This section is a reference anchor -- not modified from the Stage 2 source.}

<!-- EXAMPLE (contact management):
**Feature:** Contact Management
**ID:** FEAT-01
**Description:** The user can create, view, edit, and organize contacts. Each contact stores name, email, phone, company, and notes. The user can search and browse contacts from a central list.
**Priority:** Core
**Phase:** MVP
**Type:** User-Facing
**Rationale:** Directly addresses the brief's primary goal of relationship tracking. Without contacts, there is no data to manage.

**Key Capabilities:**
- Create new contact -- User fills out a form and saves a new contact record
- Edit existing contact -- User modifies any field on a saved contact
- Search contacts -- User finds contacts by name, email, or company
- Detect duplicate contacts -- System flags potential duplicates on save
- Validate contact data -- System enforces data integrity rules on contact fields
- Import contacts from a connected email account -- System pulls contacts from the user's email-contact source (contact-sync capability)
END EXAMPLE -->

## Spec Inventory

{The master list of every spec this feature produces. Each spec has a unique ID, name, type, the roles it touches, and a one-line purpose.}

| Spec ID | Name | Type | Roles Touched | Purpose (one line) |
|---------|------|------|---------------|--------------------|
| {FEAT-NN.SPEC-NNN} | {Spec Name} | {Screen \| Automation \| Logic/Rule \| Integration \| Notification} | {Role(s) from the Access Matrix, or "All"} | {What this spec does in one sentence} |

<!-- EXAMPLE (contact management — a two-role product: Sales Rep and Team Lead per its Access Matrix):
| Spec ID | Name | Type | Roles Touched | Purpose (one line) |
|---------|------|------|---------------|--------------------|
| FEAT-01.SPEC-001 | Contact Create | Screen | Sales Rep | User creates a new contact record |
| FEAT-01.SPEC-002 | Contact Edit | Screen | Sales Rep, Team Lead | User modifies an existing contact's information |
| FEAT-01.SPEC-003 | Contact List | Screen | All | User browses, searches, and selects contacts |
| FEAT-01.SPEC-004 | Duplicate Detection | Automation | Sales Rep | System checks for potential duplicates on contact save |
| FEAT-01.SPEC-005 | Contact Field Validation | Logic/Rule | All | Validation rules governing contact data integrity |
| FEAT-01.SPEC-006 | Email Contact Import | Integration | Sales Rep | Product imports contacts from the user's connected email account (contact-sync capability) |

Frontmatter counts for this example: spec_count: 6, screen_count: 3, automation_count: 1, logic_rule_count: 1, integration_count: 1, notification_count: 0 — a zero count stays present in frontmatter.
END EXAMPLE -->

## Capability Coverage Map

{Traces every Key Capability from Stage 2 to the spec(s) that implement it. Includes a Discovery Phase column showing which methodology phase surfaced each spec.}

| Key Capability | Covered By | How | Discovery Phase |
|----------------|-----------|-----|-----------------|
| {Capability from product-features.md} | {FEAT-NN.SPEC-NNN} | {How this spec covers the capability} | {Phase N (Phase Name)} |

**Analyst-Discovered Specs** -- Specs not directly tied to a Key Capability, surfaced by Phases 3-6:

| Spec | Purpose | Discovery Phase | Discovery Rationale |
|------|---------|-----------------|---------------------|
| {FEAT-NN.SPEC-NNN} | {Purpose} | {Phase N (Phase Name)} | {Why this spec was discovered} |

<!-- EXAMPLE (contact management):
| Key Capability | Covered By | How | Discovery Phase |
|----------------|-----------|-----|-----------------|
| Create new contact | FEAT-01.SPEC-001 | Primary purpose of the create screen | Phase 2 (Explicit) |
| Edit existing contact | FEAT-01.SPEC-002 | Primary purpose of the edit screen | Phase 2 (Explicit) |
| Search contacts | FEAT-01.SPEC-003 | Search functionality on the list screen | Phase 2 (Explicit) |
| Detect duplicate contacts | FEAT-01.SPEC-004 | Automation triggered on create/edit save | Phase 4 (Trigger-Response) |
| Validate contact data | FEAT-01.SPEC-005 | Rules applied by create and edit screens | Phase 5 (Rule Discovery) |
| Import contacts from a connected email account | FEAT-01.SPEC-006 | Integration spec for the contact-sync capability | Phase 4 (External Dependencies lens) |

**Analyst-Discovered Specs:**

| Spec | Purpose | Discovery Phase | Discovery Rationale |
|------|---------|-----------------|---------------------|
| FEAT-01.SPEC-006 | Email Contact Import | Phase 4 (External Dependencies lens) | The Dependencies section of assumptions-constraints.md names a contact-sync capability this feature relies on; the external contract needed its own Integration spec |
END EXAMPLE -->

## Entity-Lifecycle Coverage Matrix

{The CRUD Coverage Matrix produced in Phase 3, finalized after Phase 7 verification. One table per managed entity. Entities this feature only reads (does not create, update, or delete) are listed separately as "Referenced Entities." Every Delete/Archive "How" cell states the lifecycle policy: soft-vs-hard delete, restore path, cascade behavior, and retention/purge expectation — or names the explicit non-goal that records the omission.}

**Entity: {Entity Name}**

| Operation | Covered By | How | Notes |
|-----------|-----------|-----|-------|
| Create | {FEAT-NN.SPEC-NNN} | {How this spec covers the operation} | {Notes or --} |
| Read (single) | {FEAT-NN.SPEC-NNN} | {How} | {Notes or --} |
| Read (list) | {FEAT-NN.SPEC-NNN} | {How} | {Notes or --} |
| Update | {FEAT-NN.SPEC-NNN} | {How} | {Notes or --} |
| Delete/Archive | {FEAT-NN.SPEC-NNN or N/A} | {Soft-vs-hard + restore path + cascade + retention/purge expectation, or rationale for N/A} | {Notes or --} |
| State Transition | {FEAT-NN.SPEC-NNN or N/A} | {How or rationale for N/A} | {Notes or --} |

**Referenced Entities (read-only):**

| Entity | Read By | Context |
|--------|---------|---------|
| {Entity Name} | {FEAT-NN.SPEC-NNN} | {Why this spec reads the entity} |

<!-- EXAMPLE (contact management):
**Entity: Contact**

| Operation | Covered By | How | Notes |
|-----------|-----------|-----|-------|
| Create | FEAT-01.SPEC-001 | Contact Create screen -- user fills form and saves | Contacts also created by FEAT-01.SPEC-006 import |
| Read (single) | FEAT-01.SPEC-002 | Contact Edit screen -- loads existing contact | -- |
| Read (list) | FEAT-01.SPEC-003 | Contact List screen -- paginated list with search/filter | -- |
| Update | FEAT-01.SPEC-002 | Contact Edit screen -- user modifies fields and saves | -- |
| Delete/Archive | FEAT-01.SPEC-002 | Archive action on Contact Edit screen -- soft delete: archived contacts hidden from the list by default, restorable from the Archived filter; related deal links retained (no cascade); retained indefinitely with no automatic purge -- recorded as an explicit non-goal | -- |
| State Transition | N/A | The product definition gives contacts no lifecycle states beyond active/archived (product-features.md, Domain Entity Inventory) | -- |

**Referenced Entities (read-only):**

| Entity | Read By | Context |
|--------|---------|---------|
| Deal | FEAT-01.SPEC-002 | Contact Edit shows related deals count |
END EXAMPLE -->

## Side-Effect Inventory

{The trigger-response pairs discovered in Phase 4, showing which became standalone Automation, Integration, or Notification specs and which are inline in Screen specs. A side-effect that sends a message to a person is dispositioned as a standalone Notification spec, never left as a bare row.}

| Trigger | Response | Disposition | Spec |
|---------|----------|-------------|------|
| {User action or system event} | {System response} | {Standalone Automation \| Standalone Logic/Rule \| Standalone Integration \| Standalone Notification \| Inline in triggering screen \| Cross-feature} | {FEAT-NN.SPEC-NNN} |

<!-- EXAMPLE (contact management):
| Trigger | Response | Disposition | Spec |
|---------|----------|-------------|------|
| User saves new contact | Check for duplicate contacts | Standalone Automation | FEAT-01.SPEC-004 |
| User saves contact (create or edit) | Validate all fields against rules | Standalone Logic/Rule | FEAT-01.SPEC-005 |
| Connected email account reports new contacts | Import contacts, then run duplicate detection on each | Standalone Integration | FEAT-01.SPEC-006 |
| User saves contact successfully | Show success toast, return to list | Inline in triggering screen | FEAT-01.SPEC-001 / SPEC-002 |
| User archives contact | Recalculate contact count on dashboard | Cross-feature -- logged in touchpoints | FEAT-03 responsibility |
END EXAMPLE -->

## Shared Context

{What is common across specs within this feature. This section is the coordination artifact that every Spec Writer for this feature reads.}

**Shared Entities:**
- {Entity name} -- {which specs create, read, update, or reference it. List fields.}

**Shared UI Patterns:**
- {Pattern name} -- {which specs share this pattern and how. Spec Writers should describe it consistently.}

**Shared Validation:**
- {Validation spec reference} -- {which specs reference this validation and how.}

<!-- EXAMPLE (contact management):
**Shared Entities:**
- Contact record -- created by SPEC-001 and SPEC-006, read/updated by SPEC-002, listed by SPEC-003, validated by SPEC-005, checked by SPEC-004. Fields: first name, last name, email, phone, company, title, notes.

**Shared UI Patterns:**
- Contact form -- used by both SPEC-001 (create) and SPEC-002 (edit). Same fields, same layout, same validation. Create starts empty; edit starts populated. Spec Writers for both screens should describe the form consistently.

**Shared Validation:**
- SPEC-005 defines the validation rules. SPEC-001, SPEC-002, and SPEC-006 all reference SPEC-005 for field validation behavior rather than duplicating the rules.
END EXAMPLE -->

## Internal Dependency Map

{How specs within this feature connect to each other. Use arrow notation to show navigation, triggering, and referencing relationships.}

```
{SPEC-NNN (Name)} -> [{user action or trigger}] -> {SPEC-NNN (Name)}
```

**Default Entry:** {SPEC-NNN (Name)} -- {the screen shown when the user navigates to this feature.}

<!-- EXAMPLE (contact management):
```
SPEC-003 (Contact List) -> [user taps "New Contact"] -> SPEC-001 (Contact Create)
SPEC-003 (Contact List) -> [user taps a contact] -> SPEC-002 (Contact Edit)
SPEC-001 (Contact Create) -> [user taps Save] -> SPEC-004 (Duplicate Detection) -> [result] -> SPEC-001
SPEC-002 (Contact Edit) -> [user taps Save] -> SPEC-004 (Duplicate Detection) -> [result] -> SPEC-002
SPEC-006 (Email Contact Import) -> [new imported contacts] -> SPEC-004 (Duplicate Detection)
SPEC-001 (Contact Create) -> [validates fields using] -> SPEC-005 (Field Validation)
SPEC-002 (Contact Edit) -> [validates fields using] -> SPEC-005 (Field Validation)
```

**Default Entry:** SPEC-003 (Contact List) -- the screen shown when the user navigates to this feature.
END EXAMPLE -->

## Cross-Feature Touchpoints

{Where this feature's specs connect to other features. Carried from the dependency map.}

| This Spec | Direction | Other Feature | Context | Trigger |
|-----------|-----------|---------------|---------|---------|
| {FEAT-NN.SPEC-NNN} | {Outbound \| Inbound} | {FEAT-NN (Feature Name)} | {What the connection does} | {User action or event that triggers it} |

<!-- EXAMPLE (contact management):
| This Spec | Direction | Other Feature | Context | Trigger |
|-----------|-----------|---------------|---------|---------|
| FEAT-01.SPEC-003 | Outbound | FEAT-03 (Deals) | Deal list filtered by contact | User taps "View Deals" on a contact |
| FEAT-01.SPEC-001 | Inbound | FEAT-03 (Deals) | Create contact from deal | User taps "New Contact" in deal view |
END EXAMPLE -->

## Non-Functional Notes

{Feature-scoped non-functional expectations, carried from the "## Non-Functional Expectations" section of assumptions-constraints.md and from this feature's Data Notes and Signals fields in product-features.md. Covers expected data volumes and growth, responsiveness expectations in user-experience terms, the data sensitivity / privacy classification of this feature's entities, and any compliance flags. "N/A — {reason}" is legal per line; the section is never absent. Stage 4 architects directly from these entries.}

**Data volumes / growth:** {Expected volumes and growth for this feature's entities — or "N/A — {reason}"}

**Responsiveness:** {User-experience responsiveness expectations for this feature's interactions — or "N/A — {reason}"}

**Data sensitivity / privacy:** {Privacy classification of this feature's entities and fields — or "N/A — {reason}"}

**Compliance flags:** {Compliance regimes touching this feature, carried from assumptions-constraints.md — or "N/A — {reason}"}

<!-- EXAMPLE (contact management):
**Data volumes / growth:** A team's contact list may reach tens of thousands of records over several years of use; list browsing and search must stay equally responsive at that size (assumptions-constraints.md, Non-Functional Expectations).

**Responsiveness:** Contact search results appear as the user types (within about a second); saving a contact completes without a perceptible wait (assumptions-constraints.md, Non-Functional Expectations).

**Data sensitivity / privacy:** Contact records hold third-party personal data — names, emails, phone numbers, employers. This is personal data about people who are not the product's users and carries the product's strictest privacy classification (assumptions-constraints.md, Non-Functional Expectations).

**Compliance flags:** GDPR-class handling applies to all contact data, including honoring deletion requests for imported contacts; no health or financial regime applies (assumptions-constraints.md, Non-Functional Expectations).
END EXAMPLE -->

## Non-Goals

{Explicit exclusions at the feature level, carried from scope boundaries and augmented by the Analyst's adjacency analysis. Includes any intentional omissions from CRUD matrix analysis. Every exclusion requires a product-definition rationale — a citation to scope-boundaries.md, the brief, or a named Stage 2 decision.}

- **{Excluded capability}** -- {Why it is excluded, with the product-definition rationale that supports the exclusion.}

<!-- EXAMPLE (contact management):
- **Bulk file import/export** -- Excluded per scope-boundaries.md (SC-03): the product definition scopes list building to individual entry plus email-account sync; file-based bulk transfer is an explicit scope exclusion because it conflicts with the brief's data-quality positioning.
- **Contact merging** -- Excluded per scope-boundaries.md (SC-04): the product definition sets duplicate handling as flag-and-review; merging records is excluded because irreversible merges contradict the brief's "never silently destroy user data" principle. Duplicate detection flags potential duplicates but does not resolve them.
- **Automatic purge of archived contacts** -- Intentional lifecycle decision surfaced by the CRUD matrix: archived contacts are retained indefinitely because the product definition treats contact history as permanent reference data (product-features.md, Data Notes). No retention window applies.
END EXAMPLE -->
