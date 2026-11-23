# JG-044 orchestration status

Coordinator branch `claude/homepage-prototype-gate-2-be5a82`. Prompt:
`docs/PROMPT-orchestration-2026-11-20.md`. Update this table whenever a thread reports; the
evidence column records what the coordinator checked, not what the thread said.

| Thread | Branch / where | State | Last verified evidence |
|---|---|---|---|
| Live site | Pages `ea262c8a` (Ch04 three beats + console + P3 turns; previous `67b63b36`) | live | 2026-11-21: deployed on Mark's go after real P3 frames; live main.js byte-identical to branch `00d6d667`; pump/receiver manifests + frames 200; Playwright live desk-dark + phone-light 0 page errors (phone re-run 0 failed after a local DNS drop; desk 6 aborted cage frame requests from the loader) |
| B Ch04 three beats | `claude/jg044-ch04-beats` merged into coordinator (`bb607954`) | merged | 2026-11-21: `ab02e7bc` changes only main.js + index.html; stage 4 = 3 screens (`#s4` 300vh), u2p/p2u scroll map keeps every later stage index; 2.50 px/frame desktop, 2.35 phone (thread's measure) |
| C Ch04 thin console | `claude/jg044-ch04-console` merged into coordinator (`0d9be83b`) | merged | 2026-11-21 checked: commits `12ab0d8e` + `6c9eacd6` touch only `proto/merged/console.{js,css}` (779 + 139 lines); `result.txt` 28/28 checks, 0 page errors in all 8 cases (one expected 404: pump/receiver manifests); 49 PNGs `.scratch/ch04/c-console/`; no banned names in console.js. Notes for merge: overlay z-index 30 covers sound/toolbar buttons; console stops Esc propagation while open |
| D P3 renders | coordinator `00d6d667` | done, live | 2026-11-21: Modal shade run by Mark from his own shell (session proxy blocks Modal): pump $0.20, receiver $0.10 measured = $0.30; line pass local Blender 5.3.0 $0; 360+360 each, pump 23 MB, receiver 11 MB, heroDeg 120; coordinator viewed shade sheets (no marks). Hero stills not rendered (console finish chips stay cage-only for pump/receiver). Astra SHIP |
| E OpenMotion trial | Mark starts a session in `C:/Projects/openmotion` with `docs/PROMPT-openmotion-trial-2026-11-21.md` | prompt ready | report lands at `docs/openmotion-trial-2026-11-21.md` |
| Merge B+C pass | coordinator `0d9be83b` | passed | 2026-11-21 coordinator run (B's serve.mjs, Chrome GPU): 8 cases desktop/phone x light/dark x motion/reduced: 0 page errors; Enter at beat 3 dives k=4, real console opens (isOpen, focus inside), Esc climbs out, console hidden, focus back on pill 03; only 404s = pump/receiver manifests (stand-in). Captures `.scratch/ch04/merge-bc/` |
| Review fixes | coordinator `54889f99` | done | 2026-11-21 reviewer: 0 critical, 2 warnings + 3 nits, all fixed (focus trap + inert + dialog role; stale beat on dives from stages 1-3; stand-in note now shows "Render in progress — cage shown for now."; orphan bitmap; freeze project view). Coordinator re-ran: 8/8 cases 0 page errors, Tab x60 stays in console, stage-1 dive opens Cage and returns focus to body, note visible |
| Open copy question | coordinator | Mark | "Gear ratio 3.67 : 1" box still shows during pump/receiver beats |
| F Astra packet | coordinator → `.scratch/ch04/astra-packet/` (ruling `astra-ruling.md`) | APPROVE WITH FIXES; fix 1 done + Astra ACCEPTED (`6cd6e171`); fix 2 waits on Mark | 2026-11-21: 52 stills + 61 s mp4, 0 page errors (coordinator viewed contact sheet). gpt-6.2-astra (log confirms model): must-fix 1 phone lens crosses the STUDIOMARK header (worker fixing in main.js, $0); must-fix 2 "scope readouts to the assembly" (pump inherits cage teeth/3.67 : 1, carbine shows 275 : 1). Coordinator note: those readouts are the page's gearbox conceit (main.js:43/55/951; 275 : 1 = whole train), so it is Mark's call. Optional: keep navy lens on cream; move "SHADED VIEW" label off the cage linework |
| G worktree consolidation | this session + integration thread (worktree `../integration-tw-film`, branch `integration/tw-film-2026-11-21`, not pushed) | step 1 done; integration branch partial (head `fd7c7beb`: higgsfield `74a5b5e7` + debris-field `fd7c7beb` clean; metrology ABORTED, 10 src/scene/torque-wrench conflicts from debris-field x metrology overlap; metrology + higgsfield alone conflicts only in TODO.md). No `check` script on these branches: tsc pass, station2 pass, vitest 4 fail/1579 pass (3 timeouts + labCameraProbe ENOENT on gitignored .scratch file) | 2026-11-21: `codex/jg041-b4-retirement` WIP commit `ff3aefb3` pushed, `feat/metrology-models` already on origin (`3c3ced05`, upstream now set); 6 contained worktrees removed (advisor, tear-feedback, concept-3-verdict, concepts-merge, prototype-approval, spin-shot-review) after copying their untracked docs + `.scratch/` (325 files) to main checkout `.archive/worktrees-2026-11-21/`; branches kept. origin/main also carries an older proto/merged/ (from #8/#9), resolve at Gate 3 |

## Hook contract between B and C (set by the coordinator 2026-11-21)

- C owns `proto/merged/console.js` and `proto/merged/console.css`. `console.js` is an ES module
  that sets `window.StudioConsole = { open(opts), close(), isOpen() }`.
  `opts = { root, sets, beat, deg, theme }`: `root` is the element to mount into, `sets` the
  three Chapter 04 set paths in beat order (`ch4/cage`, `ch4/pump`, `ch4/receiver`; missing sets
  fall back to `ch4/cage` until P3), `beat` 0-2, `deg` 0-359, `theme` `light|dark`.
  When the visitor asks to leave (Esc or the close control) it dispatches
  `document` event `studio:console-exit`; it never scrolls or touches the canvas.
- B owns `main.js` and `index.html`. It adds `<div id="studioConsole" hidden></div>` and the
  `console.css` link, and one function `openStudioConsole()` (the named hook) that, when the
  stage-4 dive lands, does `import('./console.js')` once (catch and ignore a failure) and calls
  `StudioConsole.open(...)` instead of showing the project plate. `climbOut()` calls
  `StudioConsole.close()`; B listens for `studio:console-exit` and calls `climbOut()`.
- Merge order B then C, browser pass after each merge.

## Mark's rulings (2026-11-21)

- Later the same day: go P3 full turns (cap $0.55 per model); go deploy (lens fix); hide the gear readouts off the cage beat (pump, receiver, carbine); leave the integration-branch metrology conflicts for Gate 3 and do NOT push metrology; thread E via a paste prompt.

- Go: music bed deploy (done, `67b63b36`), D 2-frame Modal pilots (cap $0.10 per GLB), G step 1 git actions.
- Dives 01-02 land on their current three.js / GSAP / R3F breakdowns (the existing project pages' rigs), not a showreel passage.
- Later, Mark brings direction: a better music track, the Chapter 03 M249 drawing treatment + sources, the film direction.
