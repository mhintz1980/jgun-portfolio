import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Color, Group, Matrix4, Quaternion, Vector3 } from 'three'
import { CameraRig } from '../../../../../../src/scene/CameraRig'
import { InspectionDriver } from '../../../../../../src/scene/inspection/InspectionScene'
import { renderOwnership } from '../../../../../../src/scene/inspection/renderLease'
import { enterInspection, exitInspection, inspection, inspectionTelemetry, playInspection, seekInspection, setInspectionRuntime, setInspectionStatus } from '../../../../../../src/state/inspectionStore'
import { setScrollState } from '../../../../../../src/state/scrollStore'
import type { StoryRuntime, StoryContext } from '../../../../../../src/scene/inspection/story'

const proof = { samples: 0, checked: 0, lag: 0, doubleAdvance: 0, poseError: 0, registration: [] as number[], before: 0, delta: 0, lastTime: 0, lastStamp: -1, frames: [] as number[][] }
const runtime: StoryRuntime = {
  root: new Group(), ready: Promise.resolve(),
  frame: { time: 0, chapter: 0, phase: 'test', discrete: 0, narrativeAlpha: 0, returnBlend: 0, ownsNarrative: true },
  camera: { valid: true, position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 34 },
  render: { background: new Color(), fogNear: 25, fogFar: 120, envIntensity: 1, envRotationY: 0, bloom: 0, aberration: 0, dofBokeh: 0, exposure: 1 },
  resources: { geometries: 0, materials: 0, textures: 0, meshes: 0 },
  sample(time) { proof.samples++; this.frame.time = time; this.camera.position.set(.22 + time * .01, .12, .2); this.camera.target.set(0, time * .002, 0) },
  apply() {}, telemetry() {}, dispose() {},
}

function Recorder() {
  const { camera, gl, scene, internal } = useThree()
  const matrix = useRef(new Matrix4()), quaternion = useRef(new Quaternion())
  useFrame((_state, delta) => {
    if (renderOwnership.restoreObserved) { renderOwnership.restoring = false; renderOwnership.restoreObserved = false }
    proof.before = inspection.time; proof.delta = delta
  }, -30)
  useFrame(state => {
    if (inspection.active && inspection.runtime) {
      const probe = inspectionTelemetry as unknown as Record<string, number>
      proof.checked++
      if (probe.cameraSampleStamp !== state.clock.elapsedTime || probe.cameraSampleTime !== inspection.time) proof.lag++
      if (Math.abs(inspection.time - proof.before - (inspection.playing ? Math.min(proof.delta, .05) : 0)) > 1e-9) proof.doubleAdvance++
      matrix.current.lookAt(runtime.camera.position, runtime.camera.target, runtime.camera.up)
      quaternion.current.setFromRotationMatrix(matrix.current)
      proof.poseError = Math.max(proof.poseError, camera.position.distanceTo(runtime.camera.position), camera.quaternion.angleTo(quaternion.current))
      if (proof.frames.length < 400) proof.frames.push([state.clock.elapsedTime, inspection.time, probe.cameraSampleTime, camera.position.x, camera.position.y, camera.position.z])
    }
    gl.render(scene, camera)
  }, 1)
  useEffect(() => {
    const global = window as unknown as Record<string, unknown>
    global.integrationProof = {
      proof, inspection, inspectionTelemetry,
      open() {
        setScrollState({ progress: .35, chapter: 1 })
        enterInspection(document.body, false)
        inspection.entryElapsed = 2
        setInspectionRuntime(runtime); setInspectionStatus('ready')
        renderOwnership.owned = true
        proof.registration = internal.subscribers.map(value => value.priority)
      },
      play: playInspection, seek: seekInspection,
      close() { exitInspection(); renderOwnership.owned = false; renderOwnership.restoring = true },
      perturb() { camera.position.x += .001 },
    }
  }, [camera, gl, scene, internal])
  return null
}
function DelayedDriver() {
  const context = useRef<StoryContext | null>(null)
  return <InspectionDriver context={context} />
}
function Fixture() {
  const [late, setLate] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setLate(true), 200); return () => clearTimeout(timer) }, [])
  return <><CameraRig /><Recorder />{late && <DelayedDriver />}</>
}
createRoot(document.getElementById('root')!).render(<Canvas style={{ height: '100vh' }} camera={{ position: [.3, .2, .4], fov: 42 }}><Fixture /></Canvas>)
