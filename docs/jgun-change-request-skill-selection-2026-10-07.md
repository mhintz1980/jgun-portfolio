# JG-035 change-request skill selections — October 7, 2026

Status: **approved by Mark on October 7, 2026** ("i approve the lists. contirue"). Opus 5.5 returned **AGREE WITH CHANGES**; the selections below incorporate his completed review and the parent's source verification. Execution details are in [the next-session implementation plan](jgun-owner-animation-revision-plan-2026-10-07.md). No skills have been installed and no application source has been changed for this review.

## Approved selections

- **List A, upstream:** core — `gsap-scrolltrigger`, `threejs-shaders`, `threejs-geometry`, `playwright`; conditional — `gsap-timeline`, `gsap-plugins`, `threejs-materials`, `review-animations`.
- **List B, Master Library:** core — `improve-animations`, `build-threejs-scroll-worlds`, `cad-scene-graph-rigging`, `threejs-shaders`, `threejs-geometry`, `webgl-telemetry-verifier`, `r3f-scroll-performance-guard`.
- **Nine distinct core skills across both lists.** Load them only for their named work, not all at once. The duplicated shader and geometry entries are the same skills.
- **Installations recommended: none.** Four vendor references match upstream byte-for-byte; read the existing local copies. The SVG-plugin skill remains an optional upstream reference, not an installation request.
- **Review:** [completed Opus 5.5 review and serving receipts](jgun-change-request-skill-review-opus-2026-10-07.md).

## Owner request and image review

Source: [attached change requests](<C:/Users/Markimus/.codex/attachments/3da411fa-8a0a-44df-85a9-0a4f0e49b1e0/Pasted text.txt>). The attachment remains the authoritative wording.

| ID | Requested result | Reference observations |
|---|---|---|
| O1 | Light-blue electrical profile cracks advance in bursts and pauses, accelerating and branching inside the profile near completion; revise the cavernous opening. | [portal.png](C:/Projects/Misc/portal.png) shows jagged rupture edges and luminous depth; [cracks.png](C:/Projects/Misc/cracks.png) shows irregular branching. Use geometry only, with the owner's blue color. |
| O2 | Replace sticky notes with handwriting directly on the drawing: Detail B sun-gear circle/arrow, failure-point note, red crossed-off material options, circled rotary-hobbing choice; matching output-shaft FEA/C300/52–54 HRC note near its drawing view. | Anchors must identify the correct drawing features; lettering, circles, arrows and strike-throughs form one authored annotation. Preserve the distinction between input-shaft and output-shaft material notes. |
| O3 | Extend the close camera sweep by several seconds or more to cover the notes; consider a semi-transparent handwriting view over the main camera view. | The secondary camera layer is a proposed treatment in the request, to evaluate during planning rather than assume as a second renderer. |
| O4 | Personalize title/revision blocks with Mark Hintz, Digital Systems Architect, and Myers-Seth Pumps, Special Tool Solutions and Black Creek Precision roles; propose suitable additional fields. | Copy and visual hierarchy should fit the drawing and preserve the owner's career details. |
| R1 | Fade drilled holes closed before knurling tooling arrives; reopen after knurling and before the transition back to black finishes. | Temporary concealment must blend with the OD; restore the original holes and finished part. |
| R2 | Knurl the complete intended outer band. | [Ring Switch-Knurl-miss.png](<C:/Projects/Misc/Ring Switch-Knurl-miss.png>) marks a strip across the face at 8.0/12.0 s. The image establishes the visible defect, not its cause. |
| S1 | Put the button cutter to the viewer's right beside the shaft at similar camera depth, exposing tooth engagement and travel into the undercut. | Tune camera and cutter placement together; preserve cutting contact and mechanical geometry. |
| S2 | Show undercut-local FEA-style colors, left model/study information and right FOS bar. Use approximate retrospective FOS values below 1.0 for all attempted materials, ordered 4140 < 4340 < C300; revised hobbed shaft uses blue shades. | [FEA reference](<C:/Projects/Misc/Example of FEA of prototype part using 4340 Heat Treated to 48-53 Hrc.analysis.jpg>) shows a localized warm hotspot near the shoulder/fillet, blue elsewhere, model metadata on the left and a blue-to-red FOS legend on the right. Modify Model Name to Input Shaft. The owner explicitly does not want an on-screen disclaimer. |
| S3 | Repair input-shaft body artifacts. | [1.3 s](<C:/Projects/Misc/input shaft artifacts-1.png>), [10.9 s](<C:/Projects/Misc/input shaft artifacts-2.png>) and [25.4 s](<C:/Projects/Misc/input shaft artifacts.png>) show discontinuities, streaks and overlapping-looking surfaces. Yellow is the owner's defect markup, not a requested material. Diagnose geometry, normals, depth and transition state before selecting a repair. |

All seven referenced images were opened and reviewed. Screenshots establish appearance; runtime telemetry and geometry checks must establish implementation causes and correctness.

## List A — upstream OpenAI and other repositories

The current OpenAI curated catalog was fetched with the activated skill-installer's `scripts/list-skills.py --format json`. The following upstream SKILL.md sources were then read; installation status was checked against both Codex and shared agent skill directories.

| Priority | Skill and authoritative source | Use in planning or implementation | Local status |
|---|---|---|---|
| Conditional | [gsap-timeline — GreenSock](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-timeline/SKILL.md) | O1–O3/R1: sequencing reference for burst/pause timing, labels and coordinated fades. Use only where helpful to the actual GSAP authoring; the existing deterministic samplers remain authoritative for their scenes. | Existing Master Library copy matches upstream; reference only. |
| Core | [gsap-scrolltrigger — GreenSock](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-scrolltrigger/SKILL.md) | O3: extend the drawing sweep and remap camera/annotation windows while preserving forward/reverse scroll and station navigation. | Already installed; reuse the project-designated copy. |
| Core | [threejs-shaders — CloudAI-X](https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-shaders/SKILL.md) | O1/R1/S2: render authored reveal masks, electrical light, surface fades and localized stress colors. R2 shader work applies only if geometry/telemetry diagnosis identifies the mask or shader as the cause. Check the installed Three.js version. | Existing Master Library copy matches upstream; reference only. |
| Core | [threejs-geometry — CloudAI-X](https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-geometry/SKILL.md) | R1/R2/S3: inspect mesh topology, normals, cylindrical seams, temporary hole-fill geometry and overlapping transition surfaces. A diagnosis reference, not a predetermined geometry fix. | Existing Master Library copy matches upstream; reference only. |
| Core | [playwright — OpenAI](https://github.com/openai/skills/blob/main/skills/.curated/playwright/SKILL.md) | Verification: use existing project harnesses first; capture the exact ring/shaft times, UI legends, restored narrative and desktop/narrow/reduced cases. Pair with house WebGL telemetry. | Already installed. |
| Conditional | [review-animations — Emil Kowalski](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/SKILL.md) | Final craft review of rhythm, reading time, interruption, reversal and overlays. Owner-authored machining stories and crack pauses govern their durations; generic microinteraction duration rules must not replace them. | Already installed in the shared agent directory. |
| Conditional | [gsap-plugins — GreenSock](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-plugins/SKILL.md) | O2: DrawSVG/CustomEase reference if handwriting uses code-native SVG strokes. DrawSVG cannot reveal WebGL linework; do not add plugins when the current path sampler already does the job. | No installation selected; read upstream only if that rendering choice needs it. |
| Conditional; diagnostic reference | [threejs-materials — CloudAI-X](https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-materials/SKILL.md) | Load at S3 diagnosis start to check depth, transparency, normal visualization and material transitions; also R1/O3 if those mechanisms are involved. This is an investigation checklist, not an established cause. | Existing Master Library copy matches upstream; reference only. |

OpenAI `playwright-interactive` was considered and excluded from the active recommendation: its upstream skill requires `js_repl`, which is absent from the current tool surface. `cua_repl` is a different API and is not a drop-in substitute. Deployment, Figma, ChatGPT-app, image-generation and generic site-redesign skills do not address these existing CAD/WebGL edits closely enough to add them here.

## List B — local Master Skills library

The local library was searched through `skill-find` / its generated index by a read-only research agent. Selected source paths were checked directly. This list adds the house planning/composition knowledge and identifies local copies of upstream references; a duplicate name is one skill, not a second installation.

| Priority | Master skill and exact source | When it helps | Preferred execution copy |
|---|---|---|---|
| Core | [improve-animations](C:/Projects/skills-master/local/improve-animations/SKILL.md) | After list approval: inspect the affected motion and prepare precise, self-contained execution specifications for the accepted requests. Keep its audit bounded to these requests. | `C:/Users/Markimus/.agents/skills/improve-animations/SKILL.md` |
| Core | [build-threejs-scroll-worlds](C:/Projects/skills-master/local/build-threejs-scroll-worlds/SKILL.md) | Planning the extended drawing camera, note-reading dwell, rupture/tunnel composition and possible layered handwriting view; later camera/framing implementation review. Apply to the existing world, not a full rebuild. | `C:/Users/Markimus/.agents/skills/build-threejs-scroll-worlds/SKILL.md` |
| Core | [cad-scene-graph-rigging](C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md) | R1/R2/S1/S3: preserve CAD part identities, primitive boundaries and transform spaces when repairing geometry and positioning tooling. | `C:/Users/Markimus/.agents/skills/cad-scene-graph-rigging/SKILL.md`, checked against the measured architecture spec. |
| Core; same as A | [threejs-shaders](C:/Projects/skills-master/vendor/openmontage-skills/threejs-shaders/SKILL.md) | O1/R1/R2/S2: local shader reference for masks, electrical light, knurl and heat colors. | Choose one reviewed source; do not load both local and upstream copies. |
| Core; same as A | [threejs-geometry](C:/Projects/skills-master/vendor/openmontage-skills/threejs-geometry/SKILL.md) | R1/R2/S3 and any rupture mesh edits: source geometry, normals/indices/UV continuity and preservation of named CAD parts. | Choose one reviewed source; do not load both copies. |
| Core | [webgl-telemetry-verifier](C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md) | Verify cutter position/contact, complete ring coverage and the shaft frames at 1.3, 10.9 and 25.4 s; combine telemetry with pixel/visual checks. | `C:/Users/Markimus/.agents/skills/webgl-telemetry-verifier/SKILL.md`, checked against the measured architecture spec. |
| Core | [r3f-scroll-performance-guard](C:/Projects/skills-master/local/r3f-scroll-performance-guard/SKILL.md) | O1/O3/R1/S2: synchronize sampler and uniform updates, preserve the shared frame/scroll clock, and budget any new render layer. This guards how R3F consumes scroll state; it does not create a second scroll driver. | `C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md` |

Local conditional references: [gsap-timeline](C:/Projects/skills-master/vendor/openmontage-skills/gsap-timeline/SKILL.md) and [threejs-materials](C:/Projects/skills-master/vendor/openmontage-skills/threejs-materials/SKILL.md) overlap List A; use a single chosen copy. The installed `glsl-transition-shader-pipeline` applies if diagnosis or implementation touches the existing `CadTransitionShader`, its transition spaces or its state restoration. A ring finish fade alone does not establish that this particular shader is involved.

The local vendor carrier is [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage); its local provenance does not record the original repository URL for every individual skill. List A supplies verified upstream source paths for the duplicated Three.js/GSAP names.

Copy drift was verified between the Codex and shared-agent CAD/telemetry skills: the `.codex` copies retain older gear-turn tables, while the `.agents` tables match the current measured `project/context/architecture/animation-spec.md` values. The selected execution paths above are therefore the `.agents` copies. The later plan must pin those paths and recheck any numerical camera/rig claim against measured project reality. Do not synchronize or change the skill library as part of these animation requests.

Verified selected-copy SHA-256 prefixes: CAD rigging `.agents` `2961cb237e5b`; WebGL telemetry `.agents` `41896b4cbe13`. Byte-identical upstream/local vendor reference prefixes: `threejs-shaders` `6702267bd3ee`, `threejs-geometry` `8337bcf86621`, `gsap-timeline` `1a8b0f39cc4b`, `threejs-materials` `d5846d1b8254`.

No selected skill supplies a complete branching-fracture algorithm, FOS-to-color mapping, engineering FOS results or authored handwriting/title-block content. Those are project decisions and implementation work. The owner explicitly authorizes approximate retrospective FOS values and no on-screen disclaimer; preserve that requirement without presenting those values as a newly performed solver result. The future plan must choose how handwritten strokes and the FOS legend render and track their drawing/shaft features; it must not invent new legend features or merge the two shafts' material notes.

## Existing project companions

The CAD-rigging, R3F-performance and WebGL-telemetry skills are core in List B. `asset-and-bundle-hygiene` remains conditional if geometry/assets or the preview build change. `orchestration` governs disjoint ownership and review. `handoff` will be used after the approved plan is written, as the owner requested. Existing project rules, including reduced-motion posters, remain applicable; this selection pass does not revise them.

The latest implementation handoff already records the desktop full-to-lite opening failure. Later verification must retain that baseline and distinguish new regressions from it. These skill selections do not waive the existing G6 failure or owner visual acceptance.

## Independent review

**Completed: Opus 5.5, AGREE WITH CHANGES.** Both requests returned HTTP 200 and response-body model `anthropic/claude-opus-5-5`; the completed review ended normally. GPT-6 Astra fallback was not needed. [Full review and response receipts](jgun-change-request-skill-review-opus-2026-10-07.md).

Accepted changes: promote the R3F guard to core; make GSAP Timeline and the final craft review conditional; begin missing-knurl-strip diagnosis with geometry/telemetry; identify the authored handwriting and FOS-mapping work explicitly; deduplicate references and install nothing. Source checks resolved the reviewer's ScrollTrigger question: the live `ScrollRig.tsx` registers ScrollTrigger, drives global/chapter state, and synchronizes Lenis through `gsap.ticker`, so ScrollTrigger remains core for O3. The reviewer corrected his initial clock-ownership interpretation and withdrew an unrequested moving-indicator suggestion in the completed review.

## Approval and continuation

Mark approved both lists on October 7 and instructed continuation. The [implementation plan](jgun-owner-animation-revision-plan-2026-10-07.md) covers every request, proposed title/revision-block copy, file ownership, skill activation by phase and concrete verification. Implementation is reserved for the next session, as requested.
