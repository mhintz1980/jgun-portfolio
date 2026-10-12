# Quiet Machine: motion, beat records and layered background, PLAN, 2026-10-11

**Status (updated 2026-10-12):** S0 done; S1 `INDEX.md` and S2a landed together in `40a0b353` (handoff 11d records S2a and S2b done; the S1/S2a checkboxes below were not individually re-ticked in this edit); S2b done; S3, S4 and S5 (poster repoint) are open and are not authorized to start by this document. Owner rulings of 2026-10-12 are recorded in sections 3 (S3), 7 and 8. Nothing here authorizes code, builds, captures, GPU use, commits or pushes.

**Author seat:** Opus 5.5 planning seat (medium). Branch `quiet-machine/integration`, worktree `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`.

## Line one (owner skim)

| Item | Value |
|---|---|
| Decision asked | Approve, amend or reject this plan. Then approve each stage before it starts. |
| Estimated spend (all stages, estimate only) | about 0.9-1.4M tokens. S0 30k, S1 60-90k, S2 250-350k, S3 150-250k, S4 300-450k, S5 100-200k. |
| Anchor for those numbers | handoff (f) line 10: GPU-2 seat measured 216,042 tokens; V16 track estimated 0.5-0.7M. |
| Cheapest useful variant | S0 + S1 + S2a only (about 350-450k). This gets the beat records and the regression gate. No visual change. |
| Blocked by | The V16 materials-and-parts track (separate, owner-approved, not part of this plan). S2-S5 start after it lands. QM7 stays blocked on owner rulings. |

## 1. Authority and boundaries

- Sources: the torque plan (`jgun-torque-wrench/docs/torque-wrench-rebuild/13-implementation-plan.md`), its structure (`10-structure.md` sections 1-3, 8), design (`09-design.md` "Layered background"), the enclosure brief (`11-enclosure-agent-brief.md`), and the Oryzo teardown (`C:/Vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md` sections 1-5, 10).
- Torque decisions are final for Quiet Machine and are not reopened: about 500k triangles, device-named p95 at 60 fps desktop / 30 fps phone, one intake hotspot, radiator fans and v4 renames deferred.
- Oryzo values (`1 - exp(-12*dt)`, DPR 1.5, 2560x1440 pixel cap, pointer f 1.35 / z .5 / r 1.25) are candidates to validate. They are not constants.
- The V16 track owns its files until it lands. This plan does not touch `v16-part-materials.json`, `rl300-extra-parts.glb` or the V16 runtime seat's files.
- Scroll length is unlocked by the owner. `QM_LENGTH_VH = 900` (`src/scene/rl300/QuietMachinePreview.tsx:10`) is provisional.
- Work stays in this worktree. No push, PR, deploy or publication. Stage files by explicit path.

## 2. What is scroll-independent today, and what is not

- `u = scrollY / (scrollHeight - innerHeight)` (`QuietMachinePreview.tsx:74, 82`). So `u` already ignores page length. Changing `QM_LENGTH_VH` only changes page height.
- What is not independent is beat count and beat duration. One beat today is spread across these tie points:
  - `SHOTS` titles, notes, captions and `from`/`to` (`src/scene/rl300/shot.ts:23-38`).
  - `KEYS` camera keys (`shot.ts:44-63`). There are 9 keys for 7 shots: beat 01 owns keys at 0 and .12, beat 04 owns .51 and .61. Kept in step with `SHOTS` by hand.
  - `cutAt` .13/.3/.9/.99 (`shot.ts:67`) and `undersideAt` .43/.51/.62 (`shot.ts:71`). These are off the shot edges.
  - `shotIndexAt` (`shot.ts:73-76`).
  - Flow channels in `evaluateFlow` (`src/scene/rl300/flow.ts:141-168`): zero branch `u <= .26 || u >= .90` (143), main, lower, merged, sound (146-149), handoff (152), fade (153), main introduction (155), heat (165).
  - `phase: u * 12` (`flow.ts:132, 166`). This is u-scaled, so it changes speed if beats re-space.
  - `SOUND_WINDOWS` (`flow.ts:120-122`) and its `+ .006` use in `AirRibbons.tsx:442`.
  - `POSTERS[beat]` (`QuietMachinePreview.tsx:17`), `VIEWS` anchors .2 and .51 (line 19), `END_CARD_AT = .97` (line 12).
  - The label `0{beat + 1} / 0{SHOTS.length}` (`QuietMachinePreview.tsx:102`). It prints "010 / 010" at 10 beats.
  - Test pins: `SHOTS` length 7 and contiguity (`src/scene/rl300/preview.test.ts:41-53`), cut depth (54-60), length knob and end card (646-667).

## 3. Ordered stages

Each stage needs owner approval before it starts. Each ends at its Exit condition.

### S0: shell readiness note for the torque track (docs only, no code)
- [x] Write one note listing the shell exports the torque plan's Stage 0 needs: `prefetchPage`, `releaseFadeWhen` (`src/shared/pageFade`), `PageLink`, `PageNav` (`src/shared/PageNav`), `pageHref`, `resolveEntryTier`, `TierParam` (`src/shared/pages`), as imported at `QuietMachinePreview.tsx:4-6`.
- [x] Describe lifecycle: fade held until `fadeReady` (poster committed or scene ready, lines 37-41, 55). Context loss and scene error switch to poster (lines 54, 89).
- [x] Describe navigation: `?shot=` seek, `tier` on outgoing links, prefetch once at `END_CARD_AT`.
- [x] State the gap plainly: there is no generic poster primitive. The poster is an inline `<img>` path template (`QuietMachinePreview.tsx:97`). The torque plan expects a poster interface. That is a deliverable, not something to confirm.
- [x] Point to QM4 (JG-033 plan, heading at line 295) for the multi-page build and private-entry contract. Done in the note, section 13: QM4 covers the multi-page build; the JG-033 plan has no private-entry text, so that contract is pointed to in the note's sections 7 and 10.

**Exit:** the note exists, every export is cited by file:line, the poster gap is named, and the torque session has acknowledged it.

**S0 status (2026-10-11):** all five items ticked. Items 1-4 on the first note; item 5 once the QM4 pointer was added (note section 13). Torque receipt: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/15-shell-readiness-acknowledgement.md` (acknowledges receipt and the contract; does not close torque Stage 0). The poster gap named in item 4 is being delivered separately (poster interface, `private` registry flag); see the shell readiness note.

### S1: evidence index and gate map
- [ ] Create `project/work/evidence/rl300-quiet-machine/INDEX.md`. Map each artifact to a gate below.
- [ ] Mark each artifact current (built from present HEAD) or historical (lineage only).
- [ ] Record failures and waivers. Include the V16 waivers from handoff (f) line 18 as "owner-approved, Astra not consulted".
- [ ] Map the new gates onto the existing B.1-B.4 and U.1-U.4 (`JG-033` plan lines 49-58). Do not duplicate them.

**Exit:** every evidence folder has one line in the index, with gate, current/historical and pass/fail.

### S2a: beat records, relocate only (byte-identical gate)
- [ ] Inventory every absolute-u literal first. Include GLSL `smoothstep` in `AirRibbons.tsx` and any `control.u` consumer in `QuietMachineScene.tsx`. These were not read for this plan.
- [ ] Add a `beats.ts` record per beat: `id`, `from`, `to`, copy, `keys[]`, poster id, and named windows (cut, underside, flow channels, sound fronts).
- [ ] Copy the existing literals unchanged. Do not derive them as `from + f * (to - from)`. That changes float rounding, and the bytes would differ.
- [ ] Rebuild `SHOTS`, the flattened `KEYS`, `POSTERS` and the flow windows from the records. The flattened key order must reproduce `evaluateShot`'s pairwise interpolation exactly.
- [ ] Keep the flow zero branch explicit (comment at `flow.ts:137-140`).
- [ ] Change the label to `String(n).padStart(2, '0')`. It prints "01 / 07" at 7 beats, so bytes do not change.
- [ ] Fixture beat: a test-only record set with 8 beats runs through the same resolver. It proves add/remove touches only data. It never enters production `SHOTS`.
- [ ] Retained pins, unedited: test lines 41-53 (length 7, contiguity, beat ownership), 54-60 (cut depth), 646-667 (length knob, end card).
- [ ] Regression gate: fresh baseline captures and sidecars from post-V16 HEAD, then the same captures after S2a. Use u = 0, .12, .2, .27, .41, .51, .61, .76, .89, .97, 1. Do not compare against the committed 32-gpu-2 captures; they are pre-V16.

**Exit:** all PNGs byte-identical, all sidecar telemetry identical, B.1-B.4 pass, fixture test passes, retained pins pass unedited.

### S2b: beat-local timing (visual gate, not byte gate)
- [x] Express windows as fractions of their own beat. Adding a beat then re-spaces nothing else. (Done `e2770620`: beat-local ticks, resolved to u; values bit-identical.)
- [x] Decide whether `phase` stays u-scaled or becomes per-beat. (Owner 2026-10-11: stays u-scaled, `u * 12`.)

**Exit:** owner approves PNGs and motion at the same u values. Astra is consulted if any visual effect changes.

### S3: per-section state and fit()-window choreography
- [ ] Derive `{ratio, isActive, local}` per beat from `u` (Oryzo section 2). Gate offscreen work on `isActive`.
- [ ] Replace hand windows with `fit(ratio, a, b, ease)` calls. Stagger is index-sliced windows of the same ratio (for example the sound fronts).
- [ ] Evaluate against the existing look first. A version that looks identical is a pass. A version that looks different is a visual change and needs approval.
- [ ] Freeze check: a stationary `u` freezes all narrative state. Reverse retraces it.

**Owner ruling 2026-10-12: S3 may change the look.** It no longer has to match. What this lifts: the "must look identical" constraint, so a `fit()` window may move a transition if the result reads better. What it does not lift: each changed look still reaches the owner as unaltered runtime PNGs (and motion) at the same u values, and Astra is still consulted, because the owner did not waive Astra for S3. Say which windows moved and by how much in the S3 evidence.

**Exit:** forward, reverse, jump and reload give the same state at sampled u. Any visual change has Astra and owner approval.

**S3a status (2026-10-12, owner "Go on S3"): done in the working tree, uncommitted, no look change.** One edit, `AirRibbons.tsx`: a bundle's two draws are skipped while `flow.weight` is exactly zero. 76 pixel compares at threshold 0 (4 rows x 19 u): 0 changed. Closed frames 119 > 111 draw calls (lite 61 > 53); the worst sampled open frame (19 u values) falls only 143 > 142 (lite 85 > 84), because at u .77 all four bundles are live. Also green: full vitest 701/50, check:station2, verify-jg033-preview and the ribbon-clipping verifier. Evidence `project/work/evidence/rl300-quiet-machine/44-s3-ribbon-gating/summary.md`. The `{ratio, isActive, local}` helper and `fit()` rewrite were deliberately not done in this pass (no caller in a pixel-identical change; float drift; GLSL bakes absolute-u windows). **S3b, the actual look changes the owner has now allowed, has not started and needs his direction on which transitions to move.**

### S4: layered background (candidates, approval per visual change)
- [ ] `BackgroundDirector` plus 2-3 depth layers driven by `u`, each at its own parallax rate.
- [ ] Gamma-correct radial base gradient with blue-noise dither (Oryzo section 3).
- [ ] Continuous blend of layer opacity, offset and colour across beats. No snaps at beat edges.
- [ ] Optional pointer layer via second-order dynamics, subtle and suppressed while reading.
- [ ] Offline still of the background for poster and reduced-motion paths. No live layers there.
- [ ] Cost check: `frameResponseMs` is vsync-bound (handoff (f) line 18). Report draw calls, triangles, material count and an uncapped timing before and after.

**Exit:** each candidate has Astra approval and owner PNG and motion approval, and its cost is inside the approved budget. A rejected candidate is removed, not kept off by a flag.

### S5: poster tier from offline V16 Cycles stills (owner's open choice)
- [ ] Do nothing until the owner chooses between runtime AO and V16 Cycles posters (handoff (f) line 20). This sits in QM10 scope (JG-033 plan line 604).
- [ ] If chosen: one still per beat record, mapped through the beat's poster id. Record source file, settings and hash.

**Exit:** owner has chosen. If posters are chosen, every beat maps to an existing still, and the poster path loads no CAD and mounts no canvas.

## 4. Gates (local to this plan; not JG-033 or JG-035 closure)

| Gate | Evidence | Pass condition |
|---|---|---|
| G0 Authority | Owner approval quote per stage | Recorded before the stage starts |
| G1 Shell note | S0 note | Every export cited; poster gap named |
| G2 Evidence index | `INDEX.md` | Every folder listed, current/historical, failures kept |
| G3 Byte regression | S2a before/after PNGs and sidecars | Byte-identical PNGs, identical telemetry |
| G4 Data-only beats | Fixture test | 8-beat fixture passes through the resolver; no non-data edits |
| G5 Determinism | Forward/reverse/jump/reload samples | Same state at same u; stationary u freezes |
| G6 Background | S4 PNGs, motion clips, layer telemetry | No banding, no edge snaps, depth reads behind the enclosure |
| G7 Tiers | Full, lite, poster, reduced motion, WebGL failure | Poster paths: zero canvas, zero CAD requests |
| G8 Performance | Device-named p95, draw calls, triangles, uncapped timing | Inside budgets approved before measurement |
| G9 Review | Astra ruling, owner PNG, owner motion | All three recorded per visual change |

Every stage also passes B.1-B.4 and U.1-U.2.

## 5. Ownership (one writer per file)

| Writer | Files | Tier |
|---|---|---|
| Planning seat | this plan, S0 note | Opus |
| Index seat | `INDEX.md` | Haiku (mechanical) |
| Beat seat | `beats.ts`, `shot.ts`, `flow.ts` | Sonnet; Opus reviews S2a |
| Page seat | `QuietMachinePreview.tsx` | Sonnet; after V16 lands |
| Scene seat | `AirRibbons.tsx`, `QuietMachineScene.tsx` | Sonnet; after V16 lands |
| Background seat | `BackgroundDirector.ts`, layer files | Sonnet; Opus reviews |
| Test seat | `preview.test.ts`, fixture data | Sonnet |
| Capture seat | evidence captures and sidecars | Sonnet; GPU and ports confirmed first |
| Astra (`gpt-6-astra`, codex) | rulings only | Consulted on every visual effect before it counts as done |

Shared files stay sequential. Opus plans and reviews critical work. Sonnet implements. Haiku does mechanical work.

## 6. Acceptance layers (kept separate)

1. Technical: gates G1-G8 and B.1-B.4 pass.
2. Astra: rules on each visual effect.
3. Owner PNG: unaltered runtime PNGs.
4. Owner motion: full scroll, forward and reverse.
5. Publication: separate authorization. None of the above implies it.

A passing test does not override a visual rejection.

## 7. Budgets

- Numerical budgets are approved before any performance verification.
- Starting point: torque's final QM numbers (about 500k triangles, p95 at 60 fps desktop / 30 fps phone).
- Background budget (draw calls, extra triangles, texture memory) is proposed in S4 and approved before S4 is measured.

### S4 background budget: APPROVED by the owner 2026-10-12 ("S4 numbers approved")

Owner asked for numbers 2026-10-12 and approved them as written below, in chat, the same day. This approves the budget rows only: it does not start S4, does not waive Astra or his PNG/motion approval per candidate, and the frame-time row is still a rule, not a number (it needs a device-named baseline first). Nothing was measured for this proposal; the baseline rows are read from existing evidence (cited), and the budget rows are proposals derived from them.

| Quantity | Baseline today (source) | Existing pin | Headroom | Proposed S4 budget |
|---|---|---|---|---|
| Background draw cost today | none: `<color attach="background" args={['#101b24']}>` clear, `QuietMachineScene.tsx:167`; `RoomEnvironment` lights the model only | | | S4 adds everything |
| Draw calls, full, worst open frame | 138-142 across sampled frames (handoff 11b line 17); 143 at closed u before the skip, all passes drawing (`43-qm9-skip-caps/closed-proof-head.json`, HEAD e12fa094). Current-HEAD values at the open anchors were not re-read for this proposal. Open frames were unchanged by `190e18fd` (`43-qm9-skip-caps/summary.md`) | `< 150` (`verify-jg033-preview.mjs:115`) | 6 | **<= +5 (<= 148)**: 1 gradient+dither pass, 2 depth layers, 0-2 for the pointer layer. No pin edit |
| Draw calls, lite, worst open frame | 85 (handoff 11e line 14) | `< 90` | 4 | **<= +2 (<= 87)**: gradient+dither plus at most one layer; no pointer layer |
| Draw calls, closed frames | full 119, lite 61 (after `190e18fd`) | same pins | 30 / 28 | not the binding case; the open worst case is |
| Triangles added | | | | **<= 100** (quads, or one fullscreen triangle). Not the constraint |
| Scene triangles (context) | full 1,210,464 open (906,048 closed after the skip), of which about 304k are cap passes at open frames; lite 551,736 open (247,320 closed) (`43-qm9-skip-caps/summary.md`, handoff 12a) | plan "about 500k per device" | not demonstrated | S4 does not change this; do not claim it |
| New materials | | | | **<= 3 full, <= 1 lite** |
| Texture memory (GPU, with mips) | | | | **<= 8 MB full, <= 1 MB lite.** Cost arithmetic: blue-noise 64x64 RGBA8 = 16 KB; a 1024x512 RGBA8 layer = 2 MB (about 2.7 MB mipped), so 2 layers = about 5.3 MB; lite carries the noise texture only |
| Frame time | **no device-named p95 exists** (`frameResponseMs` is vsync-bound; GPU-6 never run) | 60 fps desktop / 30 fps phone | unknown | **cannot be set honestly until a baseline is measured**: proposed rule is desktop p95 within +1.0 ms of the same-device pre-S4 baseline, no fps loss, uncapped timing before and after |

Two consequences the owner should see before approving:

1. **The existing pins leave 6 draw calls (full) and 4 (lite).** A background with 3 passes fits only because the proposal is that tight. If the owner wants a pointer layer or a third depth layer on full, the `< 150` pin has to move first, which is an edit to an existing assert, not a new one.
2. **S4 cannot be accepted on performance until a baseline p95 is captured** on the named desktop GPU (and the phone, if the phone path is claimed). That is the GPU-6 measurement that QM8 deferred. Cost to take it: local GPU time and one existing verifier run (`frameResponseMs`, uncapped); no Modal spend; but it needs the single GPU free.

## 8. Open owner decisions

1. Approve this plan, and which stages (full, or the cheap S0+S1+S2a variant).
2. Runtime AO or V16 Cycles posters (S5).
3. ~~Whether S3 may change the look, or must match it.~~ **Ruled 2026-10-12: it may change the look.** Per-change PNG/motion approval and Astra still apply (see S3).
4. ~~Background budget numbers (S4).~~ **Approved 2026-10-12 (section 7).** The frame-time rule still needs a device-named baseline p95 before S4 can be accepted on performance.
5. Pending from handoff (f): stale `rl300-lite.glb`, intake framing at u .51, end card copy and nav look, group A/B (gates QM7). Of these, stale lite landed (`114c36b3`); the rest sit in QM7/QM7b and the poster repoint.
6. **Header at phone width wraps to 3 rows: look change authorized 2026-10-12.** Page-local: `.qm-header` and the `@media (max-width: 600px)` block in `src/scene/rl300/quiet-machine.css:4,71-75`, markup at `QuietMachinePreview.tsx:103`. Not the shared `PageNav`, so no torque coordination window is needed. The authorization does not waive Astra or the owner's PNG at 390x844 and 390x667.
7. **Poster repoint (QM7b/QM10), answers still owed:** replace the three blue previews with the seven V16 renders; WebP size/format; beat 4 v3 (v2 failed as blown out; v3 needs a Modal go, about USD 0.0868). Details in handoff 12a, which the poster session keeps current.
