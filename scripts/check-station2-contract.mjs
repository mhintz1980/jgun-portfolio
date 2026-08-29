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

const spatialWorldPath = new URL('../src/scene/SpatialWorld.tsx', import.meta.url)
const spatialWorld = await readFile(spatialWorldPath, 'utf8')

if (asset.length === 0) throw new Error('Stage2 asset is empty')
if (!component.includes("'/models/msp-enclosure.glb'")) throw new Error('Station2 loader path is missing')
for (const node of requiredNodes) {
  if (!component.includes(`'${node}'`)) throw new Error(`Station2 node contract missing: ${node}`)
  if (!assetText.includes(node)) throw new Error(`GLB binary does not contain node name: ${node}`)
}
const airflowPath = new URL('../src/scene/stages/AirflowField.tsx', import.meta.url)
const acousticBafflePath = new URL('../src/scene/stages/AcousticBaffleField.tsx', import.meta.url)

const airflowText = await readFile(airflowPath, 'utf8')
const acousticBaffleText = await readFile(acousticBafflePath, 'utf8')

const stageWindowsPath = new URL('../src/scene/stages/stageWindows.ts', import.meta.url)
const stageWindows = await readFile(stageWindowsPath, 'utf8')

const expectedAnchors = [
  'enclosureChassis',
  'compositePanels',
  'pumpHousing',
  'acousticBaffles',
  'ductIntake',
  'ductExhaust',
  'isolationMounts',
]
for (const key of expectedAnchors) {
  if (!stageWindows.includes(key)) {
    throw new Error(`STATION2_CAD_ANCHORS missing anchor key: ${key}`)
  }
}

if (!spatialWorld.includes('<AcousticBaffleField />')) {
  throw new Error('SpatialWorld does not mount AcousticBaffleField')
}
if (!spatialWorld.includes('<AirflowField />')) {
  throw new Error('SpatialWorld does not mount AirflowField')
}
if (airflowText.length === 0 || acousticBaffleText.length === 0) {
  throw new Error('AirflowField or AcousticBaffleField component is empty')
}

console.log(`Stage2 contract passed: ${asset.length} bytes, ${requiredNodes.length} named roots, 7 CAD anchors verified, AirflowField & AcousticBaffleField mounted.`)

