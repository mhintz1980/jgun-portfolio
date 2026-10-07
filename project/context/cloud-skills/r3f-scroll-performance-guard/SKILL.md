---
name: r3f-scroll-performance-guard
description: Enforce zero-rerender state sharing between Lenis/GSAP and R3F, clock synchronization, proxy object scrubbing, and 60 FPS performance budgets.
---

# R3F & Scroll Synchronization Performance Guard

## Architectural Contract
The page uses a dual-world architecture:
1. **Fixed WebGL Canvas World (`z-0`)**: Rendered via R3F / Three.js.
2. **DOM Scroll World**: Rendered via plain React DOM (`Chapters.tsx`).
3. **Bridge**: `scrollStore.ts` external store.

```
[Lenis Scroll] ---> [GSAP ScrollTrigger] ---> [scrollStore & GSAP Proxy]
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                                                     |
                   v (useSyncExternalStore)                                              v (getScrollState() inside useFrame)
           [DOM React Components]                                                [R3F Canvas World]
          (Re-renders per scroll key)                                            (ZERO React Re-renders)
```

## Critical Invariants & Rules

### 1. Zero React Re-Renders in Canvas
- **NEVER** subscribe to `scrollStore` with React state hooks (`useState`, `useScrollValue`) inside canvas components or `SceneCanvas.tsx`.
- **ALWAYS** read values imperatively inside `useFrame` using `getScrollState()`:
  ```ts
  useFrame((state, delta) => {
    const { progress, chapter, chapterProgress } = getScrollState();
    // mutate Three.js objects directly
  });
  ```

### 2. GSAP Proxy Object Pattern
- GSAP ScrollTrigger must **NEVER** directly mutate Three.js objects (e.g., `mesh.position.x = ...` or `material.opacity = ...`).
- Animate an isolated proxy object and apply it in `useFrame`:
  ```ts
  const proxy = useRef({ spin: 0, ghost: 0, explode: 0 });
  // GSAP scrubs proxy.current
  useFrame(() => {
    heroGroup.current.rotation.y = proxy.current.spin * Math.PI * 0.85;
    // apply ghost and explode
  });
  ```

### 3. Unified Clock & Stutter Guard
- Lenis `raf` must be ticked strictly from `gsap.ticker` with `gsap.ticker.lagSmoothing(0)` to prevent post-tab-switch stutter.
- Exponential damping on camera / transforms must clamp `delta` to avoid NaN or overshoot on frame drops:
  ```ts
  const safeDelta = Math.min(delta, 0.1);
  const factor = 1 - Math.exp(-6 * safeDelta);
  ```

### 4. Reduced Motion Invariants
- When `prefers-reduced-motion` is active:
  - Do not mount `ScrollRig` (Lenis/ScrollTrigger).
  - Pin camera to CH.01 keyframe: pos `(0.32, 0.16, 0.42)`, target `(0, 0, 0)`, FOV `42°`.
  - Disable spin, ghost fade, scroll-driven explode, pointer parallax, and CAD dissolve.
  - Exploded view is only accessible via explicit user click on the `[ EXPLODED ASSEMBLY ]` HUD switcher.

## Anti-Patterns
- ❌ Calling `setState` inside `useFrame` or a `ScrollTrigger` callback.
- ❌ Instantiating new `Vector3`, `Euler`, or `Matrix4` objects inside `useFrame` (triggers GC thrash; use shared module-level temp objects).
- ❌ Creating un-disposed cloned materials on every render.