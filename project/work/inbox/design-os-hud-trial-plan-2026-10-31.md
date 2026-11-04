# Design OS HUD direction trial

Date: 2026-10-31  
Revision: v2, revised after the Opus 5.5 High critique; see the linked dispositions. The reviewer has not re-reviewed v2.  
Scope authority: Mark requested this plan, review and a handoff for next-session implementation. This session performs planning only.  
Execution target: A bounded, local concept trial; production HUD selection, production integration and broad Design OS adoption remain undecided.  
Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`.

## Purpose and decisions

Use Design OS to develop three quieter, model-first HUD directions that Mark can compare on the same actual JGun scene. Determine whether selected parts of the tool help this work enough to reuse on related pages.

Keep two decisions separate:

1. **HUD direction:** Which concept, combination or revision does Mark want to explore further?
2. **Tool utility:** Which Design OS capabilities were useful, which duplicated existing skills, and is the setup/maintenance cost justified?

This is a practical utility trial, not a controlled experiment proving that the toolkit causes better design. Comparing the current HUD with new concepts can support a preference, but cannot isolate the tool's contribution. Record observed benefits and effort without causal or numerical quality claims.

## Authority and read order

Read the current `AGENTS.md`, newest `TODO.md` direction, `project/README.md`, the owner policy below, this plan and its review dispositions before execution. Current owner policy outranks older session freezes and imported tool defaults.

- [Current owner policy](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md).
- [Repository review and pinned upstream sources](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/inbox/design-os-review-2026-10-31.md).
- [Cinematography skill](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/r3f-cad-cinematography/SKILL.md), especially §§2–4; measured animation spec §§5–5.4 for capture context.
- [Opus critique](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/01-opus-5.5-high-plan-review.md), [dispositions](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/02-review-dispositions.md), and [verified capture inputs](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/design-os-hud-trial-2026-10-31/00-capture-inputs.md).

This research plan stays in `project/work/inbox/` without inventing a `JG-###` approval or replacing the task queue. If a selected direction becomes production implementation, use the existing work-ID/plan/registry/TODO intake before that source work. The bounded concept trial is the receiving session's task under Mark's request.

## Boundaries

- Author capture/compositing helpers in a new, session-owned `.scratch/design-os-hud-trial-2026-10-31/` subtree. Preserve other scratch and working-tree changes. Never commit `.scratch/`.
- Keep full-resolution media and frame sequences in the Git-ignored `output/playwright/design-os-hud-trial-2026-10-31/`; its ignore rule was verified during planning. Keep durable text, manifests and the handoff in `project/work/evidence/design-os-hud-trial-2026-10-31/`. At most one curated comparison sheet belongs there; cap that sheet at 2 MB and the durable evidence folder at 5 MB, excluding existing text. Reference large local media by absolute path.
- Run all package commands and build standalone prototypes in an **external disposable workspace**, e.g. a new unique subfolder of `C:\Users\Markimus\AppData\Local\Temp\design-os-hud-trial-2026-10-31`. Verify the resolved location is outside the repo. No changes to this repository's `AGENTS.md`, global skills, task queue, production source, dependencies or lockfile. Do not launch a builder whose work directory inherits the disposable installer-generated `AGENTS.md`; pass selected upstream guidance explicitly under the owner's constraints.
- No asset regeneration; no protected GLB edits. No changes to camera paths, mechanical animation, timing, quality tier or verifier thresholds to make a concept look better.
- No push, deployment, production HUD replacement or claim of owner acceptance from this trial. Publication permissions from the owner policy are not a reason to publish concept experiments.
- A preview can simulate navigation and disclosure, but label simulations. It must not silently appear to be the functioning production app. Keep factual labels and part identities grounded in existing content; no invented numbers, awards or claims.
- Existing cinematic FAIL/deferred results remain historical facts. Do not repair them as a prerequisite for concepts or relabel them PASS.

## Owners and deliverables

The receiving parent owns source/build provenance, the scene capture, integration of the packet and communication with Mark. A builder may own the external prototype subtree. A separate critic with fresh context receives the owner brief, inputs and rendered packet, not builder reasoning or preferred-concept claims, and does not edit the builder's files. If parallel builders are useful, give them disjoint concept folders and the same frozen inputs.

Expected packet:

| Artifact | Purpose |
| --- | --- |
| `trial-log.md` | Actual commands, versions, generated-file changes, effort and failures; mark reference-only use separately from CLI execution |
| `baseline/manifest.json` | Source/build identity, viewport, state/time/progress semantics, quality tier, capture method and clean-scene method for every shared input; absolute media paths and hashes |
| `baseline/anchors.json` when needed | Stable part IDs and screen positions/visibility per captured frame, or explicit anchoring limitations if these cannot be exported |
| `brief.md` | Viewer, primary action, shared content inventory, fixed constraints, assumptions and direction hypotheses |
| `concepts/A/`, `B/`, `C/` outside the repo | Renderable standalone concepts plus rationale and intended interaction inventory; production interaction proof is deferred |
| `comparison/` under ignored output | Side-by-side images and desktop motion previews using identical inputs |
| `checks.md` and `critic.md` | Actual applicable checks and rendered critique, including missing checks and unresolved concerns |
| `decision.md` | Separate HUD/tool recommendations; Mark's response remains pending until actually given |

Prototype HTML/JS/CSS and local images are sufficient; adding React or copying the production scene engine is unnecessary. Keep the packet self-contained with local assets and legible at native size. Use a small local HTTP server on an inspected free port, recording its URL. The minimum owner-choice packet is **24 stills, one comparison sheet, four desktop clips, provenance, critique and utility notes**. Narrow clips and detailed interaction/a11y demonstrations form a later tier after direction selection; their absence is not a failure of the minimum trial. Existing essential interactions remain in the common inventory even when only their intended location is illustrated.

## Phase 0 — Resume and freeze inputs

- [ ] Re-read current owner direction and `git status` with staged/unstaged/untracked distinctions. Record current HEAD and existing drift; do not reset or clean the checkout. Inspect port ownership before starting a server. Known project ports are localhost:5199 (dev) and :4173 (preview); never terminate an unrelated server. Use `localhost`, not `127.0.0.1`, for the documented dev path. If a rebuild becomes necessary, restart the owned preview after it; do not rebuild merely to get captures.
- [ ] Offer Mark one optional direction question at the start: keep all three draft directions, add a reference, or replace one? His existing model-first/quiet direction is already valid input. If an asynchronous question is available, continue provenance/setup while allowing about two minutes to answer. No reply is not a blocker or a concept approval; proceed with the stated draft assumptions.
- [ ] Read publication evidence 74 and reconciliation evidence 73. Identify a usable actual scene source and existing capture interfaces before guessing flags or progress values.
- [ ] Fingerprint available `dist/` using evidence 74's documented algorithm and compare with `3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b`. If it matches, capture that bundle using a verified local server. If not, name the served source/build as a new local baseline and record its dirty-state provenance. Do not call it the published build or build a clean HEAD substitute. Record actual server assets as well as HEAD.
- [ ] Use the verified states as defaults: narrative scroll-fraction requests `.418` (drawing/electrical opening), `.735` (shaft inspection/FEA), `.940` (exploded drivetrain). Read actual achieved state and continuation-time metadata from the reports/runtime; these are not interchangeable clock values. Confirm each subject visually. An assembled overview is optional only after identifying its real state; never invent a progress point. Viewports: `1440×900` and `390×844`, DPR 1, matched quality.
- [ ] Capture current-HUD control and clean scene in the same session at each exact frozen state. Temporarily hide verified DOM overlays with `visibility:hidden` or `opacity:0`, preserving layout. **Never use `display:none` or DOM removal.** Record selectors/styles, verify unchanged document scroll height, canvas size, narrative state and camera snapshot before/after, then restore styles. No inpainting, subject cropping or synthetic geometry. See capture-inputs for the existing seek interface and quick-mode limits.
- [ ] For desktop motion, choose an 8-second segment containing a meaningful HUD/scene transition. State an assumed input rate (default **one native viewport per second**) and derive narrative progress through the existing documented mapping; do not linearly substitute an inspection clock. Label it representative scroll playback at this assumed rate, not a canonical human speed or an owner readability verdict. The deterministic dual-clock contract is progress-based; do not add wall-clock animation to the source scene.
- [ ] Use a trial-only helper to seek a frame sequence at **24 fps**, capture browser-rendered clean and control frames at identical states, and encode four desktop clips with the locally available encoder. Verify `ffmpeg` availability first rather than trusting the reviewer's environment observation. Time the first ten seeks and estimate the full sequence before committing to it. Keep encoding/crop/fps matched and record dropped/failed frames. If predicted capture exceeds 30 minutes, shorten to 4 seconds at the same rate/fps; if still infeasible, finish the still packet and mark the motion tier and full minimum trial partial. Do not install a media suite or claim a real-time recording from discontinuous seeks.
- [ ] Export existing projected part-anchor coordinates and visibility, keyed by frame/state and stable part ID, for any concept using attached labels/reticles. Inspect the actual runtime/projection interface rather than inventing a telemetry field. Use identical anchor tracks across concepts. If export is unavailable, record that limitation in the brief and critic packet: evaluate global chrome/composition only, show intended part-information access, and explicitly exclude comparative claims about moving anchored callouts. The unchanged full-HUD control remains visible as reference; do not silently strip its features to make concepts win.
- [ ] Write the shared manifest and content inventory before concept work. Confirm scene images/media, fonts and capture provenance are available to every builder.

If clean capture or a reproducible scene is unavailable, record the concrete failure and use verified existing frames only when their UI status and provenance are clear. If only HUD-baked frames exist, do not overlay another HUD on top and call it a fair comparison; obtain clean captures or deliver a clearly incomplete trial with the blocker. A missing motion capture is an explicit deferred motion review, not a fabricated pass.

## Phase 1 — Exercise the tool in isolation

- [ ] Pin upstream reference to commit `369b04155c7e1b8503b8a0ef676ce168d81e5a2e` and package candidate `ease-design@0.6.2`. Inspect Node version (`>=20`) and package help/manifest. Verify that the package contains the required designer materials; record any difference between the published package and pinned source. Do not assume they are byte-identical.
- [ ] In the external disposable folder, set process-scoped `EASE_DESIGN_HOME` to its own tool-state subdirectory and preserve/restore the previous value. Keep every CLI input artifact there too: auto-record resolves ownership from the artifact, not only cwd. Record before/after directory listings. Candidate commands are `npx.cmd --package=ease-design@0.6.2 ui --help`, followed by `ui init --runtime codex` through that same pinned invocation. Resolve actual flags from help/schema. Do not use the README's unverified `@easestart/design-os` package name.
- [ ] Inspect and save the generated manifest and `AGENTS.md` block from that disposable folder. Supply our project constraints explicitly to the builder; do not let generated routing overwrite the parent session's instructions.
- [ ] Read only the applicable upstream designer/concepts, page-structure and critique material. Project composition and brand choices take precedence over axonometric, monochrome and persona defaults. Track the upstream modules actually used.
- [ ] Keep the pre-template owner brief, then record which upstream concept fields actually changed it and why. Assess the concept template and critic workflow independently of CLI installation success.
- [ ] Stop installation troubleshooting after about 30 minutes or two substantive failed attempts, including browser setup for `look`. Reuse an existing browser if available; skip `look` rather than installing a browser just for this trial. Report the failure, preserve diagnostics, and continue a **reference-only** concept exercise if the pinned materials are readable. Label CLI utility UNVERIFIED; a reference-only result is not a successful CLI adoption trial. Never substitute an unpinned latest release to obtain a green run.

Before using package commands, check their documented filesystem effects. Keep project/cwd and tool home/cache settings explicit where supported; normal package caching is acceptable, but do not initialize global routing or silently modify shared design memory. If isolation cannot be established, skip that command and record why.

## Phase 2 — Build three comparable directions

- [ ] Translate the owner's brief into one common content and behavior inventory: page identity, chapter/state cue, optional part context, essential navigation, disclosure behavior, and discreet WIP label. Essential functions may move or disclose progressively; each concept must show where they went. Use actual current content rather than adding dashboard telemetry.
- [ ] Write the upstream concept fields for each direction: surface/reader, one primary action, macrostructure, existing-system versus exploration mode, data provenance, states and widths. Distinguish owner facts from agent assumptions.
- [ ] Use the following as starting hypotheses, changing them if the brief supports better alternatives: A Museum caption (restrained edge caption with details on demand); B Technical margin (slim editorial rail); C Minimal transport (compact progress/navigation with contextual labels). Differences must involve composition and information behavior, not just palette or font.
- [ ] First render all three over the exploded frame at both sizes, with control images alongside. Confirm all three remain distinct and the model is central before making the full packet. No owner pause is required merely to finish comparable concept previews.
- [ ] Apply each direction to all three frozen states at both sizes: **18 concept stills plus 6 control stills**. Use the same content, scene pixels, crop, quality and state in each comparison. Annotated sheets supplement native-size images.
- [ ] Illustrate intended disclosure/navigation placement and one long actual label in the static concepts. Clearly label any clickable simulation; detailed keyboard/focus/loading/error/reduced-motion interaction demonstrations are deferred until a direction is selected. The static images are the non-moving fallback for this comparison.
- [ ] Composite every direction over the shared **desktop** segment, plus the original control: **3 concept clips plus 1 control clip**, using Phase 0's same frame sequence and assumptions. Reuse one compositor/overlay implementation. Narrow motion clips are deferred; record that mobile motion is unverified and never claim mobile interaction acceptance from stills.

Budget guidance: one initial pass, then at most one focused revision per direction. Allow roughly **3–5 focused hours plus critic latency**, with a four-hour checkpoint: 30 minutes maximum tool setup, about 45 minutes capture/preflight, then concept/compositor work and review. Do not promise the whole packet in 90–120 minutes. Produce the initial comparison sheet early. If the minimum packet cannot be finished, deliver the useful still-only/partial packet with explicit missing items; do not cut evidence silently or start a broad camera repair campaign. Optional tiers need a clear benefit and remaining budget.

## Phase 3 — Check and critique

- [ ] Confirm expected files/media load and framing at both named viewports. Check console errors and overflow in the standalone page. Record exact commands and widths; no production interaction/a11y completion claim is in scope.
- [ ] Run at least one applicable upstream static check on the standalone entry files, entirely in the external project. Save command/version/exit/findings and classify true positives, false positives and unresolved style disagreements with reasons. Do not apply the check to the Vite SPA shell and claim app coverage. Resolve genuine functional defects in the trial; imported taste rules are not owner policy or production release gates.
- [ ] Use upstream `look` only after checking its local-asset/browser contract and existing browser availability. Its default widths differ from ours; explicitly request `390,1440` where supported and record its measured heights. Use a host-browser capture for exact 390×844 and 1440×900 comparisons; `look` sheets are supplementary. If it cannot run, record upstream LOOK unavailable. Neither route proves a running R3F scene's mechanics.
- [ ] Ask the fresh-context critic to inspect native-size outputs, then representative-rate desktop clips. For each direction, state what the viewer sees first, which controls are discoverable from the shown state, whether active geometry is obscured, how mobile reflows, and the visual tradeoff. Cite image/state/viewport; exclude anchored-motion comparisons if anchor data is missing. No unsupported taste scores or mobile-motion verdicts.
- [ ] Keep existing cinematic failures/deferred results distinct from prototype defects. Do not run the full six-case mechanical verifier merely to compare static HUD concepts. `verify-torque-camera-hud.mjs --quick` is capture-only and never PASS evidence.
- [ ] Answer four utility questions: (1) Did the template materially change the initial brief, with a before/after example? (2) Which lint/LOOK findings were true/false positives or unverified? (3) How many minutes went to setup, capture, design and revision? (4) Which existing skills duplicate or complement it, by name—at least `r3f-cad-cinematography`, `r3f-scroll-performance-guard`, `gsap-scrolltrigger`, and the existing design/motion roster? Recommend the smallest useful subset. Tool contribution is observed or builder-assessed; a new HUD winning over the provisional control is not proof of toolkit superiority.

## Phase 4 — Present and stop at the owner decision

- [ ] Present the comparison sheet first, then native-size views and desktop clips. Present the directions neutrally, with one short explanation each; show the preferred candidate as a recommendation, not the owner's choice. Provide the local renderable prototype and media paths with all deferred tiers named.
- [ ] Summarize tool utility separately: reuse selected modules, keep reference-only, or decline adoption, with evidence and limits. Avoid framework-wide installation on the strength of one trial.
- [ ] Save `decision.md` with `HUD direction: awaiting Mark` and `Tool utility: provisional recommendation` unless Mark has actually responded. Retain critic findings and actual check failures.
- [ ] Update this plan's checkboxes from actual evidence and leave a continuation note. Finish the bounded trial before asking Mark to choose. Large production integration begins only after that direction is selected and its scope is agreed.

## Completion criteria

The **minimum concept trial** is complete when three distinct concepts, 24 shared-state stills, the comparison sheet, four desktop clips, provenance, applicable checks, fresh-context critique and the explicit utility assessment exist and are reviewable. If anchoring is unavailable, completion is limited to global chrome/composition and must say so. Mark's selection can remain pending. If a required artifact is absent, report **partial trial** with the missing item and reason; a still-only preview may still support a provisional visual discussion. Narrow motion and detailed interaction/a11y demonstrations are explicitly deferred, not required to complete this minimum, and not implicitly accepted.

No unit tests are needed for this planning document or disposable static mockups. Add a targeted test only if a new meaningful reusable function warrants it. Production source changes are outside this plan; if later authorized, use affected tests, typecheck/build and focused runtime smoke under the owner policy.

## Current preparation status

- [x] Reviewed upstream repository and selected implementation; saved source-linked assessment.
- [x] Re-read live owner policy and task-intake boundaries; checked dirty state.
- [x] Drafted the bounded trial plan.
- [x] Obtained Opus 5.5 High critique and recorded dispositions.
- [x] Revised plan after critique.
- [x] Saved next-session handoff with paste-ready prompt.
- [ ] Trial minimum is partial: the comparison packet exists, but the independent critic could inspect only sampled clip frames, not continuous representative-rate playback. Owner direction remains pending.

Review artifacts and handoff: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\evidence\design-os-hud-trial-2026-10-31\`.

## Revision and execution notes

2026-10-31: v1 reviewed by the requested `anthropic/claude-opus-5-5` / `high` subagent, verdict **revise before execution**. v2 incorporates motion capture mechanics, anchor fairness, tiered deliverables, actual states, layout-preserving suppression, concrete fingerprinting, external CLI isolation, utility questions and optional owner intake. The original review's line numbers refer to v1; use its section titles and the dispositions against v2. This is parent revision after critique, not a fresh Opus approval. Append dated execution notes and preserve actual failed/skipped checks next session.

2026-10-31 execution: Mark chose to retain the three proposed concepts for comparison. The trial produced 18 concept and six control stills, a sheet, four desktop clips, a matched capture manifest, static checks and an independent critique. Detailed results and precise limitations are in [capture](../evidence/design-os-hud-trial-2026-10-31/03-capture-baseline.md), [tool](../evidence/design-os-hud-trial-2026-10-31/04-tool-trial.md), [brief](../evidence/design-os-hud-trial-2026-10-31/05-concept-brief.md), [checks](../evidence/design-os-hud-trial-2026-10-31/06-comparison-checks.md), [critic](../evidence/design-os-hud-trial-2026-10-31/critic.md), and [decision](../evidence/design-os-hud-trial-2026-10-31/decision.md). The initial checkboxes above are the original execution checklist, not independent claims that every optional item ran; use the linked evidence for actual outcomes. Concept clips use static Inspection overlays; moving anchored-callout and narrow-motion comparisons remain unverified. The builder did not use the upstream concept template, and setup/design durations were not instrumented. LOOK was not run. The HUD direction awaits Mark; production integration and broad adoption are not authorized by this trial.

Minimum status: **partial**. The critic inspected frames sampled from all four clips, but could not view continuous 24 fps playback through its available interface. Continuous perceptual motion critique is the remaining minimum-trial check; the clips are available to Mark now. No mobile motion, moving anchored-callout, full interaction, accessibility or owner-acceptance verdict is implied.
