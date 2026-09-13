# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tsmztech/napkin-to-blueprint/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tsmztech/napkin-to-blueprint/releases/tag/v0.1.0
