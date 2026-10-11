# Runtime seat, round 2: feedback fixes (keep it lean)

You are the runtime seat (Sonnet 5.5, high, `tier-worker`). Make the code changes below, run the EXISTING gates once, report briefly. Do NOT write new tests, new verifier/gate scripts or extra validation; only edit the existing pins that these changes make wrong, each with a one-line reason. Soft budget 150k tokens.

Repo (absolute paths, no `cd`): `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, branch `quiet-machine/integration`. You wrote the round-1 code (`src/scene/rl300/prepareModel.ts`, `QuietMachineScene.tsx`, `v16Materials.ts`); read your own notes in `project/work/evidence/rl300-quiet-machine/35-v16-round-1/runtime/runtime-notes.md` first.
Tracked files you may edit: `src/scene/rl300/prepareModel.ts`, `src/scene/rl300/QuietMachineScene.tsx` (only if needed), `src/scene/rl300/preview.test.ts` (existing pins only), `scripts/verify-jg033-preview.mjs` (existing pins only). Nothing else. No git write commands. No GPU/browser/server. Torque page and `public/models/msp-enclosure.glb` untouched.

## New inputs (already built by the asset seat; read, do not regenerate)
- `public/models/rl300-extra-parts.glb` now also has root `PUMP_HOUSING` with eight MAN meshes (`MAN-6650459107-1.000` ... `.007`, V16 materials) and root translations: `DUCT_EXHAUST` [0,0,.0154], `GAUGE_DIALS` [0,0,.0140], `PUMP_HOUSING` [0,0,.0141] (V16 to shipped frame, already applied by node transform; `updateMatrixWorld` bakes them).
- `src/scene/rl300/v16-part-materials.json`: MAN extras keys `MAN-6650459107-1000` ... `-1007`; the old key `MAN-6650459107-1` is gone (the shipped fused node stays as is on lite).

## Changes
1. **Keep, never cut:** `PART_POLICY['RL300-CPM-3001-1'] = 'keep'` and `PART_POLICY['RL300-P-CPM-2001-1'] = 'keep'` (owner: they must not disappear with the section). Both exist in the full and lite GLBs. Update the existing keep-count pin (6) and `RULING.keep` in the verifier.
2. **Exhaust line stays visible (owner recommendation accepted, not cut):**
   - extras policy: `EXHAUST_CONNECTOR_PIPE: 'keep'` (was `'section'`);
   - the stack `EXHAUST PIPE-1` is `keep`: add it to `PART_POLICY` AND make sure its chrome ruling still wins: `finishFor` currently returns null for `keep` before it reaches the `part === EXHAUST_PIPE` chrome check, so move that check above the keep return (the existing finishFor pins must still pass).
3. **Stack offset:** translate the geometry of every mesh under the `EXHAUST_PIPE-1` node by `EXHAUST_STACK_OFFSET = [0.4, 0, -0.0496]` (glTF metres; V16 is +0.40 x and -0.065 z from the shipped stack, plus the +0.0154 engine-frame shift the connector now carries, so the stack stays coaxial with the connector). Apply it before baking, on both tiers (lite has the same node), with a comment giving the derivation. The shipped GLBs are never edited.
4. **MAN replaced by the extras:** when extras are present and contain a `PUMP_HOUSING` root, skip the shipped fused mesh `MAN-6650459107-1` (full tier). Count its triangles in a new `counts.replacedTriangles`, NOT in `removedTriangles` (keep `removedTriangles` meaning the ruled removals). On lite (no extras) it stays as is. Update the verifier's `sourceTriangles - keptTriangles == 108 + airway + removed` arithmetic to include `replaced` on the full tier, nothing else.
5. **Extras through the existing finish rules:** extras meshes call `finishFor` with the BASE material name (V16 name in the extras GLB, e.g. `MSP_BLACK_CHASSIS` must still render the ruled `#161e25`), root = the extras root name. `PUMP_HOUSING` extras merge into the existing `PUMP_HOUSING` buckets by key. Extras policy table: `GAUGE_DIALS: keep`, `PUMP_HOUSING: keep`, `EXHAUST_CONNECTOR_PIPE: keep`.
6. **Draw-call budget** (pins stay `< 150` full / `< 90` lite; round 1 measured 149 / 88, and the changes above add buckets): reduce draws without changing the look: (a) `castShadow = false` for the `GAUGE_DIALS` root buckets (the dials are 78 mm; the lens already has none); (b) merge buckets whose V16 values are identical (same colour, metalness, roughness, clearcoat, opacity, same root, same cut/whole, same repaint) under one key. Report the predicted batch count before/after in your notes; do not tune looks.

## Done-when
`npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2` exit 0 (run each once; fix only what your change broke), and the U.1 working-tree and U.2 blocks from `project/work/plans/JG-033-quiet-machine-integration.md` lines 60-76 as in round 1. Then at most 15 lines in `35-v16-round-1/runtime/runtime-notes-round2.md`: what changed, every re-pinned number with its arithmetic.

## Report (short, facts only)
Gate results (one line each), changed files with `rtk proxy git diff --stat`, the re-pinned numbers, predicted draw calls, anything not done.
