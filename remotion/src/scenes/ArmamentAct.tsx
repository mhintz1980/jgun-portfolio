import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { FILM_CLIPS } from '../clips'
import { showcase } from '../armament'
import { ARMAMENT } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { mixHex } from '../three/track'
import { Backdrop } from '../ui/Backdrop'
import { ClipSpin } from '../ui/ClipSpin'
import { PenHead } from '../ui/Line'
import { ShowcaseCard } from '../ui/ShowcaseCard'
import { Rise, RuleTag } from '../ui/Type'

/** Opening shot: the representative AR-15-pattern carbine is plotted, resolves to shade, spins once. */
export const ARMAMENT_CARBINE = 180
export const ARMAMENT_FRAMES = 480 + ARMAMENT_CARBINE

const PLATE = { x: 560, y: 250, w: 1240, h: 640 }

/** The clip is drawn at 0.8 (1536×864) under the title block. */
const CARBINE_BOX = { left: 192, top: 196, width: 1536, height: 864 }
const CARBINE_SCALE = CARBINE_BOX.width / 1920
/** Rifle bounding box in frame f0000 (source px, muzzle right): the pen sweeps only this span. */
const CARBINE_BBOX = { x0: 217, x1: 1802, y0: 405, y1: 865 }
/** Shade multiplied onto the paper at this opacity once the line resolves (owner range 0.35–0.6). */
const SHADE = 0.5
const CARBINE_SPIN = { start: 114, length: 57 }
/** Hand-off to the light table, review switch. A: sequential (carbine fades out f174–188, plate
 *  rises from f189). B: push (carbine slides off left as the plate slides in from the right,
 *  f176–200). The two never overlap in either. */
const HANDOFF: 'A' | 'B' = 'A'

/** Shot 0 on the act clock: wipe in on empty paper, plot (f16–70), hold, resolve to shade
 *  (f84–114), spin with overshoot and settle (f114–171), hold, then fade and drift out (f176–200)
 *  as the light-table plate comes in. */
function CarbineShot({ f }: { f: number }) {
  const sx = (x: number) => CARBINE_BOX.left + CARBINE_SCALE * x
  const sy = (y: number) => CARBINE_BOX.top + CARBINE_SCALE * y
  const plot = ramp(f, 16, 70, EASE.inOut)
  const plotX = mix(sx(CARBINE_BBOX.x0), sx(CARBINE_BBOX.x1), plot)
  // A: the carbine is gone before the plate starts. B: it is pushed off left at full strength.
  const out = HANDOFF === 'A' ? ramp(f, 174, 188, EASE.inOut) : 0
  const drift = HANDOFF === 'A' ? -80 * out : -1700 * ramp(f, 176, 200, EASE.inOut)
  return (
    <>
      <ClipSpin
        clip={FILM_CLIPS.carbine}
        box={{ ...CARBINE_BOX, left: CARBINE_BOX.left + drift }}
        spin={CARBINE_SPIN}
        revealX={plot >= 1 ? Number.POSITIVE_INFINITY : plotX + drift}
        shadeOpacity={SHADE * ramp(f, 84, 114, EASE.inOut)}
        opacity={ramp(f, 8, 16) * (1 - out)}
        labelAt={{ left: sx(CARBINE_BBOX.x0) + drift, top: sy(CARBINE_BBOX.y1) + 40 }}
      />
      {plot > 0 && plot < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={plotX} y1={sy(CARBINE_BBOX.y0) - 40} x2={plotX} y2={sy(CARBINE_BBOX.y1) + 20} stroke={C.ink} strokeWidth={1} opacity={0.35} />
          <PenHead x={plotX} y={sy((CARBINE_BBOX.y0 + CARBINE_BBOX.y1) / 2)} reach={16} />
        </svg>
      )}
    </>
  )
}

export function ArmamentAct() {
  const f = useCurrentFrame()
  // `g` is the original act's clock (the light table); it starts after the carbine shot.
  const g = f - ARMAMENT_CARBINE
  const titleIn = ramp(f, 22, 48)
  const titleOut = ramp(g, 300, 322, EASE.in)

  // Shot 1 — the light table: the line scans an x-ray render of my fire-control work, ghost → solid.
  // It comes in lit as the carbine hands off, and the scan reveals the render.
  const plateIn = ramp(g, 9, 34)
  const push = ramp(f, 176, 200, EASE.inOut)
  const plateOpacity = HANDOFF === 'A' ? plateIn : f >= 176 ? 1 : 0
  const plateEnter = HANDOFF === 'A' ? `translateY(${(1 - plateIn) * 40}px)` : `translateX(${(1 - push) * 1400}px)`
  const lightOn = ramp(g, 14, 40)
  const scan = ramp(g, 40, 128, EASE.inOut)
  const scanX = PLATE.x + PLATE.w * scan
  const zoom = mix(1, 2.35, ramp(g, 128, 236, EASE.inOut))
  const toClose = ramp(g, 168, 200, EASE.inOut)
  const shot1Out = ramp(g, 226, 250, EASE.in)

  // Shot 2 — dark plate + bolt carrier.
  const s2 = ramp(g, 232, 266)
  const s2Out = ramp(g, 316, 338, EASE.in)
  const drift = ramp(g, 232, 340, EASE.linear)

  // Shot 3 — representative context, every card labelled.
  const cards = ['ar-05.webp', 'ar-07.webp', 'ar-06.webp']
  const s3Head = ramp(g, 330, 352) * (1 - ramp(g, 446, 466, EASE.in))

  const x20 = showcase('ar-20.webp')
  const x18 = showcase('ar-18.webp')

  return (
    <AbsoluteFill>
      <Backdrop />
      {/* Shot 0 — the carbine (a fragment: its multiply groups sit directly on the paper) */}
      {f < 200 && <CarbineShot f={f} />}

      {/* Shot 1 */}
      <div style={{ position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, overflow: 'hidden', opacity: plateOpacity * (1 - shot1Out), transform: plateEnter, boxShadow: '0 30px 60px -20px rgba(20,24,29,0.35)', background: mixHex(C.paper, '#c8c8c8', lightOn) }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '63% 52%' }}>
          {/* ghost (ahead of the scan) */}
          <Img src={staticFile(x20.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22 * lightOn, filter: 'blur(3px) grayscale(1)' }} />
          {/* revealed (behind the scan) */}
          <Img src={staticFile(x20.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 ${100 - scan * 100 / 1}% 0 0)` }} />
        </div>
        <Img src={staticFile(x18.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: toClose, transform: `scale(${mix(1.08, 1.0, toClose)})` }} />
      </div>
      {scan > 0 && scan < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={scanX} y1={PLATE.y - 60} x2={scanX} y2={PLATE.y + PLATE.h + 60} stroke={C.orange} strokeWidth={12} opacity={0.18} />
          <line x1={scanX} y1={PLATE.y - 60} x2={scanX} y2={PLATE.y + PLATE.h + 60} stroke={C.orange} strokeWidth={2.5} />
          <circle cx={scanX} cy={PLATE.y - 60} r={6} fill={C.orange} />
        </svg>
      )}

      {/* Shot 2 */}
      <div style={{ opacity: s2 * (1 - s2Out) }}>
        <ShowcaseCard
          file="ar-17.webp"
          width={1200}
          height={610}
          style={{ left: 600 - 40 * drift, top: 236, transform: `translateX(${(1 - s2) * 120}px)` }}
          imgStyle={{ transform: `scale(${1.12 - 0.08 * drift})` }}
        />
        <ShowcaseCard
          file="ar-23.webp"
          width={520}
          height={390}
          style={{ left: 330 + 30 * drift, top: 560, transform: `translateY(${(1 - ramp(g, 246, 280)) * 160}px)`, opacity: ramp(g, 246, 270) }}
          imgStyle={{ transform: `scale(${1.04 + 0.08 * drift})` }}
        />
      </div>

      {/* Shot 3 */}
      <div style={{ position: 'absolute', left: 76, top: 250, opacity: s3Head }}>
        <RuleTag color={C.inkMuted}>{ARMAMENT.tags}</RuleTag>
      </div>
      {cards.map((file, i) => {
        const t = ramp(g, 336 + i * 12, 366 + i * 12)
        const out = ramp(g, 446 + i * 4, 470 + i * 4, EASE.in)
        return (
          <ShowcaseCard
            key={file}
            file={file}
            width={572}
            height={420}
            style={{
              left: 76 + i * 598,
              top: 330,
              opacity: t * (1 - out),
              transform: `translateY(${(1 - t) * 90 - out * 60}px) rotate(${(1 - t) * (i - 1) * 2}deg)`,
            }}
            imgStyle={{ transform: `scale(${1.06 - 0.05 * ramp(g, 336, 470, EASE.linear)})` }}
          />
        )
      })}

      {/* Title block (ink on the sheet) */}
      <div style={{ position: 'absolute', left: 96, top: 92, width: 1300, opacity: 1 - titleOut }}>
        <Rise t={titleIn}>
          <RuleTag color={C.inkMuted}>{ARMAMENT.eyebrow}</RuleTag>
        </Rise>
        <Rise t={ramp(f, 30, 58)} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 56, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.02, whiteSpace: 'nowrap' }}>{ARMAMENT.title}</div>
        </Rise>
        <Rise t={ramp(f, 40, 68)} style={{ marginTop: 14 }}>
          <div style={{ fontFamily: F.body, fontSize: 28, color: C.inkMuted, width: 420 }}>{ARMAMENT.line}</div>
        </Rise>
      </div>
    </AbsoluteFill>
  )
}
