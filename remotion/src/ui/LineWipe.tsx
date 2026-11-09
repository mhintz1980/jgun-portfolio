import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { EASE, mix, ramp } from '../ease'
import { C } from '../theme'

/** Overlap between acts that hand over with a line wipe. */
export const WIPE = 24

/** The next shot enters from the right behind a vertical Revision-Orange cut line. */
export function LineWipe({ children }: { children: ReactNode }) {
  const f = useCurrentFrame()
  const t = ramp(f, 0, WIPE, EASE.inOut)
  const x = mix(1920 + 30, -30, t)
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: t < 1 ? `inset(0 0 0 ${Math.max(0, x)}px)` : undefined }}>{children}</AbsoluteFill>
      {t > 0 && t < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={x} y1={0} x2={x} y2={1080} stroke={C.orange} strokeWidth={16} opacity={0.22} />
          <line x1={x} y1={0} x2={x} y2={1080} stroke={C.orangeLit} strokeWidth={3} />
        </svg>
      )}
    </AbsoluteFill>
  )
}
