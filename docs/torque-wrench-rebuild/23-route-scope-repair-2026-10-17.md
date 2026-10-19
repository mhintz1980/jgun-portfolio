# JG-038 route-scope repair — 2026-10-17

Baseline: `torque-wrench/rebuild`, HEAD `387c8875b1d2a19b0cc9d3e088df0aa7541efdb9`.
Authority: owner requested the private route correction; no new commit, push, deployment,
public cutover, whole-commit rollback, or inferred visual acceptance. Handoff 22 governs
creative direction. This task changes navigation/copy only; mechanics, camera, content,
private rendering, shared materials and inspection contracts remain intact.

## Keep/revert/adapt decision before source edits

| Prior committed path | Decision | Reason |
| --- | --- | --- |
| `src/scene/SceneCanvas.tsx` | Keep on legacy route; no port | Root PMREM, gain curve and renderer tuning belong to the old station composition. |
| `src/scene/PostProcessingComposer.tsx` | Keep on legacy route; no port | Private composer already owns AA, buffers, DPR and dither. |
| `src/scene/rig/materials.ts` | Keep unchanged | Shared role gain/filtering/clone fixes also serve private runtime and inspections. |
| `src/components/ToleranceStations.tsx` | Keep on legacy route; no port | Private composition does not mount this overlay. |
| `src/scene/TorqueWrenchHero.tsx` | Keep on legacy route; no port | Private directors own mechanics/camera and deliberately omit optional pointer input. |

Adapt only private page chrome: its TORQUE WRENCH navigation must remain on
`/torque-wrench/`, with current-page semantics and quality propagation, while sibling
links remain available. Do not change the shared page registry or public navigation.
Replace misleading pending-scene/placeholder prose in the private header/footer with
story copy; retain truthful existing poster placeholders until offline art is delivered.
No legacy code deletion or selective rollback is needed to meet this route repair.

## Ownership and wave ledger

| Lane | Configured seat | Ownership | Dependency/status |
| --- | --- | --- | --- |
| Scope reader | `zai/glm-5.3-flash`, high, configurable default role | Read-only source/import/test audit | Alongside parent; graph generation Oct 14 is stale, direct source required. |
| Parent | Current parent | This ledger; task evidence; preview/browser/build/integration | Route mapping fixed before worker dispatch. |
| Private chrome | `zai/glm-5.3`, max, configurable default role | `TorqueWrenchPage.tsx`, new `PrivatePageNav.tsx`, existing `TorqueWrenchPage.test.tsx` only | Consume existing shared PageLink/publicPages APIs; no shared writes. |
| Focused reviewer | Pinned `tier-reviewer`, `gpt-6-astra`, medium | Read-only final diff and route evidence | Owner selected this fallback because Opus 5.5 is absent from live spawn contract. |

Named native tier roles have immutable pins; GLM seats use the configurable default
role. Settings above are requested/configured; backend identity is not independently
attested. Parent serializes GPU/browser/build resources. No full suite, AC matrix or
creative review campaign is part of this focused route repair.

Reader completed a read-only audit from direct source and released ownership. Private
entry → TorqueWrenchPage → cadGate → Scene → RuntimeWorld/BackgroundWorld imports
no legacy App/HUD/station composition. RuntimeWorld's model is `/models/Default.glb`;
its shared materials and inspection imports remain relevant. Shared nav/registry tests
explicitly pin public root navigation until cutover, supporting the page-local adapter.

Initial refresh: HEAD matches baseline; tracked dirty paths are `GATES.md`, `TODO.md`,
`project/context/agent-skills.md`. Existing untracked work and `.scratch/` are protected.
`:5281` was unavailable; parent started a task-owned preview there. HTTP 200 at
`/torque-wrench/` serves title `JGun Torque Wrench · Private Rebuild` and the distinct
`/assets/torque-wrench-DB17AxzX.js` entry before edits. Other owners' `:4173` process is untouched.

## Verification

Before edits, the served private runtime reached `ready: true`, `mode: live`, mounted
canvas and all three private probes on AMD Radeon 780M ANGLE/D3D11. No legacy probe,
legacy HUD DOM, RL300/M249 model request, or browser error was observed. The only
model request on that fresh load was `Default.glb`. Both navs incorrectly linked
TORQUE WRENCH to `/` and omitted current-page semantics. Served HTML matched local
dist bytes; baseline entry identity is recorded in the runtime JSON.

Parent artifacts: `output/playwright/jg038-route-scope-20261017/` contains the focused
runtime script, baseline JSON/capture and preservation fingerprints. Fingerprint scope
is existing modified/untracked files, `.scratch/` (including ignored files), protected
models/roadmap, shared nav/registry and the five prior committed source paths: 5750
files, of which 4238 are scratch. The initial broader tracked-file hash attempt was
stopped; the final bounded before-manifest completed before worker edits.

The first baseline browser attempt under context-mode's Bun runtime timed out during
launch. The task-owned process exited; the saved script then ran successfully under
Node with the repository's hardware Chrome launcher. No browser/runtime claim relies
on that timed-out attempt.

Independent reviewer Mendel completed the bounded source review: **SHIP**, no
actionable defects. Review covers the private adapter, private page/copy and test
diff against existing shared APIs. It confirms quality/current/fade semantics,
reserved M249 text, sibling links and unchanged public registry/rendering/materials.
Reviewer performed no writes, tests, builds or browser operations; ownership released
and agent closed. This is source review only, not candidate runtime or owner acceptance.

## Delivered source and checks

GLM/max worker Huygens delivered only `TorqueWrenchPage.tsx`, new `PrivatePageNav.tsx`
and `TorqueWrenchPage.test.tsx`, then released ownership and was closed. No shared
writes. Private adapter substitutes the public jgun row only in this document, reusing
PageLink for tier/fade/current semantics; header/footer labels are distinct. The page
copy no longer says the live scene is pending. Offline poster art remains explicitly
pending; existing fallback placeholders are untouched.

Owned source SHA256:
- TorqueWrenchPage.tsx: `a389fb3958324f3b05dd59744169d6adfabf2a256ceaa18351678477d0981a82`
- PrivatePageNav.tsx: `79330fc82ca439ea695bd632156eba8c710e0ff861a750f6e07250c8ae061728`
- TorqueWrenchPage.test.tsx: `f12a5f17a84c420bace910e5ac01c74189a910b998de049e7ca6f4d80b0ed198`

Worker page test: 5/5 passed. Parent focused run covered page, shared PageNav,
registry/pages, pageTopology and cadGate: 87 passed, one 15-second cadGate cold
Scene-import timeout. Isolated cadGate rerun after GPU work: 2/2 passed in 3.99s.
The other four files passed all 86 tests. No source change was needed. An earlier
worker CLI attempt used unsupported --minWorkers and ran no tests; valid run used
--maxWorkers=2. No full suite/AC roster was run.

Parent `npm run build` passed TypeScript and Vite (782 modules; existing >500 kB
chunk warning). Task-owned preview stopped/restarted after build on :5281. No other
server was stopped. `git diff --check` passed on owned source; source hashes match
worker handover. HEAD unchanged; index empty.

First candidate browser run reached private ready and correct forward/reverse
progress on desktop and narrow. Self-navigation, sibling target, back and forward
were correct. Reduced motion was static with no canvas/CAD. No browser console or
page errors, legacy HUD or forbidden model requests. Two harness assertions failed:
reduced mode correctly carries quality=poster but the assertion expected full; a
forced navigation after self-reload aborted an in-flight drawing-cache request.
Preserved as `candidate-runtime.json`. Harness corrected expected quality and waits
for network idle before the next forced navigation; no product edits or rebuild.

Preservation after-check: **5750/5750 unchanged**, including scratch, owner dirty
files, protected models/roadmap, shared nav/registry and all five prior commit source
paths. See `preservation-before.json` and `preservation-after.json`.

## Final focused runtime and review URL

`candidate-verified-runtime.json` records desktop/narrow live readiness, private probes,
five chapters, self links, forward `.34 → .62 → .94` and reverse `.34` matching
narrative progress within .00002, no legacy composition or forbidden model requests.
Reduced motion records static mode, no canvas/CAD, five chapters and tier-correct
poster links. All console/page error arrays are empty. That attempt retains one
conservative failed desktop request assertion for the drawing-cache cancellation;
network idle after reload does not prevent the prior document's cancellation.

`navigation-final-runtime.json` is the final desktop navigation supplement: all nine
focused checks pass (exit 0), with request-failure events tagged by phase. Any
`net::ERR_ABORTED` cancellation occurred only in `deliberate-document-navigation`;
unexpected request failures and console/page errors are absent. It also repeats
private readiness, forward/reverse and same-URL self-click, sibling target with
quality=poster, browser back to private and forward to sibling. No diagnostic forcing
of world/store state was used: seeks use the private narrative scrollFraction and
native window.scrollTo. This is focused functional proof, not performance acceptance.

Served HTML equals `dist/torque-wrench/index.html` byte-for-byte:
- HTML SHA256: `45ae37fa74772f289af28ffe6d3634cf11e2ab2bb67f2d5d6d40975d22309c1b`
- Entry: `/assets/torque-wrench-CrdmBRIA.js`
- Entry SHA256: `4ec9a6f3525d0eceb58bbb528d79b3682b4189b01b13e8dce2c99f07a210681b`

Owner-review URL: **http://localhost:5281/torque-wrench/**. Requested opening in Codex
(tool returned queued). Automatic policy rejected the subsequent shell default-browser
launch with "blocked by policy". The supported in-app browser API then successfully
opened the exact URL visibly: tab 2, title `JGun Torque Wrench · Private Rebuild`,
with corrected copy and private self-links confirmed in its returned UI state. Tab is
marked as a deliverable to remain open for the owner. No default-browser launch is claimed.
Keep the task-owned :5281 preview running. Final Git refresh still shows baseline
HEAD and empty index; only the two intended tracked source edits plus new private nav
and this scope record were added alongside task-owned evidence. Existing owner edits
remain. All three agents completed, released ownership and were closed.

Owner visual acceptance and parked AC/performance failures remain open. Offline
poster artwork is still pending. No commit, push, deployment or public cutover.
