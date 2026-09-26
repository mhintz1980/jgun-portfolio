import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, CatmullRomCurve3, DoubleSide, Group, Mesh, MeshStandardMaterial, Plane, TubeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { SectionCaps } from './SectionCaps'
import type { PreviewControl } from './QuietMachineScene'

/** Authored concept, Y-up metres. Liner replaces the exact registered CAD part. */
export function createLowerIntake(plane?: Plane) {
  const group = new Group(); group.name = 'PROPOSED_LOWER_INTAKE'
  // Owner's Blender moves (2026-09-24, pure translations): skid bay (0,+.205,+.150), then .120 toward the
  // engine (-z) so the louver frame clears the skid's perimeter square tube.
  group.position.set(0, .205, .03)
  const metal = new MeshStandardMaterial({ color: '#6e97ad', metalness: .65, roughness: .32 })
  const dark = new MeshStandardMaterial({ color: '#376279', metalness: .4, roughness: .44, emissive: '#163d4e', emissiveIntensity: .35 })
  // Sectioned with the enclosure: the same live cut plane, so the louvers, collector and duct
  // open along with the shell and the lower supply reads inside them.
  if (plane) for (const m of [metal, dark]) { m.clippingPlanes = [plane]; m.clipShadows = true; m.side = DoubleSide }
  const pieces: BoxGeometry[] = []
  const add = (size: [number, number, number], pos: [number, number, number], angle = 0) => {
    const g = new BoxGeometry(...size); g.rotateX(angle); g.translate(...pos); pieces.push(g)
  }
  // Owner ruling 2026-09-24: four louvers, frame trimmed from the forward (+z) end. Aft edge still
  // on the V2RL300-SAF-1047-5 boundary (x ±.378, z .449), underside.
  const linerY = -.033
  add([.756, .018, .028], [0, linerY, .462]); add([.756, .018, .028], [0, linerY, .733])
  add([.028, .018, .271], [-.364, linerY, .5975]); add([.028, .018, .271], [.364, linerY, .5975])
  for (let i = 0; i < 4; i++) add([.70, .008, .042], [0, linerY, .505 + i * .061], -Math.PI / 7)
  const louvers = mergeGeometries(pieces)!; pieces.forEach(g => g.dispose()); pieces.length = 0
  const liner = new Mesh(louvers, metal); liner.name = 'V2RL300-SAF-1047-5_PROPOSED_LOUVERS'; group.add(liner)
  // Open-bottom collector -> shallow connecting duct -> upward outlet under equipment.
  // One side deliberately sectioned for the blockout view. No CFD claim.
  add([.012, .16, .245], [-.32, .06, .5975]); add([.012, .16, .245], [.32, .06, .5975])
  add([.65, .16, .012], [0, .06, .714])
  add([.42, .012, .92], [0, -.015, .13])
  add([.012, .15, .92], [-.21, .06, .13])
  add([.42, .012, .62], [0, .135, .28])
  add([.012, .31, .27], [-.21, .14, -.32])
  add([.42, .31, .012], [0, .14, -.45])
  const duct = mergeGeometries(pieces)!; pieces.forEach(g => g.dispose())
  const ductMesh = new Mesh(duct, dark); ductMesh.name = 'PROPOSED_COLLECTOR_DUCT_OUTLET'; group.add(ductMesh)
  const routes: TubeGeometry[] = []
  let routeMaterial: MeshStandardMaterial | undefined
  const showSchematic = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('schematic') === '1'
  if (showSchematic) {
    routeMaterial = new MeshStandardMaterial({ color: '#93e3fa', emissive: '#62cdeb', emissiveIntensity: .7, roughness: .6 })
    for (const x of [-.12, .12]) {
      const curve = new CatmullRomCurve3([
        new Vector3(x, -.17, .66), new Vector3(x, .02, .66), new Vector3(x, .08, .52),
        new Vector3(x, .06, .18), new Vector3(x, .08, -.26), new Vector3(x, .37, -.32),
      ])
      const geometry = new TubeGeometry(curve, 48, .008, 6, false)
      const mesh = new Mesh(geometry, routeMaterial); mesh.name = 'LOWER_SUPPLY_SCHEMATIC'; group.add(mesh)
      routes.push(geometry)
    }
  }
  group.traverse(o => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true } })
  const sections = [{ name: 'PROPOSED_LOUVERS', geometry: louvers }, { name: 'PROPOSED_COLLECTOR_DUCT', geometry: duct }]
  return { group, sections, dispose() { louvers.dispose(); duct.dispose(); metal.dispose(); dark.dispose(); routes.forEach(g => g.dispose()); routeMaterial?.dispose() } }
}

export function LowerIntake({ plane, control }: { plane: Plane; control: PreviewControl }) {
  const intake = useMemo(() => createLowerIntake(plane), [plane])
  const caps = useRef<Group>(null)
  useEffect(() => () => intake.dispose(), [intake])
  useFrame(() => { if (caps.current) caps.current.visible = control.caps })
  // Caps live inside the translated group (their bounds are group-local); orders sit ahead of the enclosure's.
  return <primitive object={intake.group} dispose={null}>
    <group ref={caps}><SectionCaps sections={intake.sections} plane={plane} order={-60} /></group>
  </primitive>
}
