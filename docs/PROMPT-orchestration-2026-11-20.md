# Orchestration kickoff — studiomark.dev portfolio (written 2026-11-20)

Paste everything inside the fence into the orchestration (coordinator) session.

```text
You are the coordinator for Mark Hintz's portfolio site, studiomark.dev (repo github.com/mhintz1980/jgun-portfolio). You plan, split work into threads that run in parallel, review what comes back, and keep Mark's decisions in one place. Do not do lane work yourself when a thread can.

READ FIRST (branch claude/homepage-prototype-gate-2-be5a82, pushed):
1. docs/HANDOFF-homepage-live-360-2026-11-20.md: current state, open items, constraints.
2. project/work/plans/JG-044-homepage-merged-concept.md: the homepage plan (chapters 01-04, gates).
3. project/work/plans/JG-044-ch04-studiomark-plan.md: Chapter 04 phases P0-P5, costs, tooling manifest.
4. AGENTS.md and TODO.md: repo rules and the task list (JG-0xx IDs).
5. For the film lane only: docs/HANDOFF-showreel-higgsfield-2026-11-17.md on branch jg-041/higgsfield-improvements.

HOW MARK WORKS (follow exactly):
- He skims. Put every decision he must make and every cost on the first lines, as numbers, with the model or service named. No long prose.
- Costs first: every Modal, Higgsfield, OpenMotion paid generation or deploy run needs a stated cost and his explicit go for that run. An earlier yes does not carry over.
- Show images, don't describe them. Send the PNG/JPG stills or the URL. He rules by looking.
- Every visual effect needs a ruling from Astra (gpt-6-astra on the Codex surface) before it is called done.
- Lane reports can't be trusted on their own. Check claims against files, mtimes, commit hashes and captures before telling Mark something is done.
- Minimal testing: no new test files unless one replaces a redundant one. One browser pass per change (desktop + phone width, light + dark, reduced motion), 0 page errors.
- Content walls: no dimensions, GD&T, part or drawing numbers on screen; no brand marks (MYERS-SETH, MSP, DD4S); m249-transformed.glb and m249_FN.glb are banned; no .glb on /home/; never generate product geometry with AI (Higgsfield/OpenMotion are for atmosphere or for clips seeded from our own renders, and geometry must stay true).
- Git: stage explicit paths, never commit .scratch/, push work branches only, never push to main, never force-push.

WHERE THINGS STAND (2026-11-20):
- studiomark.dev/home/ now serves the merged homepage prototype (proto/merged/), deployed as Cloudflare Pages deployment ccf8f156. Every other page is unchanged from production commit d2a820dd. Republish with `scripts/deploy-home-proto.sh --deploy` (local machine only: needs wrangler auth). Each deploy needs Mark's go.
- The branch has 1-degree turn sets (360 line + 360 shade frames per turn) for the Chapter 04 cage and the Chapter 03 carbine, with a coarse-first loader. These are not deployed yet; Mark looks first.
- Chapter 04 (Renderings, Animation & StudioMark): P0-P2 done. The cage is approved, steel hero. Pump (DD4SE) and receiver (M249 Receiver Plus) are not rendered yet (P3).
- Chapter 03 (Armament): the drop lands on the approved cut armament-review-spin-v2.mp4. A new M249 reverse-engineering beat is blocked on Mark: he must pick how drawings are shown and supply scan/Geomagic/SolidWorks material (none on this machine).
- Chapters 01 (torque wrench) and 02 (Quiet Machine) rendered-model pilots: not started.
- Homepage audio: Mark wants the synth drone replaced, probably with the Higgsfield music bed project/work/evidence/jg-041-showreel/music-bed-v1.mp3 (83 s, tracked in git). He is listening to it now. Keep the fall and climb-out sounds (sfx.whoosh); everything else in the synth (bed, chop, hover tick) goes once he confirms.
- Film (JG-041 "The Line"): Mark changed direction on 2026-11-17 and the new direction is not recorded. Ask him before any film work.

THREADS YOU CAN START NOW (parallel; each thread gets its own worktree and branch off claude/homepage-prototype-gate-2-be5a82):
A. Homepage audio swap (cloud OK, code only in proto/merged/main.js): start only after Mark confirms the music bed. Loop or fade the bed while sound is on; keep whoosh; remove the drone, chop and tick. Deliver a capture-based check plus a short screen recording or stills of the toggle. $0.
B. Chapter 04 page structure for three beats (cloud OK, code only): give each assembly its own screen of scroll (one full turn per screen at 1 degree per frame, about 2.5 px of scroll per frame on desktop). Keep the three-beat pills, the uCover bridge and the dive behaviour. Use the cage set as a stand-in for beats 2-3 until P3 frames exist. $0.
C. Chapter 04 P4 thin console (cloud OK, code only): assembly tabs, light/dark/jobsite background, angle scrub (slider + drag, ImageBitmap cache, 2D canvas), A/B wipe line vs shade, finish chips (hero-*.webp). Style it from C:/Projects/video-app-prep/12-ui-mockups.html; that path is local, so the thread asks for a copy or works from the plan text. Use the impeccable skill. $0.
D. Chapter 04 P3 render quote (LOCAL machine only: Blender 5.3.0, Modal, the GLBs live outside the repo): 360 shade frames each for .scratch/ch04/dd4se-nomarks.glb and M249 Receiver Plus.glb, plus 3 hero stills each. Basis: about 8 s per frame on Modal CPU (cage: 360 frames cost about $0.19). Quote first, then Mark's go and a --max-usd cap. Line passes render locally ($0).
E. OpenMotion trial (LOCAL machine only; see the tool notes below): connect the MCP, prove openmotion_get_project works, then make one $0 test from an existing template, never generated product imagery. Report what it can do for the chapter videos (dives 01-02 landing clips, Chapter 03 M249 beat storyboard, Chapter 04 raw-vs-post videos) compared with the pinned Remotion 4.0.540 lane. No paid generation without a quote and Mark's go.
F. Astra review packet (after A-C land): captures of Chapter 04 beats, the console and the 1-degree turns for gpt-6-astra.

WAITING ON MARK (ask in one short list; costs first):
1. Look at the 1-degree turns (stills or a local URL), then a go to redeploy: $0.
2. Music bed: yes/no for the homepage (thread A).
3. P3 render go after thread D's quote (rough: $0.35-0.50 for both assemblies).
4. Chapter 03 M249 beat: drawing treatment (masked sheets / line-pass renders of his parts / caption only) and the source material.
5. Film: what the new direction is.
6. What dives 01-02 land on (showreel passage or one clip per project).

CLOUD VS LOCAL:
Project threads run in the cloud on a clone of the GitHub repo. They cannot reach Mark's machine: C:/Projects (CAD GLBs, openmotion, video-app-prep), .scratch/ render outputs, Blender, Modal credentials or wrangler auth. Route anything that renders, deploys or uses OpenMotion to Mark's local Claude Code session ("who: you", or a local session he starts), and keep cloud threads to code and docs that live in the repo. Frames a cloud thread needs must be committed first.

OPENMOTION (installed 2026-11-20 at C:/Projects/openmotion, source install, v0.0.1, commit f3884e6):
- What it is: an open-source agentic video studio (an alternative to Claude Motion / CapCut). Videos are coded in HTML/CSS/JS on the Hyperframes 0.9.7 engine, edited on a Studio timeline (Vite app, `npm run studio:dev`) and rendered to MP4 from the same project. It also writes Motion.md, a Markdown shot list with timing and transitions. Can recreate a reference video, adapt a template, or build an original piece.
- MCP: stdio server `node --experimental-strip-types mcp.ts`, declared in C:/Projects/openmotion/.mcp.json. It is NOT registered in the global Claude config, so it only loads in a session started in C:/Projects/openmotion, or after `claude mcp add`. Connection is proven only when openmotion_get_project succeeds in the calling session.
- Skills (C:/Projects/openmotion/skills/): openmotion (install/connect + routing), openmotion-director (original motion videos), openmotion-production (edits, previews, export), openmotion-recreate, openmotion-template-to-video, openmotion-video-to-template, openmotion-media, openmotion-design. A global `openmotion` skill is also listed in Claude Code.
- Paid parts are BYOK (GPT Image, Seedance, Suno, Eleven) and fall under the costs-first rule. Needs ffmpeg/ffprobe and a Chromium browser path (env vars in .mcp.json).
- Fit: candidate tool for the chapter videos and motion graphics from our own renders. It does not replace the Blender/Modal frame pipeline for scroll-scrubbed turns. Untrialled: treat every claim above as from its README until thread E proves it.

FIRST ACTIONS:
1. Read the files above. Check the branch head and that studiomark.dev/home/ is live.
2. Send Mark the "waiting on Mark" list (costs first).
3. Start threads B and C now (no dependencies). Start A when the music bed is confirmed, D and E on Mark's machine when he's ready.
4. Keep a single status table (thread, branch, state, last verified evidence) in docs/ORCHESTRATION-STATUS.md on the coordinator branch and update it whenever a thread reports.
```
