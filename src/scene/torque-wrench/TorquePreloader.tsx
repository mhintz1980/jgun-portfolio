/**
 * TorquePreloader: High-fidelity Metrology Reticle Plus Countdown Overlay.
 * Masks the 3D canvas and handle camera angle until bakeSheet resolves and shaders are warm.
 * Inspired by Lusion's Oryzo.ai engine teardown with Mark's signature "Plus" (+ Systems Architect) identity.
 */
import { useEffect, useRef, useState } from 'react'
import './torque-preloader.css'

export interface TorquePreloaderProps {
  onComplete?: () => void
}

/**
 * Interpolates color between Orange (#f0703a) and Sky Blue (#38bdf8) around halfway (0.42..0.58).
 */
export function getPreloaderProgressColor(p: number): string {
  if (p <= 0.42) return '#f0703a'
  if (p >= 0.58) return '#38bdf8'
  const t = (p - 0.42) / (0.58 - 0.42)
  const smooth = 0.5 - 0.5 * Math.cos(t * Math.PI)
  const r = Math.round(240 * (1 - smooth) + 56 * smooth)
  const g = Math.round(112 * (1 - smooth) + 189 * smooth)
  const b = Math.round(58 * (1 - smooth) + 248 * smooth)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Text shadow glow that shifts from warm orange glow to cool cyan glow around halfway.
 */
export function getPreloaderGlow(p: number): string {
  if (p <= 0.42) return '0 0 24px rgba(240, 112, 58, 0.55)'
  if (p >= 0.58) return '0 0 24px rgba(56, 189, 248, 0.55)'
  const t = (p - 0.42) / (0.58 - 0.42)
  const smooth = 0.5 - 0.5 * Math.cos(t * Math.PI)
  const r = Math.round(240 * (1 - smooth) + 56 * smooth)
  const g = Math.round(112 * (1 - smooth) + 189 * smooth)
  const b = Math.round(58 * (1 - smooth) + 248 * smooth)
  return `0 0 24px rgba(${r}, ${g}, ${b}, 0.55)`
}

const MILESTONES = [
  { at: 0.25, text: '20+ YRS PRECISION MACHINING // 5-AXIS GEOMETRY' },
  { at: 0.5, text: 'SOLVING ASME Y14.5M TOLERANCE STATIONS' },
  { at: 0.85, text: '+ SYSTEMS ARCHITECT // COMPILING 3D PIPELINE' },
  { at: 1.0, text: 'THE PLUS ENGINE READY // MOUNTING' },
]

export function TorquePreloader({ onComplete }: TorquePreloaderProps) {
  const [percent, setPercent] = useState(0)
  const [progressVal, setProgressVal] = useState(0)
  const [statusText, setStatusText] = useState(MILESTONES[0].text)
  const [statusOpacity, setStatusOpacity] = useState(1)
  const [isZooming, setIsZooming] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const sheetReadyRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    // Listen for sheet bake completion dispatched by RuntimeWorld
    const handleSheetReady = () => {
      sheetReadyRef.current = true
    }
    window.addEventListener('torque-sheet-ready', handleSheetReady)

    // Reduced motion shortcut
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPercent(100)
      setProgressVal(1)
      setIsExiting(true)
      const timer = setTimeout(() => {
        setIsFinished(true)
        onCompleteRef.current?.()
      }, 200)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('torque-sheet-ready', handleSheetReady)
      }
    }

    // Natural paced duration (~3.8s for comfortable reading of the status ticker)
    const baseDuration = 3800
    const startTime = performance.now()
    let frameId: number
    let exitTimeoutId: ReturnType<typeof setTimeout>
    let finishTimeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      const elapsed = performance.now() - startTime
      let targetT = Math.min(1, elapsed / baseDuration)

      // Smooth cubic-out easing
      const eased = 1 - Math.pow(1 - targetT, 2.5)

      // Hold at 92% if the vector drawing sheet is still compiling
      const effectiveP = !sheetReadyRef.current && eased > 0.92 ? 0.92 : eased
      const curPercent = Math.min(100, Math.floor(effectiveP * 100))

      setProgressVal(effectiveP)
      setPercent(curPercent)

      // Milestone text update with soft opacity transition
      const activeMs = MILESTONES.find((m) => effectiveP <= m.at) ?? MILESTONES[MILESTONES.length - 1]
      setStatusText((prev) => {
        if (prev !== activeMs.text) {
          setStatusOpacity(0)
          setTimeout(() => {
            setStatusText(activeMs.text)
            setStatusOpacity(1)
          }, 120)
        }
        return prev
      })

      // When reaching 100%, trigger zoom-through of the Plus and exit reveal
      if (effectiveP >= 1 && (sheetReadyRef.current || targetT >= 1)) {
        setIsZooming(true)
        exitTimeoutId = setTimeout(() => {
          setIsExiting(true)
          finishTimeoutId = setTimeout(() => {
            setIsFinished(true)
            onCompleteRef.current?.()
          }, 650)
        }, 150)
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(exitTimeoutId)
      clearTimeout(finishTimeoutId)
      window.removeEventListener('torque-sheet-ready', handleSheetReady)
    }
  }, [])

  if (isFinished) return null

  const strokeColor = getPreloaderProgressColor(progressVal)
  const numberGlow = getPreloaderGlow(progressVal)
  // Circumference for r=60 is 2 * PI * 60 = 376.99
  const dashoffset = 376.99 * (1 - progressVal)
  const rotAngle = -90 + progressVal * 90
  const plusScale = 1 + Math.sin(progressVal * Math.PI * 4) * 0.12

  return (
    <div
      className="torque-preloader"
      data-torque-preloader={isExiting ? 'exiting' : isZooming ? 'zooming' : 'active'}
      data-exiting={String(isExiting)}
      data-zooming={String(isZooming)}
      aria-label="Loading pneumatic torque wrench 3D study"
      role="status"
    >
      {/* Top Identity Header */}
      <header className="torque-preloader-header">
        <div className="torque-preloader-identity">
          <span className="torque-preloader-brand-name">MARK HINTZ //</span>
          <span className="torque-preloader-role-mech">MECHANICAL DESIGNER</span>
          <span className="torque-preloader-plus-badge">+</span>
          <span className="torque-preloader-role-sys">SYSTEMS ARCHITECT</span>
        </div>
        <div className="torque-preloader-spec">
          <span>THE PLUS IN CAD EXECUTION</span>
        </div>
      </header>

      {/* Center Gauge & Counter */}
      <div className="torque-preloader-center">
        <div className="torque-preloader-gauge-box">
          {/* Outer Rotating Ring & Progress Arc */}
          <svg className="torque-preloader-svg" viewBox="0 0 140 140" aria-hidden="true">
            {/* Background dashed circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2"
              strokeDasharray="2 4"
            />
            {/* Dynamic Progress Arc changing from Orange to Sky Blue around halfway */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeDasharray="376.99"
              strokeDashoffset={dashoffset}
              style={{
                transition: 'stroke 300ms ease, stroke-dashoffset 80ms ease-out',
                transformOrigin: '70px 70px',
                transform: `rotate(${rotAngle}deg)`,
              }}
            />
            {/* Inner metrology quadrant ticks */}
            <circle
              cx="70"
              cy="70"
              r="50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="1"
              strokeDasharray="1 8"
            />
            {/* Fine Reticle Crosshairs */}
            <g stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1">
              <line x1="70" y1="18" x2="70" y2="30" />
              <line x1="70" y1="110" x2="70" y2="122" />
              <line x1="18" y1="70" x2="30" y2="70" />
              <line x1="110" y1="70" x2="122" y2="70" />
            </g>
          </svg>

          {/* Central Plus & Counter Numbers */}
          <div className="torque-preloader-core">
            <span
              className="torque-preloader-plus-icon"
              style={{
                transform: isZooming ? undefined : `scale(${plusScale})`,
                color: isZooming || progressVal >= 0.52 ? '#38bdf8' : '#f0703a',
                textShadow:
                  isZooming || progressVal >= 0.52
                    ? '0 0 20px rgba(56, 189, 248, 0.7)'
                    : '0 0 20px rgba(240, 112, 58, 0.7)',
              }}
            >
              +
            </span>
            <div className="torque-preloader-number" style={{ textShadow: numberGlow }}>
              {String(percent).padStart(3, '0')}
            </div>
            <span className="torque-preloader-unit">PERCENT</span>
          </div>
        </div>

        {/* Dynamic Status Ticker */}
        <div className="torque-preloader-ticker-box">
          <div className="torque-preloader-status" style={{ opacity: statusOpacity }}>
            {statusText}
          </div>
          <div className="torque-preloader-bar-track">
            <div
              className="torque-preloader-bar-fill"
              style={{
                width: `${percent}%`,
                backgroundColor: strokeColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Tagline */}
      <footer className="torque-preloader-footer">
        <div className="torque-preloader-tagline">
          <span
            className="torque-preloader-dot"
            style={{ backgroundColor: strokeColor, boxShadow: `0 0 8px ${strokeColor}` }}
          />
          <span>PHYSICAL TOOLING MEETS WEB-NATIVE 3D</span>
        </div>
        <div>CALIBRATING D1-AP VELLUM &amp; CAMERA</div>
      </footer>
    </div>
  )
}
