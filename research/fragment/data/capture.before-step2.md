# fragment.im — motion capture (sections 0, 1, 2, 3, 4b, 8, 8b)

## 0. Meta
- Site / URL: https://www.fragment.im/ (Fragment Studio — Paweł Świniarski, Gdynia, Poland; one-page-style designer portfolio with real routes `/work`, `/about`, `/contact`, `/pl`, `/work/{bsr,ewm,kadenco,gorilla}`, `/pp`) [seen: nav hrefs + footer]
- Captured by (model) and date: GLM agent (ZCode), 2026-11-13. REA `capture_browser_scenario` (own Chrome 157) + Playwright-scripted system Chrome for timing/perf probes, REA `analyze_web_bundle` on a live CDP target [seen]
- Viewport(s) tested: 1440x900 desktop / 390x844 mobile (DPR 3, iPhone UA, touch) [seen]
- Recording file (if any): screenshots + JSON in `research/fragment/data/` (`net-desktop.json`, `net-mobile.json`, `probes.json`, `probes2.json`, `pre-*.png`, `route-*.png`, `gpu-hero.png`, `no-webgl.png`, `reduced-motion.png`, `net-desktop/t*.png`, `net-mobile/t*.png`); downloaded chunks + source maps in `data/chunks/` [seen]
- Connection/context caveats: all runs headless (SwiftShader WebGL) except one headed GPU run for the scroll-perf sample. Home was captured on a fresh profile per run. No cookie banner appeared; nothing accepted. [seen]

## 1. Stack fingerprint  (GLM via REA)
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| three.js / R3F / OGL / Babylon / custom WebGL | none of these; 3D = Spline runtime **2.0.93** + one **raw-WebGL custom** component | `https://cdn.spline.design/@splinetool/viewer@2.0.93/build/spline-viewer.js` (1092 KB) + `unpkg.com/@splinetool/runtime@2.0.93/build/bevel.wasm` (57 KB); `<spline-viewer>` custom element with shadow-DOM canvas (attrs `loading`, `url`, `data-fragment-spline-watch`, `data-fragment-spline-ready`); no `THREE`/`WebGLRenderer`/`REVISION` strings in any chunk; custom WebGL2D in authored module `portrait_parallax_v1.js` (`canvas.getContext("webgl")`) | seen |
| GSAP core + plugins | **not used** | zero `gsap`/`ScrollTrigger` strings across `framer.mjs`, `motion.mjs`, `toplevel.mjs`, `script_main.mjs` | seen |
| Smooth scroll (Lenis, Locomotive, ScrollSmoother, native) | **native scroll** | no lenis/locomotive/scrollsmoother strings; native `scrollY`/`scrollTo` in runtime; `touch-action: auto` on html/body | seen |
| Framework | **Framer** (hosted) + **React 18.3.1**, bundled with **Rolldown** | response header `server: Framer/6d4c3c4`, `framer-site-id: 62b8c3e2…`, chunks at `framerusercontent.com/sites/1w0f0s83UjRlQ3a3DeRhZN/` incl. `rolldown-runtime.Bi-D_2cA.mjs`; React semver string `18.3.1` in `react.B4lOa1lM.mjs` | seen |
| Animation lib | **framer-motion** (Framer's `motion` chunk) | `motion.BuOgONYX.mjs` (50 KB transferred); symbols incl. `useReducedMotion`/`shouldReduceMotion`/`prefers-reduced-motion` (17 hits) | seen |
| Other | Spline viewer+wasm as above; Framer code components `FormattedNumberCounter`, `TickerContentWidth`, `ewm_before_after_slider_web`, `portrait_parallax_v1`, `spline_mobile_scroll` (chunk names) [seen]; `startViewTransition` string exists inside `framer.mjs` runtime but no visible transition choreography on nav [seen string / inferred not used visually]; **Rive / Lottie / Theatre.js / Howler / Barba / Swup: none** (grep false-positive check: "rive" hits were `getDerivedStateFromError`, `webdriver`, `driver`) | seen |

## 2. Asset inventory  (GLM via REA)
Desktop run (1440x900), transferred sizes over a ~15 s window incl. scroll-to-bottom (br/gzip wire sizes):

| Asset | Type | Size (KB, transferred) | Compression | Loaded when |
|---|---|---|---|---|
| `/` HTML document | html | 41 (610 KB decoded) | br | initial |
| `spline-viewer.js` (@splinetool/viewer 2.0.93) | js (3D runtime) | 1092 | br | lazy-idle (~2.7 s, after load, idle callback) |
| `scene.splinecode` home (desktop id `QzFYO-pwcQCbiF9t`) | 3D scene archive | 109 | proprietary compressed archive | lazy-idle (~3.2 s) |
| `bevel.wasm` (@splinetool/runtime 2.0.93) | wasm | 57 | n/a | lazy-idle (~3.6 s) |
| `xJJ6Y0KSk…mp4` 1920x1080 muted/loop/autoplay | video | ~1263 streamed (0+36+1227 in ranges) | h264 progressive | on-scroll (section enter, ~8.7 s) |
| `vX9nk7bsF3…mp4` 1920x1080 muted/loop/autoplay | video | ~307 streamed | h264 progressive | on-scroll (~9.6 s) |
| `HuAANlJxoX…mp4` | video (small clip/first range) | 25 | — | initial (~1.0 s) |
| Stack Sans Headline woff2 | font | 30 | woff2 | initial (font swap) |
| Stack Sans Text woff2 x2 | font | 30+30 | woff2 | initial |
| Fragment Mono woff2 | font | 25 | woff2 | initial |
| Logo/brand SVGs x3 (`P6Qr…`, `hKcj…`, `aZov…` at 183x40) | image/svg | 1–2 each | gzip | initial |
| `bgbVEEFIDq9…png` 80x80 (favicon/avatar) | image | 2 | png | initial |
| `p1FP15nWl4L…png` | image | 1 | png | initial |
| `N3s2PR6d4B1…png` (2560w wide strip) | image | 49 (`scale-down-to=1024`) | png | on-scroll (~6.0 s) |
| `eEMcE26nBsd…png` (3840w wide strip) | image | 70 (`scale-down-to=1024`) | png | on-scroll (~9.1 s) |
| Framer site JS chunks (48 files total) | js | 1551 total; largest own chunks: `framer.BIOwr9OE.mjs` 123, `motion` 50, `react` 45, `toplevel-deps` 31 | br | initial ~370 KB core; per-section chunks lazy/on-scroll |
| events.framer.com/script + beacons | js/analytics | ~11 | br | initial + beacons |
| `framer.com/edit` iframe + init (Edit-in-Framer badge) | iframe/js | ~6 | br | initial |
| Audio | — | **none requested** [seen] | — | — |

- Total initial transfer (KB): ~600–700 KB before load event (est. from per-item sizes: 41 html + ~330 own JS + 115 fonts + ~8 images + analytics) [inferred]; ~3.6 MB total measured through the 15 s window incl. lazy + scroll streams [seen]
- Total 3D payload (KB): 1258 (spline-viewer 1092 + scene 109 + bevel.wasm 57) [seen]
- Mobile gets different assets? **yes, partially** [seen]: different home `scene.splinecode` id `PHP6Gm7o6Xu4ObTR` (108 KB) vs desktop `QzFYO-pwcQCbiF9t` (109 KB) — a separate mobile scene build; same viewer/wasm/videos; images served at higher-resolution variants (`scale-down-to=2048`, 133 KB and 247 KB) due to DPR 3; mobile-specific wrapper chunk still named `spline_mobile_scroll.mjs` (loads on both).
- About page (`/about`, from route-transition capture) [seen]: portrait photo `3QYWdULZTZ…png` at `width=2000&height=2000`, depth-map `BCDLpqTDnuy…png` (asset bucket), and **three** additional `scene.splinecode` scenes (`r-GeM7GzPYPpPajD`, `Fs5omoRpmtrXHxMB`, `2byqvdPRUGrylKq9`) — About is media-heavy.
- Texture assets for the custom WebGL portrait = photo png + depth-map png, loaded only on the page that mounts the component, only on non-touch [seen request timing / seen source condition].

## 3. Load sequence  (GLM timeline, Gemini timing)
Desktop 1440x900, ms from navigation start (measured twice; values from probe run with addInitScript marks + CDP network timestamps):

| t (ms) | What appears | Driven by |
|---|---|---|
| 0 | navigation start | — |
| ~340 | DOMContentLoaded (41 KB br HTML, full SSG markup in DOM) | Framer SSG [seen] |
| ~500–770 | first paint / FCP 772–864: black preloader screen: centered white logo mark (three stacked shard parallelograms) + `LOADING PAGE` in mono caps | CSS/React mount [seen screenshots] |
| ~1000–1100 | `load` event (fonts, logo SVGs, small mp4) | native [seen] |
| ~1450 | `<spline-viewer url="https://prod.spline.design/QzFYO-pwcQCbiF9t/scene.splinecode" loading>` mounted inside section `data-framer-name="3D"` | React lazy mount [seen] |
| ~1595–1640 | lazy-idle chunks incl. `spline_mobile_scroll.BzAmz_XO.mjs`, `GbMC1mGnU.mjs` | Framer lazy chunk loader [seen] |
| ~2142 | canvas created inside `spline-viewer` shadow DOM (300x150 placeholder, later 1425x900) | Spline runtime [seen] |
| ~2756 | `spline-viewer.js` 1092 KB finished | idle-priority fetch [seen] |
| ~3235 | `scene.splinecode` finished | Spline loader [seen] |
| ~3612 | `bevel.wasm` finished | Spline loader [seen] |
| ~3600–5000 | preloader exits (still visible at 3.5 s [seen]; hero fully visible at 5.1 s [seen]); headline "One designer. Clear direction. Complete execution." + nav + START A PROJECT revealed | Framer loader component + scene-ready gate [inferred from timing correlation] |
| ~4000+ | interactive 3D: glossy rounded-square "fragment" shards cascade diagonally over the hero (echoes the logo mark) | Spline scene render [seen screenshot gpu-hero.png; exact first frame between 3.6–5 s, unknown] |

- Preloader: animated mark + text label; no counter/bar seen; real-vs-fake progress: unknown (no progress UI visible); exit correlates with Spline scene+wasm completion [seen stills / inferred gate]
- Time to first readable text (ms): ~770 (preloader label); main headline readable ~4000–5000 [seen]
- Time to interactive 3D (ms): ~4000 desktop (canvas 2142 + scene 3235 + wasm 3612; first shard render observed by 5–9 s marks) [seen components / inferred ~4 s]. Mobile: scene 4626 + wasm 5050 → ~5500–6500 [inferred from mobile network marks]
- Mobile load marks: commit 732, DCL 1069, FCP 1108, load 1815 [seen]

## 4b. Page and route transitions  (GLM + Codex)
- Library: Framer built-in SPA router (no Barba/Swup; `startViewTransition` string present in `framer.mjs` runtime but no visible VT choreography) [seen / inferred not-used-visually]
- What happens on link click (`ABOUT` → `/about`): no document reload — `window` flag survives navigation [seen]. No visible out-animation in the 200 ms still (old hero still on screen, no overlay/dim [seen]); new page fully rendered by the ~500 ms still (headline + portrait photo + ABOUT label) [seen]. Network during transition: About route chunk at +411 ms, `portrait_parallax_v1.mjs` +466 ms, portrait photo + depth map + **3 new scene.splinecode** files +411–955 ms, then idle [seen]. Content swap ≈ ≤400–500 ms; heavy media continues streaming afterwards [seen].
- Out-animation, canvas kept alive or rebuilt, in-animation, total ms: out = none observed; canvas = **rebuilt, not kept alive** — home `spline-viewer` + canvas unmounted, About mounts 3 fresh `spline-viewer` elements, every canvas marked NEW [seen]; in = direct render (subtle fade, if any: unknown); total ≈ 400–500 ms to full DOM, ~3 s until all About media in flight [seen]
- Does the 3D scene persist across pages? No — each page mounts its own Spline scene(s); back button returns to `/` and a fresh home spline-viewer remounts [seen]

## 8. Accessibility and fallbacks  (any model)
- prefers-reduced-motion honored? **Yes, explicitly.** Authored source of `PortraitParallax` reads `matchMedia("(prefers-reduced-motion: reduce)")`, pins pointer to (0,0), and calls `setActive(false)` under reduce [seen source]; framer-motion runtime carries `useReducedMotion`/`shouldReduceMotion` [seen]; live probe with `reducedMotion: 'reduce'`: 0 active animations [seen]. The Spline hero scene still loads and plays under reduce (3D not disabled) [seen].
- Text in DOM or only in canvas? **All text in DOM** (2795 chars `innerText`; all h1/h2 headings present as DOM nodes; 385 KB server-rendered HTML); canvases carry no text [seen]
- Pinch zoom allowed? **Yes.** `meta viewport = width=device-width` (no `user-scalable=no`), `touch-action: auto` on html/body [seen]; authored override `SplineMobileScroll` deliberately sets `touch-action: pan-y` at ≤809 px (and `none` on desktop) over the 3D area so vertical page scroll survives on touch [seen source]
- No-WebGL fallback? **Yes, layered.** PortraitParallax: static `<img>` photo rendered under the canvas; on WebGL unavailable, shader failure, or `webglcontextlost` it silently reveals the photo ("The static photo fallback is the final visible state after a WebGL failure." — code comment) and touch devices never create WebGL at all (`maxTouchPoints>0` / `any-pointer: coarse` bail before texture load) [seen source]; live no-WebGL run (`--disable-webgl --disable-webgl2 --disable-3d-apis`): page fully renders and stays usable; `spline-viewer` keeps its canvas element but the scene cannot draw (Spline's own degraded behavior: unknown) [seen]
- Extras: portrait has `role="img"` + `aria-label`; renderer pauses on `document.hidden` and via IntersectionObserver when offscreen; rAF loop self-stops when the pointer reaches its target (idle = zero rAF) [seen source]; canvas is `aria-hidden` [seen source]. Production wart: console error "This scene was created with a newer version of Spline (file format 134, this runtime reads 133)" on home desktop + no-WebGL runs [seen].

## 8b. Performance  (GLM via REA, Chrome Performance trace on a 10 s scroll)
Method: self-contained in-page sampling inside the capture browser (requestAnimationFrame delta array + `PerformanceObserver('longtask')`) during a scripted top-to-bottom scroll over exactly 10 s — Chrome DevTools trace was not used; two runs: (1) headless SwiftShader, (2) headed GPU-accelerated Chrome window [seen]
- Desktop FPS while scrolling (avg / worst): **38.4 avg / 1.4 worst-delta-frame** (GPU run; p90 frame 33.7 ms; 142 of 384 frames >30 ms; worst single frame 333 ms) [seen]. Headless software-WebGL run gave 14.7 avg — discarded as SwiftShader artifact, not representative [seen]
- Long tasks over 50 ms during load (count, worst ms): 1 × 55 ms on desktop load (headless); during GPU scroll: **0** [seen]
- JS transferred (KB), largest bundle: **~1551 KB** total JS across 48 files; largest single file is the third-party `spline-viewer.js` at 1092 KB; largest first-party bundle `framer.BIOwr9OE.mjs` at 123 KB [seen]
- GPU memory or texture count, if REA exposes it: unknown (not exposed by REA or CDP in this setup) [unknown]
- Mobile behaviour (degraded, disabled, same): same runtime with a dedicated lighter mobile scene build (separate scene id); perf not measured on device — unknown [seen scene difference / unknown perf]
- Load-side: FCP 772 ms desktop / 1108 ms mobile; load event ~1.1 s / ~1.8 s [seen]. Scroll jank source is GPU rendering of the Spline scene (0 long tasks ⇒ not main-thread JS) [inferred from 0 long tasks + many >30 ms frames]
