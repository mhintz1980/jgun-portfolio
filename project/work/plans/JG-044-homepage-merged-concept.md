# JG-044 (proposed ID) — Merged homepage concept: one sheet, one lens, one fall

Written 2026-11-16. Status: **plan only, awaiting owner go.** Nothing is built.
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

1. Whether the 180 frames are evenly spaced in angle. The film's spin is eased with a
   4 degree overshoot; if that easing is baked into the frames, the pointer nudge needs
   frames picked by angle, or a short even-angle re-render (Blender, local, no spend).
2. Frame rate with the paper shader, lens and frame scrub all live on a mid laptop.
   Concept 3 alone measured 60 fps.
3. Touch, DPR 2, Firefox and Safari were never tested on concept 3.

## Not in this plan

Showreel edits, the JG-043 arc carousel, any new project copy, any deployment.
