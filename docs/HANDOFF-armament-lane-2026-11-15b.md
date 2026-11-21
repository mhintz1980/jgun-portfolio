# HANDOFF — armament lane, carbine spin wired (2026-11-15b)

Follows `docs/HANDOFF-armament-lane-2026-11-15.md` (on `claude/advisor-opus-4e6f71`, "Wiring status") and plan v2 `project/work/plans/JG-041-armament-wiring.md` (same branch, commit `ad07daf4`).
Workspace for the next session: the worktree `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d` (branch `jg-041/armament-wiring`). A hook blocks Write/Edit into the film checkout `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, so work from a worktree.

## Current state
- Plan tasks T5–T9 are done. The film now opens Act 03 with a 180-frame carbine shot: pen plot of line frame f0000 (f16–70), line hold, shade resolves to 0.5 (f84–114), one spin with a 4° overshoot and settle using `CameraMotionBlur` (f114–171), settled hold, then a fade and drift into the lit x-ray light table (f176–200).
- The x-ray outline pre-roll (`ARMAMENT_PRE`, `EdgeFilter`, the plotted outline) is removed, per Mark's "Drop the x-ray outline". Act: 540 → 660 frames. Film: 2373 → 2493 frames (~83.1 s), **+4 s net, not +6 s**.
- Code commit `d10efa49`, with no frames. `jg-041/armament-spin` was fast-forwarded to it on Mark's "Yes, fast-forward". It was a ref move only (`git branch -f`, after an ancestor check). Nothing was pushed.
- Mark has the review files (sent with SendUserFile) and **has not reviewed them yet**:
  - contact sheet;
  - `arm-f134.png` (peak spin, variant F) and `arm-f134-G.png` (variant G, rendered by flipping the switch and then reverting it);
  - `arm-f190.png` (hand-off);
  - `armament-review-spin-v1.mp4`.
- The film checkout `jgun-torque-wrench` is **detached at `10bceb68`**. Another session moved it there: reflog 12:11 `jg-041/armament-spin → feat/metrology-models`, 13:18 detached. On `10bceb68` its `.gitignore` does **not** ignore the frame folders, and `remotion/clips/` shows as untracked (72 MB of frames). Don't run `git add -A` there.
- The `node_modules` junctions into the film checkout were removed from this worktree. To bundle or render here again, recreate them (command below). The copied frames (360 lossless webp files, gitignored) are still in the worktree.

## Decisions made (this session)
- **Blur:** `CameraMotionBlur` from `@remotion/motion-blur` 4.0.540, variant **F** (N 24, line shutterAngle 90, shade 270). It is mounted only for f114–170, conditionally on the act clock, not in a `<Sequence>`. A `Sequence` would reset the local frame to 0 and trigger the package's sample cut near frame 0.
- **Variant switch:** set `CLIP_BLUR_VARIANT` in `remotion/src/ui/ClipSpin.tsx` to `'F'` or `'G'`. G fades the line to 0.4 at peak speed.
- **Spin curve:** an exact port of T2's `strip.py` `ang()`, so the render matches the F/G sheets Mark saw. The peak is at act f134.
- **Pose per sample:** each `<Freeze>` sample computes its own pose from `useCurrentFrame()` (the `Pose` component). The angle is not passed in as a prop.
- **Blending:** the line and shade multiply groups are direct children of the act root (`ClipSpin` returns a fragment). Fade and drift go on each group, never on a shared parent. The shade is RGBA over white; the line is ink on white.
- **Layout:** box 1536×864 at left 192, top 196 (scale 0.8). The pen sweeps only the f0000 rifle bbox (source x 217–1802, y 405–865).
- **Label:** a placeholder, `ARMAMENT.representativeAssembly` = "Representative model — AR-15-pattern carbine". It is ink on paper, under the rifle, and visible whenever the layer is. Mark's draft wording ("IP-Sanitized Case Study" / "Representative Assemblies", plus the IP-safe-recreation note) is **not** in `copy.ts` and is not final.
- **X-ray clock:** `g = f - 180`, `plateIn = ramp(g, 4, 34)`, `lightOn = ramp(g, 14, 40)`, scan unchanged.
- **Branch:** work went onto a new branch `jg-041/armament-wiring` from `cb689d58`, because the hook blocked writes to the film checkout and `git reset --hard` was blocked by a guard hook.

## Done / not done
| Plan task | State |
|---|---|
| T5 loader + ClipSpin + ArmamentAct edits | Done (`d10efa49`) |
| T5 empty-`webpackContext` smoke test | Done: with frames moved aside, the bundle builds, f264 renders, and the carbine frames `cancelRender` "armament clip frames missing" |
| T6 rules tests | Done: 40/40 in `remotion/src/rules.test.ts` |
| T7 knock-ons (review-stills +4.0 s with carbine beats, README act table, HANDOFF file map, showreel plan note) | Done |
| T8 gates + code commit | Done. Root `npm test` had 14 failures, all in `src/scene`, under CPU load from the render; the same 29 files pass 444/444 when run alone |
| T9 stills, contact sheet, review MP4 | Done; files are local (paths below) |
| Evidence README + contact sheet commit | **Not done**: written, uncommitted, waiting on Mark's call |
| T4 near-lossless conversion | **Not done**: `cwebp` missing (free, libwebp). Mark is reviewing lossless frames |
| T10 Mark's review | **Waiting** |
| T11 Astra ruling (`gpt-6-astra`, codex surface) | Not started |
| T12 frames commit + merge into `torque-wrench/rebuild` | Not started (needs Mark's go) |
| T13 full-film review MP4, then `npm run render` | Not started (needs Mark's go) |

## Exact next steps
1. Wait for Mark's review of the stills and the MP4. Take his rulings on: F or G; the f190 hand-off (the plate fades in over the carbine and the stock shows to its left; this is the frame most likely to need a re-plan); the label wording; the +4 s length (+6 s needs `ARMAMENT_CARBINE = 240`); and whether to install `cwebp`.
2. If he asks for changes: recreate the junctions, edit, run `npm run typecheck` in `remotion/` (not chained with `&&`), bundle, re-render the affected stills and `out/armament-review-spin-v2.mp4`, and send the images.
3. After Mark approves: run the Astra ruling (T11). Then, with Mark's go, do the frames commit (T12): delete the two `clips/armament/*/line|shade/` ignore lines in `remotion/.gitignore`, and add the frames, `clip.json` and the `manifest.clips` entry.
4. Ask Mark whether to commit `project/work/evidence/JG-041-armament-act/film-stills-2026-11-15/{README.md,contact-sheet.png}`.

## Files and commands
- Code: `remotion/src/ui/ClipSpin.tsx`, `remotion/src/clips.ts`, `remotion/src/clipFrames.ts`, `remotion/src/webpack-env.d.ts`, `remotion/src/scenes/ArmamentAct.tsx`.
- Review files, all in the worktree and gitignored:
  - `remotion/out/arm-f{43,90,113,114,134,163,170,171,180,190,200,264}.png`
  - `remotion/out/arm-f134-G.png`
  - `remotion/out/showreel-f1451.png`
  - `remotion/out/armament-review-spin-v1.mp4` (660 frames, crf 18, 3.8 MB)
- Evidence (uncommitted): `project/work/evidence/JG-041-armament-act/film-stills-2026-11-15/`.
- Frames: `remotion/clips/armament/ar15-pattern-carbine-a/{line,shade}/f0000..f0179.webp`, gitignored. The originals are in the film checkout and in `C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v2-cycles-webp/`.
- Recreate the junctions from the worktree root:
  ```bash
  MSYS_NO_PATHCONV=1 cmd /c "mklink /J C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\armament-wiring-clipspin-15a80d\node_modules C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\node_modules && mklink /J C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\armament-wiring-clipspin-15a80d\remotion\node_modules C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\node_modules"
  ```
  Remove them before ending the session, with `cmd /c rmdir <path>` only (it removes the link, not the target).
- Bundle and stills, run in `remotion/`:
  ```bash
  npx remotion bundle --out-dir=out/bundle
  npx remotion still out/bundle ArmamentAct out/arm-f<n>.png --frame=<n>
  npx remotion render out/bundle ArmamentAct out/armament-review-spin-v2.mp4 --codec=h264 --crf=18
  ```
- Tests (from the worktree root): `npx vitest run remotion/src/rules.test.ts`.
- **Never** run `npm run render`: it overwrites `public/video/showreel-v3.mp4`.

## Handoff Numbers
- Context at handoff: 230313 tokens (230.3k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0
- Money spent this session: $0

## Files Modified
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/webpack-env.d.ts
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/clips.ts
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/clipFrames.ts
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/ui/ClipSpin.tsx
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/copy.ts
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/scenes/ArmamentAct.tsx
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/Showreel.tsx
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/src/rules.test.ts
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/scripts/review-stills.mjs
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/README.md
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/project/work/plans/JG-041-showreel-v3.md
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/HANDOFF.md
- C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/project/work/evidence/JG-041-armament-act/film-stills-2026-11-15/README.md

## Commits
From the cockpit's tool-call extract:
- None.

Correction, checked with git: the cockpit's list missed this session's code commit, which was made through Bash.
- `d10efa49` feat(remotion): armament carbine spin shot with CameraMotionBlur (JG-041 T5-T7). It is on `jg-041/armament-wiring` and on `jg-041/armament-spin` (fast-forwarded).
- Verify: `git log --oneline -1 jg-041/armament-spin`.

This handoff file itself is committed on `jg-041/armament-wiring` only.

## Key Assumptions to Verify
- `jg-041/armament-spin` points at `d10efa49` — verify with: `git log --oneline -1 jg-041/armament-spin`
- The film checkout is still detached at `10bceb68` with untracked `remotion/clips/` — verify with: `git -C "C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench" status -sb | head -3`
- Mark's motion-blur install is intact after the junctions were removed — verify with: `ls "C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/remotion/node_modules/@remotion/motion-blur/package.json"`
- `CLIP_BLUR_VARIANT` is `'F'` in the committed code — verify with: `git show jg-041/armament-wiring:remotion/src/ui/ClipSpin.tsx | grep "CLIP_BLUR_VARIANT:"`
- The 14 root-test failures were load-related, not caused by this change — verify with: `npx vitest run src/scene/drawing/sheet src/scene/inspection/shaft src/scene/rig/nodeRoles.test.ts src/scene/rl300/v16Materials.test.ts src/scene/torque-wrench` (needs the junctions)
- `cwebp` is still missing — verify with: `command -v cwebp || echo missing`
- The frames in this worktree are still complete — verify with: `ls remotion/clips/armament/ar15-pattern-carbine-a/line | wc -l` (expect 180)

## Dead Ends
- **Write/Edit into `jgun-torque-wrench`:** blocked by the worktree hook. Build in a worktree instead.
- **`git reset --hard cb689d58` on the session branch:** blocked by the destructive-commands guard. Use `git switch -c <new> cb689d58` instead.
- **`cmd //c mklink /J` with `cygpath` paths:** fails with "Invalid switch". Use `MSYS_NO_PATHCONV=1 cmd /c "mklink /J <win> <win>"`.
- **Passing a precomputed angle into the blurred subtree:** ruled out before building. All 24 `<Freeze>` samples would get the same pose, so there would be no blur.
- **Mounting the blur inside `<Sequence from={114}>`:** ruled out. The package cuts samples near local frame 0 (by 6 frames for the line and 18 for the shade).
- **A shared opacity or transform parent around the multiply groups:** ruled out. It isolates the blend and shows a white box during the fade.
- **`rtk read` via Bash on this machine:** the auto-mode classifier could not review it because a hook rewrites the call. Use Read.

## Suggested skills
- `remotion-best-practices` (router) and `remotion-render` for any re-render.
- `orchestration` if the Astra ruling (T11) is dispatched to the codex surface.

## Last Request from the User
> Yes, fast-forward

Status: Answered. `jg-041/armament-spin` was moved to `d10efa49`.

## Paste-ready prompt for the next session
```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/docs/HANDOFF-armament-lane-2026-11-15b.md first. Work in that worktree (branch jg-041/armament-wiring); the film checkout jgun-torque-wrench is hook-blocked for writes and is detached at 10bceb68. Don't touch it.

Goal: take Mark's review of the JG-041 carbine spin shot (commit d10efa49) and act on it.

First action: run the "Key Assumptions to Verify" commands, then ask Mark for his rulings on each of these:
- F or G;
- the f190 hand-off;
- the label wording;
- +4 s vs +6 s;
- installing cwebp.

Constraints:
- Costs first, and $0 so far. No Modal or Blender spend.
- Never run npm run render. No homepage change.
- No frames or models committed. No pushes without asking.
- Stage only your own paths.
- If a standard tool is missing, say so with its cost; don't write around it.
- Send images, don't describe them.

Do not redo: T5-T9 wiring, the rules tests, the review stills or the v1 MP4.
```
