import { useMemo, useRef } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { NeutralToneMapping } from 'three'
import { WRENCH } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { CameraRig } from '../three/CameraRig'
import { PostFX } from '../three/PostFX'
import { projectPoint } from '../three/project'
import { StudioEnvironment } from '../three/studioEnv'
import { SplitBackground } from '../three/SplitBackground'
import { mixHex, preToneMapped, track, type CamKey } from '../three/track'
import { GridLayer } from '../ui/Backdrop'
import { Wrench, type ScreenAnchor } from '../three/Wrench'
import { Eyebrow, Rise, RuleTag } from '../ui/Type'
import { AXIS_Y } from './Opening'

export const WRENCH_FRAMES = 540

// Assembled wrench spans world x ≈ ±0.145 (drive axis on world X, handle left, snout right).
const X0 = -0.175
const X1 = 0.175

const CAM: CamKey[] = [
  { f: 0, pos: [0, 0, 0.95], target: [0, 0, 0], fov: 22 },
  { f: 80, pos: [0.04, 0.035, 0.92], target: [0, 0, 0], fov: 22 },
  { f: 165, pos: [0.25, 0.13, 0.6], target: [0.005, 0, 0], fov: 26 },
  { f: 245, pos: [0.08, 0.2, 0.55], target: [-0.03, 0, 0], fov: 26 },
  { f: 345, pos: [0.0, 0.2, 0.94], target: [-0.155, 0, 0], fov: 28 },
  { f: 425, pos: [-0.36, 0.15, 0.88], target: [-0.16, 0, 0], fov: 28 },
  { f: 500, pos: [0.3, -0.035, 0.5], target: [0.02, 0, 0], fov: 28 },
  { f: 560, pos: [0.33, -0.03, 0.47], target: [0.025, 0, 0], fov: 28 },
]

/** World x on the drive axis that projects to screen x `px` under this frame's camera. */
function worldXAtScreen(px: number, cam: { pos: [number, number, number]; target: [number, number, number]; fov: number; roll?: number }) {
  let lo = -2
  let hi = 2
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (projectPoint([mid, 0, 0], cam).x < px) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function WrenchAct() {
  const f = useCurrentFrame()
  const cam = track(CAM, f)

  const plotT = ramp(f, 4, 80, EASE.inOut)
  // The drawing becomes the object: one front sweeps the sheet left → right, turning paper into
  // studio and linework into metal. `split` is that front in screen space.
  const split = mix(-0.06, 1.06, ramp(f, 72, 150, EASE.inOut))
  const lineColor = mixHex(C.ink, C.orangeLit, ramp(f, 70, 125))
  const lineOpacity = 1 - ramp(f, 140, 200)
  const explode = ramp(f, 255, 350, EASE.inOut) * (1 - ramp(f, 420, 492, EASE.inOut))
  const gearAngle = 8 * Math.PI * ramp(f, 225, 500, EASE.inOut)
  const shift = ramp(f, 178, 208, EASE.inOut) * (1 - ramp(f, 470, 495, EASE.inOut))
  const paperLin = useMemo(() => preToneMapped(C.paper), [])
  const navyLin = useMemo(() => preToneMapped(C.navy), [])
  const fillX = worldXAtScreen(split * 1920, cam)
  const front = split * 1920

  // The thread from the opening becomes the drive axis: the plotter head eats it as it draws.
  const plotX = mix(X0, X1, plotT)
  const head = projectPoint([plotX, 0, 0], cam)
  const threadOpacity = 1 - ramp(f, 76, 96)

  // Callouts are positioned imperatively from the 3D frame (anchors computed after the pose).
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([])
  const onAnchors = (anchors: ScreenAnchor[]) => {
    anchors.forEach((a, i) => {
      const el = calloutRefs.current[i]
      if (!el) return
      el.style.transform = `translate(${a.x}px, ${a.y}px)`
      el.dataset.side = a.x > 1500 ? 'left' : 'right'
      const label = el.querySelector<HTMLDivElement>('[data-label]')
      const tick = el.querySelector<SVGLineElement>('[data-tick]')
      if (label) {
        label.style.left = a.x > 1500 ? 'auto' : '44px'
        label.style.right = a.x > 1500 ? '44px' : 'auto'
      }
      if (tick) tick.setAttribute('transform', a.x > 1500 ? 'scale(-1 1)' : '')
    })
  }

  const titleIn = ramp(f, 18, 44)
  const titleOut = ramp(f, 236, 258, EASE.in)
  const explodeText = ramp(f, 292, 318) * (1 - ramp(f, 420, 440, EASE.in))
  const tagsIn = ramp(f, 455, 480)

  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <ThreeCanvas
        width={1920}
        height={1080}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = NeutralToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <SplitBackground left={navyLin} right={paperLin} split={split} feather={0.012} />
        <PostFX bloom={0.22 * ramp(f, 150, 175)} bloomThreshold={0.85} bloomRadius={0.28} />
        <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} roll={cam.roll} />
        <StudioEnvironment intensity={1.15} />
        <directionalLight position={[1.5, 2, 1]} intensity={2.0} />
        <directionalLight position={[-2, 1, -1.5]} intensity={0.9} color="#7dd3fc" />
        <directionalLight position={[-0.4, 1.4, -1.6]} intensity={2.6} color="#eef4ff" />
        <directionalLight position={[0.3, -1.2, -0.8]} intensity={1.4} color="#ff8a4c" />
        <Wrench
          pose={{ explode, gearAngle, shift, plotX, fillX, lineOpacity, lineColor, occlude: true, hidden: 1 - ramp(f, 72, 104) }}
          onAnchors={onAnchors}
        />
      </ThreeCanvas>

      {/* Drafting grid over both worlds: paper grid right of the front, studio grid left of it. */}
      <GridLayer tone="paper" style={{ WebkitMaskImage: `linear-gradient(90deg, transparent ${front - 12}px, black ${front + 12}px)` }} />
      <GridLayer tone="dark" style={{ WebkitMaskImage: `linear-gradient(90deg, black ${front - 12}px, transparent ${front + 12}px)`, opacity: 0.6 }} />
      {split > -0.05 && split < 1.05 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={front} y1={0} x2={front} y2={1080} stroke={C.orange} strokeWidth={10} opacity={0.18} />
          <line x1={front} y1={0} x2={front} y2={1080} stroke={C.orange} strokeWidth={2.5} />
        </svg>
      )}

      {/* Thread → axis */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: threadOpacity }}>
        <line x1={0} y1={AXIS_Y} x2={Math.max(0, head.x)} y2={AXIS_Y} stroke={C.orange} strokeWidth={3} opacity={1 - ramp(f, 0, 14)} />
        <line x1={Math.max(0, head.x)} y1={AXIS_Y} x2={1920} y2={AXIS_Y} stroke={C.orange} strokeWidth={3} />
        {plotT < 0.999 && (
          <g transform={`translate(${head.x} ${head.y})`} opacity={ramp(f, 0, 10)}>
            <circle r={18} fill={C.orange} opacity={0.22} />
            <circle r={6} fill={C.orange} />
            <line x1={0} y1={-70} x2={0} y2={70} stroke={C.orange} strokeWidth={1.5} opacity={0.7} />
          </g>
        )}
      </svg>

      {/* Title block + phase readout, drawn in ink on the sheet and cream in the studio: the
          front recolours the type as it passes. */}
      {(['paper', 'dark'] as const).map((tone) => {
        const ink = tone === 'paper' ? C.ink : C.cream
        const muted = tone === 'paper' ? C.inkMuted : C.creamMuted
        const mask = tone === 'paper'
          ? `linear-gradient(90deg, transparent ${front - 2}px, black ${front + 2}px)`
          : `linear-gradient(90deg, black ${front - 2}px, transparent ${front + 2}px)`
        return (
          <AbsoluteFill key={tone} style={{ WebkitMaskImage: mask }}>
            <div style={{ position: 'absolute', left: 96, top: 92, opacity: 1 - titleOut }}>
              <Rise t={titleIn}>
                <RuleTag color={muted}>{WRENCH.eyebrow}</RuleTag>
              </Rise>
              <Rise t={ramp(f, 26, 54)} style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 78, letterSpacing: '-0.02em', color: ink, lineHeight: 1 }}>{WRENCH.title}</div>
              </Rise>
              <Rise t={ramp(f, 36, 64)} style={{ marginTop: 14 }}>
                <div style={{ fontFamily: F.body, fontSize: 30, color: muted }}>{WRENCH.line}</div>
              </Rise>
            </div>
            <div style={{ position: 'absolute', left: 96, bottom: 84, opacity: ramp(f, 10, 30) * (1 - ramp(f, 160, 176)) }}>
              <Eyebrow color={muted}>{f < 108 ? WRENCH.phaseLinework : WRENCH.phaseSolid}</Eyebrow>
              <div style={{ marginTop: 14, width: 360, height: 2, background: tone === 'paper' ? '#d6d1c6' : '#2a3a4c' }}>
                <div style={{ width: `${(f < 108 ? plotT : Math.min(1, Math.max(0, split))) * 100}%`, height: 2, background: C.orange }} />
              </div>
            </div>
          </AbsoluteFill>
        )
      })}

      <div style={{ position: 'absolute', left: 96, bottom: 84, opacity: ramp(f, 176, 192) * (1 - ramp(f, 236, 250)) }}>
        <RuleTag color={C.cream}>{WRENCH.shift}</RuleTag>
      </div>

      {/* Explosion headline */}
      <div style={{ position: 'absolute', left: 96, top: 92, opacity: explodeText }}>
        <Rise t={explodeText}>
          <RuleTag color={C.cream}>{WRENCH.explode}</RuleTag>
        </Rise>
      </div>

      {/* Callouts */}
      {WRENCH.callouts.map((label, i) => {
        const tIn = ramp(f, 300 + i * 10, 322 + i * 10)
        const tOut = ramp(f, 412, 430, EASE.in)
        const up = i % 2 === 0
        const len = up ? 150 + (i % 4) * 18 : 130 + (i % 3) * 14
        return (
          <div key={label} ref={(el) => { calloutRefs.current[i] = el }} style={{ position: 'absolute', left: 0, top: 0, opacity: tIn * (1 - tOut) }}>
            <svg width={4} height={4} style={{ position: 'absolute', overflow: 'visible' }}>
              <circle r={5} fill="none" stroke={C.orangeLit} strokeWidth={2} />
              <line x1={0} y1={up ? -8 : 8} x2={0} y2={(up ? -1 : 1) * (8 + (len - 8) * tIn)} stroke={C.orangeLit} strokeWidth={1.5} />
              <line data-tick x1={0} y1={(up ? -1 : 1) * len} x2={34 * tIn} y2={(up ? -1 : 1) * len} stroke={C.orangeLit} strokeWidth={1.5} />
            </svg>
            <div data-label style={{ position: 'absolute', left: 44, top: (up ? -len : len) - 13, whiteSpace: 'nowrap', fontFamily: F.mono, fontSize: 19, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.cream }}>
              {label}
            </div>
          </div>
        )
      })}

      {/* Out: tags */}
      <div style={{ position: 'absolute', left: 96, bottom: 84, opacity: tagsIn }}>
        <Rise t={ramp(f, 445, 470)}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 54, color: C.cream, letterSpacing: '-0.02em' }}>{WRENCH.title}</div>
        </Rise>
        <Rise t={tagsIn} style={{ marginTop: 10 }}>
          <RuleTag color={C.creamMuted}>{WRENCH.tags}</RuleTag>
        </Rise>
      </div>
    </AbsoluteFill>
  )
}
