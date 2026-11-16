import { CameraMotionBlur } from '@remotion/motion-blur'
import { AbsoluteFill, Img, cancelRender, useCurrentFrame } from 'remotion'
import { clipFrames, type ClipPass } from '../clipFrames'
import { type FilmClip, clipLabelRequired } from '../clips'
import { ARMAMENT } from '../copy'
import { C, F } from '../theme'

/** Motion-blur variants Mark compared on the T2 sheets (equal-weight CameraMotionBlur, N 24).
 *  F: line shutter 90 deg, shade 270 deg. G: F plus the line fading to 0.4 at peak speed so the
 *  shade carries the motion. Switch with CLIP_BLUR_VARIANT. */
export const CLIP_BLUR = {
  F: { samples: 24, lineShutter: 90, shadeShutter: 270, linePeakOpacity: 1 },
  G: { samples: 24, lineShutter: 90, shadeShutter: 270, linePeakOpacity: 0.4 },
} as const
export const CLIP_BLUR_VARIANT: keyof typeof CLIP_BLUR = 'F'

/** The spin on the act clock: one continuous curve from `start` over `length` frames. */
export type Spin = { start: number; length: number }

const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

/** Spin angle in degrees: eases in, passes 360 still moving, overshoots 4 deg and settles back on
 *  360 (= frame 0). The same curve as the T2 blend sheets, so the render matches what Mark saw. */
export function spinAngle(frame: number, spin: Spin): number {
  const u = Math.min(1, Math.max(0, (frame - spin.start) / spin.length))
  return u <= 0.8 ? 364 * inOutCubic(u / 0.8) : 364 - 4 * inOutCubic((u - 0.8) / 0.2)
}

const speed = (frame: number, spin: Spin) => Math.abs(spinAngle(frame + 0.5, spin) - spinAngle(frame - 0.5, spin))
const peakSpeed = (spin: Spin) => {
  let peak = 0
  for (let i = 0; i <= spin.length * 8; i++) peak = Math.max(peak, speed(spin.start + i / 8, spin))
  return peak
}

/** One pass at the pose for the current (possibly frozen, fractional) frame. It reads the frame
 *  itself: under CameraMotionBlur each sample is a <Freeze> copy and must pick its own angle. */
function Pose({ urls, clip, spin }: { urls: string[]; clip: FilmClip; spin: Spin }) {
  const frame = useCurrentFrame()
  const i = ((Math.round(spinAngle(frame, spin) / clip.degPerFrame) % clip.frames) + clip.frames) % clip.frames
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Img src={urls[i]} style={{ width: '100%', height: '100%', display: 'block' }} />
    </AbsoluteFill>
  )
}

export type ClipBox = { left: number; top: number; width: number; height: number }

/** The only component that draws armament clip frames (rules test). Two multiply groups (line ink
 *  on white; shade over white at `shadeOpacity`, i.e. paper lerped toward paper × shade) and, for a
 *  representative model, the label. Returns a fragment: each group must be a direct child of the
 *  act's root so the multiply blends with the paper, so fade and drift go on each group, never on
 *  a shared parent. Motion blur is mounted only during the spin; holds are plain frames. */
export function ClipSpin({
  clip,
  box,
  spin,
  revealX,
  shadeOpacity,
  opacity,
  labelAt,
}: {
  clip: FilmClip
  box: ClipBox
  spin: Spin
  /** Screen x the line is revealed up to (the pen). */
  revealX: number
  shadeOpacity: number
  /** Layer fade (both groups and the label). */
  opacity: number
  /** Label position on screen. */
  labelAt: { left: number; top: number }
}) {
  const f = useCurrentFrame()
  const urls = { line: clipFrames(clip.id, 'line'), shade: clipFrames(clip.id, 'shade') }
  for (const pass of ['line', 'shade'] as const) {
    if (urls[pass].length !== clip.frames) {
      cancelRender(new Error(`armament clip frames missing (${clip.id}/${pass}: ${urls[pass].length} of ${clip.frames}): copy from scratch or the armament-frames Modal Volume`))
    }
  }

  const blur = CLIP_BLUR[CLIP_BLUR_VARIANT]
  const spinning = f >= spin.start && f < spin.start + spin.length
  const lineDip = 1 - (1 - blur.linePeakOpacity) * (speed(f, spin) / peakSpeed(spin))
  const clipPath = `inset(0 ${Math.max(0, box.left + box.width - revealX)}px 0 0)`

  const group = (pass: ClipPass, groupOpacity: number, shutter: number) => (
    <div style={{ position: 'absolute', ...box, overflow: 'hidden', mixBlendMode: 'multiply', opacity: groupOpacity, clipPath }}>
      {spinning ? (
        <CameraMotionBlur shutterAngle={shutter} samples={blur.samples}>
          <Pose urls={urls[pass]} clip={clip} spin={spin} />
        </CameraMotionBlur>
      ) : (
        <Pose urls={urls[pass]} clip={clip} spin={spin} />
      )}
    </div>
  )

  return (
    <>
      {group('shade', opacity * shadeOpacity, blur.shadeShutter)}
      {group('line', opacity * lineDip, blur.lineShutter)}
      {clipLabelRequired(clip) && (
        <div style={{ position: 'absolute', ...labelAt, opacity, fontFamily: F.body, fontWeight: 500, fontSize: 19, whiteSpace: 'pre', lineHeight: 1.3, color: C.inkMuted }}>
          {ARMAMENT.representativeAssembly}
        </div>
      )}
    </>
  )
}
