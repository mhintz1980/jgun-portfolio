import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import type { TorqueLenisLike } from './conductorRuntime'
import { torqueScrollFraction } from './scrollPacing'
import { createShatterPlayback, SHATTER_PLAYBACK_SECONDS } from './shatterPlayback'

export function installShatterPlayback(store: TorqueWrenchStore) {
  const playback = createShatterPlayback()
  const root = document.querySelector<HTMLElement>('.torque-page')
  let intentUntil = 0, lastTime: number | null = null, stopped: TorqueLenisLike | null = null
  const globals = window as unknown as Record<string, unknown>
  const port = { snapshot: () => ({ active: playback.active, elapsed: playback.elapsed,
    duration: SHATTER_PLAYBACK_SECONDS, progress: store.getProgress() }) }
  globals.__torqueShatterPlayback = port
  const release = () => {
    stopped?.start?.(); stopped = null
    root?.removeAttribute('data-torque-autoplay')
  }
  const eligible = (target: EventTarget | null) => !(target instanceof Element
    && target.closest('input, textarea, select, [contenteditable], [role="dialog"]'))
  const onWheel = (event: WheelEvent) => {
    if (!eligible(event.target)) return
    if (playback.active) { event.preventDefault(); return }
    if (event.deltaY > 0) intentUntil = performance.now() + 1800
    else if (event.deltaY < 0) intentUntil = 0
  }
  let touchY = 0
  const onTouchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0 }
  const onTouchMove = (event: TouchEvent) => {
    if (!eligible(event.target)) return
    if (playback.active) { event.preventDefault(); return }
    const y = event.touches[0]?.clientY ?? touchY
    intentUntil = y < touchY ? performance.now() + 1800 : 0; touchY = y
  }
  const onKey = (event: KeyboardEvent) => {
    if (!eligible(event.target)) return
    if (['f', 'F', 'Escape'].includes(event.key)) {
      if (playback.active) { playback.cancel(); release(); intentUntil = 0 }
      return
    }
    if (['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp', 'Home', 'End'].includes(event.key)) {
      if (playback.active) event.preventDefault()
      else intentUntil = ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey
        ? performance.now() + 1800 : 0
    }
  }
  window.addEventListener('wheel', onWheel, { passive: false, capture: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  window.addEventListener('keydown', onKey)
  return {
    tick(time: number, lenis: TorqueLenisLike) {
      const dt = lastTime === null || document.hidden ? 0 : Math.max(0, time - lastTime)
      lastTime = time
      if (store.getState().tier === 'poster' || store.getState().sceneStatus === 'failed') {
        playback.cancel(); release(); return
      }
      if (document.hidden) return
      const freeLook = root?.dataset.torqueFreelook === 'true'
      const progress = playback.update(store.getProgress(), dt, performance.now() < intentUntil, freeLook)
      if (progress !== null && lenis.scrollTo) {
        if (!stopped) { lenis.stop?.(); stopped = lenis }
        root?.setAttribute('data-torque-autoplay', 'shatter')
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
        lenis.scrollTo(torqueScrollFraction(progress) * max, { immediate: true, force: true })
        // Native pixels quantize the fraction. Deliver the exact authored p after native sync.
        store.setProgress(progress)
      }
      if (!playback.active) release()
    },
    dispose() {
      playback.cancel(); release()
      window.removeEventListener('wheel', onWheel, true)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove, true)
      window.removeEventListener('keydown', onKey)
      if (globals.__torqueShatterPlayback === port) delete globals.__torqueShatterPlayback
    },
  }
}
