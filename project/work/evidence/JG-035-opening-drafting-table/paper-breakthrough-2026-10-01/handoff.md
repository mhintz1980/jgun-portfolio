# JG-035 breakthrough handoff

The owner's physical-breakthrough request replaces the former translucent-paper emergence. Implementation lives in the real checkout `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`. No commit, push or deployment was requested or performed.

Start with [review.md](review.md), [verified capture](verified-capture/summary.json), and [full roster](verified-roster/summary.json). This revision is implemented and technically verified: 6/6 browser cases PASS, 184/184 unit tests, build PASS, fresh independent review SHIP. Owner visual acceptance remains open. The initial diagnostic folders contain superseded failures.

## Current implementation

- `src/scene/drawing/sheet/breakthroughGeometry.ts`: conservative profile hole, exact sheet complement, thick fragment components, seam ribbons and permanent outward char rim. Concave Voronoi intersections operate on triangles and cancel shared edges. Small perimeter chips stay in the partition: 99 total pieces, not silent area loss.
- `sheet/breakthrough.ts`: cut printed stock at the hole, grow actual profile/web apertures, front ink texture. `DrawingLinework.tsx`: opaque stock, fragment transforms, backlight, rim, lazy barrier probe. Geometry/texture creation happens at bake, animation mutates refs.
- `introTimeline.ts` / `paperFlex.ts`: pressure .79–.84, fracture .84–.88, clear from .88, metal .89–.91. Branch extent grows with pressure; brightness releases with fracture. Paper never fades.
- `extractionPose.ts` and `TorqueWrenchHero.tsx`: initial model top 0.6 mm under the sheet. Pure translation in the registered side basis; camera supplies orbit. Full tool clearance is measured at pose .692509125245, intro .919791916798. No model clipping.
- Perforated sheet remains through global .18 and physically retires .18–.22. Storm, dark hold, registration through .79, share .50, reduced park .38, mechanical ladder and downstream windows retained.

## Verification and resolved failures

184/184 unit tests, production build, 29/29 synthetic B1/B2, and Stage 2 asset contract pass. Desktop/narrow capture passes opacity, area, ordered emergence, near-barrier vertex containment, forward/pause/reverse, and records stills/motion. See saved logs in this folder.

Real defects fixed: rotated model re-entering paper; hole too tight for profile raster quantization; missing boundary cells producing blocky light leak; concave half-plane clipping inventing fragment bridges; duplicate Y-band segments corrupting containment; incorrect fragment normals and back taper; backward-growing crack extent; missing crack-web uniform declaration.

Verifier corrections: `.89` was incorrectly added to the camera registration hold, whose retained end is `.79`; reverse `.865` fragment probe lacked a matching forward probe. The corrected full roster is `verified-roster`, not `full-roster`.

## Remaining boundaries

Owner visual acceptance is open. Do not mark the broader JG-035 task closed: tolerance/station work and page-separation questions are outside this revision. Fragment fronts reproduce strokes/fills, not Troika lettering; this is a minor printing limitation, not a barrier workaround.

The source graph's metadata predates these changes; review used current source and runtime evidence. Do not infer graph completeness. Preserve untracked `.scratch/`. An untracked `.tmp-probe/` containing timeline diagnostics appeared during the run; its ownership is not confirmed. Do not stage it.

Preview: `http://localhost:4173`. Restart preview after every subsequent rebuild. Reproduction: `node scripts/capture-jgun-breakthrough.mjs --url=http://localhost:4173 --out=<new-folder>` and `node scripts/verify-jgun-opening.mjs --url=http://localhost:4173 --out=<new-folder>`. The latter is the full six-case roster; `--quick` is iteration evidence only.
