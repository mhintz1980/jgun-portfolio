# dennypratama.com — motion capture (GLM via REA)

## 0. Meta
- Site / URL: https://dennypratama.com/ (Denny Pratama — product designer portfolio; Awwwards nominee ribbon visible top-right **[seen]**)
- Captured by (model) and date: GLM (ZCode agent, REA MCP + own-headless-Chrome perf script), 2026-11-13
- Viewport(s) tested: 1440x900 desktop (DPR 1) / 390x844 mobile (DPR 3); both via REA `capture_browser_scenario`, own Chromium 157.0.8103.79 headless profile
- Recording file (if any): no video; REA evidence records (network logs, DOM, per-step screenshots) retained in session; perf numbers from a scripted rAF/long-task sampler in a private Chrome instance

## 1. Stack fingerprint  (GLM via REA)
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| three.js / R3F / OGL / Babylon / custom WebGL | **custom raw WebGL2 raymarcher** (no three/R3F/OGL/Babylon — zero library markers in any chunk) | `canvas.gl` + `getContext("webgl2",{alpha:!1,antialias:!1,powerPreference:"high-performance"})` in `/_next/static/immutable/chunks/2omj144u1v5-f.js`; fragment shader `TUNNEL_FS` exported from chunk `08gtj1i3xp5zr.js` (`#version 300 es`, `out vec4 fragColor`, uniforms `uRes uTime uRo uCam uTan uTun uEnd uKey uAccent uSteps`); full-screen-triangle `drawArrays(P.TRIANGLES,0,3)` | [seen] |
| GSAP core + plugins | **GSAP 3.15.0** bundled with ScrollTrigger, ScrollSmoother, Flip | `F.version="3.15.0"` + `registerPlugin` in `chunks/1e46krqq5tz9z.js`; second copy in `chunks/249alxhww9wiw.js`. Home-page components show **no direct gsap/ScrollTrigger calls** — animation is hand-rolled rAF + scroll progress; gsap likely present for other routes (blog RSC payload references it) | [seen] (bundle), [inferred] (usage on other routes) |
| Smooth scroll | **Lenis** (`lerp: 0.1`, `anchors: {offset: 0}`, `wheelMultiplier: 1`, `smoothWheel`) | `new p({lerp:.1,anchors:{offset:0...` in `chunks/3-e1zveau6j0n.js`; `<html lang="en" class="... lenis">` at runtime; `data-lenis-prevent` attribute used on scrollable panels; `lenis.scrollTo(...)` used by hero anchor/dive logic | [seen] |
| Framework | **Next.js (App Router) on Turbopack, Vercel-hosted** | response headers `x-nextjs-prerender`, `x-vercel-cache`, `x-vercel-id`, `x-matched-path`; chunk `turbopack-1byz1flvc-bu1.js`; `/_next/static/immutable/chunks/*` paths; `?_rsc=` prefetch payloads | [seen] |
| Other | No Rive, no Lottie, no Barba/Swup, no Howler, no Theatre.js (all markers absent from every chunk). Canvas-2D used by per-route mini-hero previews. `/api/track` analytics beacon (27 B response) fires per load/route. | marker scan across all 20+ chunks; network log | [seen] |

React-DOM client chunk `2ploe-l44knmp.js` (230 KB decoded) — exact React version string unresolved in minified output: unknown.

## 2. Asset inventory  (GLM via REA)
| Asset | Type (glb/gltf/ktx2/basis/hdr/exr/mp4/webm/splat/ply) | Size (KB, transferred) | Compression (Draco/Meshopt/KTX2) | Loaded when (initial / lazy / on scroll) |
|---|---|---|---|---|
| `/` HTML document | html | 72.3 KB decoded (brotli on the wire) | brotli | initial |
| `38ornfmwrfpoc.css` | css | 119.9 KB decoded / ~26.8 KB transfer | brotli | initial |
| `2ploe-l44knmp.js` (react-dom) | js | 230.1 KB decoded / 73.7 KB transfer | brotli | initial |
| `3rabdfv2awqjv.js` (Next router runtime) | js | 131.0 KB decoded / 36.8 KB transfer | brotli | initial |
| `249alxhww9wiw.js` (GSAP+ScrollTrigger copy) | js | 70.2 KB decoded / 28.9 KB transfer | brotli | initial |
| `2omj144u1v5-f.js` (Hero GL component + next/image) | js | 51.8 KB decoded / 18.8 KB transfer | brotli | initial |
| `1e46krqq5tz9z.js` (GSAP 3.15.0 + ST/Smoother/Flip) | js | 43.3 KB decoded / 18.6 KB transfer | brotli | initial |
| `3-e1zveau6j0n.js` (Lenis + layout shell) | js | 35.4 KB decoded / 12.5 KB transfer | brotli | initial |
| `08gtj1i3xp5zr.js` (TUNNEL_FS raymarch shader module) | js | 7.6 KB decoded | brotli | at hydration (right after window load) |
| 10 smaller route/prefetch chunks | js | 7–31 KB decoded each | brotli | initial + idle prefetch |
| `/_next/image?url=%2Fimg%2Ftun-hero-bw.webp` | image (AVIF output of a WebP source) | 9.1 KB @ w=1920 desktop; 6.6 KB @ w=1200 mobile | AVIF | initial (`priority`, `fetchPriority=high`) |
| `/img/grain.webp` | image texture (film-grain overlay, CSS `opacity:.07`) | 24.2 KB | WebP | initial |
| Main font `21ca8f3f56c22ca2-s.p...woff2` | font (variable, `iX1fDW_variable` class) | 90.1 KB | woff2 (none further) | initial |
| `_next/image?...work-dennypratama.jpg`, `...draw-dennypratama.webp` | images | 26.0 / 31.6 KB (desktop w=1920); 19.3 / 25.5 KB (mobile w=1200) | AVIF/WebP | on scroll (work section, at page bottom) |
| `/previews/digital-revo/logo-revo.svg` + `Switzer-Medium/-Regular.woff2` | svg + fonts (embedded mini-site preview content) | 2.9 + 19.6 + 16.7 KB | br / woff2 | on scroll (preview sections at bottom) |
| 3D models / video / audio | **none on home** — zero .glb/.gltf/.ktx2/.hdr/.mp4/.webm requests; the "3D" is procedural shader content | 0 | — | — |

- Total initial transfer (KB): **~748 KB all resources, of which JS ≈ 334 KB transferred** (resource-timing `transferSize`, desktop run) **[seen]**
- Total 3D payload (KB): **0 KB of model files** — 3D = ~18.8 KB transferred shader+driver code + a 9.1 KB image not even used as a GL texture **[seen]**
- Mobile gets different assets? **Partly**: same JS/CSS bundles; next/image serves smaller srcset variants (w=1200 vs w=1920); fewer RSC route prefetches (nav links collapsed into menu). **[seen]**

## 3. Load sequence  (GLM timeline)
| t (ms) | What appears | Driven by (CSS / GSAP / WebGL / video) |
|---|---|---|
| 0 | navigation start | — |
| ~200–260 | HTML complete (72.3 KB); next/font variable font starts; hero AVIF requested | document |
| ~300 | main CSS in; `.ld` loader overlay visible (dark bg + animated logo mark + degree counter); all page CSS animations paused (`has-intro:not(.ld-go) * {animation-play-state:paused}`) | CSS |
| ~450–850 | all critical JS chunks in (Turbopack runtime → react-dom → router → gsap → lenis → Hero GL component); `grain.webp` in | JS |
| ~850–1000 (right after window load) | `08gtj1i3xp5zr.js` (TUNNEL_FS shader module), `/api/track`, RSC prefetch of /, /work, /about, /blog, /contact | JS/fetch |
| ~1000–1200 [inferred] | React hydration completes; Hero mounts `canvas.gl`, creates WebGL2 context, `gl-on` class set; raymarcher renders behind the loader | WebGL |
| ~2750–3500 [inferred from CSS `--d0:2.75s`] | `ld-go` set → loader out, hero text ("I design it." / "I build it."), HUD "000° / Scroll to go through the slash" play in via CSS animations | CSS |
| 3500+ | page scroll-live; Lenis driving; deeper sections/preview chunks load on scroll (work images, `/previews/digital-revo/*` seen at bottom in both viewports) | JS/Lenis |

- Preloader: **animated mark + degree counter** (`.ld-mk` SVG paths with `pathLength="100"` stroke-draw, `.ld-deg` numeric `NNN°` readout, corner labels "denny pratama" / "Portfolio 2026"); gated on real readiness (`ld-go` class appears only after load+h=ydration; a `.ld-stuck` fallback exists). Real progress semantics: the counter ties to the intro timeline, not byte progress — [inferred]; the readiness gate is [seen].
- Time to first readable text (ms): ~2750–3500 (loader-out); all text is real DOM before that but visually introduced by the intro **[inferred]**; HTML contains full text at ~260 ms **[seen]**
- Time to interactive 3D (ms): ~1000–1200 GL rendering behind loader [inferred from chunk/waterfall timing]; fully interactive (scroll dive responsive) at intro end ~3500 [inferred]

## 4b. Page and route transitions  (GLM + Codex)
- Library: **Next.js App Router client navigation**; no Barba/Swup/View-Transitions-API markers anywhere in the bundles **[seen]**
- What happens on link click (home → /work, 1440x900, sampled at click+0 s and click+2.07 s): URL swaps to /work, document title swaps ("Work · Denny Pratama"), nav active link gains a white parallelogram marker, page content swaps to the Work page (giant "Work 09" heading, filter pills, project list); during the nav the site fetched 1 new route chunk (`23ezmypientp_.js`, 25.9 KB decoded), 2 work-card images (w=1080), and re-fired `/api/track` **[seen]**. Out/in animation styling was not resolvable at the two sampled instants — no full-page curtain was visible at +2.07 s; total nav ≈ 1–2 s **[seen]**; finer out-animation detail: unknown
- Does the 3D scene persist across pages? **No.** `/work` DOM contains **zero `<canvas>` elements**; the home raymarch hero unmounts with its route. Only the `site has-grain ld-go` shell (grain overlay) persists; `gl-on` class is dropped **[seen]**. RSC prefetch of `/work/dennypratama` fired immediately after arrival (intent prefetch) **[seen]**

## 8. Accessibility and fallbacks  (any model)
- prefers-reduced-motion honored? **Yes, multiple layers** **[seen]**: (1) Hero GL checks `matchMedia("(prefers-reduced-motion: reduce)")` and disables the tunnel, writing reason to `canvas.gl[data-why="reduced motion is on"]`; (2) CSS `@media (prefers-reduced-motion:reduce)` blocks (menu transitions zeroed, `translate:none`); (3) Quotes slider and footer pointer-parallax components early-return under the same query; (4) `?tunnel=force` URL param can override the touch/low-end gate (not the reduced-motion one)
- Text in DOM or only in canvas? **All text in DOM.** Hero H1 is `.sr` (visually hidden but real), all section copy, nav, HUD labels are DOM nodes; canvases are `aria-hidden="true"` decorative layers **[seen]**
- Pinch zoom allowed? **Yes** — `<meta name="viewport" content="width=device-width, initial-scale=1">`, no `user-scalable=no`/`maximum-scale` **[seen]**
- No-WebGL fallback? **Yes, explicit** — `.gl-fail .gl{display:none}` CSS; capability gate disables GL for: reduced-motion, low-end touch phones (`(hover:none) && !iOS && (hardwareConcurrency≤4 || deviceMemory≤3)` → `data-why="low-end phone"`), and context loss (`webglcontextlost` handler sets `gl-fail`, records reason, and restores scroll into `.story` via Lenis). `<noscript>` style hides the loader and force-runs all CSS animations so content is readable without JS **[seen]** (code + CSS; behavior on a real no-WebGL device [inferred])

## 8b. Performance  (GLM via REA)
Method: **self-contained rAF-delta + PerformanceObserver('longtask') sampling in a private headless Chrome 157 instance** (1440x900, real GPU: ANGLE AMD Radeon 780M D3D11), scripted window.scrollTo top→bottom over 10 s after intro; not a DevTools trace.
- Desktop FPS while scrolling (avg / worst bucket): **56.5 fps avg**; buckets 59.5 / 49.5 / 53.5 / 60 / 59.5 fps; worst single frame **233.5 ms** (mid-page, where preview mini-heroes mount) **[seen]**
- Long tasks over 50 ms during 10 s scroll: **2** (worst **121 ms**, total 180 ms); rAF frames >50 ms: 5, >100 ms: 3 **[seen]**. Long tasks during initial load: not separately measured — unknown
- JS transferred (KB), largest bundle: **334 KB JS transferred**; largest `2ploe-l44knmp.js` (react-dom) 73.7 KB transferred / 230.1 KB decoded **[seen]**
- GPU memory or texture count, if REA exposes it: not exposed — unknown. Render-buffer stats are in DOM: `canvas.gl width=893 height=558 data-q="0.62"` — DPR capped `min(devicePixelRatio,1.5)` × quality 0.62, raymarch step count via `uSteps` adaptive **[seen]**
- Mobile behaviour (degraded, disabled, same): same bundles; smaller image variants; GL **disabled by design** on low-end touch phones (gate above), kept on iOS; mobile tilt via `deviceorientation` (gamma/30, (45−beta)/30) with iOS permission request on first tap **[seen in code]**; measured on real phone: unknown (not tested)

**Site-specific notes worth keeping:** scroll system is Lenis (lerp 0.1) + hand-rolled scroll-progress math writing CSS vars (`--p` 0→1 over a ~10-viewport tall pinned hero, `--deg` 0→180, `--bk`, `--cp`, `--qr`); the hero "3D" is a **raymarched SDF tunnel of the logo mark** (13 extruded 11-vertex frames spaced 6.4 units, each rotated +15°, blueprint outlines + graph grid + accent slash-wall glow + white end light + ACES + grain + vignette in one fragment shader); render loop skips drawing when scroll position and pointer are idle. `/work` and other routes drop WebGL entirely.
