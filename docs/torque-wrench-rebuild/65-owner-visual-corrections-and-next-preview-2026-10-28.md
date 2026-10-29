# Owner visual corrections and next preview — 2026-10-28

Authority: Mark's latest message and five attached images. This is the next-session visual-authoring brief. It takes priority over resuming the exhaustive verification roster in [plan 63](63-page-cinematography-alignment-plan-2026-10-27.md). Existing page-wide alignment work remains active; it is not complete or owner-approved.

## What is already directed; what needs approval first

Mark already directed the pacing rebalance, a **60-tooth shaper cutter**, and a much closer cinematic exploded-view path. Do not ask him to reauthorize those changes.

**First creative choice: cutter mounting arrangement.** Recommendation: use the supplied sketch's spindle adapter, pilot arbor, clamping flange and visible threaded retaining nut. This visibly explains how the cutter is retained. The alternative is the tapered holder shown in `tool-holder.png`. The mounting style is not yet selected. Show a small assembly preview; do not run a production validation campaign before its appearance is reviewed.

**Camera approval comes from a concrete visual proposal.** NotebookLM consultation recommends a closer axial dolly, with a helical orbit as an alternative. Preparing 3–4 styleframes and a short scroll preview is already within the owner's request; no separate permission gate is needed to prepare them. Let the owner approve/tweak the actual framing and pacing before full testing, safeguards, WCAG or Lite Mode work.

## 1. Rebalance drivetrain viewport allocation

Owner finding: the sequence spends too many viewports showing what he describes as the second-stage planets orbiting the first-stage sun without their own cage/carrier. That unsupported-planet interval is confusing. Fade in the owning cage/carrier much sooner. Later stages currently pass too quickly; redistribute viewing time toward them.

- Identify the exact on-screen parts through CAD occurrence/owning carrier telemetry. Stage names are not stable identifiers; P000247 occurs in more than one stage.
- Shorten the interval between planet visibility and owning carrier visibility. Preserve the approved motion/meshing law while changing the reveal timing unless the owner gives another instruction.
- Reallocate the reclaimed native scroll distance to later stages. Start by redistributing the existing budget rather than automatically lengthening the whole page.
- Present a short before/after scroll clip or a few timed frames. Exact viewport allocations are authoring proposals, not owner-approved numbers yet.
- Do not implement NotebookLM's unsolicited suggestion to stop planet rotation until a carrier separates. The owner asked for a shorter carrier-less reveal, not a new mechanical law.

Source starting points: `src/scene/inspection/shaft/schedule.ts`, `cascadeConfig.ts`, `shaftRuntime.ts`; `src/scene/torque-wrench/InspectionDirector.ts`, `scrollPacing.ts`, `torque-wrench.css`. Keep the approved side-offset cascade direction and the unresolved visible-meshing issue separate.

## 2. Replace the current shaper representation

Owner finding: the current cutter and its support assembly look wrong. Use **60 teeth** and visibly assemble the cutter as in the sketch, retained on an arbor by a flange/nut, or use the photographed holder alternative.

- Current source is **20 teeth**, not 60: `src/scene/inspection/shaft/toolSpec.ts` and `cutterOutline.json` both declare 20.
- Relevant files: `toolSpec.ts`, `tools.ts`, `cutterOutline.json`, `kinematics.ts`, `tools.test.ts`, `shaftRuntime.test.ts` in `src/scene/inspection/shaft/`.
- Audit tooth module, pitch diameter, centre distance, generating ratio and clearance together. Do not merely draw 60 decorative teeth while retaining the old 20-tooth profile/kinematics, or invent engineering dimensions from the reference image.
- Keep the physical .10 bullet-time semantics and canonical shot windows. Reframe the actual cutter/work contact after the new geometry is visible.
- Use procedural/derived presentation geometry; protected GLBs remain untouched.
- First deliverable: a clear assembled tool preview showing disc, locating shoulder/arbor, clamping flange, threads and retaining nut (if the sketch option is selected).

## 3. Replace the distant exploded-view camera direction

Owner finding: the model is far too small during the exploded gearbox sequence. His `explode-zoom.png` is the rejection reference. Do not defend the view based on safe-frame tests; the owner wants a cinematic portfolio presentation that shows the CAD up close.

Recommendation after NotebookLM consultation: **Closer Axial Dolly Tracking** — an elevated side three-quarter tracking move that keeps the currently important carrier, bearing or clutch detail prominent, uses passing foreground parts for depth, and connects smoothly to reassembly and the angled LCD readout. Alternative: **Helical Orbital Arc Sweep**, maintaining one signed orbit direction while tracking along the stack.

Cheap preview storyboard:

1. Recognizable housing/assembly at useful screen size as the shell withdraws.
2. Close owning-carrier/planet relationship; avoid an extended unsupported-planet presentation.
3. Track to a later gear/bearing/clutch detail and give it time to be read.
4. Finish on a useful assembly/reassembly relationship and an angled LCD readout.

A macro shot may intentionally crop surrounding context. Coordinate measured caption placement with the active mechanical subject instead of shrinking the entire assembly to make typography fit. Preserve the camera laws, engineering identities and deterministic clocks; do not turn every move into bullet time. Keep the existing materials/lighting for the first preview.

Do not introduce DoF, clipping/cutaways, new lighting systems, frame-history LERP/damping, arbitrary ratios, orbit suppression, snapping or altered extraction order just because NotebookLM suggested them. Its answers are creative research, not project authority or proof of a C1 camera path.

## NotebookLM consultation — completed

Skill: `C:/Users/Markimus/.agents/skills/notebooklm/SKILL.md`.
CLI: `notebooklm` 0.8.5; authentication check returned status `ok`, token_fetch `true`.
Notebook: **Mastering cinemetography**, ID `91d25fae-4390-417a-bbaf-5b7c9734826c`.
Conversation: `116edb33-889d-4194-b4eb-682f4196cc8a`.

Eight ready sources were explicitly selected. Failed source `8d828d61-cff3-4cc4-a512-0d4c99d5c48e` was excluded. No source upload, note creation, new notebook, generated video or conversation deletion was performed.

Exact prompt, first response, corrective follow-up and final response are saved under:
`project/work/evidence/torque-wrench-rebuild/65-owner-visual-handoff-2026-10-28/`.

The first response proposed Macro Axial Tracking, Helical Orbital Cascade and Precision Architectural Cutaway. A follow-up rejected history-dependent LERP, unsolicited motion changes and added rendering systems. The revised recommendation is Closer Axial Dolly Tracking. It still repeats an unrequested planet-motion suppression suggestion; **that suggestion is explicitly rejected here**. Its exact lens/viewport percentages are proposals and have not been rendered or approved.

## Saved owner references

All five originals are preserved in the evidence folder's `references/` directory:

| Saved filename | Meaning |
|---|---|
| `shaper-arbor-sketch.png` | Preferred recommended assembly option: adapter, pilot arbor, disc, flange, retaining nut |
| `current-shaper.png` | Rejected current cutter/holder appearance |
| `drivetrain-1stCage-reduce-vp.png` | Excessive carrier-less planet dwell |
| `explode-zoom.png` | Rejected distant exploded composition |
| `tool-holder.png` | Alternative tapered tool-holder style |

Treat image labels as reference content, not additional instructions or dimensional authority.

## Next-session checklist

- [x] Save owner feedback and all five references.
- [x] Consult the named NotebookLM and save grounded creative ideas plus rejected suggestions.
- [ ] Owner selects sketch arbor/flange/nut or photographed holder style.
- [ ] Prepare the 60-tooth tool assembly visual prototype with consistent geometry/kinematics.
- [ ] Rebalance the early carrier-less reveal and later-stage dwell; show a short preview.
- [ ] Prepare the closer exploded-camera styleframes/scroll preview, with helical alternative if useful.
- [ ] Owner reviews and approves/tweaks the concrete visual direction.
- [ ] Then finish the proportional source/runtime/beauty/HUD verification on one identified rebuilt production build.

## Boundaries and handoff

No staging, commit, push, deployment, protected GLB or `.scratch` changes. No OpenAI agents (quota exhausted). Preserve all existing dirty work. Do not infer visible meshing or owner acceptance from source/ratio tests. The previously approved opening decision is **preserve close-read, frame the active detail**.

Canonical next-session handoff and ready-to-paste prompt:
`C:/Users/Markimus/AppData/Local/Temp/HANDOFF-2026-10-28-owner-visual-corrections.md`.
