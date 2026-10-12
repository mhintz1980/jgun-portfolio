// Poster presentation layer for the poster tier and the scene-failure fallback. Story stays
// mounted by the page in every tier; this layer only carries the art. Stage 1 has no offline
// renders, so every chapter renders a labeled placeholder — no invented asset paths, no canvas,
// no narrative CAD downloads.
import { PosterImage } from '../../shared/PosterImage'
import { posterFor } from '../../shared/poster'
import { TORQUE_POSTER_CHAPTERS, torquePosterMap } from './posterMap'

export function TorquePoster() {
  return (
    <div className="torque-posters">
      {TORQUE_POSTER_CHAPTERS.map((chapter) => {
        const entry = posterFor(torquePosterMap, chapter.id)
        if (entry) return <PosterImage key={chapter.id} entry={entry} className="torque-poster" />
        return (
          <figure
            key={chapter.id}
            className="torque-poster-slot"
            data-torque-poster={chapter.id}
            data-torque-poster-pending="stage-6"
          >
            <figcaption>{chapter.label} poster — pending Stage 6 offline render</figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export default TorquePoster
