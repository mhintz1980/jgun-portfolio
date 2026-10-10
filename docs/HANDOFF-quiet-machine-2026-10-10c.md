# HANDOFF (c): QM0-QM4 landed, GPU-1 next (Quiet Machine integration), 2026-10-10

Paste the block under "Prompt" into a fresh session with cwd `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`. Everything else in this file is what that session reads next.

## Line one (owner skim)
| Item | Value |
|---|---|
| Landed | **QM0-QM4** on `quiet-machine/integration`, HEAD `ccc87c2f`, nothing pushed. QM4 is "shell v1 complete": `/quiet-machine/` is a second HTML entry, `/?study=rl300` redirects to it |
| Spend so far | **945k metered tokens**, 8 spawns (table below), plus unmetered orchestration. Plan total estimate 4.6-5.3M; at QM4 the plan priced about 1.0-1.2M |
| Next | **GPU-1** (needs an explicit owner go), then QM5. GPU-1 must pass before QM5 starts |
| GPU window | JG-035 session (owner relayed 2026-10-10): GPU released, no research processes; **4173 = production preview, 5199 = dev preview**, both stopped then. Re-confirm before GPU-1; ask again before every later run unless the owner says it persists |
| Owner decisions pending | GPU-1 go; Q2 merge target, Q3 Astra/fade scope, Q4, Q5-Q6, Q8 (plan defaults stand); the owner-visible copy and header items listed below |
| Running now | A dev server on port **5199** (preview tool `dev`, started from this session's Browser pane for the owner's review). It dies with that session; if it is still up, GPU-1's dev smoke needs it stopped (`preview_stop`, or the pane closed) |

## Where things stand
| Item | State |
|---|---|
| Branch / worktree | `quiet-machine/integration`, `jgun-quiet-machine`. Base worktree `C:/Users/Markimus/.buzz/REPOS/jgun-qm-base` (detached `666cbf23`, has `node_modules` and the base build); U.4 outputs in `C:/Users/Markimus/.buzz/REPOS/qm-u4/` (`base`, `QM0`..`QM4`, `QM*-verify`, mutation copies). Scratch only, never committed; keep `base` until QM10, remove `jgun-qm-base` after GPU-1 |
| Plan | `project/work/plans/JG-033-quiet-machine-integration.md` (14 commit specs, gate block B, GPU-run protocol E at lines 671-728). Structure: `docs/quiet-machine-integration-structure-2026-10-10.md`. Skill shortlist: `docs/quiet-machine-skill-shortlist-2026-10-10.md` |
| Evidence | `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md` holds `## QM0`..`## QM4` (gate tails, mutations, U.4 JSON, post-commit U.1/U.2). Run files 31-38 do not exist yet |
| Commits | `0c0edc1f` QM0 docs; `837139e6` QM1 registry + boundary + U.4 script; `acf6b122` QM2 fade runtime + PageNav; `1c78b2e7` QM3 reduced motion = poster; `ccc87c2f` QM4 multi-page build + entry + redirect + nav |
| Tree | Clean apart from three empty untracked strays in the repo root (`2`, `key`, `document.querySelector('.qm-poster`). Not ours: never read, stage, move or delete. Always stage by explicit path |
| Docs commit | This file is uncommitted. Step 0 of the prompt commits it |
| Baseline test flake | `npm test` sometimes times out (5000 ms) in `src/scene/inspection/shaft/camera.test.ts`, `handwriting.test.ts`, `portalGeometry.test.ts` under load. Files QM never touches. A re-run is green (46 files, 610 tests at QM4) |

## What QM4 did (so you do not re-derive it)
- `vite.config.ts`: `appType: 'mpa'`, `build.rollupOptions.input` derived from `PAGES` (Vite is **7.3.6**; the vite.dev docs now document Vite 8 `rolldownOptions`: do not rename).
- `quiet-machine/index.html` (shell fade block, hash pinned by `pageTopology.test.ts` `FADE_BLOCK_SHA256 = 0748289c…2561`, CRLF-normalised), `src/quiet-machine-main.tsx`, `index.html` redirect block (one hunk between `shell:begin`/`shell:end`, U.2 expects `hunks=1`).
- Absorbed review follow-ups: stuck-at-`out` recovery and hash-only skip in `pageFade.ts` (F-A), getter-trap import test (F-D), baseURI test (F-E), `dynamicEntries` info in `scripts/check-qm-jgun-assets.mjs` (QM1 F2).
- **Chunk partition (Opus ruled ACCEPT, no `manualChunks`):** JGUN's entry went from one 1120 kB chunk to `jgun-*` + shared `index-*` (react) + shared `BufferGeometryUtils-*` (three core); static source set identical (43 = 43); chunks 1 to 3, requests 3 to 5 (both extra are `modulepreload`); gzip total 329.4 kB vs 330.6 kB. QM static closure has no three/R3F/`src/state`.
- `mpa` removes the SPA fallback: `/quiet-machine` (no slash), `/m249/` and unknown paths 404 in vite dev/preview. Cloudflare Pages normally redirects the no-slash form (unverified). Goes in QM11 deployment docs.

## Next: GPU-1 (do not start without the owner's explicit go)
Spec: plan lines 671-728 (steps part 0 asset parity, part 1 base, part 2 QM4; stop-0 capture and compare). One Sonnet/high `tier-worker` GPU seat owns the run and its servers; estimate 150-250k tokens. Ports: 4173 for `vite preview`, 5199 for the dev smoke (the plan's list was 4173/4174/5203/5205; 5199 was granted explicitly by the owner).
- Rebuild (`npm run build`) and **restart the preview after every rebuild** (stale server + rotated hashes = canvas never mounts).
- **Pass rule (Opus-confirmed):** `diff.fraction <= max(0.01, 2 x noise.fraction)`, plus three guards: both arms show no `.qm-poster`, no `data-fade`, and `__quietMachine.ready`; the base capture is not blank (>5% of pixels differ from flat `#101b24`); `noise.fraction > 0.01` makes the run INVALID, not a wider limit. Record `meanChannelDelta`.
- Also screenshot the QM header at 390x844 (it is unstyled; estimated to wrap).
- First real run of `verify-jg033-preview.mjs` and `verify-jg033-ribbon-clipping.mjs` (both only `node --check`ed so far; the QM3 `reducedMotionPoster` and `contextLoss` blocks are unproven until now).
- A failure is fixed by a `QM4-fix` commit (plan section B step 8) and GPU-1 re-runs before QM5.
- Write `project/work/evidence/rl300-quiet-machine/31-gpu-1-qm-entry-smoke.md` and `31-gpu-1/`; commit with the next commit (QM5), staged by path.

## Carried follow-ups (owners are the named commits)
| When | Item |
|---|---|
| QM5 | `.shell-nav*` styles (header nav is an unstyled vertical list; at 390 px about 425 px needed vs 346 available). Plan line 402 owns it |
| QM5 or GPU-2 | Restore normal-motion resize + camera-finite coverage in `verify-jg033-preview.mjs` (dropped by the QM3 spec; optional) |
| QM6 | `transitionend` to `animationend` in `pageFade.ts` (the cover is a keyframe animation; the 450 ms fallback is the real navigation trigger); fix the `fadeNavigate` docstring and the `transitionend`-first tests |
| QM6 | Add a ref-update test for the `webglcontextlost` handler in `QuietMachinePreview` (survived mutation) |
| QM6 | Reduced-motion flag leak: inline fade script has no reduced-motion check, so after QM to `/` a return within 5 s shows the cover under reduced motion. Fix changes the reviewed `FADE_BLOCK_SHA256` (deliberate, reviewed act) |
| QM6 | `appType` check in `pageTopology.test.ts` is a text regex; import the config and assert `appType === 'mpa'` and input keys equal `PAGES` |
| Next touch of `check-qm-jgun-assets.mjs` | `dynamicEntries[].srcEqual` is tautological (replace with own-chunk source-set equality or delete); report an unmatched `baseKey` instead of skipping |
| QM10 | The `.qm-poster img` `src.includes('intake')` assertion breaks when posters are renamed to `rl300-shot-0N-poster.png` and `rl300-intake-preview.png` is deleted; QM10's spec must update it |
| QM11 | Docs: no-slash 404 vs Cloudflare redirect; U.4 caveat (the QM preview is a dynamic chunk, `cssEqual` only proves no Tailwind leak and an unchanged JGUN entry) |
| Cutover (torque track) | Remove the dead `?study=rl300` branch in `src/App.tsx` (untouched; do-not-touch until then) |
| Not required | Rule 1 regex does not match `dvh`/`svh`/`pageYOffset`/`clientHeight` (spec regex is binding) |

## Owner-visible facts (look decisions are the owner's)
- **QM header (unstyled until QM5):** brand link to `/`, then `TORQUE GUN`, `THE QUIET MACHINE` (current page, still a link), plain text `M249, in preparation`, then `RL300 / SECTION STUDY`.
- **Placeholders (shown at GPU-2):** title `The Quiet Machine · RL300 Section Study`; description `A scroll-driven section study of the RL300 acoustic enclosure: air path, heat and sound.` (also og/twitter); canonical/`og:url` `https://studiomark.dev/quiet-machine/`; `og:image` the root page's. PAGES long names (`JGUN Pneumatic Torque Gun`, `The Quiet Machine: RL300`, `M249 (in preparation)`) are placeholders too.
- Reduced-motion visitors to `/?study=rl300` now land on the QM poster, not JGUN's poster. Under reduced motion every nav link carries `?quality=poster`.
- A reviewer's slow-navigation trade-off: if the next page commits after 5.45 s the cover drops instantly and there is no fade-in.

## Spawn ledger (metered, from completion notices)
| # | Work | Seat | Effort | Tokens | Tool calls | Time |
|---|---|---|---|---|---|---|
| 1 | QM0 build | tier-worker, Haiku 5.5 | high | 35,839 | 16 | 70 s |
| 2 | QM1 build | tier-worker, Sonnet 5.5 | high | 130,416 | 71 | 23.1 min |
| 3 | QM1 review | tier-worker, Opus 5.5 | medium | 82,159 | 26 | 4.4 min |
| 4 | QM2 build | tier-worker, Sonnet 5.5 | high | 130,899 | 66 | 16.7 min |
| 5 | QM2 review | tier-worker, Opus 5.5 | medium | 94,773 | 41 | 8.6 min |
| 6 | QM3 build | tier-worker, Sonnet 5.5 | high | 67,074 | 41 | 5.6 min |
| 7 | QM4 build | tier-worker, Sonnet 5.5 | high | 263,062 | 110 | 28.4 min |
| 8 | QM4 review | tier-worker, Opus 5.5 | medium | 141,273 | 60 | 14.3 min |
| | **Metered total** | | | **945,495** | | |
Advisor calls (QM0 review, QM3 review) are not metered by the tool. Orchestration (pre-flights, gate re-runs, specs) is not metered. A late duplicate completion notice put the QM4 build at 263,623; the total above uses the first figure. Fold this table into the evidence `README.md` at QM11 (do not commit it earlier: U.1 allowlist).

## Method that worked (reuse it for QM5 onward)
1. **Spec = plan section B + the commit's section D, read by line range**, plus overrides. Give sub-agents skills by absolute path from the shortlist (they have no Skill tool). Opus reviews run `adversarial-code-review` as a `tier-worker` told "no edits".
2. **Gates in a file (unlazy).** Orchestrator writes `GATES.md` (a checkbox + `CHECK:` + `EXPECT:` + `EVIDENCE: pending` per gate) and a `qm<N>-verify.sh` verifier in the session scratchpad; `gate-check.mjs` runs them (`node C:/Projects/skills-master/local/unlazy/scripts/gate-check.mjs <GATES.md> --timeout 1200`). `gate-check` spawns a `cmd.exe` shell, so each CHECK is `"C:/Program Files/Git/bin/bash.exe" "<verify.sh>" <gate>`. The verifier prints a single `<TOKEN>_OK`. Gates used: staged set == exact path list; no unstaged; B.1-B.4 (B.2 with one retry for the flake); U.1; U.2; U.4 (fresh build to `$U4/QMn-verify`, compare without `--append`); mutations counted by literal `RED: yes` / `GREEN-AFTER: yes` lines inside the `## QMn` section; no-consumer/boundary greps; evidence heading present; `package*.json` untouched.
3. **Worker stops before committing.** It edits, stages by explicit path, runs gates and mutations, appends the evidence section. The orchestrator re-runs the gate file on a reset copy (`sed` boxes back to `[ ]`), verifies the diff itself, sends it to the Opus review (or the advisor for non-critical commits), then commits and runs the post-commit U.1/U.2 script, appends it to the evidence file, stages that path and `git commit --amend --no-edit`. (The plan text has the implementer commit; this deviation was reported to the owner and accepted by silence on QM1-QM4. Say so again if you keep it.)
4. **Commit trailer:** `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (matches every prior commit on the branch). Message form `JG-033 QMn: <summary>`.
5. **Review cap:** two rounds per piece, then stop and bring the owner the findings. No piece has needed a second round yet.

## Traps hit this session
- **The rtk hook rewrites `git diff`, `git log`, `grep` output in the Bash tool** (summaries, wrong counts). For anything you report as evidence, use `rtk proxy <cmd>` or a script file run with `"/c/Program Files/Git/bin/bash.exe" <file>`. Create scripts with the Write tool: heredocs eat backslashes (the U.1 regex).
- **`python3` here hangs** (store stub). Use `node` for scratch scripts.
- **Reviewer scratch `node_modules` junctions:** `rm -rf` can follow a junction and empty the repo's `node_modules`. Delete with `powershell -NoProfile -Command "[System.IO.Directory]::Delete('<path>\node_modules')"`. Verify `ls node_modules | wc -l` (154 entries) after.
- **Worker "stopped with background work" notices** can arrive twice for one spawn; check `git status` and ports before trusting a quiet tree.
- **Closing the Browser pane stops the preview server** started through `preview_start`. The `dev` config in `.claude/launch.json` is port 5199.
- Do not read the graph/skill libraries wholesale; one SKILL.md per need.
- Owner reads little: costs and decisions in line one, with the model named. Visual rulings by PNG, not description. No push, PR or deploy. Visual effects need Astra (`gpt-6-astra`, codex surface) before "done". Torque wrench page untouched until the cutover the torque track owns.

## Do not relitigate (handoff §2 of `docs/HANDOFF-quiet-machine-2026-10-10.md`, FINAL)
Own page and own scroll per product; hard navigation with a fade through dark (fade needs Astra approval); QM at `/quiet-machine/`; M249 slot reserved only, offline until JG-037; ~500k triangle target with device-named p95; one intake hotspot; the scroll-axis pin work is withdrawn.

## Prompt
```
Read docs/HANDOFF-quiet-machine-2026-10-10c.md, then project/work/plans/JG-033-quiet-machine-integration.md sections A, B, "QM5" and section E (GPU-run protocol, lines 671-728), and docs/quiet-machine-skill-shortlist-2026-10-10.md. Do not resume from chat memory.

Use /claude-tiers (you are the orchestrator; Opus approves plans and reviews critical work; the advisor tool counts as the Opus gate). Load pickup (C:/Projects/skills-master/vendor/caneff-agent-skills/pickup/SKILL.md) and unlazy (C:/Projects/skills-master/local/unlazy/SKILL.md) now. Give sub-agents skills by path from the shortlist, one SKILL.md per need; they have no Skill tool. Use the "Method that worked" section of the handoff.

Step 0: if `git status --short` shows docs/HANDOFF-quiet-machine-2026-10-10c.md as untracked or modified, commit exactly that path by explicit path as one docs commit ("docs: QM4 landed handoff (c)"). My pasting this prompt is the go for that commit. Stage nothing else; three stray untracked files exist.

Task: (1) Tell me, in one message, the GPU-1 plan and cost and ask me for the go and to confirm the JG-035 session's GPU release and ports 4173/5199 still hold. Do not start the GPU seat, a preview server or a rebuild for GPU-1 until I say go. (2) After GPU-1 passes, run QM5 with the same build, review and commit method. Report costs and decisions first, with the model named.

Constraints: torque wrench page untouched; no push/PR/deploy; stage by explicit path; keep the token ledger per spawn; Q1 is ruled (a), Q2-Q8 use the plan's defaults; one GPU, one seat.
```
