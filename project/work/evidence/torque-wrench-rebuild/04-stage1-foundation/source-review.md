# JG-038 — Stage 1 source review, final round

Reviewed 2026-10-12 02:44 UTC by the interface reviewer seat (explicit `zai/glm-5.3`, High). Scope was the finalized private entry, page-local store, every file under `src/scene/torque-wrench/`, the parent boundary checker, and the Stage 1 validation evidence. Product files remained read-only. This reviewer ran no tests, typecheck, build, browser, capture, server, or GPU work; command results below are parent-recorded and were not independently rerun.

## Verdict — PASS for the scoped new private static source foundation

The finalized source satisfies the Stage 1 page-local static foundation contract at the manifest identity below. The four round-1 blockers are repaired: the shared `PosterImage` import is correct, live tiers naturally progress through loading, scene render/import failure paths are connected, and HMR owns root/fade teardown. The extracted lifecycle also handles ready-store remount and poster downgrade correctly.

This is not a Stage 1 exit, G0 closure, activation, runtime acceptance, or final-poster acceptance. The private HTML/registry activation proposed in [shell-activation-packet.md](shell-activation-packet.md) remains unapplied, and browser/runtime proof remains open.

## Source identity

Identity is pinned by [source-manifest.json](source-manifest.json): branch `torque-wrench/rebuild`, HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`, and 18 source/checker files. This review recomputed all 18 SHA-256 values against the live bytes: **18/18 matched, 0 mismatches**. The separately owned external doc19 material was not accessed or edited.

## Final source findings

### Private entry and lifecycle

- `src/torque-wrench-main.tsx` resolves the shared entry tier synchronously before first render, mounts under StrictMode, and installs the delivered fade listener once. It retains the uninstall function and root handle, then unmounts/uninstalls them in `import.meta.hot.dispose`; normal cold-load document lifetime is preserved.
- `sceneLifecycle.ts` synchronously drives a non-poster document from `idle` to `loading`, wraps the loader so synchronous throws become rejection handling, and rechecks disposal, poster tier, and terminal failure before both loader evaluation and attachment.
- A ready store on a newly mounted page is reattached through the cached module without resetting status to loading. StrictMode setup/cleanup/setup therefore converges on one cadGate import rather than restarting the scene graph.
- Pending completion is discarded after disposal or poster downgrade. Failure calls the stable page callback and stores terminal `failed`; later status writes cannot revive that document.
- `cadGate.ts` retains the intended single dynamic `./Scene` edge, caches the default import, seals after failure, and exposes the same rejection on later calls. Test injection can bypass the cache without weakening the production seal.

### Failure boundary and typed scene contract

- `TorqueWrenchPage` wraps the mounted scene in `SceneBoundary` and also passes the same stable `onFailure` callback to the scene component. A render error unmounts the scene subtree and selects the poster layer without unmounting Story.
- `TorqueSceneProps` now requires `onFailure: (error: unknown) => void`, giving future initialization, context-loss, and asynchronous renderer failures an explicit typed route to the same terminal fallback.
- `SceneBoundary` catches render errors. React does not route arbitrary child effect throws or asynchronous WebGL failures through an error boundary, so future scene code must continue to call the typed callback for those failures. This is a deliberate future-runtime obligation, not a defect in the Stage 1 placeholder.

### Tier, Story, poster, and shared-shell use

- The page creates its media-query listener, samples reduced motion once on setup to close the entry/effect race, and only downgrades to poster. It never upgrades a reduced-motion document back to a narrative tier.
- Story is outside every scene/poster conditional. Its five accepted chapters retain identity and state across pending, ready, poster, and failure transitions. The story container is focusable (`tabIndex={-1}`), matching the skip-link target.
- The inspection control remains a real button with `aria-expanded`, `aria-controls`, a labelled region, native Enter/Space behavior, Escape closure, focus return, and listener cleanup. Its copy now identifies the accepted Input Shaft / P001835 subject and the material, hobbing, runout, and support story without claiming the future bullet-time runtime is present.
- `Poster.tsx` now imports `PosterImage` from `src/shared/PosterImage` and `posterFor` from `src/shared/poster`. The empty poster map renders five explicit Stage 6 placeholders and invents no asset paths, dimensions, or provenance.
- Page-local CSS styles the delivered `shell-*` nav without editing shared CSS. It supplies a visible skip link, page-wide focus-visible styling, and reduced-motion suppression for its one transition.
- `Scene.tsx` is an honest non-narrative placeholder: no Canvas, Three/R3F, model URL, fetch, or renderer. It must not be represented as CAD, WebGL, visual, or performance proof.

### Store and accessibility structure

- The page-local store has frozen replacement snapshots, stable subscribe/getState functions, unsubscribe behavior, one-way tier updates from the page, and terminal `failed` semantics. Its only import is type-only from the shared registry, so it remains runtime dependency-free.
- The semantic Story remains the accessible equivalent of the visually focused stage. The stage container is `aria-hidden`, avoiding duplicate consumption of decorative placeholders while chapter content stays in the document.

## Boundary checker assessment

The hardened checker is appropriate to its narrow Stage 1 contract. It traverses eager local imports/re-exports and the separate lazy Scene graph, enforces exactly one `cadGate -> './Scene'` dynamic edge, constrains eager externals to React/react-dom, confines narrative packages to the deferred graph, rejects root/state/store-boundary violations and alternate loader forms, fails on parse errors, and checks local static asset existence/surface.

Parent-recorded final result: exit 0, `pass: true`, no errors, 16 eager modules, and only `Scene.tsx` lazy. This checker does not replace typecheck, exported-symbol checking, browser network observation, canvas/WebGL telemetry, focus proof, or runtime cleanup evidence.

## Validation evidence reviewed

From [validation.md](validation.md):

- Source boundary: exit 0, `pass: true`, no errors; 16 eager modules and exactly one lazy Scene target.
- TypeScript: `tsc --noEmit` exit 0 with no diagnostics.
- Scoped tests: 13 files / 253 tests PASS in 4.85 s with one worker — 233 shared tests plus 20 Stage 1 tests. Stage 1 coverage now includes cadGate cache/seal, page static fallback structure, lifecycle loading/failure/disposal/poster skip/ready remount/downgrade, tier policy, and store snapshot/subscription/terminal behavior.
- Scratch private-module build: exit 0 using the delivered Vite/React/Tailwind config with an in-memory JS input and `publicDir: false`. It emitted a 41-module eager entry (`torque-wrench-CXHCUIPs.js`, 65,128 gzip bytes), no static chunk imports, and one deferred `Scene-CpRhW43u.js` module. Bundle metadata found no eager Three/R3F/GSAP/Lenis/postprocessing/troika/three-stdlib dependency.
- The module-only font warning is disclosed and expected from `publicDir: false`; the repository font exists. It does not establish public delivery.

The module build supports compile/code-split/no-eager-GPU claims only. It did not build HTML, activate the registry, copy public assets, launch a browser, or prove runtime behavior.

## Remaining limits and follow-ups

- Shell activation is still owner-coordinated and unapplied: real `torque-wrench/index.html`, pinned head/noindex, registry row, and the two hard-coded shared-test pins remain proposals. No Vite config edit is needed because inputs derive from `PAGES`.
- No real-DOM/browser proof exists yet for fade release, focus/inspection persistence across actual tier/failure transitions, keyboard behavior, MQL changes, HMR listener/root census, cold-load request audits, or zero narrative CAD/canvas mounts.
- The render boundary and typed failure callback are source-verified, but no actual WebGL initialization/context-loss path exists until the narrative Scene lands.
- The poster map is intentionally empty. Rendering a nonempty torque `PosterEntry`, final art, provenance validation, and final poster accessibility remain Stage 6 work.
- Stage 1 HTML/topology exit, G0–G9, Astra review, owner visual/motion acceptance, publication, cutover, and archive remain open. This independent GLM review is implementation advisory evidence and does not substitute for the plan’s Astra/owner acceptance gates.
