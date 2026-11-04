# AGENTS.md — jgun-portfolio

Mark's portfolio site (Vite + React + R3F). Hero feature: the JGun Torque Wrench
interactive exploded-view rig (Default.glb, D1-AP part numbers).

## Evolving public site and visual priorities — owner direction 2026-10-31

Read [the current owner policy](project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md)
before release, HUD, readability or verification planning. studiomark.dev is an
ongoing collection of learning/build pages. Publish useful unfinished work with
a discreet work-in-progress label and update it incrementally; a finished site,
final HUD and all cinematic gates are not prerequisites. This owner request
supersedes older session-specific delivery freezes. Use build, asset/route and
focused runtime smoke checks; retain actual FAIL/deferred results without claiming
full technical completion or final visual acceptance.

The current HUD is provisional. Next creative priority: visual concepts with
Mark, keeping the models central. The older sibling `jgun-portfolio` `main` HUD
was too busy; it is reference, not the target. Defer strict HUD/design-framing
polish. Show high-speed readability issues first; if Mark cannot notice them,
defer them. Try a slight camera-angle shift before expensive fixes for visible
issues; earlier camera choices allow this refinement.

## Handoff delivery preference

Whenever Mark requests a handoff, provide both the saved handoff document and an accompanying ready-to-paste prompt for the receiving session. Put the prompt in the final response and save it with the handoff. Include the absolute handoff path, intended workspace, exact next action, and relevant boundaries or approval state. Preserve existing goals and do not imply authorization beyond the owner's request. This applies to every agent working in this repository.

## Session start

1. Read `TODO.md` — canonical approved task queue, newest owner direction first.
2. Read `project/README.md` — the project knowledge map and work-ID protocol.
3. Read-first context: `project/context/architecture/animation-spec.md` §5–§5.4 (canonical, measured reality).
   `project/context/owner-specs/animation-exploded-owner-spec.md` is Mark's owner spec — its prose ±Z
   labels are flipped vs measured reality; measurements win.
4. Check `git status`: untracked `.scratch/` is working scratch material — never commit it.
   (Historical note, resolved 2026-08-30: the 2026-08-25 "parallel session" artifacts were
   adopted — `docs/orzo-style-portfolio-implemetation-roadmap.md` + task spec committed in
   `a255fda`, task spec later moved to `project/archive/superseded/task-spec.md` and superseded by
   JG-020 in `f442679`/`9c3ff3f`; the `src/components/canvas/` scaffold was discarded in
   favor of `src/scene/` and no longer exists. The orzo roadmap is tracked reference
   material, not an approved build spec — treat its unbuilt ideas via normal Task Intake.)

## Hard rules

- GitHub `origin` (`mhintz1980/jgun-portfolio`) is the authoritative repository. Record the intended update and proportional checks before delivery. Public work-in-progress delivery is separate from full task completion under the owner policy. A Git push and a Cloudflare upload are distinct actions; verify the actual deployment mechanism.
- Never ship credentials or commit `.scratch/` or protected parallel-session material.
- **Committing from the shared dirty tree (JG-040 lesson, 2026-11-03):** stage by explicit
  path only, and verify the commit tree **in isolation** — `git worktree add <temp> HEAD` +
  an `mklink /J` of `node_modules`, then `npx tsc --noEmit` (and the pure node tests).
  Import-name checks are NOT closure: a dirty file left unstaged can still break the commit
  because a committed file uses a *member* that exists only in the dirty version
  (`RuntimeWorld` → `privateSheetRuntime.renderState` shipped broken until the isolated
  typecheck caught it). Deliberately excluded files must satisfy imports AND member use at
  HEAD; disclose mixed-lineage files in the commit message.
- **Browser probes against this page:** `window.__torqueWorld` ports (`overlaySample`,
  `cinematography`) attach only after the lazy Scene module loads, and the shaft study needs
  `inspection.ready` (the manufacturing-core GLB). Wait for `snapshot().ready` (+
  `inspection.ready` inside the .62–.825 band) before sampling; a null `overlaySample()` or
  `studyVisible:false` right after load is a load race, not a HUD/runtime bug.
- Part numbers (A000606, K000004, P000725…) are the stable key. Stage names are not —
  Mark has used conflicting stage names for the same part; never reorder logic on
  names alone.
- Spec §5 tables, README ladder, and both rig skills' tables hardcode the ladder —
  update them in the SAME commit as any behavior change.
- NEVER regenerate `public/models/m249-transformed.glb` with a bare
  `npx gltfjsx --transform`. gltfjsx hard-codes `normalTexture` to chroma-subsampled
  JPEG and ignores `--format`/`--resolution` for that slot, so a bare re-run silently
  regresses the normal map. Post-process steps + measured numbers: the generated
  `C:\Projects\CAD\M249.jsx` header, README "Textured assets", and the vault skill
  `glb-web-export-triage`. It is the only textured GLB here (all others have zero
  images) and it is committed, not synced — do not add it to `sync-assets.ps1`.
- NEVER re-run `gltfjsx --transform` on `public/models/msp-enclosure.glb` (JG-015
  Stage 2). Tested: `--transform` collapses its 7 named roots to 2 palette-joined
  meshes and no flag combination prevents it. Source of truth
  `C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb`; all mesh reduction happens
  in Blender (`RL300-SAFE-webexport-v3.blend`). Committed, not synced — do not add
  it to `sync-assets.ps1`. 7 roots: `ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`,
  `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_INTAKE`,
  `DUCT_EXHAUST` (a rename pass to `DUCT_LABYRINTH`/`EXHAUST_PORT` may re-commit it).
- Verify runtime/geometry claims with telemetry, never vision alone. Use visual
  examples and Mark's perceptual review for HUD concepts and visual significance;
  a numerical readability failure alone does not justify an expensive fix.
- Restart the :4173 preview server after EVERY rebuild (stale server + rotated hashes →
  canvas never mounts).
- Opening verifier: `node scripts/verify-jgun-opening.mjs` needs `--url=http://localhost:5199`
  (the vite dev server refuses `127.0.0.1`), and `--quick` (~2 min, desktop+narrow) is the
  iteration pass — the full 6-case roster is "done" evidence only, not a routine
  work-in-progress publication requirement. Follow the current TODO verification policy.

## Skills (ZCode-local at ~/.zcode/skills; other harnesses: read the SKILL.md directly)

Camera paths, bullet-time clocks, HUD framing, or scroll pacing → **read the repository-local
[`r3f-cad-cinematography` skill](.agents/skills/r3f-cad-cinematography/SKILL.md) before work**, in every harness.
Its Sections 2–3 define choreography and the deterministic dual-clock contract;
`src/scene/torque-wrench/bulletTime.ts` owns shot windows, rates and readability caps.
Use the solver at `.agents/skills/r3f-cad-cinematography/scripts/solveHudSafeFraming.ts`.
Full browser assertions (both reverse camera and subject errors) remain completion evidence;
they are not prerequisites for every work-in-progress release under the owner policy.
`verify-torque-camera-hud.mjs --quick` is capture-only and must never be reported as PASS.

Rig/scene → `cad-scene-graph-rigging`; verification → `webgl-telemetry-verifier`;
Blender/bpy authoring, diagnostics or export QA (pinned Scenario packages in
`C:\Projects\skills-master`) → repo-local `blender-mechanical-toolkit`
(`.agents/skills/blender-mechanical-toolkit/SKILL.md` — on-demand domain routing; derived
fixtures only, registered CAD protections apply; `blender-agent-core` still governs);
timeline → `r3f-scroll-performance-guard`; scroll/GSAP ScrollTrigger reference →
`gsap-scrolltrigger` (official GreenSock, ~/.agents/skills — all harnesses);
video-hero 3D landing pages (orzo-style) → `animated-3d-video-sites` (~/.agents/skills —
all harnesses); deploy readiness → `asset-and-bundle-hygiene`; CH.04 shader →
`glsl-transition-shader-pipeline`; animation craft/review → `animate`,
`review-animations`, `improve-animations`, `find-animation-opportunities`
(emilkowalski, ~/.agents/skills — all harnesses); design/motion canon →
`build-awwwards-quality-sites`, `cinematic-gsap-lenis-motion-system`,
`build-threejs-scroll-worlds`, `scroll-scrubbed-visual-sequence` (MengTo
subset, ~/.agents/skills — all harnesses). Per-phase activation rosters:
`project/context/session-phases.md`.

CAD-driven 3D scroll product pages — live reference gathering, camera path, look dev,
HUD callouts, type pairing → repo-local `motion-webgl-inspiration`
(`.agents/skills/motion-webgl-inspiration/SKILL.md`). It writes a Reference Brief before
implementation code, ships a runnable vanilla three.js starter (`assets/starter-vanilla/`)
and frame-capture/link-check scripts (`scripts/`), and complements `r3f-cad-cinematography`
(motion law) and `animated-3d-video-sites`.


## Cross-Agent Skill Locations

The authoritative per-harness paths, shared fallbacks, usage rules, and codebase-memory service status are maintained in [`project/context/agent-skills.md`](project/context/agent-skills.md). Every agent must read the named `SKILL.md` before work in that skill’s domain. The map covers CAD rigging, WebGL telemetry, R3F/GSAP/ScrollTrigger scroll behavior, spatial annotations, shaders, asset hygiene, motion-led 3D composition, and codebase-memory graph retrieval.

## Token guardrails (ZCode)

- Be concise. Dispatch mechanical work — rename, format, summarize, scrape, bulk
  file reads — to an Agent subagent so its tool output never enters the main
  context. ZCode subagents take no cheaper-model argument; the saving is keeping
  output out of the main thread (subagents default to a cheaper model anyway).
- Pipe known-noisy commands (installs, builds, test runs) through `| tail -n 40`
  when the full log isn't needed; the user-scope PreToolUse hook
  (`~/.zcode/scripts/trim_pretooluse.py`) wraps most of these automatically.
- Never suggest compaction/summarization as a cost-saving measure — finish the
  job and `/clear` instead.
