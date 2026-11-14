# rikoutaku.work — scroll / animation / 3D hotspots

Production bundles are minified with **no source maps** (no `sourceMappingURL` in any script [seen]), so original file names and line ranges are **unknown**. Locations below are: bundle chunk + raw byte offset + minified identifier + a short identifying line (2 identifying lines max per item, per capture rules). Exported raw sources for offline grep: `research/rikoutaku/scripts-export/` (see `_manifest.json` for scriptId/hash mapping).

## The driving files (all [seen] in network log and exported sources)

| # | File (transferred) | Raw size | Role |
|---|---|---|---|
| 1 | `assets/main-N7NH1HMx.js` (286 KB br) | 854,437 chars | App core: Experience bootstrap, three.js scene world, TyndallEffect, Scatter, Gravity, Layout/arrangements, Guestbook, chapter scroll driver, mouse parallax, camera control |
| 2 | `assets/DRACOLoader-BhgqjXwv.js` (160 KB br) | ~1.3 MB chars | three.js r165 vendor chunk (WebGLRenderer, GLTFLoader, DRACOLoader, KTX2Loader, WebXR hand/pinch internals) |
| 3 | `assets/brand-BgRgrlm6.js` (7 KB br) | 18,145 chars | Custom smooth-scroll module, `data-fx` entrance-animation registry + scheduler, `fx-live` gate, `ri-lens` magnifier cursor |
| 4 | `assets/curtain-lliHWBBA.js` (3 KB br) | 6,160 chars | Page preloader + MPA route-transition curtain (`ri-curtain`) |
| 5 | `assets/index-CAWK1xnZ.js` (44 KB br) | ~130k chars | Home page module: `c2n-motion` chapters, motion captions, section activation |
| 6 | `assets/helix-flow-BYmbMB4o.js` (8 KB br) | ~12k chars | Works section: helix path sampler laying project "documents" along a 3D helix |
| 7 | `assets/works-D3lljqMx.js` (1 KB br) | 985 chars | Project data array `{number, title, subtitle, image: new URL('/assets/mofulog-CMBNovce.jpg', import.meta.url), href, recommended}` |
| 8 | `theme-boot.js` (2 KB br) | ~1.5 KB chars | Pre-paint theme bootstrap (localStorage `riTheme`, "light"\|"dark"); header comment cites design doc "Tyndall-Effect.md §2.3" |
| 9 | `cdnjs.gsap 3.12.5` (26 KB) + GSAP core bundled inside main | — | Tween engine for DOM text/entrance work; ScrollTrigger plugin NOT present |

## Function-level map (byte offsets are into the raw exported file)

### Scroll system — main-N7NH1HMx.js
- Chapter scroll driver @850216: `p=()=>m()?Math.max(0,Math.min(1,scrollY/m())):0` — global scroll progress = raw `scrollY / (scrollHeight - innerHeight)`; per-chapter progress stored `l.set(c.id,S)`. No library; native scroll on home.
- Section activation @852391: `T.element.hidden=!1, W.set(T.element,{visibility:"visible"}), window.scrollTo(0,(l.get(S)||0)*m()), T.activate({duration:I}), f&&T.startIntro()` — GSAP `set` + per-section activate + saved-progress restore + intro.
- Smooth scroll (interior pages) — brand-BgRgrlm6.js @199/@795: `s={on:!o&&i,y:scrollY,target:scrollY,moving:!1}`; wheel handler ignores ctrlKey (zoom passthrough), skips when `ri-covered`, excludes `[data-native-scroll]`/dialog; enables `ri-smooth` class. State machine `moving/target/y` = classic custom lerp smooth scroll (lerp factor: unknown — minified arithmetic).
- Camera-vs-scroll binding: `activate({duration:w=.85})` per section (index chunk @121945) with `getSceneProgress:()=>1, getGuestbookProgress:()=>0` accessors — sections drive scene progress values consumed by the 3D world [seen accessors; exact camera path math: unknown].

### Animation system — brand-BgRgrlm6.js (declarative `data-fx`)
- Effect gate @1697: `const z=matchMedia("(prefers-reduced-motion: reduce)").matches; z||documentElement.classList.add("fx-live")` — master motion switch; CSS/bundles key off `fx-live`.
- Registry + processor @8718: `vt(t=document){t.querySelectorAll("[data-fx], .rv").forEach(e=>{if(e.__fx)return;const n=!!e.dataset.fx,o=gt(e);if(!o||!it[o]){…}})` — named effects in registry object `it` (observed values: `type`, `lines`, `pop`, `rise`, `fade`; `data-at` = per-element delay ms).
- Loop scheduler @9369: `every:e=4200, step:n=42` — hero items re-run on a 4.2 s cycle with 42 ms stagger (setInterval-driven, cleared on visibility).
- DOM hooks seen in markup: `data-fx`, `data-at`, `data-hero-item`, `data-hero-copy`, `data-hero-copy-value`, `data-hero-decoration`, per-char `<span>` splits, GSAP SVG transforms (`data-svg-origin`) on the logo mark.
- `ri-lens` magnifier @12523: `Lt({selector, allowed, reduced: matchMedia("(prefers-reduced-motion: reduce)")})` + `(hover:hover) and (pointer:fine)` gate.

### Page transitions — curtain-lliHWBBA.js
- Curtain DOM builder @1572: `div.ri-curtain` = shade + panel ("RI.Studio" wordmark), `aria-hidden="true"`.
- Show @3374: `a.className="ri-curtain is-on is-cover", c.classList.add("ri-covered"), A(S(location.pathname)), C({counter:t, fromNav:r, held:s?Promise.race([s,o(1e4)]):null})` — 10 s max hold; optional counter.
- Hide @3101: remove `is-cover`/`is-lift` → `ri-covered` off → `setTimeout(…, 950)` className reset.
- Preloader screen (main/index): "PAGE PRELOADER / SEQ 001 — EST.2026 / LOADING 000%" counter (seen stuck at 000% in no-WebGL run [seen]; healthy-load intermediate values: unknown).

### 3D scene — main-N7NH1HMx.js
- Experience singleton: minified class `T0`, exposed as `window.experience` (probe: `experience: object`) [seen].
- TyndallEffect (volumetric window beam):
  - @536477: `this.macroIndex=0,this.reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches,this.medium={...Rs},…` — quality/state machine.
  - @538841: `console.info("[Tyndall] beam active")` + `buildPasses()`.
  - @452648: GLSL prepend comment "Vite's ?raw import has no #include, so TyndallEffect concatenates this in front of each pass".
  - @440004: custom GLSL `float sampleBeamShadowDust4(vec3 worldPos)` — dust-shadow sampling passes (shader source NOT reproduced here).
  - @441918: params `{count:120,size:.013,opacity:.2,lightLevel:1,beamOnly:1,shadowRadiu…}`.
  - Prod debug removed: `delete window.tyndall,this.gui.destroy()`.
- Scatter (furniture scatter + mouse chase) @395333: `console.log("[Scatter] animated meshes:", this.units.length, "by material:", e)`; materials `frame, floor, books_right, window, room_main`; `seedMouse()` (`{radius:2.2+Math.random()*2.4, y…}`) vs `seedModel()`.
- Gravity @432963 (comment): room root must not be "a child of `actualRoom` … or Scatter and Gravity would pick it up as furniture and fling it across the page".
- Layout/arrangements @585494–586913: `const wa="/models/layouts.json"`; `…movable pieces × ${this.doc.layouts.length} arrangements (source: ${this.doc.source})`; home map `this._scHome=new Ma…`; build script named in warning: "[Layout] named in layouts.json but absent from the GLB — re-run scripts/extract-layouts.py". Source .blend: `change-U2026-8-19.blend`.
- Guestbook @814258: `console.info("[Guestbook] runtime material names:",[...s])`, `${this.materials.length} reel materials`; `loadApproved(){e=await C8()…}` — Supabase REST → 3D "reel" materials.
- Mouse parallax @83207: `matchMedia("(pointer: coarse)").matches||matchMedia("(prefers-reduced-motion: reduce)").matches ? this.parallax.enabled=!1 : this._onPointer=t=>{…clientX/window.i…}`.
- Camera control: `domElement` wheel/pointermove/pointercancel/keydown listeners @91517/@99981 — OrbitControls-style rig (class name minified; OrbitControls [inferred], exact orbit limits unknown).
- three.js vendor: `assets/DRACOLoader-BhgqjXwv.js` — WebGL context creation site per error stack: `DRACOLoader-BhgqjXwv.js:3802:20041` (`new $0` = WebGLRenderer), `I9.setRenderer` [seen].

### Works helix — helix-flow-BYmbMB4o.js
- @7673: `_sampleHelixDocument(t,e,s,o)` — samples positions along a helix curve for project documents; control points `_pathStart/_pathControl/_pathEnd` with `_radial` offset `multiplyScalar(n*.25)`; aspect-aware margins `_sideMargin(s)`. Feeds the works data array from works-D3lljqMx.js.

### Japanese caption content (index chunk, for reference)
- `c2n-motion-captions`: `01 — SPACE` (技術と感性で…), `02 — IDEA` (…), `03 — BUSINESS` (…) with `data-motion-caption="0|1|2"` and `c2n-motion-number` "01 — 03" [seen]. `c2n-` prefix shared with `<html data-c2n-room="…">` (acronym meaning: unknown).
