# Continuation Prompt — Authorized WebGL Pipeline Remediation (R1-R5)

Copy and paste the prompt below into the receiving coding session when you are ready to authorize implementation:

```text
Read the completed WebGL architecture review and runtime evidence at:
C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\webgl-review-2026-10-16\webgl-architecture-review-2026-10-16.md
and its hardware-GL telemetry artifact at:
C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\webgl-review-2026-10-16\evidence\runtime-telemetry-probe.json

Intended workspace:
C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench (branch torque-wrench/rebuild, baseline HEAD 1d66ff2b91e8a55d21ea1afb401a3ad995553f4a)

Current authorization state and boundaries:
- The 2026-10-16 review session was strictly read-only on application source and did NOT authorize or apply code changes, commits, pushes, or deployments.
- Preserve all dirty/untracked worktree files (GATES.md, TODO.md, project/context/agent-skills.md, docs/HANDOFF-rea-*.md, docs/rea-integration-implementation-plan-2026-10-13.md, and project/work/evidence/*).
- Never modify protected assets (public/models/m249-transformed.glb, public/models/msp-enclosure.glb) or protected roadmap files (docs/orzo-style-portfolio-implemetation-roadmap.md, .scratch/).
- Note that src/scene/rig/materials.ts and src/scene/rig/nodeRoles.ts are shared between the root portfolio world (src/scene/SceneCanvas.tsx) and the private /torque-wrench/ rebuild world (src/scene/torque-wrench/RuntimeWorld.tsx).

Exact next action:
1. Inspect git status and confirm whether you are authorizing implementation on the root portfolio pipeline (src/scene/SceneCanvas.tsx, src/scene/PostProcessingComposer.tsx, src/components/ToleranceStations.tsx, src/scene/TorqueWrenchHero.tsx), shared rig materials (src/scene/rig/materials.ts), or both.
2. Execute the validated recommendations in dependency order:
   - Wave 1 (R1 + R5 bugfixes): Gate PerformanceMonitor.onDecline/onFallback on telemetry.performance.warmReady in src/scene/SceneCanvas.tsx; cap MAX_DPR at 1.5; add explicit composer.setSize(size.width, size.height) synchronization on dpr changes in src/scene/PostProcessingComposer.tsx; fix the child SVG style.visibility leak in src/components/ToleranceStations.tsx:158-162; and replace the frame-rate-dependent pointer lerp in src/scene/TorqueWrenchHero.tsx:314-319 with delta-clamped exponential damping.
   - Wave 2 (R2 AA & Output Dithering): Enable multisampling={tier === 'full' ? 4 : 0} on root EffectComposer (with SMAA fallback in lite tier) and enable EffectPass output dithering; set Canvas antialias: false when EffectComposer owns rendering.
   - Wave 3 (R3 + R4 Material & IBL Calibration): Restore per-role envMapIntensity modulation in src/scene/rig/materials.ts (working around Three.js 0.185.1 WebGLRenderer.js:2696 overwriting m_uniforms.envMapIntensity with scene.environmentIntensity), add object-space cylindrical micro-roughness + derivative specular AA in onBeforeCompile, and upgrade the procedural RoomEnvironment studio lighting cards.
3. Verify each wave with npm run typecheck, npx vitest run, node scripts/check-b1b2-contract.mjs, node scripts/check-station2-contract.mjs, and a fresh hardware-GL telemetry + pixel comparison pass against C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\docs\webgl-review-2026-10-16\evidence\runtime-telemetry-probe.json. Do not commit, push, or deploy without explicit owner approval.
```
