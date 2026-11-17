# Handoff: studiomark.dev homepage, concept 3 "Exploded view" - next session

Written 2026-11-16. Workspace: worktree
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-32e311`
(branch `claude/studiomark-homepage-redesign-32e311`). Do not `cd` to the main checkout.

Previous handoff: `docs/HANDOFF-homepage-redesign-concepts-2026-11-15.md` (concepts 1 and 2).

## What the next session is for

Close out concept 3: commit it, give Mark the final report he is still owed, and get his
verdict. Nothing is wired into the app build; `/home/` in `src/home/` is untouched.

## State on entry

- **Concept 3, "Exploded view"** - `proto/exploded-view/` (`index.html`, `main.js`,
  `lib/three.module.js`, `lib/three.core.js`, `lib/LICENSE-three.txt`). **Untracked, not
  committed.** `git status --short` shows only `?? proto/exploded-view/`.
- What it is: one planetary gear train generated in code from tooth counts
  (12/18/48, 12/18/48, 24/12/48, 18/15/48), drawn as an exploded view on a paper sheet by an
  edge-detect pass. A lens follows the cursor and shows the same parts as shaded metal. Scroll
  walks down the four stages, one per project. A short click on a stage, the "Fall into
  project" button, or Enter tips the camera over the stack and drops it down the bore to a
  plate showing a real project image. Esc climbs back out. Section 6 lists the systems work;
  section 7 collapses the stack to "assembled" beside the testimonial and contact.
- This combines Mark's two picks: concept 1's paper sheet and lens as the homepage, concept
  2's fall as the transition into a project.
- **Concept 2, "Down the Bore"** is saved two ways: commit `751edd97` (made in worktree
  `...-b936a9`, then fast-forwarded into this branch) and a private claude.ai Artifact,
  https://claude.ai/artifact/UHfuSFUee7qkMmHxvgdVUw.
- This branch now contains the b936a9 branch's three commits (`0b8ae78b`, `185db55d`,
  `751edd97`) by fast-forward merge. Nothing pushed.
- `.claude/launch.json` was edited once to add a `dev-b936a9` entry and then restored with
  `git checkout --`; it is unchanged from HEAD.
- No Higgsfield or other generation spend.

## Decisions made

- Built as a standalone slice under `proto/`, like concepts 1 and 2, so it cannot ship by
  accident. Wiring into `src/home/` waits for Mark's approval.
- three.js is a local copy of **r185.1** from the main checkout's `node_modules`. Mark's
  guideline said his builds used r186; r186 was not installed and nothing was downloaded.
- Copy is taken from `src/home/content.ts`, converted to sentence case. No new facts added.
- Project images on the plate come from `public/home/stacks/` (the owner-cleared sets named
  in `content.ts`). `renderings/06.webp` is not used.
- Each stage spins on its own; stages are not kinematically coupled. Within a stage the
  sun, planets and ring mesh correctly (checked numerically, see Done).
- The fall renders to a 0.72x target without multisampling, because it is motion-blurred.
- Phone layout puts the machine in the top half and the text on a paper veil below it.

## Done

- v1 plus five improvement rounds, each judged from screenshots taken in real Chrome
  through Playwright (`channel: 'chrome'`, headed, window off-screen).
- Frame rate at 1920x1080 on this machine's AMD Radeon 780M (integrated): 60 idle, 60 with
  mouse, 60 scrolling, 58 through the fall (one 67 ms frame at the start), 61 in the
  project view. Adaptive resolution is in place and did not trigger (scale stayed 1).
- Gear mesh check: `node .scratch/ev/mesh.cjs` reports 0 planet points inside the sun and 0
  outside the ring hole for all three tooth sets.
- Live interaction pass: no page errors, no requests to any host but localhost, hover
  cursor works, sound button toggles to "Sound on".
- Reduced motion: fall lands, title shown, Esc returns and unlocks scroll, no errors.
- `?t=<seconds>` freezes time. `?view=` takes `hero`, `s1`-`s4`, `plus`, `contact`,
  `fall` (with `&p=1..4&f=0..1`) and `project` (with `&p=1..4`). `&lens=x,y` places the lens.

## Not done

- **Not committed.** `proto/exploded-view/` is untracked.
- **Final report not delivered.** Mark's guideline asks for five lines or fewer: what to do
  in the first five seconds, the best moment and how to reach it, what was used, known flaws.
- **Independent adversarial critique not done.** The advisor agent was launched and failed
  with an API rate limit (HTTP 429) before returning anything.
- Frame rate was not re-measured after the last two edits (studio softbox move, text scrim
  on the project view). Both are cheap; re-run to confirm.
- One small fix identified and not applied: the project-view scrim (`.proj::before`,
  z-index 20) dims the "Enable sound" button and title block (z-index 12). Raise `.snd` and
  `.tb` above it.
- Sound was never listened to. Only the button state was checked.
- Not tested: a real touch device, device pixel ratio 2, Firefox, Safari.
- One 404 appears in most runs and was not identified (believed to be the favicon).
- First Tab stop is the "Enable sound" button; tab order through the nav and panels was not
  reviewed.
- `AGENTS.md` was not read in full this session and only the first 30 lines of `TODO.md`
  were read. `TODO.md` line 143 mentions the homepage and was skipped.
- Mark's sentence "And in the back of the center, I will show you how to use the two of
  them" was not understood and not acted on. Ask him.
- The testimonial keeps its attribution from `content.ts`, which names a company. Mark's
  constraint says no third-party brands. Ask whether the attribution stays.

## Exact next steps

1. Read this file, then `AGENTS.md` and `TODO.md` (at least the Active section and line 143).
2. Start the dev server with `preview_start {name: "dev"}` (port 5199) and open
   `http://localhost:5199/proto/exploded-view/` in real Chrome.
3. Apply the z-index fix above, then re-run `node .scratch/ev/live.cjs` and
   `node .scratch/ev/perf.cjs "t=1&view=hero" "t=1&view=fall&p=1&f=.6" "t=1&view=project&p=1"`.
4. Re-run the adversarial critique (advisor agent) and apply what survives.
5. Commit by explicit path: `git add proto/exploded-view/index.html proto/exploded-view/main.js proto/exploded-view/lib/three.module.js proto/exploded-view/lib/three.core.js proto/exploded-view/lib/LICENSE-three.txt`. Never add `.scratch/`. No push.
6. Give Mark the five-line final report and ask for his verdict, plus the two open
   questions (the unclear sentence, the testimonial attribution).

## Files and commands

- Slice: `proto/exploded-view/index.html` (markup and CSS, 204 lines),
  `proto/exploded-view/main.js` (624 lines).
- Test scripts, all in `.scratch/ev/` (gitignored, never commit):
  `shoot.cjs` (`node .scratch/ev/shoot.cjs "name=query" ...`, `VW`/`VH` env set the viewport),
  `live.cjs` (interaction pass with frame rates), `perf.cjs` (frame rate per frozen view),
  `rm.cjs` (reduced motion), `mesh.cjs` (gear intersection check), `dbg.cjs` (evaluate an
  expression in the page). Screenshots land beside them as `.jpg`.
- Playwright is required from
  `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/node_modules/@playwright/test`; this
  worktree has no `node_modules`.
- The dev server stops when the session is interrupted. If Playwright reports
  `ERR_CONNECTION_REFUSED`, run `preview_start {name: "dev"}` again and wait about 6 s.
- `window.__d` exposes renderer, camera, fall state for debugging; `window.__s` has fps.
- Artifact copy of concept 2 was built in the session scratchpad and is not in the repo.

## Handoff Numbers

- Context at handoff: 411445 tokens (411.4k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-32e311\.claude\launch.json
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-32e311\proto\exploded-view\index.html
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-32e311\proto\exploded-view\main.js

Note from this session's own git output: `launch.json` was restored and shows no diff. The
two slice files were also changed by shell scripts (Python and sed), not only by Write.

## Commits

Cockpit-extracted list: None.

Correction from this session's own git output: one commit was made through the shell, in
the other worktree, `751edd97 proto(home): save concept 2 'Down the Bore' fly-through slice`,
plus the commit that adds this handoff file. Verify with the command under Key Assumptions.

## Key Assumptions to Verify

- Concept 3 is untracked and concept 2 is committed — verify with: `git status --short && git log --oneline -4`
- `.claude/launch.json` matches HEAD — verify with: `git diff --stat -- .claude/launch.json`
- The fall still holds about 60 fps after the last edits — verify with: `node .scratch/ev/perf.cjs "t=1&view=fall&p=1&f=.24" "t=1&view=fall&p=1&f=.6" "t=1&view=project&p=1"`
- The gears mesh without intersecting — verify with: `node .scratch/ev/mesh.cjs`
- The page makes no request to any host but localhost — verify with: `node .scratch/ev/live.cjs` and read the `external requests` line
- The 404 is only the favicon — verify with: `node .scratch/ev/rm.cjs` and read any `HTTP 404` line
- The local three.js is r185, not r186 — verify with: `grep -o "REVISION = '[0-9]*'" proto/exploded-view/lib/three.core.js`
- The Artifact of concept 2 opens — verify with: open https://claude.ai/artifact/UHfuSFUee7qkMmHxvgdVUw
- `.scratch/` is ignored — verify with: `git check-ignore -v .scratch`

## Dead Ends

- **`preview_start {name:"dev"}` from a worktree without `proto/`**: this session opened in
  `32e311`, which did not have the slices. A temporary `dev-b936a9` launch entry pointing
  Vite at the other worktree worked, but fast-forwarding this branch and using plain `dev`
  was simpler. The entry was removed.
- **Fall-speed normaliser without clamping**: `G(x)` returned NaN for x just above 1, which
  made the camera field of view NaN and the whole fall black. `G` now clamps.
- **Full-resolution multisampled fall**: 15 to 36 fps on the 780M with a 36-tap blur.
  Replaced by a 0.72x target, 10-tap blur and no ambient occlusion while blurred.
- **Standard (PBR) material on the bore wall and floor**: full-screen cost held the project
  view at 52 fps. Lambert on both reached 60.
- **Warming the bore's shaders by showing it for two frames**: it is outside the view and
  gets frustum-culled, so nothing compiled. `renderer.compile()` at start-up is used.
- **Canvas `click` for falling into a stage**: a press-and-hold (which widens the lens)
  also fired it. Replaced by a pointer-up test: under 320 ms and under 8 px of travel.
- **Strong bump on the lathe-turned finish (0.35)**: gears read as vinyl or wood. Now 0.06.
- **Centred top softbox**: looking straight down the bore, every top face reflected it and
  blew out to white. Moved off-axis with a dim ceiling fill.
- **Leader line and balloon from the text panel to the stage**: cluttered and collided with
  the lens. Hidden; the centreline and per-stage call-outs replace it.
- **Stage gap of 4.4**: the stage above filled the top of each stage view. Now 5.8.
- **Camera lamp to brighten the fall**: it was not the cause of the blown-out gears (the
  softbox was). Kept at low intensity.

## Suggested skills

- `anthropic-skills:verification-before-completion` - before the final report.
- `impeccable` - if Mark approves and the build moves into `src/home/`.
- `r3f-scroll-performance-guard` - only if the approved build moves into R3F.
- `threejs-postprocessing`, `threejs-performance` - for further work on the composite pass.

## Last Request from the User

> Try again

Status: Partially answered

Context needed: the message came after an interrupted turn and was read as "continue the
homepage build". The build was resumed and rounds 4 and 5 were finished, but it is not
committed, the adversarial critique failed on a rate limit, and the five-line final report
was not delivered. Check `git status --short` and `proto/exploded-view/`, then do steps 3 to
6 above. Delivering the final report is the next step.

## Ready-to-paste prompt for the receiving session

```
Read docs/HANDOFF-homepage-exploded-view-2026-11-16.md first, then AGENTS.md and TODO.md, in the worktree
C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-32e311
(branch claude/studiomark-homepage-redesign-32e311).

Goal: close out homepage concept 3 "Exploded view" (proto/exploded-view/, untracked) and get my verdict.

First action: start the dev server with preview_start {name:"dev"} and give me
http://localhost:5199/proto/exploded-view/. Then raise .snd and .tb above the project-view scrim,
re-run .scratch/ev/live.cjs and perf.cjs, re-run the adversarial critique that failed on a rate
limit, commit proto/exploded-view/ by explicit path, and give me the final report in five lines or
fewer: first five seconds, best moment and how to reach it, what you used, known flaws. Ask me two
things: what I meant by "in the back of the center, I will show you how to use the two of them",
and whether the testimonial keeps its company attribution.

Constraints: AR-15-pattern wording only, no third-party brands or logos, no "Precision Revealed",
no .glb on /home/, damping as 1 - exp(-k*dt), commit by explicit path, never commit .scratch/,
no push, no Higgsfield spend without my go. Do not wire anything into src/home/ until I approve.

Do not redo: the three concept slices, the five improvement rounds, the gear mesh check, or the
frame-rate work. Verify animation in real Chrome via Playwright (channel chrome), not the Claude
browser pane.
```
