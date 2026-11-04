# Breaking down a reference site with REA

REA (Reverse Engineer Anything, https://github.com/morluto/rea) connects the agent
to a Chrome-family browser through the Chrome DevTools Protocol and returns
evidence-backed findings about a live page. This file covers **what to look for
in motion and WebGL sites**. For how to call REA, defer to REA's own
`reverse-engineer-anything` skill and the connected server's actual tool list.
REA updates often, so don't rely on tool details copied here.

## Setup (once)

- Install and register with Codex: `npx rea-agents setup`, choose Codex, approve, then restart Codex. Update later with `npx rea-agents@latest setup`.
- Start a **separate** Chrome profile with a debugging port. Since Chrome 136, `--remote-debugging-port` is ignored on the default profile:

  ```bash
  google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/rea-browser-profile https://example-reference-site.com
  # macOS: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=/tmp/rea-browser-profile <url>
  ```

- Keep the port on loopback only. Close that profile when you're done.

## Who scrolls

- **The user scrolls (preferred for scroll effects):** `list_browser_targets` → `observe_web_session` or `observe_web_execution` for a set window. Tell the user to scroll slowly through the whole page during that window.
- **The agent acts:** `capture_browser_scenario` with declared actions (connect mode navigates the page to `start_url` first). Report that REA performed the actions.

## Breakdown checklist

Run only the steps needed to answer the question.

1. **Inventory:** `inspect_web_page` for the DOM structure, scripts, resources and network. Look for:
   - Libraries: three.js, @react-three/fiber, drei, gsap + ScrollTrigger, lenis, theatre, ogl, pixi, babylon, spline-runtime.
   - 3D assets: `.glb`/`.gltf`, `.drc` (Draco), meshopt, `.ktx2`/basis textures, `.hdr`/`.exr` environment maps, and their sizes.
   - Canvas count and whether the canvas is fixed full-screen behind the DOM (common) or inline.
2. **Bundle analysis:** export the captured scripts and run `analyze_web_bundle` for vendor fingerprints, chunk graph and source maps (if published). Source maps make everything else much faster.
3. **Scroll structure:** use `inspect_web_event_listeners` on the scroll container or `window`, plus DOM evidence, to identify:
   - Pinned sections (ScrollTrigger `pin`, `position: sticky`) and their lengths.
   - Scrubbed timelines versus triggered one-shot animations.
   - Smooth-scroll layer (Lenis, or a custom wrapper using transforms).
4. **Timing:** from the observed session, note where scroll positions map to key moments (e.g. 0–20% reveal, 20–55% exploded view, 55–80% detail orbit, 80–100% CTA), plus easing character and damping.
5. **Rendering approach:** identify which of these it uses: real-time PBR with HDRI, baked lighting, matcaps, post-processing (bloom, DOF, SSAO), and custom shaders. Shader source may show up in strings in the bundle.
6. **Screenshots:** `capture_web_screenshot` at the key scroll positions for the brief. Use `compare_web_screenshots` later to check your build against your own targets.

## Report back

Write a short block per site:

```
Site: <live URL>
Stack: <libraries + versions if known>
Assets: <model format/compression, texture format, env map>
Scroll: <pinned sections, scrub vs trigger, smooth-scroll lib, total length>
Camera: <path type: spline / keyframed / orbit; FOV changes; target easing>
Look: <lighting approach, tone mapping, post FX>
Take: <the one technique we will re-implement ourselves>
Limits: <what REA could not establish>
```

## Boundaries

- Use findings to understand a technique, then re-implement it from docs or an
  open-source demo. Don't lift bundled code, models, textures, shaders, or fonts.
- REA's page observation is passive. Never claim it captured anything outside the observation window.
- If REA tools are missing or a call fails, follow REA's connection and recovery
  guide once. If it's still blocked, fall back to DevTools and keep going.
