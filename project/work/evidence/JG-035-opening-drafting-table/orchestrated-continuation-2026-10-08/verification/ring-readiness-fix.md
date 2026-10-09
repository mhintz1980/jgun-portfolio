# Ring verifier readiness fix (verifier-only, 2026-10-09)

Scope: scripts/verify-ring-inspection.mjs only. Implements the accepted race diagnosis (ring-count-diagnosis.md). No runtime/GLB/store/helper edits; no browser/GPU/build run (runtime roster scheduled separately).

## Change (2 lines + comment)

1. Readiness gate before the initial read (line 161) now includes async tool load completion, same bounded 60 s timeout:
   `loaded && __inspectionProof && (window.__inspection?.toolMeshes ?? 0) > 0`. Tool census is assigned only after the knurling-tool.glb fetch+parse (ringRuntime.ts:129); the old gate raced it, so `toolMeshes` read 0 and check() aborted each loaded case (frames 0, ring-full 2026-10-09).
2. Hole-oracle sampled times: added midpoint 8.575 (accepted proof gap; matches capture-owner-revisions ring time). Oracle formula/schedule untouched: blend ramp 1.2->2.4 / reopen 8.2->8.95, black 9.3, patches/apertures 12.

## Preserved verbatim (static asserts, all true)

+ `initial.ringMeshes > 0 && initial.toolMeshes === 12` + original message.
+ All seam/hole/geometry thresholds: OD/width literals, roller clearance/axis, seam-roi ratio gate, holePlug soft checks, ramp monotonicity, reopen/black checks.
+ Second readiness wait (fallback path, timeout 120000) untouched; seek/parsers unchanged.

## Hashes

- Before: C25AC8062BF4A88384CA65C5E0B083612500DD916FDE79549694E85CEA550CB7
- After: FA8A0ADAAE157EFA91CDD74669D9AC237F0B064B5303DB1AFE011DAA91BF0BD8

## Verification

`node --check scripts/verify-ring-inspection.mjs` exit 0. `git diff` reviewed: only the two intended hunks. Static parser asserts: assertion-12 retained, 8.575 inserted after 8.2, new gate present, oracle formula byte-identical, 120000 wait intact.

## Runtime commands (scheduled later, not run here)

`node scripts/verify-ring-inspection.mjs --url=http://localhost:5199 --out=<dir> --focused` (iteration), then full roster without --focused on :4173 preview after rebuild/restart.
