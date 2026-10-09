# Fresh review - final oracle (corrected, static-only)

Verdict: **SHIP**. `node --check` PASS. Static-only review; no browser/GPU
launched; no source or script edits.

Issue 1 closed - inspectGoal cannot false-pass:

- Rotor: EXPLODE_OFFSETS.handle (-0.354, caseStudies.ts:168) x explodeFactor
  applied to position AND target z, rotor keeper only; no invented enclosure
  ground-floor wrapper.
- Dolly: script ramp 1 + smoothstep((p-0.5)/0.06) * (1 + 0.8 *
  smoothstep((p-0.76)/0.24)) matches CameraRig.tsx:427-429; m249 narrow
  p=.83 gives 2.1645 (the old 2.0 falsepass is gone). portraitDolly is
  checked against this authored value (delta <= 0.001) - telemetry cannot
  vouch for itself.
- Bias exact: authored framingBiasVec imported (caseStudies.ts:445) with an
  availability fail-guard; portrait 0.25 x-scaling, flightAtt windows
  0.53-0.598 / 0.722-0.758 (0.75 depth, /0.015 ramps) and afterIntro
  (0.12/0.03) all match CameraRig.tsx:446-459; meters = bias * dist *
  tan(fov/2), times aspect, on the normalized (fwd.z, 0, -fwd.x)
  camera-left; portrait -Y shift without aspect. The script's
  unnormalized-fwd variant is algebraically identical. Limits: target <=
  .01, fov <= .01, position <= .045 unwrapped around the pre-bias pivot;
  parallax <= .036 and rest-orbit <= .006 documented as residuals.

Issue 2 closed - HUD: card scope is ancestor::div[2] of the Close button
(the TechnicalHUD card container); asserts label, card-only detail, and
OCCURRENCE text. body.textContent survives only as CH log metadata, never a
pass criterion - no body falsepass.

Attribution (structural): requirements fresh-review-corrected-oracle.md;
producer Bernoulli; independent review GLM seat. Runtime browser evidence
still pending on GPU release.
