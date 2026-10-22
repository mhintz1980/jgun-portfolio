import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const root = 'output/playwright/torque-camera-hud-2026-10-21'
const runs = ['after','after-narrow'].filter(id=>existsSync(`${root}/${id}/runtime.json`)).map(id=>{
  const raw = JSON.parse(readFileSync(`${root}/${id}/runtime.json`,'utf8'))
  const gates = raw.gates.map(gate=>gate.name === 'camera settled before shift'
    ? {...gate,pass:gate.evidence.every(x=>x.shift < 1e-6),tolerance:1e-6,reason:'integer native-scroll pixels may land just after .520'} : gate)
  return {id,status:raw.failure || raw.errors.length || gates.some(x=>!x.pass)?'FAIL':'PASS',rawStatus:raw.status,
    failure:raw.failure,errors:raw.errors,build:raw.buildHtmlSha256,gates,
    interactions:raw.interactions,samples:raw.samples.length,launch:raw.launch}
})
const tests = JSON.parse(readFileSync(`${root}/unit-tests.json`,'utf8'))
const layoutPath = `${root}/layout-narrow/runtime.json`
const layoutCapture = existsSync(layoutPath) ? JSON.parse(readFileSync(layoutPath,'utf8')) : null
const narrowCapture = existsSync(`${root}/after-narrow/runtime.json`) ? JSON.parse(readFileSync(`${root}/after-narrow/runtime.json`,'utf8')) : null
const layoutPreferred = layoutCapture && (!narrowCapture || layoutCapture.capturedAt > narrowCapture.capturedAt)
const layout = layoutPreferred ? layoutCapture : narrowCapture
const layoutSamples = layout?.samples.filter(s=>[.735,.747,.775].includes(s.requestedProgress)) ?? []
const summary = {runs,finalCssLayout:layout ? {status:!layout.failure && !layout.errors.length && layoutSamples.length===3 && layoutSamples.every(s=>s.controls?.separate)?'PASS':'FAIL',build:layout.buildHtmlSha256,samples:layoutSamples.map(s=>({progress:s.requestedProgress,controls:s.controls}))}:null,tests:{passed:tests.numPassedTests,failed:tests.numFailedTests,skipped:tests.numPendingTests,
  failures:tests.testResults.flatMap(f=>f.assertionResults.filter(t=>t.status==='failed').map(t=>({file:f.name,name:t.fullName})))},ownerAcceptance:'OPEN'}
writeFileSync(`${root}/summary.json`,JSON.stringify(summary,null,2))
const shots = [
  [.435,'Low orbit during shatter'],[.469,'Ring approach during fade'],[.4725,'Whole ring and blue indicator'],
  [.4805,'Knurling three-quarter view'],[.500,'Continuous assembly fade-in'],[.520,'Blue mode before shift'],
  [.545,'Handle-side red indicator'],[.593,'27.5% mating-part context'],[.735,'Material attempt and FOS HUD'],[.747,'Later material attempt'],[.905,'Clickable Stage-2 Planet'],[.960,'Rear-facing LCD callout'],
]
const escape = x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;')
const gallery = viewport=>shots.map(([p,title])=>{
  const name=`p-${p.toFixed(4)}.png`,before=`before${viewport}/${name}`,after=layoutPreferred && existsSync(`${root}/layout${viewport}/${name}`)?`layout${viewport}/${name}`:`after${viewport}/${name}`
  return `<section><h2>${title} <small>p=${p}</small></h2><div class="pair">${[before,after].map((src,i)=>`<figure><figcaption>${i?'After':'Before'}</figcaption>${existsSync(`${root}/${src}`)?`<a href="${src}"><img loading="lazy" src="${src}" alt="${i?'After':'Before'} ${escape(title)}"></a>`:'<p>No baseline capture at this checkpoint.</p>'}</figure>`).join('')}</div></section>`
}).join('')
writeFileSync(`${root}/review.html`,`<!doctype html><meta charset="utf-8"><title>JGUN camera and HUD owner review</title><style>body{margin:24px;background:#0b1016;color:#e9edf3;font:16px/1.5 system-ui}h1{font-size:28px}h2{font-size:20px}small{font-size:13px;color:#95aabb}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{padding:8px;color:#70d8ec}img{width:100%;border:1px solid #34414d}section{margin:32px 0}a{color:#70d8ec}summary{cursor:pointer;font-size:24px}p{max-width:90ch}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>JGUN camera and HUD — owner visual review</h1><p>Baseline c7d70eb3 versus this working tree. Runtime telemetry and unit tests are separate from owner visual acceptance, which remains open. The inherited cavern ring-5 fold test remains failing; no geometry waiver or deployment is implied.</p><p><a href="summary.json">Verification summary</a> · <a href="after/runtime.json">Desktop raw telemetry</a> · <a href="after-narrow/runtime.json">Narrow raw telemetry</a></p><details open><summary>Desktop 1440 × 900</summary>${gallery('')}</details><details><summary>Narrow 390 × 844</summary>${gallery('-narrow')}</details>`)
console.log(JSON.stringify({runs:runs.map(x=>({id:x.id,status:x.status,samples:x.samples,failed:x.gates.filter(g=>!g.pass).map(g=>g.name)})),tests:summary.tests,review:`${root}/review.html`},null,2))
