const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const cliRoot = 'C:/Projects/skills-master/vendor/danilo-znamerovszkij-draw-your-font';
const cliRequire = createRequire(path.join(cliRoot, 'package.json'));
const sharp = cliRequire('sharp');
const {spawnSync}=require('node:child_process');
const root = path.resolve(__dirname, '..');
const work = path.join(root, 'project/work/evidence/JG-035-opening-drafting-table/handwriting-reference-2026-10-08/font-work');
const source = 'C:/Users/Markimus/Pictures/Screenshots/ac-fast.png';
function snapshotSource(original) {
  const dir=path.join(work,'sources');fs.mkdirSync(dir,{recursive:true});
  const frozen=path.join(dir,path.basename(original));
  if(!fs.existsSync(frozen))fs.copyFileSync(original,frozen);
  return frozen;
}
async function inspect() {
  for (const [i, top, height] of [[1,20,40],[2,75,40],[3,120,35],[4,160,40],[5,205,40],[6,250,35],[7,290,40],[8,333,33],[9,375,40]]) {
    const grid = Buffer.from(`<svg width="1916" height="${height*4}">${Array.from({length:48},(_,k)=>`<line x1="${k*40}" x2="${k*40}" y1="0" y2="${height*4}" stroke="red" opacity=".2"/><text x="${k*40}" y="13" font-size="12" fill="red">${k*10}</text>`).join('')}</svg>`);
    await sharp(source).extract({left:0,top,width:479,height}).resize(1916,height*4).composite([{input:grid}]).png().toFile(path.join(work, `row-${i}.png`));
  }
  for(const [name,left,top,width,height] of [['tech',150,207,45,34],['quick',375,246,89,38],['talk',411,374,60,36],['ive',375,75,49,38],['never',201,248,70,34]]) {
    await sharp(source).extract({left,top,width,height}).resize(width*12,height*12).png().toFile(path.join(work,`detail-${name}.png`));
  }
}
async function crops() {
  const labels = JSON.parse(fs.readFileSync(path.join(work,'crop-labels.json'),'utf8'));
  fs.mkdirSync(path.join(work,'selected-crops'),{recursive:true});
  const composite=[];
  let index=0;
  for (const [char,def] of Object.entries(labels)) {
    const [left,top,cropWidth,cropHeight]=def.box;
    const width=cropWidth*6,height=cropHeight*6;
    const {data}=await sharp(snapshotSource(def.source || source)).flatten({background:'#fff'}).extract({left,top,width:cropWidth,height:cropHeight}).grayscale().resize(width,height).raw().toBuffer({resolveWithObject:true});
    // Only remove background and neighboring ink. Never draw or repair a stroke.
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      let keep=true;
      if(def.mask) keep=inside([(x+.5)/6+left,(y+.5)/6+top],def.mask);
      data[y*width+x]=keep && data[y*width+x]<100 ? 0 : 255;
    }
    if (!['Q','?','!','5'].includes(char)) {
      const seen = new Set(), components=[];
      for(let p=0;p<data.length;p++) {
        if(data[p]!==0 || seen.has(p))continue;
        const points=[],stack=[p];seen.add(p);
        while(stack.length) {const q=stack.pop(),x=q%width,y=Math.floor(q/width);points.push(q);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*width+xx;if(xx>=0&&xx<width&&yy>=0&&yy<height&&data[n]===0&&!seen.has(n)){seen.add(n);stack.push(n);}}
        }
        components.push(points);
      }
      components.sort((a,b)=>b.length-a.length);
      for(const part of components.slice(1))for(const p of part)data[p]=255;
    }
    const input=await sharp(data,{raw:{width,height,channels:1}}).png().toBuffer();
    await sharp(input).toFile(path.join(work,'selected-crops',`${char.codePointAt(0)}.png`));
    composite.push({input,left:60+(index%7)*250,top:60+Math.floor(index/7)*280});
    index++;
  }
  await sharp({create:{width:1800,height:Math.max(1200,Math.ceil(index/7)*280+60),channels:3,background:'#fff'}}).composite(composite).png().toFile(path.join(work,'alphabet-crops.png'));
}
function inside([x,y],poly) {
  let v=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {const [xi,yi]=poly[i], [xj,yj]=poly[j]; if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi)v=!v;}
  return v;
}
function cli(args) {
  const r=spawnSync(process.execPath,[path.join(cliRoot,'src/cli.js'),...args],{cwd:root,encoding:'utf8'});
  process.stdout.write(r.stdout || '');if(r.status!==0)throw new Error(r.stderr || `CLI exit ${r.status}`);
}
function flatten(d) {
  const contours=[];let ring=[],point=[0,0],start=point;
  function finish(){if(ring.length>2){if(Math.hypot(ring[0][0]-ring.at(-1)[0],ring[0][1]-ring.at(-1)[1])<1e-8)ring.pop();contours.push(ring);}ring=[];}
  function midpoint(a,b){return[(a[0]+b[0])/2,(a[1]+b[1])/2];}
  function cubic(a,b,c,e,depth=0) {
    const dx=e[0]-a[0],dy=e[1]-a[1],len=Math.hypot(dx,dy);
    const dist=p=>len?Math.abs(dx*(a[1]-p[1])-(a[0]-p[0])*dy)/len:Math.hypot(p[0]-a[0],p[1]-a[1]);
    if(depth>=15 || Math.max(dist(b),dist(c))<0.65){ring.push(e);return;}
    const ab=midpoint(a,b),bc=midpoint(b,c),ce=midpoint(c,e),abc=midpoint(ab,bc),bce=midpoint(bc,ce),m=midpoint(abc,bce);
    cubic(a,ab,abc,m,depth+1);cubic(m,bce,ce,e,depth+1);
  }
  cliRequire('svgpath')(d).unarc().unshort().abs().iterate(seg=> {
    const [cmd,...v]=seg;
    if(cmd==='M'){finish();point=[v[0],v[1]];start=point;ring=[point];}
    else if(cmd==='L'){point=[v[0],v[1]];ring.push(point);}
    else if(cmd==='H'){point=[v[0],point[1]];ring.push(point);}
    else if(cmd==='V'){point=[point[0],v[0]];ring.push(point);}
    else if(cmd==='C'){const end=[v[4],v[5]];cubic(point,[v[0],v[1]],[v[2],v[3]],end);point=end;}
    else if(cmd==='Q'){const control=[v[0],v[1]],end=[v[2],v[3]];cubic(point,[point[0]+2/3*(control[0]-point[0]),point[1]+2/3*(control[1]-point[1])],[end[0]+2/3*(control[0]-end[0]),end[1]+2/3*(control[1]-end[1])],end);point=end;}
    else if(cmd==='Z'){point=start;finish();}
    else throw new Error(`Unsupported SVG segment ${cmd}`);
  });finish();return contours;
}
function area(ring){return ring.reduce((a,p,i)=>{const q=ring[(i+1)%ring.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2;}
function polygonize(d) {
  const raw=flatten(d),points=raw.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),s=7.5/(Math.max(...ys)-minY);
  const round=n=>Math.round(n*1e5)/1e5;
  const contours=raw.map(r=>r.map(([x,y])=>[round((x-minX)*s),round((y-minY)*s)]));
  const areas=contours.map(r=>Math.abs(area(r)));
  const parents=contours.map((r,i)=>{let parent=-1;for(let j=0;j<contours.length;j++)if(areas[j]>areas[i]&&inside(r[0],contours[j])&&(parent<0||areas[j]<areas[parent]))parent=j;return parent;});
  const depth=i=>parents[i]<0?0:1+depth(parents[i]);
  const target=areas.reduce((a,v,i)=>a+(depth(i)%2?-v:v),0);
  if(!contours.length || target<=0)throw new Error('Invalid traced contour area');
  return {glyph:{w:round((Math.max(...xs)-minX)*s),contours},holes:parents.filter((p,i)=>depth(i)%2).length,area:target};
}
function fixFontTimestamp(file) {
  // svg2ttf uses wall-clock timestamps. Normalize only metadata, preserving CLI outlines.
  const buf=fs.readFileSync(file),count=buf.readUInt16BE(4);let head=-1,headRecord=-1;
  for(let i=0;i<count;i++){const off=12+16*i;if(buf.toString('ascii',off,off+4)==='head'){head=buf.readUInt32BE(off+8);headRecord=off;}}
  if(head<0)throw new Error('TTF has no head table');
  const stamp=BigInt(Date.parse('2026-10-08T00:00:00Z')/1000+2082844800);
  buf.writeBigUInt64BE(stamp,head+20);buf.writeBigUInt64BE(stamp,head+28);buf.writeUInt32BE(0,head+8);
  function checksum(start,length){let sum=0;for(let i=start;i<start+length;i+=4){let word=0;for(let j=0;j<4;j++)word=(word*256)+(i+j<buf.length?buf[i+j]:0);sum=(sum+word)>>>0;}return sum;}
  buf.writeUInt32BE(checksum(head,buf.readUInt32BE(headRecord+12)),headRecord+4);
  buf.writeUInt32BE((0xB1B0AFBA-checksum(0,buf.length))>>>0,head+8);fs.writeFileSync(file,buf);
}
async function build() {
  await crops();
  const dir=path.join(work,'alphabet-build'),font=path.join(root,'public/fonts/AcFastReference.ttf');
  cli(['segment',path.join(work,'alphabet-crops.png'),'-d',dir]);
  const definitions=JSON.parse(fs.readFileSync(path.join(work,'crop-labels.json'),'utf8'));
  const chars=Object.keys(definitions),blobs=JSON.parse(fs.readFileSync(path.join(dir,'blobs.json'),'utf8'));
  // Use raster grid position, never trust a merged word or accidental component ordering.
  const labels={},groups=new Map();
  for(const b of blobs.blobs){const col=Math.floor(b.box.x0/250),row=Math.floor(b.box.y0/280),char=chars[row*7+col];if(!char)throw new Error('Unknown raster cell');if(!groups.has(char))groups.set(char,[]);groups.get(char).push(b);}
  if(groups.size!==chars.length)throw new Error(`Expected ${chars.length} occupied cells, found ${groups.size}`);
  fs.writeFileSync(path.join(dir,'raw-segment-blobs.json'),JSON.stringify(blobs,null,2)+'\n');
  // Multi-stroke characters can have multiple components in the SAME raster
  // cell. Unite the boxes and crop existing pixels; never synthesize ink.
  const unified=[];
  for(const [id,char]of chars.entries()) {
    const parts=groups.get(char),x0=Math.min(...parts.map(b=>b.box.x0)),y0=Math.min(...parts.map(b=>b.box.y0)),x1=Math.max(...parts.map(b=>b.box.x1)),y1=Math.max(...parts.map(b=>b.box.y1));
    const width=x1-x0+1,height=y1-y0+1,pad=blobs.pad,crop=`crops/${id}.png`;
    await sharp(path.join(work,'alphabet-crops.png')).extract({left:x0,top:y0,width,height}).extend({top:pad,bottom:pad,left:pad,right:pad,background:'#fff'}).png().toFile(path.join(dir,crop));
    unified.push({id,photo:path.join(work,'alphabet-crops.png'),row:Math.floor(y0/280),box:{x0,y0,x1,y1},area:parts.reduce((a,b)=>a+b.area,0),crop,cropSize:{width:width+2*pad,height:height+2*pad},componentCount:parts.length});labels[id]=char;
  }
  blobs.blobs=unified;fs.writeFileSync(path.join(dir,'blobs.json'),JSON.stringify(blobs,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'labels.json'),JSON.stringify(labels,null,2)+'\n');
  cli(['build','-d',dir,'--labels',path.join(dir,'labels.json'),'--name','Ac Fast Reference','--weight=-1','-o',font]);
  fixFontTimestamp(font);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const boundsResult=spawnSync('python',[path.join(__dirname,'handwriting-reference-extract.py'),font],{encoding:'utf8'});
  if(boundsResult.status!==0)throw new Error(boundsResult.stderr || 'fontTools bounds extraction failed');
  const fontBounds=JSON.parse(boundsResult.stdout);
  fs.writeFileSync(path.join(work,'font-bounds.json'),JSON.stringify(fontBounds,null,2)+'\n');
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')if(!manifest.glyphs[ch])throw new Error(`Missing ${ch}`);
  cli(['preview','-d',dir,'--text','ABCDEFGHIJKLMNOPQRSTUVWXYZ 012345678 ? QUICK BROWN FOX JUMPING OVER A LAZY BROWN DOG MECHANICAL DESIGN AND MANUFACTURING','-o',path.join(dir,'preview.png')]);
  fs.copyFileSync(path.join(dir,'preview.png'),path.join(dir,'specimen.png'));
  const glyphs={},provenance={},statistics={};
  for(const [char,g]of Object.entries(manifest.glyphs)) {
    const result=polygonize(g.d);
    if(!fontBounds[char] || fontBounds[char].fontHeight<=0)throw new Error(`Missing actual TTF bounds for ${char}`);
    glyphs[char]={...result.glyph,...fontBounds[char]};statistics[char]={points:result.glyph.contours.flat().length,holes:result.holes,area:result.area};
    provenance[char]={source:definitions[char].source||source,snapshot:`font-work/sources/${path.basename(definitions[char].source||source)}`,box:definitions[char].box,word:definitions[char].word,mask:definitions[char].mask||null,crop:`font-work/selected-crops/${char.codePointAt(0)}.png`,traceSource:`alphabet-build/${g.source}`,threshold:100,weight:-1};
  }
  const header='// Generated by node scripts/handwriting-reference-extract.cjs. Do not edit.\n// Raster crops from the documented screenshots; all outlines traced by draw-your-font.\n// Coordinates: baseline 0, cap height 7.5, x min 0; w is black extent, not font advance.\n// fontMinX/fontMinY/fontHeight are recomputed TTF outline-coordinate bounds in original 1000-UPM font units, matching Troika (including control points).\n';
  fs.writeFileSync(path.join(root,'src/scene/drawing/sheet/referenceHandGlyphs.ts'),header+'export const REFERENCE_GLYPHS: Readonly<Record<string, {w:number; contours:[number,number][][]; fontMinX:number; fontMinY:number; fontHeight:number}>> = '+JSON.stringify(glyphs)+';\n\nexport const REFERENCE_PROVENANCE = '+JSON.stringify(provenance,null,2)+' as const;\n');
  fs.writeFileSync(path.join(work,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  fs.writeFileSync(path.join(work,'polygon-validation.json'),JSON.stringify(statistics,null,2)+'\n');
  await comparisons(manifest,definitions);
  const opentype=cliRequire('opentype.js'),bytes=fs.readFileSync(font),ttf=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  for(const ch of chars){const g=ttf.charToGlyph(ch);if(g.index===0||!g.path.commands.length)throw new Error(`Missing TTF outline ${ch}`);}
  const sentence='QUICK BROWN FOX JUMPING OVER A LAZY BROWN DOG';
  const fontPath=ttf.getPath(sentence,30,90,43).toPathData(3);
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="150"><rect width="100%" height="100%" fill="white"/><path d="${fontPath}" fill="#333"/></svg>`)).png().toFile(path.join(dir,'ttf-specimen.png'));
  const crypto=require('node:crypto'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  fs.writeFileSync(path.join(work,'build-report.json'),JSON.stringify({glyphCount:chars.length,missing:[...'0123456789?!'].filter(c=>!manifest.glyphs[c]),fontSha256:hash(font),dataSha256:hash(path.join(root,'src/scene/drawing/sheet/referenceHandGlyphs.ts')),cliVersion:cliRequire('./package.json').version,weight:-1,threshold:100,capHeight:7.5,ttfOutlinesVerified:true,contoursVerified:true,trianglesOmitted:true},null,2)+'\n');
  console.log(`Verified ${chars.length} TTF outlines and hole-aware contours.`);
}
async function comparisons(manifest,definitions) {
  const composite=[],paths=[],labels=[];
  for(const [i,ch] of [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].entries()) {
    const x=15+(i%7)*160,y=40+Math.floor(i/7)*180;
    const clean=await sharp(path.join(work,'selected-crops',`${ch.codePointAt(0)}.png`)).trim({background:'#fff',threshold:5}).resize({height:56}).png().toBuffer();
    composite.push({input:clean,left:x,top:y});
    const g=manifest.glyphs[ch];paths.push(`<path transform="translate(${x-4},${y+140}) scale(.08,-.08)" d="${g.d}" fill="#111"/>`);
    labels.push(`<text x="${x}" y="${y-8}" font-family="sans-serif" font-size="14">${ch}: raster / CLI -1</text>`);
  }
  const overlay=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="770">${labels.join('')}${paths.join('')}</svg>`);
  await sharp({create:{width:1140,height:770,channels:3,background:'#fff'}}).composite([...composite,{input:overlay}]).png().toFile(path.join(work,'cap-height-comparison.png'));
}
(process.argv.includes('--inspect') ? inspect() : process.argv.includes('--crops-only') ? crops() : build()).catch(e=>{console.error(e); process.exitCode=1;});
