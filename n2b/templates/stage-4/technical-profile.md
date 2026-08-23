---
document_type: technical-profile
produced_by: profile-analyst
status: {draft | final}
stage: 4
created: {YYYY-MM-DD}
project_name: {from BRIEF.md}
---

# Project Technical Profile

<!-- Rules for this document:
  - This document presents evidence, NOT decisions. No prescriptive or advisory language.
  - All quantitative metrics extracted via Bash/grep from Stage 3 output files, not LLM estimation.
  - Every Capability Signal must include spec-ID provenance (list of specs that exhibit the signal).
    The ten demand-side signals (Payments/billing, Notifications (email/push/SMS), Third-party
    integrations, AI/ML behavior, Geo/maps, Import/export, Collaboration/concurrency,
    Compliance/privacy, Internationalization, Scale hints) may additionally cite BRIEF.md sections
    and assumptions-constraints.md ASMP-XX entries as provenance.
  - Section 3 carries exactly 17 signal rows with the exact signal names shown -- never rename,
    merge, or drop a row. Downstream decision-area activation maps to these names byte-exactly.
  - Section 4 classifications must reference the threshold definitions table within that section.
    The classification describes blueprint scope, not deployment scale -- deployment-scale
    evidence lives in Section 7 and must never be derived from document counts.
  - Section 7 is verbatim-quote evidence only: copy the source text exactly, attribute every
    quote to its file and section, add zero interpretation, summary, or paraphrase.
  - Do not interpret or rank metrics -- present raw counts and classifications only.
  - Before writing, update all frontmatter fields: document_type, produced_by, status, stage, created (today's date), project_name.
-->

## 1. Scale Metrics

{Quantitative scale metrics extracted from Stage 3 outputs. Feature count from the `FEAT-*` folders in `.n2b/specifications/`; total specs from the spec files on disk; spec types from spec frontmatter across all five types.}

| Metric | Value |
|--------|-------|
| Total features | {N} |
| Total specs | {N} |
| Screen specs | {N} |
| Automation specs | {N} |
| Logic/Rule specs | {N} |
| Integration specs | {N} |
| Notification specs | {N} |
| User-Facing features | {N} |
| Platform features | {N} |
| Lifecycle features | {N} |

<!-- EXAMPLE (meal tracker):
| Metric | Value |
|--------|-------|
| Total features | 6 |
| Total specs | 24 |
| Screen specs | 13 |
| Automation specs | 6 |
| Logic/Rule specs | 2 |
| Integration specs | 2 |
| Notification specs | 1 |
| User-Facing features | 4 |
| Platform features | 1 |
| Lifecycle features | 1 |
END EXAMPLE -->

## 2. Complexity Metrics

{Structural complexity metrics extracted from product-features.md, feature-dependency-map.md, and feature-overview.md files. All values are counted, not estimated.}

| Metric | Value |
|--------|-------|
| Entity count | {N from the Domain Entity Inventory in product-features.md} |
| Inter-entity relationships | {N from the Shared Data Entities subsections of feature-dependency-map.md} |
| Cross-feature business rules (XBR) | {N from the Cross-Feature Business Rules table in feature-dependency-map.md} |
| Cross-feature touchpoint rows | {N summed across the Cross-Feature Touchpoints tables in all feature-overview.md files} |
| Cross-feature integration density | {touchpoint rows / feature count} |
| Navigation connections | {N from the Navigation Connections table in feature-dependency-map.md} |
| Hub screens (3+ inbound connections) | {N -- list screen names} |
| Average specs per feature | {total specs / total features} |

<!-- EXAMPLE (meal tracker):
| Metric | Value |
|--------|-------|
| Entity count | 8 |
| Inter-entity relationships | 12 |
| Cross-feature business rules (XBR) | 3 |
| Cross-feature touchpoint rows | 11 |
| Cross-feature integration density | 1.83 (11 / 6) |
| Navigation connections | 18 |
| Hub screens (3+ inbound connections) | 2 (Dashboard, Meal History) |
| Average specs per feature | 4.0 |
END EXAMPLE -->

## 3. Capability Signals

{Capability signals detected by scanning all specs -- all five types, including the Integration specs' Capability Category / Data Exchanged / Inbound Events / Degradation Behavior sections and the Notification specs' Channels / Trigger / Delivery Rules sections -- plus BRIEF.md and assumptions-constraints.md for the demand-side signals. Each signal includes the spec IDs that exhibit it as provenance; the ten demand-side signals may additionally cite BRIEF.md sections and ASMP-XX entries.}

| Signal | Present | Detail |
|--------|---------|--------|
| Real-time | {Yes / No} | {Spec IDs describing live-updating data, WebSocket connections, or collaborative editing, or "No specs reference real-time behavior"} |
| Offline | {Yes / No} | {Spec IDs or assumptions describing offline-first behavior, or "No specs or assumptions reference offline capability"} |
| File upload | {Yes / No} | {Spec IDs describing image upload, file attachment, or media handling, or "No specs reference file/media handling"} |
| Complex forms (10+ fields) | {Yes / No} | {Spec IDs of Screen specs with 10+ fields, conditional visibility, or multi-step wizards, or "No specs exceed 10 fields"} |
| Background processing | {Yes / No} | {Spec IDs of Automation specs with scheduled triggers, or "No scheduled automations"} |
| Authentication | {Yes / No} | {Spec IDs describing login, registration, role-based access, or user-specific data. Complexity: none / simple session / role-based} |
| Search | {Yes / No} | {Spec IDs describing search, filtering, or faceted search. Complexity: none / simple filter / full-text} |
| Payments/billing | {Yes / No} | {Spec IDs describing payments, subscriptions, invoicing, or refunds; ASMP entries naming a payment-processing capability; BRIEF.md Business Context or Ecosystem & Integrations citations -- or "No specs reference payment or billing behavior"} |
| Notifications (email/push/SMS) | {Yes / No} | {Notification spec IDs with their Channels values; ASMP entries naming a message-delivery capability -- or "No specs reference notification delivery"} |
| Third-party integrations | {Yes / No} | {Integration spec IDs with their Capability Category values; External Touchpoints rows; BRIEF.md Ecosystem & Integrations citations -- or "No specs reference external integrations"} |
| AI/ML behavior | {Yes / No} | {Spec IDs describing generation, recommendation, classification, or prediction behavior; ASMP entries naming an AI capability -- or "No specs reference AI or machine-learning behavior"} |
| Geo/maps | {Yes / No} | {Spec IDs describing location, mapping, geocoding, or proximity behavior -- or "No specs reference location or mapping behavior"} |
| Import/export | {Yes / No} | {Spec IDs describing bulk import, export, or file-based data transfer -- or "No specs reference bulk import or export behavior"} |
| Collaboration/concurrency | {Yes / No} | {Spec IDs describing concurrent multi-user editing or shared workspaces; dependency-map Contention lines with a non-"None" value -- or "No specs reference concurrent multi-user behavior"} |
| Compliance/privacy | {Yes / No} | {Spec IDs, Data Sensitivity lines, and ASMP entries naming a compliance regime or privacy posture -- or "No specs or assumptions reference compliance or privacy obligations"} |
| Internationalization | {Yes / No} | {Spec IDs describing multi-language, locale, currency, or regional behavior -- or "No specs reference internationalization behavior"} |
| Scale hints | {Yes / No} | {ASMP entries and BRIEF.md Scale & Non-Functional Expectations statements about volumes, growth, or usage magnitude; feature-overview Data volumes / growth lines -- or "No specs or upstream documents state scale expectations"} |

<!-- EXAMPLE (meal tracker):
| Signal | Present | Detail |
|--------|---------|--------|
| Real-time | No | No specs reference real-time behavior |
| Offline | No | No specs or assumptions reference offline capability |
| File upload | Yes | FEAT-04.SPEC-002 (profile image upload) |
| Complex forms (10+ fields) | Yes | FEAT-01.SPEC-001 (meal entry, 12 fields), FEAT-03.SPEC-004 (goal setup, 11 fields) |
| Background processing | Yes | FEAT-05.SPEC-003 (daily summary generation, scheduled) |
| Authentication | Yes | Simple session -- FEAT-06.SPEC-001 (login), FEAT-06.SPEC-002 (registration) |
| Search | Yes | Simple filter -- list screens use column filtering, no full-text search |
| Payments/billing | No | No specs reference payment or billing behavior; assumptions-constraints.md Dependencies names no payment-processing capability |
| Notifications (email/push/SMS) | Yes | FEAT-05.SPEC-004 (daily logging reminder, Channels: push); ASMP-18 (device-notification delivery capability, assumptions-constraints.md Dependencies) |
| Third-party integrations | Yes | FEAT-02.SPEC-004 (food data import, Capability Category: food-composition data); External Touchpoints rows: food-composition data, device-notification delivery; ASMP-16 |
| AI/ML behavior | No | No specs reference AI or machine-learning behavior |
| Geo/maps | No | No specs reference location or mapping behavior |
| Import/export | No | No specs reference bulk import or export behavior |
| Collaboration/concurrency | No | No specs reference concurrent multi-user behavior; every dependency-map Contention line reads "None" |
| Compliance/privacy | Yes | GDPR-class handling -- Data Sensitivity line on Meal Entry (feature-dependency-map.md); ASMP-14, ASMP-15 (assumptions-constraints.md, Non-Functional Expectations) |
| Internationalization | No | No specs reference internationalization behavior |
| Scale hints | Yes | ASMP-13 (~2,000 meal entries per user per year, multi-year history); BRIEF.md Scale & Non-Functional Expectations (personal single-user usage pattern) |
END EXAMPLE -->

## 4. Derived Classifications

{Three-axis classification based on metrics from Sections 1-3. Each axis classified as Small, Medium, or Large using the threshold definitions below.}

**Classification rule:** the classification describes blueprint scope -- how much product definition the architecture must cover -- not deployment scale. Deployment-scale evidence (users, traffic, data growth) lives in Section 7 and must never be derived from document counts.

### Threshold Definitions

| Axis | Small | Medium | Large |
|------|-------|--------|-------|
| Scale | 1-8 features, <=40 specs | 9-24 features, 41-200 specs | 25+ features, 201+ specs |
| Data Complexity | <=10 entities, few cross-entity rules | 11-30 entities, moderate relationship graph and cross-entity rules | 31+ entities, dense relationship graph |
| Interaction Complexity | Mostly CRUD screens, <=5 automations, no real-time or collaboration signals | Mixed screens with state, 6-15 automations, integration or notification behavior present | Complex state machines, 16+ automations, real-time or collaboration signals present |

### Project Classification

| Axis | Classification | Evidence |
|------|---------------|----------|
| Scale | {Small / Medium / Large} | {Feature count and spec count from Section 1} |
| Data Complexity | {Small / Medium / Large} | {Entity count and cross-entity rules from Section 2} |
| Interaction Complexity | {Small / Medium / Large} | {Automation count and interaction patterns from Sections 1-3} |

<!-- EXAMPLE (meal tracker):
### Project Classification

| Axis | Classification | Evidence |
|------|---------------|----------|
| Scale | Small | 6 features, 24 specs |
| Data Complexity | Small | 8 entities, 3 cross-feature business rules |
| Interaction Complexity | Medium | 13 Screen specs with mixed interaction patterns, 6 Automation specs, 2 Integration specs, 1 Notification spec |

**Summary:** Small / Small / Medium

(Blueprint scope only -- the deployment-scale evidence for this product lives in Section 7.)
END EXAMPLE -->

## 5. Entity Inventory

{Complete listing of all entities from the Domain Entity Inventory in product-features.md, enriched with the Shared Data Entities detail from feature-dependency-map.md where an entity appears there. Extracted directly -- not interpreted. Field Count is the number of functional fields listed in the entity's Shared Data Entities subsection; entities that appear only in product-features.md carry "--" for Field Count and Relationships. Carry blank fields or "--" through unchanged.}

| Entity Name | Managing Feature | Field Count | Relationships |
|-------------|-----------------|-------------|---------------|
| {Entity} | {FEAT-NN (Feature Name)} | {N or --} | {Related Entity (type), ... or --} |

<!-- EXAMPLE (meal tracker):
| Entity Name | Managing Feature | Field Count | Relationships |
|-------------|-----------------|-------------|---------------|
| User | FEAT-06 (Account) | 5 | Meal (one-to-many), Goal (one-to-many), Setting (one-to-one) |
| Meal | FEAT-01 (Meal Logging) | 8 | User (many-to-one), Food (many-to-many via MealFood), Category (many-to-one) |
| Food | FEAT-02 (Food Database) | 6 | Meal (many-to-many via MealFood), Category (many-to-one) |
| Category | FEAT-02 (Food Database) | 3 | Food (one-to-many), Meal (one-to-many) |
| Goal | FEAT-03 (Goals) | 7 | User (many-to-one), Progress (one-to-many) |
| Progress | FEAT-03 (Goals) | -- | -- |
| Notification | FEAT-05 (Notifications) | -- | -- |
| Setting | FEAT-04 (Settings) | 4 | User (one-to-one) |
END EXAMPLE -->

## 6. Raw Spec Index

{Complete listing of all specs across all features. Compiled from all feature-overview.md Spec Inventory tables.}

| Spec ID | Name | Type | Feature | Key Signals |
|---------|------|------|---------|-------------|
| {FEAT-NN.SPEC-NNN} | {Spec Name} | {Screen / Automation / Logic/Rule / Integration / Notification} | {FEAT-NN (Feature Name)} | {Capability signals this spec contributes to, or "--"} |

<!-- EXAMPLE (meal tracker):
| Spec ID | Name | Type | Feature | Key Signals |
|---------|------|------|---------|-------------|
| FEAT-01.SPEC-001 | Meal Entry | Screen | FEAT-01 (Meal Logging) | Complex forms (12 fields) |
| FEAT-01.SPEC-002 | Meal List | Screen | FEAT-01 (Meal Logging) | Search (simple filter) |
| FEAT-01.SPEC-003 | Meal Delete | Automation | FEAT-01 (Meal Logging) | -- |
| FEAT-02.SPEC-004 | Food Data Import | Integration | FEAT-02 (Food Database) | Third-party integrations |
| FEAT-04.SPEC-002 | Profile Edit | Screen | FEAT-04 (Settings) | File upload (profile image) |
| FEAT-05.SPEC-003 | Daily Summary | Automation | FEAT-05 (Notifications) | Background processing (scheduled) |
| FEAT-05.SPEC-004 | Daily Logging Reminder | Notification | FEAT-05 (Notifications) | Notifications (email/push/SMS) |
| FEAT-06.SPEC-001 | Login | Screen | FEAT-06 (Account) | Authentication |
END EXAMPLE -->

## 7. Demand-Side Inputs

{Verbatim-quote evidence of what the product's world demands of the architecture: expected scale, non-functional expectations, and the external systems and capabilities the product must live alongside. Every quote is copied exactly from its source and attributed to file + section. Zero interpretation: no summarizing, no paraphrase, no inference. "Unknown -- flagged as open question" lines and "None -- ..." forms are evidence too -- quote them as-is.}

### From BRIEF.md -- Scale & Non-Functional Expectations

> {Verbatim content of the "## Scale & Non-Functional Expectations" section of BRIEF.md}

### From BRIEF.md -- Ecosystem & Integrations

> {Verbatim content of the "## Ecosystem & Integrations" section of BRIEF.md}

### From assumptions-constraints.md -- Non-Functional Expectations

{Every ASMP entry from the "## Non-Functional Expectations" section, quoted verbatim with its ID.}

> {ASMP-XX: verbatim expectation statement and Basis line}

### From assumptions-constraints.md -- Dependencies

{Every ASMP entry from the "## Dependencies" section, quoted verbatim with its ID.}

> {ASMP-XX: verbatim dependency statement}

### From feature-dependency-map.md -- External Touchpoints

{The "## External Touchpoints" table copied verbatim, or its legal empty form quoted as-is.}

| Capability Category | Features Involved | Integration Specs |
|---------------------|-------------------|-------------------|
| {copied verbatim} | {copied verbatim} | {copied verbatim} |

<!-- EXAMPLE (meal tracker):
### From BRIEF.md -- Scale & Non-Functional Expectations

> "Personal, single-user product. A user logs 3-6 meals per day on a phone; history accumulates
> over years and the app must stay equally fast with several years of entries. Unknown -- flagged
> as open question: expected number of users at launch."
> -- BRIEF.md, ## Scale & Non-Functional Expectations

### From BRIEF.md -- Ecosystem & Integrations

> "- Pulls food-composition data from an external food database (functional relationship: search
>   and nutrient lookup during logging)
> - Standalone otherwise (confirmed)"
> -- BRIEF.md, ## Ecosystem & Integrations

### From assumptions-constraints.md -- Non-Functional Expectations

> ASMP-12: "Responsiveness: food search results appear within ~1 second of typing, and logging a
> meal completes end-to-end in under 30 seconds." -- Basis: the brief's "without obsessive
> tracking" goal makes low-friction speed the product's defining quality bar.
> ASMP-13: "Data volume and growth: a user generates roughly 3-6 meal entries per day (~2,000 per
> year), and the product stays equally responsive with several years of accumulated history."
> ASMP-14: "Privacy posture: logged data is private to the user by default, is never shared or
> sold, and the user can permanently delete all of their data on request."
> ASMP-15: "Compliance: eating-habit logs for personal awareness are treated as personal data
> (GDPR-class protection for account and log data); no medical-data regime applies unless the
> product later targets users managing medical conditions."

### From assumptions-constraints.md -- Dependencies

> ASMP-16: "Food-composition data capability -- The product requires access to a searchable body
> of food items for the meal search and logging feature."
> ASMP-18: "Device-notification delivery capability -- The optional daily logging reminder
> requires the ability to deliver notifications to the user's device."

### From feature-dependency-map.md -- External Touchpoints

| Capability Category | Features Involved | Integration Specs |
|---------------------|-------------------|-------------------|
| Food-composition data | FEAT-01, FEAT-02 | FEAT-02.SPEC-004 |
| Device-notification delivery | FEAT-01 | FEAT-01.SPEC-007 |
END EXAMPLE -->
