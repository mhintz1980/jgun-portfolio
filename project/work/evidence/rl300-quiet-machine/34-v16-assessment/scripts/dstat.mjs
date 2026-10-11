import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
const R='C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { pixels } = await import(pathToFileURL(`${R}/scripts/lib/preview-pixels.mjs`).href)
const T=`${R}/project/work/evidence/rl300-quiet-machine/32-gpu-2/lite-vs-full-tiles`
for (const n of ['u34-1440x900','u51-1440x900']) {
  const a=pixels(fs.readFileSync(`${T}/${n}-full.png`)), b=pixels(fs.readFileSync(`${T}/${n}-lite.png`))
  const ds=[]; let sgn=0
  for (let i=0;i<a.data.length;i+=a.channels){
    const d=Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]))
    if(d>8){ds.push(d); sgn += (b.data[i]+b.data[i+1]+b.data[i+2])-(a.data[i]+a.data[i+1]+a.data[i+2])}
  }
  ds.sort((x,y)=>x-y); const q=p=>ds[Math.floor(p*(ds.length-1))]
  console.log(n,'changed px',ds.length,'delta/255 median',q(.5),'p90',q(.9),'max',ds.at(-1),'| lite is',sgn>0?'brighter':'darker','on average by',(Math.abs(sgn)/ds.length/3).toFixed(1))
}
