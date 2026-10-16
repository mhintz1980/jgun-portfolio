# 20 — Owner Feature-Parity Gap (raised 2026-10-16)

Owner compared the private `/torque-wrench/` page against the live `/` page (screenshots
taken 2026-10-15 23:46–23:49) and asked why five owner-valued features from the original
experience are absent from the rebuild. Investigation completed 2026-10-16 (read-only;
no implementation). This doc promotes them from the ambiguous scope phrase "existing
JGUN content" to **named parity items** and records the per-feature verdicts.

## Root cause (one paragraph)

The accepted scope (`01-questions.md` Q3: "Existing JGUN content + restored opening +
completed cutter bullet time") was **never decomposed into a feature-parity checklist**.
`16-page-safe-reuse-audit.md` then parked every DOM-overlay / HUD / camera-choreography
module that carries these features in its "exclude unchanged, extract later" bucket
(`:125` planned the extraction; `:135` excluded `Hotspots`, `TechnicalHUD`,
`InspectionScene`, `RingInspection`), and the implementation plan slotted "projected
callouts" into Stages 3/6 + gate G7 (`13-implementation-plan.md:106`) — stages that have
not run. As of `315052e1` (2026-10-14/15), `TODO.md:131` records: Stages 0–2 closed,
Stage 3 exit recorded, Stage 4 implemented with review evidence **prepared**; Stage 5
backgrounds / Stage 6 final offline art + Astra/owner acceptance pending; **G0–G9 all
open**. No feature was ever ruled against. Nothing was deleted — the old page remains
live and untouched at `/` (Q1 ruling); the private page simply never imported the
modules yet.

## Per-feature verdicts

### F1 — Clickable callout labels (parts elevating from the drawing, leader-line labels)
- **Owner intent (2026-10-16):** wants the concept back and improved, "use in several
  locations throughout the project" — not just the drawing sheet.
- **Old source (live at `/`):** `src/scene/Hotspots.tsx` (clickable `<button>` hotspot
  badges + safe-area leader lines; mounted at `TorqueWrenchHero.tsx:16,419`);
  drawing-sheet callouts in `src/scene/drawing/sheet/composeSheet.ts:398-456`
  (`AIR MOTOR · BALANCED VANE ASSEMBLY` etc.); lift animation
  `src/scene/drawing/extractionPose.ts:31`. Built JG-020/021/026 (commits `2d0034de`,
  `1ede5cce`, `44cbbedb`).
- **New page:** zero callouts — no `Hotspots`/`TechnicalHUD` import anywhere under
  `src/scene/torque-wrench/`; only a text panel + playback buttons
  (`Story.tsx:85-107`).
- **Parked by:** `16-page-safe-reuse-audit.md:125,135` + `13-implementation-plan.md:106`
  (Stage 6 / G7, not started).
- **Verdict: documented-but-deferred. The deferral under-weights stated owner priority.**

### F2 — Input-shaft presentation: material callouts, FAILED stamp, FOS/FEA stress bar, data panels
- **Old source (owner-authored spec):**
  `project/context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md`
  (owner verbatim: "'AISI 4140 (40-45 HRC)', then below it 'FAILED' with a thump …
  stamped onto the screen"), superseded by owner revision S2 (2026-10-07) adding the
  FEA-style FOS bar + Model Name block. Code: `src/components/ShaftStoryLayer.tsx`
  (material cards, `SHAFT_STAMP_TEXT` stamp, `FosPanels`), 3D field
  `src/scene/inspection/shaft/fosPresentation.ts`, stamp schedule
  `src/scene/inspection/shaft/script.ts:14+`. Commits `f0bcaacc`, `9cfab453`.
- **New page: PARTIAL.** The 3D machining study is reused
  (`RuntimeWorld.tsx:14` → `createShaftRuntime`) and the camera performs a recap/FEA
  dwell (`InspectionDirector.ts:38,290-295`), plus sheet handwriting `'RUN FEA.'`
  (`privateSheetContent.ts:8`) and prose (`Story.tsx:94-99`). But the entire DOM layer —
  material cards, FAILED stamp overlay, FOS bar, left data panels — was **not imported**
  (no `ShaftStoryLayer`/`fosPresentation` reference).
- **Parked by:** the same "exclude unchanged" bucket (`16-page-safe-reuse-audit.md:135`
  excludes `InspectionScene`; the ShaftStoryLayer extraction was never scheduled by name).
- **Verdict: partial port — the owner-authored spec exists in-repo and should drive the
  Stage-6 re-import.**

### F3 — Camera tour of the rear-cover digital display (LCD dwell)
- **Old source:** rear LCD cluster `src/scene/rig/lcdCluster.ts` + `nodeRoles.ts:587`;
  camera choreography in the old `CAMERA_PATH` (`src/data/caseStudies.ts`) — arc from
  `.420`, **dwell `.458–.488`**, return through `.525` (documented in
  `03-current-motion-inventory.md:26`). Owner-verified PASS multiple times (JG-025
  "i approve. check it off.", JG-027 "Looks good, pass it." at `?dwell=lcd`).
- **New page:** the display **geometry is present** (builds via reused `buildWrenchRig`)
  but **no camera beat ever looks at it** — new cameras are opening/ring/cutter only,
  blended by `CameraHandoff.ts`.
- **Parked by: the one explicit exclusion** — `16-page-safe-reuse-audit.md:75` "LCD/shift
  camera data also carry the old multi-project choreography; **do not adopt the whole
  path**" and `:184` "exclude downstream station choreography." NOTE: this ruling was
  architectural (avoid importing the old multi-project CAMERA_PATH wholesale), **not** a
  judgment that the LCD dwell is unwanted.
- **Verdict: excluded as collateral damage of the camera-path ruling. Reinstate as a new
  beat in the new camera language (dwell window data preserved in the old path).**

### F4 — Ring-switch helical shift (~9.5 mm travel + 120° rotation down the gearbox)
- **Old source:** `src/scene/rig/wrenchMechanics.ts:76-107` (P003068 follows the P000420
  cam groove, +Z travel, +120° CCW-from-rear); constants
  `src/data/caseStudies.ts:249-250`.
- **New page: PORTED.** `RuntimeWorld.tsx:9` reuses `applyWrenchMechanics`, driven by
  new beats — `mechanism-switch` 0.46–0.52 (`MechanismDirector.ts:17`,
  `beats.ts:53`) + a dedicated `inspection-ring` study beat 0.69–0.735 with its own
  camera (`createPrivateRingCamera`, `ringAnchor.ts`). Stage 3 exit recorded
  "matched mechanical parity desktop/full 3493PASS" (`13-implementation-plan.md:174`).
  Not ported: the old `RingInspection.tsx` click-modal UI.
- **Verdict: in scope and built. If it reads as missing on screen, treat that as a
  Stage-4 / G-gate verification gap (review evidence was 'prepared', gates open), not a
  scope loss — verify visibility in the current build.**

### F5 — Pointer hover parallax (partial orbit on mouse move, releases instantly on scroll)
- **Owner intent (2026-10-16):** "shifts the view by a few degrees… doesn't lock the
  view and immediately releases back into the scrolling story."
- **Old source:** `src/scene/CameraRig.tsx:521-526` — additive per-frame pointer offsets
  on the camera goal position (`state.pointer.x * 0.03`, `state.pointer.y * 0.02`,
  suppressed during intro), so scroll instantly reasserts framing; object-space hero
  parallax at `TorqueWrenchHero.tsx:365`.
- **New page: NOT implemented.** Only scroll-driven background-layer parallax exists
  (`backgroundLayers.ts` `parallaxRate`); zero `state.pointer` usage in the private
  runtime. It IS specified: `09-design.md:88,116` ("Pointer parallax is additive and
  suppressed during precise reading or fracture beats") — designed but not yet built.
- **Verdict: specified-but-unimplemented (unfinished stages).**

### Plus — overall camera language ("lacks cinematic moves", owner 2026-10-16)
The old page's cinematic choreography (arcs, dwells, sub-sequences — JG-021 "WS1 camera
choreography rebuild", LCD orbit) lived in the `CAMERA_PATH` that the reuse audit ruled
"do not adopt the whole path." The new page rebuilds camera language beat-by-beat and
so far has only opening/ring/cutter cameras. The cinematic language is queued behind
open gates G0–G9 and unstarted Stages 5/6 — this is the direct cause of the owner's
"no real camera movements" impression.

## Requested owner rulings (nothing below is implemented)

1. **Promote F1 to named scope** for the private page (callout-label system, multiple
   locations), replacing "extract later" language in `16-page-safe-reuse-audit.md:125`.
2. **F3:** approve reinstating a rear-LCD dwell beat in the new camera language (old
   dwell windows `.458–.488` available as reference data).
3. **F4:** confirm whether the ring-switch beats are visible in the current build; if
   not, file a Stage-4 verification item.
4. **F5:** confirm implementing pointer parallax per `09-design.md` §pointer.
5. **Ordering:** where these five sit relative to the current Stage 5 (backgrounds) /
   Stage 6 (final offline art) sequence — fold into Stage 6/G7, or pull forward.

— Investigated 2026-10-16 by ZCode (orchestrator + 2 explorer lanes); vault record:
`04-Projects/Portfolio-Site/project-state.md` STATUS UPDATE (2026-10-16).

## Owner direction, second batch (2026-10-16, same session) — camera continuity + priority

Recorded verbatim-intent in the rulings ledger (`00-owner-rulings.md` § 2026-10-16).
Summary and impact on this doc's items:

**Camera continuity ruling (affects F2/F4 and all special sequences):** sequences that
isolate a part (currently Ring Switch, Input Shaft) must keep the camera on one
continuous path — NO abrupt break-away to a new camera position, which is what the
current build does (per-beat `camera` ids cross-faded by `CameraHandoff.ts` — a
smoothstep pose morph, structurally a cut, not a path). The OLD Ring Switch sequence is
the rough model: (1) assembly visible, camera sweeps closer as the part rotates/slides
down the gearbox; (2) assembly fades away, camera orbits the isolated part slightly
while machining happens; (3) these special sequences are where Bullet Time lives
(consistent with the existing `inspection-bullet-time` beat at 0.795–0.835), plus a
second Bullet Time placement at the shattered-glass handle-breakthrough moment.

**Priority ruling — the drawing-breakthrough sequence is fixed FIRST**, before the
parity items above. Sub-items: (A) blue-lightning profile trace + enclosed-profile
crack network, major improvement to match owner references (`C:\Projects\Misc\cracks.png`,
`portal.png`, motion ref `lightning outline.mp4`); (B) cavernous pit under the torn
paper (Higgsfield references; canonical target `03-deep-tunnel-feedback.png`); (C)
Bullet Time as the model shatters the drawing into glass-like shards. Reference/feedback
image locations for all three: `21-owner-reference-image-index-2026-10-16.md`.

Impact on the five rulings requested below: their ordering is now subordinate to the
breakthrough fix; ruling 5 (ordering) resolves to "after the breakthrough sequence
reaches owner acceptance." F4's verification should also confirm the OLD sequence's
camera behavior is the reference standard when ported forward.
