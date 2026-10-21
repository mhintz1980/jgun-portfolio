# Independent WebGL Architecture Review & Proposal (2026-10-16)

- **Workspace**: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`
- **Branch / HEAD**: `torque-wrench/rebuild` @ `1d66ff2b91e8a55d21ea1afb401a3ad995553f4a` (`1d66ff2b JG-038 creative pass: drafting fixes, cavern material, legacy mechanism camera`)
- **Boundary**: Read-only investigation and architecture proposal. Application source, assets, dependencies, configuration, agent definitions, and existing plans are untouched.
- **Evidence folder**: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\webgl-review-2026-10-16\evidence\` (`runtime-telemetry-probe.json`, `01-intro-registered.png` through `07-ch04-station3-m249.png`)

---

## 1. Independent Baseline of the Actual Render Pipeline and Invariants

### 1.1 Installed Stack (verified from `package-lock.json` and `node_modules/*/package.json`)

| Package | Installed Version | Evidence Location |
|---|---|---|
| `three` | `0.185.1` | `package-lock.json:3501`, `node_modules/three/package.json:3` |
| `@react-three/fiber` | `9.7.0` | `package-lock.json:914`, `node_modules/@react-three/fiber/package.json:3` |
| `@react-three/drei` | `10.7.8` | `package-lock.json:874`, `node_modules/@react-three/drei/package.json:3` |
| `@react-three/postprocessing` | `3.1.1` | `package-lock.json:962`, `node_modules/@react-three/postprocessing/package.json:3` |
| `postprocessing` | `6.39.4` | `package-lock.json:3242`, `node_modules/postprocessing/package.json:3` |
| `gsap` | `3.15.0` | `package-lock.json:2538` |
| `lenis` | `1.3.26` | `package-lock.json:2695` |
| `troika-three-text` | `0.52.5` | `package-lock.json:3583` |

### 1.2 Three Distinct WebGL Worlds in the Repository

The MPA configuration in `vite.config.ts:9-19` and `src/shared/pages.ts:68-78` builds three separate entry documents with distinct WebGL pipelines:

1. **Root Portfolio Multi-Station World (`index.html` -> `src/main.tsx` -> `src/App.tsx` -> `src/scene/SceneCanvas.tsx`)**:
   - **Renderer & Canvas** (`src/scene/SceneCanvas.tsx:28-37,411-430`): Mounts `<Canvas dpr={DPR_STEPS[step]} gl={{ antialias: true, stencil: true, powerPreference: 'high-performance' }} camera={{ fov: 42, near: 0.005, far: 150, position: [0.32, 0.16, 0.42] }}>`. Sets `gl.localClippingEnabled = true` (line 423).
   - **Post-Processing Composer** (`src/scene/PostProcessingComposer.tsx:181-230`, `src/scene/sectionRenderPass.ts:5-8`): Mounts `<EffectComposer multisampling={0} stencilBuffer renderPass={createSectionRenderPass}>` when `tier !== 'poster' && !reducedMotion`. Inside `@react-three/postprocessing@3.1.1` (`node_modules/@react-three/postprocessing/src/EffectComposer.tsx:193-194,341-343`), `frameBufferType` defaults to `HalfFloatType` (`RGBA16F`) and `gl.toneMapping` is forced to `NoToneMapping` (`0`) while `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />` executes in the merged `EffectPass`.
     - `full` tier: `ChromaticAberration` (max UV offset `0.0018`) + `DepthOfField` (`resolutionScale={0.5}`, active only during the opening focus rack `t < 0.34`) + `Bloom` (`luminanceThreshold={0.6}`, `luminanceSmoothing={0.08}`, `intensity` `0.25` rest / `0.65` transition peak, `mipmapBlur`) + `ToneMapping(ACES_FILMIC)`.
     - `lite` tier: `Bloom` + `ToneMapping(ACES_FILMIC)` only (skips `ChromaticAberration` and `DepthOfField`).
     - `poster` tier or `reducedMotion`: `App.tsx:40-51` does not mount `SceneCanvas` or `ScrollRig` at all (per owner `posters-throughout` policy, `src/state/qualityStore.ts:15-20`), rendering `StaticPoster` in pure DOM with zero Three.js/GLB downloads.
   - **Lighting & IBL** (`src/scene/SceneCanvas.tsx:125-260`):
     - `RoomEnvironmentIbl` (lines 125-146) bakes `RoomEnvironment` once in `useEffect` via `pmrem.fromScene(room, 0.04)` into a `768 x 1024` `HalfFloatType` CubeUV texture (`mapping: 306`) and assigns `scene.environment = target.texture`, `scene.environmentIntensity = 1.0`.
     - Global `<ambientLight intensity={0.25} />` (line 461) + `StudioRig` (lines 215-260): `keyRef` directional `1.7` at `[1.5, 2, 1]`, `sweepRef` intro directional at `[-1.2, 1.6, 0.8]`, `fillRef` directional `0.6` (`#7dd3fc`) at `[-2, 1, -1.5]`, `spotRef` `1.1` at `[0, 1.2, -0.6]` (+0.3 rim nudge at `0.49-0.525`).
     - During Station 2 (`STAGE_TRANSITIONS.wrenchOut = [0.525, 0.565]` to `enclosureOut = [0.720, 0.760]`), `StudioRig` eases global punctual lights to `STUDIO_STATION2_SCALE = 0.25` and `scene.environmentIntensity` to `STUDIO_ENV_STATION2 = 0.35` (lines 204-208, 228-249), while Station 2 (`src/scene/SpatialWorld.tsx:108-110`) adds its own local lights (`directionalLight` `0.55` and `0.25`, `pointLight` `0.35`) and Station 3 (`SpatialWorld.tsx:128-130`) adds local lights (`2.2`, `1.0`, `1.5`).
   - **Consolidation & Rig Invariants** (`src/scene/rig/nodeRoles.ts:191-640`, `src/scene/rig/materials.ts:30-472`):
     - Consolidates `Default.glb` (10,674 raw primitives across 101 meshes / 345 nodes) by `(unitKey x MaterialRole x ghost)` into **59 merged meshes** (`830,908` vertices, `841,039` triangles) cached on `root.userData.wrenchRig`.
     - **Ghost set**: `housingMeshSet` tags `P000245` (`nodeRoles.ts:245,322-333`), producing `ghostMaterials.size = 1` on the merged housing mesh (resolving the older `ghostCount = 0` note in `animation-spec.md:481`). In `TorqueWrenchHero.tsx:324-328`, `ghostOpacity` lerps `1 -> 0.15` and sets `material.depthWrite = material.opacity > 0.5`.
   - **Camera, Scroll & Inspection Lease** (`src/scene/CameraRig.tsx:163-599`, `src/scene/ScrollRig.tsx:20-98`, `src/scene/inspection/renderLease.ts:29-112`):
     - `ScrollRig` ticks `new Lenis({ duration: 1.1, smoothWheel: true })` from `gsap.ticker` with `lagSmoothing(0)` and writes `pacedProgress(raw)` into `scrollStore`.
     - `CameraRig` is the sole camera writer across all narrative stations, the orthographic-to-perspective intro blend (`sheetCamera.ts:114-147`, `CameraRig.tsx:558-576`), and discrete inspection entry/restore (`CameraRig.tsx:194-252`).
     - `captureRenderLease` (`renderLease.ts:29-112`) snapshots and overrides `scene.background`, `scene.fog`, `scene.environmentIntensity`, `gl.toneMappingExposure`, and `renderOwnership.post` (`bloom`, `aberration`, `dof`) during Ring (`ringRuntimeCore.ts:243`) and Input Shaft (`shaftRuntime.ts:183`) inspections, restoring them bit-for-bit on exit.

2. **Private `/torque-wrench/` Rebuild World (JG-038, `torque-wrench/index.html` -> `src/scene/torque-wrench/Scene.tsx` -> `BackgroundWorld.tsx` + `RuntimeWorld.tsx`)**:
   - Uses Three's native `three/examples/jsm/postprocessing/EffectComposer.js` (not `@react-three/postprocessing`) with a custom `HalfFloatType` `WebGLRenderTarget` configured to match `nativeSamples` (`4x` MSAA in `full` tier, `0` in `lite` tier, `BackgroundWorld.tsx:101-116`).
   - Enforces `FULL_DPR_CAP = 1.5`, `LITE_DPR_CAP = 1.0`, and `FULL_PIXEL_LIMIT = 2560 * 1440` via `computeRenderBudget` (`src/scene/torque-wrench/renderBudget.ts:13-16,52-92`) and overrides `renderer.setSize` in `createPrivateRenderer.ts:20-28`.
   - Runs `RenderPass` -> `ShaderPass(TorqueContinuousGrade)` (continuous `exposure`, `saturation`, `vignette` from `postProfile.ts:7-10` + 32x32 periodic Gaussian void-ranked blue-noise dither from `blueNoise.ts:7-33` scaled by local sRGB slope at `BackgroundWorld.tsx:55-58`) -> `OutputPass`.
   - Shares `buildWrenchRig` (`nodeRoles.ts`), `roleMaterial` (`materials.ts`), `bakeSheet`, `createRingRuntimeCore`, and `createShaftRuntime` with the root world.

3. **Standalone `?study=rl300` / `/quiet-machine/` World (`src/scene/rl300/QuietMachineScene.tsx`)**:
   - Uses `gl.toneMapping = ACESFilmicToneMapping`, `gl.toneMappingExposure = 0.85`, `scene.environmentIntensity = 0.35`, `<fog args={['#101b24', 12, 30]} />`, and stencil section caps (`SectionCaps.tsx`, `AirRibbons.tsx`).

---

## 2. Five-Row Verdict Table

| Hypothesis | Verdict | Decisive Evidence | Corrected Mechanism | Recommended Next Experiment or Action |
|---|---|---|---|---|
| **A. Environment & lighting** (*RoomEnvironment + metalness + envIntensity 0.25-0.35 cause plastic metals & compensate for St.2 clipping; use studio HDRI + continuous env/exposure*) | **Partly supported** | 1. `SceneCanvas.tsx:134,204-208,249` and runtime telemetry (`runtime-telemetry-probe.json`) prove `scene.environmentIntensity = 1.0` across all JGun beats (`p = 0.15, 0.35, 0.47, 0.85`); `0.25` / `0.35` only apply during Station 2 (`p in [0.525, 0.760]`).<br>2. **Uncovered bug**: In `node_modules/three/src/renderers/WebGLRenderer.js:2694-2698` and `WebGLMaterials.js:403-409`, when `material.envMap === null` and `scene.environment !== null`, Three.js r185 overwrites `m_uniforms.envMapIntensity.value = scene.environmentIntensity`, making every per-role `envMapIntensity` in `materials.ts:233-453` (`0.95-1.30`) and `recolorAllowList.ts:39,48` (`0.70-0.75`) a **dead no-op**.<br>3. `RoomEnvironment` (`RoomEnvironment.js:23-57`) has 6 flat-shaded white/grey boxes with no softbox gradient roll-off or dark negative-fill contrast. | JGun metals look uniform in CH.02 not because `environmentIntensity` is `0.25-0.35`, but because (a) Three.js r185 ignores per-material `material.envMapIntensity` when `material.envMap` is `null`, forcing all 23 roles to identical `1.0` IBL gain, (b) `RoomEnvironment` lacks studio softbox gradients and negative fill, and (c) global directional lights stay world-fixed while the camera orbits laterally in CH.02. External HDRI files add network/decode latency to an already tight 10 s startup budget (`ac-final-checkpoint-20261016.md:18`). | 1. Fix the r185 `envMapIntensity` no-op by binding `material.envMap` or multiplying a per-role `uRoleEnvGain` uniform inside `materials.ts:462` `onBeforeCompile`.<br>2. Upgrade the procedural scene passed once to `PMREMGenerator.fromScene()` with gradient studio softboxes + negative fill (0 network bytes, same `768x1024` `HalfFloatType` PMREM budget). |
| **B. Anti-aliasing** (*canvas `antialias: true` ineffective with composer `multisampling={0}` and no AA; use 4x MSAA or SMAA + DPR cap 1-1.5*) | **Supported** *(on root route; already implemented in `/torque-wrench/`)* | 1. Root `SceneCanvas.tsx:413` sets `antialias: true` (default FBO `SAMPLES = 4`), but `PostProcessingComposer.tsx:196` mounts `<EffectComposer multisampling={0} stencilBuffer>`, allocating offscreen `RGBA16F` FBOs with `samples = 0` (`postprocessing.js:1278`) and no SMAA/FXAA pass.<br>2. **Uncovered Bug B1**: `@react-three/postprocessing@3.1.1` `EffectComposer.tsx:272-277` checks `gl.getSize(glSize)` (logical CSS px `1440x900`) instead of `gl.getDrawingBufferSize()`. When `SceneCanvas.tsx:438` steps `dpr` down (`2 -> 1.5 -> 1.25 -> 1`), `composer.setSize` is **never called**; offscreen FBOs remain stuck at `DPR = 2` (`2880x1800`).<br>3. **Uncovered Bug B2**: `WarmStationPrograms` (`SceneCanvas.tsx:275-308`) blocks for `4,715 ms` and `3,381 ms` while `PerformanceMonitor` is live, firing `ondecline` (`fps: 1`) before `warmReady = true`. | Canvas `antialias: true` only anti-aliases the final fullscreen quad when `EffectComposer` is active. However, MSAA/SMAA only fixes **geometric/silhouette edge stair-stepping** (e.g., red groove and housing chamfers in `03-ch01-hero-pbr.png`); **interior specular shimmer** on `P003068` knurling and tight CAD fillets comes from normal-map/curvature frequency exceeding Nyquist and requires derivative normal-roughness filtering (Toksvig/Kaplanyan). Also, root `EffectComposer` requests `stencilBuffer` even though zero meshes on the root route use stencil ops (stencil is only used in `src/scene/rl300/`). | 1. Cap root DPR at `1.5` (`full`) / `1.0` (`lite`) with a `2560x1440` pixel ceiling.<br>2. Set `multisampling={tier === 'full' ? 4 : 0}` on root `EffectComposer` (or `SMAA` on `lite`), resize composer explicitly on `dpr` change, and set canvas `antialias: false` when composer is active.<br>3. Gate `PerformanceMonitor` on `telemetry.performance.warmReady`. |
| **C. Material detail & occlusion** (*scalar `MeshStandardMaterial` lacks anisotropy, roughness variation & AO; upgrade to `MeshPhysicalMaterial`, `anisotropy 0.8-1`, procedural detail & SSAO/N8AO*) | **Unsupported** *(for naive `anisotropy 0.8-1` & SSAO/N8AO)* / **Partly supported** *(on scalar flatness & raw normals)* | 1. Binary GLB + runtime rig census (`runtime-telemetry-probe.json`) proves **0 of 10,674** primitives in `Default.glb` have `TEXCOORD_0` or `TANGENT`. Post-merge, **51 of 59** rig meshes have `uv = false` and **59 of 59** have `tangent = false`.<br>2. In `three@0.185.1` (`normal_fragment_begin.glsl.js:22-38`, `normalmap_pars_fragment.glsl.js:15-38`), enabling `anisotropy` without tangents calls `getTangentFrame(-vViewPosition, normal, vAnisotropyUv)`; without UVs, `dFdx(uv) = dFdy(uv) = 0`, collapsing the tangent frame to zero/`NaN`!<br>3. `TorqueWrenchHero.tsx:327` flips `depthWrite = material.opacity > 0.5` on ghosted housing and `Station2_AcousticEnclosure.tsx:265` uses transparent panels over `CUT_PLANE`. | Naive `MeshPhysicalMaterial({ anisotropy: 0.8 })` on UV-less, tangent-less CAD meshes produces degenerate `0/0 = NaN` tangent frames in Three.js r185 and adds expensive `getIBLAnisotropyRadiance` shader variants across 53 standard meshes. Post-processing `SSAO` / `N8AO` requires a second scene geometry pass (`NormalPass`, `+841k-1.93M` tris) and causes depth-popping/bleeding through the `ghostOpacity = 0.5` `depthWrite` flip and Station 2 transparent panels. Meanwhile, `nodeRoles.ts:540` never runs `creasedNormals` (`normalRepair.ts:37`), leaving raw CAD tessellation normals on hero parts. | 1. Reject post-processing SSAO/N8AO and UV-dependent `anisotropy`.<br>2. Run `creasedNormals` (or angle-weighted normal repair) on hero steel buckets at consolidation time.<br>3. Add object-space cylindrical/triplanar micro-roughness variation + derivative specular AA + analytical axial cavity darkening inside `materials.ts:462` `onBeforeCompile` (zero UVs, zero extra passes). |
| **D. Depth, backgrounds & banding** (*fog 25/120 is ineffective for ~0.35 m model; use fog 0.8-3.5, radial vignette & blue-noise dither*) | **Partly supported** *(on output dither & vignette)* / **Unsupported** *(on fog 0.8-3.5)* | 1. Measured `Default.glb` bbox (`role-map.json`) is `0.238 x 0.080 x 0.283 m` (exploded `0.689 m`), and `distToTarget` is `0.131-0.573 m` in CH.01/02, so `fog(25, 120)` is indeed `0%` on Station 1.<br>2. **However**, global `scene.fog` (`SceneCanvas.tsx:454`) is shared with the 3.2 m deep opening portal, Station 2 (`distToTarget = 8.786 m` desktop, `~17.5 m` portrait), and Station 3 (`distToTarget = 3.064-3.50 m` desktop, `~9.8 m` portrait). Setting `fog(0.8, 3.5)` would **100% fog out Station 2 and 85-100% fog out Station 3**!<br>3. `EffectMaterial` (`postprocessing.js:14704-14747`) runs in `RGBA16F` and converts to sRGB at the end with `dithering = false` by default. | Atmospheric fog at `0.8-3.5 m` conflicts with multi-station world distances (`3.06-17.5 m`), the 3.2 m opening cavern, and crisp CAD inspection legibility. On the root route, `BackdropGradientLayer.tsx:51-62` already has a radial pool, and renders into a `HalfFloatType` FBO. Banding originates at the final `RGBA16F -> RGBA8` display quantization in `EffectMaterial` where `dithering` defaults to `false`. Injecting raw `+-0.5/255` noise in linear space before ACES + `LinearTosRGB` (slope `12.92` near black) amplifies noise by `~13-20x` in 8-bit sRGB. | 1. Keep `fog(25, 120)` (or disable scene fog on CAD stations). Do not set `fog(0.8, 3.5)`.<br>2. Enable output dithering at the post-sRGB output stage (`EffectPass.dithering = true` or post-tonemap blue-noise dither in `EffectPass`; `/torque-wrench/` already has slope-scaled blue noise + vignette in `BackgroundWorld.tsx:53-58`). |
| **E. Camera & input response** (*`1 - exp(-6 * delta)` feels laggy & scroll framing rigid; use SecondOrderDynamics(1.35, 0.5, 1.25) + scroll-velocity look easing*) | **Partly supported** *(for isolated pointer-parallax channel)* / **Unsupported** *(for camera trajectory & unmodified hero lerp)* | 1. Root scroll-to-camera path already stacks **three** lag layers: Lenis (`duration: 1.1`, `ScrollRig.tsx:22`) + GSAP `scrub: 0.6` (`TorqueWrenchHero.tsx:167`) + `CameraRig.tsx:544` `1 - Math.exp(-6 * safeDelta)` (`tau ~= 167 ms`).<br>2. **Uncovered defect**: `TorqueWrenchHero.tsx:314-319` applies raw un-damped `state.pointer.x * 0.08` to `rotation.y` and frame-rate-dependent `MathUtils.lerp(rotation.x, state.pointer.y * 0.05, 0.1)` to `rotation.x`!<br>3. `SecondOrderDynamics(1.35, 0.5, 1.25)` is underdamped (`zeta = 0.5`, `r = 1.25`) with **~20% step overshoot**. | In `oryzo-lusion-teardown.md:114-129`, `SecondOrderDynamics(1.35, 0.5, 1.25)` is applied **only to the 2D pointer input**, NOT the scroll camera trajectory. Applying underdamped `zeta = 0.5` dynamics to `CameraRig`'s `currentPos/currentTarget` would overshoot the `0.000000` orthographic sheet registration hold (`sheetCamera.ts:121`), push subjects under DOM narrative cards (`CameraRig.tsx:437-488`), and break deterministic settle gates. And boosting `CameraRig`'s exponential rate `lambda` with `|velocity|` makes the camera track fast scroll **more tightly** (less lag), not looser. | 1. Fix `TorqueWrenchHero.tsx:314-319` to use frame-rate-independent damping on both `rotation.x` and `rotation.y`.<br>2. Scope `SecondOrderDynamics(1.35, 0.5, 1.25)` with `k2` stability clamping strictly to a shared 2D pointer offset (zeroed during intro, inspection, reduced motion, and touch).<br>3. Keep `CameraRig` trajectory overshoot-free; optionally test velocity-boosted `lambda = min(14, 6 + |velocity| * 4)`. |

---

## 3. Additional Cross-Cutting Defects Uncovered During Baseline & Runtime Audit

Beyond the five hypotheses, our combined source and hardware-GL inspection uncovered four concrete defects in the live root pipeline that directly affect visual quality and frame-time gates:

1. **`@react-three/postprocessing@3.1.1` ignores dynamic DPR changes (`EffectComposer.tsx:272-277` / `dist/index.js:391-396`)**:
   - `EffectComposer` checks `gl.getSize(glSize)` (which returns CSS pixels `1440 x 900`) rather than `gl.getDrawingBufferSize()` (`width * dpr`). When `SceneCanvas.tsx:402,438` steps `dpr` down the staircase (`2.0 -> 1.5 -> 1.25 -> 1.0`), `composer.setSize()` is never invoked, leaving all offscreen `HalfFloatType` FBOs at `2880 x 1800` (5.18M px).
2. **`WarmStationPrograms` triggers `PerformanceMonitor` degradation before warmup finishes (`SceneCanvas.tsx:275-312, 432-451`)**:
   - In our hardware-GL trace (`runtime-telemetry-probe.json`), `WarmStationPrograms`'s 5 synchronous 1x1 offscreen renders blocked the main thread for **4,715.4 ms** (index 1: `[true, true, false]`) and **3,381.4 ms** (index 3: `[false, true, true]`), firing `PerformanceMonitor.onDecline` (`fps: 1`) at `t = 76,921.7 ms` while `warmReady === false`. This directly explains the previously unestablished **G6 desktop-full opening tier drop** recorded in `TODO.md:21` and `GATES.md:17-18`.
3. **`ToleranceStations.tsx` CSS `visibility` override leaves stale SVG reticle & leader stuck on screen across CH.02-CH.04 (`src/components/ToleranceStations.tsx:158-161, 236-267`)**:
   - When a tolerance station is active (e.g., `p = 0.150` in `03-ch01-hero-pbr.png`), lines 240 and 258 set inline `reticle.current.style.visibility = 'visible'` and `leader.current.style.visibility = 'visible'`. When `f.index` later becomes `-1` (at `p = 0.350, 0.650, 0.850`), line 159 only sets `root.current.style.visibility = 'hidden'` and returns early. Because CSS `visibility: visible` on a child overrides `visibility: hidden` on an ancestor, the orange reticle and white leader line remain permanently visible across CH.02, CH.03, and CH.04 (directly visible in `04-ch02-explode-ghost.png`, `06-ch03-station2-cut.png`, and `07-ch04-station3-m249.png`).
4. **Three.js `0.185.1` overwrites per-material `envMapIntensity` when `material.envMap === null` (`WebGLRenderer.js:2694-2698`)**:
   - Every per-role `envMapIntensity` in `src/scene/rig/materials.ts:233-453`, `src/scene/stages/recolorAllowList.ts:39,48`, and `src/scene/rl300/prepareModel.ts:369` is silently overwritten by `scene.environmentIntensity` on every draw call.

---

## 4. Ordered Recommendation List

Recommendations are ordered by **visual and performance return per integration risk**:

| Rank | Recommendation | Visual / Performance Benefit | Performance & Memory Risk | Affected Owners | Dependencies | Rollback Approach |
|---:|---|---|---|---|---|---|
| **R1** | **Fix Composer DPR Sync, Cap Root DPR at 1.5 (`2560x1440` max), and Gate `PerformanceMonitor` on `warmReady`** | Eliminates the 43% excess pixel fill cost at DPR 2 (`5.18M -> 2.92M` px on 1440x900), makes the DPR staircase actually resize `EffectComposer` FBOs, and stops cold-load `WarmStationPrograms` stalls from prematurely dropping `full -> lite` (G6). | **Net positive**: Reduces offscreen FBO VRAM by ~43% at initial load and prevents thrashing. Zero extra passes. | `src/scene/SceneCanvas.tsx`, `src/scene/PostProcessingComposer.tsx` | None | Revert `MAX_DPR` constant, remove `warmReady` guard in `onDecline`, and remove `composer.setSize` effect. |
| **R2** | **Enable 4x MSAA on Root `EffectComposer` in `full` Tier (or `SMAA` in `lite`), Disable Redundant Canvas Backbuffer MSAA/Stencil, and Enable Output Dithering** | Eliminates severe 1-px geometric stair-stepping on CAD silhouettes, speed-indicator grooves, and cutaway edges (`03-ch01-hero-pbr.png`), and eliminates 8-bit sRGB gradient banding at the final output pass. | **Low / Bounded**: At DPR 1.5 (`2160x1350`), a 4x MSAA `RGBA16F` renderbuffer adds ~69 MB transient GPU memory (offset by dropping DPR 2.0 -> 1.5 and setting canvas `antialias: false, stencil: false`). Falls back to `multisampling={0}` in `lite`. | `src/scene/PostProcessingComposer.tsx`, `src/scene/SceneCanvas.tsx`, `src/scene/sectionRenderPass.ts` | **R1** (DPR 1.5 cap + FBO resize sync must land first so 4x MSAA never allocates at DPR 2.0). | Set `multisampling={0}` on `EffectComposer` and restore `antialias: true` on `<Canvas>`. |
| **R3** | **Restore Per-Role `envMapIntensity` in `materials.ts` and Upgrade Procedural Studio PMREM Environment** | Restores the authored per-role specular hierarchy (`chrome` 1.30 vs `stainlessSteel` 1.25 vs `cageSteel` 1.00 vs `steelDark` 0.95) currently clobbered by Three.js r185, and replaces flat `RoomEnvironment` boxes with gradient studio softboxes + negative fill so machined cylinders read as metal rather than uniform grey plastic. | **Zero runtime / network cost**: Procedural scene bakes once in `useEffect` into the existing `768x1024` `HalfFloatType` PMREM target (~6.3 MB VRAM, 0 network bytes). One `float` uniform multiply in `onBeforeCompile`. | `src/scene/rig/materials.ts`, `src/scene/SceneCanvas.tsx`, `src/scene/torque-wrench/RuntimeWorld.tsx` | None (touches shared `materials.ts`—coordinate between root and `/torque-wrench/` owners). | Remove `uRoleEnvGain` multiply in `materials.ts` and restore stock `new RoomEnvironment()`. |
| **R4** | **Add Object-Space Cylindrical Machined Micro-Roughness, Derivative Specular AA, and Creased Normal Repair** | Gives turned steel parts (`toolSteel`, `cageSteel`, `planetSteel`, `clutchSteel`, `blackOxideSteel`) subtle axial turning-mark response and cavity separation without requiring UVs or tangents, while suppressing sub-pixel normal/knurl shimmer via screen-space derivative roughness widening. | **Very low**: ~8 ALU instructions in fragment shader (no textures, no UVs, no tangents, no extra render passes). Normal repair runs once at rig build time. | `src/scene/rig/materials.ts`, `src/scene/rig/nodeRoles.ts` | **R3** (shares `materials.ts` `onBeforeCompile` hook and `customProgramCacheKey`). | Bump `customProgramCacheKey` and revert `onBeforeCompile` to the single `uIntroPbr` mix line. |
| **R5** | **Fix `ToleranceStations.tsx` Stale SVG Visibility & Frame-Rate-Independent Pointer Damping in `TorqueWrenchHero.tsx` (Optional `SecondOrderDynamics` on Pointer Only)** | Fixes the stuck reticle/leader bug across CH.02-CH.04, eliminates frame-rate-dependent `MathUtils.lerp(..., 0.1)` and un-damped `rotation.y` pointer jumps on the hero wrench, and optionally adds physical pointer feel without risking camera trajectory overshoot. | **Zero GPU / memory cost**: Pure CPU math on 2 floats per frame in `useFrame`, zero allocations. | `src/components/ToleranceStations.tsx`, `src/scene/TorqueWrenchHero.tsx`, `src/scene/CameraRig.tsx` | None | Restore `el.style.visibility` only or set `display: none`; revert pointer damping constants. |
| **R6** | **Keep Current Scene Fog (`25-120`) and Reject Post-Processing SSAO/N8AO** | Preserves full visibility and contrast on Station 2 (`dist = 8.79 m`), Station 3 (`dist = 3.06 m`), and the 3.2 m opening cavern, and avoids a second geometry pass + transparent depth-bleeding artifacts. | **Saves 2-5 ms/frame** and prevents visual regressions on transparent ghost housing and sectioned enclosure panels. | None (keep current behavior) | None | N/A |

---

## 5. Bounded Implementation Design for Validated Recommendations

> **Note**: All code snippets below are **unimplemented / untested architectural specifications** for future authorized work. Do not treat them as applied patches.

### 5.1 R1 & R2 — Composer DPR Sync, DPR 1.5 / 2560x1440 Budget, Warmup Gate, 4x MSAA, and Output Dithering

- **Target Files & Symbols**:
  - `src/scene/SceneCanvas.tsx`: `MAX_DPR` (line 28), `DPR_STEPS` (line 35), `SceneCanvas` `<Canvas>` props (lines 411-414), and `PerformanceMonitor` callbacks (lines 432-451).
  - `src/scene/PostProcessingComposer.tsx`: `FxDriver` (lines 95-179) and `PostProcessingComposer` (lines 181-230).
  - `src/scene/sectionRenderPass.ts`: `createSectionRenderPass` (lines 5-8).
- **Update Ownership & Effect Ordering**:
  - `SceneCanvas` owns the DPR staircase (`[1.5, 1.25, 1]`, clamped by `computeRenderBudget` to `2560 x 1440` max pixels) and gates `PerformanceMonitor` `onDecline` / `onFallback` on `telemetry.performance.warmReady === true`.
  - `PostProcessingComposer` owns the `EffectComposer` instance, sets `multisampling={tier === 'full' ? 4 : 0}`, removes the unused `stencilBuffer` prop on the root route (or keeps it only if a future root pass uses stencil), enables `SMAA` only when `tier === 'lite'`, and explicitly resizes the composer whenever `size.width`, `size.height`, or `viewport.dpr` changes.
- **Unimplemented / Untested Specification Pattern**:

```tsx
// UNIMPLEMENTED DESIGN PATTERN — src/scene/SceneCanvas.tsx
const MAX_DPR = Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1)
const DPR_STEPS = [MAX_DPR, 1.25, 1].filter(
  (value, index, all) => value <= MAX_DPR && all.indexOf(value) === index,
)

// Inside <PerformanceMonitor>:
onDecline={(api: PerformanceMonitorApi) => {
  if (!telemetry.performance.warmReady) return // Prevent WarmStationPrograms stalls from ratcheting DPR/tier
  telemetry.performance.declines++
  pushQualityEvent({ type: 'ondecline', fps: api.fps, flipped: api.flipped })
  if (stepRef.current < DPR_STEPS.length - 1) setDprStep(stepRef.current + 1)
  else {
    pushQualityEvent({ type: 'degradequality' })
    degradeQuality()
  }
}}
```

```tsx
// UNIMPLEMENTED DESIGN PATTERN — src/scene/PostProcessingComposer.tsx
import { useContext, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { EffectComposer, EffectComposerContext, SMAA, ChromaticAberration, Bloom, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { EffectPass } from 'postprocessing'

function ComposerDprAndDitherSync() {
  const { composer } = useContext(EffectComposerContext)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  useEffect(() => {
    // Work around @react-three/postprocessing@3.1.1 checking gl.getSize() (CSS px) instead of drawingBufferSize
    composer.setSize(size.width, size.height)
    for (const pass of composer.passes) {
      if (pass instanceof EffectPass) {
        pass.dithering = true
      }
    }
  }, [composer, size.width, size.height, dpr])

  return null
}
```

- **Quality-Tier Behavior & Acceptance Checks**:
  - `full`: `multisampling = 4` (capped by `gl.capabilities.maxSamples` and `RGBA16F` internalformat samples), `DPR <= 1.5`, `EffectPass.dithering = true`.
  - `lite`: `multisampling = 0`, `<SMAA />` enabled, `DPR = 1.0`, `EffectPass.dithering = true`.
  - `poster` / `reducedMotion`: composer unmounted (`null`).
  - **Acceptance check**: Query `composer.inputBuffer.width`, `composer.inputBuffer.height`, and `composer.inputBuffer.samples` before and after stepping `DPR_STEPS`; verify `inputBuffer` resizes from `2160 x 1350` (DPR 1.5) to `1800 x 1125` (DPR 1.25) and `1440 x 900` (DPR 1.0), and verify `telemetry.performance.declines === 0` at `warmfinish`.

---

### 5.2 R3 & R4 — Per-Role `envMapIntensity` Restoration, Procedural Studio Softbox PMREM, and Object-Space Machined Steel Detail + Specular AA

- **Target Files & Symbols**:
  - `src/scene/rig/materials.ts`: `roleMaterial` (lines 218-472) and `onBeforeCompile` (lines 458-469).
  - `src/scene/SceneCanvas.tsx`: `RoomEnvironmentIbl` (lines 125-146).
  - `src/scene/rig/nodeRoles.ts`: `buildWrenchRig` (line 540, optional `creasedNormals` pass on machined steel buckets).
- **Update Ownership & Effect Ordering**:
  - In `materials.ts`, preserve the `roleMaterial(role)` singleton map and ghost-cloning contract. Inside `onBeforeCompile`, inject:
    1. `uniform float uRoleEnvGain;` initialized to `ready.envMapIntensity` (`0.95` to `1.30`), multiplying `envMapIntensity` inside `envmap_physical_pars_fragment` so Three.js r185's `m_uniforms.envMapIntensity.value = scene.environmentIntensity` assignment (`WebGLRenderer.js:2696`) is modulated by the role's authored multiplier: `effectiveEnv = scene.environmentIntensity * uRoleEnvGain`.
    2. For turned-metal roles (`toolSteel`, `cageSteel`, `planetSteel`, `clutchSteel`, `rotorSteel`, `stainlessSteel`, `blackOxideSteel`), pass `vMachinedPos` from the vertex shader and apply a subtle axial lathe micro-roughness modulation plus screen-space normal-derivative specular AA (Kaplanyan 2016) so grazing highlights on gear teeth and knurling do not shimmer.
- **Unimplemented / Untested Specification Pattern**:

```ts
// UNIMPLEMENTED DESIGN PATTERN — src/scene/rig/materials.ts (inside roleMaterial)
const roleEnvGain = { value: ready.envMapIntensity ?? 1.0 }
const isTurnedMetal =
  role === 'toolSteel' ||
  role === 'cageSteel' ||
  role === 'planetSteel' ||
  role === 'clutchSteel' ||
  role === 'rotorSteel' ||
  role === 'stainlessSteel' ||
  role === 'blackOxideSteel'

ready.onBeforeCompile = (shader, renderer) => {
  compile(shader, renderer)
  shader.uniforms.uIntroPbr = introPbrActivation
  shader.uniforms.uRoleEnvGain = roleEnvGain
  shader.vertexShader = `varying vec3 vMachinedPos;\n${shader.vertexShader}`.replace(
    '#include <begin_vertex>',
    '#include <begin_vertex>\n  vMachinedPos = position;',
  )
  shader.fragmentShader = `uniform float uIntroPbr;\nuniform float uRoleEnvGain;\nvarying vec3 vMachinedPos;\n${shader.fragmentShader}`
    .replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      ${isTurnedMetal ? `
      // Axial lathe turning micro-roughness (object-space Z, no UVs required)
      float latheBands = sin(vMachinedPos.z * 2800.0) * 0.5 + sin(vMachinedPos.z * 7900.0) * 0.5;
      roughnessFactor = clamp(roughnessFactor + latheBands * 0.035, 0.08, 1.0);
      ` : ''}
      // Geometric normal-variance specular AA (suppresses sub-pixel CAD bevel & knurl shimmer)
      vec3 dndu = dFdx( geometryNormal );
      vec3 dndv = dFdy( geometryNormal );
      float variance = 0.25 * ( dot( dndu, dndu ) + dot( dndv, dndv ) );
      float kernelRoughness2 = min( 2.0 * variance, 0.18 );
      roughnessFactor = clamp( sqrt( roughnessFactor * roughnessFactor + kernelRoughness2 ), 0.08, 1.0 );`,
    )
    .replace(
      '#include <envmap_physical_pars_fragment>',
      `#include <envmap_physical_pars_fragment>`.replace(
        /\* envMapIntensity/g,
        '* (envMapIntensity * uRoleEnvGain)',
      ),
    )
    .replace(
      '#include <opaque_fragment>',
      'outgoingLight = mix(vec3(0.004, 0.021, 0.037), outgoingLight, uIntroPbr);\n#include <opaque_fragment>',
    )
}
ready.customProgramCacheKey = () => `${originalKey}-intro-pbr-v2-${role}-${isTurnedMetal ? 'turned' : 'base'}`
```

- **Calibration Procedure for Studio Lighting / IBL**:
  1. Render controlled stills at `p = 0.150` (CH.01 hero), `p = 0.350` (CH.02 exploded gears), `p = 0.470` (CH.02 LCD dwell), and `p = 0.650` (CH.03 Station 2) with `?qualityLock=1`.
  2. Measure subject-mask luminance histograms via `scripts/lib/preview-pixels.mjs`: verify 99th-percentile sRGB luminance stays in `[215, 248]` (clipped pixels `> 252` under `0.25%` of subject area) and median carrier/planet luminance separates by at least `12` sRGB levels between `cageSteel` (`#6e7276`), `planetSteel` (`#585c60`), and `toolSteel` (`#4a4d50`).

---

### 5.3 R5 — `ToleranceStations.tsx` Visibility Fix & Frame-Rate-Independent Pointer Dynamics

- **Target Files & Symbols**:
  - `src/components/ToleranceStations.tsx`: `apply` callback (lines 144-162).
  - `src/scene/TorqueWrenchHero.tsx`: `useFrame` pointer rotation block (lines 314-319).
  - `src/scene/CameraRig.tsx`: `useFrame` pointer parallax block (lines 521-527).
- **Unimplemented / Untested Specification Pattern**:

```tsx
// UNIMPLEMENTED DESIGN PATTERN — src/components/ToleranceStations.tsx:158-162
if (f.index < 0 || f.index !== index) {
  el.style.visibility = 'hidden'
  // Child SVG elements have explicit style.visibility = 'visible' which overrides parent visibility:hidden in CSS!
  if (datum.current) datum.current.style.visibility = 'hidden'
  if (reticle.current) reticle.current.style.visibility = 'hidden'
  if (leader.current) leader.current.style.visibility = 'hidden'
  if (secondary.current) secondary.current.style.visibility = 'hidden'
  if (axis.current) axis.current.style.visibility = 'hidden'
  if (glint.current) glint.current.style.visibility = 'hidden'
  return
}
```

```ts
// UNIMPLEMENTED DESIGN PATTERN — src/scene/TorqueWrenchHero.tsx:314-319
const safeDelta = Math.min(delta, 0.1)
const pointerDamp = 1 - Math.exp(-8 * safeDelta)
const targetYaw = anim.spin * Math.PI * 0.85 + state.pointer.x * 0.08
const targetPitch = state.pointer.y * 0.05
group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetYaw, pointerDamp)
group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, targetPitch, pointerDamp)
```

---

## 6. Selected Skill and Reference Techniques

| Source | Classification | Applicable Technique & Why It Applies Here |
|---|---|---|
| `node_modules/three` (`0.185.1`), `node_modules/postprocessing` (`6.39.4`), `node_modules/@react-three/postprocessing` (`3.1.1`) | **Official / Installed Library Source (Primary Authority)** | Establishes exact shader chunk behavior (`WebGLRenderer.js:2694-2698` overwriting `envMapIntensity`, `normal_fragment_begin.glsl.js:22-38` UV-derivative tangent frame degeneracy, `EffectComposer.tsx:272-277` CSS-size check vs `getDrawingBufferSize`, `EffectMaterial` post-sRGB `#include <dithering_fragment>` at `postprocessing.js:14707`). |
| `r3f-scroll-performance-guard` (`C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md:27-54`) | **Project Skill (Binding Rule)** | Mandates zero React state updates in `useFrame`, preallocated module-level scratch vectors/colors, and delta-clamped frame-rate-independent damping (`1 - Math.exp(-lambda * Math.min(delta, 0.1))`). Directly flags `TorqueWrenchHero.tsx:315-319`'s fixed `0.1` lerp. |
| `cad-scene-graph-rigging` (`C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md:125-165`) | **Project Skill (Binding Rule)** | Requires verifying UV attribute presence on CAD exports before relying on tangent-space maps or UV derivatives; explains why `P003068` needed explicit `attachCylindricalUvs` while the other 51 rig meshes lack UVs. |
| `glsl-transition-shader-pipeline` (`C:/Users/Markimus/.codex/skills/glsl-transition-shader-pipeline/SKILL.md:26-48`) | **Project Skill (Binding Rule)** | Governs `uRootInv` model-space sweep evaluation, quality-tier gating (`lite` bypasses dissolve), and program cache keys / disposal. |
| `webgl-telemetry-verifier` (`C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md:9-12,128-135`) | **Project Skill (Binding Rule)** | Mandates runtime telemetry + pixel verification over visual guesswork; guided our `runtime-telemetry-probe.json` hardware probe. |
| `build-threejs-scroll-worlds` & `cinematic-gsap-lenis-motion-system` (`C:/Projects/skills-master/local/`) | **Curated Skill Library Guidance** | Recommends separating exact canonical scroll progress from smoothed camera/pointer state, restrained studio lighting ratios (key:fill:rim), and device-tested pixel budgets. |
| `oryzo-lusion-teardown.md` (`C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md`) | **Secondary Reference (Static Bundle Teardown + DOM Runtime Probe)** | **Direct bundle observations**: DPR cap `1.5` + `2560x1440` pixel limit (lines 87-88), `PostProfile` continuous section grade blending (lines 96-100), `BlueNoise` gradient dither (lines 102-104), `SecondOrderDynamics(1.35, 0.5, 1.25)` on 2D pointer input (lines 114-117), and velocity-boosted exponential camera look easing (lines 127-129). **Teardown inference (not observed on Oryzo)**: using R3F `EffectComposer` MSAA + SMAA in place of Lusion's custom MRT velocity-buffered TAA (lines 106-109). **Absent from teardown**: any claim about `RoomEnvironment`, HDRI, `MeshPhysicalMaterial` anisotropy, SSAO/N8AO, or `fog(0.8, 3.5)`. |

---

## 7. Completed Verification, Exact Evidence Locations, and Remaining Limitations

### 7.1 Completed Verification in This Audit

| Check | Command / Harness | Result | Evidence Location |
|---|---|---|---|
| **TypeScript check** | `npm run typecheck` | **PASS** (exit 0) | Console output verified clean |
| **B1/B2 synthetic contract** | `node scripts/check-b1b2-contract.mjs` | **PASS** (`31/31` passed, `0` failed) | Console output verified clean |
| **Station 2 asset & scene contract** | `node scripts/check-station2-contract.mjs` | **PASS** (`2,671,600` bytes, 7 roots, 7 CAD anchors) | Console output verified clean |
| **Binary GLB & `role-map.json` geometry audit** | Read-only Node binary header + `role-map.json` union AABB parser | **Measured**: `Default.glb` bbox `0.2385 x 0.0799 x 0.2832 m`, `10,674` prims, `0` UVs, `0` tangents; only `m249-transformed.glb` has tangents | Section 2 & `runtime-telemetry-probe.json` |
| **Live Hardware-GL Telemetry & 7-Stop Capture Probe** | In-process Vite server on `http://localhost:5199/?qualityLock=1&qualityDiagnostics=1` + Playwright `installed Chrome, ANGLE/D3D11 (hardware)` on `AMD Radeon 780M Graphics`, `1440x900`, initial `deviceScaleFactor: 2` | **Complete**: Captured WebGL2 capabilities, 59-mesh rig census, station mesh/attribute census, `window.__qualityEvents()` warmup timeline, 120-frame scroll sweep, and 7 PNGs | [runtime-telemetry-probe.json](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/webgl-review-2026-10-16/evidence/runtime-telemetry-probe.json) and [evidence PNGs](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/webgl-review-2026-10-16/evidence/) |
| **Existing JG-038 53-Run Hardware AC Ledger** | Read-only inspection of `ac-final-checkpoint-2026-10-16.md` and `ac-final-summary-20261016-f.json` (same host, Radeon 780M D3D11, 59.88 Hz) | **Inspected**: Confirms desktop-full breakthrough frame-tail spikes (`p95 = 33.7 ms`, `p99 = 34.2 ms`) and startup valid-cache `10.6158 s` vs `10.0 s` ceiling | [ac-final-checkpoint-20261016.md](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/work/evidence/torque-wrench-rebuild/09-stage5-rendering-20261015/ac-final-checkpoint-20261016.md:1) |

### 7.2 Task / Delegation Ledger (`codex-tiers` verification)

- **Configured agent bindings verified on disk** (`C:\Users\Markimus\.codex\agents\*.toml` and `multi_agent_v1__spawn_agent` schema):
  - `tier-reader`: `model = "gpt-6-luna"`, `model_reasoning_effort = "high"`, `sandbox_mode = "read-only"` (used for 3 parallel bounded read jobs: `McClintock` `01a1471c-1f44-7070-9d5b-51a1d78eb134` for baseline module inventory without prior conclusions; `Noether` `01a1471c-310b-78e0-936c-1550dcc370ec` for Oryzo teardown + skills-master extraction; `Meitner` `01a1471c-4032-7f60-af5e-7350bfb3c619` for `node_modules` internals + verification inventory; all 3 completed and closed cleanly).
  - `tier-worker`: `model = "gpt-6.1-sol"`, `model_reasoning_effort = "high"` (not dispatched; implementation not authorized).
  - `tier-reviewer`: `model = "gpt-6-astra"`, `model_reasoning_effort = "medium"` (not required; all five hypotheses resolved deterministically from Three.js/postprocessing source and hardware-GL telemetry).
  - *Note*: Configured model/effort bindings are verified from `~/.codex/agents/*.toml` and the `spawn_agent` tool contract; per `codex-tiers`, runtime backend model serving is not independently observable from subagent text alone.

### 7.3 Unresolved Limitations & Smallest Next Step for Each

1. **A/B Frame-Time & Visual Comparison of R1-R4 on Hardware GL**:
   - *Limitation*: Because this audit strictly preserves all application source files, R1-R5 have not been patched or A/B-benchmarked at runtime.
   - *Smallest resolving step*: In an authorized implementation session, apply **R1 + R2** first in an isolated branch/worktree and re-run the 120-frame hardware-GL sweep and `verify-jgun-opening.mjs --quick` on `AMD Radeon 780M` to measure the exact frame-time reduction (`p50`, `p95`, `p99`) and verify zero warmup-induced DPR/tier drops.
2. **GPU Disjoint Timer Queries vs CPU-to-Present rAF Intervals**:
   - *Limitation*: While `EXT_disjoint_timer_query_webgl2` is supported on this GPU (`hasDisjointTimerQuery: true` in `runtime-telemetry-probe.json`), neither the app nor existing verifiers wrap individual passes in `gl.beginQuery(ext.TIME_ELAPSED_EXT, ...)`.
   - *Smallest resolving step*: Add an opt-in `?gpuTiming=1` query probe around `RenderPass` and `EffectPass` during the R1/R2 A/B test to isolate geometry rasterization ms from post-processing ms.
3. **Real Mobile GPU vs Desktop Emulation**:
   - *Limitation*: Narrow viewport checks (`390 x 844`) run on the desktop `AMD Radeon 780M` GPU, which does not establish tile-based mobile GPU bandwidth costs for `HalfFloatType` MSAA resolve.
   - *Smallest resolving step*: Keep `multisampling = 0` (with `SMAA`) whenever `tier === 'lite'` or viewport width `< 768 px`.
