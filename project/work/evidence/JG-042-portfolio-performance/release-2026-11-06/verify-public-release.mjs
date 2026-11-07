// One-off release evidence: compare served bytes with the approved retained artifact.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const i = arg.indexOf('=')
  return [arg.slice(2, i), arg.slice(i + 1)]
}))
if (!args.base || !args.identity || !args.out) throw new Error('Require --base, --identity and --out')
const identity = JSON.parse(readFileSync(args.identity, 'utf8'))
const inventory = new Map(identity.files.map(file => [file.path, file]))
const hash = value => createHash('sha256').update(value).digest('hex')
const report = { base: args.base, source: identity.source,
  artifact: identity.artifactManifestSha256, startedAt: new Date().toISOString(), rows: [] }
const jobs = [
  ...['home', 'torque-wrench', 'quiet-machine', 'armament'].map(route => ({
    url: `/${route}/`, file: `${route}/index.html`, status: 200,
  })),
  { url: '/', file: 'index.html', status: 200 },
  ...identity.files.filter(file => /^(assets\/.*\.(js|css)|models\/|draco\/)/.test(file.path)
    || ['favicon.svg', 'og-image.png', 'robots.txt'].includes(file.path)).map(file => ({
      url: `/${file.path}`, file: file.path, status: 200,
    })),
  ...['/jg042-release-missing-page', '/models/m249-transformed.glb',
    '/fonts/gentilis_bold.typeface.json',
    '/video/studiomark-showcase-precision-revealed-poster.jpg',
    '/video/studiomark-showcase-precision-revealed.mp4',
    '/video/studiomark-showcase-precision-revealed.webm'].map(url => ({ url, status: 404 })),
]
let cursor = 0
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++]
    const row = { path: job.url }
    report.rows.push(row)
    try {
      const response = await fetch(new URL(job.url, args.base), {
        headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(60000),
      })
      const body = Buffer.from(await response.arrayBuffer())
      Object.assign(row, { status: response.status, finalUrl: response.url, bytes: body.length,
        sha256: hash(body), contentType: response.headers.get('content-type'),
        cacheControl: response.headers.get('cache-control'),
        nosniff: response.headers.get('x-content-type-options') })
      const errors = []
      if (row.status !== job.status) errors.push(`expected HTTP ${job.status}`)
      if (job.file && row.sha256 !== inventory.get(job.file)?.sha256) errors.push('artifact hash mismatch')
      if (job.url === '/jg042-release-missing-page'
        && row.sha256 !== inventory.get('404.html')?.sha256) errors.push('404 document mismatch')
      if (job.url.startsWith('/assets/') && !/max-age=31536000/.test(row.cacheControl ?? '')) errors.push('hashed cache lifetime absent')
      if (job.url.startsWith('/assets/') && !/immutable/.test(row.cacheControl ?? '')) errors.push('hashed immutable absent')
      if (job.url.startsWith('/models/') && job.status === 200
        && (!/max-age=86400/.test(row.cacheControl ?? '') || /immutable/.test(row.cacheControl ?? ''))) errors.push('named model cache policy mismatch')
      if (job.status === 200 && row.nosniff !== 'nosniff') errors.push('nosniff absent')
      Object.assign(row, { errors, result: errors.length ? 'FAIL' : 'PASS' })
    } catch (error) {
      Object.assign(row, { errors: [String(error)], result: 'FAIL' })
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker))
report.endedAt = new Date().toISOString()
report.passed = report.rows.filter(row => row.result === 'PASS').length
report.result = report.passed === jobs.length ? 'PASS' : 'FAIL'
writeFileSync(args.out, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ base: report.base, result: report.result,
  passed: report.passed, total: jobs.length, failures: report.rows.filter(row => row.result === 'FAIL') }))
if (report.result !== 'PASS') process.exitCode = 1
