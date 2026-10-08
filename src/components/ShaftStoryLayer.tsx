import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  createShaftScriptFrame, sampleShaftScript, SHAFT_ATTRIBUTION_TEXT, SHAFT_RECAP_CAPTION_TEXT, SHAFT_STAMP_TEXT,
  type ShaftScriptFrame,
} from '../scene/inspection/shaft/script'
import {
  FOS_MAX, FOS_MIN, FOS_STOPS, newFosPresentation, sampleFosPresentation, type FosPresentation,
} from '../scene/inspection/shaft/fosPresentation'
import { SHAFT_CARD_TEXT } from '../scene/inspection/shaft/script'
import './ShaftStoryLayer.css'

/** CSS gradient of the shared FOS bar, bottom (low FOS, red) to top (high FOS, blue). */
const fosGradient = (direction: string) => `linear-gradient(${direction}, ${FOS_STOPS.map(([value, r, g, b]) => `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}) ${(((value - FOS_MIN) / (FOS_MAX - FOS_MIN)) * 100).toFixed(1)}%`).join(', ')})`
const FOS_VARS = { '--fos-gradient-v': fosGradient('to top'), '--fos-gradient-h': fosGradient('to right') } as CSSProperties
const FOS_TICKS = [0, 1, 2, 3] as const

/** Left model block + right FOS bar (JG-035 S2): shown exactly while the stress field is, from the same sampler. */
function FosPanels({ frame, fos }: { frame: ShaftScriptFrame; fos: FosPresentation }) {
  if (fos.kind === 'none') return null
  const attempt = fos.kind === 'attempt'
  const material = attempt ? (frame.card !== 'none' ? frame.cardText : SHAFT_CARD_TEXT.c300) : SHAFT_CARD_TEXT['4340-ht']
  const position = (fos.hotspot - FOS_MIN) / (FOS_MAX - FOS_MIN)
  return <>
    <div className="shaft-fos-model" data-shaft-fos-model="" data-shaft-fos-kind={fos.kind} style={{ opacity: fos.opacity }} aria-hidden="true">
      <p><span>Model Name:</span> Input Shaft</p>
      <p><span>Study:</span> {attempt ? 'Grooved blank (cutter runout groove)' : 'Revised, rotary hobbed'}</p>
      <p><span>Plot type:</span> Factor of safety</p>
      <p><span>Material:</span> {material}</p>
      {attempt && <p className="shaft-fos-min"><span>Min FOS =</span> <b data-shaft-fos-value="">{fos.hotspot.toFixed(2)}</b></p>}
    </div>
    <div className="shaft-fos-bar" data-shaft-fos-bar="" data-shaft-fos-kind={fos.kind} style={{ opacity: fos.opacity, ...FOS_VARS }} aria-hidden="true">
      <span className="shaft-fos-title">FOS</span>
      <div className="shaft-fos-track">
        <div className="shaft-fos-gradient" />
        {FOS_TICKS.map(tick => <span key={tick} className="shaft-fos-tick" style={{ '--fos-pos': tick / FOS_MAX } as CSSProperties}>{tick.toFixed(1)}</span>)}
        {attempt
          ? <span className="shaft-fos-marker" data-shaft-fos-marker="" style={{ '--fos-pos': position } as CSSProperties}><i /><em>{fos.hotspot.toFixed(2)}</em></span>
          : <span className="shaft-fos-range" data-shaft-fos-range="" style={{ '--fos-pos': fos.hotspot / FOS_MAX } as CSSProperties} />}
      </div>
    </div>
  </>
}

export interface ShaftStoryLayerProps { readonly time: number; readonly reducedMotion: boolean }

/**
 * Authored transcript of the four shaft chapters. Screen-reader available, visually hidden.
 * Undercut is glossed exactly once: the cutter runout/relief groove, distinct from the
 * involute tooth-root undercut.
 */
export const SHAFT_TRANSCRIPT: readonly { readonly heading: string; readonly body: string }[] = Object.freeze([
  Object.freeze({
    heading: 'Why the groove was needed',
    body: 'A gear shaper strokes a disc cutter along each tooth. To finish the tooth, the cutter has to travel past the end of the face and throw its chip into open space, so the original shaft had a narrow groove just below the gear. That groove is the undercut in this story: the cutter runout and relief groove, distinct from the involute tooth-root undercut of a gear tooth.',
  }),
  Object.freeze({
    heading: 'Material attempts',
    body: 'Three materials were tried in the grooved blank: AISI 4140 (40-45 HRC), AISI 4340 (48-50 HRC), and C300 (56-58 HRC). A factor-of-safety plot concentrates at the groove and stays below 1.0 for every attempt, lowest for 4140 and highest for C300. Each attempt was marked FAILED; these attempts are recounted by the designer.',
  }),
  Object.freeze({
    heading: 'Changing the process',
    body: 'The failed groove design was replaced by a revised smooth blank, cut by rotary hobbing so all ten teeth formed with the approved lead-out. The revised shaft is AISI 4340 (H.T. 48-50 HRC); its factor-of-safety plot stays in the blue end of the scale.',
  }),
  Object.freeze({
    heading: 'Moving the supports',
    body: 'With the new geometry settled, the bearing and retaining-ring pair moved 2.75 millimetres into the approved final placement beside a matching housing support, and the revised assembly study returns around the operating gear train.',
  }),
])

function buildAnnouncement(frame: ShaftScriptFrame): string {
  const parts: string[] = []
  if (frame.card !== 'none') parts.push(frame.cardText)
  if (frame.stamp === 'settled') parts.push(SHAFT_STAMP_TEXT)
  if (frame.remainingTeeth) parts.push(SHAFT_RECAP_CAPTION_TEXT)
  if (frame.attribution) parts.push(SHAFT_ATTRIBUTION_TEXT)
  if (frame.stressIllustrative) parts.push('Factor of safety field on the input shaft')
  return parts.join('; ')
}

/**
 * DOM card layer for the shaft inspection story. Renders the material cards, FAILED stamp,
 * attribution and captions from the closed-form sampler. Not mounted anywhere in the app;
 * nothing here registers a story or owns narrative state.
 */
export function ShaftStoryLayer({ time, reducedMotion }: ShaftStoryLayerProps) {
  const frameRef = useRef<ShaftScriptFrame | null>(null)
  if (!frameRef.current) frameRef.current = createShaftScriptFrame()
  const frame = sampleShaftScript(time, reducedMotion, frameRef.current)
  const fosRef = useRef<FosPresentation | null>(null)
  if (!fosRef.current) fosRef.current = newFosPresentation()
  const fos = sampleFosPresentation(time, frame.stress, frame.stressMix, fosRef.current)
  const [status, setStatus] = useState({ version: 0, text: '' })
  useEffect(() => {
    const text = buildAnnouncement(frame)
    setStatus(previous => previous.text === text ? previous : { version: previous.version + 1, text })
  }, [frame.discrete])
  return <div className="shaft-story-layer">
    <div className="shaft-story-column">
      {frame.card !== 'none' && <div className="shaft-card-slot" data-shaft-card="">
        <div className="shaft-card" style={{ opacity: frame.cardOpacity }} aria-hidden={frame.cardOpacity < 0.02}>
          <p className="shaft-card-text">{frame.cardText}</p>
          {frame.stamp !== 'none' && <span key={frame.cardText} className={'shaft-stamp' + (reducedMotion ? '' : ' shaft-stamp-impulse')}>{SHAFT_STAMP_TEXT}</span>}
        </div>
      </div>}
      {frame.attribution && <p className="shaft-attribution" data-shaft-attribution="">{SHAFT_ATTRIBUTION_TEXT}</p>}
      {frame.remainingTeeth && <p className="shaft-caption shaft-caption-recap" data-shaft-recap="">{SHAFT_RECAP_CAPTION_TEXT}</p>}
    </div>
    <FosPanels frame={frame} fos={fos} />
    <p role="status" aria-live="polite" className="shaft-visually-hidden" data-shaft-status="" data-version={status.version}>{status.text}</p>
    <div className="shaft-visually-hidden" data-shaft-transcript="">
      <h2>P001835 Input Shaft manufacturing study transcript</h2>
      {SHAFT_TRANSCRIPT.map(section => <section key={section.heading}>
        <h3>{section.heading}</h3>
        <p>{section.body}</p>
      </section>)}
    </div>
  </div>
}
