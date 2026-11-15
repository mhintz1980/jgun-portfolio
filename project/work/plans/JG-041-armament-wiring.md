# PLAN: JG-041 armament spin clip, wiring into "The Line" (2026-11-14)

Status: plan only, nothing built. Author: Opus 5.5 (planning seat). Inputs: `docs/HANDOFF-armament-lane-2026-11-13.md`, `project/work/plans/JG-041-armament-act.md` (v5), the issues log, `remotion/clips/README.md` and `manifest.json` (main); `remotion/{README,HANDOFF}.md`, `project/work/plans/JG-041-showreel-v3.md`, `remotion/src/{scenes/ArmamentAct.tsx,theme.ts,rules.test.ts,copy.ts,armament.ts,Showreel.tsx,Root.tsx}`, `remotion/{package.json,remotion.config.ts,scripts/review-stills.mjs}` and `build/excludePublicAssets.ts` on `origin/torque-wrench/rebuild` (`10bceb68`). Line numbers below are from the film branch.

**Money: $0 for every step, except an optional 1 deg top-up render (about $0.30, cap $0.50), which only runs if test T2 shows it would help.** A = needs Mark's go.

Decided, not reopened here: "The Line"; paper look; shade = Cycles v2 multiplied onto paper `#f4f1ea` at about 50% (35-60%), ramping from 0 as the line resolves; line = Workbench Freestyle, ink on white, multiplied; 180 angles at 2 deg, 1920x1080; full spin in 1-2 s; no frames committed before the film review; Mark reviews, then Astra rules; `public/video/showreel-v3.mp4` and the homepage stay untouched without Mark's explicit go; walls as in plan v5.

## 0. Prerequisite: the film branch has no clip lane
- `origin/torque-wrench/rebuild` has no `remotion/clips/` and no `remotion/clips/**/local-paths.json` ignore line (main `.gitignore:53`). The branches have diverged 18/17 commits. Main carries the Biome full-format pass (`0a2a0888`) and duplicate home commits under other SHAs, so a full merge will conflict across `remotion/src` and `src/home`. Don't merge.
- Route: make a sub-branch `jg-041/armament-spin` from `origin/torque-wrench/rebuild`, in its own worktree (a hook blocks writes into other worktrees). Then do a path-level bring-over: `git checkout origin/main -- remotion/clips` and copy main's `.gitignore` line 53. Commit it as "chore: bring armament clip lane from main". **A** (it changes the film branch's tree).
- All wiring lives on that sub-branch until the frames are approved. Then it merges into `torque-wrench/rebuild`. The film branch stays renderable without the frames the whole time.

## 1. ArmamentAct.tsx: plot -> hold -> resolve -> fast spin -> settle
Today the act runs 540 frames (`ARMAMENT_PRE` 60 + 480, L13-14), from `T.d` = 1317 to 1857, with no wipe overlap into the Close (`Showreel.tsx` L19). Shots: a pre-roll plot of the x-ray outline (f16-70), the light table and scan (g 0-250), dark plates (g 232-338), and representative cards (g 330-470). The title runs from f22 to g322.

**Placement (recommended):** a new first shot, "the carbine", before the existing pre-roll. It establishes the AR-15-pattern platform on paper, then the act zooms into Mark's own parts (the x-ray). The existing shots are kept unchanged and shifted. This puts two pen-plot beats back to back: the carbine plot, then the slice-2 x-ray outline that the owner approved. Whether the x-ray outline stays is Mark's call (**A**). The plan keeps it.

Shot timeline, act-local frame `f`, 30 fps (`WIPE` = 24, so nothing starts before f16):

| Beat | Frames | What happens |
|---|---|---|
| Wipe in | 0-24 | Existing `LineWipe`. The carbine layer is empty paper. |
| Plot | 16-70 | Line frame f0000 (muzzle right) is revealed left to right: a `clipPath: inset(0 X% 0 0)` on the line layer, with `PenHead` and a 1 px ink rule following it, the same idiom as L87-99. The sweep spans the rifle's bounding box at f0000 (measure it once and record it in `clip.json`), not the full frame. |
| Hold | 70-100 | Line only. |
| Resolve | 84-114 | Shade opacity ramps from 0 to `SHADE` (0.5, set by eye from 0.35 to 0.6). The line stays at 1.0. **This is where the line resolves to shade.** |
| Spin + settle | 114-171 | **One curve with continuous velocity**: angle = 360 x `backOut`-style easing over f114-171. It eases in, passes 360 at about f159 while still moving, overshoots about 4 deg, and returns to 360 (= f0000) by f171. Don't chain an `inOut` spin and a separate overshoot: velocity hits zero at 360 and the restart reads as a hiccup. The fast part is about 45 frames = 1.5 s, an average of 4 source steps per output frame, with a higher peak. Frames are blended (section 3) and turn crisp once the speed is below 1 step per frame. |
| Settled hold | 171-185 | Profile, fully resolved. |
| Hand-off | 176-200 | The carbine layer fades and drifts out while the existing light-table plate fades in (its `plateIn` now starts at f188). |

**Constants:** `ARMAMENT_CARBINE = 180`. The act grows from 540 to 720 frames. The film grows from 2373 to 2553 frames (79.1 s to 85.1 s, **+6 s**).

A lean variant at **+4 s** uses `ARMAMENT_CARBINE = 120`: plot 16-52, hold 52-64, resolve 56-80, spin 80-125, settle 125-135, hand-off 116-140. Which length to use is Mark's call (**A**). The Fable review proposed +4 s.

**Layout:** the clip is drawn at a scale of 0.8 (1536x864) at left 192, top 196, under the title block (L152-162, ends about y 260). The rifle is about 1260 px wide at profile and centred. The representative label sits bottom-left of the layer. Confirm both with a still.

**Edits to `remotion/src/scenes/ArmamentAct.tsx`:**
- L13-14: add `export const ARMAMENT_CARBINE = 180` and set `ARMAMENT_FRAMES = 480 + ARMAMENT_PRE + ARMAMENT_CARBINE`.
- L45-47: add `const h = f - ARMAMENT_CARBINE` and set `const g = h - ARMAMENT_PRE`. The comment's "original act clock" now runs on `h`/`g`.
- L52, L55, L57: `plateIn`, `plot` and `lightOn` switch from `f` to `h`. Lines 48 and 156-159 (title `Rise` ramps) stay on `f`, so the title enters over the carbine. `titleOut` stays on `g` (shifted). It holds through the x-ray shot as today.
- After `<EdgeFilter />` (L79), insert `<CarbineShot f={f} />`. It is a local component in the same file that only computes the timeline above. Pixels come from `<ClipSpin>` (below).
- Nothing else in L81-163 changes. `Showreel.tsx` `T` (L14-22) shifts automatically through `ARMAMENT_FRAMES`. Rename the Sequence at L40 to "03 Armament — the carbine, light table".

**New files:**
- `remotion/src/clips.ts`: **data only**, with no webpack calls, because the root vitest imports it from `rules.test.ts` and `import.meta.webpackContext` doesn't exist under vitest.
  - `FILM_CLIPS = { carbine: { id: 'ar15-pattern-carbine-a', model: 'ar15-pattern-carbine-a', frames: 180, degPerFrame: 2 } }`.
  - Imports `../clips/armament/manifest.json` (out-of-`src` JSON imports already work, see `armament.ts:1`).
- `remotion/src/clipFrames.ts`: the **loader**, imported only by `ui/ClipSpin.tsx`. `clipFrames(id, pass)` returns the sorted URLs from the webpack context (section 2).
- `remotion/src/ui/ClipSpin.tsx`: the **only** component that draws clip frames, mirroring `ShowcaseCard`'s structural rule. It takes `{ clip, angle, angularVelocity, shadeOpacity, lineOpacity, reveal }` and renders two isolated multiply groups (line, shade) plus the label. If `manifest.models[clip.model].label_required`, it always renders `ARMAMENT.representativeLabel` (Space Grotesk 19 px, `nowrap`, the same style as `ShowcaseCard`). If the frames are missing, it calls `cancelRender(new Error('armament clip frames missing: copy from scratch or the armament-frames Modal Volume'))`.
- `remotion/src/Root.tsx`: no change needed. `Acts/ArmamentAct` already exists for cheap act-only stills and renders.

**Copy:** the existing `representativeLabel` reads "Representative model — similar to the part I designed". That fits a part card, not a whole carbine. Add `ARMAMENT.representativeAssembly`, starting "Representative model" (for example "Representative model — AR-15-pattern carbine"). The wording is Mark's (**A**). No angle or "360°" text on screen: the `dimension` regex at `rules.test.ts:57` would fail it, and it is a wall anyway.

## 2. Frame delivery: recommended route, webpack import from the clip folder
**Route:** the film imports the frames through webpack from `remotion/clips/armament/<clip-id>/{line,shade}/f####.webp`. That is the folder plan v5 already chose as the final committed home. Vite never sees it, so nothing ships with the site, and `build/excludePublicAssets.ts` and `scripts/public-asset-exclusions.node-test.mjs` stay untouched.
- In `clipFrames.ts`: `const ctx = import.meta.webpackContext('../clips/armament', { recursive: true, regExp: /^\.\/[a-z0-9-]+\/(line|shade)\/f\d{4}\.webp$/ })`. This is webpack 5's ESM form of `require.context`. Keep only the `./`-prefixed keys, then sort.
  - Point the context at `clips/armament`, which always exists because `manifest.json` lives there, not at the clip folder. With no frames it should yield an empty list and no build error (verify this).
  - Typing: `remotion/tsconfig.json` has no `types` filter, so `@types/node` is visible, and `declare const require` would collide with it. Instead, add `src/webpack-env.d.ts` with an `interface ImportMeta { webpackContext(dir: string, opts: { recursive?: boolean; regExp?: RegExp }): { keys(): string[]; (k: string): string } }` augmentation. Root `tsc` doesn't include `remotion/`.
- **Verify first** (5 min, docs only): Remotion 4.0.540's webpack config has an asset rule covering `.webp` (its docs list webp under importable assets). If it doesn't, add `{ test: /\.webp$/, type: 'asset/resource' }` in `overrideWebpackConfig` (`remotion.config.ts` L18-33).
- **Before approval:**
  - Fill the folder locally from scratch: `C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v2-cycles-webp/{line,shade}`, or `modal volume get armament-frames /ar15-pattern-carbine-a-v2-cycles-webp` with `MSYS_NO_PATHCONV=1`.
  - Two lines in `remotion/.gitignore` keep them out of git: `clips/armament/*/line/` and `clips/armament/*/shade/`, with a comment that the frames commit deletes them. Every worktree and `git add -A` is then safe.
  - Convert to the commit format **before** review (`cwebp -near_lossless 60`, measure the size first; check that `cwebp` exists, otherwise keep lossless). That way the pixels Mark reviews are the pixels that get committed. Keep the lossless originals in scratch.
- **After approval:** one commit deletes the two ignore lines and adds the frames, `clip.json` and the `manifest.clips` entry.
- **Rejected routes:**
  - (a) Render-time public dir. Remotion has a single `setPublicDir` (`remotion.config.ts:5`), so it would need a copy or junction of the whole ~100 MB `public/` plus the frames.
  - (b) `public/clips/...`, gitignored, with a prefix feature in `excludePublicAssets`. The frames would sit inside the shipped tree, Vite would copy about 73 MB into `dist/` and then delete it, and the plugin plus its node test would change. The frames would also need moving to `remotion/clips/` at commit time, against plan v5.
  - (c) `staticFile` with a symlink under `public/`: the same exposure as (b), and symlinks are fragile on Windows.

## 3. Blending, and the cheap test that settles 2 deg vs 1 deg
**What Remotion offers:** `@remotion/motion-blur` (`<CameraMotionBlur shutterAngle samples>`, `<Trail>`). It re-renders the whole subtree at sub-frame times. It is **not** in `remotion/package.json`, and it averages whatever the subtree draws, including alpha.

**Recommendation:** a manual average inside `ClipSpin`, with no new dependency.
- **Taps.** For an output frame, take N sub-samples across a shutter `s` (in frames). Map each sample to a source index `round(angle/2) mod 180` and merge duplicates into weights. N is velocity-adaptive: `taps = clamp(round(|dIndex/dFrame| x s), 1, 8)`, so the settle and the hold stay crisp.
- **Stacking.** Stack the unique frames as opaque tiles (a white div holding each `<Img>`; shade frames therefore sit over white, which multiply treats as identity). Tile j gets opacity `w_j / (w_1+...+w_j)`, which gives an exact weighted average. Put the stack in an `isolation: isolate` group with a white background, and set the group to `mix-blend-mode: multiply`. Multiply is linear, so averaging first and then multiplying is correct.
- **Opacity.** The shade group carries `opacity: shadeOpacity`, which gives paper lerped toward paper x shade.
- **Shutter per pass.** Use a separate shutter for each pass: line `sLine` (start 0.25) and shade `sShade` (start 0.75). The shade, a broad gradient, carries the smear; the line stays legible.
- **Cost.** At most 8 decodes per pass per output frame, only during the 45 spin frames. 1920x1080 WebP decodes take about 10-20 ms against the paper act's ~0.3 s/frame. The act-only render stays at about 5-10 min.

**Why 1 deg may not help:** the ghosting comes from the gap between consecutive copies of a 1.3-2.6 px ink line. At the stock and handguard ends (radius about 600-800 px at full size), a 2 deg step moves the ink about 20-30 px on screen near the end-on angles (estimate). At 1 deg that is still about 10-15 px, which is still separate copies. So the 5-frame proxy result would not change much at double the frames. **This is the number to measure before any spend.**

**T2, the cheap test: $0, local CPU while idle, about 30-40 min of agent time, before any Remotion work.**
1. **Displacement measurement.** Python with scipy, numpy and Pillow, run with `py -I` from a script outside the frames folder. Check first that `py -c "import scipy"` works. For ffmpeg use `npx remotion ffmpeg` or a system ffmpeg, because `review-stills.mjs` falls back to a Linux path on Windows.
   - For all 180 consecutive pairs of line frames: ink mask = luminance < 128; take the EDT of the non-ink pixels of frame k, sampled at the ink pixels of frame k+1.
   - Report p50/p90/p99 shift per angle, overall and for two regions: the stock (left 25% of the f0000 rifle bbox, tracked approximately by angle) and the handguard (right 30%). Output: one CSV and one plot PNG.
2. **Decision rule** (w = 2.6 px contour, d = worst p90 shift at 2 deg):
   - d/2 <= 2w (about 5 px): a 1 deg top-up would turn the ghosts into a smear, so offer T3.
   - d/2 > 3w: skip the re-render; it buys nothing.
   - In between: show both and let Mark decide.
3. **Blend strip at real playback speed.** Use PIL plus Remotion's bundled ffmpeg. Simulate the 45-frame spin with the exact tap and weight maths above. Multiply line and shade (50%) onto `#f4f1ea`. Variants:
   - (A) `sLine` 0.25 / `sShade` 0.75
   - (B) `sLine` 0.5 / `sShade` 1.0
   - (C) as A, plus a line opacity dip to 0.4 at peak speed, letting the shade carry the motion
   - (D) as A, plus a horizontal-only blur on the averaged line (`feGaussianBlur stdDeviation="σx 0"`, σx proportional to the velocity; the spin is about a vertical axis, so screen motion is mostly horizontal)
   - (E) no blend (strobe)
   
   Output: a 2x3 PNG contact sheet of the peak-velocity frame, plus a 1.5 s MP4 per variant (loop it 3x). Send the PNG and the MP4s to Mark, not a description.
4. **Outcome.** Mark picks a variant (**A**), and the picked parameters go into `ClipSpin`. In Remotion, (D) is an SVG filter on the line group, like `EdgeFilter` (L23-42).

**T3, optional 1 deg top-up (A, only if T2 says it helps): about $0.30-0.45, cap $0.50, about 30 min wall.** Freestyle probably dominated the $0.48 run, so the 180 odd line frames alone may cost about $0.40.
- Render only the 180 odd angles (`--angles 1:360:2`), as two runs per the v5 recipe: line = Workbench, then shade = `--pass shade --engine cycles --samples 24`. Never `--pass both --engine cycles`.
- Cost is pro-rated from measured runs: 180 Workbench line frames is about half of $0.48, and 180 Cycles shade frames was $0.049.
- Dry run first, and set `--max-usd` at or above the quoted ceiling.
- It doubles the committed bytes (about +73 MB lossless). `degPerFrame` becomes 1 and `frames` 360.

## 4. Rules-test additions (`remotion/src/rules.test.ts`)
- **BANNED** (L33-61):
  - Add `['designation Mk 18', /mk\s*-?18/i]`. It runs over COPY.
  - Extend the brand alternation at L60 with `mk\s*-?18`.
- **New `describe('armament clips (manifest-driven)')` block.** Read `../clips/armament/manifest.json` and `FILM_CLIPS` from `./clips`.
  1. Every model has `provenance` in {mine, representative}, and `label_required === (provenance === 'representative')`.
  2. Every `FILM_CLIPS` entry names an existing model. If that model has `label_required`, the source of `ui/ClipSpin.tsx` contains `ARMAMENT.representativeAssembly` (or the chosen label key) and a `label_required` branch, the same pattern as L82-94.
  3. No SRC file other than `clips.ts`, `clipFrames.ts` and `ui/ClipSpin.tsx` matches `/clips\/armament/`, and only `ui/ClipSpin.tsx` imports `clipFrames`. Frames can therefore only reach the screen through the labelled component. The test imports `./clips` (data) only, never `./clipFrames`.
  4. The raw text of `manifest.json` and of every `clip.json`, plus every **tracked or present** filename under `remotion/clips/`:
     - must not match `/mk\s*-?18/i`;
     - must not match the brand regex;
     - must not match an absolute path (`/[A-Za-z]:[\\/]|\/Users\//`).
     
     Explicitly skip `local-paths.json`. It holds the real source filename and exists only on Mark's machine, so including it would make the test fail locally and pass in CI. Do **not** run the full BANNED list over the manifest: its notes contain "M249" by design.
  5. SRC must not match `/mk\s*-?18/i`. The existing `/m249/i` SRC scan (L118-120) already covers M249, so `clips.ts` must never spell out the manifest's M249 key.
  6. If `manifest.clips[id]` exists (only after the frames commit): `clip.json` exists, its `frames` equals `FILM_CLIPS` and the files on disk (`f0000..f0179.webp` per pass), and names match `/^f\d{4}\.webp$/`. Before approval, `clips` is `{}`, so this branch is skipped. The test must pass in CI with no frames present.
- **`clip.json` (written in the frames commit).** It contains:
  - id, model, provenance, label_required;
  - `frames` and `degPerFrame`, the start pose (muzzle right at index 0) and the camera rise;
  - passes, each with dir and composite: line = multiply, white background; shade = multiply over white, opacity 0.5, range 0.35-0.6;
  - the recommended blend shutters, loop true, the f0000 bbox, the engines (Workbench line, Cycles v2 shade) and sha256s.
  
  This follows the clip contract, rule 4.

## 5. Review materials and gate order
- **Never** run `npm run render` before Mark accepts the final cut. It writes straight to `../public/video/showreel-v3.mp4` (`remotion/package.json:10`).
- **Stills** from a fresh bundle (run `npm run typecheck` first and don't chain it with `&&`, per HANDOFF lessons):
  - Command: `npx remotion still out/bundle ArmamentAct out/arm-<beat>.png --frame=<n>`.
  - Frames: mid-plot (f43), hold (f90), resolved (f114), **peak-velocity spin (f136)**, settle overshoot (f163), settled (f180), hand-off (f190), x-ray scan still working (f~330).
  - Put a contact sheet in `project/work/evidence/JG-041-armament-act/film-stills-<date>/`. Track the README and the contact sheet only; the PNGs stay local, following the showreel evidence convention.
- **Review MP4, separately named:**
  - `npx remotion render ArmamentAct out/armament-review-spin-v1.mp4 --codec=h264 --crf=18`. `remotion/out/` and `*.mp4` are gitignored. It takes about 5-10 min for 720 frames.
  - Optional context: `npx remotion render Showreel out/showreel-v3-review-armament-part.mp4 --frames=1250-2100`, about 15 min.
- **Gate order:**
  1. Code gates: `cd remotion && npm run typecheck`, then at the root `npm run typecheck`, `npm test`, `npm run build`, and `node --test scripts/public-asset-exclusions.node-test.mjs` (it should pass unchanged).
  2. **Mark reviews** the stills and the act MP4 (**A**).
  3. **Astra rules** on the effect: the spin blend, the shade ramp and the opacity (`gpt-6-astra` on the codex surface).
  4. **Frames commit (A):** a single commit on the sub-branch, as in section 2.
  5. Merge the sub-branch into `torque-wrench/rebuild` (**A**).
  6. Full-film review MP4 `out/showreel-v3-review-armament.mp4` (about 2 h on 4 cores), and Mark accepts it (**A**).
  7. Only then: `npm run render` to replace `public/video/showreel-v3.mp4`, followed by `npm run stills` and the poster. Any homepage change needs a separate explicit go (**A**).

## 6. Ordered tasks
Token figures are for the executing agent. Tasks run in order unless noted. T2 can run in parallel with T1, since it needs only the scratch frames and local Python. T5 needs T1, T9 needs T4 and T5, and T12 needs T10 and T11.

| # | Task | A | Tokens | Time | Money |
|---|---|---|---|---|---|
| T1 | Sub-branch and worktree, bring over `remotion/clips` and the ignore line (section 0), add the frame-ignore lines | A | 15k | 10 min | $0 |
| T2 | Displacement measurement, blend strip (5 variants), send the PNG and MP4s to Mark | A (pick variant) | 40k | 30-40 min | $0 |
| T3 | Only if T2 says so: 1 deg odd-angle top-up on Modal (dry run, then execute) | A | 25k | 30 min wall | ~$0.30-0.45 (cap $0.50) |
| T4 | Check for `cwebp`, measure near-lossless size, fill the clip folder (gitignored) | | 10k | 10 min | $0 |
| T5 | Verify the webp asset rule and an empty `webpackContext`; write `clips.ts`, `clipFrames.ts`, `webpack-env.d.ts`, `ui/ClipSpin.tsx` and the ArmamentAct edits; add the copy key (wording from Mark) | A (label wording, +6 s or +4 s, keep x-ray outline) | 60k | 1-2 h | $0 |
| T6 | Rules-test additions (section 4) | | 25k | 30 min | $0 |
| T7 | Knock-ons: `scripts/review-stills.mjs` (shift every beat from 45.6 s on by +6.0 s, add 3 carbine beats), README act table, `remotion/HANDOFF.md`, `JG-041-showreel-v3.md` | | 15k | 20 min | $0 |
| T8 | Code gates (section 5, step 1), commit code on the sub-branch (no frames) | | 10k | 15 min | $0 |
| T9 | Review stills, contact sheet, `out/armament-review-spin-v1.mp4` | | 20k | 20 min | $0 |
| T10 | Mark's review | A | - | Mark | $0 |
| T11 | Astra ruling (codex surface) | | 15k | 15 min | $0 (codex quota) |
| T12 | Frames commit, merge into `torque-wrench/rebuild` | A | 15k | 15 min | $0 |
| T13 | Full-film review MP4, Mark accepts, then replace `showreel-v3.mp4`, stills and poster | A | 20k | ~2 h CPU | $0 |

Total without T3: about 290k tokens, about 5-6 h of agent and CPU time, $0.

**Riskiest assumption (unverified):** that any blend of discrete 2 deg angle steps reads as motion blur rather than stacked ghost copies of the ink, and that a 1 deg top-up would fix it if it doesn't. The 20-30 px per step figure is an estimate, not a measurement. T2's displacement test settles it at $0 before any spend.

Second unverified assumption: that Remotion 4.0.540's webpack setup bundles `.webp` imports and tolerates an empty `import.meta.webpackContext` match. The fix is in T5 (an explicit asset rule) if not.
