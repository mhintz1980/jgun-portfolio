/** Private host policy. The accepted inspection and mechanism clocks stay unchanged. */
import { sampleInspectionSurroundings } from './InspectionDirector'
export const quintic = (u: number) => { const t = Math.max(0, Math.min(1, u)); return t*t*t*(10+t*(-15+6*t)) }
export interface JourneySample {
  requestedProgress: number; effectiveProgress: number; phase: string; pending: boolean
  inspectionProgress: number; mechanismProgress: number; surroundingsOpacity: number
  sourceShaftOpacity: number; sourceShaftLook: number; studyVisible: boolean; contextOpacity: number; phaseCorrection: number; preload: boolean
}
export function createJourneySample(): JourneySample {
  return { requestedProgress: 0, effectiveProgress: 0, phase: 'prefix', pending: false,
    inspectionProgress: .735, mechanismProgress: 0, surroundingsOpacity: 1, sourceShaftOpacity: 1, sourceShaftLook: 0,
    studyVisible: false, contextOpacity: 1, phaseCorrection: 0, preload: false }
}
export function sampleJourney(request: number, ready: boolean, out: JourneySample): JourneySample {
  if (!Number.isFinite(request)) throw new RangeError('Journey progress must be finite')
  const requested = Math.max(0, Math.min(1, request))
  const pending = !ready && requested >= .62 && requested < .845
  const p = pending ? .60 : requested
  out.requestedProgress = requested; out.effectiveProgress = p; out.pending = pending
  out.preload = requested >= .52
  out.mechanismProgress = p <= .56 ? p : p <= .855 ? .56 : p < .93 ? Math.min(.735, .56+(p-.855)*7/3) : p < .94 ? .735 : p
  out.inspectionProgress = .735 + Math.max(0, Math.min(.205, p-.62))
  out.studyVisible = p >= .62 && p < .845
  out.surroundingsOpacity = p < .56 ? sampleInspectionSurroundings(p) : p < .585 ? 1
    : p < .590 ? 1-.725*quintic((p-.585)/.005) : p < .596 ? .275 : p < .60 ? .275*(1-quintic((p-.596)/.004)) : p < .845 ? 0 : p < .855 ? quintic((p-.845)/.01) : 1
  out.sourceShaftOpacity = out.studyVisible ? 0 : p >= .585 && p < .855 ? 1 : out.surroundingsOpacity
  out.contextOpacity = 1-quintic((p-.825)/.005)
  // 0 = the source's black finish, 1 = the study steel; C0 at .60/.62/.845/.855, hidden-but-held in between.
  out.sourceShaftLook = p < .60 ? 0 : p < .62 ? quintic((p-.60)/.02) : p < .845 ? 1 : p < .855 ? 1-quintic((p-.845)/.01) : 0
  out.phaseCorrection = quintic((p-.83)/.015)
  out.phase = p < .56 ? 'prefix' : p < .585 ? 'approach' : p < .60 ? 'isolate' : p < .62 ? 'entry'
    : p <= .825 ? 'shaft' : p < .83 ? 'retire-context' : p < .845 ? 'return' : p < .855 ? 'restore'
    : p < .93 ? 'explode' : p < .94 ? 'exploded-hold' : 'close'
  return out
}
