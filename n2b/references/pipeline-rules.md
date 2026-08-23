# n2b Pipeline Rules

<!-- Agents: @-include this file at the start of every pipeline run.
     Read all four constraint blocks before producing any output.
     These rules apply to every output document you produce, without exception. -->

<!-- Runtime output directory structure (canonical reference for the Phase 8 orchestrator):
     The pipeline writes all output documents to:
       .n2b/features/              — final documents (post-synthesis)
       .n2b/features/drafts/       — draft documents (pre-synthesis)
     These directories are created at runtime by the orchestrator, not by this file.
     Template files install to .claude/n2b/templates/; pipeline-rules.md installs to
     .claude/n2b/references/. -->

<constraint name="brief-first">

## BRIEF.md First

**Rule:** Read `.n2b/BRIEF.md` before reading any other input file or beginning any output work. The brief is the founding document. All downstream decisions are anchored to it. Do not make assumptions about the product's purpose, target user, or scope before reading the brief — it defines all of these.

**Self-check:** Can you cite a specific section of BRIEF.md for each major product decision in your output? If not, re-read the brief before continuing.

</constraint>

<constraint name="grounded-roles">

## Grounded Roles

**Rule:** Model every user type, role, and permission level the product genuinely needs — no more, no fewer. A blueprint is not complete until it answers who can see and do what, and what someone without access experiences. If the product serves a single user type, say so plainly and keep every document in single-user language throughout. If the product genuinely involves multiple roles — owners, administrators, members, guests, reviewers, tiers of access — name each role and specify its entitlements wherever behavior differs by role.

**Traceability requirement (scan before finalizing output):** Every role, user type, permission level, or access tier in your output must trace to `.n2b/BRIEF.md` or the Stage 2 persona documents. A role without a source is invented, and an invented role corrupts every downstream document that inherits it:
- Never introduce a role, tier, or admin concept because comparable products usually have one.
- Never add multi-user vocabulary to a product whose definition describes a single user type.
- Never collapse genuinely distinct roles into one generic "user" to simplify a document — that hides behavior a downstream builder needs to know.

**Why the rule is shaped this way:** role and permission coverage is part of the completeness bar — who can see and do what, and what unauthorized users experience, are exactly the questions a downstream builder must never have to come back and ask. So role vocabulary is required wherever the product demands it. The danger is not the vocabulary; it is ungrounded roles. This rule therefore constrains the *source* of every role rather than the language: full role modeling in, invented roles out.

**Self-check:** List every role or user type named in your output. For each one, can you cite the BRIEF.md passage or Stage 2 persona document that establishes it? If yes, confirm its permissions are specified everywhere behavior differs by role — including what unauthorized users see. If no, remove it or rewrite the section around the roles the product definition actually supports.

</constraint>

<constraint name="functional-language-only">

## Functional Language Only

**Rule:** Stage 1–3 output documents describe what users can accomplish, not how it is implemented. No technical implementation details appear anywhere in Stage 1–3 output documents. Write as if explaining the product to a non-technical stakeholder who has never seen a codebase. Stage 4 is the technical track — it is where technologies are researched, named, compared, and chosen. Upstream documents state needs; Stage 4 answers them.

**Forbidden content in Stage 1–3 outputs (scan before finalizing output):**
- Framework names (React, Vue, Angular, Rails, Django, Laravel, Next.js, etc.)
- Database references (PostgreSQL, MongoDB, Redis, SQLite, MySQL, etc.)
- API details (REST, GraphQL, endpoints, JSON, XML, webhooks, etc.)
- Deployment targets and named providers (Vercel, AWS, Docker, Heroku, Railway, etc.) — user platform, hosting, and service preferences are first-class brief content: Stage 1 captures them in BRIEF.md, and Stage 4 consumes them as constraints when selecting and recommending the architecture. They are not repeated in Stage 2–3 output documents.
- Infrastructure terms (server, microservice, cache, CDN, container, API gateway, etc.)
- Programming languages used internally (Python, TypeScript, Go, Rust, etc.)

**Allowed — capability categories.** Upstream of Stage 4, documents may (and, where a feature depends on one, must) name the category of capability the product requires, in vendor-neutral functional terms:
- "payment processing" — not a named payment provider
- "transactional email" — not a named email service
- "AI text generation" — not a named model or AI provider
- "file storage" — not a named storage service

The category states what the product genuinely needs; Stage 4 decides how that need is met, on merit, with documented alternatives. Naming the category keeps feature documents complete about the product's real dependencies without crossing into implementation choices.

**Self-check:** Could a non-technical stakeholder read every sentence without needing engineering context? If a sentence requires knowing what a framework, database, or API is to make sense, rewrite it in functional terms describing what the user can do or see. Capability categories pass this test; vendor and product names do not.

</constraint>

<constraint name="output-completeness">

## Output Completeness

**Rule:** No output document may contain placeholder content, TBD markers, or incomplete sections. Every section must be filled with real, substantive content derived from the brief and research. If a section genuinely does not apply to this project, explicitly mark it N/A with a one-sentence rationale — do not leave it empty or marked for later.

**Forbidden markers (scan before finalizing output):**
- TBD, TODO, FIXME, placeholder, [content here], {content}, <!-- fill in -->
- "To be determined", "Not yet defined", "Will be added", "Coming soon"
- Empty sections — a heading followed immediately by the next heading with no content in between

**Self-check:** Read each section heading in your output. Is there substantive content under it — at least one complete sentence that delivers real information about this specific project? If a section truly does not apply, write: "N/A — [one sentence explaining why this section does not apply to this project]."

</constraint>
