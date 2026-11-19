# JG-044 sub-plan: Chapter 04, Renderings, Animation & StudioMark

Written 2026-11-19. Status: **plan, awaiting Mark's go.** No Modal spend; the only
output so far is the local $0 P0 pilot stills below.
Parent plan: `JG-044-homepage-merged-concept.md`. Record of the design session:
`docs/HANDOFF-chapter4-studiomark-design-2026-11-18.md`.

## Cost first

| Item | Estimate | Basis |
|---|---|---|
| Tokens, whole build (P0-P5) | **500-650k** on Opus 5.5 | Per-phase sums below; not measured |
| Modal, pilot (cage, 60 shade frames + 3 hero stills) | **$0.10-0.50** | Carbine: $0.48 for 360 full frames, $0.05 shade-only |
| Modal, DD4SE + M249 (same set each) | **$0.50-2.00** | DD4SE is 845k triangles, 1.7x the carbine scenes |
| Modal total, with one retry each | **under $3** | The exact quote comes from the pipeline's estimate-before dry run, stated before each run |
| Line pass | **$0** | Workbench, rendered locally |

No Modal run starts without its quoted cost and Mark's go for that run.

## Rulings (Mark, 2026-11-19)

1. **Assembly 1: stage 4 cage A000861** (P003047 cage, 52 mm, plus 5x P003046 planets),
   isolated from `C:/Projects/CAD/Default.glb`.
2. **Assembly 2: DD4SE** open-skid pump, `C:/Projects/msp-render-pipeline-scene-prep/cad/DD4SE-clean.glb`.
3. **Assembly 3: `M249 Receiver Plus.glb`, Mark's own geometry**, rendered as a
   BCP-condition display shell. No part or drawing numbers on screen or in shipped file names.
4. **Brand marks: clean them.** Crop, mask or re-render without marks. The
   `content.test.ts` bans stay as they are.
5. **Gate 2 needs a thin console only:** assembly switch, background, angle scrub, A/B
   wipe. Truth-photo parity, videos and the training deck come after Gate 2.

## P0 pilot stills (2026-11-19, local, $0)

Contact sheet: `docs/ch04-studiomark-p0-stills-2026-11-19.png`. Four sections —
cage A000861 (line pass + Cycles placeholder-steel shade), DD4SE skid (own materials,
brand marks still in geometry), Receiver Plus (own materials), and a DD4SE test with
nameplate + engine cover removed (DD4S corner letters remain — supports ruling 4).
Rendered locally, Blender 5.2.2 LTS Cycles (CPU/CUDA), azimuths 0/120/240, line + shade
per assembly. No Modal spend. Full frame set, logs, `p0_preview.py` and the extracted
cage GLB stay in session scratch `.scratch/ch04/` (gitignored, not committed).

## Defaults (apply unless Mark says otherwise)

- **Dives 01-03** land on one clip per project, cut from that chapter's own render.
- **Chapter 03** keeps the built carbine spin (`proto/merged/arm/`).
- **`#systems`** stays a Systems section (PumpTracker, CAD/PDM tools). It gets one line
  pointing to Chapter 04 for StudioMark. No separate `/studiomark/` page in this plan.
- **Finish matrix:** three finishes per assembly at one hero angle (as designed, clay,
  one alternate). The alternates: cage in black oxide, DD4SE in a second paint colour,
  receiver in a second coating. Angle scrub in the as-designed finish only.

## Source facts (measured 2026-11-19, GLB headers, $0)

| Assembly | File | Size | Triangles | Notes |
|---|---|---|---|---|
| Cage A000861 | `Default.glb` subtree | 22 MB whole file | about 21k (cage 9.0k + 5x 3.3k) | Draco; Onshape names by part number |
| DD4SE | `DD4SE-clean.glb` | 34.8 MB | 845k | 291 meshes, 52 materials, about 1.4 x 1.5 x 2.0 m; node names carry vendor names (not shipped) |
| Receiver | `M249 Receiver Plus.glb` | 1.5 MB | 439k | Draco; has a `current camera` node and 2 embedded images (check them in P0) |

## Render setup

- **Tool:** `remotion/clips/armament/blender/render_clip.py` in worktree
  `armament-wiring-clipspin-15a80d` (read only; copy it, never move or remove that
  worktree). It already does turntables with a line and a shade pass from one camera:
  `--glb --out --angles --pass --engine --width --contour-only --max-elev --samples`.
  Chapter 04 needs only turns, so no explode or section work.
- **Cage isolation:** a local Blender script exports the A000861 subtree to a scratch GLB
  under `.scratch/` ($0). Not committed.
- **Passes:** line in Workbench (local, $0), ink on white, so the page recolours it for
  dark theme. Shade in Cycles on transparent, so the page draws the light, dark and
  jobsite backgrounds. Same camera, same frame numbers, registered as in the carbine set.
- **Frames:** 60 per assembly, 6 degrees apart, even angles, no easing baked in. Camera
  rises 0 to 10 degrees over the turn, as the carbine does. One fixed crop per set.
- **Hero stills:** 3 finishes at one angle (Cycles), plus one jobsite-lit still per
  assembly from the pipeline's plate lighting, so the jobsite background isn't a fake
  composite of studio lighting.

## Weight budget

- Web set per assembly: 60 line + 60 shade WebP at 1024 x 640, using the carbine encode
  recipe (line q62, shade q72 / alpha 85). About 2.6 MB per assembly, 7.8 MB for three.
- Loading: only the active assembly's set loads; the next one prefetches once scroll
  passes its beat. The page never holds more than about 5 MB of Chapter 04 frames
  before the console opens.
- Console extras load on landing: 9 finish stills plus 3 jobsite stills, about 2 MB.
- After Gate 2: videos and deck slides load only when their panel opens.
- No `.glb` on `/home/`.

## Page architecture (`proto/merged/` only)

- **Sheet and lens, Chapter 04:** generalise the armament stage (`tL`, `tS`, `uArm`,
  `uArmRect`) into a frame stage that takes a set name. Stage 4 swaps its gear train for
  three beats: 0-.33 cage, .33-.66 DD4SE, .66-1 receiver. A short line-only cross-fade
  between beats. `01 / 02 / 03` pills on the panel jump scroll to each beat. Pointer
  nudge as on the armament stage; off on touch and reduced motion.
- **Dive:** the version i tear and drop, unchanged. It lands on the console instead of a
  project plate.
- **Console (thin, for Gate 2):** plain DOM and CSS over the existing canvas, styled from
  the coded `C:/Projects/video-app-prep/12-ui-mockups.html` (never its `.jpg` mockups).
  - Assembly tabs 01/02/03.
  - Background: light, dark, jobsite.
  - Angle scrub: a slider and drag on the image, drawing frames from a decoded
    ImageBitmap cache into a 2D canvas (no second WebGL context).
  - A/B wipe: line frame against shade frame at the same angle, split by a draggable bar.
  - Finish chips: switch to the hero still at the hero angle.
  - Keyboard: Tab order through the controls, arrow keys scrub, Esc climbs out (existing
    climb-out). Focus moves into the console on landing and back to the pill on climb-out.
  - Reduced motion: no autoplay, scrub still works. Phone: controls stacked under the image.
- **Data:** one small manifest per assembly (frame count, paths, finishes, crop). No
  part numbers in labels or file names; files named `cage`, `pump`, `receiver`.
- **Copy:** pattern or designation only, no brands, no dimensions or GD&T.

## Sanitization checks (P0, before any frame ships)

- DD4SE: look for cast or embossed lettering in the mesh; hide that mesh or pick angles
  that don't show it.
- Receiver: inspect the 2 embedded images; drop any that carry marks. Ignore the
  embedded camera.
- After Gate 2, for proofs: mask the lettering in the parity photo, trim the MSP lockup
  off the RL300 videos, re-export the deck from the `.pptx` with logos removed from the
  slide master. No AI restyling, no AI imagery.

## Phases and gates

| Phase | Work | Spend | Tokens | Gate |
|---|---|---|---|---|
| P0 | Isolate the cage; local preview stills of all three (line + shade, low samples); sanitization checks | $0 | 60-100k | **Mark picks from the stills** |
| P1 | Pilot: cage, 60 line frames locally, 60 shade frames + hero stills on Modal | $0.10-0.50 | about 40k | **Quote stated, Mark's go** |
| P2 | Encode; Chapter 04 beat 1 and pills in `proto/merged/`; stills to Mark | $0 | 120-180k | Mark's look at beat 1 |
| P3 | DD4SE and receiver on Modal, one quote for both | $0.50-2.00 | about 60k | **Quote stated, Mark's go** |
| P4 | Thin console | $0 | 150-200k | Stills to Mark |
| P5 | Astra rules on the Chapter 04 beats and the console; private artifact; ask Mark for Gate 2 | $0 | about 40k | **Gate 2** |
| After Gate 2 | Parity, videos, deck (sanitized); then JG-045 | $0 | not estimated | Mark |

Checks per phase: one browser pass at desktop and phone width, light and dark, reduced
motion on and off; 0 page errors. No new test files unless one replaces an existing one.

## Not in this plan

Changes to `src/home/` (Gate 2 first), the paper tear (version i is Astra-approved),
chapters 01-02 chapter videos, the JG-043 carousel, audio, any deployment.
