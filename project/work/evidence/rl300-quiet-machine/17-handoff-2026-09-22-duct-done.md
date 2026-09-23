# Handoff — 2026-09-22 (end of day): duct reconstruction EXECUTED

Supersedes [`14-handoff-2026-09-22-duct-reconstruction.md`](14-handoff-2026-09-22-duct-reconstruction.md),
whose plan is now **executed in full**. Handoff 13's §4 airflow items and §5 lane rules
still stand.

    branch   codex/jg033-signature-shot @ 074d4bc  ==  main @ 074d4bc  == origin (all pushed)
    tree     clean except .zcodeignore and .codex/ — both harness artifacts, never commit
    gates    typecheck 0 · 88/88 · build ✓ · check:station2 ✓ · lite-asset ✓ ·
             ribbon-clipping ✓ · preview exit 0 / 0 errors · 6 study captures 0 console errors
    server   vite preview on :4173 — binds IPv6: curl localhost:4173 (127.0.0.1 returns 000)
    Blender  5.1.1 at "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"

## What was done

Two commits:

- **`fe8ca64`** — the duct reconstruction + `SPINES.main` re-snap. Full record with every
  measured number: [`15-duct-reconstruction.md`](15-duct-reconstruction.md).
- **`074d4bc`** — the Astra re-review packet: [`16-astra-rereview-packet.md`](16-astra-rereview-packet.md).

Headline: the airway volume went from an 8-sided 28-triangle prism that overshot downward
over the pump to a 7-sided 24-triangle prism hugging the real corridor, turning down at the
canopy leading edge (web z **0.564**). Floor rose **0.148 m**. Waypoints 2–8 re-snapped;
**7–8 had been outside the volume entirely**.

## The next action

**Route [`16-astra-rereview-packet.md`](16-astra-rereview-packet.md) to `gpt-6-astra`.** Her
standing `fix-first` verdict blocks further visual-effects work and the packet is built to
clear it. It covers both things she was waiting on (the airflow beat *and* the duct/spine
change) and names the four questions to rule on. Owner rules by looking at the PNGs.

## Open, in priority order

1. **Astra re-review** — packet ready, verdict outstanding.
2. **JG-034 opening-scene refit bug** — recorded, not fixed
   (`project/work/evidence/JG-034-opening-scene-refit/`). It **also blocks
   `verify-jg032-station2-thermal.mjs`**, which cannot complete on *any* build: a clean
   `HEAD` worktree times out at `__drawingProof.ready` too (verified 3×). Fixing JG-034
   unblocks that gate as a side effect.
3. **JG-033 integration into the main page.** The blue enclosure + new animation live at
   `?study=rl300`; the main page still shows the pre-JG-033 Station 2. The owner has now
   raised this twice thinking work was lost — it is not. Worth scheduling.
4. Radiator-fan visual treatment (unowned decision); v4 node-rename pass (deferred).

## Things that will bite the next agent

- **The corridor is L-shaped: its AABB is 32.5% solid metal.** A bounds check is NOT a
  containment check. Use `insideAirwaySection(y, z)` from `src/scene/rl300/flow.ts`. This
  was found by an adversarial review after the first re-snap passed every gate with a
  waypoint sitting in solid steel.
- **Ribbons fan up to 48 mm** around the spine (`AirRibbons.tsx:309`), so a waypoint needs
  clearance greater than that, not merely positive. The U-turn went 11.0 mm → 81.0 mm.
- **Four gates hardcode airway geometry, not the two handoff 14 listed.** Beyond
  `verify-jg033-preview.mjs` (census) and `verify-jg032-*.mjs` (AABB), there are pinned
  source sha256 values in `verify-jg033-lite-asset.mjs:27` **and**
  `scripts/build-jg033-lite.py:16`. Both fired correctly. Always verify the old pin matches
  the pre-edit asset before changing it — that proves the guard worked.
- **Exporter settings are no longer a mystery**: recorded in
  `scripts/export_webexport_glb.py` and in the vault
  (`04-Projects/Portfolio-Site/rl300-safe-web-export.md`), proven by reproducing the
  baseline export byte-count to within the 140 bytes the geometry change explains.
- **The legacy main-page Station 2 shares this volume** (`AirflowField.tsx:353` derives its
  particle route from the AABB), so its helper shape and route changed. Disclosed and
  accepted by the owner mid-session. Code edits to those files were comment-only.
- Gate invocation trivia that cost time: `verify-jg032-*.mjs` reads **`BASE_URL`**, not
  `BASE`; the playwright gates need
  `PLAYWRIGHT_MODULE=file:///C:/Projects/jgun-portfolio/node_modules/playwright/index.mjs`
  and the repo's local playwright wanted `npx playwright install chromium` (it pinned a
  different build than the one already on the machine).

## CAD side (outside git)

    RL300-SAFE-webexport-v5-duct.blend               edited, current
    RL300-SAFE-webexport-v5-duct.PRE-DUCT-EDIT.blend backup
    msp-enclosure-draco.glb                          new, shipped
    msp-enclosure-draco.pre-duct-edit.glb            backup

v4 remains reserved for the deferred `DUCT_LABYRINTH`/`EXHAUST_PORT` rename.
Scripts added to `C:\Projects\msp-render-pipeline-scene-prep\scripts\`:
`probe_webexport_airway.py`, `section_webexport_corridor.py`, `edit_webexport_airway.py`,
`export_webexport_glb.py`, `render_airway_corridor.py` (that repo has unrelated dirty
state from another agent — leave it alone).
