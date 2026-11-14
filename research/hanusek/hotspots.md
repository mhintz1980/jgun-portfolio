# hanusek.com — scroll / animation / 3D source hotspots

All sources are hand-written, unminified, and were fetched verbatim from the public site
(saved in `research/hanusek/`: `site.js`→`scripts/site.js.a5a66e05189a.js`, `pages.js`→`scripts/pages.js.503f963daaac.js`, `crew.js`, `crewparts.js`, `site.css`, `index.html`).
Line numbers are exact against the served bytes [seen]. There are no source maps [seen — REA bundle analysis + `//# sourceMappingURL` absence].

## Scroll engine (whole site)
- `https://www.hanusek.com/site.js` — single rAF-throttled scroll handler, no library
  - lines 42–49: `tick()` — the heart: nav solid toggle past hero; per-paragraph ink-reveal progress `(innerHeight*.85 - r.top)/(innerHeight*.55 + r.height*.4)`; blueprint draw progress; `setWork(floor(prog(work)*13))` scroll→project mapping
  - line 50: scroll/resize listeners coalesced into one `requestAnimationFrame` (passive)
  - lines 42, 45: `prog(el)` — section progress helper `-r.top/(r.height - innerHeight)` clamped 0–1 (the site's only "scroll timeline" primitive)
- Pinning is pure CSS `position:sticky`; JS only reads progress: `site.css` line 51 (`.bp` 260vh), lines 57–58 (`.crew` **900vh**, `.crew-pin` 100vh), line 72 (`.work` 420vh), line 134 (mobile `.work` 820vh)

## Text / reveal effects
- `site.js` lines 5–6: `[data-ink]` word splitter — walks text nodes, wraps words in `span.w`, `tick()` toggles `.on` in order (word-by-word ink-in)
- `site.js` lines 8–9: `.reveal` IntersectionObserver (threshold .15, unobserve after) → `.in` class; same pattern again for subpages in `pages.js` line 16 (threshold .1)
- Hero entrance keyframes in `site.css`: line 25 `drift` (hero bg ken-burns scale 1.16→1.04), line 33 `up` line-reveal with 0.12 s stagger, line 34 `fade` subtitle

## Blueprint SVG scroll-draw (studio section)
- `site.js` line 12: per-path `getTotalLength()` → `--len` custom property
- lines 45–47: staged draw over section progress — wire draws over first 40% (`w1 = min(1, b/.4)`), fades `(b-.4)/.15`, agent system draws `(b-.5)/.4`, labels appear at `.85`, caption swaps at midpoint (`bpCap` textContent swap)
- markup: inline SVG `#wire`/`#agent` in `index.html` (section `.bp`, 260vh)

## Work wheel (420vh pinned previewer)
- `site.js` line 15: `W[]` — 13-project data array (name, blurb, media base URL, external link, route)
- line 18–19: build wheel list + eager preload of all 13 posters
- lines 20–24: `prime(L,i)` — two-layer previewer: sets poster, swaps `<video>.src` per project, plays when ready
- line 25: `swapText()` — 260 ms out/in text swap (skipped under RM)
- lines 26–37: `show(i)` — dual `.pv-layer` crossfade: back layer enters with `.enter/.front`, front `.leave`; 900 ms timing; index/next-name/counter/link updates; `<link rel="prefetch">` warms the next project's mp4
- line 39: work-section IntersectionObserver (rootMargin 50%) — videos play only while section in view
- line 40: `setWork(0)` initial
- CSS for the wipe: `site.css` lines 164–168 — `clip-path: inset(100%→0)` 0.85 s `cubic-bezier(.77,0,.18,1)` + scale 1.06→1 over 1.1 s `cubic-bezier(.2,.8,.2,1)`; shimmer loader line 178

## 3D scene (crew section) — all hand-written three.js, no build step
- `https://www.hanusek.com/crew/crew.js` (13.5 KB)
  - lines 2–3: `import * as THREE from 'three'` + `{BUILD}` from `./crewparts.js` (importmap resolves jsdelivr r164)
  - lines 6–19: `CREW[]` — six characters with color/accent/resting rotation/eye style/mood map
  - lines 20–26: renderer setup — `WebGLRenderer({antialias:true, preserveDrawingBuffer:true})`, DPR cap 2, SRGB + ACESFilmic; scene bg `0xFBFAF7`; `PerspectiveCamera(30, 1, .1, 100)` at (0, .3, 10); lights: hemisphere 1.1 + key dir 2.1 + rim dir 2.6 + fill dir 0.5 (no env map, no shadow map)
  - lines 27–28: fake contact shadow — radial-gradient `CanvasTexture` on a ground plane (line 62)
  - lines 31–56: `eyeFn(style)` — procedural dot-matrix face renderer (SDF-style per-cell tests on a rows×cols grid; styles `round/pills/cups/goggles/blocks/crescent`; expressions neutral/happy/skeptical/surprised + blink + look vector; glow via canvas shadowBlur)
  - lines 60–81: per-character assembly — Group/inner Group, `BUILD[id](c)`, face canvas → `CanvasTexture` on display glass with `MeshPhysicalMaterial{emissiveMap, clearcoat:1}` (line 69), Box3 size normalize to 3.3 units (line 72–73), 4 sfx `Audio` objects per character (line 79, `preload='none'`)
  - lines 82–85: `drawEyes(ch)` — repaints the face canvas each visible frame (3 colors: `#ffe9c4`, `#ff5a2c`, `#262422`)
  - lines 88–90: `#snd` sound toggle ("Sound on/off") + `play()` with 1500 ms mood throttle
  - lines 93–95, 127–134: DOM callouts + SVG leader lines — 3D anchor `inner.localToWorld(v).project(cam)` → screen px polyline to `#cA`/`#cB` callout cards (appear at local progress >.08 and >.4)
  - lines 97–98: `size()` — FOV 44 if `W<720` else 30; 3×2 lineup grid on mobile (lines 111)
  - line 99: pointer parallax `mx/my` (±0.08 rad yaw, 0.04 pitch; eyes look target)
  - lines 100–136: `frame()` — the scroll-staging loop:
    - line 103: early-return render when section off-screen (rAF keeps running)
    - line 104: `P = -hr.top/(hr.height-innerHeight)`; `idx = floor(P*7)` → six solo stages + lineup stage; `local` fractional part drives rotation/expression
    - line 105: smoothed `sp += (local-sp)*.1`
    - lines 108–124: per-character state machine — solo: scale-lerp in/out (`A(a)=1-pow(1-a, dt*60)` framerate-independent damping), `rotation.y = ry + sp*1.1 + mx*.08`, idle bob `sin(t*1.3)*.07`, expression per local quartile, blink timer; lineup: 6 robots lerped to slots, expression shuffle
    - line 106: DOM headline + callout content swap per stage
- `https://www.hanusek.com/crew/crewparts.js` (7.7 KB) — procedural geometry, zero assets
  - lines 4–6: `superBlob(a,b,c,n)` — superellipsoid (sphere positions remapped by `|x|^(2/n)`, optional lean)
  - line 7: `rrShape(w,h,r)` rounded-rect Shape; line 8: shared `MeshPhysicalMaterial` helper (clearcoat + sheen toy-plastic)
  - lines 10–13: `display()` — extruded bezel ring + glass plane with position-derived UVs for the face texture
  - lines 14–16: `button()`, `grille()` (polar dot lattice)
  - lines 17–69: `BUILD{vibe|sonar|glyph|swatch|rivet|patch}` — lathe/rounded-box/blob bodies + accent parts + per-character `anim(t,RM)` (equalizer bars, slider knob, blinking LEDs)

## Lazy loading orchestration
- `index.html` inline module: `IntersectionObserver` on `#crew` (rootMargin 100% 0px) → `import('/crew/crew.js')` — the entire three.js payload is deferred until one viewport before the section
- `pages.js` lines 17–24: `.mv` video lazy loader — `source[data-src]` swap on approach, mp4-before-webm (Safari), shimmer until `canplay`, play only in view (rootMargin 200px), pause out of view, `.hov` variants play on mouseenter only for hover-capable devices; RM → native controls + no preload
- `hform.js` line 8: Turnstile loaded on form focus or IO (rootMargin 300px)

## Overlay menu
- `pages.js` lines 2–15 — open/close state machine (0.7 s clip-path circle, 720 ms close wait, 350 ms focus-in, Tab trap, Escape), `--cx/--cy` set from button rect; eye-tracking `look()` (220 px falloff, ±7/5 px) + ±8° tilt + −24 px bg parallax
- `site.css` lines 141–142 (clip-path), 155 (`mhop` overshoot 0.5 s `cubic-bezier(.34,1.56,.64,1)`), 158 (blink), 160 (RM fallback to opacity)

## Reduced-motion gates (everywhere)
- `site.css` line 110 (global animation/transition kill + scroll-behavior:auto), line 160 (menu)
- `site.js` line 1, `pages.js` line 1, `crew.js` line 5 — `RM` consulted at every motion site; `crew.js` renders one static frame, `pages.js` line 22 gives videos native controls
