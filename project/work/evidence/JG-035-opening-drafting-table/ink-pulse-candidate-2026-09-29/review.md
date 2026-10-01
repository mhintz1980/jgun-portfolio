# JG-035 navy ink pulse candidate — 2026-09-29

Owner ruling: the bright early outline does not play well against the light
paper; try the drawing linework color and ask Astra.

## Change

`DrawingLinework.tsx` now renders the profile pulse through the existing
`uInk` uniform (`INK = #15295a`) with normal alpha blending. The prior
cyan additive gain was removed. Head/trail shape, pulse timing, sheet flex,
camera, model emergence and registration are unchanged. `pulseLuminance`
telemetry now reports the ink-color peak instead of the old additive light.

## Captures and checks

Fresh production build, restarted preview at `localhost:4173`;
`capture-jgun-opening.mjs` recorded .060/.066/.072 at 1600 × 900. All three
frames passed, had no page errors, and stayed in the **full** tier. At .060
registered-hold error was 0.000295 px (gate 0.1 px); at .066/.072 the
23.05/39.60 px values are the designed camera-rake parallax. Pulse is on
at .060/.066 and off at .072. Its reported peak ink luminance is 0.0248
(baseline additive value 7.67). `npm run typecheck`, `npm run build`,
`npm test -- --run` (145/145) and `git diff --check` passed. No full six-case roster was rerun for this
color/blending candidate.

Baseline images: `../continuation-2026-09-27/frames-retry/p0.0600-1600x900.png`
and `../continuation-2026-09-27/frames/p0.0660-1600x900.png`.
Candidate images and telemetry: `p0.0600-1600x900.png`,
`p0.0660-1600x900.png`, `p0.0720-1600x900.png`, `frames.json`.

## Astra review

[Review prompt](../astra-ink-pulse-prompt-2026-09-29.md) sent with five
attached images in baseline/candidate order. [Verbatim verdict](../astra-ink-pulse-review-2026-09-29.md):
**keep the navy direction; it is a meaningful improvement on cream paper.**
Astra says the central contour remains visible and the .072 handoff reads
coherently. The collar at .060 and trigger lip at .066 may be slightly heavy;
she recommends leaving current weight/opacity/timing for a motion review,
then adjusting only if playback shows a lingering border or a weak event.
The routed request `ocx-e5af5dacff1f0ecaf122ae353dc9e4e5` returned
HTTP 200 with `servedModel=gpt-6-astra` (OpenAI; one settled send).

The stills prove the color comparison, not travel or pacing. A separate
browser-video attempt dropped to lite and its animation-frame callback
stalled, so it was excluded as motion evidence. The owner has not yet
ruled on this candidate. No code or media was pushed.
