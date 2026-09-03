# Round-table PREP — Animation Redo Background and Layout Agenda

**Status:** Decision material only. Nothing in this document pre-decides the owner ruling. **Branch:** `spike/roundtable-prep`  
**Scope:** repo CH.01–CH.03 only; repo CH.04 remains deferred for implementation, but its transition boundary is acknowledged where it affects C6.

## Working rule

The round-table exists to settle **background choreography and layout** for the redo beats. The approved JG-021 visual baseline is not reopenable. The JG-023 system is the substrate: camera-locked, scroll-scrubbed, reversible, dark, and limited to the existing gradient/grid/dust vocabulary. The boards supplied with this agenda show three neutral evolution directions; they are not a recommendation.

> **Light canon:** keep the atmosphere soft enough that the viewer never needs to squint, while preserving sharp, legible engineering information.

## Locked before the session

| Item | Locked fact | Decision consequence |
|---|---|---|
| Visual baseline | JG-021 §13 is approved: Station 2 lighting/glow problem is resolved; panels remain opaque and the current material look is approved. | Do not reopen the baseline, opacity, bloom, or station-lighting ruling. |
| CH.03 paint | The enclosure’s painted roots recolor from baked yellow toward dark blue at C1. | Decide only the background relationship and readable contrast; do not treat paint as a backdrop choice. |
| Backdrop substrate | JG-023 is live in all four chapters: camera-locked layers, reversible scroll interpolation, per-chapter palette pairs, full/lite/reduced/poster tiers. | Evolve the existing layers; do not replace them with a world-spanning set, video, FBO, or a new always-on effect. |
| Luminance | Current peak linear luminance is approximately 0.032; the bloom gate is 0.6. | Quiet dark atmosphere is the floor. Every direction must remain far under the gate. |
| Interaction | No exit button. Scrolling beyond an inspection orbit releases in either direction; Escape exists only for accessibility parity. | No persistent scrubber, close affordance, or HUD chrome in the board concepts. |
| Geometry/copy | Measured reality and existing part-number identity win. CH.04/M249 material work is deferred. | Backgrounds support the machine and captions; they must not invent geometry, claims, or new features. |

## Decisions to settle by beat

| Beat / gate | What the session must settle | Realistic options to put on the table | Cost / risk notes | Stays locked |
|---|---|---|---|---|
| **B1 — blur-focus drawing intro** | Where the large engineering drawing lives while it fills roughly 90% of the viewport, and how the backdrop protects the SVG dimensions/GD&T from visual competition. | **A:** warm bench pool with almost no field texture. **B:** blueprint-film grid that recedes behind the drawing. **C:** metrology-plate silhouette zones at the edges only. | A is lowest risk; B is the lowest-identity-risk evolution; C needs more authored prop silhouettes and careful mobile cropping. | Drawing is an in-app hidden-line/wireframe render plus SVG overlay; orthographic views, cross-section, tolerances, datums, and feature-control frames remain the content hero. |
| **B2 — rise from drawing** | How the background acknowledges the one-time line pulse, model emergence, and pond-ripple without becoming a second spectacle. | **A:** single accent pool expands one step then returns. **B:** grid displacement illusion limited to the ripple window. **C:** a quiet field seam opens under the rising model. | B is a new tier-gated post effect and has the largest performance/legibility risk; A can reuse layer opacity choreography; C needs a new shader or authored mask. | The line pulse, aligned rise, and one quickly dissipating ripple are the dictated beat. No sheet bulge, neon noise, or uncontrolled bloom. |
| **B3 — retained middle** | Whether the background is stable during ring-switch shift, epicyclic spin, ghost fade, and axial explode, and where explosion lines can sit without reading as decoration. | **A:** hold the chapter field nearly still during mechanism comprehension. **B:** slow reversible field drift tied to scroll. **C:** sparse origin-to-position construction lines on the lower-frequency field. | A is safest for engineering readability; B is cheap but must not fight the motion; C is a small new draw/line treatment and should be measured. | Existing shift, spin, ghost, explode, wrench rig, part-number canon, and mechanism order remain intact. The known ghost regression must be fixed or explicitly accepted before B3 re-windowing. |
| **B4 — clickable subassemblies** | How the background distinguishes inspection mode from the main rail while remaining reversible and free of modal chrome. | **A:** quiet vignette/field contraction around the inspected unit. **B:** restrained inspection-bench coordinate grid. **C:** thin metrology registration marks aligned to the selected unit. | A is mostly palette/alpha choreography; B adds texture density; C risks looking like a reticle and must preserve the existing DOM badge/HUD accessibility pattern. | Click targets, camera dolly, slight scroll orbit, two-direction release, and no exit button. The owner-dictated slight orbit remains open for tuning; a 45–75° starting range is only a working hypothesis, not a ruling. |
| **B5 — scene close / inspection table** | How the background transitions into an inspection-table read and how much of the table can be visible on 390×844 without stealing the wrench. | **A:** table plane implied by a low warm pool plus edge silhouettes. **B:** clearly legible stylized table with metrology props arranged as a controlled still life. **C:** drawing-page continuity: B1 sheet returns as the table’s anchor while props enter from negative space. | A is lowest build cost but may under-deliver the owner’s “backgrounds are critical” ruling; B is the strongest spatial read but requires authored props and mobile layout work; C has the best narrative continuity but creates transition choreography work. | Props are in-app stylized 3D: micrometers, gauge blocks, sine plate, height gauge/dial indicator, mechanical pencils, and the same JGun drawing. |
| **C1 — dark-blue paint recolor** | Whether the backdrop yields contrast to the newly dark-blue painted roots and where the chapter transition completes. | **A:** deep teal hush with a slightly warmer edge anchor. **B:** cyan blueprint field held behind the enclosure. **C:** graphite/teal split that makes the paint change readable without a flash. | A is closest to shipped CH.03; B has the clearest technical language but may compete with airflow; C needs a transition mask and careful contrast testing. | Only painted roots recolor; the JG-021 approved panel opacity, current material look, and Station-2 lighting baseline stay unchanged. |
| **C2 — intake highlight** | How the hexagonal intake face is isolated as the first air-entry event. | **A:** low-frequency pool moves under the face. **B:** sparse hex registration field echoes the cutouts. **C:** one restrained pulse travels across the intake-side field. | A is cheapest; B adds a chapter-specific texture rule; C is a small animated accent and must not become an intake vortex or pull-through. | Camera emphasizes `DUCT_INTAKE`; the owner-leaned pulse is optional, while vortex is optional and first-person pull-through is not the v1 direction. |
| **C3 — cross-section** | What backdrop plane, split, or void makes the custom chamber geometry legible while the engine/pump remain deliberately vague. | **A:** matte deep-teal chamber field with a clean section boundary. **B:** cyan blueprint grid only behind the chamber path. **C:** two flat atmosphere zones: intake hush and exhaust warmth, with no internal-detail texture. | A minimizes clutter; B is strongest for technical orientation but can flatten depth; C explains the airflow story but risks implying a thermal/FEA layer. | Cross-section shows only the custom-chamber geometry that creates the S-path; internals stay silhouette-level. No clamshell peel. |
| **C4 — flow visualization** | How the entire skid length remains readable while particles trace the S-path from intake to exhaust. | **A:** sparse teal particles on a dark field. **B:** particles plus a faint projected anchor field using 3–6 verified station anchors. **C:** sparse particles with a warm exhaust-side anchor only. | A is lowest risk and should be the fallback; B is the most informative but must not become an FBO/thermal field; C gives directionality with less density. | Route is repathed in `AirflowField.route()` after Mark supplies hand-drawn flow overlays. No ribbon trails, curl noise, capsule tracers, or density encoding in v1. |
| **C5 — follow cam** | How the background behaves as the camera tracks laterally along the stream, especially at the radiator, opposite openings, and external hood. | **A:** camera-locked field stays calm while the particle route provides motion. **B:** slow frequency shift from fine intake texture to broader exhaust texture. **C:** a single low-contrast “path corridor” follows the camera-safe area. | A is most faithful to current substrate; B requires stateful-looking texture choreography but can remain progress-pure; C risks suggesting a world-spanning backdrop, which the rig cannot promise. | Follow cam travels from hex face down the full length and out the hood; no continuous-world parallax is promised. |
| **C6 — plume exit** | How the plume gets a clean upward field and how the CH.03→CH.04 boundary leaves room for the deferred M249 chapter. | **A:** teal field releases into near-black negative space. **B:** a sparse warm/amber exhaust anchor rises with the plume. **C:** a graphite fade that hands off to CH.04’s existing violet palette without point-cloud/M249 imagery. | A is safest; B is narratively strongest but must remain far below bloom; C is a transition treatment, not a CH.04 design decision. | Plume rises and exits toward CH.04. M249 material, point-cloud freeze, smoke physics, heat shimmer, and dissolve are deferred. |

## Cross-cutting session gates

The group should resolve one **layout grammar** rather than twelve unrelated effects. The chosen grammar must answer where the hero object, caption-safe area, engineering field, and negative space live at both 1920×1080 and 390×844. It must also name the moments where the backdrop intentionally holds still so the viewer can understand the mechanism.

| Gate | Owner decision required | Evidence to request later |
|---|---|---|
| Direction | Select or combine one of the three boards as the working art direction. | Same-frame desktop/mobile stop-point captures. |
| Frequency | Set a low environmental layer, a medium engineering field, and a sparse fine atmosphere; decide where layer C is absent. | Layer telemetry and flag-off parity. |
| Motion | Set which beats move the backdrop, which beats hold, and how every motion reverses under reverse scroll. | Forward/reverse checkpoint identity and no visible discontinuity at chapter blends. |
| Readability | Confirm that captions, GD&T, part numbers, intake geometry, and the plume remain legible without squint-inducing brightness. | DOM safe-area probes plus luminance/bloom measurements. |
| Mobile composition | Decide what is cropped, stacked, or omitted at 390×844. | Owner visual pass at 390×844; no desktop-only assumption. |
| Build fence | Confirm that no board choice silently adds FBOs, video, sound, world parallax, persistent HUD chrome, or a new always-on post pass. | Tier matrix, performance delta, bundle/media audit. |

## Explicit beat cross-check

This agenda covers **B1 drawing intro, B2 rise/ripple, B3 retained mechanism, B4 inspection, B5 inspection-table close, C1 dark-blue recolor, C2 intake highlight, C3 constrained cross-section, C4 S-path flow, C5 follow camera, and C6 plume exit**. The board selection is therefore a layout input to every background-sensitive beat named in the owner spec; it does not decide implementation order, the Plan4 elaboration yes/no table, or any deferred CH.04 work.

## References

[1]: ../animation-redo.md "Animation redo — consolidated owner spec"  
[2]: ../five-plans-synthesis.md "Five-plans synthesis"  
[3]: ../../plans/JG-023-scrubbed-backgrounds.md "JG-023 — Scroll-scrubbed procedural backdrop layers"  
[4]: ../../evidence/JG-021-sequence-rechoreography-verification.md "JG-021 verification — approved visual baseline"  
[5]: ../../plans/JG-025-handle-rear-realism.md "JG-025 — Handle-rear realism pass"

Prepared by **Manus AI** for owner discussion. This is not an implementation decision.

