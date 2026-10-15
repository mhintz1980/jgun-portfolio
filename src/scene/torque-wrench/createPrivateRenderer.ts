import type { CanvasProps } from '@react-three/fiber'
import { _roots } from '@react-three/fiber'
import { WebGLRenderer, type WebGLRendererParameters } from 'three'

type RendererDefaults = Parameters<Extract<NonNullable<CanvasProps['gl']>, (defaults: never) => unknown>>[0]

/** R3F Canvas does not catch configure() rejection before mounting its error boundary. */
export function createPrivateRenderer(onFailure: (error: unknown) => void) {
  let cancelled: Promise<WebGLRenderer> | null = null
  return async (defaults: RendererDefaults): Promise<WebGLRenderer> => {
    if (cancelled) return cancelled
    try {
      return new WebGLRenderer({ ...defaults, antialias: true, alpha: true, powerPreference: 'high-performance' } as WebGLRendererParameters)
    } catch (error) {
      cancelled = new Promise<WebGLRenderer>(() => {})
      // configure() has not initialized a scene/renderer. R3F's normal null-scene
      // disposal throws before deleting this entry, so release that inert root here.
      _roots.delete(defaults.canvas)
      onFailure(error)
      // Failure is terminal: the page unmounts Canvas and R3F releases its root. Do not
      // resolve with a fake renderer or reject its unhandled configure() continuation.
      // This cancellation promise owns no timers, listeners, or GPU resources.
      return cancelled
    }
  }
}
