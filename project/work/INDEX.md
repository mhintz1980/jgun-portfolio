# JGUN Work Registry

This is the stable registry for work accepted after the `JG-###` protocol was established. [`../../TODO.md`](../../TODO.md) is the ordered queue; this index links each task to its detailed plan and verification evidence.

> **Check-off rule:** A task becomes `verified` only after the linked evidence record exists, its acceptance criteria are recorded as passed, and the corresponding TODO checkbox changes in the same commit.

## Accepted Work

| ID | Status | Title | TODO entry | Plan | Evidence |
|---|---|---|---|---|---|
| JG-014 | verified | Opening sequence, print-authentic GD&T annotations, and rear-LCD reveal | [Active](../../TODO.md#active) | [plan](plans/JG-014-opening-gdt-lcd-repair.md) | [evidence](evidence/JG-014-opening-gdt-lcd-verification.md) |
| JG-015 | verified | RL-300 / MSP Acoustic SAFE asset ingestion | [Active](../../TODO.md#active) | [plan](plans/JG-015-msp-acoustic-safe-asset-ingestion.md) | [evidence](evidence/JG-015-msp-acoustic-safe-asset-ingestion-verification.md) |
| JG-016 | verified | Multi-station spatial world and navigation rig | [Active](../../TODO.md#active) | [plan](plans/JG-016-multi-station-spatial-world.md) | [evidence](evidence/JG-016-multi-station-spatial-world-verification.md) |
| JG-017 | verified | Post-processing and whip-pan camera effects | [Active](../../TODO.md#active) | [plan](plans/JG-017-whip-pan-camera-fx.md) | [evidence](evidence/JG-017-whip-pan-camera-fx-verification.md) |
| JG-018 | verified | Interactive airflow and acoustic-wave systems | [Queued](../../TODO.md#queued) | [plan](plans/JG-018-airflow-and-acoustic-interaction.md) | [evidence](evidence/JG-018-airflow-and-acoustic-interaction-verification.md) |
| JG-019 | verified | Deployment readiness and studiomark.dev hosting | [Queued](../../TODO.md#queued) | [plan](plans/JG-019-deployment-and-hosting.md) | [evidence](evidence/JG-019-deployment-and-hosting-verification.md) |
| JG-020 | verified | Multi-station subassembly inspection, spatial hotspots, and interactive CAD anchors | [Active](../../TODO.md#active) | [plan](plans/JG-020-multi-station-hotspots-inspection.md) | [evidence](evidence/JG-020-multi-station-hotspots-inspection-verification.md) |
| JG-021 | verified 2026-09-01 (owner final ruling PASS, evidence §13 — glow arc end-state approved as the visual baseline record; enclosure recolor deferred to animation-redo C1) | Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement — REOPENED 2026-08-29 (owner visual pass), remediation §9; re-review §10: runout+framing pass, colors still wrong; round 3 fix + reconciliation §11; glow experiments §12; final ruling §13 | [Queued](../../TODO.md#queued) | [plan](plans/JG-021-sequence-rechoreography.md) | [evidence](evidence/JG-021-sequence-rechoreography-verification.md) |
| JG-022 | verified 2026-08-30 (reduced-motion advance + keyboard + full/lite/poster regression green; pushed 2026-08-30) | Reduced-motion chapter stranding fix — tier-only native-scroll listener in `Chapters.tsx`, local state, no store writes | [Queued](../../TODO.md#queued) | [plan](plans/JG-022-reduced-motion-chapter-stranding.md) | [evidence](evidence/JG-022-reduced-motion-chapter-stranding-verification.md) |
| JG-023 | verified (2026-08-31 pilot + X1; **X2 2026-09-01: CH.03 armed → `[T,T,T,T]` all four chapters live**, evidence §X2 — alpha 1.0 at all 9 checkpoints, uniform bound 0.054543 unchanged, state identity exact, perf 16.672/16.8 max 17.3 with 0 declines, bundle +10 B; pushed 2026-09-01 per Mark's order. Remaining backdrop work = design evolution W5, round-table-gated) | Scroll-scrubbed procedural backdrop layers — per-chapter camera-locked GL backdrops behind all three stations, `SCRUBBED_BACKGROUNDS` flag, bloom < 0.6 linear-luminance gate (pilot 0.032433; X1/X2 uniform bound 0.0545), zero media payload, +6,285 B min JS (+18 B X1, +10 B X2 codegen) | [Queued](../../TODO.md#queued) | [plan](plans/JG-023-scrubbed-backgrounds.md) · [roster](plans/JG-023-scrubbed-backgrounds-skill-roster.md) | [evidence](evidence/JG-023-scrubbed-backgrounds-verification.md) |

## Legacy Work

Earlier completed work has not been assigned artificial IDs or evidence records retroactively. The complete pre-system record is preserved at [`../archive/superseded/TODO-pre-work-index-migration-2026-08-26.md`](../archive/superseded/TODO-pre-work-index-migration-2026-08-26.md). Backfill it only if an older feature is reopened, re-verified, or becomes a dependency for new work.

## State Protocol

| Status | Meaning | Required action |
|---|---|---|
| `proposed` | Untriaged idea in [`inbox/`](inbox/). | Do not place it in TODO. |
| `queued` | Accepted plan, ready to work. | List it as `[ ]` in TODO. |
| `in-progress` | Work has started against an accepted plan. | Keep TODO unchecked; update this state and plan change log. |
| `verified` | Acceptance criteria and evidence are recorded. | Link evidence and change TODO to `[x]` in the same commit. |
| `superseded` or `cancelled` | Work is no longer active. | Keep the record, state its disposition, and remove it from active queue sections. |

## Intake Rule

Start every incoming proposal in [`inbox/`](inbox/). At triage, either reject/merge it or assign the next sequential `JG-###` ID, create an accepted plan, add this registry row, and add its concise TODO line in the same change.
