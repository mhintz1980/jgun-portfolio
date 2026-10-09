# Delegation specs — 2026-10-08

Repo: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`; baseline `8db9391`. All execution seats after the initial two read-only sweeps are requested as `zai/glm-5.3`, max effort. Requested routing is not served-model evidence.

## V1 — Windows verifier roster

**Objective:** Execute current handoff item 1: opening, ring, shaft and lifecycle iteration/acceptance rosters on a fresh normal-quality Windows hardware build; diagnose failures without waivers.

**Files:** Own `verification/` under this packet, task-local scratch helpers, frozen `dist`, and task-owned server processes. Production source is read-only.

**Interfaces:** Notify architect when the build is frozen. Return structured roster totals, command exits, renderer provenance, source hashes, failures and log paths. Raw logs remain on disk. GPU ownership lasts until explicit release.

**Constraints:** Preserve others' edits/processes. No qualityLock, SwiftShader, tier-threshold changes or test weakening. Run GPU rosters serially; other independent source work starts only after the baseline build freezes. Read verifier option parsers and the installed `webgl-telemetry-verifier/SKILL.md`. Diagnose deterministic blockers rather than blindly repeating full rosters.

**Verification:** `npm run typecheck`, `npm test`, `npm run build`, `node scripts/check-b1b2-contract.mjs`, `npm run check:station2`; opening `--quick` and ring `--focused` precede complete `verify-jgun-opening.mjs`, `verify-ring-inspection.mjs`, `verify-shaft-inspection.mjs`, `verify-manufacturing-inspection.mjs` runs with distinct `--out` directories. Installed Chrome hardware renderer must be recorded.

**Reasoning:** max.

## Z1 — JG-036 source layering and regression guard

**Objective:** Implement accepted hotspot-plan Scope 1 and the owner's narrowed revival: one hotspot per assembly for manual browser verification. Architect selects rotor (JGun), intake (enclosure) and barrel trunnion (M249), resolving exact existing IDs against current definitions. Additional hotspots are deferred to a separate task.

**Files:** Own layer edits in `src/scene/SceneCanvas.tsx`, `src/scene/Hotspots.tsx`, `src/components/Chapters.tsx`, `src/components/TechnicalHUD.tsx`; keeper-gating-only changes in `src/data/caseStudies.ts`; new `scripts/verify-jg036-hotspot-layering.mjs`; evidence `project/work/evidence/JG-036-hotspot-clickability/z-order-2026-10-08/`.

**Interfaces:** Badge/HUD layer paints above chapter text; interactive chapter controls remain usable; fullscreen pass-through regions do not steal pointer/scroll input. Preserve native focus and buttons.

**Constraints:** Wait for V1 build freeze before source edits; wait for GPU release before runtime checks. No build/server changes during V1. Revive only the three selected IDs, repair their anchor eligibility/chapter/window gates and preserve passive tolerance stations. Other definitions/inspect frames stay intentionally dormant for later work. Preserve current camera flight, card, scroll lock and pointer parallax per owner instruction; no CameraRig/scroll behavior edits. Do not use forced/programmatic clicks. Read accepted JG-036 plan, diagnosis/demo evidence and installed `spatial-hotspot-a11y/SKILL.md`.

**Verification:** Typecheck, proportional static checks, then installed Chrome runtime `elementFromPoint` and real actionability clicks for all three natural production badges at settled states on desktop+narrow; camera flight, card, exit restoration, keyboard and reduced behavior. Open the integrated build for the owner's manual check. Owner visual acceptance remains separate.

**Reasoning:** max.

## S1 / E2 — Current stills and outstanding-proof matrix

**Objective:** Reconcile capture/encoding provenance, prepare candidates showing current approved lettering/FOS, and map remaining revision gates to existing evidence/instrumentation.

**Files:** Own `stills/`, `revision-proof-matrix.md` and local scratch helpers in this packet. Publishing `public/` assets requires a concrete destination list accepted by the architect.

**Interfaces:** Candidate inventory records dimensions, format, hashes, source/build provenance and exact destinations; matrix distinguishes current proof, historical evidence and missing observables.

**Constraints:** V1 owns hardware until release; prepare before capture. Do not rebuild, change fonts/cache/composition or overwrite old provenance. Read current handoff, owner revision plan, existing capture/encode scripts and installed telemetry/asset-hygiene skills. Preserve all other files.

**Verification:** Current drawing/poster and shaft candidates with manifest; fallback remains DOM/stills only with zero CAD requests and zero canvases. Capture and encoding logs stay on disk.

**Reasoning:** max.

## F1 — Sampled FAILED stamp

**Objective:** Make displayed FAILED scale follow canonical `sampleShaftScript(...).stampScale`, including pause, direct seek and reverse playback; remove mount-time impulse behavior.

**Files:** Own `src/components/ShaftStoryLayer.tsx`, only the existing stamp CSS/keyframe rules after locating their stylesheet, and packet `stamp/`. Additional shared verifier edits require architect allocation.

**Interfaces:** Canonical sampler timing is unchanged. Preserve stamp rotation/base presentation, text, FOS and status announcements. Reduced motion always uses scale 1.

**Constraints:** Wait for V1 build freeze; no GPU/build/server changes during V1. No CAD/geometry, sampler-schedule or font edits. Preserve other seats' changes; minimal proportional patch.

**Verification:** Typecheck and actual rendered transform samples: equal timeline times match through direct seek/reverse, pause has no CSS drift, reduced motion stays scale 1. Runtime waits for hardware release.

**Reasoning:** max.

## Acceptance discipline

Fresh reviewers receive these specs, actual diff and evidence only, never producer transcripts. Architect independently reruns required proportional checks before sign-off. Owner choices/visual acceptance remain owner decisions. Unproven model attribution stays explicitly unproven. No commit/push/deploy is authorized by this packet.
