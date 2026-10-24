# 36 - fresh shell readiness run, 2026-10-11 (QM session, owner-authorized)

Current results. Historical evidence (GPU-3, 33-gpu-3-qm6-transition.md, at `275a4c0a`) is NOT part of this table.

| Item | Value |
|---|---|
| HEAD | `efea0537` on `quiet-machine/integration` (V16 round 2, committed by the V16 session; `src/shared` unchanged since `4669e49e`) |
| Tree | clean at run start and end (`git status --short` empty) |
| V16 inclusion | included: `90bc07d2`, `95b7dc0f`, `efea0537` (scene files, `rl300-extra-parts.glb`, `verify-jg033-preview.mjs` sha256 `4a927cdfdfcdc8b9`). Not edited by this run. |
| Typecheck | `npm run typecheck` exit 0, no diagnostics |
| Build | `npm run build -- --outDir C:/Users/Markimus/AppData/Local/Temp/rr/dist-readiness --emptyOutDir`: exit 0, built in 10.14 s, one >500 kB chunk warning (`BufferGeometryUtils`, 739 kB), unchanged class of warning. Repo `dist/` not written. |
| Served | `vite preview --outDir <that dir> --host 127.0.0.1 --port 4191 --strictPort`; served sha256 equals dist for `/` (`2cc75fe7fe971d8a`) and `/quiet-machine/` (`f757d3fd167ffef9`) before and after both runs |
| Verifier | `scripts/verify-page-transition.mjs --url=http://localhost:4191`, viewports 1440x900 and 390x844 |
| Browser | Chrome 154.0.8037.98 (the verifier's own Playwright launch). GL renderer string is not recorded by this verifier; historically ANGLE/D3D11 on this machine (GPU-3), not re-measured here. |
| Result 1440x900 | RESULT PASS, 7/7 (fade-out, synthetic-arrival, back, reduced-motion-cut, legacy-redirect, no-white-frame, reduced-motion-arrival), `gateIncomplete: []` |
| Result 390x844 | RESULT PASS, 7/7, `gateIncomplete: []` |
| `back` | PASS, not UNVERIFIED: 1 canvas, `__quietMachine.ready`, no `.qm-poster` after Back |
| Ports / release | used only 4191; preview stopped by its own PIDs; `curl` to 4191 exits 7 (free) afterwards; 4173 free throughout; no other session's process touched |

Not covered: mutation red-proofs, `verify-jg033-preview.mjs` (the scene gate, V16's), Poster/PosterImage in a browser (nothing mounts them yet), torque page (no entry). A PASS here proves the Quiet Machine side of the shell fade at this HEAD; it does not approve torque's numerical budgets or verification matrix and does not close torque Stage 0.
