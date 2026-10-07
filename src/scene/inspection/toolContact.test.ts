import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AnimationMixer, Group, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { newFrame, sampleInspection, WHEEL_RADIUS } from './timeline'

describe('verified sampled prop fit', () => {
  it('preserves the verified bytes, maps glTF Y to spin Z, contacts then clears before withdrawal', async () => {
    const data = readFileSync('public/models/knurling-tool.glb')
    expect(createHash('sha256').update(data).digest('hex')).toBe('e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8')
    const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
    const frame = new Group(); frame.rotation.x = Math.PI / 2; frame.add(gltf.scene)
    const mixer = new AnimationMixer(gltf.scene), action = mixer.clipAction(gltf.animations[0])
    action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play()
    const radius = .07544365628189591 / 2, point = new Vector3()
    for (const time of [4.2, 4.7, 5.2, 5.7, 6.2]) {
      mixer.setTime(sampleInspection(time, newFrame()).clipTime); frame.updateMatrixWorld(true)
      for (const name of ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH']) {
        const wheel = gltf.scene.getObjectByName(name)!
        point.setFromMatrixPosition(wheel.matrixWorld)
        expect(Math.hypot(point.x, point.y) - radius - WHEEL_RADIUS).toBeCloseTo(0, 6)
        const axis = new Vector3(0, 1, 0).transformDirection(wheel.matrixWorld)
        expect(Math.abs(axis.z)).toBeCloseTo(1, 6)
      }
    }
    mixer.setTime(135 / 30); frame.updateMatrixWorld(true)
    expect(gltf.scene.getObjectByName('KT_TOOL_ROOT')!.position.x).toBeCloseTo(0, 6)
    point.setFromMatrixPosition(gltf.scene.getObjectByName('KT_UPPER_KNURL_WHEEL_RH')!.matrixWorld)
    expect(Math.hypot(point.x, point.y) - radius - WHEEL_RADIUS).toBeCloseTo(.01, 6)
    mixer.setTime(5 - 1e-6); frame.updateMatrixWorld(true)
    expect(gltf.scene.getObjectByName('KT_TOOL_ROOT')!.position.x).toBeGreaterThan(.021)
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene)
  })
})
