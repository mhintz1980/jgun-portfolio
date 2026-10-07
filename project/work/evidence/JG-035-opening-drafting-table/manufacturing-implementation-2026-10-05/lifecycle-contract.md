# G0 lifecycle contract: ring | shaft manufacturing inspections

Frozen 2026-10-05 against live (dirty, staged) source, three 0.185.1. Line numbers are live-source anchors. This is an interface and ownership contract, not a runtime claim. Gate: gates/lifecycle-contract.md. Plan: docs/jgun-manufacturing-inspection-plan.md section 5.

## 1. Source findings that force the design

| # | Finding | Anchor | Consequence |
|---|---|---|---|
| F1 | Store is ring-only: no kind, no per-story duration; 12 is hard-coded. | inspectionStore.ts:4,7-12,54; InspectionScene.tsx:89,101,102,109,175 | Duration and ownership come from the descriptor and sampled frame. |
| F2 | exitInspection is not idempotent: it re-applies entry via setScrollState on every call and never clears entry. Escape, Return and the staticMode effect can all call it. | inspectionStore.ts:46-51; RingInspection.tsx:50,86,96 | A second exit after the visitor scrolled resets progress/mode to stale values. Exit must be a no-op unless active. |
| F3 | Ring session ownership ends at t>=12 while active stays true: fade/visibility restored, camera blend 0. Plan wants ownership held until Return. | InspectionScene.tsx:175,206-209; CameraRig.tsx:201 | Ownership predicate becomes inspection.active (not time). Ring keeps its pose-return blend. |
| F4 | CameraRig reads inspection.time before InspectionScene advances it each frame: camera lags geometry by one frame. Mount order is unsafe: TorqueWrenchHero is Suspense-mounted, so its subscriber registers late. | CameraRig.tsx:200 vs InspectionScene.tsx:99-104; SceneCanvas.tsx:364-385 | One playhead driver at negative useFrame priority (runs before every priority-0 writer; negative priority does not take over rendering; positive does, and the composer already holds renderPriority 1). |
| F5 | CameraRig.restoredPoseError is computed after copying the snapshot into the camera: always 0. | CameraRig.tsx:221-226 | Restore telemetry must compare live pose against the entry snapshot in a later frame. |
| F6 | StudioRig rewrites lights and scene.environmentIntensity every frame; FxDriver rewrites bloom/aberration/DoF every frame. Late-writer-wins is order-dependent. | SceneCanvas.tsx:141-168 (167); PostProcessingComposer.tsx:105-169 | Both need one explicit lease gate. Background (351), fog (352), environment ref (53) are written once, so they need snapshot/restore. |
| F7 | InspectionScene hides non-hero scene children once, on the first frame hero exists. Later-mounted children (Suspense, backdrop) stay visible. Hide map restores recorded visibility. | InspectionScene.tsx:176-192,205-208 | Re-check scene.children.length each frame; hide unseen non-owned children; restore recorded values. |
| F8 | inspectionFailed is unconditional in InspectionBoundary and timer paths; only loadLease.fail is gated. A stale boundary error can fail a newer session. | InspectionScene.tsx:171,219; inspectionStore.ts:58; loadLease.ts:7 | Failure takes the epoch of the reporter and is dropped if stale. |
| F9 | Inspection assets are never compiled before play; the tool GLB compiles on first visible frame. Existing leased compile pattern exists for stations. | InspectionScene.tsx:73; SceneCanvas.tsx:193-227; compileLease.ts:5 | Add compiling status and a session-scoped compile plus 1px warm render before ready. |
| F10 | P001835 is merged into the clutch-static bucket (key unit|role|ghost), originals removed from the tree. Cached rig is reused on remount. K000210, K000211, P000725 have no src reference. Planets/cages survive as intact unit groups. | nodeRoles.ts:65,265-268,499,520-556,591,194 | Shaft, housing, bearing, retaining ring cannot be isolated post-merge. They come only from the derived named bundle. Cages/planets are cloned from rig.stages groups at rest (basePositions), not current (exploded) positions. |
| F11 | Ring geometry bakes unit.matrixWorld at mount, so it depends on the exploded entry pose. | ringGeometry.ts:8-14,54; InspectionScene.tsx:21 | Ring keeps this. Shaft study never reads narrative world matrices. |
| F12 | Hero timeline hold/restore uses subscribeInspection plus totalTime(savedTime,true); scroll and drawing state are frozen; first inactive frame is skipped. | TorqueWrenchHero.tsx:142-159,279-282 | Keep. Adapter must not call notifyInspection per frame (it re-enters this subscriber). |
| F13 | Context loss forces poster tier, which unmounts the canvas; RingInspection exits via the staticMode effect. There is no restored handler. | SceneCanvas.tsx:332-335; qualityStore.ts:74; RingInspection.tsx:86-87 | Treat loss as terminal exit through the same idempotent exit; no GL cleanup may be assumed to succeed. |
| F14 | No visibilitychange handling exists in the inspection path. Frame delta is clamped to 0.05, so rAF stops implicitly, but the 15 s load timer and any audio use wall time. | InspectionScene.tsx:99,171 | Explicit suspend reason; timers and audio gated on it. |

## 2. Story descriptors (new file src/scene/inspection/story.ts, owner W1)

~~~ts
import type { Color, Vector3 } from 'three'
export type StoryKind = 'ring' | 'shaft'
export type StoryId = 'ring-p003068' | 'shaft-p001835'
export interface StoryChapter { id: string; label: string; start: number; end: number }   // seconds, start<end, contiguous
export interface StoryAsset { id: string; url: string; tier: 'full' | 'lite' | 'both'; required: boolean; maxBytes: number; sha256: string | null }
export interface StoryDescriptor {
  readonly id: StoryId; readonly kind: StoryKind; readonly version: 1
  readonly duration: number                       // seconds; replaces INSPECTION_DURATION (timeline.ts:1)
  readonly chapters: readonly StoryChapter[]       // ring: one chapter 'finish'; shaft: the four plan chapters
  readonly assets: readonly StoryAsset[]           // ring: knurling-tool.glb (InspectionScene.tsx:51); shaft: manufacturing bundle
  readonly entryWindow: readonly [number, number]  // paced progress where the DOM entry is offered (ring: 0.12-0.525, RingInspection.tsx:90)
  readonly staticAlt: string                       // key into the DOM-only static story; must need no GL and no CAD fetch
  create(session: StorySession, ctx: StoryContext): StoryRuntime
}
export interface StoryContext { gl: import('three').WebGLRenderer; scene: import('three').Scene; hero: import('three').Object3D; rig: unknown /* WrenchRig */; tier: 'full' | 'lite'; aspect: number }
export interface StoryFrame {            // preallocated by the runtime, mutated in place
  time: number; chapter: number; phase: string; discrete: number   // discrete = integer key; DOM updates only when it changes
  narrativeAlpha: number                  // 1 narrative fully visible, 0 hidden
  returnBlend: number                     // ring: ease((t-10.5)/1.5) (timeline.ts:24); shaft: always 0
  ownsNarrative: boolean                  // true for the whole session (never derived from time)
}
export interface InspectionCameraSample { valid: boolean; position: Vector3; target: Vector3; up: Vector3; fov: number }
export interface StoryRuntime {
  readonly frame: StoryFrame; readonly camera: InspectionCameraSample; readonly render: RenderSample
  sample(time: number): void              // PURE in time: no read of previous time, no accumulators, no allocation
  apply(): void                           // writes meshes/materials/lights owned by this runtime from the last sample()
  telemetry(out: Record<string, unknown>): void
  readonly resources: { geometries: number; materials: number; textures: number; meshes: number }
  dispose(): void                         // instance-owned only; idempotent
}
~~~

Rules:
- sample(t) after any call sequence equals sample(t) from a fresh runtime (digest equality, section 9 V3). No cumulative cutter angle, chip history, particle state or stamp timers. Chips and stamps are closed-form functions of t with fixed seeds.
- Audio, if enabled, is edge-triggered by the playhead driver only when advancing by playback. Seek, chapter jump and replay never fire cues.
- Ring adapter: sampleInspection (timeline.ts:13-26) and the ring mesh/tool code in InspectionScene.tsx:96-154 move behind a ring StoryRuntime unchanged in behavior. The ring descriptor reports duration 12.

## 3. Session, load, cancel, compile (new src/scene/inspection/session.ts, owner W1)

~~~ts
export interface StorySession {
  readonly id: number                       // === inspection.epoch at creation
  readonly kind: StoryKind
  readonly signal: AbortSignal              // aborted by cancel(); pass to every fetch (pattern: InspectionScene.tsx:49-56)
  current(): boolean                        // !cancelled && inspection.active && inspection.epoch === id (loadLease.ts:6)
  fail(error: unknown): void                // dropped unless current()
  own<T extends { dispose(): void }>(r: T): T      // disposed once on cancel
  borrowShared(key: string): () => void     // refcount a cached resource; release never disposes it
  cancel(): void                            // idempotent; aborts, disposes owned, releases borrowed
}
export function createStorySession(kind: StoryKind): StorySession
export function inspectionLoadLease(epoch: number): ReturnType<typeof legacyLease>   // kept with identical behavior until ring migrates; lifecycle.test.ts:34-43 must stay green
~~~

- A late fetch or parse result must check session.current() before attaching anything. If stale, dispose it immediately (pattern: InspectionScene.tsx:58-62).
- inspectionFailed(error, epoch?: number) in inspectionStore.ts:58: if epoch given and epoch !== inspection.epoch, ignore. InspectionBoundary and the 15 s timer pass their epoch (InspectionScene.tsx:171,219). The 15 s timer measures visible time only (suspend must pause it).
- Status becomes 'idle' | 'loading' | 'compiling' | 'ready' | 'error'. Entering ready requires: all required assets parsed, then prepareStudy resolves true, then one 1px offscreen warm render, then session.current() again. The DOM treats compiling as loading. Return/Escape remain enabled in every status.
- prepareStudy(session, gl, scene, camera, studyRoot): follow SceneCanvas.tsx:193-227. Attach studyRoot, apply the lease-hidden narrative light state first (so the compiled light count equals the runtime count), call compileWithLease (compileLease.ts:5) with () => !session.current(), then the warm render with flags restored in finally. three 0.185.1 compile(scene, camera, targetScene) uses traverseVisible for lights, so visibility is part of the cache key. Verify with V5, do not assume.

## 4. Store extensions (owner W1; backward compatible)

Add to inspection (inspectionStore.ts:6-12): kind, storyId, duration, session: StorySession | null, userPlaying: boolean, suspend: 'none' | 'hidden' | 'context' | 'error', exiting: boolean. Keep every existing field and its meaning. inspection.playing stays and is the derived effective flag: userPlaying && suspend==='none' && status==='ready' && time<duration.

~~~ts
export function enterInspection(trigger: HTMLElement, staticMode: boolean, story?: StoryId, chapter?: number): void  // default story 'ring-p003068': existing 2-arg calls compile and behave the same
export function exitInspection(): void           // no-op unless active; clears entry/session; setScrollState(entry) exactly once; sets exiting for one frame
export function seekInspection(time: number): void       // clamp [0,duration]; never starts playback; notify only if discrete changes
export function seekChapter(index: number): void         // time = chapters[index].start; pauses
export function playInspection(replay?: boolean): void   // same semantics as store:52-57 with descriptor duration
export function setInspectionSuspend(reason: Suspend): void
export function advanceInspectionPlayhead(delta: number, stamp: number): void
~~~

advanceInspectionPlayhead is idempotent per stamp (state.clock.elapsedTime, identical for every subscriber in a frame). It clamps delta to 0.05 (as InspectionScene.tsx:98), advances entryElapsed always (entry blend, as :99) and time only when inspection.playing, stops at duration (hold, no auto-exit), and fires audio edge cues.

Document visibility (owner W1, in the DOM shell effect, RingInspection.tsx:32-83 pattern): on visibilitychange to hidden set suspend='hidden' without touching userPlaying; on visible set 'none'. A manual pause has userPlaying=false, so hide/show never resumes it. Hidden time never adds to time, entryElapsed or the load timer. Context loss: setInspectionSuspend('context') then the existing staticMode effect exits.

Reentry: exit then enter in one tick must produce epoch+1, time 0, userPlaying false, no remaining refs to the old session (existing test inspectionStore.test.ts:20-24 stays).

## 5. Playhead driver and frame ordering (owner W2)

New component InspectionDriver, mounted inside InspectionScene (so it exists with the canvas, not with the story): useFrame(fn, -10). Per frame while inspection.active && !inspection.static: advanceInspectionPlayhead(delta, state.clock.elapsedTime); runtime.sample(inspection.time). Everything else reads the samples:

1. InspectionDriver (-10): advance + sample.
2. CameraRig (0): reads runtime.camera and runtime.frame.returnBlend, never calls sample (replaces CameraRig.tsx:200-213 ring math and the inspectionTelemetry.ringBounds read at :203).
3. InspectionScene (0): runtime.apply(), narrative fade, hide set.
4. Lease gates (section 7).
Nothing may depend on mount order among priority-0 subscribers (F4). No React state or setState in any of these; discrete DOM changes go through notifyInspection only when frame.discrete changes.

## 6. Camera adapter (CameraRig is the sole writer)

- Story code writes only the InspectionCameraSample owned by its runtime (position, target, up, fov; preallocated Vector3s). It must not touch camera, state.camera or window.__threeCamera.
- CameraRig keeps: lazy snapshot of position/quaternion/up/fov/projection plus currentPos/currentTarget (:193-199), lerp saved to sample by blend = ease(entryElapsed/1.2) * (1 - returnBlend) (:201,208-211), blend===0 projection restore (:212), one-shot restore (:219-227). The saved snapshot becomes the single source for restore telemetry: write restoredPoseError on the frame AFTER restore as camera.position.distanceTo(saved) + camera.quaternion.angleTo(saved) using a saved copy that is not mutated (fixes F5).
- lookAt: matrix.lookAt(sample.position, sample.target, sample.up) to quaternion, as :206-207. aspect-dependent framing (:204) moves into the story's sample() using ctx.aspect updated on resize.
- cameraOwner telemetry stays 'CameraRig'. Verifier asserts no other writer: during an inspection frame, a Proxy on camera.position logging set calls from non-CameraRig stacks is not reliable, so assert instead that three consecutive frames at paused time give identical camera pose and that Object3D matrixWorld equals the CameraRig-expected lookAt within 1e-9 (V4).
- Shaft handoff continuity: story camera curves are closed-form in t; no damping, no integration (plan section 4).

## 7. Render and narrative restore envelope (owner W2)

New src/scene/inspection/renderLease.ts. Snapshot captured on the first active frame, before any write, by the same code path as the camera snapshot.

~~~ts
export interface RenderSample { background: Color; fogNear: number; fogFar: number; envIntensity: number; envRotationY: number; bloom: number; aberration: number; dofBokeh: number; exposure: number }
export interface RenderSnapshot {
  background: { color: Color | null; texture: unknown; intensity: number; blurriness: number }   // SceneCanvas.tsx:351
  fog: { color: Color; near: number; far: number } | null                                         // :352
  environment: unknown; environmentIntensity: number; environmentRotation: [number, number, number]   // :53-54,167
  lights: Map<import('three').Light, { visible: boolean; intensity: number; color: number; pos: [number, number, number] }>
  gl: { toneMapping: number; toneMappingExposure: number; clear: [number, number, number, number] }
  post: { bloom: number; aberration: [number, number]; dofBokeh: number }                        // PostProcessingComposer.tsx:138-168
  hidden: Map<import('three').Object3D, boolean>                                                 // F7 hide set
  narrative: { scroll: ScrollState; materialMode: string; anim: unknown; idleAngle: number }     // inspection.entry (store:33), TorqueWrenchHero anim/idleAngle (:82,84)
}
~~~

- Per-frame writers that need a gate (the only edits to existing writers, both owned by W2): StudioRig useFrame (SceneCanvas.tsx:141) and FxDriver useFrame (PostProcessingComposer.tsx:105) return early after their telemetry line when renderLease.owned; the lease then writes RenderSample values. LcdFillLight (:60-103) and LcdMicroRimLight (:236-246) are progress-gated and progress is frozen, but the lease still sets visible=false on every narrative light to get a clean dark studio. Inspection-owned lights live only in the study root.
- Static datums (background, fog, environment, environmentRotation, gl clear/tonemap, hide set) have no per-frame writer and must be restored from the snapshot; per-frame datums restore by the gate releasing (the narrative writers rewrite on the next frame).
- Hide set: re-check scene.children.length each frame; any unseen non-owned child is recorded then hidden (fixes F7). Restore uses the recorded values, never forces visible=true.
- Restore is one idempotent function called from exit and from InspectionScene unmount (existing cleanup :211). Restore must tolerate a lost context: no GL calls, only property writes and dispose().
- Narrative: hero already freezes pose and idle while active (TorqueWrenchHero.tsx:279-282) and the GSAP timeline holds and restores (:142-159). Required additions: the study never calls applyLiveMaterials or touches rig.basePositions; Return after blueprint re-applies the entry materialMode via setScrollState (store:48) and the fade clones restore original or blueprint material (narrativeFade.ts:35-40). Verify blueprint and exploded round trips with V7.
- Fade clone discipline stays: borrow geometry, clone materials, original opacity/transparent/depthWrite untouched (narrativeFade.ts:3,19-22); telemetry narrativeOriginalsIntact keeps its meaning.

## 8. Assembled study, clone-before-merge, independent finale

- Study root: Group 'manufacturing-study-root' under the inspection world, orientation identity in the gearbox-local frame (train axis +Z). Never composed with hero.matrixWorld, so blueprint or exploded entry cannot change it (answers plan B2 and F11).
- Bundle: shaft, grooved shaping blank, revised hobbing blank, P000725, K000210, K000211, tool props, as named nodes from the G2 export (scripts/manufacturing, public/models/manufacturing-*.glb, hashed). Placement uses shaft_world_matrix.json, the measured export registration and exactly one mm-to-m conversion (plan sections 4 and 6). StoryRuntime never reads Default.glb meshes for these parts (F10).
- Cages and planets: clone rig.stages[id].carrier groups with Object3D.clone(true), remap every material to an instance-owned clone, share geometry (do not dispose it), set position from rig.basePositions.get(carrier) (rest, not exploded), apply rotation with the existing convention carrier.rotation.z = turns*2pi*(sweep+idle), planet.rotation.z = -carrier*GEAR_RATIOS.planetMultiplier (TorqueWrenchHero.tsx:249-258). Display turns are not machining rates.
- Alternative to clone-before-merge: if a future story needs a Default.glb part that is merged (for example clutch static), the only sanctioned route is a named capture step inside buildWrenchRig before the bucket loop at nodeRoles.ts:461, owned by W2 as a single hook; not needed for the planned shaft story.
- Leased reuse of narrative objects is not used. If it ever is, the lease records full local matrix, parent, visible and material per object and restores before narrative resumes.

## 9. Telemetry (owner per section 10)

- window.__inspection (store:13-25) keeps every existing key, type and unit. Additive keys only: schema: 1, kind, storyId, session, status, suspend, chapter, duration, playing. For a shaft session the ring-specific keys hold their idle defaults and loaded/disposed/active/time/phase still mirror lifecycle, so verify-ring-inspection.mjs waiters (loaded, :57,125,131,140,152,182) keep working.
- window.__manufacturingInspection (new, gated like __inspection): { schema: 'manufacturing-inspection/1', kind, session, epoch, active, status, suspend, time, duration, chapter, phase, discrete, playing, camera: { position, target, fov, owner }, tier, dpr, render: { owned, restoreError }, restore: { sceneProgress, materialMode, cameraError, hiddenCount, lightsRestored }, resources: { geometries, materials, textures, meshes }, shaft: { teethFormed, teethPartial, cutter: { visible, stroke, infeed, rotation }, hob: { visible, feed, rotation }, card: { id, stamp }, stress: { kind, mix }, supports: { deltaYmm, witnesses, endpointHeld }, finale: { assembled, shaftCount, racesFollow }, narrative: { alpha, hiddenCount, originalsIntact } } }. Fields are added by W4 inside this schema, never by renaming; any removal bumps the schema string.
- Proof hooks (extend InspectionScene.tsx:85-94, only with ?inspectionProof): seek(time, entryElapsed), seekChapter(i), step(dt) to call advanceInspectionPlayhead with a synthetic stamp, setSuspend(reason), digest() returning a quantized state hash of camera, runtime telemetry and render sample.

## 10. Disjoint ownership

| Worker | Writes only | Reads |
|---|---|---|
| W1 lifecycle | src/state/inspectionStore.ts(+test), src/scene/inspection/{story,session,loadLease}.ts, src/components/RingInspection.tsx/.css and a sibling shell for shaft controls (chapters, seek, Return) | everything |
| W2 integration (single owner, plan section 5) | CameraRig.tsx, TorqueWrenchHero.tsx, InspectionScene.tsx, SceneCanvas.tsx (StudioRig gate, lease mount), PostProcessingComposer.tsx (FxDriver gate), src/scene/inspection/renderLease.ts, narrativeFade.ts | W1 types |
| W3 ring | src/scene/inspection/{timeline,ringGeometry,ring/*}.ts, ring tool code moved out of InspectionScene | story.ts |
| W4 shaft | src/scene/inspection/shaft/*, shaft descriptor and runtime | story.ts, G2 bundle |
| W5 assets | scripts/manufacturing/*, public/models/manufacturing-*, geometry/ evidence | none |
| W6 verifier | scripts/verify-manufacturing-inspection.mjs, camera/restore evidence | all |

Merge order: W1 types first (this section 2-4 verbatim), then W3 and W4 in parallel, then W2 once, then W6. W3 and W4 never edit shared files.

## 11. Verification (future workers run these; paths from the repo root)

- Static: npm run typecheck; npx vitest run src/state/inspectionStore.test.ts src/scene/inspection; npm test at integration; npm run build; node scripts/check-b1b2-contract.mjs; npm run check:station2.
- Ring regression: restart :4173 after rebuild; node scripts/verify-ring-inspection.mjs --url=http://localhost:4173 --out=<evidence-dir> (203 lines; covers delayed CAD, restore, loseContext at :154,187).
- New unit tests (W1/W2): V1 exit twice leaves scroll state unchanged after a mutation between calls (F2). V2 InspectionDriver at -10 runs before a 0-priority subscriber in a test canvas, positive priority absent. V3 digest(sample(t)) equals digest from a fresh runtime after random seek order, for every chapter boundary +/-1e-6. V5 programs count does not grow after ready on first play (renderer.info.programs.length unchanged across frames 0-60).
- V4 camera: paused time, 3 frames, identical pose; pose matches lookAt of the sample within 1e-9; restoredPoseError measured on the frame after exit and below 1e-6.
- V6 delayed load: route-hold the bundle, Return, immediately re-enter; the held response then resolves: no attached object, no camera change, no control change, resources census equal to idle (stale-session test; existing pattern verify-ring-inspection.mjs:140-141).
- V7 round trips: exploded entry then assembled finale then Return, and blueprint entry then finale then Return: assert materialMode, progress, chapter, hotspotId, scrollY, anim.explode, idleAngle, camera pose, background/fog/environment/light/post snapshot, hide set all equal entry within tolerance.
- V8 pause/hide: userPlaying false, dispatch hidden then visible via overridden document.visibilityState plus a visibilitychange event: time and entryElapsed unchanged and still paused; playing story hidden 5 s then visible: time advance below one clamped delta, resumes only if userPlaying.
- V9 seek/replay: direct chapter entry equals continuous playback at the same time (digest) in a paired run using step(1/60); replay resets time to 0 with no audio cue; chip/particle counts do not accumulate across 20 seeks.
- V10 context loss: loseContext at loading, mid-motion, and at hold: exit completes once, body class and inert cleared, no console error, repeated entry after poster works through the static story with no CAD fetch.
- V11 lifecycle census: five complete entry/exit cycles after warm-up, no monotonic growth in resources.geometries/materials/textures/meshes or renderer.info.memory.
- Evidence rule: every claim carries the telemetry JSON and the command line; screenshots are supporting only.

## 12. Unresolved and measured-later

- U1 R3F 9.7.0 (node_modules/@react-three/fiber/dist/events-b1bdeb1a.cjs.dev.js:1146,1154): subscribers sort ascending by priority and only priority > 0 takes over rendering, so -10 runs before all priority-0 writers without affecting render. Read from source, not yet exercised; V2 must prove it in a test canvas before W2 merges.
- U2 renderer.compile behavior for invisible roots in three 0.185.1 is unconfirmed; V5 is the proof.
- U3 Entry/exit blend for shaft is the existing 1.2 s entry and an instant exit snap (CameraRig.tsx:219-227). A cross-fade on Return is not specified and not required for G1.
- U4 Lite vs full tier asset swap on tier change during a session: not specified; a tier change during inspection ends the session through the existing exit path.

