# JG-038 Stage 3 — Ring R1 independent extraction review

Date: 2026-10-12  
Reviewer: independent Codex reviewer (Noether recused; no authorship or parent-session edits)  
Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`  
Baseline: `git show HEAD:src/scene/inspection/ringRuntime.ts` at commit `dc44fb79ed43d6a62db47ae58900afb718ad15d1`

## Verdict

The R1 extraction in the reviewed core/wrapper/test bytes is source-ready: it preserves the legacy sampled geometry, material, mask, camera, telemetry, seek, diagnostic, fault, and late-parse behavior while removing root/store/global/proof edges from the core. The parent's final exposure-cleanup and reporting-callback corrections are sound.

One cross-file construction-cleanup blocker remains before the contract can claim that every owned ring resource is attempted on all construction faults. It is pre-existing in unchanged `ringGeometry.ts`, not an extraction regression, and cannot be fixed correctly inside the three R1-owned files.

## Finding

### P1 — ring factory partial allocations are unreachable if construction throws

`src/scene/inspection/ringGeometry.ts:77-80` clones source geometries incrementally; `:88-91` can process them and create the owned normal map; `:118-135` creates materials and patch geometries incrementally. If a later clone, UV pass, material creation, or aperture-patch operation throws, earlier allocations have no disposal path: the function returns neither a ring nor a partial-ownership receipt.

`src/scene/inspection/ringRuntimeCore.ts:211-225` correctly disposes a successfully returned ring on a later construction error, but `ring` remains unset when `createInspectionRing` itself throws at `:212`. Consequently the core cannot attempt those already-allocated geometries, texture, materials, or patch geometries. This leaves a real gap against the R1 requirement that construction/final cleanup attempt all resources (`stage3-runtime-contract.md:21`).

Concrete fault windows include: source geometry 0 cloned and source geometry 1 failing; the normal map created before material or patch construction fails; the first material created before the second fails; or an earlier aperture patch succeeded before a later one fails. These resources are runtime-owned, not borrowed CAD cache resources.

Recommended ownership transfer: give `createInspectionRing` an explicit partial-cleanup sink (or make it internally exception-safe) with per-resource error isolation, then have the core register that sink before invocation. The core should continue to own and dispose only the completed returned ring. A parent session must take `ringGeometry.ts` ownership before changing it; this reviewer had no write scope there.

Severity is a contract blocker for unconditional construction cleanup, not evidence that R1 changed legacy behavior: `ringGeometry.ts` is byte-identical to the baseline commit.

## Verified clean

- **Legacy behavior match**: the extracted bodies at `ringRuntimeCore.ts:170-347` preserve the baseline tool lookup/errors, radius derivation, roller filtering, animation timing, root traversal scaling, wheel quaternion law, ring transforms, finish/opacity laws, hole covers, diagnostic/proof progress, telemetry fields, and camera distance law. The wrapper continues to clamp and mutate the legacy inspection seek state at `ringRuntime.ts:29-36`.
- **Core boundary**: `ringRuntimeCore.ts` has no `inspectionStore`, `window`, `location`, `document`, browser proof, or root-global reference. Browser proof publication/clearing is confined to `ringRuntime.ts:28-42`.
- **Construction cleanup**: the guarded block at `ringRuntimeCore.ts:211-225] handles failures from ring installation, lights, patch enumeration, and resource counting. The added exposure read guard at `:234-241] cleans the completed ring and preserves the original renderer error.
- **Parse and late-result cleanup**: ownership is collected before installation at `:244-258`; stale/current checks prevent mounting, a parse resolving after disposal is disposed once, and final disposal stops/uncaches animation only when those objects exist.
- **Reporting isolation**: per-resource disposal at `:96-100` and `:123-128` cannot abort siblings. The callback guard at `:92-94] prevents a host-reporting throw from interrupting cleanup while still allowing reports for actual disposal failures.
- **Original errors and ownership**: tool download status, missing animation/root/roller/radius messages remain exact. Borrowed source geometry/material are cloned rather than disposed; parsed tool resources and roller material clones are owned and disposed. Current tests separately spy original versus cloned material disposal (`ringRuntimeCore.test.ts:172-176`).
- **Proof identity**: the wrapper overwrites only when the legacy query flag requests it and clears only its own proof object (`ringRuntime.ts:37-42`). The private host uses a fresh local probe and owns no proof global.
- **Former fixture failures**: the current wheel checks use quaternion `y`, matching the unchanged core axis-`Y` law at `ringRuntimeCore.ts:294`, with six-decimal tolerance for the Float32-measured radius. The exposure getter now fails inside the actual guarded construction path, unlike the earlier misplaced injection.

No other blocker or severity-bearing finding was identified in the reviewed R1 files.

## Evidence and boundaries

Reviewed-byte SHA256:

- `src/scene/inspection/ringRuntimeCore.ts`: `1B433AE7B3D7B1D64B19FEB1EDA51DE19972BE0EBC670A012DD9F0696B6100B9`
- `src/scene/inspection/ringRuntime.ts`: `EE4F25D29A49745199650A4F24AC45EF559DD3B9E7F14C99793320B4D7E5053A`
- `src/scene/inspection/ringRuntimeCore.test.ts`: `D078BA8404404890CB673C9175FBB6DFB9DE6275E1E892635A55C9A1585FFFC6`
- `src/scene/inspection/ringGeometry.ts` (read-only factory audit): `B76F25757A33802B40E9664C4EEA7CDC3C3D47A1A1503CD33925090B1B965590`
- `stage3-runtime-contract.md`: `F826018F954F660305B265462894F6FA1422536F90DA9B8FF4CBD9B78F2ECC71`

The reviewer ran no test, build, browser, or GPU job, per the review boundary. “Final 10 tests pass” is parent-reported and was not independently executed. Both required skills were read from `C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md` and `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md`.

## Ownership release

Independent review ownership of R1 is released to the parent. This reviewer wrote only this report and made no source, test, shared-evidence, Git, message, spawn, or sibling-workspace changes.
