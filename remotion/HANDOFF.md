# Showreel v3 — handoff for the next editing session

Written 2026-11-08 by the session that built the film. Read this, then `remotion/README.md`,
then the JG-041 entry at the top of `TODO.md`.

## Where things stand

- **The film:** "The Thread", 1920×1080, 30 fps, 2082 frames (69.4 s), H.264, silent, 18 MB.
  Output `public/video/showreel-v3.mp4`, poster `public/video/showreel-v3-poster.jpg`.
- **The code:** `remotion/` on branch `torque-wrench/rebuild`. It was built on `showreel-v3`
  and merged in at `6ec4fe06`. Work on `torque-wrench/rebuild`, not on `showreel-v3`
  (TODO.md still names `showreel-v3` as the baseline, but it is now the same code).
- **Owner verdict (2026-11-05):** not accepted as-is. The rework is **JG-041** in `TODO.md`.
  It has five directives, and all are required:
  1. Swap "the thread" motif for "the line", the drafting/CAD element that draws things on the page.
  2. Add the StudioMark logo. Reserve its slot, but don't ship a placeholder wordmark without owner approval.
  3. Show the real armament 3D models. This needs a local prep lane on the owner's machine,
     and only finished renders get committed.
  4. Add a real identity act about Mark.
  5. Add a new act about the StudioMark rendering tool (headless Blender, Cycles automation).
- **Keep these:** the site-code-imported 3D, the rules test gate, the poster frame, the loop
  (last frame = first frame), and silence until the owner supplies music.
- **Deploy status:** `showreel-v3.mp4` is not on the build exclusion list
  (`build/excludePublicAssets.ts`), so it ships in `dist/` as a static file. No page links it.
  Embedding it on the site is the owner's call. Video-only scope means no deploys and no edits
  to site pages or choreography.

## Ready-to-paste prompt for the receiving session

```text
You are continuing the studiomark.dev showreel (Remotion) in mhintz1980/jgun-portfolio.
Workspace: the jgun-portfolio checkout (owner machine: C:\Users\Markimus\.buzz\REPOS\jgun-portfolio,
cloud: /home/user/jgun-portfolio), branch torque-wrench/rebuild. Read, in order:
remotion/HANDOFF.md (absolute: <checkout>/remotion/HANDOFF.md), AGENTS.md, the JG-041
"Showreel v3 rework" entry at the top of TODO.md, then remotion/README.md.

Next action: open a plan at project/work/plans/JG-041-showreel-v3.md and an evidence folder at
project/work/evidence/JG-041-showreel-v3/. Then start with the lowest-risk directive: rework the
"thread" motif into "the line" and edit copy in remotion/src/copy.ts. Add new acts only as the
owner supplies assets (logo, armament renders, rendering-tool captures, identity material).

Boundaries: video only. No deploys and no edits to site pages, site choreography or ../src files
the film imports. Hard rules are enforced by remotion/src/rules.test.ts in the root `npm test`.
Do not weaken them; extend them for every new asset lane. No AI-generated footage of Mark's
products. Never use m249-transformed.glb or m249_FN.glb. No dimensions, GD&T or part numbers on
screen. Say "AR-15-pattern", with no third-party brands. Every representative image goes through
ShowcaseCard and keeps its label. The StudioMark logo has no approved asset yet, so don't ship a
placeholder wordmark. Iterate with stills; a full render takes about 2 hours on 4 CPU cores
without a GPU. Keep root gates green: npm run typecheck, npm test, npm run build
(plus `cd remotion && npm run typecheck`).
```

## Toolchain

| Tool | Version | Notes |
|---|---|---|
| Remotion (`remotion`, `@remotion/cli`, `@remotion/three`, `@remotion/fonts`) | 4.0.540 | All four must match exactly. |
| React / react-dom | 19.2.8 | Pinned to the film's copy through webpack aliases. |
| three | 0.185.1 | Same version family as the site. |
| @react-three/fiber | 9.7.0 | |
| TypeScript | 5.9.3 | `remotion/tsconfig.json` has its own `paths`. |
| ffmpeg | bundled with Remotion | Used by `scripts/review-stills.mjs`. |

- `remotion/` has its **own** `package.json` and `node_modules`. Run `npm ci` inside `remotion/`.
- **Never run `npx remotion upgrade`, because it crashes.** To change versions, use
  `npm install remotion@X @remotion/cli@X @remotion/three@X @remotion/fonts@X`.
- No AI image or video generation was used. Every pixel is the site's GLBs, the site's
  armament-showcase renders, or vector type and linework drawn in React.

## Commands (run inside `remotion/`)

```bash
npm ci
npm run typecheck                                    # always check before bundling (see lessons)

# Fast loop: bundle once, then render single frames from the bundle
npx remotion bundle --out-dir=out/bundle
npx remotion still out/bundle Showreel out/f400.png --frame=400
npx remotion still out/bundle WrenchAct out/w120.png --frame=120   # one act, local frame numbers

npx remotion studio                                  # interactive preview (needs a desktop + GPU)
npm run render                                       # full film → ../public/video/showreel-v3.mp4
npm run stills                                       # 18 review stills + contact sheet → review/
```

- Re-bundle after every code change. `still` against an old bundle renders old code.
- For a partial render, use `npx remotion render Showreel out/part.mp4 --frames=700-760`.
- `out/` and `*.mp4` are git-ignored inside `remotion/`. The deliverable MP4 goes in
  `../public/video/`.
- **Windows:** `review-stills.mjs` falls back to a Linux ffmpeg path. On Windows, install ffmpeg
  on PATH or swap in `npx remotion ffmpeg`.

## File map

```
remotion/
  remotion.config.ts      public dir = ../public, swangle GL, 240 s delayRender timeout, webpack aliases
  package.json            scripts: typecheck, still, studio, render, stills
  README.md               concept, act table, owner rules, headless notes
  review/                 18 stills + contact-sheet.jpg from the committed MP4
  scripts/review-stills.mjs   still times (seconds) and names, so update this when the timeline moves
  src/
    index.ts, Root.tsx    registers "Showreel" + each act under the "Acts" folder
    Showreel.tsx          MASTER TIMELINE: act order, start frames T, WIPE overlap, ThreadWipe
    copy.ts               EVERY on-screen word (edit copy here only)
    rules.test.ts         owner hard rules (runs in the root `npm test`)
    armament.ts           manifest lookup + FILM_ARMAMENT allow-list
    theme.ts              colors C, fonts F, loadFonts() (fonts read from public/fonts/home/)
    ease.ts               ramp(f, a, b, easing), mix, EASE: the animation vocabulary
    scenes/
      Opening.tsx   195 f   laced thread → DrawnName → taut axis line
      WrenchAct.tsx 540 f   hidden-line plot → paper/studio split → shift → explode/gears
      MachineAct.tsx 540 f  enclosure section study driven by the site's `u` (SEGMENTS table)
      ArmamentAct.tsx 480 f x-ray scan line → plates → ShowcaseCards
      Close.tsx     375 f   thread laces 3 eyelets → name → fades to blank paper (loop)
    three/
      Wrench.tsx          imports ../../../src/scene/rig (buildWrenchRig, applyWrenchMechanics)
      QuietMachine.tsx    imports ../../../src/scene/rl300 (prepareModel, SectionCaps, AirRibbons, LowerIntake)
      useGltf.ts          loadGlb + usePrepared (delayRender held until first real frame)
      ReadyGate.tsx       releases the render once the scene has actually drawn
      PostFX.tsx          RenderPass → UnrealBloom → SMAA → OutputPass (replaces MSAA)
      CameraRig.tsx       camera with roll and lens shift (shiftX via setViewOffset)
      track.ts            camera keyframe track(), preToneMapped(), mixHex()
      project.ts          3D → screen px, to pin HTML labels to model points
      SplitBackground.tsx paper/navy split at a moving screen-space front
      studioEnv.ts        the site's softbox studio env, ported
    ui/
      Thread.tsx          the thread primitive (catmull path, eyelets, tip), the main thing to replace with "the line"
      DrawnName.tsx       stroke-draw-then-fill name
      ShowcaseCard.tsx    THE ONLY way to show a "representative" image; always prints the label
      Backdrop.tsx        paper, grid, grain, vignette
      Type.tsx            Eyebrow, Rise, RuleTag
```

Site files the film imports (read-only, because the scope rule forbids editing site code):
`src/scene/rig/{nodeRoles,wrenchMechanics,materials,lcdCluster}.ts`, `src/data/caseStudies.ts`
(`EXPLODE_OFFSETS`, `ROTATION_TURNS`), `src/scene/rl300/*`. Copy rules come from
`src/home/content.test.ts`. Color tokens come from `src/home/layout.css`. Assets: `public/models/Default.glb`,
`public/models/msp-enclosure.glb`, `public/models/rl300-extra-parts.glb`,
`public/home/armament-showcase/` (+ `manifest.json`), `public/fonts/home/*.woff2`.

Related lane: the StudioMark logo work lives in `src/scene/studiomark-logo/` and
`project/work/evidence/studiomark-logo/` (bumper renders `public/video/studiomark-bumper-*.mp4`).
These are candidates for the logo slot, but **ask the owner which asset is approved** before using any.

## How to add a chapter

1. **Create `src/scenes/NewAct.tsx`.** Export `NEW_FRAMES` and a component that reads
   `useCurrentFrame()` (local frames, starting at 0). Drive everything with `ramp`/`mix` from
   `ease.ts`. Don't use CSS transitions or timers, because Remotion renders frames out of order
   across tabs.
2. **Put its words in `copy.ts`** as a new exported const. The rules test scans every string
   exported there automatically.
3. **Add it to the timeline in `Showreel.tsx`.** Extend `T` (each start = previous start +
   previous length, minus `WIPE` if the two acts overlap during a wipe), then add a
   `<Sequence from={T.x} durationInFrames={NEW_FRAMES} premountFor={30–60}>`. Wrap it in
   `<ThreadWipe>` if it enters by the vertical cut. Use `premountFor={60}` for 3D acts so
   GLBs load before they're needed.
4. **Register it in `Root.tsx`** under `<Folder name="Acts">` so it can be stilled on its own.
5. **Update `scripts/review-stills.mjs`** times and the act table in `README.md`.
6. **For 3D:** copy the pattern in `WrenchAct.tsx` / `Wrench.tsx`: `ThreeCanvas` →
   `usePrepared([...glbs], prepare, label)` → `ReadyGate` → `CameraRig` + `PostFX`. Set every
   per-frame value during render or in `useLayoutEffect`, never in `useEffect` (see lessons).
7. **For video clips** (rendering-tool captures, logo bumper): use Remotion's `<OffthreadVideo>`
   with a file in `public/`. Keep them silent or muted until music is decided.
8. **New asset lanes need a rule.** Add an allow-list (like `FILM_ARMAMENT`) and a test in
   `rules.test.ts` before the asset goes on screen. JG-041 requires this for armament renders.
9. Re-bundle, still the new act's key frames, then do one full render at the end.

To **reorder or retime** acts, change `T` and the `*_FRAMES` constants. Inside an act, timings
are hard-coded local frame numbers (for example WrenchAct: plot f4–80, split front f72–150,
shift f178–208, explode f255–350, return f420–492). Lengthening an act means stretching those
numbers, not just the constant.

## How to change copy

- Edit `src/copy.ts` only. No scene file hard-codes a visible word. Exception: `ShowcaseCard`
  reads `ARMAMENT.representativeLabel`, which must still start with "Representative model".
- Run `npx vitest run remotion/src/rules.test.ts` from the repo root. It fails on banned words
  (RL300, JGun, M249, MSP, Myers, Seth, CATIA/Creo/Fusion 360, "PE", 22 %, 47, "15 years",
  hours claims, 7-axis, 0005, GD&T, part numbers like A000606, dimensions like "12 mm", ±,
  third-party firearm brands). `ARMAMENT.line` must contain "AR-15-pattern".
- Watch the layout after copy changes. Titles are absolutely positioned at fixed sizes, and a
  longer line can collide with the 3D. Still the frames where that copy is on screen.
- "The thread" wording to replace for the motif swap: `CLOSE.cta` ("Pull the thread"), the
  `Sequence` names in `Showreel.tsx`, `ThreadWipe`, and README text.

## Technical lessons (the expensive ones)

**Rendering headless**
- WebGL only works with `swangle` (ANGLE → SwiftShader). `angle` and `swiftshader` both fail with
  "Error creating WebGL context". It's set in `remotion.config.ts`. On the owner's GPU machine,
  `--gl=angle` may be much faster, but that is untested.
- Cost per frame on 4 CPUs: paper/2D about 0.3 s, wrench about 2 s, enclosure about 6 s. The full
  film took **106 min** at `--concurrency=3`, and more concurrency gains only about 25 %. Budget
  2 h per full render, and still single frames while iterating.
- MSAA cost about 3.7 s/frame against about 0.9 s without it. So the canvas runs with
  `antialias: false` and `PostFX` adds SMAA. Don't turn MSAA back on.
- Run `npm run typecheck` before `remotion bundle`, and don't chain them with `&&`, which leaves
  the old bundle in place when tsc fails. A failing tsc meant several "my change did nothing"
  scares.
- `console.log` from the page isn't surfaced in `still`. Debug by drawing values on screen or by
  computing them in node.

**Frame-accurate 3D**
- `ThreeCanvas` only advances R3F when the frame number changes. After an async GLB load, the
  first frame would be empty. `usePrepared` holds a `delayRender` until `ReadyGate` sees a drawn
  frame (advance + rAF, then `continueRender`). Use both for any new 3D act.
- Mutate per-frame state (pose, uniforms, camera) **during render or in `useLayoutEffect`**.
  `useEffect` runs after Remotion's frame advance, so it lands one frame late, which shows up as
  jitter in the render. Site components that use `useFrame` are fine, because the advance runs them.
- `remotion.config.ts` aliases plus `tsconfig.json` `paths` (including `"react/*"`) force one copy
  of three/React/R3F across the film and `../src`. Without them, the site's JSX has no intrinsic
  element types and three objects fail `instanceof` checks.
- Prepared models are cached per browser tab, so each render tab loads each GLB once.

**Look**
- **Tone mapping vs HTML colors:** the wrench act uses `NeutralToneMapping`, and
  `preToneMapped(hex)` inverts it so the WebGL background matches the HTML paper/navy exactly.
  The machine act uses ACES at exposure 0.85, like the site. If a 3D background and an HTML
  layer must meet without a seam, use `preToneMapped`.
- **Bloom hazes paper.** Keep bloom at 0 while paper is on screen. It ramps in only after the
  split front clears (WrenchAct f150–175). Machine act bloom is 0.14.
- **Paper → studio transition:** a uniform color lerp went muddy grey. The answer was a spatial
  wipe: `SplitBackground` shader plus CSS `mask-image` on the grid and title (ink on paper side,
  cream on navy side), all keyed to one screen-space `front` x.
- **Hidden-line CAD look:** `EdgesGeometry(28°)` line segments, depth-only twin meshes with
  `polygonOffset` to occlude, plus a faint `GreaterDepth` pass for hidden lines. Plain edges were
  an unreadable x-ray. Hide the lines during the explode, because internal edges show through.
  The plotter and fill sweeps are clipping planes (`plotX`, `fillX` in `Wrench.tsx`).
- **HTML labels on 3D points:** `project.ts` replicates the camera, and `Wrench` reports anchors
  via `onAnchors`. Labels flip to the left side when x > 1500 px, or they clip at the frame edge.
- **Machine act:** the site's section study is driven by its own `u` (0..1). The film maps frames
  to `u` in the `SEGMENTS` table in `MachineAct.tsx` and skips the site's "second breath" beat
  (u .41–.61) with a hard cut at f322. The lower intake is a design concept and is captioned
  `MACHINE.concept`, so keep that caption whenever it's visible.
- **DrawnName:** the dasharray is `dash dash×4` with dash 2400. A shorter gap shows stray dashes
  on long glyph paths.
- **Representative cards:** the label is Space Grotesk 19 px, `nowrap`, and the cards are 572 px
  wide. Smaller cards made the label wrap and shrink below legibility.
- **Armament images:** `FILM_ARMAMENT` = ar-20, ar-18, ar-17, ar-23 (mine) and ar-05, ar-06,
  ar-07 (representative). Avoid ar-09 to ar-15 and ar-24 to ar-31 (markings or non-AR parts).
  ar-22 has an "Image Capture" UI artifact.
- **Loop:** Close fades to blank paper (f340–372), which is Opening frame 0. Keep that if the
  hero will loop.

## Checks before handing back

```bash
cd remotion && npm run typecheck && cd ..
npm run typecheck && npm test && npm run build     # root gates; rules.test.ts runs in npm test
```

Then commit the MP4, `review/` and the poster if the picture changed, and record before/after
stills for the owner. AGENTS.md asks for staging by explicit path in the shared tree, so never
use `git add -A`, and never commit `.scratch/`.
