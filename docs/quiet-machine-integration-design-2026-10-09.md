# Quiet Machine integration and page split: DESIGN (phase 3), 2026-10-09

Status: design only. No source, tests or TODO.md changed. Branch `quiet-machine/integration`, tip `eb55095`.
Inputs: [29 reconcile](../project/work/evidence/rl300-quiet-machine/29-research-reconcile-2026-10-09.md), [30 page split](../project/work/evidence/rl300-quiet-machine/30-research-page-split-2026-10-09.md), [JG-033 plan](../project/work/plans/JG-033-rl300-quiet-machine.md) (approved; not reopened). Owner decisions D1-D5 are final and are cited, not argued.
UNVERIFIED means it can only be settled at runtime or on the host. Nothing here was built, served, or rendered.

## 0. Decisions at a glance
| # | Decision | Rejected (one line each) |
|---|---|---|
| 1 | Vite multi-page: `index.html` (JGUN) + `quiet-machine/index.html` (QM), served at `/quiet-machine/` | Hash route: one document, so no GL isolation and no hard navigation (D2). Path route + `_redirects` 200: an SPA with no history API (30 §5) and the `forcePoster` unmount trap (30 §6) |
| 2 | M249 slot reserved (`/m249/`), page not built in this program | Building it now: `M249Stage.tsx:5-9` imports `scrollStore`, `qualityStore`, `HOTSPOTS`, `Hotspots` and the CAD shader, so it is a port, not a URL move |
| 3 | JGUN to QM through a click-only end card | Scroll-triggered auto-navigation: Back restores scroll at the runway and re-fires it; plan:128 "no automatic scroll capture" |
| 4 | Fade = sessionStorage-flagged CSS overlay, inline in each HTML entry | Cross-document View Transitions: opt-in and not universal across engines; it crossfades snapshots and cannot hold dark through a multi-second GL boot |
| 5 | D4: pin the JGUN axis to a virtual 3120vh document via one helper (Option B, corrected) | Option A (keep 3120vh of dead runway): the scrollbar lies, and flings and poster-mode native scroll reach it. The literal `3020*innerHeight/100`: drifts on phones where 1vh != innerHeight/100 |
| 6 | Publish JGUN narrative progress clamped at paced 0.565 (`wrenchOut[1]`, `stageWindows.ts:21`) | Unclamped: the camera keeps flying toward the archived Station 2 (K1 to K2, 0.525-0.600) |
| 7 | Station 2 code moves to `project/archive/station2-jg032/`; shared files get surgical edits | Deleting: D1 says archive |
| 8 | `check:station2` is retargeted, not removed (it is a named acceptance command, plan:200) | Removal would drop a gate the approved plan requires |

## 1. Page topology
- **Build:** `vite.config.ts` gains `build.rollupOptions.input = { main: 'index.html', quietMachine: 'quiet-machine/index.html' }`. A new entry module mounts `QuietMachinePreview` directly, with no `App`, `qualityStore` or `SceneCanvas`. It is already self-contained (30 §1: imports only `./shot`, `./QuietMachineScene`, the CSS, and `../sectionRenderPass`).
- **Hosting:** Cloudflare Pages direct upload (30 §5). `dist/quiet-machine/index.html` is a static file, so no `_redirects` is needed. `public/404.html` stays the miss handler: unknown paths still 404 and refresh to `/` (`404.html:7`).
  - UNVERIFIED: the bare `/quiet-machine` redirecting to the trailing-slash URL. `vite preview` does not emulate Pages, and no deploy is authorized (D5).
- **Legacy URLs:** a ~10-line inline script in the `index.html` `<head>` runs before the bundle and calls `location.replace()`, so no history entry is added and no React boots. Client-side because Pages `_redirects` matches paths, not query strings (UNVERIFIED on the host).

| Legacy URL | Goes to |
|---|---|
| `/?study=rl300[&quality&shot&composer&schematic]` | `/quiet-machine/?<same params minus study>` (params read at `QuietMachinePreview.tsx:22`, `QuietMachineScene.tsx:141`, `LowerIntake.tsx:44`) |
| `/?station=2\|enclosure\|safe-enclosure`, `/?chapter=2` (`scrollStore.ts:78,83`) | `/quiet-machine/` |
| `/?station=3\|m249`, `/?chapter=3` (`scrollStore.ts:79,84`) | `/m249/` once it exists; until then, JGUN at the exit card (paced 0.565) |

- **`App.tsx:27-32`:** the `?study` branch is deleted. The redirect replaces it.
- **M249 (Q1):** reserve the URL, the nav entry ("03, in preparation", not a link) and the redirect row. Drop `<M249Stage/>` from the JGUN `SpatialWorld` so the `useGLTF.preload` at `M249Stage.tsx:165` stops downloading the M249 GLB on the JGUN page.
  - The file stays in `src`, and the page becomes its own JG item (proposed JG-037).
  - Consequence: M249 and the JG-036 `m249-trunnion` keeper (`verify-jg036-hotspot-layering.mjs:65`) are offline until that page ships.

## 2. Navigation
| Page | Entry | In-page nav | Exit | Reduced motion / poster |
|---|---|---|---|---|
| JGUN `/` | Top, or legacy redirect | `SPATIAL_STATIONS` (`scrollStore.ts:35-39`) becomes a page list: `jgun` scrolls to 0; `quiet-machine` is an `href`; `m249` is reserved. `StationNav.tsx:40` and `TechnicalHUD.tsx:213` render `href` entries as fade links. HUD key `2` (`TechnicalHUD.tsx:110`) fade-navigates; `3` does nothing yet. `stationForChapter` (`StationNav.tsx:8-12`) always returns 0 | New exit section after ch1 holding the end card "NEXT, 02 THE QUIET MACHINE". Click starts the fade, then navigation | The poster path (`App.tsx:40-59,72`) renders the same DOM end card. The link carries the live tier: `?quality=lite` or `?quality=poster` (QM reads it, `QuietMachinePreview.tsx:23,62`) |
| QM `/quiet-machine/` | Link, deep link, or redirect | The existing eyebrow `0x / 07` (`:66`) stays as the chapter marker; add a thin progress bar from `u` (plan:104 asks for a "discreet chapter marker and progress indicator"). The views and scrubber are unchanged | The header link (`:64`) becomes a fade link to `/`. An end card at u >= .97 offers "01 TORQUE GUN" plus "03 M249" (reserved) | Reduced motion gets poster mode, per the owner decision of 2026-10-06 "posters throughout" (`App.tsx:27-29`). This replaces today's manual-WebGL mode (`:21,25`); the fade becomes an instant cut |

- **Back/forward:** browser-native. No `pushState` is added. A `pageshow` handler with `event.persisted` clears the overlay (§3).
- **Returning to JGUN:** a reload or Back lands near the exit runway via scroll restoration. Re-sync is UNVERIFIED, because ScrollRig only re-syncs when `initialProgress > 0` (`ScrollRig.tsx:69-79`). This is a runtime check (plan:200 "reload at depth").
- **Chapters:** `CHAPTER_RANGES` (`staticChapter.ts:11-16`) shrinks to ch0 and ch1. The exit section carries no `data-chapter`, so the chapter index stays 1 through the runway (`ScrollRig.tsx:54-67`).
- **Copy:** CH.03 copy and the Station 2 hotspots (`caseStudies.ts:34,94-100,647+`, `CameraRig.tsx:93+`, per 30 §3) leave the JGUN page.

## 3. Fade through dark (D2)
Mechanism: a sessionStorage-flagged overlay. Same-origin hard navigation in every case.

| Step | Where | What the viewer sees | Timing |
|---|---|---|---|
| 0 | Each HTML entry `<head>`: inline `<style>html{background:#05070a}` plus a fixed full-screen `#fade` layer and an inline script. If `sessionStorage['jg:fade']` exists and is under 5 s old, the script sets `html[data-fade=in]` and removes the key | Black from the first paint. Today's `class="bg-[#05070a]"` (`index.html:2`) is Tailwind and only applies after CSS loads, which leaves a white-frame risk | Synchronous, before the bundle |
| 1 | Exit, page A. An unmodified primary click on `a[data-fade]` calls `preventDefault`, ramps the overlay 0 to 1, sets the flag, then calls `location.assign(href)` on `transitionend`, with a 450 ms timeout fallback. Ctrl, cmd and middle clicks are left alone | The scene dims to black | 400 ms ease-in. Reduced motion: 0 ms |
| 2 | Gap. The old document unloads and the browser frees its GL context with it | Black. Chromium paint-holding keeps the black last frame. Safari and Firefox are UNVERIFIED, which is why step 0 has the inline background | Network plus parse |
| 3 | Entry, page B. The overlay holds until the ready signal: QM `onReady` (`QuietMachinePreview.tsx:28`); for JGUN, an existing first-frame telemetry flag, chosen in the structure phase | Black. After 0.8 s, one status line ("PREPARING THE MACHINE…", the existing `:74` text) | Fade out 600 ms ease-out. Hold capped at 2.5 s, then fade anyway |
| 4 | `pageshow` with `persisted` (bfcache restore) | The overlay is removed instantly, so Back never returns to a black page | Immediate |

- **Prefetch:** when JGUN passes paced 0.525, add `<link rel=prefetch>` for `/quiet-machine/` and the tier's GLB: `msp-enclosure.glb` (2.5 MB) on full, `rl300-lite.glb` on lite. This follows plan:202 "prefetch after the critical JGUN load".
- **Context loss:**
  - Each document builds a fresh in-memory `qualityStore`. Grep finds zero `sessionStorage`/`localStorage` uses in `src`.
  - The SPA poisoning path therefore cannot cross pages: `SceneCanvas.tsx:424-429` firing `forcePoster` (`qualityStore.ts:86-90`) under R3F `forceContextLoss` (30 §6).
  - Hard navigation avoids that path entirely.
- **Must verify at runtime:**
  - (a) Back to JGUN from bfcache keeps tier `full` and a live canvas. If the context was lost while frozen, the `:424` listener drops JGUN to poster; that degradation must be measured, not assumed.
  - (b) The same for QM (`QuietMachinePreview.tsx:54`).
  - (c) No white or blank frame between documents at all 3 viewports, checked with a CDP screencast frame dump.
  - (d) Mobile GPU memory while JGUN sits frozen in bfcache and QM boots.
- **Approval:** the fade is a visual effect, so it is not done until Astra rules. It goes in the single packet (§7).

## 4. Scroll-axis pin for the JGUN page (D4)
**The formula.** Today's divisor is `scrollHeight - innerHeight`, and `scrollHeight` is the 3120vh stack laid out in CSS `vh` (`scrollTracks.ts:79`).
- New helper in `src/scene/drawing/scrollTracks.ts`: `jgunScrollDistancePx() = DOCUMENT_HEIGHT_VH * vhPx() - innerHeight`.
- `vhPx()` reads a hidden `position:fixed; height:100vh` probe. A fixed element does not extend `scrollHeight`.
- This is the old formula evaluated against a virtual 3120vh document. It stays identical on dynamic-toolbar phones.
- It is also exposed as the proof hook `window.__scrollAxis.distancePx()`.

**Document.** Intro 1510 + ch0 197.857 + ch1 382.857 = 2090.714vh, unchanged, so the DOM-measured triggers do not move (`ScrollRig.tsx:56`, hero `TorqueWrenchHero.tsx:124-128`).
- ch2, ch3 and the footer (`Chapters.tsx:346-357`) become one exit section of 382.9vh.
- Derivation: paced 0.565 maps to raw 0.75284, which is 2273.6vh of scroll. Add a 100vh dwell (R) and one viewport: 2273.6 + R + 100 - 2090.714 = 382.9vh.
- The maximum pinned raw value is 2373.6 / 3020 = 0.786.
- ScrollRig publishes `min(paced, 0.565)`, with velocity 0 while clamped. This leaves every Station 2/3 window dormant without touching JGUN values at or below 0.565.

| Site | Today | After |
|---|---|---|
| `ScrollRig.tsx:42` | `end: 'max'` | `end: () => jgunScrollDistancePx()` plus `invalidateOnRefresh` |
| `ScrollRig.tsx:73`, `scrollCommit.ts:52`, `scrollStore.ts:48`, `staticChapter.ts:41`, `DrawingLinework.tsx:501,515` | `scrollHeight - innerHeight` | `jgunScrollDistancePx()` |
| `scrollStore.ts:127` | Load retry plus target | The "laid out" test becomes `document.documentElement.scrollHeight > 2 * innerHeight`, which avoids the expression G4.2 bans; the target uses the helper |
| Not touched | `introTimeline.ts` (`pacedProgress :143`, `rawScrollFor :163`), `DRAWING_INTRO_WINDOW` (`:38`), `LCD_REVEAL_WINDOW` (`caseStudies.ts:500`), `wrenchOut` | Byte-identical |

This site list comes from grep (30 §3, re-grepped today: 8 sites). Grep is not proof, so gate G4.2 makes a missed site fail loudly.

**Gates (numeric, not eyeballed)**
| Gate | What | Pass |
|---|---|---|
| G4.1 | Pure Vitest, `vhPx` and `innerHeight` injected. Cases: (vhPx, ih) = (9, 900), (10.24, 1024), (8.44, 844), plus a decoupled phone case (8.44, 788) with the toolbar shown. The old side comes from a frozen `eb55095` fixture, not the live function, and models the integer `scrollHeight`: `round(3120*vhPx) - ih`. The new side is the helper. Sweep y = 0..2373.6vh in 0.5vh steps, plus an anchor table (0.12, 0.177029, 0.458429, LCD window, 0.525, 0.565, ch0/ch1 transit edges via `chapterTransitPaced`) | \|delta paced\| <= 1.76 x 0.5 px / smallest divisor (about 3.5e-5); anchor delta <= 0.5 px (rounding x raw <= 0.5) |
| G4.2 | Vitest grep: no non-test `src` file outside `src/scene/rl300/` contains `scrollHeight - window.innerHeight` or `end: 'max'` | 0 hits |
| G4.3 | `git diff eb55095 -- src/scene/drawing/introTimeline.ts src/scene/drawing/introTimeline.test.ts` is empty, plus a constants test on the three windows above | Empty diff, test green |
| G4.4 | GPU seat. At 1440x900, 768x1024 and 390x844, scroll to each anchor px on an `eb55095` worktree build and on the new build. Compare `getScrollState().progress`, camera pose and `explodeFactor`; then run `verify-jgun-opening --quick`, then the full roster | \|delta paced\| <= 1e-4 after settle; poses equal within existing verifier tolerances |

Mutations that must turn the gates red, recorded with their output (convention: TODO.md:49 "mutation-tested", :51 "two mutations bite"):
- Re-add one `scrollHeight` site: G4.2 and G4.4.
- Grow ch1 by 1vh: G4.1, through the transit edge.
- Revert the helper to `3020*innerHeight/100`: G4.1 goes red on the (8.44, 788) case, where the divisor is 25545 vs 23797.6 px.

## 5. QM product work remaining (29 rows a-l, minus D3)
| Item | Bucket | Design |
|---|---|---|
| Scroll length (29 row i) | Launch | `.qm-preview{min-height:320vh}` (`quiet-machine.css:1`) becomes the CSS var `--qm-length`, starting at 900vh (about 110vh per shot plus entry and exit). The owner rules on the length by watching a forward recording. `u` stays normalized over QM's own document (`:41,49`), so `shot.ts` ranges do not change |
| Chapter/HUD sync (29 row i) | Launch | Eyebrow counter plus progress bar (§2). The Milestone 3 "shared narrative-progress source" and the JGUN consumer corrections are moot under D1 (separate documents); record that in the extension record together with the §4 pin |
| Interaction (29 row h) | Launch, minimal | Existing controls are native buttons and a range input (`:71-73`) with a focus ring (`quiet-machine.css:20`); verify keyboard order, focus and touch tap. Add one intake hotspot: a badge at the lower intake that seeks to u .51 and opens a detail card. It reuses the JG-036 layering pattern (badge layer above the content column, an `elementFromPoint` probe at rest, a real actionability-checked click) and replaces the archived `duct-intake` keeper (Q4) |
| Interaction, deferred | Deferred | Free-camera inspection with blend-back (plan:165); gestures beyond tap |
| Mobile (29 row f) | Launch | Rerun `verify-jg033-preview` at 3 viewports plus 390x844-lite. The owner looks at all 7 shots at 390x844; portrait overrides are authored only for the shots he rejects (plan:189). This is the minimal way to satisfy plan:204's "not a desktop crop" |
| Performance (29 row g) | Launch | See the performance steps below the table |
| Posters | Launch | Capture 7 posters, one per shot, from the approved build, replacing the 3-for-7 map (`QuietMachinePreview.tsx:9`). Reduced-motion visitors now see only posters |
| Cross-section/geometry final review (29 rows a, d) | Launch | Owner group A (§7) |
| Stale docs (29 §4) | Launch, docs-only commit | Refresh the TODO.md and INDEX rows. JG-032 front-matter: add `d201ea8`. Note that 30's census 02/03 predates the 0.50 share |
| Radiator fan, v4 node rename | Deferred (D3) | |
| Exhaust heat distortion | Deferred | Optional per plan:151 |
| 2a control-panel split | Owner task | His Blender split, or an interim whole-panel dark tone in code (group B) |

**Performance steps**
1. **Attribute first.** 1,201k is runtime render triangles (ev 26:91). Unique indexed geometry is about 293k (plan:93). `SectionCaps.tsx:35-38` draws each section union three times (back stencil, front stencil, cap). Produce a per-pass `renderer.info` table: unique x instances, cap passes, ribbons, composer.
2. **Cut the largest term.**
   - If cap passes dominate: closed low-poly stencil proxies for the unions, authored in Blender.
   - If base geometry dominates: Blender decimation of hidden interior detail (`AGENTS.md:37-41`; never `gltfjsx --transform`).
   - Either way, skip the cap passes while the section is closed.
3. **Lite tier.** `rl300-lite.glb` (245,092 tris, ev 15:155), 6-10 ribbons (plan:147), no composer, DPR <= 1.5, with the tier carried over from JGUN. A QM runtime ratchet is deferred.

**Archive (D1)** to `project/archive/station2-jg032/`:
- `Station2_AcousticEnclosure.tsx`, `AirflowField.tsx`, `AcousticBaffleField.tsx`, `airflowRoute.ts` with its test, `recolorAllowList.ts` with its test.
- `scripts/verify-jg032-station2-thermal.mjs`, `scripts/capture-rl300-baseline.mjs`.
- Add `project/archive/**` to the vitest `exclude` (`vite.config.ts:9`). Otherwise the archived tests are still collected. `tsconfig` includes only `src`.

Surgical edits:
- `SpatialWorld` imports and mounts (`:8-11,111`).
- `stageWindows.ts`: split out the Station-2-only exports.
- `scrollStore.ts:35-39,77-84`.
- Shared Station 2 branches (`SceneCanvas.tsx:196-249`, `PostProcessingComposer.tsx:153-161`, `SpatialRig.tsx:39-41`, `backdropConfig.ts:38`) stay dormant past the clamp. Delete them in a later cleanup with G4.4 rerun.

## 6. Verification strategy
| Scripts (27 call `page.goto`) | Action |
|---|---|
| `verify-jg033-preview` (`:66,163,180`), `verify-jg033-ribbon-clipping` | Repoint to `/quiet-machine/`. Replace the npx-cache Playwright path (`verify-jg033-preview.mjs:6`) with the `playwright` devDependency (`package.json:36`) |
| `capture-b1b2-baseline`, `capture-jgun-blackout-motion`, `measure-jgun-visible-dark`, `verify-b1b2-rebuild`, `verify-handwriting-reference`, `verify-jgun-opening`, `verify-ring-inspection` (fraction users; `check-b1b2-contract` is pure math with no `goto`) | The in-page divisor becomes `window.__scrollAxis?.distancePx() ?? (scrollHeight - innerHeight)`. The fallback keeps the `eb55095` baseline runs comparable |
| `verify-jg032-station2-thermal` | **Archive, do not retarget.** It gates JG-032's Station 2, which D1 removes. Its yellow-unchanged gate and its A/B check against `477c9c3` are superseded by the JG-033 front-matter. Its status after the JG-034 fix `9656ab8` stays UNVERIFIED, and that is written in the archive note. No GPU run is spent on it |
| `capture-rl300-baseline` | Archive. It is the Milestone 1 baseline of main-page Station 2 (`:304`, holds .65/.85) |
| `verify-jg036-hotspot-layering` | Drop `duct-intake` (`:55-62`, producer `station2-stage`) and `m249-trunnion` (`:65`) from the JGUN roster; add a QM intake case |
| The other 15 | Unchanged URLs. Grep found 0 paced samples above .565: their values are intro-local times x 0.12 (e.g. `capture-jgun-breakthrough.mjs:27`), and they position through `__drawingProof.setProgress`, which uses the helper (`DrawingLinework.tsx:501`). Must pass on the new build |
| New `verify-page-transition.mjs` | Fade out and in, Back with bfcache, reduced-motion cut, the legacy redirect table, a no-white-frame check, and the tier carried in the link |
| `check-station2-contract.mjs` (`npm run check:station2`) | Retarget: assert the JGUN `SpatialWorld` has no Station 2 or M249 mount, `quiet-machine/index.html` is in the build input, and the archive is excluded. Update `project-brief-2026-09-29.md:225` |

| Test | Change |
|---|---|
| `scrollTracks.test.ts` | The 3120 invariant becomes a "virtual axis" invariant, plus the exit section (382.9vh) and G4.1 |
| `scrollStore.test.ts` | The 3 stations become a page list, plus the deep-link remap |
| `staticChapter.test.tsx` | 2 chapters plus the exit; pinned divisor |
| `stageWindows.test.ts` | Keep the `wrenchOut` and JGUN cases; Station-2-only cases go to the archive |
| `airflowRoute.test.ts`, `recolorAllowList.test.ts` | Archived, then excluded |
| `introTimeline.test.ts`, `preview.test.ts` (25) | Unchanged; G4.3 covers `introTimeline.test.ts` |

- **Conventions:** every new or changed gate is mutation-tested before it counts, with the mutation and the red output recorded in evidence.
- **GPU:** one seat owns the GPU and servers; other lanes do static work only. Serialized runs:
  - R1: `eb55095` worktree baseline (G4.4 "before").
  - R2: QM at 3 viewports plus perf.
  - R3: JGUN after (G4.4, then the opening roster).
  - R4: transition.
  - R5: JG-036 roster.
  - R6: Astra packet captures.
- **Per run:** restart :4173 after every rebuild (`AGENTS.md:47-48`) and record the build hash.
- **Performance numbers:** name the device (Mark's desktop GPU model and one phone model) and report p50/p95 frame time.
- **Viewports:** 1440x900, 768x1024, 390x844, plus 390x844-lite for QM.

## 7. Approval gates, in order
| # | Who | Artifacts (PNG contact sheets and MP4s from one identified build) | Reconcile 29 §2 items |
|---|---|---|---|
| 1 | Owner, group A: QM content | Section holds at u .34 and .51; 7-shot sheet at 1440x900 and 390x844; forward/reverse MP4; lower intake close-up; reservoir 1019 vs 1020; chevron visibility; the 900vh length on a forward recording | 1, 2, 3, 4, 6 |
| 2 | Owner, group B | 2a panel: his Blender split, or an interim dark-tone PNG | 5 |
| 3 | Owner, group C: JGUN page | Exit frames at paced .525, .545 and .565 without the enclosure (`enclosureIn` shares `wrenchOut`, `stageWindows.ts:21-23`); end card at 3 viewports; retained JGUN polish (explode, LCD dwell; 29 row l); JG-034 look | 8 (JGUN half), 10 |
| 4 | Owner, group D: transition | JGUN to QM MP4, Back MP4, reduced-motion cut, at 1440x900 and 390x844 | new (D2) |
| 5 | Astra, ONE call, MEDIUM, prompt via stdin | Her missing list: louver traversal and repaired-join close-up; acoustic-interaction evidence; forward/reverse strip through the hairpin and merge; terminal closure. Post-verdict changes: stop-04 camera (`shot.ts:54`), 4 louvers and the (0,.205,.03) move, pump `15fd488`, reservoir and SIF colours. Acoustic-beat closure as a fresh verdict. Rank 4 heat continuity through both joins and rank 5 closing beat vs "Resolve". The JGUN exit frame and the fade recordings. Proof: an ocx log row `openai/gpt-6-astra` 200 | 29 §3 items 1-4 |
| 6 | Owner, group E | Full-size exterior, section, thermal and acoustic frames plus a live forward/reverse run of the same build | 7 |

- **Closed by D1:** item 9 (page separation) and item 8's enclosure half (JG-032 Station 2 is retired).
- **Why Astra goes last:** it comes after the owner rulings, so they are already applied when she sees the build. If she returns fix-first, fix it and re-show the owner. A second Astra call needs owner consent (the one-call cap, 29 §3).

## 8. Risks, unknowns, owner questions
**Risks, ranked**
1. **JGUN timing drift from a missed divisor site.** The site list comes from grep. Mitigated by G4.2 plus G4.4.
2. **JG-036 regression.** The owner-requested `duct-intake` and `m249-trunnion` keepers lose their host. QM regains one through Q4; M249 waits on Q1.
3. **Unruled QM visuals becoming a public page.** Rulings have been pending since 2026-09-15. Mitigated by the gate order and D5 (no publish).
4. **Triangle budget.** 1,201k vs ~500k may not close without visible loss (Q3).
5. **Blank or white frame between documents on non-Chromium engines.** The inline background plus check (c) cover it.
6. **bfcache restore with a lost GL context.** Back would show the poster (`SceneCanvas.tsx:424`, `QuietMachinePreview.tsx:54`).
7. **Mobile GPU memory.** JGUN frozen in bfcache while QM boots.
8. **Archived tests still collected.** Vitest picks them up unless `project/archive/**` is excluded.
9. **Host differs from `vite preview`.** Trailing-slash handling and query redirects cannot be proven without a Pages preview deploy, which D5 does not authorize.
10. **Astra's one-call cap.** It collides with a fix-first verdict.

**Could not determine statically**
- Cloudflare Pages: `/quiet-machine` to `/quiet-machine/` redirect behaviour, and whether `_redirects` can match query strings.
- Paint-holding and white flash on Safari and Firefox; bfcache eligibility and context survival for WebGL pages.
- Whether the exit frame reads as complete without the enclosure in 0.525-0.565, and whether the `SceneCanvas.tsx:228` lighting dip looks right there.
- Which existing JGUN telemetry flag should end the entry fade.
- Whether Lenis/ScrollTrigger re-sync on a Back restore at depth (`ScrollRig.tsx:69-79`).
- The per-pass split of the 1,201k triangles.
- Whether `verify-jg032` passes after `9656ab8`.
- The desktop GPU and phone models.
- That a real phone's probe vh differs from innerHeight/100, which is the case the helper exists for.

**Owner questions** (one click each; the default is first)
1. **M249 at launch:** **[default] reserve the slot; M249 offline until its own JG item, and the split is not published before it ships** / build a minimal M249 page in this program / publish without M249.
2. **QM URL:** **[default] `/quiet-machine/`** / `/rl300/`.
3. **Triangle budget:** **[default] keep the ~500k target; if it can't be reached without visible loss, accept the measured number only if the device-named p95 holds 60 fps on desktop and 30 fps on the phone** / strict 500k.
4. **QM hotspot at launch:** **[default] one intake hotspot (seek plus detail card)** / none at launch / full camera inspection.

## 9. Owner answers (recorded 2026-10-10)
1. M249: reserve the slot; M249 offline until its own JG item; the split is not published before it ships.
2. QM URL: `/quiet-machine/`.
3. Triangle budget: target ~500k; accept the measured number only if device-named p95 holds 60 fps desktop / 30 fps phone.
4. QM hotspot at launch: one intake hotspot (seek plus detail card).

## 10. AMENDMENT 2026-10-10 — D4 WITHDRAWN (owner ruling, supersedes §4 and the JGUN-timing-pin work)
Owner, verbatim intent: the torque wrench scroll length is NOT final and nothing is tied to it. He wants a much longer scroll-to-storyline ratio and a smoother flow; the current page is "too jumpy" and users fly past beats and must "tiny scroll" back. Visual effects get dialed in, scroll length changes completely. He wants a page that is cheap to extend: planned additions are more "bullet time" sequences (half-built on the Input Shaft cutter; remaining work is camera swings and slow-motion timing, then reuse as the reference for "planet gear inspection" and "machined after heat treat for class H7/g6 fit", neither yet in the camera sequence).
Consequences: (1) D4 "JGUN duration and authored scroll ranges unchanged" no longer binds the torque wrench page; (2) the pin-to-3120vh work (structure C1, C2, G4.1-G4.4, the eb55095 numeric baseline) is not needed as designed; (3) the owner is open to a FRESH torque wrench page built from the current one as a parts source (strangler: old page stays live and untouched until the replacement is accepted, then archived); (4) extensibility is a first-class requirement: beats must be authored as data on a scroll-length-independent timeline, so adding a sequence does not mean editing the scroll spine. Structure and plan must be revised before implementation. The Quiet Machine, shell, fade, and M249-slot decisions in §1-3, §5-9 stand.
