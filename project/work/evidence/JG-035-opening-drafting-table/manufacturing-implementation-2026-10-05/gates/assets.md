# Gates: G0 source and mechanical measurements

Scope: Reproducible non-destructive source registry and geometry/registration evidence.

- [x] A1: Re-hash all approved sources and identify the live narrative shaft occurrence and extraction correspondence.
  EVIDENCE: geometry/measurement-summary.json baseline_matches=6; geometry/FINDINGS.md live path Default > D1-AP Gearbox > A000881-1 > occurrence of P001835-2 > P001835-2, extract payload/accessors identical, vertex error 0.0 mm; hashes unchanged after run.
- [x] A2: Measure shaft profile, lead-out/face/journal/shoulder, legacy and approved support transforms and exporter registration; record numerical uncertainty.
  EVIDENCE: geometry/source-registry.json registration, supports, axial_sections and leadout; +2.750000101/+2.749999985 mm, 0.0 clock delta, face 3.1749 mm, floor 13.78 mm, authored sweep end 14.0639 mm, uncertainty screen 0.002/0.02 mm. 6 mm remains construction radius only.
- [x] A3: Check revised teeth against all neighbours including K000180-1; report bearing separability and non-manifold/normals findings, with no unsupported clearance claim.
  EVIDENCE: 162 meshes scanned, 40 near neighbours checked. K000180-1 has 0 triangle pairs and 5.461 mm sampled distance. Findings recorded as unresolved: planets x4, ring_NEW, K000131, ROTOR triangle crossings; one reported non-manifold edge; bearing one component after weld, races unresolved; no clearance claim. Classified 2026-10-06 by mechanical-review/final-glm-review.md (SHIP within named limits): ring paired 0.008978 -> 0.008949 mm pre-existing fit (delta -0.000029); bearing 0.000 with 0 crossings; housing 3.687295 confirmed artifact (0 crossings, open shell, witness r 6.01 vs bore min r 19.2746); four P000247 contacts keep inherited 0.5303/0.8140 overlap with |delta| <= 0.00016, inherited not new; races remain unresolved; study cycles are sampled radial proxies (cycle_proxy_feasible=false).
- [x] A4: Measurement script is independently rerunnable with source hashes and concise machine-readable output; derive no source changes.
  EVIDENCE: scripts/manufacturing/measure_g0.py; command in geometry/FINDINGS.md; final line G0_MEASUREMENT; outputs 321 KB registry and 8 KB summary. Source hashes are rechecked in-script.

Open G0 limit (updated 2026-10-06): swept tool-envelope clearance is certified (camera/clearance-v4/report.json CERTIFIED, 24/24 pairs against the combined error budget, parent rerun equal) and neighbour contact classification is complete within named sampled-proxy limits (mechanical-review/final-glm-review.md). Production tooling, module/pressure angle, bearing-race separability and continuous machine-fit certification remain unclaimed; G2 machining proceeded and was accepted under exactly those limits.
