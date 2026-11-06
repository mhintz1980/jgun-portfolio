import { createHash, randomUUID } from 'node:crypto'
export const ROUTES = Object.freeze({ home: '/home/', torque: '/torque-wrench/', quiet: '/quiet-machine/' })
export const PROFILES = Object.freeze({
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
  narrow: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
})
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export function validateIdentity(identity, route) {
  for (const [key, length] of [['source', 40], ['lockSha256', 64], ['artifactManifestSha256', 64]]) {
    if (!new RegExp(`^[a-f0-9]{${length}}$`).test(identity?.[key])) throw new Error(`Missing/invalid identity ${key}`)
  }
  const row = identity.routes?.[route]
  if (!Object.hasOwn(ROUTES, route) || row?.path !== ROUTES[route] || !/^\/assets\/[\w-]+\.js$/.test(row?.entry ?? '')) throw new Error('Unknown route or missing entry identity')
  if (route !== 'home' && !/^\/assets\/[\w-]+\.js$/.test(row.scene ?? '')) throw new Error('Missing scene identity')
  for (const file of [row.path.slice(1) + 'index.html', row.entry.slice(1), ...(row.scene ? [row.scene.slice(1)] : [])]) {
    if (!identity.files?.some(f => f.path === file && /^[a-f0-9]{64}$/.test(f.sha256))) throw new Error(`Missing byte identity ${file}`)
  }
  return row
}
export function assertRoute(url, route) {
  if (new URL(url).pathname !== ROUTES[route]) throw new Error(`Route fallback/mismatch: ${url}`)
}
export function windowTasks(tasks, start, end) {
  return tasks.reduce((result, task) => {
    const overlap = Math.max(0, Math.min(end, task.start + task.duration) - Math.max(start, task.start))
    if (overlap > 0) { result.count++; result.durationMs += overlap }
    return result
  }, { count: 0, durationMs: 0 })
}
export function parseOptions(argv) {
  const args = { profiles: 'desktop,narrow', routes: 'home,torque,quiet', pairs: '5', 'ready-timeout': '60000', 'window-ms': '1500' }
  for (const arg of argv) {
    const m = /^--(base|identity|out|profiles|routes|pairs|ready-timeout|window-ms)=(.+)$/.exec(arg)
    if (!m) throw new Error(`Unknown/missing option: ${arg}`)
    args[m[1]] = m[2]
  }
  for (const key of ['base', 'identity', 'out']) if (!args[key]) throw new Error(`--${key} required`)
  const base = new URL(args.base)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('--base must be an origin')
  args.profiles = args.profiles.split(',')
  args.routes = args.routes.split(',')
  for (const p of args.profiles) if (!Object.hasOwn(PROFILES, p)) throw new Error(`Unknown profile ${p}`)
  for (const r of args.routes) if (!Object.hasOwn(ROUTES, r)) throw new Error(`Unknown route ${r}`)
  for (const key of ['pairs', 'ready-timeout', 'window-ms']) {
    args[key] = Number(args[key])
    if (!Number.isInteger(args[key]) || args[key] < 1) throw new Error(`Invalid ${key}`)
  }
  if (args.pairs > 20 || args['window-ms'] < 500 || args['window-ms'] > 30000 || args['ready-timeout'] > 120000) throw new Error('Sampling options outside bounded limits')
  return args
}
// Each repeat follows its own measured cold navigation inside exactly the same context.
// Closing the page between navigations preserves HTTP cache while resetting application state.
export async function runPair(browser, profile, sample) {
  const context = await browser.newContext(PROFILES[profile])
  const pairId = randomUUID()
  try {
    const cold = await sample(context, { pairId, kind: 'cold', cacheState: 'fresh-context' })
    const repeat = await sample(context, { pairId, kind: 'repeat', cacheState: 'same-context-after-measured-cold' })
    return [cold, repeat]
  } finally { await context.close() }
}
