import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TorquePreloader, getPreloaderProgressColor, getPreloaderGlow } from './TorquePreloader'

describe('TorquePreloader', () => {
  describe('Color transition between orange and blue around halfway', () => {
    it('returns orange (#f0703a) in the first half below 0.42', () => {
      expect(getPreloaderProgressColor(0)).toBe('#f0703a')
      expect(getPreloaderProgressColor(0.25)).toBe('#f0703a')
      expect(getPreloaderProgressColor(0.4)).toBe('#f0703a')
      expect(getPreloaderProgressColor(0.42)).toBe('#f0703a')
    })

    it('returns sky blue (#38bdf8) in the second half above 0.58', () => {
      expect(getPreloaderProgressColor(0.58)).toBe('#38bdf8')
      expect(getPreloaderProgressColor(0.75)).toBe('#38bdf8')
      expect(getPreloaderProgressColor(1.0)).toBe('#38bdf8')
    })

    it('interpolates smoothly between orange and blue around 0.50', () => {
      const mid = getPreloaderProgressColor(0.5)
      expect(mid).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/)
      // At 50%, red should be less than 240 and more than 56; blue should be more than 58 and less than 248
      const match = mid.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
      expect(match).not.toBeNull()
      if (match) {
        const [, r, g, b] = match.map(Number)
        expect(r).toBeLessThan(240)
        expect(r).toBeGreaterThan(56)
        expect(g).toBeGreaterThan(112)
        expect(b).toBeGreaterThan(58)
        expect(b).toBeLessThan(248)
      }
    })

    it('shifts text shadow glow between warm orange and cyan glow around halfway', () => {
      expect(getPreloaderGlow(0.2)).toContain('rgba(240, 112, 58')
      expect(getPreloaderGlow(0.8)).toContain('rgba(56, 189, 248')
    })
  })

  describe('Markup and Identity Structure', () => {
    it('renders the "Plus" identity and metrology reticle structure', () => {
      const markup = renderToStaticMarkup(<TorquePreloader />)

      // Brand Identity
      expect(markup).toContain('MARK HINTZ //')
      expect(markup).toContain('MECHANICAL DESIGNER')
      expect(markup).toContain('torque-preloader-plus-badge')
      expect(markup).toContain('SYSTEMS ARCHITECT')
      expect(markup).toContain('THE PLUS IN CAD EXECUTION')

      // Center Gauge & Plus
      expect(markup).toContain('torque-preloader-gauge-box')
      expect(markup).toContain('torque-preloader-plus-icon')
      expect(markup).toContain('+')
      expect(markup).toContain('torque-preloader-number')
      expect(markup).toContain('000')
      expect(markup).toContain('PERCENT')

      // Telemetry & Ticker
      expect(markup).toContain('torque-preloader-status')
      expect(markup).toContain('20+ YRS PRECISION MACHINING // 5-AXIS GEOMETRY')
      expect(markup).toContain('torque-preloader-bar-fill')

      // Footer
      expect(markup).toContain('PHYSICAL TOOLING MEETS WEB-NATIVE 3D')
      expect(markup).toContain('CALIBRATING D1-AP VELLUM &amp; CAMERA')
    })
  })
})
