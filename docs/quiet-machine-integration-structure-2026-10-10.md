# Quiet Machine integration and page split: STRUCTURE (phase 4), Revision 2, 2026-10-10

Status: structure only, awaiting owner approval before the plan phase. No source, test, TODO.md or design doc changed. Revision 1 is in git at `666cbf23`. Revision 2 includes the fixes from an independent review: the QM7b rulings commit, the GPU-7 poster capture, a single owner for the `:58` loader swap, and the JGUN asset gate U.4.
Inputs: [handoff](HANDOFF-quiet-machine-2026-10-10.md) (§2 decisions are FINAL and cited, not reopened), [design](quiet-machine-integration-design-2026-10-09.md) §1-3 and §5-10 (§4 and constraint D4 are superseded by §10), [owner notes](owner-notes-marksList-2026-10-10.md), [29](../project/work/evidence/rl300-quiet-machine/29-research-reconcile-2026-10-09.md), [30](../project/work/evidence/rl300-quiet-machine/30-research-page-split-2026-10-09.md).
Tree read at `666cbf23` (branch `quiet-machine/integration` = `eb550958` plus one docs commit). Every file:line below was re-read or re-grepped on 2026-10-10.

## Costs, risks and decisions first
| Item | Value |
|---|---|
| Commits | 14 (QM0-QM11, the QM7b rulings commit, and a conditional QM9b asset commit) |
| Seats | Sonnet/high builds 11 commits (QM1-QM9, QM7b, QM9b); Haiku/high does 3 mechanical ones (QM0, QM10, QM11); Opus/medium reviews 6 (QM1, QM2, QM4, QM6, QM9, QM9b). QM9b is conditional: if it does not land, 10 Sonnet builds and 5 Opus reviews |
| Token estimate (rough, not measured) | about 2.8-3.3M: roughly 11 x 200k Sonnet builds, 6 x 100k Opus reviews, plus 8 GPU-seat sessions (about 300k less if QM9b does not land). The plan phase prices each commit |
| GPU runs | 8 (GPU-1 to GPU-8). Each needs the owner to get the JG-035 session to release the GPU and a port first |
| Astra calls | 1 in this track (MEDIUM, one packet). The full JGUN-to-QM fade needs a second call at cutover, which needs owner consent (open question 3) |
| Torque wrench page | **No torque source touched**, proved per commit by §1a gate U.1-U.3. The build can still change the JS/CSS that JGUN fetches (risk 1), so gate U.4 compares them at every code commit |
| Top risks | (1) The multi-page build can split shared vendor code into a common chunk, and Tailwind (`src/index.css:1-2` scans all of `src/` plus the root `index.html`) can add CSS from new QM and shell classes, from utility-looking words in copy text and comments, and from QM4's redirect-script tokens in `index.html`, so JGUN's fetched assets change even with no JGUN source edit (gate U.4 statically, GPU-1 at runtime). (2) The fade can only be shown half-built until cutover (QM side only). (3) Triangle budget: 1,201k vs a ~500k target. (4) GPU contention with the JG-035 session |
| Decisions needed from the owner | §9: branch hygiene, merge target, Astra scope for the fade, and 5 smaller ones |

## Revision 2: what changed
Rows that name revision-1 items carry the word WITHDRAWN so the done-check grep can tell them apart.
| Change | Item | Reason |
|---|---|---|
| WITHDRAWN | Scroll-axis pin: rev-1 commits C1 and C2, the C4 timing comparison, gates G4.1-G4.4, the 3120vh virtual baseline, the eb55095 fixture and the axis-anchor harness | Design §10. The torque wrench scroll length is not final, and "JGUN timings unchanged" is withdrawn |
| WITHDRAWN | Rev-1 workstream W3 (JGUN pin and shrink) and W4 (Station 2 archive) | The QM track must not touch the torque wrench page. Station 2 archive, M249 unmount and the shrink move to the torque track's cutover |
| WITHDRAWN | JGUN-side shell consumption: exit card, StationNav/HUD page links, the `scrollStore` page list, the fade install in `main.tsx` and the fade block in `index.html` | Same rule. The torque track consumes the primitives at cutover |
| WITHDRAWN | Legacy redirect rows for `?station=2|3|enclosure|safe-enclosure|m249` and `?chapter=2|3` | Station 2 and Station 3 are still live on the current page. Those rows activate at cutover (Station 2) and at JG-037 (M249) |
| WITHDRAWN | Edits to `check-station2-contract.mjs`, the JG-036 JGUN roster, and the Group C (JGUN exit) ruling | All three depend on the old page changing |
| Kept | W1 page topology, now generic plus the QM entry; W2 fade and nav, now generic primitives with QM as the only consumer; W5 QM product; W6 QM-only verifiers; W7 docs | Handoff §5.2 |
| Kept | Design-correction findings D3, D5, D6, D7, D11 and D14, re-verified in §0. D5-D7 are handed to the torque cutover | Handoff §3 |
| New | Commit names `QM0`-`QM11`. The old names would collide with the withdrawn rev-1 C-numbers in the done-check grep | Spec conflict, resolved by renaming |
| New | A "does not touch" list (§1a) with a command gate | Handoff §5.2 (the QM track must not touch the current torque wrench page) and §2.9 (it stays live and untouched until the replacement is accepted) |
| New | The shell contract (§2), with an "add a page" checklist the torque track and M249 can design against before it lands | Handoff §5.2 (generic page-shell primitives the torque rebuild and M249 reuse) |
| New | Extensibility gate: `src/shared/**` may contain no scroll length (§2, gate in QM1) | Handoff §2.7 (torque scroll length not final) and §2.8 (beats as data, independent of scroll length) |
| New | A QM-only intake verifier instead of editing the JG-036 verifier | Contention (§3) |
| New | QM reduced-motion-to-poster lands **before** the redirect (QM3 before QM4) | `App.tsx:28-30` keeps reduced-motion visitors on posters today. The redirect must not send them into QM's manual WebGL mode |
| New (review) | QM7b applies the group A/B rulings and repoints the poster writer. GPU-7 captures the 7 posters, so the runs go from 7 to 8 (the Astra packet is now GPU-8). QM9b is the only commit that may swap the `QuietMachineScene.tsx:58` loader. Gate U.4 diffs JGUN's assets | Independent review |

## 0. Design corrections (re-verified at `666cbf23`)
| # | Finding | Re-verified fact | Status | Used by |
|---|---|---|---|---|
| D3 | Grep gates must strip comments first | `introTimeline.ts:7` is a comment containing `scrollHeight - innerHeight`. QM uses the bare `- innerHeight` form (`QuietMachinePreview.tsx:36,41,49`). The original gate was the rev-1 pin grep gate (WITHDRAWN) | HOLDS, generalized | QM1 `shellBoundary.test.ts` strips `//` and `/* */` before matching |
| D5 | Removing a station group breaks warm-up | `SceneCanvas.tsx:280` looks up `station-1-jgun`, `station-2-enclosure` and `station-3-m249`. `:281` warm-cancels if any is missing, `:285` lists the visibility combos, and `:305` sets `warmReady`. Nine scripts reference `warmReady` (grep -c, 2026-10-10), among them `verify-jgun-opening`, `verify-jg036-hotspot-layering`, `verify-manufacturing-inspection` (9 hits) and `verify-handwriting-reference` (3, new since rev 1) | HOLDS | Torque cutover: edit `:280,285` in the commit that removes a group |
| D6 | Dropping the `<M249Stage/>` mount alone does not stop the M249 download | `useGLTF.preload` runs at module evaluation (`M249Stage.tsx:165`), so the import at `SpatialWorld.tsx:10` must go too. The mounts are at `:111` and `:131`, and the ContactShadows at `:118,132` | HOLDS | Torque cutover / JG-037 |
| D7 | Chapter data is coupled | `CHAPTERS` (`caseStudies.ts:14`) drives the sections (`Chapters.tsx:348`) and `chapterForProgress` (`staticChapter.ts:19-22`). A missing range falls back to `[0,1]` (`staticChapter.ts:22`, `Chapters.tsx:146`) and a missing height to ch1's (`Chapters.tsx:353`) | HOLDS | Torque cutover/rebuild: change them in one commit |
| D11 | QM is self-contained for JS only | QM inherits Tailwind preflight from `src/index.css` (`main.tsx:4`), while `quiet-machine.css:1` sets its own background `#101b24` and `min-height:320vh` | HOLDS | QM4: the QM entry imports `./index.css` inside `StrictMode`, matching `main.tsx:9-13` |
| D14 | The dev server can pass slashless and unknown paths for the wrong reason | `vite.config.ts:5-11` has no `appType`, so the default `'spa'` falls back to the root `index.html` | HOLDS | QM4 sets `appType:'mpa'` |
| D10 | `verify-jg033-preview.mjs:162-174` asserts manual reduced-motion mode | Still true (`:174` "fixed pose, explicit controls") | HOLDS | QM3 rewrites it to poster |
| D12 | Is `src/shared` typechecked? | `tsconfig.json:21` includes `["src","vite.config.ts"]` | HOLDS | `src/shared/**` is typechecked. `vite.config.ts` may import `./src/shared/pages` |
| D13 | TODO.md line numbers | JG-036 `:39`, JG-037 `:42-43` (the row already exists in this worktree), JG-034 `:45`, JG-033 `:50`, JG-032 `:62` | UPDATED | W7 edits by content, never by line number |
| D1, D2, D4, D15, D16 | Divisor sites, script divisors, the gsap numeric end, the progress clamp | Pin-specific | WITHDRAWN (pin) | — |
| D8, D9 | `Chapters.tsx:342-365` track stack; the `check:station2` rewrite | Still accurate, but they concern old-page removal | Moved to cutover | Torque track |
| N1 (new) | Reduced-motion ordering | `App.tsx:30` returns the QM study only when `!reducedMotion`. Today `/?study=rl300` with reduced motion renders the JGUN poster | NEW | QM3 must precede QM4 |
| N2 (new) | `check:station2` proves Station 2 is untouched | It reads `SpatialWorld.tsx` (`check-station2-contract.mjs:20-21`) and fails without `<AirflowField />` (`:56-57`) | NEW | Base gate B, with the script unedited |
| N3 (new) | JG-036 keepers stay live | `verify-jg036-hotspot-layering.mjs:55` `duct-intake` (producer `station2-stage`, `:62`) and `:65` `m249-trunnion` still have their hosts on the current page | NEW | QM intake case goes in a new script (QM7) |
| N4 (new) | QM beats are already data on a scroll-independent axis | `shot.ts:23-38` `SHOTS` `from`/`to` and `:44-63` `KEYS.at` sit on `u` in [0,1]. Length lives only at `quiet-machine.css:1`. Inserting a shot rescales its neighbours | NEW | §2 extensibility; open question 6 |
| N5 (new) | No CSP today | `public/_headers` has 0 `Content-Security-Policy` hits | NEW | Inline shell blocks work. A later CSP needs hashes for every shell block |
| N6 (new) | QM's reduced-motion verifier case is red at base | `verify-jg033-preview.mjs:162-163` loads `/?study=rl300` with `reducedMotion:'reduce'` and waits for `__quietMachine.ready`. Playwright's emulation sets `matchMedia('(prefers-reduced-motion: reduce)')`, which `qualityStore.ts:42-47` reads. `App.tsx:30` (owner gate, 2026-10-06) then skips the QM branch, and `:40,50` render `StaticPoster`. `window.__quietMachine` is created only at `QuietMachinePreview.tsx:45` (the scene, ribbons and caps only add to it), so the `:163` wait times out. The last full run predates that gate (ev 09, `df122b1`) | NEW, confirmed statically, red at base | No runtime run needed (§6 GPU-1). QM3 fixes it |

## 1. File manifest
Act: NEW = create, M = modify, DEL = delete, L = leave untouched (listed because a reader would expect a change). Each path is repo-relative. "Torque page?" means: does this change anything that a URL rendering the torque wrench (JGUN) page renders, scrolls, times, fetches from source, or navigates to?

| WS | Act | Path | Change (commit) | Torque page? | Risk |
|---|---|---|---|---|---|
| W2 | NEW | `src/shared/pages.ts` | Page registry, tier param, legacy-redirect table, href and tier helpers (§2) (QM1) | NO: new leaf, no JGUN importer | M |
| W2 | NEW | `src/shared/pages.test.ts` | Registry invariants; `pageHref` tier carry; redirect-table statuses (QM1) | NO | L |
| W2 | NEW | `src/shared/shellBoundary.test.ts` | Import boundary plus the no-scroll-length gate, comments stripped (D3) (QM1). QM4 adds the `src/quiet-machine-main.tsx` import rule, because QM4 creates that file | NO | M |
| W2 | NEW | `src/shared/pageFade.ts` | Fade-through-dark runtime: click delegation, ramp, flag, release, `pageshow` clear (§2) (QM2) | NO: not imported by JGUN | H |
| W2 | NEW | `src/shared/pageFade.test.ts` | Injected-env tests. Vitest runs in node (`staticChapter.test.tsx:15`) (QM2) | NO | M |
| W2 | NEW | `src/shared/PageNav.tsx` | Generic cross-page nav: header and end-card variants; reserved entries render "in preparation" (QM2) | NO | M |
| W2 | NEW | `src/shared/PageNav.test.tsx` | Static markup via `react-dom/server`: link vs reserved vs current, `data-fade`, tier carry (QM2) | NO | L |
| W1 | NEW | `quiet-machine/index.html` | QM HTML entry: title, description, canonical `https://studiomark.dev/quiet-machine/`, og tags, the shell fade block, `#root`, module `/src/quiet-machine-main.tsx` (QM4) | NO | M |
| W1 | NEW | `src/quiet-machine-main.tsx` | `createRoot` + `StrictMode` + `import './index.css'` + `installPageFade(document)` + `<QuietMachinePreview/>` (QM4) | NO | M |
| W1 | M | `vite.config.ts` | `appType:'mpa'`; `build.rollupOptions.input` derived from `PAGES` rows that have an `htmlEntry` (QM4). The `test.exclude` at `:9` is unchanged | YES (fetches): no JGUN source changes, but the build may now emit a shared vendor chunk that the JGUN entry imports (risk 1). Gate U.4 statically, GPU-1 at runtime | H |
| W1 | M | `index.html` | One contiguous block after `:4`: `<!-- shell:begin -->` + `<!-- shell:redirect:begin/end -->` script for the `?study=rl300` row only + `<!-- shell:end -->`. No fade block on this page until cutover. `:2` class unchanged (QM4) | NO in behaviour, but its tokens reach JGUN's CSS through Tailwind's `@source "../index.html"` (`src/index.css:2`), which gate U.4(a) checks. The script is inert unless `study=rl300`, which renders QM today (or the JGUN poster under reduced motion, N1, fixed by QM3) | H |
| W1 | NEW | `src/shared/pageTopology.test.ts` | Iterates `PAGES`: each `htmlEntry` exists; the fade sub-block is byte-identical in every entry with `fadeIn:true` and absent elsewhere; the redirect sub-block exists only in `index.html` and, run against a stub `location`, redirects exactly the `active` rows and passes the others through; the §2 no-scroll-length regex has 0 matches inside each entry's `shell:begin`…`shell:end` block, comments stripped (QM4) | NO | M |
| W1 | L | `public/_headers` | No CSP (N5). `/assets/*` immutable covers both entries | NO | L |
| W1 | L | `public/404.html` | Stays the miss handler (`:7` refreshes to `/`). `/m249/` 404s until JG-037. No `public/_redirects` | NO | L |
| W1 | L | `package.json` | `build` (`:9`) already builds every input. `check:station2` (`:13`) is unchanged | NO | L |
| W1 | L | `scripts/deploy-studiomark.ps1` | `:25` deploys the whole `dist`. No deploy is authorized | NO | L |
| W5 | M | `src/scene/rl300/QuietMachinePreview.tsx` | QM3: reduced motion becomes poster (`:21,25,39,49,74`), with a local check (no `src/shared` import). QM4: the tier lines (`:21-25`, `quality` param plus reduced motion) switch to `resolveEntryTier`; header `:64` becomes `<PageNav variant="header">`; `onReady` (`:28`) plus the poster and context-lost paths (`:29,54`) release the fade. QM5: progress bar, end card at u>=.97, `--qm-length`. QM7: mounts `IntakeHotspot`. QM7b: group A/B rulings. QM10: `POSTERS` (`:9`) gets 7 entries | NO: QM only | M |
| W5 | M | `src/scene/rl300/quiet-machine.css` | `:1` `min-height:var(--qm-length)` with the value from one constant; progress bar, end card, hotspot layers (QM5, QM7) | NO | M |
| W5 | NEW | `src/scene/rl300/IntakeHotspot.tsx` | Badge at the lower intake; click calls `seek(.51)` and opens the detail card; JG-036 layering pattern (QM7) | NO | M |
| W5 | M | `src/scene/rl300/QuietMachineScene.tsx` | QM9: lite policy (no composer, DPR<=1.5). QM9b, and no other commit: the `:58` loader swap to a new `rl300-` asset. QM7b: the group B interim dark tone, if that is the ruling | NO: `msp-enclosure.glb` is never edited (Station 2 uses it) | M |
| W5 | M | `src/scene/rl300/SectionCaps.tsx` | `:35-38` skips cap passes while the section is closed; stencil proxies if the attribution says so (QM9). QM9b: as the new asset requires | NO | H |
| W5 | M | `src/scene/rl300/prepareModel.ts` | QM9b only, as the new asset requires: the part-name matching (24 lines match `\.name\|startsWith\|NAME\|-RES-\|-SIF-`: `PART_POLICY`, `LINER_PART`, `EXHAUST_PIPE`, `SECTION_ROOTS`, `MSP_AIRWAY_VOLUME`, `PROPOSED_LOWER_INTAKE`) must still resolve on the new asset | NO | H |
| W5 | M | `src/scene/rl300/AirRibbons.tsx` | Ribbon count by tier, lite 6-10 (QM9) | NO | M |
| W5 | M | `src/scene/rl300/preview.test.ts` | Poster-on-reduced-motion, length constant, end card, 7-poster map, hotspot seek, lite policy (QM3-QM10) | NO | L |
| W5 | NEW | `public/models/rl300-section-proxies.glb` | Conditional (QM9b): only if the attribution names cap passes. Authored in Blender (`AGENTS.md:37-41`). Force-add, because `.gitignore:7` ignores `public/models/*.glb` | NO | H |
| W5 | NEW | `public/models/rl300-full.glb` (name final in the plan phase) | Conditional (QM9b): the one new full-tier asset. It lands if group B picks the owner's Blender split of the 2a panel, or if QM9 picks decimation, or both (one file carries both). The owner authors it in Blender from the `msp-enclosure` source. Force-add. `msp-enclosure.glb` is never edited (§1a) | NO | H |
| W5 | NEW | `public/images/rl300-shot-01-poster.png` | Seven files, `-01-` to `-07-`, captured by GPU-7 from the build with the group A/B rulings applied (QM7b) and QM9/QM9b in; committed in QM10 | NO | L |
| W5 | DEL | `public/images/rl300-{exterior,section,intake}-preview.png` | QM10 deletes the 3 old posters. After QM10 repoints `POSTERS`, nothing in `src/` reads them. QM7b has already replaced their only writer (the `CAPTURE_POSTERS` block in `verify-jg033-preview.mjs`) with the 7-shot poster loop, so a later capture cannot recreate them. Old evidence manifests under `project/` that list them stay as history | NO | L |
| W6 | M | `scripts/verify-jg033-preview.mjs` | QM3: rewrite the reduced-motion block (the `reducedMotion: 'reduce'` page through the `reducedMotionAndContextLoss` report line) to the poster check (D10, N6). QM4: every `${base}/?study=rl300…` goto (three today: the shot loop, the reduced-motion case, the poster/asset-failure scenario loop) moves to `/quiet-machine/?…`, and the `PLAYWRIGHT_MODULE` dynamic import with the hard-coded npx-cache path becomes a static import of the `playwright` devDependency (`package.json:36`); the `report.build` hash source (`readFileSync('dist/index.html')`, which the served-HTML assert compares every goto against) becomes `dist/quiet-machine/index.html`. QM7b: the `CAPTURE_POSTERS` writer (now `rl300-${shot}-preview.png` inside the assertion loop, which visits only 4 anchors) is removed from that loop and replaced by a separate desktop-only poster loop over all 7 `SHOTS` that writes `rl300-shot-0N-poster.png` and logs each path (QM7b row). QM9b: the `report.asset` hash source (`readFileSync('public/models/msp-enclosure.glb')`), the full-tier asset request (`/models/msp-enclosure.glb` against `report.asset`) and the `asset-failure` route (`**/models/msp-enclosure.glb`) all follow the new full-tier asset, plus any full-tier count or ruling assert the new asset moves (`assertRuling(parts)`, `removedTriangles` 460, `108 + 24`), each change justified in the evidence. QM10: the poster-scenario wait (`src.includes('intake')` after the "Lower intake" click) matches `shot-04` | NO | M |
| W6 | M | `scripts/verify-jg033-ribbon-clipping.mjs` | The `${base}/?study=rl300` goto moves to `/quiet-machine/` (QM4) | NO | L |
| W6 | NEW | `scripts/verify-page-transition.mjs` | QM-side fade: QM to `/` fade-out; a synthetic arrival into QM (flag preset via `addInitScript`) with a fade-in on first paint and release on `onReady`, capped at 2.5 s; Back to QM restored from bfcache with the overlay cleared and the canvas live; reduced-motion cut; the legacy `?study=rl300` redirect with no history entry; a CDP-screencast no-white-frame check on QM entry; time-to-release (QM6) | NO: reads `/`, edits nothing | H |
| W6 | NEW | `scripts/verify-qm-intake-hotspot.mjs` | `elementFromPoint` at rest, actionability-checked click, `u≈.51`, card open (QM7) | NO | M |
| W6 | NEW | `scripts/check-qm-jgun-assets.mjs` | Gate U.4: compares JGUN's static closure (sha256 of the stylesheets `dist/index.html` references, concatenated in link order; sourcemap module set) between the `666cbf23` base build and the current build (QM1) | NO: reads two build dirs, edits nothing | M |
| W6 | NEW | `scripts/measure-qm-render-passes.mjs` | Per-pass `renderer.info` table: unique geometry x instances, cap passes, ribbons, composer (QM8) | NO | M |
| W7 | M | `project/work/plans/JG-033-rl300-quiet-machine.md` | Extension record: page split; the Milestone 3 shared-progress source is moot; the pin is withdrawn (QM0); close-out (QM11) | NO | L |
| W7 | M | `project/work/plans/JG-032-station2-thermal-visualization.md` | Front-matter `commits:` gains `d201ea8` (fact, 29 §4). Status unchanged: not archived (QM0) | NO | L |
| W7 | M | `project/context/deployment.md` | Multi-page output, `appType:'mpa'`; host-only checks (slash redirect, query redirect) UNVERIFIED (QM11) | NO | L |
| W7 | M | `project/context/project-brief-2026-09-29.md` | `:31` `?study=rl300` row now points to `/quiet-machine/` (QM11). The `check:station2` meaning is unchanged | NO | L |
| W7 | M | `TODO.md` | QM11 only, by content: the JG-033 block (29 §4 facts plus program status). JG-037 already exists (`:42-43`). JG-032 stays as it is | NO | L |
| W7 | M | `project/work/INDEX.md` | QM11 only: the JG-033 row | NO | L |
| W7 | NEW | `project/work/evidence/rl300-quiet-machine/31-gpu-1-qm-entry-smoke.md` | One evidence file per GPU run (`31-` to `38-`, GPU-1 to GPU-8): build hash, viewports, run outputs | NO | L |
| W7 | NEW | `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md` | Per-commit evidence: one section per commit with its gate output and the red output of each mutation. QM1 creates it and also records QM0's gate output (QM0's gate allows only its 2 plan files). Each later commit adds its own section in the same commit. QM1 also records the gate U.4 base summary here | NO | L |
| W7 | M | `project/work/evidence/rl300-quiet-machine/README.md` | The evidence index: links to 31-38 and `qm-commit-gates.md` (QM11) | NO | L |

### 1a. Does-not-touch list (QM track, until the torque track's cutover)
| Path | Region | Why it matters |
|---|---|---|
| `src/App.tsx` | whole file, incl. `:21` lazy QM import and `:27-32` `?study` branch | After QM4 that branch is dead for JGUN visitors (the head redirect runs first). The cutover deletes it |
| `src/main.tsx` | whole file | JGUN fade install and release belong to the cutover |
| `src/components/Chapters.tsx` | `:342-365` track stack | Scroll length is torque-owned |
| `src/components/staticChapter.ts` | `:11-16` `CHAPTER_RANGES`, `:19-22` | D7 |
| `src/components/StationNav.tsx` | `:8-12`, `:40-56` | Station buttons stay in-page |
| `src/components/TechnicalHUD.tsx` | `:108-113` keys, `:213-218` | Same |
| `src/state/scrollStore.ts` | `:35-39` `SPATIAL_STATIONS`, `:76-84` deep links | `?station=2|3` and `?chapter=2|3` keep landing in-page |
| `src/data/caseStudies.ts` | `:14` `CHAPTERS`, CH.03 copy, hotspots, `CAMERA_PATH` | Torque-owned |
| `src/scene/drawing/scrollTracks.ts` | `:79-82` height constants | No timing edits |
| `src/scene/drawing/introTimeline.ts` | whole file | No timing edits |
| `src/scene/ScrollRig.tsx` | `:42` `end:'max'`, `:73` | No timing edits |
| `src/scene/scrollCommit.ts` | whole file | No timing edits |
| `src/scene/drawing/DrawingLinework.tsx` | whole file | No timing edits |
| `src/scene/SpatialWorld.tsx` | `:8-11` imports, `:92-133` groups | No Station 2 archive, no M249 unmount (D6) |
| `src/scene/SceneCanvas.tsx` | `:280-305` warm list, `:424` context-loss listener | D5 |
| `src/scene/stages/stageWindows.ts` | whole file | No Station 2 archive |
| `src/scene/stages/Station2_AcousticEnclosure.tsx` | whole file | Same, and so for every other file under `src/scene/stages/` |
| `src/scene/stages/M249Stage.tsx` | `:165` preload | JG-037 |
| `src/index.css` | whole file | QM imports it, never edits it |
| `public/models/msp-enclosure.glb` | asset | Station 2 renders it; `check:station2` reads its roots. Any QM geometry change (group B panel split, decimation) is a NEW `public/models/rl300-*` file, and only QM9b swaps the QM loader (`QuietMachineScene.tsx:58`) to it |
| `scripts/check-station2-contract.mjs` | whole file | Stays green unedited (N2) |
| `scripts/verify-jg036-hotspot-layering.mjs` | `:55-65` roster | JG-036 owns it (N3) |
| `scripts/verify-jg032-station2-thermal.mjs` | whole file | Not archived in this track |
| `scripts/capture-rl300-baseline.mjs` | whole file | Same |
| `package.json` | whole file | No script change needed |

**How every gate in this doc runs.** The host is win32 with PowerShell as the primary shell, but every gate command here (`grep`, `wc`, `test -f`, `ls |`, `git … | grep`) is bash. Run each one in Git Bash from the worktree root. From PowerShell: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'cd /c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine && <gate>'`. Do not call a bare `bash` from PowerShell: it can resolve to WSL's `System32\bash.exe`. A seat whose shell tool is already Git Bash runs the gate as written.

**Gate U (U.1-U.3 at every QM commit; U.4 at every code commit; run by command):**
1. `git diff --name-only 666cbf23 HEAD | grep -v -E '^(src/shared/|src/scene/rl300/|src/quiet-machine-main\.tsx$|quiet-machine/|index\.html$|vite\.config\.ts$|scripts/(verify-jg033-preview|verify-jg033-ribbon-clipping|verify-page-transition|verify-qm-intake-hotspot|measure-qm-render-passes|check-qm-jgun-assets)\.mjs$|public/images/rl300-|public/models/rl300-|docs/|project/|TODO\.md$)'` prints nothing.
2. `git diff -U0 666cbf23 HEAD -- index.html` prints nothing before QM4. From QM4 on, it has exactly one `@@` hunk and zero `^-[^-]` lines. Its first added line, with the leading `+` and surrounding whitespace trimmed, is `<!-- shell:begin -->`, and its last, trimmed the same way, is `<!-- shell:end -->`. Added lines keep their indentation under `-U0`, which is why the comparison is trimmed.
3. `npm run check:station2` passes, with the script unedited (N2 in §0; the `check-station2-contract.mjs` row of the list above).
4. JGUN asset diff: `node scripts/check-qm-jgun-assets.mjs <base-out> <new-out>` (NEW in QM1).
   - **Builds.** Both output dirs come from `npx vite build --sourcemap --manifest --outDir <dir>`. These are CLI flags only, so the base commit needs no edit.
   - **Base.** Built once, in QM1, in a scratch detached worktree at `666cbf23`: run `npm ci` in that worktree first (a fresh worktree has no `node_modules`), then the build. It is CPU only (no GPU, no port grant), so it is not a GPU run. Keep it for GPU-1.
   - **Each code commit.** Build the new dir the same way, after B.
   - **What the script reads.** From the `index.html` manifest entry it follows `imports` and never `dynamicImports`: JGUN's static closure.
   - **Pass rule.** Both must hold:
     - (a) The sha256 of the stylesheets that `dist/index.html` references, read from the output dir and concatenated in link order (order affects the cascade), equals the base hash. File names are not compared: Rollup can move `index.css` into a shared chunk and rename it while the bytes stay the same. This catches Tailwind output.
     - (b) The set of repo-relative sourcemap `sources` across the static closure equals the base set.
   - **Not compared: JS chunk names and bytes.** `App.tsx:21` lazy-imports `QuietMachinePreview`, so JGUN's entry chunk embeds the QM chunk's hashed name. That name changes at every QM edit, starting with QM3.
   - **Not compared: chunk boundaries.** QM4 is expected to change them (shared vendor chunk, risk 1).
   - **Output.** The script writes the closure's chunk list and request count, base and new, into `qm-commit-gates.md`. QM4's Opus review rules on the new partition, and GPU-1 `--quick` is the runtime arbiter.
   - **On failure.** Any (a) or (b) difference fails the commit; §8 has the fallback.
   - **UNVERIFIED.** The pass rule and the script have never run: no `dist` exists in this worktree, and building was out of scope for this doc.

If branch hygiene changes the base (§9 Q1), replace `666cbf23` with the new docs-commit SHA.

## 2. Shell primitives: modules, API, boundary (the contract the torque track designs against)
| Module | Exports (names and types) | Imported by |
|---|---|---|
| `src/shared/pages.ts` (zero imports) | `type PageId='jgun'\|'quiet-machine'\|'m249'`; `type TierParam='full'\|'lite'\|'poster'`; `interface PageEntry{id:PageId;index:number;label:string;name:string;path:string;href:string\|null;htmlEntry:string\|null;reserved:boolean;fadeIn:boolean}`; `const PAGES:readonly PageEntry[]`; `pageHref(id:PageId,tier?:TierParam):string\|null` (appends `?quality=` unless `full`; `null` if reserved); `readTierParam(search:string):TierParam\|null`; `resolveEntryTier(search:string,reducedMotion:boolean):TierParam` (reduced motion means poster); `type RedirectStatus='active'\|'cutover'\|'jg-037'`; `interface LegacyRedirect{param:string;values:readonly string[];to:PageId;keepParams:boolean;status:RedirectStatus}`; `const LEGACY_REDIRECTS:readonly LegacyRedirect[]` | `vite.config.ts`, `pageFade` consumers, `PageNav`, QM entry; JGUN at cutover |
| `PAGES` rows now | `jgun`: path `/`, href `/`, htmlEntry `index.html`, `fadeIn:false` (flips at cutover). `quiet-machine`: `/quiet-machine/`, `quiet-machine/index.html`, `fadeIn:true`. `m249`: path `/m249/`, `href:null`, `htmlEntry:null`, `reserved:true`, `fadeIn:false` (the reserved slot) | — |
| `LEGACY_REDIRECTS` rows now | `study=rl300` to `quiet-machine`, keep the other params, `active`. `station=2\|enclosure\|safe-enclosure` and `chapter=2` to `quiet-machine`, `cutover`. `station=3\|m249` and `chapter=3` to `m249`, `jg-037` | — |
| `src/shared/pageFade.ts` (zero imports) | `FADE_KEY='jg:fade'`, `FADE_MAX_AGE_MS=5000`, `FADE_OUT_MS=400`, `FADE_FALLBACK_MS=450`, `FADE_IN_MS=600`, `STATUS_DELAY_MS=800`, `HOLD_CAP_MS=2500`; `interface FadeEnv{now():number;storage:Pick<Storage,'getItem'\|'setItem'\|'removeItem'>;reducedMotion():boolean;assign(href:string):void;schedule(fn:()=>void,ms:number):number;frame(fn:()=>void):number}`; `shouldIntercept(e:Pick<MouseEvent,'button'\|'ctrlKey'\|'metaKey'\|'shiftKey'\|'altKey'\|'defaultPrevented'>):boolean`; `isFreshFlag(raw:string\|null,now:number):boolean`; `installPageFade(doc:Document,env?:FadeEnv):()=>void`; `fadeNavigate(href:string,env?:FadeEnv):void`; `releaseFadeWhen(ready:()=>boolean,env?:FadeEnv):void`; `releaseFade(env?:FadeEnv):void`; `prefetchPage(doc:Document,hrefs:readonly string[]):void` | QM entry, `QuietMachinePreview`, `PageNav`; JGUN at cutover |
| `src/shared/PageNav.tsx` (imports `react`, `./pages` only) | `PageNav(props:{current:PageId;tier:TierParam;variant:'header'\|'endcard'})`; `PageLink(props:{id:PageId;tier:TierParam;children:ReactNode})` renders `<a data-fade href>` or, if reserved, a non-link "{label}, in preparation" | `QuietMachinePreview`; JGUN and M249 later |
| Inline shell block (head of each HTML entry) | `<!-- shell:begin -->` … `<!-- shell:end -->`. Inside: `<!-- shell:fade:begin/end -->` (`html{background:#05070a}`; an `html[data-fade]::after` layer with `position:fixed;inset:0`, so no body element is needed and no `vh` unit appears, which the no-scroll-length regex would reject; a script that reads `FADE_KEY` (<5 s), sets `html[data-fade=in]` and removes the key) only where `fadeIn:true`; `<!-- shell:redirect:begin/end -->` (`location.replace`, so no history entry) only in `index.html` | Parity is enforced by `pageTopology.test.ts`. Constants are duplicated by design; the test asserts they match `pageFade.ts` |

**Contract rules**
| Rule | Gate |
|---|---|
| The shell carries no scroll length. `src/shared/**` (comments stripped, D3) has 0 matches for `/scrollHeight\|scrollY\|scrollTop\|innerHeight\|\d+\s*vh\b\|lenis\|ScrollTrigger/i` | `shellBoundary.test.ts` (QM1). Mutation: add `innerHeight` to `pages.ts` and it goes red. The same regex runs inside each HTML entry's `shell:begin`…`shell:end` block in `pageTopology.test.ts` (QM4) |
| Prefetch timing, the release predicate and the poster decision are caller-supplied. The shell never reads page progress | Same test (no `progress` import possible: zero-import leaves) |
| `src/shared/**` imports only `./*` and `react` (`PageNav.tsx` only): no `three`, no stores, nothing under `src/scene` or `src/state` | `shellBoundary.test.ts` |
| `src/scene/rl300/**` imports only `./*`, `../sectionRenderPass` (`QuietMachineScene.tsx:14`), `../../shared/*` and packages | same |
| `src/quiet-machine-main.tsx` imports only `./index.css`, `./scene/rl300/QuietMachinePreview` and `./shared/*` | `shellBoundary.test.ts`, with this rule added in QM4 (the commit that creates the file), plus a QM4 build check: no `scrollStore`/`qualityStore` module in the QM entry's chunk graph |
| "JGUN never imports `scene/rl300`" | Activates at cutover, when `App.tsx:21` goes. Not enforced in this track |
| Poster path: every page renders a no-WebGL DOM path when `resolveEntryTier` says poster, calls `releaseFade()` on that path's first commit, and carries its tier on outgoing links via `pageHref` | `preview.test.ts` for QM: poster rendering in QM3; `resolveEntryTier` wiring, `releaseFade()` on the poster path and tier carry in QM4. The torque track covers JGUN (its poster path already exists: `App.tsx:40`, `StaticPoster`). Until cutover, the `?quality=` that `pageHref` appends to `/` links is inert on JGUN: JGUN reads only `?qualityLock` (`qualityStore.ts:74`), never `quality` |
| Scroll length and beats are page-owned: each page keeps its beats as data on normalized progress plus one length knob. QM: `SHOTS`/`KEYS` on `u` (N4) plus `--qm-length` | Review |

**Add a page (torque rebuild, M249): no test edits needed, because the tests iterate `PAGES`**
1. Add or flip the `PAGES` row: `href`, `htmlEntry`, `reserved:false`, `fadeIn:true`.
2. Create `<dir>/index.html` with the shell fade sub-block copied byte for byte (the parity test checks it).
3. Write an entry module: `createRoot` + `StrictMode` + `./index.css` + `installPageFade(document)` + the page root. The page calls `releaseFadeWhen(<its ready flag>)`, and `releaseFade()` on its poster path.
4. Flip that page's `LEGACY_REDIRECTS` rows to `active`, and paste the regenerated redirect sub-block into `index.html`.
5. Nav: render `<PageNav current=…>`. Prefetch with `prefetchPage` at a point the page chooses.
The build input follows `PAGES` (`vite.config.ts` derives it). Fallback if Vite's config bundler will not resolve the import (Opus review in QM4): a literal input map plus a test that it equals `PAGES`.

## 3. Dependencies and contention
| Edge | Why |
|---|---|
| QM1 → QM2 → QM4 | Registry, then fade and nav, then the entry that installs them |
| QM3 → QM4 | N1: poster mode before the redirect sends reduced-motion visitors into QM |
| QM4 → QM5, QM6, QM7 | QM is edited and verified at its new entry |
| QM5 + GPU-2, QM7 + GPU-4 → owner groups A and B → QM7b | QM7b applies the rulings |
| QM8 + GPU-5 → QM9 → QM9b (conditional) → GPU-6 | Attribution picks the cut. QM9b also carries the group B Blender split if that is the ruling. GPU-6 runs after QM9b if QM9b lands, otherwise after QM9, because on the decimation branch the new geometry exists only from QM9b |
| QM7b + QM9 (+ QM9b) → GPU-6 → GPU-7 → QM10 → GPU-8 | Posters are captured from the ruled build with its final, measured geometry, then committed; the Astra packet uses that build |
| Shell v1 (membership per open question 1) → torque track implementation | The torque track designs against §2 now and consumes it once it lands (handoff §6) |
| Torque cutover (torque track) → full JGUN↔QM fade, Station 2 archive, `cutover` redirect rows | Not this track |
| JG-037 → `/m249/`, `jg-037` redirect rows, publication | Handoff §2.4 |

| Shared file | QM track | Torque track | JG-035 session (main checkout) | Rule |
|---|---|---|---|---|
| `index.html` | QM4: the shell block (redirect sub-block only) | Cutover: adds the fade sub-block inside the same markers; owns everything outside them | Owns the file on its branch | QM writes only between the shell markers (gate U.2) |
| `vite.config.ts` | QM4: `appType`, input derived from `PAGES` | Consumes; adds pages through `PAGES` only | May touch `test` | QM owns `build`/`appType`; `test.exclude` is not touched |
| `src/App.tsx` | Untouched | Cutover: delete `:21`, `:27-32` | Owns | QM never edits it |
| `src/components/StationNav.tsx` (and `TechnicalHUD.tsx`) | Untouched | Cutover: render `PageNav`/`PageLink` | Owns | QM never edits it |
| `TODO.md` | QM11 only, JG-033 block by content | Adds one row at the end (handoff §6) | Owns the main-checkout copy | Serialize: QM touches it once, at close-out (open question 8) |
| `project/work/INDEX.md` | QM11 only, JG-033 row | — | Owns | Same |
| `src/shared/**` | Owner of the files | Read-only until shell v1 (membership per open question 1) lands; later changes go through a QM-reviewed commit | — | One owner |
| `scripts/verify-jg036-hotspot-layering.mjs` | Untouched (QM7 uses a new script) | Cutover: drops `duct-intake`/`m249-trunnion` | JG-036 owns | — |
| GPU, `:4173`/`:4174`/`:5203`/`:5205` | Needs a grant per run | Needs a grant (tunnel capture) | Holds the reservation | Ask the owner every time; never assume, never pick another port |

| Parallel lanes (static work only, separate worktrees) | Files |
|---|---|
| QM0 alongside anything | 2 plan docs |
| QM3 alongside QM1/QM2 | QM3 touches `src/scene/rl300/**` and the reduced-motion block of `verify-jg033-preview.mjs`; QM1/QM2 touch `src/shared/**` only. Constraint: QM3 must not import `src/shared/*` (`resolveEntryTier` lands in QM1), so it decides poster-on-reduced-motion locally; QM4 swaps that for `resolveEntryTier` |
| QM6, QM8 script authoring alongside QM5 | new files only; they run only on the GPU seat |

## 4. Commit slicing (each commit leaves the tree green)
Base gates B at every code commit: `npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2`. Gate U (§1a, U.1-U.4) also runs at every code commit; docs commits run U.1-U.3. Every row writes them out. All gates run in Git Bash (§1a). "Mut" means a mutation whose red output is recorded in that commit's section of `project/work/evidence/rl300-quiet-machine/qm-commit-gates.md`, in the same commit, before the gate counts. GPU-run output goes to that run's file (31-38).
| Commit | WS | Scope | Files | Gate (by command) |
|---|---|---|---|---|
| QM0 | W7 | Factual plan-doc fixes (pin withdrawn, page split, `d201ea8`) | JG-033 plan, JG-032 plan | `git diff --name-only HEAD~1 HEAD` lists only those 2 files; U.1-U.3 |
| QM1 | W2a | Registry, tier helpers, redirect table, boundary and no-scroll-length gate; gate U.4 base reference | `src/shared/pages.ts`, `pages.test.ts`, `shellBoundary.test.ts`, `scripts/check-qm-jgun-assets.mjs`, `qm-commit-gates.md` (created; QM0 and QM1 sections plus the U.4 base summary) | B; U; Mut: add `innerHeight` to `pages.ts` and `shellBoundary` goes red; Mut: mark the `m249` row `reserved:false` with `href:null` and `pages.test` goes red |
| QM2 | W2b | Fade runtime and generic nav (no consumer yet) | `src/shared/pageFade.ts`, `pageFade.test.ts`, `PageNav.tsx`, `PageNav.test.tsx` | B; U; Mut: drop the `pageshow` persisted clear and `pageFade.test` goes red; Mut: drop the modifier-key check and the pass-through case goes red |
| QM3 | W5a | QM reduced motion becomes poster; status text; verifier case | `QuietMachinePreview.tsx` (`:21,25,39,49,74`; no `src/shared` import, §3), `preview.test.ts`, `verify-jg033-preview.mjs` (the reduced-motion block, now `:162-174`) | B; U; `npm test -- src/scene/rl300/preview.test.ts` shows the new poster case; Mut: restore `u=.52` manual mode and the case goes red |
| QM4 | W1 | Multi-page, `appType:'mpa'`, QM entry, fade on QM only, `?study=rl300` redirect, header `PageNav`, verifier repoints | `quiet-machine/index.html`, `src/quiet-machine-main.tsx`, `vite.config.ts`, `index.html`, `pageTopology.test.ts`, `shellBoundary.test.ts` (the `quiet-machine-main.tsx` rule), `QuietMachinePreview.tsx` (tier lines `:21-25` to `resolveEntryTier`, `:28,29,54,64`), `preview.test.ts` (fade release on the poster path, tier carry), `verify-jg033-preview.mjs` (the playwright import, the three `?study=rl300` gotos, and the `report.build` hash source `readFileSync('dist/index.html')` becomes `dist/quiet-machine/index.html`, because the served-HTML assert compares every QM page against it; all by content; QM3 has already rewritten the reduced-motion block), `verify-jg033-ribbon-clipping.mjs` (its `?study=rl300` goto) | B; U (U.2 and U.4 bite here); `test -f dist/quiet-machine/index.html`; `grep -c jg:fade dist/index.html` prints 0 (no fade on JGUN); `grep -c "dist/quiet-machine/index.html" scripts/verify-jg033-preview.mjs` prints at least 1 and `grep -c "readFileSync('dist/index.html')" scripts/verify-jg033-preview.mjs` prints 0; Mut: delete the `study` row and `pageTopology` goes red; Mut: put `100vh` in the QM shell block and `pageTopology` goes red; Mut: change one byte of the QM fade sub-block and parity goes red; GPU-1 |
| QM5 | W5b | QM length knob, progress bar, end card (`PageNav variant="endcard"`: 01 TORQUE GUN link, 03 M249 in preparation), prefetch of `/` at u>=.97 (caller-chosen) | `quiet-machine.css`, `QuietMachinePreview.tsx`, `preview.test.ts` | B; U; `grep -c "min-height: *320vh" src/scene/rl300/quiet-machine.css` prints 0; GPU-2 |
| QM6 | W6 | Transition verifier (QM side) | `scripts/verify-page-transition.mjs` | B; U; `node --check scripts/verify-page-transition.mjs`; GPU-3 exit 0; Mut: remove the inline background and the white-frame check goes red; Mut: disable the `pageshow` clear and the Back check goes red |
| QM7 | W5c | Intake hotspot plus a QM-only verifier | `IntakeHotspot.tsx`, `QuietMachinePreview.tsx`, `quiet-machine.css`, `preview.test.ts`, `scripts/verify-qm-intake-hotspot.mjs` | B; U; GPU-4 exit 0; Mut: lower the badge z-layer and the `elementFromPoint` probe goes red |
| QM7b | W5c | Rulings commit (always lands): apply the group A rulings (QM content, scroll length via `--qm-length`), apply the group B interim dark tone if that is the ruling (a material change, no asset), and repoint the poster writer | `src/scene/rl300/**` as the rulings require (`shot.ts`, `quiet-machine.css`, `QuietMachinePreview.tsx`, the QM material code), `preview.test.ts`, `verify-jg033-preview.mjs`: the `CAPTURE_POSTERS` write is removed from the assertion loop (that loop visits only exterior 0, section .2, intake .51 and resolve 1, i.e. shots 01, 02, 04 and 07, so it could never write shots 03, 05 or 06). A SEPARATE desktop-only poster loop, run on the desktop page after the assertion loop when `CAPTURE_POSTERS=1`, seeks each `SHOTS[i]` (`shot.ts:23-38`) at its midpoint `u = (from + to) / 2`, rounded to 3 decimals because `seek()` checks the slider at `Math.round(u * 1000)`: 01 .06, 02 .195, 03 .34, 04 .51, 05 .685, 06 .825, 07 .945. It writes `public/images/rl300-shot-0${i+1}-poster.png` for all 7 and logs each written path. Rule: the midpoint is the only one of from / mid / `KEYS` anchor where `shotIndexAt(u) === i` (so the overlay shows that shot) and the section is open in shot 02. It matches the existing anchors at 02 (.2) and 04 (.51) and departs from them at 01 (0) and 07 (1). The `KEYS` anchors labelled 02, 03, 05 and 06 (.27, .41, .76, .89) sit on the next shot's `from`, and `from` for 02 (.12) is a closed shell | B; U; `node --check scripts/verify-jg033-preview.mjs`; `grep -c "preview.png" scripts/verify-jg033-preview.mjs` prints 0; each applied ruling is listed against its group A/B item in the evidence; at GPU-7, the `CAPTURE_POSTERS=1` run's log lists 7 distinct output paths, `rl300-shot-01-poster.png` to `-07-` |
| QM8 | W5d | Attribution only, no product change | `scripts/measure-qm-render-passes.mjs` | B; U; `node --check scripts/measure-qm-render-passes.mjs`; GPU-5 writes the table to evidence 35 |
| QM9 | W5e | Cut the largest term; lite policy; skip caps while closed. No loader swap and no new asset (QM9b owns both) | `SectionCaps.tsx`, `QuietMachineScene.tsx` (lite policy only), `AirRibbons.tsx`, `preview.test.ts` | B; U; GPU-6 (runs after QM9b if QM9b lands, otherwise after QM9) device-named p50/p95; pass = triangles <= ~500k, or the measured number with p95 at 60 fps desktop / 30 fps phone (handoff §2.5) |
| QM9b (conditional) | W5e | The only asset commit, and the only commit that swaps the `QuietMachineScene.tsx:58` loader. Lands if QM9's attribution names cap passes (proxies) or decimation, or if group B picks the owner's Blender split of the 2a panel (this is the group B commit on that branch). The owner authors every asset in Blender | `public/models/rl300-section-proxies.glb` and/or `public/models/rl300-full.glb` (force-added), the `:58` loader (full branch to `rl300-full.glb`; lite branch only if the lite asset changes), `src/scene/rl300/prepareModel.ts` and `SectionCaps.tsx` as the asset requires, `verify-jg033-preview.mjs` (by content: the `report.asset` hash source `public/models/msp-enclosure.glb`, the full-tier asset request `/models/msp-enclosure.glb` compared with `report.asset`, the `asset-failure` route, and any ruling or count assert the asset moves: `assertRuling(parts)`, `108 + 24 + removedTriangles`, `removedTriangles === 460`). The first two would still pass after the loader swap while proving the wrong asset | B; U; `git ls-files public/models/rl300-*.glb` prints each new path; `git diff --quiet 666cbf23 HEAD -- public/models/msp-enclosure.glb`; if `rl300-full.glb` landed, `grep -c "msp-enclosure.glb" src/scene/rl300/QuietMachineScene.tsx scripts/verify-jg033-preview.mjs` prints 0 for both; GPU-6 (QM9b lands, so GPU-6 runs here) |
| QM10 | W5f | 7 posters (captured by GPU-7) plus the `POSTERS` map; delete the 3 old posters | `public/images/rl300-shot-0*-poster.png` (7), `public/images/rl300-{exterior,section,intake}-preview.png` (deleted), `QuietMachinePreview.tsx:9` and the poster `<img>` path, `preview.test.ts`, `verify-jg033-preview.mjs` (the poster-scenario wait after the "Lower intake" click, `src.includes('intake')`, matches `shot-04`: "Lower intake" seeks .51, which is shot 04, and without this the poster, asset-failure and lite-asset-failure scenarios time out) | B; U; `grep -c "includes('intake')" scripts/verify-jg033-preview.mjs` prints 0 and `grep -c "shot-04" scripts/verify-jg033-preview.mjs` prints at least 1; `ls public/images/rl300-shot-0*-poster.png \| wc -l` prints 7; `ls public/images/ \| grep -c -E "^rl300-.*-preview\.png$"` prints 0; `git grep -n -e "rl300-.*-preview\.png" -e "-preview.png" -- src/scene/rl300 scripts/verify-jg033-preview.mjs` prints nothing; a test asserts every `POSTERS` entry resolves to an existing file |
| QM11 | W7 | Close-out docs | `deployment.md`, project brief `:31`, JG-033 plan, `TODO.md` (JG-033 block), `INDEX.md`, evidence index `project/work/evidence/rl300-quiet-machine/README.md`, `qm-commit-gates.md` (QM11 section) | U.1-U.3; docs-only: `git diff --name-only HEAD~1 HEAD \| grep -v -E '^(docs/\|project/\|TODO\.md$)'` prints nothing |

## 5. Seat routing (claude-tiers: agent `tier-worker`; default efforts Haiku high, Sonnet high, Opus medium)
| Commit | Implement seat / effort | Review | Critical (Opus review before done)? |
|---|---|---|---|
| Plan phase (next) | Opus / medium (`tier-worker`, `model:"opus"`) | owner | always (it is a plan) |
| QM0 | Haiku / high | advisor | no (doc tidy) |
| QM1 | Sonnet / high | Opus spawn / medium | YES: the public shell interface the torque track builds on |
| QM2 | Sonnet / high | Opus spawn / medium | YES: fade lifecycle, bfcache |
| QM3 | Sonnet / high | advisor | no |
| QM4 | Sonnet / high | Opus spawn / medium | YES: build config, redirect, `appType`, entry |
| QM5 | Sonnet / high | advisor; owner group A; Astra (packet) | visuals go to the owner and Astra |
| QM6 | Sonnet / high | Opus spawn / medium | YES: it gates the fade |
| QM7 | Sonnet / high | advisor; Astra (packet) | visual |
| QM7b | Sonnet / high | advisor; owner sees the GPU-7 posters; Astra (packet) | visual, so it goes to the owner and Astra |
| QM8 | Sonnet / high | advisor | no |
| QM9 | Sonnet / high (owner does any Blender work) | Opus spawn / medium | YES: stencil/cap passes, risk H |
| QM9b | Sonnet / high (force-add, loader path, `prepareModel.ts` name matching, verifier asset hash/request/route and ruling counts) | Opus spawn / medium | YES: the verifier hard-codes `assertRuling(parts)`, `108 + 24 + removed` and `removedTriangles === 460`, and `prepareModel.ts` matches parts by name, so a new asset can pass the wrong checks |
| QM10 | Haiku / high | advisor | no |
| QM11 | Haiku / high | advisor | no |
| GPU seat | one Sonnet / high `tier-worker` owns every GPU run and the preview server it is granted | reports go to the critical-path reviewer | — |

## 6. GPU and runtime evidence plan
One GPU and one seat across all sessions. The JG-035 session reserves hardware GL, builds, preview and ports 4173/4174/5203/5205. **Before each run, ask the owner to have that session release the GPU and a port. Never assume.** Restart `:4173` after every rebuild (`AGENTS.md:47`). Record the build hash. Viewports: 1440x900, 768x1024, 390x844, plus 390x844-lite for QM.
| Run | After | What | Owner-look artifacts |
|---|---|---|---|
| GPU-1 | QM4 (one grant) | Part 1, base build first: from the base scratch worktree (§1a U.4), serve the `666cbf23` output kept from gate U.4 on the granted port (`npx vite preview --outDir <base-out> --port <granted port>`), and run `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:<granted port>` for the JGUN baseline. N6 is not run: it is confirmed statically, red at base (§0). `verify-jg033-preview` has no flag to run the reduced-motion case alone (it sits after the full 4-viewport loop), and it hashes `dist/index.html` from the cwd, so any run of it against the base build would have to start from the base scratch worktree. `AGENTS.md:49-50` documents this verifier against the Vite dev server on `:5199`; whether it runs cleanly against a preview build is UNVERIFIED, and GPU-1 records it. Part 2, after restarting the server on the same port with the QM4 build: `verify-jg033-preview` at `/quiet-machine/` (4 cases) and `verify-jg033-ribbon-clipping`; QM stop-0 pixel diff vs ev-28 captures (D11); a `/?study=rl300` redirect smoke; dev-server smoke for `appType:'mpa'`; JGUN `--quick --url=…` again on the same port, compared with part 1 (risk 1). Extra cost of the base half: one JGUN `--quick` run, no new build (U.4 already made it), no second grant, one extra server restart inside this grant; no QM verifier run on the base build | none |
| GPU-2 | QM5 | Group A captures | **Group A**: section holds at u .34/.51; 7-shot sheets at 1440x900 and 390x844; forward/reverse MP4; intake close-up; reservoir 1019/1020; chevrons; a forward recording at the proposed length |
| GPU-3 | QM6 | `verify-page-transition` at 1440x900 and 390x844 (Chromium); WebKit/Firefox only if installed, otherwise UNVERIFIED | **Group D (QM half)**: QM-to-`/` fade-out MP4, synthetic arrival into QM MP4, Back MP4, reduced-motion cut |
| GPU-4 | QM7 | `verify-qm-intake-hotspot` at 3 viewports | Intake hotspot PNGs, at rest and open |
| GPU-5 | QM8 | Attribution table for the 1,201k triangles | table only |
| GPU-6 | QM9b if QM9b lands, otherwise QM9 | Device-named p50/p95, desktop GPU plus one phone. Ask the owner for both models first | perf table |
| GPU-7 | QM7b and GPU-6 (so after QM9, and QM9b if it lands); before QM10 | Poster capture: `CAPTURE_POSTERS=1 node scripts/verify-jg033-preview.mjs` against the ruled build; its separate desktop-only poster loop (QM7b) writes the 7 `public/images/rl300-shot-0N-poster.png` files into the GPU seat's worktree. Gate: the run's log lists 7 distinct output paths. QM10 commits them | The 7 poster PNGs, sent to the owner before QM10 |
| GPU-8 | QM10 | Astra packet captures from one build (design §7 row 5, plus the QM-half fade and the intake hotspot) | Astra packet; then **group E** full-size frames plus a live forward/reverse run |

## 7. Owner and Astra rulings → producing commit
| Ruling | Artifact produced by | Blocks |
|---|---|---|
| Group A: QM content (29 §2 items 1, 2, 3, 4, 6) incl. QM scroll length | Shown by QM5 + GPU-2 (+QM7 + GPU-4 for the hotspot); applied by QM7b | QM7b, then GPU-7, QM10, GPU-8 |
| Group B: 2a panel (item 5) | Shown by QM5 + GPU-2. Applied by QM7b if the ruling is the interim dark tone (material only), or by QM9b if it is the owner's Blender split (NEW `public/models/rl300-full.glb`; `msp-enclosure.glb` untouched; QM9b alone swaps the `:58` loader) | GPU-7, QM10, GPU-8 |
| Group D (QM half): fade out of QM, synthetic arrival, Back, reduced-motion cut | QM6 + GPU-3 | GPU-8 |
| **Astra: fade-through-dark** (a visual effect; handoff §2.2) | QM half in the GPU-8 packet. The full JGUN↔QM transition can only be recorded at the torque cutover (open question 3) | "done" status of the fade |
| Astra: intake hotspot, QM visuals since her last verdict (29 §3) | GPU-8 packet: ONE call, MEDIUM, prompt via stdin; proof is an ocx row `openai/gpt-6-astra` 200 | group E |
| Triangle acceptance (handoff §2.5) | QM9 (+QM9b) + GPU-6 (after QM9b if it lands, otherwise after QM9) | GPU-7, launch |
| Poster set (7 PNGs) | GPU-7, committed by QM10 | QM10 |
| Group E: final plan gate | GPU-8 build | publication, which is also blocked until JG-037 ships (handoff §2.4) |
| Group C (JGUN exit without the enclosure) | WITHDRAWN from this track; it belongs to the torque cutover | — |
| Branch hygiene, merge target | owner, §9 | QM1 (first code commit) |

## 8. Not determinable statically → resolution
| Item | Resolved by | Pass / fallback |
|---|---|---|
| Pages: `/quiet-machine` to `/quiet-machine/`; `_redirects` and query strings | Host only (no deploy authorized); recorded UNVERIFIED in `deployment.md` (QM11) | The client-side redirect does not depend on it. Re-check at the first authorized preview deploy |
| JGUN load after the multi-page build (shared vendor chunk) and JGUN CSS (Tailwind: `src/index.css:1` `source("./")` scans all of `src/`, and `:2` `@source "../index.html"` also scans the root `index.html`, so classes in new `src/shared/*.tsx` and QM files, and tokens in QM4's redirect script in `index.html`, reach the CSS JGUN loads. Tailwind also picks up utility-looking words in copy text and comments, which matters for the QM5/QM7 card copy. `quiet-machine/index.html` is not under either source and is not scanned) | Static: gate U.4 at every code commit compares the sha256 of JGUN's concatenated stylesheets and its static-closure module set with the `666cbf23` base. JS chunk names are not compared, because of the `App.tsx:21` lazy QM import. Runtime: GPU-1 `--quick`, base vs QM4 | Expected at QM4: a new shared chunk in JGUN's closure with the same module set. That is a pass, recorded and ruled on by QM4's Opus review. Module set differs, or Opus rejects the partition: first try `build.rollupOptions.output.manualChunks`. A module that both entries need cannot be put back into JGUN's entry chunk without the QM entry importing that chunk, so if `manualChunks` cannot restore the base set, build the QM entry in a separate Vite pass and keep JGUN's build as in the base. That is a plan-phase change to the QM4 `vite.config.ts` design, under Opus review. CSS differs: `src/index.css` is on the does-not-touch list, so rename the offending token in QM or shell code, or in the `index.html` redirect script (an identifier, string or comment word), to a non-utility, prefixed name (`qm-*`, `shell-*`; classes styled in `quiet-machine.css`), or reword the copy or comment that produced it. If that cannot remove the difference, stop and ask the owner |
| `appType:'mpa'` side effects in dev (`/` index, HMR) | GPU-1 dev smoke | Revert to `'spa'` and mark the slashless/404 checks host-only |
| QM look under the entry CSS (D11) | GPU-1 pixel diff at stop 0 vs ev-28 | Any diff means the CSS import order is wrong |
| N6: whether `verify-jg033-preview`'s reduced-motion case is red today | Resolved statically (§0 N6): confirmed red at base. No GPU run records it | QM3 replaces the case |
| Paint-holding / white flash on Safari and Firefox | GPU-3 (Chromium); other engines if installed | Inline `html` background is the mitigation; otherwise UNVERIFIED |
| bfcache Back to QM: live canvas, tier kept (`QuietMachinePreview.tsx:54`) | GPU-3 Back test | If QM drops to poster on Back, record it and raise it with the owner; no silent patch |
| QM fade release time (`onReady` vs the 2.5 s cap) | GPU-3 time-to-release at 3 viewports | Cap decides if it is over 2.5 s; report the number |
| JGUN-side fade: ready flag, Lenis re-sync on Back (`ScrollRig.tsx:69-79`), phone memory with JGUN in bfcache | Torque cutover | Not this track |
| Per-pass split of the 1,201k triangles | QM8 + GPU-5 | Decides QM9's branch (caps vs base geometry) |
| Desktop GPU and phone models | Ask the owner before GPU-6 | No p95 claim without a named device |
| Whether Vite's config bundler resolves `./src/shared/pages` | QM4 `npm run build` | Literal input map plus an equality test |

## 9. Open questions for the owner
1. **Branch hygiene (decide before QM1).** Facts: `quiet-machine/integration` and `torque-wrench/rebuild` both sit at `666cbf23` (= `eb550958` + 1 docs commit). The JG-035 line `codex/jg033-signature-shot` is at `eb550958` (0 commits ahead today). A second local branch, `codex/jg035-final-acceptance-2026-10-09`, is also at `eb550958` and has no remote copy (read from `git branch -a` in `jgun-portfolio` while the review fixes were applied). Which one is "the JG-035 line" for options (a) and (c) and for open question 2? It does not matter today, because both are at the same commit. It matters once either one moves. Options:
   - (a) Keep `quiet-machine/integration`. Land QM1-QM4 first as "shell v1"; the torque branch merges that commit when it starts implementing; rebase onto the JG-035 tip before QM1 if it has moved.
   - (b) Cut a separate `page-shell/v1` branch from `666cbf23` for QM1, QM2 and the shell half of QM4; merge it into both tracks. QM product work stays on `integration`. Clearer ownership, but more merges, and QM4 has to be split.
   - (c) Rebase both new branches onto the JG-035 tip each time it moves, and merge QM into the JG-035 line commit by commit. Freshest base, but the most rebase churn while JG-035 is active.
   - Recommendation: (a), for the fewest merges with shell v1 still consumable early. Not decided here.
2. **Merge target.** `main` (`420198a0`) is 26 commits behind the JG-035 line and 27 behind this branch. Merge QM into `codex/jg033-signature-shot` (recommended: that is where page work lives), or into `main` after it catches up? No push or PR either way without your say.
3. **Astra and the fade.** In this track only the QM half exists. (a) Put the QM half in the single GPU-8 packet, then make a second Astra call for the full JGUN↔QM transition at cutover; that call needs your consent (recommended). (b) Hold the whole fade ruling until cutover.
4. **Fade receiver on `/` before cutover?** Adding the inline head block to `index.html` early would let the QM-to-JGUN arrival fade in, but it changes the torque wrench page. Default: no.
5. **Station 2 / M249 deep links.** `?station=2|enclosure|safe-enclosure` and `?chapter=2` still land in Station 2 until cutover; `?station=3|m249` and `?chapter=3` stay until JG-037. Confirm the default (deferred, status `cutover` / `jg-037` in the table).
6. **Extensibility for QM.** `SHOTS` are already on a length-independent axis, but inserting a shot rescales its neighbours (N4). Default: keep them as they are at launch (it does not disturb your pending group A rulings). Alternative: author shots as duration weights so a shot can be appended without touching the others.
7. **GPU windows.** When can the JG-035 session release the GPU and `:4173` for GPU-1? Who asks it: you, or a message in its worktree?
8. **TODO.md / INDEX.md.** Default: the QM track edits them once, at QM11, JG-033 block only. Alternative: leave both to the JG-035 session and write status only in the JG-033 plan.
