const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..').replaceAll('\\', '/');
const effects = JSON.parse(fs.readFileSync(path.join(root, 'data/source-effects.json'), 'utf8'));
const dir = root + '/data/chunks/';
const names = {
  lL9QxOnUqrjyW542W3Ob: 'Home', '5yJm8OF61xASr4byzTca': 'About', ifvQZLjf3prx7jTgZ3b3: 'Work listing',
  '9dvkhnvaNKpgNWxzA2j2': 'Contact', '6lIwdZ6WCPafVe8MeDsj': 'Case-study hero',
  '4rT8gK1vOuF68hthDW6Q': 'BSR', '8Fl8aWcgs23PPKpylEXz': 'EWM', srIPAy84Um97rut7yGiT: 'Gorilla',
  '9Ja3mveDSV4aOiEIWpnP': 'Kadenco', '6RbDuMlEJGUCZ32GoVjb': 'Navigation',
  '2E2lzfytQVMFq2A2RP4q': 'Footer', cARdQQzVVyfauAo12Huq: 'Project card',
  ereJhg8q3YcLZ90m8zyI: 'Service tab content', jqs7104ScwNBQfCO2sRC: 'Service section',
  ldMPTQnHHkIucVKDYMS7: 'Service tab', '752AmL6qOfdFpUOVnkLc': 'Phone mockup ticker',
  '7aetGBVGiA70EINbCBWX': 'Case-study description', sik7DueGUkXWcZSDek9Q: 'More projects',
  z83lRRQsOjPxpRibHakf: 'Submit button', wifPwZDhQf1birlJWX67: 'Privacy page',
  GT6Kv2Mi5iMnIk1zJRmO: 'Home PL', '6LGmyQ268IYdM8O512Ni': 'Service section PL',
  j362sLcu7WnNryu64jC0: 'Service tab PL', pGpsWWR3ZE4lfZEEWpTp: 'Service content PL',
  BaLunTybeYyKvhuRLeFc: 'Navigation PL', S8njm0r1GYzy2TV2iJcI: 'Footer PL'
};
const localized = new Set(['GT6Kv2Mi5iMnIk1zJRmO', '6LGmyQ268IYdM8O512Ni', 'j362sLcu7WnNryu64jC0', 'pGpsWWR3ZE4lfZEEWpTp', 'BaLunTybeYyKvhuRLeFc', 'S8njm0r1GYzy2TV2iJcI']);
const propNames = { y: 'translateY (px)', x: 'translateX (px)', rotateX: 'rotateX (deg)', rotateY: 'rotateY (deg)', rotate: 'rotation (deg)' };
const neutral = {opacity:1, scale:1, x:0, y:0, rotate:0, rotateX:0, rotateY:0, skewX:0, skewY:0};
const cell = s => String(s).replaceAll('|','/').replaceAll('\n',' ');
const link = (file,line,label) => `[${label || line}](<${dir + file}:${line}>)`;
const ease = t => t?.type === 'spring' ? `n/a: spring; ${['bounce','stiffness','damping','mass'].filter(k=>t[k]!==undefined).map(k=>k+'='+t[k]).join(', ')}${t.ease ? '; serialized ease cubic-bezier('+t.ease.join(',')+') (spring, not tween)' : ''}` : Array.isArray(t?.ease) ? 'cubic-bezier('+t.ease.join(',')+')' : t?.ease || 'unknown (not authored)';
const time = t => t ? `${t.duration === undefined ? 'duration unknown' : t.duration+' s'+(t.type==='spring'?' authored spring duration; settling unknown':'')}; delay ${t.delay ?? 'unknown'} s` : 'unknown';
const delta = (from,to) => Object.keys(from || {}).filter(k=>k!=='transition'&&Object.hasOwn(to,k)&&from[k]!==to[k]&&['opacity','scale','x','y','rotate','rotateX','rotateY','skewX','skewY'].includes(k)).map(k=>[propNames[k]||k,`${from[k]} → ${to[k] ?? 'unknown'}`]);
const rows = [], groups = new Map();
function add(trigger, what, property, values, span, easing, stagger, evidence) { rows.push([trigger, what, property, values, span, easing, stagger, '[seen] '+evidence]); }
for (const x of effects) {
  const id=x.file.split('__')[0];
  const e=x.effects; let type, from, to, transition, trigger, span, easing, stagger='none authored', changes;
  if(e.__framer__enter) {type='reveal';from=e.__framer__enter;to={...neutral,opacity:e.__framer__targetOpacity??1};transition=e.__framer__animate?.transition;trigger=`viewport entry; threshold ${e.__framer__threshold??'unknown'}; ${e.__framer__animateOnce?'once':'repeats'}`;}
  else if(e.__framer__presenceAnimate&&e.__framer__presenceInitial){type='presence';from=e.__framer__presenceInitial;to=e.__framer__presenceAnimate;transition=to.transition;trigger='component presence/mount (authored variant; overrides may disable)';}
  else if(e.animate&&typeof e.animate==='object'&&e.initial&&typeof e.initial==='object'){type='mount';from=e.initial;to=e.animate;transition=to.transition;trigger='mount / optimized appear';}
  else if(e.whileHover){type='hover';to=e.whileHover;from={...neutral};transition=to.transition;trigger='pointer hover';}
  else if(e.__framer__transformTargets){type='scroll';let targets=e.__framer__transformTargets;from=targets[0].target;to=targets.at(-1).target;transition=e.__framer__spring;trigger=`scroll: ${e.__framer__transformTrigger}; viewport threshold ${e.__framer__transformViewportThreshold??'not authored'}`;span=e.__framer__transformTrigger==='onInView'?'element start meets viewport end → element end meets viewport end':`reference ranges ${targets.slice(1).map(t=>t.ref??'unknown').join(', ')}; offsets ${targets.slice(1).map(t=>t.offset??0).join(', ')} px; runtime geometry (§4); pixel span unknown`;easing=e.__framer__spring?ease(transition):'unknown authored ease; runtime interpolation, no tween';stagger=transition?.stagger??'none authored';}
  else if(e.__framer__loopEffectEnabled){type='loop';to=e.__framer__loop;from=neutral;transition=e.__framer__loopTransition;trigger='loading variant mounted; loop pauses offscreen';span=time(transition)+'; repeat '+e.__framer__loopRepeatType+'; repeat delay '+e.__framer__loopRepeatDelay+' s';}
  if(type){if(x.breakpoint)trigger+='; '+x.breakpoint;changes=delta(from,to);if(changes.length){let key=JSON.stringify({id,type,from,to,transition,trigger,span});let g=groups.get(key);if(!g)groups.set(key,g={x:[],trigger,changes,span:span||time(transition),easing:easing||ease(transition),stagger});g.x.push(x);}}
  if(e.tickerEffectEnabled){const key=JSON.stringify({id,ticker:e.tickerEffectVelocity,gap:e.tickerEffectGap,hover:e.tickerEffectHoverModifier});let g=groups.get(key);if(!g)groups.set(key,g={x:[],trigger:'continuous ticker; drag enabled '+e.tickerEffectDraggable,changes:[['translateX','repeating content offset; start/end = measured content width, unknown px']],span:`continuous; velocity ${e.tickerEffectVelocity} px/s; gap ${e.tickerEffectGap}; hover ${e.tickerEffectHoverModifier}% speed; responsive overrides below`,easing:'n/a constant velocity; drag release uses runtime inertia (authored ease unknown)',stagger:'none authored'});g.x.push(x);}
}
for(const g of groups.values()){
 const first=g.x[0],id=first.file.split('__')[0],module=names[id]||id;
 const labels=[...new Set(g.x.map(x=>x.name||x.labels[0]||x.className||x.component))].map(s=>s.slice(0,72));
 const display=labels.slice(0,4).join('; ')+(labels.length>4?`; +${labels.length-4} equivalent instances`:'');
 const refs=g.x.map(x=>x.line).join(', ');
 const defs=[...new Set(g.x.flatMap(x=>x.definitionLines||[]))];
 add(g.trigger,module+' — '+display,g.changes.map(c=>c[0]).join(', '),g.changes.map(c=>c[1]).join('; '),g.span,g.easing,g.stagger,link(first.file,first.line,module+':'+refs)+(defs.length?'; definitions '+defs.join(', '):''));
}
const manual=JSON.parse(fs.readFileSync(path.join(root,'data/manual-animation-rows.json'),'utf8'));
for(const r of manual)add(...r.slice(0,7),r[7].map(([f,l,label])=>link(f,l,label)).join('; '));
const header='| Trigger | What moves | Property | From → to | Duration or scroll span | Easing | Stagger | Source evidence |\n|---|---|---|---|---|---|---|---|\n';
process.stdout.write('## 5. Animation inventory — source research (Codex)\n\n'+
 '[seen] One row per distinct effect/settings group; equivalent repeated instances share a row and list their source lines. Names from actual route wiring override stale generated display names. Localized instances and responsive effect overrides are included. Readable `.source.js` files are formatted `sourcesContent` from the saved production source maps; `source-provenance.json` records the original URL and map. Sources were recovered from the exact recorded hashed deployment, not a new site build.\n\n'+
 '[seen] For Framer FX reveals the authored `__framer__enter` is the starting state; neutral targets opacity=1, scale=1 and x/y/rotation=0 come from the actual FX runtime (`data/chunks/framer.mjs`, zero-based character offsets 140624–141239 and 329072–329208). Authored ease arrays are written as exact cubic-beziers. Spring durations below are serialized controls, not guaranteed settling times; damping loops have no fixed tween duration. A source-defined row does not assert that an untested interaction or responsive branch played in the original browser run.\n\n'+header+rows.map(r=>'| '+r.map(cell).join(' | ')+' |').join('\n')+'\n\n'+
 `[seen] Inventory: **${rows.length} effect/settings rows**. Raw per-instance extraction is saved in \`research/fragment/data/source-effects.json\`; duplicate labels retain generated class names where the author supplied no semantic name.\n\n`);
