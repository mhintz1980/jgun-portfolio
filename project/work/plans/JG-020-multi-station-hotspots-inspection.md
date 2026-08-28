---
id: JG-020
title: Multi-station subassembly inspection, spatial hotspots, and interactive CAD anchors
status: verified
created: 2026-08-28
verified_on: 2026-08-28
owner: Antigravity
todo: TODO.md#active
depends_on:
  - JG-015
  - JG-016
  - JG-018
source:
  - ../../context/agent-skills.md
  - ../../context/architecture/animation-spec.md
skills:
  - spatial-hotspot-a11y
  - r3f-scroll-performance-guard
  - webgl-telemetry-verifier
implementation_scope:
  - src/data/caseStudies.ts
  - src/scene/CameraRig.tsx
  - src/scene/stages/Station2_AcousticEnclosure.tsx
  - src/scene/stages/M249Stage.tsx
  - src/components/TechnicalHUD.tsx
  - src/scene/Hotspots.tsx
acceptance:
  - All 3 stations have clickable/hoverable CAD occurrences and rich GD&T/technical data cards.
  - Station-aware camera framing dollies to the correct world coordinates without clipping or jumping to Station 1.
  - Continuous scroll-to-release UX allows immediate flight resumption via wheel, touch drag, Escape, or station jumps.
  - Zero-rerender R3F performance contracts and WCAG accessibility standards are fully satisfied.
verification: ../evidence/JG-020-multi-station-hotspots-inspection-verification.md
commits: []
---

# JG-020 — Multi-Station Subassembly Inspection, Spatial Hotspots & Interactive CAD Anchors

## Outcome

Complete the multi-station 3D inspection experience by enabling interactive hover/click subassembly selection, dynamic 3D spatial datum tags, and station-aware camera framing across Station 1 (JGun Torque Multiplier), Station 2 (RL-300 Acoustic SAFE Enclosure), and Station 3 (M249 Platform).

## Implementation Steps

1. **Station 2 Hotspots & Camera Framing**:
   - Register the 7 Station 2 enclosure subassemblies (`ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_INTAKE`, `DUCT_EXHAUST`) in `HOTSPOTS` (`src/data/caseStudies.ts`) with authentic acoustic and mechanical specifications.
   - Add Station 2 inspect framing keyframes in `HOTSPOT_INSPECT_FRAMES` in `src/scene/CameraRig.tsx` centered around `[28, 0, -6]`.
   - Update `CameraRig.tsx` to handle multi-station coordinates properly.

2. **Station 3 Hotspots & Interactive CAD Mesh**:
   - Register reverse-engineered Station 3 datums (`m249-receiver`, `m249-trunnion`, `m249-rail`, `m249-feed-tray`) in `HOTSPOTS` (`src/data/caseStudies.ts`).
   - Add interactive mesh hover and click handling in `M249Stage.tsx` with dynamic emissive highlighting and 3D spatial datum anchors.
   - Add Station 3 inspect framing keyframes in `HOTSPOT_INSPECT_FRAMES` in `src/scene/CameraRig.tsx` centered around `[56, 0, -12]`.

3. **Spatial Datum Markers & HUD UX**:
   - Render 3D spatial hotspot tags on Stations 2 and 3 when their respective stages are active.
   - Ensure `TechnicalHUD.tsx` displays complete subassembly information and maintains continuous scroll-to-release functionality.

## Acceptance Criteria

- [ ] All 3 stations have clickable subassemblies with synchronized emissive feedback and HUD detail cards.
- [ ] Camera inspect framing navigates to the exact 3D coordinates of parts across Station 1 (`[0, 0, 0]`), Station 2 (`[28, 0, -6]`), and Station 3 (`[56, 0, -12]`).
- [ ] Mouse wheel scroll, touch drag, Escape key, or station button navigation seamlessly releases inspect mode.
- [ ] Production build and typecheck pass cleanly with zero errors.
- [ ] Runtime telemetry verifies accurate camera transforms and zero console errors.
