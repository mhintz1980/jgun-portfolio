---
id: JG-014
title: Opening sequence, print-authentic GD&T annotations, and rear-LCD reveal
status: verified
created: 2026-08-26
owner: Antigravity
todo: TODO.md#active
source:
  - ../../context/architecture/animation-spec.md
  - ../../context/domain/gdt-annotation-style.md
  - ../../context/agent-skills.md
skills:
  - cad-scene-graph-rigging
  - gsap-scrolltrigger
  - r3f-scroll-performance-guard
  - spatial-hotspot-a11y
  - webgl-telemetry-verifier
implementation_scope:
  - src/scene/Hotspots.tsx
  - src/types/portfolio.ts
  - src/data/caseStudies.ts
  - src/components/Chapters.tsx
  - src/scene/CameraRig.tsx
  - src/scene/stages/stageWindows.ts
acceptance:
  - Datum graphics are horizontal, boxed, and drawing-derived.
  - Rotor and motor-bore leaders terminate at distinct measured feature anchors.
  - Narrative content does not occlude the machine during opening mechanical beats.
  - Rear LCD/buttons receive a stable reveal before JGun stage exit.
  - Fresh :4173 telemetry and build evidence are recorded.
verification: ../evidence/JG-014-opening-gdt-lcd-verification.md
commits:
  - 3152571
---

# JG-014 — Opening Sequence, GD&T, and LCD Repair

## Outcome

Replace the generic tilted hotspot treatment and opaque chapter cards with precise, print-authentic annotations and non-occluding mechanical storytelling. Add a deliberate rear-handle LCD/buttons reveal before the JGun stage hands off to the acoustic enclosure.

## Scope

The work corrects the opening callout tilt, the overlapping rotor/motor-bore anchors, panel occlusion during the ring-switch and gear-train beats, and the missing meaningful LCD reveal. It uses the drawing conventions in `project/context/domain/gdt-annotation-style.md` and preserves the measured D1-AP stage ladder and explosion offsets.

## Required Reading and Dependencies

| Type | Requirement |
|---|---|
| Canonical behavior | `../../context/architecture/animation-spec.md` §5–§5.4 |
| Drawing conventions | `../../context/domain/gdt-annotation-style.md` |
| Skills | `gsap-scrolltrigger`, `r3f-scroll-performance-guard`, `spatial-hotspot-a11y`, `webgl-telemetry-verifier`, and `cad-scene-graph-rigging` |
| Mechanical boundary | Do not alter part-number identity, rear-extraction offsets, or the M249 export path. |

## Implementation Steps

1. Extend hotspot data with structured datum/frame content and a measured local anchor offset. Keep the role-map occurrence as the stable anchor identity.
2. Replace decorative CSS perspective and rotation with orthographic datum flags, segmented feature-control frames, and thin leaders.
3. Measure and record distinct anchor offsets for `ROTOR-1` and `AIR MOTOR HOUSING-MACHINED-1`; reject duplicate visible anchors in development.
4. Replace the full-tier opaque left-column narrative cards with beat-specific transparent edge captions and one active annotation at a time.
5. Schedule the rear-LCD orbit after the explode beat but before the JGun stage handoff. Align `CameraRig`, stage windows, hotspot visibility, and chapter content windows.
6. Use only crop-verified drawing glyphs and tolerance values for literal feature-control-frame transcription.

## Acceptance Criteria

- [x] No visible callout uses CSS `perspective`, `rotateX`, `rotateY`, or `rotateZ`.
- [x] Datum A and rotor anchors resolve to different measured feature points.
- [x] At 4–16% scroll, P000420 ring-switch/groove motion remains visible without a filled narrative panel.
- [x] At 25–46% scroll, the gear rotation and extraction remain visible without prose covering the mechanism.
- [x] The P000420 groove sequence uses approved labels: `LOWER GROOVE OSHA BLUE`, `UPPER GROOVE OSHA RED`, and `3X @120°` where contextually relevant.
- [x] The rear LCD/buttons are visible during a stable pre-handoff dwell; JGun stage alpha remains effectively 1 during that dwell.
- [x] Full, reduced-motion, keyboard, touch, and poster-tier behavior are verified.
- [x] `npm run typecheck`, `npm run build`, and fresh `:4173` telemetry evidence are recorded.

## Verification Record

Verified at [`../evidence/JG-014-opening-gdt-lcd-verification.md`](../evidence/JG-014-opening-gdt-lcd-verification.md).

