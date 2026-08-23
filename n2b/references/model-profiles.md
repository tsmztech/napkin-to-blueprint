# Model Profiles Reference

This document is the model profile reference for n2b's agent pipeline. Workflows @-include this file to resolve which model to use when spawning each agent. The resolution is done inline by the workflow — no runtime config tool needed.

---

## Profile Definitions

| Profile | Philosophy | Cost | Speed |
|---|---|---|---|
| **quality** | Strongest models everywhere — Mythos-class (Fable) on the synthesis-critical roles, Opus for the rest. | Highest | Slowest |
| **balanced** | Opus for planning/synthesis, Sonnet for execution/research. Smart where it matters, fast where it doesn't. | Medium | Medium |
| **budget** | Sonnet for producing and researching, Haiku only for extraction/verification roles. Minimize cost for exploratory/draft projects without letting a weak model own a load-bearing document. | Lowest | Fastest |

**Model names are tier aliases, not pinned IDs** (decided 2026-07-25, decision 88): `fable` / `opus` / `sonnet` / `haiku` resolve to the harness's current model of that tier via the Agent tool's `model` parameter, so the mapping never goes stale as model versions advance. If a resolved tier is unavailable in the user's harness (e.g. `fable` on plans without Mythos-class access), fall back one tier (`fable` → `opus`) and proceed — never fail a spawn over model availability.

---

## Per-Agent Model Mapping

| Agent Role | Quality | Balanced | Budget |
|---|---|---|---|
| **Visionary** (Stage 2) | opus | sonnet | sonnet |
| **Researcher** (Stage 2) | opus | sonnet | sonnet |
| **Synthesizer** (Stage 2) | fable | opus | sonnet |
| **Requirements Architect** (Stage 3) | fable | opus | sonnet |
| **Feature Analyst** (Stage 3) | opus | sonnet | sonnet |
| **Feature Spec Producer** (Stage 3) | opus | sonnet | sonnet |
| **Spec Quality Reviewer** (Stage 3) | opus | sonnet | haiku |
| **Cross-Reference Reconciler** (Stage 3) | fable | opus | sonnet |
| **Profile Analyst** (Stage 4) | opus | sonnet | haiku |
| **Technical Researcher** (Stage 4) | opus | sonnet | sonnet |
| **Feasibility Planner** (Stage 4) | fable | opus | sonnet |
| **Technical Architect** (Stage 4) | fable | opus | sonnet |
| **Schema Designer** (Stage 4) | opus | sonnet | sonnet |
| **Backlog Builder** (Stage 5 — export) | opus | sonnet | sonnet |
| **Export Formatter** (Stage 5 — all targets) | opus | sonnet | sonnet |
| **Export Fidelity Checker** (Stage 5 — export) | opus | sonnet | sonnet |

Tier rationale (decision 88, 2026-07-25):
- **Fable rows (Quality only):** the five synthesis-critical roles — Synthesizer, Requirements Architect, Cross-Reference Reconciler, Feasibility Planner, Technical Architect — are the "opus even on Balanced" rows: each one integrates everything upstream into a document every later stage depends on. On Quality they get the strongest available tier; everywhere Fable is unavailable they fall back to opus (see above).
- **No haiku on research or design roles (any profile):** the Stage 2 Researcher and Stage 4 Technical Researcher do live web research whose quality bounds everything downstream, and the Schema Designer produces the real-product database schema — a weak model there fabricates or thins the package's load-bearing documents. Budget keeps them at sonnet. Haiku remains only where the job is extraction or verification against existing text: Spec Quality Reviewer (a safety-net check, not a producer), Profile Analyst (extracts a technical profile from finished docs).
- **Stage 5:** rendering is transformation, not invention. Package indexing is a workflow-owned bash step, not an agent — MANIFEST.md is written only by workflows (C-04), so no model row exists for it. The Backlog Builder authors and runs a mechanical extraction script against the canonical files (code work — no haiku, which would risk parse and validation errors on the package's load-bearing structured artifact); it is spawned only for targets whose registry row needs backlog.json. The Export Formatter and Export Fidelity Checker are unchanged and fidelity-critical — a rendered package must match the canonical documents exactly — so they keep stronger models.

---

## Resolution Logic

```
Workflow reads .n2b/config.json → extracts model_profile
  → looks up agent role in the Per-Agent Model Mapping table above
  → passes resolved model to Agent tool's `model` parameter
```

- No runtime config access needed — the workflow has the table in its reference docs and resolves inline.
- If `.n2b/config.json` is missing, use default: `model_profile = "balanced"`.
- The `model_profile` field in config.json must match one of: `quality`, `balanced`, `budget`.
