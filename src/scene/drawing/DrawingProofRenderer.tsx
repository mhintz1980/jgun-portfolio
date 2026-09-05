import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  DepthTexture,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getQuality } from '../../state/qualityStore'
import { drawingRuntime } from './extractionPose'

/**
 * Proof-only independent live-mesh render.
 *
 * The registration claim ("the print and the model are the same object seen two ways") is
 * only worth something if the model half of the comparison is rendered from the LIVE scene
 * meshes through the LIVE camera, never from the saved drawing geometry. This pass does
 * that: it rebuilds the model's silhouette/edge image from `rig.meshes` on demand and
 * blits it full-screen so a headless probe can diff the two images pixel for pixel.
 *
 * Inert unless `__drawingProofMode` is set; real sessions never enter the branch.
 */
export function DrawingProofRenderer({
  meshes,
  modelFrame,
}: {
  meshes: Mesh[]
  modelFrame: React.RefObject<Group | null>
}) {
  const { gl, camera, scene, size } = useThree()

  const pass = useMemo(() => {
    const source = new WebGLRenderTarget(size.width, size.height, { depthBuffer: true })
    source.depthTexture = new DepthTexture(size.width, size.height)
    const geometry = new PlaneGeometry(2, 2)
    const screen = new Scene()
    const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 2)
    ortho.position.z = 1
    const material = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        source: { value: source.texture },
        depth: { value: source.depthTexture },
        texel: { value: new Vector2(1 / size.width, 1 / size.height) },
        edges: { value: 0 },
        threshold: { value: 0.003 },
      },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}',
      fragmentShader: `
      uniform sampler2D source,depth;uniform vec2 texel;uniform float edges,threshold;varying vec2 vUv;
      void main(){vec3 c=texture2D(source,vUv).rgb;
        if(edges>.5){float d=texture2D(depth,vUv).r;
          float e=max(max(abs(d-texture2D(depth,vUv+vec2(texel.x,0.)).r),abs(d-texture2D(depth,vUv-vec2(texel.x,0.)).r)),max(abs(d-texture2D(depth,vUv+vec2(0.,texel.y)).r),abs(d-texture2D(depth,vUv-vec2(0.,texel.y)).r)));
          c=vec3(max(step(threshold,e),step(.08,length(c))));}
        gl_FragColor=vec4(c,1.);
      }`,
    })
    screen.add(new Mesh(geometry, material))
    return { source, screen, ortho, material, geometry, key: '' }
  }, [size.width, size.height])

  useEffect(
    () => () => {
      pass.source.dispose()
      pass.geometry.dispose()
      pass.material.dispose()
    },
    [pass],
  )

  useFrame(() => {
    const mode = (window as unknown as Record<string, string | undefined>).__drawingProofMode ?? 'normal'
    if (mode === 'normal') {
      pass.key = ''
      // A positive-priority proof hook owns the final render. Normally the composer
      // has already rendered; reduced motion has no composer and needs its static frame.
      if (getQuality().reducedMotion) gl.render(scene, camera)
      if (drawingRuntime.captureNext) {
        const capture = drawingRuntime.captureNext
        drawingRuntime.captureNext = null
        capture()
      }
      return
    }

    const drawing = drawingRuntime.rendered
    if (!drawing) return
    const model = mode.startsWith('model')
    const edges = mode.endsWith('edges')
    scene.updateMatrixWorld(true)
    const captureKey =
      mode +
      camera.matrixWorld.elements.join(',') +
      camera.projectionMatrix.elements.join(',') +
      (modelFrame.current?.matrixWorld.elements.join(',') ?? '')

    if (model && pass.key !== captureKey && modelFrame.current) {
      scene.updateMatrixWorld(true)
      const inverseFrame = modelFrame.current.matrixWorld.clone().invert()
      const parts: BufferGeometry[] = meshes.map((mesh) => {
        const g = mesh.geometry.clone()
        for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name)
        g.applyMatrix4(new Matrix4().multiplyMatrices(inverseFrame, mesh.matrixWorld))
        if (g.index) {
          const expanded = g.toNonIndexed()
          g.dispose()
          return expanded
        }
        return g
      })
      const geometry = mergeGeometries(parts)!
      const lineGeometry = new EdgesGeometry(geometry, 22)
      parts.forEach((g) => g.dispose())
      const solidMaterial = new MeshBasicMaterial({
        color: edges ? 0x000000 : 0xffffff,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        toneMapped: false,
      })
      const lineMaterial = new LineBasicMaterial({
        color: 0xffffff,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      })
      const isolated = new Scene()
      const solid = new Mesh(geometry, solidMaterial)
      const line = new LineSegments(lineGeometry, lineMaterial)
      line.renderOrder = 1
      line.visible = edges
      const liveFrame = new Group()
      liveFrame.matrixAutoUpdate = false
      liveFrame.matrix.copy(modelFrame.current.matrixWorld)
      liveFrame.add(solid, line)
      isolated.add(liveFrame)

      const clear = gl.getClearColor(new Color())
      const alpha = gl.getClearAlpha()
      const viewport = gl.getViewport(new Vector4())
      const oldTarget = gl.getRenderTarget()
      const auto = gl.autoClear
      // Keep live camera XY projection/world pose. Normalize ONLY the proof depth
      // range to the drawing's 3.99 m span so polygon-offset depth precision agrees.
      // This does not translate, align, dilate or resample either image.
      const proofCamera = camera.clone()
      const projection = proofCamera.projectionMatrix.elements
      const near = camera.position.y - drawingRuntime.modelMatrix.elements[13] - 2 + 0.01
      const far = near + 3.99
      const w = projection[15]
      projection[10] = ((-2 / (far - near)) * w)
      projection[14] = ((-(far + near) / (far - near)) * w)
      proofCamera.projectionMatrixInverse.copy(proofCamera.projectionMatrix).invert()
      gl.autoClear = true
      gl.setRenderTarget(pass.source)
      gl.setViewport(0, 0, size.width, size.height)
      gl.setClearColor(0x000000, 1)
      gl.render(isolated, proofCamera)
      gl.setRenderTarget(oldTarget)
      gl.setViewport(viewport)
      gl.setClearColor(clear, alpha)
      gl.autoClear = auto
      geometry.dispose()
      lineGeometry.dispose()
      solidMaterial.dispose()
      lineMaterial.dispose()
      pass.key = captureKey
    }

    if (!model) {
      pass.key = ''
      // DRAWING half of the comparison. The sheet fills 92% of viewport height and ~67% of
      // its width, so the mask texture must be seen ON THE SHEET through the live camera —
      // blitting it full-screen would stretch sheet space onto screen space and compare two
      // different framings. Everything except the drawing plane is hidden for the capture.
      const hidden: Object3D[] = []
      for (const child of scene.children) {
        if (child.name === 'engineering-drawing-plane-frame' || child.visible === false) continue
        if (child.getObjectByName('engineering-drawing-plane-frame')) continue
        child.visible = false
        hidden.push(child)
      }
      const clear = gl.getClearColor(new Color())
      const alpha = gl.getClearAlpha()
      const auto = gl.autoClear
      gl.autoClear = true
      gl.setRenderTarget(null)
      gl.setClearColor(0x000000, 1)
      gl.render(scene, camera)
      gl.setClearColor(clear, alpha)
      gl.autoClear = auto
      for (const child of hidden) child.visible = true
      return
    }

    pass.material.uniforms.source.value = pass.source.texture
    pass.material.uniforms.edges.value = edges ? 1 : 0
    const auto = gl.autoClear
    gl.autoClear = true
    gl.setRenderTarget(null)
    gl.render(pass.screen, pass.ortho)
    gl.autoClear = auto
  }, 2)

  return null
}
