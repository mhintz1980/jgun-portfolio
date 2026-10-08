# JGun Portfolio — 3D Interactive Mechanical-to-AI Portfolio

> **JG-035 handwriting update, 2026-10-08:** The rejected synthetic hand is replaced by a custom font traced from the owner's `ac-fast.png` reference, rendered as individual graphite glyphs with deterministic reveal. Mark clarified that close resemblance is enough and said the font looks good. [Current handwriting plan](docs/jgun-handwriting-reference-plan-2026-10-08.md) and [evidence/handoff](project/work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/README.md) supersede the handwriting status in the historical banners below. Full animation acceptance and inherited G6 remain separate.

> **JG-035 owner revisions, 2026-10-07/08 (implemented; owner visual acceptance OPEN).** Handwritten owner notes on the drawing (Detail B retargeted to the input-shaft sun gear P001835, no sticky notes), personal MARK HINTZ / Digital Systems Architect title and A/B/C career block, accelerating burst/hold electrical outline with interior branches, extra close-reading scroll, Ring Switch hole concealment and knurl seam fix, cutter-viewer-right shaft camera, FEA-style factor-of-safety presentation and shaft normal repair. [Plan](docs/jgun-owner-animation-revision-plan-2026-10-07.md) · [evidence index](project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/README.md). Captures are bundled Chromium + SwiftShader software GL in a Linux cloud container, not hardware GL; Windows hardware verification, the inherited G6 desktop-full tier drop and the final full verifier roster remain open. The handwriting is now an all-caps humanized hand in graphite ink (`2831f35`, drawing cache v7) — in progress, pending visual verification. The measured ladder and downstream windows are unchanged.

> **Reduced-motion policy supersession, 2026-10-06.** Mark selected [posters throughout](project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/reduced-motion-owner-decision-2026-10-06.md): reduced-motion visitors receive static DOM narrative/posters and static inspection rasters; narrative CAD downloads and WebGL/canvas mounting are excluded. Non-reduced full/lite behavior is unchanged. The measured `.38` reduced-motion park remains a numerical sampler fallback constant (animation-spec §5); the reduced-motion product path never mounts that sampler or canvas. Current proof on the new build: lifecycle 14/14 PASS, static 4/4 with zero CAD requests, and the full opening roster finished 5/6 — desktop-full fails 110 expectations after the effective tier becomes lite (cause unestablished; no waiver), while both reduced cases directly record zero CAD requests, zero canvases and no connected GL context. Earlier six-case roster evidence (including its two reduced-motion static cases) is historical, not current proof.

> **JG-035 current revision (2026-10-03):** Blue-trace / vertical-shaft effects approved as concepts; live implementation includes heavy knurled black-anodized Ring Switch and the owner's drawing callout/cutaway corrections. [Current plan and verification](docs/jgun-blue-trace-tunnel-plan.md). Runtime owner visual acceptance remains open.

> **JG-035 causal portal correction — technically verified 2026-10-02; owner visual review OPEN.** The J-Gun pushes opaque paper from below and is already lit beneath the first rupture; gaps expose deep portal space, never the wooden desk. Storm, fracture, crack light, burned edges, scroll share and downstream mechanism timing are retained. [Active correction plan](docs/jgun-portal-correction-plan.md). The earlier 184/184 tests, 29/29 B1/B2, six-case roster PASS and technical SHIP belong to the [superseded breakthrough packet](project/work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md); they do not verify this correction. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. No commit, push or deployment.

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

## Ring Switch finish inspection

In the JGun narrative, **Inspect the finish** opens an accessible P003068 macro. Play/Replay runs the paired-tool knurling study; Return or Escape restores the narrative position and view. Poster/reduced modes provide a static finish schematic. Owner revision 2026-10-07: the six drilled holes are concealed by measured, runtime-owned curved patches from 1.2–2.4 s (fully hidden until the tool leaves at 8.2 s) and reopen 8.2–8.95 s, 0.35 s before black completes at 9.3 s (`holePlugBlend`); the knurl UV seam is split so no axial strip is missing. The separate committed prop is `public/models/knurling-tool.glb`, copied unchanged from the [verified asset packet](project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/README.md); do not add it to `sync-assets.ps1`. [Implementation plan](docs/jgun-authorship-knurling-implementation-plan.md).

## Module map

| Module | Files |
|---|---|
| 1 — Scene canvas & camera spline rig | `src/scene/SceneCanvas.tsx`, `src/scene/ScrollRig.tsx`, `src/scene/CameraRig.tsx` |
| 2 — Exploded wrench & kinematic rig | `src/scene/TorqueWrenchHero.tsx`, `src/scene/rig/nodeRoles.ts` |
| 3 — CAD-to-code dissolve shader | `src/shaders/CadTransitionShader.ts` |
| 4 — Data contracts & HUD | `src/types/portfolio.ts`, `src/data/caseStudies.ts`, `src/components/TechnicalHUD.tsx`, `src/scene/Hotspots.tsx` |

**Full scroll/animation spec** (chapters, camera keyframes, timelines, tiers,
verification method): [`project/context/architecture/animation-spec.md`](project/context/architecture/animation-spec.md).

## Opening timing and unchanged canonical ladder

The active opening follows the owner's [portal correction](docs/jgun-portal-correction-plan.md): registered lit hold .38–.45, five irregular lamp failures .45–.58, visible-dark anticipation .58–.66, glowing profile slit .66–.79 (spark .66–.765, burst/hold outline .765–.79, interior branches ≈.7882–.8132; owner revision 2026-10-07), then the J-Gun pushes the paper upward .79–.84. Illumination resolves .79–.81; PBR activates .80–.82, before fracture begins .84. Rupture .84–.88 immediately reveals the already-present J-Gun; its continuous rise runs .79–1, with the pressure push preceding the post-rupture lift. Every exposed profile gap must show opaque, nearly black portal depth with irregular descending walls and white-blue upward light, never walnut. Lamp return .79–.86, perspective .90, `INTRO_SCROLL_SHARE` .50 and reduced-motion park .38 remain unchanged. The print stays opaque (`drawingOpacity = 1`); the perforated sheet remains through global .18 and retires physically .18–.22. These timings are read from the correction source. Current correction checks: 276/276 unit tests, production build/typecheck, 31/31 B1/B2 and Stage 2 PASS. Production captures 2/2 PASS (desktop lite and narrow full), with zero desk pixels in all 12 sampled aperture frames. Runtime roster all 6/6 PASS on the same production build: 344 forward/reverse checkpoints, 96 pinned frames and two reduced-motion static cases, zero failures/errors. The [canonical aggregate](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/verified-roster/summary.json) references four passing full-roster records and two complete repaired forced-lite records. Fresh final read-only review: [Zeno SHIP](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/technical-review.md), with no blocking findings after independent inspection of live source, canonical aggregate and narrow-lite evidence. Technically verified 2026-10-02; owner visual acceptance remains open. [Correction review](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/review.md) · [Handoff](project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/handoff.md). Owner visual acceptance remains open. The earlier [paper breakthrough packet](project/work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/review.md), storm packets, stages 1–3 and JG-026 opening narratives are historical and superseded where their opening behavior conflicts. Mechanical ladder and downstream windows remain unchanged; the revised extraction pose law and its measured clearance solve are specified in animation-spec §5.0. Enclosure/M249 page separation awaits owner clarification.

B1/B2 occupy global `0.000–0.120` of PROGRESS, which
`pacedProgress()` stretches over `INTRO_SCROLL_SHARE = 0.50` of the
DOCUMENT (owner pacing rulings 2026-09-05 and 2026-10-01). The intro's
normalized axis spends `.00–.38` on focus and drafting (the camera now reads the
title/career block, the input-shaft note and the output-shaft note in turn; an
opening-only monotone C1 remap `introRawFraction` gives the close reads +3.5 s /
+4 s before the establishing and settle shots at a 100 s sweep and is identity from
raw `.33`), `.38–.45` on the
registered lit hold, `.45–.66` on failures and visible-dark anticipation,
`.66–.79` on the profile slit (a non-advancing spark to `.765`, then the burst/hold
electrical outline `.765–.79`, with interior branches `≈.7882–.8132`), `.79–.88` on pressure and fracture,
with model illumination and PBR ready before the first rupture; the model
continues rising to 1. The clearance crossing is solved from transformed
vertices for the current pressure bound, not hard-coded to a phase boundary.
`relativePose` uses a bounded pressure push followed by the u^1.4 lift and
keeps the registered side rotation throughout. Document
height is 3120vh (scroll distance 3020vh); every downstream chapter keeps its
progress span exactly while the main timeline occupies the remaining 0.50 of
raw document scroll.

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
must accompany behavior/table changes in the same commit. Full/lite retain the
opening sequence; lite uses 45% swelling displacement. Reduced motion serves
DOM posters throughout (2026-10-06 owner decision above); the `.38` park
remains a numerical sampler fallback. [JG-026 evidence](project/work/evidence/JG-026-b1-b2-verification.md)
is historical and does not verify the breakthrough opening.

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
