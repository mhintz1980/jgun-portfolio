# JGUN Work Registry

This is the stable registry for work accepted after the `JG-###` protocol was established. [`../../TODO.md`](../../TODO.md) is the ordered queue; this index links each task to its detailed plan and verification evidence.

> **Check-off rule:** A task becomes `verified` only after the linked evidence record exists, its acceptance criteria are recorded as passed, and the corresponding TODO checkbox changes in the same commit.

## Accepted Work

| ID | Status | Title | TODO entry | Plan | Evidence |
|---|---|---|---|---|---|
| JG-026 | in-progress; machine gates complete, owner visual ruling open | B1/B2 engineering drawing extraction rebuild | [Active](../../TODO.md#active) | [plan](plans/JG-026-b1-b2-engineering-drawing.md) | [evidence](evidence/JG-026-b1-b2-verification.md) |
| JG-014 | verified | Opening sequence, print-authentic GD&T annotations, and rear-LCD reveal | [Active](../../TODO.md#active) | [plan](plans/JG-014-opening-gdt-lcd-repair.md) | [evidence](evidence/JG-014-opening-gdt-lcd-verification.md) |
| JG-015 | verified | RL-300 / MSP Acoustic SAFE asset ingestion | [Active](../../TODO.md#active) | [plan](plans/JG-015-msp-acoustic-safe-asset-ingestion.md) | [evidence](evidence/JG-015-msp-acoustic-safe-asset-ingestion-verification.md) |
| JG-016 | verified | Multi-station spatial world and navigation rig | [Active](../../TODO.md#active) | [plan](plans/JG-016-multi-station-spatial-world.md) | [evidence](evidence/JG-016-multi-station-spatial-world-verification.md) |
| JG-017 | verified | Post-processing and whip-pan camera effects | [Active](../../TODO.md#active) | [plan](plans/JG-017-whip-pan-camera-fx.md) | [evidence](evidence/JG-017-whip-pan-camera-fx-verification.md) |
| JG-018 | verified | Interactive airflow and acoustic-wave systems | [Queued](../../TODO.md#queued) | [plan](plans/JG-018-airflow-and-acoustic-interaction.md) | [evidence](evidence/JG-018-airflow-and-acoustic-interaction-verification.md) |
| JG-019 | verified | Deployment readiness and studiomark.dev hosting | [Queued](../../TODO.md#queued) | [plan](plans/JG-019-deployment-and-hosting.md) | [evidence](evidence/JG-019-deployment-and-hosting-verification.md) |
| JG-020 | verified | Multi-station subassembly inspection, spatial hotspots, and interactive CAD anchors | [Active](../../TODO.md#active) | [plan](plans/JG-020-multi-station-hotspots-inspection.md) | [evidence](evidence/JG-020-multi-station-hotspots-inspection-verification.md) |
| JG-021 | verified 2026-09-01 (owner final ruling PASS, evidence §13 — glow arc end-state approved as the visual baseline record; enclosure recolor deferred to animation-redo C1) | Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement — REOPENED 2026-08-29 (owner visual pass), remediation §9; re-review §10: runout+framing pass, colors still wrong; round 3 fix + reconciliation §11; glow experiments §12; final ruling §13 | [Queued](../../TODO.md#queued) | [plan](plans/JG-021-sequence-rechoreography.md) | [evidence](evidence/JG-021-sequence-rechoreography-verification.md) |
| JG-022 | verified 2026-08-30 (reduced-motion advance + keyboard + full/lite/poster regression green; pushed 2026-08-30) | Reduced-motion chapter stranding fix — tier-only native-scroll listener in `Chapters.tsx`, local state, no store writes | [Queued](../../TODO.md#queued) | [plan](plans/JG-022-reduced-motion-chapter-stranding.md) | [evidence](evidence/JG-022-reduced-motion-chapter-stranding-verification.md) |
| JG-024 | **CLOSED VERIFIED 2026-09-02 — owner visual PASS ("looks good"), all commits pushed.** FINISH: stopgap replaced by owner source `JGUN-1.glb` (13 screws incl. the 4 CAD-true top-level `90910A815` gearbox bolts, az 0/90/180/−90 r 32.3 z −69.6, shanks radial); pipeline re-run → 10.18 MB / ≈562K tris; rig retarget `GB_FASTENER_RE` `/90910A815/i` + occurrence/HANDLE disambiguation + bolt-GROUP tagging; ladder @0.52 byte-identical, bolts rest/pop/ride exact vs spec, perf 16.8 ms quantum (evidence §8) | Fine-tessellation JGun re-export with all 13 fasteners — gltf-transform simplify+Draco from `JGUN-1.glb`, 9 handle screws (`fastener` unit) + 4 radial gearbox bolts (`gb-fastener-N` units with radial pop + clutch ride), `blackOxideSteel` default | [Queued](../../TODO.md#queued) | [plan](plans/JG-024-fine-jgun-fastener-reswap.md) | [evidence](evidence/JG-024-fine-jgun-fastener-reswap-verification.md) |
| JG-025 | **CLOSED VERIFIED 2026-09-05 — owner visual ruling PASS ("i approve. check it off.") at the `:4174` dwell; merged into `main` with JG-026 and pushed (`4158a6c..dc334e2`).** Machine record: materials/decal telemetry, de-stack pixel-proven, ladder byte-identical, p95 16.8 quantum (decals A/B zero-cost), tiers green incl. integrated re-verification, +5.35 kB | Handle-rear realism pass — red button/LCD cluster per owner reference (buttons `#c8e6ff` blue → red, aluminum surround → red bezel + glossy black), LCD data readout (CanvasTexture/decal), button symbols, reveal-beat framing vs reference, `LcdFillLight` retune; code-side materials only, no GLB re-export, unit-role path (dead `ROLE_OVERRIDES` finding); + fixed the pre-existing lcd-buttons merge-stack defect (per-part `lcd-button-N` units) | [Active](../../TODO.md#active) | [plan](plans/JG-025-handle-rear-realism.md) | [evidence](evidence/JG-025-handle-rear-verification.md) |
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
