# JG-035 implementation review

Owner follow-up, 2026-10-03: corrected the Clutch Housing leader using `drawing-review/drawing-callouts-cutaway-FEEDBACK.png`. It now targets the narrow housing 6 mm beyond the ring's axial boundary, matching the green endpoint, rather than the centre of the static-clutch bounds that projected onto the Ring Switch. Moved the note and shared .004 A|E frame together into the green box. Latest drawing cache version is 4 (binary container remains v3); exact roundtrip, production build/typecheck and fresh drawing-only capture pass with zero page errors. `drawing-callouts-cutaway.png` is the updated still. Earlier opening/aperture and broad runtime reports below predate this placement-only follow-up; their unresolved animated-case failures remain open.

Owner-approved concepts are implemented. Runtime owner approval is still required. No commit, push or deployment.

Review the lit drawing in `drawing-review/drawing-callouts-cutaway.png`, trace/webbing in `opening-0.79.png`, first rupture in `opening-0.8405.png` and `opening-0.845.png`, and the lifted shaft in `opening-0.92.png`.

P003068 now uses #040404, roughness .26, metalness .98 and environment intensity 1, matching the handle. Its OD has the heavier 96 x 9 diamond normal pattern, scale 1.25, cylindrical UVs on 4,292 vertices, normalized normal encoding and smooth axial faces. Material and normal-vector tests pass.

The drawing moves Output Spindle and its total-runout frame above-left; Gearbox Housing, Clutch Housing and Ring Switch below-left with parallel leaders and 29 mm vertical label spacing; Air Motor above-right; and the profile frame under Clutch Housing, sharing its feature leader. The motor window uses a model-Y=0 local CAD section clipped to an oval at the drivetrain axis, exposing 4,070 CAD edge segments. Locked part numbers and .001 A-B / .004 A|E facts are retained. The v3 drawing cache has been regenerated and its exact HTTP roundtrip verified; see `public/drawing/jgun-sheet-v2.evidence.json`.

The blue trace has no white core. Webbing grows .75–.82. Model-first rupture remains .84–.88; studio/IBL return is .96–1, with blue portal bounce during the break. Rock walls follow the exact lip, descend 3.2 m and deviate at most 9.343 mm in deeper rings. Their far closure contributes zero pixels. The walls wait until pressure begins and render after opaque paper for depth rejection.

Static gates: 288/288 tests across 28 files, production build/typecheck, 31/31 B1/B2 checks, Stage 2 contract and diff whitespace check pass.

Fresh `drawing-review/aperture-proof.json` passes with no page errors. At t=.8405/.845/.88/.92, model contribution is 385/19,490/22,219/6,611 pixels; wall contribution is 14/1,122/6,127/15,213 pixels. Every sample has zero desk, far-closure and neutral-white shaft pixels, and valid shader programs. First rupture is dominated by the emerging model.

Full runtime verification remains OPEN. The completed six-case `optimized-runtime-roster/summary.json` records desktop/narrow animated failures (12/24), both reduced-motion cases PASS, and forced desktop/narrow lite failures (2 each). It reports quality degradation and disconnected/retired WebGL canvases; desktop additionally reports 1.727 px registered-hold error versus the .1 px gate. Forced-lite canvases are inactive at the first checkpoint. There are zero page errors across the six cases. These failures are not waived and this is not a passing acceptance packet. Earlier failed and aborted folders are diagnostic only.

Technical review here is the implementing agent's source/probe review. Independent workers failed at provider initialization (`~deepseek-deepseek-flash-latest is not a valid model ID`); there is no independent SHIP ruling for this revision. Graph metadata predates the dirty files; conclusions use live source and runtime probes.
