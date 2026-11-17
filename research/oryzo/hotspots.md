# oryzo.ai — scroll / animation / 3D driver map (hotspots)

Site ships **no source maps** (`//# sourceMappingURL` absent) and no original filenames — everything below is in the production chunks. The app bundle is a single-line minified file, so locations are given as **byte offsets** in the downloaded copy (`research/oryzo/data/js/hoisted.CRsATKbF.js`, 1,097,812 bytes), which can be searched with the included grep tool (`research/oryzo/work/grep.mjs <file> <pattern> <maxHits> <ctx>`). Original line ranges: **unknown**. All identities below are [seen] (string/context evidence in the bundle or live DOM).

## Files
| File | Bytes | Role |
|---|---|---|
| `https://oryzo.ai/_astro/hoisted.CRsATKbF.js` | 1,097,812 (296.7 KB wire / 1,072 KB decoded) | the whole app: three.js fork + scenes + scroll engine + text splitting + Vimeo + Rive wiring + splat renderer |
| `https://oryzo.ai/_astro/SplatsWorker-DSMxtdkh.js` | 3,271 (3.2 KB) | Rust→WASM glue for gaussian-splat depth sorting ("splatsorter") |
| `https://oryzo.ai/_astro/index.TL6TuoJb.css` | 67.6 KB decoded | layout + fonts; **no** reduced-motion rules |
| inline HTML (Astro SSR) | 71.6 KB wire | all 6 `<canvas>` elements + full DOM text are server-rendered |

## Driver map — byte offsets in `hoisted.CRsATKbF.js`
### Scroll engine (custom, no library)
| Item | Offset (≈) | Evidence |
|---|---|---|
| `normalize-wheel` util + `SPIN` constants (wheel delta normalization, SPIN_STEP 800) | 392,337–392,700 | `function normalizeWheel`, `UserAgent_DEPRECATED`, `isEventSupported` |
| custom drag/touch input manager (`mousedown/touchstart/mousemove/touchmove` bound) | 396,964–397,100 | `_getTouchBound(this,this._onDown)` |
| `class ScrollPane` — the smooth-scroll state machine | 1,048,595–1,053,000 | fields `targetScrollPixel/scrollPixel/velocityPixel/snapList/lockOnDirection`; `frictionCoeffFrom=2.1, frictionCoeffTo=1.9, frictionCoeffWeightDivisor=5, wheelEaseCoeff=12`; `_onNativeScroll`; `scrollToPixel`; `getEaseInOutOffset`; `addToSnapList`; sets `document.body.style.height = contentSizePixel`; `history.scrollRestoration="manual"`; keyboard `keydown` handler: ArrowUp/Down ±100, PageUp/PageDown |
| section visibility driver: `class Section` base (`testVisibility()` via `scrollManager.getDomRange(domContainer)`; page in/out opacity tween `.2s pageOpacity`) | 405,543–405,700 | `hide(e,t,i){this._hidePageTween…to(.2,{pageOpacity:0})}` |
| 12 section subclasses (each `extends Section`, drives its own 3D/2D slice) | HeroSection 773,946 · AiSection 779,731 · WearableSection 788,749 · FeaturesSection 806,550 · EncryptionSection 812,552 · GripSection 817,104 · SustainabilitySection 986,159 · ProductSection 992,033 · TestimoniesSection 1,004,841 · SocialSection 1,006,696 · OpenWeightSection 1,009,933 · FooterSection 1,039,286 | `class X extends Section` |
| `RouteManager` / `PageManager` (single-page router scaffolding) | 1,042,963 / 1,045,455 | `pageList=[homePage]`, `_fetchHtml`, `onRouteChanged` |

### Text / DOM animation
| Item | Offset (≈) | Evidence |
|---|---|---|
| GSAP **SplitText 3.14.2** (standalone, no GSAP core) | 763,558–772,000 | `/*! * SplitText 3.14.2 * https://gsap.com`… `SplitText.register(window.gsap)`, `Intl.Segmenter` char segmentation |
| SplitText usage — masked line/word/char reveals across sections | 772,125 (footer chars) · 774,251 (`#hero-top-tagline` `{type:"words",mask:"words"}`) · 774,453 (`#hero-copy` `{type:"lines,chars"}`) · 774,760 (`#hero-card-header` `{type:"lines",mask:"lines"}`) · 774,908 (`#hero-card-desc`) | `SplitText.create(...)` calls |

### 3D scene (three.js r178 fork, "modified by Lusion")
| Item | Offset (≈) | Evidence |
|---|---|---|
| three.js core, forked | 2,754–166,850 | `REVISION="178 - modified by Lusion"`, `__THREE_DEVTOOLS__` registration |
| `class Settings` — asset path manifest (`MODEL_PATH="/models/"`, `IMAGE_PATH`, `TEXTURE_PATH`, `AUDIO_PATH`, float render-target config) | 414,376 | `class Settings{MODEL_PATH="/models/"…}` |
| loader queue (real progress source for preloader) | used via `properties.loader.add(t,{onLoad…})` (see FrameAnimation) | seen |
| preloader reveal shaders + post pipeline (`preloaderFrag`: `u_hideRatio`, `u_maskRatio`, blur `BLUR_SAMPLE:6`, vignette, blue-noise dither, gamma 2.2) | 553,392–556,200 | `preloaderFrag=…u_hideRatio…`, `math.fit(l,0,.5,0,1)` |
| `class Splats extends Object3D` — gaussian splat renderer; splat frag `alpha=min(0.99, vColor.a*exp(power))` with TAA jitter include; sort request postMessage `{viewDir, translationZ, nearPlane, maxDepth, sortBuffer}` | 637,811–643,000 | `WorkerWrapper` → `new Worker("/_astro/SplatsWorker-DSMxtdkh.js")`, `class Splats extends Object3D` |
| `class FrameAnimation` — keyframed transform/camera tracks from `.buf` files (`preInit(target, url)`, `frameCount`, `applyTransformByRatio`, camera fields `position/orient/scale/focal/aperture=41.4214`, `viewPixelWidth=2048`) | 642,793+ | `class FrameAnimation{target;position;orient;scale;focal…}` |
| `HeroScene` instance — hero binding of scroll → camera/object | 721,546–722,700 | `const heroScene=new HeroScene`; `cameraAnimation.preInit(cameraControls, settings.MODEL_PATH+"hero_camera.buf")`; `coasterAnimation.preInit(coaster.container,…+"coaster_hero_animation.buf")`; scroll progress `t` → frame `t*(this.cameraAnimation.frameCount-1)`; `postprocessing.blendProfile(APPLE_PROFILE,this.highlightRatio)` |
| Wearable section 2D canvas renderer (`#wearable-main-canvas`, `getContext("2d")`, offscreen quarter-circle canvas) | 785,662 | `_canvas$2=e.querySelector("#wearable-main-canvas"),_ctx$2=_canvas$2.getContext("2d")` |
| Features curve 2D renderer (`#features-curve-canvas`) | 794,475 | `_canvas$1=e.querySelector("#features-curve-canvas")` |
| Grip section zoom-box drag interaction (`_isDragging`, `_zoomBox*`) | 817,104+ (inside GripSection) | `input.isDown?_isDragging&&(_zoomBoxT…` |
| Vimeo Player API + `VideoOverlay` (`VIDEO_LIST={MAIN_VIDEO_REEL:"https://player.vimeo.com/video/1174820580…"}`) | 429,635–454,700 | `class VideoOverlay`, `isVideoMu…` |

### SplatsWorker (`SplatsWorker-DSMxtdkh.js`)
| Item | Offset (≈) | Evidence |
|---|---|---|
| Rust/WASM "splatsorter" class: `splatsorter_new/get_indices_ptr/get_positions_ptr/sort/sort24`, `FinalizationRegistry` free | 200–1,200 | `__wbg_splatsorter_free`, `splatsorter_sort24` |

## Search recipe
```
node research\oryzo\work\grep.mjs research\oryzo\data\js\hoisted.CRsATKbF.js "targetScrollPixel" 6 200
node research\oryzo\work\grep.mjs research\oryzo\data\js\hoisted.CRsATKbF.js "class [A-Za-z]+ extends Section" 20 0
```
Raw capture JSONs backing every claim: `research/oryzo/data/` (net-desktop.json, net-mobile.json, net-reduce.json, scrollperf-desktop.json, scrollperf-gpu2.json, scrollperf-gpu-gentle.json, dom-desktop.json, dom-mobile.json, dom-nowebgl.json, glinfo.json, glinfo-nowebgl.json).
