# JGun Portfolio — 3D Interactive Mechanical-to-AI Portfolio

Scroll-driven 3D portfolio for a 25-year mechanical designer & systems architect.
Hero asset: the JGun industrial pneumatic torque wrench (multi-stage planetary
reduction), exploded and dissolved from PBR metal into digital wireframe as the
story moves from shop floor to software.

## Stack (pinned per the 2026-08-20 registry audit)

react/react-dom **19.2.8** · @react-three/fiber **9.7.0** · @react-three/drei **10.7.8** ·
three **0.185.1** · vite **^7** (deliberately holding off same-day vite 8) ·
typescript **~5.9** (not the 7.x Go-rewrite line) · tailwindcss **4.3.3** ·
gsap **^3.13** · lenis **^1.3.26** (NOT the deprecated `@studio-freight/lenis`)

## Setup

```bash
npm install
npm run sync-assets   # copies GLBs + role-map.json from C:\Projects\CAD\RL300-SAFE\optimized\
npm run dev
```

The large JGun GLBs are gitignored (16 MB); `public/models/role-map.json` and
`public/models/m249-transformed.glb` (871 KB) **are** committed.
`sync-assets` renames `jgun-full.glb` → `Default.glb` so the brief's
`useGLTF('/models/Default.glb')` path resolves. The GLBs are Draco-compressed;
`useGLTF.setDecoderPath('/draco/')` in `TorqueWrenchHero.tsx` points every load
at the vendored `public/draco/` decoders.

## Textured assets

`m249-transformed.glb` is the **only textured GLB in the project** — `Default.glb`
and both `jgun-*.glb` carry zero images (verified by binary probe 2026-08-26), so
the M249 is the entire texture budget: **871 KB on disk, 50.3 MB texture VRAM**
(2048 baseColor + 2048 normal + 1024 metallicRoughness, all WebP, RGBA8 + mips).

Regenerating it is **not** a single command. `npx gltfjsx --transform` hard-codes
`normalTexture` to chroma-subsampled JPEG and ignores `--format`/`--resolution`
for that slot, so a bare re-run silently regresses the normal map. The required
post-process, with measured numbers, is recorded in the generated
`C:\Projects\CAD\M249.jsx` header and in the vault skill `glb-web-export-triage`
(driven by `_system/scripts/glb-probe.py`).

KTX2/Basis was encoded and measured 2026-08-26, then **rejected** — every variant
spends file size and/or quality to buy VRAM that is not this scene's bottleneck
(the fixed bottleneck was draw calls). Numbers are in the skill; revisit only if
more textured assets land on screen at once.

## URL views

`?view=<solid|blueprint|exploded>` sets the initial material mode on load —
e.g. `/?view=exploded` opens directly on the fully exploded assembly (handle
and gearbox stages separated axially). The HUD mode switcher stays live after
load; the parameter is read once and never rewrites the URL.

## Module map

| Module | Files |
|---|---|
| 1 — Scene canvas & camera spline rig | `src/scene/SceneCanvas.tsx`, `src/scene/ScrollRig.tsx`, `src/scene/CameraRig.tsx` |
| 2 — Exploded wrench & kinematic rig | `src/scene/TorqueWrenchHero.tsx`, `src/scene/rig/nodeRoles.ts` |
| 3 — CAD-to-code dissolve shader | `src/shaders/CadTransitionShader.ts` |
| 4 — Data contracts & HUD | `src/types/portfolio.ts`, `src/data/caseStudies.ts`, `src/components/TechnicalHUD.tsx`, `src/scene/Hotspots.tsx` |

**Full scroll/animation spec** (chapters, camera keyframes, timelines, tiers,
verification method): [`docs/animation-spec.md`](docs/animation-spec.md).

## Design decisions inherited from the group audit

- **Node names, never mesh names.** Mesh names in the GLB are generic
  `meshN_mesh`; identity lives on nodes (`HANDLE ASSY, D.5AP-D1AP-rev1`,
  `D1-AP Gearbox Assy-rev2`). `nodeRoles.ts` matches tolerant patterns and
  tags gearbox roles by the D1-AP part-number table (5 stages, clutch halves,
  output spindle, housing), so re-exports don't break it.
- **Rear-extraction explosion offsets.** The P000245 housing bore necks down
  at the snout, so the stages + clutch extract rearward (−Z) in a
  clearance-derived, driveline-order ladder (P003047 first out at −0.099 m …
  P001836 furthest at −0.233 m; A000606 is the THIRD cage, between P003045
  and P001837 — ≥15 mm gaps), only the output spindle exits forward
  (+0.05 m), and the handle backs off −0.331 m; carriers spin at per-stage
  ratios with planet counter-rotation through the whole sequence
  (`EXPLODE_OFFSETS` / `GEAR_RATIOS` in `caseStudies.ts`).
- **Photoreal PBR roles** (`src/scene/rig/materials.ts`): clearcoat black
  shells, tool-steel output cluster, machined-steel internals, emissive LCD —
  assigned by node-name role at consolidation, per Mark's render reference
  (`docs/torque-render.webp`).
- **role-map.json is the anchor source** for hotspots — 316 part occurrences
  with bbox centers from the gltf-transform pipeline pass.
- **Copy is Honey's** (`OUTBOX/portfolio-module4-copy.md`), used verbatim.
