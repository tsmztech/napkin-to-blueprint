---
document_type: technology-landscape
produced_by: technical-researcher
status: {draft | final}
stage: 4
created: {YYYY-MM-DD}
area_count: {N}
option_count: {N}
---

# Technology Landscape

<!-- Rules for this document:
  - This document presents option evidence, NOT decisions. No selection or ranking language anywhere — the architecture document's "Recommended" field vocabulary belongs to Pass D and must not appear here; row ordering implies no preference.
  - The Research Scope table is the authoritative active-area set for the whole stage: 11 always-active areas, every signal-activated area fired by the profile, and every §1.4 extension area triggered by the profile's Section 7 (registry + activation mapping + extension rule: tech-stack-decision-guide.md Section 1). Gate B checks its structure; the Technical Architect consumes it without re-deciding activation; Gate 4 counts its rows.
  - Decision-area names are byte-exact: registered areas use the registry name identically in the Research Scope table, the Section 2 headings, the decision guide's registry, and the architecture document; extension-area names are coined once in the Research Scope and used byte-identically everywhere downstream.
  - Every Research Scope row has a matching `### {Decision Area}` heading in Section 2 (Gate B structural check).
  - Every area's option table carries 3–5 option rows. Gate B hard-fails any area below 3.
  - Sources cells are never empty: URLs from live web research with access dates, or the literal fallback marker `knowledge-based — {reason}` when web tooling was unavailable or a query failed. Every fallback is also logged in Section 4. Never fabricate a URL.
  - Web-sourced pricing and capability claims carry an access date.
  - User-mandated platforms, vendors, or services quoted in the profile's Section 7 (Demand-Side Inputs) must appear among their area's options.
  - Before writing, update all frontmatter fields: document_type, produced_by, status, stage, created (today's date), area_count (Research Scope row count), option_count (total option rows across all Section 2 tables).
-->

## 1. Research Scope

{One row per active decision area — the 11 always-active areas, every signal-activated area whose activating signal is Present = Yes in the profile's Section 3, and every §1.4 extension area triggered by the profile's Section 7 (product-mandated external capabilities with no registered area). Always-active rows record "Always active"; activated rows record the firing signal name(s) with spec-ID provenance; extension rows record "Product-mandated — {verbatim Section 7 citation}".}

| Decision Area | Activated By |
|---|---|
| {Area name — byte-exact registry name, or a §1.4 extension-area name} | {Always active, or {signal name} ({provenance}), or Product-mandated — {citation}} |

<!-- EXAMPLE (meal tracker with reminders, photo upload, and list search):
| Decision Area | Activated By |
|---|---|
| Frontend Framework | Always active |
| Backend / API Layer | Always active |
| Database | Always active |
| ORM / Data Access | Always active |
| CSS / Styling | Always active |
| State Management | Always active |
| Build Tooling | Always active |
| Authentication & Identity | Always active |
| Hosting & Environments | Always active |
| CI/CD & Delivery | Always active |
| Observability & Operations | Always active |
| File & Object Storage | File upload (FEAT-04.SPEC-002) |
| Email & Messaging Delivery | Notifications (email/push/SMS) (FEAT-05.SPEC-001, FEAT-05.SPEC-003) |
| Background Jobs & Scheduling | Background processing (FEAT-05.SPEC-003) |
| Search | Search (FEAT-01.SPEC-002) |
END EXAMPLE -->

## 2. Decision Area Landscapes

{One `### {Decision Area}` block per Research Scope row, in Research Scope order. Each block opens with one line stating what the area must serve for this product, citing profile evidence, followed by the option table.}

### {Decision Area}

{One line: what this area must serve for this product, citing profile evidence.}

| Option | Type | Capability Fit | Pricing Model | Integration Effort | Maturity & Lock-in | Sources |
|---|---|---|---|---|---|---|
| {option name} | {managed service / library / framework / self-hosted / SaaS platform} | {fit against the cited profile evidence} | {pricing shape + indicative figures} | {effort level, SDK/API availability} | {maturity signals; exit and migration posture} | {URL (accessed YYYY-MM-DD), or knowledge-based — {reason}} |

<!-- EXAMPLE (Email & Messaging Delivery, activated by Notifications (email/push/SMS)):
### Email & Messaging Delivery

Serves FEAT-05's reminder and daily-summary notifications (FEAT-05.SPEC-001, FEAT-05.SPEC-003) — transactional email at per-user-account volume; template support reduces implementation effort.

| Option | Type | Capability Fit | Pricing Model | Integration Effort | Maturity & Lock-in | Sources |
|---|---|---|---|---|---|---|
| Resend | Managed email API | Transactional email with scheduling; strong template tooling for JavaScript stacks | Free tier ~3k emails/mo; paid from ~$20/mo | Low — REST API plus official Node SDK | Newer entrant, fast-growing; SMTP fallback limits lock-in | https://resend.com/pricing (accessed 2026-07-01) |
| Postmark | Managed email API | Transactional-first with a strong deliverability reputation; built-in template engine | From ~$15/mo for 10k emails | Low — REST API plus SDKs | Long-established; message-stream model is proprietary but content is exportable | https://postmarkapp.com/pricing (accessed 2026-07-01) |
| SendGrid (Twilio) | Managed email platform | Transactional plus marketing email; dynamic templates | Free tier 100 emails/day; paid from ~$20/mo | Low–medium — REST API plus SDKs; template DSL to learn | Very mature, high scale ceiling; coupled to a Twilio account | https://sendgrid.com/en-us/pricing (accessed 2026-07-01) |
| Amazon SES | Cloud email service | High-volume transactional email at commodity price; templates are minimal | ~$0.10 per 1,000 emails, pay-as-you-go | Medium — IAM/credential setup plus SDK | Extremely mature; ties delivery infrastructure to AWS | knowledge-based — pricing page fetch failed this run; figures from model knowledge |
END EXAMPLE -->

## 3. Cross-Area Compatibility Notes

{Pairing facts across the researched options: runtime and framework bindings, database dialect/driver support, SDK language coverage, service-to-platform couplings. Facts only — no steering toward a combination. Include the decision guide's compatibility sanity rules that apply to the options researched here.}

- {Pairing fact, naming the areas and options it connects.}

<!-- EXAMPLE:
- Prisma and Drizzle (ORM / Data Access options) are TypeScript-first — they pair with the Node-runtime candidates in Backend / API Layer, not with the Python candidate researched there.
- Every managed-Postgres candidate in Database is wire-compatible with standard Postgres drivers — all ORM / Data Access candidates researched support them.
- Resend and Postmark ship first-class Node SDKs matching the Backend / API Layer candidates; Amazon SES additionally requires IAM configuration, which overlaps the Hosting & Environments choice.
END EXAMPLE -->

## 4. Research Log

{Per researched area: method used, key queries and principal sources consulted, access dates — and every knowledge-based fallback with its reason. Every `knowledge-based — {reason}` marker in Section 2 must have a matching entry here.}

| Decision Area | Method | Queries & Key Sources | Access Date |
|---|---|---|---|
| {Area} | {web, or knowledge-based — {reason}} | {queries run; principal URLs consulted} | {YYYY-MM-DD, or —} |

<!-- EXAMPLE:
| Decision Area | Method | Queries & Key Sources | Access Date |
|---|---|---|---|
| Email & Messaging Delivery | web (one fallback) | "transactional email API pricing comparison"; resend.com/pricing; postmarkapp.com/pricing; sendgrid.com pricing page — Amazon SES pricing fetch failed, row marked knowledge-based | 2026-07-01 |
| Database | web | "managed Postgres providers pricing comparison"; neon.tech/pricing; supabase.com/pricing; aws.amazon.com/rds/postgresql/pricing | 2026-07-01 |
| Internationalization | knowledge-based — web tooling unavailable for this query set | i18n framework candidates from model knowledge; no URLs cited | — |
END EXAMPLE -->
