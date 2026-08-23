---
stage: 5
stage_name: "Export"
status: not-started
targets_completed: 0
targets_in_progress: 0
files_rendered_total: 0
last_export_at: null
---

<!-- LIVE DASHBOARD — Stage 5 exception (tracking-protocol.md): unlike Stage 1–4 STAGE.md files, this dashboard is a live document for the life of the project and is EXEMPT from the receipt write-lock — exports accumulate over time, so it is never sealed. The receipts are the per-target files beside it in s5-export/ (template: export-target-tracker.md), each write-locked once its status is done. Same dashboard-live / per-item-receipt pattern Stage 3 uses per feature.
     status here reflects the current run: in-progress while an export run is active (stage-resume-s5 keys on it), back to a resting value when the run ends. It never blocks a future run — re-export is always legal. -->

This file is the s5-export dashboard. Export runs update it continuously; per-target receipt files carry the write-locked record of each completed export.

## Targets

| Target | Status | Package version | Files | Fidelity | Exported at |
|--------|--------|-----------------|-------|----------|-------------|

(One row per export target ever attempted. Status: not-started / in-progress / done / stale. Rows are added on first attempt and updated in place — `export-complete` updates the target's row and the frontmatter counters; the gatekeeper's confirmed upstream re-run flips affected done rows to stale. Package version = the MANIFEST.md `package_version` the export was rendered against.)

## Activity Log

(Append-only, newest last. One line per event: `{ISO timestamp} — {target} — {event}` — run started, resumed (with per-target classification), fidelity gate passed/failed, export complete, marked stale, per-target refresh confirmed.)
