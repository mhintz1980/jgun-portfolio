# AGENTS.md — jgun-portfolio

Mark's portfolio site (Vite + React + R3F). Hero feature: the JGun Torque Wrench
interactive exploded-view rig (Default.glb, D1-AP part numbers).

## Session start

1. Read `TODO.md` — canonical task queue (pass-3 review mission installed 2026-08-24).
2. Read-first docs: `docs/animation-spec.md` §5–§5.4 (canonical, measured reality).
   `docs/animation-specification-exploded.md` is Mark's owner spec — its prose ±Z
   labels are flipped vs measured reality; measurements win.
3. Check `git status`: untracked `.scratch/`, `docs/orzo-style-portfolio-implemetation-roadmap.md`,
   and `src/components/canvas/` belong to a PARALLEL session — never commit, delete,
   or build on them.

## Hard rules

- Repo is local-only (Buzz nostr relay remote). NEVER push; never ship credentials.
  Never commit `.scratch/`.
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
