# JG-042 execution evidence — 2026-11-06

Implementation and integration checks complete for the bounded tooling/hygiene scope; fresh review ACCEPT with documented limitations. No deployment authorized. Accepted plan: [JG-042](../../plans/JG-042-portfolio-performance.md).

P01 revalidation: original branch torque-wrench/rebuild, HEAD `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`, ahead three; no tracked modifications, concurrent untracked evidence/showcase/font media preserved. Isolated branch `codex/jg042-performance` at the same commit, with node_modules junction to the original workspace. Build: existing `npm run build` (tsc + Vite multi-page, unchanged settings/dependencies).

Live identity confirmed with Cloudflare GET project API: direct upload, canonical deployment `e796fe69-b95b-4de9-93b1-cdfd2844b343`, created `2026-11-04T19:07:05.801517Z`, source `f83f4ba3c380ee93da105ea0d102d3bc08cc5a31`, deploy stage success. Public torque HTML entry `torque-wrench-BsY9og6w.js`; entry source references `Scene-CgT8NRm_.js`. `/home/`, `/torque-wrench/`, `/quiet-machine/` HTTP 200 at www canonical URLs. This live identity differs from the pinned local baseline.

Lane protection: JG-041/showreel/logo source and tracked media belong to concurrent work. Road textures have direct references in RainFloor.tsx and StudioLighting.tsx and remain untouched. Exclude only proven unreferenced untracked showcase media and local-only font until tracked-media lane coordination exists. No incidental staging of originals.

Reviewer: Mark approved replacement `anthropic/claude-sonnet-5-5` / high after GLM timed out. The fresh review returned concrete findings; author corrections and one follow-up produced **ACCEPT (tooling and exclusion scope)**, no code defect/release blocker found. Review is pack-based and did not execute checks; parent independently ran the reported checks. Standard intensity, overall approval off. DeepSeek unavailable; no retry pending.

No performance improvement is claimed. The artifact is byte-identical to the pinned clean baseline; source build policy prevents local media contamination.

## Execution status

- P01: pinned local/live identities and preserved isolated baseline built successfully; baseline-identity.json includes lock and all artifact file hashes plus source input hashes. Baseline launch gate: 156 files, 53 required present, no M249.
- P02: repaired natural-pair producer and focused contract tests implemented; two early smoke attempts retained INVALID, third smoke 2/2 valid. Completed five cold/repeat pairs per desktop/narrow home/QM/torque route: 60/60 functionally valid. Summary explicitly excludes original narrow-torque timing group because its tail overlapped a build; separate replacement five-pair narrow run 10/10 valid. Readiness polling resolution is up to 1000 ms plus evaluation latency. Fresh-context valid/missing/stale cache diagnostics: original 6/6 PASS, identity-hardened rerun 6/6 PASS. Full Lean-V1 performance budget/shader/hardware acceptance is not claimed.
- P03: four NEW exact local-only build exclusions implemented, in addition to the pre-existing M249 exclusion. Original-inventory contamination build PASS, all 156 output files byte-identical to clean baseline. Tracked showreel/bumper exclusions deferred pending lane coordination; referenced road textures kept. Focused exclusion test verifies originals preserved. No plugin wiring change: existing Vite registration remains.
- P04: baseline request/trace diagnostic exists; study requests start after input, both readiness gates observed. Decode/prep, GPU, energy and hidden-tab attribution remain unresolved; first .65 world checkpoint was stale and is not full scroll proof.
- P05/P06/P07/P09: deferred without adoption; no runtime/model/package/URL/header change.
- P08: no implementation for observed desktop baseline because study fetch is already late; wider timing conclusion remains bounded to observed cases.
- P10: implementation `fff71e0` and review-corrected `aa4814b9dd41920542c2b89f190d85a73bfa89eb` independently checked in detached checkout: typecheck PASS; updated pure Node suite 42/42 PASS. Production artifact remains identical to baseline, with detached production build PASS. Fresh Sonnet follow-up ACCEPT, limitations retained. Separate replacement narrow torque run 10/10 valid; old timing exclusion remains. No deployment acceptance inferred.
- P11: publication/deployment NOT authorized and not performed.

Details: [environment](measurement-environment.md), [original inventory](original-public-inventory.md), [attribution/dispositions](attribution-and-dispositions.md), [prerequisites](experiment-prerequisites.md), [review scope](review-request.md). Failed attempts remain in their separate local folders. Raw CDP trace and bulky local diagnostic material are not included by incidental staging.
