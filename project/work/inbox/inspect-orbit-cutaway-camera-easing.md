# Intake — Inspect-mode orbit scrub + gear-train cutaway shader + bezier camera easing

*Filed 2026-08-30 from an owner working session (Mark). Not yet triaged: needs a
stable `JG-###` ID, a plan in `project/work/plans/`, and a TODO entry before any
implementation. Source material: `docs/orzo-style-portfolio-implemetation-roadmap.md`
(§Chapter 01–02 "Required upgrade") + owner's feature description below.*

## Owner feature description (verbatim intent)

> Clickable sub-assemblies that the user activates, the camera zooms into them,
> and the user can scroll back and forth a bit to orbit the subassembly.

Plus, from the orzo roadmap (already-committed reference doc):

> Add interactive cutaway shaders to reveal internal planetary gear stages
> without requiring complete mesh displacement. Bind user drag/orbit controls
> to let visitors inspect the 7-axis mill-turn spindle tooling and runout callouts.

**Owner ruling (2026-08-30, confirmed precedent `project/work/inbox/task-spec.md:17`):**
there must be NO exit button for inspect mode — exiting must be possible through
scrolling itself, because a user may never notice a button. The original task spec
already encoded this: "The interface MUST NOT trap the user behind a mandatory exit
button; any mouse-wheel scroll (`wheel` event) or touch drag must smoothly release
focus and resume the master scroll path." Any orbit design must preserve this:
e.g. a bounded scroll-scrubbed orbit where scrolling past the orbit's travel bound
releases inspect mode. Escape stays only as a keyboard-accessibility parity path
(not a visual button).

## Current state (verified 2026-08-30 — do NOT rebuild what exists)

**Already built and verified (JG-020, commit `2d0034d`):**
- Click/hover subassembly selection on ALL 3 stations with emissive highlight +
  rich GD&T/technical HUD cards (`src/scene/Hotspots.tsx`, `src/data/caseStudies.ts`
  `HOTSPOTS`, `src/scene/stages/M249Stage.tsx` click classification).
- Station-aware camera dolly to per-part inspect framing
  (`HOTSPOT_INSPECT_FRAMES` in `src/scene/CameraRig.tsx:36`, applied at
  `CameraRig.tsx:288`), with explode-offset compensation for Station-1 handle parts.
- Inspect release: wheel, touch drag, Escape, station jumps
  (evidence `project/work/evidence/JG-020-multi-station-hotspots-inspection-verification.md`).
- Authored (not user-controlled) orbit arcs already exist on the scroll timeline:
  handle orbit CR-3 (`CameraRig.tsx:192`) and rear-LCD orbit CR-5
  (`CameraRig.tsx:230`, `LCD_ORBIT_KEYFRAMES`).

**Gap 1 — inspect-mode orbit scrub (the owner's ask):** while a hotspot is
inspected, scroll currently RELEASES inspect mode (JG-020 contract). There is no
user-controlled orbit around the inspected part. The ask: scrolling during
inspect should instead scrub a bounded orbit arc around that part; release needs
a new trigger (Escape / click-away / an explicit affordance) or a hybrid
(first N degrees of scroll orbit, further scroll releases). This CHANGES the
JG-020 "scroll-to-release" contract — plan must call that out and reconcile
mobile/touch + reduced-motion tiers.

**Gap 2 — gear-train cutaway shader:** nothing exists. Internals currently
reveal only via axial explode + housing ghost fade (`TorqueWrenchHero.tsx`
ghost/explode terms). A cutaway (clipping-plane or shader-discarded shell with a
section "cut face" treatment) would expose the planetary stages at Station 1
assembled state. Candidates to research: `three` localClippingEnabled +
clippingPlanes per housing mesh, or a shader `discard` cap. Must not regress the
baked GLB palette ruling (JG-021 round 3) or bloom/telemetry contracts.

**Gap 3 — bezier/spline camera easing (owner added 2026-08-30):** the base
trajectory is per-segment STRAIGHT-LINE lerp between two `CAMERA_PATH` keyframes
with smoothstep easing (`baseAt()` in `src/data/caseStudies.ts:291`; keyframes
`:220`, segments `:254`). Two structural consequences: (a) spatial paths are
chords — the camera travels straight lines, never arcs through space; (b)
smoothstep's velocity is zero at both ends of EVERY segment, so the camera
structurally decelerates to a stop and re-accelerates at each segment join
(0.525, 0.600, …) — the "abrupt camera stops" the orzo roadmap calls out.
JG-021 remediation already bought *framing* continuity (target-leads-position
triple smoothstep `caseStudies.ts:317-323`, runtime-derived orbit continuity
`CameraRig.tsx:230-261`, goal→current damped drift) — so this gap is about PATH
SHAPE and VELOCITY continuity, not scroll smoothing; don't re-litigate those
remediations. Candidate: Catmull-Rom or chained cubic bezier through the
existing keyframes (tangent-continuous, keeps `CAMERA_PATH`/`PATH_SEGMENTS` as
the authoring source of truth), validating against the JG-021 acceptance probe
style (camera goal deltas across boundaries) plus station-transit framing.

## Open questions for triage

1. Orbit control mapping during inspect: scroll scrub (owner's words) vs pointer
   drag vs both? Touch equivalent?
2. ~~Release semantics~~ RESOLVED by owner ruling: scroll must remain the exit
   path — no exit button (see ruling above). Remaining design detail: does scroll
   past the orbit bound release immediately, or require sustained additional scroll?
3. Cutaway scope: housing only (P000245 shell) vs housing + flange? Static plane
   vs scroll-linked sweep?
4. Does the cutaway become a hotspot/inspect state ("X-RAY" style) or a
   scroll-timeline beat in CH.02?
5. Tier policy: full/lite/reduced-motion/poster behavior for both features.
6. Should Gap 3 (camera easing) be its own work ID? Recommendation: YES — it is
   choreography-wide polish with its own verification profile (velocity
   continuity at segment joins via telemetry probes) and it touches every
   chapter, unlike the Station-1-scoped orbit + cutaway work.
