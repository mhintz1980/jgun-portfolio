import { afterEach, describe, expect, it, vi } from 'vitest'
import { deriveHardwareGl, torquePerformanceObserverInit } from './torque-performance-observers.mjs'

afterEach(() => vi.unstubAllGlobals())

describe('performance observer actual wrapped WebGL entry points', () => {
  it.each([0, 7])('counts indexed instances independently of byte offset, including %s instances', instances => {
    const callbacks: Array<(time: number) => void> = []
    class FakeGL {
      TRIANGLES = 4; LINES = 1; POINTS = 0; TEXTURE0 = 33984
      drawingBufferWidth = 1440; drawingBufferHeight = 900
      getContextAttributes() { return { antialias: true } }
      getExtension() { return null }
      getParameter() { return 'WebKit WebGL' }
      drawElementsInstanced(_mode: number, _count: number, _type: number, _offset: number, _instances: number) {}
    }
    const gl = new FakeGL()
    class FakeCanvas {
      tagName = 'CANVAS'; width = 1440; height = 900; isConnected = true
      getContext(_type?: string) { return gl }
      closest() { return { getAttribute: () => 'live' } }
    }
    const canvas = new FakeCanvas()
    const win = { HTMLCanvasElement: FakeCanvas } as Record<string, any>
    vi.stubGlobal('window', win)
    vi.stubGlobal('document', { hidden: false, addEventListener() {}, querySelector: () => canvas })
    vi.stubGlobal('navigator', { userAgent: 'fixture', platform: 'fixture' })
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => { callbacks.push(callback) })
    torquePerformanceObserverInit()
    canvas.getContext('webgl2')
    const observer = win.__torquePerformanceObserver
    observer.beginMeasurement()
    // WebGL signature is mode, index count, index type, BYTE OFFSET, INSTANCE COUNT.
    gl.drawElementsInstanced(gl.TRIANGLES, 6, 5123, 96, instances)
    callbacks.shift()!(100)
    const measured = observer.finishMeasurement()
    expect(measured.frameSamples[0].triangles).toBe(2 * instances)
    expect(measured.frameSamples[0].calls).toBe(1)
    expect(observer.snapshot().environment.webglRenderer).toBeNull()
  })

  it('requires actual unmasked identity and rejects software and generic masked strings', () => {
    for (const value of [null, '', 'WebKit WebGL', 'WebGL', 'SwiftShader software renderer']) {
      expect(deriveHardwareGl(value).hardwareGL).toBe(false)
    }
    expect(deriveHardwareGl('ANGLE (AMD, AMD Radeon 780M Graphics, D3D11)').hardwareGL).toBe(true)
  })
})
