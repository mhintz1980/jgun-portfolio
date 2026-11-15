# HANDOFF: JG-041 armament lane, film wiring prep (2026-11-15)

Supersedes the "Next steps" of `docs/HANDOFF-armament-lane-2026-11-13.md` (still valid for the render-lane facts, the Modal commands and the walls). Worktree: `.claude/worktrees/advisor-opus-4e6f71`, branch `claude/advisor-opus-4e6f71`, equal to `origin/main` at `706cb149` plus this handoff and the wiring plan (see Commits).

## Handoff Numbers
- Context at handoff: 223032 tokens (223.0k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 1
- Modal spend: unknown from the cockpit; from this session's own run logs about $0.54 of the $30 free tier in total (see plan v5 "Cost").

## STOP: do not proceed with wiring until Mark says go
Mark's last message ends: "Do not proceed until i say to. lets get all of the tools we need first." No edits to the film branch, no branch creation, no installs by the agent. The only permitted work is the tool survey below.

## State
- **Look decided (plan v5):** paper look. Line = Workbench Freestyle frames; shade = Cycles v2 frames multiplied onto paper `#f4f1ea` at about 50% (range 35-60%), ramped from 0 as the line resolves to shaded. Frames are NOT committed (scratch `C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v2-cycles-webp/{line,shade}/`; also on the Modal Volume `armament-frames`). Gates all passed. Shade re-render cost $0.0493.
- **Wiring plan written by Opus 5.5:** `project/work/plans/JG-041-armament-wiring.md` (171 lines, uncommitted until this handoff's commit). Summary: sub-branch `jg-041/armament-spin` off `origin/torque-wrench/rebuild`, lane copied by path (`git checkout origin/main -- remotion/clips`), because the film branch has no `remotion/clips/` and is 17 behind / 18 ahead of main (a merge would conflict with main's Biome pass). New 180-frame carbine shot before the x-ray shot (plot f16-70, hold, shade ramp 0 to 0.5 over f84-114, continuous-velocity spin with small overshoot over f114-171, hand-off into the x-ray). Frames delivered by webpack import from `remotion/clips/armament/<clip-id>/` (gitignored until approved), so `build/excludePublicAssets.ts` is untouched. Blending: weighted average in a new `ClipSpin` component. Test T2 ($0) measures ink motion per 2 deg step; T3 optional 1 deg top-up about $0.30-0.45, cap $0.50, only if T2 says it helps. Gate order: stills + `out/armament-review-spin-v1.mp4` (never run `npm run render` early: it overwrites `public/video/showreel-v3.mp4`), Mark, Astra, frames commit (A), merge (A), full-film review MP4, Mark accepts (A), only then the homepage MP4.
- **Not yet verified by me:** the plan's line numbers in `ArmamentAct.tsx` (L13-14, L45-47, L52/55/57, insert after L79) and its claim that `@remotion/motion-blur` is not installed on the film branch. Spot-check before executing.

## Mark's answers this session (2026-11-15) to the plan's four questions
1. Film length: **+6 s** (2373 to 2553 frames).
2. Existing x-ray outline: **undecided.** Mark asked to be SHOWN the existing x-ray outline plot and what dropping it would mean, and what replaces it. Not yet answered (see Next steps 1).
3. Label: a small disclaimer, along the lines of "IP-Sanitized Case Study" or "Representative Assemblies". Before the projects are shown, a note such as: "Note: Geometry shown is an IP-safe recreation. Core mechanical systems, material selections, and fabrication workflows match the original production release." Wording is Mark's draft; do not finalize copy or add it to `src/copy.ts` without his go. Check it against the rules test (no brand names; "AR-15-pattern" only).
4. Branch `jg-041/armament-spin`: **approved.** Do not create it yet (see STOP).

## New standing rule from Mark (2026-11-15)
No workarounds. If a standard or preferred tool is missing (e.g. a Remotion package), tell Mark plainly that it is missing and whether it is available at no/low cost, instead of writing around it. Mark installs the Remotion packages himself. Mark has installed `@remotion/motion-blur`; I had said it was not installed, and the plan's hand-written blend in `ClipSpin` is therefore a workaround to REPLACE with the real package (revise plan section 3 once the tool list is settled). Not yet saved to memory: save it as a feedback memory.

## Done / not done
Done this session: `.gitattributes` (LF) on main; hero stills ($0.0062); Modal Volume backup; Cycles tests, sweep, shade re-render with gates ($0.0493); look decisions recorded and pushed; Opus wiring plan written (not yet committed).
Not done: the tool survey (next step 2); x-ray explanation (step 1); plan revision for the motion-blur package and Mark's answers; commit of plan + this handoff pushed; Google Drive copy of the models (Mark's idea, needs his OK and folder); Modal dashboard cost check; Blender 5.3 test; Mark's review; Astra ruling.

## Next steps (in order)
1. **Show Mark the existing x-ray outline.** Review stills on the film branch: `git show origin/torque-wrench/rebuild:remotion/review/13-xray-scan.jpg` and `14-fire-control.jpg` (save to the scratchpad, then SendUserFile). Read `ArmamentAct.tsx` L10-22 and the 60-frame `ARMAMENT_PRE` pre-roll (an SVG morphological edge filter traces `ar-20.webp` on the unlit table, then the scan eats it). Explain: keep = two pen plots in a row (carbine, then x-ray outline); drop = the x-ray shot starts directly with the light on and the scan, no pre-roll, 60 frames shorter. Mark asked what REPLACES it: say plainly the new carbine plot replaces it as the film's plotted-line moment. Show a visual if cheap; ask him to choose.
2. **Tool survey (Mark's explicit ask):** ask Opus 5.5 (Agent type `ocx-claude-opus-5-5`; the hook alters Agent inputs, so issue the call twice, the second exactly as the hook returned it) which other Remotion packages and tools we could use (official `@remotion/*` packages and relevant third-party ones), which of them we lack, and for each: what it gives this film, cost/licence (Remotion's company licence terms, free vs paid), and whether it replaces a workaround in the plan. Also ask for non-Remotion tools in the same category that are missing. Brief it to read-only; have it check `remotion/package.json` on the film branch. Report to Mark as a short table with cost first. Do not install anything.
3. **Where are the Remotion tools?** Mark asked where I am "seeing" them. Answer: `remotion/package.json` lives on the film branch `torque-wrench/rebuild`; this worktree (main) has only `remotion/clips/`. Check the other working directory `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (an additional directory of the previous session; probably a film-branch checkout where Mark installed motion-blur): `git -C <dir> branch --show-current`, `grep '"@remotion' <dir>/remotion/package.json`, `ls <dir>/remotion/node_modules/@remotion`. Report which package set is installed where.
4. Save the no-workaround feedback memory; then revise `project/work/plans/JG-041-armament-wiring.md` (+6 s fixed, label draft, real motion-blur package, x-ray decision) as plan v2 and commit.
5. Wait for Mark's go before creating `jg-041/armament-spin` or touching the film branch.

## Files Modified (cockpit list, from Edit/Write calls)
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\advisor-opus-4e6f71\.gitattributes
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\advisor-opus-4e6f71\remotion\clips\armament\blender\render_clip.py

Also modified through Bash (not in the cockpit list): `project/work/plans/JG-041-armament-act.md`, `project/work/evidence/JG-041-armament-act/issues-log.md`, `docs/HANDOFF-armament-lane-2026-11-13.md`, `TODO.md`; written by the Opus subagent: `project/work/plans/JG-041-armament-wiring.md`; this file.

## Commits This Session (cockpit list)
- tooling: add .gitattributes (LF everywhere, binaries untouched) (6bc0f668)
- docs(jg-041): look decision (Cycles v2 shade, Workbench line), plan v5, issues 12-17, handoff (7b538797)
- docs(jg-041): shade re-render done (Cycles v2, $0.0493), gates passed, backup recorded (da669890)

Also (not in the cockpit list): da669890 was rebased onto newer main and is on origin/main as `1c08f6f1`; "docs(jg-041): paper look chosen (shade multiplied at ~50%), slice-tone item closed" is `706cb149` on origin/main. The handoff commit and wiring plan commit are local only unless pushed.

## Key Assumptions to Verify
- `origin/main` contains the paper-look commit — verify with: `git ls-remote origin refs/heads/main` (expect `706cb149...` or newer).
- The shade/line frame sets and the Modal backup still exist — verify with: `ls C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v2-cycles-webp/shade | wc -l` (expect 180) and `MSYS_NO_PATHCONV=1 py -m modal volume ls armament-frames /ar15-pattern-carbine-a-v2-cycles-webp/shade | grep -c webp` (expect 180).
- `@remotion/motion-blur` is installed where Mark installed it, and absent on the pushed film branch — verify with: `git show origin/torque-wrench/rebuild:remotion/package.json | grep remotion` and `grep '"@remotion' C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/remotion/package.json`.
- The film branch has no clip lane and is 17 behind / 18 ahead of main — verify with: `git rev-list --left-right --count origin/main...origin/torque-wrench/rebuild` and `git ls-tree -r --name-only origin/torque-wrench/rebuild | grep -c '^remotion/clips'` (expect 0).
- The plan's `ArmamentAct.tsx` line references match the branch — verify with: `git show origin/torque-wrench/rebuild:remotion/src/scenes/ArmamentAct.tsx | sed -n 10,22p` and `| sed -n 45,60p`.
- Shade p99.9 luminance stays below the paper's 241 (multiply blend is safe) — verify with the sweep script in plan v5 "Look decision" (recorded max 222 over 180 frames).
- Modal cost figures are rate-derived, not dashboard-verified — verify with: the Modal dashboard billing page (Mark's account).

## Dead Ends
- Alpha-over compositing of the shade onto paper: brighter shade pixels would show as white patches and hide the paper grid; multiply chosen instead.
- Workbench "fill tweak" instead of Cycles: never tried; Mark chose the Cycles test, Opus said do not reopen.
- `--pass both --engine cycles`: sends Freestyle through Cycles, an unvalidated path; the recipe is two separate runs.
- Cycles v1 (world 0.55, sun 3.2, clay 0.80): near-white blowout; v2 (0.40, 2.4, clay 0.62/0.60/0.57) kept.
- Parenting the sun to the camera: not needed, the 12-angle sweep showed no deep trough.
- 5-frame average of 2 deg steps (proxy for blending): ghosts the ink lines at any opacity; open risk, to be tested with the real blend (T2).
- Hand-written blend in `ClipSpin` and "no new dependency": superseded by Mark's rule; use `@remotion/motion-blur` if the survey agrees.
- Remotion public-dir routes (second render-time public dir; `public/` with prefix exclusion): rejected in the wiring plan in favour of webpack import from `remotion/clips/`.
- Git Bash path mangling (`/dest` became `C:/Program Files/Git/...`), cp1252 `✓` crash: fixed with `MSYS_NO_PATHCONV=1` and `PYTHONUTF8=1 PYTHONIOENCODING=utf-8`; launcher refuses `--max-usd` below the dry-run ceiling (set it at or above).

## Last Request from the User
1. +6sec
2. explain this by showing me the existing xray outline and what "dropping it" would mean. What replaces it?
3. It should be a small disclaimer saying something along the lines of "IP-Sanitized Case Study" or "Representative Assemblies". We could before theh projects are shown we can say something like "Note: Geometry shown is an IP-safe recreation. Core mechanical systems, material selections, and fabrication workflows match the original production release."
4. Yes i approve the branch. 

You stated that "@remotion/motion-blur isn’t installed". I do not want to use a workaround. If anything like this occurs you must make sure i am aware of the fact that we are missing a specific standard or preferred tool and whether or not we can get it at no/low cost. In this case i have installed the motion-blur tool. I will install every remotion tool we want. Where are seeing the remotion tools? i didnt think they were in this folder. Do not proceed until i say to. lets geta ll of the tools we need first. Ask Opus what other tools we could use in the remotion category and then if there are other tools we dont have but could use

Status: Not answered (the session ended on the automatic handoff before any tool call ran).
Context needed: `git show origin/torque-wrench/rebuild:remotion/package.json`, the `jgun-torque-wrench` checkout's `remotion/package.json` and `node_modules/@remotion`, and `remotion/review/13-xray-scan.jpg`; answering items 2 and the tool questions is next steps 1-3.

## Suggested skills
`remotion-best-practices`, `remotion-docs` (what each package does), `remotion-multimedia`; `orchestration` for the Opus dispatch; `read-the-damn-docs` for the Remotion licence and package list (check current official docs).

## Walls (unchanged)
No dimensions/GD&T/part numbers on screen. "AR-15-pattern" copy; no third-party brand or model names on screen or in committed filenames, manifest or `clip.json`. Representative stand-ins carry the representative label. M249 only as a tweaked display shell. Models never committed. No frames committed until the film review approves. No re-render of `public/video/showreel-v3.mp4` and no homepage change without Mark's explicit go. Put costs first; show images, do not describe them.

## Wiring status (appended 2026-11-15, after Mark's GO)
Mark's go: "Drop the x-ray outline, go ahead with wiring" (relayed). The wiring code is NOT written: a hook blocks Write/Edit from this worktree session into the film checkout, so a new session whose folder is the film checkout takes over. Money spent: $0. No push, no render, nothing installed by the agent.

**Commits on `jg-041/armament-spin`** (film checkout `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, cut from `torque-wrench/rebuild` at 10bceb68; left on that branch):
- `e82d8a24` chore(remotion): add `@remotion/motion-blur` 4.0.540 (Mark's package.json and lock change only).
- `cb689d58` chore: bring armament clip lane from main (`remotion/clips`, main's `local-paths.json` ignore line in the root `.gitignore`, and `clips/armament/*/line/` + `*/shade/` ignore lines in `remotion/.gitignore`).
Plan v2 itself is `ad07daf4` on `claude/advisor-opus-4e6f71` (this worktree), not on the sub-branch; copy `project/work/plans/JG-041-armament-wiring.md` over or read it from there.

**T2 ($0), outputs** in `C:/Users/Markimus/AppData/Roaming/Claude/side-session-notes/local_c0825e58-f3fa-4a17-bbfc-3576d55b96c0/t2/`: `displacement.csv`, `displacement.png`, `blend-sheet-peak.png` (variants A,B,C,E at N=10), `blend-sheet-N24.png` (A, F, G, E), and the two scripts `disp.py`, `strip.py` (run with `py -I`; scipy 1.18.1, numpy and Pillow present; no matplotlib).
- Ink shift between consecutive 2 deg line frames (nearest-ink distance, ink = luminance < 128): overall p90 median 5.0 px, worst 12.2 px (at 88 deg); stock p90 median 4.1, worst 21.1; handguard p90 median 4.0, worst 32.3; p50 median 1.0; p99 worst 31.0. Contour w = 2.6 px.
- Rule from plan v2: worst p90 d = 12.2, so d/2 = 6.1 px, which is between 2w (5.2) and 3w (7.8). Conclusion: **borderline, no clear case for the 1 deg top-up**; do not spend on T3 unless Mark asks after seeing the review MP4. Nearest-ink distance underestimates motion along a line, so treat it as a floor.
- Blend simulation (equal-weight, fixed N, matching the package's source): peak speed 11.6 source steps per frame (about 23 deg per frame), mean 3.2 over the 57-frame spin. At N=10 the peak frame shows stacked copies (stock ridges, muzzle end). At N=24 most copies merge. **Recommendation: variant F = N 24, line shutter 0.25 (shutterAngle 90), shade shutter 0.75 (shutterAngle 270).** G (F plus line opacity dip to 0.4 at peak) is softer; Mark has seen both sheets and has not picked yet.

**Frames** are copied (lossless, 72 MB, 180 line + 180 shade) to `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/remotion/clips/armament/ar15-pattern-carbine-a/{line,shade}/f0000..f0179.webp`; git ignores them (verified with `git check-ignore`). Source scratch: `C:/Projects/CAD/Armament/renders/ar15-pattern-carbine-a-v2-cycles-webp/`.

**Motion-blur component: `CameraMotionBlur`** (not `Trail`, not `HtmlInCanvasMotionBlur`). Why: it is the stable component, it averages N frozen sub-frame copies with equal weights (`plus-lighter`, opacity 1/N; samples at frame `f + 1 - shutterFraction * k/N`, k = 1..N, shutterFraction = shutterAngle/360), which is exactly the model T2 simulated; `Trail` is an echo effect (wrong look); `HtmlInCanvasMotionBlur` is experimental and Chrome-only, unverified under swangle. Notes for T5: children read `useCurrentFrame()` inside the Freeze, so compute the angle inside the wrapped child from the frame; mount blur only in the spin span (f114-171) and plain `<Img>` elsewhere; use two instances (line, shade) for separate shutters; `mix-blend-mode: multiply` goes on a wrapper OUTSIDE each blur, as a direct child of the act's root (a transform on an ancestor would isolate the blend from the Backdrop; position and size the box with left/top/width/height, not scale), white-backed opaque tiles inside; the package reduces samples near composition frame 0 only (irrelevant at f114+).

**Next plan task: T5** (T0, T1, T2 and the folder fill of T4 are done; the near-lossless conversion of T4 is not, see deviations). Then T6 rules tests, T7 knock-ons, T8 gates and a code commit (no frames), T9 review stills and `out/armament-review-spin-v1.mp4`, then stop at Mark's review.

**Plan v2 deviations / flags**
1. **x-ray pre-roll dropped** (Mark): `ARMAMENT_PRE` (60) goes away; the x-ray shot starts with the plate lit and goes straight to the scan. With `ARMAMENT_CARBINE = 180`: act 540 to 660 frames, film 2373 to 2493 = **net +4 s, not +6 s** (the +6 s was agreed with the pre-roll kept; for a net +6 s the carbine shot would need 240 frames). Assumption: keep 180 and tell Mark. Suggested x-ray clock: `h = f - 180`, `g = h`, `plateIn = ramp(h, 4, 34)`, `lightOn = ramp(h, 14, 40)`, scan unchanged at g 40-128; the plot code (`plot`, `plotX`, `EdgeFilter`, the outlined `<Img>` with the edge filter and the PenHead on the plate, L87-99) is removed. Carbine hand-off f176-200. Check with stills.
2. **N and shutters:** plan v2 said "per-pass shutters" only; the numbers are now N=24, 90 and 270 degrees (F above), pending Mark's pick of F or G.
3. **`cwebp` is missing** (not on PATH), free (libwebp tools). ffmpeg's libwebp encoder has no near-lossless mode, so the commit-format conversion of T4 is deferred: frames stay lossless (72 MB) for the review. Tell Mark plainly; he decides whether to install it (no workaround).
4. **Label wording** is Mark's draft only: carbine label such as "IP-Sanitized Case Study" or "Representative Assemblies" (small), and the note "Geometry shown is an IP-safe recreation. Core mechanical systems, material selections, and fabrication workflows match the original production release." Do not treat as final; keep it inside the rules test and flag it to Mark.
5. `remotion/clips/README.md` rule 2 (from main) contains an absolute scratch path; it predates this work.

**Pointer for future video/portfolio sessions (do not use in this wiring):** more sample work at `C:/Projects/work-assets/portfolio/sample work` (6 subfolders: STS_BCP, msp cad, other renderings-videos, powerpoint and training, pumptracker, rendering pipeline; 95 files).
