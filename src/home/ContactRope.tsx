import { CONTACT } from './content'

// W4 stub: "pull to untangle" rope. Owns the [data-thread="end"] anchor where the thread arrives.
export default function ContactRope() {
  return (
    <div className="home-rope">
      <span className="home-rope-anchor" data-thread="end" aria-hidden="true" />
      <p className="home-rope-caption">{CONTACT.pull}</p>
    </div>
  )
}
