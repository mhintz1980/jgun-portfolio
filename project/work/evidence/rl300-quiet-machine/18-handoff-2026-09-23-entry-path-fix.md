# Handoff — 2026-09-23: FIRST TASK = fix the beginning of the air-flow path (owner ruling)

Supersedes [`17-handoff-2026-09-22-duct-done.md`](17-handoff-2026-09-22-duct-done.md) on
**next-action only**. Everything in handoff 17's "things that will bite" section still
applies — read it before touching the spine.

    branch   codex/jg033-signature-shot @ 743a749 == main == origin (all pushed)
    tree     clean except .zcodeignore / .codex/ (harness artifacts — never commit)
    server   vite preview on :4173, fresh build of 743a749 (restart after any rebuild;
             it binds IPv6 — curl localhost:4173, not 127.0.0.1)

## THE TASK (owner ruling 2026-09-23, 14:48 — execute FIRST, before routing Astra)

> "try and fix the beginning of the air flow first. The beginning of the air flow path is
> where i show the three blue lines coming in from the left side that continue around the
> air passage. The air flow should remain in the area of those lines. It should not go
> where i crossed out in red lines."

**The spec is the owner's annotated screenshot, saved to disk:**
[`entry-fix/owner-entry-path-ruling-2026-09-23.png`](entry-fix/owner-entry-path-ruling-2026-09-23.png)
(copied from `C:\Users\Markimus\Pictures\Screenshots\Screenshot 2026-09-23 144811.png`).
Blue lines = where the flow must stay (three strands entering from screen-left, continuing
around the air passage). Red crossed-out lines = where it must NOT go.

### What is being fixed

The **entry segment of `SPINES.main`** — waypoints 0–2 and the ribbon fan around them:

    0  [-.40, 1.42,  1.40]   entry, approaching the hex openings, outboard of the panel
    1  [-.40, 1.36,  1.33]   through the intake end panel (z 1.295-1.355)
    2  [-.40, 1.47,  1.14]   inside the corridor, climbing the slanted face

(`src/scene/rl300/flow.ts`. Web frame, Y-up, metres. Machine x ±0.800, intake end at +z.)

### Already decoded for you (verified 2026-09-23 — do not re-derive)

- **Which stop the screenshot shows:** the u ≈ 0.34 camera family
  (`cam(3.62, 1.76, 2.75)`, fov 33 — see
  [`duct-reconstruction/captures/captures.json`](duct-reconstruction/captures/captures.json)).
  Mark screenshotted ~1 min after launching `?study=rl300` in his browser.
- **Screen-left at that stop ≈ world +z** (the intake end): cameras sit at +x looking in,
  so the intake panel is left-of-frame. The "three blue lines coming in from the left" are
  strands entering from the +z intake end — consistent with his 09-16 arrow diagram and
  the corridor route. What reads as "three" is the visible fan of the 6-strand main bundle
  at this angle (`RIBBON_COUNT.desktop` 18 → `ribbonSplit` 6/6/6).
- **Why the entry is where it is:** waypoints 0–1 are the only points EXEMPT from corridor
  containment (entry is outboard of the panel by design; the test pins `main[0..1][2] >
  AIRWAY_BOUNDS.max[2]` i.e. z 1.40/1.33 > 1.300). The re-snap work on 2026-09-22 moved
  waypoints 2–8 only — **the entry segment was left as-authored**, and it is what the
  owner is now ruling on.

### Method (runtime telemetry, never vision alone — house rule)

1. Open the screenshot side-by-side with a live `?study=rl300` at u≈0.34. Map the blue
   band and the red-crossed region into world coordinates using the camera
   (`captures.json` has per-stop camera + fov; `window.__quietMachine.seek(u)` drives).
2. Re-author waypoints 0–2 (possibly add one waypoint if the blue lines need a distinct
   bend around the air passage) so the strands and their ±48 mm fan stay inside the blue
   band and clear of the red region. Ribbons fan up to **48 mm**
   (`AirRibbons.tsx:309`) — clearance, not just containment.
3. Keep every gate green: the envelope test, the polygon containment test for 2–8
   (unchanged unless waypoint indices shift — if they do, the 0–1/9–11 exemption pins must
   be re-mapped to the new indices), typecheck, 88/88, build.
4. Re-pin the entry exemptions to the NEW entry region (positive assertions, same pattern
   as the current ones), and add a pin that the entry approach lies in the blue band
   (world-space form once mapped).
5. Re-capture the six stops (scratch script `.scratch/capture-study.mjs` — note it lives
   in `.scratch/`, uncommitted; recreate from handoff 17's trivia if missing:
   `PLAYWRIGHT_MODULE=file:///C:/Projects/jgun-portfolio/node_modules/playwright/index.mjs`,
   `BASE_URL` for jg032-style gates, `__quietMachine.frame` for settle-detection).
6. **Owner rules by looking** — put the before/after pair in front of him before calling
   it done. Same standard as the duct work.

### Scope guard

This is an entry-segment retune, NOT a rethink of the corridor: waypoints 3–8 (ceiling
run, canopy turn-down at z 0.564, U-turn) and the tail 9–11 were ruled correct by the
duct work and its reviews. Do not move them to chase the entry screenshot.

## AFTER the entry fix lands — route the Astra packet

[`16-astra-rereview-packet.md`](16-astra-rereview-packet.md) is written and pushed and now
carries the entry-fix as a pending item (updated 2026-09-23). Sequence per the owner:
**entry fix → fresh captures → then route the packet to `gpt-6-astra`** (her standing
`fix-first` verdict blocks further visual-effects work). Do not route it before the entry
fix — her review would go stale on the exact segment being retuned.

## State of everything else (unchanged from handoff 17)

Open after this task: JG-034 (also blocks `verify-jg032-station2-thermal.mjs` on any
build), JG-033 main-page integration (the owner has twice thought work was lost — it is
at `?study=rl300`, not the main page), radiator-fan treatment, v4 node-rename pass.
CAD lineage, gate gotchas (four gates hardcode airway geometry; the L-shaped corridor's
AABB is 32.5% solid metal — bounds ≠ containment), and the Blender/export tooling are all
in handoff 17 §"things that will bite" and
[`15-duct-reconstruction.md`](15-duct-reconstruction.md).
