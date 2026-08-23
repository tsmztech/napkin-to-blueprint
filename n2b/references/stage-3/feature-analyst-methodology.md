<!-- Agent: feature-analyst
     When: @-include at start of feature decomposition execution.
     Purpose: Step-by-step 8-phase methodology for multi-lens feature decomposition.
     Output: feature-overview.md per feature. -->

# Feature Analyst Decomposition Methodology

Prescriptive 8-phase methodology for decomposing a feature into its constituent specs (screens, automations, logic/rules, integrations, notifications). Each phase uses a distinct analytical lens to surface specs that other lenses miss. Follow phases in order -- do not skip or reorder.

**Grounded in:** Perspective-Based Reading (Basili/NASA), CRUD Analysis (TMAP), Event Storming (Brandolini), BDD Example Mapping (Wynne/Cucumber), State Machine Analysis (IREB), Canonical State Model (Carbon Design System), Pre-mortem Analysis, Volere Requirements Process (Robertson & Robertson), Cockburn Use Cases

---

## Why Multi-Lens Decomposition

A feature description explicitly states roughly 20-30% of its actual specification surface area. The rest -- implied automations, non-obvious business rules, error states, state transitions, cross-feature side effects -- lives in implication. NASA/GSFC's Perspective-Based Reading experiments and a Robert Bosch industrial study confirmed that analysts using different analytical perspectives find almost entirely non-overlapping defects. A single-pass decomposition, regardless of thoroughness, systematically misses what other lenses would catch.

This methodology uses seven analytical lenses across eight phases. Each lens surfaces a distinct class of implied specification:

| Lens | Phase | What It Catches |
|------|-------|----------------|
| Capability-to-interaction mapping | 2 | The explicit surface -- specs directly stated in the feature description |
| Entity-lifecycle analysis | 3 | Missing CRUD operations, orphaned data, undefined deletion/archival |
| Trigger-response analysis | 4 | Implied automations -- system side-effects nobody listed |
| External-dependency and communication surfacing | 4 | Integration spec candidates (external capability needs) and Notification spec candidates (messages the product sends) |
| Rule-constraint discovery | 5 | Implied business rules -- validation, derivation, authorization, conditional logic |
| Negative/failure analysis | 6 | Error states, empty states, loading states, timeout behavior, lost-data scenarios |
| Mechanical cross-reference | 7 | Coverage gaps across capabilities, entities, and journey steps |

---

## Phase 1 -- Absorb the Feature

Read the feature context package. Build a mental model across five dimensions:

- **Purpose:** What is this feature's reason for existing? What problem does it solve for the persona?
- **Scope:** What Key Capabilities does Stage 2 define? What does the persona's journey look like through this feature? What are the explicit scope exclusions?
- **Entities:** What data objects does this feature create, read, update, or reference? What are their fields (from the dependency map's Shared Data Entities)?
- **Connections:** What other features depend on this one? What other features does this one depend on? What are the navigation connections and cross-feature business rules?
- **Type:** Is this User-Facing, Platform, or Lifecycle? This shapes expectations for the spec mix.

**Output:** No written artifact. This phase builds the context carried through all subsequent phases.

**Guidance:** Do not begin identifying specs yet. Premature decomposition before full context absorption is the primary cause of missed implied specs.

---

## Phase 2 -- Explicit Surface (Capability-to-Interaction Mapping)

Map each Key Capability from Stage 2 to its primary user interaction. This phase captures only what the feature description directly states.

**Process:** For each Key Capability, ask:

1. "Does this capability require a user-facing view?" --> Candidate Screen spec
2. "Does this capability describe something that happens automatically?" --> Candidate Automation spec
3. "Does this capability describe constraints or rules rather than interactions?" --> Candidate Logic/Rule spec

**Feature Type heuristics:**

- **User-Facing features** -- Most specs will be Screen type. Expect 2-6 screens for a typical feature. Apply the "one purpose per screen" heuristic, balanced by the "minimal screens" counter-heuristic (capabilities that naturally co-occur on the same view belong together).
- **Platform features** (Settings, Data Export, Search) -- Fewer screens but often more complex. Configuration screens, result screens, possibly background processing.
- **Lifecycle features** (Onboarding, Account Management) -- Linear flow screens. Each step may be its own screen spec.

**Output:** A preliminary spec list (IDs not yet assigned) with each spec traced to one or more Key Capabilities. This list is intentionally incomplete -- subsequent phases will add to it. Capabilities that inherently depend on an external capability, or that describe a message the product sends to a person, are classified in Phase 4 (External Dependencies lens and Notification surfacing).

**What this phase catches:** The 20-30% of specs directly stated in the feature description.
**What this phase misses:** Implied automations, non-obvious business rules, entity lifecycle gaps, failure handling, state management, external-capability contracts, communications.

---

## Phase 3 -- Entity-Lifecycle Analysis (CRUD Matrix)

For every Connected Entity listed in the feature's Stage 2 definition, systematically verify that every lifecycle operation has a corresponding spec. Empty cells in the CRUD matrix are missing specs.

**Process:** Build the following matrix for each entity this feature manages (entities it only reads are excluded from the full matrix but noted):

| Operation | Required? | Covered By | How |
|-----------|-----------|-----------|-----|
| **Create** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |
| **Read (single)** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |
| **Read (list/search)** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |
| **Update** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |
| **Delete/Archive** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |
| **State Transition** | [Yes/No/N/A] | [Spec or "MISSING"] | [Brief description] |

**Rules:**
- An entity with no "Create" means data appears from nowhere -- almost always a missing spec.
- An entity with no "Delete" or "Archive" means data accumulates forever -- must be an explicit design decision (captured as a non-goal), not an accidental omission.
- Retention/purge expectations are part of the Delete/Archive decision: the "How" cell must state soft-vs-hard delete, restore path, cascade behavior, and retention/purge expectation. A soft-deleted entity with no purge policy must be an explicit non-goal -- never a silent omission.
- An entity with no "Read" means data is stored but never surfaced to the user -- either a mistake or the entity is only read by other features (verify against dependency map).
- Every entity relationship (from the dependency map) must have at least one spec that manages it.

**Output:** The CRUD Coverage Matrix for each managed entity. Any "MISSING" cell becomes either: (a) a new candidate spec added to the preliminary list, or (b) an explicit non-goal with rationale.

**What this phase catches:** Missing CRUD operations, orphaned entities, undefined deletion/archival behavior, missing retention/purge policy, missing relationship management.

---

## Phase 4 -- Trigger-Response Analysis (Implied Automations)

For every user action identified in Phase 2 and every entity lifecycle operation verified in Phase 3, systematically enumerate all system side-effects. This phase surfaces the automations that feature descriptions never mention -- and, through its two additional lenses below, the Integration and Notification specs the feature requires.

**Process:** For each user action and entity state change, walk through the following:

**On entity creation:**
- Does the system need to validate against existing data? (duplicate detection, uniqueness checks)
- Does the system need to notify anyone or anything? (in-app notification, email, push, SMS)
- Does the system need to update related entities? (cascading creates, counter updates, aggregate recalculations)
- Does the system need to log or audit the action?
- Does the creation trigger any default data generation? (auto-calculated fields, default associations)

**On entity update:**
- Do any fields trigger recalculations when changed? (totals, averages, status derivations)
- Does the update need to propagate to related entities? (cascading updates)
- Are there state transitions that fire on field changes? (status change from "draft" to "active")
- Does the update need to validate against other entities? (cross-entity consistency)

**On entity deletion/archive:**
- What happens to related entities? (cascade delete, orphan prevention, soft-delete propagation)
- Does the system need to recalculate aggregates that included this entity?
- Are there undo/restore requirements?

**On navigation events:**
- Does arriving at a screen trigger data loading from other features?
- Does leaving a screen trigger auto-save or draft persistence?

**Time-based triggers:**
- Does any data in this feature expire, age, or require periodic recalculation?
- Are there scheduled aggregations or sync operations?

**External Dependencies lens:** Does any capability inherently require an external service -- money movement, identity, communications out of the product, third-party data, AI? Each becomes an Integration spec candidate. Walk the context package's Dependencies slice (from the Dependencies section of assumptions-constraints.md): every category-level external capability this feature relies on must map to an Integration spec candidate in this feature, or to an explicit cross-feature note when another feature's Integration spec owns the capability. Also ask the inbound direction: does anything outside the product tell this feature something happened -- payment events, inbound email, sync completion, token expiry? Inbound events belong to the Integration spec that owns the capability.

**Notification surfacing:** Side-effects that communicate with a person -- in-app message, email, push, SMS -- become Notification spec candidates, not bare side-effect rows. Walk the feature's `**Communications:**` field from product-features.md: every message it names must map to a Notification spec candidate. The only communication that stays inline is a same-screen confirmation with no delivery rules (e.g., a success toast); anything with a channel, an audience, content, or delivery behavior needs a Notification spec.

**Standalone spec vs. inline interaction decision rule:**
- If the trigger-response involves processing logic (not just a direct data write) --> standalone Automation spec.
- If the trigger-response involves cross-entity or cross-feature effects --> standalone Automation spec.
- If the trigger-response sends a message to a person through any channel --> standalone Notification spec.
- If the trigger-response crosses the product boundary to or from an external capability --> belongs to an Integration spec (new or existing for that capability).
- If the trigger-response is a simple, single-step consequence with no failure modes (e.g., "show success toast") --> stays inline in the triggering Screen spec.

**Output:** A Side-Effect Inventory -- a list of every discovered trigger-response pair. Each entry becomes either: (a) a new Automation spec candidate, (b) a Notification spec candidate, (c) an Integration spec candidate (or an inbound event on an existing one), (d) an addition to an existing Screen spec's interactions (if the side-effect is simple enough to be inline), or (e) an explicit non-goal.

**What this phase catches:** Duplicate detection, cascading updates, notification requirements with real delivery rules, auto-calculations, data propagation, scheduled processes, external-capability contracts and the inbound events they produce.

---

## Phase 5 -- Rule-Constraint Discovery (Implied Business Rules)

For each entity and each screen identified so far, systematically identify business rules that govern behavior. For each capability, ask "What are the rules?" and for each rule, ask "What's a concrete example?" Rules that resist concrete examples are often under-specified.

**Process:** Examine four categories of rules:

**Validation rules:**
- For each entity field: Is it required? What format? What length? What range?
- For field combinations: Are there cross-field dependencies? ("Phone required if no email")
- For entity-level validation: Are there conditions that must hold across the entire record?

**Derivation rules:**
- Are there calculated fields? What's the formula?
- Are there auto-populated fields? What's the source?
- Are there default values? Are they static or dynamic (e.g., time-of-day defaults)?
- Can the user override derived values?

**Authorization rules:**
- Are there actions restricted by role or user state? (which roles from the Access Matrix can perform each action; can a user only edit their own records)
- Are there data visibility rules? (e.g., archived items hidden by default, records visible only to their owning role)
- Are there rate limits or usage caps?

**Conditional behavior rules:**
- Do any capabilities behave differently based on entity state?
- Are there feature flags or progressive disclosure patterns?
- Do any rules interact with each other? (Rule A changes the applicability of Rule B)

**Threshold for standalone Logic/Rule spec:**
- 5+ validation rules applying to a single entity
- Conditional logic (rules that depend on other field values or entity state)
- Rules shared across multiple screens or automations within this feature
- Derivation rules with non-trivial logic (lookup tables, formulas, conditional defaults)

Simple validations (required field, max length, format check) remain inline within screen specs unless they cross the complexity threshold.

**Completeness check using decision table thinking:** For any rule with multiple conditions, enumerate the condition combinations. If 3 binary conditions exist, there are 8 combinations. Verify that every combination has defined behavior. Flag any combination where the behavior is undefined.

**Output:** Candidate Logic/Rule specs added to the preliminary list. For rules that stay inline, annotate which Screen or Automation specs they belong to.

**What this phase catches:** Missing validation rules, under-specified conditional logic, contradictory rules, missing derivation formulas, authorization gaps.

---

## Phase 6 -- Negative/Failure Analysis (The Unhappy Paths)

For every Screen spec identified so far, systematically enumerate failure modes and non-primary states. Apply pre-mortem thinking: "Imagine a user is frustrated using this feature -- what went wrong?"

**Process:** Apply the Canonical State Model to every screen:

**For every data-displaying screen, verify coverage of:**

| State | Question | What to specify |
|-------|----------|----------------|
| **Empty** | What does the user see before any data exists? | First-use empty state: messaging, calls-to-action, illustrations |
| **Loading** | What does the user see while data is being fetched? | Skeleton screens, spinners, progressive loading |
| **Populated** | What does the user see with data? | Already covered by Phase 2 (the Layout Description) |
| **Error** | What does the user see when something fails? | Error messaging, retry options, fallback content |
| **Partial** | What does the user see when some data loaded and some didn't? | Degraded display, per-section error states |
| **No Results** | What does the user see when a search/filter returns nothing? | No-results messaging, suggestion to broaden criteria |
| **Permission Denied** | What does the user see if they lack access? | Access messaging, upgrade prompts, redirect behavior |
| **Offline/Degraded** | What does the user see and what can they still do without connectivity, or when a capability the screen depends on is degraded? | Offline messaging, read-only fallbacks, queued actions and their sync expectations |

Not every state applies to every screen. Include only relevant states. Offline/Degraded requires either coverage or an explicit "N/A — {reason}".

**For every user-input screen, verify coverage of:**
- What happens when the user submits invalid data? (Per-field vs. form-level errors, inline vs. summary)
- What happens when the submission fails server-side? (Network error, timeout, conflict)
- What happens when the user abandons the form midway? (Draft persistence, confirmation dialog, data loss)
- What happens when the user submits successfully? (Success confirmation, redirect destination, undo option)

**For every automation, verify coverage of:**
- What happens when the automation's trigger fires but processing fails?
- What happens when the automation produces an ambiguous result? (e.g., duplicate detection finds "maybe" matches)
- What happens when the automation takes longer than expected?
- Does the user need to be notified of the automation's outcome?

**Pre-mortem prompt:** "Imagine this feature has been live for 6 months and the top user complaint is about something we didn't specify. What is it?" Common answers: confusing empty states, unclear error messages, no way to undo destructive actions, losing unsaved work, slow operations without progress feedback.

**Output:** Existing Screen specs are annotated with required state coverage. If failure analysis reveals complex cross-screen error handling patterns, a new Logic/Rule spec may be added.

**What this phase catches:** Missing empty states, undefined error handling, lost-data scenarios, ambiguous automation outcomes, missing loading/progress feedback, missing offline/degraded behavior, missing undo/confirmation for destructive actions.

---

## Phase 7 -- Cross-Reference Verification (Mechanical Completeness)

This is not a reasoning phase -- it is deterministic cross-referencing. The analyst checks coverage across three independent maps and flags gaps. Every gap must be resolved before the Brief is complete.

**Check 1: Capability Coverage**
Every Key Capability from Stage 2 must appear in at least one spec's coverage mapping. Zero tolerance -- a Key Capability with no covering spec is a mandatory gap.

| Key Capability | Covering Spec(s) | Status |
|----------------|-----------------|--------|
| {capability} | {spec ID} | COVERED / MISSING |

**Check 2: Entity-Lifecycle Coverage**
Every cell in every CRUD Coverage Matrix (from Phase 3) must be either filled with a spec reference or explicitly marked N/A with rationale.

| Entity | Create | Read (single) | Read (list) | Update | Delete/Archive | State Transition | Status |
|--------|--------|---------------|-------------|--------|----------------|-----------------|--------|
| {entity} | {spec} | {spec} | {spec} | {spec} | {spec or N/A} | {spec or N/A} | COMPLETE / GAP |

**Check 3: Journey Step Coverage**
Every journey step (from Stage 2's user journeys) that involves this feature must map to at least one spec.

| Journey Step | Covering Spec(s) | Status |
|-------------|-----------------|--------|
| {step} | {spec ID} | COVERED / MISSING |

**Check 4: Spec Count Sanity**
Apply heuristic bounds:
- A feature with N Key Capabilities should produce between N and 3N specs.
- Fewer than N specs --> under-decomposition (capabilities crammed together).
- More than 3N specs --> over-decomposition (investigate consolidation).
- A feature with 0 Automation specs --> examine -- most features with entity creation/update have at least one implied automation.
- A feature with 0 Logic/Rule specs and more than 4 Screen specs --> examine -- shared validation or business rules likely exist.
- A feature whose context package carries a Dependencies slice (category-level external capabilities) but 0 Integration specs --> examine -- each external capability must be specified by this feature's Integration spec or explicitly owned by another feature's (note the cross-feature reference).
- A feature whose `**Communications:**` field names messages but 0 Notification specs --> examine -- every named communication needs a Notification spec or an explicit inline disposition per Phase 4.

**Check 5: Orphan Check**
Every spec must connect to at least one other spec (via navigation, trigger, reference, or data flow) OR to a cross-feature touchpoint. Orphaned specs suggest misclassification or missing connections.

**Resolution protocol:** For each gap:
1. Missing spec --> add to inventory, loop back to relevant discovery phase (3, 4, 5, or 6) for that spec only.
2. Missing coverage annotation --> add the annotation.
3. Intentional omission --> add to Non-Goals with explicit rationale. An exclusion is valid only with a product-definition rationale — a citation to scope-boundaries.md, the brief, or a named Stage 2 decision; "keep the product small" is not a rationale.

**Output:** A verification summary with pass/fail for each check. All checks must pass before the Brief is complete.

---

## Phase 8 -- Map Internal Relationships

Document how specs within this feature relate. This phase operates on the complete, verified spec inventory.

- Which screens trigger which automations (by spec ID)
- Which screens and automations reference which logic/rule specs (by spec ID)
- Which specs an Integration spec's inbound events feed, and which screens its degradation behavior affects (by spec ID)
- Which screens or automations trigger which notifications (by spec ID)
- Data flow between specs (what one creates, another reads)
- Navigation flow between screen specs (entry points, exit points, back navigation)
- Shared UI patterns across screen specs (common form fields, shared layouts, shared entity displays)
- Default entry point for the feature (the screen shown when the user navigates to this feature area)

**Output:** The Internal Dependency Map section of the Feature Breakdown Brief.
