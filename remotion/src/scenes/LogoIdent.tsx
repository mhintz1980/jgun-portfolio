import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile } from 'remotion'
import { FILM_LOGO } from '../logo'
import { Backdrop } from '../ui/Backdrop'
import { LineWipe, WIPE } from '../ui/LineWipe'

/** Paper frames after the wipe completes, so the loop seam lands on a settled blank sheet. */
const SETTLE = 6

export const LOGO_FRAMES = FILM_LOGO.frames + WIPE + SETTLE

// The StudioMark ident: the approved bumper plays muted, its lockup holds while the same
// orange cut line that joins the acts wipes the blank drafting sheet back in. The last frame
// is the film's first frame, so the hero still loops.
export function LogoIdent() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Freeze frame={FILM_LOGO.frames - 1} active={(f) => f >= FILM_LOGO.frames}>
        <OffthreadVideo src={staticFile(FILM_LOGO.src)} muted />
      </Freeze>
      <Sequence from={FILM_LOGO.frames} name="Back to paper">
        <LineWipe>
          <Backdrop />
        </LineWipe>
      </Sequence>
    </AbsoluteFill>
  )
}
