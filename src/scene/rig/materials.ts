import { MeshPhysicalMaterial, MeshStandardMaterial, type Material } from 'three'

/**
 * Photoreal PBR material system for the D1-AP assembly (Mark review
 * 2026-08-24: the CAD-placeholder look "needs to improve drastically").
 *
 * Targets come from Mark's reference pair — docs/torque-render.webp (product
 * render) and docs/jgun-handle-gearbox-description.md (exact PBR numbers):
 * deep-black clearcoat shells, hardened tool-steel output cluster, machined
 * steel internals, matte polycarbonate electronics with an emissive display,
 * and chrome fittings.
 *
 * Roles are assigned at consolidation time (nodeRoles.ts) from the mesh's
 * NODE name — part numbers and vendor names survive GLTFLoader mangling, so
 * every regex below matches a name confirmed present in Default.glb
 * (.scratch/measure-spans.mjs dump). Shared instances per role; the ghost
 * path clones whatever it fades, exactly like the original materials did.
 */

export type MaterialRole =
  | 'shellBlack'
  | 'barrelBlack'
  | 'toolSteel'
  | 'cageSteel'
  | 'planetSteel'
  | 'clutchSteel'
  | 'rotorSteel'
  | 'steelDark'
  | 'chrome'
  | 'pcb'
  | 'display'
  | 'battery'
  | 'polymer'

/**
 * Node-name overrides, checked before the unit default. Names are real GLB
 * nodes: rear-endcap electronics (z ≈ −0.11 — the CH.04 camera target), the
 * air-motor rotor, the USB shell, and the below-axis mounting brackets.
 */
const ROLE_OVERRIDES: readonly (readonly [RegExp, MaterialRole])[] = [
  // Backlit LCD manometer — emissive cyan segments per the reference spec.
  // Separator classes are [\s_]* because GLTFLoader mangles spaces into
  // underscores (see the rig's regex invariants).
  [/MANOMETER[\s_]*LCD|BK11356/i, 'display'],
  // Electronics stack: MCU, PC board, USB bridge, regulators, connectors.
  [/MSP430|PC[\s_]*BOARD|CP2102|FDC6327|TL3315|AT25320|AST[\s_]*SENSOR|SENSOR[\s_]*CONNECTOR|9HT7|51065/i, 'pcb'],
  [/Tenergy|LiPo/i, 'battery'],
  // Nickel-plated fittings: USB shell + misc plated hardware.
  [/CU04|K000537/i, 'chrome'],
  [/ROTOR/i, 'rotorSteel'],
  [/TEFLON/i, 'polymer'],
  // Below-axis mounting/reaction brackets (y center < −0.02 in rest pose).
  [/P002126|P003042/i, 'steelDark'],
  [/FLANGE/i, 'steelDark'],
]

const unitDefaultRole = (unitKey: string): MaterialRole => {
  if (unitKey === 'housing') return 'shellBlack'
  if (unitKey === 'output') return 'toolSteel'
  if (unitKey === 'handle') return 'barrelBlack'
  if (unitKey === 'clutch-static' || unitKey === 'clutch-sliding') return 'clutchSteel'
  if (unitKey.endsWith('-carrier')) return 'cageSteel'
  if (/^-stage\d+-planet/.test(unitKey) || unitKey.includes('-planet-')) return 'planetSteel'
  return 'steelDark'
}

/** Resolve the material role for a consolidated source mesh. */
export function materialRoleFor(unitKey: string, nodeName: string): MaterialRole {
  for (const [re, role] of ROLE_OVERRIDES) {
    if (re.test(nodeName)) return role
  }
  return unitDefaultRole(unitKey)
}

const roleMaterials = new Map<MaterialRole, Material>()

/** Shared PBR material instance per role (ghost buckets clone it). */
export function roleMaterial(role: MaterialRole): Material {
  let material = roleMaterials.get(role)
  if (material) return material

  switch (role) {
    // High-gloss deep-black clearcoat / powder-coat shells — the render's
    // signature surface. Clearcoat carries the softbox reflections that
    // make near-black read as gloss instead of void.
    case 'shellBlack':
      material = new MeshPhysicalMaterial({
        color: '#0a0a0a',
        roughness: 0.18,
        metalness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.2,
      })
      break
    case 'barrelBlack':
      material = new MeshPhysicalMaterial({
        color: '#0b0b0c',
        roughness: 0.2,
        metalness: 0.15,
        clearcoat: 0.9,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.15,
      })
      break
    // Semi-matte hardened tool steel with faint machining marks — output
    // anvil, spline collar, bushings (reference: #4A4D50 / 0.45 / 0.95).
    case 'toolSteel':
      material = new MeshStandardMaterial({
        color: '#4a4d50',
        roughness: 0.45,
        metalness: 0.95,
        envMapIntensity: 1.1,
      })
      break
    // Machined internals: carriers, clutch train, rotor (varied tone so the
    // exploded ladder reads as distinct parts, not one gray mass).
    case 'cageSteel':
      material = new MeshStandardMaterial({
        color: '#6e7276',
        roughness: 0.32,
        metalness: 0.9,
        envMapIntensity: 1.0,
      })
      break
    case 'planetSteel':
      material = new MeshStandardMaterial({
        color: '#585c60',
        roughness: 0.38,
        metalness: 0.95,
        envMapIntensity: 1.05,
      })
      break
    case 'clutchSteel':
      material = new MeshStandardMaterial({
        color: '#63666a',
        roughness: 0.35,
        metalness: 0.9,
        envMapIntensity: 1.0,
      })
      break
    case 'rotorSteel':
      material = new MeshStandardMaterial({
        color: '#7a7e82',
        roughness: 0.3,
        metalness: 0.95,
        envMapIntensity: 1.05,
      })
      break
    // Fasteners, bearings (K-series), brackets — black-oxide flavor.
    case 'steelDark':
      material = new MeshStandardMaterial({
        color: '#3a3d40',
        roughness: 0.42,
        metalness: 0.9,
        envMapIntensity: 0.95,
      })
      break
    // Stainless/chrome plating — inlet fittings, USB shell (0.18 / 0.90).
    case 'chrome':
      material = new MeshStandardMaterial({
        color: '#c9cdd2',
        roughness: 0.18,
        metalness: 0.9,
        envMapIntensity: 1.3,
      })
      break
    // Matte polycarbonate electronics fascia (0.60 / 0.0).
    case 'pcb':
      material = new MeshStandardMaterial({
        color: '#10161a',
        roughness: 0.55,
        metalness: 0.15,
      })
      break
    // Emissive display segments — reference calls for intensity 2.5–4.0.
    case 'display':
      material = new MeshStandardMaterial({
        color: '#05080b',
        roughness: 0.4,
        metalness: 0,
        emissive: '#35e0ff',
        emissiveIntensity: 3,
      })
      break
    case 'battery':
      material = new MeshStandardMaterial({
        color: '#1a2026',
        roughness: 0.6,
        metalness: 0.1,
      })
      break
    case 'polymer':
      material = new MeshStandardMaterial({
        color: '#c9cbc6',
        roughness: 0.55,
        metalness: 0,
      })
      break
  }

  roleMaterials.set(role, material as Material)
  return material as Material
}
