import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { OPENING } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { Backdrop } from '../ui/Backdrop'
import { DrawnName } from '../ui/DrawnName'
import { Thread, type Pt } from '../ui/Thread'
import { Eyebrow, Rise } from '../ui/Type'

/** The laced thread of the opening, and the straight axis it pulls into (y = AXIS_Y). */
export const AXIS_Y = 540
const LACED: Pt[] = [
  { x: -40, y: 820 },
  { x: 300, y: 760 },
  { x: 620, y: 900 },
  { x: 960, y: 820 },
  { x: 1300, y: 900 },
  { x: 1620, y: 780 },
  { x: 1960, y: 840 },
]
export const OPENING_EYELETS: Pt[] = [LACED[2], LACED[3], LACED[4]]

export const OPENING_FRAMES = 195

export function Opening() {
  const f = useCurrentFrame()
  const draw = ramp(f, 6, 70, EASE.draw)
  // The thread tightens into the drive axis the torque wrench is about to be drawn on.
  const pull = ramp(f, 150, 192, EASE.inOut)
  const pts = LACED.map((p, i) => ({ x: p.x, y: mix(p.y, AXIS_Y, pull) + (i === 0 || i === LACED.length - 1 ? 0 : 0) }))
  const nameDraw = ramp(f, 18, 78, EASE.draw)
  const nameFill = ramp(f, 72, 94, EASE.out)
  const titleIn = ramp(f, 86, 112)
  const plusIn = ramp(f, 98, 122)
  const leadIn = ramp(f, 104, 130)
  const out = ramp(f, 138, 162, EASE.in)
  const chromeIn = ramp(f, 0, 24)
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* Corner chrome: the site's header language. */}
      <AbsoluteFill style={{ padding: '56px 72px', opacity: chromeIn * (1 - ramp(f, 160, 190)) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>{OPENING.site}</Eyebrow>
          <Eyebrow>{OPENING.reel}</Eyebrow>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-40 * out}px)`, filter: `blur(${out * 6}px)` }}>
        <DrawnName text={OPENING.name} draw={nameDraw} fill={nameFill} size={232} y={440} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 486, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Eyebrow style={{ opacity: titleIn, letterSpacing: '0.42em' }}>{OPENING.place}</Eyebrow>
          <div style={{ display: 'flex', gap: 28, alignItems: 'baseline', fontFamily: F.hero, fontSize: 52, color: C.ink, letterSpacing: '-0.01em' }}>
            <Rise t={titleIn}>{OPENING.titleTop}</Rise>
            <Rise t={plusIn}>
              <span style={{ color: C.orange }}>+</span> {OPENING.titleBottom}
            </Rise>
          </div>
          <div style={{ marginTop: 26, fontFamily: F.body, fontSize: 30, color: C.inkMuted, opacity: leadIn, transform: `translateY(${(1 - leadIn) * 14}px)` }}>
            {OPENING.rollingLead} <span style={{ color: C.orange, fontWeight: 600 }}>{OPENING.rolling}</span>
          </div>
        </div>
      </AbsoluteFill>
      <Thread points={pts} progress={draw} eyelets={pull < 0.02 ? OPENING_EYELETS : []} opacity={1} />
    </AbsoluteFill>
  )
}
