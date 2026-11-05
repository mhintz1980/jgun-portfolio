import { useEffect, useRef, useState } from 'react'
import type { LogoConfig } from './types'
import { DEFAULT_LOGO_CONFIG } from './types'
import { ProceduralStormAudio } from './audio'
import { StudioMarkLogoScene, type StudioMarkSceneHandle } from './StudioMarkLogoScene'
import { InspectorUI } from './InspectorUI'

export function StudioMarkLogoExperience() {
  const [config, setConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG)
  const sceneRef = useRef<StudioMarkSceneHandle>(null)
  const audioRef = useRef<ProceduralStormAudio | null>(null)

  // Initialize Web Audio procedural generator
  useEffect(() => {
    const audio = new ProceduralStormAudio(config.audioVolume)
    audioRef.current = audio

    return () => {
      audio.dispose()
      audioRef.current = null
    }
  }, [])

  // Sync rain audio state with config
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (config.audioEnabled && config.rainIntensity !== 'off') {
      audio.startRain()
    } else {
      audio.stopRain()
    }
  }, [config.audioEnabled, config.rainIntensity])

  // Sync audio volume
  useEffect(() => {
    audioRef.current?.setVolume(config.audioVolume)
  }, [config.audioVolume])

  const handleToggleAudio = () => {
    setConfig((prev) => {
      const nextState = !prev.audioEnabled
      return { ...prev, audioEnabled: nextState }
    })
  }

  const handleThunderAudio = () => {
    if (config.audioEnabled) {
      audioRef.current?.triggerThunder(1.0)
    }
  }

  const handleTriggerLightning = () => {
    sceneRef.current?.triggerLightning()
  }

  const handleCameraPreset = (preset: 'front' | 'water' | 'high' | 'reset') => {
    sceneRef.current?.setCameraPreset(preset)
  }

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === ' ' || e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        handleTriggerLightning()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        handleToggleAudio()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.audioEnabled])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#06080e',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <StudioMarkLogoScene
        ref={sceneRef}
        config={config}
        onThunderAudio={handleThunderAudio}
      />

      {/* Floating Control HUD */}
      <InspectorUI
        config={config}
        onChange={setConfig}
        onTriggerLightning={handleTriggerLightning}
        onToggleAudio={handleToggleAudio}
        onCameraPreset={handleCameraPreset}
      />
    </div>
  )
}

