# JG-033 continuation: Quiet Machine integration and page shell, PLAN (phase 5), 2026-10-10

Status: plan approved by the owner 2026-10-09 (Opus review APPROVE, two rounds). Owner rulings recorded here the moment given: **Q1 = option (a)** (stay on `quiet-machine/integration`, QM1-QM4 = "shell v1"); lane worktree name `jgun-qm-lane-<QMn>` approved. No source, test, TODO.md or INDEX.md changed. Implementation (QM0 onward) starts only on the owner's explicit go.
This is a continuation of JG-033 (the Quiet Machine is JG-033's product), filed next to [`JG-033-rl300-quiet-machine.md`](JG-033-rl300-quiet-machine.md), in the same way as `JG-035-owner-animation-revisions.md`. M249 is JG-037; JG-036 owns the JGUN hotspot roster.
Registration in `TODO.md` and `project/work/INDEX.md` is **deferred to QM11** (owner Q8 default). This file is not linked from either until then.
Implements, without redesigning, the committed structure [`docs/quiet-machine-integration-structure-2026-10-10.md`](../../../docs/quiet-machine-integration-structure-2026-10-10.md) (rev 2, `d826cd38`). Precedence: [handoff](../../../docs/HANDOFF-quiet-machine-2026-10-10.md) §2 (FINAL) > structure > [design](../../../docs/quiet-machine-integration-design-2026-10-09.md) §1-3, §5-10 > [owner notes](../../../docs/owner-notes-marksList-2026-10-10.md), evidence 29/30.
The scroll-axis pin work (3120vh baseline, gates G4.1-G4.4) is WITHDRAWN (design §10) and does not apply anywhere in this plan.

## A. Top block (owner skim)
| Item | Value |
|---|---|
| **Cost** | about **4.6-5.3M tokens** (not measured; sum of the lines here): Sonnet 4.x builds about 2.2M, Opus first-round reviews about 0.6M, Haiku about 0.2M, GPU seat (Sonnet) about 0.9-1.2M (GPU-1 has two parts, QM6 mutations need rebuilds, GPU-2 and GPU-8 are capture-heavy), orchestrator about 0.4-0.6M (14 hand-backs plus 8 GPU grants), advisor calls and second review rounds about 0.3-0.5M. About 0.3M less if QM9b does not land. Calibration from the planning session: one Opus tier-reader review of this plan cost about 154k and the plan-authoring spawn about 226k, so the 100-120k Opus review estimates per commit may be low. This is above the structure's 2.8-3.3M, which priced builds, reviews and 8 GPU-seat sessions but not Haiku, orchestration, advisor or second rounds. The structure's 2.8M is exactly 11x200k Sonnet + 6x100k Opus, so its 8 GPU sessions were priced at about 0-0.5M; this plan re-prices them to 0.9-1.2M (about +0.4-1.2M of the jump), the rest being Haiku, orchestration, advisor and second rounds (about 0.9-1.3M) |
| **GPU runs** | **8** (GPU-1 to GPU-8). Each needs the JG-035 session to release the GPU and one port. The first is **GPU-1, right after QM4** |
| **Astra** | **1 call**, `gpt-6-astra`, MEDIUM, codex surface, at GPU-8. A second call (the full JGUN to QM fade) is at cutover and needs your consent (Q3) |
| Commits | **14** (plus any `QMn-fix` commits after a failed GPU run): QM0-QM11 plus QM7b, plus QM9b (conditional). Haiku/high: QM0, QM10, QM11. Sonnet/high: QM1-QM9, QM7b, QM9b. Opus/medium reviews: QM1, QM2, QM4, QM6, QM9, QM9b |
| Torque wrench page | No torque source touched (gates U.1-U.3 at every commit). Its fetched CSS and JS module set are proved unchanged by gate U.4 at every code commit, and at runtime by GPU-1 |

**Owner decisions and when they block**
| When | Decision | Blocks |
|---|---|---|
| Now | Approve this plan | the commit of this file, then QM0 |
| Before QM1 | **Q1 branch hygiene: RULED (a) by the owner 2026-10-09**, Q5 deep-link default | QM1 |
| Before GPU-1 (after QM4) | **Q7 GPU window**: who asks the JG-035 session, and when | GPU-1, and every later GPU run |
| Before QM7b | Q6 shot extensibility (default: keep `SHOTS` as is) | QM7b's shot edits only (QM5 does not touch `SHOTS`) |
| After GPU-2 and GPU-4 | **Group A** (QM content and length) and **group B** (2a panel), ruled by looking | QM7b, QM9b (group B Blender branch) |
| Before GPU-6 | Desktop GPU model and phone model | GPU-6 (no p95 without a named device) |
| After GPU-6 | Triangle acceptance (handoff §2.5) | GPU-7 |
| After GPU-7 | The 7 posters | QM10 |
| Before GPU-8 | Q3 Astra scope for the fade | GPU-8 packet contents |
| After GPU-8 | **Group E** (final frames and a live run) | publication, which also waits for JG-037 (handoff §2.4) |
| At QM11 | Q8 TODO/INDEX, Q2 merge target | QM11, and any merge |
| Any time | Q4 fade receiver on `/` (default: no) | nothing, unless you answer yes |

**What you will be shown (PNG first; MP4 only where motion is the question)**
| Stop | Files (under `project/work/evidence/rl300-quiet-machine/`) |
|---|---|
| GPU-1 | nothing to rule on. Evidence only: a QM stop-0 pixel diff and the JGUN `--quick` before/after |
| GPU-2 (group A, B) | `32-gpu-2/` section holds `u34-*.png`, `u51-*.png`; `sheet-1440x900.png`, `sheet-390x844.png` (7 shots each); `intake-closeup.png`; `reservoir-1019-vs-1020.png`; `chevrons.png`; `panel-2a-current.png`; `forward-reverse.mp4`; `forward-at-proposed-length.mp4` |
| GPU-3 (group D, QM half) | `33-gpu-3/` `qm-to-root-fade.mp4`, `arrival-into-qm.mp4`, `back-to-qm.mp4`, `reduced-motion-cut.mp4`, plus the first, middle and last frame of each as PNG |
| GPU-4 | `34-gpu-4/` `hotspot-rest-<viewport>.png`, `hotspot-open-<viewport>.png` (3 viewports) |
| GPU-6 | perf table (p50/p95, named devices) in `36-gpu-6-perf.md` |
| GPU-7 | the 7 posters `public/images/rl300-shot-01-poster.png` to `-07-` |
| GPU-8 | Astra packet, then **group E**: `38-gpu-8/` full-size exterior, section, thermal and acoustic frames, plus a live forward/reverse run |

## B. Shared gate block (every implementer spec pastes this block plus one commit section)
Run every command in Git Bash from the worktree root `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`. The fenced gate blocks below contain single quotes, so they **cannot** be wrapped in `bash.exe -lc '…'`. Run each block from a seat whose shell tool is already Git Bash, or save it to a scratch `.sh` file outside the repo and run `& 'C:\Program Files\Git\bin\bash.exe' <file>` from PowerShell. Never call a bare `bash` from PowerShell (it can resolve to WSL).
Every gate is a fenced block with the literal base SHA `666cbf23` and literal paths: shell variables do not persist between tool calls, so no gate relies on a variable set earlier. If Q1 changes the base, replace `666cbf23` everywhere in this plan. Any other block in this plan that uses `$BASE` or `$U4` starts with `BASE=666cbf23; U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; : "${BASE:?}" "${U4:?}"`. Commands are never put in markdown table cells when they contain a pipe.

| Gate | Command | Expected |
|---|---|---|
| B.1 | `npm run typecheck` | exit 0 |
| B.2 | `npm test` | exit 0, and the summary has no `failed` |
| B.3 | `npm run build` | exit 0 |
| B.4 = U.3 | `npm run check:station2` | exit 0; `scripts/check-station2-contract.mjs` unedited |
| U.1 (pre-commit) | block U.1-pre below | the diff list is non-empty, grep prints nothing, last line `U.1 grep exit: 1` |
| U.1 (post-commit) | block U.1-post below | same |
| U.2 | block U.2 below | before QM4: `hunks=0 removed=0 first= last=`; from QM4 on: `hunks=1 removed=0 first=<!-- shell:begin --> last=<!-- shell:end -->` |
| U.4 | block U.4 below, with `QMN` set to the commit id | exit 0; the manifest exists; the compare prints `cssEqual: true`, `sourcesEqual: true` |

Block U.1-pre (a failed or empty `git diff` exits 2, so an error can never read as "no output"):
```bash
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
files=$(git diff --cached --name-only 666cbf23) || { echo "U.1 FAIL: git diff errored"; exit 2; }
test -n "$files" || { echo "U.1 FAIL: empty diff list (wrong base or nothing staged)"; exit 2; }
printf '%s\n' "$files" | grep -v -E '^(src/shared/|src/scene/rl300/|src/quiet-machine-main\.tsx$|quiet-machine/|index\.html$|vite\.config\.ts$|scripts/(verify-jg033-preview|verify-jg033-ribbon-clipping|verify-page-transition|verify-qm-intake-hotspot|measure-qm-render-passes|check-qm-jgun-assets)\.mjs$|public/images/rl300-|public/models/rl300-|docs/|project/|TODO\.md$)'
echo "U.1 grep exit: $?"
```
Block U.1-post: identical, except the second line is `files=$(git diff --name-only 666cbf23 HEAD) || { echo "U.1 FAIL: git diff errored"; exit 2; }`.

Block U.2:
```bash
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
git rev-parse --verify 666cbf23 >/dev/null || { echo "U.2 FAIL: base not found"; exit 2; }
out=$(git diff -U0 666cbf23 HEAD -- index.html) || { echo "U.2 FAIL: git diff errored"; exit 2; }
printf '%s\n' "$out" | awk '/^@@/{h++;b=1} b&&/^-/{d++} /^\+[^+]/{s=$0; sub(/^\+[ \t]*/,"",s); sub(/[ \t\r]*$/,"",s); if(!n++){f=s}; l=s} END{printf "hunks=%d removed=%d first=%s last=%s\n",h,d,f,l}'
```

Block U.4 (code commits; set `QMN` on the first line):
```bash
QMN=QMn; U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; : "${QMN:?}" "${U4:?}"
[ "$QMN" = QMn ] && { echo "U.4 FAIL: set QMN to the commit id"; exit 2; }
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
test -f node_modules/vite/package.json || { echo "U.4 FAIL: no node_modules; run the QM1 pre-flight npm ci"; exit 2; }
test -f "$U4/base/.vite/manifest.json" || { echo "U.4 FAIL: no base build"; exit 2; }
npx vite build --sourcemap --manifest --emptyOutDir --outDir "$U4/$QMN" || exit 2
test -f "$U4/$QMN/.vite/manifest.json" || { echo "U.4 FAIL: no manifest"; exit 2; }
node scripts/check-qm-jgun-assets.mjs "$U4/base" "$U4/$QMN" --base-root /c/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root . --append project/work/evidence/rl300-quiet-machine/qm-commit-gates.md --label "$QMN"
```

**`grep -c` rule.** When a gate expects `0`, grep prints `0` and **exits 1**. That is a pass. Never chain such a gate with `&&`.

**Commit protocol (every commit; the orchestrator checks each step).**
1. Edit only the files in the commit's list.
2. Stage **by explicit path** only. Never `git add -A`, `git add .` or `git commit -a`: the worktree has 3 untracked stray files (`2`, `key`, `document.querySelector('.qm-poster`) that are not ours. Do not read, move or delete them.
3. Run B, then the U.4 build and compare (code commits), then U.1 pre-commit.
4. Mutations: with the good version staged, edit the working tree, run the named test, copy the red lines, then `git restore <file>` (restores from the index) and re-run it green.
5. Append the commit's section to `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md`: gate outputs (tails), each mutation with its red output, and the U.4 summary. Stage it. (Parallel-lane commits, section F, do not touch this file; they write a side file instead.)
6. `git commit -m "JG-033 QMn: <summary>"`. The harness adds the attribution trailer; do not hand-write one.
7. Run the post-commit U.1 and U.2, append their output to the same section, `git add` that file, `git commit --amend --no-edit`.
8. A GPU run named in a commit's gate does not block the commit. The commit lands on its static gates, and the run's result is recorded against that commit's SHA in the run's file (31-38). **The next dependent commit does not start until that run passes.** Each run file is committed with the next commit in sequence, staged by path.
   **Fix commit type `QMn-fix`** (a commit TYPE, not a new plan row; the plan-row count is 14 with QM9b and 13 without, plus the plan's own docs commit; `QMn-fix` commits are additional). When a GPU run fails after `QMn` has landed: the same seat and the same Opus review rule as `QMn` author one fix commit, message `JG-033 QMn-fix: <summary>`. Its file list is a subset of `QMn`'s list (anything else stops for the orchestrator and, if outside U.1, the owner). It runs every gate and mutation of `QMn` plus this protocol, and appends a `## QMn-fix` section to `qm-commit-gates.md` naming the failed run file (31-38) and the failure it fixes. The failed run's file records the failure against the `QMn` SHA; the re-run records the pass against the `QMn-fix` SHA. The next dependent commit waits for that re-run. A second failure goes to the orchestrator, not a second fix round without review.
9. Never `git stash` (the stash is shared across worktrees). Never push.

## C. File manifest (paths cited by this plan)
NEW = created by the named commit; M = modified; DEL = deleted. Unlisted paths cited elsewhere already exist.
| Act | Path | Commit |
|---|---|---|
| NEW | `src/shared/pages.ts`, `src/shared/pages.test.ts`, `src/shared/shellBoundary.test.ts` | QM1 |
| NEW | `scripts/check-qm-jgun-assets.mjs`, `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md` | QM1 |
| NEW | `src/shared/pageFade.ts`, `src/shared/pageFade.test.ts`, `src/shared/PageNav.tsx`, `src/shared/PageNav.test.tsx` | QM2 |
| NEW | `quiet-machine/index.html`, `src/quiet-machine-main.tsx`, `src/shared/pageTopology.test.ts` | QM4 |
| NEW | `scripts/verify-page-transition.mjs` | QM6 |
| NEW | `src/scene/rl300/IntakeHotspot.tsx`, `scripts/verify-qm-intake-hotspot.mjs` | QM7 |
| NEW | `scripts/measure-qm-render-passes.mjs` | QM8 |
| NEW (conditional) | `public/models/rl300-full.glb`, `public/models/rl300-section-proxies.glb` | QM9b |
| NEW | `public/images/rl300-shot-01-poster.png` (and `-02-` to `-07-`) | GPU-7, committed in QM10 |
| DEL | `public/images/rl300-exterior-preview.png`, `public/images/rl300-section-preview.png`, `public/images/rl300-intake-preview.png` | QM10 |
| NEW | `project/work/evidence/rl300-quiet-machine/31-gpu-1-qm-entry-smoke.md`, `32-gpu-2-group-a.md`, `33-gpu-3-page-transition.md`, `34-gpu-4-intake-hotspot.md`, `35-gpu-5-render-pass-attribution.md`, `36-gpu-6-perf.md`, `37-gpu-7-posters.md`, `38-gpu-8-astra-packet.md`; media folders (NEW, same directory) `31-gpu-1/`, `32-gpu-2/`, `33-gpu-3/`, `34-gpu-4/`, `35-gpu-5/`, `38-gpu-8/` | GPU-1 to GPU-8 |
| NEW (scratch, never committed) | `/c/Users/Markimus/.buzz/REPOS/jgun-qm-base` (detached worktree at `$BASE`), `/c/Users/Markimus/.buzz/REPOS/qm-u4` (U.4 build outputs) | QM1; removed after GPU-1 / QM10 |
| M | `src/scene/rl300/QuietMachinePreview.tsx`, `src/scene/rl300/quiet-machine.css`, `src/scene/rl300/preview.test.ts` | QM3-QM10 |
| M | `src/scene/rl300/QuietMachineScene.tsx`, `src/scene/rl300/SectionCaps.tsx`, `src/scene/rl300/AirRibbons.tsx`, `src/scene/rl300/prepareModel.ts`, `src/scene/rl300/shot.ts` | QM7b, QM9, QM9b |
| M | `vite.config.ts`, `index.html`, `scripts/verify-jg033-preview.mjs`, `scripts/verify-jg033-ribbon-clipping.mjs` | QM3, QM4, QM7b, QM9 (defect 11), QM9b, QM10 |
| M | `project/work/plans/JG-033-rl300-quiet-machine.md`, `project/work/plans/JG-032-station2-thermal-visualization.md` | QM0 (and QM11 for JG-033) |
| M | `project/context/deployment.md`, `project/context/project-brief-2026-09-29.md`, `TODO.md`, `project/work/INDEX.md`, `project/work/evidence/rl300-quiet-machine/README.md` | QM11 |

Does-not-touch (structure §1a, binding until the torque cutover): `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/components/Chapters.tsx`, `src/components/staticChapter.ts`, `src/components/StationNav.tsx`, `src/components/TechnicalHUD.tsx`, `src/state/scrollStore.ts`, `src/data/caseStudies.ts`, `src/scene/drawing/scrollTracks.ts`, `src/scene/drawing/introTimeline.ts`, `src/scene/ScrollRig.tsx`, `src/scene/scrollCommit.ts`, `src/scene/drawing/DrawingLinework.tsx`, `src/scene/SpatialWorld.tsx`, `src/scene/SceneCanvas.tsx`, everything under `src/scene/stages/`, `public/models/msp-enclosure.glb`, `scripts/check-station2-contract.mjs`, `scripts/verify-jg036-hotspot-layering.mjs`, `scripts/verify-jg032-station2-thermal.mjs`, `scripts/capture-rl300-baseline.mjs`, `package.json`, `public/_headers`, `public/404.html`, `.gitignore`.

## D. Commit specs
Each section is self-contained once section B is pasted above it. "Content anchor" means: find the quoted text with Grep, never by line number.

### QM0: factual plan-doc fixes (docs only)
| Field | Value |
|---|---|
| Goal | Record in the two plan docs that the pin is withdrawn, the pages are split, and JG-032 includes `d201ea8` |
| Seat | Haiku / high; review: advisor. Est. 60k |
| Depends on | this plan committed (its own docs commit, by the orchestrator after owner approval) |
| Blocked on | nothing |

Edits:
1. `project/work/plans/JG-033-rl300-quiet-machine.md`: append a new section `## Extension record 2026-10-10 (page split)` at the end of the file (after the `## Approval requested` section). Content, 6-10 lines, facts only:
   - QM moves to its own page `/quiet-machine/` (handoff §2.1-2.3).
   - The Milestone 3 "shared narrative-progress source" and the JGUN consumer corrections are moot: separate documents (design §5, "Chapter/HUD sync" row).
   - The JGUN scroll-axis pin is withdrawn (design §10). The plan's lines that start `**Scroll:** extend RL300 as needed` and `**Required extension record and JGUN correction recommendations:**` are superseded for JGUN by the torque track.
   - Link to this file and to the structure doc.
2. `project/work/plans/JG-032-station2-thermal-visualization.md`: front-matter line `commits: [477c9c3, 3edecce, 7f7a0c2, abae74c, 15dc719]` becomes `commits: [477c9c3, 3edecce, 7f7a0c2, abae74c, 15dc719, d201ea8]`. `status:` unchanged (not archived).

Gates: after the commit, `git diff --name-only HEAD~1 HEAD` prints exactly those 2 paths; U.1 (post-commit), U.2 (`hunks=0`), U.3. QM0's own gate output is recorded by QM1 (it creates `qm-commit-gates.md`), so QM0 has no amend step.
Mutation: none (docs).
Rollback: `git revert <QM0 sha>`.

### QM1: page registry, tier helpers, redirect table, boundary gate, U.4 base
| Field | Value |
|---|---|
| Goal | Land the zero-import page registry and the tests that keep `src/shared/**` free of scroll length and foreign imports; build the U.4 base reference |
| Seat | Sonnet / high; **Opus / medium review (critical: the public shell interface)**. Est. 250k + 100k |
| Depends on | QM0 |
| Blocked on | Q1 ruled (a) by the owner 2026-10-09; pre-flight only verifies the JG-035 tips have not moved. Q5 default confirmed (the redirect statuses encode it) |

Pre-flight: for both candidate JG-035 branches (structure Q1: `codex/jg033-signature-shot` and `codex/jg035-final-acceptance-2026-10-09`), run `git log --oneline -1 <branch>` and `git merge-base HEAD <branch>`. If either tip has moved past `eb550958`, stop and ask the owner (Q1 option (a) rebases before QM1). Record both outputs in the QM1 section.

Pre-flight 2 (dependencies; this worktree has no `node_modules`, so without it gate B and every U.4 build fail), before any QM1 edit:
```bash
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
npm ci || { echo "npm ci failed"; exit 2; }
git status --short -- package.json package-lock.json   # must print nothing: package.json is do-not-touch
npm run typecheck; echo "B.1 exit $?"; npm test; echo "B.2 exit $?"; npm run build; echo "B.3 exit $?"; npm run check:station2; echo "B.4 exit $?"
```
This is gate B on the UNMODIFIED tree (QM0 SHA). `qm-commit-gates.md` does not exist yet: keep the tails and write them into its `## QM1` section as `### Pre-flight: B on the unmodified tree` when QM1 creates the file. A red B here is a baseline fact to report to the orchestrator before any edit, not something QM1 fixes.

Edits:
1. NEW `src/shared/pages.ts`, zero imports. Exports exactly the structure §2 API: `PageId`, `TierParam`, `PageEntry`, `PAGES`, `pageHref`, `readTierParam`, `resolveEntryTier`, `RedirectStatus`, `LegacyRedirect`, `LEGACY_REDIRECTS`.
   - `PAGES` rows: `jgun` (index 1, path `/`, href `/`, htmlEntry `index.html`, reserved false, fadeIn false); `quiet-machine` (index 2, `/quiet-machine/`, `quiet-machine/index.html`, fadeIn true); `m249` (index 3, path `/m249/`, href null, htmlEntry null, reserved true, fadeIn false).
   - `label` is the nav text (`TORQUE GUN`, `THE QUIET MACHINE`, `M249`) and `name` is the long name. Both are owner copy, shown at GPU-2.
   - `pageHref(id, tier='full')`: null if reserved; `href` if `full`; otherwise `href + '?quality=' + tier`.
   - `readTierParam(search)`: `quality` param if it is one of the three tiers, else null.
   - `resolveEntryTier(search, reducedMotion)`: reduced motion gives `poster`; otherwise `readTierParam(search) ?? 'full'`.
   - `LEGACY_REDIRECTS`: `{param:'study',values:['rl300'],to:'quiet-machine',keepParams:true,status:'active'}`; `{param:'station',values:['2','enclosure','safe-enclosure'],to:'quiet-machine',keepParams:false,status:'cutover'}`; `{param:'chapter',values:['2'],to:'quiet-machine',keepParams:false,status:'cutover'}`; `{param:'station',values:['3','m249'],to:'m249',keepParams:false,status:'jg-037'}`; `{param:'chapter',values:['3'],to:'m249',keepParams:false,status:'jg-037'}`.
   - Class-name-looking words: none (Tailwind scans `src/`; see U.4).
2. NEW `src/shared/pages.test.ts`. Cases: ids unique; indexes unique and ascending; reserved iff `href===null` iff `htmlEntry===null`; `pageHref('quiet-machine','lite')==='/quiet-machine/?quality=lite'`; `pageHref('jgun')==='/'`; `pageHref('m249')===null`; `readTierParam` for valid, invalid and missing; the `resolveEntryTier` truth table (4 cases); exactly one `active` redirect row; every redirect `to` is a `PAGES` id; the statuses equal the Q5 default.
3. NEW `src/shared/shellBoundary.test.ts` (node env; `fs` plus `new URL('.', import.meta.url)`):
   - `stripComments(src)` removes `/* … */` and `//…` comments, but not `://` (D3).
   - Rule 1: every **non-test** file under `src/shared/` (skip `*.test.ts(x)`, which hold the regex text) has 0 matches for `/scrollHeight|scrollY|scrollTop|innerHeight|\d+\s*vh\b|lenis|ScrollTrigger/i` after stripping.
   - Rule 2: `src/shared/**` non-test imports are only `./*`, or `react` from `PageNav.tsx`.
   - Rule 3: `src/scene/rl300/**` imports are only `./*`, `../sectionRenderPass`, `../../shared/*`, or bare package specifiers. This holds at base: only `QuietMachineScene.tsx` reaches outside, via `../sectionRenderPass`.
   - Import regex covers `import … from`, `export … from`, side-effect `import '…'` and `import('…')`.
4. NEW `scripts/check-qm-jgun-assets.mjs`. CLI `node scripts/check-qm-jgun-assets.mjs <baseOut> <newOut> --base-root <dir> --new-root <dir> [--append <md>] [--label <QMn>]`:
   - Read `<out>/.vite/manifest.json`.
   - From key `index.html`, follow `imports` recursively (never `dynamicImports`) to get the static closure.
   - (a) sha256 of the stylesheet files named by `<link rel="stylesheet">` in `<out>/index.html`, concatenated in link order.
   - (b) the union of `sources` from each closure chunk's `.map`. Resolve each source against that map file's directory, then make it relative to that build's root (`--base-root` or `--new-root`), with forward slashes. Without this step the two worktrees' absolute locations differ and (b) is always red.
   - Print JSON `{cssHashBase, cssHashNew, cssEqual, sourcesEqual, sourcesAdded, sourcesRemoved, chunksBase, chunksNew, requestsBase, requestsNew}`. Exit 0 only if `cssEqual && sourcesEqual`.
   - `--append` writes a markdown summary under `### U.4 <label>`.
5. NEW `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md`: title, one line on its purpose, `## QM0` (QM0's gate output, re-run now: `git diff --name-only <QM0 sha>~1 <QM0 sha>` plus U.1-U.3 at the QM0 SHA), `## QM1`, and `### U.4 base summary`.

U.4 base (CPU only, once; keep it until GPU-1 ends):
```bash
BASE=666cbf23; U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; : "${BASE:?}" "${U4:?}"
git worktree add --detach /c/Users/Markimus/.buzz/REPOS/jgun-qm-base $BASE
cd /c/Users/Markimus/.buzz/REPOS/jgun-qm-base && npm ci && npx vite build --sourcemap --manifest --emptyOutDir --outDir /c/Users/Markimus/.buzz/REPOS/qm-u4/base
```
Null tests, both exit 0 (start each with the `BASE=…; U4=…` definitions line from section B):
- Self-check: `node scripts/check-qm-jgun-assets.mjs $U4/base $U4/base --base-root <base worktree> --new-root <base worktree>`.
- **Cross-worktree null test:** after writing `scripts/check-qm-jgun-assets.mjs`, before any `src/` edit, run the U.4 build of this tree to `$U4/QM0` and compare it against `$U4/base` with both roots. QM0 changed docs only, so a red result is a script bug (path normalisation), not a JGUN change.

Mutations (record red output):
| Mutation | Command | Red proof |
|---|---|---|
| add `const x = innerHeight` to `src/shared/pages.ts` | `npx vitest run src/shared/shellBoundary.test.ts` | Rule 1 fails, naming `pages.ts` |
| set the `m249` row to `reserved:false` (href stays null) | `npx vitest run src/shared/pages.test.ts` | the reserved/href invariant fails |
| add the comment `// bg-[#123456]` to `src/shared/pages.ts`, then the U.4 build to `$U4/QM1-mut` | U.4 compare | exit 1, `cssEqual: false` |
| copy `$U4/QM1` to `$U4/QM1-mut2`, add `"src/fake.ts"` to one closure `.map` `sources` | U.4 compare only (never the full U.4 block: it rebuilds with `--emptyOutDir` and would wipe the injected source): `node scripts/check-qm-jgun-assets.mjs "$U4/base" "$U4/QM1-mut2" --base-root /c/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root .` | exit 1, `sourcesEqual: false`, `sourcesAdded` lists it |

Gates: B; U.1 (pre and post); U.2 `hunks=0`; U.4 compare against base (exit 0).
Opus review: API matches structure §2 verbatim; boundary regexes; U.4 script reads `imports` only; base built at the right SHA (`git -C <base> rev-parse HEAD`).
Rollback: `git revert <QM1 sha>`; `git worktree remove /c/Users/Markimus/.buzz/REPOS/jgun-qm-base` only after GPU-1.

### QM2: fade runtime and generic nav (no consumer yet)
| Field | Value |
|---|---|
| Goal | Land `pageFade.ts` and `PageNav.tsx` with injected-env tests; nothing imports them yet |
| Seat | Sonnet / high; **Opus / medium review (fade lifecycle, bfcache)**. Est. 250k + 100k |
| Depends on | QM1 |
| Blocked on | nothing |

Edits:
1. NEW `src/shared/pageFade.ts`, zero imports. Constants and signatures exactly as structure §2 (`FADE_KEY='jg:fade'`, `FADE_MAX_AGE_MS=5000`, `FADE_OUT_MS=400`, `FADE_FALLBACK_MS=450`, `FADE_IN_MS=600`, `STATUS_DELAY_MS=800`, `HOLD_CAP_MS=2500`, `FadeEnv`, and the functions). Behaviour:
   - `defaultEnv()` binds `Date.now`, `sessionStorage`, `matchMedia('(prefers-reduced-motion: reduce)')`, `location.assign`, `setTimeout`, `requestAnimationFrame`. Guard `typeof window` so tests can import.
   - `shouldIntercept(e)`: `button===0` and no ctrl/meta/shift/alt and `!defaultPrevented`.
   - `isFreshFlag(raw, now)`: a finite number `t` with `0 <= now - t < FADE_MAX_AGE_MS`.
   - `fadeNavigate(href, env)`:
     - Reduced motion: `assign(href)` immediately, no flag.
     - Otherwise: set `document.documentElement` `data-fade="out"` (guard `document`), `storage.setItem(FADE_KEY, String(now()))`, then `assign(href)` once, on `transitionend` or after `schedule(…, FADE_FALLBACK_MS)`, whichever comes first.
   - `installPageFade(doc, env)`:
     - Delegated `click` on `doc` for the closest `a[data-fade]` with a same-origin href, gated by `shouldIntercept`; calls `preventDefault` then `fadeNavigate`.
     - `pageshow`: if `persisted`, remove `data-fade` from `documentElement` and remove `FADE_KEY`.
     - Returns an uninstall function.
   - `releaseFadeWhen(ready, env)`: poll with `env.frame` until `ready()`, or until `HOLD_CAP_MS` has passed since the call; then `releaseFade(env)`.
   - `releaseFade(env)`: if `data-fade="in"`, set `data-fade="release"` and remove the attribute after `FADE_IN_MS`.
   - `prefetchPage(doc, hrefs)`: append one `<link rel="prefetch">` per href, deduplicated.
2. NEW `src/shared/pageFade.test.ts` (node env; fake env and fake doc objects, no jsdom). Cases:
   - `shouldIntercept` matrix: primary passes; each modifier, middle button and `defaultPrevented` pass through.
   - `isFreshFlag`: fresh, stale, null, garbage.
   - `fadeNavigate`: reduced motion gives `assign` now and no `setItem`; normal gives `setItem` plus `assign` after the fallback fires.
   - `releaseFadeWhen`: a ready that never comes still releases at `HOLD_CAP_MS`.
   - `installPageFade`: dispatch a fake `pageshow` with `persisted:true` and expect the attribute and the key removed.
3. NEW `src/shared/PageNav.tsx`, imports only `react` and `./pages`.
   - `PageNav({current,tier,variant})` renders `<nav className="shell-nav shell-nav-header|shell-nav-endcard" aria-label="Pages">`, one `PageLink` per row, `aria-current="page"` on the current row.
   - `PageLink({id,tier,children})`: `<a data-fade="" href={pageHref(id,tier)}>`, or for a reserved row `<span className="shell-nav-reserved">{label}, in preparation</span>`.
   - Class names are `shell-*` only (never Tailwind-looking; U.4).
4. NEW `src/shared/PageNav.test.tsx`: `renderToStaticMarkup` (the pattern in `src/components/staticChapter.test.tsx`). Covers: link vs reserved vs current; `data-fade` present; tier carry (`tier='lite'` gives `href="/?quality=lite"`); the m249 text `in preparation` and no `<a` for it.

Mutations:
| Mutation | Command | Red proof |
|---|---|---|
| delete the `persisted` branch in the `pageshow` handler | `npx vitest run src/shared/pageFade.test.ts` | the pageshow case fails |
| drop the `ctrlKey/metaKey/shiftKey/altKey` checks in `shouldIntercept` | same | the pass-through cases fail |

Gates: B; U.1; U.2 `hunks=0`; U.4 (`cssEqual` matters here: Tailwind scans `PageNav.tsx`).
Opus review: fade state machine (out, flag, assign once; in, release; pageshow clear), cap behaviour, that `defaultEnv` never runs at import.
Rollback: `git revert <QM2 sha>`.

### QM3: reduced motion becomes poster
| Field | Value |
|---|---|
| Goal | Reduced-motion visitors get QM's poster path instead of manual WebGL (owner "posters throughout"), before QM4's redirect can send them to QM |
| Seat | Sonnet / high; review: advisor. Est. 150k |
| Depends on | nothing in `src/shared` (it may run in parallel with QM1/QM2, section F). It must land before QM4 |
| Blocked on | nothing |

Edits, `src/scene/rl300/QuietMachinePreview.tsx` (no `src/shared` import in this commit):
1. Add, above `export default function QuietMachinePreview`, a pure exported helper:
   `export function initialStudyMode(reducedMotion: boolean, search: string): { poster: boolean; u: number }`, returning `poster = reducedMotion || quality === 'poster'` and `u = clamp01(Number(shot ?? 0))`. There is no `.52` special case.
2. Anchor `const [poster, setPoster] = useState(params.get('quality') === 'poster')` becomes `useState(mode.poster)`. Anchor `useState(reduced ? .52 : clamp01(Number(params.get('shot') ?? 0)))` becomes `useState(mode.u)`. Define `const mode = initialStudyMode(reduced, location.search)` right after the `reduced` line.
3. Anchor `reduced ? 'MANUAL STUDY · REDUCED MOTION' : ` (in the `qm-status` expression): delete that branch. The poster path already shows `STATIC SECTION STUDY`.
4. Keep the `if (reduced) return` and `if (!reduced)` scroll guards: under reduced motion, scroll never drives the poster.

`src/scene/rl300/preview.test.ts` (a `.ts` file, so no JSX: use `createElement`):
- `initialStudyMode` table: `(true,'')` gives `{poster:true,u:0}`; `(true,'?shot=.5')` gives `u .5`; `(false,'?quality=poster')` gives poster; `(false,'')` gives no poster.
- Static markup: stub `globalThis.matchMedia = () => ({matches:true})` and `globalThis.location = {search:''}`, then `renderToStaticMarkup(createElement(QuietMachinePreview))`. Expect `qm-poster`, `STATIC SECTION STUDY`, and no `MANUAL STUDY`. Restore the globals in `afterEach`.

`scripts/verify-jg033-preview.mjs`: the reduced-motion block (from anchor `const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })` through the `await p.close()` after `report.checks.reducedMotionAndContextLoss`) is replaced by two blocks:
- **Reduced motion is poster** (`reducedMotion:'reduce'`, 390x844): goto stays `${base}/?study=rl300` (QM4 repoints it). Wait for `main.qm-preview[data-reduced-motion="true"] .qm-poster img` with `naturalWidth > 0` (QM-specific, so JGUN's `StaticPoster` cannot pass it). Then:
  - `canvas` count is 0 and the status text is `STATIC SECTION STUDY`;
  - after `mouse.wheel(0, 900)` the slider value is unchanged;
  - after clicking `Lower intake`, the poster `src` includes `intake`.
  - `report.checks.reducedMotionPoster`.
- **Context loss falls back to poster** (normal motion, 768x1024; it moves here because this check used to live only in the reduced-motion block): goto `${base}/?study=rl300&quality=full`, wait for `__quietMachine.ready`, dispatch `webglcontextlost`, wait for `.qm-poster img` with `naturalWidth > 0`. Record `report.checks.contextLoss`.

Note: this verifier case cannot pass at QM3's own tree. `src/App.tsx` (do-not-touch) still sends reduced-motion `/?study=rl300` visitors to JGUN's poster. Its first runtime proof is GPU-1, after QM4.

Mutation: in `initialStudyMode`, return `poster: quality === 'poster'` and `u: reducedMotion ? .52 : …`. Run `npx vitest run src/scene/rl300/preview.test.ts` and expect the table and the markup case to fail.
Gates: B; U.1; U.2 `hunks=0`; U.4; `npx vitest run src/scene/rl300/preview.test.ts` lists the new cases; `node --check scripts/verify-jg033-preview.mjs`.
Rollback: `git revert <QM3 sha>`.

### QM4: multi-page build, QM entry, legacy redirect, header nav, verifier repoints
| Field | Value |
|---|---|
| Goal | `/quiet-machine/` becomes a second HTML entry with the shell fade and `PageNav`; `/?study=rl300` redirects to it; verifiers follow |
| Seat | Sonnet / high; **Opus / medium review (build config, redirect, `appType`, entry, the U.4 chunk partition)**. Est. 300k + 120k |
| Depends on | QM2, QM3 |
| Blocked on | nothing to commit. **GPU-1 (Q7 grant) must pass before QM5 starts** |

Edits:
1. NEW `quiet-machine/index.html`. Copy the `<head>` order of `index.html`: charset, favicon, viewport, description, `theme-color`, canonical `https://studiomark.dev/quiet-machine/`, title, og/twitter tags with `og:url` set to the canonical. Then:
   - The shell block: `<!-- shell:begin -->`, `<!-- shell:fade:begin -->`, `<style>` (`html{background:#05070a}`; an `html[data-fade]::after` layer with `content:"";position:fixed;inset:0;background:#05070a;pointer-events:none`, the out ramp `FADE_OUT_MS`, the release fade `FADE_IN_MS`; no `vh` anywhere), `<script>` (if `sessionStorage['jg:fade']` is fresh (<5000 ms) set `data-fade="in"`, then remove the key; wrap in `try`), `<!-- shell:fade:end -->`, `<!-- shell:end -->`.
   - `<body><div id="root"></div><script type="module" src="/src/quiet-machine-main.tsx"></script>`.
   - Title, description and og copy are owner content, shown at GPU-2.
2. NEW `src/quiet-machine-main.tsx`: `createRoot(#root)`, `StrictMode`, `import './index.css'`, `installPageFade(document)`, `<QuietMachinePreview/>`. Mirror `src/main.tsx` (`if (!container) throw`).
3. `vite.config.ts`:
   - Add `appType: 'mpa'`.
   - Add `build.rollupOptions.input = Object.fromEntries(PAGES.filter(p => p.htmlEntry).map(p => [p.id, fileURLToPath(new URL(p.htmlEntry!, import.meta.url))]))`, importing `PAGES` from `./src/shared/pages`.
   - The `test` block and its `exclude` are unchanged.
   - Fallback, if the config bundler will not resolve the import: a literal input map plus a test in `pageTopology.test.ts` that it equals `PAGES` (Opus rules).
4. `index.html`: insert one contiguous block immediately after the line `<meta charset="UTF-8" />`:
   - `<!-- shell:begin -->`, `<!-- shell:redirect:begin -->`, then a `<script>` that, when `study=rl300`, deletes `study` and calls `location.replace('/quiet-machine/' + (rest ? '?' + rest : '') + location.hash)`, then `<!-- shell:redirect:end -->`, `<!-- shell:end -->`.
   - Identifiers and words in this script must not look like Tailwind utilities (`index.html` is scanned via `src/index.css` `@source "../index.html"`).
   - No fade block on this page (Q4 default). `<html … class="bg-[#05070a]">` is unchanged.
5. NEW `src/shared/pageTopology.test.ts`, iterating `PAGES`:
   - Each `htmlEntry` exists.
   - The fade sub-block is present in every `fadeIn:true` entry and absent elsewhere. Every copy's sha256, computed after normalising CRLF to LF (`.replace(/\r\n/g, '\n')`, so a Windows checkout with `core.autocrlf` cannot change it), equals the literal `FADE_BLOCK_SHA256` held in the test. Updating that literal is a deliberate, reviewed act; with a single fade entry, byte parity would otherwise be vacuous (section I, defect 7).
   - The fade block contains `jg:fade` and `5000`, matching `FADE_KEY`/`FADE_MAX_AGE_MS`, and the ramp and release durations match `FADE_OUT_MS`/`FADE_IN_MS`.
   - The redirect sub-block exists only in `index.html`. Run it with `new Function('location','URLSearchParams', body)` against a stub `location` for a FIXED probe list held in the test (not derived from `LEGACY_REDIRECTS`): `?study=rl300`, `?study=rl300&quality=lite`, `?station=2`, `?station=enclosure`, `?station=safe-enclosure`, `?chapter=2`, `?station=3`, `?station=m249`, `?chapter=3`, `?study=other`, and the empty search. For each probe, `replace` is called **if and only if** some `active` `LEGACY_REDIRECTS` row covers that param and value. The expected URLs are literal in the test: `?study=rl300` gives `/quiet-machine/`, `?study=rl300&quality=lite` gives `/quiet-machine/?quality=lite` (equal to `pageHref('quiet-machine','lite')`). Separately assert that at least one `active` row exists. Deleting the `study` row then turns `?study=rl300` red (the script still redirects, but no active row covers it), and the "at least one active" assert also fails (section I, defect 13).
   - The §2 no-scroll-length regex has 0 matches inside each entry's `shell:begin`…`shell:end`, with comments stripped.
6. `src/shared/shellBoundary.test.ts`: add rule 4: `src/quiet-machine-main.tsx` imports only `./index.css`, `./scene/rl300/QuietMachinePreview` and `./shared/*`.
7. `src/scene/rl300/QuietMachinePreview.tsx`:
   - `initialStudyMode` now uses `resolveEntryTier(search, reducedMotion)`: `poster = tier==='poster'`, and it also returns `tier`.
   - Anchor `lite={params.get('quality') === 'lite'}` becomes `lite={mode.tier === 'lite'}`.
   - Header anchor `<a href="/">MARK HINTZ <span>ENGINEERING & DESIGN</span></a>` becomes `<PageLink id="jgun" tier={mode.tier}>MARK HINTZ <span>ENGINEERING & DESIGN</span></PageLink>`, followed by `<PageNav current="quiet-machine" tier={mode.tier} variant="header" />`. The brand stays; the `.qm-header a` selectors still match.
   - Fade release: export `fadeReady(s:{poster:boolean;ready:boolean})` (`= s.poster || s.ready`). Keep refs updated from `onReady`, `onError` and the `webglcontextlost` handler (anchor `const lost = (e: Event) => { e.preventDefault(); setPoster(true) }`). Call `releaseFadeWhen(() => fadeReady(stateRef.current))` once on mount.
8. `src/scene/rl300/preview.test.ts`:
   - `resolveEntryTier` wiring (`'?quality=lite'` with reduced motion gives poster).
   - The `fadeReady` truth table.
   - A source check that `QuietMachinePreview.tsx` contains `releaseFadeWhen(`.
   - Static markup with `location.search='?quality=poster'` and reduced motion off contains `href="/?quality=poster"` and `data-fade`. Every static-markup test stays on the poster path: a non-poster render calls the lazy `import('./QuietMachineScene')`, which loads three, R3F and postprocessing into node after the test ends and can fail `npm test`.
9. `scripts/verify-jg033-preview.mjs`, each by content anchor:
   - `const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || …)` becomes `import { chromium } from 'playwright'` (devDependency).
   - Every `${base}/?study=rl300…` goto becomes `${base}/quiet-machine/…`: the shot loop (`?quality=${quality}&composer=${composer}`), both QM3 blocks, and the scenario loop (`?quality=poster`, `?quality=lite`, or none).
   - `readFileSync('dist/index.html')` becomes `readFileSync('dist/quiet-machine/index.html')`.
10. `scripts/verify-jg033-ribbon-clipping.mjs`: anchor ``page.goto(`${base}/?study=rl300` `` becomes `` `${base}/quiet-machine/` ``.

QM chunk-graph check (QM-only modules; follows `imports` and `dynamicImports` from the QM entry, reading sourcemaps). It runs a positive control first: the same walk from `index.html` must find `src/state/` sources, otherwise the check itself is broken and exits 2. It also exits 2 if the entry key is missing, nothing was walked, or no `.map` was read, so it can never print `none` vacuously.
```bash
U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; : "${U4:?}"
node --input-type=module - "$U4/QM4" <<'EOF'
import fs from 'node:fs'; const out = process.argv.at(-1); const m = JSON.parse(fs.readFileSync(out + '/.vite/manifest.json', 'utf8'))
const scan = (entry, dyn) => { const seen = new Set(), walk = k => { if (seen.has(k) || !m[k]) return; seen.add(k); for (const i of [...(m[k].imports || []), ...(dyn ? m[k].dynamicImports || [] : [])]) walk(i) }; walk(entry)
  let maps = 0; const sources = []; for (const k of seen) { const f = out + '/' + m[k].file + '.map'; if (fs.existsSync(f)) { maps++; sources.push(...JSON.parse(fs.readFileSync(f, 'utf8')).sources) } }
  if (!m[entry] || seen.size === 0 || maps === 0) { console.log(`BROKEN: entry=${entry} seen=${seen.size} maps=${maps}`); process.exit(2) }
  return sources }
const ctrl = scan('index.html', true).filter(s => /src\/state\//.test(s)); if (!ctrl.length) { console.log('BROKEN: positive control found no src/state/ in index.html graph'); process.exit(2) }
console.log(`control: ${ctrl.length} src/state/ sources in the JGUN graph`)
const bad = scan('quiet-machine/index.html', true).filter(s => /src\/state\//.test(s))
console.log(bad.length ? bad.join('\n') : 'none'); process.exit(bad.length ? 1 : 0)
EOF
```
Expected: a `control:` line with a count above 0, then `none`, exit 0.

Gates:
| Command | Expected |
|---|---|
| B, U.1, U.3 | as section B |
| U.2 one-liner | `hunks=1 removed=0 first=<!-- shell:begin --> last=<!-- shell:end -->` |
| U.4 compare | exit 0. A new shared vendor chunk with the same module set is a pass, recorded; Opus rules on the partition |
| `test -f dist/quiet-machine/index.html; echo $?` | `0` |
| `grep -c jg:fade dist/index.html` | `0` (exit 1) |
| `grep -c "dist/quiet-machine/index.html" scripts/verify-jg033-preview.mjs` | at least `1` |
| `grep -c "readFileSync('dist/index.html')" scripts/verify-jg033-preview.mjs` | `0` (exit 1) |
| `grep -c "study=rl300" scripts/verify-jg033-preview.mjs scripts/verify-jg033-ribbon-clipping.mjs` | `0` for both |
| chunk-graph check | `control:` count above 0, then `none`, exit 0 |

Mutations (each run with `npx vitest run src/shared/pageTopology.test.ts`):
| Mutation | Red proof |
|---|---|
| delete the `study` row from `LEGACY_REDIRECTS` | the redirect case fails on the `?study=rl300` probe (replace called, no active row covers it) and the "at least one active row" assert fails |
| put `100vh` inside the QM shell block | the no-scroll-length case fails |
| change one byte of the QM fade sub-block (e.g. `#05070a` to `#05070b`) | the fade-block hash case fails |

U.4 failure path (structure §8):
- Module set differs: try `build.rollupOptions.output.manualChunks` first. If that cannot restore the base set, stop: a separate Vite pass for the QM entry is a design change under Opus review.
- CSS differs: rename the offending token in QM or shell code, or in the redirect script, to a `qm-*`/`shell-*` name, or reword it. If that cannot fix it, stop and ask the owner. `src/index.css` is never edited.
- Diagnose by diffing the two concatenated stylesheets after `tr '}' '\n'`.

Rollback: `git revert <QM4 sha>` (it restores `index.html` and `vite.config.ts` exactly; U.2 then prints `hunks=0`).

### QM5: QM length knob, progress bar, end card, prefetch
| Field | Value |
|---|---|
| Goal | One length constant drives `--qm-length` (start 900vh); a thin progress bar; an end card at u >= .97 with `PageNav variant="endcard"`; prefetch `/` once at the end card |
| Seat | Sonnet / high; review: advisor; owner group A and Astra (packet) see the result. Est. 200k |
| Depends on | QM4 and a GPU-1 pass |
| Blocked on | nothing (QM5 does not touch `SHOTS`; Q6 only affects QM7b) |

Edits:
1. `src/scene/rl300/QuietMachinePreview.tsx`:
   - `export const QM_LENGTH_VH = 900` and `export const END_CARD_AT = .97`.
   - `<main className="qm-preview" …>` gets `style={{ '--qm-length': `${QM_LENGTH_VH}vh` } as React.CSSProperties}`.
   - Add `<div className="qm-progress" aria-hidden="true"><span style={{ transform: `scaleX(${u})` }} /></div>`.
   - Render `{u >= END_CARD_AT && <aside className="qm-endcard"><PageNav current="quiet-machine" tier={mode.tier} variant="endcard" /></aside>}`. The end card shows 01 TORQUE GUN as a link and 03 M249 as "in preparation".
   - A `useRef` flag calls `prefetchPage(document, [pageHref('jgun', mode.tier)!])` once, the first time `u >= END_CARD_AT`.
2. `src/scene/rl300/quiet-machine.css`:
   - Anchor `.qm-preview { min-height: 320vh;` becomes `.qm-preview { min-height: var(--qm-length);`.
   - Add `.qm-progress`, `.qm-endcard` and `.shell-nav*` styles (all prefixed, no Tailwind-looking names).
3. `src/scene/rl300/preview.test.ts`:
   - `QM_LENGTH_VH === 900` (this pin changes in QM7b if the owner rules a length) and `END_CARD_AT === .97`.
   - Static markup at `?shot=.98&quality=poster` contains `qm-endcard`, `href="/?quality=poster"`, `data-fade` and `in preparation`; at `?shot=.5&quality=poster` it has no `qm-endcard`. Stay on the poster path (QM4 note). The end card is not poster-gated.
   - The CSS file text contains `var(--qm-length)`.

Mutation: set `END_CARD_AT = .9`, then `npx vitest run src/scene/rl300/preview.test.ts`; the constant case fails.
Gates: B; U.1; U.2 (`hunks=1 …`); U.4; `grep -c "min-height: *320vh" src/scene/rl300/quiet-machine.css` gives `0` (exit 1); `grep -c "var(--qm-length)" src/scene/rl300/quiet-machine.css` gives `1`. Then GPU-2.
STOP: after GPU-2 the owner rules group A and group B by looking. QM7b waits for both.
Rollback: `git revert <QM5 sha>`.

### QM6: page-transition verifier (QM side)
| Field | Value |
|---|---|
| Goal | One script proves the QM half of the fade: fade-out, synthetic arrival, Back, reduced-motion cut, legacy redirect, no white frame, time to release |
| Seat | Sonnet / high; **Opus / medium review (it gates the fade)**. Est. 200k + 100k |
| Depends on | QM4 (QM5 for the end-card link, optional). Authoring may run in parallel with QM5 |
| Blocked on | GPU-3 for the run and for both mutations |

NEW `scripts/verify-page-transition.mjs`:
- CLI: `node scripts/verify-page-transition.mjs --url=http://localhost:<port> [--viewport=1440x900|390x844] [--out=<dir>]`. Uses `import { chromium } from 'playwright'` with `channel: 'chrome'` and the GL args of `verify-jg033-preview.mjs`.
- Exits 1 on any failed case. Writes `report.json` and videos to `--out`.

| Case | Assertion |
|---|---|
| fade-out | At `/quiet-machine/`, click `.qm-header > a[data-fade]` (the brand `PageLink`, the header's only direct-child link; the `PageNav` links sit inside `<nav>`). Within 100 ms `html[data-fade="out"]` is set and `sessionStorage['jg:fade']` exists. The URL becomes `/` within `FADE_FALLBACK_MS + 1000` |
| synthetic arrival | `addInitScript` presets `jg:fade = Date.now()` before `/quiet-machine/`. `data-fade="in"` is set at `DOMContentLoaded`. The attribute is removed when `__quietMachine.ready` holds, or by 2.5 s + 600 ms. Records `timeToReleaseMs` |
| Back | QM, then the fade link to `/`, then `goBack()`. An init-script `pageshow` hook records `persisted`. Assert no `data-fade`, a canvas present, `__quietMachine.ready`, and no `.qm-poster`. If `persisted` is false, record it as UNVERIFIED (bfcache not used), not a pass. If QM shows the poster, record it and raise it with the owner: no silent patch |
| reduced-motion cut | Context `reducedMotion:'reduce'`. A click navigates with no `data-fade="out"` and no storage key |
| legacy redirect | `/?study=rl300&quality=lite` ends at `/quiet-machine/?quality=lite`, with `history.length === 1` |
| no white frame | First navigate to a dark page (a dark `data:` URL or the QM page), then start CDP `Page.startScreencast({format:'png'})` and discard any frame captured before the QM document commits, so the initial white about:blank frames cannot fail an unmutated run. Capture during the synthetic arrival, with `**/*.css` responses delayed 400 ms through `page.route` to widen the pre-CSS window. Decode each frame with `pixels()` from `scripts/lib/preview-pixels.mjs`. Fail if any frame has at least 20% of its pixels with luminance above 0.85 (a full-frame flash). A 1% threshold would false-red on QM's own light text (`#f0f2ee`, headings up to 68px) and the poster. The mutation below still goes red: without the dark inline background the pre-CSS default page is white across the whole frame |

Mutations, run at GPU-3 (each needs a rebuild and a `:<port>` restart, then a revert, rebuild and restart):
| Mutation | Red proof |
|---|---|
| remove `html{background:#05070a}` and the `::after` background from `quiet-machine/index.html` | the no-white-frame case fails. If it stays green, the check is too weak: record that and raise it in the Opus review. Per H.5, a case whose mutation stays green does not count as a gate |
| remove the `persisted` clear in `src/shared/pageFade.ts` | the Back case fails (only if bfcache is used; otherwise record UNVERIFIED) |

The mutation outputs are appended to the QM6 section of `qm-commit-gates.md` in the commit after GPU-3.
Gates: B; U.1; U.2; U.4; `node --check scripts/verify-page-transition.mjs` exits 0. Then GPU-3: exit 0 at 1440x900 and 390x844.
Rollback: `git revert <QM6 sha>`.

### QM7: intake hotspot and a QM-only verifier
| Field | Value |
|---|---|
| Goal | One badge at the lower intake: a click seeks to u .51 and opens a detail card; it uses the JG-036 layering pattern (above the content column, `elementFromPoint` hit at rest, real actionability-checked click) |
| Seat | Sonnet / high; review: advisor; Astra (packet). Est. 200k |
| Depends on | QM4 (and QM5 if run in sequence) |
| Blocked on | GPU-4 for the run and the mutation |

Edits:
1. NEW `src/scene/rl300/IntakeHotspot.tsx`. Exports:
   - `INTAKE_ANCHOR: [number,number,number]`: the world-space centre of the lower-intake louvre group built by `createLowerIntake()` (`src/scene/rl300/LowerIntake.tsx`). Measure it in a test, then hard-code it.
   - `INTAKE_WINDOW = [.27, .76] as const`: the badge is shown only while the section is open around shot 04. Owner-adjustable in group A.
   - `projectIntake(u, width, height): {x,y,visible}`: a pure function in **plain math, with no `three` import**. `IntakeHotspot.tsx` imports only `react` and `./shot`. Reason: `QuietMachinePreview` imports it statically, so a `three` import would pull three into QM's eager graph and poster and reduced-motion visitors would download it (today only the lazy `QuietMachineScene` loads three; `shot.ts` has no imports). Plain math was chosen over lazy-loading the hotspot because the badge then needs no extra chunk or Suspense and stays testable in node. The function takes `position`, `target` and `fov` from `evaluateShot(u, width < 600)`; `width`/`height` are the `.qm-stage` rect, not the window, which is the same size R3F uses for the portrait rule in `QuietMachineScene.tsx`. It builds a look-at basis with +Y up, applies the vertical-fov perspective with aspect `width/height`, and maps NDC to stage pixels. `visible` is false behind the camera, outside the stage, or outside `INTAKE_WINDOW`.
   - `IntakeHotspot({u, onSeek})`: a `.qm-hotspot-layer` (fixed, `pointer-events:none`, above `.qm-stage` and `.qm-editorial`, below `.qm-header`/`.qm-controls`) holding a `<button className="qm-hotspot" aria-label="Lower intake: details">`. Clicking calls `onSeek(.51)` and opens `<div role="dialog" aria-label="Lower intake" className="qm-hotspot-card">`. The card copy is owner content: start from `SHOTS[3]` caption and note. It has a close button and closes on Escape.
2. `src/scene/rl300/QuietMachinePreview.tsx`: mount `<IntakeHotspot u={u} onSeek={navigate} />` after the `.qm-stage` div, only when not `poster`.
3. `src/scene/rl300/quiet-machine.css`: `.qm-hotspot-layer`, `.qm-hotspot`, `.qm-hotspot-card` (z-index ordering explicit).
4. `src/scene/rl300/preview.test.ts`:
   - `INTAKE_ANCHOR` equals the measured centre within 1e-3.
   - `projectIntake(.51, …)` is visible and inside the stage at 1440x900, 768x1024 and 390x844.
   - Not visible at u=0.
   - Clicking seeks to .51 (call the handler directly).
   - Cross-check: for u in `[.3, .51, .7]` at the 3 stage sizes, `projectIntake` matches a three `PerspectiveCamera` built from the same shot (`new PerspectiveCamera(fov, w/h)` then `updateProjectionMatrix()`, then `lookAt`, `updateMatrixWorld`, `Vector3.project`) within 0.5 px. The test maps three's NDC to pixels with its own code, not with projectIntake's mapping, so a y-flip bug shared with projectIntake cannot pass. The test file may import three; it is not in the eager graph.
   - Source check: `IntakeHotspot.tsx` has no `from 'three'` import.
5. NEW `scripts/verify-qm-intake-hotspot.mjs`:
   - CLI `--url=…`, viewports 1440x900, 768x1024, 390x844. Goto `/quiet-machine/?shot=.45`, wait for `__quietMachine.ready`, wait 500 ms at rest.
   - Badge rect: `elementFromPoint(center)` is the badge or a descendant.
   - `locator.click()` with no `force`, then `|__quietMachine.u - .51| < .005` and the dialog is visible.
   - Screenshots `hotspot-rest-<vp>.png` and `hotspot-open-<vp>.png` go to `--out`. Exit 1 on failure.

Mutation (GPU-4): give `.qm-hotspot-layer` a z-index below `.qm-editorial` (or below the stage), rebuild, restart, run. The `elementFromPoint` probe fails. Revert, rebuild, restart.
Gates: B; U.1; U.2; U.4 (card copy is in `src/`, so it is Tailwind-scanned: the risk is words like `fixed`, `block`, `hidden`); `node --check scripts/verify-qm-intake-hotspot.mjs`; the eager-graph check below. Then GPU-4: exit 0 at 3 viewports.

Eager-graph check (no `three` in QM's static graph). This is the QM4 sourcemap walk with `dynamicImports` NOT followed: following them always reaches three through the lazy Scene. The positive control is the same walk WITH dynamic imports, which must find three. The `QMN` value is the U.4 output dir of this commit.
```bash
U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; QMN=QM7; : "${U4:?}" "${QMN:?}"
node --input-type=module - "$U4/$QMN" <<'EOF'
import fs from 'node:fs'; const out = process.argv.at(-1); const m = JSON.parse(fs.readFileSync(out + '/.vite/manifest.json', 'utf8'))
const scan = (entry, dyn) => { const seen = new Set(), walk = k => { if (seen.has(k) || !m[k]) return; seen.add(k); for (const i of [...(m[k].imports || []), ...(dyn ? m[k].dynamicImports || [] : [])]) walk(i) }; walk(entry)
  let maps = 0; const sources = []; for (const k of seen) { const f = out + '/' + m[k].file + '.map'; if (fs.existsSync(f)) { maps++; sources.push(...JSON.parse(fs.readFileSync(f, 'utf8')).sources) } }
  if (!m[entry] || seen.size === 0 || maps === 0) { console.log(`BROKEN: entry=${entry} seen=${seen.size} maps=${maps}`); process.exit(2) }
  return sources }
const isThree = s => /node_modules\/three\//.test(s)
const ctrl = scan('quiet-machine/index.html', true).filter(isThree); if (!ctrl.length) { console.log('BROKEN: control found no three via the lazy Scene'); process.exit(2) }
console.log(`control: ${ctrl.length} three sources with dynamic imports`)
const bad = scan('quiet-machine/index.html', false).filter(isThree)
console.log(bad.length ? bad.join('\n') : 'none'); process.exit(bad.length ? 1 : 0)
EOF
```
Expected: a `control:` count above 0, then `none`, exit 0. Mutation (static, before commit): add `import { PerspectiveCamera } from 'three'` and a use of it to `IntakeHotspot.tsx`, re-run the U.4 build with `QMN=QM7-mut` (so the mutated summary is not logged under `QM7`; set `QMN=QM7-mut` in this block too) and this check; it prints three sources and exits 1. Then `git restore`.
STOP: hotspot PNGs to the owner (part of group A).
Rollback: `git revert <QM7 sha>`.

### QM7b: rulings commit (always lands)
| Field | Value |
|---|---|
| Goal | Apply the owner's group A rulings (QM content, scroll length), and the group B interim dark tone if that is the ruling; replace the 4-anchor poster writer with a 7-shot desktop poster loop |
| Seat | Sonnet / high; review: advisor; the owner sees GPU-7 posters; Astra (packet). Est. 150k |
| Depends on | QM5 + GPU-2, QM7 + GPU-4, owner groups A and B written into the repo |
| Blocked on | **Owner rulings A and B** |

Edits:
1. Rulings: for each group A/B item (29 §2 items 1, 2, 3, 4, 5, 6; the length), apply exactly what the owner ruled in `src/scene/rl300/**`:
   - `shot.ts` copy and ranges;
   - `QM_LENGTH_VH`;
   - reservoir policy in `prepareModel.ts` `PART_POLICY` (item 4). QM7b edits `prepareModel.ts` at the `PART_POLICY` data level only; any change to its matching or loading logic stays in QM9b (structure manifest W5 says `prepareModel.ts` is "QM9b only", the QM7b row allows `src/scene/rl300/**` as rulings require; section I, defect 14). If item 4 changes the kept reservoir, `scripts/verify-jg033-preview.mjs` must change with it in this commit: `RULING.keep` (anchor `keep: ['V2RL300-SAF-RES-1020-SAFE-1'`) names the kept part, and the count asserts (anchors `108 + 24 + telemetry.counts.removedTriangles` and `assert.equal(telemetry.counts.removedTriangles, 460`) pin the triangle totals. Re-derive each changed number and justify it in the QM7b evidence section; the numbers are confirmed at GPU-7's verifier run;
   - the 2a panel tone in the material code (item 5, interim tone only; the Blender split goes to QM9b);
   - chevron visibility in `AirRibbons.tsx` (item 6).
   - Update `preview.test.ts` pins to match. If Q6 was answered "duration weights", that refactor lands here too (section G).
   - Each change is listed against its ruling in the QM7b section of `qm-commit-gates.md`, quoting the ruling's repo location.
2. `scripts/verify-jg033-preview.mjs`:
   - Delete the block from anchor `// 07 resolves back to the 01 frame; the poster set stays the three distinct looks.` through the closing `}` of its `if (name === 'desktop' && … CAPTURE_POSTERS === '1')`.
   - Insert immediately after the line that starts `report.checks[name] = { reverse, capPixels` (unique; `await page.close()` is not, because it also appears in the scenario loop):
     `if (name === 'desktop' && process.env.CAPTURE_POSTERS === '1') { await page.addStyleTag({ content: '.qm-hotspot-layer, .qm-progress, .qm-endcard { display: none !important }' }); for (const [i, u] of [.06, .195, .34, .51, .685, .825, .945].entries()) { await seek(page, u); const file = `public/images/rl300-shot-0${i + 1}-poster.png`; fs.mkdirSync('public/images', { recursive: true }); await page.locator('.qm-stage').screenshot({ path: file }); console.log(`poster: ${file}`) } }`.
   - The style tag hides overlays: the poster path never mounts the hotspot, so the hotspot badge (visible for u in `INTAKE_WINDOW`, which covers the shot 03-05 midpoints) must not be baked into the posters.
   - The values are the `SHOTS` midpoints rounded to 3 decimals (structure QM7b row). If group A changes `SHOTS` ranges, recompute them; the test below enforces it.
3. `src/scene/rl300/preview.test.ts`: `SHOTS.map(s => Math.round((s.from + s.to) / 2 * 1000) / 1000)` equals the literal list in the verifier (read the `.mjs` as text, find `CAPTURE_POSTERS === '1'`, then parse the bracketed array that starts at the first `of [` after it; fail if either anchor is missing), and `shotIndexAt(mid) === i` for each.

Mutation: change `.34` to `.27` in the verifier list, then `npx vitest run src/scene/rl300/preview.test.ts`; the midpoint case fails.
Gates: B; U.1; U.2; U.4; `node --check scripts/verify-jg033-preview.mjs`; `grep -c "preview.png" scripts/verify-jg033-preview.mjs` gives `0` (exit 1). At GPU-7: the `CAPTURE_POSTERS=1` log lists 7 distinct `poster: public/images/rl300-shot-0N-poster.png` lines.
Rollback: `git revert <QM7b sha>` (rulings come back out; record why in the evidence).

### QM8: render-pass attribution script (no product change)
| Field | Value |
|---|---|
| Goal | Split the 1,201k runtime triangles per pass: unique geometry x instances, cap passes, ribbons, composer |
| Seat | Sonnet / high; review: advisor. Est. 120k |
| Depends on | QM4. Authoring may run in parallel with QM5 |
| Blocked on | GPU-5 for the table |

NEW `scripts/measure-qm-render-passes.mjs`:
- CLI `--url=… [--out=…]`. For 1440x900 and 390x844, full and lite, and u in `[0, .2, .34, .51, .685, .825, 1]`: read `__quietMachine.triangles`, `drawCalls` and `counts.keptTriangles`.
- Caps on and off via `__quietMachine.setCaps(false|true)`; the difference is the cap passes.
- `?composer=1` vs direct: the difference is the composer.
- Ribbons: use a toggle on `__quietMachine.ribbons` if one exists. Otherwise report ribbons as "not separable without a product change" (UNVERIFIED). QM8 adds no toggle.
- Instances = (triangles with caps off) / `keptTriangles`.
- Writes `render-passes.json` and a markdown table for `35-gpu-5-render-pass-attribution.md`.

Mutation: run against a URL with `?composer=1` forced for both arms and confirm the composer column reads 0 (proves the column is computed, not constant). Recorded at GPU-5.
Gates: B; U.1; U.2; U.4; `node --check scripts/measure-qm-render-passes.mjs`. Then GPU-5.
Rollback: `git revert <QM8 sha>`.

### QM9: cut the largest term, lite policy, skip caps while closed
| Field | Value |
|---|---|
| Goal | Code-side triangle cuts chosen by the GPU-5 table; no loader swap and no new asset (QM9b owns both) |
| Seat | Sonnet / high (owner does any Blender work); **Opus / medium review (stencil/cap passes, risk H)**. Est. 200k + 100k |
| Depends on | QM8 + GPU-5 |
| Blocked on | GPU-5 table |

Edits:
1. `src/scene/rl300/SectionCaps.tsx`: export `capsActive(planeConstant: number) = planeConstant < CLOSED_CUT - 1e-6` (import `CLOSED_CUT` from `./shot`). In the existing `useFrame` (anchor `cap.position.x = plane.constant`), set each section group's `visible = capsActive(plane.constant)`, so the back, front and cap passes all skip while the section is closed. If GPU-5 says cap passes dominate, also follow the stencil-proxy route in QM9b.
2. `src/scene/rl300/QuietMachineScene.tsx` (lite policy only):
   - Anchor `const composed = composerMode === '1' || composerMode === '4'` becomes `const composed = !lite && (…)`.
   - Keep `dpr={lite ? 1 : [1, 1.5]}` (DPR <= 1.5 already holds).
   - Pass `lite` to `<AirRibbons … />`.
3. `src/scene/rl300/AirRibbons.tsx`:
   - `AirRibbons` gains `lite?: boolean`.
   - Export `ribbonTotalFor(width: number, lite: boolean)`: lite always gives `RIBBON_COUNT.mobile` (9, inside 6-10); otherwise the existing `viewportRibbonTotal(width)`.
   - Anchor `useMemo(() => ribbonCountsForViewport(width), [width])` uses it.
4. `src/scene/rl300/preview.test.ts`: `capsActive(CLOSED_CUT) === false`, `capsActive(DEEPEST_CUT) === true`; `ribbonTotalFor(1440, true)` is in [6, 10].
5. `scripts/verify-jg033-preview.mjs` (not in the structure's QM9 file list; section I defect 11). `telemetry.capTarget` is written only in the cap mesh's `onAfterRender`. With caps skipped while closed, it is undefined at the first anchor (`['exterior', 0]`), and `telemetry.capTarget.stencilBits` throws.
   - Wrap the four `capTarget` asserts (anchors `assert.equal(telemetry.capTarget.stencilBits, 8)` through `if (composer === '4') assert.equal(telemetry.capTarget.samples, 4)`) in `if (telemetry.cutPlane < .85 - 1e-6) { … }`.
   - After the anchor loop, add `assert(report.captures.some(c => c.name === name && c.telemetry.capTarget), 'caps must render at the open anchors')`.
   - The lite policy (`composed = !lite && …`) breaks the anchor `assert.equal(telemetry.capTarget.offscreen, composer === '1' || composer === '4')`: the shot loop passes `composer` to all four rows, including `lite`, so any `COMPOSER=1|4` run would fail on the lite row. In this same edit, the expected value becomes `quality !== 'lite' && (composer === '1' || composer === '4')`, matching the product expression. The `if (composer === '4') assert.equal(telemetry.capTarget.samples, 4)` line gets the same `quality !== 'lite' &&` guard.

Mutation: make `capsActive` return `true`, then `npx vitest run src/scene/rl300/preview.test.ts`; the closed case fails.
Gates: B; U.1; U.2; U.4. Then GPU-6, unless QM9b lands, in which case GPU-6 runs after QM9b. Pass = triangles <= ~500k, or the measured number with device-named p95 holding 60 fps desktop and 30 fps phone (handoff §2.5).
STOP: the owner names the desktop GPU and phone models before GPU-6, and rules on triangle acceptance after it.
Rollback: `git revert <QM9 sha>`.

### QM9b (conditional): the only asset commit and the only loader swap
| Field | Value |
|---|---|
| Goal | Land the owner's Blender asset(s) and swap the full-tier loader, keeping every verifier assert pointed at the asset actually loaded |
| Seat | Sonnet / high; **Opus / medium review (ruling counts and name matching can pass on the wrong asset)**. Est. 200k + 100k |
| Lands if | GPU-5 names cap passes (proxies) or base geometry (decimation), and/or group B picked the owner's Blender split of the 2a panel |
| Blocked on | the owner delivering the `.glb`, authored in Blender from the `msp-enclosure` source (never `gltfjsx --transform`, `AGENTS.md`) |

Edits:
1. Force-add each new asset: `git add -f public/models/rl300-full.glb` and/or `git add -f public/models/rl300-section-proxies.glb` (`.gitignore` ignores `public/models/*.glb`; `.gitignore` is not edited).
2. `src/scene/rl300/QuietMachineScene.tsx`: anchor `lite ? '/models/rl300-lite.glb' : '/models/msp-enclosure.glb'` becomes `'/models/rl300-full.glb'` on the full branch (and the lite branch only if the lite asset changes).
3. `src/scene/rl300/prepareModel.ts` and `src/scene/rl300/SectionCaps.tsx`, as the asset requires. Every name in `PART_POLICY`, `LINER_PART`, `EXHAUST_PIPE`, `SECTION_ROOTS`, `MSP_AIRWAY_VOLUME` and `PROPOSED_LOWER_INTAKE` must still resolve. `prepareModel` already throws on a missing ruled part or liner. If the extents change, re-measure `MODEL_BOUNDS` in `src/scene/rl300/shot.ts`.
4. `scripts/verify-jg033-preview.mjs`, each by anchor:
   - `readFileSync('public/models/msp-enclosure.glb')` becomes the new asset.
   - `` `${base}/models/${quality === 'lite' ? 'rl300-lite' : 'msp-enclosure'}.glb` `` becomes `'rl300-full'`.
   - `page.route('**/models/msp-enclosure.glb'` becomes the new asset.
   - `assertRuling(parts)`, `108 + 24 + telemetry.counts.removedTriangles` and `removedTriangles, 460`: re-derive each from the new asset and justify every changed number in the evidence.

Gates:
| Command | Expected |
|---|---|
| B, U.1-U.4 | as section B |
| `git ls-files public/models/rl300-*.glb` | `public/models/rl300-lite.glb` (already tracked) plus each new path |
| `git diff --quiet 666cbf23 HEAD -- public/models/msp-enclosure.glb; echo $?` | `0` |
| if `rl300-full.glb` landed: `grep -c "msp-enclosure" src/scene/rl300/QuietMachineScene.tsx scripts/verify-jg033-preview.mjs` | `0` for both. The bare pattern also catches the `'msp-enclosure'}.glb` template form |

Mutation: set one `PART_POLICY` key to a misspelt name and run `npx vitest run src/scene/rl300/preview.test.ts`; the real-pipeline case fails (or `prepareModel` throws).
Then GPU-6 (here, not after QM9).
Rollback: `git revert <QM9b sha>` (the asset files leave the index; `msp-enclosure.glb` was never touched).

### QM10: seven posters and the `POSTERS` map
| Field | Value |
|---|---|
| Goal | Commit the 7 GPU-7 posters, point `POSTERS` at them, delete the 3 old posters |
| Seat | Haiku / high; review: advisor. Est. 60k |
| Depends on | GPU-7 |
| Blocked on | **Owner approves the 7 poster PNGs** |

Edits:
1. Stage `public/images/rl300-shot-01-poster.png` through `-07-` (written by GPU-7 into this worktree), by path.
2. `git rm public/images/rl300-exterior-preview.png public/images/rl300-section-preview.png public/images/rl300-intake-preview.png`.
3. `src/scene/rl300/QuietMachinePreview.tsx`:
   - Anchor `const POSTERS = ['exterior', 'section', 'section', 'intake', 'section', 'section', 'exterior'] as const` becomes `export const POSTERS = SHOTS.map((_, i) => `/images/rl300-shot-0${i + 1}-poster.png`)`. Update its doc comment.
   - Anchor ``src={`/images/rl300-${POSTERS[beat]}-preview.png`}`` becomes `src={POSTERS[beat]}`.
4. `src/scene/rl300/preview.test.ts`: `POSTERS.length === 7` and every entry exists (`fs.existsSync('public' + p)`).
5. `scripts/verify-jg033-preview.mjs`: every `src.includes('intake')` (the scenario loop and the QM3 reduced block) becomes `src.includes('shot-04')`.

Mutation: rename one `POSTERS` entry to `-08-`, then `npx vitest run src/scene/rl300/preview.test.ts`; the existence case fails.
Gates:
| Command | Expected |
|---|---|
| B, U.1-U.4 | as section B |
| `grep -c "includes('intake')" scripts/verify-jg033-preview.mjs` | `0` (exit 1) |
| `grep -c "shot-04" scripts/verify-jg033-preview.mjs` | at least `1` |
| block QM10-files below | `posters=7`, then `old-previews=0`, then `git-grep exit: 1` with no match lines |

Block QM10-files (pipes and quotes, so fenced, not in the table):
```bash
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
test -d public/images || { echo "FAIL: no public/images"; exit 2; }
echo "posters=$(git ls-files public/images/rl300-shot-0*-poster.png | wc -l)"
echo "old-previews=$(ls public/images/ | grep -c -E '^rl300-.*-preview\.png$')"
git grep -n -e 'rl300-.*-preview\.png' -e '-preview\.png' -- src/scene/rl300 scripts/verify-jg033-preview.mjs
echo "git-grep exit: $?"
```

Then GPU-8.
Rollback: `git revert <QM10 sha>` (it restores the 3 old posters).

### QM11: close-out docs
| Field | Value |
|---|---|
| Goal | Record the program status where the repo looks for it; register this plan |
| Seat | Haiku / high; review: advisor. Est. 60k |
| Depends on | GPU-8 (Astra verdict and group E recorded, or explicitly pending) |
| Blocked on | **Q8** (default below) and the owner's group E outcome to write down |

Edits (by content, never by line number):
1. `project/context/deployment.md`: a short "Multi-page output" note: `dist/index.html` plus `dist/quiet-machine/index.html`; `appType:'mpa'`; host-only checks UNVERIFIED (slashless `/quiet-machine`, query redirects); no deploy authorised.
2. `project/context/project-brief-2026-09-29.md`: the table row that starts ``| `?study=rl300` |`` now says it redirects to `/quiet-machine/` (entry `quiet-machine/index.html`). The `check:station2` meaning is unchanged.
3. `project/work/plans/JG-033-rl300-quiet-machine.md`: close-out lines under the QM0 extension record (commits, gates, GPU evidence 31-38, open owner items).
4. `TODO.md`, JG-033 block only (find the line that starts `- [ ] **JG-033 — RL300 "The Quiet Machine"`): one status sub-bullet with the 29 §4 facts and the program status, linking this plan. JG-037 and JG-032 are unchanged.
5. `project/work/INDEX.md`: the `| JG-033 |` row gets the status and a link to this plan.
6. `project/work/evidence/rl300-quiet-machine/README.md`: links to 31-38 and to `qm-commit-gates.md`.
7. `qm-commit-gates.md`: `## QM11` section.

Gates: U.1-U.3; block QM11-docs prints a non-empty file count and `grep exit: 1` with no path lines:
```bash
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
files=$(git diff --name-only HEAD~1 HEAD) || { echo "FAIL: git diff errored"; exit 2; }
test -n "$files" || { echo "FAIL: empty diff"; exit 2; }
echo "files: $(printf '%s\n' "$files" | wc -l)"
printf '%s\n' "$files" | grep -v -E '^(docs/|project/|TODO\.md$)'
echo "grep exit: $?"
```
Rollback: `git revert <QM11 sha>`.

## E. GPU-run protocol
**Who asks.** The orchestrator asks the owner before every run (Q7). The owner gets the JG-035 session (main checkout) to release the GPU and a port from 4173/4174/5203/5205. Never assume, never pick another port.
**Seat.** One Sonnet / high `tier-worker` GPU seat, in this worktree, owns every run and the server it was granted. Reports go to the critical-path reviewer and the orchestrator.
**Every run.**
- Record `git rev-parse HEAD` and the build hash (`sha256sum dist/index.html dist/quiet-machine/index.html`).
- Serve with `npx vite preview --strictPort --port <P>`. **Restart `:<P>` after every rebuild** (`AGENTS.md`: stale server plus rotated hashes means the canvas never mounts).
- Set `BASE_URL=http://localhost:<P>` for the jg033 verifiers.
- Viewports: 1440x900, 768x1024, 390x844, plus 390x844 lite for QM.
- Playwright writes `.webm`. Convert to `.mp4` with ffmpeg if it is on PATH; otherwise send the `.webm` and say so.
- Release the port and tell the owner when done.

| Run | After | Commands (granted port `P`) | Capture | Sent to owner |
|---|---|---|---|---|
| GPU-1 | QM4 | the GPU-1 steps below the table (part 0 asset parity, part 1 base, part 2 QM4) | exit codes, JSON summaries, the asset-parity output, the stop-0 `compare()` JSON, JGUN quick before/after, whether the jg033 verifier runs cleanly against a preview build (UNVERIFIED until now) | nothing to rule on. A failure is fixed by a `QM4-fix` commit (section B step 8) and GPU-1 re-runs before QM5 |
| GPU-2 | QM5 | `node scripts/verify-jg033-preview.mjs`; a capture pass for the group A/B list (section A): holds at u .34 and .51; 7-shot sheets at 1440x900 and 390x844; intake close-up; reservoir 1019 vs 1020; chevrons; 2a panel; forward/reverse and forward-at-length recordings | `32-gpu-2/` | **group A and B PNGs and 2 MP4s** |
| GPU-3 | QM6 | `node scripts/verify-page-transition.mjs --url=http://localhost:P --viewport=1440x900`, then `--viewport=390x844`; both QM6 mutations; WebKit/Firefox only if installed, otherwise UNVERIFIED | `33-gpu-3/` report plus videos | **group D (QM half)**: 4 MP4s plus first, middle and last PNGs |
| GPU-4 | QM7 | `node scripts/verify-qm-intake-hotspot.mjs --url=http://localhost:P --out=…/34-gpu-4`; the z-index mutation | rest/open PNGs at 3 viewports | **hotspot PNGs** |
| GPU-5 | QM8 | `node scripts/measure-qm-render-passes.mjs --url=http://localhost:P --out=…/35-gpu-5` | table | table only |
| GPU-6 | QM9b if it lands, else QM9 | device-named p50/p95: `verify-jg033-preview` `frameResponseMs` on the desktop GPU; the phone via a LAN URL to the granted port, served with `npx vite preview --host --strictPort --port P` (LAN exposure is part of the grant ask; if the phone cannot reach it, record UNVERIFIED and ask the owner) | `36-gpu-6-perf.md` | perf table, triangle acceptance question |
| GPU-7 | QM7b and GPU-6 | `CAPTURE_POSTERS=1 node scripts/verify-jg033-preview.mjs` | the log's 7 `poster:` lines | **the 7 poster PNGs** |
| GPU-8 | QM10 | captures for the Astra packet from one build: design §7 row 5 list, the QM-half fade recordings, the intake hotspot. Then ONE Astra call, MEDIUM, prompt via stdin; proof is an ocx row `openai/gpt-6-astra` 200. Then group E frames and a live forward/reverse run | `38-gpu-8/` | Astra verdict, then **group E** |

**GPU-1 steps** (granted port `P`, substituted literally; start every block with `U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; OUT=/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/31-gpu-1; mkdir -p "$OUT"; : "${U4:?}" "${OUT:?}"`; `OUT` is absolute because part 1 runs from the base worktree):
- **Part 0, asset parity (CPU, before part 1).** `public/models/msp-enclosure.glb` and `public/models/m249-transformed.glb` are tracked (`git ls-files` lists them despite the `public/models/*.glb` ignore rule: exceptions at `.gitignore:8-12` plus force-adds), so the detached base worktree carries them. Any other file the build serves may be ignored and absent there. Run `git ls-files --others --ignored --exclude-standard public/models` in this worktree (it lists exactly the ignored, untracked files, recursively). Every listed file that the build or a verifier requests is copied into `$U4/base/models/` (the served base output) and listed in `31-gpu-1-qm-entry-smoke.md`. An empty diff is recorded as such.
- **Part 1 (base).** From `/c/Users/Markimus/.buzz/REPOS/jgun-qm-base`: `npx vite preview --strictPort --port P --outDir /c/Users/Markimus/.buzz/REPOS/qm-u4/base`; `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:P --out=$U4/gpu1-jgun-base`; the stop-0 capture below at `/?study=rl300&shot=0`, twice, to `qm-stop0-base-a.png` and `qm-stop0-base-b.png`, to measure the noise floor (D11 reference; section I, defect 8).
- **Part 2 (QM4).** Stop the server, `npm run build` here, restart on P: `node scripts/verify-jg033-preview.mjs` (4 cases plus the reduced and context-loss cases); `node scripts/verify-jg033-ribbon-clipping.mjs`; the stop-0 capture at `/quiet-machine/?shot=0` to `qm-stop0-qm4.png`; the compare below; a `/?study=rl300&quality=lite` redirect smoke; `verify-jgun-opening --quick --url=…` again, compared with part 1; a dev smoke with `npx vite --strictPort --port P` (`/`, `/quiet-machine/`, an unknown path).

Stop-0 capture (desktop 1440x900; `.qm-header` and `.qm-editorial` are hidden in BOTH arms because `.qm-editorial` overlaps the `.qm-stage` rect at `inset: 9vh 0 13vh 23vw` and QM4 changes the header; the launch options are those of `verify-jg033-preview.mjs`):
```bash
U4=/c/Users/Markimus/.buzz/REPOS/qm-u4; OUT=/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/31-gpu-1; mkdir -p "$OUT"; : "${U4:?}" "${OUT:?}"
# part 2 arm shown; part 1 uses "http://localhost:P/?study=rl300&shot=0" and "$OUT/qm-stop0-base-a.png", then "-b"
node --input-type=module - "http://localhost:P/quiet-machine/?shot=0" "$OUT/qm-stop0-qm4.png" <<'EOF'
import { chromium } from 'playwright'
const [url, file] = process.argv.slice(-2)
const b = await chromium.launch({ channel: 'chrome' /* plus the GL args of verify-jg033-preview.mjs */ })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
await p.addStyleTag({ content: '.qm-header, .qm-editorial { visibility: hidden !important }' }); await p.waitForTimeout(500)
await p.locator('.qm-stage').screenshot({ path: file }); await b.close()
EOF
```
Compare (run from this worktree; uses `compare()` from `scripts/lib/preview-pixels.mjs`, per-channel threshold 8):
```bash
OUT=/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/31-gpu-1; : "${OUT:?}"
cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine || exit 2
node --input-type=module - "$OUT/qm-stop0-base-a.png" "$OUT/qm-stop0-base-b.png" "$OUT/qm-stop0-qm4.png" <<'EOF'
import fs from 'node:fs'; import { pathToFileURL } from 'node:url'
const { compare } = await import(pathToFileURL('scripts/lib/preview-pixels.mjs').href)
const [a, b, q] = process.argv.slice(-3).map(f => fs.readFileSync(f))
const noise = compare(a, b), diff = compare(a, q), limit = Math.max(.01, 2 * noise.fraction)
console.log(JSON.stringify({ noise, diff, limit, pass: diff.fraction <= limit })); process.exit(diff.fraction <= limit ? 0 : 1)
EOF
```
Pass: `diff.fraction <= max(0.01, 2 x noise.fraction)`. The threshold is provisional: the QM4 Opus reviewer confirms or changes it before GPU-1, and the run file records the value used.

If Astra returns fix-first: fix, re-show the owner, and ask before any second call (one-call cap).
After GPU-1 ends: `git worktree remove /c/Users/Markimus/.buzz/REPOS/jgun-qm-base`. Keep `$U4/base` until QM10 (U.4 needs it).

## F. Orchestration (claude-tiers)
**Order.**
| Lane | Commits | Rule |
|---|---|---|
| Critical path | QM0, QM1, QM2, QM4, then GPU-1, QM5, GPU-2, QM7, GPU-4, rulings, QM7b, QM9 (and QM9b), GPU-6, GPU-7, QM10, GPU-8, QM11 | sequential, one commit at a time on `quiet-machine/integration` |
| Parallel (static only, separate worktree on a temporary branch) | QM3 alongside QM1/QM2; QM6 and QM8 authoring alongside QM5 | The lane worktree runs `npm ci` first (a new worktree has no `node_modules`). Lane commits never touch `qm-commit-gates.md` (QM1 creates it on the integration branch, so a lane edit would conflict on cherry-pick): the lane writes its gate and mutation output to an untracked side file `qm-lane-<QMn>.md` outside the repo (`/c/Users/Markimus/.buzz/REPOS/qm-u4/`), and skips protocol steps 5 and 7's evidence amend. Lane commits run B, U.1 and U.2 only (the lane worktree is `/c/Users/Markimus/.buzz/REPOS/jgun-qm-lane-<QMn>`; the fenced U.1 and U.2 blocks begin `cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, which would check the integration tree, so the lane replaces that `cd` path in each block with its own worktree root): U.4 needs `$U4/base`, which QM1 builds, so U.4 runs in the orchestrator's re-run after the cherry-pick. The orchestrator cherry-picks onto the integration branch in commit order, re-runs every gate of that commit there, appends the side file plus the re-run output as the commit's `## QMn` section, and lands that evidence with `git commit --amend --no-edit` on the cherry-picked commit (staged by path). Never two sessions in one folder |
| Interleaved GPU | GPU-3 after QM6; GPU-5 after QM8 | Batch adjacent runs into one grant when the owner allows (e.g. GPU-3, GPU-4 and GPU-5 together) |

**Implementer spec template** (orchestrator pastes it; one commit per spec):
```
Worktree: /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine  (Git Bash; see section B)
Read: project/work/plans/JG-033-quiet-machine-integration.md sections B, C, D/<QMn> and J only.
Do: exactly the edits in D/<QMn>. Files: <list>. Nothing else.
Do not touch: section C does-not-touch list; the 3 untracked strays.
Run: the commit protocol (section B, steps 1-9), including every mutation.
Return: commit SHA; `git show --stat HEAD`; gate outputs (tails); each mutation's red lines;
        U.4 JSON; anything you could not do, stated plainly.
```

**Orchestrator verification on every hand-back** (reports are claims):
1. `git log --oneline -3` and `git show --stat HEAD`: only the listed files; no strays staged.
2. Re-run U.1 (post-commit), U.2, B.2 and the commit's own greps. Compare them with the report.
3. `stat -c '%y %n'` on each changed file vs the commit time; `git log -1 --format=%cI`.
4. Grep `qm-commit-gates.md` for the commit's section and one red line per mutation.
5. For QM1, QM2, QM4, QM6, QM9 and QM9b, spawn the Opus / medium review with the diff and the structure section.

**Review cap.** At most two review rounds per commit. After round two, unresolved findings go to the owner with the diff, not into a third round.

## G. Open owner questions (structure §9)
| Q | Default this plan assumes | If the owner answers differently |
|---|---|---|
| Q1 branch hygiene | **RULED (a) by the owner, 2026-10-09.** (a): stay on `quiet-machine/integration`, QM1-QM4 = "shell v1", rebase onto the JG-035 tip before QM1 if it moved. QM1 pre-flight: verify the JG-035 tips have not moved (Q1 itself is ruled) | (b) `page-shell/v1`: QM1, QM2 and the shell half of QM4 move to a new branch from `$BASE`, and QM4 splits into a shell commit (entry HTML shell block, `pages`/fade tests, `vite.config.ts`) and a QM commit (preview edits, verifiers); add merges into both tracks. (c): rebase before every commit; `BASE` becomes the rebased docs commit; U.4 base rebuilt each time the base moves |
| Q2 merge target | `codex/jg033-signature-shot`, no push or PR | `main`: wait until `main` catches up; nothing in QM0-QM11 changes |
| Q3 Astra and the fade | (a) the QM half goes in the GPU-8 packet; a second call at cutover with consent | (b) drop the fade recordings from GPU-8; the fade stays "not done" until cutover |
| Q4 fade receiver on `/` | no | QM4 also adds the fade sub-block to `index.html` inside the shell markers; the `jgun` row gets `fadeIn:true`; the gate `grep -c jg:fade dist/index.html` expects 1. This changes the torque page, so U.4(a) may change: owner-accepted then |
| Q5 deep links | statuses `cutover` / `jg-037` as in QM1 | rows flip to `active` in QM1 and the redirect block in QM4 grows. This changes Station 2/M249 behaviour on the live page: needs explicit owner consent |
| Q6 QM extensibility | keep `SHOTS` `from`/`to` | QM7b converts to duration weights (`SHOTS[i].weight`, derived `from`/`to`), with a test that appending a shot leaves the existing shots' relative order and their copy unchanged |
| Q7 GPU windows | owner asks the JG-035 session per run | if a standing window is given, batch GPU runs into it; if a message in that worktree is preferred, the orchestrator drafts it for the owner to send |
| Q8 TODO/INDEX | QM11 edits the JG-033 block and row once | QM11 drops `TODO.md` and `INDEX.md` and writes status only in the JG-033 plan |

## H. Risks (top 8)
| # | Risk | Detection | Mitigation |
|---|---|---|---|
| 1 | JGUN's fetched CSS/JS changes with no JGUN source edit (Tailwind scanning `src/` and `index.html`; the shared vendor chunk) | U.4 at every code commit; GPU-1 JGUN `--quick` before and after | rename tokens to `qm-*`/`shell-*`; `manualChunks`; otherwise stop for Opus and the owner |
| 2 | Owner rulings (pending since 2026-09-15) stall QM7b and everything after it | GPU-2 packet sent with a dated ask | run QM6, QM8 and QM9 static work meanwhile; never apply an unruled visual |
| 3 | Triangle budget 1,201k vs ~500k does not close | GPU-5 table, GPU-6 p95 | QM9 code cuts; QM9b Blender asset; accept the measured number only with device-named p95 (handoff §2.5) |
| 4 | GPU contention with the JG-035 session | no grant | batch runs; static work proceeds; never take a port unasked |
| 5 | A gate passes for the wrong reason (self-matching regex, a grep that misses a template string, a vacuous parity check) | section I defects; mutations recorded per commit | each new gate must show red under its mutation before it counts |
| 6 | bfcache Back shows QM's poster (context lost while frozen) | GPU-3 Back case | record it and raise it with the owner; no silent patch |
| 7 | The fade is only half-built until cutover | — | Q3; the "done" status of the fade waits for the cutover Astra call |
| 8 | Lane reports wrong in either direction | orchestrator verification (section F) | git, mtimes and greps over narrative |

**UNVERIFIED until a build exists** (structure §1a, §8, reconciled):
- Gate U.4's script and pass rule (never run; no `dist` in this worktree).
- Whether Vite's config bundler resolves `./src/shared/pages` from `vite.config.ts`.
- JGUN load after the multi-page build: the shared vendor chunk, and JGUN CSS after QM/shell classes and copy are added.
- `appType:'mpa'` side effects in dev (`/` index, HMR, unknown paths).
- QM look under the entry CSS (D11), measured at GPU-1 against a base-build capture.
- Whether `verify-jg033-preview` runs cleanly against a preview build rather than the dev server.
- Paint-holding and white frames on Safari and Firefox; WebKit/Firefox runs only if installed.
- bfcache Back to QM with a live canvas and the tier kept; QM fade release time vs the 2.5 s cap.
- Host behaviour: `/quiet-machine` to `/quiet-machine/`, query-string redirects (needs an authorised preview deploy).
- Per-pass split of the 1,201k triangles; ribbon share without a toggle.
- Desktop GPU and phone models; phone reachability of the granted port.
- Whether the `@tailwindcss/vite` plugin also scans module-graph files beyond `source("./")` and `@source` (U.4 detects either way).

## I. Structure defects found
| # | Defect (structure location) | Plan reading |
|---|---|---|
| 1 | §2 contract rule and `shellBoundary.test.ts`: the no-scroll-length regex text itself contains `innerHeight`/`scrollHeight`, and the test files live in `src/shared/`, so the gate would match itself | Rule 1 scans non-test files only (QM1) |
| 2 | §4 QM9b gate `grep -c "msp-enclosure.glb"`: the full-tier request in `verify-jg033-preview.mjs` is `` `${base}/models/${quality === 'lite' ? 'rl300-lite' : 'msp-enclosure'}.glb` ``, which that pattern does not match, so a missed edit passes | grep the bare `msp-enclosure` (QM9b) |
| 3 | §4 QM9b gate `git ls-files public/models/rl300-*.glb` "prints each new path": it also prints the already-tracked `public/models/rl300-lite.glb` | expected output includes it |
| 4 | §4 QM3: the reduced-motion block is also the only `webglcontextlost` to poster check. Making reduced motion poster leaves no canvas there to lose | QM3 moves the context-loss check to a normal-motion page |
| 5 | §0 N6 and §8 say QM3 fixes the red reduced-motion case. At QM3's tree, `src/App.tsx` (does-not-touch) still sends reduced-motion `/?study=rl300` to JGUN's poster, so the case can only pass from QM4 | the case asserts QM-specific DOM; its first runtime proof is GPU-1 |
| 6 | §4 QM4 "a QM4 build check: no `scrollStore`/`qualityStore` module in the QM entry's chunk graph" has no command, and the Vite manifest does not list inner modules | sourcemap-based check following `imports` and `dynamicImports` (QM4) |
| 7 | §1 `pageTopology.test.ts` "fade sub-block byte-identical in every entry with `fadeIn:true`": only one entry has `fadeIn:true` in this track, so parity is vacuous and the QM4 "change one byte" mutation cannot go red | the test pins a `FADE_BLOCK_SHA256` literal (QM4) |
| 8 | §6 GPU-1 "QM stop-0 pixel diff vs ev-28 captures": evidence 28 records no captures ("no captures or contact sheet") | GPU-1 part 1 captures QM stop 0 from the base build as the reference |
| 9 | §4 gate column lists GPU runs (QM4, QM6, QM7, QM9, QM9b) inside commit gates, and QM6/QM7 mutations need a running server | commits land on static gates; GPU results and runtime mutations are recorded against the SHA in the next commit; the next dependent commit waits for the run (section B step 8) |
| 10 | §1 QM4 row "header `:64` becomes `<PageNav variant="header">`" would drop the "MARK HINTZ" brand link, which no ruling removes | the brand becomes a `PageLink` to `/`, followed by `PageNav` header (QM4); the owner sees it at GPU-2 |
| 11 | §4 QM9 file list omits `scripts/verify-jg033-preview.mjs`. Skipping caps while closed leaves `__quietMachine.capTarget` undefined at the `['exterior', 0]` anchor, where the verifier dereferences `telemetry.capTarget.stencilBits`, so GPU-6 and GPU-7 would throw | QM9 also edits the verifier: `capTarget` is asserted only at open anchors, plus one "caps rendered" assert per viewport (U.1 allows the file) |
| 12 | §1a U.4 "the set of repo-relative sourcemap `sources`" does not say how to normalise. The two builds come from different worktrees into an outside directory, so raw `sources` differ by location | the script resolves against each map's directory and relativises to `--base-root`/`--new-root`; QM1 adds a cross-worktree null test |
| 13 | §4 QM4 row "Mut: delete the `study` row and `pageTopology` goes red" (with §1 W1 `pageTopology.test.ts`: run against a stub `location`, the redirect "redirects exactly the `active` rows and passes the others through"): if the redirect case feeds only inputs taken from `LEGACY_REDIRECTS`, deleting the row removes the only `active` input; the remaining rows are not redirected, so the test stays green. The "exactly one active row" check lives in `pages.test.ts`, which that mutation does not run | `pageTopology.test.ts` probes a fixed input list that includes `?study=rl300`, asserts `replace` is called iff an `active` row covers the input, and asserts at least one `active` row exists (QM4) |
| 14 | §1 manifest W5 says `src/scene/rl300/prepareModel.ts` is "QM9b only", while the §4 QM7b row allows `src/scene/rl300/**` "as the rulings require", and ruling item 4 (reservoir 1019 vs 1020) is a `PART_POLICY` edit. The QM7b row also lists only the poster loop for `verify-jg033-preview.mjs`, but that script restates the ruling (`RULING.keep`) and pins `108 + 24 + removed` and `removedTriangles 460` | QM7b may edit `prepareModel.ts` at the `PART_POLICY` data level only; matching and loading logic stays QM9b. If item 4 changes the kept part, QM7b also updates `RULING` and the count asserts, each re-derived and justified in evidence |

## J. Implementer cheat sheet (one page)
| Topic | Rule |
|---|---|
| Worktree | `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`, branch `quiet-machine/integration`. Never edit `jgun-portfolio` (JG-035 session) or `jgun-torque-wrench` |
| Shell | Git Bash. From PowerShell: save the block to a scratch `.sh` file outside the repo and run `& 'C:\Program Files\Git\bin\bash.exe' <file>` (section B; `-lc '…'` breaks on blocks with single quotes). Never a bare `bash` (WSL) |
| Dependencies | this worktree (and any lane worktree) starts with no `node_modules`: `npm ci` first (QM1 pre-flight 2), then B on the unmodified tree, recorded before any edit. `package.json`/`package-lock.json` must stay unchanged |
| Node | `npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2`; single test files with `npx vitest run <path>`; Vite with `npx vite …`; Playwright from the `playwright` devDependency |
| Python | not needed. If ever needed, call an explicit interpreter path and name it in the report; never a bare `python` |
| Ports | 4173/4174/5203/5205 belong to the JG-035 session. Use only the port the owner granted, with `--strictPort`. Restart it after every rebuild |
| GPU | only the GPU seat, only with a grant |
| Do not touch | section C list (torque page source, `src/index.css`, `public/models/msp-enclosure.glb`, `package.json`, `.gitignore`, station2/jg036/jg032 scripts) |
| Staging | by explicit path only; never `-A`, `.`, `-a`; never `git stash`; never push. Leave the strays `2`, `key`, `document.querySelector('.qm-poster` alone |
| Gates | section B; run the fenced blocks as written (literal SHA and paths; no variable carried over from an earlier call); `grep -c` printing `0` exits 1 and that is a pass |
| Fixes | a GPU run that fails after `QMn` landed is fixed by a `QMn-fix` commit (section B step 8): same seat, same gates, evidence under `## QMn-fix` |
| Mutations | stage the good version, mutate, run, copy the red lines, `git restore <file>`, run green |
| Class names | new CSS classes are `qm-*` or `shell-*`. Copy and comments in `src/` and `index.html` are Tailwind-scanned: words like `fixed`, `block`, `hidden`, `static` can change JGUN's CSS (U.4 catches it) |
| Tests | Vitest runs in node: no DOM. Use pure exported helpers, `react-dom/server` static markup, and stubbed `matchMedia`/`location`. `preview.test.ts` is `.ts`, so use `createElement`, not JSX |
| Commit message | `JG-033 QMn: <summary>`. The harness adds the attribution trailer; do not write one |
| Evidence | per-commit: `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md`; per GPU run: `31-` to `38-` files |
| Visual work | nothing visual is "done" before the owner looks and Astra rules. Passing tests never override a visual rejection |
| Reports | facts only: SHA, `git show --stat`, gate tails, red lines, what was not done |
