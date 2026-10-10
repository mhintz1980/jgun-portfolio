# Torque wrench rebuild — owner rulings

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
- Design, structure, plan and implementation: not started or approved.
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
