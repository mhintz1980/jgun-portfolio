**Verdict: SHIP** (W1 lifecycle/DOM shell leaf only; shared InspectionScene/CameraRig integration explicitly not certified).

**Test rerun:** blocked by this session's read-only sandbox — vitest cannot create its temp/cache dirs (`EPERM mkdir`, even with `TMP` redirected into the repo; the default loader also cannot read above the workspace root). This is an environment limit, not a code failure. I instead traced all 26 test bodies line-by-line against the implementation; the gate's recorded 14:27:59 run of the exact four-file command is consistent with the current source.

**Findings**

- LOW `src/components/RingInspection.tsx:71` — the focus guard listens for `focusin`; programmatic focus moved to `document.body` fires no `focusin` in some engines, so the guard would not refocus. Tab wrap, click-outside (inert), and focusable-element escape are all covered and proven in `dom-report.json`; residual risk is minimal.
- LOW `src/state/inspectionStore.ts:19` — the legacy `playing` setter writes `userPlaying` without epoch/status checks. Intentional compat bridge for the old ring driver (comment at :18), removed by W2; harmless while mounted.
- INFO `src/state/inspectionStore.ts:150-155` — retry restarts at chapter 0/time 0 rather than the failed chapter. Unspecified in §3–§4; acceptable.
- INFO `src/scene/inspection/session.ts:69-77` — `createVisibleLoadDeadline` is unwired support; the production 15 s wall timer still lives in W2's scene, matching the leaf boundary in notes.md:31.

**Checklist results**

- Idempotent exit: `inspectionStore.ts:93-104` no-ops unless active; `setScrollState(entry)` exactly once; proven by test :54-68 (second exit after scroll mutation changes nothing, no notify).
- Epoch scoping: `current()` :105 gates fail :131, status :137, runtime :142 (stale runtime disposed, same-instance repeat is a no-op), retry :150, controls/seek/play :106-123; session `fail` :37 and `loadLease` :6-7 are epoch-scoped; tests :69-76, :159-182, session.test :25-30, lifecycle.test :34-43.
- Playhead: :158-170 mutates scalars only, clamps delta 0.05, rejects repeated/older/NaN stamps and negative delta, freezes time and `entryElapsed` while suspended (no catch-up: tests :88-103), manual pause survives hide/show (test :88-95 plus live DOM proof).
- Absolute seek/chapter/replay and end hold: :113-123, :106-112; end clamps at duration with no auto-exit (tests :113-118, :132-153); DOM proof verifies seek-to-end hold and Replay reset.
- DOM: focus trap :62-71, dynamic inert with recorded restore :48-57/:100, removed-trigger fallback chain with temporary tabindex :105-114, 44px via CSS :2/:14/:17, labeled seek with `aria-valuetext` :118-125/:145-147, Return/Escape enabled in every status :63/:138; `dom-report.json` shows four passing cases, zero errors, zero CAD fetches.
- Session ownership: abort-before-dispose, dispose-once with broken-cleanup tolerance, late-`own` disposal, refcounted borrows released without disposing the cache (`session.ts:28-64`, tests :5-24).

Documented deviations (runtime `root`/`ready`, DI session factory) match notes.md and the accepted contract-review clarifications.