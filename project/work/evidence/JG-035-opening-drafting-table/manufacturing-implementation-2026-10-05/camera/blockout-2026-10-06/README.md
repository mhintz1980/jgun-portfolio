# Camera blockout 2026-10-06 (390x844 material-card collision fix)

Session: `capture.mjs --url=http://localhost:4173`, 24 anchors (desktop 1440x900 +
narrow 390x844), inspection session 1. `report.json` `input_hashes` pin the pre-fix
source: `camera.ts` `dda15941...` (equal to the working tree at capture time),
`manufacturing-core-full.glb` `17f90d73...`, `manufacturing-core-lite.glb`
`b38b91fa...`, `dist/index.html` `40889fc8...`.

## Confirmed defect (measured, live camera)

`measure_material_region.mjs` decoded the lite `legacyshaft` Draco positions, applied
the live group rotation `rotationZ(2*cutterPhi)`, and projected through the SAME-SESSION
saved live camera matrices (`report.json` anchors `.camera.projection/.world`):

- Narrow 390x844, critical action band y 3.2..14.2 mm: x 55.85..306.64,
  py 193.69..516.59.
- Actual card column (live DOM): x 31.19..358.81, py 156..339.97 (4140/C300) or
  156..293.78 (4340); footer top py 529.5. Vertices inside the card column:
  1522 (4140), 1092 (4340), 1522 (C300).
- Desktop is clear: action x 134..500 vs card x 904.81..1324.81.

## Fix evidence chain

1. `material-region-report.json` - live-matrix measurement (above).
2. `candidate_material_camera.mjs` -> `material-camera-candidates.json` - CPU-only
   candidates (status: rendered validation still required before acceptance).
3. `independent_material_camera_check.mjs` -> `independent-material-camera-check.json` -
   independent reproduction written from the camera.ts law, sharing no code with step 2:
   A) live-matrix projection reproduces the measured bounds 0.0 px; B) the camera.ts
   composition-law reconstruction matches the live matrices 0.0 px; C) candidate
   fovNarrow 18.5 / tgtNarrow [0,8.5,1] gives critical action x 124.48..251.58,
   py 352.46..516.14 = card clearance 12.49 px, footer clearance 13.36 px, NDC max 0.362
   (8 percent safe frame holds); D) reconciles the prior script's own convention.
4. Applied to `src/scene/inspection/shaft/camera.ts` (t 15 / 22.6 anchors only;
   desktop and every other beat unchanged).
5. `src/scene/inspection/shaft/camera.test.ts` - the narrow material-band and final-card
   assertions now use the measured top-band card/footer rects (8 px margins); 10/10 pass,
   `npm run typecheck` clean.

Rendered same-session proof of the FIXED camera is still pending (parent rerun against a
rebuilt preview; restart :4173 after rebuild). This folder's CPU evidence alone is not
runtime acceptance, and C2 stays open.

## Raster classification (reclassified 2026-10-06, verified)

`raster_reclassification_check.mjs` -> `raster-reclassification.json`: all 24
`*-dom-overlay-bounds.png` are byte-identical to their `.png` full-page captures, with
0 mean difference inside every measured card/header/footer rect and everywhere else.
`dom_text_visibility_check.mjs` -> `dom-text-visibility.json`: card rects carry
8.5..9.8 percent text-like edge density vs 0.7..2.5 percent in the WebGL control strips
directly below, so the portal DOM was painted in the captures. Classification: the
`-dom-overlay-bounds` label is correct; these are DOM-overlay composites, not clean
canvas rasters. No clean canvas evidence exists in this folder from the original run;
producing it requires hidden DOM verified in-session plus same-session source proof.
The per-row `clean_canvas_capture` notes in `report.json` describe the attempted
style-tag hide; the pixels prove the portal remained painted.

## Budgets (C4)

Bundles (independent decode, `../../assets/acceptance-2026-10-06/draco-report.json`):
full 678,008 bytes / 95,183 triangles / 8 primitive calls; lite 415,424 bytes /
49,706 triangles / 8 primitive calls. Runtime per-anchor rendered calls/triangles are
recorded in `report.json` (`rendered.calls`, `rendered.triangles`; range across the
24 anchors: calls 1..28, triangles 12,671..298,405; the narrow materials hold renders
1 call / 12,671 triangles).

## Reproducible commands

- Capture: `node camera/blockout-2026-10-06/capture.mjs --url=http://localhost:4173`
  (built preview required; restart the server after every rebuild).
- Region measurement: `node camera/blockout-2026-10-06/measure_material_region.mjs`
- Candidates: `node camera/blockout-2026-10-06/candidate_material_camera.mjs`
- Independent check: `node camera/blockout-2026-10-06/independent_material_camera_check.mjs`
- Raster reclassification: `node camera/blockout-2026-10-06/raster_reclassification_check.mjs`
- DOM-text visibility: `node camera/blockout-2026-10-06/dom_text_visibility_check.mjs`

## Open observations (not asserted as defects; await rendered owner proof)

- Desktop materials beat: critical action py 223.0..675.4 overlaps the measured footer
  rect (py 596.5..876, x 57.6..537.6 vs action x 134..500) by about 79 px. Desktop
  framing is intentionally unchanged by this fix (preserve-desktop constraint).
- Narrow final-card beat (t 34): broad witness py 313.0..540.7 dips 11.2 px past the
  footer top (529.5) while clearing the card bottom (249.78) by 63.3 px. The test keeps
  the pre-existing -0.3 NDC floor; no camera change was made for this beat.
