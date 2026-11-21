# JG-044 orchestration status

Coordinator branch `claude/homepage-prototype-gate-2-be5a82`. Prompt:
`docs/PROMPT-orchestration-2026-11-20.md`. Update this table whenever a thread reports; the
evidence column records what the coordinator checked, not what the thread said.

| Thread | Branch / where | State | Last verified evidence |
|---|---|---|---|
| Live site | Pages `67b63b36` (music bed; previous `70ac5b5c`) | live | 2026-11-21: deployed on Mark's go; live `home/main.js` byte-identical to branch, `audio/music-bed-v1.mp3` 200 (1.3 MB), cage/arm manifests 360 frames; Playwright desktop + phone 0 page errors (only failure: the browser aborting the showreel video range request, file is 200) |
| B Ch04 three beats | `claude/jg044-ch04-beats` (worktree `../jg044-ch04-beats`) | started 2026-11-21 | — |
| C Ch04 thin console | `claude/jg044-ch04-console` (worktree `../jg044-ch04-console`) | built, waiting to merge after B | 2026-11-21 checked: commits `12ab0d8e` + `6c9eacd6` touch only `proto/merged/console.{js,css}` (779 + 139 lines); `result.txt` 28/28 checks, 0 page errors in all 8 cases (one expected 404: pump/receiver manifests); 49 PNGs `.scratch/ch04/c-console/`; no banned names in console.js. Notes for merge: overlay z-index 30 covers sound/toolbar buttons; console stops Esc propagation while open |
| D P3 render quote | this local session | pilots done; full-run quote waiting on Mark's go | 2026-11-21 Modal 4-CPU, Blender 5.3.0, 1536 px / 64 samples, own materials: pump `ap-7EgkIJnDYAu1PDsNWyJVvJ` 2/2 frames 15.7 container-s $0.0011; receiver 2/2 frames 16.4 container-s $0.0012; about 5 s/frame. Frames `.scratch/ch04/run-p3-pilot-{pump,receiver}/`. Quote 360-frame turn (`--preset p3-turn --timeout 600`): measured basis $0.14 per model, launcher estimate $0.28, ceiling $0.51 per model; hero stills not quoted (alternate finishes need p0_preview flags) |
| E OpenMotion trial | Mark's machine, session in `C:/Projects/openmotion` | not started | — |
| F Astra packet | after B + C merge | not started | — |
| G worktree consolidation | this session + integration thread (worktree `../integration-tw-film`, branch `integration/tw-film-2026-11-21`, not pushed) | step 1 done except the integration branch (running) | 2026-11-21: `codex/jg041-b4-retirement` WIP commit `ff3aefb3` pushed, `feat/metrology-models` already on origin (`3c3ced05`, upstream now set); 6 contained worktrees removed (advisor, tear-feedback, concept-3-verdict, concepts-merge, prototype-approval, spin-shot-review) after copying their untracked docs + `.scratch/` (325 files) to main checkout `.archive/worktrees-2026-11-21/`; branches kept. origin/main also carries an older proto/merged/ (from #8/#9), resolve at Gate 3 |

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

- Go: music bed deploy (done, `67b63b36`), D 2-frame Modal pilots (cap $0.10 per GLB), G step 1 git actions.
- Dives 01-02 land on their current three.js / GSAP / R3F breakdowns (the existing project pages' rigs), not a showreel passage.
- Later, Mark brings direction: a better music track, the Chapter 03 M249 drawing treatment + sources, the film direction.
