import {
  DataTexture,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  Vector2,
  type Material,
} from 'three'

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
  | 'blackOxideSteel'
  | 'anodizedAluminum'
  | 'ringSwitch'
  | 'toolSteel'
  | 'cageSteel'
  | 'planetSteel'
  | 'clutchSteel'
  | 'rotorSteel'
  | 'steelDark'
  | 'chrome'
  | 'pcb'
  | 'display'
  | 'lcdScreen'
  | 'buttonBacklit'
  | 'battery'
  | 'polymer'
  | 'grooveBlue'
  | 'grooveRed'

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
  // Rear handle digital LCD screen (P002115) — warm emissive white.
  [/P002115/i, 'lcdScreen'],
  // Rear handle buttons (P002123/P002124/P002125) — cool-blue backlit.
  [/(P002123|P002124|P002125)/i, 'buttonBacklit'],
  // LCD housing (P001924) — anodized aluminum, matches handle finish.
  [/P001924/i, 'anodizedAluminum'],
  // Ring switch (P003068) — anodized aluminum with knurled OD.
  [/P003068/i, 'ringSwitch'],
  // Ring switch pins (P000464) & ball-nose plungers (K000156) — machined clutch steel.
  [/(P000464|K000156)/i, 'clutchSteel'],
  // Gearbox intermediate housing (P000420) + outer shell (P000245) —
  // high-temp black oxide steel, distinct from anodized aluminum.
  [/(P000420|P000245)/i, 'blackOxideSteel'],
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
  // P000245 outer shell — high-temp black oxide steel (not clearcoat).
  if (unitKey === 'housing') return 'blackOxideSteel'
  if (unitKey === 'output') return 'toolSteel'
  // Handle assembly — anodized aluminum (matches ring switch finish).
  if (unitKey === 'handle') return 'anodizedAluminum'
  // The ring-switch unit also contains steel pins and ball plungers. P003068
  // is routed above; keep the hardware out of the ring body's knurl material.
  if (unitKey === 'ring-switch') return 'blackOxideSteel'
  // Clutch-static (P000420) — black oxide steel. Fork/cam/pins — clutch steel.
  if (unitKey === 'clutch-static') return 'blackOxideSteel'
  if (unitKey === 'clutch-sliding') return 'clutchSteel'
  // LCD parts fall back to their ROLE_OVERRIDES entries above; these unit
  // defaults are the safety net when no override matches.
  if (unitKey === 'lcd-screen') return 'lcdScreen'
  if (unitKey === 'lcd-buttons') return 'buttonBacklit'
  if (unitKey === 'lcd-housing') return 'anodizedAluminum'
  // Handle fasteners (2026-09-01 Fine re-export) — the handle unit default is
  // anodized aluminum; black-oxide socket/button-head screws are their own unit.
  if (unitKey === 'fastener') return 'blackOxideSteel'
  // Gearbox radial bolts (90910A815) — same black-oxide family, own units
  // for the per-bolt radial pop (keys are `gb-fastener-${i}`).
  if (unitKey.startsWith('gb-fastener')) return 'blackOxideSteel'
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
/** All live role cases share the B1 flat-to-PBR activation; no node-name override path. */
export const introPbrActivation = { value: 1 }

const KNURL_TEXTURE_SIZE = 256
const KNURL_REPEAT = new Vector2(30, 8)

/**
 * A seamless tangent-space diamond-knurl normal texture. Its height field is
 * two narrow, crossed diagonal ridges; central differences encode the result
 * in normal-map RGB so it works with the standard PBR normal-map path.
 */
export function createDiamondKnurlNormalMap(): DataTexture {
  const data = new Uint8Array(KNURL_TEXTURE_SIZE * KNURL_TEXTURE_SIZE * 4)
  const delta = 1 / KNURL_TEXTURE_SIZE

  const heightAt = (u: number, v: number) => {
    const forwardRidge = Math.pow(Math.abs(Math.sin((u + v) * Math.PI * 8)), 16)
    const reverseRidge = Math.pow(Math.abs(Math.sin((u - v) * Math.PI * 8)), 16)
    return Math.max(forwardRidge, reverseRidge)
  }

  for (let y = 0; y < KNURL_TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < KNURL_TEXTURE_SIZE; x += 1) {
      const u = x / KNURL_TEXTURE_SIZE
      const v = y / KNURL_TEXTURE_SIZE
      const dU = (heightAt(u + delta, v) - heightAt(u - delta, v)) / (2 * delta)
      const dV = (heightAt(u, v + delta) - heightAt(u, v - delta)) / (2 * delta)
      const normal = new Vector2(-dU * 0.06, -dV * 0.06)
      const z = Math.sqrt(Math.max(0, 1 - normal.lengthSq()))
      const offset = (y * KNURL_TEXTURE_SIZE + x) * 4

      data[offset] = Math.round((normal.x * 0.5 + 0.5) * 255)
      data[offset + 1] = Math.round((normal.y * 0.5 + 0.5) * 255)
      data[offset + 2] = Math.round((z * 0.5 + 0.5) * 255)
      data[offset + 3] = 255
    }
  }

  const texture = new DataTexture(data, KNURL_TEXTURE_SIZE, KNURL_TEXTURE_SIZE)
  texture.colorSpace = NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.copy(KNURL_REPEAT)
  texture.needsUpdate = true
  return texture
}

const ringSwitchKnurlNormalMap = createDiamondKnurlNormalMap()

/**
 * The GLB packs P003068's cylindrical OD and planar end faces into one mesh.
 * Gate tangent-space XY perturbation by the mesh-local Z normal so the knurl
 * lives on the radial OD while axial end faces retain smooth anodized metal.
 */
function applyRingSwitchOdKnurlMask(material: MeshPhysicalMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vRingSwitchObjectNormal;\n${shader.vertexShader}`.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>\n  vRingSwitchObjectNormal = normalize(objectNormal);',
    )
    shader.fragmentShader = `varying vec3 vRingSwitchObjectNormal;\n${shader.fragmentShader}`.replace(
      'mapN.xy *= normalScale;',
      `float ringSwitchOdMask = 1.0 - smoothstep(0.20, 0.55, abs(normalize(vRingSwitchObjectNormal).z));
\tmapN.xy *= normalScale * ringSwitchOdMask;`,
    )
  }
  material.customProgramCacheKey = () => 'ring-switch-od-knurl-v1'
}

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
    // High-temp black oxide steel — gearbox intermediate housing (P000420)
    // and outer shell (P000245). Turned steel with oxide finish: darker, more
    // specular than anodized aluminum, less clearcoat than the shell role.
    case 'blackOxideSteel':
      material = new MeshStandardMaterial({
        color: '#0d0d0d',
        roughness: 0.28,
        metalness: 0.96,
        envMapIntensity: 1.2,
      })
      break
    // Anodized aluminum — handle assembly and ring switch base finish.
    // Slightly warmer and more matte than black oxide steel.
    case 'anodizedAluminum':
      material = new MeshPhysicalMaterial({
        color: '#1a1a1e',
        roughness: 0.48,
        metalness: 0.82,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
        envMapIntensity: 1.0,
      })
      break
    // Ring switch (P003068) — anodized aluminum OD with knurled normal map.
    // The knurl crosshatch is on the outer diameter only; end faces are smooth
    // (same anodized finish, no normal bump).
    case 'ringSwitch': {
      const ringSwitchMaterial = new MeshPhysicalMaterial({
        color: '#1c1c1e',
        roughness: 0.52,
        metalness: 0.82,
        clearcoat: 0.2,
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.0,
        normalMap: ringSwitchKnurlNormalMap,
        normalScale: new Vector2(0.7, 0.7),
      })
      applyRingSwitchOdKnurlMask(ringSwitchMaterial)
      material = ringSwitchMaterial
      break
    }
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
    // Rear handle digital LCD screen (P002115) — warm white emissive,
    // casts soft warm fill onto the anodized LCD housing face.
    case 'lcdScreen':
      material = new MeshStandardMaterial({
        color: '#0a0a08',
        roughness: 0.35,
        metalness: 0,
        emissive: '#fffde0',
        emissiveIntensity: 5,
      })
      break
    // Rear handle buttons (P002123/P002124/P002125) — cool blue backlit.
    case 'buttonBacklit':
      material = new MeshStandardMaterial({
        color: '#080a0c',
        roughness: 0.4,
        metalness: 0,
        emissive: '#c8e6ff',
        emissiveIntensity: 1.5,
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
    // OSHA Blue — lower circumferential groove on P000420 (toward snout).
    // Semi-gloss painted enamel finish (#005DAA OSHA Safety Blue).
    case 'grooveBlue':
      material = new MeshStandardMaterial({
        color: '#005daa',
        roughness: 0.45,
        metalness: 0.05,
        envMapIntensity: 1.0,
      })
      break
    // OSHA Red — upper circumferential groove on P000420 (toward handle).
    // Semi-gloss painted enamel finish (#C8102E OSHA Safety Red).
    case 'grooveRed':
      material = new MeshStandardMaterial({
        color: '#c8102e',
        roughness: 0.45,
        metalness: 0.05,
        envMapIntensity: 1.0,
      })
      break
  }

  const ready=material as MeshStandardMaterial
  const compile=ready.onBeforeCompile.bind(ready)
  const cacheKey=ready.customProgramCacheKey.bind(ready)
  const originalKey=cacheKey()
  ready.onBeforeCompile=(shader,renderer)=>{
    compile(shader,renderer)
    shader.uniforms.uIntroPbr=introPbrActivation
    shader.fragmentShader='uniform float uIntroPbr;\n'+shader.fragmentShader
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight = mix(vec3(0.004, 0.021, 0.037), outgoingLight, uIntroPbr);\n#include <opaque_fragment>')
  }
  ready.customProgramCacheKey=()=>originalKey+'-intro-pbr-v1'
  roleMaterials.set(role, material as Material)
  return material as Material
}
