import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useLayoutEffect, useRef } from "react";
export function MeasuredTickerWidth(Component) { return /*#__PURE__*/ forwardRef((props, forwardedRef) => { const localRef = useRef(null); const setRef = node => { localRef.current = node; if (typeof forwardedRef === "function") {
    forwardedRef(node);
}
else if (forwardedRef) {
    forwardedRef.current = node;
} }; useLayoutEffect(() => { const element = localRef.current; if (!element)
    return; let frame = 0; const updateWidth = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const rows = Array.from(element.children); if (!rows.length)
    return; const width = Math.max(...rows.map(row => Math.max(row.scrollWidth, row.getBoundingClientRect().width))); if (!width || !Number.isFinite(width))
    return; const value = `${Math.ceil(width)}px`; element.style.setProperty("width", value, "important"); element.style.setProperty("min-width", value, "important"); element.style.setProperty("max-width", "none", "important"); element.style.setProperty("flex-basis", value, "important"); element.style.setProperty("flex-grow", "0", "important"); element.style.setProperty("flex-shrink", "0", "important"); element.style.setProperty("overflow", "visible", "important"); }); }; const observer = new ResizeObserver(updateWidth); observer.observe(element); Array.from(element.children).forEach(child => { observer.observe(child); }); window.addEventListener("resize", updateWidth); updateWidth(); return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", updateWidth); }; }, []); return /*#__PURE__*/ _jsx(Component, {
    ref: setRef, ...props
}); }); }
export function HalfStepOffset(Component) { return /*#__PURE__*/ forwardRef((props, forwardedRef) => { const localRef = useRef(null); const setRef = node => { localRef.current = node; if (typeof forwardedRef === "function") {
    forwardedRef(node);
}
else if (forwardedRef) {
    forwardedRef.current = node;
} }; useLayoutEffect(() => { const element = localRef.current; if (!element)
    return; const updateOffset = () => { const firstItem = element.firstElementChild; if (!firstItem)
    return; const itemWidth = firstItem.getBoundingClientRect().width; const styles = getComputedStyle(element); const gap = parseFloat(styles.columnGap || styles.gap) || 0; const offset = -(itemWidth + gap) / 2; element.style.translate = `${offset}px 0`; }; const observer = new ResizeObserver(updateOffset); observer.observe(element); const firstItem = element.firstElementChild; if (firstItem)
    observer.observe(firstItem); window.addEventListener("resize", updateOffset); updateOffset(); return () => { observer.disconnect(); window.removeEventListener("resize", updateOffset); }; }, []); return /*#__PURE__*/ _jsx(Component, {
    ref: setRef, ...props
}); }); }
export const __FramerMetadata__ = {
    "exports": {
        "HalfStepOffset": {
            "type": "reactHoc", "name": "HalfStepOffset", "annotations": {
                "framerContractVersion": "1"
            }
        }, "MeasuredTickerWidth": {
            "type": "reactHoc", "name": "MeasuredTickerWidth", "annotations": {
                "framerContractVersion": "1"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./TickerContentWidth.map
