<!-- Agent: spec-writer (spec_type: notification)
     When: @-include when writing Notification specs.
     Purpose: 5-phase methodology for producing spec-notification.md documents.
     Prerequisite: Feature Breakdown Brief (feature-overview.md) must be loaded as context. -->

# Notification Spec Writing Methodology

Prescriptive 5-phase methodology for producing detailed Notification spec documents. A Notification spec makes a communication buildable: channel, audience, exact content, and delivery behavior -- a builder must be able to send this message without inventing a single word. Each phase builds on the previous. Follow phases in order -- do not skip or reorder.

---

## Phase 1 -- Communication Inventory and Anchoring

Read the Feature Breakdown Brief. Anchor this notification in the Stage 2 record of the communication before writing anything.

**Step 1: Trace the communication to its Stage 2 source.**
Find this communication in the parent feature's **Communications:** field in product-features.md, the Brief's Side-Effect Inventory, or a user-journey step. A notification with no Stage 2 source is an invented communication -- stop and flag it. Note what the source promises: who is told what, at what moment.

**Step 2: Understand the moment.**
When does this notification arrive in the recipient's day, and what are they doing? A communication is an interruption -- the spec must justify the interruption. What happens if the recipient never sees it? That answer shapes channels, retry, and expiry.

**Step 3: Understand the trigger source.**
What fires this notification? Identify the source spec by FEAT-NN.SPEC-NNN ID -- a screen action, an automation outcome, or an integration's inbound event. A notification is never triggered by an unnamed process.

**Step 4: Understand the recipient.**
Read the persona summary and the Access Matrix slice. Which roles receive this notification? What is their channel behavior -- are they inside the product all day, or away from it when the moment strikes? What tone does the product's definition commit to?

**Output:** No written artifact. This phase builds the context carried through all subsequent phases.

**Guidance:** Do not start writing the spec yet. Notifications written before the moment and recipient are understood default to "send an email" regardless of whether email fits.

---

## Phase 2 -- Channel and Audience Decisions

Decide how the communication travels and who controls it.

**Step 1: Choose channels.**
For each of the product-level channels -- in-app, email, push, SMS -- decide: does this notification use it, under what conditions, and why does that fit this recipient and moment? Every chosen channel needs a rationale grounded in the persona's behavior; every rejected channel that the product otherwise uses should be a conscious decision. More channels is not better -- each added channel multiplies the delivery, preference, and failure surface.

**Step 2: Define the audience.**
Who receives this notification, in Access Matrix role terms? If behavior differs by role (different roles get different content or channels), each difference must be explicit. Confirm the recipient is entitled to the data the notification carries -- a notification must never leak content its recipient cannot access in the product.

**Step 3: Define preference controls.**
What can the recipient control -- on/off, channel selection, timing? For each preference: its options, its default, and the screen (by spec ID) where it is set. Defaults are product decisions: justify opt-out defaults against the product's tone commitments. State the rule for when preferences are evaluated (delivery time, not trigger time, unless there is a stated reason otherwise).

**Step 4: Define quiet hours.**
Does a quiet-hours window govern this notification? Per channel: held, skipped, or exempt -- with the default window and where the user changes it. If the product defines no quiet hours, state that as a decision with a reason.

**Output:** Channels section, Audience and Preferences section.

---

## Phase 3 -- Content Definition

Write the exact messages. The exact-message discipline that governs error messages governs content templates: exact wording, never a description of wording.

**Step 1: Write each channel's template.**
For every channel: title/subject and body as exact text with {placeholder} variables. Respect each channel's nature -- an in-app title is glanceable, an email body can carry context. The tone must match the product's definition, not generic notification-speak.

**Step 2: Declare every placeholder.**
For each {placeholder}: its source as an exact entity and field from the dependency map (or an explicitly derived value), an example value, and an empty-value fallback -- the exact rendering when the value is missing. A placeholder whose source cannot be named is content the notification does not have.

**Step 3: Define the CTA.**
Every notification that can be acted on names its call to action: the exact label and the deep-link destination by FEAT-NN.SPEC-NNN spec ID, including which record it opens. A notification with no action is a decision -- state it.

**Step 4: Write variant forms.**
If Phase 4's delivery rules will batch this notification, the batched variant is content too: its own title/subject, body, and CTA, with its count placeholders declared. The same applies to any role-specific variants from Phase 2.

**Output:** Content Definition section.

---

## Phase 4 -- Delivery Rules and Cross-Reference

Define how delivery behaves beyond the single happy send, then verify the web of references.

**Step 1: Define the four delivery rules.**
- **Batching:** When do multiple pending instances collapse into one notification? What is the batching window and key (per recipient, per day, per entity)?
- **Deduplication:** What guarantees the same notification is not delivered twice -- including when the triggering automation re-runs?
- **Retry on failure:** Per channel: how many retries, over what window, and what happens after the final failure? Does another channel become the delivery of record?
- **Expiry:** When does an undelivered notification stop being worth delivering? A stale notification can be worse than none -- state the cutoff and what survives it (usually an in-product state).

Every rule carries concrete values -- counts, windows, cutoffs. "Reasonable retry behavior" is not a rule.

**Step 2: Resolve rule collisions.**
Quiet hours, expiry, batching, and preference changes interact. Walk the collisions explicitly: a hold that crosses the expiry cutoff, a preference turned off while a delivery is pending, an instance becoming due while a batch is forming. Each resolution is an Edge Cases entry with a stated winner.

**Step 3: Cross-reference verification.**
- The trigger source spec (automation outcome table, integration Inbound Events, or screen interaction) names this notification in its outputs.
- Every preference's "Where Set" screen exposes that control in its spec.
- Every CTA deep-link destination exists and lists this notification as an inbound connection.
- Entity and field references in placeholders match the dependency map exactly.

Flag any missing bidirectional reference.

**Output:** Delivery Rules section, Edge Cases section, Connected Specs section.

---

## Phase 5 -- Assembly and Self-Verification

Fill the spec-notification.md template and verify completeness.

**Step 1: Write frontmatter.**
Complete all frontmatter fields with accurate values (spec_type: notification).

**Step 2: Write Acceptance Criteria.**
Cover every channel x trigger x preference-state combination with at least one Given/When/Then criterion, plus one per delivery rule and per edge case. Ground all criteria in the persona: "Given Sarah has one follow-up due today..."

For notifications, acceptance criteria often follow the pattern:
- "Given [recipient and preference state], When [trigger fires], Then [exact message arrives on channel] / [nothing is delivered]"

**Step 3: Build Coverage Summary Table.**
Tally: Channels, Trigger Paths, Preference States, Delivery Rules, Edge Cases.

**Output:** Complete spec file ready for quality review.

### Self-Verification Checklist

Before finalizing the spec file, verify against all four categories.

**Structural Completeness:**
- [ ] All required sections present and non-empty (per Notification spec template)
- [ ] Frontmatter complete with accurate counts
- [ ] Every used channel has a Content Definition template
- [ ] All four delivery rules (batching, deduplication, retry, expiry) are defined with concrete values

**Coverage:**
- [ ] Every channel x trigger x preference-state combination has at least one acceptance criterion
- [ ] Every delivery rule has at least one acceptance criterion
- [ ] Every rule collision (quiet hours vs expiry, preference change mid-flight, batch formation) is an edge case with a stated winner
- [ ] The disappearing-record scenario (underlying entity deleted or resolved before delivery) is covered

**Consistency:**
- [ ] The trigger source is a spec ID whose own spec names this notification in its outputs
- [ ] Audience roles come from the Access Matrix; the recipient is entitled to every data element the content carries
- [ ] Every placeholder's source matches the dependency map exactly; every placeholder has an empty-value fallback
- [ ] Every CTA deep-links to an existing spec by exact FEAT-NN.SPEC-NNN ID, bidirectionally referenced
- [ ] Every analytics event cites its Stage 2 metric by exact name (or carries an explicit N/A with reason)

**Clarity (ambiguity scan):**
- [ ] Titles, subjects, and bodies are exact wording -- no "a friendly reminder message" or other described-not-written content
- [ ] No vague adjectives ("appropriate," "timely," "user-friendly") anywhere in the spec
- [ ] Channel names stay product-level (in-app / email / push / SMS) -- no delivery vendors or messaging infrastructure
- [ ] Every pronoun has an unambiguous referent; every actor in every sentence is named

---

## Decision Rules

### When a communication warrants a standalone Notification spec

**Standalone Notification spec when:**
- The content template is non-trivial (a subject/body with placeholders, not a fixed toast)
- It travels on any channel beyond the triggering screen (email, push, SMS, or in-app outside the current session)
- The recipient can control it (preferences, opt-out, quiet hours)
- It can be triggered from more than one source
- It is a first-class unit downstream (a thing a project tracker would make a story of)

**Inline in the triggering spec when:**
- It is a transient in-session confirmation (a toast or banner on the screen that caused it)
- It has no preference surface and no delivery rules -- it either renders or the screen's general error handling applies
- Its full content is a single fixed line already specified in the triggering spec's feedback column

### When to split a notification spec into two

Split when the same trigger produces fundamentally different communications: different audiences (roles) receiving different content, or messages whose content and delivery rules share less than half their definition. Keep as one spec with variants when the message differs only by channel rendering or by the batched/single form.
