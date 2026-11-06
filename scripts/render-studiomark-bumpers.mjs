#!/usr/bin/env node
/**
 * Deterministic 60fps 1080p Renderer for StudioMark 3D Video Bumpers:
 * - Bumper 01: Storm Ignition (`public/video/studiomark-bumper-storm-ignition.mp4` & `.webm`)
 * - Bumper 04: Low Puddle Crane-Up (`public/video/studiomark-bumper-puddle-crane.mp4` & `.webm`)
 *
 * Uses Playwright + Chromium WebGL2 (`--use-gl=angle`) + `window.__studioMarkBumper.seekToTime(mode, t, true)`
 * + FFmpeg master muxing with the 48kHz stereo WAV soundtracks.
 */

import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const URL = process.env.STUDIOMARK_URL || 'http://localhost:5174/studiomark-logo.html?capture=1'
const OUT_VIDEO_DIR = path.resolve('public/video')
const EVIDENCE_DIR = path.resolve('project/work/evidence/studiomark-logo')
const TMP_FRAMES_ROOT = path.resolve('.scratch/studiomark-bumper-frames')

const BUMPERS = [
  {
    mode: 'storm-ignition',
    durationSec: 4.5,
    fps: 60,
    totalFrames: 270,
    audioWav: path.join(EVIDENCE_DIR, 'audio-storm-ignition.wav'),
    outMp4: path.join(OUT_VIDEO_DIR, 'studiomark-bumper-storm-ignition.mp4'),
    outWebm: path.join(OUT_VIDEO_DIR, 'studiomark-bumper-storm-ignition.webm'),
    keyFrames: [18, 75, 100, 225],
  },
  {
    mode: 'puddle-crane',
    durationSec: 5.0,
    fps: 60,
    totalFrames: 300,
    audioWav: path.join(EVIDENCE_DIR, 'audio-puddle-crane.wav'),
    outMp4: path.join(OUT_VIDEO_DIR, 'studiomark-bumper-puddle-crane.mp4'),
    outWebm: path.join(OUT_VIDEO_DIR, 'studiomark-bumper-puddle-crane.webm'),
    keyFrames: [24, 95, 135, 250],
  },
]

function runFfmpeg(args, label) {
  const res = spawnSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf-8' })
  if (res.status !== 0) {
    console.error(`[FFmpeg Error: ${label}]\n`, res.stderr)
    throw new Error(`FFmpeg failed for ${label}`)
  }
}

async function main() {
  fs.mkdirSync(OUT_VIDEO_DIR, { recursive: true })
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

  const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]
  const activeBumpers = onlyArg ? BUMPERS.filter((b) => b.mode === onlyArg) : BUMPERS

  for (const bumper of activeBumpers) {
    console.log(`[StudioMark Bumper Renderer] Launching Chromium for ${bumper.mode} against ${URL}...`)
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--use-gl=angle',
        '--use-angle=d3d11',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--disable-gpu-vsync',
      ],
    })

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()

    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean(window.__studioMarkBumper), { timeout: 15000 })

    // Warm up shaders, fonts, 2K road textures, HDRI, and FBO reflector targets
    await page.waitForTimeout(1200)
    await page.evaluate(async (mode) => {
      window.__studioMarkBumper.seekToTime(mode, 2.5, true)
      for (let i = 0; i < 16; i++) {
        await new Promise((r) => requestAnimationFrame(r))
      }
    }, bumper.mode)
    await page.waitForTimeout(900)

    const framesDir = path.join(TMP_FRAMES_ROOT, bumper.mode)
    fs.rmSync(framesDir, { recursive: true, force: true })
    fs.mkdirSync(framesDir, { recursive: true })

    console.log(
      `\n▶ Rendering ${bumper.mode} (${bumper.totalFrames} frames @ ${bumper.fps}fps, ${bumper.durationSec}s)...`,
    )

    const t0 = Date.now()
    for (let f = 0; f < bumper.totalFrames; f++) {
      const timeSec = f / bumper.fps
      await page.evaluate(
        async ({ mode, t }) => {
          window.__studioMarkBumper.seekToTime(mode, t, true)
          await new Promise((r) => requestAnimationFrame(r))
          await new Promise((r) => requestAnimationFrame(r))
        },
        { mode: bumper.mode, t: timeSec },
      )

      const framePath = path.join(framesDir, `frame_${String(f).padStart(4, '0')}.jpg`)
      await page.screenshot({
        path: framePath,
        type: 'jpeg',
        quality: 96,
      })

      if (bumper.keyFrames.includes(f)) {
        const kfPath = path.join(EVIDENCE_DIR, `${bumper.mode}-frame-${String(f).padStart(3, '0')}.png`)
        await page.screenshot({ path: kfPath, type: 'png' })
      }

      if ((f + 1) % 45 === 0 || f === bumper.totalFrames - 1) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
        console.log(`  [${bumper.mode}] Frame ${f + 1}/${bumper.totalFrames} (${elapsed}s)`)
      }
    }

    // Close browser before synchronous FFmpeg encoding so WebSocket never times out
    await browser.close()

    // Encode Master MP4 (H.264 High Profile, CRF 15, 60fps + 320k AAC stereo audio)
    console.log(`  [${bumper.mode}] Encoding master MP4 -> ${bumper.outMp4}`)
    runFfmpeg(
      [
        '-y',
        '-framerate',
        String(bumper.fps),
        '-i',
        path.join(framesDir, 'frame_%04d.jpg'),
        '-i',
        bumper.audioWav,
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '15',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '320k',
        '-shortest',
        bumper.outMp4,
      ],
      `${bumper.mode}-mp4`,
    )

    // Encode WebM (VP9, 60fps + Opus stereo audio)
    console.log(`  [${bumper.mode}] Encoding master WebM -> ${bumper.outWebm}`)
    runFfmpeg(
      [
        '-y',
        '-framerate',
        String(bumper.fps),
        '-i',
        path.join(framesDir, 'frame_%04d.jpg'),
        '-i',
        bumper.audioWav,
        '-c:v',
        'libvpx-vp9',
        '-b:v',
        '0',
        '-crf',
        '22',
        '-row-mt',
        '1',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'libopus',
        '-b:a',
        '192k',
        '-shortest',
        bumper.outWebm,
      ],
      `${bumper.mode}-webm`,
    )

    // Clean up temporary frame JPEGs
    fs.rmSync(framesDir, { recursive: true, force: true })
  }

  console.log('\n✅ StudioMark 3D Video Bumper(s) rendered and muxed successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

