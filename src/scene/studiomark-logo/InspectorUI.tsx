import { useState } from 'react'
import type { CenterpieceShape, LogoConfig } from './types'
import { THEME_PRESETS } from './types'

interface InspectorUIProps {
  config: LogoConfig
  onChange: (updater: (prev: LogoConfig) => LogoConfig) => void
  onTriggerLightning: () => void
  onToggleAudio: () => void
  onCameraPreset: (preset: 'front' | 'water' | 'high' | 'reset') => void
}

export function InspectorUI({
  config,
  onChange,
  onTriggerLightning,
  onToggleAudio,
  onCameraPreset,
}: InspectorUIProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'model' | 'rain' | 'glass' | 'text'>('model')

  const currentTheme = THEME_PRESETS.find((t) => t.glowColor.toLowerCase() === config.glowColor.toLowerCase()) ?? THEME_PRESETS[0]

  return (
    <aside
      aria-label="StudioMark 3D Scene Controls"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        fontFamily: '"JetBrains Mono", monospace, ui-monospace, sans-serif',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: `1.5px solid ${config.glowColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(10, 14, 22, 0.85)',
              boxShadow: `0 0 16px ${config.glowColor}55`,
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: config.glowColor }}>SM</span>
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f1f5f9',
                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              }}
            >
              STUDIOMARK
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
                color: 'rgba(203, 213, 225, 0.7)',
                textTransform: 'uppercase',
              }}
            >
              3D Refraction × Rain Puddle
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Audio Toggle */}
          <button
            onClick={onToggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: 'pointer',
              backgroundColor: config.audioEnabled ? 'rgba(56, 232, 255, 0.15)' : 'rgba(15, 23, 42, 0.75)',
              color: config.audioEnabled ? '#38e8ff' : '#94a3b8',
              border: `1px solid ${config.audioEnabled ? '#38e8ff' : 'rgba(255, 255, 255, 0.12)'}`,
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{config.audioEnabled ? '🔊' : '🔇'}</span>
            <span>{config.audioEnabled ? 'Rain Audio: ON' : 'Audio: MUTED'}</span>
          </button>

          {/* Flash Lightning */}
          <button
            onClick={onTriggerLightning}
            title="Trigger Lightning Flash"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: 'pointer',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>⚡</span>
            <span>Flash</span>
          </button>

          {/* Toggle HUD Button */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {isOpen ? 'Minimize [H]' : 'Controls [H]'}
          </button>
        </div>
      </header>

      {/* Floating Control Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '320px',
            backgroundColor: 'rgba(11, 15, 24, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            overflow: 'hidden',
            pointerEvents: 'auto',
            color: '#e2e8f0',
          }}
        >
          {/* Panel Header & Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            {(['model', 'text', 'glass', 'rain'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${config.glowColor}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === tab ? '#f8fafc' : 'rgba(148, 163, 184, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* TAB 1: MODEL & SHAPE */}
            {activeTab === 'model' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Centerpiece Geometry
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
                    {[
                      { id: 'sm-kinetic-chevron', label: 'Kinetic Chevron' },
                      { id: 'sm-shared-spine', label: 'Shared Spine' },
                      { id: 'sm-cad-hex', label: 'CAD Hex' },
                      { id: 'sm-mobius', label: 'Mobius Ribbon' },
                      { id: 'sm-planetary-crown', label: 'Planetary Crown' },
                      { id: 'sm-prism-monolith', label: 'Prism Monolith' },
                      { id: 'hex-gem', label: 'CAD Hex Gem' },
                      { id: 'sm-monogram', label: 'SM Block' },
                      { id: 'torus-knot', label: 'Torus Knot' },
                      { id: 'gyroscope', label: 'Dual Gyro' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onChange((prev) => ({ ...prev, shape: item.id as CenterpieceShape }))}
                        style={{
                          padding: '0.45rem',
                          fontSize: '0.62rem',
                          borderRadius: '6px',
                          border: config.shape === item.id ? `1px solid ${config.glowColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: config.shape === item.id ? 'rgba(210, 196, 163, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          color: config.shape === item.id ? config.glowColor : '#cbd5e1',
                          cursor: 'pointer',
                          fontWeight: config.shape === item.id ? 700 : 500,
                          textAlign: 'center',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spin Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.64rem', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Continuous Spin
                  </label>
                  <button
                    onClick={() => onChange((prev) => ({ ...prev, spin: !prev.spin }))}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.62rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: config.spin ? 'rgba(56, 232, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: config.spin ? '#38e8ff' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {config.spin ? 'Active' : 'Paused'}
                  </button>
                </div>

                {/* Speed Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Rotation Rate</span>
                    <span style={{ color: config.glowColor }}>{(config.speed * 10000).toFixed(0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.0025"
                    step="0.0001"
                    value={config.speed}
                    onChange={(e) => onChange((prev) => ({ ...prev, speed: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Camera Angles */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Camera Angle
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { id: 'front', label: 'Front' },
                      { id: 'water', label: 'Puddle' },
                      { id: 'high', label: 'High' },
                      { id: 'reset', label: 'Reset' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => onCameraPreset(btn.id as 'front' | 'water' | 'high' | 'reset')}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0',
                          fontSize: '0.6rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: TEXT & COLOR */}
            {activeTab === 'text' && (
              <>
                {/* 3D Text Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Logo Typography
                  </label>
                  <input
                    type="text"
                    value={config.text}
                    onChange={(e) => onChange((prev) => ({ ...prev, text: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Subtitle Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => onChange((prev) => ({ ...prev, subtitle: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      color: '#94a3b8',
                      fontSize: '0.65rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Theme Palette Presets */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Color Palette Preset ({currentTheme.name})
                  </label>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = config.glowColor.toLowerCase() === preset.glowColor.toLowerCase()
                      return (
                        <button
                          key={preset.id}
                          onClick={() => onChange((prev) => ({ ...prev, glowColor: preset.glowColor }))}
                          title={preset.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: preset.glowColor,
                            border: isSelected ? '3px solid #ffffff' : '2px solid rgba(0,0,0,0.5)',
                            cursor: 'pointer',
                            boxShadow: isSelected ? `0 0 14px ${preset.glowColor}` : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Emissive Glow Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Emissive Glow Power</span>
                    <span style={{ color: config.glowColor }}>{config.emissiveIntensity.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={config.emissiveIntensity}
                    onChange={(e) => onChange((prev) => ({ ...prev, emissiveIntensity: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>
              </>
            )}

            {/* TAB 3: GLASS MATERIAL */}
            {activeTab === 'glass' && (
              <>
                {/* Transmission */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Optical Transmission</span>
                    <span style={{ color: config.glowColor }}>{(config.transmission * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={config.transmission}
                    onChange={(e) => onChange((prev) => ({ ...prev, transmission: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Roughness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Surface Polish (Roughness)</span>
                    <span style={{ color: config.glowColor }}>{config.roughness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.02"
                    value={config.roughness}
                    onChange={(e) => onChange((prev) => ({ ...prev, roughness: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Thickness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Refraction Volume Depth</span>
                    <span style={{ color: config.glowColor }}>{config.thickness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={config.thickness}
                    onChange={(e) => onChange((prev) => ({ ...prev, thickness: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Chromatic Aberration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Prism Dispersion</span>
                    <span style={{ color: config.glowColor }}>{config.chromaticAberration.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.2"
                    step="0.01"
                    value={config.chromaticAberration}
                    onChange={(e) => onChange((prev) => ({ ...prev, chromaticAberration: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>
              </>
            )}

            {/* TAB 4: RAIN & PUDDLE */}
            {activeTab === 'rain' && (
              <>
                {/* Rain Intensity Switcher */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Precipitation Mode
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {(['heavy', 'drizzle', 'off'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onChange((prev) => ({ ...prev, rainIntensity: mode }))}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0',
                          fontSize: '0.62rem',
                          borderRadius: '6px',
                          border: config.rainIntensity === mode ? `1px solid ${config.glowColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: config.rainIntensity === mode ? 'rgba(210, 196, 163, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          color: config.rainIntensity === mode ? config.glowColor : '#cbd5e1',
                          cursor: 'pointer',
                          fontWeight: config.rainIntensity === mode ? 700 : 500,
                          textTransform: 'capitalize',
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Puddle Reflectivity */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Puddle Water Mirror</span>
                    <span style={{ color: config.glowColor }}>{(config.puddleReflectivity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={config.puddleReflectivity}
                    onChange={(e) => onChange((prev) => ({ ...prev, puddleReflectivity: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Ripple Normal Strength */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    <span>Wave Ripple Distortion</span>
                    <span style={{ color: config.glowColor }}>{config.rippleStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.05"
                    value={config.rippleStrength}
                    onChange={(e) => onChange((prev) => ({ ...prev, rippleStrength: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: config.glowColor }}
                  />
                </div>

                {/* Auto Lightning */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.64rem', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Auto Thunderstorm
                  </label>
                  <button
                    onClick={() => onChange((prev) => ({ ...prev, autoLightning: !prev.autoLightning }))}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.62rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: config.autoLightning ? 'rgba(56, 232, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: config.autoLightning ? '#38e8ff' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {config.autoLightning ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Left Navigation Link */}
      <footer
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1.5rem',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <a
          href="/home/"
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f8fafc'
            e.currentTarget.style.borderColor = config.glowColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <span>←</span>
          <span>Return to Homepage</span>
        </a>
      </footer>
    </aside>
  )
}

