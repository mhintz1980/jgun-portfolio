import type { CSSProperties, ReactNode } from 'react'
import { C, F } from '../theme'

export function Eyebrow({ children, color = C.inkMuted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: '0.22em', textTransform: 'uppercase', color, fontWeight: 500, ...style }}>
      {children}
    </div>
  )
}

/** A line that rises out of its own baseline mask (0 → 1). */
export function Rise({ t, children, style, distance = 1.05 }: { t: number; children: ReactNode; style?: CSSProperties; distance?: number }) {
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.12em', ...style }}>
      <div style={{ transform: `translateY(${(1 - t) * distance * 100}%)`, opacity: t > 0 ? 1 : 0 }}>{children}</div>
    </div>
  )
}

/** Mono tag line with a short Revision-Orange rule in front, like the site's review stack. */
export function RuleTag({ children, color = C.ink, rule = C.orange, w = 1 }: { children: ReactNode; color?: string; rule?: string; w?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ width: 56 * w, height: 2, background: rule }} />
      <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>{children}</div>
    </div>
  )
}
