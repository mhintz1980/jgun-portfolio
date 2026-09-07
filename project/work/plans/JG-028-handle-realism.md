# JG-028 — Handle Realism Pass: Black Anodized Body, Trigger Blade & Stainless P001928

**Status: verified** — CLOSED VERIFIED 2026-09-06 — owner visual ruling PASS ("looks good apprived. Update docs.") at `:4173`.

**Objective:** Bring the Handle Assembly and hardware to CAD realism matching Mark's Onshape references: black anodized aluminum finish on the handle body and trigger blade (matching the deep black tone and satin sheen of the gearbox), stainless steel finish on the reversing valve spool (`P001928`), and authentic Black Oxide finish on all fasteners.

## Owner authorizations & rulings

- 2026-09-06: Task intake from owner's Onshape CAD screenshots (Image 1 and Image 2).
- **Ruling 1 — Handle body & trigger finish**: The Handle body (`P003036`), top cap (`P003037`), front adapter collar (`P003028`), and Trigger Blade (`P003039`) are **black anodized aluminum, identical in black tone to each other and as black as the gearbox**. (The apparent silver highlight on the trigger in the CAD render was specular glare from lighting angle).
- **Ruling 2 — Fasteners**: All fasteners on both the gearbox and handle remain **Black Oxide finish** (`#0d0d0d`, `blackOxideSteel`).
- **Ruling 3 — P001928 (Reversing Valve Spool / Shuttle)**: Must receive a **stainless steel finish** (`#c2c6cb`, roughness `0.28`, metalness `0.92`, envMapIntensity `1.25`).
- **Ruling 4 — Collar Blue Ring & LCD Cluster**: Retain the blue speed-indicator groove (`P000420` Blue) in the collar seam and preserve the verified JG-025/JG-027 rear LCD cluster untouched.
- **Ruling 5 — Owner visual ruling PASS**: 2026-09-06 ("looks good apprived. Update docs.") after retuning `anodizedAluminum` to `MeshStandardMaterial` (`#040404`, roughness 0.26, metalness 0.98, zero clearcoat) eliminating clearcoat haze.

## Context & Root Cause

1. **Handle Washed-out Charcoal**: Initially, `unitDefaultRole('handle')` returned `'anodizedAluminum'` (`#1a1a1e`, roughness `0.48`, metalness `0.82`), rendering as a light charcoal gray that visibly clashed with the jet-black gearbox (`#0d0d0d`). A first pass with `MeshPhysicalMaterial` (`#0c0c0e`, clearcoat 0.30) added an uncolored dielectric film that scattered studio lights into a milky haze. Switching to `MeshStandardMaterial` (`#040404`, roughness 0.26, metalness 0.98, zero clearcoat) eliminated all diffuse wash and matched the gearbox perfectly.
2. **Latent Generic Mesh-Name Bypass**: In `src/scene/rig/nodeRoles.ts`, `materialRoleFor(unit.key, mesh.name)` tested `mesh.name` against `ROLE_OVERRIDES`. Because GLTFLoader creates generic mesh names (`meshN_mesh`) for CAD primitives, `ROLE_OVERRIDES` failed silently. Subcomponents under `HANDLE ASSY` fell through to the handle unit default and were merged into one giant gray draw call. Walking ancestor nodes resolved the true CAD part names.
3. **P001928 Separation**: Resolving node names by traversing ancestors allows `P001928` to receive its own material bucket (`handle|stainlessSteel|s`) parented to `handleRoot`, maintaining 100% rigid coupling during the rear extraction explosion without custom animation offsets.

## Items

### Item 0 — Node-Name Resolution in `nodeRoles.ts`
- In `nodeRoles.ts` consolidation loop, resolve node name by checking `mesh`'s ancestor chain for the nearest non-generic node name (skipping `^mesh\d+_mesh$` and stripping occurrence prefixes).
- Guarantees `ROLE_OVERRIDES` matches accurately on all CAD part numbers.

### Item 1 — Retune Black Anodized Aluminum (`materials.ts`)
- Retune `anodizedAluminum` in `src/scene/rig/materials.ts`:
  - `MeshStandardMaterial` (eliminating `MeshPhysicalMaterial` clearcoat haze)
  - `color: '#040404'` (deep obsidian black matching gearbox `#0d0d0d`)
  - `roughness: 0.26` (satin anodized sheen with clean cylindrical highlights)
  - `metalness: 0.98`
  - `envMapIntensity: 1.00`
- Handle body (`P003036`), end cap (`P003037`), collar flange (`P003028`), and trigger blade (`P003039`) all consolidate into `handle|anodizedAluminum|s` under `handleRoot`.

### Item 2 — Stainless Steel Finish for P001928 (`materials.ts` & `nodeRoles.ts`)
- Add `'stainlessSteel'` role to `MaterialRole` in `materials.ts`:
  - `color: '#c2c6cb'`, `roughness: 0.28`, `metalness: 0.92`, `envMapIntensity: 1.25`.
- Add `[/P001928/i, 'stainlessSteel']` to `ROLE_OVERRIDES`.
- Consolidates into `handle|stainlessSteel|s` under `handleRoot`.

### Item 3 — Maintain Black Oxide Fasteners
- Fasteners (`unitKey === 'fastener'` and `gb-fastener-*`) remain strictly mapped to `blackOxideSteel` (`#0d0d0d`, roughness `0.28`, metalness `0.96`) per ruling 2.

### Item 4 — Automated Verification Suite
- New `scripts/verify-jg028-handle-realism.mjs`:
  - Material probe via `window.__rig`: asserts handle body is `#0c0c0e` with roughness 0.28, `P001928` is `stainlessSteel` `#c2c6cb`, and fasteners are `blackOxideSteel` `#0d0d0d`.
  - Exploded offset assertion: asserts `handleZ` at `explode = 1` reaches `-0.354` and `P001928` stays rigidly locked to `handleRoot`.
  - Same-frame before/after captures at CH.01 (`progress = 0.35`) proving pixel luminance parity between gearbox housing and handle body.
  - Standard gates: `npm run typecheck`, `npm test`, `npm run check:station2`, fresh `:4173` preview server.

## Out of scope

- No geometry modification or GLB re-export.
- Rear LCD cluster and decal layers (JG-025 / JG-027) remain untouched.
- Stations 2 and 3 geometry and materials remain untouched.

## Acceptance Criteria

1. `npm run typecheck` and `npm test` PASS.
2. `node scripts/check-station2-contract.mjs` PASS.
3. `verify-jg028-handle-realism.mjs` PASS (material roles, color values, explosion ladder byte-identical).
4. CH.01 rendered frame shows the handle body and trigger blade as black as the gearbox cylinder, with `P001928` rendering as stainless steel.
5. Owner visual ruling PASS at `:4173` CH.01 hero view.
