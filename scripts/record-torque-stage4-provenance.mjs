import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = Object.fromEntries(process.argv.slice(2).map(x => x.slice(2).split('=')))
if (!args.out) throw new Error('--out required')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const files = []
const add = p => {
  const target = path.join(root, p)
  if (!existsSync(target)) return
  if (statSync(target).isDirectory()) for (const name of readdirSync(target)) add(p + '/' + name)
  else files.push({ path: p.replaceAll('\\', '/'), bytes: statSync(target).size, sha256: sha(readFileSync(target)) })
}
for (const p of ['src', 'public', 'scripts', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json']) add(p)
files.sort((a, b) => a.path.localeCompare(b.path))
const protectedPaths = ['GATES.md', 'TODO.md', 'docs/HANDOFF-rea-integration-and-cross-project-strategy-2026-10-12.md',
  'docs/HANDOFF-rea-phase3-complete-2026-10-13.md', 'docs/HANDOFF-rea-phase3-runtime-2026-10-13.md',
  'docs/rea-integration-implementation-plan-2026-10-13.md']
const preserved = protectedPaths.filter(p => existsSync(path.join(root, p))).map(p => ({ path: p, sha256: sha(readFileSync(path.join(root, p))) }))
const result = { createdAt: new Date().toISOString(), branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(),
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  files, sourceAggregateSha256: sha(JSON.stringify(files)), preserved, buildDir: args['build-dir'] ?? null,
  scope: 'Exact local source/public inputs. Protected sibling not accessed. Build and served-byte hashes are bound separately by the runtime reports.' }
mkdirSync(path.dirname(args.out), { recursive: true })
writeFileSync(args.out, JSON.stringify(result, null, 2))
console.log(`Source provenance ${files.length} files: ${result.sourceAggregateSha256}; ${args.out}`)
