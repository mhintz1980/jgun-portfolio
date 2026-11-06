# JG-042 integration candidate

Conditional implementation scope P01–P10; P11 publication approval absent. Product-build implementation commit `fff71e0988de6d461c308c4ed8f31813f24329ad`, with JS-only measurement/review corrections following. Only build/excludePublicAssets.ts changes product build behavior: four NEW local-only exclusions plus the pre-existing M249 exclusion. Vite already registers the plugin. Runtime source, dependencies, model bytes, cache headers and stable URLs are untouched. Tooling/docs/tests are added separately.

## Artifact and hygiene evidence

- Original clean source baseline: `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`.
- Original media inventory validated before exclusion; the four untracked originals were copied into the isolated public directories for a real contamination build. They were never staged. Original public files are preserved.
- `npm run build` PASS (tsc + Vite 7.3.6; existing large-chunk warning).
- Candidate `verify-launch-dist.mjs`: 156 files, 53 required assets present, no M249 or hashed Draco copies.
- Candidate file path/byte/hash array is **exactly equal for all 156 files** to baseline-identity.json. Artifact manifest SHA-256 `f624a566bd5571ecef8a0dab052d7b13dc066efc11452f3241b241836c6b7bef`, 105,943,955 bytes. Only source build-policy input hash changes; no runtime output changes.
- Four precise exclusions prevent 54,677,651 bytes of local-only contamination from an original-workspace build. This is neither a reduction from the clean baseline nor a loading-speed result. Tracked showreel/bumper media and referenced road textures remain; broader exclusions deferred pending lane coordination.
- All public/private route HTML, assets, fonts, models, decoders and cache headers retain baseline bytes. Final source commit will be verified in isolation before acceptance. Prior owner visual acceptance is not extended to undeployed baseline differences.

## Measurement evidence

`paired-baseline/summary.json` and `runs.jsonl`: 60/60 valid natural records — five fresh-context cold + same-context repeat pairs for each desktop/narrow × home/QM/torque combination. Torque rows reach both scene and inspection readiness gates and verify forward/reverse effective-world progress. HTTP transfer, boot/ready, sustained forward/reverse and idle windows are separate. Actual Chromium version, viewport/DPR, observed tier/renderer and cache events are recorded. Same-context repeat does not promise cache hits under the preview server's response policy.

Timing limits: five samples per kind/profile are a local lab sample, no CPU/network throttling, no physical mobile, no controlled power/hidden-tab state. The candidate build overlapped the tail of the narrow torque roster (pairs 4–5 potentially affected); keep those rows as functional evidence but exclude their timings from any performance comparison. No performance improvement or regression estimate is adopted from this run. Optional experiments requiring a gain beyond variation remain deferred. Pure task-test execution and unrelated host activity are additional noise sources. No GPU execution or isolated decode/prep attribution is claimed.

Separate valid/missing/stale drawing-cache diagnostics on candidate preview :5272: **6/6 functional PASS**, with explicit request interception, fixture version/hash and fresh contexts (startup-cache-candidate/startup-cache-conditions.json). These cannot be pooled with natural repeat HTTP-cache timings or full contract-18/Lean-V1 performance acceptance. Existing verify-torque-performance-contract.mjs and thresholds remain unchanged. Readiness observation resolution is up to 1000 ms plus evaluation latency. Home readiness is DOM-only; home/QM scroll checks do not prove scene pixels.

## Experiment decisions

P05 model export deferred (no decoded topology/draw parity, paired prep gain or visual acceptance); P06 loader removal deferred (no demonstrated bundle delta and full decode comparison); P07 DPR deferred (owner parity required); P08 closed without implementation for measured already-late study path; P09 R3F/three lanes deferred (no reproduced applicable defect or measured benefit). None was silently adopted. P04 prep/GPU/energy attribution stays unresolved.

## Review and rollback

GLM review unavailable (180-second timeout, no content). Owner-approved Sonnet 5.5/high replacement selected before dispatch. Native route produced no report within its bounded window and was stopped. First direct Sonnet attempt exhausted output on reasoning with no verdict; corrected budget delivered a fresh qualified review with findings. See fresh-review-sonnet-final.md and review-disposition.md. Author corrections and the one final follow-up are recorded separately; pending follow-up is not acceptance.

Detached committed-tree check at verify-fff71e0 with only node_modules junction: typecheck PASS, 41/41 pure Node tests PASS, production build PASS. No unstaged runtime/TypeScript file was needed. Candidate and detached build output comparisons are recorded in the verification results. Review fixes add one pure Node median test and clarify evidence; they change no application bytes.

Rollback before publication: revert only the JG-042 implementation commit(s), rebuild, verify the artifact; preserve shared history and concurrent lanes. No upload/push/deployment is performed by this work. Live remains e796fe69 from f83f4ba3 until separately authorized.
