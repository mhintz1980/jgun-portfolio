# JG-035 four-callout placement follow-up — 2026-10-04

Owner request: adjust the locations of four items to match `../drawing-callouts-cutaway-FEEDBACK-1.png`. The white boxes and blue arrows identify placement, not replacement drawing styling. Existing navy lettering, part numbers, fit and tolerance values are retained; the owner's "BIG HOUSING" box relocates the existing Gearbox Housing annotation.

Output Spindle moves below-left of the shaft, with a leader landing on its lower face. Gearbox Housing moves farther left and down, with its endpoint inside the large barrel. Clutch Housing moves farther down-left, with its endpoint inside the narrow housing immediately before the selector band. Ring Switch moves lowest and right of its leader elbow, with its endpoint inside the band. All locations remain in sheet metres and project with the drawing. The `.001 A-B` output frame stays above-left; the `.004 A|E` frame follows the clutch label.

Source: `src/scene/drawing/sheet/composeSheet.ts`. Semantic drawing cache version 5, binary container version 3. Cache generation uses the live GPU bake with bypass and verifies exact equality of cached linework, fills, texts, marks and profile after both fresh-context HTTP load and reload. The generator now encodes the captured immutable bake locally using the site's existing codec; repeated Vite navigation/module invalidation interrupted the previous second browser export. Node 22.19 supports importing this type-only TypeScript codec directly. No source GLB is transformed.

The capture script now accepts `--url` and `--out`, waits for the damped camera to reach its goal, records live text bounds/camera and cached annotation marks, and fails on page errors in drawing-only mode. The previous fixed 1.2-second wait produced visibly different unsettled framing; `settled/` confirms convergence. Initial `proof.json` records an `isReady` page error. `verified/` records a passing repeat before the final spindle-tip adjustment. These are retained as diagnostics, not final evidence.

Final verification: `final/drawing-callouts-cutaway.png` and `final/proof.json` capture the final production build on a fresh preview at 4175. Zero page errors, annotations ready, precomputed cache loaded at version 5, all four live text-bound centres exactly equal their authored sheet marks. Camera position-to-goal error is 3.16e-8 m and FOV-to-goal error is 3.23e-8 degrees. Cache HTTP roundtrip is exact on fresh-context load and reload (`public/drawing/jgun-sheet-v2.evidence.json`, generated 2026-10-04T06:28:59Z). Production build/typecheck pass; B1/B2 31/31 and Stage 2 pass; script syntax and scoped whitespace checks pass. Existing build chunk-size warning remains. Broader runtime-roster failures in the implementation handoff remain outside this placement-only request; no full-roster or owner-acceptance claim is made. No commit, push or deployment.

Commands:

```powershell
node scripts/precompute-drawing.mjs http://localhost:5205
npm run build
node scripts/check-b1b2-contract.mjs
npm run check:station2
node scripts/capture-jgun-drawing-review.mjs --drawing-only --url=http://localhost:4175 --out=project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/drawing-review/feedback-1-2026-10-04/final
```

Existing preview on 4173 was not stopped: automatic approval review rejected the combined stop/restart command as "blocked by policy". Fresh servers on separate ports avoid interrupting existing processes; production capture uses a preview started after the final build.
