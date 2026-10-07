import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, PointLight,
  Camera, Color, MeshBasicMaterial, Object3D, Scene, ShaderMaterial, ShapeUtils, Vector2,
  Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three'
import { CRACK_APERTURE_GLSL } from './breakthrough'
import {
  PORTAL_AMBIENT_FLOOR, PORTAL_FISSURE_CEILING, PORTAL_FISSURE_FALLOFF_M,
  PORTAL_FISSURE_HEX, PORTAL_FISSURE_RGB, PORTAL_HAZE_EXTINCTION_M, PORTAL_HAZE_RGB,
  PORTAL_MOUTH_Z, PORTAL_RELIEF_M, PORTAL_ROCK_DARK, PORTAL_ROCK_EXTINCTION_M,
  PORTAL_ROCK_LIGHT, PORTAL_SHAFT_DEPTH_M,
  buildPortalShaftProfile, makePortalShaftGeometry, portalOcclusionGuarantee,
} from './portalGeometry'

/** Sheet-local metres. The desktop is cut out, rather than drawn over the model. */
export const PORTAL_DESK_Z = -0.0016
export { PORTAL_MOUTH_Z }

/** Shared by the desk and paper shaders; use the exact barrier raster and sheet frame. */
export const PORTAL_PROFILE_GLSL = /* glsl */ `
uniform sampler2D uBarrierMask;
uniform vec2 uPortalSheetSize;
uniform float uPortalLight;
float portalProfile(vec2 p) {
  return texture2D(uBarrierMask, p / uPortalSheetSize + 0.5).r;
}
float portalRim(vec2 p) {
  float nearby = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853982;
    nearby += portalProfile(p + 0.0018 * vec2(cos(a), sin(a)));
  }
  return abs(nearby / 8.0 - portalProfile(p));
}
`

const VERTEX = /* glsl */ `
varying vec3 vPortal;
void main() {
  vPortal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/**
 * Rock shaft shading. One body serves both the walls and the far closure; the only difference
 * is `uPortalWall`, which switches the fissures and the lip spill on and off. Because the
 * closure shares every other term — the same relief field, sampled at the same depth — it
 * shades to the value the walls already have at that depth, so its silhouette has no contrast
 * to show (portalClosureContrast8Bit() is the numeric contract behind that claim).
 *
 * Values written here are display-referred, matching the rest of the sheet's ShaderMaterials:
 * this pipeline writes gl_FragColor with no colorspace or tone-mapping chunk, so #79CFFF is
 * carried as its sRGB components and its hue survives at every intensity.
 */
const FRAGMENT = /* glsl */ `
uniform float uPortalLight;
uniform float uPortalTime;
uniform float uPortalLite;
uniform float uPortalWall;
uniform float uPortalMouthZ;
uniform float uPortalRockExtinction;
uniform float uPortalHazeExtinction;
uniform float uPortalRelief;
uniform float uPortalRockAlive;
uniform vec3 uPortalFissure;
uniform vec3 uPortalRockDark;
uniform vec3 uPortalRockLight;
uniform vec3 uPortalHaze;
varying vec3 vPortal;
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
float fbm3(vec3 q, float octaves) {
  float sum = vnoise(q);
  if (octaves > 1.5) sum += 0.5 * vnoise(q * 2.03 + vec3(11.3, 5.1, 7.7));
  return sum / (octaves > 1.5 ? 1.5 : 1.0);
}
void main() {
  float depth = max(0.0, uPortalMouthZ - vPortal.z);
  vec2 p = vPortal.xy;
  float octaves = mix(2.0, 1.0, step(0.5, uPortalLite));
  // Chipped rock: a plate field, a chip field, and a facet tilt for the trace to catch.
  vec3 q = vec3(p * 32.0, depth * 3.1);
  float plate = fbm3(q, octaves);
  float chip = fbm3(vec3(p * 132.0 + 3.7, depth * 19.0), octaves);
  float tilt = fbm3(q + vec3(0.41, 0.23, 0.11), octaves) - plate;
  float facet = clamp(0.42 + 1.15 * (plate - 0.5) + 1.7 * tilt + 0.34 * (chip - 0.5), 0.0, 1.0);
  vec3 rock = mix(uPortalRockDark, uPortalRockLight, facet);
  vec3 c = rock * exp(-depth / uPortalRockExtinction);
  if (uPortalWall > 0.5) {
    // The lip catches the trace that tore it, and the fissures are the only emission in here.
    float lip = 1.0 - smoothstep(0.0, 0.055, depth);
    c += uPortalFissure * 0.06 * uPortalLight * lip * facet;
    float seam = fbm3(vec3(p * 8.4, depth * 0.58), octaves);
    float ridge = 1.0 - abs(2.0 * seam - 1.0);
    float width = max(fwidth(ridge), 0.0001) * 1.35;
    float line = smoothstep(1.0 - width, 1.0, ridge);
    float halo = exp(-pow((1.0 - ridge) / 0.17, 2.0)) * 0.20;
    float descent = exp(-depth / ${PORTAL_FISSURE_FALLOFF_M});
    float shimmer = 1.0 + 0.05 * sin(uPortalTime * 0.9 + depth * 6.3) * (1.0 - uPortalLite);
    float glow = (line + halo) * descent * shimmer * uPortalLight;
    c += uPortalFissure * min(glow, ${PORTAL_FISSURE_CEILING});
  }
  c *= mix(${PORTAL_AMBIENT_FLOOR}, 1.0, clamp(uPortalLight, 0.0, 1.0));
  c += uPortalHaze * exp(-depth / uPortalHazeExtinction);
  gl_FragColor = vec4(c, 1.0);
}`

/** Reversible, deterministic pulse: no wall-clock animation while scroll is held. */
export function portalPulse(t: number, reducedMotion: boolean) {
  return reducedMotion ? 1 : 0.94 + 0.035 * Math.sin(t * 71.0 + 0.7)
    + 0.025 * Math.sin(t * 137.0 + Math.sin(t * 29.0))
}

/**
 * The JG-035 vertical rock shaft. Ring 0 is the exact torn contour at the lip; every deeper
 * ring is that contour displaced by millimetres (see portalGeometry). There is no floor in the
 * wall mesh: the only closing surface is the far closure one full shaft depth below the lip,
 * beyond every sight line that fits through the aperture, and shading below one 8-bit step.
 */
export function makePortal(
  outline: number[][],
  initialModelBottom: number,
  center: Vector2,
  sharedLight: { value: number },
) {
  const shaft = makePortalShaftGeometry(outline)
  const profile = buildPortalShaftProfile(outline)
  const occlusion = portalOcclusionGuarantee(profile.extentM)
  const closureZ = PORTAL_MOUTH_Z - PORTAL_SHAFT_DEPTH_M
  const group = new Group()
  group.name = 'profile-dimensional-portal'
  const uniforms = {
    uPortalLight: sharedLight,
    uPortalTime: { value: 0 }, uPortalLite: { value: 0 },
    uPortalWall: { value: 0 }, uPortalMouthZ: { value: PORTAL_MOUTH_Z },
    uPortalCenter: { value: center.clone() },
    uPortalRelief: { value: PORTAL_RELIEF_M },
    uPortalRockAlive: { value: PORTAL_AMBIENT_FLOOR },
    uPortalRockExtinction: { value: PORTAL_ROCK_EXTINCTION_M },
    uPortalHazeExtinction: { value: PORTAL_HAZE_EXTINCTION_M },
    uPortalFissure: { value: new Vector3(...PORTAL_FISSURE_RGB) },
    uPortalRockDark: { value: new Vector3(...PORTAL_ROCK_DARK) },
    uPortalRockLight: { value: new Vector3(...PORTAL_ROCK_LIGHT) },
    uPortalHaze: { value: new Vector3(...PORTAL_HAZE_RGB) },
  }
  const capMaterial = new ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    side: DoubleSide, depthTest: true, depthWrite: true, transparent: false, toneMapped: false })
  const wallMaterial = new ShaderMaterial({ uniforms: { ...uniforms, uPortalWall: { value: 1 } },
    vertexShader: VERTEX, fragmentShader: FRAGMENT,
    side: DoubleSide, depthTest: true, depthWrite: true, transparent: false, toneMapped: false })
  const cap = new Mesh(shaft.closureGeometry, capMaterial)
  const walls = new Mesh(shaft.wallGeometry, wallMaterial)
  cap.name = 'portal-far-closure'; walls.name = 'portal-vertical-rock-walls'
  // Draw behind-stock geometry after the opaque paper so depth rejects hidden wall shading.
  cap.renderOrder = walls.renderOrder = 2
  cap.frustumCulled = walls.frustumCulled = false
  group.add(cap, walls)
  const light = new PointLight(PORTAL_FISSURE_HEX, 0, 0.6, 2)
  light.name = 'portal-upward-bounce'
  light.position.set(center.x, center.y, -0.014)
  group.add(light)
  return {
    group, cap, walls, light,
    /** Deepest surface of the shaft. Retained under the historical name for the sheet stats. */
    capZ: closureZ, closureZ, mouthZ: PORTAL_MOUTH_Z, initialModelBottom,
    shaftDepthM: PORTAL_SHAFT_DEPTH_M,
    wallLevels: shaft.ringCount, ringDepthsM: shaft.ringDepthsM,
    profilePoints: profile.count, maxRingDeviationM: shaft.maxRingDeviationM,
    extentM: profile.extentM, occlusion,
    /** False by construction: no sight line through the torn aperture reaches the closure. */
    capVisible: false,
    closureBehindInitialModel: closureZ < initialModelBottom,
    fissureColor: PORTAL_FISSURE_RGB,
    update(t: number, strength: number, lite: boolean, reducedMotion: boolean) {
      const pulse = portalPulse(t, reducedMotion)
      sharedLight.value = strength * pulse
      uniforms.uPortalTime.value = reducedMotion ? 0 : t * 5
      uniforms.uPortalLite.value = lite ? 1 : 0
      light.intensity = sharedLight.value * 0.045
      return pulse
    },
    dispose() {
      shaft.wallGeometry.dispose(); shaft.closureGeometry.dispose()
      capMaterial.dispose(); wallMaterial.dispose()
      light.dispose()
    },
  }
}

/**
 * Off-frame, pixel-authoritative null comparisons. No scene/material changes survive.
 *
 * Four reads isolate the shaft from everything else in the frame: both meshes hidden (the
 * portal's own contribution), only the closure hidden, and only the walls hidden. The last two
 * are what separate a wall pixel from a visible closure pixel — the honest replacement for the
 * old "capBehindInitialModel" shorthand, which could only ever say where the cap sat.
 */
export function capturePortalPixels({ gl, camera, sheet, outline, portal, desk, paper, fragments, edge }: {
  gl: WebGLRenderer; camera: Camera; sheet: Group; outline: number[][];
  portal: ReturnType<typeof makePortal>; desk: Mesh; paper: Mesh; fragments: Mesh[]; edge: Mesh;
}) {
  let root: Object3D = sheet
  while (root.parent) root = root.parent
  const model = root.getObjectByName('jgun-live-registered-model')
  if (!model) throw new Error('Portal pixel proof requires the live registered JGun root')
  root.updateMatrixWorld(true)
  const width = 640, height = Math.max(1, Math.round(width * gl.domElement.height / gl.domElement.width))
  const target = new WebGLRenderTarget(width, height)
  const priorTarget = gl.getRenderTarget(), cameraMatrix = camera.matrixWorld.clone()
  const capVisible = portal.cap.visible, wallVisible = portal.walls.visible
  const modelVisible = model.visible, deskVisible = desk.visible
  const maskScene = new Scene()
  maskScene.background = new Color(0)
  const profileGeometry = new BufferGeometry()
  profileGeometry.setAttribute('position', new Float32BufferAttribute(outline.flatMap(p => [p[0], p[1], -0.00046]), 3))
  profileGeometry.setIndex(ShapeUtils.triangulateShape(outline.map(p => new Vector2(p[0], p[1])), []).flat())
  const white = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, toneMapped: false })
  const shape = new Mesh(profileGeometry, white)
  shape.matrixAutoUpdate = false; shape.matrix.copy(sheet.matrixWorld)
  shape.visible = sheet.visible; shape.frustumCulled = false
  maskScene.add(shape)
  const blockers: ShaderMaterial[] = []
  // Rasterize the real displaced/rotated stock in black, rather than counting the full
  // projected polygon when intact fragments still cover it. Hairlines are preserved.
  for (const original of [paper, ...fragments, edge]) {
    if (!original.visible) continue
    const material = original.material as ShaderMaterial
    const black = new ShaderMaterial({ uniforms: material.uniforms, vertexShader: material.vertexShader,
      fragmentShader: `${CRACK_APERTURE_GLSL}
        varying vec2 vPlane; void main(){ openHairline(vPlane); gl_FragColor=vec4(0,0,0,1); }`,
      side: DoubleSide, depthWrite: true, toneMapped: false })
    const blocker = new Mesh(original.geometry, black)
    blocker.matrixAutoUpdate = false; blocker.matrix.copy(original.matrixWorld)
    blocker.frustumCulled = false
    maskScene.add(blocker); blockers.push(black)
  }
  const read = (scene: Object3D) => {
    const pixels = new Uint8Array(width * height * 4)
    gl.setRenderTarget(target)
    gl.render(scene, camera)
    gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
    return pixels
  }
  try {
    const mask = read(maskScene)
    const normal = read(root)
    portal.cap.visible = portal.walls.visible = false
    const noPortal = read(root)
    portal.walls.visible = wallVisible
    const noCap = read(root)
    portal.walls.visible = false; portal.cap.visible = true
    const noWall = read(root)
    portal.cap.visible = capVisible; portal.walls.visible = wallVisible
    model.visible = false
    const noModel = read(root)
    model.visible = modelVisible
    desk.visible = false
    const noDesk = read(root)
    desk.visible = deskVisible
    const changed = (a: Uint8Array, b: Uint8Array, i: number) =>
      Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > 8
    let portalChangedPixels = 0, modelChangedPixels = 0, deskChangedInsidePixels = 0, sampledInsidePixels = 0
    let capChangedPixels = 0, wallChangedPixels = 0
    let portalVisiblePixels = 0, portalMaxLuminance = 0, portalWhitePixels = 0, portalFissurePixels = 0
    let xMin = width, xMax = -1, yMin = height, yMax = -1
    // Erode two pixels to reject silhouette/rim AA and partially covered departing fragments.
    for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
      let inside = true
      for (let dy = -2; dy <= 2 && inside; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (mask[((y + dy) * width + x + dx) * 4] < 250) { inside = false; break }
      }
      if (!inside) continue
      const i = (y * width + x) * 4
      sampledInsidePixels++
      if (changed(normal, noPortal, i)) portalChangedPixels++
      if (changed(normal, noModel, i)) modelChangedPixels++
      if (changed(normal, noDesk, i)) deskChangedInsidePixels++
      if (changed(normal, noCap, i)) capChangedPixels++
      if (changed(normal, noWall, i)) wallChangedPixels++
      // Statistics over pixels where the shaft itself is the visible surface: the emerging
      // metal and the surviving stock occlude the shaft there and are excluded here.
      if (changed(normal, noPortal, i)) {
        portalVisiblePixels++
        const r = normal[i] / 255, g = normal[i + 1] / 255, b = normal[i + 2] / 255
        const lum = Math.max(Math.max(r, g), b)
        if (lum > portalMaxLuminance) portalMaxLuminance = lum
        const min = Math.min(Math.min(r, g), b)
        if (min > 0.62 * lum && lum > 0.12) portalWhitePixels++
        if (b - r > 0.08 && b > 0.10 && r / Math.max(b, 1e-6) < 0.8) portalFissurePixels++
      }
      xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
    }
    const controls = [[0, 0, 8, 8], [width - 8, height - 8, 8, 8]].map(rect => {
      let portalChangedPixels = 0, modelChangedPixels = 0, deskChangedPixels = 0
      for (let y = rect[1]; y < rect[1] + rect[3]; y++) for (let x = rect[0]; x < rect[0] + rect[2]; x++) {
        const i = (y * width + x) * 4
        if (changed(normal, noPortal, i)) portalChangedPixels++
        if (changed(normal, noModel, i)) modelChangedPixels++
        if (changed(normal, noDesk, i)) deskChangedPixels++
      }
      return { rect, pixels: rect[2] * rect[3], portalChangedPixels, modelChangedPixels, deskChangedPixels }
    })
    return {
      portalChangedPixels, modelChangedPixels, deskChangedInsidePixels, sampledInsidePixels,
      profilePixels: sampledInsidePixels, cameraUnchanged: cameraMatrix.equals(camera.matrixWorld), controls,
      clipRect: sampledInsidePixels ? [xMin, height - 1 - yMax, xMax - xMin + 1, yMax - yMin + 1] : null,
      width, height,
      sampleClipRect: sampledInsidePixels ? { x: xMin, y: height - 1 - yMax, width: xMax - xMin + 1, height: yMax - yMin + 1 } : null,
      mask: 'projected-torn-profile-minus-live-stock-fragments-rim-eroded-2px',
      fixedCamera: cameraMatrix.equals(camera.matrixWorld),
      portalActive: sheet.visible && portal.group.visible,
      modelVisible, deskVisible, capZ: portal.capZ,
      // Wall versus visible closure. capVisiblePixels is measured, not asserted: a closure that
      // any sight line could reach would show up here, and the shaft design says it cannot.
      capChangedPixels, wallChangedPixels, capVisiblePixels: capChangedPixels, capVisible: capChangedPixels > 0,
      wallVisible: wallChangedPixels > 0,
      closureOccluded: portal.occlusion.closureOccluded,
      // Deep-frame honesty: no white core, no floodlight, fissures blue and walls-only.
      portalVisiblePixels, portalMaxLuminance, portalWhitePixels, portalFissurePixels,
      shaftDepthM: portal.shaftDepthM, wallLevels: portal.wallLevels,
      maxRingDeviationM: portal.maxRingDeviationM, extentM: portal.extentM,
      occlusionMargin: portal.occlusion.margin,
      shaderValid: gl.info.programs?.every(p =>
        (p as typeof p & { diagnostics?: { runnable: boolean } }).diagnostics?.runnable !== false) ?? false,
    }
  } finally {
    portal.cap.visible = capVisible; portal.walls.visible = wallVisible
    model.visible = modelVisible; desk.visible = deskVisible
    gl.setRenderTarget(priorTarget)
    profileGeometry.dispose(); white.dispose(); blockers.forEach(m => m.dispose()); target.dispose()
  }
}
