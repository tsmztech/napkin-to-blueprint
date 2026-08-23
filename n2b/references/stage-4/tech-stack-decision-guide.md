<!-- Consumers: technical-researcher (Pass B) and technical-architect (Pass D).
     When: @-include in both agent contracts — the shared method reference for every Stage 4 technology decision.
     Purpose: Decision-area registry with signal-activation mapping, the evidence→decision method, the six trade-off axis definitions, the ADR recording format, compatibility sanity rules, and component-library guidance.
     Output: Governs technology-landscape.md (Researcher) and Sections 3, 4, 11, 13 plus the Section 14 Decision Log of technical-architecture.md (Architect). -->

# Tech Stack Decision Guide

Merit-based technology selection for a real product. Stage 4 designs for the product the specifications describe — production-grade choices made on evidence, with the full landscape of modern options in play: managed cloud databases, hosted platforms, third-party services and SaaS, provider SDKs, serverless runtimes, self-hosted infrastructure. Nothing is excluded by rule; every option earns or loses its place on merit against this product's documented needs.

Every decision follows one spine: **profile driver + landscape evidence + feasibility verdict → a recommended option plus 2–3 documented alternatives with trade-offs**. The Technical Researcher gathers option evidence per decision area and never selects; the Technical Architect selects from that evidence and never introduces an option silently. The result is a decision set a downstream team can adopt as-is or re-weigh using the recorded alternatives — a recommendation with its documented choice space, never a single prescriptive answer.

---

## 1. Decision-Area Registry

Stage 4 decides across **22 registered decision areas**, plus any product-mandated extension areas per §1.4. Area names are load-bearing: they must be byte-identical everywhere they appear — this registry, the landscape's `## 1. Research Scope` table and `### {Decision Area}` headings, the architecture document's `### {Decision Area}` headings, and the Decision Log's Category column.

### 1.1 Always-Active Areas (11)

Decided for every product — no activation signal required. Present in every Research Scope.

| Decision Area | Architecture Home | The Decision Covers |
|---|---|---|
| Frontend Framework | Section 3 | The client application framework and rendering strategy — component model, routing, SSR/SSG posture, and the developer experience the implementing team inherits |
| Backend / API Layer | Section 3 | Whether the product needs a dedicated backend service or the frontend framework's server layer suffices; the runtime, language, and API framework |
| Database | Section 3 | The primary data store — engine, managed vs self-hosted, tier and sizing posture |
| ORM / Data Access | Section 3 | The data-access layer — ORM, query builder, or direct driver — and its migration tooling |
| CSS / Styling | Section 3 | The styling system and how the design system's tokens map into it (component layer: Section 6 of this guide) |
| State Management | Section 3 | The client-state approach — framework built-ins, server-cache libraries, dedicated stores |
| Build Tooling | Section 3 | Build system, bundler, and package manager — usually the framework's bundled pipeline |
| Authentication & Identity | Section 11 | The identity decision — managed provider vs framework-native vs custom — plus session model, user model, protected routes, and role/permission enforcement |
| Hosting & Environments | Section 13 | Where the product runs — hosting platform, environment topology (dev/staging/prod), region posture, infrastructure-as-code posture |
| CI/CD & Delivery | Section 13 | How changes ship — pipeline, automated checks, promotion between environments |
| Observability & Operations | Section 13 | How the running product is seen and kept healthy — logging, metrics, tracing, error reporting, alerting |

### 1.2 Signal-Activated Areas (11)

All eleven live in architecture Section 4 (Platform & Service Decisions). An area activates when at least one of its activating signals is marked `Present = Yes` in the profile's Section 3 (Capability Signals). Signal names below are the profile's Section 3 signal names, byte-exact.

| Decision Area | Activated By (profile Section 3 signals) | The Decision Covers |
|---|---|---|
| File & Object Storage | File upload · Import/export | Storage and delivery of user files and generated artifacts — storage service, upload path, delivery posture |
| Email & Messaging Delivery | Notifications (email/push/SMS) | Delivery providers and channels for transactional email, push, and SMS |
| Payments & Billing | Payments/billing | Payment processing, subscription and invoicing mechanics, webhook reconciliation |
| AI & Intelligent Behavior | AI/ML behavior | Model providers and APIs behind AI-driven behavior — inference path, cost posture, degradation behavior |
| Search | Search | The search capability — engine or service, indexing approach, query features (full-text, faceted, fuzzy) |
| Background Jobs & Scheduling | Background processing · Import/export · Notifications (email/push/SMS) | Deferred and scheduled work — job runner, queueing, scheduling, retry semantics |
| Caching & Performance | Scale hints · Offline | Cache layers and performance strategy for the stated scale and offline/degraded expectations |
| Real-time & Collaboration | Real-time · Collaboration/concurrency | Live-update transport and collaboration mechanics — realtime service or self-managed sockets, presence, conflict handling |
| Analytics & Product Telemetry | Scale hints | Product analytics instrumentation and the event pipeline serving the product's success metrics |
| Geo & Maps | Geo/maps | Mapping, geocoding, and location services — provider, usage pricing, handling of location data |
| Internationalization | Internationalization | Locale support — i18n framework, translation workflow, date/number/currency handling |

### 1.3 Activation Rules

- **Mechanical derivation.** The Technical Researcher derives the active-area set from the profile alone: all 11 always-active areas, plus every Section-4 area with at least one activating signal marked `Present = Yes` in Section 3, plus every extension area triggered by the §1.4 textual rule against Section 7. No judgment activations, no judgment drops.
- **The Research Scope is authoritative.** The landscape's `## 1. Research Scope` table (`| Decision Area | Activated By |`, one row per active area, minimum 11 rows) is the authoritative active-area set for the whole stage. Gate B checks its structure; the Architect consumes it without re-deciding activation; Gate 4 requires the Decision Log's ADR count to be at least its row count.
- **Inactive areas stay visible.** The architecture's Section 4 always carries all eleven `### {Decision Area}` headings; each inactive area gets the single line `Not activated — {signal evidence from profile Section 3}` and appears in neither the Research Scope nor the Decision Log.
- **Many-to-many mapping.** One signal may activate several areas; several signals may activate one area. The Research Scope's `Activated By` cell records every firing signal with its profile provenance; always-active rows record `Always active`.
- **Always-active means always decided, not always adopted.** Where the evidence shows a capability is not needed, the decision records that outcome with evidence. For Authentication & Identity in particular, "Authentication is not required" is a legal Recommended value when the profile says so.

**Signals that inform decisions without activating an area:**

| Signal | Where It Flows |
|---|---|
| Complex forms (10+ fields) | Frontend Framework and State Management (always active) — form-handling and client-state depth |
| Authentication | Authentication & Identity (always active) — the signal's complexity sub-classification shapes the depth of the identity decision |
| Third-party integrations | Integration Architecture (architecture Section 8) and the per-feature feasibility assessments — integrations are documented per external service, not decided as a single ADR area. **Exception:** an integration that meets the §1.4 extension-area test gets a full extension decision area, not just a Section 8 row. |
| Compliance/privacy | The architecture's Section 2 security and compliance posture, the Observability & Operations decision, and the database schema's Security & Access Model |

### 1.4 Extension Areas (product-mandated capabilities)

The 22 registered areas cover the generic stack. Some products *demand* an external capability the registry has no area for — identity/KYC verification, background checks, logistics/shipping, e-signature, telephony, KYB, insurance APIs. Leaving such a capability as a "TBD — resolve during build" integration row fails the buildable-without-asking test when the upstream documents explicitly delegated the vendor choice to this stage.

**Mechanical extension rule (no judgment activations — the trigger is textual):** the Technical Researcher MUST add an extension decision area for every external capability that (a) is named in the profile's Section 7 verbatim quotes (BRIEF Ecosystem & Integrations, BRIEF Open Questions carried into Section 7, assumptions-constraints Dependencies, or the External Touchpoints table) as requiring an external provider or delegated to research, and (b) maps to none of the 22 registered areas. A capability served by a registered area (e.g. "send SMS" → Email & Messaging Delivery) never becomes an extension area.

Extension-area mechanics:

- **Name:** a capability-descriptive title (e.g. `Identity Verification & KYC`, `Background Checks`). Once written into the Research Scope, the name is load-bearing and byte-identical everywhere, exactly like registry names.
- **Research Scope row:** `Activated By` records `Product-mandated — {verbatim source citation from profile Section 7}`.
- **Research:** the full §2.1 evidence rules apply — 3–5 real vendor options with pricing, sources, and access dates. Gate B validates extension areas identically to registered ones.
- **Architecture home:** Section 4, after the eleven registered signal-activated headings. The decision is recorded in the standard ADR shape; the Decision Log `Category` is the extension area name.
- **Feasibility interplay:** a research spike remains legal for *how to integrate* a chosen vendor category — but "which vendors exist, at what price, with what capability fit" is this stage's job and may never be deferred to the build team.

### 2.1 Option Evidence Rules (Technical Researcher, Pass B)

- **Per active area: 3–5 real, currently available candidates.** Fewer than 3 is a structural failure (Gate B); more than 5 dilutes the evidence.
- **Web-first.** Research with WebSearch/WebFetch before falling back to model knowledge. Every web-sourced pricing or capability claim carries its URL and an access date. If web tooling is unavailable or a query fails, fall back to model knowledge, mark each affected Sources cell with the literal `knowledge-based — {reason}`, and log the fallback in the landscape's Research Log. Never fabricate a URL — an honest marker beats a fake link.
- **Span the real choice space.** Where the space offers genuinely distinct approaches — a managed service, an open-source library, a self-hosted option — represent them, so the Architect decides across real alternatives rather than five flavors of one approach.
- **Honor user mandates.** Platforms, vendors, or services the user mandated (quoted verbatim in the profile's Section 7, Demand-Side Inputs) must appear among their area's options.
- **Evidence, not selection.** No option is marked preferred, no ordering implies rank, and selection vocabulary — the architecture document's `Recommended` field language — appears nowhere in the landscape.

### 2.2 Decision Method (Technical Architect, Pass D)

For every active decision area — always-active areas in Sections 3, 11, and 13; activated areas in Section 4 — execute these seven steps:

1. **Review the decision register.** Re-read every entry recorded so far; the new decision must cohere with prior selections (runtime, language, hosting, data layer).
2. **Assemble the drivers.** Cite specific values: profile Sections 1–4 metrics and signals, Section 7 demand-side quotes, and the architecture's own Section 2 NFR values. These populate the ADR's Context and the register's Profile Driver field.
3. **Read the area's landscape.** The area's option table in technology-landscape.md Section 2, plus any Section 3 compatibility notes touching it.
4. **Cross-check feasibility.** Verdicts and `**Candidate Approaches:**` fields in technical-feasibility.md that cite this capability — a `Hard` or `Research-spike recommended` verdict driven by this area belongs in the decision's Context.
5. **Select on merit.** One recommended option, with version or tier where meaningful. A user-mandated technology (profile Section 7) is honored as a constraint, and the mandate is recorded as a driver.
6. **Document the alternatives.** 2–3 alternatives across the six trade-off axes (Section 3 of this guide), each with a concrete `Choose instead when` condition.
7. **Record and verify.** Append the ADR entry to the running register (Section 4 format below); check the selection against the compatibility sanity rules (Section 5) and every previously selected area.

### 2.3 Landscape-Deviation Rule

The Architect may recommend a technology absent from technology-landscape.md only by logging a deviation ADR: a Decision Log entry (Category = the area's registry name) whose Rationale states why the landscape missed the option and what evidence supports the out-of-landscape choice. A silent out-of-landscape recommendation is a contract violation.

---

## 3. The Six Trade-off Axes

Every alternative is characterized on these six axes — they are the column names of the ADR alternatives table (Section 4), byte-exact.

| Axis | What It Measures | Cell Content |
|---|---|---|
| Cost Profile | What the option costs at launch and how cost scales with growth | Pricing model shape (free tier, per-seat, usage-based, flat, infrastructure cost) plus order-of-magnitude figures where known |
| Operational Complexity | The ongoing operating burden the option places on the team — provisioning, upgrades, monitoring, incident response | Low / Medium / High plus the dominating burden |
| Scale Ceiling | The load, data volume, or usage level at which the option must be replaced or re-architected | The ceiling, order of magnitude, and what hits it first |
| Lock-in | The cost of leaving — proprietary APIs or data models, egress cost, migration paths, standards compliance | Low / Medium / High plus the realistic exit path |
| Team Skill Demand | The expertise the option assumes of the implementing team | Mainstream vs specialist skills, and which ones |
| Choose instead when | The concrete condition under which this alternative beats the recommendation | A checkable condition grounded in this product's evidence (e.g., "expected write concurrency exceeds the profile's stated ceiling") — never generic praise |

---

## 4. ADR Recording Format

Every active decision area — in architecture Sections 3, 4, 11, and 13 — records its decision in this exact shape:

```markdown
### {Decision Area}

| Field | Value |
|-------|-------|
| Context | {profile metrics + Section 2 NFR drivers + feasibility refs} |
| Recommended | {technology / service, with version or tier where meaningful} |
| Rationale | {why — citing profile driver(s) + landscape entry + feasibility verdict where relevant} |

**Alternatives:**

| Alternative | Cost Profile | Operational Complexity | Scale Ceiling | Lock-in | Team Skill Demand | Choose instead when |
|---|---|---|---|---|---|---|
| {option} | {…} | {…} | {…} | {…} | {…} | {…} |
```

**Format rules:**

- 2–3 alternative rows per active area; at least 1 is enforced.
- The alternatives table's column names are the six trade-off axes, byte-exact. Gate 4 counts `Choose instead when` occurrences across the architecture document — one per active area minimum.
- `Context` cites profile drivers by value; `Rationale` cites the profile driver(s) and the landscape entry, plus the feasibility verdict where a feature's verdict turned on this capability.
- `Recommended` names the technology or service, with version or tier where meaningful.

**The decision register** (running, internal to the Architect, pasted verbatim as Section 14):

```
ADR-NNN | Category | Decision | Rationale (one-line) | Profile Driver
```

- Accumulate entries per section as each decision is written; review the register before starting each new section; Section 14 pastes the accumulated register verbatim — never recompiled retroactively.
- `Category` values are Research Scope area names, byte-exact — registry names (Section 1) for registered areas, the coined extension-area name (§1.4) for extensions.
- ADR IDs follow id-prefixes.md: `ADR-NNN`, sequential from 001, stable across re-runs.
- ADR count must be at least the Research Scope row count (Gate 4).
- Every `Profile Driver` cites a specific metric, signal, or demand-side quote — never a generic preference or "industry standard".

---

## 5. Compatibility Sanity Rules

These are factual pairing constraints retained as sanity rules. They exist to catch invalid combinations after selection — they never bound what may be researched or chosen. Any technology satisfying the evidence is a legal candidate; a combination violating a fact below is an error.

- **Runtime binding (ORM / Data Access ↔ Backend / API Layer):** Prisma and Drizzle are TypeScript/Node data-access layers — they do not pair with a Python backend. SQLAlchemy is Python-only — it does not pair with a Node backend. Match the data-access layer to the backend runtime.
- **Dialect and driver support (ORM / Data Access ↔ Database):** confirm the selected data-access layer ships a driver or dialect for the selected database engine — relational ORMs do not serve document or key-value stores.
- **Framework binding (State Management ↔ Frontend Framework):** Pinia is Vue-only. SWR and Redux Toolkit are React-only. Svelte projects use Svelte stores or Svelte-native libraries. Confirm first-party or officially maintained support for the selected framework before pairing.
- **Framework binding (component layer):** shadcn/ui assumes React plus Tailwind CSS. Radix primitives are React. Headless UI supports React and Vue. Melt UI is Svelte. (See Section 6.)
- **Styling portability:** utility-class systems (e.g., Tailwind CSS) and vanilla CSS approaches pair with all mainstream frontend frameworks — styling rarely constrains the framework choice.
- **Bundled build tooling:** meta-frameworks ship their own build pipeline; overriding it is a decision that needs a documented driver, not a default.
- **SDK coverage (platform services ↔ backend language):** before pairing any Section-4 service with the stack, confirm it offers an SDK or a plain HTTP API usable from the selected backend language; the landscape's Cross-Area Compatibility Notes record observed gaps.

The Architect verifies these in method step 7 (Section 2.2); the Researcher records observed pairing facts in the landscape's Section 3.

---

## 6. Component Library Guidance

The component layer is researched as part of the CSS / Styling area and decided in architecture Section 9 (Design System Implementation Plan) as the component-library decision. It is guidance-shaped evidence, not a bounded menu.

**Evidence that matters:**

- **Interaction complexity from the profile.** Rich patterns in the specs — data tables with sorting and pagination, searchable dropdowns, command palettes, multi-step modal forms — justify a component library; simple forms and lists may be served by custom components built on the styling system alone.
- **Library categories.** Headless/primitive libraries provide accessible, unstyled behavior that the design system's tokens style (e.g., Radix, Headless UI, Melt UI). Copy-in component systems place the code in the project tree (e.g., shadcn/ui). Full styled suites trade ownership for speed and carry their own visual opinions. Each category is a different ownership/speed trade — characterize candidates by category.
- **Design-system posture.** When the package carries a user-supplied design system (the passthrough at `.n2b/specifications/design-system/`), the component layer must be skinnable to the supplied tokens — supplied values are mapped as-is, never redesigned. Headless primitives adopt supplied tokens cleanly; full styled suites with strong visual opinions demand scrutiny here. When the package is design-agnostic (`design_system_source: none`), the component-layer choice is driven by profile metrics alone and stays visually unopinionated where possible.
- **Binding facts.** The framework and styling bindings in Section 5 apply to every component-layer candidate.

**Where it lands:** the Researcher, when profile evidence justifies a component library, records component-layer candidates as a short, clearly labeled note list under the CSS / Styling area block (after its option table — the option table itself stays the styling-system choice space). The Architect records the component-library decision — including "no library, custom components" with evidence — inside Section 9, citing the profile's interaction-complexity evidence and the design-system posture (user-supplied vs design-agnostic).
