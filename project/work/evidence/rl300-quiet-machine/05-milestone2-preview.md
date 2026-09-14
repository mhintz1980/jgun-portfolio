# JG-033 — Milestone 2 review checkpoint

Status: implementation checkpoint; **owner visual acceptance pending**. This is the exterior/section/lower-intake blockout requested before detailed modeling in the approved plan. Milestones 3–6 and publication remain separate.

Open the built preview at <http://localhost:4173/?study=rl300>. Buttons select Exterior, Section, and Lower intake; the range control and native scroll move reversibly between them. `&quality=lite` selects the cheaper rendering path; `&quality=poster` shows the captured views. `&shot=.52` opens the section directly. Video and full-page captures are in `output/playwright/quiet-machine/`; the three fallback images are committed under `public/images/rl300-*-preview.png`.

## Implemented direction and source choice

- Use the shipped webexport-family GLB as the measured prototype input. Its loader-expanded occurrence count is **415,892 triangles**, unlike the prep pack's 293,231 unique-mesh count. The photoreal family was assessed in Milestone 1 but is not needed for this blockout; its detail/export decision remains open for later closeups.
- Keep the source GLB and all `.blend` files unchanged. Build an owned runtime derivative with 23 root/material batches from 581 loaded mesh primitives. Preserve CAD hardware and equipment identity. Repaint shell-role yellow surfaces blue; keep equipment yellow. The named liner (108 triangles) is replaced, and the 28-triangle airway helper is excluded from visible geometry. All other source triangles are conserved.
- Use an isolated, lazy-loaded review route with a demand-rendered stencil-enabled canvas and local three-view evaluator. No original scroll, JGUN mechanics, stage window, or composer code changes. Default document height remains 3120vh; full narrative-progress separation and extension belong to Milestone 3.
- Keep the same plane reference on both stencil counters. `Material.clone()` clones clipping planes: reassigning the front counter to the live plane fixed the demonstrated broad false fills. Render counters/caps before the visible shell and clear stencil between groups. Size cap surfaces from measured geometry bounds.
- Restrict stencil counting to closed, consistently wound CAD components (153,998 section triangles). The other 47,390 section triangles are retained as clipped surfaces but excluded from stencil counts; they are not certified solid volumes. This is not a blanket manifoldness or final wall-construction claim.
- Replace `V2RL300-SAF-1047-5` at the measured web Y-up footprint, with real louver gaps. Add a proposed open-side collector, shallow duct, under-engine outlet, and two static schematic supply traces. Six prototype supports align with the source isolation-mount coordinates. Geometry is a design blockout, not manufacturing CAD or simulation.
- Compose desktop and portrait framing independently. Reduced motion holds the section and allows explicit controls. Asset failure and context loss return to captured exterior/section/intake views.

## Verification

`05-milestone2-runtime.json` contains build identity, source SHA-256, renderer identity, all view states, pixel comparisons and performance samples. `05-milestone2-smoke.json` contains direct-navigation/reload, native forward/reverse and original-portfolio smoke evidence.

- `npm run typecheck`, `npm test` (53 tests), `npm run check:station2`, and `npm run build`: PASS.
- 1440×900, 768×1024, 390×844 full; 390×844 lite: live canvas, 8 stencil bits, no application console errors.
- Forward/reverse exterior and section captures: identical pixels in every tested viewport/tier. Cap-on/off comparisons affect only the visible section edge (about 0.15–0.24% of the stage). Closed-exterior delta is zero desktop/tablet and 3 antialiasing-edge pixels in portrait/lite.
- At the section hold: **80 render calls full / 47 lite**, including extra passes; **1,143,106 / 725,562 submitted triangles**. Kept CAD occurrence geometry is 415,756 triangles. Submitted-pass cost must not be confused with unique/visible geometry.
- Runtime identified **AMD Radeon 780M via ANGLE/D3D11**. The initial validated sweep sampled roughly 16.7 ms median / 17.1–17.3 ms p95 request-to-render response; CPU render calls were around 1.1–1.9 ms median. These are preview-local, 60 Hz browser observations, not GPU timer queries or real-phone performance. Final raw samples are authoritative.
- No frames rendered during idle sampling. Keyboard range input, reduced-motion fixed pose plus manual views, resize, direct entry/reload, native forward/reverse, forced context-loss event fallback, explicit poster tier and failed-asset fallback: PASS.
- Original portfolio smoke: original canvas active at p≈.47, fully exploded wrench with handle −.354 m, output +.050 m, original driveline offsets, stage alpha [1,0,0], document height 31.2 viewports. No preview surface mounted on the normal route. This is a smoke test plus unchanged-source boundary, not a rerun of every historical JGUN interaction gate.

## Remaining limits and next move

This preview does not validate the existing postprocessing composer's stencil target, MSAA resolve, production handoff, or the old lite-tier anomaly. The 250k-triangle lite asset target is not met; lite currently reduces DPR/shadow cost while retaining CAD detail. Real mobile GPU behavior, full accessibility audit, complete context restoration, manufacturing collisions and full seven-shot integration remain later work. Context-loss testing dispatches the event to exercise fallback; it is not evidence of driver recovery.

The existing JG-032 panel-lift assertion remains stale/red in the default route; its behavior is unchanged here. Its old contract debt will be deliberately migrated when JG-033 replaces Station 2. Do not mark JG-032 or JG-033 verified on this preview's checks.

**Next:** Mark rules on the blue exterior, the open section, and the underside blockout. The approved plan says: “Present these to Mark before full detail modeling; resolve a rejected direction here.” On acceptance, implement the documented local/narrative progress architecture and seven-shot sequence, then refine the proposed duct and wall construction. Do not publish from this checkpoint.

## Delegation and cost evidence

Parent retained source selection, numerical geometry logic, material scope, camera/section architecture, integration, edits and all acceptance checks. Native `/root/stencil_feasibility` was requested on `gpt-5.6-terra` / `high` for read-only installed-dependency inspection and a subsequent bounded cap diagnosis. It confirmed the framebuffer/composer constraints and callback support; its ordering hypothesis did not explain the observed artifact. Parent's live A/B isolated the cloned-plane reference defect and fixed it. No delegate edited code.

Parent model/effort and realized delegate model/effort were not exposed by the native result/status tools. Requested settings are not runtime confirmation. Fresh final review is recorded separately. Native token usage was unavailable; no API-equivalent dollar total or savings is claimed. Unknown usage is not zero and is not a statement about subscription charges.
