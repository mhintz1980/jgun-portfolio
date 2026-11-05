import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CLOSE } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { Backdrop } from '../ui/Backdrop'
import { DrawnName } from '../ui/DrawnName'
import { Thread, type Pt } from '../ui/Thread'
import { Eyebrow, Rise } from '../ui/Type'

export const CLOSE_FRAMES = 375

// Laced through the three projects, then pulled taut under the address.
const LACED: Pt[] = [
  { x: -40, y: 690 },
  { x: 360, y: 760 },
  { x: 640, y: 690 },
  { x: 960, y: 770 },
  { x: 1280, y: 690 },
  { x: 1560, y: 760 },
  { x: 1960, y: 700 },
]
const EYELETS = [LACED[2], LACED[3], LACED[4]]
const UNDER_Y = 902
const TAUT: Pt[] = [
  { x: -40, y: UNDER_Y },
  { x: 300, y: UNDER_Y },
  { x: 640, y: UNDER_Y },
  { x: 960, y: UNDER_Y },
  { x: 1280, y: UNDER_Y },
  { x: 1620, y: UNDER_Y },
  { x: 1960, y: UNDER_Y },
]

export function Close() {
  const f = useCurrentFrame()
  const draw = ramp(f, 0, 56, EASE.draw)
  const pull = ramp(f, 150, 196, EASE.inOut)
  const pts = LACED.map((p, i) => ({ x: mix(p.x, TAUT[i].x, pull), y: mix(p.y, TAUT[i].y, pull) }))
  const labelsIn = ramp(f, 20, 44) * (1 - ramp(f, 140, 158))
  const nameDraw = ramp(f, 40, 104, EASE.draw)
  const nameFill = ramp(f, 98, 120)
  const titleIn = ramp(f, 112, 138)
  const ledeIn = ramp(f, 132, 160)
  const ctaIn = ramp(f, 186, 214)
  const loopOut = ramp(f, 340, 372, EASE.inOut)
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: 1 - loopOut }}>
        <DrawnName text={CLOSE.name} draw={nameDraw} fill={nameFill} size={200} y={392} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 430, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', gap: 26, alignItems: 'baseline', fontFamily: F.hero, fontSize: 46, color: C.ink }}>
            <Rise t={titleIn}>{CLOSE.titleTop}</Rise>
            <Rise t={ramp(f, 122, 146)}>
              <span style={{ color: C.orange }}>+</span> {CLOSE.titleBottom}
            </Rise>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 30, color: C.inkMuted, opacity: ledeIn, transform: `translateY(${(1 - ledeIn) * 12}px)` }}>{CLOSE.lede}</div>
        </div>
        {EYELETS.map((e, i) => (
          <div key={i} style={{ position: 'absolute', left: e.x - 200, width: 400, top: e.y - 64, textAlign: 'center', opacity: labelsIn * ramp(f, 14 + i * 9, 30 + i * 9) }}>
            <Eyebrow color={C.ink} style={{ fontSize: 18 }}>{`0${i + 1}  ${CLOSE.recap[i]}`}</Eyebrow>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: UNDER_Y - 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: ctaIn }}>
          <Eyebrow color={C.orange} style={{ fontSize: 18 }}>{CLOSE.cta}</Eyebrow>
          <Rise t={ctaIn}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.ink, letterSpacing: '-0.01em' }}>{CLOSE.site}</div>
          </Rise>
        </div>
      </AbsoluteFill>
      <Thread points={pts} progress={draw} eyelets={pull < 0.02 ? EYELETS : []} opacity={1 - loopOut} />
    </AbsoluteFill>
  )
}
