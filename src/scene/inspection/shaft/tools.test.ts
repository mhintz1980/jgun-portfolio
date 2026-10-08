import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { BufferGeometry, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import outline from './cutterOutline.json'
import { buildHob, buildShaperCutter, countTriangles } from './tools'
import {
  CLEARANCE_REPORT_PATH,
  HOB_ARBOR_RADIUS_MM,
  HOB_ARBOR_LENGTH_MM,
  HOB_CENTRE_DISTANCE_AT_DEPTH_MM,
  HOB_COLLAR_RADIUS_MM,
  HOB_COLLAR_WIDTH_MM,
  HOB_INFEED_YC_MM,
  HOB_LEAD_ANGLE_DEG,
  HOB_LEAD_MM,
  HOB_LENGTH_MM,
  HOB_NORMAL_MODULE_MM,
  HOB_RADIUS_MM,
  HOB_RETRACT_MM,
  HOB_STARTS,
  HOB_STOP_YC_MM,
  SHAPER_ARBOR_LENGTH_MM,
  SHAPER_ARBOR_RADIUS_MM,
  SHAPER_BACKOFF_MM,
  SHAPER_CENTRE_DISTANCE_MM,
  SHAPER_CLAMP_LENGTH_MM,
  SHAPER_CLAMP_RADIUS_MM,
  SHAPER_HUB_LENGTH_MM,
  SHAPER_HUB_RADIUS_MM,
  SHAPER_OVERTRAVEL_MM,
  SHAPER_SIGNED_RATIO,
  SHAPER_STROKE_CENTRE_Y_MAX_MM,
  SHAPER_STROKE_CENTRE_Y_MIN_MM,
  SHAPER_TEETH,
  SHAPER_THICKNESS_MM,
  SHAPER_TIP_RADIUS_MM,
} from './toolSpec'

interface Report {
  shaper: Record<string, unknown>
  hob: Record<string, unknown>
}

const report = JSON.parse(readFileSync(resolve(process.cwd(), CLEARANCE_REPORT_PATH), 'utf8')) as Report

describe('toolSpec mirrors the certified clearance-v4 report', () => {
  it('matches report.shaper exactly', () => {
    expect(report.shaper.teeth).toBe(SHAPER_TEETH)
    expect(report.shaper.centre_distance_mm).toBe(SHAPER_CENTRE_DISTANCE_MM)
    expect(report.shaper.signed_ratio_work_over_cutter).toBe(SHAPER_SIGNED_RATIO)
    expect(report.shaper.tip_radius_mm).toBeCloseTo(SHAPER_TIP_RADIUS_MM, 9)
    expect(report.shaper.thickness_mm).toBeCloseTo(SHAPER_THICKNESS_MM, 9)
    expect(report.shaper.stroke_centre_y_mm).toEqual([SHAPER_STROKE_CENTRE_Y_MIN_MM, SHAPER_STROKE_CENTRE_Y_MAX_MM])
    expect(report.shaper.overtravel_past_last_stub_mm).toBe(SHAPER_OVERTRAVEL_MM)
    expect(report.shaper.return_backoff_mm).toBe(SHAPER_BACKOFF_MM)
    const holders = report.shaper.holders_radius_length_mm as Record<string, [number, number]>
    expect(holders.hub).toEqual([SHAPER_HUB_RADIUS_MM, SHAPER_HUB_LENGTH_MM])
    expect(holders.clamp_nut).toEqual([SHAPER_CLAMP_RADIUS_MM, SHAPER_CLAMP_LENGTH_MM])
    expect(holders.arbor).toEqual([SHAPER_ARBOR_RADIUS_MM, SHAPER_ARBOR_LENGTH_MM])
  })
  it('matches report.hob exactly', () => {
    expect(report.hob.R_mm).toBeCloseTo(HOB_RADIUS_MM, 9)
    expect(report.hob.module_mm).toBeCloseTo(HOB_NORMAL_MODULE_MM, 9)
    expect(report.hob.starts).toBe(HOB_STARTS)
    expect(report.hob.lead_angle_deg).toBeCloseTo(HOB_LEAD_ANGLE_DEG, 9)
    expect(report.hob.length_mm).toBeCloseTo(HOB_LENGTH_MM, 9)
    expect(report.hob.stop_yc_mm).toBeCloseTo(HOB_STOP_YC_MM, 9)
    expect(report.hob.centre_distance_mm).toBeCloseTo(HOB_CENTRE_DISTANCE_AT_DEPTH_MM, 4)
    expect(report.hob.collar_radius_mm).toBeCloseTo(HOB_COLLAR_RADIUS_MM, 9)
    expect(report.hob.arbor_radius_mm).toBeCloseTo(HOB_ARBOR_RADIUS_MM, 9)
    // Path infeed/retract live in the report's prose; pin the numbers here against it.
    const path = report.hob.path as string
    expect(Number(path.match(/infeed radial at yc=([\d.-]+)/)?.[1])).toBe(HOB_INFEED_YC_MM)
    expect(Number(path.match(/retract ([\d.]+) mm radial/)?.[1])).toBe(HOB_RETRACT_MM)
    // These holder lengths are pinned by the leaf spec; the report has no corresponding keys.
    expect(HOB_COLLAR_WIDTH_MM).toBe(3)
    expect(HOB_ARBOR_LENGTH_MM).toBe(12)
    expect(HOB_LEAD_MM).toBeCloseTo((Math.PI * HOB_NORMAL_MODULE_MM) / Math.cos((HOB_LEAD_ANGLE_DEG * Math.PI) / 180), 6)
    console.log('A2: certified report matched; shaper N=20 C=15.5 tip=11.2032 thickness=1.2; hob R=5.87 lead=5.5587 yc=-4.195 stop=9.5249')
  })
})

describe('derived cutter outline', () => {
  it('records the actual source hash and bounded envelope sampling parameters', () => {
    // Hash LF-normalised bytes so Windows (CRLF) and Linux checkouts agree with the recorded digest.
    const raw = Buffer.from(readFileSync(resolve(process.cwd(), outline.source.profile_study), 'utf8').replace(/\r\n/g, '\n'))
    expect(outline.source.sha256).toBe(createHash('sha256').update(raw).digest('hex'))
    expect(outline.parameters).toMatchObject({
      cutter_teeth: 20, work_teeth: 10, centre_distance_mm: 15.5,
      signed_ratio_work_over_cutter: -2, stock_mm: 0.005,
      tip_limit_mm: 11.2032, root_clearance_mm: 0.15,
    })
    expect(outline.parameters.root_limit_mm).toBeCloseTo(15.5 - 6.0834 - 0.15, 9)
    expect(outline.parameters.roll_step_deg).toBeGreaterThan(0)
    expect(outline.parameters.roll_step_deg).toBeLessThanOrEqual(0.02)
    expect(outline.parameters.bin_deg).toBeGreaterThan(0)
    expect(outline.parameters.bin_deg).toBeLessThanOrEqual(0.05)
    expect(outline.tooth.point_count).toBe(outline.tooth.points.length)
    expect(outline.tooth.points.length).toBeLessThanOrEqual(360)
    for (const [angle, radius] of outline.tooth.points) {
      expect(Number.isFinite(angle) && Number.isFinite(radius)).toBe(true)
      expect(radius).toBeGreaterThanOrEqual(outline.parameters.root_limit_mm)
      expect(radius).toBeLessThanOrEqual(outline.parameters.tip_limit_mm)
    }
    expect(outline.tooth.angle_span_deg).toBe(18)
  })
  it('leaves 0.005 mm stock on independently recomputed flank bins, not only the crest', () => {
    const study = JSON.parse(readFileSync(resolve(process.cwd(), outline.source.profile_study), 'utf8')) as {
      angular_step_deg: number; profiles: { legacy: Record<string, number[]> }
    }
    const profile = study.profiles.legacy['6.0']
    const deg = Math.PI / 180
    const pitch = 18 * deg
    const bins = [40, 120, 220, 300]
    const minima = bins.map(() => Infinity)
    // Rotate each work polar ray directly (independent of the generator's Cartesian caches).
    for (let step = 0; step <= 900; step++) {
      const cutter = step * 0.02 * deg
      for (let i = 0; i < profile.length; i++) {
        const workAngle = i * study.angular_step_deg * deg - 2 * cutter
        const x = 15.5 + profile[i] * Math.cos(workAngle)
        const y = profile[i] * Math.sin(workAngle)
        let angle = Math.atan2(y, x) - cutter
        angle = ((angle % pitch) + pitch) % pitch
        const bin = Math.min(359, Math.floor(angle / pitch * 360))
        const j = bins.indexOf(bin)
        if (j >= 0) minima[j] = Math.min(minima[j], Math.hypot(x, y))
      }
    }
    for (let j = 0; j < bins.length; j++) {
      const expected = Math.max(9.2666, Math.min(11.2032, minima[j] - 0.005))
      expect(outline.tooth.points[bins[j]][1]).toBeCloseTo(expected, 5)
    }
    console.log('A1: outline 360 points; roll 0.02 deg; bins 0.05 deg; flank stock 0.005 mm verified')
  })
})

describe('shaper cutter prop', () => {
  it('builds within the 12k triangle budget and reports its crest cutting edge', () => {
    const material = new MeshStandardMaterial()
    const cutter = buildShaperCutter(material)
    const triangles = countTriangles(cutter.root)
    expect(triangles).toBeGreaterThan(0)
    expect(triangles).toBeLessThanOrEqual(12000)
    console.log('A3: shaper triangles=' + triangles + ' budget=12000')
    const types = new Set<string>()
    cutter.root.traverse((child) => types.add(child.type))
    expect(types.has('Mesh')).toBe(true)
    expect(cutter.root.name).toBe('shaper-cutter')
    const radius = Math.hypot(cutter.cuttingEdgeLocal.x, cutter.cuttingEdgeLocal.z) * 1000
    // The certified tip is a bound; conservative bin minima plus flank stock can fall below it.
    expect(radius).toBeCloseTo(outline.tooth.max_radius_mm, 5)
    expect(radius).toBeLessThanOrEqual(SHAPER_TIP_RADIUS_MM)
    expect(cutter.cuttingEdgeLocal.y).toBeCloseTo(SHAPER_THICKNESS_MM / 2 * 1e-3, 9)
    const disc = cutter.root.getObjectByName('shaper-cutter-disc') as Mesh
    disc.geometry.computeBoundingBox()
    const bounds = disc.geometry.boundingBox!
    expect(bounds.min.y * 1000).toBeCloseTo(-0.6, 5)
    expect(bounds.max.y * 1000).toBeCloseTo(0.6, 5)
    const leadingFace = SHAPER_STROKE_CENTRE_Y_MAX_MM + cutter.cuttingEdgeLocal.y * 1000
    expect(leadingFace).toBeCloseTo(10.3749, 5)
    expect(10.94 - leadingFace).toBeCloseTo(0.5651, 5)
    expect(new Vector3(0, 1, 0).applyQuaternion(cutter.root.quaternion).y).toBe(1)
    cutter.dispose()
    material.dispose()
  })
  it('disposes every owned geometry idempotently', () => {
    const material = new MeshStandardMaterial()
    const cutter = buildShaperCutter(material)
    let disposed = 0
    const geometries = new Set<{ dispose(): void }>()
    let materialDisposals = 0
    material.addEventListener('dispose', () => materialDisposals++)
    cutter.root.traverse((child) => {
      const mesh = child as { geometry?: { dispose(): void } }
      if (mesh.geometry) geometries.add(mesh.geometry)
    })
    for (const geometry of geometries) {
      const original = geometry.dispose.bind(geometry)
      geometry.dispose = () => {
        disposed++
        original()
      }
    }
    cutter.dispose()
    cutter.dispose()
    expect(disposed).toBe(geometries.size)
    expect(materialDisposals).toBe(0)
    material.dispose()
  })
})

describe('hob prop', () => {
  it('builds within the 20k triangle budget with gashes and a tilted axis', () => {
    const material = new MeshStandardMaterial()
    const hob = buildHob(material)
    const triangles = countTriangles(hob.root)
    expect(triangles).toBeGreaterThan(0)
    expect(triangles).toBeLessThanOrEqual(20000)
    console.log('A3: hob triangles=' + triangles + ' budget=20000 (instances counted)')
    const names: string[] = []
    hob.root.traverse((child) => names.push(child.name))
    expect(names).toContain('hob-body')
    expect(names.filter((name) => name.startsWith('hob-gash-'))).toHaveLength(10)
    const thread = hob.root.getObjectByName('hob-thread') as { count?: number; isInstancedMesh?: boolean }
    expect(thread.isInstancedMesh).toBe(true)
    expect(thread.count).toBeGreaterThan(0)
    const local = new Vector3(0, 1, 0).applyQuaternion(hob.root.quaternion)
    const expected = new Vector3(Math.cos(HOB_LEAD_ANGLE_DEG * Math.PI / 180), Math.sin(HOB_LEAD_ANGLE_DEG * Math.PI / 180), 0)
    expect(local.dot(expected)).toBeCloseTo(1, 6)
    hob.dispose()
    material.dispose()
  })
  it('keeps every thread instance inside the certified radius and axial cutting-body length', () => {
    const material = new MeshStandardMaterial()
    const hob = buildHob(material)
    const thread = hob.root.getObjectByName('hob-thread') as InstancedMesh
    const position = thread.geometry.getAttribute('position')
    const matrix = new Matrix4()
    const vertex = new Vector3()
    let maxRadius = 0
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < thread.count; i++) {
      thread.getMatrixAt(i, matrix)
      for (let j = 0; j < position.count; j++) {
        vertex.fromBufferAttribute(position, j).applyMatrix4(matrix)
        maxRadius = Math.max(maxRadius, Math.hypot(vertex.x, vertex.z) * 1000)
        minY = Math.min(minY, vertex.y * 1000)
        maxY = Math.max(maxY, vertex.y * 1000)
      }
    }
    expect(maxRadius).toBeLessThanOrEqual(HOB_RADIUS_MM + 0.000001)
    expect(maxRadius).toBeCloseTo(HOB_RADIUS_MM, 5)
    expect(minY).toBeGreaterThanOrEqual(-HOB_LENGTH_MM / 2 - 0.000001)
    expect(maxY).toBeLessThanOrEqual(HOB_LENGTH_MM / 2 + 0.000001)
    hob.dispose()
    material.dispose()
  })
  it('releases all geometries and the instancing resource once without disposing caller steel', () => {
    const material = new MeshStandardMaterial()
    const hob = buildHob(material)
    const geometries = new Set<BufferGeometry>()
    hob.root.traverse((child) => {
      if ((child as Mesh).geometry) geometries.add((child as Mesh).geometry)
    })
    let geometriesDisposed = 0
    let instancesDisposed = 0
    let materialsDisposed = 0
    for (const geometry of geometries) geometry.addEventListener('dispose', () => geometriesDisposed++)
    const thread = hob.root.getObjectByName('hob-thread') as InstancedMesh
    thread.addEventListener('dispose', () => instancesDisposed++)
    material.addEventListener('dispose', () => materialsDisposed++)
    hob.dispose()
    hob.dispose()
    expect(geometriesDisposed).toBe(geometries.size)
    expect(instancesDisposed).toBe(1)
    expect(materialsDisposed).toBe(0)
    material.dispose()
  })
})
