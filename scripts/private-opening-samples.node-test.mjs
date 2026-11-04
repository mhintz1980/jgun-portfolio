import assert from 'node:assert/strict'
import { test } from 'node:test'
import { privateOpeningPoints, sourceModule } from './verify-page-cinematography.mjs'

test('opening samples invert the current private clock at read, lighting and rupture boundaries', async () => {
  const {exports: opening}=await sourceModule('src/scene/torque-wrench/OpeningDirector.ts')
  const points=privateOpeningPoints(opening.openingTimeAt)
  for (const t of [.065,.125,.24,.38,.66,.79,.84,.9])
    assert.ok(points.some(p=>Math.abs(opening.openingTimeAt(p)-t)<1e-9),String(t))
  assert.notEqual(points.find(p=>Math.abs(opening.openingTimeAt(p)-.38)<1e-9),.0456)
  assert.throws(()=>privateOpeningPoints(undefined))
  assert.throws(()=>privateOpeningPoints(()=>NaN))
  assert.throws(()=>privateOpeningPoints(()=>0))
})
