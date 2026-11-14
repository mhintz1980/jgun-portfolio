# Motion capture template (one per site)

Fill one copy per site at `research/<slug>/capture.md`. Every model writes into the same headings so the merge is mechanical.
Slugs: oryzo, fragment, gq-extraordinary-lab, dennypratama, webdrift, rikoutaku, vastworld.

Rules for every field
- Mark each claim **[seen]** (in code, network log or recording) or **[inferred]** (your read). No unmarked claims.
- Record techniques and parameters, never copied assets, shader source or proprietary code. Short identifiers and config values are fine.
- Unknown is a valid answer. Write `unknown` instead of guessing.

---

## 0. Meta
- Site / URL:
- Captured by (model) and date:
- Viewport(s) tested: 1440x900 desktop / 390x844 mobile
- Recording file (if any):

## 1. Stack fingerprint  (GLM via REA)
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| three.js / R3F / OGL / Babylon / custom WebGL | | | |
| GSAP core + plugins (ScrollTrigger, SplitText, Flip, MorphSVG, CustomEase…) | | | |
| Smooth scroll (Lenis, Locomotive, ScrollSmoother, native) | | | |
| Framework (Next, Nuxt, Astro, Webflow, vanilla) | | | |
| Other (Rive, Lottie, Theatre.js, Barba/Swup page transitions, Howler) | | | |

## 2. Asset inventory  (GLM via REA)
| Asset | Type (glb/gltf/ktx2/basis/hdr/exr/mp4/webm/splat/ply) | Size (KB, transferred) | Compression (Draco/Meshopt/KTX2) | Loaded when (initial / lazy / on scroll) |
|---|---|---|---|---|
- Total initial transfer (KB): 
- Total 3D payload (KB):
- Mobile gets different assets? yes / no / unknown

## 3. Load sequence  (GLM timeline, Gemini timing)
| t (ms) | What appears | Driven by (CSS / GSAP / WebGL / video) |
|---|---|---|
| 0 | | |
- Preloader: none / counter / bar / animated mark — real progress or fake?
- Time to first readable text (ms):
- Time to interactive 3D (ms):

## 4. Scroll system  (Codex)
- Smooth-scroll lib + settings (lerp, duration, easing, wheelMultiplier, smoothTouch):
- Pinned sections (selector, start, end, scrub value):
- Does scroll move the 3D camera, the object, or 2D layers?
- Keyboard / anchor / back-button still work? yes / no
- Scroll velocity effects (skew, stretch, RGB split tied to speed):

## 4b. Page and route transitions  (GLM + Codex)
- Library (Barba, Swup, Next/Nuxt router, View Transitions API, custom):
- What happens on link click: out-animation, canvas kept alive or rebuilt, in-animation, total ms:
- Does the 3D scene persist across pages?

## 4c. Micro-interactions  (Codex + Gemini)
| Element | Trigger (hover / press / focus / drag) | What changes | Duration | Easing |
|---|---|---|---|---|
- Magnetic buttons, cursor followers, link underlines, image hover distortions:

## 5. Motion beats  (one row per effect; Codex writes settings, Gemini writes timing)
| # | Section | Trigger (load / scroll range / hover / click) | What moves | Property | From → To | Duration or scroll span | Easing | Stagger | Feel in 3 words |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | |

## 6. 3D scene  (Codex + GLM)
- Hero object(s) and polycount (if visible):
- Camera: perspective / ortho, FOV, path (spline, keyframes, orbit):
- Lighting: baked / env map (HDR) / real-time lights / matcap:
- Materials: PBR / custom shader / transmission / toon:
- Post-processing (bloom, DOF, grain, chromatic aberration, color grade):
- Shader tricks named in code (noise displacement, fresnel, dissolve, clipping planes, instancing):
- Pointer interaction (parallax tilt, drag orbit, physics):
- Frame-rate safeguards (DPR cap, pause offscreen, quality tiers):
- Render loop: own rAF, GSAP ticker or R3F frameloop; does it stop when idle?
- Canvas: fixed full-screen behind DOM, or per-section? Resize handling:
- Scroll-to-3D binding: how scroll progress reaches the scene (uniform, camera position, timeline progress):

## 7. Type, color, layout  (Gemini)
- Typefaces (family, weights) and how many:
- Palette (hex) and how many:
- Text animation style (split chars / lines / scramble / mask reveal):
- Cursor treatment:

## 8. Accessibility and fallbacks  (any model)
- prefers-reduced-motion honored? 
- Text in DOM or only in canvas?
- Pinch zoom allowed?
- No-WebGL fallback?

## 8b. Performance  (GLM via REA, Chrome Performance trace on a 10 s scroll)
- Desktop FPS while scrolling (avg / worst):
- Long tasks over 50 ms during load (count, worst ms):
- JS transferred (KB), largest bundle:
- GPU memory or texture count, if REA exposes it:
- Mobile behaviour (degraded, disabled, same):

## 9. Verdict for Mark's portfolio  (Claude merges)
- Top 3 techniques worth rebuilding, each in one line, with how it maps to a CAD assembly (exploded view, section cut, assembly reveal):
- Cost to rebuild (S / M / L):
- Skip because:
