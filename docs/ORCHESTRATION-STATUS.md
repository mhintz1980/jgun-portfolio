# JG-044 orchestration status

Coordinator branch `claude/homepage-prototype-gate-2-be5a82`. Prompt:
`docs/PROMPT-orchestration-2026-11-20.md`. Update this table whenever a thread reports; the
evidence column records what the coordinator checked, not what the thread said.

| Thread | Branch / where | State | Last verified evidence |
|---|---|---|---|
| Live site | Pages `67b63b36` (music bed; previous `70ac5b5c`) | live | 2026-11-21: deployed on Mark's go; live `home/main.js` byte-identical to branch, `audio/music-bed-v1.mp3` 200 (1.3 MB), cage/arm manifests 360 frames; Playwright desktop + phone 0 page errors (only failure: the browser aborting the showreel video range request, file is 200) |
| B Ch04 three beats | `claude/jg044-ch04-beats` (worktree `../jg044-ch04-beats`) | started 2026-11-21 | — |
| C Ch04 thin console | `claude/jg044-ch04-console` (worktree `../jg044-ch04-console`) | started 2026-11-21 | — |
| D P3 render quote | this local session | Mark's go 2026-11-21 for the 2-frame pilots, cap $0.10 per GLB | — |
| E OpenMotion trial | Mark's machine, session in `C:/Projects/openmotion` | not started | — |
| F Astra packet | after B + C merge | not started | — |
| G worktree consolidation | fresh local session | waiting on Mark's ok for the git actions | 2026-11-21 `git worktree list` matches the 2026-11-20 survey; origin/main gained PR #8/#9 (`44e336cc`, `4b3a6147`), not in gate-2; origin/main also carries an older proto/merged/ (from #8/#9), resolve at Gate 3 |

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
