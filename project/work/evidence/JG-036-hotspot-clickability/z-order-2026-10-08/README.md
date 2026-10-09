# JG-036 Scope 1 — keeper hotspot layering (2026-10-08)

## Owner narrowing

Mark narrowed Scope 1 to one authored keeper per assembly: **rotor** (JGun), **duct-intake** (RL-300 intake airway), and **m249-trunnion** (M249 barrel/trunnion bore). These stable IDs match the authored occurrences `ROTOR-1`, `DUCT_INTAKE`, and `BARREL_TRUNNION`; all other definitions remain intentionally dormant for a later task. Existing inspect behavior, tolerance stations, scroll timing, camera frames, and pointer parallax are unchanged.

## Layer contract

- Chapter content remains at z-10. HUD chrome remains at z-20.
- Drei `Html` badge wrappers portal into a pointer-inert host as the first z-0 child of the HUD root. Interactive HUD controls are later z-10 siblings, so badges paint above chapter text but below station/material controls and the inspect card.
- Badge buttons remain real native `<button>` elements with `aria-pressed`, `aria-label`, Enter/Space behavior, and focus-visible styling. Only the buttons re-enable pointer events; neither the WebGL canvas nor a full-screen DOM layer is promoted to catch everything.
- The chapter scroll track supplies height and is pointer-inert, while its button/link/role-button descendants explicitly restore pointer events. The fixed chapter cards and their real controls remain clickable.
- No anchor windows, chapter ranges, time track, `STATION_REPLACED` set, inspect frames, selection logic, scroll lock, or parallax behavior are changed.

Portal lifecycle was checked against the installed Drei 10.7.8 `Html` implementation/types and the current official Drei Html documentation. `portal` is a target-container ref; the implementation resolves `portal.current` and appends/removes its generated wrapper when that target changes. The host element is created lazily (Node/SSR safe), remains stable, and is attached to the HUD host in a layout effect. No nullable ref is passed to Drei and no non-null assertion masks mount state.

## Static verification

- `npm run typecheck`: PASS.
- `npm test -- src/components/staticChapter.test.tsx`: PASS, 12/12.
- `node --check scripts/verify-jg036-hotspot-layering.mjs`: PASS.
- `git diff --check`: PASS (only unrelated concurrently owned files produced line-ending warnings).

No build, server, browser, GPU run, commit, or push has been made by Z1.

## Prepared runtime proof

Script: `scripts/verify-jg036-hotspot-layering.mjs`.

The script uses installed Windows Chrome with hardware ANGLE/D3D11 through `scripts/lib/browser-launch.mjs`. On desktop 1600×900 and narrow 390×844 it settles each keeper position, checks `document.elementFromPoint`, performs a real actionability-checked click (never DOM `click()` or forced locator clicks), asserts camera movement plus HUD card content, exits through the real close button, and proves wheel pass-through at a blank canvas point. It also reopens/recloses the chapter case-study launch after the badge route, covers the rotor Enter/Escape keyboard route, and checks the reduced-motion no-canvas/no-badge/native-scroll route. A missing badge is recorded as an explicit natural-render open gate.

After V1 releases the integrated build/GPU slot, run normal quality first:

```powershell
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=normal
```

Only if the inherited global canvas failure reproduces, rerun as a functional/visual candidate:

```powershell
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=quality-lock-functional --quality-lock
```

The fallback report explicitly excludes tier, performance, and inherited G6 claims. It does not alter the quality ladder.

## Manual checkpoint (pending parent-owned build/preview release)

After the integrated rebuild, V1/parent should serve the frozen build on **localhost:5203**. Open the normal URL first. At approximately 49%, 75%, and 83%, click the three badges, confirm the camera/HUD inspection and real close behavior, reopen the chapter case study, wheel over an empty canvas area, and use Enter/Escape on the rotor badge. If the known canvas collapse reproduces, repeat only the functional/manual check with `?qualityLock=1` and record that G6 remains open.

## Open gates

- Integrated rebuild, localhost:5203 preview, and hardware verifier run: pending V1 release.
- Natural tier/G6 evidence: open; a quality-locked fallback cannot close it.
- Owner visual/manual acceptance: open.
- Keeper scope and inspect behavior are decided: exactly one hotspot per assembly now, current inspect/parallax behavior preserved. Additional keepers are a separate future task, not an open Scope 1 decision.
- Served-model proof: parent-owned and not asserted here. Requested model was **GLM-5.3, reasoning max**.
