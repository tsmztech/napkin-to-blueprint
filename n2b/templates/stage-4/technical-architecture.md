---
document_type: technical-architecture
produced_by: technical-architect
status: {draft | final}
stage: 4
prerequisites:
  - .n2b/architecture/technical-profile.md
  - .n2b/architecture/technology-landscape.md
  - .n2b/architecture/technical-feasibility.md
  {- .n2b/specifications/design-system/ — only when the package carries the user-supplied passthrough}
created: {YYYY-MM-DD}
---

# Technical Architecture -- {Product Name}

<!-- Rules for this document:
  - Every active decision area is recorded in the ADR shape: a Context / Recommended / Rationale field table followed by an **Alternatives:** table carrying the six trade-off axes (Cost Profile, Operational Complexity, Scale Ceiling, Lock-in, Team Skill Demand, Choose instead when), with 2-3 alternative rows (at least 1).
  - Every decision must cite a profile driver -- a specific metric, signal, or classification from Section 1 -- never a general preference or "industry standard".
  - Recommended options and alternatives come from technology-landscape.md. Recommending a technology absent from the landscape requires a deviation ADR citing why the landscape missed it.
  - The active decision-area set is the landscape's Research Scope table -- activation is never re-decided in this document.
  - No scope expansion: the architecture translates the Stage 3 blueprint; it does not invent new features, screens, or entities.
  - All 14 sections must be non-empty (Gate 4 Category 1).
  - Section 2: every value not carried by an upstream document is explicitly marked "Assumption —" -- never a silently invented load figure, target, or compliance posture.
  - Section 4 always carries all 11 signal-activated area headings, plus one heading per Research Scope extension area (Product-mandated rows) after them. Active areas get a full decision block; inactive areas get the single line "Not activated — {signal evidence from profile Section 3}" and appear in neither the Research Scope nor the Decision Log.
  - The Decision Log (Section 14) is pasted from the running register and must have at least as many ADR entries as the landscape's Research Scope table has rows (Gate 4 Category 7). Category values are Research Scope area names (registry names for registered areas, coined names for extension areas), byte-exact.
  - Before writing, update all frontmatter fields: document_type, produced_by, status, stage, prerequisites, created (today's date).
-->

## 1. Project Technical Profile

{Paste the complete BODY of technical-profile.md -- everything BELOW its closing `---` frontmatter delimiter. Never paste the profile's YAML frontmatter block: a second frontmatter block mid-document breaks markdown and frontmatter parsers. This section is the evidence base -- every later section references it. Beyond dropping the frontmatter, do not modify, summarize, or reformat the profile content.}

## 2. Non-Functional Requirements & Scale Design

{The demand side of the architecture, sourced from the profile's Section 7 (Demand-Side Inputs). State the expected launch and growth load assumptions, performance targets, availability posture, security posture, and compliance obligations this architecture is designed against. Every value carried by an upstream document cites its quote from profile Section 7; every value the upstream documents do not carry is explicitly marked "Assumption —" with a one-line basis. Gate 4 Category 6 requires at least 5 non-blank content lines here.}

| Dimension | Expectation | Source |
|-----------|-------------|--------|
| Launch load | {expected users / traffic / data volume at launch} | {profile Section 7 quote, or "Assumption — {basis}"} |
| Growth trajectory | {expected growth over the first 1-2 years} | {profile Section 7 quote, or "Assumption — {basis}"} |
| Performance targets | {response-time / interaction expectations} | {profile Section 7 quote, or "Assumption — {basis}"} |
| Availability posture | {uptime expectation and tolerance for downtime} | {profile Section 7 quote, or "Assumption — {basis}"} |
| Security posture | {data protection expectations, sensitive data classes} | {profile Section 7 quote, or "Assumption — {basis}"} |
| Compliance obligations | {regimes named upstream (e.g., GDPR-class), or "None identified upstream"} | {profile Section 7 quote, or "Assumption — {basis}"} |

{1-2 closing paragraphs: how these expectations shape the decisions below -- which dimensions are the binding drivers, and which are comfortably within any candidate's range.}

<!-- EXAMPLE (meal tracker):
| Dimension | Expectation | Source |
|-----------|-------------|--------|
| Launch load | "A few hundred users in the first months, mobile-first usage in short bursts" | Profile Section 7, BRIEF.md Scale & Non-Functional Expectations |
| Growth trajectory | "If it works, low tens of thousands of users within two years" | Profile Section 7, BRIEF.md Scale & Non-Functional Expectations |
| Performance targets | Logging interactions complete in under a second on mobile networks | Profile Section 7, assumptions-constraints.md Non-Functional Expectations |
| Availability posture | Assumption — no upstream statement; single-region managed hosting with provider-standard uptime is adequate for a personal-tracking product | Assumption — no upstream evidence |
| Security posture | "Eating-habit logs are personal data — private to the user by default" | Profile Section 7, assumptions-constraints.md Non-Functional Expectations |
| Compliance obligations | GDPR-class handling of personal logs (EU users expected) | Profile Section 7, assumptions-constraints.md Non-Functional Expectations |

The binding drivers are the privacy posture (per-user data isolation shapes the database and access-model decisions) and mobile-network performance (shapes rendering and data-fetching choices). Launch and growth load are modest and comfortably within every candidate's range — cost efficiency at small scale matters more than scale ceilings.
END EXAMPLE -->

## 3. Technology Stack Decisions

{The 7 core stack decision areas, each in the ADR shape. Options and alternatives come from the matching Decision Area Landscape in technology-landscape.md; rationale cites profile drivers, Section 2 NFR drivers, and feasibility verdicts where relevant. Cross-check each selection against the landscape's Cross-Area Compatibility Notes and the decision guide's compatibility sanity rules.}

### Frontend Framework

| Field | Value |
|-------|-------|
| Context | {Profile drivers — scale classification, Screen spec count, interaction complexity + Section 2 NFR drivers + feasibility refs} |
| Recommended | {framework, with version where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {the condition under which this alternative beats the recommendation} |

### Backend / API Layer

| Field | Value |
|-------|-------|
| Context | {Profile drivers — frontend selection, API requirement signals, integration demands + Section 2 NFR drivers + feasibility refs} |
| Recommended | {technology / service, with version or tier where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### Database

| Field | Value |
|-------|-------|
| Context | {Profile drivers — entity count, data complexity, concurrency and contention evidence + Section 2 scale and privacy drivers + feasibility refs} |
| Recommended | {database / managed service, with tier where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### ORM / Data Access

| Field | Value |
|-------|-------|
| Context | {Profile drivers — database selection, entity count, migration expectations + feasibility refs} |
| Recommended | {library / approach, with version where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### CSS / Styling

| Field | Value |
|-------|-------|
| Context | {Profile drivers — screen/component complexity metrics + Section 2 drivers; plus supplied design-system token/pattern complexity when the package carries one (via Section 9 needs)} |
| Recommended | {approach / library, with version where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### State Management

| Field | Value |
|-------|-------|
| Context | {Profile drivers — Real-time and Collaboration/concurrency signals, interaction complexity classification + feasibility refs} |
| Recommended | {approach / library} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### Build Tooling

| Field | Value |
|-------|-------|
| Context | {Profile drivers — frontend framework selection (usually bundled by the meta-framework)} |
| Recommended | {tooling} |
| Rationale | {why — citing the framework selection and landscape entry} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

## 4. Platform & Service Decisions

{The 11 signal-activated decision areas, followed by any product-mandated extension areas. All 11 registered headings below are always present; after them, add one `### {Extension Area}` heading per Research Scope extension row (`Activated By: Product-mandated — …`), byte-identical to its row. An area activated in the landscape's Research Scope table gets a full decision block in the ADR shape (Context / Recommended / Rationale field table + **Alternatives:** table — same shape as Section 3); extension areas are always active. An inactive area gets exactly one line: "Not activated — {signal evidence from profile Section 3}". Inactive areas appear in neither the Research Scope nor the Decision Log.}

### File & Object Storage

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Email & Messaging Delivery

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Payments & Billing

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### AI & Intelligent Behavior

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Search

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Background Jobs & Scheduling

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Caching & Performance

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Real-time & Collaboration

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Analytics & Product Telemetry

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Geo & Maps

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

### Internationalization

{Active: full decision block in the ADR shape. Inactive: exactly one line — Not activated — {signal evidence from profile Section 3}.}

<!-- EXAMPLE (one active area, one inactive area):
### Search

| Field | Value |
|-------|-------|
| Context | Search signal: Yes — FEAT-02.SPEC-002 (food search, simple filter escalating to full-text on names); 8 entities, one searched corpus; Section 2 target: search results feel instant on mobile |
| Recommended | Postgres full-text search (tsvector/GIN) on the primary database |
| Rationale | The searched corpus is one entity with modest volume (profile Section 1: 6 features, 24 specs; Section 7: launch load in the hundreds of users); the landscape entry notes native FTS covers name-matching without a second service to operate |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| Algolia | Usage-based; free tier, then per-1k-search pricing | Low — managed SaaS | Very high | Medium — proprietary API and index format | Low | Search becomes a primary UX surface needing typo-tolerance, instant-search, and ranking control |
| Meilisearch Cloud | Low fixed monthly tier | Medium — separate service and index sync | High | Low — open source, self-hostable | Medium | The product needs faceted, typo-tolerant search with cost predictability beyond what native FTS handles |

### Geo & Maps

Not activated — profile Section 3: "No specs reference geographic display, location capture, or routing behavior."
END EXAMPLE -->

## 5. Project Structure

{Suggested starting structure for the recommended stack, adapted from project-structure-templates.md — or written from the recommended framework's own conventions when none of the reference trees matches. Includes feature-to-directory and spec-type-to-location mapping tables. Every FEAT-NN from the profile's Entity Inventory and Raw Spec Index appears in the mapping (Gate 4 Category 3).}

### Directory Tree

```
{Annotated directory tree showing where each type of file lives. Annotations explain the purpose of each directory.}
```

### Feature-to-Directory Mapping

{Maps each Stage 3 feature folder to its corresponding source directory.}

| Feature | Stage 3 Folder | Source Directory | Notes |
|---------|---------------|-----------------|-------|
| {FEAT-NN (Name)} | {FEAT-NN-slug/} | {src path} | {Any structural notes} |

### Spec-Type-to-Location Mapping

{Maps each of the five spec types to the file locations where its implementation would live.}

| Spec Type | File Location Pattern | Example |
|-----------|----------------------|---------|
| Screen | {path pattern for screen implementations} | {concrete example} |
| Automation | {path pattern for automation implementations} | {concrete example} |
| Logic/Rule | {path pattern for logic/rule implementations} | {concrete example} |
| Integration | {path pattern for integration service/client modules} | {concrete example} |
| Notification | {path pattern for notification delivery/template modules} | {concrete example} |

## 6. Data Layer Design

See `.n2b/architecture/database-schema.md` for the complete schema design.

**Migration strategy:** {push-based | migration-based}. {One-line rationale referencing entity count and project scale from Section 1, and the database + ORM selections from Section 3.}

## 7. API & Routing Architecture

{Route map, endpoint conventions, data fetching strategy, and navigation model.}

### Route Map

{Every Screen spec from the profile's Raw Spec Index mapped to a URL path — Gate 4 Category 4 checks route coverage with zero tolerance.}

| Screen Spec | URL Path | Parameters | Data Requirements |
|-------------|----------|------------|-------------------|
| {FEAT-NN.SPEC-NNN (Name)} | {/path} | {params or "--"} | {What data this route needs} |

### API Endpoint Convention

{Pattern for API endpoints -- resource naming, HTTP methods, response format. One-paragraph description with examples.}

### Data Fetching Strategy

{Server-rendered, client-side, server actions, or mixed -- per route type. Selection with rationale referencing profile metrics and Section 2 performance targets.}

| Route Type | Fetching Approach | Rationale |
|-----------|-------------------|-----------|
| {List pages} | {approach} | {why} |
| {Detail pages} | {approach} | {why} |
| {Form submissions} | {approach} | {why} |

### Navigation Model

{Primary navigation structure, URL hierarchy, and how users move between features.}

## 8. Integration Architecture

{One entry per external service the recommended architecture exchanges data with at runtime: the product's demanded touchpoints (the dependency map's External Touchpoints table, quoted in profile Section 7, and the Integration-spec demands surfaced in the feasibility document) plus any external services the architecture selections themselves introduce (Sections 3, 4, and 11). When the product has none, this section contains exactly: None — product has no external touchpoints (per feature-dependency-map.md).}

| Service | Purpose | Data Exchanged | Direction | Rate/Quota Notes | Failure-Mode Handling | Sandbox/Test Path |
|---------|---------|----------------|-----------|------------------|----------------------|-------------------|
| {service name} | {capability it fulfils, citing the touchpoint or selection} | {data in/out, sensitivity notes} | {outbound / inbound / bidirectional} | {rate limits, quotas, tier boundaries} | {behavior when the service is down or degraded — cite the Integration spec's Degradation Behavior where one exists} | {sandbox mode, test keys, or local substitute} |

<!-- EXAMPLE (meal tracker):
| Service | Purpose | Data Exchanged | Direction | Rate/Quota Notes | Failure-Mode Handling | Sandbox/Test Path |
|---------|---------|----------------|-----------|------------------|----------------------|-------------------|
| Open Food Facts API | Food-composition data (External Touchpoints: food-composition data, FEAT-02.SPEC-004) | Outbound queries by food name/barcode; inbound nutrition records; no personal data sent | Bidirectional | Public API, ~100 req/min fair use — cache results locally | Per FEAT-02.SPEC-004 Degradation Behavior: fall back to manual entry, queue enrichment for retry | Public API is free to test; record/replay fixtures for CI |
| Resend | Transactional email delivery (selected in Section 4, Email & Messaging Delivery) | Outbound weekly-summary emails; recipient address + summary content | Outbound | Free tier 3k emails/mo, then usage-based | Retry with backoff; summary remains visible in-app if delivery fails | Test API key mode with delivery sandbox |
END EXAMPLE -->

## 9. Design System Implementation Plan

**Design system posture:** {either: "User-supplied — `.n2b/specifications/design-system/` ({file list}); supplied values are mapped to code as-is and never redesigned." / or: "None (`design_system_source: none`) — this blueprint is design-agnostic; the downstream builder owns visual design, honoring the design preferences recorded in the brief's Constraints."}

{When user-supplied: maps the supplied design material to concrete code implementations — include the Token-to-Code Mapping and Component Inventory tables below. When none: omit those two tables and keep only the Component Library Decision.}

### Token-to-Code Mapping

{Only when the package carries a user-supplied design system.}

| Design System Element | Code Implementation | File Location |
|----------------------|--------------------|----|
| {Color token / Typography step / Spacing value} | {CSS variable / framework config / stylesheet variable} | {File path} |

### Component Inventory

{Only when the package carries a user-supplied design system.}

| Pattern | Component Name | File Path | Variants | Props |
|---------|---------------|-----------|----------|-------|
| {Supplied component pattern} | {Code component name} | {src path} | {Variant list or "--"} | {Key props or "--"} |

### Component Library Decision

{Component library selection with rationale referencing profile metrics — plus supplied design-system complexity when one exists — drawn from the technology-landscape.md coverage for the CSS / Styling area. "None — hand-built components on the selected styling approach" is a legal selection with evidence.}

## 10. Shared Infrastructure Patterns

{Pattern catalog covering cross-cutting concerns. Each pattern: name, when used, approach, file location, dependencies. All approaches consistent with the framework and CSS selections in the decision register.}

| Pattern | When Used | Approach | File Location | Dependencies |
|---------|-----------|----------|---------------|-------------|
| Layout system | {When} | {How} | {Where} | {What it depends on} |
| Navigation | {When} | {How} | {Where} | {Dependencies} |
| Error handling | {When} | {How} | {Where} | {Dependencies} |
| Loading/empty states | {When} | {How} | {Where} | {Dependencies} |
| Form handling | {When} | {How} | {Where} | {Dependencies} |
| Toast/notification | {When} | {How} | {Where} | {Dependencies} |

## 11. Authentication & Access Architecture

{A real identity decision — managed identity provider vs framework-native auth vs custom implementation — plus the session model, user model fields, protected routes, and the role/permission mapping derived from the Access Matrix in user-persona.md. When the profile's Authentication signal shows authentication is not required, record "Authentication is not required" as the Recommended value with the profile's evidence phrase — the section is never skipped and the mapping table still carries the (single) Access Matrix row.}

### Authentication & Identity

| Field | Value |
|-------|-------|
| Context | {Profile drivers — Authentication signal detail and driving spec IDs, role count from the Access Matrix, Section 2 security/compliance drivers + feasibility refs} |
| Recommended | {managed provider / framework-native auth / custom implementation — named, with tier where meaningful; or "Authentication is not required" with the profile's evidence phrase} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### Session Model

{Session mechanism (token/cookie/provider-managed), lifetime, refresh behavior, and where session state lives.}

### User Model Fields

{Fields the user entity needs to support identity, roles, and profile behavior — consistent with database-schema.md's user table.}

### Protected Routes

{Which routes or route groups require an authenticated session, and what unauthenticated users experience.}

| Route / Route Group | Access Requirement | Unauthenticated Experience |
|--------------------|--------------------|----------------------------|
| {route pattern} | {authenticated / role-gated ({role}) / public} | {redirect to sign-in / read-only view / hidden} |

### Role & Permission Mapping

{One row per role in the Access Matrix (user-persona.md). Maps each product role to its application representation and enforcement point. For a single-user product this is one row.}

| Role (Access Matrix) | Application Representation | Capability Access Summary | Enforcement Point |
|----------------------|---------------------------|---------------------------|-------------------|
| {role / persona} | {role value, claim, or "implicit — sole authenticated user"} | {summary of Full / View / Own-only / None access per capability group} | {where enforced: route guard, API layer, database policy} |

## 12. Development Conventions

{Naming conventions, structure rules, and coding standards. Each rule: one-line with code example.}

### Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Files (components) | {pattern} | `{example}` |
| Files (utilities) | {pattern} | `{example}` |
| Components | {pattern} | `{example}` |
| Functions | {pattern} | `{example}` |
| CSS classes | {pattern} | `{example}` |
| Database tables | {pattern} | `{example}` |
| Routes | {pattern} | `{example}` |

### Component Structure

{Rules for how components are organized internally -- imports, types, component body, exports.}

### Import Ordering

{Import group ordering convention with example.}

### TypeScript Usage

{Strict mode, interface vs type, any usage policy.}

### Path Aliases

{Alias definitions mapping short paths to directories.}

## 13. Deployment & Environments

{Production deployment is the required content of this section: the hosting, delivery, and observability decisions in the ADR shape, the environment topology, an order-of-magnitude cost model, and a short local development note. These are recommendations with documented alternatives for the implementing team — not provisioning instructions.}

### Hosting & Environments

| Field | Value |
|-------|-------|
| Context | {Profile drivers — framework/backend selections, Section 2 load and availability posture + feasibility refs} |
| Recommended | {hosting platform / model, with tier where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### CI/CD & Delivery

| Field | Value |
|-------|-------|
| Context | {Profile drivers — hosting selection, team/delivery expectations from Section 2 + repository assumptions} |
| Recommended | {CI/CD approach and tooling} |
| Rationale | {why — citing profile driver(s) + landscape entry} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

**Environment topology:** {dev / staging / prod — what each environment is for, how they map to branches or deploy targets, and how configuration/secrets differ per environment.}

**Infrastructure as code:** {whether IaC is warranted at this scale, the suggested tool if so, or "Not warranted at launch — {evidence}" with the growth trigger that would change the answer.}

### Observability & Operations

| Field | Value |
|-------|-------|
| Context | {Profile drivers — Section 2 availability posture, background-processing and integration signals + feasibility risk refs} |
| Recommended | {error tracking / logging / uptime approach and tooling} |
| Rationale | {why — citing profile driver(s) + landscape entry} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {landscape option} | {…} | {…} | {…} | {…} | {…} | {…} |

### Indicative Cost Model

{Order-of-magnitude only — tiers and magnitudes, never precise quotes. One row per paid component of the recommended architecture at launch load (Section 2) and at the growth tier. Every cell must carry a real digit sourced from the landscape's pricing evidence (e.g. "free tier", "~$25/month", "~$200–400/month usage-scaled") — a literal "$X0" or any X-for-digit pattern is an unfilled template and fails Gate 4.}

| Component | Launch (order of magnitude) | Growth tier |
|-----------|-----------------------------|-------------|
| {service / platform component} | {free tier, or a real order-of-magnitude figure like "~$20 per month"} | {a real figure or range, e.g. "~$150–300 per month / usage-scaled"} |

### Local Development Setup

{Short closing subsection: prerequisites, the setup path from clone to running, and which managed services have local substitutes (e.g., a containerized database standing in for the managed instance, test-mode API keys). Keep it brief — the production path above is this section's required content.}

## 14. Decision Log

{Consolidated table of every decision made across all sections — pasted verbatim from the running decision register, never compiled retroactively. Category values are Research Scope area names (registry or extension), byte-exact. ADR count must be at least the landscape's Research Scope row count (Gate 4 Category 7). Gives the implementing team a one-table view of every choice and its evidence.}

| ID | Category | Decision | Rationale (one-line) | Profile Driver |
|----|----------|----------|---------------------|---------------|
| {ADR-NNN} | {Research Scope area name} | {What was decided} | {Why in one line} | {Which profile metric drove it} |

<!-- EXAMPLE:
| ID | Category | Decision | Rationale (one-line) | Profile Driver |
|----|----------|----------|---------------------|---------------|
| ADR-001 | Frontend Framework | Next.js 15 (App Router) | Server components cut client bundle for 14 content-heavy screens; built-in API routes serve the modest endpoint surface | Medium scale, Medium interaction complexity |
| ADR-002 | Database | Managed Postgres (Neon, Launch tier) | 8 relational entities with per-user privacy needs; serverless tier matches launch load and scales without re-platforming | Data Complexity: Medium; Section 7: launch load "a few hundred users" |
| ADR-003 | Email & Messaging Delivery | Resend | Notifications signal (FEAT-05.SPEC-003 weekly summary email); simplest sender API in the landscape with a sandbox mode | Notifications (email/push/SMS) signal: Yes |
| ADR-004 | Authentication & Identity | Framework-native auth (Auth.js) with email sign-in | Single-role product, simple session per the Authentication signal detail; a managed provider adds cost without adding required capability | Authentication signal: Yes (simple session); Access Matrix: 1 role |
| ADR-005 | Hosting & Environments | Vercel (production + preview deployments) + separate staging project | Zero-ops fit for the selected framework; preview deployments give the delivery flow for free | Scale: Medium; Section 2 availability posture |
END EXAMPLE -->
