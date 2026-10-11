import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const E3 = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/33-gpu-3'
const names = { 'fade-out': 'qm-to-root-fade', 'synthetic-arrival': 'arrival-into-qm', 'back': 'back-to-qm', 'reduced-motion-cut': 'reduced-motion-cut' }
const rows = []
const probe = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim())
const dims = f => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name', '-of', 'csv=p=0', f]).toString().trim()
for (const vp of ['1440x900', '390x844']) {
  const suffix = vp === '1440x900' ? '' : '-' + vp
  const rep = JSON.parse(fs.readFileSync(`${E3}/base-${vp}/report.json`, 'utf8'))
  for (const [c, base] of Object.entries(names)) {
    const entry = rep.cases.find(x => x.name === c)
    const v = entry?.video
    const src = v?.file ? path.resolve('C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine', v.file) : null
    if (!src || !fs.existsSync(src)) { rows.push({ vp, case: c, missing: true, note: v?.note || 'no video entry' }); continue }
    const out = `${E3}/${base}${suffix}`
    fs.copyFileSync(src, out + '.webm')
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out + '.mp4'])
    const dur = probe(out + '.mp4')
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0', '-i', out + '.mp4', '-frames:v', '1', out + '-first.png'])
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(dur / 2), '-i', out + '.mp4', '-frames:v', '1', out + '-mid.png'])
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-0.2', '-i', out + '.mp4', '-update', '1', '-frames:v', '1', out + '-last.png'])
    rows.push({ vp, case: c, file: path.basename(out) + '.mp4', bytes: fs.statSync(out + '.mp4').size, durationS: +dur.toFixed(2), webmDurationS: +probe(src).toFixed(2), stream: dims(out + '.mp4'),
      frames: ['first', 'mid', 'last'].map(k => path.basename(out) + '-' + k + '.png'), frameBytes: ['first', 'mid', 'last'].map(k => fs.statSync(`${out}-${k}.png`).size), source: v.file })
  }
}
fs.writeFileSync(`${E3}/videos3-log.json`, JSON.stringify(rows, null, 2))
for (const r of rows) console.log(JSON.stringify({ vp: r.vp, case: r.case, file: r.file, bytes: r.bytes, durationS: r.durationS, stream: r.stream, missing: r.missing, note: r.note, frameBytes: r.frameBytes }))
