# Shaft StoryRuntime producer gate

Ownership: six files named in shaft-runtime-spec.md; create only. No shared modules,
registration, assets, task queue, staging, commits, or integration edits.

- [x] R1 frame mapping and GLB bounds
- [x] R2 closed-form schedule and beats
- [x] R3 current tools/progression APIs, stress, camera and light wiring
- [x] R4 measured rigid supports and independent finale clones
- [x] R5 preallocated telemetry and resource census
- [x] R6 deterministic sampling / allocation review
- [x] R7 shaft vitest suite and repository typecheck

## Delivered paths

- `src/scene/inspection/shaft/frame.ts`: mm/metre mapping, inverse, tool poses and measured narrative-rest registration.
- `src/scene/inspection/shaft/schedule.ts`: authored beat visibility, complementary wipe, support slide/holds and closed-form finale spin.
- `src/scene/inspection/shaft/shaftRuntime.ts`: synchronous StoryRuntime factory with async tier/Draco load, owned resources, current producer APIs, camera/render/light outputs, stress, supports, finale and telemetry.
- `src/scene/inspection/shaft/shaftRuntime.test.ts`: actual GLB metadata checks and no-WebGL factory/lifecycle/seek tests.
- `src/scene/inspection/shaft/schedule.test.ts`: authored boundaries, shuffled seeks, dense visibility rules and support timing.
- This gate file.

No pre-existing source or asset was edited. Factory registration/mounting remains the
parent's separately owned integration. Tools/progression were consumed through their
live exported APIs; neither shared producer file was modified.

## Evidence and implementation decisions

R1: fixed world origin `(0,0,0)` and identity orientation. The bundle's exporter has
already converted CAD metres to `(x,z,-y)`; only camera/tool CAD coordinates need that
rotation, and only CAD mm need the `0.001` scale. Progression receives the inverse
mapping composed with each mesh's unrotated rest transform. Both actual GLBs span
approved shaft Z approximately `[-0.071524, 0]`. Round trips and raw accessor bounds
are tested. Narrative neighbours use the measured `geometry/source-registry.json`
rest registration and gearbox-local TRS, never `hero.matrixWorld` or exploded pivots.

R2: `shaftBeats` controls phase/discrete changes. Sampled opacity rules are checked
at 5,161 times over 0..43 s and at each boundary on both sides. During 22.6..25 both
shaft materials are opaque and use complementary axial planes. From 32..32.8 tools
are absent and the stress field is absent. Witnesses establish by 35.5, slide starts
35.6, reaches endpoint 37.6, holds before witness fade begins at 38.6, and disappears
at 39. Narrative alpha is zero from 1.2 through the indefinite endpoint hold;
`ownsNarrative=true`, `returnBlend=0`.

R3: current `buildShaperCutter/buildHob` and progression/stress APIs are wired.
Shaper origin corrects the builder's disc y=[0,1.2] mm to the sampled stroke centre.
Near-edge envelope radius and hob centre distance are checked to better than 1e-9 m
over 2,581 times. Hob setting axis uses the 5.5587 degree lead angle. Cutter disc and
hob thread detail fade to 25% when `softened` is true; hubs/arbors keep tool silhouette.
The single restrained chip uses sampled fields. Legacy isolate stock is explicitly
zero-depth; all ten spaces remain finished for materials. Approved wipe stock uses
the infeed envelope. Completed hob progression is held during prop withdrawal.
Warm/cool overlay fields use the script sampler, isolated to their respective shafts.
Two owned neutral/grazing lights use the same follow azimuth, whose integral includes
the kinematics follow weight. Render exposure follows ring convention, env=0.35 and
near-black background. Camera mapping is tested through actual factory seeks.

R4: node transforms are identity and support poses are baked into POSITION data in
these exports. Thus the delta is derived from the union of exported accessor bounds,
including node TRS when present, rather than falsely reading zero node translations.
Both bearing and ring deltas equal +2.750 mm within 0.005 mm and have no intended
radial displacement. The approved pair has one parent translated from endpoint minus
the measured delta; its relative pose is unchanged throughout the slide. Housing
does not translate. Shaft and housing remove their camera-facing halves during
supports with darker clipped back faces as the specified cap illusion; those backs
are removed for finale. This is not a fabricated CSG cap.

Both `housing` and `approvedhousing` are accepted. `legacyhousing` is optional and
reported as present/absent; tests cover both layouts and absence. The latest producer
bundles contain `approvedhousing` and `legacyhousing`. Approved unsplit bearing stays
fixed; retaining ring follows the finale shaft spin. `racesFollow=false` honestly
reports that no separable animated inner race is available; `bearingRacePolicy` is
`unsplit-fixed`, with additive `ringFollowsShaft` and `bearingOuterFixed` fields.

Each available carrier is cloned recursively, placed at `rig.basePositions`, and
each planet is mapped to its corresponding clone. Geometry/textures remain borrowed;
materials are owned clones with narrative shader callbacks removed. Shared borrowing
is session tracked and released idempotently. Display reduction follows
`ROTATION_TURNS`; planets counterrotate at `-carrier * GEAR_RATIOS.planetMultiplier`.
`finale.assembled` is true only after 39 with all five carriers available; missing or
partial rigs remain explicitly unassembled. There is exactly one shaft in the finale.

R5: preallocated `shaft` telemetry implements the contract subtree and additive node,
carrier, softening and bearing-policy fields; `resources` reports the owned plus
borrowed census. Disposal releases only owned geometry/materials/textures. Narrative
originals are not modified; the runtime reports zero original nodes hidden by itself
(the host owns narrative visibility/restore and its global hidden-count probe).

R6: full runtime frame, camera, render, telemetry and object-state digests are identical
after 240 shuffled seeks. Frame/camera/vectors/render/telemetry/census identities stay
stable. A TypeScript AST test checks sample/apply/telemetry and their direct sampler
surfaces for allocation syntax (new objects, array/object literals, closures).
This plus source review proves explicit allocation-free code paths, not a measured
browser heap guarantee. No-WebGL factory fixtures parse actual GLB metadata into baked
bounding meshes and stub only GLTFLoader.parseAsync; actual Draco/GPU decode is not
claimed. Cancellation before fetch completion and during late parse, current failure,
idempotent disposal, untouched originals and shared-resource survival are tested.
Pending Draco workers remain alive until parse completion, then stale results and
the decoder are disposed so cancellation cannot strand the ready promise.

## Verification

Final run 2026-10-05, 23:20 local:

- `npx vitest run src/scene/inspection/shaft`: PASS, 7 files / 90 tests, 5.56 s.
- `npm run typecheck`: PASS, `tsc --noEmit` exit 0.

An intermediate loaded run hit existing camera-test and new dense-schedule test
timeouts; the schedule test now aggregates dense-rule violations instead of doing
over 100,000 assertion calls. Two subsequent full runs passed with the requested
unmodified command. The concurrent legacyhousing export also invalidated a test's
old absence assumption; the fixture now explicitly tests both optional-node cases.

Latest asset snapshot consumed/read, not modified by this leaf:

| Tier | Bytes | SHA-256 |
|---|---:|---|
| full | 678008 | `17f90d73a8312bb9b91b3e4468ea3a598e046df0897714091243fed6722183be` |
| lite | 415424 | `b38b91fa4371a1f04c28214ed5d6aaf8d97ffedb3e099d8eadea691c09200e6f` |

Graph coverage was checked for source/evidence paths. The available generation is
2026-09-30 and does not track the new modules; conclusions above are from direct live
source and actual GLB metadata, not a completeness claim from that older graph.

## Existing-module defect / integration hazard

`src/scene/inspection/shaft/kinematics.ts:412` and `:413` transfer live tool hobYc/hobA
into progression. `:492` samples withdrawal. Passing these unchanged through
30.2..32 would restore stock as the hob retracts and withdraws. The runtime locally
holds the completed swept envelope (y=9.5249, full-depth A) from 30.2; the tool still
uses current kinematics. Existing module remains untouched, and withdrawal regression
tests cover 30.2, 30.8, 31.2, 31.8 and 31.999.

## Remaining parent/browser proof

Parent must register/mount the factory and own `renderer.localClippingEnabled=true`
during inspection, restoring it afterward alongside other renderer state. Three.js
material clipping planes require this renderer flag; runtime does not change shared
renderer configuration. Compile/warm-render ownership also stays with the host.

Browser proof belongs to the parent after registration/mounting. This producer does
not claim shader compilation, visual/camera acceptance, GPU allocation measurements,
clearance, or narrative restore proof from no-WebGL tests.

Required remaining checks: full/lite actual Draco loading and shader warm compile;
clipping/wipe/section/back-face appearance; progressed normals/contact/chip placement
and complete-tool clearance during cut/return/withdrawal; camera framing and card
slot at desktop/narrow sizes; visible support holds; planet tooth clocking/alignment;
exploded and blueprint entry -> independent assembled finale -> exact Return/Escape
restore; context-loss/cancel/re-entry disposal and browser heap/census stability.

- [x] R8 (2026-10-05): shaft-runtime-review-glm FIX-FIRST findings and shared progression hazard corrected. F1 / R3 correction (supersedes the earlier disc-origin justification): tools.ts already centres the 1.2 mm disc at y=[-0.6,+0.6] mm, so the root now sits at strokeCentreY without the erroneous -0.6 mm offset; the actual rake face matches edgeY/chipY, reaching 10.3749 mm (0.5 mm beyond the last material at 9.8749 mm). F2: writeShaftProgression counts cuts preceding the nearest current crossing in closed form without allocations, including samples before that crossing; all 10 spaces on passes 2-4 retain previous depths 0.25/0.50/0.75 ahead of the edge, with CPU-radius and shader-uniform regressions and 781 actual runtime material samples. F3: the owned hob-thread InstancedMesh is disposed exactly once on loaded-session disposal and cancellation during late parse; geometry/material disposal remains exactly once and shared-resource survival tests pass. Withdrawal hazard (supersedes the earlier runtime-local workaround): writeShaftProgression holds the completed swept envelope at yc=9.5249 mm and A=10.29182859636582 mm from 30.2 s, while live tool motion remains unchanged; the runtime-local hold is removed, and shuffled withdrawal probes compare all 101 face-band radii against the completed envelope. Regression-first run exposed all four defects; corrected dense/actual-disc placement, prior-depth, instance disposal and shared-writer withdrawal regressions pass without weakening existing checks. Verification: `npx vitest run src/scene/inspection/shaft` PASS, 7 files / 98 tests, 7.70 s, exit 0; `npm run typecheck` PASS, `tsc --noEmit`, exit 0. Only frame.ts, shaftRuntime.ts, shaftRuntime.test.ts, kinematics.ts (writeShaftProgression only), kinematics.test.ts (additions only) and this appended gate entry changed; parent SHAFT_BEAT_LABELS/out.phase edits preserved. No git commands or queue-doc reads; browser/owner proof remains with the parent.
