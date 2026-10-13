/** Explicit user playback overrides the study alone; native page scroll is untouched. */
export interface InspectionPlayback {
  snapshot(): { open: boolean; playing: boolean; progress: number }
  isOpen(): boolean
  open(): void
  close(): void
  play(): void
  pause(): void
  seek(progress: number): void
  advance(delta: number, visible: boolean): number
}

export function createInspectionPlayback(): InspectionPlayback {
  let open = false, playing = false, progress = 0
  return {
    snapshot: () => ({ open, playing, progress }),
    isOpen: () => open,
    open() { open = true; playing = false; progress = 0 },
    close() { open = false; playing = false },
    play() { if (open) { if (progress === 1) progress = 0; playing = true } },
    pause() { playing = false },
    seek(value) {
      if (!Number.isFinite(value)) throw new RangeError('Inspection seek must be finite')
      progress = Math.max(0, Math.min(1, value)); playing = false
    },
    advance(delta, visible) {
      if (open && playing && visible && Number.isFinite(delta) && delta > 0) {
        progress = Math.min(1, progress + Math.min(delta, 0.1) / 43)
        if (progress === 1) playing = false
      }
      return progress
    },
  }
}
