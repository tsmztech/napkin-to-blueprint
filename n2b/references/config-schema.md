# Config Schema Reference

This document is the single owner of the `.n2b/config.json` schema. Every field in the config file is registered here with its type, allowed values, default, writer, and readers. A field that is not registered here must not be written to config.json, and no workflow may invent a new field without adding its row to this document in the same change.

## File Locations

- **Template:** `n2b/templates/config.json` — source template; `created` carries the `{DATE}` placeholder until instantiation. Its `model_tiers` are the Claude Code aliases, because the template is the Claude Code default; other runtimes materialize their own tiers at write time.
- **Catalog:** `n2b/references/model-catalog.json` — the routing catalog (roles → tier per profile, provider presets → model IDs, per-runtime transport). Read-only for workflows; `model_tiers` is materialized *from* it.
- **Runtime:** `.n2b/config.json` — written by the Stage 1 workflow at Step 6.5 (preference collection) and rewritten by the `/n2b:config` command. It is ALWAYS written by Stage 1: if the user skips or cancels the preference questions, Stage 1 writes the defaults and moves on — and records the skip under `## Deviations` in `s1-init/STAGE.md` so a silent default is never mistaken for an answer. Only workflows write this file — never agents. Both writers use the same `n2b-model-materializer` script from `model-profiles.md`, so the file is never hand-typed.

## Fields

| Field | Type | Allowed values | Default | Writer | Readers |
|---|---|---|---|---|---|
| `model_profile` | string | `quality` \| `balanced` \| `budget` \| `inherit` | `balanced` on Claude Code · `inherit` on Codex, OpenCode, Cursor | Stage 1 Step 6.5 (asks on Claude Code, Codex, and OpenCode; writes `inherit` without asking on Cursor — the runtime is read from the installer's `n2b-runtime` stamp), `/n2b:config --profile` | Every workflow that spawns agents, via the `n2b-model-resolver` script in `n2b/references/model-profiles.md` (profile → role's tier from the catalog → `model_tiers[tier]` → transport). `inherit` means: pass no `model` parameter at all; the host's configured default model applies to every agent. |
| `model_provider` | string | `claude-aliases` \| `anthropic` \| `openai` \| `generic` \| `inherit` (the catalog's `providers` keys plus `inherit`) | the catalog's `runtimes.<id>.defaultProvider` — `claude-aliases` on Claude Code, `inherit` elsewhere | Stage 1 Step 6.5, `/n2b:config --provider` | `/n2b:config` (re-materialization and `--show`), `/n2b:status` (Models line), the resolver (legacy fallback only — see Missing/Invalid Handling). Forced to `inherit` whenever `model_profile` is `inherit`. |
| `model_tiers` | object | keys exactly `frontier`, `heavy`, `standard`, `light`; each value `{ "model": "<non-empty id>", "reasoning_effort"?: "<string>" }` or `null` | materialized from the catalog's `providers[model_provider]`; all `null` under `inherit`; typed by the user under `generic` | Stage 1 Step 6.5, `/n2b:config` (`--profile`/`--provider` re-materialize; `--set <tier>=<id>` edits one entry) | Every workflow that spawns agents — **this is what spawns read**. A `null` tier falls back along the catalog's `fallback` chain (`frontier → heavy → standard → light`); when the chain ends on `null`, the spawn omits `model`. |
| `spec_review` | string | `independent` \| `self-only` | `independent` | Stage 1 Step 6.5, `/n2b:config --spec-review` | Stage 3 workflow — toggles the independent spec review pass (Pass C): `independent` spawns the independent Spec Quality Reviewer (default); `self-only` relies on the spec producer's self-review alone. |
| `design_system_source` | string | `none` \| `user` | `none` | Stage 1 Step 6.5, `/n2b:config --design-system` | Stage 3 passthrough step and Gate A Category 5 — `user` carries the files found in `.n2b/inputs/design-system/` verbatim into the package at `.n2b/specifications/design-system/` (see Design-System Intake below); `none` means the package ships design-agnostic (no design-system output exists). n2b never generates a design system. |
| `max_features` | integer \| null | `null` (no cap) or an integer ≥ 1 | `null` | Stage 1 Step 6.5 (from the `--smoke [N]` intake flag), `/n2b:config --max-features <N\|none>` | Stage 1 Path D (feature proposals), Stage 2 (Visionary prompt, Gate 1, Gate 2 — the cap bites where features are born, see Feature Cap below), Stage 3 / Stage 4 banners, `/n2b:status` and `/n2b:config --show` (`Cap:` line). `null` means today's uncapped behaviour, byte for byte. |
| `created` | string | ISO date `YYYY-MM-DD` | today's date at instantiation | Stage 1 Step 6.5 (preserved by `/n2b:config`) | Informational/provenance — records when the pipeline was configured. |
| `n2b_version` | string | semver | the template's value (currently `0.3.0`) | Stage 1 Step 6.5 and `/n2b:config` (copied from the template by the materializer — never typed from memory) | Informational/provenance — records which engine version produced the blueprint package. |

## Missing/Invalid Handling

A missing config file or an invalid field value is never a fatal error. Each reader falls back to the field's default from the table above and the pipeline proceeds — the same discipline as the `model_profile` fallback in `n2b/references/model-profiles.md`.

**Legacy configs (written before `model_provider` / `model_tiers` existed):** the resolver treats a missing or non-object `model_tiers` as "materialize on the fly from the runtime's default provider" — `claude-aliases` on Claude Code (so a pre-existing Claude Code project keeps routing exactly as before), `inherit` elsewhere (so no alias ever reaches a non-Claude host). `/n2b:status` flags such a config and `/n2b:config` rewrites it into the full eight-field shape on its next run. A config written before `max_features` existed is read as `max_features: null` (no cap) by every reader.

## Design-System Intake (`design_system_source: user`)

When the user brings their own design system, the source files land in **`.n2b/inputs/design-system/`**. Accepted formats: Markdown, design-token JSON, and PDF (URLs/pointers recorded in a `SOURCES.md` note there). The Stage 3 workflow carries that directory **verbatim** into the package at `.n2b/specifications/design-system/` — a zero-agent copy, never normalized, reworded, or restyled; the supplied material is the design layer's source of truth. Downstream consumers (Stage 4 architecture, Stage 5 exports) read the package copy at `.n2b/specifications/design-system/`. When `design_system_source` is `none`, no design-system artifact exists anywhere in the package and stated design preferences ride the brief's Constraints.

## Feature Cap (`max_features`)

A **capped run** (also called a *smoke run*) exercises the whole pipeline — research, definition, specs, review, architecture, export — on a deliberately small feature set, so an end-to-end run finishes in minutes instead of hours. The cap is a pipeline setting, not a product decision: the product is still described as real; only how many of its features this run carries forward is limited.

- **Where it bites:** Stage 2. The Visionary defines at most `max_features` features (choosing the set that closes the product's core value flow), and Gate 1 / Gate 2 fail hard when `product-features.md` carries more `FEAT-` IDs than the cap. Everything the cap left out is recorded under `## Deferral Notes › ### Deferred by feature cap` in `scope-boundaries.md`, so the definition stays honest about what was cut.
- **Where it does not bite:** Stages 3–5 derive every count from `product-features.md` and the `FEAT-*` directories, so they need no cap of their own — they simply see fewer features. Stage 3 never caps specs (a feature's specs are whatever it needs), and the Stage 4 research floor is unchanged.
- **Writers:** `/n2b:s1-init --smoke [N]` (N defaults to 3) writes it at Step 6.5; `/n2b:config --max-features <N|none>` sets or clears it afterwards. Changing it once Stage 2 is complete has no effect on the features already defined, so `/n2b:config` refuses the change and says so.
- **Display:** `/n2b:status` and `/n2b:config --show` print `Cap: max {N} features (smoke run)` when set; the Stage 1–4 banners note a capped run.

## Reserved Fields

| Field | Status |
|---|---|
| `model_overrides` | **Reserved (model-profiles Phase 4).** Per-role overrides `{"<role>": "<tier>" \| "<full model id>"}` with the highest precedence at spawn. Not yet written or read; a config carrying it is ignored like any other unregistered field. |
| `default_export_target` | **Retired (WP5 Phase 0, decision 90h — never introduced).** The export stage landed without a config key: the target is chosen per invocation (command argument or the interactive picker in `n2b/workflows/stage-5/export.md`). This field remains unregistered; a config carrying it is treated like any other unregistered field and ignored. |

## Schema Discipline

- The runtime config contains exactly the eight registered fields — no more, no fewer — until a reserved field's owning work package defines it and registers it here. `max_features` is always present, as `null` when no cap is set.
- There is no `pipeline_mode` field: the pipeline is manual-only — every stage ends `paused` and the user triggers the next stage command themselves (removed 2026-07-25, flag #73/decision 87; a pre-removal runtime config that still carries `pipeline_mode` is treated as an unregistered field and ignored).
- The template and the runtime file share the same field set; only `created` differs (placeholder vs. resolved date) and `model_provider`/`model_tiers` differ per runtime. Any schema change updates the template, this document, the materializer in `model-profiles.md`, Gate 0's `GATE0-CONFIG` check, and every recorded reader in the same change.
- The catalog (`model-catalog.json`) owns model IDs and the role → tier table; this document owns the config *shape*. Adding a provider preset is a catalog change; adding a config field is a schema change here.
