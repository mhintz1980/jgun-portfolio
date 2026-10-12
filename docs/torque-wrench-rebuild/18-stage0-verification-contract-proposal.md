# JG-038 — Approved Stage 0 verification matrix and numerical budgets

Date: 2026-10-11 (America/New_York). Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch `torque-wrench/rebuild`; source baseline `8945fa95cc70b74bdcc9da27cc0573c3d1157da4` plus preserved planning changes.

**Approved by owner 2026-10-11.** Owner replied “I approve” to the request to approve this matrix and numerical limits to close Stage 0. Sections 2–6 are the approved starting verification contract; this is not a measured performance pass. Stage 0 is closed. Stage 1 proceeds under existing ordered implementation authority; shared-shell/V16 coordination and all later gate/acceptance boundaries remain. The filename retains its proposal-era name for link stability.

Inputs: [accepted plan 13](13-implementation-plan.md), [reuse reconciliation 17](17-reuse-readiness-ownership-reconciliation.md), [motion standard](smooth-scrolling.md), [Stage 0 evidence](../../project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/README.md), and [earlier research report 05](05-research-report.md). An Astra planning seat proposed these values using current source and attributed baseline evidence; independent review is recorded at the end. Owner approved the resulting starting engineering ceilings. Feasibility remains to be measured; limit changes require a recorded revision rather than silently weakening a failed gate.

## 1. Stage ordering and scope

Stage 0 establishes authority, delivered shared-shell readiness, coordination and the approved verification contract. Stage 1 creates the private entry. G0 subsequently proves that entry's integration and document isolation. Complete G0 cannot be a prerequisite for creating the entry it tests. Stage 0 readiness does not certify an absent torque page.

Functional shared tests, tsc, a scratch-output production build, served/build identity and the delivered shell transition roster may run before approval of numerical performance budgets. They do not measure G8 or approve effects. Torque entry, private poster integration, full/lite story behavior, mutation red-proofs, V16 scene acceptance and owner PNG/full-motion approval remain later scoped checks.

No conductor tuning or extraction is assigned by this document. Before motion edits, retain baseline/mapping checks from reconciliation 17 and reread the motion standard. Domain skills are read at each implementation-domain entry; S0.6 is a continuing requirement, not a claim that every future skill has already been read.

## 2. Reference environment and approved case matrix

Reference device refreshed locally: Nimo Direct Inc. N177L, Radeon 780M, driver `32.0.31041.1004`, RAM `30,936,129,536` bytes, Windows 11 Home Insider Preview `10.0.26340` (build 26340). Installed Node `22.19.0`, Vite `7.3.6`, Playwright `1.56.1`. Current power scheme is Balanced; battery status 2 (AC), 58% at observation. Browser version is recorded by each readiness run. Browser GL and display refresh must be observed separately before performance work; GPU inventory alone cannot establish either.

Proposed performance setup: AC power, 60Hz presentation where available, installed Chrome, no artificial CPU/network throttling for primary measurements. Record actual refresh/power/backend every run and invalidate comparisons when environment changes. Hardware full-tier acceptance requires a reported hardware GL renderer; software GL is diagnostic evidence only. Do not infer GL from launch arguments.

| Case | CSS viewport | Emulated device DPR / input | Modes and purpose |
|---|---|---|---|
| D | 1440×900 | 1 / desktop | Natural full; requested lite; reduced motion; explicit poster; WebGL init failure; runtime context loss. Six primary cases. |
| N | 390×844 | 3 / touch-capable mobile emulation | Same six modes. Six primary cases. Emulated on the reference laptop; not physical mobile performance. |
| H | 2560×1440 | 2 / desktop | Full/lite pixel cap and resize checks, supplemental. |
| L | 844×390 | 3 / touch emulation | Full/lite orientation, framing, controls, supplemental. |

Run the six D/N cases independently with fresh contexts. Reduced motion and explicit poster are distinct. Initialization failure and context loss are distinct failure/recovery cases and require the semantic static path. Shell readiness's existing harness uses DPR1 in both viewports; that is its exact scope, not the proposed N/DPR3 performance run.

A physical narrow-device model is not available in the evidence. Physical mobile performance remains an explicit unverified supplemental requirement until a device is named; approval of this matrix must not be described as physical-mobile acceptance. If physical mobile certification is required before final delivery, add its named device/OS/browser/power conditions before that gate.

Natural adaptation runs have no `qualityLock`. Record requested/effective tier, DPR and tier changes; full→lite cannot pass a full-tier expectation. Locked runs are separately labeled diagnostics. Static modes must create zero narrative WebGL canvases, zero narrative CAD requests and zero narrative renderer allocations. Explicitly distinguish any permitted capability probe from narrative rendering; the private static paths should decide their tier before evaluating narrative GPU imports.

## 3. Repeatable input roster

- Wheel in pixel units: 12×120px at 100ms intervals, stop 3s; 4×1,200px at 100ms, stop 3s; reverse 4×−1,200px at 100ms. Record actual native displacement and canonical progress.
- Touch: ten 500ms swipes from 80% to 20% viewport height, 500ms gaps; ten reverse swipes. Label emulated gestures separately from physical touch.
- Keyboard: ArrowDown×10 at 100ms; PageDown×3 at 500ms; corresponding reverse keys; Home/End. Check Tab/Shift+Tab, Enter/Space, Escape, visible focus and modal focus return.
- Scrollbar/direct seek: 0, .25, .5, .75, 1 and reverse; reload at .5; every beat boundary and ±.001 canonical progress, clipped at endpoints. Include invalid windows and unknown director IDs in the pure resolver checks.
- Pointer: center→four corners→center, 500ms per leg, then 5s hold. Keep pointer state separate from narrative samples.
- Functional stress: controlled 30Hz/15Hz update delivery, abrupt reversal and 5s hidden-tab resume. These are continuity/lifecycle tests, excluded from unthrottled performance distributions. Do not introduce accumulative playback clocks to simulate a low-rate presentation.

## 4. Approved rendering ceilings

| Limit | Full | Lite |
|---|---:|---:|
| Maximum effective DPR | 1.5 | 1 |
| Maximum drawing-buffer pixels | 3,686,400 | 2,073,600 |
| Warm frame interval p50 | ≤17.2ms | ≤17.2ms |
| Warm frame interval p95 | ≤20ms | ≤22.2ms |
| Warm frame interval p99 | ≤33.4ms | ≤33.4ms |
| Intervals >33.4ms | ≤1% | ≤1% |
| Maximum warm frame interval | ≤100ms | ≤100ms |

These intervals target approximately 60 FPS median with explicitly bounded tails; passing p95 is not a claim that every frame fits 16.7ms. Lite reduces work while retaining the median target. Report actual distributions and misses rather than relabeling 45 FPS as stable 60 FPS.

Effective DPR = minimum of device DPR, tier DPR cap and `sqrt(pixelCap/(CSS width×CSS height))`. Permit below 1 when necessary for the pixel cap. Account for integer drawing-buffer dimensions and enforce the actual pixel total. D full/DPR1 yields 1,296,000 pixels; N full/DPR1.5 yields 740,610; H full's pixel cap lowers DPR to 1. Current root `SceneCanvas` uses a DPR2 ceiling and adaptation through 1.5/1.25/1; the lower proposal is a private-page starting policy, not an edit to the live page.

Proposed **peak totals per presented frame across all render passes**, including shadow, depth and post passes:

| Phase | Full calls / triangles | Lite calls / triangles | Estimated resident texture + render-target ceiling, full / lite |
|---|---:|---:|---:|
| Drafting/read holds | 350 / 2.0M | 250 / 1.5M | 192 / 128 MiB |
| Pressure/rupture/pit/emergence | 500 / 3.0M | 350 / 2.0M | 256 / 160 MiB |
| Mechanism/explosion | 300 / 2.0M | 220 / 1.5M | 192 / 128 MiB |
| Inspection/cutter | 400 / 2.5M | 280 / 1.75M | 256 / 160 MiB |
| Close | 200 / 1.0M | 150 / .75M | 192 / 128 MiB |

These are future implementation ceilings, not current measured costs. Line segments/points are reported separately; triangles alone do not describe drafting cost. Include dimensions, formats, mipmaps, cube faces, depth attachments and multisampling in texture estimates; `renderer.info.memory.textures` is a count, not bytes. Report geometry-buffer bytes separately. If an estimate cannot be supported, mark the memory gate unverified.

The earlier diagnostic checkpoint's `calls=1/triangles=1` cannot represent the whole CAD frame; never use a last-pass sample as total scene cost. Complexity ceilings do not waive frame-time failures. Phase differentiation accommodates drawing complexity, rupture overlap and inspection resources while keeping a bounded close state.

## 5. Measurement definitions and startup budgets

For each D/N live tier, make three independent runs. Complete a forward/reverse prewarm, wait for CAD/drawing/fonts/compilation readiness, then wait 5s. Readiness timeout at 30s is a reported failure, not an excluded sample. Sample every phase for 60s: 20s forward, 20s reverse, 20s holds, using a fixture confined to that phase. Report all runs and the worst result; do not pool runs or phases to hide a failure.

Measure presented rAF intervals, not individual pass intervals. Sum renderer counters over the entire frame without depending on automatic per-pass resets. Record GPU timing only when valid/supported; rAF is not GPU execution time. Capture-free telemetry establishes distributions; separate motion recordings and unaltered PNGs support effects/owner review. Hidden-tab/stress intervals are explicitly separate functional cases, not silently discarded samples.

Proposed local production-serving startup ceilings without network throttling:

| Startup span | Approved maximum |
|---|---:|
| Valid drawing cache: navigation→fully ready | 10s |
| Stale/missing cache: navigation→fully ready with live fallback | 15s |
| Drawing preparation/bake span, cached path | 4s |
| Drawing extraction/bake span, live fallback | 8s |
| Selected inspection decode/parse→ready | 3s |
| Initial shader preparation | 3s |
| First selected inspection shader preparation | 1.5s |
| New shader programs during measured warm replay | 0 |

Use five fresh-context trials per valid/missing/stale cache condition and report every value and maximum. Browser-cold does not imply OS/driver-cold. Record cache hit/version, fallback cause, fetch, rig consolidation, snapshot, cache decode, bake, Troika/font, compile and upload spans; overlapping spans are not summed. Source cache fetch timeouts are not a license to exceed the proposed readiness budget. A future optimization/fallback-policy change must preserve legacy callers.

Prove zero new warm shader programs with scoped program-creation/link-event instrumentation or equivalent per-program identity tracking throughout the entire interval, including disposal/replacement. Net `renderer.info.programs.length` growth alone is insufficient: a disposed program can conceal a new one. If that observable is unavailable, mark the metric unverified. Instrumentation must be bounded and its overhead recorded; no product instrumentation is implemented in Stage 0.

Earlier motion evidence is instrumented and incomplete: report 05 gives scroll rest roughly 870–1,095ms and camera settling 1.64–1.85s. It informs the following candidates; it does not certify this private page. Its auxiliary snapshot has quality lock and false annotation/warm-readiness flags. The earlier approximately 2,205vh camera-boundary distance and provisional 4,410vh arithmetic remain attributed proxies, not approved private scroll length; physical length stays separate from beat semantics.

## 6. Approved response and deterministic-state tolerances

- Retain Lenis 1.1s as the initial response setting. Scroll rest ≤1.2s from the last wheel event, defined as native displacement ≤0.5px/frame for at least 300ms on the reference 60Hz run.
- Camera/lamp settle within a further .5s and ≤1.7s total after the last input. Record pose/lamp target residuals separately from native scroll rest. Compare against the same target/progress and exclude optional pointer input from this settle test.
- Hold fixed canonical progress for 5s: narrative positional drift ≤0.1mm, quaternion-angle drift ≤0.01°, FOV drift ≤0.01°, normalized shader/lamp-channel drift ≤1e−4. Use these same tolerances for matched-progress forward/reverse/direct-seek comparison, after declared transient settling.
- Optional pointer offset: projected displacement ≤1% of the shorter viewport dimension, angular offset ≤0.5°, center return within .8s. Reading/fracture suppression residual ≤0.25 CSS pixels. Pointer response cannot modify canonical beat/director state.

These are verifier tolerances, not mechanical permission. Preserve source part identity, measured offsets, positive ring rotation, gear relationships and accepted annotations/inspection content. Cutter verification samples subject rate and camera position/orientation independently through entry, slow interval, normal-speed arc, exit and reverse. Current shaft camera hold remains insufficient; this proposal does not implement the arc.

## 7. Coordination and approval checkpoint

Readiness uses a unique scratch build and loopback preview on port 4193 with strict port binding. CPU checks, build and browser rosters run sequentially. Before starting, scoped process/port checks found no conflicting Vite/build/capture candidate and no listeners at 4173/4191/4193/5199. Existing Node/Blender MCP transports and user applications are left running. This is a bounded local readiness window, not a system-wide GPU reservation or an indefinite reservation for future performance work.

Task-owned server PID, scratch output, source/build/served hashes, commands and released resources are recorded in [local readiness evidence](../../project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/local-20261011-01a12c92/readiness.json). Recheck idleness/power/ports before later numerical verification; no other session is messaged and no other checkout is accessed. The existing repository `dist/` is preserved.

**Owner decision recorded:** matrix and budgets in §§2–6 approved; S0.7 and Stage 0 closed. G0–G9 and runtime/visual quality remain unverified. Physical-mobile certification remains supplemental until a device is named. No repeat implementation-plan or budget approval is needed; preserve the actual approved limits when implementing verifiers.

Permitted readiness checks completed on this worktree: 8 shared files / 233 tests PASS, tsc clean, scratch production build PASS, 7/7 delivered-shell transitions PASS at each viewport, 25 served HTML/JS/CSS hashes matching build before/after. Existing `dist/` and product source were preserved; task previews stopped and scoped ports released. Build chunk warning and the reproduced default-QM missing `/models/rl300-extra-parts.glb` are disclosed in the linked local record. No error-free scene or private torque runtime claim follows.

Independent native `tier-reviewer` (configured Astra/medium) returned **ship for owner review** after two documentation refinements: superseding old record-only/readiness status and defining shader creation/link-event observability. It independently checked all 274 recorded source hashes, 66 build hashes, command/report hashes and the recorded 25 served-hash comparisons, plus tests and transition report outputs. Parent-recorded historical preview shutdown/dist preservation and the 263-file planning comparison were not independently reconstructed. Missing-QM-asset triage and pending authority limits were reviewed. Numerical feasibility/approval, physical-mobile/hardware performance, private torque integration and owner effects/visual acceptance remain unverified.

Parent final checks: 274 product hashes unchanged, all proposal/local-record relative links resolved, HEAD/branch unchanged, scoped ports free and no task server/verifier processes remain. Only the intended existing owner/plan/Stage 0 records were updated; prior content was retained. This pass made no Git mutation or product/shared/V16/protected-checkout edits. Stage 0 is prepared for matrix/budget approval; it is not fully closed while that approval remains pending.

Subsequent owner approval supersedes the review-time pending statements in the two preceding historical paragraphs. Stage 0 is now closed; next is Stage 1. Technical performance, effects/visual acceptance and downstream gates were not closed by approval.
