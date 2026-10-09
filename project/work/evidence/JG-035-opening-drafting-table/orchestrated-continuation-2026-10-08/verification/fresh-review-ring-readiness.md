# Fresh review — ring readiness and midpoint

**Verdict: SHIP for verifier-only correction; runtime acceptance remains unclaimed.**

The diff makes exactly two semantic changes. First, the loaded-case wait now requires `toolMeshes > 0`; `ringRuntime.ts` assigns that census only after the async knurling GLB fetch and parse. This addresses a harness readiness race without weakening the retained exact assertion, `toolMeshes === 12`. A wrong non-zero asset count would still fail.

Second, adding the 8.575 s sample closes the oracle’s reopen-ramp midpoint gap. The formula is unchanged; 8.575 is the midpoint of 8.2–8.95, while 8.6 and 8.95 remain endpoint/near-end checks. No threshold or production behavior changes.

Independent CPU GLB parse: 12 mesh nodes, 18 nodes total; asset SHA-256 `e5bff99439eb6655…c8fbd8`. Updated verifier SHA-256 `fa8a0adaa157efa…91bf0bd8`, matching the producer record. `node --check` and `git diff --check` pass.

Classification: verifier readiness race, not asset census drift. Focused/full ring rerun is still required in a future explicit GPU slot.
