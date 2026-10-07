**PLAN VERDICT: ready-with-refinements.**

The concept, narrative and ownership boundaries are coherent. Keep the owner’s four cards verbatim, the approved 6 mm lead-out and +2.75 mm shaft-local Y relocation, the shared inspection lifecycle, and explicit restoration of the original narrative. The following edits resolve ambiguities and sharpen presentation without reopening those decisions.

**Substantive mechanical, lifecycle and measurement edits**

1. **§3, 10.5–12 s row — distinguish the closing composition from exiting inspection.**

   Replace with:

   > Register the finished ring with the saved assembly composition while retaining inspection ownership and a frozen narrative. Hold the finished state and controls. Only Return or Escape releases inspection ownership and restores narrative playback.

   “Restore narrative visibility” currently leaves room for premature lifecycle restoration. Showing the assembly is compatible with remaining inside inspection; resuming it is a separate action.

   **Acceptance:** reaching 12 s leaves inspection active and the narrative clock frozen. Return/Escape performs exactly one restoration.

2. **§4, “Mesh progression and stress illustration” — identify the historical depiction and the new workpiece.**

   Insert:

   > The grooved shaping state is an illustrative reconstruction of the owner-described earlier design unless authenticated geometry is available. P001812 supplies process context only. The transition to the revised blank represents a different design/workpiece; it must not suggest that machining restores material removed by the earlier groove.

   Add a restrained transition caption: **Revised blank — retained section**. Preserve the aligned axial wipe and all exact material cards.

   **Acceptance:** the groove remains unchanged through all three failed-material attempts. Geometry changes only at the redesign beat. No caption presents an illustrative historical mesh as an authenticated revision.

3. **§4, “Cutter choreography,” and §6 — separate visible framing from physical clearance.**

   Replace “select a matching representation/crop” with:

   > Select a compatible illustrative tool representation and framing. Cropping may simplify the explanation but cannot establish clearance or conceal an intersecting swept envelope. Validate the complete represented tool throughout its cutting, return and withdrawal motions.

   Also insert:

   > Record the dimension type and datum associated with the approved 6 mm authored lead-out. Do not reinterpret a construction radius as axial travel or usable clearance.

   **Acceptance:** clearance evidence includes the swept envelope, minimum separation and combined measurement/export uncertainty. Positive clearance must exceed that uncertainty. Undocumented production tooling remains explicitly illustrative.

4. **§4, “Support comparison,” and §8 — make the displacement assertion unambiguous.**

   Insert:

   > Measure both support origins in the same shaft-local coordinate system. The final transforms are the approved export transforms; the comparison starts from measured legacy positions. The pair preserves its relative transform throughout the slide.

   **Acceptance:** target displacement is **+2.750 mm in local Y**, with zero intended local X/Z displacement and rotation. Record an export-derived numerical tolerance before implementation; do not substitute a visually convenient tolerance. Check the housing, journal and groove independently for unintended movement. The approved endpoint must match even after seek/replay.

5. **§2 and §5 — complete the interruption and ownership contract.**

   Insert:

   > Every entry has a session identifier. Late load/compile completions from a closed session cannot attach objects, acquire camera ownership or change controls. Exit is idempotent. Dispose instance-owned resources while releasing, rather than destroying, shared cached resources. Visibility recovery resumes only the playback state allowed by the recorded pause policy.

   Add:

   > Seeking samples the visible chip, stamp and tool state deterministically; it does not replay audio impulses or accumulate particles. Chapter entry must establish its complete geometry, lighting, captions and camera state without prior playback.

   **Acceptance:** delayed loading followed by Return and immediate re-entry produces no stale attachment or camera takeover. A manually paused inspection stays paused across document hiding. Direct seek and continuous playback produce equivalent sampled states.

**Concrete art-direction edits**

6. **§2 — add a shared composition and light rule.**

   Insert:

   > Use one broad neutral key and a narrow grazing reflection to describe machined edges. Keep the background near black, with enough separation to preserve the dark silhouette. Stress color remains a localized overlay. Reserve camera movement for changing the explanation; hold the camera still when the viewer must judge contact, clearance or a dimension.

   **Acceptance:** critical contours remain readable in both final materials. Card text meets 4.5:1 contrast. Tool, contact region and DOM cards remain separate at 390×844, with roughly 8% framing margin around the critical action.

7. **§3 — refine contact establishment and the final black reveal.**

   Add to 2.8–4.2 s:

   > Settle into a slightly oblique view that exposes both roller contacts. Hold this composition for at least 0.3 s after contact is established and before axial traverse starts.

   Add to 8.2–10.5 s:

   > Complete deceleration before the final read. Let one slow grazing reflection cross the worked band, then settle the lighting so the relief remains visible without continued motion.

   Replace “cutting/contact macro” with **forming/contact macro**.

   **Acceptance:** knurl appears only within the swept worked region; bore and lands remain clean. Fade begins only after measured roller clearance. The finished black ring receives at least one second of stable, readable presentation.

8. **§4, shaping overview and slow exit — make the camera handoff perceptually continuous.**

   Insert:

   > Keep the shaft’s projected axis and cutter exit region continuous as the camera changes from shaft-following to machine-frame observation. Ease the follow rate down before the critical cutting edge reaches the face end. Frame the face edge, cutter edge, relief groove and chip origin together.

   **Acceptance:** provide at least **1.2 s of stable-camera slow action** showing exit and relieved return, including approximately 0.4 s where the clearance relationship is unmistakable. Slow the shared process clock coherently. Avoid a camera cut or independent tool freeze at the decisive event.

9. **§4, material attempts — give each card a deliberate reading rhythm.**

   Insert:

   > Keep the shaft, groove and card slot registered across all three attempts. Each alloy card becomes fully readable before FAILED arrives; the stamp compresses locally and settles without page or camera movement.

   **Acceptance:** within each approximately 2.2 s beat, allow at least **1.0 s before the stamp**, a stamp impulse of **180 ms or less**, and at least **0.8 s settled afterward**. Keep the owner attribution readable across the sequence. Preserve every alloy, hardness range and final heat-treatment label exactly.

10. **§4, redesign, hobbing and support/finale — separate the causal reveals.**

    Insert:

    > During the blank wipe, hold the shared axis and datum fixed. During hobbing, let a restrained grazing reflection reveal the advancing tooth band without competing with the tool. After withdrawal, hold the runout and retained section before introducing the cool illustration. In the support comparison, establish legacy witnesses before movement and hold the approved endpoint before removing them.

    **Acceptance:** reserve at least **0.8 s for unobstructed runout/section inspection**, **0.5 s before the support slide**, and **0.8 s at its endpoint**. Remove witnesses before train rotation. Complete the assembly reveal with at least **1.5 s of settled framing**, then hold indefinitely with Return available. Extend the approximate 40 s duration if these reads do not fit.

**Implementation prerequisites, separately**

These are G0/G2 evidence tasks, not reasons to reconsider the agreed concept: source hashes, legacy transforms, tooth counts/clocking, tool starts and setting angle, bearing-race separability, neighbour interference, derived-mesh repair, compression error and camera blockout. Record each as **measured / illustrative / unresolved**, with its dependent gate. Unresolved physical data must prevent unsupported mechanical claims.

In **§6 and §8**, define performance statistics precisely: separate frame interval, CPU work and GPU timing; calculate motion performance over active machining/assembly intervals so long holds cannot improve the reported percentile. Retain the existing full-tier target and verify lite readability at 30 fps.

Add five entry/exit cycles after warm-up to the resource census, requiring no monotonic growth in inspection-owned resources. Pair rendered checkpoints with telemetry from the same playhead/session, especially at contact, cutter exit, support endpoints and narrative restoration.