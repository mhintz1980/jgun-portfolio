import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react"; /*
 * Override na CAŁEJ instancji Form Select: CustomFormSelect.
 * Warianty: Default, Focus, Invalid, Option 1 Selected ... Option N Selected.
 * Warstwy: Trigger, Dropdown (obsługiwane też Drowdown), Option, Native Select.
 * Kolejność warstw Option musi odpowiadać niepustym opcjom Native Select.
 *
 * ANIMACJA: Dropdown pozostaje Visible = Yes we WSZYSTKICH wariantach.
 * Zamknięty: Opacity = 0. Focus: Opacity = 1.
 * Zachowaj obecny układ: wysokość root/Trigger = 80, Overflow root = Visible.
 * Transition ustawiasz we Framerze. Kod nie ustawia czasu ani easing animacji.
 * Usuń interakcje Tap/Click zmieniające wariant selecta. Zostaw Hover i Transition.
 * Ukryty Native Select nadal musi istnieć, mieć Name i właściwe Required.
 */
const TRIGGER = '[data-framer-name="Trigger"]';
const OPTION = '[data-framer-name="Option"]';
const DROPDOWN = '[data-framer-name="Dropdown"], [data-framer-name="Drowdown"]';
const normalize = text => text.replace(/\s+/g, " ").trim();
function connectSelect(root, id, renderVariant) {
    let value = "";
    let open = false;
    let active = -1;
    let invalid = false;
    let writing = false;
    let resetting = false;
    let disposed = false;
    let frame = 0;
    let resetTimer = 0;
    let searchText = "";
    let searchTime = 0;
    let fieldLabel = "";
    const labels = new Map;
    const original = new Map;
    const native = () => root.querySelector("select");
    const trigger = () => root.querySelector(TRIGGER);
    const options = () => Array.from(native()?.options || []).filter(o => o.value !== "");
    const visualOptions = () => Array.from(root.querySelectorAll(OPTION));
    const dropdown = () => root.querySelector(DROPDOWN) || visualOptions()[0]?.parentElement;
    const enabled = index => { const option = options()[index]; return !!option && !option.disabled && !(option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled); };
    const selectedIndex = () => options().findIndex(o => o.value === value);
    function attribute(node, name, next) { if (!original.has(node))
        original.set(node, new Map); const saved = original.get(node); if (!saved.has(name))
        saved.set(name, node.getAttribute(name)); if (next === null)
        node.removeAttribute(name);
    else if (node.getAttribute(name) !== next)
        node.setAttribute(name, next); }
    function rememberLabels() { const choices = options(); visualOptions().forEach((node, index) => { const text = normalize(node.textContent || ""); if (choices[index] && text)
        labels.set(choices[index].value, text); }); const text = normalize(trigger()?.textContent || ""); if (!fieldLabel && text)
        fieldLabel = text; if (!open && value && text && !labels.has(value))
        labels.set(value, text); }
    function syncNative(notify) { const select = native(); if (!select || select.value === value)
        return; writing = true; try {
        select.value = value;
        if (notify) {
            select.dispatchEvent(new Event("input", {
                bubbles: true
            }));
            select.dispatchEvent(new Event("change", {
                bubbles: true
            }));
        }
    }
    finally {
        writing = false;
    } }
    function refresh() { if (disposed)
        return; const select = native(); const button = trigger(); if (!select || !button)
        return; rememberLabels(); if (!resetting)
        syncNative(false); attribute(select, "tabindex", "-1"); attribute(select, "aria-hidden", "true"); attribute(select, "data-fragment-native-select", ""); attribute(button, "tabindex", select.disabled ? "-1" : "0"); attribute(button, "role", "combobox"); attribute(button, "aria-label", fieldLabel || select.name); attribute(button, "aria-haspopup", "listbox"); attribute(button, "aria-expanded", String(open)); attribute(button, "aria-required", String(select.required)); attribute(button, "aria-disabled", String(select.disabled)); attribute(button, "aria-invalid", String(invalid)); attribute(button, "data-fragment-select-trigger", ""); const list = dropdown(); const nodes = visualOptions(); attribute(button, "aria-controls", list ? `${id}-list` : null); attribute(button, "aria-activedescendant", open && active >= 0 && nodes[active] ? `${id}-option-${active}` : null); if (list) {
        attribute(list, "id", `${id}-list`);
        attribute(list, "role", "listbox");
        attribute(list, "aria-label", fieldLabel || select.name);
        attribute(list, "aria-hidden", String(!open));
        attribute(list, "inert", open ? null : "");
        attribute(list, "data-fragment-select-list", "");
    } nodes.forEach((node, index) => { attribute(node, "id", `${id}-option-${index}`); attribute(node, "role", "option"); attribute(node, "tabindex", "-1"); attribute(node, "aria-selected", String(index === (open ? active : selectedIndex()))); attribute(node, "aria-disabled", String(!enabled(index))); attribute(node, "data-fragment-option-active", String(open && index === active)); }); }
    function draw() { const index = selectedIndex(); renderVariant(open ? "Focus" : invalid ? "Invalid" : index < 0 ? "Default" : `Option ${index + 1} Selected`); refresh(); cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); }
    function focusTrigger() { trigger()?.focus({
        preventScroll: true
    }); }
    function moveTo(index) {
        if (!enabled(index))
            return;
        active = index;
        refresh(); // Przewijamy tylko samą listę, bez przesuwania strony / Lenisa.
        const list = dropdown();
        const option = visualOptions()[index];
        if (list && option && list.scrollHeight > list.clientHeight) {
            const itemRect = option.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            if (itemRect.top < listRect.top)
                list.scrollTop -= listRect.top - itemRect.top;
            else if (itemRect.bottom > listRect.bottom)
                list.scrollTop += itemRect.bottom - listRect.bottom;
        }
    }
    function edge(last = false) { const indices = options().map((_, i) => i).filter(enabled); return (last ? indices[indices.length - 1] : indices[0]) ?? -1; }
    function show(keyboard) { if (native()?.disabled)
        return; rememberLabels(); open = true; active = selectedIndex(); if (active < 0 && keyboard)
        active = edge(); draw(); }
    function close(commit, markTouched = false) {
        if (commit && enabled(active)) {
            rememberLabels();
            value = options()[active].value;
            invalid = false; // Wartość formularza zmienia się natychmiast, przed następną klatką.
            syncNative(true);
        }
        open = false;
        searchText = "";
        if (markTouched)
            invalid = !!native()?.required && !value;
        draw();
    }
    function indexFromTarget(target) { if (!(target instanceof Element))
        return -1; const node = target.closest(OPTION); return node && root.contains(node) ? visualOptions().indexOf(node) : -1; }
    function onClick(event) {
        const select = native();
        const button = trigger();
        if (!(event.target instanceof Node) || !select || !button)
            return;
        if (event.target === select)
            return;
        const index = indexFromTarget(event.target);
        if (!button.contains(event.target) && !(open && index >= 0))
            return; // Root Framera jest <label>. Blokujemy jego przekierowanie kliknięcia
        // do niewidocznego selecta, ale nie blokujemy zdarzeń całej strony.
        event.preventDefault();
        if (select.disabled)
            return;
        if (open && index >= 0) {
            if (!enabled(index))
                return;
            active = index;
            close(true);
        }
        else if (open)
            close(false);
        else
            show(false);
        focusTrigger();
    }
    function onPointerDown(event) { if (open && indexFromTarget(event.target) >= 0)
        event.preventDefault(); }
    function onPointerMove(event) { const index = indexFromTarget(event.target); if (open && index >= 0 && index !== active)
        moveTo(index); }
    function onKeyDown(event) {
        if (event.target !== trigger() || native()?.disabled || event.isComposing)
            return;
        if (Date.now() - searchTime > 700)
            searchText = "";
        const key = event.key;
        if (key === "Tab") {
            if (open)
                close(true, true);
            return; // Naturalna kolejność Tab / Shift+Tab, bez pułapki fokusu.
        }
        if (event.ctrlKey || event.metaKey || event.altKey && !["ArrowDown", "ArrowUp"].includes(key))
            return;
        if (key === "Escape") {
            if (open) {
                event.preventDefault();
                event.stopPropagation();
                close(false);
            }
            return;
        }
        if (key === "Enter" || key === " " && !searchText) {
            event.preventDefault(); // Framer obsługuje Enter także na nadrzędnym formularzu.
            // Sam preventDefault nie blokuje przejścia do następnego pola.
            event.stopPropagation();
            if (open)
                close(true);
            else
                show(true);
            return;
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            const wasOpen = open;
            if (!open)
                show(true);
            if (key === "Home" || key === "End")
                moveTo(edge(key === "End"));
            else if (event.altKey && key === "ArrowUp")
                close(true);
            else if (wasOpen) {
                const direction = key === "ArrowDown" ? 1 : -1;
                let index = active < 0 ? edge(direction < 0) : active + direction;
                while (index >= 0 && index < options().length && !enabled(index))
                    index += direction;
                moveTo(index);
            }
            return;
        }
        if (key.length === 1 && key !== " ") {
            event.preventDefault();
            event.stopPropagation();
            if (!open)
                show(true);
            rememberLabels();
            const now = Date.now();
            searchText = (now - searchTime > 700 ? "" : searchText) + key.toLocaleLowerCase();
            searchTime = now;
            const repeated = [...searchText].every(c => c === searchText[0]);
            const query = repeated ? searchText[0] : searchText;
            const choices = options();
            const start = repeated ? active + 1 : Math.max(active, 0);
            for (let step = 0; step < choices.length; step++) {
                const index = (start + step) % choices.length;
                const text = labels.get(choices[index].value) || choices[index].text;
                if (enabled(index) && normalize(text).toLocaleLowerCase().startsWith(query)) {
                    moveTo(index);
                    break;
                }
            }
        }
    }
    function onOutside(event) { if (open && event.target instanceof Node && !root.contains(event.target))
        close(true, true); }
    function onFocusOut(event) { if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget))
        return; if (open)
        close(true, true); }
    function onChange(event) { if (writing || event.target !== native())
        return; value = native().value; invalid = false; open = false; draw(); }
    function onInvalid(event) { const select = native(); if (event.target !== select || !select)
        return; event.preventDefault(); invalid = true; open = false; draw(); const firstInvalid = select.form && Array.from(select.form.elements).find(element => { const field = element; return field.willValidate && !field.validity.valid; }); if (!select.form || firstInvalid === select)
        trigger()?.focus(); }
    function onFormData(event) { const select = native(); if (!select?.name || !select.value || select.disabled)
        return; rememberLabels(); const label = labels.get(select.value); if (label)
        event.formData.set(select.name, label); }
    function onReset(event) { resetting = true; window.clearTimeout(resetTimer); resetTimer = window.setTimeout(() => { resetting = false; if (event.defaultPrevented || disposed)
        return; value = native()?.value || ""; active = selectedIndex(); invalid = open = false; draw(); }, 0); }
    function onWindowBlur() { if (open)
        close(false); }
    value = native()?.value || "";
    rememberLabels();
    draw();
    const form = native()?.form || root.closest("form");
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("change", onChange);
    root.addEventListener("invalid", onInvalid, true);
    document.addEventListener("pointerdown", onOutside, true);
    window.addEventListener("blur", onWindowBlur);
    form?.addEventListener("formdata", onFormData);
    form?.addEventListener("reset", onReset); // Działa także, gdy Framer zastąpi warstwy podczas zmiany wariantu.
    const observer = new MutationObserver(refresh);
    observer.observe(root, {
        childList: true, subtree: true
    });
    return {
        refresh, destroy() { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); window.clearTimeout(resetTimer); root.removeEventListener("click", onClick); root.removeEventListener("pointerdown", onPointerDown); root.removeEventListener("pointermove", onPointerMove); root.removeEventListener("keydown", onKeyDown); root.removeEventListener("focusout", onFocusOut); root.removeEventListener("change", onChange); root.removeEventListener("invalid", onInvalid, true); document.removeEventListener("pointerdown", onOutside, true); window.removeEventListener("blur", onWindowBlur); form?.removeEventListener("formdata", onFormData); form?.removeEventListener("reset", onReset); original.forEach((attributes, node) => attributes.forEach((previous, name) => { if (previous === null)
            node.removeAttribute(name);
        else
            node.setAttribute(name, previous); })); }
    };
}
const accessibilityStyles = `
[data-fragment-native-select] { pointer-events: none !important; }
[data-fragment-select-list][aria-hidden="true"] { pointer-events: none !important; }
[data-fragment-select-trigger]:focus-visible {
    outline: 2px solid var(--fragment-select-focus-color, #c9d0d2) !important;
    outline-offset: 3px;
}
[data-fragment-option-active="true"] {
    outline: 2px solid var(--fragment-select-focus-color, #c9d0d2) !important;
    outline-offset: -3px;
}
`;
export function CustomFormSelect(Component) { return /*#__PURE__*/ forwardRef((props, forwardedRef) => { const rootRef = useRef(null); const controller = useRef(null); const [variant, setVariant] = useState(); const id = `fragment-select-${useId().replace(/:/g, "")}`; const setRefs = useCallback(node => { rootRef.current = node; if (typeof forwardedRef === "function")
    forwardedRef(node);
else if (forwardedRef)
    forwardedRef.current = node; }, [forwardedRef]); useEffect(() => { if (!rootRef.current)
    return; const connected = connectSelect(rootRef.current, id, setVariant); controller.current = connected; return () => { connected.destroy(); controller.current = null; }; }, [id]); useEffect(() => { controller.current?.refresh(); }); return /*#__PURE__*/ _jsxs(_Fragment, {
    children: [/*#__PURE__*/ _jsx("style", {
            children: accessibilityStyles
        }), /*#__PURE__*/ _jsx(Component, {
            ...props, ref: setRefs, ...variant ? {
                variant
            } : {}
        })]
}); }); }
export const __FramerMetadata__ = {
    "exports": {
        "CustomFormSelect": {
            "type": "reactHoc", "name": "CustomFormSelect", "annotations": {
                "framerContractVersion": "1"
            }
        }, "__FramerMetadata__": {
            "type": "variable"
        }
    }
};
//# sourceMappingURL=./form_select.map
