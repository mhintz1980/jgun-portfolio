# Astra brief — blue lightning cracks + cavernous portal (JG-038, 2026-10-18)

Audience: GPT-6-Astra, implementing author. Everything needed is here; do NOT grep, search the repo, fetch docs or
navigate beyond the files named below. Spend tokens on looking at the references, thinking, and building a visually
stunning result. Read doc26 (owner corrections) only if you need the owner's wording.

## 1. Goal (owner wording, condensed)
Make the blue lightning cracks and the cavernous portal look like the owner reference images. Shards stay drawing-PAPER
coloured (already done; do not regress). Preserve causality: wrench pushes paper up, paper fractures, wrench emerges,
cavern is left through paper and desk; continuous camera; no desk visible through gaps; no flat cavern bottom/closure
disk visible; reverse seek and reduced-motion/poster behaviour unchanged.

## 2. Look at these images first (absolute paths; use your image viewer)
Dir: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/references/2026-10-17-owner-corrections/
- R3 `01-paper-webbing.png`: TARGET electrical look. Saturated light/electric blue; narrow bright core with blue halo and
  spill; jagged branching; legible interior web over a dark drawing. Core is blue-white at most, never a whitened filament.
- R4 `cavernous-pit-should-llok-like-this.png`: TARGET cavern. Torn, lit paper lip; substantial irregular dark rock walls with
  real thickness and ledges; steep downward depth; selected thin blue electrical fissures in the rock; warm paper-edge
  bounce at the mouth; depth falls to near-black. Not a uniform extruded wall, not a flat black hole.
- R7 `codex-clipboard-cc93b69b-01e6-4f38-af35-4a88919652c9.jpg`, R8 `codex-clipboard-e9daf951-475c-45c7-bd69-3ae476d557e7.jpg`:
  fracture GEOMETRY only (dense impact centres, irregular radiating primaries, concentric linking arcs, secondary forks,
  fine tertiary hairlines, varied cell sizes). Do not copy the photo background, transparency, bullet holes or white glass.
- R2 `profile-view-cracks-low-quality-wrong-color.png` and R5 `shattered-glass-wrong-color.png`: REJECTED outputs.
- Extra motion/geometry references: C:/Projects/Misc/cracks.png, C:/Projects/Misc/portal.png, C:/Projects/Misc/lightning outline.mp4.
Measured from R4 by a prior analysis (targets, not laws): rock mostly cool charcoal (24..72 grey) with ~8% warm-tinted
facets; fissure cores ~(121,193,234), halos ~(56,105,148); fissure chord median ~2px at 1440x900; only ~4% flat black.
R3 web chords are broader (~6px median) than pit fissures.

## 3. Current state (my observations at served frames, scroll fractions of document height 62911 px)
Frames: output/playwright/jg038-lightning-20261017/{a,b,base}-NNN.png (NNN = fraction*1000).
- .26-.265 blue outline lightning traces the profile: good saturated blue.
- .295 dense web is live: 3 impact origins, radials, concentric rings, forks, hairlines, additive halo. Weaknesses:
  concentric rings are smooth/pale like drawn arcs, not fractures; impact bloom is over-bright and plasma-like vs R3;
  filament width/brightness variation is too uniform; no electrical flicker/crawl along the filaments.
- .31 shatter start: shards are paper-coloured (good). A BLACK WEDGE appears over the gearbox top (x~800-1090,y~170-270) - unexplained; diagnose (likely a fragment/pit-cap/z issue) and remove it.
- .32-.34 cavern: still reads as a flat slate-blue wall (frame base-340) - fails R4. No torn-lip relief, no ledges, no blue
  fissure veins visible, no depth falloff. Need: lit torn paper lip, large rock masses, overhangs, dark depth, thin blue veins.
- Known pre-existing failing test (not yours): src/scene/drawing/sheet/portalGeometry.test.ts "private cavern keeps the real
  tracked contour fold-free at every ring" fails on original code too. Keep fold-freedom in YOUR tests.

## 4. Files (read exactly these; line numbers drift)
OWNERSHIP (single writer = you, handed over from the parent for this task; the parent will not edit them meanwhile):
- src/scene/torque-wrench/privateSheetRuntime.ts - host. Look for: PRIVATE_LIGHTNING_VERTEX/FRAGMENT (profile trace),
  PRIVATE_WEB_VERTEX + privateWebFragment(halo) (web, additive halo mesh child 'pressure-crack-halo'), paperFragment (paper+shards,
  uFragment branch is the PAPER shard look), crackMask via makeCrackMask (physical hairline apertures, keep seams exact),
  per-frame update block (u.uPulseHead, uElectricalEnergy, uCrackGrowth, uCrackWeb, uFracture, uSpark, portal.update, wallUniforms
  uPortalFissureEnergy/Growth/uPortalRockAlive, fragment flight), portal factory (factories.portal -> makePortal(..., makePrivatePitGeometry)).
- src/scene/torque-wrench/privateFractureWeb.ts (+ .test.ts) - web geometry. Attributes: position(z=.00045), arcLength 0..0.99,
  ribbonSide, ribbonNormal, branchLevel 0..3, ribbonHalf. Budget <= 78k vertices, build ~50 ms.
- src/scene/torque-wrench/privateElectricGeometry.ts (+test) - seam connected-growth map (arcLength). Keep seam/aperture/shard
  correspondence byte-identical to the cached bake.
- src/scene/torque-wrench/PitGeometry.ts (+ PitGeometry.test.ts), privatePitMaterial.ts (+ privatePitMaterial.test.ts) - cavern.
- src/scene/torque-wrench/ElectricalDirector.ts, PitDirector.ts - read for timing (burst/hold score, pitEnergy/pitGrowth); edit only if needed.
- output/playwright/jg038-lightning-20261017/frames.mjs - capture harness.
READ-ONLY: src/scene/drawing/sheet/{portal.ts,portalGeometry.ts,breakthrough.ts,breakthroughGeometry.ts,lightning.ts,ink.ts,paperFlex.ts},
src/scene/drawing/electricalScore.ts, src/scene/torque-wrench/{RuntimeWorld.tsx,OpeningDirector.ts,OpeningCamera.ts,CameraHandoff.ts}.
If a shared file truly must change, do the equivalent override privately inside the files you own and report it; do not edit shared files.
PROTECTED: .scratch/, public/models/*.glb, docs/orzo-style-portfolio-implemetation-roadmap.md, REA docs, C:/Users/Markimus/.buzz/REPOS/jgun-portfolio,
sibling pages, shaft/ring/hob files (just finished by others). No git commit/push/branch/reset/stash. No deploy.

## 5. How to verify (use your own port; the owner's review port 5281 is not yours)
1. `npx tsc --noEmit` (clean) and `npx vitest run src/scene/torque-wrench/privateSheetRuntime.test.ts src/scene/torque-wrench/privateFractureWeb.test.ts src/scene/torque-wrench/PitGeometry.test.ts src/scene/torque-wrench/privatePitMaterial.test.ts src/scene/torque-wrench/privateElectricGeometry.test.ts src/scene/torque-wrench/ElectricalDirector.test.ts src/scene/torque-wrench/PitDirector.test.ts`.
2. `npm run build` (~15 s). Then run the preview as a long-lived exec session: `npm run preview -- --host localhost --port 5291 --strictPort`
   (restart it after EVERY rebuild; detached/Start-Process launches are blocked by policy, so keep it as an open session).
3. Capture: `$env:TW_BASE='http://localhost:5291'; node output/playwright/jg038-lightning-20261017/frames.mjs <tag> 0.26,0.28,0.295,0.30,0.305,0.31,0.32,0.33,0.34,0.36`
   (writes <tag>-NNN.png + <tag>-index.json with console errors; ~25-40 s). View the PNGs and compare with R3/R4/R7/R8 side by side.
   Scroll fractions: .23-.27 outline trace, .27-.31 web grows, ~.31 shatter, .32-.36 emergence and cavern. Add finer samples as needed.
   Telemetry (window.__torqueWorld.snapshot(), __torqueNarrative.scrollFraction(p)) proves mechanics; matched visible frames prove look.
   You are the only agent using the GPU/browser/5291 during your run.
4. Output naming: tag your final frames `astra-final-NNN.png` in the same folder so the reviewers find them.

## 6. Definition of done (reviewers will test this)
Mechanical: tsc clean; tests above pass; build passes; no console errors in captures; paper shards intact; seam/aperture unchanged.
Visual rubric (each axis scored 1-5 by an independent adversarial reviewer from SERVED frames; pass = every axis >= 4, mean >= 4.3, no blocker):
 1. Lightning colour/energy vs R3 (saturated blue, bright narrow core, halo, never whitened, alive/jagged, intensity hierarchy).
 2. Fracture topology vs R7/R8 (multi-scale origins, radials, linking arcs, forks, hairlines, irregular, varied cell size).
 3. Cavern vs R4 (torn lit lip, massive irregular rock with thickness/ledges/overhangs, steep depth, thin blue fissures, depth falloff).
 4. Shards: paper colour/ink, glass-like fracture motion, no dark/blue substrate.
 5. Continuity/artifacts: no black wedge or z-fighting, no desk visible through gaps, no visible flat bottom/closure disk, no popping.
 6. Overall: would a senior VFX art director call it visually stunning and production-ready?
Blockers: whitened/neon-plastic filaments, smooth drawn-arc "cracks", flat slate cavern, glass-coloured shards, visible desk through the aperture, flat cavern bottom, any artifact in 5.

## 7. Report back (concise)
Changed files; before/after frame names for each rubric axis; tests/build results; vertex/triangle counts and frame-time notes;
residual weaknesses; anything the parent must integrate. Do not claim owner acceptance.


## 8. Effort and quota discipline
You are capped at High reasoning effort by the owner. Be quota-frugal: keep reasoning concise, write code early and iterate on served frames, view only the references/frames you need (crop instead of viewing many full-size images), avoid dumping large files or logs into context, and do not repeat captures that cannot change. If you hit a 429, stop cleanly after saving work and report which files are in a consistent state.

## 9. REVIEW 1 RESULT (GPT-6.1-Sol/High, 2026-10-18) = FAIL. Astra retry (the single allowed one) must fix these, in this order
Scores: lightning 2, topology 3, cavern 2, shards 4, continuity 2, overall 2; mean 2.50. Evidence crops: output/playwright/jg038-lightning-20261017/review-sol-pit-compare.png and review-sol-*.png. Mechanical gates were OK (tsc, 41/41 tests, no console errors).
1. CONTINUITY BLOCKER (regression, fix first): at scroll .265-.295 the glossy gearbox/model shows THROUGH the intact printed drawing around x430-680,y150-310 while fracture=0 and portalActive=0 (b-295 kept the drawing there). The overlap change that keeps shards in front of the wrench must not expose the model before physical fracture; keep the full printed profile opaque until rupture reveals it. Likely cause: depth/renderOrder or fragment/wrench z handling in privateSheetRuntime.ts after the last edit. Target frames c-265, c-295.
2. CAVERN (target R4; frames c-330, c-340): still a continuous textured slate lining. Needs large irregular projecting rock masses, recessed shadowed ledges, overhangs, dark occluded depth (lighting falls off by depth, near-black far down), a torn CURLED paper lip with fibre, selective thin blue fissures. The lip currently reads as uniform cream teeth.
3. WEB + LIGHTING together (target R3/R7/R8; frames c-285, c-295, c-305): replace repeated serrations and uniform straight spokes with varied hierarchy (long primaries, linking secondaries, tertiary hairlines, varied cell sizes); saturated NARROW cores with selective halo and paper spill (R3), intensity hierarchy along filaments; the perimeter currently reads as an illuminated tube.
Keep: paper shards (score 4), no black wedge at .31, no desk exposure, no flat closure disk.
Review 2 (Gemini-4-Argon) follows Astra's retry using doc28. If it fails: STOP and alert the owner.

## 10. REVIEW 2 RESULT (Gemini-4-Argon, 2026-10-18) = FAIL -> PROTOCOL STOP, OWNER ALERTED
Scores: lightning 2, topology 2, cavern 2, shards 4, continuity 3, overall 2; mean 2.50. Astra retry (high) fixed the review-1 blocker (model no longer shows through intact paper at .265-.308) but review 2 found a new pop at .310 and the same visual gaps. No further automatic attempts. Findings, ranked:
1. Cavern (R4): the 226 IcosahedronGeometry(1,1) rock blobs read as low-poly coal lumps beside a flat pale slate wall in the left gearbox bore; the lip is a flat tan band with sine scallops. Wanted: continuous stratified cliff ledges, deep shear planes, overhangs, near-black recesses, sharp blue fissure bolts along crevices, and a lip that curls and grows with shard separation (no pop-on at .310; keep rocks below the intact sheet until uFracture > .02, which also removes z-fighting speckles at .310 over x620-830,y155-245).
2. Web topology (R3/R7/R8): level-0 shard seams are ruler-straight Voronoi lines (incl. a dead-straight horizontal at y~215); level-1 radials/rings cluster in three small starbursts leaving large dead zones. Wanted: jittered visual seams, primaries spanning the whole profile, varied cell sizes.
3. Lightning energy: uElectricalEnergy sits at the .26 floor between bursts (.285-.305); core too dim (.10,.57,1.0); perimeter still shows periodic sawtooth barbs (sin(vArc*593), jag*.00085). Wanted: sustained energy .78-1.0 with per-branch flicker, ice-cyan core (not white), royal-blue halo with paper spill.
Authored frames: astra-final-NNN.png; reviewer frames review-argon-*.png (same folder). Owner decides the next step; the owner-review build on :5281 is the Astra retry state.

## 11. Handoff (2026-10-18 late): Argon is now the implementing author
Sections 9 and 10 above are the fix contract. Exact file anchors, commands, references and boundaries are consolidated in [29-argon-fix-handoff-2026-10-18.md](29-argon-fix-handoff-2026-10-18.md). Parent note added there: keep the burst/hold rhythm (give grown filaments an afterglow instead of sustaining .78-1.0 energy) so Fix C does not violate the owner-approved electrical score. Astra effort cap (High) no longer applies to Argon, but Argon should still stay at High and quota-frugal.

## 12. Added after the Argon handoff: Fix E (timing)
The lightning timing correction (lights-out to first crack too long; 3-4 crack sequences) is specified with measurements in [29-argon-fix-handoff-2026-10-18.md](29-argon-fix-handoff-2026-10-18.md) section 5. It extends rubric axis 1 (lightning) and axis 5 (continuity): reviewers re-run timing.mjs and check the before/after table.
