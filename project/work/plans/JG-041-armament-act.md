# PLAN v5: JG-041 armament act, modular render lane on Modal (2026-11-13)

Status: render lane built, first full render done, look decided (Cycles shade, 2026-11-14; see Look decision); frames NOT in the repo (decision below). Film wiring and any homepage change need Mark's review first.
Authors: Sonnet 5.5 (orchestrator), Opus 5.5 (Modal workflow plan; frame-format and commit-scope advice), Fable 5.2 (plan review). Handoff: `docs/HANDOFF-armament-lane-2026-11-13.md`.

## Direction
Owner ruling 2026-11-13 (on `main`, `docs/torque-wrench-rebuild/00-owner-rulings.md`): the showreel direction is **"The Line"** (slices owner-approved 2026-11-09 on `torque-wrench/rebuild`: logo ident `0de294ef`, slice 1 `e3c05882`, slice 2 `f2b5ae44`). "The Thread" is not the direction. An earlier draft of this plan said to keep the thread vocabulary (from the 2026-11-08 TODO); that is superseded. The armament act with the real 3D models is the top requested improvement.

## Owner decisions (2026-11-13, Mark)
1. Provenance: every full firearm assembly is a representative stand-in, except the AR-15, ACR and M249 models, which are Mark's own. Stand-ins are used only because his own full-assembly models are not available to him. Recorded in `remotion/clips/armament/manifest.json`.
2. Look: the line resolves to **shaded** (two passes: ink line pass + clay shade pass).
3. The act **grows**, and the work is **modular**: every clip must be usable alone (other site sections, future sites). See `remotion/clips/README.md`.
4. **Full 360 spin in about 1-2 s.** Rendered at 2 deg/frame (180 frames per pass); the film plays it fast and blends frames for motion blur.
5. Run on **Modal**; record issues (`project/work/evidence/JG-041-armament-act/issues-log.md`). Local computer only for small tests while idle.
6. A structured home in the repo: `remotion/clips/`, plans in `project/work/plans/`, evidence in `project/work/evidence/`.
Side project (separate): Agent Software Factory, documented in the Second Brain (`04-Projects/agent-software-factory/`).

## Opus 5.5 advice (high effort), as applied
- **Frames: commit none yet.** Git history is permanent and v1 will likely change after review; each re-render adds ~76 MB forever. Commit once, after the film review approves the clip: all 180 angles, 1920x1080, near-lossless WebP (`cwebp -near_lossless 60`, size to be measured first), in `remotion/clips/armament/<clip-id>/`, not in `public/`. Rejected: 1280 (upscaling softens ink lines), lossy WebP (ringing under multiply), fewer angles (slow profile hold needs 2 deg), video with alpha (frame accuracy, browser alpha, breaks the reuse contract).
- **Code and docs: commit now, after a scrub** (done): brand/product names and per-machine absolute paths removed from `manifest.json`; local paths now live in the gitignored `remotion/clips/armament/local-paths.json`. The clip entry is added in the same commit as its frames (`"clips": {}` today, so nothing dangles).
- **Backup and integrity:** frames stay in scratch; hashes recorded below; a cloud/Modal-Volume backup is still to do. "Reproducible" only holds on Mark's machine (models are never committed), so losing the local model files means the frames cannot be rebuilt.
- **Wiring:** Remotion `staticFile` reads only `../public`, which ships with the site; `build/excludePublicAssets.ts` takes exact file paths (360 frames need a prefix feature plus a test change, or another delivery route). Decide at wiring time.

## Cost
Smoke test $0.0022. Full run (180 angles x 2 passes, 1920, 6 shards x 4 cores): **$0.48 measured** (rate-derived, rates from the msp pipeline, unverified against Modal's pricing), 24 min wall. Shards took 710-1410 s against a 1500 s timeout.
2026-11-13/14 session: hero stills $0.0062 (contour-only $0.0026, full line $0.0036); Cycles tests v1 $0.0006, v2 $0.0008; 12-angle Cycles sweep $0.0014. Total about $0.49 of the $30 free tier.
Projected, NOT measured: the shade-only Cycles re-render (180 frames, 1920, 24 samples) is about $0.10-0.12 on one shard (extrapolated from one 1920 frame at 8.9-11 s container time).

## Done and verified (2026-11-13)
- Blender 5.2.2 LTS on Modal CPU runs Workbench + Freestyle. Smoke frame vs local: line pass pixel-identical, shade pass mean abs diff 0.148. Blender 5.3 is out (installed locally); staying on 5.2.2 LTS for parity; test 5.3 on a copy later.
- Full run: 360/360 frames, 1920x1080, shade corner alpha 0, line background white, consecutive-frame diff mean 1.94 (max 3.1), wrap 358->0 diff 0.85.
- Look note (Workbench v1): studio light is view-fixed; measured darkest angles are 60 and 240 deg. Resolved 2026-11-14: Cycles shade (see Look decision).
- Scratch locations (outside the repo): `C:\Projects\CAD\Armament\renders\ar15-pattern-carbine-a-v1\` (PNG, 294 MB), `...-webp\{line,shade}\f0000..f0179.webp` (lossless, 76 MB; line 48.2, shade 27.5).
- sha256 over the sorted files: line WebP `bded5dd6f52c0e4f9f4ac2af299dedf610ab64f7654104eec6097ecb14cd3051`, shade WebP `99c1421e71efa1afde21e419ecef8589ef7ec921dc74b56528242a7a56fd4ad8`, all PNG `80deb252599f1a9994a3c72222c81253d925a905c29dbe7dc952441eef477f33`.

## Look decision (2026-11-14, Opus 5.5 advice; Mark's own choice of the Cycles test)
**Shade pass = Cycles v2. Line pass stays Workbench + Freestyle.** Workbench's view-fixed studio light leaves the turned-away side dark; Cycles v2 does not.
- v2 values (in `render_clip.py`, Cycles branch only; Workbench untouched): world strength 0.40 (was 0.55), sun 2.4 (was 3.2), Cycles-only clay (0.62, 0.60, 0.57) (was 0.80/0.78/0.74, which blew out to near-white in v1). 24 samples; denoise is ON (`setup_cycles` enables it above 4 samples).
- Sweep (12 angles, 30 deg steps, 960 px; mean / 10th-percentile luminance over alpha>200 pixels, 0-255):

| deg | Workbench | Cycles v2 | | deg | Workbench | Cycles v2 |
|---|---|---|---|---|---|---|
| 0 | 177 / 130 | 173 / 127 | | 180 | 169 / 128 | 170 / 125 |
| 30 | 146 / 113 | 158 / 125 | | 210 | 142 / 114 | 155 / 122 |
| 60 | 118 / 73 | 144 / 121 | | 240 | 116 / 70 | 142 / 118 |
| 90 | 164 / 110 | 155 / 124 | | 270 | 176 / 110 | 155 / 109 |
| 120 | 153 / 125 | 165 / 125 | | 300 | 151 / 115 | 168 / 124 |
| 150 | 167 / 110 | 173 / 126 | | 330 | 167 / 96 | 175 / 127 |

  Workbench mean range 116-177 (darkest 60 and 240 deg); Cycles v2 142-175 (darkest 240 deg 142 and 60 deg 144, much shallower). Worst 10th percentile: Workbench 70 (240 deg), Cycles 109 (270 deg). The sun is world-fixed in the Cycles branch and no deep trough appeared, so parenting the sun to the camera is not needed unless the full set shows one.
- **Recipe is two runs, never `--pass both --engine cycles`:** (1) `--pass line` (Workbench default); (2) `--pass shade --engine cycles --samples 24`. `setup_line_pass` would otherwise switch Freestyle to Cycles, which was never validated; the validated line pass is Workbench. The camera code is unchanged, so the existing 180 line frames stay valid and the re-render is **shade frames only**.
- Not yet checked: the approved slices' shade tone on `torque-wrench/rebuild` (the "match the approved clay-and-ink look" claim is an assumption); temporal shimmer from per-frame denoise (30 deg sweep cannot show it).
- Gates for the shade re-render (add to the existing set: 180/180 files, 1920x1080, corner alpha 0, consecutive-frame diff, loop wrap): a **temporal flicker check** (consecutive-frame difference after removing the expected motion, flagged against the Workbench set's 0.73-3.1 range) and a luminance sweep at all angles against 142-175.
- The look is still Mark's call and Astra's ruling after the film review.

## Remaining steps (A = needs Mark's go)
1. Done 2026-11-14: hero stills (`...-hero-contour-v1`, `...-hero-fullline-v1`), Modal Volume backup `armament-frames` (WebP frames and hero stills; PNG originals not backed up, rebuildable from WebP; models still local only, Google Drive folder proposed by Mark, not done), look decision (above).
2. Shade-only Cycles re-render, 180 frames, about $0.10-0.12 (projected). A. Then the gates above, then a line-over-shade check against the Workbench set.
3. Check the approved slices' shade tone on `torque-wrench/rebuild` (read-only).
4. Film branch `torque-wrench/rebuild` (the active "The Line" lane; check its `project/work/plans/JG-041-showreel-v3.md` and `remotion/README.md` first): wire a clip into `ArmamentAct.tsx` (plot -> hold -> fast spin with frame blending -> settle), manifest-driven rules-test block, `/mk\s*-?18/i` scan, delivery route for frames. Review stills + a separately named review MP4; no change to `public/video/showreel-v3.mp4`. A.
5. Mark reviews; Astra's ruling (visual effect); only then commit the finished frames (near-lossless WebP, one commit) and, on his accept, replace the homepage MP4. A.
6. More clips on the same lane (ACR, AR-15 after rotation/decimation, M249 shell, second representative model). Each is a new `<clip-id>`.

## Walls (unchanged)
No dimensions/GD&T/part numbers on screen. "AR-15-pattern" copy, no third-party brand/model names on screen or in committed filenames, `manifest.json` or `clip.json`. Representative stand-ins carry the representative label. M249 only as a tweaked display shell. Models never committed.

## Fable 5.2 review: points still open
Frame blending vs 2 deg steps (`@remotion/motion-blur` availability unchecked); frame delivery route (see Wiring); film length growth (+4 s proposed); homepage loop behaviour unchecked.
