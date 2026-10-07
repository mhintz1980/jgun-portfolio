# JG-035 — Ring Switch and Input Shaft manufacturing stories

Date: 2026-10-05. Current status, recovered 2026-10-06: **implementation in progress; acceptance remains open**. Substantial geometry, assets, shared lifecycle, ring and shaft work is saved. Resume the [recovered implementation handoff](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/continuation-handoff-2026-10-06.md) and its execution PLAN/status log; do not restart from the planning-only packet. G0–G6 below remain unchecked overall acceptance gates, not an inventory of absent implementation.

Historical planning readiness: parent/Astra/Opus concepts agreed, Astra visual detail pass incorporated, Opus final findings corrected and bounded re-review **SHIP**, Astra final delta **AGREE**. See the [planning review ledger](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/review-ledger.md) and [historical planning handoff](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/continuation-handoff.md). These reviews establish plan readiness, not runtime acceptance.

Owner source: [verbatim storyline and model approval](../project/context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md). Review packet: [manufacturing-story-plan-2026-10-05](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/). Existing Ring Switch implementation: [authorship/knurling plan](jgun-authorship-knurling-implementation-plan.md). This plan refines that implementation and adds the shaft story; it does not restart the opening.

## 1. Locked direction and scope

Mark approved the modified P001835-2 Input Shaft, P000725 1st & 2nd St. Housing, K000210 bearing and K000211 retaining ring after Blender review. Preserve the 6 mm authored hob lead-out and +2.75 mm shaft-local Y relocation. Source assets and live hashes: [approved asset baseline](../project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/approved-asset-baseline.md). The larger-family P001812 reference supplies process history, not this shaft's dimensions or an authenticated legacy revision.

The approved P003068 concept already has a 12-second inspection implementation. Refine contact/readability/finish staging and generalize only the lifecycle that the shaft story needs. Keep the ring bore, smooth lands and original physical assembly intact.

Both stories are optional visitor-controlled inspections with the same dark studio, tool entry, neutral metallic rim and restrained DOM typography. Neither adds a scroll segment, changes the canonical mechanical ladder, or alters opening/station windows. The revised shaft assembly exists inside the inspection study. The finale shows its shaft, supports and related train operating; explicit **Return to narrative** restores the original saved narrative rig, mode, stage, scroll and focus. Make this boundary clear in the control and closing caption. Do not silently replace `Default.glb` or ask the owner to reopen this resolved scope choice.

## 2. Shared presentation and control

Enter from a readable JGun-only DOM action linked to the component story. Hide competing narrative geometry through reversible instance-local visibility/material ownership. One camera owner remains `CameraRig`; no other layer may write its transforms. Freeze the narrative pose/idle at entry. Save camera target/FOV/pose, original mode, stage state, scroll position and trigger focus before transitions begin. Also lease/snapshot background, environment/rotation, exposure, fog, lights and post effects; restore the full render-state snapshot on exit. Move focus into inspection controls and make the narrative DOM inert; politely announce discrete chapters/cards, not every playhead frame.

Expose Play/Pause, Replay, a labeled seek control, shaft chapter buttons, Return and Escape. Entry does not begin machining before required assets are ready. Keep Return usable while loading or failed. At the end, hold the result with controls; do not close unexpectedly. Pause on hidden document; resume only without accumulating offscreen time. Closing cancels loads, audio and animation and restores the context even at intermediate phases. A missing/removed trigger needs a sensible JGun focus fallback.

Four shaft chapters: **Why the groove was needed**, **Material attempts**, **Changing the process**, **Moving the supports**. All must be selectable without watching preceding chapters. The transcript explains the causal sequence and glosses “undercut” once as the cutter runout/relief groove, distinct from involute tooth-root undercut.

Silent playback is complete. Optional visitor-enabled audio can follow the same speed ramp and local stamp impulse; no autoplay or requirement that audio finish first. The bullet-time impression comes from coherent movement and a readable clearance hold, not distortion effects. Reduced motion/poster have no spin, camera flight, stamping impulse or speed ramp.

Each entry has a session identifier. Late load/compile completions from a closed session cannot attach objects, acquire camera ownership or change controls. Exit is idempotent. Dispose instance-owned resources; release shared cached resources without destroying them. A manually paused inspection stays paused across document hiding. Seeking samples visible chips/stamps/tools without replaying audio impulses or accumulating particles. Direct chapter entry establishes its complete geometry, light, captions and camera without prior playback.

Shared light rule: one broad neutral key and a narrow grazing reflection describe machined edges against near-black; keep dark silhouettes readable and stress color localized. Move the camera to change the explanation, then hold it when judging contact, clearance or a dimension. DOM card text meets 4.5:1 contrast. At 390×844, keep tool/action/cards separate with approximately 8% margin around the critical action; establish actual projected framing in blockout.

## 3. Ring Switch refinement shot list

Retain the existing phase spine and approximately two-second contact traverse. Current source timings below are a baseline, not a new runtime claim.

| Time (s) | Action and visual purpose |
|---|---|
| 0–1.2 | Isolate smooth black P003068 against black; a neutral rim makes bore and smooth lands readable. |
| 1.2–2.8 | Cinematic aluminium inspection state and increasing spin; retain a legible silhouette. |
| 2.8–4.2 | Paired rollers approach; a slightly oblique view exposes both contacts. Hold contact composition at least 0.3 s before axial traverse. |
| 4.2–6.2 | OD knurl grows only at/behind contact as rollers traverse. Preserve the smooth edge lands and bore. |
| 6.2–8.2 | Retract to measured clearance before the prop fades. Relief remains on the worked band. |
| 8.2–10.5 | Decelerate and return to black finish; one controlled grazing reflection reveals the diamond relief, then settles. Give the finished black relief at least one second of readable presentation. |
| 10.5–12 | Register the finished ring with the saved assembly composition while retaining inspection ownership and a frozen narrative. Hold result and controls. Only Return/Escape releases ownership and resumes the saved narrative. |

Inspect the current normal/relief representation before changing it. Macro views require convincing surface relief/parallax and silhouette where visible; do not introduce a heavy full diamond lattice merely to improve a wide shot. If normal detail fails the macro, use a bounded offline detail strip or height representation restricted to the OD. Physical bore/lands remain unchanged. Aluminium-to-black is a cinematic finish study, not a claim that a finishing operation occurs under the rollers. Knurling forms the surface: no cutting chips or sparks.

Validate roller axes/handedness and compatible tangential surface speed against the prop and contact geometry; existing clip display rates are not production measurements. Tune display speed to avoid apparent reversal or strobing at 30 fps lite. Use a deliberate softened high-speed representation if speed exceeds readable repeated-feature motion; make the forming/contact macro crisp and phase-readable. At t=12 inspection stays active and narrative time frozen; Return/Escape restores once. Knurl growth is limited to the swept worked region; fading the tool begins only after measured roller clearance.

## 4. Input Shaft storyline and preliminary timing

Initial duration target: approximately 43–45 seconds, optional and chapter-seekable. Timing is an editorial starting point; preserve cause/readability before trimming. The Opus pass extends the shaping recap and card fades. Phase anchors and holds become authored data after measured camera blockout, not scattered constants.

| Time (s) | Beat | Required visible explanation |
|---|---|---|
| 0–2 | Isolate the grooved blank | Fade assembly to black; retain steel rim and identify the relief with neutral/cool-white light. The geared-end blank has material for the cutter to remove. |
| 2–6 | Shaping overview | Cutter strokes, spins and feeds radially to depth; progressive tooth spaces follow real engagement. A shaft-following camera creates the apparent quarter orbit. |
| 6–11 | Slow cutter exit | Ease into a machine-frame macro. See face end, cutter edge passing beyond it, chip curling from rake face into clearance and a relieved return. Give the critical exit/return event a readable hold. |
| 11–15 | Pull back and finish shaping | Re-engage deterministic shaft-follow camera for rapid strokes on the slow apparent orbit. Complete the remaining circumference with explicitly time-compressed recap before the tool retracts/fades; all ten teeth exist before material attempts. |
| 15–22.6 | Material attempts | Same groove/silhouette; one illustrative warm scan; three exact alloy cards and local FAILED stamps, approximately 2.8, 2.5 and 2.3 s including fade-out. |
| 22.6–25 | Revised smooth blank | Align at shared axis/datum. Short axial wipe exposes retained section below the uncut geared end; warm field leaves with old geometry, no overlapping translucent solid shafts. |
| 25–32 | Rotary hobbing | Recognizable hob, coupled shaft rotation and axial feed. Circumferential tooth formation advances as an axial band; finished result retains the approved lead-out. |
| 32–35 | New geometry/material | Retract tool; unobstructed runout hold then one cool stress scan below the gear; same card slot shows final 4340 heat treatment without a success stamp. |
| 35–39 | Support relocation | Legacy witnesses and capped shaft/housing section; bearing and retaining-ring rigid pair move exactly +2.75 mm into approved final placement, with corresponding housing support readable. |
| 39–43 | Revised assembly finale | Inspection-local assembled pose independent of entry mode. Shaft already present; related planets/cages fade in and spin coherently, then remaining revised study assembly returns. Hold with Return to narrative. |

### Cutter choreography and camera

Use a disc/pinion-style shaper appropriate to measured gear data. In the machine frame it has radial infeed, axial cutting stroke, relieved return and correctly coupled cutter/workpiece generating rotation. Do not animate an end mill following a finished tooth profile. The quarter-orbit appearance is authored in the rotating shaft reference frame: camera follows shaft azimuth while the real cutter spins and strokes. Ease that frame-follow rate to zero during the slowdown, ending in a fixed machine-frame clearance view. Solve signed rotation ratios from real tooth counts; do not copy an unsigned review formula into production.

One master inspection playhead samples both a continuous machining-time map and authored camera curves. Slowdown changes machining speed, never tool/shaft/chip phase or pose continuity. Frame-follow azimuth is derived from machining phase; dolly/FOV progress on the master playhead so the zoom keeps moving while machining slows, then settles into the stable macro. All curves are deterministic closed-form/baked lookups; there is no separate running clock or cumulative camera integration, and no independent damping that loses the cutting edge. A deliberate slow interval/readable bottom-of-cut beat is artistic compression, not a machine cycle-time claim. Place one restrained chip at the shaping rake face only where stock is removed. Hobbing may show direction-correct chips where useful; none are needed in a wide framing. No sparks.

Derive cutting stroke toward the relief and relieved return away from it from measured geometry. Check signed pitch-circle rolling/contact velocity to catch reversed generating ratios. Key/grazing light/environment orientation follows the same authored reference-frame weight as the camera during shaping; switch smoothly into fixed machine-frame lighting so reflections do not reveal an inconsistent shaft spin. Hobbing deliberately shows the shaft visibly rotating. Keep shaper-stroke and hob-gash display frequencies readable for the observed tier; a provisional ceiling of ~one quarter of tier frame rate must be measured or replaced by deliberate softened high-speed appearance.

Keep the projected shaft axis and cutter exit region continuous during the rotating-frame to machine-frame camera handoff. Ease follow rate down before the cutting edge reaches the face end. Frame face edge, cutter edge, relief and chip origin together. Give at least 1.2 s of stable-camera slow action covering exit and relieved return, including approximately 0.4 s with unmistakable clearance. No camera cut or independent tool freeze at that event.

The hob prop, starts, setting angle and measured swept envelope must be compatible with the accepted 6 mm authored lead-out. Record the dimension type and datum: do not reinterpret construction radius as axial travel or usable clearance. That construction radius is not automatically a verified physical OD for a tilted production tool. Preserve accepted geometry; select a compatible illustrative tool representation and framing when production tooling is undocumented. Cropping simplifies explanation but cannot establish clearance or conceal an intersecting swept envelope. Validate the complete represented tool through cutting, return and withdrawal; never show a larger cutter clipping the shifted journal. Record minimum separation and combined measurement/export uncertainty; positive clearance must exceed that uncertainty. Keep an unobstructed tooth-runout/retained-section view for at least 0.8 s after tool withdrawal, before the cool illustration appears.

### Mesh progression and stress illustration

**Shaping stock and progression (Opus B1 resolved):** identify/hash the legacy P001835-2 occurrence in `Default.glb` and the isolated grooved `C:/Projects/CAD/jgun-input-shaft-hobbed/p001835-source-extract.glb` in G0; verify their correspondence. Create a separate derived **grooved shaping blank** by restoring stock in the tooth-space region to the measured tip-diameter OD, preserving the source relief, journal and shared datum. Do not start the cutting shot on an already fully toothed shaft. Offline-bake full-depth and partial-depth shaping states or complementary capped masks from the measured cutter engagement. Radial infeed visibly removes stock; chips arise from that current cutting region. Reveal completed tooth spaces only behind actual generating engagement, with the partial-depth zone under the cutter. The first quarter-orbit therefore shows only the portion actually worked.

Implementation notes from the final SHIP pass: swap narrative teeth to the grooved blank while hidden/masked by the isolation fade, so teeth never visibly disappear. Apply lite-floor strobing checks to the compressed recap. If G0 cutter tooth count/ratio changes, re-bake its engagement-driven shaping states. Assert the card strings character-for-character, including ASCII hyphens.

At 11–15 s the recap re-engages the shaft-follow frame through the same deterministic authored azimuth law, showing rapid strokes and a comparatively slow apparent orbit. Complete the remaining circumference in a visibly time-compressed recap (caption **Remaining teeth — time compressed**); extend this beat if needed. If completion must be omitted for performance, use an explicitly captioned time skip during retraction instead of silently appearing teeth. All ten complete teeth match the hashed grooved final source before the first material card. G2 owns grooved blank/intermediate states as well as revised hobbing states; G4 verifies stock removal/contact and honest completion through direct seek and playback.

**Revised hobbing stock:** produce a separate sound smooth blank aligned with the approved revised shaft; restore final teeth/lead-out through bounded offline-baked cutting states or complementary capped clipping masks. No runtime CSG for either process. Hobbing is continuous generating action: every tooth space participates as the workpiece rotates, so the reveal band advances along the face around the circumference. The partial-depth zone stays inside visible tool engagement and does not run ahead. At final feed position the represented swept envelope coincides with the approved runout. Preserve final profile, 10-tooth count, pitch/clocking and support datum. Differing topology does not authorize a blind vertex morph.

The grooved shaping state depicts the owner-described earlier design; label its historical reconstruction illustrative unless authenticated failure-revision geometry is available. P001812 supplies process context only. Transitioning to **Revised blank — retained section** means a different design/workpiece; machining cannot put back material removed by the previous groove. Keep the shared axis/datum fixed through the wipe. The groove stays unchanged through all three failed-material attempts; geometry changes only at redesign. A restrained grazing reflection reveals the hobbed band without competing with the tool.

Keep text as readable DOM, with exactly these cards in order:

1. **AISI 4140 (40-45 HRC)**, then **FAILED**.
2. **AISI 4340 (48-50 HRC)**, then **FAILED**.
3. **C300 (56-58 HRC)**, then **FAILED**.
4. **AISI 4340 (H.T. 48-50 HRC)** alongside the revised section, with no FAILED/PASSED stamp.

Attribute the first three to the owner's account in one restrained, readable caption. Warm/cool field caption: **Illustrative stress concentration**. Same color vocabulary in both states; localized overlay retains metallic surface edges and geometry. No numeric FEA scale, safety factor, solver contour legend or implied certified safe state. No invented load/testing results. Place the final 4340 card exactly where the earlier 4340 card appeared: the material repeats while the geometry changes. Stamp the DOM lettering with a short local compression/settle; the camera and page remain steady.

Hold shaft, groove and card slot registered across material attempts. Use ~2.8/2.5/2.3 s beats, including a distinct fade-out before the next card. Preserve ≥1.0 s readable alloy text before FAILED, local impulse ≤180 ms and ≥0.8 s settled afterward. Keep owner attribution readable throughout. These are timing/readability anchors, not measured results. Pin ASCII hyphens in hardness ranges exactly as the owner wrote; never let typographic normalization break copy assertions. Warm and cool overlays each enter with one restrained axial scan; hold their stable field afterward and use no solver-like animated rainbow.

### Support comparison and train return

Final assets already include the shift. End pose equals the approved export; start pose equals measured legacy pose, with signed delta +2.75 mm in shaft-local Y. Derive transforms through saved `shaft_world_matrix.json`, the measured Blender-export-to-runtime-root registration and one explicit millimetre-to-metre conversion. Record the actual Z-up/Y-up mapping or existing exporter conversion so it is not applied twice. Never apply the displacement twice, derive directions from stage names, or independently slide mesh-built journal/groove. Use a capped camera-facing section of shaft AND P000725 to expose the pair, with legacy position witnesses; this is a design comparison. Housing occupies its accepted position/shape, not a translating member. Sweep-check the comparison slide; where intermediate solid designs overlap, use ghost/legacy-housing witness presentation rather than pretending physical assembly clearance.

Measure both support origins in the same shaft-local frame. The pair preserves its relative transform throughout. Target +2.750 mm local Y, with zero intended local X/Z movement or rotation; record export-derived numerical tolerance before implementation, not a visually convenient tolerance. Independently check housing, journal and groove for unintended movement, and endpoint agreement after seek/replay. Establish witnesses for at least 0.5 s before movement and hold the approved endpoint for at least 0.8 s before removing them.

**Finale composition (Opus B2 resolved):** build the shaft study in its own inspection-local **assembled solid pose**, independent of blueprint/exploded entry and current narrative explosion. Register revised parts and all selected legacy neighbour clones in that same assembled root before reveal. Prefer inspection-owned clones/named bundle; if narrative objects are reused, lease their complete parent/local transforms, visibility and materials, temporarily pose them to the inspection assembled frame, then restore them exactly on exit. Never reveal revised assembled supports among frozen exploded cages. The ring keeps its existing saved-composition behavior.

Remove witnesses before spin. K000211 follows shaft; housing and bearing outer race remain fixed. Inner race follows shaft only where separable/verified; unsplit bearing must not rotate as a solid assembly. Measure tooth clocking/planet compatibility first. Existing cage progression and planetary convention remain canonical; display turns are not exact machining rates. Fade related planets/cages then the rest of the assembled study, with no duplicate shaft. On Return/Escape restore every leased transform/render state and saved narrative geometry/mode/idle phase. Assert **exploded entry → assembled study finale → Return to identical exploded context**, and corresponding blueprint restoration, including background/lights/post snapshot. Closing caption explains revised study versus original saved narrative.

Finish assembly reveal with ≥1.5 s settled framing, then hold indefinitely with Return. Extend the approximate 43–45 s duration if contact, clearance, fades or endpoint reads do not fit; do not sacrifice them to the initial target.

## 5. Architecture and bounded ownership

Inspect these existing files before changing interfaces: `src/state/inspectionStore.ts`, `src/components/RingInspection.tsx` and CSS, `src/scene/inspection/{InspectionScene.tsx,timeline.ts,narrativeFade.ts,loadLease.ts,compileLease.ts}`, `src/scene/CameraRig.tsx`, `src/scene/TorqueWrenchHero.tsx`, `src/scene/rig/{nodeRoles.ts,materials.ts}`. Existing `INSPECTION_DURATION = 12`, ring-only fields and `__inspection` telemetry are assumptions to generalize explicitly.

Define `kind: ring | shaft`, per-story duration/chapter/asset descriptors and a reusable lifecycle/restore envelope. Keep ring sampler/geometry adapters separate from shaft sampler/tooling/stress/support adapters. Use one mutable playhead read in `useFrame`; no React state subscriptions or allocations per frame. DOM changes only at discrete control/caption state boundaries. Seek/pause/replay/reverse sample absolute state; avoid accumulated cutter angle, cut history or particles. Allocate scratch transforms once and dispose all instance-owned geometry/materials/tools on exit.

Capture part identity before destructive consolidation or use a named lightweight inspection bundle. Default consolidation merges some source parts into shared clutch/material buckets; do not hide a whole merged bucket to isolate the shaft. Registry includes occurrence path, part number, original and approved transforms, source hashes and extraction provenance. Use scene-instance materials; modifying a cached source material can corrupt the narrative. Preserve the existing ring `__inspection` contract or deliberately version the verifier with backward compatibility during migration. New shaft telemetry belongs in a clearly versioned manufacturing-inspection contract.

Suggested disjoint worker scopes after interface agreement:

| Work | Ownership | Independent evidence |
|---|---|---|
| Lifecycle/control | store, DOM shell, scroll pause/restore, camera lease | loading/error/exit/focus/context round trips |
| Asset/tool preparation | derived CAD/export scripts and inspection assets | hashes, profile/clocking, envelope/fit, compression error |
| Shaft sampler | new shaft timeline/process camera-data/tool/mesh state adapter | deterministic seek/reverse, continuous phase, exact deltas |
| Ring refinement | ring sampler/contact/material adapter | OD/land/bore masks, contact/retract, display-speed check |
| Runtime verification | inspection verifier and contract evidence | actual rendered checkpoints plus live telemetry |

One integration owner changes shared `CameraRig`, `TorqueWrenchHero` and `InspectionScene`; workers never concurrently edit those files. Use the live model tool schema/CLI rather than stale skill model IDs.

## 6. Geometry, performance and accessibility gates

Before tooling animation, locate/hash accepted sources, measure legacy/final datum transforms and export placement, and check every neighbour including K000180-1. Resolve source-report versus handoff lead-out endpoint mismatch by measuring the actual mesh, then test swept cutter envelopes at cutting and return strokes. The informal 0.14 mm separation is not a moving-tool clearance measurement. Repair the reported single non-manifold edge and streaky normals only in derived copies, preserving approved silhouette and fits.

Tag every physical datum **measured / illustrative / unresolved** with provenance and its dependent gate. Unresolved tool, rotation or clearance data prevents an unsupported mechanical-truth claim but does not reopen the approved concept or geometry. Artwork cannot substitute for the measured swept envelope.

Generate compressed full/lite study exports through Blender with stable named parts, not bare `gltfjsx --transform`. `Default.glb`, M249 and enclosure remain untouched. Preflight freezes measured budget: target new shaft bundle ≤2 MiB compressed, shaft ≤50k triangles full/≤15k lite, and ≤25 added inspection draw calls over corresponding baseline. These are implementation targets, not current measurements. Inspect final-camera profile/runout preservation after reduction; adjust documented budgets only with measured visual/performance evidence and cross-provider reviewer agreement. Target full-tier p95 ≤16.7 ms on the named GPU; lite must remain readable at 30 fps. Record device, tier, DPR, bytes, calls and GPU/frame statistics; screenshots cannot establish those quantities.

Separate frame interval, CPU work and GPU timing in performance reports. Calculate percentiles over active machining/assembly intervals; long held frames must not improve the motion statistic. State unavailable timing APIs explicitly rather than filling them with frame interval. Test visible repeated-feature motion at the lite floor for strobing/apparent reverse rotation.

Mobile uses a measured horizontal shaft frame above a fixed DOM card slot when vertical framing would hide the cutter exit. Readable targets at least 44 CSS px; no text/tool overlap at 390×844. Static reduced/poster story contains aligned cutter-exit/groove still, three material failure cards, blank/hobbed comparison, cool illustration, support-before/after and a still assembly. Do not load heavy tools just to show static captions. Fallback must remain operable on denied CAD fetch and real WebGL context loss.

Render budgeted full/narrow raster stills from accepted blockout cameras with text alternatives; static fallback needs neither a working WebGL context nor CAD downloads. Measure caps/detail-strip cost on lite rather than assuming stencil caps are free.

## 7. Build sequence and adversarial reviews

Planning completed here; all implementation boxes remain open.

- [ ] **G0 — Freeze and measure.** Record current dirty/staged ownership, asset hashes, part registry, camera/contact dimensions, placement deltas, tooth clocking, neighbour interference and tool convention/envelopes. Record unresolved machining details without guessing. Preserve accepted CAD. Produce camera blockout and budget baseline.
- [ ] **G1 — Shared shell and restore.** Extend existing ring lifecycle only after interface agreement. Prove entry/loading/pause/seek/chapter/replay/Return/Escape/focus and exact saved-state restore. Keep both stories JGun-only and no global scroll/ladder delta. Run fresh opening iteration regression.
- [ ] **G2 — Assets and tooling.** Named full/lite bundle; hashed grooved source, grooved shaping blank and engagement-driven partial/full cutting states; separate revised hobbing blank/states; shaper/hob props, assembled study root, retained-part registry, raster fallback and capped transitions. Validate compression profile error, swept clearance and no double shift.
- [ ] **G3 — Ring refinements.** Establish both contacts; contact-driven knurl progression; clearance then retract/fade; legible final black relief, with no bore/land contamination.
- [ ] **G4 — Shaft shaping/materials.** Engagement-driven stock removal, quarter-orbit frame transition, deterministic machining/camera time maps, readable exit/chip/return, resumed slow apparent orbit during rapid-stroke recap, explicitly compressed completion to all ten teeth, three exact cards and local stamps. Verify unchanged groove before redesign and no cutting of empty finished slots.
- [ ] **G5 — Hobbing/support/finale.** Progressive generating band, correct tool/shaft phase, retained section/cool illustration, final 4340 card, support pair comparison, coherent revised assembly return and explicit narrative restoration.
- [ ] **G6 — Fallback, runtime, final acceptance.** Fresh production build, static and runtime checks, complete review packet, provider-diverse adversarial reviews, owner runtime visual acceptance. No task closure from historical tests or this plan's reviews.

For each leaf, the producer supplies actual diff/assets, verification commands/results and captures/telemetry. A fresh-context reviewer from a **different provider** returns **ship / fix-first / rethink**, with exact findings and evidence. OpenAI GPT-6.1-Sol work can be tested by Anthropic Sonnet-5.5 or Z.ai GLM-5.3; Z.ai GLM-5.3/Flash work by OpenAI or Anthropic; DeepSeek work by OpenAI/Anthropic/Z.ai. GLM-5.3 reviewing GLM-5.3-Flash is not provider diversity. Use Flash models only where the mechanical/visual judgment is bounded and sufficient. Do not silently substitute unavailable models.

The producer/reviewer provider must differ for **every** leaf, including Anthropic-produced work (reviewed by OpenAI/Z.ai/DeepSeek) and the integration owner's shared-file diff. Mechanical reviewers independently rerun measurement scripts on the hashed inputs, not merely read reported numbers.

Record requested and observed model/provider/effort separately, including routing request IDs; usage is partial if parent data are absent. Reviewer sees the spec, actual diff and evidence, not the producer's self-review. Fix every blocking finding, rerun affected checks, then obtain a fresh reviewer verdict. At final integration use adversarial mechanical, lifecycle/accessibility and visual/performance passes; one reviewer can cover several axes if evidence supports it. Parent independently verifies; technical SHIP does not replace Mark's runtime visual acceptance. No commit/push/deploy is requested by this plan.

## 8. Implementation validation packet

Proportional static checks after code/assets change: `npm run typecheck`, affected meaningful unit tests, full `npm test` at integration, `npm run build`, `node scripts/check-b1b2-contract.mjs`, `npm run check:station2`.

Restart the :4173 preview after **every rebuild**. Existing ring check: `node scripts/verify-ring-inspection.mjs --url=http://localhost:4173 --out=<evidence-dir>`. Extend it or add a shaft verifier once the telemetry contract exists. Opening iteration: `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199` against a confirmed full-tier GPU/dev session; full six-case opening roster only at final integration. A forced-lite capture is valid for lite proof, not full-tier proof; the prior failed run is not an opening regression finding.

Record desktop+narrow, cold/delayed load, blueprint and exploded entry, reduced-mobile, poster/context-loss, every chapter direct seek, reverse/round-trip checkpoints, replay and exit during load/motion/error. Validate live canvas/epoch and actual rendered target regions alongside telemetry. Assert cutter/face/groove visibility and chip placement, exact card content/legibility, OD-only knurl, capped wipe, final ten teeth/profile, bearing/ring +2.75 mm delta with no duplicate offset, correct race/planet/shaft motion, no unsupported FEA labels, and exact context restoration. Include zero console errors, repeated-entry resource census, named performance measurements, and final same-camera before/after/rendered phases for Mark's review.

After warm-up, run five complete entry/exit cycles with no monotonic growth in inspection-owned resources. Test delayed-load → Return → immediate re-entry for stale attachment/camera takeover; manually paused → hidden → visible stays paused. Compare direct seek with continuous playback at the same time/session, including contact, cutter exit, support endpoints and narrative restoration. Rendered captures and telemetry must come from the same settled playhead/session.

Visual reviewers receive short frame sequences of shaping/slowdown, stamps, hobbing and support slide as well as still anchors. Supply contrast-normalized diagnostic crops and region statistics alongside the original dark frames; diagnostic enhancement is not the delivered appearance. Assert generating pitch-point relative velocity with recorded tolerance, engagement-driven shaped/hobbed progression, and the exploded/blueprint entry → assembled shaft finale → full-state restore round trips. Final visual acceptance uses original frames and motion, never vision alone.

Any canonical behavior change discovered during implementation must update animation-spec §5 tables, README ladder and both rig-skill tables in the same commit; this plan intends no ladder change. Record technical proof, rendered visual review and owner acceptance separately.
