# JG-044 sub-plan: Chapter 04, Renderings, Animation & StudioMark

Written 2026-11-19. Status: **plan approved 2026-11-19 ("Approve, start P0"); P0 done
same day; P1 not started.** No Modal spend. Next: apply ruling 6 (pump mesh fill), check
the discharge badge, then the P1 Modal quote for Mark's go.
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
6. **Pump marks: fill them in the mesh** (Mark, 2026-11-19, answering the P0 question):
   fill the logo and letter cutouts in a scratch copy of the DD4SE mesh — not
   cover-removal plus angle-hiding. The nameplate part (DDS-MSP-0001) stays simply removed.

## P0 pilot stills (2026-11-19, local, $0)

Contact sheet: `docs/ch04-studiomark-p0-stills-2026-11-19.png`. Four sections —
cage A000861 (line pass + Cycles placeholder-steel shade), DD4SE skid (own materials,
brand marks still in geometry), Receiver Plus (own materials), and a DD4SE test with
nameplate + engine cover removed (DD4S corner letters remain — supports ruling 4).
Rendered locally, Blender 5.2.2 LTS Cycles (CPU/CUDA), azimuths 0/120/240, line + shade
per assembly. No Modal spend. Full frame set, logs, `p0_preview.py` and the extracted
cage GLB stay in session scratch `.scratch/ch04/` (gitignored, not committed).

**P0 findings (2026-11-19):**
- Cage A000861 passes: no marks in the mesh; reads well in both passes. Steel is a
  placeholder (the cage file has no real materials yet).
- Receiver passes: both embedded images are a plain stock rubber texture, no marks. At
  azimuth 0 it is seen end-on, so the beat must start side-on.
- Pump FAILS sanitization until the mesh fix (ruling 6): "MYERS-SETH PUMPS" is a
  separate nameplate part (DDS-MSP-0001, removable — the sheet's test row shows it
  gone); "MSP BUILT FOR BATTLE" is cut into the engine cover (DD4-ECH-2001); "DD4S"
  letters are cut into the skid corner plates and survive cover removal. One small
  badge near the discharge is still unexamined — check it during the fill pass.
- The local CUDA driver did not load (CUEW init failed), so the P0 shade passes ran on
  CPU. Consequence: P1/P3 shade renders belong on Modal, or they are slow locally.

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

- **Blender version (pinned 2026-11-19, owner): 5.3.0** — build hash `02f0899d78e3`,
  bundled Python 3.13.13, `C:\Program Files\Blender Foundation\Blender 5.3\blender.exe`.
  `blender` resolves via the `~/.local/bin/blender.cmd` shim (pinned to this path
  2026-11-19); scripts keep the absolute path for reproducibility. P0 stills were 5.2.2 LTS.
  Before any P1 spend: (a) run the copied `render_clip.py` and `p0_preview.py` clean on
  5.3 (compat notes: `PropertyGroup.name` default is read-only in 5.3; `use_nodes`
  deprecation warnings continue); (b) after the pump mesh fill, re-render its preview
  stills on 5.3 so every preview baseline matches the P1 engine; (c) one same-scene
  5.2.2-vs-5.3 cage still (line + shade) to know the drift; (d) Modal — the current
  image pins the 5.2.2 Linux archive, so build/verify a 5.3 image (or state the
  fallback) before the cage pilot. JG-041's rendered frames and its 5.2.2 Modal image
  stay untouched (parity of the approved showreel look).
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

- DD4SE: cast lettering confirmed in the mesh (see P0 findings). Fix = ruling 6: fill
  the cutouts in a scratch copy of the mesh; nameplate part removed. Check the
  discharge badge during that pass.
- Receiver: the 2 embedded images are stock rubber, no marks (done). Ignore the
  embedded camera.
- After Gate 2, for proofs: mask the lettering in the parity photo, trim the MSP lockup
  off the RL300 videos, re-export the deck from the `.pptx` with logos removed from the
  slide master. No AI restyling, no AI imagery.

## Phases and gates

| Phase | Work | Spend | Tokens | Gate |
|---|---|---|---|---|
| P0 | Isolate the cage; local preview stills of all three (line + shade, low samples); sanitization checks | $0 | 60-100k | **Mark picks from the stills** — done 2026-11-19, rulings 6 + findings above |
| P1 | Pilot: cage, 60 line frames locally, 60 shade frames + hero stills on Modal | $0.10-0.50 | about 40k | **Quote stated, Mark's go** |
| P2 | Encode; Chapter 04 beat 1 and pills in `proto/merged/`; stills to Mark | $0 | 120-180k | Mark's look at beat 1 |
| P3 | DD4SE and receiver on Modal, one quote for both | $0.50-2.00 | about 60k | **Quote stated, Mark's go** |
| P4 | Thin console | $0 | 150-200k | Stills to Mark |
| P5 | Astra rules on the Chapter 04 beats and the console; private artifact; ask Mark for Gate 2 | $0 | about 40k | **Gate 2** |
| After Gate 2 | Parity, videos, deck (sanitized); then JG-045 | $0 | not estimated | Mark |

Checks per phase: one browser pass at desktop and phone width, light and dark, reduced
motion on and off; 0 page errors. No new test files unless one replaces an existing one.

## Tooling manifest (owner staging view)

Exact tools per phase, so Mark can research/install updates, skills and MCPs between
phases. Convention: vault `06-AI-Agents/plan-tooling-manifests.md`. Don't switch a
tool version mid-lane; stage changes between phases.

| Phase | Tools (version pinned) | Purpose | Owner staging notes |
|---|---|---|---|
| P0 (done) | Blender 5.2.2 LTS local (Workbench line, Cycles shade), `p0_preview.py` | local $0 stills | Staged 2026-11-19: owner upgraded to **5.3.0** between P0 and P1 (exactly the between-phases window); P0 stills stay 5.2.2 history |
| P1, P3 | Blender **5.3.0** (local absolute path, hash `02f0899d78e3`; see Render setup pre-checks) + Modal Cycles GPU on a **5.3 image** (build it — current image pins 5.2.2) + copy of `render_clip.py` from the armament worktree | cage pilot, then DD4SE + receiver shade frames | Modal spend gated per run; DLSS 4.5 denoiser (new in 5.3) may cut Modal sample counts — evaluate in the pilot |
| P2, P4 | `proto/merged/` vanilla JS + 2D canvas frame stage; plain DOM/CSS console; `cwebp` 1.6.0 encode | Chapter 04 beats, pills, thin console | No R3F/drei/three.js on `/home/` (no .glb there); UI styled from coded `12-ui-mockups.html` |
| P5 | Astra rules pass (`webgl-mechanical-cinematography-td`), desktop+narrow browser checks | effects ruling, Gate 2 ask | — |
| After Gate 2 | Remotion 4.0.540 (pinned — never `npx remotion upgrade`) + `video-shotcraft` Motion Workbench; Blender/Modal for re-renders | 16:9 masters, cutdowns, 9:16 verticals; parity videos, deck | Same Remotion lane as showreel JG-041 "The Line" |
| Not used | Hyperframes (no plan references it); R3F/drei on `/home/`; Higgsfield (authorized but not needed here) | — | Say so in the session if that changes |

## Not in this plan

Changes to `src/home/` (Gate 2 first), the paper tear (version i is Astra-approved),
chapters 01-02 chapter videos, the JG-043 carousel, audio, any deployment.
