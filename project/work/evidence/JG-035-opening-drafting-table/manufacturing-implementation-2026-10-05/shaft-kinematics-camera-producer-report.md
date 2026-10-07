Done — the leaf spec is executed end to end, all gates green, and only the five owned files exist.

**What was built**

- [kinematics.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts) — the machining-time map m(t) (normal 2–6 s, slow 7.2–9.6 s at 0.22×, 4× recap 11–15 s, eased to zero at 15.0, hobbing window 25–32), shaper kinematics on the certified numbers from `toolSpec.ts` (ratio −2, stroke centres 2.17→9.7749, edge peak 10.3749 = 9.8749 + 0.5 overtravel, 0.565 mm room to the groove wall, infeed to root+5 µm in the first quarter orbit, 2.0 mm relieved return), tooth-space depth as counted cutting crossings, the hob path (yc −4.195 → 9.5249, retract 2.5, withdrawn clear by 32.0), the restrained seeded chip, the frame-follow azimuth, and the 7.5 Hz display-rate guard with its `softened` flag.
- [camera.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.ts) — authored anchor curves (blockout positions re-centred on the certified tool geometry) composed with the live follow azimuth: a quarter-orbit follow over 2–6 s, C1 handoff into the fixed macro at 7.2 s, recap re-engage and pull-back, materials side view holding the card slot clear (right 8–44% desktop, bottom band narrow), then revised-blank, hobbing, runout, support, and finale framings.
- [kinematics.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts) and [camera.test.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.test.ts) — K1–K5 including a brute-force crossing oracle, pitch-point velocity (recorded tolerance 1e-12, observed exactly 0), 32.0 s hob clearance, PerspectiveCamera safe-frame projection at 1440×900 and 390×844, and shuffled-seek determinism.
- [shaft-kinematics-camera.md](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/shaft-kinematics-camera.md) — the K1–K6 gate record with commands, results, and unresolved items.

**Verification**

- `npx vitest run src/scene/inspection/shaft` → 5 files / 63 tests passed (includes the three pre-existing sibling suites, untouched).
- `npm run typecheck` → clean.

Three defects were caught by the tests and fixed in flight: my closed-form pass count assumed counted crossings 2 m-s apart when the cutting/return alternation makes them 4 m-s apart (now 4 passes, completing all ten spaces ~12–12.9 s inside the recap); the hob spin-down integral used `1 − ∫S` instead of `u − ∫S`, briefly reversing φ_h; and the recap→materials move needed a wide intermediate anchor because the up-vector roll overlapped the target shift.

**Left open, by design**: the `softened` flag fires during the recap (cutter gashes hit 20 Hz at 4×) — the renderer must blur/fade repeated features when it mounts the props; hob fade-out on withdraw is likewise a renderer concern; camera anchors are authored framing, so runtime owner visual acceptance stays open as it is for the rest of JG-035. No git operations were run.