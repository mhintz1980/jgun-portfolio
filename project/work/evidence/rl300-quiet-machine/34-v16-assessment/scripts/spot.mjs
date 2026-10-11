import fs from 'node:fs'
const d = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/33-gpu-3'
for (const dir of fs.readdirSync(d).filter(n => fs.statSync(`${d}/${n}`).isDirectory())) {
  const f = `${d}/${dir}/report.json`
  if (!fs.existsSync(f)) { console.log(dir, 'no report.json'); continue }
  const j = JSON.parse(fs.readFileSync(f, 'utf8'))
  const st = fs.statSync(f).mtime.toISOString().slice(11, 19)
  console.log(`${dir} [${st}] result=${j.result} ` + j.cases.map(c => `${c.name}:${c.status}`).join(' '))
  for (const c of j.cases.filter(c => c.status !== 'PASS' || c.name === 'no-white-frame')) {
    const m = c.measurements || {}
    console.log(`   ${c.name} ${c.status} dark=${m.darkFraction} bright=${m.brightFraction} persisted=${m.persisted} | ${String(c.message).slice(0, 150)}`)
  }
}
