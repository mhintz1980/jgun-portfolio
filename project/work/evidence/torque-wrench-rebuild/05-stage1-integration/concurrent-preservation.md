# Concurrent preservation observations

2026-10-12 (America/New_York). Initial baselines in `baseline.json` remain immutable; a changed continuation digest is not silently rebased into a preservation pass.

The 273 tracked product paths retain SHA-256 `bfbdf1f7a819c54366a6f757148517729cda7517f756137f036c36afb4e9dd79`. All ten shared interface hashes and the 18-file foundation manifest match. Concurrent doc19 retains `e5abebf5bb3fe2ebaccc2ce87099f72ff65ff2c45c9a3e8d896b617da095f52a`.

During this task, source inspection found these changes outside every delegated/parent write set:

| Path | Observed modification time (UTC) | Current SHA-256 |
| --- | --- | --- |
| `project/work/evidence/torque-wrench-rebuild/04-stage1-foundation/next-session-orchestrator-prompt.md` | 2026-10-12T04:27:50.864Z | `fbb77669857a53e3c263b78c974edfc45258539c5bf0b3449dfa69038e1e8184` |
| New `project/work/evidence/torque-wrench-rebuild/04-stage1-foundation/example-stage1-model-selection-prompt.md` | 2026-10-12T04:32:55.278Z | `2d1a314bbb8da4c625326890c823518edbfb19dd904dc366725c919ebd823d5e` |

Neither the parent nor either child was assigned or wrote those paths. The actor is not established. Their bytes were preserved without rollback, copying over them, or claiming authorization for them.

With the new external addition included, the continuation selections now contain 76 and 133 files respectively, rather than initial 75/132. At the observation above, their digests are `8204741f33c69043f044240a6cf998c66287019a66c2ae40aeff15b690e651b3` and `452bc24d3c1c1e13ce0e29aff71767f561f7045900108a4909202a8bb3d84318`. These are current observations, not replacements for the initial baseline and not a claim that all existing continuation bytes remain identical. Initial per-file hashes were not retained for every continuation file; modification times and focused inspection identify the observed concurrent paths, without proving an exhaustive actor attribution.

The task's sole added source path is `scripts/verify-torque-static.mjs`; all other task writes are under evidence `05-stage1-integration/`. No existing product or shared file needed an edit.
