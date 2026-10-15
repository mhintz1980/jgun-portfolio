/**
 * JG-038 Lane B performance observability.
 *
 * The browser initializer is self-contained because Playwright serializes this function with
 * addInitScript before the private page creates WebGL state.
 */
export const TORQUE_PERFORMANCE_PHASES = Object.freeze(['drafting', 'breakthrough', 'mechanism', 'inspection', 'close'])

export function phaseWindow(beats, phase) {
  if (!TORQUE_PERFORMANCE_PHASES.includes(phase)) return { ok: false, error: 'Unknown performance phase: ' + String(phase) }
  if (!Array.isArray(beats) || beats.length === 0) return { ok: false, error: 'Missing narrative beats' }
  const rows = beats.filter((beat) => beat?.chapter === phase)
  if (rows.length === 0) return { ok: false, error: 'No narrative beats map to phase ' + phase }
  const start = Math.min(...rows.map((beat) => Number(beat.start)))
  const end = Math.max(...rows.map((beat) => Number(beat.end)))
  if (![start, end].every((n) => Number.isFinite(n) && n >= 0 && n <= 1) || start >= end) return { ok: false, error: 'Invalid narrative phase window for ' + phase }
  return { ok: true, phase, start, end, beats: rows.map((beat) => beat.id) }
}

export function percentile(values, fraction) {
  const rows = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b)
  if (rows.length === 0) return null
  const index = Math.min(rows.length - 1, Math.max(0, Math.ceil(fraction * rows.length) - 1))
  return rows[index]
}

export function summarizeFrameSamples(samples, tailThresholdMs) {
  const rows = Array.isArray(samples) ? samples : []
  const intervals = rows.map((row) => Number(row?.interval)).filter((n) => Number.isFinite(n) && n > 0)
  const maxBy = (key) => rows.reduce((max, row) => Math.max(max, Number(row?.[key]) || 0), 0)
  const tailCount = intervals.filter((interval) => interval > tailThresholdMs).length
  return {
    presentedFrames: intervals.length,
    p50: percentile(intervals, 0.5),
    p95: percentile(intervals, 0.95),
    p99: percentile(intervals, 0.99),
    maximum: intervals.length ? Math.max(...intervals) : null,
    tailPercent: intervals.length ? (100 * tailCount) / intervals.length : null,
    peakFrameCalls: maxBy('calls'),
    peakFrameTriangles: maxBy('triangles'),
    peakFrameLineSegments: maxBy('lineSegments'),
    peakFramePoints: maxBy('points'),
    method: 'presented-frame intervals from one harness-owned sentinel rAF registered after the existing render loop; direct WebGL command totals close at each sentinel callback',
  }
}

export function deriveHardwareGl(renderer) {
  const value = String(renderer || '')
  if (!value) return { hardwareGL: false, basis: 'WEBGL_debug_renderer_info unavailable' }
  const software = /swiftshader|llvmpipe|software|basic render|mesa offscreen/i.test(value)
  return { hardwareGL: !software, basis: software ? 'observed WebGL renderer identifies software rendering' : 'observed WEBGL_debug_renderer_info renderer string does not identify software rendering' }
}

/**
 * Node-side mirror of the draw-entry and texel-size rules that run inside the page initializer.
 * Playwright serializes torquePerformanceObserverInit with addInitScript, so the initializer must
 * stay self-contained and repeats these tables verbatim; this mirror is what the browser-free pure
 * checks exercise, and those checks also assert the initializer source still carries the corrected
 * literals so the two copies cannot drift silently.
 */
export const TEXEL_BYTE_SIZE = Object.freeze({
  R8: 1, R8I: 1, R8UI: 1, LUMINANCE8: 1, ALPHA8: 1, STENCIL_INDEX8: 1,
  RG8: 2, RG8I: 2, RG8UI: 2, LUMINANCE_ALPHA8: 2, R16F: 2, R16I: 2, R16UI: 2, DEPTH_COMPONENT16: 2, RGB565: 2,
  RGB8: 3, SRGB8: 3, DEPTH_COMPONENT24: 3,
  RGBA4: 2, RGB5_A1: 2,
  RGBA8: 4, SRGB8_ALPHA8: 4, RGB10_A2: 4, RG16F: 4, RG16I: 4, RG16UI: 4, R32F: 4,
  DEPTH_COMPONENT32F: 4, DEPTH24_STENCIL8: 4, DEPTH32F_STENCIL8: 8, R11F_G11F_B10F: 4, RGB9_E5: 4,
  RGB16F: 6,
  RGBA16F: 8, RGBA16I: 8, RGBA16UI: 8, RG32F: 8,
  RGBA32F: 16,
})

export const CORE_DRAW_NAMES = Object.freeze(['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements', 'drawArraysInstancedBaseInstance', 'drawElementsInstancedBaseVertex', 'drawElementsInstancedBaseInstance', 'drawElementsInstancedBaseVertexBaseInstance'])
export const INSTANCED_EXTENSION_DRAW_NAMES = Object.freeze(['drawArraysInstancedANGLE', 'drawElementsInstancedANGLE'])
export const MULTI_DRAW_ENTRY_NAMES = Object.freeze(['multiDrawArraysWEBGL', 'multiDrawElementsWEBGL', 'multiDrawArraysInstancedWEBGL', 'multiDrawElementsInstancedWEBGL'])

export function texelBytesPerFormat(format) {
  const name = String(format ?? '')
  return Object.prototype.hasOwnProperty.call(TEXEL_BYTE_SIZE, name) ? TEXEL_BYTE_SIZE[name] : null
}

/**
 * Classifies a WebGL method name: 'coreDraw'/'instancedExtension' are geometry-accounted draw
 * commands, 'multiDraw' names the WEBGL_multi_draw entry points explicitly (their per-sub-draw
 * geometry is not derivable from the argument list here), 'unrecognizedDraw' is a draw-like name
 * with no known signature, and 'nonDraw' covers state calls such as drawBuffers and drawingBuffer*
 * that are not draw commands at all. Returns null for names that are not draw entry points.
 */
export function classifyDrawEntry(name) {
  const value = String(name)
  if (/^(drawBuffers|drawingBuffer)/.test(value)) return 'nonDraw'
  if (CORE_DRAW_NAMES.includes(value)) return 'coreDraw'
  if (INSTANCED_EXTENSION_DRAW_NAMES.includes(value)) return 'instancedExtension'
  if (MULTI_DRAW_ENTRY_NAMES.includes(value)) return 'multiDraw'
  if (/^(draw|multiDraw)/i.test(value)) return 'unrecognizedDraw'
  return null
}

export function torquePerformanceObserverInit() {
  const PORT = '__torquePerformanceObserver'
  const globalThis = window
  if (globalThis[PORT]) return
  const state = {
    installedAt: performance.now(), contextCount: 0, contexts: [], measurement: null, frameSamples: [],
    currentFrame: { calls: 0, triangles: 0, lineSegments: 0, points: 0 }, programEvents: [], programSequence: 0, programEventSequence: 0,
    programInfo: new Map(), shaderInfo: new Map(), linkedPrograms: new Set(), textures: new Map(), renderbuffers: new Map(),
    buffers: new Map(), framebuffers: new Map(), unknownFormatEvents: 0, unsupportedDrawCalls: 0, multiDrawCalls: 0,
    unsupportedAllocationEvents: 0, unsupportedAllocationPaths: new Map(), drawCallsTotal: 0,
    hiddenDuringMeasurement: false, visibilityChanges: [], battery: { status: 'UNVERIFIED', reason: 'navigator.getBattery result not observed yet' },
  }
  const objectKey = (map, object, factory) => { if (!map.has(object)) map.set(object, factory()); return map.get(object) }
  const eventName = (record, value) => record.constantNames?.get(value) ?? String(value)
  const byteLength = (value) => {
    if (value == null) return null
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return value.byteLength
    if (typeof value === 'number') return value
    return typeof value.byteLength === 'number' ? value.byteLength : null
  }
  const fnv1a = (text) => {
    let hash = 0x811c9dc5
    const string = String(text)
    for (let i = 0; i < string.length; i++) { hash ^= string.charCodeAt(i); hash = Math.imul(hash, 0x01000193) }
    return (hash >>> 0).toString(16).padStart(8, '0')
  }
  // Texel storage size by sized internal format. Only formats with a fixed, well-established
  // per-texel size appear here; block-compressed formats (ETC/BC/RGTC), compressed uploads, 3D
  // storage and any unlisted format resolve to null and keep the byte estimate explicitly incomplete.
  const TEXEL_BYTE_SIZE = Object.freeze({
    R8: 1, R8I: 1, R8UI: 1, LUMINANCE8: 1, ALPHA8: 1, STENCIL_INDEX8: 1,
    RG8: 2, RG8I: 2, RG8UI: 2, LUMINANCE_ALPHA8: 2, R16F: 2, R16I: 2, R16UI: 2, DEPTH_COMPONENT16: 2, RGB565: 2,
    RGB8: 3, SRGB8: 3, DEPTH_COMPONENT24: 3,
    RGBA4: 2, RGB5_A1: 2,
    RGBA8: 4, SRGB8_ALPHA8: 4, RGB10_A2: 4, RG16F: 4, RG16I: 4, RG16UI: 4, R32F: 4,
    DEPTH_COMPONENT32F: 4, DEPTH24_STENCIL8: 4, DEPTH32F_STENCIL8: 8, R11F_G11F_B10F: 4, RGB9_E5: 4,
    RGB16F: 6,
    RGBA16F: 8, RGBA16I: 8, RGBA16UI: 8, RG32F: 8,
    RGBA32F: 16,
  })
  const bytesPerTexel = (format) => {
    const name = String(format ?? '')
    return Object.prototype.hasOwnProperty.call(TEXEL_BYTE_SIZE, name) ? TEXEL_BYTE_SIZE[name] : null
  }
  const primitiveGeometry = (record, mode, vertexCount, instances = 1) => {
    const ctx = record.context, count = Math.max(0, Number(vertexCount) || 0), repeat = Math.max(1, Number(instances) || 1)
    let triangles = 0, lineSegments = 0, points = 0
    if (mode === ctx.POINTS) points = count
    else if (mode === ctx.LINES) lineSegments = Math.floor(count / 2)
    else if (mode === ctx.LINE_LOOP) lineSegments = count
    else if (mode === ctx.LINE_STRIP) lineSegments = Math.max(0, count - 1)
    else if (mode === ctx.TRIANGLES) triangles = Math.floor(count / 3)
    else if (mode === ctx.TRIANGLE_STRIP || mode === ctx.TRIANGLE_FAN) triangles = Math.max(0, count - 2)
    return { triangles: triangles * repeat, lineSegments: lineSegments * repeat, points: points * repeat }
  }
  const addDraw = (geometry, record) => {
    state.drawCallsTotal++
    if (!state.measurement) return
    record.liveFrameCalls = (record.liveFrameCalls || 0) + 1
    state.currentFrame.calls++
    state.currentFrame.triangles += geometry.triangles
    state.currentFrame.lineSegments += geometry.lineSegments
    state.currentFrame.points += geometry.points
  }
  const pushProgramEvent = (kind, program, detail = {}) => {
    const info = objectKey(state.programInfo, program, () => ({ id: ++state.programSequence, createdAt: performance.now(), links: 0, deleted: false, shaders: [] }))
    const event = { kind, programId: info.id, at: performance.now(), ...detail, sequence: ++state.programEventSequence }
    if (kind === 'link') info.links++
    if (kind === 'delete') info.deleted = true
    state.programEvents.push(event)
    if (state.programEvents.length > 2048) state.programEvents.shift()
  }
  const replaceTextureLevel = (record, texture, target, level, entry) => {
    const info = objectKey(state.textures, texture, () => ({ id: state.textures.size + 1, context: record.id, createdAt: performance.now(), levels: [], bytes: 0, unknownFormats: 0 }))
    const targetName = eventName(record, target)
    const index = info.levels.findIndex((row) => row.target === targetName && row.level === Number(level))
    if (index >= 0) info.bytes -= info.levels[index].bytes || 0
    const next = { ...entry, target: targetName, level: Number(level) }
    if (index >= 0) info.levels[index] = next; else info.levels.push(next)
    info.bytes += next.bytes || 0
  }
  // Optional chaining is not a valid assignment target, so per-texture unknown-format counts
  // are recorded through an explicit guard.
  const noteUnknownFormat = (texture) => {
    state.unknownFormatEvents++
    const info = state.textures.get(texture)
    if (info) info.unknownFormats += 1
  }
  // Allocation and mipmap paths whose byte contribution is not derivable from the observed
  // arguments. Any occurrence keeps the memory estimate explicitly incomplete.
  const noteUnsupportedAllocation = (path) => {
    state.unsupportedAllocationEvents += 1
    state.unsupportedAllocationPaths.set(path, (state.unsupportedAllocationPaths.get(path) || 0) + 1)
  }
  const pushUniqueName = (list, name) => { if (!list.includes(name)) list.push(name) }
  const pushUniqueEntry = (list, entry) => { if (!list.some((row) => row.name === entry.name)) list.push(entry) }
  const uniqueEntries = (list) => {
    const seen = new Set()
    return list.filter((row) => { if (seen.has(row.name)) return false; seen.add(row.name); return true })
  }

  const textureDimensions = (args) => {
    // 9-arg texImage2D ends in pixels; the 10-arg overload inserts depth before border.
    if (args.length >= 9) return { width: Number(args[3]), height: Number(args[4]), depth: args.length >= 10 ? Number(args[5]) : 1 }
    if (args.length >= 7 && args.length <= 8) return { width: Number(args[4]), height: Number(args[5]), depth: 1 }
    const source = args[5]
    return { width: Number(source?.width ?? source?.videoWidth ?? source?.clientWidth), height: Number(source?.height ?? source?.videoHeight ?? source?.clientHeight), depth: 1 }
  }
  const instrumentContext = (context, contextType, attributes, canvas) => {
    if (state.contexts.some((row) => row.context === context)) return
    const record = { id: ++state.contextCount, context, contextType, attributes: { ...attributes }, canvas, createdAt: performance.now(), boundBuffers: new Map(), boundTextures: new Map(), activeTexture: context.TEXTURE0, constantNames: new Map(), drawMethodsWrapped: [], nonDrawMethods: [], extensionDrawPaths: [], unsupportedDrawMethods: [] }
    state.contexts.push(record)
    for (const prototype of [Object.getPrototypeOf(context), Object.getPrototypeOf(Object.getPrototypeOf(context))]) {
      if (!prototype) continue
      for (const name of Object.getOwnPropertyNames(prototype)) {
        const value = context[name]
        if (typeof value === 'number' && /^[A-Z0-9_]+$/.test(name) && !record.constantNames.has(value)) record.constantNames.set(value, name)
      }
    }
    // One wrapper per target method. getExtension can hand back the same extension object on every
    // call, and re-wrapping it would multiply every counted draw, so each target/name pair is wrapped
    // at most once.
    const wrappedTargets = new WeakMap()
    const wrapOn = (target, name, handler) => {
      const original = target[name]
      if (typeof original !== 'function') return false
      let names = wrappedTargets.get(target)
      if (names === undefined) { names = new Set(); wrappedTargets.set(target, names) }
      if (names.has(name)) return false
      names.add(name)
      target[name] = (...args) => handler(args, () => original.apply(target, args))
      return true
    }
    const wrap = (name, handler) => wrapOn(context, name, handler)
    // Draw entries are classified by name so a state call such as drawBuffers is never counted as a
    // draw, and so an extension draw path is named explicitly instead of appearing as an anonymous
    // unsupported method. Only entries whose per-primitive geometry is derivable are tallied.
    const CORE_DRAW_NAMES = ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements', 'drawArraysInstancedBaseInstance', 'drawElementsInstancedBaseVertex', 'drawElementsInstancedBaseInstance', 'drawElementsInstancedBaseVertexBaseInstance']
    const INSTANCED_EXTENSION_DRAW_NAMES = ['drawArraysInstancedANGLE', 'drawElementsInstancedANGLE']
    const MULTI_DRAW_ENTRY_NAMES = ['multiDrawArraysWEBGL', 'multiDrawElementsWEBGL', 'multiDrawArraysInstancedWEBGL', 'multiDrawElementsInstancedWEBGL']
    const DRAW_GEOMETRY_ARGS = new Map([
      ['drawArrays', (args) => [Number(args[2]), 1]],
      ['drawElements', (args) => [Number(args[1]), 1]],
      ['drawArraysInstanced', (args) => [Number(args[2]), args[3]]],
      ['drawElementsInstanced', (args) => [Number(args[1]), args[3]]],
      ['drawRangeElements', (args) => [Number(args[3]), 1]],
      ['drawArraysInstancedBaseInstance', (args) => [Number(args[2]), args[3]]],
      ['drawElementsInstancedBaseVertex', (args) => [Number(args[1]), args[4]]],
      ['drawElementsInstancedBaseInstance', (args) => [Number(args[1]), args[4]]],
      ['drawElementsInstancedBaseVertexBaseInstance', (args) => [Number(args[1]), args[4]]],
      ['drawArraysInstancedANGLE', (args) => [Number(args[2]), args[3]]],
      ['drawElementsInstancedANGLE', (args) => [Number(args[1]), args[4]]],
    ])
    const classifyDrawEntry = (name) => {
      const value = String(name)
      if (/^(drawBuffers|drawingBuffer)/.test(value)) return 'nonDraw'
      if (DRAW_GEOMETRY_ARGS.has(value)) return CORE_DRAW_NAMES.includes(value) ? 'coreDraw' : 'instancedExtension'
      if (MULTI_DRAW_ENTRY_NAMES.includes(value)) return 'multiDraw'
      if (/^(draw|multiDraw)/i.test(value)) return 'unrecognizedDraw'
      return null
    }
    const installDrawEntry = (target, name, kind, source) => {
      const argsFor = DRAW_GEOMETRY_ARGS.get(name) ?? null
      const wrapped = wrapOn(target, name, (args, invoke) => {
        const result = invoke()
        const geometry = argsFor ? argsFor(args) : null
        if (geometry) addDraw(primitiveGeometry(record, args[0], geometry[0], geometry[1]), record)
        else {
          state.unsupportedDrawCalls += 1
          if (kind === 'multiDraw') state.multiDrawCalls += 1
          if (state.measurement) state.currentFrame.calls += 1
        }
        return result
      })
      if (!wrapped) return
      if (kind === 'coreDraw' || kind === 'instancedExtension') pushUniqueName(record.drawMethodsWrapped, name)
      else if (kind === 'multiDraw') pushUniqueEntry(record.extensionDrawPaths, { name, source, kind: 'multi-draw extension path', geometryAccounted: false })
      else pushUniqueEntry(record.unsupportedDrawMethods, { name, source, reason: 'unrecognized draw-like entry point; per-primitive geometry is not attributable' })
    }
    for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(context))) {
      if (typeof context[name] !== 'function') continue
      const kind = classifyDrawEntry(name)
      if (!kind) continue
      if (kind === 'nonDraw') { pushUniqueName(record.nonDrawMethods, name); continue }
      installDrawEntry(context, name, kind, 'context')
    }
    wrap('activeTexture', (args, invoke) => { const result = invoke(); record.activeTexture = args[0]; return result })
    wrap('bindTexture', (args, invoke) => { const result = invoke(); const key = record.activeTexture + ':' + args[0]; if (args[1]) record.boundTextures.set(key, args[1]); else record.boundTextures.delete(key); return result })
    wrap('texImage2D', (args, invoke) => {
      const result = invoke()
      const texture = record.boundTextures.get(record.activeTexture + ':' + args[0])
      if (texture) {
        const dims = textureDimensions(args), internalFormat = eventName(record, args[2]), bytesPer = bytesPerTexel(internalFormat)
        if (bytesPer == null) noteUnknownFormat(texture)
        replaceTextureLevel(record, texture, args[0], args[1], { width: dims.width, height: dims.height, depth: dims.depth, internalFormat, format: args.length >= 9 ? eventName(record, args[7]) : eventName(record, args[3]), type: args.length >= 9 ? eventName(record, args[8]) : eventName(record, args[4]), bytes: bytesPer == null ? 0 : dims.width * dims.height * dims.depth * bytesPer, unknownBytes: bytesPer == null })
      }
      return result
    })
    wrap('texSubImage2D', (args, invoke) => {
      const result = invoke(), texture = record.boundTextures.get(record.activeTexture + ':' + args[0]), info = state.textures.get(texture)
      // A 2D sub-image updates an already-allocated level and changes no byte total. When no
      // allocation was recorded for that level the contribution is unknown, so the estimate is
      // marked incomplete rather than accepted silently.
      if (!info || !info.levels.some((level) => level.target === eventName(record, args[0]) && level.level === Number(args[1]))) noteUnsupportedAllocation('texSubImage2D-without-recorded-level')
      return result
    })
    wrap('texStorage2D', (args, invoke) => {
      const result = invoke(), texture = record.boundTextures.get(record.activeTexture + ':' + args[0])
      if (texture) {
        const internalFormat = eventName(record, args[2]), bytesPer = bytesPerTexel(internalFormat)
        if (bytesPer == null) noteUnknownFormat(texture)
        for (let level = 0; level < Number(args[1]); level++) {
          const width = Math.max(1, Number(args[3]) >> level), height = Math.max(1, Number(args[4]) >> level)
          replaceTextureLevel(record, texture, args[0], level, { width, height, depth: 1, internalFormat, format: internalFormat, type: 'storage', bytes: bytesPer == null ? 0 : width * height * bytesPer, unknownBytes: bytesPer == null })
        }
      }
      return result
    })
    wrap('texImage3D', (args, invoke) => {
      const result = invoke(), texture = record.boundTextures.get(record.activeTexture + ':' + args[0])
      if (texture) {
        const internalFormat = eventName(record, args[2]), bytesPer = bytesPerTexel(internalFormat)
        if (bytesPer == null) noteUnknownFormat(texture)
        replaceTextureLevel(record, texture, args[0], args[1], { width: Number(args[4]), height: Number(args[5]), depth: Number(args[6]), internalFormat, format: eventName(record, args[7]), type: eventName(record, args[8]), bytes: bytesPer == null ? 0 : Number(args[4]) * Number(args[5]) * Number(args[6]) * bytesPer, unknownBytes: bytesPer == null })
      }
      return result
    })
    // Paths with no correct byte accounting yet: 3D storage and sub-image uploads, mipmap chain
    // generation and every compressed upload. Each one marks the estimate incomplete instead of
    // contributing a guessed or partial total.
    wrap('texSubImage3D', (args, invoke) => { const result = invoke(); noteUnsupportedAllocation('texSubImage3D'); return result })
    wrap('texStorage3D', (args, invoke) => { const result = invoke(); noteUnsupportedAllocation('texStorage3D'); return result })
    wrap('generateMipmap', (args, invoke) => { const result = invoke(); noteUnsupportedAllocation('generateMipmap'); return result })
    for (const name of ['compressedTexImage2D', 'compressedTexImage3D', 'compressedTexSubImage2D', 'compressedTexSubImage3D']) {
      wrap(name, (args, invoke) => { const result = invoke(); noteUnsupportedAllocation(name); return result })
    }
    wrap('deleteTexture', (args, invoke) => { const result = invoke(); state.textures.delete(args[0]); return result })
    wrap('bindBuffer', (args, invoke) => { const result = invoke(); if (args[1]) record.boundBuffers.set(args[0], args[1]); else record.boundBuffers.delete(args[0]); return result })
    wrap('bufferData', (args, invoke) => { const result = invoke(); const buffer = record.boundBuffers.get(args[0]); if (buffer) objectKey(state.buffers, buffer, () => ({ context: record.id, bytes: 0, unknownBytes: false })).bytes = byteLength(args[1]) || 0; return result })
    wrap('deleteBuffer', (args, invoke) => { const result = invoke(); state.buffers.delete(args[0]); return result })
    wrap('bindRenderbuffer', (args, invoke) => { const result = invoke(); record.boundRenderbuffer = args[1] || null; return result })
    wrap('bindFramebuffer', (args, invoke) => { const result = invoke(); record.boundFramebuffer = args[1] || null; return result })
    wrap('renderbufferStorage', (args, invoke) => {
      const result = invoke(), rb = record.boundRenderbuffer
      if (rb) {
        const format = eventName(record, args[1]), bytesPer = bytesPerTexel(format)
        if (bytesPer == null) state.unknownFormatEvents++
        state.renderbuffers.set(rb, { id: state.renderbuffers.size + 1, context: record.id, format, samples: 1, width: Number(args[2]), height: Number(args[3]), bytes: bytesPer == null ? 0 : Number(args[2]) * Number(args[3]) * bytesPer, unknownBytes: bytesPer == null })
      }
      return result
    })
    wrap('renderbufferStorageMultisample', (args, invoke) => {
      const result = invoke(), rb = record.boundRenderbuffer
      if (rb) {
        // WebGL2 signature: (target, samples, internalformat, width, height). The earlier partial
        // helper read the format from the width slot and left 'context' unassigned (an implicit
        // global), so MSAA renderbuffer bytes were mis-formatted and attributed to no context.
        const format = eventName(record, args[2]), bytesPer = bytesPerTexel(format)
        if (bytesPer == null) state.unknownFormatEvents++
        state.renderbuffers.set(rb, { id: state.renderbuffers.size + 1, context: record.id, format, samples: Number(args[1]), width: Number(args[3]), height: Number(args[4]), bytes: bytesPer == null ? 0 : Number(args[3]) * Number(args[4]) * Number(args[1]) * bytesPer, unknownBytes: bytesPer == null })
      }
      return result
    })
    wrap('framebufferTexture2D', (args, invoke) => {
      const result = invoke(), fb = record.boundFramebuffer
      if (fb && args[2]) {
        const info = state.framebuffers.get(fb) || { id: state.framebuffers.size + 1, context: record.id, attachments: {} }
        info.attachments[eventName(record, args[1])] = { type: 'texture', target: eventName(record, args[2]), texture: state.textures.get(args[3])?.id ?? null, level: Number(args[4]) }
        state.framebuffers.set(fb, info)
      }
      return result
    })
    wrap('framebufferRenderbuffer', (args, invoke) => {
      const result = invoke(), fb = record.boundFramebuffer
      if (fb && args[3]) {
        const info = state.framebuffers.get(fb) || { id: state.framebuffers.size + 1, context: record.id, attachments: {} }
        info.attachments[eventName(record, args[1])] = { type: 'renderbuffer', renderbuffer: state.renderbuffers.get(args[3])?.id ?? null }
        state.framebuffers.set(fb, info)
      }
      return result
    })
    wrap('createShader', (args, invoke) => { const shader = invoke(); state.shaderInfo.set(shader, { type: eventName(record, args[0]), sourceHash: null, sourceLength: 0 }); return shader })
    wrap('shaderSource', (args, invoke) => { const result = invoke(); const info = state.shaderInfo.get(args[0]); if (info) { info.sourceHash = fnv1a(args[1]); info.sourceLength = String(args[1]).length } return result })
    wrap('createProgram', (args, invoke) => { const program = invoke(); pushProgramEvent('create', program); return program })
    wrap('attachShader', (args, invoke) => { const result = invoke(); const info = state.programInfo.get(args[0]), shader = state.shaderInfo.get(args[1]); if (info && shader) info.shaders.push({ ...shader }); return result })
    wrap('linkProgram', (args, invoke) => { const result = invoke(); pushProgramEvent('link', args[0], { shaders: state.programInfo.get(args[0])?.shaders.map((shader) => ({ ...shader })) ?? [] }); return result })
    wrap('getProgramParameter', (args, invoke) => { const result = invoke(); if (args[1] === context.LINK_STATUS && result === true) state.linkedPrograms.add(args[0]); return result })
    wrap('deleteProgram', (args, invoke) => { const result = invoke(); pushProgramEvent('delete', args[0]); return result })
    wrap('getExtension', (args, invoke) => {
      const extension = invoke()
      if (extension && typeof extension === 'object') {
        const prototype = Object.getPrototypeOf(extension)
        for (const name of prototype ? Object.getOwnPropertyNames(prototype) : []) {
          if (typeof extension[name] !== 'function') continue
          const kind = classifyDrawEntry(name)
          if (!kind) continue
          if (kind === 'nonDraw') { pushUniqueName(record.nonDrawMethods, name); continue }
          installDrawEntry(extension, name, kind, 'extension')
        }
      }
      return extension
    })
  }
  const originalCanvasGetContext = window.HTMLCanvasElement?.prototype?.getContext
  if (originalCanvasGetContext) {
    window.HTMLCanvasElement.prototype.getContext = function getContext(type, options) {
      const result = originalCanvasGetContext.call(this, type, options)
      if (/^(webgl|webgl2|experimental-webgl)$/i.test(String(type)) && result) instrumentContext(result, String(type), options, this)
      return result
    }
  }
  if (window.OffscreenCanvas?.prototype?.getContext) {
    const originalOffscreenGetContext = window.OffscreenCanvas.prototype.getContext
    window.OffscreenCanvas.prototype.getContext = function getContext(type, options) {
      const result = originalOffscreenGetContext.call(this, type, options)
      if (/^(webgl|webgl2|experimental-webgl)$/i.test(String(type)) && result) instrumentContext(result, String(type), options, this)
      return result
    }
  }
  document.addEventListener('visibilitychange', () => { state.visibilityChanges.push({ at: performance.now(), hidden: document.hidden }); if (state.measurement && document.hidden) state.hiddenDuringMeasurement = true })
  if (navigator.getBattery) navigator.getBattery().then((battery) => { state.battery = { status: battery.charging ? 'charging/AC observed by navigator.getBattery' : 'battery/discharge observed by navigator.getBattery', charging: battery.charging, level: battery.level, dischargingTime: battery.dischargingTime, chargingTime: battery.chargingTime } }, (error) => { state.battery = { status: 'UNVERIFIED', reason: String(error) } })
  else state.battery = { status: 'UNVERIFIED', reason: 'navigator.getBattery unavailable in this browser context' }

  const memorySummary = () => {
    const textures = [...state.textures.values()].map((info) => ({ id: info.id, context: info.context, createdAt: info.createdAt, bytes: info.bytes, unknownFormats: info.unknownFormats, mipmapLevels: new Set(info.levels.map((level) => level.level)).size, cubeFaces: new Set(info.levels.filter((level) => /CUBE_MAP/.test(level.target)).map((level) => level.target)).size, dimensions: [...new Set(info.levels.map((level) => level.width + 'x' + level.height + 'x' + level.depth))], formats: [...new Set(info.levels.map((level) => level.internalFormat + '/' + level.format + '/' + level.type))], levels: info.levels }))
    const renderbuffers = [...state.renderbuffers.values()]
    const buffers = [...state.buffers.values()]
    const framebuffers = [...state.framebuffers.values()]
    const textureBytes = textures.reduce((sum, row) => sum + row.bytes, 0), renderbufferBytes = renderbuffers.reduce((sum, row) => sum + row.bytes, 0), bufferBytes = buffers.reduce((sum, row) => sum + row.bytes, 0)
    const unknown = textures.some((row) => row.unknownFormats > 0 || row.levels.some((level) => level.unknownBytes)) || renderbuffers.some((row) => row.unknownBytes) || buffers.some((row) => row.unknownBytes)
    const unsupportedAllocationPaths = [...state.unsupportedAllocationPaths.entries()].map(([path, count]) => ({ path, count }))
    const estimateComplete = !unknown && state.unsupportedAllocationEvents === 0
    return { textureBytes, renderbufferBytes, textureAndRenderbufferBytes: textureBytes + renderbufferBytes, geometryBufferBytes: bufferBytes, textureCount: textures.length, renderbufferCount: renderbuffers.length, bufferCount: buffers.length, framebufferCount: framebuffers.length, unknownFormatEvents: state.unknownFormatEvents, unsupportedAllocationEvents: state.unsupportedAllocationEvents, unsupportedAllocationPaths, estimateComplete, physicalResidencyObserved: false, method: 'API-bound WebGL texture/renderbuffer/storage dimensions, formats, mip levels, cube faces, depth and multisample counts; byte totals are storage estimates, not driver residency; any unsupported allocation, mipmap, compressed or 3D storage path, and any unrecognised internal format, keeps the estimate incomplete', textures, renderbuffers, buffers, framebuffers }
  }
  // The live narrative canvas is the only canvas whose drawing buffer describes the measured scene;
  // capability-probe canvases default to 300x150 and must never be reported as the measurement target.
  const describeCanvas = (canvas) => {
    if (!canvas || typeof canvas !== 'object') return null
    const host = typeof canvas.closest === 'function' ? canvas.closest('[data-torque-scene]') : null
    return {
      tag: typeof canvas.tagName === 'string' ? canvas.tagName.toLowerCase() : 'unknown',
      className: typeof canvas.className === 'string' ? canvas.className : null,
      width: Number(canvas.width) || null,
      height: Number(canvas.height) || null,
      connected: canvas.isConnected === true,
      insideTorqueScene: Boolean(host),
      torqueSceneMode: host ? host.getAttribute('data-torque-scene') : null,
    }
  }
  const narrativeCanvas = () => {
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return null
    return document.querySelector('[data-torque-scene="live"] canvas') || document.querySelector('[data-torque-scene] canvas') || document.querySelector('.torque-scene canvas') || null
  }
  const selectNarrativeContext = () => {
    const canvas = narrativeCanvas()
    if (canvas) {
      const match = state.contexts.find((row) => row.canvas === canvas)
      if (match) return { record: match, basis: 'context bound to the live [data-torque-scene] canvas element' }
    }
    const attached = state.contexts.filter((row) => row.canvas && row.canvas.isConnected === true && typeof row.canvas.closest === 'function' && row.canvas.closest('.torque-scene'))
    if (attached.length === 1) return { record: attached[0], basis: 'single context attached to a live .torque-scene host element' }
    return { record: null, basis: canvas ? 'no instrumented context is bound to the live narrative canvas' : 'no live narrative canvas element was found' }
  }
  const environmentSummary = () => {
    const selection = selectNarrativeContext()
    const record = selection.record, context = record?.context
    let vendor = null, renderer = null, version = null, shadingLanguageVersion = null
    if (context) {
      const debug = context.getExtension('WEBGL_debug_renderer_info')
      vendor = debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR)
      renderer = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER)
      version = context.getParameter(context.VERSION)
      shadingLanguageVersion = context.getParameter(context.SHADING_LANGUAGE_VERSION)
    }
    const contexts = state.contexts.map((row) => ({
      id: row.id, contextType: row.contextType, contextAttributes: { ...row.attributes },
      drawingBuffer: [row.context.drawingBufferWidth, row.context.drawingBufferHeight],
      canvas: describeCanvas(row.canvas), narrative: record ? row.id === record.id : false,
    }))
    return { contextCount: state.contexts.length, contextTypes: state.contexts.map((row) => row.contextType), contexts, narrativeContextId: record?.id ?? null, narrativeContextAvailable: Boolean(record), narrativeContextBasis: selection.basis, narrativeContextAttributes: record ? { ...record.attributes } : null, contextAttributes: record?.attributes ?? null, webglVendor: vendor, webglRenderer: renderer, webglVersion: version, shadingLanguageVersion, userAgent: navigator.userAgent, platform: navigator.platform ?? null, hardwareConcurrency: navigator.hardwareConcurrency ?? null, deviceMemoryGB: navigator.deviceMemory ?? null, battery: state.battery, visibilityChanges: state.visibilityChanges.slice(-64), drawingBuffer: context ? [context.drawingBufferWidth, context.drawingBufferHeight] : null }
  }
  globalThis[PORT] = {
    installedAt: state.installedAt,
    beginMeasurement() {
      if (state.measurement) return { ok: false, error: 'Measurement already active' }
      state.frameSamples = []; state.currentFrame = { calls: 0, triangles: 0, lineSegments: 0, points: 0 }; state.hiddenDuringMeasurement = false
      const baselineLinks = new Set(state.linkedPrograms), baselineEventSequence = state.programEventSequence, startedAt = performance.now()
      let active = true, previous = null
      state.measurement = { startedAt, baselineLinks, baselineEventSequence }
      const sentinel = (now) => {
        if (!active || !state.measurement) return
        const narrative = selectNarrativeContext().record
        state.frameSamples.push({ sequence: state.frameSamples.length + 1, timestamp: now, interval: previous == null ? 0 : now - previous, ...state.currentFrame, liveCalls: narrative?.liveFrameCalls || 0, narrativeContextId: narrative?.id ?? null })
        for (const record of state.contexts) record.liveFrameCalls = 0
        state.currentFrame = { calls: 0, triangles: 0, lineSegments: 0, points: 0 }; previous = now; requestAnimationFrame(sentinel)
      }
      requestAnimationFrame(sentinel)
      return { ok: true, startedAt, note: 'sentinel rAF registered after existing loops; final partial frame is intentionally excluded' }
    },
    finishMeasurement() {
      const measurement = state.measurement
      state.measurement = null
      if (!measurement) return { ok: false, error: 'No active measurement' }
      const measuredEvents = state.programEvents.filter((event) => event.sequence > measurement.baselineEventSequence)
      const newEvents = measuredEvents.filter((event) => event.kind === 'link' || event.kind === 'create')
      const measuredEventCount = state.programEventSequence - measurement.baselineEventSequence
      const programEventRetention = { observedEventCount: measuredEventCount, retainedEventCount: Math.min(measuredEvents.length, 256), droppedEventCount: measuredEventCount - Math.min(measuredEvents.length, 256), truncated: measuredEventCount > 256, countsAreLowerBounds: measuredEventCount > 256 }
      const newWarmPrograms = measuredEventCount > measuredEvents.length ? null : newEvents.filter((event) => event.kind === 'link' || !measurement.baselineLinks.has(event.programId)).length
      return { ok: true, startedAt: measurement.startedAt, finishedAt: performance.now(), observationSeconds: (performance.now() - measurement.startedAt) / 1000, frameSamples: state.frameSamples, hiddenDuringMeasurement: state.hiddenDuringMeasurement, programCreationObserved: state.contextCount > 0 && state.programEvents.some((event) => event.kind === 'create'), newWarmPrograms, programEvents: measuredEvents.slice(-256), programEventRetention, programIdentityMethod: 'program object sequence plus attached shader source hashes at create/attach/link; deletes remain in event identity and are never netted out', draw: { totalObservedCalls: state.drawCallsTotal, unsupportedDrawCalls: state.unsupportedDrawCalls, multiDrawCalls: state.multiDrawCalls, wrappedMethods: [...new Set(state.contexts.flatMap((row) => row.drawMethodsWrapped))], extensionDrawPaths: uniqueEntries(state.contexts.flatMap((row) => row.extensionDrawPaths)), nonDrawMethods: [...new Set(state.contexts.flatMap((row) => row.nonDrawMethods))], unsupportedMethods: uniqueEntries(state.contexts.flatMap((row) => row.unsupportedDrawMethods)), allDrawPathsObserved: state.contextCount > 0 && state.unsupportedDrawCalls === 0 && state.drawCallsTotal > 0 }, memory: memorySummary() }
    },
    snapshot() { return { installedAt: state.installedAt, environment: environmentSummary(), memory: memorySummary(), drawCallsTotal: state.drawCallsTotal, unsupportedDrawCalls: state.unsupportedDrawCalls, drawPaths: { wrappedMethods: [...new Set(state.contexts.flatMap((row) => row.drawMethodsWrapped))], extensionDrawPaths: uniqueEntries(state.contexts.flatMap((row) => row.extensionDrawPaths)), nonDrawMethods: [...new Set(state.contexts.flatMap((row) => row.nonDrawMethods))], unsupportedMethods: uniqueEntries(state.contexts.flatMap((row) => row.unsupportedDrawMethods)), multiDrawCalls: state.multiDrawCalls }, unsupportedAllocationEvents: state.unsupportedAllocationEvents, instrumentationOverhead: { available: false, reason: 'Total wrapper and sentinel overhead is not observable without perturbing the measured path; no partial proxy is reported as total overhead' } } },
  }
}
