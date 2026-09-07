# JG-028 — Handle Realism Pass — Verification

**Status: CLOSED VERIFIED 2026-09-06 — owner visual ruling PASS ("looks good apprived. Update docs.")** at `http://localhost:4173/?chapter=0`. All machine gates PASS (`verify-jg028-handle-realism.mjs`, `typecheck`, `test`, `check:station2`, clean build on `:4173`).

---

## 1. Summary of Delivered Realism Updates

1. **Handle Body & Motor Cylinder** (`P003036`, `P003037`, `P003028`, `P003039`):
   - Retuned `anodizedAluminum` in `src/scene/rig/materials.ts` to `MeshStandardMaterial` with deep obsidian black `#040404` (`roughness: 0.26`, `metalness: 0.98`, `envMapIntensity: 1.00`).
   - Replaced `MeshPhysicalMaterial` (which had `clearcoat: 0.30` and `metalness: 0.85` that caused dielectric diffuse scattering and a milky grey haze on curved grip/cylinder surfaces) with clean `MeshStandardMaterial`.
   - The handle body, top cap, collar flange, and trigger blade now render in deep satin obsidian black matching the dark gearbox cylinder with zero grey wash.
2. **Reversing Valve Spool / Shuttle** (`P001928`):
   - Added `stainlessSteel` role with `MeshStandardMaterial` (`color: '#c2c6cb'`, `roughness: 0.28`, `metalness: 0.92`, `envMapIntensity: 1.25`).
   - Added `[/P001928/i, 'stainlessSteel']` to `ROLE_OVERRIDES`.
3. **Latent Generic Mesh-Name Defect Fixed** (`src/scene/rig/nodeRoles.ts`):
   - In the mesh consolidation loop, when `mesh.name` is generic (`^mesh\d+_mesh$`), the loop now walks ancestor nodes to resolve the CAD part name before calling `materialRoleFor(unit.key, nodeName)`.
   - Allows `ROLE_OVERRIDES` to match part numbers (`P001928`, `P003068`, etc.) accurately instead of falling through to unit defaults.
4. **Fasteners & Blue Ring Intact**:
   - Fasteners (`90910A815`, `91251A344`, `91251A148`, `96006A253`) remain authentic `blackOxideSteel` (`#0d0d0d`, roughness 0.28, metalness 0.96).
   - Blue speed-indicator groove (`P000420 Speed Indicator (Blue)`, `#005daa`) remains seated at the collar seam.
   - JG-025/JG-027 rear LCD cluster dressing is preserved untouched.
5. **Explosion Ladder Parity**:
   - Both `handle|anodizedAluminum|s` and `handle|stainlessSteel|s` (`P001928`) are parented to `handleRoot`.
   - They translate rigidly together to `deltaZ = -0.354` at `explode = 1` with zero drift.

---

## 2. Machine Assertion Gates (`verify-jg028-handle-realism.mjs`)

Ran against a fresh `npm run build` and restarted `:4173` preview server (headless Chrome, D3D11 ANGLE backend).

| Gate | Target / Spec | Measured Telemetry | Result |
|---|---|---|---|
| **Handle Body Finish** | `anodizedAluminum` (`#040404`, rough 0.26, metal 0.98) | `#040404`, rough 0.26, metal 0.98, envMap 1.0 | **PASS** |
| **P001928 Spool Finish** | `stainlessSteel` (`#c2c6cb`, rough 0.28, metal 0.92) | `#c2c6cb`, rough 0.28, metal 0.92, envMap 1.25 | **PASS** |
| **Fasteners Finish** | `blackOxideSteel` (`#0d0d0d`, rough 0.28, metal 0.96) | 8 meshes, `#0d0d0d`, rough 0.28, metal 0.96 | **PASS** |
| **Collar Blue Ring** | `grooveBlue` (`#005daa`) mounted on `clutchStaticGroup` | `#005daa` on `MERGED Clutch Static` | **PASS** |
| **Handle Explode Offset** | `deltaZ = -0.354` at `explode = 1` | `deltaZ = -0.3540` | **PASS** |
| **P001928 Rigid Coupling** | Zero relative offset to `handleRoot` | Host = `handleRoot`, zero relative drift | **PASS** |
| **Console / Page Errors** | Zero errors | 0 errors | **PASS** |

---

## 3. Static & Contract Verification

- `npm run typecheck`: **PASS** (0 errors)
- `npm test`: **PASS** (10 tests passed in 45ms)
- `node scripts/check-station2-contract.mjs`: **PASS** (2,380,776 bytes, 7 named roots, 7 CAD anchors verified)
- `npm run build`: **PASS** (all chunks emitted cleanly, 0 Rollup/Vite errors)

---

## 4. Visual Evidence Artifacts

Saved in `project/work/evidence/jg028-handle-realism/` and `.scratch/`:
1. `jg028-ch1-lift-0.22.png` — Wrench lifting off the blueprint drawing at progress 0.22. Shows the deep satin black handle body and trigger blade, the bright stainless steel reversing valve spool (`P001928`), black oxide fasteners, and blue indicator ring.
2. `jg028-ch1-hero-verified.png` — CH.01 hero view at progress 0.35. Shows deep black tone consistency between the gearbox cylinder and the handle body/motor housing.
3. `jg028-handle-realism-exploded.png` — Full rear extraction at progress 0.50 (`explode = 1`). Shows rigid translation of handle subassemblies to `-0.354` and rear LCD cluster.
4. `report.json` — Machine telemetry and probe data.

---

## 5. Owner Visual Ruling
 
**CLOSED VERIFIED 2026-09-06 — owner visual ruling PASS ("looks good apprived. Update docs.") at `http://localhost:4173/?chapter=0`.**

The owner inspected the live preview at chapter 0 / CH.01 hero view, verified the obsidian black tone consistency across the handle body, top cap, and gearbox cylinder, and gave final visual approval to close the task.
