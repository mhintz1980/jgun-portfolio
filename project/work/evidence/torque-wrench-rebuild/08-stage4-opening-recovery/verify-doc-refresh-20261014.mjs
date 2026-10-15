// Read-only. Run from repository root; preserves the original frozen evidence.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const base = 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const refresh = JSON.parse(readFileSync(base + '/doc-refresh-provenance-20261014.json'))
const source = JSON.parse(readFileSync(refresh.frozenSourceManifest))
if (source.sourceAggregateSha256 !== refresh.frozenSourceAggregateSha256) throw new Error('Frozen source identity mismatch')
const sourceDrift = source.files.filter(file => hash(readFileSync(file.path)) !== file.sha256).map(file => file.path)
const delta = refresh.authorizedPreservedDelta
const protectedDrift = source.preserved.filter(file => file.path !== delta.path && hash(readFileSync(file.path)) !== file.sha256).map(file => file.path)
const original = source.preserved.find(file => file.path === delta.path)
const todo = readFileSync(delta.path)
const lines = todo.toString().replace(/\r\n/g, '\n').split('\n')
if (original?.sha256 !== delta.beforeSha256 || hash(todo) !== delta.afterSha256
  || lines.filter(line => line.startsWith('- [ ] **JG-038 —')).length !== 1
  || hash(lines.filter(line => !line.startsWith('- [ ] **JG-038 —')).join('\n')) !== delta.outsideJG038BeforeAndAfterSha256) {
  throw new Error('Unauthorized TODO drift')
}
if (sourceDrift.length || protectedDrift.length) throw new Error(JSON.stringify({ sourceDrift, protectedDrift }))
console.log(JSON.stringify({ pass: true, frozenInputs: source.files.length, unchangedProtected: source.preserved.length - 1,
  authorizedDelta: delta.path, sourceDrift, unexpectedProtectedDrift: protectedDrift }))
