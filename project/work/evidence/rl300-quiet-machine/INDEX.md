# RL300 Quiet Machine: evidence index

**G0 owner approval (verbatim):** "Start with S0/S1 and S2A" (owner, 2026-10-11).

Maps every artifact in this directory to a gate. Citations are `file:line`. Bare file names are inside this directory; `docs/` and `project/` paths are given in full. `unknown` means no citable run line exists. Current = folders 35, 36, 37 (per the S1 spec); everything else is historical. Folder 37 is in progress.

## Artifacts

| artifact | what it is | gate | current/historical | pass/fail/waived/unknown |
|---|---|---|---|---|
| `README.md`, `00-baseline-manifest.md`, `00-baseline.json`, `01-asset-role-map.md`, `01-cad-inventory.json`, `02-progress-consumers.md`, `03-contract-debt.md`, `04-clipping-stencil-reference.md`, `_preflight.log` | Milestone 1 frozen baseline pack (2026-09-10/11, at `3e3e49f`): measured baseline, asset audit, consumers, contract debt, stencil reference | B.1-B.4 (README.md:131-134) | historical | pass: B.1-B.4 at `3e3e49f` (README.md:131-134). Kept fail: JG-032 `panelY` red at HEAD (README.md:46). Measured, not gated: draw calls 3,478 and p50 22.2 ms against provisional budgets (README.md:59-61) |
| `05-milestone2-preview.md`, `05-milestone2-runtime.json`, `05-milestone2-smoke.json`, `06-ruling-geometry-fixes.md`, `07-handoff-for-astra.md`, `08-handoff-2026-09-14.md`, `09-milestone3-shot-sequence.md`, `10-handoff-2026-09-15.md` | Milestone 2 prototype, owner ruling fixes, handoffs to Astra, Milestone 3 shot sequence (2026-09-14/15) | none | historical | unknown (no run line cited; classified by file name) |
| `11-astra-airflow-ruling.md` through `30-research-page-split-2026-10-09.md` (20 docs) | Astra rulings, duct reconstruction, mid/lower path and acoustic beat work, owner material rulings, intake port, research notes (2026-09-16 to 2026-10-09) | none | historical | unknown (classified by file name; not opened) |
| `31-gpu-1/` and `31-gpu-1-qm-entry-smoke.md` | QM4 entry smoke run (2026-10-10): base arm and QM4 arm, logs, guards, diffs. Includes `qm4-patched-intermediate-intake-ndc-fail.log` (named failure; not read) | none (verify-jgun-opening, not B/U) | historical | fail: base arm `verify-jgun-opening` exit 1, desktop 90 and narrow 1 failures (31-gpu-1-qm-entry-smoke.md:23-30). QM4 arm past line 40 not read |
| `32-gpu-2/` and `32-gpu-2-qm5-captures.md` | QM5 capture pass (2026-10-10, HEAD `275a4c0a`): full, lite, intake, endcard captures and verifier log | B.3 (32-gpu-2-qm5-captures.md:14); verify-jg033-preview (not B/U) | historical | pass: build exit 0 (32-gpu-2-qm5-captures.md:14); verifier exit 0, 28 captures (32-gpu-2-qm5-captures.md:27) |
| `33-gpu-3/` and `33-gpu-3-qm6-transition.md` | QM6 page-transition verifier runs, including two spec'd mutations (2026-10-10) | none (verify-page-transition, not B/U) | historical | pass: 7/7 at 1440x900 (33-gpu-3-qm6-transition.md:30) and 390x844 (line 31) |
| `qm-commit-gates.md` | Per-commit gate output tails. Sections QM0, QM1, QM2, QM3, QM4, QM4-fix, QM5, QM6a, QM6 (headings at lines 5-1128). No section for `90bc07d2` or `efea0537` | U.1 (qm-commit-gates.md:17-25), U.2 (line 27), B.4 = U.3 (lines 29-32) | historical | pass at QM0 only: U.1 grep exit 1 (line 25), U.2 hunks=0 (line 27), U.3 exit 0 (line 32). Lines 41 onward (QM1 to QM6) not read |
| `34-v16-assessment/` | Read-only V16 blend vs shipped GLB assessment (2026-10-10): `data/`, `scripts/`, `lite-diff/`, `specs/`, `gpu-seat-scripts/` | none | historical | unknown. Snapshot is stale: scratch copy from 19:44, original re-saved 20:44 (34-v16-assessment/README.md:5) |
| `35-v16-round-1/` | V16 materials and extras capture. Round 1: before/after PNGs, `cost.json`, verifier log, `run-A-baseline.md`, `run-B-after.md`. Round 2: `round2/` (u34/u51 PNGs, CPM and MAN close-ups, two verifier logs), `runtime/` notes | Round 1: B.1-B.4 and U.1-U.2 (docs/HANDOFF-quiet-machine-2026-10-11a.md:29, orchestrator-verified); verify-jg033-preview (not B/U); U.4 waived (docs/HANDOFF-quiet-machine-2026-10-11a.md:14) | current | Round 1: pass (handoff:29; run-B-after.md:11, 13). Round 2: first verifier run **fail**, `exit=1`, "lite must preserve ruled geometry: EXHAUST PIPE-1 578 !== 2896" (35-v16-round-1/round2/verify-jg033-preview.log:2, :124). Rerun: `VERIFIER EXIT 0`, `errors: []` (round2/verify-jg033-preview-rerun.log:182 and last line). Round-2 gates re-run by the orchestrator at HEAD `32c9eb13`: typecheck 0, build 0, check:station2 0, `npm test` 701/702 (only `shaft/camera.test.ts` timed out; passes alone 17/17), U.1 clean, U.2 1 hunk. Round-2 PNGs approved by the owner in chat 2026-10-11 and committed as `efea0537` (supersedes the "never approved" note in docs/HANDOFF-quiet-machine-2026-10-11a.md:9). Run-A and run-B cite HEAD `97e2d806`, an ancestor of `90bc07d2` |
| `36-shell-readiness-run/` | Fresh shell readiness run at HEAD `efea0537` (shell session; indexed only, not edited) | B.1 (36-shell-readiness-run/README.md:10), B.3 (README.md:11); B.2 and B.4 not in run | current | pass: B.1 and B.3 (README.md:10-11); transition verifier 7/7 at both viewports (README.md:15-16). B.2 and B.4 unknown |
| `37-s2a/` | S2a beat-record seat: `specs/` (s1-index-spec.md, s2a-beat-seat-spec.md, s2a-gpu-seat-spec.md); outputs being written | G3, G4 (waived), B.1-B.4, U.1-U.2, verify-jg033-preview | current | pass: S2a beat-record relocation, uncommitted at HEAD `0c345b70`. 22/22 PNG sha256 identical, baseline vs after (11 u x 1440x900 and 390x844, full tier; `baseline/SHA256.txt` == `after/SHA256.txt`); 56 deterministic sidecar fields identical; capture noise 0 (`noise-check/`). `after-label-variant/`: the first S2a build changed the eyebrow label to one text node, which shifted one glyph (14 px, max delta 36) at 390x844 only; that item was reverted and is deferred to S2b. Gates: typecheck 0, `npm test` 703/703, build 0, check:station2 0, U.1 clean, U.2 1 hunk, verifier exit 0 (`verify-jg033-preview.log`, draw calls max 143 < 150) |
| `astra-rereview/` | Astra re-review material: one subfolder `captures/` (not opened) | none | historical | unknown |
| `baseline-frames/` | Desktop frames at 13 named beats; visual before-reference (README.md:101) | G3 input | historical | unknown (no run file) |
| `duct-reconstruction/` | Owner's annotated CAD screenshots for the duct airway, with README (Sept 2026) | none | historical | unknown (README has no pass/fail) |
| `entry-fix/` | 2 owner ruling PNGs: entry and mid path (2026-09-23) | none | historical | unknown |
| `lower-fix/` | 4 PNGs: acoustic concept and contact sheets, intake placement sketch (2026-09-24) | none | historical | unknown |
| `44-s3-ribbon-gating/` | S3a: skip a ribbon bundle's draws while `flow.weight` is 0 (2026-10-12): summary, HEAD-vs-new pixel compare (76 compares, 0 changed), verifier and ribbon-clipping logs | B.1-B.4, U.1-U.2, G5, G8 | current | pass (uncommitted at the time of writing) |
| `46-header-phone/` | Phone header nav on one row (2026-10-12): before/after PNGs, metrics, 2.5.8 check, gates | B.1-B.4, U.1-U.2, G7, G9 | current | pass (owner PNG approval and Opus-for-Astra ruling recorded) |
| `47-gpu6-baseline/` | GPU-6 desktop baseline and S4 frame-time baseline (2026-10-12, AMD Radeon 780M): p50/p95 sweep, triangles, draw calls; scratch lite-with-extras cost | G8, GPU-6 | current | desktop pass; phone not demonstrated; lite extras breach the < 90 pin (91) |

## Gates G0-G9 mapped to existing B.1-B.4 / U.1-U.4

Per plan line 122 (`project/work/plans/JG-033-quiet-machine-integration.md`), every stage also passes B.1-B.4 and U.1-U.2. No gate was run for this index.

| gate | existing B/U gate it maps to | status | cite |
|---|---|---|---|
| G0 Authority | none; quote recorded in this header | unknown | quote appears only in the S1 spec (s1-index-spec.md:5), not a run file or handoff |
| G1 Shell note | U.2 (closest: shell markers) | unknown | no run line cites the S0 note |
| G2 Evidence index | B.1-B.4 and U.1-U.2 per stage | unknown | this file; not gate-run |
| G3 Byte regression | U.4 (closest: shell byte compare; waived for V16) | pass for S2a: 22/22 PNGs byte-identical | 37-s2a/baseline/SHA256.txt == 37-s2a/after/SHA256.txt |
| G4 Data-only beats | B.2 (fixtures run inside `npm test`) | waived, owner standing instruction (no new tests); S2a proves the relocation byte for byte, the add-a-beat-by-data claim is claimed, not demonstrated | standing instruction docs/HANDOFF-quiet-machine-2026-10-11a.md:11; waiver text from s1-index-spec.md:18 |
| G5 Determinism | none | unknown | |
| G6 Background | none | unknown | |
| G7 Tiers | none exact; verify-jg033-preview | unknown (current) | 35-v16-round-1/run-B-after.md:13 covers full and lite only, no poster case. QM5 (32-gpu-2-qm5-captures.md:28) passed poster cases, historical |
| G8 Performance | none exact; draw-call pins from verify-jg033-preview | unknown (current) | round 1 pins pass (run-B-after.md:13); no device-named p95 recorded |
| G9 Review | none (Astra and owner) | waived for Astra | Astra waived (docs/HANDOFF-quiet-machine-2026-10-11a.md:14); owner PNG approval for V16 round 2 given in chat 2026-10-11 (commit `efea0537`); round 1 never separately approved |

## Waivers and kept failures (as recorded)

- V16 waivers, owner-approved, Astra not consulted: plan amendment, Opus plan gate, adversarial review rounds, Astra, U.4, mutation proofs, GPU-4 to GPU-8 (docs/HANDOFF-quiet-machine-2026-10-11a.md:14).
- JG-032 `panelY` gate red at HEAD `3e3e49f` (README.md:46). Disposition is an owner call (README.md:50), not resolved here.
- 31-gpu-1 base-arm verify-jgun-opening exit 1 (31-gpu-1-qm-entry-smoke.md:23-30).
- 35 round 2, first verifier run exit 1 (35-v16-round-1/round2/verify-jg033-preview.log:2, :124). Kept as-is; the later rerun exits 0 (round2/verify-jg033-preview-rerun.log, last line).
