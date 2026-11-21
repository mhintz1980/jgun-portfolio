import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { Box3, Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { makeDrawingLayout, SHEET_ROTATION } from '../drawing/drawingGeometry'
import { sampleOpeningCamera } from './OpeningCamera'
import type { SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'
import { drawingIntroState } from '../drawing/introTimeline'
const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 })
it('probe', () => {
  const inv = new Matrix4().copy(SHEET_ROTATION).invert()
  const out: string[] = []
  for (const aspect of [1440 / 900, 390 / 844]) {
    const layout = makeDrawingLayout(aspect, new Box3(new Vector3(-0.4, -0.25, 0), new Vector3(0.4, 0.25, 0.012)))
    let mins = [9, 9, 9], maxs = [-9, -9, -9], hitMin = [99, 99], hitMax = [-99, -99], maxUpHit = -99
    for (let i = 0; i <= 86; i++) {
      const p = i * 0.005
      const c = sampleOpeningCamera(layout, aspect, p, pose())
      const pos = c.position.clone().applyMatrix4(inv), tgt = c.target.clone().applyMatrix4(inv), up = c.up.clone().transformDirection(inv)
      const t = openingTimeAt(p); const s = drawingIntroState(t)
      if (i % 6 === 0 || p >= 0.4) out.push([aspect.toFixed(2), p.toFixed(3), 't=' + t.toFixed(3), 'pos', pos.toArray().map(v => v.toFixed(3)).join(','), 'tgt', tgt.toArray().map(v => v.toFixed(3)).join(','), 'fov', c.fov.toFixed(1), 'ortho', c.ortho.toFixed(2), 'fr', (s.fracture ?? 0).toFixed(3), 'lamp', (s.lampPower ?? 0).toFixed(2)].join(' '))
      for (let k = 0; k < 3; k++) { mins[k] = Math.min(mins[k], pos.getComponent(k)); maxs[k] = Math.max(maxs[k], pos.getComponent(k)) }
      // frustum corner rays: where they hit the floor z=-0.9 or travel
      const cam = new PerspectiveCamera(c.fov, aspect, 0.01, 50)
      cam.position.copy(pos); cam.up.copy(up); cam.lookAt(tgt); cam.updateMatrixWorld(true); cam.updateProjectionMatrix()
      for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const d = new Vector3(nx, ny, 0.5).unproject(cam).sub(pos).normalize()
        if (d.z < -1e-3) { const tt = (-0.9 - pos.z) / d.z; const hx = pos.x + d.x * tt, hy = pos.y + d.y * tt; hitMin[0] = Math.min(hitMin[0], hx); hitMin[1] = Math.min(hitMin[1], hy); hitMax[0] = Math.max(hitMax[0], hx); hitMax[1] = Math.max(hitMax[1], hy) }
        else maxUpHit = Math.max(maxUpHit, d.z)
      }
    }
    out.push('aspect ' + aspect.toFixed(2) + ' camMin ' + mins.map(v => v.toFixed(3)) + ' camMax ' + maxs.map(v => v.toFixed(3)) + ' floorHit x[' + hitMin[0].toFixed(2) + ',' + hitMax[0].toFixed(2) + '] y[' + hitMin[1].toFixed(2) + ',' + hitMax[1].toFixed(2) + '] maxUpwardRayZ ' + maxUpHit.toFixed(3))
  }
  writeFileSync('.scratch/lab-camera-probe.txt', out.join('\n'))
})

