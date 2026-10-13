# JG-038 external drawing patch — final checks and review

Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench.
Branch: torque-wrench/rebuild; starting HEAD dc44fb79ed43d6a62db47ae58900afb718ad15d1.
Stage 2 exit was verified in stage2-gates.md before production dispatch. The owner
approved the eight additional factory paths for rollback/resilient disposal only,
plus paperFlex hardening, and authorized the named serialized drawing CPU window.

## Delivery and corrections

- D-core and D-bake were authored by Galileo, pinned tier-worker/GPT-6.1-Sol high.
  Its author ownership was released before parent corrections.
- Factory hardening was authored by Chandrasekhar, GLM-5.3 high, and released;
  that seat was already closed.
- Peirce, GLM-5.3 high, independently reviewed the pre-bake concrete patch and
  returned NOT PASS with six factory-fault findings. Its reviewed 16-file manifest
  fingerprint was 2D85254808EFCACCBF3D7F982EB77FFAA0E8FCF12F0F98FDD4FD45CB49FD7E28,
  and it released read-only ownership.
- The parent repaired all six findings in the released paths and added actual fault
  fixtures inside the already-owned bake test: profile setup is protected after
  material allocation; depth target/material cleanup is single-owner and exactly-once;
  restoration/disposal failures surface when no sink exists while a primary exception
  wins; null exception presence is tracked separately from value; synchronous Troika
  listener/sync registration re-enters construction rollback; installed BatchedText
  data textures receive independent cleanup attempts even if inherited geometry
  disposal throws. node_modules was not modified.
- No success-path geometry, measured pressure math, Ac Fast typography, approved
  annotations, or shader behavior change is claimed beyond the reviewed resource
  safety seam.

## Actual checks

All CPU checks below were run serially by the parent with one Vitest worker and no
file parallelism. No worker ran verification. No build, server, browser, GPU, render,
commit, staging, publication, protected-sibling access, or cross-chat message was run.

1. First final D-bake run: exit 1, 42/44 passed. The two failures were real: profile
   material cleanup was 0/1 expected on Mesh construction failure and depth material
   cleanup was 2/1 expected on render-target construction failure. These matched
   review findings 1 and 2.
2. Final sheetBake suite after repairs and added fault fixtures:
   node node_modules/vitest/vitest.mjs run src/scene/drawing/sheet/sheetBake.test.ts
   --maxWorkers=1 --no-file-parallelism — exit 0, 1 file / 49 tests.
3. Final drawing roster: poseCore, extractionPose, paperFlex, drawingCache, sheetBake,
   breakthroughGeometry, handwriting, ownerAnnotations, and sheetInkRuntime —
   exit 0, 9 files / 140 tests / 21.19 s. This includes actual measured tooth-land
   geometry, fragment geometry, handwriting, installed Troika typography, cancellation,
   factory rollback, and stale adapter guards.
4. Full node node_modules/typescript/bin/tsc --noEmit --pretty false: exit 1 from
   three current original-parent-owned errors only: inspection/ringGeometry.ts:51
   possible null normalMap and two privateSheetRuntime.test.ts vi.spyOn string-key
   errors at lines 21 and 25. No drawing-path TypeScript error remained. This lane
   did not edit those files.
5. Preservation scan across the eight factory files against HEAD: all 239 unique
   uppercase/GLSL token occurrence profiles were unchanged, with zero differences.
6. git diff --check: exit 0. Git emitted unrelated pre-existing LF/CRLF warnings for
   original-parent files only.
7. TypeScript AST value-import closure from poseCore.ts and sheetBake.ts: 20 local
   modules; external dependencies only three, three/examples/jsm/utils/BufferGeometryUtils.js,
   and troika-three-text; zero missing modules and zero state/store edges.
8. The legacy DrawingLinework closure retains its pre-existing quality/scroll adapter
   imports; no torqueWrenchStore edge was added.

## Final source manifest

All 19 authorized product/test paths were hashed after the final test run:

| Path | SHA-256 |
| --- | --- |
| src/scene/drawing/poseCore.ts | d81a30c0ec58e3e0b5267d6678d97b2dc5c5e0715d7c451faa5569051485a703 |
| src/scene/drawing/poseCore.test.ts | 412913c15c690bda0f94ef4bcca3b37a4fd53f30386af85e3a2f06d59bee90e4 |
| src/scene/drawing/extractionPose.ts | 92574ec65107b4a4dbe3cc56f327a7dc9b65e037ae03d05a83f288b9e5dbebc3 |
| src/scene/drawing/extractionPose.test.ts | 387da653e1fab8a75c603e14f1a27268ced7de96110107ecfdd5126e88da51ce |
| src/scene/drawing/sheet/paperFlex.ts | 976b272986c8438b798e7b37321482900cf80d3f3860c82a56c0a231ecc38c2b |
| src/scene/drawing/sheet/paperFlex.test.ts | 1f139e332f3aad26d87cf4b8b8123cb476141ae327ba9c153868f58732219013 |
| src/scene/drawing/sheet/drawingCache.ts | d00fb9bf55534f66c8622433b51258a5706f97f117b0923c6032033d3d156196 |
| src/scene/drawing/sheet/drawingCache.test.ts | b4b03e470c3df0f8c264a6018bf842c83d1a806e6526c6ca7bd0af9751f9ebf8 |
| src/scene/drawing/sheet/sheetBake.ts | 0bf816399e29ea655c48cbd324bcd056b564544b0be52e3e71066c207c1f2971 |
| src/scene/drawing/sheet/sheetBake.test.ts | 3b4ef3e93465d2f8a813175bb451d211e302e6220ab84969605535229041f919 |
| src/scene/drawing/DrawingLinework.tsx | 83b40f2b905ab2ba3e5569b4cf1bf7915d12ddfe663dcb5a27a894e7aa3a954c |
| src/scene/drawing/drawingGeometry.ts | d6d763222530f7a1c4146fddee9f3263936c80f3fc609171e8fd424753b7a58f |
| src/scene/drawing/sheet/composeSheet.ts | eaeca80cd6ecb81d155704d7fa87b9daf3bddc01974b2a7319b72bf2e262f75c |
| src/scene/drawing/sheet/edgeExtract.ts | 1744187278f499d1b9fd17ab507eb6513e1e19bf0914f7ce9624167511f8ba44 |
| src/scene/drawing/sheet/profile.ts | dc6fa125b31af3b4529162cc33e66c8f11b33f15ee743f04ecd0db93213b587f |
| src/scene/drawing/sheet/breakthroughGeometry.ts | 472d0547ea59472a26648f9d1dafbfa9788ef52a027f982a9bb062ee725f0f25 |
| src/scene/drawing/sheet/ink.ts | 3be9983321d866d18827e2f0374254e951ee2594dc0e009ff13f3ac8b711bac1 |
| src/scene/drawing/sheet/sheetText.ts | 6710c1d5a6e324b2d9fc1732fe63fc1062ba51e46e9a82b587352ea341636d10 |
| src/scene/drawing/sheet/breakthrough.ts | ea3d5f033a6948840a740a4b0cf58e9eeba25934e78dcbc67f29db42bf65ba7d |

## Review status and limitations

The repaired patch has not received a second independent PASS verdict. The resumed
Peirce seat stayed running beyond the owner's five-minute stop rule without a final
answer and was closed. Fresh GLM-5.3/high and GPT-6.1-Sol/high reviewer seats also
stayed running without initializing a readable turn and were closed within the same
bounded fallback; an authorized Luna/high seat showed the same provisioning behavior
and was closed. These are agent-provisioning failures, not source-review acceptance
or a claimed model-provider error.

Matched-input runtime registration, real renderer restoration/context-loss, annotation
and pixel visibility, built-chunk isolation, BFCache, and private integrated runtime
checks remain original-parent resource work. No G0-G9 gate, owner visual acceptance,
commit authority, or publication authority is claimed.

## Ownership release

- All 19 product/test paths are released for parent integration review and runtime
  verification.
- Parent authorship of this evidence file and parallel-drawing-readiness.md is released.
- All replacement reviewer seats and the stalled original reviewer seat are closed.
  The completed original author/factory seats are no longer open in this session.
- CPU window released at 2026-10-12 15:21 America/New_York. Builds and browser checks
  may resume in the original-parent lane.

## Addendum 2026-10-12 — second independent review complete

The review limitation recorded above is superseded. A fresh session performed the
missing independent review against this manifest: round 1 (Opus-5.5/high,
owner-authorized fallback seat) returned NOT PASS with two blocking findings —
depthField could let a cleanup error replace the render error with no sink, and
the fault fixtures never combined render error + restore failure + no sink. Both
were corrected in authorized paths (edgeExtract.ts mirrors profile.ts's catch
ordering; sheetBake.test.ts gained the combined fixtures) and the serialized
suite rerun green: 9 files / 142 tests exit 0, tsc exit 0 observed, git diff
--check exit 0. Round 2 returned PASS. Full record, corrected manifest (17
released hashes unchanged plus new edgeExtract.ts and sheetBake.test.ts hashes),
and the release prompt: parallel-drawing-second-review.md in this folder. The
19-path patch with corrections is released to the original parent for
integration and runtime verification. No G0–G9 gate or owner visual acceptance
is claimed.
