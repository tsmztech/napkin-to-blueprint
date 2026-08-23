---
document_type: fidelity-report
target: {target-key}
checked_at: {ISO-8601 timestamp}
package_version: {integer — MANIFEST.md package_version the export was checked against}
samples_checked: {integer — total spec files compared in the 4b sample}
verdict: {pass | fail}
---

# Export Fidelity Report — {target-key}

<!-- Rules for this document:
  - Written by the export-fidelity-checker agent (gate 4b) into the target's export
    directory, EXCEPT Section 1: the export workflow appends the 4a bash reconciliation
    results (one row per rule executed, per n2b/references/stage-5/fidelity-rules.md) after
    the gate loop settles. The checker leaves Section 1's table exactly as rendered here.
  - This file and EXPORT-RECEIPT.md are gate artifacts: they are excluded from every
    fidelity scan and from COMBINED-style concatenations.
  - verdict is the 4b verdict: fail if any finding row carries severity fail; a report with
    only warn rows (or none) is a pass. The workflow combines it with the 4a result — both
    must pass before the export-complete transition fires.
  - Every finding must carry both sides of the evidence. "Table truncated" without the
    missing row named is not a finding.
  - On a formatter re-run, this report is rewritten from scratch — it describes the current
    render only.
-->

## 1. Reconciliation Summary (4a — appended by the workflow)

Bash reconciliation per `fidelity-rules.md`, executed by the export workflow. The final
attempt's results are recorded here by the workflow; the fidelity checker never fills this
section.

| Rule | Expected | Found | Result |
|------|----------|-------|--------|
| {rule ID — e.g. U1 FEAT coverage} | {expected value — e.g. all {N} FEAT IDs} | {found value} | {pass / fail} |

{One row per rule executed: R0 cross-check, U1–U6, and the target's rules (e.g. DEV-1..DEV-3).
Attempts used out of 3, when more than one, noted below the table.}

## 2. Semantic Findings (4b)

**Sample:** {sampled FEAT IDs, Core tier flagged — e.g. FEAT-01 (Core), FEAT-04 (Core),
FEAT-13, ...} — {N} features / {M} specs compared.

| # | Severity | Export file (section) | Canonical source | Finding — canonical vs export evidence |
|---|----------|----------------------|------------------|----------------------------------------|
| {1} | {fail / warn} | {export file + section or line} | {canonical file + section} | {what was lost or invented: canonical text vs export text, quoted tightly} |

{Zero findings → replace the table with: "No semantic findings. All {M} sampled specs render
their acceptance criteria verbatim, tables at full row counts, edge cases and exact error
messages intact; alternatives render at equal depth; design posture verified as
{posture branch}; glue prose adds navigation only."}

## 3. Verdict

**{PASS | FAIL}** — {one-sentence statement: for pass, what the sample demonstrates about
the render's fidelity; for fail, the count of fail-severity findings and the dominant loss
pattern the formatter must correct on re-render.}
