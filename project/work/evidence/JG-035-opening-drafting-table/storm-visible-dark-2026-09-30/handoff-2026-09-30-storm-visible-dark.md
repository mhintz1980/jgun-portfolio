# JG-035 handoff — storm/visible-dark opening, pacing rebalance (2026-10-01)

Status: **paused mid-iteration at a coherent point.** The pacing rebalance is implemented and all
static gates pass (typecheck, build, 159/159 tests, contract 26/26). **Every browser artifact in this
folder is now stale** and must be re-run: the phases moved, so the pixel proof, the six-case roster and
the review media all describe the previous pacing. Nothing is staged, committed, pushed, or deployed.

Read first: [closeout review packet](review.md) · [execution plan](../../../../../docs/jgun-storm-flicker-visible-dark-plan.md) · [pacing reference measurement](oryzo-pacing-reference.json) · [model routing](model-routing.md).

Preserve every failed or superseded evidence folder. Do not overwrite one with a rerun.

## Owner direction this session

Mark confirmed both scope assumptions I had proceeded on: (1) **opening only** — enclosure/M249 page
separation stays a separate task, and (2) **cinematic storm-night tension**, not overt horror. He then
supplied two references: **oryzo.ai for pacing** and **https://youtu.be/WNK-AhfVJ8I** for techniques.
oryzo.ai is a Lusion site, so the pacing reference and the "on par with Lusion" bar are the same source.

## What changed — pacing rebalance

Measured oryzo.ai live rather than reading prose about it. At 1600x900 the reference is **56.12
viewports tall** with 16 text beats; consecutive beat gaps run 0.2 to 9.8 viewports (median ~3.3), its
opening statement gets ~3.1 viewports, and its longest hold carries one idea for ~9.7 viewports. Raw
measurement and interpretation: [oryzo-pacing-reference.json](oryzo-pacing-reference.json).

Against that, the old JG-035 lit recognition beat lasted **0.24 viewports** — a glitch rather than a beat.
The opening had no held moment at all; every beat ran 0.3-2.4 viewports.

| Beat | Old intro t | New intro t |
|---|---|---|
| Detail, traverse, establish | .00-.31 | .00-.29 |
| Registered lit hold | .40-.42 | **.38-.45** |
| Five irregular lamp failures | .42-.56 | .45-.58 |
| Visible-dark anticipation | .56-.62 | **.58-.66** |
| White electrical profile | .62-.76 | .66-.79 |
| Pressure and lamp return | .76-.84 | .79-.86 |
| Metal starts | .78 | .81 |
| Extraction | .84-1.0 | .86-1.0 |
| Perspective | .88 | .90 |
| Sheet fade | .96-1.0 | .97-1.0 |

`INTRO_SCROLL_SHARE` **0.40 -> 0.50** and `REDUCED_MOTION_INTRO_T` **0.40 -> 0.38** (pinned to
`onboardEnd`). `DRAWING_INTRO_WINDOW` stays `{ releaseEnd: 0.12, heroEnd: 0.525 }`, so the intro still
owns exactly 0.00-0.12 of the progress axis and no downstream constant moved. `LAMP_FAILURE_KEYS` u-values
are unchanged and still normalize inside the flicker window. Resulting beat sizes at the new share are
roughly 1.1-2.2 viewports each — a real breath everywhere, still tighter than the reference's 2.6-9.8,
which is the obvious next tuning dial. File: [introTimeline.ts](../../../../../src/scene/drawing/introTimeline.ts).

### A real regression was found and fixed

Raising the share exposed a latent defect in the handoff blend. The original `pacedProgress` blended
the two pacing *lines'* values across a band straddling the share. That leaves a residual term scaling
with `smooth01'(x)*(x-0.5)` (minimum -0.2071), so `dp/ds` goes negative once
`mainSlope - introSlope > 4.829 * introSlope`. At share 0.50 that ratio is 6.33 and **`dp/ds` measured
-0.0748 at raw ~0.4823**: progress rose to 0.1143733, fell to 0.1140288, then rose again. A small
forward scroll could move the whole scene backwards, and the bisection inverse in `rawScrollFor` was no
longer valid. Two workers found it independently (the DeepSeek tester derived it analytically; the GLM
verifier's contract checker measured a reverse delta of ~0.00035 across raw .4786-.4863).

Fix: start the blend band **at** the share instead of straddling it. With `h(x) = smooth01'(x)*x -
(1 - smooth01(x))` the minimum is `h(0) = -1`, so `dp/ds` bottoms out at exactly `introSlope` (> 0) at
the left edge and rises to `mainSlope` at the right. The blend is monotone for any slope ratio, stays
between the two lines, keeps C1 continuity at both edges, and because `introLine(share) ===
mainLine(share) === releaseEnd` the pinned identity `pacedProgress(INTRO_SCROLL_SHARE) === releaseEnd`
still holds exactly. Reasoning recorded in the `HANDOFF_BLEND` comment.

A second, smaller consequence: the settle move in the camera shot list compressed from 0.09 to 0.07 of
intro t when `onboardEnd` moved .40 -> .38, raising the peak camera step to 0.01025 against the 0.01
continuity bound in `sheetCamera.test.ts`. Fixed by restoring the whole-sheet reveal key from .31 to
**.29**, which returns the settle move to its original 0.09 duration. The 0.01 bound was not weakened.

## Gate state right now

| Gate | Result |
|---|---|
| Typecheck | PASS |
| Production build | PASS (existing large-chunk advisory) |
| Unit/integration tests | **159/159 PASS** |
| Drawing/B1-B2 contract | **26/26 PASS** (includes the monotonicity assertion) |
| Pixel proof | **STALE** — predates the rebalance, must be re-run |
| Six-case browser roster | **STALE** — must be re-run |
| Full-tier review media | **STALE** — must be re-run at the new .98 equivalent |
| Independent review | Prior "ship at the code boundary" verdict applied to the OLD pacing; needs a fresh pass |
| Owner visual approval | Open |

Preview is rebuilt and serving the new pacing on [http://localhost:4173/](http://localhost:4173/).

## Techniques from the supplied video

The reference is Giuseppe Galliano's 3D technical-animation reel for industrial machinery. Its stated
techniques are **exploded views, X-ray view, transparent renders, digital twin, and interactive technical
views** — it is a craft reference for showing internal mechanism, not a motion reference.

What the JG-035 opening already has: a geometry-derived exploded/extraction solve driven by the pose
axis, a translucent vellum-to-metal emergence, an authored electrical trace over the real profile, and
composed technical views with dimension lettering.

The clear gap is **X-ray / cutaway**: nothing currently reveals the internal mechanism through the
housing. The repo has prior, unsuperseded work pointing the same direction —
`project/archive/superseded/inspect-orbit-cutaway-camera-easing.md` and the cutaway "required upgrade"
note in [orzo-style-portfolio-implemetation-roadmap.md](../../../../../docs/orzo-style-portfolio-implemetation-roadmap.md) —
and the `glsl-transition-shader-pipeline` and `cad-scene-graph-rigging` skills
(under `.agents/skills/` at the repo root) are the ones that own that surface.

**Proposal, not implemented:** add one X-ray beat after the registered trace, before pressure. The
housing goes translucent on a scroll-driven front, the gearbox stage and ring switch read as interior
metal, then the housing closes as the sheet bows. It would reuse the existing profile/pose data so the
reveal stays geometrically truthful, and it fits the owner's "show what a camera cannot show" framing.
This is a new beat and needs an owner decision on placement and length before it is built.

## Next order

1. Owner confirms the new pacing reads correctly on the live preview, and rules on the proposed X-ray beat.
2. Re-run browser verification against the new contract, in this order, one browser at a time:
   `node scripts/verify-jgun-opening.mjs --url=http://localhost:4173 --quick`, then the full six-case
   roster, then `scripts/measure-jgun-visible-dark.mjs --require-tier=full`, then the .98 review media.
   Restart the :4173 preview after every rebuild.
3. Re-run the independent fresh-context review on the new diff; the previous verdict covered the old pacing.
4. If the X-ray beat is approved, implement it as its own pass with its own evidence and do not fold it
   into the storm numbers.
5. Commit and push only on explicit owner instruction, staging session-owned paths explicitly. Never
   `git add -A`; the tree holds unrelated drift and untracked evidence folders.

## Known limits

- Browser evidence for the rebalanced pacing does not exist yet. Do not cite the old pixel or roster
  numbers as current.
- Beat sizes are 1.1-2.2 viewports against the reference's 2.6-9.8. Raising `INTRO_SCROLL_SHARE` further
  is now safe (the blend is monotone at any slope ratio), but it squeezes the downstream chapters that
  still share this page until the page split ships.
- The doc worker recalculated the animation-spec global interval column for the new boundaries; spot-check
  those arithmetic values before they are relied on for a commit.
- The full-browser roster takes roughly 8-10 minutes and only one browser may run at a time.
- Tier cannot be forced upward (`setTier` only downgrades), so full-tier motion recording depends on the
  adaptive ratchet.
- Existing wood and material finish is untouched by this work. No Lusion parity is claimed.
- DeepSeek ran clean this session (no 429 observed), so no reassignment was needed.

## Where this work is still weak

Judging perceptual rhythm and matching Mark's taste remains the hard part, and the new numbers are a
measurement-driven guess rather than a ratified feel. Temporal finish is still unproven: the reference's
long holds come from a full site, and a scrubbed video cannot show how the rebalanced beats read under
real scroll velocity. The X-ray proposal is a craft direction read off a video description rather than
from watching the reel frame by frame, so it should be treated as a starting point for the owner's eye.

