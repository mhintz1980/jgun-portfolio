# INBOX — Animation redo (owner intent, unscoped)

**Owner (Mark Hintz), 2026-08-30, session close:** "i want to redo the
animation later but lets keep these changes for now."

## What this is

Mark wants to redo the animation — scope deliberately NOT fixed at intake.
At triage, clarify which of these he means (could be all):
- The JGun hero rig animation (CH.01/02 kinematics, explode choreography).
- The scroll choreography itself — camera path, station flights, arc, timing
  (the JG-021 rechoreography layer: `caseStudies.ts` PATH_SEGMENTS,
  `CameraRig.tsx`, `stageWindows.ts`, `SpatialRig.tsx`).
- The whole scroll narrative structure (chapter pacing, beat copy, reveals).

## Context the redo session must know

- Current choreography + verification state: `project/work/evidence/JG-021-sequence-rechoreography-verification.md`
  (§12 documents the 2026-08-30 glow arc end-state: panels opaque
  `PANELS_OPAQUE`, Station-2 light trim env 0.35 / rig ×0.7, Station-2 badges
  `tone="dim"`, bloom + both particle fields live, dissolve hardening
  `progress >= 0.755` gate). All PUSHED `2755c8b..287bf05`.
- Canonical animation reality: `project/context/architecture/animation-spec.md`
  §5–§5.4 (measured beats canon; the owner spec's prose ±Z labels are flipped
  vs measured reality — measurements win).
- Rig canon: `cad-scene-graph-rigging` skill (part-number role table,
  explode offsets, ghost rules — do not regress). Wrench rig was never touched
  by JG-021 and must stay compliant.
- Choreography sync rule: spec §5 tables, project README ladder, and both rig
  skills' tables hardcode the ladder — behavior changes sync in the SAME commit.
- Verification protocol: runtime telemetry only (never vision alone),
  fresh `:4173` after every rebuild, and Mark's standing directive —
  before/after screenshot pairs at IDENTICAL frames for every visual change.
- Note: if the redo supersedes JG-021's choreography, decide at triage whether
  JG-021 gets closed as superseded or remains the baseline record.

## Status

Untriaged. No JG-### ID yet. Assign at triage per `project/README.md`.
