# Handoff: studiomark.dev homepage redesign, concept slices - next session

Written 2026-11-15. Workspace: worktree
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-b936a9`
(branch `claude/studiomark-homepage-redesign-b936a9`). Do not `cd` to the main checkout.

## What the next session is for

Get Mark's verdict on concept 2 ("Down the Bore"), then either build the full `/home/`
from the approved concept or pitch another angle. The owner brief runs in two turns:
turn 1 is pitch + vertical slice + stop for `Approve` / `Nope, go again`; the full
homepage is built only after an approval. No approval has been given yet.

## State on entry

- **Concept 1, "Under the Print"** - `proto/under-the-print/index.html`, committed as
  `0b8ae78b`. Paper drawing sheet; pointer lens reveals the showreel beneath; scroll grows
  the lens to full studio; doorway 01 has a scan-line drawing-to-render reveal, spring tilt,
  leader lines and a zoom into `/torque-wrench/`. Mark: "I do like it", parked as the
  fallback "if we don't find anything better".
- **Concept 2, "Down the Bore"** - `proto/down-the-bore/index.html`, **untracked, not
  committed**. Scroll drops the visitor down a gearbox axis: canvas ring gears and streaks,
  CSS 3D cards for stages DRAWN / BUILT / RENDERED, doorway 01 arrives and holds, scrolling
  on punches through toward a 02 teaser. Built in answer to Mark asking for something more
  3D-immersive, things coming at the visitor, vertigo acceptable. Pitched and shown; no
  verdict yet.
- Both slices are standalone single HTML files served by the Vite dev server (they use
  absolute `/fonts/home/`, `/home/drawings/`, `/home/stacks/`, `/video/` paths from
  `public/`). They are not wired into the app build.
- Nothing pushed. No Higgsfield or other generation spend.

## Decisions made

- Slices live under `proto/<concept>/index.html`, outside `public/`, so they never ship.
- "Save that as an artifact" was read as "keep it in the repo" and done as a local commit.
  A claude.ai Artifact was not published: the slice needs bundled assets and the 18.9 MB
  showreel exceeds the per-file limit. Mark has not confirmed this reading.
- Concept 1 hero plays only 14 s to 40.4 s of `public/video/showreel-v3.mp4`; the open and
  close cards are paper-toned and vanish against the sheet.
- Vault image `sample work\STS_BCP\torque-render.webp` carries a third-party brand logo
  and is excluded (owner guardrail: no customer or employer logos).
- Doorway 01 render plate is a crop of `public/video/showreel-v3-poster.jpg`.
- Concept 2 software cards (StudioMark terminal, PumpTracker board, PDM table) are
  procedural mock-ups; real vault screenshots are full-build work.

## Done

- AGENTS.md read; staged `public/home` and `public/video` assets inventoried.
- Concept 1 pitched, built, checked in the browser pane at one desktop size, committed.
- Concept 2 pitched, built, measured at 59-61 fps in real Chrome at 1440x810 across seven
  scroll positions, no page errors (one 404, believed to be the favicon).

## Not done

- No verdict on concept 2. No full homepage build.
- Concept 2 not committed.
- Neither slice tested on phone width or with `prefers-reduced-motion`. Concept 2's
  reduced-motion path only disables roll, warp and streaks; a static fallback is not built.
- TODO.md was not read this session (CLAUDE.md asks for it at session start).
- `npm run check` not run; no app source was touched.
- Two concept 1 spec labels are guesses from imagery: "Two-speed shift collar" and
  "Square drive output, splined shaft".
- Optional Higgsfield shots were proposed, not run (see the session pitch; all seeded from
  Mark's own renders: `RL300-1.png` drift loop, torque-wrench push-in, billet receiver sweep).

## Exact next steps

1. Read `TODO.md` and this file.
2. Ask Mark for the verdict on concept 2 and whether "artifact" meant a claude.ai Artifact.
3. If approved: commit `proto/down-the-bore/index.html` by explicit path, then plan the full
   `/home/` build (four doorways, StudioMark scrubber, PumpTracker, CAD/PDM, testimonial,
   contact) in `src/home/`, replacing mock cards with vault assets and adding the static
   reduced-motion and touch fallback.
4. If not approved: pitch one new angle and build one new slice under `proto/`.

## Files and commands

- Start the dev server with the Browser pane tool `preview_start {name: "dev"}`
  (`.claude/launch.json`). It took port 5200 last time because 5199 was busy; use the
  port it reports. Never start it with Bash.
- URLs: `/proto/under-the-print/` and `/proto/down-the-bore/`.
- Motion and frame-rate checks: Playwright with `channel: 'chrome'`, required from
  `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/node_modules/@playwright/test` (this
  worktree has no `node_modules`). Script kept at `.scratch/bore/shoot.cjs`; captures at
  `.scratch/bore/*.jpg`. `.scratch/` is never committed.
- Owner brief (palette, fonts, guardrails, asset vault paths) is the first user message of
  the previous session; the vault is `C:\Projects\work-assets\portfolio\sample work\`.

## Handoff Numbers

- Context at handoff: 232034 tokens (232.0k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-b936a9\proto\under-the-print\index.html
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-b936a9\proto\down-the-bore\index.html

## Commits

Cockpit-extracted list: None.

Correction from this session's own git output: one commit exists,
`0b8ae78b proto(home): save concept 1 'Under the Print' hero + doorway slice`, plus the
commit that adds this handoff file. Verify with the command under Key Assumptions.

## Key Assumptions to Verify

- Concept 1 is committed and concept 2 is untracked — verify with: `git log --oneline -3 && git status --short`
- "Artifact" meant "save in the repo", not a claude.ai Artifact — verify with: ask Mark
- Concept 2 holds 60 fps in Chrome — verify with: `node .scratch/bore/shoot.cjs` (dev server on the port the script names, 5200)
- The 404 in concept 2 is only the favicon — verify with: open `/proto/down-the-bore/` in Chrome DevTools, Network tab, filter status 404
- Drawing WebPs have transparent backgrounds (need `background:#fff` before blend tricks) — verify with: `node -e "console.log(require('fs').readFileSync('public/home/drawings/gearbox-housing.webp').subarray(12,16).toString())"` (prints `VP8L` or `VP8X` for alpha-capable files)
- `/torque-wrench/` resolves in dev so the doorway zoom lands somewhere — verify with: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5200/torque-wrench/`
- The two guessed spec labels are correct — verify with: ask Mark

## Dead Ends

- **Ring gears as 2000 px SVG DOM layers in 3D** (concept 2): replaced by one 2D canvas
  drawing `Path2D` gears with a matching camera projection. The SVG layers were large
  compositor surfaces; the frame-rate reading that prompted the change was taken in the
  throttled pane, so their true cost was never measured.
- **Judging motion in the Claude browser pane**: it throttled `requestAnimationFrame` to
  about 0.5-2 fps and scaled a 1280 px viewport into a 381 px image. Use Playwright with
  installed Chrome for anything animated.
- **Treating CSS depth as distance from the eye**: CSS perspective scales by
  `P / (P + depth)`, so an item is 1:1 when camera z equals item z, not at distance `P`.
  The first concept 2 layout had every item at half size.
- **Showreel from 0 s under the concept 1 lens**: the opening card is paper-coloured, so
  the lens showed paper on paper.
- **Blend-tinting the drawings without a white backing**: transparent WebPs turned the
  whole tint layer solid blue.
- **`torque-render.webp` from the vault**: third-party logo, breaks the guardrail.

## Suggested skills

- `impeccable` - full homepage design pass once a concept is approved.
- `r3f-scroll-performance-guard` - only if the approved build moves into R3F.
- `higgsfield-video` - only if Mark approves the optional shots.
- `anthropic-skills:verification-before-completion` - before calling the build done.

## Last Request from the User

> `Alright, let's save that as an artifact for now Because I do like it, and if we don't find anything better, we can come back to it. I say that because I was thinking of something that Makes the user feel more like they're moving or things are coming at them....more 3D immersive...i dont care if it even makes them feel like they have vertigo or something.

Status: Partially answered

Context needed: concept 1 was saved as commit `0b8ae78b`, not as a claude.ai Artifact, and
the immersive concept 2 at `proto/down-the-bore/index.html` is built but has no verdict.
First step next session: ask Mark for the concept 2 verdict and the artifact reading.

## Ready-to-paste prompt for the receiving session

```
Read docs/HANDOFF-homepage-redesign-concepts-2026-11-15.md first, then TODO.md, in the worktree
C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\studiomark-homepage-redesign-b936a9
(branch claude/studiomark-homepage-redesign-b936a9).

Goal: land the studiomark.dev /home/ redesign. Two concept slices exist: "Under the Print"
(proto/under-the-print/, committed 0b8ae78b, my fallback) and "Down the Bore"
(proto/down-the-bore/, untracked, the immersive fly-through I asked for).

First action: start the dev server with preview_start {name:"dev"}, give me both URLs, and ask
me two things: Approve or Nope on "Down the Bore", and whether "save as an artifact" meant a
claude.ai Artifact. Do not build the full homepage until I approve a concept.

Constraints: AR-15-pattern wording only, no third-party brands or logos, no "Precision
Revealed", no .glb on /home/, damping as 1 - exp(-k*dt), commit by explicit path, never
commit .scratch/, no push, no Higgsfield spend without my go.

Do not redo: the two slices, the asset inventory, or the frame-rate check. Verify animation in
real Chrome via Playwright (channel chrome), not the Claude browser pane.
```
