// The persistent semantic DOM story: five ordered chapters with real headings and copy from the
// accepted design, plus the keyboard-accessible DOM inspection control. The page mounts Story
// exactly once, outside every tier/failure conditional, so focus and state survive transitions.
import { useEffect, useRef, useState } from 'react'
import { TORQUE_POSTER_CHAPTERS, type TorquePosterChapterId } from './posterMap'

const CHAPTER_COPY: Record<TorquePosterChapterId, { title: string; lede: string; body: string }> = {
  drafting: {
    title: 'Drafting',
    lede: 'The registered drawing.',
    body: 'The wrench begins as an engineering drawing: an intact sheet, handwritten annotations, and a traced profile held in a calm, registered view.',
  },
  breakthrough: {
    title: 'Breakthrough',
    lede: 'The model breaks through the sheet.',
    body: 'The solid model pushes up through the opaque paper. The printed sheet fractures along the traced profile, and the wrench rises continuously through the opening it has made.',
  },
  mechanism: {
    title: 'Mechanism',
    lede: 'How the wrench works.',
    body: 'Inside the housing, the gear train, the clutch, and the extraction sequence present each stage of the assembly in its measured order.',
  },
  inspection: {
    title: 'Inspection',
    lede: 'Slow the subject, keep the camera alive.',
    body: 'The input-shaft cutter is inspected in bullet time: the subject nearly stops while the camera keeps moving at normal speed around it.',
  },
  close: {
    title: 'Close',
    lede: 'Ownership and next action.',
    body: 'The sequence settles on the finished wrench over the pit as the last of the unified lightning fades, and the story hands off to the live pages below.',
  },
}

function InspectionControl() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="torque-inspection">
      <button
        ref={triggerRef}
        type="button"
        className="torque-inspection__toggle"
        aria-expanded={open}
        aria-controls="torque-inspection-detail"
        onClick={() => setOpen((value) => !value)}
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
      </div>
    </div>
  )
}

export function Story() {
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
          <section key={chapter.id} className="torque-chapter" aria-labelledby={`torque-chapter-${chapter.id}-title`}>
            <p className="torque-chapter__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 id={`torque-chapter-${chapter.id}-title`} className="torque-chapter__title">
              {copy.title}
            </h3>
            <p className="torque-chapter__lede">{copy.lede}</p>
            <p className="torque-chapter__body">{copy.body}</p>
            {chapter.id === 'inspection' && <InspectionControl />}
          </section>
        )
      })}
    </article>
  )
}

export default Story
