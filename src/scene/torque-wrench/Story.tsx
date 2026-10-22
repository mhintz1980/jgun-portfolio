// The persistent semantic DOM story: five ordered chapters with real headings and copy from the
// accepted design, plus the keyboard-accessible DOM inspection control. The page mounts Story
// exactly once, outside every tier/failure conditional, so focus and state survive transitions.
import { useEffect, useRef, useState } from 'react'
import { TORQUE_POSTER_CHAPTERS, type TorquePosterChapterId } from './posterMap'
import type { InspectionPlayback } from './inspectionPlayback'

const CHAPTER_COPY: Record<TorquePosterChapterId, { title: string; lede: string; body: string }> = {
  drafting: {
    title: 'Drafting',
    lede: 'Design starts with the interfaces.',
    body: 'Mark Hintz’s JGUN design connects the input shaft, planetary drivetrain and two-speed clutch. The drawing and handwritten notes introduce the geometry and manufacturing decisions behind the tool.',
  },
  breakthrough: {
    title: 'Breakthrough',
    lede: 'From drawing to working assembly.',
    body: 'The wrench rises through its drawn profile, bringing the housing, operator controls and drivetrain into three dimensions. Follow the parts from their mating interfaces to their role in the complete assembly.',
  },
  mechanism: {
    title: 'Mechanism',
    lede: 'How the wrench works.',
    body: 'The diamond-knurled P003068 ring gives the operator a grip to select Rundown or High Torque. Its detents locate the mode, while the blue and red indicator stripes reveal the shift. Inside, the planetary stages transmit motion through the gearbox.',
  },
  inspection: {
    title: 'Inspection',
    lede: 'A stronger shaft begins with a different cut.',
    body: 'The original P001835 shaping process required a cutter relief groove. The 4140, 4340 and C300 attempts all failed at that groove. Mark’s revised shaft uses rotary hobbing and a smooth blank, with the bearing and retaining rings moved to support the new geometry.',
  },
  close: {
    title: 'Assembly',
    lede: 'Precision connects every stage.',
    body: 'The exploded gearbox reveals how the carriers, planets, bearing and clutch fit together. Inspect the P000247 planet in A000592: the gears were cut in house to ISO 1328 Grade A6, with less than .001 inch total indicated runout. The finished wrench brings these design and manufacturing decisions together.',
  },
}

function InspectionControl({ playback, live }: { playback?: InspectionPlayback; live?: boolean }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const seekRef = useRef<HTMLInputElement | null>(null)
  const wasLive = useRef(live)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      playback?.close()
      triggerRef.current?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, playback])

  useEffect(() => {
    // Automatic tier/failure fallback is not a user inspection exit: preserve the open
    // disclosure, stop explicit playback, and let the static controls disappear safely.
    if (wasLive.current && !live && open) playback?.close()
    wasLive.current = live
  }, [live, open, playback])

  useEffect(() => () => playback?.close(), [playback])

  useEffect(() => {
    if (!open || !live) return
    const sync = () => { if (seekRef.current) seekRef.current.value = String((playback?.snapshot().progress ?? 0) * 100) }
    sync()
    const timer = window.setInterval(sync, 100)
    return () => window.clearInterval(timer)
  }, [open, live, playback])

  return (
    <div className="torque-inspection">
      <button
        ref={triggerRef}
        type="button"
        className="torque-inspection__toggle"
        aria-expanded={open}
        aria-controls="torque-inspection-detail"
        onClick={() => {
          if (open) { playback?.close(); triggerRef.current?.focus({ preventScroll: true }) }
          else if (live) playback?.open()
          setOpen(!open)
        }}
      >
        {open ? 'Hide cutter inspection details' : 'Open cutter inspection details'}
      </button>
      <div
        id="torque-inspection-detail"
        className="torque-inspection__panel"
        role="region"
        aria-label="Cutter inspection details"
        hidden={!open}
      >
        <p>
          The inspection subject is the Input Shaft, P001835: the 10-tooth sun gear drawn in
          Detail B. Its story runs from the relief groove that started it, through the material
          attempts in 4140, 4340 and C300, the switch from shaping to hobbing, the runout hold,
          and the supports that moved so the finished shaft runs true.
        </p>
        {live && <div className="torque-inspection__playback">
          <button type="button" onClick={() => playback?.play()}>Play shaft study</button>
          <button type="button" onClick={() => playback?.pause()}>Pause shaft study</button>
          <label>Study position
            <input ref={seekRef} type="range" min="0" max="100" defaultValue="0"
              onChange={event => playback?.seek(Number(event.currentTarget.value) / 100)} />
          </label>
        </div>}
      </div>
    </div>
  )
}

export function Story({ playback, live }: { playback?: InspectionPlayback; live?: boolean }) {
  return (
    <article
      id="torque-story"
      className="torque-story"
      aria-labelledby="torque-story-heading"
      tabIndex={-1}
    >
      <h2 id="torque-story-heading" className="torque-sr">
        The JGUN story, five chapters
      </h2>
      {TORQUE_POSTER_CHAPTERS.map((chapter, index) => {
        const copy = CHAPTER_COPY[chapter.id]
        return (
          <section key={chapter.id} className="torque-chapter" data-torque-chapter={chapter.id} aria-labelledby={`torque-chapter-${chapter.id}-title`}>
            <p className="torque-chapter__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 id={`torque-chapter-${chapter.id}-title`} className="torque-chapter__title">
              {copy.title}
            </h3>
            <p className="torque-chapter__lede">{copy.lede}</p>
            <p className="torque-chapter__body">{copy.body}</p>
            {chapter.id === 'inspection' && <InspectionControl playback={playback} live={live} />}
          </section>
        )
      })}
    </article>
  )
}

export default Story
