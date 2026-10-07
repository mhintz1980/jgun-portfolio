# Opus 5.5 skill-selection review — October 7, 2026

This read-only review received the exact owner change requests and both draft skill lists, with the parent's observations from all seven referenced images. The reviewer did not independently inspect local files or images; the parent subsequently verified the source/copy facts recorded below.

## Serving evidence

Both requests used the existing loopback opencodex endpoint `/v1/chat/completions`; no provider settings were changed.

Attribution is from the directly captured endpoint response bodies. A filtered proxy-log query returned no rows, so no separate proxy-log attribution is claimed.

- Initial request: HTTP 200; response ID `chatcmpl-e0e7ee7a3bb94f8498aa1302`; response-body model `anthropic/claude-opus-5-5`; finish reason `length`. The output limit cut off the omissions section. Preserved below as the initial review, not a complete final verdict.
- Completion request: HTTP 200; response ID `chatcmpl-736ac771d1ef40e8925fb74e`; response-body model `anthropic/claude-opus-5-5`; finish reason `stop`. This supplied the missing section and reconciled newly verified source facts. Opus was available; GPT-6 Astra fallback was not used.

## Completed review and reconciled verdict

## Remaining omissions (carry into plan; no new skills)

1. **FEA overlay.**
   - Decide early whether the legend renders as DOM or in-scene. This affects z-order with the O3 overlay and reduced-motion behavior.
   - Keep the request's content: Model Name: Input Shaft, left study block and right blue-to-red FOS bar.
   - Use approximate retrospective values with 4140 < 4340 < C300, all below 1.0 at the undercut. The hobbed revision uses blue shades.
   - Show no disclaimer.
   - **Correction:** I withdraw the earlier moving-indicator suggestion. It was not requested.
2. **Handwriting rendering.** No skill covers this choice: SVG/DOM strokes versus WebGL linework or texture.
   - Under the moving camera, anchors must stay on the Detail B sun gear, the failure point and the output-shaft view.
   - Keep the input-shaft and output-shaft material notes distinct.
   - Choose the rendering path before activating gsap-plugins.
3. **Electrical bursts (risk only, not a gate).** Avoid rapid full-field, high-contrast light-blue flashing, and give reduced-motion users a calmer reveal.
4. **Title/revision copy.** This is authored content. Check that it is legible at the extended sweep's closest camera distance.
5. **Timeline extension.** Extending O3 shifts downstream chapter offsets. Re-verify forward/reverse scroll, station navigation and R1 timing against the transition to black.

## Corrections from new facts

- **gsap-scrolltrigger: restored to core for O3.** ScrollRig.tsx confirms that ScrollTrigger authors the scroll state, with Lenis and gsap.ticker synchronized to it. My earlier "two scroll authorities" concern does not apply.
- **r3f-scroll-performance-guard: remains core, with a narrower role.** It provides synchronization and budget guidance for how R3F consumes the ScrollTrigger state. I retract my claim that it owns the clock.
- **gsap-timeline: conditional reference.** It applies to burst/pause sequencing principles but does not add a second timeline.
- **Duplicates resolved.** The local copies of threejs-shaders, threejs-geometry, gsap-timeline and threejs-materials match upstream byte-for-byte. Use one exact local path each and install nothing.
- **CAD and telemetry skills.** Use the `.agents` copies, which match the canonical animation-spec.md. Do not use the `.codex` copies, and make no library writes.

## Final verdict: AGREE WITH CHANGES (minor)

- **Core:**
  - cad-scene-graph-rigging (`.agents`)
  - threejs-geometry
  - threejs-shaders
  - build-threejs-scroll-worlds
  - gsap-scrolltrigger
  - r3f-scroll-performance-guard
  - improve-animations (planning, limited to these requests)
  - webgl-telemetry-verifier (`.agents`)
  - playwright
- **Conditional:**
  - threejs-materials: load first during S3 diagnosis.
  - glsl-transition-shader-pipeline: likely needed for R1/S3.
  - gsap-timeline: reference only.
  - gsap-plugins: only for SVG handwriting.
  - review-animations: final pass, subordinate to owner timings.
  - asset-and-bundle-hygiene: only if assets or the build change.
- **Installations:** none.
- **Packet wording to fix:**
  - R2 should be a geometry/telemetry diagnosis before any shader work.
  - O1's branching logic and S2's FOS mapping should be stated as authored project work.

With these edits, the lists are ready for approval and planning.

## Initial review (preserved; superseded where corrected above)

# Verdict: AGREE WITH CHANGES

Both lists target the right problem areas: motion timing, shaders, geometry, CAD identity and verification. Five problems need fixing before approval:

1. The GSAP skills may not fit the project's architecture.
2. The clock and transition guards are under-ranked.
3. Duplicate copies of the same skill are unresolved.
4. Some coverage claims overstate what a skill provides.
5. There are gaps in handwriting, the FEA legend and flash safety.

## Final core set (one copy each)

| Skill | Role |
|---|---|
| cad-scene-graph-rigging | R1/R2/S1/S3: part identities, transforms, cutter placement |
| threejs-geometry | R1/R2/S3 diagnosis: seams, normals, overlapping surfaces |
| threejs-shaders | O1 crack masks and glow, R1 fade, S2 stress colors |
| build-threejs-scroll-worlds | O1 tunnel, O3 extended sweep and overlay composition, S1 framing |
| r3f-scroll-performance-guard | **Promote to core.** O1, O3, R1 and S2 all change scroll and frame timing, and the overlay may add a render pass. This skill owns the single clock the packet says must not be duplicated. |
| improve-animations | Planning only, limited to these requests |
| webgl-telemetry-verifier + playwright | Telemetry plus pixel proof at 8.0/12.0 s (ring) and 1.3/10.9/25.4 s (shaft), legends and reduced-motion cases |

## Conditional set

- **gsap-timeline: demote from core.** The packet itself says to apply its principles to the existing deterministic samplers. A burst-and-pause schedule is a simple keyframe table that improve-animations can specify. Load gsap-timeline only if GSAP actually drives these sequences.
- **gsap-scrolltrigger: demote from core.** Keep it only if ScrollTrigger is confirmed as the live scroll driver for the drawing station. If r3f-scroll-performance-guard owns the clock, two scroll authorities create a timing conflict.
- **gsap-plugins:** only if handwriting is drawn as SVG/DOM strokes.
- **threejs-materials: first-line conditional.** The S3 streaks and overlapping-looking surfaces, the R1 transparency and the O3 semi-transparent layer all point toward depth, transparency or polygon-offset issues. Load it at S3 diagnosis start rather than "if implicated."
- **glsl-transition-shader-pipeline: likely needed, not remote.** R1 requires the holes to be fully back before the transition to black finishes, and S3 explicitly suspects transition state. Activate it if diagnosis touches `CadTransitionShader`, and expect that it will.
- **review-animations:** final review only, subordinate to improve-animations. Its generic duration rules must not override the owner's pause rhythm or machining timing. It overlaps improve-animations, so it is optional rather than core.
- **asset-and-bundle-hygiene:** only if assets or the build change.

## Removals and reclassifications

- **Duplicates:** threejs-shaders, threejs-geometry, gsap-timeline and threejs-materials each count once.
  - Diff the local OpenMontage vendor copy against the verified upstream path.
  - If they match, use the local copy and install nothing.
  - If they differ, record the chosen path and reason.
  - The local vendor provenance is incomplete, so upstream is the reference of record.
- **Skill value vs installation:** "New candidate" should not mean "install." Every List A candidate except gsap-plugins already has a local equivalent. Recommend no installations for this work; reference only.
- **Copy drift (CAD/telemetry):** "Preferred execution copy = shared-agent" is premature while drift is unresolved.
  - Diff the two copies, name one exact path and its date or hash in the plan.
  - Keep the architecture-spec override rule.
  - Do not sync the library as part of this work.
- **playwright-interactive:** exclusion agreed.

## Misleading coverage to correct in the packet

- **R2 under threejs-shaders:** The un-knurled band may be a UV seam, an angular range or a geometry gap, not a shader defect. Treat it as a geometry and telemetry diagnosis first.
- **O1:** No skill provides the burst/pause/branching algorithm or the "cracks proliferate inside the profile" rule. This is authored project logic. Shaders only render it.
- **S2:** No skill provides the FOS-to-color mapping or the legend design. State this as a gap explicitly.

## Omissions to carry into the plan (no new skill required)

1. **FEA legend fidelity.** Match the reference layout:
   - left block: Model Name: Input Shaft, plus study/plot fields;
   - right block: vertical blue-to-red FOS bar with a moving indicator line, localized warm hotspot at the undercut, blue elsewhere.
   - Decide early whether the legend is DOM or in-

[Revised selections for owner approval](jgun-change-request-skill-selection-2026-10-07.md).

