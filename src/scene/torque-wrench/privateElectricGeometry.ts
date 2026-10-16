import { BufferGeometry, Float32BufferAttribute } from 'three'

/** Private copy of the actual shard seams. Growth follows connected junctions from
 * the enclosing contour, instead of restarting a mechanical sweep on every chain.
 * The cached bake, fragment partition and aperture mask remain immutable.
 */
export function makePrivateCrackGeometry(source: BufferGeometry, outline: number[][]): BufferGeometry {
  const geometry = source.clone()
  const p = geometry.getAttribute('position'), ids = geometry.getAttribute('crackId')
  if (!p || !outline.length) return geometry
  const points: Array<{ x: number; y: number; links: Map<number, number>; distance: number }> = []
  const map = new Map<string, number>(), pairs: number[] = []
  for (let i = 0; i + 1 < p.count; i += 2) {
    const x = (p.getX(i) + p.getX(i + 1)) / 2, y = (p.getY(i) + p.getY(i + 1)) / 2
    const key = `${Math.round(x * 2e5)},${Math.round(y * 2e5)}`
    let id = map.get(key)
    if (id === undefined) { id = points.length; map.set(key, id); points.push({ x, y, links: new Map(), distance: Infinity }) }
    pairs.push(id)
    if (i && (!ids || ids.getX(i) === ids.getX(i - 2))) {
      const prev = pairs[pairs.length - 2], a = points[prev], b = points[id]
      const length = Math.hypot(a.x - b.x, a.y - b.y)
      if (length < .012) { a.links.set(id, length); b.links.set(prev, length) }
    }
  }
  // A spatial index keeps the one-time registration linear in contour size.
  const pitch = .003, buckets = new Map<string, number[][]>()
  for (const v of outline) {
    const key = `${Math.floor(v[0] / pitch)},${Math.floor(v[1] / pitch)}`
    const bucket = buckets.get(key) ?? []; bucket.push(v); buckets.set(key, bucket)
  }
  const queue: Array<[number, number]> = []
  const push = (id: number, distance: number) => {
    queue.push([id, distance]); let i = queue.length - 1
    while (i > 0) { const parent = (i - 1) >> 1; if (queue[parent][1] <= distance) break
      queue[i] = queue[parent]; i = parent }
    queue[i] = [id, distance]
  }
  for (let i = 0; i < points.length; i++) {
    const a = points[i], gx = Math.floor(a.x / pitch), gy = Math.floor(a.y / pitch)
    let nearest = Infinity
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const b of buckets.get(`${gx + dx},${gy + dy}`) ?? []) nearest = Math.min(nearest, Math.hypot(a.x - b[0], a.y - b[1]))
    }
    if (nearest < .0018) { a.distance = nearest; push(i, nearest) }
  }
  while (queue.length) {
    const [id, distance] = queue[0], last = queue.pop()!
    if (queue.length) {
      let i = 0
      while (2 * i + 1 < queue.length) {
        let child = 2 * i + 1
        if (child + 1 < queue.length && queue[child + 1][1] < queue[child][1]) child++
        if (last[1] <= queue[child][1]) break
        queue[i] = queue[child]; i = child
      }
      queue[i] = last
    }
    if (distance !== points[id].distance) continue
    for (const [next, length] of points[id].links) {
      const arrival = distance + length
      if (arrival < points[next].distance) { points[next].distance = arrival; push(next, arrival) }
    }
  }
  let max = .001
  for (const a of points) if (Number.isFinite(a.distance)) max = Math.max(max, a.distance)
  const growth = new Float32Array(p.count)
  for (let i = 0; i < pairs.length; i++) {
    const a = points[pairs[i]]
    const value = Number.isFinite(a.distance) ? a.distance / max : .45 + .45 * (.5 + .5 * Math.sin(a.x * 79 + a.y * 113))
    growth[i * 2] = growth[i * 2 + 1] = Math.min(.99, .025 + .95 * value)
  }
  geometry.setAttribute('arcLength', new Float32BufferAttribute(growth, 1))
  return geometry
}
