# S5 poster stills: seat spec (Sonnet 5.5, high). Intent and guardrails, not exact outcomes: adjust as you learn, report what you changed and why.

Owner wants 7 poster stills of the RL300 (one per Quiet Machine beat) rendered from his V16 Blender model, showing the **section cut** the way the live page does (not the closed machine). He judges by looking; the first look matters more than being faithful to every detail of this spec.

## Fixed guardrails
- The master `C:\Projects\CAD\RL300-SAFE\RL300-SAFE-photoreal-V16-review.blend` is NEVER opened for write, saved, or moved. Work on a scratch copy: `C:\Projects\msp-render-pipeline-scene-prep\scratch\rl300-posters-v16.blend` (create `scratch/`; this is the file the owner asked you to create). Verify the copy's sha256 starts `788ae2a2a2f784c5` before changing it.
- Do not edit this repo's tracked files, do not stage or commit anything, do not touch `public/models/msp-enclosure.glb` or the torque-wrench page. Evidence goes to `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine\project\work\evidence\rl300-quiet-machine\38-s5-posters\`.
- Local Blender: `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe --background --factory-startup <blend> --python <script>`. Gotchas that burned earlier sessions: `TRACK_TO` constraints do not resolve in `--background` (set `rotation_euler`/matrix directly); bash heredocs eat backslashes (write scripts with the Write tool, pass paths forward-slashed); `python3` on this machine hangs (use the pipeline's `./.venv/Scripts/python.exe` or node).
- Modal: do NOT run `--execute` in this task. Prepare everything and stop (see Stages).

## Inputs
- Camera per beat: the live page's camera at each beat's midpoint u = (from + to) / 2, desktop (non-narrow) layout: `evaluateShot(u, false)` in `src/scene/rl300/shot.ts` gives `position`, `target`, `fov` (vertical, degrees) and the section `plane`; beat spans are in `src/scene/rl300/beats.ts`. Coordinates are glTF Y-up metres; the blend is Z-up, so convert (verify the convention with a known object: e.g. the GLB bbox of one named part vs its blend bbox; do not assume).
- What the live page cuts vs keeps whole: `src/scene/rl300/prepareModel.ts` (`PART_POLICY`, `finishFor`) and `src/scene/rl300/v16-part-materials.json`. The shell/walls/insulation are cut by the plane (the +x side is removed); equipment is kept whole; the CPM panels, exhaust line and connector are kept. Cut direction and depth follow `plane`.
- Look: the V16 materials/lighting already in the blend ("preserve existing"). Output 1920x1080, Cycles, OIDN, 96 samples as in `jobs/rl300_18_still_v16_a.json`.
- Pipeline: `C:\Projects\msp-render-pipeline-scene-prep` (`scripts/cloud_job_render.py`, a manifest example is `jobs/rl300_18_still_v16_a.json`). Per the owner: run with proxy env vars unset; output dir must not already exist unless `--resume`; timeline mode = render authored frames, so for 7 arbitrary cameras use the scratch blend with 7 camera objects or 7 timeline frames carrying the camera/cut state (your choice, whichever the pipeline renders cleanly).

## Stages (stop after stage 3 and report)
1. Inspect the scratch copy: scene camera(s), frame range, whether any cut/section/boolean already exists, object count, render settings. 5 lines.
2. Build the 7 views in the scratch blend: camera + cut state per beat. Pick any cut method that gives a clean result in Cycles (clip via material/geometry, boolean on the shell objects only, or hide/split) and say which. Section caps are nice-to-have, not required for the first look.
3. Local low-res previews (960x540, 24 samples, local GPU if free) of **beat 3 (u .34) and beat 4 (u .51)** and then all 7 as a contact sheet if those two look sane. Save to `38-s5-posters/preview/`. Prepare a Modal manifest `jobs/rl300_posters_v16_a.json` (do not execute) and run the dispatcher WITHOUT `--execute` as a dry run into an output dir that you then DELETE (a leftover dry-run dir aborts the real run). Report the dry-run's estimate (frames, GPU time, USD) from its `request.json`.

## Report (short)
Cut method + why; conversion convention you verified; paths of scratch blend, manifest, previews; the dry-run estimate; anything about the look you would flag (hollow walls, missing caps, odd materials). Token use is yours to watch; stop and report if you pass ~150k.
