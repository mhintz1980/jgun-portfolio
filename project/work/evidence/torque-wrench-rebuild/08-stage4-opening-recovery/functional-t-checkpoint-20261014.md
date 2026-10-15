# JG-038 functional checkpoint t — renderer-init repair and post-repair lifecycle evidence (2026-10-14)

Scope: source-bound record of the renderer-initialization product repair, its review rounds, and the
post-repair lifecycle runtime on the fresh t build. This is a checkpoint, not a Stage4 exit, gate
closure, or acceptance. All hashes below were computed by this checkpoint from the files on disk.
Sole write of this checkpoint: this file (verified absent before creation). No product, shared
README/GATES/ledger, frozen manifest or prior evidence was edited; no browser, build, GPU, test or
commit was performed here.

## 1. t build identity (source and served)

| Item | Value |
| --- | --- |
| Source record | `source-functional-20261014-t-build.json` — 62220 B, SHA-256 `1cb17659bc01f83078b33b1572c2b27e77136f59b5677398a9dc29e37549bcf8` |
| Source record createdAt | 2026-10-14T14:35:46.967Z |
| Branch / HEAD | `torque-wrench/rebuild` / `1c7a7d2d1d73b1a94d015bfcae10c101cd94b72c` (repair is uncommitted working-tree change) |
| Source files / aggregate | 354 files, `sourceAggregateSha256` `b48ee4c84c97a8c677ba303e4be3e276c4d76b288d42d1cfb9a630aa7b060203` |
| Build directory | `.scratch/jg038-functional-20261014-t` (fresh; build/served bytes bound separately by runtime reports) |
| Protected files in record | 6 unchanged: `GATES.md`, `TODO.md`, 4 REA documents (hashes in the record) |
| Lifecycle harness | `scripts/verify-torque-lifecycle-functional.mjs` — 29868 B, SHA-256 `a5b149a7fde7b132fe4780f6afb2e2bf2c0c3a2e965ae1243cc8c60e9128bbaf` (same reviewed SHA as the s runs) |
| Served, t | `/torque-wrench/` 2882 B `6c9758dc769bf959945a2683521975c98a1eaa054c7151880e63874c5692a7c9`; `/assets/torque-wrench-TVIBm2F-.js` 17693 B `cdcd7c99439c506a4760d917ea685d8c507b17f077767775b6c76e6f537df874`; `index-fDwt6Stp.js` `391dcf6b3a2bde6bdf5641c004fab775e159b327e255ab70bb6b4ac3b7d9572d` |
| Served, s (pre-repair) | `/torque-wrench/` 2882 B `806a051f0cc76a6df8e837f1ef15141d3df1c1bfc7e9aaf0e48db85292e3f487`; `/assets/torque-wrench-DzCqm0A7.js` 17693 B `6cb6f4404183a31a0599d1422c54dcff92586d763ef60f7fa00f9f5f6c8b82ee` |

Repaired sources bound by the t record: `src/scene/torque-wrench/Scene.tsx` 3127 B
`86511e15fb4e92fa762459dcbeb29430486bfb5851b37b20a91ffa8daf33d875`;
`src/scene/torque-wrench/createPrivateRenderer.ts` 1358 B
`d04079d6274ebf397ab614edaced50475f581300fe1cb3acd3cb7d626bff6234`;
`src/scene/torque-wrench/createPrivateRenderer.test.ts` 1705 B
`27753f80985d4cb2b43b593e40bd8a31de216345cb95791bc52e840386280503`.

The entry chunk `index-fDwt6Stp.js` is byte-identical between s and t; the page chunk and HTML differ,
so the two runs are distinct served identities and no s runtime result may be applied to t bytes or
to later bytes.

## 2. Defect, repair and review record

Defect (pre-repair, `lifecycle-functional-20261014-s-D.json`): the detached capability probe obtained a
context, the connected `<canvas>` was denied, and `@react-three/fiber` 9.7.0 `configure()` rejected with
no error channel into React — `run()` aborts before `render()`, so no `onFailure` fired and the page
stayed in `mode: live` with a mounted canvas and no world. Installed-source basis: Canvas layout effect
`react-three-fiber.esm.js:62-119`; `configure` `events-156d8d12.esm.js:15700-15744`; renderer fallback
`:15736`; root teardown `unmountComponentAtNode` `:15971-15995`, `dispose` `:176-182`; three 0.185.1
constructor retry and `console.error` `three.module.js:16389-16410`.

Repair: `gl` becomes a factory (`createPrivateRenderer(onFailure)`) that constructs the real
`WebGLRenderer` with the Canvas defaults, and on construction failure calls the terminal `onFailure`
and returns a cached never-settling promise. The factory is reachable only inside `if (!state.gl)`, before
any scene/renderer/camera/events/XR/Provider state exists, so the failure path owns no GPU resource,
timer or listener; the cancelled promise prevents both a second construction attempt and an unhandled
rejection, and the inert `_roots` entry is released by `defaults.canvas` because R3F's own null-scene
disposal throws before its map delete.

The independent review of this repair was completed before this checkpoint was written: two rounds
(draft, then hardened) read against the installed `@react-three/fiber` 9.7.0 bundle, closing both items
raised — retry memoization of the cancellation promise and the `_roots` retention — with the final verdict
release-safe, the reachability invariant, `_roots` key identity, teardown-skip consequences and
success-path parity each traced to installed source lines. No renderer-source review remains outstanding.
The parent also recorded, before compaction, that the helper's 2 tests, the page tests, the cadGate
standalone 2 tests, `tsc` and the build all passed; those results are the parent's and were not re-run by
this checkpoint. No source, review or gate acceptance is claimed.

## 3. Post-repair lifecycle runtime (t)

| Report | Bytes | SHA-256 | Totals |
| --- | --- | --- | --- |
| `lifecycle-init-20261014-t-D.json` | 5471 | `024750ba9776192bb981c6645bb67f145b9f897650659604a810b218c3e71d76` | init-failure only: 1 PASS / 0 FAIL / 0 UNVERIFIED (started 2026-10-14T14:35:54.495Z) |
| `lifecycle-functional-20261014-t-D.json` | 8778 | `0e66b796eb536faa190764d0a5b96139c6c58af3ae89c894bac77af00016810c` | 3 PASS / 0 FAIL / 1 UNVERIFIED (started 2026-10-14T14:37:44.125Z) |

Both bind harness SHA `a5b149a7…8bbaf` and source manifest SHA `1cb17659…9bcf8`, URL
`http://localhost:5288`, headless Chrome with ANGLE/D3D11, Playwright 1.56.1.

Cases:

- `init-failure-renderer-construction` PASS (both reports): `precheckPassed: true`,
  `deniedConnectedContextCalls: 2`, `constructionErrorSeen: true`, `precheckMessageSeen: false`,
  `pageErrors: []`, DOM `mode: static`, `stage: poster`, `canvases: 0`, `footer: true`. This is the exact
  post-repair delta against the s run (`posterObserved: false`, `mode: live`, `canvases: 1`,
  `pageErrors: ["Error: THREE.WebGLRenderer: Error creating WebGL context."]`): the terminal fallback now
  presents the poster layer with no page error. One `consoleErrors` entry
  (`THREE.WebGLRenderer: … Error creating WebGL context.`) remains and is expected — three 0.185.1 logs
  before throwing — so the check must not require empty console errors.
- `churn-scroll-same-beat` PASS: 12x120 px at ~100 ms same beat, 0 same-beat DOM mutations, reversal
  ~-600 px, `pageErrorsDuringCase: []`. Functional proxy over `.torque-page`; not React-commit proof.
- `low-rate-controlled-delivery` PASS: 30 updates at ~30 Hz and 15 at ~15 Hz, 10800 px displacement,
  `ready: true`, no page errors. Controlled-rate observation, excluded from performance distributions.
- `hidden-resume-real-hidden` UNVERIFIED: after real second-tab activation the page stayed
  `visibility: visible`, `hiddenFrames: 0`; headless Chrome produced no genuinely hidden document and the
  harness never fakes visibility.

## 4. Post-repair static and timeline rosters (t)

| Report | Bytes | SHA-256 | Result |
| --- | --- | --- | --- |
| `../05-stage1-integration/runtime/functional-20261014-t-D.json` | 94383 | `c4d7ba48048ffc999e01a7e791b17b1f62996899be2e3833d86917c1db93e2a2` | 7/7 PASS |
| `../05-stage1-integration/runtime/functional-20261014-t-N.json` | 90133 | `dd3762d5d1946302024bde9032365d8cdb0783c207c28e3e2e987def66e57bc2` | 6/7 FAIL — preserved, not retried here |
| `../07-autonomous-2026-10-12/runtime-timeline/functional-20261014-t-D.json` | 61819 | `20532e94a6042e7106b8b06e9f9cf72de3576bf745ce706d2851905ea355f19d` | 9/9 PASS |
| `../07-autonomous-2026-10-12/runtime-timeline/functional-20261014-t-N.json` | 56217 | `c90df846f26e403c30fb2b00ad1af85d655f4c34abc6ffac46675f96d5c30f93` | 8/8 PASS |

D roster (captured 2026-10-14T14:44:23.553Z, `D 1440x900 DPR1 desktop`): D-static-full, D-lite,
D-poster-explicit, D-reduced-motion, D-scene-import-abort, D-scene-render-throw, D-scene-mql-downgrade
— all PASS. N roster (captured 2026-10-14T14:46:29.630Z, `N 390x844 DPR3 touch/mobile`):
N-static-full, N-lite, N-poster-explicit, N-reduced-motion, N-scene-import-abort, N-scene-render-throw
PASS; `N-scene-mql-downgrade` FAIL.

Exact N failure, preserved as observed: case `N-scene-mql-downgrade` (kind `mql`, durationMs 1163, 24
assertions), failing assertion 19 of 24 — `zero narrative CAD/decoder byte requests from
initialization` — detail `http://localhost:5288/models/Default.glb`. The other 23 assertions pass,
including `zero HTTP error responses (>=400)`, `zero console errors` and `zero uncaught page errors`;
every downgrade, poster-slot, canvas-removal and one-way-floor assertion passes. The same assertion in
the D run passes with an empty detail. Cause is not established here; the parent is investigating
before any retry, and no retry result exists.

Both reports bind the same t build (`.scratch/jg038-functional-20261014-t`), entry
`/assets/torque-wrench-TVIBm2F-.js` `cdcd7c99…537df874` and scene `/assets/Scene-CHJ2fOXp.js`
`2855182b43c2926ee71cd627c4693937a92d8a44a5c8a8537e3e9119e860dffa` (local == served, verified),
Playwright 1.56.1, Chrome 154.0.8037.98, GL renderer unmeasured.

The desktop timeline report (captured 2026-10-14T14:50:09.589Z, same t build and the same entry/scene
identities) passes all nine cases — D-live-conductor-forward, D-live-keyboard-inputs,
D-live-scrollbar-drag, D-live-equality, D-poster-explicit, D-reduced-motion, D-mql-downgrade,
D-scene-import-abort, D-scene-render-throw — under its native-input contract (wheel, keyboard, scrollbar
drag, real `emulateMedia` MQL, direct seek; no store setters). The narrow timeline report (captured
2026-10-14T15:24:53.539Z, same t build and scene identity) passes 8/8 — N-live-conductor-forward,
N-live-keyboard-inputs, N-live-equality, N-poster-explicit, N-reduced-motion, N-mql-downgrade,
N-scene-import-abort, N-scene-render-throw — so the t timeline roster stands at 17/17 (9/9 desktop +
8/8 narrow). The N static roster remains 6/7 as recorded above.

## 5. Preserved pre-repair and supplemental evidence

- `lifecycle-functional-20261014-s-D.json` — 8847 B,
  `435287e2c558493ed72eed12d6ae4fdcf154d641315ee90cce71ca8e867c6059` — remains the s-bound pre-repair
  defect record (2 PASS / 1 FAIL / 1 UNVERIFIED) and is not superseded by the t reports.
- `../07-autonomous-2026-10-12/runtime-timeline/functional-20261014-s-N-resume.json` — 56213 B,
  `f9e81ebee0adbb742744db6d25f9145c9d2a8dd6de1a102e37bb01b8bf3f31c5` — remains an s-bound supplemental
  narrow-timeline report reported complete by the concurrent wave; existence and hash verified here,
  contents not verified by this checkpoint.
- Concurrent-wave preparation documents, preserved unedited (parent-reviewed hashes, read-only to this
  checkpoint): `lifecycle-remount-plan-resume-20261014.md`
  `388be2a1a5a5d26d17009dd27fc8f600869e6ddc668275574fbab68f2f1901e8`;
  `performance-startup-plan-resume-20261014.md`
  `d4d97dbe1e3c92a5d262e24ba49d66d62d58a93d797ff5a67174692132d0247e`;
  `clearance-input-plan-resume-20261014.md`
  `6243a16540b9ff12f5b7329b0d8ef0f4bd134acc1013f1ca98e14b006d56777e`;
  `wave-ledger-20261014-resume.md` `62561b367033e8f54a88c50a318fdde4ccec79d4582ff88e1becb1788f355ab5`.
  Current functional wave ledger: `wave-ledger-20261014-functional.md` — parent-owned and still being
  extended while this checkpoint was written: 10672 B at
  `16e3604996270cfe02e0991ed8e8e5033ed55c55b0efcb76c7e722456f6440b2` when this checkpoint first read
  it, 12589 B at `b3deea8b1a598b07479b8fd87208558974ae827873f084c288b860355bcd1549` at correction time.
- Shared stage documents carry the parent's leading repaired-build banner (2026-10-14 t) and are owned by
  the parent; read-only hashes at checkpoint time: `08-stage4-opening-recovery/README.md`
  `51fabe8c3c04dbe5a1054cde011040269f4926b647d720dced068fb8f36d0a2f` (13692 B) and
  `07-autonomous-2026-10-12/GATES.md` `1b0d8c161057c8843cad1291271d72be79e86ff734b774b70429e1ef77e6363c`
  (6899 B). The original s text beneath each banner remains historical.
- Verifier-preparation documents the parent records as runtime-ready with the remaining static blockers
  closed (read-only reference; owned by their authors): `static-functional-review-prep-20261014.md`
  `539715afdafbdcd929b16fdd6ec4ad04824d1a69ad0a7df6c8a50886becd7637` (4427 B),
  `performance-contract-prep-20261014.md`
  `cfcf1ae5b4ec7875e7e7ed0ced693cb0d340c5d11a18e66b7cdec1dbb8482d56` (11388 B),
  `continuous-clearance-prep-20261014.md`
  `5ec0e0606bf96a4fd4a9d267be5eae32be502568e44b1c3fe452299b21ec1679` (13076 B).

## 6. Remaining gates and next actions

- The repair is uncommitted at HEAD `1c7a7d2d`; any later diff and its fresh source/build/served binding
  must be recorded before further runtime on changed bytes.
- Renderer repair review and its local checks are complete (section 2); no renderer-source review or
  author check remains outstanding, and later runtime evidence is added by the parent.
- Lifecycle items still open: dev-only StrictMode setup/cleanup/setup remount census (plan prepared, not
  implemented or run — production builds cannot exercise it); real hidden-document resume; React-commit-
  level proof (churn remains a DOM-mutation proxy); BFCache restore (persisted=false, retained).
- Static and timeline rosters on t: static D 7/7; timeline 17/17 (D 9/9 + N 8/8); static N 6/7 with the
  preserved `N-scene-mql-downgrade` failure, the one open static item, whose investigation and any retry
  belong to the parent. The parent records clearance, static-functional and performance verifiers as
  runtime-ready and runs the remaining runtime sequentially; nothing beyond the reports bound above is
  claimed here.
- Stage4 acceptance/exit not reached; Stage5 backgrounds and Stage6 offline art remain pending; owner and
  Astra review absent. G0–G9 remain open.

## 7. Non-claims and limitations

- No production-build remount behavior, zero-commit-during-scroll, GPU presentation, pacing, performance
  or collision-freedom claim is made from these reports.
- `storyText` differs between the runs (1347 s live vs 1300 t static) and was not investigated here; both
  reports show `footer: true` and non-empty story text. Churn/low-rate frame counters differ by a few
  frames between runs; recorded as observation only.
- Hash and existence verification in this checkpoint covered the files named above; no frozen manifest,
  protected file or release-packet binding was re-verified by this execution.
- No acceptance is claimed or implied anywhere in this document.
