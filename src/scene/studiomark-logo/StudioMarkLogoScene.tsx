import { Suspense, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

import type { LogoConfig } from './types'
import { BUMPER_SPECS, evaluateBumperState, type BumperFrameState, type BumperMode } from './bumperTimeline'
import { RainFloor } from './RainFloor'
import { RainDrops } from './RainDrops'
import { RainSplashes } from './RainSplashes'
import { ThunderLight, type ThunderLightHandle } from './ThunderLight'
import { StudioMarkCenterpiece } from './StudioMarkCenterpiece'
import { StudioMarkText } from './StudioMarkText'
import { StudioLighting } from './StudioLighting'
import { PostProcessing } from './PostProcessing'

export interface StudioMarkSceneHandle {
  triggerLightning: () => void
  setCameraPreset: (preset: 'front' | 'water' | 'high' | 'reset') => void
}

interface StudioMarkLogoSceneProps {
  config: LogoConfig
  bumperMode?: BumperMode
  manualBumperTime?: number | null
  loopBumper?: boolean
  onThunderAudio?: () => void
  onBumperFrameUpdate?: (state: BumperFrameState | null) => void
}

function SceneContent({
  config,
  bumperMode = 'interactive',
  manualBumperTime = null,
  loopBumper = true,
  onThunderAudio,
  onBumperFrameUpdate,
  thunderRef,
  controlsRef,
}: {
  config: LogoConfig
  bumperMode?: BumperMode
  manualBumperTime?: number | null
  loopBumper?: boolean
  onThunderAudio?: () => void
  onBumperFrameUpdate?: (state: BumperFrameState | null) => void
  thunderRef: React.RefObject<ThunderLightHandle | null>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const [activeBumperState, setActiveBumperState] = useState<BumperFrameState | null>(null)
  const playElapsedRef = useRef(0)

  // Reset elapsed timer when bumperMode changes
  useEffect(() => {
    playElapsedRef.current = 0
    if (bumperMode === 'interactive') {
      setActiveBumperState(null)
      onBumperFrameUpdate?.(null)
      const controls = controlsRef.current
      if (controls) {
        controls.enabled = true
        const cam = controls.object as THREE.PerspectiveCamera
        cam.up.set(0, 1, 0)
        cam.fov = 45
        cam.updateProjectionMatrix()
        controls.update()
      }
    }
  }, [bumperMode, controlsRef, onBumperFrameUpdate])

  useFrame((state, dt) => {
    if (bumperMode === 'interactive') return

    const spec = BUMPER_SPECS[bumperMode]
    let t: number
    if (manualBumperTime != null) {
      t = manualBumperTime
    } else {
      playElapsedRef.current += Math.min(dt, 0.05)
      if (playElapsedRef.current > spec.durationSec) {
        playElapsedRef.current = loopBumper ? 0 : spec.durationSec
      }
      t = playElapsedRef.current
    }

    const frameState = evaluateBumperState(bumperMode, t)
    setActiveBumperState(frameState)
    onBumperFrameUpdate?.(frameState)

    // Drive camera deterministically
    const cam = state.camera as THREE.PerspectiveCamera
    if (controlsRef.current) {
      controlsRef.current.enabled = false
      controlsRef.current.target.set(...frameState.cameraTarget)
    }

    cam.position.set(...frameState.cameraPosition)
    cam.up.set(Math.sin(frameState.cameraRoll), Math.cos(frameState.cameraRoll), 0)
    cam.lookAt(...frameState.cameraTarget)
    if (Math.abs(cam.fov - frameState.cameraFov) > 0.01) {
      cam.fov = frameState.cameraFov
      cam.updateProjectionMatrix()
    }
  })

  const simTime = activeBumperState ? activeBumperState.timeSec : null
  const effectiveRipple = activeBumperState ? activeBumperState.rippleStrength : config.rippleStrength
  const effectiveReflectivity = activeBumperState ? activeBumperState.puddleReflectivity : config.puddleReflectivity
  const effectiveBloom = activeBumperState ? activeBumperState.bloomIntensity : config.bloomIntensity

  return (
    <>
      {/* Cinematic Storm Atmosphere Fog */}
      <fogExp2 attach="fog" args={['#060910', 0.036]} />

      {/* Orbit Controls with bounded polar angles (floor collision limit) */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={bumperMode === 'interactive'}
        target={[0, 0.56, -0.2]}
        minDistance={2.5}
        maxDistance={12.0}
        maxPolarAngle={Math.PI / 2 - 0.02} // Stop just above ground level
        minPolarAngle={0.1}
        enableDamping
        dampingFactor={0.06}
      />

      {/* Dynamic Lightning Flash Illumination */}
      <ThunderLight
        ref={thunderRef}
        autoLightning={bumperMode === 'interactive' && config.autoLightning}
        frequency={config.lightningFrequency}
        onThunderSound={onThunderAudio}
        overrideIntensity={activeBumperState ? activeBumperState.lightningIntensity : null}
      />

      {/* Studio Lighting & Softbox Lightformers */}
      <Suspense fallback={null}>
        <StudioLighting glowColor={config.glowColor} ambientDarkness={config.ambientDarkness} />
      </Suspense>

      {/* Centerpiece & Lighting render immediately without waiting on fonts */}
      <StudioMarkCenterpiece
        shape={config.shape}
        spin={config.spin}
        speed={config.speed}
        roughness={config.roughness}
        transmission={config.transmission}
        thickness={config.thickness}
        ior={config.ior}
        chromaticAberration={config.chromaticAberration}
        glowColor={config.glowColor}
        bumperState={activeBumperState}
      />

      {/* Isolated Suspense for 3D Typography */}
      <Suspense fallback={null}>
        <StudioMarkText
          text={config.text}
          subtitle={config.subtitle}
          glowColor={config.glowColor}
          emissiveIntensity={config.emissiveIntensity}
          emissiveScale={activeBumperState ? activeBumperState.textEmissiveScale : 1.0}
          simTime={simTime}
        />
      </Suspense>

      {/* Wet Reflective Puddle Floor with Faraz-Style 2K Road Textures & Analytic Ripples */}
      <Suspense fallback={null}>
        <RainFloor
          rippleStrength={effectiveRipple}
          puddleReflectivity={effectiveReflectivity}
          rainEnabled={config.rainIntensity !== 'off'}
          simTime={simTime}
        />
      </Suspense>

      {/* Falling Raindrops Instanced Simulation */}
      <RainDrops count={config.rainCount} intensity={config.rainIntensity} simTime={simTime} />

      {/* Ground Water Splash Rings */}
      <RainSplashes enabled={config.enableSplashes && config.rainIntensity !== 'off'} simTime={simTime} />

      {/* HDR Bloom & Post-Processing */}
      <PostProcessing bloomIntensity={effectiveBloom} />
    </>
  )
}

export const StudioMarkLogoScene = forwardRef<StudioMarkSceneHandle, StudioMarkLogoSceneProps>(
  (
    {
      config,
      bumperMode = 'interactive',
      manualBumperTime = null,
      loopBumper = true,
      onThunderAudio,
      onBumperFrameUpdate,
    },
    ref,
  ) => {
    const thunderRef = useRef<ThunderLightHandle>(null)
    const controlsRef = useRef<OrbitControlsImpl>(null)

    useImperativeHandle(ref, () => ({
      triggerLightning: () => {
        thunderRef.current?.triggerStrike()
      },
      setCameraPreset: (preset: 'front' | 'water' | 'high' | 'reset') => {
        const controls = controlsRef.current
        if (!controls) return

        const camera = controls.object as THREE.PerspectiveCamera
        switch (preset) {
          case 'front':
            camera.position.set(0, 1.25, 5.1)
            controls.target.set(0, 1.15, 0)
            break
          case 'water':
            camera.position.set(0, 0.55, 4.65)
            controls.target.set(0, 0.35, -0.3)
            break
          case 'high':
            camera.position.set(2.6, 3.2, 4.5)
            controls.target.set(0, 0.9, 0)
            break
          case 'reset':
            camera.position.set(0, 1.02, 5.25)
            controls.target.set(0, 0.56, -0.2)
            break
        }
        controls.update()
      },
    }))

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#06080e',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          camera={{
            position: [0, 1.02, 5.25],
            fov: 45,
            near: 0.1,
            far: 50,
          }}
        >
          <SceneContent
            config={config}
            bumperMode={bumperMode}
            manualBumperTime={manualBumperTime}
            loopBumper={loopBumper}
            onThunderAudio={onThunderAudio}
            onBumperFrameUpdate={onBumperFrameUpdate}
            thunderRef={thunderRef}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>
    )
  },
)

StudioMarkLogoScene.displayName = 'StudioMarkLogoScene'
