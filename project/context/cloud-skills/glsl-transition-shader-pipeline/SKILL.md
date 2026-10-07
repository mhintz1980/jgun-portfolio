---
name: glsl-transition-shader-pipeline
description: Maintain and optimize custom GLSL shaders (CadTransitionShader), bounding-box uniform alignment, noise generators, and tier fallbacks.
---

# GLSL Transition Shader Pipeline

## Overview
`CadTransitionShader.ts` powers the Chapter 4 "Shop Floor to Software" effect: a planar sweep along the model's Z-axis where metallic PBR transitions into an emissive wireframe/point cloud with animated noise.

## Shader Uniforms

```glsl
uniform mat4  uRootInv;     // Inverse LIVE world matrix of the hero's recentered root group (refreshed every frame — never cached at rest pose)
uniform float uProgress;    // 0..1 Chapter 4 scroll progress
uniform float uTime;        // Elapsed animation time (seconds)
uniform vec3  uScanColor;   // Emissive scanline edge color (cyan)
uniform float uEdgeWidth;   // Width of the scanline gradient
uniform float uNoiseFreq;   // Procedural noise frequency
uniform float uSweepMin;    // Root-space Z minimum bound (m)
uniform float uSweepMax;    // Root-space Z maximum bound (m)
```

## Critical Implementation Invariants

### 1. Root-Frame Coordinate Evaluation via `uRootInv` (Mandatory)
- **NEVER** use world-space `worldPos.z` (corrupted by the ~153° hero yaw in CH.04) or raw mesh-local `position.z` (broken across consolidated per-unit frames — handle/gearbox/root bake spaces in `nodeRoles.ts`).
- **ALWAYS** compute `vRootZ` in the vertex shader by projecting through `uRootInv`:
  ```glsl
  vec4 rootPos = uRootInv * modelMatrix * vec4(position, 1.0);
  vRootZ = rootPos.z;
  ```
  `uRootInv` is the inverse of the recentered root group's **current** world matrix, refreshed every frame (shipped: `uniforms.uRootInv.value.copy(inner.matrixWorld).invert()` in the hero's `useFrame`). Caching it once at rest pose reintroduces the drift as soon as the group rotates. (Shipped code projects the boil-displaced position — same invariant, sub-millimeter cosmetic difference.)
- The resulting frame is rest-pose-aligned, so `[uSweepMin, uSweepMax]` stay aligned with the `Box3().setFromObject(root)` measurement — shift both by `-center.z` at the call site to match the recentered frame — while axial stage explosions (applied below the root frame) remain sweep-visible, and rotation/pointer parallax (above it) cancel out.

### 2. Geometry Bounds Binding
- `uSweepMin` and `uSweepMax` must be dynamically bound from `root.userData.wrenchRig.bounds.zMin` and `bounds.zMax` at initialization. Never hardcode magic numbers for Z bounds.

### 3. Tier Fallback Gating
- `CadTransitionShader` runs **only** when `chapter === 3 && tier === 'full'`.
- **Lite Tier**: Swap to standard blueprint wireframe with an opacity cross-fade.
- **Poster Tier / Reduced Motion**: No canvas rendering; static blueprint vector/poster fallback in DOM.

### 4. Material Disposal
- Always implement clean `dispose()` on compiled shader materials when unmounting or switching between Solid, Blueprint, and Exploded modes.

## Anti-Patterns
- ❌ Recalculating procedural noise textures in CPU memory per frame (keep noise in fragment shader).
- ❌ Hardcoding screen-space coordinates for the axial CAD sweep.