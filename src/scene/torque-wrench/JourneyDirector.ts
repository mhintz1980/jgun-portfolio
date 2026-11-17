/** Private host policy. The accepted inspection and mechanism clocks stay unchanged. */
import { sampleInspectionSurroundings, subjectTimeAt } from './InspectionDirector'
export const quintic = (u: number) => {
  const t = Math.max(0, Math.min(1, u))
  return t * t * t * (10 + t * (-15 + 6 * t))
}
export interface JourneySample {
  requestedProgress: number
  effectiveProgress: number
  phase: string
  pending: boolean
  inspectionProgress: number
  mechanismProgress: number
  surroundingsOpacity: number
  sourceShaftOpacity: number
  sourceShaftLook: number
  studyVisible: boolean
  contextOpacity: number
  phaseCorrection: number
  preload: boolean
}
export function createJourneySample(): JourneySample {
  return {
    requestedProgress: 0,
    effectiveProgress: 0,
    phase: 'prefix',
    pending: false,
    inspectionProgress: 0.735,
    mechanismProgress: 0,
    surroundingsOpacity: 1,
    sourceShaftOpacity: 1,
    sourceShaftLook: 0,
    studyVisible: false,
    contextOpacity: 1,
    phaseCorrection: 0,
    preload: false,
  }
}
export function sampleJourney(request: number, ready: boolean, out: JourneySample): JourneySample {
  if (!Number.isFinite(request)) throw new RangeError('Journey progress must be finite')
  const requested = Math.max(0, Math.min(1, request))
  const pending = !ready && requested >= 0.62 && requested < 0.845
  const p = pending ? 0.6 : requested
  out.requestedProgress = requested
  out.effectiveProgress = p
  out.pending = pending
  out.preload = requested >= 0.52
  out.mechanismProgress =
    p <= 0.56 ? p : p <= 0.855 ? 0.56 : p < 0.93 ? Math.min(0.735, 0.56 + ((p - 0.855) * 7) / 3) : p < 0.94 ? 0.735 : p
  out.inspectionProgress = 0.735 + Math.max(0, Math.min(0.205, p - 0.62))
  out.studyVisible = p >= 0.62 && p < 0.845
  // Finish one uninterrupted fade as the moving camera passes the isolation pose at .600.
  out.surroundingsOpacity =
    p < 0.56
      ? sampleInspectionSurroundings(p)
      : p < 0.585
        ? 1
        : p < 0.6
          ? 1 - quintic((p - 0.585) / 0.015)
          : p < 0.62
            ? 0
            : p < 0.845
              ? quintic((subjectTimeAt(out.inspectionProgress) - 65.4) / 1.5)
              : 1
  out.sourceShaftOpacity = out.studyVisible ? 0 : p >= 0.585 && p < 0.855 ? 1 : out.surroundingsOpacity
  // Keep the real drivetrain until the source takes over at .845; only its exterior fades in.
  out.contextOpacity = 1
  // 0 = the source's black finish, 1 = the study steel; C0 at .60/.62/.845/.855, hidden-but-held in between.
  out.sourceShaftLook =
    p < 0.6 ? 0 : p < 0.62 ? quintic((p - 0.6) / 0.02) : p < 0.845 ? 1 : p < 0.855 ? 1 - quintic((p - 0.845) / 0.01) : 0
  out.phaseCorrection = quintic((p - 0.825) / 0.02)
  out.phase =
    p < 0.56
      ? 'prefix'
      : p < 0.585
        ? 'approach'
        : p < 0.6
          ? 'isolate'
          : p < 0.62
            ? 'entry'
            : p <= 0.825
              ? 'shaft'
              : p < 0.83
                ? 'retire-context'
                : p < 0.845
                  ? 'return'
                  : p < 0.855
                    ? 'restore'
                    : p < 0.93
                      ? 'explode'
                      : p < 0.94
                        ? 'exploded-hold'
                        : 'close'
  return out
}
