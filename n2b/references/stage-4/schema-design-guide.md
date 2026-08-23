<!-- Agent: schema-designer
     When: @-include during schema design phase.
     Purpose: Decision rules for column type mapping, normalization, constraints, data lifecycle & governance, security & access, indexing, and anti-patterns.
     Output: Informs all 9 pipeline steps of database-schema.md. -->

# Schema Design Guide

Decision rules for translating product specifications into a normalized, constrained, implementation-ready database schema for the real product. Lifecycle, security, and indexing patterns are decisions made on Stage 3 evidence — never excluded by rule, and never added as blanket defaults. Every inclusion and every omission is a recorded decision with a citation.

---

## 1. Column Type Mapping

Resolve Stage 3 functional field descriptions to column types. The mapping is **dialect-parametric**: PostgreSQL is the reference dialect below. When technical-architecture.md Section 3 selects a different database, apply the Principle column using that database's native types and document the mapping used in Section 2 of database-schema.md (a Notes-cell entry per non-obvious mapping is sufficient). Where the selected database lacks a native type for a principle (no native boolean, UUID, or timezone-aware timestamp), apply the principle with the closest faithful representation and record the choice.

| Functional Description | Principle | Reference Mapping (PostgreSQL) |
|------------------------|-----------|--------------------------------|
| Name, title, label, description (short) | Bounded text — enforce a sane length | `VARCHAR(255)` |
| Long text, notes, body content | Unbounded text | `TEXT` |
| Count, quantity, integer amount | Exact integer | `INTEGER` |
| Price, cost, monetary value | Exact decimal — never binary floating point | `DECIMAL(10,2)` |
| Yes/no, enabled/disabled, flag | Native boolean where available | `BOOLEAN` |
| Date only | Calendar date without time-of-day | `DATE` |
| Date and time, timestamp | Timezone-aware timestamp | `TIMESTAMPTZ` |
| Email | Bounded text with format constraint | `VARCHAR(255)` with CHECK (format) |
| URL | Unbounded text | `TEXT` |
| Percentage, ratio | Exact decimal with bounded precision | `DECIMAL(5,2)` |
| JSON/flexible structure | Native structured type where available | `JSONB` |
| Image/file reference | Text reference (URL/path) — binary content lives in object storage, not the database | `TEXT` |
| UUID/identifier | Native UUID type where available | `UUID` |

---

## 2. Standard Columns

Add these columns to every entity table automatically:

| Column | Principle | Reference Mapping (PostgreSQL) | Nullable | Default | Purpose |
|--------|-----------|--------------------------------|----------|---------|---------|
| `id` | Native UUID type where available | `UUID` | NO | `gen_random_uuid()` | Primary key. UUIDs preferred over auto-increment for portability across environments and safe merging of data |
| `created_at` | Timezone-aware timestamp | `TIMESTAMPTZ` | NO | `NOW()` | Record creation timestamp |
| `updated_at` | Timezone-aware timestamp | `TIMESTAMPTZ` | NO | `NOW()` | Last modification timestamp. Updated on every write |

Lifecycle & governance columns (`deleted_at`, `created_by`/`updated_by`, `version`, `tenant_id`) are **not** standard columns — each is a per-entity (or, for tenancy, product-level) decision made under Section 3 below and recorded with evidence in Section 4 of database-schema.md.

---

## 3. Data Lifecycle & Governance Decisions

Every entity gets an explicit, evidence-cited decision for each of the four lifecycle & governance patterns, recorded in the per-entity table of database-schema.md Section 4. A pattern is included when its activating evidence exists and omitted when it does not — both directions are recorded decisions with citations, never blanket rules.

| Pattern | Columns / Mechanism | Activating Evidence | Decision Rule |
|---------|--------------------|--------------------|---------------|
| Soft delete | `deleted_at` (+ documented restore path) | An Entity-Lifecycle Coverage Matrix Delete/Archive "How" cell (feature-overview.md) states soft delete, archive, trash, or a restore path; undo/restore behavior in Screen specs | Include when any feature's Delete/Archive cell specifies soft delete or a restore path — cite that cell. Use hard delete when the cell states hard delete with no restore — cite that cell too. |
| Audit columns | `created_by` / `updated_by` (FKs to the user table) | More than one role can modify the entity (Access Matrix in user-persona.md via technical-architecture.md Section 11; Contention lines in feature-dependency-map.md naming multiple roles); audit-trail or accountability language in specs; compliance flags in Non-Functional Notes | Include when the entity is modified by more than one role or an audit/compliance expectation is recorded — cite the Access Matrix row, Contention line, or compliance flag. |
| Optimistic locking | `version` | A Contention line's resolution expectation is reject-with-refresh or merge (feature-dependency-map.md, Shared Data Entities); the Collaboration/concurrency signal fires in technical-profile.md Section 3 | Include when concurrent modification is expected and the resolution expectation is anything other than last-write-wins — cite the Contention line or profile signal. |
| Retention / purge | Retention window + purge or anonymization mechanism | Delete/Archive cell retention/purge expectations; compliance flags (e.g., deletion-request obligations) in Non-Functional Notes and assumptions-constraints.md | Record the retention expectation per entity. Indefinite retention is a decision too and cites its source (e.g., an explicit non-goal in feature-overview.md). |

### Multi-Tenancy

Multi-tenancy is a single **product-level** decision, recorded as the multi-tenancy line in database-schema.md Section 4.

- **Activating evidence:** BRIEF.md Target Users & Roles describing organizations, teams, or workspaces; personas or an Access Matrix scoped to an organization; B2B/multi-organization positioning in the brief's Business Context; explicit multi-tenancy scope entries.
- **When activated:** record the isolation model at the decision level — shared schema with `tenant_id` on every tenant-owned table (with tenant scoping added to every Section 5 access policy), schema-per-tenant, or database-per-tenant — with rationale. Deeper tenancy engineering belongs to the implementing team.
- **When not activated:** record `Single-tenant — {evidence}`, citing the source (e.g., a single-user Access Matrix or a scope-boundaries.md exclusion).

---

## 4. Normalization Rules (3NF Checklist)

Apply Third Normal Form to every entity. For each entity, verify all three levels:

### First Normal Form (1NF)
- No repeating groups. No comma-separated values in any column.
- Every column holds a single atomic value.
- If a functional field says "tags" or "categories" (plural), it needs a junction table, not a comma-separated column.

### Second Normal Form (2NF)
- Every non-key column depends on the **entire** primary key.
- Relevant mainly for junction tables with composite keys — ensure no column depends on only part of the key.

### Third Normal Form (3NF)
- No transitive dependencies. Every non-key column depends on the key and nothing but the key.
- If column B determines column C, and column A (the key) determines column B, then C should be in a separate table keyed by B.

### Intentional Denormalization
- If Stage 3 specs show a read pattern requiring 3+ table joins for a common display, **note it** as a denormalization candidate but **do NOT denormalize** in the schema design.
- Normalize first. Denormalization is a decision for the implementing team, made against measured performance — the schema document records candidates (database-schema.md Section 6), not denormalized designs.

---

## 5. Constraint Rules

### NOT NULL (default)
Every column is NOT NULL unless:
- The functional field description says "optional"
- The relationship is optional (a child can exist without this parent)
- The field represents data that is legitimately absent at creation time (not "unknown" — absent)

### UNIQUE
Apply UNIQUE constraints to:
- Email fields (unique per active record)
- Slug fields
- Any field described as "must not be duplicated" or "unique identifier"
- Natural keys when entities have them (e.g., ISO country code)

### CHECK
Apply CHECK constraints for:
- Price/monetary values: `CHECK (price >= 0)` (or `> 0` if zero is invalid)
- Percentage fields: `CHECK (percentage >= 0 AND percentage <= 100)`
- Status/enum columns: `CHECK (status IN ('active', 'inactive', 'archived'))`
- Any field with explicit range or format constraints in the Stage 3 spec

### Foreign Key
Every relationship must have a FK constraint (defined during relationship design).

### Primary Key
`id` column on every table (defined in Standard Columns).

---

## 6. Relationship Implementation

### Relationship Type Patterns

| Relationship Type | Implementation |
|-------------------|---------------|
| One-to-many | Foreign key column on the "many" side table. Column name: `{parent_table_singular}_id`. NOT NULL unless the relationship is optional. |
| Many-to-many | Junction table named `{table_a}_{table_b}` (alphabetical order). Two FK columns, composite primary key. If the relationship has its own attributes (e.g., "enrollment date", "role", "sort order"), the junction table becomes a full entity with its own `id` primary key. |
| One-to-one | Foreign key on the dependent side. Rare — validate that these shouldn't be merged into one table. Only keep separate for: security isolation (e.g., User + UserProfile where profile has PII) or large optional data blobs. |

### Cascade Behavior

Select cascade behavior based on the entity lifecycle from Stage 3 (which feature deletes the entity, what happens to dependents — the Delete/Archive cells of the Entity-Lifecycle Coverage Matrix state the cascade expectation):

| Scenario | ON DELETE | ON UPDATE |
|----------|-----------|-----------|
| Child cannot exist without parent (e.g., OrderItem without Order) | `CASCADE` | `CASCADE` |
| Child should survive parent deletion (e.g., Comment when User is deleted) | `SET NULL` | `CASCADE` |
| Parent deletion should be blocked if children exist (e.g., Category with Products) | `RESTRICT` | `CASCADE` |

---

## 7. Enum-vs-Lookup Decision Rule

| Use a database enum type when... | Use a lookup table when... |
|-----------------------------------|---------------------------|
| Value set is small (< 8 values) | More than 8 values exist |
| Values are truly stable (won't change without a code change) | Values may change at runtime |
| No metadata needed per value | Additional attributes needed (description, sort order, display label) |

When in doubt, prefer a lookup table — it is more flexible and requires no schema migration to add values.

---

## 8. Attribute-vs-Entity Decision Rule

Model as a **separate entity** when the concept has:
- Independent identity (exists on its own, not just as a property of something else)
- Its own describable attributes (more than just a name/value)
- Multiple instances per parent (a user can have multiple addresses)
- Needs to be queried independently (search by city, filter by category)

Model as an **attribute** (column on the parent table) when:
- No independent identity
- Single value per parent
- Never referenced by other entities
- Never queried independently

**Example:** If "Address" is just a text field in one spec, it's an attribute. If multiple entities reference addresses or users can have multiple addresses, it's an entity.

---

## 9. Anti-Pattern Checklist

Run these 9 checks against the completed schema. Record pass/fail for each:

| # | Anti-Pattern | What to Check |
|---|-------------|---------------|
| 1 | No primary keys | Every table has a PK (should always pass — Standard Columns adds `id`) |
| 2 | Missing foreign keys | Every relationship has a corresponding FK constraint |
| 3 | VARCHAR for everything | Column types are specific to data semantics (Section 1 type mapping) |
| 4 | Integer for money | Monetary values use DECIMAL, not INTEGER or FLOAT |
| 5 | Comma-separated values | No column stores multiple values as delimited strings (normalization catches this) |
| 6 | Missing FK indexes | Every FK column has an index (auto-created by most ORMs, but note explicitly) |
| 7 | No timezone on timestamps | All timestamp columns use TIMESTAMPTZ (PostgreSQL) or store ISO 8601 with timezone offset (SQLite) |
| 8 | Polymorphic associations without constraints | No `parent_type` + `parent_id` pattern — use exclusive belongs-to with nullable FKs and CHECK |
| 9 | God tables | No table has more than 20 columns. If a table exceeds this, consider vertical partitioning |

---

## 10. Security & Access Model

Authorization enforcement at the data layer, recorded in database-schema.md Section 5. The role model comes from technical-architecture.md Section 11's role/permission mapping (which derives it from the Access Matrix in user-persona.md) — the schema never invents roles.

### Enforcement Model Rule

- When the selected database (technical-architecture.md Section 3) supports **row-level security (RLS)**, RLS is the primary authorization mechanism at the data layer: sketch per-table policies.
- Otherwise, define the **application-layer authorization boundary**: name the enforcement point (which layer checks access before queries run) and the per-table access rules the implementing team must enforce, and mark the tables whose rows are role- or owner-partitioned.

### Policy Sketch Content

For each table carrying access rules: the operation (SELECT / INSERT / UPDATE / DELETE), the role(s) from the Section 11 mapping, and a predicate sketch — plain terms plus an indicative SQL fragment, not final DDL. Map Access Matrix levels mechanically:

- `Own-only` → ownership predicate (e.g., `user_id = current user`)
- `View` → read-only policy (SELECT permitted, no write policy)
- `Full` → all operations, scoped to the role's reachable rows
- `None` → no policy for that role on that table

Multi-tenant products (per the Section 3 multi-tenancy decision): every policy additionally scopes by tenant.

### Sensitive Fields

Source: the Data Sensitivity lines of feature-dependency-map.md (Shared Data Entities) and the privacy entries of each feature-overview's Non-Functional Notes. For every field the specs classify as sensitive, record a protection note: encryption at rest, masking in list and log surfaces, and/or a restricted read set. Compliance flags (e.g., deletion-request obligations) connect these notes to the Section 4 retention/purge decisions. When no spec marks fields sensitive, state exactly that with its citation.

---

## 11. Indexing Strategy

Read-pattern-driven indexes beyond the PK/FK/unique baseline, recorded in database-schema.md Section 7.

### Baseline

Primary-key, foreign-key, and unique indexes are always present (defined per table in Section 2 of the output). They need no driver citation.

### Read-Pattern Index Rule

Derive additional indexes from cited read-pattern evidence, one-line citation per index:

- **Hub screens** (technical-profile.md Complexity Metrics) — the columns their queries filter and sort by
- **Search and filter signals** (technical-profile.md Capability Signals; Screen specs' list/search/filter sections) — search columns get the dialect's appropriate index type (note full-text index types where the selected database supports them)
- **Sort keys of large lists** — columns ordering high-volume list screens (data-volume evidence from Non-Functional Notes)
- **High fan-in reads** — entities whose Lifecycle line shows many "Read by" features; composite FK + status/date indexes for their common queries

**Restraint rule:** no speculative indexes. An index without a citable read-pattern driver is not recorded.

### Growth-Tier Options

Partitioning, read replicas, and materialized read models may be **noted** as growth-tier options for the implementing team when data-volume evidence (Non-Functional Notes, profile demand-side inputs) suggests them — each named with a one-line trigger condition, never deep-designed in the schema document.
