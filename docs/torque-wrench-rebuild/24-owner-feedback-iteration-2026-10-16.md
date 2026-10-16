# JG-038 owner feedback — bounded creative iteration

Latest authority: Mark supplied ten images, asked for the fixes below, briefly requested a handoff, then authorized a quick implementation pass instead; hand off remaining gaps if the task becomes an open-ended/high-token run. This supersedes earlier drawing-only priority for the specifically requested legacy camera range. It does not authorize publication or owner acceptance.

## Requested fixes

- [ ] Move Gearbox Housing, Clutch Housing and Ring Switch callouts toward green marked boxes; move Air Motor and its leader to lower handle/grip near the vacated Ring Switch location, away from FEA handwriting.
- [ ] Detail circles and leaders must stand out against the section linework. Avoid B/E crowding.
- [ ] `RUN FEA.` must use the same handwriting as the note above, red, further down, with a handwritten red underline. This explicitly supersedes the previous stroke-letter implementation.
- [ ] Profile Air Motor cutaway crosshatch must reveal with its profile view, never ahead of the rest of that view.
- [ ] Replace the cloudy/extruded cavern appearance with steep fractured rock, deep occlusion and blue branching fissures matching the supplied references. No visible floor.
- [ ] Pit must retire with the drawing/desk, including reverse seeks. It must not linger into later mechanism or closing scenes.
- [ ] Lamp failure should darken the scene while retaining visible paper/desk; avoid complete blackness.
- [ ] Restore legacy camera paths after emergence: Ring Switch/blue groove zoom, shift/red groove view, subsequent path through the rear digital-display view. Source is read-only `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`. Do not copy unrelated later camera stations or overwrite inspection studies.

## Exact reference images

All paths are absolute. Named screenshots are in `C:/Users/Markimus/Pictures/Screenshots/`:

1. `drawing-feeback_move-part callouts-make-room-for-AirMotor-callout-near-trigger.png` — callout destinations and leaders.
2. `drawing-feedback_detail-view-circles-lineweight-visibility-problem.png` — circle hierarchy and B/E proximity.
3. `drawing-feedback_Run-FEA-note_Air-Motor-crosshatch.png` — handwriting, spacing, underline and premature hatch.
4. `cavernous-tunnel_very-low-quality.png` — rejected cloudy cavern.
5. `cavernous-pit_still-showing-after-desk-and-drawing-fade-away.png` — rejected lingering pit.
6. `digital-display-back-of-handle.png` — requested legacy path endpoint.
7. `ring-switch_shifts-to-show-red-line.png` — shifted ring close camera.
8. `ring-switch-zooms-to-show-blue-line.png` — initial ring close camera.

Additional exact target images:

- `C:/Users/Markimus/AppData/Local/Temp/codex-clipboard-d002d62d-daba-480c-abe0-8801cb031cf6.png` — cavern target.
- `C:/Users/Markimus/AppData/Local/Temp/codex-clipboard-2269fff7-1874-4aca-af2a-a0c28a03ba73.png` — visible darkened sheet with branching blue trace.
- Durable canonical pit target: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`.

## Ownership and checks

Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch `torque-wrench/rebuild`, starting HEAD `7c42c151`. Existing draft-b source changes remain uncommitted and are inputs, not unrelated drift to revert.

| Lane | Configured seat | Exclusive writes | Integration |
|---|---|---|---|
| Drawing | `anthropic/claude-sonnet-5-5/high` | `privateDrafting.ts`, `privateSheetContent.ts`, their focused tests, under `src/scene/torque-wrench/` | Parent consumes same adapter signature |
| Cavern | `zai/glm-5.3/high` | `PitGeometry.ts`, its test, new `privatePitMaterial.ts` under same folder | Parent integrates shader module |
| Parent | Current parent settings | `RuntimeWorld.tsx`, private runtime fade/lamp, new legacy camera adapter/tests, ledger | Build/preview/browser serialized |
| Review | `gpt-6-astra/medium` fixed role | Read-only scoped changed files | Source approval only |

Use affected tests, TypeScript, one coherent build/restarted 5288 preview and small feature-appearance checks. No full suites/matrices/AC or broad performance run. Preserve `.scratch/`, unrelated dirty files, immutable CAD, shared shell and all sibling writes/processes. No commit/push/deploy/cutover/archival. Source approval is not Mark's visual acceptance.

## Source map

Private drawing adapter: `src/scene/torque-wrench/privateSheetContent.ts`, `privateDrafting.ts`; read-only base composition `src/scene/drawing/sheet/composeSheet.ts`; handwriting font route `src/scene/drawing/sheet/handwriting.ts`, `sheetText.ts`; hatch reveal schedule `src/scene/drawing/sheetCamera.ts`.

Private pit/material/lamp/retirement: `src/scene/torque-wrench/PitGeometry.ts`, `PitDirector.ts`, `privateSheetRuntime.ts`; host retirement channel `RuntimeWorld.tsx`. Base portal geometry/material `src/scene/drawing/sheet/portalGeometry.ts`, `portal.ts` remain read-only.

Legacy camera source: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/CameraRig.tsx`, camera/ring/LCD keys in `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/data/caseStudies.ts`, mechanism sequence in `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/TorqueWrenchHero.tsx`. Private integration: `src/scene/torque-wrench/RuntimeWorld.tsx`, `MechanismDirector.ts`, `OpeningCamera.ts`, `CameraHandoff.ts`, `beats.ts`. All relative source paths in this paragraph resolve under the workspace above.

## Results

All named fixes have a draft implementation. Owner visual acceptance remains open, especially exact cavern/reference parity, approximate callout locations and B/E circle spacing.

- Drawing: Sonnet/high delivered all four private source/test files. Real-cache checks cover 67 profile hatch records, coherent label/leader/frame moves, red handwriting and circle hierarchy.
- Cavern: GLM5.3/high delivered private faceted geometry and `configurePrivatePitMaterial` module; parent integrated it without changing shared portal code. Pit retirement now multiplies isolation by `(1-retirement)` and hides its group at zero. Ambient paper/desk light remains during lamp failure, with retained trace and wall-fissure emission.
- Camera: `src/scene/torque-wrench/LegacyMechanismCamera.ts` maps the legacy groove/orbit/LCD sequence into narrative `.46–.675`, undoing legacy hero yaw in the camera frame while preserving the current unrotated rig. Existing inspection entry starts at `.675`. A measured `.635` target seam was fixed after Astra review; its two-sided continuity test passes.
- Integrated TypeScript passed; 40 affected tests across five files passed, then both camera tests passed after the continuity correction. No broad suites or matrices ran.
- Astra/medium approved the scoped correction in its second round. Runtime caught a GLSL reserved variable `active`; renamed to `branchEnabled`, rebuilt, and checked actual compilation successfully.
- Final candidate **d**: `.scratch/jg038-owner-feedback-20261016-d`, preview `http://localhost:5288/torque-wrench/`, PID 21392. Server restarted after rebuild; served HTML SHA256 matches the build. Actual desktop/full final smoke has zero browser/GLSL errors. At p=.51 pit visibility/alpha are both zero. At p=.655 LCD center NDC is approximately [.0202,-.0290,.9937], facing dot .9241: centered and front-facing.
- Unaltered captures: `.scratch/jg038-owner-feedback-20261016-c-p0.15.png`, `...-c-p0.389.png`, `...-c-p0.41.png`, `...-c-p0.48.png`, `...-c-p0.495.png` retain unchanged drafting/light/groove observations; final cavern/fade/display captures are `...-d-p0.453.png`, `...-d-p0.51.png`, `...-d-p0.655.png`. Candidate c had the failed cavern shader; do not cite its cavern image as final evidence.
- No commits, pushes, deployment, cutover or archival. Existing source changes, scratch/evidence and siblings preserved. Two test/source files have trailing blank-line-only whitespace notices; no product failure follows, cleanup deferred.

Final visual inspection: **cavern quality remains unresolved**. Candidate d's pit still reads as a smooth faceted/extruded shaft, with insufficient rock relief and visible branching light relative to the target. Source approval, geometry safety and zero shader errors do not establish that requested visual result. Do not mark the cavern-quality checkbox complete. Other named fixes are implemented and runtime-observed, pending Mark's eye on placement/style.

Next action: Mark views candidate d; bounded cavern follow-up is handed off at `C:/Users/Markimus/AppData/Local/Temp/JG-038-cavern-next-session-2026-10-16.md`. A frozen visual direction or formal acceptance has not been inferred.
