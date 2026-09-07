# SESSION HANDOFF: JG-028 — Handle Realism Pass

**Date:** 2026-09-06  
**Status:** CLOSED VERIFIED 2026-09-06 — owner visual ruling PASS ("looks good apprived. Update docs.") at `:4173`. Machine gates verified. All documentation updated.

---

## 1. Objective & Scope Boundaries

Bring the Handle Assembly to CAD-accurate realism matching Mark's Onshape references:

1. **Handle Body & Motor Cylinder** (`P003036`, `P003037`, `P003028`): Must be **black anodized aluminum, as black as the gearbox**. Retune `anodizedAluminum` from `#1a1a1e` (roughness 0.48) to deep satin black `#0c0c0e` (roughness 0.28, metalness 0.85, clearcoat 0.30, clearcoatRoughness 0.25, envMapIntensity 1.20).
2. **Trigger Blade** (`P003039`): Must be **identical black as the Handle** (both are black anodized aluminum; Mark clarified that apparent silver in the CAD render was specular glare from lighting angle).
3. **P001928 (Reversing Valve Spool / Shuttle)**: Must receive a **stainless steel finish** (`#c2c6cb`, roughness 0.28, metalness 0.92, envMapIntensity 1.25).
4. **All Fasteners** (`90910A815`, `91251A344`, `91251A148`, `96006A253`): **Retain Black Oxide finish** (`blackOxideSteel`, `#0d0d0d`) across all gearbox and handle locations per Mark's explicit ruling.
5. **Collar Blue Ring & LCD Cluster**: Retain the blue speed-indicator groove (`P000420 Speed Indicator Blue`) in the collar seam and preserve the verified JG-025/JG-027 rear LCD cluster untouched.

---

## 2. Key Code Files & Exact Changes

### File 1: `src/scene/rig/materials.ts`

1. **Add `stainlessSteel` to `MaterialRole` union and `roleMaterial`**:

   ```ts
   case 'stainlessSteel':
     material = new MeshStandardMaterial({
       color: '#c2c6cb',
       roughness: 0.28,
       metalness: 0.92,
       envMapIntensity: 1.25,
     })
     break
   ```

2. **Retune `anodizedAluminum`**:

   ```ts
   case 'anodizedAluminum':
     material = new MeshPhysicalMaterial({
       color: '#0c0c0e',
       roughness: 0.28,
       metalness: 0.85,
       clearcoat: 0.30,
       clearcoatRoughness: 0.25,
       envMapIntensity: 1.2,
     })
     break
   ```

3. **Add `P001928` to `ROLE_OVERRIDES`**:

   ```ts
   [/P001928/i, 'stainlessSteel'],
   ```

4. **Ensure `unitDefaultRole` for handle**:
   `if (unitKey === 'handle') return 'anodizedAluminum'` (routes handle body and trigger to the retuned black anodized aluminum).
   Fasteners remain mapped to `'blackOxideSteel'`.

### File 2: `src/scene/rig/nodeRoles.ts`

1. **Fix node-name resolution in consolidation loop**:
   In the mesh bucket loop (around line 459):

   ```ts
   for (const mesh of meshes) {
     if (Array.isArray(mesh.material)) {
       leftovers.push(mesh)
       continue
     }
     const unit = unitOf(mesh)
     const ghost = unit.key === 'housing' && housingMeshSet.has(mesh)
     // Resolve nearest non-generic node name for ROLE_OVERRIDES matching
     let nodeName = mesh.name
     let curr: Object3D | null = mesh
     while (curr) {
       if (curr.name && !/^mesh\d+_mesh$/i.test(curr.name)) {
         nodeName = curr.name
         break
       }
       curr = curr.parent
     }
     const role = materialRoleFor(unit.key, nodeName)
     const key = `${unit.key}|${role}|${ghost ? 'g' : 's'}`
     const bucket = buckets.get(key)
     if (bucket) bucket.sources.push(mesh)
     else buckets.set(key, { unit, material: roleMaterial(role), ghost, sources: [mesh] })
   }
   ```

2. **Handle subcomponent parenting**:
   Because `unitOf` tags `handleRoot` as the host for `handle`, both `handle|anodizedAluminum|s` (body, top cap, collar flange, trigger blade) and `handle|stainlessSteel|s` (`P001928`) are parented to `handleRoot`.
   They translate rigidly together to `handleZ = baseZ + -0.354 * explode` with zero drift.

---

## 3. Verification Script to Implement

Create `scripts/verify-jg028-handle-realism.mjs`:

- Headless Chrome (`channel: 'chrome'`, args: `['--use-angle=d3d11', '--disable-background-timer-throttling']`).
- Target: `http://localhost:4173/?chapter=0` and scroll to CH.01 hero view (`progress = 0.35`).
- Asserts:
  1. Material role of handle body mesh: color `#0c0c0e`, roughness `0.28`, metalness `0.85`, envMapIntensity `1.2`.
  2. Consolidated `P001928` mesh has material role `stainlessSteel` (`#c2c6cb`).
  3. Fastener material roles remain `blackOxideSteel` with color `#0d0d0d`.
  4. Explosion ladder offset parity: handle translates rigidly to `-0.354` at `explode = 1`.
  5. Blue ring (`grooveBlue`) remains unoccluded at the collar seam.
  6. Captures proof screenshot `.scratch/jg028-ch1-hero-verified.png` for owner visual ruling.

---

## 4. Execution Step-by-Step for Fresh Session

1. **Review Context**:
   - Read `project/work/plans/JG-028-handle-realism.md`.
   - Read `project/work/inbox/JG-028-session-handoff.md` (this file).
2. **Apply Code Edits**:
   - `src/scene/rig/materials.ts` (retune `anodizedAluminum`, add `stainlessSteel`, add `P001928` override).
   - `src/scene/rig/nodeRoles.ts` (ancestor node-name resolution in consolidation loop).
3. **Run Checks**:
   - `npm run typecheck`
   - `npm test`
   - `node scripts/check-station2-contract.mjs`
4. **Build & Test on Preview Server**:
   - `npm run build`
   - Restart `:4173` preview server (`npm run preview`).
   - Run `node scripts/verify-jg028-handle-realism.mjs`.
5. **Create Evidence Record & Close Task**:
   - Create `project/work/evidence/JG-028-handle-realism-verification.md` recording test outputs, material telemetry, and before/after screenshots.
   - Update `project/work/INDEX.md` status to `verified`.
   - Check off `- [x] JG-028` in `TODO.md`.
   - Present preview URL (`http://localhost:4173/?chapter=0` at CH.01) for Mark's final visual ruling.
