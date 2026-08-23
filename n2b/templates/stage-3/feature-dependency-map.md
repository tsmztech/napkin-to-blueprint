---
document_type: feature-dependency-map
produced_by: requirements-architect
status: {draft | final}
created: {YYYY-MM-DD}
feature_count: {N}
shared_entity_count: {N}
cross_feature_rule_count: {N}
---

# Feature Dependency Map

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": every role named in a Contention line must trace to the Access Matrix in user-persona.md — never invent roles
  - See pipeline-rules.md constraint "functional-language-only": no tech details (frameworks, databases, APIs); External Touchpoints name capability categories in vendor-neutral terms, never providers or protocols
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - Feature numbers are inherited from Stage 2 product-features.md -- never reassign or reorder
  - Feature Phase values (MVP | v1 | Later) are carried from product-features.md -- never re-derived
  - Shared Data Entities are bootstrapped from the Domain Entity Inventory in product-features.md
  - Every shared entity carries a Contention line (which features and roles can modify it concurrently, and the resolution expectation) and a Data Sensitivity line (privacy classification); "None — {reason}" is the legal form when an entity has no contention or no sensitive data
  - Navigation Connections are derived from user-journeys.md and feature descriptions
  - Cross-Feature Business Rules are identified by examining feature descriptions and journey steps for rules mentioning 2+ features
  - Every cross-feature business rule must have an Authority feature that owns the data or behavior
  - XBR IDs use 2-digit zero-padded format (XBR-01, XBR-02, ...) -- see id-prefixes.md
  - External Touchpoints trace to the Dependencies section of assumptions-constraints.md: every category-level external capability the product requires appears as a row; "None — product has no external dependencies (per assumptions-constraints.md)" is the legal empty form
  - The Integration Specs column lists the FEAT-NN.SPEC-NNN Integration specs that specify each touchpoint; it is completed by the Requirements Architect after Brief validation, once Feature Analysts have assigned spec IDs
  - Before writing, update all frontmatter fields: produced_by (requirements-architect), status, created (today's date), and all counts
-->

## Features

{Complete feature table with dependency relationships. Every feature from product-features.md must appear. Phase is carried from the feature's Stage 2 entry.}

| Number | Slug | Name | Priority | Phase | Type | Depends On | Depended On By |
|--------|------|------|----------|-------|------|------------|----------------|
| {FEAT-NN} | {feature-slug} | {Feature Name} | {Core \| Important \| Nice-to-Have} | {MVP \| v1 \| Later} | {User-Facing \| Platform \| Lifecycle} | {FEAT-NN, ... or --} | {FEAT-NN, ... or --} |

<!-- EXAMPLE (meal tracker):
| Number | Slug | Name | Priority | Phase | Type | Depends On | Depended On By |
|--------|------|------|----------|-------|------|------------|----------------|
| FEAT-01 | meal-logging | Meal Logging | Core | MVP | User-Facing | FEAT-02 | FEAT-03, FEAT-05 |
| FEAT-02 | food-search | Food Database Search | Core | MVP | User-Facing | -- | FEAT-01 |
| FEAT-03 | progress-dashboard | Weekly Progress | Important | v1 | User-Facing | FEAT-01 | -- |
| FEAT-04 | settings | Settings | Core | MVP | Platform | -- | -- |
END EXAMPLE -->

## Shared Data Entities

{Every domain entity shared across two or more features. Bootstrapped from the Domain Entity Inventory in product-features.md. Each entity has a subsection with lifecycle, functional fields, relationships, contention, data sensitivity, and source attribution.}

### {Entity Name}

- **Lifecycle:** {Created by FEAT-NN. Read by FEAT-NN, FEAT-NN. Updated by FEAT-NN. Deleted by FEAT-NN.}
- **Fields (functional):**
  - {field_name} -- {description and constraints (required/optional, defaults, format)}
- **Relationships:** {How this entity relates to other entities or to the user.}
- **Contention:** {Which features and roles (from the Access Matrix in user-persona.md) can modify this entity concurrently, and the resolution expectation the specs must honor (e.g., last-write-wins, reject-with-refresh, merge) — or "None — {reason}"}
- **Data Sensitivity:** {Privacy classification of this entity's fields, drawn from the Non-Functional Expectations in assumptions-constraints.md — or "None — {reason}"}
- **Source:** {Domain Entity Inventory, product-features.md}

<!-- EXAMPLE (meal tracker):
### Meal Entry

- **Lifecycle:** Created by FEAT-01. Read by FEAT-03, FEAT-05. Updated by FEAT-01. Deleted by FEAT-01.
- **Fields (functional):**
  - date -- the date the meal was consumed (required)
  - meal_type -- breakfast / lunch / dinner / snack (required, defaults by time-of-day)
  - food_item -- name and optional food database reference (required)
  - portion_size -- quantity + unit (required)
  - calorie_estimate -- number (required; auto-calculated if food is from database, manual if custom entry)
- **Relationships:** Belongs to a single User. References a Food Item (optional, if selected from database).
- **Contention:** None — meal entries are private to a single user (Alex, the sole role in the Access Matrix) and modified only through Meal Logging (FEAT-01); no two actors can edit the same entry concurrently.
- **Data Sensitivity:** Eating-habit logs are personal data — private to the user by default, never shared, GDPR-class protection (assumptions-constraints.md, Non-Functional Expectations).
- **Source:** Domain Entity Inventory, product-features.md
END EXAMPLE -->

## Navigation Connections

{How users move between features. Derived from journey steps and feature descriptions.}

| From Feature | From Context | To Feature | To Context | Trigger |
|-------------|-------------|------------|-----------|---------|
| {FEAT-NN} | {screen or context within the feature} | {FEAT-NN} | {destination screen or context} | {User action that triggers the navigation} |

<!-- EXAMPLE (meal tracker):
| From Feature | From Context | To Feature | To Context | Trigger |
|-------------|-------------|------------|-----------|---------|
| FEAT-01 | meal history | FEAT-01 | meal detail | Tap logged meal |
| FEAT-03 | dashboard | FEAT-01 | meal entry | Tap "Log Meal" CTA |
| FEAT-01 | meal entry | FEAT-02 | search | Tap food input field |
END EXAMPLE -->

## Cross-Feature Business Rules

{Rules that span two or more features. Each rule has an ID, description, affected features, and an authority feature that owns the data or behavior.}

| Rule ID | Description | Affected Features | Authority |
|---------|-------------|-------------------|-----------|
| {XBR-NN} | {What the rule enforces across features} | {FEAT-NN, FEAT-NN} | {FEAT-NN (rationale)} |

<!-- EXAMPLE (meal tracker):
| Rule ID | Description | Affected Features | Authority |
|---------|-------------|-------------------|-----------|
| XBR-01 | Daily calorie totals recalculate on any meal entry change | FEAT-01, FEAT-03 | FEAT-01 (creates the data) |
| XBR-02 | Food items favorited in search appear as suggestions in meal entry | FEAT-02, FEAT-01 | FEAT-02 (manages favorites) |
END EXAMPLE -->

## External Touchpoints

{The product's category-level external dependencies, traced from the Dependencies section of assumptions-constraints.md, mapped to the features that rely on them and the Integration specs that specify them. Capability categories are vendor-neutral functional terms (payment processing, identity, transactional email, calendar sync, AI text generation, maps, file storage, ...). Stage 4 consumes this section as its integration input. When the product has no external dependencies, this section contains exactly: None — product has no external dependencies (per assumptions-constraints.md).}

| Capability Category | Features Involved | Integration Specs |
|---------------------|-------------------|-------------------|
| {capability category} | {FEAT-NN, FEAT-NN} | {FEAT-NN.SPEC-NNN, ...} |

<!-- EXAMPLE (meal tracker):
| Capability Category | Features Involved | Integration Specs |
|---------------------|-------------------|-------------------|
| Food-composition data | FEAT-01, FEAT-02 | FEAT-02.SPEC-004 |
| Device-notification delivery | FEAT-01 | FEAT-01.SPEC-007 |
END EXAMPLE -->
