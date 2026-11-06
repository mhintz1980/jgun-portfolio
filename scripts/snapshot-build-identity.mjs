// Bind measurements to source, lockfile and every byte of a production artifact.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const match = /^--(build|out)=(.+)$/.exec(arg)
  if (!match) throw new Error(`Unknown argument: ${arg}`)
  return [match[1], match[2]]
}))
if (!args.build || !args.out) throw new Error('Usage: node scripts/snapshot-build-identity.mjs --build=dist --out=identity.json')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const root = process.cwd()
const build = path.resolve(args.build)
const walk = dir => readdirSync(dir).flatMap(name => {
  const file = path.join(dir, name)
  return statSync(file).isDirectory() ? walk(file) : [file]
})
const files = walk(build).map(file => ({ path: path.relative(build, file).replaceAll('\\', '/'),
  bytes: statSync(file).size, sha256: hash(readFileSync(file)) })).sort((a, b) => a.path.localeCompare(b.path, 'en'))
const routes = {}
for (const [key, route] of Object.entries({ home: 'home', torque: 'torque-wrench', quiet: 'quiet-machine' })) {
  const html = readFileSync(path.join(build, route, 'index.html'), 'utf8')
  const entry = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/)?.[1]
  if (!entry) throw new Error(`No entry for ${route}`)
  const script = readFileSync(path.join(build, entry.replace(/^\//, '')), 'utf8')
  const scene = script.match(key === 'quiet' ? /QuietMachineScene-[\w-]+\.js/ : /\bScene-[\w-]+\.js/)?.[0]
  routes[key] = { path: `/${route}/`, entry, ...(scene ? { scene: `/assets/${scene}` } : {}),
    htmlSha256: hash(html), entrySha256: hash(script) }
}
const manifest = {
  schemaVersion: 1, createdAt: new Date().toISOString(),
  source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceStatus: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceDiffSha256: hash(execFileSync('git', ['diff', 'HEAD', '--', '.', ':!project/work/evidence'], { cwd: root })),
  sourceInputs: execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--',
    'src', 'build', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json',
    'index.html', 'home/index.html', 'torque-wrench/index.html', 'quiet-machine/index.html', 'armament/index.html'],
  { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean).sort().map(file => ({
    path: file, sha256: hash(readFileSync(path.join(root, file))),
  })),
  lockSha256: hash(readFileSync(path.join(root, 'package-lock.json'))),
  artifactManifestSha256: hash(JSON.stringify(files)),
  buildCommand: 'npm run build', buildDir: build, routes, files,
}
writeFileSync(args.out, JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ source: manifest.source, artifactManifestSha256: manifest.artifactManifestSha256,
  files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0), routes }))
