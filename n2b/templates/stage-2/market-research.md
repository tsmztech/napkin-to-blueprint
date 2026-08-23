---
document_type: market-research
produced_by: {market-researcher}
variant: {draft | final}
status: {draft | final}
created: {YYYY-MM-DD}
---

# Market Research

<!-- Rules for this document:
  - See pipeline-rules.md constraint "brief-first": read BRIEF.md before any other input
  - See pipeline-rules.md constraint "grounded-roles": multi-user/role patterns observed in the market (team plans, admin consoles, shared workspaces) are reported descriptively with evidence — they inform the Stage 2 persona set; never present a role pattern as a requirement for this product
  - See pipeline-rules.md constraint "functional-language-only": competitive profiles focus on features, user sentiment, pricing/packaging, and market context — never technical implementation (no tech stacks, no APIs, no architectures; how competitors are built is Stage 4's territory)
  - See pipeline-rules.md constraint "output-completeness": every section filled, minimum 3 competitive product profiles required, no TBD entries
  - This document is produced by the Market Researcher, not the Product Visionary — set produced_by: market-researcher and variant: final directly
  - Research is evidence-based: every claim references a source type (e.g., App Store reviews, Reddit thread, blog post, product listing)
  - Each finding carries a confidence level: HIGH (multiple independent sources), MEDIUM (single source or indirect inference), LOW (anecdotal or single data point)
  - Pricing & packaging and market-context findings follow the same evidence discipline: published price points cite the vendor pricing page with the date checked; market-size claims require reputable secondary sources; when no reliable sizing evidence exists, record that finding plainly rather than estimating
  - The Pricing & Packaging Landscape covers every profiled competitor (record "pricing unpublished" where that is the finding); the Feature Comparison Matrix includes every profiled competitor and every Common Feature from the Feature Landscape
  - The document is descriptive, not prescriptive — it presents findings, not recommendations (the Synthesizer makes recommendations); this applies to pricing and market context too: report what competitors charge, never what this product should charge
  - Competitive profiles must cover at minimum 3 competing or analogous products; add more if the market is crowded
  - User sentiment must be aggregated from multiple source types, not a single review
  - [Final only] Mark changes made during synthesis: [MODIFIED] (same pattern as other documents for Synthesizer consistency)
  - Before writing, update all frontmatter fields: produced_by (market-researcher), variant (final), status (final), created (today's date)
-->

## Research Summary

{High-level overview of research findings: how many competing products were analyzed, the general market landscape, and the 2-3 most significant takeaways. 3-5 sentences.}

<!-- EXAMPLE (meal tracker):
Research covered 5 competing and analogous products in the meal tracking and food logging space. The market is well-established with several dominant players, but user sentiment reveals consistent complaints about friction, data overload, and rigid calorie-counting frameworks. A clear gap exists for a product focused on pattern visibility over compliance enforcement. Key takeaways: logging speed is the primary attrition driver; users want insight, not prescription; the social/community features common in this space receive mixed reception with privacy-minded users.
END EXAMPLE -->

## Competitive Product Profiles

{For each major competing or analogous product. Minimum 3 profiles. Add more sections as needed by duplicating the pattern below.}

### {Product Name}

**Description:** {Brief description of what this product is and who it primarily serves.}

**Key Features:**
- {Feature 1}
- {Feature 2}
- {Feature 3}

**Strengths:**
- {What users praise} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Weaknesses:**
- {What users complain about} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Relevance:** {Why this product is relevant to compare against the product being built. What can be learned from it?}

**Confidence:** {Overall confidence level for this profile — HIGH if based on multiple independent sources, MEDIUM if based on one source type, LOW if anecdotal.}

<!-- EXAMPLE (meal tracker):

### MyFitnessPal

**Description:** A comprehensive nutrition and calorie tracking app with a large food database and exercise logging. Serves users actively managing weight or fitness goals.

**Key Features:**
- Barcode scanning for packaged foods
- Calorie and macro targets with daily progress bars
- Exercise logging with calorie adjustment
- Social features including friend connections and leaderboards
- Long-term data history and progress charts

**Strengths:**
- Largest food database of any competing product — covers most packaged foods accurately [source: App Store reviews, confidence: HIGH]
- Habit of use is strong among users who commit; very comprehensive for serious trackers [source: Reddit r/loseit, confidence: HIGH]

**Weaknesses:**
- Overwhelming for casual users — the interface prioritizes data completeness over simplicity [source: App Store reviews, confidence: HIGH]
- Calorie target focus creates a compliance mindset; users who miss targets feel guilty rather than informed [source: user blog posts, confidence: MEDIUM]
- Barcode scanning frequently fails on restaurant and homemade meals, creating logging friction for the most common meal types [source: Reddit r/nutrition, confidence: HIGH]
- Social features are unused by most users and add interface clutter [source: App Store reviews, confidence: MEDIUM]

**Relevance:** The dominant player in the space — establishes baseline feature expectations and the primary usability anti-patterns to avoid.

**Confidence:** HIGH — based on App Store reviews, Reddit threads across multiple nutrition communities, and independent blog reviews.

END EXAMPLE -->

### {Product Name}

**Description:** {Brief description.}

**Key Features:**
- {Feature 1}
- {Feature 2}
- {Feature 3}

**Strengths:**
- {What users praise} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Weaknesses:**
- {What users complain about} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Relevance:** {Why this product is relevant.}

**Confidence:** {Overall confidence level.}

### {Product Name}

**Description:** {Brief description.}

**Key Features:**
- {Feature 1}
- {Feature 2}
- {Feature 3}

**Strengths:**
- {What users praise} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Weaknesses:**
- {What users complain about} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

**Relevance:** {Why this product is relevant.}

**Confidence:** {Overall confidence level.}

## Pricing & Packaging Landscape

{How competitors in this space monetize. One row per profiled competitor: pricing model (free, freemium, subscription, one-time purchase, per-seat, usage-based), free tier or trial terms, and paid tier structure with published price points. Published prices cite the vendor pricing page and the date checked; where pricing is unpublished ("contact sales"), record that fact. Descriptive only — what the market charges, never what this product should charge.}

| Product | Pricing Model | Free Tier / Trial | Paid Tiers | Source |
|---|---|---|---|---|
| {Product Name} | {model} | {free plan limits or trial terms} | {tier names and price points} | {vendor pricing page, checked YYYY-MM-DD} |

### Monetization Patterns

{Cross-competitor patterns in how this space monetizes, plus user sentiment about pricing where found. Evidence-based, confidence-tagged.}

- {Pattern or sentiment finding} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

<!-- EXAMPLE (meal tracker):

| Product | Pricing Model | Free Tier / Trial | Paid Tiers | Source |
|---|---|---|---|---|
| MyFitnessPal | Freemium subscription | Free plan with ads; core logging included | Premium $19.99/mo or $79.99/yr | vendor pricing page, checked 2026-07-01 |
| Lose It! | Freemium subscription | Free plan with basic logging | Premium $39.99/yr | vendor pricing page, checked 2026-07-01 |
| Cronometer | Freemium subscription | Free plan, full nutrient tracking | Gold $8.99/mo or $49.99/yr | vendor pricing page, checked 2026-07-01 |

### Monetization Patterns

- Freemium subscription is the dominant model in this space — every major competitor offers a functional free tier and gates insights/ad removal behind an annual subscription [source: vendor pricing pages across 3 products, confidence: HIGH]
- Users frequently complain that features formerly free were moved behind the paywall — a recurring trust complaint in the space [source: App Store reviews, Reddit r/loseit, confidence: HIGH]
- Annual-plan discounting is steep (50-65% vs monthly), reported by users as the expected way to buy [source: vendor pricing pages, user blog posts, confidence: MEDIUM]
END EXAMPLE -->

## Market Context

{Size and growth signals for this space, reported only where reputable secondary sources exist — industry reports, credible analyst coverage, editorial and technology journalism. Every signal is sourced and confidence-tagged, same discipline as all other findings. Never compute or extrapolate a market size. If no reputable sizing evidence is found, state that plainly — absence of evidence is a valid finding.}

- {Size or growth signal} [source: {source name/type}, confidence: {HIGH | MEDIUM | LOW}]

<!-- EXAMPLE (meal tracker):
- Multiple industry reports place the global nutrition/diet-app market in the low single-digit billions (USD) with double-digit annual growth projections through the decade [source: editorial coverage citing two industry research firms, confidence: MEDIUM]
- The dominant player publicly reports a nine-figure registered-user base, indicating a mass-market rather than niche category [source: technology journalism, confidence: MEDIUM]
- App store category rankings show sustained top-10 Health & Fitness placement for the three leading products, signaling durable consumer demand [source: app store charts, confidence: MEDIUM]
END EXAMPLE -->

<!-- If no reliable sizing evidence exists, this section reads, e.g.:
- No reputable market-size estimates were found for this specific niche after searching industry reports and editorial coverage; the closest adjacent category with published sizing is {category} [source: search across industry-report and editorial platforms, confidence: LOW]
-->

## User Sentiment Analysis

{Aggregated findings from user reviews, blogs, forums, and social media. This section synthesizes sentiment across all products researched — not per-product.}

### Common Praise Themes

{What users consistently praise across competing products in this space. Evidence-based, sourced by type.}

- {Praise theme} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

<!-- EXAMPLE (meal tracker):
- Quick logging through search or barcode scan is universally praised when it works smoothly [source: App Store reviews across 3 apps, confidence: HIGH]
- Products that show simple daily summaries (not complex charts) get positive responses from casual users [source: Reddit r/loseit, confidence: MEDIUM]
- Users appreciate when the app does not make them feel judged for bad days [source: user blog posts, confidence: MEDIUM]
END EXAMPLE -->

### Common Complaint Themes

{What users consistently complain about across competing products. Evidence-based, sourced by type.}

- {Complaint theme} [source: {source type}, confidence: {HIGH | MEDIUM | LOW}]

<!-- EXAMPLE (meal tracker):
- Too many required fields when logging — users want to log in 1-2 taps, not fill out a form [source: App Store reviews across multiple apps, confidence: HIGH]
- Barcode scanning fails on restaurant and homemade meals — the most common meal types for the target user [source: Reddit r/nutrition, App Store reviews, confidence: HIGH]
- Data overload: too many numbers, charts, and percentages for users who just want a general sense of how they ate [source: App Store reviews, confidence: HIGH]
- Punishing UX around missed days or unmet targets — streak systems and red indicators make users feel guilty rather than motivated [source: user blog posts, Reddit r/loseit, confidence: MEDIUM]
END EXAMPLE -->

### Unmet Needs

{Gaps that no existing product addresses well. What do users want that they are not currently getting? Evidence-based — every unmet need is supported by evidence above, not assumed.}

- {Unmet need} [source: {source type, derived from: specific finding above}, confidence: {HIGH | MEDIUM | LOW}]

<!-- EXAMPLE (meal tracker):
- A forgiving logging experience that treats missed days as normal rather than failures — no product currently handles gaps without some form of streak penalty or visual indicator [source: derived from complaint themes, Reddit r/loseit, confidence: MEDIUM]
- Pattern insight without calorie arithmetic — users want to know "did I eat well this week?" not "how many calories under my target was I?" — no current product separates pattern visibility from compliance enforcement cleanly [source: derived from complaint themes and App Store reviews, confidence: MEDIUM]
END EXAMPLE -->

## Feature Landscape

{A consolidated view of which features are common across competitors, which are differentiators, and which are absent from the market.}

### Common Features (found in most competing products)

{Features that users have come to expect from products in this space.}

- {Feature} — {brief note on how widespread it is}

<!-- EXAMPLE (meal tracker):
- Calorie tracking with daily target — present in every major product; users expect it even if they do not want it
- Barcode scanning — common but with widely-reported reliability problems on non-packaged foods
- Exercise logging — common in comprehensive apps; less common in simpler ones
- Food database search — universal; quality varies significantly
END EXAMPLE -->

### Differentiators (found in some products, not all)

{Features that some products offer that others do not. Potential areas of distinction.}

- {Feature} — {which product(s) have it and how users respond}

<!-- EXAMPLE (meal tracker):
- Non-compliance framing (presenting data without targets or guilt indicators) — rare; most products use target-based frameworks
- Simple visual summaries instead of data tables — present in 1-2 apps; consistently well-received in reviews
- Meal photo logging — present in a few apps; valued by users who find text entry cumbersome
END EXAMPLE -->

### Absent Features (not well-served by any existing product)

{What the market is missing that users clearly want.}

- {Missing feature/approach} — {evidence that users want this}

<!-- EXAMPLE (meal tracker):
- Low-friction logging without mandatory fields or barcode scanning — users consistently describe wanting to "just write down what I ate" and existing products add too much structure around that
- Pattern focus without compliance enforcement — users want "how did I eat this week?" answered simply, without seeing how far they are from a numerical target
END EXAMPLE -->

## Feature Comparison Matrix

{One table: rows = every Common Feature from the Feature Landscape plus notable differentiators; columns = every profiled competitor. Cell values: `Yes`, `No`, or `Partial ({one-phrase qualifier})`. This matrix makes the competitive cross-reference mechanical for the Synthesizer's completeness audit and scannable for an investor. It summarizes evidence already presented above — it introduces no new claims.}

| Feature | {Product 1} | {Product 2} | {Product 3} |
|---|---|---|---|
| {Feature} | {Yes / No / Partial (qualifier)} | {Yes / No / Partial (qualifier)} | {Yes / No / Partial (qualifier)} |

<!-- EXAMPLE (meal tracker):

| Feature | MyFitnessPal | Lose It! | Cronometer |
|---|---|---|---|
| Calorie tracking with daily target | Yes | Yes | Yes |
| Barcode scanning | Yes | Yes | Partial (smaller database) |
| Food database search | Yes | Yes | Yes |
| Exercise logging | Yes | Yes | Partial (manual entry only) |
| Simple visual summaries | No | Partial (weekly view) | No |
| Meal photo logging | No | Yes | No |
| Non-compliance framing | No | No | No |
END EXAMPLE -->

## Insights for This Product

{Specific, actionable takeaways from the research that are directly relevant to the product being built. Each insight is traceable to the evidence in the sections above. This section is descriptive — it presents what the research means for this product, not recommendations (those are the Synthesizer's job).}

- **{Insight name}:** {Insight statement. What does the research reveal that is relevant? Cite the specific finding it derives from.}

<!-- EXAMPLE (meal tracker):
- **Logging friction is the primary attrition driver:** The most consistent finding across competitor research is that users abandon products when logging takes too long or requires too much information. Any feature that slows down the primary logging flow is a retention risk. [Derived from: Complaint Themes — "too many required fields," App Store reviews]
- **Data overload is a real and documented problem:** Users in this space have a documented aversion to being shown too many numbers. Products that show comprehensive data attract power users but lose casual trackers. [Derived from: Complaint Themes — "data overload," App Store reviews]
- **The compliance mindset is widely disliked:** Framing logging around targets (calories, macros) creates a punishing dynamic for users who miss. An insight-first framing (how did I eat?) rather than a compliance framing (did I hit my target?) addresses a documented user complaint. [Derived from: Complaint Themes — "punishing UX," Reddit r/loseit]
- **Pattern insight without arithmetic is an unmet need:** No current product cleanly separates "eating pattern visibility" from "calorie counting." The unmet need is real and evidenced. [Derived from: Unmet Needs section, derived from complaint themes]
- **Freemium-with-annual-subscription is the entrenched monetization pattern:** Every major competitor monetizes via a free tier plus an annual subscription, and paywall-migration of formerly free features is a documented trust complaint in the space. [Derived from: Pricing & Packaging Landscape — Monetization Patterns]
END EXAMPLE -->
