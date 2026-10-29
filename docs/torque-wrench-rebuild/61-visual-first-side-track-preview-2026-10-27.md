# Side-offset camera preview — 2026-10-27

Authority: `C:/Users/Markimus/AppData/Local/Temp/HANDOFF-2026-10-27-visual-first-shaft-cascade.md`.
This visual-authoring checkpoint supersedes the verification-first next action in plan 59 and evidence 60.

- [x] Read the latest handoff and preserve the existing dirty tree and empty index.
- [x] Show the earlier side-offset and rejected near-axis reference images.
- [x] Restore the approximately 16-degree side offset at 43.5/52.2 seconds in `src/scene/inspection/shaft/camera.ts`; retain the straight axial track.
- [x] Open a lightweight dev preview and capture three useful cascade frames for owner review.
- [ ] Owner reviews the camera direction, then directs motion/meshing adjustments.

The first iteration changes camera framing only. Gear laws, speed ramps and approved upstream fades are retained; visible meshing remains an unresolved owner report. The cinematic 3250:1 implementation is not a measured overall gearbox ratio or a visual target. Pre-40.2 seconds, bullet time, main housing and protected assets are preserved.

No test suites, independent reviews, exhaustive captures or production hardening before visual direction approval. No staging, commit, push or deployment. Owner visual acceptance remains OPEN.

## Preview ready

Dev server: `http://localhost:5199/torque-wrench/?quality=full` (task-owned PID 22160 at capture).
Gallery: `http://localhost:5199/output/playwright/side-track-preview-2026-10-27/index.html`.

Three 1440x900 stills are saved in `output/playwright/side-track-preview-2026-10-27/`: `side-track-54p9.png`, `side-track-58p7.png`, `side-track-63p8.png`. Native scroll reports 54.9009, 58.7015 and 63.8009 seconds respectively. The last still intentionally shows the existing incoming-stage transparency. These are visual proposals, not motion/meshing acceptance evidence.

Reproduce only these stills with `node scripts/preview-side-track.mjs` while the dev server is running. No build or test suite was run. Next action: owner reviews the frames, directs camera adjustment if needed, then chooses the next small motion/meshing iteration.

## Bullet-Time source alignment checkpoint (later 2026-10-27)

Mark explicitly requested the six-point contract/skill/routing/verifier alignment
and source verification checklist. Completed results and the saved continuation
prompt are in [handoff 62](62-bullet-time-contract-alignment-handoff-2026-10-27.md).
That bounded request supersedes the earlier test deferral only for these checks:
typecheck PASS; requested 118/118 tests, additional 39/39 and Node verifier 6/6 PASS.
It does not replace the pending owner visual review above or authorize broad
cascade hardening. No production build/browser run or owner acceptance is claimed.

After the visual direction decision, the next bullet-time implementation is:

- [ ] Measure ONLY the shaper at study .795–.835 (native .680–.720): physical
  subject speed, signed camera sweep and degrees/native viewport.
- [ ] Author its canonical knees with normalized-warp area correction and its
  >=60-degree camera/HUD composition; prove both-aspect witness/HUD clearance.
- [ ] Migrate ring/hob/ignition one shot at a time; preserve .15-rev ring budget.
- [ ] Record same-build full browser reverse/physical-rate/beauty proof separately
  from visual direction approval. `--quick` is INCOMPLETE, not completion PASS.

Detailed progress domains, commands, known gaps and boundaries are in handoff 62.
