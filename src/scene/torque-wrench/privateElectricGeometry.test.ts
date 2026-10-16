import { expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { makePrivateCrackGeometry } from './privateElectricGeometry'

it('grows connected forks from the enclosing contour without mutating cached seams', () => {
  const source = new BufferGeometry()
  // Trunk from contour to junction, two separate chains leaving that junction.
  const nodes = [[0, 0], [.005, 0], [.005, 0], [.01, .004], [.005, 0], [.01, -.004]]
  source.setAttribute('position', new Float32BufferAttribute(nodes.flatMap(([x, y]) => [x, y - .001, 0, x, y + .001, 0]), 3))
  source.setAttribute('arcLength', new Float32BufferAttribute(nodes.flatMap((_, i) => [i % 2, i % 2]), 1))
  source.setAttribute('crackId', new Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2], 1))
  const before = Array.from(source.getAttribute('arcLength').array)
  const a = makePrivateCrackGeometry(source, [[0, 0], [0, .03], [-.03, .03], [-.03, 0]])
  const growth = a.getAttribute('arcLength')
  expect(growth.getX(2)).toBe(growth.getX(4))
  expect(growth.getX(2)).toBe(growth.getX(8))
  expect(growth.getX(0)).toBeLessThan(growth.getX(2))
  expect(growth.getX(4)).toBeLessThan(growth.getX(6))
  expect(Array.from(source.getAttribute('arcLength').array)).toEqual(before)
  const b = makePrivateCrackGeometry(source, [[0, 0], [0, .03], [-.03, .03], [-.03, 0]])
  expect(Array.from(b.getAttribute('arcLength').array)).toEqual(Array.from(growth.array))
  a.dispose(); b.dispose(); source.dispose()
})
