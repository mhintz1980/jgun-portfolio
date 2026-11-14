# Capture — GQ x Audemars Piguet "The Extraordinary Lab"

https://www.gq.com/sponsored/story/the-extraordinary-lab

## 0. Meta
- Site / URL: https://www.gq.com/sponsored/story/the-extraordinary-lab (GQ sponsored longform; the article page is a full-screen take-over hosting a Nuxt interactive served from https://interactive.gq.com/audemars-piquet-gq-rd5/)
- Captured by (model) and date: GLM (ZCode agent) via REA MCP + Playwright/CDP probes, 2026-11-13
- Viewport(s) tested: 1440x900 desktop / 390x844 mobile (iPhone UA, DSF 3, touch)
- Recording file (if any):
  - REA evidence `ev_6f43c85bb218fda47ba94cf8169101d6acace9ee808c99d8c1698b9cc1665f8b` — desktop initial-load network capture, 1440x900, 878 retained events, response bodies for files < 64 KB [seen]
  - `research/gq-extraordinary-lab/net-desktop2.json` (340 requests, transferred bytes), `net-mobile2.json` (258 requests) — Playwright CDP network logs [seen]
  - `research/gq-extraordinary-lab/perf2.json`, `reduced2.json`, `nowebgl3.json`, `route2.json`, `arrival.json` — probe outputs [seen]
  - `research/gq-extraordinary-lab/shot-*.png` — timed screenshots (loader 2.5/5/8 s, app-loaded hero, intro scene, subtitle scene) [seen]
  - Static bundle scans of the embed's public JS (downloaded once for string-level analysis, then deleted): `scan-entry.cjs`, `scan-chunks.cjs`, `scan-context*.cjs`, `scan-versions.cjs` remain as method records [seen]
- Important structural fact: the GQ article DOM is essentially empty (`body` innerText was 10 chars; `document.scrollHeight` = viewport height). The whole experience is one fixed, full-screen WebGL app; the page never scrolls. Wheel input is captured by Lenis as a virtual scroll. [seen]

## 1. Stack fingerprint
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| three.js (no R3F/OGL/Babylon) | **r172** | canvas attribute set by the engine itself: `setAttribute("data-engine", "three.js r" + rev)` with `const rev="172"` in entry chunk `BIhX5qj-.js`; canvas in DOM carries `data-engine` + Vue scope attr `data-v-824a61b9` [seen] |
| GSAP core | **3.12.5** | `version="3.12.5"` string in entry chunk [seen] |
| GSAP plugins | ScrollTrigger + CustomEase (bundled). No Flip / SplitText / MorphSVG / ScrollSmoother (string hits were substring false positives; verified 0 real occurrences) | `ScrollTrigger.create`, `defaults({scroller:window})`, `registerEase("_CE", CustomEase.create)` in entry chunk [seen] |
| Smooth scroll | **Lenis 1.1.20** (virtual scroll — the document cannot scroll; Lenis captures wheel/touch over the app container) | `window.lenisVersion="1.1.20"`; Lenis options in entry chunk: `content: domTarget.children[0], lerp: check()?1:.05, wheelMultiplier: 2.1, touchMultiplier: …, syncTouch: true` [seen] |
| Framework | **Nuxt 3.11.2** (Vue 3 shell; GQ main site itself is Condé Nast "Verso" React SSR with webpack chunks at /verso/static/*) | `appName:"nuxt", versions:{nuxt:"3.11.2", vue: app.version}` + console error `[nuxt] Cannot load payload /audemars-piquet-gq-rd5/_payload.json` [seen] |
| Choreography | **Theatre.js 0.7.2** (core + React studio code bundled) | `Theatre_CoreBundle … get version(){return "0.7.2"}`; scene chunk holds `_theatre`, `_onTheatreUpdated`, per-section `_theatre.data["sensorialLayer"+n].watchRotation`, and post-FX Theatre objects `theatreObjects={fishEyeObj, rgbShiftObj, filmgrainObj, vignetteObj, lumafilterConfigObj, bloomConfigObj, …}` [seen] |
| GPU tiering | **detect-gpu 5.0.70** (fetches benchmark DB from unpkg at runtime) | `benchmarksURL: "https://unpkg.com/detect-gpu@5.0.70/dist/benchmarks"`, `failIfMajorPerformanceCaveat` option; unpkg request observed in network log [seen] |
| Audio | Native WebAudio (no Howler/Lottie/Rive/Barba/Swup found anywhere — searched all chunks) | `new AudioContext`, `_globalGainNode`, `unmute(){…linearRampToValueAtTime(0,t+e)}`, `setAudioAnalyser` store action [seen] |
| Loader/asset stack | three.js GLTFLoader + DRACOLoader (+ `/webgl/libs/draco/draco_decoder.wasm`, 287 KB) + KTX2Loader (bundled, no .ktx2 asset seen) + Meshopt decoder strings + RGBELoader (.exr) | DRACO/KTX2/meshopt strings in entry chunk; draco wasm in network log [seen] |

## 2. Asset inventory
Origin of all embed assets: `https://interactive.gq.com/audemars-piquet-gq-rd5/`. Sizes below are transferred bytes (CDP `encodedDataLength`), desktop run unless noted. [seen unless noted]

| Asset | Type | Size (KB, transferred) | Compression | Loaded when |
|---|---|---|---|---|
| `assets/BIhX5qj-.js` (entry) | js | 1632 | **none** (wire size ≈ file size — not gzipped) [seen] | initial |
| `assets/CROz8He7.js` (scene chunk) | js | 1021 | none [seen] | initial (dynamic import right after entry) |
| `assets/C4irFK9B.js` (Theatre.js) | js | ~763 (file size) | unknown | initial/lazy boundary not resolved |
| `assets/BGl2_TTZ.js` + tiny chunks | js | 124 + ~6 | unknown | initial |
| `assets/HomePage.Dqy6SVbs.css` | css | 49 | unknown | initial |
| `webgl/global/models/watch_compressed.glb` | glb | **4598** | Draco (decoder wasm fetched at same moment; "_compressed" name) — geometry compression [inferred], file not inspected | initial (during loader) |
| `webgl/global/models/scene_compressed.glb` | glb | **2705** | Draco [inferred] | initial |
| `webgl/geometry/sensoriallayerthreearms.glb` | glb | 148 | Draco [inferred] | initial |
| `webgl/pbr/watch1/2/3.exr` (3 files) | exr | 1172 each | EXR | initial (per-table reflection/light probes) |
| `webgl/pbr/*/…-specular-RGBM.png`, `…-diffuse-RGBM.webp`, table glow masks | png/webp | 1026 each (specular), 100–436 (rest) | RGBM-encoded LDR textures (custom name convention) [seen naming] | initial |
| `webgl/lut/senselayertwo.3DL`, `finallut.3DL` | 3DL LUT | 438 each | Adobe cube LUT text format | initial |
| `webgl/sensoriallayers/conceptone/lakepoints.json` (+`lakepoints2.json`) | json (point cloud / line data) | 482 + 3 | none (plain JSON over XHR) | initial |
| `webgl/libs/draco/draco_decoder.wasm` + wrapper | wasm/js | 287 + 59 | wasm | initial (on first glb) |
| `video/sectionthree/table3atlas1.mp4` | mp4 (texture atlas video) | 3493 | h264 [inferred] | on entering section three [seen: arrived only after scene clicks] |
| `video/sectionone/sectionone.mp4` | mp4 | 1086 | h264 [inferred] | on entering section one |
| `images/sensorial_layer/**` (SL1/SL2/SL3 webp poster sequences + mp4s) | webp/mp4 | several hundred KB each | webp/h264 | on entering the matching sensorial scene |
| `audio/voiceover/**` mp3 + `subtitles/EN/*.vtt` | mp3/vtt | voiceover sizes not captured (range requests); vtt 1.5–4.4 | — | on scene entry (lazy) |
| `audio/sfx/*.mp3` (hover 1–4, transition 1–2, ambient_lab, ambient_sensorial) | mp3 | ~20 KB hover, 71 KB transition, ambient not captured | — | hover/transition sfx preloaded initial; ambient lazy |
| GT-America-Standard-Medium/Regular.woff2 | font | 22.6 + 21.6 | woff2 | initial |
| GQ hero image `media.gq.com/photos/.../GQxAP 150 Site.png` | png | 16:9 w_1600 desktop / 1:1 w_960 mobile (responsive variants) [seen] | png | initial |

- Total initial transfer (KB): desktop ~36,200 KB in the measured 27 s window including ad-tech and post-click video; embed-only before first interaction ≈ **13,500 KB** (JS 2,838 + 3D ~10,700) [seen]. Whole-window mobile capture: 18,011 KB with the two big GLBs still streaming at 9 s — true mobile total unknown.
- Total 3D payload (KB): ~**10,700 KB** initial + ~4,600 KB video on scene entry [seen]
- Mobile gets different assets? **No for the 3D experience** — identical interactive.gq.com URLs on both viewports [seen]; only site-level images (hero crop), ads and martech differ. Same 1.63 MB entry JS on mobile.

## 3. Load sequence
Timings from headless Chrome 157, cold cache, 1440x900; nav start = 0. Multiple runs: canvas mount varied 7.5–8.3 s; treat ±0.5 s. [seen]

| t (ms) | What appears | Driven by |
|---|---|---|
| 0 | navigation start | — |
| ~280 | first byte/commit of GQ document (901 KB SSR HTML) | document |
| ~340 | embed entry `BIhX5qj-.js` requested from interactive.gq.com (REA log t=+341 ms) [seen] | script tag in article markup |
| ~450 | GT America woff2 fonts + ~25 GQ Verso/webpack chunks | font preload + hydration |
| ~600 | readable text exists in DOM behind loader (72-char intro banner string) [seen] | Nuxt SSR shell |
| ~1400–2000 | first WebGL context created (renderer constructed before assets finish) [seen: 1438/2036 ms across runs] | three.js WebGLRenderer |
| ~1600 | worst long task of load: 1144 ms (entry JS execution) [seen] | JS parse/eval |
| 3300 | DOMContentLoaded | — |
| ~3400–7000 | loader phase: black screen, centered "GQ × AP" lockup; GLBs (7.3 MB), EXRs, RGBM textures, LUTs, lakepoints, draco wasm download | asset manager during loader |
| ~7500–8300 | `<canvas>` (1440x900 CSS; backing store 2160 px → DPR 1.5) mounted; loader still covers | Vue app mounts canvas |
| ~9000–12000 | loader releases; hero title "THE EXTRAORDINARY LAB" + blueprint scene visible; intro banner "FOLLOW A STORY TOLD BY CAM WOLF…", bordered button "CLICK ANYWHERE TO ENABLE SOUND", headphone icon; "BACK"/"SOUND" chrome | app ready |
| 14600 | window `load` event [seen in one run] | — |

- Preloader: **GQ × AP lockup on black; the "×" separator morphs into a thin horizontal progress line between the logos** [seen in screenshots at 2.5/5/8/12 s]. Percentage/counter: none. Real vs fake progress: unknown (line growth not correlated with byte counts).
- Time to first readable text (ms): ~600 in DOM, but visually ~9000–12000 (behind opaque loader) [seen]
- Time to interactive 3D (ms): **~8000** canvas mounted / **~9000–12000** hero scene interactive (click accepts sound + starts story) [seen]

## 4b. Page and route transitions
- Library: **none — single route**. The experience has exactly one internal link in the whole DOM (the GQ logo → `https://www.gq.com/`); no other same-origin route links exist [seen]. History API unused during the experience: zero pushState/replaceState calls recorded while clicking through scenes [seen].
- What happens on link click: clicking anywhere in the scene advances the story (intro → chapters); prev/next chevrons (‹ ›), "SKIP INTRO" and "BACK" UI drive in-app scene changes. Observed sequence: hero → cinematic intro (sky over curved horizon, "SKIP INTRO") → voiceover subtitle scenes ("J BALVIN AP COLLECTOR — Thank you for having me here."). Out/in: camera flight between per-section scene centers + watch quaternion slerp tweened by GSAP (`ease:"sine.inOut"` and a custom ease; section transitions carry `mainSceneCenter:{x,y,z}` + `watch:{rotation quaternion}`) [seen code + screenshots; exact curve values in hotspots.md].
- Canvas kept alive or rebuilt: kept alive — one canvas element for the whole session, count stays 1 across all interactions; URL never changes [seen]. Full navigation away (clicking the logo) would be a normal MPA load — not exercised (would leave the experience).
- Does the 3D scene persist across pages? There are no other pages; scene persists across all in-app sections [seen].

## 8. Accessibility and fallbacks
- prefers-reduced-motion honored? **No evidence of it.** Ran with `reduce`: app mounts identically (canvas, 2 WebGL contexts, same UI/audio prompt) [seen]; literal `prefers-reduced-motion` string absent from all embed bundles [seen]. Whether individual tween durations shorten could not be ruled out, but no gating path was found: effectively unknown→no.
- Text in DOM or only in canvas? **Both.** UI chrome, intro banner, chapter headings (`<h2>` "Audemars Piguet DNA", "I/II/III …" — also the SEO skeleton) and voiceover subtitles are real DOM text [seen]; the composite post shader additionally draws a subtitle gradient band and an audio-reactive waveform line (`subtitleGradient`, `audioLine = texture(…)` uniforms), i.e. part of the caption styling happens in-shader [seen code].
- Pinch zoom allowed? **Yes** — `<meta name="viewport" content="width=device-width, initial-scale=1">`, no user-scalable/maximum-scale restrictions [seen].
- No-WebGL fallback? **None observed.** Simulated WebGL-unavailable (getContext stubbed to return null before page scripts): the Vue app still mounts, canvas element stays in DOM with UI text on top, no image/video/error fallback replaces the scene (canvas would simply render nothing) [seen via simulation; a real GPU-less device was not tested]. Code has a `failIfMajorPerformanceCaveat` capability check and a `fallback-normal.webp` texture exists, but no fallback scene path was observed [seen].

## 8b. Performance
Method: self-contained headless Chrome 157 (Playwright, own profile, port-free) — in-page `requestAnimationFrame` delta sampling + `PerformanceObserver(longtask, buffered)`; NOT a Chrome DevTools trace (shared-browser contention avoided). Page cannot scroll, so "while scrolling" is "while the animated scenes run". [seen method]

- Desktop FPS while scrolling (avg / worst): idle animated scene **avg 33–46 FPS** across two runs (headless, vsync-less — treat as relative); **worst single frame 1435–1701 ms**, occurring at scene transitions (click-advance). Long-run steady-state frames are otherwise 8–24 ms. [seen]
- Long tasks over 50 ms during load (count, worst ms): **43** over the init→3-clicks window (desktop), worst **1144 ms** at ~1.6 s (entry chunk execution); cluster of 60–400 ms tasks during the 1–5 s asset-init phase. Mobile (iPhone emulation): **34** long tasks in the load window. [seen]
- JS transferred (KB), largest bundle: embed JS **2,838 KB** total — largest `BIhX5qj-.js` **1,632 KB wire** (uncompressed, see §2); GQ site/ads add ~5,400 KB JS on top. [seen]
- GPU memory or texture count: not exposed by tooling — unknown. Rendered DPR: canvas backing 2160 px at 1440 CSS px = **1.5 render scale** on a DSF-1 display [seen]; composer has per-pass `dpr` config and `lowPerfMode` reduces FBO buffering (2→1) and throttles the mouse fluid sim to every 2nd/4th tick [seen code].
- Mobile behaviour (degraded, disabled, same): **same content, degraded timing** — canvas mounted after 9–10 s (vs 7.5 s desktop), the two big GLBs still transferring at 9 s, no video prefetch before interaction, 34 load long-tasks [seen]. `device.mobile` switches `_performanceMode` (fluid-sim tick throttling) [seen code].
- Notable: entry/scene JS ships **uncompressed** (~2.7 MB wire for two files whose sizes match raw bytes) — biggest single cheap win available to this site. [seen]
