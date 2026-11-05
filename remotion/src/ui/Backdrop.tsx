import type { CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C } from '../theme'

/** The site's drafting grid: minor 40px, major 200px. `dark` 0..1 blends paper → navy studio. */
export function Backdrop({ dark = 0, gridOpacity = 1 }: { dark?: number; gridOpacity?: number }) {
  const lerp = (a: string, b: string, t: number) => {
    const pa = parseInt(a.slice(1), 16)
    const pb = parseInt(b.slice(1), 16)
    const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
    return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
  }
  const minor = `rgba(${dark > 0.5 ? '207,224,242' : '29,78,137'}, ${(dark > 0.5 ? 0.045 : 0.06) * gridOpacity})`
  const major = `rgba(${dark > 0.5 ? '207,224,242' : '29,78,137'}, ${(dark > 0.5 ? 0.08 : 0.11) * gridOpacity})`
  return (
    <AbsoluteFill
      style={{
        background: lerp(C.paper, C.navy, dark),
        backgroundImage: `linear-gradient(${major} 1px, transparent 1px), linear-gradient(90deg, ${major} 1px, transparent 1px), linear-gradient(${minor} 1px, transparent 1px), linear-gradient(90deg, ${minor} 1px, transparent 1px)`,
        backgroundSize: '200px 200px, 200px 200px, 40px 40px, 40px 40px',
        backgroundPosition: '-41px -21px, -41px -21px, -1px -21px, -1px -21px',
      }}
    />
  )
}

/** Paper-tooth grain + a soft vignette, re-seeded every other frame so it breathes like film. */
export function Grain({ strength = 0.06 }: { strength?: number }) {
  const f = useCurrentFrame()
  const seed = Math.floor(f / 2) % 24
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: strength, mixBlendMode: 'overlay' }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 70%, rgba(0,0,0,0.07) 100%)', mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  )
}

/** Grid lines only (no fill), for laying over a WebGL frame. */
export function GridLayer({ tone, style }: { tone: 'paper' | 'dark'; style?: CSSProperties }) {
  const rgb = tone === 'paper' ? '29,78,137' : '207,224,242'
  const minor = `rgba(${rgb}, ${tone === 'paper' ? 0.06 : 0.04})`
  const major = `rgba(${rgb}, ${tone === 'paper' ? 0.11 : 0.07})`
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${major} 1px, transparent 1px), linear-gradient(90deg, ${major} 1px, transparent 1px), linear-gradient(${minor} 1px, transparent 1px), linear-gradient(90deg, ${minor} 1px, transparent 1px)`,
        backgroundSize: '200px 200px, 200px 200px, 40px 40px, 40px 40px',
        backgroundPosition: '-41px -21px, -41px -21px, -1px -21px, -1px -21px',
        ...style,
      }}
    />
  )
}
