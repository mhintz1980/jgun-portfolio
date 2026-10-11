# S2a seat spec: beat records, relocate only (Sonnet 5.5, high, tier-worker). Single writer for all S2a code.

Goal: make each beat a data record and rebuild `SHOTS`, `KEYS`, `POSTERS` and the flow windows from those records, with NO change in any rendered byte. This is a relocation, not a redesign. Plan: `docs/quiet-machine-motion-background-plan-2026-10-11.md` lines 26-40 (tie points) and 64-75 (S2a checklist); read those line ranges only.

Repo `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, branch `quiet-machine/integration`. Absolute paths, no `cd`. Owner standing rule: NO new tests, gate scripts, mutation proofs or extra validation; keep your report short.

## Scope
Writable: NEW `src/scene/rl300/beats.ts` (plain data, no `three`, no imports from three-bearing modules: `shot.ts` must stay import-free or import only `beats.ts`); `src/scene/rl300/shot.ts`, `flow.ts`, `QuietMachinePreview.tsx`; and `AirRibbons.tsx` / `QuietMachineScene.tsx` ONLY if the inventory finds an absolute-u literal there.
Off limits: every test file (`preview.test.ts` and all others stay unedited; a red test means YOUR code regressed, fix the code), `scripts/`, `public/`, `src/shared/`, `v16*`, `prepareModel.ts`, `QM_LENGTH_VH` (unchanged), `phase: u * 12` (stays u-scaled; that is S2b).

## Steps
1. Inventory first: grep every absolute-u literal and `control.u` consumer in `shot.ts`, `flow.ts`, `QuietMachinePreview.tsx`, `AirRibbons.tsx` (incl. GLSL `smoothstep`), `QuietMachineScene.tsx`. Write the table (file:line, literal, which beat/window it belongs to) to `project/work/evidence/rl300-quiet-machine/37-s2a/s2a-literal-inventory.md` BEFORE editing code.
2. `beats.ts`: one record per beat: `id`, `from`, `to`, copy (title/note/caption as now), `keys[]` (camera keys the beat owns; 9 keys for 7 shots, beat 01 owns 0 and .12, beat 04 owns .51 and .61), poster id, and named windows (cut, underside, flow channels, sound fronts). Copy every existing literal VERBATIM (same digits). Do NOT derive them as `from + f * (to - from)`: that changes float rounding and the bytes.
3. Rebuild `SHOTS`, the flattened `KEYS`, `POSTERS`, `cutAt`/`undersideAt` data, `SOUND_WINDOWS` and the flow channel windows from the records. The flattened key order must reproduce `evaluateShot`'s pairwise interpolation exactly. Keep the flow zero branch explicit (comment at `flow.ts:137-140`). Keep `END_CARD_AT` and `VIEWS` values unchanged.
4. Label: change `0{beat + 1} / 0{SHOTS.length}` to `String(n).padStart(2, '0')` for both numbers (prints the same "01 / 07" at 7 beats).
5. Keep EVERY existing export name and module path (re-export if the definition moves). No dead code left behind, no new flags.

## Done-when (run once, paste only pass/fail lines)
`npm run typecheck` exit 0; `npm test` all green (if only `src/scene/inspection/shaft/camera.test.ts` times out under load, rerun that file alone once). Do NOT run `npm run build`, no servers, no GPU, no browser (a GPU seat is rendering from a prebuilt scratch dist in parallel). Do not stage or commit.

## Report (short, facts)
Files changed with +/- line counts; the inventory path; any literal you could NOT move and why; any place where the byte-identical claim is at risk; typecheck/test result lines.
