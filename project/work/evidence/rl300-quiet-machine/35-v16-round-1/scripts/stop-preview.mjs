// Stop the preview server whose PID start-preview.mjs recorded, and prove the port is free.
// Usage: node stop-preview.mjs --pidfile <abs file> --port 4173
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d }
const pidfile = arg('pidfile'), port = Number(arg('port', '4173'))
if (!pidfile) { console.error('need --pidfile'); process.exit(2) }
const probe = () => new Promise(res => {
  const r = http.get({ host: 'localhost', port, path: '/', timeout: 1500 }, resp => { resp.resume(); res(true) })
  r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false) })
})
if (!fs.existsSync(pidfile)) { console.error(`no pidfile ${pidfile}; nothing of ours to stop`); process.exit(2) }
const pid = fs.readFileSync(pidfile, 'utf8').trim()
if (!/^\d+$/.test(pid)) { console.error(`bad pidfile content: ${pid}`); process.exit(2) }
const r = spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { encoding: 'utf8' })
console.log(`taskkill /PID ${pid} /T /F exit ${r.status}: ${(r.stdout || r.stderr || '').trim().slice(0, 200)}`)
fs.unlinkSync(pidfile)
await new Promise(r => setTimeout(r, 800))
const stillUp = await probe()
console.log(stillUp ? `PORT ${port} STILL ANSWERING` : `PORT ${port} FREE`)
process.exit(stillUp ? 1 : 0)
