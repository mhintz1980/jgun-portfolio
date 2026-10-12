# S5 poster stills: summary (2026-10-12)

The first S5 session stopped after stage 3 (previews and a Modal dry run). The owner took it over on 2026-10-12.

## Result
7 posters rendered on Modal from the scratch copy of the V16 blend (`C:\Projects\msp-render-pipeline-scene-prep\scratch\rl300-posters-v16.blend`, never the master). Job `rl300_posters_v16_a`, frames 581-587, 1920x1080, Cycles, OIDN, 96 spp, dry-run estimate USD 0.1087, status `passed`.
Finals: `final/poster-01.png` .. `poster-07.png` plus `final/contact-sheet-final.png` (untracked, about 20 MB). Not yet wired into `public/images/rl300-*` (QM7b/QM10 repoint, owner decision).

## What was fixed in the scratch blend (`fix/fix_posters.py`, idempotent, `--save` writes the blend)
1. **Glow band above the hex grille on the inlet face** (owner-reported). Cause: `REVEAL_FILL`, a 1.1 x 2.6 m interior area light at z = 1.72, reaches y = -1.4 while the face is at y = -1.355, so a 45 mm strip outside the shell lights the face. Not a material or normals fault (plain diffuse and flat shading both kept it; removing only that light removed it). Fix: its -y end pulled in to y = -1.2 (`size_y` 2.4, `location.y` 0). Evidence: `fix/band-experiments.png`, `fix/band-lights.png`, `fix/band-fix.png`. **The V16 master has the same light** and so the same band.
2. **Beat 4 (lower intake).** `PROPOSED_LOWER_INTAKE` is absent from the V16 blend: the page skips the GLB node (`prepareModel.ts`) and builds the group in `LowerIntake.tsx`. The scratch blend now carries the same boxes (`V2RL300-SAF-1047-5_PROPOSED_LOUVERS`, `PROPOSED_COLLECTOR_DUCT_OUTLET`), sectioned by a boolean cutter parented to `SECTION_PLANE`, with page colours as plain Principled materials (not V16 materials), and the replaced liner `V2RL300-SAF-1047-5` hidden as on the page.
3. **Beat 4 cutaway (owner ruling: option b).** The page eye is below the V16 floor, and the skid members block the intake from every exterior angle. On frame 584 only, five parts are hidden: `V2RLP-SK-4000-A-2`, `V2FTA-FP-46-RL-1000-1`, `V2RL300-SAF-1047-3`, `V2RL200-SAF-1051-9`, `V2RL300-FTS-2003-SAFE-1`. The floor is dropped to z = -0.30 on that frame (S5 had hidden it).

## Open
- (Astra: waived by the owner 2026-10-12.)
- Beat 4 is usable but dark; a brighter variant costs about USD 0.02 per frame.
- Repoint `public/images/rl300-*` and the `POSTERS`/`beats.ts` ids (QM7b/QM10), keeping `.qm-hotspot-layer { display: none !important }` in the `CAPTURE_POSTERS` block.
- Master blend still has the `REVEAL_FILL` band.

## Update 2026-10-12 (later)
- Beat 4 re-rendered brighter: a 150 W area light under the chassis, enabled on frame 584 only (`fix/fix_posters.py`, env `B4_ENERGY`). Previews at 150/500 W: 500 W blows out the whites. Modal job `rl300_posters_v16_b4` (frames 583-584, the dispatcher needs two frames; estimate USD 0.0868) -> `final/poster-04-bright.png` is the current beat 4; `final/poster-04.png` is v1.
- V16 master untouched (sha256 788ae2a2a2f784c5 before and after). Patched copy with only the REVEAL_FILL fix: `C:/Projects/msp-render-pipeline-scene-prep/scratch/RL300-SAFE-photoreal-V16-review-fillfix.blend` (`fix/patch_master_copy.py`).
- Astra waived by the owner for the posters.
