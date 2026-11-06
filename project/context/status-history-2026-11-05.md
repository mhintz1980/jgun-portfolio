# Status history — banners moved out of TODO.md and project/README.md (2026-11-05)

Historical record created by JG-041 batch B1. Every dated status banner that previously sat at the top of [TODO.md](../../TODO.md) (31) and [project/README.md](../README.md) (24) is preserved below with its original text, dates and source provenance. Only relative link targets were rewritten so they resolve from this file; nothing was reworded. The current state lives in [current-status-2026-11-05.md](current-status-2026-11-05.md) and the owner policy in [evolving portfolio and visual review](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md).

Reading guide: entries are newest-first, as they appeared in the sources. Earlier banners describe the state of their own date; they are not current delivery vetoes (owner policy 2026-10-31) and do not record acceptance beyond what their text states. The 2026-11-03 JG-039 and 2026-10-31 two-page publication banners are superseded as the latest release by the JG-040 Stage 3 release of 2026-11-04 (deployment e796fe69, source f83f4ba3); see the current-status record. Wording such as "Stage 2 not started" or "unpushed" in older entries is preserved as history.

Provenance: the TODO.md and README.md line numbers below refer to the files as they stood in the JG-041 worktree before B1 (branch codex/cleanup-2026-11-05, baseline 0b284226 plus the JG-041 intake edit). Git history of both files holds the earlier states.

## A. Banners from TODO.md (31)

### T-01 — TODO.md line 2

> **JG-039 PUBLISHED 2026-11-03:** Mark approved the corrected homepage and requested release. Deployment `2b33b2f4` serves the public `/home/` landing page from clean commit `876f11fc`; the root forwards to it. Clean-tree typecheck, 1,499/1,499 tests, build, launch/asset gate and 9/9 live smoke cases PASS. [Release evidence](../work/evidence/JG-039-homepage/release-2026-11-03.md) records hashes, rollback and limits. This publication does not close cinematic/alias/opening gates.

### T-02 — TODO.md line 3

> **Next creative work is JG-040 HUD concepts:** the 2026-10-31 two-page publication (`6ea9c78a`) is rollback history superseded by the homepage release. Continue from the [JG-040 plan](../work/plans/JG-040-hud-d-inline.md) and [evidence](../work/evidence/JG-040-hud-d-inline/README.md), with Mark's direction and visual examples. Do not restart dense alias or provisional HUD polishing merely to clear evidence 73.

### T-03 — TODO.md line 5

> **2026-10-31 OWNER PRIORITY — publish work in progress, then HUD concepts:** [Current owner policy](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) supersedes older publication freezes and the assumption that every cinematic gate must pass before studiomark.dev can be updated. Publish useful unfinished pages with a discreet label and proportional build/asset/route/runtime checks. The current HUD is provisional: defer strict HUD/design-framing polish and develop a quieter, model-first approach with Mark through visual concepts. Show high-speed readability issues before further diagnosis; if Mark cannot notice them, defer them. Small camera-angle refinements are allowed. Evidence 73's FAIL/deferred/review states remain honest history, not a mandatory fix list before publishing or HUD work. Opening semantic proof and independent final review remain follow-ups. Older entries below retain historical results, not current delivery vetoes.

### T-04 — TODO.md line 7

> **2026-10-31 verification checkpoint:** [Evidence 73](../work/evidence/torque-wrench-rebuild/73-verification-reconciliation-2026-10-30/SUMMARY.md) records 1,398 unit tests, 36 verifier tests, build and both 30-gate camera/HUD runs PASS. Six-case coverage completed with an explicit same-build narrow-lite recovery: all 840 decoded replay comparisons match exactly, but strict framing/HUD gates remain FAIL. Lamp replay and approved terminal deceleration are implemented. Next: reconcile required subject/visibility contracts, strict alias residuals and opening semantic proof; independent review is unavailable after provider errors. Continuation remains local/uncommitted after pushed `ccb215b2`.

### T-05 — TODO.md line 8

> **2026-10-30 verification reconciliation, after approved checkpoint `ccb215b2`:** [Plan 73](../../docs/torque-wrench-rebuild/73-verification-reconciliation-plan-2026-10-30.md) records deterministic lamp replay, current-contract assertions, authenticated contact witnesses and same-program pixel baselines. Mark approved a short terminal deceleration: only the final 65.4–66.9 s clock window gains a zero-rate endpoint with a 20% exit shoulder; shot boundaries, total scroll budget, gear laws and final phase remain fixed. Tests/build and final same-build runtime evidence are being refreshed. Accepted hob lead-out and the desktop one-pixel sixfold failure remain explicit; no full alias PASS is claimed.

### T-06 — TODO.md line 9

> **2026-10-30 cascade camera and visibility proof — owner-approved Option A:** Owner selected the high-to-low tracking camera and directed that the input shaft stay visible until it naturally leaves the frame. Authenticated Draco geometry bounds now separate the shared ten-tooth face (`3.174827–9.524858 mm`; source exit to `9.789711`; study hob lead-out to `13.938684`), the far-end sixfold (`61.109647–71.523950`) and the shaft body in depth-tested pixel proofs (`cascadeFeatureMask.ts`, `cascadeProof.ts`). Option A retains Stage 1 carrier `P001836` through `61.5 s` and retires it over `61.5–62.25 s`; the shared functional tooth face contributes `0 px` at every post-`0.35` sample on desktop and narrow, and `inputSixfold` leaves the frame (`≤1` bottom-edge pixel at `56.25 s` on desktop, `0` on narrow). Focused 81/81 tests, typecheck and build pass. Owner visual acceptance, the full same-build six-case roster, dense per-frame replay and the inherited 66.9 s source-takeover C1 stop remain OPEN.

### T-07 — TODO.md line 10

> **2026-10-28 OWNER VISUAL HANDOFF — next priority:** [Brief 65](../../docs/torque-wrench-rebuild/65-owner-visual-corrections-and-next-preview-2026-10-28.md) records the owner's new pacing, 60-tooth cutter/retaining assembly, and closer exploded-camera corrections, all five saved references, and completed NotebookLM consultation. Prepare small visual previews before resuming full testing. First creative choice: sketch arbor/flange/retaining nut (recommended) versus photographed tapered holder. Opening close-read / active detail is approved. [Canonical handoff + ready-to-paste prompt](../../../../../../AppData/Local/Temp/HANDOFF-2026-10-28-owner-visual-corrections.md). Current dist is older than dirty source; no full six-case PASS or owner visual acceptance exists.

### T-08 — TODO.md line 11

> **2026-10-28 continuation — runtime gates OPEN:** [Evidence 64](../../docs/torque-wrench-rebuild/64-page-cinematography-verification-2026-10-28.md) records 294/294 integrated tests, 22/22 Node verifier tests, the installed-shard physical oracle, fresh build/preview, and solver-derived hob/cascade/readout corrections. Production-04 is diagnostic, not PASS. Opening close-read versus whole-sheet safe framing requires owner direction; desktop readout and full six-case same-build assertions remain open. No OpenAI subagents; preserve dirty tree and delivery boundaries.

### T-09 — TODO.md line 12

> **2026-10-27 page-wide cinematography alignment ACTIVE:** [Plan 63](../../docs/torque-wrench-rebuild/63-page-cinematography-alignment-plan-2026-10-27.md) expands handoff 62 to all applicable `/torque-wrench/` sequences. Implement shaper first, show a visual proposal before the full proof roster, then continue the inventory. Preserve cascade/side-track direction and unresolved meshing decisions. Historical checks do not validate new changes; implementation/runtime/owner gates remain OPEN. No staging/commit/push/deploy/assets or `.scratch` edits.

### T-10 — TODO.md line 13

> **2026-10-27 Canonical Bullet-Time source alignment complete; visual/runtime migration OPEN:** [Handoff 62](../../docs/torque-wrench-rebuild/62-bullet-time-contract-alignment-handoff-2026-10-27.md) records the contract, corrected progress domains, skill-local HUD solver, mandatory cross-agent routing and camera+subject reverse gates. Typecheck PASS; requested 118/118 tests, additional 39/39 and Node verifier 6/6 PASS. Quick camera/HUD captures report INCOMPLETE. No build/browser/owner approval claimed. The active visual lane remains [document 61](../../docs/torque-wrench-rebuild/61-visual-first-side-track-preview-2026-10-27.md); after its pending owner review, measure the shaper shot, then author its canonical knees and camera/HUD sweep. Exact steps and continuation prompt are in handoff 62. Preserve dirty work; no staging/commit/push/deploy/assets.

### T-11 — TODO.md line 14

> **2026-10-27 final cascade implementation; pixel gates OPEN:** [Plan 59](../../docs/torque-wrench-rebuild/59-final-cascade-reduction-retime-plan-2026-10-26.md) and [evidence 60](../../docs/torque-wrench-rebuild/60-final-cascade-reduction-retime-evidence-2026-10-26.md) supersede consultation 58 and the orbit/cap rules. 3250:1, per-stage planet laws, 66.9 s, physical-distance clock and phase-matched source takeover are implemented. Focused 242 tests and production build pass. Both near-axis trials failed visibility-aware alias pixels. Owner approved the precise upstream fades in evidence 60; implemented, final verification running. Owner acceptance OPEN; no staging/commit/push/deploy/protected assets.

### T-12 — TODO.md line 15

> **2026-10-26 new owner direction — consultation complete, implementation pending:** Stage 2 must turn at .2× P001836 (confirmed integral sun on Stage 1's cage); drop all full-orbit gates and give each stage about 50% more viewing time. [Consultation 58](../../docs/torque-wrench-rebuild/58-owner-reduction-and-longer-stage-views-consultation-2026-10-26.md) records Opus 5.5/High followed by Astra/High. Astra recommends a 5:1 local ladder, unequal input ramps and a 68.9-second study with phase-matched source takeover. These are proposals, not implemented or runtime-validated changes. The current preview remains the verified 56/57 build below. Preserve the dirty tree; owner acceptance OPEN, no Git delivery/deployment/assets.

### T-13 — TODO.md line 16

> **2026-10-26 corrections 56 (historical):** Implemented adjustable 100:1 shaft cascade, 158 RPM measured nominal-playback cap, Stage 2-only full-orbit gate and opaque explosion housing. This supersedes the all-stage orbit rule in 54/55. [Plan 56](../../docs/torque-wrench-rebuild/56-ratio-cap-solid-housing-plan-2026-10-26.md) · [evidence 57](../../docs/torque-wrench-rebuild/57-ratio-cap-solid-housing-evidence-2026-10-26.md). Source baseline 251 tests, 57 affected tests rerun at the final cap, build and headed playback pass; the 158 RPM roster passes four cases × 23 checks. Gemini-4-Argon reviewed the implementation before the final 2 RPM reduction; evidence preserves that boundary. Preserve all dirty work. Owner acceptance OPEN; no staging/commit/push/deploy/assets.

### T-14 — TODO.md line 17

> **2026-10-26 owner refinement:** The shaft-driven sequence is good overall; Mark requests delayed Stage 2 planets at the integral-sun view, one visible orbit before every downstream carrier, and progressive common-input acceleration. Implemented under [plan 54](../../docs/torque-wrench-rebuild/54-owner-planet-orbit-reveal-plan-2026-10-26.md); evidence in [55](../../docs/torque-wrench-rebuild/55-owner-planet-orbit-reveal-evidence-2026-10-26.md): 237 source tests, build, four live browser cases 20/20 each and an independent Gemini-4-Argon SHIP. Preserve the intentional dirty tree; owner acceptance remains open and no Git delivery/deployment is authorized.

### T-15 — TODO.md line 18

> **2026-10-25 owner cascade/transition corrections — technically verified:** Brief [50](../../docs/torque-wrench-rebuild/50-owner-cascade-and-transition-corrections-2026-10-25.md) supersedes the post-Stage-1 ending in plan 47. R1 and F1–F4 are implemented in the intentional uncommitted tree; see [plan 51](../../docs/torque-wrench-rebuild/51-owner-corrections-execution-plan.md), [independent review 52](../../docs/torque-wrench-rebuild/52-owner-corrections-independent-review.md) and [execution/evidence 53](../../docs/torque-wrench-rebuild/53-owner-corrections-execution-evidence.md). Source 526/526 tests, build/typecheck, all six runtime cases / 126 checks, and final independent Gemini review SHIP. Owner acceptance remains open; no commit/push/deployment.

### T-16 — TODO.md line 19

> **JG-038 next session — 10 owner visual defects documented, 2026-10-22:** After reviewing `43ad0648`, Mark identified 10 remaining visual and choreography defects. See [doc44 owner spec & handoff](../../docs/torque-wrench-rebuild/44-OWNER-SPEC-AND-HANDOFF-ten-visual-defects-2026-10-22.md) for the exact root-cause diagnosis in source (including `uFragmentPrint` pre-baked ink at scroll 0, the clockwise-to-CCW orbit reversal at `.430`, `Math.min(0, f.velocity.z)` flattening shard flight, missing knurling die close-up + 10-20% bullet-time die rotation, ring travel scale `.62 -> .74-.78`, `<10 deg` vs `>=45 deg` isolation camera swing, Mode A passive scroll-stop camera pitch in `stopAndAppreciate.ts`, and `attachPart` baking `RuntimeWorld` `registration` into `uShaftMatrix` which shifted `vShaftLocal.y` by `-21.43 mm` and caused Items 8, 9 & 10). Ready for next-session implementation.

### T-17 — TODO.md line 20

> **JG-038 owner visual corrections, 2026-10-22 — owner review OPEN:** four owner comments are implemented in the uncommitted working tree. See [doc42 execution record](../../docs/torque-wrench-rebuild/42-EXECUTION-owner-visual-corrections-2026-10-22.md): the opening profile now inks with scroll (the reduced-motion branch and the ink uniform seed were the leaks), the shatter throws the shards higher and holds them airborne through a full 360-degree bullet-time orbit before the Ring Switch handoff, the Ring Switch travel is limited to 62 percent of the physical cam travel so the machined groove stays covered while the OSHA Red stripe still reveals by .545, and the FEA field is now a surface overlay on the shaft (11,983 coloured pixels measured). Typecheck and build pass; unit suite 1,111 passed / 4 skipped / 1 inherited cavern ring-5 fold failure; production runtime 19/19 gates desktop and 19/19 narrow, zero browser errors. No commit/push/deploy. Owner visual acceptance remains open.

### T-18 — TODO.md line 22

> **JG-038 camera/HUD implementation, 2026-10-21 — owner review OPEN:** Items 1–10 from doc39 are implemented in the uncommitted working tree. See [doc41 execution/evidence](../../docs/torque-wrench-rebuild/41-EXECUTION-camera-hud-2026-10-21.md): same-build desktop/narrow runtime 40/40 gates, 46 checkpoints, zero browser errors; build/typecheck pass; unit suite 1,109 passed / 4 skipped / 1 inherited cavern ring-5 fold failure. Before/after gallery is `output/playwright/torque-camera-hud-2026-10-21/review.html`. Review this evidence before repeating the older next-session queue below. No commit/push/deploy or owner visual acceptance.

### T-19 — TODO.md line 24

> **Next session — JG-038 camera path overhaul, 10% bullet-time, ring OD mask & FEA/GD&T HUD, 2026-10-21:** [doc39 spec](../../docs/torque-wrench-rebuild/39-OWNER-CAMERA-PATH-AND-HUD-SPEC-2026-10-21.md) + [doc40 handoff](../../docs/torque-wrench-rebuild/40-HANDOFF-camera-paths-bullet-time-and-hud-2026-10-21.md) + [start prompt](../../docs/torque-wrench-rebuild/40-START-PROMPT-2026-10-21.txt). Scroll pacing trapezoidal kernel, beat rebalancing, and "Stop and Appreciate" (Mode A passive SecondOrderDynamics + Mode B Free Look with 0.6s quintic whip-back) landed 2026-10-21. Next: Priority 1 surgical fixes (P003068 internal bore knurl mask, mount `ShaftStoryLayer` FEA HUD, 10% bullet-time rate), Priority 2 camera paths (1a–6b), and Priority 3 clickable GD&T callouts + viewer copy.

### T-20 — TODO.md line 26

> **Next session — project size reduction, 2026-10-21 (not started):** [doc38](../../docs/torque-wrench-rebuild/38-HANDOFF-project-size-reduction-2026-10-21.md) + [start prompt](../../docs/torque-wrench-rebuild/38-START-PROMPT-2026-10-21.txt) - evidence PNGs and bulk telemetry are now git-ignored; the sweep to remove unused material starts with a measured candidate manifest (project/work/evidence 6.5 GB, .scratch 1.7 GB, output 308 MB). Ring study camera placement remains open.

### T-21 — TODO.md line 28

> **JG-038 Ring Switch clone anchor fix, 2026-10-20 (not accepted):** [doc36](../../docs/torque-wrench-rebuild/36-ring-clone-anchor-fix-2026-10-20.md) - the study clone is now anchored relative to the live extraction group, so it sits on the real Ring Switch instead of near the output shaft and no second ring remains after the hand-off. Ring study camera placement still has owner-noted issues. No owner acceptance.

### T-22 — TODO.md line 30

> **JG-038 next session, 2026-10-18 late:** owner says lightning and pit look better but are not there. [Argon handoff](../../docs/torque-wrench-rebuild/29-argon-fix-handoff-2026-10-18.md) (prompt: docs/torque-wrench-rebuild/29-START-ARGON-PROMPT-2026-10-18.txt) assigns Gemini-4-Argon to apply fixes A-D and self-check vs R3/R4/R7/R8, then independent review (Sol/High, Opus 5.5/High), then owner review; follow-on tasks T4-T7 (gold hob confirmation, Ring Switch relocation + 2x machining scroll, bullet time, R9 camera) are in the handoff section 8. Two prior reviews failed (mean 2.5). Added 2026-10-18: lightning timing correction Fix E (lights-out to first crack .034 of the document is too long; target <= .008 with 3-4 crack sequences; handoff section 5, reference R10). No acceptance, no commit/push/deploy.

### T-23 — TODO.md line 31

> **JG-038 owner corrections, 2026-10-18 (documented, not accepted):** [doc26](../../docs/torque-wrench-rebuild/26-owner-corrections-2026-10-18.md) records the post-shaft R9 camera, Ring Switch knurl relocation to just before the helical traverse (a-e event order), improved bullet time (gated on cavern/lightning quality) and the Astra + adversarial-review protocol; [doc27](../../docs/torque-wrench-rebuild/27-astra-lightning-portal-brief-2026-10-18.md) is the Astra brief. Gold hob, paper shards and the dense lightning web are implemented (uncommitted); the cavern still fails R4. No commit/push/deploy.

### T-24 — TODO.md line 33

> **JG-035 handwriting continuation, 2026-10-08:** Cloud branch pulled to `d3066e4`; rejected lettering replaced by the screenshot-derived Ac Fast Reference font. Owner clarified “close” rather than identical and said the font looks good. Current [plan](../../docs/jgun-handwriting-reference-plan-2026-10-08.md), [gates](../../docs/jgun-handwriting-reference-gates-2026-10-08.md), and [evidence/handoff](../work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/README.md) supersede prior handwriting status. Full owner-animation verification and inherited G6 are not closed by this font approval.

### T-25 — TODO.md line 35

> **JG-035 owner revisions, 2026-10-07/08 — O1–O4, R1–R2, S1–S3 IMPLEMENTED on `codex/jg033-signature-shot` (`524bdb4`…`2831f35`); verification partial, owner visual acceptance OPEN.** [Plan](../../docs/jgun-owner-animation-revision-plan-2026-10-07.md) (boxes ticked only where tests/captures exist) · [evidence index](../work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/README.md) (folder-by-folder, mapped to O1–O4/R1–R2/S1–S3). Landed: accelerating burst/hold electrical score with interior branches (`electricalScore.ts`); handwritten owner notes with Detail B retargeted to the input-shaft sun gear P001835, no sticky notes; C1 close-reading remap + reading shots with headline card 2 between the two reads; MARK HINTZ / Digital Systems Architect title block and A/B/C career block; ring knurl seam split + hole plug blend; button cutter viewer-right at equal depth; FEA-style FOS presentation (Model Name block left, FOS bar right, 4140 < 4340 < C300 all < 1, revised blue only, no disclaimer); shaft normal repair. Checks at `2831f35` in a clean `git archive` tree: typecheck clean, 41 files / 433 tests, B1/B2 31/31. Captures were taken with bundled Chromium + SwiftShader **software GL** in a Linux cloud container under `?qualityLock` — NOT hardware GL; the `tier: full` in those reports is a lock, not a tier pass. **Not yet done / open:** jagged shard tunnel walls landed in `4035be9` (frames `after-o1`/`after-o1b`, software GL; sightline and desk-exposure proofs not re-run on them); the handwriting is now an all-caps humanized hand in graphite ink (`2831f35`, drawing cache v7) — in progress, pending visual verification (no capture of it exists yet); shipped drawing cache asset is `cacheVersion` 5 while code is v7, so precompute regeneration is open (the page falls back to the live bake); static shaft/drawing stills not regenerated; S3 leaves residual relief-groove lumpiness at 10.9 s; the output-shaft note overprinted the AIR MOTOR callout at the registered view in the pre-humanization frames (not re-checked); O4 has no after-capture; the final full verifier roster, owner visual approval, the inherited G6 desktop-full opening tier drop and Windows hardware verification all remain open. Planning-era text further down is historical.

### T-26 — TODO.md line 37

> **JG-035 final documentation closeout, 2026-10-06/07 — G0–G5 checked; G6 open solely for full opening acceptance.** [Current handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) (current-state section first; closeout record [final-docs-closeout-glm-report.md](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/final-docs-closeout-glm-report.md)). Owner [posters-throughout](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/reduced-motion-owner-decision-2026-10-06.md) policy verified on the current build: lifecycle 14/14 (failures 0); static 4/4 with `glbRequests=[]`/zero CAD in every case; shaft 16 cases / 12 gates / 0 defects at FULL/FULL with 17/17 live hashes matching (prior paired runs stay prior-build LITE/FULL coverage); B1/B2 31/31; station2 PASS. Full opening roster finished 5/6: desktop-full fails 110 expectations after the effective tier becomes lite — cause unestablished, no waiver (headless probe: AMD Radeon 780M/D3D11). Both reduced cases directly record 0 CAD/0 canvases; the independent posters review is SHIP on direct observables. Next: targeted opening performance diagnosis under the preserved full-tier expectation, then owner visual review. Owner visual acceptance separate; no commit/push/deploy.

### T-27 — TODO.md line 39

> **Historical — JG-035 recovery checkpoint, earlier 2026-10-06; superseded by the final release banner above.** [Recovered handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) supersedes the planning-only continuation below. Shaft story/runtime, study bundles, tooling and shared controls are implemented. Recovery typecheck and 152 inspection tests pass; lifecycle runtime is 12/14, final shaft verifier/review and owner visual acceptance remain open. Resume the latest implementation evidence, not G0 from scratch. A separate checksum-verified recovery snapshot preserves the mixed worktree and staged/unstaged patches; no commit/push/deploy performed during recovery.

### T-28 — TODO.md line 41

> **Historical planning approval, 2026-10-05.** Mark approved the revised Input Shaft, P000725 housing and K000210/K000211 placement in Blender (6 mm lead-out, +2.75 mm shift). [Owner storyline/approval](owner-specs/manufacturing-inspection-storyline-2026-10-05.md) · [reviewed Ring Switch + Input Shaft plan](../../docs/jgun-manufacturing-inspection-plan.md) · [planning handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/continuation-handoff.md). Parent/Astra/Opus planning verdicts certify concept/plan readiness. Implementation subsequently proceeded; use the current recovery checkpoint above for progress and remaining acceptance gates.

### T-29 — TODO.md line 43

> **JG-035 continuation, 2026-10-04:** Authorship and interactive P003068 knurling inspection are authorized by the latest [implementation handoff](../work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/implementation-handoff.md). Work follows the [separate implementation plan](../../docs/jgun-authorship-knurling-implementation-plan.md); verification and runtime owner acceptance remain open.

### T-30 — TODO.md line 45

> **JG-035 revision, 2026-10-03:** Owner approved the blue-trace and vertical-shaft concepts. Implementation includes a 3.2 m outline shaft, studio return at .96–1, handle-matched black anodize with heavy P003068 OD knurl, seven callout moves and a local Air Motor cutaway. See [active plan](../../docs/jgun-blue-trace-tunnel-plan.md) for current verification and runtime visual acceptance; older packets below verify their respective builds.

### T-31 — TODO.md line 47

> **JG-035 causal portal correction — technically verified 2026-10-02; owner visual review OPEN.** The J-Gun pushes opaque paper from below and is already lit beneath the first rupture; gaps expose deep portal space, never the wooden desk. Storm, fracture, crack light, burned edges, scroll share and downstream mechanism timing are retained. [Active correction plan](../../docs/jgun-portal-correction-plan.md). The earlier 184/184 tests, 29/29 B1/B2, six-case roster PASS and technical SHIP belong to the [superseded breakthrough packet](../work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md); they do not verify this correction. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. No commit, push or deployment.

## B. Banners from project/README.md (24)

### R-01 — project/README.md line 2

> **JG-040 Stage 3 PUBLISHED 2026-11-04:** Mark approved the four HUD corrections and requested release. Source `f83f4ba`, deployment `e796fe69`: isolated typecheck, 1,507 unit tests, 36 verifier tests, build/asset gate, 68/68 live HUD checks and 9/9 publication smoke PASS, zero browser errors. Root-to-`/home/`, private armament and redactions are preserved. [Release evidence](../work/evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md). Evidence 73's broader FAIL/deferred results remain unchanged; prior publication entries below are history.

### R-02 — project/README.md line 3

> **JG-039 PUBLISHED 2026-11-03:** The corrected public homepage is live at `/home/`; the root forwards to it. Deployment `2b33b2f4` was built from clean commit `876f11fc` and passes 1,499 tests plus 9/9 live smoke cases. See [homepage status](../../docs/homepage-header-scroll-2026-11-03.md) and [release evidence](../work/evidence/JG-039-homepage/release-2026-11-03.md). Publication does not close cinematic/alias/opening gates.

### R-03 — project/README.md line 4

> **Next creative priority is HUD concepts with Mark.** The 2026-10-31 two-page deployment `6ea9c78a` remains rollback history; evidence 73's strict cinematic failures stay deferred, not relabeled.

### R-04 — project/README.md line 6

> **2026-10-31 owner policy — current priority:** Read [evolving portfolio and visual review](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) first. studiomark.dev may publish unfinished work and incremental updates. Defer provisional HUD/design-framing polish; develop the next HUD through visual concepts with Mark. Show alias/readability issues before further spending and allow small camera-angle refinements. Full cinematic acceptance, opening semantic completion, independent final review and final owner acceptance remain separate from work-in-progress publication. Older delivery freezes and "next action" banners below are historical where superseded by this direction; their test results remain unchanged.

### R-05 — project/README.md line 8

> **2026-10-31 verification checkpoint:** [Evidence 73](../work/evidence/torque-wrench-rebuild/73-verification-reconciliation-2026-10-30/SUMMARY.md) contains the completed same-build six-case matrix (one recovered case), 840 exact decoded beauty replays, passing camera/HUD assertions on both aspects, 1,398 unit tests and 36 verifier tests. Deterministic lamp replay and the approved smooth terminal stop are implemented. Overall cinematic verification still FAILS strict framing/HUD and alias requirements; the next action is authored subject/visibility reconciliation. New work remains local; last push is `ccb215b2`.

### R-06 — project/README.md line 9

> **2026-10-30 verification reconciliation:** Continue from [plan 73](../../docs/torque-wrench-rebuild/73-verification-reconciliation-plan-2026-10-30.md) after approved/pushed checkpoint `ccb215b2`. Deterministic lamp replay and verification corrections preserve approved composition. Mark approved terminal deceleration in the final 65.4–66.9 s window: 20% exit shoulder and zero-rate endpoint, with unchanged shot boundaries, scroll budget, gear laws and final phase. Final same-build verification is in progress; accepted lead-out and strict sixfold pixel failures are retained.

### R-07 — project/README.md line 10

> **2026-10-30 cascade camera and visibility proof — owner-approved Option A:** Owner selected the high-to-low tracking camera and directed that the input shaft stay visible until it naturally leaves the frame. Authenticated Draco geometry bounds now separate the shared ten-tooth face (`3.174827–9.524858 mm`; source exit to `9.789711`; study hob lead-out to `13.938684`), the far-end sixfold (`61.109647–71.523950`) and the shaft body in depth-tested pixel proofs (`cascadeFeatureMask.ts`, `cascadeProof.ts`). Option A retains Stage 1 carrier `P001836` through `61.5 s` and retires it over `61.5–62.25 s`; the shared functional tooth face contributes `0 px` at every post-`0.35` sample on desktop and narrow, and `inputSixfold` leaves the frame (`≤1` bottom-edge pixel at `56.25 s` on desktop, `0` on narrow). Focused 81/81 tests, typecheck and build pass. Owner visual acceptance, the full same-build six-case roster, dense per-frame replay and the inherited 66.9 s source-takeover C1 stop remain OPEN.

### R-08 — project/README.md line 11

> **2026-10-27 Bullet-Time contract alignment:** [Handoff 62](../../docs/torque-wrench-rebuild/62-bullet-time-contract-alignment-handoff-2026-10-27.md) owns the saved source-alignment results and exact continuation steps. Typecheck, 118 requested tests, 39 additional tests and 6 Node verifier tests pass. Skill-local solver/routing and both reverse gates are installed; quick capture cannot report completion PASS. New shot choreography and browser/pixel proof remain OPEN. Preserve [document 61's active visual lane](../../docs/torque-wrench-rebuild/61-visual-first-side-track-preview-2026-10-27.md) and its pending owner review.

### R-09 — project/README.md line 12

> **2026-10-27 final cascade implementation; pixel gates OPEN:** [Plan 59](../../docs/torque-wrench-rebuild/59-final-cascade-reduction-retime-plan-2026-10-26.md) and [evidence 60](../../docs/torque-wrench-rebuild/60-final-cascade-reduction-retime-evidence-2026-10-26.md) supersede consultation 58 and the orbit/cap rules. 3250:1, per-stage planet laws, 66.9 s, physical-distance clock and phase-matched source takeover are implemented. Focused 242 tests and production build pass. Both near-axis trials failed visibility-aware alias pixels. Owner approved the precise upstream fades in evidence 60; implemented, final verification running. Owner acceptance OPEN; no staging/commit/push/deploy/protected assets.

### R-10 — project/README.md line 13

> **2026-10-26 new owner direction:** [Consultation 58](../../docs/torque-wrench-rebuild/58-owner-reduction-and-longer-stage-views-consultation-2026-10-26.md) contains Opus 5.5/High advice and Astra/High's recommended route for visible 5:1 reductions, no orbit gates, slower early input and 50% longer stage viewing. Owner confirmed the speed reference is P001836. Consultation complete; animation implementation and new runtime validation are pending. The previous 56/57 build remains served. Owner acceptance stays OPEN; preserve all dirty work and delivery boundaries.

### R-11 — project/README.md line 14

> **2026-10-26 corrections 56 (historical):** [Plan 56](../../docs/torque-wrench-rebuild/56-ratio-cap-solid-housing-plan-2026-10-26.md) and [evidence 57](../../docs/torque-wrench-rebuild/57-ratio-cap-solid-housing-evidence-2026-10-26.md) supersede the all-stage orbit rule in 54/55. Shaft ratio 100:1 and measured nominal cap 158 RPM; only Stage 2 gates on a full orbit. Main housing remains opaque throughout the explosion. Source/build/headed playback pass; final 158 RPM roster passes four cases × 23 checks. Gemini-4-Argon reviewed the implementation before the final 2 RPM reduction; see evidence for the exact scope. Dirty tree preserved, owner acceptance OPEN, no Git delivery/deployment.

### R-12 — project/README.md line 15

> **2026-10-26 owner refinement:** Continue with [plan 54](../../docs/torque-wrench-rebuild/54-owner-planet-orbit-reveal-plan-2026-10-26.md): the approved sequence now delays Stage 2 planets until the integral sun is exposed, shows one visible orbit before each downstream carrier, and progressively accelerates the shared input. Focused runtime verification passed (four live cases, independent Gemini-4-Argon SHIP; see [evidence 55](../../docs/torque-wrench-rebuild/55-owner-planet-orbit-reveal-evidence-2026-10-26.md)); owner acceptance is open. Preserve all dirty work; no commit, push or deployment.

### R-13 — project/README.md line 17

> **2026-10-25 owner cascade/transition corrections — technically verified:** Begin with [brief 50](../../docs/torque-wrench-rebuild/50-owner-cascade-and-transition-corrections-2026-10-25.md), [execution plan 51](../../docs/torque-wrench-rebuild/51-owner-corrections-execution-plan.md), [independent review 52](../../docs/torque-wrench-rebuild/52-owner-corrections-independent-review.md) and [execution evidence 53](../../docs/torque-wrench-rebuild/53-owner-corrections-execution-evidence.md). R1/F1–F4 pass 526 source tests, build/typecheck, six runtime cases / 126 checks and independent final SHIP. Preserve the intentional dirty tree; owner visual acceptance is open, with no Git delivery/deployment authority.

### R-14 — project/README.md line 19

> **Current JG-038 camera/HUD owner batch, 2026-10-21:** [doc41 execution and evidence](../../docs/torque-wrench-rebuild/41-EXECUTION-camera-hud-2026-10-21.md) records the implemented doc39 Items 1–10, before/after captures, 40/40 same-build desktop/narrow runtime gates, and the inherited cavern-fold unit failure. Code remains uncommitted on `torque-wrench/rebuild`; owner visual acceptance is open. [Evidence index](../work/evidence/torque-wrench-rebuild/41-camera-hud-2026-10-21/README.md).

### R-15 — project/README.md line 20

> **Next-session handoff — 10 owner visual defects, 2026-10-22:** [doc44 owner spec and handoff](../../docs/torque-wrench-rebuild/44-OWNER-SPEC-AND-HANDOFF-ten-visual-defects-2026-10-22.md) documents Mark's 10 visual findings after reviewing `43ad0648`, with exact root causes and write targets for the next session.

### R-16 — project/README.md line 21

> **Latest JG-038 owner visual corrections, 2026-10-22:** [doc42 execution record](../../docs/torque-wrench-rebuild/42-EXECUTION-owner-visual-corrections-2026-10-22.md) records the four owner corrections — scroll-driven profile ink, higher and longer shard flight with a full 360-degree bullet-time orbit, Ring Switch travel limited so the machined groove stays covered while the OSHA Red stripe still reveals, and the FEA colour field mapped onto the shaft surface. 19/19 same-build desktop and 19/19 narrow runtime gates, zero browser errors; unit suite 1,111 passed / 4 skipped / 1 inherited cavern ring-5 fold failure. Uncommitted; owner visual acceptance remains open.

### R-17 — project/README.md line 23

> **Current JG-038 rebuild, 2026-10-14:** Stages0–2 closed; Stage3 leaf exit recorded; Stage4 implemented with final-build review evidence prepared. Effects D/N70/70, clean opening sweeps, cutter4×258/258, static14/14 and desktop timeline9/9 on build s. Functional verification remains partial; Stage5/6 and all G0–G9/Astra/owner acceptance remain open. Start from the [parallel-functional handoff](../../docs/torque-wrench-rebuild/HANDOFF-2026-10-14-parallel-functional.md), [current evidence](../work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/README.md) and [task-local gates](../work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/GATES.md). Older JG-035 banners below retain their separate historical authority; root GATES.md is not the rebuild ledger.

### R-18 — project/README.md line 25

> **Current JG-035 handwriting state, 2026-10-08:** Ac Fast Reference is traced from the owner's `ac-fast.png`, with true font glyphs in the existing text batch, deterministic letter reveal, graphite colour, and retained red/vector marks. Mark accepted the font direction (“close” is enough; “yours looks good”). [Current evidence and handoff](../work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/README.md) supersede older handwriting/cache/capture statements below. Full animation acceptance remains separate.

### R-19 — project/README.md line 27

> **JG-035 owner revisions, 2026-10-07/08 — implemented; owner visual acceptance OPEN.** Plan: [registered continuation](../work/plans/JG-035-owner-animation-revisions.md) → [checkbox plan](../../docs/jgun-owner-animation-revision-plan-2026-10-07.md); evidence: [folder index mapped to O1–O4/R1–R2/S1–S3](../work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/README.md). Opening handwriting/camera/electrical score, ring holes/knurl seam and shaft cutter/FOS/normal repair are on `codex/jg033-signature-shot` (`524bdb4`…`2831f35`). Captures used bundled Chromium + SwiftShader software GL in a Linux cloud container (not hardware GL). Open: owner visual approval, inherited G6 desktop-full tier drop, Windows hardware verification, drawing-cache regeneration, static-still regeneration, the final full verifier roster, and visual verification of the all-caps humanized graphite hand (`2831f35`, cache v7; in progress, no capture yet).

### R-20 — project/README.md line 29

> **JG-035 final documentation closeout, 2026-10-06/07.** Start from the [current handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) — current-state section first. The owner's [posters-throughout](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/reduced-motion-owner-decision-2026-10-06.md) policy is verified on the current build (43 files/445 tests, 703 modules, preview PID 16784): lifecycle 14/14, static 4/4 with zero CAD requests, shaft 16 cases / 12 gates / 0 defects at FULL/FULL, B1/B2 31/31. The full opening roster finished 5/6 — desktop-full fails 110 expectations after the effective tier becomes lite, cause unestablished, no waiver. Root G0–G5 are checked; G6 is open solely for that full opening acceptance, and owner visual acceptance remains separate. No commit/push/deploy.

### R-21 — project/README.md line 31

> **Historical — JG-035 recovered implementation, earlier 2026-10-06; superseded by the final release banner above.** Start from the [saved implementation handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md). The shaft story/runtime, study assets, tools and shared inspection UI exist. Typecheck and 152 inspection tests pass; lifecycle runtime is 12/14 and dedicated shaft verification/final reviews remain open. The planning-only banner below describes an earlier state. G0–G6 closure and owner visual acceptance are still pending.

### R-22 — project/README.md line 33

> **Historical manufacturing planning approval, 2026-10-05.** [Owner model approval and verbatim shaft storyline](owner-specs/manufacturing-inspection-storyline-2026-10-05.md), [reviewed Ring Switch/Input Shaft plan](../../docs/jgun-manufacturing-inspection-plan.md) and [planning handoff](../work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/continuation-handoff.md) capture accepted geometry and parent/Astra/Opus planning agreement. Implementation subsequently proceeded. Use the recovered implementation handoff above for current work and outstanding runtime/owner acceptance.

### R-23 — project/README.md line 35

> **JG-035 revision, 2026-10-03:** Blue-trace / vertical-shaft concepts are owner-approved; runtime implementation and drawing/material corrections are tracked in [the current plan](../../docs/jgun-blue-trace-tunnel-plan.md). Older correction evidence below is historical. Runtime owner acceptance remains separate.

### R-24 — project/README.md line 37

> **JG-035 causal portal correction — technically verified 2026-10-02; owner visual review OPEN.** The J-Gun pushes opaque paper from below and is already lit beneath the first rupture; gaps expose deep portal space, never the wooden desk. Storm, fracture, crack light, burned edges, scroll share and downstream mechanism timing are retained. [Active correction plan](../../docs/jgun-portal-correction-plan.md). The earlier 184/184 tests, 29/29 B1/B2, six-case roster PASS and technical SHIP belong to the [superseded breakthrough packet](../work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md); they do not verify this correction. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](../work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. No commit, push or deployment.
