import { expect,it,vi } from 'vitest'
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { Box3,BufferAttribute,BufferGeometry,Group,Matrix4,Mesh,Vector3,type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildWrenchRig } from './nodeRoles'
import { applyWrenchMechanics } from './wrenchMechanics'
import { snapshotDrawing,makeDrawingLayout } from '../drawing/drawingGeometry'
import { drawingCacheKey } from '../drawing/sheet/drawingCache'
import { createJourneyCameraSampler,createJourneyPose } from '../torque-wrench/JourneyCamera'
import { narrativeModelToStudy } from '../inspection/shaft/frame'
import { measureShaftDisplacement,registerShaft } from '../torque-wrench/shaftJourneyRegistration'

/** Real GLB, native Draco WASM, real GLTFLoader names/parent chains; no GPU required. */
async function realSource(file='Default.glb') {
  const data=readFileSync('public/models/'+file)
  const require=createRequire(import.meta.url),draco=await require('draco3d').createDecoderModule({})
  const decoder={preload(){},decodeDracoFile(buffer:ArrayBuffer,done:(g:BufferGeometry)=>void,ids:Record<string,number>){
    const d=new draco.Decoder(),b=new draco.DecoderBuffer(),m=new draco.Mesh(),g=new BufferGeometry()
    b.Init(new Int8Array(buffer),buffer.byteLength)
    const result=d.DecodeBufferToMesh(b,m)
    if(!result.ok())throw new Error(result.error_msg())
    for(const [name,id] of Object.entries(ids)){
      const a=d.GetAttributeByUniqueId(m,id),values=new draco.DracoFloat32Array()
      d.GetAttributeFloatForAllPoints(m,a,values)
      const floats=new Float32Array(values.size())
      for(let i=0;i<floats.length;i++)floats[i]=values.GetValue(i)
      g.setAttribute(name,new BufferAttribute(floats,a.num_components()));draco.destroy(values)
    }
    const face=new draco.DracoInt32Array(),indices=new Uint32Array(m.num_faces()*3)
    for(let i=0;i<m.num_faces();i++){d.GetFaceFromMesh(m,i,face);for(let j=0;j<3;j++)indices[i*3+j]=face.GetValue(j)}
    g.setIndex(new BufferAttribute(indices,1))
    draco.destroy(face);draco.destroy(m);draco.destroy(b);draco.destroy(d);done(g)
  }}
  const loader=new GLTFLoader().setDRACOLoader(decoder as never)
  return (await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'' )).scene
}
const noop=()=>{}
function canvasGlobals(){
  const gradient={addColorStop:noop}
  const ctx=new Proxy({createRadialGradient:()=>gradient},{get:(obj,key)=>Reflect.get(obj,key)??noop,set:(obj,key,value)=>Reflect.set(obj,key,value)})
  vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx})})
  vi.stubGlobal('Path2D',class {moveTo=noop;lineTo=noop;closePath=noop})
}
function vertexHash(meshes:Mesh[]) {
  const rows:string[]=[],p=new Vector3()
  for(const mesh of meshes){mesh.updateWorldMatrix(true,false);const attr=mesh.geometry.getAttribute('position')
    for(let i=0;i<attr.count;i++){p.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld);rows.push(p.toArray().map(v=>v.toFixed(8)).join(','))}
  }
  return createHash('sha256').update(rows.sort().join('\n')).digest('hex')
}
function materialCounts(meshes:Mesh[]){
  const map=new Map<unknown,{vertices:number;indices:number}>()
  for(const m of meshes){const mat=Array.isArray(m.material)?m.material[0]:m.material
    const key=mat.name+'|'+mat.type+'|'+('color' in mat?String((mat as {color:{getHexString():string}}).color.getHexString()):'')
    const count=map.get(key)??{vertices:0,indices:0};count.vertices+=m.geometry.getAttribute('position').count;count.indices+=m.geometry.index?.count??0;map.set(key,count)}
  return map
}
/** Tenfold phase of the actual tooth cross section (not tessellation-weighted vertices). */
function toothPhase(meshes:Mesh[],transform:Matrix4,z=-.005) {
  const segments:Array<[number,number,number,number]>=[],v=[new Vector3(),new Vector3(),new Vector3()],hit:Vector3[]=[]
  const matrix=new Matrix4()
  for(const mesh of meshes){
    mesh.updateWorldMatrix(true,false);matrix.multiplyMatrices(transform,mesh.matrixWorld)
    const attr=mesh.geometry.getAttribute('position'),index=mesh.geometry.index,count=index?.count??attr.count
    for(let j=0;j<count;j+=3){
      for(let k=0;k<3;k++)v[k].fromBufferAttribute(attr,index?index.getX(j+k):j+k).applyMatrix4(matrix)
      hit.length=0
      for(let k=0;k<3;k++){
        const a=v[k],b=v[(k+1)%3]
        if((a.z<z)!==(b.z<z))hit.push(a.clone().lerp(b,(z-a.z)/(b.z-a.z)))
      }
      if(hit.length===2)segments.push([hit[0].x,hit[0].y,hit[1].x,hit[1].y])
    }
  }
  let cos=0,sin=0
  for(let j=0;j<7200;j++){
    const az=j*2*Math.PI/7200,dx=Math.cos(az),dy=Math.sin(az)
    let radius=0
    for(const [ax,ay,bx,by] of segments){
      const sx=bx-ax,sy=by-ay,den=dx*sy-dy*sx
      if(Math.abs(den)<1e-20)continue
      const r=(ax*sy-ay*sx)/den,t=(ax*dy-ay*dx)/den
      if(t>=0&&t<=1&&r>radius)radius=r
    }
    cos+=radius*Math.cos(10*az);sin+=radius*Math.sin(10*az)
  }
  return Math.atan2(sin,cos)/10
}
it('preserves real source geometry, materials, mechanics and the byte-exact drawing input',async()=>{
  canvasGlobals()
  try{
    const source=await realSource(),baseline=source.clone(true)
    const names:string[]=[],rawShaft:Mesh[]=[]
    source.traverse(o=>{if(/P001835/i.test(o.name))names.push(o.name);if(o instanceof Mesh){let p:Object3D|null=o;while(p&&!/P001835/.test(p.name))p=p.parent;if(p)rawShaft.push(o)}})
    expect(rawShaft.length).toBeGreaterThan(0)
    // Removing just the provenance name recovers the original clutch-static merge;
    // the A000881 owner, role and parent chains remain the same.
    baseline.traverse(o=>{o.name=o.name.replace(/P001835/g,'P00183X')})
    const rig=buildWrenchRig(source),old=buildWrenchRig(baseline),shaft=rig.meshes.filter(m=>m.userData.partNumber==='P001835')
    expect(shaft.length).toBeGreaterThan(0)
    for(const m of shaft){expect(m.parent).toBe(rig.clutch.static);expect(m.material).toBe(rig.originalMaterials.get(m));expect(old.meshes.some(o=>o.material===m.material)).toBe(true)}
    const splitHash=vertexHash(rig.meshes),oldHash=vertexHash(old.meshes)
    expect(splitHash).toBe(oldHash)
    expect(materialCounts(rig.meshes)).toEqual(materialCounts(old.meshes))
    const snapshot=snapshotDrawing({...rig,meshes:source.userData.journeyDrawingMeshes}),original=snapshotDrawing(old)
    const hash=(g:BufferGeometry)=>createHash('sha256').update(Buffer.from(g.getAttribute('position').array.buffer)).digest('hex')
    expect(hash(snapshot.geometry)).toBe(hash(original.geometry))
    const key=await drawingCacheKey(snapshot,makeDrawingLayout(1,snapshot.bounds)),oldKey=await drawingCacheKey(original,makeDrawingLayout(1,original.bounds))
    expect(key).toBe(oldKey)
    const rest=new Matrix4().copy(source.matrixWorld).invert().multiply(rig.clutch.static!.matrixWorld).invert()
    applyWrenchMechanics(rig,{shift:1,explode:0,gearAngle:0,idle:0})
    const delta=measureShaftDisplacement(source,rig.clutch.static!,rest,new Matrix4())
    expect(Math.max(...delta.elements.map((v,i)=>Math.abs(v-new Matrix4().elements[i])))).toBeLessThan(1e-9)
    for(const state of [{shift:1,explode:0,gearAngle:0,idle:0},{shift:1,explode:.3,gearAngle:4,idle:0},{shift:0,explode:1,gearAngle:8,idle:0}]){
      applyWrenchMechanics(rig,state);applyWrenchMechanics(old,state);source.updateMatrixWorld(true);baseline.updateMatrixWorld(true)
      expect(rig.clutch.static!.matrixWorld.elements).toEqual(old.clutch.static!.matrixWorld.elements)
      expect(vertexHash(rig.meshes)).toBe(vertexHash(old.meshes))
    }
    // Registration landmarks use the real exported meshes, in canonical study metres.
    applyWrenchMechanics(rig,{shift:1,explode:0,gearAngle:0,idle:0});source.updateMatrixWorld(true)
    const n=narrativeModelToStudy(new Matrix4()),sourceBounds=new Box3(),point=new Vector3()
    for(const m of shaft){const attr=m.geometry.getAttribute('position');for(let j=0;j<attr.count;j++)sourceBounds.expandByPoint(point.fromBufferAttribute(attr,j).applyMatrix4(m.matrixWorld).applyMatrix4(n))}
    const study=await realSource('manufacturing-core-full.glb')
    const sourcePhase=toothPhase(shaft,n)
    const landmarks=['legacyshaft','approvedshaft'].map(name=>{
      const node=study.getObjectByName(name)
      if(!node)throw new Error('Missing real study '+name)
      const bounds=new Box3().setFromObject(node,true)
      const meshes:Mesh[]=[];node.traverse(o=>{if(o instanceof Mesh)meshes.push(o)})
      const phase=toothPhase(meshes,new Matrix4()),clockingErrorDeg=Math.abs(Math.atan2(Math.sin(10*(phase-sourcePhase)),Math.cos(10*(phase-sourcePhase)))/10)*180/Math.PI
      expect(clockingErrorDeg).toBeLessThan(.5)
      return {name,clockingErrorDeg,bounds:[bounds.min.toArray(),bounds.max.toArray()],axialDatumErrorMm:[(bounds.min.z-sourceBounds.min.z)*1000,(bounds.max.z-sourceBounds.max.z)*1000]}
    })
    // The source clutch does not rotate at shift=1. Both shafts use registered Z.
    const axisErrorDeg=new Vector3(0,0,1).transformDirection(n).angleTo(new Vector3(0,0,1))*180/Math.PI
    expect(axisErrorDeg).toBeLessThan(.1)
    const host=new Group();host.position.copy(rig.center).negate();host.add(source);host.updateMatrixWorld(true)
    const h=registerShaft(source.matrixWorld,delta,new Matrix4()),sample=createJourneyCameraSampler(),pose=createJourneyPose()
    const housingHull=new Box3().setFromObject(rig.housing!,true).union(new Box3().setFromObject(rig.clutch.static!,true))
    let hullClearance=Infinity,maxStep=0,polar=0
    for(const aspect of [1440/900,390/844])for(const [a,b] of [[.56,.62],[.83,.94]]){
      let previous:Vector3|null=null
      for(let j=0;j<=1000;j++){
        sample(a+(b-a)*j/1000,aspect,h,pose)
        hullClearance=Math.min(hullClearance,housingHull.distanceToPoint(pose.position));polar=Math.max(polar,Math.abs(pose.up.clone().normalize().dot(pose.target.clone().sub(pose.position).normalize())))
        if(previous)maxStep=Math.max(maxStep,previous.distanceTo(pose.position))
        previous=pose.position.clone()
      }
    }
    // AABB contains the assembled housing/clutch hull: this is a conservative clearance.
    expect(hullClearance).toBeGreaterThan(.001+maxStep);expect(polar).toBeLessThan(.98)
    mkdirSync('output/playwright/jg038-single-gearbox-20261019',{recursive:true})
    writeFileSync('output/playwright/jg038-single-gearbox-20261019/worker-real-asset.json',JSON.stringify({names,rawShaftMeshes:rawShaft.length,renderedShaftMeshes:shaft.length,renderedShaftVertices:shaft.reduce((n,m)=>n+m.geometry.getAttribute('position').count,0),vertexHash:splitHash,drawingHash:hash(snapshot.geometry),drawingCacheKey:key,delta:delta.toArray(),axisErrorDeg,sourceStudyBounds:[sourceBounds.min.toArray(),sourceBounds.max.toArray()],landmarks,hullClearance,maxCameraStep:maxStep,maxPolarUpDotView:polar,toothClocking:'Tenfold Fourier phase of exact triangle cross-sections at study z=-5 mm; 7200 uniform angular rays, modulo one tooth pitch.'},null,2))
    snapshot.geometry.dispose();original.geometry.dispose()
  }finally{vi.unstubAllGlobals()}
},60000)
