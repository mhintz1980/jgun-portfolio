// webpack 5's ESM `require.context`. Typed here (not via `declare const require`) because
// @types/node is visible to this project and would collide.
interface ImportMeta {
  webpackContext(
    dir: string,
    opts: { recursive?: boolean; regExp?: RegExp },
  ): { keys(): string[]; (key: string): string | { default: string } }
}
