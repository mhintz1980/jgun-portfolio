import { BULLET_TIME_SHOT_SPECS } from './bulletTime'
const smooth = (x: number) => { const u = Math.max(0,Math.min(1,x)); return u*u*(3-2*u) }
export function createShatterAtmosphere() { return { strength: 0, phase: 0 } }
export function sampleShatterAtmosphere(p: number, out: ReturnType<typeof createShatterAtmosphere>) {
  const [a,b]=BULLET_TIME_SHOT_SPECS.shatter.window
  out.phase=Math.max(0,Math.min(1,(p-a)/(b-a))) * Math.PI * 2
  out.strength=smooth((p-.423)/.007)*(1-smooth((p-.452)/.012))
  return out
}
