# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- README accuracy pass: the Stage 4 walkthrough no longer claims a technical-profile questionnaire — the stage is fully autonomous (the profile is extracted from the Stage 3 specs, and hosting/budget/technology boundaries are captured in Stage 1 as constraints); Stage 4 names all five passes; Stage 1 lists `.n2b/config.json` as an output; Stage 3 lists the reconciliation log, the conditional platform-parameters registry, and the design-system passthrough; the demo-GIF placeholder is gone.

## [0.4.0] - 2026-09-15

### Added
- Smoke mode: `/n2b:s1-init --smoke [N]` (default N = 3) and `/n2b:config --max-features <N|none>` set a feature cap — `max_features` in `.n2b/config.json` — so the whole pipeline runs end-to-end quickly and cheaply for testing. Stage 2 defines at most N features (core value flow first, at least one Core, the widest spread of spec kinds); both Stage 2 gates enforce the cap with the existing one-retry-then-halt loop, and everything past it is listed under `## Deferral Notes › ### Deferred by feature cap` in `scope-boundaries.md` as `[CAP-DEFERRED]` bullets (SYN-04 accepts either location). Stage 1, 2, and 4 start banners carry a `Capped run` line, Stage 3 appends ` · capped run (max N features)` to its run-count lines, trackers record the cap, and `/n2b:status` shows a `Cap:` line. The cap cannot be changed once Stage 2 is complete. A full run is unchanged (`max_features: null`, now the eighth config field).

### Changed
- Stage 3 batch messaging: the Stage 2 hand-off banner now explains that Stage 3 is batched and estimates the run count; every `CHECKPOINT` and `--continue` resume shows a per-pass progress table (`✓ ● ○`), batch X of Y, run R of ~T, and the next pass. The remaining-run estimate now measures Pass B/C against the full feature count (it previously only counted already-analyzed features, undercounting during Pass A).
- `/n2b:status` between-stages route and the gatekeeper Next-Stage Lookup carry the Stage 3 batch hint.
- README documents `/n2b:s3-specify --batch all`.

## [0.3.0] - 2026-09-14

### Added
- `/n2b:config` — show or change pipeline settings after Stage 1 (`--show`, `--profile`, `--provider`, `--set <tier>=<id>`, `--spec-review`, `--design-system`; no flags asks the Stage 1 questions again). Writes only `.n2b/config.json`, always through the catalog materializer.
- `n2b/references/model-catalog.json` — single source of truth for model routing: 16 agent roles × 3 profiles → 4 semantic tiers (`frontier`, `heavy`, `standard`, `light`), provider presets (`claude-aliases`, `anthropic`, `openai`, `generic`), and per-runtime transport. The table in `model-profiles.md` is a rendered projection, checked by `npm test`.
- `model_provider` and `model_tiers` fields in `.n2b/config.json`: the chosen provider's model IDs are materialized at write time, so stage workflows read a flat object instead of walking a lookup table. Legacy five-field configs keep working (Claude Code projects route exactly as before) and are upgraded by `/n2b:config`.
- `inherit` model profile (no routing — every agent uses the host's session model), accepted on every runtime.
- Stage 1 Step 6.5 is runtime-aware and un-skippable: Claude Code asks the profile; Codex and OpenCode show a notice, then ask profile and provider (Inherit offered first); Cursor writes `inherit` with a one-line notice. A skipped question is recorded under `## Deviations` and checked by Gate 0 (`GATE0-SETTINGS`, `GATE0-CONFIG`).
- `/n2b:status` shows a `Models:` line.
- OpenCode model routing: the installer now emits one native subagent file per n2b role (`.opencode/agents/n2b-<role>.md`, `mode: subagent`, no `model:` at install) and rewrites every workflow spawn to name its `subagent_type`. Stage 1 Step 6.5 and `/n2b-config` write each role's resolved model into the file's `model:` line (or strip it under `inherit`) with the new `n2b-agent-sync` block owned by `model-profiles.md`. Reinstalling keeps each file's `model:` line, prunes stale `n2b-*` agent files, and leaves user agents in the same directory untouched.

### Changed
- Model tiers are named `frontier` / `heavy` / `standard` / `light`; `fable` / `opus` / `sonnet` / `haiku` survive only as the Claude Code alias values. Claude Code spawns are unchanged.
- Codex skill adapter: model routing is capability-gated — `model` and `reasoning_effort` are passed to `spawn_agent` only when its schema advertises each field and a concrete ID resolved; a rejected model is re-spawned once without one and recorded in Deviations. Aliases and `claude-*` values are never sent.
- Fixed `n2b_version` drift in the Stage 1 brief template (`0.1.0` → `0.2.0`); the version is now copied from the config template rather than typed.

### Known limitations
- Codex routing is still unverified against a live Codex CLI (the live smoke test remains on the todo list).
- OpenCode routing matches the vendor docs for agent files and the `task` tool but is likewise unverified against a live OpenCode run.

## [0.2.0] - 2026-09-13

### Added
- Multi-runtime install: `npx napkin-to-blueprint` now installs into Claude Code (`.claude/`, default), Codex (`.codex/`), OpenCode (`.opencode/`), or Cursor (`.cursor/`) via `--claude`, `--codex`, `--opencode`, `--cursor`, `--all`, and `--target <dir>`; an interactive picker runs when no flag is given.
- Per-runtime translation at install time: paths, command names (`/n2b:x` on Claude Code, `$n2b-x` on Codex, `/n2b-x` on OpenCode and Cursor), `@` includes, and tool names are rewritten; Codex and Cursor get `SKILL.md` skills, OpenCode gets flat commands.
- Installer test suite (`npm test`) with a byte-identity baseline for Claude Code output.
- Repository hardening: CI workflow, Dependabot for GitHub Actions, security policy, contributing guide, issue and PR templates; releases now publish from GitHub Actions with npm provenance.

### Changed
- Stage 1 intake preserves supplied sources, batches implied checks, and sets expectations up front.
- `bin/install.js` is marked executable in git so local directory installs work without a chmod.

### Known limitations
- Codex support is **experimental**: it has not been verified against a live Codex CLI. Skills install to `.codex/skills/` (matching gsd-core), while Codex's current docs name `.agents/skills/` as the project root. If `$n2b-*` commands do not appear, move the folder and open an issue.
- Cursor and OpenCode output was checked against vendor docs, not a live run.
- `model_profile` only takes effect on Claude Code; other runtimes use their configured default model for every agent.
- Claude Code installs are unchanged: the installer still copies source verbatim into `.claude/`, so existing Claude Code users see no difference beyond the version stamp.

## [0.1.0] - 2026-08-23

### Added
- Initial release: five-stage pipeline (`/n2b:s1-init`, `/n2b:s2-define`, `/n2b:s3-specify`, `/n2b:s4-architect`, `/n2b:s5-export`) plus `/n2b:status`, for Claude Code.
- Stage 5 export targets including dev-brief, Jira, Spec Kit, and vibe-coding packs.

[Unreleased]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tsmztech/napkin-to-blueprint/releases/tag/v0.1.0
