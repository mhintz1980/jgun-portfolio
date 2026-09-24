# Evidence 25 — 2026-09-24: acoustic-beat execution (Astra rank 3, design v2)

STATUS: implemented, adversarially reviewed, fix-closed by the reviewer's own audit,
gated, captured — **awaiting the owner's visual ruling** on
`lower-fix/acoustic-contact-sheet-2026-09-24.png`. Design contract: evidence 24 (v2).

## 1. What shipped (per evidence 24 §2)

- **Measured contacts** (`flow.ts` SOUND_TARGETS + SOUND_FACES): fronts terminate ON
  measured baffle faces — A (top face, absorption), B (+z slab, angled), C (slanted,
  graze), D (far-side face, cross-duct). Old targets floated 8.8–144 mm off.
- **Staggered sweep** (SOUND_WINDOWS [.760+.012i, .820+.012i]); last contact .856.
- **Junction collision** (fragment): fronts hold full alpha through their contact
  endpoint; terminal samples (vT ≥ .85) collapse ×.25 anchored at the face in a .006-u
  ramp + a ×1.25 terminal flash reinforcement (narrow band, junction-only).
- **Deflection stubs** (kind 2): glancing continuations in the face planes, lengths
  .08/.10/.13/.07, alpha ceilings .50/.45/.35/.50 (inverse to length), ignite at their
  contact fire, self-extinguish .87–.895.
- **Chevron isolation response**: one bounded rise-settle (+30% max, u .856–.894) after
  the last contact; hue/geometry/positions untouched.
- Dead code removed (baffleContact/intervalGap/BAFFLE_*). Air bundles, envelope,
  budgets, all pre-existing tests untouched.

## 2. Dispatch record (pair-dispatch; log `.scratch/lower-fix/`)

1. **Producer GLM** (spec-acoustic.txt): the shell was killed mid-run (external kill,
   exit 137) after flow.ts + shaders landed; orphaned codex procs verified wedged (499,
   no writes in 75 s) and terminated before redispatch.
2. **Resume GLM** (spec-acoustic-resume.txt): soundPaths + test + CRLF normalize; flagged
   the dead baffleContact chain (TS6133) — spec omission, correct discipline.
3. **Fix 2 GLM** (spec-acoustic-fix2.txt): dead-chain deletion; tsc 0.
4. **Reviewer**: DeepSeek died AGAIN mid-review (429 rate-limited, 13k tokens, no
   verdict; it had been topped up after the morning's 402). Re-routed to
   **gpt-6-astra at MEDIUM** (owner cap). Verdict **fix-first**, both findings real:
   - MAJOR (spec bug, mine): the head-feather still keyed off the envelope uExtent, so
     at a front's contact fire its terminal region was INVISIBLE (audit: terminal alpha
     0 at u=.82) and stubs rendered DETACHED (front end 159 mm short while the stub
     glowed) — her detached-pulse red line.
   - MINOR: test mutations survived (front endpoints, terminal membership, length
     tolerance).
5. **Fix 3 GLM** (spec-acoustic-fix3.txt): head-feather follows each strip's own gate;
     fully-drawn fronts hold full alpha through the contact endpoint; test teeth added.
6. **Closure proven with the reviewer's own instrument** (`review2/audit.cjs`): terminal
   alpha at fire now .47/.58/.67/.72 (was 0), no DETACH line, stubs attached. Her
   successful-attack list is in the log; every other attack failed with evidence
   (transcription exact, geometry exact, plane distances ≤ .0007, smoothstep ordering
   safe across 651k evaluations, air/envelope/dead-code/CRLF clean, .90 exactly zero,
   chevron response ≤ 1.3).

## 3. Gates (architect-run)

- `npx tsc --noEmit` → 0. `npx vitest run --configLoader runner` → **10 files, 99/99**
  (98 + 1 new). CRLF pure in all three files.
- Rebuild + :4173 restart; telemetry-verified captures at 16 stops
  (`.scratch/lower-fix/sound-after2/`, draws 99–102 within budget).
- Pixel-diff (before vs pre-fix3 build, `.scratch/lower-fix/sound-pixdiff.json`): 0% at
  u .76/.78; localized 0.04–0.42% growing through the sweep, all inside the
  baffle-field bbox — no change anywhere else.
- Contact sheet: `project/work/evidence/rl300-quiet-machine/lower-fix/acoustic-contact-sheet-2026-09-24.png`
  (before|after at u .78/.82/.84/.86 + encounter detail at .845/.865/.875/.895).

## 4. Notes / residuals

- Reduced motion: full extents render statically (encounter resolved, response u-gated)
  — per the supplied design; reviewer confirmed gates hold.
- Chevron response visibility at full-frame scale is the owner's call (Astra's concept
  note: the flash is the weakest cue; the junction is the story).
- Next: Astra re-clear packet (one call, her missing-evidence list verbatim — louver
  close-up, acoustic evidence, fwd/rev capture through hairpin+merge, terminal closure)
  after the owner's rulings on both contact sheets.
