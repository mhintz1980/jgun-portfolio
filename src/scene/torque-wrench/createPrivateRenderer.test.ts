import { describe, expect, it, vi } from 'vitest'
import { WebGLRenderer } from 'three'
import { _roots } from '@react-three/fiber'
import { createPrivateRenderer } from './createPrivateRenderer'

vi.mock('three', () => ({ WebGLRenderer: vi.fn() }))

describe('private renderer construction', () => {
  it('returns the renderer configured for the actual Canvas', async () => {
    const renderer = { isWebGLRenderer: true }
    vi.mocked(WebGLRenderer).mockImplementationOnce(function () { return renderer as unknown as WebGLRenderer })
    const canvas = {} as HTMLCanvasElement
    const fail = vi.fn()
    expect(await createPrivateRenderer(fail)({ canvas })).toBe(renderer)
    expect(WebGLRenderer).toHaveBeenLastCalledWith({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    expect(fail).not.toHaveBeenCalled()
  })

  it('hands construction failure to terminal fallback without rejecting or retrying', async () => {
    const error = new Error('Error creating WebGL context')
    vi.mocked(WebGLRenderer).mockImplementationOnce(function () { throw error })
    const fail = vi.fn()
    const settled = vi.fn()
    const calls = vi.mocked(WebGLRenderer).mock.calls.length
    const canvas = {} as HTMLCanvasElement
    _roots.set(canvas, {} as never)
    const factory = createPrivateRenderer(fail)
    void factory({ canvas }).then(settled, settled)
    void factory({ canvas }).then(settled, settled)
    await Promise.resolve()
    await Promise.resolve()
    expect(fail).toHaveBeenCalledExactlyOnceWith(error)
    expect(settled).not.toHaveBeenCalled()
    expect(WebGLRenderer).toHaveBeenCalledTimes(calls + 1)
    expect(_roots.has(canvas)).toBe(false)
  })

  it('caps the first and resized buffers atomically before R3F can allocate an oversized canvas', async () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 })
    try {
      const canvas = { width: 0, height: 0, style: { width: '', height: '' } }
      const originalSize = vi.fn()
      const allocate = vi.fn((width: number, height: number, dpr: number) => {
        canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr)
      })
      const renderer = { domElement: canvas, setSize: originalSize, setDrawingBufferSize: allocate }
      vi.mocked(WebGLRenderer).mockImplementationOnce(function () { return renderer as unknown as WebGLRenderer })
      const result = await createPrivateRenderer(vi.fn(), () => 'full')({ canvas: canvas as unknown as HTMLCanvasElement })
      for (const [width, height] of [[2560, 1440], [3840, 2160], [390, 844]]) {
        result.setSize(width, height)
        expect(canvas.width * canvas.height).toBeLessThanOrEqual(2560 * 1440)
        expect(canvas.width).toBeGreaterThan(0)
        expect(canvas.height).toBeGreaterThan(0)
        expect(canvas.style.width).toBe(`${width}px`)
      }
      expect(originalSize).not.toHaveBeenCalled()
      expect(allocate).toHaveBeenCalledTimes(3)
    } finally { vi.unstubAllGlobals() }
  })
})
