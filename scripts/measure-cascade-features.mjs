// Read-only measurement of the protected CAD mesh; writes JSON evidence only.
// Run from the repository root: node scripts/measure-cascade-features.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import draco3d from 'draco3d'

const asset = path.resolve('public/models/Default.glb')
const outDir = path.resolve('output/playwright/owner-corrections/56-features')
const bytes = fs.readFileSync(asset)
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex')
const before = hash(bytes)
if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) throw Error('Expected GLB v2')
let gltf, binary
for (let offset = 12; offset < bytes.length;) {
  const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4)
  const chunk = bytes.subarray(offset + 8, offset + 8 + length)
  if (type === 0x4e4f534a) gltf = JSON.parse(chunk.toString('utf8'))
  if (type === 0x004e4942) binary = chunk
  offset += 8 + length
}
if (!gltf || !binary) throw Error('Missing GLB chunks')
const draco = await draco3d.createDecoderModule({})
const planets = ['P000247', 'P000248', 'P000069', 'P003046']
const suns = ['P001835', 'P001836', 'P001837', 'P001849', 'P003045', 'P003047']
const sampleCount = 3600
const angles = Array.from({ length: sampleCount }, (_, i) => i * 2 * Math.PI / sampleCount)
const rays = angles.map((a) => [Math.cos(a), Math.sin(a)])

function decodeMesh(meshIndex) {
  const triangles = [], bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
  let vertices = 0
  for (const primitive of gltf.meshes[meshIndex].primitives) {
    if ((primitive.mode ?? 4) !== 4) throw Error('Non-triangle primitive')
    const ext = primitive.extensions?.KHR_draco_mesh_compression
    if (!ext) throw Error('Expected Draco primitive')
    const view = gltf.bufferViews[ext.bufferView]
    const compressed = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
    const decoder = new draco.Decoder(), buffer = new draco.DecoderBuffer(), mesh = new draco.Mesh()
    const positions = new draco.DracoFloat32Array(), face = new draco.DracoInt32Array()
    try {
      buffer.Init(new Int8Array(compressed), compressed.length)
      const status = decoder.DecodeBufferToMesh(buffer, mesh)
      if (!status.ok() || !mesh.ptr) throw Error(status.error_msg())
      const attribute = decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION)
      if (!decoder.GetAttributeFloatForAllPoints(mesh, attribute, positions)) throw Error('Position decode failed')
      const points = Array.from({ length: mesh.num_points() }, (_, i) => {
        const p = [0, 1, 2].map((k) => positions.GetValue(i * 3 + k))
        for (let k = 0; k < 3; k++) { bounds.min[k] = Math.min(bounds.min[k], p[k]); bounds.max[k] = Math.max(bounds.max[k], p[k]) }
        return p
      })
      vertices += points.length
      for (let i = 0; i < mesh.num_faces(); i++) {
        decoder.GetFaceFromMesh(mesh, i, face)
        triangles.push([points[face.GetValue(0)], points[face.GetValue(1)], points[face.GetValue(2)]])
      }
    } finally {
      for (const object of [positions, face, mesh, buffer, decoder]) draco.destroy(object)
    }
  }
  return { triangles, bounds, vertices }
}

// Intersect every triangle (all CAD primitives) with a plane normal to the
// candidate shaft axis. Outer ray/segment hits give an angle-uniform radial
// silhouette, avoiding tessellation-density bias in a raw vertex histogram.
function profileAt(triangles, axis, coordinate, rayDirections = rays) {
  const uv = [0, 1, 2].filter((k) => k !== axis), segments = []
  for (const triangle of triangles) {
    const hits = []
    for (let i = 0; i < 3; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3]
      if ((a[axis] <= coordinate && b[axis] > coordinate) || (b[axis] <= coordinate && a[axis] > coordinate)) {
        const t = (coordinate - a[axis]) / (b[axis] - a[axis])
        hits.push(uv.map((k) => a[k] + t * (b[k] - a[k])))
      }
    }
    if (hits.length === 2) segments.push(hits)
  }
  const radii = rayDirections.map(([dx, dy]) => {
    let radius = 0
    for (const [[ax, ay], [bx, by]] of segments) {
      const ex = bx - ax, ey = by - ay, denominator = dx * ey - dy * ex
      if (Math.abs(denominator) < 1e-15) continue
      const t = (ax * ey - ay * ex) / denominator
      const u = (ax * dy - ay * dx) / denominator
      if (t > radius && u >= -1e-10 && u <= 1 + 1e-10) radius = t
    }
    return radius
  })
  return { radii, segments: segments.length }
}

function medianProfile(raw) {
  return raw.map((_, i) => [-2, -1, 0, 1, 2]
    .map((k) => raw[(i + k + raw.length) % raw.length]).sort((a, b) => a - b)[2])
}

function analyze(radii) {
  const min = Math.min(...radii), max = Math.max(...radii)
  const mean = radii.reduce((sum, r) => sum + r, 0) / radii.length
  const variance = radii.reduce((sum, r) => sum + (r - mean) ** 2, 0) / radii.length
  const harmonics = Array.from({ length: 80 }, (_, i) => {
    const count = i + 1
    let re = 0, im = 0
    for (let j = 0; j < radii.length; j++) {
      re += (radii[j] - mean) * Math.cos(count * angles[j])
      im += (radii[j] - mean) * Math.sin(count * angles[j])
    }
    const amplitude = 2 * Math.hypot(re, im) / radii.length
    return { count, amplitude, varianceFraction: variance ? amplitude ** 2 / (2 * variance) : 0 }
  }).sort((a, b) => b.amplitude - a.amplitude)
  const sorted = [...radii].sort((a, b) => a - b)
  const low = sorted[Math.floor(sorted.length * 0.01)], high = sorted[Math.floor(sorted.length * 0.99)]
  const thresholdRuns = [0.25, 0.5, 0.75].map((fraction) => {
    const threshold = low + fraction * (high - low)
    let count = 0
    for (let i = 0; i < radii.length; i++) if (radii[i] > threshold && radii[(i + radii.length - 1) % radii.length] <= threshold) count++
    return { fraction, count }
  })
  const best = harmonics[0]
  const shift = radii.length / best.count
  let squaredError = 0
  for (let i = 0; i < radii.length; i++) {
    const index = (i + shift) % radii.length, lo = Math.floor(index), t = index - lo
    const other = radii[lo] * (1 - t) + radii[(lo + 1) % radii.length] * t
    squaredError += (radii[i] - other) ** 2
  }
  return {
    minRadius: min, maxRadius: max, robustLowRadius: low, robustHighRadius: high,
    relativeRelief: mean ? (high - low) / mean : 0,
    missingRays: radii.filter((r) => r === 0).length,
    dominantCount: best.count, dominantVarianceFraction: best.varianceFraction,
    onePeriodRmsOverRelief: max > min ? Math.sqrt(squaredError / radii.length) / (max - min) : null,
    thresholdRuns, topHarmonics: harmonics.slice(0, 6),
  }
}

const measurements = []
for (const part of [...planets, ...suns]) {
  const nodes = gltf.nodes.map((node, index) => ({ ...node, index }))
    .filter((node) => node.name?.startsWith(`${part}-`) && node.mesh !== undefined)
  const meshIds = [...new Set(nodes.map((node) => node.mesh))]
  if (!meshIds.length) throw Error(`Part not found: ${part}`)
  for (const meshIndex of meshIds) {
    const { triangles, bounds, vertices } = decodeMesh(meshIndex)
    const slices = []
    const isPlanet = planets.includes(part)
    // Planet axes are evaluated independently on X/Y/Z. Integral sun candidates
    // are scanned along local Z; these CAD carrier/shaft parts use that axis.
    for (const axis of isPlanet ? [0, 1, 2] : [2]) {
      const fractions = isPlanet ? [0.2, 0.35, 0.5, 0.65, 0.8] : Array.from({ length: 39 }, (_, i) => (i + 1) / 40)
      for (const fraction of fractions) {
        const coordinate = bounds.min[axis] + fraction * (bounds.max[axis] - bounds.min[axis])
        const { radii, segments } = profileAt(triangles, axis, coordinate)
        const filtered = medianProfile(radii)
        const metrics = analyze(filtered), rawMetrics = analyze(radii)
        const dropouts = radii.flatMap((radius, i) => radius < filtered[i] * 0.9
          ? [{ degree: i / 10, rawRadius: radius, filteredRadius: filtered[i] }] : [])
        slices.push({ axis: 'xyz'[axis], fraction, coordinate, segments, ...metrics,
          rawDominantCount: rawMetrics.dominantCount, rawDominantVarianceFraction: rawMetrics.dominantVarianceFraction,
          rawMissingRays: rawMetrics.missingRays, dropouts, radii })
      }
    }
    const candidates = slices.filter((s) => s.missingRays === 0 && s.dominantCount >= 6
      && s.dominantCount === s.rawDominantCount && s.dominantVarianceFraction > 0.6 && s.relativeRelief > 0.02
      && s.onePeriodRmsOverRelief < 0.01 && s.dropouts.length / sampleCount < 0.005
      && s.thresholdRuns.every((t) => t.count === s.dominantCount))
    const counts = [...new Set(candidates.map((s) => s.dominantCount))]
    // Recast a representative plane at two independent angular-grid offsets,
    // so an integer count cannot be an accident of rays landing on CAD seams.
    const phaseChecks = counts.flatMap((count) => {
      const matching = candidates.filter((s) => s.dominantCount === count)
      const slice = matching[Math.floor(matching.length / 2)]
      return [0.037, 0.061].map((offsetDegrees) => {
        const directions = angles.map((a) => [Math.cos(a + offsetDegrees * Math.PI / 180), Math.sin(a + offsetDegrees * Math.PI / 180)])
        const { radii } = profileAt(triangles, 'xyz'.indexOf(slice.axis), slice.coordinate, directions)
        const raw = analyze(radii), filtered = analyze(medianProfile(radii))
        return { expectedFromBaseGrid: count, axis: slice.axis, coordinate: slice.coordinate, offsetDegrees,
          rawDominantCount: raw.dominantCount, rawMissingRays: raw.missingRays, rawThresholdRuns: raw.thresholdRuns,
          filteredDominantCount: filtered.dominantCount, filteredThresholdRuns: filtered.thresholdRuns,
          onePeriodRmsOverRelief: filtered.onePeriodRmsOverRelief,
          passed: raw.dominantCount === count && filtered.dominantCount === count
            && filtered.thresholdRuns.every((t) => t.count === count) && filtered.onePeriodRmsOverRelief < 0.01 }
      })
    })
    if (phaseChecks.some((check) => !check.passed)) throw Error(`Angular-grid validation failed for ${part}`)
    const summary = {
      part, kind: isPlanet ? 'planet' : 'shaft/carrier sun candidate', meshIndex,
      instanceCount: nodes.filter((node) => node.mesh === meshIndex).length,
      primitiveCount: gltf.meshes[meshIndex].primitives.length, vertices, triangles: triangles.length, bounds,
      measuredCount: counts.length === 1 ? counts[0] : null,
      featurePeriodDegrees: counts.length === 1 ? 360 / counts[0] : null,
      candidateCounts: counts,
      phaseChecks,
      candidateSlices: candidates.map(({ radii, ...rest }) => rest),
      uncertainty: 'Geometric repetition only; require raw/filtered Fourier agreement, three threshold-run counts, <1% one-period RMS/relief, and <0.5% isolated ray dropouts. Five-bin circular median (.4 degree window) suppresses isolated primitive seams; raw profiles and dropout angles are retained. Carrier pins/splines/shanks can also repeat; identify sun by axial location and radius. No timing or tooth-count constants are imported.',
      slices: slices.map(({ radii, ...rest }) => rest),
    }
    measurements.push(summary)
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, `${part}.json`), JSON.stringify({ ...summary, profiles: slices.map(({ axis, fraction, radii }) => ({ axis, fraction, radii })) }, null, 2) + '\n')
    console.log(JSON.stringify({ part, count: summary.measuredCount, candidates: counts,
      acceptedSlices: candidates.length, phaseChecksPassed: phaseChecks.filter((check) => check.passed).length,
      axes: [...new Set(candidates.map((s) => s.axis))],
      rawDropoutsMax: candidates.length ? Math.max(...candidates.map((s) => s.dropouts.length)) : null }))
  }
}
const after = hash(fs.readFileSync(asset))
if (before !== after) throw Error('Protected asset changed during measurement')
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), asset, sha256Before: before, sha256After: after,
  assetUnchanged: before === after, decoder: 'installed draco3d; POSITION and triangle indices from KHR_draco_mesh_compression',
  method: 'All primitives decoded; 3600 angle-uniform outer radial ray intersections of triangle/plane sections. Raw and five-bin circular-median Fourier counts 1..80 must agree; cross-check with three threshold-run counts (25/50/75% of 1st..99th percentile radial range), one-period RMS <1% of relief, and <0.5% isolated ray dropouts. Recast one representative plane per candidate count with .037 and .061 degree grid offsets. Planet axis scan X/Y/Z, five interior planes each; sun candidates 39 local-Z planes. Center is CAD local origin, not asymmetric AABB midpoint.',
  suppliedLivePlanetCounts: { stage1: 4, stage2: 4, stage5: 4, stage3: 4, stage4: 5 },
  limitations: ['No headed playback or aliasing speed measurement.', 'Symmetry is not a contact/mesh-conjugacy proof.', 'Counts describe compressed render geometry, not manufacturing source.', 'Finite .1-degree angular sampling, Draco quantization, plane selection, and CAD-origin centering limit precision.'],
  measurements,
}, null, 2) + '\n')
