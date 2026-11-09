// Pull review stills + a contact sheet out of the rendered MP4 with the ffmpeg that ships in
// @remotion/renderer (or a system ffmpeg). Usage: node scripts/review-stills.mjs [mp4] [outDir]
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const mp4 = process.argv[2] ?? '../public/video/showreel-v3.mp4'
const out = process.argv[3] ?? 'review'
mkdirSync(out, { recursive: true })

// One still per beat (seconds), named for what the owner should look at.
const STILLS = [
  [1.9, '01-thread-laces'],
  [4.6, '02-name-drawn'],
  [8.2, '03-wrench-plotted'],
  [10.2, '04-drawing-becomes-object'],
  [12.6, '05-wrench-hero'],
  [17.6, '06-rear-extraction'],
  [22.6, '07-wrench-out'],
  [24.0, '08-thread-cut-wipe'],
  [28.6, '09-incision'],
  [32.6, '10-supply-air'],
  [36.2, '11-two-feeds'],
  [40.0, '12-control-the-noise'],
  [44.6, '13-xray-scan'],
  [48.4, '14-fire-control'],
  [50.6, '15-plates'],
  [54.2, '16-representative-cards'],
  [62.4, '17-close'],
  [66.0, '18-end-card'],
  [69.0, '19-ident-wipe-in'],
  [70.1, '20-ident-lightning'],
  [72.8, '21-ident-lockup'],
  [73.5, '22-back-to-paper'],
]

let ffmpeg = 'ffmpeg'
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
} catch {
  ffmpeg = path.resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')
}

for (const [t, name] of STILLS) {
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', mp4, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', path.join(out, `${name}.jpg`)])
}
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=1/2.3,scale=384:-2,tile=6x5:padding=4:color=0xf4f1ea', '-frames:v', '1', '-q:v', '3', path.join(out, 'contact-sheet.jpg')])
console.log(`wrote ${STILLS.length} stills + contact-sheet.jpg to ${out}/`)
