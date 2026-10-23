# Refactoring assessment — jgun-portfolio (2026-10-08, read-only review)

**Status: proposal only — no JG-ID assigned, nothing implemented, nothing committed.**

Reviewed branch: `codex/jg033-signature-shot`, HEAD `6cca1b0` (confirmed this session: `git rev-parse --abbrev-ref HEAD` and `git log --oneline -1`). Inputs: four read-only surveys (architecture, quality, performance, constraints/rules), each finding independently re-verified on this branch — their verification notes are cited throughout as "verification note" — plus the writer's own spot-checks listed in §7. **No builds, tests, dev servers, or browser sessions were run for this review** (read-only constraint; other builds were running on this machine). Everything here is static reading, git/grep checks, and recorded logs.

---

## 1. Verdict and executive summary

**A refactor is worth it — but most of it is not worth it *yet*.** The codebase is unusually hygienic for its age: zero TODO/FIXME/HACK comments in `src/` and `scripts/`, every TS suppression documented and clustered on window telemetry globals, and most shared constants already single-sourced (quality survey). The real debt is structural and concentrated in five places (F1–F5) plus four quick fixes (Q1–Q4) — and roughly half of that territory sits inside the **open JG-035 verification envelope**: owner visual acceptance OPEN (TODO.md:5, read this session) and the inherited G6 desktop-full tier drop unestablished (TODO.md:7, read this session: "desktop-full fails 110 expectations after the effective tier becomes lite — cause unestablished, no waiver"). The handwriting redo once directed "before anything else" (TODO.md:185) is **done, not queued**: TODO.md:3 (newest banner, read this session) records the rejected lettering replaced by the screenshot-derived Ac Fast Reference font with the owner accepting the font direction, and the committed evidence tree `project/work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/` (tracked at HEAD — checked this session via `git ls-files`) plus `DRAWING_CACHE_VERSION = 8` (`drawingCache.ts:7`) carry the completed rerun; TODO.md:185 is the stale record (details in §5.2; the same trap §5.4 documents for R3). Structural churn inside the envelope now would still collide with in-flight work (R1) — what remains open is exactly TODO.md:3's closing sentence: full owner-animation verification and inherited G6 are **not** closed by the font approval.

**Phasing verdict:**

- **Safe now, while JG-035 verification builds run:** F1 (`nodeRoles.ts` regex ladder → ordered table — the file has no JG-035-era commits), Q2 (hero GLB preload hint), Q3 (move `@higgsfield/client` to devDependencies), and the R2 remediation (make the JG-028 verifier import the canonical `EXPLODE_OFFSETS` instead of a hardcoded `-0.354`).
- **Sequenced behind JG-035 close:** F2 (CameraRig snapshot field-spec — coordinate at close), F4 (state-layer inversion), F3 (DrawingLinework god-module split), F5 (shared annotation primitives), Q1 (delete the ~6.11 MB dead v1 precompute), and the `scene/drawing/**` portions of Q4.

Headline facts (verified except where marked survey-attested; per-finding evidence in §3–§4): an 867-line `DrawingLinework.tsx` god module; a 450-line `buildWrenchRig` with a ~13-branch regex-to-unit-key ladder; ~6.11 MB of dead shipped asset in `public/drawing/` (sizes re-confirmed this session via `ls`); **no preload hint for the 10.67 MB hero** (confirmed this session by reading `index.html`); *survey-attested only, not re-verified* (§6.12): ~14.24 MB of total GLB fetches firing at canvas mount — the three underlying sizes (10,671,700 + 2,671,600 + 892,092 B, summing to 14,235,392 B) were re-confirmed this session via `ls -la public/models`, but the mount-time fetch behavior itself is survey evidence; and the explode-ladder constant `-0.354` copied in six-plus places, one of them executable verifier logic (R2).

---

## 2. Current architecture in brief

Grounded in the architecture survey plus verification notes:

- **Stack:** Vite + React + React-Three-Fiber/three.js (three 0.185.1, drei 10.7.8, fiber 9.7.0, postprocessing 6.39.4 — clean tree, no duplicated ecosystem packages; package.json read this session). `src/` totals ~33k lines, with density concentrated in two JG-035-owned subsystems: `src/scene/drawing/` (39 files, 11,519 lines — the drafting-sheet intro) and `src/scene/inspection/shaft/` (22 files, 6,707 lines, ~90% of the inspection subsystem's 7,480).
- **Layering is otherwise disciplined** and matches the README Repository Map; DOM→scene imports are documented data/constant couplings. The one real inversion is in the state layer (F4): `src/state/scrollStore.ts:4` value-imports `rawScrollFor` from `../scene/drawing/introTimeline` (confirmed this session by grep — value uses at :58 and :130, :86 is a comment mention), and `src/state/inspectionStore.ts:4-5` value-imports `scene/inspection/story` + `session` — while 15 scene modules import `scrollStore` and 8 non-test scene modules import `inspectionStore`. Cycle-free today, one import away; the hazard is self-acknowledged in-repo (`electricalScore.ts:1`: "Local copies: introTimeline imports this module, so importing back would create a cycle.").
- **Some duplication is deliberate and protected:** the rl300 study vs `stages/` Station 2 airflow implementations (~2,131 vs ~2,246 lines) are documented owner-review isolation with zero cross-imports — do not merge (parked, §6).
- **Load path:** tiered at chunk level (App lazy-loads five bundles; the poster tier fetches nothing), but — *survey-attested, not re-verified* (§6.12) — canvas mount fires ~14.24 MB of GLB fetches at once (the three underlying file sizes were re-confirmed this session via `ls -la public/models`), while `index.html` verifiably has zero preload hints (Q2; confirmed this session by reading index.html in full and by grep).
- **Frame-loop hygiene is strong** — memoized materials, module-scratch vectors — with one concrete per-frame cost noted as a parked observation (DrawingProofRenderer's captureKey string joins, §6.14).
- **Rule density is high:** two absolute GLB regeneration bans, a same-commit explode-ladder table-sync rule, part-number (never stage-name) keying, and telemetry-not-vision verification (§5).

---

## 3. Ranked refactoring recommendations

Ranked in recommended execution order. Effort: **S** = hours, **M** = days, **L** = week-scale. No recommendation requires regenerating protected GLBs or touching `.scratch/` or the orzo roadmap.

**Common verification gates** (apply to every item; from AGENTS.md:45-51, `project/context/constraints.md:9-11`, TODO.md:29 — R4):
`npm run typecheck` → `npm test` → `npm run build` → `node scripts/check-station2-contract.mjs` → **restart the :4173 preview** (stale server + rotated hashes → canvas never mounts) → `node scripts/verify-jgun-opening.mjs --url=http://localhost:5199 --quick` for iteration; the full 6-case roster is "done" evidence only. Scene claims are proven with runtime telemetry, never vision alone. (All named scripts confirmed tracked this session via `git ls-files`; `typecheck`/`test`/`build` confirmed in package.json:9,11,12.)

### 3.1 F1 — `nodeRoles.ts` regex if-ladder → ordered data table — **do now**

- **What/where:** `src/scene/rig/nodeRoles.ts:191-640` — `buildWrenchRig` spans ~450 lines; the nested `root.traverse` (223-315) contains the regex-to-unit-key ladder: STAGE_DEFS planet loop (225-244), then HOUSING_PART_RE (245), OUTPUT_PART_RE (249), BEARING_RE (253), RING_SWITCH_RE (257), CLUTCH_SLIDING_RE (261), CLUTCH_STATIC_RE (265), LCD_SCREEN_RE (269), LCD_BUTTONS_RE (273), LCD_HOUSING_RE (286), GB_FASTENER_RE + handle-ancestor guard (298), FASTENER_RE (305), STAGE_DEFS cage/assembly loop (309-314) — 13 structural branches, 9 of them near-identical 4-line blocks, 2 carrying extra guards.
- **Evidence:** finding F1 + verification note (direct read of lines 180-640; nesting depth 7 at :234 reproduced; branch inventory as listed). Writer spot-check this session: `git grep -n "buildWrenchRig" -- src/scene/rig/nodeRoles.ts` → `191:export function buildWrenchRig(root: Object3D): WrenchRig {`. Currency: the verification note's `git log --oneline -6 -- src/scene/rig/nodeRoles.ts` shows the last commit touching the file is `9b6444e` (JG-029) — no JG-035-era commits, so no deferral gate.
- **Why it helps:** the ladder is the rig's role-assignment core; every new part category adds another hand-copied block. A table makes the ordering — which is semantic, not incidental — explicit and inspectable instead of implicit in if-order.
- **Proposed approach:** extract an ordered `[matcher, unitKey, handler]` table preserving source sequence; the two guard-carrying branches (lcd-button occurrence skip; gb-fastener handle-ancestor + occurrence skip) become named handler functions carrying their guards. The comment at :290 ("Gearbox bolts BEFORE the handle-fastener rule") becomes a documented table-order invariant. **Part-number regexes (:48-90) stay byte-identical** — part numbers are the stable key (AGENTS.md hard rule, §5.2). Honest sizing from the verification note: the ladder region is ~91 lines (224-314), so the scoped table saves ~50-70 lines; the original finding's "~150 lines collapsed" only lands if the group-allocation block (372-377) and `groupsByKey` population (414-435) are also table-driven — a worthwhile optional second step.
- **Effort:** M (S for the scoped ladder-only version). **Risk:** medium-low — the code is scene-behavior-critical; a faithful table refactor should be behavior-neutral, but the verification note's requirement stands: runtime A/B census/telemetry before/after, not vision.
- **Sequencing:** none — safe now.
- **Verify when executed:** common gates, plus a before/after census — dump node-role assignment counts via the repo's telemetry globals with old and new code and diff them; any drift is a stop.

### 3.2 F2 — CameraRig shared snapshot field-spec — at JG-035 close, coordinated

- **What/where:** `src/scene/CameraRig.tsx:163-599` — a 437-line component (file is 600 lines; confirmed this session by line count) whose single `useFrame` (:192) hand-rolls the inspection-camera save/observe/restore state machine (save 195-206, observe 226-238, restore 239-252). The PerspectiveCamera property list (`fov, near, far, zoom, aspect, focus, filmGauge, filmOffset, view`) is enumerated three separate times — save :202-204, error-sum :234 (same minus `view`), restore :243-245.
- **Evidence:** finding F2 + verification note (full-file read; ranges confirmed with ≤7-line drift vs the original finding; nesting depth 6 at :471). Currency: last 3 commits on the file are JG-035 (`7e91899`, `d5e13c7`, `9656ab8`).
- **Why it helps:** adding a field to one list and not the others silently breaks exit-restore — a latent bug factory in exactly the camera code whose restore-error telemetry JG-035's checkpoint verification asserts on.
- **Proposed approach:** one `SNAPSHOT_FIELDS` spec (property name + flags, e.g. `view` excluded from the error sum) driving all three loops via small helpers; telemetry emission stays byte-identical.
- **Effort:** S. **Risk:** low (behavior-preserving), but the file is inside the active JG-035 thread — an uncoordinated edit collides with it.
- **Sequencing:** gate on JG-035 coordination/closure (the finding's own recommendation; verification note concurs).
- **Verify when executed:** common gates + telemetry asserting inspection-camera exit-restore (the restore-error path).

### 3.3 F4 — neutral layer for state↔scene shared constants/samplers — after JG-035 closes

- **What/where:** `src/state/scrollStore.ts:4` value-imports `rawScrollFor` from `../scene/drawing/introTimeline` (value uses :58, :130); `src/state/inspectionStore.ts:4-5` value-imports `getStory`/`ringStory`/`storyChapterAt` + `createStorySession`, with `ringStory` consumed at module top level (:9, :14, :27) — runtime value dependencies, not type-only. Reverse direction: 15 scene modules import `state/scrollStore`, 8 non-test scene modules import `inspectionStore`. No live cycle today (far side: `introTimeline.ts` imports only `./electricalScore` :68; `story.ts:2` ↔ `session.ts:1` exchange type-only imports) — one import away from one.
- **Evidence:** finding F4 + verification note (all greps re-run on this branch). Writer spot-check this session: `git grep -n "rawScrollFor" -- src/state/scrollStore.ts` → hits at :4, :58, :86 (comment), :130 — matching the note exactly.
- **Why it helps:** removes the one real layering inversion; makes the state layer importable by scene code without module-initialization-order traps.
- **Proposed approach:** move the shared constants/samplers (`rawScrollFor`'s underlying math; the story-session values/types) into a neutral leaf layer (e.g. `src/shared/` or domain modules with no scene imports) that both state and scene import. Target end state: `git grep "from '../scene" -- src/state` returns nothing.
- **Effort:** M. **Risk:** low (typecheck catches breaks) — but `introTimeline.ts` sits in `scene/drawing/` and `story`/`session` in `scene/inspection/`, both JG-035 territory: strictly after close.
- **Verify when executed:** common gates + record the grep assertion above in the change description; `--quick` opening pass (scroll behavior is the affected surface).

### 3.4 F3 — DrawingLinework bake-orchestration / frame-render split — after JG-035 closes

- **What/where:** `src/scene/drawing/DrawingLinework.tsx` — 867 lines (confirmed this session by line count), second-largest non-generated file in `src/`; imports 15 intra-system modules (:19-59) plus the two stores. `DrawingPrint` alone spans 337-867 (~531 lines). One component orchestrates cache baking (useLayoutEffect :283-291 — prepareDrawingCache, composeSheet, bakeProfile, makeBreakthroughGeometry), inline uniform assembly (:295-303), quality fallback (:300, :328, :492), scroll state (:506, :651, :679), lightning (:419), portal (:434, :530), ink (:304-305), paper (:299, :855).
- **Evidence:** finding F3 + verification note (all line numbers re-measured; import block enumerated). TODO.md:5 (read this session) records owner visual acceptance OPEN.
- **Why it helps:** the finding calls it "the highest-value structural cut in the subsystem" — the god module forces every sheet change to cross-cut concerns.
- **Proposed approach:** split bake orchestration (one-time cache prep) from frame rendering (per-frame consumers); move uniform assembly out of the component into the sheet module; `DrawingPrint` becomes the inner cut.
- **Effort:** L. **Risk:** medium — the subsystem's visuals are exactly what the owner has not yet accepted; any behavior drift invalidates pending acceptance work.
- **Sequencing:** strictly after JG-035 close (R1); never while owner visual acceptance is OPEN.
- **Verify when executed:** common gates with the **full 6-case roster** as done-evidence, plus sheet-render telemetry; treat any visual diff as a failure.

### 3.5 F5 — shared annotation primitives (font/anchor/projection) — after JG-035 Track B closes

- **What/where:** three anchor→screen annotation engines coexist — Hotspots `Html` badges for CH.03/04 (`src/scene/Hotspots.tsx`, 569 lines — confirmed this session; badge-collision registry :14-23), the stations projection pipeline for CH.01/02 (`src/scene/stations/StationDriver.tsx`), and sheet lettering (`sheet/sheetText.ts`). They share primitives only via deep cross-subsystem imports: `StationDriver.tsx:8` imports `SHEET_FONTS` from `../drawing/sheet/sheetText` (consumed :118); `Hotspots.tsx:6` imports `GdtSymbol` (with `characteristicKey`) from `../components/GdtSymbols` — the only scene→DOM-component import in `src/` (verification-note grep).
- **Evidence:** finding F5 + verification note (all greps re-run; README.md:148 documents "CH.01/02 hotspot rendering replaced by the stations"). Writer spot-checks this session: `git grep -n "SHEET_FONTS" -- src/scene/stations/StationDriver.tsx` → :8 (and use at :118); `git grep -n "GdtSymbol" -- src/scene/Hotspots.tsx` → :6 (uses at :125).
- **Why it helps:** removes the entanglement so each engine can evolve (or retire) independently; eliminates the lone scene→components/ import.
- **Proposed approach:** extract shared font/anchor/projection primitives into a neutral annotation module; keep all three engines' rendered output identical.
- **Effort:** M. **Risk:** medium (three engines, visual parity required). **Sequencing:** after JG-035 Track B closes — `sheetText.ts` and `StationDriver.tsx` are in-flight-owned, and `Hotspots.tsx:519` carries a JG-035 note too.
- **Verify when executed:** common gates + station2 contract check + opening verifier (hotspot/lettering placement is telemetry-checkable).

---

## 4. Quick fixes

Each under an hour, low risk. Do-now items first; gated items clearly marked.

### 4.1 Q2 — preload hint for the 10.67 MB hero model — **do now**

- **Exact file/change:** `index.html` — add one line in `<head>`: `<link rel="preload" as="fetch" crossorigin href="/models/Default.glb">`. Today the GLB fetch starts only when the lazy SceneCanvas chunk evaluates `useGLTF.preload` (`TorqueWrenchHero.tsx:472`, behind `App.tsx:14`'s lazy import) — i.e., after the main bundle (251.90 kB) + SceneCanvas chunk (418.68 kB raw, recorded build logs) download and parse. The hint starts the dominant download at HTML parse; same URL, same cache; `crossorigin` matches three.js FileLoader's CORS-mode fetch (per Q2 verification note).
- **Evidence:** finding Q2 + verification note; writer spot-checks this session: read `index.html` in full (40 lines — only `rel=icon` :5 and `rel=canonical` :12; zero preload tags) and `git grep -n "preload" -- index.html` → no matches.
- **Scope decision — RESOLVED in this document:** poster-tier/reduced-motion visitors intentionally never fetch the GLB (`App.tsx:40`, read this session: `canvasActive = tier !== 'poster' && !reducedMotion`, with the :34-37 comment "the lazy canvas chunk is never imported, so nothing three- or CAD-bound downloads"). An unconditional HTML preload downloads 10.67 MB for that cohort too — zero JS-behavior risk, a real network-profile change. **Recommendation: ship the unconditional one-liner and record the accepted cost.** Rationale: the quality tier is a runtime decision (the qualityStore ladder) that cannot be known at HTML-parse time, so a preload hint cannot be fully scoped to canvas-active visitors; the only parse-time signal available is `prefers-reduced-motion`, and an inline `<head>` script gating on it would cover only the reduced-motion half of the cohort while adding inline script to the critical path. Fallback if the owner vetoes the poster-cohort cost: the reduced-motion-gated inline `<head>` variant. Carried as a recorded owner decision in the §5.3 gate table.
- **Verification step:** network waterfall via the opening-verifier protocol (telemetry, never vision alone); confirm exactly one GLB fetch (hint + loader hitting the same cache entry). Cache-match semantics were not runtime-verified in this review (§7).

### 4.2 Q3 — move `@higgsfield/client` to devDependencies — **do now**

- **Exact file/change:** `package.json:17` (confirmed this session by read and grep: `"@higgsfield/client": "^0.2.6"` inside `dependencies`) — move it to `devDependencies`; then run `npm install` once to refresh `package-lock.json` (otherwise `npm ci` sees a lock/package.json desync). Sole importer: `scripts/higgsfield-example.ts:11`; nothing in `src/` imports it (verified two ways in the Q3 note), so it cannot enter the client bundle either way.
- **Honest benefit (corrected on re-check):** there is no CI config (`git ls-files .github netlify.toml vercel.json Dockerfile` → nothing tracked, checked this session) — but there **is** an in-repo deploy runbook: `scripts/deploy-studiomark.ps1` (tracked; the JG-019 Cloudflare Pages direct-upload script, read this session — `npm run sync-assets` + `npm run build`, then `npx --yes wrangler pages deploy dist` at :25). Because the deploy uploads the static `dist/` only and node_modules never enters it, `@higgsfield/client` is absent from the deployed artifact in either dependency block — the "--omit=dev stops shipping it" upside is moot for this repo's deploy path. The real value is install hygiene (one fewer runtime package for every `npm ci`). The original "no deploy config" claim came from the Q3 verification note and was wrong; corrected here after direct check.
- **Provenance note:** introduced by JG-035-adjacent Higgsfield tooling (per the 2026-09-27 handoff cited in the verification note) — a note, not a deferral gate.
- **Verification step:** `npm ls --depth=0` clean; `npm run build` output unchanged; `npm ci` succeeds. (None run in this review.)

### 4.3 R2 remediation — single-source the JG-028 verifier's expected delta — **do now** (derived from risk finding R2; not counted in the Q series)

- **Exact file/change:** `scripts/verify-jg028-handle-realism.mjs` (confirmed tracked this session) — replace the hardcoded `expectedDeltaZ: -0.354` at :329 (and the :8 doc-comment copy) with `EXPLODE_OFFSETS` imported from `src/data/caseStudies.ts`, using the in-repo compile-and-import pattern from `scripts/check-b1b2-contract.mjs:18-59` (esbuild-bundles the TS source, then imports the named constant).
- **Why:** canonical `EXPLODE_OFFSETS` (caseStudies.ts:159-169, handle `-0.354` at :168) is copied as literals in six-plus places (`git grep "-0.354"` per the R2 verification note → README.md:133, project/README.md:93, animation-spec.md:760, both rig-skills' SKILL.md tables, the verifier :8+:329 — plus extra doc/evidence copies, so "six" is conservative). Only the verifier copy is executable: a missed update there yields a false-red or false-green gate. Doc copies are governed by the AGENTS.md same-commit table rule when values change; the verifier copy should simply never be a copy.
- **Gate status:** none — the verifier belongs to JG-028 (closed 2026-09-06 per the verification note); the fix touches no JG-035-owned file.
- **Verification step:** run the verifier per its own protocol (needs a dev/preview server); it must pass with the imported constant — same number, single source.

### 4.4 Q1 — delete the dead v1 drawing precompute (~6.11 MB) — **gated: defer until JG-035 closes**

- **Exact files/change:** `git rm public/drawing/jgun-sheet-v1.json.gz public/drawing/jgun-sheet-v1.evidence.json` (6,106,663 B + 4,013 B — sizes confirmed this session via `ls -la public/drawing`). Runtime loads only `/drawing/jgun-sheet-v2.bin.gz` (`drawingCache.ts:172`, confirmed this session by grep; sole fetch at :182; sole caller passes no URL override). v1 is referenced solely as the default CLI arg of the one-time migration script `scripts/convert-drawing-precompute.mjs:12`. In the same commit: tidy `docs/jgun-stages-1-3-implementation-plan.md:9` (references the v1 evidence file); leave historical JG-035 evidence logs untouched (past-state records).
- **Why gated:** `public/drawing` precompute assets + the migration script fall under JG-035's drawing-cache ownership (verification note).
- **Side effect:** a bare invocation of the migration script would then fail with a visible ENOENT — dev tooling only, not site behavior.
- **Verification step:** `npm run build`; grep confirms no live v1 reference remains; the page still loads v2 (drawingCache fetch path).

### 4.5 Q4 — dead exports + one-letter-off naming footgun — **mostly gated**

- **Confirmed dead (declaration-only) exports:** `SHIFT_CAMERA_KEYFRAMES` (src/data/caseStudies.ts:476), `portalRgbSteps8Bit` (src/scene/drawing/sheet/portalGeometry.ts:319), `lampFor` (src/scene/drawing/sheet/sheetCamera.ts:184). Word-boundary greps over tracked files find no live-code consumers (extra `SHIFT_CAMERA_KEYFRAMES` hits are tracked evidence archives, not imports — verification note).
- **Naming footgun:** `drawingCache.ts:112` exports `encodedDrawingPrecompute` — one letter off the LIVE `drawingCodec.ts:46` `encodeDrawingPrecompute` (consumed by `scripts/precompute-drawing.mjs:8`) — and is itself never called (dead). `decodeDrawingPayload` (:159) is **not** dead (used internally at :186) and differs by suffix, not one letter.
- **Gating:** portalGeometry/sheetCamera/drawingCache are all `src/scene/drawing/**` → defer until JG-035 closes. `SHIFT_CAMERA_KEYFRAMES` sits outside the listed ownership, but its doc comment (caseStudies.ts:469-475) describes shift-sub-sequence camera choreography plausibly related to the in-flight signature-shot work — confirm with the open task before deleting even that one (verification-note caution).
- **Verification step (when executed):** delete dead names + their gate/doc references in the same commit (README Cleanliness Rule 4, project/README.md:175); `npm run typecheck` catches any dropped import.

---

## 5. Constraints and in-flight map

### 5.1 Hard rules every change must respect

From AGENTS.md, `project/context/constraints.md`, and the ask's rule list:

1. **GLB regeneration bans (absolute):** never regenerate `public/models/m249-transformed.glb` (bare `npx gltfjsx --transform` silently regresses the normal map to chroma-subsampled JPEG) and never re-run `gltfjsx --transform` on `public/models/msp-enclosure.glb` (collapses its 7 named roots; no flag prevents it). Both committed, not synced — never add to `sync-assets.ps1`. **No recommendation in this document requires either.**
2. **Explode-ladder same-commit sync (R2):** spec §5 tables, project/README.md ladder, and both rig skills' tables hardcode the ladder; any behavior change updates ALL in one commit. The rule text names docs/skills — the executable verifier copy (§4.3) is the uncovered gap. No recommendation here changes ladder *values*.
3. **Part numbers are the stable key** (A000606, K000004, P000725…); stage names are not — never reorder logic on names alone. Binds F1 directly: the part-number regexes stay byte-identical.
4. **Protected material:** `.scratch/` and `docs/orzo-style-portfolio-implemetation-roadmap.md` are parallel-session material — never commit or build on them. Untracked files under `project/work/evidence/` are in-flight JG-035 evidence.
5. **Verification protocol (R4, verified):** runtime telemetry, never vision alone (vision confabulates on the dark scene); restart the :4173 preview after EVERY rebuild; the opening verifier needs `--url=http://localhost:5199` (dev server refuses 127.0.0.1); `--quick` (~2 min, desktop+narrow) is the iteration pass, the full 6-case roster is "done" evidence only. Stale-pointer note from the R4 verification: AGENTS.md:51's "Protocol: TODO.md:13" no longer lands on the protocol text — banner insertions shifted it to TODO.md:29 (read this session and confirmed: the harness-protocol bullet is there).
6. **Process gates:** GitHub origin (`mhintz1980/jgun-portfolio`) is authoritative; push only after plan evidence and repository checks; a TODO checkbox flips to `[x]` only with a JG-### plan and linked evidence; plans without a JG-### ID stay proposals in `work/inbox/` — which is where this document deliberately lives.
7. **Cleanliness:** superseded docs move to `project/archive/superseded/` with an ARCHIVED header and rewritten inbound links in the same commit; no junk files (the untracked `scripts/manufacturing/__pycache__/` in the current tree is a live example); delete dead code with its gate/doc references in the same commit; keep the vite.config.ts `.scratch/` test exclude intact.

### 5.2 The JG-035 envelope (R1 — high, verified)

In-flight JG-035 owns: `src/scene/drawing/**` (sheet, handwriting, electricalScore), `src/scene/inspection/**` (ring holes, shaft FOS/normal repair — 6,707 lines), `src/components/AuthorshipNotes.tsx`, drawing-cache versioning, and its capture/verify scripts. Status (TODO.md read this session): owner revisions O1–O4/R1–R2/S1–S3 implemented, verification partial, **owner visual acceptance OPEN** (TODO.md:5); the inherited G6 desktop-full tier drop open — 110 failing expectations, cause unestablished, no waiver (TODO.md:7); Windows hardware verification open (captures so far are SwiftShader software GL from a Linux cloud container under `?qualityLock` — TODO.md:5). **Handwriting redo: DONE, not queued.** The redo once directed "before anything else" (TODO.md:185) was completed 2026-10-08: TODO.md:3 (newest banner, read this session) records the rejected lettering replaced by the screenshot-derived Ac Fast Reference font with the owner accepting the font direction ("looks good"), and the committed evidence tree `project/work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/` — tracked at HEAD (confirmed this session: `git ls-files` lists its README, before/after captures, build and cache-regeneration logs, and runtime-final verifier reports) — plus `DRAWING_CACHE_VERSION = 8` (`drawingCache.ts:7`, confirmed this session) carry the completed rerun. TODO.md:185 predates the redo's completion and is the stale record — do not act on it (the same trap §5.4 documents for R3). What remains open is exactly TODO.md:3's closing sentence: full owner-animation verification and inherited G6 are **not** closed by the font approval.

**No structural refactor inside the envelope until the thread closes, and never cite its intermediate gates as final.** Adjacent territory to treat with the same caution: `src/scene/CameraRig.tsx` (last 3 commits JG-035; imports `./inspection/*` and `./drawing/*`; its restore-error telemetry is what JG-035 checkpoint verification asserts on), `src/data/caseStudies.ts` (touched by JG-035-era commits — parked observation), `public/drawing/` assets, `scripts/convert-drawing-precompute.mjs`, `scripts/verify-handwriting-reference.mjs`, `scripts/verify-jg032-station2-thermal.mjs`.

### 5.3 Gate status of every item in this document

| Item | Kind | Gate |
|---|---|---|
| F1 nodeRoles table (§3.1) | refactor | **none — do now** |
| F2 CameraRig snapshot spec (§3.2) | refactor | coordinate at JG-035 close |
| F4 state-layer neutral module (§3.3) | refactor | after JG-035 closes |
| F3 DrawingLinework split (§3.4) | refactor | after JG-035 closes |
| F5 annotation primitives (§3.5) | refactor | after JG-035 Track B closes |
| Q2 GLB preload hint (§4.1) | quick fix | **none — do now** (one recorded owner decision: poster/reduced-motion cohort downloads 10.67 MB — resolved recommendation + fallback in §4.1) |
| Q3 dep move (§4.2) | quick fix | **none — do now** |
| R2 verifier single-sourcing (§4.3) | verifier fix | **none — do now** |
| Q1 delete v1 precompute (§4.4) | quick fix | defer until JG-035 closes |
| Q4 dead exports (§4.5) | quick fix | drawing portions deferred; caseStudies portion needs task-owner confirmation |

### 5.4 Doc-currency traps (R5 verified; R3 unconfirmed with corrected premises)

- **R5 (verified):** TODO.md:5/:36 (read this session — the stale "shipped drawing cache asset is `cacheVersion` 5 while code is v7 … falls back to the live bake" text is present verbatim) and the owner-revisions evidence README:71 still describe the drawing-cache mismatch as open. On this branch it is **resolved**: code and committed asset are both cacheVersion 8 (`drawingCache.ts:7 = 8`, confirmed this session by grep; `jgun-sheet-v2.evidence.json`: status "verified", generatedAt 2026-10-08T13:29:20Z per the verification note). **Do not regenerate or "fix" the cache from the stale docs.** Editing those stale doc lines is itself JG-035 territory — defer.
- **R3 (UNCONFIRMED — its verification failed currency on two material claims):** the two "dead-looking" verifier scripts are in-flight obligations — never dead-code-sweep them. But: (a) the JG-032 thermal verifier's `panelY≈0.55` assertion was retired (commit `1d04d35`; the script now asserts `panelPosition[1] ≈ 0.05` at rest, :511) — its current blocker is solely the recorded JG-034 `__drawingProof.ready` timeout (TODO.md:46, reported from records, not reproduced); (b) `verify-handwriting-reference.mjs` has **not** "never been executed" — committed evidence at HEAD shows it ran 2026-10-08 (`runtime-final/report.json`, status "verified", 122 checks each desktop+narrow), the owner accepted the font direction, and the cache is v8 and must not be regenerated. TODO.md:185 predates the verifier's commit and is the stale record. Acting on R3's stale premises would duplicate work the committed handoff explicitly marks done.

---

## 6. Unconfirmed and parked observations

**None of these were independently verified for this assessment** (survey observations only); each carries a disposition.

1. **rl300 vs stages airflow** (~2,131 vs ~2,246 lines) — deliberate owner-review isolation, zero cross-imports; boundary protected; cost is accepted double maintenance. Do not merge.
2. **`scripts/export-sheet-template.mjs` + `verify-b1b2-rebuild.mjs`** — LEGACY pair, dead weight gated on owner confirmation of the JG-035 sheet; one-task cleanup when the gate clears (delete both + update README Repository Map + evidence links in the same commit).
3. **`src/scene/inspection/shaft/` promotion** — 6,707 lines, ~90% of inspection; candidate for a bounded subsystem with its data (`cutterOutline.json`) split out — only after JG-035 closes.
4. **`sheet/referenceHandGlyphs.ts`** — 833 lines of GENERATED glyph contours ("Do not edit" header); changes go through `scripts/handwriting-reference-extract.cjs`; exclude from size-driven refactors.
5. **`src/data/caseStudies.ts` split** — 809-line data monolith (chapter copy + part names + hotspot config + explode offsets + camera constants) imported by all three layers; a domain split would decouple the DOM bundle — sequence after close (JG-035 touches it).
6. **`.kilo/worktrees/fantasy-feet/`** — 52 MB full repo copy inside the project dir; git-ignored but NOT `.cbmignore`d, so repo-wide greps and the codebase-memory index can ingest a stale duplicate tree (one survey grep got 5 spurious hits). Candidate: add to `.cbmignore`.
7. **Window telemetry casts** — all 9 `as any` casts in `src/` are `(window as any)` telemetry-global assignments across 5 files; one `declare global` Window augmentation (precedent: `src/types/troika-three-text.d.ts`) removes them all.
8. **Micro-helper duplication** — `clamp01` local in 4 files (while `introTimeline.ts:70` already exports it), `smoothstep01` in 3; `BackdropRig.tsx:55` even comments "Same shape as StudioRig's smoothstep01". Optional cosmetics.
9. **Lone `.test.js`** — 40 tracked `.test.ts/.tsx` files plus exactly one `.test.js` (`sheetInkRuntime.test.js`); runs because vite.config.ts:9 excludes only `.scratch`. Shape nit only.
10. **vite manualChunks** — vite.config.ts has no `build` section; the recorded build emits `sectionRenderPass` at 684.62 kB (gzip 185.89 kB), tripping Vite's 500 kB warning. Config-only split possible; warning hygiene, not a defect (chunk is shared/cached).
11. **Duplicate draco payload in recorded dist** — TWO `draco_wasm_wrapper` and TWO `draco_decoder` pairs emitted while every runtime decoder path points at committed `public/draco/` (`TorqueWrenchHero.tsx:47`, `QuietMachineScene.tsx:56`, `AirflowField.tsx:347`, `shaftRuntime.ts:294`). Provenance (three-stdlib/examples bundling) and non-fetch **unverified — no build run**. Any dedupe must keep `/draco/` intact (`M249Stage.tsx:26` relies on the shared loader config).
12. **14.24 MB GLB fetch storm at canvas mount** — Default.glb 10.67 MB (module-scope preload) + msp-enclosure.glb 2.67 MB (Station 2 mounts unconditionally in the always-on Suspense) + m249-transformed.glb 0.89 MB; `visible={false}` gates rendering, not fetching. Deferring station fetches to stage-approach is a real refactor with a first-scroll latency tradeoff; TODO.md:42 notes Station 2 integration separately in flight.
13. **Open performance constraints a refactor must respect** — G6 desktop-full tier drop (open); cold-load bake 4.3–5.6 s vs < 3 s target with a proposed (unbuilt) edgeSet+HLR worker offload (TODO.md:27); dev-server cold precompute load NOT faster than the live bake (12.5 s vs 11.0 s), to be measured against `npm run preview` (TODO.md:29, read this session).
14. **`DrawingProofRenderer.tsx:108-113` per-frame joins** — three 16-float `elements.join(',')` + concats per frame building `captureKey` once `drawingRuntime.rendered` exists; a scratch-buffer compare would fix it. Inside the JG-035 envelope — gate.
15. **`Default.glb` IS tracked** (all 7 GLBs + role-map.json, 18.35 MB under `public/models`) — likely deliberate per HEAD `eeeed86`; don't re-add "synced separately" lore without checking.
16. **Fonts ship as uncompressed TTF** (~226 KB total, no preload; only SemiBold has an `@font-face` with swap) — WOFF2 conversion would save ~110 KB (3-file + 4-URL change); slightly riskier than the GLB preload (font file integrity), so verify one rendered view after.
17. **Codebase-memory graph** — if used, query project key `C-Users-Markimus-.buzz-REPOS-jgun-portfolio` (legacy `jgun-portfolio` may be stale); the evidence subtree is pruned by `.cbmignore` (read evidence files directly); refresh the index and check `index_status`/`check_index_coverage` after substantial structural changes. Not used for this assessment.

---

## 7. Not covered — and what was checked this session

**Not covered (read-only review; other builds were running on this machine):**

- No `npm run typecheck`, `npm test`, `npm run build`, dev/preview servers, browsers, or verifier scripts were run. Every runtime-behavior claim rests on the surveys' recorded logs (`.scratch` build logs, TODO.md, committed evidence JSONs) and the verification notes supplied with the ask — not on fresh execution.
- Recorded-log numbers (chunk sizes 251.90 / 418.68 / 684.62 kB; vitest 33 files / 301 tests; 41 files / 433 tests at `2831f35`) are as attested, not reproduced.
- The 771-export dead-export corpus scan was not re-run in full; Q4 stands on its per-name word-boundary greps and file reads (verification note).
- The preload hint's cache-match semantics were not runtime-verified (needs a running server).
- R3's runtime claims (the JG-034 timeout) are reported from TODO.md records, not reproduced.
- All §6 parked observations are unverified.
- No codebase-memory graph queries were made.

**Writer spot-checks run this session (all read-only; outputs as stated):**

- `git rev-parse --abbrev-ref HEAD` → `codex/jg033-signature-shot`; `git log --oneline -1` → `6cca1b0 handoff: record checkpoint commits…`
- `git grep -n "buildWrenchRig" -- src/scene/rig/nodeRoles.ts` → `191:export function buildWrenchRig(root: Object3D): WrenchRig {`
- `git grep -n "rawScrollFor" -- src/state/scrollStore.ts` → :4 (import), :58, :86 (comment), :130
- `git grep -n "DRAWING_CACHE_VERSION\|jgun-sheet-v2" -- src/scene/drawing/sheet/drawingCache.ts` → :7 (`= 8`), :39, :105, :121, :172 (`url = '/drawing/jgun-sheet-v2.bin.gz'`)
- `git grep -n "higgsfield" -- package.json` → :17; package.json read in full — `typecheck`/`test`/`build`/`check:station2` scripts present
- `git grep -n "SHEET_FONTS" -- src/scene/stations/StationDriver.tsx` → :8; `git grep -n "GdtSymbol" -- src/scene/Hotspots.tsx` → :6
- `git grep -n "preload" -- index.html` → no matches (index.html also read in full: 40 lines, zero preload tags)
- `git ls-files scripts/check-station2-contract.mjs scripts/verify-jgun-opening.mjs scripts/verify-jg028-handle-realism.mjs` → all three tracked
- Line counts (PowerShell): `DrawingLinework.tsx` = 867; `CameraRig.tsx` = 600; `Hotspots.tsx` = 569; `Test-Path project/work/inbox` → True
- `ls -la public/drawing` → `jgun-sheet-v1.json.gz` 6,106,663 B; `jgun-sheet-v1.evidence.json` 4,013 B; `jgun-sheet-v2.bin.gz` 4,205,481 B; `jgun-sheet-v2.evidence.json` 4,575 B
- Read TODO.md lines 1-40 (JG-035 banners at :3/:5/:7; harness protocol at :29) — stale v5-vs-v7 cache text confirmed present verbatim at :5

**Revision checks (post-review corrections, this session):**
- `git ls-files scripts/deploy-studiomark.ps1 .github netlify.toml vercel.json Dockerfile` → only `scripts/deploy-studiomark.ps1` tracked (no CI configs); script read in full — JG-019 runbook, `wrangler pages deploy dist` at :25 (corrects §4.2)
- `git ls-files project/work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/` → the full evidence tree is tracked at HEAD: README, before/after captures, build/cache-regeneration logs, runtime-final verifier reports (supports the §1/§5.2 handwriting-redo-DONE correction)
- Read `src/App.tsx:1-60` → `canvasActive = tier !== 'poster' && !reducedMotion` (:40); poster/reduced-motion visitors render `StaticPoster` and the lazy canvas chunk is never imported (:34-50) (grounds the §4.1 scope decision)
- `ls -la public/models` → Default.glb 10,671,700 B; msp-enclosure.glb 2,671,600 B; m249-transformed.glb 892,092 B — sums to 14,235,392 B ≈ 14.24 MB (sizes verified; the mount-time fetch behavior itself remains survey-attested, §6.12)

---

*Prepared as a work-inbox proposal per the repo's task-intake rules (project/README.md; no JG-### ID assigned). Nothing in this document has been implemented, committed, or pushed.*
