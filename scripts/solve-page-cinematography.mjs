/** Offline solver over saved installed-CAD witnesses and measured DOM rectangles. */
import { buildSync } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { Matrix4, Vector3 } from 'three'
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js'

const bundle = buildSync({ entryPoints: ['.agents/skills/r3f-cad-cinematography/scripts/solveHudSafeFraming.ts'], bundle: true, platform: 'node', format: 'esm', write: false }).outputFiles[0].text
const { solveViewportFraming } = await import(`data:text/javascript;base64,${Buffer.from(bundle).toString('base64')}`)
const results = []
const args = process.argv.slice(2)
const outArg = args.find(a => a.startsWith('--out='))
const pointsArg = args.find(a => a.startsWith('--points='))?.slice(9).split(',').map(Number)
for (const file of args.filter(a => !a.startsWith('--'))) {
  const report = JSON.parse(readFileSync(file, 'utf8'))
  for (const input of report.samples ?? report.cases.flatMap(c => c.samples)) {
    const sample = input.telemetry ? { ...input, cinematography: input.telemetry,
      hud: input.hud.map(r => ({ min: [r.left, r.top], max: [r.right, r.bottom] })) } : input
    if (pointsArg && !pointsArg.some(p => Math.abs(p - sample.requestedProgress) < 1e-6)) continue
    const proof = sample.cinematography
    if (!proof?.witnesses.length) { results.push({ file, progress: sample.requestedProgress, status: 'MISSING_WITNESSES' }); continue }
    const c = proof.camera, delta = c.position.map((x, i) => x - c.target[i]), distance = Math.hypot(...delta)
    const contact = proof.witnesses.filter(x => x.kind === 'contact')
    const active = proof.witnesses.filter(x => x.kind === 'active')
    const selected = contact.length ? contact : active.length ? active : proof.witnesses
    let points = [...new Map(selected.flatMap(x => x.points).map(p => [p.join(','), new Vector3(...p)])).values()]
    if (points.length > 3) {
      const hull = new ConvexHull().setFromPoints(points), extremes = new Set()
      for (const face of hull.faces) { let edge = face.edge; do { extremes.add(edge.head().point); edge = edge.next } while (edge !== face.edge) }
      if (extremes.size) points = [...extremes]
    }
    const common = { witnessesM: points, azimuthDeg: Math.atan2(delta[2], delta[0]) * 180 / Math.PI,
      elevationDeg: Math.asin(delta[1] / distance) * 180 / Math.PI, up: c.up,
      minFovDeg: contact.length && sample.requestedProgress > .56 ? proof.viewport[0] > 600 ? 6.3 : 12 : 22,
      maxFovDeg: contact.length && sample.requestedProgress > .56 ? proof.viewport[0] > 600 ? 11.4 : 36 : proof.viewport[0] > 600 ? 42 : 58,
      viewport: { width: proof.viewport[0], height: proof.viewport[1], rects: sample.hud, minClearancePx: 8, safeNdc: .84 } }
    const attempts = []
    let solved
    for (const scale of [1, 1.25, 1.5, 2, 3, 4, 6]) {
      try { solved = { ...solveViewportFraming({ ...common, distM: distance * scale }), distanceM: distance * scale }; break }
      catch (error) { if (!(error instanceof RangeError)) throw error; attempts.push({ scale, error: String(error) }) }
    }
    if (solved && proof.frame) {
      const local = new Vector3(...solved.tgtMm).multiplyScalar(.001).applyMatrix4(new Matrix4().fromArray(proof.frame).invert())
      solved.targetLocalShaft = [local.x, -local.z, local.y]
      solved.targetLocalRing = local.toArray()
    }
    results.push({ file, progress: sample.requestedProgress, status: solved ? 'SOLVED' : 'INFEASIBLE',
      scope: contact.length ? 'real disc and tooth/groove vertices; arbor/stock cropped intentionally' : selected.map(x => x.name),
      viewport: proof.viewport, witnessCount: points.length, hud: sample.hud, solved, attempts })
  }
}
writeFileSync(outArg?.slice(6) ?? 'output/playwright/page-cinematography-2026-10-27/hud-solutions.json', JSON.stringify(results, null, 2))
console.log(JSON.stringify(results.map(({ file, progress, status, viewport, witnessCount, solved, attempts }) => ({ file, progress, status, viewport, witnessCount, solved, failures: attempts.length })), null, 2))
