import type { BumperFrameState } from './bumperTimeline'

interface BumperOverlayHUDProps {
  bumperState: BumperFrameState | null
  glowColor?: string
  isCapturing?: boolean
  onExitBumper?: () => void
}

/**
 * Cinema Overlay & Precision CAD Reticle Lockup for StudioMark 3D Video Bumpers.
 * Driven 100% deterministically by `bumperState.hudOpacity` and `bumperState.fadeBlackOpacity`.
 */
export function BumperOverlayHUD({
  bumperState,
  glowColor = '#d2c4a3',
  isCapturing = false,
  onExitBumper,
}: BumperOverlayHUDProps) {
  if (!bumperState) return null

  const { hudOpacity, fadeBlackOpacity, actLabel, timeSec, durationSec, progress, mode } = bumperState
  const lineScale = Math.max(0, Math.min(1, hudOpacity * 1.15))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        fontFamily: '"JetBrains Mono", monospace, ui-monospace, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Anamorphic Edge Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(6,8,14,0) 54%, rgba(4,6,12,0.58) 100%)',
        }}
      />

      {/* Corner Precision CAD Reticle Brackets (syncs with Hero Lockup) */}
      <div
        style={{
          position: 'absolute',
          inset: '2.2rem 2.8rem',
          opacity: hudOpacity * 0.72,
        }}
      >
        {/* Top-Left Corner Bracket */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '22px',
            height: '22px',
            borderTop: `1.5px solid ${glowColor}`,
            borderLeft: `1.5px solid ${glowColor}`,
          }}
        />
        {/* Top-Right Corner Bracket */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '22px',
            height: '22px',
            borderTop: `1.5px solid ${glowColor}`,
            borderRight: `1.5px solid ${glowColor}`,
          }}
        />
        {/* Bottom-Left Corner Bracket */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '22px',
            height: '22px',
            borderBottom: `1.5px solid ${glowColor}`,
            borderLeft: `1.5px solid ${glowColor}`,
          }}
        />
        {/* Bottom-Right Corner Bracket */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '22px',
            height: '22px',
            borderBottom: `1.5px solid ${glowColor}`,
            borderRight: `1.5px solid ${glowColor}`,
          }}
        />
      </div>

      {/* Lower-Third Hero Signature Plate */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '7.5%',
          transform: `translate(-50%, ${(1 - hudOpacity) * 14}px)`,
          opacity: hudOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.42rem',
          textAlign: 'center',
        }}
      >
        {/* Horizontal Expanding Hairline Rule */}
        <div
          style={{
            width: `${Math.round(280 * lineScale)}px`,
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        />

        {/* Primary Domain Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.34em',
            color: '#f8fafc',
            textShadow: `0 2px 14px rgba(0,0,0,0.95), 0 0 18px ${glowColor}66`,
            paddingLeft: '0.34em',
          }}
        >
          <span>STUDIOMARK.DEV</span>
        </div>

        {/* Sub-caption */}
        <div
          style={{
            fontSize: '0.58rem',
            fontWeight: 500,
            letterSpacing: '0.24em',
            color: glowColor,
            opacity: 0.88,
            paddingLeft: '0.24em',
          }}
        >
          PRECISION CAD × REAL-TIME 3D ENGINEERING
        </div>
      </div>

      {/* Interactive Playback Scrubber Pill (hidden during headless video capture) */}
      {!isCapturing && (
        <div
          style={{
            position: 'absolute',
            top: '4.4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            padding: '0.45rem 0.95rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(10, 14, 24, 0.82)',
            border: `1px solid ${glowColor}55`,
            backdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            color: '#e2e8f0',
            fontSize: '0.64rem',
            letterSpacing: '0.1em',
          }}
        >
          <span style={{ color: glowColor, fontWeight: 700 }}>
            {mode === 'storm-ignition' ? '⚡ BUMPER 01' : '🌊 BUMPER 04'}
          </span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span>{actLabel}</span>
          <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
            {timeSec.toFixed(2)}s / {durationSec.toFixed(2)}s
          </span>
          <div
            style={{
              width: '72px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: '100%',
                backgroundColor: glowColor,
              }}
            />
          </div>
          {onExitBumper && (
            <button
              onClick={onExitBumper}
              style={{
                marginLeft: '0.25rem',
                padding: '0.18rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.18)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#f8fafc',
                fontSize: '0.58rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Exit [Esc]
            </button>
          )}
        </div>
      )}

      {/* Cinema Black Fade Curtain */}
      {fadeBlackOpacity > 0.001 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#04060b',
            opacity: fadeBlackOpacity,
          }}
        />
      )}
    </div>
  )
}

