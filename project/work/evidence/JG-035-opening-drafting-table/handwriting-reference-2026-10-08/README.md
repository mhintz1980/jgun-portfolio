# Reference handwriting, October 8, 2026

The owner accepts the new font direction: "It needs to be close, and yours looks good." This supersedes the earlier rejection for this replacement only. Full opening, input-shaft and ring animation acceptance remains separate.

Cloud branch `codex/jg033-signature-shot` was fast-forwarded from `7e91899` to `d3066e4ff204d1f08096b00c5d75aa617193bb5b` before implementation. Prior local state remains recoverable in stashes `44f2286`, `8284f58` and `e19f6f2`. Local archival files were restored without replacing cloud source. Changes in this task remain uncommitted; no push or deployment was performed.

The custom font traces `ac-fast.png` using draw-your-font. It contains 36 reference glyphs (A-Z, 0-8 and ?); periods, hyphens and exclamation marks use clean vector fallback. Digit 9 is absent from the font and uses the existing vector fallback if requested. Current owner wording needs no 9. Synthetic outline waves, retraces and pressure changes were removed. Whole-letter placement remains seeded. Font members use the existing Troika batch and a deterministic horizontal reveal; this is a sweep across a letter, not reconstruction of the original pen path. Graphite notes, red strikes, circles and leaders preserve their existing content and timing.

Actual TTF black bounds determine each letter's origin and cap height. This avoids relying on nominal cap-height/side-bearing values after tracing erosion. Drawing cache version is 8. The recorded live/cold-precomputed/warm-precomputed roundtrip is exact; these timings do not establish an OS/GPU-cold performance result.

Review artifacts:

- [Reference, specimen and before/after comparison](comparison.png).
- [Final desktop note closeup](final/opening-desktop-t0p17.png).
- [Final desktop output-note closeup](final/opening-desktop-t0p24.png).
- [Final narrow whole sheet](final/opening-narrow-t0p29.png).
- [Final capture report](final/capture-report-opening.json): six captures, zero errors, installed Chrome on AMD Radeon 780M using ANGLE/D3D11. Explicit qualityLock was enabled for visual evidence; unrestricted quality/performance acceptance is excluded.

Final static verification:

- `npm run typecheck`: exit 0, [log](typecheck-final.log).
- `npm test -- src --exclude=.kilo/** --fileParallelism=false`: 41 files and 435 tests passed, [log](tests-final.log). Historical nested `.kilo` worktrees are excluded.
- `npm run build`: exit 0, [log](build-final.log). Preview :4173 was restarted afterward. Existing chunk-size warnings remain.
- `node scripts/check-b1b2-contract.mjs`: exit 0, [log](b1b2-final.log).
- `npm run check:station2`: exit 0, [log](station2-final.log).
- [Cache roundtrip](cache-regeneration.log): status verified, exact true, semantic version 8.

Focused runtime verification is complete: [parent final report](runtime-final/report.json) records desktop and narrow each verified with 122 checks, seven captures, zero errors and matching reverse-scroll lettering/bounds/paths. Real glyph ink height agrees with exported TTF metrics; precomputed loading, live GPU draws, graphite color, reveal packing and annotation non-overlap pass. The original readiness timeout is retained under `runtime/`; it is failed evidence and must not be cited as a pass. [Diagnosis](runtime-harness-verified/diagnosis.json) records the startup instrumentation and absent Troika capHeight field that caused harness failures; production readiness was unchanged.

[Independent review](independent-review.md) returns SHIP for code and requests the final desktop/narrow runtime run. That evidence request is satisfied by `runtime-final/report.json`, generated after the corrected verifier; the review's earlier evidence snapshot is retained verbatim. Native reviewer dispatch failed with 429; replacement was requested through ocx as `zai/glm-5.3-flash`, not Fable. [Handoff](handoff.md) records the remaining project scope.

[Review model attribution](review-model-proof.md) confirms the replacement as GLM-5.3-Flash via z.ai from per-request proxy records.

Preview: http://localhost:4173/. Development verifier endpoint: http://localhost:5199/.
