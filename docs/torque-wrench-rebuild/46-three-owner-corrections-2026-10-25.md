# Three owner corrections — implemented and locally verified

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`
Branch: `torque-wrench/rebuild`, updated from GitHub to `57e903d6`.
Current owner request: continuous ascent through paper shatter, smooth black housing OD finish, richer input-shaft FEA gradient. This request supersedes doc45's broad flat-red undercut direction.

- [x] Replace the rise-floor plateau with a continuous monotone C1 pose curve through the full endpoint at progress `.46`.
- [x] Apply a private extraction correction so sheet retirement cannot cancel or reverse the composed world ascent. Preserve shared extraction geometry, sheet-relative clearance, pre-rupture matrices and final identity.
- [x] Remove periodic lathe roughness modulation from `blackOxideSteel`, including gearbox housing P000245 and clutch housing P000420. Retain bright-steel lathe detail, real painted indicator grooves and ring-switch knurling.
- [x] Replace the broad flat FEA core with a smooth narrow axial peak at the measured groove floor. Preserve full circumferential symmetry, the shared legend and alloy minima `.55`, `.72`, `.90`; both stress shaders use the same field helper.
- [x] Run typecheck, full unit suite, production build and native-scroll browser verification.

Validation:

- `npm run typecheck`: passed.
- `npx vitest run --testTimeout=60000 --maxWorkers=4`: **106 files, 1178 tests passed**. The first unrestricted parallel run hit an existing explicit 15-second scene-import test timeout under load; the bounded run passed without changing that test.
- `npm run build`: passed.
- `git diff --check`: passed.
- `node scripts/verify-torque-owner-three-fixes.mjs --url=http://localhost:5352/torque-wrench/ --out=output/playwright/owner-three-fixes-production`: **10/10 gates passed**, zero browser errors.
- Actual browser renderer: ANGLE, AMD Radeon 780M, Direct3D11, 1440×900, DPR 1.
- Fourteen native-scroll ascent checkpoints from `.42` to `.46`: every sampled position advances along the ascent; minimum sampled step 2.754 mm; endpoint world matrix is identity.
- All seven live black-oxide role materials use the shader cache's `base` path, without lathe stripes.
- FEA overlay A/B colored pixels: 4140 **20,471**, 4340 **11,553**, C300 **8,254**. Each rendered capture contains measurable yellow, green, cyan and blue regions; shader uniforms retain the exact alloy minima.

Evidence: `output/playwright/owner-three-fixes-production/report.json`, `ascent-*.png`, `smooth-housings.png`, `fea-4140.png`, `fea-4340.png`, `fea-C300.png` (local generated artifacts). Reproducible verifier is committed source material under `scripts/verify-torque-owner-three-fixes.mjs` once this change is committed.

Worker requests: GPT-6.1-Sol High for ascent and FEA; GLM-5.3 High for materials; GLM-5.3 Max for independent review. Earlier Luna/GLM-Flash reader attempts encountered HTTP 429; one Luna reader returned useful FEA history. Model names here record requested tool routing, not independent upstream provider receipts.

Independent GLM-5.3 Max review: **SHIP, no production blockers**. Reviewer independently passed 63 focused tests and typecheck. Non-blocking evidence limitation: live material telemetry uses original-role identity and does not enumerate the ghost-cloned P000245 bucket directly; housing role and clone tests verify its shader path.

Preview: `http://localhost:5352/torque-wrench/`. Owner visual acceptance remains open. Changes are local and uncommitted; no push or deployment was performed.
