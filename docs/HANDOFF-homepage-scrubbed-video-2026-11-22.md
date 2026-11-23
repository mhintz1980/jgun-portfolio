# HANDOFF — live homepage with the reticle film, and the plan to bring back smooth 360° turns (2026-11-22)

Read `AGENTS.md`, `TODO.md` and `docs/HANDOFF-homepage-60fps-2026-11-22.md` (on branch `home/60fps-2026-11-22`) first. This handoff adds to that one; it does not replace it.

## Handoff Numbers

- Context at handoff: 177448 tokens (177.4k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Current state

- **Live:** studiomark.dev/home/ = Pages `0ad6163f`, deployed 2026-11-22 from `home/60fps-2026-11-22` @ `33ed165b` with `scripts/deploy-home-proto.sh --deploy` (base `d2a820dd`). It is the 60-frame build plus a local pre-cut `reticle-film.mp4` (12.7 MB), which fixed the blank lens on Pages (no Range support). Checked on live in headed Chrome at 1440×900: clip returns 200, no page errors, the lens shows the moving reel. fps was not re-measured on this build.
- **Not deployed:** a re-encoded 2.0 MB `reticle-film.mp4` (1280×720, H.264 crf 28, no audio, faststart). It is committed on the 60 fps branch as `6a65e15e`, played in the lens on a no-Range local server with no page errors, and awaits Mark's go to deploy. Not pushed.
- **Mark's rulings this session:** no 1° turns; the page must be fast; the only video on the page is the one in the reticle. Visitors were about to view the page, and the frame-scrub upgrade will not be ready by then.
- **Trace confirmed the decode cost** on the 1° build (`save/jg044-frame-scrub-2026-11-21` head, served locally): in Ch04 screens 5–8, "Decode Image" on `CrRendererMain` took 0.87–1.09 s per screen and other JS (`FunctionCall`) 0.89–1.10 s, against 0.5–0.8 s busy and 0.2–0.3 s JS on screens 1–4. About 2.0 s busy in 2.3 s per screen. One warm run only; the non-decode JS (likely texture upload and draw) was not broken down.
- **The page is one three.js canvas** (`proto/merged/main.js`, `import * as THREE from './lib/three.module.js'`): gear stack, bore, line-drawing normal pass, composite post shader (paper, ink, lens, film), `VideoTexture` for the reticle film, frame-set textures. DOM holds only text, HUD and nav. Removing three.js would be a rewrite; Mark asked which objects are three.js and has not asked for a rewrite.
- **Plan:** `docs/PLAN-scrubbed-video-2026-11-22.md` (rev. 2 after an Opus High review). Reworked per Opus. The rework is uncommitted at the time of writing; this handoff's commit includes it.

## Decisions made

1. Deploy the 60-frame build with the reticle film, not the 1° scrub build (Mark, 2026-11-22).
2. Do not deploy the 2.0 MB clip without a fresh go from Mark. An earlier "deploy" covered `33ed165b` only.
3. The plan now starts with a `createImageBitmap` ring buffer (Opus's cheapest fix), then stacked-alpha video, then WebCodecs. A live 3D turn is parked.

## Done / not done

Done:
- Perf trace of the 1° build; per-screen self-time by name, in `scratchpad/trace.cjs` plus the JSON analysis.
- Deploy `0ad6163f` and `home/60fps-2026-11-22` pushed to `33ed165b`.
- Reticle clip re-encoded and committed locally (`6a65e15e`).
- Plan written, reviewed by Opus (read-only subagent), reworked.
- Memory: `project_live_0ad6163f.md` and its index line.

Not done:
- Deploy and push of `6a65e15e` (2.0 MB clip).
- Any spike. No code for scrubbing was written.
- fps measurement on `0ad6163f`.
- Phone test of the live reticle film, especially iOS.

## Exact next steps

1. Get Mark's answer on deploying `6a65e15e`. If yes: from `.claude/worktrees/home-60fps-2026-11-22`, `sh scripts/deploy-home-proto.sh` (stage, check `reticle-film.mp4` is about 2 MB in the stage), then `sh scripts/deploy-home-proto.sh --deploy` alone, then push from the main checkout (the worktree's pre-push hook fails on missing Biome): `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio push origin home/60fps-2026-11-22`. Check the live lens with headed Chrome.
2. Measure `0ad6163f` against `ccf8f156` with `perf2.cjs` (copy at `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/perf/perf2.cjs`), same scroll. Re-run before concluding; one run is noisy.
3. Only on Mark's go, spike candidate A from the plan on a scratch branch: a `createImageBitmap` ring buffer of about ±12 frames in `loadSet` / `setFrame` (`proto/merged/main.js` ~lines 239–257), keeping the WebP frames.
4. Run the plan's gates (frame time, trace, lag metric, phone and Fast 3G) before anything ships.

## Files and commands

- This worktree: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d` on `claude/homepage-scrubbing-videos-ffaf5d` (head `fd8ffd92` plus this commit).
- 60 fps worktree: `.claude/worktrees/home-60fps-2026-11-22` on `home/60fps-2026-11-22` (head `6a65e15e`, ahead of origin by 1).
- Deploy stage: `.claude/worktrees/deploy-home-d2a820dd/stage`.
- Scrub renders (gitignored): `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/` (3.5 GB).
- Session scratch (may be cleared): `C:/Users/Markimus/AppData/Local/Temp/claude/0e2886cf7a4d5c29/dd82d33d-cef4-4c1e-8f1b-e588a1e6ff77/scratchpad/` holds `trace.cjs`, `live.cjs`, `lens.cjs`, `serve.mjs`, `norange.mjs`, `trace-1deg.json` (164 MB), the film encodes.
- Local servers still running: `serve.mjs` on port 8811 (this worktree) and `norange.mjs` on 8812 (60 fps worktree). Port 8796 is held by some other server.

## Files Modified (from Edit/Write calls)

- C:\Users\Markimus\.claude\projects\C--Users-Markimus--buzz-REPOS-jgun-portfolio\memory\project_live_0ad6163f.md
- C:\Users\Markimus\.claude\projects\C--Users-Markimus--buzz-REPOS-jgun-portfolio\memory\MEMORY.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-scrubbing-videos-ffaf5d\docs\PLAN-scrubbed-video-2026-11-22.md

Not captured by Edit/Write but changed via Bash (verified with `git log`): `proto/merged/reticle-film.mp4` in the 60 fps worktree, and this handoff file.

## Commits

None recorded in the cockpit facts. From `git log` (verified): `6a65e15e perf(home): re-encode the reticle film, 12.7 MB to 2.0 MB` (60 fps worktree, unpushed) and `fd8ffd92 docs(jg-044): plan for a scrubbed video alongside the reticle film` (this worktree, unpushed).

## Key Assumptions to Verify

- Live is Pages `0ad6163f` and serves the 12.7 MB clip — verify with: `cd C:/Users/Markimus/.buzz/REPOS/jgun-portfolio && npx --no-install wrangler pages deployment list --project-name=jgun-portfolio --environment production`
- `home/60fps-2026-11-22` on origin is at `33ed165b` — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio ls-remote origin home/60fps-2026-11-22`
- The 2.0 MB clip is committed and unpushed — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/home-60fps-2026-11-22 log --oneline origin/home/60fps-2026-11-22..HEAD`
- The shade frames are transparent, so H.264 alone cannot carry them (Opus, read from code) — verify with: `grep -n "premultiplyAlpha" C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/home-60fps-2026-11-22/proto/merged/main.js`
- `setFrame` passes an `HTMLImageElement` straight to `texImage2D`, so decode happens at upload — verify with: `sed -n 245,252p C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/home-60fps-2026-11-22/proto/merged/main.js`
- Opus's theory that 720 decoded frames (about 1.9 GB) exceed Chrome's decoded-image cache is an inference, not measured — verify with: a Chrome trace of the spike branch showing no "Decode Image" on `CrRendererMain`
- The live reticle film plays on iPhone without Range support — verify with: open `https://studiomark.dev/home/` on an iPhone and scroll to the lens (not tested)
- Pages has no Range support for `/video/showreel-v3.mp4` — verify with: `curl -sI -H "Range: bytes=0-1" https://studiomark.dev/video/showreel-v3.mp4` (read the status; 200 means no Range)
- Live fps on `0ad6163f` is 60 — verify with: `node C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/perf/perf2.cjs https://studiomark.dev/home/ live-0ad6163f` (not run)

## Dead Ends

- **Deploying the 1° scrub build:** measured 20–30 fps in Chapter 04; Mark ruled it out.
- **Using port 8796 for a local check:** another server already holds it with an unknown root. Use 8811 or 8812.
- **Judging the live homepage in the built-in browser pane:** the small pane showed the loader stuck and a `journey()` error (`KEYS[i]` undefined). A fresh 1440×900 headed Chrome showed no error. Not a build bug.
- **`git push` from the 60 fps worktree:** the pre-push hook fails with "Biome missing". Push from the main checkout.
- **Candidates dropped in the plan:** texture atlases (about 320 MB GPU on phones), KTX2/Basis (download too heavy), crossfading 6° frames (ghosts on line art).
- **H.264 video for the shade layer without alpha handling:** cannot carry transparency; needs stacked alpha or VP9/HEVC alpha.

## Last Request from the User

Yes, rework it

Status: Answered. The plan was reworked in `docs/PLAN-scrubbed-video-2026-11-22.md` and I asked whether to start the `createImageBitmap` spike on a scratch branch; Mark did not answer that, and then asked for this handoff and no new work.

## Suggested skills

`scroll-scrubbed-visual-sequence` (library: `C:/Projects/skills-master/local/scroll-scrubbed-visual-sequence/SKILL.md`), `threejs-textures`, `threejs-performance`, `r3f-scroll-performance-guard`, `webgl-telemetry-verifier`, `orchestration` (Astra rules on visual effects), `read-the-damn-docs` for `createImageBitmap`, `requestVideoFrameCallback` and WebCodecs.

## Constraints

- Mark's rules: the page must be fast; the only video is the reticle film; no frame-scrub stage ships without a 60 fps perf probe against `ccf8f156`; visual effects need Astra approval.
- Deploy and push only on an explicit go for that exact action. No new renders or Modal spend.
- Mark reads little: put decisions and costs in line one.

## Paste prompt

Saved with the handoff below.

```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/homepage-scrubbing-videos-ffaf5d/docs/HANDOFF-homepage-scrubbed-video-2026-11-22.md first, then AGENTS.md and TODO.md. Workspace: that worktree. Goal: keep the live homepage (Pages 0ad6163f, 60-frame build plus reticle film) fast, and bring back smooth 360° turns without the 1° decode cost. First action: ask Mark whether to deploy the committed 2.0 MB reticle clip (commit 6a65e15e on home/60fps-2026-11-22, unpushed); do not deploy or push without his go. Then wait for his go before the createImageBitmap spike in docs/PLAN-scrubbed-video-2026-11-22.md. Constraints: no 1° turns, the only video is the reticle film, no scrub stage ships without a 60 fps perf probe against ccf8f156, push from the main checkout. Do not redo the trace, the Opus review or the plan rework.
```
