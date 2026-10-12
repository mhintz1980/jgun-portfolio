# Torque wrench rebuild — research report

Decision needed: approve entry into design. Research evidence is collected; owner acceptance and design approval remain open. No product implementation is authorized by this report.

Worktree: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`, HEAD `666cbf23d490352dc549b4730d3e9d14e042a5a4`. Research only: this session added docs and evidence; tracked product diff is empty at the recorded checkpoints. This session did not edit the main checkout or tunnel, push, create a PR, deploy or publish; the other session's history is not independently audited. Owner released resources and approved research. Session-owned runtime processes are stopped after collection.

## 1. Opening: a tier change alone does not restore the rock

The first research item was captured before other browser research and before any tunnel edits. Five checkpoints at intro `.84/.86/.90/.94/.98` show the unwanted pale, smooth wall appearance on **AMD Radeon 780M, ANGLE D3D11, full tier, qualityLock=1**, with both portal materials `uPortalLite=0`. Live unchanged canvas/context and actual rendering advancement bracket each PNG. Final capture errors: zero. Camera position/FOV settling took 1.64–1.85 seconds.

Independent Astra review passes the bounded evidence, not the appearance. Software rendering or lite tier alone cannot explain the lost rock look. This is not a same-build hardware/software A/B, and the exact geometry, shading, illumination and model-occlusion contributions remain unresolved. Rock colours, procedural fissures and a 3.2m depth exist in source; their presence does not establish the required visual result.

The owner target remains rocky/cavernous, near-vertical, light-blue electrical fissures, no visible floor/bottom, and no circular hole/splined collar. Current output is not accepted. The emerging model obscures much of the opening, particularly at `.86`. No assertion that every unwanted feature is removed follows from `capVisible=false`.

- [Comparison PNG](../../project/work/evidence/torque-wrench-rebuild/01-tunnel-diagnostic/tunnel-comparison.png)
- [Full diagnostic evidence](../../project/work/evidence/torque-wrench-rebuild/01-tunnel-diagnostic/full/)
- [Independent Astra review](04-tunnel-research-review.md)
- Failed resource-bookkeeping attempts are retained as `full-attempt-1/` and `full-attempt-2/`; original versus guarded-refetch identities are disclosed.

## 2. Motion: three properties and several existing systems

Required standard: [smooth-scrolling.md](smooth-scrolling.md). Primary owner reference: [Oryzo](https://oryzo.ai/). Narrative pacing, input response and cinematic motion must be assessed separately and together. Increasing lag does not fix discontinuities. All numerical starting points remain revisable.

[Source inventory](03-current-motion-inventory.md) identifies Lenis, a numeric GSAP hero scrub, exponential camera damping, accumulated rest orbit, intro scroll assistance, raw-to-paced progress mapping, and independent modal inspection controls. The hero tween insertion positions are timeline times, not global beat boundaries. Existing content is available as a parts source; the current page is not a scroll-independent beat-data architecture.

### Bounded recordings

Both recordings use installed Windows Chrome, 1440×900, DPR 1, slow/fast wheel bursts, stopping and reversal, followed by measured traversal. They include video, PNGs, wheel observations, rAF samples and reports. Capture/instrumentation overhead prevents performance certification.

| Observation | Local `local-retry-1` | Oryzo `oryzo-retry-1` |
|---|---:|---:|
| Recorded samples | 1,524 | 3,368 |
| Slow/fast/reverse nominal wheel counts completed | 12 / 4 / 4 | 12 / 4 / 4 |
| Scroll rest after slow input | 870ms | 483ms |
| Scroll rest after fast input | 1,095ms | 549ms |
| Scroll rest after reversal | 1,078ms | 532ms |
| Furthest forward document fraction | 93.37% | 71.70% |
| Final retrace fraction | 0% | 2.25% |
| Browser/network errors | 0 | 2 aborted media requests |
| Complete harness profile / success | false / false | false / false |

Rest means native scroll displacement ≤0.5px per sampled frame for ≥300ms, measured from the last observed wheel. It does not mean camera, scene or every animation has stopped. These are diagnostic observations, not tuning targets or matched visual distances. The same nominal 4×1200px burst produced substantially different displacement: Oryzo reversal approximately −800px; local −4800px. Do not infer Oryzo's settings or a direct latency multiplier from these figures.

Local before/after renderer observations identify AMD 780M/D3D11 and full tier. There are no recorded context events. The readiness wait timed out; annotations/warm readiness are not certified. The local traversal overshot `.90` and `.02`, so the harness correctly reports incomplete. Traversal samples use deliberately large, adaptive input chunks and cannot be used as evidence of ordinary camera-path discontinuity.

Oryzo's forward traversal did not reach `.90` within its bounded segment. `yoga.mp4` and `bite.mp4` failed with `net::ERR_ABORTED`; retain these failures without inventing their cause. Layout extent changed during loading. Reference observations are DOM-only: no internal camera telemetry, exact Lenis/GSAP settings, full-site motion acceptance or C¹/C² claims. Earlier `oryzo/` covers only 23% forward; `local/` contains the preserved connection-refused failure and zero samples.

Videos permit comparative playback; this report does **not** claim a completed human full-motion quality judgment. Camera position/quaternion/FOV deltas are recorded locally, but a continuity assessment must align samples to narrative progress, input magnitude and frame interval. Large single-sample deltas are investigation leads, not proof of a keyframe defect. Touch, reduced-motion, manufacturing-modal return, settled reverse equivalence and boundary continuity remain unverified.

### Auxiliary runtime snapshot and provisional distance

`02-motion-baseline/runtime-snapshot.json` observes Lenis options: `duration=1.1`, `lerp=.1`, `smoothWheel=true`, `syncTouch=false`, `autoRaf=false`. Drawing proof exists, but annotations and warm readiness are false in this separate startup snapshot. It is an auxiliary observation, not the fully hashed tunnel packet.

Installed Lenis source takes its duration/easing animation branch before its lerp branch when both duration and easing exist. Do not infer that `.1` disables `1.1` from documentation wording alone. The effective response includes the actual invocation and downstream scrub/camera systems; preserve this implementation and the measured baseline until an approved tuning experiment.

At this viewport, document height is 28,080px and scroll range 27,180px. Calling the existing inverse map at the JGUN camera boundary, paced `.525`, yields raw `.7301136364`, approximately **19,844px / 2,205vh** from the top. Applying the owner's provisional 2× JGUN-only starting point yields approximately **4,410vh / 44.1 viewport heights**. This is a measured current-page boundary and a starting arithmetic budget, not a fixed new-page length or a count of required beats. It excludes the later shared-page content after the boundary. Reconcile beat complexity and holds during design; do not double the entire portfolio document.

## 3. Scope and candidate research

First release remains existing JGUN content, restored opening and completed Input Shaft cutter bullet time. Existing drawing/CAD pipeline and assets are reused; composition and camera choreography may be rebuilt. Subject time and camera motion must be uncoupled for bullet time. The current cutter slow-motion sequence is incomplete until its camera swings and timing are completed and accepted. Planet inspection and H7/g6 content remain easy-to-add later sequences.

The three marksList effects remain candidates, deferred from the first release. Existing owner-notes research identifies these constraints, not approved implementations:

- Converting a PNG to HDR does not create genuine dynamic range. Any environment candidate requires real lighting/reflection evidence and a bounded asset budget.
- Depth-map displacement of a flat shard image cannot supply unrestricted wide-orbit parallax. Existing breakthrough geometry is a relevant reuse source; no new debris pipeline is committed.
- GLSL mask scanning is a possible transition treatment, requiring synchronization to canonical progress and separate Astra/owner visual approval. It is not part of accepted first-release scope.

The fresh private URL remains `/torque-wrench/`. Existing live page stays untouched until replacement acceptance, then archive. Separate-document fade navigation and generic shell primitives belong to the parallel session. No shared-shell readiness is asserted here. Design may proceed after owner approval; implementation must wait for those primitives and later phase approvals. Quiet Machine final decisions and the reserved M249 page remain unchanged.

## 4. Evidence and review

Primary index: [06-evidence-index.md](06-evidence-index.md). [Independent Astra final report review](07-research-review.md): **PASS for bounded research**, no blocking findings. Luna gathered the motion source inventory; Sol authored capture/recording harnesses; Astra authored/approved the research procedure and independently reviewed the critical tunnel diagnostic and final report. Native custom roles expose configured model/effort; backend identity is not independently attested by model prose.

Research supports the bounded tunnel conclusion and supplies a reproducible motion baseline with explicit gaps. It does not certify smoothness, FPS, natural full-tier selection, visual acceptance or a completed effect. No further GPU capture is needed to repeat the already answered tier-only question; unresolved appearance and motion work belongs in the approved design/verification scope.

Stop here for owner approval to enter **design**. Structure, plan and implementation remain later phases with their own approvals.
