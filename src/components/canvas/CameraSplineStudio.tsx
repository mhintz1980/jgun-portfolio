import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, CatmullRomLine, Html, OrbitControls, PivotControls, Text } from '@react-three/drei'

type Vec3 = [number, number, number]

export interface ShotKeyframe {
  id: string
  label: string
  camPos: Vec3
  targetPos: Vec3
  fov: number
  timeScale: number
  housingOpacity: number
  explodeAmount: number
  machiningConstant: number
}

/** Everything a shot drives, interpolated along the spline. */
export type InterpolatedShot = Omit<ShotKeyframe, 'id' | 'label'>

declare global {
  interface Window {
    __AUTHORED_KEYFRAMES__?: ShotKeyframe[]
  }
}

export const DEFAULT_SHOT_KEYFRAMES: ShotKeyframe[] = [
  {
    id: 'establishing',
    label: 'Shot 1: Hero Establishing',
    camPos: [0.0, 1.8, 6.2],
    targetPos: [0.0, 0.6, 0.0],
    fov: 40,
    timeScale: 1.0,
    housingOpacity: 1.0,
    explodeAmount: 0.0,
    machiningConstant: 3.0,
  },
  {
    id: 'bullet-time-orbit',
    label: 'Shot 2: Bullet-Time Orbit',
    camPos: [4.2, 1.4, 2.8],
    targetPos: [0.0, 0.55, 0.0],
    fov: 32,
    timeScale: 0.03,
    housingOpacity: 0.85,
    explodeAmount: 0.15,
    machiningConstant: 2.2,
  },
  {
    id: 'assembly-isolation',
    label: 'Shot 3: Sub-Assembly Isolation',
    camPos: [1.8, 2.2, -3.6],
    targetPos: [0.0, 0.45, 0.0],
    fov: 28,
    timeScale: 0.15,
    housingOpacity: 0.08,
    explodeAmount: 0.35,
    machiningConstant: 1.2,
  },
  {
    id: 'machining-macro',
    label: 'Shot 4: CNC Machining Macro',
    camPos: [-0.9, 0.65, 1.35],
    targetPos: [-0.15, 0.4, 0.0],
    fov: 22,
    timeScale: 1.0,
    housingOpacity: 0.08,
    explodeAmount: 0.0,
    machiningConstant: -0.25,
  },
]

/** True when the page was opened with `?debug=rig`. */
export function isDebugRigRequested(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'rig'
}

interface CameraSplineStudioProps {
  initialKeyframes?: ShotKeyframe[]
  onScrubChange?: (progress: number, interpolated: InterpolatedShot) => void
}

export function CameraSplineStudio({
  initialKeyframes = DEFAULT_SHOT_KEYFRAMES,
  onScrubChange,
}: CameraSplineStudioProps) {
  const isDebugRig = isDebugRigRequested()

  const [keyframes, setKeyframes] = useState<ShotKeyframe[]>(initialKeyframes)
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [scrubProgress, setScrubProgress] = useState<number>(0)
  const [directorMode, setDirectorMode] = useState<boolean>(false)
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false)

  const { camera } = useThree()

  const { cameraCurve, targetCurve, camPoints, targetPoints } = useMemo(() => {
    const camVecs = keyframes.map((k) => new THREE.Vector3(...k.camPos))
    const targetVecs = keyframes.map((k) => new THREE.Vector3(...k.targetPos))

    return {
      cameraCurve: new THREE.CatmullRomCurve3(camVecs, false, 'centripetal', 0.5),
      targetCurve: new THREE.CatmullRomCurve3(targetVecs, false, 'centripetal', 0.5),
      camPoints: camVecs.map((v): Vec3 => [v.x, v.y, v.z]),
      targetPoints: targetVecs.map((v): Vec3 => [v.x, v.y, v.z]),
    }
  }, [keyframes])

  const tempCam = useMemo(() => new THREE.Vector3(), [])
  const tempTarget = useMemo(() => new THREE.Vector3(), [])
  const tempMat = useMemo(() => new THREE.Matrix4(), [])
  const tempPos = useMemo(() => new THREE.Vector3(), [])

  const updateKeyframeVector = useCallback(
    (index: number, field: 'camPos' | 'targetPos', matrix: THREE.Matrix4) => {
      tempPos.setFromMatrixPosition(matrix)
      const rounded: Vec3 = [
        Number(tempPos.x.toFixed(3)),
        Number(tempPos.y.toFixed(3)),
        Number(tempPos.z.toFixed(3)),
      ]
      setKeyframes((prev) => prev.map((kf, idx) => (idx === index ? { ...kf, [field]: rounded } : kf)))
    },
    [tempPos],
  )

  // `getPoint` (not `getPointAt`) parameterises by control point, so t = i / (n - 1) lands exactly on
  // keyframe i, which is also where the per-shot scalars below are interpolated.
  const evaluateAtProgress = useCallback(
    (t: number): InterpolatedShot => {
      const clamped = THREE.MathUtils.clamp(t, 0, 1)
      cameraCurve.getPoint(clamped, tempCam)
      targetCurve.getPoint(clamped, tempTarget)

      const scaled = clamped * (keyframes.length - 1)
      const i0 = Math.floor(scaled)
      const i1 = Math.min(i0 + 1, keyframes.length - 1)
      const alpha = scaled - i0

      const k0 = keyframes[i0]
      const k1 = keyframes[i1]

      return {
        camPos: [tempCam.x, tempCam.y, tempCam.z],
        targetPos: [tempTarget.x, tempTarget.y, tempTarget.z],
        fov: THREE.MathUtils.lerp(k0.fov, k1.fov, alpha),
        timeScale: THREE.MathUtils.lerp(k0.timeScale, k1.timeScale, alpha),
        housingOpacity: THREE.MathUtils.lerp(k0.housingOpacity, k1.housingOpacity, alpha),
        explodeAmount: THREE.MathUtils.lerp(k0.explodeAmount, k1.explodeAmount, alpha),
        machiningConstant: THREE.MathUtils.lerp(k0.machiningConstant, k1.machiningConstant, alpha),
      }
    },
    [cameraCurve, targetCurve, keyframes, tempCam, tempTarget],
  )

  useFrame(() => {
    if (!isDebugRig) return

    const stateAtT = evaluateAtProgress(scrubProgress)
    onScrubChange?.(scrubProgress, stateAtT)

    if (!directorMode) {
      camera.position.set(...stateAtT.camPos)
      camera.lookAt(...stateAtT.targetPos)
      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - stateAtT.fov) > 0.01) {
        camera.fov = stateAtT.fov
        camera.updateProjectionMatrix()
      }
    }
  })

  const copyTypeScriptKeyframes = () => {
    const vectors = (field: 'camPos' | 'targetPos') =>
      keyframes.map((k) => `  new THREE.Vector3(${k[field].join(', ')}), // ${k.label}`).join('\n')
    const code = [
      `export const AUTHORED_SHOT_KEYFRAMES: ShotKeyframe[] = ${JSON.stringify(keyframes, null, 2)};`,
      '',
      `export const CAMERA_SPLINE_VECTORS = [\n${vectors('camPos')}\n];`,
      '',
      `export const TARGET_SPLINE_VECTORS = [\n${vectors('targetPos')}\n];`,
    ].join('\n')

    navigator.clipboard?.writeText(code).catch(() => {})
    setCopiedNotice(true)
    window.setTimeout(() => setCopiedNotice(false), 2200)
  }

  useEffect(() => {
    if (isDebugRig) window.__AUTHORED_KEYFRAMES__ = keyframes
  }, [isDebugRig, keyframes])

  if (!isDebugRig) return null

  const currentEval = evaluateAtProgress(scrubProgress)

  return (
    <group name="CameraSplineStudio">
      {directorMode && <OrbitControls makeDefault enableDamping dampingFactor={0.08} />}

      <CatmullRomLine points={camPoints} color="#00f0ff" curveType="centripetal" tension={0.5} lineWidth={2.5} />
      <CatmullRomLine
        points={targetPoints}
        color="#ff9900"
        curveType="centripetal"
        tension={0.5}
        lineWidth={2.0}
        dashed
        dashScale={12}
      />

      <group position={currentEval.camPos}>
        <mesh>
          <coneGeometry args={[0.14, 0.32, 4]} />
          <meshBasicMaterial color="#00f0ff" wireframe />
        </mesh>
      </group>

      {keyframes.map((kf, index) => {
        const isSelected = index === activeIdx
        return (
          <Fragment key={kf.id}>
            <PivotControls
              anchor={[0, 0, 0]}
              scale={isSelected ? 0.65 : 0.4}
              lineWidth={isSelected ? 3 : 1.5}
              matrix={tempMat.clone().setPosition(...kf.camPos)}
              onDrag={(local) => updateKeyframeVector(index, 'camPos', local)}
            >
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIdx(index)
                  setScrubProgress(index / (keyframes.length - 1))
                }}
              >
                <sphereGeometry args={[isSelected ? 0.11 : 0.075, 16, 16]} />
                <meshBasicMaterial color={isSelected ? '#00f0ff' : '#007799'} />
              </mesh>
              <Billboard position={[0, 0.22, 0]}>
                <Text color="#00f0ff" fontSize={0.09} outlineColor="#000" outlineWidth={0.008}>
                  {`CAM ${index + 1}`}
                </Text>
              </Billboard>
            </PivotControls>

            <PivotControls
              anchor={[0, 0, 0]}
              scale={isSelected ? 0.55 : 0.35}
              lineWidth={isSelected ? 2.5 : 1.2}
              matrix={tempMat.clone().setPosition(...kf.targetPos)}
              onDrag={(local) => updateKeyframeVector(index, 'targetPos', local)}
            >
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIdx(index)
                }}
              >
                <octahedronGeometry args={[isSelected ? 0.09 : 0.06, 0]} />
                <meshBasicMaterial color={isSelected ? '#ff9900' : '#995500'} wireframe={!isSelected} />
              </mesh>
              <Billboard position={[0, 0.18, 0]}>
                <Text color="#ff9900" fontSize={0.075} outlineColor="#000" outlineWidth={0.008}>
                  {`TGT ${index + 1}`}
                </Text>
              </Billboard>
            </PivotControls>
          </Fragment>
        )
      })}

      <Html
        fullscreen
        calculatePosition={(_object, _camera, size) => [size.width / 2, size.height / 2]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{ pointerEvents: 'auto' }}
          className="absolute bottom-4 right-4 z-50 w-96 rounded-xl border border-cyan-500/40 bg-zinc-950/90 p-4 font-mono text-xs text-zinc-100 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold tracking-wider text-cyan-400">SPLINE RIG STUDIO (?debug=rig)</span>
            <button
              type="button"
              onClick={() => setDirectorMode((v) => !v)}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                directorMode ? 'bg-amber-500 text-zinc-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {directorMode ? 'VIEW: DIRECTOR ORBIT' : 'VIEW: CAMERA POV'}
            </button>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
              <span>SPLINE SCRUB (t = {scrubProgress.toFixed(3)})</span>
              <span>FOV: {currentEval.fov.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={scrubProgress}
              onChange={(e) => setScrubProgress(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1">
            {keyframes.map((kf, idx) => (
              <button
                key={kf.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx)
                  setScrubProgress(idx / (keyframes.length - 1))
                }}
                className={`rounded py-1 text-center text-[11px] transition ${
                  idx === activeIdx ? 'bg-cyan-500 font-bold text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Shot {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyTypeScriptKeyframes}
            className="w-full rounded-lg bg-cyan-400 py-2 font-bold text-zinc-950 transition hover:bg-cyan-300"
          >
            {copiedNotice ? '✓ COPIED TS ARRAYS TO CLIPBOARD!' : 'COPY TYPESCRIPT KEYFRAMES'}
          </button>
        </div>
      </Html>
    </group>
  )
}
