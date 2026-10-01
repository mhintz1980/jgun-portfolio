# JG-035 handoff — 2026-09-30 (keep ink dark; blackout lightning trace; Matrix-mirror emergence)

Supersedes `handoff-2026-09-28-reconciliation.md` (context only; its repo-state
section is stale). Driving input is Mark's 2026-09-29/30 direction below. The
navy pulse candidate sitting uncommitted in the tree is **prior art**, not the
current direction.

## Owner direction (condensed from the session)

1. **Defect:** immediately before the profile outline animates, the paper
   brightens and the linework dims. Both owner screenshots
   (`C:/Users/Markimus/Pictures/Screenshots/just-before-change.png` and
   `just-after-change.png`) are **before** the outline animation.
   **Linework must stay as dark as possible.**
2. **New concept, superseding navy:** the animated outline is hard to see in
   dark blue, and white on the bright paper is also bad. New beat plan: the
   desk lamp flickers and goes out (about a second of dark scene), then a
   white outline animates like lightning bolts firing around the profile view
   (add effects as needed), then the page bulges and the model animates out of
   the page like the "finger in the mirror" scene in *The Matrix* — the paper
   drawing is the mirror, the model is the finger.
3. **Delegation boundary:** Astra does **high-level visual direction only**
   (beat treatment, timing, what to preserve). Astra does not implement,
   verify, or do routine work — its token cost is not justified for that.
4. **Push only after owner visual approval.** Pushing `origin` deploys the
   live site (Cloudflare Pages → www.studiomark.dev).

## Attachment access (settled earlier this session)

- The two owner screenshots above **are** accessible and bracket the visible
  paper-brighten / ink-dim shift.
- The separately described *Matrix* reference image was **not** among the
  attachments received. The written analogy is enough to brief Astra; pull a
  public reference frame only if the brief needs one.

## Live repo state (verified 2026-09-30)

Branch `codex/jg033-signature-shot`, in sync with `origin`. Working tree has
uncommitted JG-035 candidate work — **preserve it; do not reset**:

- Modified `src/scene/drawing/DrawingLinework.tsx` — navy ink-color pulse
  candidate: removes `AdditiveBlending`/`PULSE_GAIN`; the pulse fragment now
  outputs the drawing ink color directly (`uInk`, `INK = '#15295a'` from
  `drawingGeometry.ts:19`); telemetry `pulseLuminance` recomputed from ink.
- Modified `src/state/scrollStore.ts` — comment-only (`pulseLuminance` docs).
- Modified `TODO.md` — JG-035 entries for the 09-29 reconciliation and the
  outline candidate.
- Untracked evidence/context:
  `project/work/evidence/JG-035-opening-drafting-table/{astra-ink-pulse-prompt-2026-09-29.md,
  astra-ink-pulse-review-2026-09-29.md, higgsfield-account-reconciliation-2026-09-29.md,
  ink-pulse-candidate-2026-09-29/, resolved-close-2026-09-29/,
  resolved-close-full-attempt-2026-09-29/, visual-ruling-packet-2026-09-29.md}`
  and `project/context/project-brief-2026-09-29.md`.

Prior verification on that candidate: typecheck clean, build, 145/145 tests,
full-tier stills at .060/.066/.072 in `ink-pulse-candidate-2026-09-29/`.
Astra's stills review (`astra-ink-pulse-review-2026-09-29.md`) kept the navy
direction but flagged motion readability. That ruling predates the owner's
blackout/lightning direction — treat it as fallback prior art, not the plan.

## The pre-pulse shift: facts vs suspects

- `src/scene/drawing/introTimeline.ts` `INTRO_PHASES` (lines ~90–114), on the
  intro's own axis `t = p / 0.120`: `pulseStart: 0.4`, `pulseEnd: 0.6`,
  `metalStart: 0.54`, `riseStart: 0.6`. The explicit `contrast` falloff
  (line ~196) starts only at `riseStart` (`contrast = 1 − 0.72·smooth01((t −
  0.6)/0.34)`) — **after** the pulse, so it does not explain a pre-pulse dim.
- Prime suspect: the reading-lamp pool in `DrawingLinework.tsx` (~lines
  604–613) trails the camera's look-at every frame into `uLamp` (radius
  0.09–0.32, exponential falloff, adds up to `0.1·pool` to paper light at
  lines ~132–137). As the camera settles on the profile before the pulse, the
  pool can slide under the drawing and locally brighten paper; brighter paper
  reads as dimmer ink. The pressure-emboss tilt toward the fixed key lamp and
  the contact shadow may contribute.
- **Not yet measured — do not fix on assumption.** Capture dense frames across
  t ≈ 0.30–0.42 (p ≈ 0.036–0.050) with fixed sheet-space paper/ink sample
  patches plus per-frame uniform dumps (`uLamp`, `uContrast`, `uOpacity`,
  `uPulse`, `uVellum`, contact/pressure). Identify the actual driver first,
  and record the table in a new evidence folder (suggest
  `pre-pulse-shift-2026-09-30/`).

## Next session, in order

1. **Measure the pre-pulse shift** as above, matching the owner screenshots'
   framing with the existing capture harness. Fix the measured driver so ink
   stays maximally dark into the pulse (likely: gate/damp the trailing lamp
   pool across the pre-pulse window, or hold the relevant multipliers flat —
   per data, not taste).
2. **One Astra call, high-level only.** Attach the two owner screenshots plus
   the current candidate stills. Brief: the dark-ink defect and the four new
   beats (lamp flicker/out; white lightning trace during blackout; paper
   bulge; Matrix-mirror emergence), plus the reduced-motion constraint. Ask
   for beat timing/treatment and what to preserve. No code, no verification,
   no unrelated review.
3. **Implement here or with cheap subagents — not Astra:**
   - Lamp flicker → blackout: a new intro scalar (e.g. `lampPower`) driving
     the existing key/pool uniforms; keep the fixed warm key as the pre-flicker
     look.
   - Lightning trace: white/emissive is justified **only against the
     blackout**; reuse the pulse-arc shader (it already has flicker/noise
     hooks) with a lightning breakup; add effects as the Astra ruling directs.
   - Bulge + emergence: extend `paperFlex` or add a dedicated bulge centered
     on the profile; re-time extraction so the metal tracks the bulge
     (mirror-mercury feel). Any phase change must keep `introPoseTime`'s pose
     axis intact (extraction starts at pose 0.4; `extractionPose.ts` solver
     stays untouched) and update `INTRO_PHASES` plus the spec §5 tables in the
     same change.
   - Reduced motion must land on a valid lit still, skipping the
     flicker/blackout. Current still point is `REDUCED_MOTION_INTRO_T = 0.4`
     (`introTimeline.ts:35`, used in `TorqueWrenchHero.tsx:265–268` and
     `CameraRig.tsx:205–208, 430–433`) — exactly `pulseStart`, so the still
     predates the new beats and needs a deliberate re-pin if windows move.
4. **Verify:** iterate with `node scripts/verify-jgun-opening.mjs --quick
   --url=http://localhost:5199` (dev port floats — use whichever is live;
   restart the :4173 preview server after every rebuild). Add telemetry probes
   for the new beats (`lampPower`/blackout, lightning luminance, bulge
   displacement); telemetry, never vision alone. Done evidence: full 6-case
   roster + typecheck + tests.
5. **Owner visual approval, then push.** Update `TODO.md` when the direction
   lands.

## Suggested skills

- `webgl-telemetry-verifier` — every probe/capture and the pre-pulse
  pixel/uniform measurement.
- `r3f-scroll-performance-guard` — intro timeline, clock, and re-windowing
  changes.
- `glsl-transition-shader-pipeline` — lightning/bulge shader work.
- `astra-advisor:orchestration` (or `orchestration`) — routing the single
  Astra visual-direction call; keep Astra scoped to the ruling.

## Cautions carried forward

Telemetry, not vision alone; part numbers (not stage names) are the stable
key; never commit `.scratch/`, credentials, or `.env.local`; GPU captures
contend with the in-app browser pane (playwright `--use-angle=d3d11` for
evidence); build from the realpath
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`, not the
`C:\Projects\jgun-portfolio` junction; the buzz remote was removed 09-29 —
`origin` is authoritative and pushing deploys.
