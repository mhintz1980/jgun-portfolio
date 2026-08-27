---
id: JG-017
title: Post-processing and whip-pan camera effects
status: queued
created: 2026-08-26
owner: unassigned
todo: TODO.md#queued
depends_on:
  - JG-016
source:
  - ../../context/agent-skills.md
skills:
  - gsap-scrolltrigger
  - r3f-scroll-performance-guard
  - webgl-telemetry-verifier
implementation_scope:
  - src/scene/PostProcessingComposer.tsx
  - src/scene/SpatialRig.tsx
  - src/state/qualityStore.ts
acceptance:
  - Effects reinforce named station transitions without masking engineering content.
  - Quality tiers and reduced motion have defined safe fallbacks.
  - Effect intensity and performance are telemetry verified.
verification: null
commits: []
---

# JG-017 — Post-Processing and Whip-Pan Camera Effects

## Outcome

Add restrained velocity-driven directional chromatic aberration and localized bloom during intentional spatial whip-pans, after the world and station camera geometry are stable.

## Implementation Steps

1. Define effect triggers from named transition state and camera velocity, never from arbitrary DOM scroll handlers.
2. Clamp aberration, bloom, duration, and recovery; do not add a persistent visual fog over CAD inspection states.
3. Add quality-tier policy: full may render the effect, medium receives a reduced treatment, poster and reduced motion receive none.
4. Dispose GPU resources on unmount and avoid per-frame allocations.

## Acceptance Criteria

- [ ] Effects run only during approved JG-016 station transitions.
- [ ] Mechanical inspection, GD&T annotations, and reading contrast remain clear.
- [ ] Reduced motion and poster tier contain no whip-pan motion effects.
- [ ] Full and medium tier checks show no performance-regression evidence.

## Verification Record

Create `../evidence/JG-017-whip-pan-camera-fx-verification.md` before checking off the TODO entry.
