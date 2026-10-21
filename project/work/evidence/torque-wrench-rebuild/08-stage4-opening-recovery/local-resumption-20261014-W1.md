# JG-038 local resumption W1

The receiving local parent takes the explicitly released integration, shared-index writes and build/browser/GPU scheduling from `JG-038-next-local-session-handoff-2026-10-14.md`. Prior interrupted camera/input/pointer scopes are reassigned below; their partial work is preserved without acceptance.

Baseline: branch `torque-wrench/rebuild`, HEAD `315052e1ff7f309770e47647a7606ae95d161a2f`. Only tracked drift at entry: `GATES.md`, `TODO.md`, `project/context/agent-skills.md`; preserve all three. All existing untracked/ignored work is preserved. No protected sibling access, staging, commit/push, deployment, cutover, archival or inferred owner acceptance.

| Lane | Configured seat | Exact ownership | Evidence/dependency |
|---|---|---|---|
| Camera review | Singer, GLM-5.3/high | Read only; `CameraHandoff.ts`, `RuntimeWorld.tsx`, relevant tests | Independent bounded verdict before camera acceptance |
| Pointer harness | Russell, GLM-5.3-Flash/high | Only new `scripts/verify-torque-pointer-functional.mjs` | Syntax/source delivery; parent owns runtime |
| Input correction | Parent | `scripts/verify-torque-input-response.mjs` | Finish recorded Round1 corrections, then independent Round2 |
| Integration/runtime | Parent | Product fixes if review requires; this ledger and shared task evidence | Fresh build identity/restart, affected D/N checks, Stage4 checkpoint |

Authorized alternate: DeepSeek-Flash/high. Sol only after the documented fallback condition; required Astra review remains separate. Heavy builds/browser/GPU jobs are serialized. JG-038-LEAN-V1 keeps full functional coverage, 20 primary phase runs and 3 startup conditions, all budgets/retries/original failures; missing observations remain UNVERIFIED.

Entry environment: battery 93%, BatteryStatus1 (discharging), ~15.5 GiB free physical memory; no 5288/5291 listeners. AC-dependent performance acceptance remains unverified. Do not stop unrelated processes/5199.

Package1 is in progress. Packages2–6 remain dependency gated by the Stage4 checkpoint. No prior completed bounded evidence is rerun without a changed/failed/incomplete observation.

## Current observations

- Fresh production `w1` build with manifest passed; preview restarted on task port5288. Source record: `source-integration-20261014-w1-build.json`, 361 inputs, aggregate `e00a56fd9d52d00a165c51041b08cbafd13ec92390cf3723583b3291d9b1a926`. This post-build record is separate from harness build-causality nonclaims.
- Focused camera/opening/inspection CPU checks28/28; private source import boundary PASS, one lazy CAD edge.
- `camera-boundary-20261014-w1-N-diagnostic.json`:70 raw poses, zero page errors,4/4 exact served targets. Original first Chrome launch closed before runtime; launch-only retry succeeded; no result was claimed for the failed launch.
- `continuous-clearance-20261014-w1-all/report.json`: D/N×full/lite four cases,64/64PASS. Original prior failures remain untouched. Sampled-frame clearance is not analytical continuous proof.
- Singer independent camera source review SHIP at unchanged `CameraHandoff.ts` SHA `fa574bbac999fa3a6a8da5a6a2b479ffa931cd637c1c63c31d121c5e487effa1` and `RuntimeWorld.tsx` SHA `b38d537f9ce48a8d98fb955fd7d90b860220f8c6b253d686663eb31e1cf1a0f4`. Reviewed C1 joins .435/.46/.675/.69/.72/.735/.925/.94; live-source quintic preserves the moving source derivative at .925. Manual controls and full input runtime remain separate prerequisites.
- New parent-owned `scripts/verify-torque-update-stress.mjs` controls actual rAF callback delivery with native timestamps and native scroll, no progress setter or playback clock. `update-stress-20261014-w1-D-V1.json` observed33.4/66.9ms median delivery and stable poses, but15Hz holdFAIL because retained first-to-last span4980.6ms. Extended capture retains the unchanged>=5000ms requirement; originalFAIL preserved. Independent harness review pending. Cadence conformance remains UNVERIFIED without approved tolerance.
- Input corrections preserve interrupted work; parent added fresh trusted-event consumption and CameraHandoff source identity. Avicenna owns independent Round2 read-only review; a parent lifecycle mistake briefly closed then resumed this reviewer, with no reassignment/duplicate writer. Pointer writer Russell remains sole owner of its new harness.

## W2 current frontier

- Avicenna Round2FIX_FIRST found ending-refresh and incomplete-lamp falsePASS paths. Parent applied separate ending1200ms observed-refresh window and finite lamps throughout accepted windows/pairs. Targeted executable analysis of real helper functions: complete dataPASS; missing lamp response/holdUNVERIFIED; missing trusted inputUNVERIFIED; injected pose driftFAIL; full holdPASS; first rest span300ms. No third static-review round claimed.
- Full w1 V2 originalFAIL retained: wheel response; keyboardHome already at0; singular top-down derived-roll null. Parent allows only true Home-at-top no-op and retains null derived roll asUNVERIFIED while gating nonsingular quaternion position/target/FOV derivatives. All actual observed boundary/quantization gates retained.
- Independent DeepSeekFlash/high review approved private duration1.1→.8s, preserving all thresholds and legacy page. Applied exact source/test diff reviewed.21CPUtestsPASS; w2productionbuild/typecheckPASS,preview restarted5288. `source-integration-20261014-w2-build.json`:362inputs,aggregate `34c5efe6f3c7961ac551055debd2d4d5d2e9c3abcb1706223b7d1cee5764a0ae`.
- w2 wheelV3: functional/responsePASS; rest1004.7/1128.2/1123.7ms,total1305.5/1428.8/1424.6ms. FullD/fullV3: wheel/touch/keyboard functional+responsePASS,scrollbar functionalPASS,responseUNVERIFIED for direct/reload anchor;zeroFAILassertions,servedidentityafterPASS. OverallUNVERIFIED for cadence/buildcausality nonclaims. FullD run supplies first required near-limit wheel repeat; another independent repeat remains required. Comparison uses same response semantics, differing verifier revisions; baselineFAIL remains.
- Actual-update stressV2 9/9PASS; after independent Round2 final two-line same-raw-population/finite timestamp-frame fix, rerun finalbytes is pending. OriginalV1shortspanFAIL preserved.
- Russell eventually wrote pointer harness; parent interrupted/closed writer after repeated delays, preserved delivered bytes and took ownership. SyntaxPASS; Mencius independent read-only review pending. No concurrent replacement writer.
- Fresh w2cutter/control matrix running; firstD/full259/259PASS. Real-lifecycleV1 minimization stillleftdocumentvisible→hiddenUNVERIFIED; BFCache goBackDOMContentLoadedwait timedout afterreturnURL. V1FAILretained; V2 uses actualreturn/events without requiring a freshDOMContentLoaded event.
- Package1/checkpoint remains open; no Stage5implementation started. AllG0–G9/owner decisions remain open; AC/physicaldevice limitations unchanged.

## W3 font and pointer corrections

- w2Dliteinput eventually completed with all four functional categoriesPASS/zeroFAILassertions; keyboard/scrollbar timingUNVERIFIED. The apparent missing process/report was a delayed tool-session result, not accepted as completed until its JSON arrived.
- w2Nfull external failures traced to pinned Troika Unicode resolver `2300-23ff.json` (diameter symbol). Added exact original NotoSansSymbols2.002 fallback WOFF84980bytes (`f976f7aa246f27519879628c7c2376e0707afdb14fcb362346da53eaa36da763`), OFL/provenance. Private lazy Scene configures local default before first text processing; primary fonts stay first, static/legacy entry unchanged. Independent DeepSeekFlash/high source reviewSHIP; source confirms WOFF support/precedence/lazy boundary/U2300coverage. Other uncovered Unicode could still fall through to CDN; no universal-network-removal claim.
- w3build/typecheckPASS,366sourceinputs aggregate `4cf5c5b13a752487f14b29c2a334df9b8e7eb8f37b71d3055a592cfbdb30c5b6`;previewrestarted5288. Fresh source boundaryPASS with onecadGate→Scene edge. NativeACconfirmedBatteryStatus2/57% before performance scheduling.
- Mencius pointerRound2conditionalPASS_TO_RUN at `f884bf8dd7bdea70004a0c0ea79347aaaca7eb487c01a048df65ddf249fbc629`; all seven Round1 falsePASS gaps corrected. w3DfullV1 originalFAIL retained:46/48assertionsPASS,only start/endcanvas==viewport assumptionFAIL (actual1425×900canvas vs1440×900window with15pxscrollbar). Zeroerrors/failedrequests;actual5shold305frames,zero pose/FOV/projection drift. Parent now projects using actualcanvasCSSdimensions and gatespositive/livecanvaswithinviewport; rerun pending. No threshold relaxation or endpoint-window widening.
- RealBFCache w2V2PASS: actualpageshowpersistedtrue,onecanvas/live/ready,zeroerrors/exactservedbytes. Actualminimize remainedvisible→hiddenUNVERIFIED. OriginalV1DOMContentLoadedwaitFAILretained; fixedwait observes actualreturn/eventinstead.
- Finalreviewed actual-update harness N/w2V3 9/9PASS,30/15actualcallbackdelivery/native timestamps and fullfive-secondpose/native/7lampholds. FinalD rerun stillpending. FullNinputretry on w3running; Nliteprimary/near-limit repeats,pointermatrix and Stage4checkpoint remain pending. Packages2–6 remain unstarted.

Current W3 results after corrections: N/full all-input retry functional4/4PASS, wheel/touch/keyboardresponsePASS, direct/reloadtimingUNVERIFIED;zeroFAILassertions/zeroerrors/exactpostservedbytes. Corrected pointermatrixD/Nfull/lite each48/48PASS (192assertions), eachpostservedidentityPASS/harnessstablePASS. OverallreportsremainUNVERIFIEDbyexplicitbuildcausalitynonclaim. ProjectionusesactualcanvasCSSbasis,including1425pxdesktopwidthwith15pxscrollbar. Narrow/lite inputprimaryrunning;near-limitrepeats/finalDstressstillpending. Sourcecheckpointpreservationcomparew1→w3confirmsall6protectedrecordedpathsunchanged,includingrootGATES/TODOandfourREAfiles.
