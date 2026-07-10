import React from "react";
import { useTimeOfDay } from "../hooks/useTimeOfDay";

/**
 * Fixed top-right time-of-day chip, e.g. "DUSK · AUTO". Click cycles
 * sunrise -> midday -> dusk -> night -> AUTO. Rendered on every screen
 * except Draft (each screen mounts it itself).
 *
 * Mobile (<=640px): drops the " · AUTO" suffix, 8px font, 8x10px padding.
 */
export default function ClockChip() {
  const { slot, isAuto, cycle } = useTimeOfDay();

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Change time of day"
      className="fixed right-4 top-4 z-40 select-none font-press text-[8px] sm:text-[10px] text-cream bg-[rgba(23,13,42,0.75)] px-[10px] py-2 sm:px-[14px] sm:py-[10px] shadow-[0_0_0_3px_rgba(253,243,221,0.5)] hover:shadow-[0_0_0_3px_#ffb066]"
    >
      {slot.toUpperCase()}
      {isAuto && <span className="hidden sm:inline"> · AUTO</span>}
    </button>
  );
}
