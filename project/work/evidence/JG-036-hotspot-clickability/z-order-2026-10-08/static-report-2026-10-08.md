# JG-036 Z1 final static report — 2026-10-08

## Source state

Baseline commit: `8db93913b2e91182199fb7d09c40273bd61c816a`. Z1 owns the current edits in:

- `src/data/caseStudies.ts`
- `src/scene/Hotspots.tsx`
- `src/components/TechnicalHUD.tsx`
- `src/components/Chapters.tsx`
- `scripts/verify-jg036-hotspot-layering.mjs`
- `project/work/evidence/JG-036-hotspot-clickability/z-order-2026-10-08/`

Concurrent work elsewhere (including the Shaft story layer and parent-owned plan updates) is present and untouched.

## Changed lifecycle requiring fresh review

The portal integration changed after the first architecture review from a nullable exported ref to a lazy, SSR-safe host registry:

1. `TechnicalHUD.tsx:19` — `getHotspotLayerPortal()` returns `null` when `document` is absent; in a browser it lazily creates one stable layer element and returns a non-null ref object whose current target is that element.
2. `TechnicalHUD.tsx:125-134` — a layout effect resolves the host and stable layer, appends the layer to the live z-0 HUD host, and removes only that layer on cleanup. If Drei attached badge wrappers first, moving this stable element carries them into the live tree.
3. `Hotspots.tsx:268,423` — each anchor memoizes one ref object and passes it to Drei only when non-null (`portal={hotspotPortal ?? undefined}`). No non-null assertion is used.
4. `TechnicalHUD.tsx:172-175` — the host is pointer-inert and contained by the z-20 HUD root. Drei badge wrappers and their leader lines remain pointer-inert; the real badge button alone re-enables pointer events.
5. `Chapters.tsx:342` — the scroll track is pointer-inert, while button/link/role-button descendants explicitly restore native pointer targets.

Reviewer source basis: installed Drei 10.7.8 `node_modules/@react-three/drei/web/Html.js` and `Html.d.ts`, plus the current official Drei Html page (<https://drei.docs.pmnd.rs/misc/html>). Drei resolves `portal.current`, appends its generated wrapper to that DOM target, and removes it when the target changes.

## Keeper contract

`caseStudies.ts:538` fixes the owner-narrowed active set to `rotor`, `duct-intake`, and `m249-trunnion`. `Hotspots.tsx:522-525` admits only that set; `rotor` is the sole deliberate exception to `STATION_REPLACED`. Authored windows, time track, camera frames, inspect selection, tolerance stations, scroll behavior, and parallax remain unchanged.

## Completed static checks

```powershell
npm run typecheck
npm test -- src/components/staticChapter.test.tsx
node --check scripts/verify-jg036-hotspot-layering.mjs
git diff --check
```

Results at this handoff: typecheck PASS; focused tests 12/12 PASS; verifier syntax PASS; diff check PASS. Z1 performed no build, preview restart, browser launch, GPU run, commit, or push.

## Exact V1 runtime commands

After V1 completes the integrated rebuild and serves a fresh preview on IPv4 localhost:5203 (restarting that preview after the rebuild), run normal quality first:

```powershell
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=normal
```

Only if the inherited global canvas failure reproduces, run the strictly functional/visual fallback:

```powershell
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=quality-lock-functional --quality-lock
```

The fallback report marks itself as excluding G6, tier, and performance claims. It does not modify the quality ladder.

## Open gates

- Fresh independent review of the lazy portal lifecycle above.
- V1 integrated build/fresh :5203 preview and GPU release.
- Hardware verifier report on all three keepers, desktop and narrow.
- Owner manual/visual checkpoint.
- Inherited G6 natural-tier failure.
- Keeper scope and inspect behavior are closed for Scope 1: exactly one per assembly, current inspect/parallax behavior preserved. Additional keepers belong to a separate future task.

Requested model: **GLM-5.3, reasoning max**. Served-model proof is parent-owned and not asserted by this static report.
