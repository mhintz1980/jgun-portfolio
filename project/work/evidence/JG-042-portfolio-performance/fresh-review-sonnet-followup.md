# JG-042 round 2 integration review

## Scope and limitations
- I read the supplied files and hand-traced the unit tests (`parseOptions`, `validateIdentity`, `windowTasks`, `median`, `runPair`, the plugin test). All expectations are consistent with the code.
- I ran nothing: no build, tests, tsc or browser.
- These files were not supplied, so claims that rest on them are unverified:
  - `runs.jsonl`
  - `corrected-attribution/`
  - the replacement narrow-torque run
  - `baseline-identity.json`
  - the verification logs
  - the git history (`git show 6ec4fe06:…`)

## Status of prior findings

| # | Prior finding | Status | Evidence |
|---|---|---|---|
| 1 | M249 and wiring provenance | **Resolved** | `vite.config.ts:7,32` registers `excludePublicAssets()`. `excludePublicAssets.ts:9-15` has 5 entries. `README.md:19` and `review-disposition.md` §1 state "4 new plus pre-existing M249". The pre-existing claim itself is unverified because the git history is not in the pack. |
| 2 | 1000 ms readiness resolution | **Resolved by disclosure** | `measure-portfolio-performance.mjs:55,59` records `readinessObservationResolutionMs` and a limitation line. `summary.json:227-228` repeats it. Polling is still 1000 ms, which is acceptable because no sub-second claim is made. |
| 3 | Contaminated narrow-torque timings | **Resolved** | `summary.json:188-224` nulls the median, min and max and sets `timingExcluded`. `:229-236` adds the reason and `timingEligibleRecords: 50` (60 − 10, correct). See R3 below. |
| 4 | Attribution script and stale evidence | **Resolved in code, evidence not in pack** | `capture-portfolio-attribution.mjs:53-58` seeks on narrative progress only. `:84,93` use 1 s polling. The dispositions doc labels the table "pre-correction" and records a rerun. |
| 5 | Byte checks during boot | **Resolved** | `capture-portfolio-attribution.mjs:17-24` runs Node fetches before browser launch. |
| 6 | Identity claims | **Mostly resolved** | The field is renamed to `preflightIdentity` (`measure…:19,52`). `measure-startup-cache-conditions.mjs:24-31,52` verifies HTML, entry, scene, `Default.glb`, fixture hash and navigated-document hash. `candidate-identity.json` now carries `fff71e0` and `sourceDiffSha256`. See R2 and R4. |
| 7 | Stale docs | **Mostly resolved** | See R5. |
| 8 | Optional items | **Resolved or disclosed** | `performance-contract.mjs:42` rejects duplicate keys. `:52-56` fixes the even-count median, and `node-test.mjs:12` covers it. The home and quiet-machine scroll limitation is at `measure…:60`. |

## Remaining findings

**R1 – Low (gate gap).**
- `excludePublicAssets.ts:3` says `scripts/verify-launch-dist.mjs` "re-checks dist/", but the gate only tests `m249` (`verify-launch-dist.mjs:40,68-69`).
- The four new exclusions are enforced only by the plugin's own throw (`excludePublicAssets.ts:30`). The post-build gate would not catch a future bypass such as a different build path or a plugin removal.
- Smallest fix: add a short forbidden-paths list to `verify-launch-dist.mjs`. Alternatively, reword the comment to say "M249 only".

**R2 – Low (evidence provenance).**
- Rows in `startup-cache-conditions.json` have no `preflightIdentity` or `readinessObservationResolutionMs` (compare the script at `measure-startup-cache-conditions.mjs:37-40`). The file was therefore produced by a pre-correction script version.
- The rows also carry the baseline `source` (`6ec4fe0…`) although the folder is named `-candidate`.
- The JSON `limitations` (`:780-783`) do not state that missing and stale are indistinguishable (both have `basePrecomputed: 0`). The disposition doc says this is a known limitation.
- Consequence: the evidence does not demonstrate the identity checks the doc credits to the script. The 6/6 functional result is otherwise sound and consistent with the rows.
- Smallest fix: rerun the 6-row script, or label this file "produced before identity hardening" and add the missing/stale limitation line.

**R3 – Low (reproducibility).**
- `summary.json` fields `timingExcluded`, `excludedReadinessMs`, `timingEligibleRecords`, `readinessIsObservedUpperBound` and `timingExcludedGroups` are not produced by `measure-portfolio-performance.mjs:173-181`. They were added post hoc.
- Consequence: regenerating the summary would silently drop the exclusion.
- Smallest fix: add a one-line `annotatedBy` or provenance note in the summary or the disposition doc.

**R4 – Medium for citing the evidence, not for the code (identity and tests not final).**
- `candidate-identity.json` pins `fff71e0` with an empty diff (`e3b0c442…` is the SHA-256 of empty input). That predates the JS-only corrections: the median fix, the `preflightIdentity` rename, and the cache and attribution script changes.
- `verification-results.md:10` and `README.md:23` still describe 41/41 tests on `fff71e0` and say the final results "will be appended". A median test was added since, so the count should be 42.
- The file is also a summary only (`files: 156` is a number, with no `sourceInputs`), so it cannot be used as `--identity` input.
- Smallest fix: before this evidence is quoted as final, append the final commit hash, the `tsc` result, the full `node --test` count and the build result at that commit.

**R5 – Low (doc residue).**
- `review-request.md:5` still reads "No model substitution" with `zai/glm-5.3`. The line 3 "Update:" supersedes it, but the contradiction remains.
- `README.md:3,11` say corrections are "in progress", while `experiment-prerequisites.md:38` says they are resolved.
- `measure-portfolio-performance.mjs:61` still says "servedIdentity" while the field is `preflightIdentity`.
- `attribution-and-dispositions.md:20` says all checkpoints match requested positions. The script (`:98`) only asserts inspection readiness plus zero errors, so the match claim rests on manual report inspection.
- The replacement narrow-torque timing run (`verification-results.md:5`) is not in the pack.

## Checked and sound (no new defects)
- `runPair` lifecycle, `pairId` sharing and close-on-failure.
- `windowTasks` apportionment and the option bounds.
- `validateIdentity` handling of the `scene` field.
- Plugin logic: `force` removal is safe on a clean checkout, and the post-removal existence check throws.
- The launch gate's required-asset count is 53, which matches the docs.
- Repeat runs are slower than cold for desktop torque (21.4 s vs 15.0 s median). The cache label makes no hit promise, and no performance claim is made. These groups must not be compared as cache effects.

## Remaining limitations: disclosed?
Yes, with one exception: R2's missing-vs-stale indistinguishability is disclosed in the disposition doc but not in the result artifact.

The following are disclosed truthfully:
- local emulation only
- 1 s readiness resolution
- DOM-only home readiness
- no GPU, power, hidden-tab or physical-mobile data
- Lean-V1 UNVERIFIED
- model and loader experiments deferred
- no speedup claim

## Verdict: ACCEPT (tooling and exclusion scope)
- No code defect or release blocker found. The product-affecting change is limited to the plugin and its wiring, and it is correctly described.
- Conditions are record-keeping only: R4 before any final citation, and R1 to R3 and R5 as low-severity cleanups.
- This review does not verify that the tests pass or that the build output is byte-identical to the baseline. It grants no deployment authorization.