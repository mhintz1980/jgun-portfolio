import { sampleInspectionSurroundings } from './InspectionDirector'

export interface InspectionIsolationSample {
  progress: number
  surroundingsOpacity: number
  manual: boolean
}

export function createInspectionIsolationSample(): InspectionIsolationSample {
  return { progress: 0, surroundingsOpacity: 1, manual: false }
}

/** RuntimeWorld writes after playback advances at priority -2; BackgroundWorld reads at 1. */
export function sampleInspectionIsolation(
  progress: number,
  manual: boolean,
  studyProgress: number,
  out: InspectionIsolationSample,
): InspectionIsolationSample {
  const effectiveProgress = manual ? studyProgress : progress
  const surroundingsOpacity = sampleInspectionSurroundings(effectiveProgress)
  out.progress = effectiveProgress
  out.surroundingsOpacity = surroundingsOpacity
  out.manual = manual
  return out
}
