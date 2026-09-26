# JG-035 handoff B — cinematic rebuild in progress (2026-09-25, session d064257d)

The owner rejected the previous agent's work (handoff `handoff-2026-09-25.md`, commits
`2c21415`/`e125f03`): the opening scene and the background drawing are "horrible" and must be
**redone completely**, and the CH.01/02 GD&T leaders are a cluster. Wanted: a movie-like
opening, influence from https://oryzo.ai (warm physical desk scene, big confident type,
scroll-scrubbed camera), and GD&T callouts that appear **one at a time** with **animated
leaders** pointing at what they reference. Creative freedom granted. Facts: fact sheet v2,
`project/work/inbox/JG-035-tolerance-stations-facts.md` (LOCKED; do not re-ask).

**TREE STATE: DOES NOT COMPILE YET.** `drawingGeometry.ts` was rewritten; `DrawingLinework.tsx`
still imports the removed raster API. Nothing from this session is committed. Other sessions'
uncommitted `src/scene/rl300/*` edits are in the same checkout — never commit/revert those;
stage only JG-035 files explicitly.

## Diagnosis (why the old one was bad — measured)

- Views were 1:1 world metres (~0.44 m block) centred on a 2.6 m sheet → ~85% empty paper.
- All linework = one 1-px weight baked into a 3520×2720 raster → flat and soft up close.
- `CameraRig` blended the projection to an orthographic matrix with a FIXED half-height
  (`fitDistance`), so the "reading pan" zoom never actually zoomed.
- Fresh load at 1600×900: sheet renders off-frame (JG-034 still live). Baseline captures:
  `.scratch/cine/before/p0.png`, `p0_3.png`.
- CH.01/02 hotspots (`src/scene/Hotspots.tsx`) all render at once as DOM badges with an
  auto-stacking registry → the cluster.

## Design being built

### Track A — "The drafting pass" (intro, intro-t 0→1 = paced progress 0→0.12)
- **Vector sheet, not raster.** 0.80×0.50 m (~ANSI D) so real pen widths/letter heights apply.
  Side view TRUE 1:1 (registration with the lifting model), top / section A–A (half-section
  through the drivetrain axis, hatched) / front / rear / bottom at 1:2, DETAIL B (ring switch),
  C (output spindle), D (planetary stage, from the section) at 2:1 in circles. Zone border
  1–8 / A–F, title block (PTG-HP-1000 / REV 03 / INCHES / third-angle symbol), revision table,
  general notes (all locked facts, inches), reference dims measured from the GLB, leaders to
  named parts, datum A flag, FCFs (total runout .001 A-B on output; profile .004 A E on fork).
- **Lines ink themselves in** as the camera passes (per-group reveal uniforms; each segment
  draws start→end; wet-ink head). Scroll back retracts.
- **Camera**: perspective dolly, low and tight on the title-block lettering at t=0, crane up
  past DETAIL B into the notes, track the top band (section hatching fills), rise to an
  establishing frame, descend square-on to the side view and blend to orthographic by
  `pulseStart` (ortho frustum now sized to the live look-at distance → no framing pop). Then the
  existing pulse → rise/extraction → shockwave → hero handoff are kept.
- Paper: procedural vellum + fibres + pale graph grid inside the frame + warm lamp pool that
  follows the look-at point; dark walnut desk plane beneath with a soft sheet shadow (oryzo
  physicality). Optional later: pencil / steel-rule props, DOF (postprocessing) on the opening.
- DOM opening titles (oryzo-style large type) in the reserved onboarding window t 0.05–0.40.

### Track B — tolerance stations (NOT STARTED)
Replace CH.01/02 hotspots `rotor`, `motor-housing`, `flange`, `gearbox-housing` (keep CH.03
acoustic + CH.04 electronics hotspots untouched; keep rotor "BALANCED VANE ASSEMBLY" as a
light note; flange flatness .0008 folds into S1). One station at a time:
anchor reticle draws → leader draws out (stroke-dashoffset) to an elbow + shelf → FCF builds
cell-by-cell with vector GD&T glyphs → part name + one-line process note types in → huge faint
background process type (render it IN-CANVAS as camera-locked troika text behind the model so
the model occludes it) → everything retracts before the next station. Cream ink `#efe6d0`
on the dark scene (navy is unreadable there — answers fact-sheet §4 Q3), warm amber anchor.
Proposed windows on PACED progress (measured timeline below):

| Station | Progress | Anchor (rig unit, follows explode via unit.matrixWorld) |
|---|---|---|
| S4 fork profile `⌓ .004 A E` | 0.128–0.178 | `rig.clutch.sliding` (fork) OD top — camera is already close on the clutch shift here |
| S5 clutch fit `⌀2.525 H7/k6` + `⌰ .001 A` | 0.180–0.222 | `rig.clutch.static` OD at z≈housing rear face (world z≈0.017–0.032, r≈0.033) |
| rotor note | 0.222–0.245 | handle air motor |
| S1 datum A + phantom centreline, flatness .0008 | 0.248–0.300 | axis world x=-0.0775,y=0 along z; housing is ghosted here |
| S2 shafts `⌰ .001 A-B` | 0.305–0.350 | `rig.outputShaft` teeth (+ secondary leader to stage1 sun P001836) |
| S3 planet `↗ .001 D` + ISO 1328 A6 | 0.353–0.398 | `rig.stages.stage4.planets[0]` (orbits with the carrier) |
| S6 summary card | 0.402–0.440 | none (card) |

Implementation plan: in-canvas updater component mounted AFTER `<CameraRig/>` in
`SceneCanvas.tsx` (same priority → runs after the camera update, no 1-frame slip) that projects
anchors and imperatively writes into a fixed DOM SVG overlay component rendered in `App.tsx`
(refs registered in a module store). Remove the CH.01/02 entries from `Hotspots` rendering.

## Measured facts (cost real time)

- World frame after the intro == recentered model frame (`rig.center` =
  (0.0775, 0, −0.0906)). Drivetrain axis: world x = −0.0775, y = 0, along Z; snout +Z, handle
  −Z, grip toward +X (tool "up" = −X). Units are consolidated `MERGED …` meshes — occurrence
  nodes are EMPTY; use `window.__rig` units, not node-name lookup.
- Rest bounds (world, m): housing z 0.017–0.121 r 0.0328; output 0.084–0.142 r 0.0157;
  bearing K000004 0.033–0.040; clutch static −0.050–0.032 r 0.0332; fork (sliding) −0.018–0.014
  r 0.0277; ring switch −0.024–0.004 r 0.0377; stage1 0.012–0.033; stage2 0.023–0.050;
  stage5 0.035–0.068; stage3 0.049–0.090; stage4 0.063–0.101 r 0.0278; handle −0.141–−0.013,
  x −0.115…0.123. Whole model ≈ 0.283 m long × 0.238 m tall. 841k tris, 59 meshes.
- Timeline (paced progress → chapter / explode / ghost / shift): 0.14–0.17 clutch shift
  close-up (cam ≈ (0.13,0.05,0.03)); 0.20 CH.02 starts; ghost 0.26→0.32 (min 0.15 at 0.32);
  explode 0.31→0.44 (1.0 at 0.46); 0.44–0.52 LCD dwell (camera swings to the rear); 0.525 out.
  The hero GSAP timeline is scrubbed on `[data-chapter="1"]`, not global progress.
- Probes: `.scratch/cine/probe-parts.mjs`, `probe-rig.mjs`; capture: `node .scratch/cine/shoot.mjs
  <outDir> <p1,p2,...> [WxH] [settleMs]` (headless chrome channel; dev server
  `preview_start name=dev` → :5199). Readiness waits for `__drawingProof` +
  `telemetry.drawing.annotationsReady` — set that flag when the sheet text has synced.
- troika-three-text 0.52.5 ships `BatchedText` (one draw call; per-member `clipRect` +
  `fillOpacity` are NOT layout props → cheap per-frame typing). No TS types → added
  `src/types/troika-three-text.d.ts`.
- Fonts downloaded (OFL): `public/fonts/BarlowCondensed-{Medium,SemiBold}.ttf`.

## Files written this session (uncommitted)

| File | State |
|---|---|
| `src/scene/drawing/drawingGeometry.ts` | REWRITTEN: 0.80×0.50 sheet, `SHEET_ZONES` (trim/border/frame/titleBlock/revisionBlock/notes), `VIEW_ROTATIONS` (side/top/bottom/front/rear), `VIEW_DEFS` placement (tune `at` here), `makeDrawingLayout` (compatible `DrawingLayout`; views[0]=side 1:1, z translation forced 0), `snapshotDrawing` now also returns `units` (rest bounds per rig unit); exports `traceProfile`, `buildProfileRibbon`, `sectionLinework(position, transform, spacing) → {cut, hatch}`. Removed: raster `renderDrawing`, `PRINT_TARGET_*`, `edges` field, `SHEET_FIT_HEIGHT_FRACTION`. `RenderedDrawing` is now profile-only. Paper/grain exports kept (paperGrain.test). |
| `src/scene/drawing/sheet/edgeExtract.ts` | NEW: `buildEdgeSet` (quantized weld, crease 34°, smooth edges keep both normals, boundaries) + `extractView` (silhouettes per view + HLR against a 24-bit linear-z ortho render, 3×3-min rule, optional model-space clip plane for the section). UNTESTED. |
| `src/scene/drawing/sheet/ink.ts` | NEW: `InkBuilder` (line/path/rect/circle/tri/arrow/text/segments), `PEN` widths, `DASH`, reveal `GROUP` ids (16), `WAVE_GLSL` (shared shockwave), `makeSheetUniforms`, `makeInkLines` (instanced AA quads, world-width pens with 1-px coverage floor, per-segment draw-on, dash patterns, wet head), `makeInkFills`. UNTESTED. |
| `src/scene/drawing/sheet/composeSheet.ts` | NEW: full sheet composition (views, section hatch, details B/C/D clipped to circles, view titles, centre lines, A–A cutting plane on the plan view, reference dims in inches, datum A, leaders, 2 FCFs with vector GD&T glyphs, border/zones, title block, revision table, notes). Returns `{ink, stats, marks}`. UNTESTED. NOTE the revision-table rows (dates / "M.H.") are presentational — confirm with owner or neutralise. |
| `src/scene/drawing/sheet/sheetText.ts` | NEW: `makeSheetText(items)` → BatchedText layer with `ready` promise and `update(reveal, opacity)` (clipRect typing). |
| `src/scene/drawing/sheet/profile.ts` | NEW: `bakeProfile(gl, data, layout)` → contour/ribbon over the primary rect at 8000 px/m. |
| `src/scene/drawing/sheetCamera.ts` | REWRITTEN: shot list + Catmull-Rom dolly → `introCameraPose(layout, aspect, t, out)` returns {position,target,up,fov,ortho,distance}; `sheetReveal(t, out[])` ink schedule per group. |
| `src/scene/drawing/introTimeline.ts` | `INTRO_PHASES` re-timed: focusEnd .05, onboard .05–.40, pulse .40–.60, orbitStart .52, riseStart .60 (detach .86 / waveEnd .96 unchanged). Tests are structural and should still pass. |
| `src/scene/CameraRig.tsx` | Intro block consumes the new pose (up/fov/ortho); ortho blend now sized to the live look-at distance. `SHEET_FOV`/`SHEET_UP_WORLD` imports removed. |

## Next steps (in order)

1. **Rewrite `src/scene/drawing/DrawingLinework.tsx`** (the only thing blocking compile):
   bake in `useLayoutEffect` → `makeDrawingLayout`, `solveExtraction`, `composeSheet(gl,…)`,
   `bakeProfile`; build `makeSheetUniforms` + `makeInkLines` + `makeInkFills` + `makeSheetText`;
   new paper shader (procedural vellum/fibres/grid inside `SHEET_ZONES.frame`, lamp pool from
   `uLamp`, shockwave via `WAVE_GLSL`, opacity/contrast from intro state) + desk plane beneath.
   Per frame: `sheetReveal(intro.t)` → `uniforms.uReveal`, text `update`, `uViewport` = drawing
   buffer size, lamp follows camera target, keep the pulse ribbon + extraction + telemetry +
   `__drawingProof` API (drop the SVG hook `__drawingSvgReady`). Set
   `telemetry.drawing.annotationsReady` after `textLayer.ready`; expose `window.__sheetStats`.
   Remove `EngineeringDrawingOverlay` from `App.tsx` and delete it (only App + old
   DrawingLinework reference it). `DrawingProofRenderer` reads `drawingRuntime.rendered` only as
   a null-check — fine. `scripts/check-b1b2-contract.mjs` / `export-sheet-template.mjs` assert
   the OLD layout (4 views, 22:17) — update or retire them.
2. `npm run typecheck`, capture `node .scratch/cine/shoot.mjs .scratch/cine/v1 0,0.004,0.01,0.02,0.03,0.036,0.04,0.048,0.06,0.08,0.1,0.115`
   and LOOK. Expect to tune: `VIEW_DEFS.at` placements (grip vs DETAIL C/D collisions),
   crease angle / HLR eps (edge noise on knurls/threads), pen widths, shot list, reveal windows.
   Log `__sheetStats` bake times (target < ~3 s; move to a worker if not).
3. Opening DOM titles (oryzo-style) + check what `Chapters`/`TechnicalHUD` show over the intro
   (the cyan HUD chrome clashes with the warm desk — consider fading it during the intro).
4. Track B stations (spec above). Then fact-sheet copy sweep: every `.0015"` in
   `src/data/caseStudies.ts` → `< .001"`, `P000420` display "Clutch Housing", `P000297` "Shifter Cam".
5. Gates: typecheck / `npm test` / build / `check:station2`; telemetry checks (no vision-only
   claims); JG-034 check (fresh load at several viewports shows the sheet correctly without a
   resize — the new bake is viewport-independent except `aspect` in the camera). Send the owner
   PNG stills + a short scroll video; Astra must rule on the visual effects before "done".
