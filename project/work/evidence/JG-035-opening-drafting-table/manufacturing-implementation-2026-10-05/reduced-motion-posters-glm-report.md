# Reduced-motion posters — GLM report (2026-10-06)

Spec: `reduced-motion-posters-glm-spec.md` — owner decision "posters throughout". Owned: `src/App.tsx`, `src/components/StaticPoster.tsx`, `src/state/qualityStore.ts` (docs only), this report. Edits unstaged; concurrent work untouched.

## Owned diff

- **App.tsx** — study gate `!reducedMotion && …'rl300'`; `canvasActive = tier !== 'poster' && !reducedMotion` (`motionActive` removed); ScrollRig, IntroTitles, ToleranceStations, TechnicalHUD, BootSequence follow `canvasActive`; poster receives `reason={reducedMotion ? 'reduced-motion' : 'poster-tier'}`.
- **StaticPoster.tsx** — optional `reason?: 'poster-tier' | 'reduced-motion'` selects a truthful mode line: reduced motion reads "REDUCED MOTION PREFERRED; ANIMATED 3D DISABLED" (no hardware-failure claim); default "STATIC RENDER MODE".
- **qualityStore.ts** — comment only: reduced motion gates the canvas without stepping tiers; the ladder is unchanged.

## Why fresh reduced-motion startup cannot import/mount SceneCanvas or request CAD

`qualityStore` reads the media query at module load, so App's first render has `canvasActive === false`. `SceneCanvas` is React.lazy inside that branch; lazy modules fetch only when rendered, so the canvas chunk never imports. Every CAD URL (Default.glb, msp-enclosure.glb, m249-transformed.glb, knurling-tool.glb, manufacturing-core-*.glb, rl300-lite.glb) resolves inside those chunks; the rl300 study is skipped too. Chapters (native scroll), StationNav and RingInspection stay mounted; RingInspection's `staticMode = tier === 'poster' || reducedMotion` routes to `enterInspection(…, static)` → status `ready`, no runtime; the shaft study renders `/inspection/shaft/*.webp` rasters.

## Cleanup / exact limitations

Mid-session toggling unmounts Canvas; explicit cleanups exist (PMREM environment, explode-shadow texture, station-warm cancel); R3F disposes the scene. drei's useGLTF cache retains parsed GLBs (no `useGLTF.clear` exists) — memory kept, no re-download; `window.__threeCamera/__threeRenderer` probes go stale; when reduced motion coincides with poster tier, the mode line names the preference only.

## Follow-ups (parent-authorized)

StationNav's "Rendered only in the poster tier…" comment and BootSequence's "reduced motion: static single-line percentage" doc bullet corrected — doc-only, behavior unchanged. Decision date corrected to 2026-10-06.

Parent runs full tests/build + production lifecycle/static/opening regression. No staging/commit/push; no memory writes.
