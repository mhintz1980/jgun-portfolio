// Formatted Number Counter
// An animated counter with thousand separators, decimal support, and custom easing.
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addPropertyControls, ControlType, RenderTarget } from "framer";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react"; /**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function FormattedNumberCounter(props) {
    const { startValue, endValue, duration, delay, decimals, easing, font, textAlign, color, autoStart, // play, // Removed based on feedback
    loop, resetOnReentry, style } = props;
    const ref = useRef(null);
    const isInView = useInView(ref, {
        once: !resetOnReentry
    });
    const motionValue = useMotionValue(startValue);
    const hasAnimated = useRef(false); // New state for manual interaction
    const [manualTrigger, setManualTrigger] = useState(false); // Detect current environment
    const renderTarget = RenderTarget.current();
    const isCanvas = renderTarget === RenderTarget.canvas;
    const isExport = renderTarget === RenderTarget.export;
    const isThumbnail = renderTarget === RenderTarget.thumbnail; // Static render environments
    const isStaticRender = isCanvas || isExport || isThumbnail;
    const [displayValue, setDisplayValue] = useState(startValue); // Sync motionValue when startValue changes
    useEffect(() => { if (!hasAnimated.current) {
        motionValue.set(startValue);
    } }, [startValue, motionValue]); // Format number with thousand separators
    const formatNumber = value => { const fixedValue = Number(value).toFixed(decimals); const [integerPart, decimalPart] = fixedValue.split("."); let formattedInteger = integerPart; if (integerPart.length >= 4) {
        formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } return decimals > 0 ? `${formattedInteger}.${decimalPart}` : formattedInteger; };
    const rounded = useTransform(motionValue, latest => formatNumber(latest));
    const easingMap = {
        linear: [0, 0, 1, 1], easeIn: [.42, 0, 1, 1], easeOut: [0, 0, .58, 1], easeInOut: [.42, 0, .58, 1], circIn: [.55, 0, 1, .45], circOut: [0, .55, .45, 1], backIn: [.36, 0, .66, -.56], backOut: [.34, 1.56, .64, 1]
    }; // Main Animation Logic
    useEffect(() => {
        if (isStaticRender) {
            motionValue.set(endValue);
            setDisplayValue(endValue);
            return;
        } // 2. Determine if animation should start
        // If AutoStart is ON: controlled by Viewport (isInView)
        // If AutoStart is OFF: controlled by internal click state (manualTrigger)
        const shouldAnimate = autoStart ? isInView : manualTrigger; // 3. If conditions not met
        if (!shouldAnimate) { // Logic to reset if stopped
            // If manual mode (autoStart is false), clicking off should reset to start
            if ((resetOnReentry || !autoStart) && !shouldAnimate) {
                motionValue.set(startValue);
                setDisplayValue(startValue);
                hasAnimated.current = false;
            }
            return;
        } // 4. Prevent duplicate animation if already done (unless looping)
        if (hasAnimated.current && !loop && !resetOnReentry && autoStart) {
            motionValue.set(endValue);
            setDisplayValue(endValue);
            return;
        } // 5. Run Animation
        const animateCounter = () => { const controls = animate(motionValue, endValue, {
            duration, delay, ease: easingMap[easing], onUpdate: latest => { setDisplayValue(latest); }, onComplete: () => { setDisplayValue(endValue); if (loop && shouldAnimate) {
                motionValue.set(startValue);
                setDisplayValue(startValue);
                setTimeout(() => { animateCounter(); }, delay * 1e3);
            } }
        }); return controls; };
        hasAnimated.current = true;
        const controls = animateCounter();
        return () => controls.stop();
    }, [isInView, manualTrigger, startValue, endValue, duration, delay, easing, motionValue, autoStart, loop, resetOnReentry, isStaticRender]);
    const finalFormattedValue = formatNumber(endValue);
    const getDisplayContent = () => { if (isStaticRender) {
        return finalFormattedValue;
    } return rounded; }; // Handle manual click interaction
    const handleTap = () => { if (!autoStart) {
        setManualTrigger(prev => !prev);
    } };
    return /*#__PURE__*/ _jsxs("div", {
        ref: ref, onClick: handleTap, style: {
            ...style, position: "relative", display: "inline-block", width: "auto", minWidth: "max-content", cursor: autoStart ? "default" : "pointer"
        }, children: [/*#__PURE__*/ _jsx("span", {
                style: {
                    ...font, color: "transparent", opacity: 0, textAlign, display: "block", width: "100%", fontVariantNumeric: "tabular-nums", pointerEvents: "none", userSelect: "none", visibility: "hidden"
                }, children: finalFormattedValue
            }), /*#__PURE__*/ _jsx(motion.span, {
                style: {
                    ...font, color, textAlign, display: "block", width: "100%", fontVariantNumeric: "tabular-nums", position: "absolute", top: 0, left: 0
                }, children: getDisplayContent()
            })]
    });
}
addPropertyControls(FormattedNumberCounter, {
    startValue: {
        type: ControlType.Number, title: "Start Value", defaultValue: 0, step: 1
    }, endValue: {
        type: ControlType.Number, title: "End Value", defaultValue: 12345, step: 1
    }, duration: {
        type: ControlType.Number, title: "Duration", defaultValue: 2, min: .1, max: 10, step: .1, unit: "s"
    }, delay: {
        type: ControlType.Number, title: "Delay", defaultValue: 0, min: 0, max: 5, step: .1, unit: "s"
    }, decimals: {
        type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true
    }, easing: {
        type: ControlType.Enum, title: "Easing", options: ["linear", "easeIn", "easeOut", "easeInOut", "circIn", "circOut", "backIn", "backOut"], optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out", "Circ In", "Circ Out", "Back In", "Back Out"], defaultValue: "easeOut"
    }, font: {
        type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: {
            fontSize: "40px", letterSpacing: "-0.04em", lineHeight: "1em"
        }
    }, textAlign: {
        type: ControlType.Enum, title: "Alignment", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], defaultValue: "left", displaySegmentedControl: true
    }, color: {
        type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF"
    }, autoStart: {
        type: ControlType.Boolean, title: "Auto Start", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Start on scroll. If Off, click component to start/stop."
    }, // Removed "play" control as requested
    loop: {
        type: ControlType.Boolean, title: "Loop", defaultValue: false, enabledTitle: "On", disabledTitle: "Off"
    }, resetOnReentry: {
        type: ControlType.Boolean, title: "Reset on Re-entry", defaultValue: false, enabledTitle: "On", disabledTitle: "Off"
    }
});
export const __FramerMetadata__ = {
    "exports": {
        "default": {
            "type": "reactComponent", "name": "FormattedNumberCounter", "slots": [], "annotations": {
                "framerSupportedLayoutWidth": "auto", "framerSupportedLayoutHeight": "auto", "framerContractVersion": "1"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./FormattedNumberCounter.map
