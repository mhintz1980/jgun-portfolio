import { GdtSymbol } from './GdtSymbols'
import { useQuality } from '../state/qualityStore'
import { useScrollValue } from '../state/scrollStore'
import { DRAWING_INTRO_WINDOW, drawingIntroState } from '../scene/drawing/introTimeline'

interface DimensionLineProps {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
}

/** Camera-plane SVG dimension primitive; coordinates stay in the live drawing frame. */
export function DimensionLine({ x1, y1, x2, y2, label }: DimensionLineProps) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  return (
    <g className="fill-current stroke-current">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <rect x={midX - 33} y={midY - 11} width="66" height="16" fill="#05070a" stroke="none" />
      <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle" className="fill-cyan-100 text-[10px] tracking-[0.12em]">
        {label}
      </text>
    </g>
  )
}

function FeatureControlFrame({ x, y, datum }: { x: number; y: number; datum: string }) {
  return (
    <foreignObject x={x} y={y} width="130" height="24">
      <div className="flex h-6 w-[130px] border border-cyan-200/80 bg-[#05070a]/90 font-mono text-[10px] text-cyan-100">
        <span className="grid w-7 place-items-center border-r border-cyan-200/80"><GdtSymbol name="POSITION" /></span>
        <span className="grid flex-1 place-items-center border-r border-cyan-200/80">⌀0.04</span>
        <span className="grid w-7 place-items-center">{datum}</span>
      </div>
    </foreignObject>
  )
}

/**
 * B1's DOM layer. Its viewBox is the same camera-plane coordinate system as
 * DrawingLinework; it contains no model illustration, only dimensions/GD&T.
 */
export function EngineeringDrawingOverlay() {
  const progress = useScrollValue('progress')
  const { tier, reducedMotion } = useQuality()
  const state = reducedMotion ? drawingIntroState(DRAWING_INTRO_WINDOW.focusEnd) : drawingIntroState(progress)
  if (tier === 'poster' || state.drawingOpacity <= 0.001) return null

  return (
    <section
      aria-label="JGun engineering drawing with dimensions and geometric tolerances"
      className="pointer-events-none fixed inset-0 z-10 grid place-items-center text-cyan-100"
      style={{ opacity: state.drawingOpacity, filter: `blur(${(1 - state.focus) * 7}px)` }}
    >
      <svg viewBox="0 0 1000 720" className="h-[90vh] w-[90vw] max-w-[1500px] font-mono" role="img">
        <defs>
          <marker id="arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
          </marker>
        </defs>
        <rect x="18" y="18" width="964" height="684" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <text x="46" y="54" className="fill-current text-[13px] tracking-[0.22em]">JGUN D1-AP · GENERAL ARRANGEMENT · REV 01</text>
        <text x="46" y="78" className="fill-current text-[10px] tracking-[0.16em] opacity-70">ALL DIMENSIONS MM · UNLESS NOTED · ASME Y14.5</text>
        <DimensionLine x1={176} y1={620} x2={824} y2={620} label="412.0 ±0.5" />
        <DimensionLine x1={138} y1={204} x2={138} y2={518} label="Ø96.0 ±0.1" />
        <line x1="500" y1="150" x2="500" y2="570" strokeDasharray="5 7" strokeWidth="1" opacity="0.65" />
        <line x1="186" y1="360" x2="814" y2="360" strokeDasharray="5 7" strokeWidth="1" opacity="0.65" />
        <path d="M396 516 L350 566 H232" fill="none" stroke="currentColor" strokeWidth="1" />
        <text x="214" y="580" className="fill-current text-[12px]">DATUM A</text>
        <path d="M696 236 L780 176 H884" fill="none" stroke="currentColor" strokeWidth="1" />
        <text x="800" y="164" className="fill-current text-[12px]">DATUM B</text>
        <path d="M640 464 L744 532 H860" fill="none" stroke="currentColor" strokeWidth="1" />
        <text x="774" y="550" className="fill-current text-[12px]">DATUM C</text>
        <FeatureControlFrame x={164} y={128} datum="A" />
        {tier === 'full' && <FeatureControlFrame x={712} y={588} datum="B" />}
        <text x="710" y="104" className="fill-current text-[11px] tracking-[0.12em]">SECTION A-A · PLANET CARRIER</text>
        <path d="M722 122 h190 v78 h-190 z M742 142 h150 M817 122 v78" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      </svg>
    </section>
  )
}
