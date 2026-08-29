# JGUN Source Register

This register records durable source provenance and safe usage. Add an entry whenever a drawing, GLB, reference image, external design source, or generated artifact becomes a recurring project input.

| Source | Location or origin | Purpose | Usage restriction / verification |
|---|---|---|---|
| D1-AP animation specification | `../architecture/animation-spec.md` | Canonical measured animation, camera, rig, and telemetry behavior. | Measurements prevail where owner prose conflicts. |
| Owner exploded-animation specification | `../owner-specs/animation-exploded-owner-spec.md` | Owner intent and storytelling reference. | Non-canonical where it conflicts with measured camera/rig reality. |
| JGun gearbox drawings | User-supplied P000420, P000429, P000473, P001132, P001812 PDFs. | Print-authentic datum, feature-control-frame, tolerance, and process annotation style. | Verify exact glyphs/values at readable scale before literal transcription. |
| Torque render reference | `media/torque-render.webp` | PBR material/lighting reference. | Context reference only unless explicitly shipped from `public/`. |
| JGun model role map | `../../../public/models/role-map.json` | Authoritative occurrence names and bounding-box anchors. | Use occurrence/part identity; never guess generic mesh names. |
| M249 transformed GLB | `../../../public/models/m249-transformed.glb` | CH.04 CAD-dissolve asset. | Do not regenerate with bare `gltfjsx --transform`; follow the protected export procedure. |
| RL-300 / MSP Acoustic SAFE enclosure GLB | `../../../public/models/msp-enclosure.glb` — source of truth `C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb`, working file `RL300-SAFE-webexport-v3.blend`. | JG-015 Stage 2 (CH.03 Thermal & Acoustic) hero asset; replaces the procedural enclosure placeholder. | **Committed directly** (force-added past `public/models/*.glb`), not synced. NEVER re-run `gltfjsx --transform` — it collapses the 7 named roots to 2 meshes. Metric, 1 u = 1 m, Y-up, bbox 1.600 × 3.366 × 2.107 m. 7 roots: `ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_INTAKE`, `DUCT_EXHAUST`. Node-rename re-export in progress (`v4-node-rename.blend`). Originating CAD authority: Mark Hintz (owner). Revision: A. Usage restriction: approved by Mark Hintz for portfolio use; no additional client-confidential restriction stated. Reviewed 2026-08-27. |
| GD&T style reference set | `media/gdt/` — four owner-supplied screenshots (2026-08-28): `gdt-fcf-single-frame-parallelism.png` (single 4-compartment frame: ∥ \| 0.004 \| A \| CⓂ), `gdt-fcf-style-sheet.png` (composite two-row frame + single-row frame with leader + menu of 10 frame types), `gdt-drawing-splined-hub.png` (splined gear/hub drawing, SECTION A-A, datum flags, runout/position callouts, MMC), `gdt-drawing-ar15-lower.png` (full ASME Y14.5 AR-15 lower receiver drawing). | Visual target for recreating datum symbols and feature control frames in the HUD/callout layer (JG-021 Workstream 4). | Style reference only — do not reproduce drawing content verbatim in the portfolio; transcribe symbols/frames with values appropriate to the actual JGun/SAFE/M249 parts. Owner-supplied; reviewed 2026-08-28. |
| Agent skill map | `../agent-skills.md` | Required project-specific guidance for agents. | Read appropriate skill before changing its domain. |

## Entry Template

| Field | Value |
|---|---|
| Source name | Human-readable identifier. |
| Location / origin | Repository path, user attachment, or source URL. |
| Purpose | Which decision or implementation it informs. |
| Restriction | License, privacy, read-only, regeneration, or verification constraint. |
| Reviewed | Date and reviewer. |
