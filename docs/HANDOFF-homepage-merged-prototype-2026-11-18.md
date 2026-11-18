# Handoff: studiomark.dev merged homepage prototype (2026-11-18), next session

Written 2026-11-18.

**Workspace:** worktree `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a`, branch `claude/homepage-prototype-approval-b6962a`.
- The branch is pushed and tracks `origin/claude/homepage-prototype-approval-b6962a`; both are at `baeb8f25`.
- The working tree is clean, except for `.scratch/`, which git ignores.

**How to start:**
- Open the next Code-tab session on that worktree folder itself. Do not start in a new worktree. A desktop worktree session cannot Edit/Write files in another worktree: a built-in guard blocks it, and granting folder access does not lift it.
- First archive or stop the "Paper tear shader overhaul (b6962a)" session, so two sessions don't share the folder.

**Read before this one:** handoff 17c, then 17b (`docs/HANDOFF-homepage-merged-prototype-2026-11-17c.md`, `...-17b.md`). Their decisions, recipes and dead ends still hold, except where this file overrides them. Also read `AGENTS.md`, the Active section of `TODO.md`, and the JG-044 and JG-045 plans in `project/work/plans/`.

## Where things stand

1. **The "Fall into project" paper tear is finished and Astra-approved** (version **i**, GPT-6.2-Astra: "Approve", no corrections).
   - Both Astra verdicts and briefs are in `.scratch/astra/`:
     - `astra-verdict.md`: "rework", on version e;
     - `astra-verdict-2.md`: "approve", on version i.
   - Mark said "send to Astra" and then "commit". He has not given his own visual verdict on version i in words. If he raises the tear again, his words win.
2. **The chapter-video direction (Mark's audible, 2026-11-17) has not started.** Its open questions were asked at the start of this session and are still unanswered:
   - What does the dive land on: a showreel passage, or one clip per project?
   - Which model does chapter 4 (Renderings) show? (Recommended: the hydraulic square-drive wrench, if its CAD master exists. Not checked.)
   - Does chapter 3 keep the carbine spin? (Recommended: keep it. It is already built: 120 frames.)
3. **Gate 2 of JG-044** (Mark approves the merged prototype) is still open. The tear was one blocker; see "Not done".
4. **A separate branch-triage task has its own handoff:** `docs/HANDOFF-branch-triage-2026-11-18.md` (commit `baeb8f25`). It is meant for a fresh session in the main checkout. It says this branch was never pushed; that line is out of date now.

## Commits this session (on this branch, all pushed)

| Hash | What |
|---|---|
| `d21ebd43` | The tear dive (version i), plus the earlier uncommitted phone pass, armament stage and JG-044 plan edit (`proto/merged/main.js`, `index.html`, plan) |
| `5d38d9f0` | The 120 armament WebP frames, `proto/merged/arm/` (2.4 MB) |
| `d907f75a` | `docs/PROMPT-video-session-higgsfield-2026-11-17.md`, kept as a record |
| `baeb8f25` | `docs/HANDOFF-branch-triage-2026-11-18.md` |

## The tear as built (version i), in `proto/merged/main.js`

- **Timing:**
  - `TEAR_S = 1.65`.
  - The camera drop (`fall.u`, 2.73 s) starts once `fall.t > .65`, so it overlaps the third burst of the tear.
  - Climb-out: `fall.u` back over 2.0 s, then the tear closes over `TEAR_S * .45`.
  - Measured dive: **3.79 s** (was 6.1 s). The round trip passes with 0 errors.
- **`tearAt(p)`** returns `vec4(eR, reach, baseR, flapIndex + s)`.
  - **All of its noise is angle-only** (`vec2 pp = dir * 180. + 37.`), so every ray from the lens centre crosses the hole edge once and the flap tip once. That rules out islands and pinholes.
  - Seven flaps with a domain-warped angle (warp harmonics .022 / .012 / .005).
  - The fold root is a buckled curve: `baseR = flapArch + buckle + cleftRip`.
  - Flaps are wide and join at the root (`lobeW .95-.98`) with an off-centre apex.
  - Diagonal wedge sides: `lobeShape = pow(1 - pow(uTorn, ...), 1.32)`.
  - Large ragged shapes scale with the flap (`bigRip`). The fine tip noise is capped at about 12 px or less (`fineRip`, scaled down on small flaps).
- **`foldDir(pi)` / `foldOffset(pi)`** are used only for the straight Householder grid reflection on the flap backs: `qm = pp - 2*fDir*hinge/uPx` in `main()`, where `pp` is real paper space.
- **Sheet side, in `main()`:**
  - a two-tap flap cast shadow;
  - the flap: pale back with the reflected grid, planar facet lighting, crease shading measured from `o = r - eR`;
  - patchy `fpatch` fibres with a ply-step shadow;
  - pulp core in the clefts (`rimCrack`).
- **Lens side:**
  - the cavity cast shadow: `pCast = frag + L * (...)`, on the light side;
  - a 6 px contact lip.
- **`studio()`:** in dark theme the hole blends from lens A's light studio to the dark cavity as `uTear` rises. `uFull` only counts while the paper is tearing (`* step(.001, uTear)`), so the approved full-lens moment of the opening stays light.
- **Dark-theme flap backs:** `mix(uPaper, vec3(.68,.79,.89), .48)`, a chalky blue that stands clear of the navy sheet.
- **Freeze URL for stills:** `/proto/merged/?light&t=2&view=fall&p=1&tt=<0..1>&f=<0..1>` (`dark` in place of `light` for dark theme).

**Astra's notes on version i** (keep them, don't fix them):
- A few short teeth with matching shadow streaks just right of the bottom flap read as a small local nick at 1x.
- The long diagonal flap sides end at different angles and lengths, so the opening reads as torn, not polygonal.
- On phone the upper flap reaches behind the STUDIOMARK wordmark; the gears still read clearly.
- In dark theme the pale fibres carry more of the edge definition.

## Decisions (Mark, this session)

- Mark's tear feedback came through his own external reviewer agent, not in his words. Rounds:
  1. the reviewer's shader (d);
  2. Astra's corrections (e);
  3. the reviewer, round 2 (f);
  4. the reviewer, round 3 (g);
  5. the orchestrator's islands fix (h);
  6. the orchestrator's spike fix (i).
- Then: Astra approves i → commit → push.
- **Mark changed the dive timing.** The reviewer's prompt cut it from 6.1 s to about 3.8 s. This overrides the "do not redo the two-beat dive timing" rule from 17c.
- Mark approved committing the armament frames, the prompt doc and the triage handoff, and approved one push of this branch.

## Not done

- **Chapter-video work:** none of it has started, and the three questions above are unanswered.
  - The JG-044 plan has not been updated for the new direction.
  - The torque-wrench pilot comes next: local preview stills first, then one Modal run. **State the cost and get Mark's go before any Modal spend.**
  - Starting assets: `C:/Projects/CAD/Default.glb` (torque wrench), the blends in `C:/Projects/CAD/RL300-SAFE/` (enclosure), and `remotion/clips/armament/blender/render_clip.py` in the `armament-wiring-clipspin-15a80d` worktree (spins only).
  - That worktree also holds the 180 source carbine line frames. They are gitignored, so they exist nowhere in git. Never remove that worktree.
- **Gate 2 of JG-044:** Mark has not yet approved the merged prototype as a whole. Still open from 17b:
  - Astra has not ruled on the rest of the prototype (lens, look-around, blend, film opening, dark theme, armament stage).
  - The phone film crop and its cut caption.
  - The gear ring behind the header on stages 2-4.
  - Flaws carried over from concept 3: focus is not moved on landing or climb-out; Esc is ignored in the first half of the fall; reduced motion only shortens the fall.
  - The 30 fps drop in headless runs (cause unknown).
  - The opening details: the headline over the drawing, and the "EXPLODED STACK" title block.
  - Pointer nudge on the armament stage not verified in motion.
  - Mark's verdict on the armament stills, and the label question.
- **TODO.md** still has no JG-044 / JG-045 entries. Adding them is a cheap way to keep JG-045 visible.
- **JG-045 repo split:** waits for gate 2. Do not start it before then.
- **Audio:** blocked on Mark's notes.
- **Artifact:** none of the prototype has been published.

## Constraints (unchanged)

- Nothing goes into `src/home/` before Mark approves the prototype.
- No `.glb` on `/home/`.
- Testimonial attribution is "BCP" only.
- Weapons by pattern or designation only: no brands, and never "Precision Revealed".
- Astra rules on every visual effect before it is called done.
  - Astra is `gpt-6.2-astra` on codex. The codex default model is now `gpt-6.1-terra`, so name Astra explicitly. The invocation that worked: `codex exec -m gpt-6.2-astra -c model_reasoning_effort=high -s read-only --skip-git-repo-check -C <worktree> -o <out.md> -i <png> [-i <png>...] - < brief.md`.
- No Modal or Higgsfield spend without stating the cost first and Mark's go for that run.
- Commit by explicit path, never `.scratch/`.
- Push only with Mark's go, every time, using `git push --no-verify`.
- Open the prototype path, not the server root. The dev server is on 5199 or 5200. The app's preview card shows the root page, which is the old site; ignore it.
- Use Playwright with `channel:'chrome'` for captures.

## Files and commands

- **Dev server:** `preview_start {name:"dev"}`. Page: `http://localhost:<port>/proto/merged/`.
- **`.scratch/` scripts** (gitignored, never commit):
  - `compile.cjs [port]`: light and dark load at the tear freeze; prints page errors and GL compile/link errors.
  - `tear2.cjs <outDir> <tag> [port]`: 18 frozen stills (tear `tt` .1/.25/.45/.7/1, fall `f` .08/.16, desktop and phone, light and dark).
  - `ba.cjs <beforeDir> <beforeTag> <afterDir> <afterTag> <out.png> <names>`: before/after contact sheet.
  - `crop.cjs`: 2x crops.
  - `falltime.cjs [port]`: measures the dive.
  - `fallrt.cjs [port]`: dive and climb-out round trip.
  - Older ones, as in 17b: `phone`, `desk`, `arm`, `sheet`, `fps`, `err`.
- **Stills by version** (`.scratch/`):
  - c: `tear-2026-11-17/` (`c-*`)
  - d: `tear-2026-11-18/`
  - e: `-18b/`
  - f: `-18c/`
  - g: `-18d/`
  - h: `-18e/`
  - i: `-18f/` (current, with `ba-h-vs-i.png` and `crop-bottom-flap-h-vs-i.png`)

## Key assumptions to verify

- The branch is pushed and even with origin. Check: `git rev-list --left-right --count @{u}...HEAD`; expect `0 0`.
- Version i is in the code. Check: `grep -n "fineRip\|dir \* 180. + 37." proto/merged/main.js`.
- The timing is as described. Check: `grep -n "TEAR_S = 1.65\|2.73" proto/merged/main.js`.
- It compiles and the round trip works. Check: `node .scratch/compile.cjs <port>` and `node .scratch/fallrt.cjs <port>` (expect `errors 0`).
- The JG-045 plan is present. Check: `ls project/work/plans/JG-045-clean-repo-split.md`.
- The ICM notes were stored. Check: `icm recall "paper tear version i astra approved"`.

## Dead ends (this session)

- **Version e, Astra's straight chord hinge used as the hole edge:** the hole read as a cut heptagon, with a vertical seam where `gap` pulled `eR` inward. Use the chord only for the grid reflection, never for the silhouette.
- **Version g, paper-space (`p / uPx`) noise inside `tearAt`:** the flap outline switched on and off along a ray, leaving floating specks, pinholes and blotchy shadows. Keep `tearAt` angle-only.
- **Version h, angle-only noise with large amplitudes:** radial starburst spikes, because the amplitude was larger than the wavelength. Scale the slow shapes with the flap and cap the fine noise in px.
- **The tabletop `lobeShape`** (outer exponent < 1, as in f) cut vertical scissor sides. The wedge exponent of 1.32 fixed it.
- **`patch` as a GLSL variable name:** it is reserved in GLSL ES 3.00. Use `fpatch`.
- **Editing another worktree from a worktree session:** blocked by the desktop app; `change_directory` is refused too. Fix: start a session with its cwd in the target worktree and route edits through it.

## Last request from the user

> write the handoff for the next session

Status: Answered. This file is that handoff.

## Paste prompt for the next session

> Open this session on the folder `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\homepage-prototype-approval-b6962a` (branch `claude/homepage-prototype-approval-b6962a`, pushed, clean). Do not start in a new worktree.
>
> Read `docs/HANDOFF-homepage-merged-prototype-2026-11-18.md` first, then handoffs 17c and 17b, `AGENTS.md`, `TODO.md` (Active) and the JG-044 and JG-045 plans. The paper tear is done and Astra-approved (version i); don't retune it unless I ask.
>
> Goal: move the homepage to the chapter-video direction and toward my approval of the prototype (gate 2 of JG-044). First action: ask me the three open chapter-video questions:
> 1. What does the dive land on?
> 2. Which model does chapter 4 show?
> 3. Does chapter 3 keep the carbine spin?
>
> Then update the JG-044 plan and propose the torque-wrench pilot, with the cost first. No Modal or Higgsfield spend without my go for that run. Show me stills early.
>
> Constraints:
> - Nothing goes into `src/home/` before I approve, and no `.glb` on `/home/`.
> - Testimonial attribution is "BCP" only; weapons by pattern/designation, no brands.
> - Astra rules on visual effects.
> - Commit by explicit path, never `.scratch/`. Push only with my go, using `--no-verify`.
> - The JG-045 repo split waits for gate 2. The branch triage is a separate session with its own handoff.
