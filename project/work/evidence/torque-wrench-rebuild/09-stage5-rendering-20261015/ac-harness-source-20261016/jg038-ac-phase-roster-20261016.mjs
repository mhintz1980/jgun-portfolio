import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { torquePerformanceRetryReasons, validateTorquePerformanceRoster } from '../scripts/lib/torque-verification-contract.mjs'
const root = process.cwd()
const out = 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/ac-performance-20261016-f-v2'
mkdirSync(out, { recursive: true })
const summaryPath = out + '/roster-progress.json'
const phaseNames = ['drafting', 'breakthrough', 'mechanism', 'inspection', 'close']
const hash = b => createHash('sha256').update(b).digest('hex')
const source = JSON.parse(readFileSync('project/work/evidence/torque-wrench-rebuild/09-stage5-rendering-20261015/two-findings-source-f.json'))
const product = source.files.filter(f => !f.path.startsWith('scripts/'))
const power = () => JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus | Select-Object PowerOnline,Charging,Discharging | ConvertTo-Json -Compress'], { encoding: 'utf8' }))
const files = () => readdirSync(out).filter(x => /^performance-contract-.*\.json$/.test(x))
const load = name => JSON.parse(readFileSync(out + '/' + name))
const state = { scope: 'JG-038-LEAN-V1 AC phase measurements; no product changes or automatic gate acceptance',
  startedAt: new Date().toISOString(), productAggregate: source.sourceAggregateSha256,
  harnessSha256: hash(readFileSync('scripts/verify-torque-performance-contract.mjs')),
  observerSha256: hash(readFileSync('scripts/lib/torque-performance-observers.mjs')),
  attempts: [], plannedPrimary: 20, plannedRetries: [], completedPrimary: 0, completedRetries: 0,
  status: 'RUNNING', environment: [], limitations: ['Texture-memory estimate may be incomplete', 'Total observer overhead unavailable', 'Emulated N is not physical mobile', 'No owner acceptance or full G8 closure inferred'] }
const save = () => writeFileSync(summaryPath, JSON.stringify(state, null, 2))
function checkEnvironment() {
  const p = power()
  const drift = product.filter(f => !existsSync(f.path) || hash(readFileSync(f.path)) !== f.sha256).map(f => f.path)
  const observed = { at: new Date().toISOString(), power: p, drift }
  state.environment.push(observed)
  if (p.PowerOnline !== true || p.Discharging === true || drift.length) throw new Error('AC/product precondition changed: ' + JSON.stringify(observed))
  if (hash(readFileSync('scripts/verify-torque-performance-contract.mjs')) !== state.harnessSha256
    || hash(readFileSync('scripts/lib/torque-performance-observers.mjs')) !== state.observerSha256) throw new Error('Harness changed during roster')
}
function reasons(j) {
  return torquePerformanceRetryReasons(j)
}
async function run(viewport, tier, phase, index, kind) {
  checkEnvironment()
  const existing = files().find(name => { const j = load(name); return j.viewportCase === viewport && j.requestedTier === tier && j.phase === phase && j.run === index })
  let file = existing, exitCode = null
  if (!file) {
    const before = new Set(files())
    console.log(`START ${kind} ${viewport}/${tier}/${phase}/R${index}`)
    const args = ['scripts/verify-torque-performance-contract.mjs', '--url=http://localhost:5288/torque-wrench/',
      '--build-dir=.scratch/jg038-two-findings-20261015-f', '--out=' + out, '--viewport=' + viewport, '--tier=' + tier,
      '--phase=' + phase, '--run=' + index, '--power=AC', '--device=Nimo Direct N177L / Radeon 780M']
    exitCode = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      child.stdout.on('data', () => {})
      child.stderr.on('data', b => { console.log('child stderr ' + String(b).slice(0, 800)) })
      child.on('error', reject); child.on('close', resolve)
    })
    const added = files().filter(x => !before.has(x))
    if (added.length !== 1) throw new Error('Expected one retained report, found ' + JSON.stringify(added))
    file = added[0]
  }
  const j = load(file)
  checkEnvironment()
  const record = { viewport, tier, phase, run: index, kind, path: out + '/' + file,
    reportSha256: hash(readFileSync(out + '/' + file)), status: j.status, exitCode, reusedExisting: Boolean(existing),
    p50: j.p50, p95: j.p95, p99: j.p99, maximum: j.maximum, tailPercent: j.tailPercent,
    calls: j.peakFrameCalls, triangles: j.peakFrameTriangles, memoryMiB: j.residentTextureTargetMiB ?? null,
    newWarmPrograms: j.newWarmPrograms, renderer: j.renderer, refreshHz: j.refreshHz, errors: j.contractValidation?.errors,
    unverified: j.contractValidation?.unverified, extraGateFailures: j.extraGateFailures, retryReasons: reasons(j) }
  state.attempts.push(record)
  if (kind === 'primary') state.completedPrimary++; else state.completedRetries++
  save()
  console.log(`DONE ${kind} ${viewport}/${tier}/${phase}/R${index}: ${j.status} p95=${j.p95?.toFixed(1)} p99=${j.p99?.toFixed(1)} tail=${j.tailPercent?.toFixed(2)}% (${state.completedPrimary}/20 primary, ${state.completedRetries} retries)`)
  return record
}
try {
  for (const viewport of ['D', 'N']) for (const tier of ['full', 'lite']) for (const phase of phaseNames) {
    const r = await run(viewport, tier, phase, 1, 'primary')
    if (r.retryReasons.length) state.plannedRetries.push({ viewport, tier, phase,
      runs: r.retryReasons.some(reason => reason.startsWith('near ceiling:')) ? [2, 3] : [2], reasons: r.retryReasons })
    save()
  }
  for (const repeat of state.plannedRetries) for (const index of repeat.runs) await run(repeat.viewport, repeat.tier, repeat.phase, index, 'retry')
  state.status = state.attempts.some(x => x.status === 'FAIL' || x.status === 'BLOCKED') ? 'MEASURED_WITH_FAILURES' : 'MEASURED_WITH_UNVERIFIED_ITEMS'
  state.rosterValidation = validateTorquePerformanceRoster(files().map(load))
  state.finishedAt = new Date().toISOString(); save()
  console.log('ROSTER COMPLETE ' + state.status + ' ' + summaryPath)
} catch (error) {
  state.status = 'INTERRUPTED'; state.error = String(error.stack); state.finishedAt = new Date().toISOString(); save()
  console.error(state.error); process.exitCode = 1
}
