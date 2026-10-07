# Implementation baseline

Snapshot 2026-10-05 before implementation. HEAD: `420198a0f818ef44fcf4428dd29ad9f7601fac69`.

Existing index/worktree counts from `git status --short`: 33 staged modifications, 3 staged-plus-unstaged modifications, 1 added-plus-unstaged modification, 3523 staged additions and 5 untracked entries. Counts precede this execution ledger. Most additions are earlier opening/runtime evidence. Session must not stage or revert them.

Protected live narrative asset: `public/models/Default.glb`, 10,671,700 bytes, SHA-256 `8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257`. `Default-lite.glb` is absent; resolve actual lite descriptor from source rather than inventing this path.

Live inspection files predate this task: store, RingInspection DOM/CSS, InspectionScene, ring sampler/geometry, load/compile leases, narrative fade and existing ring verifier. These are staged additions, with modified shared camera/hero/scroll/canvas/App files. The `.gitignore` has unrelated staged hunks.

No listener was observed on :4173 or :5199 during baseline. This task starts a hidden Vite dev process on localhost:5199 for live checks. Preview must be restarted after every production rebuild.

Code graph generation: 2026-09-30T09:32:54Z. Coverage check: inspection store/scene not_tracked; CameraRig/TorqueWrenchHero/nodeRoles metadata_changed. No reliable structural absence claim is possible from this generation; live source is required.

Fresh parent checks: `npm run typecheck` exit 0; `npm test -- src/state/inspectionStore.test.ts src/scene/inspection` exit 0, 5 test files / 13 tests passed. Dev HTTP request to localhost:5199 returned 200.

Fresh ring baseline: `node scripts/verify-ring-inspection.mjs --focused --url=http://localhost:5199 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/baseline-ring`, exit 0. Actual report `baseline-ring/report.json`: delayed-CAD-entry, desktop and mobile all passed, each with zero console/page errors. This proves the existing ring baseline, not the new shaft or ring-refinement requirements.
