# Handoff: studiomark.dev merged homepage prototype (b) - next session

Written 2026-11-17. **Workspace changed from the previous handoff.** Work in worktree
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a`
(branch `claude/homepage-prototype-approval-b6962a`). Not `homepage-concepts-merge-2a1f76`:
none of this session's work is there. Do not `cd` to the main checkout.

The branch was fast-forwarded to `b5ac4a29` (the previous handoff commit). It has no
upstream; nothing from it is pushed. **All of this session's work is uncommitted**, apart
from the commit that adds this file:

- `M proto/merged/index.html`, `M proto/merged/main.js`
- `M project/work/plans/JG-044-homepage-merged-concept.md`
- `?? docs/PROMPT-video-session-higgsfield-2026-11-17.md`
- `?? proto/merged/arm/` (120 WebP frames)

Previous handoff: `docs/HANDOFF-homepage-merged-prototype-2026-11-17.md`.

## What the next session is for

Take the merged prototype at `proto/merged/` to Mark's approval (gate 2 of JG-044, plan
`project/work/plans/JG-044-homepage-merged-concept.md`). JG-045 (repo split) is not started
and must not start before gate 2.

## State on entry

- Dev server: `preview_start {name:"dev"}`. `launch.json` asks for port 5199; this session
  got **5200** because 5199 was busy. Check which port you get. Page:
  `http://localhost:<port>/proto/merged/`, armament stage at `?view=arm`.
- URL switches (unchanged plus one): `?dark`, `?light`, `?view=hero|s1..s4|arm|plus|contact`,
  `?t=` freeze, `?o=` opening progress, `?paper=`, `?vig=`.
- Section order is now: opening (film) → stages 1-4 → **armament** → systems (plus) →
  contact. Title block sheet count is `/ 08`. `VMAP = { hero:0, s1..s4:1..4, arm:5, plus:6, contact:7 }`.
- The built-in browser pane was hidden this session, and a hidden pane stalls
  requestAnimationFrame, so pages sat on "Setting out the sheet". All captures were done with
  Playwright in real Chrome (`channel:'chrome'`).

## Decisions

### Ruled by Mark this session

- **Phone stills approved** ("phone stills are good").
- **"Start it"** for the armament stage on the existing carbine frames.
- **Testimonial attribution "BCP" only** (from his session-start constraints). Applied on
  every width; it previously carried a name and title.
- **Split video from homepage:** a separate session works on the film with Higgsfield; this
  session reviews what it hands back and adjusts the homepage or writes a correction prompt.
  Mark accepts negligible diffusion deviation from his real part geometry, and anything
  noticeable must be flagged to him.

### Tentative (Mark said "I'm thinking")

- Higgsfield on the film, and same-type non-protected weapons (billet AR-15 pattern and MK18
  receiver sets, M249 with custom parts) in the **video only**, reversing the 2026-11-04
  M249 ruling for video. The prompt asks the video session to confirm both with Mark before
  recording them. Whether Mark has pasted that prompt yet: **unknown**.

### Chosen by this session, not ruled by Mark

- Phone layout: hero text full width; paper veil tracks the top of the visible text and
  fades when no text shows; auto lens kept above the text and inside the margins; lens tag
  clamped; testimonial visible on phone (13.5 px); A/B/1/2/3 frame letters hidden on phone;
  "· Esc" dropped from the climb-out button on touch.
- Armament placement after stage 4 and before Systems.
- Scroll mapping 300° per section (side-on at the centre, about ±150° across the section);
  pointer nudge ±24° (`ptr.snx * 24`), off on phone and reduced motion.
- Panel copy: "Armament · line and shade", "AR-15 pattern carbine", "One model, two sets of
  frames. The line drawing sits on the sheet and the shaded model shows under the lens.
  Scroll turns it.", spec rows "60 · 6° apart" and "Representative model".
- "Representative model" shown by default (the carbine is a stand-in, owner ruling
  2026-11-13). Mark has not answered whether the homepage should carry the film's
  "(IP-Safe Representative Model)" line.

## Done

1. **Phone-width pass** (390x844, DPR 2, light and dark): 20 views, 0 page errors, no
   horizontal scroll. Stills sent and approved:
   `.scratch/phone-2026-11-17/phone-light.png`, `phone-dark.png`.
2. **Armament frame facts** read from the video session's answers file and written into the
   JG-044 plan ("Frame facts" section); open check 1 (even angles) closed.
3. **Video-session prompt** written: `docs/PROMPT-video-session-higgsfield-2026-11-17.md`
   (Higgsfield on the film, geometry-truth comparisons, spend gates, review packet and paste
   prompt back to the homepage session).
4. **Armament stage (JG-044 phase 4) built** in `proto/merged/`:
   - 60 line + 60 shade frames in `proto/merged/arm/` (`l00..l59.webp`, `s00..s59.webp`),
     2.16 MB total.
   - Shader: line frame drawn on the sheet in ink (both themes), shade frame under the lens
     on the studio background; uniforms `tL`, `tS`, `uArm`, `uArmRect`. The gear train fades
     off the sheet while the stage is on screen; stage hover/fall is disabled there.
   - Frames lazy-load once scroll passes stage 3.2.
   - The stage only reads a numbered frame set, so a new source can replace it.
   - Captures: 12 armament views + 20 desktop + 20 phone regression views, all 0 errors,
     all 60 fps. Stills sent: `.scratch/armament-2026-11-17/armament-{desktop,phone}-{light,dark}.png`.

### Frame encode recipe (in case `.scratch/encode_arm.py` is lost)

- Source: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/clips/armament/ar15-pattern-carbine-a/{line,shade}/f0000..f0179.webp`
  (1920x1080, frame i = 2i degrees; gitignored, local only).
- Every third frame (`f0000, f0003 … f0177`) → 60 frames, 6° apart.
- One fixed crop for the whole spin: box `(60, 330, 1860, 930)` → resize to `1278x426` (Lanczos).
- Line: RGB, WebP quality 62, method 6. Shade: RGBA, quality 72, alpha_quality 85, method 6.
- Run: `python .scratch/encode_arm.py "<source dir above>" proto/merged/arm`.

## Not done

- **Mark's verdict on the armament stills** and the label question.
- **Pointer nudge** not verified in motion (only scroll-driven angle was checked).
- **Slow scrubbing** will look stepped at 6°; halving the step is about 4.3 MB.
- **Astra ruling** (`gpt-6-astra`, codex surface) on lens, fall, look-around, blend, film
  opening, dark theme and the armament stage. Not requested.
- **Frame-rate drop:** headless Chrome runs sometimes drop from 60 to 30 fps after about
  5 s (one run had 17 of 20 views at 30). The later 52 captures were all 60. Cause unknown.
- **Phone:** the 16:9 film is cropped to a narrow strip and its caption text is cut at the
  left; on stages 2-4 the next gear ring shows behind the STUDIOMARK header.
- **Carried concept 3 flaws:** focus not moved on landing or climb-out; Esc ignored in the
  first half of the fall; reduced motion only shortens the fall.
- **Audio:** blocked on Mark's notes. The synth and the "Enable sound" button are still on
  the page.
- **Opening details** from the previous handoff (headline over drawing, no text after the
  lens closes, "EXPLODED STACK" title block) and the bright dark-theme fall: untouched.
- **Artifact** of the prototype not published.
- **TODO.md** has no JG-044 / JG-045 entries.
- **Commits:** the proto, plan and prompt-doc edits need Mark's go; the 120 frames need a
  separate go (they come from a gitignored lane).

## Exact next steps

1. Read this file, `AGENTS.md`, `TODO.md` (Active) and the JG-044 plan.
2. Ask Mark, without blocking: his verdict on the armament stills; whether the homepage label
   carries "(IP-Safe Representative Model)"; his audio notes; whether to commit the proto,
   plan and prompt files, and separately the frames.
3. Unblocked work, in order: check the pointer nudge in motion on the armament stage; fix the
   carried concept 3 flaws (focus, Esc, reduced motion); look at the phone film crop and the
   header overlap; chase the 30 fps drop.
4. When the video session's review packet arrives (`docs/REVIEW-PACKET-showreel-<date>.md`
   in its worktree), review it against the homepage needs and adjust or write a correction prompt.
5. Then Astra's ruling, publish the artifact, and ask Mark for gate 2.

## Files and commands

- Prototype: `proto/merged/index.html`, `proto/merged/main.js`, `proto/merged/arm/`.
- Plan: `project/work/plans/JG-044-homepage-merged-concept.md`.
- Video prompt: `docs/PROMPT-video-session-higgsfield-2026-11-17.md`.
- Answers file: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-spin-shot-review-12f814/docs/ANSWERS-homepage-armament-frames-2026-11-16.md`
  (the previous handoff named the wrong worktree for it).
- Scripts in `.scratch/` (gitignored, never commit). All hard-code **port 5200**; change it if
  the server lands elsewhere. Run from the worktree with `node .scratch/<name>`:
  - `phone.cjs <outDir> [port] [tag]`: 10 views x light/dark at 390x844, prints errors,
    fps and element boxes.
  - `desk.cjs`: the same at 1440x900.
  - `arm.cjs <outDir> <tag>`: armament views, desktop with lens positions and phone.
  - `sheet.cjs <shotsDir> <tag> <theme> <outPng> [names]`: contact sheet.
  - `fps.cjs` / `fps2.cjs <path?query> x [novid]`: fps samples; `novid` aborts the mp4.
  - `err.cjs` / `errd.cjs [port]`: one load, prints page errors and ready state.
  - `encode_arm.py`: the frame encode above.
  - Older scripts from the previous session are in the other worktree's `.scratch/`.
- Long Playwright runs: redirect to a log file (`> run.log 2>&1`); piping through grep hit the
  300 s limit.
- Playwright: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/node_modules/@playwright/test`.
  This worktree has no `node_modules`; `npx vite` resolves the shared one.
- `window.__s` (fps, ms, scale), `window.__fall(k)`, `window.__climb()`.
- Push needs `git push --no-verify` (fresh-worktree CRLF fails Biome) and Mark's go each time.

## Suggested skills

- `impeccable` for the phone film crop, the header overlap and the opening details.
- `threejs-performance` for the 30 fps drop.
- `anthropic-skills:verification-before-completion` before calling a phase done.
- `artifact-design` before publishing the prototype as an artifact.
- `higgsfield-video` only to read what the video session did; this session does not generate.

## Handoff Numbers

- Context at handoff: 285564 tokens (285.6k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\phone.cjs
- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\sheet.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\proto\merged\main.js
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\proto\merged\index.html
- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\err.cjs
- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\fps.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\project\work\plans\JG-044-homepage-merged-concept.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a\docs\PROMPT-video-session-higgsfield-2026-11-17.md
- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\encode_arm.py
- C:\Users\Markimus\AppData\Local\Temp\claude\572a275bd4073795\f20532df-35a1-49ae-b07c-9bcffe0b939e\scratchpad\arm.cjs

Note from this session's own tool output: files written outside Edit/Write are missing from
the list above: `proto/merged/arm/*.webp` (Python), the stills under
`.scratch/phone-2026-11-17/` and `.scratch/armament-2026-11-17/` (node, cp),
`fps2.cjs`, `desk.cjs` and `errd.cjs` (sed), and copies of all scratchpad scripts in this
worktree's `.scratch/`. This handoff file itself is also not listed.

## Commits

Cockpit-extracted list: None.

Correction: the commit that adds this handoff file (`docs(handoff): homepage merged prototype
2026-11-17b`). Verify with `git log --oneline -2`.

## Key Assumptions to Verify

- This session's work is uncommitted in this worktree — verify with: `git status --short`
  (expect the three `M` files, the prompt doc and `proto/merged/arm/`)
- The branch has no upstream and nothing is pushed — verify with: `git status -sb | head -1`
- There are 120 web frames — verify with: `ls proto/merged/arm | wc -l`
- The armament section is index 5 — verify with: `grep -n "arm: 5" proto/merged/main.js`
- Testimonial attribution is "BCP" only — verify with: `grep -n 'class="mono">BCP' proto/merged/index.html`
- The answers file is in the spin-shot-review worktree — verify with: `ls "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-spin-shot-review-12f814/docs/" | grep ANSWERS`
- The source frames still exist — verify with: `ls "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/remotion/clips/armament/ar15-pattern-carbine-a/line" | wc -l` (expect 180)
- The scripts were copied — verify with: `ls .scratch/*.cjs .scratch/*.py`
- The page loads cleanly at phone size — verify with: `node .scratch/err.cjs 5200` (expect `ready true`, no PAGEERROR)
- The armament stage renders with no errors — verify with: `node .scratch/arm.cjs .scratch/armcheck x` (expect 12 lines with `errors 0`)

## Dead Ends

- **Built-in browser pane while hidden:** requestAnimationFrame stalls, so every view after
  the first stayed on the boot screen. Use Playwright with `channel:'chrome'`.
- **300 s capture piped through grep:** hit the tool limit and moved to the background, and
  the sheet step then ran on missing files. Redirect to a log file and read it after.
- **Film as the cause of the 30 fps drop:** aborting the mp4 request did not prevent the
  drop. Not the film. Cause still open.
- **A generated spin as the lens source:** ruled out for the homepage. It is one layer with
  no matched line layer, its angles are uneven, and slow scrubbing exposes shape drift.
  The homepage keeps the rendered carbine frames unless the video session delivers a
  matched, even-angle set.

## Last Request from the User

> phone stills are good. Start it

Status: Answered

The armament stage is built in `proto/merged/`, 52 captures passed, and four stills were
sent. Mark's visual verdict on them is still pending.
