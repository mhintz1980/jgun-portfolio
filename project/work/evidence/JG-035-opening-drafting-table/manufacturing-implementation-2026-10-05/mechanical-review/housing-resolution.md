# P000725 housing finding: classification artifact (parent decision)

Inputs: contact-classification.json (pair `housing P000725`), housing-diagnostics.json and housing-section.png from `classify_contacts.py --housing-only`. Source hashes before/after unchanged; Default.glb SHA-256 8b07246c...7a257 unchanged.

The reported 3.687 mm "penetration" is one sample out of 781,940 evaluated approved samples:

- Witness point (shaft-local mm) [3.137, 9.989, -5.128] has radius 6.01 mm: a hobbed tooth tip of the approved shaft. The legacy grooved shaft has no material there (section radius 4.05-4.13 mm at that Y), which is why the legacy pair has no candidate sample.
- Housing section at the same Y: minimum radius 19.27 mm (legacy and approved identical). The witness therefore sits in the open housing bore with about 13.2 mm radial air; 3.687 mm is the unsigned distance to the nearest housing triangle (4983), which lies outward of the point.
- Triangle-tree overlap between approved shaft and housing: 0 crossings. Inside vote 2 of 3 rays (not unanimous); nearest-normal test says outside (normal dot = +3.51 mm). unanimous_inside_max_depth_mm = 0; corroborated_inside_max_depth_mm = 0.
- Housing mesh welded at 1 um is an open shell: 12,260 boundary/non-manifold edges (legacy 12,242). Ray parity is not a valid solid test on it.

Decision: no housing interference is introduced by the approved revision. Outside-only sampled minimum gap is 0.240 mm for both legacy and approved pairs (the support seat clearance, unchanged by the +2.75 mm relocation since housing is unmodified at that seat).

Other pair status, unchanged by this decision: retaining ring old/new paired penetration about 0.009 mm (pre-existing CAD fit, identical before and after); bearing zero; planet tooth overlap about 0.53-0.814 mm present in both legacy and approved assemblies, attributable to the existing CAD tooth clocking of the static assembly pose and not introduced by the revision. These pre-existing conditions are recorded, not repaired, since accepted CAD is immutable; the inspection finale animates planets with the existing narrative convention and does not claim a certified mesh fit.

Open G0 items after this decision: shaper/hob tool-envelope clearance (camera/method-review.md FIX-FIRST) and core-asset review.
