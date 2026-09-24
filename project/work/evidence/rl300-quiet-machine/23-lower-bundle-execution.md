# Evidence 23 — 2026-09-24: lower-bundle completion (Astra rank 1+2)

STATUS: implemented, gated, reviewed, pushed — **awaiting the owner's visual ruling** on
`lower-fix/contact-sheet-2026-09-24.png` (entry through the gap + the merged join, plus the
open fan-piercing question in §5 defect 1). Next: acoustics design (handoff 22 §4).

Executes handoff 22 §2 (the "lower intake handoff" fix-first item). Cycle id `lower-fix`;
scratch harnesses under `.scratch/lower-fix/` (never committed).

## 1. Measurements (before any design — measured geometry beats prose)

All against `flow.ts`/`LowerIntake.tsx` @ 0c3e098 + `public/models/msp-enclosure.glb`
(draco-decoded in node; harness `.scratch/lower-fix/measure.mjs`):

- **Authored louver open bands** (raycast down, uniform for every x lane in ±.35):
  8 inter-slat gaps, each ~19 mm: z `[.526,.545] [.587,.606] [.648,.667] [.709,.728]
  [.770,.789] [.831,.850] [.892,.911] [.953,.972]` (+ 4 edge slivers outside the rails).
  The OLD spine crossed the panel plane at z=.7893 — the exact edge of the `.770-.789`
  band, so the fanned ribbons pierced slats.
- **The belly is genuinely open** over the louver footprint (x ±.378, z .449–1.052):
  prepareModel drops the CAD liner `V2RL300-SAF-1047-5` and the GLB has no other metal
  there (nearest kept triangle 165 mm above the crossing). Astra's 2026-09-16 numbers
  ("highest sampled Y ≈ .083 vs liner .153") are confirmed STALE — superseded by the
  fe8ca64 duct reconstruction + v4 mesh.
- **Old tail gap**: `lower.at(-1)` [-.25,.87,-.32] sits **59.2 mm** from the merged curve
  at t=0 (item 1 verified).
- **Merged curve root samples** (centripetal .5): t=.06 → [-.305,.898,-.414], tangent
  ≈ (-.07,.27,-.96); GLB clearance 91.5 mm there.
- **Climb corridor** (v4 re-check): the pinch is the `keep`-ruled EMG panel
  `RL300-EMG-1001-P-1` (slanted tri, lower corner (-.37,.46,-.31)); the old lane holds
  ~23–25 mm through its y-band .46–.61, 65 mm+ elsewhere. A first retune dropped to
  13.7 mm — rejected; final lane keeps the old lane through the band and bends outboard
  only above y≈.65 (52–92 mm clearance).
- **Ground plane** at y=-.22 (`QuietMachineScene.tsx:158`); old start y=-.14 floated
  mid-crawl-space — the "appearing beneath the machine" read.

## 2. Design (architect), pinned in `.scratch/lower-fix/score.mjs` (ALL CHECKS PASS)

New `SPINES.lower` (9 waypoints; entry through measured gap, duct ride ≥15 mm centerline
clearance, old climb lane, tail ON the merged curve):

    [-.18,-.10,.774] [-.18,.05,.772] [-.18,.105,.640] [-.18,.092,.300] [-.18,.098,-.100]
    [-.17,.30,-.300] [-.21,.62,-.320] [-.26,.78,-.375] [-.305,.898,-.414]

Scored: panel-plane crossing at z=.7799 (center of band [.770,.789], ±10 mm margins);
handoff 0.29 mm to merged curve; max turn 7.57°; min circumradius 53 mm; arc 1968 mm
(old 1982 — pacing unchanged, draw window `smooth(.41,.60,u)` kept).

## 3. Dispatch + review (pair-dispatch protocol)

- **Producer: GLM** (`zai/glm-5.3-flash` via ocx/codex, seatwrap-wrapped, spec
  `.scratch/lower-fix/spec-impl.txt`). Served-model proof: ocx proxy-log rows
  `zai/glm-5.3-flash` 200, conv 980be40b. One flagged deviation, ACCEPTED: spec's
  `const [sx, sy, sz]` unused-`sx` (TS6133 under noUnusedLocals) → `[, sy, sz]`;
  spec bug on the architect's side, minimal correct fix.
- **Adversarial review: DeepSeek DIED** — 402 Payment Required (Insufficient Balance)
  ~78k tokens in, no verdict; re-probe confirmed persistent. **Re-routed to the s1
  stack's review seat `gpt-5.6-luna` high** (different vendor family from the GLM
  producer, so cross-vendor independence holds). Verdict: see §5. DeepSeek needs an
  owner top-up before the next GLM-produced cycle.

## 4. Gates (architect-run, not seat-reported)

- `npx tsc --noEmit` → 0.
- `npx vitest run --configLoader runner` → **98 passed** (97 + 1 new test
  'routes the lower supply in through the louver opening and onto the merged discharge').
- CRLF preserved in both edited files (0 lone LF).
- Rebuild + :4173 restart; telemetry-verified captures at 11 stops
  (`.scratch/lower-fix/{before,after}/`).
- **Pixel-diff** (`pixdiff.json`): 0.000% changed at u .05/.34/.41/.95 (no lower ribbon
  drawn); 0.016% at u=.45 (30×14 px patch at the crawl-space head); 0.15–0.59% at
  u .50–.82 localized to the lower-bundle corridor + merge region; nothing else moved.
- Owner contact sheet: `project/work/evidence/rl300-quiet-machine/lower-fix/contact-sheet-2026-09-24.png`
  (full frames u .45–.70 before|after + zoomed louver-entry and merged-join crops; raw
  stops + telemetry + pixdiff.json in `.scratch/lower-fix/`).

## 5. Review verdict (gpt-6-astra high, 102.8k tokens, full attack table — log in scratch)

**Verdict: "rethink" → resolved to SHIP-WITH-DISPOSITIONS after fix 1.** Defects + architect
dispositions:

1. **Major — fanned ribbons pierce louver blades (5/6 desktop) and the duct top (3/6).**
   Reproduced by the reviewer with segment raycasts + strict box-interior checks. DISPOSITION:
   accepted as fact, NOT fixed this cycle. It is the pre-existing look-class (a4f1fdd: 4/6
   blades; the ±48 mm fan physically cannot thread 19 mm gaps — same physics as the
   owner-approved main entry through the hex openings). Compressing the lower fan at the
   openings is a visual-design decision → goes to the owner with the contact sheet
   (`lower-fix/contact-sheet-2026-09-24.png`); if he flags it, the next cycle narrows the
   fan/width through the openings (lower-only, spines untouched). The duct-top piercing can
   also be mostly cleared by deepening the duct ride to y≈.065 — documented as the ready
   move, not applied unilaterally.
2. **Major — the new test passed vacuously on bypass routes.** Reviewer proved it with an
   in-memory spine mutation through real vitest (bypass under the machine, crossing the
   panel plane outside the footprint; collector/duct loops ran 0 assertions). **FIXED** —
   fix 1 (GLM again, seatwrap, spec `.scratch/lower-fix/spec-fix1.txt`): crossing pinned
   to the panel footprint (z .449–1.052, |x| ≤ .378) + non-empty sample counts in all three
   clearance regions. **Verified with the reviewer's own probe** (teeth.probe.ts): the
   bypass mutant now FAILS the extracted live test. Gates after fix: tsc 0, 98/98, CRLF
   clean (446/0).
3. **Minor — `const [, sy, sz]` deviation from the spec's verbatim test.** Reviewer
   confirmed the spec's own version cannot typecheck (TS6133, noUnusedLocals). Accepted:
   spec bug, contract corrected in this evidence.

Reviewer's failed attacks (all with executed evidence, log in scratch): waypoint
transcription exact (9/9 string match); main/merged byte-identical vs a4f1fdd; CRLF intact;
no existing test weakened/reordered (22→23 exactly); centerline has zero solid
intersections; crossing rays −4/0/+4 mm all miss; 430 assertions non-vacuous on the real
spine; handoff 0.287–0.265 mm (denser sampling); max turn 7.566°, min circumradius 52.9 mm;
parallel transport ≤ 6.6 mm jumps; AirRibbons/LowerIntake/shot.ts match HEAD.

**Seat escalation record (why the review is astra, not DeepSeek):** DeepSeek died at 78k
tokens with HTTP 402 Insufficient Balance (persistent on re-probe — the account needs a
top-up before the next DeepSeek turn). gpt-5.6-luna stalled twice at ~16.5k tokens
(single-turn preamble, Stop hook, no work — deterministic). Escalated to gpt-6-astra high
per the twice-failed-escalates rule; it delivered the full review. Producer GLM and
reviewer astra are different vendor families, so cross-vendor independence held.

## 6. Residual notes

- Fan-vs-metal at the EMG panel band: centerline ~23 mm, worst fan edge may graze the
  panel — status quo from a4f1fdd's lane, not a regression; not owner-flagged.
- Lower bundle is unclipped by design (`AirRibbons.tsx` createMaterial(null,false)) —
  unchanged this cycle.
