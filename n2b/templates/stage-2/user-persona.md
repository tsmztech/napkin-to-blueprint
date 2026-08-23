---
document_type: user-persona
produced_by: {product-visionary | product-synthesizer}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# User Personas

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": model every user type and role the product genuinely needs — no more, no fewer; every persona and role must trace to BRIEF.md or a market research finding
  - See pipeline-rules.md constraint "functional-language-only": no tech details — describe who these people are, not what platform or tools they use
  - See pipeline-rules.md constraint "output-completeness": every section filled with real content, no TBD markers
  - The Primary Persona must be directly traceable to the brief's stated target user — do not invent a persona the brief does not support
  - The Primary Persona is the default and automatic behavior: when the brief names one user type, the Primary Persona is the whole persona document — Secondary Personas contains exactly "N/A — single user type (confirmed in BRIEF.md)." and the product stays single-user in every downstream document
  - Each Secondary Persona requires the same provenance discipline as a new feature: an [INFERRED] or [RESEARCH-SUGGESTED] marker, a rationale, and a BRIEF.md or market-research.md citation — persona additions stay visible and justified, never assumed
  - Pain points should reference market research findings where applicable, not be assumed
  - The "What This User Does NOT Need" section is a statement about this specific persona's context and preferences — list things this particular user does not need or want, not features you chose to exclude
  - The Access Matrix has one row per role/persona and one column per major capability or feature group; cells state the access level (Full / View / Own-only / None); it is the source the per-feature Access field in product-features.md draws from
  - For a single-user product the Access Matrix has exactly one row
  - [Final only] Mark research-informed enrichments inline: [RESEARCH-INFORMED] or [MODIFIED]
  - Before writing, update all frontmatter fields: produced_by (your agent name), variant (draft or final), status, created (today's date)
-->

## Persona Set Summary

{How many personas this document defines, which is primary, and whether the product is single-user or multi-role — with a one-line source citation (BRIEF.md section or research finding). 1-3 sentences.}

<!-- EXAMPLE (meal tracker):
This product serves a single user type. One primary persona (Alex) defines the entire user model, confirmed by the brief's Target Users & Roles section. There are no secondary personas and no role differentiation.
END EXAMPLE -->

## Primary Persona

### Persona Name

{A representative fictional name for easy reference throughout all documents. One name only.}

<!-- EXAMPLE (meal tracker):
Alex
END EXAMPLE -->

### Description

{Who this user is. Their background, life context, and why they would seek out a product like this. 2-4 sentences. Derived directly from the brief's target user description, enriched with research insights about this user type where applicable.}

<!-- EXAMPLE (meal tracker):
Alex is a working adult in their late 20s to early 40s who has become aware of their eating habits and wants to make gradual, sustainable improvements. They are not a nutritionist and do not want to become one — they just want enough visibility into what they eat to make better choices. Alex has tried food diaries before but abandoned them because the friction of logging was higher than the benefit they felt.
END EXAMPLE -->

### Goals

{What this user is trying to achieve. What motivates them to use a product like this? What outcomes do they care about? Bullet list of 3-5 concrete goals.}

<!-- EXAMPLE (meal tracker):
- Understand eating patterns to make healthier choices without obsessive tracking
- Build a sustainable daily habit that does not feel like a chore
- Get a clear picture of nutritional trends over a week without manual spreadsheets
- Identify which meals are outliers versus which are consistent patterns
END EXAMPLE -->

### Pain Points

{What frustrations or problems does this user currently experience that this product addresses? Bullet list of 3-5 pain points. Reference specific market research findings where applicable, noting the source type.}

<!-- EXAMPLE (meal tracker):
- Current food logging apps require too many taps and too much detail — users give up after a few days [source: App Store reviews, confidence: HIGH]
- Barcode scanning sounds convenient but fails constantly on homemade or restaurant meals, creating friction rather than reducing it [source: Reddit r/nutrition, confidence: HIGH]
- Existing apps overwhelm with nutritional data (micronutrients, percentages, targets) when the user just wants a simple picture of whether they ate well today [source: user reviews across multiple apps, confidence: MEDIUM]
- No current product distinguishes between "tracked everything" and "missed a day" in a forgiving, non-punishing way
END EXAMPLE -->

### Behavioral Context

{When, where, and how this user would interact with the product. Are they using it daily? Mobile or desktop? During specific moments? This is inferred from the product type, the brief, and research where available.}

<!-- EXAMPLE (meal tracker):
Alex logs meals on a mobile device, typically right after eating or during natural pauses in the day (end of lunch, before bed). Logging happens in short bursts — under a minute — not during extended planning sessions. Weekly progress review happens on Sunday evenings when thinking about the coming week. Alex is unlikely to interact with the app more than 2-3 times per day. The brief specifies mobile-first use.
END EXAMPLE -->

### What This User Does NOT Need

{Explicit callouts of capabilities, complexity, or features that would be wrong for this persona. This is not a list of excluded features — it is a statement about this specific user's context and preferences. Be specific about what this particular persona does not need or want, grounded in who they are.}

<!-- EXAMPLE (meal tracker):
- Detailed micronutrient breakdowns (Alex is not training for athletic performance or managing a medical condition)
- Social features, sharing, or community boards (Alex tracks for personal insight, not accountability to others)
- Integration with fitness wearables or step counting (out of scope for this product's focus)
- Household management or family sharing (the brief describes Alex tracking their own meals privately — no shared access)
- Prescription diet plans or calorie targets set by the app (Alex wants visibility, not instruction)
END EXAMPLE -->

## Secondary Personas

{Zero or more additional personas or roles the product genuinely needs, each as a ### heading with the same field set as the Primary Persona (may be lighter). Every secondary persona opens with a Provenance line: an [INFERRED] or [RESEARCH-SUGGESTED] marker, a rationale, and a citation to BRIEF.md or market-research.md. When the product serves a single user type, this section contains exactly: N/A — single user type (confirmed in BRIEF.md).}

### {Role / Persona Name}

**Provenance:** {[INFERRED] or [RESEARCH-SUGGESTED]} — {Rationale for why the product genuinely needs this role, with a BRIEF.md or market-research.md citation.}

**Name:** {Representative fictional name. One name only.}

**Description:** {Who this user is and why they interact with the product. 1-3 sentences.}

**Goals:** {2-4 concrete goals for this role.}

**Pain Points:** {2-4 pain points, research-cited where applicable.}

**Behavioral Context:** {When, where, and how this role interacts with the product.}

**What This User Does NOT Need:** {Capabilities that would be wrong for this specific role.}

<!-- EXAMPLE (meal tracker — single user type):
N/A — single user type (confirmed in BRIEF.md).
END EXAMPLE -->

<!-- EXAMPLE (a different, multi-role product — clinic appointment scheduling brief — showing the required provenance discipline:

### Practice Administrator

**Provenance:** [INFERRED] — The brief's Target Users & Roles section states that "clinic staff manage the weekly schedule" while patients book their own visits; managing the schedule is a distinct entitlement set from booking, so it requires a distinct role. (BRIEF.md, Target Users & Roles.)

**Name:** Priya

**Description:** Priya is the front-desk coordinator at a small clinic. She owns the weekly schedule: opening slots, handling reschedules, and keeping practitioner calendars accurate.

**Goals:** Keep the schedule full without double-bookings; handle reschedules in seconds; see the whole week at a glance.

**Pain Points:** Phone-based rescheduling interrupts her all day [source: G2 reviews of scheduling tools, confidence: MEDIUM]; no-shows are invisible until the patient fails to arrive.

**Behavioral Context:** Desktop use at the front desk throughout the working day; bursts of activity at opening time and after cancellations.

**What This User Does NOT Need:** Patient-facing booking flows (she books on behalf of patients through the management view); clinical record access (scheduling only, per the brief's scope).

END EXAMPLE -->

## Access Matrix

{One row per role/persona, one column per major capability or feature group from product-features.md. Cells state the access level: Full / View / Own-only / None. For a single-user product this is one row. This matrix is the source of truth for the per-feature Access field in product-features.md.}

| Role / Persona | {Capability} | {Capability} | {Capability} |
|---|---|---|---|
| {Persona name} | {Full / View / Own-only / None} | {Full / View / Own-only / None} | {Full / View / Own-only / None} |

<!-- EXAMPLE (meal tracker — single user type):
| Role / Persona | Meal Logging | Progress Review | Goal Setting |
|---|---|---|---|
| Alex | Own-only | Own-only | Own-only |
END EXAMPLE -->

<!-- EXAMPLE (multi-role product — clinic appointment scheduling):
| Role / Persona | Appointment Booking | Schedule Management | Practitioner Calendars |
|---|---|---|---|
| Patient (Sam) | Own-only | None | None |
| Practice Administrator (Priya) | Full | Full | View |
END EXAMPLE -->
