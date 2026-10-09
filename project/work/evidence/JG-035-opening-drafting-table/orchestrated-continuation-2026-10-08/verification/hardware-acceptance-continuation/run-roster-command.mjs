import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const packet = path.dirname(fileURLToPath(import.meta.url))
const roster = JSON.parse(fs.readFileSync(path.join(packet, 'command-roster.json'), 'utf8'))
const id = process.argv[2]
const entry = roster.commands.find(command => command.id === id)
if (!entry) throw new Error(`Unknown roster command: ${id}`)

const [command, ...args] = entry.argv
const logPath = path.join(packet, entry.log)
const launchPath = path.join(packet, 'logs', `${id}.launch.json`)
const resultPath = path.join(packet, 'logs', `${id}.result.json`)
fs.mkdirSync(path.dirname(logPath), { recursive: true })
const log = fs.createWriteStream(logPath, { flags: 'a' })
const started = new Date()
const child = spawn(command, args, { cwd: roster.root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
const timeoutMs = entry.wallClockBudgetMinutes * 60_000
let timedOut = false
let settled = false

fs.writeFileSync(launchPath, JSON.stringify({
  id,
  launchedUtc: started.toISOString(),
  command: entry.argv.join(' '),
  pid: child.pid,
  log: logPath,
  budgetMinutes: entry.wallClockBudgetMinutes
}, null, 2) + '\n')

child.stdout.pipe(log, { end: false })
child.stderr.pipe(log, { end: false })
child.stdout.pipe(process.stdout, { end: false })
child.stderr.pipe(process.stderr, { end: false })

const timer = setTimeout(() => {
  timedOut = true
  if (child.exitCode === null && !child.killed) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  }
}, timeoutMs)
timer.unref()

function finish(exitCode, error = null) {
  if (settled) return
  settled = true
  clearTimeout(timer)
  const finished = new Date()
  const result = {
    id,
    startedUtc: started.toISOString(),
    finishedUtc: finished.toISOString(),
    wallClockSeconds: (finished - started) / 1000,
    pid: child.pid,
    exitCode,
    timedOut,
    error,
    command: entry.argv.join(' '),
    log: logPath,
    report: path.join(packet, entry.expectedReport),
    reportExists: fs.existsSync(path.join(packet, entry.expectedReport))
  }
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n')
  fs.writeFileSync(path.join(packet, entry.exitFile), `${exitCode}\n`)
  log.end()
  process.exitCode = timedOut ? 124 : exitCode ?? 1
}

child.on('error', error => finish(1, String(error)))
child.on('close', code => finish(code))
