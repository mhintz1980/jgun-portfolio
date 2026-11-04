# HUD concept brief — builder delivery

2026-10-31. Scope: independent standalone global-chrome concepts for the v2 trial. This is not the completed comparison packet or a production HUD implementation.

## Location and preview

Prototype workspace: `C:\Users\Markimus\AppData\Local\Temp\design-os-hud-trial-2026-10-31\concepts-codex-1031-a7f2` (external to repository). Entry: `index.html`; shared implementation `style.css` and `app.js`. HTTP preview running at `http://127.0.0.1:8769/` (Python http.server process 22244, if still running). To restart after checking the port is free:

```powershell
python -m http.server 8769 --bind 127.0.0.1 --directory 'C:\Users\Markimus\AppData\Local\Temp\design-os-hud-trial-2026-10-31\concepts-codex-1031-a7f2'
```

The query interface is `?concept=A|B|C&state=opening|shaft|exploded&scene=<URL-encoded-image-URL>`; concept defaults to A and state to exploded. A scene URL is mandatory for real visual comparison. The image is drawn edge-to-edge; use a clean image with exactly the target viewport dimensions and DPR 1 to avoid scaling or crop differences. All concepts render the same scene URL unchanged. The caller is responsible for matching the state to the image and using a HUD-free capture. Baked HUD images must not be used. Missing or failed images show a placeholder rather than silently using another frame.

For example, serve the capture agent's image directory on a separately inspected free port (replace the path and filename; do not copy or modify the originals):

```powershell
python -m http.server 8770 --bind 127.0.0.1 --directory 'C:\absolute\path\to\clean-captures'
```

Example for the same exploded input across concepts (encode the complete URL when inserting it as a query parameter):

```text
http://127.0.0.1:8769/?concept=A&state=exploded&scene=http%3A%2F%2F127.0.0.1%3A8770%2Fexploded-desktop.png
http://127.0.0.1:8769/?concept=B&state=exploded&scene=http%3A%2F%2F127.0.0.1%3A8770%2Fexploded-desktop.png
http://127.0.0.1:8769/?concept=C&state=exploded&scene=http%3A%2F%2F127.0.0.1%3A8770%2Fexploded-desktop.png
```

For each comparison use the capture agent's matched 1440x900 or 390x844 clean image and the same viewport and quality as its corresponding control; capture browser screenshots at DPR 1 after the image loads. Use the same URL, state, viewport and image for A/B/C, and retain the separately captured original-HUD control. The query state selects caption copy, not a camera seek; chapter controls deliberately change labels without changing the image. Avoid capturing immediately after a simulated action if the temporary simulation notice would obscure the image.

## Common brief and inventory

Viewer: a visitor exploring Mark's JGUN case study. Primary action: follow the five-part story while the model remains central. Common content: StudioMark and JGUN identity; discreet work-in-progress label; Drafting, Breakthrough, Mechanism, Inspection and Assembly chapter cues; navigation to chapters and pages; Free Look / Inspect entry; contextual details with a long actual Input Shaft P001835 label and location for cutter inspection playback. These are representations of intended locations, not the live application's functionality. Wording is drawn from `src/scene/torque-wrench/Story.tsx`, `TorqueWrenchPage.tsx`, and `RuntimeWorld.tsx`; no speed, load or other numeric telemetry is fabricated. The story's `close` ID displays its real title, Assembly.

States/widths: opening (.418) maps to Breakthrough (manifest beat breakthrough-pressure), shaft (.735) to Inspection (inspection-materials), and exploded (.940) to Assembly (mechanism-exploded-hold, poster chapter close). The manifest confirms these mappings at both target viewports. If the recorded production state differs, choose one of `drafting`, `breakthrough`, `mechanism`, `inspection`, `close` explicitly for all matching comparisons. Scene content/provenance and achieved seek are owned by the capture agent. There are no projected anchors, reticles or part-attached labels; this trial can compare global chrome/composition only, not moving callout placement or parity with the original anchored interactions.

- **A / Museum caption:** small bottom edge caption and details disclosure; numbered chapter marks occupy the opposite edge. Hypothesis: a quiet caption keeps attention on the scene, though numbered marks may require discovery.
- **B / Technical margin:** persistent editorial rail on desktop, condensed into top and bottom bands on narrow screens. Hypothesis: a stable textual margin helps orientation, at the cost of more fixed image coverage.
- **C / Minimal transport:** top edge caption and compact bottom chapter strip, with narrow chapter choices disclosed. Hypothesis: the story can be navigable with little persistent copy, though mobile discoverability depends on the Chapters control.

Interactions are visibly identified as concept simulations. Details and pages open prototype disclosures; chapter navigation changes prototype copy, and Free Look and cutter inspection show a simulation notice. No scene motion, playback, real navigation, or production behavior is implied. No owner direction has been selected.

## Verification and limits

`node --check app.js` passed. A local Playwright/Chromium check exercised A/B/C at 1440x900 and 390x844, with no page errors or document overflow, and verified the detail disclosure and Free Look simulation notices. `check.cjs` and the six `check-*-*.png` images in the external folder document **placeholder-only** checks, not real-scene proof. A separate `check-image.cjs` loaded an encoded synthetic SVG fixture, checked the missing-image state was hidden, and exercised mobile C chapter navigation. Screenshots were not evaluated for real geometry clearance; no anchor, camera, motion, full accessibility or owner acceptance is claimed. The capture agent supplies clean images and the parent owns matched comparison outputs, original controls, critic, Design OS utility assessment and final integration. No Design OS CLI execution or lint claim is made by this builder.
