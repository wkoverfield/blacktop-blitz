import { useEffect, useRef } from "react";

/**
 * Roving-tabindex keyboard navigation — packet 003.
 *
 * Screens mark navigable elements with data-kbnav="<row>" (a number; items
 * sharing a row are ordered left→right by DOM order). The hook re-scans the
 * DOM on every keypress (so dynamic UIs — advanced filters, rerolled cards —
 * stay correct), moves REAL focus with the arrow keys, and keeps exactly one
 * item in the Tab order (tabindex 0 on the current item, -1 elsewhere).
 *
 * Key contract (packet 003 acceptance 1-7):
 *  - Up/Down move between rows (wrapping); Left/Right move within a row.
 *    If the screen has a single row, Up/Down fall back to Left/Right (About).
 *  - Enter activates natively on buttons/links/inputs; for non-native widgets
 *    (draft card bodies) the hook synthesizes a click().
 *  - Text entry is NEVER hijacked: textareas keep every key (Esc blurs);
 *    plain text inputs keep Left/Right/Enter (caret stays native) but
 *    Up/Down still walk rows; selects keep everything (Esc blurs out).
 *  - Number wells marked data-kbstep get Left/Right = decrement/increment
 *    (0-99), dispatched through the native setter so React onChange fires.
 *  - When nothing navigable exists, no key is preventDefault-ed (page
 *    scroll etc. keeps working).
 *
 * `onEscape` (optional): fired on Esc when focus is NOT inside a text
 * control — the Draft screen uses it to exit like the X button.
 */

const VERTICAL = ["ArrowUp", "ArrowDown"];
const HORIZONTAL = ["ArrowLeft", "ArrowRight"];
const NATIVE_ACTIVATE = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"];
const NON_TEXT_INPUT_TYPES = ["checkbox", "radio", "button", "submit", "range"];

function scan() {
  const els = Array.from(document.querySelectorAll("[data-kbnav]")).filter(
    (el) =>
      !el.disabled &&
      el.getAttribute("aria-disabled") !== "true" &&
      el.getClientRects().length > 0
  );
  const rows = new Map();
  for (const el of els) {
    const row = Number(el.getAttribute("data-kbnav")) || 0;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(el);
  }
  const order = [...rows.keys()].sort((a, b) => a - b);
  return { rows, order, all: els };
}

/** Step a controlled numeric well through React's onChange. */
function stepNumber(input, delta) {
  const cur = parseInt(input.value, 10);
  const base = Number.isNaN(cur) ? 0 : cur;
  const next = Math.max(0, Math.min(99, base + delta));
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(input, String(next));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyRoving(all, current) {
  for (const el of all) el.tabIndex = el === current ? 0 : -1;
}

export default function useKeyboardNav({ onEscape } = {}) {
  const lastRef = useRef(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    // Initial roving state: first navigable item is the single Tab stop.
    const initial = scan();
    if (initial.all.length > 0) applyRoving(initial.all, initial.all[0]);

    const focusEl = (el, all) => {
      applyRoving(all, el);
      lastRef.current = el;
      el.focus();
    };

    const onFocusIn = (e) => {
      if (e.target instanceof Element && e.target.hasAttribute("data-kbnav")) {
        lastRef.current = e.target;
        applyRoving(scan().all, e.target);
      }
    };

    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;

      const a = document.activeElement;
      const tag = a ? a.tagName : null;
      const isTextInput =
        tag === "INPUT" && !NON_TEXT_INPUT_TYPES.includes(a.type);
      const isTextArea = tag === "TEXTAREA";
      const isSelect = tag === "SELECT";

      if (e.key === "Escape") {
        if (isTextInput || isTextArea || isSelect) {
          e.preventDefault();
          a.blur(); // back to nav mode; lastRef keeps the position
          return;
        }
        if (escapeRef.current) {
          e.preventDefault();
          escapeRef.current();
        }
        return;
      }

      if (isTextArea || isSelect) return; // fully native (contract 5)
      if (a && a.isContentEditable) return;

      if (isTextInput) {
        if (HORIZONTAL.includes(e.key)) {
          if (!a.hasAttribute("data-kbstep")) return; // native caret movement
          e.preventDefault();
          stepNumber(a, e.key === "ArrowRight" ? 1 : -1);
          return;
        }
        if (e.key === "Enter") return; // native
        // Up/Down fall through to row navigation.
      }

      if (e.key === "Enter") {
        if (!a || !a.hasAttribute?.("data-kbnav")) return;
        if (NATIVE_ACTIVATE.includes(tag)) return; // browser fires click
        e.preventDefault();
        a.click(); // non-native widget (draft card body)
        return;
      }

      if (!VERTICAL.includes(e.key) && !HORIZONTAL.includes(e.key)) return;

      const grid = scan();
      if (grid.order.length === 0) return; // nothing navigable — don't hijack

      // Current position: focused nav item, else the last one we visited
      // (still valid), else enter the map at the first item.
      let cur =
        a && a.hasAttribute?.("data-kbnav") && grid.all.includes(a) ? a : null;
      if (!cur && lastRef.current && grid.all.includes(lastRef.current)) {
        cur = lastRef.current;
      }
      if (!cur) {
        e.preventDefault();
        focusEl(grid.all[0], grid.all);
        return;
      }

      const curRow = Number(cur.getAttribute("data-kbnav")) || 0;
      const rowEls = grid.rows.get(curRow);
      const colIdx = Math.max(0, rowEls.indexOf(cur));

      // Single-row screens: Up/Down behave like Left/Right (About CTAs).
      const horizontal =
        HORIZONTAL.includes(e.key) ||
        (grid.order.length === 1 && VERTICAL.includes(e.key));

      let target;
      if (horizontal) {
        const d =
          e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
        target = rowEls[Math.max(0, Math.min(rowEls.length - 1, colIdx + d))];
      } else {
        const d = e.key === "ArrowDown" ? 1 : -1;
        const rowIdx = grid.order.indexOf(curRow);
        const nextRow =
          grid.order[(rowIdx + d + grid.order.length) % grid.order.length];
        const targets = grid.rows.get(nextRow);
        target = targets[Math.min(colIdx, targets.length - 1)];
      }

      e.preventDefault();
      if (target && target !== document.activeElement) {
        focusEl(target, grid.all);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
