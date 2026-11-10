import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import {
  AlwaysStencilFunc,
  EdgesGeometry,
  GreaterDepth,
  Group,
  KeepStencilOp,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  Plane,
  ReplaceStencilOp,
  Vector3,
} from 'three'
import { DRAFT } from './Draft'
import { prepareModel, SHELL_ROOTS } from '../../../src/scene/rl300/prepareModel'
import type { V16Map } from '../../../src/scene/rl300/v16Materials'
import v16Parts from '../../../src/scene/rl300/v16-part-materials.json'
import { SectionCaps } from '../../../src/scene/rl300/SectionCaps'
import { LowerIntake } from '../../../src/scene/rl300/LowerIntake'
import { AirRibbons, EQUIPMENT_MASK_STENCIL_REF } from '../../../src/scene/rl300/AirRibbons'
import type { PreviewControl } from '../../../src/scene/rl300/QuietMachineScene'
import { cutAt, CLOSED_CUT, DEEPEST_CUT } from '../../../src/scene/rl300/shot'
import { usePrepared } from './useGltf'
import { ReadyGate } from './ReadyGate'

type Prepared = ReturnType<typeof prepareModel>

// Same stencil tagging as the site's QuietMachineScene: equipment writes the mask the air
// ribbons test against, so air reads as passing around the machine, not through it.
function configureEquipmentStencil(group: Group) {
  group.traverse((object) => {
    if (!(object instanceof Mesh) || SHELL_ROOTS.has(object.userData.sourceRoot)) return
    object.renderOrder = Math.max(object.renderOrder, 1)
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      material.stencilWrite = true
      material.stencilRef = EQUIPMENT_MASK_STENCIL_REF
      material.stencilFunc = AlwaysStencilFunc
      material.stencilFail = KeepStencilOp
      material.stencilZFail = KeepStencilOp
      material.stencilZPass = ReplaceStencilOp
    }
  })
}

/** The plotter pre-roll, built once with the model (same method as Wrench.tsx): feature edges of
 *  the sealed shell only, so the drawing reads as the envelope, not an x-ray of the equipment.
 *  Every model material also gets the fill front APPENDED to its planes; the section plane that
 *  prepareModel put there stays, so the cut still works. */
function buildDraft(group: Group) {
  const lineMaterial = new LineBasicMaterial({ transparent: true, opacity: 0, clippingPlanes: [DRAFT.plot], depthWrite: false, toneMapped: false, fog: false })
  const hiddenMaterial = new LineBasicMaterial({ transparent: true, opacity: 0, clippingPlanes: [DRAFT.plot], depthWrite: false, toneMapped: false, fog: false, depthFunc: GreaterDepth })
  const depthOnly = new MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 })
  const materials = new Set<Material>()
  const shells: Mesh[] = []
  group.traverse((o) => {
    if (!(o instanceof Mesh)) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m)
    if (SHELL_ROOTS.has(o.userData.sourceRoot)) shells.push(o)
  })
  const lines: LineSegments[] = []
  const occluders: Mesh[] = []
  for (const mesh of shells) {
    const twin = new Mesh(mesh.geometry, depthOnly)
    twin.renderOrder = -1
    const geometry = new EdgesGeometry(mesh.geometry, 28)
    const edges = new LineSegments(geometry, lineMaterial)
    edges.renderOrder = 2
    const hidden = new LineSegments(geometry, hiddenMaterial)
    hidden.renderOrder = 3
    mesh.add(twin, edges, hidden)
    occluders.push(twin)
    lines.push(edges, hidden)
  }
  for (const m of materials) appendFill(m)
  return { lines, occluders, lineMaterial, hiddenMaterial }
}

/** Solid only left of the fill front; shadows too, or the floor shows the machine early. */
function appendFill(m: Material) {
  if (m.clippingPlanes?.includes(DRAFT.fill)) return
  m.clippingPlanes = [...(m.clippingPlanes ?? []), DRAFT.fill]
  m.clipShadows = true
  m.needsUpdate = true
}

export interface DraftPose {
  lineOpacity: number
  lineColor: string
  /** Opacity of the faint hidden-line pass, relative to lineOpacity. */
  hidden: number
}

/** The site's RL300 section study, driven by the film clock instead of scroll. `u` is the
 *  site's own study progress (src/scene/rl300/beats.ts); `cut` overrides the section depth.
 *  `draft` shows the plotter linework (fronts are set by <DraftFronts>). */
export function QuietMachine({ u, cut, caps = true, draft }: { u: number; cut?: number; caps?: boolean; draft?: DraftPose }) {
  const plane = useMemo(() => new Plane(new Vector3(-1, 0, 0), CLOSED_CUT), [])
  const control = useMemo<PreviewControl>(() => ({ u: 0, invalidate: () => {}, caps: true }), [])
  const [model, release] = usePrepared(
    ['models/msp-enclosure.glb', 'models/rl300-extra-parts.glb'],
    ([scene, extras]) => {
      const m = prepareModel(scene!, plane, { v16: v16Parts as unknown as V16Map, physical: true, extras: extras ?? undefined })
      configureEquipmentStencil(m.group)
      return Object.assign(m, { draft: buildDraft(m.group) })
    },
    'Quiet machine (msp-enclosure.glb)',
  )
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])
  // The site's lower intake builds its own materials (and casts a shadow): give them the fill
  // front from here, since ../src/scene/rl300 is not ours to edit.
  const intake = useRef<Group>(null)
  useLayoutEffect(() => {
    intake.current?.traverse((o) => {
      if (o instanceof Mesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) appendFill(m)
    })
  })

  // Written during render so every useFrame consumer (ribbons, caps) sees this frame's u.
  control.u = u
  control.caps = caps
  const c = cut ?? cutAt(u)
  plane.constant = CLOSED_CUT + (DEEPEST_CUT - CLOSED_CUT) * c

  if (model) {
    const d = model.draft
    const o = draft?.lineOpacity ?? 0
    d.lineMaterial.opacity = o
    d.lineMaterial.color.set(draft?.lineColor ?? '#ffffff')
    d.hiddenMaterial.color.copy(d.lineMaterial.color)
    d.hiddenMaterial.opacity = o * 0.22 * (draft?.hidden ?? 0)
    // Off entirely once the drawing is done: the depth twins are not section-clipped and
    // would block the cut.
    const show = o > 0.002
    for (const l of d.lines) l.visible = show
    for (const t of d.occluders) t.visible = show
  }

  return (
    <>
      {model && (
        <>
          <primitive object={model.group} dispose={null} />
          <SectionCaps sections={model.sections} plane={plane} />
        </>
      )}
      <group ref={intake}>
        <LowerIntake plane={plane} control={control} />
      </group>
      <AirRibbons control={control} plane={plane} />
      <ReadyGate ready={!!model} release={release} />
    </>
  )
}

export type { Prepared }
