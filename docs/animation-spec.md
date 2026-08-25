# Animation Spec — the whole page

One document describing the full scroll experience: what animates, what drives
it, and where each behavior lives in code. The code is the source of truth;
this spec describes it as of the 2026-08-23 explosion/kinematics rework
(commits through the rear-extraction change). When behavior and this document
disagree, fix the document in the same change.

The page in one sentence: a fixed WebGL stage holds a photoreal CAD assembly
of the JGun pneumatic torque wrench while the user scrolls a plain-DOM
narrative past it — the camera flies a 4-keyframe trajectory, the two-speed
clutch shifts, the gear train spins up epicyclically, the housing fades to
ghost, the internals extract rearward out of the gearbox in a staggered
five-stage ladder while only the output spindle exits the snout, and the
metal dissolves into emissive wireframe, narrating "shop floor to software."

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
FOV, written by CameraRig), `rig` (written by TorqueWrenchHero — unit Z
offsets `handleZ`/`outputZ`/`clutchZ`/`slidingZ`, per-stage `stageZ[5]` and
carrier `stageRot[5]`, stage-1 first-planet `planetRot`, proxy channels
`gearRotation` + `shift`, ghost opacity + count, explode factor), and `scroll`
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
(`{ spin, ghost, explode, gearRotation, shift }`) so GSAP never fights the R3F
render loop. `useFrame` applies the proxy each frame:

| Stage | Timeline window | Effect |
|---|---|---|
| 1. shift | 0 → 0.15 | two-speed clutch slide: ring switch / fork / cam / pins travel −0.015 m together |
| 2. spin | 0.15 → 0.45 | hero group yaw to `spin · π · 0.85` + pointer parallax (±0.08 x, tilt ±0.05 y) |
| 3. gearRotation | 0.15 → 1.00 | epicyclic sweep 0 → 8π rad — spins up AND keeps turning through the extraction (§5.4) |
| 4. ghost | 0.35 → 0.60 | housing materials lerp opacity 1 → **0.15** (`GHOST_OPACITY`); `depthWrite` off below 0.5 |
| 5. explode | 0.60 → 1.00 | rear extraction ladder (§5.3) — overlaps the gear sweep's tail |

### 5.1 Rig classification (`src/scene/rig/nodeRoles.ts`)

Node identity comes from NODE names — mesh names are generic. The two
assemblies are matched by `HANDLE[\s_]*ASSY` / `GEARBOX[\s_]*ASSY` (the
separator class must include `_`: GLTFLoader sanitizes node names at load, so
the GLB's `HANDLE ASSY, D.5AP-…` arrives as `HANDLE_ASSY,_D5AP-…`. A `\s*`-only
class silently kills the whole rig — the 2026-08-22 explosion bug).

Gearbox-internal roles come from the **D1-AP 2-speed part-number table**
(Mark, 2026-08-23): `P…` manufactured parts, `K…` commercial parts, `A…`
sub-assemblies. Each node is tagged by part-number substring (survives
GLTFLoader mangling — part numbers carry no spaces), and each mesh belongs to
its *nearest tagged ancestor's* unit:

| Role | Parts |
|---|---|
| stage 1 | A000591 cage assy: P001836 cage (carrier w/ integral sun) + 4× P000247 planets |
| stage 2 | A000592: P001837 cage + 4× P000247 (shared planet part — disambiguated by assembly ancestor) |
| stage 3 | A000860: P003045 cage + 4× P000069 |
| stage 4 | A000861: P003047 cage + **5×** P003046 |
| stage 5 | A000606: P001849 cage (internal spline locks to output shaft) + 4× P000248 |
| clutch static | A000881 subtree, P000420 intermediate housing, P001835 input shaft |
| clutch sliding | P000724 shifter fork, P000297 shifter cam |
| ring switch assembly | P003068 ring switch, 3× P000464 pins, 3× K000156 ball-nose plungers |
| output spindle | P000095 shaft, P000207 / K000001 bushings, K000074 retaining ring |
| housing | P000245 outer shell — static, never explodes |
| untagged | static remainder (K-hardware etc.) |

~13k raw meshes are merged per (unit × PBR role × ghost-status); rig
detection runs on the original tree before merging. Each animation unit owns
a merged `Group` whose geometry is baked into the group's own frame, so the
group's transform is the part's rigid motion: carrier groups sit at the
gear-train axis (mean planet-pin center, gearbox-local XY) and their planet
groups hang beneath them at each pin — carrier `rotation.z` revolves the
planets; each planet's own `rotation.z` counter-spins it on its pin. The
built rig is cached on `root.userData.wrenchRig` because consolidation is
destructive and `useGLTF` caches the parsed scene per URL.

### 5.2 Ghost set (who fades)

A mesh ghosts if (a) it sits under a node matching
`/(HOUSING|COVER|SHELL|CASE\b|CAP\b)/i`, or (b) it belongs to the gearbox's
largest child by bbox volume (the P000245 outer shell). Ghost materials are
cloned transparent-capable so the fade never bleeds into shared sources.
Current verified count: **3 ghost materials** (23 before the 2026-08-24 PBR
rework — role-based bucketing merged the housing's per-CAD-material ghost
clones into one per (unit × role); all still fade together). Ghost is
suppressed in blueprint mode (everything is already wireframe).

### 5.3 Explosion offsets (`EXPLODE_OFFSETS`, meters — rear extraction)

Mechanical constraint (Mark, 2026-08-23): the P000245 housing bore necks down
toward the +Z snout (measured: ⌀0.065 housing vs ⌀0.012–0.028 bushings at
+Z; handle center z ≈ −0.168, output cluster z ≈ +0.02..0.03), so the
internals CANNOT exit the front. All five stages + clutch extract rearward
(−Z, toward the removed handle); only the output spindle exits forward
through the snout; the housing stays put.

**Exploded line order is the driveline order, not the stage numbering**
(Mark review 2026-08-24): the A000606 cage (P001849) is the THIRD cage of
five — behind the housing rear face the line reads P003047 (stage 4, first
out) → P003045 (stage 3) → P001849 (A000606) → P001837 (stage 2) → P001836
(stage 1, furthest back). Keyed by part numbers, never stage names.

Magnitudes are a clearance-derived ladder measured from JSON-chunk rest
spans (`.scratch/measure-spans.mjs`, validated against the 08-24 handoff
anchors): first cage clears the housing rear face (z = −0.074) by ≥14 mm,
adjacent exploded units keep ≥15 mm gaps, and the handle backs off with
25 mm of air behind the clutch (widened from 14.5 mm in the same review so
the extraction reads with generous spacing).

| Unit | Offset | Exploded span (m, model frame) |
|---|---|---|
| output spindle | +0.050 | ≈ [+0.043, +0.102] (through snout) |
| gearbox Stage 4 | −0.099 | ≈ [−0.127, −0.088] (first out; 14 mm air) |
| gearbox Stage 3 | −0.142 | ≈ [−0.184, −0.143] |
| gearbox Stage 5 (A000606) | −0.177 | ≈ [−0.233, −0.200] (third in line) |
| gearbox Stage 2 | −0.208 | ≈ [−0.275, −0.249] |
| gearbox Stage 1 | −0.233 | ≈ [−0.312, −0.291] |
| clutch (static + sliding) | −0.269 | ≈ [−0.410, −0.327] (sliding −0.015 further at shift 1) |
| handle assembly | −0.331 | ≈ [−0.564, −0.434] (25 mm air behind clutch) |

Exploded stack span ≈ 0.67 m (output front +0.102 to handle rear −0.564) —
the handle's tail can kiss the frame edge at full explode under the CH.02
lateral camera; widening that camera remains an open tuning decision.

Applied as `basePositions` + offset each frame, so it composes with (and
fully opens in) exploded mode: `explode = max(anim.explode, mode ===
'exploded' ? 1 : 0)`.

### 5.4 Epicyclic gear rotation + clutch shift & speed indicator grooves

The proxy's `gearRotation` channel (0 → 8π across CH.02 timeline — spin-up
AND spin-through-extraction) drives kinematically-staged rotation via
`GEAR_RATIOS` (`caseStudies.ts`): carrier `rotation.z = gearRotation · ratio[stage]`
with cumulative ratios 1.0 / 0.28 / 0.08 / 0.022 / 0.006 (stage 5 = final output),
and each planet `rotation.z = −gearRotation · ratio[stage] · 3.5` (counter-rotation
on its pin; planet groups are carrier children, so they also revolve with it).

**Clutch Shift & Speed Indicator Grooves (CH.01 5%→17% scroll):**
- **Ring Switch (P003068)**: Keyed to CH.01 scroll progress $0.05 \to 0.17$.
  - $0.05 \to 0.10$: Slides $+9.525\text{ mm}$ ($+Z$, away from handle) along the helical cam groove in `P000420`, rotating $+120^\circ$ simultaneously (`RING_SWITCH_ROTATION`).
  - $0.10 \to 0.12$: Pauses at the bottom of travel.
  - $0.12 \to 0.17$: Reverses back to home against the handle as camera pulls back.
- **P000420 Speed Indicator Grooves** (Mark spec 2026-08-25):
  - Two circumferential grooves on `P000420` OD flank the helical cam slots:
    - **Lower Groove (near gearbox, $+Z$)**: `#005DAA` OSHA Safety Blue. Exposed when ring switch is seated against handle (shift = 0 / low speed).
    - **Upper Groove (near handle, $-Z$)**: `#C8102E` OSHA Safety Red. Exposed when ring switch shifts down to gearbox (shift = 1 / high speed), covering the blue groove.
- Rotation and shift are scroll-driven only — the `[ EXPLODED ASSEMBLY ]` mode is a static fully-open pose that keeps the train at rest, and reduced motion skips both.

### 5.5 Material modes & the photoreal PBR system

`[ SOLID PBR ]` / `[ BLUEPRINT WIREFRAME ]` / `[ EXPLODED ASSEMBLY ]` via the
HUD switcher (UI-driven, not scroll). Blueprint swaps all rig meshes to a
cyan `MeshBasicMaterial` wireframe (opacity 0.35); role materials are
restored on switch-back via the per-mesh originals map. `?view=<mode>` sets
the initial mode once at load (read in `scrollStore`, never rewrites the URL).

**Photoreal PBR roles (2026-08-24, Mark review: "needs to improve
drastically")** — `src/scene/rig/materials.ts` assigns a PBR role per
consolidated source mesh from its node name (part numbers + vendor names are
mangling-safe) with unit-key defaults, replacing the CAD placeholder
materials as the merge-bucket identity. Targets come from Mark's reference
pair (`docs/torque-render.webp` + `docs/jgun-handle-gearbox-description.md`):
deep-black clearcoat shells (`MeshPhysicalMaterial`, #0A0A0A / rough 0.18 /
metal 0.18 / clearcoat 1), hardened tool-steel output cluster (#4A4D50 /
0.45 / 0.95), machined steel internals in three tones (cage/planet/clutch),
black-oxide hardware, chrome fittings, matte polycarbonate electronics with
an emissive cyan LCD (`emissiveIntensity` 3). Studio balance: RoomEnvironment
IBL at intensity 1.0 carries the clearcoat reflections; the punctual key
steps back to 1.7 so gloss highlights don't blow out.

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
camera pins to the CH.01 keyframe, and spin/ghost-fade/gear-rotation/
clutch-shift/explosion-scroll/pointer-parallax/dissolve are all skipped.
Explosion in reduced motion is
only reachable via the explicit `[ EXPLODED ASSEMBLY ]` switcher — a user
action, not motion.

## 10. Boot + code splitting (`App.tsx`)

DOM narrative, HUD chrome and poster paint from a small entry chunk; the
canvas world (three/R3F/drei/GSAP/Lenis + shader) streams in behind Suspense
(`BootSequence` shows GLB stream-in progress; poster tier never fetches it).

## 11. Verification method (how claims about this page get checked)

- 3D-scene truth comes from **instrumentation** (`document.title` /
  `window.__telemetry` probes read from a real browser), never from
  screenshots: vision models confabulate on the dark scene. Headless GLB load
  with the vendored local Draco decoders (`public/draco/`) was re-tested
  2026-08-23 and **works** (full rig builds headless, zero console errors, and
  headless WebGL rasterizes). Verified values cited in this spec (rear
  extraction ladder `stageZ [-0.175, -0.14, -0.105, -0.07, -0.035]`,
  `outputZ +0.05`, `handleZ -0.26`, sliding clutch `-0.225` at shift 1,
  per-stage carrier rotations exactly `8π × {1.0, 0.28, 0.08, 0.022, 0.006}`
  with planets at −3.5×, 23 ghost materials at 0.15) were captured that way
  on 2026-08-23. Pass-2 review values (same day): clearance ladder `stageZ
  [-0.215, -0.194, -0.181, -0.142, -0.063]`, `outputZ +0.05`, `handleZ
  -0.303`, sliding clutch `-0.266` at shift 1, and `gearRotation` reaching
  8π exactly as `explodeFactor` hits 1 (overlapping windows — gears spin
  through the extraction). Pass-3 review values (2026-08-24, driveline-order
  ladder + PBR rework): `stageZ [-0.233, -0.208, -0.177, -0.142, -0.099]`
  (s1..s5 — exploded line order s4→s3→s5→s2→s1), `outputZ +0.05`, `handleZ
  -0.331`, `clutchZ -0.269`, `ghostCount 3`; explosion completes at global
  progress ≈0.518 with `gearRotation` 25.13 = 8π. Headless caveat: the playwright browser's
  software-GL process can wedge or the quality ladder can degrade to poster
  mid-probe (canvas unmounts, telemetry freezes) — capture early, and
  restart the preview server after every rebuild before probing.
- Full method + failure log: vault
  `04-Projects/Portfolio-Site/2026-08-22-jgun-chapter1-gauntlet-and-capture-playbook.md`.

## 12. Known gaps (not animation bugs)

- No deploy/hosting config — the build is live nowhere (the real ship blocker).
- Concept A↔B site-relationship decision open (vault project-state).

## 13. Planned changes (owner-specified 2026-08-23; pass 3 = 2026-08-24)

1. **Explosion direction rework** — **IMPLEMENTED 2026-08-23** (see §5.1/§5.3):
   internals extract rearward out of the gearbox (−Z, past the removed
   handle) in a staggered five-stage ladder; all internals separate; only the
   output spindle exits the +Z snout. The old bbox-median two-stage split and
   its through-the-snout +Z offsets are gone.
2. **Rotational animation on planets and cages** — **IMPLEMENTED 2026-08-23**
   (see §5.4): `gearRotation` proxy channel drives carriers about the train
   axis at per-stage reduction ratios with planet counter-rotation on pins;
   the two-speed clutch shift animates first (`shift` channel, −0.015 m).
3. **Driveline-order ladder** — **IMPLEMENTED 2026-08-24** (see §5.3): the
   A000606 cage (P001849) is the third cage of five (between P003045 and
   P001837); handle/gearbox separation widened to 25 mm of air behind the
   clutch.
4. **Photoreal materials** — **IMPLEMENTED 2026-08-24** (see §5.5): PBR role
   system per Mark's render reference (`docs/torque-render.webp` +
   `docs/jgun-handle-gearbox-description.md`).
5. **Scroll pacing ×2** — **IMPLEMENTED 2026-08-24** (see §14): chapter
   sections 220vh → 440vh, stage windows remeasured (oryzo.ai reference).
6. **K000004 bearing extraction + display rotation turns** — **QUEUED** at
   repo TODO.md. NOTE: the queued K000004 slot math (offset −0.071 behind
   A000606) predates the ladder reorder and MUST be re-derived against the
   new §5.3 table before implementation.

Verification of both: `window.__telemetry` probes on vite preview (§11),
2026-08-23 — static exploded mode, mid-scrub, and full-scroll states all
asserted.

## 14. Multi-chapter stage orchestration (2026-08-24, orzo-style upgrade)

`src/scene/StageManager.tsx` wraps the hero in three scroll-keyed stages on
the fixed canvas. Stage state comes from **global scroll progress** via
`getScrollState()` inside `useFrame` (zero React re-renders); the windows
live in `src/scene/stages/stageWindows.ts`:

| Stage | Content | Fade in | Fade out |
|---|---|---|---|
| 0 — wrench (CH.01+02) | `TorqueWrenchHero` passed as children; exits by sinking (no material fade — the ghost system owns wrench opacity) | — (alpha 1 at top) | 0.535 → 0.575 |
| 1 — MSP enclosure (CH.03) | 5-layer composite-wall bounding-box placeholder (`ENCLOSURE_HALF` ≈ 0.14×0.10×0.19 m half-extents, camera-fit to the CH.03 keyframe) + `AirflowField` | 0.535 → 0.575 | 0.72 → 0.76 |
| 2 — M249 point cloud (CH.04) | Rejection-sampled scan points in two datum boxes | 0.72 → 0.76 | — (holds to end) |

Vertical travel ±0.5 m; cross-fades are smoothstep over the overlapping
windows; `visible=false` at alpha ≤ 0.001 so inactive stages cost nothing.

**Window provenance (remeasured 2026-08-24 after the scroll ×2):** chapter
sections doubled 220vh → 440vh the same day (Mark review — oryzo.ai-style
pacing; document ≈ 1800vh). Against that layout the hero timeline transits
global progress 0.20 → 0.518, `explodeFactor` reaches 1 at ≈0.518, the
CH.02→CH.03 chapter flip lands ≈0.74. The wrench therefore holds its fully
exploded pose for ≈0.017 of scroll (≈30vh — a real beat) before sinking at
0.535–0.575; S2→S3 stays at the mission's ~0.72 mark. Measured on the live
page (§11 method): at 0.52 alphas read [1, 0, 0] with the explosion fully
open (`explodeFactor 1`); at 0.555 alphas read [0.50, 0.50, 0].

### 14.1 CH.03 airflow field (`src/scene/stages/AirflowField.tsx`)

One draw call of shader-driven `THREE.Points` (12k full tier / 3.6k lite):
per-particle seeds live in the `position` attribute (geometry is
shader-displaced, `frustumCulled={false}`). The vertex shader advects each
particle along intake duct → helical engine-compartment sweep → exhaust
dissipation around the enclosure bounds, with curl-style turbulence whose
amplitude, advection speed and alpha all scale with `uFlow` — the
scroll-bound intensity ramping 0.575→0.72 (damped `1−e^(−4Δ)`). Colors run
cool cyan → warm amber along the route (the thermal read). Additive
blending, `depthWrite:false`, frozen (uniform alpha 0, no updates) whenever
the stage envelope is inactive or reduced-motion is set.

### 14.2 Telemetry

`window.__telemetry.stage` (additive, written by StageManager +
AirflowField frame loops): `active` (dominant stage index, −1 none), `alpha`
and `y` triples (wrench/enclosure/cloud), `flow` (0..1). Verified states,
2026-08-24 on a freshly restarted :4173 preview: progress 0 → `[1,0,0]`
camera at the CH.01 keyframe exactly; 0.54 → `[0.50,0.50,0]`; 0.64 →
`[0,1,0]`, `flow 0.5`, camera on the CH.03 keyframe; 0.90 → `[0,0,1]`,
`flow 0`, camera on the CH.03→CH.04 interpolation. Zero console errors;
canvas live at every probe.

### 14.3 Known gaps (owner decisions pending)

- **Camera keyframes NOT retargeted** (mission Step 1 gate — awaiting
  explicit confirmation): CH.03/CH.04 keyframes still aim at wrench geometry;
  placeholders were sized to fit them instead. Retarget once the real MSP /
  M249 GLBs land.
- The CH.04 CAD dissolve (§6) still targets the (now sunken) wrench, not the
  M249 stage — it animates an invisible rig at chapter 3. Rebind when the
  M249 asset + camera retarget are decided.
- Real MSP enclosure / M249 Draco GLBs do not exist yet (owner: Mark) — the
  procedural placeholders stand in.
- The parallel-session WIP (`src/components/canvas/StageManager.tsx`) is
  untouched and unwired; the orchestrator lives at `src/scene/StageManager.tsx`.
  That WIP file also breaks `tsc` (unused `fade`) — `npm run build`'s tsc gate
  fails on it until the parallel session resolves or it is removed.
