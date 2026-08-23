---
document_type: product-features
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# Product Features

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": every role or user type referenced (especially in Access fields) must trace to BRIEF.md or user-persona.md — never invent roles
  - See pipeline-rules.md constraint "functional-language-only": no tech details (frameworks, databases, APIs); category-level capability needs (e.g., "payment processing") are allowed
  - See pipeline-rules.md constraint "output-completeness": no TBD sections, no empty entries
  - Group features by priority tier: Core first, then Important, then Nice-to-Have
  - Within each tier, list features in logical usage order (features the user encounters first appear first)
  - Every Core and Important feature must appear in at least one user journey in user-journeys.md
  - Each feature entry must be self-contained (readable without the others)
  - Rationale must cite either the brief or a specific market research finding — never left unjustified
  - [Final only] Mark research-driven changes inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
  - Each feature entry must include an ID field (FEAT-XX) as the first field after the heading — see id-prefixes.md for format
  - Each feature entry must include a Phase field (MVP | v1 | Later) — release phasing, orthogonal to Priority; every discovered feature is documented and phased, never trimmed
  - Each feature entry must include a Type field: User-Facing | Platform | Lifecycle
  - Each feature entry must include Connected Entities listing domain objects this feature creates, reads, updates, or manages (with CRUD annotation)
  - Each feature entry must include Key Capabilities as a bullet list of distinct user actions (each capability = one thing the user can do)
  - Each feature entry must include all eight Functional Depth fields, in this exact order: Primary Flows & Alternates, States, Validation & Limits, Access, Communications, Data Notes, Interactions, Signals — where a field genuinely does not apply, write "N/A — {one-sentence reason}", never leave it blank
  - The States field must cover empty, loading, error, and offline-degraded expectations
  - The Access field states which persona/role can see or do this and what an unauthorized user experiences — drawn from the Access Matrix in user-persona.md
  - The Feature Interaction Summary is one lightweight table (| Feature | Depends On |) — do not replicate Stage 3's full dependency map here
  - The Domain Entity Inventory must list every domain object the product manages, derived from the entity-driven decomposition
  - ID format follows id-prefixes.md: sequential zero-padded (FEAT-01, FEAT-02), assigned by Visionary at creation time; on re-runs, IDs of surviving features are reused (see id-prefixes.md, ID Stability Across Re-runs)
-->

## Summary

{Total feature count and breakdown by priority tier, by phase, and by type. Entity count.
2-3 sentences stating how many features are Core, Important, and Nice-to-Have,
how many land in MVP, v1, and Later, how many are User-Facing, Platform, and
Lifecycle, and how many domain entities the product manages.}

<!-- EXAMPLE (meal tracker brief):
This product includes 8 features: 3 Core, 3 Important, 2 Nice-to-Have.
By phase: 5 MVP, 2 v1, 1 Later. By type: 6 User-Facing, 1 Platform, 1 Lifecycle.
The product manages 4 domain entities. Core features cover the daily logging loop;
Important features support habit review and personalization; Nice-to-Have features
provide motivation and social context.
END EXAMPLE -->

## Domain Entity Inventory

{A summary of the core domain objects this product manages, derived from the
feature decomposition process. Each entity is listed with its lifecycle and the
features that interact with it.}

### Entity: {Entity Name}
- **Description:** {What this entity represents in the product}
- **Lifecycle:** {States the entity moves through, e.g., "Created -> Active -> Archived" or "N/A -- static record"}
- **Created by:** {Feature name (FEAT-XX)}
- **Managed by:** {Feature name(s) (FEAT-XX)}
- **Referenced by:** {Feature name(s) that read but don't modify this entity (FEAT-XX)}

<!-- EXAMPLE (meal tracker):
### Entity: Meal Entry
- **Description:** A single recorded instance of what the user ate -- captures food name,
  approximate quantity, meal type, and timestamp
- **Lifecycle:** Created -> Active -> (optionally) Deleted
- **Created by:** Meal Logging (FEAT-01)
- **Managed by:** Meal Logging (FEAT-01)
- **Referenced by:** Weekly Progress Summary (FEAT-04), Streak and Habit Tracking (FEAT-07)

### Entity: Food Item
- **Description:** A named food entry in the product's searchable database -- used during
  meal logging for quick selection
- **Lifecycle:** N/A -- static record (user can add custom entries)
- **Created by:** Meal Logging (FEAT-01) (custom entries)
- **Managed by:** N/A (database-provided items are read-only)
- **Referenced by:** Meal Logging (FEAT-01)
END EXAMPLE -->

## Core Features

### {Feature Name}

**ID:** {FEAT-XX}

**Description:** {What this feature does from the user's perspective. What can the user accomplish with this feature? What problem does it solve for them? Write in plain language, no technical details.}

**Priority:** Core

**Phase:** {MVP | v1 | Later}

**Type:** User-Facing | Platform | Lifecycle

**Rationale:** {Why this feature is included. Reference the specific brief goal, user need, or market research finding that justifies it. If derived from research rather than the brief, note explicitly. Justify the phase assignment when it is not obvious.}

**Connected Entities:** {List of domain entities this feature creates, reads, updates, or manages, with CRUD annotation}

**Key Capabilities:**
- {Capability 1} -- {brief description}
- {Capability 2} -- {brief description}

**Primary Flows & Alternates:**
- {Happy path — the main flow in 1-2 sentences}
- {Named alternate or edge behavior 1}
- {Named alternate or edge behavior 2}

**States:** {Empty / loading / error / offline-degraded expectations, one line each — or "N/A — {reason}" per state where genuinely inapplicable}

**Validation & Limits:** {Input constraints, boundary values, quantity limits}

**Access:** {Which persona/role can see/do this (from the Access Matrix in user-persona.md), and what an unauthorized user experiences}

**Communications:** {Notifications, emails, or other messages this feature triggers — or "N/A — {reason}"}

**Data Notes:** {What data is captured vs displayed vs derived, and its source}

**Interactions:** {Other FEAT-IDs this feature affects or depends on — or "N/A — {reason}"}

**Signals:** {The analytics events this feature should emit}

<!-- EXAMPLE (meal tracker):
### Meal Logging

**ID:** FEAT-01

**Description:** The user can record what they ate, when they ate it, and how much, using a simple, low-friction entry flow. The user selects from a searchable food list or types a custom entry. Logging a typical meal takes under 30 seconds.

**Priority:** Core

**Phase:** MVP

**Type:** User-Facing

**Rationale:** Directly addresses the brief's primary goal: "help users understand their eating patterns without obsessive tracking." Without logging, there is no data to analyze and the product has no function. MVP phase: the product cannot launch without its core loop.

**Connected Entities:** Meal Entry (create, update), Food Item (read -- for search/selection; create -- for custom entries)

**Key Capabilities:**
- Log a meal by name -- User searches the food list or types a custom entry
- Record meal timing -- User specifies when they ate (defaults to now)
- Quick-add from recent -- User can re-log frequently eaten meals in one tap
- Edit a logged meal -- User can correct mistakes after saving

**Primary Flows & Alternates:**
- Happy path: open app -> search or quick-add from recent -> confirm details -> entry saved and visible in the day log, all in under 30 seconds
- Food not found: user types a custom free-text entry, which is saved and becomes searchable for future logging
- Correction: user edits or deletes a logged meal after saving, including changing its date/time for entries logged after the fact

**States:** Empty: a day with no logs shows a friendly prompt to log the first meal, never a bare screen. Loading: recent and frequent entries render instantly; food search shows an inline searching indicator. Error: a failed save preserves the entered data and offers a one-tap retry. Offline-degraded: the user can compose an entry offline; it is held locally and saved when connectivity returns.

**Validation & Limits:** Meal name required (1-100 characters); quantity optional but must be a positive value when given; timestamp cannot be in the future; logging an identical meal twice within 5 minutes prompts a duplicate confirmation.

**Access:** Alex (the sole user type per the Access Matrix in user-persona.md) has full access to their own entries. Entries are private — no other person can view or modify them.

**Communications:** Optional once-daily logging reminder notification — off by default, user-enabled in settings.

**Data Notes:** Captured: food name, approximate quantity, meal type, timestamp. Displayed: the day's log list. Derived: none at logging time — aggregation happens in Weekly Progress Summary (FEAT-04). Source: user input plus the food database (read).

**Interactions:** Depends on Food Search (FEAT-02) for name lookup; feeds Weekly Progress Summary (FEAT-04) and Streak and Habit Tracking (FEAT-07), which read the entries created here.

**Signals:** meal_logged (with entry method: search / recent / custom), meal_edited, meal_deleted, reminder_enabled.
END EXAMPLE -->

## Important Features

### {Feature Name}

**ID:** {FEAT-XX}

**Description:** {What this feature does from the user's perspective. What can the user accomplish?}

**Priority:** Important

**Phase:** {MVP | v1 | Later}

**Type:** User-Facing | Platform | Lifecycle

**Rationale:** {Why this feature is included and why it is Important rather than Core. What does it add to the experience? What brief goal or research finding informs this priority? Justify the phase assignment when it is not obvious.}

**Connected Entities:** {List of domain entities this feature creates, reads, updates, or manages, with CRUD annotation}

**Key Capabilities:**
- {Capability 1} -- {brief description}
- {Capability 2} -- {brief description}

**Primary Flows & Alternates:**
- {Happy path — the main flow in 1-2 sentences}
- {Named alternate or edge behavior}

**States:** {Empty / loading / error / offline-degraded expectations, one line each — or "N/A — {reason}" per state where genuinely inapplicable}

**Validation & Limits:** {Input constraints, boundary values, quantity limits}

**Access:** {Which persona/role can see/do this (from the Access Matrix in user-persona.md), and what an unauthorized user experiences}

**Communications:** {Notifications, emails, or other messages this feature triggers — or "N/A — {reason}"}

**Data Notes:** {What data is captured vs displayed vs derived, and its source}

**Interactions:** {Other FEAT-IDs this feature affects or depends on — or "N/A — {reason}"}

**Signals:** {The analytics events this feature should emit}

<!-- EXAMPLE (meal tracker):
### Weekly Progress Summary

**ID:** FEAT-04

**Description:** The user can view a summary of their eating patterns over the past 7 days -- which meals they logged, nutritional trends, and how their actual intake compared to their stated goals. The summary is visual and scannable, not a data table.

**Priority:** Important

**Phase:** v1

**Type:** User-Facing

**Rationale:** The brief states users want to "understand eating patterns" over time, not just log in the moment. Weekly summary closes the feedback loop. Ranked Important rather than Core because the product still functions for day-to-day use without it. Phased to v1: the logging habit must exist before a week of data is worth summarizing.

**Connected Entities:** Meal Entry (read), Dietary Goal (read)

**Key Capabilities:**
- View 7-day meal history -- User sees all logged meals for the past week at a glance
- See nutritional trends -- User sees visual patterns in their eating data
- Compare to goals -- User sees how actual intake compares to their stated goals

**Primary Flows & Alternates:**
- Happy path: open the weekly view -> scan the visual summary of the past 7 days -> identify a pattern -> close, in under 2 minutes
- Partial week: days without logs appear as visible gaps without judgment; patterns are drawn from the logged days only
- History browsing: the user navigates back to earlier weeks one week at a time

**States:** Empty: fewer than 2 logged days in the window shows an encouraging explanation that more data is needed, with an example of what the summary will look like. Loading: the summary renders with a lightweight progress indicator when aggregating long histories. Error: if the summary cannot load, the user sees the last successfully computed week with a retry option. Offline-degraded: the most recently viewed week remains available read-only.

**Validation & Limits:** Summary window is fixed at 7 days; history navigation is limited only by the account's log history; no user input is captured in this view.

**Access:** Alex (the sole user type per the Access Matrix in user-persona.md) sees only their own summary. There is no shared or comparative view of anyone else's data.

**Communications:** N/A — the summary is self-initiated; this feature sends no notifications.

**Data Notes:** Displayed: daily log completeness and meal history. Derived: weekly aggregates and trend indicators computed from Meal Entry data; goal comparison derived against Dietary Goal. Source: entries created by Meal Logging (FEAT-01) and goals maintained by Goal Setting (FEAT-05).

**Interactions:** Depends on Meal Logging (FEAT-01) for entry data and Goal Setting (FEAT-05) for goal comparison.

**Signals:** weekly_summary_viewed, week_navigated, summary_empty_state_shown.
END EXAMPLE -->

## Nice-to-Have Features

### {Feature Name}

**ID:** {FEAT-XX}

**Description:** {What this feature does from the user's perspective.}

**Priority:** Nice-to-Have

**Phase:** {MVP | v1 | Later}

**Type:** User-Facing | Platform | Lifecycle

**Rationale:** {Why this feature adds value but is lower priority. What brief signal or research finding surfaces it? Why is it not Core or Important? Justify the phase assignment when it is not obvious.}

**Connected Entities:** {List of domain entities this feature creates, reads, updates, or manages, with CRUD annotation}

**Key Capabilities:**
- {Capability 1} -- {brief description}
- {Capability 2} -- {brief description}

**Primary Flows & Alternates:**
- {Happy path — the main flow in 1-2 sentences}
- {Named alternate or edge behavior}

**States:** {Empty / loading / error / offline-degraded expectations, one line each — or "N/A — {reason}" per state where genuinely inapplicable}

**Validation & Limits:** {Input constraints, boundary values, quantity limits}

**Access:** {Which persona/role can see/do this (from the Access Matrix in user-persona.md), and what an unauthorized user experiences}

**Communications:** {Notifications, emails, or other messages this feature triggers — or "N/A — {reason}"}

**Data Notes:** {What data is captured vs displayed vs derived, and its source}

**Interactions:** {Other FEAT-IDs this feature affects or depends on — or "N/A — {reason}"}

**Signals:** {The analytics events this feature should emit}

<!-- EXAMPLE (meal tracker):
### Streak and Habit Tracking

**ID:** FEAT-07

**Description:** The user can see how many consecutive days they have logged meals and receive a brief acknowledgment when they maintain their streak. No gamification mechanics -- just a simple counter and a positive note.

**Priority:** Nice-to-Have

**Phase:** Later

**Type:** User-Facing

**Rationale:** Market research shows users respond positively to habit reinforcement in meal tracking apps (source: App Store review sentiment). Nice-to-Have because the core value -- pattern understanding -- does not depend on streaks. Phased to Later: it can be added without restructuring any other feature.

**Connected Entities:** Meal Entry (read -- checks daily log existence)

**Key Capabilities:**
- View current streak -- User sees consecutive days with at least one logged meal
- Streak acknowledgment -- User receives a brief positive note when maintaining their streak

**Primary Flows & Alternates:**
- Happy path: the streak counter appears alongside the day log; on maintaining the streak, the user sees a brief positive note
- Streak lapse: after a missed day, the counter quietly resets — no "streak broken" warning, no guilt messaging, consistent with the brief's forgiving tone

**States:** Empty: the counter stays hidden until the user has logged on 2 consecutive days. Loading: N/A — the streak renders together with the day log and has no separate loading state. Error: if the streak cannot be computed, it is hidden rather than shown incorrectly. Offline-degraded: the last known streak value is shown.

**Validation & Limits:** A day counts toward the streak when it has at least one logged meal; timezone changes and travel do not break an otherwise continuous streak.

**Access:** Alex (the sole user type per the Access Matrix in user-persona.md) sees only their own streak; it is never shared or published.

**Communications:** N/A — acknowledgment is in-app only; this feature sends no push or email messages.

**Data Notes:** Derived: consecutive-day count computed from Meal Entry existence per day; no new data is captured. Source: entries created by Meal Logging (FEAT-01).

**Interactions:** Depends on Meal Logging (FEAT-01) — reads daily log existence.

**Signals:** streak_viewed, streak_milestone_reached.
END EXAMPLE -->

## Feature Interaction Summary

{One lightweight table mapping each feature to the features it depends on or affects.
Every FEAT-ID appears as a row; "None" where a feature stands alone. This is a
discovery-stage summary — Stage 3 owns the full dependency map.}

| Feature | Depends On |
|---------|------------|
| {FEAT-XX {Feature Name}} | {FEAT-XX, FEAT-XX — or "None"} |

<!-- EXAMPLE (meal tracker):
| Feature | Depends On |
|---------|------------|
| FEAT-01 Meal Logging | FEAT-02 (food name lookup) |
| FEAT-04 Weekly Progress Summary | FEAT-01 (meal data), FEAT-05 (goal comparison) |
| FEAT-07 Streak and Habit Tracking | FEAT-01 (daily log existence) |
END EXAMPLE -->
