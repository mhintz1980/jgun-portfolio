import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { addPropertyControls, ControlType, RenderTarget } from "framer";
const portraitDefaults = {
    horizontal: 2.8, vertical: 2, moveX: 0, moveY: 0, smoothing: .22, zoom: 1, fit: "cover", positionX: 50, positionY: 50, pixelRatio: 1.5
};
const limit = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
function loadPortraitImage(url) { return new Promise((resolve, reject) => { const image = new Image; image.crossOrigin = "anonymous"; image.decoding = "async"; image.onload = () => resolve(image); image.onerror = () => reject(new Error("Nie udało się wczytać obrazu.")); image.src = url; }); }
function createPortraitRenderer(canvas, photo, depth, initialOptions, onFailure = () => { }) {
    let options = {
        ...portraitDefaults, ...initialOptions
    };
    const gl = canvas.getContext("webgl", {
        alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false
    });
    if (!gl)
        throw new Error("WebGL jest niedostępny. Wyświetlam zdjęcie statyczne.");
    const vertexSource = `
        attribute vec2 position;
        varying vec2 screenUV;
        void main() {
            screenUV = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const fragmentSource = `
        precision ${precision && precision.precision > 0 ? "highp" : "mediump"} float;
        varying vec2 screenUV;
        uniform sampler2D photograph;
        uniform sampler2D sceneDepth;
        uniform vec2 uvScale;
        uniform vec2 uvOffset;
        uniform vec2 movement;
        uniform vec2 translation;
        float displacement(vec2 uv) {
            float d = texture2D(sceneDepth, clamp(uv, 0.0, 1.0)).r;
            return 1.0 - exp(-max(d - 0.12, 0.0) / 0.68);
        }
        void main() {
            // Fixed image-space point between the eyes in the supplied portrait.
            float anchorDepth = displacement(vec2(0.480191275, 0.2315));
            // Translation is independent of perspective on both axes.
            vec2 uv = screenUV * uvScale + uvOffset - translation;
            vec2 sourceUV = uv - movement * (displacement(uv) - anchorDepth);
            // The anchor remains still when Move X and Move Y are zero.
            // All other points retain their relative depth-driven motion.
            sourceUV = uv - movement * (displacement(sourceUV) - anchorDepth);
            if (sourceUV.x < 0.0 || sourceUV.x > 1.0 ||
                sourceUV.y < 0.0 || sourceUV.y > 1.0) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else {
                gl_FragColor = vec4(texture2D(photograph, sourceUV).rgb, 1.0);
            }
        }
    `;
    const shaders = [];
    const textures = [];
    let program = null;
    let buffer = null;
    function freeResources() { textures.forEach(t => gl.deleteTexture(t)); shaders.forEach(s => gl.deleteShader(s)); if (buffer)
        gl.deleteBuffer(buffer); if (program)
        gl.deleteProgram(program); }
    function compile(type, source) { const shader = gl.createShader(type); if (!shader)
        throw new Error("Nie udało się przygotować efektu."); shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || "Błąd kompilacji efektu.");
    } return shader; }
    try {
        program = gl.createProgram();
        if (!program)
            throw new Error("Nie udało się przygotować efektu.");
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) || "Błąd inicjalizacji efektu.");
        }
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const attribute = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
        for (const [index, image] of [photo, depth].entries()) {
            const texture = gl.createTexture();
            if (!texture)
                throw new Error("Nie udało się wczytać tekstury.");
            textures.push(texture);
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // Depth is data. Do not apply browser color conversion to it.
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, index === 1 ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
        gl.uniform1i(gl.getUniformLocation(program, "photograph"), 0);
        gl.uniform1i(gl.getUniformLocation(program, "sceneDepth"), 1);
    }
    catch (error) {
        freeResources();
        throw error;
    }
    const scaleLocation = gl.getUniformLocation(program, "uvScale");
    const offsetLocation = gl.getUniformLocation(program, "uvOffset");
    const movementLocation = gl.getUniformLocation(program, "movement");
    const translationLocation = gl.getUniformLocation(program, "translation");
    let destroyed = false, active = true, lost = false;
    let frame = 0, lastTime = 0, draws = 0;
    let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
    let width = 1, height = 1;
    function draw() { if (destroyed || lost)
        return; const scale = (options.fit === "contain" ? Math.min(width / photo.naturalWidth, height / photo.naturalHeight) : Math.max(width / photo.naturalWidth, height / photo.naturalHeight)) * options.zoom; const imageWidth = photo.naturalWidth * scale; const imageHeight = photo.naturalHeight * scale; const sx = width / imageWidth, sy = height / imageHeight; gl.uniform2f(scaleLocation, sx, sy); gl.uniform2f(offsetLocation, (1 - sx) * options.positionX / 100, (1 - sy) * options.positionY / 100); gl.uniform2f(movementLocation, currentX * options.horizontal / 100, currentY * options.vertical / 100); gl.uniform2f(translationLocation, currentX * options.moveX / 100, currentY * options.moveY / 100); gl.drawArrays(gl.TRIANGLES, 0, 3); draws++; }
    function tick(time) { frame = 0; if (!active || destroyed || lost)
        return; const dt = lastTime ? Math.min((time - lastTime) / 1e3, .05) : 1 / 60; lastTime = time; const alpha = options.smoothing <= 0 ? 1 : 1 - Math.exp(-dt / options.smoothing); currentX += (targetX - currentX) * alpha; currentY += (targetY - currentY) * alpha; if (Math.abs(currentX - targetX) < 5e-5)
        currentX = targetX; if (Math.abs(currentY - targetY) < 5e-5)
        currentY = targetY; draw(); if (currentX !== targetX || currentY !== targetY)
        frame = requestAnimationFrame(tick);
    else
        lastTime = 0; }
    function wake() { if (active && !destroyed && !lost && !frame) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
    } }
    function resize() { if (destroyed || lost)
        return; const bounds = canvas.getBoundingClientRect(); width = Math.max(1, bounds.width); height = Math.max(1, bounds.height); let ratio = Math.min(window.devicePixelRatio || 1, options.pixelRatio); ratio = Math.min(ratio, Math.sqrt(25e5 / (width * height))); const w = Math.max(1, Math.round(width * ratio)); const h = Math.max(1, Math.round(height * ratio)); if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    } draw(); }
    function contextLost(event) { event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; onFailure(); }
    canvas.addEventListener("webglcontextlost", contextLost);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return {
        setPointer(x, y, instant = false) { targetX = limit(x, -1, 1); targetY = limit(y, -1, 1); if (instant) {
            currentX = targetX;
            currentY = targetY;
            if (active)
                draw();
        }
        else
            wake(); }, update(next) { options = {
            ...options, ...next
        }; resize(); wake(); }, setActive(value) { active = value; if (active) {
            resize();
            wake();
        }
        else {
            cancelAnimationFrame(frame);
            frame = 0;
            lastTime = 0;
        } }, getState() { return {
            currentX, currentY, targetX, targetY, draws, active, lost, width: canvas.width, height: canvas.height
        }; }, dispose() { destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener("webglcontextlost", contextLost); freeResources(); }
    };
}
const portraitUrl = value => typeof value === "string" ? value : value?.src || "";
function announcePortraitReady() { if (typeof window === "undefined")
    return; const globalWindow = window; if (globalWindow.__fragmentPortraitReady === true)
    return; globalWindow.__fragmentPortraitReady = true; window.dispatchEvent(new CustomEvent("fragment-portrait-ready")); } /**
 * PortraitParallax v1, independent perspective and translation on both axes.
 * Use the matching portrait.png and portrait-depth.png included in the package.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */
export default function PortraitParallax(props) {
    const { photo, depthMap = "", tracking = "window", touchMode = "drag", reverseX = false, reverseY = false, alt = "Portret Pawła", style, horizontal = portraitDefaults.horizontal, vertical = portraitDefaults.vertical, moveX = portraitDefaults.moveX, moveY = portraitDefaults.moveY, smoothing = portraitDefaults.smoothing, zoom = 1, fit = "cover", positionX = 50, positionY = 50, pixelRatio = 1.5 } = props;
    const imageUrl = portraitUrl(photo);
    const rootRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const rendererRef = React.useRef(null);
    const [ready, setReady] = React.useState(false);
    const [restoreKey, setRestoreKey] = React.useState(0);
    const configRef = React.useRef({
        horizontal, vertical, moveX, moveY, smoothing, zoom, fit, positionX, positionY, pixelRatio
    });
    configRef.current = {
        horizontal, vertical, moveX, moveY, smoothing, zoom, fit, positionX, positionY, pixelRatio
    };
    const interactionRef = React.useRef({
        tracking, touchMode, reverseX, reverseY
    });
    interactionRef.current = {
        tracking, touchMode, reverseX, reverseY
    };
    const inEditor = RenderTarget.current() === RenderTarget.canvas;
    React.useEffect(() => {
        setReady(false); // Touch-capable devices, including hybrid laptops, use the static photo.
        // Check before loading textures, adding interaction listeners or creating WebGL.
        const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches;
        if (touchDevice || !imageUrl || !depthMap)
            return;
        const canvas = canvasRef.current, root = rootRef.current;
        if (!canvas || !root)
            return;
        let disposed = false;
        let renderer = null;
        let intersecting = true;
        let cleanupInteraction = () => { };
        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)"); // On any runtime failure, reveal the static photo fallback silently.
        const fail = () => {
            if (!disposed) {
                setReady(false); // The static photo fallback is the final visible state after a WebGL failure.
                announcePortraitReady();
            }
        };
        const refreshActive = () => { if (!renderer)
            return; if (motionPreference.matches || inEditor)
            renderer.setPointer(0, 0, true); renderer.setActive(intersecting && !document.hidden && !motionPreference.matches && !inEditor); };
        const restore = () => { if (!disposed)
            setRestoreKey(key => key + 1); };
        canvas.addEventListener("webglcontextrestored", restore);
        Promise.all([loadPortraitImage(imageUrl), loadPortraitImage(depthMap)]).then(([image, map]) => { if (disposed)
            return; const ratioDifference = Math.abs(image.naturalWidth / image.naturalHeight - map.naturalWidth / map.naturalHeight); if (ratioDifference > .005)
            throw new Error("Zdjęcie i mapa głębi muszą mieć te same proporcje."); renderer = createPortraitRenderer(canvas, image, map, configRef.current, fail); rendererRef.current = renderer; setReady(true); announcePortraitReady(); const point = (x, y) => { if (motionPreference.matches || inEditor)
            return; const config = interactionRef.current; renderer?.setPointer(config.reverseX ? -x : x, config.reverseY ? -y : y); }; const pointerMove = event => { if (event.pointerType === "touch")
            return; const config = interactionRef.current; const bounds = config.tracking === "component" ? root.getBoundingClientRect() : null; if (bounds && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
            point(0, 0);
            return;
        } const x = bounds ? (event.clientX - bounds.left) / Math.max(bounds.width, 1) : event.clientX / window.innerWidth; const y = bounds ? (event.clientY - bounds.top) / Math.max(bounds.height, 1) : event.clientY / window.innerHeight; point(x * 2 - 1, y * 2 - 1); }; const reset = () => point(0, 0); let touch = null; const touchDown = event => { if (event.pointerType !== "touch" || interactionRef.current.touchMode !== "drag" || !event.isPrimary)
            return; touch = {
            id: event.pointerId, x: event.clientX, y: event.clientY, direction: "pending"
        }; }; const touchMove = event => { if (!touch || event.pointerId !== touch.id)
            return; const dx = event.clientX - touch.x, dy = event.clientY - touch.y; if (touch.direction === "pending" && Math.hypot(dx, dy) > 8) {
            touch.direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
            if (touch.direction === "horizontal") {
                try {
                    root.setPointerCapture(event.pointerId);
                }
                catch { }
            }
        } if (touch.direction === "horizontal")
            point(dx / Math.max(root.clientWidth * .35, 1), 0); }; const touchEnd = event => { if (touch && event.pointerId === touch.id) {
            touch = null;
            reset();
        } }; window.addEventListener("pointermove", pointerMove, {
            passive: true
        }); window.addEventListener("blur", reset); document.documentElement.addEventListener("pointerleave", reset); root.addEventListener("pointerdown", touchDown, {
            passive: true
        }); root.addEventListener("pointermove", touchMove, {
            passive: true
        }); root.addEventListener("pointerup", touchEnd, {
            passive: true
        }); root.addEventListener("pointercancel", touchEnd, {
            passive: true
        }); document.addEventListener("visibilitychange", refreshActive); motionPreference.addEventListener("change", refreshActive); const observer = new IntersectionObserver(entries => { intersecting = entries[0]?.isIntersecting ?? true; refreshActive(); }, {
            threshold: 0
        }); observer.observe(root); refreshActive(); cleanupInteraction = () => { window.removeEventListener("pointermove", pointerMove); window.removeEventListener("blur", reset); document.documentElement.removeEventListener("pointerleave", reset); root.removeEventListener("pointerdown", touchDown); root.removeEventListener("pointermove", touchMove); root.removeEventListener("pointerup", touchEnd); root.removeEventListener("pointercancel", touchEnd); document.removeEventListener("visibilitychange", refreshActive); motionPreference.removeEventListener("change", refreshActive); observer.disconnect(); }; }).catch(() => fail());
        return () => { disposed = true; cleanupInteraction(); canvas.removeEventListener("webglcontextrestored", restore); renderer?.dispose(); if (rendererRef.current === renderer)
            rendererRef.current = null; };
    }, [imageUrl, depthMap, inEditor, restoreKey]);
    React.useEffect(() => { rendererRef.current?.update(configRef.current); }, [horizontal, vertical, moveX, moveY, smoothing, zoom, fit, positionX, positionY, pixelRatio]);
    return /*#__PURE__*/ _jsxs("div", {
        ref: rootRef, role: "img", "aria-label": alt, style: {
            ...style, position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000", isolation: "isolate", touchAction: "auto"
        }, children: [imageUrl && /*#__PURE__*/ _jsx("img", {
                src: imageUrl, alt: "", "aria-hidden": "true", draggable: false, onLoad: () => { const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches; if (touchDevice)
                    announcePortraitReady(); }, onError: () => { const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches; if (touchDevice)
                    announcePortraitReady(); }, style: {
                    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})`, transformOrigin: `${positionX}% ${positionY}%`, display: "block", pointerEvents: "none", userSelect: "none", visibility: ready ? "hidden" : "visible"
                }
            }), /*#__PURE__*/ _jsx("canvas", {
                ref: canvasRef, "aria-hidden": "true", style: {
                    display: "block", position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: ready ? 1 : 0
                }
            })]
    });
}
PortraitParallax.defaultProps = {
    width: 800, height: 800, ...portraitDefaults, tracking: "window", touchMode: "drag", reverseX: false, reverseY: false, alt: "Portret Pawła"
};
addPropertyControls(PortraitParallax, {
    photo: {
        type: ControlType.ResponsiveImage, title: "Photo"
    }, depthMap: {
        type: ControlType.File, title: "Depth map", allowedFileTypes: ["png"]
    }, horizontal: {
        type: ControlType.Number, title: "Horizontal", min: 0, max: 5, step: .1, defaultValue: 2.8, unit: "%"
    }, vertical: {
        type: ControlType.Number, title: "Vertical", min: 0, max: 4, step: .1, defaultValue: 2, unit: "%"
    }, moveX: {
        type: ControlType.Number, title: "Move X", min: -5, max: 5, step: .1, defaultValue: 0, unit: "%", description: "Przesunięcie w poziomie jako % szerokości zdjęcia. 0 = zakotwiczona twarz."
    }, moveY: {
        type: ControlType.Number, title: "Move Y", min: -5, max: 5, step: .1, defaultValue: 0, unit: "%", description: "Przesunięcie w pionie jako % wysokości zdjęcia. 0 = zakotwiczona twarz."
    }, smoothing: {
        type: ControlType.Number, title: "Smoothing", min: .05, max: .8, step: .01, defaultValue: .22, unit: "s"
    }, zoom: {
        type: ControlType.Number, title: "Zoom", min: 1, max: 1.5, step: .01, defaultValue: 1
    }, fit: {
        type: ControlType.Enum, title: "Fit", options: ["cover", "contain"], optionTitles: ["Cover", "Contain"], defaultValue: "cover"
    }, positionX: {
        type: ControlType.Number, title: "Position X", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%"
    }, positionY: {
        type: ControlType.Number, title: "Position Y", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%"
    }, tracking: {
        type: ControlType.Enum, title: "Tracking", options: ["window", "component"], optionTitles: ["Whole window", "Component"], defaultValue: "window"
    }, reverseX: {
        type: ControlType.Boolean, title: "Reverse X", defaultValue: false
    }, reverseY: {
        type: ControlType.Boolean, title: "Reverse Y", defaultValue: false
    }, pixelRatio: {
        type: ControlType.Number, title: "Quality", min: 1, max: 2, step: .25, defaultValue: 1.5
    }, alt: {
        type: ControlType.String, title: "Alt text", defaultValue: "Portret Pawła"
    }
});
export const __FramerMetadata__ = {
    "exports": {
        "default": {
            "type": "reactComponent", "name": "PortraitParallax", "slots": [], "annotations": {
                "framerSupportedLayoutHeight": "any", "framerSupportedLayoutWidth": "any", "framerIntrinsicWidth": "800", "framerContractVersion": "1", "framerIntrinsicHeight": "800"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./portrait_parallax_v1.map
