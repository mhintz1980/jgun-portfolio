# dennypratama.com — scroll / animation / 3D source hotspots

Production Turbopack bundles, minified, **no source maps** (no `sourceMappingURL` in any chunk — verified across all captured files). Paths below are the deployed URLs; positions are character offsets in the captured minified files (files are 1–3 physical lines, so line ranges are meaningless — offsets given instead). Module names in quotes (`"Hero"`, `"TUNNEL_FS"`, …) are literal strings preserved in the minified output **[seen]**. Original source file names: unknown.

## 3D scene (hero raymarch tunnel)
| What | File (deployed path) | Location / names |
|---|---|---|
| Fragment shader `TUNNEL_FS` — the whole hero visual | `/_next/static/immutable/chunks/08gtj1i3xp5zr.js` (7,591 chars) | shader literal `#version 300 es` @142 → end; key internals: 11-vertex mark polygon `V[11]` + `sdPoly`/`sdLogo` SDF @878; `mapT` (13 instances, spacing `S=6.4`, rotation `STEP=0.2617994` rad = 15°, half-depth `gH=0.17`, bevel `gR=0.014`) @~1000–1900; `calcNormal`/`calcAO` (4-tap) @~2000; main(): bounding-cylinder accel, adaptive steps `int(uSteps)` cap 220, camera key light `uKey`, accent slash-wall glow via normal `vec2(-0.4003,0.9164)`, blueprint outline+grid passes, white end light `uEnd`, ACES `aces()`, gamma 2.2, vignette, hash grain; module registered as `"TUNNEL_FS"` @7571 |
| GL driver — context, uniforms, scroll dive, quality | `/_next/static/immutable/chunks/2omj144u1v5-f.js` (51,772 chars) | component `"Hero"` @32204; uniform name list `["uRes","uTime","uRo","uCam","uTan","uTun","uEnd","uKey","uAccent","uSteps"]` @32076; capability gate (reduced-motion, `?tunnel=force`, `(hover:none)`, `navigator.deviceMemory`, iOS UA sniff, hardwareConcurrency) @~32600–32900; scroll progress `M()` — hero `getBoundingClientRect` → `N=clamp(-rect.top/(rect.height-vh))` @32890, writes CSS vars `--vh/--p/--deg` (`--deg=round(180*clamp((N-.26)/.64))`) @33144; DPR/quality resize `F=.62`, `min(dpr,1.5)*F`, `ResizeObserver`, `dataset.q` @34722; `webglcontextlost` handler `W()` + story scroll restore @35139; pointer `pointermove"G` (±1 target) @35284; deviceorientation tilt @35653; rAF loop `ee` — idle skip `Z=N===Q&&…`, camera sway `M=.17*sin(.21*t)+.38*j.x`, dive `o=-12*6.4*smoothstep(N,.26,.9)` @36039; video lazy-play + `navigator.connection.saveData` guard @19916 (IntersectionObserver rootMargin 600px) |
| GL capability status probe (reports state text) | `/_next/static/immutable/chunks/0efyg2j06w8nh.js` (17,881 chars) | `getContext("webgl2")??getContext("webgl")` probe @10680; reads `canvas.gl`, `gl-fail`/`gl-on` classes, builds "live, quality N" status string @11438–11522 |

## Scroll system
| What | File | Location / names |
|---|---|---|
| Lenis library + config | `/_next/static/immutable/chunks/3-e1zveau6j0n.js` (35,386 chars) | Lenis class (infinite option, `scrollX/scrollY` getters) throughout; instantiation `new p({lerp:.1,anchors:{offset:0…}` @33328; `on("scroll"…` @21324; home intro state (`has-intro` only on route "/") @13496 |
| Lenis consumers (`data-lenis-prevent`, scrollTo) | `chunks/1uny6l6dl-0qn.js` @9664; hero uses shared accessor `(0,c.k)()` → `lenis.scrollTo(a,{immediate:!0,force:!0})` (context-loss scroll restore) and `lenis.scrollTo(a,{duration:1.2})` (chapter buttons) in `2omj144u1v5-f.js` @42850 |
| GSAP 3.15.0 core + ScrollTrigger + ScrollSmoother + Flip | `/_next/static/immutable/chunks/1e46krqq5tz9z.js` (43,346 chars) | `F.version="3.15.0"` @8819; `registerPlugin` @226; ScrollTrigger @2577; ScrollSmoother kill logic @37039. Second copy: `chunks/249alxhww9wiw.js` (70,153 chars), ScrollTrigger @5416. **No direct page-component calls found on home** — scroll effects are custom; usage on other routes: unknown |
| Scroll-driven rows (work index hover/focus) | `chunks/1uny6l6dl-0qn.js` | `(0,r.X)(…)` scroll callback: offscreen bail (`bottom<-200‖top>vh+200`), `.row-a:hover` / `.row-a:focus-visible` targeting, velocity lerp `p+=(clamp(.05*e,-4,4)-p)*.12` @~44500 region of captured text (offsets in that file's copy) — same pattern repeated in `chunks/0ahe0wnjmekhe.js` @~15500 |

## Animation components (home route chunks)
| What | File | Location / names |
|---|---|---|
| Quotes deck (pinned slider, `--in/--qr` vars, rail buttons, reduced-motion guard) | `chunks/2omj144u1v5-f.js` | component `"Quotes"` @~43400 region (`matchMedia("(prefers-reduced-motion: reduce)")` early-return) |
| Footer pointer parallax (`--gx` CSS var, 0.06 lerp, rAF-until-settled) | `chunks/0ahe0wnjmekhe.js` (24,954 chars) | pointermove → rAF lerp block @~15500; `pointerType==="mouse"` guard |
| Work-index rows mode (hover vs touch) | `chunks/0ahe0wnjmekhe.js` | `matchMedia("(hover: none), (max-width: 900px)")` → "touch"/"hover" @~top of component `"Index"` |
| Mini-site preview heroes (lazy per-project canvases: `cx-cv` ×2, `fl-cv`, `rv-hero`; pointermove ease 0.12) | `chunks/2c-me0hr-mg3i.js` (cx "nc" variant, `cx-hero` @7725, `cx-cv` @7775, pointermove @12926); `chunks/2ro9qt2k_4k_-.js` (cx "mw" variant); `chunks/3pk7bjepw9sck.js` (fl "Fieldline", `fl-hero` @2789, `fl-cv` @2839); `chunks/23d39a72cglha.js`, `chunks/3nnoncglb6a81.js` (pointer-parallax wrappers) |
| Route transition | Next.js App Router runtime `chunks/3rabdfv2awqjv.js` (131 KB) — standard RSC navigation; per-route chunk for /work: `chunks/23ezmypientp_.js`; no transition library |

## Runtime DOM landmarks (for probing on the live page)
- `<html class="iX1fDW_variable lenis">`; `.site.has-grain.ld-go.gl-on` (state classes: `ld-go` loader done, `gl-on`/`gl-fail` GL state)
- `canvas.gl[data-q="0.62"][data-gpu="ANGLE…"][data-why]` — quality + GPU string + disable reason
- Hero section CSS vars, updated every frame: `section.hero {--vh --p --deg}`; other progress vars: `.both{--bk}`, `.con{--cp}`, `.qv{--in --qr}`
- Loader: `.ld` → `.ld-mk` (pathLength=100 stroke-draw), `.ld-deg .ld-num` (degree counter); HUD: `.hud` `.hud-deg .hud-num`, phase labels `.hud-ph-d "d · design"` / `.hud-ph-p "p · production"`, cue "Scroll to go through the slash"
- Debug/status probe chunk (`0efyg2j06w8nh.js`) builds a human-readable GL status ("live, quality 0.62") — suggests a keyboard/hidden status readout; trigger key: unknown

## Capture provenance
- Network + DOM: REA `capture_browser_scenario` runs, 1440x900 and 390x844 (Chromium 157.0.8103.79 headless, 2026-11-13)
- Chunk text: response bodies retained by the desktop capture + direct fetches of the 3 chunks over the 64 KB body budget
- Perf numbers: private headless Chrome via playwright-core, rAF deltas + PerformanceObserver longtask, 10 s scripted scroll
