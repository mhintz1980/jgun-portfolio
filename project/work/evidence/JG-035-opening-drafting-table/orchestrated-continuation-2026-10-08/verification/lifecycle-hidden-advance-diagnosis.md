# Lifecycle hidden-advance diagnosis — read-only

**Evidence.** Desktop V2 clicked Play, waited 300 ms, read time 1.3866 s, synthesized document hidden, waited 3 s, then read 1.6360 s: advance 0.2494 s. Narrow advanced 0 s. Manual pause remained exact across hidden/show in both widths.

**Code path.** RingInspection’s visibilitychange listener calls setInspectionSuspend(hidden). InspectionDriver then calls advanceInspectionPlayhead before runtime sampling; when suspend is hidden, advance returns without changing time. Accepted playing deltas are clamped to 0.05 s. The observed 0.2494 s is therefore about five clamped playing frames that still saw suspend=none—not one raw 3 s delta and not chronometer drift.

**Classification.** This is a desktop-only visibility-command/listener race, not a deterministic story-speed bug. The failed check throws before recorderSnapshot is persisted, so sample/frame stamps for those five frames are absent; a stale epoch or listener not yet receiving the synthetic event cannot be distinguished from the saved report alone.

**Correction proposal.** First, verifier-only: after dispatching hidden, bounded-wait for inspection.suspend==='hidden' (about 250 ms), fail distinctly if not observed, and persist recorder tuples/sampleStamp snapshots on V2 failure before the 3 s measurement. Second, if that confirms the app misses the event rather than harness lateness, move visibility handling from the dialog effect to one global inspection-lifetime document listener keyed to active/epoch, so suspend updates do not depend on RingInspection effect timing. Keep the 0.1 s bound unchanged.
