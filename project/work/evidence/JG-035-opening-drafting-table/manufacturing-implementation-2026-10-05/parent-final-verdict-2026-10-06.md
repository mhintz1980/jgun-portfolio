# Parent checkpoint verdict — October 6, 2026

**Manufacturing implementation G0-G5 accepted technically; G6 FIX-FIRST.** This checkpoint does not assert overall opening acceptance, deployment readiness, continuous machine-fit certification or owner visual acceptance.

Current source/build proof:

| Check | Parent-observed outcome |
|---|---|
| Source tests | 43 files / 445 tests PASS |
| TypeScript / Vite build | PASS, 703 modules; index-CMn9ggEH.js / SceneCanvas-yQrQvntO.js |
| Lifecycle, current production | 14/14 PASS; zero failures; V1-V5 both widths |
| Shaft, current production | 16 cases / 12 gates PASS; zero defects/harness limitations; 17/17 live source hashes match |
| Shaft asset variants | Current FULL/FULL at desktop/narrow; prior agreeing paired runs retain LITE/FULL coverage |
| Static inspections, current production | 4/4 PASS; all four actual CAD request lists empty; zero errors/failures |
| Complete opening, current production | 5/6 PASS; desktop full-tier fails 110 expectations after falling to lite; all six cases have zero console/page errors and request failures |
| Reduced-motion opening | Both widths PASS: zero CAD requests/canvas elements/connected GL draws; stable DOM poster/native scroll/navigation |
| B1/B2 / station2 contracts | 31/31 PASS; station2 PASS (2,671,600 bytes, seven roots/anchors) |
| Root gate checker | Exit1, seven gates, six met, one unmet (G6) |

Mark's explicit **posters throughout** decision is implemented and directly verified on fresh reduced startup. Previously fetched GLTF data may remain cached if a visitor changes preference mid-session; earlier requests cannot be revoked. Actual source and browser proof are reviewed independently of GLM implementation, and the GLM policy review now accepts the direct reduced-motion observables. Final Fable remained unavailable after HTTP429 retries; explicit GLM substitution and successful serving receipts are recorded without claiming a Fable verdict.

The current full opening result independently reproduces the prior headless desktop failure. The matching headless renderer diagnostic identifies AMD Radeon780M through ANGLE/D3D11, rather than establishing a software renderer. It does **not** prove the cause of the quality decline or rule out an application regression. Do not waive the full-tier expectation, lock tiers, fabricate FPS, or treat a passing lite run as full-tier proof. The next technical action is a bounded diagnosis of opening performance/readiness under the preserved quality policy, with any actual correction followed by the complete roster.

Current production records are runtime/lifecycle/posters-policy-parent/report.json, runtime/shaft/posters-policy-parent/report.json, runtime/static-posters-policy-parent/browser-report.json and runtime/opening-posters-policy-parent/summary.json. Earlier failures/reports remain intact. The unchanged copied static checker retains historical scope prose; its actual current arrays are all empty, independently asserted by the parent, and the lifecycle/opening checks enforce the new policy directly. The 16 WEBPs are reused; browser display verification is distinct from asset regeneration.

Root GATES.md is **6/7 checked**. Owner visual acceptance remains separate. Protected Default/M249/enclosure hashes match the baseline. HEAD remains420198a0f818ef44fcf4428dd29ad9f7601fac69; the mixed index raw digest remainsfd9a32bf4af2adadf5050c90874512eb2d596efd750e5b35371d7e730e53e9b1. No staging, commit, push or deployment occurred; .scratch is absent from the index.
