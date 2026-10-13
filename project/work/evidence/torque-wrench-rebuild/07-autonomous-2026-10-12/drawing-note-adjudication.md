# JG-038 released drawing patch — parent adjudication of NOTE 3 and NOTEs 4–9

Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`,
HEAD `dc44fb79ed43d6a62db47ae58900afb718ad15d1`. Authority: incoming parent-integration
instruction of 2026-10-12. Nothing staged, committed, pushed or published. The protected
`jgun-portfolio` sibling was not accessed. `node_modules` was not modified.

Method: every verdict below is grounded in the released bytes at the final manifest
(`parallel-drawing-second-review.md`), read against `extraction-contracts.md` §2.2–§2.3.
No NOTE was resolved by inference from the review prose alone. Where a claim depends on a
HEAD comparison it was taken from `git diff HEAD -- <path>`.

## Parent re-verification before adjudication

- 19/19 released paths match their published SHA-256 (`.scratch/jg038-parent-integration/verify-drawing-manifest.mjs`).
- `node node_modules/typescript/bin/tsc --noEmit --pretty false` → exit 0, no output. The three
  original parent-owned errors recorded in the first ledger (ringGeometry normalMap, two
  privateSheetRuntime `vi.spyOn` string keys) are resolved on current bytes.
- Serialized roster `--maxWorkers=1 --no-file-parallelism` (poseCore, extractionPose, paperFlex,
  drawingCache, sheetBake, breakthroughGeometry, handwriting, ownerAnnotations, sheetInkRuntime)
  → exit 0, 9 files / 142 tests, 30.58 s.
- Scratch production build `--manifest --outDir .scratch/jg038-parent-integration/dist` → exit 0, 16.29 s.
- Both review corrections are present in source: `edgeExtract.ts` and `profile.ts` each set the
  primary-error flag in the render `catch` before `finally` (pattern-verified against both files).

## NOTE 3 — `drawingCache.ts` 30 s body timer through decode/hashing/install

**Ruling: ACCEPT as written. Not a contract deviation. Documentation wording should be clarified.**

What the released bytes do (`prepareDrawingCache`): the header timer (8 s) is replaced by a body
timer (30 s) immediately after the response is accepted, and that timer is cleared only in the
`finally` block. The same statement shape is present at HEAD — the 30 s timer already spanned
`arrayBuffer()` → decode → install there. The change is not the timer's *scope*.

What actually changed at HEAD: only `fetch` observed `controller.signal`. `response.arrayBuffer()`,
`decodeDrawingPayload` and `installDrawingPrecompute` never saw it, so aborting the controller after
the fetch had **no effect** — the 30 s body timer was inert. §2.3 nonetheless describes it as a live
internal timeout that yields `false`/fallback. The released patch makes the existing timer effective
by routing those steps through `abortable(work, controller.signal)` and `checkAbort(controller.signal)`.
That is the behaviour §2.3 already documents, not a new policy.

No-signal callers are preserved in the respects the clause protects:

- `abortable(work, signal)` returns `await work` untouched when no signal is supplied, so hashing and
  decompression add no listener and no race for a legacy caller.
- The outer `catch` calls `checkAbort(callerSignal)` (a no-op when absent) and then returns `false`.
  A legacy caller can therefore still only receive `false`; it never receives `AbortError`.
- Timers are cleared and the caller-abort listener is removed in `finally` on every path.
- Product code has no no-signal caller to regress: `prepareDrawingCache` is reached only through
  `bakeSheet` (§2.2 step 1), and both product call sites pass a signal (legacy adapter
  `DrawingLinework` passes `controller.signal`; the private host passes the resource-scope signal).

The one observable difference for a no-signal caller is the intended one: if the 30 s body budget
expires during decode/hashing/install, the call now returns `false` and the bake falls back to live
CAD instead of publishing an entry. That is the documented body-timeout outcome. The released test
`drawingCache.test.ts` encodes it deliberately; the earlier attempt to clear the timer after the body
read was correctly reverted because it contradicted released, tested behaviour.

**Action:** no code change. §2.3's "No-signal legacy callers are unchanged" should read as scoped to
the abort/throw semantics of that bullet ("must not start throwing `AbortError`; must keep the
false/fallback path"), because the same bullet documents the 30 s body timeout as producing `false`.
The reviewer's round-2 self-correction already withdrew the timer-race sub-claim.

## NOTE 4 — poster tier maps to lite at bake time

**Ruling: ACCEPT. Bounded to a resource hint in the legacy adapter; no user-visible mismatch.**

`DrawingLinework.tsx` derives `const tier = getQuality().tier === 'full' ? 'full' : 'lite'`, so a
poster-tier caller bakes at `lite`. The private host derives its bake and per-frame tier from the
same expression (`store.getState().tier === 'lite' ? 'lite' : 'full'`), so the private lane labels
poster as `full`. The bake tier only selects resource quality (for example `paperFlexTierScale`,
where poster maps to 0); it is not a narrative or geometry decision. A poster-tier document does not
mount the live canvas in either lane (`TorqueWrenchPage` swaps the stage to `Poster`), so an
inconsistent hint cannot reach a rendered frame. Frame application re-derives tier every frame and is
the authoritative value for the frame.

**Action:** none required for integration. If the lane later wants a single convention, normalise both
sites — do not do it inside this release, since it would invalidate `DrawingLinework.tsx`'s released
hash for a hint-only difference.

## NOTE 5 — `setBaked(null)` adapter improvement

**Ruling: ACCEPT. Correct within the seam.**

`DrawingLinework.tsx` sets `setBaked(null)` synchronously at the start of the bake `useLayoutEffect`,
before creating the controller. Combined with the `bakeEpoch` guard and the cleanup's
`controller.abort()` + `installed?.dispose()`, a re-bake cannot present a previous model's sheet while
the new bake is in flight, and a superseded result disposes instead of installing. This is the same
stale/late-result discipline §2.3 requires of the host, expressed in the legacy adapter's own state.
It changes no geometry, typography or shader behaviour and stays inside the adapter seam the release
authorised.

**Action:** none.

## NOTE 6 — `clearPaperFlexField(null)` returns `true`

**Ruling: ACCEPT. Latent API ambiguity, no live exposure.**

`paperFlex.ts` guards on identity: `if (activeField !== field) return false; activeField = null;
return true`. When no field is published, `activeField === null === field`, so
`clearPaperFlexField(null)` reports `true`. `paperFlex.test.ts` asserts `null → false` only while a
different field is live, so the no-live-field case is genuinely uncovered.

Exposure is nil today: the only product caller is `sheetBake`'s disposer
`() => { clearPaperFlexField(flex) }`, which always passes a real published field. The boolean means
"the published field was mine (or none was published), so nothing stale remains" — defensible, but
it conflates "I cleared my field" with "there was nothing to clear".

**Action:** none required. If the API is touched later, `if (field === null || activeField !== field)
return false` plus a test for the no-live-field case removes the ambiguity. Not worth invalidating the
released hash now.

## NOTE 7 — redundant double `syncDetachers` push

**Ruling: ACCEPT. Harmless redundancy.**

`sheetText.ts` pushes `detachSync` at the point the detector is created and again immediately after
`text.addEventListener('synccomplete', done)` (lines 232 and 242 in the released bytes). The
`synccomplete` handler `done` also calls `detachSync` before resolving. On the rollback path the
listener is therefore removed twice; `removeEventListener` is idempotent, and the catch loop already
wraps each detach in its own `try`, so no failure path changes. Disposal and settlement ordering are
unaffected.

**Action:** none required. Removing the duplicate push is a safe one-line cleanup if the file is
reopened for another reason.

## NOTE 8 — `legacyContext` retains caller matrices

**Ruling: ACCEPT. Inherent to the compatibility shim; changing it would alter legacy semantics.**

`extractionPose.ts` holds one module-level `legacyContext = createExtractionContext()` and assigns the
caller's matrices into it by reference on every call (`legacyContext.modelMatrix = modelMatrix`,
`legacyContext.sheetMatrix = sheetMatrix`) before delegating to `applyBoundExtraction`. The shim thus
keeps the last caller's matrices alive and mutates them in place per call. The private lane does not use
this shim: `RuntimeWorld` owns an explicit `extractionContext` via `createExtractionContext` and passes
it to `applyExtractionCore`, so there is no shared mutable context in the new path. For the legacy
caller the previous semantics *were* this reuse; replacing it with fresh allocation would be a behaviour
change in the preserved path, which the release explicitly did not claim.

**Action:** none. Record as legacy-shim hygiene for any future extraction work.

## NOTE 9 — disposal order differs from the §2.3 listing

**Ruling: ACCEPT. Independent disposers; order immaterial.**

`bakeSheet` builds `cleanups` in construction order — `rendered.dispose`, `fracture.dispose`,
`barrierMask.dispose`, `fragmentPrint.dispose`, `crackMask.dispose`, `flex.texture.dispose` +
`clearPaperFlexField(flex)`, then the ink line/fill meshes and `text.dispose`. §2.3 lists the same
coverage in a different sequence. Each entry owns a distinct allocation: the masks take geometry
inputs (`fracture.outline`, `rendered.profilePoints`, `composed.ink`), not `rendered`'s GPU targets, and
the flex texture is disposed before its own field is cleared, which is the only ordering §2.3 makes
load-bearing. `dispose()` is guarded by `disposed`, attempts every cleanup even after a throw, and
reports once through `onCleanupFailure` — so a differing order cannot skip a cleanup or double-run one.
The suite asserts exactly-once disposal for the fault paths.

**Action:** none. If a future resource genuinely shares state across entries, the list must be ordered
then; nothing in the current set does.

## Summary

| NOTE | Verdict | Required action |
| --- | --- | --- |
| 3 — drawingCache 30 s timer through hashing | Accept; contract wording clarification, not a code defect | One-line §2.3 clarification (parent-owned text) |
| 4 — poster→lite at bake | Accept; resource-hint only, no mounted frame | None |
| 5 — `setBaked(null)` adapter reset | Accept; within the seam | None |
| 6 — `clearPaperFlexField(null)` | Accept; latent ambiguity, no live caller | Optional guard if reopened |
| 7 — double `syncDetachers` push | Accept; idempotent | Optional cleanup |
| 8 — `legacyContext` matrix retention | Accept; legacy semantics preserved | None |
| 9 — disposal order | Accept; independent disposers | None |

No NOTE required a source change, so the released 19-path manifest stands byte-for-byte at
`dc44fb79`. This adjudication closes the open NOTE 3/4–9 parent item; it does not close any G0–G9 gate,
does not claim owner visual acceptance, and does not authorize Git delivery.

Remaining parent-lane items after this file: matched-input runtime registration, real renderer
restoration/context-loss, annotation/pixel visibility, built-chunk isolation, BFCache and private
integrated runtime checks.
