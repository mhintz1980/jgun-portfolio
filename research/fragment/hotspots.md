# fragment.im — hotspots: files and functions driving scroll, animation and the 3D scene

Production bundles are ES modules from `https://framerusercontent.com/sites/1w0f0s83UjRlQ3a3DeRhZN/`, minified single-line Rolldown output. **Every chunk ships a source map** (`//# sourceMappingURL=*.mjs.map`), and the maps point at original authored module sources under `framerusercontent.com/modules/<id>/<id>/<name>.js`, which were fetched and read directly. Line references below are for the original modules; for minified bundles, line ranges are unknown (single line). All claims [seen] unless noted.

## Original authored modules (first-party, the real hotspots)

1. **`spline_mobile_scroll.js`** — original: `https://framerusercontent.com/modules/u6UKVmd9Eu0TIZ5FHJGA/YWWmAVpmZnd5SUyfhyif/spline_mobile_scroll.js` (line 1; 1257 B)
   - Bundle: `spline_mobile_scroll.BzAmz_XO.mjs` (630 B; map: `spline_mobile_scroll.BzAmz_XO.mjs.map`)
   - Functions: `SplineMobileScroll` (hook), `updateBreakpoint`, `mediaQuery`, `withSplineMobileScroll` (override HOC, displayName `SplineMobileScroll`)
   - Does: `matchMedia("(max-width: 809px)")` → `style.touchAction = "pan-y"` on phone, `"none"` on desktop. This is the entire scroll-vs-3D touch contract over the hero Spline embed. [seen]

2. **`portrait_parallax_v1.js`** — original: `https://framerusercontent.com/modules/zfEK9AhDiKCFgiLX7zV8/xU17MJ12iXF90aOwVRGb/portrait_parallax_v1.js` (51 lines, 17.5 KB)
   - Bundle: `portrait_parallax_v1.DgkqosuF.mjs` (5 KB; map: `portrait_parallax_v1.DgkqosuF.mjs.map`) — loads on scroll on home, on nav to `/about` [seen network]
   - Functions and line refs in the original:
     - `portraitDefaults` (line 1): `{horizontal: 2.8, vertical: 2, moveX: 0, moveY: 0, smoothing: 0.22, zoom: 1, fit: "cover", positionX: 50, positionY: 50, pixelRatio: 1.5}` [seen]
     - `loadPortraitImage` (line 1): crossOrigin+async image loader [seen]
     - `createPortraitRenderer` (line 1): raw WebGL — context `{alpha:false, antialias:false, depth:false, stencil:false, powerPreference:"low-power"}`; single oversized triangle (3 verts); 2 textures (photo + depth map, depth loaded with `UNPACK_COLORSPACE_CONVERSION_WEBGL = NONE`); fragment `displacement(uv) = 1 - exp(-max(d - 0.12, 0) / 0.68)`; eye-anchor UV `(0.480191275, 0.2315)` stays fixed; `sourceUV = uv - movement * (displacement - anchorDepth)` [seen — technique note, not copied asset]
     - `tick` / `draw` / `wake` (line 38): exponential smoothing `alpha = 1 - exp(-dt / smoothing)`; rAF loop **stops when pointer reaches target**, restarts on input; `dt` clamped to 50 ms [seen]
     - `resize` (line 38): DPR cap `min(devicePixelRatio, pixelRatio=1.5)` + absolute canvas budget `sqrt(2.5e6 / (w*h))` (~2.5 MP cap) [seen]
     - `contextLost` (line 38): `preventDefault()` → `onFailure()` (static photo); `webglcontextrestored` → re-init via `restoreKey` bump [seen]
     - `announcePortraitReady` (line 38): sets `window.__fragmentPortraitReady = true` + dispatches `CustomEvent("fragment-portrait-ready")` — site readiness signal [seen]
     - `PortraitParallax` default export (lines 45–49): touch-device bail before any WebGL; `prefers-reduced-motion` gate; IntersectionObserver + `visibilitychange` → `setActive(intersecting && !document.hidden && !reducedMotion)`; `pointermove` tracking `window` or `component`, `-1..1`, `reverseX/Y`; touch `drag` mode maps horizontal drag to pointer; JSX: static `<img>` under `aria-hidden` `<canvas>`, root `role="img"` [seen]
   - This module is the site's only first-party WebGL. No three.js — a ~120-line hand-rolled depth-map parallax. [seen]

3. **`FormattedNumberCounter.D69uJ6Br.mjs`** (2 KB, initial chunk; map available) — animated number counter component [seen chunk + name]
4. **`TickerContentWidth.Chck-16t.mjs`** (1.8 KB, on-scroll; map available) — marquee/ticker width management; uses rAF + ResizeObserver [seen grep]
5. **`ewm_before_after_slider_web.D3LIiC0P.mjs`** (3 KB, on-scroll; map available) — before/after image slider used in a case-study section [seen chunk name]
6. Other on-scroll lazy chunks (route/section components, hash names, maps available): `GbMC1mGnU.BuZcp1py.mjs` (13 KB), `Uh0Lii0ox.K4E0zYpF.mjs` (12 KB), `m4gYARIsvIGclXKj7HNQh06LUKLbwtqi0NAZLq9digo.BC-B2glh.mjs` (14 KB), `4WG7lyhCNFWU72iyRWPw0JYcdHH1JshhSbbpacIPybQ.BgOh6Iho.mjs` (10 KB), `NdzsgAvBUwSZ3j6tnvI_dBBOc4WAnBSBBymf4IOLvYM.DKCvSi0P.mjs` (13 KB, requested on `/about` nav) [seen]

## Platform runtime (Framer-owned, read-only references)

7. **`framer.BIOwr9OE.mjs`** (123 KB transferred / 444 KB decoded) — Framer framework: SPA router, component hydration, contains `startViewTransition` reference, `IntersectionObserver`/`ResizeObserver`/`scrollY`/`wheel`/`touchmove` wiring, prefers-reduced-motion plumbing [seen grep]
8. **`motion.BuOgONYX.mjs`** (50 KB) — framer-motion runtime: `useReducedMotion`/`shouldReduceMotion`/`prefers-reduced-motion`, rAF + IntersectionObserver/ResizeObserver, scroll-linked transforms [seen grep]
9. **`toplevel-deps.B0dn5Ev5.mjs`** (31 KB) — includes `spline-viewer` integration + Framer scroll host (internal tag `scroll-prod-20261005-01`), native `scrollY`/`scrollTo`/`scrollend` handling [seen grep]
10. **`script_main.XoNVSY-O.mjs`** (6 KB) — page entry; imports react + framer runtime [seen]
11. **`rolldown-runtime.Bi-D_2cA.mjs`** (1 KB) — Rolldown bundler runtime [seen]

## 3D-side runtime (third party)

- `https://cdn.spline.design/@splinetool/viewer@2.0.93/build/spline-viewer.js` (1092 KB) — defines `<spline-viewer>`; canvas lives in shadow DOM; Framer coordinates via `data-fragment-spline-watch` / `data-fragment-spline-ready` attributes [seen]
- `https://prod.spline.design/<sceneId>/scene.splinecode` — home desktop `QzFYO-pwcQCbiF9t`, home mobile `PHP6Gm7o6Xu4ObTR`, `/about`: `r-GeM7GzPYPpPajD`, `Fs5omoRpmtrXHxMB`, `2byqvdPRUGrylKq9` [seen]
- `https://unpkg.com/@splinetool/runtime@2.0.93/build/bevel.wasm` (57 KB) [seen]
- Scene internals (camera, object names, animation graph) are inside the compressed `.splinecode` archive — unknown [unknown]

## Scroll system summary
- Native page scroll; no smooth-scroll library. Section content animates in via Framer/framer-motion (lazy per-section chunk loading observed at scroll positions); scroll-driven parallax is handled by the authored `portrait_parallax_v1` (pointer-based, not scroll-based) and Spline's own scene. Keyboard/anchor/back-button work (back button verified: URL + fresh remount) [seen]

## Readiness / coordination hooks (public, reusable patterns)
- `window.__fragmentPortraitReady`, `window.dispatchEvent(new CustomEvent("fragment-portrait-ready"))` [seen source]
- `spline-viewer` attrs: `loading`, `data-fragment-spline-watch`, `data-fragment-spline-ready` [seen DOM]

Data trail: downloaded bundles, maps and fetched originals in `research/fragment/data/chunks/`; raw measurements in `research/fragment/data/*.json`; screenshots in `research/fragment/data/`.
