# Torque wrench rebuild — owner rulings

## Latest owner correction — 2026-10-17 (supersedes conflicting older visual direction)

Next implementation starts with **lightning cracking**, then the **cavernous tunnel
left after the model exits the drawing**. Current owner screenshots reject the pale,
sparse profile crack effect and the current cavern. Use electric-blue branching light
from `01-paper-webbing.png` and the named cavern reference; the two newly supplied
broken-glass photographs specify fracture GEOMETRY, not white emission or glass color.
The fractured pieces must retain the drawing paper's color and printed appearance.
This explicitly supersedes the older dark-blue/dark-glass shard material direction;
glass-like fracture and bullet-time motion remain relevant.

The rotary HOB must receive the gold finish indicated by the yellow arrow in
`rotary-hob-finishes.png`. The preceding iteration changed the SHAPER cutter only;
that does not satisfy the hob request. Move the P003068 Ring Switch knurling sequence
immediately BEFORE its helical shift through the gearbox, so the grip-making process
explains that motion and the existing OSHA red/blue indicator lines reveal afterward.
The revised machining presentation must require at least twice the currently viewed
scroll distance; lengthen actual tool-contact presentation, not empty approach/exit.
Retain the quarter-coverage knurl bullet time and assembly-before-finish fade order.

Complete correction contract, exact source map, current baseline, delegation guidance,
skills and eight copied reference images: [25-owner-correction-plan-2026-10-17.md](25-owner-correction-plan-2026-10-17.md).
This turn authorizes docs/reference/handoff preparation; next session is to implement
these corrections. No current visual acceptance, new commit, push, deployment or
public route cutover is inferred. Older planning/technical SHIP does not override
this visual rejection. Existing approved mechanics/handwriting/close and unrelated
work remain protected.

## Opening continuation clarification — 2026-10-10

Owner clarified the causal sequence: the model pushes intact paper upward, shatters it into shards and rises into the air. In its wake, both the drawing paper and underlying wooden desktop give way to a cavernous pit resembling steep mountain cliffs, with near-vertical fractured walls, no visible floor/bottom, and intermittent blue lightning-like bursts racing through selected wall cracks. The cavern is revealed by this passage, not by a separate pre-emergence preview.

Owner recognized September 27 `camera-pressure-2026-09-27/first-rake/` captures as the remembered angled camera treatment, then clarified that shattering and improved bulging came later. October 1 `paper-breakthrough-2026-10-01/verified-capture/desktop/` captures show the physical shatter. October 2 `portal-correction-2026-10-02/production-capture/desktop/` and its handoff document the improved model-driven pressure/rupture. Owner said the shatter-era result is closer than current output and the best found this session; the precise October 2 baseline remains a recovery candidate, not confirmed visual acceptance.

Agreed direction: selectively recover camera/pressure/rupture/emergence behavior into the current rebuild, preserving approved handwriting and other goals. Apply the pit reference's light-blue branching electrical character to all three stages: profile trace, interior enclosed-profile fracture network defining shards, and exposed pit fissures. Preserve the existing accelerating burst/hold rhythm.

Owner requested updating the handoff with this work outline, explicitly preserving other goals such as the wrench's own page. `/torque-wrench/` remains the private replacement created during implementation after formal design/structure/planning and shared-shell readiness; live cutover/archive follows acceptance and authorized publication. No date is scheduled. Existing JGUN content, completed cutter bullet time, extensible beat timeline, unlocked scroll distance and deferred additions remain unchanged. This request authorizes documentation; no implementation or publication approval is inferred. Detailed outline and image paths are in the updated temporary handoff linked from `08-next-session-handoff.md`.

Recorded 2026-10-09 (America/New_York). Source: owner's kickoff message; the supplied handoff and owner notes carry 2026-10-10 labels. These are rulings, not an implementation plan. Append subsequent rulings immediately and distinguish proposed defaults from accepted answers.

## Workspace and process

- Work only in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`. Do not edit or switch `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`; another session owns it.
- Required order: questions → research → design → structure → plan → implement. Stop after each phase for explicit owner approval. Answers do not automatically authorize the next phase.
- Phase outputs belong in `docs/torque-wrench-rebuild/`; captures belong in `project/work/evidence/torque-wrench-rebuild/`.
- Translate every Anthropic model reference in the kickoff and referenced docs into Codex terms: Haiku → Luna, Sonnet → Sol, Opus → Astra. Astra authors and approves every plan and reviews critical work; Sol implements; Luna handles mechanical work. Astra (`gpt-6-astra`, Codex surface) must approve visual effects before they count as done. Use the actual `codex-tiers` worker names/pins, which may differ from Claude Code's roles. Verify routing rather than treating requested roles as observed execution.
- Owner judges visuals using PNGs. Tests cannot override a visual rejection. No push, PR, deploy or publish.
- Every report starts with the decision needed or numerical cost with model named. Estimate tokens before expensive runs and offer the cheapest variant.

## Final decisions from kickoff and handoff §2

1. JGUN gets its own page and scroll length. Scroll length is NOT final and nothing is tied to it. The old "JGUN timings unchanged" rule is withdrawn. The owner wants a much longer scroll-to-storyline ratio and smoother flow; users currently fly past beats and must "tiny scroll" back.
2. Extensibility is first-class: beats are authored as data on a scroll-length-independent timeline. Adding a sequence must not require editing the scroll spine.
3. The owner accepted Q1: build a fresh page at `/torque-wrench/` privately using the current page as a parts source. Keep the current page live and untouched until replacement acceptance, then archive it. The strategy is accepted; actual cutover/archive remains contingent on owner acceptance.
4. Separate documents use hard navigation with a fade through dark, without a persistent canvas. Quiet Machine lives at `/quiet-machine/`; old `?study=rl300` links redirect there. The parallel session owns generic HTML entry, fade overlay, navigation and poster primitives. This track consumes them and does design only until they land.
5. M249's future page is JG-037: reserve its slot only. M249 and the JG-036 `m249-trunnion` hotspot remain offline until JG-037 ships; the split is not published before then.
6. Bullet time means subjects stopped or extremely slowed while the camera moves at normal speed and orbits/arcs around them. Input Shaft cutter slow-mo is good but incomplete: camera swings and slow-motion timing tweaks remain. It becomes the reference only when completed. Planet gear inspection and "machined after heat treat for class H7/g6 fit" are absent from the camera sequence and must be easy to add later.
7. Opening crack rhythm is fast-pause-farther-fewer-pauses, already in `src/scene/drawing/electricalScore.ts`. Colour is light blue electricity. The tunnel must be rocky/cavernous, with near-vertical walls and no visible floor or bottom; remove the circular hole and splined collar. Target: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`. The `owner-revisions-2026-10-07/after-o1b/opening-desktop-t0p9.png` look lost this quality. These source statements have not yet been verified against runtime in this session.
8. AI HDRI, depth-map shard debris and GLSL mask scan are candidates, not commitments.
9. First research item, before design: capture the tunnel at t≈.84–.98 on real hardware GL at full quality, compare PNGs with the target and record renderer/tier evidence to distinguish tier/render causes from geometry/shader causes. The 2026-10-08 captures used SwiftShader. Do not change tunnel code before the diagnostic capture.
10. JG-035 reserves GPU, builds and preview ports. Ask the owner to get them released and wait for explicit release confirmation before using those resources. No resource release has been confirmed in this session.
11. Quiet Machine decisions remain final: ~500k triangle target subject to device-named p95 at 60 fps desktop / 30 fps phone; one intake seek/detail hotspot at launch; radiator fans and v4 node renames deferred. Torque questions must not reopen these decisions.

## Sources read in required order

1. `AGENTS.md`.
2. `docs/HANDOFF-quiet-machine-2026-10-10.md`, especially final §2.
3. `docs/owner-notes-marksList-2026-10-10.md`.
4. `docs/quiet-machine-integration-design-2026-10-09.md`, §10 then §9.
5. `C:/Users/Markimus/.claude/projects/C--Users-Markimus--buzz-REPOS-jgun-portfolio/memory/torque-wrench-scroll-length-not-locked.md` (read-only; agrees with the current owner ruling and amendment).

No older memory or scroll-pin baseline overrides the current owner ruling.

## Owner correction and answers — 2026-10-09

The kickoff was written for Claude Code. All Anthropic model references in that prompt and the referenced docs must be interpreted using Haiku = Luna, Sonnet = Sol, Opus = Astra. This correction supersedes the original literal-model reading and removes the need to find an Opus/Haiku execution route. Historical source docs need not be rewritten to apply this translation.

Owner: "As far as your questions lets go with your recommendations except for Q4. This is important and must be documented. It is also up for discussion and revision at any point in time, even right now."

- Q1 accepted: fresh private `/torque-wrench/` page; current page stays live until acceptance, then archive.
- Q2 accepted as provisional: start around 2× the current JGUN-only scroll distance, tuning after visual sequences are established. Scroll length remains unlocked.
- Q3 accepted: existing JGUN content + restored opening + completed cutter bullet time. Planet inspection, H7/g6 and the three effects candidates remain later additions.
- Q5 accepted: reuse validated drawing/CAD pipeline and assets; rebuild timeline composition and camera choreography.
- Q4 rejected/replaced: the one-beat-per-two-viewports definition was oversimplified. Narrative pacing, input smoothness and cinematic motion are three distinct properties; Oryzo-like movement needs all three. No single lerp value produces it. The replacement standard remains open to discussion and revision at any time, including now.

### Required motion reference and standard

**Primary reference for "perfectly smooth scrolling": https://oryzo.ai/**. This is the owner's visual/motion reference, not a claim that its implementation or parameters have been inspected. No browser visit or reference recording has been made in this session.

The owner-authored `smooth-scrolling.md` in this folder is the canonical **Portfolio Motion Standard — Oryzo-Inspired**. Preserve it and read it before every scrolling or cinematic-motion implementation/edit. Future research, design, structure, plan, implementation briefs and reviews must link it and assess all three properties separately. The folder `README.md` is the entry point. Do not collapse this standard into a single pacing number or smoothing constant.

The standard includes:

- Variable narrative pacing, approximately 150–250vh per major cinematic beat, adapting to complexity; deliberate reading holds typically 60–120vh; coordinated sub-actions within a beat; movement, anticipation, impact and rest.
- Lenis as primary input smoothing; the owner's starting baseline is 1.1s, subject to live verification and comparative tuning. No additional 1.0s GSAP scrub delay without demonstrated benefit. Frame-rate-independent smoothing, responsive reverse/touch input and reduced motion.
- Continuous camera paths: at least C¹, target C² for ordinary transitions; spline position/look targets and controlled acceleration; stable quaternion interpolation when needed; no abrupt target, FOV, zoom, roll or velocity changes. Coordinate camera and object motion; deliberate rapid moves need designed acceleration/deceleration.
- One canonical scroll-progress value for synchronized scene effects. Pausing freezes narrative animation; reverse retraces it without discontinuities; no accumulated frame-dependent state for scroll events. Synchronize paper fracture, portal reveal, model emergence and camera movement.
- Stable 60 FPS on capable desktop hardware with adaptive quality elsewhere; frame times and frame-to-frame camera motion; slow/fast scrolling, abrupt stops and reversals; boundary-jump and motion-lag checks. Compare full-motion browser recordings against Oryzo, not isolated screenshots. PNGs remain the separate owner-review format for visual effects.
- **Do not optimize smoothness by increasing lag.** Correct discontinuous paths, scene coordination and uneven pacing first. Inspect existing Lenis, GSAP, ScrollRig, CameraRig and progress mappings before changing parameters. Preserve verified behavior and compare against a measured baseline.

These are owner requirements and provisional tuning targets, not verified measurements of this checkout or of Oryzo. The 2× starting distance is also provisional; reconcile pacing with the beat inventory during approved research/design rather than enforcing either as a locked scroll budget.

## Approval state

- Questions: Q1–Q3 and Q5 answered; Q4 replaced by the owner motion standard. Questions phase approved to advance.
- Research: approved on 2026-10-10 (America/New_York); in progress.
- Design: accepted on 2026-10-11; complete. Structure: accepted on 2026-10-11; complete. Plan: approved on 2026-10-11; in progress. Implementation remains not started or approved.
- GPU/build/preview release: explicitly confirmed by owner on 2026-10-10.
- Accepted choices and the revisable motion standard are reflected in `01-questions.md`. Stop after research for owner approval before design.

## Owner resource release and research approval — 2026-10-10

Owner, verbatim: "Gpu released" followed by "Research approved".

GPU/build/preview-resource use for the approved research is now authorized. First research item remains the full-tier hardware-GL tunnel diagnostic at t≈.84–.98, compared to the target PNG. Do not change tunnel code before capture. Research approval does not authorize design or product implementation; stop after the research report for owner approval.

## Research checkpoint — 2026-10-10

The earlier statements that GPU release and Oryzo inspection had not occurred record the state at initial intake; the subsequent owner release/approval supersedes that resource status. Hardware/full tunnel evidence and bounded Oryzo/local motion recordings now exist. See `05-research-report.md` and `06-evidence-index.md`; neither capture nor review is owner visual acceptance. Research is presented for acceptance; design approval remains pending. No new owner ruling is inferred from completion of evidence gathering.

## Owner handoff request — 2026-10-10

Owner: "write the handoff for next session. include any skills that should be used."

Save the continuation brief and skill guidance; do not infer design approval from this request. The session has released its GPU research resources and stopped preview processes. Ports 5199 and 4173 were verified free in a read-only check; future availability/reservation must be rechecked. See `08-next-session-handoff.md` for the brief location.

## Owner shutdown and wrap request — 2026-10-10

Owner: "shut down any ports this session. also stop all ports this session was using to free up GPU. then run wrap-session."

The session's port set was 5199 (dev) and 4173 (preview). Fresh checks found both free and no matching worktree research/preview processes, so no further process termination was necessary. Other sessions' services were not stopped. The canonical wrap procedure was read and applied: CLAUDE.md left unchanged because findings are already documented; local skill-debt ledger absent; a short memory update was submitted through Codex's permitted ad-hoc note path rather than editing its memory index. Existing handoff was refreshed. Scoped wrap checkpoint covers this rulings file and `08-next-session-handoff.md` only; remaining research docs/evidence are deliberately left uncommitted. No push. Design approval remains pending.

## Owner design approval — 2026-10-10

Owner clarified that the earlier “no” response was intended to reject permanently locking the design in the handoff, not to reject entering the design phase: “I approve moving on to design.” The owner also noted that later additions such as bullet time and other mini animations remain expected. Design may proceed, but it must stay extensible and must not treat the first design artifact as a permanent lock. Structure, planning and implementation still require separate approvals.

## Owner poster-rendering direction — 2026-10-10

Owner requested that poster assets be produced from high-quality rendering rather than stills captured from the runtime canvas. This applies to reduced-motion and fallback poster art; it does not replace the separate unaltered runtime PNG review path for live visual effects.

## Owner-supplied Oryzo teardown — 2026-10-10

Owner supplied `C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md` as completed Oryzo/Lusion motion research. Its findings are design input and teardown-derived candidates for later validation; supplying the document does not by itself constitute motion acceptance or authorization for structure, planning, or implementation.

## Owner background-layer concern — 2026-10-11

Owner noted that the subtle, dynamic, layered background is part of the total Oryzo experience. The torque-wrench design and structure must treat that background system explicitly rather than leaving it implied by post-processing or pointer parallax.

## Owner design acceptance and structure approval — 2026-10-11

Owner accepted the design artifact and approved continuation into the structure phase: “i approve continue.” Structure may proceed. Planning and implementation remain separately gated.

## Owner plan approval — 2026-10-11

Owner approved the planning phase: “approve plan’.” Planning may proceed. Implementation remains separately gated and blocked until the plan is accepted and the shared-shell dependency is ready.

## Owner plan acceptance and implementation authorization — 2026-10-11

Owner replied “yes” to: “Do you accept this plan and authorize implementation, beginning with Stage 0 and keeping product work gated on shared-shell readiness?” This accepts `13-implementation-plan.md` and authorizes implementation in its ordered stages. Stage 0 may proceed now; product implementation remains gated on demonstrated shared HTML/fade/navigation/poster shell readiness.

This ruling supersedes earlier pending-plan/implementation status. It does not establish shell readiness, approve numerical performance budgets, reserve shared GPU/build/preview resources, or authorize commit, push, PR, deployment, publication, cutover, or archival. Preserve the private page, existing live page, all verification gates, and protected worktree boundaries.

## Owner scoped shell integration authorization — 2026-10-11

Owner explicitly authorized ONE local merge of `quiet-machine/integration` at `9edfa552`, only if no uncommitted file would be touched and no conflict occurred, followed by `npx vitest run src/shared` and `npx tsc --noEmit`. No stash/reset/clean/switch, shared-source fixes, private-row activation, builds, browser, server, or GPU work. The V16 materials history was explicitly acknowledged as incoming, with no edits to those files.

The guarded merge succeeded as `92bafba51e66a3d0cc9ca6475e61bd2ea3ad1542`; all 90 pre-merge dirty/untracked file hashes were unchanged immediately afterward. Local shared tests passed 8 files / 233 tests; tsc exited 0 with zero diagnostics. Fresh runtime readiness and numerical budgets/verification matrix remain separately open and must not start under this scoped instruction. No further commit, push, deployment, publication, cutover, or archival authorization is inferred.

## Owner Stage 0 completion instruction — 2026-10-11

Owner instructed: “Finish Stage 0. Prepare the proposed verification matrix and numerical budgets for review, coordinate local resources, and complete the permitted readiness checks. Preserve dirty work and protected-checkout/shared-shell/V16 boundaries.” This authorizes the bounded proposal, resource coordination and functional readiness run, superseding the earlier record-only/no-readiness-run restriction for this work. It does not approve the proposed numerical budgets or authorize private-entry/product implementation under this instruction, shared-shell/V16 edits, protected-checkout access, Git mutations or publication. Existing ordered implementation authority remains recorded separately.

The [local readiness record](../../project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/local-20261011-01a12c92/README.md) records passed shared tests, tsc, scratch production build and 7/7 transitions at each of two viewports on `8945fa95`. The [matrix/budget proposal](18-stage0-verification-contract-proposal.md) is prepared for owner review; approval is still pending. No performance or private torque runtime acceptance follows from the shell run.

## Owner verification-contract approval and handoff request — 2026-10-11

Owner replied “I approve. The handoff for next session and the prompt for me to paste.” in response to the request to approve document 18's matrix and numerical limits to close Stage 0. This approves the verification contract in `18-stage0-verification-contract-proposal.md` §§2–6 and closes S0.7 and Stage 0, with the delivered-shell readiness record already passed. S0.6 remains a continuing read-at-domain-entry obligation, not an unfinished readiness gate.

Next session may proceed to Stage 1 under the existing accepted plan's ordered implementation authority. This approval is not a measured budget pass, private-page/runtime/effects/visual acceptance, complete G0–G9 closure, a permanent resource reservation, unilateral shared-shell/V16 change authority, Git delivery/publication or cross-chat messaging authority. Preserve every recorded boundary. Handoff and ready-to-paste prompt are saved as linked from `14-next-session-prompt.md`; this closeout starts no product implementation.

## Owner camera-continuity and breakthrough-priority rulings — 2026-10-16

Owner direction received 2026-10-16 (ZCode documentation session; read-only — this
records rulings, it does not authorize implementation).

**Special-sequence camera continuity.** Any special sequence that isolates a part —
currently Ring Switch and Input Shaft — must keep the camera ON PATH: no breaking away
abruptly to a new camera position as the current `/torque-wrench/` build does (the
per-beat pose cross-fade in `CameraHandoff.ts` reads as a cut). The OLD Ring Switch
sequence is the rough example of the wanted shape:

1. Assembly visible; the camera sweeps closer to the Ring Switch as it rotates and
   slides down the gearbox.
2. Assembly fades away; the camera orbits the isolated part slightly while machining
   happens. NO CUT TO A SECOND CAMERA FROM A NEW POSITION.
3. Special isolation sequences are where "Bullet Time" is implemented (subjects
   stopped/extremely slowed, camera moving at normal speed — consistent with existing
   ruling 6). A second Bullet Time location: the shattered-glass effect when the handle
   breaks through the drawing.

**Priority ruling — drawing-breakthrough sequence first.** The "model breaking through
the drawing" sequence is to be fixed BEFORE other parity/camera work. Fixes, in the
owner's terms:

- A. The "blue lightning" that traces the profile view, and the cracks that fill the
  enclosed profile, need major improvement to match the owner reference images
  (`C:\Projects\Misc\cracks.png`, `portal.png`, and the undocumented motion reference
  `C:\Projects\Misc\lightning outline.mp4`). Index: `21-owner-reference-image-index-2026-10-16.md` §A.
- B. The cavernous pit under the torn paper — Higgsfield-generated references,
  canonical target `...\blue-trace-tunnel-2026-10-03\concept-media\03-deep-tunnel-feedback.png`
  (index §B). Extends the 2026-10-10 opening-continuation ruling.
- C. "Bullet Time" effect when the model shatters the drawing view into glass-like
  shards (overlaps A/B staging; see also fresh feedback screenshot
  `Pictures\Screenshots\drawing feedback_dark-glass -shatter.png`, 2026-10-16).

Related same-day findings: the five-feature parity gap is documented in
`20-owner-parity-gap-2026-10-16.md` (callout labels, FEA presentation, rear-LCD dwell,
ring-switch port verification, pointer parallax). Fresh drawing-quality feedback
screenshots from 2026-10-16 morning are indexed in doc 21 §C
(crosshatch placement, detail circles/lineweight, detail-letter location).

## Owner corrections - 2026-10-18 (newest; wins over earlier ordering)

Recorded from the owner's message (documentation only; no acceptance inferred). Full wording, event order and status: [26-owner-corrections-2026-10-18.md](26-owner-corrections-2026-10-18.md).

- After the Input Shaft animation the camera moves to a pose like reference R9 and shows the EXPLODED gearbox next to the internal cages COLLAPSED (side-by-side vs morph is an open owner question; implementation waits for the answer).
- The Ring Switch knurling sequence moves to just BEFORE the Ring Switch traverses down the Clutch Housing: (a) shattered glass flies and the model elevates above the drawing; (b) camera swings/zooms to the Ring Switch showing the OSHA BLUE groove on the clutch housing; (c) camera moves to show the RED groove after the Ring Switch rotates 12 deg down the gearbox; (d) camera stays zoomed, all other components fade leaving the Ring Switch; (e) knurl, finish, holes fade to fresh turned aluminium and the rest of the knurling sequence plays with camera moves.
- Bullet time must improve: super-slow motion for a couple of seconds showing the rotary hob's fraction-of-a-rotation engagement with the input shaft while the camera swings locked on the knurl dies; same for the Input Shaft and shaper cutter; it first appears in the shatter-through-the-drawing sequence. The shatter bullet time is NOT implemented until the cavernous portal and blue lightning cracks are significantly improved.
- Blue lightning cracks and cavernous portal are delegated to GPT-6-Astra (brief: [27-astra-lightning-portal-brief-2026-10-18.md](27-astra-lightning-portal-brief-2026-10-18.md)). Gate: adversarial review by GPT-6.1-Sol/High; on failure Astra retries once and Gemini-4-Argon reviews with the same rubric; if that fails, STOP and alert the owner. Reviewer pass is not owner acceptance.

## Owner direction - 2026-10-18 (evening): lightning and pit "look better, still not there"
The owner viewed the Astra-retry build: improved, not accepted. Gemini-4-Argon is assigned to apply the three ranked fixes from his own review 2 (cavern/lip, web topology, lightning energy/colour, plus the .310 lip pop) and self-check them against R3/R4/R7/R8. Handoff: [29-argon-fix-handoff-2026-10-18.md](29-argon-fix-handoff-2026-10-18.md); prompt: 29-START-ARGON-PROMPT-2026-10-18.txt. Because Argon is now the author, the formal independent gate becomes GPT-6.1-Sol/High then Claude Opus 5.5/High (doc28 roster amended); a failure there stops the loop and alerts the owner. Following tasks (hob confirmation, Ring Switch relocation with >=2x machining scroll, improved bullet time, R9 camera) are sequenced in the handoff section 8. No acceptance is inferred.

## Owner correction - 2026-10-18 (later): lightning timing
The burst-pause-burst pattern around the profile view remains the goal, but the scroll from the lamp's last flicker (lights off) to the start of cracking (reference R10, the spark at the base of the air fitting) is far too long: measured .034 of the document (~2,140 px, 2.4 viewports) before the first burst. Reduce it (target <= .008) and use 3-4 crack sequences (not six) to complete the profile trace, then begin the internal web. Direction: earthquake cracks forming / ice on a thin lake cracking under weight. Measured baseline, targets and implementation constraints: [29-argon-fix-handoff-2026-10-18.md](29-argon-fix-handoff-2026-10-18.md) section 5 (Fix E). Skills guidance for Argon and reviewers: same handoff section 10 (essentially none; webgl-telemetry-verifier once for verification).
