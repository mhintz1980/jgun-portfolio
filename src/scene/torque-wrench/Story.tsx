// The persistent semantic DOM story: five ordered chapters with real headings and copy from the
// accepted design, plus the keyboard-accessible DOM inspection control. The page mounts Story
// exactly once, outside every tier/failure conditional, so focus and state survive transitions.
import { useEffect, useRef, useState } from 'react'
import { TORQUE_POSTER_CHAPTERS, type TorquePosterChapterId } from './posterMap'
import type { InspectionPlayback } from './inspectionPlayback'

/** Shared with TorqueHUD (JG-040): one source of truth for chapter display copy. */
export const CHAPTER_COPY: Record<TorquePosterChapterId, { title: string; lede: string; body: string }> = {
  drafting: {
    title: 'Paper Before Steel',
    lede: 'Every datum and fit is settled on the print before a blank reaches the spindle.',
    body: 'Mark Hintz’s third-angle layout of the industrial-grade pneumatic torque wrench: input shaft, five-stage planetary drivetrain and two-speed clutch. The red-ink notes record the shop-floor revisions behind the geometry.',
  },
  breakthrough: {
    title: 'Off the Vellum',
    lede: 'The 1:1 side elevation becomes the three-dimensional assembly it describes.',
    body: 'Light traces the side elevation, the sheet fractures, and the wrench rises through its own 1:1 profile: housing, controls and five-stage drivetrain in three dimensions.',
  },
  mechanism: {
    title: 'Two Speeds, One Collar',
    lede: 'A 120° throw shifts the planetary carrier between fast rundown and final torque.',
    body: 'The ring switch (P003068) is diamond-knurled on the OD, then Type III black-anodized for grip. A 120° turn selects Rundown or High Torque; detent grooves hold each mode. OSHA Blue marks Rundown; OSHA Red marks High Torque.',
  },
  inspection: {
    title: 'The Relief-Groove Failure',
    lede: 'Changing alloys couldn’t save a bad stress riser. Changing the cutter did.',
    body: 'Shaping the P001835 sun gear needed a cutter relief groove, and at that groove every steel tried (4140, 4340, C300) fell below FOS 1.0. Rotary hobbing needs no groove: a smooth 4340 blank, teeth held under .001″ TIR across the .250″ face.',
  },
  close: {
    title: 'Five Stages in Line',
    lede: 'Five planetary reductions stack along one datum axis to multiply input to 1,100 ft-lb.',
    body: 'The gearbox separates along its axis: carriers, planets, bearing and clutch in assembly order. Every gear was cut in house to ISO 1328 Grade A6 with under .001″ TIR. The clutch housing fit, ⌀2.525″ H7/k6, is finished after heat treat.',
  },
}

/** Exported for TorqueHUD (JG-040): in live mode the HUD mounts the only instance. */
export function InspectionControl({ playback, live }: { playback?: InspectionPlayback; live?: boolean }) {
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
        {open ? 'Hide cutter study' : 'Cutter study details'}
      </button>
      <div
        id="torque-inspection-detail"
        className="torque-inspection__panel"
        role="region"
        aria-label="Cutter inspection details"
        hidden={!open}
      >
        <p>
          Input shaft P001835 carries the 10-tooth sun gear from Detail B. Shaping it needed a
          relief groove for the cutter, and that groove held the minimum FOS below 1.0 in 4140,
          4340 and C300. Rotary hobbing needs no groove, so the revised shaft keeps a smooth blank.
          After the runout check, the Stage 1 carrier (A000591) slides four 12-tooth P000247
          planets onto the sun for full .250″ face width, and torque runs through the five stages
          to the square drive. Gear speeds in this study are slowed for viewing.
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
    // JG-040: in live mode the fixed TorqueHUD is the story's complete visible equivalent, so
    // the flowing article goes visually hidden + inert (pacing grid, semantics and static-mode
    // presentation are untouched; visibility keeps the grid tracks that pace the document).
    <article
      id="torque-story"
      className="torque-story"
      aria-labelledby="torque-story-heading"
      tabIndex={-1}
      inert={live || undefined}
      aria-hidden={live || undefined}
    >
      <h2 id="torque-story-heading" className="torque-sr">
        The torque wrench story, five chapters
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
            {chapter.id === 'inspection' && !live && <InspectionControl playback={playback} live={live} />}
          </section>
        )
      })}
    </article>
  )
}

export default Story
