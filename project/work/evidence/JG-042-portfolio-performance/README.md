# JG-042 execution evidence — 2026-11-06

Implementation and integration checks complete for the bounded tooling/hygiene scope; fresh review corrections in progress. No deployment authorized. Accepted plan: [JG-042](../../plans/JG-042-portfolio-performance.md).

P01 revalidation: original branch torque-wrench/rebuild, HEAD `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`, ahead three; no tracked modifications, concurrent untracked evidence/showcase/font media preserved. Isolated branch `codex/jg042-performance` at the same commit, with node_modules junction to the original workspace. Build: existing `npm run build` (tsc + Vite multi-page, unchanged settings/dependencies).

Live identity confirmed with Cloudflare GET project API: direct upload, canonical deployment `e796fe69-b95b-4de9-93b1-cdfd2844b343`, created `2026-11-04T19:07:05.801517Z`, source `f83f4ba3c380ee93da105ea0d102d3bc08cc5a31`, deploy stage success. Public torque HTML entry `torque-wrench-BsY9og6w.js`; entry source references `Scene-CgT8NRm_.js`. `/home/`, `/torque-wrench/`, `/quiet-machine/` HTTP 200 at www canonical URLs. This live identity differs from the pinned local baseline.

Lane protection: JG-041/showreel/logo source and tracked media belong to concurrent work. Road textures have direct references in RainFloor.tsx and StudioLighting.tsx and remain untouched. Exclude only proven unreferenced untracked showcase media and local-only font until tracked-media lane coordination exists. No incidental staging of originals.

Reviewer: Mark approved replacement `anthropic/claude-sonnet-5-5` / high after GLM timed out. A fresh direct review returned concrete findings; corrections and one follow-up are being completed. Standard review, balanced OpenAI preference, overall approval off. DeepSeek unavailable after two 429s; no retry pending.

No performance improvement is claimed. The artifact is byte-identical to the pinned clean baseline; source build policy prevents local media contamination.

## Execution status

- P01: pinned local/live identities and preserved isolated baseline built successfully; baseline-identity.json includes lock and all artifact file hashes plus source input hashes. Baseline launch gate: 156 files, 53 required present, no M249.
- P02: repaired natural-pair producer and focused contract tests implemented; two early smoke attempts retained INVALID, third smoke 2/2 valid. Completed five cold/repeat pairs per desktop/narrow home/QM/torque route: 60/60 functionally valid. Summary explicitly excludes original narrow-torque timing group because its tail overlapped a build. Readiness polling resolution is up to 1000 ms plus evaluation latency. Separate fresh-context valid/missing/stale cache diagnostics: 6/6 functional PASS. Full Lean-V1 performance budget/shader/hardware acceptance is not claimed.
- P03: four NEW exact local-only build exclusions implemented, in addition to the pre-existing M249 exclusion. Original-inventory contamination build PASS, all 156 output files byte-identical to clean baseline. Tracked showreel/bumper exclusions deferred pending lane coordination; referenced road textures kept. Focused exclusion test verifies originals preserved. No plugin wiring change: existing Vite registration remains.
- P04: baseline request/trace diagnostic exists; study requests start after input, both readiness gates observed. Decode/prep, GPU, energy and hidden-tab attribution remain unresolved; first .65 world checkpoint was stale and is not full scroll proof.
- P05/P06/P07/P09: deferred without adoption; no runtime/model/package/URL/header change.
- P08: no implementation for observed desktop baseline because study fetch is already late; wider timing conclusion remains bounded to observed cases.
- P10: committed implementation `fff71e0988de6d461c308c4ed8f31813f24329ad` independently checked in detached checkout: typecheck PASS, 41/41 pure Node tests PASS, production build PASS. Current review fixes add one median regression test. Final review disposition and corrected diagnostic rerun are recorded in the integration/review documents. No deployment acceptance inferred.
- P11: publication/deployment NOT authorized and not performed.

Details: [environment](measurement-environment.md), [original inventory](original-public-inventory.md), [attribution/dispositions](attribution-and-dispositions.md), [prerequisites](experiment-prerequisites.md), [review scope](review-request.md). Failed attempts remain in their separate local folders. Raw CDP trace and bulky local diagnostic material are not included by incidental staging.
