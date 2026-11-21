import { expect, it } from 'vitest'
import { BoxGeometry, Matrix4, Vector3 } from 'three'
import { createPortalLightning, selectPortalContacts, PORTAL_ARC_COUNT } from './portalLightning'

it('samples actual source vertices and attaches all discharges in transformed sheet space', () => {
  const source = new BoxGeometry(.12,.08,.22); source.computeBoundingBox()
  const contacts=selectPortalContacts(source,source.boundingBox!)
  const raw=source.getAttribute('position')
  for(const p of contacts) expect(Array.from({length:raw.count},(_,i)=>new Vector3().fromBufferAttribute(raw,i))
    .some(v=>v.equals(p))).toBe(true)
  const outline=[[-.12,-.1],[.12,-.1],[.12,.1],[-.12,.1]]
  const arcs=createPortalLightning(outline)
  const context={sheetMatrix:new Matrix4().makeRotationY(.3),modelMatrix:new Matrix4().makeTranslation(.02,.08,.1)}
  arcs.update(.44,contacts,context,1)
  expect(arcs.stats.active).toBe(PORTAL_ARC_COUNT)
  const relative=context.sheetMatrix.clone().invert().multiply(context.modelMatrix)
  const a=arcs.geometry.getAttribute('position'), stride=a.count/PORTAL_ARC_COUNT
  for(let i=0;i<PORTAL_ARC_COUNT;i++) {
    const endpoint=new Vector3().fromBufferAttribute(a,i*stride+48)
    expect(endpoint.distanceTo(contacts[i].clone().applyMatrix4(relative))).toBeLessThan(1e-7)
  }
  const saved=Array.from(a.array)
  arcs.update(.447,contacts,context,1); expect(Array.from(a.array)).not.toEqual(saved)
  arcs.update(.44,contacts,context,1); expect(Array.from(a.array)).toEqual(saved)
  for(const p of [.2,.419, .466]) { arcs.update(p,contacts,context,1); expect(arcs.group.visible).toBe(false) }
  arcs.update(.44,contacts,context,0); expect(arcs.group.visible).toBe(false)
  arcs.dispose(); source.dispose()
})
