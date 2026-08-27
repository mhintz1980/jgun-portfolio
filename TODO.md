# TODO — JGUN Portfolio

> **Canonical approved task queue.** Every new task has a stable `JG-###` ID and links to an accepted plan. Change a checkbox to `[x]` only after the matching verification record exists in [`project/work/evidence/`](project/work/evidence/) and the plan status is `verified`.

Start every task by reading [`AGENTS.md`](AGENTS.md), [`project/README.md`](project/README.md), and the linked plan. The registry at [`project/work/INDEX.md`](project/work/INDEX.md) is the complete map of task state, dependencies, plans, and evidence.

## Active

- [x] **JG-014 — Opening sequence, print-authentic GD&T annotations, and rear-LCD reveal** · [plan](project/work/plans/JG-014-opening-gdt-lcd-repair.md)
  - Correct tilted and duplicated opening callouts, replace opaque narrative cards with non-occluding beat copy, use the supplied gearbox drawings for datum/feature-control language, and add a real rear-LCD/buttons reveal before the JGun exit.
  - **Required proof:** fresh `:4173` telemetry, full/reduced-motion/poster behavior, accessibility checks, `npm run typecheck`, and `npm run build`.

## Queued

- [ ] **JG-015 — RL-300 / MSP Acoustic SAFE asset ingestion** · [plan](project/work/plans/JG-015-msp-acoustic-safe-asset-ingestion.md)
  - Replace the Stage 2 placeholder with a measured, named, source-registered, web-ready CAD asset.
  - **Unblocked 2026-08-27:** `public/models/msp-enclosure.glb` delivered + committed (7 named roots, single combined GLB). Integration work (regression check → `Station2_AcousticEnclosure.tsx` → `StageManager` swap → telemetry) can start. Owner still owes CAD authority/revision + usage restriction for the source-register row.

- [ ] **JG-016 — Multi-station spatial world and navigation rig** · [plan](project/work/plans/JG-016-multi-station-spatial-world.md)
  - **Depends on:** JG-015. Create measured station transforms, camera arrivals, navigation, and equivalent reduced-motion/poster behavior.

- [ ] **JG-017 — Post-processing and whip-pan camera effects** · [plan](project/work/plans/JG-017-whip-pan-camera-fx.md)
  - **Depends on:** JG-016. Add restrained, tier-aware camera FX only after station geometry and narrative are stable.

- [ ] **JG-018 — Interactive airflow and acoustic-wave systems** · [plan](project/work/plans/JG-018-airflow-and-acoustic-interaction.md)
  - **Depends on:** JG-015 and JG-016. Bind airflow/baffle interactions to verified enclosure geometry with accessible alternatives and performance limits.

- [ ] **JG-019 — Deployment readiness and studiomark.dev hosting** · [plan](project/work/plans/JG-019-deployment-and-hosting.md)
  - **Depends on:** JG-014. Publish only after build, asset, fallback, metadata, and production telemetry checks are recorded.

## Task Intake

New ideas, reviews, and plan drafts belong in [`project/work/inbox/`](project/work/inbox/). During triage, either reject/merge the proposal or assign the next stable ID, move it into [`project/work/plans/`](project/work/plans/), add it to the registry, and add an unchecked entry here in the same change.

## Verified Legacy Work

The work below predates the stable-ID system. Its detailed record is preserved in [`project/archive/superseded/TODO-pre-work-index-migration-2026-08-26.md`](project/archive/superseded/TODO-pre-work-index-migration-2026-08-26.md). Create stable-ID plan/evidence records only when legacy work is revised or re-verified; do not fabricate backfilled evidence.

- [x] P000420 speed-indicator grooves and P003068 ring-switch motion.
- [x] K000004 bearing extraction and display rotation turns.
- [x] Spatial leader lines and click-to-inspect interaction.
- [x] PBR material pass, rear-LCD capability, and M249 CAD dissolve.
- [x] Continuous kinematic idling and P000245 outer-shell ghost-fade fix.

## Operating Constraints

- Use part numbers as stable identity keys. Do not reorder D1-AP behavior based only on ambiguous stage names.
- Verify scene claims through runtime telemetry after restarting the `:4173` preview server; screenshots are supporting context only.
- Do not commit `.scratch/` or modify protected parallel-session material, including `docs/orzo-style-portfolio-implemetation-roadmap.md`, without explicit release.
- Never bare-regenerate `public/models/m249-transformed.glb`; follow the protected export procedure in [`project/context/constraints.md`](project/context/constraints.md).
