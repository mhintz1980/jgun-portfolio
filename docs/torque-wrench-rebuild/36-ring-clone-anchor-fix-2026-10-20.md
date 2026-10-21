# 36 — Ring Switch study clone anchor fix (2026-10-20)

## Problem (owner report, 2026-10-20)

During the ring study (canonical progress about .47 to .505) the isolated Ring Switch clone appeared near the output shaft, away from the real ring. The study animation ran there. At the end the clone faded out and the correctly placed real ring remained, so two Ring Switches were visible during the hand-off.

## Cause

`RuntimeWorld.tsx` created the study clone at `RING_LOAD_AT` (.44) and captured its world anchor once with `captureCanonicalRingAnchor`. At that moment the page-owned extraction group (`private-wrench-world`, driven by `applyExtractionCore`) still carried the opening-extraction transform, so the captured matrix included about 0.12 m of Z offset. The group settles into its final pose by about .466, but the clone kept the frozen load-time matrix.

Measured on the dev server before the fix (model metres): clone centre (-0.0396, 0.0042, 0.1092) against real ring centre (-0.0775, 0, -0.0100) for the whole study window.

## Fix

`src/scene/torque-wrench/RuntimeWorld.tsx`:

- `ringAnchorLocal` stores the canonical anchor relative to the extraction group (`inverse(group.matrixWorld) * ringAnchor`) at capture time.
- Every frame, before the clone root and the ring camera use `ringAnchor`, the world anchor is recomputed as `group.matrixWorld * ringAnchorLocal`.

The clone therefore follows the live extraction group transform and lands on the real ring pose.

## Evidence (local, dev server, headless Chrome 1440x900, scroll seeks)

After the fix the clone world-bounds centre equals the source ring centre at every sampled progress from .442 to .493, including the settle at .447-.466: (-0.0775, 0.0000, -0.0100) at rest, and identical values at the intermediate extraction samples. Clone opacity is 1 and source opacity 0 across the swap; the source returns to 1 as the clone fades out (returnBlend), both at the same pose.

Unit tests under `src/scene/torque-wrench`: 254 pass, 1 fails (the `loadTorqueScene` import test in the full run; it passes when its file is run alone; cause not traced). The type check reported no errors. Verifier scripts were not re-run.

## Open

- Owner: camera placement during the ring study still has issues ("good for now", 2026-10-20). The ring camera is derived from the same anchor, so it moves with this fix, but its framing law (`samplePrivateRingCamera`) was not changed or re-reviewed.
- The brief source/clone fade overlap at the swap was not visually reviewed; the two rings now share a pose.
- No owner visual acceptance, G0-G9 or Astra review is implied by this fix.
