# HANDOFF — Showreel v3, JG-041 iteration 1 (StudioMark logo ident) — 2026-11-09

> **Update, later on 2026-11-09 — this replaces "Current state" and "Undecided" below.**
> - The still "crash" was Remotion's first-run headless Chrome download, hidden by `tail`. No code fix.
> - The 8 stills rendered (`project/work/evidence/JG-041-showreel-v3/stills-2026-11-09/`). The root
>   gates passed (typecheck, 1565/1565 tests, build). The ending clip `remotion/out/showreel-v3-logo-review.mp4`
>   (frames 2000–2222) rendered on Mark's go.
> - Mark **approved** the logo ident, the stills and the clip, and the logo-ident code is committed.
> - Mark **decided** in chat: change the motif from "follow the thread" to "follow the line". The
>   details are under discussion. Don't build or render until he has agreed on them.

Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (git worktree), branch
`torque-wrench/rebuild` at `a77f549b`. Nothing from this session is committed except this file.
Scope is video only (`remotion/`): no deploys, no edits to site pages, site choreography or the
`../src` files the film imports.

## Current state

- The logo ident is coded, typechecks, and the rules test passes 33/33. **No stills have been
  rendered yet.** The last attempt bundled fine, but every `npx remotion still` call exited and
  printed only `Node.js v22.19.0`, so `remotion/out/` has no PNGs. The cause is not known yet,
  because the command piped through `--log=error ... | tail -2` and that hid the error.
- The owner said "Try again" four times about that failed still render. It has not been retried.

## Decisions made (owner, in chat 2026-11-08)

1. The first task is the **logo slot**, using the **Storm Ignition** bumper
   (`public/video/studiomark-bumper-storm-ignition.mp4`, committed in `b466843e`, 1920×1080 at
   60 fps, 4.5 s, has an AAC track). Puddle Crane was not picked.
2. Placement: **after the Close.** The bumper plays muted, because the film stays silent until
   music is supplied. The loop still lands on frame 0.

## Undecided: "thread → line" rework

- `remotion/HANDOFF.md` on `origin/main` (commit `11482ed0`, parent `a77f549b`) says to rework
  "the thread" into "the line".
- The JG-041 entry in `TODO.md` on `origin/main` (`306b2880`) says the opposite. An agent wrote that
  entry under Mark's name; Mark never said it in chat.
- Status: **UNDECIDED.** Do not start the line rework, and do not call it withdrawn or forbidden.
  If it becomes relevant, ask Mark.

## What the code does now

- `src/ui/ThreadWipe.tsx`: `ThreadWipe` and `WIPE = 24` moved out of `Showreel.tsx` so they can be
  reused. `Showreel.tsx` re-exports `WIPE`.
- `src/logo.ts`: `FILM_LOGO = { src: 'video/studiomark-bumper-storm-ignition.mp4', frames: 135 }`.
- `src/scenes/LogoIdent.tsx`: `LOGO_FRAMES = 135 + 24 + 6 = 165`. The bumper plays through
  `<OffthreadVideo muted>` inside `<Freeze active={f >= 135}>`. From frame 135, a `ThreadWipe`
  wipes `<Backdrop/>` (blank paper) back in, and 6 settled paper frames follow.
- `src/Showreel.tsx`: new `T.f = T.e + CLOSE_FRAMES - WIPE = 2058`. The ident enters behind a
  `ThreadWipe`. `T.end = 2223`, about 74.1 s, up from 2082 / 69.4 s.
- `src/scenes/Close.tsx`: the `loopOut` fade is removed, so the Close holds until the wipe.
- `src/Root.tsx`: registers `LogoIdent` under `Acts/`.
- `src/copy.ts`: `LOGO.burnedIn` lists the text baked into the bumper's pixels ("STUDIOMARK",
  "PRECISION CAD × CREATIVE COMPUTING", "STUDIOMARK.DEV", "PRECISION CAD × REAL-TIME 3D
  ENGINEERING"), so the banned-word scan covers it.
- `src/rules.test.ts`: new `showreel logo lane` block:
  - the bumper file exists;
  - every `'video/...'` literal must equal `FILM_LOGO.src`;
  - no `precision-revealed` anywhere;
  - no `<Audio>`;
  - every video element has `muted`;
  - `LOGO.burnedIn` is not empty.

  A negative check confirmed it: removing `muted` makes the rule fail.
- `scripts/review-stills.mjs`: stills added at 69.0, 70.1, 72.8 and 73.5 s (19–22).
- `remotion/README.md`: act table and rules list updated. It notes that the committed MP4 is
  still the accepted 69 s cut.

## Done / not done

| Item | Status |
|---|---|
| Plan `project/work/plans/JG-041-showreel-v3.md` | Done (untracked) |
| Evidence folder `project/work/evidence/JG-041-showreel-v3/` | **Not created.** The plan links to its README, which does not exist yet. |
| Logo ident code + rules lane | Done, uncommitted |
| `cd remotion && npm run typecheck` | PASS |
| `npx vitest run remotion/src/rules.test.ts` | PASS 33/33 |
| Review stills | **Not done.** `remotion still` crashed. |
| Root gates `npm run typecheck`, `npm test`, `npm run build` | **Not run** |
| Owner review of stills | Not done |
| Review MP4 (separately named) | Not started. Needs the owner's go-ahead: about 2 h full, or minutes for a partial `--frames=2000-2222`. |
| Commit | None. Needs the owner's go-ahead. |

## Exact next steps

1. Find out why `remotion still` crashes. Run one still with the full output, without `--log=error` and without `tail`:
   `cd remotion && npx remotion still out/bundle Showreel out/logo-f2184.png --frame=2184`
   If it is the `OffthreadVideo` compositor, also try `--frame=0`, which has no video, to tell a
   video-specific failure apart from a general one. Re-bundle first if any code changed.
2. Render stills at frames 0, 2040, 2070, 2103, 2133, 2184, 2205 and 2222. Pixel-compare frame 2222
   against frame 0 to check the loop seam. Save them to
   `project/work/evidence/JG-041-showreel-v3/stills-2026-11-09/` with a README, and send the PNGs
   to Mark (memory: surface images, don't describe them).
3. Run the root gates: `npm run typecheck`, `npm test`, `npm run build`.
4. Ask Mark to rule on the stills. Only after that, offer a separately named review MP4. Never
   overwrite `public/video/showreel-v3.mp4` before he accepts the cut.
5. Commit only on his go, with explicit paths only. Never `git add -A`: the worktree holds other
   lanes' work and the rejected showcase files.

## Files and commands

- Read on main without merging: `git show origin/main:remotion/HANDOFF.md`, `git show origin/main:TODO.md` (lines 1–25)
- Bumper frame sheets from this session (scratch, may be gone):
  `C:\Users\Markimus\AppData\Local\Temp\claude\96a3533af5683091\51b28668-8a54-4f7b-8d27-4471854472b4\scratchpad\sheet-storm-ignition.jpg`
- Bundle: `cd remotion && npx remotion bundle --out-dir=out/bundle` (worked, cached)
- System ffmpeg is on PATH (`C:\Users\Markimus\AppData\Local\Microsoft\WinGet\Links\ffmpeg`)

## Handoff Numbers

- Context at handoff: 165601 tokens (165.6k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\project\work\plans\JG-041-showreel-v3.md
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\ui\ThreadWipe.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\logo.ts
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\scenes\LogoIdent.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\Showreel.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\Root.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\scenes\Close.tsx
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\copy.ts
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\src\rules.test.ts
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\scripts\review-stills.mjs
- C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\remotion\README.md

## Commits

None. This handoff file is committed on its own, as earlier `docs/HANDOFF-*` files were.

## Key Assumptions to Verify

- The edits are still uncommitted and intact — verify with: `git status --short remotion project/work/plans/JG-041-showreel-v3.md`
- The rules lane still passes — verify with: `npx vitest run remotion/src/rules.test.ts`
- The film typechecks — verify with: `cd remotion && npm run typecheck`
- The bumper is 4.5 s / 135 film frames — verify with: `ffprobe -v error -show_entries format=duration -of csv=p=0 public/video/studiomark-bumper-storm-ignition.mp4`
- The two conflicting "thread → line" notes on main (both agent-written, neither is a ruling by Mark) — see with: `git show origin/main:TODO.md | sed -n '17,19p'` and `git show origin/main:remotion/HANDOFF.md`
- The rejected showcase files are still untracked and must not be staged — verify with: `git status --short remotion/showcase remotion/showcase.config.ts`
- Stills crash for every frame, not only video frames — verify with: `cd remotion && npx remotion still out/bundle Showreel out/f0.png --frame=0`

## Dead Ends

- **Thread → line rework:** not started, and not ruled out either. It is undecided (see above); ask
  Mark before touching it.
- **Remotion's bundled ffmpeg** (`npx remotion ffmpeg`) for frame sheets: the `fps=1.2` filter
  failed to parse. Use the system `ffmpeg` on PATH.
- **The `remotion still` loop with `--log=error 2>&1 | tail -2`:** this hid the crash reason. Run
  one still with the full output first.
- **Considered and rejected:** a dark-to-paper crossfade at the loop seam, because it passes
  through a muddy grey. It was replaced by the film's own orange cut-line wipe.

## Suggested skills

`remotion-render` and `remotion-best-practices` (still/render flags), and
`anthropic-skills:systematic-debugging` for the still crash.

## Last Request from the User

> Try again

Status: Not answered
Context needed: the failed still render — `cd remotion && npx remotion still out/bundle Showreel out/logo-f2184.png --frame=2184` (run without `--log=error`/`tail` to see the error). Answering it is next step 1.

## Ready-to-paste prompt

```text
Continue JG-041 showreel v3 in C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench (branch torque-wrench/rebuild).
Read first: docs/HANDOFF-showreel-v3-2026-11-09.md, then AGENTS.md and remotion/README.md.
Goal: get review stills of the new StudioMark logo ident (Storm Ignition bumper after the Close), already coded but uncommitted.
First action: run one still with full output to see why `remotion still` crashed:
  cd remotion && npx remotion still out/bundle Showreel out/logo-f2184.png --frame=2184
Fix the cause, then render stills at frames 0, 2040, 2070, 2103, 2133, 2184, 2205, 2222 into
project/work/evidence/JG-041-showreel-v3/stills-2026-11-09/, compare frame 2222 with frame 0, and send Mark the PNGs.
Then run the root gates (npm run typecheck, npm test, npm run build).
Constraints: video only. No deploys and no site edits. The "thread -> line" rework is UNDECIDED: don't start it, don't call it withdrawn; ask Mark if it comes up.
No full render or review MP4 without Mark's go. Never overwrite public/video/showreel-v3.mp4.
No commit without his go, and explicit paths only. Never stage remotion/showcase* (rejected "Precision Revealed").
Do not redo: picking the bumper or placement, the plan file, the rules lane (33/33 passing).
```
