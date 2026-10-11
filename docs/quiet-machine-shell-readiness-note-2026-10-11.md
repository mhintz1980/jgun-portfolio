# Quiet Machine shared shell: readiness note for the torque track, 2026-10-11

**Answer in one line:** the shared shell is delivered and tested in this worktree for fade, navigation and HTML entry. It is NOT complete against the torque plan's Stage 0: there is no poster interface, no private-page registry flag, and no torque page registry entry. Those three are the remaining deliverables.

Docs only. No code, build, capture, GPU, push or deploy was done for this note. Worktree `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, branch `quiet-machine/integration`, HEAD `97e2d806`.

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

Shell files are clean in the working tree (`git status` shows no change under `src/shared`, `quiet-machine/`, `vite.config.ts`, `src/quiet-machine-main.tsx`, `QuietMachinePreview.tsx`, `index.html`). The uncommitted changes in the tree are the V16 materials track (scene files only).

## 2. Exact exports (import from these paths, do not recreate)

`src/shared/pages.ts` (zero imports)
- `PageId` union `'jgun' | 'quiet-machine' | 'm249'` (:4), `TierParam` `'full' | 'lite' | 'poster'` (:6), `PageEntry` (:8), `PAGES` (:26)
- `pageHref(id, tier = 'full')` (:65): `null` for a reserved page; `?quality=<tier>` for `lite` / `poster`
- `readTierParam(search)` (:72), `resolveEntryTier(search, reducedMotion)` (:78): reduced motion forces `poster`
- `LEGACY_REDIRECTS` (:94), `RedirectStatus`, `LegacyRedirect`

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

## 6. Poster interface: NOT delivered (the gap)

There is no generic poster primitive. Quiet Machine's poster is page-local:
- `POSTERS` array, 7 shots to 3 frames (`QuietMachinePreview.tsx:17`).
- Inline `<img src={`/images/rl300-${POSTERS[beat]}-preview.png`} alt={SHOTS[beat].caption}>` inside `.qm-poster` (:97).
- Entry decision is shell-level (`resolveEntryTier`, `TierParam 'poster'`); rendering is not.

The torque plan expects a shared interface. What exists to build on: `TierParam`, `resolveEntryTier`, `fadeReady`'s poster-releases-fade rule. What does not exist: a `Poster` component, a poster-map type (beat or chapter id to image, alt text, provenance), or a "mounts zero canvas, requests zero CAD" test helper. Quiet Machine's S5 (owner's runtime AO vs V16 Cycles choice) is unresolved and does not block defining the interface.

## 7. Other gaps that matter to the torque integrator

- **No torque registry entry.** `PageId` is a closed union (`pages.ts:4`); the torque page needs a `PageId` member, a `PAGES` row, an `htmlEntry`, and a test update (`pageTopology.test.ts:111-148` pins the exact entry set).
- **No private-page flag.** `PageEntry` (`pages.ts:8-24`) has no hidden/private field and `PageNav` renders every row (`PageNav.tsx:47`). A private torque page would appear in the nav of every page unless the registry gains a flag. This is a shell-owner edit, not something to work around in the torque tree.
- **Shared files need their owner.** `pages.ts`, `pageFade.ts`, `PageNav.tsx`, `vite.config.ts` and the head shell block belong to the Quiet Machine track; torque edits go through that owner.

## 8. Readiness evidence

| Evidence | Result | Where |
|---|---|---|
| `npx vitest run src/shared` (run for this note, 2026-10-11) | 5 files, 177 tests, all pass | this session |
| GPU-3 page-transition verifier at HEAD `275a4c0a` (shell code unchanged since) | 7/7 PASS at 1440x900 and 390x844; no UNVERIFIED case; bfcache really used | `project/work/evidence/rl300-quiet-machine/33-gpu-3-qm6-transition.md:26-42` |
| Mutation checks (no-white-frame, persisted flag) | recorded, files restored by sha | same file |
| GPU-1 entry smoke | recorded; found and fixed the QM4-fix context-loss defect | `31-gpu-1-qm-entry-smoke.md` |

Not re-run for this note: `npm run build`, `verify-page-transition.mjs`, `npm run typecheck`. The V16 track's uncommitted scene edits are in the tree, so a fresh GPU run would measure that mix, not the shell alone.

## 9. What remains (owner of each)

1. **Poster interface** (shell owner): define and test `Poster` + poster-map type + zero-canvas/zero-CAD helper. Estimate 60-100k tokens with tests, no GPU.
2. **Registry: private flag + torque entry** (shell owner, then torque integrator): small, test-pinned.
3. **Fresh readiness run** (either): `npm run typecheck`, `npm run build`, and `verify-page-transition.mjs` against `vite preview`, on a tree without V16 changes or with them named. Needs GPU coordination (torque plan Stage 0 item 3).
4. **Torque session acknowledgement** of this note (S0 exit condition in `quiet-machine-motion-background-plan-2026-10-11.md:52`).

Nothing here is committed. Stage this file by explicit path if it is to land.
