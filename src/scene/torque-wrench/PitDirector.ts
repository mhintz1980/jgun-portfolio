export function samplePit(t: number, fracture: number) {
  if (!Number.isFinite(t) || !Number.isFinite(fracture)) throw new RangeError('Pit inputs must be finite')
  const reveal = Math.max(0, Math.min(1, fracture))
  return { reveal, visible: reveal > 0, depthM: 3.2 }
}
