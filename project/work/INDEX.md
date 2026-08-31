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
| JG-021 | in-progress (materials round 3 implemented 2026-08-30: baked palette retained, panels 0.35/0.18, Station-2 IBL crossfade — owner ruling pending; pushed 2026-08-30) | Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement — REOPENED 2026-08-29 (owner visual pass), remediation §9; re-review §10: runout+framing pass, colors still wrong; round 3 fix + reconciliation §11 | [Queued](../../TODO.md#queued) | [plan](plans/JG-021-sequence-rechoreography.md) | [evidence](evidence/JG-021-sequence-rechoreography-verification.md) |
| JG-022 | verified 2026-08-30 (reduced-motion advance + keyboard + full/lite/poster regression green; pushed 2026-08-30) | Reduced-motion chapter stranding fix — tier-only native-scroll listener in `Chapters.tsx`, local state, no store writes | [Queued](../../TODO.md#queued) | [plan](plans/JG-022-reduced-motion-chapter-stranding.md) | [evidence](evidence/JG-022-reduced-motion-chapter-stranding-verification.md) |
| JG-023 | queued (triaged 2026-08-31; pilot chapter CH.01-vs-CH.03 = blocking owner ruling) | Scroll-scrubbed procedural backdrop layers — per-chapter camera-locked GL backdrops behind all three stations, `SCRUBBED_BACKGROUNDS` flag, bloom < 0.6 linear-luminance gate, zero media payload | [Queued](../../TODO.md#queued) | [plan](plans/JG-023-scrubbed-backgrounds.md) · [roster](plans/JG-023-scrubbed-backgrounds-skill-roster.md) | evidence pending |

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
