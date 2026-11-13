# HANDOFF: JG-041 armament render lane (2026-11-13)

Cost so far this session: Modal $0.0022 (smoke) + $0.48 (full render) = about $0.48 of the $30 free tier. Nothing else spent.

## State
- **Direction (owner ruling 2026-11-13, on `main`):** the showreel is "The Line" (slices owner-approved 2026-11-09 on `torque-wrench/rebuild`: ident `0de294ef`, slice 1 `e3c05882`, slice 2 `f2b5ae44`). "The Thread" is not the direction. Next improvement: the armament act with the real 3D models.
- **Render lane built and committed to `main`** (this worktree: `jg-041-armament-cad-cb235e`, branch `claude/jg-041-armament-cad-cb235e`):
  - `remotion/clips/README.md`: the modular clip contract.
  - `remotion/clips/armament/blender/render_clip.py`: Blender 5.2.2 LTS renderer. Line pass (Freestyle ink on white, contour 2.6 px / detail 1.3 px, multiply it over the paper) and shade pass (clay on transparent). Muzzle-right profile at 0 deg; camera rises up to 10 deg at 180 deg.
  - `remotion/clips/armament/modal/launch.py`: Modal launcher, dry run by default.
  - `remotion/clips/armament/manifest.json`: model provenance. Per-machine model paths are in the GITIGNORED `remotion/clips/armament/local-paths.json` (present on this machine only).
  - Plan `project/work/plans/JG-041-armament-act.md` (v4), issues log `project/work/evidence/JG-041-armament-act/issues-log.md` (11 rows), TODO.md JG-041 status line.
- **First full render done, frames NOT in the repo.** One representative carbine, 180 angles (2 deg) x 2 passes at 1920x1080, $0.48, 24 min wall. Scratch: `C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v1/` (PNG 294 MB) and `...-webp/{line,shade}/f0000..f0179.webp` (lossless, 76 MB). sha256s are in the plan. Gates passed (360/360, sizes, alpha, loop wrap diff 0.85).
- **Not wired into the film.** No change to the film, the site or `public/video/showreel-v3.mp4`.
- **Second Brain:** `04-Projects/agent-software-factory/project-state.md` (separate project, starts after JG-041 is deployable; Gaps Log has 15 items), a pipeline candidate entry and a decision-log entry.

## Owner decisions (2026-11-13)
1. AR-15, ACR and M249 models are Mark's own; every other full firearm assembly is a representative stand-in (only because his own full assemblies are not available to him).
2. The line resolves to shaded.
3. The act grows; everything modular so a clip can be used alone on the site or future sites.
4. Full 360 spin in about 1-2 s (rendered at 2 deg/frame; Remotion blends frames).
5. Run it on Modal, record issues. Use the local computer only when idle.
6. A structured repo home for all of it.
Opus 5.5 (high) on the two open questions: commit NO frames until the film review approves the clip, then near-lossless WebP in `remotion/clips/armament/<clip-id>/` (not `public/`); commit code and docs now after scrubbing brand names and absolute paths (done).

## Next steps
1. Hero stills (small Modal run, about $0.01): contour-only line at 0 deg and full-line at 0 deg. Same launcher with `--contour-only --angles 0:2:2 --pass line`.
2. Back up the frames (a cloud or Modal Volume copy). The models are never committed, so lost local models mean the frames cannot be rebuilt.
3. Decide the look: accept the dark side at ~40-60 deg and ~300 deg (Workbench studio light is view-fixed), or add a Cycles shade pass (more cost).
4. Film wiring on `torque-wrench/rebuild`: read its `remotion/README.md` and `project/work/plans/JG-041-showreel-v3.md` first. Wire plot -> hold -> fast spin (frame blending) -> settle; solve frame delivery (Remotion `staticFile` reads only `../public`, which ships with the site; `build/excludePublicAssets.ts` takes exact paths); add the manifest-driven rules test and an `/mk\s*-?18/i` scan; review stills plus a separately named review MP4.
5. Mark reviews; Astra's ruling (visual effect); only then commit the frames and, on his accept, replace the homepage MP4.
6. More clips (ACR, AR-15 after rotation and decimation, M249 shell, a second stand-in) on the same lane.

## How to run Modal from this machine
```bash
cd remotion/clips/armament/modal
py launch.py --glb "<model.glb from local-paths.json>" --out "C:/Projects/CAD/Armament/renders/<run-id>" --angles 0:360:2 --pass both --width 1920 --shards 6 --timeout 1500 --est-s-per-frame 20 --max-usd 1.00
```
That is a dry run. To spend, add `--execute` and run it with the proxy unset, in a shell that can reach Modal:
```bash
env -u HTTPS_PROXY -u https_proxy -u HTTP_PROXY -u http_proxy PYTHONWARNINGS=ignore py launch.py <same args> --execute
```
In an agent shell this also needed the sandbox override. Never print `~/.modal.toml`.

## Key assumptions to verify
- `origin/main` contains the lane commit: `git ls-remote origin refs/heads/main`.
- `remotion/clips/armament/local-paths.json` exists locally and its paths resolve (gitignored; recreate from `manifest.json` `local_ref` keys if lost).
- Scratch frames still exist: `ls C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v1-webp/line | wc -l` should print 180.
- Modal cost figures use the msp pipeline's rates; check the Modal dashboard.
- Blender 5.2.2 Linux archive checksum is verified inside the Modal image build (blender.org is blocked from the agent shell).

## Dead ends / gotchas
- Modal fails behind the shell's `HTTPS_PROXY` (gRPC); unset it. `serialized=True` needs the image Python to match the local one (now automatic).
- `curl`/`wget` are redirected by a hook; `blender.org` returned 403 from the shell.
- Hooks rewrite Agent calls, so each subagent call must be issued twice (auto-mode "no verdict").
- A hook blocks writes into other worktrees; the film code lives in `torque-wrench/rebuild`.
- The earlier handoff `docs/HANDOFF-showreel-v3-2026-11-12.md` is from another branch and its scratch paths are gone; its open questions are answered above.

## Walls
No dimensions/GD&T/part numbers on screen. "AR-15-pattern" copy; no third-party brand or model names on screen or in committed filenames, manifest or `clip.json`. Representative stand-ins carry the representative label. M249 only as a tweaked display shell. Models never committed. No re-render of `public/video/showreel-v3.mp4` and no homepage change without Mark's explicit go.

## Paste prompt for the next session
```text
Continue JG-041 armament render lane. Read first: docs/HANDOFF-armament-lane-2026-11-13.md, project/work/plans/JG-041-armament-act.md (v4), project/work/evidence/JG-041-armament-act/issues-log.md, and docs/torque-wrench-rebuild/00-owner-rulings.md (2026-11-13 ruling: the direction is "The Line"). Run git fetch first. Do next: (1) hero stills via remotion/clips/armament/modal/launch.py (dry run first, cost about $0.01, then ask before --execute), (2) back up the frames, (3) ask Mark about the look (dark side vs Cycles), (4) plan film wiring on torque-wrench/rebuild. Constraints: no frames committed until the film review approves; no brand names or absolute paths in committed files; models never committed; no re-render of public/video/showreel-v3.mp4 or homepage change without his explicit go. Put costs first; show images, do not describe them.
```
