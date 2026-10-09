# Owner notes — marksList (received 2026-10-10)

Source: `C:\Projects\Misc\marksList.md` (+ `portal.png`, `cracks.png`, geometry references only). Copied here so the feedback lives in the repo. Owner-authored text is quoted; review notes are marked **Review**.

## Bullet time — owner definition (2026-10-10)
> Bullet time is a visual effect where temporal manipulation and spatial freedom are uncoupled: time is completely stopped (or extremely slowed down) for the subjects in a scene, while the camera continues to move at normal speed. The primary visual sequence this performs is stopping, or extremely slowing down time while the camera freely orbits or arcs around the frozen assets in 3D space.

Status ruling: the Input Shaft cutter slow-mo inside a scroll-driven timeline is good. The sequence is **NOT complete** (remaining: camera swings, slow-motion timing tweaks). It becomes the reference template only once completed; "planet gear inspection" and "machined after heat treat for class H7/g6 fit" are not yet in the camera sequence.

## List items (owner)
1. **Generative PBR environment lighting** — AI equirectangular panorama → `.hdr`/`.exr` → drei `<Environment files=… background blur={0} />` for reflections during the camera whip.
2. **AI depth + particle maps for time-frozen debris** — AI sparks/shards image + depth map → custom GLSL vertex shader, GSAP camera gives parallax. Owner note: *use this with the shattering effect when the torque wrench breaks through the drawing* (line is truncated in the source file).
3. **Generative texture masking for GLSL** — seamless circuit/blueprint alpha mask as a uniform; GSAP `uProgress` scans an emissive edge / holographic mesh transition across the CAD model as time stops.

## Opening scene (owner)
The opening has degraded from earlier iterations. The profile outline, its internal crack proliferation and shatter, and the void left behind should: vary speed like real cracks (e.g. 10% of the perimeter in 0.2 s, pause 0.2 s, another 15% fast, brief pause, cracks hasten and lengthen, fewer pauses); as the profile nears completion cracks proliferate across the enclosed area with the same fast-pause-farther-fewer-pauses rhythm. Geometry references: `portal.png`, `cracks.png`. **Colour: light blue electricity.**

## Review notes (2026-10-10, static reads only, nothing run)
- **The opening's rhythm is already in code**, not missing: `src/scene/drawing/electricalScore.ts` `BURST_KEYS` = 10% in .20 s, hold .20, 15% in .15 s, hold .15, 20% in .12 s, hold .08, 25% in .12 s (matches the note); the interior crack web (`branch`) reuses the same score. Landed as owner revision O1 (2026-10-07), reworked in `524bdb4e` (2026-10-08). So "degraded" is probably not the timing table. Candidates, unverified: (a) the quality tier dropping full→lite (known G6 problem; `portal.ts` has an `uPortalLite` branch that cuts octaves and shimmer), (b) the colour (the 2026-09-29 navy-pulse candidate vs. the owner's "light blue electricity"), (c) the shatter/void presentation. Needs a side-by-side capture of an older good iteration and HEAD before anyone changes code.
- **Item 1:** a PNG converted to `.hdr` has no real dynamic range, so reflections will lack true highlights. Use a real HDRI (e.g. a Poly Haven studio) or add drei `Lightformer` strips for specular hits. Budget a 1k–2k map; 8k is tens of MB and the Quiet Machine page already has a triangle budget problem. Needs Astra approval as a visual effect.
- **Item 2:** a flat texture displaced by a depth map only holds parallax for small camera angles; a wide bullet-time orbit will expose the flatness. Prefer real instanced shard geometry (AI image used only as texture/alpha). `src/scene/drawing/sheet/breakthrough.ts` and `breakthroughGeometry.ts` already exist for the shatter; read them before building anything new. Only one thing in this item touches bullet time: the shatter is the *opening*, not a bullet-time sequence.
- **Item 3:** fits the existing `CadTransitionShader` uniform pattern. Note lite-tier fallback and bounding-box uniform alignment (see skill glsl-transition-shader-pipeline).
- **Source-file defects:** the table rows are split by blank lines and row 2's trailing note is cut off; the "Opening scene" parenthesis is unclosed. Nothing is lost semantically, but confirm no text was truncated.
- **Scope:** none of this is in the approved Quiet Machine integration design. The three ideas apply to the torque wrench page (and possibly M249 later); the opening note is a torque wrench page fix. Treat all four as input to the torque wrench revision, not to the Quiet Machine work.
