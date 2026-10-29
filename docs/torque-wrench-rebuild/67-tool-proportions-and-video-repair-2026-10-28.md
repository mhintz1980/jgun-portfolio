# Tool proportions and viewable video — 2026-10-28

Owner direction after preview 66: adjust the tool first; extend the arbor shaft by four or five inches; make cutter thickness/diameter resemble the attached product photo. Owner also reports the gallery video is black. Tool visual acceptance and full verification remain OPEN.

## Small implementation proposal

- Add a straight spindle-side shank, 4.5 inches / 114.3 mm longer, continuous with the adapter. This extends the arbor, not the workpiece or retaining stud.
- Cutter diameter remains the coherent 60-tooth prototype (~61.4 mm), with 8 mm axial body thickness (~13% thickness/diameter). This ratio is a visual authoring proposal from the oblique reference, not a measured product dimension.
- Keep the existing leading rake face at tool-local +.6 mm. Extend thickness behind it so the established cutting-edge trajectory, tooth-contact events, phase, work angle, stroke and .10 clock stay unchanged. Make the rake datum explicit instead of deriving it from half of the new body thickness. Verify actual geometry bounds/contact witnesses and groove-side clearance; no new manufacturing acceptance implied.
- Relocate shoulder/pilot/adapter from the disc's real rear face; preserve flange/nut retention. Add an establishing view that shows the long shaft, then return to cutter contact detail. Preserve page/cascade direction from preview 66 pending further owner feedback.
- Diagnose the previous WebM through decoded pixels and gallery playback. Produce a compatible clip from confirmed visible frames, with a real poster and browser playback check. Recording completion alone is insufficient.

## Ownership and configured seats

| Lane | Seat | Exact writes | Dependency |
|---|---|---|---|
| Tool/frame integration | Parent | toolSpec.ts, tools.ts, kinematics.ts and directly affected tests/witness consumers; InspectionDirector.ts/test; docs/evidence | Immediate critical path |
| Video repair | tier-worker / GPT-6.1-Sol / high | scripts/preview-owner-visual-corrections.mjs; optional scripts/lib/preview-video.mjs; evidence video-worker.md | Preparation parallel; final browser/capture after parent build |
| Critical review | GLM-5.3 / high | Read-only | Thick-disc stroke/datum integration |
| Final preview readiness | Opus-5.5 / high | Read-only | Actual integrated captures and playback proof |

## Checklist

- [x] Record owner changes and independent lane ownership.
- [x] Implement 4.5-inch shank and reference-like cutter thickness.
- [x] Check actual disc/rake/shoulder geometry and unchanged motion/phase; focused source checks.
- [x] Fix capture and gallery video; inspect decoded frames and actual playback.
- [x] Rebuild once integrated; restart identified task preview; show revised tool views.
- [x] Critical review and final preview-readiness approval.
- [ ] Owner reviews revised tool. Full six-case verification waits for visual direction.

No staging, commit, push, deployment, protected GLB or .scratch changes. Preserve the extensive dirty tree. Earlier checks/approvals apply to preview 66 bytes only; do not claim current acceptance from them.

## Observed implementation evidence

The cutter is 8 mm thick, extending from tool-local -7.4 to +.6 mm. The fixed +.6 mm leading face is now explicit in toolSpec, kinematics, geometry and verifier witnesses. Shoulder/adapter/pilot follow the real rear face; the straight shank adds 114.3 mm after the taper. Cleanup tests account for the added owned geometry. Source checks: 121/121 across six affected suites; subsequent overview camera refinement passed InspectionDirector and JourneyCamera 76/76. `npm run build` (TypeScript+Vite) and `git diff --check` pass.

Preview build: `dist/assets/Scene-B9_r-Hw_.js`, SHA-256 `7477a3f133086f12d712c7d237f8ae7844a77c9a30d0ab62c55ceb8ecc95dd47`; torque-wrench HTML SHA-256 `4bae6e515830658033c4597024df3980871c08a877154b8c6f1de319bd924fe5`. Task preview restarted after build. HEAD stays 57e903d6f9f4578916b1271cfb818cc19aef0a9e; index empty, protected GLB/.scratch tracked diff empty.

Production stills: `output/playwright/owner-visual-preview-2026-10-28/revised-tool-preview/`. Fifteen full-tier desktop captures complete with zero browser errors. The first dev capture attempt timed out on navigation; it supplies no evidence and is superseded by the production captures.

Old video diagnosis (Sol/high): all 793 WebM frames decode, but boot/very-dark early views precede later visible detail. Exact cause of the earlier file-scheme in-app playback failure remains unconfirmed. The new encoder uses settled native-scroll screenshots, H264/yuv420p faststart MP4 plus WebM, real scene poster and every-frame decoded-pixel checks.

New clip: 153 screenshot-derived frames / 12.24 seconds, no boot prefix. Both MP4 and WebM decode 153/153 with zero rejected blank frames; MP4 moov precedes mdat. The parent actually played the MP4 in the in-app browser: readyState 4, paused false, time advanced from .2802 s (visible long-arbor cutter) to 5.8082 s (visible carrier assembly). Evidence: `project/work/evidence/torque-wrench-rebuild/67-tool-proportions-video-2026-10-28/browser-playback.json`. Source report retains helper-level browserPlayback NOT_CHECKED entries; this separate parent observation establishes the actual browser check. No full verification/owner approval is implied.

Revised gallery: `http://127.0.0.1:4184/revised-tool-preview/index.html`. Clip: `video/screenshots-1793205319515-823b2bb1/preview.mp4` beneath that gallery. GLM-5.3/high critical review found no blocking source issue; Opus-5.5/high returned APPROVE FOR OWNER PREVIEW. No full engineering/runtime/manufacturing acceptance. The in-app browser subsequently reached currentTime = duration = 12.24, ended true, readyState 4. Gallery left open as a deliverable. Original integrated-preview gallery now links to the revised tool gallery and embeds the repaired MP4/poster, clearly labeling its earlier stills as historical; original recording/report retained.
