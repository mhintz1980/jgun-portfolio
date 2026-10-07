Done. The spec is executed in full, verification green. Summary:

**Changed paths** (all within the spec's file ownership; `writeShaftProgression` and the other producer's F2/withdrawal logic untouched, no git operations, no other files — confirmed by mtime footprint):

- [kinematics.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts) — `followMfAt` now integrates the eased startup analytically (mf = `easeIntegral` over the 2..3 s unit window) instead of the linear `t - 2`; `MF_AT_*` constants rebased accordingly.
- [kinematics.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts) — 4 new K8 tests: exact eased-startup integral, dense finite-difference derivative vs the law across 2..15 s (1/240 grid, h=1/480; observed worst 6.8e-6, tol 0.005 rad/s; the old code fails by ~0.196), straddling + one-sided intervals at every rate/weight boundary (2, 3, 6, 7.2, 9.6, 11, 12, 14, 15; h=1/48..1/161; observed worst 1.7e-4), and `FOLLOW_MF_TOTAL` = 1/960 trapezoid of the law (error ~1e-14).
- [camera.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.ts) — `FOLLOW_AZIMUTH_MOD` now wraps to the nearest turn instead of [0, 2π); header comment corrected. No anchor values changed.
- [camera.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.test.ts) — quarter-orbit test now asserts the exact law span 7π/16 instead of the retired π/2.
- [shaft-kinematics-camera.md](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-kinematics-camera.md) — K8 appended after K7.

**Numbers before → after:** mf(3) 1.0 → 0.5; mf(6) 4.0 → 3.5; `MF_AT_SLOW_START` 4.479657142857 → 3.979657142857; `FOLLOW_MF_TOTAL` 16.479657142857 → 15.979657142857; ψ rate at 2.5 s 0.392699 → 0.196350 rad/s (= the law, π/16); the 11.25° overshoot from 3 s onward eliminated; ψ(6)−ψ(2) 90° → 78.75° (7π/16); `FOLLOW_AZIMUTH_MOD` 10.7923° → −0.4577°.

One judgment call worth knowing: the corrected total lands at 359.542°, and the old [0, 2π) wrap made the t=15 anchors sit a full turn from the live curve, spiking the 14..15 s blend (C0 step 0.0050005 vs the 0.005 bound). The nearest-turn wrap is a no-op for the old value and restores the authored machine azimuths exactly; with it every existing continuity, handoff, safe-frame, card-band, and determinism test passes unchanged — so no camera anchors needed moving.

**Commands and results:** `npx vitest run src/scene/inspection/shaft` → 7 files, 102/102 passed (94 at K7 + 4 new K8 + sibling R8 growth); `npm run typecheck` → `tsc --noEmit` clean, exit 0.

