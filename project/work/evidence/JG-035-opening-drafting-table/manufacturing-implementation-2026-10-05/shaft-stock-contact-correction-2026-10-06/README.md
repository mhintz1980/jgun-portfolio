# Shaper stock-contact correction — 2026-10-06

Source ownership released to parent. Changed only `src/scene/inspection/shaft/kinematics.ts`
and `kinematics.test.ts`, plus this new correction evidence. No progression/tool/CAD/camera
source changes, browser/GPU runs, builds, servers or gate checkbox edits.

## Defect and correction

The old schedule counted space3 at machining m0.1 (playhead2.512274), although the cutter
leading face was only y2.771876 mm, below the actual tooth-stock start y3.1749 mm.
Corrected samples2.50,2.512274,2.52,2.55 now retain all-zero depth and engagedSpace=-1.

The ten first events are computed once from the certified cosine stroke. Each selected
cutting revolution has one event at its centre crossing or the closest actual face contact
inside the SAME nearest-space sector (±0.1 machining seconds). Events repeat every4
machining seconds; four events produce the retained depths0.25/0.5/0.75/1. Module startup
checks actual face range, cutting phase, nearest-space identity and radial contact.
An interior offset1e-9 machining seconds keeps acos/cos roundoff inside the exact face;
no geometry limit, existing assertion tolerance or motion parameter was changed.

The frame's stock engagement now requires y3.1749..9.875 mm and radial infeed. Groove
overtravel remains unchanged tool motion and cannot create tooth depth or chips.
`writeShaftProgression` derives ahead-edge previous depth from contact events BEFORE the
current stroke's stock entry, replacing the retired angular-crossing history.

This is an illustrative four-pass retained-depth depiction, not a continuous generating
surface simulation or certified process. The exact machining map, signed ratios, stroke,
backoff, accepted leadout/exit geometry, hob law and7π/16 camera-follow integral remain.
No per-frame arrays/objects, accumulators, clocks or random values were introduced.

## Event table

Later events are first_m +4k, k=1,2,3. `causal-sweep.json` contains all40 exact event
times/poses, found by55-step bisection of observed gains independently of the producer table.

| Space | First machining m | First playhead t | Final playhead t |
|---:|---:|---:|---:|
|0|3.5|6.000000|12.946500|
|1|1.7552923361|4.255292|12.510323|
|2|1.9|4.400000|12.546500|
|3|0.1552923361|2.606272|12.110323|
|4|0.3|2.791929|12.146500|
|5|2.5552923361|5.055292|12.710323|
|6|2.7|5.200000|12.746500|
|7|0.9552923361|3.455292|12.310323|
|8|1.1|3.600000|12.346500|
|9|3.3552923361|5.855292|12.910323|

Every event's leading face is either3.1749000134 or6.6918878409 mm (inside actual stock).
All ten complete inside11..15; first all-complete sweep sample12.9465104167 s.

## Verification

- `npm test -- --run src/scene/inspection/shaft/kinematics.test.ts src/scene/inspection/shaft/progression.test.ts src/scene/inspection/shaft/camera.test.ts --maxWorkers=2`:
  **60/60 pass, 3/3 files** (kinematics27, progression21, camera12).
- `npm run typecheck`: **exit0**.
- `node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-stock-contact-correction-2026-10-06/check-causality.mjs`:
  **PASS**,249,601 samples at19,200 Hz;40 gains; zero stock/nearest/radial/retention/
  prior-event/ahead-mask failures.167,591 wholly-disengaged intervals each checked at
  both ends and three interior points retain depth.97,777 return samples preserve
  partial stock. Maximum ahead-mask error2.22e-16 (original12-decimal tolerance preserved).
  The helper independently rebuilds cosine-stroke stock contact and nearest space,
  and compares previous depth against observed event history, not `countedPasses`.

An initial old-oracle test failed as expected because it still counted premature centre
crossings. It was replaced with an independent numerical face-entry solve. A dense test
initially hit Vitest's5-second timeout; aggregating identical failure predicates removed
assertion overhead. Timeout and numeric tolerances were not increased.

## Static capture equivalence

`static-source-equivalence.json` saves every field of BOTH `sampleShaftKinematics` and
`writeShaftProgression` before/after at8.4,17,25,32.4,34.2,35.8,38.2,42.5.
**All eight outputs are exactly equal.** Old source is the exact recovery file at
`C:/Users/Markimus/Documents/Codex/recovery/jgun-portfolio-20261006-030424/worktree/src/scene/inspection/shaft/kinematics.ts`,
SHA2564509f6b247efc40b428c37ad4a8925add3a944c1e4d16fd978f62101d6cd874a.
Both comparisons use the same current progression/tool dependencies. This proves source
equivalence at those still times; static worker must separately audit renderer, geometry,
camera and original capture provenance before reusing pixels.

Final kinematics SHA256:
`2f78847da8cc70b350c7f22eed2c899d6289100f94011dc87533f1dd337bd893`.
Final kinematics.test SHA256:
`dc5b5ee2fec9ffd6a043bb83da476a05d63a2a038dc1fd8f17bbeece54923a53`.
Other input hashes and helper hash are recorded in `causal-sweep.json`.
Parent full-suite/build/fresh runtime proof and browser/owner gates remain open.
