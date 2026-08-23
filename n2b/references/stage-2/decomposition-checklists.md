<!-- Visionary: @-include this file during 6-pass feature decomposition.
     Reference Section 1 during Pass 5 (Cross-Cutting Concerns Sweep).
     Reference Section 2 during Pass 6 (Commonly Forgotten Areas Audit).
     Reference Section 3 during Pass 3 (Entity-Driven Decomposition). -->

# Decomposition Checklists

Structured checklists for cross-cutting concerns, commonly forgotten areas, and entity completeness verification during feature decomposition.

## Section 1: Cross-Cutting Concerns Checklist

### Search

Global search across entities, per-entity search/filter, search suggestions.

**Ask:** Does the user need to find specific items within the product? If the product manages more than one entity, global search across entities should be considered.

### Notifications

In-app notifications, email notifications, preference management for notifications.

**Ask:** Does the user need to be informed of events, changes, or deadlines?

### Data Export

Export formats, per-entity or bulk export.

**Ask:** Can the user export their data? In what format? Per-entity or bulk?

### Data Import

CSV upload, manual bulk entry, external sources.

**Ask:** Can the user import data from external sources? CSV upload? Manual bulk entry?

### Settings and Preferences

User preferences, display settings, notification preferences, account management.

**Ask:** Does the user need to customize their experience?

### Help and Guidance

Tooltips, onboarding walkthroughs, help documentation, contextual guidance.

**Ask:** How does the user learn to use the product?

### Error Handling Patterns

Network errors, invalid input, failed operations.

**Ask:** What does the user see when something goes wrong?

### Empty States

Pre-data dashboards, empty lists, first-use prompts.

**Ask:** What does the user see before they have created any data?

### Feedback and Confirmation

Success messages, undo capabilities, confirmation dialogs for destructive actions.

**Ask:** How does the user know their action succeeded? Can they undo it?

### Data Management

Account deletion, data reset, data retention policies.

**Ask:** Can the user manage or delete their data?

### Security and Privacy Posture

Data sensitivity, account protection expectations, visibility of private data, the product's data-handling promises to the user.

**Ask:** What data does the product hold that a user would consider sensitive? What protection and privacy behavior does the user observably expect? Decisions here also feed the Non-Functional Expectations entry below.

### Compliance

Regulatory regimes triggered by the domain or audience (GDPR/HIPAA-class), consent flows, disclosure obligations, data-subject requests, retention rules.

**Ask:** Does the product's domain, data, or audience trigger a compliance regime? What user-facing behavior (consent, disclosure, data requests, retention) does it demand?

### Audit Logging

Activity history, change trails, "who did what, when" visibility.

**Ask:** Does anyone need a record of actions taken in the product — for trust, accountability, or dispute resolution?

### Internationalization and Localization

Multiple languages, locales, date/number/currency formats, translated or locale-adapted content.

**Ask:** Will users work in more than one language or locale? What content and formats must adapt?

### Roles and Sharing

Role-differentiated access, sharing items with others, invitations, visibility controls.

**Ask:** Does more than one role or person touch the same data? Who can see, edit, or share what? Every role must trace to BRIEF.md or the persona documents (pipeline-rules.md: grounded-roles).

### External-Service Integrations

Capability categories the product depends on — payment processing, transactional email, AI text generation, file storage, calendar sync, and similar.

**Ask:** Which capabilities does the product need that it cannot provide alone? Name the category in vendor-neutral functional terms, never the vendor (pipeline-rules.md: functional-language-only).

### Monetization and Billing Touchpoints

Plans and tiers, upgrade/downgrade moments, billing management, the payment-failure experience.

**Ask:** Does the product charge anyone? What does the user see and do around plans, payments, and billing?

### Analytics

Product usage signals, the analytics events each feature should emit (its `**Signals:**` field), any user-facing insights or reporting.

**Ask:** What signals should each feature emit? Does the user themselves need analytics, insights, or reporting as a product capability?

### Non-Functional Expectations

Responsiveness expectations, expected data volumes and growth, privacy posture, compliance regimes.

**Ask:** What responsiveness does the user observably expect ("results appear within ~1 second")? What data volumes and growth should the product handle? What privacy posture and compliance regimes apply? Unlike the other concerns, the answers here do not become features — they land in the `## Non-Functional Expectations` section of `assumptions-constraints.md`, phrased in user-observable terms.

---

For each cross-cutting concern that applies, determine: is this a standalone feature (Platform type) or a capability within each feature area?

## Section 2: Commonly Forgotten Areas Checklist

### Onboarding / First-Run Experience

What happens the first time the user opens the product.
**Decide per product, with rationale:** every product has a first run — define what it looks like, or record a deliberate exclusion with rationale.

### Settings / Preferences Page

Nearly every product needs one.
**Decide per product, with rationale:** include unless the product genuinely has nothing to configure — and document that rationale if so.

### Account Management

Profile editing, password changes, account deletion.
**Decide per product, with rationale:** any product with accounts needs it — specify what the user can manage.

### Data Management

Import, export, backup, reset, deletion.
**Decide per product, with rationale:** evaluate which operations the user genuinely needs.

### Offline or Degraded Experience

What happens when network is unavailable.
**Per-feature Functional Depth expectation:** every feature's `**States:**` field states its offline/degraded behavior. Decide the product's overall offline posture per product, with rationale — never exclude it by default or demote it to a note.

### Loading and Transition States

Not features per se, but their absence causes inconsistency.
**Per-feature Functional Depth expectation:** every feature's `**States:**` field states its loading behavior. Decide the product's loading and transition conventions per product, with rationale — not a note in assumptions.

### Accessibility Baseline

Cross-cutting requirement, not a feature.
**Per-feature Functional Depth expectation:** accessibility expectations are part of each feature's definition (its flows and states), plus a product-level baseline decided per product, with rationale — not a note in assumptions.

## Section 3: Entity Completeness Rules

For each domain entity identified during decomposition, verify coverage:

| Operation | Question |
|-----------|----------|
| Create | Can the user create this entity? Through what mechanism? |
| View | Can the user view a single instance? A list of instances? |
| Edit | Can the user modify this entity after creation? |
| Delete/Archive | Can the user remove or archive this entity? Soft or hard delete? |
| Search/Filter | Can the user find specific instances? By what criteria? |
| State Transitions | Does this entity have a lifecycle? What features manage transitions? |

For each pair of related entities, ask: "Is there a feature that manages this relationship?"

Any gap becomes a new feature, an expanded capability in an existing feature, or an explicit scope exclusion with rationale.
