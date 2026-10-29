# Owner visual proposal 66 — 2026-10-28

Continuation of [owner brief 65](65-owner-visual-corrections-and-next-preview-2026-10-28.md). This is a small appearance/pacing proposal. It does not close plan 63, production verification, visible meshing or manufacturing acceptance.

## Decisions and delivered source

- Owner selected the sketch pilot arbor, clamping flange and retaining nut during this session. Its rendered appearance remains subject to owner review.
- The closer exploded camera tracks toward the extracted carrier/bearing/clutch region instead of pulling back by an additional .7 m desktop / 1.1 m narrow. Periphery may crop intentionally. The registered spherical path, deterministic progress sampling and connection to collapse/angled LCD remain.
- A000592/P001837 is the owning carrier for the second-stage P000247 occurrences (source: nodeRoles.ts role table; shaftRuntime.ts cascade index 1). Its opacity reveal moves from 52.2–53.1 s to 45.3–46.2 s. Planets still reveal at 43.5–44.4 s. Fully visible unsupported dwell drops from 7.8 s to .9 s.
- Visibility and mechanical drive events are separated. Acceleration intervals, common unwrapped phase, ratios, extraction order and approved upstream fades remain at their existing display times.
- Native distance 44.4–52.2 s is weighted .35; reclaimed distance goes proportionally to 53.1–64.65 s. Total page distance, cascade distance and pre-40.2 s choreography are preserved. These allocations are a proposal, not owner-approved numbers.
- The 60-tooth tool uses consistent work/cutter pitch radii, centre distance and generating ratio. Historical clearance-v4 belongs to the old 20-tooth tool and remains unchanged. The new tool is a derived presentation prototype; new clearance/manufacturing acceptance is not claimed.

## Preview evidence

- Four current-source baseline views: `output/playwright/owner-visual-preview-2026-10-28/before-camera/`.
- First closer-camera iteration: `output/playwright/owner-visual-preview-2026-10-28/axial-camera/`.
- First pacing captures: `output/playwright/owner-visual-preview-2026-10-28/pacing-first/`. Six native-scroll checkpoints captured at full tier with zero recorded browser errors; actual times and native scroll positions are in report.json. This is preview evidence only.
- Integrated production-preview gallery: `output/playwright/owner-visual-preview-2026-10-28/integrated-preview/index.html`. Fifteen native-scroll stills (four tool, six pacing, five camera) and one short WebM captured at desktop full tier, zero recorded browser errors. Report status is PREVIEW_ONLY / CAPTURED, not PASS.
- Local gallery browser: `http://127.0.0.1:4184/integrated-preview/index.html` (task-owned read-only static server rooted at the preview evidence directory; application preview remains on :4173).
- Served preview: `http://localhost:4173/torque-wrench/?quality=full`; prior task-owned PID 14004 was identity-checked, stopped and preview restarted after the successful build.
- Build identity: `dist/assets/Scene-cGXi5Nf8.js`, SHA-256 `2b0a4547a5666d70e27c0091911543e88325a2eadd50e6c7237186ef9fa0e9f7`; torque-wrench HTML SHA-256 `63d3040e6a1a34ba344a8272837432ff5ed97c925a848891c03d623ee4d73ff6`. HEAD remains `57e903d6f9f4578916b1271cfb818cc19aef0a9e`; this build includes the dirty source.

## Focused checks

166/166 across nine focused source suites: schedule, final cascade, JourneyCamera, InspectionDirector, tools, kinematics, shaper prototype, shaft runtime and lifecycle cleanup. After the final establishing-view pan, InspectionDirector's 46/46 checks passed again. `npm run build` passed (including TypeScript); `git diff --check` passed. The generator's read-only `--check` reproduces the 120-point tooth profile exactly (including normalized source hash). This is not a full production browser roster. A prior transient import failure occurred while the worker's toolSpec/kinematics changes were partially written; the integrated source passed these suites.

GLM-5.3/high critical review found no P1 preview blocker. It confirmed reveal/drive separation, unchanged distance budget and coherent 60-tooth geometry/kinematics/mount direction. It identified an inherited P2: at the .825 source takeover the cascade clock reaches 66.9 s with nonzero incoming derivative and then holds. This terminal freeze predates this preview and remains a plan-63 continuity/hardening issue; neither owner approval nor a full C1 pass is claimed. Opus-5.5/high independently inspected the report, files and two stills and returned **APPROVE FOR OWNER PREVIEW**; it did not rerun tests/build or watch the clip. It noted the exposed thread may need stronger visual definition, subject to owner direction. Review evidence: `project/work/evidence/torque-wrench-rebuild/66-owner-visual-preview-2026-10-28/reviews.md`.

## Remaining gates

- [x] Finish tool assembly and its focused source checks.
- [x] Identify integrated preview source/build and capture gallery/short clip.
- [x] Independent critical mechanical-contract review; final preview-readiness approval.
- [ ] Owner approves/tweaks concrete tool, closer camera and pacing.
- [ ] Then complete proportional same-build runtime/beauty/HUD/full/lite/reduced checks under plan 63.

Preserved boundaries: no staging, commit, push, deployment, protected GLB or .scratch edits. The opening retains the owner-approved active-detail close-read. Existing dirty work is retained. The session's configured seats and ownership are recorded in `project/work/evidence/torque-wrench-rebuild/66-owner-visual-preview-2026-10-28/wave-ledger.md`; current user model choices supersede the old no-OpenAI note in brief 65.
