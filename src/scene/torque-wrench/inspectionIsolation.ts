import { createJourneySample, sampleJourney, type JourneySample } from './JourneyDirector'

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
  host?: JourneySample,
): InspectionIsolationSample {
  const effectiveProgress = manual ? studyProgress : progress
  const surroundingsOpacity = manual ? 0 : (host ?? sampleJourney(progress, true, scratch)).surroundingsOpacity
  out.progress = effectiveProgress
  out.surroundingsOpacity = surroundingsOpacity
  out.manual = manual
  return out
}

const scratch = createJourneySample()
