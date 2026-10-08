// Separate Node/draco3d decoder verifies compressed accessors, normal vectors and
// every-vertex registered housing/support correspondence without Blender helpers.
import draco3d from 'draco3d'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const out=path.dirname(fileURLToPath(import.meta.url)),module=await draco3d.createDecoderModule({}),decoder=new module.Decoder()
const tol=.005
function nearest(a,b,shift=[0,0,0]) {
 const key=v=>v.map(x=>Math.floor(x/tol)).join(',');const bins=new Map()
 for(const p of b){const k=key(p);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(p)}
 let unmatched=0,max=0
 for(const pp of a){const p=pp.map((x,i)=>x+shift[i]),c=p.map(x=>Math.floor(x/tol));let d=Infinity
 for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const q of bins.get([c[0]+x,c[1]+y,c[2]+z].join(','))??[])d=Math.min(d,Math.hypot(...p.map((v,i)=>v-q[i])))
 if(d>tol)unmatched++;else max=Math.max(max,d)
 }return{unmatched,max_matched_residual_mm:max}
}
const result={schema:1,method:'draco3d independent decoder; raw glTF metres converted once to shaft-local mm [x,-z,y]; normals checked from compressed attribute; correspondence uses 5um spatial hash cells',bundles:{}}
for(const tier of ['full','lite']){
 const filename=`public/models/manufacturing-core-${tier}.glb`,bytes=await fs.readFile(filename),jsonlen=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonlen)),binstart=28+jsonlen,decoded={};let calls=0,total=0
 for(const node of doc.nodes.filter(x=>x.mesh!==undefined)){
  if(node.matrix||node.translation||node.rotation||node.scale)throw Error('Unexpected nonidentity node transform: '+node.name)
  const mesh=doc.meshes[node.mesh],positions=[];let triangles=0,vertices=0,normalMaxUnitError=0,nonfiniteNormals=0,zeroNormals=0
  for(const primitive of mesh.primitives){
   calls++;const ext=primitive.extensions.KHR_draco_mesh_compression,bv=doc.bufferViews[ext.bufferView],compressed=bytes.subarray(binstart+(bv.byteOffset??0),binstart+(bv.byteOffset??0)+bv.byteLength)
   const db=new module.DecoderBuffer();db.Init(new Int8Array(compressed),compressed.length);const dm=new module.Mesh(),status=decoder.DecodeBufferToMesh(db,dm);if(!status.ok())throw Error(status.error_msg())
   triangles+=dm.num_faces();vertices+=dm.num_points()
   for(const attrName of ['POSITION','NORMAL']){
    const attr=decoder.GetAttributeByUniqueId(dm,ext.attributes[attrName]),values=new module.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(dm,attr,values)
    for(let i=0;i<dm.num_points();i++){const p=[values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2)]
      if(attrName==='POSITION')positions.push([p[0]*1000,-p[2]*1000,p[1]*1000])
      else{if(!p.every(Number.isFinite))nonfiniteNormals++;const len=Math.hypot(...p);if(len<1e-7)zeroNormals++;normalMaxUnitError=Math.max(normalMaxUnitError,Math.abs(len-1))}
    }module.destroy(values)
   }
   if(primitive.indices!==undefined&&doc.accessors[primitive.indices].count!==dm.num_faces()*3)throw Error('Triangle metadata differs from decoded indices')
   module.destroy(dm);module.destroy(db)
  }
  total+=triangles;decoded[node.name]={positions,triangles,vertices,normalMaxUnitError,nonfiniteNormals,zeroNormals}
 }
 const support={}
 for(const name of ['bearing','ring']){const a=decoded['approved'+name].positions,l=decoded['legacy'+name].positions;support[name]={approved_minus_shift_to_legacy:nearest(a,l,[0,-2.75,0]),legacy_plus_shift_to_approved:nearest(l,a,[0,2.75,0])}}
 const a=decoded.approvedhousing.positions,l=decoded.legacyhousing.positions
 // Build classification by one union query plus exact moving-seat membership.
 const housing={legacy_to_approved:nearest(l,[...a,...a.map(p=>[p[0],p[1]-2.75,p[2]])]),approved_to_legacy:nearest(a,[...l,...l.map(p=>[p[0],p[1]+2.75,p[2]])])}
 const parts={};for(const [name,part] of Object.entries(decoded)){const{positions,...metrics}=part;parts[name]=metrics}
 const rec={path:filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),parts,total_triangles:total,primitive_calls:calls,support,housing}
 rec.pass=Object.keys(parts).length===8&&Object.values(parts).every(p=>p.nonfiniteNormals===0&&p.zeroNormals===0&&p.normalMaxUnitError<.001)&&Object.values(support).every(p=>Object.values(p).every(v=>v.unmatched===0))&&Object.values(housing).every(p=>p.unmatched===0)
 result.bundles[tier]=rec;console.log('INDEPENDENT_DRACO',tier,rec.pass,total,calls)
}
result.pass=Object.values(result.bundles).every(x=>x.pass)
await fs.writeFile(path.join(out,'draco-report.json'),JSON.stringify(result,null,2)+'\n')
module.destroy(decoder)
if(!result.pass)process.exitCode=1
