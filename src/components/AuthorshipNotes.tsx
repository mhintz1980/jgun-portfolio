/**
 * JG-035 authorship — accessible identity + note transcript (owner revision O2/O4, 2026-10-07).
 *
 * The floating cream "post-it" identity plate and margin-note chips are gone: the animated drawing now
 * carries Mark's name, role, career block and handwritten notes ON THE PAPER (sheet/ownerAnnotations.ts),
 * registered to the sheet through every zoom, rake and reverse scroll. What remains here is
 *  - a visually hidden landmark (heading + plain-language transcript of the handwriting) so the page keeps
 *    its h1 and screen-reader/SEO content from first paint, before the GLB or the SDF lettering exist, and
 *  - the readable inline equivalent for poster / reduced-motion tiers, which never mount the canvas.
 * Both read the SAME strings as the sheet (OWNER_*), so the copy cannot drift from the drawing.
 */
import { OWNER_NOTES, OWNER_NOTE_TEXT, OWNER_TITLE } from '../scene/drawing/sheet/ownerAnnotations'

/** Public name only. */
const AUTHOR_NAME = 'Mark Hintz'

export function AuthorshipNotes() {
  return (
    <div className="authorship-layer sr-only" role="region" aria-label="Designer's identity and drawing notes">
      <h1>{AUTHOR_NAME}</h1>
      <p>{OWNER_TITLE.role}</p>
      <p>Handwritten on the drawing beside the input shaft detail: {OWNER_NOTE_TEXT.input}</p>
      <p>Handwritten beside the output shaft section: {OWNER_NOTE_TEXT.output}</p>
    </div>
  )
}

/**
 * Static equivalent, in the introductory card's reading flow at every viewport size.
 * Later static chapters omit it, so the personal notes leave with the introduction.
 */
export function AuthorshipInline() {
  return (
    <div className="authorship-inline">
      <h1 className="authorship-inline-name">{AUTHOR_NAME}</h1>
      <p className="authorship-inline-role">{OWNER_TITLE.role}</p>
      <div className="authorship-inline-notes">
        <p><strong>Input shaft.</strong> {OWNER_NOTES.input.lead.join(' ')} <s>{OWNER_NOTES.input.alloys[0]}</s>, <s>{OWNER_NOTES.input.alloys[1]}</s>, <s>{OWNER_NOTES.input.alloys[2]}</s>. {OWNER_NOTES.input.decision.join(' ')}</p>
        <p><strong>Output shaft.</strong> {OWNER_NOTES.output.join(' ')}</p>
      </div>
    </div>
  )
}
