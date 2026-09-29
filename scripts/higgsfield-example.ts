/**
 * Higgsfield SDK verification example (Seedance 2.5 text-to-video).
 *
 * Loads HF_CREDENTIALS from .env.local (gitignored) at runtime — the secret is
 * never logged, committed, or sent anywhere but api.higgsfield.ai.
 *
 * Makes ONE billable generation request. Run: node scripts/higgsfield-example.mjs
 * (compiled on the fly from this file by that runner).
 */
import { readFileSync } from 'node:fs'
import { config, higgsfield } from '@higgsfield/client/v2'

function loadCredentials(): string {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const line = raw.split('\n').find((l) => l.startsWith('HF_CREDENTIALS='))
  const value = line?.slice('HF_CREDENTIALS='.length).trim()
  if (!value) throw new Error('HF_CREDENTIALS missing from .env.local')
  return value
}

config({ credentials: loadCredentials() })

const result = await higgsfield.subscribe('bytedance/seedance-2.5/text-to-video', {
  input: {
    prompt: 'A cinematic scene at sunset',
    duration: 5,
    resolution: '720p',
    aspect_ratio: '16:9',
    output_format: 'mp4',
    generate_audio: true,
  },
  withPolling: true,
})

if (result.status === 'completed') {
  const url = result.video?.url
  if (!url) {
    console.error('COMPLETED but no video URL in response:', JSON.stringify(Object.keys(result)))
    process.exit(1)
  }
  console.log('STATUS: completed')
  console.log('VIDEO_URL:', url)
} else {
  // failed | canceled | nsfw — report honestly, never claim success.
  console.error(`STATUS: ${result.status} — generation did not complete`)
  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}
