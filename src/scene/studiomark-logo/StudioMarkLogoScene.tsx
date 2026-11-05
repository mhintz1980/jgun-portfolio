import { Suspense, forwardRef, useImperativeHandle, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

import type { LogoConfig } from './types'
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
  onThunderAudio?: () => void
}

function SceneContent({
  config,
  onThunderAudio,
  thunderRef,
  controlsRef,
}: {
  config: LogoConfig
  onThunderAudio?: () => void
  thunderRef: React.RefObject<ThunderLightHandle | null>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  return (
    <>
      {/* Cinematic Storm Atmosphere Fog */}
      <fogExp2 attach="fog" args={['#060910', 0.036]} />

      {/* Orbit Controls with bounded polar angles (floor collision limit) */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 1.85, 0]}
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
        autoLightning={config.autoLightning}
        frequency={config.lightningFrequency}
        onThunderSound={onThunderAudio}
      />

      {/* Studio Lighting & Softbox Lightformers */}
      <StudioLighting
        glowColor={config.glowColor}
        ambientDarkness={config.ambientDarkness}
      />

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
      />

      {/* Isolated Suspense for 3D Typography */}
      <Suspense fallback={null}>
        <StudioMarkText
          text={config.text}
          subtitle={config.subtitle}
          glowColor={config.glowColor}
          emissiveIntensity={config.emissiveIntensity}
        />
      </Suspense>

      {/* Wet Reflective Puddle Floor with Analytic Faraz-Style Ripples */}
      <RainFloor
        rippleStrength={config.rippleStrength}
        puddleReflectivity={config.puddleReflectivity}
        rainEnabled={config.rainIntensity !== 'off'}
      />

      {/* Falling Raindrops Instanced Simulation */}
      <RainDrops
        count={config.rainCount}
        intensity={config.rainIntensity}
      />

      {/* Ground Water Splash Rings */}
      <RainSplashes
        enabled={config.enableSplashes && config.rainIntensity !== 'off'}
      />

      {/* HDR Bloom & Post-Processing */}
      <PostProcessing bloomIntensity={config.bloomIntensity} />
    </>
  )
}

export const StudioMarkLogoScene = forwardRef<StudioMarkSceneHandle, StudioMarkLogoSceneProps>(
  ({ config, onThunderAudio }, ref) => {
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
            camera.position.set(0, 2.0, 5.2)
            controls.target.set(0, 1.85, 0)
            break
          case 'water':
            camera.position.set(0, 0.88, 4.8)
            controls.target.set(0, 1.35, -0.4)
            break
          case 'high':
            camera.position.set(2.8, 4.2, 4.5)
            controls.target.set(0, 1.8, 0)
            break
          case 'reset':
            camera.position.set(0, 1.65, 5.4)
            controls.target.set(0, 1.8, 0)
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
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          camera={{
            position: [0, 1.65, 5.4],
            fov: 45,
            near: 0.1,
            far: 50,
          }}
        >
          <SceneContent
            config={config}
            onThunderAudio={onThunderAudio}
            thunderRef={thunderRef}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>
    )
  },
)

StudioMarkLogoScene.displayName = 'StudioMarkLogoScene'

