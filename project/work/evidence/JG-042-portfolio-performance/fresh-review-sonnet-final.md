# JG-042 round 2 integration review

## Scope and limitations
- No round-1 findings were supplied, so I cannot confirm that any specific prior finding is resolved. I reviewed the pack as it stands, and findings below are against the supplied files only.
- Not supplied, so not verified:
  - `vite.config.ts` (plugin wiring)
  - `scripts/verify-launch-dist.mjs`
  - the cache-condition results
  - `runs.jsonl`
  - any build or test logs
- I did not execute anything. The unit-test expectations I traced by hand (`windowTasks`, `parseOptions`, `validateIdentity`, `runPair`) are consistent with the code.

## Findings

**1. Medium (product build): five exclusions in code, four in the docs, and the wiring is unshown.**
- `build/excludePublicAssets.ts:9-15` lists five paths, including `models/m249-transformed.glb`. `original-public-inventory.md`, `integration.md`, `README.md` and `review-request.md` all say "four exact exclusions", and the 54,677,651-byte figure sums only the four.
- The baseline launch gate already reported "no M249", so the fifth entry is either a duplicate of an existing mechanism or a silent policy change.
- `integration.md` says "Only `build/excludePublicAssets.ts` changes product build behavior". A new plugin must also be registered in `vite.config.ts`, which is not in the pack, so I cannot verify the registration.
- Consequence: the one product-affecting change is under-described and unverifiable.
- Smallest fix: state the M249 provenance (pre-existing or new). Correct "four" to "four local-only plus M249", or drop the fifth entry. Include the `vite.config.ts` diff in the pack.

**2. Medium (measurement validity): `readyMs` has a resolution of up to 1000 ms.**
- `measure-portfolio-performance.mjs:10` sets `polling: 1000`, and lines 121-124 take `readyMs` after the poll returns. `readyMs` is therefore the next poll tick, not the time readiness occurred.
- This is consistent with the tight clustering of quiet-machine values in `summary.json` (1741.7–1849.8 ms for four of five desktop cold samples).
- `limitations` (lines 56-59) does not disclose this.
- Consequence: any future comparison of medians is blind to differences under about 1 s. The 5-sample medians also carry this error.
- Smallest fix: add a limitation line, "readiness resolution ≤1000 ms". Better, poll cheap predicates (home, quiet-machine) at `raf` or 100 ms and keep 1000 ms only for the torque snapshot.

**3. Medium (evidence integrity): the roster contains rows the docs say not to use, and the summary does not mark them.**
- `integration.md` says narrow torque pairs 4–5 overlapped a build and their timings must be excluded.
- `summary.json` still counts all 60 rows as valid. The narrow torque medians and ranges (21–34 s) include those rows with no flag.
- Consequence: the summary is the artifact most likely to be quoted, and it carries the contaminated numbers unmarked.
- Smallest fix: add a `timingExcluded` annotation to `summary.json` and the affected rows, or note the exclusion inside `summary.json` itself.

**4. Medium (diagnostic): the attribution script contradicts the producer's own readiness lesson, and the evidence predates it.**
- `capture-portfolio-attribution.mjs:47-48` calls `waitForFunction` with default `raf` polling. Each call evaluates `__torqueWorld.snapshot()`, which `measure-portfolio-performance.mjs:96-98` and `README.md:18` describe as too expensive to poll per frame.
- It also requires world progress within .01 of the target at .62 and .65, while the producer says world progress may hold at .60 while the study loads.
- `attribution-and-dispositions.md:16` says the script was corrected after the first report. The tables come from the pre-correction run, and no rerun of the corrected script is recorded.
- Consequence: the committed script is not demonstrated to complete, and the quoted timings may not match its behavior.
- Smallest fix: rerun the corrected script and record the result. Otherwise label the table "pre-correction run" and drop the dual-clock seek for pre-readiness steps.

**5. Low-medium (diagnostic): the capture script's byte checks run during boot.**
- `capture-portfolio-attribution.mjs:76-82` fetches the entry, scene and the ~10.7 MB `Default.glb` right after `domcontentloaded`. This contends with the page's own boot fetch of `Default.glb`, which the table reports starting at 844 ms.
- It undermines the "Default.glb before scene-ready" timing, though the trace is already labeled perturbing.
- Smallest fix: move the checks to after the run, as the producer's Node preflight does.

**6. Low (identity claims):**
- `measure-portfolio-performance.mjs:13-21,52` hashes the served bytes once at startup and stamps that `servedIdentity` on every row. Rows after hour-long rosters are not re-verified.
  - Fix: re-run the preflight at the end, or rename the field `preflightIdentity`.
- `measure-startup-cache-conditions.mjs:14,23-24` only calls `validateIdentity` (structure) and hashes the HTML at `/torque-wrench/index.html`. It never verifies entry or scene bytes, or the navigated document, yet it emits `artifactManifestSha256`.
  - Fix: reuse the producer's preflight.
- `candidate-identity.json` carries `source` equal to the baseline commit and no `sourceDiffSha256`, so identity cannot distinguish the candidate from the baseline. `integration.md` discloses that a committed-tree identity will be appended.
  - Fix: append it before acceptance.

**7. Low (stale docs):**
- `README.md:18` says the five-pair roster is "running" and the cache producer "not yet run". `README.md:19` says the contamination build is "pending". `integration.md` says the roster is complete (60/60) and the contamination build was done.
- `integration.md` says the cache diagnostics were "appended separately", but no result file is in the pack.
- `review-request.md:5` and `experiment-prerequisites.md:38` still say "No model substitution" and "GLM-5.3 selected", contradicting the substitution recorded at the top of the request.
- `integration.md` says "Candidate source is currently the pinned baseline plus the reviewed diff" while the identity carries the baseline hash.
- Fix: update the stale lines. The review-result record should not read as acceptance by default.

**8. Low and optional:**
- `parseOptions` allows duplicate `--profiles` or `--routes`, which would pool rows into the same group.
- `summary.json` computes `median` as the upper-middle value when the valid count is even (possible for `--pairs` ≥ 6).
- The 'ready' predicate for home (`!!document.querySelector('main')`) and the home and quiet-machine scroll checks verify only page scroll, not scene response. This is not listed in `limitations`.
- The start-and-end `page.evaluate` calls for window bounds add latency under long tasks.
- The plugin test (`public-asset-exclusions.node-test.mjs`) does not cover the throw path of `excludePublicAssets`. I checked the plugin logic and the "force" removal behaviour holds.
- The stale and missing cache conditions are indistinguishable (both yield `precomputed === 0`), which the limitations do not state.

## Checked and found sound
- Cold/repeat lifecycle: `runPair` reuses the context, closes it on failure, and carries the same `pairId`.
- Cache-state labels do not promise hits, and requests record `fromDiskCache`.
- Long-task window apportionment (`windowTasks`) is correct, and the timelines match (`performance.now()` against longtask `startTime`).
- Route-fallback rejection, the `Object.hasOwn` guards and the bounded options are sound.
- The sustained-input world-progress check throws on `null`, so a stalled world fails the row.
- Failures are recorded, not dropped: invalid rows are retained and count toward `invalid`, with `valid` requiring zero errors.
- The `Math.floor(intervals.length * .95)` percentile handles the empty case.
- The disclosed limitations are mostly truthful: local emulation, no GPU timing, tier observed only at checkpoints, Lean-V1 explicitly UNVERIFIED, and no improvement claimed.

## Verdict: CHANGES_REQUIRED
This is bounded to documentation and evidence corrections: findings 1, 2, 3 and 7, plus the finding 4 rerun or relabel. Findings 5, 6 and 8 are optional. No product runtime change is implied. Once findings 1, 2, 3 and 7 are addressed, I would expect acceptance of the tooling scope. This review grants no deployment authorization.