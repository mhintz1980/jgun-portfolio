import { useEffect, useRef, useState } from 'react'
import './name.css'

interface DrawnNameProps {
  href: string
  label: string
  text?: string
  /** Use the page fade when the link leaves the page. */
  fade?: boolean
  tabIndex?: number
}

// Mark's name, large and bold, drawn onto the page: the outline is traced in Revision Orange,
// then the letters fill with ink. The SVG viewBox is fitted to the text once the font is in, so
// the name spans exactly its box (half the screen on desktop). Reduced motion: shown filled.
export default function DrawnName({ href, label, text = 'MARK HINTZ', fade = false, tabIndex }: DrawnNameProps) {
  const textRef = useRef<SVGTextElement>(null)
  const [box, setBox] = useState<string | null>(null)
  const [letters, setLetters] = useState<{ char: string; x: number; travel: number; duration: number }[] | null>(null)

  useEffect(() => {
    let disposed = false
    let fitted = false
    const fit = () => {
      const node = textRef.current
      if (disposed || !node) return
      fitted = true
      const b = node.getBBox()
      if (text === 'MARK HINTZ') {
        const mEnd = node.getEndPositionOfChar(0).x
        const hStart = node.getStartPositionOfChar(5).x
        const hWidth = node.getEndPositionOfChar(5).x - hStart
        const stopAfter = mEnd + hWidth
        node.closest<SVGAElement | HTMLAnchorElement>('.home-name')?.style.setProperty('--monogram-end', `${100 * (stopAfter - b.x) / b.width}%`)
        const totalDistance = node.getStartPositionOfChar(9).x - stopAfter
        setLetters(Array.from(text, (char, index) => {
          const destination = index > 5 ? stopAfter : mEnd
          const x = node.getStartPositionOfChar(index).x
          const distance = index === 0 || index === 4 ? 0 : Math.max(0, x - destination)
          const duration = totalDistance > 0 ? 325 * distance / totalDistance : 0
          return { char, x, travel: -distance, duration }
        }))
      }
      setBox(`${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.width.toFixed(1)} ${b.height.toFixed(1)}`)
    }
    // A slow font may arrive after the fallback. Refit it then, including letter
    // travel and the MH boundary, instead of permanently freezing system-font metrics.
    const fallback = window.setTimeout(() => { if (!fitted) fit() }, 1500)
    if (document.fonts?.load) {
      document.fonts.load('900 100px "Archivo"', text).then(fit, fit)
    } else {
      fit()
    }
    return () => { disposed = true; window.clearTimeout(fallback) }
  }, [text])

  return (
    <a className="home-name" href={href} aria-label={label} tabIndex={tabIndex} data-ready={box ? '' : undefined} data-fade={fade ? '' : undefined}>
      <svg className="home-name-svg" viewBox={box ?? '0 -74 640 76'} aria-hidden="true" focusable="false">
        <text ref={textRef} className="home-name-text" x="0" y="0" xmlSpace="preserve" style={letters ? { visibility: 'hidden' } : undefined}>
          {text}
        </text>
        {letters?.map(({ char, x, travel, duration }, index) => char === ' ' ? null : (
          <text key={index} x={x} y="0" className={`home-name-text${index === 0 ? '' : ' home-letter'}${index === 5 ? ' home-letter-h' : ''}`}
            style={{ '--letter-travel': `${travel}px`, '--duration': `${duration}ms`, '--reverse-delay': `${450 - duration}ms` } as React.CSSProperties}>{char}</text>
        ))}
      </svg>
    </a>
  )
}
