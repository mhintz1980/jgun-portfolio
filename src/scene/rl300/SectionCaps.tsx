import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AlwaysStencilFunc, BackSide, BufferGeometry, DecrementWrapStencilOp, DoubleSide, FrontSide,
  Group, IncrementWrapStencilOp, MeshBasicMaterial, NotEqualStencilFunc, Plane, ReplaceStencilOp } from 'three'

export function createStencilMaterials(plane: Plane) {
    const back = new MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false,
      stencilWrite: true, stencilFunc: AlwaysStencilFunc, side: BackSide, clippingPlanes: [plane],
      stencilFail: IncrementWrapStencilOp, stencilZFail: IncrementWrapStencilOp, stencilZPass: IncrementWrapStencilOp })
    const front = back.clone(); front.side = FrontSide
    // Material.copy clones Plane objects. Both counters must follow the LIVE plane.
    front.clippingPlanes = [plane]
    front.stencilFail = front.stencilZFail = front.stencilZPass = DecrementWrapStencilOp
    return { back, front }
}

/** Root-level unions, never one stencil pass per CAD part. */
export function SectionCaps({ sections, plane }: { sections: { name: string; geometry: BufferGeometry }[]; plane: Plane }) {
  const ref = useRef<Group>(null)
  const measuredTarget = useRef('')
  const materials = useMemo(() => sections.map(() => createStencilMaterials(plane)), [sections, plane])
  const bounds = useMemo(() => sections.map(s => {
    s.geometry.computeBoundingBox()
    const box = s.geometry.boundingBox!
    return { y: (box.min.y + box.max.y) / 2, z: (box.min.z + box.max.z) / 2, width: box.max.z - box.min.z + .02, height: box.max.y - box.min.y + .02 }
  }), [sections])
  useEffect(() => () => materials.forEach(m => { m.back.dispose(); m.front.dispose() }), [materials])
  useFrame(() => {
    ref.current?.children.forEach(g => {
      const cap = g.children[2]
      cap.position.x = plane.constant
    })
  })
  return <group ref={ref}>{sections.map((section, i) => <group key={section.name}>
    <mesh geometry={section.geometry} material={materials[i].back} renderOrder={-30 + i * 3} dispose={null} />
    <mesh geometry={section.geometry} material={materials[i].front} renderOrder={-29 + i * 3} dispose={null} />
    <mesh name={`SECTION_CAP_${section.name}`} rotation={[0, Math.PI / 2, 0]} position={[plane.constant, bounds[i].y, bounds[i].z]}
      renderOrder={-28 + i * 3} onAfterRender={renderer => {
        const target = renderer.getRenderTarget()
        const probe = (window as any).__quietMachine
        const key = target ? `${target.texture.uuid}/${target.width}/${target.height}/${target.samples}` : 'canvas'
        // GL queries synchronize CPU/GPU. Measure allocation/resize, never every cap/frame.
        if (probe && measuredTarget.current !== key) {
          const ctx = renderer.getContext()
          probe.capTarget = { offscreen: !!target, stencil: target?.stencilBuffer ?? true,
            samples: target?.samples ?? 0, stencilBits: ctx.getParameter(ctx.STENCIL_BITS),
            complete: ctx.checkFramebufferStatus(ctx.FRAMEBUFFER) === ctx.FRAMEBUFFER_COMPLETE }
          measuredTarget.current = key
        }
        renderer.clearStencil()
      }}>
      <planeGeometry args={[bounds[i].width, bounds[i].height]} />
      <meshStandardMaterial color={section.name === 'COMPOSITE_PANELS' ? '#d5b98c' : '#9faeb7'}
        roughness={.65} metalness={.2} side={DoubleSide} stencilWrite stencilRef={0}
        stencilFunc={NotEqualStencilFunc} stencilFail={ReplaceStencilOp} stencilZFail={ReplaceStencilOp} stencilZPass={ReplaceStencilOp} />
    </mesh>
  </group>)}</group>
}
