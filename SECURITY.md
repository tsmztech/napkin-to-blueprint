# Security Policy

## Reporting a vulnerability

Please do not report security problems through public issues or pull requests.

Use GitHub's private vulnerability reporting instead:

**https://github.com/tsmztech/napkin-to-blueprint/security/advisories/new**

Include a description, steps to reproduce, the impact you see, and a suggested fix if you have one. Reports stay private until a fix is available.

## Response timeline

- Acknowledgement: within 72 hours
- Fix or mitigation: within 14 days for critical issues, next release otherwise

Reporters are credited in the release notes unless they prefer to stay anonymous.

## Scope

n2b is Markdown (commands, workflows, agents, references, templates) plus a zero-dependency Node installer (`bin/install.js`). Reports that matter most:

- The installer writing or deleting files outside the paths it owns in the target project (`.claude/`, `.codex/`, `.opencode/`, `.cursor/` n2b trees).
- Prompt or agent content that would lead a host runtime to exfiltrate data, run destructive commands, or act outside the pipeline's stated scope.
- A published npm package whose contents differ from this repository at the matching tag.

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest 0.x release | Yes |
| Older releases | Please upgrade to the latest release |
