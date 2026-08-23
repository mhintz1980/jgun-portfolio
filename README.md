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

GLBs are gitignored (16 MB); `public/models/role-map.json` is committed.
`sync-assets` renames `jgun-full.glb` → `Default.glb` so the brief's
`useGLTF('/models/Default.glb')` path resolves. The GLBs are Draco-compressed;
drei's default decoder (gstatic CDN) handles them at runtime.

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
  derives gearbox stage membership geometrically, so re-exports don't break it.
- **Real-scale explosion offsets.** The wrench is ~0.25 m end-to-end; offsets are
  −0.175 / +0.0875 / +0.175 m (`EXPLODE_OFFSETS`, ×1.75 the brief's real scale for a
  0.35 m total spread — not the original brief's ±1.5/+3.0).
- **role-map.json is the anchor source** for hotspots — 316 part occurrences
  with bbox centers from the gltf-transform pipeline pass.
- **Copy is Honey's** (`OUTBOX/portfolio-module4-copy.md`), used verbatim.
