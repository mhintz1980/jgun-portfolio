import { Color, DoubleSide, Mesh, MeshBasicMaterial, Vector2, Vector3, WebGLRenderTarget, type Object3D, type Scene, type Camera, type WebGLRenderer } from 'three'

/** On-demand beauty A/B contribution, with actual depth/sort/occlusion. No frame-loop allocations. */
export function captureVisibilityContribution(gl: WebGLRenderer, scene: Scene, camera: Camera, nodes: readonly Object3D[], individual = false, controls = false) {
  const size = gl.getDrawingBufferSize(new Vector2())
  const width = Math.min(640, size.x), height = Math.max(1, Math.round(width * size.y / size.x))
  const target = new WebGLRenderTarget(width, height), previous = gl.getRenderTarget()
  const before = new Uint8Array(width * height * 4), after = new Uint8Array(before.length)
  const states = nodes.map(node => node.visible)
  const render = (pixels: Uint8Array) => {
    gl.setRenderTarget(target); gl.clear(); gl.render(scene, camera)
    gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
  }
  const difference = () => {
    let pixels = 0, minX = width, minY = height, maxX = -1, maxY = -1
    for (let i = 0; i < before.length; i += 4) {
      if (Math.max(Math.abs(before[i] - after[i]), Math.abs(before[i + 1] - after[i + 1]), Math.abs(before[i + 2] - after[i + 2])) <= 2) continue
      const x = (i / 4) % width, y = height - 1 - Math.floor(i / 4 / width)
      pixels++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    return { pixels, fraction: pixels / (width * height), rect: pixels ? [minX, minY, maxX + 1, maxY + 1] : null }
  }
  try {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true)
    render(before)
    for (const node of nodes) node.visible = false
    render(after)
    const union = difference()
    nodes.forEach((node, i) => { node.visible = states[i] })
    const occurrences = individual ? nodes.map(node => {
      const visible = node.visible
      try { node.visible = false; render(after); return { name: node.name, uuid: node.uuid, part: node.userData.partNumber ?? null, ...difference() } }
      finally { node.visible = visible }
    }) : []
    if (controls) {
      const meshes: Array<{ mesh: Mesh; visible: boolean }> = []
      scene.traverse(object => { if (object instanceof Mesh) meshes.push({ mesh: object, visible: object.visible }) })
      const ancestors = new Map<Object3D, boolean>()
      const mask = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide })
      const background = scene.background, clearColor = gl.getClearColor(new Color()), clearAlpha = gl.getClearAlpha()
      try {
        for (const entry of meshes) entry.mesh.visible = false
        // Neutral grey also measures dark oxide/anodize as a silhouette; black-on-black would
        // confuse a correctly rendered dark interior with a missing occurrence.
        scene.background = null; gl.setClearColor(0x404040, 1)
        render(before)
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (!(node instanceof Mesh)) throw new Error('Occurrence control requires an individual mesh')
          let ancestor: Object3D | null = node, ancestorsVisible = true
          while (ancestor) {
            if (!ancestors.has(ancestor)) ancestors.set(ancestor, ancestor.visible)
            // Mesh visibility was saved before hiding the control scene.
            const original = ancestor === node ? states[i] : ancestors.get(ancestor)!
            ancestorsVisible &&= original
            ancestor.visible = true; ancestor = ancestor.parent
          }
          const source = node.material, materials = Array.isArray(source) ? source : [source]
          const appliedOpacity = Math.max(...materials.map(material => material.opacity))
          const rect = [Infinity, Infinity, -Infinity, -Infinity], point = new Vector3()
          const positions = node.geometry.getAttribute('position')
          for (let j = 0; j < positions.count; j++) {
            point.fromBufferAttribute(positions, j).applyMatrix4(node.matrixWorld).project(camera)
            if (point.z < -1 || point.z > 1) continue
            const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2
            rect[0] = Math.min(rect[0], x); rect[1] = Math.min(rect[1], y); rect[2] = Math.max(rect[2], x); rect[3] = Math.max(rect[3], y)
          }
          try {
            render(after); const alpha = difference()
            node.material = mask
            mask.side = materials[0].side; render(after); const frontFace = difference()
            mask.side = DoubleSide; render(after); const identity = difference()
            Object.assign(occurrences[i], { control: { alphaPixels: alpha.pixels, alphaRect: alpha.rect,
              maskPixels: identity.pixels, maskRect: identity.rect, projectedRect: rect.every(Number.isFinite) ? rect : null,
              frontFacePixels: frontFace.pixels, frontFaceRect: frontFace.rect, sourceSide: materials[0].side,
              geometricallyVisible: identity.pixels > 0, ancestorsVisible, appliedOpacity } })
          } finally { node.material = source; node.visible = false }
        }
      } finally {
        ancestors.forEach((visible, node) => { node.visible = visible })
        for (const entry of meshes) entry.mesh.visible = entry.visible
        scene.background = background; gl.setClearColor(clearColor, clearAlpha); mask.dispose()
      }
    }
    return { width, height, threshold: 2, union, occurrences, meshes: nodes.reduce((sum, node) => {
      let count = 0; node.traverse(object => { if (object instanceof Mesh) count++ }); return sum + count
    }, 0) }
  } finally {
    nodes.forEach((node, i) => { node.visible = states[i] })
    gl.setRenderTarget(previous); target.dispose()
  }
}
