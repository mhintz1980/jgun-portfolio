# Ring-full "12 verified prop meshes" diagnosis (2026-10-09)

**Verdict: runtime load race, not census drift, not a missing asset. The 12-mesh assertion is correct for the current GLB; do not weaken it.**

Report read: `orchestrated-continuation-2026-10-08/verification/hardware-acceptance-continuation/ring-full/report.json` (started 2026-10-09T00:47Z, installed Chrome ANGLE/D3D11, url 127.0.0.1:4174). All four loaded cases fail once at `verify-ring-inspection.mjs:163` `initial.ringMeshes > 0 && initial.toolMeshes === 12`; `check()` throws (line 15), so `frames: 0` — holePlug/seam/masks never ran and the whole ring-full run is invalid. `requests[]` shows `knurling-tool.glb` was fetched in every loaded case; `errors[]` is empty.

**GLB census (local chunk parse, no renderer):** `public/models/knurling-tool.glb` = 12 meshes / 18 nodes — KT_LOWER_HOLDER (3 holder meshes + wheel LH), KT_TOOL_ROOT (4 material-split meshes), KT_UPPER_HOLDER (3 holder meshes + wheel RH), KT_CONTROL root; clip `KnurlTool_Approach_Contact_Traverse_Rectract` naming matches `buildMechanics` lookups. "17" has no basis: 18 is total nodes, 12 are meshes — the assertion matches the asset.

**Mechanism:** 7e91899 (Oct 7) moved the tool to an async fetch; `toolMeshes` is only assigned after fetch+parse (ringRuntime.ts:129), while the verifier gate `loaded && __inspectionProof` (:161) is satisfied earlier (InspectionScene.tsx:123, ringRuntime.ts:211). Baseline-ring (Oct 5, toolMeshes 12/ringMeshes 1, 0 failures) predates the GLB entirely (asset absent before 7e91899) — not comparable.

**Narrow correction:** keep `=== 12`; change only the wait — `waitForFunction(() => window.__inspection?.toolMeshes > 0)` (or fold tool readiness into `loaded`) before line 163. `ringMeshes` is creation-time and guarded non-empty (ringGeometry.ts:67); the report stores no measured value for it in failing cases.

Current SHA-256 prefixes: glb `e5bff99439eb6655`, verifier `c25ac8062bf4a883`, ringRuntime `b4452a7ddc940da2`, timeline `6683e941888c8d1d`. Baseline report records no hashes (date/git establish staleness).
