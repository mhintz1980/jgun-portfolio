# Quiet Machine integration and page split: STRUCTURE (phase 4), 2026-10-10

> **PARTLY STALE (2026-10-10):** the scroll-axis pin work (C1, C2, the C4 timing comparison, gates G4.1-G4.4) is withdrawn by design doc section 10. Commit order must be rebuilt. The design-correction findings below remain valid. See docs/HANDOFF-quiet-machine-2026-10-10.md section 3.

Status: structure only. No source, tests, TODO.md or design doc changed. Input: [design](quiet-machine-integration-design-2026-10-09.md) (APPROVED, incl. §9 owner answers), [29](../project/work/evidence/rl300-quiet-machine/29-research-reconcile-2026-10-09.md), [30](../project/work/evidence/rl300-quiet-machine/30-research-page-split-2026-10-09.md).
Tree read at `eb550958`. Checked-out branch is `codex/jg033-signature-shot`, which points at the same commit as `quiet-machine/integration`. Design decisions are cited, not reopened. Every file:line below was re-read or re-grepped on 2026-10-10.

## 0. Design corrections (verified)
| # | Design says | Verified fact | Effect on structure |
|---|---|---|---|
| D1 | `scrollTracks.ts` (bare filename, §4, §6) | The path is `src/scene/drawing/scrollTracks.ts`. `rawScrollFraction` (`:165-170`) divides by the laid-out `scrollDistanceVh(tracks)`, not by a constant | `rawScrollFraction` and `chapterTransitPaced` (`:173-182`) must divide by the virtual `SCROLL_DISTANCE_VH` once the document shrinks (C4) |
| D2 | 8 divisor sites (§4) | CONFIRMED, exactly 8 non-rl300 sites: `ScrollRig.tsx:42` (`end:'max'`), `:73`; `scrollCommit.ts:52`; `scrollStore.ts:48,127`; `staticChapter.ts:41`; `DrawingLinework.tsx:501,515`. `lenis.limit` and `scrollMaxY` have 0 hits | None |
| D3 | G4.2 pattern `scrollHeight - window.innerHeight` | Too narrow: it misses the bare `- innerHeight` form (`QuietMachinePreview.tsx:36,41,49` uses it; rl300 is exempt). A naive broadening hits the comment at `introTimeline.ts:7`, and G4.3 freezes that file | G4.2 strips `//` and `/* */` comments first, then matches `/scrollHeight\s*-\s*(window\.)?innerHeight/` and `/end:\s*['"]max['"]/`. Excludes `*.test.*` and `src/scene/rl300/**` |
| D4 | 27 `page.goto` scripts; 9 fraction scripts, of which 7 need the `__scrollAxis` divisor (§6) | 27 CONFIRMED (40 calls). The grep finds 9 files, but only 3 compute an in-page divisor: `capture-b1b2-baseline.mjs:51,56`, `verify-b1b2-rebuild.mjs:315,507,596`, `verify-jgun-opening.mjs:716,874-886`. The other hits are not divisors: `capture-jgun-blackout-motion.mjs:66` and `measure-jgun-visible-dark.mjs:57` are comments; `verify-handwriting-reference.mjs:470` is a field name; `verify-ring-inspection.mjs:151,236` is a height-equality check that stays valid | Repoint 3 scripts, not 7. The unchanged bucket is 19 scripts, not 15 (§1 W6). `verify-jgun-opening.mjs:874-879` asserts a raw share of .50 against the real `scrollHeight`, so it goes red at the shrink unless repointed first (C2) |
| D5 | Station 2 surgical edits: `SpatialWorld :8-11,111` plus dormant branches (§5) | MISSING: `SceneCanvas.tsx:280-281` looks up `station-1-jgun`, `station-2-enclosure` and `station-3-m249` by name and warm-cancels if any is absent. `warmReady` (`:305`) then never sets. Waiters on that flag: `verify-jgun-opening:574`, `verify-jg036:518`, `verify-ring-inspection:145`, `verify-shaft-inspection:162`, `verify-manufacturing-inspection` (6 sites), `capture-owner-revisions` (3), `verify-b1b2-supplemental:13`, `diag-shaft-artifacts:23` | C5 edits `SceneCanvas.tsx:280,285` to warm station 1 only (`[[true]]`), in the same commit that removes the groups. Risk H; Opus review |
| D6 | "Drop `<M249Stage/>`" stops the preload (§1) | `useGLTF.preload` (`M249Stage.tsx:165`) runs when the module is evaluated, so the import at `SpatialWorld.tsx:10` must go too. The Station 2 group also holds its own lights (`:108-110`) and `ContactShadows` (`:118`) | C5 removes `SpatialWorld.tsx:8-11` (imports) and `:92-133` (both groups) plus their refs. `telemetry.stage.alpha` keeps its 3-tuple shape as `[wrench,0,0]` |
| D7 | `CHAPTER_RANGES` shrinks to ch0/ch1 (§2) | `CHAPTERS` (`caseStudies.ts:14`) drives the sections (`Chapters.tsx:348-355`) and `chapterForProgress` (`staticChapter.ts:21`). Missing ranges fall back to `[0,1]` (`staticChapter.ts:22`, `Chapters.tsx:146`), and a missing height falls back to ch1's (`Chapters.tsx:353`) | `CHAPTERS`, `CHAPTER_RANGES`, `SCROLL_TRACK_VH.chapters` and the exit section change in ONE commit (C4). `caseStudies.ts` is a contention file |
| D8 | ch2/ch3/footer at `Chapters.tsx:346-357` | The track stack is `Chapters.tsx:342-365`: intro `:343-347`, sections `:348-355`, footer `:357-364` | Cite `:342-365` |
| D9 | `check:station2` retarget (§6) | `check-station2-contract.mjs` reads `Station2_AcousticEnclosure.tsx` (`:4,17`), both field files (`:29-33`), the anchor keys in `stageWindows.ts` (`:35-51`) and the SpatialWorld mounts (`:53-58`) | Its rewrite lands in the archive commit (C5), or the gate goes red between commits. `package.json:13` is unchanged: the script is rewritten in place |
| D10 | `verify-jg033-preview` only needs URL repoints (§6) | `:162-174` asserts the reduced-motion manual mode ("fixed pose, explicit controls"), which §2 replaces with poster mode | Rewrite `:162-174` in C9, the commit that changes QM reduced motion |
| D11 | QM "self-contained" (§1) | True for JS only. QM inherits Tailwind preflight and the html/body rules from `src/index.css` (imported at `main.tsx:4`); `quiet-machine.css:1` sets its own background `#101b24` | The QM entry imports `./index.css` and wraps in `StrictMode` (parity with `main.tsx:9-13`) |
| D12 | "`tsconfig` includes only `src`" (§5) | `tsconfig.json:21` includes `["src","vite.config.ts"]` | No effect: `project/archive/**` stays outside typecheck |
| D13 | 29's TODO line refs (`:48-56`) | The JG-033 block is now `TODO.md:47-57`, JG-032 is `:59-62` and JG-034 is `:42-45` | W7 edits by content, not by 29's line numbers |
| D14 | `/quiet-machine` behaviour is host-only (§1) | Vite's default `appType:'spa'` falls back to the root `index.html` in dev and preview, so a local check of slashless or unknown paths can pass for the wrong reason | W1 sets `appType:'mpa'` (unknown paths then 404 locally, as on Pages). Opus review |
| D15 | `end: () => jgunScrollDistancePx()` (§4) | Resolved statically: gsap 3.15.0 `ScrollTrigger.js:2057-2059` clamps `end` to the maximum scroll only under `clamp()` syntax. A function end larger than the laid-out maximum (3020vh vs 2373.6vh) is not clamped, so `self.progress = scrollY/end` | Design site change stands. G4.4 is the backstop |
| D16 | Clamp: "ScrollRig publishes `min(paced,.565)`" | `__drawingProof.setProgress` (`DrawingLinework.tsx:499-507`) and the proof pin in `setScrollState` (`scrollStore.ts:149-153`) bypass ScrollRig | The clamp lives at `ScrollRig.tsx:50` only. The proof hooks stay unclamped (the design says the scripts sample ≤.565); document this in a code comment |

## 1. File manifest
Actions: C=create, M=modify, MV=move to archive, D=delete, L=leave. Risk: L/M/H.

**W1: page topology and build**
| Act | Path | Change | Risk |
|---|---|---|---|
| M | `index.html` | Head: a `<script id="legacy-redirect">` (the 3-row table, design §1) before anything else, then the fade block between `<!-- fade:begin/end -->` (W2). Keep `class` at `:2` | H |
| C | `quiet-machine/index.html` | QM entry: title, description, canonical `https://studiomark.dev/quiet-machine/`, og tags, the same fade block, `#root`, module `/src/quiet-machine-main.tsx` | M |
| C | `src/quiet-machine-main.tsx` | `createRoot` + `StrictMode` + `import './index.css'` + `<QuietMachinePreview/>` (eager), plus `installPageFade` (W2, C6) | M |
| M | `vite.config.ts` | `appType:'mpa'`; `build.rollupOptions.input={main:'index.html',quietMachine:'quiet-machine/index.html'}` (absolute paths via `fileURLToPath`). The `:9` exclude belongs to W4 | H |
| M | `src/App.tsx` | Delete `:21` (lazy QM import) and `:27-32` (the `?study` branch) | M |
| C | `src/shared/pageTopology.test.ts` | Reads both HTML files: (a) runs the extracted `legacy-redirect` script against a stub `location` for every table row plus pass-through; (b) checks the fade block is byte-identical in both; (c) checks the `vite.config.ts` input map | M |
| L | `public/_headers` | No CSP today, so the inline script and style work, and `/assets/*` immutable covers both entries. Note: adding a CSP later needs hashes for both blocks | L |
| L | `public/404.html` | Remains the miss handler (`:7` refreshes to `/`). No `public/_redirects` is created | L |
| L | `package.json` | No script change: `build` (`:9`) already builds every input, and `check:station2` (`:13`) keeps its path | L |
| L | `scripts/deploy-studiomark.ps1` | `:25` deploys the whole `dist`, so it ships multi-page with no change (deploy not authorized, D5) | L |

**W2: fade and navigation**
| Act | Path | Change | Risk |
|---|---|---|---|
| C | `src/shared/pages.ts` | Leaf page registry plus tier-param href builder (§2 API) | L |
| C | `src/shared/pageFade.ts` | Leaf: click delegation on `a[data-fade]`, ramp, flag, `location.assign`, 450 ms fallback, `pageshow` persisted clear, `releaseFadeWhen(predicate)` with the 0.8 s status line and the 2.5 s cap (§2 API) | H |
| C | `src/shared/pageFade.test.ts` | Pure tests with an injected env (Vitest runs in node, `staticChapter.test.tsx:15`): modifier and middle clicks pass through, flag freshness <5 s, reduced motion gives 0 ms, cap fires at 2.5 s | M |
| C | `src/components/ExitCard.tsx` | "NEXT, 02 THE QUIET MACHINE" `<a data-fade href={pageHref('quiet-machine',tier)}>`. Prefetch (`/quiet-machine/` plus the tier GLB) once `useScrollValue('progress') >= .525`. Poster tier has no ScrollRig, so progress stays 0: there, an IntersectionObserver on `[data-exit]` prefetches the HTML only. First lands in C4 as a plain link | M |
| M | `src/main.tsx` | `installPageFade(document)`. JGUN release predicate: if the tier is poster or reduced motion, release after the first commit. Otherwise release on `telemetry.drawing.annotationsReady === true`: it is product telemetry, declared at `scrollStore.ts:303`, written at `DrawingLinework.tsx:473`, and `scrollStore` is already in the entry chunk. Alternate: `window.__drawingProof.ready`, which is set unconditionally (`DrawingLinework.tsx:476,663`) but is a proof hook. `warmReady` is rejected as the end signal: 5 compile passes plus offscreen renders (`SceneCanvas.tsx:285-305`), likely longer than the cap. R4 times all three | H |
| M | `src/state/scrollStore.ts` | `:35-39` `SPATIAL_STATIONS` becomes a view over `PAGES`. `navigateToStation` scrolls only index 0. `:76-84`: station 3 and chapter 3 go to .565; station 2 and chapter 2 fall back to .565 if the redirect did not run. (`:48,127` are W3) | M |
| M | `src/components/StationNav.tsx` | `:8-12` `stationForChapter` returns 0. `:40-56` renders `href` entries as `<a data-fade>` and reserved entries as a non-link "03, in preparation" | M |
| M | `src/components/TechnicalHUD.tsx` | `:108-113`: key 2 calls `fadeNavigate(pageHref('quiet-machine',tier))`, key 3 does nothing. `:213-218` renders the same as StationNav | M |
| M | `src/scene/rl300/QuietMachinePreview.tsx` | `:64` becomes `<a data-fade href="/">`. `onReady` (`:28`) calls the fade release; context-lost and poster paths release too. (W5 owns the other edits to this file) | M |
| L | `src/components/StaticPoster.tsx` | The poster path already renders `<Chapters/>` (`App.tsx:82-84`), so the exit card appears there with no change | L |

**W3: JGUN scroll-axis pin (D4)**
| Act | Path | Change | Risk |
|---|---|---|---|
| M | `src/scene/drawing/scrollTracks.ts` | C1: add the pure `jgunScrollDistancePxFor`, `vhPx` probe, `jgunScrollDistancePx` and `installScrollAxisProbe`. C4: `ScrollTracksVh` becomes `{intro, chapters:[ch0,ch1], exit}` with `EXIT_SECTION_VH` derived as `rawScrollFor(.565)*3020+100+100-2090.714` = 382.87. `DOCUMENT_HEIGHT_VH` (`:79`) is documented as VIRTUAL; add `laidOutHeightVh()`. `rawScrollFraction` divides by `SCROLL_DISTANCE_VH` (D1) | H |
| C | `src/scene/drawing/__fixtures__/scrollAxisEb55095.ts` | Frozen old side: `round(3120*vhPx)-ih`, the eb55095 track table and anchor list (not collected by Vitest) | M |
| C | `src/scene/drawing/scrollAxis.test.ts` | G4.1: sweep 0..2373.6vh in 0.5vh steps × 4 `(vhPx,ih)` cases plus the anchor table | H |
| C | `src/scene/drawing/scrollAxisGrep.test.ts` | G4.2, with the D3 pattern | M |
| C | `src/scene/drawing/introTimelineFrozen.test.ts` | G4.3 constants: `DRAWING_INTRO_WINDOW` `{.12,.525}`, `LCD_REVEAL_WINDOW`, `wrenchOut` `[.525,.565]`. The `git diff eb55095 -- introTimeline*` half is a commit-gate command, not Vitest | L |
| M | `src/scene/ScrollRig.tsx` | `:42` `end: () => jgunScrollDistancePx()` plus `invalidateOnRefresh:true`; `:50` publishes `min(paced,.565)` with velocity 0 while clamped; `:73` uses the helper | H |
| M | `src/scene/scrollCommit.ts` | `:52` uses `Math.max(1, jgunScrollDistancePx())` | M |
| M | `src/state/scrollStore.ts` | `:48` uses the helper. `:127-130`: the layout test becomes `scrollHeight > 2*innerHeight`; the target uses the helper | M |
| M | `src/components/staticChapter.ts` | `:41` uses the helper (C2). `:11-16` becomes `{0:[0,.22],1:[.24,.46]}` (C4) | M |
| M | `src/scene/drawing/DrawingLinework.tsx` | `:501,515` use the helper; `:520` `expected` divides by the helper | M |
| M | `src/components/Chapters.tsx` | `:342-365`: intro, ch0, ch1, then `<section data-exit>` (no `data-chapter`), height `EXIT_SECTION_VH`, holding `<ExitCard/>` and the `:361-363` footer line | H |
| M | `src/data/caseStudies.ts` | `:14` `CHAPTERS` drops index 2 and 3 entries (CH.03 copy `:34`, `:94-100` block). Station 2 HOTSPOTS (`:647+`) and `CAMERA_PATH` K2/K3 (`:306-381`) stay as dormant data | M |
| M | `src/main.tsx` | `installScrollAxisProbe()` (every tier, so poster-tier scripts get `window.__scrollAxis`) | L |
| M | `src/scene/drawing/scrollTracks.test.ts` | The 3120 invariant becomes a virtual-axis invariant plus a laid-out height of 2473.571; drop the ch2/ch3/footer cases (`:104-108`); add the exit section | M |
| M | `src/components/staticChapter.test.tsx` | 2 chapters plus the exit; pinned divisor | M |
| M | `src/state/scrollStore.test.ts` | `:14` stub moves to the helper (stub `vhPx`); deep-link remap .565 | M |
| C | `scripts/capture-jgun-axis-anchors.mjs` | G4.4 instrument: 3 viewports × anchor px gives `progress`, camera pose and `explodeFactor` as JSON. Divisor `__scrollAxis?.distancePx() ?? (scrollHeight-innerHeight)`, so the same script runs on both builds | M |
| C | `project/work/evidence/rl300-quiet-machine/31-jgun-axis-baseline-eb55095.json` | R1 output (eb55095 numbers, build hash) | L |
| L | `src/scene/drawing/introTimeline.ts`, `introTimeline.test.ts` | Byte-identical (G4.3) | L |

**W4: Station 2 archive**
| Act | Path | Change | Risk |
|---|---|---|---|
| MV | `src/scene/stages/{Station2_AcousticEnclosure.tsx,AirflowField.tsx,AcousticBaffleField.tsx,airflowRoute.ts,airflowRoute.test.ts,recolorAllowList.ts,recolorAllowList.test.ts}` | To `project/archive/station2-jg032/src/scene/stages/` (`git mv`; imports left broken on purpose) | M |
| C | `project/archive/station2-jg032/stageWindowsStation2.ts` (+ `.test.ts`) | `STATION2_CAD_ANCHORS`, `ENCLOSURE_HALF`, `airflowIntensity` and their tests (`stageWindows.test.ts:197-265`) | L |
| MV | `scripts/verify-jg032-station2-thermal.mjs`, `scripts/capture-rl300-baseline.mjs` | To `project/archive/station2-jg032/scripts/` | L |
| C | `project/archive/station2-jg032/README.md` | Why it was archived (D1); restore steps; JG-032 commits incl. `d201ea8`; `verify-jg032` status after `9656ab8` UNVERIFIED; no GPU run was spent | L |
| M | `src/scene/stages/stageWindows.ts` | Remove `:30-54` and `:87-94`; keep `STAGE_TRANSITIONS` and `stageEnvelope` (enclosure and pointCloud windows stay dormant above .565) | M |
| M | `src/scene/stages/stageWindows.test.ts` | Drop the `airflowIntensity`, anchor and half-extent cases | L |
| M | `src/scene/SpatialWorld.tsx` | D6: remove `:8-11`, `:48-49` refs, `:58-63` envelopes, `:68-73` and `:92-133`. Alpha becomes `[wrench.alpha,0,0]` | H |
| M | `src/scene/SceneCanvas.tsx` | D5: `:280` becomes `['station-1-jgun']` and `:285` becomes `[[true]]`. `:196-249` stays dormant | H |
| M | `vite.config.ts` | `:9` exclude adds `'project/archive/**'` | M |
| M | `scripts/check-station2-contract.mjs` | Rewritten in place. Asserts: `SpatialWorld.tsx` has no `Station2_`, `AirflowField`, `AcousticBaffleField` or `M249Stage` import or mount; `vite.config.ts` input has `quiet-machine/index.html`; the exclude has `project/archive/**`; `msp-enclosure.glb` still contains all 7 roots (kept from `:6-28`, QM uses the asset) | M |
| M | `scripts/verify-jg036-hotspot-layering.mjs` | Remove `duct-intake` (`:55-62`) and `m249-trunnion` (`:65`) from the JGUN roster, plus the quoted-id note at `:480`. Must land here, because the producers vanish in this commit | M |
| L | `src/scene/stages/M249Stage.tsx` | Unmounted, kept in `src` for proposed JG-037 | L |
| L (dormant) | `PostProcessingComposer.tsx:153-161`, `SpatialRig.tsx:39-41`, `backdropConfig.ts:38`, `CameraRig.tsx:93+`, `caseStudies.ts:306-381,647+`, `SceneCanvas.tsx:196-249` | Later cleanup commit (out of this program) with a G4.4 rerun | L |

**W5: Quiet Machine page product work**
| Act | Path | Change | Risk |
|---|---|---|---|
| M | `src/scene/rl300/quiet-machine.css` | `:1` `min-height:var(--qm-length,900vh)`; progress bar; end card; intake badge and card layers | M |
| M | `src/scene/rl300/QuietMachinePreview.tsx` | Reduced motion becomes poster (`:21,23,25`); progress bar from `u`; end card at u≥.97 (`01 TORQUE GUN` link plus reserved `03 M249`); `POSTERS` (`:9`) becomes 7 entries (C13); mounts `IntakeHotspot` | M |
| C | `src/scene/rl300/IntakeHotspot.tsx` | Badge above the content column; click calls `seek(.51)` and opens the detail card; JG-036 layering pattern | M |
| M | `src/scene/rl300/QuietMachineScene.tsx` | Lite policy: no composer, DPR≤1.5, ribbon count; GLB swap if a proxy asset lands | M |
| M | `src/scene/rl300/SectionCaps.tsx` | `:35-38` skips cap passes while the section is closed; uses stencil proxies if R2 attribution says so | H |
| M | `src/scene/rl300/AirRibbons.tsx` | Ribbon count by tier: lite 6-10 (plan:147) | M |
| M | `src/scene/rl300/preview.test.ts` | Add lite-policy, 7-poster map and hotspot-seek cases; keep the existing 25 | L |
| C | `scripts/measure-qm-render-passes.mjs` | Per-pass `renderer.info` table: unique geometry × instances, cap passes, ribbons, composer | M |
| C (cond.) | `public/models/rl300-section-proxies.glb` or a Blender-decimated `msp-enclosure.glb` | Only if R2 attribution names the term. Blender only (`AGENTS.md:37-44`). Force-add, because `.gitignore:7` ignores `*.glb` | H |
| C | `public/images/rl300-shot-0{1..7}-poster.png` | Captured from the build approved in owner group A. The 3 old `rl300-*-preview.png` are left until C13 | L |

**W6: verification repoints and new gates.** Rows tagged "lands in Cn (Wx)" ship in that workstream's commit, under that workstream's review gate.
| Act | Path | Change | Risk |
|---|---|---|---|
| M | `scripts/verify-jg033-preview.mjs` | Lands in C3 (W1): `:66,163,180` become `/quiet-machine/?…`, and `:6` uses `import('playwright')` (devDependency `package.json:36`). Lands in C9 (W5): the `:162-174` reduced-motion check becomes poster (D10) | M |
| M | `scripts/verify-jg033-ribbon-clipping.mjs` | Lands in C3 (W1): `:101` becomes `/quiet-machine/` | L |
| M | `scripts/capture-b1b2-baseline.mjs`, `verify-b1b2-rebuild.mjs`, `verify-jgun-opening.mjs` | Lands in C2 (W3b, Opus review): the in-page divisor becomes `window.__scrollAxis?.distancePx() ?? (scrollHeight - innerHeight)` at the D4 lines | M |
| C | `scripts/verify-page-transition.mjs` | Fade out and in; Back with bfcache (tier still `full`, canvas live); reduced-motion cut; legacy table at runtime; CDP screencast no-white-frame check; tier carried in the link; time-to-release for both JGUN candidate flags | H |
| C | `src/shared/importBoundary.test.ts` | Lands in C3 (W1): gate for the §2 boundary rules (regex over import specifiers) | M |
| M | `scripts/verify-jg036-hotspot-layering.mjs` | Lands in C10 (W5b): add a QM intake case (`elementFromPoint` at rest plus an actionability-checked click, then `u≈.51` and the card open) | M |
| L | 19 scripts | `capture-drawing-sheet`, `capture-jgun-blackout-motion`, `capture-jgun-breakthrough`, `capture-jgun-drawing-review`, `capture-jgun-opening`, `capture-owner-revisions`, `diag-shaft-artifacts`, `measure-jgun-pre-pulse`, `measure-jgun-visible-dark`, `precompute-drawing`, `probe-jgun-vellum`, `verify-b1b2-supplemental`, `verify-handwriting-reference`, `verify-jg027-lcd-cluster`, `verify-jg028-handle-realism`, `verify-jg031-gear-rotation`, `verify-manufacturing-inspection`, `verify-ring-inspection`, `verify-shaft-inspection`. Must pass on the new build | M |

**W7: docs, TODO, INDEX, evidence**
| Act | Path | Change | Risk |
|---|---|---|---|
| M | `TODO.md` | C0 makes factual fixes only, from 29 §4: `:48`/`:50` (Milestone 4 "unimplemented", built in `d09ef93`/`6516aee`/`ca0844e`), test counts (87/88 to 25/100), `:56` verify-jg032 "RED at :462" (fixed in `1d04d35`), "blocked by JG-034" (fixed in `9656ab8`, unverified). C5 marks JG-032 `:59` archived, in the same commit as the move. C14 sets the program status. A JG-037 (M249 page) row needs owner approval before it is added | L |
| M | `project/work/INDEX.md` | C0: factual JG-033/JG-034 rows (29 §4). C5: the JG-032 archived row | L |
| M | `project/work/plans/JG-032-station2-thermal-visualization.md` | C0: `:37` commits gains `d201ea8`. C5: status becomes archived, with a link to the archive README | L |
| M | `project/work/plans/JG-033-rl300-quiet-machine.md` | Extension record: Milestone 3 shared-progress source moot under D1; §4 pin; page split | L |
| M | `project/context/project-brief-2026-09-29.md` | `:225` `check:station2` meaning; the two `?study=rl300` refs become `/quiet-machine/` | L |
| M | `project/context/deployment.md` | Multi-page output, `appType:'mpa'`, host-only checks (slash redirect, query redirects) UNVERIFIED | L |
| C | `project/work/evidence/rl300-quiet-machine/3{1..}-*.md` | One file per GPU run (R1-R6) with build hash, viewports and mutation outputs | L |

## 2. Modules, APIs, boundary
| Module | Exports (names and types only) | Imported by |
|---|---|---|
| `src/shared/pages.ts` (zero imports) | `type PageId='jgun'\|'quiet-machine'\|'m249'`; `type TierParam='full'\|'lite'\|'poster'`; `interface PageEntry{id:PageId;index:number;label:string;name:string;href:string\|null;reserved:boolean}`; `const PAGES:readonly PageEntry[]`; `pageHref(id:PageId,tier?:TierParam):string\|null` | scrollStore, StationNav, TechnicalHUD, ExitCard, QuietMachinePreview |
| `src/shared/pageFade.ts` (zero imports) | `FADE_KEY='jg:fade'`, `FADE_MAX_AGE_MS=5000`, `FADE_OUT_MS=400`, `FADE_FALLBACK_MS=450`, `FADE_IN_MS=600`, `STATUS_DELAY_MS=800`, `HOLD_CAP_MS=2500`; `interface FadeEnv{now():number;storage:Pick<Storage,'getItem'\|'setItem'\|'removeItem'>;reducedMotion():boolean;assign(href:string):void;schedule(fn:()=>void,ms:number):number;frame(fn:()=>void):number}`; `shouldIntercept(e:Pick<MouseEvent,'button'\|'ctrlKey'\|'metaKey'\|'shiftKey'\|'altKey'\|'defaultPrevented'>):boolean`; `isFreshFlag(raw:string\|null,now:number):boolean`; `installPageFade(doc:Document,env?:FadeEnv):()=>void`; `fadeNavigate(href:string,env?:FadeEnv):void`; `releaseFadeWhen(ready:()=>boolean,env?:FadeEnv):void` | main.tsx, quiet-machine-main.tsx, QuietMachinePreview, TechnicalHUD |
| Inline fade block (both HTML heads) | `html{background:#05070a}`, `#fade` fixed layer, a script that reads `FADE_KEY` (<5 s) and sets `html[data-fade=in]`. Duplicated by design; parity enforced by `pageTopology.test.ts` | — |
| `scrollTracks.ts` additions | `jgunScrollDistancePxFor(vhPx:number,innerHeight:number):number`; `vhPx():number`; `jgunScrollDistancePx():number`; `installScrollAxisProbe():void` (sets `window.__scrollAxis={distancePx,vhPx,virtualHeightVh}`); `EXIT_SECTION_VH:number`; `JGUN_PACED_END=0.565` (test asserts it equals `STAGE_TRANSITIONS.wrenchOut[1]`); `laidOutHeightVh(tracks?):number`; `interface ScrollTracksVh{intro;chapters;exit}` | ScrollRig, scrollCommit, scrollStore, staticChapter, DrawingLinework, Chapters, main.tsx |

| Boundary rule | Gate |
|---|---|
| `src/scene/rl300/**` may import only `./*`, `../sectionRenderPass` (existing, `QuietMachineScene.tsx:14`) and `../../shared/*` | `importBoundary.test.ts` |
| `src/shared/**` imports nothing under `src` (leaf, no React, no three, no stores) | same |
| `src/quiet-machine-main.tsx` imports only `./index.css`, `./scene/rl300/QuietMachinePreview` and `./shared/*` | same, plus a C3 build check: the QM chunk graph has no `scrollStore`/`qualityStore` chunk |
| JGUN side (`src/**` minus rl300) never imports `scene/rl300` after C3 | same |
| Allowed shared surface | `sectionRenderPass.ts`, `shared/pages.ts`, `shared/pageFade.ts`, `src/index.css`, `public/draco/*`, `public/models/msp-enclosure.glb` |
| Cycle check | `scrollStore`→`scrollTracks`→`introTimeline`→`electricalScore`: no back edge today (`scrollTracks.ts:59`, `introTimeline.ts:68`). `scrollTracks` must not import `scrollStore` |

## 3. Workstream dependencies and contention
| Edge | Why |
|---|---|
| W3a (C1) → W3b (C2) → W3c (C4) → W4 (C5) | Gate first, then sites, then shrink, then removal (spec order) |
| W1 (C3) → W3c (C4) | The exit card links to `/quiet-machine/`, which must exist first |
| W1 (C3) → W4 (C5) | `check:station2` asserts the QM build input |
| W3c + W4 → W2 (C6, C7) | Nav and fade wrap the final page shape |
| W2 (C6) → W6 (C8, R4) | The transition verifier tests the fade |
| W1 (C3) → W5 (C9-C13) | QM is edited at its new entry |
| Owner group A → W5 (C13 posters) | Posters come from the approved build |
| R1 (eb55095) → merge of C2 | G4.4 needs the "before" numbers |

| Parallel lanes (disjoint files; separate worktrees; static work only) | |
|---|---|
| C0 (W7 docs) alongside anything | only `TODO.md`, `INDEX.md`, plan front-matter |
| C1 (W3a) alongside C3 (W1) | W3a: `scrollTracks.ts`, new tests and fixture, harness. W1: HTML, `vite.config.ts`, `App.tsx`, the new entry, `verify-jg033-*` |
| C8 script authoring (W6) alongside C6/C7 | new file only |
| C11 attribution script (W5) alongside C4-C7 | new file; it runs only on the GPU seat |

| Contention file | Touched by (commit) | Rule |
|---|---|---|
| `src/state/scrollStore.ts` | W3 (C2 `:48,127`; C4 `:76-84`), W2 (C7 `:35-39`) | serialize C2 → C4 → C7 |
| `src/scene/drawing/scrollTracks.ts` | W3 only (C1, C4) | one owner |
| `src/components/Chapters.tsx` | W3 (C4); W2 only via `ExitCard.tsx` | W2 never edits Chapters |
| `src/data/caseStudies.ts` | W3 (C4 `:14`) | dormant data untouched |
| `src/App.tsx` | W1 (C3) only | — |
| `src/main.tsx` | W3 (C2, probe install), W2 (C6, fade install and release) | C2 before C6 |
| `src/scene/ScrollRig.tsx` | W3 (C2 `:42,73`; C4 `:50` clamp) | one owner |
| `src/scene/SceneCanvas.tsx` | W4 (C5 `:280,285`) only | — |
| `vite.config.ts` | W1 (C3), W4 (C5) | C3 before C5 |
| `index.html` | W1 (C3 redirect), W2 (C6 fade block) | C3 before C6 |
| `src/scene/rl300/QuietMachinePreview.tsx` | W2 (C6), W5 (C9, C10, C13) | serialize |
| `scripts/verify-jg036-hotspot-layering.mjs` | W4 (C5), W5/W6 (C10) | serialize |
| `scripts/verify-jg033-preview.mjs` | W1 (C3), W5 (C9) | serialize |
| `package.json` | none (the `check:station2` path is kept) | — |
| `TODO.md` | W7 (C0, C14), W4 (C5, the JG-032 line only) | serialize |

## 4. Commit slicing (each leaves the tree green)
Base gates (B) at every code commit: `npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2`. "Mut" means a recorded red output in evidence.
| C | WS | Scope | Files | Extra gates |
|---|---|---|---|---|
| C0 | W7 | Factual stale-doc fixes only (29 §4; no archived status yet) | `TODO.md`, `INDEX.md`, JG-032 plan `:37` | `git diff --stat` docs-only |
| C1 | W3a | Helper (unused), frozen fixture, G4.1, G4.3 constants, G4.4 harness | `scrollTracks.ts`, `__fixtures__/scrollAxisEb55095.ts`, `scrollAxis.test.ts`, `introTimelineFrozen.test.ts`, `capture-jgun-axis-anchors.mjs` | B; `git diff eb55095 -- src/scene/drawing/introTimeline.ts src/scene/drawing/introTimeline.test.ts` empty; Mut: helper set to `3020*ih/100` turns (8.44,788) red |
| C2 | W3b | Switch 8 sites, G4.2, probe install, script divisor fallback (document still 3120vh) | `ScrollRig.tsx`, `scrollCommit.ts`, `scrollStore.ts`, `staticChapter.ts`, `DrawingLinework.tsx`, `main.tsx`, `scrollAxisGrep.test.ts`, `scrollStore.test.ts`, 3 scripts (D4) | B; G4.2=0; Mut: re-add one site turns G4.2 red; GPU R3a (G4.4 vs R1, `verify-jgun-opening --quick`) |
| C3 | W1 | Multi-page, `appType:'mpa'`, redirect script, `?study` branch deleted, jg033 URL repoints | `index.html`, `quiet-machine/index.html`, `src/quiet-machine-main.tsx`, `vite.config.ts`, `App.tsx`, `pageTopology.test.ts`, `importBoundary.test.ts`, `verify-jg033-preview.mjs` (`:6,66,163,180`), `verify-jg033-ribbon-clipping.mjs` | B; `dist/quiet-machine/index.html` exists; Mut: drop one redirect row turns `pageTopology` red; GPU R2a smoke (`verify-jg033-preview` at 4 viewport cases) |
| C4 | W3c | Shrink plus exit: tracks, `CHAPTERS`/`CHAPTER_RANGES` (D7), exit section, `ExitCard` (plain link), clamp .565, deep-link remap, test rewrites | `scrollTracks.ts`(+test), `Chapters.tsx`, `ExitCard.tsx`, `caseStudies.ts`, `staticChapter.ts`(+test), `ScrollRig.tsx`, `scrollStore.ts`(+test) | B; G4.1-G4.3 green; Mut: ch1 +1vh turns G4.1 red; GPU R3b (G4.4, then `--quick`, then the full opening roster). This is the pin proof before removal |
| C5 | W4 | Station 2 archive, warm-list fix, `check:station2` rewrite, vitest exclude, jg036 roster drop, JG-032 marked archived | §1 W4 rows; JG-032 lines in `TODO.md:59`, `INDEX.md` and the plan | B (new `check:station2`); Mut: re-add `<AirflowField />` turns check red; Mut: remove the exclude and Vitest collects the archived tests; GPU R3c (G4.4, `--quick`, the `warmReady` waiters: ring/shaft/manufacturing; JG-036 JGUN roster) |
| C6 | W2a | Fade module, inline blocks, `data-fade` on ExitCard and QM header, release predicates | `pageFade.ts`(+test), `index.html`, `quiet-machine/index.html`, `main.tsx`, `quiet-machine-main.tsx`, `ExitCard.tsx`, `QuietMachinePreview.tsx` `:28,64` | B; parity test; Mut: drop the `pageshow` clear turns the `pageFade` test red |
| C7 | W2b | Page list, nav links, HUD keys, tier param, prefetch | `pages.ts`, `scrollStore.ts`, `StationNav.tsx`, `TechnicalHUD.tsx`, `ExitCard.tsx` | B |
| C8 | W6 | Transition verifier | `verify-page-transition.mjs` | GPU R4; Mut: remove the inline background turns the white-frame check red; Mut: disable the `pageshow` clear turns the Back check red |
| C9 | W5a | QM length 900vh, progress bar, end card, reduced motion to poster | `quiet-machine.css`, `QuietMachinePreview.tsx`, `preview.test.ts`, `verify-jg033-preview.mjs` `:162-174` | B; GPU R2 (3 viewports plus 390x844-lite) |
| C10 | W5b | Intake hotspot plus jg036 QM case | `IntakeHotspot.tsx`, `QuietMachinePreview.tsx`, `quiet-machine.css`, `verify-jg036-hotspot-layering.mjs` | B; GPU R5; Mut: lower the badge z-layer turns the `elementFromPoint` probe red |
| C11 | W5c | Attribution only (no product change) | `measure-qm-render-passes.mjs` | GPU R2-perf (attribution table) |
| C12 | W5d | Cut the largest term, lite policy, cap skip while closed (may split into 2 commits; the asset commit is separate) | `SectionCaps.tsx`, `QuietMachineScene.tsx`, `AirRibbons.tsx`, `preview.test.ts`, cond. GLB | B; GPU R2-perf (device-named p50/p95; Q3 rule) |
| C13 | W5e | 7 posters plus the `POSTERS` map | `public/images/rl300-shot-0*.png`, `QuietMachinePreview.tsx:9` | B; R2 poster case |
| C14 | W7 | Close-out docs | brief `:225`, `deployment.md`, JG-033 plan, `TODO.md`, `INDEX.md`, evidence index | docs-only |

## 5. Seat routing (claude-tiers)
| WS | Implement seat / effort | Review gate | Critical (Opus review before done) |
|---|---|---|---|
| W1 | Sonnet / medium | Opus spawn | YES: build and deploy config, redirects, `appType` |
| W2 | Sonnet / high | Opus spawn | YES: fade/GL lifecycle, bfcache, release predicate |
| W3 | Opus plans the fixture and anchor table; Sonnet / high implements C1-C4 | Opus spawn per commit (C1, C2, C4) | YES: scroll pin |
| W4 | Haiku / low for the moves, exclude and test trim; Sonnet / medium for SpatialWorld, SceneCanvas warm list and the check rewrite | Opus spawn (C5) | YES: warm-list edit (GL lifecycle) |
| W5 | Sonnet / medium (C9, C10, C13); Sonnet / high (C11, C12; owner does any Blender work) | advisor, plus Astra for the visuals | no for code; visuals go to Astra |
| W6 | Haiku / low for URL and divisor repoints; Sonnet / high for `verify-page-transition` | advisor; Opus spawn for `verify-page-transition` | YES: transition verifier (it gates the fade) |
| W7 | Haiku / low | advisor | no |
| GPU seat | one Sonnet / medium seat owns the :4173 servers and every R run | report goes to the critical-path reviewer | — |

## 6. GPU and runtime evidence plan (one seat, serialized; restart :4173 after every rebuild, `AGENTS.md:47-48`; record the build hash)
| Run | After | What | Owner-look artifacts |
|---|---|---|---|
| R1 | C1 | Disposable `eb55095` worktree build: `capture-jgun-axis-anchors` at 1440x900, 768x1024, 390x844 gives `31-…baseline.json` | none |
| R3a | C2 | Same harness on C2; G4.4 \|Δpaced\|≤1e-4; `verify-jgun-opening --quick` | none |
| R2a | C3 | `verify-jg033-preview` at `/quiet-machine/` (smoke, exit 0) | none |
| R3b | C4 | G4.4, then `--quick`, then the full 6-case opening roster | none (Station 2 is still mounted) |
| R3c | C5 | G4.4; `--quick`; warmReady waiters; JG-036 JGUN roster | **Group C**: exit frames at paced .525/.545/.565 without the enclosure, end card at 3 viewports (PNG sheet) |
| R4 | C8 | `verify-page-transition` at 1440x900 and 390x844; bfcache Back; CDP screencast frame dump; time-to-release for both candidate flags | **Group D**: JGUN-to-QM MP4, Back MP4, reduced-motion cut (both viewports) |
| R2 | C9 | `verify-jg033-preview` at 3 viewports plus 390x844-lite | **Group A**: section holds at u .34/.51; 7-shot sheets at 1440x900 and 390x844; forward/reverse MP4; intake close-up; reservoir 1019/1020; chevrons; 900vh forward recording |
| R5 | C10 | JG-036 roster plus the QM intake case | intake hotspot PNG (rest and open) for group A follow-up |
| R2-perf | C11, C12 | Attribution table; device-named p50/p95 on desktop GPU plus one phone | perf table only |
| R6 | after the A-D rulings are applied, C13 | Astra packet captures (design §7 row 5) from one build | Astra packet; then **group E** full-size frames plus a live forward/reverse run |

## 7. Owner and Astra rulings → producing commit
| Ruling | Artifact produced by | Blocks |
|---|---|---|
| Group A: QM content (29 §2 items 1, 2, 3, 4, 6), incl. the 900vh length | C9 + R2 (+R5 hotspot) | C13 posters, R6 |
| Group B: 2a panel (item 5) | owner Blender split, or an optional interim dark-tone PNG on a W5 commit | R6 |
| Group C: JGUN exit without the enclosure, end card, retained JGUN polish, JG-034 look | C5 + R3c | R6 |
| Group D: transition | C8 + R4 | R6 |
| Q3 triangle acceptance (desktop 60 fps, phone 30 fps at p95) | C12 + R2-perf | launch |
| Astra, ONE call, MEDIUM, prompt via stdin; proof is an ocx row `openai/gpt-6-astra` 200 | R6 (after A-D are applied) | group E; a second call needs owner consent |
| Group E: final plan gate | R6 build | publication (also blocked until M249 ships, §9 Q1) |
| JG-037 TODO row (M249 page) | C14 proposal | owner approval |

## 8. Not determinable statically → resolution
| Item | Resolved by | Pass / fallback |
|---|---|---|
| Pages `/quiet-machine` to `/quiet-machine/` redirect; whether `_redirects` matches query strings | host only (deploy not authorized, D5); recorded UNVERIFIED in `deployment.md` (C14) | The client-side redirect does not depend on it. Re-check at the first authorized preview deploy |
| Paint-holding and white flash on Safari/Firefox | R4 is Chromium only; WebKit/Firefox via Playwright engines if installed, otherwise UNVERIFIED | Inline `html` background (C6) is the mitigation |
| bfcache eligibility and GL survival (JGUN `SceneCanvas.tsx:424`, QM `:54`) | R4 Back test | If tier drops to poster on Back, record it and raise it as an owner question; do not patch silently |
| Mobile GPU memory with JGUN frozen in bfcache | R4 on the phone (device named) | If OOM or context loss, propose `Cache-Control: no-store` on JGUN (design reopen, so owner) |
| Exit frame reads complete without the enclosure; `SceneCanvas.tsx:228` lighting dip (k falls to 0.25 by .565) | R3c → group C | Owner ruling; any change is a JGUN visual (Astra) |
| Which JGUN flag ends the entry fade | R4 measures time-to-flag for `annotationsReady`, `__drawingProof.ready` and `warmReady` | Keep `annotationsReady` if it is ≤2.5 s at 3 viewports. Otherwise switch to `__drawingProof.ready` (earlier, before fonts); else the cap decides |
| Lenis/ScrollTrigger re-sync on Back restore at depth (`ScrollRig.tsx:69-79`) | R4 plus the "reload at depth" case in `verify-page-transition` | On failure, a W2 follow-up re-syncs on `pageshow` (Opus review) |
| Per-pass split of the 1,201k triangles | C11 + R2-perf | Decides the C12 branch (caps vs base geometry) |
| `verify-jg032` after `9656ab8` | not run (archived, design §6) | Stays UNVERIFIED in the archive README |
| Desktop GPU and phone models | GPU seat asks the owner before R2-perf | No p95 claim without a named device |
| Real phone probe vh ≠ `innerHeight/100` | R3b on a real phone, or a 390x844 emulated dynamic toolbar; G4.1 (8.44,788) covers the math | G4.4 on the device |
| Numeric `end` beyond the laid-out maximum (D15) | resolved statically (gsap `:2057-2059`) | G4.4 backstop |
| QM look under the new entry CSS (D11) | R2a vs ev-28 captures (pixel diff at stop 0) | Any diff means the entry CSS import order is wrong |
| `appType:'mpa'` side effects in dev (`/` index, HMR) | C3 local dev smoke by the GPU seat | Revert to `'spa'` and mark the slashless/404 checks host-only |
