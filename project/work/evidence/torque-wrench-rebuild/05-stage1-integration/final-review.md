# JG-038 — Stage 1 integration final review (preliminary)

Reviewer: SESSION B — Lagrange (default GLM seat, explicit `zai/glm-5.3`, High). Parent-evidence round recorded 2026-10-12; this clock-verified revision (04:40:26 UTC) adds the provenance correction and the Harness Round 1 verdict. Scope: independent review of the delivered integration artifacts only. Product, harness and shared files are read-only to this seat. No browser, build, server, test roster, GPU work, product edit, or Git delivery was performed for this review.

Skills activated before this round (own copies, per domain-entry rules): `asset-and-bundle-hygiene`, `read-the-damn-docs`, `context-mode` (source/bulk analysis), then `spatial-hotspot-a11y` (DOM rules), `webgl-telemetry-verifier` (telemetry doctrine; spatial projections/renderer gates deferred), and `playwright` (harness methodology only). The user's standalone `.mjs` harness/owned runtime path overrides the Playwright skill's CLI-first/output-directory preferences.

## Round 1 — Parent evidence piece (COMPLETE)

Reviewed at HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`, branch `torque-wrench/rebuild`. Round count: **Round 1 of maximum 2 for this piece.**

| Document | Round | Result |
| --- | --- | --- |
| `README.md` | 1 | Verified |
| `baseline.json` | 1 | Verified, one minor provenance note |
| `validation.json` | 1 | Verified (checker independently rerun) |
| `interface-validation.md` | 1 | Verified |
| `gate-status.md` | 1 | Verified |
| `shell-coordination.md` | 1 | Factual claims verified (author's own document; see caveat) |

### Verdict — PASS for integration-preparation evidence (advisory)

The parent-evidence piece accurately reflects the current source state, attributes command results honestly, keeps every acceptance limit open, and contains no link rot. One minor provenance note (below) does not block preparation. This is review evidence only: it does not close Stage 1, G0–G9, runtime activation, or owner acceptance, and it does not authorize the shell-activation window.

### Independently verified facts

- **Source identity:** all 18 `04-stage1-foundation/source-manifest.json` hashes match live bytes (18/18); all 10 activation-packet interface hashes match (10/10); fade sub-block CRLF-normalized SHA-256 matches the pin `e30f6045…`; `public/favicon.svg` exists; `public/torque-wrench/` absent.
- **Registry/activation state:** torque row `reserved: true`, `href: null`, `htmlEntry: null`, `private: true`, `fadeIn: true`; `torque-wrench/index.html` absent; repository `dist/` absent; scoped diff on the shared interface files empty. Vite derives inputs from `PAGES` `htmlEntry` (verified in source) — no Vite edit needed.
- **Boundary checker (reviewer-initiated rerun):** exit 0, `pass: true`, 16 eager modules, exactly one lazy edge `cadGate.ts -> ./Scene`, no errors — identical to `validation.json`. Attribution note: this rerun was initiated by the reviewer and exceeded the initial "no command rerun" scope (bounded, read-only, harmless); it is labeled as such here, and no further commands were run for the reviews that followed.
- **Product baseline:** 273-file product digest recomputed independently — exact match `bfbdf1f7a819c54366a6f757148517729cda7517f756137f036c36afb4e9dd79`. Doc 19 hash matches `e5abebf5…`.
- **75/132 recipe:** the 75-file selection reproduces exactly in count (all 7 dirty tracked ∪ narrow scoped untracked incl. evidence 03/04) and the 132-file untracked selection reproduces in count; recipes are internally coherent.
- **Installed versions:** React 19.2.8, Vite 7.3.6, Playwright/Playwright-core 1.56.1, TypeScript 5.9.3 — all match `interface-validation.md`.
- **Links:** every relative link across the six reviewed documents resolves (0 broken).
- **Attribution discipline:** `validation.json` marks the checker as parent-executed and explicitly scopes Stage 0 / Stage 1 historical passes as not rerun; `interface-validation.md` is labeled parent assessment; the README's session identities are presented as configured routes, not backend proof. No reviewer rerun is claimed for historical results.
- **Methodology:** the Playwright observations (init scripts run after document creation/before page scripts; install observation before navigation; final snapshots cannot prove never-mounted Canvas; routed requests stall until continued/fulfilled/aborted; service-worker interception caveat; 404 needs response-status plus `requestfailed`; count matched routes and assert the fallback so a missing injection cannot pass) are sound and consistent with the installed 1.56.1 contracts and telemetry-first doctrine. Failure injection stays on the real lazy Scene module with no production hook or fake HTML. DOM-level checks follow real-element/focus rules.
- **Acceptance limits:** `gate-status.md` keeps real HTML, browser paths, WebGL failure, posters, Stage 1 exit, G0–G9, Stage 2/3, owner acceptance and Git/public delivery correctly open/blocked; `validation.json` records `browser.executed: false`, `stage1Exit: false`, `gatesClosed: []`. No overreach found.

### Minor finding — corrected provenance (non-blocking; immutable snapshot + concurrent delta)

1. **Post-snapshot external concurrent drift in the 04 evidence scope (actor unattributed).** `baseline.json` was written 2026-10-12T04:24:56Z and its recorded values are the immutable snapshot: 75-file digest `01a74a5b3e6f3c122d89f4bbb14a685f02f506a048110b09a5bdbe71d5226157`, 132-file digest `fab920d24bfab0c3852fa9ef9943c8708234cfa11abae9510011393ad526ddd4`. After that snapshot, two changes occurred under `04-stage1-foundation/` that are outside this task's ownership — the parent states it authored neither, no actor is attributed, and nothing is undone: (a) `next-session-orchestrator-prompt.md` modified 04:27:50Z, SHA-256 `fbb77669857a53e3c263b78c974edfc45258539c5bf0b3449dfa69038e1e8184`; (b) new `example-stage1-model-selection-prompt.md` added 04:32:55Z, SHA-256 `2d1a314bbb8da4c625326890c823518edbfb19dd904dc366725c919ebd823d5e`. Current-byte recomputation of the same recipes now yields counts 76/133 with digests `8204741f33c69043f044240a6cf998c66287019a66c2ae40aeff15b690e651b3` (narrow) and `452bc24d3c1c1e13ce0e29aff71767f561f7045900108a4909202a8bb3d84318` (wide). The 273-product digest and the doc 19 hash are unchanged and still match. Disposition: keep `baseline.json`'s original values exactly as the snapshot; record this delta separately (as here); recompute fresh digests at any final preservation checkpoint. The drift must not be described as parent-owned or expected-authorized.

### Caveat on `shell-coordination.md`

That document is authored by this same seat, so this is not fully independent review of it. Its verifiable factual content (10/10 hashes, fade pin, registry state, module presence, Vite derivation, four-file window, owner-identity-by-track framing) was re-checked against live source as part of this round and holds.

## Round 1 — Harness piece (source review; Session A stable delivery pending)

Reviewed snapshot: `scripts/verify-torque-static.mjs`, 35,131 bytes, SHA-256 `8e49a58489f7161dd282ed05303c71bf0bebe40f85896aa01fa42528933f6a51`, plus `runtime/preparation.md`. Session A's stable-delivery confirmation is still pending, so the hash pins exactly what was reviewed; if the file changes before confirmation, this round applies to the pinned snapshot only. Round count: **Round 1 of maximum 2 for this piece.** Source reads only — the harness was NOT executed by this reviewer.

### Verdict — CHANGES REQUESTED (Round 1)

The harness's architecture and contract shape are strong: fail-closed preflight against activation, the four-file window invariants (pinned fade hash, real-head noindex with comments stripped, registry pins, both test pins), init-before-page-script canvas observation, `serviceWorkers: 'block'`, held-route failure injection with matched-route counting, retained-Element identity checks through failure, response-status plus `requestfailed` dual auditing, real-keyboard disclosure and skip-link checks, fresh context per case, a per-case watchdog, and report output confined to the owned runtime directory. Against that, the source-level defects below block a ship verdict; most are small, localized fixes.

### Blocking findings (each independently verified against the pinned source)

1. **`--preflight` can falsely report Playwright unavailable.** `require.resolve('playwright')` resolves to `node_modules/playwright/index.js`, but the version read targets `path.join(path.dirname(entry), '..', 'package.json')` = `node_modules/package.json` — verified absent — inside the same try/catch that guards resolvability. The ENOENT is caught and reported as "playwright package resolvable: FAIL". Read `node_modules/playwright/package.json` and separate resolvability from version-read failures.
2. **Served-document checks require the pre-build TSX src in served HTML and therefore reject any built preview.** Both the pre-browser request preflight (`text.indexOf(MODULE_SRC)`) and the per-case served-HTML assertion (`served.indexOf(MODULE_SRC)`) hard-require the literal `/src/torque-wrench-main.tsx`. A production build rewrites the entry to a hashed `/assets/*.js` reference (the prior module-only build already emitted `torque-wrench-CXHCUIPs.js`), so the harness exits BLOCKED or fails every case against the approved scratch-build + preview flow; it is dev-server-only as written. The lazy-Scene regex already handles both dev and asset forms — the entry checks need the same treatment (A's proposed `--build-dir` + emitted-manifest exact entry identity is the right shape).
3. **Canvas init-probe can miss canvases and pass vacuously.** The init script calls `observer.observe(document.documentElement, …)`, but init scripts run after document creation and before page scripts, when `documentElement` may not exist. If null, observe throws — yet `window.__torqueProbe` is already defined, so the probe "exists" with an empty mounts array and later canvases go unrecorded (a vacuous zero-mount pass risk; the only loud signal is the init pageerror landing in clean-case assertions). Observe the `document` node (catches the documentElement addition and all descendants) or guard with a fallback so no added/removed descendant canvas can be missed from delivery.
4. **Watchdog timers are never cancelled and a watchdog-losing case keeps running.** The per-case `setTimeout` is never cleared (lingering 120s timers accumulate), and on watchdog fire the raced `runCase` promise is not cancelled — its browser context stays open with live route handlers while the next case starts, allowing overlapping contexts and contaminated observations. Clear the timer after the race and force-close the losing case's context (or restructure teardown ownership).
5. **Usage validation happens after side-effectful work.** Invalid `--viewport` values and `--only` selections that match nothing are detected only after the filesystem preflight, dynamic imports, and (for viewport) after the served-URL fetch — so a pure usage error can surface as exit 10 (preflight) or 11 (blocked) instead of exit 2. Validate all argument shapes and values before any preflight, import, or network step.
6. **Injected-failure cases never call `assertCleanSignals`.** Unrelated HTTP ≥400 responses and non-marker console errors are ignored in both failure cases; the existing `allowInjectionConsoleErrors` parameter is dead code. In the render-throw case, console errors should be marker-allowlisted (every console error must reference `TORQUE_STATIC_RENDER_FAILURE_INJECTION`), not wholly ignored.
7. **Skip-link "first Tab stop" assertion is contaminated by its own helpers.** `assertSkipLink` artificially blurs `document.activeElement` (a focus-manipulation helper contradicting the harness's real-keyboard-only doctrine) and runs after `assertSharedStructure` has already scrolled the footer into view. The first-Tab claim is therefore measured post-manipulation. Test the skip link in an unmanipulated flow before any focus/scroll changes and drop the blur.
8. **Held-route/goto ordering can stall navigation on a deliberately stalled resource.** Failure cases register the holding route before `page.goto(..., { waitUntil: 'load' })`. If the engine counts the pending dynamically-imported module toward the load event, navigation stalls to its 30s timeout and false-fails/blocks. No runtime evidence exists either way (nothing has run); restructure (e.g., `domcontentloaded`, attaching the hold after load, or a bounded hold-release) so navigation cannot depend on the stalled request.
9. **Launch label asserts unmeasured hardware.** `describeLaunch()` returns `'installed Chrome, ANGLE/D3D11 (hardware)'` on win32 — the "(hardware)" parenthetical is inferred from platform and launch arguments with no GL-backend measurement, violating contract 18's "do not infer GL from launch arguments" rule. Record the launch string as configuration only, or strip the parenthetical claim until a renderer is actually observed.
10. **Escape focus-restoration assertion is vacuous.** In `assertDisclosureKeyboard`, focus never leaves the toggle before Escape is pressed (Tab → Enter → Space → Space → Escape, all while focused on the trigger), so the "Escape closes and restores focus" check merely verifies unchanged focus and cannot detect a broken restoration path. Tab away before Escape, assert focus is genuinely on another reachable element, then Escape and assert focus returns to the trigger with the panel closed.
11. **No loopback/exact-path confinement on `--url`.** URL validation accepts any http(s) host; only the final served pathname is checked later. The harness must confine itself to the task-owned loopback preview: reject non-loopback hosts (localhost/127.0.0.1/[::1]) and non-`/torque-wrench/` paths at argument validation, before any fetch.

### Minor findings

12. **Request classification is an `else if` chain.** A URL matching both the Scene and CAD patterns would be counted only as Scene. Classify independently; full URLs are already stored in observations — also record the audit cadence/limits in the report.
13. **Contract-matrix coverage gaps.** Five cases per viewport vs contract 18's six primary modes: the lite-tier deferral is documented in `runtime/preparation.md` but absent from the harness header's deliberate-limits list, and the mid-session MQL-change downgrade path has no case even though the source implements exactly that (`tier.ts` `downgradeForReducedMotion`; `TorqueWrenchPage.tsx`'s `matchMedia` change listener stepping down to poster). A's planned lite + mid-session MQL preservation additions address this.
14. **Query-mode case URLs are composed by string concatenation.** `baseUrl + plan.urlSuffix` (`?quality=poster`) is not URL-aware: a base URL that already carries a query or needs normalization composes a malformed target, and the recorded `url` may not equal the real navigation URL. Compose with `new URL()` and record/assert the actual final URL.
15. **Output-ownership check is a string-prefix test, not realpath containment.** `outPath.indexOf(RUNTIME_DIR + path.sep) === 0` can be bypassed by junction/symlink/8.3 aliases, and `outPath === RUNTIME_DIR` itself passes validation only to fail as a directory write. Enforce resolved-realpath containment and reject the runtime directory itself.
16. **Blocked-preflight wording attributes a cause it did not establish.** Runtime mode prints "activation is not applied" for any preflight failure — pin drift, fade mismatch, or the false Playwright failure would all be mislabeled. Report the actual failing checks and count without asserting a cause.

### Harness round disposition

Round 1: CHANGES REQUESTED — 11 blocking, 5 minor, all source-verified; the harness was not executed by this reviewer and no runtime conclusion is drawn. Round 2 is reserved for Session A's fixed delivery (with a fresh hash pin); the final preparation review follows once the harness is stable.

## Round 2 — Harness piece (FINAL; two-round cap reached)

Reviewed stable final snapshot, hashes independently verified against live bytes by this reviewer: `scripts/verify-torque-static.mjs` SHA-256 `1d95755dc725c48705b535586854eab2ed2c300a956d54ce5a0f6ed00ee5de9f` (55,254 bytes, 1,078 lines; unchanged through the held round); `runtime/preparation.md` final SHA-256 `c667831ac20868304d18e0cef33a106d04112d342bb98b6ae51c44033603f62a` (superseding the interim `2c28267a…` handover within the held round — the script hash never changed). Round count: **Round 2 of 2 — final; no third review.**

### Verdict — PASS for source/CLI harness preparation

Every Round 1 finding is fixed and verified in the final source, as is the interim parser defect found mid-round against snapshot `95bbd78c…`:

1. Playwright metadata resolves via `require.resolve('playwright/package.json')`.
2. Module identity is exact in both modes: `collectModuleSrcs`/`entrySrcVerdict` enumerate all module tags attribute-order/quote-tolerantly, exclude the Vite dev client, and require exactly one non-client candidate equal to the expected identity (dev TSX or manifest entry asset). Built mode additionally sha256-verifies entry and Scene asset bytes (local manifest output vs served, realpath-confined) before any browser launch; dev mode carries an explicit no-byte-claim note.
3. Canvas probe observes `document` (documentElement-independent) with a bounded two-rAF flush before assertions.
4. The watchdog owns the case: cancellation flag, timer cleared on all paths, hold released and context closed on every path, abandoned promise bounded-drained; case exceptions are FAIL entries, never environment BLOCKED.
5. All argument validation (non-empty values, flag-only flags, strict loopback/exact-path URL, viewport/only/build-dir/out) precedes preflight; an empty roster is a usage error.
6. Injected-failure signals: zero unrelated HTTP errors, zero uncaught page errors in every case, console errors must correlate to the exact Scene failure (marker text, Scene URL in text, or console location on the Scene URL).
7. Skip link is tested first on the fresh page with no blur helper; Escape restoration Tabs away, proves focus moved, then asserts focus return plus closed state.
8. Navigation uses `domcontentloaded` with explicit stage/chapter markers; the exact-Scene request waiter is registered before `goto`, so a held response cannot stall DOM expectations and hold-engagement observation is race-free.
9. Launch is reported as configuration only with `glRenderer: 'unmeasured'`.
10. Lite is a real case; the MQL case flips reduced-motion mid-session, asserts identity/disclosure/focus preservation with no extra Scene request, then restores no-preference and asserts the one-way poster floor.
11. Strict URL confinement (loopback host set, exact `/torque-wrench` path, no query/hash) at validation.
12. CAD classification is an independent full-URL predicate; Scene-shaped non-identity requests land in a failure bucket; complete request/response/failure logs are recorded per case.
13. Case URLs compose via the URL API.
14. `--out` ownership uses realpath containment, rejects directories/non-files and symlink escapes, and requires an existing parent.
15. Preflight wording distinguishes absent-activation BLOCKED from state-mismatch FAIL.

Parent-attributed command/mock evidence in `harness-checks-final.json` (not rerun by this reviewer): 17/17 CLI checks met expected exits (syntax/help 0; preflight/runtime 10 solely on absent activation with Playwright 1.56.1 resolving; 13 malformed-input cases exit 2), parser mocks 6/6, lifecycle mocks 4/4, browser explicitly unrun. The mock limits are honestly stated.

Reconciled within the held round: the interim `runtime/preparation.md`'s stale base prose (five/ten roster, broad render/pageerror wording) was corrected by Session A in the final doc — the base now states "seven cases each — fourteen total: the five cases listed here plus lite and scene-mql-downgrade," and the failure policy states that page errors fail in every case while failure-console errors must correlate exactly to the Scene failure (marker text, Scene URL in text, or console location), with clean cases requiring zero console errors. No observation remains.

## Round 1 — Activation delivery (coordination-window piece)

Reviewed after the parent's stable four-file diff notification, under the ACTIVE window recorded in `shell-coordination.md` (QM `ad84ac05` §15 terms, §10 recipe). Round count: **Round 1 of 2.** Source reads and hash verification only; tests/tsc/boundary/preflight were run by the parent (attributed below).

### Verdict — PASS for the four-file activation delivery and proposed commit scope

**`torque-wrench/index.html` (new):** matches the activation packet's exact proposal — the fade sub-block CRLF-normalized SHA-256 equals the pin `e30f6045…` (recomputed from this file), exactly one module script (`/src/torque-wrench-main.tsx`), a real head `<meta name="robots" content="noindex, nofollow" />`, no legacy redirect block, no `og:image`/`twitter:image` (deliberate), and the packet's favicon/viewport/description/theme-color/canonical/title/OG/Twitter metadata. Two script tags total (fade inline + module entry).

**`src/shared/pages.ts`:** one hunk — the torque row flips exactly per packet (`reserved: false`, `href: '/torque-wrench/'`, `htmlEntry: 'torque-wrench/index.html'`) while `private: true`, `fadeIn: true`, `index: 4` and `path` are preserved; the nearby comment accurately describes the activation and window provenance. `m249` remains reserved/null; the registry still has four rows; no other row or code changes.

**`src/shared/pages.test.ts` / `pageTopology.test.ts`:** one hunk each — the row pin now asserts the private-and-active row with the real build input, and the entry-list pin asserts the three-entry identity, exactly per packet.

**No unintended drift:** `git status` shows only the three shared files newly modified plus the new `torque-wrench/` entry beyond the pre-existing session baseline; the other seven interface files remain at their packet hashes; all other dirty/untracked material is unchanged.

**Commit scope confirmed:** the 18 `source-manifest.json` files all still match their pinned hashes (18/18), so the single authorized activation commit can include them unchanged alongside the four delivery files — self-contained (HTML entry + module + page-local runtime/tests + boundary checker), with no docs, harness, evidence, or scratch material. That exact scope is safe.

**Parent-attributed post-delivery results (not rerun by this reviewer):** `npx vitest run src/shared` exit 0 (8 files / 240 tests); page-local 20 pass; `tsc --noEmit` exit 0; boundary checker exit 0, `pass:true`, 16 static modules, sole lazy `cadGate -> ./Scene`; harness `--preflight` exit 0 with all 18 checks passing.

**Commit record:** the single authorized activation commit `69ac760bf575f6d3d2c5fe63578bf423d94798db` exists locally with exactly the 22 agreed source paths (four delivery files + 18 unchanged manifest files) and is contained by no remote branch — local only, no push (verified by this reviewer). Local window terms are satisfied; the QM-side merge/closing record is pending. Authorization attribution: the scratch build/browser work runs under the original owner prompt's parent resource window, not under §15, which grants no runtime work.

**Runtime progress (parent-attributed, review HELD):** scratch production build exit 0 with manifest SHA-256 `68f4a28270b62855ee12cdd4d5f7f4649cccfc06cf40529cf5b4cd3648447256`; torque eager entry gzip 67,001 bytes, 3 chunks, sole Scene dynamic import. Preview and browser roster are in progress; the runtime final review is held until the parent delivers the complete evidence.

## Parent-evidence Round 2 (complete)

Round count: **Round 2 of 2 — final; no third review.** Reviewed: `concurrent-preservation.md`, `harness-checks-round1.json`, `harness-checks-final.json`, updated `validation.json`, and updated `README.md`. **Verdict: PASS — no findings.**

- The concurrent-drift record matches this reviewer's independent byte-level computations exactly (273 product digest, doc 19, both external concurrent paths, current 76/133 digests) and correctly keeps the initial baseline immutable with the actor unattributed.
- Final command evidence is pinned to the final hashes, parent-executed, and honestly scoped: mocks exercise parsing and exception/timeout/late-context cleanup only; browser/build/renderer acceptance and all gates remain explicitly false/open.
- `validation.json` preservation recheck (273-file product digest, 18/18 manifest, 10/10 interfaces, doc 19, HEAD/branch/index) matches every value this reviewer independently computed earlier in the round; continuation limits are correctly scoped to the concurrent-drift record.
- The README accurately describes the superseded initial harness, the final handover, and the requirement of real activation before any runtime claim.

## Round 1 — Runtime evidence (separate piece; report audit + build byte verification)

Reviewed `runtime/report-built-round1.json` and the scratch build bytes it pins; harness script hash re-verified unchanged (`1d95755d…`). Round count: **Round 1 of 2.** This is an audit of the delivered report and artifacts — the reviewer ran no browser/server/build; the runtime execution belongs to the parent-scheduled Session A window.

### Verdict — PASS for the delivered runtime evidence

**Report identity and build bytes (independently verified):** mode `built`, result PASS, Playwright 1.56.1, Chrome 154.0.8037.98, GL renderer honestly recorded as unmeasured. The scratch manifest SHA-256 recomputes to the pinned `68f4a282…`; the manifest's `torque-wrench/index.html` entry is `isEntry` with the Scene chunk in its `dynamicImports`; the on-disk entry (`torque-wrench-BhvCqyvq.js`) and Scene (`Scene-CYrsnGyK.js`) bytes match the report's local and served hashes exactly (`886ed948…` / `a8bd8ac9…`); the built HTML carries `crossorigin` before `src` (validating the parser fix), a real head noindex, and the fade markers.

**Roster audit (programmatic, all 14 cases):** preflight 18/18; D and N × 7 cases all PASS with every assertion passing — static-full and lite 30/30 each, poster-explicit and reduced-motion 31/31 each, import-abort and render-throw 26/26 each, MQL-downgrade 24/24 each. Zero CAD/decoder requests, zero HTTP ≥400, zero uncaught page errors, zero Scene-shaped-unidentified requests in every case. Exactly one Scene request in scene tiers; zero in poster/reduced tiers. Abort cases record `net::ERR_FAILED` with correlated console; render-throw cases record only the injection-marker console error; clean cases record zero console errors. MQL downgrade preserves identity/disclosure/focus and holds the one-way poster floor on restore.

**Limits:** GL renderer unmeasured — no hardware or software rendering claim; N is emulated DPR3 touch, not a physical device; the Scene is a zero-Canvas placeholder, so no real WebGL initialization/context-loss/GPU-cleanup behavior exists to exercise; worker-internal OffscreenCanvas is outside page observation.

**Round 1 completion (evidence chain closed):** Session A's actual command exit 0 is confirmed with the exact invocation recorded in `activation-validation.json`; the finalized report's SHA-256 `c2d9ff9705676659942a7e971e94e89bf83b52f7974ffa17c41cf58c5983cfbf` matches the current bytes and re-audits identically (14/14 cases, 396/396 assertions, every per-case invariant unchanged from the audit above). `served-identity.json` (parent-executed) closes the served loop: ten built/served files — all three HTML entries including both existing pages, favicon, and the torque eager/lazy JS/CSS closure — raw build bytes equal HTTP-200 response bodies, all matched. The task-owned preview (session 55228) was stopped with Ctrl+C and a subsequent fetch was refused. Final preservation: the original 273 product paths diff only the three authorized shared files; the 18 foundation hashes are unchanged; doc 19 unchanged; index empty; repository `dist/` absent; the seven pre-existing dirty tracked docs untouched. The earlier "artifact pending" limitation is resolved.

## Stage 1 exit assessment (against plan 13 exactly)

**Conclusion: the Stage 1 exit — "Correct document boundaries and complete static interaction path" — is satisfied at its exact approved scope, static-only.** Per-criterion:

1. *Separate HTML/JS entry consuming shared fade/navigation, private, no public-nav/cutover change* — met by the activation commit and runtime evidence: pinned fade block consumed, `private: true` registry semantics, zero torque anchors in public nav on every case, m249 reserved, existing entries preserved in the three-input build.
2. *Ordered five chapters, controls, headings, reachable footer* — met in all 14 cases (chapter order pinned; skip link first Tab stop; disclosure Enter/Space/Escape with non-vacuous focus restoration; footer in-flow with anchors and colophon).
3. *Tier selection before narrative CAD/WebGL imports* — met: 16 eager modules with the sole lazy edge `cadGate -> ./Scene`; tier resolution precedes the single Scene request; poster/reduced never request it.
4. *Poster/reduced-motion paths and WebGL-failure transition using the same semantic story* — met at the scope that exists: poster/reduced/MQL paths and both failure injections (import rejection, render throw) preserve the same Story Element identity, disclosure state, and focus, with zero uncaught errors. **Real WebGL initialization and context-loss are not Stage 1 exit criteria** — they are deferred by the approved contracts (gate-status: "deferred until real renderer; no actual WebGL failure acceptance"; harness preparation: same; contract 18 assigns init-failure/context-loss to the D/N roster of the renderer-bearing page). The transition plumbing itself (typed `onFailure`, SceneBoundary, terminal poster) is implemented and runtime-proven for every failure mode a zero-Canvas placeholder possesses.
5. *Page-local store and cleanup* — the store is unit-tested; listener/HMR/fade/lifecycle cleanup is source-verified; no Lenis/ScrollTrigger/renderer exists yet, so their cleanup obligations attach when they arrive (Stages 2–5), consistent with the foundation record.
6. *Private topology, shared-shell parity, existing-entry preservation* — met: byte-verified served identity, real head noindex, pinned fade sub-block, three-entry topology preserving both existing entries, 240 shared tests including the topology/row pins.

The exit's own limit holds exactly as written: temporary art cannot pass final poster acceptance — the five explicit Stage-6 placeholder slots are honest about that; final posters remain Stage 6.

**Definitive missing-criterion determination: none.** Real WebGL initialization failure and runtime context loss are **not** Stage 1 requirements under the current contracts: plan 13 item 4 is an implementation directive whose transition plumbing is implemented and runtime-proven for every failure mode a zero-Canvas placeholder possesses; the approved contracts uniformly attach the real modes to the renderer-bearing page (gate-status and the harness preparation defer them until the real renderer; contract 18 assigns them to the D/N roster; plan 13 places the renderer in Stages 3–5). Keeping Stage 1 open on that ground would add an invented prerequisite. Accordingly, **Stage 1 may close at its exact approved scope on the current evidence**; real WebGL init/context-loss, GPU cleanup, hardware GL, performance, and final posters remain open exactly where the contracts place them.

**Not closed by this:** Stage 2 and Stage 3 remain unadvanced; all G0–G9 gates remain open — each closes only on its exact complete evidence per the approved contract. The runtime report is now real G-gate input (G0's private topology/document-isolation evidence in particular), but gate disposition belongs to the parent's gate process. Formal closure actions (plan 13 checkbox updates, evidence index, `activation-validation.json`'s `stage1Exit` flag) are the parent's to record.

## Round 2 — Runtime piece: closure-record correctness check (FINAL; two-round cap reached)

Scope: the parent's closure record set — `stage1-closure.md`, `runtime/execution.md`, the docs 13 Stage 1 edits, `gate-status.md`, `validation.json`, `activation-validation.json` and `README.md` dispositions. Round count: **Round 2 of 2 for the runtime piece — final; this seat stands down after this verdict.**

### Verdict — PASS: the closure record is correct, consistent, and exactly scoped

- **Contradictions gone.** Every disposition now states the same fact: Stage 1 complete at the approved static-foundation scope; real renderer initialization/context-loss, GPU cleanup, hardware GL, performance, final posters, owner acceptance and all G0–G9 gates remain open; Stage 2/3 not advanced. `gate-status.md`, `validation.json` (`stage1Exit: true` + evidence link, `gatesClosed: []`), `activation-validation.json` (`stage1Exit: true` + scope, `gatesClosed: []`), `execution.md` and `stage1-closure.md` agree with this reviewer's assessment; no stale OPEN/BLOCKED wording remains.
- **Exact criterion vs limits.** `stage1-closure.md` maps all six plan 13 requirements to concrete evidence and its Remaining Boundaries state the deferred items precisely (zero-Canvas placeholder; no actual WebGL init/context-loss/renderer-allocation/GPU-cleanup/hardware-GL/performance claim; posters Stage 6; emulated narrow; worker-internal OffscreenCanvas unobservable; QM record pending; one authorized local commit, no push/PR/deploy).
- **docs 13 edit is exactly scoped and accurately disclosed.** The new delta versus the pre-existing dirty plan state is precisely the six Stage 1 checkboxes (6 checked, 0 unchecked, Stage 1 section only) plus the dated static-exit paragraph with the closure link; Stage 0's previously-recorded edits are preserved prior content; Stage 2 remains 9 unchecked / 0 checked. `activation-validation.json`'s preservation note names the docs 13 edit explicitly.
- **Links and artifacts.** Zero broken relative links across the closure record set. `execution.md` SHA `3e4d948b…` verified; it records the exact command (exit 0), harness unchanged before/after (`1d95755d…`), preparation doc at execution time (`c667831a…`), and report `c2d9ff97…` at 109,474 bytes — all matching live bytes re-verified this round.
- **Cosmetic non-blocking note:** a few spacing typos in newly added prose ("and14/14", "browser14/14 cases,396", "shared240/page-local20") — typography only; no factual effect.

**Final disposition of this seat:** independent advisory PASS for the Stage 1 static closure record, supporting the parent's closure decision — not owner acceptance. Both reviewed pieces have consumed their two-round caps. Remaining work belongs to the parent (QM-side closing record relay, gate dispositions, Stage 2+ sequencing) and the owner (acceptance decisions). No further review is scheduled from this seat.

## Final preparation verdict

**PASS for Stage 1 integration preparation** — source identity, coordination record, parent evidence, and harness source/CLI readiness are consistent, honestly attributed, and independently verified. This verdict is preparation-only.

**Remaining limitations and open/blocked state (concrete):**

- **Runtime activation: COMMITTED LOCALLY; QM CLOSURE PENDING.** Activation commit `69ac760b` exists with the exact 22-path scope, contained by no remote branch; parent checks are green (attributed). The QM-side merge/closing record under window term 4 remains pending.
- **Stage 1 exit: CLOSED — static scope, parent-accepted.** The parent accepts the exact Stage 1 static exit on the approved plan 13 wording and the verified evidence, expressly without any real-WebGL, final-poster, performance, or G-gate claim. This reviewer's assessment above is the independent advisory basis; it is not owner acceptance. Real WebGL init/context-loss, GPU cleanup, hardware GL, performance, and final posters remain open exactly where the contracts place them (renderer stages / later gates / Stage 6).
- **G0–G9: OPEN.** No gate is closed by this review or by the parent's CLI/mock checks.
- **Browser/static/failure roster: EXECUTED 14/14 PASS (parent/Session A attributed; independently audited above).** Runtime ran under the original owner prompt's parent resource window — §15 granted no runtime work. The reviewer's runtime-evidence Round 1 verdict is recorded above; its stated limits (unmeasured GL, emulated N, zero-Canvas placeholder) remain.
- **Mock limits:** the in-memory mocks do not validate actual Playwright cancellation, DOM behavior, build-graph loading, route interception, or browser acceptance.
- **Renderer/WebGL/GPU/performance: deferred.** The Scene is a zero-Canvas placeholder; no renderer initialization, context-loss, GPU cleanup, hardware-GL, or performance claim is possible.
- **Posters: Stage 6.** Temporary placeholder art cannot pass final poster acceptance; `public/torque-wrench/` does not exist.
- **Two-round cap reached** for both pieces; any further defects route directly to the parent and the owning writers rather than a third review.

## Disposition limits

This review is an independent advisory record: its verdicts support the parent's closure decisions but are not owner acceptance. The parent has closed the Stage 1 static exit on the exact plan 13 wording and verified evidence; real WebGL initialization/context-loss, GPU cleanup, hardware GL, performance, and final posters are not claimed, and every G gate remains open pending its exact complete evidence. Owner visual/motion acceptance and publication authority remain open. Any review of the parent's closure evidence (`stage1-closure.md`, plan 13 checkbox updates, `activation-validation.json` `stage1Exit`) is a **new runtime piece** counted within its own Round 1 (or Round 2 if needed) — not a third preparation review. All command/mock evidence cited in the round sections is parent-attributed; this reviewer's evidence is source reads, hash verification, and one earlier boundary-checker rerun (labeled above).
