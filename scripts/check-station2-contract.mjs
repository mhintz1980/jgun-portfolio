import { readFile } from 'node:fs/promises'

const assetPath = new URL('../public/models/msp-enclosure.glb', import.meta.url)
const componentPath = new URL('../src/scene/stages/Station2_AcousticEnclosure.tsx', import.meta.url)
const stageManagerPath = new URL('../src/scene/StageManager.tsx', import.meta.url)

const requiredNodes = [
  'ENCLOSURE_CHASSIS',
  'COMPOSITE_PANELS',
  'PUMP_HOUSING',
  'ACOUSTIC_BAFFLES',
  'ISOLATION_MOUNTS',
  'DUCT_INTAKE',
  'DUCT_EXHAUST',
]

const asset = await readFile(assetPath)
const component = await readFile(componentPath, 'utf8')
const stageManager = await readFile(stageManagerPath, 'utf8')
const assetText = asset.toString('utf8')

if (asset.length === 0) throw new Error('Stage2 asset is empty')
if (!component.includes("'/models/msp-enclosure.glb'")) throw new Error('Station2 loader path is missing')
for (const node of requiredNodes) {
  if (!component.includes(`'${node}'`)) throw new Error(`Station2 node contract missing: ${node}`)
  if (!assetText.includes(node)) throw new Error(`GLB binary does not contain node name: ${node}`)
}
if (!stageManager.includes('<Station2_AcousticEnclosure />')) throw new Error('StageManager does not mount Station2')
if (stageManager.includes('WALL_LAYERS')) throw new Error('Procedural Stage2 placeholder remains in StageManager')
if (component.includes("'/models/rl300-skid.glb'")) throw new Error('Unexpected second Stage2 asset path')

console.log(`Stage2 contract passed: ${asset.length} bytes, ${requiredNodes.length} named roots, single GLB path.`)
