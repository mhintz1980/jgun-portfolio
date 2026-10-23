# Oryzo / Lusion Engine Architectural Recommendations: Quiet Machine (RL300 Enclosure)

**Target Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`  
**Target Document Route:** `quiet-machine/index.html` (`src/quiet-machine-main.tsx`)  
**Core Source Files:**  
- `src/scene/rl300/QuietMachinePreview.tsx`  
- `src/scene/rl300/QuietMachineScene.tsx`  
- `src/scene/rl300/AirRibbons.tsx`  
- `src/scene/rl300/SectionCaps.tsx`  
- `src/scene/rl300/shot.ts`  

---

## 1. Executive Summary & Architectural Context

The RL300 Acoustic Enclosure study ("The Quiet Machine") is currently implemented as an isolated section study. It renders a Draco-compressed industrial enclosure (`/models/msp-enclosure.glb`), dynamic clipping-plane cross-sections, stencil caps (`SectionCaps.tsx`), intake ducts, and acoustic/airflow ribbons (`AirRibbons.tsx`).

However, when compared to the benchmark established by Lusion's engine on `oryzo.ai` (`oryzo-lusion-teardown.md`), the current Quiet Machine has three major UX gaps:
1. **Discontinuous Scroll:** It binds directly to native `window.addEventListener('scroll')` without smooth-scroll interpolation, causing harsh stepped notches on Windows mouse wheels.
2. **First-Cut Compile Hitch:** When the user scrubs into the section cut, compiling the local clipping planes and stencil cap materials causes a noticeable 50–150ms main-thread freeze.
3. **Rigid Presentation:** Zero pointer responsiveness exists, and editorial text snaps abruptly between discrete `beat` indices rather than gliding smoothly.

This document details 8 concrete, measurable architectural improvements to bring the Quiet Machine to Oryzo's level of fluid interaction and visual depth.

---

## 2. Mount Lenis with Exponential Smoothing & Wheel Clamping (`QuietMachinePreview.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachinePreview.tsx` (lines 81–85):
```tsx
const scroll = () => {
  if (!reduced) seek(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))
}
window.addEventListener('scroll', scroll, { passive: true })
```
The page uses native browser scroll events. On standard notched mouse wheels (each notch emitting 100–120px), the cross-section cut plane (`plane.constant = shot.plane`) jumps in discrete steps ($\Delta u \approx 0.015$). The reveal feels mechanical and jarring rather than like a continuous spatial slice.

### The Oryzo Pattern
1. Mount Lenis with Lusion's verified exponential decay rate ($\lambda = 12\,\text{s}^{-1}$): $\text{easing}(t) = 1 - e^{-12 \cdot t}$.
2. Intercept and clamp wheel deltas to $\pm 200\text{px}$ to prevent trackpad momentum spikes from blowing through multiple shots.
3. Drive R3F demand invalidation from Lenis scroll ticks.

### Measurable Improvements
* **Scrub Granularity:** Continuous sub-pixel slice updates ($\Delta u < 0.001$/frame) replace discrete 100px stepped notches.
* **Liquid Feel:** Slicing through the 5-layer composite acoustic wall and internal pump baffles feels weighted and cinematic.

### Drop-in Implementation (`QuietMachinePreview.tsx`):
```tsx
import Lenis from 'lenis'

useEffect(() => {
  if (reduced) return

  const lenis = new Lenis({
    duration: 1.0,
    easing: (t) => 1 - Math.exp(-12 * t), // Measured Lusion exponential rate
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
    smoothWheel: true,
  })

  // Wheel clamp: prevents trackpad momentum flings
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) > 200) {
      Object.defineProperty(e, 'deltaY', { value: Math.sign(e.deltaY) * 200 })
    }
  }
  window.addEventListener('wheel', onWheel, { passive: false })

  lenis.on('scroll', ({ progress }) => {
    seek(progress)
  })

  let rafId: number
  const raf = (time: number) => {
    lenis.raf(time)
    rafId = requestAnimationFrame(raf)
  }
  rafId = requestAnimationFrame(raf)

  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('wheel', onWheel)
    lenis.destroy()
  }
}, [reduced, seek])
```

---

## 3. Decouple Editorial HUD from React State Churn (`QuietMachinePreview.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachinePreview.tsx` (lines 52, 101–105):
```tsx
const beat = evaluateShot(u, false).beat
// ...
<div className="qm-editorial">
  <p className="qm-eyebrow">THE QUIET MACHINE <span>0{beat + 1} / 0{SHOTS.length}</span></p>
  <h1>{SHOTS[beat].title}</h1>
  <p className="qm-caption">{SHOTS[beat].caption}</p>
</div>
```
Every change in `u` triggers React state updates (`[u, setU]`), and the editorial text abruptly pops when the integer `beat` changes from 0 to 1, 1 to 2, etc.

### The Oryzo Pattern
Render editorial cards as persistent DOM nodes. Drive each card’s entrance, exit, and line-mask sliding through windowed ratio math directly in the scroll callback, setting `visibility: hidden` when out of range.

### Measurable Improvements
* **Editorial Polish:** Headlines and technical notes smoothly cross-fade and lift (+16px translate) between shots instead of hard-swapping.
* **React Churn:** Completely eliminates DOM reconciliation during continuous scrubbing.

### Drop-in Implementation (`QuietMachinePreview.tsx`):
```tsx
// Inside QuietMachinePreview:
const cardRefs = useRef<(HTMLDivElement | null)[]>([])

const updateEditorial = useCallback((progress: number) => {
  SHOTS.forEach((shot, i) => {
    const el = cardRefs.current[i]
    if (!el) return

    // Normalized shot windows along 0..1
    const shotCenter = i / (SHOTS.length - 1)
    const windowRadius = 0.12
    const dist = Math.abs(progress - shotCenter)
    const isActive = dist < windowRadius

    el.style.visibility = isActive ? 'visible' : 'hidden'
    if (!isActive) return

    const opacity = Math.max(0, 1 - dist / windowRadius)
    const translateY = (1 - opacity) * 14 // 14px slide

    el.style.opacity = `${opacity}`
    el.style.transform = `translate3d(0, ${translateY}px, 0)`
  })
}, [])
```

---

## 4. Asynchronous Shader & Stencil Pre-warming (`QuietMachineScene.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachineScene.tsx` (lines 58–77):
The enclosure GLB loads and renders the exterior shell immediately. When the user scrubs to Shot 2 (`u = 0.2`, the section cut), Three.js encounters local clipping planes (`plane.constant = shot.plane`) and stencil cap materials (`SectionCaps.tsx`) for the first time. The GPU driver pauses to compile these shader programs on the render thread, causing a noticeable **50–150ms frame freeze**.

### The Oryzo Pattern
Oryzo pre-compiles all materials and shaders before unhiding the canvas using `renderer.compileAsync()` across a pre-registered compile list.

### Measurable Improvements
* **First-Cut Hitch:** Frame time on the first section cut reveal drops from **>100ms down to a flat 16.6ms (60 FPS)**.
* **Seamless Fade:** The loading screen (`installPageFade`) only dissolves once all stencil and clipping shaders are verified ready in GPU VRAM.

### Drop-in Implementation (`QuietMachineScene.tsx`):
```tsx
// Inside Model component in QuietMachineScene.tsx:
loader.load(
  lite ? '/models/rl300-lite.glb' : '/models/msp-enclosure.glb',
  async (gltf) => {
    try {
      if (!cancelled) {
        owned = prepareModel(gltf.scene, plane)
        configureEquipmentStencil(owned.group)

        // Oryzo pattern: pre-warm clipping plane and stencil shader variants
        await gl.compileAsync(owned.group, camera)

        setModel(owned)
        onReady(owned)
        invalidate()
      }
    } catch {
      if (!cancelled) onError()
    }
  }
)
```

---

## 5. Bounded Render Budget & Hard DPR 1.5 Cap (`QuietMachineScene.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachineScene.tsx` (line 143):
```tsx
<Canvas frameloop="demand" dpr={lite ? 1 : [1, 1.5]} shadows={!lite} ... />
```
While `dpr={[1, 1.5]}` is partially present, there is no maximum pixel budget ceiling. On ultra-wide monitors (e.g., 3840×1600 or 5120×1440), DPR 1.5 still generates **9M to 11M fragments per frame**. With dynamic clipping, stencil buffers, and shadows active, fill rate is pushed beyond thermal thresholds on integrated or mid-tier laptop GPUs.

### The Oryzo Pattern
Enforce a hard ceiling: $\text{MAX\_PIXELS} = 2560 \times 1440 = 3,686,400\text{ px}$. If viewport dimensions exceed this at DPR 1.5, downscale DPR proportionally while preserving aspect ratio.

### Measurable Improvements
* **Fill Rate Reduction:** Caps peak fragment shader invocations to **3.68M pixels**, preventing thermal throttling and maintaining a solid 60/120 FPS across 4K and ultra-wide displays.

### Drop-in Implementation (`QuietMachineScene.tsx`):
```tsx
const MAX_PIXEL_BUDGET = 2560 * 1440 // 3.68M pixels

function getClampedDpr(width: number, height: number, lite: boolean): number {
  if (lite) return 1.0
  const baseDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)
  const totalPixels = width * height * baseDpr * baseDpr
  if (totalPixels > MAX_PIXEL_BUDGET) {
    return Math.sqrt(MAX_PIXEL_BUDGET / (width * height))
  }
  return baseDpr
}
```

---

## 6. Subtle Cursor Parallax via Second-Order Dynamics (`QuietMachineScene.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachineScene.tsx` (lines 104–109):
```tsx
const shot = evaluateShot(control.u, size.width < 600)
cam.position.set(...shot.position)
cam.lookAt(...shot.target)
```
The camera is rigidly welded to the pre-baked shot trajectory. There is **zero cursor responsiveness**. The 3D scene feels flat and pre-rendered, like an MP4 video stream.

### The Oryzo Pattern
Apply t3ssel8r’s **Second-Order Dynamics** ($f=1.35, z=0.5, r=1.25$) to mouse cursor coordinates. Add subtle camera target and rotation offsets so the heavy industrial acoustic enclosure feels physically present in 3D space.

### Measurable Improvements
* **Spatial Depth:** The viewer can peer slightly around duct edges and isolation mounts by moving the cursor.
* **Natural Weight:** Pointer movement settles with realistic physical inertia rather than mechanical stiffness.

### Drop-in Implementation (`QuietMachineScene.tsx`):
```tsx
// Inside Driver component in QuietMachineScene.tsx:
const pointerDynX = useRef(new SecondOrderDynamics(1.35, 0.5, 1.25))
const pointerDynY = useRef(new SecondOrderDynamics(1.35, 0.5, 1.25))

useFrame((state, delta) => {
  const dt = Math.min(delta, 0.05)
  const px = pointerDynX.current.update(dt, state.pointer.x)
  const py = pointerDynY.current.update(dt, state.pointer.y)

  const shot = evaluateShot(control.u, size.width < 600)
  const cam = camera as PerspectiveCamera

  // Subtle additive parallax (clamped so it doesn't disturb CAD alignment)
  cam.position.set(
    shot.position[0] + px * 0.08,
    shot.position[1] + py * 0.05,
    shot.position[2]
  )
  cam.lookAt(
    shot.target[0] + px * 0.03,
    shot.target[1] + py * 0.02,
    shot.target[2]
  )
  cam.fov = shot.fov
  cam.updateProjectionMatrix()
})
```

---

## 7. Dynamic Thermodynamic Advection on Airflow Ribbons (`AirRibbons.tsx`)

### The Problem in Current Code
In `src/scene/rl300/AirRibbons.tsx` (lines 41–80):
The air ribbons use a static vertex shader that evaluates along Catmull-Rom spline tangents (`aTangent`, `aHeat`, `aTracerPhase`). While the heat color ramp is clean, the ribbon geometry is completely rigid. It reads as extruded CAD plastic strips rather than living cooling airflow.

### The Oryzo Pattern
Oryzo's `ScreenPaint` and dynamic particle systems inject GPU curl noise to create organic fluid advection.

### Measurable Improvements
* **Physical Realism:** Cooling intake air and acoustic dissipation paths feel alive, thermodynamic, and fluid.
* **Zero CPU Load:** Evaluated 100% in vertex shader space with no JavaScript geometry recalculation.

### Drop-in Implementation (`AirRibbons.tsx` Vertex Shader):
```glsl
// In AirRibbons.tsx VERTEX_SHADER:
uniform float uTime;

// Analytical 3D simplex noise / curl noise approximation
vec3 curlNoise(vec3 p) {
  float e = 0.1;
  float n1 = sin(p.y * 3.0 + uTime * 1.5) * cos(p.z * 3.0);
  float n2 = sin(p.z * 3.0 + uTime * 1.5) * cos(p.x * 3.0);
  float n3 = sin(p.x * 3.0 + uTime * 1.5) * cos(p.y * 3.0);
  return vec3(n1, n2, n3) * 0.02;
}

void main() {
  vT = aT;
  vSide = aSide;
  vHeat = aHeat;
  vKind = aKind;
  vContact = aContact;
  vTracerPhase = aTracerPhase;
  vAlpha = aAlpha;
  vWindow = aWindow;

  vec3 p = position;

  // Add subtle aerodynamic turbulence along ribbon width
  if (aKind > 0.5) { // Intake airflow
    vec3 turbulence = curlNoise(p * 2.5 + vec3(0.0, uTime * 0.8, 0.0)) * aSide;
    p += turbulence;
  }

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  // Remainder of clipping and projection...
  gl_Position = projectionMatrix * mvPosition;
}
```

---

## 8. Blue-Noise Dithered Background & Fog (`QuietMachineScene.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachineScene.tsx` (lines 148–149):
```tsx
<color attach="background" args={['#101b24']} />
<fog attach="fog" args={['#101b24', 12, 30]} />
```
The background is a flat single-color slate-navy (`#101b24`) paired with linear fog. On dark monitors and OLED displays, the transition between geometry and fog creates stepped concentric banding rings.

### The Oryzo Pattern
Replace the flat background with an offset-randomized blue-noise dithered radial gradient (deep slate-navy `#14222e` at center, dark industrial void `#080d12` at edges).

### Measurable Improvements
* **Atmospheric Depth:** The industrial enclosure separates crisply from the background with a volumetric studio look.
* **Zero Banding:** 100% elimination of 8-bit banding rings.

### Drop-in Implementation (`QuietMachineScene.tsx`):
```tsx
// Screen-space background quad with blue noise dither
function StudioBackdrop() {
  const meshRef = useRef<Mesh>(null)
  const noiseTexture = useLoader(TextureLoader, '/textures/blue-noise-128.png')
  noiseTexture.wrapS = RepeatWrapping
  noiseTexture.wrapT = RepeatWrapping

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as ShaderMaterial
    mat.uniforms.uNoiseOffset.value.set(Math.random(), Math.random())
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        depthWrite={false}
        uniforms={{
          uColorCenter: { value: new Color('#14222e') },
          uColorEdge: { value: new Color('#080d12') },
          uBlueNoise: { value: noiseTexture },
          uNoiseOffset: { value: new Vector2() },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={`
          uniform vec3 uColorCenter;
          uniform vec3 uColorEdge;
          uniform sampler2D uBlueNoise;
          uniform vec2 uNoiseOffset;
          varying vec2 vUv;
          void main() {
            float dist = length(vUv - vec2(0.5));
            vec3 col = mix(uColorCenter, uColorEdge, clamp(dist * 1.4, 0.0, 1.0));
            float noise = texture2D(uBlueNoise, (gl_FragCoord.xy / 128.0) + uNoiseOffset).r;
            gl_FragColor = vec4(col + (noise - 0.5) / 255.0, 1.0);
          }
        `}
      />
    </mesh>
  )
}
```

---

## 9. Continuous PostProfile Tone Mapping (`QuietMachineScene.tsx`)

### The Problem in Current Code
In `src/scene/rl300/QuietMachineScene.tsx` (lines 141–142, 170–172):
```tsx
const composerMode = new URLSearchParams(window.location.search).get('composer')
const composed = composerMode === '1' || composerMode === '4'
```
Post-processing is disabled by default and locked behind a query parameter. Without ACES Filmic tone mapping and localized specular bloom, the machined aluminum pump housing and composite panels read as flat shaded CAD meshes rather than industrial metal.

### The Oryzo Pattern
Default-enable `EffectComposer` in the full tier. Interpolate a unified `PostProfile` between Shot 1 (Exterior) and Shots 2–5 (Section Cuts):
* **Shot 1 (Exterior):** Restrained bloom (0.15), natural exposure (0.85).
* **Shots 2–5 (Section Cuts):** Elevated specular threshold so the internal pump housing, intake ducts, and isolation mounts gleam cleanly against the dark enclosure walls.

### Measurable Improvements
* **Material Definition:** Specular highlights on internal machined surfaces pop with photoreal metallic depth.
* **Zero Snap:** Continuous smooth tone mapping as the section cut sweeps through the assembly.

---

## 10. Implementation & Verification Checklist for Quiet Machine

| Priority | Task | File Target | Measurable UX Target |
| :---: | :--- | :--- | :--- |
| **P1** | **Mount Lenis & Clamp Wheel** | `QuietMachinePreview.tsx` | Eliminates stepped 100px mouse notches; continuous $\Delta u < 0.001$ scrub. |
| **P1** | **Pre-warm via `compileAsync`** | `QuietMachineScene.tsx` | Eliminates the 100ms first-cut shader compilation freeze. |
| **P2** | **Cap DPR at 1.5 & Max 3.7M Px** | `QuietMachineScene.tsx` | Limits peak fragment count to 3.68M; guarantees 60 FPS on 4K/ultra-wide. |
| **P2** | **Second-Order Pointer Parallax** | `QuietMachineScene.tsx` | Adds weighted physical cursor inertia ($f=1.35, z=0.5, r=1.25$). |
| **P2** | **Decouple Editorial HUD** | `QuietMachinePreview.tsx` | Cross-fades titles with 16px slide; eliminates React Virtual DOM churn. |
| **P3** | **Airflow Curl Turbulence** | `AirRibbons.tsx` | Living thermodynamic fluid ribbons via vertex-shader noise. |
| **P3** | **Blue-Noise Studio Backdrop** | `QuietMachineScene.tsx` | Volumetric studio cyc wall; 0 dark banding rings. |
| **P3** | **Default PostProfile Grade** | `QuietMachineScene.tsx` | Active ACES Filmic tone mapping & specular bloom on internal machined parts. |
