import { useEffect, useRef } from 'react'
import './showreel.css'

// Homepage showreel. Owner ruling 2026-11-08: v3 "The Thread" (remotion/, 69 s) is the canonical
// film and the basis for all future showreel work. The StudioMark showcase "Precision Revealed"
// was rejected and must not be used here.
// Lazy by design (JG-042 first-load budget): only the poster loads up front. The video loads and
// plays muted when half of it is in view, and pauses when it leaves. A viewer's own pause is
// respected. Reduced motion: no autoplay; poster and native controls only.
const REEL = {
  src: '/video/showreel-v3.mp4',
  poster: '/video/showreel-v3-poster.jpg',
  label: 'Showreel',
  title: 'Showreel: The Thread',
} as const

export default function ShowreelSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof IntersectionObserver === 'undefined') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let viewerPaused = false
    let autoPausing = false
    const onPause = () => {
      if (autoPausing) autoPausing = false
      else viewerPaused = true
    }
    const onPlay = () => { viewerPaused = false }
    video.addEventListener('pause', onPause)
    video.addEventListener('play', onPlay)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (reducedMotion.matches || viewerPaused) return
          video.play().catch(() => {})
        } else if (!video.paused) {
          autoPausing = true
          video.pause()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.removeEventListener('pause', onPause)
      video.removeEventListener('play', onPlay)
    }
  }, [])

  return (
    <section className="home-reel" aria-labelledby="home-reel-title">
      <p id="home-reel-title" className="home-label">
        {REEL.label}
      </p>
      <video
        ref={videoRef}
        className="home-reel-video"
        src={REEL.src}
        poster={REEL.poster}
        width={1920}
        height={1080}
        aria-label={REEL.title}
        preload="none"
        muted
        loop
        playsInline
        controls
      />
    </section>
  )
}
