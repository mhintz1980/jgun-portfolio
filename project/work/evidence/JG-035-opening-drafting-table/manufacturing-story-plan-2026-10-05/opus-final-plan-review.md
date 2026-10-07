# Opus-5.5 final plan review — JG-035 manufacturing stories

Date: 2026-10-05. Reviewer: claude-opus-5-5, fresh context, no delegation. Read only: `docs/jgun-manufacturing-inspection-plan.md`, the owner storyline, and this folder's `concept-consensus.md`, `astra-plan-detail-review.md` and `approved-asset-baseline.md`. No source, CAD, plan or registry changes.

**PLAN VERDICT: fix-first.** Two bounded plan edits are needed before implementation. Neither reopens an agreed concept or the approved geometry. Once both are made, the plan is ready to implement; re-review can be limited to the two edited passages. Ship would mean ready to implement, never runtime approval.

The rest of the plan is buildable and well bounded: owner beats and exact card text, the +2.75 mm no-double-shift rule, single camera ownership, session-scoped lifecycle, absolute-state seeking, provider-diverse gates, and measured/illustrative/unresolved tagging.

## Blocking findings

**B1 — The shaping beat has no workpiece-state rule, and the recap drops the owner's orbit.** Plan lines 53–56, 66, 70, 76, 139, 141.

Line 76 defines progressive cutting states only for hobbing. Line 53 isolates "the shaped shaft", and line 54 then feeds the cutter "radially to depth". If that shaft already carries finished teeth, the cutter plunges into empty tooth spaces and the chip has no source. That contradicts the owner's "as it cuts the teeth and working its way to the full tool depth." A quarter orbit also cuts only part of the circumference, yet the material beat at line 57 needs a fully toothed grooved shaft. The plan never says how the remaining spaces complete without teeth appearing outside tool engagement, a rule line 76 already enforces for hobbing. Separately, the owner's pull-back shows the cutter "rapidly on its slow orbit-like toolpath." Lines 66 and 70 ease frame-follow to zero, and line 56 never re-engages it.

Required edit:

1. Name the grooved source (the narrative P001835 occurrence or its CAD source, hashed in G0) and a derived grooved blank whose OD matches the tip diameter.
2. Define a shaping progression that follows engagement. Example: complementary capped azimuthal masks reveal full-depth spaces behind the cutter, plus one baked partial-depth state for the radial infeed.
3. State how the shaft reaches ten full teeth before 13 s. Either complete the revolution under an accelerated recap or mark an honest time skip during the tool fade.
4. Have the 11–13 s recap re-engage the shaft-following frame: slow orbit, fast strokes. Extend the beat if needed.

Add the states to G2 and the shaping acceptance to G4.

**B2 — The shaft finale's composition frame is undefined for exploded or blueprint entry.** Lines 13, 62, 93, 97, 155.

Line 155 requires blueprint and exploded entry. Revised parts register through `shaft_world_matrix.json`, which describes the assembled pose. Meanwhile line 97 fades back narrative planets, cages and "the rest" from a frozen narrative that may be exploded. The revised shaft would sit assembled among exploded neighbours, and the planets could neither mesh nor spin coherently.

Required edit: compose the shaft inspection in an inspection-local assembled study pose regardless of entry stage. Lease the transforms of reused narrative parts and restore them on Return. Add an exploded-entry → finale → Return round-trip assertion. The ring keeps its existing behaviour.

## Measured-data prerequisites (G0 work, not plan defects)

- Grooved-source hash and legacy support poses.
- Registration from the Blender export frame to the runtime rig root, including the Z-up to Y-up axis change as well as the mm→m conversion.
- Lead-out dimension type and datum, including the 14.06 versus 13.79 mm endpoint.
- Illustrative cutter tooth count and signed ratios.
- Hob starts, setting angle and swept envelopes.
- K000180-1 and full-neighbour interference.
- Bearing race separability and the non-manifold edge.
- An export-derived +2.75 mm tolerance.
- The named GPU and lite display rates.

The plan gates each of these correctly.

## Recommended improvements (non-blocking)

Machining and camera causality:

1. **Bullet-time clock split.** Line 68 couples the camera to process time. Couple only the frame-follow azimuth to process time, and run dolly and FOV on playhead time. The zoom then keeps moving while the process slows, which is the bullet-time signature, before the camera settles into the ≥1.2 s stable hold.
2. **Deterministic follow curve.** Easing frame-follow out, and back in for B1, integrates shaft azimuth. Bake the camera azimuth as a closed-form or lookup function of the playhead, so direct seek matches playback (line 157) without accumulated state.
3. **Rolling check.** In the shaft-following view, the cutter pitch circle must roll on the shaft pitch circle without slip. Assert near-zero relative pitch-point velocity in telemetry. This catches a wrong ratio sign that a still frame cannot show.
4. **Stroke direction.** State that the cutting stroke travels toward the groove and the relieved return travels away from it, derived from geometry.
5. **Hob band boundary.** Keep the partial-depth zone inside the hob's visible engagement, so the reveal never runs ahead of the tool. At end of feed, the final runout arc should coincide with the hob's swept envelope at its last axial position. The lead-out then reads as the tool's own trace.
6. **Display-rate ceiling.** Cap shaper stroke and hob-gash passing frequencies at about a quarter of the tier frame rate, or use the softened representation from line 45.

Subtle visual nuance:

7. **Lights follow the frame.** Key, grazing light and environment rotation should follow the same weight as frame-follow. Highlights then stay locked to the shaft during the apparent orbit and do not betray the camera move.
8. **Frame contrast.** Make the camera frame part of the story. During shaping the cutter appears to orbit; during hobbing the shaft visibly spins, as the owner wrote: "as the input shaft rotates on its own axis."
9. **Neutral groove highlight.** Identify the groove at 0–2 s with a neutral or cool-white highlight. Red and orange then keep one meaning, stress and failure, deliberately shared with the FAILED stamp.
10. **Stress overlay staging.** Reveal each stress overlay with one axial "scan" pass, matching the owner's "FEA scan" and reusing the wipe mechanism. Let the warm field leave with the old geometry during the 19.6 s wipe, so the new blank never carries the old design's stress.
11. **Card rhythm.** The owner's text fades out each card before the next appears. A 2.2 s beat leaves only about 0.2 s for that after the readability floors. Try about 2.8, 2.5 and 2.3 s, which tightens as tension builds; line 99 already allows extension.

Lifecycle, accessibility and fallback:

12. **Full render-state restore.** Extend the restore envelope to background, environment and its rotation, exposure, fog, lights and post passes. Assert a matching snapshot hash before entry and after Return.
13. **Support-slide visibility.** P000725 hides the bearing slide. Specify a capped, camera-facing section of the housing. Sweep-check the pair's path against the revised shaft and housing, and use a legacy-housing witness if the start pose intersects.
14. **Static stills.** List the static-story stills as budgeted raster assets with text alternatives, rendered from blockout cameras. Denied-fetch and context-loss fallback (line 131) then never needs WebGL.
15. **Screen-reader and focus behaviour.** Announce card and chapter text in a polite live region. Move focus into the inspection controls on entry and make the narrative DOM inert.

Gates:

16. **Motion evidence.** Give visual reviewers short frame sequences of the macro, stamps, hob band and support slide; stills cannot show slow motion or strobing. Add luminance-normalized crops with region statistics, because vision confabulates on this dark scene.
17. **Independent reruns.** The mechanical reviewer reruns the measurement scripts on hashed inputs instead of reading reported numbers.
18. **Provider map.** Line 145 should state the general rule that reviewer and producer providers differ. It should also cover Anthropic-produced leaves and the integration owner's shared-file diff.

## Residual risks

- The ≤15k lite triangle budget may not preserve the lead-out arc and tooth profile.
- Stencil caps add draw calls and fill cost on lite.
- Tool depictions stay illustrative while production tooling is undocumented.
- Total duration will likely grow past 40 s.
- After Return, visitors see the legacy grooved narrative shaft again. That scope is settled, so the closing caption must carry the boundary.
- Exact card assertions need a pinned dash form: the owner text uses hyphens and the plan uses en dashes.
