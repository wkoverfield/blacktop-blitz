import { useCallback, useEffect, useState } from "react";

/**
 * Time-of-day system (spec: docs/context/design-handoff-retro.md).
 *
 * Auto mode maps the local clock to a slot: 5-9 sunrise, 9-17 midday,
 * 17-21 dusk, else night. Clicking the ClockChip cycles a manual override
 * sunrise -> midday -> dusk -> night -> back to AUTO; the override persists
 * in localStorage. Panel skin: light for sunrise/midday, dark for dusk/night.
 *
 * The hook is used by several independent components (App wrapper,
 * CourtBackdrop, ClockChip), so override changes are broadcast via a window
 * event (plus the native `storage` event for cross-tab sync) to keep every
 * instance in lockstep.
 */

const STORAGE_KEY = "blacktop-blitz-tod-override";
const CHANGE_EVENT = "bb-tod-override-change";
const ORDER = ["sunrise", "midday", "dusk", "night"];

function autoSlot(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "sunrise";
  if (h >= 9 && h < 17) return "midday";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

function readOverride() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return ORDER.includes(v) ? v : null;
  } catch {
    return null;
  }
}

function writeOverride(value) {
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    /* private-mode etc. — override just won't persist */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTimeOfDay() {
  const [override, setOverride] = useState(readOverride);
  const [auto, setAuto] = useState(autoSlot);

  // Minute tick keeps auto mode tracking the clock.
  useEffect(() => {
    const timer = setInterval(() => setAuto(autoSlot()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Stay in sync with other hook instances (and other tabs).
  useEffect(() => {
    const sync = () => setOverride(readOverride());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // sunrise -> midday -> dusk -> night -> AUTO (null)
  const cycle = useCallback(() => {
    const current = readOverride();
    const idx = current === null ? -1 : ORDER.indexOf(current);
    const next = idx + 1 < ORDER.length ? ORDER[idx + 1] : null;
    writeOverride(next);
  }, []);

  const slot = override ?? auto;
  const skin = slot === "sunrise" || slot === "midday" ? "light" : "dark";

  return { slot, skin, isAuto: override === null, cycle };
}

// Canonical import is the named export above (per the packet interface).
// Default export kept as a compatibility alias for consumers that import
// `useTimeOfDay` as a default.
export default useTimeOfDay;
