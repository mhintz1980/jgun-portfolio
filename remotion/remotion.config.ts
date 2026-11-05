import path from 'node:path'
import { Config } from '@remotion/cli/config'

// The film reads the site's public/ folder directly (models, renders, fonts) — no copies.
Config.setPublicDir(path.join(process.cwd(), '..', 'public'))
Config.setEntryPoint('src/index.ts')
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(95)
Config.setOverwriteOutput(true)
// No GPU in CI/sandbox: ANGLE→SwiftShader ('swangle') is the WebGL path that works for headless renders.
Config.setChromiumOpenGlRenderer('swangle')
Config.setDelayRenderTimeoutInMilliseconds(240000)

// The scenes import the site's own rig code from ../src (one source of truth for the explosion
// ladder, materials and the RL300 sequence). Pin the shared libraries to this package's copies
// so the site files and the film share one three / React / R3F instance.
const here = (m: string) => path.join(process.cwd(), 'node_modules', m)
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      three$: here('three'),
      'three/examples': here('three/examples'),
      'three/addons': here('three/examples/jsm'),
      '@react-three/fiber$': here('@react-three/fiber'),
      react$: here('react'),
      'react-dom$': here('react-dom'),
      'react/jsx-runtime$': here('react/jsx-runtime'),
    },
  },
}))
