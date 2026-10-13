# JG-038 Stage 2 independent implementation review — round 2, 2026-10-12

Reviewer: independent GLM-5.3 source reviewer, behaviorally read-only.
Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench
Branch: torque-wrench/rebuild

## Verdict

**ROUND 2 CURRENT SOURCE CLEAR; FINAL EXACT-BUILD RUN STILL PENDING.** Round-one blockers and P2 findings are resolved in the current bytes, including the later inert-callback tightening for failed disposal. The parent may run the CPU checks and then a fresh build E/full roster. This review accepts no Stage 2 leaf gate and no G0–G9 gate.

Three nonblocking P3 items remain: stale dependency/shape prose and version provenance, future duplication of the provisional 44.1 viewport constant, and absent retained boundary observations in a passing report. They do not require reopening the production interface before the fresh final run.

## Scope and method

This was a read-only source/evidence review. The reviewer ran no test, TypeScript check, build, server, browser, GPU, or agent and did not access the protected sibling. The only permitted write is this file.

The review reused the round-one inputs and exact skill roster, then inspected the current bytes for every claimed repair: nearest-native-pixel boundary proof, explicit-output leaf validation, complete diagnostics, browser teardown ordering, poisoned leases and inert native callbacks, extension assertions, D2 cleanup reporting, and the Playwright scrollbar launch correction.

## Round-one finding resolution

| ID | Result | Current-byte assessment |
| --- | --- | --- |
| R1 — browser boundary proof | Resolved, with R9 evidence-polish follow-up | scripts/verify-torque-timeline.mjs:854-879 derives ceil(boundary × maxScroll), samples that native pixel and the preceding one, requires settled exact positions, requires low progress strictly below and high progress at/above the boundary, checks previous/next ownership, and checks endpoints 0 and 1. Exact endpoint/ownership CPU tests remain in beatTimeline.test.ts:14-33. |
| R2 — explicit output leaf validation | Resolved | scripts/verify-torque-timeline.mjs:235-267 resolves the real parent before treating leaf ENOENT as a new report, rejects directories and direct non-file leaves, confines symlink targets to the real evidence stage, and requires the real target itself to be a regular file. Dangling symlinks still fail during realpath resolution. |
| R3 — incomplete diagnostics observations | Resolved | scripts/verify-torque-timeline.mjs:111 lists every current diagnostics field. The live identity at :622-638 requires active, Lenis, Lenis scroll-handler, ticker, trigger, DOM-listener, and store-subscription counts 1/1/1/1/1/3/1 with startup and cleanup failures zero. MQL teardown retains a read-only handle to the original port object after public deletion at :942-957, observes all owned counters at zero, dispose count plus one, and zero cleanup failures, and records disposedDiagnostics in case observations at :1121-1125. This remains scoped store accounting, not a browser-global census. |
| R4 — blocked-run browser teardown | Resolved | Browser launch/case errors set BLOCKED at scripts/verify-torque-timeline.mjs:1257-1267; the finally block closes the browser before report writing and BLOCKED exit at :1268-1282. Normal report writing also happens after resource closure. |
| R5 — cleanup failure can duplicate or advance an owner | Resolved, including later tightening | conductorRuntime.ts:159-220 retains a poisoned lease whenever disposal fails. dispose records the failure, seals the store terminally, and optionally reports onCleanupFailure at :223-235; startup rollback also seals on rollback failure at :327-340. Lenis scroll forwarding now checks active at :241, commitProgress rejects stale callbacks at :262-270, and the ticker callback already guards active at :244-247. Thus a failed kill/removal cannot advance terminal progress through ScrollTrigger update, Lenis scroll, or ticker activity. conductorRuntime.test.ts:441-471 covers ticker, trigger, Lenis, and listener cleanup faults; poisoned-lease retention, one callback, idempotence, terminal seal, no second allocation, inert ticker, inert stale trigger update, and inert stale Lenis scroll. |
| R6 — extension fixture completeness | Resolved | directorRegistry.test.ts:89-99 asserts the added beat’s exact previous and next IDs, entering phase, exact boundary state key, distinct state key at another progress, active phase away from the boundary, external director dispatch, preceding/following ownership, and unknown-director rejection while retaining traversal and reconstruction checks. |
| R7 — stale shape and dependency provenance | Open, P3 | The verifier header at scripts/verify-torque-timeline.mjs:13-17 still omits chapter from the beats shape. Dependency prose at :113-118 still describes the old four-resource identity, and the report records Playwright but not exact GSAP/Lenis versions at :1246-1251. Update before final evidence archival if convenient. |
| R8 — pending/live physical-range duplication | Open as future maintenance, P3 | The CSS fallback and TORQUE_SCROLL_VIEWPORTS both remain 44.1, so current reload behavior is sound. A future range change can still make pending and live heights differ. Add parity protection or move safe pure metadata ahead of the lazy boundary before unlocking distance. |
| D2 — cleanup-failure reporting channel | Resolved | extraction-contracts.md:103-124 requires onCleanupFailure(errors: readonly unknown[]): void. Lines :172-177 define one frozen failure list after all attempts, exactly-once delivery, no callback on repeated dispose, callback exceptions that cannot replace the original factory/AbortError or interrupt cleanup, and host-owned terminal policy. |

## New observations

| ID | Severity | Finding | Action |
| --- | --- | --- | --- |
| R9 | P3 | The boundary check computes and verifies the correct native pixels, but a passing report retains only a boolean and an empty log. Later readers cannot see actual lower/upper pixels or sampled progress; failure labels also retain the old ±0.001 wording. | Store a compact boundary observation array in case observations, or put boundary, maxScroll, both pixels, sampled progress values, and owner IDs in assertion detail. Rename labels to preceding native pixel and first native pixel at-or-above. |

## Scrollbar launch review

Installed Playwright Chromium includes --hide-scrollbars by default at node_modules/playwright-core/lib/server/chromium/chromium.js:284, and installed types support ignoreDefaultArgs as boolean or string array. The verifier now launches with ignoreDefaultArgs: ["--hide-scrollbars"] and records the launch configuration at scripts/verify-torque-timeline.mjs:1246-1259. This is harness-only and does not alter product behavior.

## Runtime evidence status

The retained parent reports show iteration B failing reload restoration, full C passing 16/17 with only scrollbar displacement, and the follow-up scrollbar-only run passing after visible scrollbars were enabled. They are useful iteration evidence, not final acceptance.

The later inert-callback product change means build D is not exact evidence for the current source even where its normal production roster passed. The required sequence is current-source CPU checks, a fresh build E, and the full roster against that build. That run was pending at save; do not infer its result from C/D or this source review.

## Retained source conclusions

- Pure sampling remains deterministic, immutable, endpoint-exclusive with final endpoint inclusion, and independent of traversal history.
- Progress remains imperative, absent from lifecycle snapshots, and cannot notify lifecycle subscribers per frame; beat listeners emit only on identity change.
- Scene performs no per-frame React subscription and changes story activation only initially or on beat identity.
- The conductor retains Lenis 1.1 seconds, autoRaf false, one GSAP ticker callback, lag smoothing disabled, one page trigger, and no numeric scrub. Installed Lenis 1.3.26 and GSAP 3.15.0 declarations match the APIs used.
- The one-time flushSync initial private render remains a valid React-documented browser integration and preserves native restoration without custom scroll persistence.
- D1 explicit-null semantics remain distinct from legacy missing-field behavior, and D2 now has an explicit host-owned cleanup-failure channel.

## Ownership release

Only project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage2-review.md was written. Review ownership is released at save.
