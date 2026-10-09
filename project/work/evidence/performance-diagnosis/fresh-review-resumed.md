# Fresh-context resumed review — P1 quality timestamp diagnostic

Date: 2026-10-08 (local). Read-only source review; no production or helper
edits, no build/browser/GPU run. Reviewer model: glm-5.3 (structural review
only; the earlier fresh-review.md notes its own served receipt was
unavailable — that honesty boundary is preserved here).

## Verdict

**SHIP (source-level).** The diagnostic is opt-in, bounded, discrete, and
behavior-preserving. The runtime opening-collapse hypothesis remains UNPROVEN
until the prepared capture actually runs on a fresh instrumented build; this
review makes no runtime claim.

## Confirmed against the live diff (git diff HEAD -- src/scene/SceneCanvas.tsx)

- Opt-in guard — SceneCanvas.tsx:86: module-load
  URLSearchParams(...).has('qualityDiagnostics'). Disabled path: one boolean
  check per event site, no buffering, and window.__qualityEvents is never
  installed (:112-113). Default render/quality path unchanged.
- Bounded 256 — :80, :97-98: shift-oldest ring; __qualityEvents() returns
  qualityEvents.slice() (:113). Discrete lifecycle moments only; no per-frame
  writes, no React state; app code never reads the buffer.
- Warm cancellation vs finish — :280-307: warmfinish fires only at true
  completion, after warmReady=true (event stamps warmReady:true); warmcancel
  covers station-miss, blocked/cancelled, lease abort, throw, and the
  terminal cancel-after-final-loop case. No double-emit path found.
- Callback timestamps — performance.now() is stamped synchronously inside
  onDecline/onIncline/onFallback, setDprStep, and warm/cull sites. Installed
  drei PerformanceMonitor.js:47 samples the same performance.now() clock;
  PerformanceMonitorApi.fps/.flipped exist in the installed .d.ts (type use
  is sound).
- Step mirror sound — setDprStep (:401-407) is the sole writer of
  stepRef.current and mirrors qualityEventStep; no stale stamps.
- Behavior unchanged — bounds [45,60], flipflops={3}, DPR staircase, degrade
  ratchet, warm-loop combinations/order, and visibility save/restore are
  identical; .entries() adds an index only.

## Helper + receipts

- node --check on helpers/capture-quality-events.mjs: exit 0.
- Helper polls only window.__qualityEvents() and the pre-existing
  window.__telemetry (src/state/scrollStore.ts:385); writes evidence JSON
  only; header correctly flags frozen build 5203 as lacking the API.
- Existing receipt honored: npm run typecheck exit 0 re-run after the guard
  (source-preparation-report.md). Not re-run here per task constraints.
- Prior FIX-FIRST items resolved in live state: terminal warmcancel present;
  stored SceneCanvas-quality-events.patch patch-id
  aa4302f97d5f8b767070d907875b0fed45ad0e22 matches the live diff; 5-parent
  helper import confirmed.

Codebase graph was not relied on (direct reads only), so the missed-lines
coverage invariant was not triggered.
