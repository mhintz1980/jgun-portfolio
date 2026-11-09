import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { OPENING } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { Backdrop } from '../ui/Backdrop'
import { DrawnName } from '../ui/DrawnName'
import { Line, type Pt } from '../ui/Line'
import { Eyebrow, Rise } from '../ui/Type'

/** The opening's ruled line, and the drive axis it slides up to become (y = AXIS_Y). */
export const AXIS_Y = 540
const LINE_Y = 820
const MARKS_X = [620, 960, 1300]

export const OPENING_FRAMES = 195

export function Opening() {
  const f = useCurrentFrame()
  // Ruled thin in ink, then inked in Revision Orange while the name is drawn.
  const construct = ramp(f, 4, 40, EASE.draw)
  const ink = ramp(f, 40, 92, EASE.draw)
  // Then the whole line slides parallel, like a T-square, onto the drive axis the torque
  // wrench is about to be drawn on.
  const slide = ramp(f, 150, 192, EASE.inOut)
  const y = mix(LINE_Y, AXIS_Y, slide)
  const pts: Pt[] = [{ x: -40, y }, ...MARKS_X.map((x) => ({ x, y })), { x: 1960, y }]
  // The marks fade in from blank paper (so the loop lands cleanly) and clear before the slide.
  const markOpacity = ramp(f, 0, 24) * (1 - ramp(f, 140, 156))
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
      <Line points={pts} construct={construct} ink={ink} marks={pts.slice(1, -1)} markOpacity={markOpacity} />
    </AbsoluteFill>
  )
}
