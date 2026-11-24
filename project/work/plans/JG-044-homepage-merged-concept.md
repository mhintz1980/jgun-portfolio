# JG-044 (proposed ID) — Merged homepage concept: one sheet, one lens, one fall

Written 2026-11-16. Status (updated 2026-11-18): **prototype built in `proto/merged/`**
(phases 1-4, paper tear version i Astra-approved); **Gate 2 open.** The chapter-video
direction and the Chapter 04 plan below are **planning only**: no Blender, no Modal.
Owner approved the merge direction and the pointer look-around on 2026-11-16.

## Cost and gates first

- **Rough build cost:** 400-600k tokens on Fable 5.2 for the prototype (phases 1-5),
  about half that again to wire it into `src/home/` (phase 7). Estimate, not measured.
- **Cheapest variant:** stop after phase 2 (opening + gear train on one paper). That is
  roughly 150-200k and already shows whether the blend works.
- **Three owner gates:** the paper still (phase 1), the merged prototype (phase 6),
  the wired page (phase 7). No push and no `src/home/` change before the matching gate.
- **Blocked on owner:** audio notes (phase 5). The page stays silent until they arrive.

## What the merged page is

| Stage | Comes from | What the visitor gets |
|---|---|---|
| Opening | Concept 1 | Paper sheet, big headline, lens follows the pointer |
| Gear train, 4 project stages | Concept 3 | Code-drawn planetary train, lens shows shaded metal |
| Armament stage | Showreel frames | Line frames on the sheet, shaded frames in the lens |
| Fall | Concepts 2 + 3 | Click or Enter drops down the bore to a project plate |
| Project plate | Concept 3 | Project summary and link |

Dropped: concept 1's scan-line doorway, concept 2's CSS 3D cards.

## The blend from opening to gear train (owner note 2026-11-16)

The two concepts use different whites, made two different ways:

- Concept 1: flat CSS paper `#f4f1ea` with a drawn grid.
- Concept 3: shader paper `#f1eee6` with fibre grain, a blue grid tint and a 16% edge
  vignette (`proto/exploded-view/main.js` lines 265-268). It reads greyer on screen.

Plan: **there is only one sheet.** The concept 3 paper shader runs behind the whole page
from the first pixel, and the opening headline sits on it as normal text. There is no
second background to cross-fade to, so there is no seam to hide.

1. One paper colour, one grain, one grid, one vignette, defined once and used by both
   the canvas and the CSS (title block, borders, buttons).
2. Recommended tone: concept 1's lighter, warmer `#f4f1ea` with concept 3's grain, and
   the vignette cut from 16% to about 8% so the headline does not sit on grey corners.
3. The handover is motion, not colour: as the visitor scrolls, the opening's 2D drawing
   linework fades while the gear train's drawn edges come in at the same position and
   scale, and the headline slides off. The lens stays on screen the whole way and keeps
   its size, ring and label.
4. Dark side matched the same way: lens interior, the fall and the plates all use
   `#0b1622` / `#05070a`, already shared by all three concepts.
5. **Gate 1:** before anything else is built, Mark gets one still with two or three
   paper options side by side and picks.

## Pointer look-around

| Stage | Effect | Limit |
|---|---|---|
| Opening | Layered parallax: headline, linework, title block and lens at different depths | A few pixels of travel |
| Gear train | Real camera tilt; drawn edges redraw to match | About 4-6 degrees |
| Armament | Scroll picks the angle, pointer nudges a few frames either side | See open check 1 |
| Project plate | Same layered parallax as the opening | A few pixels |

Rules for all four: eased, small enough not to fight the lens, off for
`prefers-reduced-motion`, off on touch (page stays flat).

## Armament stage

- Source: 180 line + 180 shaded frames of the AR-15 pattern carbine, one full spin, in
  worktree `armament-wiring-clipspin-15a80d`
  (`remotion/clips/armament/ar15-pattern-carbine-a/{line,shade}/`), gitignored.
- They are lossless and total 72 MB. The page needs a re-encoded web set: about 60
  frames per layer, 1280 px wide, lossy WebP, target under 4 MB for both layers.
- Label by pattern only ("AR-15 pattern carbine"). No brands. No `.glb` on `/home/`.

### Frame facts (answered 2026-11-16, read 2026-11-17)

Source: `docs/ANSWERS-homepage-armament-frames-2026-11-16.md` in worktree
`jg-041-spin-shot-review-12f814` (measured by the video session, read-only, $0).

- **Even angles, no easing baked in.** Frame `i` = `2*i` degrees, 0 to 358, and the set
  loops cleanly. The eased spin with the 4 degree overshoot exists only in Remotion.
  The web set is every third frame (`f0000, f0003, ... f0177`): 60 frames, 6 degrees
  apart. A file copy and re-encode; no render, no spend.
- **No motion blur** in the frames.
- **Both sets are 1920 x 1080.** Line frames are opaque white: multiply them onto the
  paper. Shade frames have a transparent background.
- **Line N and shade N register within 2 px** on every bounding-box edge. The lens can
  swap layers with no offset correction.
- **The rifle is not screen-centred.** Bounding-box centre x moves 839 to 1076 over the
  spin (frame centre 960); centre y is 619 to 638 (frame centre 540), so it sits 80 to
  100 px low. Side-on it is about 1586 px wide, end-on about 130 px. Worst-case clear
  margins: left 97, right 99, top 367, bottom 204 px. The web crop must be cut once for
  the whole set, not per frame, or the spin will wobble.
- **The camera rises with the spin:** 0 degrees elevation at 0, 10 degrees at 180. The
  pointer nudge moves along this same path.
- **Frames are gitignored and local only.** Re-encoded web frames can be made and used
  locally at no cost. Committing them needs Mark's go.
- **Only this carbine has frame pairs.** No other armament model is rendered.

### Open for Mark: the label

This carbine is a stand-in, not Mark's own design (owner ruling 2026-11-13). The film
shows it with two lines: "AR-15-pattern carbine" and "(IP-Safe Representative Model)",
and the film's rules test requires the second line. This plan says pattern only. Mark
decides whether the homepage carries the second line too.

## Chapter-video direction (Mark, 2026-11-17; Chapter 04 approved 2026-11-18)

Each chapter shows a rendered model instead of the code-drawn gear train: the sheet
shows a line pass, the lens shows the same frames photoreal. Source: Blender Cycles on
Modal, numbered WebP frame sequences scrubbed by scroll (not MP4), both passes from one
camera so the lens registers with the sheet (same pattern as `proto/merged/arm/`). The
chapter button runs the version i tear and dive. No `.glb` on `/home/`.

| Chapter | Model | Status |
|---|---|---|
| 01 Torque wrench | Torque wrench, rotate and explode (`C:/Projects/CAD/Default.glb`) | Pilot not started |
| 02 Quiet Machine | Enclosure, 360 turn or section (`C:/Projects/CAD/RL300-SAFE/`) | Not started |
| 03 Armament | AR-15 pattern carbine spin (120 frames, built) on the stage; drop lands on the approved armament cut plus an M249 reverse-engineering beat | Ruled 2026-11-20, see below |
| 04 Renderings, Animation & StudioMark | 3 assemblies + StudioMark console, see below | Planning |

Still open for Mark: what dives 01-02 land on (showreel passage or one clip per
project). Chapter 03 is ruled below.

### Chapter 03: Armament (Mark, 2026-11-20; expanded 2026-11-24)

- **Drop landing (option D, approved & wired 2026-11-24):** `proto/merged/arm/drop-reel.mp4`
  (faststart remux of `armament-review-spin-v2.mp4` from `armament-wiring-clipspin-15a80d`,
  rendered 2026-11-16, 1920×1080, 22 s, no audio) plays as item `01 / 06` at the bottom of
  the Project 03 dive, with the 5 existing stills preserved as `02 / 06`–`06 / 06`. Lazy
  loaded only when diving into Project 03 (0 requests on initial page load). Background
  audio: `music-bed-v1.mp3` (kept for background use, `project/work/evidence/jg-041-showreel/`).
- **2026-11-24 Owner rulings & expanded M249 video direction (Mark):**
  - **Representative visuals approved** for all armament video content.
  - **Models approved for video creation only** (no `.glb` on the homepage/website):
    Mark's own models, exploded views, **`M249FN`**, **AR-15**, **MK-18**, and any additional
    models added. *(Supersedes the earlier `m249_FN.glb` ban for video creation;
    `m249-transformed.glb` stays excluded from the site; `remotion/src/rules.test.ts` must
    be updated before video production runs against `M249FN`.)*
  - **SolidWorks source location (verified 2026-11-24):** `C:\Projects\CAD\Markimus-M249`
    (92 `.SLDPRT` / `.SLDASM` files present). Mark is converting these models to GLBs for
    video creation.
  - **Goal:** build a cinematic M249 video with exploded assemblies alongside the AR-15 /
    MK-18 / additional models, and tell the reverse-engineering story of the parts.
- **Corrected M249 reverse-engineering account (over ~1 year managed at Black Creek Precision):**
  1. **Hand-measuring equipment first:** calipers, micrometers, height gauges, indicators,
     plug gauges (plus pin gauges and Rockwell hardness testers from the 2026-11-20 notes).
  2. **3D scanner later (verification):** BCP bought a 3D scanner later in the project and
     used it on several parts **mainly for verification** (with Geomagic → SolidWorks), rather
     than as the primary measurement path.
  3. **Materials, finishes, heat treatments & prints:** manufacturing prints were unavailable
     and BCP wanted to improve on the baseline design, so Mark determined materials, chose
     alternate materials, finishes, and heat treatments using his career materials/heat-treat/
     fabrication/machining-finish knowledge and R&D; created prints for most parts (commercial
     parts and custom OEM springs such as the Drive Recoil Spring) and outsourced prototypes
     to his prints.
- **Minimum the viewer must get:** the reverse-engineering workflow (hand metrology → later 3D
  scanner verification → SolidWorks CAD & prints, materials/heat-treat/finish selection, custom
  OEM springs, and outsourced prototypes).
- **Walls that still apply:** no dimensions, GD&T, part or drawing numbers on screen; no `.glb`
  loaded by `/home/`. Drawing treatment on screen (masked drawing sheets / line-pass renders
  of SolidWorks parts / caption only) remains open for Mark.
- **Next step:** receive Mark's converted GLBs from `C:\Projects\CAD\Markimus-M249` + clarify
  storyboard/tone questions before starting a `$0` stills storyboard.

### Chapter 04: Renderings, Animation & StudioMark

Full record: `docs/HANDOFF-chapter4-studiomark-design-2026-11-18.md`.

- **Approved by Mark:** merge Renderings with the StudioMark ("CAD to Ad") pipeline into
  one chapter; three assemblies scroll-sequenced (0-.33, .33-.66, .66-1) with
  `01 / 02 / 03` specimen pills; local $0 previews before any Modal run.
  1. A large planetary carrier cage (`Default.glb` / `RL300-SAFE/optimized/jgun-gearbox.glb`).
  2. DD4SE open-skid pump (`C:/Projects/msp-render-pipeline-scene-prep/cad/DD4SE-clean.glb`).
  3. M249 sub-assembly, Option B (`Topcover Assembly.glb` or `M249 Receiver Plus.glb`).
- **Bottom of the dive:** a simulated StudioMark console from pre-rendered frames,
  stills and MP4s: assembly switch, light / dark / jobsite background, finish swap,
  angle scrub, A/B wipe raw CAD vs Cycles, truth-photo parity, raw-vs-post video, the
  20-slide training deck. Coded UI after `C:/Projects/video-app-prep/12-ui-mockups.html`;
  no AI mockups, no AI product renders.
- **Plan rules (2026-11-18 review):**
  1. M249: confirm Mark's own geometry; BCP-condition display shells; no part or drawing
     numbers in labels or frames. `m249-transformed.glb` and `m249_FN.glb` stay banned.
  2. Weight by reuse: shade pass on transparent (backgrounds drawn by the page); one
     60-frame angle set per assembly serves the scroll beats and the console scrub;
     finishes as hero stills only; A/B wipe = line vs shade on the same frame. Target
     about 6-7 MB of frames; console videos and deck load only when it opens.
  3. Gate 2 scope: thin console (switch, background, scrub, A/B) in Gate 2; parity,
     videos and deck after it, so Gate 2 and JG-045 are not held up. Mark decides.
  4. Pilot: planetary cage only, $0 local stills, then one Modal run with cost stated
     and Mark's go, before DD4SE and the M249 piece. Same scene setup as the 01 pilot.
  5. Astra rules on the console and every Chapter 04 effect.
  6. Brand sanitization of existing proofs (MYERS-SETH lettering, MSP lockups, RL-300
     plates) and the `content.test.ts` bans: Mark rules before any proof is used.
- **Ruled 2026-11-19:** cage A000861 (stage 4); `M249 Receiver Plus.glb`, Mark's own
  geometry; clean all brand marks; thin console for Gate 2. Implementation and asset
  plan, with costs and phases: `JG-044-ch04-studiomark-plan.md` (awaiting Mark's go).
- **Cost estimates (not measured):** planning about 150-250k tokens; Modal Cycles for
  all three assemblies about $2-6 (carbine: $0.48 full 360-frame render, $0.05
  shade-only). No spend without the stated cost and Mark's go for that run.

## Phases

1. **Paper.** One shared paper, three tone options, one still to Mark. *Gate 1.*
2. **Opening on the shared sheet.** Concept 1's headline, linework and title block moved
   onto the concept 3 canvas page; scroll handover into the gear train. Still to Mark.
3. **Pointer look-around** on opening, gear train and plates.
4. **Armament stage.** Re-encode frames, scroll scrub, lens register, pointer nudge.
5. **Audio.** Waits for Mark's notes. Current synth sound is removed from the merged
   page, not tuned further.
6. **Prototype review.** Fix the known concept 3 flaws that survive the merge: focus on
   landing and climb-out, Esc during the first half of the fall, reduced motion beyond
   a shorter fall. Publish as a private artifact. Astra rules on lens, fall, look-around
   and blend. *Gate 2: Mark approves the prototype.*
7. **Wire into `src/home/`.** Testimonial shows "BCP" only. `content.test.ts` bans
   "M249"; that ban is changed in the same commit as the armament copy. Run
   `npm run check`. *Gate 3: Mark approves, then push.*

Film: the full showreel goes behind the opening lens only after Mark accepts the new
cut. Until then the opening lens shows the shaded gear train. Not part of this plan.

## Where the work happens

- Prototype path: `proto/merged/` (new), reusing `proto/exploded-view/main.js` as the base.
- Branch: `claude/homepage-concepts-merge-2a1f76` currently has no `proto/`. It is a
  direct ancestor of `claude/homepage-concept-3-verdict-f323c0`, so the first build step
  is a fast-forward to that branch. No merge conflict is possible.
- Checks: build plus one browser pass at desktop and narrow width, reduced motion on and
  off. No new test files unless one replaces an existing one.

## Open checks (cheap, done at the start of the phase that needs them)

1. ~~Whether the 180 frames are evenly spaced in angle.~~ **Closed 2026-11-17:** they
   are even, 2 degrees apart, no easing baked in. See "Frame facts" above. No re-render.
2. Frame rate with the paper shader, lens and frame scrub all live on a mid laptop.
   Concept 3 alone measured 60 fps.
3. Touch, DPR 2, Firefox and Safari were never tested on concept 3.

## Not in this plan

Showreel edits, the JG-043 arc carousel, any new project copy, any deployment.
