# Static shaft completion — 2026-10-06

SOURCE AND ASSETS READY. GPU RELEASED. No further src/CSS edits are needed. Parent may build the production integration now. All captures and static browser checks completed on dev5199 before the requested intermediate preview build; no production proof is claimed here.

## Delivered

- DOM-only six-part study in `StaticShaftStory.tsx`, preserving the four chapter transcript, three exact FAILED alloy cards, designer attribution, final heat-treated 4340 card and two exact Illustrative stress concentration captions.
- Sixteen true raster WEBPs in `public/inspection/shaft/`: eight desktop 960×600 and eight narrow 600×600. Total 244,962 bytes. All images have descriptive alternatives and lazy responsive picture selection.
- Genuine blank with zero formed/partial teeth at 25 s, completed hobbed shaft with ten formed teeth at 32.4 s, warm stress at 17 s, cool stress at 34.2 s, assembled finale at 42.5 s. No tools visible in blank/hobbed/final shots. Cutter exit at 8.4 s retains the visible disc cutter and real original groove.
- Same-session support comparison at exactly 35.8 and 38.2 s for both layouts, identical camera and projection matrices (maximum delta 0), shared crop and output transform. The nominal design shift is +2.75 mm. At 35.8 s the authored transition is already 2.8% underway, so the captured pair depicts 2.673 mm remaining motion; product copy truthfully calls this the start of the move. It does not imply an exact physical metrology measurement from the stills.
- Blank/hobbed cameras differ because they use their authored process views; product copy and provenance make that clear. No quantitative same-camera geometry proof is inferred.

## Deciding evidence

`static-shaft-2026-10-06/completed-render-capture/capture-report.json` records all 16 raw DOM-hidden renders, SHA256, complete before/after telemetry, actual entryElapsed >= 1.2, matching sample/camera time and stamps, ready/paused state and session/epoch. The observer requires three distinct completed-render stamps with stable world/projection matrices before and after hiding DOM, then compares a subsequent completed frame after screenshot. Every capture has camera drift 0. No camera/runtime/CAD state was forced.

`static-shaft-2026-10-06/raster-manifest.json` links every output raster to its source PNG and hash, crop, source/output dimensions, byte size, sample time, session, camera/projection and observed entryElapsed. Only dark canvas margins were cropped; no redraw or geometry alteration. Both support images share the union crop. `encode-stills.py` reproduces the WEBPs.

`static-shaft-2026-10-06/browser-report.json` passes poster-desktop, poster-narrow, reduced-desktop and reduced-narrow against dev5199. Each loads all eight selected images and verifies the six visual parts, exact text, meaningful alt/lazy policy, responsive variants, no overflow, controls >=44 CSS px, sticky reachable Return, entry focus, Tab/Shift+Tab confinement, Return/Escape focus and page restoration, frozen ready static playhead, and zero inspection CAD/tool requests. Poster requests zero total CAD. Reduced-motion cases each request exactly the pre-existing three narrative CAD assets; they contain no inspection canvas and no manufacturing/tool request. Whole-page reduced-motion zero-CAD V4 remains an owner policy decision.

`npm run typecheck` passed before captures and again after all static wording edits (exit0). No build, server, runtime, CAD, camera, metadata, verifier or git files were changed by this leaf.

## Preserved failed helper evidence

The original GLM capture failures remain untouched. `completed-render-capture-failed-boot/` preserves the initial readiness timeout. `completed-render-capture-failed-store-instance/` preserves a second instrumentation failure: importing `/src/state/inspectionStore.ts` without Vite's live timestamp loaded a second module instance and replaced the global telemetry probe while the actual app store kept its own state. The corrected helper imports the exact URL already requested by the page and verifies telemetry identity before instrumenting renders. The fresh corrected run completed both layouts with no browser errors. This is an instrumentation correction, not an authored camera workaround.

Production integration build, final repository checks and owner visual acceptance remain with the parent.
