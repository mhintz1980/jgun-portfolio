# JG-035 opening — visual ruling packet (2026-09-29)

Review target: `5abe1c5` on `codex/jg033-signature-shot`. The five stills are
post vellum/illumination fixes, captured in the full tier at 1600 × 900.
Use `continuation-2026-09-27/frames-retry/p0.0600-1600x900.png` for .060;
use `continuation-2026-09-27/frames/` for .066, .072, .078, .084.
The accompanying `frames.json` and `frame-pixel-analysis.json` are the
telemetry and pixel records. The prior capture at .060 was replaced because
its harness failed; the retry passed with telemetry.
Two later resolved-state captures at .096/.108 are in
`resolved-close-2026-09-29/` with `frames.json`. Both passed their capture
checks but the performance ladder stepped down to **lite** (one decline), so
they establish the resolved geometry and no-hole read at that tier, not a
matching full-tier look comparison. At .108 the whole metal tool is visibly
above an intact drawing sheet and the flex telemetry is zero.

## Decision requested

Please rule **ship / adjust** for the opening's six visual effects as one
sequence. If adjust, identify the frame and the smallest correction worth
making. This is a visual ruling; the measured checks below do not substitute
for owner acceptance.

**Owner update, 2026-09-29:** the bright early outline is rejected against
the light paper. A [navy ink-color candidate](ink-pulse-candidate-2026-09-29/review.md)
was built and captured; [Astra recommends keeping its navy direction](astra-ink-pulse-review-2026-09-29.md)
for owner/motion review. The original outline row below documents the baseline
concern, not the current candidate.

| Effect | What the evidence shows | Ruling focus |
|---|---|---|
| Outline / possible hologram read | At .060 and .066 the tool has a 4–8 px near-white emissive rim with a slight cyan cast. The earlier ≤2.1% cyan-pixel statistic excludes much of that visible rim because of its threshold. By .072 the pulse luminance is 0. | Does the luminous silhouette read like a drawing becoming metal, or should the glow move inward / dim as PBR arrives? |
| Sheet tone | On six fixed blank-paper patches, luminance falls 228.3 → 206.6 (−9.5%) and red-minus-blue rises 11.3 → 19.8. The earlier full-frame mean undercounted this by including model pixels. | Is the deeper, warmer cream at .084 the desired end tone? |
| Contact shadow | Telemetry ramps to 0.34 by .084, but the 0.006 m contact radius reads as a narrow seam. Paper directly under the tool is only 3–5 luminance units darker than open paper. The prior 29 → 0.9 minimum came from the near-black model, not a paper shadow. | Should grounding stay a tight seam or gain a visible projected shadow? |
| Title block and fine text | `SIDE VIEW`, nearby dimensions, and the small gearbox callout remain legible at native resolution. Most of the title block sits beyond the right crop in these side-view frames; measured edge gradient is only a coarse contrast check. | Is the cropped title block intentional at rake end? |
| Camera rake | At .060, registered hold error is 0.000296 px (0.1 px gate). The view begins tilting at .066 and reaches the designed 90° → 58° rake by .072; camera then holds. Later 23–72 px drawing/model separation is intentional parallax. | Does this departure read as a purposeful lift from the sheet? |
| Vellum close | Telemetry at .066/.072/.078/.084 is .028/.648/.661/.392: it rises around contact, then releases as the tool clears. At .084 the tool is still 39% vellum-blended, so the five-frame set cannot prove the resolved state. | Does the underlying drawing close and settle naturally, without looking like a hole? Review the added .096/.108 captures for the resolved state. |

## Verification already recorded

`continuation-2026-09-27/report-2026-09-28.md` records typecheck clean,
145/145 tests, the full six-case opening roster, 3/3 poster viewports and
poster/reduced-motion deep links on a fresh build. Warm production precompute
was about 4.9 s versus 9.0 s live; the v2 asset was kept. Those are
implementation gates, not a visual approval.

An independent read-only frame review on 2026-09-29 recommended passing the
authored pulse, rake, legibility and pressure envelope pending owner taste;
the narrow contact seam is a fix candidate if visible grounding is desired.
It identified the tone and contact-shadow measurement corrections above.

## Account state to reconcile separately

The handoff's 100-credit trial balance is historical. A read-only CLI check
on 2026-09-29 found a Plus account with 1,000 credits after a subscription
reset, and completed media jobs absent from the handoff. Their relation to
this task is under review. No new generation is part of this visual ruling.
