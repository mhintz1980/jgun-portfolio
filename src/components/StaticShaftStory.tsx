import {
  SHAFT_ATTRIBUTION_TEXT, SHAFT_CARD_TEXT, SHAFT_STAMP_TEXT, SHAFT_STRESS_CAPTION_TEXT,
} from '../scene/inspection/shaft/script'
import { SHAFT_TRANSCRIPT } from './ShaftStoryLayer'
import './ShaftStoryLayer.css'

type StillId = 'cutter-exit' | 'material-attempts' | 'revised-blank' | 'hobbed' | 'cool-stress'
  | 'support-before' | 'support-after' | 'assembled-finale'

function ShaftStill({ id, alt, caption }: { id: StillId; alt: string; caption: string }) {
  return <figure className="shaft-static-still" data-shaft-still={id}>
    <picture>
      <source media="(max-width: 600px)" srcSet={`/inspection/shaft/${id}-narrow.webp`} />
      <img src={`/inspection/shaft/${id}-desktop.webp`} alt={alt} loading="lazy" decoding="async" width="960" height="600" />
    </picture>
    <figcaption>{caption}</figcaption>
  </figure>
}

/** Rendered stills and authored text only: this fallback never mounts a canvas or loads CAD. */
export function StaticShaftStory() {
  return <div className="shaft-static shaft-static-sequence" data-static-shaft-story="">
    <p className="shaft-static-intro">A still-image study · read at your own pace</p>
    <div data-shaft-transcript="">
      <section className="shaft-static-chapter" aria-labelledby="shaft-static-groove">
        <p className="shaft-static-number" aria-hidden="true">01 / CUTTER CLEARANCE</p>
        <h3 id="shaft-static-groove">{SHAFT_TRANSCRIPT[0].heading}</h3>
        <p>{SHAFT_TRANSCRIPT[0].body}</p>
        <div data-static-part="cutter-exit">
          <ShaftStill id="cutter-exit" alt="Rendered cutter-exit view of the original grooved shaft: the disc shaper passes the end of the tooth face beside the relief groove." caption="The relief gives the cutting edge room to leave the tooth face." />
        </div>
      </section>

      <section className="shaft-static-chapter" aria-labelledby="shaft-static-materials" data-static-part="failed-materials">
        <p className="shaft-static-number" aria-hidden="true">02 / MATERIAL ATTEMPTS</p>
        <h3 id="shaft-static-materials">{SHAFT_TRANSCRIPT[1].heading}</h3>
        <p>{SHAFT_TRANSCRIPT[1].body}</p>
        <ShaftStill id="material-attempts" alt="Rendered original grooved shaft retained for the three earlier material attempts, with a warm illustrative field around the relief." caption={SHAFT_STRESS_CAPTION_TEXT} />
        <ol className="shaft-static-materials" aria-label="Three earlier material attempts">
          {(['4140', '4340', 'c300'] as const).map(id => <li key={id}>
            <span className="shaft-static-alloy">{SHAFT_CARD_TEXT[id]}</span>
            <span className="shaft-static-failed">{SHAFT_STAMP_TEXT}</span>
          </li>)}
        </ol>
        <p className="shaft-static-attribution">{SHAFT_ATTRIBUTION_TEXT}</p>
      </section>

      <section className="shaft-static-chapter" aria-labelledby="shaft-static-process">
        <p className="shaft-static-number" aria-hidden="true">03 / A DIFFERENT PROCESS</p>
        <h3 id="shaft-static-process">{SHAFT_TRANSCRIPT[2].heading}</h3>
        <p>{SHAFT_TRANSCRIPT[2].body}</p>
        <div className="shaft-static-comparison" data-static-part="blank-hobbed" aria-label="Revised blank and hobbed shaft comparison">
          <ShaftStill id="revised-blank" alt="Rendered revised smooth shaft blank before rotary hobbing, with uncut material at the geared end." caption="Before · revised smooth blank" />
          <ShaftStill id="hobbed" alt="Rendered revised shaft after hobbing, showing the formed teeth and the retained section below the approved lead-out." caption="After · hobbed teeth and retained section" />
        </div>
        <p className="shaft-static-comparison-note">Two process views · the blank and finished teeth are shown from their authored inspection angles.</p>
        <div className="shaft-static-cool" data-static-part="cool-stress">
          <ShaftStill id="cool-stress" alt="Rendered revised shaft with a cool illustrative stress field below the gear; this is a visual explanation without calculated stress values." caption={SHAFT_STRESS_CAPTION_TEXT} />
          <p className="shaft-static-final-alloy">{SHAFT_CARD_TEXT['4340-ht']}</p>
        </div>
      </section>

      <section className="shaft-static-chapter" aria-labelledby="shaft-static-supports">
        <p className="shaft-static-number" aria-hidden="true">04 / SUPPORTS AND ASSEMBLY</p>
        <h3 id="shaft-static-supports">{SHAFT_TRANSCRIPT[3].heading}</h3>
        <p>{SHAFT_TRANSCRIPT[3].body}</p>
        <div className="shaft-static-comparison" data-static-part="support-comparison" aria-label="Support placement before and after the revision">
          <ShaftStill id="support-before" alt="Rendered section study at the start of support relocation, showing the bearing and retaining ring near the earlier placement beside the housing." caption="Before · start of support relocation" />
          <ShaftStill id="support-after" alt="Rendered section study after support relocation, with the bearing and retaining-ring pair at the approved placement beside the matching housing support." caption="After · support pair moved +2.75 mm" />
        </div>
        <p className="shaft-static-comparison-note">Same-camera study · the design moves the bearing and retaining ring together by +2.75 mm. The stills show the start of the move and its settled end.</p>
        <div data-static-part="assembled-finale">
          <ShaftStill id="assembled-finale" alt="Rendered revised assembly study with the input shaft, its relocated support pair, and the surrounding gear train returned around it." caption="The revised assembly study" />
        </div>
      </section>
    </div>
  </div>
}
