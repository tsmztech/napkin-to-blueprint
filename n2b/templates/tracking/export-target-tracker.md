---
target: "{TARGET_KEY}"
status: not-started
exported_at: null
package_version: null
files_rendered: 0
fidelity_result: null
---

<!-- Per-target tracker for s5-export/{TARGET_KEY}.md (C-29 tracking-side counterpart of the deliverable-side EXPORT-RECEIPT.md). Lifecycle: not-started -> in-progress (run active) -> done (export-complete fired). At status: done this file is a WRITE-LOCKED RECEIPT — do not modify — until a user-confirmed per-target refresh resets it for a re-render (tracking-protocol.md). The s5-export STAGE.md dashboard stays live; this file is the receipt. -->

## Target

- **Target key:** {TARGET_KEY}
- **Output directory:** .n2b/exports/{TARGET_KEY}/
- **Registry row:** n2b/references/stage-5/export-target-registry.md

## Run Log

(Append-only, newest last. One line per event: `{ISO timestamp} — {event}` — run started, resume classification result, formatter completed, fidelity gate 4a/4b outcome (with round number on retries), export-complete fired, stale marked by upstream re-run, user-confirmed refresh reset.)

(On completion, `export-complete` sets frontmatter: status: done, exported_at, package_version — the MANIFEST.md value this export was rendered against, the staleness key — files_rendered, and fidelity_result: pass. Values mirror the deliverable-side EXPORT-RECEIPT.md.)
