# Gate: shaft machining kinematics and camera curves (JG-035 leaf, 2026-10-05)

Leaf spec: `shaft-kinematics-camera-spec.md` (same evidence folder). Producer scope honoured:
created only the five owned files; no shared scene file, registration, mount, or git operation.

## Files created (complete change set)

- `src/scene/inspection/shaft/kinematics.ts` — machining-time map m(t), shaper/hob kinematics, tooth-space progression, chip, frame-follow azimuth, display-rate guard.
- `src/scene/inspection/shaft/kinematics.test.ts` — K1–K4 + determinism/purity tests.
- `src/scene/inspection/shaft/camera.ts` — authored camera anchor curves + follow-azimuth composition.
- `src/scene/inspection/shaft/camera.test.ts` — K5 continuity/framing/determinism tests.
- `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-kinematics-camera.md` — this gate.

## K1 — machining-time map m(t): PASS

Monotonic and C1 over a dense 1/240 s sweep of 0..43 s (rate continuous; max forward-difference
deviation from dm/dt below 2e-4). Structure: normal rate 1 on 2..6 s; eased slow interval
7.2..9.6 s at rate 0.22 (2.4 s of stable-camera slow action inside 6..11, >= the 1.2 s floor);
recap 11..15 s at 4x (visibly time-compressed, eased down to 0 by 15.0 s); frozen 15..24.6 s;
hobbing window advances at 1. The shaper exit stroke peak (phase 0.5, yc = 9.7749, edge
10.3749) lands exactly at t = 8.4 s, the centre of the slow window.

## K2 — shaper kinematics and progression semantics: PASS

Signed ratio phi_w = -2 phi_c (toolSpec SHAPER_SIGNED_RATIO, clearance-v4). Signed pitch-point
relative velocity with the tool-conventions pitch circles (work r 5 mm, cutter r 10 mm,
contact at work +Z): 5*omega_w + 10*omega_c = 0, recorded tolerance 1e-12 mm per machining
second (observed exactly 0 in IEEE double). Stroke stays within certified centre limits
2.17..9.7749; max leading edge 10.3749 = report legacy_teeth_end_y 9.8749 + overtravel 0.5,
leaving 0.5651 mm to the groove wall (10.94). Radial infeed OD -> root + 5 um within the
first quarter cutter orbit (1 machining second), then holds. Relieved return backed off the
full 2.0 mm with a ~0.96 s full-backoff plateau inside the slow window (>= 0.4 s unmistakable
clearance). Every space depth equals a brute-force oracle that enumerates mesh crossings and
keeps only those inside the cutting half (crossings alternate cutting/return because
WORK_REV_M / STROKE_PERIOD_M = 2.5; counted passes sit 4 machining seconds apart, 4 required).
All ten spaces complete between ~11.97 s and ~12.9 s (inside the recap, before 15.0 s), none
gains depth before its first counted cutting crossing, depths are monotone and clamped to 1.
engagedSpace/edgeY match progression.ts semantics; writeShaftProgression round-trips mode,
depths, engagedSpace, edgeY, hobYc/hobA/hobR into a caller-owned ProgressionState.

## K3 — hob kinematics and 32.0 s clearance: PASS

Certified path: hold yc -4.195 through infeed, feed +Y to yc 9.5249 by 30.2 s at centre
distance 10.1618, retract 2.5 mm radially by 31.0 s (A 12.6618), withdraw to yc -8. At 32.0 s:
radial clearance to the blank OD = 12.6618 - 5.87 - 6.0835 = 0.7083 mm (>= 0.5) and the tilted
envelope top y ~ 0.53 mm is >= 0.5 mm below face start 3.1749 (axially out of the runout band).
Work coupling phi_w = -phi_h/10 (RH one-start, shaft +Z contact = tool -Z side; derivation in
the module header); phi_h monotone with eased spin-up/down, no reversal at the 30 fps floor.

## K4 — chip and display-rate guard: PASS

One restrained chip at the rake face only while stock is removed (cutting half, edge within
the stock band, radial infeed engaged): closed-form position/curl/opacity from stroke phase
with the documented CHIP_SEED offsets, direction-correct (-X, matching surface motion at the
mesh), opacity exactly 0 during the return. Guard: strokeHz/gashHz derived from the live rate;
`softened` is exactly the predicate (stroke > 7.5 Hz or gash > 7.5 Hz); whenever not softened
both stay <= 7.5 Hz (30 fps / 4). The flag fires during the recap (cutter gashes 20 Hz at 4x;
stroke 5 Hz stays inside), and never during normal shaping (5 Hz) or hobbing (10 flutes x
0.5 rev/s = 5 Hz). Displayed rotations never reverse at the 30 fps sampling.

## K5 — camera continuity and framing: PASS

C0 across 0..43 s at 1440x900 and 390x844 (1/240 sweep: bounded position/fov/up steps, unit
up vector). C1 through the follow-to-fixed handoff at 7.2 s (second differences <= 5e-5 m and
<= 0.02 deg; follow rate ~0 at 7.2 s; follow weight is 0 before the cutter edge reaches the
face end 9.875 during the exit stroke). Follow spans exactly a quarter orbit (pi/2) over
2..6 s; the recap re-engages the same law (slow apparent orbit ~0.25 rev/s while the camera
orbits 270 deg). Shaft axis and cutter exit region (face end, groove floor/wall, exit
overtravel corner, chip origin) stay inside the 8% safe frame (|NDC| <= 0.84, projected with
a three.js PerspectiveCamera) at 18 key beats on both layouts. Materials beats hold the card
slot clear: desktop shaft content <= 56% frame width (card band right 8..44%), narrow content
above the bottom card band. Finale framing settled for >= 1.5 s. Bitwise determinism under
shuffled seeks.

## K6 — commands and results: PASS

```
npx vitest run src/scene/inspection/shaft
  Test Files  5 passed (5)   # kinematics, camera + 3 pre-existing sibling suites
       Tests  63 passed (63)
npm run typecheck
  tsc --noEmit -> clean (no errors)
```

## Unresolved items and renderer contracts

- `softened` is a contract: during the recap the renderer must blur/fade repeated cutter
  features (gashes 20 Hz at 4x) and the fast apparent work spin; the sampler only reports it.
- The hob is kinematically clear and out of the runout band at 32.0 s; fading the prop on
  withdraw is the renderer's job (no opacity in this leaf).
- Depth accrual is 4 counted cutting passes per space (illustrative multi-pass depiction;
  plan section 4: the deliberate slow interval/readable beat is artistic compression, not a
  machine cycle-time claim).
- Camera anchors start from camera/blockout.json (desktop + 390x844) re-centred on the
  certified tool positions; they are authored framing, and runtime owner visual acceptance
  remains open like every other JG-035 gate.
- No git operations were performed; nothing outside the five owned files was written.

## K7 — Sol review fixes (fix spec `shaft-kinematics-camera-fix-spec.md`): PASS

Independent GPT-6.1-Sol review (`shaft-kinematics-camera-review-sol.md`, FIX-FIRST): all three
findings fixed without weakening any existing test; one new test added per finding. Only the
four owned code/test files and this gate were touched.

- **P1 C1 startup (kinematics.ts).** Inserted an eased-onset rate segment 2..3 s (0 -> 1,
  smoothstep, so m(t) is C1 at both ends of the ease; full normal rate resumes at 3 s).
  m(6) 4 -> 3.5 machining s. Slow-exit goals unchanged: slow window still 7.2..9.6 s at rate
  0.22, exit stroke peak still exactly t = 8.4 s (derived `STROKE_PHASE_OFFSET`), clear
  relieved-return plateau 0.842 s (>= 0.4), all ten spaces still complete inside the recap at
  ~12.95 s (< 15.0). New test `is C1 at every rate-segment boundary`: one-sided finite
  differences on half-step-offset intervals at every `MACHINING_RATE_BOUNDARIES` time plus a
  straddling central difference vs dm/dt, tolerance 0.02 (observed worst 5.6e-3 asymmetry,
  2.2e-4 central). The old 0 -> 1 step at 2.0 s fails it by ~1.0 (asymmetry) / ~0.5 (central).
- **P2 materials settle (camera.ts).** Transition moved from 15 -> 15.4 -> 16.2 s into the
  recap end 14 -> 15 s (single smoothstep; up-vector rotation moved from 15.2..16.2 s to
  14..15 s; the settled hold now spans the whole materials beat 15..22.6 s). Position, target,
  up and fov are constant (observed delta 0.0, bound 1e-9) from t = 15.0 s (first card
  visible) through 22.6 s, so the camera is settled before the first card's full opacity at
  15.14 s. New test `settles the materials view from 15.0 s` sweeps 15.0..22.6 s at 1/240 in
  both layouts; the materials slot test now samples 15.0/15.14/16/17.8/20.3/22.5 s (was 16 s
  onward). Key-beat coverage extended with a mid-handoff beat at 14.5 s; the 15.5 s beat span
  set to the materials-era [3.2, 14.2] mm (the old [3.2, 19.2] belonged to the removed
  wide-fov mid-transition state).
- **P2 final-card band (camera.ts).** New card-safe runout framing settled 33.2..35 s, reached
  by a 32 -> 33.2 s move while no card is on screen: desktop target y 12.8 -> 18.5 mm and fov
  6.3 -> 7.6 deg; narrow target y 8.7 -> 9.0 mm and fov 16.5 -> 17.5 deg. Shaft axis
  (y 3.2..20 mm) plus revised-section envelope (journal r 6.325 discs over y 9..20) project to
  desktop NDC x <= 0.0916 (card band starts at 0.12) and narrow NDC y >= -0.207 (bottom band
  starts at -0.3); the review's probe (0, 19.2, 0) moves 981.4 px -> 743.6 px, left of the
  806.4..1324.8 px band. New test `keeps the shaft and revised section outside the final 4340
  card band through 33.2..35 s` covers both layouts; the 33.5 s key beat span extended to
  [3.2, 20] mm.

Commands rerun after the fixes:

```
npx vitest run src/scene/inspection/shaft
  Test Files  7 passed (7)   # this leaf's kinematics+camera suites (30 passed, 3 new) + siblings
       Tests  94 passed (94) # K6 recorded 63 in 5 files; sibling suites grew concurrently
npm run typecheck
  tsc --noEmit -> clean (no errors)
```

## K8 — Follow-integral regression after the eased startup (fix spec `shaft-follow-fix-spec.md`): PASS

Sol's re-review (`shaft-kinematics-camera-rereview-sol.md`) confirmed all three K7 fixes but
found one regression: the follow integral still assumed the retired linear startup while
machining eases in over 2..3 s. Scope honoured: only the four owned code/test files and this
gate were touched (filesystem mtime check); the other producer's `writeShaftProgression`
F2/withdrawal logic is untouched; no git operations.

- **Follow integral (kinematics.ts).** `followMfAt` now integrates the eased startup
  analytically (mf = easeIntegral over the 2..3 s unit window, weight 1): mf(3) 1.0 -> 0.5,
  mf(6) 4.0 -> 3.5, and every downstream constant shifts by the same 0.5 machining s
  (MF_AT_SLOW_START 4.479657142857 -> 3.979657142857; FOLLOW_MF_TOTAL 16.479657142857 ->
  15.979657142857). The retired code doubled the documented law rate at 2.5 s (pi/8 =
  0.392699 rad/s vs FOLLOW_GAIN x followWeight x machiningRate = pi/16 = 0.196350 rad/s)
  and overshot the azimuth by exactly 11.25 deg from 3 s onward — both eliminated. The
  2..6 s azimuth span is now the law integral 7*pi/16 = 78.75 deg (was pi/2); with weight 1
  across 2..6 s, mf equals m(t) exactly there (asserted).
- **FOLLOW_AZIMUTH_MOD (camera.ts).** G x FOLLOW_MF_TOTAL now lands at 6.2751966859 rad
  (359.5423 deg, just under 2*pi). The old [0, 2*pi) wrap left the post-15 anchors a full
  turn from the live pre-15 curve and forced the 14..15 s anchor blend through a near-full
  cancelled turn (C0 step 0.0050005 > the 0.005 bound). Wrapping to the nearest turn
  (-0.4577 deg; a no-op for the old 10.7923 deg value) restores the authored machine
  azimuths exactly and the C0 bound passes on both layouts. No ANCHORS values changed: the
  machining-era camera machine azimuth rotates by up to 11.25 deg toward the mesh and every
  safe-frame bound still passes unchanged (18 key beats + dense sweeps, both layouts); all
  post-15 s machine azimuths are identical to before.
- **Tests (kinematics.test.ts +4, camera.test.ts 1 updated).** (1) eased-startup integral:
  mf(3) = 0.5, mf(6) = 3.5, mf = m(t) on 2..6 s, span 7*pi/16; (2) dense finite-difference
  derivative of the follow azimuth vs the documented law across 2..15 s (1/240 grid,
  h = 1/480; observed worst 6.8e-6 rad/s, tolerance 0.005 — the retired linear code fails
  by ~0.196 rad/s throughout 2..3 s); (3) the same law through half-step-offset one-sided
  and straddling intervals at every rate/weight boundary in [2, 15] (2, 3, 6, 7.2, 9.6, 11,
  12, 14, 15; h = 1/48, 1/96, 1/161; observed worst 1.7e-4 rad/s); (4) FOLLOW_MF_TOTAL
  equals a 1/960 trapezoid of the law (error ~1e-14) and G x total < 2*pi. The camera
  quarter-orbit test now asserts the exact 7*pi/16 law span instead of the retired pi/2.

Commands rerun after the fix:

```
npx vitest run src/scene/inspection/shaft
  Test Files  7 passed (7)
       Tests  102 passed (102)  # 4 new K8 tests; sibling suites grew again since K7 (R8)
npm run typecheck
  tsc --noEmit -> clean (exit 0, no errors)
```
