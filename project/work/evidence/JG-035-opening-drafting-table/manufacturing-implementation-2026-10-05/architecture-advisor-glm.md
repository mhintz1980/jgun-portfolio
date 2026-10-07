**Verdict: Ship** the lifecycle contract freeze (W1 verified live); **fix-first** before any G1 runtime acceptance. No rethink.

The architecture is sound and half-real. [inspectionStore.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/state/inspectionStore.ts) already delivers idempotent `exitInspection`, epoch-scoped fail/seek/suspend, stamp-idempotent `advanceInspectionPlayhead`, with tests. [story.ts](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/story.ts) freezes ring metadata and throws on unregistered shaft — no placeholder runtime, per the parent review's clarification. Sole CameraRig writer, isolated gearbox-local study, and negative-priority playhead are correctly specified.

Blockers, all inside the already-planned W2 change:

1. **Two playhead writers once the -10 driver mounts.** The legacy advance in [InspectionScene.tsx](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/InspectionScene.tsx:100) writes `entryElapsed`/`time` directly; removing it must land in the same commit that installs `InspectionDriver`, or every frame double-advances.
2. **Stale-ready write.** InspectionScene.tsx:73 sets `inspection.status = 'ready'` directly, bypassing `setInspectionStatus`'s epoch guard — a late tool fetch can flip a newer session ready. Route it through the store.
3. **CameraRig debt.** [CameraRig.tsx](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/CameraRig.tsx:200) still embeds ring framing math, and :226 computes `restoredPoseError` immediately after copying the snapshot — always 0 (F5 live). Move ring math into the ring runtime; measure one frame after restore.
4. **Restore envelope gaps.** Hide set is captured once (InspectionScene.tsx:189-191, F7); the 15 s timer (:171) and boundary catch (:219) pass no epoch and ignore suspend (F14) — hidden time can still fail a load.
5. **U1 unproven.** R3F negative-priority ordering is read from source, not exercised; V2 must pass in a test canvas before W2 merges — the whole frame ordering rests on it.

G0 tool compatibility stays open: no machining claim may pass; lifecycle proceeds independently, as the contract allows.

