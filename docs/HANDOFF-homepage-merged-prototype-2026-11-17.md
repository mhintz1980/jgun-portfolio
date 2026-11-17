# Handoff: studiomark.dev merged homepage prototype - next session

Written 2026-11-17. Workspace: worktree
`C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76`
(branch `claude/homepage-concepts-merge-2a1f76`, pushed to origin through `bdd20d08`; the
commit that adds this handoff is local only). Do not `cd` to the main checkout.

Previous handoff: `docs/HANDOFF-homepage-merge-prep-2026-11-16b.md`.

## What the next session is for

Continue the merged homepage prototype at `proto/merged/` toward owner gate 2 (Mark approves
the prototype). Plans, both owner-read and committed:

- `project/work/plans/JG-044-homepage-merged-concept.md` - the merged homepage (phases, gates, cost).
- `project/work/plans/JG-045-clean-repo-split.md` - moving the final site to a clean repo,
  after gate 2. Not started; do not start it.

JG-044 and JG-045 are proposed IDs. Neither is in `TODO.md` yet.

## State on entry

- `proto/merged/{index.html,main.js,lib/}` is the merged prototype, copied from
  `proto/exploded-view/` and changed. The three original slices are untouched on this branch.
- Dev server: `preview_start {name:"dev"}` from this worktree, port 5199. Page:
  `http://localhost:5199/proto/merged/`. Allow about 20 s before the first 200.
- URL switches: `?dark` (dark blueprint, lens A), `?dark=xray` (X-ray lens, kept for
  comparison only), `?light` (ignore a saved dark choice), `?paper=<hex>&vig=<0-1>` (paper
  tone and corner darkening), `?view=hero|s1..s4|plus|contact`, `?t=` (freeze), `?o=` (opening
  progress when frozen).
- Mark has seen stills of everything below and has the localhost URL. He has not reported
  on the page in motion apart from the look-around strength.

## Decisions made (this session, all by Mark unless marked)

- **Merge direction approved:** concept 1's opening, concept 3's gear train and lens as the
  body, concept 2's vertigo kept only as the fall. Concept 1's scan-line doorway and concept
  2's CSS 3D cards are dropped.
- **Paper: option B.** `#f4f1ea` with concept 3's grain and 8% corner darkening, one sheet for
  the whole page. This was owner gate 1.
- **Pointer look-around on every stage.** Opening and plates: layered parallax. Gear train:
  the camera tilt concept 3 already had. Mark asked for the parallax 20% stronger; done.
  Coefficients in `main.js`: headline `-21.6 / -12`, drawing `31.2 / 19.2`, plate text
  `-19.2 / -10.8` (x / y, times the smoothed pointer offset). Measured travel, pointer far
  left to far right at 1440 px: headline 18.6 px, drawing 26.8 px, plate text 16.6 px;
  all 0 under reduced motion. The plate's camera tilt (`.05 / .035` rad) was not raised.
- **The older film plays behind the opening.** Mark's words: he "really liked the look of the
  older video behind the opening page" and asked for more scroll room before the gear train.
  This is the published `public/video/showreel-v3.mp4`, passage 14 s to 40.4 s, shown in the
  lens. `EXTRA = 1.5` screens of scroll: the lens opens to full screen, the film cross-fades
  to the live gear train under the full lens, the lens closes onto the paper. This supersedes
  the earlier "no film on the merged page until the new cut is accepted" for the *old* reel
  only. The new cut still replaces it only after Mark accepts it.
- **Dark mode: yes, with lens A.** Dark blueprint sheet (`#0c2238`, pale lines). Inside the
  lens: the same photoreal render on a light studio, so text inverts under the lens in both
  themes. A Dark / Light button sits in the top bar and saves to `localStorage['sm-theme']`.
  First visit is light; it does not follow the OS setting (my default, not Mark's ruling).
- **Audio: Mark dislikes the current concept 3 sound.** He will send notes. Do not tune or
  build audio until they arrive. The synth code is still in `proto/merged/main.js` and the
  "Enable sound" button is still on the page; removing it was planned but not done.
- **Repo cleanup (JG-045):** old repo `mhintz1980/jgun-portfolio` stays untouched as the
  archive; the final site goes to a new clean repo with fresh history; nothing is deleted;
  video sessions keep working in the old repo; the split happens after gate 2; CAD masters
  and other large files go to Mark's Google Drive; the project must stay editable from any
  computer. The Remotion source (1.6 MB tracked) goes in the clean repo.

## Done

- Both plans written, committed and pushed.
- Concept branch merged into this one (`3bb2dd0c`), so all three slices are here.
- `proto/merged/`: paper B, opening on the shared sheet, film opening with extra scroll,
  look-around, dark theme with toggle. Committed `bdd20d08`, pushed.
- Verified in real Chrome (Playwright, `channel:'chrome'`, 1440x900): 0 page errors in every
  capture run; toggle survives click and reload; look-around measured; dark film, fall and
  plate captured.

## Not done

- **Armament stage (JG-044 phase 4).** Blocked on answers from the video session. Mark was
  given a prompt to paste there; the answers are to land in
  `docs/ANSWERS-homepage-armament-frames-2026-11-16.md` in worktree
  `armament-wiring-clipspin-15a80d`. Not confirmed that he sent it. Key unknown: whether the
  180 frames are evenly spaced in angle or carry the film's eased spin.
- **Audio (phase 5).** Blocked on Mark's notes.
- **Phone width, DPR 2, Firefox, Safari, touch.** Never checked on the merged page.
- **Frame rate.** Capture runs reported about 30 fps on the merged page against 60 fps for
  concept 3 alone. Cause not established (film texture or capture setup).
- **Astra ruling** (`gpt-6-astra`, codex surface) on lens, fall, look-around, blend, film
  opening and dark theme. Not requested yet.
- **Known flaws carried from concept 3:** reduced motion only shortens the fall; focus not
  moved on landing or climb-out; Esc ignored in the first half of the fall.
- **Opening details:** the headline overlaps the drawing (same as concept 1; Mark did not
  object); after the lens closes, the wide gear-train view has no text until stage 1;
  the title block still reads "EXPLODED STACK" at the top.
- **Dark fall is bright** (lens A's light studio fills the screen). Flagged to Mark, no reply.
- **Artifact** of the merged prototype not published.
- **JG-045** not started. `C:\Projects\CAD` is 20 GB with 65 files over 100 MB, in no repo
  and no backup; that exceeds the 15 GB free Drive tier. Mark's Drive space is unchecked.
- `TODO.md` has no JG-044 / JG-045 entries.

## Exact next steps

1. Read this file, `AGENTS.md`, `TODO.md` (Active section) and the two plans.
2. Ask Mark for two things he owes: the audio notes, and whether the video session answered
   the armament-frame questions. Do not block on either.
3. Unblocked work, in order: phone-width pass of `proto/merged/` (light and dark); find the
   cause of the 30 fps reading; fix the carried concept 3 flaws (focus, Esc, reduced motion).
   Show Mark a still early for anything visual.
4. When the armament answers exist: build phase 4 per the plan (about 60 web frames per
   layer, 1280 px, lossy WebP, under 4 MB total; label by pattern only).
5. Then Astra's ruling, publish the artifact, and ask Mark for gate 2.

## Files and commands

- Prototype: `proto/merged/index.html`, `proto/merged/main.js`.
- Capture scripts in `.scratch/` (gitignored, never commit): `paper.cjs` (paper options),
  `open.cjs` (opening scroll), `par.cjs` (look-around travel, normal and reduced motion),
  `film.cjs` (film opening and dark stills), `dark2.cjs` (dark lens A vs B), `dark3.cjs`
  (toggle, reload, dark film/fall/plate). Run as `node .scratch/<name>.cjs` with the dev
  server up. `p2.cjs`..`p7.cjs` are one-shot patch scripts already applied; do not re-run.
- Playwright: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/node_modules/@playwright/test`.
  This worktree has no `node_modules`; `npx vite` resolves the shared one.
- `window.__s` (fps, ms, scale, rms), `window.__fall(k)`, `window.__climb()`.
- Push needs `git push --no-verify` (fresh-worktree CRLF fails the Biome pre-push check).
  Mark approved the bypass twice this session, each time for that one push only.

## Suggested skills

- `impeccable` for the phone layout and the opening details.
- `r3f-scroll-performance-guard` or `threejs-performance` for the 30 fps question.
- `animated-3d-video-sites` for the armament line/shade frame scrub.
- `anthropic-skills:verification-before-completion` before claiming a phase done.
- `artifact-design` before publishing the merged prototype as an artifact.

## Handoff Numbers

- Context at handoff: 261448 tokens (261.4k) of a 1M window
- Auto-handoff threshold: 700000 (700k), from 70% of the 1M window
- Automatic handoffs in a row with no user message: 0

## Files Modified

- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\project\work\plans\JG-044-homepage-merged-concept.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\project\work\plans\JG-045-clean-repo-split.md
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\paper.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\p3.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\par.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\p4.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\film.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\p5.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\p6.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\dark2.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\p7.cjs
- C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76\.scratch\dark3.cjs

Note from this session's own tool output: `proto/merged/index.html` and
`proto/merged/main.js` were created by `cp` and changed by `sed` and the Node patch scripts,
so they are missing from the list above. `.scratch/p2.cjs` and `.scratch/open.cjs` were
written by shell heredoc.

## Commits

Cockpit-extracted list: None.

Correction from this session's own git output (commits made through the shell):
`4c5b5cf1` docs(plans): add merged homepage concept and clean-repo split plans;
`3bb2dd0c` Merge branch 'claude/homepage-concept-3-verdict-f323c0' into this branch;
`bdd20d08` proto(home): merged homepage prototype on one shared sheet;
plus the commit that adds this handoff. Verify with `git log --oneline -5`.

## Key Assumptions to Verify

- The branch is pushed through the prototype commit — verify with: `git status -sb | head -1 && git log --oneline origin/claude/homepage-concepts-merge-2a1f76 -1`
- Paper B is the default — verify with: `grep -n "f4f1ea" proto/merged/main.js proto/merged/index.html`
- The film opening has 1.5 screens of scroll — verify with: `grep -n "EXTRA = 1.5" proto/merged/main.js`
- Look-around is 20% stronger and off under reduced motion — verify with: `node .scratch/par.cjs` (expect headline about -18.6, drawing about 26.8, plate about -16.6, reduced all 0.0)
- The theme toggle saves and restores — verify with: `node .scratch/dark3.cjs` (expect "after reload" dark:true)
- The page loads with no errors — verify with: `node .scratch/film.cjs` (expect "errors 0" twice)
- The armament answers file exists — verify with: `ls "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/armament-wiring-clipspin-15a80d/docs/" | grep ANSWERS`
- The CAD folder is still outside any repo — verify with: `git -C "C:/Projects/CAD" rev-parse --is-inside-work-tree`
- `content.test.ts` still bans M249 — verify with: `grep -n "M249" src/home/content.test.ts`

## Dead Ends

- **`du` over the tracked file list and `C:\Projects\CAD`:** ran past the 120 s limit.
  `git ls-tree -r -l HEAD` gives tracked sizes instantly.
- **Shell heredoc containing a variable named `rm`:** blocked by the destructive-command hook
  as a false positive. Write scripts with the Write tool and avoid `rm` as an identifier.
- **Dark drawing layer via multiply on a pale-blue box:** rendered as a solid rectangle.
  `filter: invert(1)` on the image with `mix-blend-mode: screen` on the wrapper works.
- **First X-ray lens (rim glow only):** read as a dim teal render, not an X-ray. The version
  with depth edges and a thin-area ghost term reads correctly, but Mark chose lens A.
- **Fast-forwarding this branch to the concept branch:** no longer possible once the plans
  were committed here; a normal merge had no conflicts.
- **Writing into the other worktree:** a PreToolUse hook blocks it; all work is in this one.

## Last Request from the User

> Push no-verify

Status: Answered

The branch was pushed to origin through `bdd20d08` with `--no-verify`.

## Ready-to-paste prompt for the receiving session

```
Read docs/HANDOFF-homepage-merged-prototype-2026-11-17.md first, then AGENTS.md, TODO.md and
project/work/plans/JG-044-homepage-merged-concept.md, in the worktree
C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-concepts-merge-2a1f76
(branch claude/homepage-concepts-merge-2a1f76; pushed through bdd20d08, the handoff commit is local only).

Goal: take the merged homepage prototype at proto/merged/ to my approval (gate 2 of JG-044).

First action: ask me for my audio notes and whether the video session answered the armament-frame
questions. Do not wait on either. Then do the phone-width pass of proto/merged/ in light and dark
and show me a still.

Constraints: nothing goes into src/home/ before I approve the prototype. Do not start the repo
split (JG-045). No audio work until my notes arrive. No .glb on /home/. Testimonial attribution
is "BCP" only. Weapons by pattern/designation only, no brands, never "Precision Revealed".
Astra rules on visual effects before any is called done. Commit by explicit path, never .scratch/,
no push without my go (pushes here need --no-verify, ask each time).

Do not redo: the three concept slices, the two plans, the paper choice (B), the opening and film
handover, the look-around strength, or the dark theme with lens A and its toggle.
```
