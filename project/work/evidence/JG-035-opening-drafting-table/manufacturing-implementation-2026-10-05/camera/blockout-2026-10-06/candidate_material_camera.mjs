// CPU-only proposed anchor, no application mutation. Uses recorded source geometry
// projected into a reconstructed runtime camera to evaluate actual top card band.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import draco3d from 'draco3d'
import { PerspectiveCamera,Vector3,Matrix4 } from 'three'
const out=path.dirname(fileURLToPath(import.meta.url)),r=JSON.parse(await fs.readFile(path.join(out,'report.json'))),row=r.anchors.find(x=>x.layout==='narrow'&&x.name==='failed-4140')
const b=await fs.readFile('public/models/manufacturing-core-lite.glb'),jl=b.readUInt32LE(12),doc=JSON.parse(b.subarray(20,20+jl)),p=doc.meshes[doc.nodes.find(n=>n.name==='legacyshaft').mesh].primitives[0],e=p.extensions.KHR_draco_mesh_compression,bv=doc.bufferViews[e.bufferView],data=b.subarray(28+jl+(bv.byteOffset??0),28+jl+(bv.byteOffset??0)+bv.byteLength)
const m=await draco3d.createDecoderModule({}),d=new m.Decoder(),db=new m.DecoderBuffer(),mesh=new m.Mesh();db.Init(new Int8Array(data),data.length);d.DecodeBufferToMesh(db,mesh);const a=d.GetAttributeByUniqueId(mesh,e.attributes.POSITION),values=new m.DracoFloat32Array();d.GetAttributeFloatForAllPoints(mesh,a,values)
const cam=new PerspectiveCamera(18.5,390/844,.005,150),position=new Vector3(),rot=new Matrix4().makeRotationZ(2*row.telemetry.shaft.cutter.rotation),pts=[]
for(let i=0;i<mesh.num_points();i++){const v=new Vector3(values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2));const y=-v.z*1000;if(y>=3.2&&y<=14.2)pts.push(v.applyMatrix4(rot))}
const proposed=[],az=20*Math.PI/180,el=.5*Math.PI/180,dist=.2
for(const fov of[18,18.5,19])for(const z of[.5,.75,1]){
 const target=new Vector3(0,z/1000,-.0085);cam.position.copy(target).add(new Vector3(dist*Math.cos(el)*Math.cos(az),dist*Math.cos(el)*Math.sin(az),-dist*Math.sin(el)));cam.up.set(0,1,0);cam.fov=fov;cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld()
 const pixels=pts.map(p=>{position.copy(p).project(cam);return[(position.x+1)*195,(1-position.y)*422]});const bounds={min:[Math.min(...pixels.map(p=>p[0])),Math.min(...pixels.map(p=>p[1]))],max:[Math.max(...pixels.map(p=>p[0])),Math.max(...pixels.map(p=>p[1]))]}
 proposed.push({fov,tgtNarrow_mm:[0,8.5,z],projected_critical_action_bounds:bounds,pass:bounds.min[0]>=31.2&&bounds.max[0]<=358.8&&bounds.min[1]>=row.dom.card.max[1]+8&&bounds.max[1]<=row.dom.footer.min[1]-8})
}
const result={schema:1,status:'CPU-only candidates; same-session rendered validation still required before applying/accepting',source_capture:{name:row.name,time:row.time,session:row.rendered.session},critical_band_y_mm:[3.2,14.2],actual_card_column:row.dom.card,actual_footer:row.dom.footer,candidates:proposed}
await fs.writeFile(path.join(out,'material-camera-candidates.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(proposed.filter(p=>p.pass)))
for(const o of[values,mesh,db,d])m.destroy(o)
