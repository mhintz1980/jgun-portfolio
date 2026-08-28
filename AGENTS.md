# AGENTS.md — jgun-portfolio

Mark's portfolio site (Vite + React + R3F). Hero feature: the JGun Torque Wrench
interactive exploded-view rig (Default.glb, D1-AP part numbers).

## Session start

1. Read `TODO.md` — canonical approved task queue.
2. Read `project/README.md` — the project knowledge map and work-ID protocol.
3. Read-first context: `project/context/architecture/animation-spec.md` §5–§5.4 (canonical, measured reality).
   `project/context/owner-specs/animation-exploded-owner-spec.md` is Mark's owner spec — its prose ±Z
   labels are flipped vs measured reality; measurements win.
4. Check `git status`: untracked `.scratch/`, `docs/orzo-style-portfolio-implemetation-roadmap.md`,
   and `src/components/canvas/` belong to a PARALLEL session — never commit, delete,
   or build on them.

## Hard rules

- GitHub `origin` (`mhintz1980/jgun-portfolio`) is the authoritative repository. Push only after the relevant plan evidence and repository checks are complete.
- Never ship credentials or commit `.scratch/` or protected parallel-session material.
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
- Verify with runtime telemetry, never vision alone — vision confabulates on the dark
  scene.
- Restart the :4173 preview server after EVERY rebuild (stale server + rotated hashes →
  canvas never mounts).

## Skills (ZCode-local at ~/.zcode/skills; other harnesses: read the SKILL.md directly)

Rig/scene → `cad-scene-graph-rigging`; verification → `webgl-telemetry-verifier`;
timeline → `r3f-scroll-performance-guard`; scroll/GSAP ScrollTrigger reference →
`gsap-scrolltrigger` (official GreenSock, ~/.agents/skills — all harnesses);
video-hero 3D landing pages (orzo-style) → `animated-3d-video-sites` (~/.agents/skills —
all harnesses); deploy readiness → `asset-and-bundle-hygiene`; CH.04 shader →
`glsl-transition-shader-pipeline`.


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
