# JG-026 — B1/B2 engineering drawing extraction

Status: in-progress; owner specification authorized 2026-09-03, owner pacing/realism rulings
2026-09-05. Visual acceptance is Mark's gate and is still open.

## Scope and architecture

Rebuild failed commit `5dfd0aa` on `codex/b1-b2-engineering-drawing`. Preserve geometry
provenance from `Default.glb`, `window.__drawingProofMode` and `remapHeroProgress`. Keep main's
downstream station boundaries and its motion-smoothing layers. No asset re-export, new
dependency, deployment, or owner self-certification.

The print uses offscreen orthographic render targets with opaque depth occluders and
depth-tested visible silhouette/crease edges. SVG dimensions, leaders and GD&T use the
identical view matrices and measured geometry features. The print is a local-Z=0 scene
plane; GPU focus, profile excitation and the plane-local shockwave belong to it.
The live part begins registered with the primary elevation, then translates in plane Z
with pitch/yaw. A transformed-**vertex** root solve determines clearance and wave origin.

## Ordered work

- [x] Capture failed-commit desktop/mobile baseline, telemetry, boundary and bundle data.
- [x] Replace line extraction/rendering and projected SVG print; add independently captured
  drawing/model registration masks with silhouette IoU and edge disagreement.
- [x] **Restore both motion-smoothing layers** (2026-09-05 owner direction). The camera's
  exponential damp, pointer parallax, pulse shake and rest orbit, and the hero's GSAP
  ScrollTrigger timeline (`scrub: 0.6`) and gear idle, are all back. Determinism is proved by
  **settle-gating the capture harness**, not by deleting what needs to settle; residuals are
  reported as numbers where a channel cannot converge exactly.
- [x] Implement the owner-paced phase map: 0–.14 focus, .14–.30 RESERVED for the opening text,
  .30–.56 ordered excitation, .56–.88 extraction with the camera orbit inside it, .88–.96
  detachment + single shockwave pass, .96–1 print fade. The computed crossing must fall inside
  phase 4 (measured 0.8888459503339448).
- [x] **Pacing (Lever A + Lever B).** `pacedProgress()` gives the intro 0.30 of the document
  while it still owns only 0.120 of the progress axis, so no downstream constant moves; document
  height 2020vh → 3120vh. Prove per-chapter absolute distances did not shrink.
- [x] Blend intro camera position, target, FOV and projection to the retained camera at the
  exact release boundary; measure the deltas (5.55e-17 m).
- [x] **Drawing realism.** Sheet read right-way-up throughout; real callout placement with a
  counted crossing metric; true third-angle projection with shared axes and a section line with
  arrows on the parent view; ANSI C 22:17 sheet; C-size SVG template exported for Mark.
- [x] Keep downstream timing, retain the part-number ladder, and document the boundary table.
  Synchronize the canonical spec and both READMEs in the same implementation commit.
  Full/lite/reduced/poster behavior accompanies each effect.
- [x] Verify fresh preview after build/restart: 1920×1080 and 390×844; five pulse positions;
  detachment contact; settle-gated forward/reverse determinism across 16 checkpoints;
  performance distribution; typecheck, build, unit tests, pure-math contracts, station-2
  contract. Record failures literally.
- [x] Declare and re-measure the JG-023 backdrop change; re-prove JG-022.
- [x] Repository hygiene: remove `204` and `.agents/`, restore vitest, fix per-frame
  allocations, normalize code style in the new drawing files.
- [ ] Commit source and capture evidence with explicit staging. Leave the TODO entry unchecked.
- [ ] Stop at `http://localhost:4173/?chapter=0` for Mark's visual ruling.

## Owner rulings recorded

| Date | Ruling |
|---|---|
| 2026-09-03 | Task authorized. In-app render + SVG overlay; views stay generated from `Default.glb`. |
| 2026-09-05 | Pacing: *"each percentage of the total scroll [should be] MORE animation time"*; the orbit into the rise was too quick. |
| 2026-09-05 | The excitation was invisible; make it unmissable without breaking the JG-021 light canon. |
| 2026-09-05 | The shockwave must be caused by separation, must travel to the edge of the page, and must not linger or repeat. |
| 2026-09-05 | Scroll-jacking: propose, do not unilaterally build. No exit button, ever. Escape is accessibility parity only. Reduced motion is never scroll-jacked. |
| 2026-09-05 | Opening/onboarding: design only this pass, but reserve its scroll window. |
| 2026-09-05 | Sheet format is ANSI C, 22 × 17 in, aspect 1.294 : 1. Do not crop it to fill the width. |
| 2026-09-05 | Section A–A belongs BELOW the primary elevation, with its section line and arrows drawn on the parent view. |
| 2026-09-05 | Mobile keeps the sheet landscape with a scroll-driven push-in and pan — provisional, pending his ruling. |

## Failed attempt source findings

`DrawingLinework` hid the meshes needed to populate depth and drew every edge in the
perspective scene. The SVG had fixed 1000×720 coordinates without geometry projection.
`pulse` had no rendering consumer. Lift was Y-only, 45 mm over .068–.084 global progress.
`PondRipplePass` used screen centre and a smoothstep envelope starting at lift onset.
`CameraRig` overrode FOV to 27 through .120 and then returned to the base rail. The old 99.5%
pixel change compared different representations and could not establish registration.

**Second-attempt findings, corrected in this pass:** both motion-smoothing layers were deleted
to make a determinism gate pass; the JG-023 backdrop envelope was zeroed below progress 0.108
without declaration; the reduced-motion card stack was pushed 100vh down, re-creating JG-022's
defect; `telemetry.drawing` and `telemetry.camera.goal` were reallocated every frame; vitest and
the timeline test were removed; `.agents/` duplicated two registered skills; the sheet was read
upside down at the lift; callout labels sat on a hardcoded rail with six leader crossings; the
four views had no orthographic relationship despite the title block claiming third angle.

## Proof contract

All image assets under `project/work/evidence/b1-b2-rebuild/` are evidence generated by
the running app, never authored substitutes for model geometry. The model half of every
registration comparison is rendered from the live scene meshes through the live camera. Full and
lite retain a readable print; reduced motion holds a focused registered frame; poster retains
accessible static content. The final report distinguishes machine checks from pending owner
acceptance, and reports residuals as numbers rather than changing the system to make a gate
easy. Evidence: [JG-026 verification](../evidence/JG-026-b1-b2-verification.md).
