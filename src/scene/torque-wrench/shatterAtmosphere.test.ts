import { expect, it } from 'vitest'
import { createShatterAtmosphere, sampleShatterAtmosphere } from './shatterAtmosphere'
it('keeps depth cues outside the intact room and replays their full orbit exactly', () => {
  const s=createShatterAtmosphere()
  for(const p of [0,.3,.42,.465,.8,1]) expect(sampleShatterAtmosphere(p,s).strength).toBe(0)
  expect(sampleShatterAtmosphere(.44,s).strength).toBe(1)
  const saved={...s}; sampleShatterAtmosphere(.45,s); sampleShatterAtmosphere(.44,s)
  expect(s).toEqual(saved)
  expect(sampleShatterAtmosphere(.43,s).phase).toBe(0)
  expect(sampleShatterAtmosphere(.452,s).phase).toBeCloseTo(2*Math.PI,12)
})
