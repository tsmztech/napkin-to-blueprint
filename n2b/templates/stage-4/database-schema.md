---
document_type: database-schema
produced_by: schema-designer
status: {draft | final}
stage: 4
database: {selected database — whatever technical-architecture.md Section 3 chose}
orm: {selected ORM / data-access approach — whatever technical-architecture.md Section 3 chose}
entity_count: {N}
table_count: {N}
relationship_count: {N}
created: {YYYY-MM-DD}
---

# Database Schema Design -- {Product Name}

<!-- Rules for this document:
  - Every table must have a primary key (id column).
  - Every relationship from Stage 3 must have a foreign key constraint.
  - Column types must match data semantics per the dialect-parametric type mapping in schema-design-guide.md: apply the Principle column to the selected database's native types and document the mapping used.
  - Every Section 4 lifecycle decision and Section 5 access decision must cite its Stage 3 evidence (an Entity-Lifecycle Delete/Archive cell, Access Matrix row, Contention or Data Sensitivity line, compliance flag, or technical-profile signal) — never a blanket inclusion or exclusion in either direction.
  - Every Section 7 read-pattern index must carry a one-line driver citation.
  - No scope expansion: the schema translates Stage 3 entities; it does not invent new features or entities not traceable to specs.
  - All 9 sections must be non-empty (Gate 4 Category 8 structural check greps the numbered `## N.` headings for 1-9).
  - Anti-pattern validation (Section 9) must pass all 9 checks.
  - Before writing, update all frontmatter fields: document_type, produced_by, status, stage, database, orm, entity_count, table_count, relationship_count, created (today's date).
-->

## 1. Schema Overview

- **Database:** {selected database, from technical-architecture.md Section 3}
- **ORM:** {selected ORM / data-access approach, from technical-architecture.md Section 3}
- **Tables:** {N} ({N} domain entities + {N} junction tables + {N} lookup tables)
- **Relationships:** {N} ({N} one-to-many, {N} many-to-many, {N} one-to-one)
- **Migration strategy:** {consistent with the migration-strategy decision in technical-architecture.md Section 6}

### Entity Map

{List all entities grouped by type with their key relationships.}

**Domain Entities:**
- {entity_a} -> has many {entity_b}, belongs to {entity_c}
- {entity_b} -> belongs to {entity_a}

**Junction Tables:**
- {entity_a}_{entity_b} -> connects {entity_a} <-> {entity_b}

**Lookup Tables:**
- {statuses} -> referenced by {entity_a}, {entity_b}

## 2. Table Definitions

{One subsection per table. Every entity from Stage 3's Shared Data Entities section must appear here, plus any implicit entities discovered during the entity harvest. Column types use the selected database's native types (per the dialect-parametric mapping in schema-design-guide.md); note any non-obvious mapping in the column's Notes cell. Lifecycle & governance columns (deleted_at, created_by/updated_by, version, tenant_id) appear here only when Section 4's per-entity decisions call for them.}

### {table_name}

**Source:** {Stage 3 entity name} from feature-dependency-map.md | Implicit ({reason})
**Lifecycle:** Created by {FEAT-NN}. Read by {FEAT-NN, ...}. Updated by {FEAT-NN}. Deleted by {FEAT-NN}.

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| id | {native UUID type or dialect equivalent} | NO | {UUID-generation default or --} | PK | |
| {column} | {selected-dialect type} | {YES/NO} | {default or --} | {FK, UNIQUE, CHECK(...), etc. or --} | {Source field: "{functional field name}"} |
| created_at | {timezone-aware timestamp type} | NO | {current-timestamp default or --} | | |
| updated_at | {timezone-aware timestamp type} | NO | {current-timestamp default or --} | | Updated on every write |
| {deleted_at} | {timezone-aware timestamp type} | YES | -- | | {Only when Section 4 decides soft delete for this entity — cite the decision} |

**Indexes:**
- `{table_name}_pkey` -- PRIMARY KEY (id)
- `{table_name}_{fk_column}_idx` -- INDEX ({fk_column}) -- FK index
- `{table_name}_{column}_key` -- UNIQUE ({column}) -- {if applicable}

## 3. Relationships

{All relationships with implementation details. Every relationship from Stage 3 entity definitions must appear here.}

| Parent | Child | Type | FK Column | FK Location | ON DELETE | ON UPDATE | Optional |
|--------|-------|------|-----------|-------------|-----------|-----------|----------|
| {parent_table} | {child_table} | {one-to-many} | {parent}_id | {child_table} | {CASCADE / SET NULL / RESTRICT} | CASCADE | {YES/NO} |
| {table_a} | {table_b} | {many-to-many} | -- | {junction_table} | CASCADE | CASCADE | -- |

## 4. Data Lifecycle & Integrity Decisions

{One row per entity. Every cell is a decision with evidence — cite the Stage 3 source that activates the pattern (an Entity-Lifecycle Delete/Archive "How" cell, an Access Matrix row, a Contention line, a compliance flag) or the evidence for omitting it. Never a blanket inclusion or exclusion in either direction. Decisions here drive the column definitions in Section 2.}

| Entity | Soft Delete | Audit Columns | Optimistic Locking | Retention/Purge |
|--------|-------------|---------------|--------------------|-----------------|
| {entity} | {Yes — `deleted_at`; restore via {path} (evidence: {FEAT-NN feature-overview.md, Delete/Archive cell}) \| No — hard delete (evidence: {citation})} | {Yes — `created_by`/`updated_by` (evidence: {Access Matrix row / Contention line / compliance flag}) \| No (evidence: {citation})} | {Yes — `version` (evidence: {Contention line resolution expectation / Collaboration-concurrency signal}) \| No — last-write-wins acceptable (evidence: {citation})} | {retention window + purge mechanism (evidence: {citation}) \| Indefinite (evidence: {explicit non-goal citation})} |

**Multi-tenancy:** {isolation model — shared schema with `tenant_id` on tenant-owned tables / schema-per-tenant / database-per-tenant — with rationale and evidence | "Single-tenant — {evidence, e.g., single-user Access Matrix or scope-boundaries.md exclusion}"}

## 5. Security & Access Model

{Authorization enforcement at the data layer. The role model comes from technical-architecture.md Section 11's role/permission mapping (derived from the Access Matrix) — never invented here.}

**Enforcement model:** {Row-level security (RLS) — the selected database supports it and it is the primary authorization mechanism at the data layer | Application-layer authorization boundary — the selected database does not support RLS}. {One-line rationale citing technical-architecture.md Sections 3 and 11.}

### Access Policies

{When RLS: a per-table policy sketch — operation, role(s), and a plain-terms predicate with an indicative SQL fragment. When application-layer: the enforcement point and the per-table access rules the implementing team must enforce. Own-only access maps to ownership predicates; View maps to read-only policies; None means no policy for that role. Multi-tenant products: every policy also scopes by tenant per the Section 4 decision.}

| Table | Operation | Role(s) | Policy / Rule Sketch |
|-------|-----------|---------|----------------------|
| {table} | {SELECT / INSERT / UPDATE / DELETE} | {role from the Section 11 mapping} | {predicate sketch, e.g., "owner only — user_id = current user" (indicative, not final SQL)} |

### Sensitive Fields

{Column-level protection notes for fields the specs mark sensitive — sourced from the Data Sensitivity lines in feature-dependency-map.md (Shared Data Entities) and the privacy entries of each feature-overview's Non-Functional Notes. When no spec marks fields sensitive, state exactly that with its citation — the subsection is never silently empty.}

| Table | Column(s) | Sensitivity (source) | Protection Note |
|-------|-----------|----------------------|-----------------|
| {table} | {columns} | {classification + citation} | {encryption at rest / masking in list and log surfaces / restricted read set} |

## 6. Normalization Log

{Changes made during the normalization pass (Step 3) and any flagged denormalization candidates.}

### Changes Applied

| Entity | Field | Violation | Resolution |
|--------|-------|-----------|------------|
| {entity} | {field} | {1NF: repeating group / 2NF: partial dependency / 3NF: transitive dependency} | {Moved to new table X / Split into junction table / etc.} |

{If no normalization changes were needed, state: "All entities passed 3NF validation without changes."}

### Denormalization Candidates (for the implementing team)

| Pattern | Tables Involved | Rationale for Deferral |
|---------|----------------|----------------------|
| {e.g., "Dashboard reads join 3 tables"} | {table_a, table_b, table_c} | Normalize first; measure before denormalizing |

{If no candidates, state: "No denormalization candidates identified."}

## 7. Indexing Strategy

{Baseline: primary-key, foreign-key, and unique indexes are defined per table in Section 2. This section records the indexes derived from read patterns beyond that baseline. Each index carries a one-line driver citation — a hub screen, a search or filter signal, a sort key of a large list, or a high fan-in "Read by" lifecycle. No speculative indexes: an index without a citable read-pattern driver is not recorded.}

### Read-Pattern Indexes

| Index | Table | Columns | Type | Driver (one-line citation) |
|-------|-------|---------|------|----------------------------|
| {index_name} | {table} | {columns} | {btree / full-text / composite} | {e.g., "Contact List screen filters by company and status (FEAT-01.SPEC-003); hub screen per technical-profile.md Complexity Metrics"} |

{Legal form when no read-pattern index is warranted: "None beyond the PK/FK/unique baseline — {evidence, e.g., no hub screens or search/filter signals in the technical profile}."}

### Growth-Tier Notes

{Options the implementing team may reach for as data volumes grow — partitioning, read replicas, materialized read models — each named with a one-line trigger condition, never deep-designed here. "None identified" is legal.}

## 8. Reference & Seed Data

{Initial values for lookup tables and enum columns, plus a seed data plan the implementing team can use to stand up realistic development and demo environments.}

### Enum / Lookup Values

| Table or Column | Values | Type | Notes |
|-----------------|--------|------|-------|
| {statuses table or status column} | {active, inactive, archived} | {lookup table / enum column} | {Why this choice -- per enum-vs-lookup decision rule} |

### Development Seed Data Plan

| Entity | Record Count | Description |
|--------|-------------|-------------|
| {entity} | {N} | {What makes the seed data realistic -- e.g., "3 sample users with different roles"} |

## 9. Anti-Pattern Validation

{Results of the 9-item anti-pattern checklist run against the completed schema.}

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Every table has a primary key | {PASS} | |
| 2 | Every relationship has a FK constraint | {PASS} | |
| 3 | Column types match data semantics | {PASS} | |
| 4 | Monetary values use DECIMAL (not INTEGER/FLOAT) | {PASS / N/A} | |
| 5 | No comma-separated value columns | {PASS} | |
| 6 | FK columns are indexed | {PASS} | |
| 7 | Timestamps include timezone | {PASS} | |
| 8 | No unconstrained polymorphic associations | {PASS / N/A} | |
| 9 | No god tables (>20 columns) | {PASS} | |
