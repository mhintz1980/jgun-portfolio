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

**Opening treatment (JG-014, 2026-08-27):** CH.01/CH.02 render as
TRANSPARENT top-left edge captions (no fill, no backdrop blur) so the
ring-switch and extraction mechanisms are never covered; the gearbox case
study sits behind an on-demand `[ + CASE STUDY ]` disclosure, and the active
mechanical beat carries a bottom-left edge caption (one at a time): groove
labels 0.04–0.18, driveline-order ladder 0.19–0.42, rear-LCD readout
0.44–0.51. CH.03/CH.04 keep the milestone-5 glass cards.

## 4. Camera (`src/scene/CameraRig.tsx`, `CAMERA_PATH`)

The main path retains four world-space keyframes across three stations:

| Keyframe | Position (m) | Target (m) | FOV |
|---|---|---|---|
| CH.01 | (0.32, 0.16, 0.42) | (0, 0, 0) | 42° |
| CH.02 | (0.60, 0.08, 0.05) | (0, 0.015, -0.07) | 36° |
| CH.03 | (33.662357, 2.8, -0.010622) | (28, 1.2, -6.35) | 36° |
| CH.04 | (56.43, 0.65, -9.62) | (56, 0, -12) | 35° |

`PATH_SEGMENTS` is unchanged by JG-026: `0.000–0.525`, `0.525–0.600`,
`0.600–0.720`, and `0.720–0.760`. `baseAt(progress)` owns their
interpolation, including the station-2 arc.

Global `progress` selects a segment between adjacent keyframes; local `t` is
smoothstep-eased, and position/target/FOV are then exponentially damped
(`1 - e^-6·Δ`, Δ clamped to 0.1 s) so fast scrolling never snaps. Pointer
parallax is layered on the goal position (±0.03 x, ±0.02 y) before damping;
the hero object adds its own object-space parallax. The six-frame pulse shake
and the 0.3°/s scroll-rest orbit are retained. Near/far are `0.005 / 150`.

During global `0.000–0.120` the sheet owns the frame. The camera begins
directly above the sheet in a registered orthographic side elevation looking
along the model's +Y; its projection, orientation and roll blend into the
CH.01 perspective across the intro, and the intro releases to `baseAt(0.12)`
in position, target and FOV (measured release delta 5.55e-17 m). The camera's
up vector starts on the sheet's printed-up axis — world −X — so the print
reads right-way-up from the moment it appears until the model has left it;
pointer parallax is suppressed while the sheet is being read.

Reduced motion holds the registered drawing at normalized intro phase `.20`
(global `.024`), fully focused and without scroll response. The camera layer
itself is NOT deleted in that tier: it damps to the pinned goal and settles,
measured residual ≤ 1e-6 across two reads
([JG-026 verification](../../work/evidence/JG-026-b1-b2-verification.md)).

### 4.1 Scroll pacing (`src/scene/drawing/introTimeline.ts`, `ScrollRig.tsx`)

Raw document scroll and the progress axis are NOT the same number. Owner
pacing ruling 2026-09-05: the intro needed several times more animation time
without taking scroll from any other chapter, so `pacedProgress()` stretches
the intro's `0.000–0.120` of progress over `INTRO_SCROLL_SHARE = 0.30` of the
document and the remaining `0.120–1.000` over the other 0.70, with a C1 blend
of half-width 0.025 raw at the junction. Every downstream window in this repo
is authored on the progress axis and is therefore unchanged; each downstream
chapter keeps its progress span exactly and gains absolute distance.

Document height is 3120vh (scroll distance 3020vh), up from 2020vh/1920vh.
Section track heights live in `SCROLL_TRACK_VH` (`Chapters.tsx`) and are set
so `[data-chapter="1"]` — the element the hero GSAP ScrollTrigger measures —
still opens at paced 0.17703 and closes at 0.45843, within 1e-4 of the window
the retained CH.02 timeline was authored and verified against.

## 5. The hero animation timeline (`src/scene/TorqueWrenchHero.tsx`)

One GSAP timeline, scrubbed (`scrub: 0.6`) across the CH.02 section's full
pass through the viewport (`trigger: '[data-chapter="1"]'`,
`start: 'top bottom'`, `end: 'bottom top'`), animating a plain proxy object
(`{ spin, ghost, explode, gearRotation, shift }`) so GSAP never fights the R3F
render loop. `useFrame` applies the proxy each frame:

| Channel | Proxy timeline time | Effect |
|---|---:|---|
| spin | 0.12 → 0.47 | hero yaw to `spin · π · 0.85` + pointer parallax (±0.08 x, tilt ±0.05 y) |
| gearRotation | 0.12 → 1.02 | epicyclic sweep 0 → 8π, plus the wall-clock idle accumulation of §5.4 |
| ghost in | 0.27 → 0.47 | opacity 1 → 0.15; depth-write disabled below 0.5 |
| explode | 0.47 → 0.97 | unchanged rear-extraction ladder in §5.3 |
| ghost out | 0.54 → 0.79 | opacity returns to 1 while the stages extract |

CH.01 clutch cues alone use `remapHeroProgress(p) = .12 + p/3` on the
original `0≤p≤.18` interval. It maps that opening interval to `.12–.18`;
it is not a global re-windowing function and must not be applied downstream.

### 5.0 JG-026 B1/B2 engineering drawing and extraction (2026-09-05)

`snapshotDrawing()` consolidates the rest geometry of `Default.glb` once.
`renderDrawing()` produces the print with a hidden-line pass: opaque depth
occluders plus depth-tested 22° crease edges, then depth-discontinuity
silhouettes. Occluded and back-facing lines never enter the pass — they fail
the opaque scene's depth test. `EngineeringDrawingOverlay` supplies only
generated SVG annotation; it contains no authored model art.

**Sheet.** ANSI C proportion 22:17 (owner ruling 2026-09-05), landscape on
every viewport, 0.905882 × 0.700 m in world units. Desktop fits it to 92% of
viewport height, which puts it at 66.97% of width on 16:9 and leaves the
backdrop wash in the margins either side. Narrow viewports (390 × 844) cannot
read a fitted C sheet, so the intro becomes a scroll-driven camera push-in and
pan across it (`sheetCamera.ts`): whole sheet → title block → view block →
settle on the primary elevation before the pulse.

**Projection.** True third angle. The primary side elevation is 1:1 — that is
what lets the 3D model register to a view the code projected — and the plan,
end and section views are derived from the primary frame by unfolds about
shared axes, so alignment is structural: plan above and section below share
the elevation's vertical centreline, the end view shares its horizontal
centreline (measured deviation 0.000000 on both viewports). Section A–A is a
bottom half-section on the horizontal cutting plane through model X = 0; its
cutting-plane line and arrows are drawn on the parent elevation, and the view
sits below it, which is where third angle puts a view of the underside.

**Orientation.** `SIDE_ROTATION` maps model → sheet as `(-z, -x, y)`: the view
direction is unchanged, but the in-plane orientation is rotated 180° from the
first attempt. That puts the tool grip-down on its own elevation and puts the
sheet's printed-up axis on world −X, which is what makes the print readable
from the CH.01 hero camera. `SHEET_ROTATION` is forced to be this matrix's
inverse — that identity is what lands the extracted model exactly on world
identity at the handoff (measured residual 5.5e-17).

| Owner phase | Normalized intro | Global interval | Effect and fallback |
|---|---:|---:|---|
| 1 — focus rack | 0.00 → 0.14 | 0.0000 → 0.0168 | Scene-plane focus rack; full/lite. Reduced holds phase .20 fully focused. |
| RESERVED — opening text | 0.14 → 0.30 | 0.0168 → 0.0360 | Reserved for JG-026 Item 6. Nothing else is authored here. |
| 2 — ordered excitation | 0.30 → 0.56 | 0.0360 → 0.0672 | Traced profile pulse and PBR activation; full/lite. Reduced omits pulse. |
| 3 — spatial extraction | 0.56 → 0.88 | 0.0672 → 0.1056 | Local +Z lift, pitch/yaw, camera orbit and lighting; full/lite. |
| 4 — detachment / shockwave | 0.88 → 0.96 | 0.1056 → 0.1152 | Solved vertex crossing triggers a single plane-local pass; full only. |
| 5 — print fade | 0.96 → 1.00 | 0.1152 → 0.1200 | Print fades only after the front has cleared the sheet. |

Scroll time and pose time are separate axes. `introPoseTime()` reparameterizes
one onto the other so pacing changes never re-solve the geometry:
`relativePose()` and the 44-step bisection in `solveExtraction()` still work on
the pose axis where the extraction starts at 0.4. No phase boundary triggers
the wave — `solveExtraction()` finds the actual lowest-transformed-vertex
Z = 0 crossing and its contact point. Current evidence reports crossing
`0.8888459503339448`, contact Z `-8.3e-15 m`, travel `0.22 m`, identical on
both viewports; these are revision-specific, not constants to hand-pick.

**Shockwave.** Front reach 0.78 m at wave time 1 against a 0.650 m far-corner
distance from the contact point, radial attenuation `exp(-1.1 r)`, temporal
`exp(-1.4 t)`, amplitude 0.022 m — one pass out, then done. The print is held
fully opaque until the front has crossed (measured opacity 1.000000 at every
frame with wave time < 1).

Reduced motion is the static registered phase-.20 frame with no lift or wave.
Lite keeps focus, excitation and lift but omits the plane displacement.
Poster retains the original DOM engineering poster. The canonical part
identities and every ladder/rotation value in §§5.1–5.4 are unchanged.
Mark's `?chapter=0` visual ruling is still open.

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
| bearing ring | K000004 — thrust support directly behind the A000606 cage (⌀58 × 7 mm, rest z ≈ [−0.058, −0.051]); own extraction unit since pass 3 |
| housing | P000245 outer shell — static, never explodes |
| untagged | static remainder — empty since pass 3 (K000004 was the gearbox's last untagged part; the bucket stays as a defensive fallback) |

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
**⚠️ Regression (measured 2026-08-25, pre-dates pass 3 Track B):**
`ghostCount` reads **0** at repo head — `housingMeshSet` ends up empty, so
the CH.02 fade loop no-ops and the housing stays solid (the commanded
`ghostOpacity` still reaches 0.15). Reproduced with the Track B changes
stashed; introduced by a pass-4 commit. P000245 carries no housing-named
ancestor, so ghosting hinges entirely on the largest-gearbox-child bbox
heuristic (§5.1) — suspects: bbox-volume competition or matrixWorld
staleness at build time. OPEN — route to the pass-4 owner.

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
out) → P003045 (stage 3) → P001849 (A000606) → K000004 (bearing ring) →
P001837 (stage 2) → P001836 (stage 1, furthest back). Keyed by part
numbers, never stage names.

Magnitudes are a clearance-derived ladder measured from JSON-chunk rest
spans (`.scratch/measure-spans.mjs`, validated against the 08-24 handoff
anchors): first cage clears the housing rear face (z = −0.074) by ≥14 mm,
adjacent exploded units keep ≥15 mm gaps, and the handle backs off with
25 mm of air behind the clutch (widened from 14.5 mm in the same review so
the extraction reads with generous spacing).

**Pass 3 (2026-08-25) — K000004 insertion:** the bearing ring (measured
rest span z [−0.0580, −0.0510] from role-map.json: center −0.0545, ⌀0.058 ×
7 mm) parks directly behind A000606 at a 15 mm gap; honoring the ≥15 mm gap
on its rear side too (15 + 7 + 15 mm where only 16 mm existed) shifts
stage 2, stage 1, clutch, and handle ~22 mm further back. Units ahead of
the bearing are untouched.

**JG-026 synchronized ladder version (2026-09-05):** the numeric offsets in
this table are unchanged. Timing follows §4.1's pacing map, §5's retained GSAP
timeline and §5.0's intro. The same unchanged ladder is recorded in both
READMEs and in the skills registered in
[`agent-skills.md`](../agent-skills.md), which must accompany any
behavior/table change in the same commit.

| Unit | Offset | Exploded span (m, model frame) |
|---|---|---|
| output spindle | +0.050 | ≈ [+0.043, +0.102] (through snout) |
| gearbox Stage 4 | −0.099 | ≈ [−0.127, −0.088] (first out; 14 mm air) |
| gearbox Stage 3 | −0.142 | ≈ [−0.184, −0.143] |
| gearbox Stage 5 (A000606) | −0.177 | ≈ [−0.233, −0.200] (third in line) |
| bearing ring (K000004) | −0.197 | ≈ [−0.255, −0.248] (15 mm behind A000606) |
| gearbox Stage 2 | −0.230 | ≈ [−0.297, −0.271] |
| gearbox Stage 1 | −0.255 | ≈ [−0.334, −0.313] |
| clutch (static + sliding) | −0.291 | ≈ [−0.432, −0.349] (sliding −0.015 further at shift 1) |
| handle assembly | −0.354 | ≈ [−0.587, −0.457] (25 mm air behind clutch) |

Exploded stack span ≈ 0.69 m (output front +0.102 to handle rear −0.587) —
the handle's tail can kiss the frame edge at full explode under the CH.02
lateral camera (22 mm deeper than the pre-pass-3 −0.564 tail); widening
that camera remains an open tuning decision.

Applied as `basePositions` + offset each frame, so it composes with (and
fully opens in) exploded mode: `explode = max(anim.explode, mode ===
'exploded' ? 1 : 0)`.

### 5.4 Epicyclic gear rotation + clutch shift & speed indicator grooves

The proxy's `gearRotation` channel (0 → 8π across CH.02 timeline — spin-up
AND spin-through-extraction) drives kinematically-staged rotation via
`ROTATION_TURNS` (`caseStudies.ts`, retuned JG-031): the sweep is normalized 0..1
and each carrier completes its display turns — `carrier rotation.z =
(gearRotation / 8π) · ROTATION_TURNS[stage] · 2π`.

JG-031 display turns map to the physical visual driveline order from motor to snout
(Stage 1 [P001836] → Stage 2 [P001837] → Stage 5 [A000606] → Stage 3 [P003045] → Stage 4 [P003047]),
with `ROTATION_TURNS = { stage1: 8, stage2: 5.2, stage5: 3.38, stage3: 2.2, stage4: 1.43 }`.
Each successive physical cage in space turns at ~65% of the preceding cage's speed:
- Pos 1 (Stage 1): 8.0 turns
- Pos 2 (Stage 2): 5.2 turns (65% of Pos 1)
- Pos 3 (Stage 5, A000606): 3.38 turns (65% of Pos 2)
- Pos 4 (Stage 3): 2.20 turns (65% of Pos 3)
- Pos 5 (Stage 4): 1.43 turns (65% of Pos 4)

This enforces strictly monotonic reduction across the physical visual assembly
from motor to snout, eliminating mid-stack speed jumps or reversals while ensuring
the final reduction stage completes >1.0 turn (1.43 turns) so motion remains clearly
perceptible during quick scroll scrub.
`GEAR_RATIOS` remains the kinematic reference; each planet
`rotation.z = −carrier display angle · 3.5` (counter-rotation on its pin;
planet groups are carrier children, so they also revolve with it).

**Clutch Shift & Speed Indicator Grooves (JG-026 opening remap):**
- The original `.05/.10/.12/.17` cues map to global
  `.1366666667/.1533333333/.1600000000/.1766666667`.
- **Ring switch P003068:** `.1366666667–.1533333333` travels +9.525 mm
  along P000420's cam with +120° rotation; `.1533333333–.1600000000`
  holds; `.1600000000–.1766666667` returns to its base pose.
  P000724/P000297 retain their separate `shift × -0.015 m` fork travel.
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
pair (`../references/media/torque-render.webp` + `../domain/jgun-handle-gearbox.md`):
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

## 7. Hotspots & GD&T Annotations (`src/scene/Hotspots.tsx`, `HOTSPOTS`)

Seven annotated occurrences (`ROTOR-1`, `AIR MOTOR HOUSING-MACHINED-1`,
`FLANGE-1`, `P000245-1`, `MSP430F6726IPN-1`, `MANOMETER LCD BK11356-1`,
`Tenergy LiPo Battery 3.7 V-1`), anchored by matching `role-map.json`
occurrence names (316 entries with world-space bbox centers — the pipeline's
authoritative anchor source). Occurrence matching is exact-first with a
prefix-normalizing fallback: entries may carry an exporter-added
`"occurrence of "` prefix, which is stripped (case-insensitive) only when no
exact row exists, so anchors never shift when both forms are present.

**Print-Authentic GD&T Conventions (ASME Y14.5 / JG-014, repaired 2026-08-27):**
- **Orthographic Alignment**: All datum flags (`[-A-]`, `[-B-]`) and feature control frames are strictly horizontal and 2D-aligned (zero CSS `perspective` or 3D rotation tilts — probe-verified across all hotspot buttons and ancestors).
- **Segmented Feature Control Frames**: bordered cells, but the cell vocabulary is restricted to the owner-approved HUD callout strings (`RUNOUT < .0015" TIR`, `POSITION ⌖ .002" @ MMC`, `FLATNESS < .0008"`) plus drawing-verified datum references (P000420 controls terminate in datum A). Literal glyph transcription from the drawing PDFs requires crop verification at readable scale (`domain/gdt-annotation-style.md`) — the invented symbols (`↗`, `⏢`, `⌀.002 Ⓜ`) used briefly in c73018b were removed for violating that rule.
- **Measured Distinct Anchors (bbox-face derived, role-map spans)**: `ROTOR-1` terminates on its rear vane/inlet face (z −0.196 = center −0.1645 − half-extent 0.0315) and `AIR MOTOR HOUSING-MACHINED-1` (Datum A) on its rear bore face (z −0.1835) — 12.5 mm apart. Both raw bbox centers sit at [0, 0, −0.1645] (0.1 mm apart) — the pre-JG-014 duplicate-anchor defect. `FLANGE-1` exists twice in role-map (mount face z −0.1396 AND rear cap z −0.1895); `pickNear` selects the mount-face occurrence deterministically.
- **Anchor explosion tracking**: every handle-assembly occurrence rides `EXPLODE_OFFSETS.handle` (−0.354) — the pre-repair literals (−0.331/−0.269) predated the pass-3 ladder and left anchors 23 mm off their parts at full explode.
- **Window-scoped visibility**: a hotspot may declare a `window` (global-progress range) that overrides chapter visibility — the LCD hotspot accompanies the rear-LCD orbit dwell (LCD_REVEAL_WINDOW), which straddles progress where the DOM chapter trigger already reports chapter 2. Window-scoped hotspots use a tighter Html `distanceFactor` (0.19 vs 0.38) because the dwell camera runs ~2× closer (badge otherwise scales to ~620 px and leaves the viewport).
- **Dev-only guard**: resolved anchor pairs closer than 8 mm (rest pose) `console.error` in development — the measured face anchors keep every pair ≥ 12.5 mm apart.
- **Accessibility**: Each is a real `<button>` with `aria-pressed`, native Enter/Space activation, high-contrast cyan focus-visible ring, and Escape closes the detail panel. No role map → no hotspots (graceful no-op).

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
- **lite** — the dissolve shader is off (opacity-ramp fallback). JG-026 keeps
  drawing focus, ordered pulse and extraction, and omits plane displacement.
- **poster** — no canvas at all; `StaticPoster` + native scroll behind the
  always-DOM narrative. Entered on: no WebGL2, context loss, or sustained
  decline in lite.

DPR staircase 2 → 1.5 → 1.25 → 1 (clamped to device ratio) walks down while
`PerformanceMonitor` sees < 45 FPS and back up with headroom (bounds
[45, 60], thrash guard after 3 flip-flops). Only DPR recovers; tiers never
upgrade at runtime.

`prefers-reduced-motion` is orthogonal to tier. JG-026 pins the drawing
and live model to registered normalized phase `.20` (global `.024`),
fully focused. Lenis/ScrollTrigger do not mount; pulse, extraction,
shockwave, camera motion, gear/shift motion and dissolve are skipped.
The original DOM poster is retained when the canvas is unavailable.

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
  progress ≈0.518 with `gearRotation` 25.13 = 8π. Pass-3 Track B fix values
  (2026-08-25, K000004 + display turns): `stageZ
  [-0.255, -0.230, -0.177, -0.142, -0.099]`, `window.__rig.bearing.position.z
  -0.197` (merged bbox 0.058 × 0.058 × 0.007 at z[−0.058, −0.051] — K000004
  geometry confirmed in the unit), `handleZ -0.354`, `clutchZ -0.291`,
  `stageRot [50.265, 14.074, 9.425, 6.283, 3.142]` = display turns {8,
  2.24, 1.5, 1, 0.5} × 2π (the stageRot-to-sweep ratio holds at every
  probed scroll point, not just the endpoint), `planetRot -175.929` = −3.5 ×
  stage 1 display angle; `gearRotation` still 8π exactly at `explodeFactor`
  1, progress ≈0.52. `ghostCount 0` at all probes — pre-existing pass-4
  regression (§5.2), not introduced by this pass. Headless caveat: the playwright browser's
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
   system per Mark's render reference (`../references/media/torque-render.webp` +
   `../domain/jgun-handle-gearbox.md`).
5. **Scroll pacing ×2** — **IMPLEMENTED 2026-08-24** (see §14): chapter
   sections 220vh → 440vh, stage windows remeasured (oryzo.ai reference).
6. **K000004 bearing extraction + display rotation turns** —
   **IMPLEMENTED 2026-08-25** (see §5.1/§5.3/§5.4): the queued slot math
   (offset −0.071 behind A000606) was stale — it predates the ladder
   reorder and would have parked the ring inside stage 1's exploded span.
   Re-derived against the measured ladder: K000004 = −0.197 (15 mm behind
   A000606), with stage 2 / stage 1 / clutch / handle shifted to
   −0.230 / −0.255 / −0.291 / −0.354 to keep the ≥15 mm gap rule.
   `ROTATION_TURNS` = { 8, 2.24, 1.5, 1, 0.5 } scaled the scroll
   scrub's carrier display angles (planets counter-rotate ×3.5).
7. **Internal cage rotation tuning (65% stage progression)** —
   **IMPLEMENTED 2026-09-07 (JG-031)** (see §5.4): retuned `ROTATION_TURNS`
   to { stage1: 8, stage2: 5.2, stage5: 3.38, stage3: 2.2, stage4: 1.43 }, mapped to the
   physical visual driveline order from motor to snout (P001836 → P001837 → A000606 →
   P003045 → P003047). Each successive physical cage along the wrench now turns at ~65%
   of the preceding cage's speed (strictly monotonic decrease from 8.0 down to 1.43).
   The slowest physical stage at the snout completes 1.43 turns across the sweep (up from 0.5),
   providing clearly perceptible animation during fast scroll scrub without mid-stack reversals.

Verification of both: `window.__telemetry` probes on vite preview (§11),
2026-08-23 — static exploded mode, mid-scrub, and full-scroll states all
asserted; JG-031 verified via `verify-jg031-gear-rotation.mjs`.

## 14. Multi-chapter stage orchestration (2026-08-24, orzo-style upgrade)

`SpatialWorld` gates the three station groups and `SpatialRig` publishes
stage telemetry from global scroll progress. JG-026 leaves main's windows
in `src/scene/stages/stageWindows.ts`; it does not add .020 to later beats.

| Stage | Content | Fade in | Fade out |
|---|---|---|---|
| 0 — wrench (CH.01+02) | `TorqueWrenchHero`, drawing intro and retained mechanism | — (active at top) | 0.525 → 0.565 |
| 1 — MSP enclosure (CH.03) | `Station2_AcousticEnclosure`, airflow and acoustic fields | 0.525 → 0.565 | 0.720 → 0.760 |
| 2 — M249 (CH.04) | `M249Stage` | 0.720 → 0.760 | — (holds to end) |

**Window provenance:** document layout supplies the same CH.02 viewport
transit used by main's settled GSAP timeline (historically measured
approximately global `.177–.458`; the current runtime measures the DOM).
JG-026 samples its .9-duration proxy directly. The LCD window is restored
to `.420–.525`, with dwell `.458–.488`. Wrench/enclosure transition is
`.525–.565`, and enclosure/M249 transition is `.720–.760`.
Camera segments remain `0–.525/.525–.600/.600–.720/.720–.760`.

The opening `0–.120` drawing window and early clutch remap do not authorize
changes to the later ladder, LCD or station boundaries. Final runtime
comparison against main and Mark's visual ruling are still required;
see [JG-026 verification](../../work/evidence/JG-026-b1-b2-verification.md).

### 14.1 CH.03 airflow field (`src/scene/stages/AirflowField.tsx`)

One draw call of shader-driven `THREE.Points` (12k full tier / 3.6k lite):
per-particle seeds live in the `position` attribute (geometry is
shader-displaced, `frustumCulled={false}`). The vertex shader advects each
particle along intake duct → helical engine-compartment sweep → exhaust
dissipation around the enclosure bounds, with curl-style turbulence whose
amplitude, advection speed and alpha all scale with `uFlow` — the
scroll-bound intensity ramping 0.565→0.72 (damped `1−e^(−4Δ)`). Colors run
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
