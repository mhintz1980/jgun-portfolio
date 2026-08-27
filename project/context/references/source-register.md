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
| Agent skill map | `../agent-skills.md` | Required project-specific guidance for agents. | Read appropriate skill before changing its domain. |

## Entry Template

| Field | Value |
|---|---|
| Source name | Human-readable identifier. |
| Location / origin | Repository path, user attachment, or source URL. |
| Purpose | Which decision or implementation it informs. |
| Restriction | License, privacy, read-only, regeneration, or verification constraint. |
| Reviewed | Date and reviewer. |
