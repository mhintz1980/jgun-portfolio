# JG-038 — Stage 1 shell coordination record

Written 2026-10-12 04:13 UTC by SESSION B — Lagrange (default GLM seat, explicit `zai/glm-5.3`, High). Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`, HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`. This session owns only this file and `final-review.md` (not yet written); all product, shared, harness and foundation files are read-only here.

This record refreshes the unapplied [shell activation packet](../04-stage1-foundation/shell-activation-packet.md) against current live source and documents the concrete coordination requirement for the four-file protected activation window. It performs and authorizes no activation. Source readiness below is separate from runtime activation, Stage 1 exit, G0–G9, or owner acceptance.

## Current exact applicable changes

The protected window spans exactly four files. Nothing in it has been applied: `torque-wrench/index.html` is absent, and the three shared files are byte-identical to the packet's preparation state (scoped `git diff` vs HEAD empty; registry row still inactive).

| # | File | Current state | Exact coordinated change (packet-governed) |
| --- | --- | --- | --- |
| 1 | `torque-wrench/index.html` | Absent | Create verbatim from the packet: byte-pinned `shell:fade:begin…end` sub-block (CRLF-normalized SHA-256 `e30f6045d8cfdb71a93e4c8a3af806e9699fa7f13da28720a3f507ce79bfc05b`, re-verified against `quiet-machine/index.html` this session), real head `<meta name="robots" content="noindex, nofollow" />`, module `<script type="module" src="/src/torque-wrench-main.tsx">`. No root redirect block; no `og:image` invented. Referenced `/favicon.svg` exists in `public/` (verified). |
| 2 | `src/shared/pages.ts` | Present, unmodified; row `reserved: true`, `href: null`, `htmlEntry: null`, with `private: true`, `fadeIn: true`, `index: 4`, `path: '/torque-wrench/'` | Flip only the torque-wrench row: `reserved: false`, `href: '/torque-wrench/'`, `htmlEntry: 'torque-wrench/index.html'`. Keep `private: true` and `fadeIn: true` so `publicPages()` still excludes it from every `PageNav` variant. No other row changes; `m249` stays reserved. |
| 3 | `src/shared/pages.test.ts` | Present, unmodified; contains the explicit inactive-row activation pin | Update the pin with the registry row in the same window: private **and active** with real build input (`reserved: false`, `href`, `htmlEntry`, `fadeIn: true`, `private: true`). Registry iteration does not update this pin by itself. |
| 4 | `src/shared/pageTopology.test.ts` | Present, unmodified; entry-list pin reads two entries | Update the hard-coded pin to the three-entry identity `['index.html', 'quiet-machine/index.html', 'torque-wrench/index.html']`. |

`vite.config.ts` requires **no edit**: current source derives Rollup inputs from `PAGES.filter((page) => page.htmlEntry)` (verified in live source), so flipping the registry row adds the third input automatically while preserving `index.html` and `quiet-machine/index.html`.

## Interface hash refresh — 10/10 match

All ten product interface files were re-hashed against live raw bytes this session (SHA-256 via context-mode `ctx_execute`); every value matches the packet's preparation hashes:

| File | SHA-256 (live = preparation) |
| --- | --- |
| `src/shared/pages.ts` | `8de3a3715ada82c01b4ae89e600ad649c7b254563a2f5ac3f33658007f185581` |
| `src/shared/pageFade.ts` | `da86f1b2488999d486d5f306e399dab940a35688ae027e0b232eac42439e453c` |
| `src/shared/PageNav.tsx` | `83009d0be82e19c3edb4d49e6b59357ddd9f39f20045322cf0f5015f9288c049` |
| `src/shared/poster.ts` | `304d4265cbc7b633f915fd7051e7dc16c81476d23a5c916db879ddd20f339b79` |
| `src/shared/PosterImage.tsx` | `7ebfd4ca8b7b2c1863c5baf9ba44a0db83204804b4419bcf91d7be5cb65d7fa7` |
| `src/shared/pageTopology.test.ts` | `f8ede06dba653ae48c3e6c4ddbcf17066eea44b3dd5eea30a519a05af86360e6` |
| `src/shared/pages.test.ts` | `5950c1f7754f1a76102b499526243d0284b27683c399cb7f56414a01ece59121` |
| `vite.config.ts` | `887896de4d3b287da3c90988b807bb27892b8dccf3a5235aeddd1153bda59157` |
| `quiet-machine/index.html` | `99099c847064c3c9b193c3dd969e73783628810656ab5c3cc95369ae3925a54e` |
| `src/quiet-machine-main.tsx` | `c841f8faed9794bb4a1df8f0e9ed54dcbf5c2b3acb16f8af34f94dde140cda53` |

Supporting presence checks: `src/torque-wrench-main.tsx` exists; `src/scene/torque-wrench/Scene.tsx` exists (honest zero-Canvas placeholder); the fade sub-block extracted from `quiet-machine/index.html` hashes to the pinned value above. Parent's parallel refresh (recorded in this directory's README/validation) independently confirms 18/18 source-manifest hashes and boundary checker exit 0, `pass: true`, 16 eager modules, one lazy edge `cadGate.ts -> ./Scene`. `public/torque-wrench/` does not exist; posters remain pending Stage 6 work.

## Actual shell owner — identity and evidence

The shell owner is the **external Quiet Machine shell-owning session, identified by its delivery track** — the session that delivered the shared shell primitives (registry/fade/navigation/poster interfaces). The identity rests on the in-workspace delivery/acknowledgment trail below; no live named chat or coordination window with that owner exists in this workspace, and this record claims no stronger identity evidence than that trail:

- [Doc 15](../../../../../docs/torque-wrench-rebuild/15-shell-readiness-acknowledgement.md): the shell owner's readiness note (`C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/docs/quiet-machine-shell-readiness-note-2026-10-11.md`) was supplied directly by the owner; its shared-shell delivery was later merged here under authorization at `92bafba5` from `9edfa552` (contracts at `6f4ee77f`).
- [Doc 17](../../../../../docs/torque-wrench-rebuild/17-reuse-readiness-ownership-reconciliation.md): shared shell is owned by "existing external owners; no write scope in this pass"; registry activation requires coordination.
- [Doc 19](../../../../../docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md): "Shell owner, coordinated with integrator — coordination remains a dependency; delivered shell primitives themselves are ready."
- [04 README](../04-stage1-foundation/README.md) and the activation packet: "The shell owner and parent coordinate a shared-file activation window. The shell owner adds the exact HTML and applies only the registry/test changes above."
- This directory's parent README states explicitly: reviewer assignment conveys no shell ownership, and no coordination window or transfer of shared write ownership has been supplied to this session set.

Reviewer assignment (Banach historically; SESSION B here) is **not** shell authority. Neither SESSION A (harness), SESSION B (this record), nor the parent holds shared-shell write ownership. No in-workspace document transfers that ownership, and this task's sessions have no authority to obtain new external coordination: cross-chat messaging is disabled and the external worktree must not be accessed.

## Concrete coordination requirement — window now ACTIVE

**Coordination window delivered 2026-10-12:** Quiet Machine commit `ad84ac055511c317f40e201712eaf13e18662bc9` ("docs: shell readiness note s15, coordination window for the torque activation"), section 15 of `docs/quiet-machine-shell-readiness-note-2026-10-11.md`, requested by the torque session and relayed by the owner. Read-only access to the Quiet Machine worktree was authorized for this review; this session wrote nothing there. The window is a coordination window, **not an ownership transfer**: section 7's rule stands (the shell block, `pages.ts`, and the topology/row tests belong to the Quiet Machine track), and the window is the "with this track's owner" of section 10's activation recipe.

Actual window terms (§15, authoritative — they supersede the activation packet's assumed shell-owner-applies division of labor):

1. **Edit owner while the window is open: the torque session's parent, as sole editor of the four files** in the `jgun-torque-wrench` worktree, in **one commit** following the §10 recipe (HTML entry, row flip, entry-list and row-pin updates; `src/torque-wrench-main.tsx` already exists from the foundation and is included per the recipe).
2. The Quiet Machine session makes **no edit** to any of the four files while the window is open; unavoidable QM `src/shared` needs during the window go to the torque session as a request, not a QM commit.
3. The window **closes** when the torque activation commit exists locally and `npx vitest run src/shared` passes there. Quiet Machine then merges that commit (or the owner assigns the merge), reads the three shared diffs, and records the closing in its note. Any shared-file change beyond the §10 recipe is reviewed before merge.
4. **Not authorized by the window:** build, `verify-page-transition.mjs`, any GPU/server work, push, deploy. The user has now authorized exactly the **single activation commit** — no other Git delivery of any kind.
5. The window has no clock; it stays open until term 3's closure. A full ownership transfer of the three shared files would supersede terms 2–3 and requires the owner's explicit chat say, which has not been given.

At window delivery, both branches held byte-identical copies of the three `src/shared` files (QM `421634c2` / torque `8945fa95`), none dirty, torque row still private/reserved/null (recorded in §15; consistent with this session's hash refresh above). The parent runs the validation sequence below and records the outcome; the harness session executes browser/static rosters only after closure plus a fresh resource check on the activated tree. Rollback within the window is the parent's reversal of its own single activation commit scope only — no broad reset, clean, or revert of the module, page-local files, other dirty work, or evidence.

Non-negotiable invariants inside the window: `private: true` preserved (the public-nav exclusion mechanism), `fadeIn: true` preserved, fade sub-block byte-pinned, `noindex, nofollow` as a real head meta, both hard-coded test pins updated, existing entries and public navigation untouched, no Vite edit, module path exactly `/src/torque-wrench-main.tsx`.

**Status: LOCAL WINDOW TERMS SATISFIED — QM-side closing record pending.** The single activation commit `69ac760bf575f6d3d2c5fe63578bf423d94798db` exists locally (verified by this session: commit object present, exactly 22 source paths — the four delivery files plus the 18 unchanged manifest files — and contained by no remote branch). Parent-attributed closure checks: `npx vitest run src/shared` exit 0 (8 files / 240 tests), page-local 20 pass, tsc/boundary/preflight exit 0. The parent relayed the commit and shared-test pass to the user in commentary; no external message, merge, or closure is claimed. What remains for window term 4 is the Quiet Machine side: it merges the commit (or the owner assigns the merge), reads the three shared diffs, and records the closing in its note. This session performed and authorized no push, merge, or cross-worktree write.

## Parent validation sequence after a documented window

Parent-scheduled; this session runs none of these (no build/browser/server/test/GPU work here):

1. `npx vitest run src/shared` — activated noindex check, pinned fade hash, module existence, three-entry Vite input identity.
2. `npx tsc --noEmit` and `node scripts/check-torque-stage1-boundary.mjs` on the activated tree.
3. `npx vite build --outDir .scratch/stage1-shell-activation/dist --manifest` (`--manifest` because a default Vite build emits no manifest); then `Test-Path` the emitted `dist/torque-wrench/index.html`. **Check the source and built HTML separately:** the pre-build source `torque-wrench/index.html` may be checked for the original `/src/torque-wrench-main.tsx` script, but post-build HTML references the hashed emitted module — so the built HTML must be checked for its actual emitted `/assets/*.js` module reference, the referenced emitted file must exist and match the emitted build manifest, and the built HTML must still carry the real `name="robots"` noindex meta and the `shell:fade:begin` marker. The scratch build must preserve `dist/index.html` and `dist/quiet-machine/index.html`; repository `dist/` stays untouched.
4. Only then, after a fresh RAM/CPU/process/port check: task-owned preview start/restart and the bounded static/failure browser roster under contract 18. Stage 0's Quiet Machine transition pass does not transfer to the torque entry.

## Authority limits for this record

- Product scope read-only; no shared-shell/V16/protected-file edits; `vite.config.ts` untouched.
- No build, browser, server, test, capture, or heavy CPU/GPU work; parent schedules jobs. CPU-only source preparation (hashing/presence checks above) is complete.
- No agent spawn/dispatch, Codex-native model/dispatcher, Git delivery (commit/push/PR), publication, deploy, cutover, archive, or cross-chat messaging.
- No external worktree/chat access, including the protected jgun-portfolio checkout and the external shell-owner worktree.
- No plugin installation or configuration; skills cannot override ownership, model routing, or authority.
- All existing dirty/untracked files preserved, including read-only [doc 19](../../../../../docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md). Parent's refreshed baseline (this directory's `baseline.json`): 273-product digest `bfbdf1f7a819c54366a6f757148517729cda7517f756137f036c36afb4e9dd79`, continuation-75 digest `01a74a5b3e6f3c122d89f4bbb14a685f02f506a048110b09a5bdbe71d5226157`, doc 19 digest `e5abebf5bb3fe2ebaccc2ce87099f72ff65ff2c45c9a3e8d896b617da095f52a`.

## Disposition

Preparation/source readiness: **current** — ten interface hashes matched at review; the fade pin matches; module and placeholder Scene exist; Vite needs no edit. Coordination: **local terms satisfied** under the QM `ad84ac05` §15 window — activation commit `69ac760b` exists locally with the exact 22-path scope and the shared-test pass condition is met (parent-attributed); the QM-side merge/closing record is pending. Git authority: the user authorized exactly this one local activation commit; no push, no other Git delivery. Post-coordination runtime: ran under the original owner prompt's parent resource window (§15 grants none of it) — scratch production build exit 0 (manifest `68f4a282…`), runtime roster 14/14 PASS / 396 assertions with actual command exit 0, served identity 10/10, preview stopped and fetch refused. Stage 1 static exit: **closed by parent acceptance** on the exact plan 13 wording and verified evidence, with no real-WebGL/final-poster/performance/G-gate claim. G0–G9 all remain open; runtime/owner visual/motion/publication gates remain open. Remaining window item: the QM-side merge/closing record (term 4).
