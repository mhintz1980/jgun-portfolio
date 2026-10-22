---
name: r3f-cad-cinematography
description: Author cinematic camera splines, bullet-time time-dilation, CAD assembly isolation fades, GLSL machining cutaways, and SDF HUD callouts using React 19.2, Three.js 0.185, R3F 9.7, Drei 10.7.8, Postprocessing 3.1, GSAP 3.13, and Lenis 1.3 with Playwright WebGL telemetry verification.
---

# R3F Mechanical CAD Cinematography & Camera Rig Skill

## 1. Hard Stack & Asset Guardrails (NON-NEGOTIABLE)
- **Framework:** React 19.2, Vite 7, TypeScript 5.9 (`npm run typecheck` must pass with zero implicit `any` or Three.js r185 type mismatches).
- **WebGL Core:** `three@0.185`, `@react-three/fiber@9.7`, `@react-three/drei@10.7.8`, `postprocessing@6.39`, `@react-three/postprocessing@3.1`, `troika-three-text`.
- **Motion:** `gsap@3.13` (`gsap.context()`), `lenis@1.3` (synced via `gsap.ticker`).
- **PROTECTED ASSETS RULE:** NEVER run `gltfjsx --transform` on `public/models/m249-transformed.glb` or `public/models/msp-enclosure.glb`. Always load them via `useGLTF` and clone/modify materials in-memory at runtime so shared material references do not bleed across sub-assemblies.
- **VERIFICATION RULE:** Never rely on visual-only screenshots. Every camera rig, shader uniform, and isolation state MUST expose deterministic telemetry on `window.__WEBGL_TELEMETRY__` for Playwright assertions.

## 2. Lenis 1.3 + GSAP 3.13 + R3F Render Loop Synchronization
- Sync Lenis directly to `gsap.ticker` with `gsap.ticker.lagSmoothing(0)`.
- Never mutate React `useState` inside `ScrollTrigger.onUpdate` or `useFrame`. Mutate a typed module-scoped `rigState` object and read it inside `useFrame(_, delta)`.

## 3. Cinematic Camera Splines (`@react-three/drei@10.7.8`)
- Use dual `THREE.CatmullRomCurve3` splines (`cameraSpline` for eye position, `targetSpline` for `lookAt` focus) with `curveType = 'centripetal'` (tension `0.5`) to prevent gimbal snaps on tight mechanical orbits.
- Dynamic lens breathing: animate `camera.fov` (e.g., `40` wide establishing -> `22` telephoto isometric macro for machining tolerances) and call `camera.updateProjectionMatrix()` only when `Math.abs(camera.fov - rigState.cameraFov) > 0.01`.
- Drive `<DepthOfField>` (`@react-three/postprocessing@3.1`) target dynamically from `targetSpline` current point so the isolated part stays tack-sharp.

## 4. "Bullet-Time" Time-Dilation Architecture
- Decouple mechanical animation time from `clock.getElapsedTime()`.
- Maintain an accumulated simulation clock (`rigState.simTime += Math.min(delta, 0.1) * rigState.timeScale`).
- During a bullet-time camera sweep, tween `rigState.timeScale` from `1.0` down to `0.03` while scrubbing `rigState.splineProgress` around the assembly.

## 5. Sub-Assembly Isolation (Zero Z-Fighting Fade)
- Clone materials per sub-assembly node on mount.
- When fading out outer housings: set `material.transparent = true` and `material.depthWrite = opacity > 0.95` to prevent transparent Z-sorting artifacts against internal parts.

## 6. Machining Operations & Section Cutaways (GLSL)
- Enable `gl.localClippingEnabled = true`.
- Drive `THREE.Plane` constants via GSAP timeline to simulate CNC milling passes or cross-sections.
- Inject a glowing machining kerf edge in `onBeforeCompile` by measuring world-space distance to the active `clippingPlane` (`smoothstep(0.0, 0.025, distToCut)`).

## 7. Automated GLB Node Discovery & `?debug=rig` Authoring Workflow
- Never guess mesh names. Inspect `window.__GLB_MANIFESTS__` populated by `useGLBSceneAuditor(scene, modelPath)` to get exact `name`, `materialName`, `bboxSize`, and `bboxCenter` of every sub-assembly mesh.
- Use `bboxCenter` coordinates as `targetPos` (`lookAt`) vectors for macro shots.
- Mount `<CameraSplineStudio />` so `?debug=rig` exposes 3D `<PivotControls>` handles, a `VIEW: DIRECTOR ORBIT` toggle, and a `COPY TYPESCRIPT KEYFRAMES` button.
