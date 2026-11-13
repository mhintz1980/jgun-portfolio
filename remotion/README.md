# Showreel v3 — "The Thread"

> **SUPERSEDED DIRECTION (owner ruling 2026-11-13).** The go-forward showreel is the "The Line"
> rework — slices owner-approved 2026-11-09 — on branch `torque-wrench/rebuild` (see that
> branch's `remotion/README.md`; approvals in its `docs/HANDOFF-showreel-v3-2026-11-09b.md`/
> `-09c.md`). "The Thread" (this composition) is NOT the direction. The description below
> documents the Thread-era source preserved on this branch; the homepage MP4 is replaced only
> after Mark accepts a "The Line" cut. The "Precision Revealed" rejection still stands.
> Directive status: `TODO.md` JG-041.

The hero video for studiomark.dev, built in [Remotion](https://remotion.dev) 4.0.540.
Output: `public/video/showreel-v3.mp4` (1920×1080, 30 fps, ~69 s, H.264, silent).

> Editing the film? Start with [HANDOFF.md](HANDOFF.md): tools, lessons, file map, how to add a chapter or change copy.

## The idea

The homepage already has a signature: a Revision-Orange thread that laces the page together
("Follow the thread", "Pull the thread"). The film is that thread, run as one continuous line:

| Act | Frames | What happens |
|---|---|---|
| Opening | 0–195 | The thread laces across the drafting sheet, the name is drawn the way the site draws it (orange outline → ink fill), then the thread pulls taut into a straight line. |
| 01 Torque wrench | 195–735 | That line becomes the drive axis. The wrench is plotted along it as a hidden-line CAD drawing, then one front sweeps the sheet — paper turns to studio, linework turns to metal. Two-speed shift, then the real rear-extraction explosion with the gear train turning. |
| 02 Quiet machine | 711–1251 | A vertical thread cut wipes into the enclosure; the site's own section study plays: incision, supply air, two feeds, noise control. |
| 03 Armament | 1227–1707 | Back on paper: the thread becomes a scan line across x-ray renders, then dark plates and labelled reference cards. |
| Close | 1707–2082 | The thread laces the three projects, the name is drawn again, and the thread pulls taut under the address. The last frame is the first frame, so the hero can loop. |

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
