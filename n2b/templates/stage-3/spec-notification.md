---
document_type: spec
spec_type: notification
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

# Notification Spec: {Spec Name}

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": the Feature Breakdown Brief is mandatory context -- read it before writing
  - See pipeline-rules.md constraint "grounded-roles": the audience must be roles from the Stage 2 persona documents (Access Matrix) -- never invented recipients
  - See pipeline-rules.md constraint "functional-language-only": channels are product-level (in-app / email / push / SMS) -- never delivery vendors or messaging infrastructure
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - The Feature Breakdown Brief (feature-overview.md) is mandatory context for this spec
  - Every capability assigned to this spec in the Brief's Capability Coverage Map must be accounted for
  - Use FEAT-NN.SPEC-NNN dot-notation IDs when referencing connected specs
  - Use exact entity names and fields from the Feature Dependency Map
  - Reference cross-feature business rules by XBR-NN Rule ID
  - Exact-message discipline applies to content templates: subject/title and body are exact wording with {placeholder} variables -- every placeholder is declared with its entity/field source and an empty-value fallback
  - Every CTA names its deep-link destination by FEAT-NN.SPEC-NNN spec ID
  - The Trigger section reuses the automation trigger-table shape; every source is a spec ID (screen, automation, or integration), never an unnamed process
  - Every channel x trigger x preference-state combination must be covered by acceptance criteria
  - Every analytics event must cite the Stage 2 metric it feeds by exact name: supports success-metrics.md: "{exact metric name}"
  - Non-goal rationales must trace to a product decision (scope-boundaries.md, product-features.md, or BRIEF.md) -- never to effort, timeline, or keeping the product small
  - Minimum 2 non-goals in Scope and Non-Goals section
  - Platform-set policy values (deposit amounts, fee/refund percentages, time windows, prices, payout cycles -- anything fixed platform-wide and decided at build) are NEVER stated as concrete numbers: write the inline marker platform parameter: `{kebab-slug}` instead -- one slug per distinct parameter, reused verbatim at every site referencing the same value. Pass D collects every marker into specifications/platform-parameters.md with a proposed default; Gate A reconciles markers against that registry. Values that genuinely belong to one feature's own definition stay inline as before
  - Before writing, update all frontmatter fields: spec_id, spec_name, spec_slug, parent_feature, parent_feature_name, priority_tier, produced_by (spec-writer), status, created (today's date), acceptance_criteria_count
-->

## Overview

**Name:** {Spec Name}
**ID:** {FEAT-NN.SPEC-NNN}
**Type:** Notification
**Purpose:** {One sentence describing what this notification tells whom, and why.}
**Parent Feature:** {FEAT-NN} -- {Feature Name}

<!-- EXAMPLE (follow-up reminder):
**Name:** Follow-up Reminder Notification
**ID:** FEAT-04.SPEC-003
**Type:** Notification
**Purpose:** Reminds the user on the due date that a follow-up with a contact is due, so no committed follow-up is missed.
**Parent Feature:** FEAT-04 -- Follow-up Reminders
END EXAMPLE -->

## Scope and Non-Goals

**In Scope:**
- {What communications this spec covers.}

**Non-Goals:**
- {What this spec explicitly excludes. Reference sibling specs by ID where applicable. Each exclusion cites the product decision behind it.}
- {Second non-goal minimum.}

<!-- EXAMPLE (follow-up reminder):
**In Scope:**
- The reminder delivered when a follow-up becomes due, on both its channels (in-app and email)
- The batched variant when multiple follow-ups are due on the same day
- Preference, quiet-hours, retry, and expiry behavior for this reminder

**Non-Goals:**
- Deciding which follow-ups are due -- owned by FEAT-04.SPEC-002 (Reminder Scheduler); this spec begins where the scheduler's trigger fires.
- Overdue nagging after the due date -- excluded per scope-boundaries.md: the product definition commits to a single respectful reminder per follow-up; repeated pressure contradicts the product's forgiving tone.
- Reminders about anything other than follow-ups -- product-features.md defines no other reminded object in this feature.
END EXAMPLE -->

## Channels

{The product-level channels this notification uses: in-app / email / push / SMS. One row per channel actually used, each with when it is used and a rationale grounded in the persona's behavior. Channels not used are not listed.}

| Channel | Used When | Rationale |
|---------|-----------|-----------|
| {in-app \| email \| push \| SMS} | {The conditions under which this channel carries the notification} | {Why this channel fits this audience and moment} |

<!-- EXAMPLE (follow-up reminder):
| Channel | Used When | Rationale |
|---------|-----------|-----------|
| In-app | Always when a reminder is delivered | Sarah works inside the product during business hours; the reminder must be where the follow-up action happens |
| Email | When the "In-app + email" channel preference is set (the default) | The persona's day includes long stretches away from the product; email catches follow-ups that would otherwise wait until the next session |
END EXAMPLE -->

## Trigger

{What causes this notification to be sent. Same table shape as an automation's Trigger Definition. The source is always a spec ID -- a screen, an automation, or an integration -- never an unnamed process.}

| Trigger | Source Spec | Conditions | Available Data |
|---------|-----------|------------|----------------|
| {Event that causes the notification} | {FEAT-NN.SPEC-NNN (Name)} | {When does this trigger fire} | {What data is available at trigger time} |

<!-- EXAMPLE (follow-up reminder):
| Trigger | Source Spec | Conditions | Available Data |
|---------|-----------|------------|----------------|
| Follow-up due | FEAT-04.SPEC-002 (Reminder Scheduler) | Fires when the scheduler finds a follow-up due today that has not yet produced a reminder | Contact name, follow-up note, due date, contact reference |
END EXAMPLE -->

## Audience and Preferences

{Who receives this notification (roles from the Access Matrix in user-persona.md), what preference controls govern it, and how quiet hours apply. Every preference names the screen (by spec ID) where it is set.}

**Recipients:** {Which role(s) receive this notification and why -- traced to the Access Matrix.}

**Preference Controls:**

| Preference | Options | Default | Where Set (Spec ID) |
|------------|---------|---------|---------------------|
| {What the user can control} | {The available choices} | {The default} | {FEAT-NN.SPEC-NNN (Name)} |

**Quiet Hours:** {How quiet hours affect this notification -- held, skipped, or exempt, per channel, with the default window. "N/A -- {reason}" if the product defines no quiet hours.}

<!-- EXAMPLE (follow-up reminder):
**Recipients:** Sarah -- the sole user type per the Access Matrix in user-persona.md. A reminder is delivered only to the user who owns the follow-up; follow-ups are private to their owner.

**Preference Controls:**

| Preference | Options | Default | Where Set (Spec ID) |
|------------|---------|---------|---------------------|
| Follow-up reminders | On / Off | On | FEAT-04.SPEC-001 (Reminder Settings) |
| Reminder channels | In-app only / In-app + email | In-app + email | FEAT-04.SPEC-001 (Reminder Settings) |
| Quiet hours window | Any start/end time, or disabled | 21:00-08:00 local time | FEAT-04.SPEC-001 (Reminder Settings) |

**Quiet Hours:** A reminder that becomes due during quiet hours is held on both channels and delivered when quiet hours end. The due state itself is not held -- the follow-up shows as due inside the product immediately.
END EXAMPLE -->

## Content Definition

{The exact content per channel: subject/title and body as exact wording with {placeholder} variables, plus the CTA and its deep-link destination by spec ID. If Delivery Rules define batching, the batched variant is defined here too. Every placeholder is declared in the placeholder table with its source and an empty-value fallback -- a builder must be able to render every message without inventing a single word.}

**{Channel}:**
- **Title/Subject:** {Exact wording with {placeholders}}
- **Body:** {Exact wording with {placeholders}}
- **CTA:** {Exact label} -- deep-links to {FEAT-NN.SPEC-NNN (Name)} for {the specific record}

**Placeholders:**

| Placeholder | Source (Entity / Field) | Example Value | Empty-Value Fallback |
|-------------|------------------------|---------------|----------------------|
| {placeholder} | {Exact entity and field from the dependency map} | {Example} | {Exact rendering when the value is empty} |

<!-- EXAMPLE (follow-up reminder):
**In-app:**
- **Title:** Follow up with {contact_name}
- **Body:** Due today: {follow_up_note}
- **CTA:** View contact -- deep-links to FEAT-01.SPEC-002 (Contact Edit) for the contact referenced by the follow-up

**Email:**
- **Subject:** Reminder: follow up with {contact_name} today
- **Body:**
  Hi {user_first_name},

  Your follow-up with {contact_name} is due today: {follow_up_note}

  Open the contact to review your notes and log the outcome.
- **CTA (button):** Open {contact_name} -- deep-links to FEAT-01.SPEC-002 (Contact Edit) for the contact referenced by the follow-up

**Batched variant (2+ follow-ups due the same day -- see Delivery Rules):**
- **In-app title:** {count} follow-ups due today
- **In-app body:** Including {contact_name} and {count_minus_one} more
- **Email subject:** Reminder: {count} follow-ups due today
- **Email body:** A list with one line per follow-up: {contact_name} -- {follow_up_note}
- **CTA:** View follow-ups -- deep-links to FEAT-04.SPEC-001 (Reminder Settings), Due Today list

**Placeholders:**

| Placeholder | Source (Entity / Field) | Example Value | Empty-Value Fallback |
|-------------|------------------------|---------------|----------------------|
| {contact_name} | Contact -- first name + last name | Jane Doe | Never empty -- contact name is required at contact creation (FEAT-01.SPEC-005) |
| {follow_up_note} | Follow-up -- note | Send pricing proposal | The "Due today:" line renders as "Due today." with no note text |
| {user_first_name} | User profile -- first name | Sarah | Greeting renders as "Hi," |
| {count} / {count_minus_one} | Derived -- number of follow-ups due today | 3 / 2 | Never empty -- the batched variant only renders with 2+ due follow-ups |
END EXAMPLE -->

## Delivery Rules

{How delivery behaves beyond the single happy path: batching, deduplication, retry-on-failure, and expiry. Each as a labeled entry with concrete values -- counts, windows, and cutoffs are decisions, not suggestions.}

**Batching:** {When multiple instances collapse into one notification, and what the batched form is.}
**Deduplication:** {What guarantees the same notification is not delivered twice.}
**Retry on failure:** {Per channel: how many retries, over what window, and what happens after the final failure.}
**Expiry:** {When an undelivered notification stops being worth delivering, and what happens instead.}

<!-- EXAMPLE (follow-up reminder):
**Batching:** All follow-ups due for the same recipient on the same day are delivered as one notification per channel, using the batched variant when 2 or more are due. Follow-ups becoming due later the same day (created that day with same-day due dates) are delivered individually as they become due.
**Deduplication:** At most one reminder per follow-up. A scheduler re-run (FEAT-04.SPEC-002) never re-delivers a reminder already sent; a follow-up rescheduled to a new date becomes eligible for one new reminder on that date.
**Retry on failure:** Email delivery failure is retried up to 3 times over 6 hours. After the final failure, the in-app reminder stands as the delivery of record and no error is shown -- a reminder must never generate an alarming failure message of its own. In-app delivery has no retry: it is delivered when the user next opens the product.
**Expiry:** A reminder not delivered by the end of its due date (local time) expires undelivered -- a late reminder is worse than none. The follow-up itself shows as overdue inside the product (FEAT-04.SPEC-001, Due Today list), which is the surviving signal.
END EXAMPLE -->

## Edge Cases

{Scenarios the happy path does not cover. Each as scenario-to-expected-behavior. Cover at minimum: the underlying record disappearing before delivery, preferences changing between trigger and delivery, and quiet hours colliding with expiry.}

- **{Scenario}** -- {Expected behavior.}

<!-- EXAMPLE (follow-up reminder):
- **Contact deleted between trigger and delivery** -- The reminder is cancelled silently on every channel. A reminder about a contact the user can no longer open is never delivered.
- **Follow-up completed before delivery** -- The reminder is cancelled silently. Completing the follow-up is the outcome the reminder exists to cause; reminding afterwards reads as the product not paying attention.
- **Reminders turned off between trigger and delivery** -- Pending deliveries are cancelled on both channels. The preference wins at delivery time, not at trigger time.
- **Quiet hours extend past the end of the due date** -- The in-app reminder is delivered when quiet hours end, even though that is the next day; the email is skipped per the expiry rule. The quiet-hours hold takes precedence over expiry for in-app only, because the in-app reminder co-locates with the overdue state that explains it.
- **The same contact has follow-ups due today and tomorrow** -- Today's reminder covers only today's follow-ups. Tomorrow's follow-up produces its own reminder tomorrow; the two are never merged across days.
END EXAMPLE -->

## Connected Specs

{Explicit cross-references to the specs this notification touches. Every reference is bidirectional: each listed spec must reference this one back.}

| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| {FEAT-NN.SPEC-NNN (Name)} | {Triggered by \| References \| Navigation} ({inbound \| outbound}) | {What the connection does} |

<!-- EXAMPLE (follow-up reminder):
| Connected Spec | Connection Type | Description |
|----------------|----------------|-------------|
| FEAT-04.SPEC-002 (Reminder Scheduler) | Triggered by (inbound) | The scheduler's follow-up-due trigger fires this notification |
| FEAT-04.SPEC-001 (Reminder Settings) | References (inbound) | Preference controls and quiet-hours window govern delivery |
| FEAT-01.SPEC-002 (Contact Edit) | Navigation (outbound) | The single-reminder CTA deep-links here |
| FEAT-04.SPEC-001 (Reminder Settings) | Navigation (outbound) | The batched-reminder CTA deep-links to the Due Today list |
END EXAMPLE -->

## Analytics and Success Signals

{The events this notification should emit, in functional terms: event name plus the properties it carries. Notifications typically emit the delivered / opened / acted trio per channel. Each event cites the Stage 2 metric it feeds by exact name (Stage 2 metrics carry no ID prefix; the metric's Connected Feature field ties it to this feature). "N/A -- {reason}" is legal for an event slot with no corresponding metric; the section is never absent.}

- **{event_name}** ({properties}) -- supports success-metrics.md: "{exact metric name}"

<!-- EXAMPLE (follow-up reminder):
- **reminder_delivered** (channel: in_app / email; batched: yes / no) -- supports success-metrics.md: "Follow-up Completion Rate"
- **reminder_opened** (channel) -- supports success-metrics.md: "Follow-up Completion Rate"
- **reminder_cta_tapped** (channel; destination: contact_detail / due_today_list) -- supports success-metrics.md: "Follow-up Completion Rate"
- **reminder_expired_undelivered** (held_reason: quiet_hours / delivery_failure) -- N/A -- no Stage 2 metric measures undelivered reminders; retained so silent reminder loss is observable rather than invisible.
END EXAMPLE -->

## Acceptance Criteria

{Given/When/Then statements covering every channel x trigger x preference-state combination, plus every delivery rule and edge case. Persona-grounded.}

**{FEAT-NN.SPEC-NNN}-AC-01:** Given {persona name} {context}, when {trigger}, then {observable outcome}.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Channels | {N} | {N} |
| Trigger Paths | {N} | {N} |
| Preference States | {N} | {N} |
| Delivery Rules | {N} | {N} |
| Edge Cases | {N} | {N} |

<!-- EXAMPLE (follow-up reminder):
**FEAT-04.SPEC-003-AC-01:** Given Sarah has one follow-up with Jane Doe due today and default preferences, when the Reminder Scheduler fires, then she receives an in-app reminder titled "Follow up with Jane Doe" and an email with the subject "Reminder: follow up with Jane Doe today".

**FEAT-04.SPEC-003-AC-02:** Given Sarah receives a single-follow-up reminder, when she taps "View contact", then she lands on Jane Doe's Contact Edit screen (FEAT-01.SPEC-002).

**FEAT-04.SPEC-003-AC-03:** Given Sarah has set reminder channels to "In-app only", when a follow-up becomes due, then she receives the in-app reminder and no email is sent.

**FEAT-04.SPEC-003-AC-04:** Given Sarah has turned follow-up reminders off, when a follow-up becomes due, then no reminder is delivered on any channel and the follow-up still appears in the Due Today list.

**FEAT-04.SPEC-003-AC-05:** Given Sarah has three follow-ups due today, when the Reminder Scheduler fires, then she receives one in-app reminder titled "3 follow-ups due today" and one email listing all three -- not three separate reminders.

**FEAT-04.SPEC-003-AC-06:** Given a follow-up becomes due at 22:30 inside Sarah's 21:00-08:00 quiet hours, when quiet hours end at 08:00, then the held reminder is delivered at 08:00 and not before.

**FEAT-04.SPEC-003-AC-07:** Given Sarah completes a follow-up before its reminder is delivered, when the delivery moment arrives, then no reminder is delivered on any channel.

**Coverage Summary Table:**

| Area | Items Covered | Total |
|------|--------------|-------|
| Channels | 2 (in-app, email) | 2 |
| Trigger Paths | 1 | 1 |
| Preference States | 4 (default, in-app only, off, quiet hours) | 4 |
| Delivery Rules | 4 (batching, deduplication, retry, expiry) | 4 |
| Edge Cases | 5 | 5 |
END EXAMPLE -->
