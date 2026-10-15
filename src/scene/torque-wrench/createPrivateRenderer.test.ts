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
})
