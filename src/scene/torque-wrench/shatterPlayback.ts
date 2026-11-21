import { BULLET_TIME_SHOT_SPECS } from './bulletTime'

export const SHATTER_PLAYBACK_SECONDS = 7.2
const [START, END] = BULLET_TIME_SHOT_SPECS.shatter.window

/** Wall time controls scroll only. All camera/subject samplers remain functions of p. */
export function createShatterPlayback() {
  let active = false, armed = true, previous = Number.NaN, elapsed = 0
  let progress = START
  return {
    get active() { return active },
    get elapsed() { return elapsed },
    cancel() { active = false; armed = false },
    update(current: number, delta: number, intent: boolean, freeLook: boolean): number | null {
      if (!Number.isFinite(current)) return null
      // Moving back before the rupture deliberately rearms the next forward viewing.
      if (current < START - .002) armed = true
      if (freeLook) { active = false; armed = false }
      if (!active && !freeLook && armed && intent && Number.isFinite(previous)
        && previous < START && current >= START && current < .46) {
        active = true; armed = false; elapsed = 0; progress = START
      } else if (active) {
        // Hidden-tab and long-frame time is excluded by the browser adapter.
        elapsed = Math.min(SHATTER_PLAYBACK_SECONDS, elapsed + Math.max(0, Math.min(.1, delta)))
        const u = elapsed / SHATTER_PLAYBACK_SECONDS
        // Short, smooth speed shoulders around an otherwise constant-speed sweep.
        const r = .1, h = 1 / (1 - r)
        const a = u < r ? h * u * u / (2 * r) : u <= 1 - r
          ? h * (u - r / 2) : 1 - h * (1 - u) * (1 - u) / (2 * r)
        progress = START + (END - START) * a
        if (elapsed >= SHATTER_PLAYBACK_SECONDS) active = false
      } else { previous = current; return null }
      previous = progress
      return progress
    },
  }
}
