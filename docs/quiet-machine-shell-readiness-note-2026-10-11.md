# Quiet Machine shared shell: readiness note for the torque track, 2026-10-11

**Answer in one line:** the shared shell is delivered and tested in this worktree for fade, navigation, HTML entry, the poster interface, the zero-canvas/zero-CAD guard, and the private-page registry flag with an inactive torque-wrench row (commits `37c9d5f8` + review fixes `0bc6a787`, sections 6 and 7). An independent Astra review ran on `37c9d5f8`; its five findings are fixed in `0bc6a787` (section 9). What is not done: the torque HTML entry itself (torque integrator, Stage 1), the shell delivery into the torque worktree (section 10), a re-review of the fixes, and a fresh GPU readiness run (section 11).

**Revision 2026-10-11 (later):** sections 6-11 were rewritten after the owner authorized the poster interface and private registry work. The first revision named these as gaps; they are now delivered. Sections 1-5 are unchanged except the commit table and export list.

No build, capture, server, GPU, push or deploy was done. Worktree `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, branch `quiet-machine/integration`. Code delivery commit: `0bc6a787`.

## 1. Delivery commits (local, unpushed)

| Commit | What |
|---|---|
| `837139e6` QM1 | page registry, tier helpers, redirect table, boundary gate |
| `acf6b122` QM2 | page fade runtime and generic page nav |
| `1c78b2e7` QM3 | reduced motion becomes the poster path |
| `ccc87c2f` QM4 | multi-page build, Quiet Machine HTML entry, legacy redirect, header nav |
| `f669fd57` QM4-fix | context-loss listener on the stage |
| `f68db769` QM5 | length knob, progress bar, end card, prefetch |
| `79b6be87` QM6a | fade follow-ups (animationend, reduced-motion flag) |
| `e709e672` QM6 | page-transition verifier, 7 cases |
| `1feb4e8f` | this note and the motion/background plan (docs) |
| `37c9d5f8` | poster interface, zero-canvas/zero-CAD guard, `private` registry flag, inactive torque-wrench row |
| `0bc6a787` | guard false-pass fixes from the independent review; torque row `fadeIn: true`; noindex pin ignores comments (**the Stage 0 delivery commit**) |

Shell files are clean in the working tree (`git status` shows no change under `src/shared`, `quiet-machine/`, `vite.config.ts`, `src/quiet-machine-main.tsx`, `QuietMachinePreview.tsx`, `index.html`). The uncommitted changes in the tree are the V16 materials track (scene files only).

## 2. Exact exports (import from these paths, do not recreate)

`src/shared/pages.ts` (zero imports)
- `PageId` union `'jgun' | 'quiet-machine' | 'm249' | 'torque-wrench'` (:4), `TierParam` `'full' | 'lite' | 'poster'` (:6), `PageEntry` (:8, with `private` :28), `PAGES` (:31), `publicPages()` (:89)
- `pageHref(id, tier = 'full')` (:96): `null` for a reserved page; `?quality=<tier>` for `lite` / `poster`
- `readTierParam(search)` (:103), `resolveEntryTier(search, reducedMotion)` (:109): reduced motion forces `poster`
- `LEGACY_REDIRECTS` (:125), `RedirectStatus`, `LegacyRedirect`
- Poster: `src/shared/poster.ts`, `src/shared/PosterImage.tsx`, `src/shared/posterGuard.ts` (section 6)

`src/shared/pageFade.ts` (zero imports, nothing runs at module load)
- `installPageFade(doc, env?) => uninstall` (:207)
- `fadeNavigate(href, env?)` (:133), `shouldIntercept` (:111), `isFreshFlag` (:118)
- `releaseFade(env?)` (:251), `releaseFadeWhen(ready, env?)` (:265)
- `prefetchPage(doc, hrefs)` (:287)
- Constants (:16-30): `FADE_KEY 'jg:fade'`, `FADE_MAX_AGE_MS 5000`, `FADE_OUT_MS 400`, `FADE_FALLBACK_MS 450`, `FADE_OUT_ANIMATION 'shell-fade-out'`, `FADE_IN_MS 600`, `STATUS_DELAY_MS 800`, `HOLD_CAP_MS 2500`
- `FadeEnv` interface (:41) for test injection

`src/shared/PageNav.tsx`
- `PageLink({ id, tier, children, current? })` (:18): live page = `<a data-fade="" href>`; reserved page = plain `<span>`
- `PageNav({ current, tier, variant: 'header' | 'endcard' })` (:43): one row per `PAGES` entry. Class names are `shell-*` only; the mounting page owns styling.

## 3. HTML entry contract

- One HTML file per registry entry with `htmlEntry`. `vite.config.ts:9-10` builds the Rollup `input` from `PAGES`, so adding a page needs no config edit. `appType: 'mpa'` (:15) so `/quiet-machine/` is its own document, not an SPA fallback.
- A fade-in page's `<head>` carries the shell block, `quiet-machine/index.html:5-25`: `<!-- shell:begin -->`, `<!-- shell:fade:begin -->` style plus inline script, `<!-- shell:fade:end -->`, `<!-- shell:end -->`. The script reads `jg:fade`, and sets `data-fade="in"` when the flag is fresh and motion is not reduced. The block is copied by hand into each fade entry; `src/shared/pageTopology.test.ts:184` pins every copy byte for byte, and :177 pins that it exists in every `fadeIn` entry and nowhere else.
- The page module installs the runtime: `src/quiet-machine-main.tsx:10` calls `installPageFade(document)` once, before `createRoot`. Mount shape is the `main.tsx` pattern (`#root`, `StrictMode`).

## 4. Fade and navigation behaviour

- Click on a same-origin `a[data-fade]` (primary button, no modifier, not `target`/`download`, not fragment-only): `data-fade="out"`, write `jg:fade`, `location.assign` once on the root's `shell-fade-out` animationend or at 450 ms (`pageFade.ts:133-186`, `:207-230`).
- Arrival: head script sets `data-fade="in"`, removes the flag; the page calls `releaseFadeWhen(ready)`, which sets `release` and clears the attribute 600 ms later. Hold cap 2500 ms (:265-284). The style-only safety release is 4000 ms (`quiet-machine/index.html:10`).
- Reduced motion: navigates at once, no flag, no attribute (:134-141).
- Recovery: if the page is still here 5000 ms after assign and still `out`, attribute and flag are cleared (:153-182). bfcache restore (`pageshow` with `persisted`) clears both (:234-239).
- Tier rides on every outgoing link via `pageHref`. `?shot=` seek is Quiet Machine local (`QuietMachinePreview.tsx:34, 73`), not a shell feature.
- Prefetch: once, at `u >= END_CARD_AT` (.97), `prefetchPage(document, [pageHref('jgun', tier)])` (`QuietMachinePreview.tsx:12, 57-62`).
- `jgun` (`/`) has `fadeIn: false` (`pages.ts:36`): its `index.html` has only the legacy-redirect shell block (`index.html:5-17`) and `src/main.tsx` does not call `installPageFade`. Fade OUT of Quiet Machine to `/` works; `/` does not fade in. A torque page that wants a fade in needs `fadeIn: true`, the shell block, and the `installPageFade` call.

## 5. Lifecycle and cleanup

- `installPageFade` returns an uninstall that removes the click and `pageshow` listeners (:244-247). `quiet-machine-main.tsx` discards it: document lifetime equals listener lifetime in this multi-page build. A torque entry that mounts and unmounts inside one document must keep the return value.
- `releaseFadeWhen` returns nothing and has no cancel. It polls with `requestAnimationFrame` for at most 2.5 s and touches only the root attribute. A `ready` that throws counts as not ready (:272-275).
- `navigationSerial` is module state (:39); a newer navigation or a bfcache restore neutralises a pending recovery.
- Quiet Machine's own effects clean up on unmount: scroll, resize, `visibilitychange` and capture-phase `webglcontextlost` on the stage (`QuietMachinePreview.tsx:92`), and `window.__quietMachine` (:79).
- Failure path: a scene error or context loss sets `poster` true (:54, :89), which satisfies `fadeReady` (:39-41), so the fade is never held for a dead canvas.

## 6. Poster interface: delivered in `37c9d5f8`, hardened in `0bc6a787`

The torque page owns its own `Poster.tsx` (semantic story plus art) and `posterMap.ts` (structure section 5). Shared supplies the types, the validation and one generic image primitive. Nothing in shared knows a beat list.

- `src/shared/poster.ts` (imports only `./posterGuard`)
  - `PosterEntry`: `id` (beat or chapter), `alt`, `desktop`, optional `narrow` (`PosterFile`: `src`, `width`, `height`), `status` `'temporary' | 'final'`, `provenance` (nullable).
  - `PosterProvenance`: `origin: 'offline-render'`, `sourceScene`, `settings`, `assetVersions`. These are torque plan line 160's fields; output dimensions are on each `PosterFile`. A runtime-canvas capture cannot claim `offline-render`.
  - `validatePosterMap(map, expectedIds?)` returns readable problem lines; empty is valid. Checks: unique ids, non-empty alt, root-relative raster `src`, no CAD path, positive integer dimensions, final art carries provenance, every expected id has a still.
  - `posterFor(map, id)` returns the entry or null, never throws. `POSTER_NARROW_MEDIA` is `(max-width: 600px)`, the switch point `StaticShaftStory.tsx:13` already uses.
- `src/shared/PosterImage.tsx`: `PosterImage({ entry, className = 'shell-poster', loading = 'lazy', children })` renders `figure > picture > source(narrow) + img`, sized, described, `decoding="async"`. Imports only a React type.
- `src/shared/posterGuard.ts` (zero imports), the zero-canvas / zero-CAD helper:
  - `checkPosterPath({ markup?, canvasCount?, canvasMounts?, requireMountObservation?, requestedUrls?, extraCadPatterns? })` returns `{ ok, canvases, cadRequests, problems }`.
  - Evidence rules: missing or invalid (`NaN`, negative, fractional) counts and a missing request list are problems, never passes. Contradictory evidence takes the worse reading (markup shows a canvas while `canvasCount` says 0: fails). An empty request list is evidence.
  - `CAD_ASSET_PATTERN` always applies: `*.glb|gltf|drc|ktx2`, and anything under `/models/` or `/draco/` (catches `role-map.json` and the Draco decoder). `extraCadPatterns` add to it and never replace it; `g`/`y` flags are stripped so a pattern holds no `lastIndex` state. Rasters under `/images/` and `/inspection/` pass.
  - A canvas count read after load is a snapshot and cannot see a canvas mounted then removed. For "never mounted during the cold load", install `CANVAS_MOUNT_OBSERVER_SOURCE` with `page.addInitScript` before navigation, read `window.__posterCanvasMounts`, and pass it as `canvasMounts` with `requireMountObservation: true`. It counts `createElement('canvas')` and inserted nodes; it does not cover OffscreenCanvas or workers.
  - Browser use: `checkPosterPath({ canvasCount, canvasMounts, requireMountObservation: true, requestedUrls })`, with every cold-load request URL from the network log.

Not changed: Quiet Machine still renders its own inline `<img>` (`QuietMachinePreview.tsx:97`). Adopting `PosterImage` there is a runtime edit that needs a GPU re-run, so it is left for the readiness run. Torque is the first consumer.

## 7. Private registry flag and torque entry: delivered in `37c9d5f8`

- `PageEntry.private: boolean` (`pages.ts:28`). Semantics: built and reachable by direct link, never listed in public navigation, and its HTML entry must carry a robots noindex meta in the head (pinned, below).
- `publicPages()` (`pages.ts:89`). `PageNav` maps `publicPages()` only, so a private page is absent on every variant and tier, including when it is the current page (`PageNav.test.tsx`, "never lists a private page").
- `PageId` gains `'torque-wrench'` (`pages.ts:4`). The row (`pages.ts:73-84`): `path '/torque-wrench/'`, `index 4`, `reserved: true`, `href: null`, `htmlEntry: null`, `fadeIn: true`, `private: true`. `pageHref('torque-wrench', *)` is null at every tier.
- The build stays valid: `vite.config.ts:9-10` takes inputs from rows with an `htmlEntry`, and this row has none. `pageTopology.test.ts` pins "reserved iff no entry and no href" and "input keys equal the rows with an entry".
- New pins (`pageTopology.test.ts`, "private pages"): an inactive private row is reserved with a null href; an active private row names an HTML file whose head, comments stripped, carries `<meta name="robots" content="...noindex...">` (with positive and negative fixtures: commented-out, body-only and `index` all fail); no legacy redirect targets a private page.
- Not done and not this track's: `torque-wrench/index.html`, `src/torque-wrench-main.tsx`. Their absence is expected before torque Stage 1.

Shared files still need their owner. `pages.ts`, `pageFade.ts`, `PageNav.tsx`, `poster*.ts`, `PosterImage.tsx`, `vite.config.ts` and the head shell block belong to the Quiet Machine track; torque edits go through that owner.

## 8. Readiness evidence

| Evidence | Result | Where |
|---|---|---|
| `npx vitest run src/shared` at `0bc6a787` | 8 files, 230 tests, all pass (was 5 files, 177) | this session, 2026-10-11 |
| `npx vitest run src/scene/rl300` (V16 dirty edits are in this tree) | 2 files, 59 tests, pass, run at `37c9d5f8` | same |
| `npx tsc --noEmit` at `0bc6a787` | no output (clean) | same |
| GPU-3 page-transition verifier at `275a4c0a` | 7/7 PASS at 1440x900 and 390x844; shell runtime unchanged since | `project/work/evidence/rl300-quiet-machine/33-gpu-3-qm6-transition.md:26-42` |
| GPU-1 entry smoke | recorded; found and fixed the QM4-fix context-loss defect | `31-gpu-1-qm-entry-smoke.md` |

Not run: `npm run build`, `verify-page-transition.mjs`, any browser or server. The commits since `275a4c0a` change registry data and add files; they do not touch the fade runtime or the page head shell, but only a fresh run proves that.

## 9. Independent review (Astra)

- **Run:** `codex exec --model gpt-6-astra`, effort high, read-only sandbox, target `37c9d5f8`, 66,693 codex tokens. The CLI header printed `model: gpt-6-astra`, provider `opencodex`. The reviewer's own first line said "GPT-6 (Codex); the exact served variant is not exposed to me", so the served model is configured, not independently proven.
- **Verdict:** no ACCEPT/REJECT line was returned. Two P1 and three P2 findings; read as accept with fixes.
- **Findings and disposition (all fixed in `0bc6a787`, each with a red test that reproduces the counterexample):**

| # | Sev | Finding | Fix |
|---|---|---|---|
| 1 | P1 | `canvasCount: 0` overrode `markup` with a canvas; `NaN` passed; a mounted-then-removed canvas is invisible to a snapshot | worst reading wins; counts validated; `canvasMounts` + `CANVAS_MOUNT_OBSERVER_SOURCE` + `requireMountObservation` |
| 2 | P1 | a custom CAD pattern replaced the default; a `g` flag made a repeated URL flip to pass | `extraCadPatterns` add to the default; `g`/`y` stripped |
| 3 | P2 | activation recipe left `fadeIn: false` and skipped the fade-block pin | row is `fadeIn: true`; recipe lists the block, the pin updates and the failure modes (section 10) |
| 4 | P2 | noindex regex accepted a commented-out meta; test ran zero assertions | head only, comments stripped, positive and negative fixtures |
| 5 | P2 | `PosterImage` test claimed network behaviour it does not observe | relabelled a markup/classifier test; acceptance needs captured request and mount evidence |

- **Not done:** a round-2 re-review of `0bc6a787`. The fixes are checked by the red tests above and by `vitest` and `tsc`, not by Astra. One more focused round fits the two-round cap.

## 10. Delivery into the torque worktree, and activating the private page

Both worktrees share one Git object store (`git rev-parse --git-common-dir` is `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.git` in each), so every commit above is already reachable from `jgun-torque-wrench`. Nothing needs copying. The merge-base of `quiet-machine/integration` and `torque-wrench/rebuild` is `666cbf23`.

Delivery is a merge of `quiet-machine/integration`, not a cherry-pick of one commit. The range `666cbf23..37c9d5f8` was 19 commits (eight QM code commits QM1 `837139e6` to QM6 `e709e672`, the poster/registry commit, the rest planning and handoff docs), plus `0bc6a787`, and `PAGES` carries the Quiet Machine row, so any torque build also builds `quiet-machine/index.html` and its scene. Surfaced, not solved here. The V16 materials edits are uncommitted in this worktree and are not part of the range.

Activation recipe, one commit (torque integrator, with this track's owner):
1. Land `torque-wrench/index.html` with: the shell block (`<!-- shell:begin -->` through `<!-- shell:end -->`, fade sub-block byte-identical to the reviewed copy, hash pinned at `pageTopology.test.ts:34`), `<meta name="robots" content="noindex">` in the head, and `<script type="module" src="/src/torque-wrench-main.tsx">`. Land `src/torque-wrench-main.tsx` calling `installPageFade(document)` and keeping the return value if it unmounts.
2. Flip the `pages.ts` row: `reserved: false`, `href: '/torque-wrench/'`, `htmlEntry: 'torque-wrench/index.html'`. Leave `fadeIn: true` and `private: true`.
3. Update the entry list at `pageTopology.test.ts:112` and the row pin in `pages.test.ts` ("pins the torque-wrench row as private and inactive").
4. `npx vitest run src/shared` must pass.

Failure modes, all caught before a build: a flip without the HTML file throws at `pageTopology.test.ts:39-43` (file read); a flip with `fadeIn: true` but no fade block fails the fade sub-block pins; a missing or commented-out noindex fails the private-page pin; a stale entry list or row pin fails its own test.

## 11. What remains (owner of each)

1. **Round-2 Astra review** of `0bc6a787` (optional, owner's call; about 65k codex tokens).
2. **Fresh readiness run** (either track): `npm run typecheck`, `npm run build`, `verify-page-transition.mjs` against `vite preview`, on a named tree. Needs GPU coordination (torque plan Stage 0 item 3). Separate from this delivery, per the owner.
3. **Merge into the torque worktree** (torque integrator): section 10.
4. **Torque HTML entry and activation** (torque integrator, Stage 1): section 10.
5. **S0 item 5** in the motion plan (QM4 plan pointer) is still unticked.
