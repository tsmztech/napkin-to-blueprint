# Config Schema Reference

This document is the single owner of the `.n2b/config.json` schema. Every field in the config file is registered here with its type, allowed values, default, writer, and readers. A field that is not registered here must not be written to config.json, and no workflow may invent a new field without adding its row to this document in the same change.

## File Locations

- **Template:** `n2b/templates/config.json` — source template; `created` carries the `{DATE}` placeholder until instantiation.
- **Runtime:** `.n2b/config.json` — written by the Stage 1 workflow at Step 6.5 (preference collection). It is ALWAYS written: if the user skips or cancels the preference questions, Stage 1 writes the defaults and moves on. Only workflows write this file — never agents.

## Fields

| Field | Type | Allowed values | Default | Writer | Readers |
|---|---|---|---|---|---|
| `model_profile` | string | `quality` \| `balanced` \| `budget` | `balanced` | Stage 1 Step 6.5 | Every workflow that spawns agents, via the resolution logic in `n2b/references/model-profiles.md` (config → mapping table → Agent tool `model` parameter). |
| `spec_review` | string | `independent` \| `self-only` | `independent` | Stage 1 Step 6.5 | Stage 3 workflow — toggles the independent spec review pass (Pass C): `independent` spawns the independent Spec Quality Reviewer (default); `self-only` relies on the spec producer's self-review alone. |
| `design_system_source` | string | `none` \| `user` | `none` | Stage 1 Step 6.5 | Stage 3 passthrough step and Gate A Category 5 — `user` carries the files found in `.n2b/inputs/design-system/` verbatim into the package at `.n2b/specifications/design-system/` (see Design-System Intake below); `none` means the package ships design-agnostic (no design-system output exists). n2b never generates a design system. |
| `created` | string | ISO date `YYYY-MM-DD` | today's date at instantiation | Stage 1 Step 6.5 | Informational/provenance — records when the pipeline was configured. |
| `n2b_version` | string | semver | `0.1.0` | Stage 1 Step 6.5 (copied from the template) | Informational/provenance — records which engine version produced the blueprint package. |

## Missing/Invalid Handling

A missing config file or an invalid field value is never a fatal error. Each reader falls back to the field's default from the table above and the pipeline proceeds — the same discipline as the `model_profile` fallback in `n2b/references/model-profiles.md`.

## Design-System Intake (`design_system_source: user`)

When the user brings their own design system, the source files land in **`.n2b/inputs/design-system/`**. Accepted formats: Markdown, design-token JSON, and PDF (URLs/pointers recorded in a `SOURCES.md` note there). The Stage 3 workflow carries that directory **verbatim** into the package at `.n2b/specifications/design-system/` — a zero-agent copy, never normalized, reworded, or restyled; the supplied material is the design layer's source of truth. Downstream consumers (Stage 4 architecture, Stage 5 exports) read the package copy at `.n2b/specifications/design-system/`. When `design_system_source` is `none`, no design-system artifact exists anywhere in the package and stated design preferences ride the brief's Constraints.

## Reserved Fields

| Field | Status |
|---|---|
| `default_export_target` | **Retired (WP5 Phase 0, decision 90h — never introduced).** The export stage landed without a config key: the target is chosen per invocation (command argument or the interactive picker in `n2b/workflows/stage-5/export.md`). This field remains unregistered; a config carrying it is treated like any other unregistered field and ignored. |

## Schema Discipline

- The runtime config contains exactly the five registered fields — no more, no fewer — until a reserved field's owning work package defines it and registers it here.
- There is no `pipeline_mode` field: the pipeline is manual-only — every stage ends `paused` and the user triggers the next stage command themselves (removed 2026-07-25, flag #73/decision 87; a pre-removal runtime config that still carries `pipeline_mode` is treated as an unregistered field and ignored).
- The template and the runtime file share the same field set; only `created` differs (placeholder vs. resolved date). Any schema change updates the template, this document, and every recorded reader in the same change.
