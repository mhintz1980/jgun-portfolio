// Loader for armament clip frames: remotion/clips/armament/<id>/{line,shade}/f####.webp, bundled
// by webpack as asset URLs. Imported only by ui/ClipSpin.tsx (rules test), so frames reach the
// screen only through the labelled component. The frames are gitignored until the film review
// approves them; with no frames this context is empty and the bundle still builds.
const ctx = import.meta.webpackContext('../clips/armament', {
  recursive: true,
  regExp: /^\.\/[a-z0-9-]+\/(line|shade)\/f\d{4}\.webp$/,
})

export type ClipPass = 'line' | 'shade'

const url = (m: string | { default: string }) => (typeof m === 'string' ? m : m.default)

/** Sorted frame URLs for one pass of one clip (empty if the frames are not on disk). */
export function clipFrames(id: string, pass: ClipPass): string[] {
  const prefix = `./${id}/${pass}/`
  return ctx
    .keys()
    .filter((k) => k.startsWith(prefix))
    .sort()
    .map((k) => url(ctx(k)))
}
