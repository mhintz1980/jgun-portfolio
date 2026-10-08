# JG-036 demo validation — 2026-10-08 (owner-requested preview)

Method: disposable worktree of HEAD (`c8a0488`) at `C:/Users/Markimus/.buzz/REPOS/jgun-hotspot-demo`
with ONE throwaway source edit (never committed): `src/scene/Hotspots.tsx` anchor filter reduced to
`HOTSPOTS.flatMap(...)` — i.e. `STATION_REPLACED` and the `chapters(0/1)||window` gate neutralized so
all 18 defs build anchors. The z-order blocker was patched at RUNTIME (walk each badge's positioned
ancestors, set `z-index: 999`) — a demo stand-in for the real fix JG-036 must land in source.
Capture harness: `.scratch/hotspot-demo-capture.mjs`, installed Chrome headless via the repo's
`scripts/lib/browser-launch.mjs` (D3D11), 1600x900, real actionability-checked Playwright clicks.

## Result: 7/7 owner-selected hotspots worked end-to-end (click -> camera flight)

| Hotspot | Found at | Camera flight (after) | FOV |
|---|---|---|---|
| AIR MOTOR ROTOR | 49% CH.01 | [0.153 0.099 0.120] | 24.0 |
| DATUM A - MOTOR BORE | 49% CH.01 | [0.172 0.110 0.040] | 24.0 |
| DATUM F - INTAKE AIRWAY | 75% CH.03 THERMAL | [29.772 1.620 -2.800] | 28.0 |
| DATUM G - EXHAUST DUCT | 75% CH.03 THERMAL | [29.573 1.820 -9.200] | 28.0 |
| DATUM B - BARREL TRUNNION BORE | 83% CH.04 DIGITAL | [56.190 0.270 -11.350] | 22.0 |
| DATUM C - MIL-STD-1913 TOP RAIL | 83% CH.04 DIGITAL | [56.170 0.470 -11.400] | 22.0 |
| FEED TRAY & BOLT CARRIER GUIDE | 83% CH.04 DIGITAL | [56.195 0.340 -11.300] | 24.0 |

Full telemetry in `summary.json` (camBefore/camAfter per click). Screenshots are supporting context
(dark scene — telemetry is the ground truth per repo rule).

## Facts this establishes for JG-036

1. **The camera inspect path WORKS on HEAD.** The "camera never flies" failure was observed on the
   ccr-era build only; on HEAD, a real click on a rendered, unobstructed badge flies the camera to the
   authored `HOTSPOT_INSPECT_FRAMES` pose (exact FOVs match the table). Scope item 3 of the plan
   downgrades from "diagnose the frozen gate" to "keep it working under the verifier case".
2. **The z-order blocker is universal**: every one of the 7 badges was `covered: true` (content
   column paints above the badge layer) before the runtime lift. The source fix is required at all
   chapters, not just CH.04.
3. **Render gating is the only thing hiding the other badges**: with the one-line filter change, all
   chapter-appropriate badges mounted (wrench internals appear ~49-51% during the disassembly beat;
   enclosure datums at CH.02/03; M249 + the handle-electronics trio at CH.04 — 6 badges observed at
   CH.04, confirming mcu/lcd/lipo anchor and render fine once ungated, they are simply wrench-handle
   parts annotated during the "Digital Systems" chapter copy).
4. Observed chapter labels on HEAD: CH.01 ASSEMBLY, CH.02 X-RAY, CH.03 THERMAL, CH.04 DIGITAL.

## Demo artifacts (disposable)

- Demo server: `http://localhost:5202/` (vite dev on the demo worktree; `index.html` there carries a
  setInterval z-lift so manual badge clicks work without the capture harness).
- Worktree `jgun-hotspot-demo` is disposable — `git worktree remove` when the owner is done.
