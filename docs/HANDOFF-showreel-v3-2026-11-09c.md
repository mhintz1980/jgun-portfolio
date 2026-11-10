# HANDOFF: Showreel v3 "The Line", JG-041 iteration 2, slice 2 built (2026-11-09c)

This replaces `docs/HANDOFF-showreel-v3-2026-11-09b.md` (slice 1) as the current handoff.

## Where the work lives (changed this session)

- **Worktree:** `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7`.
  - It is the same repo as `jgun-torque-wrench`.
  - This Claude session's worktree hook blocks edits in `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`, so all slice-2 work happened here.
- **Branch:** `claude/jg-041-line-slice-2`.
  - It was cut from local `torque-wrench/rebuild` at `726b9476`, which is the 09b handoff commit. That commit is local only; origin was at `e3c05882`.
  - The old session branch `claude/jg-041-showreel-line-slice-2-11acd7` (`3ae8ab9c`, main-based) is untouched.
- **Junctions:** `node_modules` and `remotion/node_modules` in this worktree are junctions into `jgun-torque-wrench`.
  - Before deleting or archiving this worktree, remove only the links with `cmd //c rmdir node_modules` and `cmd //c rmdir remotion\node_modules`.
  - Never `rm -rf` them: that follows the link and deletes the real folders.
- **`jgun-torque-wrench` checkout:** it holds other sessions' uncommitted edits (`src/home/*`, `TODO.md`, root `README.md`, …). Do not touch them.

## Current state

- **Slice 2 is built and checked with stills only.** Mark was shown the stills and said "Yes, commit it".
  - **The commit has NOT been made.** The auto-handoff stopped the session right before staging.
  - Nothing is staged, and nothing is pushed.
- **Changes:**
  - **Quiet Machine, +90 frames (`MACHINE_PRE`):**
    - The wipe's orange cut line becomes the plotter pen and draws the shell's feature edges in cream.
    - An orange fill front then turns the drawing into the solid enclosure, and the lines ink orange as it passes.
    - The section study runs on `g = f - 90`.
  - **Armament, +60 frames (`ARMAMENT_PRE`):**
    - An SVG morphological edge filter traces `ar-20.webp` in ink on an unlit paper table. No new asset.
    - The light comes on (grey table plus ghost), and the scan clips the outline from the left.
    - The shots run on `g = f - 60`.
  - **Film length:** now 2373 frames, about 79.1 s (was 2223).
    - New act starts: Machine 711, Armament 1317, Close 1857, Ident 2208, End 2373.
- **`public/video/showreel-v3.mp4` is still the old 69 s cut.** Nothing has been re-rendered.
- **Astra's ruling** on the line visuals is still pending. It now covers slice 2's linework and edge filter too.

## Decisions (owner, in chat, 2026-11-09)

1. "More to do first" means: **start with slice 2**, then move on to the other candidates: real armament 3D, the identity act, the rendering-tool act.
2. Slice-2 stills were shown, and the owner said **"Yes, commit it"**.

## Done / not done

| Item | Status |
|---|---|
| `remotion/src/three/Draft.tsx` (new): clip fronts through the camera eye | Done, uncommitted |
| `QuietMachine.tsx`: shell-only edges, depth twins, fill plane appended (model and lower intake, `clipShadows`) | Done, uncommitted |
| `MachineAct.tsx` pre-roll, `ArmamentAct.tsx` pre-roll | Done, uncommitted |
| `remotion/scripts/review-stills.mjs` times (+3 s Machine content, +5 s from Armament on; new 08b and 12b entries), `remotion/README.md` act table | Done, uncommitted |
| Plan doc slice-2 table, evidence README and contact sheet | Done, uncommitted |
| Film typecheck; rules test 33/33 | PASS |
| f0000 and f0225 vs approved slice-1 stills | Identical |
| Close and ident at +150 frames vs approved | SSIM 0.9993–0.9999, grain only (`Backdrop` grain seed `floor(f/2)%24`) |
| Loop seam f2372 vs f0000 | SSIM 0.99988 |
| Section study regression (MachineAct old f150/260/360/500 vs new +90) | Identical, SSIM 1.000000 |
| Root `npm run typecheck`, `npm test`, `npm run build` | Not run this session; only `remotion/` changed |
| **Commit slice 2** | **NOT DONE: owner approved, do it first** |
| Push to `torque-wrench/rebuild` | Not done. Not yet approved; ask. |
| Astra ruling | Not done |
| Re-render | Not done; needs the owner's explicit go |

## Exact next steps

1. **Commit slice 2** (owner approved), working in the session worktree.
   - Stage the untracked files first:
     `git add -- remotion/src/three/Draft.tsx project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line-slice2/README.md project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line-slice2/contact-sheet.jpg`
   - Then commit with an explicit path list:
     `git commit -F <msgfile> -- remotion/src/three/Draft.tsx remotion/src/three/QuietMachine.tsx remotion/src/scenes/MachineAct.tsx remotion/src/scenes/ArmamentAct.tsx remotion/scripts/review-stills.mjs remotion/README.md project/work/plans/JG-041-showreel-v3.md project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line-slice2/README.md project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line-slice2/contact-sheet.jpg`
   - End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
   - Never stage the PNGs or `remotion/showcase*`.
   - Confirm that `git diff --stat -- src/` is empty.
2. **Ask Mark about the push.**
   - Recommended: `git push origin claude/jg-041-line-slice-2:torque-wrench/rebuild`. This fast-forwards origin from `e3c05882` and includes the 09b handoff commit `726b9476`.
   - The `jgun-torque-wrench` checkout then needs a `git pull --ff-only` later.
3. Offer to request Astra's ruling on slice 1 and slice 2.
4. Then the next act Mark picks: real armament 3D, identity act, or rendering-tool act.

## Files and commands

- Stills (PNGs local only): `project/work/evidence/JG-041-showreel-v3/stills-2026-11-09-line-slice2/`.
- Approved slice-1 PNGs: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\evidence\JG-041-showreel-v3\stills-2026-11-09-line\`.
- Bundle: `cd remotion && npx remotion bundle --out-dir=out/bundle`.
- One still: `npx remotion still out/bundle Showreel <out>.png --frame=<n>`. Per-act compositions are `MachineAct` and `ArmamentAct`.
- Seam or compare: `ffmpeg -i a.png -i b.png -lavfi "[0:v][1:v]ssim" -f null -`.
- Pre-roll tuning:
  - `MachineAct.tsx`: `plotT` (frames 24→66), `fillT` (56→88), `lineOpacity` (82→108), `lineColor` (60→84).
  - `ArmamentAct.tsx`: `plot` (16→70), `lightOn` (58→96), `EDGE_TRIM` = 3 px.

## Handoff Numbers

- Context at handoff: 252287 tokens (252.3k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 1

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\remotion\src\three\Draft.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\remotion\src\three\QuietMachine.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\remotion\src\scenes\MachineAct.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\remotion\src\scenes\ArmamentAct.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\remotion\README.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\project\work\evidence\JG-041-showreel-v3\stills-2026-11-09-line-slice2\README.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7\project\work\plans\JG-041-showreel-v3.md

The list above comes from Edit/Write calls only. Shell edits also changed these:
- `remotion/scripts/review-stills.mjs` (node script);
- the start of `remotion/src/scenes/ArmamentAct.tsx` (sed `ramp(f,` → `ramp(g,`);
- `contact-sheet.jpg` (ffmpeg).

## Commits

None. The slice-2 commit is approved but not yet made.

## Key Assumptions to Verify

- The session worktree is on the slice-2 branch, on top of `726b9476` — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 log --oneline -2 && git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 branch --show-current`
- Only the slice-2 files are changed, and nothing is staged — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 status --short && git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 diff --cached --name-only`
- The film still typechecks and the rules pass — verify with: `cd C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7/remotion && npm run typecheck && npx vitest run src/rules.test.ts`
- No `../src` file was edited — verify with: `git -C C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-showreel-line-slice-2-11acd7 diff --stat -- src/`
- `node_modules` entries are junctions, not copies — verify with: `cmd //c dir /AL C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-showreel-line-slice-2-11acd7`
- Origin `torque-wrench/rebuild` is still at `e3c05882`, so the push is a fast-forward — verify with: `git fetch origin torque-wrench/rebuild && git merge-base --is-ancestor origin/torque-wrench/rebuild claude/jg-041-line-slice-2 && echo ff-ok`

## Dead Ends

- **Writing in `jgun-torque-wrench` from this session:** the PreToolUse worktree hook blocks it. Work in the session worktree instead.
- **`git reset --hard` to move the session branch:** blocked by the destructive-command hook. `git switch -c <new> torque-wrench/rebuild` on a clean tree worked.
- **Clip fronts as world-axis planes found by bisection (the `Wrench.tsx` way):** wrong for the machine's 3/4 view plus `shiftX` lens shift. Use planes through the camera eye (`setScreenFront`).
- **Fill plane on model materials only:** the site's `LowerIntake` casts its own floor shadow before the fill arrives. Its materials get the fill plane through a wrapper group in `QuietMachine`.
- **Edge filter without a trim:** it traces the image's own border as an ink rectangle, so the outline needs `EDGE_TRIM`.
- **ffmpeg `drawtext` labels for contact sheets:** fontconfig makes ffmpeg segfault here. Build sheets without labels.
- **Expecting the shifted ident frames to be pixel-identical:** the grain seed depends on the frame number, so a +150 shift changes grain only.

## Suggested skills

`remotion-render`, `remotion-best-practices`. `threejs-materials` if the line look gets tuned.

## Last Request from the User

> Yes, commit it

Status: Not answered. The commit was interrupted by the auto-handoff before staging.
Context needed: next step 1 (exact `git add` and `git commit --` path lists above), run in the session worktree.
