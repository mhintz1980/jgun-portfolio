// Static evidence checks for GPU-2 / GPU-3. No browser, no servers. Usage: node verify-evidence.mjs <gpu2|gpu3|common>
// Prints one line per check: "ok|FAIL <id> <detail>" and a final "<GATE>_OK" or "<GATE>_FAIL n".
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const EV = `${REPO}/project/work/evidence/rl300-quiet-machine`
const { pixels } = await import(pathToFileURL(`${REPO}/scripts/lib/preview-pixels.mjs`).href)
const gate = process.argv[2]
let fails = 0
const ok = (id, detail = '') => console.log(`ok   ${id} ${detail}`)
const bad = (id, detail = '') => { fails++; console.log(`FAIL ${id} ${detail}`) }
const check = (id, cond, detail = '') => (cond ? ok(id, detail) : bad(id, detail))
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', cwd: REPO, ...opts })
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const exists = f => fs.existsSync(f) && fs.statSync(f).size > 0

function blank(file, minFraction) {
  try {
    const p = pixels(fs.readFileSync(file)); const { data, channels, width, height } = p
    const hist = new Map()
    for (let i = 0; i < data.length; i += channels) { const k = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]; hist.set(k, (hist.get(k) || 0) + 1) }
    const flat = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0]
    let diff = 0
    for (let i = 0; i < data.length; i += channels) {
      const k = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
      if (Math.max(Math.abs((k >> 16) - (flat >> 16)), Math.abs(((k >> 8) & 255) - ((flat >> 8) & 255)), Math.abs((k & 255) - (flat & 255))) > 8) diff++
    }
    const frac = diff / (width * height)
    return { frac, colors: hist.size, ok: frac >= minFraction && hist.size > 16, size: `${width}x${height}` }
  } catch (e) { return { ok: false, frac: 0, colors: 0, size: `decode error: ${e.message}` } }
}
const png = (id, f, minFraction = 0.05) => {
  if (!exists(f)) return bad(id, `missing ${path.basename(f)}`)
  const r = blank(f, minFraction); check(id, r.ok, `${path.basename(f)} ${r.size} differs-from-modal=${(r.frac * 100).toFixed(1)}% colors=${r.colors}`)
}
const mp4 = (id, f, minSec) => {
  if (!exists(f)) return bad(id, `missing ${path.basename(f)}`)
  let d = NaN
  try { d = Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim()) } catch {}
  check(id, d >= minSec, `${path.basename(f)} ${d.toFixed(1)}s (min ${minSec}) ${(fs.statSync(f).size / 1e6).toFixed(1)}MB`)
}
// netstat did not show the listener from the seat's shell, so probe with a real connect instead.
const portFree = port => {
  try { sh('curl', ['-s', '-o', 'NUL', '--max-time', '2', `http://localhost:${port}/`]); return false } catch (e) { return e.status === 7 }
}

function common() {
  check('C.ports-free', portFree(4173) && portFree(5199), '4173 and 5199 not LISTENING')
  const status = sh('git', ['status', '--porcelain']).split('\n').filter(Boolean)
  const tracked = status.filter(l => !l.startsWith('??'))
  check('C.no-tracked-changes', tracked.length === 0, tracked.length ? tracked.join(' | ') : 'git status has no tracked changes')
  const staged = sh('git', ['diff', '--cached', '--name-only']).trim()
  check('C.nothing-staged', staged === '', staged || 'index empty')
  const untracked = status.filter(l => l.startsWith('??')).map(l => l.slice(3))
  const allowed = [/^project\/work\/evidence\/rl300-quiet-machine\/3[23]-gpu-[23]/, /^2$/, /^key$/, /^document\.querySelector/]
  const odd = untracked.filter(f => !allowed.some(r => r.test(f)))
  check('C.untracked-only-evidence', odd.length === 0, odd.length ? `unexpected untracked: ${odd.join(', ')}` : 'only evidence paths + 3 old strays')
  const zero = untracked.filter(f => !allowed.slice(1).some(r => r.test(f))).filter(f => fs.existsSync(`${REPO}/${f}`) && fs.statSync(`${REPO}/${f}`).isFile() && fs.statSync(`${REPO}/${f}`).size === 0)
  check('C.no-new-0byte-root-files', zero.length === 0, zero.join(', ') || 'none')
  check('C.head', sh('git', ['rev-parse', '--short', 'HEAD']).trim() === '275a4c0a', 'HEAD is 275a4c0a (no commit made)')
  const nm = fs.readdirSync(`${REPO}/node_modules`).length
  check('C.node_modules-154', nm === 154, `entries=${nm}`)
}

function gpu2() {
  const d = `${EV}/32-gpu-2`, run = `${EV}/32-gpu-2-qm5-captures.md`
  check('G2.run-file', exists(run))
  const text = exists(run) ? fs.readFileSync(run, 'utf8') : ''
  const distQm = sha(`${REPO}/dist/quiet-machine/index.html`), distRoot = sha(`${REPO}/dist/index.html`)
  check('G2.dist-sha-recorded', text.includes(distQm) && text.includes(distRoot), 'run file contains the sha256 of both current dist HTML files')
  check('G2.head-recorded', /275a4c0a/.test(text), 'run file records HEAD')
  const log = `${d}/verify-jg033-preview.log`
  check('G2.verifier-log', exists(log), 'verify-jg033-preview.log present')
  check('G2.verifier-exit0', /exit(?: code)?[:= ]+0\b/i.test(fs.existsSync(log) ? fs.readFileSync(log, 'utf8') + text : text), 'an "exit 0" line for verify-jg033-preview in log or run file')
  for (const f of ['u34-1440x900', 'u34-390x844', 'u51-1440x900', 'u51-390x844', 'sheet-1440x900', 'sheet-390x844', 'intake-closeup-1440x900', 'intake-closeup-768x1024', 'intake-raw-1440x900', 'intake-raw-768x1024', 'reservoir-1019-vs-1020', 'chevrons', 'panel-2a-current'])
    png(`G2.png.${f}`, `${d}/${f}.png`)
  for (const f of ['header-390x667', 'header-390x844', 'endcard-390x667', 'endcard-390x844', 'endcard-1440x900', 'endcard-768x1024'])
    png(`G2.png.${f}`, `${d}/${f}.png`, 0.005)
  for (const vp of ['1440x900', '390x844']) for (const u of ['u34', 'u51']) png(`G2.png.lite-vs-full-${u}-${vp}`, `${d}/lite-vs-full-${u}-${vp}.png`)
  check('G2.lite-vs-full-telemetry', exists(`${d}/lite-vs-full-telemetry.json`))
  for (const f of ['u34-1440x900', 'u51-390x844', 'intake-closeup-1440x900']) {
    const j = `${d}/${f}.json`
    let t = null; try { t = JSON.parse(fs.readFileSync(j, 'utf8')) } catch {}
    check(`G2.tier-sidecar.${f}`, !!t && 'tier' in t && 'u' in t, t ? `tier=${t.tier} u=${t.u}` : 'missing or invalid json')
    if (t && /quality=full/.test(String(t.url || ''))) check(`G2.tier-is-full.${f}`, t.tier === 'full', `asked full, resolved ${t.tier}`)
  }
  mp4('G2.mp4.forward-reverse', `${d}/forward-reverse.mp4`, 15)
  mp4('G2.mp4.forward-at-proposed-length', `${d}/forward-at-proposed-length.mp4`, 20)
  for (const k of ['01', '03', 'nav', 'aria-label', 'overlap', 'ndc', 'lite']) check(`G2.run-mentions.${k}`, new RegExp(k, 'i').test(text), `run file discusses "${k}"`)
}

function gpu3() {
  const d = `${EV}/33-gpu-3`, run = `${EV}/33-gpu-3-qm6-transition.md`
  check('G3.run-file', exists(run))
  const text = exists(run) ? fs.readFileSync(run, 'utf8') : ''
  for (const [vp] of [['1440x900'], ['390x844']]) {
    const r = `${d}/base-${vp}/report.json`
    let j = null; try { j = JSON.parse(fs.readFileSync(r, 'utf8')) } catch {}
    check(`G3.base-report.${vp}`, !!j, j ? `result=${j.result}` : 'missing report.json')
    if (j) {
      check(`G3.base-no-fail.${vp}`, !j.cases.some(c => c.status === 'FAIL') && !j.error, j.cases.map(c => `${c.name}:${c.status}`).join(' '))
      const unv = j.cases.filter(c => c.status === 'UNVERIFIED').map(c => c.name)
      check(`G3.base-only-back-unverified.${vp}`, unv.every(n => n === 'back'), `UNVERIFIED=[${unv.join(',')}]`)
      check(`G3.base-7-cases.${vp}`, j.cases.length === 7, `cases=${j.cases.length}`)
    }
  }
  for (const l of ['MUTATION-1 RED', 'MUTATION-1 GREEN-AFTER', 'MUTATION-2 RED', 'MUTATION-2 GREEN-AFTER', 'CASE7-PRE-QM6A RED'])
    check(`G3.literal.${l}`, new RegExp(`^${l}: (yes|no|UNVERIFIED)`, 'm').test(text), (text.match(new RegExp(`^${l}: .*$`, 'm')) || ['absent'])[0])
  const distQm = sha(`${REPO}/dist/quiet-machine/index.html`)
  check('G3.dist-restored', text.includes(distQm), 'run file contains the sha of the current dist/quiet-machine/index.html (ORIG)')
  for (const n of ['qm-to-root-fade', 'arrival-into-qm', 'back-to-qm', 'reduced-motion-cut'])
    for (const sfx of ['', '-390x844']) {
      mp4(`G3.mp4.${n}${sfx}`, `${d}/${n}${sfx}.mp4`, n === 'reduced-motion-cut' ? 0.1 : 1)
      for (const p of ['first', 'mid', 'last']) check(`G3.frame.${n}${sfx}.${p}`, exists(`${d}/${n}${sfx}-${p}.png`))
    }
  const wt = sh('git', ['worktree', 'list'])
  check('G3.worktree-removed', !/jgun-qm-f68db769/.test(wt), 'no jgun-qm-f68db769 in git worktree list')
  check('G3.worktree-dir-gone', !fs.existsSync('C:/Users/Markimus/.buzz/REPOS/jgun-qm-f68db769'), 'directory removed')
  check('G3.base-sources-restored', sh('git', ['diff', '--stat', 'HEAD', '--', 'quiet-machine/index.html', 'src/shared/pageFade.ts']).trim() === '', 'both mutated files match HEAD')
}

if (gate === 'gpu2') { common(); gpu2() } else if (gate === 'gpu3') { common(); gpu3() } else if (gate === 'common') common()
else { console.log('usage: gpu2|gpu3|common'); process.exit(2) }
console.log(fails ? `${gate.toUpperCase()}_FAIL ${fails}` : `${gate.toUpperCase()}_OK`)
process.exit(fails ? 1 : 0)
