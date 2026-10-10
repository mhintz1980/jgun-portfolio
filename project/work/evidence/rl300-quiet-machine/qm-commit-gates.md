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
