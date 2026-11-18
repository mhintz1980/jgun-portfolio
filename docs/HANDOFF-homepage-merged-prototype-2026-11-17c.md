# Handoff: studiomark.dev merged homepage prototype (c) - next session

Written 2026-11-17. Workspace: worktree
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a`
(branch `claude/homepage-prototype-approval-b6962a`, no upstream, nothing pushed). Do not
`cd` to the main checkout, and do not use `homepage-concepts-merge-2a1f76`.

Previous handoff: `docs/HANDOFF-homepage-merged-prototype-2026-11-17b.md`. Read it too: its
state, decisions, frame recipe and dead ends all still hold except where this file overrides.

## What the next session is for

1. **Overhaul the "Fall into project" paper tear.** Mark has feedback on what to change
   about the new tear and has **not given it yet**. First action: ask him for it. Do not
   tune the tear before it arrives.
2. Keep moving the homepage toward the **new chapter-video direction** below (Mark's
   "audible", 2026-11-17).
3. **Do not lose the repo split (JG-045).** Mark asked for this to be carried forward
   explicitly. See "Repo split" below.

## Uncommitted work in this worktree

Only the handoff files are committed. Everything else is uncommitted:

- `M proto/merged/index.html`, `M proto/merged/main.js` (phone pass, armament stage, tear)
- `M project/work/plans/JG-044-homepage-merged-concept.md` (armament frame facts)
- `?? docs/PROMPT-video-session-higgsfield-2026-11-17.md`
- `?? proto/merged/arm/` (120 WebP frames)

Commit only on Mark's go, by explicit path; the frames need a separate go.

## New direction: chapter videos (Mark, 2026-11-17, "calling an audible")

The homepage concept and mechanics stay. What changes:

- **Each chapter shows an animated model instead of the code-drawn planetary gear train.**
  The model turns about an axis, cross-sections or explodes. Mark's examples: the torque
  wrench rotates, turns sideways and explodes the internal gearing with the planets
  rotating in their cages; the enclosure does a 360° turn or a cross-section.
- **The lens ("reticle") shows the same motion photoreal.** The sheet shows a line version.
- **Source: videos rendered in Blender, Cycles, on Modal** from the real models. Several
  versions per chapter: the sheet version and the lens version, covering light and dark.
- **The chapter button dives into the project's video** ("the video of the project we
  currently use"; which video exactly is unanswered).

This session's recommendations, given to Mark, **not ruled**:
- One render per pass serves both themes: line pass as ink on white (the page recolours
  it), photoreal pass on transparent (the page draws the studio behind it).
- Scroll-scrub numbered WebP frame sequences, not MP4.
- Both passes from one Blender run and one camera, so the lens registers with the sheet.
- Pilot the torque wrench chapter first: local preview stills to Mark, then one Modal run.
- Estimates (not measured): Modal about $1-3 for four chapters; about 150-250k tokens per
  chapter for the Blender animation, 80-120k to rewire the page.
- Starting assets: `C:/Projects/CAD/Default.glb` (torque wrench, the site has its explode
  offsets), `C:/Projects/CAD/RL300-SAFE/` blends (enclosure), and the turntable renderer
  `remotion/clips/armament/blender/render_clip.py` in worktree
  `armament-wiring-clipspin-15a80d` (spins only: `--glb --out --angles --pass --engine
  --width --contour-only --max-elev --samples`; explode and section are not supported).

Still unanswered by Mark: what the dive lands on (showreel passage or a clip per project);
what model chapter 4 (Renderings) shows; whether chapter 3 keeps the carbine spin already
built. The JG-044 plan has **not** been updated for this direction.

## The dive: paper tear (built this session, Mark wants changes)

Mark's direction for the dive: pressing the chapter button tears the homepage paper open and
the camera falls through. Under the tear: the footage already under the lens. The tube: a
rendered dive into the part, then the existing code-drawn gear tunnel (this session's
proposal, not ruled; Mark offered a video distorted into a tunnel or a transition into the
current gear tunnel as options).

What exists now in `proto/merged/main.js` (uncommitted):
- **Two beats.** `fall.t` (tear, `TEAR_S = 2.4` s, camera still) then `fall.u` (the old
  3.7 s fall). Climb-out reverses `fall.u`, then closes the tear at about twice the speed.
  Reduced motion skips the tear (`fall.t = 1`) and keeps the old circular opening.
- **Tear timeline:** the lens closes to a point on the stage centre (`t` 0-.16), punctures,
  then rips open in three bursts to `R1 = clamp(min(W,H)*.3, 110, 300)` px. During the
  fall the hole widens past the screen. Chapter text fades to 8% from `t` .1-.55.
- **Shader** (`tearAt()` in the post fragment shader, uniform `uTear`): seven uneven
  petals; each folds back over the sheet as a triangular flap (reach up to 230 px) showing
  the paper's paler back with the grid faintly through it; ragged sides; fibres on the tips
  and on the hole edge between flaps; each flap casts a soft shadow away from a top-left
  light; the torn edge shades the inside of the hole. Lens glass effects and rim switch off
  while `uTear` is on.
- **Freeze URL for stills:** `?light&t=2&view=fall&p=1&tt=<0..1>&f=<0..1>`.

History: the first version (stills `.scratch/tear-2026-11-17/a-*`) was too fast to read
and its curl was invisible. Mark said it should be clear the paper tears, with larger
curled edges that cast a shadow on the paper, and pointed at two references in
`C:/Projects/Misc/gen-ai/visual/` (`hf_20261003_201706_*.png`: blue-glow tears in a
drawing; `hf_20261003_210535_*.png`: the real tool breaking through, with large
folded-back flaps, pale backs, fibrous edges and cast shadows). The current version
(stills `c-*`) answered that. **Mark replied "I have changes"; his specific feedback is
not yet given.**

Known flaws in the current tear: the faint grid on the flap backs comes out wavy like wood
grain; the dive now takes about 6.1 s instead of 3.7 s; in dark theme the hole opens onto
lens A's light studio, which reads bright.

## Repo split (JG-045): carry forward, do not lose

Mark's standing decision (2026-11-16, re-confirmed 2026-11-17 that it must not be lost):
separate the older parts of the project into their own repo and make the current version
lean, with only what pertains to it.

- Plan: `project/work/plans/JG-045-clean-repo-split.md` (committed `4c5b5cf1`, present in
  this worktree).
- Summary: old repo `mhintz1980/jgun-portfolio` stays untouched as the archive; the final
  site goes to a **new clean repo** with fresh history; nothing is deleted; video sessions
  keep working in the old repo; CAD masters and large files go to Mark's Google Drive
  (`C:\Projects\CAD` is 20 GB, in no repo and no backup); the project must stay editable
  from any computer; the Remotion source goes in the clean repo.
- **Timing:** after gate 2 (Mark approves the merged prototype). Not started; do not start
  it before then. JG-044 and JG-045 are still not in `TODO.md`; adding them is a cheap way
  to keep JG-045 visible.

## Decisions (Mark, this session)

- Phone stills approved. Armament stage started on the existing carbine frames ("Start it").
- Video split: a separate session improves the film with Higgsfield; this session reviews
  its packet. Prompt: `docs/PROMPT-video-session-higgsfield-2026-11-17.md`. The film
  session has since closed its Higgsfield batch early for the new direction (memory
  `project_wrap_20261117`): image-to-video redraws part geometry within 5 s, so realistic
  spins of real parts come from Cycles re-renders, not generation.
- New chapter-video direction and the tear-and-fall dive (above).
- Tear needs changes (feedback pending).

## Done this session (since handoff b)

- Paper tear v1 and v2 built in the post shader, with the two-beat dive timing.
- 34 frozen tear stills (desktop and phone, light and dark), all 0 page errors.
- Live dive and climb-out round trip: 0 errors, 60 fps, returns to the page.

## Not done

- Mark's tear feedback, then the tear overhaul.
- Any chapter-video work (no Blender, no Modal spend).
- Everything listed under "Not done" in handoff b (Astra ruling, carried concept 3 flaws,
  phone film crop, header overlap, 30 fps drop, audio, artifact, TODO entries, commits).

## Exact next steps

1. Read this file, then handoff b, `AGENTS.md`, `TODO.md` (Active), the JG-044 and JG-045
   plans.
2. Ask Mark for his tear feedback. While waiting, do not tune the tear.
3. Ask Mark the open chapter-video questions (dive target, chapter 4 model, chapter 3 carbine).
4. Apply the tear feedback; send stills early; Astra rules before it is called done.
5. Update the JG-044 plan for the chapter-video direction, then propose the torque-wrench
   pilot with cost first, and wait for Mark's go before any Modal spend.

## Files and commands

- Dev server: `preview_start {name:"dev"}`; it came up on **5199** this time (5200 earlier).
  Page `http://localhost:<port>/proto/merged/`. Open the prototype path, not the server root
  (the root is the old site homepage, which confused Mark once).
- New scripts in `.scratch/` (gitignored, never commit):
  - `tear2.cjs <outDir> <tag> [port]`: frozen tear stills at `tt` .1/.25/.45/.7/1 and fall
    `f` .08/.16, desktop and phone, light and dark.
  - `tear.cjs`: the v1 still capture (fall `f` only).
  - `fallrt.cjs [port]`: live dive and climb-out round trip.
  - Earlier scripts (phone, desk, arm, sheet, fps, err, encode_arm.py) as in handoff b.
- Stills: `.scratch/tear-2026-11-17/` (`a-*` v1, `b-*` v2 first pass, `c-*` current,
  `tear-sequence-light.png`, `tear-phone-dark.png`).
- Push needs `git push --no-verify` and Mark's go each time.

## Suggested skills

- `impeccable` for the tear overhaul and the opening details.
- `glsl-transition-shader-pipeline` for the tear shader.
- `blender-agent-core` before any Blender work on chapter videos.
- `anthropic-skills:verification-before-completion` before calling a phase done.

## Handoff Numbers

- Context at handoff: unknown
- Auto-handoff threshold: unknown
- Automatic handoffs in a row with no user message: unknown

## Files Modified

No cockpit-extracted list was supplied for this handoff. From this session's own tool calls
since handoff b:
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\proto\merged\main.js
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\.scratch\tear.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\.scratch\tear2.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\.scratch\fallrt.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-homepage-merged-prototype-2026-11-17b.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\HANDOFF-homepage-merged-prototype-2026-11-17c.md (this file)
- Stills under `.scratch/tear-2026-11-17/` (written by Playwright and node)

Earlier files of this session are listed in handoff b.

## Commits

- `391db45c` docs(handoff): homepage merged prototype 2026-11-17b
- The commit that adds this file. Verify with `git log --oneline -3`.

## Key Assumptions to Verify

- The tear code is in the working copy — verify with: `grep -n "TEAR_S = 2.4\|vec2 tearAt" proto/merged/main.js`
- This session's work is uncommitted — verify with: `git status --short`
- The JG-045 plan is present — verify with: `ls project/work/plans/JG-045-clean-repo-split.md`
- JG-044/045 are not in TODO.md — verify with: `grep -n "JG-04[45]" TODO.md`
- The tear references exist — verify with: `ls "C:/Projects/Misc/gen-ai/visual/"`
- The page and tear render with no errors — verify with: `node .scratch/tear2.cjs .scratch/tearcheck x 5199` (expect 18 lines with `errors 0`)
- The dive round trip works — verify with: `node .scratch/fallrt.cjs 5199` (expect `back {"u":0,"active":false` and `errors 0`)
- The ICM notes were stored — verify with: `icm recall "paper tear feedback JG-045 repo split"`

## Dead Ends

- **Tear v1 (fast rip during the fall, thin curl band):** too fast to read and the curl was
  invisible (Mark). Replaced by the two-beat dive with folded flaps.
- **Radial-only fibre noise:** combed the flap tips into long radial streaks. Mixing in
  screen-position noise broke them up.
- **Hash-stepped edge jitter (`hash(floor(dir*70))`):** made radial streaks in the hole
  shadow. Replaced with smooth noise.
- **Distorting the chapter video into a tunnel:** advised against (bends real part
  geometry, reads as a stock effect). Not built.
- From handoff b, still true: a hidden browser pane stalls the page (use Playwright with
  `channel:'chrome'`); long capture runs must log to a file; the film is not the cause of
  the 30 fps drop.

## Last Request from the User

> I have changes
> We need to overhaul the "Fall into Project" torn-paper  Use the handoff skill and update the ICM. note that i have feedback on what to change about the new 'paper tear' effect and that i want to make sure we dont lose the note another session made with me about separating the older parts of teh project into its own repo and making the cirrent the version lean with only what pertains to it.
> Try again

Status: Answered

This handoff and the ICM notes record that Mark's tear feedback is pending and that the
JG-045 repo split must be carried forward. The tear feedback itself is the next session's
first question.
