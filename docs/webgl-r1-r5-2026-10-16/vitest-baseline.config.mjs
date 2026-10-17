import { defineConfig, configDefaults } from 'vitest/config'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const owned = ['src/scene/SceneCanvas.tsx','src/scene/PostProcessingComposer.tsx','src/scene/rig/materials.ts','src/components/ToleranceStations.tsx','src/scene/TorqueWrenchHero.tsx']
const sources = new Map(owned.map(f => [path.join(root, f).replaceAll('\\', '/'), execFileSync('git', ['show', `1d66ff2b91e8a55d21ea1afb401a3ad995553f4a:${f}`], {cwd:root, encoding:'utf8'})]))
export default defineConfig({ root, plugins: [{ name:'pre-task-source-baseline', enforce:'pre', load(id) { return sources.get(id.split('?')[0].replaceAll('\\', '/')) ?? null } }], test: { exclude:[...configDefaults.exclude,'**/.scratch/**'], maxWorkers:2 } })
