# webdrift.be — motion/3D capture (GLM via REA + self-hosted CDP probes)

## 0. Meta
- Site / URL: https://www.webdrift.be/en (redirects to /en; NL at /)
- Captured by (model) and date: GLM-4.7 (ZCode agent, REA MCP + local CDP client), 2026-11-13
- Viewport(s) tested: 1440x900 desktop / 390x844 mobile (CDP device-metrics + iPhone UA emulation)
- Recording file (if any): none (no video); evidence in `research/webdrift/data/*.json` (desktop-inventory, cold-inventory, mobile-inventory, rm-reduce-inventory, nowebgl-inventory, route-click-work, perf-scroll-10s-forced, cold-canvas-timing2) and REA scenario evidence `ev_e429…`
- Method notes: REA `capture_browser_scenario` network capture (desktop), REA `inspect_web_page` (no-WebGL DOM), everything else via a local Node CDP client (`research/webdrift/tools/cdp.mjs`) against 4 self-launched headless Chrome 157 instances. No bot-check/Cloudflare interstitial was encountered. Only the public page was loaded; no forms submitted, no consent given beyond page defaults.

## 1. Stack fingerprint
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| three.js (raw, no R3F/React layer) | r186 | canvas `#gl-c` attr `data-engine="three.js r186"`; lib chunk `2tcte8fxmh-o3.js` contains `revision:"186"` register event; app chunk creates `new t.WebGLRenderer({canvas, antialias:!0, alpha:!0, powerPreference:"high-performance"})` | [seen] |
| GSAP core | version string not exposed (module-scoped); 57 core-token hits | chunk `271d7upkv9vei.js` | [seen] |
| GSAP plugins | ScrollTrigger (scrub/pin values in code); Flip present in bundle; ScrollSmoother strings are ScrollTrigger-internal cleanup, NOT used by the site | `271d7upkv9vei.js`: `scrub:!0`, `scrub:.4/.5/.6/.8/1`, `pin:!0`, `start:"top 90%",end:"center 45%"`; SplitText and CustomEase ABSENT | [seen] |
| Smooth scroll | Lenis 1.3.26, desktop-only (`window.lenisVersion="1.3.26"`), `new sj({lerp:.07, wheelMultiplier:1, gestureOrientation:"vertical"})` gated by `matchMedia("(min-width: 992px)")`; wired `g.on("scroll", …)` into ScrollTrigger | `271d7upkv9vei.js` @148629 + runtime `window.lenis` object; mobile: `window.lenis` absent (native touch scroll) | [seen] |
| Framework | Next.js App Router, React `19.3.0-canary-cbb046ab-20260731`, Turbopack runtime (`turbopack-2tldop0mkzdkx.js` chunk), Vercel hosting (`x-vercel-cache`, `x-nextjs-prerender` headers), Sanity CMS content (dataset `05zanele/darkroom`, cdn.sanity.io images, one Sanity-client chunk `1fapnvdcpi2ec.js`) | network headers + chunk contents | [seen] |
| Other | Page transitions: native `document.startViewTransition` + custom `vt-fwd`/`vt-back` overlay classes + gsap `.pt-label` timeline. Analytics: Leadfeeder (`lftracker_v1_*.js`). NO Rive, Lottie, Theatre.js, Barba, Swup, Howler (all absent from all 15 chunks) | `271d7upkv9vei.js` @195292; absences verified by fingerprint scan | [seen] |

## 2. Asset inventory
| Asset | Type (glb/gltf/ktx2/basis/hdr/exr/mp4/webm/splat/ply) | Size (KB, transferred) | Compression (Draco/Meshopt/KTX2) | Loaded when (initial / lazy / on scroll) |
|---|---|---|---|---|
| geist_mono…woff2 | font | 23.4 | woff2 | initial (preloaded via `<link rel=preload>`) |
| host_grotesk…woff2 | font | 20.6 | woff2 | initial (preloaded) |
| pixelify_sans…woff2 | font | 12.3 | woff2 | initial (preloaded) |
| 13 JS chunks (Next/Turbopack, react-dom, gsap+lenis+app, sanity client) | js | ~263 total (largest app chunk `271d7upkv9vei.js` 75.1 / `07v142o5owpy6.js` 66.2) | brotli/gzip over TLS (`content-encoding`) | initial, one wave at t≈1170ms |
| `2tcte8fxmh-o3.js` (three.js library) | js | 190.4 transferred / 737.7 decoded | brotli | lazy — dynamically imported after hydration, t≈2835–3787ms |
| Sanity images (jpg/webp, `?w=640&auto=format&q=80`) | texture/photo | transfer recorded 0 (served from cache in probe profiles); exact bytes unknown | CDN-resized + webp auto-format | 2 on initial desktop load (t≈1646); 1 on mobile; more via `loading=lazy srcset` (menu/sections) |
| 3D models, HDR/EXR, KTX2, video, audio | none | — | — | absent — zero `.glb/.gltf/.hdr/.ktx2/.basis/.mp4/.webm/.mp3/.wav/.ply/.splat` strings in all 15 chunks and zero such requests [seen]; the 3D scene is fully procedural (PlaneGeometry + ShaderMaterial + BoxGeometry + MeshBasicMaterial in code) [seen] |

- Total initial transfer (KB): ~510 (44 KB document+icon, 56 KB fonts, ~263 KB initial JS, ~190 KB lazy JS ≈ 453 KB JS total; images 0-from-cache in probes, real bytes unknown)
- Total 3D payload (KB): 190 transferred / 738 decoded — and it is code only, no asset files
- Mobile gets different assets? no — identical chunk set and byte totals (510,418 B desktop = mobile) [seen]; mobile renders the same canvas with backing store capped to ~500px width despite DPR 3 (canvas 500x773 for 485 CSS px) [seen]; mobile initial load fetches one fewer Sanity image (responsive srcset) [seen]

## 3. Load sequence
| t (ms) | What appears | Driven by (CSS / GSAP / WebGL / video) |
|---|---|---|
| 0 | navigation start (desktop, cold cache, Vercel edge) | — |
| 786 | document response (TTFB high due to remote region; warm/mobile runs 174–377) | — |
| 900 | first-paint / first-contentful-paint (desktop warm run: 900; mobile warm: 672) | SSR HTML + inline 89KB CSS (style tag in head) |
| 959–1260 | 3 preloaded woff2 fonts land (Host Grotesk, Geist Mono, Pixelify Sans) | CSS font-swap |
| 1170–2380 | main JS wave: react-dom, Next router, gsap+ScrollTrigger+Flip+lenis wrapper, Sanity client (13 chunks) | Next/Turbopack |
| 1248 | DOMContentLoaded; DOM interactive (full SSR content incl. split-text spans, aria labels) | SSR |
| 1646–2030 | first 2 Sanity hero/section images | native `<img>` |
| 1808 | FCP on cold run; hero H1 "Pixels change. Taste stays." readable (in DOM from SSR) | CSS |
| ~1800–2600 | retro "Webdrift Installer 1984" boot overlay plays ("Installing 1-bit charm", "Time remaining: 42 years", "Please do not turn off your computer", Skip button), then "Restarted in 1984 … OK" dialog | SSR DOM + JS |
| 2662 | load event | — |
| 2835–3787 | three.js chunk fetched via dynamic import (after hydration), app scene init: WebGLRenderer, setPixelRatio(min(dpr,2)), scene with ShaderMaterial plane + boxes, render loop starts | WebGL |
| ≈2900–4100 | interactive 3D (canvas present + stable rAF ticks observed at 2.3–4.1s across runs; cold-bound estimate ≈3.8–4.2s) | WebGL |

- Preloader: themed fake installer screen — progress copy is comedic, NOT real asset progress (no progress bar/counter tied to loading) [seen DOM copy; fake = inferred from copy + absence of any progress-wiring in code]
- Time to first readable text (ms): 1808 cold / ~900 warm (FCP; text is SSR'd so earlier paints are meaningful)
- Time to interactive 3D (ms): ≈2900–4200 (three.js chunk ready 3787 cold; canvas+stable rAF observed 2532–4143ms in reload runs) [seen bounds]

## 4b. Page and route transitions
- Library: Next.js App Router client navigation + native View Transitions API (`document.startViewTransition`) with direction classes `vt-fwd`/`vt-back` added to an overlay, plus a gsap timeline animating `.pt-label` on completion; minimum ~1200ms transition window (code `setTimeout(t,1200)` in the same handler) [seen code]
- What happens on link click (probed: `a[href="/en/work"]` from /en): RSC payload fetch only (`/en/work?_rsc=…`), zero new JS chunks [seen]; direction class set, `startViewTransition` snapshot-fades pages [seen code; visual style inferred]; total ≈1.2s+ [seen code constant]
- Does the 3D scene persist across pages? no — hero canvas is unmounted on navigation (`hasCanvas:false` after transition; canvas lives inside `SECTION.hero.grain > DIV.gl`, `position:absolute`, 100vh) [seen]; each page re-runs its own scene init; RSC-only fetch keeps JS bundles resident [seen]

## 8. Accessibility and fallbacks
- prefers-reduced-motion honored? partially, by design: 3 `prefers-reduced-motion` CSS media blocks [seen]; Lenis wrapper defaults `respectReducedMotion:!0` and Lenis only instantiates on ≥992px viewports with smooth wheel — under `reduce` emulation the page loads the identical asset set, still mounts the WebGL canvas, content identical [seen A/B runtime]; GSAP/ScrollTrigger behavior under `reduce` not directly observable in this capture — unknown
- Text in DOM or only in canvas? fully in DOM: hero H1 with `aria-label` + server-rendered per-char/per-line spans (`data-split`, `data-lw`, `aria-hidden` dupes), `sr`-only headings, all sections as HTML; canvas carries no text content [seen DOM]
- Pinch zoom allowed? yes — `viewport` meta `width=device-width, initial-scale=1` (no user-scalable/max-scale), `touch-action:auto` on html/body, `body{overflow:hidden auto}` (x-hidden only) [seen]
- No-WebGL fallback? graceful: renderer creation is wrapped in try/catch returning null [seen code]; with WebGL disabled the page runs normally — full DOM content, Lenis works, no error UI — leaving a dead default-size 300x150 canvas in `.gl` (blank area, no message) [seen runtime]; `matchMedia` GPU probe caps DPR to 1 when the unmasked GPU renderer string is unavailable, else cap 2 [seen code]

## 8b. Performance
- Desktop FPS while scrolling (avg / worst): 58.2 avg fps, p50 frame 17ms, worst 66ms, 0.5% of frames over 50ms — 10.1s synthetic full-page wheel scroll (top→bottom, 12,464px) measured with in-page rAF delta sampling + PerformanceObserver `longtask`, frame production forced via a temporary CDP screencast to defeat headless throttling (method disclosed) [seen]. Without the forcing, headless samples 18.6 fps with 284ms worst gap — that gap is headless BeginFrame throttling, not site cost [inferred from zero long tasks]
- Long tasks over 50 ms during load: 0 observed in the 10s scroll window (longtask observer supported) [seen]; during initial load not separately traced — unknown
- JS transferred (KB), largest bundle: ~453 KB total over 14 chunks (decoded ~1.4 MB); largest `2tcte8fxmh-o3.js` (three.js) 190 KB transferred / 738 KB decoded; app chunk `271d7upkv9vei.js` 75 KB / 200 KB decoded [seen]
- GPU memory or texture count, if REA exposes it: not exposed by these probes — unknown; GPU string seen via WEBGL_debug_renderer_info (ANGLE D3D11, tested on AMD Radeon 780M) [seen]
- Mobile behaviour (degraded, disabled, same): same bundles; canvas backing ~500px wide for 485 CSS px (aggressive DPR cap ≈1 despite DPR 3 — resolution-degraded for perf) [seen]; no Lenis (native touch scroll) [seen]; fewer initial images [seen]
- Page weight context: single canvas (one WebGL2 context), zero model/texture/video/audio assets, zero long tasks while scrolling — the perf budget goes to code (453 KB JS) not payload [seen]
