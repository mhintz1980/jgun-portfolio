import { BufferGeometry, CanvasTexture, DataTexture, LinearFilter, NearestFilter, RGBAFormat, UnsignedByteType } from 'three'

/** Printed layers stop at missing stock; this mask never hides model geometry. */
export const PAPER_BARRIER_GLSL = /* glsl */ `
uniform sampler2D uBarrierMask;
uniform float uFracture;
float missingStock(vec2 p) {
  return texture2D(uBarrierMask, p / vec2(0.8, 0.5) + 0.5).r;
}
void cutPrintedStock(vec2 p) {
  if (uFracture > 0.0 && missingStock(p) > 0.5) discard;
}
`

export function makeBarrierMask(points: number[][], width: number, height: number) {
  const nx = 1536, ny = 960
  const bytes = new Uint8Array(nx * ny * 4)
  for (let y = 0; y < ny; y++) {
    const py = ((y + 0.5) / ny - 0.5) * height
    const hits: number[] = []
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[j], b = points[i]
      if ((a[1] > py) !== (b[1] > py)) hits.push(a[0] + (py - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
    }
    hits.sort((a, b) => a - b)
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const lo = Math.max(0, Math.ceil((hits[i] / width + 0.5) * nx - 0.5))
      const hi = Math.min(nx - 1, Math.floor((hits[i + 1] / width + 0.5) * nx - 0.5))
      for (let x = lo; x <= hi; x++) bytes[(y * nx + x) * 4] = 255
    }
  }
  const texture = new DataTexture(bytes, nx, ny, RGBAFormat, UnsignedByteType)
  texture.minFilter = texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

/** A once-baked print travels on fragment fronts instead of floating in the hole. */
export function makeFragmentPrint(segs: number[], fills: number[], width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048; canvas.height = 1280
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = 'white'
  const scale = canvas.width / width
  for (let j = 0; j < segs.length; j += 9) {
    ctx.lineWidth = segs[j + 4] * 2 * scale
    const dash = segs[j + 8]
    ctx.setLineDash(dash > 0 ? [0.003 * scale, 0.0015 * scale] : [])
    ctx.beginPath()
    ctx.moveTo((segs[j] + width / 2) * scale, (height / 2 - segs[j + 1]) * scale)
    ctx.lineTo((segs[j + 2] + width / 2) * scale, (height / 2 - segs[j + 3]) * scale)
    ctx.stroke()
  }
  ctx.fillStyle = 'white'
  for(let j=0;j<fills.length;j+=15) {
    ctx.beginPath()
    ctx.moveTo((fills[j]+width/2)*scale,(height/2-fills[j+1])*scale)
    ctx.lineTo((fills[j+5]+width/2)*scale,(height/2-fills[j+6])*scale)
    ctx.lineTo((fills[j+10]+width/2)*scale,(height/2-fills[j+11])*scale)
    ctx.closePath();ctx.fill()
  }
  const texture = new CanvasTexture(canvas)
  texture.minFilter = texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}

export const CRACK_APERTURE_GLSL = /* glsl */ `
uniform sampler2D uCrackMask;
uniform float uPulseHead; uniform float uCrackGlow; uniform float uCrackGrowth;
void openHairline(vec2 p) {
  vec4 m = texture2D(uCrackMask, p / vec2(0.8, 0.5) + 0.5);
  if (m.a > 0.5 && ((m.r > 0.0 && m.r <= uPulseHead && uCrackGlow > 0.0) ||
                    (m.g > 0.0 && m.g <= uCrackGrowth))) discard;
}
`

/** Rasterized apertures only, with growth coordinates; the sheet remains opaque elsewhere. */
export function makeCrackMask(points: number[][], cracks: BufferGeometry, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 4096; canvas.height = 2560
  const ctx = canvas.getContext('2d')!, scale = canvas.width / width
  ctx.lineWidth = 0.00018 * scale
  ctx.lineCap = 'round'
  const stroke = (ax: number, ay: number, bx: number, by: number, color: string) => {
    ctx.strokeStyle = color; ctx.beginPath()
    ctx.moveTo((ax + width / 2) * scale, (height / 2 - ay) * scale)
    ctx.lineTo((bx + width / 2) * scale, (height / 2 - by) * scale); ctx.stroke()
  }
  for (let i = 1; i < points.length; i++) {
    stroke(...points[i - 1] as [number, number], ...points[i] as [number, number], `rgb(${Math.max(1, Math.round(255 * i / points.length))},0,0)`)
  }
  const p = cracks.getAttribute('position'), arc = cracks.getAttribute('arcLength')
  const ids = cracks.getAttribute('crackId')
  for (let i = 2; i < p.count; i += 2) {
    const ax = (p.getX(i - 2) + p.getX(i - 1)) / 2, ay = (p.getY(i - 2) + p.getY(i - 1)) / 2
    const bx = (p.getX(i) + p.getX(i + 1)) / 2, by = (p.getY(i) + p.getY(i + 1)) / 2
    if ((!ids || ids.getX(i) === ids.getX(i-2)) && Math.hypot(bx - ax, by - ay) < 0.012) stroke(ax, ay, bx, by, `rgb(0,${Math.max(1, Math.round(255 * arc.getX(i)))},0)`)
  }
  const texture = new CanvasTexture(canvas)
  texture.minFilter = texture.magFilter = NearestFilter; texture.generateMipmaps = false
  return texture
}
