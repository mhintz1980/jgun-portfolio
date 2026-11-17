import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogoConfig } from './types'
import { DEFAULT_LOGO_CONFIG } from './types'
import { BUMPER_SPECS, evaluateBumperState, type BumperFrameState, type BumperMode } from './bumperTimeline'
import { ProceduralStormAudio } from './audio'
import { StudioMarkLogoScene, type StudioMarkSceneHandle } from './StudioMarkLogoScene'
import { InspectorUI } from './InspectorUI'
import { BumperOverlayHUD } from './BumperOverlayHUD'

export interface StudioMarkBumperPort {
  setBumperMode: (mode: BumperMode, cleanCapture?: boolean) => void
  seekToTime: (mode: Exclude<BumperMode, 'interactive'>, timeSec: number, cleanCapture?: boolean) => BumperFrameState
  setCleanCapture: (clean: boolean) => void
  getState: () => {
    bumperMode: BumperMode
    manualBumperTime: number | null
    isCapturing: boolean
    frameState: BumperFrameState | null
    specs: typeof BUMPER_SPECS
  }
}

declare global {
  interface Window {
    __studioMarkBumper?: StudioMarkBumperPort
  }
}

export function StudioMarkLogoExperience() {
  const [config, setConfig] = useState<LogoConfig>(DEFAULT_LOGO_CONFIG)
  const [bumperMode, setBumperMode] = useState<BumperMode>('interactive')
  const [manualBumperTime, setManualBumperTime] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [bumperFrameState, setBumperFrameState] = useState<BumperFrameState | null>(null)

  const sceneRef = useRef<StudioMarkSceneHandle>(null)
  const audioRef = useRef<ProceduralStormAudio | null>(null)
  const stateRef = useRef({
    bumperMode,
    manualBumperTime,
    isCapturing,
    frameState: bumperFrameState,
  })
  stateRef.current = {
    bumperMode,
    manualBumperTime,
    isCapturing,
    frameState: bumperFrameState,
  }

  // Parse initial URL query params (?bumper=storm-ignition&capture=1&t=1.5)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qBumper = params.get('bumper')
    const qCapture = params.get('capture') === '1'
    const qTime = params.get('t')

    if (qCapture) {
      setIsCapturing(true)
    }
    if (qBumper === 'storm-ignition' || qBumper === 'puddle-crane') {
      setBumperMode(qBumper)
      if (qTime != null) {
        const parsed = parseFloat(qTime)
        if (!Number.isNaN(parsed)) {
          setManualBumperTime(parsed)
          setBumperFrameState(evaluateBumperState(qBumper, parsed))
        }
      }
    }
  }, [])

  // Attach deterministic `window.__studioMarkBumper` port for Playwright / Remotion capture
  useEffect(() => {
    window.__studioMarkBumper = {
      setBumperMode: (mode: BumperMode, cleanCapture = false) => {
        setIsCapturing(cleanCapture)
        setManualBumperTime(null)
        setBumperMode(mode)
        if (mode === 'interactive') {
          setBumperFrameState(null)
        } else {
          setBumperFrameState(evaluateBumperState(mode, 0))
        }
      },
      seekToTime: (mode: Exclude<BumperMode, 'interactive'>, timeSec: number, cleanCapture = true) => {
        const nextFrameState = evaluateBumperState(mode, timeSec)
        setIsCapturing(cleanCapture)
        setBumperMode(mode)
        setManualBumperTime(timeSec)
        setBumperFrameState(nextFrameState)
        return nextFrameState
      },
      setCleanCapture: (clean: boolean) => {
        setIsCapturing(clean)
      },
      getState: () => ({
        ...stateRef.current,
        specs: BUMPER_SPECS,
      }),
    }

    return () => {
      delete window.__studioMarkBumper
    }
  }, [])

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
    setBumperMode('interactive')
    setManualBumperTime(null)
    sceneRef.current?.setCameraPreset(preset)
  }

  const handleSelectBumperMode = useCallback((mode: BumperMode) => {
    setManualBumperTime(null)
    setBumperMode(mode)
    if (mode !== 'interactive') {
      // Ensure Kinetic Chevron is active and play synchronized Web Audio cue
      setConfig((prev) => ({
        ...prev,
        shape: 'sm-kinetic-chevron',
        audioEnabled: true,
      }))
      audioRef.current?.playBumperCue(mode)
    }
  }, [])

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
      } else if (e.key === '1') {
        e.preventDefault()
        handleSelectBumperMode(bumperMode === 'storm-ignition' ? 'interactive' : 'storm-ignition')
      } else if (e.key === '4') {
        e.preventDefault()
        handleSelectBumperMode(bumperMode === 'puddle-crane' ? 'interactive' : 'puddle-crane')
      } else if (e.key === 'Escape' && bumperMode !== 'interactive') {
        e.preventDefault()
        handleSelectBumperMode('interactive')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.audioEnabled, bumperMode, handleSelectBumperMode])

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
        bumperMode={bumperMode}
        manualBumperTime={manualBumperTime}
        onThunderAudio={handleThunderAudio}
        onBumperFrameUpdate={setBumperFrameState}
      />

      {/* Deterministic Cinema Reticle & Title Lockup Overlay (when a bumper is active) */}
      <BumperOverlayHUD
        bumperState={bumperFrameState}
        glowColor={config.glowColor}
        isCapturing={isCapturing}
        onExitBumper={() => handleSelectBumperMode('interactive')}
      />

      {/* Floating Control HUD (hidden during clean headless video capture) */}
      {!isCapturing && (
        <InspectorUI
          config={config}
          bumperMode={bumperMode}
          onChange={setConfig}
          onSelectBumperMode={handleSelectBumperMode}
          onTriggerLightning={handleTriggerLightning}
          onToggleAudio={handleToggleAudio}
          onCameraPreset={handleCameraPreset}
        />
      )}
    </div>
  )
}
