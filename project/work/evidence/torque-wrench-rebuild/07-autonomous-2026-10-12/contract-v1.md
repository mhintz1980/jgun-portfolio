# Stage2 interface contract v1

Owner: parent integrator. Stage2 workers implement this agreed contract; report incompatible changes before modifying interfaces. Inputs: plan13, structure10§2, smooth-scrolling.md, approved contract18 and motion-baseline.md.

## Pure timeline owner

Own src/scene/torque-wrench/beats.ts, beatTimeline.ts, directorRegistry.ts; beats.test.ts, beatTimeline.test.ts, directorRegistry.test.ts. All remain plain data/math: no React, Three, root store, loader, browser side effects or GSAP. Registry metadata must remain safe for eager static imports; CAD-bearing implementation registrations occur later beneath cadGate and must not turn the metadata branch into an eager GPU tree.

Export from beats.ts: TorqueWrenchBeat (structure10 fields), TORQUE_BEATS, TORQUE_SCROLL_VIEWPORTS=44.1 (provisional physical range), and stable poster/story chapter associations. Camera/scene/director identifiers support registry extension, without conductor/spine edits. Author coherent Drafting→Breakthrough→Mechanism→Inspection→Close coverage; preserve existing semantic chapter IDs and poster slots. Extra microbeats are data, not new scroll triggers.

Export from beatTimeline.ts: TorqueBeatSample with progress, beat, index, localProgress, previousId, nextId, phase ('entering'|'active'|'exiting'), stateKey. Export createBeatTimeline(beats, knownDirectorIds) returning {sample(progress): TorqueBeatSample}, and sampleTorqueBeat(progress) using the production beat inventory/metadata.

Validate immutable beat data: unique nonempty IDs, finite0<=start<end<=1, complete ordered coverage0..1, reject overlaps/gaps and unknown director IDs. Endpoint rule:[start,end), final beat includes1; shared boundary belongs to next beat. Reject nonfinite progress; clamp finite out-of-range to0/1. phase derived from localProgress (<.1 entering, >=.9 exiting, otherwise active). State key is deterministic from exact sample inputs and never traversal history. Caller mutation must not alter the validated timeline. Pure registered-sampler fixtures must prove equality at forward/reverse/seek/reload/hold.

Export from directorRegistry.ts: TORQUE_DIRECTOR_IDS (pure metadata), plus a generic typed registration/sampling facility accepting injected pure sampler functions. Reject duplicate/unknown/missing registration as appropriate. Do not claim a transport/sample fixture is implemented CAD/effects. Added-beat fixture changes only beat data, pure director and registry entry; conductor/Scene/page files stay unchanged.

## Store/conductor owner

Own src/state/torqueWrenchStore.ts and src/state/torqueWrenchStore.test.ts (if absent confirm first); src/scene/torque-wrench/ScrollConductor.tsx, conductorRuntime.ts, conductorRuntime.test.ts and ScrollConductor.test.tsx. Do not edit page/Scene/cadGate/CSS, timeline-owned or shared files.

Extend store preserving existing tier/sceneStatus terminal-failure and subscribe/getState semantics. Export getProgress():number; getNarrativeSample():TorqueBeatSample; setProgress(progress:number):void; subscribeBeat(listener):unsubscribe; getActiveBeatId():string. Progress is not included in the lifecycle getState snapshot; setProgress must not emit existing lifecycle subscribers. subscribeBeat emits only when active beat identity changes, not every scroll/frame. Pure progress sample remains imperatively readable for Scene/useFrame. Store owns no Three objects. One page owns one store; no singleton narrative state.

ScrollConductor props:{store:TorqueWrenchStore,onFailure:(error:unknown)=>void}. It is mounted later by parent inside lazy Scene, only for live scene tiers. It creates one Lenis input owner at duration1.1, autoRaf:false, one page-specific global ScrollTrigger (no per-chapter triggers), one GSAP ticker callback driving Lenis in milliseconds; no additional rAF clock or numeric scrub. Sample native canonical progress on initial mount/reload, updates, resize/refresh and visibility return. Reject or ignore nonfinite runtime input safely; clamp progress0..1. Deltas/transient timers must not advance narrative when progress is unchanged. Initial scroll restoration is respected; do not force top or hijack native keyboard/scrollbar behavior.

Cleanup removes only its own ticker, trigger, Lenis scroll handler, DOM/visibility/resize listeners and Lenis instance. No ScrollTrigger.killAll, global store, global inspection registration or root imports. Mount/dispose/remount and terminal poster/failure teardown are idempotent. conductorRuntime exposes dependency-injected lifecycle helpers so exact owner/cleanup/reload/seek behavior can be verified with focused CPU tests; browser actual input/trigger proof follows parent integration.

Parent owns TorqueWrenchPage.tsx, Story.tsx, Scene.tsx, cadGate.ts and CSS integration after workers deliver stable artifacts. Add store to TorqueSceneProps as a type-only dependency. Static/reduced/failure paths retain normal semantic flow and mount no conductor. Live physical range uses the provisional data separately from semantic beat samples.

Registry lifetime is caller-owned and immutable after construction; there is no global registration or unregister lifecycle. subscribeBeat has no initial replay: consumers read getNarrativeSample() once before subscribing. The pre-rupture pit director may author hidden fissure state, but the opaque sheet/desktop occludes it; metadata must not select a separate cavern preview before rupture.

## Resources, skills, evidence

Children read AGENTS.md and their exact plan13 skill roster rows at domain entry; read smooth-scrolling.md before motion edits. Timeline: master r3f guard and animate; scroll-scrubbed-visual-sequence is conditional on image/video sequence work. Conductor: master r3f guard, gsap-scrolltrigger, cinematic-gsap-lenis-motion-system, read-the-damn-docs. These full paths are in plan13. Use installed Lenis1.3.26/GSAP3.15.0 and official docs; no upgrades. Children may read source/types and write named tests, but parent runs all tests/builds/browser jobs in resource windows. Report changed paths, actual checks (if any), unverified items and handover release. Parent owns aggregate/leaf evidence. Do not revert others, access protected sibling, edit shared files, deliver Git, message chats or spawn further workers.
