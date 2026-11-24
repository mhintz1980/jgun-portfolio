# HANDOFF — 60 fps Live Homepage Shipped + Chapter 03 Armament Drop & M249 Video Direction (2026-11-24)

**Workspace:** `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d`
**Branch:** `feat/ch03-arm-drop-video` (local only, branched from `main` @ `65a567a2`)

Read `AGENTS.md`, `TODO.md`, and `project/work/plans/JG-044-homepage-merged-concept.md` § `Chapter 03: Armament` first.

## Done

1. **60 fps 360° Homepage Turns Merged & Shipped Live:**
   - Implemented zero-copy 3-stacked `<video>` scrubber (`proto/merged/video-scrubber.js`) with progressive coarse-hero `createImageBitmap` handoff and 3D MSAA culling (`proto/merged/main.js`, `scripts/encode-scrub-videos.mjs`, `44a46178` on `spike/60fps-scrub-2026-11-23`).
   - Local benchmark (2× 1440×900 headed Chrome): `frame p50 = 16.7 ms` (`p95 16.8–17.3 ms`), `js/frame p50 = 0.7–1.0 ms`, `Decode Image = 0.00 ms`, steady lag `3°/4°` (`0°` settled), mobile `390×844` Fast 3G first Ch04 paint `920 ms` at `60 fps`, `0` errors. Benchmark table recorded in `docs/PLAN-scrubbed-video-2026-11-22.md`.
   - **Live:** `https://studiomark.dev/home/` = Cloudflare Pages **`c658fda9`** (rollback `0ad6163f`; owner-approved 2026-11-23).
   - **Main pushed:** Merged into `main` in an isolated LF worktree and pushed as **`65a567a2`** (`origin/main == 65a567a2`; `npm run check` + `.githooks/pre-push` passed: Biome 509 files, `tsc --noEmit`, 133 test files / 1,567 tests, `check:station2`).
2. **Project 03 Dive Drop Video + 2026-11-24 M249 Rulings (`b13fa627` on `feat/ch03-arm-drop-video`, local only):**
   - Remuxed `armament-review-spin-v2.mp4` (`1920×1080`, `22 s`, `3.64 MB`, `+faststart`, no audio) to `proto/merged/arm/drop-reel.mp4` and wired it as item `01 / 06` (`PROJECTS[2].imgs`) in `proto/merged/main.js` via lazy `plateVid` + `THREE.VideoTexture` (`0` requests at boot; pauses on still switch `→` and `Escape` climb-out; `5` existing stills preserved on `02–06`).
   - Verified in headed Chrome (`1440×900` + `390×844`): `0` errors, `1920×1080` playback verified visually and via telemetry.
   - Recorded Mark's 2026-11-24 M249 rulings in `project/work/plans/JG-044-homepage-merged-concept.md` and `TODO.md`.

## In Progress / Open

- **`feat/ch03-arm-drop-video` is local only** (not pushed, not deployed to Pages).
- **Mark is converting SolidWorks CAD** in `C:\Projects\CAD\Markimus-M249\` (`92` `.SLDPRT` / `.SLDASM` files verified present) to GLBs in that same directory (`C:\Projects\CAD\Markimus-M249\`).
- **Locked Chapter 03 M249 video spec (Mark 2026-11-24):**
  - Starts as the **Chapter 03 drop clip only** (standalone video; does not need to match the homepage paper look or double as the JG-041 showreel act).
  - **Darker studio look** for the M249 exploded assembly + **no voiceover** (music/kinetic captions/callouts).
  - **Representative visuals approved**; `M249FN`, AR-15, MK-18, and Mark's converted M249 GLBs approved **for video creation only** (zero `.glb`s on `/home/`).
  - **Reverse-engineering story (~1 year at BCP):** hand metrology first (calipers, micrometers, height gauges, indicators, plug/pin gauges, Rockwell hardness testers) → 3D scanner bought later mainly for verification (Geomagic → SolidWorks) → materials, alternate materials, finishes, and heat treatments chosen via career knowledge + R&D → prints for commercial parts + custom OEM springs (e.g. Drive Recoil Spring) → outsourced prototyping.
  - **Drawing/print visuals:** masked/redacted drawing crops with **deliberately inaccurate / reference-only numbers** (not showing the actual part simultaneously), displaying GD&T symbols, datums, tolerances, material call-outs, surface finishes, and notes to prove part-relationship knowledge.

## Exact Next Action

1. Ask Mark whether to deploy/push `feat/ch03-arm-drop-video` (`drop-reel.mp4` interim Project 03 drop clip) now, and check whether the converted GLBs have landed in `C:\Projects\CAD\Markimus-M249\`.
2. Inspect the converted GLBs (node hierarchy, scale, origin, mesh count), then build a **`$0` stills storyboard + shot list** for the standalone darker-studio M249 exploded-assembly & reverse-engineering Chapter 03 video before any Blender/Modal render spend.

## Known Gotchas / Deferred Items

- **Three.js `HTMLVideoElement` uploads:** `tex.isVideoTexture = true` is required on a `THREE.Texture(video)` (paired with `tex.update = () => {}` for event-driven uploads); otherwise Three.js `getDimensions()` reads `video.width === 0` and uploads black.
- **ANGLE/D3D11 upload cost:** `HTMLVideoElement` uploads in `0.0 ms` p50 via GPU mailbox, vs `3.0 ms` (`createImageBitmap` premul) and `3.6 ms` (WebCodecs `VideoFrame`).
- **Wrangler cache drift:** `scripts/deploy-home-proto.sh` runs `npx --no-install wrangler` (which checked `4.167.0`); calling the cached `wrangler/bin/wrangler.js` (`4.166.0` in `%LOCALAPPDATA%\npm-cache\_npx\32026684e21afda6`) directly succeeded.
- **Mobile `390×844` dive plate aspect (`deferred`):** `setImage()` uses `maxW = 3.4` in `proto/merged/main.js`, slightly clipping 16:9 sides on `390×844` (existing sizing behavior, not a regression).
- **Live `perf2.cjs` DWM vsync:** Live Chrome runs throttled to 30 Hz (`33.4 ms`, `js/frame 0.5–0.8 ms`); local `:8815` confirmed `16.7 ms` (60.0 fps) across 2 runs.
- **Remotion rules gate:** `remotion/src/rules.test.ts` still checks the old `m249_FN.glb` ban — update it for `M249FN` video-only authorization before any Remotion run.

## Approval State & Boundaries

- **Approved & shipped:** `c658fda9` live on `studiomark.dev/home/`; `main` pushed at `65a567a2`.
- **Not authorized yet:** Deploying or pushing `feat/ch03-arm-drop-video`; any Modal or Higgsfield spend (must state cost and get Mark's go per run); loading any `.glb` on `/home/`; visual effects/video look changes still require Astra review (`gpt-6.2-astra`) + Mark's approval.

## Tooling Manifest (Chapter 03 M249 Video)

| Phase | Tools & Versions | Purpose | Owner Staging / Notes |
|---|---|---|---|
| Inspect GLBs & scene prep | Blender `5.3.0` (`blender.cmd`), `blender-mechanical-toolkit`, `blender-agent-core` | Audit `Markimus-M249` GLBs, explode hierarchy, camera/lighting setup | Mark converts SolidWorks → GLB in `C:\Projects\CAD\Markimus-M249\` |
| Render stills / turn / explode | Blender `5.3.0` Cycles (local `$0` previews → Modal on explicit cost go) | Darker-studio turntable + exploded assembly + redacted drawing crops | Modal launched by Mark in local PowerShell (`HTTPS_PROXY` unset) |
| Video encode & remux | `ffmpeg 8.1.1` + `ffprobe` | Encode H.264 `+faststart` no-audio MP4 for Project 03 drop | Installed locally |
| Verify runtime & telemetry | Playwright (`1.56.1`), Chrome headed, `npm run check` (Biome `2.6.6`, `tsc`, Vitest `4.1.11`) | Lazy-load, `plateVid` state, 0 console/page errors | `.scratch/` stays untracked |
| Not used | `Higgsfield`, `WebCodecs` | Replaced by real CAD renders (`Blender`) and zero-copy `<video>` | Park unless requested |

## Suggested Skills

- `blender-agent-core` (`.agents/skills/blender-agent-core/SKILL.md` or global)
- `blender-mechanical-toolkit` (`.agents/skills/blender-mechanical-toolkit/SKILL.md`)
- `r3f-cad-cinematography` (`.agents/skills/r3f-cad-cinematography/SKILL.md` — camera pacing/framing)
- `handoff` (`.agents/skills/handoff/SKILL.md`), `wrap` (`~/.agents/skills/wrap/SKILL.md`)

## Ready-to-Paste Next-Session Prompt

```text
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-homepage-60fps-and-ch03-m249-2026-11-24.md first, then AGENTS.md, TODO.md, and project/work/plans/JG-044-homepage-merged-concept.md (§ Chapter 03: Armament).
Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d on branch feat/ch03-arm-drop-video (local at b13fa627, branched from main 65a567a2).
First action: ask Mark whether to deploy/push the interim Project 03 drop video (proto/merged/arm/drop-reel.mp4) now, and check if his converted GLBs are ready in C:/Projects/CAD/Markimus-M249/. Once GLBs are present, inspect them and present a $0 stills storyboard + shot list for the standalone darker-studio M249 exploded-assembly & reverse-engineering Chapter 03 video (no VO; masked/redacted drawing crops with inaccurate reference-only numbers showing GD&T/datums/tolerances/materials/finishes/notes).
Boundaries: do not deploy, push, or run Modal/Higgsfield without explicit cost + Mark's go; no .glb files on /home/; visual work needs Astra review + Mark's approval.
```
