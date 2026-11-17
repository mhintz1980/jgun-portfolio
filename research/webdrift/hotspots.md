# webdrift.be — scroll/animation/3D hotspots (step 8)

Production bundle, minified, **no source maps** (`sourceMappingURL` absent from all 15 chunks [seen]). "Locations" are byte offsets in the decoded (brotli-decompressed) chunk text; minified identifiers are as shipped. All findings from static reads of `research/webdrift/exports/chunks/*` + runtime probes [seen].

## The file that matters most: `_next/static/immutable/chunks/271d7upkv9vei.js`
(75.1 KB transferred / 199.6 KB decoded; initial wave, t≈1171ms)
The entire app layer — GSAP core + ScrollTrigger + Flip, the Lenis wrapper, the three.js scene bootstrap, page transitions, split-text animation wiring — lives in this one chunk [seen].

| Offset | Identifier / code shape | What it drives |
|---|---|---|
| @148629 | `matchMedia("(min-width: 992px)").matches && !c ? g=new sj({lerp:.07, wheelMultiplier:1, gestureOrientation:"vertical"}), window.lenis=g, g.on("scroll", s_…)` | Lenis 1.3.26 instantiation, desktop-only (≥992px, `!c` ≈ not reduced-motion); `s_` wires scroll into ScrollTrigger.update [seen] |
| @132874 | wrapper defaults `{…, respectReducedMotion:E=!0, stopInertiaOnNavigate:S, naiveDimensions:T}` + `window.lenisVersion=sP` | Lenis wrapper options incl. reduced-motion respect, sets `window.lenisVersion="1.3.26"` [seen] |
| @158863 | `i=s("#gl-c"), n=s("#gl"); try{ r=new t.WebGLRenderer({canvas:i, antialias:!0, alpha:!0, powerPreference:"high-performance"}) } catch(t…)` | WebGL scene bootstrap; id-based canvas lookup `#gl-c` inside `#gl`; try/catch → null renderer = graceful no-WebGL path [seen] |
| @159155 | `UNMASKED_RENDERER_WEBGL` probe → `e.still=!0`; `r.setPixelRatio(Math.min(devicePixelRatio, e.still?1:2)); r.outputColorSpace=t.SRGBColorSpace` | DPR cap 2 (1 if GPU unknown), sRGB output [seen] |
| (scene) | `new t.Scene`, `new t.PerspectiveCamera`, `new t.PlaneGeometry`, `new t.ShaderMaterial`, `new t.MeshBasicMaterial`, `new t.BoxGeometry` | Fully procedural scene: shader plane + boxes, zero external geometry/texture assets [seen] |
| @155598 | `K=(t,e=2,r=0)=>{ i=s(":scope > .safe",t); gsap.fromTo(i,{opacity:1},{opacity:0,ease:"none",scrollTrigger:{trigger:t,start:e,end:r,scrub:!0}}) }` | reusable per-section opacity scrub helper [seen] |
| (ST config) | `scrub:!0/.4/.5/.6/.8/1`, `pin:!0`, `start:"top 90%",end:"center 45%"`, `toggleActions` | the site's scroll choreography inventory: pinned sections + velocity-varied scrubs [seen] |
| (timelines) | `timeline({defaults:{ease:"expo.out"}})`, `timeline({scrollTrigger:{…scrub:.8…}})`, `timeline({onComplete:… timeline().to(".pt-label, .pt-m…")})` | reveal timelines use expo.out; page-transition label overlay animated on route change [seen] |
| (easing tokens) | `expo.out`, `power1/2/3.in|out`, `sine`, `elastic`, `back` | easing vocabulary [seen] |
| @195292 | `document.startViewTransition` + `l.classList.add(t?"vt-fwd":"vt-back")` + `setTimeout(t,1200)` | View Transitions API route change with direction classes and ≥1.2s window [seen] |

Split-text: per-char/per-line spans (`data-split`, `data-lw`, `aria-hidden` dupes) are **server-rendered** — those attributes appear in no chunk [seen]; GSAP animates the SSR spans by selector [inferred].

## Other chunks (all `_next/static/immutable/chunks/`)
| File | KB xfer/decoded | Role |
|---|---|---|
| `2tcte8fxmh-o3.js` | 190.4 / 737.7 | three.js r186 library; dynamically imported after hydration (t≈2835ms). `revision:"186"` @312937 [seen]. No site shaders inside — app shader code lives in 271d… [inferred] |
| `07v142o5owpy6.js` | 66.2 / 204.6 | react-dom (React 19.3.0-canary) [seen] |
| `0eg_l5hfh7q5s.js` | 45.4 / 163.3 | no library fingerprints; unknown — likely Next/Turbopack support [seen absence, role unknown] |
| `1fapnvdcpi2ec.js` | 31.0 / 94.3 | Sanity client + CDN image URL builder (5 cdn.sanity.io refs) [seen] |
| `0vn_c-qtmgve7.js` | 9.0 / 31.4 | Next.js app-router runtime [seen] |
| `1g4gy1zly6msb.js` | 9.6 / 29.3 | Next client router internals [seen] |
| `2t181o2t9buu2.js` | 12.5 / 36.7 | unknown (no fingerprints) [seen absence] |
| `0x-9rc1bm-510.js` | 4.1 / 14.4 | unknown [seen absence] |
| `turbopack-2tldop0mkzdkx.js` | 4.4 / 9.8 | Turbopack runtime [seen] |
| `3ny2ry3_imjve.js`, `27kpv9l1459u2.js`, `2mb5-cwq_tp1g.js`, `21p8__i6ijoh8.js` | 1.2–2.3 | small Turbopack entry chunks [inferred] |
| `lftracker_v1_*.js` (sc.lfeeder.com) | 34.5 | Leadfeeder analytics (third-party) [seen] |

## DOM anchors the code targets (for reconstruction)
- `#gl-c` canvas inside `DIV.gl > SECTION.hero.grain > DIV.page > MAIN` [seen]
- `.gl` container: `position:absolute; inset:0; height:100vh; z-index:0` — canvas is hero-scoped, unmounts on route change [seen]
- `.safe` wrappers inside sections = scrub-fade targets (helper `K`) [seen]
- `.pt-label`, `vt-fwd`/`vt-back` overlay classes = transition choreography [seen]
- HUD: counter ("00 Intro" / "01 Work"), Antwerp clock, "Back to 1984", x/y keypad readout — all DOM, not canvas [seen]
- SVG filter stack (feFlood ×N + feMerge + feTile + feComposite + feComponentTransfer) in a hidden SVG = grain/CRT post effect for DOM layer [seen]
