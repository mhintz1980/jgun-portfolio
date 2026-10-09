import { createElement, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { ShaftStoryLayer } from '../../../../../../src/components/ShaftStoryLayer'
import { createShaftScriptFrame, sampleShaftScript } from '../../../../../../src/scene/inspection/shaft/script'

const completedFrame = () => new Promise(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(resolve))
})

function ProofHost() {
  const [props, setProps] = useState({ time: 15, reducedMotion: false })
  let apply = null
  apply = next => flushSync(() => setProps(previous => ({ ...previous, ...next })))
  window.__shaftStampApply = apply
  return createElement(ShaftStoryLayer, props)
}

export async function installShaftStampHarness() {
  await window.__shaftStampHarness?.dispose()
  const container = document.createElement('div')
  container.dataset.shaftStampProof = ''
  container.style.cssText = 'position:fixed;top:80px;right:0;width:420px;height:220px;z-index:2147483647;pointer-events:none;'
  document.body.append(container)
  const root = createRoot(container)
  root.render(createElement(ProofHost))
  await completedFrame()

  window.__shaftStampHarness = {
    async sample(requestedTime, reducedMotion, label) {
      window.__shaftStampApply({ time: requestedTime, reducedMotion })
      await completedFrame()
      const frame = createShaftScriptFrame()
      const sampled = sampleShaftScript(requestedTime, reducedMotion, frame)
      const stamp = container.querySelector('.shaft-story-layer .shaft-stamp')
      if (!stamp) {
        return {
          label, requestedTime, reducedMotion, stampState: sampled.stamp,
          expectedScale: sampled.stampScale, stampPresent: false, match: sampled.stamp === 'none',
          frameBarrier: 'React flushSync + two completed requestAnimationFrame callbacks',
        }
      }
      const computed = getComputedStyle(stamp)
      const matrix = computed.transform === 'none' ? null : new DOMMatrix(computed.transform)
      const computedScale = matrix ? Math.hypot(matrix.a, matrix.b) : null
      const computedAngleDeg = matrix ? Math.atan2(matrix.b, matrix.a) * 180 / Math.PI : null
      const animations = stamp.getAnimations({ subtree: true }).length
      const scaleDelta = computedScale === null ? null : computedScale - sampled.stampScale
      const angleDelta = computedAngleDeg === null ? null : computedAngleDeg - -4
      return {
        label, requestedTime, reducedMotion, stampState: sampled.stamp,
        expectedScale: sampled.stampScale, stampPresent: true,
        inlineTransform: stamp.style.transform, computedTransform: computed.transform,
        computedScale, computedAngleDeg, scaleDelta, angleDelta, animations,
        text: stamp.textContent, frameBarrier: 'React flushSync + two completed requestAnimationFrame callbacks',
        match: computedScale !== null && Math.abs(scaleDelta) <= 1e-3
          && computedAngleDeg !== null && Math.abs(angleDelta) <= 1e-3
          && animations === 0 && stamp.textContent === 'FAILED',
      }
    },
    async dispose() {
      root.unmount()
      container.remove()
      delete window.__shaftStampApply
      delete window.__shaftStampHarness
      await completedFrame()
    },
  }
  return window.__shaftStampHarness
}
