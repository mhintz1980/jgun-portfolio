// JGUN high/low feature geometry investigator — read-only assets, writes only this folder.
// Run from the repository root:
//   node output/high-low-feature-proof/geometry/analyze-geometry.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Matrix4, Quaternion, Vector3 } from 'three'
import draco3d from 'draco3d'

const root = process.cwd()
const outDir = path.join(root, 'output/high-low-feature-proof/geometry')
const sourcePath = path.join(root, 'public/models/Default.glb')
const studyPath = path.join(root, 'public/models/manufacturing-core-full.glb')
const registryPath = path.join(root,
  'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/geometry/source-registry.json')

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex')
const nearly = (a, b, epsilon = 1e-12) => Math.abs(a - b) <= epsilon
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function readGlb(file) {
  const bytes = fs.readFileSync(file)
  assert(bytes.readUInt32LE(0) === 0x46546c67 && bytes.readUInt32LE(4) === 2, `Expected GLB v2: ${file}`)
  let json, binary
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4)
    const chunk = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'))
    if (type === 0x004e4942) binary = chunk
    offset += 8 + length
  }
  assert(json && binary, `Missing GLB chunks: ${file}`)
  return { bytes, json, binary }
}

function localMatrix(node) {
  if (node.matrix) return new Matrix4().fromArray(node.matrix)
  const p = new Vector3().fromArray(node.translation ?? [0, 0, 0])
  const q = new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1])
  const s = new Vector3().fromArray(node.scale ?? [1, 1, 1])
  return new Matrix4().compose(p, q, s)
}

function nodeWorld(doc, index) {
  const world = new Matrix4()
  let cursor = index
  const chain = []
  while (cursor !== undefined && cursor >= 0) {
    chain.push(cursor)
    cursor = doc.nodes.findIndex(parent => parent.children?.includes(cursor))
  }
  for (const nodeIndex of chain.reverse()) world.premultiply(localMatrix(doc.nodes[nodeIndex]))
  return world
}

function descendantIndices(doc, start) {
  const result = []
  const visit = index => {
    result.push(index)
    for (const child of doc.nodes[index].children ?? []) visit(child)
  }
  visit(start)
  return result
}

async function decodeTargets(file, targetName) {
  const glb = readGlb(file)
  const doc = glb.json
  const targetNodes = doc.nodes.map((node, index) => ({ node, index }))
    .filter(({ node }) => node.name?.toLowerCase().includes(targetName.toLowerCase()))
  const meshNodes = targetNodes.filter(({ node }) => node.mesh !== undefined)
  assert(meshNodes.length > 0, `No mesh-bearing target node ${targetName} in ${file}`)
  const decoderModule = await draco3d.createDecoderModule({})
  const meshes = []
  for (const { node, index } of meshNodes) {
    const world = nodeWorld(doc, index)
    const mesh = doc.meshes[node.mesh]
    const triangles = []
    let vertexCount = 0, faceCount = 0
    const primitiveDigests = []
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      assert((primitive.mode ?? 4) === 4, `Non-triangle primitive in ${node.name}`)
      const ext = primitive.extensions?.KHR_draco_mesh_compression
      assert(ext, `Expected Draco primitive ${node.name}#${primitiveIndex}`)
      const view = doc.bufferViews[ext.bufferView]
      const compressed = glb.binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
      primitiveDigests.push({ primitiveIndex, sha256: sha256(compressed), byteLength: compressed.length })
      const decoder = new decoderModule.Decoder(), buffer = new decoderModule.DecoderBuffer(), decoded = new decoderModule.Mesh()
      const positions = new decoderModule.DracoFloat32Array(), face = new decoderModule.DracoInt32Array()
      try {
        buffer.Init(new Int8Array(compressed), compressed.length)
        const status = decoder.DecodeBufferToMesh(buffer, decoded)
        assert(status.ok() && decoded.ptr, `${node.name} Draco decode failed: ${status.error_msg()}`)
        const attribute = decoder.GetAttributeByUniqueId(decoded, ext.attributes.POSITION)
        assert(attribute && decoder.GetAttributeFloatForAllPoints(decoded, attribute, positions), 'POSITION decode failed')
        const count = decoded.num_points()
        const points = []
        for (let i = 0; i < count; i++) {
          points.push(new Vector3(positions.GetValue(i * 3), positions.GetValue(i * 3 + 1), positions.GetValue(i * 3 + 2)))
        }
        vertexCount += count
        for (let i = 0; i < decoded.num_faces(); i++) {
          decoder.GetFaceFromMesh(decoded, i, face)
          triangles.push([points[face.GetValue(0)], points[face.GetValue(1)], points[face.GetValue(2)]])
        }
        faceCount += decoded.num_faces()
      } finally {
        for (const object of [positions, face, decoded, buffer, decoder]) decoderModule.destroy(object)
      }
    }
    meshes.push({ nodeIndex: index, name: node.name, meshIndex: node.mesh, world, vertexCount, faceCount, triangles, primitiveDigests })
  }
  return { glb, doc, nameOccurrences: targetNodes.map(({ node, index }) => ({ index, name: node.name, mesh: node.mesh })), meshes }
}

function transformTriangles(meshes, objectToShaft) {
  const output = []
  for (const mesh of meshes) for (const triangle of mesh.triangles) {
    output.push(triangle.map(point => point.clone().applyMatrix4(objectToShaft)))
  }
  return output
}

function bounds(triangles) {
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const triangle of triangles) for (const point of triangle) {
    min = min.map((value, k) => Math.min(value, [point.x, point.y, point.z][k]))
    max = max.map((value, k) => Math.max(value, [point.x, point.y, point.z][k]))
  }
  return { min, max }
}

function profileAt(triangles, y, rayCount = 1440, angleOffsetRadians = Math.PI / rayCount, directions = null) {
  const segments = []
  for (const triangle of triangles) {
    const hits = []
    for (let i = 0; i < 3; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3]
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        const t = (y - a.y) / (b.y - a.y)
        hits.push(new Vector3(a.x + t * (b.x - a.x), y, a.z + t * (b.z - a.z)))
      }
    }
    if (hits.length === 2) segments.push(hits)
  }
  const rays = directions ?? Array.from({ length: rayCount }, (_, i) => {
    const angle = i * 2 * Math.PI / rayCount + angleOffsetRadians
    return [Math.cos(angle), Math.sin(angle)]
  })
  const radii = []
  for (let i = 0; i < rayCount; i++) {
    const [dx, dz] = rays[i]
    let radius = 0
    for (const [a, b] of segments) {
      const ex = b.x - a.x, ez = b.z - a.z
      const denominator = dx * ez - dz * ex
      if (Math.abs(denominator) < 1e-15) continue
      const t = (a.x * ez - a.z * ex) / denominator
      const u = (a.x * dz - a.z * dx) / denominator
      if (t > radius && u >= -1e-10 && u <= 1 + 1e-10) radius = t
    }
    radii.push(radius)
  }
  return { radii, segments: segments.length }
}

function analyzeRadii(radii, rayCount) {
  const mean = radii.reduce((sum, value) => sum + value, 0) / radii.length
  const variance = radii.reduce((sum, value) => sum + (value - mean) ** 2, 0) / radii.length
  const harmonics = []
  for (let count = 1; count <= 24; count++) {
    let re = 0, im = 0
    for (let i = 0; i < radii.length; i++) {
      const angle = i * 2 * Math.PI / rayCount
      re += (radii[i] - mean) * Math.cos(count * angle)
      im += (radii[i] - mean) * Math.sin(count * angle)
    }
    const amplitude = 2 * Math.hypot(re, im) / radii.length
    harmonics.push({ count, amplitude, varianceFraction: variance ? amplitude ** 2 / (2 * variance) : 0 })
  }
  harmonics.sort((a, b) => b.amplitude - a.amplitude)
  return {
    minRadius: Math.min(...radii), maxRadius: Math.max(...radii), meanRadius: mean,
    missingRays: radii.filter(value => value === 0).length,
    relief: Math.max(...radii) - Math.min(...radii),
    topHarmonics: harmonics.slice(0, 5)
  }
}

function medianProfile(raw) {
  return raw.map((_, i) => [-2, -1, 0, 1, 2]
    .map(k => raw[(i + k + raw.length) % raw.length]).sort((a, b) => a - b)[2])
}

function summarizeProfile(triangles, y) {
  const rayCount = 1440
  const profile = profileAt(triangles, y, rayCount)
  const raw = analyzeRadii(profile.radii, rayCount)
  const filtered = analyzeRadii(medianProfile(profile.radii), rayCount)
  return {
    y, segmentCount: profile.segments, ...filtered,
    rawMissingRays: raw.missingRays, rawDominantCount: raw.topHarmonics[0].count,
    rawDominantVarianceFraction: raw.topHarmonics[0].varianceFraction
  }
}

function scan(triangles, samples) {
  return samples.map(y => summarizeProfile(triangles, y))
}

function phaseChecks(triangles, checks) {
  return checks.map(({ feature, y, expectedCount }) => [0.037, 0.061].map(offsetDegrees => {
    const rayCount = 1440, offset = offsetDegrees * Math.PI / 180
    const directions = Array.from({ length: rayCount }, (_, i) => {
      const angle = i * 2 * Math.PI / rayCount + offset
      return [Math.cos(angle), Math.sin(angle)]
    })
    const profile = profileAt(triangles, y, rayCount, offset, directions)
    const raw = analyzeRadii(profile.radii, rayCount)
    const filtered = analyzeRadii(medianProfile(profile.radii), rayCount)
    return {
      feature, y, expectedCount, offsetDegrees,
      rawDominantCount: raw.topHarmonics[0].count,
      rawMissingRays: raw.missingRays,
      filteredDominantCount: filtered.topHarmonics[0].count,
      filteredDominantVarianceFraction: filtered.topHarmonics[0].varianceFraction,
      passed: true
    }
  })).flat().map(check => ({
    ...check,
    passed: check.rawDominantCount === check.expectedCount
      && check.rawMissingRays === 0
      && check.filteredDominantCount === check.expectedCount
      && check.filteredDominantVarianceFraction > 0.5
  }))
}

function classifySixfoldFlatTopology(triangles) {
  const groups = new Map()
  const candidates = []
  for (const triangle of triangles) {
    const [a, b, c] = triangle
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize()
    const centroid = a.clone().add(b).add(c).divideScalar(3)
    const radius = Math.hypot(centroid.x, centroid.z)
    if (centroid.y < 58 || centroid.y > 72 || radius < 3.5 || radius > 4.8) continue
    const radial = new Vector3(centroid.x, 0, centroid.z).normalize()
    const alignment = Math.abs(normal.dot(radial))
    if (Math.abs(normal.y) > 1e-4 || alignment < .999) continue
    const yMin = Math.min(a.y, b.y, c.y), yMax = Math.max(a.y, b.y, c.y)
    const record = { yMin, yMax, alignment }
    const orientation = Math.atan2(normal.z, normal.x) * 180 / Math.PI
    candidates.push({ ...record, orientation })
  }
  assert(candidates.length > 0, 'No sixfold flat candidates')
  const anchor = candidates.reduce((best, value) => value.yMax - value.yMin > best.yMax - best.yMin ? value : best, candidates[0])
  for (const value of candidates) {
    if (value.yMin < 61.1096 || value.yMax > 71.121) continue
    let folded = (value.orientation - anchor.orientation) % 60
    if (folded < 0) folded += 60
    if (folded > 30) folded -= 60
    const key = Math.round(folded)
    const group = groups.get(key) ?? { orientationRelativeToAnchorMod60Deg: key, triangles: 0, yMin: Infinity, yMax: -Infinity }
    group.triangles++; group.yMin = Math.min(group.yMin, value.yMin); group.yMax = Math.max(group.yMax, value.yMax)
    groups.set(key, group)
  }
  const orientationGroups = [...groups.values()].sort((a, b) => a.orientationRelativeToAnchorMod60Deg - b.orientationRelativeToAnchorMod60Deg)
  assert(orientationGroups.length === 6, `Expected six sixfold orientation groups, found ${orientationGroups.length}`)
  assert(orientationGroups.every(group => group.triangles > 0), 'Empty sixfold orientation group')
  const strong = candidates.filter(value => value.yMin >= 61.1095 && value.yMax <= 71.121)
  return {
    method: 'Centroid y 58..72 mm, radius 3.5..4.8 mm, |normal.y| <= 1e-4, |normal dot radial| >= .999. Strong rows additionally have all vertices in y 61.1096..71.121; orientation is clustered relative to the longest axial-span anchor modulo 60 deg.',
    anchorOrientationDeg: anchor.orientation,
    candidateTriangleCount: candidates.length,
    strongFlatTriangleCount: strong.length,
    orientationGroups,
    bounds: {
      candidateYMin: candidates.length ? Math.min(...candidates.map(t => t.yMin)) : null,
      candidateYMax: candidates.length ? Math.max(...candidates.map(t => t.yMax)) : null,
      strongYMin: strong.length ? Math.min(...strong.map(t => t.yMin)) : null,
      strongYMax: strong.length ? Math.max(...strong.map(t => t.yMax)) : null
    },
    allStrongTrianglesWithinProposedBand: !strong.some(t => t.yMin < 61.109647 || t.yMax > 71.120672)
  }
}

function bandCoverage(triangles, min, max) {
  let intersecting = 0, inside = 0, straddlingLower = 0, straddlingUpper = 0
  for (const [a, b, c] of triangles) {
    const yMin = Math.min(a.y, b.y, c.y), yMax = Math.max(a.y, b.y, c.y)
    if (yMax < min || yMin > max) continue
    intersecting++
    if (yMin >= min && yMax <= max) inside++
    if (yMin < min && yMax >= min) straddlingLower++
    if (yMax > max && yMin <= max) straddlingUpper++
  }
  return { trianglesIntersecting: intersecting, trianglesFullyInside: inside,
    trianglesStraddlingLower: straddlingLower, trianglesStraddlingUpper: straddlingUpper }
}

function selectedPlaneEvidence(triangles, targets) {
  return targets.map(target => {
    const groups = new Map()
    for (const triangle of triangles) for (const point of triangle) {
      if (Math.abs(point.y - target) > 0.002) continue
      const key = point.y.toFixed(6), radius = Math.hypot(point.x, point.z)
      const group = groups.get(key) ?? { count: 0, minRadius: Infinity, maxRadius: -Infinity }
      group.count++; group.minRadius = Math.min(group.minRadius, radius); group.maxRadius = Math.max(group.maxRadius, radius)
      groups.set(key, group)
    }
    return {
      requestedPlaneY: target,
      decodedPlanes: [...groups.entries()].map(([key, value]) => ({ y: Number(key), ...value })).sort((a, b) => a.y - b.y)
    }
  })
}

function sameMeshNodes(doc, meshIndex) {
  return doc.nodes.map((node, index) => ({ node, index }))
    .filter(({ node }) => node.mesh === meshIndex)
    .map(({ node, index }) => ({ index, name: node.name ?? null }))
}

function meshEvidence(mesh) {
  const { triangles, primitiveDigests, ...rest } = mesh
  return {
    ...rest,
    primitiveCount: primitiveDigests.length,
    primitiveCompressedBytes: primitiveDigests.reduce((sum, digest) => sum + digest.byteLength, 0),
    primitiveSetSha256: sha256(JSON.stringify(primitiveDigests)),
    bounds: bounds(triangles)
  }
}

// The runtime-compatible study frame: CAD millimetres (x,y,z) -> study metres (x,z,-y).
const studyToShaft = new Matrix4().set(
  0.001, 0, 0, 0,
  0, 0, 0.001, 0,
  0, -0.001, 0, 0,
  0, 0, 0, 1,
).invert()
const mmFromMetre = new Matrix4().makeScale(1000, 1000, 1000)

const hashesBefore = { source: sha256(fs.readFileSync(sourcePath)), study: sha256(fs.readFileSync(studyPath)) }
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const source = await decodeTargets(sourcePath, 'P001835')
const study = await decodeTargets(studyPath, 'approvedshaft')

// Evidence JSON matrices are printed in mathematical row-major order; Matrix4.set is row-major.
const sourceRegistration = new Matrix4().set(...registry.registration.shaft_local_to_gltf_world.flat())
const sourceMeshes = source.meshes.map(mesh => {
  const objectToShaft = mmFromMetre.clone().multiply(sourceRegistration.clone().invert()).multiply(mesh.world)
  return { ...mesh, objectToShaft, triangles: transformTriangles([mesh], objectToShaft) }
})
// The G0 registration maps CAD shaft-local metres to Default.glb world. The mesh's
// own accessor frame is still glTF-oriented, so compose inverse(registration) * nodeWorld;
// the expected result is metre->mm plus glTF -Z -> CAD +Y (verified by decoded bounds).
const sourceAxisMappingError = Math.max(...sourceMeshes.map(mesh => {
  const e = mesh.objectToShaft.elements
  return Math.max(
    Math.abs(e[0] - 1000), Math.abs(e[6] - 1000), Math.abs(e[9] + 1000),
    Math.abs(e[1]), Math.abs(e[2]), Math.abs(e[4]), Math.abs(e[5]),
    Math.abs(e[8]), Math.abs(e[10]), Math.abs(e[11])
  )
}))
assert(sourceAxisMappingError < 5e-5, `Source registration did not reduce to CAD axis mapping: ${sourceAxisMappingError}`)
const studyMeshes = study.meshes.map(mesh => {
  const objectToShaft = studyToShaft.clone().multiply(mesh.world)
  return { ...mesh, objectToShaft, triangles: transformTriangles([mesh], objectToShaft) }
})

const sourceTriangles = sourceMeshes.flatMap(mesh => mesh.triangles)
const studyTriangles = studyMeshes.flatMap(mesh => mesh.triangles)
const sourceBounds = bounds(sourceTriangles)
const studyBounds = bounds(studyTriangles)
assert(nearly(sourceBounds.min[1], 0, 0.001) && nearly(sourceBounds.max[1], 71.524, 0.01), `Unexpected source shaft bounds ${JSON.stringify(sourceBounds)}`)
assert(nearly(studyBounds.min[1], 0, 0.001) && nearly(studyBounds.max[1], 71.524, 0.01), `Unexpected study shaft bounds ${JSON.stringify(studyBounds)}`)

const coarseSamples = []
for (let y = 0.25; y < 71.5; y += 0.5) coarseSamples.push(Number(y.toFixed(2)))
const transitionSamples = []
for (const [start, end, step] of [[2.5, 4, .05], [8.5, 15, .05], [19, 27, .1], [54, 71.5, .05]]) {
  for (let y = start; y <= end + 1e-9; y += step) transitionSamples.push(Number(y.toFixed(4)))
}
const profiles = {
  studyCoarse: scan(studyTriangles, coarseSamples),
  studyTransitions: scan(studyTriangles, transitionSamples),
  sourceCoarse: scan(sourceTriangles, coarseSamples),
  sourceTransitions: scan(sourceTriangles, transitionSamples)
}
const controlSliceSamples = [3.15, 3.2, 6, 9.5, 9.6, 9.8, 13.5, 13.8, 50, 61.1, 61.15, 66, 71.05, 71.1, 71.5]
const controlSlices = {
  source: controlSliceSamples.map(y => summarizeProfile(sourceTriangles, y)),
  study: controlSliceSamples.map(y => summarizeProfile(studyTriangles, y))
}
const angularPhaseControls = {
  source: phaseChecks(sourceTriangles, [
    { feature: 'tenTooth', y: 6, expectedCount: 10 },
    { feature: 'sixfold', y: 66, expectedCount: 6 }
  ]),
  study: phaseChecks(studyTriangles, [
    { feature: 'tenTooth', y: 6, expectedCount: 10 },
    { feature: 'tenToothLeadOut', y: 13.5, expectedCount: 10 },
    { feature: 'sixfold', y: 66, expectedCount: 6 }
  ])
}
assert(Object.values(angularPhaseControls).every(checks => checks.every(check => check.passed)), 'Angular phase control failed')
const sixfoldFlatTopology = {
  source: classifySixfoldFlatTopology(sourceTriangles),
  study: classifySixfoldFlatTopology(studyTriangles)
}
const selectedPlanes = {
  source: selectedPlaneEvidence(sourceTriangles, [3.174827, 9.524858, 9.789711, 61.109647, 71.120672, 71.52395]),
  study: selectedPlaneEvidence(studyTriangles, [3.174827, 9.524858, 13.938684, 61.109647, 71.120672, 71.52395])
}
const proposedInterface = {
  version: 'high-low-feature-geometry-v1',
  frame: 'shaft-local CAD millimetres, +Y axial; one or more closed axial bands per feature; one objectToShaft Matrix4 per mesh',
  features: {
    inputSunTeeth: {
      semantics: 'COMMON functional ten-tooth band only. This is the only ten-fold band authenticated in both source and study.',
      bands: [{ yMin: 3.174827, yMax: 9.524858, inclusive: true }],
      exclusions: ['Study-only hob lead-out after the functional face.', 'Source/study journal and shoulder transitions.']
    },
    inputSixfold: {
      semantics: 'Distinct far-end six-flat band, including its end lead-out through the shaft tip.',
      bands: [{ yMin: 61.109647, yMax: 71.52395, inclusive: true }],
      strongFlatSubBand: { yMin: 61.109647, yMax: 71.120672 },
      excludedLowerApproach: {
        yMin: 60.703546,
        yMax: 61.109647,
        reason: 'Near-circular/tessellated approach: the y=61.10 control has sixfold variance fraction only .034-.037 and lacks the six strong coplanar normal clusters; the distinct feature begins at the 61.1096 ring.'
      }
    }
  },
  variantExtension: {
    sourceShapingExit: { yMin: 9.524858, yMax: 9.789711 },
    studyHobLeadOut: { yMin: 9.524858, yMax: 13.938684 },
    contractCorrection: 'A full-surface/lead-out proof needs variant-selected bands (sourceP001835 vs studyApproved). The shared functional band above is sufficient for strict tooth-identity comparison; do not attach the study-only lead-out to source P001835.'
  },
  coordinateShader: {
    existingVShaftLocal: 'Yes on study legacy/approved shaft materials patched by applyProgression (and overlays/caps sharing those uniforms). It is NOT guaranteed on unpatched source-rig materials or arbitrary proof clones.',
    sourceRule: 'Compute a fresh objectToShaft from each live mesh.matrixWorld and the proof scene registration; do not reuse the raw Default.glb node transform after rig baking/consolidation.'
  },
  bandCoverage: {
    source: {
      inputSunTeeth: bandCoverage(sourceTriangles, 3.174827, 9.524858),
      sourceFullShapingFeature: bandCoverage(sourceTriangles, 3.174827, 9.789711),
      inputSixfold: bandCoverage(sourceTriangles, 61.109647, 71.52395)
    },
    study: {
      inputSunTeeth: bandCoverage(studyTriangles, 3.174827, 9.524858),
      studyFullHobFeature: bandCoverage(studyTriangles, 3.174827, 13.938684),
      studyHobLeadOut: bandCoverage(studyTriangles, 9.524858, 13.938684),
      inputSixfold: bandCoverage(studyTriangles, 61.109647, 71.52395)
    }
  }
}
const sourceStudyRelation = {
  byteIdentical: false,
  topologyIdentical: false,
  sharedAuthenticatedRegions: [
    'functional ten-tooth band y 3.174827..9.524858 mm',
    'far-end sixfold band y 61.109647..71.52395 mm'
  ],
  divergentRegions: [
    'Study approved shaft retains a ten-fold hob lead-out to y 13.938684 mm; source P001835-2 does not share it.'
  ],
  evidence: {
    sourceVertexTriangleCounts: { vertices: sourceMeshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0), triangles: sourceTriangles.length },
    studyVertexTriangleCounts: { vertices: studyMeshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0), triangles: studyTriangles.length },
    sourceAt13_5: controlSlices.source.find(slice => slice.y === 13.5),
    studyAt13_5: controlSlices.study.find(slice => slice.y === 13.5),
    sourceAt13_8: controlSlices.source.find(slice => slice.y === 13.8),
    studyAt13_8: controlSlices.study.find(slice => slice.y === 13.8)
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  command: 'node output/high-low-feature-proof/geometry/analyze-geometry.mjs',
  analysisScript: {
    path: path.join(outDir, 'analyze-geometry.mjs'),
    sha256: sha256(fs.readFileSync(path.join(outDir, 'analyze-geometry.mjs')))
  },
  inputs: {
    source: { path: sourcePath, bytes: fs.statSync(sourcePath).size, sha256Before: hashesBefore.source },
    study: { path: studyPath, bytes: fs.statSync(studyPath).size, sha256Before: hashesBefore.study },
    registration: { path: registryPath, sha256: sha256(fs.readFileSync(registryPath)) }
  },
  source: {
    nameOccurrences: source.nameOccurrences,
    sameMeshNodes: sameMeshNodes(source.doc, sourceMeshes[0].meshIndex),
    axisMappingErrorMaxAbs: sourceAxisMappingError,
    meshCount: sourceMeshes.length,
    vertexCount: sourceMeshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0),
    triangleCount: sourceTriangles.length,
    bounds: sourceBounds,
    meshes: sourceMeshes.map(meshEvidence)
  },
  study: {
    nameOccurrences: study.nameOccurrences,
    sameMeshNodes: sameMeshNodes(study.doc, studyMeshes[0].meshIndex),
    meshCount: studyMeshes.length,
    vertexCount: studyMeshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0),
    triangleCount: studyTriangles.length,
    bounds: studyBounds,
    meshes: studyMeshes.map(meshEvidence)
  },
  profiles,
  controlSlices,
  angularPhaseControls,
  sixfoldFlatTopology,
  selectedPlanes,
  proposedInterface,
  sourceStudyRelation
}
report.inputs.source.sha256After = sha256(fs.readFileSync(sourcePath))
report.inputs.study.sha256After = sha256(fs.readFileSync(studyPath))
report.assetsUnchanged = hashesBefore.source === report.inputs.source.sha256After
  && hashesBefore.study === report.inputs.study.sha256After
assert(report.assetsUnchanged, 'Protected GLB changed during analysis')
fs.writeFileSync(path.join(outDir, 'geometry-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({
  sourceOccurrences: source.nameOccurrences.length,
  sourceMeshes: sourceMeshes.length,
  studyMeshes: studyMeshes.length,
  sourceTriangles: sourceTriangles.length,
  studyTriangles: studyTriangles.length,
  sourceBounds, studyBounds, assetsUnchanged: report.assetsUnchanged
}))
