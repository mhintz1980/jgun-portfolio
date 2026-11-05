import type { CSSProperties } from 'react'
import { Img, staticFile } from 'remotion'
import { showcase } from '../armament'
import { ARMAMENT } from '../copy'
import { C, F } from '../theme'

/** One armament render as a print on the sheet. A "representative" image can only be drawn
 *  through this card, and the card always carries its label — the owner's rule is structural. */
export function ShowcaseCard({
  file,
  width,
  height,
  style,
  imgStyle,
  shadow = true,
}: {
  file: string
  width: number
  height: number
  style?: CSSProperties
  imgStyle?: CSSProperties
  shadow?: boolean
}) {
  const img = showcase(file)
  const representative = img.label === 'representative'
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        overflow: 'hidden',
        background: '#d9d6cf',
        boxShadow: shadow ? '0 30px 60px -20px rgba(20,24,29,0.45), 0 2px 0 rgba(20,24,29,0.06)' : undefined,
        ...style,
      }}
    >
      <Img src={staticFile(img.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imgStyle }} />
      {representative && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '48px 20px 16px',
            background: 'linear-gradient(180deg, rgba(20,24,29,0) 0%, rgba(20,24,29,0.85) 72%)',
            fontFamily: F.body,
            fontWeight: 500,
            fontSize: 19,
            whiteSpace: 'nowrap',
            color: C.paper,
          }}
        >
          {ARMAMENT.representativeLabel}
        </div>
      )}
    </div>
  )
}
