---
target: {target-key}
exported_at: {ISO-8601 timestamp}
package_version: {integer — MANIFEST.md package_version this export was rendered from}
files:
  - {path relative to the export directory, one list entry per rendered file}
feature_count: {integer — FEAT roster count reconciled by the fidelity gate}
spec_count: {integer — SPEC roster count reconciled by the fidelity gate}
ac_count: {integer — distinct canonical AC IDs reconciled by the fidelity gate}
fidelity_result: pass
---

# Export Receipt — {target-key}

<!-- Rules for this document:
  - Frontmatter is contract C-29 — exactly these fields, no additions.
  - Written ONLY by the export workflow (n2b/workflows/stage-5/export.md, Step 5), during
    the export-complete transition (n2b/references/tracking-protocol.md) — never by an
    agent. Agents write deliverables; the workflow writes receipts and MANIFEST.md.
  - fidelity_result is always pass: a receipt exists only for an export whose fidelity gate
    (4a reconciliation + 4b semantic review) passed. There is no fail receipt — a failed
    gate leaves no receipt, which is exactly what stage-resume-s5 classification keys on.
  - files lists every rendered file in the export directory except FIDELITY-REPORT.md and
    this receipt.
-->

This receipt certifies that the `{target-key}` export in this directory was rendered from
the canonical blueprint package at `package_version` {integer}, and passed the export
fidelity gate: bash reconciliation of the FEAT / SPEC / AC / XBR / ADR / SC / ASMP rosters
(4a) and the semantic fidelity review (4b, see `FIDELITY-REPORT.md` alongside this file).

**Staleness** is judged by comparing this receipt's `package_version` against the current
`package_version` in `.n2b/tracking/MANIFEST.md`: equal → this export is current; behind →
the canonical package has changed since this render and the export is stale. Refresh it any
time with `/n2b:s5-export {target-key}` — refreshing one target never touches any other
target's export.

This file is the deliverable-side receipt (its tracking-side counterpart lives at
`.n2b/tracking/stages/s5-export/{target-key}.md`, template
`n2b/templates/tracking/export-target-tracker.md`). Its presence marks the target complete
for `stage-resume-s5` classification; it is written once per passing render and replaced
only by a user-confirmed per-target refresh.
