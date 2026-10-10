# Quiet Machine commit gates

Per-commit gate output for the JG-033 Quiet Machine integration (plan: `project/work/plans/JG-033-quiet-machine-integration.md`, section D): tails of gate B, U.1-U.4, and each mutation's red then green output.

## QM0

Commit `0c0edc1f` (`JG-033 QM0: factual plan-doc fixes (page split, pin withdrawn, JG-032 d201ea8)`), docs only. Gate output re-run for QM1 at HEAD `0c0edc1f`, raw:

```
== HEAD
0c0edc1f JG-033 QM0: factual plan-doc fixes (page split, pin withdrawn, JG-032 d201ea8)
a8e8b4ea docs: QM0 kickoff handoff, skill shortlist, plan Skills row, superseded banner
== name-only HEAD~1 HEAD
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-rl300-quiet-machine.md
count: 2
== U.1 post
docs/HANDOFF-quiet-machine-2026-10-10.md
docs/HANDOFF-quiet-machine-2026-10-10b.md
docs/quiet-machine-integration-structure-2026-10-10.md
docs/quiet-machine-skill-shortlist-2026-10-10.md
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-quiet-machine-integration.md
project/work/plans/JG-033-rl300-quiet-machine.md
U.1 grep exit: 1
== U.2
hunks=0 removed=0 first= last=
== U.3
> node scripts/check-station2-contract.mjs

Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
U.3 exit: 0
== status
?? 2
?? document.querySelector('.qm-poster
?? key
== torque/protected paths touched since 666cbf23 (expect none)
protected grep exit: 1
```

Note: the `U.1 post` list there is the `git diff --name-only 666cbf23 HEAD` set (it includes the plan and handoff docs that landed between the base and QM0). QM0's own two paths are the `name-only HEAD~1 HEAD` list above. `U.1 grep exit: 1` means nothing fell outside the allowlist.

## QM1

### Pre-flight: B on the unmodified tree

JG-035 tips (Q1 ruled (a): both candidate branches must still be at `eb550958`):

```
$ git log --oneline -1 codex/jg033-signature-shot
eb550958 JG-035 continuation: frozen-baseline roster evidence, corrected ring/lifecycle reruns (7/7 + 14/14), diagnostic quality-event timelines
$ git merge-base HEAD codex/jg033-signature-shot
eb550958c49c327ab4ef6d3c8446f6c4419c4eff
$ git log --oneline -1 codex/jg035-final-acceptance-2026-10-09
eb550958 JG-035 continuation: frozen-baseline roster evidence, corrected ring/lifecycle reruns (7/7 + 14/14), diagnostic quality-event timelines
$ git merge-base HEAD codex/jg035-final-acceptance-2026-10-09
eb550958c49c327ab4ef6d3c8446f6c4419c4eff
```

Gate B on the unmodified tree at `0c0edc1f` (`npm ci` exit 0; `git status --short -- package.json package-lock.json` printed nothing), tails:

```
B.1 typecheck   (tsc --noEmit)                B.1 exit 0
B.2 test        Test Files  41 passed (41)
                     Tests  435 passed (435)  B.2 exit 0
B.3 build       built in 7.78s                B.3 exit 0
B.4 station2    Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
                                              B.4 exit 0
status after:   ?? 2 / ?? document.querySelector('.qm-poster / ?? key
```

### U.4 base worktree

```
$ git -C /c/Users/Markimus/.buzz/REPOS/jgun-qm-base rev-parse HEAD
666cbf23d490352dc549b4730d3e9d14e042a5a4
$ npx vite build --sourcemap --manifest --emptyOutDir --outDir /c/Users/Markimus/.buzz/REPOS/qm-u4/base   (exit 0)
```

### U.4 base summary

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/base` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 1,
  "requestsBase": 3,
  "requestsNew": 3
}
```

### U.4 QM0

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/QM0` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 1,
  "requestsBase": 3,
  "requestsNew": 3
}
```
### Mutation M1

Add `const x = innerHeight` to `src/shared/pages.ts` (good version staged), then `npx vitest run src/shared/shellBoundary.test.ts`:

```
 ❯ src/shared/shellBoundary.test.ts (14 tests | 1 failed)
     × src/shared/pages.ts
 FAIL  src/shared/shellBoundary.test.ts > Rule 1: the shell carries no scroll length > src/shared/pages.ts
AssertionError: expected 'src/shared/pages.ts mentions "innerHe…' to be null
+ Received:
"src/shared/pages.ts mentions \"innerHeight\""
 Test Files  1 failed (1)
      Tests  1 failed | 13 passed (14)
```

RED: yes

`git restore src/shared/pages.ts`, re-run:

```
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

GREEN-AFTER: yes

### Mutation M2

Set the `m249` row to `reserved: false` (href and htmlEntry stay null), then `npx vitest run src/shared/pages.test.ts`:

```
 ❯ src/shared/pages.test.ts (25 tests | 2 failed)
     × marks a page reserved exactly when it has no href and no html entry
     × pins the m249 row as the reserved slot
 FAIL  src/shared/pages.test.ts > PAGES registry > marks a page reserved exactly when it has no href and no html entry
AssertionError: m249: reserved vs href: expected false to be true // Object.is equality
```

RED: yes

`git restore src/shared/pages.ts`, re-run:

```
 Test Files  1 passed (1)
      Tests  25 passed (25)
```

GREEN-AFTER: yes

### Mutation M3

Append the comment `// bg-[#123456]` to `src/shared/pages.ts`, build to `$U4/QM1-mut` (`npx vite build --sourcemap --manifest --emptyOutDir --outDir /c/Users/Markimus/.buzz/REPOS/qm-u4/QM1-mut`, exit 0), then the U.4 compare (`node scripts/check-qm-jgun-assets.mjs "$U4/base" "$U4/QM1-mut" --base-root /c/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root .`), exit 1:

```
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "5c374ec4ffe273f5693cb15da110f5b4e9b703e50c7a67394068bf8f12f6e94c",
  "cssEqual": false,
  "sourcesEqual": true,
```

RED: yes

`git restore src/shared/pages.ts`, rebuild to `$U4/QM1-mut`, compare again, exit 0:

```
  "cssEqual": true,
  "sourcesEqual": true,
```

GREEN-AFTER: yes

### Mutation M4

`cp -r $U4/QM1 $U4/QM1-mut2`, add `"src/fake.ts"` to `sources` of the entry chunk's map (`assets/index-DNmI5KJC.js.map`), then the compare only (no rebuild), exit 1:

```
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": false,
  "sourcesAdded": [
    "src/fake.ts"
  ],
```

RED: yes

The unmutated `$U4/QM1` compared against base again, exit 0:

```
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
```

GREEN-AFTER: yes

After the four mutations `git status --short` showed the four code files as `A ` (staged, no unstaged change) and only the three stray untracked files.

### U.4 QM1

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/QM1` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 1,
  "requestsBase": 3,
  "requestsNew": 3
}
```

### Gate B tails (QM1)

QM1 tree (4 new code files plus this file staged on `0c0edc1f`), all gates run with `VITEST_MAX_WORKERS=8`:

```
== staged paths (git diff --cached --name-only)
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
scripts/check-qm-jgun-assets.mjs
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
== B.1 typecheck
> tsc --noEmit
B.1 exit 0
== B.2 test
 Test Files  43 passed (43)
      Tests  474 passed (474)
B.2 exit 0
== B.3 build
✓ built in 12.37s
B.3 exit 0
== B.4 / U.3 station2
Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
B.4 exit 0
== U.1 pre-commit
U.1 grep exit: 1
== U.2
hunks=0 removed=0 first= last=
== package files (expect empty)
```

43 files / 474 tests is the 41 files / 435 tests of the unmodified tree plus `pages.test.ts` (25) and `shellBoundary.test.ts` (14).

B.2 and the default worker count (facts):
- A plain `npm test` (vitest default worker pool, 15 workers on this 16-thread machine) on the QM1 tree timed out 1 to 4 pre-existing tests at the 5000 ms default, in `src/scene/drawing/sheet/handwriting.test.ts`, `src/scene/drawing/sheet/portalGeometry.test.ts` and `src/scene/inspection/shaft/camera.test.ts`. The failing set varied run to run (4, 4, 3, 3, then 1, 1, 1, 1 failures).
- The same timeouts occurred with the QM1 files excluded (`npx vitest run --exclude "src/shared/**"`, the 41 files of the unmodified tree: 3 failed, 432 passed). They are not caused by the QM1 files.
- The three files pass when run alone (3 files, 36 tests, 6.85 s).
- With `VITEST_MAX_WORKERS=8` (environment variable only, no repo change) the full suite is green: 43 files, 474 tests (also green with 4 workers).
- The orchestrator's unmodified-tree pre-flight was green with default workers (41 files, 435 tests, 22:17). Cause of the later timeouts: resource contention in the worker pool is likely, not proven.
- Command that produced the green B.2 above: `VITEST_MAX_WORKERS=8 npm test`.

### Post-commit gates (QM1, run by the orchestrator after the Opus review)

```
HEAD: 3a0e5b94 JG-033 QM1: page registry, tier helpers, redirect table, boundary gate, U.4 compare script
-- git diff --name-only HEAD~1 HEAD
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
scripts/check-qm-jgun-assets.mjs
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
count: 5
-- U.1 post
docs/HANDOFF-quiet-machine-2026-10-10.md
docs/HANDOFF-quiet-machine-2026-10-10b.md
docs/quiet-machine-integration-structure-2026-10-10.md
docs/quiet-machine-skill-shortlist-2026-10-10.md
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-quiet-machine-integration.md
project/work/plans/JG-033-rl300-quiet-machine.md
scripts/check-qm-jgun-assets.mjs
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
U.1 grep exit: 1
-- U.2
hunks=0 removed=0 first= last=
```

## QM2

Fade runtime (`src/shared/pageFade.ts`) and generic nav (`src/shared/PageNav.tsx`) with injected-env tests, nothing imports them yet; plus review finding F1 (string-literal-aware `stripComments` in `src/shared/shellBoundary.test.ts`). Base `666cbf23`, parent `837139e6`. Mutations run with the good version staged.

### Mutation M1

Delete the `persisted` branch (the guard and the clearing of `data-fade` and `FADE_KEY`) in the `pageshow` handler of `src/shared/pageFade.ts`, then `npx vitest run src/shared/pageFade.test.ts`:

```
     × a persisted pageshow (bfcache) clears data-fade and the flag 5ms
 FAIL  src/shared/pageFade.test.ts > installPageFade > a persisted pageshow (bfcache) clears data-fade and the flag
AssertionError: expected 'out' to be null
 Test Files  1 failed (1)
      Tests  1 failed | 62 passed (63)
```

RED: yes

`git restore src/shared/pageFade.ts`, re-run:

```
 Test Files  1 passed (1)
      Tests  63 passed (63)
```

GREEN-AFTER: yes

### Mutation M2

Drop the `ctrlKey/metaKey/shiftKey/altKey` checks in `shouldIntercept` (leave `button === 0 && !defaultPrevented`), then `npx vitest run src/shared/pageFade.test.ts`:

```
     × leaves ctrl alone 8ms
     × leaves meta alone 1ms
     × leaves shift alone 1ms
     × leaves alt alone 1ms
     × leaves a ctrl click alone 2ms
     × leaves a meta click alone 1ms
     × leaves a shift click alone 0ms
     × leaves an alt click alone 0ms
AssertionError: expected true to be false // Object.is equality
AssertionError: expected 1 to be +0 // Object.is equality
 Test Files  1 failed (1)
      Tests  8 failed | 55 passed (63)
```

RED: yes

`git restore src/shared/pageFade.ts`, re-run:

```
 Test Files  1 passed (1)
      Tests  63 passed (63)
```

GREEN-AFTER: yes

### Mutation M3

F1: put the naive stripper (`src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')`) back in `src/shared/shellBoundary.test.ts`, then `npx vitest run src/shared/shellBoundary.test.ts`. The same 5 cases were also red when first written, against the unmodified QM1 stripper, before the scanner existed:

```
       × keeps code after a // inside a single-quoted string 5ms
       × keeps code after a quoted /* that a later */ would otherwise close 1ms
       × does not let a double-quoted /* swallow code up to a real block comment end 1ms
       × sees code after // or /* inside a template literal 1ms
       × honours backslash escapes, so an escaped quote does not end the string 1ms
AssertionError: expected undefined to be 'innerHeight' // Object.is equality
AssertionError: expected undefined to be 'innerHeight' // Object.is equality
AssertionError: expected undefined to be 'scrollTop' // Object.is equality
AssertionError: expected undefined to be 'innerHeight' // Object.is equality
AssertionError: expected undefined to be 'innerHeight' // Object.is equality
 Test Files  1 failed (1)
      Tests  5 failed | 19 passed (24)
```

RED: yes

`git restore src/shared/shellBoundary.test.ts`, re-run:

```
 Test Files  1 passed (1)
      Tests  24 passed (24)
```

GREEN-AFTER: yes

### U.4 QM2

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/QM2` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 1,
  "requestsBase": 3,
  "requestsNew": 3
}
```

### Gate B tails (QM2)

QM2 tree (4 new code files plus the F1 edit staged on `837139e6`; this file is staged after the append), default `npm test` worker count:

```
== staged paths (git diff --cached --name-only, code files at gate time)
src/shared/PageNav.test.tsx
src/shared/PageNav.tsx
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/shellBoundary.test.ts
== B.1 typecheck
> tsc --noEmit
B.1 exit 0
== B.2 test (attempt 1 of 1, no retry needed)
 Test Files  45 passed (45)
      Tests  557 passed (557)
B.2 exit 0
== B.3 build
✓ built in 8.10s
B.3 exit 0
== B.4 / U.3 station2
Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
B.4 exit 0
== U.1 pre-commit
U.1 grep exit: 1
== U.2
hunks=0 removed=0 first= last=
== package files (git status --short -- package.json package-lock.json, expect empty)
```

45 files / 557 tests is the 43 files / 474 tests of QM1 plus `pageFade.test.ts` (63), `PageNav.test.tsx` (10) and 10 new cases in `shellBoundary.test.ts` (24 tests, was 14).

The baseline timeout flake in `camera.test.ts`, `handwriting.test.ts` and `portalGeometry.test.ts` (QM1 section above) did not occur in this run.

### Post-commit gates (QM2, run by the orchestrator after the Opus review)

```
HEAD: 41c3a262 JG-033 QM2: page fade runtime and generic page nav (no consumer yet)
-- git diff --name-only HEAD~1 HEAD
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
src/shared/PageNav.test.tsx
src/shared/PageNav.tsx
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/shellBoundary.test.ts
count: 6
-- U.1 post
docs/HANDOFF-quiet-machine-2026-10-10.md
docs/HANDOFF-quiet-machine-2026-10-10b.md
docs/quiet-machine-integration-structure-2026-10-10.md
docs/quiet-machine-skill-shortlist-2026-10-10.md
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-quiet-machine-integration.md
project/work/plans/JG-033-rl300-quiet-machine.md
scripts/check-qm-jgun-assets.mjs
src/shared/PageNav.test.tsx
src/shared/PageNav.tsx
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
U.1 grep exit: 1
-- U.2
hunks=0 removed=0 first= last=
```

## QM3

Reduced motion becomes the poster path in `src/scene/rl300/QuietMachinePreview.tsx` (new pure export `initialStudyMode`, `MANUAL STUDY` branch deleted), with a table test, a static-markup test and the two verifier blocks (`reducedMotionPoster`, `contextLoss`). No `src/shared` import. Base `666cbf23`, parent `acf6b122`. Mutation run with the good version staged.

### Mutation M1

In `initialStudyMode`, return `poster: params.get('quality') === 'poster'` (drop `reducedMotion ||`) and `u: reducedMotion ? .52 : clamp01(...)`, then `npx vitest run src/scene/rl300/preview.test.ts`:

```
 FAIL  src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > initialStudyMode sends reduced motion to the poster at the requested shot, with no .52 special case
AssertionError: expected { poster: false, u: 0.52 } to deeply equal { poster: true, u: +0 }
 FAIL  src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > renders the poster and the static status, never manual WebGL, under prefers-reduced-motion
AssertionError: expected '<main class="qm-preview" data-reduced…' to contain 'qm-poster'
      Tests  2 failed | 27 passed (29)
```

RED: yes

`git restore src/scene/rl300/QuietMachinePreview.tsx` (from the index), re-run:

```
      Tests  29 passed (29)
```

GREEN-AFTER: yes

### U.4 QM3

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/QM3` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 1,
  "requestsBase": 3,
  "requestsNew": 3
}
```

### Gate B tails (QM3)

QM3 tree (3 code files staged on `acf6b122`; this file is staged after the append), default `npm test` worker count. B.2 passed on attempt 1, no retry needed. `node --check` is the only check run on the verifier script: it cannot pass at this tree (see the plan note under QM3) and was not executed.

```
== staged paths (git diff --cached --name-only, at gate time)
scripts/verify-jg033-preview.mjs
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
== B.1 typecheck
> tsc --noEmit

B.1 exit 0
== B.2 test
 Test Files  45 passed (45)
      Tests  561 passed (561)
B.2 exit 0
== B.3 build
✓ built in 7.20s
B.3 exit 0
== B.4 / U.3 station2
Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
B.4 exit 0
== U.1 pre-commit
U.1 grep exit: 1
== U.2
hunks=0 removed=0 first= last=
== node --check verifier
node --check exit 0
== preview.test.ts new cases
 ✓ src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > initialStudyMode sends reduced motion to the poster at the requested shot, with no .52 special case 0ms
 ✓ src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > initialStudyMode keeps normal motion on WebGL unless quality=poster is asked for 0ms
 ✓ src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > initialStudyMode clamps a shot outside 0-1 and treats a non-numeric shot as the opening frame 0ms
 ✓ src/scene/rl300/preview.test.ts > Quiet Machine preview reduced motion > renders the poster and the static status, never manual WebGL, under prefers-reduced-motion 7ms
      Tests  29 passed (29)
== package files (git status --short -- package.json package-lock.json, expect empty)
```

45 files / 561 tests is the 45 files / 557 tests of QM2 plus 4 new cases in `preview.test.ts` (29 tests, was 25).

### Post-commit gates (QM3, run by the orchestrator after the advisor review)

```
HEAD: 7d9796ee JG-033 QM3: reduced motion becomes the poster path in the Quiet Machine preview
-- git diff --name-only HEAD~1 HEAD
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
scripts/verify-jg033-preview.mjs
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
count: 4
-- U.1 post
docs/HANDOFF-quiet-machine-2026-10-10.md
docs/HANDOFF-quiet-machine-2026-10-10b.md
docs/quiet-machine-integration-structure-2026-10-10.md
docs/quiet-machine-skill-shortlist-2026-10-10.md
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-quiet-machine-integration.md
project/work/plans/JG-033-rl300-quiet-machine.md
scripts/check-qm-jgun-assets.mjs
scripts/verify-jg033-preview.mjs
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
src/shared/PageNav.test.tsx
src/shared/PageNav.tsx
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
U.1 grep exit: 1
-- U.2
hunks=0 removed=0 first= last=
```

## QM4

Multi-page build in `vite.config.ts` (`appType: 'mpa'`, `build.rollupOptions.input` derived from `PAGES`), the second HTML entry `quiet-machine/index.html` with the shell fade block, `src/quiet-machine-main.tsx`, the legacy redirect block in `index.html`, `PageLink`/`PageNav` and `releaseFadeWhen` in `QuietMachinePreview`, and the two verifier repoints. Also absorbs F-A (page stuck at `out`: hash-only links are not intercepted, an assign that throws recovers, a recovery at `FADE_MAX_AGE_MS`), F-D (getter traps), F-E (`baseURI` case), rule 4 and the F-B note in `shellBoundary.test.ts`, F-C (flag parsing parity tested by running the inline script against `isFreshFlag`), and the QM1 F2 `dynamicEntries` field in `check-qm-jgun-assets.mjs`. Base `666cbf23`, parent `1c78b2e7`. Mutations run with the good version staged.

### Mutation M1

Delete the `study` row of `LEGACY_REDIRECTS` in `src/shared/pages.ts` (the only `active` row), then `npx vitest run src/shared/pageTopology.test.ts`:

```
 FAIL  src/shared/pageTopology.test.ts > the redirect sub-block > at least one redirect row is active, and every active row targets the page the script names
AssertionError: expected 0 to be greater than 0
 FAIL  src/shared/pageTopology.test.ts > the redirect sub-block > probe "?study=rl300" redirects if and only if an active row covers it
AssertionError: redirected: /quiet-machine/: expected true to be false // Object.is equality
 FAIL  src/shared/pageTopology.test.ts > the redirect sub-block > probe "?study=rl300&quality=lite" redirects if and only if an active row covers it
AssertionError: redirected: /quiet-machine/?quality=lite: expected true to be false // Object.is equality
      Tests  3 failed | 26 passed (29)
```

RED: yes

`git restore src/shared/pages.ts` (not one of the 14 QM4 paths: the index equals HEAD for it, and `git diff --cached --name-only` does not list it), re-run:

```
      Tests  29 passed (29)
```

GREEN-AFTER: yes

### Mutation M2

In the QM fade sub-block (inside the shell block), `html { background: #05070a; }` becomes `html { background: #05070a; min-height: 100vh; }` (a real declaration, not a comment), then the same command:

```
 FAIL  src/shared/pageTopology.test.ts > the shell block > has no scroll length inside it, comments stripped
AssertionError: expected 'quiet-machine/index.html mentions "10…' to be null
 FAIL  src/shared/pageTopology.test.ts > the fade sub-block > is byte for byte the reviewed block, in every copy
AssertionError: quiet-machine/index.html fade block sha256: expected 'ad1d9ba8d2796aeb78d36188747057e2e258e…' to be '0748289c34751d9c7f32e3387d5f5766feaea…' // Object.is equality
      Tests  2 failed | 27 passed (29)
```

RED: yes

`git restore quiet-machine/index.html` (from the index), re-run:

```
      Tests  29 passed (29)
```

GREEN-AFTER: yes

### Mutation M3

One byte of the QM fade sub-block: the `::after` layer's `background: #05070a` becomes `#05070b`, then the same command:

```
 FAIL  src/shared/pageTopology.test.ts > the fade sub-block > is byte for byte the reviewed block, in every copy
AssertionError: quiet-machine/index.html fade block sha256: expected '4adcbb18b5ec8a04da94149750a480bf882b1…' to be '0748289c34751d9c7f32e3387d5f5766feaea…' // Object.is equality
      Tests  1 failed | 28 passed (29)
```

RED: yes

`git restore quiet-machine/index.html`, re-run:

```
      Tests  29 passed (29)
```

GREEN-AFTER: yes

### Mutation M4

F-A recovery: in `fadeNavigate`, delete the line `env.schedule(recover, FADE_MAX_AGE_MS)` (nothing then clears `out` when the navigation never unloads the page), then `npx vitest run src/shared/pageFade.test.ts`:

```
 FAIL  src/shared/pageFade.test.ts > installPageFade > recovery when the navigation does not unload the page > an assign that never unloads the page recovers at exactly FADE_MAX_AGE_MS after assign, not before
AssertionError: expected 'out' to be null
 FAIL  src/shared/pageFade.test.ts > installPageFade > recovery when the navigation does not unload the page > a second click after recovery navigates normally
AssertionError: expected 'out' to be null
 FAIL  src/shared/pageFade.test.ts > installPageFade > recovery when the navigation does not unload the page > a persisted pageshow and a newer navigation neutralise the older recovery
AssertionError: expected 'out' to be null
      Tests  3 failed | 74 passed (77)
```

RED: yes

`git restore src/shared/pageFade.ts` (from the index), re-run:

```
      Tests  77 passed (77)
```

GREEN-AFTER: yes

### Mutation M5

QM1 F2: `dynamicEntries` must see a change inside a dynamic chunk that the static-closure verdict cannot. A copy of the QM4 build (`qm-u4/QM4-mut-dyn`; the real build dir is not touched) gets `"src/fake.ts"` appended to the `sources` of `assets/SceneCanvas-DuIWxM2V.js.map` (manifest key `src/scene/SceneCanvas.tsx`, a dynamic entry of `index.html` present in both builds). Then `node scripts/check-qm-jgun-assets.mjs $U4/base $U4/QM4-mut-dyn --base-root /c/Users/Markimus/.buzz/REPOS/jgun-qm-base --new-root .`:

```
exit 0
cssEqual=true sourcesEqual=true
{"key":"src/scene/SceneCanvas.tsx","kind":"other","srcEqual":true,"cssEqual":true,"sourcesAdded":["src/fake.ts"],"addedCount":1,"removedCount":0}
```

RED: yes

The same compare on the unmutated `qm-u4/QM4` (all four `other` entries report no difference; exit stays 0):

```
exit 0
cssEqual=true sourcesEqual=true
{"key":"src/scene/SceneCanvas.tsx","kind":"other","srcEqual":true,"cssEqual":true,"sourcesAdded":[],"addedCount":0,"removedCount":0}
{"key":"src/scene/ScrollRig.tsx","kind":"other","srcEqual":true,"cssEqual":true,"sourcesAdded":[],"addedCount":0,"removedCount":0}
{"key":"src/components/BootSequence.tsx","kind":"other","srcEqual":true,"cssEqual":true,"sourcesAdded":[],"addedCount":0,"removedCount":0}
{"key":"src/components/RingInspection.tsx","kind":"other","srcEqual":true,"cssEqual":true,"sourcesAdded":[],"addedCount":0,"removedCount":0}
```

GREEN-AFTER: yes

(The fifth entry, `_QuietMachinePreview-BuW_rt65.js`, is `kind: "qm-preview"` and differs by design in both runs: 3 sources added under `src/shared/`, 30 removed because the preview chunk no longer imports the JGUN entry chunk.)

### Chunk-graph check (QM4)

`node chunk-graph.mjs $U4/QM4` (the plan's block, saved as a file): positive control from `index.html`, then the walk from `quiet-machine/index.html` over `imports` and `dynamicImports`.

```
control: 3 src/state/ sources in the JGUN graph
none
exit 0
```

### Chunk partition (QM4)

Base is one 1120 kB entry chunk. The two-entry build splits the JGUN entry into three static pieces and adds the QM entry, with the same module set (`sourcesEqual: true`). Sizes are raw kB; `modules` counts source-map `sources` by package.

```
base   index-DNmI5KJC.js        entry   1120  react 4, scheduler 2, react-dom 4, three 3, src/* (30)
QM4    jgun-BwmEedkA.js         entry    205  src/* (30)                         imports index-fDwt6Stp, BufferGeometryUtils
QM4    index-fDwt6Stp.js        shared   190  react 4, scheduler 2, react-dom 4  (NEW shared chunk, no three)
QM4    BufferGeometryUtils-*.js shared   722  three 3                            (the three core, now its own chunk)
QM4    quiet-machine-7-GbSq2K.js entry     0  src/quiet-machine-main.tsx         imports index-fDwt6Stp, QuietMachinePreview
QM4    QuietMachinePreview-*.js dynamic  11  src/scene 2, src/shared 3           imports index-fDwt6Stp only (base: the whole JGUN entry)
```

The QM entry's static closure is `index-fDwt6Stp` + `QuietMachinePreview` + `quiet-machine-*` (about 201 kB): no `three`, no R3F, no `src/state`. `dist/quiet-machine/index.html` carries `modulepreload` for `index-fDwt6Stp` and `QuietMachinePreview` only, and links `index-CddUWpSY.css` (the same file as `dist/index.html`) plus `QuietMachinePreview-TUd1Nev4.css`. `QuietMachineScene` stays behind the lazy import. `dist/index.html` links exactly one stylesheet, as in base, and preloads `index-fDwt6Stp` and `BufferGeometryUtils`. No `manualChunks` was needed.

### U.4 QM4

Compare of `C:/Users/Markimus/.buzz/REPOS/qm-u4/QM4` against `C:/Users/Markimus/.buzz/REPOS/qm-u4/base`: PASS.
chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.
dynamicEntries is informational (dynamic entries of `index.html` present in both builds) and never changes the verdict.

```json
{
  "cssHashBase": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssHashNew": "c95d01f6d2e17aba087e7ac10f21da0a6d028190a49795a7f2de32302949a152",
  "cssEqual": true,
  "sourcesEqual": true,
  "sourcesAdded": [],
  "sourcesRemoved": [],
  "chunksBase": 1,
  "chunksNew": 3,
  "requestsBase": 3,
  "requestsNew": 5,
  "dynamicEntries": [
    {
      "key": "src/scene/SceneCanvas.tsx",
      "kind": "other",
      "srcEqual": true,
      "cssEqual": true,
      "sourcesAdded": [],
      "sourcesRemoved": []
    },
    {
      "key": "src/scene/ScrollRig.tsx",
      "kind": "other",
      "srcEqual": true,
      "cssEqual": true,
      "sourcesAdded": [],
      "sourcesRemoved": []
    },
    {
      "key": "src/components/BootSequence.tsx",
      "kind": "other",
      "srcEqual": true,
      "cssEqual": true,
      "sourcesAdded": [],
      "sourcesRemoved": []
    },
    {
      "key": "_QuietMachinePreview-BuW_rt65.js",
      "baseKey": "_QuietMachinePreview-C15D7FDP.js",
      "kind": "qm-preview",
      "srcEqual": true,
      "cssEqual": true,
      "sourcesAdded": [
        "src/shared/PageNav.tsx",
        "src/shared/pageFade.ts",
        "src/shared/pages.ts"
      ],
      "sourcesRemoved": [
        "src/App.tsx",
        "src/components/AuthorshipNotes.tsx",
        "src/components/Chapters.tsx",
        "src/components/GdtSymbols.tsx",
        "src/components/IntroTitles.tsx",
        "src/components/StaticPoster.tsx",
        "src/components/StationNav.tsx",
        "src/components/TechnicalHUD.tsx",
        "src/components/ToleranceStations.tsx",
        "src/components/staticChapter.ts",
        "src/data/caseStudies.ts",
        "src/main.tsx",
        "src/scene/drawing/drawingGeometry.ts",
        "src/scene/drawing/electricalScore.ts",
        "src/scene/drawing/introTimeline.ts",
        "src/scene/drawing/scrollTracks.ts",
        "src/scene/drawing/sheet/breakthrough.ts",
        "src/scene/drawing/sheet/handwriting.ts",
        "src/scene/drawing/sheet/ink.ts",
        "src/scene/drawing/sheet/ownerAnnotations.ts",
        "src/scene/drawing/sheet/paperFlex.ts",
        "src/scene/drawing/sheet/referenceHandGlyphs.ts",
        "src/scene/inspection/session.ts",
        "src/scene/inspection/shaft/story.ts",
        "src/scene/inspection/story.ts",
        "src/scene/stations/stationData.ts",
        "src/scene/stations/stationStore.ts",
        "src/state/inspectionStore.ts",
        "src/state/qualityStore.ts",
        "src/state/scrollStore.ts"
      ]
    },
    {
      "key": "src/components/RingInspection.tsx",
      "kind": "other",
      "srcEqual": true,
      "cssEqual": true,
      "sourcesAdded": [],
      "sourcesRemoved": []
    }
  ]
}
```
### Gate B tails (QM4)

QM4 tree: 13 code, test and script paths staged on `1c78b2e7`; this file is the fourteenth, staged after the append. Default `npm test` worker count; B.2 passed on attempt 1, no retry needed (the known `camera`/`handwriting`/`portalGeometry` timeout flake did not occur). No browser run was made: `verify-jg033-preview.mjs` and `verify-jg033-ribbon-clipping.mjs` are repointed and `node --check`ed, not executed (GPU-1/GPU-2 own them).

```
== staged paths (git diff --cached --name-only, at gate time)
index.html
quiet-machine/index.html
scripts/check-qm-jgun-assets.mjs
scripts/verify-jg033-preview.mjs
scripts/verify-jg033-ribbon-clipping.mjs
src/quiet-machine-main.tsx
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/pageTopology.test.ts
src/shared/shellBoundary.test.ts
vite.config.ts
== B.1 typecheck
> tsc --noEmit

B.1 exit 0
== B.2 test
 Test Files  46 passed (46)
      Tests  610 passed (610)
B.2 exit 0
== B.3 build
dist/quiet-machine/index.html                   3.45 kB | gzip:   1.20 kB
✓ built in 6.63s
B.3 exit 0
== B.4 / U.3 station2
Stage2 contract passed: 2671600 bytes, 7 named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.
B.4 exit 0
== U.1 pre-commit
U.1 grep exit: 1
== U.2
hunks=1 removed=0 first=<!-- shell:begin --> last=<!-- shell:end -->
== node --check (both verifiers and the compare script)
node --check preview exit 0
node --check ribbon exit 0
node --check compare exit 0
== verifier greps
grep -c "dist/quiet-machine/index.html" scripts/verify-jg033-preview.mjs: 1
grep -c "readFileSync('dist/index.html')" scripts/verify-jg033-preview.mjs: 0
grep -c "study=rl300" scripts/verify-jg033-preview.mjs: 0
grep -c "study=rl300" scripts/verify-jg033-ribbon-clipping.mjs: 0
== two-entry build
test -f dist/quiet-machine/index.html: 0
grep -c jg:fade dist/index.html: 0
grep -c jg:fade dist/quiet-machine/index.html: 2
== package files (git status --short -- package.json package-lock.json, expect empty)
```

45 files / 561 tests is the QM3 tree; QM4 adds `pageTopology.test.ts` (1 file) and 49 tests: `pageTopology` 29, `pageFade` +14 (77 total), `shellBoundary` +2, `preview` +4.

### Post-commit gates (QM4, run by the orchestrator after the Opus review)

```
HEAD: 1f6c28be JG-033 QM4: multi-page build, Quiet Machine entry, legacy redirect, header nav, verifier repoints
-- git diff --name-only HEAD~1 HEAD
index.html
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
quiet-machine/index.html
scripts/check-qm-jgun-assets.mjs
scripts/verify-jg033-preview.mjs
scripts/verify-jg033-ribbon-clipping.mjs
src/quiet-machine-main.tsx
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/pageTopology.test.ts
src/shared/shellBoundary.test.ts
vite.config.ts
count: 14
-- U.1 post
docs/HANDOFF-quiet-machine-2026-10-10.md
docs/HANDOFF-quiet-machine-2026-10-10b.md
docs/quiet-machine-integration-structure-2026-10-10.md
docs/quiet-machine-skill-shortlist-2026-10-10.md
index.html
project/work/evidence/rl300-quiet-machine/qm-commit-gates.md
project/work/plans/JG-032-station2-thermal-visualization.md
project/work/plans/JG-033-quiet-machine-integration.md
project/work/plans/JG-033-rl300-quiet-machine.md
quiet-machine/index.html
scripts/check-qm-jgun-assets.mjs
scripts/verify-jg033-preview.mjs
scripts/verify-jg033-ribbon-clipping.mjs
src/quiet-machine-main.tsx
src/scene/rl300/QuietMachinePreview.tsx
src/scene/rl300/preview.test.ts
src/shared/PageNav.test.tsx
src/shared/PageNav.tsx
src/shared/pageFade.test.ts
src/shared/pageFade.ts
src/shared/pageTopology.test.ts
src/shared/pages.test.ts
src/shared/pages.ts
src/shared/shellBoundary.test.ts
vite.config.ts
U.1 grep exit: 1
-- U.2
hunks=1 removed=0 first=<!-- shell:begin --> last=<!-- shell:end -->
```
