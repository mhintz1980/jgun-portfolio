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

The large JGun GLBs are gitignored (~22 MB; `Default.glb` 13.7 MB / 1.29 M tris since the
JG-024 Fine re-export with fasteners — pre-Fine original kept at
`C:\Projects\CAD\RL300-SAFE\optimized\jgun-full-medium-nofasteners.glb`); `public/models/role-map.json` and
`public/models/m249-transformed.glb` (871 KB) **are** committed.
Deploy to studiomark.dev (Cloudflare Pages direct upload — the gitignored
GLBs rule out git-checkout deploys): `scripts/deploy-studiomark.ps1`, full
runbook in [`project/context/deployment.md`](project/context/deployment.md).
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
verification method): [`project/context/architecture/animation-spec.md`](project/context/architecture/animation-spec.md).

## JG-026 intro timing and unchanged canonical ladder

B1/B2 occupy global `0.000–0.120` of PROGRESS, which
`pacedProgress()` stretches over `0.30` of the DOCUMENT (owner pacing
ruling 2026-09-05). Normalized `0–.14` focuses the registered ANSI C
print, `.14–.30` is reserved for the opening text, `.30–.56` traces the
profile excitation, `.56–.88` extracts the model, `.88–.96` is the
computed detachment and its single shockwave pass, and `.96–1` fades the
print. The crossing is computed from transformed vertices, not hard-coded
to a phase boundary. Document height is 3120vh (scroll distance 3020vh);
every downstream chapter keeps its progress span exactly and gains 1.25x
absolute scroll distance.

CH.02 keeps its GSAP ScrollTrigger timeline (`scrub: 0.6`) on
`[data-chapter="1"]`, animating the same proxy object as before: spin
`.12–.47`, gear `.12–1.02`, ghost-in `.27–.47`, explode `.47–.97`,
ghost-out `.54–.79`. Only early CH.01 cues map by `p → .12 + p/3` on
`0≤p≤.18`. Downstream camera/station/LCD windows are unchanged; later
progress is not remapped. Camera damping (`1 - e^-6·Δ`), pointer parallax,
the six-frame pulse shake, the scroll-rest orbit and the gear idle are all
retained — determinism is proved by settle-gating the capture, not by
removing the layers that need to settle.

**Canonical ladder values are unchanged by JG-026:**

| Unit / part identity | Offset (m) |
|---|---:|
| Output spindle P000095 / P000207 | +0.050 |
| Stage 4 A000861 / P003047 | -0.099 |
| Stage 3 A000860 / P003045 | -0.142 |
| Stage 5 A000606 / P001849 | -0.177 |
| Bearing K000004 | -0.197 |
| Stage 2 A000592 / P001837 | -0.230 |
| Stage 1 A000591 / P001836 | -0.255 |
| Clutch A000881 / P000724 / P000297 | -0.291 |
| Handle assembly | -0.354 |

Clutch sliding adds `shift × -0.015 m`. Display turns along the physical driveline from motor to snout (stage1 → stage2 → stage5 → stage3 → stage4) are
`8.0 / 5.2 / 3.38 / 2.20 / 1.43` (`stage1: 8`, `stage2: 5.2`, `stage5: 3.38`, `stage3: 2.2`, `stage4: 1.43`, JG-031 ~65% stage progression); planets counter-rotate by multiplier `3.5`.
Part numbers identify units; stage names cannot reorder them.

**Sheet and projection (owner rulings 2026-09-05).** ANSI C proportion
22:17, landscape on every viewport, 0.905882 × 0.700 m in world units,
fitted to 92% of viewport height — 66.97% of width on 16:9, with the
backdrop wash in the margins either side; it is never cropped to fill the
width. True third angle: the primary side elevation is 1:1 (that is what
lets the model register to a view the code projected), the plan sits above
and the section below on its vertical centreline, and the end view sits
right on its horizontal centreline; measured alignment deviation 0.000000.
Section A–A is a bottom half-section whose cutting-plane line and arrows
are drawn on the parent elevation. Narrow viewports keep the same landscape
sheet and get a scroll-driven camera push-in and pan instead of a separate
portrait arrangement.

The [animation spec §5](project/context/architecture/animation-spec.md),
both READMEs and the skills registered in
[`agent-skills.md`](project/context/agent-skills.md)
must accompany behavior/table changes in the same commit. Full/lite retain focus/excitation/lift; lite omits plane displacement.
Reduced motion holds the fully focused registered phase-.20 frame; poster
retains the original DOM poster. [JG-026 evidence](project/work/evidence/JG-026-b1-b2-verification.md)
records remaining proof and Mark's pending `?chapter=0` visual ruling.

## Design decisions inherited from the group audit

- **Node names, never mesh names.** Mesh names in the GLB are generic
  `meshN_mesh`; identity lives on nodes (`HANDLE ASSY, D.5AP-D1AP-rev1`,
  `D1-AP Gearbox Assy-rev2`). `nodeRoles.ts` matches tolerant patterns and
  tags gearbox roles by the D1-AP part-number table (5 stages, clutch halves,
  output spindle, housing), so re-exports don't break it.
- **Rear-extraction explosion offsets.** The P000245 housing bore necks down
  at the snout, so the stages + clutch extract rearward (−Z) in a
  clearance-derived, driveline-order ladder (P003047 first out at −0.099 m …
  P001836 furthest at −0.255 m; A000606 is the THIRD cage, followed by
  K000004 at −0.197 m and P001837 — ≥15 mm gaps), only the output spindle exits forward
  (+0.05 m), and the handle backs off −0.354 m; carriers spin at per-stage
  ratios with planet counter-rotation through the whole sequence
  (`EXPLODE_OFFSETS` / `GEAR_RATIOS` in `caseStudies.ts`).
- **Photoreal PBR roles** (`src/scene/rig/materials.ts`): clearcoat black
  shells, tool-steel output cluster, machined-steel internals, emissive LCD —
  assigned by node-name role at consolidation, per Mark's render reference
  (`project/context/references/media/torque-render.webp`).
- **role-map.json is the anchor source** for hotspots — 316 part occurrences
  with bbox centers from the gltf-transform pipeline pass.
- **Copy is Honey's** (`OUTBOX/portfolio-module4-copy.md`), used verbatim.
