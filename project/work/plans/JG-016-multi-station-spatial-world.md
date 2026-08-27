---
id: JG-016
title: Multi-station spatial world and navigation rig
status: verified
created: 2026-08-26
owner: Antigravity
todo: TODO.md#queued
depends_on:
  - JG-015
source:
  - ../../context/architecture/animation-spec.md
  - ../../context/agent-skills.md
skills:
  - gsap-scrolltrigger
  - r3f-scroll-performance-guard
  - cad-scene-graph-rigging
  - webgl-telemetry-verifier
implementation_scope:
  - src/scene/SpatialWorld.tsx
  - src/scene/SpatialRig.tsx
  - src/scene/StageManager.tsx
  - src/scene/CameraRig.tsx
  - src/state/scrollStore.ts
acceptance:
  - All three stations have named transforms, transition windows, and camera arrivals.
  - Canvas and DOM narrative state remain synchronized without frame-loop React writes.
  - The world has deep-link, reduced-motion, and poster-tier behavior.
verification: ../evidence/JG-016-multi-station-spatial-world-verification.md
commits: []
---

# JG-016 — Multi-Station Spatial World and Navigation Rig

## Outcome

Replace implicit sequential stage placement with a measured three-station world: the JGun torque multiplier, RL-300 acoustic enclosure, and M249/MK46 platform. Visitors must experience intentional spatial transitions rather than unrelated component swaps.

## Implementation Steps

1. Define named station transforms, origins, envelopes, camera arrival frames, and semantic DOM narrative mapping.
2. Implement `SpatialWorld.tsx` for station composition and `SpatialRig.tsx` for scroll-controlled focus/transition state.
3. Keep scroll state imperative in the R3F frame loop and DOM subscriptions key-specific; do not add React state churn to frame work.
4. Define shareable station deep-link state and equivalent reduced-motion/poster navigation.
5. Retire StageManager-only assumptions only after all live station transitions preserve the JGun rig contract.

## Acceptance Criteria

- [x] Station 1, 2, and 3 use named transforms and measured camera targets.
- [x] JG-015 real Stage 2 asset is used; no placeholder is presented as finished work.
- [x] Scroll, camera, DOM narrative, and active station telemetry agree at every transition window.
- [x] Deep links, keyboard navigation, touch interaction, reduced motion, and poster tier have defined outcomes.
- [x] Full and medium tiers meet the performance guard’s required telemetry checks.

## Verification Record

See [`../evidence/JG-016-multi-station-spatial-world-verification.md`](../evidence/JG-016-multi-station-spatial-world-verification.md).
