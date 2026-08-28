---
id: JG-018
title: Interactive airflow and acoustic-wave systems
status: verified
created: 2026-08-26
owner: Antigravity
todo: TODO.md#active
depends_on:
  - JG-015
  - JG-016
source:
  - ../../context/agent-skills.md
skills:
  - r3f-scroll-performance-guard
  - spatial-hotspot-a11y
  - webgl-telemetry-verifier
implementation_scope:
  - src/scene/stages/AirflowField.tsx
  - src/scene/stages/AcousticBaffleField.tsx
  - src/scene/stages/Station2_AcousticEnclosure.tsx
acceptance:
  - Interaction explains real enclosure engineering rather than providing decorative particles.
  - Raycast and dynamic geometry work is bounded and tier-aware.
  - Touch and keyboard alternatives exist where interaction conveys required information.
verification: ../evidence/JG-018-airflow-and-acoustic-interaction-verification.md
commits: []
---

# JG-018 — Interactive Airflow and Acoustic-Wave Systems

## Outcome

Make the Stage 2 enclosure explain airflow and noise-control design through bounded interaction tied to real duct, baffle, exhaust-port, and isolation-mount geometry.

## Implementation Steps

1. Use JG-015 named subassemblies to bind airflow and wave effects to actual enclosure features.
2. Add a bounded raycast plane and pooled particle/instance behavior; avoid unbounded per-frame allocation or scene-wide raycasting.
3. Represent acoustic-wave propagation as restrained additive rings at the exhaust port, with a non-motion equivalent for reduced-motion/poster tiers.
4. Provide a concise accessible explanation and touch-friendly interaction outcome for every interactive visual.

## Acceptance Criteria

- [x] Airflow and acoustic effects are tied to verified Stage 2 model anchors.
- [x] Mouse, touch, keyboard, reduced-motion, and poster-tier behavior are defined.
- [x] Interaction does not obscure the enclosure or replace engineering explanation with decoration.
- [x] Full and medium tier runtime evidence demonstrates bounded scene cost.

## Verification Record

See [`../evidence/JG-018-airflow-and-acoustic-interaction-verification.md`](../evidence/JG-018-airflow-and-acoustic-interaction-verification.md).
