import type { WrenchMechanicsFrame } from '../rig/wrenchMechanics'

const smooth = (value: number) => {
  const u = Math.max(0, Math.min(1, value))
  return u * u * (3 - 2 * u)
}

export interface MechanismSample extends WrenchMechanicsFrame {
  ghostOpacity: number
}

/** Continuous channels spanning beats; canonical sampling has no idle clock. */
export function sampleMechanism(progress: number, out: MechanismSample): MechanismSample {
  if (!Number.isFinite(progress)) throw new RangeError('Mechanism progress must be finite')
  const p = Math.max(0, Math.min(1, progress))
  const close = 1 - smooth((p - 0.94) / 0.04)
  out.shift = smooth((p - 0.46) / 0.055) * close
  out.explode = smooth((p - 0.575) / 0.075) * close
  out.gearAngle = Math.PI * 8 * smooth((p - 0.52) / 0.17) * close
  out.idle = 0
  const ghost = smooth((p - 0.52) / 0.035) * (1 - smooth((p - 0.64) / 0.03))
  out.ghostOpacity = 1 - ghost * 0.85
  return out
}
