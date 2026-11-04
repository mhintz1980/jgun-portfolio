# Look development, HUD, and typography

## Materials

- Take base color, roughness and IOR values from **Physically Based** (https://physicallybased.info/) for real materials (steel, aluminum, cast iron, rubber, painted metal) instead of guessing.
- Industrial parts look real through **roughness variation**, not color. Add a subtle roughness texture or a grunge map from ambientCG or Poly Haven (both CC0).
- Use `MeshStandardMaterial` for most parts. Use `MeshPhysicalMaterial` only where it adds something: clearcoat for painted housings, transmission for glass/sight gauges, sheen for fabric or rubber.
- Stylized beats (x-ray, cutaway, "blueprint" mode): matcaps (github.com/nidorx/matcaps), or an unlit/emissive edge or wireframe pass, crossfaded by scroll.

## Lighting

- Base lighting: an HDRI from Poly Haven (studio HDRIs for product shots), loaded with `HDRLoader` (`three/addons/loaders/HDRLoader.js`; `RGBELoader` was deprecated in r180) and set as `scene.environment` through `PMREMGenerator`. With no HDRI, `RoomEnvironment` is a decent studio default. Keep `scene.background` a flat color or gradient so the HDRI doesn't compete with the model.
- Add 1–2 directional or area-style key lights for shape and a rim light to separate the silhouette. Take color temperatures from Physically Based's light-source table.
- Shadows: soft contact shadows under the model (Drei `ContactShadows` or a baked shadow plane) are cheaper than shadow maps. Bake ambient occlusion in Blender for close-ups.
- Tone mapping: set `renderer.toneMapping` to ACES Filmic, AgX or Neutral and `renderer.outputColorSpace = THREE.SRGBColorSpace`. Pick one and keep it for the whole page.
- Post-processing: use it sparingly. A small amount of bloom on emissive HUD elements and an optional depth-of-field pull on close-up beats. Skip SSAO if the AO is baked.

## HUD and callouts

References: HUDS+GUIS (https://www.hudsandguis.com/), especially the schematics, scanner and holographic tags. Sci-fi Interfaces (https://scifiinterfaces.com/) helps decide what a readout should actually tell the viewer.

Implementation options:
- **DOM overlay (default):** absolutely positioned HTML labels projected from 3D anchor points each frame (`vector.project(camera)`). These are crisp, accessible and easy to style. In React Three Fiber, use Drei `<Html>`.
- **In-scene text:** `troika-three-text` (SDF text, parses .ttf/.otf/.woff, not .woff2) for labels that need depth, occlusion or perspective.
- **Leader lines:** SVG overlay or thin `Line2` meshes from the anchor to the label, which also animate on scroll.

Patterns that work for engineering subjects:
- Callout = part name + one spec (e.g. "PUMP END — 6\" × 6\" / 2,000 GPM"). Never a paragraph.
- Reveal callouts in the beat that focuses on that part. Remove them when the camera leaves.
- Thin 1px strokes, corner brackets, a small tick-mark scale, monospace numerals, one accent color plus neutrals.
- Count-up numbers with tabular figures (`font-variant-numeric: tabular-nums`) so the digits don't jitter.
- Keep text contrast at WCAG AA or better against the darkest and lightest frames of the scene behind it.

## Typography

Sources: A1 `find_font_pairings` (if connected), Fontshare's 100 ready-made pairs, Typewolf, Fonts In Use (to see a font in real projects), Uncut.wtf (163 free fonts, 23 monospace), Google Fonts.

Pairing formula for technical 3D sites:
- **Display:** a grotesk or wide/extended sans for headlines (an industrial, precise feel).
- **Body:** a neutral sans with good small sizes.
- **Data/HUD:** a monospace font, or a sans with tabular figures, for specs, coordinates and readouts.
- At most three families, ideally two (display + mono, with the display font's text cut for body copy).

Checks before you commit:
- The license covers web embedding and commercial use (Fontshare and Uncut are free for commercial use; Pangram Pangram needs a paid license to ship; Google Fonts are open source).
- The font has tabular figures, the weights you need, and real italics if you'll use them.
- If the font will be used with troika, you have a `.woff` or `.ttf` file, since troika doesn't read woff2.
