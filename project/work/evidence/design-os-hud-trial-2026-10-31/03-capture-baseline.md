# HUD trial capture baseline — 2026-10-31

Six paired still states and 192 paired desktop motion frames captured; two eight-second baseline clips encoded and verified. No production changes, asset regeneration, build, deployment or acceptance claim. Existing evidence 73 failures remain unchanged.

## Inputs and provenance

- Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`; HEAD `ccb215b2cbd9f4206691d4c41d1c5c942c251a37`, with substantial pre-existing dirty continuation. Source is not clean HEAD.
- `dist/` fingerprint `3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b`, computed for 73 files using evidence 74's sorted relative-path / SHA-256 rows, LF joined without trailing newline. Matches published WIP evidence 74. Served torque document SHA-256 `7ad52f39af6bbe7f6e07c56b185d6b55476b39d9d9068c91b139c4f0a6b09fd4` matches local dist. Temporary preview: `http://localhost:5349/torque-wrench/`.
- Installed Chrome headless, repository ANGLE/D3D11 launch configuration, DPR 1; observed `full` tier for all six states. No browser errors recorded. This is capture evidence, not a completed camera/HUD gate.
- Durable [manifest](baseline/manifest.json) records absolute image paths and SHA-256, detailed narrative, camera, existing projected anchors, layout, suppression elements/original styles and equality observations. All 12 still image hashes independently recomputed successfully. Motion manifest has frame and clip hashes.
- Raw stills: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\output\playwright\design-os-hud-trial-2026-10-31\baseline\{desktop,narrow}\p-{0.4180,0.7350,0.9400}-{control,clean}.png`. Trial helpers: `.scratch/design-os-hud-trial-2026-10-31/`. Both are ignored.

## Capture method and results

Native scroll sought via `__torqueNarrative.scrollFraction(p)`; wait for progress within 0.00005 and settle. Screenshots use the production browser canvas/composition. For clean images hide `.torque-chapter`, `.torque-inspection`, `.torque-inspection-overlay`, `.torque-freelook-toggle`, `.torque-hotspot-layer` with inline `visibility:hidden!important`, then restore original inline styles. No DOM removal, `display:none`, geometry change, inpainting or independent raw WebGL render. All six states have equal recorded scroll height, scroll Y, canvas rect/buffer, narrative progress and full camera snapshot across suppression; restore layout also matched. This does not assert all other scene pixels are bit-identical between sequential screenshots.

| Viewport | Request | Achieved progress | Beat |
|---|---:|---:|---|
| 1440×900 | .418 | .4180034138 | breakthrough-pressure |
| 1440×900 | .735 | .7349970882 | inspection-materials |
| 1440×900 | .940 | .9399886494 | mechanism-exploded-hold |
| 390×844 | .418 | .4179995765 | breakthrough-pressure |
| 390×844 | .735 | .7349971495 | inspection-materials |
| 390×844 | .940 | .9399970708 | mechanism-exploded-hold |

Native-size visual inspection confirmed the drawing/electrical scene, FEA shaft, and exploded drivetrain; the narrow exploded image naturally crops part of the mechanism. The existing UI remains intact in each control.

## Motion and anchor evidence

`ffmpeg` 8.1.1 available. The first helper attempt failed before frame capture with `ReferenceError: y is not defined`; corrected the trial-only helper and reran. Ten paired seek/capture samples took 12.771 s (mean 1.2771 s/pair), zero failed frames/errors, matching camera/progress across suppression in all ten; projected 192 pairs 245.2 s, below 30 minutes. See [preflight](baseline/motion-preflight.json).

Full frame directories: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\output\playwright\design-os-hud-trial-2026-10-31\baseline\motion\full\{clean,control}\0000.png` through `0191.png`. Assumed playback is one 900 px native viewport per second, 24 fps, starting from .735 via native scroll. Achieved narrative progress runs .7349970882 to .7867538730, from inspection materials into hobbing. This is a discontinuous seek sequence encoded at 24 fps, not a real-time recording or canonical human speed.

The 192-pair run took 259.149 s, with no browser errors. Initial frame 69 had unsettled progress .7535580661 to .7539414968 and camera movement at fixed scroll. It was recaptured after 5 s settling; all 192 final pairs match progress and camera. Both original and replacement observations remain in [motion sequence evidence](baseline/motion-sequence.json), which includes each frame hash. Both `motion/full/control.mp4` and `motion/full/clean.mp4` were encoded; ffprobe verified 1440×900, 24 fps, 192 frames, exactly 8 s. Clip hashes are in the manifest.

[Anchor evidence](baseline/anchors.json) records all four existing hotspot IDs, stable part mappings and visibility: all 768 observations were inactive in this segment. The existing runtime does not supply a usable shaft-attached track here; restrict comparison to global chrome/composition and intended information access. No equivalence claims for moving attached callouts. Three hotspot identities are suspended in source and no anchor is invented.

The concept packet and owner direction decision are outside this capture report. Runtime/geometry acceptance, final visual acceptance, interaction proof and motion readability verdict remain open.
