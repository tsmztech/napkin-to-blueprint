---
pipeline_status: running   # running | paused | blueprint-complete | failed (blueprint-complete is terminal — set by Stage 4; exports never change it)
active_stage: 0                 # 0 = between stages / not started, 1-4 = that stage is running (never 5 — exports don't claim active_stage)
last_completed_stage: null
last_gate_result: null
project_name: "{PROJECT_NAME}"
started_at: null
last_updated: null
---

# n2b Pipeline

- [ ] Stage 1: Intake
- [ ] Stage 2: Define Features
- [ ] Stage 3: Create Specifications
- [ ] Stage 4: Technical Architecture
- [ ] Stage 5: Export

## Stage History

### Stage 1: not started

### Stage 2: not started

### Stage 3: not started

### Stage 4: not started

### Stage 5: not started

## Artifact Lineage

| Feature | Stage 2 | Stage 3 Specs | Stage 4 Mapping |
|---------|---------|---------------|-----------------|

## Export History

<!-- Append-only. Rows are appended by the export-complete transition; the gatekeeper's re-run confirm marks rows stale; the status workflow reads them for staleness. Never edit or remove rows. Status values: current | stale. -->

| # | Target | Package version | Artifacts | Completed at | Status |
|---|--------|-----------------|-----------|--------------|--------|
