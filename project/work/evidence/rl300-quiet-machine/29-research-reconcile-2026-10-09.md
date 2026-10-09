# 29 - JG-033 / JG-032 reconciliation (research only, 2026-10-09)

Method: git log, file greps, line reads, evidence files. Nothing built or run (no tests, no GPU, no servers). Branch `quiet-machine/integration`; last RL300 source commit `f4263f6` (2026-09-25); nothing under `src/scene/rl300` changed since. Test counts below are a static count of `it(` lines in `src/scene/rl300/preview.test.ts` = 25 via the Grep tool (the spec's literal `grep -c "it(\|test("` printed 0 in this shell - escaping mangled - so 25 is the counted figure; it matches "25/25" in evidence 28); suite-wide 100/100 (10 files) is the last number recorded, in evidence 26. Not re-run today.
Cross-cutting fact: `src/scene/rl300` is imported only by `src/App.tsx:30` (`?study=rl300`). `Station2_AcousticEnclosure.tsx` was last touched by `d201ea8` (JG-032, 2026-09-08). The main page therefore still runs JG-032's Station 2; JG-033 exists only as a standalone study page with its own scroll (`QuietMachinePreview.tsx:36`).

Stray untracked files `1.43`)`, `sum`, `that` (0 bytes, created 03:19 today) appeared in the repo root during this session; not created by this task (no redirects used). Left in place.

## 1. Status of items a-l
| # | Item | Status | Evidence |
|---|---|---|---|
| a | Enclosure / cross-section presentation + geometry review | PARTIAL | Built: `77ddef7`/`1d04d35` (stencil caps, blue shell). Ruling 2026-09-11 "look ACCEPTED, geometry REJECTED" -> fixes in ev 06 (PART_POLICY); owner re-review PENDING per TODO:52 / INDEX:30 and no later evidence records acceptance. Later owner material rulings landed: reservoirs yellow (`698158c`), SIF insulation blue (`9d7fe6e`), real pump (`15fd488`, ev 26). Open: 2a control-panel blacks (needs owner Blender split, ev 26 "Planned"); reservoir 1019 sectioned vs 1020 whole (ev 26 follow-up options). |
| b | Correct documented airflow entry path | DONE | `a4f1fdd` (2026-09-23) rebuilt `SPINES.main` to the owner entry + mid-path rulings. Test `preview.test.ts:273` (entry band) and `:339` (hairpin/descent). Ev 20 executed, ev 21: "main-route repair PASSES", owner-approved segments accepted, pushed (ev 22 sec 1). TODO:48 still lists it as NEXT. |
| c | Complete seven-shot sequence | PARTIAL | Camera authored: `df122b1`, `shot.ts:23` `SHOTS` (7), test `preview.test.ts:35`. Owner visual ruling on the sequence PENDING since 2026-09-15 (ev 09 line 3; no later ruling found). Stop-04 camera changed after that ruling request (`shot.ts:54`, `f4263f6`; "pending Astra", ev 28). Study-only; not in the real scroll page. Poster fallback still maps 7 beats onto 3 captured posters (ev 09 "Not done"). |
| d | Lower intake / duct | PARTIAL (built, owner-driven; Astra-uncleared) | Duct: `fe8ca64` (DUCT_INTAKE_AIRWAY rebuild, owner-spec). Lower bundle through louvers + merged join: `6516aee`, owner-approved on contact sheet (ev 23 STATUS). Owner intake move + 4 louvers + live clip + stop-04 camera: `e52c971`, `f4263f6` (`LowerIntake.tsx:13` offset (0,.205,.03); `preview.test.ts:397`). Ev 28 "NOT done": no adversarial review, no contact sheet for the first move; the follow-up was checked only in the author's browser at 1600x1000. Astra re-clear never run after this. |
| e | Engineering story (plan Milestone 4) | PARTIAL (core built) | Airflow/heat ribbons `d09ef93` (`AirRibbons.tsx` 653 lines, `flow.ts` SPINES `:17`), both supplies + merge `6516aee`, acoustic beat `ca0844e` (test `:476`, owner-approved on contact sheet, ev 25). Not done: Astra rank 4 heat-colour continuity through both joins, rank 5 closing-beat/"Resolve" check (ev 21); radiator-fan visual treatment (unowned, ev 13 sec 4); optional exhaust heat distortion NOT implemented (0 hits for distort|haze|refract in `src/scene/rl300`; optional per plan). TODO:50 calls Milestone 4 "documented but unimplemented" - false for the study. |
| f | Mobile checks | PARTIAL / OPEN | Last full run of `verify-jg033-preview.mjs` over 1440x900, 768x1024, 390x844, 390x844-lite was `df122b1` (ev 09, 28 captures, 0 errors). Script last edited `fe8ca64`; ev 15 reports "preview exit 0 / 0 errors". Since then: spines, acoustic beat, pump, intake move, stop-04 camera - no recorded multi-viewport rerun. Portrait pull-back x1.22 is the only mobile composition (`preview.test.ts:69`); plan step 5 wants separately authored mobile shots. No real phone device ever measured (ev 13:156 carries it forward). Script line 6 still defaults to a hardcoded npx-cache Playwright path (env `PLAYWRIGHT_MODULE` overrides); `playwright` is a devDependency (`package.json:36`) but the script does not import it. |
| g | Performance checks | PARTIAL; triangle budget exceeded | Draw calls 99-102 (ev 25) and 105-106 (ev 26) vs 150 budget: OK. Triangles 1,201k at full tier (ev 26) vs provisional ~500k: over by ~2.4x. Lite: 56-57 draws, p95 17.2-17.8 ms recorded at `df122b1` only (pre-ribbons); lite asset 245,092 tris (ev 15) vs 250k. No phone, no post-ribbon p95 recorded in what was read. Plan target 60 fps desktop / 30 fps phone unmeasured on a device. |
| h | Interaction checks | OPEN | No inspection, hotspot, keyboard-focus or touch-inspection code in `src/scene/rl300` (grep: only a range scrubber + 3 view buttons in `QuietMachinePreview.tsx`; `HOTSPOT` in `AirRibbons.tsx:25` is the heat origin). Exists and passed at `df122b1`: reverse pixel-identical, poster / reduced-motion / context-loss / asset-failure fallbacks (ev 09). Not documented: direct navigation, reload at depth, resize, hidden-tab resume. `App.tsx:27-30`: by owner decision 2026-10-06 ("posters throughout") reduced-motion visitors never reach the study, so the study's own reduced-motion branch is unreachable from the app (ev 09's reduced-motion pass predates that decision). |
| i | Scroll extension, chapter/HUD sync, JGUN timing corrections | OPEN | No work. `stageWindows.ts` / `caseStudies.ts` / `SpatialWorld.tsx` / `CameraRig.tsx` commits since 2026-09-10 are all JG-035 (`d5e13c7`, `7e91899`, `9656ab8`, `9cfab45`) or a characterization test (`4f6f619`). No extension record, no consumer corrections. Prep-pack consumer census exists (ev 02: 159 rows, 71 normalized-global). New dependency: JG-035 changed the opening scroll share (`INTRO_SCROLL_SHARE` .50, derived `scrollTracks.ts`, TODO:33), so any RL300 extension must be measured against that, not the 2026-09 numbers. |
| j | Reconcile JG-032 implementation with JG-033 choreography | OPEN | Main page still runs JG-032 (airflow 12,000-particle field, 6/5 rings, recolor allow-list, cross-section clip). JG-033 supersedes it by owner ruling (plan front-matter) but nothing was migrated or removed. JG-032 plan front-matter `commits:` omits `d201ea8` (rev2). Requires the main-page integration decision (see sec 5). |
| k | Update obsolete verification expectations | OPEN / UNVERIFIED | `verify-jg032-station2-thermal.mjs` (last edit `fe8ca64`) still gates "yellow unchanged" (`:437-444`, #ffc500) and the A/B census vs `477c9c3`; valid for the main page today, obsolete the moment JG-033 replaces it. The stale panel-lift assertion cited at TODO:56 is already fixed: introduced by `1d04d35` (2026-09-14, `git log -S`), `:511` asserts panelPosition y 0.05 (stationary panels), `:490-535` is a cross-section contract; airway AABB expects y 1.348 (`:~462`, `fe8ca64`). Timeout at `__drawingProof.ready` (`:98`) was observed 2026-09-22 only. JG-034 fix landed `9656ab8` (INDEX:29: 6/6 cold loads at 3 viewports; `DrawingLinework.tsx:67` "viewport-independent"). API drift checked statically: `DrawingLinework.tsx` still sets `ready: true` (`:477`), `setTier` (`:491`), `scrollToProgress` (`:513`) and `telemetry.drawing.annotationsReady` (`:473`), so those names the script waits on still exist; script not re-run since, so whether it now passes is unknown. "Blocked by JG-034" is stale-or-unproven, not confirmed. |
| l | Visual acceptance of retained work | OPEN | JG-032 owner visual ruling PENDING since 2026-09-08 (ev JG-032 line 5/70; suggested stops: CH.03 cutaway hold p~0.65, JGUN explode, LCD dwell). The enclosure part is superseded by JG-033; the retained JGUN polish (progress-gated spot/rim/explode shadow, grain, registration crosses) has no owner ruling. |

## 2. Pending OWNER rulings (artifact to look at)
1. Milestone 2 geometry re-review (3 missing parts, 7 hidden-after-cut, both `V2SKF-TB-5500-03` sectioned): live `?study=rl300`, section hold u .34 and .51; criteria in `06-ruling-geometry-fixes.md`.
2. Seven-shot sequence: live `?study=rl300`, scrub u 0->1 forward and reverse; copy in `shot.ts` `SHOTS`. Note stop 04 differs from what ev 09 asked him to rule on.
3. Lower intake as committed (`f4263f6`): `?study=rl300` "Lower intake" stop (u .51): 4 louvers, intake at (0,.205,.03), clipped with the assembly. Ev 28 records his asks, not a ruling on the result.
4. Reservoir options (ev 26): make 1019 `keep` to match 1020; tone reservoir yellow down if too loud against the airflow.
5. 2a control panel: needs HIS Blender split (shell / screen riser / key switch / screen) and re-export; or an interim whole-panel dark tone in code.
6. Chevron isolation response visibility (ev 25 sec 4, "owner's call").
7. Final plan gate: full-size exterior / section / thermal / acoustic frames plus a live forward/reverse run from one identified build ("strongest part of the site").
8. JG-032 visual ruling (row l): CH.03 cutaway p~0.65, JGUN explode, LCD dwell on the main page; or an explicit decision to retire JG-032 in favour of JG-033.
9. Enclosure / M249 page separation - "awaits owner clarification" (TODO:33).
10. JG-034 close ("awaiting the owner's next look", INDEX:29); TODO:42 is still `[ ]`.

## 3. Pending ASTRA (gpt-6-astra, codex surface) approvals
1. Re-clear packet, ONE call, MEDIUM effort only (owner cap: ev 24 status, ev 25 step 4, ev 27:68; ev 22 sec 3 still says `high` and is superseded on this point). Her missing-evidence list: close view of louver traversal + repaired join; acoustic-interaction evidence; short forward/reverse frame strip through hairpin + merge (video or strip, not stills); terminal closure state. Prompt via stdin when `-i` is used; proof = ocx log row `openai/gpt-6-astra` 200.
2. Visual changes made after her last verdict (ev 21, 2026-09-24 ~01:05), not shown to her: stop-04 camera (ev 28 "pending Astra per the standing rule"), 4-louver intake and its (0,.205,.03) move, pump swap (`15fd488`), reservoir/SIF colour rulings (`698158c`, `9d7fe6e`).
3. Acoustic beat: her concept review (ev 24) and code review ("fix-first", ev 25) are on record; closure of her two findings was proven by the architect with her instrument, NOT by a fresh Astra verdict.
4. Verification-sized items she ranked 4 and 5: heat-colour continuity through both joins; closing beat vs "Resolve".
Standing rule: no visual effect is "done" until Astra rules (ev 13 sec 4; ev 21 disposition).

## 3b. Decisions marked unowned / deferred
- Radiator-fan visual treatment (ev 13:146, 14:139 "unowned decision", 17:45, 18:92, 20:119). No named nodes exist for fan / radiator / rear panel (ev 13:149).
- v4 node-rename pass (7 roots; may re-commit `msp-enclosure.glb`): deferred in ev 14/17/18/20/22.
- Main-page integration of the study (ev 22 sec 6): queued, no owner decision on when or how.

## 4. Contradictions: TODO.md vs code / git
| TODO.md | Reality |
|---|---|
| :48 entry-path fix "NEXT, before routing Astra" | Landed `a4f1fdd` 2026-09-23; Astra routed 2026-09-24 (ev 21); test `preview.test.ts:273`. |
| :50 Milestone 4 "documented but unimplemented"; study "shows no air at all" | Ribbon beat `d09ef93`, lower bundle `6516aee`, acoustic beat `ca0844e` all in the study. |
| :48 gates "87/87 tests"; :49 "88/88" | Latest recorded: rl300 25/25, suite 100/100 (ev 26). |
| :48-:49 omit the lower bundle, acoustic beat, material rulings, pump, intake move, 4 louvers, Astra verdict ev 21 | All committed 2026-09-24/25 (`6516aee` `ca0844e` `698158c` `9d7fe6e` `15fd488` `e52c971` `f4263f6`). INDEX:30 mentions only the intake move. |
| :49, :56(2) verify-jg032 "RED at :462 on panelY~0.55" | Fixed in `1d04d35` (2026-09-14): source asserts panel y 0.05 / cross-section contract (`:511`, `:490-535`); line 462 is the airway AABB block. |
| :49 verify-jg032 "blocked by JG-034" and :42 JG-034 open | JG-034 fix in `9656ab8` (INDEX:29; TODO:27 says "JG-034 fixed"). Not re-verified against the script. |
| :51 seven-shot ruling pending | Still pending, but shot 04 changed afterwards (`f4263f6`). |
| :52 M2 re-review PENDING | No later evidence of acceptance or rejection. |
| :55 "Start at Milestone 2" | Milestones 2 and most of 4 are built. |
| JG-032 plan front-matter `commits:` | Missing `d201ea8`. |
Consistent: TODO:45 and :48 that the main-page Station 2 is pre-JG-033 (true, see cross-cutting fact).

## 5. Remaining work, dependency order (S <1 session, M 1-3, L multi-session)
1. S - Owner decisions that gate scope: integrate JG-033 into the main page vs keep study-only; retire/fold JG-032; M249 separation (sec 2 items 8-9).
2. S - TODO.md / INDEX.md refresh to the facts in sec 4 (docs only; not done here).
3. S - Re-run `verify-jg032-station2-thermal.mjs` on a fresh :4173 to learn if JG-034's fix unblocked it (GPU; owner/lane call).
4. M - Assemble the Astra re-clear packet: fresh captures at six stops + louver close-up + forward/reverse strip + closure frame; include stop-04 and 4-louver changes; heat-continuity and closure checks (row e).
5. S - Owner looks on the committed study (sec 2 items 1-4, 6); small owner Blender tasks (2a split).
6. M - Radiator-fan decision then treatment; reservoir 1019/1020 call; v4 node-rename (only if the fan needs nodes).
7. L - Milestone 3 leftovers (row i): shared narrative-progress source, scroll extension record, chapter/HUD sync, JGUN timing corrections; re-measure against JG-035's `scrollTracks.ts`.
8. L - Main-page integration (replace Station 2 enclosure path; migrate `AirflowField.tsx`/`airflowRoute.ts`/`recolorAllowList.ts`); then M - rewrite JG-032 verifier expectations and retire its yellow-unchanged gate (rows j, k).
9. M - Milestone 5: inspection / keyboard / touch interaction, focus + contrast, separately authored mobile shots, 3 missing posters (rows f, h).
10. M - Milestone 6: multi-viewport rerun (set `PLAYWRIGHT_MODULE` or import the devDependency in `verify-jg033-preview.mjs`), triangle budget (1.2M vs ~500k), device-named perf incl. a phone, JGUN regression proof, owner final gate (rows f, g).
