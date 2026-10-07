All checks complete. Both flagged leaves were comparator name-collisions in my harness (recorded frame values equal live frame values); static equivalence holds fully.

**Verdict — source correction (kinematics.ts, SHA 2f78847d…): SHIP**
- Contact law is real: [kinematics.ts:216](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts:216) precomputes each space's first event clamped into the actual stock window, validating cutting phase, axial edge bounds, nearest-space identity and radial contact at load; engagement at :510 requires cutting stroke + edgeY 3.1749–9.875 + infeed; previous depth from pre-entry events at :449.
- My independent in-memory oracle (own cosine-stroke/bisection, no producer tables): 249,601 samples → exactly 40 gains, zero failures (stock/nearest/radial/engaged/retention/previous-depth/ahead-mask/monotone); all ten spaces complete in 11–15 s (all-complete 12.9465 s); events repeat exactly every 4 machining seconds with identical pose; `countedPasses` matches my solve at all 40 boundaries; immutables hold (ratio −π, 0.8 s stroke, 7π/16 follow, hob −φ/10, stop 9.5249, envelope hold).
- Static equivalence: recovery old file hashes to 4509f6b2… live; all 8 rows before==after==current outputs; parent-rerun causal-sweep.json bit-identical (AB890D16…).
- Cosmetic only: [progression.ts:98](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/progression.ts:98) no-op ternary; [kinematics.test.ts:94](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts:94) tautology.

**Verdict — verifier correction (verify-shaft-inspection.mjs, SHA d26d491a…): SHIP**
`node --check` exit 0. [verify-shaft-inspection.mjs:213](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/scripts/verify-shaft-inspection.mjs:213) wraps only authored `jgun-shaft-progression-*` keys, preserves the authored key plus stable suffix (:238), sets `needsUpdate` only on selected materials (:240); corrected S2 causal semantics at :449–:484; all S1–S8/N1–N4 intact (:745); model oracle independent (:18); no weakened tolerance found.

Limitations: CPU-only, in-memory; no vitest/build/browser/GPU run (parent reruns); no runtime or owner acceptance inferred.

