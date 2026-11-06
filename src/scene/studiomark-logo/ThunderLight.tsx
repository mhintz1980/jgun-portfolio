import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ThunderLightHandle {
  triggerStrike: () => void
}

interface ThunderLightProps {
  autoLightning?: boolean
  frequency?: number // average seconds between strikes
  onThunderSound?: () => void
  overrideIntensity?: number | null
}

/**
 * Natural atmospheric lightning flash system.
 * Eliminates all 3D floating planar geometry (no PIP box artifact).
 * Illumination is created via multi-source directional and hemispheric light bursts
 * that light the entire scene, models, atmosphere, and rain drops uniformly.
 */
export const ThunderLight = forwardRef<ThunderLightHandle, ThunderLightProps>(
  ({ autoLightning = true, frequency = 14, onThunderSound, overrideIntensity = null }, ref) => {
    const dirLightRef = useRef<THREE.DirectionalLight>(null!)
    const hemiLightRef = useRef<THREE.HemisphereLight>(null!)
    const ambientLightRef = useRef<THREE.AmbientLight>(null!)

    // Strike animation state
    const isStriking = useRef(false)
    const strikeElapsed = useRef(0)
    const nextStrikeTimer = useRef(frequency * (0.6 + Math.random() * 0.8))

    const triggerStrike = () => {
      isStriking.current = true
      strikeElapsed.current = 0
      // Thunder rumble follows slightly after the lightning flash
      setTimeout(() => {
        onThunderSound?.()
      }, 350)
    }

    useImperativeHandle(ref, () => ({
      triggerStrike,
    }))

    // Auto lightning scheduler
    useFrame((_, dt) => {
      if (overrideIntensity != null) {
        if (dirLightRef.current) {
          dirLightRef.current.intensity = overrideIntensity * 4.5
        }
        if (hemiLightRef.current) {
          hemiLightRef.current.intensity = overrideIntensity * 1.5
        }
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = overrideIntensity * 0.45
        }
        return
      }

      if (autoLightning) {
        nextStrikeTimer.current -= dt
        if (nextStrikeTimer.current <= 0) {
          nextStrikeTimer.current = frequency * (0.6 + Math.random() * 0.8)
          triggerStrike()
        }
      }

      if (isStriking.current) {
        strikeElapsed.current += dt
        const t = strikeElapsed.current

        let flashIntensity = 0

        // Realistic lightning multi-pulse pattern:
        // Pulse 1: 0.0 - 0.04s (initial sharp flash)
        // Gap:     0.04 - 0.07s
        // Pulse 2: 0.07 - 0.13s (secondary brighter burst)
        // Main:    0.13 - 0.45s (exponential decay tail)
        if (t < 0.04) {
          flashIntensity = 0.75
        } else if (t < 0.07) {
          flashIntensity = 0.08
        } else if (t < 0.13) {
          flashIntensity = 1.0
        } else if (t < 0.45) {
          const decay = 1.0 - (t - 0.13) / 0.32
          flashIntensity = Math.max(0, decay * decay * 1.25)
        } else {
          flashIntensity = 0
          isStriking.current = false
        }

        if (dirLightRef.current) {
          dirLightRef.current.intensity = flashIntensity * 4.5
        }
        if (hemiLightRef.current) {
          hemiLightRef.current.intensity = flashIntensity * 1.5
        }
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = flashIntensity * 0.45
        }
      } else {
        if (dirLightRef.current) {
          dirLightRef.current.intensity = 0
        }
        if (hemiLightRef.current) {
          hemiLightRef.current.intensity = 0
        }
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = 0
        }
      }
    })

    return (
      <group>
        {/* Overhead directional lightning bolt with cold blue tint */}
        <directionalLight
          ref={dirLightRef}
          position={[-7, 18, -3]}
          color="#b5d7ff"
          intensity={0}
        />

        {/* Full-scene atmospheric storm flash (sky to ground illumination) */}
        <hemisphereLight
          ref={hemiLightRef}
          color="#9ec5ff"
          groundColor="#1e2738"
          intensity={0}
        />

        {/* Ambient storm brightness pulse */}
        <ambientLight
          ref={ambientLightRef}
          color="#80a9f5"
          intensity={0}
        />
      </group>
    )
  },
)

ThunderLight.displayName = 'ThunderLight'
