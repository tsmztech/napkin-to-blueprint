<!-- Synthesizer: @-include this file during the Completeness Audit step.
     Execute all four audit procedures after reconciliation and before writing final documents.
     The addition discipline in Section 5 applies to all audit-added changes. -->

# Completeness Audit Procedures

Four audit procedures for verifying feature completeness, with an evidence-justified addition discipline and a decision framework for resolving gaps.

## Section 1: Audit 1 — Persona Journey Walkthrough

Walk every journey in `draft-user-journeys.md` from the perspective of its owning persona. At each step, ask:

1. **Feature coverage:** What feature does the user need at this step? Verify it exists in the feature list.
2. **Error handling:** What happens if the user makes a mistake at this step?
3. **Empty state:** What does the user see the very first time they reach this step (before any data)?
4. **Reversal path:** How does the user get back if they want to undo or change something?
5. **Counterpart symmetry:** When this step involves another party (the other side of a booking, transaction, conversation, or approval), what does failure look like from *each* side? Every failure mode that can be committed by either party must be specified per party — "no-show", "cancellation", "non-payment" are not single behaviors when two parties can each cause them, and each side's consequence (financial and reputational) must be owned by some feature or explicitly excluded.

**Per-feature Functional Depth walk:** the journey walk asks these questions per step; this walk asks them per feature. After walking every journey, walk every feature entry in the draft feature list and verify each of its eight Functional Depth fields carries substantive content for this specific feature — not a restatement of the description, and not a reflexive N/A:

1. **Primary Flows & Alternates:** happy path plus named alternate/edge behaviors.
2. **States:** empty / loading / error / offline-degraded expectations.
3. **Validation & Limits:** input constraints, boundary values, quantity limits.
4. **Access:** which persona/role can see/do this, and what an unauthorized user experiences.
5. **Communications:** notifications/emails/push this feature triggers.
6. **Data Notes:** captured vs displayed vs derived, and source.
7. **Interactions:** other FEAT-IDs this feature affects or depends on.
8. **Signals:** the analytics events this feature should emit.

`N/A — {one-sentence reason}` is legal only where a field genuinely does not apply to the feature; a field left shallow because nobody thought about it is a gap, resolved like any other.

**Value-flow walk (mandatory when any feature touches money):** trace every unit of value end-to-end — from the moment a user is told a price to the moment every party has been paid or refunded. For each flow ask: where does each portion of the money enter the platform, who holds it while work is pending, and how does every portion leave (payout, refund, forfeiture, fee)? A product that specifies a deposit but never the remaining balance, or earnings but never their collection path, has an open value flow — the single fastest way a handoff package fails buildable-without-asking. Every open segment becomes a gap: a feature/capability that closes it, or an explicit scope exclusion stating who owns that segment (e.g. "balance settled offline, outside the platform — deliberate").

**Gap resolution:** Any gap becomes one of:
- A new feature (per the evidence-justified additions discipline, Section 5)
- A new Key Capability added to an existing feature
- Enriched content in an existing feature's Functional Depth fields
- An explicit scope exclusion with rationale

## Section 2: Audit 2 — Competitive Feature Cross-Reference

Compare every "Common Feature" from `market-research.md` Feature Landscape against the draft feature list.

Three outcomes per common feature:
- **Present:** Feature exists in draft list. Confirm and move on.
- **Absent-common:** Feature is common across competitors but missing. Decide: add (per the evidence-justified additions discipline, Section 5) or exclude with rationale.
- **Absent-differentiator:** Feature is a differentiator, not common. Evaluate alignment with product vision before deciding.

Goal: every omission is deliberate, not accidental.

## Section 3: Audit 3 — Entity Coverage Verification

Using the Domain Entity Inventory from `draft-product-features.md`, verify each entity has:

1. A feature that creates it
2. A feature that displays it (single instance and list view)
3. A mechanism for editing and deleting/archiving it
4. Relationship management for each related entity pair
5. No orphaned entities (every entity reachable through at least one feature)

**Inverse check — captured data without an entity:** the five checks above validate the entities the inventory *lists*; this check catches what it *omits*. Sweep every feature's `**Data Notes:**` field for captured/persisted data (`Captured:` items, stored records, saved preferences, message text, referral codes) and verify each maps to an inventory entity. Data a feature captures with no entity to hold it is a gap: add the entity to the inventory (with its owning features) or record why it needs none.

**Gap resolution:** Add a capability to an existing feature, expand a feature, or add a scope exclusion.

## Section 4: Audit 4 — Cross-Cutting Concerns Verification

Verify each concern from the `decomposition-checklists.md` cross-cutting concerns list. Each concern is in one of three states:

- **Included:** Present as a feature or capability. Confirm it appears in at least one user journey.
- **Excluded:** Listed in scope exclusions. Confirm the rationale is documented.
- **Not mentioned:** Flag as a gap. Decide: add (per the evidence-justified additions discipline, Section 5) or exclude with rationale.

## Section 5: Evidence-Justified Additions

Feature additions are governed by evidence, not numeric caps. Every feature added during synthesis or audit — `[RESEARCH-SUGGESTED]` and `[AUDIT-ADDED]` alike — must satisfy all four conditions:

1. **Provenance marker:** the addition carries its marker. Audit-added items use `[AUDIT-ADDED: <audit number> — <rationale>]`; audit-driven exclusions use `[AUDIT-EXCLUDED: <audit number> — <rationale>]`.
2. **Cited evidence or named audit:** the marker cites the research evidence (with its confidence level) or names the audit procedure that produced the finding.
3. **Tier justified in Rationale:** the feature's Rationale states why it sits at its priority tier. Core-tier additions are allowed when the evidence is HIGH-confidence and the capability is genuinely load-bearing for the product — the marker must explain why it is Core.
4. **Vision alignment:** the addition serves the product vision stated in BRIEF.md. Audit 2's test for differentiators — evaluate alignment with product vision before deciding — is the general rule for ALL additions, from any audit or research finding.

Two boundaries hold regardless of evidence:

- **Scope boundary:** The audit cannot change the product's fundamental scope. It adds missing pieces the vision demands; it does not redefine what the product is.
- **SYN-04 is absolute:** Features tied to BRIEF.md goals can never be removed, regardless of research confidence level or audit outcome. No addition, exclusion, or reconciliation decision overrides SYN-04.

## Section 6: Decision Framework

For each gap found during any audit, three resolution paths:

1. **New feature** — Must satisfy the evidence-justified additions discipline (Section 5): provenance marker, cited evidence or named audit, tier justified in Rationale, vision alignment. Any tier is available, including Core with HIGH-confidence justification.
2. **New capability in existing feature** — Add a Key Capability (or enrich a Functional Depth field) in the most relevant existing feature.
3. **Explicit scope exclusion** — Document the exclusion with rationale and provenance marker.

Findings fold into the final documents directly — there is no separate audit output document.
