# PLAN v4: JG-041 armament act, modular render lane on Modal (2026-11-13)

Status: render lane built and first full render done; frames NOT in the repo (decision below). Film wiring and any homepage change need Mark's review first.
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

## Done and verified (2026-11-13)
- Blender 5.2.2 LTS on Modal CPU runs Workbench + Freestyle. Smoke frame vs local: line pass pixel-identical, shade pass mean abs diff 0.148. Blender 5.3 is out (installed locally); staying on 5.2.2 LTS for parity; test 5.3 on a copy later.
- Full run: 360/360 frames, 1920x1080, shade corner alpha 0, line background white, consecutive-frame diff mean 1.94 (max 3.1), wrap 358->0 diff 0.85.
- Look note: Workbench studio light is view-fixed, so the side turned away from camera-left goes dark around 40-60 deg and 300 deg. Options: accept, or a Cycles shade pass (higher cost).
- Scratch locations (outside the repo): `C:\Projects\CAD\Armament\renders\ar15-pattern-carbine-a-v1\` (PNG, 294 MB), `...-webp\{line,shade}\f0000..f0179.webp` (lossless, 76 MB; line 48.2, shade 27.5).
- sha256 over the sorted files: line WebP `bded5dd6f52c0e4f9f4ac2af299dedf610ab64f7654104eec6097ecb14cd3051`, shade WebP `99c1421e71efa1afde21e419ecef8589ef7ec921dc74b56528242a7a56fd4ad8`, all PNG `80deb252599f1a9994a3c72222c81253d925a905c29dbe7dc952441eef477f33`.

## Remaining steps (A = needs Mark's go)
1. Hero stills: contour-only line pass at 0 deg (draw-on plot) and full-line pass at 0 deg (small Modal run, ~$0.01). Optionally a Cycles shade look test.
2. Back up the frames (cloud or Modal Volume); decide the look (accept dark side or Cycles).
3. Film branch `torque-wrench/rebuild` (the active "The Line" lane; check its `project/work/plans/JG-041-showreel-v3.md` and `remotion/README.md` first): wire a clip into `ArmamentAct.tsx` (plot -> hold -> fast spin with frame blending -> settle), manifest-driven rules-test block, `/mk\s*-?18/i` scan, delivery route for frames. Review stills + a separately named review MP4; no change to `public/video/showreel-v3.mp4`. A.
4. Mark reviews; Astra's ruling (visual effect); only then commit the finished frames (near-lossless WebP, one commit) and, on his accept, replace the homepage MP4. A.
5. More clips on the same lane (ACR, AR-15 after rotation/decimation, M249 shell, second representative model). Each is a new `<clip-id>`.

## Walls (unchanged)
No dimensions/GD&T/part numbers on screen. "AR-15-pattern" copy, no third-party brand/model names on screen or in committed filenames, `manifest.json` or `clip.json`. Representative stand-ins carry the representative label. M249 only as a tweaked display shell. Models never committed.

## Fable 5.2 review: points still open
Frame blending vs 2 deg steps (`@remotion/motion-blur` availability unchecked); frame delivery route (see Wiring); film length growth (+4 s proposed); homepage loop behaviour unchecked.
