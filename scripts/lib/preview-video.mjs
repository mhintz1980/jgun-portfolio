// Offline media work only. No browser launch or scene/clock mutation.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFileSync, constants, readFileSync } from 'node:fs'
import path from 'node:path'

const exec = promisify(execFile)
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe'
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function run(command, args) {
  try {
    return await exec(command, args, { encoding: 'buffer', maxBuffer: 128 * 1024 * 1024, windowsHide: true })
  } catch (error) {
    throw new Error(`${command} failed: ${error.stderr?.toString() || error.message}`, { cause: error })
  }
}

export async function checkPreviewVideoTools() {
  const versions = {}
  for (const [name, command] of [['ffmpeg', ffmpeg], ['ffprobe', ffprobe]]) {
    versions[name] = (await run(command, ['-version'])).stdout.toString().split(/\r?\n/)[0]
  }
  return versions
}

// Decode EVERY frame, not just container metadata. Central pixels exclude most
// captions/controls: a white page or black canvas with visible UI must not pass.
// These modest pixel gates detect blank media; they do not prove beauty/framing.
export async function inspectPreviewVideo(file) {
  const probe = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_entries',
    'stream=codec_name,width,height,pix_fmt,r_frame_rate:format=duration,size', '-of', 'json', file])).stdout.toString())
  const width = 96, height = 60, stride = width * height * 3
  const pixels = (await run(ffmpeg, ['-v', 'error', '-xerror', '-i', file, '-map', '0:v:0',
    '-vf', `scale=${width}:${height}`, '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'])).stdout
  if (!pixels.length || pixels.length % stride) throw new Error(`Incomplete RGB decode: ${file}`)
  const frames = []
  for (let offset = 0; offset < pixels.length; offset += stride) {
    let sum = 0, squares = 0, max = 0, bright = 0, count = 0
    for (let y = 9; y < 51; y++) for (let x = 19; x < 86; x++) {
      const at = offset + (y * width + x) * 3
      const luma = .2126 * pixels[at] + .7152 * pixels[at + 1] + .0722 * pixels[at + 2]
      sum += luma; squares += luma * luma; max = Math.max(max, luma)
      if (luma > 24) bright++
      count++
    }
    const mean = sum / count, deviation = Math.sqrt(Math.max(0, squares / count - mean * mean))
    frames.push({ index: frames.length, mean: +mean.toFixed(3), max: +max.toFixed(3),
      deviation: +deviation.toFixed(3), brightFraction: +(bright / count).toFixed(5),
      viewable: max >= 32 && bright / count >= .002 && deviation >= 2 })
  }
  return { probe, decodedFrames: frames.length, region: 'RGB luma, central x=19..85/y=9..50 of 96x60 decode',
    thresholds: { max: 32, brightFraction: .002, brightLuma: 24, deviation: 2 },
    rejectedFrames: frames.filter(frame => !frame.viewable).map(frame => frame.index), frames,
    browserPlayback: 'NOT_CHECKED' }
}

export async function encodePreviewVideo({ directory, fps, frameCount }) {
  if (!Number.isFinite(fps) || !(fps > 0) || !Number.isInteger(frameCount) || frameCount < 2) throw new Error('Need finite fps > 0 and at least two source frames')
  const input = path.join(directory, 'frame-%05d.png')
  const mp4 = path.join(directory, 'preview.mp4'), webm = path.join(directory, 'preview.webm')
  const poster = path.join(directory, 'poster.png')
  const sourceFirstFrame = await inspectPreviewVideo(path.join(directory, 'frame-00000.png'))
  if (sourceFirstFrame.rejectedFrames.length) {
    const error = new Error('First source screenshot is blank/dark; refusing a black boot prefix')
    error.videoChecks = { sourceFirstFrame }
    throw error
  }
  const common = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-framerate', String(fps),
    '-start_number', '0', '-i', input, '-frames:v', String(frameCount), '-an',
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-pix_fmt', 'yuv420p', '-threads', '2']
  await run(ffmpeg, [...common, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-movflags', '+faststart', mp4])
  await run(ffmpeg, [...common, '-c:v', 'libvpx-vp9', '-deadline', 'good', '-cpu-used', '4', '-crf', '28', '-b:v', '0', webm])
  const checks = { mp4: await inspectPreviewVideo(mp4), webm: await inspectPreviewVideo(webm) }
  for (const [format, check] of Object.entries(checks)) {
    if (check.decodedFrames !== frameCount || check.rejectedFrames.length) {
      const error = new Error(`${format}: decoded ${check.decodedFrames}/${frameCount}; blank/dark frame indices ${check.rejectedFrames.join(',')}`)
      error.videoChecks = checks
      throw error
    }
  }
  if (checks.mp4.probe.streams[0]?.codec_name !== 'h264' || checks.mp4.probe.streams[0]?.pix_fmt !== 'yuv420p') {
    throw new Error('MP4 must decode as H264/yuv420p')
  }
  const bytes = readFileSync(mp4), boxes = []
  for (let offset = 0; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    let size = bytes.readUInt32BE(offset)
    if (size === 1) size = Number(bytes.readBigUInt64BE(offset + 8))
    if (size === 0) size = bytes.length - offset
    if (size < 8 || offset + size > bytes.length) throw new Error('Invalid MP4 box size')
    boxes.push(type); offset += size
  }
  checks.mp4.topLevelBoxes = boxes
  checks.mp4.faststart = boxes.includes('moov') && boxes.includes('mdat') && boxes.indexOf('moov') < boxes.indexOf('mdat')
  if (!checks.mp4.faststart) throw new Error('MP4 moov must precede mdat for faststart')
  copyFileSync(path.join(directory, 'frame-00000.png'), poster, constants.COPYFILE_EXCL)
  return { mp4, webm, poster, sourceFirstFrame, checks, durationSeconds: frameCount / fps }
}

export function renderPreviewVideo(video) {
  if (!video?.file || video.completion === 'ERROR') return `<p>No viewable video delivered; use --video=1. ${escape(video?.error ?? '')}</p>`
  const mp4 = video.mp4, webm = video.webm || (!mp4 ? video.file : null)
  const poster = video.poster ? ` poster="${escape(video.poster)}"` : ''
  return `<video controls playsinline preload="metadata"${poster} aria-label="Native-scroll scene preview">
${mp4 ? `<source src="${escape(mp4)}" type="video/mp4">` : ''}
${webm ? `<source src="${escape(webm)}" type="video/webm">` : ''}
Use the download links to open this preview in a local player.</video>
<p>${mp4 ? `<a href="${escape(mp4)}">MP4 (H264)</a> · ` : ''}${webm ? `<a href="${escape(webm)}">WebM</a> · ` : ''}${video.poster ? `<a href="${escape(video.poster)}">Scene poster</a> · ` : ''}${escape(video.completion)}</p>
<p>${escape(video.note ?? '')} Browser playback: ${escape(video.browserPlayback ?? 'NOT_CHECKED')}. Decoded pixels do not establish browser playback.</p>`
}
