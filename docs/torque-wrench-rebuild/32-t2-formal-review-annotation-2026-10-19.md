# JG-038 T2 formal review and Fix E annotation — 2026-10-19

T2 reviewed the owner-approved T1 implementation (`dd5c6bce`) from branch `torque-wrench/rebuild`, starting HEAD `0f7e0f4d`. The owner approval remains in force. This report authorizes no T1 product revision.

Sonnet5.5/High performed the source-read-only formal review. GLM5.3-Flash/High independently parsed timing and attacked the report; its independent visual comparison was incomplete. Opus5.5/High adjudicated the selected supplied references, candidate frames and crops. The exact evidence, prompts, receipts and review limitations are preserved under `output/playwright/jg038-followon-20261019/` locally.

## Formal result

Strict doc28 rubric: **FAIL**, mean **3.5/5**. Opus scores: lightning3.5, topology3.5, cavern3.0, shards3.5, continuity4.0 (provisional, carried from the worker), overall3.5. No hard blocker was established. Scores are machine visual judgments, not physical measurements. Sub-4 scores remain enough to fail the rubric even though continuity was provisional.

Opus confirmed outline ticks and stepped halo sleeves in the supplied .295 image/crop, pale lightning relative to R3, and regular cavern strata relative to R4. The cavern bolts are kinked, uniform-width lines; calling them smooth was inaccurate. R8 could not be processed by the Opus image request. The worker viewed the full reference/frame set; Opus's narrower evidence set is recorded in `opus-t2-decision.md`.

Reviewer FAIL is distinct from owner acceptance. No fixes were applied to the approved lightning, cavern, geometry or shaders.

## Fix E table annotation

The historical Argon report under `evidence-jg038-argon-20261019/` remains an implementation record. Its timing gate outcomes stand with these annotations:

- **Lights-out means sustained lamp-out**, at document fraction .215. The earlier .2095–.2105 dip rebounds to .514 at .2115 and belongs to flicker. Fresh first nonzero pulse is .218. Sampled gap **.0030 = 188.733px**, with grid bounds **.0025–.0035 = 157–220px**, safely within .008 (503px).
- Four profile bursts and shortening holds are confirmed. The sampled third plateau is .2415–.2440. Its true duration is bounded **157–220px** at the .0005 sampling step. The historical .2412 start / approximately176px estimate falls inside those bounds; the fresh grid cannot confirm or refute that sub-grid value.
- .2075 is the **tallest** flicker peak, not the last. Lower peaks occur later.
- Fracture telemetry first becomes nonzero at **.3085**; the historical visible shatter mark .310 is a different observation. Visible onset magnitude was not measured by the review.
- Outline completion and web start are adjacent within one .0005 sample. The historical zero-gap claim should be understood at that resolution.
- Spark visibility in a frame named218 was not independently adjudicated; rounded tags alone do not establish its exact capture fraction.

Fresh timing sweep: `.17–.335`, step `.0005`, 331 rows, document range **62911px** at1440×900. All67 common rows match the committed after-E telemetry. Parent independently recalculated sustained-out to first-pulse gap. Eight fresh frame captures had zero console/page errors; the worker's sampled pixel comparison reported no differences from the corresponding Argon frames.

## Mechanical evidence

Parent ran typecheck clean, eight focused T1 files /47 tests PASS, and production build PASS before any follow-on edits. These starting-tree checks do not validate later T5/T6 changes. Port5321 was used; owner port5281 was untouched.

Local review files: `t2/report.md`, `t2-adversarial.md`, `opus-t2-decision.md`, `opus-t2-decision.receipt.json`; fresh timing and frame tags also exist in `output/playwright/jg038-lightning-20261017/`. Keep these limits with any later summary.

Corrected worker report v2 SHA-256: `7eb0de67b92c6f761d8f74bee5d255803ffe60b361749ce18d37e62bb952dbbc`. The pre-Opus report is retained locally as `t2/report-v1-pre-opus.md`. No visual scores were reopened during correction.
