# RL300 "The Quiet Machine" — prep pack (JG-033, Milestone 1)

**For Astra.** Mark approved your plan. This pack is Milestone 1 of your own build order —
*"Freeze and measure: capture exact build and asset hashes … audit source models … Output:
reproducible baseline and asset-role map"* — already done, so your next window opens on
**Milestone 2, "prove the signature shot."**

Produced 2026-09-10/11 at `3e3e49f` by a prep session, deliberately scoped to mechanical
fact-gathering. **No design decision in your plan was made for you**: no derivative model was
selected, no progress architecture was designed, no section strategy was chosen, no art
direction was touched, and no file under `src/` was modified.

---

## Read this first — five findings that change assumptions in the plan

### 1. The clipping-plane cross-section already exists in the tree

Commit `d201ea8` ("JG-032 rev2: animated cross-section replaces panel lift (owner ruling)")
already retired the panel lift and shipped a **world-space clipping plane sweeping the enclosure
shell open across 0.585–0.645, holding to 0.700, closing by 0.715**, with
`renderer.localClippingEnabled` set in `SceneCanvas.onCreated` and cut scope limited to
`ENCLOSURE_CHASSIS` + `COMPOSITE_PANELS`.

The plan reads as though the section is greenfield. It is not — there is a working first
version to build on, replace, or reject on its merits. Read
`src/scene/stages/Station2_AcousticEnclosure.tsx:157–210` before designing the capped section.
What it does *not* have is stencil caps, which is the part `04-clipping-stencil-reference.md`
covers.

### 2. A JG-032 gate is red at HEAD, independent of your work

`scripts/verify-jg032-station2-thermal.mjs:462` asserts `panelY ≈ 0.55 ±0.02` at p=0.65 — an
artifact of the retired panel lift. Measured live at `3e3e49f`:

| Position | `COMPOSITE_PANELS.position.y` | Panel opacity | Gate |
|---|---|---|---|
| p=0.575 | 0.05 | 0.35 | opacity PASS |
| p=0.65 | **0.05** (asserted: 0.55) | 0.18 | **panelY FAIL** |

`d201ea8` changed the behaviour without updating the probe. TODO.md and INDEX.md both still
record JG-032's machine gates as "ALL PASS", which was true when written (at `57e2e2d`) and is
no longer true now. **Disposition of JG-032 is an owner call and has been left alone** — it is
flagged, not resolved. See `03-contract-debt.md` §A.1.

### 3. The plan's performance budgets are off by an order of magnitude

They were stated as provisional and explicitly "not current measurements". Now measured:

| Budget | Provisional target | Measured at `3e3e49f` |
|---|---|---|
| RL300 draw calls (full) | < 150 | **3,478** at the p=0.65 hold |
| RL300 visible triangles (full) | ~500,000 | **635,418** at the hold |
| Frame time at the RL300 hold | 60 fps | **p50 22.2 ms (45 fps)**, p95 30.8 ms |
| Page transfer | ~8 MB incremental | 14.65 MB total page |

The RL300 hold is already the worst frame time in the whole sequence, on Mark's actual machine
(integrated Radeon 780M), **before** the new section exists. Whether that means restating the
budgets or treating draw-call batching as a prerequisite is your call. Full numbers and method:
`00-baseline-manifest.md`.

### 4. The lite tier may not be reducing cost

At p=0.65 the lite tier reports **more** visible geometry than full (813 meshes / 1,551,035 tris
vs 751 / 635,418), at the same 3,478 draw calls. This is recorded as an anomaly, **not a
diagnosis** — the capture toggles the tier then re-seeks, so it may be reading a transitional
state. It needs a dedicated runtime check before the "stable 30 fps lower tier" target is
treated as achievable.

### 5. Stencil caps are blocked today — no stencil buffer is allocated

Neither framebuffer currently has a stencil attachment:

- `SceneCanvas.tsx:304` does not request `stencil: true`, and `three@0.185.1` defaults
  `stencil = false` (fiber's defaults do not add it).
- The `EffectComposer` does not set `stencilBuffer` either, so `postprocessing` defaults it false.

`gl.localClippingEnabled = true` **is** already set (`SceneCanvas.tsx:312`) — which is why the
existing `d201ea8` clipping sweep works. But a stencil cap pass cannot work until a stencil
buffer exists. `04-clipping-stencil-reference.md` §10 lists eight items that need runtime
verification before committing to dynamic caps, including whether r3f-postprocessing 3.1.1
actually preserves stencil through its MSAA resolve. **That is a genuine unknown, not a detail**
— it is the difference between the plan's dynamic-cap path and its authored capped-variant
fallback, and the reference deliberately does not choose between them.

---

## The pack

| File | What it is | Use it for |
|---|---|---|
| `00-baseline-manifest.md` | Measured baseline: page geometry, per-position cost, frame times, transfer, asset hashes, console health | The "before" side of every A/B; the real numbers behind Milestone 1 |
| `00-baseline.json` | Machine-diffable companion — 23 scroll stops × 3 viewports | Programmatic regression diffing |
| `baseline-frames/` | Desktop frames at the 13 named beats | Visual "before" reference |
| `01-asset-role-map.md` | CAD source audit: 7 roots measured, material census, yellow-shell attribution, 10 `.blend` candidates compared | **Choosing** the derivative input (the choice is yours; the evidence is here) |
| `01-cad-inventory.json` | Full machine-readable census | Querying part/material/geometry facts without reopening Blender |
| `02-progress-consumers.md` | 159 rows; **71 keyed to normalized global scroll** | Designing the narrative-progress separation — every consumer the extension would retime |
| `03-contract-debt.md` | 30 obsolete assertions · 58 that must be preserved · 24 ambiguous | Updating the gates without deleting unrelated checks |
| `04-clipping-stencil-reference.md` | Three.js clipping + stencil capping, annotated for `three@0.185.1` + R3F 9 | Implementing caps without fetching the upstream example |
| `_preflight.log` | Raw green-tree evidence from before any of this ran | Proving the starting state |

`scripts/capture-rl300-baseline.mjs` is new and re-runnable:

```bash
BASE_URL=http://localhost:4173 OUT=project/work/evidence/rl300-quiet-machine node scripts/capture-rl300-baseline.mjs
```

It is read-only against the app — it drives `window.__drawingProof.scrollToProgress`, counts
draw calls by wrapping the live WebGL context (the app exposes no renderer global), and changes
no application state beyond scroll position and the lite-tier toggle. Run it after
`npm run build` **and** after restarting the `:4173` preview.

> **Two caveats on the recorded run.** (1) The preview was *not* restarted for it — that command
> failed silently and the capture used a server an earlier session had left up. Verified after
> the fact: the served `index.html` and every referenced asset were byte-identical to `dist/`,
> so it measured the clean build of `3e3e49f`. (2) `dist/` has since been rebuilt by the
> implementation session, so re-running the script now measures in-progress work rather than
> this baseline — build from `3e3e49f` to reproduce it.

## Tree state when this pack was committed

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | PASS — 48/48, 6 files |
| `npm run check:station2` | PASS — 2,380,776 bytes, 7 roots, 7 CAD anchors |
| `npm run build` | PASS — 644 modules, 7.97 s |

Green before this prep began and green after; no `src/` file was modified. Five zero-byte
shell-redirect artifacts (`0.0001`, `0.0001)`, `0.005)`, `INTERNALS_WINDOW[0]`,
`INTRO_PHASES.pulseStart`) were removed from the repo root — untracked, empty, not yours.

`project/work/inbox/rl300-the-quiet-machine-plan.md.20260909-215316.bak` was **kept**, not
deleted: your plan cites pre-revision backups as part of its change boundary, so it is
provenance rather than clutter.

## What this pack deliberately does not do

- Choose the derivative model input, or rank the `.blend` candidates
- Design the narrative-progress vs. raw-`scrollY` separation
- Decide dynamic stencil caps vs. the authored capped-variant fallback
- Resolve the 24 ambiguous contract assertions in `03-contract-debt.md` §C
- Touch art direction, shot design, camera, lighting, or materials
- Disposition JG-032
- Establish anything about real mobile devices, reduced-motion, context loss, or poster fallbacks
