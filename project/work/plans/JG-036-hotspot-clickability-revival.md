# JG-036 — 3D Hotspot Clickability & Revival

**Accepted:** 2026-10-08, owner intake approval given in session immediately after the live diagnosis ("make it a proper task in the queue… addressed next session along with whatever else they had planned").
**Branch baseline at acceptance:** `codex/jg033-signature-shot` @ `6cca1b0`.
**Diagnosis record:** [`project/work/evidence/JG-036-hotspot-clickability/diagnosis-2026-10-08.md`](../evidence/JG-036-hotspot-clickability/diagnosis-2026-10-08.md) — read it first; every claim below is anchored there.

## Problem statement

The owner asked for click-to-inspect 3D hotspots long before JG-035 and has **never seen one work**. The diagnosis proves him right: on no branch in the lineage has a hotspot ever worked end-to-end, and on the current HEAD **zero hotspot badges render at all**. The wiring that exists (`HOTSPOTS` in `src/data/caseStudies.ts`, `HOTSPOT_INSPECT_FRAMES` in `src/scene/CameraRig.tsx`, badge projection in `src/scene/Hotspots.tsx`, the `TechnicalHUD` detail panel) is mostly dead data and dead layers.

Three independent failure layers (all verified 2026-10-08):

1. **Pointer layer (proven on `origin/ccr-50494e4f-n9kq7i` @ `4970ded`):** badges render in the M249 chapter, but the chapter text column (`MAIN > DIV.relative.z-0`) paints above the badge layer — `document.elementFromPoint()` at badge centers returns the wrapper; Playwright refuses the click as non-actionable. User clicks never reach the button.
2. **Camera layer (same build):** with the pointer bypassed (programmatic `btn.click()`, `aria-pressed` flips, `hotspotId` set in the scroll store), the camera never flies — CAM telemetry byte-identical for 4+ seconds despite inspect frames existing for all 18 defs. Root gate in that era's rig code untraced (superseded; fix forward on HEAD instead).
3. **Render layer (current HEAD):** zero `button[aria-pressed]` hotspot badges in the DOM at scroll 14 / 35 / 47.5 / 50 / 54 %, including dead-center inside the only def's window:
   - `src/scene/Hotspots.tsx` carries `STATION_REPLACED = {rotor, motor-housing, flange, gearbox-housing}` — the wrench four were removed in JG-035 and replaced by the tolerance stations S1–S6, which are **passive** (`ToleranceStations.tsx` has no click handlers).
   - The anchor filter `h.chapters.includes(0) || h.chapters.includes(1) || h.window` — of the 14 surviving defs only `lcd` has a `window` (`[0.44, 0.51]`); the other 13 can never build anchors.
   - The `lcd` window is stale against the lengthened scroll track: at 47.5–50 % (inside the window, CH.01 active, role-map loaded) the badge still does not appear.

**Coverage gap that let this survive:** no verifier roster has ever included a hotspot click — every roster is scroll/telemetry; vision confabulates on the dark scene; and post-JG-035 the wrench chapter shows passive annotations, so nothing *looks* missing.

## Owner decisions needed before/at implementation

1. Which stations get clickable hotspots vs. the JG-035 tolerance stations — the wrench four were deliberately replaced (owner direction: the old hotspots "pointed at areas that don't mean anything"). Restore clickable inspection *alongside* S1–S6, or restrict revival to enclosure / M249 / electronics?
2. Click-behavior contract: existing design (inspect-frame camera flight + `TechnicalHUD` GD&T card + Esc/click-away restore) or something newer.

## Scope

1. **Z-order fix** — the hotspot badge layer (and HUD chrome generally) must reliably beat the content column at every chapter; prove with `elementFromPoint` probes at rest (see the diagnosis's false-positive lesson: never probe mid-HUD-transition) plus real actionability-checked clicks, desktop + narrow.
2. **Def cleanup** — real `window`/chapter gating for every keeper def; retarget or drop the stale `lcd` window; delete or implement the dead defs honestly so `caseStudies.ts`/`CameraRig.tsx` describe live behavior.
3. **Camera inspect path** — make selection → camera flight → HUD card → exit-restore work end-to-end for every keeper on HEAD (the frames table already covers all 18 ids; the consumption path is what fails).
4. **Verifier guard** — add a clickable-hotspot case to the runtime verifier roster: badge present in its window, real click lands on the button, camera goal changes, HUD card opens, exit restores the scroll pose. This closes the class of rot, not just this instance.

## Required proof

- New verifier case(s) PASS on desktop + narrow, on Windows hardware GL (not SwiftShader, not the ZCode in-app webview — the diagnosis's HEAD probes ran there and the badge absence must be re-confirmed in the trusted environment, even though the code-level unrenderability of 13/14 defs is environment-independent).
- `npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2`.
- Keyboard path (badges are real `<button>`s: Enter/Space, focus-visible ring) and reduced-motion behavior.
- Owner visual ruling at a designated stop point.
