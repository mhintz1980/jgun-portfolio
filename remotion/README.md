# Showreel v3 — "The Line"

The hero video for studiomark.dev, built in [Remotion](https://remotion.dev) 4.0.540.
Output: `public/video/showreel-v3.mp4` (1920×1080, 30 fps, H.264, silent). The committed MP4
is the accepted ~69 s cut; the source now runs ~74 s with the StudioMark ident (JG-041
iteration 1, owner-approved 2026-11-09) and "The Line" motif (JG-041 iteration 2, in review).

> Editing the film? Start with [HANDOFF.md](HANDOFF.md): tools, lessons, file map, how to add a chapter or change copy.

## The idea

"Follow the line": one Revision-Orange drafting line runs through the whole film. It is ruled
thin in ink, inked in orange by a plotter pen, and everything is drawn along it:

| Act | Frames | What happens |
|---|---|---|
| Opening | 0–195 | A line is ruled across the drafting sheet through three registration marks and inked orange while the name is drawn the way the site draws it (orange outline → ink fill). Then the line slides up, like a T-square, onto the drive axis. |
| 01 Torque wrench | 195–735 | That line becomes the drive axis. The wrench is plotted along it as a hidden-line CAD drawing, then one front sweeps the sheet — paper turns to studio, linework turns to metal. Two-speed shift, then the real rear-extraction explosion with the gear train turning. |
| 02 Quiet machine | 711–1251 | A vertical cut line wipes into the enclosure; the site's own section study plays: incision, supply air, two feeds, noise control. |
| 03 Armament | 1227–1707 | Back on paper: the line becomes a scan line across x-ray renders, then dark plates and labelled reference cards. |
| Close | 1707–2082 | The line is ruled and inked through three marks; each project label rises as the ink reaches it. The name is drawn again, and the line slides down to underline the address ("Follow the line"). |
| StudioMark ident | 2058–2223 | The orange cut line wipes in the owner-approved "Storm Ignition" logo bumper (muted). Its lockup holds while the cut line wipes the blank sheet back in. The last frame is the first frame, so the hero can loop. |

## Nothing is faked

The 3D is not a re-creation. The film imports the site's own code from `../src` and renders
it frame by frame:

- `src/scene/rig/nodeRoles.ts` + `wrenchMechanics.ts` — the torque-wrench rig, PBR roles,
  `EXPLODE_OFFSETS` ladder and `ROTATION_TURNS`, unchanged.
- `src/scene/rl300/*` — `prepareModel`, `AirRibbons`, `SectionCaps`, `LowerIntake` and the
  `evaluateShot` camera, driven by the film clock instead of scroll (`u` = the study's own
  progress value).
- Models, fonts and renders are read straight from `../public` (`remotion.config.ts` sets the
  public dir), so nothing is copied.

`remotion.config.ts` pins `three`, React and R3F to this package's copies so the site files and
the film share one instance.

## Owner rules, enforced

`src/rules.test.ts` runs in the root `npm test` gate:

- on-screen copy (`src/copy.ts`) passes the homepage's banned list plus: no GD&T, dimensions,
  tolerances or part numbers, no third-party firearm brands; armament copy says "AR-15-pattern";
- armament images come only from `public/home/armament-showcase/` (checked against
  `manifest.json`); a "representative" image can only be drawn through `ShowcaseCard`, which
  always carries "Representative model — similar to the part I designed";
- no source mentions the M249 models, and no engineering drawings (`home/drawings`,
  `home/stacks`, `public/drawing`) are used. The wrench linework is a live edge render of
  `Default.glb` — no dimensions, title block or part numbers;
- the logo lane plays only the approved bumper (`src/logo.ts`), always muted, with no audio
  element; the text baked into the bumper is recorded in `copy.LOGO` so the copy scan covers it;
  the rejected "Precision Revealed" showcase is never referenced;
- no AI-generated imagery anywhere.

## Commands

```bash
cd remotion
npm ci
npm run typecheck
npx remotion studio                                  # preview (needs a GPU / desktop)
npx remotion still Showreel out/still.png --frame=400
npm run render                                       # → ../public/video/showreel-v3.mp4
```

Compositions: `Showreel` (the film) and each act on its own under `Acts/`.

### Headless notes

- WebGL renders through ANGLE → SwiftShader (`Config.setChromiumOpenGlRenderer('swangle')`);
  plain `angle` and `swiftshader` fail to create a context in the sandbox.
- MSAA is off; `src/three/PostFX.tsx` owns the frame (render → bloom → SMAA → tone map), which
  is ~2× faster than MSAA on SwiftShader and just as clean.
- Cost on 4 CPU cores: ~0.3 s/frame for paper scenes, ~2 s for the wrench, ~6 s for the
  enclosure. A full render took 106 min at `--concurrency=3` (the enclosure act is most of it).
- Don't run `npx remotion upgrade` here (it crashes); bump with `npm install pkg@version`.

## Review materials

`review/` holds 18 stills (one per beat) and `contact-sheet.jpg`, extracted from the committed
MP4 with `npm run stills`. `public/video/showreel-v3-poster.jpg` is a poster frame for an
eventual `<video poster>`; embedding the film on the site is the owner's call.
