import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkpointJson } from './lib/cinematography-checkpoint.mjs'

test('compact checkpoint retains failed gates, matrices and journal references without changing raw vertices', () => {
  const telemetry = {subjects:[{name:'tool',matrixWorld:[1,2,3]}],witnesses:[{name:'tool/contact',kind:'contact',points:[[1,2,3],[4,5,6]]}]}
  const report = {status:'FAIL',cases:[{name:'desktop-full',samples:[{telemetry}],gates:[{status:'FAIL',evidence:Infinity}]}]}
  const disk = JSON.parse(checkpointJson(report))
  assert.equal(disk.status,'FAIL')
  assert.deepEqual(disk.cases[0].gates,[{status:'FAIL',evidence:'Infinity'}])
  assert.deepEqual(disk.cases[0].samples[0].telemetry.witnesses,[{
    name:'tool/contact',kind:'contact',pointCount:2,pointsEvidence:'case samples.jsonl',
  }])
  assert.deepEqual(disk.cases[0].samples[0].telemetry.subjects,telemetry.subjects)
  assert.deepEqual(telemetry.witnesses[0].points,[[1,2,3],[4,5,6]])
  assert.ok(JSON.stringify(report).includes('"points":'))
})
