# JG-035 storm flicker and visible darkness — execution plan

> **JG-035 final verification update — 2026-10-01:** this snapshot supersedes the in-progress status prose and inherited verification checklist below. The repaired browser roster is **6/6 PASS**, all **169 tests** and **19 full-tier pixel checks** pass, and independent technical review is **ship at the code boundary**. Desktop review video and both viewports' six stills are full tier. **Narrow full-tier video remains UNMET** after three recordings downgraded to lite; those failed runs are preserved. Owner acceptance remains open; no commit, push or deployment. [Current review packet](../project/work/evidence/JG-035-opening-drafting-table/storm-pacing-2026-10-01/review.md).

Date: 2026-09-30. Status: pacing rebalanced 2026-10-01 and verification reopened. The prior technical closure was measured against the old .40 contract; its pixel, browser-roster, and review-media evidence is stale and must be rerun against the current contract. Owner visual taste/approval remains open.
Owner visual acceptance remains open. This is a continuation of JG-035 Track A.

## Brief and authority

Read first: [blackout plan](jgun-blackout-emergence-plan.md), [current owner handoff](../project/work/evidence/JG-035-opening-drafting-table/handoff-2026-09-30b-flicker-and-visible-dark.md), and its [implemented predecessor](../project/work/evidence/JG-035-opening-drafting-table/handoff-2026-09-30-blackout-emergence.md).

The pre-rebalance candidate has historical technical evidence, but the owner requested more erratic storm-night flicker, readable darkness, and pacing closer to the measured oryzo.ai reference. The objective is an authored cinematic opening: technical drawing becomes a physical object through light, pressure and separation. Lusion is a quality reference for coherent art direction, spatial depth, material finish and paced reveals; its assets or identity are not copied, and this plan claims no parity or owner approval.

The parent owns visual decisions, shaders, the lamp envelope, camera timing, integration and final quality judgments. Supporting coding is delegated to GLM-5.3, GLM-5.3 Flash and DeepSeek Flash. Each assignment has exact file ownership, interfaces, constraints and verification. No worker may reset prior work, stage scratch files, commit, push or deploy.

## Scope and assumptions

- Build the storm/visible-dark opening on the current page. Enclosure and M249 page separation is a distinct task, pending the owner's clarification; do not silently expand into routing/content migrations.
- Retain cream vellum, dark navy printed geometry, walnut support and the current opening detail/traverse/registration shots.
- Keep the existing real-profile lightning, geometric contact solve, pose-axis extraction, mechanical ladder and downstream progress windows.
- Preserve reduced motion at intro .38, fully lit and registered, with no pulse, bulge or extraction. Lite keeps the story and 45% pressure amplitude; poster remains usable.
- Dimension lettering and notes remain faintly readable during darkness, along with geometry. They should feel printed on the same stock, not fade away independently of the page.
- Initial mood: cinematic tension with asymmetrical failures, rather than repeated full-screen white flashes. Owner may steer this while implementation proceeds.
- All treatment is a pure function of normalized scroll. Pause freezes it; reverse retraces it. No random, timer, accumulated oscillator or autonomous flicker.

## Visual thesis and phase contract

The page is a still physical object under a failing practical lamp. Five failures grow irregularly deeper. A longer near-out interruption breaks the predictable rhythm, followed by a weak recovery and final lamp extinction. Cool ambient bounce keeps the sheet and its dark ink present. Lightning provides the only intense white event. Warm light returns gradually as vellum swells under the exact profile; the metal resolves before lifting clear, followed by the existing restrained reflection pass.

| Beat | Intro t | Responsibility and acceptance |
|---|---|---|
| Detail, traverse, establish, register | .00–.38 | Preserve current camera/reveal and early brightness-shift fix |
| Registered lit hold | .38–.45 | Full ink, lamp 1, stable camera |
| Five irregular lamp failures | .45–.58 | Unequal minima, unequal recoveries, one extended near-out shelf; continuous envelope; failure-key u-values unchanged and normalized to this window |
| Visible-dark anticipation | .58–.66 | Lamp 0; paper and navy lines readable; no lightning yet |
| White electrical profile, registered camera | .66–.79 | White core, blue-white wake; real profile, fixed registered camera |
| Pressure and lamp return | .79–.86 | Bulge and lamp return begin .79; lamp completes .86 |
| Metal starts | .81 | Metal resolves while pressure and lamp return continue |
| Extraction starts | .86 | Existing pose solve reparameterized; separation controls pressure release |
| Perspective starts | .90 | Orbit leads into extraction and rise |
| Sheet fade | .97–1.00 | Existing fade and hero handoff |

Shared source boundaries: `focusEnd = .05`, `onboardStart = .05`,
`onboardEnd = .38`, `registrationEnd = .79`, and `detachStart = .88`;
`DRAWING_INTRO_WINDOW` remains `releaseEnd = .12`, `heroEnd = .525`.

Use raw intro scroll share .50 (raised from .40 on 2026-10-01). Measured against the live oryzo.ai reference, the site is 56 viewports tall, a single statement beat holds 2.5–3 viewports, and individual held moments pass 5. At .40 the lit recognition beat lasted 0.24 viewports and read as a glitch rather than a beat. The larger share buys dwell inside the same .00–.12 progress ownership, so downstream numeric windows do not move. Confirm inverse mapping and station/deep-link navigation. The eventual page split must rederive these values from the live rendered document.

Historical .40-contract scroll budget (STALE): desktop reached intro end at scrollY 10871.831 with total scrollable travel 27179.58 (rendered document height about 28079.58 at viewport 900); flicker occupied 1522 px, visible-dark hold 652 px, and trace 1522 px. Narrow-lite reached intro end at 10200 with total travel 25500 (height about 26344 at viewport 844); flicker occupied 1428 px, dark hold 612 px, and trace 1428 px. These measurements must be replaced with .50-contract captures before any pacing claim.

Five dip minima are art-directed in normalized flicker time at approximately .12, .28, .46, .64 and .85, with recovery peaks below full lamp power. The fourth dip holds near zero before a weaker recovery. Store immutable keys outside the frame loop and interpolate bounded smooth segments. Exact keys will be recorded with final measurements.

Dark paper target: initially 20–40/255 apparent luminance in an unoccluded interior patch, measured on the actual rendered output at fixed registered camera. This is a tuning range, not a shader-space constant. Navy ink must remain darker than its adjacent stock. Background support must stay subordinate. Verify both desktop and narrow; do not infer visibility from material uniforms alone.

The initial shader approach adds a cool ambient paper contribution separate from lamp power, a smaller cool desk floor, and consistent dark ink/text treatment. Tune with pixel evidence before increasing trace brightness. Keep rest bloom zero throughout the intro to avoid reintroducing the pre-pulse paper shift. Pulse bloom remains gated by actual electrical excitation in the dark lamp state.

## Execution and ownership

### 1. Freeze and measure

- [x] Read plan, both handoffs, TODO, knowledge map, skill routing and measured mechanical canon.
- [x] Inspect live git status; identify pre-existing dirty candidate and scratch material.
- [x] Check graph coverage and read changed source directly where freshness is stale.
- [x] Copy the affected baseline files into ignored session scratch; retain previous evidence untouched. Thirteen baseline files preserved at `.scratch/storm-visible-dark-20260930-baseline/`.
- [x] Verify current ports/preview state and capture the registered lit/dark/trace baseline if existing evidence cannot support comparison. The stable proof attempts use the rebuilt :4173 preview; registered lit/dark/trace captures are preserved under the evidence root.
- [x] Inspect the supplied Lusion reference and record transferable principles, with limitations of remote inspection stated. Live homepage: strong focal composition, controlled material contrast and spatial forms; no claim of motion parity from a still.

### 2. Parent visual implementation

- [x] `src/scene/drawing/introTimeline.ts`: update phase contract, irregular lamp envelope and raise the scroll share .40 → .50. Preserve mapping invertibility, reduced-motion hold and pose solver.
- [x] `src/scene/drawing/DrawingLinework.tsx`: cool ambient stock/desk lighting and faint printed lettering; retain proof-mode isolation, early pool suppression and contact/vellum effects. `sheet/sheetText.ts` dims glyph ink via lamp uniform, preserving printed contrast.
- [x] Adjust `sheetCamera.ts` or pressure helpers only where constants do not already follow the new phase boundaries; preserve registration and physical pose invariants. Existing helpers already follow the shared phase constants; no extra production edits required.
- [ ] Inspect trace and postprocessing at the new dark floor; adjust white core/wake only if new contrast evidence justifies it. Pre-rebalance pixel evidence is stale.
- [ ] Inspect forward motion, paused states and reverse; tune the treatment as a connected shot. Final browser closure remains a separate gate below.

### 3. Delegated supporting work

- [ ] GLM-5.3: own `scripts/verify-jgun-opening.mjs` and, if required, `scripts/check-b1b2-contract.mjs`. Update checkpoints for the .50 share and .38/.45/.58/.66/.79/.86/.90/.97 boundaries; retain existing registration, contact, shader and fallback assertions and compare forward/reverse values.
- [ ] GLM-5.3 Flash: own supporting timeline/camera/pressure unit tests. Test bounded continuous deterministic lamp power, five unequal minima, extended near-out shelf, correct phase ordering, inverse scroll mapping, unchanged contact math and the .38 reduced-motion state. Do not alter visual production code.
- [ ] DeepSeek Flash: own `scripts/capture-jgun-blackout-motion.mjs` and a dedicated visible-dark pixel measurement script if needed. Capture new review stills/video plus telemetry, measure paper/ink/trace on fixed rendered sheet coordinates, record tier and console errors, and persist the verdict. No visual production changes. Full-tier motion depends on the adaptive ratchet, which must be recorded rather than assumed.
- [x] Verify per-request provider/model attribution; record requested model separately if actual attribution cannot be proven. GLM-5.3 and GLM-5.3 Flash have requested/resolved/served proof; the requested DeepSeek route returned 200 but its actual served model is unproven and is recorded separately.
- [x] Monitor DeepSeek errors. On one 429, wait for recovery and explicitly nudge/restart the interrupted assignment. On repeated 429s, stop DeepSeek assignments for this session and route remaining work to GLM; preserve partial work and report the change. Nudge sent; later observed requests 200, worker reports no own rate-limit interruption. See model-routing evidence for attribution limits.

Workers are not alone in the checkout. Disjoint write sets are mandatory. They execute and return concrete changes and checks, not a proposal. Parent reads each diff and reruns its checks. Corrected specs go back to the owning worker; do not silently accept an empty diff or model substitution.

### 4. Technical and visual gates

The 2026-09-30 gate results in the evidence root were produced before the 2026-10-01 pacing change. Browser-derived pixel, roster, and review-media proof from that run is stale and must not be cited as current. Rerun the gates against `INTRO_SCROLL_SHARE = .50` and the phase table above.

- [ ] Focused unit tests, `npm run typecheck`, all unit tests, and a production build against the rebalanced timeline.
- [ ] `node scripts/check-b1b2-contract.mjs` and `npm run check:station2` against the rebalanced timeline.
- [ ] Restart the :4173 preview after the rebuilt candidate before new proof capture.
- [ ] Quick opening verifier for iteration at representative registered-lit, failure, visible-dark, trace, pressure, and extraction positions.
- [ ] Pixel proof: dark stock remains visible, ink is darker than adjacent paper, and the white electrical trace contributes measurable bright contour pixels at both viewports, with the identical-camera null-trace control. Capture representative frames from the new registered hold, visible-dark window, and electrical window.
- [ ] Stable registered lit hold .38–.45 and electrical hold through .79; no pre-pulse paper lift, no early metal before .81, no creeping camera, no shockwave.
- [ ] Forward/reverse agreement at failures, dark pause, trace and emergence; paused scroll holds effect state across applicable standard, reduced, and lite cases.
- [ ] Check reduced/lite/poster behavior and quality-tier evidence with headed Chrome; headless results cannot establish full-tier finish.
- [ ] Full six-case opening roster once the rebalanced candidate is stable. Do not label a quick run full completion.
- [ ] Independent fresh-context technical review, plus the orchestration advisor review when callable; resolve material findings and rerun affected checks.
- [ ] Parent final diff review and explicit visual critique against new review media. Keep technical review separate from owner acceptance and Lusion-level taste judgment; do not claim parity.

### 5. Documentation and delivery

- [x] Supporting documentation worker (after phase contract stabilizes): update README, project README, animation-spec §4.1/§5.0, this plan, and the JG-035 work-index entry. Mechanical ladder numbers are unchanged. If any mechanical behavior changes, update the rig skill tables in the same future commit.
- [ ] Keep this checkbox plan current. Write a new review packet and handoff under a dated evidence folder for the .50 contract with file ownership, model evidence, test results, captures, pixel measurements and known limits. The existing 2026-09-30 packet remains historical evidence and is stale for this pacing contract.
- [ ] Open the fresh review preview and provide concise review instructions for the rebalanced forward/pause/reverse sequence.
- [ ] Owner approves the visual result before push/deploy. No commit unless asked; retain all unrelated dirty work.

## Weak spots and escalation

The parent can design the phase language, implement shader lighting, reason about geometry and assess objective evidence. The weaker area is judging perceptual rhythm from captures and equating a broad studio reference with the owner's exact taste. Request one specific Lusion sequence or film practical-lamp reference; proceed with the written storm-night brief while it is optional. A still cannot establish temporal finish, and machine vision cannot establish hidden geometry correctness. Review motion plus telemetry and pixel proof together. Never claim studio parity merely because tests pass.

## Evidence and completion state

Historical evidence root: `project/work/evidence/JG-035-opening-drafting-table/storm-visible-dark-2026-09-30/` (pre-rebalance; stale for browser proof).
Completion requires the rebalanced candidate, fresh relevant technical gates, a new review packet, and fresh review media. Owner acceptance, commit and deployment remain separate named decisions.
