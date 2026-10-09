# Fresh review: lifecycle hidden-play harness (producer: lifecycle-harness-fix.md)

**Verdict: concern confirmed. Baseline must be atomic with dispatch, in one page.evaluate. The V2 evidence schema otherwise stands.**

Why: `hiddenEvidenceSnapshot` legs are sequential CDP roundtrips (`read` itself = waitForFunction + evaluate, then recorder, then frame), and `setHidden(true)` is a further roundtrip. The story keeps playing visibly until visibilitychange lands, so `hiddenAdvance` includes baseline->dispatch harness latency — it can exceed .1 s on first-eval/GC jitter and measures the harness, not runtime. Producer's "single pre-dispatch read, never recaptured" policy is right; its baseline is merely not adjacent to dispatch.

Exact fix: replace preDispatch + `setHidden(true)` with one evaluate:

`baselineAt=performance.now(); playhead=clone(__inspection); recorder=clone(__g1Recorder); frame=clone(__g1Rendered?.last); define visibilityState/'hidden' exactly as setHidden; dispatchAt=performance.now(); dispatch visibilitychange; return {baselineAt, dispatchAt, playhead, frame, recorder:{statuses,tuples,synchronousTuples,counts,recorderErrors}}`

Baseline and dispatch share one JS turn: inter-trip skew drops to microseconds and is recorded via the stamped pair. Reads precede dispatch, so evidence stays pre-dispatch.

Preserve unchanged: assertion `hiddenAdvance >= 0 && hiddenAdvance < 0.1`; bounded ack wait 500 ms/50 ms (its latency accrues inside the hidden window, preserving strictness); immediate-post/acknowledged/after-3 s snapshots as evidence only; all-failures-thrown-after-persistence; no post-ack baseline recapture. The 3-trip afterHiddenWindow read only lengthens hidden duration (strengthens the bound) and may stay; optionally stamp performance.now() there too. No weakening introduced.

## Amended verdict after producer correction claim (diff re-inspected, no transcript)

**FIX-FIRST.** The producer reported baseline+dispatch atomized in one page.evaluate, but the actual current path does not contain it: working diff of scripts/verify-manufacturing-inspection.mjs is byte-identical to the originally reviewed version (nothing staged, no new commits; last touch 524bdb4). `hiddenEvidenceSnapshot` still runs read (waitForFunction + evaluate) -> recorderSnapshot -> frame evaluate as three sequential roundtrips, and `setHidden(true)` remains a separate dispatch roundtrip after the baseline. The lifecycle-harness-fix.md packet text is also unchanged and still describes the pre-dispatch read as "immediately before" dispatch, which it is not.

Context note: this section is a mid-work snapshot taken before the producer's atomic fix landed; it is not a rejection of a completed correction claim. Re-review is deferred until the parent signals the modified file or producer final is ready.

Original issue therefore stands unchanged: baseline playhead predates dispatch by at least the inter-trip latency of the remaining snapshot legs plus the dispatch trip; that playing-visible time is added to `hiddenAdvance` and can breach .1 s from harness jitter alone. Required correction is exactly the previously specified atomic evaluate (baselineAt/dispatchAt stamps, playhead/recorder/frame clones, identical visibility overrides, dispatch last in the same turn). Acknowledgment wait, evidence-only later snapshots, assertion text, and persistence-before-throw remain correct as reviewed.
