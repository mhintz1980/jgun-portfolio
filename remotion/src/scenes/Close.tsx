import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CLOSE } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { Backdrop } from '../ui/Backdrop'
import { DrawnName } from '../ui/DrawnName'
import { Line, ruled, type Pt } from '../ui/Line'
import { Eyebrow, Rise } from '../ui/Type'

export const CLOSE_FRAMES = 375

// One ruled line through the three projects, then slid down to underline the address.
const LINE_Y = 730
const MARKS_X = [640, 960, 1280]
const UNDER_Y = 902

export function Close() {
  const f = useCurrentFrame()
  const construct = ramp(f, 0, 30, EASE.draw)
  const ink = ramp(f, 26, 84, EASE.draw)
  const slide = ramp(f, 150, 196, EASE.inOut)
  const y = mix(LINE_Y, UNDER_Y, slide)
  const pts: Pt[] = [{ x: -40, y }, ...MARKS_X.map((x) => ({ x, y })), { x: 1960, y }]
  const marks = pts.slice(1, -1)
  const s = ruled(pts)
  const labelsOut = 1 - ramp(f, 140, 158)
  // Each project label rises the moment the inked line reaches its mark.
  const reached = (m: Pt) => Math.min(1, Math.max(0, (ink - s.lengthAt(m) / s.total) * 9))
  const nameDraw = ramp(f, 40, 104, EASE.draw)
  const nameFill = ramp(f, 98, 120)
  const titleIn = ramp(f, 112, 138)
  const ledeIn = ramp(f, 132, 160)
  const ctaIn = ramp(f, 186, 214)
  // No fade-out here: the StudioMark ident wipes in over the hold and closes the loop itself.
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill>
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
        {marks.map((m, i) => {
          const t = reached(m) * labelsOut
          return (
            <div key={i} style={{ position: 'absolute', left: m.x - 200, width: 400, top: m.y - 72, textAlign: 'center', opacity: t, transform: `translateY(${(1 - reached(m)) * 10}px)` }}>
              <Eyebrow color={C.ink} style={{ fontSize: 18 }}>{`0${i + 1}  ${CLOSE.recap[i]}`}</Eyebrow>
            </div>
          )
        })}
        {/* Leaders: short extension lines from each mark up toward its label. */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {marks.map((m, i) => (
            <line key={i} x1={m.x} y1={m.y - 12} x2={m.x} y2={m.y - 12 - 24 * reached(m)} stroke={C.orange} strokeWidth={1.5} opacity={labelsOut} />
          ))}
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: UNDER_Y - 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: ctaIn }}>
          <Eyebrow color={C.orange} style={{ fontSize: 18 }}>{CLOSE.cta}</Eyebrow>
          <Rise t={ctaIn}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.ink, letterSpacing: '-0.01em' }}>{CLOSE.site}</div>
          </Rise>
        </div>
      </AbsoluteFill>
      <Line points={pts} construct={construct} ink={ink} marks={marks} markOpacity={labelsOut} />
    </AbsoluteFill>
  )
}
