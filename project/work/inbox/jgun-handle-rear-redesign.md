# JGun Handle Rear Endcap — Screen/Button Detail Pass

**Status:** superseded by [JG-025](../plans/JG-025-handle-rear-realism.md) (triaged 2026-09-02 with the owner's reference render and expanded realism dictation — this intake's three items are folded into that plan)
**Type:** visual fidelity pass on the Station 1 handle rear (LCD endcap cluster)

## What the owner wants

The back of the JGun handle will change slightly:

1. The screen light will not be as bright (the rear-LCD glow is too strong).
2. The buttons will carry symbols or text on them.
3. The digital display will show some digital numbers and text.

## Context

- The rear cluster (MANOMETER LCD BK11356, MSP430 MCU, 3.7 V LiPo) is the
  JG-014 rear-LCD reveal feature; the LcdFillLight intensity (2.8 peak,
  `SceneCanvas.tsx`) is the current screen-light source and the first knob to
  turn for item 1.
- Items 2–3 are texture/decal-level work on the LCD endcap meshes — coordinate
  with the wrench-rig constraints (Default.glb re-export rules, D1-AP part
  identity, animation-spec §5 same-commit sync if any ladder behavior moves).
- Likely belongs to a Station 1 polish task alongside the JG-021 materials
  round-2 (enclosure color assignment) — triage both together.

## Verification bar

Runtime telemetry + committed before/after screenshots per the standard
webgl-telemetry-verifier discipline; reduced-motion/poster tiers must still
read correctly.
