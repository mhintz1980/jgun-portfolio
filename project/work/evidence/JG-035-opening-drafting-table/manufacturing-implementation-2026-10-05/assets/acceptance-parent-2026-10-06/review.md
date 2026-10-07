# SHIP — finished core export acceptance only

2026-10-06. Native OpenAI read-only source/evidence review of the GLM-produced exports
(producer attribution from PLAN/logs). Only this review file was written. No findings
require an export repair under the approved leaf requirements.

**0.0531953774 mm interpretation:** lite approvedshaft genuinely exceeds the 0.05 mm
dense sampled symmetric surface figure; retain `surface_within_tier_limit=false`.
This is explicitly report-only for shafts, not a waived acceptance threshold.
`assets/lite-completion-spec.md:9` defines the gated method as section polylines,
tooth count/clock, runout floor and silhouette, with each specified error ≤0.05 mm
and shaft ≤15,000 triangles. Its “all errors” refers to that enumerated suite.
`scripts/manufacturing/export_study.py:452-460` implements it;
`:898-905`, `:1027-1036` and `:1079-1086` explicitly separate the dense surface
diagnostic from shaft publication. Non-shaft parts retain the surface gate.
The plan `docs/jgun-manufacturing-inspection-plan.md:139,153` requires profile
preservation/budgets and does not impose a global sampled-surface shaft threshold.
`assets/legacy-housing-spec.md:11` preserves the existing shaft gates unchanged.

**Fresh evidence:** parent Blender report is complete: `report.json:2956-2957`
confirms source_unchanged/pass; both tiers pass at `:1564,2947`. Bundle measurements
exactly equal the earlier acceptance report. Fresh independent draco output is
byte-identical to the earlier decode. I additionally rehashed all four immutable
source inputs against the completed parent report: all equal. Every enumerated shaft
section is present; decoded geometry hashes match producer v3, and v3 shaft hashes
equal v2.

- Both tiers retain eight named nodes: legacyshaft, approvedshaft, approvedhousing,
  legacyhousing, legacybearing, legacyring, approvedbearing, approvedring.
- Approvedshaft section maxima full/lite **0.00653191/0.04486114 mm**, runout floor
  **0.00048188/0.00880708 mm**, silhouette **0.000031665 mm**; limits **0.025/0.05 mm**.
  Both shafts have ten teeth, zero clock delta and zero ray misses.
- Housings: **15,000/9,000 triangles each**; seat-section error
  **0.00194718/0.00312852 mm**. All non-shaft surface errors pass their tier limits.
- Housing registration: zero unmatched both directions; **254 seat vertices** each
  shifted **+2.75 mm**, other vertices coincident (full14,323/lite8,412), tolerance
  **0.005 mm**. Support bidirectional residual ≤**9.54e-7 mm** against
  **[0,+2.75,0] mm**; exactly one baked shift, sole export_yup conversion.
- Draco normals: zero nonfinite/zero normals; maximum unit error **1.723e-7**.
- Full/lite: **678,008/415,424 bytes**, **95,183/49,706 total triangles**,
  approvedshaft **47,976/14,499** (caps50k/15k), **8 primitives each** (cap25),
  bytes below2MiB. Runtime SHA256 **17f90d73…/b38b91fa…** matches producer/archive.

This supports parent D4 core-export acceptance. Geometry review reuses inspected
producer measurement functions; Draco decode is independently implemented.
Measurements are sampled, not a certified global Hausdorff bound. Overall G2,
tooling/manufacturing truth, runtime performance, rendered normals and owner visual
approval remain separate.
