# Contributing to napkin-to-blueprint

Thanks for helping improve n2b. This is a small project with a simple process.

## Where things live

- Source is authored once, at the repository root, in Claude Code native format: `commands/n2b/`, `n2b/agents/`, `n2b/workflows/`, `n2b/references/`, `n2b/templates/`.
- `bin/install.js` copies that source into a project's runtime directory and translates it for Codex, OpenCode, and Cursor. It has **zero npm dependencies** and must stay plain Node (≥ 16).
- `test/install.test.js` is the test suite (`npm test`). `test/fixtures/claude-baseline.json` pins the Claude Code output byte-for-byte.
- Runtime artifacts (`.n2b/` in a user's project) are never committed here.

## Development loop

```bash
npm test                                                        # run the installer tests
node bin/install.js --claude --target /path/to/scratch-project   # install a local checkout (any runtime flag, or --all)
```

After editing source, re-run the installer before testing in a host runtime. Then:

- If you changed anything under `commands/` or `n2b/` on purpose, refresh the baseline with `node test/install.test.js --update-baseline` and commit the fixture in the same change.
- Non-Claude output must contain no `.claude/`, `n2b:`, or `@./` tokens. The tests check this.
- When adding a runtime, add a row to the `RUNTIMES` table in `bin/install.js` (the only place that knows a runtime's directory and format), the README runtime table, and the test loop. Do not add `if (runtime === ...)` branches.

## Pull requests

1. Branch from `main`.
2. Keep `npm test` green.
3. If a command, stage, agent, or export target changed, update `README.md` in the same PR.
4. Fill in the PR template (summary and test plan).

Commit messages follow the existing style: `feat:`, `fix:`, `docs:`, `test:`, `chore:` with an optional scope, for example `fix(install): ...`.

## Quality gates are part of the product

Each pipeline stage passes through completeness audits and fidelity gates before it advances. When changing a stage, preserve its gate contract (for example acceptance criteria carried verbatim, counts reconciled).

## Reporting problems

- Bugs and feature requests: open an issue using the templates.
- Security issues: see [SECURITY.md](SECURITY.md). Please do not file them as public issues.
