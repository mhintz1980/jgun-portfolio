# oryzo.ai — motion capture (REA + CDP)

## 0. Meta
- Site / URL: https://oryzo.ai/ — "ORYZO AI", a satirical smart-coaster product page; `meta author: Lusion` [seen]. Single-page site, scrollHeight ≈ 51,040 px at 1440x900 (≈63 viewport-heights) [seen].
- Captured by (model) and date: GLM (ZCode agent) via REA MCP tools + custom CDP scripts (Node 22, own headless Chrome 157 instances), 2026-11-13 [seen].
- Viewport(s) tested: 1440x900 desktop (headless; perf run re-done with `--use-gl=angle --use-angle=d3d11`, renderer = AMD Radeon 780M) / 390x844 mobile via CDP device-metrics override (390x844, DPR 3, mobile UA, touch 5pt) [seen].
- Recording file: no video; REA screenshot evidence `ev_57fa85d4…` (desktop viewport, 1424x805 PNG) [seen]. Raw JSON captures in `research/oryzo/data/` (net-desktop, net-mobile, net-reduce, scrollperf-*:desktop/gpu2/gpu-gentle, dom-desktop/mobile/nowebgl, glinfo/nowebgl) [seen].
- Bot checks: none encountered; no Cloudflare interstitial, no cookie banner on load [seen].

## 1. Stack fingerprint
| Library | Version | Evidence (file or global) | [seen]/[inferred] |
|---|---|---|---|
| WebGL | three.js **r178, forked** | `REVISION="178 - modified by Lusion"` in `/_astro/hoisted.CRsATKbF.js`; live canvas attr `#canvas[data-engine="three.js r178 - modified by Lusion"]`; 1 WebGL2 fixed canvas + five 2D canvases | seen |
| GSAP core + plugins | **No GSAP core. Only SplitText 3.14.2 embedded standalone** (no ScrollTrigger/Flip/CustomEase/MotionPath/DrawSVG strings anywhere) | license header `/*! * SplitText 3.14.2 * https://gsap.com` @ offset 763,558; `SplitText.register(window.gsap)` fallback never resolves (no global gsap) | seen |
| Smooth scroll | **Fully custom in-house engine** (`ScrollPane` class): native body-height scrolling + smoothed `targetScrollPixel`, wheel normalizer (normalize-wheel util, SPIN 800), friction 2.1→1.9 weighted, `wheelEaseCoeff=12`, snap-point list, `getEaseInOutOffset` ease-in-out snap, `history.scrollRestoration="manual"`. No Lenis/Locomotive/ScrollSmoother (0 string hits) | @1,048,595–1,053,000; `_onNativeScroll`, `addToSnapList` | seen |
| Framework | **Astro** static output, no islands (0 `astro-island`): `/_astro/index.TL6TuoJb.css`, `/_astro/hoisted.CRsATKbF.js` (single app bundle), `/_astro/SplatsWorker-DSMxtdkh.js` worker chunk. Served via Cloudflare (cf-ray/cf-cache-status headers; document zstd) | seen |
| Other — Rive | **@rive-app/canvas 2.37.0** + `rive.wasm` from unpkg + `/rive/oryzo.riv` (58 KB, fetched twice → two Rive canvases `#sustainability-rive-canvas-harvesting/text`) | seen |
| Other — Gaussian splats | `.sog` splat models (`/splats/props.sog`, `/splats/table_reflection.sog`) rendered by custom `class Splats extends Object3D` splatting shader (`alpha=min(0.99, vColor.a*exp(power))`, TAA jitter include) + **Rust→WASM depth sorter "splatsorter"** in worker (`splatsorter_new/sort/sort24`) | seen |
| Other — video | **Vimeo Player API** embed, hero reel `VIDEO_LIST={MAIN_VIDEO_REEL:"https://player.vimeo.com/video/1174820580?h=5aaa6219d2"}` `controls=0&dnt=1`; `VideoOverlay` class; plus 2 local mp4s (yoga/bite, muted loop playsinline) | seen |
| Other — text | **MSDF** SDF text in WebGL: `/fonts/msdf/Inter.json` + `Inter.webp` atlas (37 msdf string hits) | seen |
| Other — post FX | **SMAA** (smaa-search/area textures), **3D LUT** color grade (`LDR_RGB1_0.png`), blue-noise dither, `postprocessing.blendProfile(APPLE_PROFILE, ratio)` profile blending, custom fboHelper render-target pipeline | seen |
| Other — lighting | Baked **spherical-harmonics** texture pairs (`harmonics_0/1` webp/avif/png) + BRDF LUT (`/textures/brdf.png`) + per-object env maps (`env_hero/env_hand/env_table/grip.webp`) | seen |
| Other — page transitions | Custom `RouteManager`+`PageManager` with `_fetchHtml` + popstate, but `pageList=[homePage]` — routing scaffolding with a single page. No Barba/Swup/View Transitions (0 hits) | seen |
| Absent | Lottie, Theatre.js, Howler, jQuery, Pixi, Babylon, WebGPU rendering (string appears only in support checks), audio (Settings has `AUDIO_PATH="/audios/"` but zero audio requests) | seen |

No source maps ship (`//# sourceMappingURL` absent from both chunks) — original source filenames/line numbers unknown [seen].

## 2. Asset inventory
Format notes: geometry ships as **custom `.buf` binary containers** (XHR), not glTF/glb; no Draco/KTX2/Basis markers found — compression internal to the format is unknown. Textures are WebP/AVIF/PNG. Splats are `.sog` (self-organizing-Gaussian compressed splats). Almost everything is requested during initial load (aggressive loader prefetch); almost nothing loads on scroll. Sizes = transferred KB, desktop cold run [seen].

| Asset | Type | Size (KB, transferred) | Compression | Loaded when |
|---|---|---|---|---|
| `/_astro/hoisted.CRsATKbF.js` | js | 296.7 (1,072.1 decoded) | minified, no sourcemap | initial |
| `/_astro/index.TL6TuoJb.css` | css | 13.3 (67.6 decoded) | brotli | initial |
| `/_astro/SplatsWorker-DSMxtdkh.js` | js worker+wasm glue | 0.3 (3.2 decoded) | minified | initial (~10 s; wasm splatsorter inlined) |
| `use.typekit.net/pmn6ngx.css` | css (kit) | 0.9 | — | initial |
| `/fonts/Literata.woff2` | font | 107.8 | woff2 | initial |
| `/fonts/DM-Mono-400-Latin.woff2` | font | 14.8 | woff2 | initial |
| `/fonts/msdf/Inter.json` + `Inter.webp` | MSDF text atlas | 2.5 + 23.7 | json+webp | initial |
| `video_thumb.webp` | poster img | 9.4 | webp | initial (Vimeo poster) |
| `textures/brdf.png` | BRDF LUT | 12.2 | png | initial |
| `textures/smaa-search/area.png` | SMAA | 0.4 + 32.7 | png | initial |
| `textures/LDR_RGB1_0.png` | color LUT | 47.9 | png | initial |
| `textures/gobo/gobo_b/c_*.avif` | gobo light masks | 163.0 + 162.0 | avif | initial |
| `textures/hero/*` — `BASE.webp` 411.3, `AI_HAND.webp` 204.0, `pencil_color/alpha` 74.5+4.9, `eraser` 21.9+2.2, `cutter` 114.4+5.2, `pen` 36.6+4.4, `paperclip1-3` ~40 total, `env_hero` 8.6, `env_hand` 5.6, `env_hand_spec_20` 1.4 | sketch-world textures (color+alpha pairs) | ≈ 1,010 | webp | initial |
| `models/hero_camera.buf` 2.6, `coaster_hero_animation.buf` 3.2, `hand.buf` 372.4, `hand_animation.buf` 40.8 | camera + object keyframe tracks, geometry | 419.0 | custom .buf | initial |
| `textures/wearable/*` — `condom_anim.webp` 412.9, `base.avif` 23.3–46.8 ×4, `harmonics_0/1.avif` 30–35 ×4, `1.webp` 41.5, `1_clip` 7.5, `pin` 34.7, `rise` 7.6, `normal.png` 1.7, `pattern.png` 1.6, `wearable_text` 12.4 | wearable textures | ≈ 700 | webp/avif/png | initial |
| `models/wearable/condom_front/back.buf` 411.4 + 309.7, `coaster_first.buf` 1.9 | geometry | 723.0 | custom .buf | initial |
| `models/featuresAnimations/CAMERA_ANIM/COASTER_ANIM/COFFEE_ANIM.buf` 8.6+7.8+7.9, `COASTER_FLIP_ANIM.buf` 2.6, `stack_camera.buf` 1.3 | keyframe tracks | 28.2 | custom .buf | initial |
| `models/COFFEE_BEAN.buf` 7.7 + `coffeeBean/DIFF,HEIGHT.webp` 6.2 | bean geometry+texture | 13.9 | .buf+webp | initial |
| `textures/coaster/DIFF.webp` 267.0, `HEIGHT.webp` 269.9, `STACK.webp` 89.2 + `models/coaster.buf` 65.7 | coaster set | 691.8 | webp+.buf | initial |
| `splats/props.sog` | gaussian splat scene | 3,020.8 | SOG (compressed splats) | initial — largest file; finishes last (~11.5 s cold / ~5.6 s warm) |
| `splats/table_reflection.sog` | splat reflections | 475.3 | SOG | initial |
| `textures/table/DESK.webp` 730.2, `DESK_HD.webp` 654.5, `cork_closeup.webp` 301.4, `PINBOARD.webp` 67.7, `WALL.webp` 9.6, `microscopic` 57.8, `WATERBEAR` 61.1+33.2 | desk-set textures | ≈ 1,916 | webp | initial |
| `models/table/…` — PINBOARD.buf 523.3, COFFEE/COVER 441.0, LABEL 405.7, water_bear 410.6, CUP 93.1, DESK 14.3, WALL 1.0, TRAY_COVERS 4.4; `models/BARK.buf` 271.9 | desk-set geometry | ≈ 2,165 | custom .buf | initial |
| `textures/coffee/LABEL.webp` 87.5, `BASE_COLOR` 42.6, `cover-specular` 12.0, `smoke/base+harmonics` 51.3, `sustainability/bark.webp` 506.9, `thermal_gradient` 0.5 | coffee/bark | ≈ 700 | webp/png | initial |
| `textures/sketches/sketches_a/b.png` | sketch overlays | 204.6 + 166.1 | png | initial |
| `rive/oryzo.riv` | Rive doc (fetched ×2) | 58.1 ×2 | riv | initial |
| `unpkg.com/@rive-app/canvas@2.37.0/rive.wasm` | Rive runtime | transfer 0.0 (cross-origin, timing opaque; ~150 KB on disk) | wasm | initial |
| Vimeo `player.vimeo.com/video/1174820580` | hero video stream | unknown (cross-origin stream) | hls/dash | initial (oEmbed json + iframe at ~4.3–5.5 s) |
| `images/wearable-gallery/*.webp` + thumbs (yoga, bikini, glasses, pocket, shoulder…) | gallery stills | ≈ 480 total | webp | initial (~8.5 s) |
| `images/wearable-gallery/yoga.mp4`, `bite.mp4` | video | 0 at load (range probe only; bite fetched during scroll) | mp4 | **lazy** — DOM-injected ~9.1 s; playback fetch on scroll |
| `images/testimonies/*.webp`, `images/social-content/*.webp` | meme/testimonial images | ≈ 1,000 | webp via **blob: URLs** | **lazy** — injected on section activation (~10–12 s) |
| audio | — | **none requested** (no `.mp3/.wav/.ogg` in log despite `/audios/` path constant) | — | — |

- Total initial transfer (KB): **desktop ≈ 14,998 KB (14.6 MB)**; mobile run **≈ 6,615 KB (6.5 MB)** [seen]
- Total 3D payload (KB): desktop ≈ **14,300 KB** (buf 3,543 + sog 3,496 + webp/avif/png textures ≈ 7,300) ≈ 95% of the page [seen]
- Mobile gets different assets? **yes** — explicit `_MOBILE` variants for most textures and both splats: `BASE_MOBILE.webp`, `AI_HAND_MOBILE.webp`, `condom base/harmonics` switch AVIF→PNG on mobile, `props_MOBILE.sog` (1,639 vs 3,021 KB), `table_reflection_MOBILE.sog`, `DESK_MOBILE.webp`, `BARK_MOBILE.buf`, `COFFEE_BEAN_MOBILE.buf`, smaller gallery/testimony images. Geometry `.buf` for hand/condom/coaster/coffee table models is identical on both [seen].

## 3. Load sequence
Desktop cold run (fresh profile; note this run's HTML response took ≈3.4 s to first byte — server/edge latency artifact, not page behavior; the same request order on a warm edge starts at ≈0.4 s and FCP lands at ≈1.1 s, seen in reduce-run/mobile-run). Times are ms from navigationStart [seen].

| t (ms) | What appears | Driven by (CSS / GSAP / WebGL / video) |
|---|---|---|
| 0 | navigation start | — |
| 3399–3673 | HTML (71.6 KB zstd) finishes; `<canvas id="canvas">` + 5 more canvases parsed from static HTML at 3439–3575 | static Astro HTML (canvases are server-rendered markup) |
| 3399–3641 | CSS 67.6 KB + `hoisted.CRsATKbF.js` 1,072 KB decoded | initial fetch |
| 3576–3581 | webmanifest, typekit css | initial |
| 3959–4044 | Literata + DM Mono woff2 | fonts |
| 4004 | **first paint / FCP** — 2D preloader visible | preloader canvas |
| 4000–5230 | bundle eval + scene boot — long tasks 133 ms + **1002 ms** | JS |
| 4327–4617 | Vimeo oEmbed; `rive.wasm` | JS fetch |
| 5179–5302 | brdf + SMAA + LUT textures | three.js post pipeline init |
| 5523–8307 | Vimeo iframe mounts (hero reel) | iframe |
| 5598–6790 | hero sketch world: gobo avifs, `BASE.webp`, `oryzo.riv` ×2, `hero_camera.buf`, `coaster_hero_animation.buf`, `hand.buf` + anim, `AI_HAND.webp`, pencil/eraser/cutter/pen/paperclip color+alpha pairs | three.js scene assets |
| 6405–7780 | wearable section: condom textures/models, features/camera anim bufs, coffee bean, coaster | three.js |
| 8173–11473 | desk world: `props.sog` 3.0 MB, `table_reflection.sog`, DESK/DESK_HD/PINBOARD textures, big table models, bark | splats + three.js (long tasks 819 ms @8396, 304 ms @9299) |
| 8531–8722 | wearable-gallery stills | img |
| 9132 | wearable-gallery videos injected (yoga/bite mp4), section canvases re-attached | JS (ScrollRange activation, not IO) |
| 9566–10252 | `oryzo.riv` re-fetched ×2 (Rive canvases activate) | Rive |
| 10079 | SplatsWorker chunk + blob-image wave (testimonies/social) | worker + section activation |

- Preloader: **custom GLSL mask-reveal post pass**, not a DOM spinner — `preloaderFrag` uniforms `u_hideRatio`, `u_maskRatio` (`math.fit(l,0,.5,0,1)`), 6-tap blur (defines `BLUR_SAMPLE:6`), vignette, blue-noise dither `hash13(vec3(gl_FragCoord.xy,u_ditherSeed))`, gamma 2.2. **Real progress**: ratios are driven by the loader's actual load ratio `l` (`properties.loader.add(...)` queue) [seen].
- Time to first readable text (ms): **≈1,100 warm** (FCP 1120, reduce-run); DOM text exists in the HTML stream before that [seen].
- Time to interactive 3D (ms): **≈3,300 after HTML arrival** (all hero-scene assets complete: camera/hand/coaster tracks + AI_HAND texture at ≈6,790 absolute in the cold run); full preloader completion including splats ≈8,000–11,500 absolute. [inferred from asset completion timing; the mapping code is seen]

## 4b. Page and route transitions
- Library: custom `RouteManager` + `PageManager` (popstate, `_fetchHtml`, `onRouteChanged`) but **`pageList=[homePage]` — a single registered route**; no Barba/Swup/View Transitions API [seen].
- What happens on link click: **there are no internal page links** — the only same-origin anchors are `/terms_and_conditions.pdf` and `/privacy_policy.pdf` (documents, not routes). Nothing to animate out/in; click behavior on the PDFs was not exercised (avoided downloads) [seen].
- Does the 3D scene persist across pages? Yes, trivially — one document, one persistent fixed WebGL canvas for the whole 51k-px scroll; the page never navigates [seen + inferred].

## 8. Accessibility and fallbacks
- prefers-reduced-motion honored? **No.** 0 occurrences of `prefers-reduced-motion`/`reduced` in the JS bundle and in the CSS; an emulated `reduce` load fetched the identical ~15 MB asset set, mounted the same canvases, and ran the same animations [seen].
- Text in DOM or only in canvas? **Real DOM text** for all headings/copy; SplitText duplicates it into `aria-hidden` char/line spans while the parent heading keeps `aria-label` (screen-reader-safe split pattern); body innerText ≈1,201 chars desktop / 5,492 mobile [seen].
- Pinch zoom allowed? **No** — `meta viewport: width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` [seen].
- No-WebGL fallback? **No dedicated fallback, but no crash**: with WebGL disabled (`--disable-3d-apis`), the page still reaches `complete`, keeps all 6 canvases in the DOM (blank), and all text/content remains readable (bodyText 6,585). No poster image or message replaces the 3D [seen].
- Keyboard scrolling: arrows/PageUp/PageDown handled by the custom scroller (`ArrowUp/Down` = ±100 px steps, PageUp/PageDown/Home supported) [seen].

## 8b. Performance
Method: self-launched Chrome instances (no shared browsers) + custom CDP rAF-sampling script (10 s top-to-bottom auto-scroll; PerformanceObserver longtasks). GPU run verified via `WEBGL_debug_renderer_info` = AMD Radeon 780M (D3D11 ANGLE). A first headless run without GPU flags rendered WebGL on **SwiftShader (CPU)** and gave a meaningless 3.7 fps — discarded as methodology artifact [seen].

- Desktop FPS while scrolling (avg / worst-case):
  - **Human-speed scroll (first ~2,000 px over 10 s): avg 48 fps**, p95 frame gap 39.7 ms, worst gap 251 ms, 12 gaps >50 ms, **0 main-thread long tasks** [seen]
  - **Teleport scroll (all 51,040 px in 10 s — worst case, triggers every section's first-time init): avg 5 fps**, worst gap 4,141 ms, 15 long tasks (worst 4,149 ms) [seen]
- Long tasks over 50 ms during load: **11** (durations 50–**1,002** ms; worst = bundle eval + scene boot at ≈4.2 s; second 819 ms at ≈8.4 s = desk-world/splat init; 304 ms, 283 ms, 190 ms… texture decodes) [seen]
- JS transferred (KB): **297.4 KB total**; largest bundle `hoisted.CRsATKbF.js` 296.7 KB transferred / **1,072 KB decoded** (single minified bundle, no sourcemap; only other site JS = 3.2 KB worker glue) [seen]
- GPU memory or texture count: unknown — not exposed by the tooling [unknown]
- Mobile behaviour (390x844, DPR3, iPhone UA): same single bundle and scene; `_MOBILE` asset set cuts transfer to ≈6.6 MB (−56%); videos only range-probed (0.6 KB) instead of fetched; Rive/splats both still active. Not perf-sampled (headless mobile emulation is not representative) [seen]
