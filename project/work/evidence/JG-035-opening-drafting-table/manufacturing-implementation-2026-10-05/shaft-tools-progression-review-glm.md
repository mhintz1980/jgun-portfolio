**VERDICT: SHIP** — no defects against requirements 1–4.

Verified independently (read-only; no files edited, no TODO/queue docs read, generator not run):

**A1 outline.** `cutter_outline.mjs` implements the conjugate envelope as specified: 7200 legacy "6.0" radii at 0.05°, rolled over one 18° cutter pitch at 0.02° with signed ratio −2 and centre 15.5 mm, minimum work-material radius per 0.05° bin, 0.005 mm stock, clamps exactly 15.5−6.0834−0.15 = 9.2666 and 11.2032. Committed JSON: 360 points, 18° span, radii 9.411633–11.200975 (clamps are bounds, correctly not extrema), and the live `profile-study.json` sha256 matches the stored metadata, so the artifact is current. The four-bin flank test in `tools.test.ts` is a genuinely independent recomputation.

**A2 constants.** I diffed every `toolSpec.ts` constant against `report.json` directly: shaper (teeth 20, centre 15.5, ratio −2, tip 11.2032, thickness 1.2, stroke [2.17, 9.7749], overtravel 0.5, backoff 2, hub/clamp/arbor [8,6]/[9,3]/[7,12]) and hob (R 5.87, module 1, starts 1, lead 5.5587°, length 16, centre 10.1618 = root+R, stop 9.5249, infeed −4.195, retract 2.5, collars R+1, arbor R−1.5) all equal. Collar width and arbor length are leaf-pinned, tested as such and disclosed ([tools.test.ts:77](src/scene/inspection/shaft/tools.test.ts:77)).

**A3 budgets.** Live rebuild of the exact geometry (esbuild blocked by the sandbox, so a verbatim translation through installed three): shaper 7564 ≤ 12000, hob 3596 ≤ 20000, 265 instances, cutting-edge radius 11.200975 ≤ 11.2032 — identical to the gate's evidence.

**A4 law.** Executed the real `progression.ts` module (Node type-stripping): final depth leaves all 7200 legacy samples unchanged (drift 0); depth 0 fills to OD exactly; engaged-space previous-depth ahead of `edgeY` correct; monotonic in depth and yc; final-yc approved floor max error 0.004425 mm < 0.01 at y 9.72/10.92/13.78. The GLSL patch matches the CPU law clause-for-clause — mode/shaft gating ([progression.ts:269](src/scene/inspection/shaft/progression.ts:269)), shaping OD clamp (:287), hobbing max/min clamp (:297), band ends, space indexing, engaged logic; near-axis +X fallbacks and the OD-only radial normal blend are present; the stress overlay is an additive emissive tint that keeps the metallic response. Per-call functions are allocation-free by both the in-repo AST audit and runtime proxy test.

**Vitest caveat.** The permitted `npx vitest run src/scene/inspection/shaft` cannot execute in this read-only sandbox: config bundling is denied at the workspace-root read ceiling, and `--configLoader runner` fails on a TEMP mkdir. My live probes reproduce the gate's numeric evidence exactly, so A5 is claim-consistent but not re-executed here.

Informational, non-blocking: no-op ternary at [progression.ts:98](src/scene/inspection/shaft/progression.ts:98).

