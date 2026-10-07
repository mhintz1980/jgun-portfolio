Fix spec executed completely. All three Sol findings are fixed, each with a new test that would have caught it, and both verification commands pass.

**Changed paths** (only my five owned files; no git operations):

- [kinematics.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts:94) — P1 fix
- [kinematics.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts) — updated expectations + new C1 boundary test
- [camera.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.ts:64) — P2 fixes (both)
- [camera.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.test.ts) — extended slot test + two new tests
- [shaft-kinematics-camera.md](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-kinematics-camera.md) — K7 evidence section appended

**P1 — C1 startup**: inserted an eased-onset rate segment 2..3 s (0→1, smoothstep, C1 at both ends; full rate at 3 s). m(6) moved 4 → 3.5 machining s. Timing goals held exactly: slow window still 7.2..9.6 s at rate 0.22, exit stroke peak still exactly t = 8.4 s, clear relieved-return plateau 0.842 s (≥ 0.4), all ten spaces complete at ~12.95 s (< 15.0). The new test checks one-sided finite differences on half-step-offset intervals at every `MACHINING_RATE_BOUNDARIES` time plus a straddling central difference vs dm/dt (tolerance 0.02; observed worst 5.6e-3). The old 0→1 step fails it by ~1.0 asymmetry / ~0.5 central.

**P2 — materials settle**: the transition moved from 15→15.4→16.2 s into the recap end 14→15 s, up rotation moved from 15.2..16.2 s to 14..15 s, and the hold anchors now span the full materials beat 15..22.6 s. Position, target, up and fov are constant (observed delta 0.0 against the 1e-9 bound) from 15.0 s — the instant the first card becomes visible — through 22.6 s, settled before full opacity at 15.14 s. The new test sweeps 15.0..22.6 s at 1/240 in both layouts, and the slot test now samples from 15.0/15.14 s instead of 16 s.

**P2 — final card band**: new card-safe runout framing settled 33.2..35 s (desktop target y 12.8→18.5 mm, fov 6.3→7.6°; narrow target y 8.7→9.0 mm, fov 16.5→17.5°), reached by a 32→33.2 s move while no card is on screen. Shaft axis (y 3.2..20) plus the revised-section envelope (journal r 6.325 discs over y 9..20) project to desktop NDC x ≤ 0.0916 (band starts 0.12) and narrow NDC y ≥ −0.207 (band starts −0.3). The review's probe (0, 19.2, 0) moved 981.4 px → 743.6 px, clear of the 806.4..1324.8 px band. The new test covers 33.2..35 s at both layouts; the 33.5 s key-beat span extended to [3.2, 20].

**Commands and results**:

```
npx vitest run src/scene/inspection/shaft
  Test Files  7 passed (7)     Tests  94 passed (94)
npm run typecheck
  tsc --noEmit -> clean
```

My two suites went 27 → 30 tests (3 new, none weakened); the remaining growth from K6's 63 to 94 is concurrent sibling suites (e.g. `shaftRuntime` work), which also pass against my unchanged exported API — I only added one export (`MACHINING_RATE_BOUNDARIES`). Before editing, I validated every replacement value in a standalone numeric harness outside the repo that first reproduced the review's exact 981.4 px probe, so the design margins above are computed, not estimated.