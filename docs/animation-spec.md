# Animation Spec — the whole page

One document describing the full scroll experience: what animates, what drives
it, and where each behavior lives in code. The code is the source of truth;
this spec describes it as of commit `d33ec89` (2026-08-23). When behavior and
this document disagree, fix the document in the same change.

The page in one sentence: a fixed WebGL stage holds a photoreal CAD assembly
of the JGun pneumatic torque wrench while the user scrolls a plain-DOM
narrative past it — the camera flies a 4-keyframe trajectory, the housing
fades to ghost, the assembly explodes axially, and the metal dissolves into
emissive wireframe, narrating "shop floor to software."

---

## 1. Architecture: two worlds, one scroll

| World | Lives in | Rendered by |
|---|---|---|
| Canvas world (fixed, `z-0`) | `src/scene/SceneCanvas.tsx` | R3F/three.js, code-split (`App.tsx` lazy) |
| DOM scroll world | `src/components/Chapters.tsx` | Plain React DOM — never canvas-gated |

A single external store (`src/state/scrollStore.ts`) bridges them:

- `progress` 0..1 — global page scroll
- `chapter` 0..3, `chapterProgress` 0..1 — active chapter + progress through it
- `velocity` — smoothed scroll velocity (HUD flavor only)
- `materialMode` `'solid' | 'blueprint' | 'exploded'` — HUD switcher / `?view=`
- `hotspotId` — selected hotspot or null

Canvas-side consumers read `getScrollState()` inside `useFrame` (zero React
re-renders); DOM-side consumers subscribe per-key via `useScrollValue`
(`useSyncExternalStore`). Per-frame runtime telemetry lives in a plain mutable
object (`telemetry`), deliberately outside React state, exposed read-only as
`window.__telemetry` for headless probes in three blocks: `camera` (position +
FOV, written by CameraRig), `rig` (handle/stage1/stage2 Z offsets, ghost
opacity + count, explode factor, written by TorqueWrenchHero), and `scroll`
(progress/chapter/chapterProgress/materialMode, mirrored by CameraRig).

## 2. Scroll pipeline (`src/scene/ScrollRig.tsx`)

Lenis (duration 1.1, smoothWheel) drives native window scroll. Its raf is
ticked from `gsap.ticker` with `lagSmoothing(0)` so Lenis, ScrollTrigger and
the R3F frame loop share one clock without post-tab-switch stutter.

ScrollTrigger creates:

- **Global trigger** (`start: 0, end: 'max'`) → writes `progress` + `velocity`.
- **Per-chapter triggers** (`start: 'top 60%'`, `end: 'bottom 40%'`, one per
  `[data-chapter]` section) → the active one writes `chapter` (onToggle) and
  `chapterProgress` (onUpdate).

The scroll rig mounts only when `tier !== 'poster' && !reducedMotion`
(`App.tsx`); reduced-motion users scroll natively with no smooth-scroll layer.

## 3. Chapters (`src/data/caseStudies.ts` `CHAPTERS` + `Chapters.tsx`)

Four full-viewport narrative sections over a fixed canvas. CH.01 anchors its
copy at the *top* of the section (`justify-start pt-[12vh]`) so the machine
and headline identify the site in the opening viewport; CH.02–04 stay
centered. CH.01 also renders the `ASSEMBLY_IDENTITY` block (machine name +
spec line, verbatim StaticPoster vocabulary).

| # | Label | Title | Theme | Datum | Camera intent |
|---|---|---|---|---|---|
| 0 | CH.01 ASSEMBLY | The Full-Stack Physical & Digital Systems Architect | Hero assembly, identity | A | 3/4 perspective |
| 1 | CH.02 X-RAY / EXPLODE | Inside the Reduction Train | Ghost + axial explosion | B | lateral inspection |
| 2 | CH.03 THERMAL / ACOUSTIC | Airflow Against the Noise Floor | Acoustic SAFE enclosure | C | macro isometric |
| 3 | CH.04 DIGITAL SYSTEMS | From Point Cloud to Production Code | Electronics, CAD→code dissolve | A | forward terminal view |

Each chapter carries case-study cards (real DOM, always rendered — even in
poster tier): gearbox (CH.02), SAFE enclosure (CH.03), M249/MK46
reverse-engineering (CH.04). Copy is Honey's, verbatim from
`OUTBOX/portfolio-module4-copy.md`.

## 4. Camera (`src/scene/CameraRig.tsx`, `CAMERA_PATH`)

Four keyframes — one per chapter, in the hero group's space (model recentered
at the origin):

| Keyframe | Position (m) | Target (m) | FOV |
|---|---|---|---|
| CH.01 | (0.32, 0.16, 0.42) | (0, 0, 0) | 42° |
| CH.02 | (0.55, 0.04, 0.04) | (0, 0, 0.03) | 34° |
| CH.03 | (0.27, 0.27, 0.27) | (0, 0, -0.02) | 28° |
| CH.04 | (0.06, 0.03, -0.46) | (0, 0, -0.11) | 50° |

Global `progress` selects a segment between adjacent keyframes; local `t` is
smoothstep-eased, and position/target/FOV are then exponentially damped
(`1 - e^-6·Δ`) so fast scrolling never snaps. Pointer parallax is layered on
the goal position (±0.03 x, ±0.02 y) before damping; the hero object adds its
own object-space parallax. Near/far planes: 0.005 / 20; canvas default camera
matches the CH.01 keyframe so first paint equals keyframe 0.

Reduced motion: camera pins to the CH.01 keyframe — no interpolation, no
parallax, no drift.

## 5. The hero animation timeline (`src/scene/TorqueWrenchHero.tsx`)

One GSAP timeline, scrubbed (`scrub: 0.6`) across the CH.01 section's full
pass through the viewport (`trigger: '[data-chapter="1"]'`,
`start: 'top bottom'`, `end: 'bottom top'`), animating a plain proxy object
(`{ spin, ghost, explode }`) so GSAP never fights the R3F render loop.
`useFrame` applies the proxy each frame:

| Stage | Timeline window | Effect |
|---|---|---|
| 1. spin | 0 → 0.30 | hero group yaw to `spin · π · 0.85` + pointer parallax (±0.08 x, tilt ±0.05 y) |
| 2. ghost | 0.25 → 0.50 | housing materials lerp opacity 1 → **0.15** (`GHOST_OPACITY`); `depthWrite` off below 0.5 |
| 3. explode | 0.55 → 1.00 | axial stage offsets (below) |

### 5.1 Rig classification (`src/scene/rig/nodeRoles.ts`)

Node identity comes from NODE names — mesh names are generic. The two
assemblies are matched by `HANDLE[\s_]*ASSY` / `GEARBOX[\s_]*ASSY` (the
separator class must include `_`: GLTFLoader sanitizes node names at load, so
the GLB's `HANDLE ASSY, D.5AP-…` arrives as `HANDLE_ASSY,_D5AP-…`. A `\s*`-only
class silently kills the whole rig — the 2026-08-22 explosion bug).

Gearbox direct children are split into Stage 1 / Stage 2 by bbox-center Z
relative to the median (handle side = Stage 1). ~13k raw meshes are merged
per (unit × material × ghost-status) into ~50 draw calls; rig detection runs
on the original tree before merging. The built rig is cached on
`root.userData.wrenchRig` because consolidation is destructive and `useGLTF`
caches the parsed scene per URL.

### 5.2 Ghost set (who fades)

A mesh ghosts if (a) it sits under a node matching
`/(HOUSING|COVER|SHELL|CASE\b|CAP\b)/i`, or (b) it belongs to the gearbox's
largest child by bbox volume (the P000245 outer shell). Ghost materials are
cloned transparent-capable so the fade never bleeds into shared sources.
Current verified count: **19 ghost materials** (17 on the P000245/stage-1
path, 2 handle-side housing nodes). Ghost is suppressed in blueprint mode
(everything is already wireframe).

### 5.3 Explosion offsets (`EXPLODE_OFFSETS`, meters)

| Unit | Offset |
|---|---|
| handle assembly (−Z) | −0.175 |
| gearbox Stage 1 (+Z) | +0.0875 |
| gearbox Stage 2 (+Z) | +0.175 |

×1.75 the corrected-brief real scale (−0.10/+0.05/+0.10) for a **0.35 m total
handle→stage-2 spread** on the ~0.25 m model (ratified by Mark, 2026-08-23;
the original brief's ±1.5/+3.0 was 6–12× the model length). Applied as
`basePositions` + offset each frame, so it composes with (and fully opens in)
exploded mode: `explode = max(anim.explode, mode === 'exploded' ? 1 : 0)`.

### 5.4 Material modes

`[ SOLID PBR ]` / `[ BLUEPRINT WIREFRAME ]` / `[ EXPLODED ASSEMBLY ]` via the
HUD switcher (UI-driven, not scroll). Blueprint swaps all rig meshes to a
cyan `MeshBasicMaterial` wireframe (opacity 0.35); original materials are
restored on switch-back via the per-mesh originals map. `?view=<mode>` sets
the initial mode once at load (read in `scrollStore`, never rewrites the URL).

## 6. Chapter 4 CAD dissolve (`src/shaders/CadTransitionShader.ts`)

A model-space planar sweep travels along the assembly's long (Z) axis: ahead
of the sweep, half-lambert + fresnel metal; behind it, emissive digital
wireframe/point-cloud with animated noise; the sweep edge is an emissive
scanline. The sweep is evaluated in the hero's recentered model frame via
`uRootInv` (that frame's inverse world matrix, refreshed each frame in
`TorqueWrenchHero`), so hero rotation and pointer parallax cannot drift the
scanline, while explosion offsets — applied below that frame — still sweep
with the parts. Uniforms: `uProgress` (chapter-4 scroll), `uTime`,
`uScanColor`, `uEdgeWidth`, `uNoiseFreq`, `uRootInv`, `uSweepMin/uSweepMax`
(model-frame Z bounds from the rig, shifted by `-center.z` at the call site).
Active only at `chapter === 3 && tier === 'full'`. Lite tier replaces it with
a plain opacity ramp into the blueprint wireframe.

## 7. Hotspots (`src/scene/Hotspots.tsx`, `HOTSPOTS`)

Seven annotated occurrences (`ROTOR-1`, `AIR MOTOR HOUSING-MACHINED-1`,
`FLANGE-1`, `P000245-1`, `MSP430F6726IPN-1`, `MANOMETER LCD BK11356-1`,
`Tenergy LiPo Battery 3.7 V-1`), anchored by matching `role-map.json`
occurrence names (316 entries with world-space bbox centers — the pipeline's
authoritative anchor source). Occurrence matching is exact-first with a
prefix-normalizing fallback: entries may carry an exporter-added
`"occurrence of "` prefix, which is stripped (case-insensitive) only when no
exact row exists, so anchors never shift when both forms are present. Rendered inside the hero group so they track
rotation and explosion; visible only in their declared chapters. Each is a
real `<button>` with `aria-pressed`, native Enter/Space activation, cyan
focus-visible ring, and Escape closes the detail panel. No role map → no
hotspots (graceful no-op).

## 8. Scene look (`SceneCanvas.tsx`)

Background `#05070a` + matching fog (1.4–4.5 m). Lights: ambient 0.35, warm
key 2.2 from (1.5, 2, 1), cyan rim 0.6 from (-2, 1, -1.5), spot 1.4 above
the rear. Procedural IBL: PMREM-baked `RoomEnvironment` at
`environmentIntensity 0.7` — envmap only, no external HDR fetch — because the
GLB's metallic `MeshStandardMaterial`s read near-black under punctual lights
alone. `ContactShadows` under the model (opacity 0.4, far 0.4).

## 9. Quality tiers, DPR, reduced motion (`src/state/qualityStore.ts`)

One-way tier ladder — a struggling device never thrashes:

- **full** — everything on.
- **lite** — the dissolve shader is off (opacity-ramp fallback).
- **poster** — no canvas at all; `StaticPoster` + native scroll behind the
  always-DOM narrative. Entered on: no WebGL2, context loss, or sustained
  decline in lite.

DPR staircase 2 → 1.5 → 1.25 → 1 (clamped to device ratio) walks down while
`PerformanceMonitor` sees < 45 FPS and back up with headroom (bounds
[45, 60], thrash guard after 3 flip-flops). Only DPR recovers; tiers never
upgrade at runtime.

`prefers-reduced-motion` is orthogonal to tier: the canvas may render (static
hero pose, mode switcher still live) but Lenis/ScrollTrigger never mount, the
camera pins to the CH.01 keyframe, and spin/ghost-fade/explosion-scroll/
pointer-parallax/dissolve are all skipped. Explosion in reduced motion is
only reachable via the explicit `[ EXPLODED ASSEMBLY ]` switcher — a user
action, not motion.

## 10. Boot + code splitting (`App.tsx`)

DOM narrative, HUD chrome and poster paint from a small entry chunk; the
canvas world (three/R3F/drei/GSAP/Lenis + shader) streams in behind Suspense
(`BootSequence` shows GLB stream-in progress; poster tier never fetches it).

## 11. Verification method (how claims about this page get checked)

- 3D-scene truth comes from **instrumentation** (`document.title` /
  `window.__telemetry` probes read from a real browser), never from
  screenshots: historically headless Chrome never loaded this GLB (remote
  Draco decoder fetch stalls; decoders are now vendored locally in
  `public/draco/` via `useGLTF.setDecoderPath` — headless GLB load re-test
  pending) and vision models confabulate on the dark scene. Verified values
  cited in this spec (offsets `hZ=-0.175 s1Z=0.087 s2Z=0.175`; 19 ghost
  materials at 0.15 in the CH.02 zone) were captured that way on 2026-08-23.
- Full method + failure log: vault
  `04-Projects/Portfolio-Site/2026-08-22-jgun-chapter1-gauntlet-and-capture-playbook.md`.

## 12. Known gaps (not animation bugs)

- No deploy/hosting config — the build is live nowhere (the real ship blocker).
- Concept A↔B site-relationship decision open (vault project-state).
