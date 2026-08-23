---
document_type: spec
spec_type: integration
spec_id: FEAT-{NN}.SPEC-{NNN}
spec_name: {name}
spec_slug: {kebab-case-slug}
parent_feature: FEAT-{NN}
parent_feature_name: {feature name}
priority_tier: {Core | Important | Nice-to-Have}
produced_by: spec-writer
status: {draft | final}
created: {YYYY-MM-DD}
acceptance_criteria_count: {N}
---

# Integration Spec: {Spec Name}

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": the Feature Breakdown Brief is mandatory context -- read it before writing
  - See pipeline-rules.md constraint "grounded-roles": every role or user type referenced must trace to BRIEF.md or the Stage 2 persona documents -- never invent roles
  - See pipeline-rules.md constraint "functional-language-only": describe the external capability by category (payments, identity, email, calendar, AI, maps, storage, ...) using the capability-category allowance in pipeline-rules.md -- never by vendor, product name, or technical interface detail
  - Vendor-neutral unless user-mandated: name a specific vendor only when BRIEF.md records that the user mandated one -- otherwise vendor selection is a Stage 4 decision and this spec stays at the category level
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - The Feature Breakdown Brief (feature-overview.md) is mandatory context for this spec
  - Every capability assigned to this spec in the Brief's Capability Coverage Map must be accounted for
  - The capability category must trace to a Dependencies entry (ASMP-XX) in assumptions-constraints.md and appear in the Feature Dependency Map's External Touchpoints table
  - This spec defines the product's contract with the external capability -- what the product sends, receives, and how it behaves toward the user -- never how the connection is implemented
  - Use FEAT-NN.SPEC-NNN dot-notation IDs when referencing connected specs
  - Use exact entity names and fields from the Feature Dependency Map
  - Reference cross-feature business rules by XBR-NN Rule ID
  - Every inbound event must have at least one acceptance criterion
  - Every degradation path (slow / down / rejects) must have at least one acceptance criterion per affected screen
  - Degradation messages and disclosure wording follow the exact-message discipline -- exact text, never "an appropriate message"
  - Every analytics event must cite the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}"
  - Non-goal rationales must trace to a product decision (scope-boundaries.md, product-features.md, or BRIEF.md) -- never to effort, timeline, or keeping the product small
  - Minimum 2 non-goals in Scope and Non-Goals section
  - Platform-set policy values (deposit amounts, fee/refund percentages, time windows, prices, payout cycles -- anything fixed platform-wide and decided at build) are NEVER stated as concrete numbers: write the inline marker platform parameter: `{kebab-slug}` instead -- one slug per distinct parameter, reused verbatim at every site referencing the same value. Pass D collects every marker into specifications/platform-parameters.md with a proposed default; Gate A reconciles markers against that registry. Values that genuinely belong to one feature's own definition stay inline as before
  - Before writing, update all frontmatter fields: spec_id, spec_name, spec_slug, parent_feature, parent_feature_name, priority_tier, produced_by (spec-writer), status, created (today's date), acceptance_criteria_count
-->

## Overview

**Name:** {Spec Name}
**ID:** {FEAT-NN.SPEC-NNN}
**Type:** Integration
**Purpose:** {One sentence describing what product behavior this external capability enables.}
**Parent Feature:** {FEAT-NN} -- {Feature Name}

<!-- EXAMPLE (payment collection):
**Name:** Payment Collection Integration
**ID:** FEAT-05.SPEC-004
**Type:** Integration
**Purpose:** The product collects invoice payments through an external payment-processing capability and reflects payment outcomes on the invoice.
**Parent Feature:** FEAT-05 -- Invoicing
END EXAMPLE -->

## Scope and Non-Goals

**In Scope:**
- {What part of the product's relationship with this capability this spec covers.}

**Non-Goals:**
- {What this spec explicitly excludes. Reference sibling specs by ID where applicable. Each exclusion cites the product decision behind it.}
- {Second non-goal minimum.}

<!-- EXAMPLE (payment collection):
**In Scope:**
- Generating a payment request for an open invoice and sharing it with the invoice recipient
- Receiving payment outcomes (succeeded, failed, refunded) and updating the invoice accordingly
- User-facing behavior when the payment capability is slow, unavailable, or rejects a request
- Disclosure to the user about what invoice and contact data is shared with the capability

**Non-Goals:**
- Choosing the payment vendor -- vendor selection is a Stage 4 architecture decision; BRIEF.md records no user mandate.
- Recurring or subscription billing -- excluded per scope-boundaries.md: the product definition covers one-time invoice payment only; recurring revenue collection is not part of the defined product.
- Processing payments for anything other than invoices -- product-features.md defines no other payable object.
- The screen mechanics of the Invoice Detail page -- owned by FEAT-05.SPEC-001 (Invoice Detail); this spec defines only the payment-capability behavior that page surfaces.
END EXAMPLE -->

## Capability Category

{The category of external capability this spec depends on, in the capability-category vocabulary (payments, identity, email, calendar, AI, maps, storage, ...). Trace it to its Stage 2 dependency and its External Touchpoints row. Vendor-neutral unless BRIEF.md records a user mandate.}

**Category:** {capability category}
**Dependency Source:** {ASMP-XX -- the Dependencies entry in assumptions-constraints.md this capability traces to}
**External Touchpoint:** {The matching row in feature-dependency-map.md, ## External Touchpoints}
**Vendor Mandate:** {None -- vendor selection is a Stage 4 decision | {Vendor name} -- mandated by the user in BRIEF.md ({section})}

<!-- EXAMPLE (payment collection):
**Category:** Payment processing
**Dependency Source:** ASMP-14 -- "Requires a payment-processing capability" (assumptions-constraints.md, Dependencies)
**External Touchpoint:** "Payment processing" row in feature-dependency-map.md, ## External Touchpoints (Features Involved: FEAT-05)
**Vendor Mandate:** None -- vendor selection is a Stage 4 decision.
END EXAMPLE -->

## Product Behaviors Enabled

{Every product behavior that exists because of this capability, mapped to the Brief capability it serves and the spec that delivers it to the user. This is the "why the product needs it" table -- if a behavior has no row here, the capability does not owe it anything.}

| Product Behavior | Brief Capability Served | Delivered Through (Spec ID) |
|------------------|------------------------|------------------------------|
| {What the user can do because this capability exists} | {Capability from the Brief's Capability Coverage Map} | {FEAT-NN.SPEC-NNN (Name)} |

<!-- EXAMPLE (payment collection):
| Product Behavior | Brief Capability Served | Delivered Through (Spec ID) |
|------------------|------------------------|------------------------------|
| Sarah generates a payment link for an open invoice and shares it with the invoice recipient | Collect payment on an invoice | FEAT-05.SPEC-001 (Invoice Detail) |
| The invoice shows its live payment status (Open, Paid, Failed, Refunded) | Track invoice payment status | FEAT-05.SPEC-001 (Invoice Detail), FEAT-05.SPEC-002 (Invoice List) |
| Sarah is notified when an invoice is paid | Know when money arrives without checking manually | FEAT-05.SPEC-005 (Payment Received Notification) |
END EXAMPLE -->

## Data Exchanged

{What data leaves the product and what data enters it, in the entity/field vocabulary of the Feature Dependency Map. Every outbound field needs a purpose -- data with no purpose is not sent. This section is the source of truth for the Consent and Disclosure section.}

**Leaves the product:**

| Data | Entity / Fields | Sent When | Purpose |
|------|----------------|-----------|---------|
| {What is shared} | {Exact entity and fields from the dependency map} | {The action or event that sends it} | {Why the capability needs it} |

**Enters the product:**

| Data | Received When | Lands In (Entity / Fields) |
|------|--------------|-----------------------------|
| {What comes back} | {The event that delivers it} | {Exact entity and fields it updates} |

<!-- EXAMPLE (payment collection):
**Leaves the product:**

| Data | Entity / Fields | Sent When | Purpose |
|------|----------------|-----------|---------|
| Invoice amount and currency | Invoice -- amount, currency | Sarah generates a payment link | The capability must know what to charge |
| Invoice reference | Invoice -- invoice number | Sarah generates a payment link | Ties the payment outcome back to the right invoice |
| Recipient name and email | Contact -- first name, last name, email | Sarah generates a payment link | The capability addresses the payment request to the right person |

Contact notes, other invoices, and all other contact fields never leave the product.

**Enters the product:**

| Data | Received When | Lands In (Entity / Fields) |
|------|--------------|-----------------------------|
| Payment outcome (succeeded / failed / refunded) | The capability reports a payment event | Invoice -- payment status |
| Paid amount and payment date | Payment succeeded | Invoice -- paid amount, paid date |
| Failure reason (plain-language category) | Payment failed | Invoice -- last failure reason |
END EXAMPLE -->

## Inbound Events

{Everything the outside world can tell the product through this capability, and what the product does in response. Same shape as an automation's outcome table. Events needing multi-step processing route to an Automation spec (by ID) rather than being processed here.}

| Event | Condition | Data Changes | User Feedback | Affected Specs |
|-------|-----------|-------------|---------------|----------------|
| {What the capability reports} | {When this event arrives} | {What data is created/updated} | {What the user sees, if anything} | {Which specs react, by ID} |

<!-- EXAMPLE (payment collection):
| Event | Condition | Data Changes | User Feedback | Affected Specs |
|-------|-----------|-------------|---------------|----------------|
| Payment succeeded | The invoice recipient completes payment on an open invoice | Invoice payment status set to Paid; paid amount and paid date recorded | Invoice Detail shows a Paid badge with the paid date; payment notification fires | FEAT-05.SPEC-001 (Invoice Detail), FEAT-05.SPEC-003 (Payment Status Update), FEAT-05.SPEC-005 (Payment Received Notification) |
| Payment failed | A payment attempt on an open invoice does not complete | Invoice payment status set to Failed; last failure reason recorded | Invoice Detail shows "Payment failed: {failure reason}. The payment link remains active for another attempt." | FEAT-05.SPEC-001 (Invoice Detail), FEAT-05.SPEC-003 (Payment Status Update) |
| Refund completed | A refund initiated by Sarah finishes | Invoice payment status set to Refunded | Invoice Detail shows a Refunded badge with the refund date | FEAT-05.SPEC-001 (Invoice Detail), FEAT-05.SPEC-003 (Payment Status Update) |
END EXAMPLE -->

## Degradation Behavior

{What the user experiences when the capability is slow, down, or rejects a request -- one row per affected screen, by spec ID. Every cell is a concrete user experience with exact messages: what the user sees, what still works, and what is blocked or queued. "N/A -- {reason}" is legal per cell where a condition genuinely cannot affect that screen.}

| Affected Screen (Spec ID) | Capability Slow | Capability Down | Capability Rejects |
|---------------------------|-----------------|-----------------|--------------------|
| {FEAT-NN.SPEC-NNN (Name)} | {User experience with exact message} | {User experience with exact message} | {User experience with exact message} |

<!-- EXAMPLE (payment collection):
| Affected Screen (Spec ID) | Capability Slow | Capability Down | Capability Rejects |
|---------------------------|-----------------|-----------------|--------------------|
| FEAT-05.SPEC-001 (Invoice Detail) | "Generate payment link" shows a progress state; after 10 seconds a note appears: "Still working -- this is taking longer than usual." The rest of the invoice remains fully usable. | The button is disabled with the message "Payment collection is temporarily unavailable. Your invoice is safe -- try again in a few minutes." Sarah can still view, edit, and send the invoice without a payment link. | Message with the rejection reason in plain language: "This payment request was declined: {reason}. Review the invoice details and try again." The invoice is unchanged. |
| FEAT-05.SPEC-002 (Invoice List) | Status badges render from the last known payment status -- no waiting state on the list. | Badges show the last known status with a banner: "Payment statuses may be out of date." | N/A -- the list sends no requests to the capability; rejection cannot occur here. |
END EXAMPLE -->

## Consent and Disclosure

{What the user must be told or asked about this capability, and when. Derived from the Data Exchanged section: every data element that leaves the product must be covered by a disclosure. Include the moment of disclosure, the exact user-facing wording, and what the product never shares.}

- **{Disclosure or consent moment}** -- {When it appears, the exact wording, and what the user can do about it.}

<!-- EXAMPLE (payment collection):
- **First payment link disclosure** -- The first time Sarah generates a payment link, a notice appears before the link is created: "To collect this payment, the invoice amount, invoice number, and the recipient's name and email are shared with an external payment service." Options: "Continue" and "Cancel". Shown once; afterwards a "How payment data is shared" link on Invoice Detail reopens the same notice.
- **Recipient-facing disclosure** -- The payment page the invoice recipient sees states that payment is handled by an external payment service and names what the recipient's payment details are used for. Payment details entered by the recipient are handled by the capability and never enter the product.
- **What is never shared** -- Contact notes, the contact's other invoices, and every contact field beyond name and email stay inside the product. This boundary is stated in the disclosure notice.
END EXAMPLE -->

## Edge Cases

{Scenarios the happy path does not cover, including event-delivery imperfections. Each as scenario-to-expected-behavior. Cover at minimum: an event arriving for an entity that no longer exists, the same event delivered twice, events arriving out of order, and degradation striking mid-action.}

- **{Scenario}** -- {Expected behavior.}

<!-- EXAMPLE (payment collection):
- **Payment event arrives for a deleted invoice** -- The event is recorded against the invoice's retained record (invoices are soft-deleted per the dependency map) and no user feedback fires. The restored invoice shows the correct payment status.
- **The same payment event is delivered twice** -- The second delivery changes nothing: an invoice already marked Paid stays Paid with its original paid date, and no duplicate notification fires.
- **Events arrive out of order (refund before its payment)** -- The invoice reflects the most recent event by event time, not arrival time. A refund event arriving first sets Refunded; the late-arriving payment event does not overwrite it.
- **Capability goes down mid-generation** -- If the payment link was not confirmed created, Invoice Detail shows the capability-down message and the invoice stays without a link -- no half-created state.
- **Payment succeeds while Sarah is editing the invoice** -- The edit screen shows a non-blocking banner: "This invoice was just paid. Amount changes are no longer possible." Editable fields not affected by payment remain editable, per XBR-04.
END EXAMPLE -->

## Connected Specs

{Explicit cross-references to the specs this integration touches. Every reference is bidirectional: each listed spec must reference this one back.}

| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| {FEAT-NN.SPEC-NNN (Name)} | {Triggered by \| Triggers \| Affects \| References} ({inbound \| outbound}) | {What the connection does} |

<!-- EXAMPLE (payment collection):
| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| FEAT-05.SPEC-001 (Invoice Detail) | Triggered by (inbound) | "Generate payment link" initiates a collection request |
| FEAT-05.SPEC-001 (Invoice Detail) | Affects (outbound) | Payment status, degradation states, and disclosure notice surface here |
| FEAT-05.SPEC-002 (Invoice List) | Affects (outbound) | Status badges reflect payment outcomes |
| FEAT-05.SPEC-003 (Payment Status Update) | Triggers (outbound) | Inbound payment events fire this automation |
| FEAT-05.SPEC-005 (Payment Received Notification) | Triggers (outbound) | The payment-succeeded event leads to this notification |
END EXAMPLE -->

## Analytics and Success Signals

{The events this integration should emit, in functional terms: event name plus the properties it carries. Integrations typically emit one event per behavior enabled and one per inbound-event outcome. Each event cites the Stage 2 metric it feeds by exact name (Stage 2 metrics carry no ID prefix; the metric's Connected Feature field ties it to this feature). "N/A -- {reason}" is legal for an event slot with no corresponding metric; the section is never absent.}

- **{event_name}** ({properties}) -- supports success-metrics.md: "{exact metric name}"

<!-- EXAMPLE (payment collection):
- **payment_link_generated** (invoice reference) -- supports success-metrics.md: "Invoice Payment Completion"
- **payment_outcome_received** (outcome: succeeded / failed / refunded) -- supports success-metrics.md: "Invoice Payment Completion"
- **payment_degradation_shown** (condition: slow / down / rejected; screen: spec ID) -- N/A -- no Stage 2 metric measures degradation frequency; retained so the product's tolerance for capability trouble is observable.
END EXAMPLE -->

## Acceptance Criteria

{Given/When/Then statements covering every product behavior, every inbound event, every degradation path per affected screen, and every disclosure moment. Persona-grounded.}

**{FEAT-NN.SPEC-NNN}-AC-01:** Given {persona name} {context}, when {event or action}, then {observable outcome}.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Product Behaviors | {N} | {N} |
| Inbound Events | {N} | {N} |
| Degradation Paths | {N} | {N} |
| Consent and Disclosure | {N} | {N} |
| Edge Cases | {N} | {N} |

<!-- EXAMPLE (payment collection):
**FEAT-05.SPEC-004-AC-01:** Given Sarah is viewing an open invoice, when she taps "Generate payment link" and the capability confirms creation, then the link appears on Invoice Detail ready to share, and the invoice status remains Open.

**FEAT-05.SPEC-004-AC-02:** Given an open invoice has an active payment link, when the capability reports the payment succeeded, then the invoice status changes to Paid with the paid date shown, and Sarah receives the payment notification (FEAT-05.SPEC-005).

**FEAT-05.SPEC-004-AC-03:** Given an open invoice has an active payment link, when the capability reports a failed payment, then Invoice Detail shows "Payment failed: {failure reason}. The payment link remains active for another attempt." and the status shows Failed.

**FEAT-05.SPEC-004-AC-04:** Given Sarah taps "Generate payment link" while the capability is unavailable, when the request cannot be sent, then the button is disabled with "Payment collection is temporarily unavailable. Your invoice is safe -- try again in a few minutes." and the invoice is unchanged.

**FEAT-05.SPEC-004-AC-05:** Given Sarah has never generated a payment link before, when she taps "Generate payment link", then the data-sharing notice appears with "Continue" and "Cancel", and no data leaves the product until she chooses "Continue".

**FEAT-05.SPEC-004-AC-06:** Given an invoice is already marked Paid, when the same payment-succeeded event is delivered again, then nothing changes and no duplicate notification fires.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Product Behaviors | 3 | 3 |
| Inbound Events | 3 | 3 |
| Degradation Paths | 5 (2 screens; N/A cell excluded) | 5 |
| Consent and Disclosure | 2 | 2 |
| Edge Cases | 5 | 5 |
END EXAMPLE -->
