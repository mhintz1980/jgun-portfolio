---
name: motion-webgl-inspiration
description: Research-first workflow for scroll-driven 3D/WebGL sites built from CAD models (three.js, React Three Fiber, GSAP ScrollTrigger, Lenis). Use BEFORE designing or building a 3D product page, scrollytelling hero, exploded-view or assembly animation, cinematic camera path, PBR material/lighting setup, HUD/callout overlay, or font pairing for technical UI. Gathers live references from curated galleries, optionally breaks down standout sites with REA, then writes a Reference Brief before code. Skip for small bug fixes, non-visual work, or when the user supplies a locked design.
---

# Motion + WebGL inspiration (CAD-driven)

Generic 3D sites come from building from memory. Look at how the best sites
solve the same problem first, decide on a direction, then build.

## When to use

- New or redesigned 3D scroll experience, product page, or portfolio piece built around a CAD model.
- Any one layer of that work: camera path, materials and lighting, HUD and callouts, typography.
- A draft that looks generic and the user asks to "make it cinematic," "more premium," or similar.

Skip it when the user supplied a locked design, for small fixes inside an existing
design system, and for non-visual tasks.

## Inputs to confirm (assume sensible defaults if not given)

1. Subject: the product or model, the audience, and the story the scroll tells (e.g. reveal, then exploded view, then specs, then CTA).
2. Model: source format (STEP, STL, OBJ, FBX, GLB), rough triangle count, and whether it's already in Blender.
3. Stack: vanilla three.js, or React Three Fiber + Drei. Default to vanilla three.js + GSAP ScrollTrigger + Lenis unless the project is already React.
4. Scope: whole page, or one layer (camera, look, HUD, type).

## Existing-project mode (read this first in an existing repo)

When the scene already exists, the job is **deltas, not a rebuild**:
1. **Use the latest branch.** List branches by last commit date (`gh api repos/<o>/<r>/branches` plus commit dates) and audit the newest unless the user names one. Older branches give wrong answers.
2. **Read the project's own rules and specs** (AGENTS.md, animation/explode specs, owner decisions) before proposing anything. Measured project data beats this skill's defaults. **Copy explode directions and offsets from the spec; never invent them.** Example: a housing whose bore necks down at the front stays static, and the internals extract rearward, so the housing ends up in front of the gearbox parts.
3. **Audit the current state from source:** environment, lights, tone mapping, post, materials, camera system, HUD fonts and colors. Record file and line.
4. **See it running:** build, preview, then `scripts/capture-scroll-frames.mjs` with the project's quality/tier param (e.g. `?quality=lite`) and `--timeout 90` for heavy scenes.
5. **Write the Reference Brief as an audit plus ranked suggestions** (most visible first), each tied to a reference and a file. Respect owner constraints (deferred HUD, protected assets, part-number keys). Never swap authored materials for heuristics (`materials: 'cad-auto'` is for raw CAD exports only).
6. **Prototype only in scratch** (gitignored dirs, a new branch or a worktree), never in tracked files, unless the user approves.

## Workflow

### 1. Name the job
Write one line: what the page is, who it's for, which layer you're designing.

### 2. Collect references (3–5)
Pick sources by layer from `references/sources.md`. Do not visit every source.

- Whole-page motion and 3D: Awwwards WebGL/3D collections, GSAP Showcase, Codrops Webzibition, The FWA.
- If the **A1 MCP** (`a1`) is connected, query it first (`search_websites`, `search_sections`, `find_font_pairings`, `analyze_design_tokens`). It returns structured data, so you don't have to load the pages.
- Galleries that block bots (Godly, Land-book) need a real browser session. Do not try to work around their bot protection.
- Gallery entries often link to an X/Twitter post rather than the site itself. Always follow through to the **live site URL**, because later steps need it.

For each reference record: URL, what it is, and **the one pattern you are taking** (layout, camera move, material treatment, HUD idea, or type pairing).

### 3. Break down 1–2 standout sites (REA, optional)
If REA tools are available (look for `inspect_web_page`, `analyze_web_bundle`,
`observe_web_session`), read `references/rea-breakdown.md` and hand off to REA's
own `reverse-engineer-anything` skill for the mechanics. Do not duplicate that
skill. Goal: understand *how* an effect works (libraries, scroll structure,
timing, shader approach), not copy its code.

If REA is not available, open the site in a browser and use DevTools (Sources tab,
Network tab filtered to JS and .glb/.hdr/.ktx2) to identify libraries and assets.

### 4. Pick a technique base
For vanilla three.js, start from **`assets/starter-vanilla/`** (copy it into the
project). It has a fixed canvas, Lenis + ScrollTrigger, spline or baked-glTF camera,
an exploded view, HUD callouts and reduced-motion handling, and it runs with a
placeholder model. Configure it in `scene.config.js`. See its README.

For specific effects, find the closest open-source demo: Codrops (most repos are
MIT), the React Three Fiber showcase, or GSAP CodePens. Build on those, never on
another site's bundled code. Check the license in the repo before reusing code.

### 5. Prepare the model
Follow `references/cad-to-web.md`: units and scale, up-axis, normals, instancing
repeated parts, glTF export with cameras, then compression with glTF Transform.

### 6. Look development, HUD, and type
Follow `references/look-dev-hud-type.md`: an HDRI plus measured material values,
tone mapping, camera framing from film references, HUD layout, and the font pairing.

### 7. Write the Reference Brief, then build
Fill in `assets/reference-brief-template.md` and show it to the user **before
writing implementation code**. Each major decision must name the reference it
came from. Then build.

### 8. Compare against the references
Serve the site, then run `scripts/capture-scroll-frames.mjs <url> <outDir>` and
again with `--mobile` (needs Playwright). It screenshots 0/25/50/75/100% and fails
on console errors. Compare the frames with the references and the brief, check
for text and model overlap and off-screen callouts, then fix drift before handoff.

## Scripts

- `scripts/capture-scroll-frames.mjs`: scroll-position screenshots and console-error gate (workflow step 8).
- `scripts/check-sources.mjs`: checks every link in `references/sources.md`. Run it when sources may be stale.

## Guardrails

- Learn patterns; never copy another site's code, models, textures, fonts, copy, or brand assets.
- Respect licenses: CC0 (Poly Haven, ambientCG), MIT (most Codrops demos, glTF Transform), and per-font licenses. Commercial fonts (e.g. Pangram Pangram) need a license before shipping.
- Performance budget by default: GLB ≤ 5 MB compressed for a hero model, textures ≤ 2K unless the shot needs more, and a 60fps target on a mid-range laptop. Provide a reduced-motion fallback (`prefers-reduced-motion`).
- Ask before signing up for paid services (Refero, Made With GSAP, ShotDeck) or installing new MCP servers.

## Output

Before code, show the user:
- The job in one line.
- The sources checked.
- 3–5 references, each with a live URL and the one pattern taken.
- The REA findings, if run (libraries, scroll structure, notable techniques).
- The completed Reference Brief.
