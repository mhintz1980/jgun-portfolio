// Start `vite preview` for a given built dist and record the REAL Windows PID at launch.
// Usage: node start-preview.mjs --dist <abs dir> --port 4173 --pidfile <abs file> --log <abs file>
// Never matches processes by command line: the PID comes from the child we spawn ourselves.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d }
const dist = arg('dist'), port = Number(arg('port', '4173')), pidfile = arg('pidfile'), log = arg('log')
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
if (!dist || !pidfile || !log) { console.error('need --dist --pidfile --log'); process.exit(2) }
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error(`no index.html in ${dist}`); process.exit(2) }
if (fs.existsSync(pidfile)) { console.error(`pidfile exists (${pidfile}); stop-preview first`); process.exit(2) }

const probe = () => new Promise(res => {
  const r = http.get({ host: 'localhost', port, path: '/', timeout: 1500 }, resp => { resp.resume(); res(true) })
  r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false) })
})
if (await probe()) { console.error(`port ${port} is NOT free; a foreign server is listening. Stop and report.`); process.exit(3) }

const out = fs.openSync(log, 'a')
const child = spawn(process.execPath, [`${REPO}/node_modules/vite/bin/vite.js`, 'preview', '--outDir', dist, '--strictPort', '--port', String(port)], {
  cwd: REPO, detached: true, stdio: ['ignore', out, out], windowsHide: true,
})
child.unref()
fs.writeFileSync(pidfile, String(child.pid))
for (let i = 0; i < 60; i++) {
  if (await probe()) { console.log(`STARTED pid=${child.pid} port=${port} dist=${dist}`); process.exit(0) }
  await new Promise(r => setTimeout(r, 500))
}
console.error(`server did not answer on ${port} within 30 s; see ${log}`)
process.exit(1)
