# F1 deterministic FAILED stamp — implementation evidence

Recorded: 2026-10-08 23:29:17 UTC

## Authorization boundary

- Parent reported V1 `npm run build` exit 0 at 2026-10-08 23:27:00Z and released source-edit permission for F1.
- GPU remained owned by V1 during this work. No browser, build, preview-server, or GPU command was run.
- Ownership was limited to `src/components/ShaftStoryLayer.tsx` plus the identified stamp impulse rules in `src/components/ShaftStoryLayer.css`.

## Changes

- `src/components/ShaftStoryLayer.tsx`: the FAILED span now renders `transform: rotate(-4deg) scale(frame.stampScale)`; it no longer conditionally applies `shaft-stamp-impulse`.
- `src/components/ShaftStoryLayer.css`: removed only `.shaft-stamp-impulse`, `@keyframes shaft-stamp-settle`, and the matching reduced-motion animation override.
- `src/scene/inspection/shaft/script.ts` was not modified. `sampleShaftScript(time, reducedMotion)` remains the sole timing/scale authority; reduced motion continues to produce `stampScale = 1`.
- Card text, status announcements, transcript, and FOS rendering were not changed.

## Verification completed

- `npm run typecheck` — exit 0.
- `git diff --check -- src/components/ShaftStoryLayer.tsx src/components/ShaftStoryLayer.css` — exit 0.
- `rg -n "shaft-stamp-impulse|shaft-stamp-settle" src/components/ShaftStoryLayer.tsx src/components/ShaftStoryLayer.css` — exit 1 (no residual references).

## Runtime proof pending

No browser evidence is claimed while GPU is owned by V1. The remaining runtime checks are direct seek and reverse to equal sampled times, repeated sampling while paused for drift, and reduced-motion scale `1`. Those checks must compare the displayed DOM transform against `sampleShaftScript(time, reducedMotion).stampScale`.

## Runtime proof

`shaft-stamp-harness.js` and `verify-f1-stamp.mjs` completed the authorized isolated DOM-only proof with Chromium `--disable-gpu`. Result: PASS, zero reverse mismatch, zero paused drift, reduced-motion scale 1, zero GLB requests, and zero canvas-context calls. This is explicitly a component harness result, not site end-to-end proof. See `RUNTIME-PROOF.md` and `runtime-proof.json`.
