# Canonical Bullet-Time alignment and handoff — 2026-10-27

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
Authority: Mark's six-point verification/alignment request in this chat. It
authorizes these source checks despite document 61's earlier test deferral;
visual direction, runtime, pixel and owner acceptance gates remain OPEN.
Document 61's cascade/side-track work remains active.

## Completed checklist

- [x] Read the updated repo-local cinematography skill. Section 2 contains six
  choreography laws; Section 3 forbids accumulated production narrative clocks.
  The remaining delta-clock example is confined to standalone sandbox previews.
  No old production 0.03x instruction remains.
- [x] Installed the missing skill-local HUD solver from the owner-provided root
  script. The root path now re-exports the skill-local implementation.
- [x] Added mandatory camera/bullet-time/HUD-framing/pacing routing in `AGENTS.md`,
  `project/context/agent-skills.md` and `project/context/session-phases.md`.
  Every harness reads this checkout's skill, not an older external copy.
- [x] Added 63 contract tests: .10 baseline, .15-rev ring budget, full-speed
  endpoints, inclusive plateaus, strict warp monotonicity, C1 knees, independent
  integration/differentiation, frozen specs, clamps and IEEE-754 bit-exact
  forward/reverse/prime-stride random seeks.
- [x] Aligned configuration in `InspectionDirector.ts`, `OpeningDirector.ts`,
  `OpeningCamera.ts`, `RingInspection.ts` and `inspection/shaft/schedule.ts`.
  Existing physical laws, C1 shoulders and camera paths retain their authored
  behavior; the new generic envelope is not silently substituted for them.
- [x] Camera/HUD verifier gates BOTH reverse camera and subject errors strictly
  below `1e-5`. Empty reverse evidence fails. Quick after-captures and empty gate
  sets report `INCOMPLETE`, never completion `PASS`.
- [x] Typecheck and the requested four-file suite pass; additional affected
  solver/opening/schedule/verifier checks pass. Results below.

## Canonical paths and progress domains

- Contract: `src/scene/torque-wrench/bulletTime.ts`.
- Skill: `.agents/skills/r3f-cad-cinematography/SKILL.md`.
- Solver: `.agents/skills/r3f-cad-cinematography/scripts/solveHudSafeFraming.ts`.
- Compatibility import: `scripts/solveHudSafeFraming.ts`.

Supplied windows mixed pre-retime and different progress domains. Frozen tuples
now match the live directors, with `progressSpace`, shatter `plateauWindow` and
ring `displayWindow` explicit. Within the active shaft narrative,
`JourneyDirector` maps `study = nativePage + .115`; manual playback uses study
progress directly. Native page progress is not physical scroll distance.

| Shot | Director progress | Native page progress | Additional clock |
|---|---|---|---|
| Shatter camera | .430–.452 | Same | Subject plateau .43008–.452 |
| Ring slow close-up | .4768–.485 | Same | Display 8–18 s; camera close-up continues to .4905 |
| Shaper plateau | .800–.832 | .685–.717 | Shaft study |
| Hob plateau | .89116–.898881 | .77616–.783881 | Shaft study |
| Stage 1 ignition | .922–.930 | .807–.815 | Camera/subject 38.5–40.2 s |

Baseline rate remains .10. The ring die budget is .15 revolutions (54 degrees);
its computed clock intentionally overrides .10 of normal for tooth readability.
Stage 1's carrier rate remains .05*pi rad/s, derived from the canonical rate
times its .5*pi normal rate.

**Normalized warp caveat:** `sampleBulletTimeWarp(1) = 1`; its derivative is
`sampleBulletTimeRate(u) / totalArea`, not the physical rate. With effective
`r = clamp(ramp, 1e-4, .45)`, `totalArea = rate + r * (1 - rate)`.
Physical-time use must scale by `cameraDuration * totalArea` and compensate
existing mechanical easing. This is documented in source and independently tested.

## Solver verification and limits

Replaced constant-depth fitting and unsafe no-free-box fallback with per-witness
perspective inequalities and a real Three.js projection check on the returned
full-precision pose. Invalid/infeasible requests throw `RangeError`. Tests cover
volumetric depth, rotated cameras, desktop/narrow 8px HUD clearance and .84 NDC,
clipping, no-free-box and insufficient-FOV cases.

This is an offline authoring solver, not a frame-loop function. It searches one
ranked free box with fixed viewing direction/standoff and .001/30m near/far planes.
Failure does not prove every framing impossible. Safety covers supplied witnesses
and rectangles only; no live GLB/HUD measurements were supplied here. Rounding or
changing a returned pose requires re-projection.

## Verification performed

Final commands all exited zero in the workspace above:

```powershell
npm run typecheck
npx vitest run src/scene/torque-wrench/bulletTime.test.ts src/scene/torque-wrench/OpeningCamera.test.ts src/scene/torque-wrench/InspectionDirector.test.ts src/scene/torque-wrench/RingInspection.test.ts
npx vitest run src/scene/torque-wrench/hudSafeFraming.test.ts src/scene/torque-wrench/OpeningDirector.test.ts src/scene/inspection/shaft/schedule.test.ts
node --test scripts/verify-torque-camera-hud.node-test.mjs
```

| Check | Final result |
|---|---|
| TypeScript | PASS, no errors |
| Requested four-file Vitest suite | 118/118 PASS: 63 contract, 10 camera, 40 inspection, 5 ring |
| Additional affected Vitest suite | 39/39 PASS: 16 solver, 12 opening, 11 schedule |
| Browser-free verifier regression suite | 6/6 PASS |

The first typecheck caught a literal-type narrowing in cascade bisection after
importing the frozen ignition endpoint; an explicit numeric annotation fixed it.
No production build, browser run, complete repository test suite, same-build
desktop/narrow runtime roster, or owner visual approval is claimed. The tighter
reverse threshold has source regression proof, not live settling proof.

## Exact next atomic actions

1. Resume document 61's pending owner review of the side-track preview; retain
   its camera/motion/meshing goal. This closeout does not authorize broad cascade
   hardening or resolve that visual decision.
2. For the next bullet-time iteration, start with ONLY the shaper contact. Sample
   installed camera and physical cutter/workpiece motion over study .795–.835
   (native .680–.720). Measure signed sweep and degrees/native-vp against the new
   60-degree and >=35-degree/vp targets. Current authored arc endpoints span
   168–192 degrees (24 degrees); existing tests do not prove the new sweep target.
3. Author that shot's full-speed contrast knees with the canonical envelope,
   area correction and inverse mechanical easing; author camera/HUD framing in
   the same bounded change. Add independent physical-rate, degrees/vp and both-
   aspect GLB-witness/measured-HUD tests. Preserve seam poses and the post-40.2s
   visual lane. Migrate the current entire-plateau .10 tests explicitly when
   introducing new knees, rather than silently changing their meaning.
4. Repeat for ring, hob and ignition one at a time. Preserve the .15-rev die
   budget. Existing ring close-up motion and legacy 18-degree ignition proposal
   are not proof of the new 45/165-degree sweep targets. These target values were
   retained, not reduced to make old authoring pass.
5. After visual direction approval, rebuild and restart the production preview.
   Run camera/HUD and cutter verifiers in full assertion mode on one identified
   build at desktop/narrow sizes. Measure both reverse errors against <1e-5;
   replace fixed-wait settling with measured settling if needed. Verify installed
   mesh speed, degrees/native-vp, actual HUD clearance and forward/reverse beauty
   hashes. Never use `--quick` as completion evidence; failures stay explicit.
6. Record runtime and owner review separately. Skill Section 6 currently says
   "four verification tiers" but enumerates three; clarify the intended fourth
   before claiming the entire matrix complete.

## Suggested skills and boundaries

Read the repo-local cinematography skill first; use `r3f-scroll-performance-guard`
and `gsap-scrolltrigger` for pacing/clocks, `spatial-hotspot-a11y` for HUDs and
`webgl-telemetry-verifier` for installed proof. The October 25 graph generation
predates these changes; verify current source and coverage.

Intentional dirty work is preserved. No staging, commit, push, deploy, protected
GLB edits or `.scratch` edits. Owner acceptance OPEN. No memory files changed.

## Ready-to-paste continuation prompt

Continue in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`. Read
`C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/62-bullet-time-contract-alignment-handoff-2026-10-27.md`,
then the repo-local cinematography skill and active document 61. Contract/config
alignment, routing, solver and verifier fixes are saved: typecheck, 118 requested
tests, 39 additional tests and 6 Node tests pass. Preserve the dirty tree,
protected assets and cascade/side-track goal; no staging/commit/push/deploy,
owner acceptance remains open. First resume document 61's pending visual review.
For the next bullet-time iteration, follow handoff action 2: measure ONLY the
shaper at study .795–.835 (native .680–.720), then author its canonical knees and
>=60-degree camera/HUD composition as one bounded change. Apply the normalized-
warp area correction and keep speed ratios distinct from revolution budgets.
Do not claim production runtime, new choreography, pixel gates or the full skill
verification matrix already passed.
