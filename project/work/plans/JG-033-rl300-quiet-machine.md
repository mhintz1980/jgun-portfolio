---
id: JG-033
title: RL300 "The Quiet Machine" — blue enclosure, capped cross-section, lower intake & extended sequence
status: approved
created: 2026-09-10
approved: 2026-09-10 (Mark, verbal — "Astra made and that I have approved")
owner: Mark (visual gate — passing tests cannot override a visual rejection)
todo: TODO.md#active
author: Astra (plan), promoted to the JG-### protocol by a prep session 2026-09-11
source:
  - project/work/inbox/rl300-the-quiet-machine-plan.md (this document, verbatim below)
  - project/work/inbox/rl300-owner-comments-assessment.md (the assessment it answers)
  - docs/rl300-enclosure-issues-and-ideas.md (the three owner issues that triggered it)
supersedes:
  - JG-032's panel-lift choreography (owner ruling: rejected, replaced by the cross-section)
  - JG-032's "yellow unchanged" A/B census gate (owner ruling: yellow is now the recolor target)
prep_pack: project/work/evidence/rl300-quiet-machine/
skills:
  - cad-scene-graph-rigging (P2: role classification, section groups, part-number keying)
  - glsl-transition-shader-pipeline (P2: section/flow/thermal shader work)
  - r3f-scroll-performance-guard (P2: narrative-progress separation, useFrame budget)
  - gsap-scrolltrigger (P2: extended sequence and chapter synchronization)
  - webgl-telemetry-verifier (P4: every ruling verified by runtime telemetry, never vision)
  - spatial-hotspot-a11y (P3: inspection hotspots and keyboard/SR access)
  - asset-and-bundle-hygiene (P4/P5: derivative asset + bundle audit)
implementation_scope:
  - src/scene/rl300/ (new modules — shot evaluator, camera, materials, section, flow)
  - src/scene/stages/Station2_AcousticEnclosure.tsx (enclosure path replaced)
  - src/scene/stages/AirflowField.tsx, airflowRoute.ts, recolorAllowList.ts (migrate)
  - src/scene/stages/stageWindows.ts, src/data/caseStudies.ts (timing/stage bounds)
  - src/scene/SpatialWorld.tsx, CameraRig.tsx, SceneCanvas.tsx, PostProcessingComposer.tsx
  - public/models/rl300-presentation.glb + public/textures/rl300/ (provisional names)
  - scripts/ (new verification probe; contract updates per the prep pack)
---

# JG-033 — RL300 "The Quiet Machine"

> **Read the prep pack first:** [`project/work/evidence/rl300-quiet-machine/`](../evidence/rl300-quiet-machine/).
> Milestone 1 of the build order below ("Freeze and measure") is already done and recorded there —
> measured baseline, CAD audit, progress-consumer census, contract debt, and a clipping/stencil
> reference. Two findings in it change assumptions in this plan; they are listed in the pack's
> README. Start at Milestone 2.

---

# RL300 — The Quiet Machine

**Status: APPROVED by Mark 2026-09-10. Implementation authorized.**

> _The only edit to Astra's text is this status line, which said "proposed; awaiting Mark's
> approval. No implementation authorized by this document." and is now false. Everything below
> it is verbatim. The original wording is preserved in
> [`../inbox/rl300-the-quiet-machine-plan.md`](../inbox/rl300-the-quiet-machine-plan.md)._

Prepared 2026-09-09; revised after Mark's three owner comments. Scope: transform the RL300-SAFE enclosure into the portfolio's visual centerpiece, including proposed alternate geometry and a second intake beneath the engine. JGUN's mechanical sequence, duration, and authored scroll ranges remain stable. Its lighting, background, and other visual treatments are open to subsequent improvement.

**Owner revision:** document length is unrestricted; 700–850vh is no longer a constraint. Document the selected extension and recommendations/corrections for affected JGUN timing consumers. RL300 geometry and flow may depict planned designs. JGUN lighting and background are unfinished, not frozen acceptance baselines. The implementation approval gate remains pending. See [model assessment and responses](rl300-owner-comments-assessment.md) for evidence and the expanded direction.

## The experience

A deep-blue industrial enclosure stands in a cinematic airflow test chamber. Architectural light banks, a grounded floor, shadow, and depth give it scale. Broad highlights travel across its paint, catching the seams, latches, and machined fittings. The camera approaches at a low three-quarter angle. A fine illuminated section edge moves through the shell and exposes the machine inside, including the thickness and construction of its walls.

Cool blue streams enter the main intake. The camera follows their route, then descends to reveal a second supply beneath the skid: cool air passes through a proposed louvered liner and custom duct, discharges beneath the engine, rises past it, and joins the main stream's exit path. The streams become amber as they pass the heat-source region. After the shared exhaust reveal, airflow recedes and pressure fronts interact with the acoustic layers; a close view of the mounts explains mechanical isolation. The camera pulls back, the section closes, and the blue enclosure is whole again.

The contrast between the quiet exterior and the activity inside is the central visual idea. The most memorable frame is an oblique section through the blue shell, with warm machinery inside and an unmistakable cool-to-warm airflow path. It must work as a striking still before animation is added.

This is a full composition and asset treatment. Camera, section geometry, finish, lighting, effects, typography, and pacing are designed together.

## Authority and assumptions

- Mark's current request is the authority: document the plan, obtain approval, then implement. Previous restrictions on RL300 palette, model editing, panel motion, effect counts, or camera direction do not constrain this proposal.
- The supplied [owner issues and ideas](../../../docs/rl300-enclosure-issues-and-ideas.md) establishes dark-blue shell, readable interior, cross-section reveal, legible airflow, and visible heat transport as core requirements.
- Preserve JGUN's mechanical behavior, duration, and authored scroll percentages. Its lighting, background, and visual effects may be improved in the subsequent JGUN visual pass; they are not permanent constraints on the new rendering architecture. Document shared changes and intentional visual differences.
- Extend the document as much as the RL300 experience needs. Record the resulting layout, timing impact, and recommended JGUN corrections. Do not shorten RL300 merely to avoid revisiting a shared progress calculation.
- Planned enclosure structures and airflow routes are expressly allowed. Use the owner's lower-intake concept as a featured design proposal, with geometry authored to explain it clearly.
- Assume native reversible scroll, desktop and mobile support, silent operation, reduced-motion support, and an intelligible fallback without WebGL. These support the experience rather than prescribe its visual style.
- Airflow and acoustic graphics are explanatory illustrations unless backed by simulation or measured data. No invented temperatures, flow rates, decibel reductions, or simulated accuracy claims.
- Approval of this document authorizes the implementation stages below, including an RL300-only model derivative. It does not mean the finished visuals are accepted or the site should be published.

## What was inspected

Repository baseline: `main`, HEAD `3e3e49fa459d81e4ef6c5632e49322074032b238`, nine commits ahead of local `origin/main`. Existing untracked items: `docs/JGUN-DRAWING` and the supplied issues document. Neither was changed. No remote refresh or deployment audit was performed.

The source already includes `d201ea8`, which replaced the panel lift with a clipping sweep. The owner's issue document describes the preceding implementation, so repeating “add clipping” would miss the current problem.

| Current evidence | Consequence for this plan |
|---|---|
| `recolorAllowList.ts` still accepts only `MSP_BLACK_CHASSIS`; yellow shell materials remain excluded. | Explicitly classify and repaint the dominant yellow skins and structural members blue. Preserve hardware and equipment identities by role. |
| `Station2_AcousticEnclosure.tsx` clips only `ENCLOSURE_CHASSIS` and `COMPOSITE_PANELS`, with a world-X plane moving from 29.3 to 28.0. Baffles remain uncut. | Design the cut against the actual camera and all occluding layers. A plane at the assembly midpoint is not itself a visibility solution. |
| The current cut opens at progress .585–.645, holds to .700, and closes by .715. Panels also retain a .35→.18 opacity fade. | Replace the ghosted-box presentation with opaque exterior surfaces and a deliberate, solid-looking section. |
| The code uses `DoubleSide` on cut shell materials. | Backfaces do not create section caps. Build actual visible cut faces and layer thickness. |
| The current airflow route uses intake volume bounds and a programmed path. Source comments identify the intake grille as a solid decorative plate rather than actual perforations. | Audit openings and obstructions in the model; derive a clear route through real or explicitly authored explanatory passage geometry. |
| `public/models/msp-enclosure.glb`: 2.381 MB, 555 nodes, 193 mesh definitions, 214 primitives, nine materials, zero embedded images. Indexed mesh definitions sum to 293,231 triangles. | Good starting source; add selected surface detail and reduce draw overhead where useful. These counts are not measured runtime draw calls or instanced triangle totals. |
| The asset contains seven named roots, including pump, baffles, intake, exhaust, and mounts. | Retain a semantic map for those functions even if the presentation hierarchy changes. |

Live preview inspected at `http://localhost:4173/`. Its script `/assets/index-C9jYhLvM.js` matched the current `dist/index.html`. At settled progress **.6636515**, telemetry reported a live canvas, full quality, enclosure active, alpha `[0,1,0]`, camera approximately `[30.892, 2.582, 1.643]`, FOV 35.454°, and target `[26.272, 1.2, -5.725]`.

The accompanying frame still showed a predominantly yellow enclosure, a large left-hand case-study card, and little visual emphasis on airflow. The HUD read CH.04/STATION 03 while enclosure telemetry remained active. This establishes a chapter-ownership mismatch as well as a composition problem. Visual judgments are planning observations, not owner acceptance or a completed rendering diagnosis. Matching the entry script does not prove every served asset corresponds to HEAD; full build provenance is an implementation-stage prerequisite.

Graph discovery and coverage checks were used. Coverage reported no recorded parse gaps but changed metadata, so current source reads supplied the specific findings above. No exhaustive graph-completeness claim is made.

## Art direction

**World:** a precision-workshop-to-airflow-test-chamber direction. Give RL300 a large industrial environment with architectural light banks, a grounded floor, deep background planes, and localized atmospheric flow accents. The setting should help explain the machine's scale and air supply. Oryzo's photographed work-surface context is the high-level reference, not an asset or layout to reproduce. The JGUN workshop treatment is a subsequent visual recommendation and must fit its existing timing. Reduce the grid and technical HUD to a discreet chapter marker and progress indicator inside RL300.

**Palette:** shell starting swatches `#12365B` and `#193F66`; graphite frame `#141A20`; neutral steel; warm orange/cast-metal machinery; cool intake `#72DBFF`; warm discharge `#FF9848`; warm-white type. These are art-direction starting points, not final measured material values. The shell must read blue under the actual light, rather than black, grey, or yellow.

**Surface hierarchy:** fine powder-coat roughness on large skins; subtle directional brushing on metal; rubber on gaskets and mounts; readable porous insulation at section faces. Preserve fasteners, latches, ports, seams, and contact shadows. Add restrained bevels where silhouette and highlight quality justify geometry. Use close inspection to judge texture scale. Avoid uniform grunge and conspicuous procedural noise.

**Light:** a broad neutral key describes blue surfaces, a cool grazing rim separates the silhouette, and warm interior lighting emphasizes machinery during the thermal beat. Contact grounding remains visible. Explore volumetric shafts, illuminated section surfaces, stronger flow bloom, localized distortion, reflections, and animated environment accents where they strengthen the shot. Effects have no inherited stylistic ban; judge their contribution to legibility and visual impact. Establish a readable base image first, then author the combined treatment. JGUN's existing light values are not the final target for the shared system.

**Typography:** a large, short title at entry, then one statement per shot. Supporting copy moves into an optional details panel. Passive annotations are limited to two per shot, attached to actual features. Mobile uses one compact caption below the stage. Proposed copy: “Engineered silence.” → “A wall with a job.” → “Air has a path.” → “Heat leaves with it.” → “Break the noise path.”

## Shot plan

The following `u` values are **proposed RL300-local progress**, not replacements for current global progress or JGUN timing. Author camera endpoints using model-relative coordinates and measured bounds during the prototype. The camera remains outside exposed geometry; this is a close section tour, not a forced flight through narrow CAD passages.

| Shot / local progress | Camera and composition | Model, light, and story |
|---|---|---|
| **01 — The object, 0–.12** | Low, long-lens three-quarter exterior. Model occupies roughly 60–75% of available stage width; approach reveals the chamber's depth. | Closed blue shell, architectural highlights, physical grounding. |
| **02 — The incision, .12–.27** | Rise toward the section-facing side, keeping equipment and wall construction together. | A finished section edge reveals shell, insulation, equipment, and internal passages. |
| **03 — The main intake, .27–.41** | Track the existing intake/plenum side. | Establish the main supply with continuous streamlines and clear direction. |
| **04 — A second breath, .41–.61** | Descend beside the skid, show its underside, then arc back toward the engine. | Reveal the proposed lower supply, louvered V2RL300-SAF-1047-5 derivative, and new duct. Follow air to the duct outlet beneath the engine and upward past it. |
| **05 — Two feeds, one exit, .61–.76** | Pull slightly wider to connect both supplies to the shared discharge path. | Cool streams warm in the equipment region and join the common exit; show a coherent combined path. |
| **06 — Control the noise, .76–.89** | Move to the exposed acoustic structure and mount detail. | Flow dims; pressure fronts and mechanical isolation explain distinct mechanisms. |
| **07 — Resolve, .89–1** | Pull back into the chamber for an exterior close. | The section closes and the downstream transition takes ownership. |

Proposed lens language: approximately 35–45° vertical FOV for the exterior and 28–36° for details, adjusted by measured framing and portrait needs. Minimal roll. No arbitrary spins, whips, or automatic scroll capture. Camera and section move together; captions remain steady long enough to read.

Give RL300 the physical scroll travel required by the seven shots, including the new lower-intake sequence. **There is no document-length cap.** Measure readable dwells and transition distances during the prototype, then document the chosen total, per-shot allocation, and effects on shared timing. Keep JGUN's duration and authored animation-progress ranges stable through the timing corrections below.

## Model and section strategy

Create a new RL300 presentation derivative. Use `C:/Projects/CAD/RL300-SAFE/RL300-SAFE-photoreal.blend` as the assessed starting point for the owner's lower-intake concept. Compare its detail and export suitability with the webexport variants before choosing production inputs. The assessed V2RL300-SAF-1047-5 is a solid plate in this saved file; author the proposed louvers and duct as part of the concept. Alternate shell, skid, liner, baffle, and passage geometry is allowed. Save and verify a timestamped backup before editing any existing model; preserve source identity, export settings, and derivative hashes. The original and plan were backed up before this revision; paths are in the linked assessment.

1. **Classify surfaces.** Separate external skins, structural members, liner/insulation, functional baffles, equipment, hardware, and passage volumes. Repaint yellow shell surfaces explicitly; avoid a blanket material-name recolor that could catch equipment.
2. **Prepare the camera-facing section.** Identify which skins and insulation block the hero shot. Split or rebuild those pieces as necessary. Retain sufficient rear/side structure for the object to remain recognizable. Never hide the whole baffle system merely to make airflow visible.
3. **Author thickness and exposed construction.** Repair or redesign presentation surfaces as needed, including the lower intake, louvered liner, and custom duct. Show convincing metal and insulation cross-sections. Record which geometry is existing, owner-planned, or authored for presentation; proposed geometry need not reproduce the current enclosure.
4. **Implement the sweep.** Use per-material local clipping transformed from the RL300 model frame, with properly capped closed groups. Prototype stencil caps on a small number of prepared shell/liner groups. The [official Three.js clipping/stencil example](https://threejs.org/examples/webgl_clipping_stencil.html) provides a relevant implementation reference. Do not apply an expensive cap pass independently to hundreds of CAD parts.
5. **Fallback if dynamic caps are unreliable or too expensive.** Export an authored, capped open-section variant plus a closed variant. Transition them at a controlled section seam with clipping limited to the prepared removable layers. The owner-facing result must retain the traveling cross-section reveal and a clean open hold; floating panels are not the fallback.
6. **Improve presentation assets selectively.** Add surface maps, visible edge detail, believable intake apertures, and optimized repeated hardware where they improve the authored shots. Do not remodel hidden microdetail. A close camera may justify a detail mesh; it does not justify an indiscriminate polygon increase.

Final asset names and hierarchy are chosen after the source audit. Provisional output: `public/models/rl300-presentation.glb`, with RL300 textures under `public/textures/rl300/`. Record a mapping from old functional roots to the new presentation groups. Update consumers and model-contract checks coherently.

## Flow, heat, and sound

Use a few strong continuous ribbons/streamlines as the primary visual, with smaller tracer highlights as a secondary layer. Start with 12–24 hero streams on desktop and 6–10 on mobile. Taper the tails, vary spacing deliberately, and keep cores legible without bloom. This replaces the “more dots” approach.

Author geometry and flow together. Show the main intake and the owner's proposed path: **beneath the skid → louvered liner V2RL300-SAF-1047-5 → custom intake duct → outlet beneath the engine → upward past the engine → shared exit with the main supply**. Planned or alternate passages may be created freely; align streams with the geometry shown on screen so the concept is visually coherent. A concept can be demonstrated before manufacturing CAD is complete. Use a discreet “Proposed lower intake” label for its introduction and avoid unsupported quantitative performance claims. Validate coordinate conversion: the Blender file is Z-up, while the web scene uses Y-up.

Reveal path extent with local scroll. Ambient tracer motion may continue while resting, but reversing scroll must retract the same geometry and return the same shot. Heating begins at the source region rather than being a uniform rainbow applied across the enclosure. Optional heat distortion is confined to the exhaust and removed first on lower quality tiers.

Sound receives its own beat. Replace generic concentric bubbles with sparse fronts that visibly interact with the sectioned acoustic system. No quantitative attenuation label without a traceable source. Keep the mount cue separate from airborne attenuation so the two mechanisms are understandable.

## Extending the experience and coordinating JGUN

The current enclosure enter window is .525–.565 and its exit window is .720–.760. Protect the existing JGUN departure and shared camera transit. Begin new full-scene RL300 art direction only after the wrench is no longer visible; use the end of the existing incoming camera transit as the local sequence entry. Preserve both the forward and reverse seam.

**Scroll:** extend RL300 as needed and document the extension. Preserve JGUN's physical scroll duration, GSAP trigger behavior, and authored animation-progress percentages by separating physical document progress from narrative progress. Expose RL300-local progress and a compatibility mapping for existing JGUN consumers. A longer document necessarily changes raw `scrollY / totalScrollableHeight`; it must not silently become the input that retimes JGUN. Keep JGUN's authored ranges and displayed narrative percentage stable; label raw total-page progress separately if retained. Recompute mappings on resize and direct navigation. Do not apply the drawing intro remapper downstream. Correct affected consumers rather than cutting the RL300 sequence to fit the old document.

**Required extension record and JGUN correction recommendations:** record before/after section heights, insertion points, scroll offsets, authored progress ranges, chapter labels, and camera/stage handoff states at each viewport. Recommend (1) section-relative JGUN trigger measurements, (2) one compatibility mapping for legacy global-window consumers, (3) a shared narrative-progress source for camera, HUD, navigation, and stage ownership, and (4) resynchronization on resize/reload. Identify each affected consumer, proposed correction, implementation status, and verification result. Update timing documentation together. A recommendation alone is not evidence that a timing regression has been corrected.

**Rendering:** design scene, lighting, atmosphere, reflections, and effects for the new visual direction. Per-section ownership is an engineering option, not a requirement to preserve today's placeholder JGUN image. Use a shared environment or dedicated scenes according to the prototype's needs; explicitly control light/effect contributions and avoid unintended cross-section spill. Save/restore renderer state needed for sectioning. Document shared rendering changes and recommend the corresponding JGUN lighting/background corrections. The later JGUN pass may intentionally change its rendered image while retaining the mechanical sequence and timing.

**State:** one RL300 shot evaluator owns camera, cut amount, effect weights, caption, and active features. Derive it from local progress rather than independent overlapping tweens. Reuse the current scroll engine; do not add another smooth-scroll loop. Camera inspection takes temporary ownership and blends back to the current shot on scroll or close. Exiting RL300 clears its selections and resources.

**Scope:** protect JGUN's assembly geometry, kinematics, mechanical interaction behavior, duration, and authored scroll ranges. Rendering architecture may support broader lighting/background/effect changes. Treat the subsequent JGUN visual pass as planned follow-up, with concrete recommendations in the extension record. Do not use the old placeholder background or exact light values as an immutable visual gate. Record intentional visual differences separately from functional regressions. This revision still authorizes planning and assessment only until the implementation plan is approved.

## Planned implementation surfaces

| Responsibility | Current integration points / proposed location |
|---|---|
| RL300 shot evaluator, camera, material system, section and flow components | New `src/scene/rl300/` modules; replace the enclosure path in `src/scene/stages/Station2_AcousticEnclosure.tsx` |
| Existing effects and role mapping to migrate | `src/scene/stages/AirflowField.tsx`, `airflowRoute.ts`, `recolorAllowList.ts`; inspect `AcousticBaffleField.tsx` in detail during implementation |
| Station ownership and rendering boundary | `src/scene/SpatialWorld.tsx`, `CameraRig.tsx`, `SceneCanvas.tsx`, `PostProcessingComposer.tsx` |
| Compatibility timing and stage bounds | `src/scene/stages/stageWindows.ts`, `src/data/caseStudies.ts`; inspect scroll-store and DOM chapter consumers before changes |
| RL300-only editorial UI and selected-feature details | New scoped overlay/styles; identify current chapter/HUD components through graph discovery before edits |
| Models, textures, provenance | RL300 derivative assets; source/export manifest in project context |
| Verification and handoff | Focused Vitest tests, browser evidence, protected-JGUN baseline manifest, final implementation record |

This is a bounded integration map, not a claim that uninspected consumers are covered. Discover callers, check coverage, and inspect source for each actual edit.

## Build order and reviewable milestones

1. **Freeze and measure.** Capture exact build and asset hashes, JGUN static and scrolling baselines, input/scroll mappings, and the current RL300 frame. Save verified backups before model edits. Audit source models and select the derivative input. Output: reproducible baseline and asset-role map.
2. **Prove the signature shot and new intake layout.** Build the blue exterior and capped reveal with the intended camera/light setup, plus a simple spatial blockout of the lower intake, liner, duct, and under-engine outlet. Produce exterior and section frames, a short reversible transition, and an underside concept view at desktop and portrait sizes. Establish strong geometry and lighting before elaborate effect polish. Present these to Mark before full detail modeling; resolve a rejected direction here.
3. **Build the continuous sequence.** Add the seven shots, local progress, unrestricted documented scroll extension, chapter/HUD synchronization, and editorial overlay. Include specific JGUN timing corrections and later visual recommendations. Verify timing after shared-boundary edits.
4. **Add the engineering story.** Model/render the proposed lower intake and custom duct, then implement both flow supplies, their shared exit, thermal treatment, acoustic interaction, and mount detail. Show each supply independently before combining them.
5. **Finish surfaces and interactions.** Tune textures, highlights, contact grounding, caps, inspection views, caption layout, and reversible transitions. Make mobile compositions separately.
6. **Validate and present.** Complete functional checks, measured performance, JGUN regression proof, accessibility/fallback checks, and the owner's visual review. Record known gaps plainly. Publishing remains a separate step.

## Acceptance criteria

**Owner visual gate:** Mark decides whether this is the strongest part of the site. Passing tests cannot override a visual rejection. Present full-size exterior/section/thermal/acoustic frames and a live forward/reverse run from the exact same identified build.

**Visual success:** the dominant shell is unmistakably dark blue; the section exposes recognizable equipment, the route, and wall construction; the moving cut has finished edges; airflow direction and warming are apparent within a few seconds; material identities survive lighting; text does not cover the subject; each shot reveals a new relationship; the closing frame feels complete. Evaluate full and lower quality versions separately.

**JGUN timing and function:** verify drawing introduction, solid view, gear/explosion motion, LCD dwell, inspection, outgoing handoff, and reverse return at the same JGUN physical scroll positions, authored progress values, and viewport sizes. Compare mechanical state, sequence duration, interactions, and transition continuity. Lighting, background, and documented visual-effect changes are not automatic failures. Use screenshots to identify intended visual differences and unintended regressions, with deterministic phases where needed. Added loading stutter, changed kinematics, or timing drift still fails the requirement. The extension record must include concrete JGUN corrections/recommendations and their status.

**Technical behavior:** run `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:station2` with deliberately updated contracts where RL300 behavior changes. Replace obsolete “yellow unchanged” and panel-lift expectations with the approved blue-shell and section requirements. Do not delete unrelated checks. Restart the preview after rebuilding and verify a live canvas plus build/asset identity. Test slow/fast/reverse scroll, direct navigation, reload at depth, resize, selection release, and the complete downstream exit.

**Performance targets:** begin with 60 fps on Mark's desktop and a stable 30 fps lower tier on an ordinary phone; measure frame-time percentiles and report the actual devices. Initial budgets: RL300 render cost under 150 draw calls on full and 90 on lite, visible geometry around 500k/250k triangles respectively, incremental RL300 transfer around 8 MB full / 4 MB lite. These are provisional targets, not current measurements. Lower DPR, distortion, effect density, and reflection cost before removing the core section story. Prefetch after the critical JGUN load and avoid decode/compile spikes during its animation.

**Access and resilience:** test 1440×900, 768×1024, and 390×844; keyboard and touch inspection; readable focus and text contrast; reduced-motion composed stills with the same narrative; static section posters if WebGL or an asset fails; context-loss recovery; hidden-tab resume; and resource cleanup. Mobile needs an intentionally framed section, not a desktop crop. Visitors can always continue scrolling.

## Risks and decisions to resolve in the prototype

| Risk | Response |
|---|---|
| Thin or intersecting CAD surfaces make caps unreliable | Prepare a small set of closed section groups; use the authored capped-variant fallback if needed. |
| Blue paint loses detail in a dark studio | Judge key/rim balance and roughness on the actual shell with bloom disabled; prioritize readable blue midtones. |
| Insulation still blocks the story | Include occluding liner geometry in the section design while preserving the functional baffle path. |
| Added runway changes JGUN timing | Extend RL300 as needed; correct shared progress consumers, document the mapping and recommendations, and verify unchanged JGUN duration/authored ranges. |
| Shared rendering changes expose unfinished JGUN visuals | Document the intentional changes and recommend its workshop background, lighting, material readability, and transition treatment; retain functional checks. |
| Effects resemble simulated engineering data | Use restrained illustrative labeling and only source-backed quantitative claims. |
| Attractive desktop sequence becomes cramped or slow on mobile | Author portrait shots and lower-cost assets/effects with the same central reveal. |

## Approval requested

Approve the revised **The Quiet Machine** direction: a redesigned blue RL300 in a cinematic test chamber, a properly capped cross-section, the proposed lower intake and under-engine duct, two cooling supplies sharing an exit, and unrestricted documented sequence length. Include recommendations for the later JGUN visual pass while preserving its duration and authored scroll ranges. The first implementation deliverable remains the exterior-to-section prototype. Only planning documents, backups, and diagnostic inspection artifacts were created during assessment; no application source or saved model geometry/render settings were changed.
