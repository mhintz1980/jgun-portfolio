// For each GPU-3 owner MP4: find the first frame whose mean luma (YAVG 0-255) is below 217 (0.85), write <name>-trim.mp4 from there,
// extract <name>-trim-first/mid/last.png, and print white-lead-in length plus per-frame YAVG summary.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
const d = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/33-gpu-3'
const names = ['qm-to-root-fade', 'arrival-into-qm', 'back-to-qm', 'reduced-motion-cut']
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
for (const base of names) for (const sfx of ['', '-390x844']) {
  const f = `${d}/${base}${sfx}.mp4`
  if (!fs.existsSync(f)) { console.log(base + sfx, 'missing'); continue }
  const meta = execFileSync('ffmpeg', ['-hide_banner', '-i', f, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  const frames = []; let t = null
  for (const line of meta.split(/\r?\n/)) {
    const a = /pts_time:([\d.]+)/.exec(line); if (a) t = Number(a[1])
    const b = /lavfi\.signalstats\.YAVG=([\d.]+)/.exec(line); if (b && t !== null) { frames.push([t, Number(b[1])]); t = null }
  }
  const firstDark = frames.findIndex(([, y]) => y < 217)
  const whiteLead = firstDark < 0 ? NaN : frames[firstDark][0]
  const dur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim())
  const out = `${d}/${base}${sfx}-trim.mp4`
  if (firstDark < 0) { console.log(`${base}${sfx}: ALL ${frames.length} frames are bright (min YAVG ${Math.min(...frames.map(x => x[1])).toFixed(0)}); no trim`); continue }
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(whiteLead), '-i', f, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out])
  const td = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).trim())
  for (const [tag, at] of [['first', 0], ['mid', td / 2], ['last', Math.max(0, td - 0.06)]])
    run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(at), '-i', out, '-frames:v', '1', `${d}/${base}${sfx}-trim-${tag}.png`])
  const ys = frames.map(x => x[1])
  console.log(`${base}${sfx}: frames=${frames.length} dur=${dur.toFixed(2)}s white-lead-in=${whiteLead.toFixed(2)}s trimmed=${td.toFixed(2)}s YAVG min/max ${Math.min(...ys).toFixed(0)}/${Math.max(...ys).toFixed(0)}`)
}
