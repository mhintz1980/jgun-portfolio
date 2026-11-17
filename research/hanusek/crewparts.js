import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export const VER=0xE4572E;
export function superBlob(a,b,c,n,seg=80,lean=0){const g=new THREE.SphereGeometry(1,seg,seg*2/3|0);const p=g.attributes.position,v=new THREE.Vector3();
 const f=x=>Math.sign(x)*Math.pow(Math.abs(x),2/n);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);let x=f(v.x)*a,y=f(v.y)*b,z=f(v.z)*c;y+=lean*x;p.setXYZ(i,x,y,z);} g.computeVertexNormals();return g;}
export function rrShape(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
const mat=(color,rough=.62,extra={})=>new THREE.MeshPhysicalMaterial(Object.assign({color,roughness:rough,clearcoat:.15,clearcoatRoughness:.6,sheen:.4,sheenColor:0xffffff},extra));
// recessed display: bezel ring + dark glass plane; returns glass mesh (canvas applied later)
function display(parent,w,h,r,bezelColor){const g=new THREE.Group();
 const bez=new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(w+.12,h+.12,r+.06),{depth:.05,bevelEnabled:true,bevelSize:.03,bevelThickness:.025,bevelSegments:4}),mat(bezelColor,.5));g.add(bez);
 const gg=new THREE.ShapeGeometry(rrShape(w,h,r));const uv=gg.attributes.uv,p=gg.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/w+.5,p.getY(i)/h+.5);
 const glass=new THREE.Mesh(gg);glass.position.z=.1;g.add(glass);parent.add(g);return {g,glass,w,h};}
function button(parent,rad,color,depth=.08){const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*1.02,depth,40),mat(color,.38,{clearcoat:.6}));m.rotation.x=Math.PI/2;parent.add(m);return m;}
function grille(parent,rings,step,dot,color){const M=new THREE.MeshStandardMaterial({color,roughness:.9});const G=new THREE.CircleGeometry(dot,8);const g=new THREE.Group();
 for(let r=0;r<rings;r++){const k=Math.max(1,r*6);for(let i=0;i<k;i++){const a=i/k*Math.PI*2;const d=new THREE.Mesh(G,M);d.position.set(Math.cos(a)*r*step,Math.sin(a)*r*step,0);g.add(d);}}parent.add(g);return g;}
export const BUILD={
 vibe(c){const root=new THREE.Group(),shell=mat(c.color);
  const body=new THREE.Mesh(superBlob(1.75,1.12,1.0,3.2,96,-.08),shell);root.add(body);
  const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push(new THREE.Vector2(.55*Math.pow(1-t,1.6)+.13,-t*1.0));}
  const tail=new THREE.Mesh(new THREE.LatheGeometry(pts,48),shell);tail.position.set(-1.05,-.55,.15);tail.rotation.z=-.5;root.add(tail);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.15,32,16),shell);tip.position.set(-1.52,-1.38,.15);root.add(tip);
  const D=display(root,2.05,.7,.33,0xe6e1d8);D.g.position.set(.02,.12,.93);
  const gr=grille(root,5,.05,.018,0x8a857d);gr.position.set(-1.42,-.12,.9);gr.lookAt(-4.26,-.12,4);
  const bars=[];const bm=new THREE.MeshStandardMaterial({color:VER,emissive:VER,emissiveIntensity:.6,roughness:.4});
  for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.035,.2,.02),bm);b.position.set(1.28+i*.055,-.62,.78);b.rotation.y=.55;root.add(b);bars.push(b);}
  const ant=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.16,8,16),mat(VER,.35,{clearcoat:.6}));ant.position.set(1.32,1.0,.2);ant.rotation.z=-.25;root.add(ant);
  root.rotation.z=.12;
  return {root,D,acc:ant,anim:(t,RM)=>{bars.forEach((b,i)=>b.scale.y=RM?.6:.35+.65*Math.abs(Math.sin(t*4+i*.7)*Math.cos(t*2.3+i)));ant.rotation.z=-.25+(RM?0:Math.sin(t*3)*.06);}};},
 sonar(c){const root=new THREE.Group(),shell=mat(c.color);
  const prof=t=>{const top=Math.pow(Math.sin(Math.PI*(1-t)*.5),.6)*(1-.12*t);const bot=Math.min(1,Math.sqrt(Math.max(0,t)/.06));return 1.05*top*(0.25+0.75*bot)*(t<.06?1:1);};
  const pts=[];for(let i=0;i<=48;i++){const t=i/48;pts.push(new THREE.Vector2(Math.max(.001,t===0?.001:prof(t)),-1.55+t*3.1));}
  pts.unshift(new THREE.Vector2(.001,-1.55));
  const g=new THREE.LatheGeometry(pts,72);g.scale(1,1,.72);const body=new THREE.Mesh(g,shell);body.rotation.z=-.08;root.add(body);
  const zAt=y=>{const t=(y+1.55)/3.1;return prof(t)*.72;};
  const D=display(root,.5,.6,.1,0xe6e1d8);D.g.position.set(-.05,.12,zAt(.12)-.06);
  const btn=button(root,.13,VER);btn.position.set(-.05,-.55,zAt(-.55)+.02);
  const gr=grille(root,7,.055,.016,0xa8a299);const ry=.2,rr=prof((ry+1.55)/3.1);gr.position.set(-rr*.97,ry,rr*.72*.2);gr.rotation.y=-1.35;root.add(gr);
  return {root,D,acc:btn};},
 glyph(c){const root=new THREE.Group(),shell=mat(c.color,.55);
  const R=1.6,H=.85,e=.22;const pts=[new THREE.Vector2(.001,-H/2)];for(let i=0;i<=8;i++){const a=-Math.PI/2+i/8*Math.PI/2;pts.push(new THREE.Vector2(R-e+Math.cos(a)*e,-H/2+e+Math.sin(a)*e));}
  for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;pts.push(new THREE.Vector2(R-e+Math.cos(a)*e,H/2-e+Math.sin(a)*e));}pts.push(new THREE.Vector2(.001,H/2));
  const body=new THREE.Mesh(new THREE.LatheGeometry(pts,96),shell);root.add(body);
  // knurl ring on the side
  const ring=new THREE.Mesh(new THREE.TorusGeometry(R+.005,.012,6,160),mat(0x333333,.7));ring.rotation.x=Math.PI/2;ring.position.y=-.05;root.add(ring);
  const D=display(root,1.6,.58,.16,0x2a2a2a);D.g.rotation.x=-Math.PI/2;D.g.position.set(0,H/2-.02,-.15);
  const btn=button(root,.2,VER,.06);btn.rotation.x=0;btn.position.set(0,H/2+.02,.75);
  return {root,D,acc:btn};},
 swatch(c){const root=new THREE.Group(),shell=mat(c.color,.6);
  const body=new THREE.Mesh(new RoundedBoxGeometry(2.8,2.8,1.05,6,.32),shell);root.add(body);
  const D=display(root,2.0,1.38,.16,0xd04a24);D.g.position.set(0,.12,.5);
  const keys=[[0x3a3a3a,-.75,.34],[0x8a8a8a,-.3,.34],[VER,.15,.3],[0xF4F1EA,.58,.3]];let red;
  keys.forEach(([col,x,w])=>{const k=new THREE.Mesh(new THREE.CapsuleGeometry(.075,w,6,16),mat(col,.45,{clearcoat:.5}));k.rotation.z=Math.PI/2;k.position.set(x,1.43,.15);root.add(k);if(col===VER)red=k;});
  const slot=new THREE.Mesh(new RoundedBoxGeometry(1.0,.06,.06,2,.03),mat(0x9b3519,.7));slot.position.set(0,-1.05,.53);root.add(slot);
  const knob=new THREE.Mesh(new RoundedBoxGeometry(.14,.26,.12,3,.05),mat(0xF4F1EA,.45));knob.position.set(.08,-1.05,.58);root.add(knob);
  return {root,D,acc:red,anim:(t,RM)=>{knob.position.x=RM?.08:Math.sin(t*.7)*.38;}};},
 rivet(c){const root=new THREE.Group(),shell=mat(c.color,.66);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1.6,96,48,0,Math.PI*2,0,Math.PI/2),shell);dome.scale.set(1,.72,.92);dome.position.y=-.35;root.add(dome);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.52,.42,96),mat(0x5f5b56,.7));band.scale.z=.92;band.position.y=-.56;root.add(band);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(1.58,.03,8,160),mat(0x55514c,.7));lip.rotation.x=Math.PI/2;lip.scale.y=.92;lip.position.y=-.36;root.add(lip);
  const D=display(root,.46,.42,.08,0x55514c);D.g.position.set(0,.22,1.18);D.g.rotation.x=-.52;
  const led=new THREE.Mesh(new RoundedBoxGeometry(.22,.1,.06,2,.03),mat(VER,.35,{emissive:VER,emissiveIntensity:.35}));led.position.set(-.55,-.56,1.42);led.rotation.y=-.35;root.add(led);
  return {root,D,acc:led,anim:(t,RM)=>{led.material.emissiveIntensity=RM?.35:.2+.3*(Math.sin(t*3)>0?1:0);}};},
 patch(c){const root=new THREE.Group(),shell=mat(c.color,.65);
  const body=new THREE.Mesh(superBlob(1.65,1.05,1.32,2.5,96),shell);root.add(body);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.06,20,12),mat(VER,.3,{emissive:VER,emissiveIntensity:.5}));led.position.set(-1.12,.0,1.08);root.add(led);
  const D=display(root,1.55,.56,.2,0x8f8a83);D.g.position.set(-.05,-.15,1.27);D.g.rotation.x=-.18;
  return {root,D,acc:led,anim:(t,RM)=>{led.material.emissiveIntensity=RM?.5:.3+.4*(.5+.5*Math.sin(t*1.6));}};}
};
