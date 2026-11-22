# OpenMotion trial — thread E (written 2026-11-21)

How to start: open a terminal, `cd C:/Projects/openmotion`, run `claude`, approve the project
`.mcp.json` server "openmotion" when asked, then paste everything inside the fence.

```text
You are thread E of Mark Hintz's portfolio project (studiomark.dev, repo C:/Users/Markimus/.buzz/REPOS/jgun-portfolio, homepage branch home/60fps-2026-11-22, worktree .claude/worktrees/home-60fps-2026-11-22). Your job: find out what OpenMotion, installed here, can really do for our videos, images and animations, prove it with one $0 test, and write a short report. You are evaluating, not producing final work.

RULES (Mark's, follow exactly):
- $0 only. OpenMotion's paid parts (GPT Image, Seedance, Suno, Eleven, any BYOK model) need a stated cost and Mark's explicit go per run. Do not run any of them. Quote what a paid step would cost instead.
- Never generate product geometry with AI. Our parts (planetary gear cage, pump, M249 receiver, carbine, torque wrench) must come from our own renders. AI may only add atmosphere, type, transitions, or motion around our own frames.
- No dimensions, GD&T, part or drawing numbers, and no brand marks (MYERS-SETH, MSP, DD4S) on screen.
- Do not edit the jgun-portfolio repo except the one report file named below. Do not commit or push anything in either repo. Keep OpenMotion projects in its own data dir.
- Mark skims: put results, costs and decisions in the first lines, as numbers. Show images and clips (paths), don't describe them.
- Treat README claims as unproven until you've run them.

STEP 1 — connect (stop and report if this fails; do not work around it):
- Read README.md, install.md, CLAUDE.md/AGENTS.md here and skills/openmotion/SKILL.md.
- Confirm the openmotion MCP tools are loaded in this session and that openmotion_get_project succeeds. ffmpeg/ffprobe are on PATH (WinGet); set the env vars .mcp.json lists only if a tool asks for them. If a Chromium path is needed, use an installed Chrome/Edge.

STEP 2 — inventory the tools: list every MCP tool and every skill in skills/ (openmotion-director, -production, -recreate, -template-to-video, -video-to-template, -media, -design) with one line each: what it does, free or paid, local or cloud. Note the Studio (npm run studio:dev) and Motion.md shot lists.

STEP 3 — one $0 test from our own material: adapt an existing template into a 6-10 s clip that uses OUR frames. Mark paused the scroll-scrubbed 360-frame turns on the homepage (60 fps first), so these frames are now raw material for videos:
  pump turn   line C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/run-p3-pump-line/turn-line-NNN.0.png, shade C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/run-p3-pump-shade/turn-shade-NNN.0.png (NNN = 000..359, 1 deg)
  receiver    C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/run-p3-receiver-line/ and C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/run-p3-receiver-shade/ (same naming)
  cage        C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/m360/ (line/ and shade/)
  For example a line-drawing-to-shaded wipe while the part turns, with a title card "Renderings and visualizations". Render it to MP4 locally. Record render time, output size, and any step that wanted a paid model.

STEP 4 — fit against our real needs (one short line each: yes / partly / no, why, $ if paid):
  a. Chapter 04 "raw vs post" videos: same turn shown as raw render then finished.
  b. Chapter 03 M249 reverse-engineering beat: a storyboard/animatic (drawing treatment not yet chosen by Mark).
  c. Dives 01-02: they land on the existing three.js/GSAP/R3F breakdowns of the torque wrench and Quiet Machine pages (Mark's ruling); could OpenMotion make short explainer clips for those landings?
  d. Motion graphics/titles/transitions for the homepage and project pages.
  e. A better homepage music bed (current: Higgsfield bed, proto/merged/audio/music-bed-v1.mp3, accepted only as "better than the old synth"): quote Suno via OpenMotion, don't run it.
  f. Reuse of older work in C:/Projects/work-assets/portfolio/sample work (folders: STS_BCP, msp cad, other renderings-videos, powerpoint and training, pumptracker, rendering pipeline). Glance only; do not copy any branded material.
  Compare each with what we already have: Remotion 4.0.540 (pinned lane in the repo), Blender + Modal for frame turns, and OpenMontage at C:/Projects/OpenMontage (Higgsfield).

REPORT: write C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/home-60fps-2026-11-22/docs/openmotion-trial-2026-11-21.md (do not commit). First 5 lines: connected yes/no; test clip path + render time; total spent ($0 expected); top recommendation; decisions Mark must make with costs. Then the tool inventory table, the fit table (a-f), and a "not checked" list. End your session reply with the clip path and the report path so Mark can open them.
```
