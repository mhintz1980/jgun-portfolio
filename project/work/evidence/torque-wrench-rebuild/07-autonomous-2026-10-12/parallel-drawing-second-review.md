# JG-038 external drawing patch — second independent review and release

Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench; branch
torque-wrench/rebuild; HEAD dc44fb79ed43d6a62db47ae58900afb718ad15d1 (unchanged).
Session window 2026-10-12 ~16:04–16:39 America/New_York, per the owner handoff
jgun-torque-drawing-handoff-2026-10-12.md. Nothing was staged, committed,
pushed, or published; no cross-chat message was sent; the protected
jgun-portfolio sibling was never accessed; node_modules was not modified.

## Reviewer seats

- Parfit — zai/glm-5.3, high (owner's primary reviewer lineup). Initialized, then
  errored on a provider 5-hour usage limit (reset 2026-10-13 06:27 UTC). Closed
  with no review output. Provider provisioning/limit failure, never a source verdict.
- Planck — anthropic/claude-opus-5-5, high (owner-authorized Opus-5.5 fallback
  "in place of astra when needed"). Read-only, self-contained brief, two rounds.
  Round 1: NOT PASS. Round 2: PASS. Ownership released; seat closed after PASS.

## Round 1 verdict — NOT PASS (2 blocking, 7 notes)

1. BLOCKING edgeExtract.ts depthField (259–315): `hasPrimaryError` was set only in
   the outer try's catch, so with no sink a render error followed by a restoration
   failure let `throw cleanupErrors[0]` replace the primary render error
   (contract §2.3 "preserve the original factory/abort error"; criterion E3).
   bakeProfile was already correct: its render try sets the flag before the finally.
2. BLOCKING sheetBake.test.ts (585–633): no fixture combined a render error, a
   restoration failure, and no sink, so finding 1 passed all 49 released tests.
3. NOTE drawingCache.ts (228–239): the 30 s body timer now covers decode/hashing
   and install; tension with contract §2.3 "no-signal legacy callers are unchanged".
4–9. NOTEs: poster tier maps to lite at bake time (per-frame rebind corrects it);
   setBaked(null) adapter improvement within the seam; clearPaperFlexField(null)
   returns true; redundant double syncDetachers push; legacyContext retains caller
   matrices; disposal order differs from §2.3 listing (independent disposers).

The orchestrator independently re-read both flagged regions before editing and
confirmed finding 1 against the actual control flow (catch ordering vs finally).

## Corrections (authorized drawing paths only)

- src/scene/drawing/sheet/edgeExtract.ts: the depthField render try now carries
  `catch (error) { hasPrimaryError = true; throw error }` before its finally,
  mirroring bakeProfile in profile.ts. Error path only; no success-path token,
  geometry, or shader change.
- src/scene/drawing/sheet/sheetBake.test.ts: new loop "preserves the ${surface}
  render error over a restoration failure without a sink" for depthField and
  bakeProfile — rendererFixture(primary 'render', cleanup 'restore'), no sink,
  asserts toThrow(primary), restoration attempted, exactly-once material/target
  disposal, borrowed geometry not disposed.
- NOTE 3 fix attempted and REVERTED: clearing the timer after the body read broke
  the released test drawingCache.test.ts:270 ("applies the body-phase timeout
  through awaited hashing without publishing a late entry"), which asserts the
  timer-through-hashing as designed behavior. drawingCache.ts was restored to the
  released bytes and re-verified at SHA-256 d00fb9bf…6196. NOTE 3 remains an open
  parent-adjudication item (tested behavior vs contract text), not silently changed.

## Serialized CPU rerun (one worker, no file parallelism; owner-authorized)

- Red proof before the source fix: sheetBake suite 51 tests, 1 failed — the new
  depthField case received Error 'restore' instead of Error 'render', reproducing
  finding 1; the bakeProfile case passed.
- After the fix: sheetBake suite exit 0, 51/51.
- Full roster, corrected ninth file (the released ledger label "sheetInkRuntime"
  is src/scene/drawing/sheet/sheetInkRuntime.test.js — a .js file; the initially
  guessed registration.test.ts passes 2/2 alone but is not the roster file):
  poseCore, extractionPose, paperFlex, drawingCache, sheetBake,
  breakthroughGeometry, handwriting, ownerAnnotations tests + sheetInkRuntime —
  exit 0, 9 files / 142 tests (released 140 + 2 new fault fixtures).
- node node_modules/typescript/bin/tsc --noEmit --pretty false: exit 0 observed.
  The three unrelated original-parent errors recorded in the released ledger were
  resolved in the parent lane before this rerun; not this lane's work — parent
  should confirm on its own authority.
- git diff --check: exit 0 (pre-existing unrelated LF/CRLF warnings only).
- No build, server, browser, GPU, or render job was run by this lane.

## Round 2 verdict — PASS (Planck)

Reviewer re-hashed all 19 paths: 17 released hashes unchanged plus the two new
hashes below; drawingCache.ts back at released bytes. Confirmed: finding 1 fully
resolved (primary wins without a sink, restoration still attempted, exactly-once
cleanup intact); finding 2 fixtures genuine (toThrow separates 'render' vs
'restore'; asserts attempted restore, exactly-once disposal, borrowed geometry
preserved); no new issues from the hunks; nothing blocking remains. The reviewer
also corrected its own round-1 NOTE 3 sub-claim: the post-install timer race
cannot happen (entries.set and return run synchronously; only caller abort can
land there). Round-1 NOTEs 4–9 stand as non-blocking observations. The reviewer
did not rerun tests, keeping its read-only boundary; the green results above are
the orchestrator's serialized runs.

## Final manifest (verified 19/19 at 2026-10-12 16:39 ET)

17 paths unchanged from the released manifest in parallel-drawing-review.md, plus:

| Path | SHA-256 |
| --- | --- |
| src/scene/drawing/sheet/edgeExtract.ts | d00397a6f476bc6e969e02616c2470a632fc286ce4e9e81d24332410fac44ef3 |
| src/scene/drawing/sheet/sheetBake.test.ts | 75e42595f634ae02670df62a26c99e7aef61181172c4dfb350eb2d884abb507e |

## Release

The 19-path patch with the two review corrections is RELEASED to the original
parent for integration and runtime verification. Open parent items: NOTE 3
adjudication (drawingCache 30 s timer through decode/hashing vs contract §2.3
"no-signal legacy callers are unchanged"), non-blocking NOTEs 4–9, matched-input
runtime registration, real renderer restoration/context-loss, annotation/pixel
visibility, built-chunk isolation, BFCache, and private integrated runtime
checks. No G0–G9 gate or owner visual acceptance is claimed. All reviewer seats
are closed; this evidence file's authorship is released with the patch.

## Ready-to-paste release prompt for the original parent

Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild.
Read project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/parallel-drawing-second-review.md
first, then parallel-drawing-review.md (its dated addendum supersedes the review
limitation note). The JG-038 19-path drawing patch passed its second independent
review (Opus-5.5/high, two rounds: NOT PASS then PASS) after two corrections:
edgeExtract.ts depthField now preserves the primary render error over a
restoration failure without a sink (mirroring profile.ts), and sheetBake.test.ts
gained the missing combined fault fixtures. Final manifest: 17 released hashes
unchanged + edgeExtract.ts d00397a6… + sheetBake.test.ts 75e42595… (19/19
verified; serialized roster 9 files / 142 tests exit 0; tsc exit 0 observed —
confirm your three original errors are resolved). Integrate in the parent lane:
matched-input runtime registration, real renderer restoration/context-loss,
annotation/pixel visibility, built-chunk isolation, BFCache, and private
integrated runtime checks. Adjudicate open NOTE 3 (drawingCache timer-through-
hashing is tested released behavior vs contract §2.3 no-signal-legacy wording)
and NOTEs 4–9. Preserve unrelated dirty work; never access jgun-portfolio;
commit, publish, or message other chats only per your own owner authority.
