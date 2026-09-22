import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, AlwaysStencilFunc, Box3, Color, Group, KeepStencilOp, Mesh, PerspectiveCamera, Plane, PMREMGenerator, ReplaceStencilOp, Vector3 } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { prepareModel, SHELL_ROOTS } from './prepareModel'
import { SectionCaps } from './SectionCaps'
import { LowerIntake } from './LowerIntake'
import { AirRibbons, EQUIPMENT_MASK_STENCIL_REF } from './AirRibbons'
import { evaluateShot } from './shot'
import { EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { createSectionRenderPass } from '../sectionRenderPass'

export interface PreviewControl { u: number; invalidate: () => void; caps: boolean }
type Prepared = ReturnType<typeof prepareModel>

function configureEquipmentStencil(group: Group) {
  group.traverse(object => {
    if (!(object instanceof Mesh) || SHELL_ROOTS.has(object.userData.sourceRoot)) return
    object.renderOrder = 1
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach(material => {
      material.stencilWrite = true
      material.stencilRef = EQUIPMENT_MASK_STENCIL_REF
      material.stencilFunc = AlwaysStencilFunc
      material.stencilFail = KeepStencilOp
      material.stencilZFail = KeepStencilOp
      material.stencilZPass = ReplaceStencilOp
    })
  })
}

function Environment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const room = new RoomEnvironment()
    const generator = new PMREMGenerator(gl)
    const target = generator.fromScene(room, .04)
    scene.environment = target.texture
    scene.environmentIntensity = .35
    room.dispose(); generator.dispose()
    return () => { scene.environment = null; target.dispose() }
  }, [gl, scene])
  return null
}

function Model({ plane, control, onReady, onError, lite }: { plane: Plane; control: PreviewControl; onReady: (m: Prepared) => void; onError: () => void; lite: boolean }) {
  const [model, setModel] = useState<Prepared | null>(null)
  const caps = useRef<Group>(null)
  const { invalidate } = useThree()
  useEffect(() => {
    let cancelled = false
    let owned: Prepared | undefined
    const draco = new DRACOLoader().setDecoderPath('/draco/')
    const loader = new GLTFLoader().setDRACOLoader(draco)
    loader.load(lite ? '/models/rl300-lite.glb' : '/models/msp-enclosure.glb', gltf => {
      try {
        if (!cancelled) {
          owned = prepareModel(gltf.scene, plane)
          configureEquipmentStencil(owned.group)
          setModel(owned)
          onReady(owned)
          invalidate()
        }
      } catch { if (!cancelled) onError() }
      finally {
        const geometries = new Set(), materials = new Set()
        gltf.scene.traverse(o => { if (o instanceof Mesh) {
          if (!geometries.has(o.geometry)) { o.geometry.dispose(); geometries.add(o.geometry) }
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!materials.has(m)) { m.dispose(); materials.add(m) }
        } })
        draco.dispose()
      }
    }, undefined, () => { draco.dispose(); if (!cancelled) onError() })
    return () => { cancelled = true; owned?.dispose(); draco.dispose() }
  }, [plane, invalidate, onReady, onError, lite])
  useFrame(() => { if (caps.current) caps.current.visible = control.caps })
  return model && <>
    <primitive object={model.group} dispose={null} />
    <group ref={caps}><SectionCaps sections={model.sections} plane={plane} /></group>
  </>
}

function Driver({ control, plane, model, composed }: { control: PreviewControl; plane: Plane; model: React.RefObject<Prepared | null>; composed: boolean }) {
  const { camera, gl, scene, size, invalidate } = useThree()
  const frames = useRef(0)
  const renderStart = useRef(0)
  const box = useMemo(() => new Box3(), [])
  const corner = useMemo(() => new Vector3(), [])
  const rendererInfo = useMemo(() => {
    const ctx = gl.getContext(), debug = ctx.getExtension('WEBGL_debug_renderer_info')
    return { stencilBits: ctx.getParameter(ctx.STENCIL_BITS), gpu: debug ? ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unavailable' }
  }, [gl])
  useEffect(() => { control.invalidate = invalidate; return () => { control.invalidate = () => {} } }, [control, invalidate])
  useEffect(() => {
    const previous = gl.info.autoReset
    gl.info.autoReset = false
    return () => { gl.info.autoReset = previous }
  }, [gl])
  useFrame(() => { gl.info.reset(); renderStart.current = performance.now() }, -2)
  useFrame(() => {
    const shot = evaluateShot(control.u, size.width < 600)
    const cam = camera as PerspectiveCamera
    cam.position.set(...shot.position); cam.lookAt(...shot.target)
    cam.fov = shot.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld()
    plane.constant = shot.plane
  }, -1)
  useFrame(() => {
    if (!composed) gl.render(scene, camera)
    const renderCpuMs = performance.now() - renderStart.current
    frames.current++
    const m = model.current
    let projection = null
    if (m) {
      box.setFromObject(m.group)
      const points = []
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        points.push(corner.set(x, y, z).project(camera).toArray())
      }
      projection = points
    }
    Object.assign((window as any).__quietMachine, {
      ready: !!m, frame: frames.current, u: control.u, cutPlane: plane.constant,
      camera: camera.position.toArray(), fov: (camera as PerspectiveCamera).fov,
      ...rendererInfo, caps: control.caps, composed, renderCpuMs,
      drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries, textures: gl.info.memory.textures,
      counts: m?.counts, parts: m?.parts, projection, size: { width: size.width, height: size.height },
    })
  }, 2)
  return null
}

export function QuietMachineScene({ control, onReady, onError, lite }: { control: PreviewControl; onReady: () => void; onError: () => void; lite: boolean }) {
  const plane = useMemo(() => new Plane(new Vector3(-1, 0, 0), .85), [])
  const model = useRef<Prepared | null>(null)
  const ready = useMemo(() => (m: Prepared) => { model.current = m; onReady() }, [onReady])
  // Local feasibility switch; the accepted direct-rendered look remains the default.
  const composerMode = new URLSearchParams(window.location.search).get('composer')
  const composed = composerMode === '1' || composerMode === '4'
  return <Canvas frameloop="demand" dpr={lite ? 1 : [1, 1.5]} shadows={!lite}
    gl={{ antialias: true, stencil: true, powerPreference: 'high-performance' }}
    camera={{ position: [4.3, 2.7, 4.6], fov: 36, near: .02, far: 60 }}
    onCreated={({ gl }) => { gl.localClippingEnabled = true; gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = .85 }}
    fallback={<p>3D is unavailable. The section study remains available below.</p>}>
    <color attach="background" args={['#101b24']} />
    <fog attach="fog" args={['#101b24', 12, 30]} />
    <Environment />
    <hemisphereLight args={['#c8e3ef', '#26303c', .35]} />
    <directionalLight position={[4, 6, 3]} intensity={1.7} color="#e6f1ff" castShadow={!lite}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4}
      shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={.015} />
    <directionalLight position={[-3, 3, -2]} intensity={.8} color="#75bfff" />
    <pointLight position={[.35, 1, -.35]} intensity={1.2} distance={2.5} decay={2} color="#ffbd7b" />
    <pointLight position={[.6, .02, .7]} intensity={.65} distance={1.8} decay={2} color="#b7eaff" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.22, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} /><meshStandardMaterial color="#0a141c" roughness={.8} metalness={.1} />
    </mesh>
    {[-3.5, 3.5].map(x => <mesh key={x} position={[x, 2.2, -5.5]}>
      <boxGeometry args={[1.8, .035, .04]} /><meshBasicMaterial color={new Color('#b7e5ff').multiplyScalar(1.5)} />
    </mesh>)}
    {[-.53, .53].flatMap(x => [-1.355051, -.055051, 1.244949].map(z => <mesh key={`${x}/${z}`} position={[x, -.11, z]} castShadow>
      <cylinderGeometry args={[.075, .09, .22, 16]} /><meshStandardMaterial color="#15212b" metalness={.5} roughness={.5} />
    </mesh>))}
    <Model plane={plane} control={control} onReady={ready} onError={onError} lite={lite} />
    <LowerIntake />
    <AirRibbons control={control} plane={plane} />
    {composed && <EffectComposer multisampling={composerMode === '4' ? 4 : 0} stencilBuffer renderPass={createSectionRenderPass}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>}
    <Driver control={control} plane={plane} model={model} composed={composed} />
  </Canvas>
}
