import fs from 'node:fs';

const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const c = j.cases[0];
console.log('--- checkpoints (1600x900) ---');
for (const cp of c.checkpoints) {
  const h = cp.headings[0];
  if (!h) continue;
  const r = h.rect;
  console.log(JSON.stringify({
    idx: cp.index, frac: cp.fraction,
    scrollY: Math.round(cp.scrollY), maxScroll: Math.round(cp.maxScroll),
    h2: h.text.substring(0, 30),
    x: Math.round(r.x), y: Math.round(r.y),
    right: Math.round(r.right), bottom: Math.round(r.bottom),
    w: Math.round(r.width), h: Math.round(r.height)
  }));
}
console.log('--- navigation (1600x900) ---');
for (const n of c.navigation) {
  const b = n.buttons[n.index];
  const h = n.headings[0];
  console.log(JSON.stringify({
    idx: n.index, current: b?.current,
    btnName: b?.name?.substring(0, 20),
    focusName: n.focus?.name?.substring(0, 20),
    focusTag: n.focus?.tag,
    headingCount: n.headings.length,
    firstHeading: h?.text?.substring(0, 25),
    scrollY: Math.round(n.scrollY)
  }));
}
console.log('--- tabFocus:', c.tabFocus);
