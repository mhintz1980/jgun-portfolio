import draco3d from 'draco3d'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Matrix4, Vector3 } from 'three'
const out=path.dirname(fileURLToPath(import.meta.url)),r=JSON.parse(await fs.readFile(path.join(out,'report.json'),'utf8'))
const dm=await draco3d.createDecoderModule({}),decoder=new dm.Decoder()
const cache={}
function decode(bytes,name){
 const jl=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jl)),start=28+jl,node=doc.nodes.find(x=>x.name===name),out=[]
 for(const p of doc.meshes[node.mesh].primitives){const e=p.extensions.KHR_draco_mesh_compression,bv=doc.bufferViews[e.bufferView],data=bytes.subarray(start+(bv.byteOffset??0),start+(bv.byteOffset??0)+bv.byteLength),db=new dm.DecoderBuffer(),mesh=new dm.Mesh();db.Init(new Int8Array(data),data.length);decoder.DecodeBufferToMesh(db,mesh);const values=new dm.DracoFloat32Array(),a=decoder.GetAttributeByUniqueId(mesh,e.attributes.POSITION);decoder.GetAttributeFloatForAllPoints(mesh,a,values);for(let i=0;i<mesh.num_points();i++)out.push([values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2)]);dm.destroy(values);dm.destroy(mesh);dm.destroy(db)}return out
}
const result={schema:1,method:'Independent Draco positions projected through same-session saved live camera matrices. Legacy group rotation.z = -workPhi = 2*cutterPhi (live telemetry), as source shaftRuntime.ts:353-355. Critical material action is shaft-local y3.2..14.2mm, separate from broader y3.2..20mm journal witness.',rows:[]}
for(const row of r.anchors.filter(x=>x.name.startsWith('failed'))){
 const tier=row.tier==='full'?'full':'lite';cache[tier]??=decode(await fs.readFile(`public/models/manufacturing-core-${tier}.glb`),'legacyshaft')
 const vp=new Matrix4().fromArray(row.camera.projection).multiply(new Matrix4().fromArray(row.camera.world).invert()),rot=new Matrix4().makeRotationZ(2*row.telemetry.shaft.cutter.rotation),v=new Vector3(),ps=[]
 for(const p of cache[tier]){const y=-p[2]*1000;if(y<3.2||y>14.2)continue;v.fromArray(p).applyMatrix4(rot).applyMatrix4(vp);ps.push([(v.x+1)*row.viewport[0]/2,(1-v.y)*row.viewport[1]/2])}
 const bounds={min:[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1]))],max:[Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]},card=row.dom.card
 const overlap=bounds.min[0]<card.max[0]&&bounds.max[0]>card.min[0]&&bounds.min[1]<card.max[1]&&bounds.max[1]>card.min[1]
 const occupied=ps.filter(p=>p[0]>=card.min[0]&&p[0]<=card.max[0]&&p[1]>=card.min[1]&&p[1]<=card.max[1])
 const rec={layout:row.layout,name:row.name,time:row.time,session:row.rendered.session,critical_action_bounds:bounds,card_bounds:card,critical_action_card_overlap:overlap,projected_vertices_inside_card_column:occupied.length,inside_vertex_bounds:occupied.length?{min:[Math.min(...occupied.map(p=>p[0])),Math.min(...occupied.map(p=>p[1]))],max:[Math.max(...occupied.map(p=>p[0])),Math.max(...occupied.map(p=>p[1]))]}:null,vertical_gap_px:bounds.min[1]-card.max[1],witness_broad_bounds:row.projected['study-legacyshaft'].bounds}
 result.rows.push(rec);console.log(row.layout,row.name,'criticalOverlap',overlap,'gapPx',rec.vertical_gap_px)
}
dm.destroy(decoder)
await fs.writeFile(path.join(out,'material-region-report.json'),JSON.stringify(result,null,2)+'\n')
