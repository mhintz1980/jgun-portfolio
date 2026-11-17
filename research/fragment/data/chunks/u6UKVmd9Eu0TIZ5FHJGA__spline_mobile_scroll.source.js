import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function SplineMobileScroll() { const [isPhone, setIsPhone] = useState(false); useEffect(() => { const mediaQuery = window.matchMedia("(max-width: 809px)"); const updateBreakpoint = () => { setIsPhone(mediaQuery.matches); }; updateBreakpoint(); mediaQuery.addEventListener("change", updateBreakpoint); return () => { mediaQuery.removeEventListener("change", updateBreakpoint); }; }, []); return {
    style: {
        touchAction: isPhone ? "pan-y" : "none"
    }
}; }
import { useContext as __legacyOverrideHOC_useContext } from "react";
import { DataObserverContext as __legacyOverrideHOC_DataObserverContext } from "framer";
export function withSplineMobileScroll(C) { return props => { __legacyOverrideHOC_useContext(__legacyOverrideHOC_DataObserverContext); return _jsx(C, {
    ...props, ...SplineMobileScroll(props)
}); }; }
withSplineMobileScroll.displayName = "SplineMobileScroll";
export const __FramerMetadata__ = {
    "exports": {
        "SplineMobileScroll": {
            "type": "override", "name": "SplineMobileScroll", "annotations": {
                "framerContractVersion": "1"
            }
        }, "withSplineMobileScroll": {
            "type": "reactHoc", "name": "withSplineMobileScroll", "annotations": {
                "framerContractVersion": "1"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./spline_mobile_scroll.map
