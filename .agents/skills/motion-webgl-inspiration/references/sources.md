# Source Catalog

Curated, verified sources for CAD-driven motion and WebGL work, organized by layer. Last verified October 31, 2026.

**Legend:** ★ = start here · Free / Paid / Freemium · License noted where the source states it

---

## 1. Live sites to study (motion and 3D)

Use these to find 3–5 reference sites before building. Once you've picked them, break down the best one or two with REA.

| Resource | What it's good for | Cost / access |
|---|---|---|
| ★ [Awwwards: WebGL collection](https://www.awwwards.com/websites/webgl/) | Award-winning WebGL sites, many tagged Developer Award, which means the build quality was judged | Free to browse |
| ★ [Awwwards: 3D collection](https://www.awwwards.com/websites/3d/) | A broader set of 3D sites, many of them scroll-driven product stories | Free to browse |
| ★ [GSAP Showcase](https://gsap.com/showcase/) | Sites built with GSAP, the library behind ScrollTrigger, so the techniques carry straight over | Free |
| [Codrops Webzibition](https://tympanus.net/codrops/webzibition/) | Hand-picked sites [(2,000+)](https://tympanus.net/codrops/) collected by the Codrops editors | Free |
| [The FWA](https://thefwa.com/) | Long-running awards for experimental and interactive work, with an [archive back to 2000](https://thefwa.com/) | Free |
| [Godly](https://godly.website/) | Has a dedicated **Motion** collection | Free. Blocks AI bots, so use a real browser |
| [React Three Fiber showcase](https://r3f.docs.pmnd.rs/getting-started/examples) | 54 tagged examples: scroll, motion paths, refraction, transmission, soft shadows, HTML overlays | Free, open source |

## 2. Scroll and motion techniques (code you can learn from)

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [Codrops](https://tympanus.net/codrops/) | Tutorials and demos for Three.js, GSAP and kinetic type. Demos are open source, e.g. [Rotating On-Scroll Animations](https://github.com/codrops/RotatingOnScrollAnimations/blob/main/README.md) (GSAP + ScrollTrigger + Lenis + three.js) | Free. Most demo repos are **MIT** |
| ★ [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Scrub, pin, snap, callbacks and responsive setups, plus a CodePen demo collection | GSAP is [100% free, including ScrollTrigger and SplitText](https://gsap.com/pricing/) |
| ★ [Lenis](https://lenis.darkroom.engineering/) | Smooth scrolling (<5kb) that keeps WebGL and the DOM in sync. The usual partner for ScrollTrigger | Free, open source |
| [Made With GSAP](https://madewithgsap.com/) | 123 effects with code zips and an AI prompt per effect (scroll, mouse, drag). Mostly DOM rather than WebGL | Paid, from €20/mo |
| [Drei ScrollControls](https://drei.docs.pmnd.rs/controls/scroll-controls) | The React Three Fiber way to scroll: `useScroll` gives damped offset plus `range()` and `curve()` helpers for each scroll section | Free |

## 3. Cinematic camera paths

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [Theatre.js](https://www.theatrejs.com/) | A visual sequence and graph editor for three.js: keyframe camera moves, lights and shaders, then play them back on scroll | [Core is Apache 2.0, the editor is AGPL](https://github.com/theatre-js/theatre). Only Core ships in your bundle |
| ★ [Blender glTF exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html) | Animate the camera in Blender and export it with the model. It supports cameras, punctual lights and object-transform animation | Free |
| [camera-controls](https://github.com/yomotsu/camera-controls) | Smooth camera transitions, fit-to-box framing and GSAP-driven camera paths for three.js | Free, open source |
| [three.js spline extrusion example](https://threejs.org/examples/webgl_geometry_extrude_splines.html) | A reference for moving a camera along a spline curve | Free |
| [GSAP MotionPathPlugin](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/) | Animates any values along a path with curviness and auto-rotate. Works for 3D coordinate arrays | Free |
| [ShotDeck](https://shotdeck.com/) | Film stills tagged by framing, lens, lighting, color and composition. Good for designing your camera shots | Pricing not stated on homepage |
| [FILMGRAB](https://film-grab.com/) | A free archive of film stills for framing and color reference | Free (Patreon-supported) |

**Pipeline tip:** keyframe the camera on a path in Blender, export it to glTF with cameras enabled, then tie the animation clip's time to ScrollTrigger `scrub` (or to Theatre.js's sequence position). This keeps the camera work in a tool you already know.

## 4. Getting CAD models web-ready

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [glTF Transform](https://gltf-transform.dev/) | CLI and SDK to prune, deduplicate, compress (Draco/Meshopt) and resize textures. Essential for heavy CAD meshes | **MIT** |
| ★ [gltf.report](https://gltf.report/) | Drop in a GLB to inspect and optimize it in the browser, built by the glTF Transform author | Free |
| [gltfjsx](https://github.com/pmndrs/gltfjsx) | Turns a GLB into a React Three Fiber component. Its transform step [cuts file size by 70–90%](https://github.com/pmndrs/gltfjsx) | Free, open source |
| [Khronos glTF Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/) | The reference renderer, for checking that your materials look right before blaming three.js | Free |

## 5. Materials and lighting

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [Physically Based](https://physicallybased.info/) | Measured color and optical values for real materials, plus light-source temperatures and intensities. Use it to get realistic steel, aluminum, cast iron and paint | Free |
| ★ [Poly Haven](https://polyhaven.com/) | HDRIs (16k+, unclipped) for studio and outdoor reflections, plus 8k+ PBR textures | Free, **CC0** |
| [ambientCG](https://ambientcg.com/) | PBR materials (metal, paint, concrete, tiles) and HDRIs | Free, **CC0** |
| [matcaps (nidorx)](https://github.com/nidorx/matcaps) | A large MatCap library with Three.js usage notes. A cheap, stylized look for x-ray or exploded views | Free. Credit creators where known |
| [Three.js Journey](https://threejs-journey.com/) | A 93-hour course covering materials, lighting, shadows, Blender light baking, shaders, scroll animation and performance | Paid (one-time). Some lessons free |
| [The Book of Shaders](https://thebookofshaders.com/) | Fragment-shader fundamentals: lights, normal maps, environment maps, reflection and refraction | Free |
| [Spline](https://spline.design/) | Quick 3D mockups with materials, lighting and scroll events, exported to WebGL/WebGPU. Has an MCP server for agents | Freemium |

## 6. HUDs and interface overlays

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [HUDS+GUIS](https://www.hudsandguis.com/) | Film HUD and GUI collections tagged by type: cockpit, holographic, scanner, schematics, design system. The schematics posts suit CAD callouts | Free |
| [Sci-fi Interfaces](https://scifiinterfaces.com/) | In-depth critiques of film interfaces. Good for deciding what a HUD should actually tell the viewer | Free, **CC BY-SA 3.0** |
| ★ [troika-three-text](https://protectwise.github.io/troika/troika-three-text/) | Sharp SDF text inside a three.js scene, for labels and callouts that sit in 3D space next to the model | Free, open source |
| [React Three Fiber showcase](https://r3f.docs.pmnd.rs/getting-started/examples) | Filter by the "HTML overlays" tag for DOM-based HUD panels pinned to 3D points | Free |

## 7. Fonts and pairings

| Resource | What it's good for | Cost / license |
|---|---|---|
| ★ [Typewolf](https://www.typewolf.com/) | Fonts used on current sites, alternatives to popular fonts, and pairing guides | Free (checklist is $399) |
| ★ [Fontshare](https://www.fontshare.com/) | 100 quality fonts and **100 ready-made font pairs** | Free |
| ★ [Uncut.wtf](https://uncut.wtf/) | 163 contemporary free typefaces, including **23 monospace**, which is where HUD readouts usually come from | Free for commercial use |
| [Fonts In Use](https://fontsinuse.com/) | 34,970 real projects searchable by typeface. See how a font performs in practice | Free |
| [Pangram Pangram](https://pangrampangram.com/) | 63 premium families (Neue Montreal, Monument, Neue Corp). Free to try, licenses from $40 | Paid for commercial use |
| [Google Fonts](https://fonts.google.com/) | 1,959 open-source families. A safe default for monospace and technical sans fonts | Free, open source |

**HUD pairing pattern:** a grotesk or wide display font for headlines, a monospace font for data readouts and part callouts, and a single accent color. Check that the mono font has tabular figures so changing numbers don't jitter.

## 8. Sources your agent can query directly

| Resource | Why it matters | Cost |
|---|---|---|
| ★ [A1 Gallery MCP](https://www.a1.gallery/mcp) | 17 tools covering 1,255 sites, 3,305 sections, 584 fonts and **font pairings**, plus design tokens measured from live pages | Free account: 50 requests/day. Pro: 2,000/day |
| [Refero MCP](https://refero.design/mcp) | 145,000+ real product screens and 12,000+ user flows. More UI than 3D, but useful for HUD panels and app chrome | Paid (Pro) |
| [Spline MCP](https://spline.design/) | Lets the agent work in Spline scenes directly | Freemium |

---
---

## Agent access notes

| Source | How to access it |
|---|---|
| A1 Gallery | Use the MCP (`a1`) if connected; prefer it over loading pages. Setup: `codex mcp add a1 --url https://www.a1.gallery/api/mcp` then `codex mcp login a1` |
| Awwwards, GSAP Showcase, Codrops, FWA, R3F showcase | Normal fetch or browser works. Follow each entry through to the live site |
| Godly, Land-book | Bot-protected (Godly blocks AI crawlers; Land-book uses a Cloudflare challenge). Needs an interactive browser the user controls. If one isn't available, give the user the gallery URL and ask for links or screenshots |
| GitHub repos (Codrops demos, camera-controls, matcaps, gltfjsx) | Clone with `git clone --depth 1` and read the source directly. No reverse engineering needed |
| Poly Haven, ambientCG | Direct downloads, CC0. Poly Haven also has a public API at `https://api.polyhaven.com` |
| ShotDeck, Refero, Made With GSAP | Paid. Ask the user before using them |

## Quick picks by layer

- **Whole-page direction:** Awwwards WebGL → GSAP Showcase → A1 `search_websites`
- **Scroll mechanics:** GSAP ScrollTrigger docs + Lenis + a matching Codrops demo
- **Camera path:** Theatre.js or Blender-baked glTF camera; camera-controls for transitions; ShotDeck/FILMGRAB for framing
- **Model prep:** glTF Transform (`optimize`) → gltf.report to inspect → Khronos Sample Viewer to verify materials
- **Materials and lighting:** Physically Based (values) + Poly Haven HDRI + ambientCG textures; matcaps for stylized/x-ray views
- **HUD:** HUDS+GUIS (schematics, scanner, holographic tags) + troika-three-text for in-scene labels
- **Type:** A1 `find_font_pairings` → Fontshare pairs → Typewolf; Uncut.wtf for free monospace fonts
