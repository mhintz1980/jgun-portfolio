import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { showcase } from '../armament'
import { ARMAMENT } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { mixHex } from '../three/track'
import { Backdrop } from '../ui/Backdrop'
import { PenHead } from '../ui/Line'
import { ShowcaseCard } from '../ui/ShowcaseCard'
import { Rise, RuleTag } from '../ui/Type'

/** Plotter pre-roll: the pen outlines the x-ray on the unlit table before the scan. */
export const ARMAMENT_PRE = 60
export const ARMAMENT_FRAMES = 480 + ARMAMENT_PRE

const PLATE = { x: 560, y: 250, w: 1240, h: 640 }
const EDGE_FILTER = 'armament-plot-edge'
/** The edge filter also traces the image's own border; trim it off. */
const EDGE_TRIM = 3

/** The outline is derived from the x-ray itself at render time (no new asset): a morphological
 *  edge (dilate − erode) of its luminance, inked. */
function EdgeFilter() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id={EDGE_FILTER} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={0.8} result="soft" />
          <feColorMatrix in="soft" type="luminanceToAlpha" result="lum" />
          <feMorphology in="lum" operator="dilate" radius={1} result="d" />
          <feMorphology in="lum" operator="erode" radius={1} result="e" />
          <feComposite in="d" in2="e" operator="arithmetic" k1={0} k2={1} k3={-1} k4={0} result="grad" />
          <feComponentTransfer in="grad" result="edge">
            <feFuncA type="linear" slope={9} intercept={-0.12} />
          </feComponentTransfer>
          <feFlood floodColor={C.ink} result="ink" />
          <feComposite in="ink" in2="edge" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

export function ArmamentAct() {
  const f = useCurrentFrame()
  // `g` is the original act's clock; it starts once the outline is drawn.
  const g = f - ARMAMENT_PRE
  const titleIn = ramp(f, 22, 48)
  const titleOut = ramp(g, 300, 322, EASE.in)

  // Shot 1 — the light table: the line scans an x-ray render of my fire-control work, ghost → solid.
  const plateIn = ramp(f, 8, 40)
  // The pen plots the outline left → right on the unlit table; then the light comes on (the
  // ghost x-ray) and the scan eats the drawing as it reveals the render.
  const plot = ramp(f, 16, 70, EASE.inOut)
  const plotX = PLATE.x + PLATE.w * plot
  const lightOn = ramp(f, 58, 96)
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
      <EdgeFilter />

      {/* Shot 1 */}
      <div style={{ position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, overflow: 'hidden', opacity: plateIn * (1 - shot1Out), transform: `translateY(${(1 - plateIn) * 40}px)`, boxShadow: '0 30px 60px -20px rgba(20,24,29,0.35)', background: mixHex(C.paper, '#c8c8c8', lightOn) }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '63% 52%' }}>
          {/* ghost (ahead of the scan) */}
          <Img src={staticFile(x20.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22 * lightOn, filter: 'blur(3px) grayscale(1)' }} />
          {/* plotted outline: drawn up to the pen, eaten by the scan */}
          {plot > 0 && scan < 1 && (
            <Img src={staticFile(x20.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `url(#${EDGE_FILTER})`, opacity: 0.85, clipPath: `inset(${EDGE_TRIM}px max(${EDGE_TRIM}px, ${100 - plot * 100}%) ${EDGE_TRIM}px max(${EDGE_TRIM}px, ${scan * 100}%))` }} />
          )}
          {/* revealed (behind the scan) */}
          <Img src={staticFile(x20.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 ${100 - scan * 100 / 1}% 0 0)` }} />
        </div>
        <Img src={staticFile(x18.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: toClose, transform: `scale(${mix(1.08, 1.0, toClose)})` }} />
      </div>
      {plot > 0 && plot < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={plotX} y1={PLATE.y} x2={plotX} y2={PLATE.y + PLATE.h} stroke={C.ink} strokeWidth={1} opacity={0.35} />
          <PenHead x={plotX} y={PLATE.y + PLATE.h / 2} reach={16} />
        </svg>
      )}
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
