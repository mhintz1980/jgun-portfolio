# JG-035 handoff C — intro rebuilt, tolerance stations built (2026-09-25, session 716b6e00)

Continues handoff B (`handoff-2026-09-25b-cinematic-rebuild.md`); read that for the design
brief. Facts stay LOCKED in `project/work/inbox/JG-035-tolerance-stations-facts.md`.

**TREE STATE: compiles, gates green, NOTHING COMMITTED.** Other sessions' uncommitted
`src/scene/rl300/*` edits and `project/work/evidence/rl300-quiet-machine/*` share this checkout —
never stage/revert those. Also do NOT stage the stray root files `).__drawingProofMode`, `0.5`,
`0.5)`, `INTRO_PHASES.pulseStart`, `drawing.png` (shell-redirect accidents; delete after
confirming they're junk) or anything under `.scratch/`.

## Gates (run 2026-09-25, this tree)

| Gate | Result |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | clean |
| `npm test` | 10 files / 100 tests pass |
| `npm run build` | ok (chunk-size warning only, pre-existing) |
| `npm run check:station2` | pass |
| `node scripts/check-b1b2-contract.mjs` | 24/24 — **contract rewritten this session**, see below |
| Astra ruling on the visual effects | **NOT DONE — required before "done"** |

## What exists now

### Track A — opening (drafting table)
- `src/scene/drawing/DrawingLinework.tsx` rewritten: bakes once per model (JG-034 fix), 0.80×0.50 m
  vector sheet — instanced AA ink lines with per-group reveal windows, troika SDF lettering that
  types in, paper shader (fibre, grid, deckle, reading lamp), walnut desk shader with contact shadow.
- `sheetCamera.ts` shots: low tight open on DETAIL D → title block → section → notes → pan → establishing
  → side-view ortho at the pulse. `WINDOWS` inks each view group as the camera reaches it.
- `IntroTitles.tsx`: three big Barlow Condensed cards ("Drawn to / a thousandth.", "Every gear /
  cut in house.", "Machined / complete."), multiply-blended navy, scroll-scrubbed; card 1 enters on load.
- `PostProcessingComposer.tsx`: DepthOfField (full tier) — time-based focus rack on load, relaxes
  to zero by t≈0.34 so the establishing frame is sharp.
- `TechnicalHUD.tsx`: HUD chrome fades in only after the intro (p 0.10→0.12).
- `EngineeringDrawingOverlay.tsx` deleted.

### Track B — tolerance stations
- `src/scene/stations/stationData.ts` — 7 stations (S4 fork profile, S5 clutch fit, rotor note,
  S1 datum A, S2 shafts, S3 planets, S6 summary card), windows on paced progress, `PHASE` timeline.
- `StationDriver.tsx` (in canvas, after CameraRig) — projects anchors off live rig units, model
  screen bbox, S1 axis; draws the huge faint camera-locked background process line (opacity 0.028).
- `ToleranceStations.tsx` (DOM) — reticle ping → leader draws → FCF outline + cells → typed name /
  part no / note → retract. **This session:** the card is measured once per station (fully typed)
  and placed in lanes around the model bbox (beside → above/below-right → fallback), so no card
  covers the model any more; S1 draws a Y14.5 filled datum triangle instead of a reticle.
- `Hotspots.tsx` hides the 4 hotspots the stations replace. Copy sweep: `.001" TIR` wording.

### Scripts
- `check-b1b2-contract.mjs`: ANSI C 22:17 / 4-view / third-angle-alignment checks replaced with
  the rebuilt contract — fixed 0.80×0.50 sheet on every viewport, 6 named views (side 1:1, rest
  1:2 removed views), every view inside the frame and clear of each other + title/revision/notes,
  judged on the real Default.glb bounds (the toy tetrahedron gave a false section/rear overlap).
- `export-sheet-template.mjs`: runs again (reads SHEET_WIDTH live); marked LEGACY in its header —
  its view windows still come from the JG-026 layout JSON. Retire once owner confirms.

## Evidence
- `stills-2026-09-25c/` — `stations-mid.jpg` (mid-window), `stations-late.jpg` (fully built),
  and the seven full-size late-window PNGs. Sent to the owner in chat.
- Capture tooling (scratch, not committed): `node .scratch/cine/shoot.mjs <outDir> <p,..> [WxH] [settleMs]`
  against the dev server already on :5199; `python .scratch/cine/sheet.py <dir>` → contact sheet.
  `.scratch/cine/probe-fresh.mjs` = cold-load bake/telemetry probe at 3 viewports.

## Open — in priority order
1. **Astra ruling** on intro + stations (send stills + a short scroll video). Nothing is "done" before it.
2. S4 (p≈0.155–0.166): camera is very close, the model fills the frame; the note types over a
   bright chrome highlight. Consider pulling the CH.01 close-up back a touch or a darker card pool.
3. The orange/brown backdrop behind S4/S5 comes from existing scene layers, not the stations — check it's intended.
4. Bake time. Cold-load probe (`.scratch/cine/probe-fresh.mjs`, 1600×900 / 1280×800 / 390×844):
   bakeMs 5282 / 5644 / 4286, edgeSet ~1.9–2.1 s, extract ~1.2 s; identical 211,552 segments and
   125 texts on every viewport, annotationsReady true everywhere (JG-034 fixed). Target < 3 s →
   move edgeSet + HLR to a worker.
5. HLR speckle still visible in Section A–A / Detail B. Section alone is 99k of the 211k segments —
   start there (section cut or thread geometry).
6. Fact sheet §4 extras for Astra to rule on: planet spin, dial-indicator / involute props, S4 tolerance band, S5 stamp.
7. Fixed this session (outside JG-035 files, stage deliberately): `BootSequence.tsx` duplicate React key —
   the boot log only deduped consecutive lines, so an interleaved reload of Default.glb
   logged "LOADING ASSY · PTG-HP-1000 FULL" twice. Now `prev.includes(line)`.
   `.station-card::before` pool deepened for S4 legibility (verified, st5 frames).
   `sheetText.ts`: annotationsReady failed to fire on 1 of 6 cold loads (1600x900) — the intro title
   card and DOF rack wait on it. troika `Text.sync(cb)` silently drops `cb` when `_needsSync` was
   already consumed; each member now resolves on `sync` OR the `synccomplete` event. Verified
   6/6 cold loads ready (8.8–17.7 s), 0 console errors. Not reproducible on demand, so the fix is
   targeted at the only drop path found in troika's source.
8. Update TODO.md / registry row, then commit **only when the owner asks**, staging JG-035 files by path.
