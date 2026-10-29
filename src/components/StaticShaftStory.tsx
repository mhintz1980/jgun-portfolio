import {
  SHAFT_ATTRIBUTION_TEXT, SHAFT_CARD_TEXT, SHAFT_STAMP_TEXT,
} from '../scene/inspection/shaft/script'
import { SHAFT_TRANSCRIPT } from './ShaftStoryLayer'
import './ShaftStoryLayer.css'

type StillId = 'cutter-exit' | 'material-attempts' | 'revised-blank' | 'hobbed' | 'cool-stress'
  | 'stage1-engagement' | 'bullet-time' | 'driveline-cascade'

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
        <ShaftStill id="material-attempts" alt="Rendered original grooved shaft retained for the three earlier material attempts, with a red-to-blue factor-of-safety field concentrated at the relief groove, the model block on the left and the FOS bar on the right." caption="Input Shaft: factor of safety below 1.0 at the groove for every attempt, lowest for 4140 and highest for C300." />
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
          <ShaftStill id="cool-stress" alt="Rendered revised shaft with a blue factor-of-safety field below the gear, the model block on the left and the blue end of the FOS bar on the right." caption="Revised, rotary hobbed: the field stays in the blue part of the scale." />
          <p className="shaft-static-final-alloy">{SHAFT_CARD_TEXT['4340-ht']}</p>
        </div>
      </section>

      <section className="shaft-static-chapter" aria-labelledby="shaft-static-cascade">
        <p className="shaft-static-number" aria-hidden="true">04 / ENGAGEMENT AND CASCADE</p>
        <h3 id="shaft-static-cascade">{SHAFT_TRANSCRIPT[3].heading}</h3>
        <p>{SHAFT_TRANSCRIPT[3].body}</p>
        <div data-static-part="stage1-engagement">
          <ShaftStill id="stage1-engagement" alt="Stage 1 carrier A000591 with four twelve-tooth P000247 planets seated over the ten-tooth input sun gear at full 6.35 mm face engagement." caption="Stage 1 · axial approach and full tooth engagement" />
        </div>
        <div data-static-part="bullet-time">
          <ShaftStill id="bullet-time" alt="Macro view of the sun-to-planet pitch point inside the stationary ring gear, illustrating torque ignition and planet counter-rotation at 0.10× bullet time." caption="Torque ignition · 0.10× bullet time reveals the tooth push" />
        </div>
        <div data-static-part="driveline-cascade">
          <ShaftStill id="driveline-cascade" alt="Close view along the drivetrain toward the rotating output. Stage 2 planets appear before their cage; the physical order remains 1, 2, 5 (A000606), 3 and 4 before the housing and handle return." caption="Driveline cascade · planets before cage, then toward the rotating output; the 8.0 to 1.43 ladder labels relative speeds." />
        </div>
      </section>
    </div>
  </div>
}
