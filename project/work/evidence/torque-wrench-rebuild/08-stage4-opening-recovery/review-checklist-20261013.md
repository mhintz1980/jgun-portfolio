# JG-038 Stage 4 — review preparation checklist (2026-10-13)

Current review set, parent refresh2026-10-14: use `review-packet-20261013.md` and generated `review-manifest-20261013-s.json`. Build s effects D/N70/70,71/71 served assets plus HTML; `continuity-20261014-s3-D/N` each1083 observations,zero errors/failed requests,no>100ms interval,max17.1/16.9ms. Manifest verifies347 inputs,6 preserved files,4 reports,116 unaltered PNGs. Archived `continuity-harness-20261014.mjs` adds request URLs and console locations. The build-p findings below are historical and superseded for the current capture set; the p cold stall and s2 fetch failures stay preserved. The fetch-failure cause is still unresolved. Full G5, continuous clearance, final art/performance and all Astra/owner acceptance remain open.

Preparation only. This file prepares the Astra effects review and the owner unaltered-PNG review for Stage 4. It records no pass, no acceptance, and closes no gate; G0–G9 remain open. Nothing here launches jobs, browsers, builds, or agents, and no file outside this one was written.

- Prepared: 2026-10-13, bounded documentation lane; final refresh 2026-10-14 after the parent's build-`p` completion briefing (desktop and narrow recorded). Owned path: this file only; ownership is relinquished to the parent for packet-index assembly.
- Read basis: this folder's `README.md`, `attribution-20261013.md`, `wave-ledger-20261013-stage4.md`, `effects-20261013-o-D/stage4-effects-report.json`, `effects-20261013-p-D/stage4-effects-report.json`, `effects-20261013-p-N/stage4-effects-report.json`, `source-20261013-p.json`, `pit-ab-20261013-m2-D/pit-ab-report.json` (and `-N`), plus `docs/torque-wrench-rebuild/09-design.md`, `13-implementation-plan.md`, `HANDOFF-2026-10-13-stage4.md`, `18-stage0-verification-contract-proposal.md`, and `07-autonomous-2026-10-12/contract-v1.md`.

## 1. Review layers — what each evidence kind can and cannot decide

| Layer | Evidence class | Decides | Cannot decide |
| --- | --- | --- | --- |
| Pixel/runtime (machine) | Provenance-bound telemetry + unaltered PNGs from one task-owned build and preview: viewport/DPR asserted, served-hash matched, drift deltas, null-render occlusion probes, same-build controls | What pixels the recorded build produced under recorded conditions; assertion-style results (drift within tolerance, occlusion holds, geometry contribution nonzero) | Aesthetic quality, resemblance to the remembered sequence, design intent, acceptance |
| Source (Astra) | Independent read-only review of implementation and evidence index: contracts, attribution design, verifier validity, failure records | Technical/effects correctness: director purity, one canonical progress, attribution soundness, occlusion-proof validity, no permanent glow, continuity evidence adequacy | Owner visual/motion acceptance. Astra approval cannot rescue a failed technical gate and is not owner acceptance |
| Owner (Mark) | Unaltered PNG set + full-motion recordings, with a provenance sheet binding every image to build/source/progress | Visual and motion acceptance, recovery resemblance, exceptions and limitations | Can be negative regardless of any passing telemetry or Astra approval; agents never infer it |

Rules binding all layers: runtime visual-review PNGs stay unaltered (no crops, color edits, or composites inside the acceptance set; annotation lives in a companion sheet referencing filenames). Poster renders are a separate artifact class reviewed separately from live PNGs (plan13 §6). A pass at one layer is not a pass at another. Failures are recorded, not omitted. Independent review is capped at two rounds per piece; unresolved findings stay visible for owner disposition.

## 2. Prepared evidence (measured and recorded — none of it is acceptance)

### 2.1 Pit-geometry attribution A/B — current actual-viewport runtime record

- Reports: `pit-ab-20261013-m2-D/pit-ab-report.json` and `pit-ab-20261013-m2-N/pit-ab-report.json` — **15/15 assertions pass at each viewport** (D 1440×900 DPR1, N 390×844 DPR3; `actualViewport` asserted), hardware ANGLE/D3D11, HEAD `1c7a7d2d`, build `.scratch/jg038-stage4-20261013-m`, candidate revision `4035be9d^` (sine relief) versus current triangle-wave relief, with source SHA-256s and served asset hashes recorded.
- The 15 assertions: actual viewport matches requested; wall topology matches; lip ring remains exact; served byte hashes match build; candidate geometry source differs; renderer reports hardware; full tier actually rendered; same-build control is exact; positions restore to exact render; no runtime errors; aperture wall contribution observable; closure is occluded in interpreted samples; camera unchanged across isolated swap; capture raster matches viewport aspect; geometry contribution measured with nonzero vertex delta (max 6.153404 mm).
- Establishes: a visible wall-geometry contribution exists and the swap/restore/isolation mechanics are sound. Does not establish: a subjective dominant root cause, occlusion before rupture (§3 item 2), or any acceptance.

### 2.2 Camera-law A/B — offline contribution measurement (diagnostic)

Current versus recovered (`8988c2da^`) opening camera law differ by up to 0.490962 m position, 0.217352 m look-target, 2.0560° FOV under matched layout/aspect/intro times (build `.scratch/jg038-stage4-20261013-j` reports; `sheetCamera.ts` SHA-256s recorded). These units differ from the pixel deltas and support no magnitude ranking between the two contributions. The attribution conclusion is still open.

### 2.3 Superseded viewport records — preserved diagnostics, not two-viewport proof

`pit-ab-20261013-l-D`, `-l-N`, and earlier `ab-20261013-j2` captures used Playwright's default 1280×720 (width/height passed outside `viewport`), so their "desktop/narrow" labels are invalid; the j2 opening 11/11×2 telemetry record is superseded as viewport evidence and preserved as diagnostics only. `-k-D` failed before measurement (legacy model-root name). A corrected run replaces these runtime claims.

### 2.4 Effects run `o-D` — preserved failed record (superseded by `p` for runtime claims)

- `effects-20261013-o-D/stage4-effects-report.json`: `pass: false`, 66/69 — failed: "reverse retraces camera within contract-18 tolerances", "reverse retraces opening canonical state", "direct seek reproduces forward state within contract-18 tolerances"; `continuityDiagnosticOnly: true`.
- Per the parent README: a focused replay did not reproduce the mismatch; the verifier now requires native scroll and live world progress to reach the requested pixel before settling and records observed forward/reverse/seek progress. No product state or tolerance was weakened; the original failure's precise timing cause is not proven. The run stays preserved as the recorded failure; its PNGs (canonical samples plus four handoff windows, p0.4400–0.9475) are diagnostic material only and must not be used as Astra or owner review evidence.

### 2.5 Final effects runs — build `p` (desktop and narrow recorded)

- Provenance: build `.scratch/jg038-stage4-20261013-p` frozen in `source-20261013-p.json` (branch `torque-wrench/rebuild`, HEAD `1c7a7d2d`, 347 source/public/script inputs; aggregate SHA-256 `898faa787daf55937a95724da4a96bdc9a687212251c5126da808bb99618caa1`); production build succeeded; preview `localhost:5288` restarted; all 29 served JS/CSS assets and HTML byte-match the build.
- `effects-20261013-p-D/stage4-effects-report.json` (schema `JG-038-stage4-effects-v1`, `http://localhost:5288/torque-wrench/`, observedViewport 1440×900 DPR1): `pass: true`, `failed: []` — the README's **69/69** — with `continuityDiagnosticOnly: true` and exactly one `unverified` item: "camera handoff continuity as Stage 4 exit evidence" (recorded reason: windows are diagnostics only; ring/shaft windows sit outside the Stage 4 opening exit; a synthetic adjacent-sample threshold cannot claim C1; derivative classification is parent-contract/G5 scope).
- Both reports are final per the parent: **desktop and narrow each pass 69/69**, with 54 unaltered PNGs per viewport (108 total) whose hashes and dimensions are verified (parent-recorded), and 29/29 served assets plus HTML byte-matching the build. On disk: `effects-20261013-p-D/stage4-effects-report.json` (started `2026-10-14T02:28:03.452Z`, observedViewport 1440×900 DPR1) and `effects-20261013-p-N/stage4-effects-report.json` (started `2026-10-14T02:31:54.551Z`, observedViewport 390×844 DPR3) each record `pass: true`, `failed: []`, installed-Chrome ANGLE/D3D11 hardware, `continuityDiagnosticOnly: true`, and exactly one `unverified` item each (camera handoff continuity as Stage 4 exit evidence).
- Parent-reported finding, kept open: a cold opening sweep exposed a ~1-second rAF stall at first rupture (warm runs smoother). No cold-sweep artifact existed in this folder at final refresh; this checklist cites the parent briefing and leaves the artifact path to the parent. G5 full motion and reload evidence remain explicitly pending.
- Companion state in the same refresh: TypeScript, import boundary (one lazy `cadGate→Scene` edge), and 79 files/961 tests pass (`maxWorkers=2`; four existing skips; concurrency timeout-only failures retained in scratch logs). `PitGeometry`/`PitDirector` preserve the torn lip, 11 rings and 3.2 m depth with broader deterministic relief; unified electricity separates accumulating fracture growth from intermittent emission; `OpeningCamera` preserves the drafting/rake law through p0.435 and blends to the exact overview at p0.46. Unit/source review does not establish final visual quality.

### 2.6 Source-layer review state (prepared, not acceptance)

GLM-5.3 independent source review completed two rounds with no remaining effects-source blockers; the DeepSeek reviewer attempt failed with provider HTTP 429 (recorded, seat unresolved). This is review-preparation input; it is not Astra effects approval and not owner acceptance.

## 3. Still-pending evidence (exact blockers)

1. Opening continuity: explicitly unverified in both final p reports (`continuityDiagnosticOnly: true`, one `unverified` item each); its C¹/derivative classification belongs to parent-contract/G5 scope.
2. G5 full motion and reload: explicitly pending — slow/fast scroll, abrupt stop/reverse, wheel/touch/keyboard/scrollbar, jump/reload, low FPS/tab resume, with pacing, input response, and cinematic continuity assessed separately. The parent-reported ~1-second cold rAF stall at first rupture belongs here (and its cost cause in G8); warm-run comparison is recorded by the parent.
3. Occlusion evidence confirmation: the final p reports record null-render fixed/restored assertions (e.g., "electrical null-render fixed and restored at 0.395") and `occlusionMargin` fields; Astra verifies these discharge the attribution note's pre-rupture occlusion demand. The m2 narrow pre-rupture full-frame pixel changes (12/2/0/2 at p0.395/0.408/0.415/0.42) remain non-evidence of cavern — the aperture mask is empty then.
4. Cause-attribution conclusion: weigh the measured camera/remap contribution against the measured pit-geometry contribution and record the decision without inventing a ranking the differing units do not support.
5. Remaining Stage 4 product verification: pit relief with steep near-vertical walls, no visible floor/bottom/far closure; unified light-blue electricity across profile trace, interior fractures, and pit fissures with the accelerating burst/hold rhythm and no permanently glowing seams (time-separated captures at the same progress); lit metal; no desk exposed through rupture gaps; continuous camera handoffs.
6. G7 tier roster and G8 budgets for the effects work (separate stages; never relabel a failed full expectation as lite success).
7. Astra effects review execution (independent, read-only, not the author), then owner PNG packet assembly — index owned by the parent — and owner full-motion acceptance. Order per handoff: attribution → pit/occlusion → electricity → lit-metal/occlusion/continuity verification → Astra → owner.

## 4. Astra effects review — prepared questions and criteria

The reviewer (independent seat, read-only, two-round cap) receives this checklist plus the evidence index and answers each question with artifact paths:

1. **Attribution validity.** Does the m2 harness isolate exactly one variable — the wall position attribute — with camera unchanged across the swap, an exact same-build control, and restore-to-exact-render proof? Do the reports avoid claiming a dominant root cause the design cannot identify?
2. **Occlusion proof.** Is there an explicit null-render-before-rupture probe (not inference from geometry-swap pixel changes) demonstrating the pit is invisible through the opaque sheet? Is the pre-rupture narrow pixel-change record correctly excluded?
3. **Reverse/seek/continuity.** Do the final p reports hold — "reverse retraces camera", "reverse retraces opening canonical state", "reverse retraces portal pulse", and "direct seek reproduces forward state" within contract-18 tolerances at both viewports (p-D and p-N, each 69/69), with deterministic state keys (hold stability, reload equality)? Is the continuity `unverified` item resolved as exit evidence with position/target/FOV/roll around the Stage 4 opening handoff windows at C¹ (target C²) — or explicitly carried into G5 scope rather than silently dropped?
4. **Opening causality.** Do telemetry rows show paper opaque (`openingClear === 0`) during the model-driven bulge, monotone pressure, opening completion at the emergence handoff, and a consistent solved crossing — on the corrected build, not superseded j2 records?
5. **Electrical system.** Do captures at the same canonical progress, time-separated, show intermittent burst/hold (no permanently glowing seams) and one branching light-blue language across profile trace, interior fracture, and pit fissures? Is `electricalScore.ts`'s rhythm preserved rather than replaced?
6. **Pit read.** Do captures support irregular relief, steep near-vertical walls, depth beyond sight, zero visible floor/bottom/far closure, and no desk exposed through rupture gaps? Is the circular-hole/splined-collar read gone (wall topology and lip-ring assertions plus visual confirmation)?
7. **Recovery lineage.** Do the September 27 rake intent, October 1 printed shatter, and October 2 model-driven pressure/continuous emergence read in the current law without reverting approved handwriting or annotations? Is the attribution conclusion consistent with the disposition of the close-reading rework (`8988c2da`/`2021816e`/`524bdb4e`)?
8. **Provenance and evidence hygiene.** Fresh unique scratch build per run with frozen inputs (`source-20261013-p.json`); preview restarted after every rebuild; serialized heavy jobs; served-hash binding (29 served assets byte-match); viewport/DPR asserted; failures recorded (the o-D fail and the invalid-viewport records stay in the index, labeled); each artifact mapped to a gate; no acceptance language anywhere.
9. **Verdict shape.** Findings separated into blocking/non-blocking, with an explicit statement that Astra effects approval is its own gate and never owner acceptance (G9 keeps them separate).
10. **Cold frame gap.** The parent-reported ~1-second rAF stall at first rupture on a cold sweep (warm smoother): is its cause identified and routed — cost cause to G8, motion-continuity cause to G5 — with the warm-run comparison recorded, rather than absorbed silently into the passing assertion counts?

## 5. Owner unaltered-PNG review — prepared questions, criteria, packet requirements

Coverage floor (plan13 §6): registered drawing; pressure; rupture; emergence; paper-plus-desktop replacement; exposed pit; profile/interior/fissure lightning; mechanism; cutter bullet time; layered background (Stage 5); final offline posters (Stage 6, separate artifact class reviewed separately from live PNGs).

Packet requirements before the owner is asked anything:

- Unaltered PNGs only: no crops, color/level edits, composites, or overlays inside the acceptance set; annotation belongs in a companion sheet referencing filenames.
- The prepared capture set exists: build `p` effects runs, 54 unaltered PNGs per viewport (108 total; hashes and dimensions verified), both actual viewports (D1440×900 DPR1, N390×844 DPR3), one provenance-bound build and preview. The parent assembles the packet index binding filenames to beats and telemetry rows; beats outside Stage 4 (mechanism, cutter bullet time, layered background, posters) remain future-stage coverage.
- A provenance sheet binding each filename to build directory + aggregate hash, source/HEAD, served-asset hashes, canonical progress, viewport/DPR, capture timestamp, and the matching telemetry row.
- Full-motion recordings for the motion questions (reverse/stop/jump included); stills cannot decide motion acceptance.
- The packet is assembled only after §3 items 1–4 exist; these questions are not asked early.

Owner questions (each answerable pass/concern/fail with a free-text note; a fail cannot be overridden by any technical pass):

1. Registered drawing: does the intact paper with approved handwriting and annotations read stable and readable at the registered view?
2. Pressure: does the opaque bulge read as the model pushing the paper from beneath — causal and physical — rather than a texture animation?
3. Rupture: does the shatter read as printed shards splitting along the enclosed profile (October 1 lineage)?
4. Emergence: does the wrench read as already-lit and rising continuously through the opening (October 2 lineage), with no separate pre-emergence cavern preview?
5. Paper/desktop replacement: do paper and desktop give way in the model's wake, with no desk visible through rupture gaps?
6. Exposed pit: does the pit read as rocky and cavernous — steep near-vertical walls, irregular relief, depth beyond sight, no visible floor, bottom, or far closure — with the old circular-hole/splined-collar look gone?
7. Unified lightning: do profile trace, interior shard fractures, and pit fissures read as one light-blue branching language with the accelerating burst/hold rhythm and no permanently glowing seams?
8. Recovery resemblance: does the whole opening match the remembered sequence (rake, shatter, pressure/emergence) closely enough to accept, or does anything still read wrong?
9. Motion (from recordings): do pacing, input response, and continuity at handoffs feel correct; do pause freeze, reverse retrace, and reload/jump behave without discontinuity?
10. Exceptions: which limitations or exceptions should be recorded explicitly, without weakening inherited failures?

## 6. Boundaries of this document

- Preparation only: no verdicts on reviews that have not run, no acceptance marks, no gate closures. As of this final refresh the Astra effects review and the owner review are prepared, not performed. The o-D failure stays preserved as history; the final `p` runs (69/69 both viewports) are the current runtime records, with continuity unverified and G5 full motion/reload explicitly pending.
- No jobs, builds, previews, browsers, or agents were launched to write this file; nothing outside this file was written.
- Root `GATES.md` (JG-035) and the task ledger `07-autonomous-2026-10-12/GATES.md` untouched; `TODO.md` and REA documents untouched; the protected sibling `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` never accessed.
- Nothing here authorizes commit, push, publication, cutover, or archive.
