// The StudioMark logo lane. Only the owner-approved bumper may appear in the film.
// Approved in chat 2026-11-08: "Storm Ignition" (committed in b466843e), placed after the Close.
// The film stays silent until the owner supplies music, so the bumper always plays muted.

export const FILM_LOGO = {
  /** Path under the public dir (remotion.config.ts points it at ../public). */
  src: 'video/studiomark-bumper-storm-ignition.mp4',
  /** Length of the bumper file (4.5 s) at the film's 30 fps. */
  frames: 135,
} as const
