import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useEffect, useRef, useState } from "react"; // ======================================================
// FIX 1
// Naprawia pozostający realny focus po odkliknięciu pola.
// Przypinamy do NATYWNEJ warstwy Input wewnątrz komponentu.
// ======================================================
export function ForceRealBlur(Component) { return /*#__PURE__*/ forwardRef((props, ref) => { const handleBlurCapture = event => { props?.onBlurCapture?.(event); const target = event.target; if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return;
} const fieldName = target.name; const fieldId = target.id; requestAnimationFrame(() => { requestAnimationFrame(() => { const active = document.activeElement; if (!(active instanceof HTMLInputElement) && !(active instanceof HTMLTextAreaElement)) {
    return;
} const isSameField = active === target || fieldName !== "" && active.name === fieldName || fieldId !== "" && active.id === fieldId; if (isSameField) {
    active.blur();
} }); }); }; return /*#__PURE__*/ _jsx(Component, {
    ref: ref, ...props, onBlurCapture: handleBlurCapture
}); }); } // ======================================================
// FIX 2
// Wykrywa autofill wykonany "w tle" przez Chrome/Brave.
// Przypinamy do CAŁEJ instancji Form Input na stronie.
// ======================================================
export function AutofillVariantFix(Component) {
    return /*#__PURE__*/ forwardRef((props, forwardedRef) => {
        const rootRef = useRef(null);
        const [forcedVariant, setForcedVariant] = useState(null);
        const setRefs = node => { rootRef.current = node; if (typeof forwardedRef === "function") {
            forwardedRef(node);
        }
        else if (forwardedRef) {
            forwardedRef.current = node;
        } };
        useEffect(() => {
            const getField = () => { const root = rootRef.current; if (!root)
                return null; return root.querySelector("input, textarea"); };
            const checkAutofill = () => {
                const field = getField();
                if (!field)
                    return;
                let isAutofilled = false;
                try {
                    isAutofilled = field.matches(":-webkit-autofill");
                }
                catch {
                    isAutofilled = false;
                } // Interesuje nas tylko browser autofill.
                if (!isAutofilled)
                    return; // Pole, z którego user właśnie korzysta,
                // Framer obsługuje normalnie.
                if (document.activeElement === field)
                    return; // Autofill wypełnił pole w tle.
                if (field.value !== "") {
                    if (field.validity.valid) {
                        setForcedVariant("Blur");
                    }
                    else {
                        setForcedVariant("Invalid Is Set");
                    }
                }
            };
            const handleFocusIn = event => {
                const field = getField();
                if (!field)
                    return;
                if (event.target === field) { // User sam wszedł w pole.
                    // Oddajemy sterowanie normalnym
                    // interakcjom komponentu Framera.
                    setForcedVariant(null);
                }
            };
            const handleInput = event => { const field = getField(); if (!field)
                return; if (event.target === field && document.activeElement === field) {
                setForcedVariant(null);
            } requestAnimationFrame(checkAutofill); };
            document.addEventListener("focusin", handleFocusIn, true);
            document.addEventListener("input", handleInput, true); // Chrome nie daje wygodnego, uniwersalnego eventu
            // "autofill happened", więc sprawdzamy stan pola.
            const interval = window.setInterval(checkAutofill, 100);
            requestAnimationFrame(checkAutofill);
            return () => { document.removeEventListener("focusin", handleFocusIn, true); document.removeEventListener("input", handleInput, true); window.clearInterval(interval); };
        }, []);
        return /*#__PURE__*/ _jsx(Component, {
            ...props, ref: setRefs, ...forcedVariant ? {
                variant: forcedVariant
            } : {}
        });
    });
}
export const __FramerMetadata__ = {
    "exports": {
        "ForceRealBlur": {
            "type": "reactHoc", "name": "ForceRealBlur", "annotations": {
                "framerContractVersion": "1"
            }
        }, "AutofillVariantFix": {
            "type": "reactHoc", "name": "AutofillVariantFix", "annotations": {
                "framerContractVersion": "1"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./FormInputFix.map
