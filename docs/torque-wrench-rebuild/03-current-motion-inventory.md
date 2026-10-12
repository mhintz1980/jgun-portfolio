# Current JGUN motion inventory

Decision input: the current page combines independent pacing, input and cinematic-motion mechanisms; changing one smoothing number cannot establish compliance with the owner standard. Source inventory by native Codex Luna/high (`tier-reader`, agent `01a12425-fe39-75b1-893e-cf9736063990`), with parent checks. This is research, not a design or implementation plan.

Read [smooth-scrolling.md](smooth-scrolling.md) before any scrolling edit. [Oryzo](https://oryzo.ai/) is the owner motion reference. Initial 2× JGUN-only distance, approximately 150–250vh major beats and 60–120vh reading holds are adaptable starting points, not locked dimensions.

## Current mechanisms

| Property | Current source facts | Evidence |
|---|---|---|
| Narrative pacing | Authored document height 3120vh and scroll distance 3020vh. Intro raw-scroll share is 0.5, nominally 1510vh; it occupies paced progress 0–.12. JGUN camera segment ends at paced .525. This shared page also includes later case studies/footer. | `src/scene/drawing/scrollTracks.ts:71`, `src/scene/drawing/introTimeline.ts:32`, `src/data/caseStudies.ts:284` |
| Input smoothing | Lenis constructor uses `duration: 1.1, smoothWheel: true`; GSAP ticker drives its RAF, lag smoothing disabled, scroll events notify ScrollTrigger. Actual effective options need runtime inspection, including whether a lerp option changes the meaning of duration. | `src/scene/ScrollRig.tsx:22` |
| Hero animation catch-up | GSAP hero timeline has `scrub: 0.6`, tied to chapter 1 DOM edges. Its tween insertion positions `.12`, `.27`, `.47`, `.54` are timeline positions, not proof of global-progress beat boundaries. | `src/scene/TorqueWrenchHero.tsx:122` |
| Cinematic camera | Base keyframes and JGUN overlays provide shift-groove orbit, exploded-train target tracking and rear LCD arc/dwell. Position, target and FOV damp with `1 - exp(-6 * min(delta,.1))`. | `src/scene/CameraRig.tsx:280`, `src/scene/CameraRig.tsx:548`, `src/data/caseStudies.ts:259` |
| Motion at rest | Outside the drawing handoff and within the JGUN segment, low scroll velocity enables an accumulated .3°/s rest orbit. This is source evidence of time-dependent motion at fixed narrative progress; runtime magnitude remains to be measured. | `src/scene/CameraRig.tsx:530` |
| Scroll assist | In a narrow intro window, a 260ms input-idle delay/low-speed check can initiate a 1.15s scroll toward a boundary. New input cancels it and direction selects the boundary. | `src/scene/scrollCommit.ts:34`, `src/scene/scrollCommit.ts:54` |
| Progress mapping | Raw document progress passes through `pacedProgress()` into the external store; consumers read the paced value. Intro remapping, DOM chapter triggers and hero timeline edges are distinct mappings that need coordinated runtime examination. | `src/scene/ScrollRig.tsx:35`, `src/scene/drawing/introTimeline.ts:142`, `src/state/scrollStore.ts:7` |

## Current JGUN content

| Beat/content | Existing authored location |
|---|---|
| Drafting table, close reading, electrical profile/internal cracking, paper rupture, emergence and studio handoff | Intro paced 0–.12. Reading anchors at intro times 0, .05, .29, .38, .45, .58, .66. Opening rhythm and later rupture phases must not be confused with raw document fractions. |
| Shift-groove reveal | Caption window .04–.18; camera overlay approximately .035–.18. These overlapping systems require runtime synchronization checks. |
| Gear sweep, housing ghost and rear extraction | Hero timeline starts its spin/gear channels at timeline position .12, ghost at .27, explosion at .47 and ghost-out at .54; chapter trigger maps that timeline to scroll. Captioned extraction is above paced .18 through .42. |
| Rear LCD | Camera arc .420 onward, dwell .458–.488, return through .525; caption above .44 through .51. |
| Page handoff | JGUN camera segment ends .525; current stage sink .525–.565. Future separate-page shell work is owned by the parallel session. |
| Ring Switch and Input Shaft manufacturing inspection | Explicit modal interruptions with separate Play/Replay/seek/chapter controls, rather than ordinary document-scroll beats. |

Evidence paths: `src/components/Chapters.tsx:43`, `src/scene/drawing/introTimeline.ts:96`, `src/data/caseStudies.ts:500`, `src/scene/stages/stageWindows.ts:19`.

## Inspection interruptions

Opening an inspection stops Lenis, locks document scrolling and pauses the hero GSAP timeline while saving its time/state. Inspection starts paused with independent controls; returning restores saved context and resumes Lenis if previously running. Camera ownership remains significant for the proposed bullet-time template, whose camera swings/timing are not accepted as complete.

Evidence: `src/components/RingInspection.tsx:64`, `src/components/RingInspection.tsx:160`, `src/state/inspectionStore.ts:54`, `src/scene/TorqueWrenchHero.tsx:147`. The owner-approved future-release scope retains existing content, restores the opening and completes cutter bullet time; planet inspection/H7-g6 and candidate effects remain later additions.

## Research limits and verification

- This inventory establishes authored settings, not smoothness, FPS, reverse-path equivalence or runtime pause behavior.
- A numeric GSAP scrub is an additional playhead catch-up interval; official GSAP docs confirm this meaning. Lenis documentation wording alone does not establish precedence in this installed implementation. The auxiliary runtime snapshot observes duration 1.1 and lerp .1 together; installed `Animate.advance` checks duration/easing before lerp. See the research report before drawing conclusions about effective response.
- The old fixed-height/timing-preservation comments describe the current implementation; the owner's amendment withdraws them as rebuild constraints.
- Exact rendered JGUN-only distance must be measured from the runtime and its inverse progress map; do not double the total portfolio height or treat 3120vh as a new-page baseline.
- Subsequent auxiliary runtime measurement at 1440×900 maps paced `.525` to raw `.7301136364`, approximately 2,205vh from the top; provisional 2× is approximately 4,410vh. This remains a starting point, not a locked length. Read the report for startup-readiness and baseline limits.
- Relevant graph paths were checked at Tier 2 under `jgun-torque-wrench-rebuild`, generation `2026-10-10T04:09:36Z`: no recorded gaps but `metadata_changed`, requiring direct-source verification. Coverage is best-effort; no exhaustive codebase or continuity claim is made.

Official sources consulted on 2026-10-10: [Lenis README](https://github.com/darkroomengineering/lenis), also locally installed Lenis 1.3.26 README; [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/). Context-mode URL conversion failed (`turndown` missing); direct official HTTP reads succeeded. No dependency upgrade or global tooling change was made.
