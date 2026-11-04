# Comparison capture and checks — 2026-10-31

Comparison owner: standalone rendering and assembly only. Production code, the capture agent's baseline and the builder's external prototype were not modified. The original concept is a simulation, not the production HUD. Owner selection remains open.

## Review packet

- [Exploded-state overview sheet](comparison-sheet.jpg): 1680 × 1190 JPEG, 159,738 bytes; original control and A/B/C at desktop and narrow sizes, reduced for comparison. Open native-size images for legibility and occlusion review.
- Gallery: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\output\playwright\design-os-hud-trial-2026-10-31\comparison\index.html`. The ignored `comparison/desktop/` and `comparison/narrow/` folders contain **18 native-size concept PNGs and six original-HUD control PNGs**.
- Motion: `comparison\motion\control.mp4` and `concept-A.mp4`, `concept-B.mp4`, `concept-C.mp4` under that same trial output directory. All are 1440 × 900, 192 frames, 24 fps, eight seconds, confirmed with `ffprobe -count_frames`. Control is an exact copy of the capture agent's control MP4. A/B/C use one static, browser-rendered transparent Inspection HUD apiece composited over the same clean frames using ffmpeg; they do not simulate state-dependent HUD movement or interaction.
- Browser check detail: `comparison\checks.json`; scene comparison: `comparison\scene-pixel-checks.json`. Source manifest and motion provenance are in `baseline\manifest.json` and `baseline\motion\full\sequence-final.json` respectively.

## Inputs and mapping

All concept captures used clean PNGs, not baked-HUD controls, as the scene `<img>` at its exact viewport dimensions, DPR 1. Controls are copies of the corresponding original-HUD PNGs. Baseline manifest reports source bundle fingerprint `3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b`; its six clean and six control hashes were rechecked successfully. Its layout, narrative progress, camera and restoration invariants report true for all six pairs.

| Requested scroll fraction | Manifest beat | Prototype state and displayed title |
| --- | --- | --- |
| .4180 | breakthrough-pressure | breakthrough / Breakthrough |
| .7350 | inspection-materials | shaft / Inspection |
| .9400 | mechanism-exploded-hold | exploded / Assembly |

The builder corrected the `opening` alias while this packet was in progress; the final capture uses the explicit `breakthrough` state and was rerendered after the correction. Each prototype view is a flat image with simulated chrome, not a live R3F scene.

## Still checks

- The initial independent critic reported missing shaft content in desktop .735 A and B. Those early files may have been read during a refresh; the cause is not established. The final render explicitly waits for the scene image `decode()`, font readiness and two animation frames before screenshotting. All 18 images were recaptured after the correction.
- Compared each final concept PNG with its matching clean input: among source pixels with any RGB component greater than 40, the proportion matching within two levels per channel ranges from 72.73% to 100%. Lower figures reflect intentional HUD coverage and are not clearance verdicts. For the disputed desktop .735 A, B and C images, **100%** of those bright source pixels match; the shaft is present. Detailed counts are saved in `scene-pixel-checks.json`.
- Across 18 final renders: expected scene decoded at 1440 × 900 or 390 × 844; `#missing` hidden; document scroll width/height did not exceed viewport; zero browser console errors, page errors or failed requests. This does not prove absence of clipped child content, contrast defects, keyboard behavior, geometry clearance or production interaction.
- Static upstream `validate-layout` findings and classification on the builder's earlier external snapshot are in `04-tool-trial.md`: `css-100vw-width` source pattern (no document overflow observed at these tested sizes), and `img-no-dimensions` likely false positive for layout shift. That static check predates the alias-only correction, and is not a production audit.

## Motion provenance and limits

Capture agent's `sequence-final.json` reports 192 paired seeks, zero final pair mismatches and zero errors; one initially unsettled pair (frame 69) was recaptured. Representative playback assumes one 900 px viewport per second, beginning at narrative progress approximately .7349971 and ending approximately .7867539. This is deterministic sampled scroll playback at an assumed rate, not a recording of human scrolling. Source anchors were inactive; comparisons cover global chrome and composition only. No moving anchored-callout claim is supported. Narrow motion, full interaction and accessibility demonstrations remain deferred.

The concept motion overlays are constant for the full Inspection segment; the scene changes through inspection materials and hobbing while the concept copy stays fixed. The control clip comes from the original matching HUD frames. A decoded midpoint frame of concept A was inspected and showed both the moving subject and HUD. Timing metadata was checked for all four files; no visual acceptance or mechanical verification is inferred.

## Reproduction and environment

Inspected ports 8765 and 8766 before launch. Separate local Python static servers served, respectively, the baseline directory and external prototype directory at `http://127.0.0.1:8765/` and `http://127.0.0.1:8766/`; neither server writes its served directory. Trial-only scripts are in `.scratch/design-os-hud-trial-2026-10-31/`: `comparison-capture.cjs`, `comparison-sheet.py`, `motion-overlays.cjs`, `encode-motion.ps1`, and `comparison-report.py`. `comparison-capture.cjs` uses the repository's installed Playwright Chromium, creates viewports at DPR 1 and saves its checks. `encode-motion.ps1` uses ffmpeg with the same frame count and 24 fps for all concepts. No dependency install, production build, camera change, deployment or asset regeneration was performed in this comparison lane.

The critic's earlier still review includes the missing-image observation and should be updated against the corrected images; clip critique and the overall trial decision remain owned by the parent/critic. Existing cinematic failures and owner acceptance remain unchanged.
