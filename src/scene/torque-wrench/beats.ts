/** Pure narrative metadata. These coordinates are neither legacy GSAP units nor pixels. */
export const TORQUE_SCROLL_VIEWPORTS = 44.1

export const TORQUE_STORY_CHAPTER_IDS = Object.freeze([
  'drafting', 'breakthrough', 'mechanism', 'inspection', 'close',
] as const)

export type TorqueStoryChapterId = (typeof TORQUE_STORY_CHAPTER_IDS)[number]

// Open identifiers let injected directors introduce camera/scene vocabulary without spine edits.
export type TorqueCameraId =
  | 'registered' | 'rake' | 'emergence' | 'mechanism' | 'inspection' | 'close'
  | (string & {})
export type TorqueSceneId =
  | 'drawing' | 'breakthrough' | 'pit' | 'mechanism' | 'inspection' | 'close'
  | (string & {})
export type TorqueDirectorId =
  | 'opening' | 'pit' | 'mechanism' | 'inspection' | 'close'
  | (string & {})

export interface TorqueWrenchBeat {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly title?: string
  readonly copy?: string
  readonly camera: TorqueCameraId
  readonly scene: TorqueSceneId
  readonly director: TorqueDirectorId
  readonly interaction?: 'none' | 'inspect' | 'bullet-time'
  readonly poster?: string
}

/**
 * Explanatory motion: close reading -> anticipation -> short impact -> mechanism -> inspection.
 * Reading holds are explicit beats, not wall-clock timers. Directors will author continuous poses
 * across these boundaries in Stage 3; this inventory alone implements no CAD or effects.
 * Poster associations preserve the five existing semantic chapters for the static equivalent.
 * The provisional physical track above can change without changing any narrative coordinate.
 */
const beatData: TorqueWrenchBeat[] = [
  { id: 'drafting-detail', start: 0, end: 0.06, title: 'Read the detail', copy: 'Begin close to the registered drawing and its engineering detail.', camera: 'rake', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'drafting-authorship', start: 0.06, end: 0.105, title: 'The title block', copy: 'Hold on Mark Hintz, Digital Systems Architect, and the career block.', camera: 'registered', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'drafting-input-note', start: 0.105, end: 0.15, title: 'Read the input-shaft note', copy: 'Read the handwritten annotation beside Detail B and P001835.', camera: 'registered', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'drafting-output-note', start: 0.15, end: 0.195, title: 'Read the output note', copy: 'Give the second owner annotation its own reading hold.', camera: 'registered', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'drafting-rake', start: 0.195, end: 0.265, title: 'Across the sheet', copy: 'Travel across the oversized opaque sheet toward the side elevation.', camera: 'rake', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'drafting-registered', start: 0.265, end: 0.32, title: 'Registered drawing', copy: 'Settle square to the intact drawing before the light changes.', camera: 'registered', scene: 'drawing', director: 'opening', poster: 'drafting' },
  { id: 'breakthrough-anticipation', start: 0.32, end: 0.36, title: 'The light falters', copy: 'Keep the drawing legible through the failures and dark anticipation.', camera: 'registered', scene: 'breakthrough', director: 'opening', poster: 'breakthrough' },
  { id: 'breakthrough-trace', start: 0.36, end: 0.395, title: 'A blue profile', copy: 'The branching electrical score traces the tool across the opaque sheet; pit depth remains occluded until rupture.', camera: 'registered', scene: 'breakthrough', director: 'pit', poster: 'breakthrough' },
  { id: 'breakthrough-pressure', start: 0.395, end: 0.42, title: 'Pressure from below', copy: 'The already illuminated wrench pushes up against opaque paper.', camera: 'registered', scene: 'breakthrough', director: 'opening', poster: 'breakthrough' },
  { id: 'breakthrough-rupture', start: 0.42, end: 0.435, title: 'The sheet fractures', copy: 'The first rupture reveals the wrench that caused it, over deep pit space.', camera: 'registered', scene: 'breakthrough', director: 'opening', poster: 'breakthrough' },
  { id: 'breakthrough-emergence', start: 0.435, end: 0.46, title: 'Continuous emergence', copy: 'Continue the rise through the torn profile and establish the wrench above the pit.', camera: 'emergence', scene: 'pit', director: 'opening', poster: 'breakthrough' },
  { id: 'mechanism-switch', start: 0.46, end: 0.52, title: 'Two-speed clutch', copy: 'Read P003068 and the separate clutch-fork motion.', camera: 'mechanism', scene: 'mechanism', director: 'mechanism', poster: 'mechanism' },
  { id: 'mechanism-driveline', start: 0.52, end: 0.575, title: 'The gear train', copy: 'Follow the reduction through the measured part-keyed driveline.', camera: 'mechanism', scene: 'mechanism', director: 'mechanism', poster: 'mechanism' },
  { id: 'mechanism-extraction', start: 0.575, end: 0.65, title: 'Rearward extraction', copy: 'Separate the internals toward the handle while the output spindle exits the snout.', camera: 'mechanism', scene: 'mechanism', director: 'mechanism', poster: 'mechanism' },
  { id: 'mechanism-exploded-hold', start: 0.65, end: 0.69, title: 'Read the assembly', copy: 'Hold the measured ladder, including A000606 and K000004, for close reading.', camera: 'mechanism', scene: 'mechanism', director: 'mechanism', interaction: 'inspect', poster: 'mechanism' },
  { id: 'inspection-ring', start: 0.69, end: 0.735, title: 'Ring-switch finish', copy: 'Inspect the P003068 machining and black-anodized knurled finish.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'inspect', poster: 'inspection' },
  { id: 'inspection-shaping', start: 0.735, end: 0.795, title: 'Input-shaft shaping', copy: 'Isolate P001835 and establish the button cutter at the relief groove.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'inspect', poster: 'inspection' },
  { id: 'inspection-bullet-time', start: 0.795, end: 0.835, title: 'Around the cutter', copy: 'Nearly stop the subject while the camera moves around the cutting contact.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'bullet-time', poster: 'inspection' },
  { id: 'inspection-materials', start: 0.835, end: 0.87, title: 'Material attempts', copy: 'Read the 4140, 4340, and C300 attempts and the relief-groove result.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'inspect', poster: 'inspection' },
  { id: 'inspection-hobbing', start: 0.87, end: 0.905, title: 'The revised process', copy: 'Follow the blank into hobbing and the revised shaft study.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'inspect', poster: 'inspection' },
  { id: 'inspection-runout', start: 0.905, end: 0.94, title: 'Runout and supports', copy: 'Read the runout hold, repositioned supports, and finished-shaft result.', camera: 'inspection', scene: 'inspection', director: 'inspection', interaction: 'inspect', poster: 'inspection' },
  { id: 'close-settle', start: 0.94, end: 0.98, title: 'The finished wrench', copy: 'Return to the complete wrench above the pit as the electrical light fades.', camera: 'close', scene: 'close', director: 'close', poster: 'close' },
  { id: 'close-ownership', start: 0.98, end: 1, title: 'Ownership and next action', copy: 'Keep the final composition settled while the story hands off to the page links.', camera: 'close', scene: 'close', director: 'close', poster: 'close' },
]

export const TORQUE_BEATS: readonly TorqueWrenchBeat[] = Object.freeze(
  beatData.map((beat) => Object.freeze(beat)),
)
