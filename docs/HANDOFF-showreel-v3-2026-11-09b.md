# HANDOFF — Showreel v3 "The Line", JG-041 iteration 2 (slice 1 done) — 2026-11-09b

Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (git worktree), branch
`torque-wrench/rebuild`, at `e3c05882` and pushed to origin. Scope is video only (`remotion/`): no
deploys, no edits to site pages, site choreography, or the `../src` files the film imports.
Replaces `docs/HANDOFF-showreel-v3-2026-11-09.md` (iteration 1) as the current handoff.

## Current state

- **Iteration 1 (logo ident): done, owner-approved, committed (`0de294ef`), pushed.** The Storm
  Ignition bumper plays muted after the Close, and the orange cut line wipes the blank sheet back
  in. The loop lands on frame 0. The film runs 2223 frames, about 74.1 s.
- **Iteration 2, slice 1 ("The Line", 2D): done, owner-approved, committed (`e3c05882`), pushed.**
  The laced thread is replaced by a ruled drafting line:
  - It is ruled thin in ink, then inked in Revision Orange by a crosshair pen.
  - It passes registration marks that light up as the ink reaches them.
  - **Opening:** the line slides parallel, like a T-square, onto the wrench drive axis (y=540).
  - **Close:** the labels rise as the ink reaches each mark, then the line underlines the address.
    The CTA reads "Follow the line".
  - Timings are unchanged.
- **Iteration 2, slice 2 (3D "full plotter" outlines): planned, NOT built.** See the plan.
- **Owner's last word:** "dont re-render. we have more to do first." He has not said what "more"
  is yet. Nothing is queued, so ask him.
- **`public/video/showreel-v3.mp4` is still the old accepted 69 s "Thread" cut.** It has not been
  re-rendered, by owner instruction.

## Decisions made (owner, in chat)

1. 2026-11-08: the logo slot comes first, with the Storm Ignition bumper, placed after the Close.
   It plays muted, and the loop lands on frame 0.
2. 2026-11-09: the logo ident, its stills and the ending review clip are approved.
3. 2026-11-09: the motif changes from "follow the thread" to **"follow the line"**. He picked
   **option B, "full plotter"**: the line also sketches each product before its 3D or image
   appears. The film is renamed **"The Line"**.
4. 2026-11-09: slice 1 is approved. Commit and push it, but **don't re-render**.
5. The `TODO.md` entry on `origin/main` (`306b2880`) says the thread → line swap was "WITHDRAWN".
   That entry was agent-written, not an owner ruling, and it is now contradicted by decision 3. It
   is not fixed, because other lanes are editing `TODO.md` in this worktree.

## Done / not done

| Item | Status |
|---|---|
| Logo ident code + rules lane (33/33) | Done, `0de294ef` |
| Logo stills | Done. README + contact sheet tracked; PNGs local (`.gitignore` excludes evidence PNGs) |
| Ending review clip `remotion/out/showreel-v3-logo-review.mp4` (frames 2000–2222) | Done, local only (`out/` is ignored) |
| Slice 1: `Line.tsx`, Opening, Close, wrench pen head, thread → line renames | Done, `e3c05882` |
| Slice 1 stills (16) | Done. README + contact sheet tracked, PNGs local |
| Approved ident unchanged by slice 1 | Verified: f2133 and f2205 pixel-identical; f2070 differs only where the Close changed |
| Loop seam | Verified: f2222 vs f0000 SSIM 0.9999, no pixel off by >8/255 (the old eyelet pop is gone) |
| Film typecheck, rules test | PASS, 33/33 |
| Root `npm run typecheck` | PASS |
| Root `npm test` | 1564/1565. `src/scene/torque-wrench/cadGate.test.ts` failed once under full-suite load and passes alone (2/2). It is another lane's code. |
| Root `npm run build` | Last PASS before slice 1. Not re-run after it (slice 1 touched only `remotion/` and docs). |
| Astra ruling on the line visuals | **Not done.** Memory: every visual effect needs an Astra ruling before it is called done. |
| Slice 2 (Machine linework pre-roll, Armament outline) | **Not started.** Waits on Mark's go. |
| Full re-render to `showreel-v3.mp4` | **Not done.** Mark said don't re-render yet. |
| `TODO.md` JG-041 "withdrawn" wording | Not fixed (other lanes are editing that file) |

## Exact next steps

1. Ask Mark what "more to do first" means before building anything. The candidates in the plan:
   - slice 2;
   - the armament act with the real 3D models (the TODO priority);
   - the identity act;
   - the rendering-tool act.
2. If he picks slice 2, these constraints are already worked out:
   - **Machine:** about 3 s of feature-edge linework plotted before the solid enclosure.
     - Build it only in `remotion/src/three/QuietMachine.tsx` or a new `remotion/src/three/` file.
       `../src/scene/rl300/*` is off-limits.
     - `prepareModel` already puts the section plane on those materials. **Append** the fill plane
       to `clippingPlanes`. Don't assign `= [fillPlane]` the way `Wrench.tsx` does, because that
       would kill the section cut.
     - Copy the hidden-line approach from `remotion/src/three/Wrench.tsx`: `EdgesGeometry(28°)`,
       depth-only twins with `polygonOffset`, and a faint `GreaterDepth` pass.
     - Enclosure stills take about 6 s each on SwiftShader.
   - **Armament:** about 2 s of outline plotted over the `ar-20` x-ray before the scan.
     - Derive it at render time (an SVG edge filter or a clip over the existing `Img`). Add no new
       asset file: a new file would need a new asset lane and rules block.
     - Keep it light, because the real 3D armament will likely replace this shot.
   - **Timing:** the film grows from about 74 s to about 79 s.
     - Retime `T` in `remotion/src/Showreel.tsx`.
     - Every downstream frame number shifts, including the ident stills (2040–2222) and
       `scripts/review-stills.mjs` times.
   - **Checks:** stills only. Re-check the loop seam (last frame vs frame 0).
3. Commit only on Mark's go, with an explicit path list (`git commit -- <paths>`).
4. Re-render only on his explicit go. A full render takes about 2 h on 4 cores
   (`--concurrency=3`). Always render to a separately named file first. Never overwrite
   `public/video/showreel-v3.mp4` until he accepts the cut.

## Files and commands

- Plan: `project/work/plans/JG-041-showreel-v3.md` (iteration 2 section, slice 1 table, slice 2 notes).
- Previous handoff: `docs/HANDOFF-showreel-v3-2026-11-09.md`. Older rework brief: `remotion/HANDOFF.md`.
- Evidence:
  - `project/work/evidence/JG-041-showreel-v3/stills-2026-11-09/` (logo ident)
  - `project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line/` (slice 1)
- Line primitive: `remotion/src/ui/Line.tsx` (`ruled`, `PenHead`, `Line`). Wipe: `remotion/src/ui/LineWipe.tsx`.
- Timeline (`remotion/src/Showreel.tsx` `T`):

  | Act | Start frame |
  |---|---|
  | Opening | 0 |
  | Wrench | 195 |
  | Machine | 711 |
  | Armament | 1227 |
  | Close | 1707 |
  | Ident | 2058 |
  | End | 2223 |

- Bundle: `cd remotion && npx remotion bundle --out-dir=out/bundle` (re-bundle after any code change).
- One still: `cd remotion && npx remotion still out/bundle Showreel out/x.png --frame=<n>` (6–12 s each for paper frames).
- Seam check: `ffmpeg -i <last>.png -i <first>.png -lavfi "[0:v][1:v]ssim" -f null -`
- Gates:
  - root: `npm run typecheck`, `npm test`, `npm run build`
  - film: `cd remotion && npm run typecheck`, `npx vitest run src/rules.test.ts`
- System ffmpeg is on PATH. Remotion's headless Chrome is now downloaded in this worktree.

## Handoff Numbers

- Context at handoff: 249901 tokens (249.9k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\evidence\JG-041-showreel-v3\stills-2026-11-09\README.md
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\HANDOFF-showreel-v3-2026-11-09.md
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\plans\JG-041-showreel-v3.md
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\ui\Line.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\scenes\Opening.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\scenes\Close.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\scenes\WrenchAct.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\evidence\JG-041-showreel-v3\stills-2026-11-09-line\README.md

The list above comes from Edit/Write calls only. Shell edits and renames also changed files; the
full set is in `git show --stat e3c05882` and `git show --stat 0de294ef`.

## Commits

- docs(jg-041): mark thread-to-line rework as undecided in handoff (2a5293c6)
- feat(jg-041): StudioMark logo ident after the Close (0de294ef)

Also in `git log` this session, made through shell calls:
- `89e10531`, the merge of `origin/torque-wrench/rebuild` (`11482ed0`);
- `e3c05882`, feat(jg-041): showreel becomes "The Line" (slice 1).

## Key Assumptions to Verify

- Origin has everything through `e3c05882`; the only local-only commit is this handoff (expect `1	0` until it is pushed) — verify with: `git fetch origin torque-wrench/rebuild && git rev-list --left-right --count HEAD...origin/torque-wrench/rebuild`
- The handoff commit is on top with slice 1 (`e3c05882`) right under it — verify with: `git log --oneline -3`
- No thread references remain in the film code — verify with: `grep -rniE "thread|eyelet" remotion/src remotion/scripts | grep -v OffthreadVideo`
- The film typechecks and the rules pass — verify with: `cd remotion && npm run typecheck && npx vitest run src/rules.test.ts`
- The cadGate failure is a load flake, not a regression — verify with: `npx vitest run src/scene/torque-wrench/cadGate.test.ts`
- `showreel-v3.mp4` is still the old cut (69.4 s) — verify with: `ffprobe -v error -show_entries format=duration -of csv=p=0 public/video/showreel-v3.mp4`
- The rejected showcase files are untracked and unstaged — verify with: `git status --short remotion/showcase remotion/showcase.config.ts`
- Nothing is staged — verify with: `git diff --cached --name-only`

## Dead Ends

- **`remotion still … --log=error 2>&1 | tail -2`:** this hid the cause of the "crash". It was
  the first-run headless Chrome download (131 MB), not a code bug. Run one still with full output.
- **Treating `TODO.md` (`306b2880`) "withdrawn" as an owner ruling:** wrong. It was agent-written,
  and Mark later decided for the line.
- **`ffmpeg … eq=contrast=12` for a diff image:** it renders all black. Use `lut=y='min(val*8,255)'`.
- **`git add -- <path>` on files already removed with `git rm`/`git mv`:** the whole add aborts.
  Leave those paths out of `git add`, and keep them in the `git commit -- <paths>` list.
- **Committing evidence PNGs:** not done. `.gitignore` excludes `project/work/evidence/**/*.png` on
  purpose. Track the README and contact sheet only.
- **A dark-to-paper crossfade at the loop seam** (iteration 1): it passes through muddy grey.
  Replaced by the orange cut-line wipe.

## Suggested skills

`remotion-render` and `remotion-best-practices` (stills and render flags). `threejs-geometry` and
`threejs-materials` for the slice-2 edge plotting (EdgesGeometry, clipping planes, depth-only
twins). `webgl-telemetry-verifier` if slice 2 needs numeric checks.

## Last Request from the User

> it looks good. I approve it . commit your changes and push but dont re-render. we have more to do first.

Status: Answered. Slice 1 is committed as `e3c05882` and pushed; nothing was re-rendered. "More to
do first" was not specified, so the next step is to ask Mark what that is.

## Ready-to-paste prompt

```text
Continue JG-041 showreel "The Line" in C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench (branch torque-wrench/rebuild, pushed at e3c05882).
Read first: C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\HANDOFF-showreel-v3-2026-11-09b.md, then AGENTS.md, remotion/README.md and project/work/plans/JG-041-showreel-v3.md.
State: logo ident (0de294ef) and "The Line" slice 1 (e3c05882) are owner-approved and pushed. Slice 2 (Machine linework pre-roll, Armament outline) is planned, not built.
First action: ask Mark what "we have more to do first" means: slice 2, real armament 3D, identity act, or rendering-tool act. Build nothing until he picks.
Constraints: video only (remotion/). No deploys, no site edits, never edit ../src/scene/rl300/*. Do NOT re-render or touch public/video/showreel-v3.mp4 without Mark's explicit go.
Iterate with stills only; re-check the loop seam (last frame vs frame 0). Commit only on his go, with an explicit path list (git commit -- <paths>). Never stage remotion/showcase* (rejected "Precision Revealed").
Astra's ruling on the line visuals is still pending.
Do not redo: the still-crash diagnosis, the logo ident, slice 1, or the thread -> line renames.
```
